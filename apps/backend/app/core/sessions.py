import secrets
import uuid
from datetime import UTC, datetime, timedelta
from hashlib import sha256

from fastapi import Request, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.models import User, UserSession

COOKIE_NAME = "session"
LIFETIME = timedelta(days=30)
# Expiry slides, but the write is skipped for a day: browsing a lesson must not
# cost one UPDATE per request. Cookie and row are always refreshed together.
RENEWAL_INTERVAL = timedelta(days=1)
USER_AGENT_LIMIT = 400
# Every deployed environment terminates TLS at caddy; a local stack is plain
# http, where a Secure cookie would simply never be sent back.
SECURE_COOKIE = settings.ENVIRONMENT != "local"


def token_hash(token: str) -> bytes:
    # The token is 256 bits of randomness, so a bare sha256 is enough: there is
    # no low-entropy secret to brute-force and nothing for a salt to defend.
    return sha256(token.encode()).digest()


async def issue(
    db: AsyncSession, response: Response, *, user: User, request: Request
) -> None:
    token = secrets.token_urlsafe(32)
    now = datetime.now(UTC)
    db.add(
        UserSession(
            token_hash=token_hash(token),
            user_id=user.id,
            created_at=now,
            last_used_at=now,
            expires_at=now + LIFETIME,
            user_agent=request.headers.get("user-agent", "")[:USER_AGENT_LIMIT] or None,
        )
    )
    await db.commit()
    _set_cookie(response, token)


async def load(db: AsyncSession, token: str) -> UserSession | None:
    result = await db.scalars(
        select(UserSession)
        .options(joinedload(UserSession.user))
        .where(
            UserSession.token_hash == token_hash(token),
            UserSession.expires_at > datetime.now(UTC),
        )
    )
    return result.first()


async def renew_if_stale(
    db: AsyncSession, response: Response, user_session: UserSession, token: str
) -> None:
    now = datetime.now(UTC)
    if now - user_session.last_used_at < RENEWAL_INTERVAL:
        return
    user_session.last_used_at = now
    user_session.expires_at = now + LIFETIME
    await db.commit()
    _set_cookie(response, token)


async def revoke(db: AsyncSession, token: str) -> None:
    await db.execute(
        delete(UserSession).where(UserSession.token_hash == token_hash(token))
    )
    await db.commit()


async def revoke_user(
    db: AsyncSession, user_id: uuid.UUID, *, keep: bytes | None = None
) -> None:
    statement = delete(UserSession).where(UserSession.user_id == user_id)
    if keep is not None:
        statement = statement.where(UserSession.token_hash != keep)
    await db.execute(statement)
    await db.commit()


async def delete_expired(db: AsyncSession) -> None:
    await db.execute(
        delete(UserSession).where(UserSession.expires_at <= datetime.now(UTC))
    )
    await db.commit()


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(LIFETIME.total_seconds()),
        path="/",
        httponly=True,
        samesite="lax",
        secure=SECURE_COOKIE,
    )


def clear_cookie(response: Response) -> None:
    response.delete_cookie(
        COOKIE_NAME, path="/", httponly=True, samesite="lax", secure=SECURE_COOKIE
    )
