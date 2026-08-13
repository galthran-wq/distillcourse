"""What happens when two submissions of one lab land at the same moment."""

import asyncio
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker

from app import crud
from app.core.db import engine
from app.labs import repository
from app.labs.schemas import Submission
from app.models import Document, LabChallenge, User
from app.telemetry import progress
from tests.labs.conftest import (
    DIGEST,
    LESSON,
    PASSING,
    SURPRISAL,
    completions,
    rows,
    submission,
)

NOW = datetime.now(UTC)
# Long enough for the waiting submission to have reached the lock it will not
# get: the wait below is a fact about the lock, not about this machine's speed.
HELD_SECONDS = 0.5


@pytest.fixture
async def racer() -> AsyncGenerator[User]:
    """A learner and a lab two connections can both see, which means outside
    the suite's single rolled-back transaction: the subject below is what two
    submissions landing at once do, and one connection cannot race itself."""
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        user = await crud.create_user(
            session, email="racer@test", password="secret", timezone="UTC"
        )
        session.add_all(rows())
        await session.commit()
        yield user
        await session.execute(delete(User).where(User.id == user.id))
        await session.execute(delete(Document).where(Document.locator == LESSON))
        await session.execute(delete(LabChallenge).where(LabChallenge.lesson == LESSON))
        await session.commit()


async def test_the_last_two_checkpoints_landing_at_once_finish_the_lesson_once(
    racer: User,
) -> None:
    """The two submissions that finish a lab arrive together, on two connections.

    The contention is staged rather than raced: submissions fired at once
    interleave wherever the event loop happens to put them, which is not a gate.
    Here one connection holds the lesson exactly as an in-flight submission
    does, and the second must wait for it — different checkpoints, so nothing
    else serialises them, and without that lock each would count the other's
    pass as not yet made and the lab would finish nowhere.
    """
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        await repository.submit(
            session,
            racer.id,
            Submission(**submission("surprisal", SURPRISAL)),
            now=NOW,
        )

    async with factory() as inflight, factory() as latecomer:
        await progress.lock(inflight, racer.id, LESSON)
        second = asyncio.create_task(
            repository.submit(
                latecomer,
                racer.id,
                Submission(**submission("beat-baseline", PASSING)),
                now=NOW,
            )
        )
        await asyncio.sleep(HELD_SECONDS)
        assert not second.done()

        await repository.submit(
            inflight,
            racer.id,
            Submission(**submission("entropy-terms", {"digest": DIGEST})),
            now=NOW,
        )
        finished = await second

    assert finished.progress.passed_required == 3
    async with factory() as session:
        assert await completions(session, racer) == 1
