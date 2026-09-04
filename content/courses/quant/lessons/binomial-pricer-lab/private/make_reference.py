"""The fine-grid reference for the open task: `reference_prices.csv`.

Each American put in `data/holdout_puts.csv` is priced on a CRR lattice of
40,000 and of 40,001 steps and the two values averaged — adjacent step counts
sit on opposite sides of the sawtooth, so the average cancels most of the
oscillation. Measured against the same average at 80,000 and 80,001 steps,
the reference is within about 0.001 cents of the limit on every put; the
checkpoint's threshold is four times that. The pass keeps only one date's
values in memory, which is why it is a separate implementation from the
lab's lattice-storing pricer.

    uv run python private/make_reference.py    # from the lesson directory
"""

import numpy as np


def american_put(S0: float, K: float, r: float, sigma: float, T: float, n: int) -> float:
    dt = T / n
    u = np.exp(sigma * np.sqrt(dt))
    d = 1 / u
    growth = np.exp(r * dt)
    p = (growth - d) / (u - d)
    j = np.arange(n + 1)
    S = S0 * u**j * d ** (n - j)
    V = np.maximum(K - S, 0.0)
    for _ in range(n):
        S = S[:-1] * u  # date i's node j is date i+1's node j divided by d
        V = np.maximum(K - S, (p * V[1:] + (1 - p) * V[:-1]) / growth)
    return float(V[0])


rows = np.loadtxt("data/holdout_puts.csv", delimiter=",", skiprows=1)
prices = [(american_put(*row, 40000) + american_put(*row, 40001)) / 2 for row in rows]
np.savetxt("private/reference_prices.csv", prices, fmt="%.8f")
print(np.round(prices, 6))
