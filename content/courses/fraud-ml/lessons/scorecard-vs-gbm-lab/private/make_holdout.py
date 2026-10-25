"""Regenerates the hold-out week: data/holdout_week.csv.gz (published) and
private/holdout_y.csv (the card-day labels the metric checkpoint grades).

Run from the lesson directory: `uv run python private/make_holdout.py`.
Lives in private/ because the seed is the answer key: the generator is
public in the notebook, so whoever has the seed has the labels.
"""

import re
from pathlib import Path

import numpy as np

# A 63-bit draw from secrets.randbits: a small seed is found by looping
# simulate(0), simulate(1), ... against the published week.
SEED = 1672966583500528340

# The generator and the feature builder are the notebook's own
# infrastructure cells, executed from solution.py so they cannot drift apart.
source = Path("solution.py").read_text()
cells = re.split(r"^# %%.*$", source, flags=re.M)
generator = next(c for c in cells if "def simulate(" in c)
builder = next(c for c in cells if "def build_feature_matrix(" in c).split("\nstream = simulate(")[0]
ns: dict = {}
exec("import numpy as np\nimport pandas as pd\nDAY = 86400\n" + generator + builder, ns)

log = ns["simulate"](SEED)
features = ns["build_feature_matrix"](log)
days, cards, y = (log[c].to_numpy() for c in ("TX_TIME_DAYS", "CUSTOMER_ID", "TX_FRAUD"))

# The notebook's deployment geometry: train 39-45, delay 46-52, test 53-59,
# known cards removed per test day (fraud on a day in [39, d - 8]).
scored = np.zeros(len(log), dtype=bool)
for d in range(53, 60):
    known = cards[(y == 1) & (days >= 39) & (days <= d - 8)]
    scored |= (days == d) & ~np.isin(cards, known)

week = features[scored].copy()
week.insert(0, "CUSTOMER_ID", cards[scored])
week.insert(0, "TX_TIME_DAYS", days[scored])
# Counts are integers, amounts cents, rates and ratios four decimals: the
# file is fetched on every notebook start.
for col in week.columns:
    if "_NB_TX_" in col or col in ("TX_TIME_DAYS", "CUSTOMER_ID"):
        week[col] = week[col].astype(np.int64)
    elif "RISK" in col or col in ("AMOUNT_TO_AVG_30DAY", "HOUR_DEVIATION_30DAY"):
        week[col] = week[col].round(4)
    elif week[col].dtype.kind == "f":
        week[col] = week[col].round(2)
week.to_csv("data/holdout_week.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})

labels = week.assign(y=y[scored]).groupby(["TX_TIME_DAYS", "CUSTOMER_ID"], sort=True).y.max()
np.savetxt("private/holdout_y.csv", labels.to_numpy(), fmt="%d")
print(f"{scored.sum():,} payments, {len(labels):,} card-days, {int(labels.sum())} compromised")
