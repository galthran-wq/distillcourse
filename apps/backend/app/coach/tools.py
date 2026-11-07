"""The ways the coach reaches the learner. There is no free-text one: every
message it starts carries a card or a link into a lesson, so "still waiting
for your answer" cannot be said.

A send tool checks the limits before it sends (`scheduling.gates`) and
returns a refusal the model reads rather than raising: the run goes on, and
deciding to stay silent after a refusal is its own business.
"""

from typing import Annotated

from pydantic import Field
from pydantic_ai import RunContext

from app.coach import nudges
from app.content.search import section_of, sections
from app.harness import runner
from app.harness.deps import HarnessDeps
from app.models import LessonProgress, ReviewCard
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
        return "Not sent: the learner is in a conversation with the tutor right now."
    if sent is None:
        return f"Not sent: no card of {lesson} could be written."
    card = await session.get(ReviewCard, sent.card_id)
    assert card is not None
    return f"Sent a level {card.level} card on {lesson}."


async def send_nudge(
    ctx: RunContext[HarnessDeps],
    kind: nudges.Kind,
    lesson: str,
    text: str,
    anchor: str | None = None,
) -> str:
    """Send the learner a short message with a link into a lesson.

    The first call about a section sends nothing: it returns the section's
    text, to write the message with it in view. Call again with the same
    `kind`, `lesson` and `anchor`, and the text written from it, to send.

    Args:
        kind: `resume` for a lesson they started and did not finish, linked to
            where they stopped; `hook` for a lesson they have not opened, a
            puzzle from its opening that the lesson answers.
        lesson: the lesson's locator, `lesson:<course>/<lesson>`.
        text: what the learner reads, at most 300 characters, in their
            language. A `hook` never gives the answer away.
        anchor: the section linked to. Left out, a `resume` links to where
            they stopped, a `hook` to the top of the lesson.
    """
    repo, outbox, now = ctx.deps.repo, ctx.deps.outbox, ctx.deps.now
    assert outbox is not None and now is not None
    session = repo.session
    if not text.strip():
        return "Not sent: the text is empty."
    if len(text) > nudges.TEXT_CHARS:
        return (
            f"Not sent: the text is {len(text)} characters; "
            f"{nudges.TEXT_CHARS} at most."
        )
    chunks = await sections(session, lesson)
    if not chunks:
        return f"Not sent: {lesson} is not a lesson on the site."
    progress = await session.get(LessonProgress, (repo.user_id, lesson))
    if kind == "resume":
        if progress is None or progress.completed_at is not None:
            return f"Not sent: {lesson} is not a lesson the learner left unfinished."
        anchor = anchor or progress.last_anchor
    elif progress is not None:
        return f"Not sent: the learner has opened {lesson} already."
    where = nudges.locator(lesson, anchor)
    section = chunks[0] if anchor is None else section_of(chunks, where)
    if section is None:
        return f"Not sent: {lesson} has no section `{anchor}`."
    refused = await gates.refusal(session, await repo.user(), now)
    if refused is not None:
        return refused
    if where not in ctx.deps.nudge_read:
        ctx.deps.nudge_read.add(where)
        return (
            f"Nothing sent yet. The section `{where}`, {section.title}:\n\n"
            f"{section.text}\n\nWrite the message with it in view, then call "
            "again with the same kind, lesson and anchor to send it."
        )
    try:
        await nudges.send(repo, outbox, kind, lesson, anchor, text, now)
    except runner.RunBusy:
        return "Not sent: the learner is in a conversation with the tutor right now."
    return f"Sent a {kind} nudge on {where}."
