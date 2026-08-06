from collections.abc import Callable, Coroutine
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.routing import APIRoute
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.content import structure
from app.core.rate_limit import FixedWindow, register
from app.lessons import state
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


class Day(BaseModel):
    date: date
    count: int


class Recent(BaseModel):
    lesson: str
    # Absent for a lesson the index has never seen; the site names it from its
    # own build, and this is only what the service can add.
    title: str | None
    last_seen: datetime


class Activity(BaseModel):
    days: list[Day]
    recent: list[Recent]


@router.get("/activity")
async def activity(user: CurrentUser, session: SessionDep) -> Activity:
    """The reading days the profile draws as a grid, and what was read lately.

    Both are on the reader's calendar, and the recent list is the same history
    the profile has always shown.
    """
    titles = await structure.lesson_titles(session)
    return Activity(
        days=[
            Day(date=day, count=count)
            for day, count in await passes.activity(session, user)
        ],
        recent=[
            Recent(
                lesson=row.lesson, title=titles.get(row.lesson), last_seen=row.last_seen
            )
            for row in await state.history(session, user.id)
        ],
    )
