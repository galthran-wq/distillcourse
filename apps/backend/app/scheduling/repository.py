import uuid
from collections.abc import Collection, Sequence
from datetime import datetime, timedelta
from typing import Any, Literal

import logfire
from sqlalchemy import ColumnElement, ScalarSelect, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import CardDelivery, Chat, Message, Schedule, TgLink, User
from app.scheduling import policy

ScheduleKind = Literal["coach", "reminder"]
CreatedBy = Literal["system", "user"]

# How long a claimed row stays off limits to other workers. A process that
# dies mid-run leaves nothing waiting longer than this. It has to outlast the
# run it holds inside it — the harness lets a run hold its chat for
# RUN_CLAIM_TTL_SECONDS — or a second poller would sweep the lease of a run
# still in flight and deliver the same message twice.
LEASE = timedelta(seconds=settings.RUN_CLAIM_TTL_SECONDS) + timedelta(minutes=5)
CLAIM_BATCH = 100
WAITING = ("pending", "deferred")


async def create(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    kind: ScheduleKind,
    due_at: datetime,
    payload: dict[str, Any],
    created_by: CreatedBy,
) -> Schedule:
    row = Schedule(
        user_id=user_id,
        kind=kind,
        due_at=due_at,
        payload=payload,
        status="pending",
        created_by=created_by,
    )
    session.add(row)
    await session.commit()
    return row


async def claim_due(session: AsyncSession, now: datetime) -> Sequence[Schedule]:
    """Take what is due and commit the lease before any of it runs.

    The select locks the rows and skips the ones another worker already holds,
    so two pollers cannot pick up the same schedule; the transaction ends here
    rather than around the run, which would hold a lock for as long as a model
    takes to answer.

    A muted learner's rows are not claimed at all rather than pushed to the end
    of the mute: they keep the time they were meant for, so lifting a mute makes
    everything it held back due again in the very next cycle. A learner whose
    channel is down is held the same way — there is nothing to retry into a
    blocked bot, and repairing the link releases everything at once.
    """
    muted = (
        select(User.id)
        .where(User.id == Schedule.user_id, User.muted_until > now)
        .correlate(Schedule)
        .exists()
    )
    unreachable = (
        select(TgLink.user_id)
        .where(TgLink.user_id == Schedule.user_id, TgLink.status != "active")
        .correlate(Schedule)
        .exists()
    )
    rows = (
        await session.scalars(
            select(Schedule)
            .where(
                Schedule.status.in_(WAITING),
                Schedule.due_at <= now,
                Schedule.lease_until.is_(None),
                ~muted,
                ~unreachable,
            )
            .order_by(Schedule.due_at)
            .limit(CLAIM_BATCH)
            .with_for_update(skip_locked=True)
        )
    ).all()
    for row in rows:
        row.claimed_at = now
        row.lease_until = now + LEASE
    await session.commit()
    return rows


async def defer(
    session: AsyncSession, rows: Sequence[Schedule], *, due_at: datetime
) -> None:
    """Hand rows back unexecuted: nothing was attempted, so nothing is spent."""
    for row in rows:
        row.status = "deferred"
        row.due_at = due_at
        row.claimed_at = None
        row.lease_until = None
    await session.commit()


async def drop(session: AsyncSession, rows: Sequence[Schedule]) -> None:
    """Rows nothing will ever deliver. Unlike a defer, these do not come back.
    Leaves the commit to the caller."""
    for row in rows:
        row.status = "cancelled"
        row.claimed_at = None
        row.lease_until = None
    await session.flush()


async def retry(
    session: AsyncSession, rows: Sequence[Schedule], *, now: datetime, error: str
) -> None:
    for row in rows:
        row.attempts += 1
        row.claimed_at = None
        row.lease_until = None
        if row.attempts >= policy.MAX_ATTEMPTS:
            row.status = "failed"
            logfire.error(
                "schedule {schedule_id} failed after {attempts} attempts: {error}",
                schedule_id=str(row.id),
                attempts=row.attempts,
                error=error,
            )
        else:
            row.status = "pending"
            row.due_at = policy.retry_at(now, row.attempts)
    await session.commit()


async def deliver(session: AsyncSession, rows: Sequence[Schedule]) -> None:
    """Reminders that went out: finished the moment they are sent."""
    for row in rows:
        row.status = "done"
        row.lease_until = None
    await session.commit()


