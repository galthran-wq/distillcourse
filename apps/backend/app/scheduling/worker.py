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
from app.harness.repository import HarnessRepository
from app.labs import repository as labs
from app.models import Schedule, User
from app.review import cards
from app.review import repository as review
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

    "Not today", the open card, the daily budget and the silence backoff
    govern messages the platform starts. A reminder is the learner's own appointment, set for a
    time they named, so none of them holds it back ("remind me on Friday"
    arrives on Friday). It is still a message: delivering one spends the day's
    budget for the reviews that come after it.
    """
    hours = policy.Hours.of(user)
    if user.cards_paused_until is not None and now < user.cards_paused_until:
        # "Not today": a card's own button, so it holds cards and nothing else.
        await repository.defer(session, rows, due_at=user.cards_paused_until)
        return []
    deadline = await repository.open_card_deadline(session, user.id)
    if deadline is not None:
        # One card at a time: what else is due waits for the open one to be
        # answered or to go a day unanswered.
        await repository.defer(session, rows, due_at=deadline)
        return []
    spent = await repository.initiations_today(
        session, user.id, policy.day_start(now, hours)
    )
    if spent >= policy.DAILY_INITIATIONS:
        await repository.defer(session, rows, due_at=policy.tomorrow_open(now, hours))
        return []
    wait = policy.silence_wait(await repository.silence(session, user.id))
    if (
        wait
        and (last := await repository.last_initiation(session, user.id)) is not None
        and now < last + wait
    ):
        # Held a day at a time rather than to the end of the wait, so a reply
        # that ends the silence is seen by the next morning at the latest.
        await repository.defer(
            session,
            rows,
            due_at=min(
                policy.next_open(last + wait, hours), policy.tomorrow_open(now, hours)
            ),
        )
        return []
    return rows


async def _release_on_reply(session: AsyncSession, now: datetime) -> None:
    """Bring what a silence held back to the next moment the gates allow it.

    A day the budget is already spent leaves it where it is: the clamp above
    already has it due tomorrow morning, and releasing it now would only see
    it deferred again every cycle.
    """
    rows = await repository.held_past_a_reply(session, now)
    if not rows:
        return
    users = await repository.users_by_id(session, {row.user_id for row in rows})
    for row in rows:
        user = users[row.user_id]
        hours = policy.Hours.of(user)
        spent = await repository.initiations_today(
            session, user.id, policy.day_start(now, hours)
        )
        if spent < policy.DAILY_INITIATIONS:
            row.due_at = min(row.due_at, policy.next_open(now, hours))
    await session.commit()


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
    outbox = Outbox(session=session, link=link)
    now_items, later = policy.session_items(due)
    reminders, reviews = _split(now_items, "reminder")
    try:
        if reminders:
            await thread.converse(
                HarnessRepository(session, user.id),
                await thread.of(session, user.id),
                outbox,
                _prompt(reminders),
                run_kind="proactive",
            )
        unsent = [
            row for row in reviews if not await _send_card(session, outbox, row, now)
        ]
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
    # Only now, with a message out: a run that never happened, or reviews of
    # which no card went out, must not spend the overflow's day.
    if later:
        sent = bool(reminders) or len(unsent) < len(reviews)
        await repository.defer(
            session, later, due_at=policy.tomorrow_open(now, hours) if sent else now
        )
    # A review with no card to send is put off on its ladder rather than in
    # the queue: a row held for a day would be released by the learner's next
    # message, and every release would pay for another batch nobody keeps.
    await repository.drop(session, unsent)
    for row in unsent:
        await review.postpone(session, row.user_id, row.payload["lesson"], now)
    await repository.deliver(session, [row for row in now_items if row not in unsent])


async def _send_card(
    session: AsyncSession, outbox: Outbox, row: Schedule, now: datetime
) -> bool:
    """Whether a card went out for this review. A card is picked, or written
    when the learner has seen every card there is, at the level the ladder is
    on."""
    lesson: str = row.payload["lesson"]
    state = await review.state_of(session, row.user_id, lesson)
    level = 1 if state is None else state.level
    if await review.level_one_only(session, row.user_id, now):
        level = 1
    # A card whose image Telegram refused is retired by `deliver`, and the
    # next one in line is tried in its place — once, so an outage of the
    # site's figures cannot retire a whole lesson's cards in one cycle.
    for _ in range(2):
        card = await cards.pick(session, row.user_id, lesson, level)
        if card is None:
            logfire.warn(
                "no card to send: the review is put off a day",
                lesson=lesson,
                level=level,
            )
            return False
        if await cards.deliver(session, outbox, row.user_id, card) is not None:
            return True
    return False


async def cycle(session: AsyncSession, now: datetime) -> None:
    await repository.sweep_leases(session, now)
    await cards.expire(session, now)
    await _release_on_reply(session, now)
    # The ladders account for the deliveries that failed and then put what
    # they owe into the queue, in that order: a ladder put off a day must not
    # be queued again in the same cycle.
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
