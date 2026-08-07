import asyncio
import uuid
from collections.abc import AsyncGenerator, Coroutine, Sequence
from functools import partial
from typing import Any

import logfire
from pydantic import BaseModel
from pydantic_ai import UnexpectedModelBehavior
from pydantic_ai.agent import AgentRunResult
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    ErrorChunk,
    TextDeltaChunk,
)
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.harness import context
from app.harness.agent import compact_threshold, model_for, tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import (
    LimitExceeded,
    check_cost_ceiling,
    check_run_allowed,
    spend_memory_write,
)
from app.harness.prompts import ContextBlock, Medium, RunKind, assemble
from app.harness.repository import HarnessRepository, Role
from app.harness.title import retitle
from app.harness.usage import usage_row
from app.memory import repository as memory
from app.memory.repository import Recollection
from app.models import Chat
from app.telegram.outbox import Outbox


class RunBusy(Exception):
    pass


# asyncio holds only a weak reference to a running task, and this one outlives
# the request that started it.
_drains: set[asyncio.Task[None]] = set()


def _finished(task: asyncio.Task[None]) -> None:
    """A drain that died has nobody to raise to: the request it started under
    returned long ago, so the traceback is only ever seen if it is logged."""
    _drains.discard(task)
    if not task.cancelled() and task.exception() is not None:
        logfire.error("the drain of a chat run died", _exc_info=task.exception())


def _prompt_text(messages: Sequence[ModelMessage]) -> str:
    for message in messages:
        for part in message.parts:
            if isinstance(part, UserPromptPart) and isinstance(part.content, str):
                return part.content
    return ""


def _prefix(messages: Sequence[ModelMessage], block: str) -> None:
    """Put a block above the learner's question, in place.

    The message is prefixed before it is stored, so what the run was given and
    what the panel replays after a reload are the same string — and so the
    fence around quoted material is written here, by the server, rather than by
    a client that could leave it off.
    """
    for message in messages:
        for part in message.parts:
            if isinstance(part, UserPromptPart) and isinstance(part.content, str):
                part.content = f"{block}\n\n{part.content}"
                return


def _model(chat: Chat, run_kind: RunKind) -> OpenRouterModel:
    """Which model answers. The learner's choice is theirs for the dialogue
    they are having; a run the platform starts by itself — a review, a
    proactive message, a compaction — is the instance's own spending and goes
    to the default, whatever the chat was last switched to (#10)."""
    return model_for(chat.model if run_kind == "chat" else settings.DEFAULT_CHAT_MODEL)


class Compaction(BaseModel):
    """What a compaction returns: the summary that replaces the history, and
    what the conversation turned out to be worth remembering about the
    learner. Compaction is where everything they said is in front of the model
    at once, which is the moment a profile is worth revising."""

    summary: str
    memories: list[Recollection] = []


async def _compacted(
    repo: HarnessRepository,
    chat: Chat,
    history: Sequence[ModelMessage],
    medium: Medium,
) -> tuple[Compaction, RunUsage]:
    """The summary, and what the conversation turned out to be worth
    remembering — retried as a summary alone when the memories will not
    validate.

    The summary is what the chat continues on, so it must not depend on the
    memory pass: a description one character over its bound or a slug with an
    underscore would otherwise spend the retries and take the learner's turn
    down with it.
    """
    model = _model(chat, "compact")
    deps = HarnessDeps(repo=repo, chat=chat)
    # The index comes along so a candidate can reuse a slug: that is what
    # makes this pass consolidate the profile instead of growing it.
    instructions = assemble(medium, "compact", await context.memory_index(repo))
    try:
        both = await tutor.run(
            message_history=history,
            model=model,
            deps=deps,
            instructions=instructions,
            output_type=Compaction,
        )
        return both.output, both.usage
    except UnexpectedModelBehavior:
        summary_only = await tutor.run(
            message_history=history,
            model=model,
            deps=deps,
            instructions=instructions,
            output_type=str,
        )
        return Compaction(summary=summary_only.output), summary_only.usage


async def summarize(
    repo: HarnessRepository, chat: Chat, *, medium: Medium = "web"
) -> str:
    """Replace the history with a summary of it. The caller holds the claim."""
    history = await repo.history(chat)
    if not history:
        return ""
    compaction, usage = await _compacted(repo, chat, history, medium)
    await repo.add_messages(
        chat,
        # Stored as a request, not as a response: the next run must read the
        # summary as context it was given, not as words it once said.
        [
            ModelRequest(
                parts=[
                    UserPromptPart(
                        content=f"Summary of the conversation so far:\n\n{compaction.summary}"
                    )
                ]
            )
        ],
        role="system",
        marker="compact",
        usage=usage_row(usage),
    )
    # A compaction is a run, so what it may write about the learner comes out
    # of the same allowance `save_memory` spends from — and out of what this
    # run has already spent there, which is why the count is the run's own.
    for candidate in compaction.memories:
        try:
            spend_memory_write(usage)
        except LimitExceeded:
            break
        await memory.save(repo.session, repo.user_id, candidate, source="agent")
    return compaction.summary


