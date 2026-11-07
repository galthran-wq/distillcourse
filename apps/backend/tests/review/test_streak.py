"""The streak: counted from the answers on the learner's calendar, shown on
the first line of a card and its feedback from its second day, and nowhere
else."""

import itertools
import re
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CardDelivery, ReviewCard, User
from app.review.streak import local_days, streak
from tests.conftest import Bot
from tests.review.conftest import LESSON, no_model, send_due, stored_card
from tests.review.conftest import ladder as ladder_row
from tests.telegram.conftest import deliver, tap

pytestmark = pytest.mark.usefixtures("thread", "indexed_section")

TODAY = date(2026, 11, 7)
UPDATES = itertools.count(300)
TITLE = LESSON
ELSEWHERE = "lesson:information-theory/prefix-codes"


def ago(*days: int) -> list[date]:
    return [TODAY - timedelta(days=count) for count in days]


@pytest.mark.parametrize(
    ("answered", "expected"),
    [
        ([], 0),
        (ago(0), 1),
        (ago(0, 1, 2, 3, 4), 5),
        # Several answers in a day are one day.
        (ago(0, 0, 1, 1), 2),
        # Today not yet answered: the run up to yesterday stands.
        (ago(1, 2, 3), 3),
        # A gap of one missed day is forgiven, and is not itself counted.
        (ago(0, 2, 3), 3),
        (ago(2, 3), 2),
        # A gap of two ends it.
        (ago(0, 3, 4), 1),
        (ago(3, 4, 5), 0),
        # Two forgiven gaps are two single missed days, not two in a row.
        (ago(0, 2, 4), 3),
        # A day after today is not an answer yet.
        ([TODAY + timedelta(days=1)], 0),
    ],
)
def test_streak(answered: list[date], expected: int) -> None:
    assert streak(answered, TODAY) == expected


def test_answers_either_side_of_local_midnight_are_two_days() -> None:
    tokyo = ZoneInfo("Asia/Tokyo")
    # 23:59 and 00:01 in Tokyo: one UTC day, two of the learner's.
    late = datetime(2026, 11, 6, 14, 59, tzinfo=UTC)
    early = late + timedelta(minutes=2)

    days = local_days([late, early], tokyo)

    assert days == [date(2026, 11, 6), date(2026, 11, 7)]
    assert streak(days, date(2026, 11, 7)) == 2
    assert streak(local_days([late, early], UTC), date(2026, 11, 6)) == 1


def test_only_the_card_heading_reads_the_streak() -> None:
    """Nothing but the first line of a card can send a word about it."""
    app = Path(__file__).parents[2] / "app"
    readers = {
        path.relative_to(app).as_posix()
        for path in app.rglob("*.py")
        if re.search(r"^from app\.review import .*\bstreak\b", path.read_text(), re.M)
        or "app.review.streak" in path.read_text()
    }
    assert readers == {"review/cards.py"}


async def answered_days_ago(session: AsyncSession, user: User, *days: int) -> None:
    """Taps on a card of another lesson, which leaves this one's ladder due."""
    card = ReviewCard(
        lesson=ELSEWHERE,
        kind="gap",
        level=1,
        prompt="An earlier one: ____",
        options=["this", "that"],
        answer=0,
        explanation="Because.",
        content_hash="b" * 64,
    )
    session.add(card)
    await session.flush()
    now = datetime.now(UTC)
    session.add_all(
        CardDelivery(
            user_id=user.id,
            card_id=card.id,
            tg_message_id=1,
            sent_at=now - timedelta(days=count),
            answered_at=now - timedelta(days=count),
            chosen=0,
            outcome="correct",
        )
        for count in days
    )
    await session.commit()


async def card_and_tap(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> tuple[str, str]:
    """The first line of a card sent now, and of the feedback on its tap."""
    await ladder_row(session, user)
    await stored_card(session)
    with no_model():
        sent = await send_due(session, user)
    assert sent is not None
    with no_model():
        await deliver(
            client,
            tap(
                f"k:{sent.id}:0",
                update_id=next(UPDATES),
                message_id=sent.tg_message_id,
            ),
        )
    [card] = bot.sent
    _, feedback = bot.edited[-1]
    return card.text.split("\n")[0], feedback.split("\n")[0]


async def test_day_one_shows_nothing_and_day_two_shows_the_line(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await answered_days_ago(session, user, 1)

    card, feedback = await card_and_tap(client, session, user, bot)

    assert card == f"<b>{TITLE}</b>"
    assert feedback == f"<b>Day 2 · {TITLE}</b>"


async def test_a_streak_is_carried_over_a_missed_day(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await answered_days_ago(session, user, 2, 3)

    card, feedback = await card_and_tap(client, session, user, bot)

    assert card == f"<b>Day 2 · {TITLE}</b>"
    assert feedback == f"<b>Day 3 · {TITLE}</b>"


async def test_a_broken_streak_starts_over_and_sends_nothing(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    await answered_days_ago(session, user, 3, 4, 5, 6)

    card, feedback = await card_and_tap(client, session, user, bot)

    assert (card, feedback) == (f"<b>{TITLE}</b>", f"<b>{TITLE}</b>")
    # The card is the one message: nothing about the run that ended.
    assert len(bot.sent) == 1 and bot.photos == []
