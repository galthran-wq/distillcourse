import uuid
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from pydantic import BaseModel
from sqlalchemy import ColumnElement, Date, exists, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import zone
from app.models import Event, LessonPass, User
from app.telemetry import progress

# The grid the profile draws: a year of full weeks. Mirrors WEEKS in
# apps/frontend/lib/telemetry/activity.ts, which is what actually decides how
# many squares there are; this only bounds the query behind them.
ACTIVITY_WEEKS = 53
# What earns a day its square: five minutes of credited attention on the
# lesson — a real reading session, not a glance. Still well below the
# completion bar in `progress`: a lesson is read over several days, and a day
# that got through one section of it is a day the reader read. Completion
# stays what it was: the whole lesson, once.
DAY_SECONDS = 300


def _local_day(timezone: str) -> ColumnElement[date]:
    """The reader's calendar date of an event, on their own clock."""
    return func.timezone(timezone, Event.server_ts).cast(Date)


def _day_window(day: date, tz: ZoneInfo) -> tuple[ColumnElement[bool], ...]:
    """The events that fall on one of the reader's days.

    combine() at both ends rather than a day of arithmetic: on the night the
    clocks change the local day is 23 or 25 hours long. Stated as instants, so
    the query still reads `events` by its (user, lesson, server_ts) index rather
    than by a timezone conversion of every row the reader ever produced.
    """
    return (
        Event.server_ts >= datetime.combine(day, time(), tz),
        Event.server_ts < datetime.combine(day + timedelta(days=1), time(), tz),
    )


def _grid_start(tz: ZoneInfo) -> date:
    """The oldest day any answer about the grid reaches back to.

    Back to the Monday that opens the grid, and a week further: the browser
    decides which squares exist, and its calendar can be a day off the zone
    stored here — so this bound has to be looser than the grid, never tighter.
    """
    today = datetime.now(tz).date()
    return today - timedelta(days=today.weekday() + 7 * ACTIVITY_WEEKS)


async def credit(
    session: AsyncSession,
    user_id: uuid.UUID,
    lesson: str,
    timezone: str,
    *within: ColumnElement[bool],
) -> int:
    """Writes a row for every local day that gave this lesson its day bar.

    The bar is `DAY_SECONDS`, capped at the lesson's own completion threshold:
    a short lesson that can be *completed* in three minutes must not need five
    to earn its square.

    A day already credited is left exactly as it is: the second flush of an
    evening must not move the instant the bar was met, and the first pass of a
    lesson is not undone by reading it again.
    """
    bar = min(DAY_SECONDS, await progress.threshold_seconds(session, lesson))
    days = (
        await session.execute(
            progress.reached_seconds(
                user_id, lesson, bar, _local_day(zone(timezone).key), *within
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

    `at` has to be the database's clock, because `events.server_ts` is stamped
    by it and the window below is applied to that column: an application host
    a few minutes off would select the wrong end of the day.

    Only that day, and the window is stated in UTC so the query still reads
    `events` by its (user, lesson, server_ts) index rather than by a timezone
    conversion of every row the reader ever produced.
    """
    tz = zone(user.timezone)
    day = at.astimezone(tz).date()
    credited = await session.scalar(
        select(
            exists().where(
                LessonPass.user_id == user.id,
                LessonPass.lesson == lesson,
                LessonPass.day == day,
            )
        )
    )
    # Every heartbeat flush of the evening arrives here, and once the day is
    # credited nothing later in it can change the row: the aggregate below is
    # then pure cost.
    if credited:
        return
    await credit(session, user.id, lesson, tz.key, *_day_window(day, tz))


async def activity(session: AsyncSession, user: User) -> list[tuple[date, int]]:
    """How many lessons this reader passed on each day of the grid.

    Only the days they read on; a grid is mostly empty, and the caller draws
    the blanks anyway.
    """
    return list(
        (
            await session.execute(
                select(LessonPass.day, func.count())
                .where(
                    LessonPass.user_id == user.id,
                    LessonPass.day >= _grid_start(zone(user.timezone)),
                )
                .group_by(LessonPass.day)
                .order_by(LessonPass.day)
            )
        )
        .tuples()
        .all()
    )


class Entry(BaseModel):
    """One lesson on one of the reader's days, every sitting of it coalesced.

    `first_at` and `last_at` are stated in the reader's own zone — the same one
    the date is bucketed in — because they are read as a span of that day's
    clock, and an instant offered in any other zone would name a different day.
    """

    date: date
    lesson: str
    seconds: int
    first_at: datetime
    last_at: datetime


async def entries(
    session: AsyncSession, user: User, day: date | None = None
) -> list[Entry]:
    """What this reader read on each of their days, newest first.

    Derived from `events` on demand rather than stored: a day of reading is
    already two projections (the aggregate, the pass), and how those events fell
    across the clock is a question about the log itself. A lesson merely opened
    and left is not an entry — attention is `progress`'s definition of it and
    nobody else's.
    """
    tz = zone(user.timezone)
    within = (
        _day_window(day, tz)
        if day is not None
        else (Event.server_ts >= datetime.combine(_grid_start(tz), time(), tz),)
    )
    bucket = _local_day(tz.key)
    seconds = func.sum(progress.CREDITED_SECONDS)
    last_at = func.max(Event.server_ts)
    rows = await session.execute(
        select(
            bucket.label("date"),
            Event.lesson,
            seconds.label("seconds"),
            func.min(Event.server_ts).label("first_at"),
            last_at.label("last_at"),
        )
        .where(Event.user_id == user.id, *within)
        .group_by(bucket, Event.lesson)
        .having(seconds > 0)
        .order_by(bucket.desc(), last_at.desc())
    )
    return [
        Entry(
            date=row.date,
            lesson=row.lesson,
            seconds=row.seconds,
            first_at=row.first_at.astimezone(tz),
            last_at=row.last_at.astimezone(tz),
        )
        for row in rows
    ]
