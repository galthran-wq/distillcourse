"""A review as the learner meets it: a question out of the blue, an answer,
and what that answer does to the schedule."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.harness.agent import tutor
from app.memory import repository as memory
from app.models import ReviewState, User
from app.review import ladder, subject
from app.review import repository as review
from app.scheduling import policy, worker
from tests.conftest import Bot, replying
from tests.harness.conftest import echoing
from tests.review.conftest import (
    LESSON,
    echoed,
    grading,
    reviews,
)
from tests.review.conftest import (
    ladder as ladder_row,
)
from tests.scheduling.conftest import NOON
from tests.telegram.conftest import deliver, message
from tests.telemetry.conftest import (
    HEARTBEATS_TO_COMPLETE,
    aggregate,
    read,
)
from tests.telemetry.conftest import (
    LESSON as READ_LESSON,
)

# The tool stamps the ladder from the real clock, which no test can predict to
# the second.
SLACK = timedelta(minutes=2)

pytestmark = pytest.mark.usefixtures("thread")


def about(moment: datetime | None, expected: datetime) -> bool:
    return moment is not None and abs(moment - expected) < SLACK


async def state_of(session: AsyncSession, user: User, lesson: str) -> ReviewState:
    state = await review.state_of(session, user.id, lesson)
    assert state is not None
    await session.refresh(state)
    return state


async def ask(session: AsyncSession, at: datetime = NOON) -> None:
    """One poller cycle with a tutor that asks whatever it is told to ask."""
    with replying("what does entropy measure, in bits?"):
        await worker.cycle(session, at)


async def sent_an_hour_ago(session: AsyncSession, user: User) -> None:
    """Move the open slot onto the server's own clock.

    `NOON` is a time of day and the suite runs at whatever hour it runs; a
    reply is recognised by the timestamp Postgres writes on the message, so a
    slot claimed "at noon" is one a reply cannot fall after.
    """
    for row in await reviews(session, user):
        row.claimed_at = datetime.now(UTC) - timedelta(hours=1)
    await session.commit()


@pytest.mark.usefixtures("indexed_lesson")
async def test_a_finished_lesson_comes_back_as_a_question_and_a_right_answer_moves_it_on(
    signed_in: AsyncClient,
    session: AsyncSession,
    user: User,
    bot: Bot,
) -> None:
    """The whole loop: they read a lesson through, the ladder opens, the
    question arrives over Telegram a day later, they answer it, and the answer
    is what decides when they see it again."""
    await read(signed_in, session, heartbeats=HEARTBEATS_TO_COMPLETE, depth=90)
    completed_at = (await aggregate(session, user)).completed_at
    state = await state_of(session, user, READ_LESSON)
    assert completed_at is not None
    assert state.next_due_at == completed_at + ladder.STEPS[0]

    # The clock is the one thing a test cannot wait out: the ladder is moved to
    # today's waking hours, and the cycle runs there.
    state.next_due_at = NOON - timedelta(minutes=1)
    await session.commit()
    await ask(session)

    row = (await reviews(session, user))[0]
    assert row.status == "awaiting_reply"
    assert bot.texts == ["what does entropy measure, in bits?"]

    with tutor.override(model=grading("passed")):
        await deliver(signed_in, message("the average surprisal of the source"))

    await session.refresh(row)
    assert await state_of(session, user, READ_LESSON) == state
    assert (state.step, state.last_outcome) == (1, "passed")
    assert about(state.next_due_at, datetime.now(UTC) + ladder.STEPS[1])
    assert row.payload["outcome"] == "passed"


@pytest.mark.parametrize(
    ("outcome", "step"),
    [("passed", 2), ("partial", 1), ("failed", 0)],
)
async def test_how_they_answered_decides_the_next_interval(
    client: AsyncClient,
    session: AsyncSession,
    user: User,
    outcome: str,
    step: int,
) -> None:
    """Success stretches, a shaky answer repeats, a wrong one compresses."""
    await ladder_row(session, user, step=1)
    await ask(session)

    with tutor.override(model=grading(outcome)):
        await deliver(client, message("something about entropy"))

    state = await state_of(session, user, LESSON)
    assert (state.step, state.last_outcome) == (step, outcome)
    assert about(state.next_due_at, datetime.now(UTC) + ladder.STEPS[step])


async def test_a_review_nobody_answered_moves_nothing_and_comes_back_whole(
    session: AsyncSession, user: User
) -> None:
    """Silence is not a wrong answer. The rung stays, and the same wait runs
    again rather than the question arriving every morning."""
    await ladder_row(session, user, step=1)
    await ask(session)
    timeout = policy.slot_deadline(NOON, policy.Hours.of(user))

    await ask(session, at=timeout)

    state = await state_of(session, user, LESSON)
    assert (state.step, state.last_outcome) == (1, "ignored")
    assert state.next_due_at == timeout + ladder.STEPS[1]
    # Nothing was queued a second time: the next delivery is a fortnight off.
    assert len(await reviews(session, user)) == 1


async def test_an_answer_that_arrives_late_still_counts(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """We gave up on the slot and queued the review again; the learner had not
    given up. The answer is graded and the queued copy — which asks about a
    rung they have just left — is dropped."""
    await ladder_row(session, user, step=1)
    await ask(session)
    timeout = policy.slot_deadline(NOON, policy.Hours.of(user))
    await ask(session, at=timeout)
    state = await state_of(session, user, LESSON)
    state.next_due_at = timeout
    await session.commit()
    await review.materialize(session, timeout)
    assert len(await reviews(session, user)) == 2

    with tutor.override(model=grading("passed")):
        await deliver(client, message("sorry — it is the average surprisal"))

    asked, requeued = await reviews(session, user)
    await session.refresh(state)
    assert (state.step, state.last_outcome) == (2, "passed")
    assert asked.payload["outcome"] == "passed"
    assert requeued.status == "cancelled"


async def test_a_message_about_something_else_does_not_count_as_ignoring_it(
    client: AsyncClient, session: AsyncSession, user: User
) -> None:
    """They wrote, so nothing was ignored; they did not answer, so nothing was
    learned. The review waits a day and the rung does not move."""
    await ladder_row(session, user, step=1)
    await ask(session)
    await sent_an_hour_ago(session, user)

    with replying("it is half past four"):
        await deliver(client, message("what time is it there?"))
    await ask(session, at=NOON + timedelta(minutes=1))

    state = await state_of(session, user, LESSON)
    assert (state.step, state.last_outcome) == (1, "deferred")
    assert state.next_due_at == NOON + timedelta(minutes=1) + ladder.DEFERRAL


async def test_a_learner_who_writes_mid_review_is_handed_it_to_close(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """The slot must not hang while the learner is right there typing."""
    await ladder_row(session, user)
    await ask(session)
    row = (await reviews(session, user))[0]

    with tutor.override(model=echoing()):
        await deliver(client, message("actually, a different question"))

    prompt = echoed(bot)
    assert subject.OPEN in prompt
    assert str(row.id) in prompt
    assert "report_review_outcome" in prompt


async def test_the_run_that_answers_a_review_is_told_how_to_conduct_one(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """The poller's question is a `review` run and carries the review module.
    Everything after it — the answer, the judging, the follow-ups, the grade —
    arrives as a `chat` run, whose modules do not include it, so the block does.
    """
    await ladder_row(session, user)
    await ask(session)

    with tutor.override(model=echoing()):
        await deliver(client, message("the average surprisal of the source"))

    prompt = echoed(bot)
    assert "At most two follow-ups on the same item" in prompt
    assert "Judge every answer explicitly" in prompt


@pytest.mark.usefixtures("indexed_course")
async def test_the_subject_is_read_from_the_lesson_not_from_the_rotation_field(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    """`topic` is what the poller rotates away from after an ignored message. A
    delivery without one still knows which course its lesson is in."""
    await ladder_row(session, user, step=1)
    row = (await review.materialize(session, NOON))[0]
    row.payload = {key: value for key, value in row.payload.items() if key != "topic"}
    await session.commit()

    with tutor.override(model=echoing()):
        await worker.cycle(session, NOON)

    assert "Entropy: Expected surprisal of a distribution" in echoed(bot)


@pytest.mark.usefixtures("indexed_course")
async def test_the_question_is_asked_about_the_concepts_the_lesson_teaches(
    session: AsyncSession, user: User, bot: Bot
) -> None:
    """The subject is the essence, not the lesson's table of contents: the
    concepts it introduces, and the ones next door it is confused with."""
    await ladder_row(session, user, step=1)

    with tutor.override(model=echoing()):
        await worker.cycle(session, NOON)

    prompt = echoed(bot)
    assert "Entropy: Expected surprisal of a distribution" in prompt
    assert "confusable with Prefix code" in prompt
    assert ladder.question_format(1) in prompt


async def test_what_a_review_turned_up_is_carried_into_the_next_one(
    client: AsyncClient, session: AsyncSession, user: User, bot: Bot
) -> None:
    """A note is the point of grading at all: it becomes a memory, and a memory
    is in the context of every run after it — so the next review starts from
    the sore spot rather than from the top of the lesson."""
    note = "reverses the direction of KL"
    await ladder_row(session, user)
    await ask(session)

    with tutor.override(model=grading("partial", notes=note)):
        await deliver(client, message("it is the distance between distributions"))

    kept = await memory.index(session, user.id)
    assert [row.content for row in kept] == [note]

    with tutor.override(model=echoing()):
        await deliver(client, message("anything else?", update_id=2))

    assert kept[0].slug in echoed(bot)
