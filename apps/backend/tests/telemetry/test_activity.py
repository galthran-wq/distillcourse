from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Document
from tests.telemetry.conftest import HEARTBEATS_TO_COMPLETE, LESSON, read

pytestmark = pytest.mark.usefixtures("indexed_lesson")

ACTIVITY = f"{settings.API_V1_STR}/telemetry/activity"
TITLE = "What entropy measures"


@pytest.fixture
async def spine(session: AsyncSession) -> None:
    """The course as the index carries it: where a lesson's title comes from."""
    lesson: dict[str, Any] = {
        "slug": "entropy",
        "locator": LESSON,
        "title": TITLE,
        "type": "concept",
        "est_minutes": 20,
    }
    session.add(
        Document(
            corpus="course",
            course_slug="information-theory",
            locator="course:information-theory",
            title="Information theory",
            breadcrumb="Information theory",
            text="A course.",
            anchors=[],
            position=0,
            meta={
                "tagline": "Counting surprise.",
                "modules": [{"slug": "basics", "title": "Basics", "lessons": [lesson]}],
            },
            content_hash="1" * 64,
        )
    )
    await session.flush()


async def test_an_anonymous_visitor_is_refused(client: AsyncClient) -> None:
    assert (await client.get(ACTIVITY)).status_code == 401


async def test_a_reader_who_has_read_nothing_gets_an_empty_grid(
    signed_in: AsyncClient,
) -> None:
    assert (await signed_in.get(ACTIVITY)).json() == {"days": [], "recent": []}


@pytest.mark.usefixtures("spine")
async def test_a_day_read_is_a_square_and_a_recently_read_lesson(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)

    body = (await signed_in.get(ACTIVITY)).json()

    assert body["days"] == [{"date": datetime.now(UTC).date().isoformat(), "count": 1}]
    assert [(item["lesson"], item["title"]) for item in body["recent"]] == [
        (LESSON, TITLE)
    ]
    assert body["recent"][0]["last_seen"].startswith(str(datetime.now(UTC).year))


async def test_a_lesson_the_index_cannot_name_is_still_listed(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    await read(signed_in, session, heartbeats=4, depth=50)

    body = (await signed_in.get(ACTIVITY)).json()

    # Not far enough to be a square, and no spine to name it: the site names it
    # from its own build, so the row is still the reader's history.
    assert body["days"] == []
    assert [(item["lesson"], item["title"]) for item in body["recent"]] == [
        (LESSON, None)
    ]
