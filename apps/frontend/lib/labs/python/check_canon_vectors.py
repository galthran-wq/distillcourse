"""Holds `canonicalize` to the committed vectors.

The client, the build and the checkpoint API must agree byte for byte on what
a learner's output canonicalizes to, or a correct answer is graded wrong. The
vectors in canon_vectors.json are that agreement; any implementation of the
contract runs this against its own. A case carrying `"rejects": true` instead
of an `expected` must be refused, not canonicalized — an output no digest can
distinguish is a build failure, never a value.

    uv run --no-project --with numpy --with pyyaml python check_canon_vectors.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from distill_capture import (  # noqa: E402 — needs the path above
    CanonicalizationError,
    canonicalize,
)

# JSON has no literal for these, and the vectors stay parsable by every client.
SPECIAL = {"NaN": float("nan"), "Infinity": float("inf"), "-Infinity": float("-inf")}


def revive(value: Any) -> Any:
    if isinstance(value, str):
        return SPECIAL[value]
    if isinstance(value, list):
        return [revive(item) for item in value]
    return value


cases = json.loads((Path(__file__).parent / "canon_vectors.json").read_text())["cases"]
failures = []
for case in cases:
    arrays = revive(case["arrays"])
    output = tuple(arrays) if case["as_tuple"] else arrays[0]
    try:
        actual = canonicalize(output, case["atol"])
    except CanonicalizationError as exc:
        if not case.get("rejects"):
            failures.append(f"{case['name']}: rejected — {exc}")
        continue
    if case.get("rejects"):
        failures.append(f"{case['name']}: expected a rejection, got {actual}")
    elif actual != case["expected"]:
        failures.append(f"{case['name']}: expected {case['expected']}, got {actual}")

if failures:
    for failure in failures:
        print(failure, file=sys.stderr)
    sys.exit(f"canonicalization: {len(failures)} of {len(cases)} vectors failed")
print(f"canonicalization: {len(cases)} vectors match")
