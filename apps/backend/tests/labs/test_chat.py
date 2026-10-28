"""Asking the tutor from a notebook: a chat per lab, on the web chat's harness."""

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    UserPromptPart,
)
from pydantic_ai.models.function import (
    AgentInfo,
    DeltaToolCall,
    DeltaToolCalls,
    FunctionModel,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.labs.tools import toolset
from app.models import Chat, LabSolution, User
from tests.conftest import replying, settled
from tests.harness.conftest import calling
from tests.labs.conftest import COURSE, LABS, LESSON, SLUG, VERSION, post

ASK = f"{LABS}/{COURSE}/{SLUG}/ask"
NEW_CHAT = f"{LABS}/{COURSE}/{SLUG}/chat"
LAB_TOOLS = {"get_lab_progress", "get_checkpoint", "get_reference_solution"}
SOLUTION = "def surprisal(p):\n    return -np.log2(p)\n"

pytestmark = pytest.mark.usefixtures("lab")


def events(sse: str) -> list[dict[str, Any]]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in sse.splitlines()
        if line.startswith("data: ")
    ]


def answer(sse: str) -> str:
    return "".join(event["delta"] for event in events(sse) if event["type"] == "text")


async def ask(client: AsyncClient, text: str, **body: Any) -> Any:
    response = await client.post(ASK, json={"text": text, **body})
    await settled()
    return response


async def lab_chats(session: AsyncSession, user: User) -> list[Chat]:
    rows = await session.scalars(
        select(Chat).where(Chat.user_id == user.id).order_by(Chat.created_at)
    )
    return list(rows)


def streamed(model: FunctionModel) -> FunctionModel:
    """The same model, answering a streamed request: every run here is one."""
    turn = model.function
    assert turn is not None

    async def stream(
        messages: list[ModelMessage], info: AgentInfo
    ) -> AsyncIterator[str | DeltaToolCalls]:
        response = turn(messages, info)
        assert isinstance(response, ModelResponse)
        for index, part in enumerate(response.parts):
            if isinstance(part, TextPart):
                yield part.content
            elif isinstance(part, ToolCallPart):
                yield {
                    index: DeltaToolCall(
                        name=part.tool_name, json_args=part.args_as_json_str()
                    )
                }

    return FunctionModel(turn, stream_function=stream)


def remembering(seen: list[list[str]]) -> FunctionModel:
    """A model that records the learner's words it was given, every turn."""

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        seen.append(
            [
                part.content
                for message in messages
                if isinstance(message, ModelRequest)
                for part in message.parts
                if isinstance(part, UserPromptPart) and isinstance(part.content, str)
            ]
        )
        return ModelResponse(parts=[TextPart(content="noted")])

    return FunctionModel(turn)


