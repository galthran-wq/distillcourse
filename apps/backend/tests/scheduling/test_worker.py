import asyncio
import json
import uuid
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    UserPromptPart,
)
from pydantic_ai.models.function import AgentInfo, FunctionModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.coach import wake
from app.coach.agent import coach
from app.core import sessions
from app.core.config import settings
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.labs import repository as labs
from app.models import (
    BackgroundRun,
    CardDelivery,
    Chat,
    LabPairingCode,
    Message,
    Schedule,
    TgLink,
    TgPairingCode,
    TgUpdateSeen,
    User,
    UserSession,
)
from app.scheduling import policy, repository, worker
from app.telegram import api
from app.telegram import repository as telegram
from tests.coach.conftest import deciding
from tests.conftest import Bot, replying
from tests.review.conftest import (  # noqa: F401  (a shared fixture)
    LESSON,
    indexed_section,
    ladder,
    stored_card,
    untouchable,
)
from tests.scheduling.conftest import NOON

WAKING = policy.Hours(ZoneInfo("UTC"), time(9), time(22))
TOMORROW = NOON + timedelta(days=1)


@pytest.fixture(autouse=True)
async def written(session: AsyncSession, indexed_section: None) -> None:  # noqa: ARG001, F811
    """Cards enough for every card these tests send: sending one costs no
    model, which is what keeps the poller's own behaviour the subject here."""
    for index in range(4):
        await stored_card(session, prompt=f"Card {index}: ____")


def failing(_messages: list[ModelMessage], _info: AgentInfo) -> ModelResponse:
    raise RuntimeError("openrouter is down")


async def due_wake(
    session: AsyncSession, user: User, *, at: datetime | None = None
) -> Schedule:
    return await repository.create(
        session,
        user_id=user.id,
        kind="coach",
        due_at=at or NOON - timedelta(minutes=1),
        payload={"reason": "", "note": "a check"},
        created_by="system",
    )


async def due_reminder(
    session: AsyncSession, user: User, *, note: str = "redo exercise 3"
) -> Schedule:
    return await repository.create(
        session,
        user_id=user.id,
        kind="reminder",
        due_at=NOON - timedelta(minutes=1),
        payload={"note": note},
        created_by="user",
    )


async def wake_ups(session: AsyncSession, user: User) -> list[Schedule]:
    """This learner's coach rows, the one the run woke on first."""
    return list(
        await session.scalars(
            select(Schedule)
            .where(Schedule.user_id == user.id, Schedule.kind == "coach")
            .order_by(Schedule.created_at, Schedule.due_at)
            .execution_options(populate_existing=True)
        )
    )


async def thread_messages(session: AsyncSession, user: User, chat: Chat) -> str:
    rows = await HarnessRepository(session, user.id).rows(chat)
    return json.dumps([row.pydantic_ai for row in rows])


async def cards_sent(session: AsyncSession, user: User) -> list[CardDelivery]:
    return list(
        await session.scalars(
            select(CardDelivery)
            .where(CardDelivery.user_id == user.id)
            .order_by(CardDelivery.sent_at)
        )
    )


async def card_sent(
    session: AsyncSession,
    user: User,
    *,
    ago: timedelta,
    outcome: str | None = None,
    initiated: bool = True,
) -> CardDelivery:
    card = await stored_card(session, prompt=f"Sent {ago} ago")
    row = CardDelivery(
        user_id=user.id,
        card_id=card.id,
        tg_message_id=1,
        sent_at=datetime.now(UTC) - ago,
        outcome=outcome,
        initiated=initiated,
    )
    session.add(row)
    await session.commit()
    return row


async def went_unanswered(session: AsyncSession, user: User, count: int) -> None:
    """`count` cards in a row, a day apart, none of them answered; the last one
    four days ago."""
    for days in range(count):
        await card_sent(session, user, ago=timedelta(days=4 + days), outcome="ignored")


# The coach


