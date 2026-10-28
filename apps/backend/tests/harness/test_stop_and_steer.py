import asyncio
import uuid
from collections.abc import AsyncGenerator, AsyncIterator

import pytest
from logfire.testing import CaptureLogfire
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
    UserPromptPart,
)
from pydantic_ai.models.function import AgentInfo, DeltaToolCall, FunctionModel
from pydantic_ai.models.test import TestModel
from pydantic_ai.ui.vercel_ai.response_types import (
    BaseChunk,
    DataChunk,
    FinishChunk,
    TextDeltaChunk,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.harness.steering import SteerMessage, is_steer
from app.models import Chat
from tests.conftest import settled
from tests.harness.conftest import start, stored

STEER = "focus on the path length, not the code"


class Search:
    """A tool the test holds open: the run is mid-tool until `release`."""

    def __init__(self) -> None:
        self.called = asyncio.Event()
        self.release = asyncio.Event()

    async def search_content(self, query: str) -> str:
        """Search the course."""
        self.called.set()
        await self.release.wait()
        return f"the course on {query}"


class Answering:
    """A streaming model that walks through `steps`, one per request: a list is
    one response of `search_content` calls, a string is text. With `hold`, the
    last text stops half way and waits on it, which is a stop mid-answer.

    It keeps the last message of every request it is sent, which is where a
    steer lands.
    """

    def __init__(self, *steps: str | list[str], hold: asyncio.Event | None = None):
        self.steps = steps
        self.hold = hold
        self.seen: list[ModelMessage] = []
        self.model = FunctionModel(stream_function=self.stream)

    async def stream(
        self, messages: list[ModelMessage], _info: AgentInfo
    ) -> AsyncIterator[str | dict[int, DeltaToolCall]]:
        self.seen.append(messages[-1])
        made = len(self.seen)
        step = self.steps[min(made, len(self.steps)) - 1]
        if isinstance(step, list):
            yield {
                index: DeltaToolCall(
                    name="search_content",
                    json_args=f'{{"query": "{query}"}}',
                    tool_call_id=f"call-{made}-{index}",
                )
                for index, query in enumerate(step)
            }
            return
        yield step
        if self.hold is not None and made == len(self.steps):
            await self.hold.wait()
            yield " and the rest"


async def collect(chunks: AsyncGenerator[BaseChunk]) -> list[BaseChunk]:
    return [chunk async for chunk in chunks]


async def active_run(repo: HarnessRepository, chat: Chat) -> uuid.UUID | None:
    await repo.session.refresh(chat)
    return chat.active_run_id


def data(chunks: list[BaseChunk], kind: str) -> list[object]:
    return [c.data for c in chunks if isinstance(c, DataChunk) and c.type == kind]


async def test_a_steer_reaches_the_next_request_and_is_stored_as_the_learners(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    """The history processor's request survives into what the run returns: it
    is persisted, in order, as a message of the learner's."""
    search = Search()
    steer = SteerMessage(uuid.uuid4(), STEER)

    model = Answering(["isolation forest"], "path length it is")

    with tutor.override(model=model.model, tools=[search.search_content]):
        reading = asyncio.create_task(
            collect(await start(session_factory, repo, chat, "isolation forests?"))
        )
        await search.called.wait()
        assert runner.steer(await active_run(repo, chat), steer)
        search.release.set()
        chunks = await reading
        await settled()

    rows = await repo.rows(chat)
    # Sent to the model in one request with the search's return, after it.
    sent = model.seen[1]
    assert isinstance(sent, ModelRequest)
    returned, steered = sent.parts
    assert isinstance(returned, ToolReturnPart)
    assert isinstance(steered, UserPromptPart) and steered.content == STEER
    assert [row.role for row in rows] == ["user", "agent", "agent", "user", "agent"]
    assert STEER in stored(rows[3:4])
    assert data(chunks, "data-steer") == [{"id": str(steer.id)}]
    assert data(chunks, "data-steer-unused") == []
    history = await repo.history(chat)
    assert [is_steer(message) for message in history] == [
        False,
        False,
        False,
        True,
        False,
    ]


async def test_a_steer_too_late_for_any_request_is_handed_back_before_the_finish(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    """The answer being written is not interrupted, so a steer sent during it
    has no request left to ride on: the client sends it as a turn."""
    hold = asyncio.Event()
    steer = SteerMessage(uuid.uuid4(), STEER)

    with tutor.override(model=Answering("half", hold=hold).model, tools=[]):
        chunks = await start(session_factory, repo, chat)
        seen = [await anext(chunks)]
        while not isinstance(seen[-1], TextDeltaChunk):
            seen.append(await anext(chunks))
        assert runner.steer(await active_run(repo, chat), steer)
        hold.set()
        seen += await collect(chunks)
        await settled()

    unused = next(
        index
        for index, chunk in enumerate(seen)
        if isinstance(chunk, DataChunk) and chunk.type == "data-steer-unused"
    )
    finish = next(i for i, chunk in enumerate(seen) if isinstance(chunk, FinishChunk))
    assert data(seen, "data-steer-unused") == [{"ids": [str(steer.id)]}]
    assert unused < finish
    assert [row.role for row in await repo.rows(chat)] == ["user", "agent"]
    # Over: a steer now is refused, and the client sends it as a turn instead.
    assert not runner.steer(await active_run(repo, chat), steer)


async def test_stopping_mid_text_keeps_what_was_said_and_frees_the_chat(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    hold = asyncio.Event()

    with tutor.override(model=Answering("half an answer", hold=hold).model, tools=[]):
        chunks = await start(session_factory, repo, chat)
        while not isinstance(await anext(chunks), TextDeltaChunk):
            pass
        await runner.stop(await active_run(repo, chat))

    rows = await repo.rows(chat)
    assert [row.role for row in rows] == ["user", "agent"]
    assert [row.error for row in rows] == [None, None]
    assert "half an answer" in stored(rows)
    assert "the rest" not in stored(rows)
    # Spent all the same: the caps and the ceiling are sums over these rows.
    usage = rows[-1].usage
    assert usage is not None and usage["requests"] == 1
    assert await active_run(repo, chat) is None

    # The next message continues from the stored half.
    with tutor.override(model=TestModel(custom_output_text="shorter"), tools=[]):
        await collect(await start(session_factory, repo, chat, "go on, but shorter"))
        await settled()
    history = await repo.history(chat)
    assert "half an answer" in str(history)
    assert "shorter" in stored(await repo.rows(chat))


async def test_stopping_mid_tool_keeps_the_calls_that_completed(
    session_factory: async_sessionmaker[AsyncSession],
    repo: HarnessRepository,
    chat: Chat,
) -> None:
    """The first search came back and stays; the second is cut off, and the
    next run is given a history the library can close it out in."""
    search = Search()
    first_done = asyncio.Event()

    async def search_content(query: str) -> str:
        """Search the course."""
        if query == "first":
            first_done.set()
            return "the first result"
        return await search.search_content(query)

    with tutor.override(
        model=Answering(["first"], ["second"], "never").model, tools=[search_content]
    ):
        chunks = asyncio.create_task(collect(await start(session_factory, repo, chat)))
        await search.called.wait()
        await runner.stop(await active_run(repo, chat))
        await chunks

    rows = await repo.rows(chat)
    assert first_done.is_set()
    assert all(row.error is None for row in rows)
    assert "the first result" in stored(rows)
    assert "second" in stored(rows)
    assert await active_run(repo, chat) is None

    with tutor.override(model=TestModel(custom_output_text="go on"), tools=[]):
        await collect(await start(session_factory, repo, chat, "go on"))
        await settled()
    assert "go on" in stored((await repo.rows(chat))[-1:])
    assert (await repo.rows(chat))[-1].error is None


async def test_stopping_with_nothing_in_flight_does_nothing(
    capfire: CaptureLogfire,
) -> None:
    await runner.stop(None)
    assert capfire.exporter.exported_spans_as_dict() == []
    unknown = uuid.uuid4()
    await asyncio.wait_for(runner.stop(unknown), timeout=1)
    [warning] = capfire.exporter.exported_spans_as_dict()
    assert warning["attributes"]["logfire.msg"] == (
        "stop for a run this process does not hold"
    )
    # logfire's number for `warning`; it exports no public name for it.
    assert warning["attributes"]["logfire.level_num"] == 13
    assert warning["attributes"]["run_id"] == str(unknown)
    assert runner._runs == {}
    assert not runner.steer(None, SteerMessage(uuid.uuid4(), STEER))


@pytest.mark.parametrize("cut_off", [True, False])
def test_a_cut_off_response_loses_its_calls_and_keeps_its_text(cut_off: bool) -> None:
    response = ModelResponse(
        parts=[
            TextPart(content="let me look"),
            ToolCallPart(tool_name="search_content", args='{"que'),
        ],
        state="interrupted" if cut_off else "complete",
    )
    question = ModelRequest(parts=[UserPromptPart(content="q")])

    [kept_question, kept] = runner._settled([question, response])

    assert kept_question is question
    assert [type(part) for part in kept.parts] == (
        [TextPart] if cut_off else [TextPart, ToolCallPart]
    )
