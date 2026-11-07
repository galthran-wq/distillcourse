"""The ways the coach reaches the learner. There is no free-text one: every
message it starts carries a card, so "still waiting for your answer" cannot be
said.

A send tool checks the limits before it sends (`scheduling.gates`) and
returns a refusal the model reads rather than raising: the run goes on, and
deciding to stay silent after a refusal is its own business.
"""

from datetime import UTC, datetime
from typing import Annotated

from pydantic import Field
from pydantic_ai import RunContext

from app.harness import runner
from app.harness.deps import HarnessDeps
from app.review import cards, ladder
from app.review import repository as review
from app.scheduling import gates

Level = Annotated[int, Field(ge=1, le=ladder.TOP_LEVEL)]
Focus = Annotated[str, Field(min_length=1, max_length=300)]


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
    repo, outbox = ctx.deps.repo, ctx.deps.outbox
    assert outbox is not None
    session = repo.session
    now = datetime.now(UTC)
    refused = await gates.refusal(session, await repo.user(), now)
    if refused is not None:
        return refused
    state = await review.state_of(session, repo.user_id, lesson)
    if state is None:
        return f"Not sent: {lesson} is not a lesson the learner has finished."
    if level is None:
        easy = await review.level_one_only(session, repo.user_id, now)
        level = 1 if easy else state.level
    try:
        sent = await cards.offer(
            session, outbox, repo.user_id, lesson, level, focus=focus
        )
    except runner.RunBusy:
        return "Not sent: the learner is in a conversation with the tutor right now."
    if sent is None:
        return f"Not sent: no card of {lesson} at level {level} could be written."
    return f"Sent a level {level} card on {lesson}."
