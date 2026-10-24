# %% [markdown]
# # Lab: a point-in-time feature pipeline
#
# The lab builds the feature pipeline: windowed aggregates over each
# entity's past, conditional sums, a terminal risk shifted by the label delay
# and a circular time feature, joined onto every scoring row as of its own
# timestamp — and a shipped reference pipeline hides one leak for the
# learner to find.
#
# Three lessons stated the rules: a card's windows hold only its strictly
# earlier payments, a feature built from labels reads only the labels that
# had arrived by the row's moment, and a stored value is attached as of the
# row's timestamp, never as of today. None of it is code yet, and a training
# table that breaks one of the rules looks exactly like one that keeps them:
# same columns, plausible numbers, and a better offline score.
#
# You write six functions, one per checkpoint: `calendar_flags`,
# `customer_windows` (around a helper, `past_window_sum`, that the next
# checkpoint reuses), `conditional_aggregates`, `terminal_risk_delayed`,
# `periodic_time_flag` and `point_in_time_join`. A shipped
# `build_feature_matrix` then calls all six to turn a raw transaction log
# into an 18-column matrix, one row per payment. At the end a second,
# shipped pipeline produces a matrix that looks the same and scores better
# offline; one of its columns reads the future, and finding it is the
# written task. The last, open task feeds your matrix, plus any columns you
# add, to a frozen logistic regression and grades it on a week whose labels
# nobody has yet.
#
# Ground rules:
#
# - Inside the six graded functions, numpy and pandas only. `merge_asof`
#   and `rolling` are allowed; so is checking your function against them.
# - The generator, the loaders, `build_feature_matrix`, the reference
#   pipeline, the plotting helpers and the frozen model ship complete. They
#   are infrastructure: read them, do not edit them.
# - The six exact checkpoints are the required set. The written answer and
#   the open task are optional; partial completion is a normal way to finish.

# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.special import i0e, i1e
from scipy.stats import vonmises
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

import distill

distill.open_lab("fraud-ml/point-in-time-feature-lab")

DAY = 86400

# %% [markdown]
# ## The log: a simulated card network with types, countries and habits
#
# Every function below runs on a raw transaction log: one row per card
# payment, with its timestamp, card, terminal, type, country, amount and
# label. The generator is the course's card-network simulator, rewritten
# from its stated rules (see References), with three additions so that
# every feature in this lab has something to find:
#
# - 1,000 cardholders and 2,000 terminals on a 100 × 100 grid; a cardholder
#   pays at terminals within distance 5, a Poisson number of times a day
#   (mean drawn between 0 and 4), amounts normal around a personal mean
#   between €5 and €100. The grid's four quadrants are four countries (BE,
#   NL, DE, FR).
# - **Types.** A payment is `POS` (at a shop's terminal), `ATM` (a cash
#   withdrawal, one physical payment in ten) or `ONLINE`: each card pays
#   online with its own probability, up to 25%, at one of three favourite
#   web merchants. The 100 web merchants are terminals too (ids 2000–2099),
#   each registered in one of six countries (the four plus GB and US).
# - **Habits.** Each card pays at its own hours: the clock time of a
#   payment is drawn from a von Mises distribution around a personal hour,
#   with a personal concentration between 1.5 and 6.
#
# Three fraud scenarios run on top: any payment above €220 is fraud; every
# day one physical terminal is compromised and every payment on it for the
# next 28 days is fraud; every day two cards leak, and for the next 14 days
# a third of their payments are fraud, made at the fraudster's hours
# (uniform over the day), and four in five of them online at a random web
# merchant. The amounts of leaked-card frauds are the owner's usual amounts:
# nothing in a single row gives them away.
#
# 60 days from Sunday 1 April 2018, about 118,000 payments, 1.9% fraud.
# Labels arrive seven days after the payment: the label delay $\delta$ of
# the whole lab is 7 days.

# %%
# Infrastructure (do not modify): the generator and the loader.
COUNTRIES = np.array(["BE", "NL", "DE", "FR", "GB", "US"])
TYPES = np.array(["POS", "ATM", "ONLINE"])
EPOCH = pd.Timestamp("2018-04-01")


