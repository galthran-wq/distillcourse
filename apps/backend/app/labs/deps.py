from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.api.deps import SessionDep
from app.labs import repository
from app.models import User


async def get_lab_user(request: Request, session: SessionDep) -> User:
    """The learner a notebook is calling for.

    A bearer header rather than the session cookie: the caller is a python
    process on the learner's machine, which has no cookie jar and no browser to
    sign in with.
    """
    unauthenticated = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "not paired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    scheme, _, presented = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not presented:
        raise unauthenticated
    user = await repository.authenticate(session, presented, now=datetime.now(UTC))
    if user is None or not user.is_active:
        raise unauthenticated
    return user


LabUser = Annotated[User, Depends(get_lab_user)]
