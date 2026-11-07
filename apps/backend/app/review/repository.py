"""The ladder in the database, and the deliveries it materialises.

`review_state` is the truth about what is owed; a `schedules` row is one
attempt at delivering it. Keeping the two apart is what makes the delivery
layer disposable: a bug that loses, duplicates or cancels schedule rows is
repaired by the next poller cycle, because the ladder is still standing.

Transactions: `start` and `move` flush and leave the commit to the caller,
which records a graded card in the same transaction as the ladder it moves.
`settle` and `materialize` are cycle steps and commit their own batch.
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Literal

from sqlalchemy import ColumnElement, and_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    CardDelivery,
    LessonProgress,
    ReviewCard,
    ReviewState,
    Schedule,
    TgLink,
)
from app.review import ladder
from app.review.ladder import Rung
from app.scheduling import repository as scheduling

# A delivery still on its way to the learner. While one exists the ladder is
# represented in the queue already.
LIVE = scheduling.WAITING
# What `settle` writes into a failed row's payload: the only record of whether
# that row has been accounted for.
OUTCOME = "outcome"
# How long a lesson rests after a card of it was sent, answered or not. A
# ladder an unanswered card left due must not come straight back as the next
# message; another lesson, or nothing, goes first.
REST = timedelta(days=3)

Tapped = Literal["correct", "wrong"]


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


async def move(
    session: AsyncSession,
    state: ReviewState,
    to: Rung,
    *,
    outcome: str,
    now: datetime,
) -> None:
    state.step = to.step
    state.next_due_at = to.next_due_at
    state.last_outcome = outcome
    state.updated_at = now
    await session.flush()


async def postpone(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, now: datetime
) -> None:
    """Move a ladder out of today without moving its rung: what was due could
    not be put to the learner, for a reason that is ours."""
    state = await state_of(session, user_id, lesson)
    if state is not None:
        await move(
            session,
            state,
            ladder.deferred(rung(state), now),
            outcome="deferred",
            now=now,
        )


async def delivery(
    session: AsyncSession, user_id: uuid.UUID, delivery_id: uuid.UUID
) -> tuple[CardDelivery, ReviewCard] | None:
    """One card sent to this learner, locked: a tap and a written answer to
    the same card, or two taps, must not both grade it."""
    found = (
        await session.execute(
            select(CardDelivery, ReviewCard)
            .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
            .where(CardDelivery.id == delivery_id, CardDelivery.user_id == user_id)
            .with_for_update(of=CardDelivery)
        )
    ).first()
    return None if found is None else (found[0], found[1])


async def grade(
    session: AsyncSession,
    sent: CardDelivery,
    card: ReviewCard,
    outcome: Tapped | ladder.Outcome,
    *,
    chosen: int | None = None,
) -> ReviewState | None:
    """Record what became of a card and move its ladder; the caller commits.

    A tap moves the ladder no further than the card's level allows and moves
    the level with it. A written answer, graded by the tutor, is recall rather
    than recognition, so it moves the ladder as a review always did and leaves
    the level alone.
    """
    now = datetime.now(UTC)
    sent.answered_at = now
    sent.chosen = chosen
    sent.outcome = outcome
    state = await state_of(session, sent.user_id, card.lesson)
    if state is None:
        return None
    at = rung(state)
    match outcome:
        case "correct" | "wrong":
            state.level, state.level_run = ladder.next_level(
                state.level, state.level_run, outcome
            )
            to = ladder.after_card(at, card.level, outcome, now)
        case _:
            to = ladder.advance(at, outcome, now)
    await move(session, state, to, outcome=outcome, now=now)
    return state


async def materialize(session: AsyncSession, now: datetime) -> Sequence[Schedule]:
    """Turn the ladders that have come due into rows the poller can deliver.

    Nothing is materialised for a learner with no working Telegram: the review
    transport is that thread, and a row with nowhere to go would be cancelled
    on sight and made again every cycle for as long as they live. Pairing later
    needs no repair — the ladder is still there, and its rows appear next cycle.
    Nor for a lesson that is resting (`REST`): its ladder stays due, and a row
    appears once the rest is over.
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
    resting = (
        select(CardDelivery.id)
        .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
        .where(
            CardDelivery.user_id == ReviewState.user_id,
            ReviewCard.lesson == ReviewState.lesson,
            CardDelivery.sent_at > now - REST,
        )
        .correlate(ReviewState)
        .exists()
    )
    found = (
        await session.execute(
            select(ReviewState, LessonProgress.completed_at)
            .outerjoin(
                LessonProgress,
                and_(
                    LessonProgress.user_id == ReviewState.user_id,
                    LessonProgress.lesson == ReviewState.lesson,
                ),
            )
            .where(
                ReviewState.next_due_at.is_not(None),
                ReviewState.next_due_at <= now,
                reachable,
                ~queued,
                ~resting,
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
                # What the poller ranks the due reviews of one learner by: the
                # lesson finished last is the one they are likeliest to want.
                # A lab's ladder has no reading behind it and ranks last.
                "completed_at": None if completed is None else completed.isoformat(),
            },
            status="pending",
            created_by="system",
        )
        for state, completed in found
        if (due_at := state.next_due_at) is not None
    ]
    session.add_all(rows)
    await session.commit()
    return rows


async def settle(session: AsyncSession, now: datetime) -> None:
    """Account for review rows that ran out of attempts.

    Nothing else does: left alone, the ladder stays due in the past, so
    `materialize` queues the same review every cycle, forever. A failure of
    ours is not evidence about the learner, so it is a deferral and the rung
    does not move.
    """
    rows = (
        await session.scalars(
            select(Schedule).where(
                _of_a_ladder(),
                Schedule.status == "failed",
                # No key at all, so a row is accounted for exactly once.
                ~Schedule.payload.has_key(OUTCOME),
            )
        )
    ).all()
    for row in rows:
        await postpone(session, row.user_id, row.payload["lesson"], now)
        # Reassigned rather than mutated: SQLAlchemy compares a JSONB attribute
        # by identity, and a dict changed in place is not seen as changed.
        row.payload = {**row.payload, OUTCOME: "deferred"}
    await session.commit()
