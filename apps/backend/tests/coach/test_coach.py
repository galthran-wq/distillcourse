"""The coach: what it is handed, what its send tool refuses, when it wakes,
and the floor under a silent week."""

from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach import floor, wake
from app.coach.agent import coach, decide
from app.harness import runner
from app.harness.agent import tutor
from app.harness.prompts import module
from app.harness.repository import HarnessRepository
from app.models import BackgroundRun, CardDelivery, Chat, Schedule, TgLink, User
from app.scheduling import policy, worker
from app.scheduling import repository as scheduling
from app.telegram.outbox import Outbox
from tests.coach.conftest import asleep, awake, deciding
from tests.conftest import Bot, replying
from tests.harness.conftest import calling, returns
from tests.review.conftest import (  # noqa: F401  (a shared fixture)
    LESSON,
    indexed_section,
    ladder,
    prompt_of,
    stored_card,
)
from tests.scheduling.conftest import NOON, thread  # noqa: F401  (a shared fixture)
from tests.telegram.conftest import (  # noqa: F401  (a shared fixture)
    configured_bot,
    deliver,
    message,
    tap,
)
from tests.telemetry.conftest import (  # noqa: F401  (a shared fixture)
    HEARTBEATS_TO_COMPLETE,
    indexed_lesson,
    read,
    stamped_read,
)
from tests.telemetry.conftest import LESSON as READ_LESSON

UTC_WAKING = policy.Hours(ZoneInfo("UTC"), time(9), time(22))
FAR = NOON + timedelta(days=5)

pytestmark = pytest.mark.usefixtures("thread", "indexed_section", "configured_bot")


async def wake_up(
    session: AsyncSession, user: User, *, at: datetime = FAR, reason: str = ""
) -> Schedule:
    return await scheduling.create(
        session,
        user_id=user.id,
        kind="coach",
        due_at=at,
        payload={"reason": reason, "note": wake.OWN},
        created_by="system",
    )


async def run(
    session: AsyncSession,
    user: User,
    link: TgLink,
    *sends: dict[str, object],
    asked: list[list[ModelMessage]] | None = None,
) -> list[ModelMessage]:
    """One coach run on a fresh wake-up; what its last request was handed."""
    seen = [] if asked is None else asked
    row = await wake_up(session, user, at=NOON)
    with coach.override(model=deciding(*sends, asked=seen)):
        await decide(session, user, Outbox(session=session, link=link), row, NOON)
    return seen[-1]


def sent_back(messages: list[ModelMessage]) -> list[str]:
    return [str(text) for text in returns(messages, "send_card")]


async def initiated(session: AsyncSession, user: User) -> list[CardDelivery]:
    return list(
        await session.scalars(
            select(CardDelivery).where(
                CardDelivery.user_id == user.id, CardDelivery.initiated
            )
        )
    )


# What the run is handed


async def test_the_run_is_handed_a_summary_and_never_the_thread(
    session: AsyncSession,
    user: User,
    link: TgLink,
    thread: Chat,  # noqa: F811
) -> None:
    await HarnessRepository(session, user.id).add_messages(
        thread,
        [ModelRequest(parts=[UserPromptPart(content="a thread-only remark")])],
        role="user",
    )
    await ladder(session, user)
    asked: list[list[ModelMessage]] = []

    await run(session, user, link, asked=asked)

    [first] = asked
    [request] = first
    assert isinstance(request, ModelRequest)
    assert request.instructions == module("coach.md")
    [prompt] = request.parts
    assert isinstance(prompt, UserPromptPart)
    assert isinstance(prompt.content, str)
    assert "## This run" in prompt.content
    assert f"`{LESSON}`: step 0, level 1" in prompt.content
    # Their last messages are summarised for language and tone, fenced as
    # the learner's; nothing else of the thread is there.
    assert '<untrusted source="learner-messages">' in prompt.content


