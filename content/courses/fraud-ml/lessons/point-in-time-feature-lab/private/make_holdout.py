"""Regenerates the hold-out log: data/holdout_log.csv.gz (published) and
private/holdout_y.csv (the labels of its last week, which the metric
checkpoint grades).

Run from the lesson directory: `uv run python private/make_holdout.py`.
Lives in private/ because the seed is the answer key: the generator is
public in the notebook, so whoever has the seed has the labels.
"""

import re
from pathlib import Path

import numpy as np

# A 63-bit draw from secrets.randbits: a small seed is found by looping
# simulate(0), simulate(1), ... against the published log. Weeks vary (the
# reference's lift over the 18 columns ran 0.03-0.06 across twelve draws);
# this one sits mid-range, so the bar measures the task, not the week.
SEED = 395321410675246473
FIRST_UNLABELLED_DAY = 53   # labels arrive 7 days late: the last week has none

# The generator is the notebook's own infrastructure cell, executed from
# solution.py so the two can never drift apart.
source = Path("solution.py").read_text()
cell = next(c for c in re.split(r"^# %%.*$", source, flags=re.M) if "def simulate(" in c)
infra = cell.split("\nstream = simulate(")[0]
ns: dict = {}
exec("import numpy as np\nimport pandas as pd\nDAY = 86400\n" + infra, ns)

log = ns["simulate"](SEED)
week = log.TX_TIME_DAYS.to_numpy() >= FIRST_UNLABELLED_DAY
labels = log.TX_FRAUD.to_numpy()[week]
published = log[["TX_DATETIME", "CUSTOMER_ID", "TERMINAL_ID", "TX_TYPE", "TX_COUNTRY", "TX_AMOUNT", "TX_FRAUD"]].copy()
published["TX_FRAUD"] = published.TX_FRAUD.astype("Int64")
published.loc[week, "TX_FRAUD"] = None
published.to_csv("data/holdout_log.csv.gz", index=False,
                 compression={"method": "gzip", "mtime": 0})
np.savetxt("private/holdout_y.csv", labels, fmt="%d")
print(f"{len(log):,} payments, {week.sum():,} in the unlabelled week, {int(labels.sum())} fraud")
