"""When the coach looks at a learner: one live `schedules` row of kind
`coach` per learner with an active link.

The run sets the next one itself (`follow`). Two things the learner does pull
it forward (`pull`): finishing a lesson, and coming back after a week away.
A learner with no live row — a new link, a row that failed — gets one due at
once (`ensure`). Nothing else writes these rows.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Final

from sqlalchemy import ColumnElement, and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BackgroundRun, Event, Schedule, TgLink
from app.scheduling import policy
from app.scheduling import repository as scheduling

KIND: Final = "coach"
# How far out a run may put its next look. Sooner and it is the same decision
# made again on the same state; later and a week's silence goes unexamined.
EARLIEST = timedelta(hours=4)
LATEST = timedelta(days=7)
# How soon after something the learner did the coach looks: long enough that a
# lesson just finished is not met by a card on the same screen.
SOON = timedelta(hours=1)
# A learner seen after this long without a tap, a message or a lesson opened
# is back, and worth a look today rather than at the run's own time.
AWAY = timedelta(days=7)
# Where `pull` leaves word on a row a run holds, for `follow` to honour.
PULLED = "pulled"
# What a row says woke it, for the next run to read.
OWN = "the check you set"
FIRST = "no earlier run: the learner has just connected, or a run failed"
BACK = "the learner is back after a week without a tap, a message or a lesson"


def finished(lesson: str) -> str:
    return f"the learner finished {lesson}"


def _live() -> ColumnElement[bool]:
    return and_(Schedule.kind == KIND, Schedule.status.in_(scheduling.WAITING))


def _row(user_id: uuid.UUID, due_at: datetime, reason: str, note: str) -> Schedule:
    return scheduling.new(
        user_id=user_id,
        kind=KIND,
        due_at=due_at,
        payload={"reason": reason, "note": note},
        created_by="system",
    )


async def ensure(session: AsyncSession, now: datetime) -> None:
    """A row due now for every learner with a working link and none live."""
    missing = await session.scalars(
        select(TgLink.user_id).where(
            TgLink.status == "active",
            ~select(Schedule.id)
            .where(Schedule.user_id == TgLink.user_id, _live())
            .exists(),
        )
    )
    session.add_all(_row(user_id, now, "", FIRST) for user_id in missing)
    await session.commit()


async def pull(
    session: AsyncSession, user_id: uuid.UUID, at: datetime, note: str
) -> None:
    """Bring the learner's next look forward to `at`, never back. A row a run
    holds keeps its time — that run built its state before this happened — and
    is left word instead, which `follow` carries onto the row after it. The
    caller commits."""
    await session.execute(
        update(Schedule)
        .where(
            Schedule.user_id == user_id,
            _live(),
            Schedule.lease_until.is_(None),
            Schedule.due_at > at,
        )
        .values(due_at=at, payload=Schedule.payload.op("||")({"note": note}))
    )
    # One zone and one format, so that the strings order as the moments do.
    stamp = at.astimezone(UTC).isoformat()
    await session.execute(
        update(Schedule)
        .where(
            Schedule.user_id == user_id,
            _live(),
            Schedule.lease_until.is_not(None),
            or_(
                ~Schedule.payload.has_key(PULLED),
                Schedule.payload[PULLED]["at"].astext > stamp,
            ),
        )
        .values(
            payload=Schedule.payload.op("||")({PULLED: {"at": stamp, "note": note}})
        )
    )


async def returned(session: AsyncSession, user_id: uuid.UUID, now: datetime) -> None:
    """Called on a tap, a message or a lesson opened, before it is recorded:
    the first of them after a week away pulls the next look forward. The
    caller commits."""
    waiting = (
        await session.execute(
            select(Schedule.due_at, Schedule.lease_until)
            .where(Schedule.user_id == user_id, _live())
            .limit(1)
        )
    ).first()
    if waiting is None:
        return
    # A look already due soon has nothing to be pulled to — unless a run holds
    # it, whose own next look is not decided yet. Called on every telemetry
    # flush, so the aggregates below are not paid for nothing.
    if waiting.lease_until is None and waiting.due_at <= now + SOON:
        return
    answered = await scheduling.last_contact(session, user_id)
    read: datetime | None = await session.scalar(
        select(func.max(Event.server_ts)).where(Event.user_id == user_id)
    )
    seen = max(
        (moment for moment in (answered, read) if moment is not None), default=None
    )
    if seen is None or now - seen >= AWAY:
        await pull(session, user_id, now + SOON, BACK)


def clamp(moment: datetime, now: datetime, hours: policy.Hours) -> datetime:
    """The run's own next look, held to between EARLIEST and LATEST from now
    and moved into the learner's waking hours. It is read as wall-clock time
    on the learner's clock, whatever zone it carries: that is what the run was
    asked for, and a model writes `Z` on a local time as often as not."""
    moment = moment.replace(tzinfo=hours.tz)
    return policy.next_open(min(max(moment, now + EARLIEST), now + LATEST), hours)


async def follow(
    session: AsyncSession, row: Schedule, due_at: datetime, reason: str
) -> None:
    """Close the row a run woke on and open the next, in one transaction, so
    a learner is never without one nor with two. A pull that arrived while
    the run held the row wins where it is sooner."""
    # Locked, so a pull cannot land between this read and the commit.
    await session.refresh(row, ["payload"], with_for_update=True)
    note = OWN
    pulled = row.payload.get(PULLED)
    if pulled is not None and datetime.fromisoformat(pulled["at"]) < due_at:
        due_at, note = datetime.fromisoformat(pulled["at"]), pulled["note"]
    row.status = "done"
    row.lease_until = None
    # Flushed first: the unique index on live rows sees the old one go before
    # the new one arrives.
    await session.flush()
    session.add(_row(row.user_id, due_at, reason, note))
    await session.commit()


async def runs_today(session: AsyncSession, user_id: uuid.UUID, since: datetime) -> int:
    """Every run is charged, answered or not, so this counts the failed ones
    too: a run that keeps failing must not keep trying all day."""
    total = await session.scalar(
        select(func.count()).where(
            BackgroundRun.user_id == user_id,
            BackgroundRun.kind == KIND,
            BackgroundRun.created_at >= since,
        )
    )
    return int(total or 0)
