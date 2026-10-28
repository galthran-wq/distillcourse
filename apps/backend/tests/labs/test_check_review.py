"""The code review under a `distill.check` verdict: one toolless call, written
into the lab chat."""

import uuid
from collections.abc import AsyncIterator, Iterator
from contextlib import contextmanager
from typing import Any

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness.agent import model_for
from app.harness.repository import HarnessRepository
from app.labs import check_review
from app.models import Chat, LabCheckpointState, LabSolution, LabSubmission, User
from tests.conftest import replying, settled
from tests.labs.conftest import (
    COURSE,
    LABS,
    LESSON,
    PASSING,
    SLUG,
    SURPRISAL,
    VERSION,
    post,
)
from tests.labs.test_chat import ask, events

REVIEW = f"{LABS}/{COURSE}/{SLUG}/review"
SOURCE = "def surprisal(p):\n    return -np.log2(p)\n"
SOLUTION = "def surprisal(p):\n    return -np.log2(p)\n\ndef entropy_terms(p): ...\n"
WRONG = {"values": [[0.6931, 1.3863]]}
REVIEW_TEXT = "Correct. Nothing to change."

pytestmark = pytest.mark.usefixtures("lab")


def reviewing(
    text: str = REVIEW_TEXT, asked: list[list[ModelMessage]] | None = None
) -> FunctionModel:
    """The review model, answered from the test, recording what it was asked."""

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        if asked is not None:
            asked.append(messages)
        return ModelResponse(parts=[TextPart(content=text)])

    async def stream(
        messages: list[ModelMessage], _info: AgentInfo
    ) -> AsyncIterator[str]:
        if asked is not None:
            asked.append(messages)
        for word in text.split(" "):
            yield f"{word} "

    return FunctionModel(turn, stream_function=stream)


def down() -> FunctionModel:
    async def stream(
        _messages: list[ModelMessage], _info: AgentInfo
    ) -> AsyncIterator[str]:
        raise RuntimeError("the model is down")
        yield ""

    return FunctionModel(stream_function=stream)


@contextmanager
def answering(model: FunctionModel) -> Iterator[None]:
    with check_review.agent.override(model=model):
        yield


async def checked(
    notebook: AsyncClient, payload: Any = SURPRISAL, **extra: Any
) -> uuid.UUID:
    """A `distill.check` post, carrying the function's source."""
    submission = uuid.uuid4()
    body = {"source": SOURCE} | extra
    response = await notebook.post(
        f"{LABS}/submissions",
        json={
            "id": str(submission),
            "lesson": LESSON,
            "checkpoint": "surprisal",
            "content_version": VERSION,
            "payload": payload,
            **body,
        },
    )
    assert response.status_code == 200
    return submission


async def review(notebook: AsyncClient, submission: uuid.UUID) -> Any:
    response = await notebook.post(REVIEW, json={"submission_id": str(submission)})
    await settled()
    return response


def text_of(sse: str) -> str:
    return "".join(e["delta"] for e in events(sse) if e["type"] == "text")


def prompt_of(asked: list[list[ModelMessage]]) -> str:
    [messages] = asked
    request = messages[0]
    assert isinstance(request, ModelRequest)
    return "\n".join(
        part.content
        for part in request.parts
        if isinstance(part, UserPromptPart) and isinstance(part.content, str)
    )


async def lab_chat(session: AsyncSession, user: User) -> Chat:
    [chat] = await session.scalars(
        select(Chat).where(Chat.user_id == user.id, Chat.kind == "lab")
    )
    return chat


@pytest.fixture
async def solution(session: AsyncSession) -> None:
    session.add(
        LabSolution(
            lesson=LESSON, source=SOLUTION, content_version=bytes.fromhex(VERSION)
        )
    )
    await session.commit()


