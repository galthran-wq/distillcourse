import uuid
from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bookmark, LessonRating

# The profile shows where the reader has been lately, not everywhere they have
# ever been; a longer list is a different feature, not a bigger number here.


async def rating(session: AsyncSession, user_id: uuid.UUID, lesson: str) -> int | None:
    value: int | None = await session.scalar(
        select(LessonRating.value).where(
            LessonRating.user_id == user_id, LessonRating.lesson == lesson
        )
    )
    return value


async def set_rating(
    session: AsyncSession, user_id: uuid.UUID, lesson: str, value: int
) -> None:
    # One row per (user, lesson), changeable: the second vote replaces the
    # first instead of being rejected or counted twice.
    statement = insert(LessonRating).values(user_id=user_id, lesson=lesson, value=value)
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["user_id", "lesson"],
            set_={"value": statement.excluded.value, "updated_at": func.now()},
        )
    )
    await session.commit()


async def is_bookmarked(session: AsyncSession, user_id: uuid.UUID, lesson: str) -> bool:
    return (
        await session.scalar(
            select(Bookmark.lesson).where(
                Bookmark.user_id == user_id, Bookmark.lesson == lesson
            )
        )
    ) is not None


async def add_bookmark(session: AsyncSession, user_id: uuid.UUID, lesson: str) -> None:
    # Idempotent, so a double click from two tabs is one bookmark and not a
    # 409 the toggle would have to explain.
    await session.execute(
        insert(Bookmark)
        .values(user_id=user_id, lesson=lesson)
        .on_conflict_do_nothing(index_elements=["user_id", "lesson"])
    )
    await session.commit()


async def remove_bookmark(
    session: AsyncSession, user_id: uuid.UUID, lesson: str
) -> None:
    await session.execute(
        delete(Bookmark).where(Bookmark.user_id == user_id, Bookmark.lesson == lesson)
    )
    await session.commit()


async def bookmarks(session: AsyncSession, user_id: uuid.UUID) -> Sequence[Bookmark]:
    return (
        await session.scalars(
            select(Bookmark)
            .where(Bookmark.user_id == user_id)
            .order_by(Bookmark.created_at.desc())
        )
    ).all()
