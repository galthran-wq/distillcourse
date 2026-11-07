"""Reading nudges: what `send_nudge` refuses, what it sends, and the Quick
check under a resume."""

from datetime import datetime, timedelta
from typing import Any

import pytest
from httpx import AsyncClient
from pydantic_ai.messages import ModelMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.coach import nudges, wake
from app.coach.agent import coach, decide
from app.core.config import settings
from app.models import (
    CardDelivery,
    Chat,
    LessonProgress,
    Message,
    Schedule,
    TgLink,
    User,
)
from app.scheduling import policy
from app.scheduling import repository as scheduling
from app.telegram.outbox import Outbox
from tests.coach.conftest import deciding
from tests.conftest import Bot
from tests.harness.conftest import returns
from tests.review.conftest import (  # noqa: F401  (a shared fixture)
    LESSON,
    SECTION,
    indexed_section,
    ladder,
    no_model,
    prompt_of,
    stored_card,
)
from tests.scheduling.conftest import NOON, thread  # noqa: F401  (a shared fixture)
from tests.telegram.conftest import (  # noqa: F401  (a shared fixture)
    configured_bot,
    deliver,
    tap,
)

pytestmark = pytest.mark.usefixtures("thread", "indexed_section", "configured_bot")

TEXT = "You stopped at the average. Why weight surprisal by probability at all?"
LINK = (
    f"{settings.FRONTEND_HOST}/courses/information-theory/lessons/"
    f"entropy-as-average-surprise#{SECTION}"
)


def nudge(
    kind: str = "resume", text: str = TEXT, **rest: Any
) -> tuple[str, dict[str, Any]]:
    return ("send_nudge", {"kind": kind, "lesson": LESSON, "text": text, **rest})


async def run(
    session: AsyncSession,
    user: User,
    link: TgLink,
    *sends: dict[str, Any] | tuple[str, dict[str, Any]],
    at: datetime = NOON,
) -> list[ModelMessage]:
    """One coach run; what its last request was handed."""
    asked: list[list[ModelMessage]] = []
    row = await scheduling.create(
        session,
        user_id=user.id,
        kind="coach",
        due_at=at,
        payload={"reason": "", "note": wake.OWN},
        created_by="system",
    )
    with coach.override(model=deciding(*sends, asked=asked)):
        await decide(session, user, Outbox(session=session, link=link), row, at)
    # Closed, as `wake.follow` would, so the next run's wake-up is the one live.
    row.status = "done"
    await session.commit()
    return asked[-1]


def said(messages: list[ModelMessage]) -> list[str]:
    return [str(text) for text in returns(messages, "send_nudge")]


async def started(
    session: AsyncSession, user: User, *, anchor: str | None = SECTION
) -> LessonProgress:
    row = LessonProgress(
        user_id=user.id,
        lesson=LESSON,
        active_seconds=120,
        max_scroll_pct=50,
        proofs_opened=0,
        solutions_opened=0,
        demos_touched=0,
        first_seen=NOON - timedelta(days=1),
        last_seen=NOON - timedelta(days=1),
        last_anchor=anchor,
    )
    session.add(row)
    await session.commit()
    return row


async def sent_nudges(session: AsyncSession, user: User) -> list[Schedule]:
    return list(
        await session.scalars(
            select(Schedule).where(
                Schedule.user_id == user.id, Schedule.kind == nudges.KIND
            )
        )
    )


# What it sends


async def test_a_resume_is_read_first_then_sent_with_a_link_to_where_they_stopped(
    session: AsyncSession,
    user: User,
    link: TgLink,
    bot: Bot,
    thread: Chat,  # noqa: F811
) -> None:
    await started(session, user)

    messages = await run(session, user, link, nudge(), nudge())

    first, second = said(messages)
    assert first.startswith(f"Nothing sent yet. The section `{LESSON}#{SECTION}`")
    assert "probability-weighted average of surprisal" in first
    assert second == f"Sent a resume nudge on {LESSON}#{SECTION}."
    [row] = await sent_nudges(session, user)
    assert (row.status, row.due_at) == ("done", NOON)
    [message] = bot.sent
    assert message.text == TEXT
    assert message.keyboard == [
        [
            {"text": "Continue", "url": LINK},
            {"text": "Quick check instead", "callback_data": f"q:{row.id}"},
        ]
    ]
    [stored] = await session.scalars(
        select(Message).where(Message.chat_id == thread.id, Message.role == "agent")
    )
    assert TEXT in str(stored.pydantic_ai)


async def test_the_link_is_the_lessons_page_at_the_sections_heading(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user, anchor=None)

    await run(session, user, link, nudge(anchor=SECTION), nudge(anchor=SECTION))

    [message] = bot.sent
    assert message.keyboard is not None
    assert message.keyboard[0][0]["url"] == LINK