async def test_a_bot_memory_the_tutor_saved_is_in_the_next_summary(
    session: AsyncSession,
    user: User,
    link: TgLink,
    thread: Chat,  # noqa: F811
) -> None:
    with tutor.override(
        model=calling(
            "save_memory",
            slug="bot-mornings-only",
            description="when the bot may write",
            content="Only send cards before 11:00.",
        )
    ):
        await runner.run(
            HarnessRepository(session, user.id), thread, "only mornings please"
        )

    summary = prompt_of(await run(session, user, link))
    assert "- `bot-mornings-only`: Only send cards before 11:00." in summary


async def test_every_run_is_charged_where_the_cap_counts_it(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    await run(session, user, link)

    [charged] = (await session.scalars(select(BackgroundRun))).all()
    assert (charged.user_id, charged.kind) == (user.id, wake.KIND)
    assert charged.usage["requests"] == 1


# What send_card refuses


async def test_send_card_sends_one_card_at_the_lessons_level(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)
    await stored_card(session)
    await ladder(session, user)

    messages = await run(session, user, link, {"lesson": LESSON})

    assert sent_back(messages) == [f"Sent a level 1 card on {LESSON}."]
    assert len(await initiated(session, user)) == 1
    assert len(bot.sent) == 1


async def test_a_second_card_the_same_day_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)
    await stored_card(session)
    await ladder(session, user)

    messages = await run(session, user, link, {"lesson": LESSON}, {"lesson": LESSON})

    assert sent_back(messages)[1] == "Not sent: today's message has already gone out."
    assert len(bot.sent) == 1


async def test_a_backoff_wait_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)
    await ladder(session, user)
    card = await stored_card(session, prompt="An old one: ____")
    session.add_all(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=datetime.now(UTC) - timedelta(days=days),
            outcome="ignored",
            initiated=True,
        )
        for days in (3, 4, 5, 6)
    )
    await session.commit()

    messages = await run(session, user, link, {"lesson": LESSON})

    assert sent_back(messages)[0].startswith("Not sent: 4 cards in a row")
    assert bot.sent == []


async def test_not_today_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)
    await ladder(session, user)
    user.cards_paused_until = datetime.now(UTC) + timedelta(hours=10)
    await session.commit()

    messages = await run(session, user, link, {"lesson": LESSON})

    assert sent_back(messages)[0].startswith("Not sent: the learner pressed Not today")
    assert bot.sent == []


async def test_outside_the_waking_hours_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await asleep(session, user)
    await ladder(session, user)

    messages = await run(session, user, link, {"lesson": LESSON})

    assert sent_back(messages)[0].startswith("Not sent: it is outside")
    assert bot.sent == []


async def test_a_lesson_never_finished_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)

    messages = await run(session, user, link, {"lesson": LESSON})

    assert sent_back(messages) == [
        f"Not sent: {LESSON} is not a lesson the learner has finished."
    ]
    assert bot.sent == []


# When it wakes


def test_the_next_look_is_clamped_at_both_ends_and_into_the_window() -> None:
    now = NOON
    soon = now + timedelta(minutes=30)
    assert wake.clamp(soon, now, UTC_WAKING) == now + wake.EARLIEST
    assert wake.clamp(now + timedelta(days=30), now, UTC_WAKING) == now + wake.LATEST
    # 19:00 + 4h is past the close: the next look is the next morning.
    evening = now.replace(hour=19)
    assert wake.clamp(evening, evening, UTC_WAKING) == (
        now + timedelta(days=1)
    ).replace(hour=9)


def test_a_next_look_without_a_zone_is_on_the_learners_clock() -> None:
    moscow = policy.Hours(ZoneInfo("Europe/Moscow"), time(9), time(22))
    asked = (NOON + timedelta(days=1)).replace(hour=13, tzinfo=None)
    assert wake.clamp(asked, NOON, moscow) == asked.replace(tzinfo=moscow.tz)


