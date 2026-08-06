import asyncio
import uuid
from collections.abc import AsyncGenerator, Sequence
from datetime import datetime

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
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.clock import zone
from app.harness.agent import compact_threshold, model_for, tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import check_cost_ceiling, check_run_allowed
from app.harness.prompts import ContextBlock, Medium, RunKind, assemble
from app.harness.repository import HarnessRepository, Role
from app.harness.usage import usage_row
from app.models import Chat
from app.telegram.outbox import Outbox


class RunBusy(Exception):
    pass


# asyncio holds only a weak reference to a running task, and this one outlives
# the request that started it.
_drains: set[asyncio.Task[None]] = set()


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


async def _context(
    repo: HarnessRepository, blocks: tuple[ContextBlock, ...]
) -> tuple[ContextBlock, ...]:
    """Every run carries the learner's clock: a reminder they ask for is set
    from the model's reading of "Friday", and the model has no clock at all."""
    user = await repo.user()
    now = datetime.now(zone(user.timezone))
    return (
        ContextBlock(
            title="The learner's clock",
            body=f"Their timezone is `{user.timezone}`; it is {now:%A %Y-%m-%d %H:%M} there.",
        ),
        *blocks,
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
    await repo.add_messages(
        chat,
        # Stored as a request, not as a response: the next run must read the
        # summary as context it was given, not as words it once said.
        [
            ModelRequest(
                parts=[
                    UserPromptPart(
                        content=f"Summary of the conversation so far:\n\n{result.output}"
                    )
                ]
            )
        ],
        role="system",
        marker="compact",
        usage=usage_row(result.usage),
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
            model=model_for(chat.model),
            deps=deps,
            instructions=assemble(medium, run_kind, await _context(repo, blocks)),
            run_id=str(run_id),
        )
        await _close_run(
            repo, chat, run_id, result=result, partial_text="", failure=None
        )
    except Exception as exc:
        await _close_run(
            repo, chat, run_id, result=None, partial_text="", failure=str(exc)
        )
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
            instructions = assemble(
                "web", "chat", await _context(repo, _blocks(current_locator))
            )
            async for chunk in adapter.run_stream(
                message_history=history,
                deps=deps,
                model=model_for(chat.model),
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
            # The adapter turns a failure inside the stream into an ErrorChunk;
            # one raised before the stream exists — building the model, reading
            # the prompt modules — has to reach the client from here.
            failure = str(exc)
            queue.put_nowait(ErrorChunk(error_text=failure))
        finally:
            await _close_run(
                repo,
                chat,
                run_id,
                result=result,
                partial_text="".join(text),
                failure=failure,
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
    await check_run_allowed(repo)
    run_id = uuid.uuid4()
    # A Vercel AI client posts the whole conversation it holds. The history a
    # run is given comes from the database and from nowhere else, so only the
    # message just submitted is taken from the request.
    adapter.run_input.messages = adapter.run_input.messages[-1:]
    user_messages = adapter.sanitize_messages(adapter.messages)
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
    task.add_done_callback(_drains.discard)
    return _relay(queue)
