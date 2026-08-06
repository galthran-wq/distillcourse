from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Chat, Schedule, User
from app.scheduling import policy, repository, worker
from tests.conftest import replying
from tests.harness.conftest import calling, echoing
from tests.scheduling.conftest import NOON

FRIDAY = NOON + timedelta(days=2)


async def only_schedule(session: AsyncSession) -> Schedule:
    return (await session.scalars(select(Schedule))).one()


async def test_the_agent_sets_a_reminder_the_learner_asked_for(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    repo = HarnessRepository(session, user.id)

    with tutor.override(
        model=calling(
            "create_reminder", due_at=FRIDAY.isoformat(), note="redo exercise 3"
        )
    ):
        answer = await runner.run(
            repo, thread, "remind me on Friday to redo exercise 3"
        )

    row = await only_schedule(session)
    assert "is set" in answer
    assert row.kind == "reminder"
    assert row.created_by == "user"
    assert row.due_at == FRIDAY
    assert row.payload["note"] == "redo exercise 3"


async def test_a_time_without_a_zone_is_read_on_the_learners_clock(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    user.timezone = "Europe/Moscow"
    await session.commit()
    naive = FRIDAY.replace(tzinfo=None, hour=9, minute=0)

    with tutor.override(
        model=calling(
            "create_reminder", due_at=naive.isoformat(), note="reread the chapter"
        )
    ):
        await runner.run(
            HarnessRepository(session, user.id), thread, "remind me Friday morning"
        )

    row = await only_schedule(session)
    assert row.due_at == naive.replace(tzinfo=ZoneInfo("Europe/Moscow"))


async def test_the_prompt_tells_the_agent_what_time_it_is_for_the_learner(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """ "Friday" is only resolvable against the learner's own clock, so every
    run carries it."""
    user.timezone = "Europe/Moscow"
    await session.commit()

    with tutor.override(model=echoing()):
        prompt = await runner.run(
            HarnessRepository(session, user.id), thread, "what day is it?"
        )

    assert "Their timezone is `Europe/Moscow`" in prompt


async def test_a_reminder_needs_a_channel_to_arrive_over(
    session: AsyncSession, user: User
) -> None:
    repo = HarnessRepository(session, user.id)
    web = await repo.create_chat(kind="web")

    with tutor.override(
        model=calling(
            "create_reminder", due_at=FRIDAY.isoformat(), note="redo exercise 3"
        )
    ):
        answer = await runner.run(repo, web, "remind me on Friday", medium="web")

    assert "no Telegram connected" in answer
    assert (await session.scalars(select(Schedule))).all() == []


async def test_the_learner_can_see_and_cancel_a_reminder(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    repo = HarnessRepository(session, user.id)
    row = await repository.create(
        session,
        user_id=user.id,
        kind="reminder",
        due_at=FRIDAY,
        payload={"note": "redo exercise 3"},
        created_by="user",
    )

    with tutor.override(model=calling("list_reminders")):
        listed = await runner.run(repo, thread, "what am I down for?")
    with tutor.override(model=calling("cancel_reminder", reminder_id=str(row.id))):
        cancelled = await runner.run(repo, thread, "drop that one")

    await session.refresh(row)
    assert "redo exercise 3" in listed
    assert str(row.id) in cancelled
    assert row.status == "cancelled"


async def test_a_reminder_reaches_the_learner_at_its_time(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    repo = HarnessRepository(session, user.id)

    with tutor.override(
        model=calling(
            "create_reminder", due_at=FRIDAY.isoformat(), note="redo exercise 3"
        )
    ):
        await runner.run(repo, thread, "remind me on Friday to redo exercise 3")
    with replying(text="you were going to redo exercise 3"):
        await worker.cycle(session, FRIDAY)

    row = await only_schedule(session)
    stored = str([message.pydantic_ai for message in await repo.rows(thread)])
    # Delivered, not awaiting an answer: a reminder asked for nothing, so it
    # does not hold the proactive slot the reviews queue behind.
    assert row.status == "done"
    assert "you were going to redo exercise 3" in stored


async def test_muting_from_the_conversation_stops_the_next_message(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    repo = HarnessRepository(session, user.id)
    review = await repository.create(
        session,
        user_id=user.id,
        kind="review",
        due_at=NOON - timedelta(minutes=1),
        payload={"note": "entropy is due for review"},
        created_by="system",
    )

    with tutor.override(model=calling("mute_proactive")):
        await runner.run(repo, thread, "/mute")
    before = len(await repo.rows(thread))
    with replying():
        await worker.cycle(session, NOON)

    await session.refresh(user)
    await session.refresh(review)
    assert user.muted_until == policy.INDEFINITE
    # Held where it stands, not pushed out to the year 9999: the mute is undone
    # by clearing one column, and this row is due again the moment it is.
    assert review.status == "pending"
    assert review.claimed_at is None
    assert len(await repo.rows(thread)) == before


async def test_the_learner_can_turn_the_messages_back_on(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    repo = HarnessRepository(session, user.id)
    await repository.mute(session, user.id, until=datetime.now(UTC) + timedelta(days=7))

    with tutor.override(model=calling("unmute_proactive")):
        await runner.run(repo, thread, "you can write to me again")

    await session.refresh(user)
    assert user.muted_until is None
