from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.labs import repository
from app.labs.schemas import Submission
from app.models import LessonProgress, User
from tests.labs.conftest import (
    COURSE,
    DIGEST,
    LESSON,
    PASSING,
    SLUG,
    SURPRISAL,
    rows,
    submission,
)

PROGRESS = f"{settings.API_V1_STR}/progress"
NOW = datetime.now(UTC)


async def visited(
    session: AsyncSession,
    user: User,
    lesson: str,
    *,
    minutes_ago: int,
    completed: bool = False,
) -> None:
    """A row as telemetry ingest leaves it — that module owns every write here."""
    seen = NOW - timedelta(minutes=minutes_ago)
    session.add(
        LessonProgress(
            user_id=user.id,
            lesson=lesson,
            active_seconds=0,
            max_scroll_pct=0,
            proofs_opened=0,
            solutions_opened=0,
            demos_touched=0,
            first_seen=seen,
            last_seen=seen,
            completed_at=seen if completed else None,
        )
    )
    await session.commit()


async def submit(
    session: AsyncSession, user: User, checkpoint: str, payload: object
) -> None:
    await repository.submit(
        session, user.id, Submission(**submission(checkpoint, payload)), now=NOW
    )


async def test_an_anonymous_visitor_gets_401(client: AsyncClient) -> None:
    assert (await client.get(PROGRESS)).status_code == 401


async def test_read_and_started_come_from_the_reading_record(
    signed_in: AsyncClient, session: AsyncSession, user: User, other_user: User
) -> None:
    await visited(
        session,
        user,
        "lesson:information-theory/entropy",
        minutes_ago=30,
        completed=True,
    )
    await visited(session, user, "lesson:information-theory/coding", minutes_ago=5)
    # Another reader's progress is theirs alone.
    await visited(
        session, other_user, "lesson:information-theory/channels", minutes_ago=1
    )

    body = (await signed_in.get(PROGRESS)).json()

    assert [(entry["lesson"], entry["state"]) for entry in body] == [
        ("information-theory/coding", "started"),
        ("information-theory/entropy", "read"),
    ]
    assert datetime.fromisoformat(body[0]["last_seen"]) == NOW - timedelta(minutes=5)


async def test_the_course_filter_keeps_one_course(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    await visited(session, user, "lesson:information-theory/entropy", minutes_ago=3)
    await visited(session, user, "lesson:fraud-ml/isolation-forest", minutes_ago=2)
    # A prefix of another course's slug is not that course.
    await visited(session, user, "lesson:fraud-ml-extra/stub", minutes_ago=1)

    body = (await signed_in.get(PROGRESS, params={"course": "fraud-ml"})).json()

    assert [entry["lesson"] for entry in body] == ["fraud-ml/isolation-forest"]


async def test_a_course_that_is_not_a_slug_is_refused(signed_in: AsyncClient) -> None:
    response = await signed_in.get(PROGRESS, params={"course": "50%_off"})
    assert response.status_code == 422


async def test_a_lab_is_started_by_a_submission_and_read_once_its_required_checkpoints_pass(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    session.add_all(rows())
    await session.commit()

    await submit(session, user, "surprisal", SURPRISAL)
    started = (await signed_in.get(PROGRESS, params={"course": COURSE})).json()
    assert [(entry["lesson"], entry["state"]) for entry in started] == [
        (f"{COURSE}/{SLUG}", "started")
    ]

    await submit(session, user, "entropy-terms", {"digest": DIGEST})
    await submit(session, user, "beat-baseline", PASSING)
    finished = (await signed_in.get(PROGRESS, params={"course": COURSE})).json()
    # The optional review checkpoint is still unanswered, and gates nothing.
    assert [(entry["lesson"], entry["state"]) for entry in finished] == [
        (f"{COURSE}/{SLUG}", "read")
    ]


async def test_reading_a_lab_page_through_does_not_finish_the_lab(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    session.add_all(rows())
    await session.commit()
    await visited(session, user, LESSON, minutes_ago=1, completed=True)

    body = (await signed_in.get(PROGRESS)).json()

    assert [entry["state"] for entry in body] == ["started"]
