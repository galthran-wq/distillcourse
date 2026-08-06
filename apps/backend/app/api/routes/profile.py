from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.api.deps import CurrentUser, SessionDep
from app.lessons import state

router = APIRouter(prefix="/profile", tags=["profile"])


class Bookmarked(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lesson: str
    created_at: datetime


class Profile(BaseModel):
    bookmarks: list[Bookmarked]


@router.get("")
async def read(user: CurrentUser, session: SessionDep) -> Profile:
    return Profile(
        bookmarks=[
            Bookmarked.model_validate(row)
            for row in await state.bookmarks(session, user.id)
        ],
    )
