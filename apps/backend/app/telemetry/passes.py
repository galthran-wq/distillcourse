import uuid
from datetime import date, datetime, time, timedelta

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
# What earns a day its square: a minute of credited attention on the lesson.
# Deliberately far below the completion bar in `progress` — a lesson is read
# over several days, and a day that got through one section of it is still a
# day the reader read. Completion stays what it was: the whole lesson, once.
DAY_SECONDS = 60


def _local_day(timezone: str) -> ColumnElement[date]:
    """The reader's calendar date of an event, on their own clock."""
    return func.timezone(timezone, Event.server_ts).cast(Date)


async def credit(
    session: AsyncSession,
    user_id: uuid.UUID,
    lesson: str,
    timezone: str,
    *within: ColumnElement[bool],
) -> int:
    """Writes a row for every local day that gave this lesson `DAY_SECONDS`.

    A day already credited is left exactly as it is: the second flush of an
    evening must not move the instant the bar was met, and the first pass of a
    lesson is not undone by reading it again.
    """
    days = (
        await session.execute(
            progress.reached_seconds(
                user_id, lesson, DAY_SECONDS, _local_day(zone(timezone).key), *within
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
    await credit(
        session,
        user.id,
        lesson,
        tz.key,
        # combine() at both ends rather than a day of arithmetic: on the night
        # the clocks change the local day is 23 or 25 hours long.
        Event.server_ts >= datetime.combine(day, time(), tz),
        Event.server_ts < datetime.combine(day + timedelta(days=1), time(), tz),
    )


async def activity(session: AsyncSession, user: User) -> list[tuple[date, int]]:
    """How many lessons this reader passed on each day of the grid.

    Only the days they read on; a grid is mostly empty, and the caller draws
    the blanks anyway.
    """
    today = datetime.now(zone(user.timezone)).date()
    # Back to the Monday that opens the grid, and a week further: the browser
    # decides which squares exist, and its calendar can be a day off the zone
    # stored here — so this bound has to be looser than the grid, never tighter.
    since = today - timedelta(days=today.weekday() + 7 * ACTIVITY_WEEKS)
    return list(
        (
            await session.execute(
                select(LessonPass.day, func.count())
                .where(LessonPass.user_id == user.id, LessonPass.day >= since)
                .group_by(LessonPass.day)
                .order_by(LessonPass.day)
            )
        )
        .tuples()
        .all()
    )
