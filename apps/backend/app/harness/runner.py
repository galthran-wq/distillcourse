import asyncio
import uuid
from collections.abc import AsyncGenerator, Coroutine, Sequence
from dataclasses import dataclass, field, replace
from functools import partial
from itertools import groupby
from typing import Any

import logfire
from pydantic import BaseModel
from pydantic_ai import UnexpectedModelBehavior, capture_run_messages
from pydantic_ai.agent import AgentRunResult
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    ToolCallPart,
    UserPromptPart,
)
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    DataChunk,
    ErrorChunk,
    FinishChunk,
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
from app.harness.steering import Steering, SteerMessage, is_steer
from app.harness.title import retitle
from app.harness.usage import usage_row
from app.labs import tools as lab_tools
from app.memory import repository as memory
from app.memory.repository import Recollection
from app.models import Chat
from app.telegram.outbox import Outbox


class RunBusy(Exception):
    pass


@dataclass
class _Run:
    """A streamed run while it is in flight, as the stop and steer requests
    reach it.

    `drain` is the whole of it, storing the turn and freeing the chat included;
    `stream` is only the agent's part, and is the one a stop cancels — what
    comes after it must run to the end whatever ended the answer.
    """

    steering: Steering
    drain: asyncio.Task[None] | None = None
    stream: asyncio.Task[tuple[AgentRunResult[str] | None, str | None]] | None = None
    stopped: bool = False
    # Set once the turn is stored and the chat free — or once the run failed
    # to open, which leaves neither to do.
    over: asyncio.Event = field(default_factory=asyncio.Event)


# In-process: the API is one process (`--workers 1`, apps/backend/Dockerfile),
# and a run is only ever stopped or steered from the web, whose runs all start
# here.
_runs: dict[uuid.UUID, _Run] = {}

# asyncio holds only a weak reference to a running task, and a detached one
# outlives the request that started it.
_detached: set[asyncio.Task[None]] = set()


def _finished(task: asyncio.Task[None]) -> None:
    """A detached run that died has nobody to raise to: the request it started
    under returned long ago, so the traceback is only ever seen if it is
    logged."""
    _detached.discard(task)
    if not task.cancelled() and task.exception() is not None:
        logfire.error("a detached run died", _exc_info=task.exception())


def _unregister(run_id: uuid.UUID, _task: asyncio.Task[None]) -> None:
    run = _runs.pop(run_id, None)
    if run is not None:
        run.over.set()


async def stop(run_id: uuid.UUID | None) -> None:
    """Cancel the answer and wait until the turn is stored and the chat free,
    so the learner's next message finds it unclaimed. Nothing in flight is
    not an error: the click can race the run's own end."""
    if run_id is None:
        return
    run = _runs.get(run_id)
    if run is None:
        # Usually the race above; a run held by another process looks the same,
        # and this line is the only trace that one ever did.
        logfire.warning("stop for a run this process does not hold", run_id=str(run_id))
        return
    run.stopped = True
    if run.stream is not None:
        run.stream.cancel()
    await run.over.wait()


def steer(run_id: uuid.UUID | None, message: SteerMessage) -> bool:
    run = _runs.get(run_id) if run_id is not None else None
    return run is not None and run.steering.offer(message)


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


def _model(
    chat: Chat, run_kind: RunKind, *, reasoning: bool = False
) -> OpenRouterModel:
    """Which model answers. The learner's choice is theirs for the dialogue
    they are having; a run the platform starts by itself — a review, a
    proactive message, a compaction — is the instance's own spending and goes
    to the default, whatever the chat was last switched to (#10).

    `reasoning` is asked for only by the web streaming path, the one place a
    trace has a dropdown to land in; everywhere else it stays off so its tokens
    are not billed for nothing."""
    return model_for(
        chat.model if run_kind == "chat" else settings.DEFAULT_CHAT_MODEL,
        reasoning=reasoning,
    )


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
    prompt: str,
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
        if role == "user" and chat.title is None and prompt:
            await repo.set_title(chat, prompt)
    except Exception:
        # Nothing is in flight, so the chat must not stay claimed until the
        # deadline releases it.
        await repo.release_run(chat, run_id)
        raise
    return history