async def compact(
    repo: HarnessRepository, chat: Chat, *, medium: Medium = "web"
) -> str:
    await check_cost_ceiling(repo.session)
    run_id = uuid.uuid4()
    if not await repo.claim_run(chat, run_id):
        raise RunBusy
    try:
        return await summarize(repo, chat, medium=medium)
    finally:
        await repo.release_run(chat, run_id)


async def _open_run(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    user_messages: Sequence[ModelMessage],
    medium: Medium,
    role: Role,
) -> list[ModelMessage]:
    if not await repo.claim_run(chat, run_id):
        raise RunBusy
    try:
        if await repo.context_tokens(chat) >= compact_threshold(chat.model):
            await summarize(repo, chat, medium=medium)
        history = await repo.history(chat)
        await repo.add_messages(chat, user_messages, role=role, run_id=run_id)
        # A chat is named after the learner's first question, never after a
        # prompt the platform wrote for itself.
        if (
            role == "user"
            and chat.title is None
            and (prompt := _prompt_text(user_messages))
        ):
            await repo.set_title(chat, prompt)
    except Exception:
        # Nothing is in flight, so the chat must not stay claimed until the
        # deadline releases it.
        await repo.release_run(chat, run_id)
        raise
    return history


async def _close_run(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    *,
    result: AgentRunResult[str] | None,
    partial_text: str,
    failure: str | None,
) -> None:
    if result is not None:
        # The user turn went into the history the run was given, so everything
        # `new_messages` holds was produced by this run.
        await repo.add_messages(
            chat,
            result.new_messages(),
            role="agent",
            run_id=run_id,
            usage=usage_row(result.usage),
        )
    elif partial_text:
        # A run that died mid-stream still stores what the learner already saw.
        await repo.add_messages(
            chat,
            [ModelResponse(parts=[TextPart(content=partial_text)])],
            role="agent",
            run_id=run_id,
        )
    if failure is not None:
        await repo.fail_run(chat, run_id, failure)


async def _guarded(
    work: Coroutine[Any, Any, None], failure: str, run_id: uuid.UUID
) -> None:
    """Cleanup that must not raise.

    All of it runs after the run is over, on a session that may be in a failed
    transaction and against a database that may be briefly down. An exception
    from any one step would leave the rest undone — the chat claimed for its
    full TTL, the client's stream never terminated — so each step is reported
    and the next one still runs.
    """
    try:
        await work
    except Exception:
        logfire.exception(failure, run_id=str(run_id))


async def _close_safely(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    *,
    result: AgentRunResult[str] | None,
    partial_text: str,
    failure: str | None,
) -> None:
    """Store the turn whatever state the run left behind.

    A run that died inside a tool leaves its session in a failed transaction,
    where every further statement raises until it is rolled back — including the
    ones that store what the learner already saw. The rollback comes only after
    a first attempt has failed: on the ordinary path there is nothing to roll
    back, and what the run's tools committed must not be undone.
    """
    store = partial(
        _close_run,
        repo,
        chat,
        run_id,
        result=result,
        partial_text=partial_text,
        failure=failure,
    )
    try:
        await store()
        return
    except Exception:
        logfire.exception(
            "storing the turn of run {run_id} failed; retrying on a clean session",
            run_id=str(run_id),
        )
    await _guarded(repo.session.rollback(), "rolling back run {run_id} failed", run_id)
    await _guarded(store(), "storing the turn of run {run_id} failed", run_id)


async def run(
    repo: HarnessRepository,
    chat: Chat,
    prompt: str,
    *,
    medium: Medium = "telegram",
    run_kind: RunKind = "chat",
    blocks: tuple[ContextBlock, ...] = (),
    outbox: Outbox | None = None,
) -> str:
    """Non-streaming run, for Telegram and for scheduled work."""
    # A run the learner asked for spends their daily allowance; one the
    # platform starts by itself spends only the budget, and its prompt is
    # stored as the platform's, so it is not counted against them either.
    role: Role = "user" if run_kind == "chat" else "system"
    if run_kind == "chat":
        await check_run_allowed(repo)
    else:
        await check_cost_ceiling(repo.session)
    run_id = uuid.uuid4()
    user_message = ModelRequest(parts=[UserPromptPart(content=prompt)])
    history = await _open_run(repo, chat, run_id, [user_message], medium, role)
    deps = HarnessDeps(repo=repo, chat=chat, outbox=outbox)
    try:
        result = await tutor.run(
            message_history=[*history, user_message],
            model=_model(chat, run_kind),
            deps=deps,
            instructions=assemble(
                medium, run_kind, await context.blocks(repo, extra=blocks)
            ),
            run_id=str(run_id),
        )
        # Before the turn is stored, so what naming spends is added to the run's
        # usage and rides the row `_close_run` writes it on — the row the
        # monthly ceiling is summed from.
        await _guarded(
            retitle(repo, chat, result.usage),
            "renaming the chat after run {run_id} failed",
            run_id,
        )
        await _close_run(
            repo, chat, run_id, result=result, partial_text="", failure=None
        )
    except Exception as exc:
        await _close_safely(
            repo, chat, run_id, result=None, partial_text="", failure=str(exc)
        )
        raise
    finally:
        # Never the reason a caller sees a different exception: the claim is
        # released by its deadline anyway, and the run's own failure is the one
        # worth reporting.
        await _guarded(
            repo.release_run(chat, run_id), "releasing run {run_id} failed", run_id
        )
    return result.output


