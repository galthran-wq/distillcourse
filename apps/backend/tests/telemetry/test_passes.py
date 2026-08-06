from collections.abc import Sequence
from datetime import UTC, date, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.models import LessonPass, ReviewState, User
from app.telemetry import passes, schemas
from tests.telemetry.conftest import (
    HEARTBEAT_SECONDS,
    HEARTBEATS_TO_COMPLETE,
    LESSON,
    aggregate,
    read,
    stamped_read,
    stored_events,
)

pytestmark = pytest.mark.usefixtures("indexed_lesson")

# Well clear of midnight in every zone these tests use, so a reading session
# never straddles two days by accident.
EVENING = datetime(2026, 8, 4, 9, 0, tzinfo=UTC)
# Six heartbeats meet the day's minute, and `stamped_read` stamps the events a
# second apart: the sixth of them is the instant the day was earned.
BEATS_TO_PASS = passes.DAY_SECONDS // HEARTBEAT_SECONDS
PASSED_AT = EVENING + timedelta(seconds=BEATS_TO_PASS - 1)


async def credited(session: AsyncSession) -> Sequence[LessonPass]:
    """Every reading day, re-read from the database rather than from the
    objects already in the session: sessions here do not expire on commit, so
    a row an upsert moved would otherwise go unnoticed."""
    return (
        await session.scalars(
            select(LessonPass)
            .order_by(LessonPass.day)
            .execution_options(populate_existing=True)
        )
    ).all()


async def days(session: AsyncSession) -> list[date]:
    return [row.day for row in await credited(session)]


async def rungs(session: AsyncSession) -> list[tuple[str, int, datetime | None]]:
    """Where every ladder of this reader stands. Re-read from the database
    rather than from the objects already in the session, or a rebuild that
    moved a rung would go unnoticed."""
    rows = await session.scalars(
        select(ReviewState)
        .order_by(ReviewState.lesson)
        .execution_options(populate_existing=True)
    )
    return [(row.lesson, row.step, row.next_due_at) for row in rows]


async def test_reading_a_lesson_through_credits_the_day(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    rows = await credited(session)
    assert [(row.lesson, row.day) for row in rows] == [
        (LESSON, datetime.now(UTC).date())
    ]
    # From the events, not from now(): it is the moment the bar was met, and
    # every event of a test shares the transaction's clock.
    assert rows[0].passed_at == (await aggregate(session, user)).first_seen


async def test_a_minute_a_day_is_a_square_before_the_lesson_is_read_through(
    session: AsyncSession, user: User
) -> None:
    """The ordinary way a long lesson is read: a little on each of three days,
    complete on none of them."""
    for offset in range(3):
        await stamped_read(
            session,
            user.id,
            EVENING + timedelta(days=offset),
            heartbeats=BEATS_TO_PASS,
            depth=25,
        )

    await cli.rebuild_progress(session)

    assert await days(session) == [
        EVENING.date() + timedelta(days=offset) for offset in range(3)
    ]
    # Three minutes of attention in total, and never past a quarter of the
    # page: the lesson itself is still unread.
    assert (await aggregate(session, user)).completed_at is None


async def test_reading_it_again_the_same_day_is_still_one_day(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    first = (await credited(session))[0].passed_at

    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=100)

    rows = await credited(session)
    assert len(rows) == 1
    assert rows[0].passed_at == first


async def test_reading_it_again_on_a_later_day_is_another_square(
    session: AsyncSession, user: User
) -> None:
    tomorrow = EVENING + timedelta(days=1)
    await stamped_read(session, user.id, EVENING)
    await stamped_read(session, user.id, tomorrow)

    await passes.record(session, user, LESSON, EVENING)
    await passes.record(session, user, LESSON, tomorrow)

    rows = await credited(session)
    assert [row.day for row in rows] == [EVENING.date(), tomorrow.date()]
    assert [row.passed_at for row in rows] == [
        PASSED_AT,
        PASSED_AT + timedelta(days=1),
    ]


async def test_a_day_under_a_minute_earns_nothing(
    session: AsyncSession, user: User
) -> None:
    # Fifty seconds, the whole page: depth was never what a day is earned by,
    # and ten seconds short is short.
    await stamped_read(
        session, user.id, EVENING, heartbeats=BEATS_TO_PASS - 1, depth=100
    )

    await cli.rebuild_progress(session)

    assert await days(session) == []


async def test_the_day_is_the_one_the_reader_was_living(
    session: AsyncSession, user: User
) -> None:
    user.timezone = "Australia/Sydney"
    await session.commit()
    # One UTC day, two Sydney days: 19:00 on the 4th and 01:00 on the 5th.
    evening, after_midnight = EVENING, EVENING + timedelta(hours=6)
    await stamped_read(session, user.id, evening)
    await stamped_read(session, user.id, after_midnight)

    await passes.record(session, user, LESSON, evening)
    await passes.record(session, user, LESSON, after_midnight)

    assert await days(session) == [date(2026, 8, 4), date(2026, 8, 5)]


async def test_evaluating_the_same_day_twice_writes_one_row(
    session: AsyncSession, user: User
) -> None:
    await stamped_read(session, user.id, EVENING)
    await passes.record(session, user, LESSON, EVENING)

    await passes.record(session, user, LESSON, EVENING)
    await cli.rebuild_progress(session)

    rows = await credited(session)
    assert len(rows) == 1
    assert rows[0].passed_at == PASSED_AT


async def test_rebuild_credits_exactly_what_ingest_did_and_nothing_else(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    ingested = [(row.day, row.passed_at) for row in await credited(session)]
    ladder = await rungs(session)
    await session.execute(delete(LessonPass))

    await cli.rebuild_progress(session)

    assert [(row.day, row.passed_at) for row in await credited(session)] == ingested
    # A rebuild replays no side effect: no second completion event, and no
    # review ladder handed out retroactively.
    assert await stored_events(session, schemas.COMPLETED) == 1
    assert await rungs(session) == ladder


async def test_a_later_pass_does_not_move_the_review_ladder(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    ladder = await rungs(session)
    tomorrow = datetime.now(UTC) + timedelta(days=1)

    await stamped_read(session, user.id, tomorrow)
    await passes.record(session, user, LESSON, tomorrow)

    assert len(await credited(session)) == 2
    assert await rungs(session) == ladder
    assert await stored_events(session, schemas.COMPLETED) == 1


async def test_a_flush_survives_a_reading_day_that_cannot_be_written(
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Telemetry ingest is not allowed to fail over a square on a grid."""

    async def refuse(
        _session: AsyncSession, _user: User, _lesson: str, _at: datetime
    ) -> None:
        raise OperationalError("SELECT 1", None, Exception("time zone not recognized"))

    monkeypatch.setattr(passes, "record", refuse)

    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    # The reading is stored and the aggregate derived; only the square is lost.
    assert (await aggregate(session, user)).active_seconds == (
        HEARTBEATS_TO_COMPLETE * HEARTBEAT_SECONDS
    )
    assert await days(session) == []


async def test_the_day_window_is_read_from_the_database_clock(
    signed_in: AsyncClient, session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    """`server_ts` is Postgres's clock, so the day window has to be too: a host
    clock hours ahead would otherwise window tomorrow and credit nothing."""
    seen: list[datetime] = []

    async def spy(
        _session: AsyncSession, _user: User, _lesson: str, at: datetime
    ) -> None:
        seen.append(at)

    monkeypatch.setattr(passes, "record", spy)

    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    # Two flushes, each dating its day by asking the database the time.
    now = await session.scalar(select(func.now()))
    assert seen == [now, now]