def _settled(unfinished: Sequence[ModelMessage]) -> list[ModelMessage]:
    """What a run that died or was stopped had produced, in a form the next
    run can be given.

    A response cut off mid-stream keeps its text, which the learner saw, and
    loses its tool calls, whose arguments may be cut off with it; the library
    closes out a call left without a return by itself.
    """
    kept: list[ModelMessage] = []
    for message in unfinished:
        if isinstance(message, ModelResponse) and message.state == "interrupted":
            message = replace(
                message,
                parts=[p for p in message.parts if not isinstance(p, ToolCallPart)],
            )
        if message.parts:
            kept.append(message)
    return kept


async def _close_run(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    *,
    result: AgentRunResult[str] | None,
    unfinished: Sequence[ModelMessage],
    usage: RunUsage | None,
    failure: str | None,
) -> None:
    # The user turn went into the history the run was given, so everything
    # `new_messages` holds was produced by this run — and so is an unfinished one,
    # which is what a run that died or was stopped still stores of what the
    # learner already saw.
    produced = result.new_messages() if result is not None else _settled(unfinished)
    # What an unfinished run spent is spent all the same — the caps and the
    # ceiling are sums over these rows, and a stop must not be a way past them.
    spent = result.usage if result is not None else usage
    # A steer is the learner's, stored as theirs between the model messages it
    # came between, and counted like any other message they send.
    turns = [(steer, list(group)) for steer, group in groupby(produced, key=is_steer)]
    for index, (steer, messages) in enumerate(turns):
        last = index == len(turns) - 1
        await repo.add_messages(
            chat,
            messages,
            role="user" if steer else "agent",
            run_id=run_id,
            usage=usage_row(spent) if last and spent is not None else None,
        )
    if failure is not None:
        await repo.fail_run(chat, run_id, failure)


