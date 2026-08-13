"""Holds `canonicalize` to the committed vectors.

The client, the build and the checkpoint API must agree byte for byte on what
a learner's output canonicalizes to, or a correct answer is graded wrong. The
vectors in canon_vectors.json are that agreement; any implementation of the
contract runs this against its own.

    uv run --no-project --with numpy --with pyyaml python check_canon_vectors.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from distill_capture import canonicalize  # noqa: E402 — needs the path above

cases = json.loads((Path(__file__).parent / "canon_vectors.json").read_text())["cases"]
failures = []
for case in cases:
    arrays = case["arrays"]
    output = tuple(arrays) if case["as_tuple"] else arrays[0]
    actual = canonicalize(output, case["atol"])
    if actual != case["expected"]:
        failures.append(f"{case['name']}: expected {case['expected']}, got {actual}")

if failures:
    for failure in failures:
        print(failure, file=sys.stderr)
    sys.exit(f"canonicalization: {len(failures)} of {len(cases)} vectors failed")
print(f"canonicalization: {len(cases)} vectors match")
