from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.config import settings
from app.core.db import engine
from app.main import app

BACKEND_ROOT = Path(__file__).resolve().parent.parent


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
    # committed writes never leak into the next test.
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(bind=connection, expire_on_commit=False) as session:
            yield session
        await transaction.rollback()


@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    app.dependency_overrides[get_session] = lambda: session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
