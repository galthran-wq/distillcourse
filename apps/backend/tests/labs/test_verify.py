import json
from pathlib import Path
from typing import Any

import pytest

from app.labs import verify
from tests.labs.conftest import DIGEST, FAILING, SPECS

EXACT = SPECS["surprisal"]["private"]
DIGESTED = SPECS["entropy-terms"]["private"]
METRIC = SPECS["beat-baseline"]["private"]
PYTHON = Path(__file__).parents[3] / "frontend/lib/labs/python"
# The one statement of what a canonicalized output is, which the client
# canonicalizes to and this module grades against.
CANON_VECTORS = PYTHON / "canon_vectors.json"
# And the one statement of what each metric is worth, which the build
# calibrates a threshold with and this module grades against.
METRIC_VECTORS = PYTHON / "metric_vectors.json"


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


def test_the_committed_vectors_are_what_this_module_accepts() -> None:
    """The vectors `distill_capture.canonicalize` is held to, run against this
    end of the same contract — the check `check_canon_vectors.py` asks of "any
    implementation of the contract".

    A canonicalized output is what the client posts, so this module must take
    each of them back unchanged. It is what pins `SMALL_LIMIT` to the client's:
    raise it there alone and the vectors past 64 arrive as values rather than
    as a digest, which is the payload this rejects.
    """
    cases = json.loads(CANON_VECTORS.read_text())["cases"]
    graded = [case for case in cases if not case.get("rejects")]
    assert graded

    assert {case["name"]: verify._canonical(case["expected"]) for case in graded} == {
        case["name"]: case["expected"] for case in graded
    }


def test_a_metric_is_scored_against_the_labels_the_learner_never_sees() -> None:
    assert verify.verify("metric", METRIC, FAILING) == verify.Verdict(
        passed=False, score=0.8125
    )


METRIC_CASES: list[dict[str, Any]] = json.loads(METRIC_VECTORS.read_text())["cases"]


@pytest.mark.parametrize(
    "case", METRIC_CASES, ids=[f"{c['metric']}: {c['name']}" for c in METRIC_CASES]
)
def test_a_committed_metric_vector(case: dict[str, Any]) -> None:
    """The build calibrates a threshold with numpy in `distill_capture.py`;
    this module grades against it without numpy. Neither can import the other,
    so the vectors are the agreement — and drift between them fails a learner
    whose predictions genuinely clear the bar the author set.

    `check_metric_vectors.py` runs the same file against the other end.
    """
    score = verify.METRICS[case["metric"]](case["labels"], case["predictions"])

    assert score == pytest.approx(case["score"], abs=1e-12)


def test_the_metric_vectors_cover_every_metric_the_platform_grades() -> None:
    assert {case["metric"] for case in METRIC_CASES} == set(verify.METRICS)


def test_predictions_that_do_not_cover_the_held_out_set_are_refused() -> None:
    with pytest.raises(verify.Rejected):
        verify.verify("metric", METRIC, FAILING[:-1])


def test_predictions_of_the_right_length_but_the_wrong_shape_are_refused() -> None:
    """A column rather than a row: the length matches, so only the shape check
    stands between it and a formula that would compare a list to a label."""
    with pytest.raises(verify.Rejected):
        verify.verify("metric", METRIC, [[prediction] for prediction in FAILING])
