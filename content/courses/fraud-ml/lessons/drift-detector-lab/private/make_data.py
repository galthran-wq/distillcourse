"""Regenerates the drifting stream: data/tx_stream.csv.gz (published) and
private/tx_stream_labels.csv (the labels of the graded rows).

Run from the lesson directory: `uv run python private/make_data.py`.
Lives in private/ because the seed is the answer key. Our own implementation
of the rules published in the handbook's Ch. 3 (the handbook's code is GPL v3
and is not copied), thinned to 1,500 customers and 3,000 terminals, with its
compromise scenarios switched on and off by day to plant two concept changes.
"""

import numpy as np
import pandas as pd

SEED = 41873
N_CUSTOMERS, N_TERMINALS, N_DAYS, RADIUS = 1500, 3000, 60, 5.0
TERMINALS_ON_FROM = 25   # first change: terminal compromises begin
METHOD_CHANGE = 45       # second change: card fraud stops being large and goes small and nocturnal
GRADED_FROM = 40
LABEL_DELAY = 7
DAY = 86400

rng = np.random.default_rng(SEED)
cx, cy = rng.uniform(0, 100, (2, N_CUSTOMERS))
mean_amt = rng.uniform(5, 100, N_CUSTOMERS)
rate = rng.uniform(0, 4, N_CUSTOMERS)
tx, ty = rng.uniform(0, 100, (2, N_TERMINALS))
near = [np.flatnonzero((tx - cx[c]) ** 2 + (ty - cy[c]) ** 2 < RADIUS**2) for c in range(N_CUSTOMERS)]
n_near = np.array([len(t) for t in near])

counts = rng.poisson(rate[:, None], size=(N_CUSTOMERS, N_DAYS)).ravel()
cust = np.repeat(np.repeat(np.arange(N_CUSTOMERS), N_DAYS), counts)
day = np.repeat(np.tile(np.arange(N_DAYS), N_CUSTOMERS), counts)
sec = np.clip(rng.normal(DAY / 2, 20000, len(cust)), 0, DAY - 1).astype(np.int64)
amount = rng.normal(mean_amt[cust], mean_amt[cust] / 2)
neg = amount < 0
amount[neg] = rng.uniform(0, 2 * mean_amt[cust[neg]])
keep = n_near[cust] > 0
cust, day, sec, amount = cust[keep], day[keep], sec[keep], amount[keep]
first = np.r_[0, np.cumsum(n_near)[:-1]]
pick = (rng.random(len(cust)) * n_near[cust]).astype(np.int64)
term = np.concatenate(near)[first[cust] + pick]

fraud = amount > 220                                                        # always on
for d0 in range(TERMINALS_ON_FROM, N_DAYS):                                 # first change
    hit = (day >= d0) & (day < d0 + 28) & (term == rng.integers(N_TERMINALS))
    fraud[hit] = True
for d0 in range(N_DAYS):                                                    # card fraud, two methods
    rows = np.flatnonzero((day >= d0) & (day < d0 + 14)
                          & np.isin(cust, rng.choice(N_CUSTOMERS, 3, replace=False)))
    chosen = rows[rng.random(len(rows)) < 1 / 3]
    old = chosen[day[chosen] < METHOD_CHANGE]
    new = chosen[day[chosen] >= METHOD_CHANGE]
    amount[old] *= 5
    amount[new] = rng.uniform(1, 30, len(new))
    sec[new] = rng.integers(0, 6 * 3600, len(new))
    fraud[chosen] = True

amount = np.round(amount, 2)
t = day * DAY + sec
o = np.argsort(t, kind="stable")
cust, day, term, amount, t, fraud = cust[o], day[o], term[o], amount[o], t[o], fraud[o].astype(float)


def window_sum(key, t, values, width, lag=0):
    """Per row of a (key, t)-sorted log: sum of values over the same key in
    [t - lag - width, t - lag), or up to and including the row when lag is 0."""
    composite = key * 10**11 + t
    prefix = np.r_[0.0, np.cumsum(values)]
    side = "right" if lag == 0 else "left"
    return prefix[np.searchsorted(composite, composite - lag, side=side)] \
        - prefix[np.searchsorted(composite, composite - lag - width, side="right")]


features = pd.DataFrame({"TX_AMOUNT": amount})
features["TX_DURING_WEEKEND"] = ((day + 6) % 7 >= 5).astype(np.int64)
features["TX_DURING_NIGHT"] = ((t % DAY) // 3600 < 6).astype(np.int64)
s = np.lexsort((t, cust))
for w in (1, 7, 30):
    n = window_sum(cust[s], t[s], np.ones(len(s)), w * DAY)
    total = window_sum(cust[s], t[s], amount[s], w * DAY)
    features.loc[s, f"CUSTOMER_NB_TX_{w}DAY"] = n
    features.loc[s, f"CUSTOMER_AVG_AMOUNT_{w}DAY"] = np.round(total / n, 2)
s = np.lexsort((t, term))
for w in (1, 7, 30):
    n = window_sum(term[s], t[s], np.ones(len(s)), w * DAY, LABEL_DELAY * DAY)
    f = window_sum(term[s], t[s], fraud[s], w * DAY, LABEL_DELAY * DAY)
    features.loc[s, f"TERMINAL_NB_TX_{w}DAY"] = n
    features.loc[s, f"TERMINAL_RISK_{w}DAY"] = np.round(np.where(n > 0, f / np.maximum(n, 1), 0.0), 4)
for col in features.columns:
    if "_NB_TX_" in col:
        features[col] = features[col].astype(np.int64)

# On each day from day 40 a coin splits the rows: heads are graded and carry no
# label, tails keep theirs, so a learner can still adapt on what comes after.
graded = (day >= GRADED_FROM) & (rng.random(len(day)) < 0.5)
out = pd.DataFrame({"TX_TIME_SECONDS": t, "TX_TIME_DAYS": day, "CUSTOMER_ID": cust, "TERMINAL_ID": term})
out = pd.concat([out, features], axis=1)
out["GRADED"] = graded.astype(np.int64)
out["TX_FRAUD"] = np.where(graded, np.nan, fraud)
out.to_csv("data/tx_stream.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
np.savetxt("private/tx_stream_labels.csv", fraud[graded], fmt="%d")
per_day = pd.Series(fraud).groupby(day).sum()
print(f"{len(out):,} payments, {fraud.mean():.2%} fraud, {graded.sum():,} graded with {int(fraud[graded].sum())} frauds")
print("frauds per day, days 0-24, 25-44, 45-59:", per_day[:25].mean().round(1), per_day[25:45].mean().round(1), per_day[45:].mean().round(1))
