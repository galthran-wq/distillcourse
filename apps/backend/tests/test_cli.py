import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli, crud
from app.models import UserSession
from tests.utils.utils import random_email, random_password, user_session


async def test_reset_password_replaces_the_password_and_revokes_sessions(
    session: AsyncSession,
) -> None:
    email = random_email()
    user = await crud.create_user(
        session, email=email, password=random_password(), timezone="UTC"
    )
    session.add(user_session(user))
    await session.commit()

    await cli.reset_password(session, email, "a-new-password")

    assert await crud.authenticate(session, email=email, password="a-new-password")
    assert (await session.scalars(select(UserSession))).all() == []


async def test_delete_user_takes_the_sessions_with_it(session: AsyncSession) -> None:
    email = random_email()
    user = await crud.create_user(
        session, email=email, password=random_password(), timezone="UTC"
    )
    session.add(user_session(user))
    await session.commit()

    await cli.delete_user(session, email)

    assert await crud.get_user_by_email(session, email) is None
    assert (await session.scalars(select(UserSession))).all() == []


async def test_reset_password_reports_an_unknown_email(session: AsyncSession) -> None:
    with pytest.raises(SystemExit):
        await cli.reset_password(session, random_email(), "a-new-password")


async def test_delete_user_reports_an_unknown_email(session: AsyncSession) -> None:
    with pytest.raises(SystemExit):
        await cli.delete_user(session, random_email())