async def sweep_leases(session: AsyncSession, now: datetime) -> None:
    """Return the rows of a worker that stopped mid-execution.

    Every other transition clears the lease, so an expired one is exactly a
    row whose holder is gone. It counts as an attempt: a schedule that kills
    the process it runs in must not be picked up forever.
    """
    rows = (
        await session.scalars(select(Schedule).where(Schedule.lease_until < now))
    ).all()
    if rows:
        await retry(
            session, rows, now=now, error="the worker holding the lease stopped"
        )


async def initiations_today(
    session: AsyncSession, user_id: uuid.UUID, since: datetime
) -> int:
    """Messages the platform started today: the cards it sent on its own
    account, and the reminders — the learner's appointment, but still a
    message, which the day's one card waits behind."""
    cards = await session.scalar(
        select(func.count()).where(
            CardDelivery.user_id == user_id,
            CardDelivery.initiated,
            CardDelivery.sent_at >= since,
        )
    )
    reminders = await session.scalar(
        select(func.count()).where(
            Schedule.user_id == user_id,
            Schedule.kind == "reminder",
            Schedule.status == "done",
            Schedule.claimed_at >= since,
        )
    )
    return int(cards or 0) + int(reminders or 0)


def _last_message(user_id: uuid.UUID) -> ScalarSelect[datetime]:
    """When the learner last wrote in the Telegram thread."""
    return (
        select(func.max(Message.created_at))
        .join(Chat, Chat.id == Message.chat_id)
        .where(Chat.user_id == user_id, Chat.kind == "telegram", Message.role == "user")
        .scalar_subquery()
    )


def _answered(user_id: uuid.UUID) -> ColumnElement[datetime]:
    """When the learner last wrote in the thread or tapped a card."""
    last_tap = (
        select(func.max(CardDelivery.answered_at))
        .where(CardDelivery.user_id == user_id)
        .scalar_subquery()
    )
    # greatest() skips NULLs, so either one alone is enough.
    return func.greatest(_last_message(user_id), last_tap)


async def last_answer(session: AsyncSession, user_id: uuid.UUID) -> datetime | None:
    moment: datetime | None = await session.scalar(select(_answered(user_id)))
    return moment


async def silence(session: AsyncSession, user_id: uuid.UUID) -> int:
    """How many cards in a row the learner has let go unanswered: those sent
    since the last thing they wrote in the thread or tapped. Read back from the
    thread and the deliveries rather than stored, so it cannot drift from
    either.
    """
    since = _answered(user_id)
    total = await session.scalar(
        select(func.count()).where(
            CardDelivery.user_id == user_id,
            CardDelivery.outcome == "ignored",
            or_(since.is_(None), CardDelivery.sent_at > since),
        )
    )
    return int(total or 0)


async def last_initiation(session: AsyncSession, user_id: uuid.UUID) -> datetime | None:
    """When the platform last opened the conversation of its own accord — a
    reminder is the learner's appointment, not ours, so it does not count. The
    same messages `silence` counts, so the wait runs from the last of them."""
    moment: datetime | None = await session.scalar(
        select(func.max(CardDelivery.sent_at)).where(CardDelivery.user_id == user_id)
    )
    return moment


async def users_by_id(
    session: AsyncSession, ids: Collection[uuid.UUID]
) -> dict[uuid.UUID, User]:
    rows = await session.scalars(select(User).where(User.id.in_(ids)))
    return {user.id: user for user in rows}


async def mute(
    session: AsyncSession, user_id: uuid.UUID, *, until: datetime | None
) -> None:
    await session.execute(
        update(User).where(User.id == user_id).values(muted_until=until)
    )
    await session.commit()


async def pause_cards(
    session: AsyncSession, user_id: uuid.UUID, *, until: datetime
) -> None:
    """Leaves the commit to the caller, which commits it with the card it
    put aside."""
    await session.execute(
        update(User).where(User.id == user_id).values(cards_paused_until=until)
    )


async def pending_reminders(
    session: AsyncSession, user_id: uuid.UUID
) -> Sequence[Schedule]:
    return (
        await session.scalars(
            select(Schedule)
            .where(
                Schedule.user_id == user_id,
                Schedule.kind == "reminder",
                Schedule.status.in_(WAITING),
            )
            .order_by(Schedule.due_at)
        )
    ).all()


async def cancel(
    session: AsyncSession, user_id: uuid.UUID, schedule_id: uuid.UUID
) -> bool:
    cancelled = await session.scalar(
        update(Schedule)
        .where(
            Schedule.id == schedule_id,
            Schedule.user_id == user_id,
            Schedule.status.in_(WAITING),
        )
        .values(status="cancelled")
        .returning(Schedule.id)
    )
    await session.commit()
    return cancelled is not None
