"""Submit distillcourse lab checkpoints from the notebook you solve them in.

    import distill

    distill.login("<the code from the lesson page>")
    distill.open_lab("<course>/<lesson>")

Everything after that is one call per checkpoint. The server grades and keeps
the score; this package computes the inputs, canonicalizes what your function
returned, posts it and prints the verdict. It remembers nothing between
kernels.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import numpy as np

from distill import api
from distill.canon import canonicalize
from distill.errors import LabError

__all__ = [
    "LabError",
    "check",
    "login",
    "open_lab",
    "submit_predictions",
    "submit_review",
]

_api = api.connect()


@dataclass(frozen=True)
class _Lab:
    """The manifest, which is also the build this notebook was generated from:
    submissions carry that version, and the server refuses the ones it has
    outlived rather than grading them against a newer answer key."""

    lesson: str
    content_version: str
    checkpoints: dict[str, dict[str, Any]]


_lab: _Lab | None = None


def login(code: str) -> None:
    """Exchange a pairing code from the lesson page for this session's token."""
    _api.pair(code)
    print("paired — checkpoints from this kernel count towards your progress")


def open_lab(lab: str) -> None:
    """Fetch what `<course>/<lesson>` asks for. Public: no pairing needed."""
    global _lab
    manifest = _api.manifest(lab)
    _lab = _Lab(
        lesson=manifest["lesson"],
        content_version=manifest["content_version"],
        checkpoints={entry["id"]: entry for entry in manifest["checkpoints"]},
    )
    required = sum(1 for entry in _lab.checkpoints.values() if entry["required"])
    print(f"{lab} — {len(_lab.checkpoints)} checkpoints, {required} required")
    if _api.token is None:
        print(api.UNPAIRED)


def check(checkpoint: str, fn: Callable[..., Any]) -> None:
    """Run `fn` on this checkpoint's inputs and submit what it returned."""
    spec = _spec(checkpoint, "exact")
    payload = canonicalize(fn(*_inputs(spec)), float(spec["atol"]))
    _report(checkpoint, _submit(checkpoint, payload))


def submit_predictions(checkpoint: str, predictions: Any) -> None:
    """Submit predictions for the held-out set; the server scores them."""
    spec = _spec(checkpoint, "metric")
    result = _submit(checkpoint, np.asarray(predictions, dtype=np.float64).tolist())
    score = result["score"]
    scored = (
        "" if score is None else f"{spec['metric']} {score:.4f} vs {spec['threshold']}"
    )
    _report(checkpoint, result, scored)


def submit_review(checkpoint: str, text: str) -> None:
    """Submit a written answer for the judge to read against its rubric."""
    _spec(checkpoint, "review")
    result = _submit(checkpoint, text)
    _report(
        checkpoint, result, "recorded, waiting on review" if result["pending"] else ""
    )


def _opened() -> _Lab:
    if _lab is None:
        raise LabError(
            'no lab is open — run distill.open_lab("<course>/<lesson>") first'
        )
    return _lab


def _spec(checkpoint: str, kind: str) -> dict[str, Any]:
    declared = _opened().checkpoints.get(checkpoint)
    if declared is None:
        raise LabError(f'this lab has no checkpoint called "{checkpoint}"')
    if declared["kind"] != kind:
        raise LabError(
            f'"{checkpoint}": declared {declared["kind"]}, submitted as {kind}'
        )
    spec: dict[str, Any] = declared["spec"]
    return spec


def _inputs(spec: dict[str, Any]) -> Any:
    """The challenge inputs, generated here rather than downloaded.

    The same three lines run at build time in the capture stub, so the learner's
    function is called on exactly what the reference was called on. The seed is
    the whole agreement, and the code that consumes it is short enough to state
    twice across the two runtimes rather than shipped between them.
    """
    namespace: dict[str, Any] = {"rng": np.random.default_rng(spec["seed"]), "np": np}
    exec(spec["inputs_code"], namespace)
    return namespace["inputs"]


def _submit(checkpoint: str, payload: Any) -> dict[str, Any]:
    lab = _opened()
    return _api.submit(
        {
            # One id per attempt, minted here because the submissions log is
            # keyed by it. Nothing in this client re-sends one — a cell run
            # again is a new attempt, and the learner meant it to be.
            "id": str(uuid.uuid4()),
            "lesson": lab.lesson,
            "checkpoint": checkpoint,
            "content_version": lab.content_version,
            "payload": payload,
        }
    )


def _report(checkpoint: str, result: dict[str, Any], detail: str = "") -> None:
    if result["pending"]:
        mark = "…"
    else:
        mark = "✓" if result["passed"] else "✗"
    said = detail or result["hint"]
    progress = result["progress"]
    line = f"{mark} {checkpoint}"
    if said:
        line += f" — {said}"
    print(
        f"{line} ({progress['passed_required']}/{progress['total_required']} required)"
    )
