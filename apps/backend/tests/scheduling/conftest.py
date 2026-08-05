from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime

import pytest
from pydantic_ai.models.test import TestModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.models import Chat, User

# Midday on the learner's clock (the fixture user is on UTC), taken from today
# so that rows the database timestamps itself sit on the same day.
NOON = datetime.now(UTC).replace(hour=12, minute=0, second=0, microsecond=0)


@contextmanager
def replying(text: str = "entropy is what you owe me") -> Iterator[None]:
    # No tools: what a proactive run does with the tool catalogue is the
    # subject of test_tools, and TestModel would otherwise call all of them.
    with tutor.override(model=TestModel(custom_output_text=text), tools=[]):
        yield


@pytest.fixture
async def thread(session: AsyncSession, user: User) -> Chat:
    """The eternal Telegram thread a paired learner has."""
    return await HarnessRepository(session, user.id).create_chat(kind="telegram")
