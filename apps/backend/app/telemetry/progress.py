import uuid
from collections.abc import Collection
from datetime import datetime
from hashlib import sha256
from typing import Any

from pydantic import BaseModel
from sqlalchemy import (
    ColumnElement,
    Select,
    Subquery,
    and_,
    case,
    distinct,
    func,
    literal_column,
    select,
)
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.content import search
from app.models import Document, Event, LessonProgress, User
from app.telemetry import schemas

WORDS_PER_MINUTE = 250
# Half the reading time, not all of it: finishing a lesson does not mean having
# read every word at a beginner's pace.
ENGAGEMENT_FRACTION = 0.5
MIN_THRESHOLD_SECONDS = 3 * 60
MAX_THRESHOLD_SECONDS = 20 * 60
# A lesson the index has never seen (unpublished, or reindexing is due) still
# has to be completable, so it falls back to the middle of the clamp.
UNINDEXED_THRESHOLD_SECONDS = 5 * 60
COMPLETION_SCROLL_PCT = 90

# The one definition of credited attention there is: an event is worth the
# seconds a heartbeat claims and nothing otherwise. Public because the reading
# day and the activity feed (app/telemetry/passes.py) are the same sum over
# other buckets, and a second definition of read time would be a second answer.
CREDITED_SECONDS = case(
    (Event.type == schemas.HEARTBEAT, Event.payload["seconds"].as_integer()), else_=0
)
# When an event that counts as reading happened, and nothing for one that does
# not. min/max of this is the span a sitting was actually read over: a lesson
# opened at breakfast and left in a tab does not stretch the evening's reading
# back to it.
CREDITED_AT = case((Event.type == schemas.HEARTBEAT, Event.server_ts))
_PCT = case((Event.type == schemas.SCROLL, Event.payload["pct"].as_integer()), else_=0)
_EVENT_ORDER = (Event.server_ts, Event.id)


async def lock(session: AsyncSession, user_id: uuid.UUID, lesson: str) -> None:
    """Serialises everything that writes this reader's aggregate for a lesson.

    Two tabs of the same lesson flush concurrently, and a rebuild can land in
    the middle. Without this, each would recompute from what it can see and the
    later upsert would overwrite the other's events with a total missing them.
    """
    # pg_advisory_xact_lock takes a bigint; hashing here rather than with
    # Postgres's own hashtext keeps the key computable from either side.
    key = int.from_bytes(
        sha256(f"{user_id}:{lesson}".encode()).digest()[:8], "big", signed=True
    )
    await session.execute(select(func.pg_advisory_xact_lock(key)))


def _toggle_target(kind: str) -> ColumnElement[str | None]:
    return case(
        (
            and_(
                Event.type == schemas.TOGGLE_OPENED,
                Event.payload["kind"].astext == kind,
            ),
            Event.payload["target"].astext,
        )
    )


def _totals(user_id: uuid.UUID, lesson: str) -> Select[Any]:
    # Counting distinct targets rather than events keeps the aggregate a pure
    # function of the event set: two tabs reporting the same proof, or a replay
    # of an old batch, must not make it two proofs.
    return select(
        func.coalesce(func.sum(CREDITED_SECONDS), 0).label("active_seconds"),
        func.coalesce(func.max(_PCT), 0).label("max_scroll_pct"),
        func.count(distinct(_toggle_target("proof"))).label("proofs_opened"),
        func.count(distinct(_toggle_target("solution"))).label("solutions_opened"),
        func.count(
            distinct(
                case(
                    (
                        Event.type == schemas.DEMO_INTERACTED,
                        Event.payload["target"].astext,
                    )
                )
            )
        ).label("demos_touched"),
        func.min(Event.server_ts).label("first_seen"),
        func.max(Event.server_ts).label("last_seen"),
    ).where(Event.user_id == user_id, Event.lesson == lesson)


def _running(
    user_id: uuid.UUID,
    lesson: str,
    bucket: ColumnElement[Any],
    *within: ColumnElement[bool],
) -> Subquery:
    """Every event of this reader on this lesson, each carrying the totals its
    bucket had reached by then.

    The totals come from the events and never from `now()`: whatever is derived
    from them has to be the same however often it is derived, or
    `rebuild-progress` would rewrite every date it touches.
    """
    return (
        select(
            bucket.label("bucket"),
            Event.server_ts,
            func.sum(CREDITED_SECONDS)
            .over(partition_by=bucket, order_by=_EVENT_ORDER)
            .label("active_seconds"),
            func.max(_PCT)
            .over(partition_by=bucket, order_by=_EVENT_ORDER)
            .label("max_scroll_pct"),
        )
        .where(Event.user_id == user_id, Event.lesson == lesson, *within)
        .subquery()
    )


def _first(running: Subquery, *met: ColumnElement[bool]) -> Select[Any]:
    """Per bucket, the instant its running totals first satisfied `met`."""
    return (
        select(running.c.bucket, func.min(running.c.server_ts).label("reached_at"))
        .where(*met)
        .group_by(running.c.bucket)
    )


def reached_seconds(
    user_id: uuid.UUID,
    lesson: str,
    seconds: int,
    bucket: ColumnElement[Any],
    *within: ColumnElement[bool],
) -> Select[Any]:
    """Per bucket, the instant credited attention first reached `seconds`.

    Attention alone, with no scroll depth: this is what a reading day is earned
    by (app/telemetry/passes.py), and a lesson read over a fortnight reaches
    the bottom of the page on exactly one of those days.
    """
    running = _running(user_id, lesson, bucket, *within)
    return _first(running, running.c.active_seconds >= seconds)


