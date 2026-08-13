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
from app.labs import repository as labs
from app.models import Schedule, User
from app.review import repository as review
from app.review import subject
from app.scheduling import policy, repository
from app.telegram import api, thread
from app.telegram import repository as telegram
from app.telegram.outbox import Outbox

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


def _split(
    rows: Sequence[Schedule], kind: str
) -> tuple[list[Schedule], list[Schedule]]:
    """The rows of this kind, and everything else — the two are treated
    differently at every step below."""
    return (
        [row for row in rows if row.kind == kind],
        [row for row in rows if row.kind != kind],
    )


async def _initiations_allowed(
    session: AsyncSession, user: User, rows: list[Schedule], now: datetime
) -> list[Schedule]:
    """What the platform may say on its own account, of what is due.

    The slot and the daily budget govern messages the platform starts — a
    review, a nudge. A reminder is the learner's own appointment, set for a time
    they named, so neither holds it back (#15's gate is that "remind me on
    Friday" arrives on Friday). It is still a message: delivering one spends the
    day's budget for the reviews that come after it.
    """
    hours = policy.Hours.of(user)
    deadline = await repository.open_slot_deadline(session, user.id)
    if deadline is not None:
        # One proactive message at a time: what else is due waits for the open
        # one to be answered or to time out.
        await repository.defer(session, rows, due_at=deadline)
        return []
    spent = await repository.initiations_today(
        session, user.id, policy.day_start(now, hours)
    )
    if spent >= policy.DAILY_INITIATIONS:
        await repository.defer(session, rows, due_at=policy.tomorrow_open(now, hours))
        return []
    return rows


async def _fire(
    session: AsyncSession, user: User, rows: list[Schedule], now: datetime
) -> None:
    hours = policy.Hours.of(user)
    if not policy.in_window(now, hours):
        await repository.defer(session, rows, due_at=policy.next_open(now, hours))
        return
    reminders, initiated = _split(rows, "reminder")
    if initiated:
        initiated = await _initiations_allowed(session, user, initiated, now)
    due = [*reminders, *initiated]
    if not due:
        return
    link = await telegram.link_for_user(session, user.id)
    if link is None:
        # Nothing is delivered without a connected transport. A review is
        # dropped because its ladder materialises it again the moment a link
        # exists; a reminder has no such backing state, so it waits instead —
        # unpairing to move to a new phone must not silently cancel the thing
        # the learner asked for by name.
        held, dropped = _split(due, "reminder")
        await repository.defer(session, held, due_at=policy.tomorrow_open(now, hours))
        await repository.drop(session, dropped)
        await session.commit()
        return
    chat = await thread.of(session, user.id)
    now_items, later = policy.session_items(
        due, avoid=await repository.ignored_topic(session, user.id)
    )
    try:
        await thread.converse(
            HarnessRepository(session, user.id),
            chat,
            Outbox(session=session, link=link),
            _prompt(now_items),
            run_kind=_run_kind(now_items),
            blocks=await subject.due_block(session, now_items),
        )
    except runner.RunBusy:
        await repository.defer(session, due, due_at=now + BUSY_RETRY)
        return
    except LimitExceeded:
        await repository.defer(session, due, due_at=policy.tomorrow_open(now, hours))
        return
    except api.BotBlocked:
        # The channel is dead and the link is marked broken, which is what keeps
        # the poller off this learner until an incoming message proves it is
        # back. The rows keep the time they were meant for, so repairing the
        # link releases them all at once rather than a morning later.
        await repository.defer(session, due, due_at=now)
        return
    except Exception as exc:
        # Whatever the model, the network or the database did is the attempted
        # rows' problem, not the cycle's: back off and fail them after three
        # tries. The overflow was never attempted, so it stays plainly due.
        await repository.retry(session, now_items, now=now, error=str(exc))
        if later:
            await repository.defer(session, later, due_at=now)
        return
    # Only now, with the message out: a run that never happened must not spend
    # the overflow's day.
    if later:
        await repository.defer(session, later, due_at=policy.tomorrow_open(now, hours))
    # A reminder is over once it is delivered — nothing is waiting for an answer
    # to it. Only what the platform asked of its own accord holds the slot open.
    sent, initiations = _split(now_items, "reminder")
    await repository.deliver(session, sent)
    await repository.open_slot(
        session, initiations, deadline=policy.slot_deadline(now, hours)
    )


async def cycle(session: AsyncSession, now: datetime) -> None:
    await repository.sweep_leases(session, now)
    await repository.close_answered(session)
    await repository.expire_slots(session, now)
    # The ladders read the sessions that just closed and then put what they owe
    # into the queue, in that order: a review settled as ignored is due again
    # from now, and its next delivery is made in this same cycle rather than
    # thirty seconds later.
    await review.settle(session, now)
    await review.materialize(session, now)
    batches: dict[uuid.UUID, list[Schedule]] = defaultdict(list)
    for row in await repository.claim_due(session, now):
        batches[row.user_id].append(row)
    users = await repository.users_by_id(session, batches)
    # Users are served one after another: the instance spends one budget, and
    # a handful of messages a day buys nothing from running them in parallel.
    for user_id, rows in batches.items():
        await _fire(session, users[user_id], rows, now)


async def housekeep(session: AsyncSession, now: datetime) -> None:
    """Rows nothing will read again. This process owns the sweep because it is
    the one with a clock of its own."""
    await sessions.delete_expired(session)
    await telegram.prune(session, now)
    await labs.prune(session, now)
    await session.commit()


async def poll(factory: async_sessionmaker[AsyncSession]) -> None:
    swept = datetime.now(UTC) - HOUSEKEEPING
    while True:
        now = datetime.now(UTC)
        try:
            async with factory() as session:
                await cycle(session, now)
                if now - swept >= HOUSEKEEPING:
                    await housekeep(session, now)
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
