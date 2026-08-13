from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, Path, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.content import locators
from app.core import sessions
from app.core.db import session_factory
from app.harness.repository import HarnessRepository
from app.models import User, UserSession


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with session_factory() as session:
        yield session


# Work that outlives its request — the agent run behind a chat stream — opens
# its own session, so it needs the factory rather than a request-scoped one.
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return session_factory


SessionDep = Annotated[AsyncSession, Depends(get_session)]
SessionFactoryDep = Annotated[
    async_sessionmaker[AsyncSession], Depends(get_session_factory)
]


async def get_current_session(
    request: Request, response: Response, session: SessionDep
) -> UserSession:
    unauthenticated = HTTPException(status.HTTP_401_UNAUTHORIZED, "not authenticated")
    token = request.cookies.get(sessions.COOKIE_NAME)
    if token is None:
        raise unauthenticated
    user_session = await sessions.load(session, token)
    if user_session is None or not user_session.user.is_active:
        raise unauthenticated
    if sessions.renew_if_stale(response, user_session, token):
        await session.commit()
    return user_session


CurrentSession = Annotated[UserSession, Depends(get_current_session)]


async def get_current_user(user_session: CurrentSession) -> User:
    return user_session.user


CurrentUser = Annotated[User, Depends(get_current_user)]


# A route asks for the repository rather than building one, so no route can
# reach the database without the user it is scoped to.
def get_repository(session: SessionDep, user: CurrentUser) -> HarnessRepository:
    return HarnessRepository(session, user.id)


RepositoryDep = Annotated[HarnessRepository, Depends(get_repository)]

# The service does not know which lessons exist — the corpus does, and it is
# ingested separately — so the shape of a slug is the whole check: enough to
# keep junk out of the columns a route reads and writes.
Slug = Annotated[
    str, Path(pattern=locators.SLUG_PATTERN, max_length=locators.SLUG_LENGTH)
]


def lesson_key(course: Slug, lesson: Slug) -> str:
    return locators.lesson_key(course, lesson)


LessonKey = Annotated[str, Depends(lesson_key)]
