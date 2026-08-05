import json
import uuid
from hashlib import sha256
from typing import Any

from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, LessonProgress
from app.telemetry import progress, schemas
from app.telemetry.schemas import EventBatch, RawEvent


async def record(
    session: AsyncSession, user_id: uuid.UUID, batch: EventBatch
) -> LessonProgress | None:
    """Stores a flush and re-derives what it changed, in one transaction."""
    # Two tabs of the same lesson flush concurrently. Without this, both would
    # recompute from what they can see and the later upsert would overwrite the
    # other's events with a total that is missing them.
    await session.execute(
        select(func.pg_advisory_xact_lock(_lock(user_id, batch.lesson)))
    )
    rows = [
        {
            "id": event.id,
            "user_id": user_id,
            "lesson": batch.lesson,
            "type": event.type,
            "client_ts": event.client_ts,
            "payload": payload,
        }
        for event in batch.events
        if (payload := _payload(event)) is not None
    ]
    if rows:
        # The client mints the ids, so a retried flush lands on rows that are
        # already there instead of counting the same ten seconds twice.
        await session.execute(
            insert(Event).values(rows).on_conflict_do_nothing(index_elements=["id"])
        )
    aggregate = await progress.recompute(session, user_id, batch.lesson)
    if aggregate is not None and aggregate.completed_at is not None:
        await _emit_completion(session, aggregate)
    await session.commit()
    return aggregate


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


async def _emit_completion(session: AsyncSession, aggregate: LessonProgress) -> None:
    # The id is derived from (user, lesson), so this insert is itself the
    # exactly-once check: a second flush, a concurrent tab and a later
    # recompute all collide on the row that is already there. Stamped with the
    # completion instant rather than now(), so the derived event cannot move
    # the `last_seen` of the reading it describes.
    await session.execute(
        insert(Event)
        .values(
            {
                "id": uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"distillcourse:lesson_completed:{aggregate.user_id}:{aggregate.lesson}",
                ),
                "user_id": aggregate.user_id,
                "lesson": aggregate.lesson,
                "type": schemas.COMPLETED,
                "client_ts": aggregate.completed_at,
                "server_ts": aggregate.completed_at,
                "payload": {},
            }
        )
        .on_conflict_do_nothing(index_elements=["id"])
    )


def _lock(user_id: uuid.UUID, lesson: str) -> int:
    # pg_advisory_xact_lock takes a bigint; hashing here rather than with
    # Postgres's own hashtext keeps the key computable from either side.
    return int.from_bytes(
        sha256(f"{user_id}:{lesson}".encode()).digest()[:8], "big", signed=True
    )
