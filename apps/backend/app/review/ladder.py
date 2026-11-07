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

# How the tutor grades an answer the learner wrote rather than tapped.
Outcome = Literal["passed", "partial", "failed"]
# What became of a card: a tap, a swap for another card, or nothing for a day.
CardOutcome = Literal["correct", "wrong", "skipped", "ignored"]

# How long a review that could not be put to the learner for a reason of ours —
# no card survived the check, the delivery ran out of attempts — waits before
# it is tried again. A day, and no more, because the ladder has not moved.
DEFERRAL = timedelta(days=1)

# Consecutive right answers at a level before the cards get harder.
LEVEL_UP_AFTER = 3
TOP_LEVEL = 3
# The furthest a tap at each level can carry the ladder. A tap at level 1 is a
# main point recognised, which is not enough to stop asking about a lesson:
# only level 3 can finish one.
STEP_CAP = {1: 1, 2: 2, 3: len(STEPS)}


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
    `failed` drops back to the one that was.
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


def next_level(level: int, run: int, outcome: CardOutcome) -> tuple[int, int]:
    """The level and the run of right answers after one card.

    A wrong answer drops a level at once rather than waiting for a run of them:
    a card the learner cannot answer teaches nothing, and the next one should
    be one they can. Skipping and silence say nothing about what they know.
    """
    match outcome:
        case "correct" if run + 1 >= LEVEL_UP_AFTER:
            return min(level + 1, TOP_LEVEL), 0
        case "correct":
            return level, run + 1
        case "wrong":
            return max(level - 1, 1), 0
        case _:
            return level, run


def after_card(rung: Rung, level: int, outcome: CardOutcome, now: datetime) -> Rung:
    """Where a tapped answer leaves the ladder.

    A right answer climbs only as far as the level it was given at allows; at
    that cap it re-arms the interval it is on, so the lesson still comes back,
    and comes back as a harder card.
    """
    match outcome:
        case "correct" if rung.step >= STEP_CAP[level] and not finished(rung.step):
            return Rung(step=rung.step, next_due_at=now + STEPS[rung.step])
        case "correct":
            return advance(rung, "passed", now)
        case "wrong":
            return advance(rung, "failed", now)
        case _:
            return rung
