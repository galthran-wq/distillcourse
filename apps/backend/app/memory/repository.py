import uuid
from collections.abc import Sequence
from typing import Annotated, Literal

from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MEMORY_SLUG_LENGTH, Memory

Source = Literal["agent", "user"]

# A description is read in the index of every run, so it is one line; a body is
# read only when a description says it bears on the question, so it can be a
# paragraph. Both are bounded where the model writes them: an over-long value
# comes back to it as a retry it can correct, where an over-long insert would
# leave the run's transaction failed and lose the turn with it.
DESCRIPTION_LENGTH = 160
CONTENT_LENGTH = 2000

Slug = Annotated[
    str,
    Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=MEMORY_SLUG_LENGTH),
]
Description = Annotated[str, Field(min_length=1, max_length=DESCRIPTION_LENGTH)]
Content = Annotated[str, Field(min_length=1, max_length=CONTENT_LENGTH)]


class Recollection(BaseModel):
    """One memory as the model writes it: the handle it will ask for it back
    by, the line that decides whether it is worth asking for, and the fact."""

    slug: Slug
    description: Description
    content: Content


async def index(session: AsyncSession, user_id: uuid.UUID) -> Sequence[Memory]:
    # Ordered by slug rather than by recency: this list is in the system prompt
    # of every run, and an order that reshuffles whenever a memory is written
    # rewrites the prompt for no reason.
    return (
        await session.scalars(
            select(Memory).where(Memory.user_id == user_id).order_by(Memory.slug)
        )
    ).all()


async def read(
    session: AsyncSession, user_id: uuid.UUID, slugs: Sequence[str]
) -> Sequence[Memory]:
    return (
        await session.scalars(
            select(Memory)
            .where(Memory.user_id == user_id, Memory.slug.in_(slugs))
            .order_by(Memory.slug)
        )
    ).all()


async def save(
    session: AsyncSession,
    user_id: uuid.UUID,
    memory: Recollection,
    *,
    source: Source,
) -> None:
    statement = insert(Memory).values(
        user_id=user_id,
        slug=memory.slug,
        description=memory.description,
        content=memory.content,
        source=source,
    )
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["user_id", "slug"],
            set_={
                "description": statement.excluded.description,
                "content": statement.excluded.content,
                "source": statement.excluded.source,
                "updated_at": func.now(),
            },
        )
    )
    await session.commit()


async def edit(
    session: AsyncSession,
    user_id: uuid.UUID,
    slug: str,
    *,
    description: str,
    content: str,
) -> bool:
    """The learner's own correction from their profile page — an update, never
    an insert: the page shows what the tutor wrote and is not a way to author
    memories it never had."""
    edited = await session.scalar(
        update(Memory)
        .where(Memory.user_id == user_id, Memory.slug == slug)
        .values(
            description=description,
            content=content,
            source="user",
            updated_at=func.now(),
        )
        .returning(Memory.slug)
    )
    await session.commit()
    return edited is not None


async def remove(session: AsyncSession, user_id: uuid.UUID, slug: str) -> bool:
    removed = await session.scalar(
        delete(Memory)
        .where(Memory.user_id == user_id, Memory.slug == slug)
        .returning(Memory.slug)
    )
    await session.commit()
    return removed is not None
