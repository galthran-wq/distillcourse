"""The ladder in the database, and the deliveries it materialises.

`review_state` is the truth about what is owed; a `schedules` row is one
attempt at delivering it. Keeping the two apart is what makes the delivery
layer disposable: a bug that loses, duplicates or cancels schedule rows is
repaired by the next poller cycle, because the ladder is still standing.
"""

import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import ColumnElement, and_, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ReviewState, Schedule, TgLink
from app.review import ladder
from app.review.ladder import Outcome, Rung, Settlement
from app.scheduling.repository import WAITING

# A delivery still on its way to the learner, or waiting for their answer.
# While one exists the ladder is represented in the queue already.
LIVE = (*WAITING, "awaiting_reply")
# What `settle` and the outcome tool write into a delivered row's payload: the
# only record of whether that delivery has been accounted for.
OUTCOME = "outcome"
GRADES = ("passed", "partial", "failed")


def _course(lesson: str) -> str:
    # `lesson:<course>/<slug>` — the course is the topic the poller rotates
    # away from after an ignored message.
    return lesson.partition(":")[2].partition("/")[0]


def _about(lesson: object) -> ColumnElement[bool]:
    """Schedule rows that are the review of one lesson. `lesson` is a value or
    a column, which is what lets the same predicate be correlated."""
    matches: ColumnElement[bool] = Schedule.payload["lesson"].astext == lesson
    return matches


def _of_a_ladder() -> ColumnElement[bool]:
    """A delivery this module owns. A review row that names no lesson was put
    in the queue by something other than a ladder, and nothing here can say
    what it was of."""
    return and_(Schedule.kind == "review", Schedule.payload.has_key("lesson"))


def rung(state: ReviewState) -> Rung:
    return Rung(step=state.step, next_due_at=state.next_due_at)


async def start(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, completed_at: datetime
) -> None:
    """Open a ladder for a lesson that was just finished.

    Does nothing where one exists, which is the whole reason the ladder is a
    table: the same completion can be derived again — a replayed flush, a
    rebuild — and a second first review is not a thing to hand out. The caller
    owns the transaction.
    """
    opening = ladder.started(completed_at)
    await session.execute(
        insert(ReviewState)
        .values(
            user_id=user_id,
            lesson=lesson,
            step=opening.step,
            next_due_at=opening.next_due_at,
        )
        .on_conflict_do_nothing(index_elements=["user_id", "lesson"])
    )


