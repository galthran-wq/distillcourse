"""The ways the coach reaches the learner. There is no free-text one: every
message it starts carries a card, or is the weekly note, whose every number
code writes, so "still waiting for your answer" cannot be said.

A send tool checks the limits before it sends (`scheduling.gates`) and
returns a refusal the model reads rather than raising: the run goes on, and
deciding to stay silent after a refusal is its own business.
"""

from typing import Annotated

from pydantic import Field
from pydantic_ai import RunContext

from app.coach import note
from app.harness import runner
from app.harness.deps import HarnessDeps
from app.models import ReviewCard
from app.review import cards, ladder
from app.review import repository as review
from app.scheduling import gates

Level = Annotated[int, Field(ge=1, le=ladder.TOP_LEVEL)]
Focus = Annotated[str, Field(min_length=1, max_length=300)]
NextStep = Annotated[str, Field(min_length=1, max_length=200)]
BUSY = "Not sent: the learner is in a conversation with the tutor right now."


async def send_card(
    ctx: RunContext[HarnessDeps],
    lesson: str,
    level: Level | None = None,
    focus: Focus | None = None,
) -> str:
    """Send the learner one tap card on a lesson they finished.

    Args:
        lesson: the lesson's locator, `lesson:<course>/<lesson>`, as the state
            lists it.
        level: 1 to 3; left out, the lesson's own level.
        focus: one line naming a confusion of the learner's that the state
            shows; a card is written aimed at it, for them alone.
    """
    repo, outbox, now = ctx.deps.repo, ctx.deps.outbox, ctx.deps.now
    assert outbox is not None and now is not None
    session = repo.session
    refused = await gates.refusal(session, await repo.user(), now)
    if refused is not None:
        return refused
    state = await review.state_of(session, repo.user_id, lesson)
    if state is None:
        return f"Not sent: {lesson} is not a lesson the learner has finished."
    if await review.resting(session, repo.user_id, lesson, now):
        return (
            f"Not sent: a card of {lesson} went out in the last "
            f"{review.REST.days} days; another lesson, or nothing, goes first."
        )
    try:
        sent = await cards.offer(session, outbox, state, level, now, focus=focus)
    except runner.RunBusy:
        return BUSY
    if sent is None:
        return f"Not sent: no card of {lesson} could be written."
    card = await session.get(ReviewCard, sent.card_id)
    assert card is not None
    return f"Sent a level {card.level} card on {lesson}."


async def send_weekly_note(ctx: RunContext[HarnessDeps], next_step: NextStep) -> str:
    """Send the weekly note: code writes each course's holding/total and what
    is slipping, and you write the one thing to do next.

    Args:
        next_step: one line, at most 200 characters, naming the one thing to
            do next — matching the button or link the state says goes under it.
    """
    repo, outbox, now = ctx.deps.repo, ctx.deps.outbox, ctx.deps.now
    assert outbox is not None and now is not None
    session = repo.session
    refused = await gates.refusal(session, await repo.user(), now)
    if refused is not None:
        return refused
    why = await note.unavailable(session, repo.user_id, now)
    if why is not None:
        return f"Not sent: {why}."
    try:
        await note.send(session, outbox, repo.user_id, now, next_step)
    except runner.RunBusy:
        return BUSY
    return "Sent the weekly note."
