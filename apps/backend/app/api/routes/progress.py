from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.content import locators
from app.lessons import progress

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("")
async def read(
    user: CurrentUser,
    session: SessionDep,
    course: Annotated[
        str | None,
        Query(pattern=locators.SLUG_PATTERN, max_length=locators.SLUG_LENGTH),
    ] = None,
) -> list[progress.Standing]:
    return await progress.standings(session, user.id, course=course)
