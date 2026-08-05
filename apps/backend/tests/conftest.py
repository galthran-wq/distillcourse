from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, async_sessionmaker

from app import crud
from app.api.deps import get_session, get_session_factory
from app.core import rate_limit
from app.core.config import settings
from app.core.db import engine
from app.main import app
from app.models import User

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


@pytest.fixture(scope="session", autouse=True)
def openrouter_key() -> None:
    # Models are constructed even in tests that never reach the network; every
    # run is served by an overridden test model.
    settings.OPENROUTER_API_KEY = "not-a-real-key"


@pytest.fixture
async def connection() -> AsyncGenerator[AsyncConnection]:
    # Each test runs inside an outer transaction that is rolled back, so
    # committed writes never leak into the next test.
    async with engine.connect() as connection:
        transaction = await connection.begin()
        yield connection
        await transaction.rollback()


@pytest.fixture
async def session(connection: AsyncConnection) -> AsyncGenerator[AsyncSession]:
    # create_savepoint keeps a rollback inside the request (a duplicate signup,
    # say) from taking the test's outer transaction down with it.
    async with AsyncSession(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    ) as session:
        yield session


@pytest.fixture
def session_factory(
    connection: AsyncConnection,
) -> async_sessionmaker[AsyncSession]:
    # Sessions the app opens for work that outlives a request join the test's
    # transaction, so their commits are rolled back with everything else.
    return async_sessionmaker(bind=connection, expire_on_commit=False)


@pytest.fixture
async def user(session: AsyncSession) -> User:
    return await crud.create_user(session, email="learner@test", password="secret")


@pytest.fixture
async def other_user(session: AsyncSession) -> User:
    return await crud.create_user(session, email="stranger@test", password="secret")


@pytest.fixture
def app_on_test_session(
    session: AsyncSession, session_factory: async_sessionmaker[AsyncSession]
) -> Generator[FastAPI]:
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[get_session_factory] = lambda: session_factory
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
