import uuid
from collections.abc import Collection, Sequence
from datetime import datetime, timedelta
from typing import Any, Literal

import logfire
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Chat, Message, Schedule, User
from app.scheduling import policy

ScheduleKind = Literal["review", "reminder"]
CreatedBy = Literal["system", "user"]
Outcome = Literal["answered", "ignored"]

# How long a claimed row stays off limits to other workers. A process that
# dies mid-run leaves nothing waiting longer than this.
LEASE = timedelta(minutes=5)
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
    """
    rows = (
        await session.scalars(
            select(Schedule)
            .where(
                Schedule.status.in_(WAITING),
                Schedule.due_at <= now,
                Schedule.lease_until.is_(None),
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


async def open_slot(
    session: AsyncSession, rows: Sequence[Schedule], *, deadline: datetime
) -> None:
    """The message went out: `due_at` now means the moment it counts as ignored."""
    for row in rows:
        row.status = "awaiting_reply"
        row.due_at = deadline
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


async def close_answered(session: AsyncSession) -> None:
    """Close the slots the learner replied to.

    A reply is any message of theirs in the thread after the platform opened
    it; the poller reads it from the thread rather than being told, so the
    bookkeeping holds whichever way a message arrived.
    """
    replied = (
        select(Message.id)
        .join(Chat, Chat.id == Message.chat_id)
        .where(
            Chat.user_id == Schedule.user_id,
            Chat.kind == "telegram",
            Message.role == "user",
            Message.created_at > Schedule.claimed_at,
        )
        .correlate(Schedule)
        .exists()
    )
    await session.execute(
        update(Schedule)
        .where(Schedule.status == "awaiting_reply", replied)
        .values(status="done", outcome="answered")
    )
    await session.commit()


async def expire_slots(session: AsyncSession, now: datetime) -> None:
    await session.execute(
        update(Schedule)
        .where(Schedule.status == "awaiting_reply", Schedule.due_at <= now)
        .values(status="done", outcome="ignored")
    )
    await session.commit()


async def open_slot_deadline(
    session: AsyncSession, user_id: uuid.UUID
) -> datetime | None:
    deadline: datetime | None = await session.scalar(
        select(func.min(Schedule.due_at)).where(
            Schedule.user_id == user_id, Schedule.status == "awaiting_reply"
        )
    )
    return deadline


async def initiations_today(
    session: AsyncSession, user_id: uuid.UUID, since: datetime
) -> int:
    """Messages the platform started today, not items it delivered — one
    message may carry three. A batch is claimed in a single statement, so its
    rows share the moment that identifies it.
    """
    total = await session.scalar(
        select(func.count(func.distinct(Schedule.claimed_at))).where(
            Schedule.user_id == user_id,
            Schedule.claimed_at >= since,
            Schedule.status.in_(("awaiting_reply", "done")),
        )
    )
    return int(total or 0)


async def ignored_topic(session: AsyncSession, user_id: uuid.UUID) -> str | None:
    """The topic to lead away from: the one the last message was about, if the
    learner let that message time out."""
    row = await session.scalar(
        select(Schedule)
        .where(Schedule.user_id == user_id, Schedule.outcome.is_not(None))
        .order_by(Schedule.claimed_at.desc())
        .limit(1)
    )
    if row is None or row.outcome != "ignored":
        return None
    return policy.topic(row)


async def thread(session: AsyncSession, user_id: uuid.UUID) -> Chat | None:
    """The eternal Telegram thread — the only place a proactive message goes."""
    chat: Chat | None = await session.scalar(
        select(Chat)
        .where(Chat.user_id == user_id, Chat.kind == "telegram")
        .order_by(Chat.created_at)
        .limit(1)
    )
    return chat


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
