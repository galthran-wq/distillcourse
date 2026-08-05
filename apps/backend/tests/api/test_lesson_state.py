import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lessons.state import HISTORY_LIMIT
from app.models import LessonProgress, LessonRating, User
from tests.utils.utils import signup

LESSON = "/api/v1/lessons/information-theory/entropy"
PROFILE = "/api/v1/profile"


@pytest.fixture
async def reader(client: AsyncClient) -> uuid.UUID:
    # A real signup, so these routes are reached the way a browser reaches
    # them: through the session cookie, not a dependency override.
    return uuid.UUID(str((await signup(client))["id"]))


async def visited(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, *, minutes_ago: int
) -> None:
    session.add(
        LessonProgress(
            user_id=user_id,
            lesson=lesson,
            last_seen=datetime.now(UTC) - timedelta(minutes=minutes_ago),
        )
    )
    await session.commit()


async def test_an_anonymous_visitor_gets_nothing(client: AsyncClient) -> None:
    assert (await client.get(LESSON)).status_code == 401
    assert (await client.put(f"{LESSON}/rating", json={"value": 1})).status_code == 401
    assert (await client.put(f"{LESSON}/bookmark")).status_code == 401
    assert (await client.delete(f"{LESSON}/bookmark")).status_code == 401
    assert (await client.get(PROFILE)).status_code == 401


@pytest.mark.usefixtures("reader")
async def test_a_lesson_starts_unrated_and_unbookmarked(client: AsyncClient) -> None:
    assert (await client.get(LESSON)).json() == {"rating": None, "bookmarked": False}


@pytest.mark.usefixtures("reader")
async def test_a_rating_is_stored_and_changed(
    client: AsyncClient, session: AsyncSession
) -> None:
    assert (await client.put(f"{LESSON}/rating", json={"value": 1})).status_code == 204
    await client.put(f"{LESSON}/rating", json={"value": -1})

    # What the curator reads in psql: one row per (user, lesson), current vote.
    rows = (await session.scalars(select(LessonRating))).all()
    assert [(row.lesson, row.value) for row in rows] == [
        ("information-theory/entropy", -1)
    ]
    assert (await client.get(LESSON)).json()["rating"] == -1


@pytest.mark.usefixtures("reader")
async def test_a_rating_outside_the_two_choices_is_refused(
    client: AsyncClient,
) -> None:
    for value in (0, 5, 2):
        response = await client.put(f"{LESSON}/rating", json={"value": value})
        assert response.status_code == 422


@pytest.mark.usefixtures("reader")
async def test_a_lesson_that_is_not_a_slug_is_refused(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/lessons/information-theory/Entropy%20OR%201=1/rating",
        json={"value": 1},
    )

    assert response.status_code == 422


@pytest.mark.usefixtures("reader")
async def test_a_bookmark_toggles_and_repeats_harmlessly(client: AsyncClient) -> None:
    await client.put(f"{LESSON}/bookmark")
    await client.put(f"{LESSON}/bookmark")

    bookmarked = (await client.get(PROFILE)).json()["bookmarks"]
    assert (await client.get(LESSON)).json()["bookmarked"] is True
    assert [row["lesson"] for row in bookmarked] == ["information-theory/entropy"]

    await client.delete(f"{LESSON}/bookmark")
    await client.delete(f"{LESSON}/bookmark")

    assert (await client.get(LESSON)).json()["bookmarked"] is False
    assert (await client.get(PROFILE)).json()["bookmarks"] == []


async def test_history_is_the_most_recent_visits_newest_first(
    client: AsyncClient, session: AsyncSession, reader: uuid.UUID
) -> None:
    for index in range(HISTORY_LIMIT + 3):
        await visited(session, reader, f"course/lesson-{index}", minutes_ago=index)

    history = (await client.get(PROFILE)).json()["history"]

    assert len(history) == HISTORY_LIMIT
    assert [row["lesson"] for row in history] == [
        f"course/lesson-{index}" for index in range(HISTORY_LIMIT)
    ]


async def test_history_carries_no_reading_measurements(
    client: AsyncClient, session: AsyncSession, reader: uuid.UUID
) -> None:
    await visited(session, reader, "course/lesson", minutes_ago=1)

    entry = (await client.get(PROFILE)).json()["history"][0]

    assert set(entry) == {"lesson", "last_seen", "completed_at"}


@pytest.mark.usefixtures("reader")
async def test_another_reader_state_is_invisible(
    client: AsyncClient, session: AsyncSession, other_user: User
) -> None:
    await visited(session, other_user.id, "course/theirs", minutes_ago=1)
    session.add(LessonRating(user_id=other_user.id, lesson="course/theirs", value=1))
    await session.commit()

    profile = (await client.get(PROFILE)).json()

    assert profile == {"history": [], "bookmarks": []}
    assert (await client.get("/api/v1/lessons/course/theirs")).json() == {
        "rating": None,
        "bookmarked": False,
    }