def _completed_at(user_id: uuid.UUID, lesson: str, threshold: int) -> Select[Any]:
    """When the reader first met the completion bar on this lesson: `threshold`
    seconds of credited attention, scrolled to `COMPLETION_SCROLL_PCT`.

    One bucket, so the totals run over the whole history: someone who reads it
    in five sittings has read it, which is what separates completion from the
    reading day a single sitting has to earn on its own.
    """
    running = _running(user_id, lesson, literal_column("1"))
    reached = _first(
        running,
        running.c.active_seconds >= threshold,
        running.c.max_scroll_pct >= COMPLETION_SCROLL_PCT,
    ).subquery()
    return select(reached.c.reached_at)


async def threshold_seconds(session: AsyncSession, lesson: str) -> int:
    """How long this lesson has to hold attention before it counts as read."""
    # Every chunk of a lesson carries the whole lesson's word count, so the
    # first one answers for the lesson — including a lesson that opens on an h2
    # and therefore has no anchorless chunk.
    words: int | None = await session.scalar(
        select(Document.meta["document_word_count"].as_integer())
        .where(search.chunks_of(lesson))
        .order_by(Document.position)
        .limit(1)
    )
    if words is None:
        return UNINDEXED_THRESHOLD_SECONDS
    reading_seconds = words / WORDS_PER_MINUTE * ENGAGEMENT_FRACTION * 60
    return round(
        min(max(reading_seconds, MIN_THRESHOLD_SECONDS), MAX_THRESHOLD_SECONDS)
    )


async def recompute(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> datetime | None:
    """Rebuilds the aggregate for one reader and lesson from its events.

    Full recompute rather than an increment, so the projection cannot drift
    from the log it projects and `rebuild-progress` is this same function.
    Emits nothing: the completion side effect is the caller's (see `ingest`).
    Returns the completion instant it derived, which is all a caller needs.
    """
    totals = (await session.execute(_totals(user_id, lesson))).one()
    if totals.last_seen is None:
        return None
    values = {
        "user_id": user_id,
        "lesson": lesson,
        **totals._mapping,
        "completed_at": await session.scalar(
            _completed_at(user_id, lesson, await threshold_seconds(session, lesson))
        ),
    }
    statement = insert(LessonProgress).values(values)
    return await session.scalar(
        statement.on_conflict_do_update(
            index_elements=["user_id", "lesson"],
            set_={
                name: statement.excluded[name]
                for name in values
                if name not in ("user_id", "lesson")
            },
        ).returning(LessonProgress.completed_at)
    )


class Reading(BaseModel):
    """What one reader's events add up to on one lesson, as a consumer outside
    telemetry reads it.

    `solutions_total` comes from the index rather than from the events: it is a
    property of the lesson, and it is what makes `solutions_opened` mean
    anything. It is absent for a lesson the index has never seen.
    """

    lesson: str
    completed_at: datetime | None
    active_seconds: int
    max_scroll_pct: int
    solutions_opened: int
    solutions_total: int | None
    last_seen: datetime


def _solutions_total(lessons: Collection[str]) -> Select[Any]:
    """How many solutions each of these lessons ships.

    Every chunk of a lesson carries the whole lesson's count, so grouping the
    chunks by the document they belong to answers for the lesson — including
    one that opens on an h2 and therefore has no anchorless chunk.
    """
    document = func.split_part(Document.locator, "#", 1)
    return (
        select(document, func.max(Document.meta["solutions_total"].as_integer()))
        .where(document.in_(lessons))
        .group_by(document)
    )


async def of_reader(
    session: AsyncSession, user_id: uuid.UUID, *, course: str | None = None
) -> list[Reading]:
    """What this reader has read, most recently seen first.

    A lesson they never opened has no row and is simply absent — "not started"
    and "started and abandoned" are different answers, and only the events can
    tell them apart.
    """
    statement = select(LessonProgress).where(LessonProgress.user_id == user_id)
    if course is not None:
        statement = statement.where(
            # autoescape: a `%` in a caller-supplied slug is a LIKE wildcard,
            # and one course's prefix would match every course.
            LessonProgress.lesson.startswith(f"lesson:{course}/", autoescape=True)
        )
    rows = (
        await session.scalars(statement.order_by(LessonProgress.last_seen.desc()))
    ).all()
    if not rows:
        return []
    totals: dict[str, int | None] = {}
    for lesson, total in (
        await session.execute(_solutions_total([row.lesson for row in rows]))
    ).all():
        totals[lesson] = total
    return [
        Reading(
            lesson=row.lesson,
            completed_at=row.completed_at,
            active_seconds=row.active_seconds,
            max_scroll_pct=row.max_scroll_pct,
            solutions_opened=row.solutions_opened,
            solutions_total=totals.get(row.lesson),
            last_seen=row.last_seen,
        )
        for row in rows
    ]


async def pairs(session: AsyncSession) -> list[tuple[uuid.UUID, str, str]]:
    """Every (reader, lesson) the event log names, with the reader's own zone.

    Everything derived from the events is derived per pair, and `rebuild-progress`
    (app/cli.py) walks this once for all of them. The zone rides along because
    the other projection built from these events — the reading day
    (app/telemetry/passes.py) — is dated on the reader's calendar, and one join
    here beats a lookup per pair.
    """
    return list(
        (
            await session.execute(
                select(Event.user_id, Event.lesson, User.timezone)
                .join(User, User.id == Event.user_id)
                .distinct()
            )
        )
        .tuples()
        .all()
    )
