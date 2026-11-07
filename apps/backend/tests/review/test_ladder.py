"""The ladder as arithmetic: no database, no model, no clock but the one given."""

from datetime import UTC, datetime, timedelta

import pytest

from app.review import ladder
from app.review.ladder import CardOutcome, Outcome, Rung

NOW = datetime(2026, 8, 6, 12, tzinfo=UTC)
LAST = len(ladder.STEPS) - 1


def rung(step: int) -> Rung:
    return Rung(step=step, next_due_at=NOW)


def test_a_finished_lesson_is_asked_about_the_next_day() -> None:
    opening = ladder.started(NOW)

    assert opening.step == 0
    assert opening.next_due_at == NOW + timedelta(days=1)


def test_the_intervals_expand() -> None:
    assert ladder.STEPS == tuple(timedelta(days=days) for days in (1, 3, 7, 21))


def test_passing_stretches_the_interval() -> None:
    """The whole ladder walked with right answers: each rung waits longer."""
    walk = [ladder.started(NOW)]
    while walk[-1].next_due_at is not None:
        walk.append(ladder.advance(walk[-1], "passed", NOW))

    assert [step.step for step in walk] == [0, 1, 2, 3, 4]
    assert [step.next_due_at for step in walk[:-1]] == [
        NOW + interval for interval in ladder.STEPS
    ]


def test_a_partial_answer_repeats_the_same_interval() -> None:
    moved = ladder.advance(rung(2), "partial", NOW)

    assert moved.step == 2
    assert moved.next_due_at == NOW + ladder.STEPS[2]


def test_a_wrong_answer_drops_back_one_rung() -> None:
    moved = ladder.advance(rung(2), "failed", NOW)

    assert moved.step == 1
    assert moved.next_due_at == NOW + ladder.STEPS[1]


def test_the_bottom_rung_is_the_bottom() -> None:
    assert ladder.advance(rung(0), "failed", NOW).step == 0


def test_the_last_rung_passed_ends_the_ladder() -> None:
    finished = ladder.advance(rung(LAST), "passed", NOW)

    assert ladder.finished(finished.step)
    assert finished.next_due_at is None


@pytest.mark.parametrize("outcome", ["passed", "partial", "failed"])
def test_a_finished_ladder_is_never_resurrected(outcome: Outcome) -> None:
    done = Rung(step=len(ladder.STEPS), next_due_at=None)

    assert ladder.advance(done, outcome, NOW) == done
    assert ladder.deferred(done, NOW) == done


def test_a_deferral_leaves_the_rung_where_it_was() -> None:
    """Nothing was learned about the learner, so nothing about the ladder may
    change — only the day it is asked on."""
    moved = ladder.deferred(rung(2), NOW)

    assert moved.step == 2
    assert moved.next_due_at == NOW + ladder.DEFERRAL


@pytest.mark.parametrize(
    ("level", "run", "outcome", "after"),
    [
        (1, 0, "correct", (1, 1)),
        (1, 1, "correct", (1, 2)),
        (1, 2, "correct", (2, 0)),
        (2, 2, "correct", (3, 0)),
        (3, 2, "correct", (3, 0)),
        (2, 1, "wrong", (1, 0)),
        (1, 2, "wrong", (1, 0)),
        (2, 1, "skipped", (2, 1)),
        (2, 1, "ignored", (2, 1)),
    ],
)
def test_the_level_climbs_after_a_run_and_drops_on_a_miss(
    level: int, run: int, outcome: CardOutcome, after: tuple[int, int]
) -> None:
    assert ladder.next_level(level, run, outcome) == after


@pytest.mark.parametrize(
    ("step", "level", "outcome", "after"),
    [
        # Below the cap a right answer climbs, a wrong one drops back.
        (0, 1, "correct", rung(1).step),
        (1, 2, "correct", 2),
        (2, 3, "correct", 3),
        (2, 1, "wrong", 1),
        # At the cap it holds the rung — and above it, where a level dropped
        # under a learner already high on the ladder, it does not pull them down.
        (1, 1, "correct", 1),
        (2, 2, "correct", 2),
        (3, 1, "correct", 3),
        (1, 2, "skipped", 1),
        (1, 2, "ignored", 1),
    ],
)
def test_a_tap_moves_the_rung_no_further_than_its_level_allows(
    step: int, level: int, outcome: CardOutcome, after: int
) -> None:
    assert ladder.after_card(rung(step), level, outcome, NOW).step == after


def test_at_its_cap_a_right_answer_re_arms_the_interval() -> None:
    """The lesson still comes back, on the same rung, as a harder card."""
    held = ladder.after_card(Rung(step=1, next_due_at=NOW), 1, "correct", NOW)

    assert held == Rung(step=1, next_due_at=NOW + ladder.STEPS[1])


def test_skipping_and_silence_leave_the_ladder_where_it_was() -> None:
    due = Rung(step=1, next_due_at=NOW - timedelta(days=2))

    assert ladder.after_card(due, 2, "skipped", NOW) == due
    assert ladder.after_card(due, 2, "ignored", NOW) == due


@pytest.mark.parametrize("level", [1, 2])
def test_taps_below_level_3_never_finish_a_ladder(level: int) -> None:
    at = ladder.started(NOW)
    for _ in range(20):
        at = ladder.after_card(at, level, "correct", NOW)

    assert at.step == ladder.STEP_CAP[level]
    assert at.next_due_at is not None


def test_level_1_never_passes_step_1() -> None:
    assert ladder.STEP_CAP[1] == 1
    assert ladder.after_card(rung(1), 1, "correct", NOW).step == 1


def test_only_level_3_finishes_a_ladder() -> None:
    at = ladder.started(NOW)
    while at.next_due_at is not None:
        at = ladder.after_card(at, 3, "correct", NOW)

    assert ladder.finished(at.step)


def test_a_level_climbs_only_through_right_answers() -> None:
    """The scenario: three right taps at level 1 move the ladder one rung and
    the level up one, and the next right answer at the new cap holds."""
    level, run, at = 1, 0, ladder.started(NOW)
    for _ in range(ladder.LEVEL_UP_AFTER):
        at = ladder.after_card(at, level, "correct", NOW)
        level, run = ladder.next_level(level, run, "correct")

    assert (at.step, level, run) == (1, 2, 0)
