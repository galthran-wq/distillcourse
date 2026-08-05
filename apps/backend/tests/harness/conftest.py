import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.repository import HarnessRepository
from app.models import Chat, User


@pytest.fixture
def repo(session: AsyncSession, user: User) -> HarnessRepository:
    return HarnessRepository(session, user.id)


@pytest.fixture
def other_repo(session: AsyncSession, other_user: User) -> HarnessRepository:
    return HarnessRepository(session, other_user.id)


@pytest.fixture
async def chat(repo: HarnessRepository) -> Chat:
    return await repo.create_chat(kind="web")
