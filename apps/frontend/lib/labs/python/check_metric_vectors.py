"""Holds the build's metrics to the committed vectors.

The build calibrates a `metric` checkpoint's threshold with the numpy formulas
in `distill_capture.py`; the checkpoint API grades the learner against it with
the pure-Python ones in `app/labs/verify.py`. Neither end can import the other
— one runs inside the lab's own uv environment — so `metric_vectors.json` is
the agreement, and both run it. Drift between them fails a learner whose
predictions genuinely clear the bar the author set.

    uv run --no-project --with numpy --with pyyaml python check_metric_vectors.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from distill_capture import _METRICS  # noqa: E402 — needs the path above

import numpy as np  # noqa: E402

vectors = json.loads((Path(__file__).parent / "metric_vectors.json").read_text())
atol = float(vectors["atol"])
failures = []
for case in vectors["cases"]:
    score = _METRICS[case["metric"]](
        np.asarray(case["labels"], dtype=np.float64),
        np.asarray(case["predictions"], dtype=np.float64),
    )
    if abs(score - case["score"]) > atol:
        failures.append(f"{case['name']}: expected {case['score']!r}, got {score!r}")

if failures:
    for failure in failures:
        print(failure, file=sys.stderr)
    sys.exit(f"metrics: {len(failures)} of {len(vectors['cases'])} vectors failed")
print(f"metrics: {len(vectors['cases'])} vectors match")
