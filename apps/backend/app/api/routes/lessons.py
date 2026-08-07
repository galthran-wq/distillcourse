from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.content.locators import SLUG_LENGTH, SLUG_PATTERN
from app.lessons import state

router = APIRouter(prefix="/lessons", tags=["lessons"])

# The service does not know which lessons exist — the corpus does, and it is
# ingested separately — so the shape of a slug is the whole check: enough to
# keep junk out of the columns the curator reads.
Slug = Annotated[str, Path(pattern=SLUG_PATTERN, max_length=SLUG_LENGTH)]


def lesson_key(course: Slug, lesson: Slug) -> str:
    # The index's locator: what telemetry already stores a reader's progress
    # under, so the profile can join a rating, a bookmark and a visit.
    return f"lesson:{course}/{lesson}"


LessonKey = Annotated[str, Depends(lesson_key)]


class LessonState(BaseModel):
    rating: int | None
    bookmarked: bool


class Rating(BaseModel):
    value: Literal[1, -1]


@router.get("/{course}/{lesson}")
async def read_state(
    key: LessonKey, user: CurrentUser, session: SessionDep
) -> LessonState:
    return LessonState(
        rating=await state.rating(session, user.id, key),
        bookmarked=await state.is_bookmarked(session, user.id, key),
    )


@router.put("/{course}/{lesson}/rating", status_code=status.HTTP_204_NO_CONTENT)
async def rate(
    key: LessonKey, body: Rating, user: CurrentUser, session: SessionDep
) -> None:
    await state.set_rating(session, user.id, key, body.value)


@router.put("/{course}/{lesson}/bookmark", status_code=status.HTTP_204_NO_CONTENT)
async def bookmark(key: LessonKey, user: CurrentUser, session: SessionDep) -> None:
    await state.add_bookmark(session, user.id, key)


@router.delete("/{course}/{lesson}/bookmark", status_code=status.HTTP_204_NO_CONTENT)
async def unbookmark(key: LessonKey, user: CurrentUser, session: SessionDep) -> None:
    await state.remove_bookmark(session, user.id, key)
