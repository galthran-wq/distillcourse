"""Regenerates the lab's ULB files from the released `creditcard.csv`:
data/ulb_day1.csv.gz (published: day 1 with its labels), data/ulb_shortlist.csv.gz
(published: the hold-out, features only) and private/holdout_y.csv (the
hold-out's labels, which the metric checkpoint grades).

Run from the lesson directory:
    uv run python private/make_data.py /path/to/creditcard.csv

Source: Machine Learning Group, Université Libre de Bruxelles, "Credit Card
Fraud Detection" (https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud,
Open Database License). The file used had sha256 76274b69...98551a89.
"""

import sys

import numpy as np
import pandas as pd

V = [f"V{i}" for i in range(1, 29)]
SHORTLIST = 1000

raw = pd.read_csv(sys.argv[1])
# Three decimals on the components and cents on the amount: the published
# files are fetched on every notebook start, and nothing downstream resolves
# finer than that.
raw[V] = raw[V].round(3)
raw["Amount"] = raw["Amount"].round(2)
raw["Time"] = raw["Time"].astype(np.int64)
day1 = raw[raw.Time < 86_400].reset_index(drop=True)
day2 = raw[raw.Time >= 86_400].reset_index(drop=True)
day1[["Time", *V, "Amount", "Class"]].to_csv(
    "data/ulb_day1.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})

# The shortlist is the notebook's own baseline, computed from the published
# day-1 file: distance from the day-1 mean in day-1 standard deviations, over
# V1-V28 and log(1 + Amount).
def features(frame):
    return np.c_[frame[V].to_numpy(), np.log1p(frame.Amount.to_numpy())]

f1 = features(day1)
z2 = (features(day2) - f1.mean(0)) / f1.std(0)
far = np.argsort(-np.sqrt((z2**2).sum(1)), kind="stable")[:SHORTLIST]
short = day2.iloc[np.sort(far)]
short[["Time", *V, "Amount"]].to_csv(
    "data/ulb_shortlist.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
np.savetxt("private/holdout_y.csv", short.Class.to_numpy(), fmt="%d")
print(f"day 1: {len(day1):,} payments, {day1.Class.sum()} frauds; "
      f"shortlist: {len(short):,} of {len(day2):,} day-2 payments, {short.Class.sum()} frauds")
