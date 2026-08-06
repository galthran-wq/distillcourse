"""The ladder against the database: how it opens, and how it becomes a message."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.models import ReviewState, Schedule, TgLink, User
from app.review import ladder
from app.review import repository as review
from app.scheduling import repository as scheduling
from tests.review.conftest import LESSON, reviews
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
    state = await review.apply(session, user.id, READ_LESSON, "passed", NOW)
    assert state is not None
    climbed = (state.step, state.next_due_at)

    await cli.rebuild_progress(session)

    await session.refresh(state)
    assert await ladders(session) == 1
    assert (state.step, state.next_due_at) == climbed


async def test_a_second_completion_of_the_same_lesson_changes_nothing(
    session: AsyncSession, user: User
) -> None:
    await review.start(session, user.id, LESSON, NOW)
    await review.apply(session, user.id, LESSON, "passed", NOW)

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
    assert rows[0].payload["lesson"] == LESSON
    assert rows[0].payload["topic"] == "information-theory"
    assert rows[0].payload["step"] == state.step
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


async def delivered(
    session: AsyncSession, user: User, *, outcome: str
) -> tuple[ReviewState, Schedule]:
    """A review that went out and whose session is over, one way or the other."""
    state = await ladder_row(session, user, step=1)
    row = (await review.materialize(session, NOON))[0]
    row.claimed_at = NOON
    row.status = "done"
    row.outcome = outcome
    await session.commit()
    return state, row


@pytest.mark.usefixtures("link")
async def test_a_session_nobody_answered_is_an_ignore(
    session: AsyncSession, user: User
) -> None:
    state, row = await delivered(session, user, outcome="ignored")

    await review.settle(session, NOON)

    await session.refresh(state)
    assert (state.step, state.last_outcome) == (1, "ignored")
    assert state.next_due_at == NOON + ladder.STEPS[1]
    assert row.payload["outcome"] == "ignored"


@pytest.mark.usefixtures("link")
async def test_an_answered_session_defers_what_it_never_reached(
    session: AsyncSession, user: User
) -> None:
    """They replied, so this item was not ignored — the tutor simply never got
    to it. It waits a day and the rung does not move."""
    state, row = await delivered(session, user, outcome="answered")

    await review.settle(session, NOON)

    await session.refresh(state)
    assert (state.step, state.last_outcome) == (1, "deferred")
    assert state.next_due_at == NOON + ladder.DEFERRAL
    assert row.payload["outcome"] == "deferred"


@pytest.mark.usefixtures("link")
async def test_a_session_is_settled_once(session: AsyncSession, user: User) -> None:
    state, _ = await delivered(session, user, outcome="ignored")

    await review.settle(session, NOON)
    await review.settle(session, NOON + timedelta(hours=1))

    await session.refresh(state)
    assert state.next_due_at == NOON + ladder.STEPS[1]


@pytest.mark.usefixtures("link")
async def test_a_delivery_out_of_attempts_is_settled_rather_than_queued_forever(
    session: AsyncSession, user: User
) -> None:
    """`failed` is neither live nor settled by the answered path, and the ladder
    behind it stays due in the past: unaccounted for, every cycle makes the same
    review again. Our outage says nothing about the learner, so it is a deferral.
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
async def test_a_cancelled_delivery_is_not_swept_back_into_the_queue(
    session: AsyncSession, user: User
) -> None:
    """Cancelling clears the lease, as every other transition does. A row that
    kept one is a row `sweep_leases` hands back as if its worker had died."""
    await ladder_row(session, user)
    await review.materialize(session, NOON)
    row = (await scheduling.claim_due(session, NOON))[0]

    await review.cancel_deliveries(session, user.id, LESSON)
    await scheduling.sweep_leases(
        session, NOON + scheduling.LEASE + timedelta(minutes=1)
    )

    await session.refresh(row)
    assert (row.status, row.lease_until) == ("cancelled", None)


@pytest.mark.usefixtures("link")
async def test_a_graded_session_is_not_settled_over(
    session: AsyncSession, user: User
) -> None:
    """What the tutor reported stands: the sweep accounts for the ungraded and
    leaves everything else where the grade put it."""
    state, row = await delivered(session, user, outcome="answered")
    await review.apply(session, user.id, LESSON, "passed", NOON)
    await review.mark(session, row, "passed")

    await review.settle(session, NOON)

    await session.refresh(state)
    assert (state.step, state.last_outcome) == (2, "passed")
