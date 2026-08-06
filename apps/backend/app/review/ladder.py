"""The ladder itself: where a review goes next, given how the last one went.

Pure functions over a rung and an outcome. Everything that decides *when* a
learner is asked about a lesson again is here, so it can be read and tested
without a database, a model or a clock.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

# Expanding intervals from the completion: the spacing effect is what makes a
# review worth sending at all, and expanding beats uniform by little enough
# (g=0.034) that this is a schedule chosen for being simple to reason about
# rather than for a measured edge.
STEPS = (
    timedelta(days=1),
    timedelta(days=3),
    timedelta(days=7),
    timedelta(days=21),
)

# What a question at each rung asks for. Recognition is not on the list: the
# whole point of a review is retrieval, and a learner who nods along to a
# definition they are shown has practised nothing.
FORMATS = (
    "free recall — ask them to state the concept from nothing",
    "discrimination — make them separate the concept from one it is confused with",
    "application — a small concrete case to work, not a definition to repeat",
    "justification — why the thing they know is true, or where it comes from",
)

Outcome = Literal["passed", "partial", "failed", "ignored"]

# A session that is over but that the learner was never graded on: what it
# does to the ladder is nothing at all, beyond moving the next attempt out of
# today. `settle` writes one of these where a real outcome would have gone.
Settlement = Literal["ignored", "deferred"]

# How long a review that nobody answered for a reason of ours — the learner
# replied about something else, the model never reported — waits before it is
# put again. A day, so it is out of the way of everything else due today, and
# no more, because the ladder itself has not moved.
DEFERRAL = timedelta(days=1)


@dataclass(frozen=True)
class Rung:
    """Where a ladder stands: which interval is in force, and when it fires.

    `next_due_at` is None for a ladder that is finished.
    """

    step: int
    next_due_at: datetime | None


def started(completed_at: datetime) -> Rung:
    return Rung(step=0, next_due_at=completed_at + STEPS[0])


def finished(step: int) -> bool:
    """Past the last rung: the 21-day review was passed and there is no more.

    A later stumble does not resurrect it — nothing in MVP watches for one, and
    a ladder that can restart is a ladder that never ends.
    """
    return step >= len(STEPS)


def advance(rung: Rung, outcome: Outcome, now: datetime) -> Rung:
    """Success stretches the interval, failure compresses it.

    `passed` climbs, `partial` repeats the interval that was not quite enough,
    `failed` drops back to the one that was. `ignored` moves nothing: silence
    is not evidence about what they know. It does re-arm the same interval from
    now rather than firing again tomorrow, because a learner who is away must
    not come back to a queue of everything they missed.
    """
    if finished(rung.step):
        return rung
    match outcome:
        case "passed":
            step = rung.step + 1
        case "failed":
            step = max(0, rung.step - 1)
        case _:
            step = rung.step
    if finished(step):
        return Rung(step=step, next_due_at=None)
    return Rung(step=step, next_due_at=now + STEPS[step])


def deferred(rung: Rung, now: datetime) -> Rung:
    """The same rung, out of today. Not an outcome: nothing was learned about
    the learner, so nothing about the ladder may change."""
    if finished(rung.step):
        return rung
    return Rung(step=rung.step, next_due_at=now + DEFERRAL)


def question_format(step: int) -> str:
    # By rung rather than at random, so the same review asked twice is asked
    # the same way and a test can say which format a step gets.
    return FORMATS[min(step, len(FORMATS) - 1)]
