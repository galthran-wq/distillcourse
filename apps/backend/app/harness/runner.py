import asyncio
import uuid
from collections.abc import AsyncGenerator, Sequence
from typing import Any

from pydantic_ai.agent import AgentRunResult
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    ErrorChunk,
    TextDeltaChunk,
)
from pydantic_ai.usage import RunUsage
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness.agent import compact_threshold, model_for, tutor
from app.harness.deps import HarnessDeps, RunTally
from app.harness.limits import check_cost_ceiling, check_run_allowed
from app.harness.prompts import ContextBlock, Medium, RunKind, assemble
from app.harness.repository import TITLE_LENGTH, HarnessRepository
from app.models import Chat


class RunBusy(Exception):
    pass


# asyncio holds only a weak reference to a running task, and this one outlives
# the request that started it.
_drains: set[asyncio.Task[None]] = set()


def _usage_row(usage: RunUsage, tally: RunTally) -> dict[str, Any]:
    return {
        "requests": usage.requests,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cost_usd": float(usage.cost) if usage.cost is not None else None,
        "web_search_calls": tally.web_search_calls,
    }


def _prompt_text(messages: Sequence[ModelMessage]) -> str:
    for message in messages:
        for part in message.parts:
            if isinstance(part, UserPromptPart) and isinstance(part.content, str):
                return part.content
    return ""


def _blocks(current_locator: str | None) -> tuple[ContextBlock, ...]:
    if current_locator is None:
        return ()
    return (
        ContextBlock(
            title="Where the learner is",
            body=f"They are reading `{current_locator}`.",
        ),
    )


async def summarize(
    repo: HarnessRepository, chat: Chat, *, medium: Medium = "web"
) -> str:
    """Replace the history with a summary of it. The caller holds the claim."""
    history = await repo.history(chat)
    if not history:
        return ""
    result = await tutor.run(
        message_history=history,
        model=model_for(chat.model),
        deps=HarnessDeps(repo=repo, chat=chat),
        instructions=assemble(medium, "compact"),
    )
    await repo.add_message(
        chat,
        # Stored as a request, not as a response: the next run must read the
        # summary as context it was given, not as words it once said.
        ModelRequest(
            parts=[
                UserPromptPart(
                    content=f"Summary of the conversation so far:\n\n{result.output}"
                )
            ]
        ),
        role="system",
        marker="compact",
        usage=_usage_row(result.usage, RunTally()),
    )
    return result.output


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
) -> list[ModelMessage]:
    if not await repo.claim_run(chat, run_id):
        raise RunBusy
    if await repo.context_tokens(chat) >= compact_threshold(chat.model):
        await summarize(repo, chat, medium=medium)
    history = await repo.history(chat)
    for message in user_messages:
        await repo.add_message(chat, message, role="user", run_id=run_id)
    if chat.title is None and (prompt := _prompt_text(user_messages)):
        await repo.set_title(chat, prompt[:TITLE_LENGTH])
    return history


async def _close_run(
    repo: HarnessRepository,
    chat: Chat,
    run_id: uuid.UUID,
    *,
    result: AgentRunResult[str] | None,
    partial_text: str,
    failure: str | None,
    tally: RunTally,
) -> None:
    if result is not None:
        # The user turn went into the history the run was given, so everything
        # `new_messages` holds was produced by this run.
        messages = result.new_messages()
        usage = _usage_row(result.usage, tally)
    else:
        # A run that produced no result still gets a row: it carries what was
        # streamed before the failure and the metered calls it already made.
        parts = [TextPart(content=partial_text)] if partial_text else []
        messages = [ModelResponse(parts=parts)]
        usage = _usage_row(RunUsage(), tally)
    for index, message in enumerate(messages):
        await repo.add_message(
            chat,
            message,
            role="agent",
            run_id=run_id,
            usage=usage if index == len(messages) - 1 else None,
        )
    if failure is not None:
        await repo.fail_run(chat, run_id, failure)


async def run(
    repo: HarnessRepository,
    chat: Chat,
    prompt: str,
    *,
    medium: Medium = "telegram",
    run_kind: RunKind = "chat",
    blocks: tuple[ContextBlock, ...] = (),
) -> str:
    """Non-streaming run, for Telegram and for scheduled work."""
    # A run the learner asked for spends their daily allowance; one the
    # platform starts by itself spends only the budget.
    if run_kind == "chat":
        await check_run_allowed(repo)
    else:
        await check_cost_ceiling(repo.session)
    run_id = uuid.uuid4()
    user_message = ModelRequest(parts=[UserPromptPart(content=prompt)])
    history = await _open_run(repo, chat, run_id, [user_message], medium)
    deps = HarnessDeps(repo=repo, chat=chat)
    try:
        result = await tutor.run(
            message_history=[*history, user_message],
            model=model_for(chat.model),
            deps=deps,
            instructions=assemble(medium, run_kind, blocks),
            run_id=str(run_id),
        )
        await _close_run(
            repo,
            chat,
            run_id,
            result=result,
            partial_text="",
            failure=None,
            tally=deps.tally,
        )
    except Exception as exc:
        await repo.fail_run(chat, run_id, str(exc))
        raise
    finally:
        await repo.release_run(chat, run_id)
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
    async with session_factory() as session:
        repo = HarnessRepository(session, user_id)
        chat = await repo.get_chat(chat_id)
        if chat is None:
            queue.put_nowait(None)
            return
        deps = HarnessDeps(repo=repo, chat=chat, current_locator=current_locator)
        result: AgentRunResult[str] | None = None
        text: list[str] = []
        failure: str | None = None

        def capture(completed: AgentRunResult[str]) -> None:
            nonlocal result
            result = completed

        try:
            async for chunk in adapter.run_stream(
                message_history=history,
                deps=deps,
                model=model_for(chat.model),
                instructions=assemble("web", "chat", _blocks(current_locator)),
                run_id=str(run_id),
                on_complete=capture,
            ):
                queue.put_nowait(chunk)
                if isinstance(chunk, TextDeltaChunk):
                    text.append(chunk.delta)
                elif isinstance(chunk, ErrorChunk):
                    failure = chunk.error_text
        finally:
            await _close_run(
                repo,
                chat,
                run_id,
                result=result,
                partial_text="".join(text),
                failure=failure,
                tally=deps.tally,
            )
            await repo.release_run(chat, run_id)
            # Only now: when the stream ends, everything it produced is stored.
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
) -> AsyncGenerator[BaseChunk]:
    """Start the run and hand back the client's view of it.

    The run is a task of its own, with its own session: a client that walks
    away mid-stream stops reading the queue, and the run keeps going to
    completion and persistence anyway.
    """
    run_id = uuid.uuid4()
    user_messages = adapter.sanitize_messages(adapter.messages)
    history = await _open_run(repo, chat, run_id, user_messages, "web")
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
    task.add_done_callback(_drains.discard)
    return _relay(queue)
