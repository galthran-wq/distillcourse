import asyncio
import json
import uuid
from collections.abc import AsyncGenerator, Sequence

import pytest
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_ai.models.test import TestModel
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import SubmitMessage, TextUIPart, UIMessage
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    ErrorChunk,
    TextDeltaChunk,
    ToolInputAvailableChunk,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded
from app.harness.repository import HarnessRepository
from app.models import Chat, Message


def note(topic: str) -> str:
    """Look up a topic in the course."""
    return f"the course covers {topic}"


def stored(rows: Sequence[Message]) -> str:
    return json.dumps([row.pydantic_ai for row in rows])


async def start(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
    question: str = "what is entropy?",
    earlier: Sequence[UIMessage] = (),
) -> AsyncGenerator[BaseChunk]:
    adapter = VercelAIAdapter[HarnessDeps, str](
        agent=tutor,
        run_input=SubmitMessage(
            id=str(chat.id),
            messages=[
                *earlier,
                UIMessage(id="m1", role="user", parts=[TextUIPart(text=question)]),
            ],
        ),
    )
    return await runner.start_stream(
        session_factory=session_factory, repo=repo, chat=chat, adapter=adapter
    )


async def test_a_run_persists_the_turn_its_usage_and_the_title(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(
        model=TestModel(custom_output_text="expected surprise"), tools=[]
    ):
        output = await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    usage = rows[-1].usage
    assert output == "expected surprise"
    assert [row.role for row in rows] == ["user", "agent"]
    assert usage is not None
    assert usage["requests"] == 1
    assert usage["input_tokens"] > 0
    assert chat.title == "what is entropy?"
    assert len(await repo.history(chat)) == 2


async def test_tool_calls_are_persisted_with_the_reply(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=TestModel(), tools=[note]):
        await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    assert "tool-call" in stored(rows)
    assert "the course covers" in stored(rows)


async def test_a_tool_call_is_projected_with_the_result_it_got(
    repo: HarnessRepository, chat: Chat
) -> None:
    """The projection is what a reloaded chat is rebuilt from: a tool call
    whose result is missing renders as one still running."""
    with tutor.override(model=TestModel(), tools=[note]):
        await runner.run(repo, chat, "what is entropy?")

    projection = json.dumps([row.projection for row in await repo.rows(chat)])
    assert "output-available" in projection
    assert "the course covers" in projection


async def test_a_failed_run_is_marked_and_left_out_of_the_context(
    repo: HarnessRepository, chat: Chat
) -> None:
    def refuse(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise RuntimeError("openrouter is down")

    with tutor.override(model=FunctionModel(refuse), tools=[]):
        with pytest.raises(RuntimeError, match="openrouter is down"):
            await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    assert [row.error for row in rows] == ["openrouter is down"]
    assert await repo.history(chat) == []


async def test_a_claimed_chat_refuses_a_second_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.claim_run(chat, uuid.uuid4())

    with tutor.override(model=TestModel(), tools=[]):
        with pytest.raises(runner.RunBusy):
            await runner.run(repo, chat, "what is entropy?")


async def test_a_run_that_cannot_start_leaves_the_chat_free(
    monkeypatch: pytest.MonkeyPatch, repo: HarnessRepository, chat: Chat
) -> None:
    async def explode(_repo: HarnessRepository, _chat: Chat, **_kwargs: object) -> str:
        raise RuntimeError("openrouter is down")

    await repo.add_messages(
        chat,
        [ModelResponse(parts=[TextPart(content="older reply")])],
        role="agent",
        usage={"input_tokens": 900_000, "output_tokens": 0},
    )
    monkeypatch.setattr(runner, "summarize", explode)

    with tutor.override(model=TestModel(), tools=[]):
        with pytest.raises(RuntimeError, match="openrouter is down"):
            await runner.run(repo, chat, "what is entropy?")

    assert await repo.claim_run(chat, uuid.uuid4()) is True


async def test_a_full_context_is_compacted_before_the_next_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat, [ModelRequest(parts=[UserPromptPart(content="older")])], role="user"
    )
    await repo.add_messages(
        chat,
        [ModelResponse(parts=[TextPart(content="older reply")])],
        role="agent",
        usage={"input_tokens": 900_000, "output_tokens": 0},
    )

    with tutor.override(
        model=TestModel(custom_output_text="they study entropy"), tools=[]
    ):
        await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    history = await repo.history(chat)
    assert [row.marker for row in rows].count("compact") == 1
    assert "Summary of the conversation so far" in str(history[0])
    assert "older" not in str(history)


async def test_the_stream_reaches_the_client_and_the_database(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    with tutor.override(
        model=TestModel(custom_output_text="expected surprise"), tools=[note]
    ):
        chunks = [chunk async for chunk in await start(session_factory, repo, chat)]

    rows = await repo.rows(chat)
    usage = rows[-1].usage
    assert any(isinstance(chunk, ToolInputAvailableChunk) for chunk in chunks)
    assert any(isinstance(chunk, TextDeltaChunk) for chunk in chunks)
    assert [row.role for row in rows] == ["user", "agent", "agent", "agent"]
    assert "the course covers" in stored(rows)
    assert usage is not None and usage["requests"] == 2


async def test_the_conversation_the_client_holds_is_not_replayed(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    """A Vercel AI client posts every message it has on every turn. The run is
    given the history in the database, so only the new one is taken."""
    earlier = [
        UIMessage(id="m0", role="user", parts=[TextUIPart(text="what is a bit?")]),
        UIMessage(id="m0a", role="assistant", parts=[TextUIPart(text="a unit")]),
    ]

    with tutor.override(
        model=TestModel(custom_output_text="expected surprise"), tools=[]
    ):
        chunks = await start(session_factory, repo, chat, earlier=earlier)
        [_ async for _ in chunks]

    rows = await repo.rows(chat)
    assert [row.role for row in rows] == ["user", "agent"]
    assert "what is a bit?" not in stored(rows)
    assert await repo.messages_today() == 1
    assert len(await repo.history(chat)) == 2


async def test_a_failure_before_the_stream_is_told_to_the_client(
    monkeypatch: pytest.MonkeyPatch,
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    """Building the model happens outside the adapter's own error handling —
    the client still gets an error, and the chat keeps no empty reply."""

    def explode(_model: str) -> None:
        raise RuntimeError("no openrouter key")

    monkeypatch.setattr(runner, "model_for", explode)

    with tutor.override(model=TestModel(), tools=[]):
        chunks = [chunk async for chunk in await start(session_factory, repo, chat)]

    rows = await repo.rows(chat)
    released = await repo.get_chat(chat.id)
    assert [chunk.error_text for chunk in chunks if isinstance(chunk, ErrorChunk)] == [
        "no openrouter key"
    ]
    assert [row.role for row in rows] == ["user"]
    assert [row.error for row in rows] == ["no openrouter key"]
    assert await repo.history(chat) == []
    assert released is not None and released.active_run_id is None


async def test_a_client_that_leaves_mid_stream_still_gets_its_run_stored(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    with tutor.override(
        model=TestModel(custom_output_text="expected surprise"), tools=[]
    ):
        chunks = await start(session_factory, repo, chat)
        await anext(chunks)
        await chunks.aclose()
        await asyncio.gather(*runner._drains)

    released = await repo.get_chat(chat.id)
    assert "expected surprise" in stored(await repo.rows(chat))
    assert released is not None and released.active_run_id is None


async def test_a_fresh_summary_does_not_trigger_another_compaction(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_messages(
        chat, [ModelRequest(parts=[UserPromptPart(content="older")])], role="user"
    )
    await repo.add_messages(
        chat,
        [ModelResponse(parts=[TextPart(content="older reply")])],
        role="agent",
        usage={"input_tokens": 900_000, "output_tokens": 0},
    )

    with tutor.override(
        model=TestModel(custom_output_text="they study entropy"), tools=[]
    ):
        await runner.run(repo, chat, "what is entropy?")
        await runner.run(repo, chat, "and cross entropy?")

    rows = await repo.rows(chat)
    assert [row.marker for row in rows].count("compact") == 1


async def test_a_system_run_does_not_spend_the_daily_allowance(
    repo: HarnessRepository, chat: Chat
) -> None:
    for _ in range(settings.DAILY_MESSAGE_CAP - 1):
        await repo.add_messages(
            chat, [ModelRequest(parts=[UserPromptPart(content="q")])], role="user"
        )

    with tutor.override(model=TestModel(custom_output_text="due for review"), tools=[]):
        assert await runner.run(repo, chat, "review time", run_kind="review")
        assert await runner.run(repo, chat, "what is entropy?")
        with pytest.raises(LimitExceeded):
            await runner.run(repo, chat, "and cross entropy?")
