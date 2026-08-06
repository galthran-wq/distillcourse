"""The ladder as arithmetic: no database, no model, no clock but the one given."""

from datetime import UTC, datetime, timedelta

import pytest

from app.review import ladder
from app.review.ladder import Outcome, Rung

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


def test_silence_moves_nothing_and_re_arms_the_same_interval() -> None:
    """Not knowing and not answering are different facts. The rung stays where
    it was, and the same wait runs again rather than firing tomorrow."""
    moved = ladder.advance(rung(1), "ignored", NOW)

    assert moved.step == 1
    assert moved.next_due_at == NOW + ladder.STEPS[1]


def test_the_last_rung_passed_ends_the_ladder() -> None:
    finished = ladder.advance(rung(LAST), "passed", NOW)

    assert ladder.finished(finished.step)
    assert finished.next_due_at is None


@pytest.mark.parametrize("outcome", ["passed", "partial", "failed", "ignored"])
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


def test_each_rung_asks_in_a_different_way() -> None:
    formats = [ladder.question_format(step) for step in range(len(ladder.STEPS))]

    assert len(set(formats)) == len(formats)
    assert "recall" in formats[0]
    assert "discrimination" in formats[1]
