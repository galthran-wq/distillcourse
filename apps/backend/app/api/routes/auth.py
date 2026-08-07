import secrets
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.exc import IntegrityError

from app import crud
from app.api.deps import CurrentSession, CurrentUser, SessionDep
from app.core import sessions
from app.core.clock import TimezoneName
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


Password = Annotated[
    str, Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
]


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    timezone: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: Password
    timezone: TimezoneName
    invite_code: str
    # Bounded to the column width: a longer value reaches the database as a
    # DataError, which is not the IntegrityError signup knows how to answer.
    full_name: Annotated[str, Field(max_length=255)] | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    # No length bounds here: login must not describe the password policy.
    password: str
    timezone: TimezoneName


class PasswordChange(BaseModel):
    current_password: str
    new_password: Password


@router.post(
    "/signup", status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit)]
)
async def signup(
    body: SignupRequest, request: Request, response: Response, session: SessionDep
) -> UserPublic:
    # Bytes, not str: compare_digest rejects str operands that are not pure
    # ASCII, so a non-ASCII code — sent or configured — would raise TypeError.
    if not secrets.compare_digest(
        body.invite_code.encode(), settings.INVITE_CODE.encode()
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "invalid invite code")
    try:
        user = await crud.create_user(
            session,
            email=body.email,
            password=body.password,
            timezone=body.timezone,
            full_name=body.full_name,
        )
    except IntegrityError:
        # The unique index is the arbiter rather than a prior SELECT, so two
        # simultaneous signups cannot both pass the check.
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "email already registered")
    sessions.issue(session, response, user=user, request=request)
    await session.commit()
    return UserPublic.model_validate(user)


@router.post("/login", dependencies=[Depends(rate_limit)])
async def login(
    body: LoginRequest, request: Request, response: Response, session: SessionDep
) -> UserPublic:
    user = await crud.authenticate(session, email=body.email, password=body.password)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "incorrect email or password")
    user.timezone = body.timezone
    await sessions.delete_expired(session)
    sessions.issue(session, response, user=user, request=request)
    await session.commit()
    return UserPublic.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, session: SessionDep) -> None:
    token = request.cookies.get(sessions.COOKIE_NAME)
    if token:
        await sessions.revoke(session, token)
        await session.commit()
    sessions.clear_cookie(response)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    current: CurrentSession, response: Response, session: SessionDep
) -> None:
    await sessions.revoke_user(session, current.user_id)
    await session.commit()
    sessions.clear_cookie(response)


@router.get("/me")
async def me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: PasswordChange, current: CurrentSession, session: SessionDep
) -> None:
    if not verify_password(body.current_password, current.user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "incorrect password")
    current.user.hashed_password = get_password_hash(body.new_password)
    await sessions.revoke_user(session, current.user_id, keep=current.token_hash)
    await session.commit()
