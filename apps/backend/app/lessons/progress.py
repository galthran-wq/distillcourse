import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.content import locators
from app.labs import repository as labs
from app.telemetry import progress as reading


class Standing(BaseModel):
    """How far one reader has got with one lesson, as the site marks it.

    `lesson` is `<course>/<slug>` — the coordinate the site's own routes use,
    without the corpus every entry here would repeat.
    """

    lesson: str
    state: Literal["read", "started"]
    last_seen: datetime


async def standings(
    session: AsyncSession, user_id: uuid.UUID, *, course: str | None = None
) -> list[Standing]:
    """Every lesson this reader has started, most recently seen first.

    Reading is what telemetry already decided (`lesson_progress.completed_at`);
    a lab is the exception, finished by its required checkpoints rather than by
    reading its page, and started by a submission as much as by a visit.
    """
    seen: dict[str, datetime] = {}
    read: set[str] = set()
    for row in await reading.of_reader(session, user_id, course=course):
        seen[row.lesson] = row.last_seen
        if row.completed_at is not None:
            read.add(row.lesson)
    for lesson, at in (await labs.submitted(session, user_id, course=course)).items():
        seen[lesson] = max(seen.get(lesson, at), at)
    for lesson, done in (await labs.finished(session, user_id, seen)).items():
        if done:
            read.add(lesson)
        else:
            read.discard(lesson)
    return sorted(
        (
            Standing(
                lesson=locators.path_of(lesson),
                state="read" if lesson in read else "started",
                last_seen=at,
            )
            for lesson, at in seen.items()
        ),
        key=lambda standing: standing.last_seen,
        reverse=True,
    )
