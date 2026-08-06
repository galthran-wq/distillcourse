import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LessonProgress, LessonRating, User
from tests.utils.utils import signup

LESSON = "/api/v1/lessons/information-theory/entropy"
PROFILE = "/api/v1/profile"
# What those routes store under: the content index's locator, which is also
# what telemetry writes into lesson_progress.
LESSON_KEY = "lesson:information-theory/entropy"


@pytest.fixture
async def reader(client: AsyncClient) -> uuid.UUID:
    # A real signup, so these routes are reached the way a browser reaches
    # them: through the session cookie, not a dependency override.
    return uuid.UUID(str((await signup(client))["id"]))


async def visited(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, *, minutes_ago: int
) -> None:
    """A row as telemetry ingest leaves it — that module owns every write here."""
    seen = datetime.now(UTC) - timedelta(minutes=minutes_ago)
    session.add(
        LessonProgress(
            user_id=user_id,
            lesson=lesson,
            active_seconds=0,
            max_scroll_pct=0,
            proofs_opened=0,
            solutions_opened=0,
            demos_touched=0,
            first_seen=seen,
            last_seen=seen,
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
    assert [(row.lesson, row.value) for row in rows] == [(LESSON_KEY, -1)]
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
    assert [row["lesson"] for row in bookmarked] == [LESSON_KEY]

    await client.delete(f"{LESSON}/bookmark")
    await client.delete(f"{LESSON}/bookmark")

    assert (await client.get(LESSON)).json()["bookmarked"] is False
    assert (await client.get(PROFILE)).json()["bookmarks"] == []


@pytest.mark.usefixtures("reader")
async def test_a_lesson_that_was_read_appears_under_the_key_it_was_rated_by(
    client: AsyncClient,
) -> None:
    # Telemetry and these routes must name a lesson alike, or the profile
    # and the activity feed drift apart.
    await client.put(f"{LESSON}/bookmark")
    await client.post(
        "/api/v1/telemetry/events",
        json={
            "lesson": LESSON_KEY,
            "events": [
                {
                    "id": str(uuid.uuid4()),
                    "type": "lesson_opened",
                    "client_ts": datetime.now(UTC).isoformat(),
                    "payload": {},
                }
            ],
        },
    )

    profile = (await client.get(PROFILE)).json()

    assert [row["lesson"] for row in profile["bookmarks"]] == [LESSON_KEY]


@pytest.mark.usefixtures("reader")
async def test_another_reader_state_is_invisible(
    client: AsyncClient, session: AsyncSession, other_user: User
) -> None:
    await visited(session, other_user.id, "lesson:course/theirs", minutes_ago=1)
    session.add(
        LessonRating(user_id=other_user.id, lesson="lesson:course/theirs", value=1)
    )
    await session.commit()

    profile = (await client.get(PROFILE)).json()

    assert profile == {"bookmarks": []}
    assert (await client.get("/api/v1/lessons/course/theirs")).json() == {
        "rating": None,
        "bookmarked": False,
    }
