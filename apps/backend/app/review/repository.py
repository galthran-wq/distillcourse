"""The ladder in the database, and the cards it was put as.

`review_state` says which lessons are owed a card and at what level. It is
advice: the coach (`app/coach/`) reads it and decides what is sent and when.

Transactions: everything here flushes and leaves the commit to the caller,
which records a graded card in the same transaction as the ladder it moves.
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Literal

from sqlalchemy import Exists, and_, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CardDelivery, LessonProgress, ReviewCard, ReviewState
from app.review import ladder
from app.review.ladder import Rung

# How long a lesson rests after a card of it was sent, answered or not. A
# ladder an unanswered card left due must not come straight back as the next
# message; another lesson, or nothing, goes first.
REST = timedelta(days=3)
# After two harder cards skipped in a row, only level 1 is served for this
# long from the second: the bot must not slide back into what was being
# ignored.
SKIP_HOLD = timedelta(days=7)
# The key `follow_ups` keeps "In my own words" under — the button's prefix —
# and what it holds until the answer is graded.
OWN_WORDS = "m"
ASKED = "asked"

Tapped = Literal["correct", "wrong"]


def _resting(now: datetime) -> Exists:
    """The ladder, correlated, had a card sent within REST."""
    return (
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


def rung(state: ReviewState) -> Rung:
    return Rung(step=state.step, next_due_at=state.next_due_at)


async def start(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, completed_at: datetime
) -> bool:
    """Open a ladder for a lesson that was just finished; whether it opened.

    Does nothing where one exists, which is the whole reason the ladder is a
    table: the same completion can be derived again — a replayed flush, a
    rebuild — and a second first review is not a thing to hand out. The caller
    owns the transaction.
    """
    opening = ladder.started(completed_at)
    opened = await session.scalar(
        insert(ReviewState)
        .values(
            user_id=user_id,
            lesson=lesson,
            step=opening.step,
            next_due_at=opening.next_due_at,
        )
        .on_conflict_do_nothing(index_elements=["user_id", "lesson"])
        .returning(ReviewState.lesson)
    )
    return opened is not None


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
    chosen: int | list[int] | None = None,
) -> ReviewState | None:
    """Record what became of a card and move its ladder; the caller commits.

    A tap moves the ladder no further than the card's level allows and moves
    the level with it. A written answer, graded by the tutor, is recall rather
    than recognition, so it moves the ladder as a review always did and leaves
    the level alone. A harder card the learner asked for moves only the level.
    """
    now = datetime.now(UTC)
    sent.answered_at = now
    sent.chosen = chosen
    sent.outcome = outcome
    state = await state_of(session, sent.user_id, card.lesson)
    if state is None:
        return None
    if sent.harder:
        _volunteered(state, card, outcome)
        await session.flush()
        return state
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


def _volunteered(
    state: ReviewState, card: ReviewCard, outcome: Tapped | ladder.Outcome
) -> None:
    """A harder card the learner asked for: a right answer earns the level it
    was asked at and starts a run there, never lowers one nor costs the run at
    the level already held, and a wrong one is not held against them."""
    if outcome in ("correct", "passed") and card.level > state.level:
        state.level, state.level_run = card.level, 0


def skip(sent: CardDelivery, now: datetime) -> None:
    """A card put aside unanswered. Nothing is learned from it, so nothing
    else moves; answering it now is no longer possible."""
    sent.answered_at = now
    sent.outcome = "skipped"


async def recall(
    session: AsyncSession, sent: CardDelivery, card: ReviewCard, outcome: ladder.Outcome
) -> ReviewState | None:
    """Grade the learner's own words on a card they already tapped; the caller
    commits. `passed` is real recall: it counts as a right answer at the level
    and climbs past the level's cap. Anything less leaves the ladder where the
    tap put it — they offered, and were not asked. On a harder card, which
    moves only the level, it moves only the level."""
    sent.follow_ups = {**sent.follow_ups, OWN_WORDS: outcome}
    state = await state_of(session, sent.user_id, card.lesson)
    if state is not None and sent.harder:
        _volunteered(state, card, outcome)
    if state is None or sent.harder or outcome != "passed":
        await session.flush()
        return state
    now = datetime.now(UTC)
    state.level, state.level_run = ladder.next_level(
        state.level, state.level_run, "correct"
    )
    await move(
        session,
        state,
        ladder.advance(rung(state), "passed", now),
        outcome=outcome,
        now=now,
    )
    return state


async def level_one_only(
    session: AsyncSession, user_id: uuid.UUID, now: datetime
) -> bool:
    """Whether only level 1 is served, whatever a ladder's level says: the
    learner's last two cards above it were both skipped, within SKIP_HOLD of
    each other, and the later within SKIP_HOLD of now."""
    last_two = (
        await session.execute(
            select(CardDelivery.outcome, CardDelivery.answered_at)
            .join(ReviewCard, ReviewCard.id == CardDelivery.card_id)
            .where(CardDelivery.user_id == user_id, ReviewCard.level >= 2)
            .order_by(CardDelivery.sent_at.desc())
            .limit(2)
        )
    ).all()
    skipped = [
        moment
        for outcome, moment in last_two
        if outcome == "skipped" and moment is not None
    ]
    return (
        len(skipped) == 2
        and now - skipped[0] < SKIP_HOLD
        and skipped[0] - skipped[1] < SKIP_HOLD
    )


async def due(
    session: AsyncSession, user_id: uuid.UUID, now: datetime, *, recent_first: bool
) -> Sequence[ReviewState]:
    """This learner's ladders that are owed a card now and had none lately:
    the longest overdue first, or the lesson finished most recently — the one
    still in their head — with a lab's, which has no reading behind it, last."""
    query = select(ReviewState).where(
        ReviewState.user_id == user_id,
        ReviewState.next_due_at <= now,
        ~_resting(now),
    )
    if recent_first:
        query = query.outerjoin(
            LessonProgress,
            and_(
                LessonProgress.user_id == ReviewState.user_id,
                LessonProgress.lesson == ReviewState.lesson,
            ),
        ).order_by(LessonProgress.completed_at.desc().nulls_last())
    else:
        query = query.order_by(ReviewState.next_due_at)
    return (await session.scalars(query)).all()


async def cards_today(
    session: AsyncSession, user_id: uuid.UUID, since: datetime
) -> int:
    """Messages, not deliveries: a card swapped in by Another question or
    Wrong card reuses the message of the one it replaced."""
    total = await session.scalar(
        select(func.count(func.distinct(CardDelivery.tg_message_id))).where(
            CardDelivery.user_id == user_id, CardDelivery.sent_at >= since
        )
    )
    return int(total or 0)
