from datetime import UTC, datetime, time
from typing import Literal, cast

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.core.clock import TimezoneName
from app.core.config import settings as config
from app.models import User
from app.scheduling import policy
from app.telegram import repository as telegram

router = APIRouter(prefix="/settings", tags=["settings"])

TelegramStatus = Literal["none", "active", "broken"]


class Settings(BaseModel):
    timezone: str
    quiet_start: time
    quiet_end: time
    # Null is "not muted". The tutor sets this from conversation too, to a time
    # the learner named, so the page shows a moment rather than a checkbox.
    muted_until: datetime | None
    telegram: TelegramStatus


class SettingsUpdate(BaseModel):
    timezone: TimezoneName | None = None
    quiet_start: time | None = None
    quiet_end: time | None = None
    # Whether the platform may open the conversation at all. A pause set here
    # has no end date; one set in conversation ("mute until Friday") does.
    muted: bool | None = None


class Pairing(BaseModel):
    """Where to send the learner to finish pairing, and how long it is good for."""

    link: str
    expires_at: datetime


async def _state(session: SessionDep, user: User) -> Settings:
    link = await telegram.link_for_user(session, user.id)
    return Settings(
        timezone=user.timezone,
        quiet_start=user.quiet_start,
        quiet_end=user.quiet_end,
        muted_until=user.muted_until,
        # Only these two are ever written to the column.
        telegram=cast(TelegramStatus, "none" if link is None else link.status),
    )


@router.get("")
async def read(session: SessionDep, user: CurrentUser) -> Settings:
    return await _state(session, user)


@router.patch("")
async def update(
    body: SettingsUpdate, session: SessionDep, user: CurrentUser
) -> Settings:
    quiet_start = body.quiet_start or user.quiet_start
    quiet_end = body.quiet_end or user.quiet_end
    if quiet_start >= quiet_end:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "quiet hours must open before they close"
        )
    user.quiet_start = quiet_start
    user.quiet_end = quiet_end
    user.timezone = body.timezone or user.timezone
    if body.muted is not None:
        user.muted_until = policy.INDEFINITE if body.muted else None
    await session.commit()
    return await _state(session, user)


@router.post("/telegram/code", status_code=status.HTTP_201_CREATED)
async def pair(session: SessionDep, user: CurrentUser) -> Pairing:
    if config.TELEGRAM_BOT_USERNAME is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "telegram is not configured"
        )
    code = await telegram.issue_code(session, user.id, now=datetime.now(UTC))
    return Pairing(
        link=f"https://t.me/{config.TELEGRAM_BOT_USERNAME}?start={code.code}",
        expires_at=code.expires_at,
    )


@router.delete("/telegram", status_code=status.HTTP_204_NO_CONTENT)
async def unpair(session: SessionDep, user: CurrentUser) -> None:
    await telegram.unlink(session, user.id)
