import secrets
import uuid
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.exc import IntegrityError

from app import crud
from app.api.deps import CurrentSession, CurrentUser, SessionDep
from app.core import sessions
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _known_timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError, ValueError:
        raise ValueError(f"unknown timezone: {value}")
    return value


# Scheduling (quiet hours, proactive reviews) reads this straight from the row,
# so anything that is not an IANA zone has to be rejected at the door.
TimezoneName = Annotated[str, AfterValidator(_known_timezone)]
Password = Annotated[str, Field(min_length=8, max_length=128)]


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
    full_name: str | None = None


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
    if not secrets.compare_digest(body.invite_code, settings.INVITE_CODE):
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
    await sessions.issue(session, response, user=user, request=request)
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
    await sessions.issue(session, response, user=user, request=request)
    return UserPublic.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, session: SessionDep) -> None:
    token = request.cookies.get(sessions.COOKIE_NAME)
    if token:
        await sessions.revoke(session, token)
    sessions.clear_cookie(response)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    current: CurrentSession, response: Response, session: SessionDep
) -> None:
    await sessions.revoke_user(session, current.user_id)
    sessions.clear_cookie(response)


@router.get("/me")
async def me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: PasswordChange, current: CurrentSession, session: SessionDep
) -> None:
    verified, _ = verify_password(body.current_password, current.user.hashed_password)
    if not verified:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "incorrect password")
    current.user.hashed_password = get_password_hash(body.new_password)
    await session.commit()
    await sessions.revoke_user(session, current.user_id, keep=current.token_hash)
