import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.sessions import token_hash
from app.models import LabPairingCode, LabToken, User

# Short enough to be spent in one sitting: whoever holds the string can mint a
# token that speaks for the learner it was issued for.
CODE_TTL = timedelta(minutes=10)
CODE_BYTES = 16
TOKEN_BYTES = 32
# The token outlives every notebook session, so the row is stamped for the
# operator rather than for expiry — and a checkpoint call must not cost an
# UPDATE, which is the same bargain `core/sessions.py` strikes.
USE_INTERVAL = timedelta(days=1)


class PairingRejected(Exception):
    """Why a code did not become a token, in words the learner is told."""


async def issue_code(
    session: AsyncSession, user_id: uuid.UUID, *, now: datetime
) -> LabPairingCode:
    code = LabPairingCode(
        code=secrets.token_urlsafe(CODE_BYTES),
        user_id=user_id,
        expires_at=now + CODE_TTL,
    )
    session.add(code)
    await session.commit()
    return code


async def redeem(session: AsyncSession, code: str, *, now: datetime) -> str:
    """Spend a pairing code and mint the token the notebook keeps.

    The code is the credential, so the checks are on the code itself — that it
    exists, has not been spent, and has not aged out. The row is locked for the
    length of that, so two notebooks redeeming the same code at the same moment
    mint one token: the loser skips the locked row and is told the code is not
    one of ours.

    The raw token is returned here and nowhere else; only its hash is stored.
    """
    row = await session.scalar(
        select(LabPairingCode)
        .where(LabPairingCode.code == code)
        .with_for_update(skip_locked=True)
    )
    if row is None:
        raise PairingRejected("that code is not one of ours")
    if row.used_at is not None:
        raise PairingRejected("that code has already been used")
    if row.expires_at <= now:
        raise PairingRejected("that code has expired")
    row.used_at = now
    token = secrets.token_urlsafe(TOKEN_BYTES)
    session.add(LabToken(token_hash=token_hash(token), user_id=row.user_id))
    await session.commit()
    return token


async def authenticate(
    session: AsyncSession, token: str, *, now: datetime
) -> User | None:
    row = await session.scalar(
        select(LabToken)
        .options(joinedload(LabToken.user))
        .where(
            LabToken.token_hash == token_hash(token),
            LabToken.revoked_at.is_(None),
        )
    )
    if row is None:
        return None
    if row.last_used_at is None or now - row.last_used_at >= USE_INTERVAL:
        row.last_used_at = now
        await session.commit()
    return row.user


async def prune(session: AsyncSession, now: datetime) -> None:
    """Codes nothing will read again. Uncommitted: this is one sweep of the
    poller's housekeeping pass, which commits them together."""
    await session.execute(delete(LabPairingCode).where(LabPairingCode.expires_at < now))
