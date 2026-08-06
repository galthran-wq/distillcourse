import uuid
from datetime import UTC, datetime
from typing import Annotated

from pydantic import Field
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
Notes = Annotated[str, Field(max_length=memory.CONTENT_LENGTH)]


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
    schedule_id: uuid.UUID,
    outcome: Outcome,
    notes: Notes | None = None,
) -> str:
    """Record how the learner did on one review, and when it should come back.

    Call it once per review item you got an answer on, as soon as you have
    judged that answer. An item you never got to is left alone: it comes back
    another day, and reporting an outcome you did not observe corrupts the
    schedule for that lesson.

    Args:
        schedule_id: the id given beside the review in your context.
        outcome: `passed` if they produced the thing asked for, `partial` if
            they had part of it or needed the answer pulled out of them,
            `failed` if they could not or got it wrong.
        notes: what to carry into the next review of this lesson — the specific
            confusion, in one line ("reverses the direction of KL"). Omit it
            when there is nothing to carry.
    """
    repo = ctx.deps.repo
    row = await repository.delivery(repo.session, repo.user_id, schedule_id)
    if row is None:
        return "no review of this learner's is on record under that id"
    lesson: str = row.payload["lesson"]
    now = datetime.now(UTC)
    state = await repository.apply(repo.session, repo.user_id, lesson, outcome, now)
    if state is None:
        return f"there is no review ladder for {lesson}"
    await repository.mark(repo.session, row, outcome)
    # A review the platform had given up on and queued again is asking about a
    # rung the learner has just moved off.
    await repository.cancel_deliveries(repo.session, repo.user_id, lesson)
    kept = "" if notes is None else await _remember(ctx, lesson, notes)
    if state.next_due_at is None:
        return f"recorded as {outcome}; the ladder for {lesson} is finished.{kept}"
    return (
        f"recorded as {outcome}; {lesson} comes back "
        f"{state.next_due_at:%Y-%m-%d}.{kept}"
    )
