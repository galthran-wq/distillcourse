"""What a posted checkpoint is worth.

The server runs no code a learner or an author wrote. An `exact` checkpoint is
a comparison against the output the build captured from the reference solution
(`apps/frontend/lib/labs/python/`), canonicalized on the client to the format
`canon_vectors.json` pins; a `metric` one is scored here against labels the
learner never sees; a `review` one is text the judge grades.

Feedback is deliberately coarse — a pass, and a hint only where the output
matches a wrong variant the author declared. Nothing here reports how far off
an answer was or which element differed: the API would become an oracle for
the answer key by accident.
"""

import math
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

# The canonicalization contract: past this many scalars a client sends a
# digest, so a values payload larger than this was not built by it.
SMALL_LIMIT = 64
MAX_REVIEW_CHARS = 4000
DIGEST_CHARS = 64


class Rejected(Exception):
    """The payload is not the shape its checkpoint's kind takes."""


@dataclass(frozen=True)
class Verdict:
    # None while a review checkpoint waits for the judge: not a failure, and
    # not something to record a pass for either.
    passed: bool | None
    hint: str | None = None
    score: float | None = None
    pending: bool = False


def verify(kind: str, spec: dict[str, Any], payload: Any) -> Verdict:
    return _KINDS[kind](spec, payload)


def _exact(spec: dict[str, Any], payload: Any) -> Verdict:
    posted = _canonical(payload)
    atol = float(spec["atol"])
    if _same(spec["expected"], posted, atol):
        return Verdict(passed=True)
    for variant in spec["wrong"]:
        if _same(variant, posted, atol):
            return Verdict(passed=False, hint=variant["hint"])
    return Verdict(passed=False)


def _metric(spec: dict[str, Any], payload: Any) -> Verdict:
    labels: list[float] = spec["labels"]
    score = METRICS[spec["metric"]](labels, _predictions(payload, len(labels)))
    return Verdict(passed=score >= float(spec["threshold"]), score=score)


def _review(_spec: dict[str, Any], payload: Any) -> Verdict:
    if not isinstance(payload, str) or not payload.strip():
        raise Rejected("a review checkpoint takes the text of your answer")
    if len(payload) > MAX_REVIEW_CHARS:
        raise Rejected(f"an answer is at most {MAX_REVIEW_CHARS} characters")
    return Verdict(passed=None, pending=True)


_KINDS: dict[str, Callable[[dict[str, Any], Any], Verdict]] = {
    "exact": _exact,
    "metric": _metric,
    "review": _review,
}


def _canonical(payload: Any) -> dict[str, Any]:
    """The canonicalized output a notebook posts: the values themselves while
    the output is small enough to send whole, a digest of them past that."""
    if isinstance(payload, dict):
        digest = payload.get("digest")
        if isinstance(digest, str):
            if len(digest) != DIGEST_CHARS:
                raise Rejected("that is not a canonicalized digest")
            return {"digest": digest}
        if isinstance(payload.get("values"), list):
            values = _numbers(payload["values"])
            if _scalars(values) > SMALL_LIMIT:
                raise Rejected(
                    f"an output of more than {SMALL_LIMIT} numbers is posted as a digest"
                )
            return {"values": values}
    raise Rejected('an exact checkpoint takes {"values": [...]} or {"digest": "..."}')


def _numbers(node: Any) -> Any:
    if isinstance(node, list):
        return [_numbers(item) for item in node]
    # bool is an int in Python and would compare equal to 0.0 and 1.0.
    if isinstance(node, bool) or not isinstance(node, int | float):
        raise Rejected("an output is numbers, nested in lists")
    if not math.isfinite(node):
        raise Rejected("an output holds no NaN and no infinity")
    return float(node)


def _scalars(node: Any) -> int:
    return sum(_scalars(item) for item in node) if isinstance(node, list) else 1


def _same(reference: dict[str, Any], posted: dict[str, Any], atol: float) -> bool:
    if "digest" in reference:
        return bool(reference["digest"] == posted.get("digest"))
    if "values" not in posted:
        return False
    return _close(reference["values"], posted["values"], atol)


def _close(reference: Any, posted: Any, atol: float) -> bool:
    """Absolute tolerance only, and elementwise: the digest half of the
    contract quantizes by `round(x / atol)`, so a relative term here would grade
    the same pair of outputs differently on either side of the size limit."""
    if isinstance(reference, list):
        return (
            isinstance(posted, list)
            and len(reference) == len(posted)
            and all(_close(r, p, atol) for r, p in zip(reference, posted, strict=True))
        )
    return not isinstance(posted, list) and abs(reference - posted) <= atol


def _predictions(payload: Any, expected: int) -> list[float]:
    if not isinstance(payload, list):
        raise Rejected("a metric checkpoint takes a list of predictions")
    if len(payload) != expected:
        raise Rejected(f"the held-out set needs {expected} predictions")
    # `_numbers` keeps whatever nesting it is given, so a right-length list of
    # lists would otherwise pass both guards and reach the formulas as lists.
    if any(isinstance(item, list) for item in payload):
        raise Rejected("a metric checkpoint takes one number per held-out row")
    predictions: list[float] = _numbers(payload)
    return predictions


def _roc_auc(labels: Sequence[float], predictions: Sequence[float]) -> float:
    ranks = _midranks(predictions)
    positives = [index for index, label in enumerate(labels) if label == 1]
    n1 = len(positives)
    n0 = len(labels) - n1
    return (sum(ranks[i] for i in positives) - n1 * (n1 + 1) / 2) / (n1 * n0)


def _midranks(values: Sequence[float]) -> list[float]:
    """1-based ranks with ties sharing the average of the ranks they span —
    without which a constant prediction would score anything but 0.5."""
    order = sorted(range(len(values)), key=lambda index: values[index])
    ranks = [0.0] * len(values)
    start = 0
    while start < len(order):
        end = start
        while end + 1 < len(order) and values[order[end + 1]] == values[order[start]]:
            end += 1
        for index in order[start : end + 1]:
            ranks[index] = (start + end) / 2 + 1
        start = end + 1
    return ranks


def _accuracy(labels: Sequence[float], predictions: Sequence[float]) -> float:
    hits = sum(
        (prediction >= 0.5) == (label == 1)
        for label, prediction in zip(labels, predictions, strict=True)
    )
    return hits / len(labels)


def _rmse(labels: Sequence[float], predictions: Sequence[float]) -> float:
    squares = sum(
        (label - prediction) ** 2
        for label, prediction in zip(labels, predictions, strict=True)
    )
    # Negated, so every metric reads "higher is better" and one threshold
    # comparison answers for all of them.
    return -math.sqrt(squares / len(labels))


# The build computes the reference score with the numpy versions in
# `distill_capture.py`; these are the same three formulas without a numpy
# dependency on the API. Neither end can import the other — one runs inside the
# lab's own uv environment at build time — so they are kept in step by
# `tests/labs/test_verify.py`, which asserts the values that module produces.
METRICS: dict[str, Callable[[Sequence[float], Sequence[float]], float]] = {
    "roc_auc": _roc_auc,
    "accuracy": _accuracy,
    "rmse": _rmse,
}
