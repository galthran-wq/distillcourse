"""Capture-mode `distill` module for the lab authoring loop.

Import as `distill` next to a lab's solution.py: it reads challenges.yaml,
runs the declared checks against the solution, records reference outputs, and
prints verdicts. It is also the executable spec for the build pipeline's
capture stub (#96): same declaration API, same canonicalization.

Usage inside the loop:
    cd <lesson dir>; cp <skill>/references/author_stub.py distill.py
    uv run --with-requirements requirements.txt --with pyyaml python solution.py
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import yaml

_CHALLENGES = yaml.safe_load(Path("challenges.yaml").read_text())["checkpoints"]
_captured: dict[str, dict[str, Any]] = {}
_passed: list[str] = []

# Canonicalization per conventions.md — shared with server compare and client.
SMALL_LIMIT = 64


def _canon(out: Any, atol: float) -> dict[str, Any]:
    arrays = out if isinstance(out, tuple) else (out,)
    parts = [np.ascontiguousarray(np.asarray(a, dtype=np.float64)) for a in arrays]
    total = sum(p.size for p in parts)
    if total <= SMALL_LIMIT:
        return {"values": [p.tolist() for p in parts]}
    h = hashlib.sha256()
    for p in parts:
        q = np.round(p / atol).astype(np.int64)
        h.update(str(p.shape).encode() + b"f8" + q.tobytes())
    return {"digest": h.hexdigest()}


def _inputs(spec: dict[str, Any]) -> tuple:
    ns: dict[str, Any] = {"rng": np.random.default_rng(spec["seed"]), "np": np}
    exec(spec["inputs_code"], ns)  # noqa: S102 — author's own code, build-time only
    return ns["inputs"]


def open_lab(slug: str) -> None:
    print(f"[author mode] {slug}: {len(_CHALLENGES)} checkpoints declared")


def check(cid: str, fn: Any) -> None:
    spec = _CHALLENGES[cid]
    assert spec["kind"] == "exact", f"{cid}: declared {spec['kind']}, checked as exact"
    atol = float(spec["atol"])
    expected = _canon(fn(*_inputs(spec)), atol)
    wrong = []
    for variant in spec.get("wrong", []):
        ns: dict[str, Any] = {}
        exec(variant["code"], ns)  # noqa: S102
        wfn = next(v for v in ns.values() if callable(v))
        w = _canon(wfn(*_inputs(spec)), atol)
        assert w != expected, f"{cid}: wrong variant '{variant['hint']}' matches the solution"
        wrong.append({"hint": variant["hint"], **w})
    _captured[cid] = {"kind": "exact", "atol": atol, "expected": expected, "wrong": wrong}
    _passed.append(cid)
    print(f"✓ {cid} ({len(_passed)}/{len(_CHALLENGES)})")


def submit_predictions(cid: str, preds: Any) -> None:
    spec = _CHALLENGES[cid]
    ns: dict[str, Any] = {"np": np}
    exec(spec["labels_code"], ns)  # noqa: S102
    labels = np.asarray(ns["labels"], dtype=np.float64)
    p = np.asarray(preds, dtype=np.float64)
    score = _METRICS[spec["metric"]](labels, p)
    margin = score - float(spec["threshold"])
    _captured[cid] = {"kind": "metric", **{k: spec[k] for k in ("metric", "threshold")},
                      "labels": labels.tolist(), "reference_score": score}
    ok = margin >= 0.02
    print(f"{'✓' if ok else '✗'} {cid}: reference {score:.4f} vs threshold "
          f"{spec['threshold']} (margin {margin:+.4f}, need ≥ +0.02)")
    if not ok:
        sys.exit(1)
    _passed.append(cid)


def submit_review(cid: str, text: str) -> None:
    spec = _CHALLENGES[cid]
    _captured[cid] = {"kind": "review", "rubric": spec["rubric"], "model_answer": text}
    _passed.append(cid)
    print(f"✓ {cid} (review: model answer recorded, {len(text)} chars)")


def dump(path: str = "captured.json") -> None:
    missing = set(_CHALLENGES) - set(_captured)
    assert not missing, f"declared but never checked: {sorted(missing)}"
    Path(path).write_text(json.dumps(_captured, indent=2))
    print(f"[author mode] all {len(_captured)} checkpoints green → {path}")


def _roc_auc(y: np.ndarray, p: np.ndarray) -> float:
    order = np.argsort(p)
    ranks = np.empty(len(p))
    ranks[order] = np.arange(1, len(p) + 1)
    pos = y == 1
    n1, n0 = pos.sum(), (~pos).sum()
    return float((ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


_METRICS = {
    "roc_auc": _roc_auc,
    "accuracy": lambda y, p: float(np.mean((p >= 0.5) == (y == 1))),
    "rmse": lambda y, p: float(-np.sqrt(np.mean((y - p) ** 2))),  # negated: higher = better
}
