import asyncio
import json
import uuid
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core import sessions
from app.core.config import settings
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Chat, Message, Schedule, User, UserSession
from app.scheduling import policy, repository, worker
from tests.scheduling.conftest import NOON, replying

UTC_ZONE = ZoneInfo("UTC")


async def due_review(
    session: AsyncSession,
    user: User,
    *,
    note: str = "entropy is due for review",
    topic: str | None = None,
    at: datetime | None = None,
) -> Schedule:
    payload: dict[str, object] = {"note": note}
    if topic is not None:
        payload["topic"] = topic
    return await repository.create(
        session,
        user_id=user.id,
        kind="review",
        due_at=at or NOON - timedelta(minutes=1),
        payload=payload,
        created_by="system",
    )


async def thread_messages(session: AsyncSession, user: User, chat: Chat) -> str:
    rows = await HarnessRepository(session, user.id).rows(chat)
    return json.dumps([row.pydantic_ai for row in rows])


async def test_a_due_review_is_delivered_and_waits_for_a_reply(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    row = await due_review(session, user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "awaiting_reply"
    assert row.due_at == policy.slot_deadline(NOON, UTC_ZONE)
    assert row.claimed_at == NOON
    assert "entropy is what you owe me" in await thread_messages(session, user, thread)


async def test_nothing_is_delivered_without_a_connected_thread(
    session: AsyncSession, user: User
) -> None:
    """A row with nowhere to go is dropped, not rescheduled: rescheduling it
    would re-claim and re-write it every morning for as long as the user lives."""
    row = await due_review(session, user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "cancelled"
    assert row.lease_until is None


@pytest.mark.usefixtures("thread")
async def test_a_worker_that_dies_mid_run_returns_its_row(
    session: AsyncSession, user: User
) -> None:
    """The lease is the only thing another poller can see, so an expired one is
    the whole recovery: the row is pending again, one attempt poorer."""
    row = await due_review(session, user, at=NOON - timedelta(hours=1))
    row.claimed_at = NOON - timedelta(minutes=30)
    row.lease_until = NOON - timedelta(minutes=25)
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "pending"
    assert row.lease_until is None
    assert row.attempts == 1
    assert row.due_at == policy.retry_at(NOON, 1)


@pytest.mark.usefixtures("thread")
async def test_a_row_that_never_completes_is_failed(
    session: AsyncSession, user: User
) -> None:
    row = await due_review(session, user)
    row.attempts = policy.MAX_ATTEMPTS - 1
    row.claimed_at = NOON - timedelta(minutes=30)
    row.lease_until = NOON - timedelta(minutes=25)
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "failed"
    assert row.attempts == policy.MAX_ATTEMPTS


async def test_a_thread_already_in_use_is_not_interrupted(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """The incoming message holds the thread's claim; the proactive run finds
    it taken and comes back rather than talking over it."""
    row = await due_review(session, user)
    repo = HarnessRepository(session, user.id)
    await repo.claim_run(thread, uuid.uuid4())

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == NOON + worker.BUSY_RETRY
    assert await repo.rows(thread) == []


async def test_quiet_hours_hold_the_message_until_morning(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    night = NOON.replace(hour=23)
    row = await due_review(session, user, at=night)

    with replying():
        await worker.cycle(session, night)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == policy.next_open(night, UTC_ZONE)
    assert await HarnessRepository(session, user.id).rows(thread) == []


@pytest.mark.usefixtures("thread")
async def test_the_daily_budget_holds_the_fourth_message(
    session: AsyncSession, user: User
) -> None:
    for hour in range(policy.DAILY_INITIATIONS):
        spent = await due_review(session, user)
        spent.status = "done"
        spent.outcome = "answered"
        spent.claimed_at = NOON - timedelta(hours=hour + 1)
    row = await due_review(session, user)
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == policy.tomorrow_open(NOON, UTC_ZONE)


async def test_three_items_travel_together_and_the_rest_wait(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    rows = [await due_review(session, user, note=f"item {index}") for index in range(4)]

    with replying():
        await worker.cycle(session, NOON)

    for row in rows:
        await session.refresh(row)
    delivered = [row for row in rows if row.status == "awaiting_reply"]
    postponed = [row for row in rows if row.status == "deferred"]
    prompt = await thread_messages(session, user, thread)
    assert len(delivered) == policy.SESSION_ITEMS
    assert [row.due_at for row in postponed] == [policy.tomorrow_open(NOON, UTC_ZONE)]
    # One message carrying all three, not three messages.
    assert prompt.count("What is due now") == 1
    assert repository.CLAIM_BATCH > len(rows)


async def test_one_message_waits_for_a_reply_at_a_time(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    open_slot = await due_review(session, user)
    open_slot.status = "awaiting_reply"
    open_slot.claimed_at = NOON - timedelta(hours=1)
    open_slot.due_at = NOON + timedelta(hours=3)
    row = await due_review(session, user)
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == open_slot.due_at
    assert await HarnessRepository(session, user.id).rows(thread) == []


async def test_a_reply_closes_the_slot(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    row = await due_review(session, user)
    row.status = "awaiting_reply"
    row.claimed_at = datetime.now(UTC) - timedelta(hours=1)
    row.due_at = NOON + timedelta(hours=3)
    session.add(
        Message(
            chat_id=thread.id,
            role="user",
            pydantic_ai={},
            projection=[],
        )
    )
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "done"
    assert row.outcome == "answered"


@pytest.mark.usefixtures("thread")
async def test_a_message_nobody_answered_is_recorded_as_ignored(
    session: AsyncSession, user: User
) -> None:
    row = await due_review(session, user, topic="information-theory")
    row.status = "awaiting_reply"
    row.claimed_at = NOON - timedelta(hours=5)
    row.due_at = NOON - timedelta(minutes=1)
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "done"
    assert row.outcome == "ignored"


async def test_the_message_after_an_ignored_one_leads_with_another_topic(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    ignored = await due_review(session, user, topic="information-theory")
    ignored.status = "done"
    ignored.outcome = "ignored"
    ignored.claimed_at = NOON - timedelta(hours=6)
    same = [
        await due_review(
            session, user, topic="information-theory", note=f"same {index}"
        )
        for index in range(2)
    ]
    for other in range(2):
        await due_review(session, user, topic="classical-ml", note=f"other {other}")
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    for row in same:
        await session.refresh(row)
    prompt = await thread_messages(session, user, thread)
    assert [row.status for row in same].count("deferred") == 1
    assert prompt.index("other 0") < prompt.index("same 0")


async def test_a_message_runs_the_whole_loop_from_delivery_to_rotation(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """The sequence in one pass: a due review is delivered, the slot waits, the
    learner never answers, it times out as ignored, and the message that goes
    out next leads with a different topic."""
    first = await due_review(
        session, user, topic="information-theory", note="entropy is due"
    )

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(first)
    assert (first.status, first.outcome) == ("awaiting_reply", None)
    assert "entropy is what you owe me" in await thread_messages(session, user, thread)

    timeout = policy.slot_deadline(NOON, UTC_ZONE)
    same = await due_review(
        session,
        user,
        topic="information-theory",
        note="mutual information is due",
        at=timeout,
    )
    other = await due_review(
        session,
        user,
        topic="classical-ml",
        note="bias and variance are due",
        at=timeout,
    )

    with replying():
        await worker.cycle(session, timeout)

    for row in (first, same, other):
        await session.refresh(row)
    prompt = await thread_messages(session, user, thread)
    assert (first.status, first.outcome) == ("done", "ignored")
    assert same.status == other.status == "awaiting_reply"
    assert prompt.index("bias and variance") < prompt.index("mutual information")


@pytest.mark.usefixtures("thread")
async def test_a_failed_run_does_not_spend_the_overflows_day(
    session: AsyncSession, user: User
) -> None:
    """No message went out, so what it could not carry is still due today."""

    def refuse(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise RuntimeError("openrouter is down")

    rows = [await due_review(session, user, note=f"item {index}") for index in range(4)]

    with tutor.override(model=FunctionModel(refuse), tools=[]):
        await worker.cycle(session, NOON)

    for row in rows:
        await session.refresh(row)
    overflow = [row for row in rows if row.status == "deferred"]
    assert [(row.due_at, row.attempts, row.lease_until) for row in overflow] == [
        (NOON, 0, None)
    ]


async def test_a_muted_learner_is_left_alone(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """A mute is not a reschedule: the row is not claimed at all, so it keeps
    the time it was meant for."""
    row = await due_review(session, user)
    due_at = row.due_at
    await repository.mute(session, user.id, until=NOON + timedelta(days=2))

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "pending"
    assert row.due_at == due_at
    assert row.claimed_at is None
    assert await HarnessRepository(session, user.id).rows(thread) == []


@pytest.mark.usefixtures("thread")
async def test_an_open_ended_mute_does_not_outlive_itself(
    session: AsyncSession, user: User
) -> None:
    """`/mute` with no end date parks the user in the year 9999. What was due
    while it held has to arrive once the learner asks for messages back."""
    row = await due_review(session, user)
    await repository.mute(session, user.id, until=policy.INDEFINITE)

    with replying():
        await worker.cycle(session, NOON)
    await session.refresh(row)
    assert row.status == "pending"

    await repository.mute(session, user.id, until=None)
    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "awaiting_reply"


@pytest.mark.usefixtures("thread")
async def test_an_expired_mute_lets_the_platform_write_again(
    session: AsyncSession, user: User
) -> None:
    row = await due_review(session, user)
    await repository.mute(session, user.id, until=NOON - timedelta(hours=1))
    await session.refresh(user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "awaiting_reply"


async def test_housekeeping_removes_the_sessions_nothing_will_read(
    session: AsyncSession, user: User
) -> None:
    past = datetime.now(UTC) - timedelta(days=1)
    session.add(
        UserSession(
            token_hash=sessions.token_hash("expired"),
            user_id=user.id,
            created_at=past,
            last_used_at=past,
            expires_at=past,
        )
    )
    await session.commit()

    await worker.housekeep(session)

    assert await session.scalar(select(UserSession).limit(1)) is None


@pytest.mark.usefixtures("thread")
async def test_a_run_that_fails_is_tried_again_later(
    session: AsyncSession, user: User
) -> None:
    def refuse(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
        raise RuntimeError("openrouter is down")

    row = await due_review(session, user)

    with tutor.override(model=FunctionModel(refuse), tools=[]):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "pending"
    assert row.attempts == 1
    assert row.due_at == policy.retry_at(NOON, 1)


async def test_a_spent_budget_holds_the_message_rather_than_failing_it(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    row = await due_review(session, user)
    session.add(
        Message(
            chat_id=thread.id,
            role="agent",
            pydantic_ai={},
            projection=[],
            usage={"cost_usd": settings.MONTHLY_COST_CEILING_USD},
        )
    )
    await session.commit()

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.attempts == 0
    assert row.due_at == policy.tomorrow_open(NOON, UTC_ZONE)


async def test_a_failed_cycle_does_not_stop_the_poller(
    monkeypatch: pytest.MonkeyPatch, session_factory: async_sessionmaker[AsyncSession]
) -> None:
    """The loop is the process: it has to survive a database that went away."""
    cycles: list[datetime] = []

    async def one_bad_cycle(_session: AsyncSession, now: datetime) -> None:
        cycles.append(now)
        if len(cycles) == 1:
            raise RuntimeError("the database went away")

    monkeypatch.setattr(worker, "cycle", one_bad_cycle)
    monkeypatch.setattr(worker, "POLL", timedelta(seconds=0.01))
    poller = asyncio.create_task(worker.poll(session_factory))
    await asyncio.sleep(0.05)
    poller.cancel()

    assert len(cycles) > 1
