import uuid
from collections.abc import Sequence
from datetime import date, datetime, time, timedelta

from sqlalchemy import ColumnElement, Date, Row, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import zone
from app.models import Event, LessonPass, User
from app.telemetry import progress

# The grid the profile draws: a year of full weeks, ending with the current one.
ACTIVITY_WEEKS = 53


def _local_day(timezone: str) -> ColumnElement[date]:
    """The reader's calendar date of an event, on their own clock."""
    return func.timezone(timezone, Event.server_ts).cast(Date)


async def _credit(
    session: AsyncSession,
    user_id: uuid.UUID,
    lesson: str,
    timezone: str,
    *within: ColumnElement[bool],
) -> int:
    """Writes a row for every local day whose events met the reading bar.

    A day already credited is left exactly as it is: the second flush of an
    evening must not move the instant the bar was met, and the first pass of a
    lesson is not undone by reading it again.
    """
    threshold = await progress.threshold_seconds(session, lesson)
    days = (
        await session.execute(
            progress.reached_bar(
                user_id, lesson, threshold, _local_day(timezone), *within
            )
        )
    ).all()
    if not days:
        return 0
    written = await session.scalars(
        insert(LessonPass)
        .values(
            [
                {
                    "user_id": user_id,
                    "lesson": lesson,
                    "day": day,
                    "passed_at": passed_at,
                }
                for day, passed_at in days
            ]
        )
        .on_conflict_do_nothing(index_elements=["user_id", "lesson", "day"])
        .returning(LessonPass.day)
    )
    return len(written.all())


async def record(session: AsyncSession, user: User, lesson: str, at: datetime) -> None:
    """Credits the reader with this lesson for the day `at` falls on.

    Only that day, and the window is stated in UTC so the query still reads
    `events` by its (user, lesson, server_ts) index rather than by a timezone
    conversion of every row the reader ever produced.
    """
    tz = zone(user.timezone)
    day = at.astimezone(tz).date()
    await _credit(
        session,
        user.id,
        lesson,
        tz.key,
        # combine() at both ends rather than a day of arithmetic: on the night
        # the clocks change the local day is 23 or 25 hours long.
        Event.server_ts >= datetime.combine(day, time(), tz),
        Event.server_ts < datetime.combine(day + timedelta(days=1), time(), tz),
    )


async def rebuild(session: AsyncSession) -> int:
    """Re-derives every reading day from the raw events, with no side effects.

    Rows are added and never removed: `events` is pruned, and a day whose
    events are gone is still a day the reader read.
    """
    readers = (
        await session.execute(
            select(Event.user_id, Event.lesson, User.timezone)
            .join(User, User.id == Event.user_id)
            .distinct()
        )
    ).all()
    written = 0
    for user_id, lesson, timezone in readers:
        written += await _credit(session, user_id, lesson, zone(timezone).key)
        # One transaction per reader and lesson, so a rebuild over the whole
        # corpus never holds a long one.
        await session.commit()
    return written


async def activity(
    session: AsyncSession, user: User
) -> Sequence[Row[tuple[date, int]]]:
    """How many lessons this reader passed on each day of the grid.

    Only the days they read on; a grid is mostly empty, and the caller draws
    the blanks anyway.
    """
    today = datetime.now(zone(user.timezone)).date()
    # Back to the Monday that opens the grid, so every column is a full week.
    since = today - timedelta(days=today.weekday() + 7 * (ACTIVITY_WEEKS - 1))
    return (
        await session.execute(
            select(LessonPass.day, func.count())
            .where(LessonPass.user_id == user.id, LessonPass.day >= since)
            .group_by(LessonPass.day)
            .order_by(LessonPass.day)
        )
    ).all()