@pytest.mark.usefixtures("thread")
async def test_a_silent_run_sends_nothing_and_sets_the_next_look(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    row = await due_wake(session, user)
    asked_for = TOMORROW.replace(hour=13).replace(tzinfo=None)

    with coach.override(model=deciding(next_check_at=asked_for, reason="lunch")):
        await worker.cycle(session, NOON)

    woken, following = await wake_ups(session, user)
    assert (woken.id, woken.status, woken.lease_until) == (row.id, "done", None)
    assert following.status == "pending"
    assert following.due_at == TOMORROW.replace(hour=13)
    assert following.payload == {"reason": "lunch", "note": wake.OWN}
    assert (bot.sent, bot.photos) == ([], [])
    assert await cards_sent(session, user) == []


@pytest.mark.usefixtures("thread")
async def test_a_run_that_sends_a_card_is_held_to_one_a_day(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    await ladder(session, user)
    await due_wake(session, user)

    with coach.override(model=deciding({"lesson": LESSON}, {"lesson": LESSON})):
        await worker.cycle(session, NOON)

    [sent] = await cards_sent(session, user)
    assert sent.initiated
    assert len(bot.sent) == 1


@pytest.mark.usefixtures("link")
async def test_a_learner_who_pairs_gets_a_wake_up_at_once(
    session: AsyncSession, user: User
) -> None:
    with coach.override(model=deciding()):
        await worker.cycle(session, NOON)
        await worker.cycle(session, NOON + timedelta(minutes=1))

    first, following = await wake_ups(session, user)
    assert (first.status, first.payload["note"]) == ("done", wake.FIRST)
    assert following.status == "pending"
    assert await wake.runs_today(session, user.id, NOON - timedelta(hours=12)) == 1


async def test_a_wake_up_with_no_channel_behind_it_is_dropped(
    session: AsyncSession, user: User
) -> None:
    """Made again by the cycle once a link exists; until then, no row and no
    run."""
    row = await due_wake(session, user)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "cancelled"
    assert [item.id for item in await wake_ups(session, user)] == [row.id]


@pytest.mark.usefixtures("thread")
async def test_quiet_hours_hold_the_wake_up_until_morning(
    session: AsyncSession, user: User
) -> None:
    night = NOON.replace(hour=23)
    row = await due_wake(session, user, at=night)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, night)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == policy.next_open(night, WAKING)


@pytest.mark.usefixtures("thread")
async def test_the_daily_run_cap_holds_the_next_run_until_tomorrow(
    session: AsyncSession, user: User
) -> None:
    session.add_all(
        BackgroundRun(user_id=user.id, kind=wake.KIND, usage={})
        for _ in range(settings.COACH_RUNS_DAILY)
    )
    row = await due_wake(session, user)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert (row.status, row.attempts) == ("deferred", 0)
    assert row.due_at == policy.tomorrow_open(NOON, WAKING)


@pytest.mark.usefixtures("thread")
async def test_a_spent_budget_defers_the_run_without_a_message(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    session.add(
        BackgroundRun(user_id=None, kind="card_writer", usage={"cost_usd": 1_000_000.0})
    )
    row = await due_wake(session, user)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert (row.status, row.attempts) == ("deferred", 0)
    assert row.due_at == policy.tomorrow_open(NOON, WAKING)
    assert bot.sent == []


@pytest.mark.usefixtures("thread")
async def test_a_failed_run_is_tried_again_and_still_counts(
    session: AsyncSession, user: User
) -> None:
    row = await due_wake(session, user)

    with coach.override(model=FunctionModel(failing)):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert (row.status, row.attempts) == ("pending", 1)
    assert row.due_at == policy.retry_at(NOON, 1)
    assert await wake.runs_today(session, user.id, NOON - timedelta(hours=12)) == 1


@pytest.mark.usefixtures("thread")
async def test_a_worker_that_dies_mid_run_returns_its_row(
    session: AsyncSession, user: User
) -> None:
    """The lease is the only thing another poller can see, so an expired one is
    the whole recovery: the row is pending again, one attempt poorer."""
    row = await due_wake(session, user, at=NOON - timedelta(hours=1))
    row.claimed_at = NOON - timedelta(minutes=30)
    row.lease_until = NOON - timedelta(minutes=25)
    await session.commit()

    with coach.override(model=deciding()):
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
    row = await due_wake(session, user)
    row.attempts = policy.MAX_ATTEMPTS - 1
    row.claimed_at = NOON - timedelta(minutes=30)
    row.lease_until = NOON - timedelta(minutes=25)
    await session.commit()

    with coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "failed"
    assert row.attempts == policy.MAX_ATTEMPTS


async def test_a_blocked_bot_pauses_everything_for_that_learner(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    """No retries into a dead channel: the send fails, the link is marked
    broken, and nothing of that learner's is claimed until it is repaired."""
    await ladder(session, user)
    row = await due_wake(session, user)
    bot.refuse = api.BotBlocked("bot was blocked by the user")

    with coach.override(model=deciding({"lesson": LESSON})):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    await session.refresh(link)
    assert link.status == "broken"
    # Held, not pushed to tomorrow: the row keeps the time it was meant for.
    assert (row.status, row.due_at) == ("deferred", NOON)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)
    await session.refresh(row)
    assert (row.status, row.claimed_at) == ("deferred", None)

    # Repairing the link releases what it held, in the very next cycle.
    link.status = "active"
    await session.commit()
    with coach.override(model=deciding({"lesson": LESSON})):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "done"
    assert len(await cards_sent(session, user)) == 1


# Mute


@pytest.mark.usefixtures("thread")
async def test_a_muted_learner_is_left_alone(session: AsyncSession, user: User) -> None:
    """A mute is not a reschedule: the row is not claimed at all, so it keeps
    the time it was meant for."""
    row = await due_wake(session, user)
    due_at = row.due_at
    await repository.mute(session, user.id, until=NOON + timedelta(days=2))

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "pending"
    assert row.due_at == due_at
    assert row.claimed_at is None


@pytest.mark.usefixtures("thread")
async def test_an_open_ended_mute_does_not_outlive_itself(
    session: AsyncSession, user: User
) -> None:
    """`/mute` with no end date parks the user in the year 9999. What was due
    while it held has to run once the learner asks for messages back."""
    row = await due_wake(session, user)
    await repository.mute(session, user.id, until=policy.INDEFINITE)

    with coach.override(model=FunctionModel(untouchable)):
        await worker.cycle(session, NOON)
    await session.refresh(row)
    assert row.status == "pending"

    await repository.mute(session, user.id, until=None)
    with coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "done"


# Reminders


@pytest.mark.usefixtures("thread")
async def test_reminders_due_together_go_out_in_one_message(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    rows = [
        await due_reminder(session, user, note=f"item {index}") for index in range(3)
    ]

    with replying(), coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    stored = await thread_messages(session, user, thread)
    for row in rows:
        await session.refresh(row)
        assert row.status == "done"
        assert row.payload["note"] in stored


async def test_a_reminder_is_delivered_after_the_days_message_is_spent(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """The learner named a time. Neither the day's one card nor a backoff
    wait pushes their own appointment down the day."""
    await went_unanswered(session, user, 4)
    await card_sent(session, user, ago=timedelta(minutes=30))
    reminder = await due_reminder(session, user)

    with replying(), coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    await session.refresh(reminder)
    assert reminder.status == "done"
    assert "redo exercise 3" in await thread_messages(session, user, thread)


@pytest.mark.usefixtures("thread")
async def test_a_reminder_neither_spends_the_days_message_nor_pays_the_floor(
    session: AsyncSession, user: User
) -> None:
    """The learner's appointment, not the platform's move: a learner with a
    daily reminder still gets their card, and the floor still sees a week
    without one."""
    await due_reminder(session, user)

    with replying(), coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    spent = await repository.initiations_today(
        session, user.id, policy.day_start(NOON, WAKING)
    )
    assert spent == 0
    assert await repository.last_initiation(session, user.id) is None


async def test_a_reminder_waits_for_a_transport_instead_of_being_cancelled(
    session: AsyncSession, user: User
) -> None:
    """Unpairing to move to another phone must not silently cancel what the
    learner asked for by name."""
    reminder = await due_reminder(session, user)

    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(reminder)
    assert (reminder.status, reminder.due_at) == (
        "deferred",
        policy.tomorrow_open(NOON, WAKING),
    )


async def test_a_thread_already_in_use_is_not_interrupted(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """The incoming message holds the thread's claim; the reminder finds it
    taken and comes back rather than landing in the middle of the answer."""
    row = await due_reminder(session, user)
    await HarnessRepository(session, user.id).claim_run(thread, uuid.uuid4())

    with replying(), coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.due_at == NOON + worker.BUSY_RETRY


@pytest.mark.usefixtures("thread")
async def test_a_reminder_run_that_fails_is_tried_again_later(
    session: AsyncSession, user: User
) -> None:
    row = await due_reminder(session, user)

    with (
        tutor.override(model=FunctionModel(failing), tools=[]),
        coach.override(model=deciding()),
    ):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "pending"
    assert row.attempts == 1
    assert row.due_at == policy.retry_at(NOON, 1)


async def test_a_spent_budget_holds_the_reminder_rather_than_failing_it(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    row = await due_reminder(session, user)
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

    with replying(), coach.override(model=deciding()):
        await worker.cycle(session, NOON)

    await session.refresh(row)
    assert row.status == "deferred"
    assert row.attempts == 0
    assert row.due_at == policy.tomorrow_open(NOON, WAKING)


# Silence


async def test_any_message_from_the_learner_ends_the_silence(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    await went_unanswered(session, user, 4)
    assert await repository.silence(session, user.id, datetime.now(UTC)) == 4

    await HarnessRepository(session, user.id).add_messages(
        thread, [ModelRequest(parts=[UserPromptPart(content="hi")])], role="user"
    )
    await session.execute(
        update(Message)
        .where(Message.chat_id == thread.id)
        .values(created_at=datetime.now(UTC) - timedelta(days=1))
    )
    await session.commit()

    assert await repository.silence(session, user.id, datetime.now(UTC)) == 0


async def test_a_tap_ends_the_silence_as_a_message_does(
    session: AsyncSession, user: User
) -> None:
    await went_unanswered(session, user, 2)
    assert await repository.silence(session, user.id, datetime.now(UTC)) == 2

    answered = await card_sent(session, user, ago=timedelta(days=1), outcome="correct")
    answered.answered_at = datetime.now(UTC) - timedelta(hours=20)
    await session.commit()

    assert await repository.silence(session, user.id, datetime.now(UTC)) == 0


async def test_a_card_answered_late_still_ends_the_silence(
    session: AsyncSession, user: User
) -> None:
    """Silence counts the ignored cards sent since the learner last did
    anything: a tap on an old card is something."""
    await went_unanswered(session, user, 3)
    old = (await cards_sent(session, user))[0]
    old.outcome = "correct"
    old.answered_at = datetime.now(UTC) - timedelta(days=1)
    await session.commit()

    assert await repository.silence(session, user.id, datetime.now(UTC)) == 0


# Housekeeping


async def test_housekeeping_removes_the_pairing_codes_and_update_ids_nothing_reads(
    session: AsyncSession, user: User
) -> None:
    now = datetime.now(UTC)
    await telegram.issue_code(session, user.id, now=now - 2 * telegram.CODE_TTL)
    await telegram.first_sighting(session, 1)
    await session.execute(
        update(TgUpdateSeen).values(
            received_at=now - telegram.UPDATE_RETENTION - timedelta(days=1)
        )
    )

    await worker.housekeep(session, now)

    assert await session.scalar(select(TgPairingCode)) is None
    assert await session.scalar(select(TgUpdateSeen)) is None


async def test_housekeeping_removes_the_lab_codes_nothing_reads(
    session: AsyncSession, user: User
) -> None:
    now = datetime.now(UTC)
    await labs.issue_code(session, user.id, now=now - 2 * labs.CODE_TTL)

    await worker.housekeep(session, now)

    assert await session.scalar(select(LabPairingCode)) is None


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

    await worker.housekeep(session, NOON)

    assert await session.scalar(select(UserSession).limit(1)) is None


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
    try:
        # Waited for rather than slept through: what the failed cycle costs
        # before the next one (logging it, mostly) is not this test's subject.
        async with asyncio.timeout(2):
            while len(cycles) < 2:
                await asyncio.sleep(0.01)
    finally:
        poller.cancel()

    assert len(cycles) > 1
