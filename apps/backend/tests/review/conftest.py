import re
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Any

import pytest
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

from app.content.ingest import ingest
from app.content.schemas import ContentIndex
from app.harness.agent import tutor
from app.models import Document, ReviewCard, ReviewState, Schedule, User
from app.review import writer
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
# A section the fixture lesson really has, which the cards below test.
SECTION = "the-probability-weighted-average-of-surprisal"
# How the review block names a card, and how the model in these tests finds
# the id it has to report an outcome under.
DELIVERY_ID = re.compile(r"delivery `([0-9a-f-]{36})`")


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
    level: int = 1,
    due_at: datetime | None = NOON - timedelta(minutes=1),
) -> ReviewState:
    row = ReviewState(
        user_id=user.id, lesson=lesson, step=step, level=level, next_due_at=due_at
    )
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
    """A model that grades the cards in its context, one turn each.

    It counts its own calls rather than reading them out of the history: the
    thread it runs in may already hold the tool returns of an earlier review.
    """
    reported = 0

    def turn(messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        nonlocal reported
        items = DELIVERY_ID.findall(instructions(messages))
        if reported < min(len(outcomes), len(items)):
            arguments: dict[str, object] = {
                "delivery_id": items[reported],
                "outcome": outcomes[reported],
            }
            if notes is not None:
                arguments["notes"] = notes
            reported += 1
            return call("report_review_outcome", **arguments)
        return ModelResponse(parts=[TextPart(content="that is what I had in mind")])

    return FunctionModel(turn)


@pytest.fixture
async def indexed_section(session: AsyncSession) -> None:
    """The one section of the lesson the cards test, as the index holds it —
    enough for a card to be fresh without ingesting the whole course."""
    session.add(
        Document(
            corpus="lesson",
            course_slug="information-theory",
            locator=f"{LESSON}#{SECTION}",
            title="The probability-weighted average of surprisal",
            breadcrumb="Information Theory › Entropy › The average",
            text="Entropy is the probability-weighted average of surprisal.",
            anchors=[SECTION],
            position=0,
            meta={"word_count": 7},
            content_hash="a" * 64,
        )
    )
    await session.commit()


async def section_hash(session: AsyncSession, anchor: str = SECTION) -> str:
    found = await session.scalar(
        select(Document.content_hash).where(Document.locator == f"{LESSON}#{anchor}")
    )
    assert found is not None
    return found


async def stored_card(
    session: AsyncSession,
    *,
    level: int = 1,
    prompt: str = "Entropy is the ____ of surprisal.",
    content_hash: str | None = None,
    owner: User | None = None,
) -> ReviewCard:
    """A card already written and checked, from the section as it stands."""
    card = ReviewCard(
        lesson=LESSON,
        anchor=SECTION,
        kind="gap",
        level=level,
        prompt=prompt,
        options=["average", "maximum", "variance"],
        answer=0,
        explanation="Each outcome's surprisal, weighted by how often it happens.",
        owner_id=None if owner is None else owner.id,
        content_hash=content_hash or await section_hash(session),
    )
    session.add(card)
    await session.commit()
    return card


def draft(**overrides: Any) -> dict[str, Any]:
    return {
        "kind": "gap",
        "section": SECTION,
        "prompt": "Entropy is the ____ of surprisal.",
        "options": ["average", "maximum", "variance"],
        "answer": 0,
        "explanation": "Each outcome's surprisal, weighted by how often it happens.",
    } | overrides


def writing(*drafts: dict[str, Any], asked: list[str] | None = None) -> FunctionModel:
    """The card writer, answered from the test: a batch of three by default."""
    batch = list(drafts) or [draft(prompt=f"Card {index}: ____") for index in range(3)]

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        if asked is not None:
            asked.append(prompt_of(messages))
        return call(info.output_tools[0].name, cards=batch)

    return FunctionModel(turn)


def checking(*passed: bool) -> FunctionModel:
    """The checker, passing or failing each card of the batch in order; a card
    past the end of `passed` passes."""

    def turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        count = prompt_of(messages).count("### Card ")
        verdicts = [*passed, *[True] * count][:count]
        return call(
            info.output_tools[0].name,
            checks=[
                {
                    "card": index,
                    "answer_right": ok,
                    "others_wrong": True,
                    "one_answer": True,
                    "main_point": True,
                }
                for index, ok in enumerate(verdicts)
            ],
        )

    return FunctionModel(turn)


def prompt_of(messages: list[ModelMessage]) -> str:
    return "\n".join(
        str(part.content)
        for request in messages
        if isinstance(request, ModelRequest)
        for part in request.parts
        if isinstance(part, UserPromptPart)
    )


def untouchable(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
    raise AssertionError("no model may be asked")


@contextmanager
def no_model() -> Iterator[None]:
    """Every agent a review could reach, failing the test if it is asked."""
    model = FunctionModel(untouchable)
    with (
        tutor.override(model=model, tools=[]),
        writer.writer.override(model=model),
        writer.checker.override(model=model),
    ):
        yield


@contextmanager
def card_models(
    write: FunctionModel | None = None, check: FunctionModel | None = None
) -> Iterator[None]:
    with (
        writer.writer.override(model=write or writing()),
        writer.checker.override(model=check or checking()),
    ):
        yield
