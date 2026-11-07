"""`report_review_outcome` itself: what it accepts, and whose it accepts it for."""

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.harness import runner
from app.harness.agent import tutor
from app.harness.repository import HarnessRepository
from app.memory import repository as memory
from app.models import CardDelivery, Chat, User
from app.review import ladder
from app.review import repository as review
from tests.harness.conftest import calling
from tests.review.conftest import LESSON, stored_card
from tests.review.conftest import ladder as ladder_row

pytestmark = pytest.mark.usefixtures("indexed_section")


async def reported(
    session: AsyncSession, user: User, chat: Chat, **arguments: object
) -> str:
    repo = HarnessRepository(session, user.id)
    with tutor.override(model=calling("report_review_outcome", **arguments)):
        return await runner.run(repo, chat, "how did that go?")


async def sent_to(session: AsyncSession, user: User) -> CardDelivery:
    card = await stored_card(session)
    row = CardDelivery(
        user_id=user.id, card_id=card.id, tg_message_id=1, sent_at=datetime.now(UTC)
    )
    session.add(row)
    await session.commit()
    return row


async def test_the_last_rung_passed_ends_the_ladder(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """Nothing further is scheduled and the row stays: it is the history, and
    it is what stops the ladder being started over."""
    state = await ladder_row(session, user, step=len(ladder.STEPS) - 1)
    sent = await sent_to(session, user)

    answer = await reported(
        session, user, thread, delivery_id=str(sent.id), outcome="passed"
    )

    await session.refresh(state)
    assert state.next_due_at is None
    assert ladder.finished(state.step)
    assert "finished" in answer


async def test_one_card_moves_the_ladder_once(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """A tap and a written answer, or an answer split across two messages, can
    both reach the same card. A second grade would skip a rung the learner
    never sat on."""
    state = await ladder_row(session, user, step=1)
    sent = await sent_to(session, user)

    await reported(session, user, thread, delivery_id=str(sent.id), outcome="passed")
    again = await reported(
        session, user, thread, delivery_id=str(sent.id), outcome="passed"
    )

    await session.refresh(state)
    assert state.step == 2
    assert "already graded as passed" in again


async def test_a_card_ignored_for_a_day_can_still_be_answered(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    """Ignoring is our bookkeeping, not their answer: one that arrives late is
    an answer."""
    state = await ladder_row(session, user, step=1)
    sent = await sent_to(session, user)
    sent.outcome = "ignored"
    await session.commit()

    await reported(session, user, thread, delivery_id=str(sent.id), outcome="failed")

    await session.refresh(state)
    assert (state.step, state.last_outcome) == (0, "failed")


async def test_a_card_of_someone_elses_cannot_be_graded(
    session: AsyncSession, user: User, other_user: User, thread: Chat
) -> None:
    """The id is the model's to quote, and a wrong one must reach nothing: a
    tool is handed a repository scoped to one learner and can see no further."""
    stranger = await ladder_row(session, other_user)
    sent = await sent_to(session, other_user)

    answer = await reported(
        session, user, thread, delivery_id=str(sent.id), outcome="failed"
    )

    await session.refresh(stranger)
    await session.refresh(sent)
    assert "no card of this learner's" in answer
    assert (stranger.step, stranger.last_outcome, sent.outcome) == (0, None, None)


async def test_an_id_that_names_nothing_is_answered_plainly(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    answer = await reported(
        session, user, thread, delivery_id=str(uuid.uuid4()), outcome="passed"
    )

    assert "no card of this learner's" in answer


async def test_a_ladder_that_was_deleted_under_the_card_is_not_invented(
    session: AsyncSession, user: User, thread: Chat
) -> None:
    sent = await sent_to(session, user)

    answer = await reported(
        session, user, thread, delivery_id=str(sent.id), outcome="passed"
    )

    assert LESSON in answer
    assert await review.state_of(session, user.id, LESSON) is None


async def test_a_note_the_write_cap_refuses_does_not_take_the_grade_with_it(
    monkeypatch: pytest.MonkeyPatch, session: AsyncSession, user: User, thread: Chat
) -> None:
    """The outcome is what the call is for. A run that has spent its memory
    allowance loses the note and says so, and the ladder still moves."""
    monkeypatch.setattr(settings, "MEMORY_WRITES_PER_RUN", 0)
    state = await ladder_row(session, user)
    sent = await sent_to(session, user)

    answer = await reported(
        session,
        user,
        thread,
        delivery_id=str(sent.id),
        outcome="partial",
        notes="states entropy in nats and calls them bits",
    )

    await session.refresh(state)
    assert await memory.index(session, user.id) == []
    assert state.last_outcome == "partial"
    assert "not kept" in answer
