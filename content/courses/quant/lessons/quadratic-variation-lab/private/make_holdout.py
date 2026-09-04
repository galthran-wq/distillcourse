"""Generate the metric checkpoint's held-out paths.

`data/holdout_paths.csv` (public): discretely observed GBM prices in long
format — columns `path`, `t`, `S` — with the observation count and horizon
varying by path, so nothing about the grid can be assumed. Every recorded
log price carries an independent N(0, ETA²) error, the same ETA for every
path: the feed's noise, which the estimator must model. ETA is private with
the truths — the task states the model, not the level.
`private/holdout_sigma.csv` (never published): the volatility each path was
simulated with, in percent, one row per path in path order.

    uv run python private/make_holdout.py        # from the lesson directory
"""

from pathlib import Path

import numpy as np

N_PATHS = 160
ETA = 0.006
rng = np.random.default_rng(20240904)

rows = []
sigmas = []
for k in range(N_PATHS):
    m = int(rng.integers(80, 401))                  # observations after the first
    T = float(rng.choice([0.25, 0.5, 1.0, 2.0]))
    mu = float(rng.uniform(-0.1, 0.3))
    sigma = float(rng.uniform(0.1, 0.6))
    S0 = float(rng.uniform(10.0, 200.0))
    dt = T / m
    t = np.linspace(0.0, T, m + 1)
    W = np.concatenate([[0.0], np.cumsum(np.sqrt(dt) * rng.standard_normal(m))])
    log_S = np.log(S0) + (mu - 0.5 * sigma**2) * t + sigma * W + ETA * rng.standard_normal(m + 1)
    rows.extend((k, ti, Si) for ti, Si in zip(t, np.exp(log_S)))
    sigmas.append(100.0 * sigma)

here = Path(__file__).resolve().parent.parent
with open(here / "data" / "holdout_paths.csv", "w") as f:
    f.write("path,t,S\n")
    f.writelines(f"{k},{ti:.6f},{Si:.5f}\n" for k, ti, Si in rows)
np.savetxt(here / "private" / "holdout_sigma.csv", np.array(sigmas), fmt="%.6f")
print(f"{N_PATHS} paths, {len(rows)} rows")
