from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.lessons.state import HISTORY_LIMIT
from app.main import app
from app.models import LessonProgress, LessonRating, User

LESSON = "/api/v1/lessons/information-theory/entropy"
PROFILE = "/api/v1/profile"


@pytest.fixture
async def signed_in(client: AsyncClient, user: User) -> AsyncGenerator[AsyncClient]:
    app.dependency_overrides[get_current_user] = lambda: user
    yield client


async def visited(
    session: AsyncSession, user: User, lesson: str, *, minutes_ago: int
) -> None:
    session.add(
        LessonProgress(
            user_id=user.id,
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


async def test_a_lesson_starts_unrated_and_unbookmarked(
    signed_in: AsyncClient,
) -> None:
    assert (await signed_in.get(LESSON)).json() == {"rating": None, "bookmarked": False}


async def test_a_rating_is_stored_and_changed(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await signed_in.put(f"{LESSON}/rating", json={"value": 1})
    await signed_in.put(f"{LESSON}/rating", json={"value": -1})

    # What the curator reads in psql: one row per (user, lesson), current vote.
    rows = (await session.scalars(select(LessonRating))).all()
    assert [(row.lesson, row.value) for row in rows] == [
        ("information-theory/entropy", -1)
    ]
    assert (await signed_in.get(LESSON)).json()["rating"] == -1


async def test_a_rating_outside_the_two_choices_is_refused(
    signed_in: AsyncClient,
) -> None:
    for value in (0, 5, 2):
        response = await signed_in.put(f"{LESSON}/rating", json={"value": value})
        assert response.status_code == 422


async def test_a_lesson_that_is_not_a_slug_is_refused(signed_in: AsyncClient) -> None:
    response = await signed_in.put(
        "/api/v1/lessons/information-theory/Entropy%20OR%201=1/rating",
        json={"value": 1},
    )

    assert response.status_code == 422


async def test_a_bookmark_toggles_and_repeats_harmlessly(
    signed_in: AsyncClient,
) -> None:
    await signed_in.put(f"{LESSON}/bookmark")
    await signed_in.put(f"{LESSON}/bookmark")

    bookmarked = (await signed_in.get(PROFILE)).json()["bookmarks"]
    assert (await signed_in.get(LESSON)).json()["bookmarked"] is True
    assert [row["lesson"] for row in bookmarked] == ["information-theory/entropy"]

    await signed_in.delete(f"{LESSON}/bookmark")
    await signed_in.delete(f"{LESSON}/bookmark")

    assert (await signed_in.get(LESSON)).json()["bookmarked"] is False
    assert (await signed_in.get(PROFILE)).json()["bookmarks"] == []


async def test_history_is_the_most_recent_visits_newest_first(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    for index in range(HISTORY_LIMIT + 3):
        await visited(session, user, f"course/lesson-{index}", minutes_ago=index)

    history = (await signed_in.get(PROFILE)).json()["history"]

    assert len(history) == HISTORY_LIMIT
    assert [row["lesson"] for row in history] == [
        f"course/lesson-{index}" for index in range(HISTORY_LIMIT)
    ]


async def test_history_carries_no_reading_measurements(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await visited(session, user, "course/lesson", minutes_ago=1)

    entry = (await signed_in.get(PROFILE)).json()["history"][0]

    assert set(entry) == {"lesson", "last_seen", "completed_at"}


async def test_another_reader_state_is_invisible(
    signed_in: AsyncClient, session: AsyncSession, other_user: User
) -> None:
    await visited(session, other_user, "course/theirs", minutes_ago=1)
    session.add(LessonRating(user_id=other_user.id, lesson="course/theirs", value=1))
    await session.commit()

    profile = (await signed_in.get(PROFILE)).json()

    assert profile == {"history": [], "bookmarks": []}
    assert (await signed_in.get("/api/v1/lessons/course/theirs")).json() == {
        "rating": None,
        "bookmarked": False,
    }
