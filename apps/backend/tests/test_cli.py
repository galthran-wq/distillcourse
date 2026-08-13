import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli, crud
from app.labs import repository as labs
from app.models import Event, LabToken, LessonProgress, UserSession
from tests.utils.utils import random_email, random_password, user_session


async def test_reset_password_replaces_the_password_and_revokes_every_credential(
    session: AsyncSession,
) -> None:
    email = random_email()
    user = await crud.create_user(
        session, email=email, password=random_password(), timezone="UTC"
    )
    session.add(user_session(user))
    await session.commit()
    now = datetime.now(UTC)
    code = await labs.issue_code(session, user.id, now=now)
    await labs.redeem(session, code.code, now=now)

    await cli.reset_password(session, email, "a-new-password")

    assert await crud.authenticate(session, email=email, password="a-new-password")
    assert (await session.scalars(select(UserSession))).all() == []
    # The paired notebook is a credential for the account too, and the reset
    # exists because control of the account is in doubt.
    token = await session.scalar(select(LabToken).where(LabToken.user_id == user.id))
    assert token is not None and token.revoked_at is not None


async def test_a_deactivated_account_cannot_sign_in_and_keeps_what_it_wrote(
    session: AsyncSession,
) -> None:
    email = random_email()
    user = await crud.create_user(
        session, email=email, password="a-known-password", timezone="UTC"
    )
    session.add(user_session(user))
    await session.commit()
    now = datetime.now(UTC)
    code = await labs.issue_code(session, user.id, now=now)
    await labs.redeem(session, code.code, now=now)

    await cli.set_active(session, email, False)

    assert user.is_active is False
    # The live cookie goes with it: deactivating an account whose browser stays
    # signed in would be no deactivation at all.
    assert (await session.scalars(select(UserSession))).all() == []
    assert await crud.get_user_by_email(session, email) is not None

    await cli.set_active(session, email, True)
    assert user.is_active is True
    # Reopening the account does not reopen the credentials it was closed over:
    # the browser signs in again, and so does the notebook.
    token = await session.scalar(select(LabToken).where(LabToken.user_id == user.id))
    assert token is not None and token.revoked_at is not None


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


async def test_rebuild_progress_recomputes_the_aggregate_from_the_events(
    session: AsyncSession,
) -> None:
    lesson = "lesson:information-theory/entropy"
    user = await crud.create_user(
        session, email=random_email(), password=random_password(), timezone="UTC"
    )
    session.add(
        Event(
            id=uuid.uuid4(),
            user_id=user.id,
            lesson=lesson,
            type="heartbeat",
            payload={"seconds": 10},
            client_ts=datetime.now(UTC),
        )
    )
    await session.commit()

    await cli.rebuild_progress(session)

    aggregate = await session.get(LessonProgress, (user.id, lesson))
    assert aggregate is not None
    assert aggregate.active_seconds == 10


async def test_reset_password_reports_an_unknown_email(session: AsyncSession) -> None:
    with pytest.raises(SystemExit):
        await cli.reset_password(session, random_email(), "a-new-password")


async def test_delete_user_reports_an_unknown_email(session: AsyncSession) -> None:
    with pytest.raises(SystemExit):
        await cli.delete_user(session, random_email())
