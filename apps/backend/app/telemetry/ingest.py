import json
import uuid
from datetime import datetime
from typing import Any

from pydantic import ValidationError
from sqlalchemy import exists, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, LessonProgress
from app.review import repository as review
from app.telemetry import progress, schemas
from app.telemetry.schemas import EventBatch, RawEvent


async def record(session: AsyncSession, user_id: uuid.UUID, batch: EventBatch) -> None:
    """Stores a flush and re-derives what it changed, in one transaction."""
    if not batch.events:
        return
    await progress.lock(session, user_id, batch.lesson)
    rows = await _rows(session, user_id, batch)
    if rows:
        await session.execute(
            insert(Event).values(rows).on_conflict_do_nothing(index_elements=["id"])
        )
    completed_at = await progress.recompute(session, user_id, batch.lesson)
    if completed_at is not None:
        await _emit_completion(session, user_id, batch.lesson, completed_at)
        # The subscription spaced repetition is built on. Unconditional rather
        # than guarded by the emit: the ladder's own key is what makes a second
        # completion of the same lesson a no-op, and a ladder that failed to
        # open once should be opened by the next flush that sees the
        # completion, not lost with the event that already exists.
        await review.start(session, user_id, batch.lesson, completed_at)
    await session.commit()


async def _rows(
    session: AsyncSession, user_id: uuid.UUID, batch: EventBatch
) -> list[dict[str, Any]]:
    seconds_left = await _creditable_seconds(session, user_id, batch.lesson)
    rows: list[dict[str, Any]] = []
    for event in batch.events:
        payload = _payload(event)
        if payload is None:
            continue
        if event.type == schemas.HEARTBEAT:
            payload["seconds"] = min(payload["seconds"], seconds_left)
            seconds_left -= payload["seconds"]
            # A beat the clock cannot back is not stored at all, so the time it
            # claimed stays in the next flush's budget instead of being spent by
            # a `last_seen` this batch moved forward for nothing.
            if payload["seconds"] == 0:
                continue
        rows.append(
            {
                "id": event.id,
                "user_id": user_id,
                "lesson": batch.lesson,
                "type": event.type,
                "client_ts": event.client_ts,
                "payload": payload,
            }
        )
    return rows


async def _creditable_seconds(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> int:
    """How much attention this flush may claim, on the server's own clock.

    The `seconds` in a heartbeat are the client's word, and nothing in the
    payload bounds their total: fifty events fit in a batch and the limiter
    allows sixty batches a minute, so one POST would otherwise finish any
    lesson. Real time is the bound — a flush credits at most the seconds that
    passed since the previous one. The first flush has no previous one to
    measure from and gets a single heartbeat's worth, which is below every
    completion threshold there is.
    """
    elapsed = await session.scalar(
        # Both sides come from Postgres, so this is the clock that stamps
        # `server_ts` whatever the application host's own is doing.
        select(func.extract("epoch", func.now() - LessonProgress.last_seen)).where(
            LessonProgress.user_id == user_id, LessonProgress.lesson == lesson
        )
    )
    if elapsed is None:
        return schemas.MAX_HEARTBEAT_SECONDS
    return max(0, int(elapsed))


def _payload(event: RawEvent) -> dict[str, Any] | None:
    model = schemas.PAYLOADS.get(event.type)
    if model is None or len(json.dumps(event.payload)) > schemas.MAX_PAYLOAD_BYTES:
        return None
    try:
        # Validated and re-emitted, so what reaches the database is the declared
        # shape and nothing else: the aggregate casts these fields in SQL, and
        # unknown keys are a client's chance to store whatever it likes.
        return model.model_validate(event.payload).model_dump()
    except ValidationError:
        # An unreadable event is dropped rather than answered with an error.
        # Telemetry exists to watch reading, never to interrupt it.
        return None


async def _emit_completion(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, completed_at: datetime
) -> None:
    # A random id rather than one derived from (user, lesson): ids are the
    # client's to mint, so a predictable one could be inserted first and
    # suppress this event for good. What makes the emit exactly-once is the
    # absence of the event, read and acted on under the lock `record` holds.
    # Stamped with the completion instant rather than now(), so the derived
    # event cannot move the `last_seen` of the reading it describes.
    emitted = await session.scalar(
        select(
            exists().where(
                Event.user_id == user_id,
                Event.lesson == lesson,
                Event.type == schemas.COMPLETED,
            )
        )
    )
    if emitted:
        return
    await session.execute(
        insert(Event).values(
            {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "lesson": lesson,
                "type": schemas.COMPLETED,
                "client_ts": completed_at,
                "server_ts": completed_at,
                "payload": {},
            }
        )
    )
