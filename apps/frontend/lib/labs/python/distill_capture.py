"""Capture-mode `distill`: records reference outputs instead of posting them.

The lab build copies this next to a solution as `distill.py`, so the solution
runs unchanged while every `check`/`submit_predictions`/`submit_review` call
records what the reference produces. The authoring loop uses the same file
(`cp .../distill_capture.py distill.py`), which is why a lab green in the loop
is green in the build: it is the same code, not a re-implementation.

    cd <lesson dir>; cp <this file> distill.py
    uv run --with pyyaml python solution.py
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from types import FunctionType
from typing import Any

import numpy as np
import yaml

_challenges: dict[str, dict[str, Any]] | None = None
_captured: dict[str, dict[str, Any]] = {}
_passed: list[str] = []

# Canonicalization per the lab conventions — shared verbatim with the server
# compare and the client. canon_vectors.json pins it for both.
SMALL_LIMIT = 64

# A reference that only just clears the threshold means the threshold is
# uncalibrated: the learner would be chasing the author's noise.
METRIC_MARGIN = 0.02


def challenges() -> dict[str, dict[str, Any]]:
    global _challenges
    if _challenges is None:
        _challenges = yaml.safe_load(Path("challenges.yaml").read_text())["checkpoints"]
    return _challenges


class CanonicalizationError(ValueError):
    """An output canonicalization cannot represent; the lab's author must fix it."""


def canonicalize(out: Any, atol: float) -> dict[str, Any]:
    arrays = out if isinstance(out, tuple) else (out,)
    parts = [np.ascontiguousarray(np.asarray(a, dtype=np.float64)) for a in arrays]
    for p in parts:
        if not np.isfinite(p).all():
            raise CanonicalizationError(
                "output holds NaN or an infinity: neither compares equal to itself, "
                "so no reference built from it can be matched"
            )
    total = sum(p.size for p in parts)
    if total <= SMALL_LIMIT:
        return {"values": [p.tolist() for p in parts]}
    h = hashlib.sha256()
    for p in parts:
        # Past int64 the quantized values saturate and every such output
        # collides on one digest — silently grading wrong answers right.
        if p.size and np.abs(p / atol).max() >= 2**63:
            raise CanonicalizationError(
                f"output exceeds the quantization range: |x| must stay under "
                f"{2**63 * atol:.3g} at atol={atol:g}"
            )
        q = np.round(p / atol).astype(np.int64)
        h.update(str(p.shape).encode() + b"f8" + q.tobytes())
    return {"digest": h.hexdigest()}


def _inputs(spec: dict[str, Any]) -> tuple:
    ns: dict[str, Any] = {"rng": np.random.default_rng(spec["seed"]), "np": np}
    exec(spec["inputs_code"], ns)  # noqa: S102 — author's own code, build-time only
    return ns["inputs"]


def open_lab(slug: str) -> None:
    print(f"[capture] {slug}: {len(challenges())} checkpoints declared")


def check(cid: str, fn: Any) -> None:
    spec = challenges()[cid]
    assert spec["kind"] == "exact", f"{cid}: declared {spec['kind']}, checked as exact"
    atol = float(spec["atol"])
    expected = canonicalize(fn(*_inputs(spec)), atol)
    wrong = []
    for variant in spec.get("wrong", []):
        ns: dict[str, Any] = {}
        exec(variant["code"], ns)  # noqa: S102
        # The last def wins: the variant may import names above it.
        wfn = [v for v in ns.values() if isinstance(v, FunctionType)][-1]
        w = canonicalize(wfn(*_inputs(spec)), atol)
        assert w != expected, f"{cid}: wrong variant '{variant['hint']}' matches the solution"
        wrong.append({"hint": variant["hint"], **w})
    _captured[cid] = {"kind": "exact", "atol": atol, "expected": expected, "wrong": wrong}
    _passed.append(cid)
    print(f"✓ {cid} ({len(_passed)}/{len(challenges())})")


def submit_predictions(cid: str, preds: Any) -> None:
    spec = challenges()[cid]
    ns: dict[str, Any] = {"np": np}
    exec(spec["labels_code"], ns)  # noqa: S102
    labels = np.asarray(ns["labels"], dtype=np.float64)
    p = np.asarray(preds, dtype=np.float64)
    score = _METRICS[spec["metric"]](labels, p)
    margin = score - float(spec["threshold"])
    _captured[cid] = {"kind": "metric", **{k: spec[k] for k in ("metric", "threshold")},
                      "labels": labels.tolist(), "reference_score": score}
    assert margin >= METRIC_MARGIN, (
        f"{cid}: reference {score:.4f} vs threshold {spec['threshold']} "
        f"(margin {margin:+.4f}, need ≥ +{METRIC_MARGIN})"
    )
    _passed.append(cid)
    print(f"✓ {cid}: reference {score:.4f} vs threshold {spec['threshold']} "
          f"(margin {margin:+.4f})")


def submit_review(cid: str, text: str) -> None:
    spec = challenges()[cid]
    _captured[cid] = {"kind": "review", "rubric": spec["rubric"], "model_answer": text}
    _passed.append(cid)
    print(f"✓ {cid} (review: model answer recorded, {len(text)} chars)")


def dump(path: str = "captured.json") -> None:
    missing = set(challenges()) - set(_captured)
    assert not missing, f"declared but never checked: {sorted(missing)}"
    Path(path).write_text(json.dumps(_captured, indent=2))
    print(f"[capture] all {len(_captured)} checkpoints green → {path}")


def _roc_auc(y: np.ndarray, p: np.ndarray) -> float:
    # Midranks, not positions: tied predictions must share the average of the
    # ranks they span, or a constant prediction would score anything but 0.5.
    _, inverse, counts = np.unique(p, return_inverse=True, return_counts=True)
    ends = np.cumsum(counts)
    # `ravel` because numpy 2.0 shaped the inverse like the input, 2.1 flat.
    ranks = (((ends - counts) + ends + 1) / 2)[inverse.ravel()]
    pos = y == 1
    n1, n0 = pos.sum(), (~pos).sum()
    return float((ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


_METRICS = {
    "roc_auc": _roc_auc,
    "accuracy": lambda y, p: float(np.mean((p >= 0.5) == (y == 1))),
    "rmse": lambda y, p: float(-np.sqrt(np.mean((y - p) ** 2))),  # negated: higher = better
}
