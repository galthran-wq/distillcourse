from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core import rate_limit
from app.core.config import settings
from app.core.db import engine
from app.main import app

BACKEND_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(autouse=True)
def empty_rate_limit_window() -> None:
    # The limiter counts per address, and every test calls from the same one.
    rate_limit.reset()


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> Generator[None]:
    # The teardown drops every table this project owns, so refuse to point the
    # suite at anything that could be a development or production database.
    if not settings.POSTGRES_DB.endswith("_test"):
        pytest.exit(f"refusing to run against POSTGRES_DB={settings.POSTGRES_DB}")
    config = Config(BACKEND_ROOT / "alembic.ini")
    command.upgrade(config, "head")
    yield
    command.downgrade(config, "base")


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession]:
    # Each test runs inside an outer transaction that is rolled back, so
    # committed writes never leak into the next test. create_savepoint keeps a
    # rollback inside the request (a duplicate signup, say) from taking that
    # outer transaction down with it.
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(
            bind=connection,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        ) as session:
            yield session
        await transaction.rollback()


@pytest.fixture
def app_on_test_session(session: AsyncSession) -> Generator[FastAPI]:
    app.dependency_overrides[get_session] = lambda: session
    yield app
    app.dependency_overrides.clear()


def browser(app: FastAPI) -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def client(app_on_test_session: FastAPI) -> AsyncGenerator[AsyncClient]:
    async with browser(app_on_test_session) as client:
        yield client


@pytest.fixture
async def other_client(app_on_test_session: FastAPI) -> AsyncGenerator[AsyncClient]:
    # A second browser with its own cookie jar: the two clients hold two
    # independent sessions of the same user.
    async with browser(app_on_test_session) as client:
        yield client
