from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.repository import HarnessRepository
from app.models import Chat, TgLink

# Midday on the learner's clock (the fixture user is on UTC), taken from today
# so that rows the database timestamps itself sit on the same day.
NOON = datetime.now(UTC).replace(hour=12, minute=0, second=0, microsecond=0)


@pytest.fixture
async def thread(session: AsyncSession, link: TgLink) -> Chat:
    """A paired learner: the connected channel and the eternal thread behind it."""
    return await HarnessRepository(session, link.user_id).create_chat(kind="telegram")
