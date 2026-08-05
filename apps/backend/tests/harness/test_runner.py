import asyncio
import json
import uuid
from collections.abc import AsyncGenerator

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
from app.models import Chat


def note(topic: str) -> str:
    """Look up a topic in the course."""
    return f"the course covers {topic}"


def payload(rows: object) -> str:
    return json.dumps(rows)


async def start(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
    question: str = "what is entropy?",
) -> AsyncGenerator[BaseChunk]:
    adapter = VercelAIAdapter[HarnessDeps, str](
        agent=tutor,
        run_input=SubmitMessage(
            id=str(chat.id),
            messages=[
                UIMessage(id="m1", role="user", parts=[TextUIPart(text=question)])
            ],
        ),
    )
    return await runner.start_stream(
        session_factory=session_factory, repo=repo, chat=chat, adapter=adapter
    )


async def test_a_run_persists_the_turn_its_usage_and_the_title(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=TestModel(custom_output_text="expected surprise")):
        output = await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    usage = rows[-1].usage
    assert output == "expected surprise"
    assert [row.role for row in rows] == ["user", "agent"]
    assert usage is not None
    assert usage["requests"] == 1
    assert usage["input_tokens"] > 0
    assert usage["web_search_calls"] == 0
    assert chat.title == "what is entropy?"
    assert len(await repo.history(chat)) == 2


async def test_tool_calls_are_persisted_with_the_reply(
    repo: HarnessRepository, chat: Chat
) -> None:
    with tutor.override(model=TestModel(), tools=[note]):
        await runner.run(repo, chat, "what is entropy?")

    stored = payload([row.pydantic_ai for row in await repo.rows(chat)])
    assert "tool-call" in stored
    assert "the course covers" in stored


async def test_a_failed_run_is_marked_and_left_out_of_the_context(
    repo: HarnessRepository, chat: Chat
) -> None:
    def refuse(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise RuntimeError("openrouter is down")

    with tutor.override(model=FunctionModel(refuse)):
        with pytest.raises(RuntimeError, match="openrouter is down"):
            await runner.run(repo, chat, "what is entropy?")

    rows = await repo.rows(chat)
    assert [row.error for row in rows] == ["openrouter is down"]
    assert await repo.history(chat) == []


async def test_a_claimed_chat_refuses_a_second_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.claim_run(chat, uuid.uuid4())

    with tutor.override(model=TestModel()):
        with pytest.raises(runner.RunBusy):
            await runner.run(repo, chat, "what is entropy?")


async def test_a_full_context_is_compacted_before_the_next_run(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_message(
        chat, ModelRequest(parts=[UserPromptPart(content="older")]), role="user"
    )
    await repo.add_message(
        chat,
        ModelResponse(parts=[TextPart(content="older reply")]),
        role="agent",
        usage={"input_tokens": 900_000, "output_tokens": 0},
    )

    with tutor.override(model=TestModel(custom_output_text="they study entropy")):
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
    assert "the course covers" in payload([row.pydantic_ai for row in rows])
    assert usage is not None and usage["requests"] == 2


async def test_a_client_that_leaves_mid_stream_still_gets_its_run_stored(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    with tutor.override(model=TestModel(custom_output_text="expected surprise")):
        chunks = await start(session_factory, repo, chat)
        await anext(chunks)
        await chunks.aclose()
        await asyncio.gather(*runner._drains)

    stored = payload([row.pydantic_ai for row in await repo.rows(chat)])
    released = await repo.get_chat(chat.id)
    assert "expected surprise" in stored
    assert released is not None and released.active_run_id is None


async def test_a_fresh_summary_does_not_trigger_another_compaction(
    repo: HarnessRepository, chat: Chat
) -> None:
    await repo.add_message(
        chat, ModelRequest(parts=[UserPromptPart(content="older")]), role="user"
    )
    await repo.add_message(
        chat,
        ModelResponse(parts=[TextPart(content="older reply")]),
        role="agent",
        usage={"input_tokens": 900_000, "output_tokens": 0},
    )

    with tutor.override(model=TestModel(custom_output_text="they study entropy")):
        await runner.run(repo, chat, "what is entropy?")
        await runner.run(repo, chat, "and cross entropy?")

    rows = await repo.rows(chat)
    assert [row.marker for row in rows].count("compact") == 1


async def test_a_system_run_does_not_spend_the_daily_allowance(
    repo: HarnessRepository, chat: Chat
) -> None:
    for _ in range(settings.DAILY_MESSAGE_CAP):
        await repo.add_message(
            chat, ModelRequest(parts=[UserPromptPart(content="q")]), role="user"
        )

    with tutor.override(model=TestModel(custom_output_text="due for review")):
        with pytest.raises(LimitExceeded):
            await runner.run(repo, chat, "what is entropy?")
        assert await runner.run(repo, chat, "review time", run_kind="review")