async def _drain(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    user_id: uuid.UUID,
    chat_id: uuid.UUID,
    run_id: uuid.UUID,
    adapter: VercelAIAdapter[HarnessDeps, str],
    history: list[ModelMessage],
    current_locator: str | None,
    queue: asyncio.Queue[BaseChunk | None],
) -> None:
    try:
        async with session_factory() as session:
            repo = HarnessRepository(session, user_id)
            chat = await repo.get_chat(chat_id)
            if chat is None:
                return
            deps = HarnessDeps(repo=repo, chat=chat, current_locator=current_locator)
            result: AgentRunResult[str] | None = None
            text: list[str] = []
            failure: str | None = None

            def capture(completed: AgentRunResult[str]) -> None:
                nonlocal result
                result = completed

            try:
                instructions = assemble(
                    "web",
                    "chat",
                    await context.blocks(repo, current_locator=current_locator),
                )
                async for chunk in adapter.run_stream(
                    message_history=history,
                    deps=deps,
                    model=_model(chat, "chat"),
                    instructions=instructions,
                    run_id=str(run_id),
                    on_complete=capture,
                ):
                    queue.put_nowait(chunk)
                    if isinstance(chunk, TextDeltaChunk):
                        text.append(chunk.delta)
                    elif isinstance(chunk, ErrorChunk):
                        failure = chunk.error_text
            except Exception as exc:
                # The adapter turns a failure inside the stream into an
                # ErrorChunk; one raised before the stream exists — building the
                # model, reading the prompt modules — has to reach the client
                # from here.
                failure = str(exc)
                queue.put_nowait(ErrorChunk(error_text=failure))
            finally:
                # Before the turn is stored, so the naming spend rides the
                # usage row `_close_safely` writes; and well before the queue
                # is terminated below, since the panel asks for the chat's name
                # the moment the stream closes and a rename that lands after
                # that is one the reader does not see until their next message.
                if result is not None and failure is None:
                    await _guarded(
                        retitle(repo, chat, result.usage),
                        "renaming the chat after run {run_id} failed",
                        run_id,
                    )
                await _close_safely(
                    repo,
                    chat,
                    run_id,
                    result=result,
                    partial_text="".join(text),
                    failure=failure,
                )
                await _guarded(
                    repo.release_run(chat, run_id),
                    "releasing run {run_id} failed",
                    run_id,
                )
    finally:
        # Outside everything: the client is reading this queue, and a stream
        # that is never terminated hangs the browser for as long as it waits.
        # By here the run is over and what it produced has been stored.
        queue.put_nowait(None)


async def _relay(queue: asyncio.Queue[BaseChunk | None]) -> AsyncGenerator[BaseChunk]:
    while (chunk := await queue.get()) is not None:
        yield chunk


async def start_stream(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
    adapter: VercelAIAdapter[HarnessDeps, str],
    current_locator: str | None = None,
    quotes: str | None = None,
) -> AsyncGenerator[BaseChunk]:
    """Start the run and hand back the client's view of it.

    The run is a task of its own, with its own session: a client that walks
    away mid-stream stops reading the queue, and the run keeps going to
    completion and persistence anyway.
    """
    await check_run_allowed(repo)
    run_id = uuid.uuid4()
    # A Vercel AI client posts the whole conversation it holds. The history a
    # run is given comes from the database and from nowhere else, so only the
    # message just submitted is taken from the request.
    adapter.run_input.messages = adapter.run_input.messages[-1:]
    user_messages = adapter.sanitize_messages(adapter.messages)
    if quotes is not None:
        _prefix(user_messages, quotes)
    history = await _open_run(repo, chat, run_id, user_messages, "web", "user")
    queue: asyncio.Queue[BaseChunk | None] = asyncio.Queue()
    task = asyncio.create_task(
        _drain(
            session_factory=session_factory,
            user_id=repo.user_id,
            chat_id=chat.id,
            run_id=run_id,
            adapter=adapter,
            history=history,
            current_locator=current_locator,
            queue=queue,
        )
    )
    _drains.add(task)
    task.add_done_callback(_finished)
    return _relay(queue)
