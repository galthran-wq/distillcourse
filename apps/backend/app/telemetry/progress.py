import uuid
from collections.abc import Collection
from datetime import datetime
from hashlib import sha256
from typing import Any

from pydantic import BaseModel
from sqlalchemy import ColumnElement, Select, and_, case, distinct, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.content import search
from app.models import Document, Event, LessonProgress
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

_SECONDS = case(
    (Event.type == schemas.HEARTBEAT, Event.payload["seconds"].as_integer()), else_=0
)
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
        func.coalesce(func.sum(_SECONDS), 0).label("active_seconds"),
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


def _completed_at(user_id: uuid.UUID, lesson: str, threshold: int) -> Select[Any]:
    """The instant the reader first satisfied the rule, from the events alone.

    Not `now()`: completion has to be the same instant however often it is
    derived, or `rebuild-progress` would rewrite every completion date it
    touches. Running totals over the event order give exactly that.
    """
    running = (
        select(
            Event.server_ts,
            func.sum(_SECONDS).over(order_by=_EVENT_ORDER).label("active_seconds"),
            func.max(_PCT).over(order_by=_EVENT_ORDER).label("max_scroll_pct"),
        )
        .where(Event.user_id == user_id, Event.lesson == lesson)
        .subquery()
    )
    return select(func.min(running.c.server_ts)).where(
        running.c.active_seconds >= threshold,
        running.c.max_scroll_pct >= COMPLETION_SCROLL_PCT,
    )


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


async def rebuild(session: AsyncSession) -> int:
    """Recomputes every aggregate. Side effects are deliberately not replayed.

    A completion that was already derived keeps its `lesson_completed` event;
    one that a changed heuristic creates here gets none, because the review
    ladder it would start is not a thing to hand out retroactively.
    """
    pairs = (
        await session.execute(select(Event.user_id, Event.lesson).distinct())
    ).all()
    for user_id, lesson in pairs:
        # One transaction per pair, so a reader flushing mid-rebuild waits for
        # their own pair and no longer than that: a rebuild that held one lock
        # for the whole corpus would stall every reader on the site.
        await lock(session, user_id, lesson)
        await recompute(session, user_id, lesson)
        await session.commit()
    return len(pairs)
