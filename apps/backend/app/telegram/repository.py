import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TgLink, TgPairingCode, TgUpdateSeen

# Short enough to be spent in one sitting: whoever holds the string can attach
# their Telegram account to the learner it was issued for.
CODE_TTL = timedelta(minutes=10)
# Telegram's `/start` payload admits [A-Za-z0-9_-] only, which is exactly what
# token_urlsafe produces.
CODE_BYTES = 16
# Long enough to outlast any redelivery Telegram will attempt, short enough
# that the table stays small.
UPDATE_RETENTION = timedelta(days=7)


class PairingRejected(Exception):
    """Why a `/start <code>` did not pair, in words the learner is told."""


async def issue_code(
    session: AsyncSession, user_id: uuid.UUID, *, now: datetime
) -> TgPairingCode:
    code = TgPairingCode(
        code=secrets.token_urlsafe(CODE_BYTES),
        user_id=user_id,
        expires_at=now + CODE_TTL,
    )
    session.add(code)
    await session.commit()
    return code


async def redeem(
    session: AsyncSession, code: str, *, tg_chat_id: int, now: datetime
) -> TgLink:
    """Spend a pairing code and attach this Telegram chat to its owner.

    The code is the credential, so the checks are on the code itself — that it
    exists, has not been spent, and has not aged out. A Telegram account that
    already belongs to another learner is refused before the code is spent: a
    phone is one person, and the row would violate the unique chat id anyway.
    """
    row = await session.scalar(
        select(TgPairingCode)
        .where(TgPairingCode.code == code)
        .with_for_update(skip_locked=True)
    )
    if row is None:
        raise PairingRejected("that code is not one of ours")
    if row.used_at is not None:
        raise PairingRejected("that code has already been used")
    if row.expires_at <= now:
        raise PairingRejected("that code has expired")
    taken = await link_for_chat(session, tg_chat_id)
    if taken is not None and taken.user_id != row.user_id:
        raise PairingRejected("this telegram account is already paired to an account")
    row.used_at = now
    link = await session.get(TgLink, row.user_id)
    if link is None:
        link = TgLink(user_id=row.user_id, tg_chat_id=tg_chat_id, status="active")
        session.add(link)
    else:
        link.tg_chat_id = tg_chat_id
        link.status = "active"
    await session.commit()
    return link


async def link_for_user(session: AsyncSession, user_id: uuid.UUID) -> TgLink | None:
    return await session.get(TgLink, user_id)


async def link_for_chat(session: AsyncSession, tg_chat_id: int) -> TgLink | None:
    link: TgLink | None = await session.scalar(
        select(TgLink).where(TgLink.tg_chat_id == tg_chat_id)
    )
    return link


async def set_status(session: AsyncSession, link: TgLink, status: str) -> None:
    link.status = status
    await session.commit()


async def unlink(session: AsyncSession, user_id: uuid.UUID) -> None:
    """Disconnect the channel. The thread itself stays: a learner who pairs
    again is in the same conversation they left."""
    await session.execute(delete(TgLink).where(TgLink.user_id == user_id))
    await session.execute(delete(TgPairingCode).where(TgPairingCode.user_id == user_id))
    await session.commit()


async def first_sighting(session: AsyncSession, update_id: int) -> bool:
    """Record an update id, and say whether this process is the first to see it.

    The unique index is the arbiter rather than a prior SELECT: Telegram
    redelivers while the first run is still going, so two requests can be
    holding the same update at the same moment.
    """
    seen = await session.scalar(
        insert(TgUpdateSeen)
        .values(update_id=update_id)
        .on_conflict_do_nothing()
        .returning(TgUpdateSeen.update_id)
    )
    await session.commit()
    return seen is not None


async def prune(session: AsyncSession, now: datetime) -> None:
    """Rows nothing will read again. Uncommitted: this is one sweep of the
    poller's housekeeping pass, which commits them together."""
    await session.execute(delete(TgPairingCode).where(TgPairingCode.expires_at < now))
    await session.execute(
        delete(TgUpdateSeen).where(TgUpdateSeen.received_at < now - UPDATE_RETENTION)
    )
