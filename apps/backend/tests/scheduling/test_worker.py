import json
import uuid
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sessions
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
    row = await due_review(session, user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == policy.tomorrow_open(NOON, UTC_ZONE)


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


async def test_a_muted_learner_is_left_alone(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    row = await due_review(session, user)
    await repository.mute(session, user.id, until=NOON + timedelta(days=2))
    await session.refresh(user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == user.muted_until
    assert await HarnessRepository(session, user.id).rows(thread) == []


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