def listing(tools: list[set[str]]) -> FunctionModel:
    """A model that records the tools a run offered it."""

    def turn(_messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        tools.append({tool.name for tool in info.function_tools})
        return ModelResponse(parts=[TextPart(content="ok")])

    return FunctionModel(turn)


async def test_a_question_streams_its_answer_and_ends_with_the_chat_link(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    with replying("the log goes the other way round"):
        response = await ask(notebook, "why is my IV negative?")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    [chat] = await lab_chats(session, user)
    assert (chat.kind, chat.lab_lesson) == ("lab", LESSON)
    assert answer(response.text) == "the log goes the other way round"
    assert events(response.text)[-1] == {
        "type": "done",
        "chat_id": str(chat.id),
        "url": f"{settings.FRONTEND_HOST}/courses/{COURSE}/lessons/{SLUG}?chat={chat.id}",
    }


async def test_a_question_without_a_chat_continues_the_latest_one_of_the_lab(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """A restarted kernel has no chat id; the server still has the chat."""
    seen: list[list[str]] = []
    with tutor.override(model=streamed(remembering(seen)), tools=[]):
        await ask(notebook, "why is my IV negative?")
        await ask(notebook, "and is my binning ok?")

    assert len(await lab_chats(session, user)) == 1
    assert seen[-1] == ["why is my IV negative?", "and is my binning ok?"]


async def test_clearing_starts_a_new_chat_the_next_question_continues(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    seen: list[list[str]] = []
    with tutor.override(model=streamed(remembering(seen)), tools=[]):
        await ask(notebook, "why is my IV negative?")
        cleared = await notebook.post(NEW_CHAT)
        await ask(notebook, "and is my binning ok?")

    assert cleared.status_code == 201
    old, new = await lab_chats(session, user)
    assert cleared.json() == {
        "chat_id": str(new.id),
        "url": f"{settings.FRONTEND_HOST}/courses/{COURSE}/lessons/{SLUG}?chat={new.id}",
    }
    assert (new.kind, new.lab_lesson) == ("lab", LESSON)
    assert seen[-1] == ["and is my binning ok?"]
    # The old conversation is kept, not cut: it is still a chat on the site.
    assert old.id != new.id


async def test_a_question_lands_in_the_chat_it_names(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    repo = HarnessRepository(session, user.id)
    named = await repo.create_chat(kind="lab", lab_lesson=LESSON)
    await repo.create_chat(kind="lab", lab_lesson=LESSON)

    with replying():
        response = await ask(notebook, "a question", chat_id=str(named.id))

    assert events(response.text)[-1]["chat_id"] == str(named.id)


async def test_a_chat_outside_this_lab_is_not_found(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")
    elsewhere = await repo.create_chat(kind="lab", lab_lesson="lesson:other/lab")

    for chat in (web, elsewhere):
        response = await ask(notebook, "a question", chat_id=str(chat.id))
        assert response.status_code == 404


async def test_a_lesson_with_no_lab_has_no_chat(notebook: AsyncClient) -> None:
    elsewhere = f"{LABS}/{COURSE}/no-such-lab"
    assert (await notebook.post(f"{elsewhere}/chat")).status_code == 404
    response = await notebook.post(f"{elsewhere}/ask", json={"text": "a question"})
    assert response.status_code == 404


async def test_asking_needs_a_paired_notebook(client: AsyncClient) -> None:
    assert (await ask(client, "a question")).status_code == 401
    assert (await client.post(NEW_CHAT)).status_code == 401


async def test_a_chat_with_a_run_in_flight_is_refused(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    repo = HarnessRepository(session, user.id)
    chat = await repo.lab_chat(LESSON)
    await repo.claim_run(chat, uuid.uuid4())

    response = await ask(notebook, "a question")

    assert response.status_code == 409


async def test_the_monthly_ceiling_refuses_a_question(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    repo = HarnessRepository(session, user.id)
    chat = await repo.create_chat(kind="web")
    await repo.add_messages(
        chat,
        [ModelRequest(parts=[UserPromptPart(content="spent")])],
        role="system",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
    )

    response = await ask(notebook, "a question")

    assert response.status_code == 429
    assert "monthly budget" in response.json()["detail"]


async def test_attachments_are_stored_above_the_question_as_fenced_blocks(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    source = 'def woe(t):\n    """```not a fence```"""\n    return t\n'
    with replying():
        response = await ask(
            notebook,
            "why is my IV negative?",
            attachments=[
                {"name": "woe", "kind": "function", "text": source},
                {"name": "arg2", "kind": "value", "text": "0.5"},
            ],
        )

    [chat] = await lab_chats(session, user)
    stored = (await HarnessRepository(session, user.id).history(chat))[0]
    assert isinstance(stored, ModelRequest)
    prompt = stored.parts[0]
    assert isinstance(prompt, UserPromptPart)
    assert prompt.content == (
        f"`woe` (function)\n\n````\n{source}\n````\n\n"
        "`arg2` (value)\n\n```\n0.5\n```\n\n"
        "why is my IV negative?"
    )
    assert events(response.text)[0] == {
        "type": "step",
        "label": "reading your woe, arg2",
    }
    # Named after what was asked, not after what came with it.
    assert chat.title == "why is my IV negative?"


async def test_a_tool_call_is_announced_as_a_step(notebook: AsyncClient) -> None:
    with tutor.override(
        model=streamed(calling("get_checkpoint", checkpoint="surprisal"))
    ):
        response = await ask(notebook, "why does surprisal fail?")

    assert {"type": "step", "label": "checking surprisal"} in events(response.text)


async def test_a_failed_run_ends_the_stream_with_an_error(
    notebook: AsyncClient,
) -> None:
    def failing(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise RuntimeError("the model is down")

    with tutor.override(model=streamed(FunctionModel(failing)), tools=[]):
        response = await ask(notebook, "a question")

    last = events(response.text)[-1]
    assert last["type"] == "error"
    assert "the model is down" in last["detail"]
    assert not any(event["type"] == "done" for event in events(response.text))


async def test_lab_tools_are_offered_in_a_lab_chat_only(
    notebook: AsyncClient,
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
) -> None:
    offered: list[set[str]] = []
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")
    telegram = await repo.create_chat(kind="telegram")
    with tutor.override(model=streamed(listing(offered))):
        await ask(notebook, "a question")
        await signed_in.post(
            f"/api/v1/chats/{web.id}/stream",
            json={
                "id": str(web.id),
                "trigger": "submit-message",
                "messages": [
                    {
                        "id": "m",
                        "role": "user",
                        "parts": [{"type": "text", "text": "q"}],
                    }
                ],
            },
        )
        await settled()
        await runner.run(repo, telegram, "a question")

    in_lab, on_the_web, in_telegram = offered
    assert LAB_TOOLS <= in_lab
    assert in_lab - LAB_TOOLS == on_the_web
    assert not LAB_TOOLS & on_the_web
    assert not LAB_TOOLS & in_telegram
    assert set(toolset.tools) == LAB_TOOLS


async def test_a_lab_chat_continued_on_the_site_keeps_its_lab(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    offered: list[set[str]] = []
    chat = await HarnessRepository(session, user.id).lab_chat(LESSON)
    with tutor.override(model=streamed(listing(offered))):
        response = await signed_in.post(
            f"/api/v1/chats/{chat.id}/stream",
            json={
                "id": str(chat.id),
                "trigger": "submit-message",
                "messages": [
                    {
                        "id": "m",
                        "role": "user",
                        "parts": [{"type": "text", "text": "q"}],
                    }
                ],
            },
        )
        await settled()

    assert response.status_code == 200
    assert LAB_TOOLS <= offered[0]
    listed = (await signed_in.get("/api/v1/chats")).json()
    assert [(item["kind"], item["lab_lesson"]) for item in listed] == [("lab", LESSON)]


async def test_the_lab_prompt_and_the_notebook_medium_reach_the_model(
    notebook: AsyncClient,
) -> None:
    def echo(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        request = messages[-1]
        assert isinstance(request, ModelRequest)
        return ModelResponse(parts=[TextPart(content=request.instructions or "")])

    with tutor.override(model=streamed(FunctionModel(echo)), tools=[]):
        response = await ask(notebook, "a question")

    instructions = answer(response.text)
    assert "## Medium: the lab notebook" in instructions
    assert "## Medium: the site" not in instructions
    assert "## The lab\n\nThe learner is in the middle of a lab" in instructions
    assert f"The lab is `{LESSON}`" in instructions
    assert f"They are reading `{LESSON}`." in instructions


async def test_the_tutor_reads_the_learners_standing(notebook: AsyncClient) -> None:
    await post(notebook, "surprisal", {"values": [[0.6931, 1.3863]]})

    with tutor.override(model=streamed(calling("get_lab_progress"))):
        response = await ask(notebook, "where am I?")

    told = answer(response.text)
    assert "'id': 'surprisal'" in told
    assert "'attempts': 1" in told
    assert "'last_hint': 'Natural log, not base two.'" in told
    assert "'passed': False" in told


async def test_the_tutor_reads_a_checkpoint_and_the_reference(
    notebook: AsyncClient, session: AsyncSession
) -> None:
    session.add(
        LabSolution(
            lesson=LESSON, source=SOLUTION, content_version=bytes.fromhex(VERSION)
        )
    )
    await session.commit()

    with tutor.override(
        model=streamed(calling("get_checkpoint", checkpoint="surprisal"))
    ):
        checkpoint = answer((await ask(notebook, "what is expected?")).text)
    with tutor.override(model=streamed(calling("get_reference_solution"))):
        reference = answer((await ask(notebook, "show me the reference")).text)

    assert "'hints': ['Natural log, not base two.']" in checkpoint
    assert "'expected': {'values': [[1.0, 2.0, 3.0]]}" in checkpoint
    assert "'inputs_code'" in checkpoint
    assert reference == SOLUTION
