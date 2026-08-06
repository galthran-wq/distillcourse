"""`report_review_outcome` itself: what it accepts, and whose it accepts it for."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository as memory
from app.models import Chat, TgLink, User
from app.review import ladder
from app.review import repository as review
from tests.harness.conftest import calling
from tests.review.conftest import LESSON
from tests.review.conftest import ladder as ladder_row
from tests.scheduling.conftest import NOON


async def reported(
    session: AsyncSession, user: User, chat: Chat, **arguments: object
) -> str:
    repo = HarnessRepository(session, user.id)
    with tutor.override(model=calling("report_review_outcome", **arguments)):
        return await runner.run(repo, chat, "how did that go?")


@pytest.mark.usefixtures("link")
async def test_the_last_rung_passed_ends_the_ladder(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """Nothing further is scheduled and the row stays: it is the history, and
    it is what stops the ladder being started over."""
    state = await ladder_row(session, user, step=len(ladder.STEPS) - 1)
    row = (await review.materialize(session, NOON))[0]

    answer = await reported(
        session, user, thread, schedule_id=str(row.id), outcome="passed"
    )

    await session.refresh(state)
    assert state.next_due_at is None
    assert ladder.finished(state.step)
    assert "finished" in answer


@pytest.mark.usefixtures("link")
async def test_one_delivery_moves_the_ladder_once(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """Two runs can hold the same item: an answer split across two messages
    hands the second one a context block assembled before the first graded it.
    A second grade would skip a rung the learner never sat on."""
    state = await ladder_row(session, user, step=1)
    row = (await review.materialize(session, NOON))[0]

    await reported(session, user, thread, schedule_id=str(row.id), outcome="passed")
    again = await reported(
        session, user, thread, schedule_id=str(row.id), outcome="passed"
    )

    await session.refresh(state)
    assert state.step == 2
    assert "already recorded as passed" in again


async def test_a_review_of_someone_elses_cannot_be_graded(
    session: AsyncSession, user: User, other_user: User, thread: Chat
) -> None:
    """The id is the model's to quote, and a wrong one must reach nothing: a
    tool is handed a repository scoped to one learner and can see no further."""
    session.add(TgLink(user_id=other_user.id, tg_chat_id=777))
    stranger = await ladder_row(session, other_user)
    row = (await review.materialize(session, NOON))[0]

    answer = await reported(
        session, user, thread, schedule_id=str(row.id), outcome="failed"
    )

    await session.refresh(stranger)
    assert "no review of this learner's" in answer
    assert (stranger.step, stranger.last_outcome) == (0, None)


async def test_an_id_that_names_nothing_is_answered_plainly(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    answer = await reported(
        session, user, thread, schedule_id=str(uuid.uuid4()), outcome="passed"
    )

    assert "no review of this learner's" in answer


@pytest.mark.usefixtures("link")
async def test_a_ladder_that_was_deleted_under_the_delivery_is_not_invented(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    await ladder_row(session, user)
    row = (await review.materialize(session, NOON))[0]
    state = await review.state_of(session, user.id, LESSON)
    assert state is not None
    await session.delete(state)
    await session.commit()

    answer = await reported(
        session, user, thread, schedule_id=str(row.id), outcome="passed"
    )

    assert LESSON in answer
    assert await review.state_of(session, user.id, LESSON) is None


@pytest.mark.usefixtures("link")
async def test_a_note_the_write_cap_refuses_does_not_take_the_grade_with_it(
    monkeypatch: pytest.MonkeyPatch, session: AsyncSession, user: User, thread: Chat
) -> None:
    """The outcome is what the call is for. A run that has spent its memory
    allowance loses the note and says so, and the ladder still moves."""
    monkeypatch.setattr(settings, "MEMORY_WRITES_PER_RUN", 0)
    state = await ladder_row(session, user)
    row = (await review.materialize(session, NOON))[0]

    answer = await reported(
        session,
        user,
        thread,
        schedule_id=str(row.id),
        outcome="partial",
        notes="states entropy in nats and calls them bits",
    )

    await session.refresh(state)
    assert await memory.index(session, user.id) == []
    assert state.last_outcome == "partial"
    assert "not kept" in answer
