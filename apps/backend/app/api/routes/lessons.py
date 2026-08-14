from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, LessonKey, SessionDep
from app.lessons import state

router = APIRouter(prefix="/lessons", tags=["lessons"])


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
