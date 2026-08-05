import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LessonProgress, User
from app.telemetry import progress, schemas
from tests.telemetry.conftest import (
    EVENTS,
    HEARTBEATS_TO_COMPLETE,
    LESSON,
    WORD_COUNT,
    aggregate,
    batch,
    index_lesson,
    reading,
    snapshot,
    stored_events,
)

pytestmark = pytest.mark.usefixtures("indexed_lesson")


async def test_reading_a_lesson_through_completes_it_exactly_once(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await signed_in.post(EVENTS, json=batch(*reading(HEARTBEATS_TO_COMPLETE, depth=90)))
    first = snapshot(await aggregate(session, user))

    await signed_in.post(EVENTS, json=batch(*reading(4, depth=100)))

    again = await aggregate(session, user)
    assert first["completed_at"] is not None
    assert again.completed_at == first["completed_at"]
    assert await stored_events(session, schemas.COMPLETED) == 1


async def test_a_lesson_skimmed_in_forty_seconds_is_not_complete(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await signed_in.post(EVENTS, json=batch(*reading(4, depth=100)))

    row = await aggregate(session, user)
    assert (row.active_seconds, row.max_scroll_pct) == (40, 100)
    assert row.completed_at is None
    assert await stored_events(session, schemas.COMPLETED) == 0


async def test_time_without_reaching_the_end_is_not_complete(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await signed_in.post(EVENTS, json=batch(*reading(HEARTBEATS_TO_COMPLETE, depth=75)))

    assert (await aggregate(session, user)).completed_at is None


async def test_rebuild_reproduces_the_aggregate_and_emits_nothing(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await signed_in.post(EVENTS, json=batch(*reading(HEARTBEATS_TO_COMPLETE, depth=90)))
    expected = snapshot(await aggregate(session, user))
    await session.execute(
        update(LessonProgress).values(
            active_seconds=0, max_scroll_pct=0, proofs_opened=7, completed_at=None
        )
    )

    rebuilt = await progress.rebuild(session)

    assert rebuilt == 1
    assert snapshot(await aggregate(session, user)) == expected
    # The ladder a completion starts is not handed out retroactively.
    assert await stored_events(session, schemas.COMPLETED) == 1


async def test_the_threshold_follows_the_lesson_word_count(
    session: AsyncSession,
) -> None:
    assert await progress.threshold_seconds(session, LESSON) == pytest.approx(
        WORD_COUNT / progress.WORDS_PER_MINUTE * progress.ENGAGEMENT_FRACTION * 60
    )


async def test_the_threshold_is_clamped_at_both_ends(session: AsyncSession) -> None:
    short, long = "lesson:information-theory/short", "lesson:information-theory/long"
    await index_lesson(session, lesson=short, words=50)
    await index_lesson(session, lesson=long, words=50_000)

    assert await progress.threshold_seconds(session, short) == (
        progress.MIN_THRESHOLD_SECONDS
    )
    assert await progress.threshold_seconds(session, long) == (
        progress.MAX_THRESHOLD_SECONDS
    )


async def test_a_lesson_the_index_has_never_seen_falls_back(
    session: AsyncSession,
) -> None:
    threshold = await progress.threshold_seconds(session, "lesson:other/unindexed")

    assert threshold == progress.UNINDEXED_THRESHOLD_SECONDS
