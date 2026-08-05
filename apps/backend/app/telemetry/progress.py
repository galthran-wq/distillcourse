import uuid
from typing import Any

from sqlalchemy import ColumnElement, Select, and_, case, distinct, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

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
        .where(
            or_(
                Document.locator == lesson,
                Document.locator.startswith(f"{lesson}#"),
            )
        )
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
) -> LessonProgress | None:
    """Rebuilds the aggregate for one reader and lesson from its events.

    Full recompute rather than an increment, so the projection cannot drift
    from the log it projects and `rebuild-progress` is this same function.
    Emits nothing: the completion side effect is the caller's (see `ingest`).
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
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["user_id", "lesson"],
            set_={
                name: statement.excluded[name]
                for name in values
                if name not in ("user_id", "lesson")
            },
        )
    )
    return await session.get(LessonProgress, (user_id, lesson), populate_existing=True)


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
        await recompute(session, user_id, lesson)
    await session.commit()
    return len(pairs)
