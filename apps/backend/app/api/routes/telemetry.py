from collections.abc import Callable, Coroutine
from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.routing import APIRoute
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.core.rate_limit import FixedWindow, register
from app.telemetry import ingest, passes
from app.telemetry.schemas import MAX_BATCH_BYTES, MAX_BATCHES_PER_MINUTE, EventBatch


class SizeLimited(APIRoute):
    """Turns an oversized body away before FastAPI reads and parses it.

    A dependency could not: the body is read before dependencies are solved,
    so the caps in `schemas` are pydantic's and only ever apply to a batch
    already buffered whole. caddy holds the same ceiling for a request that
    declares no length at all.
    """

    def get_route_handler(self) -> Callable[[Request], Coroutine[Any, Any, Response]]:
        handler = super().get_route_handler()

        async def refuse_oversized(request: Request) -> Response:
            declared = request.headers.get("content-length", "")
            if declared.isdigit() and int(declared) > MAX_BATCH_BYTES:
                raise HTTPException(
                    status.HTTP_413_CONTENT_TOO_LARGE, "batch too large"
                )
            return await handler(request)

        return refuse_oversized


router = APIRouter(prefix="/telemetry", tags=["telemetry"], route_class=SizeLimited)

# Keyed by user, not by address: a household behind one address reads several
# lessons at once, and it is an account that could flood the table.
_flushes = register(FixedWindow(MAX_BATCHES_PER_MINUTE))


# Only signed-in readers are tracked, which the dependency states: an anonymous
# visitor gets 401 and leaves no row anywhere.
@router.post("/events", status_code=status.HTTP_204_NO_CONTENT)
async def events(batch: EventBatch, user: CurrentUser, session: SessionDep) -> None:
    _flushes.check(str(user.id))
    await ingest.record(session, user, batch)


# What the feed opens on. A reader who reads two lessons a day sees a
# fortnight, which is as far back as "lately" goes; older days are reached by
# clicking their square.
FEED_ENTRIES = 30


class Day(BaseModel):
    date: date
    count: int
    minutes: int


class Activity(BaseModel):
    days: list[Day]
    feed: list[passes.Entry]


class DayActivity(BaseModel):
    feed: list[passes.Entry]


@router.get("/activity")
async def activity(user: CurrentUser, session: SessionDep) -> Activity:
    """The grid the profile draws and the feed under it, on the reader's calendar.

    A square counts the lessons the day *earned* — five minutes each — while its
    minutes and the feed under it are every lesson the day *touched*: the two
    answer "was this a reading day" and "what was read", and only the first has
    a bar to clear.
    """
    read = await passes.entries(session, user)
    minutes: dict[date, int] = {}
    for entry in read:
        minutes[entry.date] = minutes.get(entry.date, 0) + entry.seconds
    counts = dict(await passes.activity(session, user))
    return Activity(
        days=[
            Day(
                date=day,
                count=counts.get(day, 0),
                minutes=round(minutes.get(day, 0) / 60),
            )
            for day in sorted(counts.keys() | minutes.keys())
        ],
        feed=read[:FEED_ENTRIES],
    )


@router.get("/activity/{day}")
async def activity_on(day: date, user: CurrentUser, session: SessionDep) -> DayActivity:
    """What one square of the grid was made of, for the reader who clicked it.

    Derived from `events`, which housekeeping is free to prune: a square outlives
    the events behind it — a day that was read stays read — so an old one can
    answer with nothing, and that is the honest answer rather than a fault.
    """
    return DayActivity(feed=await passes.entries(session, user, day))
