from typing import Any

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, LessonProgress, User
from app.telemetry import schemas
from tests.telemetry.conftest import (
    EVENTS,
    LESSON,
    aggregate,
    batch,
    event,
    reading,
    stored_events,
)


async def test_an_anonymous_visitor_is_refused_and_leaves_no_rows(
    client: AsyncClient, session: AsyncSession
) -> None:
    response = await client.post(EVENTS, json=batch(*reading(3, depth=50)))

    assert response.status_code == 401
    assert await stored_events(session) == 0


async def test_a_reading_session_becomes_events_and_an_aggregate(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    events = [
        *reading(4, depth=75),
        event(schemas.TOGGLE_OPENED, {"kind": "proof", "target": "surprise/proof1"}),
        event(schemas.TOGGLE_OPENED, {"kind": "solution", "target": "drill/solution1"}),
        event(schemas.TOGGLE_OPENED, {"kind": "aside", "target": "drill/aside1"}),
        event(schemas.DEMO_INTERACTED, {"demo": "Surprisal", "target": "drill/demo1"}),
    ]

    response = await signed_in.post(EVENTS, json=batch(*events))

    progress = await aggregate(session, user)
    assert response.status_code == 204
    assert await stored_events(session) == len(events)
    assert progress.active_seconds == 40
    assert progress.max_scroll_pct == 75
    assert (progress.proofs_opened, progress.solutions_opened) == (1, 1)
    assert progress.demos_touched == 1
    assert progress.completed_at is None


async def test_a_retried_flush_is_not_counted_twice(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    flush = batch(*reading(4, depth=50))

    await signed_in.post(EVENTS, json=flush)
    await signed_in.post(EVENTS, json=flush)

    progress = await aggregate(session, user)
    assert await stored_events(session) == len(flush["events"])
    assert progress.active_seconds == 40


async def test_the_same_toggle_from_two_tabs_counts_once(
    signed_in: AsyncClient, session: AsyncSession, user: User
) -> None:
    opened: dict[str, Any] = {"kind": "proof", "target": "surprise/proof1"}

    await signed_in.post(EVENTS, json=batch(event(schemas.TOGGLE_OPENED, opened)))
    await signed_in.post(EVENTS, json=batch(event(schemas.TOGGLE_OPENED, opened)))

    assert await stored_events(session) == 2
    assert (await aggregate(session, user)).proofs_opened == 1


async def test_a_batch_over_the_size_limit_is_refused_whole(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    oversize = [
        event(schemas.HEARTBEAT, {"seconds": 10})
        for _ in range(schemas.MAX_BATCH_EVENTS + 1)
    ]

    response = await signed_in.post(EVENTS, json=batch(*oversize))

    assert response.status_code == 422
    assert await stored_events(session) == 0


async def test_events_the_server_cannot_read_are_dropped_and_the_rest_kept(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    events = [
        event(schemas.HEARTBEAT, {"seconds": 10}),
        event("keylog", {"keys": "hunter2"}),
        event(schemas.HEARTBEAT, {"seconds": 10_000}),
        event(schemas.SCROLL, {"pct": "most of it"}),
        # Completion is the server's to derive; a client may not announce it.
        event(schemas.COMPLETED),
        event(schemas.OPENED, {"referrer": "x" * schemas.MAX_PAYLOAD_BYTES}),
    ]

    response = await signed_in.post(EVENTS, json=batch(*events))

    stored = (await session.scalars(select(Event.type))).all()
    assert response.status_code == 204
    assert list(stored) == [schemas.HEARTBEAT]


async def test_a_payload_over_the_byte_limit_is_dropped(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    padded = event(schemas.OPENED)
    padded["payload"] = {"junk": "x" * schemas.MAX_PAYLOAD_BYTES}

    await signed_in.post(EVENTS, json=batch(padded))

    assert await stored_events(session) == 0


async def test_a_lesson_that_is_not_a_locator_is_refused(
    signed_in: AsyncClient, session: AsyncSession
) -> None:
    response = await signed_in.post(
        EVENTS,
        json=batch(event(schemas.OPENED), lesson="lesson:x/y; DROP TABLE events"),
    )

    assert response.status_code == 422
    assert await stored_events(session) == 0


async def test_the_flush_rate_limit_answers_429(signed_in: AsyncClient) -> None:
    flush = batch(event(schemas.HEARTBEAT, {"seconds": 10}))
    for _ in range(schemas.MAX_BATCHES_PER_MINUTE):
        assert (await signed_in.post(EVENTS, json=flush)).status_code == 204

    assert (await signed_in.post(EVENTS, json=flush)).status_code == 429


async def test_events_of_one_reader_never_reach_another_aggregate(
    signed_in: AsyncClient, session: AsyncSession, other_user: User
) -> None:
    await signed_in.post(EVENTS, json=batch(*reading(4, depth=50)))

    assert await session.get(LessonProgress, (other_user.id, LESSON)) is None
