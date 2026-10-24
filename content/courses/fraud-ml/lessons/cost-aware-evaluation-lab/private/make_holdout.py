"""Regenerates the hold-out week: data/holdout_week.csv.gz (published) and
private/holdout_y.csv (the card-day labels the metric checkpoint grades).

Run from the lesson directory: `uv run python private/make_holdout.py`.
Lives in private/ because the seed is the answer key: the simulator is public
in the notebook, so whoever has the seed has the labels.
"""

import re
from pathlib import Path

import numpy as np

SEED = 90417

# The simulator and feature builder are the notebook's own infrastructure
# cell, executed from solution.py so the two can never drift apart.
source = Path("solution.py").read_text()
cell = next(c for c in re.split(r"^# %%.*$", source, flags=re.M)
            if "def simulate(" in c and "def build_features(" in c)
infra = cell.split("\nstream = simulate(")[0]
ns: dict = {}
exec("import numpy as np\nimport pandas as pd\n" + infra, ns)

stream = ns["simulate"](SEED)
features = ns["build_features"](stream)
days, cards, y = (stream[c].to_numpy() for c in ("TX_TIME_DAYS", "CUSTOMER_ID", "TX_FRAUD"))

# The deployment geometry of the notebook: train 42-48, delay 49-55, test
# 56-62, known cards removed per test day (fraud on a day in [42, d - 8]).
scored = np.zeros(len(stream), dtype=bool)
for d in range(56, 63):
    known = cards[(y == 1) & (days >= 42) & (days <= d - 8)]
    scored |= (days == d) & ~np.isin(cards, known)

week = features[scored].copy()
week.insert(0, "CUSTOMER_ID", cards[scored])
week.insert(0, "TX_TIME_DAYS", days[scored])
# Counts are integers, amounts cents, rates four decimals: the file is
# published to the mirror and fetched on every notebook start.
for col in week.columns:
    if "_NB_TX_" in col or col.startswith(("TX_DURING", "TX_TIME", "CUSTOMER_ID")):
        week[col] = week[col].astype(np.int64)
    elif "RISK" in col:
        week[col] = week[col].round(4)
    else:
        week[col] = week[col].round(2)
week.to_csv("data/holdout_week.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})

labels = (week.assign(y=y[scored]).groupby(["TX_TIME_DAYS", "CUSTOMER_ID"], sort=True).y.max())
np.savetxt("private/holdout_y.csv", labels.to_numpy(), fmt="%d")
print(f"{scored.sum():,} payments, {len(labels):,} card-days, {labels.sum()} compromised")
