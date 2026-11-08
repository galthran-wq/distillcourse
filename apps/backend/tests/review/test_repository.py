"""The ladder against the database: how it opens, and how it becomes a message."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.models import CardDelivery, LessonProgress, ReviewState, User
from app.review import ladder
from app.review import repository as review
from tests.review.conftest import LESSON, stored_card
from tests.review.conftest import ladder as ladder_row
from tests.scheduling.conftest import NOON
from tests.telemetry.conftest import (
    HEARTBEATS_TO_COMPLETE,
    aggregate,
    read,
)
from tests.telemetry.conftest import (
    LESSON as READ_LESSON,
)

NOW = datetime.now(UTC)


async def ladders(session: AsyncSession) -> int:
    return (await session.scalars(select(func.count()).select_from(ReviewState))).one()


async def climbed_once(session: AsyncSession, user: User, lesson: str) -> ReviewState:
    state = await review.state_of(session, user.id, lesson)
    assert state is not None
    to = ladder.advance(review.rung(state), "passed", NOW)
    await review.move(session, state, to, outcome="passed", now=NOW)
    await session.commit()
    return state


@pytest.mark.usefixtures("indexed_lesson")
async def test_finishing_a_lesson_opens_a_ladder_a_day_out(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The subscription: telemetry derives a completion, and the first review
    is due a day after the instant they finished — not a day after the flush."""
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    completed_at = (await aggregate(session, user)).completed_at
    state = await review.state_of(session, user.id, READ_LESSON)
    assert state is not None
    assert completed_at is not None
    assert (state.step, state.last_outcome) == (0, None)
    assert state.next_due_at == completed_at + ladder.STEPS[0]


@pytest.mark.usefixtures("indexed_lesson")
async def test_rebuilding_progress_creates_no_second_ladder(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    """`rebuild-progress` replays no side effects, and the ladder would survive
    it even if it did: a learner who has already been reviewed twice must not
    be put back on the first rung by an operator command."""
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    state = await climbed_once(session, user, READ_LESSON)
    climbed = (state.step, state.next_due_at)

    await cli.rebuild_progress(session)

    await session.refresh(state)
    assert await ladders(session) == 1
    assert (state.step, state.next_due_at) == climbed


async def test_a_second_completion_of_the_same_lesson_changes_nothing(
    session: AsyncSession, user: User
) -> None:
    await review.start(session, user.id, LESSON, NOW)
    await climbed_once(session, user, LESSON)

    await review.start(session, user.id, LESSON, NOW + timedelta(days=30))

    state = await review.state_of(session, user.id, LESSON)
    assert state is not None
    assert await ladders(session) == 1
    assert state.step == 1


async def test_only_a_ladder_that_opens_says_so(
    session: AsyncSession, user: User
) -> None:
    """What the coach is woken by: a lesson finished, not the same completion
    derived again by a later flush."""
    assert await review.start(session, user.id, LESSON, NOW)
    assert not await review.start(session, user.id, LESSON, NOW)


@pytest.mark.usefixtures("indexed_section")
async def test_a_lesson_a_card_was_sent_for_rests_for_three_days(
    session: AsyncSession, user: User
) -> None:
    """A card left unanswered leaves its ladder due. The lesson does not come
    straight back as the next card; it waits out the rest, and then it does.
    """
    await ladder_row(session, user)
    card = await stored_card(session)
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=NOON - review.REST + timedelta(hours=1),
        )
    )
    await session.commit()

    assert await review.due(session, user.id, NOON, recent_first=True) == []
    later = NOON + timedelta(hours=1)
    assert len(await review.due(session, user.id, later, recent_first=True)) == 1


def progress(user: User, lesson: str, finished: datetime | None) -> LessonProgress:
    moment = finished or NOON - timedelta(days=30)
    return LessonProgress(
        user_id=user.id,
        lesson=lesson,
        active_seconds=600,
        max_scroll_pct=100,
        proofs_opened=0,
        solutions_opened=0,
        demos_touched=0,
        first_seen=moment,
        last_seen=moment,
        completed_at=finished,
    )


async def test_the_lesson_finished_last_is_due_first_and_a_lab_last(
    session: AsyncSession, user: User
) -> None:
    """The weekly floor's order: the lesson still in their head first; a lab's
    ladder, with no reading behind it, after every lesson."""
    older, newer, lab = (f"{LESSON}-{name}" for name in ("older", "newer", "lab"))
    for lesson in (older, lab, newer):
        await ladder_row(session, user, lesson=lesson)
    session.add(progress(user, older, NOON - timedelta(days=5)))
    session.add(progress(user, newer, NOON - timedelta(days=1)))
    await session.commit()

    due = await review.due(session, user.id, NOON, recent_first=True)

    assert [state.lesson for state in due] == [newer, older, lab]
