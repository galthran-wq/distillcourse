import asyncio
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app import crud
from app.core.db import engine
from app.core.sessions import token_hash
from app.labs import repository
from app.models import LabPairingCode, LabToken, User

NOW = datetime.now(UTC)


async def code_for(session: AsyncSession, user: User) -> str:
    return (await repository.issue_code(session, user.id, now=NOW)).code


async def test_a_code_becomes_a_token_that_is_only_stored_hashed(
    session: AsyncSession, user: User
) -> None:
    token = await repository.redeem(session, await code_for(session, user), now=NOW)

    row = await session.scalar(select(LabToken))
    assert row is not None
    assert (row.user_id, row.token_hash) == (user.id, token_hash(token))
    spent = await session.scalar(select(LabPairingCode))
    assert spent is not None and spent.used_at == NOW


async def test_a_code_is_good_once(session: AsyncSession, user: User) -> None:
    code = await code_for(session, user)
    await repository.redeem(session, code, now=NOW)

    with pytest.raises(repository.PairingRejected, match="already been used"):
        await repository.redeem(session, code, now=NOW)


async def test_an_expired_code_is_refused(session: AsyncSession, user: User) -> None:
    code = await code_for(session, user)

    with pytest.raises(repository.PairingRejected, match="expired"):
        await repository.redeem(
            session, code, now=NOW + repository.CODE_TTL + timedelta(minutes=1)
        )
    assert await session.scalar(select(LabToken)) is None


async def test_a_code_nobody_issued_is_refused(session: AsyncSession) -> None:
    with pytest.raises(repository.PairingRejected, match="not one of ours"):
        await repository.redeem(session, "made-up", now=NOW)


async def test_one_token_answers_for_every_lab(
    session: AsyncSession, user: User
) -> None:
    """Pairing twice is a second token, not a replacement: a learner can have a
    notebook open on two machines."""
    first = await repository.redeem(session, await code_for(session, user), now=NOW)
    second = await repository.redeem(session, await code_for(session, user), now=NOW)

    assert first != second
    for token in (first, second):
        assert await repository.authenticate(session, token, now=NOW) == user


async def test_the_codes_nothing_will_read_are_pruned(
    session: AsyncSession, user: User
) -> None:
    await repository.issue_code(session, user.id, now=NOW - 2 * repository.CODE_TTL)
    fresh = await code_for(session, user)

    await repository.prune(session, NOW)

    assert [row.code for row in await session.scalars(select(LabPairingCode))] == [
        fresh
    ]


async def test_a_deleted_learner_takes_their_codes_and_tokens_with_them(
    session: AsyncSession, user: User
) -> None:
    await repository.redeem(session, await code_for(session, user), now=NOW)
    await code_for(session, user)

    await session.execute(delete(User).where(User.id == user.id))
    await session.commit()

    assert await session.scalar(select(LabPairingCode)) is None
    assert await session.scalar(select(LabToken)) is None


@pytest.fixture
async def committed_code() -> AsyncGenerator[str]:
    """A code two connections can both see, which means outside the suite's
    single rolled-back transaction — the row lock is the subject of the test
    below, and one connection cannot contend with itself."""
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        user = await crud.create_user(
            session, email="racer@test", password="secret", timezone="UTC"
        )
        await session.commit()
        code = await repository.issue_code(session, user.id, now=NOW)
        yield code.code
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()


async def test_a_code_another_redeem_is_holding_mints_nothing(
    committed_code: str,
) -> None:
    """The contention is staged rather than raced: two `redeem` calls fired at
    once interleave wherever the event loop happens to put them, which is not a
    gate. Here one connection holds the code's row exactly as an in-flight
    redeem does, and the second must be turned away — `skip_locked` — instead of
    waiting out the lock and then minting a second token for a spent code.
    """
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as inflight, factory() as latecomer:
        await inflight.execute(
            select(LabPairingCode)
            .where(LabPairingCode.code == committed_code)
            .with_for_update()
        )
        with pytest.raises(repository.PairingRejected):
            # The timeout is the failure, not a slow test: without `skip_locked`
            # this blocks on the held row until the holder lets go.
            await asyncio.wait_for(
                repository.redeem(latecomer, committed_code, now=NOW), timeout=5
            )
        await inflight.rollback()

    async with factory() as session:
        assert (await session.scalars(select(LabToken))).all() == []
        # Refused for being held, not for being unknown: with the holder gone
        # the same code is still good, so the assertion above cannot pass on a
        # code that was never there.
        assert await repository.redeem(session, committed_code, now=NOW)
