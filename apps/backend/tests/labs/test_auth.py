from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.labs import repository
from app.labs.deps import LabUser
from app.models import LabToken, User
from tests.conftest import browser

NOW = datetime.now(UTC)
CHECKPOINT = "/checkpoint"


@pytest.fixture
async def notebook(session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """A client speaking to one route that asks for `LabUser` and nothing else.

    The checkpoint routes that will carry it do not exist yet; what is under
    test is the dependency, and it needs a route to be solved in.
    """
    app = FastAPI()
    app.dependency_overrides[get_session] = lambda: session

    @app.get(CHECKPOINT)
    async def whoami(user: LabUser) -> str:
        return user.email

    async with browser(app) as client:
        yield client


async def token_for(session: AsyncSession, user: User) -> str:
    code = await repository.issue_code(session, user.id, now=NOW)
    return await repository.redeem(session, code.code, now=NOW)


async def test_a_paired_notebook_is_its_learner(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    token = await token_for(session, user)

    answered = await notebook.get(
        CHECKPOINT, headers={"authorization": f"Bearer {token}"}
    )

    assert answered.status_code == 200
    assert answered.json() == user.email


async def test_a_call_with_no_token_is_refused(notebook: AsyncClient) -> None:
    assert (await notebook.get(CHECKPOINT)).status_code == 401
    assert (
        await notebook.get(CHECKPOINT, headers={"authorization": "Bearer "})
    ).status_code == 401


async def test_a_token_nobody_minted_is_refused(notebook: AsyncClient) -> None:
    refused = await notebook.get(
        CHECKPOINT, headers={"authorization": "Bearer made-up"}
    )

    assert refused.status_code == 401


async def test_a_revoked_token_stops_working(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    token = await token_for(session, user)
    row = await session.scalar(select(LabToken))
    assert row is not None
    row.revoked_at = NOW
    await session.commit()

    refused = await notebook.get(
        CHECKPOINT, headers={"authorization": f"Bearer {token}"}
    )

    assert refused.status_code == 401


async def test_a_deactivated_learner_stops_working(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    token = await token_for(session, user)
    user.is_active = False
    await session.commit()

    refused = await notebook.get(
        CHECKPOINT, headers={"authorization": f"Bearer {token}"}
    )

    assert refused.status_code == 401


async def test_use_is_stamped_once_a_day(
    notebook: AsyncClient, session: AsyncSession, user: User
) -> None:
    """A lab posts a checkpoint every few minutes; only the first of them costs
    an UPDATE."""
    token = await token_for(session, user)
    header = {"authorization": f"Bearer {token}"}

    await notebook.get(CHECKPOINT, headers=header)
    row = await session.scalar(select(LabToken))
    assert row is not None and row.last_used_at is not None
    stamped = row.last_used_at

    await notebook.get(CHECKPOINT, headers=header)
    await session.refresh(row)
    assert row.last_used_at == stamped

    row.last_used_at = stamped - repository.USE_INTERVAL - timedelta(minutes=1)
    await session.commit()
    await notebook.get(CHECKPOINT, headers=header)
    await session.refresh(row)
    assert row.last_used_at > stamped
