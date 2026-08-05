import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.main import app
from app.models import Document, Event, LessonProgress, User
from app.telemetry import schemas

EVENTS = f"{settings.API_V1_STR}/telemetry/events"
LESSON = "lesson:information-theory/entropy"
# 1500 words at 250 wpm, halved, is exactly the shortest threshold there is:
# three minutes, or eighteen heartbeats.
WORD_COUNT = 1500
HEARTBEATS_TO_COMPLETE = 18

AGGREGATE_FIELDS = (
    "active_seconds",
    "max_scroll_pct",
    "proofs_opened",
    "solutions_opened",
    "demos_touched",
    "first_seen",
    "last_seen",
    "completed_at",
)


@pytest.fixture
async def signed_in(client: AsyncClient, user: User) -> AsyncGenerator[AsyncClient]:
    # app_on_test_session clears the overrides when the test ends.
    app.dependency_overrides[get_current_user] = lambda: user
    yield client


async def index_lesson(
    session: AsyncSession, *, lesson: str = LESSON, words: int = WORD_COUNT
) -> None:
    """The lesson as `documents` knows it — where the threshold comes from.

    Only an anchored chunk, as a lesson that opens on an h2 produces: the
    threshold has to find the word count without an anchorless row to read.
    """
    session.add(
        Document(
            corpus="lesson",
            course_slug="information-theory",
            locator=f"{lesson}#surprise",
            title="Surprise",
            breadcrumb="Information theory › Surprise",
            text="Some body text.",
            anchors=["surprise"],
            position=0,
            meta={"word_count": words, "document_word_count": words},
            content_hash="0" * 64,
        )
    )
    await session.flush()


@pytest.fixture
async def indexed_lesson(session: AsyncSession) -> None:
    await index_lesson(session)


def event(type: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "type": type,
        "client_ts": datetime.now(UTC).isoformat(),
        "payload": payload or {},
    }


def batch(*events: dict[str, Any], lesson: str = LESSON) -> dict[str, Any]:
    return {"lesson": lesson, "events": list(events)}


def reading(heartbeats: int, *, depth: int) -> list[dict[str, Any]]:
    """A reader who spends `heartbeats * 10` seconds and scrolls to `depth`."""
    marks = [mark for mark in (25, 50, 75, 90, 100) if mark <= depth]
    return [
        event(schemas.OPENED),
        *(event(schemas.HEARTBEAT, {"seconds": 10}) for _ in range(heartbeats)),
        *(event(schemas.SCROLL, {"pct": mark}) for mark in marks),
    ]


async def stored_events(session: AsyncSession, type: str | None = None) -> int:
    statement = select(func.count()).select_from(Event)
    if type is not None:
        statement = statement.where(Event.type == type)
    return (await session.scalars(statement)).one()


async def aggregate(session: AsyncSession, user: User) -> LessonProgress:
    row = await session.get(LessonProgress, (user.id, LESSON), populate_existing=True)
    assert row is not None
    return row


def snapshot(row: LessonProgress) -> dict[str, Any]:
    return {name: getattr(row, name) for name in AGGREGATE_FIELDS}
