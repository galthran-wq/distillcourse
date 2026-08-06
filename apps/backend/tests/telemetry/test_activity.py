import uuid
from datetime import UTC, datetime, timedelta, tzinfo
from zoneinfo import ZoneInfo

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.core.config import settings
from app.models import Event, User
from app.telemetry import schemas
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
# the reader's own zone visible in the day an entry falls on. Anchored on today
# rather than written out: the grid is 53 weeks wide, and a literal date falls
# out of it within the year.
EVENING = datetime.now(UTC).replace(hour=9, minute=0, second=0, microsecond=0)
SYDNEY = ZoneInfo("Australia/Sydney")
OTHER_LESSON = "lesson:information-theory/kraft-inequality"


def on(at: datetime, tz: tzinfo = UTC) -> str:
    """The day an instant falls on, as the API dates a day."""
    return at.astimezone(tz).date().isoformat()


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
    assert body["days"] == [
        {
            "date": today,
            "count": 1,
            "seconds": HEARTBEATS_TO_COMPLETE * HEARTBEAT_SECONDS,
        }
    ]
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
    # The last *heartbeat* of the last sitting: six of them, stamped a second
    # apart, and the scroll that trails them is not reading.
    assert datetime.fromisoformat(feed[0]["last_at"]) == EVENING.replace(
        hour=20
    ) + timedelta(seconds=5)


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
    user.timezone = SYDNEY.key
    await session.commit()
    # One UTC day, two Sydney days: an evening, and the small hours after it.
    small_hours = EVENING + timedelta(hours=6)
    await stamped_read(session, user.id, EVENING)
    await stamped_read(session, user.id, small_hours)
    await cli.rebuild_progress(session)

    body = (await signed_in.get(ACTIVITY)).json()

    assert on(EVENING, SYDNEY) != on(small_hours, SYDNEY)
    assert [day["date"] for day in body["days"]] == [
        on(EVENING, SYDNEY),
        on(small_hours, SYDNEY),
    ]
    assert [entry["date"] for entry in body["feed"]] == [
        on(small_hours, SYDNEY),
        on(EVENING, SYDNEY),
    ]
    # The span is stated on the clock the day was cut on, or it would name an
    # hour the reader never read at.
    assert body["feed"][0]["first_at"] == small_hours.astimezone(SYDNEY).isoformat()


async def test_one_day_answers_with_its_own_lines(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await stamped_read(session, user.id, EVENING, heartbeats=6, depth=25)
    await stamped_read(
        session, user.id, EVENING - timedelta(days=1), heartbeats=6, depth=25
    )

    feed = (await signed_in.get(f"{ACTIVITY}/{on(EVENING)}")).json()

    assert [entry["date"] for entry in feed] == [on(EVENING)]


async def test_a_tab_left_open_is_not_the_evening_it_was_read_in(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    """The line spans the reading, not the tab: opened at 08:00, read at 20:00."""
    opened = EVENING.replace(hour=8)
    session.add(
        Event(
            id=uuid.uuid4(),
            user_id=user.id,
            lesson=LESSON,
            type=schemas.OPENED,
            payload={},
            client_ts=opened,
            server_ts=opened,
        )
    )
    await session.commit()
    read_at = EVENING.replace(hour=20)
    await stamped_read(session, user.id, read_at, heartbeats=6, depth=25)

    feed = (await signed_in.get(ACTIVITY)).json()["feed"]

    assert datetime.fromisoformat(feed[0]["first_at"]) == read_at


async def test_a_day_nothing_is_left_of_answers_with_nothing(
    signed_in: AsyncClient,
) -> None:
    # A square outlives the events behind it, so an old date is an empty answer
    # rather than a failure.
    assert (await signed_in.get(f"{ACTIVITY}/2020-01-01")).json() == []
