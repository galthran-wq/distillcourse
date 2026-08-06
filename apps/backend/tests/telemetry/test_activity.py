from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.core.config import settings
from app.models import User
from tests.telemetry.conftest import (
    HEARTBEAT_SECONDS,
    HEARTBEATS_TO_COMPLETE,
    LESSON,
    read,
    stamped_read,
)

pytestmark = pytest.mark.usefixtures("indexed_lesson")

ACTIVITY = f"{settings.API_V1_STR}/telemetry/activity"
# Well clear of midnight in UTC and late evening in Sydney, which is what makes
# the reader's own zone visible in the day an entry falls on.
EVENING = datetime(2026, 8, 4, 9, 0, tzinfo=UTC)
OTHER_LESSON = "lesson:information-theory/kraft-inequality"


async def test_an_anonymous_visitor_is_refused(client: AsyncClient) -> None:
    assert (await client.get(ACTIVITY)).status_code == 401
    assert (await client.get(f"{ACTIVITY}/2026-08-04")).status_code == 401


async def test_a_reader_who_has_read_nothing_gets_an_empty_grid(
    signed_in: AsyncClient,
) -> None:
    assert (await signed_in.get(ACTIVITY)).json() == {"days": [], "feed": []}


async def test_a_day_read_is_a_square_on_the_readers_calendar(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    body = (await signed_in.get(ACTIVITY)).json()

    today = datetime.now(UTC).date().isoformat()
    assert body["days"] == [{"date": today, "count": 1, "minutes": 3}]
    assert [(entry["date"], entry["lesson"]) for entry in body["feed"]] == [
        (today, LESSON)
    ]


async def test_a_day_under_the_bar_is_no_square_but_still_a_line(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    # Forty seconds, halfway down the page: not a reading day, and the grid says
    # so — but the reader did open the lesson, and the feed is what they did.
    await read(signed_in, session, heartbeats=4, depth=50)

    body = (await signed_in.get(ACTIVITY)).json()

    assert [day["count"] for day in body["days"]] == [0]
    assert body["feed"][0]["seconds"] == 40


async def test_a_days_sittings_of_one_lesson_are_one_line(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    """In, out, in, out, in: one line spanning the whole of it."""
    for hour in (9, 14, 20):
        await stamped_read(
            session, user.id, EVENING.replace(hour=hour), heartbeats=6, depth=25
        )

    feed = (await signed_in.get(ACTIVITY)).json()["feed"]

    assert len(feed) == 1
    assert feed[0]["seconds"] == 3 * 6 * HEARTBEAT_SECONDS
    assert datetime.fromisoformat(feed[0]["first_at"]) == EVENING.replace(hour=9)
    # The last event of the last sitting: six beats and the scroll behind them,
    # stamped a second apart.
    assert datetime.fromisoformat(feed[0]["last_at"]) == EVENING.replace(
        hour=20
    ) + timedelta(seconds=6)


async def test_two_lessons_on_one_day_are_two_lines(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await stamped_read(session, user.id, EVENING, heartbeats=6, depth=25)
    await stamped_read(
        session,
        user.id,
        EVENING + timedelta(hours=2),
        heartbeats=6,
        depth=25,
        lesson=OTHER_LESSON,
    )

    feed = (await signed_in.get(ACTIVITY)).json()["feed"]

    # Newest first inside the day, which is the last thing they were reading.
    assert [entry["lesson"] for entry in feed] == [OTHER_LESSON, LESSON]


async def test_an_entry_falls_on_the_day_its_square_does(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    user.timezone = "Australia/Sydney"
    await session.commit()
    # One UTC day, two Sydney days: 19:00 on the 4th and 01:00 on the 5th.
    await stamped_read(session, user.id, EVENING)
    await stamped_read(session, user.id, EVENING + timedelta(hours=6))
    await cli.rebuild_progress(session)

    body = (await signed_in.get(ACTIVITY)).json()

    assert [day["date"] for day in body["days"]] == ["2026-08-04", "2026-08-05"]
    assert [entry["date"] for entry in body["feed"]] == ["2026-08-05", "2026-08-04"]
    # The span is stated on the clock the day was cut on, or it would name an
    # hour the reader never read at.
    assert body["feed"][0]["first_at"] == "2026-08-05T01:00:00+10:00"


async def test_one_day_answers_with_its_own_lines(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await stamped_read(session, user.id, EVENING, heartbeats=6, depth=25)
    await stamped_read(
        session, user.id, EVENING - timedelta(days=1), heartbeats=6, depth=25
    )

    body = (await signed_in.get(f"{ACTIVITY}/2026-08-04")).json()

    assert [entry["date"] for entry in body["feed"]] == ["2026-08-04"]


async def test_a_day_nothing_is_left_of_answers_with_nothing(
    signed_in: AsyncClient,
) -> None:
    # A square outlives the events behind it, so an old date is an empty answer
    # rather than a failure.
    assert (await signed_in.get(f"{ACTIVITY}/2020-01-01")).json() == {"feed": []}
