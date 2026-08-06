from collections.abc import Sequence
from datetime import UTC, date, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LessonPass, ReviewState, User
from app.telemetry import passes, schemas
from tests.telemetry.conftest import (
    HEARTBEATS_TO_COMPLETE,
    LESSON,
    read,
    stamped_read,
    stored_events,
)

pytestmark = pytest.mark.usefixtures("indexed_lesson")

# Well clear of midnight in every zone these tests use, so a reading session
# never straddles two days by accident.
EVENING = datetime(2026, 8, 4, 9, 0, tzinfo=UTC)


async def credited(session: AsyncSession) -> Sequence[LessonPass]:
    return (await session.scalars(select(LessonPass).order_by(LessonPass.day))).all()


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
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    rows = await credited(session)
    assert [(row.lesson, row.day) for row in rows] == [
        (LESSON, datetime.now(UTC).date())
    ]
    # From the events, not from now(): it is the moment the bar was met.
    assert rows[0].passed_at is not None


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

    assert await days(session) == [EVENING.date(), tomorrow.date()]


async def test_a_day_that_falls_short_of_the_bar_earns_nothing(
    session: AsyncSession, user: User
) -> None:
    # Forty seconds to the bottom of the page, and the whole reading time
    # without ever reaching it: the two halves of the bar, each alone.
    await stamped_read(session, user.id, EVENING, heartbeats=4, depth=100)
    await stamped_read(session, user.id, EVENING + timedelta(days=1), depth=75)

    await passes.rebuild(session)

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
    first = (await credited(session))[0].passed_at

    await passes.record(session, user, LESSON, EVENING)
    written = await passes.rebuild(session)

    rows = await credited(session)
    assert written == 0
    assert len(rows) == 1
    assert rows[0].passed_at == first


async def test_rebuild_credits_exactly_what_ingest_did_and_nothing_else(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    ingested = [(row.day, row.passed_at) for row in await credited(session)]
    ladder = await rungs(session)
    await session.execute(delete(LessonPass))

    written = await passes.rebuild(session)

    assert written == len(ingested)
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
