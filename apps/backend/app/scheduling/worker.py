import asyncio
import uuid
from collections import defaultdict
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

import logfire
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.coach import floor, wake
from app.coach.agent import decide
from app.core import sessions
from app.core.config import settings
from app.core.db import session_factory
from app.core.observability import configure
from app.harness import runner
from app.harness.limits import LimitExceeded
from app.harness.repository import HarnessRepository
from app.labs import repository as labs
from app.models import Schedule, User
from app.review import cards
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
    return f"Open the thread. What they asked to be reminded of now:\n{items}"


async def _settle(
    session: AsyncSession,
    rows: Sequence[Schedule],
    exc: Exception,
    now: datetime,
    hours: policy.Hours,
) -> None:
    """Rows whose run failed: held, or tried again, by what failed."""
    match exc:
        case LimitExceeded():
            await repository.defer(
                session, rows, due_at=policy.tomorrow_open(now, hours)
            )
        case api.BotBlocked():
            # The link is marked broken, which keeps the poller off this
            # learner until a message proves the channel is back; the rows
            # keep their time, so that releases them at once.
            await repository.defer(session, rows, due_at=now)
        case _:
            await repository.retry(session, rows, now=now, error=str(exc))


async def _remind(
    session: AsyncSession, user: User, rows: list[Schedule], now: datetime
) -> None:
    """The reminders due for one learner, in one message. Their own
    appointment, at a time they named: none of the limits on what the
    platform starts holds it back, only quiet hours (and mute, in
    `claim_due`)."""
    hours = policy.Hours.of(user)
    if not policy.in_window(now, hours):
        await repository.defer(session, rows, due_at=policy.next_open(now, hours))
        return
    link = await telegram.link_for_user(session, user.id)
    if link is None:
        # Held rather than cancelled: unpairing to move to a new phone must
        # not silently cancel what the learner asked for by name.
        await repository.defer(session, rows, due_at=policy.tomorrow_open(now, hours))
        return
    try:
        await thread.converse(
            HarnessRepository(session, user.id),
            await thread.of(session, user.id),
            Outbox(session=session, link=link),
            _prompt(rows),
            run_kind="reminder",
        )
    except runner.RunBusy:
        await repository.defer(session, rows, due_at=now + BUSY_RETRY)
        return
    except Exception as exc:
        await _settle(session, rows, exc, now, hours)
        return
    await repository.deliver(session, rows)


async def _coach(
    session: AsyncSession, user: User, row: Schedule, now: datetime
) -> None:
    """One wake-up: the coach decides, the floor makes sure a silent week ends
    in a card, and the next wake-up is set."""
    hours = policy.Hours.of(user)
    if not policy.in_window(now, hours):
        await repository.defer(session, [row], due_at=policy.next_open(now, hours))
        return
    since = policy.day_start(now, hours)
    if await wake.runs_today(session, user.id, since) >= settings.COACH_RUNS_DAILY:
        await repository.defer(session, [row], due_at=policy.tomorrow_open(now, hours))
        return
    link = await telegram.link_for_user(session, user.id)
    if link is None:
        # Made again by `wake.ensure` the moment a link exists.
        await repository.drop(session, [row])
        await session.commit()
        return
    outbox = Outbox(session=session, link=link)
    try:
        decision = await decide(session, user, outbox, row, now)
        if await floor.owed(session, link, now):
            await floor.send(session, outbox, user, now)
    except Exception as exc:
        await _settle(session, [row], exc, now, hours)
        return
    await wake.follow(
        session, row, wake.clamp(decision.next_check_at, now, hours), decision.reason
    )


async def cycle(session: AsyncSession, now: datetime) -> None:
    await repository.sweep_leases(session, now)
    await cards.expire(session, now)
    await wake.ensure(session, now)
    batches: dict[uuid.UUID, list[Schedule]] = defaultdict(list)
    for row in await repository.claim_due(session, now):
        batches[row.user_id].append(row)
    users = await repository.users_by_id(session, batches)
    # Users are served one after another: the instance spends one budget, and
    # a handful of messages a day buys nothing from running them in parallel.
    for user_id, rows in batches.items():
        user = users[user_id]
        reminders = [row for row in rows if row.kind == "reminder"]
        if reminders:
            await _remind(session, user, reminders, now)
        # Reminders first: one sent spends the day's message, which the coach
        # then reads as spent.
        for row in rows:
            if row.kind == wake.KIND:
                await _coach(session, user, row, now)


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
