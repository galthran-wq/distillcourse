from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.api.deps import CurrentUser, SessionDep
from app.lessons import state

router = APIRouter(prefix="/profile", tags=["profile"])


class Visit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lesson: str
    last_seen: datetime
    completed_at: datetime | None


class Bookmarked(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lesson: str
    created_at: datetime


class Profile(BaseModel):
    history: list[Visit]
    bookmarks: list[Bookmarked]


@router.get("")
async def read(user: CurrentUser, session: SessionDep) -> Profile:
    return Profile(
        history=[
            Visit.model_validate(row) for row in await state.history(session, user.id)
        ],
        bookmarks=[
            Bookmarked.model_validate(row)
            for row in await state.bookmarks(session, user.id)
        ],
    )