async def guarded(
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
    unfinished: Sequence[ModelMessage],
    usage: RunUsage | None,
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
        unfinished=unfinished,
        usage=usage,
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
    await guarded(repo.session.rollback(), "rolling back run {run_id} failed", run_id)
    await guarded(store(), "storing the turn of run {run_id} failed", run_id)


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
    history = await _open_run(repo, chat, run_id, [user_message], medium, role, prompt)
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
        await _close_run(
            repo, chat, run_id, result=result, unfinished=(), usage=None, failure=None
        )
    except Exception as exc:
        await _close_safely(
            repo,
            chat,
            run_id,
            result=None,
            unfinished=(),
            usage=None,
            failure=str(exc),
        )
        raise
    finally:
        # Never the reason a caller sees a different exception: the claim is
        # released by its deadline anyway, and the run's own failure is the one
        # worth reporting.
        await guarded(
            repo.release_run(chat, run_id), "releasing run {run_id} failed", run_id
        )
    return result.output


def _announce_unused(
    steering: Steering, queue: asyncio.Queue[BaseChunk | None]
) -> None:
    unused = steering.close()
    if unused:
        queue.put_nowait(
            DataChunk(
                type="data-steer-unused",
                data={"ids": [str(steer.id) for steer in unused]},
                transient=True,
            )
        )


async def _store_and_release(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    *,
    result: AgentRunResult[str] | None,
    unfinished: Sequence[ModelMessage],
    usage: RunUsage,
    failure: str | None,
) -> None:
    await _close_safely(
        repo,
        chat,
        run_id,
        result=result,
        unfinished=unfinished,
        usage=usage,
        failure=failure,
    )
    await guarded(
        repo.release_run(chat, run_id), "releasing run {run_id} failed", run_id
    )


def _produced(
    messages: Sequence[ModelMessage], run_id: uuid.UUID
) -> list[ModelMessage]:
    """What a run added to the messages the agent keeps, cut short or not.

    Everything the run makes is stamped with its id — its steers by
    `Steering.take` — and so is the learner's question once it is sent; that
    one was stored when the run opened, and is the request with a prompt in it
    that is not a steer.
    """
    return [
        message
        for message in messages
        if message.run_id == str(run_id)
        and not (
            isinstance(message, ModelRequest)
            and not is_steer(message)
            and any(isinstance(part, UserPromptPart) for part in message.parts)
        )
    ]


async def _stream(
    *,
    repo: HarnessRepository,
    deps: HarnessDeps,
    run_id: uuid.UUID,
    adapter: VercelAIAdapter[HarnessDeps, str],
    history: list[ModelMessage],
    current_locator: str | None,
    medium: Medium,
    usage: RunUsage,
    queue: asyncio.Queue[BaseChunk | None],
) -> tuple[AgentRunResult[str] | None, str | None]:
    """The agent's part of a dialogue run, chunk by chunk onto the client's queue:
    what it completed with, and what it failed with."""
    result: AgentRunResult[str] | None = None
    failure: str | None = None

    def capture(completed: AgentRunResult[str]) -> None:
        nonlocal result
        result = completed

    # A lab chat is the same conversation from the notebook and from the site,
    # so what makes it a lab's — the lab prompt and the lab tools — follows the
    # chat, not the medium it is continued in.
    lab = deps.chat.kind == "lab"
    try:
        instructions = assemble(
            medium,
            "chat",
            await context.blocks(
                repo,
                current_locator=current_locator,
                extra=(lab_tools.briefing(deps.chat),) if lab else (),
            ),
        )
        async for chunk in adapter.run_stream(
            message_history=history,
            deps=deps,
            # The web dialogue is the only run whose client shows a reasoning
            # trace, so it is the only one that asks for one.
            model=_model(deps.chat, "chat", reasoning=medium == "web"),
            instructions=instructions,
            run_id=str(run_id),
            # Handed in rather than read off the result, which a stopped run
            # never has: the run counts into this one as it goes.
            usage=usage,
            on_complete=capture,
            toolsets=[lab_tools.toolset] if lab else None,
        ):
            # The run has made its last request: a steer that has not been taken
            # by now never will be, and goes back to the client ahead of the
            # finish, to be sent as a turn.
            if isinstance(chunk, FinishChunk) and deps.steering is not None:
                _announce_unused(deps.steering, queue)
            queue.put_nowait(chunk)
            if isinstance(chunk, ErrorChunk):
                failure = chunk.error_text
    except Exception as exc:
        # The adapter turns a failure inside the stream into an ErrorChunk; one
        # raised before the stream exists — building the model, reading the
        # prompt modules — has to reach the client from here.
        failure = str(exc)
        queue.put_nowait(ErrorChunk(error_text=failure))
    return result, failure


async def _drain(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    user_id: uuid.UUID,
    chat_id: uuid.UUID,
    run_id: uuid.UUID,
    run: _Run,
    adapter: VercelAIAdapter[HarnessDeps, str],
    history: list[ModelMessage],
    current_locator: str | None,
    medium: Medium,
    queue: asyncio.Queue[BaseChunk | None],
) -> None:
    async with session_factory() as session:
        repo = HarnessRepository(session, user_id)
        chat: Chat | None = None
        result: AgentRunResult[str] | None = None
        failure: str | None = None
        try:
            chat = await repo.get_chat(chat_id)
            if chat is None:
                return
            deps = HarnessDeps(
                repo=repo,
                chat=chat,
                current_locator=current_locator,
                steering=run.steering,
            )
            usage = RunUsage()
            with capture_run_messages() as messages:
                try:
                    run.stream = asyncio.create_task(
                        _stream(
                            repo=repo,
                            deps=deps,
                            run_id=run_id,
                            adapter=adapter,
                            history=history,
                            current_locator=current_locator,
                            medium=medium,
                            usage=usage,
                            queue=queue,
                        )
                    )
                    if run.stopped:
                        run.stream.cancel()
                    # Waited on rather than awaited: a stop cancels the stream,
                    # and that must not cancel this task with it.
                    await asyncio.wait([run.stream])
                    if not run.stream.cancelled():
                        result, failure = run.stream.result()
                finally:
                    # A stopped or failed run sent no finish to announce them
                    # ahead of; nothing is waiting for them on a stopped one,
                    # but the steers still have to be refused from here on.
                    _announce_unused(run.steering, queue)
                    unfinished = _produced(messages, run_id)
                    if run.stream is not None and run.stream.cancelled():
                        # A stop can land while a tool's statement is in flight
                        # on this session, which leaves it unusable — rolling it
                        # back expires the chat too. The turn is stored and the
                        # chat freed from a session the stop never touched.
                        async with session_factory() as clean:
                            fresh = HarnessRepository(clean, user_id)
                            await _store_and_release(
                                fresh,
                                await fresh.get_chat(chat_id) or chat,
                                run_id,
                                result=result,
                                unfinished=unfinished,
                                usage=usage,
                                failure=failure,
                            )
                    else:
                        await _store_and_release(
                            repo,
                            chat,
                            run_id,
                            result=result,
                            unfinished=unfinished,
                            usage=usage,
                            failure=failure,
                        )
                    run.over.set()
        finally:
            # The client is reading this queue and holds the learner's next
            # turn until it ends, so nothing above may be skipped and nothing
            # below may be waited on: by here the turn is stored and the chat
            # is free, which is everything the learner's next message needs.
            queue.put_nowait(None)
        if chat is not None and result is not None and failure is None:
            await guarded(
                retitle(repo, chat, run_id, result.usage),
                "renaming the chat after run {run_id} failed",
                run_id,
            )


def detach(work: Coroutine[Any, Any, None]) -> asyncio.Task[None]:
    """Run work that must outlive the request that started it: a client that
    walks away mid-stream stops reading, and the run still finishes and stores
    what it produced."""
    task = asyncio.create_task(work)
    _detached.add(task)
    task.add_done_callback(_finished)
    return task


async def relay[T](queue: asyncio.Queue[T | None]) -> AsyncGenerator[T]:
    """A detached run's output as the client reads it, ended by a None."""
    while (item := await queue.get()) is not None:
        yield item


async def start_stream(
    *,
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
    adapter: VercelAIAdapter[HarnessDeps, str],
    current_locator: str | None = None,
    attached: str | None = None,
    medium: Medium = "web",
) -> AsyncGenerator[BaseChunk]:
    """Start the run and hand back the client's view of it.

    The run is a task of its own, with its own session: a client that walks
    away mid-stream stops reading the queue, and the run keeps going to
    completion and persistence anyway.

    `attached` is the block that goes above the learner's words — the passages
    they referenced on the page, the objects a notebook sent along.
    """
    await check_run_allowed(repo)
    run_id = uuid.uuid4()
    # A Vercel AI client posts the whole conversation it holds. The history a
    # run is given comes from the database and from nowhere else, so only the
    # message just submitted is taken from the request.
    adapter.run_input.messages = adapter.run_input.messages[-1:]
    user_messages = adapter.sanitize_messages(adapter.messages)
    # Read before the fence goes on: `_prefix` writes into the same part, and a
    # chat named after that is a chat named after the passage the learner
    # attached rather than after what they asked about it.
    prompt = _prompt_text(user_messages)
    if attached is not None:
        _prefix(user_messages, attached)
    queue: asyncio.Queue[BaseChunk | None] = asyncio.Queue()
    run = _Run(
        steering=Steering(
            announce=lambda steer: queue.put_nowait(
                DataChunk(type="data-steer", data={"id": str(steer.id)}, transient=True)
            )
        )
    )
    # Registered before the chat is claimed: opening can compact the history,
    # a whole model call, and a stop or a steer sent meanwhile is for this run.
    _runs[run_id] = run
    try:
        history = await _open_run(
            repo, chat, run_id, user_messages, medium, "user", prompt
        )
    except BaseException:
        _runs.pop(run_id, None)
        run.over.set()
        raise
    run.drain = detach(
        _drain(
            session_factory=session_factory,
            user_id=repo.user_id,
            chat_id=chat.id,
            run_id=run_id,
            run=run,
            adapter=adapter,
            history=history,
            current_locator=current_locator,
            medium=medium,
            queue=queue,
        )
    )
    run.drain.add_done_callback(partial(_unregister, run_id))
    return relay(queue)
