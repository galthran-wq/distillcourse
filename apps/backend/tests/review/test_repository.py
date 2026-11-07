"""The ladder against the database: how it opens, and how it becomes a message."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.models import CardDelivery, LessonProgress, ReviewState, TgLink, User
from app.review import ladder
from app.review import repository as review
from tests.review.conftest import LESSON, reviews, stored_card
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


@pytest.mark.usefixtures("link")
async def test_a_due_ladder_becomes_exactly_one_delivery(
    session: AsyncSession, user: User
) -> None:
    state = await ladder_row(session, user)

    await review.materialize(session, NOON)
    await review.materialize(session, NOON)

    rows = await reviews(session, user)
    assert len(rows) == 1
    assert rows[0].payload == {"lesson": LESSON, "completed_at": None}
    assert (rows[0].status, rows[0].due_at) == ("pending", state.next_due_at)


@pytest.mark.usefixtures("link")
async def test_a_ladder_that_is_not_due_yet_is_not_delivered(
    session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user, due_at=NOON + timedelta(days=1))

    await review.materialize(session, NOON)

    assert await reviews(session, user) == []


@pytest.mark.usefixtures("link")
async def test_a_finished_ladder_is_never_delivered_again(
    session: AsyncSession, user: User
) -> None:
    await ladder_row(session, user, step=len(ladder.STEPS), due_at=None)

    await review.materialize(session, NOON)

    assert await reviews(session, user) == []


async def test_nothing_is_materialised_before_the_channel_exists(
    session: AsyncSession, user: User
) -> None:
    """A review with nowhere to go is not a row: the poller would cancel it on
    sight and the next cycle would make it again, every cycle, forever. Pairing
    later needs no repair — the ladder stood the whole time."""
    await ladder_row(session, user)

    await review.materialize(session, NOON)
    assert await reviews(session, user) == []

    session.add(TgLink(user_id=user.id, tg_chat_id=99))
    await session.commit()
    await review.materialize(session, NOON)

    assert len(await reviews(session, user)) == 1


@pytest.mark.usefixtures("link")
async def test_a_broken_channel_materialises_nothing(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    await ladder_row(session, user)
    link.status = "broken"
    await session.commit()

    await review.materialize(session, NOON)

    assert await reviews(session, user) == []


@pytest.mark.usefixtures("link", "indexed_section")
async def test_a_lesson_a_card_was_sent_for_rests_for_three_days(
    session: AsyncSession, user: User
) -> None:
    """A card left unanswered leaves its ladder due. The lesson does not come
    straight back as the next message; it waits out the rest, and then it does.
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

    await review.materialize(session, NOON)
    assert await reviews(session, user) == []

    await review.materialize(session, NOON + timedelta(hours=1))
    assert len(await reviews(session, user)) == 1


@pytest.mark.usefixtures("link")
async def test_a_review_carries_when_its_lesson_was_finished(
    session: AsyncSession, user: User
) -> None:
    """What the poller ranks one learner's due reviews by."""
    await ladder_row(session, user)
    finished = NOON - timedelta(days=2)
    session.add(
        LessonProgress(
            user_id=user.id,
            lesson=LESSON,
            active_seconds=600,
            max_scroll_pct=100,
            proofs_opened=0,
            solutions_opened=0,
            demos_touched=0,
            first_seen=finished,
            last_seen=finished,
            completed_at=finished,
        )
    )
    await session.commit()

    [row] = await review.materialize(session, NOON)

    assert row.payload["completed_at"] == finished.isoformat()


@pytest.mark.usefixtures("link")
async def test_a_delivery_out_of_attempts_is_settled_rather_than_queued_forever(
    session: AsyncSession, user: User
) -> None:
    """A failed row is not live, and the ladder behind it stays due in the
    past: unaccounted for, every cycle makes the same review again. Our outage
    says nothing about the learner, so it is a deferral.
    """
    state = await ladder_row(session, user, step=1)
    row = (await review.materialize(session, NOON))[0]
    row.claimed_at = NOON
    row.status = "failed"
    await session.commit()

    await review.settle(session, NOON)
    await review.materialize(session, NOON)

    await session.refresh(state)
    assert (state.step, state.last_outcome) == (1, "deferred")
    assert state.next_due_at == NOON + ladder.DEFERRAL
    assert [item.status for item in await reviews(session, user)] == ["failed"]


@pytest.mark.usefixtures("link")
async def test_a_failed_delivery_is_settled_once(
    session: AsyncSession, user: User
) -> None:
    state = await ladder_row(session, user, step=1)
    row = (await review.materialize(session, NOON))[0]
    row.status = "failed"
    await session.commit()

    await review.settle(session, NOON)
    await review.settle(session, NOON + timedelta(hours=1))

    await session.refresh(state)
    assert state.next_due_at == NOON + ladder.DEFERRAL
