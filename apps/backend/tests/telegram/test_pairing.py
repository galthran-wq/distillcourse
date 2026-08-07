from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Chat, TgLink, TgPairingCode, User
from app.telegram import repository

NOW = datetime.now(UTC)


async def code_for(session: AsyncSession, user: User) -> str:
    return (await repository.issue_code(session, user.id, now=NOW)).code


async def test_a_code_connects_the_chat_to_its_owner(
    session: AsyncSession, user: User
) -> None:
    link = await repository.redeem(
        session, await code_for(session, user), tg_chat_id=77, now=NOW
    )

    assert (link.user_id, link.tg_chat_id, link.status) == (user.id, 77, "active")
    spent = await session.scalar(select(TgPairingCode))
    assert spent is not None and spent.used_at is not None


async def test_a_code_is_good_once(session: AsyncSession, user: User) -> None:
    code = await code_for(session, user)
    await repository.redeem(session, code, tg_chat_id=77, now=NOW)

    with pytest.raises(repository.PairingRejected, match="already been used"):
        await repository.redeem(session, code, tg_chat_id=78, now=NOW)


async def test_an_expired_code_is_refused(session: AsyncSession, user: User) -> None:
    code = await code_for(session, user)

    with pytest.raises(repository.PairingRejected, match="expired"):
        await repository.redeem(
            session,
            code,
            tg_chat_id=77,
            now=NOW + repository.CODE_TTL + timedelta(minutes=1),
        )


async def test_a_code_nobody_issued_is_refused(session: AsyncSession) -> None:
    with pytest.raises(repository.PairingRejected, match="not one of ours"):
        await repository.redeem(session, "made-up", tg_chat_id=77, now=NOW)


async def test_a_telegram_account_belongs_to_one_learner(
    session: AsyncSession, other_user: User, link: TgLink
) -> None:
    """The stranger's own code, redeemed from a phone that is already the first
    learner's: one Telegram account cannot answer for two accounts."""
    with pytest.raises(repository.PairingRejected, match="already paired"):
        await repository.redeem(
            session,
            await code_for(session, other_user),
            tg_chat_id=link.tg_chat_id,
            now=NOW,
        )
    unspent = await session.scalar(select(TgPairingCode))
    assert unspent is not None and unspent.used_at is None


async def test_pairing_again_moves_the_channel_and_repairs_it(
    session: AsyncSession, user: User, link: TgLink
) -> None:
    link.status = "broken"
    await session.commit()

    repaired = await repository.redeem(
        session, await code_for(session, user), tg_chat_id=99, now=NOW
    )

    assert (repaired.tg_chat_id, repaired.status) == (99, "active")
    assert len((await session.scalars(select(TgLink))).all()) == 1


@pytest.mark.usefixtures("link")
async def test_unpairing_disconnects_the_channel_and_keeps_the_thread(
    session: AsyncSession, user: User
) -> None:
    """The conversation is not the connection: a learner who pairs again is in
    the thread they left."""
    session.add(Chat(user_id=user.id, kind="telegram", model="m"))
    await code_for(session, user)
    await session.commit()

    await repository.unlink(session, user.id)

    assert await repository.link_for_user(session, user.id) is None
    assert await session.scalar(select(TgPairingCode)) is None
    assert await session.scalar(select(Chat)) is not None


async def test_an_update_id_is_taken_once(session: AsyncSession) -> None:
    assert await repository.first_sighting(session, 1234) is True
    assert await repository.first_sighting(session, 1234) is False
