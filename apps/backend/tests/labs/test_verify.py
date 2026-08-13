from typing import Any

import pytest

from app.labs import verify
from tests.labs.conftest import DIGEST, FAILING, LABELS, SPECS

EXACT = SPECS["surprisal"]["private"]
DIGESTED = SPECS["entropy-terms"]["private"]
METRIC = SPECS["beat-baseline"]["private"]


def values(*numbers: float) -> dict[str, Any]:
    return {"values": [list(numbers)]}


def test_the_reference_output_passes() -> None:
    assert verify.verify("exact", EXACT, values(1.0, 2.0, 3.0)) == verify.Verdict(
        passed=True
    )


def test_a_difference_within_the_tolerance_is_the_same_answer() -> None:
    """The atol the lab declares, not the float the learner's machine produced:
    a sum in a different order is a correct answer."""
    assert verify.verify("exact", EXACT, values(1.0, 2.0, 3.0000009)).passed


def test_a_difference_past_the_tolerance_is_not() -> None:
    assert verify.verify("exact", EXACT, values(1.0, 2.0, 3.01)).passed is False


def test_a_declared_mistake_is_named_and_nothing_else_is() -> None:
    """The hint names the bug; a wrong answer nobody anticipated is answered
    with a bare no, never with the distance to the expected value."""
    named = verify.verify("exact", EXACT, values(0.6931, 1.3863))
    unanticipated = verify.verify("exact", EXACT, values(9.0, 9.0, 9.0))

    assert named == verify.Verdict(passed=False, hint="Natural log, not base two.")
    assert unanticipated == verify.Verdict(passed=False, hint=None)


def test_an_output_of_another_shape_is_not_the_answer() -> None:
    """Same numbers, one list deeper: canonicalization keeps the shape, so a
    (3,) and a (3, 1) are different outputs rather than a rounding apart."""
    assert (
        verify.verify("exact", EXACT, {"values": [[[1.0], [2.0], [3.0]]]}).passed
        is False
    )


def test_a_large_output_is_compared_by_digest() -> None:
    assert verify.verify("exact", DIGESTED, {"digest": DIGEST}).passed
    assert verify.verify("exact", DIGESTED, {"digest": "c3" * 32}).passed is False


def test_a_payload_of_the_wrong_shape_is_refused() -> None:
    for payload in (
        [1.0, 2.0],
        "1.0",
        {"values": [["nope"]]},
        {"values": [[float("nan")]]},
        {"digest": "too-short"},
        # Past the small limit the contract says digest, so a values payload
        # this size did not come from a client that shares the contract.
        {"values": [[0.0] * (verify.SMALL_LIMIT + 1)]},
    ):
        with pytest.raises(verify.Rejected):
            verify.verify("exact", EXACT, payload)


def test_a_metric_is_scored_against_the_labels_the_learner_never_sees() -> None:
    # The values numpy produces for these vectors, in
    # apps/frontend/lib/labs/python/distill_capture.py: the two ends of the
    # protocol compute the same three metrics and must agree on them.
    assert verify.verify("metric", METRIC, FAILING) == verify.Verdict(
        passed=False, score=0.8125
    )
    accuracy = verify.verify("metric", METRIC | {"metric": "accuracy"}, FAILING)
    rmse = verify.verify("metric", METRIC | {"metric": "rmse"}, FAILING)

    assert accuracy.score == 0.75
    assert rmse.score == pytest.approx(-0.38770156048177057)


def test_tied_predictions_score_by_midrank() -> None:
    """Without it a constant prediction would score anything but 0.5, and a
    learner who guessed one number would be told they beat the baseline."""
    assert verify.METRICS["roc_auc"](LABELS, [0.5] * len(LABELS)) == 0.5


def test_predictions_that_do_not_cover_the_held_out_set_are_refused() -> None:
    with pytest.raises(verify.Rejected):
        verify.verify("metric", METRIC, FAILING[:-1])


def test_a_review_is_stored_for_the_judge_rather_than_graded() -> None:
    assert verify.verify("review", SPECS["why-uniform"]["private"], "because") == (
        verify.Verdict(passed=None, pending=True)
    )


def test_an_empty_or_oversized_answer_is_refused() -> None:
    for payload in ("   ", "x" * (verify.MAX_REVIEW_CHARS + 1), 42):
        with pytest.raises(verify.Rejected):
            verify.verify("review", SPECS["why-uniform"]["private"], payload)
