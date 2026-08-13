import uuid
from collections.abc import AsyncGenerator, Iterator
from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.labs import judge, repository
from app.models import Document, Event, LabChallenge, User
from app.telemetry import schemas as telemetry
from tests.harness.conftest import call

LABS = f"{settings.API_V1_STR}/labs"
COURSE = "information-theory"
SLUG = "surprisal-lab"
LESSON = f"lesson:{COURSE}/{SLUG}"
MANIFEST = f"{LABS}/{COURSE}/{SLUG}/manifest"
PROGRESS = f"{LABS}/{COURSE}/{SLUG}/progress"
SUBMISSIONS = f"{LABS}/submissions"

VERSION = "a1" * 32
DIGEST = "b2" * 32
MIRROR = "https://raw.githubusercontent.com/galthran-wq/distillcourse-labs/main/labs"

# Held-out labels and a set of predictions whose roc_auc is 0.8125 — under the
# threshold below, and over it once the two mistakes are corrected.
LABELS = [0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0]
THRESHOLD = 0.85

# The shape the build writes: the display half comes from `documents`, the
# public and private halves of each challenge from `labs-dist/private`.
DECLARED: list[dict[str, Any]] = [
    {
        "id": "surprisal",
        "kind": "exact",
        "text": "Return the surprisal of each probability.",
        "required": True,
        "order": 0,
    },
    {
        "id": "entropy-terms",
        "kind": "exact",
        "text": "Return the per-term entropy contributions.",
        "required": True,
        "order": 1,
    },
    {
        "id": "beat-baseline",
        "kind": "metric",
        "text": "Beat the baseline on the held-out set.",
        "required": True,
        "order": 2,
    },
    {
        "id": "why-uniform",
        "kind": "review",
        "text": "Say why the uniform distribution maximises entropy.",
        "required": False,
        "order": 3,
    },
]

SPECS: dict[str, dict[str, Any]] = {
    "surprisal": {
        "public": {
            "seed": 1337,
            "inputs_code": "p = rng.random(4)\ninputs = (p,)\n",
            "atol": 1e-06,
        },
        "private": {
            "atol": 1e-06,
            "expected": {"values": [[1.0, 2.0, 3.0]]},
            "wrong": [
                {"hint": "Natural log, not base two.", "values": [[0.6931, 1.3863]]}
            ],
        },
    },
    "entropy-terms": {
        "public": {
            "seed": 7,
            "inputs_code": "p = rng.random((20, 5))\ninputs = (p,)\n",
            "atol": 1e-06,
        },
        "private": {"atol": 1e-06, "expected": {"digest": DIGEST}, "wrong": []},
    },
    "beat-baseline": {
        "public": {
            "metric": "roc_auc",
            "threshold": THRESHOLD,
            "holdout": "data/holdout.csv",
        },
        "private": {
            "metric": "roc_auc",
            "threshold": THRESHOLD,
            "labels": LABELS,
            "reference_score": 0.98,
        },
    },
    "why-uniform": {
        "public": {},
        "private": {"rubric": "Pass if the answer names the constraint."},
    },
}

# A learner's two attempts at the metric checkpoint: one short of the
# threshold, one over. And the output the first checkpoint expects.
PASSING = [0.1, 0.2, 0.7, 0.8, 0.3, 0.6, 0.9, 0.05]
FAILING = [0.1, 0.4, 0.35, 0.8, 0.4, 0.4, 0.9, 0.2]
SURPRISAL = {"values": [[1.0, 2.0, 3.0]]}


def rows(lesson: str = LESSON) -> list[Any]:
    """The lab as both halves of the ingest leave it."""
    return [
        Document(
            corpus="lesson",
            course_slug=COURSE,
            locator=lesson,
            title="A lab",
            breadcrumb="Information theory › A lab",
            text="Some body text.",
            anchors=[],
            position=0,
            meta={
                "word_count": 3,
                "document_word_count": 3,
                "lab": {
                    "est_hours": 4,
                    "checkpoints": DECLARED,
                    "data_files": [f"{MIRROR}/{COURSE}/{SLUG}/data/holdout.csv"],
                },
            },
            content_hash="0" * 64,
        ),
        *(
            LabChallenge(
                lesson=lesson,
                checkpoint=entry["id"],
                kind=entry["kind"],
                spec=SPECS[entry["id"]],
                content_version=bytes.fromhex(VERSION),
            )
            for entry in DECLARED
        ),
    ]


def judging(
    calls: list[list[ModelMessage]] | None = None, **answer: Any
) -> FunctionModel:
    """The judge, answered from the test rather than from a model.

    Records what it was asked wherever it is given somewhere to record it, and
    answers with whatever it is handed — including output the schema refuses.
    """
    args = {"passed": True, "feedback": "Names the constraint."} | answer

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        if calls is not None:
            calls.append(messages)
        return call(info.output_tools[0].name, **args)

    return FunctionModel(turn)


def refusing(failure: Exception) -> FunctionModel:
    """The judge, down."""

    def turn(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise failure

    return FunctionModel(turn)


@pytest.fixture(autouse=True)
def judged() -> Iterator[None]:
    """No test in this package reaches a model: every review submission is
    graded by this one, and a test that cares what the judge says overrides it
    again."""
    with judge.agent.override(model=judging()):
        yield


@pytest.fixture
async def lab(session: AsyncSession) -> None:
    session.add_all(rows())
    await session.commit()


@pytest.fixture
async def notebook(
    client: AsyncClient, session: AsyncSession, user: User
) -> AsyncGenerator[AsyncClient]:
    """A client holding a bearer token, the way a paired notebook does."""
    now = datetime.now(UTC)
    code = await repository.issue_code(session, user.id, now=now)
    token = await repository.redeem(session, code.code, now=now)
    client.headers["authorization"] = f"Bearer {token}"
    yield client


def submission(
    checkpoint: str,
    payload: Any,
    *,
    id: uuid.UUID | None = None,
    lesson: str = LESSON,
    content_version: str = VERSION,
) -> dict[str, Any]:
    return {
        "id": str(id or uuid.uuid4()),
        "lesson": lesson,
        "checkpoint": checkpoint,
        "content_version": content_version,
        "payload": payload,
    }


async def post(
    client: AsyncClient, checkpoint: str, payload: Any, **kwargs: Any
) -> Any:
    return await client.post(
        SUBMISSIONS, json=submission(checkpoint, payload, **kwargs)
    )


async def completions(session: AsyncSession, user: User) -> int:
    """How many times this learner has been told they finished the lesson."""
    events = await session.scalars(
        select(Event).where(Event.user_id == user.id, Event.type == telemetry.COMPLETED)
    )
    return len(list(events))