async def test_there_is_never_more_than_one_live_wake_up(
    session: AsyncSession, user: User
) -> None:
    await wake.ensure(session, NOON)
    await wake.ensure(session, NOON)

    live = (
        await session.scalars(select(Schedule).where(Schedule.kind == wake.KIND))
    ).all()
    assert len(live) == 1
    with pytest.raises(IntegrityError):
        await wake_up(session, user)
    await session.rollback()


async def test_finishing_a_lesson_pulls_the_next_look_forward_once(
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
    indexed_lesson: None,  # noqa: ARG001, F811
) -> None:
    # Read something yesterday, so the reading below is not a return.
    await stamped_read(
        session, user.id, datetime.now(UTC) - timedelta(days=1), lesson=LESSON
    )
    row = await wake_up(session, user)

    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    await session.refresh(row)
    assert row.payload["note"] == wake.finished(READ_LESSON)
    assert row.due_at - datetime.now(UTC) < wake.SOON + timedelta(minutes=1)

    # A later flush derives the same completion again; the look stays put.
    row.due_at = FAR
    await session.commit()
    await read(signed_in, session, heartbeats=2, depth=100)
    await session.refresh(row)
    assert row.due_at == FAR


async def test_a_message_after_a_week_away_pulls_the_next_look_forward(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    await stamped_read(
        session, user.id, datetime.now(UTC) - timedelta(days=8), lesson=LESSON
    )
    row = await wake_up(session, user)

    with replying():
        await deliver(client, message("I'm back"))

    await session.refresh(row)
    assert row.payload["note"] == wake.BACK
    assert row.due_at < NOON + timedelta(days=2)


async def test_a_message_after_two_days_leaves_the_next_look_alone(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    await stamped_read(
        session, user.id, datetime.now(UTC) - timedelta(days=2), lesson=LESSON
    )
    row = await wake_up(session, user)

    with replying():
        await deliver(client, message("hello again"))

    await session.refresh(row)
    assert (row.due_at, row.payload["note"]) == (FAR, wake.OWN)


async def test_a_tap_after_a_week_away_pulls_the_next_look_forward(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    card = await stored_card(session)
    sent = CardDelivery(
        user_id=user.id,
        card_id=card.id,
        tg_message_id=55,
        sent_at=datetime.now(UTC) - timedelta(days=8),
        outcome="ignored",
    )
    session.add(sent)
    row = await wake_up(session, user)

    await deliver(client, tap(f"k:{sent.id}:0"))

    await session.refresh(row)
    assert row.payload["note"] == wake.BACK


async def test_a_lesson_opened_after_a_week_away_pulls_the_next_look_forward(
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
    indexed_lesson: None,  # noqa: ARG001, F811
) -> None:
    await stamped_read(
        session, user.id, datetime.now(UTC) - timedelta(days=8), lesson=LESSON
    )
    row = await wake_up(session, user)

    await read(signed_in, session, heartbeats=1, depth=25)

    await session.refresh(row)
    assert row.payload["note"] == wake.BACK


# The floor


async def test_a_silent_run_after_a_silent_week_still_sends_one_card(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await awake(session, user)
    await stored_card(session)
    await ladder(session, user)
    link.created_at = NOON - floor.FLOOR - timedelta(hours=1)
    await session.commit()
    await wake_up(session, user, at=NOON - timedelta(minutes=1))

    with coach.override(model=deciding()):
        await worker.cycle(session, NOON)
        await worker.cycle(session, NOON + timedelta(hours=5))

    [sent] = await initiated(session, user)
    assert len(bot.sent) == 1
    assert not await floor.owed(session, link, NOON)


async def test_the_floor_is_not_owed_within_a_week_of_a_card(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    link.created_at = NOON - timedelta(days=30)
    card = await stored_card(session)
    session.add(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=NOON - timedelta(days=6),
            initiated=True,
        )
    )
    await session.commit()

    assert not await floor.owed(session, link, NOON)