async def test_a_hook_links_to_the_top_of_an_unopened_lesson_with_no_quick_check(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    messages = await run(session, user, link, nudge("hook"), nudge("hook"))

    assert said(messages)[1] == f"Sent a hook nudge on {LESSON}."
    [message] = bot.sent
    assert message.keyboard == [[{"text": "Read it", "url": LINK.partition("#")[0]}]]


async def test_a_resume_from_a_heading_since_renamed_links_to_the_top(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user, anchor="a-heading-since-renamed")

    messages = await run(session, user, link, nudge(), nudge())

    assert said(messages)[1] == f"Sent a resume nudge on {LESSON}."
    [message] = bot.sent
    assert message.keyboard is not None
    assert message.keyboard[0][0]["url"] == LINK.partition("#")[0]


# What it refuses


async def test_301_characters_are_refused_and_300_are_sent(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    longest = "x" * nudges.TEXT_CHARS

    messages = await run(
        session,
        user,
        link,
        nudge(text=longest + "x"),
        nudge(text=longest),
        nudge(text=longest),
    )

    assert said(messages)[0] == "Not sent: the text is 301 characters; 300 at most."
    assert [message.text for message in bot.sent] == [longest]


async def test_an_unknown_lesson_or_section_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    elsewhere = "lesson:information-theory/no-such-lesson"
    brief = "research:information-theory/a-brief"

    messages = await run(
        session,
        user,
        link,
        ("send_nudge", {"kind": "hook", "lesson": elsewhere, "text": TEXT}),
        ("send_nudge", {"kind": "hook", "lesson": brief, "text": TEXT}),
        nudge(anchor="no-such-section"),
    )

    assert said(messages) == [
        f"Not sent: {elsewhere} is not a lesson on the site.",
        f"Not sent: {brief} is not a lesson on the site.",
        f"Not sent: {LESSON} has no section `no-such-section`.",
    ]
    assert bot.sent == []


async def test_a_resume_needs_a_lesson_left_unfinished_and_a_hook_one_unopened(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    messages = await run(session, user, link, nudge())
    progress = await started(session, user)
    messages += await run(session, user, link, nudge("hook"))
    progress.completed_at = NOON - timedelta(hours=1)
    await session.commit()
    messages += await run(session, user, link, nudge())

    assert said(messages) == [
        f"Not sent: {LESSON} is not a lesson the learner left unfinished.",
        f"Not sent: the learner has opened {LESSON} already.",
        f"Not sent: {LESSON} is not a lesson the learner left unfinished.",
    ]
    assert bot.sent == []


async def test_after_a_nudge_today_a_card_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    await stored_card(session)
    await ladder(session, user)

    messages = await run(session, user, link, nudge(), nudge(), {"lesson": LESSON})

    assert returns(messages, "send_card") == [
        "Not sent: today's message has already gone out."
    ]
    assert len(bot.sent) == 1


async def test_after_a_card_today_a_nudge_is_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    await stored_card(session)
    await ladder(session, user)

    messages = await run(session, user, link, {"lesson": LESSON}, nudge())

    assert said(messages) == ["Not sent: today's message has already gone out."]
    assert len(bot.sent) == 1


async def test_outside_the_waking_hours_not_today_and_a_backoff_are_refused(
    session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    late = await run(session, user, link, nudge(), at=NOON.replace(hour=23))
    user.cards_paused_until = NOON + timedelta(hours=10)
    await session.commit()
    paused = await run(session, user, link, nudge())
    user.cards_paused_until = None
    card = await stored_card(session)
    session.add_all(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=NOON - timedelta(days=days),
            outcome="ignored",
            initiated=True,
        )
        for days in (3, 4, 5, 6)
    )
    await session.commit()
    waiting = await run(session, user, link, nudge())

    assert said(late)[0].startswith("Not sent: it is outside")
    assert said(paused)[0].startswith("Not sent: the learner pressed Not today")
    assert said(waiting)[0].startswith("Not sent: 4 cards in a row")
    assert bot.sent == []


async def test_a_nudge_is_the_days_message_and_the_last_initiation(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    await started(session, user)

    await run(session, user, link, nudge(), nudge())

    hours = policy.Hours.of(user)
    since = policy.day_start(NOON, hours)
    assert await scheduling.initiations_today(session, user.id, since) == 1
    assert await scheduling.last_initiation(session, user.id) == NOON


# What the coach is told


async def test_the_summary_names_where_they_stopped_and_the_nudges_sent(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    await started(session, user)
    await run(session, user, link, nudge(), nudge())

    messages = await run(session, user, link, at=NOON + timedelta(days=1))

    summary = prompt_of(messages)
    assert f"`{LESSON}`: 50% scrolled" in summary
    assert f"unfinished, stopped at `{SECTION}`" in summary
    assert f"`{LESSON}#{SECTION}`, resume nudge" in summary


# Quick check instead


async def test_quick_check_sends_a_card_on_the_lesson_and_spends_no_initiation(
    client: AsyncClient, session: AsyncSession, user: User, link: TgLink, bot: Bot
) -> None:
    await started(session, user)
    card = await stored_card(session)
    await run(session, user, link, nudge(), nudge())
    [row] = await sent_nudges(session, user)

    with no_model():
        await deliver(client, tap(f"q:{row.id}", message_id=1))
        await deliver(client, tap(f"q:{row.id}", message_id=1, update_id=2))

    [sent] = await session.scalars(
        select(CardDelivery).where(CardDelivery.user_id == user.id)
    )
    assert (sent.card_id, sent.initiated) == (card.id, False)
    assert len(bot.sent) == 2
    since = policy.day_start(NOON, policy.Hours.of(user))
    assert await scheduling.initiations_today(session, user.id, since) == 1
    assert bot.rekeyed[-1] == (1, [[{"text": "Continue", "url": LINK}]])


async def test_a_quick_check_on_someone_elses_nudge_does_nothing(
    client: AsyncClient,
    session: AsyncSession,
    other_user: User,
    bot: Bot,
) -> None:
    await stored_card(session)
    row = await scheduling.create(
        session,
        user_id=other_user.id,
        kind=nudges.KIND,
        due_at=NOON,
        payload={"nudge": "resume", "lesson": LESSON, "anchor": None},
        created_by="system",
    )

    await deliver(client, tap(f"q:{row.id}"))

    assert bot.sent == []
