import re
from datetime import datetime, timedelta

import pytest
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.models import ReviewState, Schedule, User
from tests.conftest import Bot
from tests.content.conftest import corpus_index  # noqa: F401  (a shared fixture)
from tests.harness.conftest import call
from tests.scheduling.conftest import NOON, thread  # noqa: F401  (a shared fixture)
from tests.telegram.conftest import (  # noqa: F401  (shared fixtures and helpers)
    configured_bot,
    deliver,
    message,
)
from tests.telemetry.conftest import indexed_lesson  # noqa: F401  (a shared fixture)

# A lesson the fixture corpus really carries, in the middle of its course, so
# it has a lesson either side to draw confusable concepts from.
LESSON = "lesson:information-theory/entropy-as-average-surprise"
# How the review block names an item, and how the model in these tests finds
# the id it has to report an outcome under.
SCHEDULE_ID = re.compile(r"schedule `([0-9a-f-]{36})`")


@pytest.fixture
async def indexed_course(
    session: AsyncSession,
    corpus_index: ContentIndex,  # noqa: F811
) -> None:
    await ingest(session, corpus_index)


async def ladder(
    session: AsyncSession,
    user: User,
    *,
    lesson: str = LESSON,
    step: int = 0,
    due_at: datetime | None = NOON - timedelta(minutes=1),
) -> ReviewState:
    row = ReviewState(user_id=user.id, lesson=lesson, step=step, next_due_at=due_at)
    session.add(row)
    await session.commit()
    return row


async def reviews(session: AsyncSession, user: User) -> list[Schedule]:
    """This learner's review deliveries, delivered ones first. Rows made in one
    transaction share a `created_at`, so it is no order at all."""
    return list(
        await session.scalars(
            select(Schedule)
            .where(Schedule.user_id == user.id, Schedule.kind == "review")
            .order_by(Schedule.claimed_at.nullslast(), Schedule.due_at)
        )
    )


def echoed(bot: Bot) -> str:
    """What an echoing tutor sent back, reassembled. A prompt is longer than one
    Telegram message, so the outbox cuts it up on its line breaks."""
    return "\n".join(bot.texts)


def instructions(messages: list[ModelMessage]) -> str:
    """The prompt the harness assembled, as the model was handed it."""
    return "\n".join(
        request.instructions
        for request in messages
        if isinstance(request, ModelRequest) and request.instructions
    )


def grading(*outcomes: str, notes: str | None = None) -> FunctionModel:
    """A model that grades the reviews in its context, one turn each.

    It counts its own calls rather than reading them out of the history: the
    thread it runs in may already hold the tool returns of an earlier review.
    """
    reported = 0

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        nonlocal reported
        items = SCHEDULE_ID.findall(instructions(messages))
        if reported < min(len(outcomes), len(items)):
            arguments: dict[str, object] = {
                "schedule_id": items[reported],
                "outcome": outcomes[reported],
            }
            if notes is not None:
                arguments["notes"] = notes
            reported += 1
            return call("report_review_outcome", **arguments)
        return ModelResponse(parts=[TextPart(content="that is what I had in mind")])

    return FunctionModel(turn)
