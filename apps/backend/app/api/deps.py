from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import sessions
from app.core.db import session_factory
from app.models import User, UserSession


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with session_factory() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


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
    await sessions.renew_if_stale(session, response, user_session, token)
    return user_session


CurrentSession = Annotated[UserSession, Depends(get_current_session)]


async def get_current_user(user_session: CurrentSession) -> User:
    return user_session.user


CurrentUser = Annotated[User, Depends(get_current_user)]