async def test_a_passed_check_is_reviewed_and_both_turns_are_stored(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    submission = await checked(notebook)

    with answering(reviewing()):
        response = await review(notebook, submission)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert text_of(response.text).strip() == REVIEW_TEXT
    chat = await lab_chat(session, user)
    assert events(response.text)[-1] == {
        "type": "done",
        "chat_id": str(chat.id),
        "url": f"{settings.FRONTEND_HOST}/courses/{COURSE}/lessons/{SLUG}?chat={chat.id}",
    }
    rows = await HarnessRepository(session, user.id).rows(chat)
    assert [row.role for row in rows] == ["user", "agent"]
    asked, answered = await HarnessRepository(session, user.id).history(chat)
    assert isinstance(asked, ModelRequest) and isinstance(answered, ModelResponse)
    check = asked.parts[0]
    assert isinstance(check, UserPromptPart)
    assert check.content == (
        "check surprisal: passed\n\n"
        '<untrusted source="learner-attachment">\n'
        f"`surprisal` (function)\n\n```\n{SOURCE}\n```\n</untrusted>"
    )
    reply = answered.parts[0]
    assert isinstance(reply, TextPart) and reply.content.strip() == REVIEW_TEXT
    # On the row the monthly ceiling sums, as a chat turn's is.
    assert rows[-1].usage is not None and rows[-1].usage["requests"] == 1
    assert chat.title == "check surprisal: passed"


@pytest.mark.usefixtures("solution")
async def test_the_review_is_asked_with_everything_it_needs(
    notebook: AsyncClient,
) -> None:
    submission = await checked(notebook)
    asked: list[list[ModelMessage]] = []

    with answering(reviewing(asked=asked)):
        await review(notebook, submission)

    prompt = prompt_of(asked)
    assert "Return the surprisal of each probability." in prompt
    assert '"seed": 1337' in prompt
    assert "1.0" in prompt and "expects" in prompt
    assert "passed" in prompt
    assert "`entropy-terms`: Return the per-term entropy contributions." in prompt
    assert SOLUTION in prompt
    assert f'<untrusted source="lab-submission">\n{SOURCE}\n</untrusted>' in prompt


async def test_a_failed_check_hands_the_wrong_answers_hint_to_the_review(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    submission = await checked(notebook, WRONG)
    asked: list[list[ModelMessage]] = []

    with answering(reviewing("Look at the log's base.", asked)):
        response = await review(notebook, submission)

    assert response.status_code == 200
    prompt = prompt_of(asked)
    assert "failed" in prompt
    assert "Natural log, not base two." in prompt
    asked_row, _ = await HarnessRepository(session, user.id).history(
        await lab_chat(session, user)
    )
    check = asked_row.parts[0]
    assert isinstance(check, UserPromptPart)
    assert str(check.content).startswith("check surprisal: failed\n\n")


async def test_a_question_after_the_review_continues_from_it(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    with answering(reviewing()):
        await review(notebook, await checked(notebook))
    with replying("the groupby version"):
        response = await ask(notebook, "show me the groupby version")

    chat = await lab_chat(session, user)
    assert events(response.text)[-1]["chat_id"] == str(chat.id)
    history = await HarnessRepository(session, user.id).history(chat)
    assert len(history) == 4


async def test_a_failing_review_stores_nothing_and_leaves_the_verdict_alone(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    submission = await checked(notebook)
    state = await session.get(LabCheckpointState, (user.id, LESSON, "surprisal"))
    assert state is not None
    before = (state.attempts, state.passed_at, state.feedback)

    with answering(down()):
        response = await review(notebook, submission)

    last = events(response.text)[-1]
    assert last["type"] == "error" and "the model is down" in last["detail"]
    chat = await lab_chat(session, user)
    assert await HarnessRepository(session, user.id).rows(chat) == []
    await session.refresh(state)
    assert (state.attempts, state.passed_at, state.feedback) == before
    stored = await session.get(LabSubmission, submission)
    assert stored is not None and stored.verdict["passed"] is True
    # The claim went with it: the learner's next question is not refused.
    with replying():
        assert (await ask(notebook, "why?")).status_code == 200


async def test_a_spent_budget_refuses_the_review_before_asking(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    submission = await checked(notebook)
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")
    await repo.add_messages(
        web,
        [ModelRequest(parts=[UserPromptPart(content="spent")])],
        role="system",
        usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
    )
    asked: list[list[ModelMessage]] = []

    with answering(reviewing(asked=asked)):
        response = await review(notebook, submission)

    assert response.status_code == 429
    assert asked == []


async def test_a_chat_with_a_run_in_flight_refuses_the_review(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    submission = await checked(notebook)
    repo = HarnessRepository(session, user.id)
    await repo.claim_run(await repo.lab_chat(LESSON), uuid.uuid4())

    with answering(reviewing()):
        response = await review(notebook, submission)

    assert response.status_code == 409


async def test_only_the_callers_own_submission_in_this_lab_is_reviewed(
    notebook: AsyncClient, session: AsyncSession, other_user: User
) -> None:
    theirs = LabSubmission(
        id=uuid.uuid4(),
        user_id=other_user.id,
        lesson=LESSON,
        checkpoint="surprisal",
        verdict={"passed": True},
        source=SOURCE,
    )
    session.add(theirs)
    await session.commit()

    with answering(reviewing()):
        assert (await review(notebook, theirs.id)).status_code == 404
        assert (await review(notebook, uuid.uuid4())).status_code == 404
        mine = await checked(notebook)
        elsewhere = await notebook.post(
            f"{LABS}/{COURSE}/no-such-lab/review", json={"submission_id": str(mine)}
        )
        assert elsewhere.status_code == 404


async def test_a_submission_with_no_function_is_not_reviewed(
    notebook: AsyncClient,
) -> None:
    without = await checked(notebook, source=None)
    predicted = uuid.uuid4()
    await post(notebook, "beat-baseline", PASSING, id=predicted)

    with answering(reviewing()):
        assert (await review(notebook, without)).status_code == 400
        assert (await review(notebook, predicted)).status_code == 400


async def test_a_submission_from_a_client_without_source_is_still_graded(
    notebook: AsyncClient, session: AsyncSession
) -> None:
    submission = uuid.uuid4()
    response = await post(notebook, "surprisal", SURPRISAL, id=submission)

    assert response.status_code == 200 and response.json()["passed"] is True
    stored = await session.get(LabSubmission, submission)
    assert stored is not None and stored.source is None


async def test_a_long_source_is_clamped_rather_than_refused(
    notebook: AsyncClient, session: AsyncSession
) -> None:
    submission = await checked(notebook, source="x" * 30_000)

    stored = await session.get(LabSubmission, submission)
    assert stored is not None and stored.source == "x" * 20_000


async def test_the_review_model_is_the_setting(
    notebook: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    submission = await checked(notebook)
    chosen: list[str] = []

    def recording(openrouter_id: str) -> Any:
        chosen.append(openrouter_id)
        return model_for(openrouter_id)

    monkeypatch.setattr(settings, "LAB_REVIEW_MODEL", "moonshotai/kimi-k3")
    monkeypatch.setattr(check_review, "model_for", recording)
    with answering(reviewing()):
        await review(notebook, submission)

    assert chosen == ["moonshotai/kimi-k3"]
