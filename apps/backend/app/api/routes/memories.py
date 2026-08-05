from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel, ConfigDict

from app.api.deps import CurrentUser, SessionDep
from app.memory import repository
from app.memory.repository import Content, Description
from app.models import MEMORY_SLUG_LENGTH

router = APIRouter(prefix="/memories", tags=["memories"])

MemorySlug = Annotated[
    str, Path(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=MEMORY_SLUG_LENGTH)
]


class MemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    description: str
    content: str
    source: str
    updated_at: datetime


class MemoryEdit(BaseModel):
    description: Description
    content: Content


@router.get("")
async def index(user: CurrentUser, session: SessionDep) -> list[MemoryOut]:
    return [
        MemoryOut.model_validate(row)
        for row in await repository.index(session, user.id)
    ]


@router.put("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def edit(
    slug: MemorySlug, body: MemoryEdit, user: CurrentUser, session: SessionDep
) -> None:
    edited = await repository.edit(
        session, user.id, slug, description=body.description, content=body.content
    )
    if not edited:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "nothing is remembered here")


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def forget(slug: MemorySlug, user: CurrentUser, session: SessionDep) -> None:
    if not await repository.remove(session, user.id, slug):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "nothing is remembered here")
