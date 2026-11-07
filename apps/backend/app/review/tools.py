import uuid

from pydantic_ai import RunContext

from app.harness.deps import HarnessDeps
from app.harness.limits import LimitExceeded, spend_memory_write
from app.memory import repository as memory
from app.models import MEMORY_SLUG_LENGTH
from app.review import repository
from app.review.ladder import Outcome

# The sore spot of one lesson, kept under a handle derived from that lesson, so
# the next review of it replaces what the last one found rather than adding a
# second line to the profile about the same confusion.
NOTE_PREFIX = "review-"


def _memory(lesson: str, notes: str) -> memory.Recollection:
    slug = f"{NOTE_PREFIX}{lesson.rpartition('/')[2]}"[:MEMORY_SLUG_LENGTH]
    return memory.Recollection(
        slug=slug.rstrip("-"),
        description=f"What reviews of {lesson} keep running into"[
            : memory.DESCRIPTION_LENGTH
        ],
        content=notes,
    )


async def _remember(ctx: RunContext[HarnessDeps], lesson: str, notes: str) -> str:
    repo = ctx.deps.repo
    try:
        # Out of the same per-run allowance an ordinary memory write comes
        # from: this text is the model's, written about a dialogue it just had,
        # and the guard does not care which tool wrote it.
        spend_memory_write(ctx.usage)
    except LimitExceeded:
        # The outcome is the point of the call and it is already applied; the
        # note is what is dropped, and saying so is better than failing the
        # grade over it.
        return " the note was not kept: this run has written all the memory it may"
    await memory.save(
        repo.session, repo.user_id, _memory(lesson, notes), source="agent"
    )
    return ""


async def report_review_outcome(
    ctx: RunContext[HarnessDeps],
    delivery_id: uuid.UUID,
    outcome: Outcome,
    notes: memory.Content | None = None,
) -> str:
    """Grade a review card the learner answered in their own words.

    Call it once, as soon as you have judged the answer. A card they tapped is
    graded already, and a card they never answered is left alone: reporting an
    outcome you did not observe corrupts the schedule for that lesson.

    Args:
        delivery_id: the delivery id given beside the card in your context.
        outcome: `passed` if they stated the right idea, `partial` if they had
            part of it, `failed` if they could not or got it wrong.
        notes: what to carry into the next review of this lesson — the specific
            confusion, in one line ("reverses the direction of KL"). Omit it
            when there is nothing to carry.
    """
    repo = ctx.deps.repo
    found = await repository.delivery(repo.session, repo.user_id, delivery_id)
    if found is None:
        return "no card of this learner's was sent under that id"
    sent, card = found
    if sent.answered_at is not None:
        # One card moves the ladder once: a tap and a written answer, or an
        # answer split across two messages, can both reach here.
        return f"that card is already graded as {sent.outcome}"
    state = await repository.grade(repo.session, sent, card, outcome)
    await repo.session.commit()
    kept = "" if notes is None else await _remember(ctx, card.lesson, notes)
    if state is None:
        return f"recorded as {outcome}; there is no review ladder for {card.lesson}"
    if state.next_due_at is None:
        return f"recorded as {outcome}; the ladder for {card.lesson} is finished.{kept}"
    return (
        f"recorded as {outcome}; {card.lesson} comes back "
        f"{state.next_due_at:%Y-%m-%d}.{kept}"
    )
