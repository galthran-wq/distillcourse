"""A review as the learner meets it: a card out of the blue, a tap or a few
words back, and what that does to the schedule."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.agent import tutor
from app.memory import repository as memory
from app.models import CardDelivery, ReviewState, User
from app.review import cards, ladder, subject
from app.review import repository as review
from app.scheduling import worker
from tests.conftest import Bot
from tests.harness.conftest import echoing
from tests.review.conftest import (
    LESSON,
    card_models,
    echoed,
    grading,
    no_model,
    stored_card,
    writing,
)
from tests.review.conftest import (
    ladder as ladder_row,
)
from tests.scheduling.conftest import NOON
from tests.telegram.conftest import (  # noqa: F401  (a shared fixture)
    Ears,
    deliver,
    ears,
    message,
    tap,
    voice,
)
from tests.telemetry.conftest import (
    HEARTBEATS_TO_COMPLETE,
    aggregate,
    read,
)
from tests.telemetry.conftest import (
    LESSON as READ_LESSON,
)

# The tool stamps the ladder from the real clock, which no test can predict to
# the second.
SLACK = timedelta(minutes=2)

pytestmark = pytest.mark.usefixtures("thread")


def about(moment: datetime | None, expected: datetime) -> bool:
    return moment is not None and abs(moment - expected) < SLACK


async def state_of(session: AsyncSession, user: User, lesson: str) -> ReviewState:
    state = await review.state_of(session, user.id, lesson)
    assert state is not None
    await session.refresh(state)
    return state


async def card_out(session: AsyncSession, user: User) -> CardDelivery:
    """One poller cycle, and the card it sent."""
    with no_model():
        await worker.cycle(session, NOON)
    sent = await session.scalar(
        select(CardDelivery).where(CardDelivery.user_id == user.id)
    )
    assert sent is not None
    return sent


@pytest.mark.usefixtures("indexed_lesson")
async def test_a_finished_lesson_comes_back_as_a_card_and_a_right_tap_moves_it_on(
    signed_in: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """The whole loop: they read a lesson through, the ladder opens, a card
    about it arrives over Telegram a day later — written there and then,
    because none existed — and the tap decides when they see it again."""
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    completed_at = (await aggregate(session, user)).completed_at
    state = await state_of(session, user, READ_LESSON)
    assert completed_at is not None
    assert state.next_due_at == completed_at + ladder.STEPS[0]

    # The clock is the one thing a test cannot wait out: the ladder is moved to
    # today's waking hours, and the cycle runs there.
    state.next_due_at = NOON - timedelta(minutes=1)
    await session.commit()
    with card_models(write=writing(*[_surprise(index) for index in range(3)])):
        await worker.cycle(session, NOON)

    sent = await session.scalar(select(CardDelivery))
    assert sent is not None
    assert len(bot.sent) == 1

    with no_model():
        await deliver(signed_in, tap(f"k:{sent.id}:0"))

    state = await state_of(session, user, READ_LESSON)
    assert (state.step, state.level_run, state.last_outcome) == (1, 1, "correct")
    assert about(state.next_due_at, datetime.now(UTC) + ladder.STEPS[1])


def _surprise(index: int) -> dict[str, object]:
    # The telemetry fixture's lesson is indexed as one section, `surprise`.
    return {
        "kind": "choice",
        "section": "surprise",
        "prompt": f"Question {index}?",
        "options": ["right", "wrong"],
        "answer": 0,
        "explanation": "Because.",
    }


@pytest.mark.usefixtures("indexed_section")
async def test_a_written_answer_is_graded_by_the_tutor_once(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The learner wrote rather than tapped. The run is handed the card with
    its delivery id, grades it, and a second grade of the same card — an
    answer split across two messages — moves nothing."""
    await ladder_row(session, user, step=1)
    await stored_card(session)
    sent = await card_out(session, user)

    with tutor.override(model=grading("passed")):
        await deliver(client, message("the weighted average of surprisal"))
    with tutor.override(model=grading("passed")):
        await deliver(client, message("I mean the average", update_id=2))

    await session.refresh(sent)
    state = await state_of(session, user, LESSON)
    assert (sent.outcome, sent.chosen) == ("passed", None)
    assert (state.step, state.last_outcome) == (2, "passed")
    assert about(state.next_due_at, datetime.now(UTC) + ladder.STEPS[2])


@pytest.mark.usefixtures("indexed_section")
async def test_a_learner_who_writes_is_handed_the_cards_of_the_last_day(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    card = await stored_card(session)
    sent = await card_out(session, user)
    bot.sent.clear()

    with tutor.override(model=echoing()):
        await deliver(client, message("is it the second one?"))

    prompt = echoed(bot)
    assert subject.SENT in prompt
    assert f"delivery `{sent.id}`" in prompt
    assert card.prompt in prompt
    assert "report_review_outcome" in prompt
    # The rules for grading a written answer come with the cards.
    assert "Never ask for a written answer on your own account" in prompt


@pytest.mark.usefixtures("indexed_section")
async def test_a_spoken_answer_is_handed_the_open_card_like_a_typed_one(
    client: AsyncClient,
    session: AsyncSession,
    user: User,
    bot: Bot,
    ears: Ears,  # noqa: F811
) -> None:
    """Voice is transport: the transcript takes the typed answer's path, the
    card of the last day and all."""
    await ladder_row(session, user)
    card = await stored_card(session)
    sent = await card_out(session, user)
    bot.sent.clear()
    ears.heard = "the weighted average of surprisal"

    with tutor.override(model=echoing()):
        await deliver(client, voice())

    assert "<i>Heard:</i> the weighted average of surprisal" in bot.texts
    prompt = echoed(bot)
    assert subject.SENT in prompt
    assert f"delivery `{sent.id}`" in prompt
    assert card.prompt in prompt


@pytest.mark.usefixtures("indexed_section")
async def test_cards_older_than_a_day_are_not_in_the_context(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder_row(session, user)
    await stored_card(session)
    sent = await card_out(session, user)
    sent.sent_at = datetime.now(UTC) - timedelta(days=2)
    await session.commit()
    bot.sent.clear()

    with tutor.override(model=echoing()):
        await deliver(client, message("hello"))

    assert subject.SENT not in echoed(bot)


@pytest.mark.usefixtures("indexed_course")
async def test_the_writer_is_handed_the_concepts_the_lesson_teaches(
    session: AsyncSession, user: User
) -> None:
    """The subject is the essence, not the lesson's table of contents: the
    concepts it introduces, and the ones next door it is confused with."""
    asked: list[str] = []
    with card_models(write=writing(asked=asked)):
        await cards.write(session, user.id, LESSON, 1)

    assert "Entropy: Expected surprisal of a distribution" in asked[0]
    assert "confusable with Prefix code" in asked[0]


@pytest.mark.usefixtures("indexed_section")
async def test_what_a_written_answer_turned_up_is_carried_into_the_next_review(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """A note becomes a memory, and a memory is in the context of every run
    after it — so the next conversation starts from the sore spot."""
    note = "reverses the direction of KL"
    await ladder_row(session, user)
    await stored_card(session)
    await card_out(session, user)

    with tutor.override(model=grading("partial", notes=note)):
        await deliver(client, message("it is the distance between distributions"))

    kept = await memory.index(session, user.id)
    assert [row.content for row in kept] == [note]

    with tutor.override(model=echoing()):
        await deliver(client, message("anything else?", update_id=2))

    assert kept[0].slug in echoed(bot)