def simulate(seed, n_customers=1000, n_terminals=2000, n_web=100, n_days=60, radius=5.0):
    """One run of the generator; rows sorted by time."""
    rng = np.random.default_rng(seed)
    cx, cy = rng.uniform(0, 100, (2, n_customers))
    mean_amt = rng.uniform(5, 100, n_customers)
    rate = rng.uniform(0, 4, n_customers)
    habit = rng.uniform(0, 2 * np.pi, n_customers)
    conc = rng.uniform(1.5, 6.0, n_customers)
    p_online = rng.uniform(0, 0.25, n_customers)
    tx, ty = rng.uniform(0, 100, (2, n_terminals))
    t_country = (tx >= 50).astype(int) + 2 * (ty >= 50).astype(int)
    w_country = rng.integers(0, 6, n_web)
    favourite = rng.integers(0, n_web, (n_customers, 3))
    near = [np.flatnonzero((tx - cx[c]) ** 2 + (ty - cy[c]) ** 2 < radius**2)
            for c in range(n_customers)]
    n_near = np.array([len(t) for t in near])

    counts = rng.poisson(rate[:, None], size=(n_customers, n_days)).ravel()
    cust = np.repeat(np.repeat(np.arange(n_customers), n_days), counts)
    day = np.repeat(np.tile(np.arange(n_days), n_customers), counts)
    angle = rng.vonmises(habit[cust], conc[cust]) % (2 * np.pi)
    sec = (angle / (2 * np.pi) * DAY).astype(np.int64)
    amount = rng.normal(mean_amt[cust], mean_amt[cust] / 2)
    neg = amount < 0
    amount[neg] = rng.uniform(0, 2 * mean_amt[cust[neg]])
    keep = n_near[cust] > 0
    cust, day, sec, amount = cust[keep], day[keep], sec[keep], amount[keep]
    first = np.r_[0, np.cumsum(n_near)[:-1]]
    pick = (rng.random(len(cust)) * n_near[cust]).astype(np.int64)
    term = np.concatenate(near)[first[cust] + pick]
    kind = np.where(rng.random(len(cust)) < 0.1, 1, 0)
    web = rng.random(len(cust)) < p_online[cust]
    kind[web] = 2
    term[web] = n_terminals + favourite[cust[web], rng.integers(0, 3, web.sum())]
    country = np.where(term < n_terminals, t_country[np.minimum(term, n_terminals - 1)],
                       w_country[np.maximum(term - n_terminals, 0)])

    t = day * DAY + sec
    o = np.argsort(t, kind="stable")
    cust, day, term, amount, t, kind, country = (a[o] for a in (cust, day, term, amount, t, kind, country))
    amount = np.round(amount, 2)
    fraud = (amount > 220).astype(np.int64)                                  # scenario 1
    scenario = fraud.copy()
    for d0 in range(n_days):                                                  # scenario 2
        hit = (day >= d0) & (day < d0 + 28) & np.isin(term, rng.choice(n_terminals, 1, replace=False))
        fraud[hit], scenario[hit] = 1, 2
    for d0 in range(n_days):                                                  # scenario 3
        rows = np.flatnonzero((day >= d0) & (day < d0 + 14)
                              & np.isin(cust, rng.choice(n_customers, 2, replace=False)))
        chosen = rng.choice(rows, len(rows) // 3, replace=False)
        t[chosen] = day[chosen] * DAY + rng.integers(0, DAY, len(chosen))
        online = chosen[rng.random(len(chosen)) < 0.8]
        term[online] = n_terminals + rng.integers(0, n_web, len(online))
        kind[online] = 2
        country[online] = w_country[term[online] - n_terminals]
        fraud[chosen], scenario[chosen] = 1, 3
    o = np.argsort(t, kind="stable")
    return pd.DataFrame({
        "TX_DATETIME": EPOCH + pd.to_timedelta(t[o], unit="s"),
        "TX_TIME_SECONDS": t[o], "TX_TIME_DAYS": t[o] // DAY,
        "CUSTOMER_ID": cust[o], "TERMINAL_ID": term[o],
        "TX_TYPE": TYPES[kind[o]], "TX_COUNTRY": COUNTRIES[country[o]],
        "TX_AMOUNT": amount[o], "TX_FRAUD": fraud[o].astype(float),
        "TX_FRAUD_SCENARIO": scenario[o]})


stream = simulate(seed=0)
print(f"{len(stream):,} payments, {stream.TX_FRAUD.mean():.2%} fraud; by scenario:",
      stream.TX_FRAUD_SCENARIO.value_counts().sort_index().to_dict())
stream.head()

# %% [markdown]
# ## 1. Calendar flags
#
# Two features read the timestamp alone and mean the same for every card:
# whether the payment falls on a weekend (Saturday or Sunday) and whether it
# falls at night, which in this course means **before 06:00**. A payment at
# 06:00:00 is a morning payment.
#
# 1 April 2018 was a Sunday, so day 0 of the log is a weekend day.

# %%
def calendar_flags(timestamps):
    """Weekend and night flags.

    Args:
        timestamps: (n,) array of numpy datetime64 (or anything
            pd.to_datetime accepts).
    Returns:
        (weekend, night): two (n,) int arrays of 0/1. weekend is 1 on
        Saturday and Sunday; night is 1 when the clock time is before 06:00.
    """
    # BEGIN SOLUTION
    ts = pd.DatetimeIndex(pd.to_datetime(timestamps))
    weekend = (ts.dayofweek >= 5).astype(np.int64)
    night = (ts.hour < 6).astype(np.int64)
    return np.asarray(weekend), np.asarray(night)
    # END SOLUTION

# %%
_ts = np.array(["2018-04-01T12:00", "2018-04-30T05:59:59", "2018-05-01T06:00",
                "2018-09-29T23:59", "2018-09-30T00:00"], dtype="datetime64[s]")
_we, _ni = calendar_flags(_ts)
assert _we.tolist() == [1, 0, 0, 1, 1]   # Sun, Mon, Tue, Sat, Sun
assert _ni.tolist() == [0, 1, 0, 0, 1]   # 06:00:00 is not night

# %%
distill.check("calendar-flags", calendar_flags)

# %% [markdown]
# ## 2. A card's windows over strictly earlier payments
#
# The aggregates lesson defined the windowed count and sum of payment $i$
# over its entity's payments **strictly before it** and less than $w$
# earlier:
#
# $$N_w(i) = \#\{ j : e_j = e_i,\ t_i - w < t_j < t_i \}, \qquad
#   S_w(i) = \sum_{j:\ e_j = e_i,\ t_i - w < t_j < t_i} \mathrm{Amt}_j ,$$
#
# with mean amount $M_w = S_w / N_w$, set to 0 when $N_w = 0$. Both edges
# are open. The payment itself is not in its own window, and neither is
# another payment of the same card **at the same second**: it is not
# earlier. A payment exactly $w$ before is outside.
#
# Write it as a helper first, `past_window_sum`, for any key and any column
# of values; `customer_windows` then calls it six times. The next checkpoint
# calls the same helper with a different key. Do not assume the rows arrive
# sorted: the checker shuffles them, and the output must stay in the input
# order.
#
# The direct computation, a filter per row, is quadratic and will not finish
# on the full log. One sort by (key, time) and a cumulative sum make every
# window a difference of two prefix sums; `np.searchsorted` finds the two
# ends.

# %%
def past_window_sum(key, t, values, width):
    """Sum of `values` over the same key's rows strictly earlier than each
    row and less than `width` earlier.

    Args:
        key: (n,) int entity id of each row.
        t: (n,) int timestamp in seconds.
        values: (n,) float values to sum.
        width: window length in seconds.
    Returns:
        (n,) float array in input order: for row i, the sum of values[j]
        over rows j with key[j] == key[i] and t[i] - width < t[j] < t[i].
    """
    # BEGIN SOLUTION
    key = np.asarray(key, dtype=np.int64)
    t = np.asarray(t, dtype=np.int64)
    values = np.asarray(values, dtype=float)
    order = np.lexsort((t, key))
    # One sorted axis for (key, time): keys never collide across the offset.
    composite = key[order] * 10**11 + t[order]
    prefix = np.r_[0.0, np.cumsum(values[order])]
    end = np.searchsorted(composite, composite, side="left")
    start = np.searchsorted(composite, composite - width, side="right")
    out = np.empty(len(order))
    out[order] = prefix[end] - prefix[start]
    return out
    # END SOLUTION


def customer_windows(card, t, amount):
    """Count and mean amount over the card's previous 1, 7 and 30 days.

    Args:
        card: (n,) int card id.
        t: (n,) int timestamp in seconds; rows in any order.
        amount: (n,) float amount.
    Returns:
        (n, 6) float array in input order, columns
        [N_1d, M_1d, N_7d, M_7d, N_30d, M_30d]; M is 0 where N is 0.
    """
    # BEGIN SOLUTION
    cols = []
    for w in (1, 7, 30):
        n = past_window_sum(card, t, np.ones(len(card)), w * DAY)
        s = past_window_sum(card, t, amount, w * DAY)
        cols += [n, np.where(n > 0, s / np.maximum(n, 1), 0.0)]
    return np.column_stack(cols)
    # END SOLUTION

# %% [markdown]
# The local referee is the seven-payment card of the aggregates lesson,
# 1–3 January, 24-hour window. Its $N_{24h}$ and $S_{24h}$ are
# (0, 0), (1, 250), (2, 650), (3, 900), (3, 700), (2, 150), (3, 300).

# %%
SEVEN = pd.DataFrame({
    "time": pd.to_datetime(["2018-01-01 18:20", "2018-01-01 20:35", "2018-01-01 22:30",
                            "2018-01-02 00:50", "2018-01-02 19:18", "2018-01-02 23:45",
                            "2018-01-03 00:00"]),
    "type": ["POS", "POS", "ATM", "POS", "POS", "POS", "POS"],
    "country": ["LU", "LU", "LU", "DE", "DE", "DE", "LU"],
    "amount": [250.0, 400.0, 250.0, 50.0, 100.0, 150.0, 10.0]})
SEVEN["t"] = (SEVEN.time - EPOCH).dt.total_seconds().astype(np.int64)
_w = customer_windows(np.zeros(7, int), SEVEN.t.to_numpy(), SEVEN.amount.to_numpy())
assert _w[:, 0].tolist() == [0, 1, 2, 3, 3, 2, 3]
assert np.allclose(_w[:, 0] * _w[:, 1], [0, 250, 650, 900, 700, 150, 300])
# Same-second payments are not earlier than each other, in either order.
assert past_window_sum(np.array([5, 5]), np.array([100, 100]), np.array([1.0, 1.0]), 3600).tolist() == [0.0, 0.0]

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Sort once by key, then time (`np.lexsort((t, key))`). In sorted order,
# the rows of one key form a contiguous run, ordered by time. If you fold
# key and time into one sortable number (key times a constant larger than
# any timestamp, plus time), a window becomes a range of positions on a
# single sorted axis. The window sum is then `prefix[end] - prefix[start]`
# for a prefix sum with a leading zero. Scatter the result back to input
# order at the end.
# </details>
#
# <details><summary>Hint 2 — the two ends</summary>
#
# Both ends are open. The end is the first position whose (key, time) is
# not smaller than the row's own: `searchsorted(..., side="left")` on the
# row's own value, which also leaves out same-second rows. The start is the
# first position after every row at or before `t - width`:
# `searchsorted(..., value - width, side="right")`.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# key = np.asarray(key, dtype=np.int64); t = np.asarray(t, dtype=np.int64)
# values = np.asarray(values, dtype=float)
# order = np.lexsort((t, key))
# composite = key[order] * 10**11 + t[order]
# prefix = np.r_[0.0, np.cumsum(values[order])]
# end = np.searchsorted(composite, composite, side="left")
# start = np.searchsorted(composite, composite - width, side="right")
# out = np.empty(len(order)); out[order] = prefix[end] - prefix[start]
# ```
# </details>

# %%
distill.check("customer-windows", customer_windows)

# %% [markdown]
# The plot below shows one card's 7-day count over the first five weeks,
# your strict version against the version that includes the current
# payment (`rolling("7D")` with its default closure). The inclusive line sits
# one payment higher at every payment: harmless for a busy card, but for a
# card that pays twice a week the "reference" it compares a payment against
# is a third that payment itself.

# %%
# Infrastructure (do not modify): one card's window, strict and inclusive.
def plot_card_windows(log, card_id, width_days=7, until_day=35):
    rows = log[(log.CUSTOMER_ID == card_id) & (log.TX_TIME_DAYS < until_day)]
    t = rows.TX_TIME_SECONDS.to_numpy()
    strict = past_window_sum(np.zeros(len(t), int), t, np.ones(len(t)), width_days * DAY)
    inclusive = rows.set_index("TX_DATETIME").TX_AMOUNT.rolling(f"{width_days}D").count().to_numpy()
    fig, ax = plt.subplots(figsize=(9, 3))
    ax.step(t / DAY, strict, where="post", label="strictly earlier (your function)")
    ax.step(t / DAY, inclusive, where="post", ls=":", color="C3", label="current payment included")
    ax.plot(t / DAY, np.zeros(len(t)), "|", color="0.4", ms=12, label="payments")
    ax.set_xlabel("day"); ax.set_ylabel(f"{width_days}-day count")
    ax.set_title(f"card {card_id}"); ax.legend(fontsize=8, loc="upper left")
    plt.show()


plot_card_windows(stream, card_id=7)

# %% [markdown]
# ## 3. Conditional aggregates: the same window, a narrower question
#
# A card that pays in its home country every day and today pays once at a
# foreign web merchant has an ordinary 24-hour count. What is unusual is
# the kind of payment, and the conditional aggregate asks about it: count
# and sum only the card's earlier payments that share the current payment's
# value $g$, here the pair (type, country):
#
# $$N^{g}_w(i) = \#\{ j : e_j = e_i,\ g_j = g_i,\ t_i - w < t_j < t_i \}.$$
#
# A zero beside a busy plain window is the signal: the card is active, but
# not like this. This is `past_window_sum` again, on a finer key — the
# triple (card, type, country) turned into one integer per distinct triple.

# %%
def conditional_aggregates(card, t, amount, tx_type, country, width):
    """Count and sum over the card's earlier payments of the same type AND
    the same country, less than `width` earlier.

    Args:
        card: (n,) int card id.
        t: (n,) int timestamp in seconds; rows in any order.
        amount: (n,) float amount.
        tx_type: (n,) str payment type ("POS", "ATM", "ONLINE").
        country: (n,) str country code.
        width: window length in seconds.
    Returns:
        (count, total): two (n,) float arrays in input order.
    """
    # BEGIN SOLUTION
    group = pd.MultiIndex.from_arrays([card, tx_type, country]).factorize()[0]
    count = past_window_sum(group, t, np.ones(len(group)), width)
    total = past_window_sum(group, t, amount, width)
    return count, total
    # END SOLUTION

# %%
# The seven-payment card conditioned on (type, country), 24 hours: rows 3
# (first cash withdrawal), 4 (first payment in Germany) and 7 (back in
# Luxembourg, no POS there in the last day) have empty conditional windows.
_n, _s = conditional_aggregates(np.zeros(7, int), SEVEN.t.to_numpy(), SEVEN.amount.to_numpy(),
                                SEVEN.type.to_numpy(), SEVEN.country.to_numpy(), DAY)
assert _n.tolist() == [0, 1, 0, 0, 1, 2, 0]
assert _s.tolist() == [0, 250, 0, 0, 50, 150, 0]

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# `past_window_sum` already does the window for any integer key. What
# changes is the key: two payments share it only when they share the card,
# the type and the country. Give every distinct triple its own integer and
# call the helper twice, once on ones and once on the amounts. Leave the
# card out and the key counts every card's payments of that kind.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# group = one integer per distinct (card, type, country)
# count = past_window_sum(group, t, ones, width)
# total = past_window_sum(group, t, amount, width)
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# group = pd.MultiIndex.from_arrays([card, tx_type, country]).factorize()[0]
# ```
# `np.unique` over the stacked columns with `return_inverse=True` gives the
# same integers.
# </details>

# %%
distill.check("conditional-aggregates", conditional_aggregates)

# %% [markdown]
# ## 4. The terminal risk, shifted back by the label delay
#
# A terminal's recent fraud rate is the feature that finds compromised
# terminals, and it is built from labels. At time $t$ the labels known are
# those of payments before $t - \delta$, so the window ends there. The
# point-in-time lesson's definition, for a window of length $w$:
#
# $$N^{\delta}_w = \#\{ j : e_j = e,\ t - \delta - w < t_j \le t - \delta \}, \qquad
#   F^{\delta}_w = \sum_{j:\ e_j = e,\ t - \delta - w < t_j \le t - \delta} y_j ,$$
#
# and the delayed terminal risk $R^{\delta}_w = F^{\delta}_w / N^{\delta}_w$,
# 0 when the window is empty. The count goes into the matrix beside the
# rate, so the model can tell a clean busy terminal from one it knows
# nothing about.
#
# One change from the lesson: the function answers for any **(terminal,
# time) query**, not only for the log's own rows. The risk is a property of
# a terminal at a moment; a nightly job will ask it for every terminal at
# 00:30, and the scoring rows will read those answers (section 6). In the
# lesson's two-rolling-sums form, the window ending $\delta$ ago is the last
# $\delta + w$ minus the last $\delta$. With queries, the same idea is two
# prefix-sum lookups per window: everything up to $t - \delta$, minus
# everything up to $t - \delta - w$.

# %%
def terminal_risk_delayed(term, t, fraud, q_term, q_t, delay_days):
    """Delayed count and fraud rate of a terminal, for arbitrary queries.

    Args:
        term: (n,) int terminal id of each logged payment.
        t: (n,) int payment timestamp in seconds; rows in any order.
        fraud: (n,) float 0/1 label of each payment.
        q_term: (m,) int terminal id of each query.
        q_t: (m,) int query time in seconds.
        delay_days: label delay, in days.
    Returns:
        (m, 6) float array, columns [N_1d, R_1d, N_7d, R_7d, N_30d, R_30d]:
        the payments of the query's terminal with timestamp in
        (q_t - delay - w, q_t - delay], w = 1, 7, 30 days, and the share of
        them that are fraud (0 when there are none).
    """
    # BEGIN SOLUTION
    term = np.asarray(term, dtype=np.int64)
    t = np.asarray(t, dtype=np.int64)
    order = np.lexsort((t, term))
    composite = term[order] * 10**11 + t[order]
    n_prefix = np.arange(len(order) + 1, dtype=float)
    f_prefix = np.r_[0.0, np.cumsum(np.asarray(fraud, dtype=float)[order])]
    q = np.asarray(q_term, dtype=np.int64) * 10**11 + np.asarray(q_t, dtype=np.int64)
    end = np.searchsorted(composite, q - delay_days * DAY, side="right")
    cols = []
    for w in (1, 7, 30):
        start = np.searchsorted(composite, q - (delay_days + w) * DAY, side="right")
        n = n_prefix[end] - n_prefix[start]
        f = f_prefix[end] - f_prefix[start]
        cols += [n, np.where(n > 0, f / np.maximum(n, 1), 0.0)]
    return np.column_stack(cols)
    # END SOLUTION

# %% [markdown]
# The local referee is the lesson's two-sums terminal: payments on days 7 to
# 20 (9, 11, 10, 12, 8, 10, 9, 11, 10, 9, 12, 10, 8, 11, all at noon), fraud
# from day 10 on, queried early on day 21 with $w = 7$, $\delta = 7$: the
# window is days 7 to 13, 69 payments, 39 frauds, rate 0.565. The rate from
# all the labels, over days 14 to 20, would read 1.0.

# %%
_per_day = [9, 11, 10, 12, 8, 10, 9, 11, 10, 9, 12, 10, 8, 11]
_days = np.repeat(np.arange(7, 21), _per_day)
_r = terminal_risk_delayed(np.zeros(len(_days), int), _days * DAY + DAY // 2,
                           (_days >= 10).astype(float), np.array([0]), np.array([21 * DAY + 3600]), 7)
assert _r[0, 2] == 69 and np.isclose(_r[0, 3], 39 / 69)
# Seven days into its compromise the terminal still looks clean.
_r = terminal_risk_delayed(np.zeros(len(_days), int), _days * DAY + DAY // 2,
                           (_days >= 10).astype(float), np.array([0]), np.array([17 * DAY + 3600]), 7)
assert _r[0, 1] == 0.0

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# The same sorted axis as in `past_window_sum`, but the positions are now
# looked up for the queries instead of for the rows. Build two prefix sums
# over the sorted payments: one of ones (the count) and one of labels.
# The window's right end is closed this time: "up to and including
# $t - \delta$" is `side="right"`.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# sort payments by (terminal, time); composite = terminal * BIG + time
# n_prefix = 0, 1, 2, ...;  f_prefix = 0, cumsum(fraud in sorted order)
# q = q_term * BIG + q_t
# end = searchsorted(composite, q - delay, right)
# for w in 1, 7, 30 days:
#     start = searchsorted(composite, q - delay - w, right)
#     n = n_prefix[end] - n_prefix[start];  f = f_prefix[end] - f_prefix[start]
#     rate = f / n where n > 0, else 0
# ```
# </details>

# %%
distill.check("terminal-risk-delayed", terminal_risk_delayed)

# %% [markdown]
# A compromised terminal from the log, its 7-day risk queried every hour:
# your delayed version against the same window with no delay, the rate a
# table built from all the final labels would hold. The undelayed line
# climbs on the first day of the compromise; the delayed one stays at 0 for
# a week, which is what the bank actually knew. A model trained on the
# undelayed column learns to trust a signal it will never get in time.

# %%
# Infrastructure (do not modify): delayed and undelayed risk on one terminal.
def plot_terminal_risk(log, terminal_id):
    rows = log[log.TERMINAL_ID == terminal_id]
    q_t = np.arange(0, 60 * DAY, 3600)
    args = (rows.TERMINAL_ID.to_numpy(), rows.TX_TIME_SECONDS.to_numpy(), rows.TX_FRAUD.to_numpy(),
            np.full(len(q_t), terminal_id), q_t)
    fig, ax = plt.subplots(figsize=(9, 3))
    ax.plot(q_t / DAY, terminal_risk_delayed(*args, 0)[:, 3], ls=":", color="C3",
            label="no delay (labels not yet arrived)")
    ax.plot(q_t / DAY, terminal_risk_delayed(*args, 7)[:, 3], label="delayed by 7 days (your function)")
    hit = rows.TX_TIME_DAYS[rows.TX_FRAUD_SCENARIO == 2]
    if len(hit):
        ax.axvspan(hit.min(), hit.max() + 1, color="C3", alpha=0.08, label="compromised")
    ax.set_xlabel("day"); ax.set_ylabel("7-day fraud rate"); ax.set_title(f"terminal {terminal_id}")
    ax.legend(fontsize=8, loc="upper left"); plt.show()


_compromised = stream[(stream.TX_FRAUD_SCENARIO == 2) & (stream.TX_TIME_DAYS.between(15, 25))]
plot_terminal_risk(stream, int(_compromised.TERMINAL_ID.iloc[0]))

# %% [markdown]
# ## 5. A card's usual hours: the circular mean and the von Mises arc
#
# The behavioural-profiles lesson scored a payment's hour against the
# card's own habit. An hour $h$ is the angle $\theta = 2\pi h / 24$; for a
# card's earlier times,
#
# $$\bar C = \tfrac1n \sum \cos\theta_j, \quad \bar S = \tfrac1n \sum \sin\theta_j, \quad
#   \bar R = \sqrt{\bar C^2 + \bar S^2},$$
#
# and the circular mean $\hat\mu$ is the direction of $(\bar C, \bar S)$,
# converted back to hours in $[0, 24)$. The concentration $\hat\kappa$
# solves $A(\hat\kappa) = \bar R$ with $A = I_1 / I_0$, and the arc at
# level $\alpha$ is $[\hat\mu - c, \hat\mu + c]$, with $c$ chosen so that
# the fitted von Mises distribution puts mass $\alpha$ inside. The flag is
# 1 when the payment's hour lies inside the arc.
#
# Two numerical steps ship as infrastructure, because a library computes
# them and this lab is not about Bessel functions: `kappa_from_rbar`
# inverts $A$, and `arc_half_width` returns $c$ in hours. (`scipy.stats.vonmises.interval`
# gives the same $c$, at a few milliseconds a call — too slow for a hundred
# thousand payments, so `arc_half_width` tabulates it once.)
#
# Your function scores many cards at once. Each row of `history_hours` is
# one card's earlier payment times, padded with NaN to a common width; the
# matching entry of `query_hours` is the hour of the payment being scored.
# The arc of a card that pays around midnight wraps: 17:10 to 00:55 is one
# arc, and 00:30 is inside it.

# %%
# Infrastructure (do not modify): the two numerical steps.
_KAPPA_GRID = np.r_[0.0, np.geomspace(1e-3, 1e3, 3000)]


def kappa_from_rbar(rbar):
    """Maximum-likelihood von Mises concentration for mean resultant
    length(s) rbar: the solution of I1(k)/I0(k) = rbar, capped at 1000."""
    rbar = np.asarray(rbar, dtype=float)
    a = i1e(_KAPPA_GRID) / i0e(_KAPPA_GRID)
    k = np.interp(rbar, a, _KAPPA_GRID)
    for _ in range(3):  # Newton steps from the interpolated start
        A = i1e(k) / i0e(k)
        dA = 1 - A / np.maximum(k, 1e-12) - A**2
        k = np.clip(k - (A - rbar) / np.maximum(dA, 1e-12), 0.0, 1e3)
    return k


def _central_mass_table(alpha, n_kappa=400, n_theta=4001):
    theta = np.linspace(0, np.pi, n_theta)
    kappas = np.r_[0.0, np.geomspace(1e-3, 1e3, n_kappa)]
    half = []
    for k in kappas:
        f = np.exp(k * (np.cos(theta) - 1))
        mass = np.r_[0.0, np.cumsum((f[1:] + f[:-1]) / 2 * np.diff(theta))]
        half.append(np.interp(alpha, mass / mass[-1], theta))
    return kappas, np.array(half)


_ARC_TABLES = {}


def arc_half_width(kappa, alpha=0.9):
    """Half-width c, in hours, of the central arc holding mass alpha of a
    von Mises distribution with concentration kappa."""
    if alpha not in _ARC_TABLES:
        _ARC_TABLES[alpha] = _central_mass_table(alpha)
    kappas, half = _ARC_TABLES[alpha]
    return np.interp(np.asarray(kappa, dtype=float), kappas, half) * 24 / (2 * np.pi)


# The table agrees with scipy's interval to well under a minute.
assert np.allclose(arc_half_width([3.9, 3.2]), vonmises.interval(0.9, [3.9, 3.2])[1] * 24 / (2 * np.pi), atol=1e-3)

# %%
def periodic_time_flag(history_hours, query_hours, alpha=0.9):
    """Circular mean, concentration, arc half-width and in-arc flag.

    Args:
        history_hours: (m, k) float array; row r holds card r's earlier
            payment times as hours in [0, 24), NaN-padded. Every row has
            at least two times.
        query_hours: (m,) float hour of the payment scored for each card.
        alpha: arc level.
    Returns:
        (mu, kappa, c, inside): mu (m,) circular mean in hours, in [0, 24);
        kappa (m,) fitted concentration (use kappa_from_rbar); c (m,) arc
        half-width in hours (use arc_half_width); inside (m,) int 0/1, 1
        when the query hour lies within c hours of mu around the clock.
    """
    # BEGIN SOLUTION
    theta = np.asarray(history_hours, dtype=float) * 2 * np.pi / 24
    c_bar = np.nanmean(np.cos(theta), axis=1)
    s_bar = np.nanmean(np.sin(theta), axis=1)
    mu = (np.arctan2(s_bar, c_bar) % (2 * np.pi)) * 24 / (2 * np.pi)
    kappa = kappa_from_rbar(np.hypot(c_bar, s_bar))
    c = arc_half_width(kappa, alpha)
    # Distance around the clock: the shorter way, at most 12 hours.
    dist = np.abs((np.asarray(query_hours, dtype=float) - mu + 12) % 24 - 12)
    return mu, kappa, c, (dist <= c).astype(np.int64)
    # END SOLUTION

# %% [markdown]
# Local referees, both from the behavioural-profiles lesson. The opening
# card (22:00, 23:00, 02:00, 03:00): $\hat\mu$ = 00:30, $\hat\kappa \approx 3.9$,
# $c \approx 3.45$ h, so 01:00 is inside and 06:00 outside. The seven-payment
# card, payment 6 (23:45) scored from payments 1–5: $\hat\mu$ = 21:02,
# $\hat\kappa \approx 3.2$, arc 17:10 to 00:55, flag 1.

# %%
_h = np.array([[22, 23, 2, 3, np.nan], [22, 23, 2, 3, np.nan],
               [18 + 20 / 60, 20 + 35 / 60, 22.5, 50 / 60, 19.3]])
_mu, _k, _c, _in = periodic_time_flag(_h, np.array([1.0, 6.0, 23.75]))
assert np.allclose(_mu, [0.5, 0.5, 21.04], atol=0.01)
assert np.allclose(_k, [3.88, 3.88, 3.22], atol=0.01) and np.allclose(_c[0], 3.45, atol=0.01)
assert np.allclose([_mu[2] - _c[2], _mu[2] + _c[2] - 24], [17.16, 0.92], atol=0.01)
assert _in.tolist() == [1, 0, 1]

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Angles, then the means of cosines and sines along each row, ignoring the
# padding (`np.nanmean`). The direction of the point is `np.arctan2(S, C)`,
# which knows the quadrant; `np.arctan(S / C)` does not. Bring it into
# $[0, 2\pi)$ before converting to hours. For the flag, measure how far the
# query hour is from $\hat\mu$ the short way round the clock.
# </details>
#
# <details><summary>Hint 2 — the distance around the clock</summary>
#
# `(h - mu + 12) % 24 - 12` is the signed difference, wrapped into
# $[-12, 12)$. Its absolute value is the distance; the payment is inside
# when that distance is at most $c$. Comparing `mu - c <= h <= mu + c` on
# plain numbers misses every arc that crosses midnight.
# </details>

# %%
distill.check("periodic-time-flag", periodic_time_flag)

# %% [markdown]
# A card from the log on a 24-hour clock: its payment times over one week,
# the circular mean with the 90% arc from your function, and the arithmetic
# mean of the same hours (dashed), which for a card paying around midnight
# points at an hour it never pays.

# %%
# Infrastructure (do not modify): a card's week on the clock, and the
# history matrix the pipeline feeds your function with.
def history_matrix(card, t, width, max_len=64):
    """(n, max_len) hours of each row's same-card payments strictly earlier
    and less than `width` seconds before it (most recent first), NaN-padded."""
    card = np.asarray(card); t = np.asarray(t, dtype=np.int64)
    order = np.lexsort((t, card)); c, s = card[order], t[order]
    hours = np.full((len(order), max_len), np.nan)
    pos = np.arange(len(order))
    for k in range(1, max_len + 1):
        j = np.maximum(pos - k, 0)
        ok = (pos >= k) & (c[j] == c) & (s[j] < s) & (s[j] > s - width)
        hours[ok, k - 1] = (s[j[ok]] % DAY) / 3600
    out = np.empty_like(hours); out[order] = hours
    return out


def plot_clock(hours, query_hour, title=""):
    mu, _, c, inside = periodic_time_flag(np.array([hours]), np.array([query_hour]))
    to_angle = lambda h: np.pi / 2 - np.asarray(h) * 2 * np.pi / 24   # midnight on top, clockwise
    fig, ax = plt.subplots(figsize=(4, 4), subplot_kw={"projection": "polar"})
    arc = np.linspace(mu[0] - c[0], mu[0] + c[0], 100)
    ax.fill_between(to_angle(arc), 0, 1, color="C1", alpha=0.25, label="90% arc")
    ax.plot(to_angle(hours), np.full(len(hours), 0.9), "o", color="k", label="earlier payments")
    ax.plot([to_angle(mu[0])] * 2, [0, 1], color="C1", lw=2, label="circular mean")
    ax.plot([to_angle(np.mean(hours))] * 2, [0, 1], color="C0", ls="--", label="arithmetic mean")
    ax.plot(to_angle(query_hour), 1.0, "X" if inside[0] == 0 else "P", ms=12,
            color="C3" if inside[0] == 0 else "C2", label=f"scored payment (flag {inside[0]})")
    ax.set_xticks(to_angle(np.arange(0, 24, 3)), [f"{h:02d}:00" for h in range(0, 24, 3)])
    ax.set_yticks([]); ax.set_ylim(0, 1.05); ax.set_title(title, fontsize=9)
    ax.legend(fontsize=7, loc="lower left", bbox_to_anchor=(0.9, -0.1)); plt.show()


_card_hours = (stream.TX_TIME_SECONDS % DAY / 3600).groupby(stream.CUSTOMER_ID)
_night_card = int(_card_hours.apply(lambda h: np.cos(h * np.pi / 12).mean()).idxmax())
_rows = stream[(stream.CUSTOMER_ID == _night_card) & stream.TX_TIME_DAYS.between(20, 26)]
plot_clock(_rows.TX_TIME_SECONDS.to_numpy() % DAY / 3600, query_hour=12.0,
           title=f"card {_night_card}, days 20-26; a payment at 12:00")

# %% [markdown]
# ## 6. The as-of join
#
# The 30-day terminal risk cannot be recomputed from raw history inside the
# scoring deadline, so a nightly job computes it for every terminal and
# writes it to a feature log, one record per terminal per night, stamped
# with the time it became readable: the job starts at midnight and its
# values are readable from **00:30**. A payment at 00:20 is scored with the
# previous night's values; a payment at 00:30:00 reads the new ones.
#
# A training row has to receive what the live system read at the row's
# moment: the record with the largest stamp $\tau \le t$ among its
# terminal's records, and nothing if there is none (missing, not 0). The
# obvious lookup — the terminal's latest record — attaches a value from the
# future to every earlier row.
#
# Return positions rather than values: for each row, the index (into the
# log as given) of the record it reads, or $-1$. The caller then takes any
# column of the log at those positions. The log arrives in no particular
# order, and an entity's stamps are distinct.

# %%
def point_in_time_join(row_entity, row_t, log_entity, log_t):
    """As-of join: which log record each row reads.

    Args:
        row_entity: (n,) int entity of each scoring row.
        row_t: (n,) int timestamp of each row, seconds.
        log_entity: (m,) int entity of each log record; rows in any order.
        log_t: (m,) int time each record became readable, seconds.
    Returns:
        (n,) int array: for row i, the index into the log of the record of
        entity row_entity[i] with the largest log_t <= row_t[i]; -1 if that
        entity has no record at or before row_t[i].
    """
    # BEGIN SOLUTION
    log_entity = np.asarray(log_entity, dtype=np.int64)
    order = np.lexsort((np.asarray(log_t, dtype=np.int64), log_entity))
    composite = log_entity[order] * 10**11 + np.asarray(log_t, dtype=np.int64)[order]
    row_entity = np.asarray(row_entity, dtype=np.int64)
    q = row_entity * 10**11 + np.asarray(row_t, dtype=np.int64)
    pos = np.searchsorted(composite, q, side="right") - 1
    hit = np.maximum(pos, 0)
    found = (pos >= 0) & (log_entity[order][hit] == row_entity)
    return np.where(found, order[hit], -1)
    # END SOLUTION

# %%
# The lesson's figure: card 4471's 24-hour count logged as 3 at 09:00 and 5
# at 14:00; rows at 08:30, 12:00 and 15:00 read nothing, 3 and 5. A row at
# exactly 14:00 reads the 14:00 record.
_idx = point_in_time_join(np.full(4, 4471), (np.array([8.5, 12, 15, 14]) * 3600).astype(np.int64),
                          np.array([4471, 4471, 99]), np.array([14, 9, 10]) * 3600)
assert _idx.tolist() == [-1, 1, 0, 0]

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# The same sorted axis once more, built on the log. For each row, find the
# last log position whose (entity, stamp) is at or below the row's own
# (`side="right"`, minus one), then check that the record found belongs to
# the row's entity: if the entity has nothing early enough, the search lands
# on the previous entity's last record. Map sorted positions back to log
# indices with the sort permutation.
# </details>
#
# <details><summary>Hint 2 — with pandas</summary>
#
# `pd.merge_asof(rows, log, left_on="t", right_on="tau", by="entity",
# direction="backward", allow_exact_matches=True)` does the search; both
# frames must be sorted by their time column, and the log needs a column
# holding its own original index so the result can say which record matched.
# Restore the rows' original order afterwards.
# </details>

# %%
distill.check("point-in-time-join", point_in_time_join)

# %% [markdown]
# ## The pipeline
#
# `nightly_feature_log` is the job: every night, for every terminal, it
# asks your `terminal_risk_delayed` for the delayed counts and rates at
# 00:30. `build_feature_matrix` turns a log into the 18-column matrix, one
# row per payment: the amount, your calendar flags, your six card windows,
# your 24-hour conditional count and sum, your periodic flag (missing until
# the card has at least seven payments in the previous seven days, the
# lesson's minimum), and the six terminal columns attached from the feature
# log with your as-of join. Read both before running them: every line that
# is not bookkeeping is a call to a function you wrote.

# %%
# Infrastructure (do not modify): the nightly job and the matrix.
WINDOWS = (1, 7, 30)
TERMINAL_COLUMNS = [f"TERMINAL_{k}_{w}DAY" for w in WINDOWS for k in ("NB_TX", "RISK")]
READABLE_AT = 1800   # the nightly values are readable from 00:30


def nightly_feature_log(log, delay_days=7):
    terminals = np.unique(log.TERMINAL_ID)
    nights = np.arange(1, log.TX_TIME_DAYS.max() + 1) * DAY + READABLE_AT
    q_term, q_t = np.tile(terminals, len(nights)), np.repeat(nights, len(terminals))
    # The job reads the labels it has; a payment whose label is still empty
    # is newer than t - delay for every query, so leaving it out changes
    # nothing in a delayed window.
    known = log[log.TX_FRAUD.notna()]
    values = terminal_risk_delayed(known.TERMINAL_ID.to_numpy(), known.TX_TIME_SECONDS.to_numpy(),
                                   known.TX_FRAUD.to_numpy(), q_term, q_t, delay_days)
    feature_log = pd.DataFrame(values, columns=TERMINAL_COLUMNS)
    feature_log.insert(0, "READABLE_AT", q_t)
    feature_log.insert(0, "TERMINAL_ID", q_term)
    return feature_log


def build_feature_matrix(log, feature_log):
    t = log.TX_TIME_SECONDS.to_numpy()
    card, amount = log.CUSTOMER_ID.to_numpy(), log.TX_AMOUNT.to_numpy()
    X = pd.DataFrame({"TX_AMOUNT": amount})
    X["TX_DURING_WEEKEND"], X["TX_DURING_NIGHT"] = calendar_flags(log.TX_DATETIME.to_numpy())
    windows = customer_windows(card, t, amount)
    for i, w in enumerate(WINDOWS):
        X[f"CUSTOMER_NB_TX_{w}DAY"] = windows[:, 2 * i]
        X[f"CUSTOMER_AVG_AMOUNT_{w}DAY"] = windows[:, 2 * i + 1]
    X["CUSTOMER_SAME_KIND_NB_TX_1DAY"], X["CUSTOMER_SAME_KIND_AMOUNT_1DAY"] = conditional_aggregates(
        card, t, amount, log.TX_TYPE.to_numpy(), log.TX_COUNTRY.to_numpy(), DAY)
    flag = np.full(len(log), np.nan)
    enough = X.CUSTOMER_NB_TX_7DAY.to_numpy() >= 7
    history = history_matrix(card, t, 7 * DAY)[enough]
    flag[enough] = periodic_time_flag(history, (t[enough] % DAY) / 3600)[3]
    X["TX_INSIDE_USUAL_HOURS"] = flag
    idx = point_in_time_join(log.TERMINAL_ID.to_numpy(), t,
                             feature_log.TERMINAL_ID.to_numpy(), feature_log.READABLE_AT.to_numpy())
    for col in TERMINAL_COLUMNS:
        X[col] = np.where(idx >= 0, feature_log[col].to_numpy()[np.maximum(idx, 0)], np.nan)
    return X


feature_log = nightly_feature_log(stream)
X = build_feature_matrix(stream, feature_log)
FEATURES = list(X.columns)
print(f"feature log: {len(feature_log):,} records; matrix: {X.shape}")
print("missing per column:", X.isna().sum()[X.isna().sum() > 0].to_dict())
X.describe().T[["mean", "min", "max"]].round(3)

# %% [markdown]
# ## The reference pipeline, and the leak it hides
#
# Below is a second pipeline, written the way a colleague might write it:
# pandas throughout, `rolling` windows with `closed="neither"` so that no row
# sees itself, the same nightly feature log, the same as-of join. Its matrix
# has the same 18 columns, and a frozen model trained on it scores better
# on the stream's last week than one trained on yours.
#
# The frozen model is a standardised logistic regression; missing values
# are set to 0 with an indicator column beside them. It is trained on days
# 37–45 (the first day a 30-day window delayed by 7 days is full is day 37),
# the delay block is days 46–52, and the test week is days 53–59.

# %%
# Infrastructure (do not modify): the reference pipeline and the frozen model.
def reference_pipeline(log):
    df = log.copy()
    out = pd.DataFrame({"TX_AMOUNT": df.TX_AMOUNT.to_numpy()})
    out["TX_DURING_WEEKEND"] = (df.TX_DATETIME.dt.dayofweek >= 5).astype(int).to_numpy()
    out["TX_DURING_NIGHT"] = (df.TX_DATETIME.dt.hour < 6).astype(int).to_numpy()
    df["_row"] = np.arange(len(df))
    df["_one"] = 1.0
    by_card = df.sort_values(["CUSTOMER_ID", "TX_DATETIME"]).set_index("TX_DATETIME")
    for w in WINDOWS:
        g = by_card.groupby("CUSTOMER_ID")
        n = g["_one"].rolling(f"{w}D", closed="neither").sum().fillna(0).to_numpy()
        s = g["TX_AMOUNT"].rolling(f"{w}D", closed="neither").sum().fillna(0).to_numpy()
        rows = by_card["_row"].to_numpy()
        out.loc[rows, f"CUSTOMER_NB_TX_{w}DAY"] = n
        out.loc[rows, f"CUSTOMER_AVG_AMOUNT_{w}DAY"] = np.where(n > 0, s / np.maximum(n, 1), 0.0)
    by_kind = df.sort_values(["CUSTOMER_ID", "TX_TYPE", "TX_COUNTRY", "TX_DATETIME"]).set_index("TX_DATETIME")
    g = by_kind.groupby(["CUSTOMER_ID", "TX_TYPE", "TX_COUNTRY"])
    rows = by_kind["_row"].to_numpy()
    out.loc[rows, "CUSTOMER_SAME_KIND_NB_TX_1DAY"] = g["_one"].rolling("1D", closed="neither").sum().fillna(0).to_numpy()
    out.loc[rows, "CUSTOMER_SAME_KIND_AMOUNT_1DAY"] = g["TX_AMOUNT"].rolling("1D", closed="neither").sum().fillna(0).to_numpy()
    flag = np.full(len(df), np.nan)
    enough = out.CUSTOMER_NB_TX_7DAY.to_numpy() >= 7
    t = df.TX_TIME_SECONDS.to_numpy()
    flag[enough] = periodic_time_flag(history_matrix(df.CUSTOMER_ID.to_numpy(), t, 7 * DAY)[enough],
                                      (t[enough] % DAY) / 3600)[3]
    out["TX_INSIDE_USUAL_HOURS"] = flag
    # Nightly terminal job: each terminal's payments and frauds over the
    # last w days before the snapshot, strictly earlier rows only.
    nights = np.arange(1, df.TX_TIME_DAYS.max() + 1) * DAY + READABLE_AT
    snaps = []
    for term, rows_t in df.groupby("TERMINAL_ID"):
        tt, ff = rows_t.TX_TIME_SECONDS.to_numpy(), rows_t.TX_FRAUD.to_numpy()
        cum_f = np.r_[0.0, np.cumsum(ff)]
        rec = {"TERMINAL_ID": np.full(len(nights), term), "READABLE_AT": nights}
        for w in WINDOWS:
            hi = np.searchsorted(tt, nights, side="left")
            lo = np.searchsorted(tt, nights - w * DAY, side="left")
            n = (hi - lo).astype(float)
            rec[f"TERMINAL_NB_TX_{w}DAY"] = n
            rec[f"TERMINAL_RISK_{w}DAY"] = np.where(n > 0, (cum_f[hi] - cum_f[lo]) / np.maximum(n, 1), 0.0)
        snaps.append(pd.DataFrame(rec))
    snap = pd.concat(snaps, ignore_index=True)
    idx = point_in_time_join(df.TERMINAL_ID.to_numpy(), t, snap.TERMINAL_ID.to_numpy(), snap.READABLE_AT.to_numpy())
    for col in TERMINAL_COLUMNS:
        out[col] = np.where(idx >= 0, snap[col].to_numpy()[np.maximum(idx, 0)], np.nan)
    return out[FEATURES]


def frozen_model(X_train, y_train):
    model = make_pipeline(SimpleImputer(strategy="constant", fill_value=0.0, add_indicator=True),
                          StandardScaler(), LogisticRegression(C=1.0, max_iter=5000))
    return model.fit(np.asarray(X_train, dtype=float), np.asarray(y_train))


days, y = stream.TX_TIME_DAYS.to_numpy(), stream.TX_FRAUD.to_numpy()
train, test = (days >= 37) & (days <= 45), (days >= 53) & (days <= 59)
X_ref = reference_pipeline(stream)
for name, M in (("your pipeline", X), ("reference pipeline", X_ref)):
    model = frozen_model(M[train], y[train])
    auc = roc_auc_score(y[test], model.predict_proba(np.asarray(M[test], dtype=float))[:, 1])
    print(f"{name:20s} test-week ROC-AUC {auc:.3f}")

# %% [markdown]
# ## Written answer (optional)
#
# The reference pipeline's better score is a fiction. Find the column (or
# group of columns) that leaks, and answer three things:
#
# 1. which feature it is and what its code does wrong — what information
#    does it hold that the bank did not have at the row's moment;
# 2. the first row of the log (in time order) where that feature's value in
#    the reference matrix differs from yours: its terminal id and its
#    timestamp;
# 3. what would happen to that feature when the pipeline scores live
#    payments, and so why no offline metric computed on the reference
#    matrix could have revealed the leak.
#
# Every other column of the two matrices agrees row for row, except one
# group that differs without leaking: say which, and why it is harmless.
# Compare the two matrices column by column before you read the code; the
# comparison tells you where to look, the code tells you why. Both matrices
# hold NaN (the periodic flag below its minimum, a terminal before its first
# record), and NaN != NaN: a plain `==` reports every missing cell as a
# difference. Fill both sides with the same sentinel first, or count a pair
# of NaNs as equal.

# %%
# BEGIN SOLUTION
same = {c: np.allclose(X[c].fillna(-1), X_ref[c].fillna(-1)) for c in FEATURES}
print("columns that differ:", [c for c in FEATURES if not same[c]])
risk_cols = [c for c in FEATURES if "RISK" in c]
diff = ~np.isclose(X[risk_cols].fillna(-1), X_ref[risk_cols].fillna(-1)).all(axis=1)
first = np.flatnonzero(diff)[0]
print("first differing row:", first, stream.loc[first, ["TX_DATETIME", "TERMINAL_ID"]].to_dict())
print(X.loc[first, risk_cols].to_dict(), X_ref.loc[first, risk_cols].to_dict())
# END SOLUTION

# %%
distill.submit_review(
    "find-the-leak",
    "The leak is the terminal fraud rate, TERMINAL_RISK_1DAY/7DAY/30DAY, from "
    "the reference pipeline's nightly terminal job. For each snapshot it sums "
    "the labels of the terminal's payments over the last w days before the "
    "snapshot, strictly earlier rows only, with no shift by the 7-day label "
    "delay. Strictly earlier is the rule for payment fields; a feature built "
    "from labels may read only the labels that had arrived by the row's "
    "moment, i.e. payments up to t - 7 days. So each reference value holds "
    "the frauds of the last week at that terminal, which nobody had "
    "confirmed yet. The first row where it differs from mine: row 2398, "
    "2018-04-02 04:51:34 at terminal 2074 (a web merchant). The reference "
    "reads 0.2 in all three windows, from a fraud among the terminal's five "
    "payments of the first day; mine reads 0, because a window that ends 7 "
    "days back holds no payment yet. Live, the labels of the last 7 days do "
    "not exist at scoring time, so the serving path cannot compute this "
    "value at all (on the hold-out week it comes out missing for most rows), "
    "and a freshly compromised terminal reads 0 for a week instead of a high "
    "rate. Offline, training and test rows were both built with the leak, so "
    "the test score rewards the model for relying on it (0.915 vs 0.833); no "
    "metric computed on that matrix can show the gap, only a replay with "
    "labels as they arrived. The TERMINAL_NB_TX counts also differ (payment "
    "counts over the last w days vs mine over the shifted window), but "
    "payment counts need no label and are known at once, so that difference "
    "is not a leak.",
)

# %% [markdown]
# The last cell of this section makes item 3 concrete. The hold-out log used
# by the open task below (a second run of the generator) carries labels only
# for payments whose label had arrived by the end of its last week: every
# label of that week is still empty. Your pipeline computes every column of
# that week. The reference pipeline's terminal job cannot:

# %%
# Infrastructure (do not modify): load the hold-out log, run both pipelines on it.
def load_log(path):
    log = pd.read_csv(path, parse_dates=["TX_DATETIME"])
    log["TX_TIME_SECONDS"] = ((log.TX_DATETIME - EPOCH).dt.total_seconds()).astype(np.int64)
    log["TX_TIME_DAYS"] = log.TX_TIME_SECONDS // DAY
    return log


holdout_log = load_log("data/holdout_log.csv.gz")
week = holdout_log.TX_TIME_DAYS.to_numpy() >= 53
X_hold = build_feature_matrix(holdout_log, nightly_feature_log(holdout_log))
X_hold_ref = reference_pipeline(holdout_log)
print(f"hold-out log: {len(holdout_log):,} payments, {week.sum():,} in the unlabelled week")
for name, M in (("your pipeline", X_hold), ("reference pipeline", X_hold_ref)):
    print(f"{name:20s} share of unlabelled-week rows with no 7-day terminal risk: "
          f"{M.TERMINAL_RISK_7DAY[week].isna().mean():.1%}")

# %% [markdown]
# ## Open task (optional): beat the bar on a week nobody has labelled
#
# The frozen model, unchanged, is trained on your matrix for days 37–52 of
# `stream` and scores the unlabelled week (days 53–59) of the hold-out log;
# the server holds that week's labels and grades ROC-AUC over its payments.
# Days 46–52 were held out above because the test week came from the same
# run: a model trained up to day 52 would have used labels that, on day 53,
# had not arrived yet. Here the test week belongs to another run of the
# generator, no label of `stream` is in its past, and the delay block can
# train.
# The model is fixed. What you control is the matrix: write
# `extra_features(log, X)`, which returns `X` with any columns you add,
# computed point-in-time from `log` (the hold-out week's labels are empty,
# so a column that reads them fails on its own).
#
# With no extra columns the 18 columns score about **0.84** on the hold-out
# week; the 15 standard inputs alone (no conditional count or sum, no
# periodic flag) about 0.80. The bar is **0.855**. A logistic regression
# draws one hyperplane through the columns it is given: a signal that sits
# in a ratio, in a "never before" indicator or in a distance rather than a
# flag reaches it only if a column holds it.
#
# Fill in `extra_features` below; as shipped it adds nothing, and the cells
# after it run on the 18 columns. The cell after the submission draws, on the stream's own test week (trained on days 37–45),
# the ROC curve of your matrix against the 18 columns alone — the graded
# quantity, on a week whose labels you have. Hints follow the plot; try
# first.

# %%
def extra_features(log, X):
    """Columns added to the matrix for the frozen model.

    Args:
        log: the transaction log the matrix X was built from (same rows,
            same order).
        X: the 18-column matrix from build_feature_matrix(log, ...).
    Returns:
        A DataFrame with X's rows: X's columns plus any you add. Every new
        column must be computable at each row's moment; NaN is allowed
        (the model fills it with 0 and adds an indicator).
    """
    X = X.copy()
    # BEGIN SOLUTION
    t = log.TX_TIME_SECONDS.to_numpy()
    card, amount = log.CUSTOMER_ID.to_numpy(), log.TX_AMOUNT.to_numpy()
    online = (log.TX_TYPE == "ONLINE").to_numpy().astype(float)
    X["ONLINE"] = online
    X["LOG_AMOUNT"] = np.log1p(amount)
    X["ABOVE_220"] = (amount > 220).astype(float)
    for w in (7, 30):
        mean = X[f"CUSTOMER_AVG_AMOUNT_{w}DAY"].to_numpy()
        X[f"AMOUNT_RATIO_{w}DAY"] = np.where(mean > 0, amount / np.where(mean > 0, mean, 1), np.nan)
    # "Never before" over 30 days: this terminal, this country, this kind.
    for name, parts in (("TERMINAL", [log.TERMINAL_ID]), ("COUNTRY", [log.TX_COUNTRY]),
                        ("KIND", [log.TX_TYPE, log.TX_COUNTRY])):
        g = pd.MultiIndex.from_arrays([card] + [p.to_numpy() for p in parts]).factorize()[0]
        X[f"NEW_{name}_30DAY"] = (past_window_sum(g, t, np.ones(len(g)), 30 * DAY) == 0).astype(float)
    X["NEW_TERMINAL_ONLINE"] = X.NEW_TERMINAL_30DAY * online
    # Distance from the usual hour, in arc half-widths (missing below the minimum).
    dist = np.full(len(log), np.nan)
    enough = X.CUSTOMER_NB_TX_7DAY.to_numpy() >= 7
    h = (t[enough] % DAY) / 3600
    mu, _, c, _ = periodic_time_flag(history_matrix(card, t, 7 * DAY)[enough], h)
    dist[enough] = np.minimum(np.abs((h - mu + 12) % 24 - 12) / c, 4.0)
    X["HOUR_DISTANCE"] = dist
    # END SOLUTION
    return X

# %%
# Infrastructure (do not modify): train on the stream, score the hold-out week.
X_all = extra_features(stream, X)
fit_rows = (days >= 37) & (days <= 52)
final_model = frozen_model(X_all[fit_rows], y[fit_rows])
holdout_scores = final_model.predict_proba(np.asarray(extra_features(holdout_log, X_hold)[week], dtype=float))[:, 1]

# %%
distill.submit_predictions("feature-lift", holdout_scores)

# %%
# Infrastructure (do not modify): ROC on the stream's test week.
fig, ax = plt.subplots(figsize=(4.5, 4.5))
for name, M in (("your matrix", X_all), ("the 18 columns", X)):
    s = frozen_model(M[train], y[train]).predict_proba(np.asarray(M[test], dtype=float))[:, 1]
    fpr, tpr, _ = roc_curve(y[test], s)
    ax.plot(fpr, tpr, label=f"{name}, AUC {roc_auc_score(y[test], s):.3f}")
ax.plot([0, 1], [0, 1], color="0.75", ls=":")
ax.set_xlabel("false-positive rate"); ax.set_ylabel("true-positive rate")
ax.set_title("stream test week, days 53-59"); ax.legend(loc="lower right", fontsize=8)
plt.show()

# %% [markdown]
# <details><summary>Hint 1 — where the misses are</summary>
#
# Split the stream's test week by `TX_FRAUD_SCENARIO` and compute the AUC of
# each scenario's frauds against the genuine payments. With the 18 columns
# it reads about 0.62 for the amount rule, 0.84 for compromised terminals
# and 0.83 for leaked cards. The amount rule is a threshold the model sees
# only as one slope on a raw amount; compromised terminals are capped by the
# delay (a week of each compromise is invisible to any honest feature);
# leaked cards are where the context columns are thin.
# </details>
#
# <details><summary>Hint 2 — what a leaked-card fraud looks like</summary>
#
# It is often online, at a web merchant the card has never used, sometimes
# in a country the card has never paid in, at an hour far from the card's
# habit, at an amount the card would pay anyway. The 24-hour conditional
# window sees "not like this today"; a 30-day "never before" indicator sees
# more. The periodic flag is 0 or 1; the distance from the circular mean in
# units of $c$ grades it. Your `past_window_sum` and `periodic_time_flag`
# compute all of these.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# g = pd.MultiIndex.from_arrays([card, log.TERMINAL_ID.to_numpy()]).factorize()[0]
# X["NEW_TERMINAL_30DAY"] = (past_window_sum(g, t, np.ones(len(g)), 30 * DAY) == 0).astype(float)
# X["NEW_TERMINAL_ONLINE"] = X.NEW_TERMINAL_30DAY * (log.TX_TYPE == "ONLINE").to_numpy()
# ```
# plus the same indicator for the country, the amount over the 30-day mean,
# and the hour's distance from the circular mean divided by `c`.
# </details>

# %% [markdown]
# ## References
#
# - Y.-A. Le Borgne, W. Siblini, B. Lebichot, G. Bontempi, *Reproducible
#   Machine Learning for Credit Card Fraud Detection — Practical Handbook*,
#   Université Libre de Bruxelles, 2022: ch. 3.2 (the transaction simulator
#   this lab's generator is rewritten from; types, countries and habits are
#   this lab's additions), ch. 3.3 (the baseline features and the delayed
#   terminal risk as two rolling sums).
# - A. Correa Bahnsen, D. Aouada, A. Stojanovic, B. Ottersten, "Feature
#   engineering strategies for credit card fraud detection", *Expert Systems
#   with Applications* 51, 2016: the aggregation table of section 3.1
#   (Table 5) and the von Mises periodic feature of section 3.2 (Table 6).
# - Google Cloud, FraudFinder, notebooks 02 (batch customer and terminal
#   windows, delayed terminal risk) and the point-in-time retrieval of the
#   feature store: the as-of join of section 6.

# %%
distill.dump()
