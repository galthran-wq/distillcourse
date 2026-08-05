import asyncio
import uuid
from collections import defaultdict
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

import logfire
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core import sessions
from app.core.db import session_factory
from app.core.observability import configure
from app.harness import runner
from app.harness.limits import LimitExceeded
from app.harness.prompts import RunKind
from app.harness.repository import HarnessRepository
from app.models import Schedule, User
from app.scheduling import policy, repository

POLL = timedelta(seconds=30)
HOUSEKEEPING = timedelta(days=1)
# A thread the learner is using right now is not interrupted; the message
# waits for a quiet moment rather than for its next due time.
BUSY_RETRY = timedelta(minutes=2)


def _prompt(rows: Sequence[Schedule]) -> str:
    items = "\n".join(f"- {row.payload['note']}" for row in rows)
    return f"Open the thread. What is due now:\n{items}"


def _run_kind(rows: Sequence[Schedule]) -> RunKind:
    return "review" if any(row.kind == "review" for row in rows) else "proactive"


async def _fire(
    session: AsyncSession, user: User, rows: list[Schedule], now: datetime
) -> None:
    tz = policy.zone(user.timezone)
    if user.muted_until is not None and now < user.muted_until:
        await repository.defer(session, rows, due_at=user.muted_until)
        return
    if not policy.in_window(now, tz):
        await repository.defer(session, rows, due_at=policy.next_open(now, tz))
        return
    deadline = await repository.open_slot_deadline(session, user.id)
    if deadline is not None:
        # One proactive message at a time: what else is due waits for the open
        # one to be answered or to time out.
        await repository.defer(session, rows, due_at=deadline)
        return
    spent = await repository.initiations_today(
        session, user.id, policy.day_start(now, tz)
    )
    if spent >= policy.DAILY_INITIATIONS:
        await repository.defer(session, rows, due_at=policy.tomorrow_open(now, tz))
        return
    thread = await repository.thread(session, user.id)
    if thread is None:
        # Nothing is delivered without a connected transport. The row is kept:
        # a thread that comes back finds its reminders still waiting.
        await repository.defer(session, rows, due_at=policy.tomorrow_open(now, tz))
        return
    now_items, later = policy.session_items(
        rows, avoid=await repository.ignored_topic(session, user.id)
    )
    if later:
        await repository.defer(session, later, due_at=policy.tomorrow_open(now, tz))
    try:
        await runner.run(
            HarnessRepository(session, user.id),
            thread,
            _prompt(now_items),
            run_kind=_run_kind(now_items),
        )
    except runner.RunBusy:
        await repository.defer(session, now_items, due_at=now + BUSY_RETRY)
        return
    except LimitExceeded:
        await repository.defer(session, now_items, due_at=policy.tomorrow_open(now, tz))
        return
    except Exception as exc:
        # Whatever the model, the network or the database did is this row's
        # problem, not the cycle's: back off and fail the row after three tries.
        await repository.retry(session, now_items, now=now, error=str(exc))
        return
    await repository.open_slot(
        session, now_items, deadline=policy.slot_deadline(now, tz)
    )


async def cycle(session: AsyncSession, now: datetime) -> None:
    await repository.sweep_leases(session, now)
    await repository.close_answered(session)
    await repository.expire_slots(session, now)
    batches: dict[uuid.UUID, list[Schedule]] = defaultdict(list)
    for row in await repository.claim_due(session, now):
        batches[row.user_id].append(row)
    users = await repository.users_by_id(session, batches)
    # Users are served one after another: the instance spends one budget, and
    # a handful of messages a day buys nothing from running them in parallel.
    for user_id, rows in batches.items():
        await _fire(session, users[user_id], rows, now)


async def housekeep(session: AsyncSession) -> None:
    """Rows nothing will read again. This process owns the sweep because it is
    the one with a clock of its own."""
    await sessions.delete_expired(session)
    await session.commit()


async def poll(factory: async_sessionmaker[AsyncSession]) -> None:
    swept = datetime.now(UTC) - HOUSEKEEPING
    while True:
        now = datetime.now(UTC)
        try:
            async with factory() as session:
                await cycle(session, now)
                if now - swept >= HOUSEKEEPING:
                    await housekeep(session)
                    swept = now
        except Exception:
            # The loop is the process. A cycle that fails is reported and the
            # next one runs; exiting here would stop every learner's schedule.
            logfire.exception("scheduling cycle failed")
        await asyncio.sleep(POLL.total_seconds())


def main() -> None:
    configure()
    asyncio.run(poll(session_factory))


if __name__ == "__main__":
    main()