async def state_of(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> ReviewState | None:
    return await session.get(ReviewState, (user_id, lesson))


async def delivery(
    session: AsyncSession, user_id: uuid.UUID, schedule_id: uuid.UUID
) -> Schedule | None:
    """One delivered review of this learner's, by the id its context quoted."""
    row: Schedule | None = await session.scalar(
        select(Schedule).where(
            Schedule.id == schedule_id, Schedule.user_id == user_id, _of_a_ladder()
        )
    )
    return row


async def _move(
    session: AsyncSession,
    state: ReviewState,
    to: Rung,
    *,
    outcome: Outcome | Settlement,
    now: datetime,
) -> None:
    state.step = to.step
    state.next_due_at = to.next_due_at
    state.last_outcome = outcome
    state.updated_at = now
    await session.commit()


async def apply(
    session: AsyncSession,
    user_id: uuid.UUID,
    lesson: str,
    outcome: Outcome,
    now: datetime,
) -> ReviewState | None:
    """Move the ladder of one lesson, as the tutor graded it."""
    state = await state_of(session, user_id, lesson)
    if state is None:
        return None
    await _move(
        session,
        state,
        ladder.advance(rung(state), outcome, now),
        outcome=outcome,
        now=now,
    )
    return state


async def materialize(session: AsyncSession, now: datetime) -> Sequence[Schedule]:
    """Turn the ladders that have come due into rows the poller can deliver.

    Nothing is materialised for a learner with no working Telegram: the review
    transport is that thread, and a row with nowhere to go would be cancelled
    on sight and made again every cycle for as long as they live. Pairing later
    needs no repair — the ladder is still there, and its rows appear next cycle.
    """
    reachable = (
        select(TgLink.user_id)
        .where(TgLink.user_id == ReviewState.user_id, TgLink.status == "active")
        .correlate(ReviewState)
        .exists()
    )
    queued = (
        select(Schedule.id)
        .where(
            Schedule.user_id == ReviewState.user_id,
            Schedule.kind == "review",
            _about(ReviewState.lesson),
            Schedule.status.in_(LIVE),
        )
        .correlate(ReviewState)
        .exists()
    )
    states = (
        await session.scalars(
            select(ReviewState)
            .where(
                ReviewState.next_due_at.is_not(None),
                ReviewState.next_due_at <= now,
                reachable,
                ~queued,
            )
            # The lock discipline the poller claims with: a second worker skips
            # the ladders this one is materialising rather than delivering them
            # a second time.
            .with_for_update(skip_locked=True, of=ReviewState)
        )
    ).all()
    rows = [
        Schedule(
            user_id=state.user_id,
            kind="review",
            due_at=due_at,
            payload={
                "lesson": state.lesson,
                "note": f"a review of {state.lesson} is due",
                "topic": _course(state.lesson),
                "step": state.step,
            },
            status="pending",
            created_by="system",
        )
        for state in states
        if (due_at := state.next_due_at) is not None
    ]
    session.add_all(rows)
    await session.commit()
    return rows


async def mark(session: AsyncSession, row: Schedule, outcome: str) -> None:
    # Reassigned rather than mutated: SQLAlchemy compares a JSONB attribute by
    # identity, and a dict changed in place is not seen as changed at all.
    row.payload = {**row.payload, OUTCOME: outcome}
    await session.commit()


async def _reviews(
    session: AsyncSession, *where: ColumnElement[bool]
) -> Sequence[Schedule]:
    return (
        await session.scalars(
            select(Schedule).where(_of_a_ladder(), *where).order_by(Schedule.claimed_at)
        )
    ).all()


async def settle(session: AsyncSession, now: datetime) -> None:
    """Account for review sessions that are over and were never graded.

    A session the learner never answered is an `ignored` rung. A session they
    did answer, on the items the tutor did not report, is a deferral and
    nothing more: what they said counted, and the rest is asked another day
    rather than held against them.
    """
    for row in await _reviews(
        session,
        # No key at all, so a row is accounted for exactly once — unlike the
        # predicate `ungraded` reads by, which lets a late answer overwrite a
        # settlement that is already written.
        ~Schedule.payload.has_key(OUTCOME),
        Schedule.status == "done",
        Schedule.outcome.is_not(None),
    ):
        state = await state_of(session, row.user_id, row.payload["lesson"])
        settlement: Settlement = "ignored" if row.outcome == "ignored" else "deferred"
        if state is not None:
            to = (
                ladder.advance(rung(state), "ignored", now)
                if settlement == "ignored"
                else ladder.deferred(rung(state), now)
            )
            await _move(session, state, to, outcome=settlement, now=now)
        await mark(session, row, settlement)


async def ungraded(
    session: AsyncSession, user_id: uuid.UUID, since: datetime
) -> Sequence[Schedule]:
    """The reviews this learner still owes an answer on.

    The slot that is open, and the ones that closed recently: a learner who
    answers an hour after we gave up is answering, and the tutor grades that
    from the thread rather than telling them they are too late. An ignore or a
    deferral is not a grade, so those rows are still here — the ladder is where
    a late answer is applied, and an ignore left the rung exactly where it was.
    """
    return await _reviews(
        session,
        func.coalesce(Schedule.payload[OUTCOME].astext, "").notin_(GRADES),
        Schedule.user_id == user_id,
        Schedule.claimed_at >= since,
        Schedule.status.in_(("awaiting_reply", "done")),
    )


async def cancel_deliveries(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> None:
    """Drop what is queued for a lesson whose rung has just moved.

    A late answer is graded against a review the ladder had already given up on
    and put back in the queue; that queued copy asks about a rung the learner
    is no longer on.
    """
    rows = await session.scalars(
        select(Schedule).where(
            Schedule.user_id == user_id,
            _of_a_ladder(),
            _about(lesson),
            Schedule.status.in_(WAITING),
        )
    )
    for row in rows:
        row.status = "cancelled"
    await session.commit()
