# %% [markdown]
# # Lab: a budget- and cost-aware evaluation harness
#
# Module 2 established how a fraud detector has to be measured: average
# precision as a step sum, card precision at the investigators' budget with
# caught cards leaving the pool, forward-in-time folds with a delay block and
# known-card removal, savings against doing nothing, the Bayes-minimum-risk
# decision, and the closed-form correction for an undersampled model. This
# lab turns those results into one module of functions —
# `average_precision`, `savings`, `prequential_split`,
# `card_precision_top_k`, `bmr_report`, `undersampling_correction`,
# `prequential_selection` — and points it at a run of the handbook
# simulator to referee a decision-tree depth selection. Every later lab in
# the course scores its models with this harness.
#
# Ground rules:
#
# - **The harness is numpy.** Each blank is a function with a fixed
#   signature; write it with numpy. scikit-learn fits the models
#   (`DecisionTreeClassifier`, and anything you like in the open task) and
#   `sklearn.metrics.roc_auc_score` is allowed for ROC-AUC; checking your
#   AP against `sklearn.metrics.average_precision_score` on your own
#   machine is fine too, but the graded `average_precision` is yours.
# - Each checkpoint cell submits your function to the course server, which
#   runs it on inputs generated from a public seed and compares the outputs
#   with a reference. The seven exact checkpoints are the required set; the
#   written answer and the open task at the end are optional — partial
#   completion is a normal way to finish.
# - The simulator, the feature builder, the tree fits and every plot are
#   shipped complete. Run them; do not edit them.

# %%
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score
from sklearn.tree import DecisionTreeClassifier

import distill

distill.open_lab("fraud-ml/cost-aware-evaluation-lab")

# %% [markdown]
# ## 0. The stream
#
# The data are a fresh run of the generator described in the datasets
# lesson, written from the handbook's description (Le Borgne et al.,
# *Reproducible Machine Learning for Credit Card Fraud Detection — Practical
# Handbook*, Université Libre de Bruxelles, 2022, ch. 3.2; the handbook's
# code is GPL v3 and is not copied here). 5,000 customers and 10,000
# terminals on a 100 × 100 grid; each customer uses the terminals within
# radius 5, transacts Poisson(λ) times a day with λ ~ U(0, 4), around noon,
# with amounts around its own mean. Three scripted scenarios write the
# fraud labels: every amount above 220; every transaction on two terminals
# drawn each day, for the next 28 days; a third of the transactions of
# three customers drawn each day, for the next 14 days, with their amounts
# multiplied by 5. The run below covers 91 days from 2018-04-01, about
# 890,000 transactions and 0.8% fraud.
#
# The feature builder is the handbook's fifteen baseline inputs, which the
# aggregates lesson of module 3 builds step by step: amount, a weekend flag,
# a night flag (before 06:00), the card's transaction count and mean amount
# over the last 1, 7 and 30 days, and the terminal's transaction count and
# fraud rate over 1, 7 and 30 days *shifted back by the 7-day delay*, so
# that the terminal feature only reads labels an investigator had produced.

# %%
# Infrastructure (do not modify): the simulator and the feature builder.
DAY = 86400


def simulate(seed, n_customers=5000, n_terminals=10000, n_days=91, radius=5.0):
    """One run of the handbook-style generator, rows sorted by time.

    Returns a dict of (n,) arrays: t (seconds since day 0), day, card
    (customer id), terminal, amount, fraud (0/1), scenario (0 genuine,
    1/2/3 the scenario that wrote the label last).
    """
    rng = np.random.default_rng(seed)
    cx, cy = rng.uniform(0, 100, (2, n_customers))
    mean_amount = rng.uniform(5, 100, n_customers)
    mean_nb = rng.uniform(0, 4, n_customers)
    tx, ty = rng.uniform(0, 100, (2, n_terminals))
    reach = [np.flatnonzero((tx - cx[c]) ** 2 + (ty - cy[c]) ** 2 < radius**2)
             for c in range(n_customers)]
    n_reach = np.array([len(r) for r in reach])

    counts = rng.poisson(np.tile(mean_nb, (n_days, 1)))
    counts[:, n_reach == 0] = 0
    day = np.repeat(np.repeat(np.arange(n_days), n_customers), counts.ravel())
    card = np.repeat(np.tile(np.arange(n_customers), n_days), counts.ravel())
    sec = np.round(rng.normal(DAY / 2, 20000, len(day))).astype(np.int64)
    keep = (sec > 0) & (sec < DAY)
    day, card, sec = day[keep], card[keep], sec[keep]
    amount = rng.normal(mean_amount[card], mean_amount[card] / 2)
    neg = amount < 0
    amount[neg] = rng.uniform(0, 2 * mean_amount[card[neg]])
    amount = np.round(amount, 2)
    pick = np.floor(rng.random(len(day)) * n_reach[card]).astype(np.int64)
    terminal = np.array([reach[c][k] for c, k in zip(card, pick)])
    t = day * DAY + sec
    order = np.argsort(t, kind="stable")
    day, card, amount, terminal, t = (a[order] for a in (day, card, amount, terminal, t))

    fraud = np.zeros(len(t), dtype=np.int64)
    scenario = np.zeros(len(t), dtype=np.int64)
    big = amount > 220
    fraud[big], scenario[big] = 1, 1
    for d in range(n_days):
        hit = np.isin(terminal, rng.choice(n_terminals, 2, replace=False))
        hit &= (day >= d) & (day < d + 28)
        fraud[hit], scenario[hit] = 1, 2
    for d in range(n_days):
        rows = np.flatnonzero(np.isin(card, rng.choice(n_customers, 3, replace=False))
                              & (day >= d) & (day < d + 14))
        chosen = rng.choice(rows, len(rows) // 3, replace=False)
        amount[chosen] *= 5
        fraud[chosen], scenario[chosen] = 1, 3
    return dict(t=t, day=day, card=card, terminal=terminal, amount=amount,
                fraud=fraud, scenario=scenario)


def _window_sum(entity, t, values, width, lag=0):
    """Per row: sum of `values` over the same entity's rows with time in
    (t - lag - width, t - lag]. Vectorized via one sort and a cumulative sum."""
    order = np.lexsort((t, entity))
    key = entity[order] * (t.max() + 1000 * DAY) + t[order]
    cum = np.concatenate([[0.0], np.cumsum(values[order])])
    hi = np.searchsorted(key, key - lag, side="right")
    lo = np.searchsorted(key, key - lag - width, side="right")
    out = np.empty(len(t))
    out[order] = cum[hi] - cum[lo]
    return out


FEATURES = ["amount", "weekend", "night",
            "card_nb_1d", "card_avg_amount_1d", "card_nb_7d", "card_avg_amount_7d",
            "card_nb_30d", "card_avg_amount_30d",
            "terminal_nb_1d", "terminal_risk_1d", "terminal_nb_7d", "terminal_risk_7d",
            "terminal_nb_30d", "terminal_risk_30d"]


def build_features(s, delay=7):
    """The fifteen baseline features, (n, 15), columns in FEATURES order."""
    t, day, amount = s["t"], s["day"], s["amount"]
    weekday = (6 + day) % 7  # 2018-04-01 was a Sunday; Monday is 0
    cols = [amount, (weekday >= 5).astype(float), (t - day * DAY <= 6 * 3600).astype(float)]
    ones = np.ones(len(t))
    for w in (1, 7, 30):
        n = _window_sum(s["card"], t, ones, w * DAY)
        cols += [n, _window_sum(s["card"], t, amount, w * DAY) / n]
    for w in (1, 7, 30):
        n = _window_sum(s["terminal"], t, ones, w * DAY, lag=delay * DAY)
        f = _window_sum(s["terminal"], t, s["fraud"].astype(float), w * DAY, lag=delay * DAY)
        cols += [n, np.where(n > 0, f / np.maximum(n, 1), 0.0)]
    return np.column_stack(cols)


# %%
stream = simulate(seed=0)
X = build_features(stream)
y, day, card, amount = stream["fraud"], stream["day"], stream["card"], stream["amount"]
print(f"{len(y):,} transactions, {y.sum():,} frauds ({y.mean():.2%}), days 0-{day.max()}")
print("frauds by scenario (last writer):", np.bincount(stream["scenario"])[1:])

# %%
# Infrastructure (do not modify): plot helpers.
def plot_daily(day, y, bands=(), title=""):
    """Transactions and frauds per day; bands = [(first_day, n_days, label, color)]."""
    days = np.arange(day.max() + 1)
    fig, ax = plt.subplots(figsize=(10, 3))
    ax.bar(days, np.bincount(day, weights=y, minlength=len(days)), color="0.3", width=0.8)
    ax.set_ylabel("frauds per day")
    for start, width, label, color in bands:
        ax.axvspan(start - 0.5, start + width - 0.5, color=color, alpha=0.25)
        ax.text(start + width / 2 - 0.5, ax.get_ylim()[1] * 0.92, label, ha="center", fontsize=8)
    ax.set_xlabel("day")
    ax.set_title(title)
    plt.show()


def plot_pr_steps(curves, title=""):
    """curves = {label: (y, scores)}; PR curves drawn as steps, AP in the legend."""
    fig, ax = plt.subplots(figsize=(5, 4))
    for label, (yy, ss) in curves.items():
        order = np.argsort(-ss, kind="stable")
        ys, sv = yy[order], ss[order]
        last = np.r_[sv[1:] != sv[:-1], True]
        tp = np.cumsum(ys)[last]
        rec, prec = tp / ys.sum(), tp / (np.flatnonzero(last) + 1)
        ax.step(np.r_[0, rec], np.r_[prec[0], prec], where="pre",
                label=f"{label} (AP {average_precision(yy, ss):.3f})")
    ax.set_xlabel("recall")
    ax.set_ylabel("precision")
    ax.set_title(title)
    ax.legend(fontsize=8)
    plt.show()


def plot_selection(configs, means, stds, test=None, title=""):
    """Three panels (AP, ROC-AUC, CP@k) of validation mean ± std against the
    config, optional test curve, the validation argmax ringed."""
    fig, axes = plt.subplots(1, 3, figsize=(13, 3.5))
    x = np.arange(len(configs))
    for r, (ax, name) in enumerate(zip(axes, ["AP", "ROC-AUC", "CP@100"])):
        ax.plot(x, means[r], marker="o", ms=3, label="validation (mean of folds)")
        ax.fill_between(x, means[r] - stds[r], means[r] + stds[r], alpha=0.2)
        if test is not None:
            ax.plot(x, test[r], marker="s", ms=3, ls="--", label="test week")
        b = int(np.argmax(means[r]))
        ax.plot(x[b], means[r, b], "o", ms=12, mfc="none", mec="C3")
        ax.set_xticks(x, [str(c) for c in configs])
        ax.set_xlabel("max depth")
        ax.set_title(f"{name}: validation picks {configs[b]}")
    axes[0].legend(fontsize=8)
    fig.suptitle(title)
    plt.tight_layout()
    plt.show()


def plot_savings_vs_cost(amount, y, p, costs, title=""):
    """Savings of the BMR rule and of threshold 0.5 against the alert cost."""
    bmr = [bmr_report(amount, p, y, ca)[2] for ca in costs]
    fixed = [savings(amount, y, (p >= 0.5).astype(float), ca)[2] for ca in costs]
    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.plot(costs, bmr, marker="o", ms=3, label="Bayes minimum risk")
    ax.plot(costs, fixed, marker="s", ms=3, label="threshold 0.5")
    ax.axhline(0, color="0.5", lw=0.8)
    ax.set_xlabel("alert cost $C_a$")
    ax.set_ylabel("savings")
    ax.set_title(title)
    ax.legend(fontsize=8)
    plt.show()


plot_daily(day, y, title="Frauds per day: the first four weeks are the scenarios filling up")

# %% [markdown]
# ## 1. Average precision as a step sum
#
# The first function of the harness reads a ranking the way the metrics
# lesson defined it. Order the distinct score values from high to low; at
# the $n$-th, alert every transaction scored at or above it, and let $P_n$
# and $R_n$ be the precision and recall of that alert set, with $R_0 = 0$:
#
# $$\mathrm{AP} = \sum_n (R_n - R_{n-1})\, P_n .$$
#
# Two details carry the checkpoint. A *threshold* is a distinct score
# value, so transactions with equal scores enter the alert set together —
# a tree scores whole leaves with one number, and its ties are the rule,
# not an edge case. And there is no interpolation between PR points: the
# area is under the steps.
#
# The ten-transaction toy day of the metrics lesson ships as a literal;
# its AP is 0.75.

# %%
TOY_Y = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])
TOY_S = np.array([0.90, 0.35, 0.45, 0.40, 0.20, 0.20, 0.20, 0.10, 0.10, 0.00])


def average_precision(y, scores):
    """Average precision as the step sum over distinct thresholds.

    Args:
        y: (n,) labels in {0, 1}, at least one 1.
        scores: (n,) real scores, higher = more suspicious; ties allowed.
    Returns:
        float: sum over distinct score values t, from high to low, of
        (R(t) - R(previous t)) * P(t), where the alert set at t is every
        row with score >= t.
    """
    # BEGIN SOLUTION
    order = np.argsort(-scores, kind="stable")
    y, scores = y[order], scores[order]
    last = np.r_[scores[1:] != scores[:-1], True]  # last row of each tie group
    tp = np.cumsum(y)[last]
    precision = tp / (np.flatnonzero(last) + 1)
    recall = tp / y.sum()
    return float(np.sum(np.diff(np.r_[0.0, recall]) * precision))
    # END SOLUTION


# %%
# Local referees: the toy day, the constant scorer, and a tie that matters.
assert abs(average_precision(TOY_Y, TOY_S) - 0.75) < 1e-12
assert abs(average_precision(TOY_Y, np.zeros(10)) - 0.2) < 1e-12  # AP = prevalence
# One fraud tied with one genuine at the top: one threshold alerts both,
# precision 1/2 — not 1, whichever order a sort happens to leave them in.
assert abs(average_precision(np.array([0, 1, 0]), np.array([0.9, 0.9, 0.1])) - 0.5) < 1e-12

# %%
distill.check("average-precision", average_precision)

# %% [markdown]
# ## 2. Cost and savings
#
# The second warm-up prices a set of decisions. The example-dependent
# lesson's card matrix charges an alert the administrative cost $C_a$
# whether or not the transaction is fraud, charges a passed fraud its
# amount, and charges a passed genuine transaction nothing:
#
# $$\mathrm{Cost}(f(S)) = \sum_i \bigl[ y_i (1 - c_i)\,\mathrm{Amt}_i + c_i\,C_a \bigr].$$
#
# The baseline is the cheaper of the two policies that need no model —
# pass everything, or flag everything:
# $\mathrm{Cost}_l = \min\{\sum_i y_i \mathrm{Amt}_i,\ N C_a\}$ — and
# $\mathrm{Savings} = (\mathrm{Cost}_l - \mathrm{Cost})/\mathrm{Cost}_l$.
#
# The local referee is the lesson's day of 1,000 transactions: the ten
# rows of its table plus 990 genuine ones that every rule passes. The
# Bayes-minimum-risk decisions save 94.2% there, the 0.5 threshold 2.3%.

# %%
def savings(amount, y, decisions, C_a):
    """Cost, baseline cost and savings of a set of decisions.

    Args:
        amount: (n,) transaction amounts.
        y: (n,) labels in {0, 1}.
        decisions: (n,) in {0, 1}, 1 = flag.
        C_a: scalar administrative cost of one alert.
    Returns:
        (cost, cost_l, savings): three floats, per the formulas above.
    """
    # BEGIN SOLUTION
    cost = float(np.sum(y * (1 - decisions) * amount + decisions * C_a))
    cost_l = float(min(np.sum(y * amount), len(amount) * C_a))
    return cost, cost_l, (cost_l - cost) / cost_l
    # END SOLUTION


# %%
DAY_AMT = np.r_[[15, 2000, 40, 900, 120, 25, 350, 60, 8, 1500], np.full(990, 1.0)]
DAY_P = np.r_[[0.60, 0.05, 0.85, 0.30, 0.70, 0.55, 0.12, 0.20, 0.90, 0.01], np.full(990, 0.001)]
DAY_Y = np.r_[[1, 1, 1, 0, 1, 0, 1, 0, 1, 0], np.zeros(990)]
_bmr = np.zeros(1000); _bmr[[1, 2, 3, 4, 6]] = 1
_half = (DAY_P >= 0.5).astype(float)
assert np.allclose(savings(DAY_AMT, DAY_Y, _bmr, 25.0), (148.0, 2533.0, 2385 / 2533))
assert np.allclose(savings(DAY_AMT, DAY_Y, _half, 25.0), (2475.0, 2533.0, 58 / 2533))
# Flagging all 1,000 costs 25,000: savings -887%, and no lower bound.
assert abs(savings(DAY_AMT, DAY_Y, np.ones(1000), 25.0)[2] - (2533 - 25000) / 2533) < 1e-12

# %%
# The checker prices one table at two alert costs, one on each side of the
# break-even point where flagging everything becomes the cheaper baseline.
distill.check("savings-metric",
              lambda amount, y, decisions: (*savings(amount, y, decisions, 5.0),
                                            *savings(amount, y, decisions, 40.0)))

# %% [markdown]
# ## 3. The prequential split
#
# The harness now needs the geometry the validation lesson built. A fold
# starting on day $s$ trains on days $[s, s + \Delta_{\text{train}})$, skips
# the delay block $[s + \Delta_{\text{train}}, s + \Delta_{\text{train}} + \delta)$
# whose labels are still in transit, and scores the test block of
# $\Delta_{\text{test}}$ days after it. Fold $i = 0, 1, \dots$ is the same
# geometry moved back $i\,\Delta_{\text{test}}$ days.
#
# Each test day $T$ is cleaned by **known-card removal**: every transaction
# of a card the bank already knows to be compromised is dropped. A card is
# known on day $T$ if it has a fraud on a day in $[s, T - \delta - 1]$ —
# the frauds whose labels have arrived by the morning of $T$, counted from
# the fold's training start. That is the handbook's `get_train_test_set`
# convention: the known set starts as the cards with a fraud in the
# training block and grows by one day of labels per test day, so from the
# $(\delta + 2)$-th test day on it includes frauds of the test block itself.
#
# Contract:
#
# - training indices: every row whose day is in the training window;
# - test indices: every row whose day is in the test block, minus the
#   rows of cards known *on that row's day*;
# - both as ascending row indices; folds in order $i = 0, \dots, n-1$.

# %%
def prequential_split(day, card, y, start_train, n_folds, d_train, d_delay, d_test):
    """Train/test row indices for n prequential folds.

    Args:
        day: (n,) integer day of each row; card: (n,) card ids;
        y: (n,) labels in {0, 1}.
        start_train: first training day of fold 0.
        n_folds: fold i starts training on start_train - i * d_test.
        d_train, d_delay, d_test: block lengths in days.
    Returns:
        list of n_folds tuples (train_idx, test_idx), each an ascending
        integer array of row indices; test rows have known-card removal
        applied per test day as stated above.
    """
    # BEGIN SOLUTION
    folds = []
    for i in range(n_folds):
        s = start_train - i * d_test
        train = np.flatnonzero((day >= s) & (day < s + d_train))
        first_test = s + d_train + d_delay
        test = []
        for T in range(first_test, first_test + d_test):
            known = np.unique(card[(y == 1) & (day >= s) & (day <= T - d_delay - 1)])
            test.append(np.flatnonzero((day == T) & ~np.isin(card, known)))
        folds.append((train, np.sort(np.concatenate(test))))
    return folds
    # END SOLUTION


# %%
# The deployment geometry of this run: train on days 70-76, delay 77-83,
# test 84-90 — the handbook's one-week blocks, at the end of the stream.
START_TEST_TRAIN, D_TRAIN, D_DELAY, D_TEST = 70, 7, 7, 7
(test_geom_train, test_geom_test), = prequential_split(
    day, card, y, START_TEST_TRAIN, 1, D_TRAIN, D_DELAY, D_TEST)
raw_test = np.flatnonzero((day >= 84) & (day <= 90))
print(f"training week: {len(test_geom_train):,} rows, {y[test_geom_train].sum()} frauds")
print(f"test week: {len(raw_test):,} rows raw, {len(test_geom_test):,} after known-card "
      f"removal; frauds {y[raw_test].sum()} -> {y[test_geom_test].sum()}")
# Local referees: the removal takes out a third to a half of the week's
# frauds (the validation lesson's 74-91 a day falling to 41-60), and only
# rows of cards with an earlier fraud.
assert 0.3 < 1 - y[test_geom_test].sum() / y[raw_test].sum() < 0.6
removed = np.setdiff1d(raw_test, test_geom_test)
assert np.all(np.isin(card[removed], card[(y == 1) & (day < 90 - D_DELAY)]))
plot_daily(day, y, bands=[(70, 7, "train", "C0"), (77, 7, "delay", "0.6"), (84, 7, "test", "C1")],
           title="The deployment geometry")

# %%
# The checker passes a 30-day mini-stream (delay 2, test block 4, so the
# known set grows inside the test block) and reads the folds flattened.
distill.check("prequential-split",
              lambda *args: tuple(ix for fold in prequential_split(*args) for ix in fold))

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# One loop over folds, one inner loop over the test days of the fold. The
# training indices are one boolean mask. For each test day $T$, build the
# known set from the frauds on days $s \dots T - \delta - 1$ — `np.unique`
# of their cards — and keep that day's rows whose card is not in it
# (`np.isin`). Concatenate the days.
# </details>
#
# <details><summary>Hint 2 — the two dates that go wrong</summary>
#
# The known set on test day $T$ uses labels of days up to $T - \delta - 1$,
# not $T - 1$: on the morning of $T$ the last $\delta$ days are still being
# disputed. And it is rebuilt for every test day, not once at the start of
# the block. Each fold moves *all three* blocks back by $i\,\Delta_{\text{test}}$.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# folds = []
# for i in range(n_folds):
#     s = start_train - i * d_test
#     train = np.flatnonzero((day >= s) & (day < s + d_train))
#     first_test = s + d_train + d_delay
#     test = []
#     for T in range(first_test, first_test + d_test):
#         known = np.unique(card[(y == 1) & (day >= s) & (day <= T - d_delay - 1)])
#         test.append(np.flatnonzero((day == T) & ~np.isin(card, known)))
#     folds.append((train, np.sort(np.concatenate(test))))
# return folds
# ```
# </details>

# %% [markdown]
# ## 4. Card precision at k
#
# The test week is now the set of transactions the bank would score. The
# metric the investigators recognise counts cards, not transactions, and
# the metrics lesson defined it per day:
#
# 1. drop the rows of cards *detected* on an earlier day of the call;
# 2. collapse the day to one row per card — the card's maximum score and
#    maximum label;
# 3. rank the cards by score (ties: the smaller card id first) and take
#    the top $k$;
# 4. $CP@k(d)$ = compromised cards among them $/ k$ — divided by $k$ even
#    on a day with fewer than $k$ cards;
# 5. the compromised cards in the top $k$ are detected: they leave every
#    later day.
#
# The function returns the per-day values; their mean is the CP@k a
# report quotes.

# %%
def card_precision_top_k(day, card, y, scores, k):
    """Daily card precision at k with detected cards removed from later days.

    Args:
        day: (n,) integer days; card: (n,) integer card ids;
        y: (n,) labels in {0, 1}; scores: (n,) real scores.
        k: alerts (cards) per day.
    Returns:
        (D,) array: CP@k of each distinct day, days in ascending order.
    """
    # BEGIN SOLUTION
    detected = np.array([], dtype=card.dtype)
    out = []
    for d in np.unique(day):
        rows = (day == d) & ~np.isin(card, detected)
        cards, inv = np.unique(card[rows], return_inverse=True)
        top_score = np.full(len(cards), -np.inf)
        np.maximum.at(top_score, inv, scores[rows])
        top_label = np.zeros(len(cards))
        np.maximum.at(top_label, inv, y[rows])
        alerted = np.lexsort((cards, -top_score))[:k]
        hit = top_label[alerted] == 1
        out.append(hit.sum() / k)
        detected = np.concatenate([detected, cards[alerted][hit]])
    return np.array(out)
    # END SOLUTION


# %%
# Local referee: the metrics lesson's two days of CP@2. Day d: C1..C5 as in
# its figure; day d+1: C1 (detected on day d), C4, C2, C6, C3.
_day = np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
_card = np.array([1, 2, 1, 3, 4, 4, 5, 2, 1, 4, 2, 6, 3])
_y = np.array([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0])
_s = np.array([.91, .85, .62, .58, .55, .20, .10, .05, .88, .80, .30, .25, .12])
assert np.allclose(card_precision_top_k(_day, _card, _y, _s, 2), [0.5, 0.5])

# %%
# The handbook's baseline on this run: a depth-2 tree trained on the
# training week, scored on the cleaned test week.
tree2 = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X[test_geom_train], y[test_geom_train])
p2 = tree2.predict_proba(X[test_geom_test])[:, 1]
cp2 = card_precision_top_k(day[test_geom_test], card[test_geom_test], y[test_geom_test], p2, 100)
print("depth-2 tree, daily CP@100:", np.round(cp2, 2), f"mean {cp2.mean():.3f}")
print(f"ROC-AUC {roc_auc_score(y[test_geom_test], p2):.3f}, "
      f"AP {average_precision(y[test_geom_test], p2):.3f}")
# The handbook's run reports 0.241 for this tree; this run's stream is a
# different draw of the same generator and lands in the same region.
assert 0.2 < cp2.mean() < 0.35

# %%
distill.check("card-precision-top-k", card_precision_top_k)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Loop over `np.unique(day)`, carrying an array of detected cards. Per day:
# mask out detected cards, collapse with
# `cards, inv = np.unique(card[rows], return_inverse=True)` and
# `np.maximum.at` into per-card arrays of max score and max label, order
# the cards, cut at $k$, count, then append the hits to the detected array.
# </details>
#
# <details><summary>Hint 2 — the ranking with its tie rule</summary>
#
# `np.lexsort` sorts by its *last* key first: `np.lexsort((cards, -top_score))`
# orders by score descending and breaks ties by card id ascending.
# </details>
#
# <details><summary>Hint 3 — what "detected" means</summary>
#
# Only the compromised cards among the $k$ alerted ones are blocked. A
# genuine card that was called is cleared and keeps transacting; removing
# it from later days is a different (wrong) metric.
# </details>
#
# <details><summary>Hint 4 — last resort</summary>
#
# ```python
# detected = np.array([], dtype=card.dtype)
# out = []
# for d in np.unique(day):
#     rows = (day == d) & ~np.isin(card, detected)
#     cards, inv = np.unique(card[rows], return_inverse=True)
#     top_score = np.full(len(cards), -np.inf)
#     np.maximum.at(top_score, inv, scores[rows])
#     top_label = np.zeros(len(cards))
#     np.maximum.at(top_label, inv, y[rows])
#     alerted = np.lexsort((cards, -top_score))[:k]
#     hit = top_label[alerted] == 1
#     out.append(hit.sum() / k)
#     detected = np.concatenate([detected, cards[alerted][hit]])
# return np.array(out)
# ```
# </details>

# %% [markdown]
# ## 5. The Bayes-minimum-risk decision
#
# Card precision reads the order of the scores; the minimum-risk rule
# reads their values. With a calibrated probability $p_i$, flagging costs
# $C_a$ for certain and passing costs $\mathrm{Amt}_i$ with probability
# $p_i$, so the example-dependent lesson's rule is: flag transaction $i$
# exactly when
#
# $$C_a \le \mathrm{Amt}_i \cdot p_i .$$
#
# `bmr_report` makes those decisions and prices them with YOUR `savings`.

# %%
def bmr_report(amount, p, y, C_a):
    """Bayes-minimum-risk decisions and what they cost.

    Args:
        amount: (n,) amounts; p: (n,) calibrated fraud probabilities;
        y: (n,) labels in {0, 1}, used only to price the decisions;
        C_a: scalar alert cost.
    Returns:
        (decisions, cost, savings): (n,) float array in {0, 1}, then the
        cost and savings of those decisions from YOUR savings().
    """
    # BEGIN SOLUTION
    decisions = (C_a <= amount * p).astype(float)
    cost, _, sav = savings(amount, y, decisions, C_a)
    return decisions, cost, sav
    # END SOLUTION


# %%
# Local referee: the lesson's day again — the rule picks rows 2, 3, 4, 5, 7.
_dec, _cost, _sav = bmr_report(DAY_AMT, DAY_P, DAY_Y, 25.0)
assert np.array_equal(np.flatnonzero(_dec), [1, 2, 3, 4, 6]) and abs(_cost - 148) < 1e-9

# %%
distill.check("bmr-threshold", bmr_report)

# %% [markdown]
# The rule on the simulator's test week, with a depth-4 tree's leaf
# frequencies as probabilities. The simulator's amounts average about 50, so
# the alert cost is set at $C_a = 10$ in the same units. Savings against
# the alert cost, for the rule and for a fixed 0.5 threshold on the same
# scores:

# %%
C_A = 10.0
tree4 = DecisionTreeClassifier(max_depth=4, random_state=0).fit(X[test_geom_train], y[test_geom_train])
p4 = tree4.predict_proba(X[test_geom_test])[:, 1]
a_te, y_te = amount[test_geom_test], y[test_geom_test]
for name, dec in [("threshold 0.5", (p4 >= 0.5).astype(float)),
                  ("BMR", bmr_report(a_te, p4, y_te, C_A)[0])]:
    cost, cost_l, sav = savings(a_te, y_te, dec, C_A)
    print(f"{name:>13}: {int(dec.sum())} alerts, cost {cost:,.0f} of {cost_l:,.0f}, savings {sav:.1%}")
plot_savings_vs_cost(a_te, y_te, p4, np.linspace(1, 60, 25), title="Depth-4 tree, test week")

# %% [markdown]
# ## 6. The undersampling correction
#
# The rule above multiplies a probability by an amount, so it needs a
# probability. A model trained on an undersample — every fraud kept, each
# genuine row kept with probability $\beta$ — estimates the sample's
# posterior $p_s$, whose odds are the full data's divided by $\beta$. The
# imbalance lesson inverted that:
#
# $$p' = \frac{\beta\, p_s}{\beta\, p_s - p_s + 1}, \qquad
#   \tau' = \frac{\beta\, \tau_s}{(\beta - 1)\,\tau_s + 1},$$
#
# where $\tau'$ is the threshold on $p'$ that makes the same decisions as
# $\tau_s$ on $p_s$. $\beta$ is the *keep rate of the genuine rows*:
# kept genuine rows over all genuine rows. It equals the ratio
# $N^+/N^-$ only for the one undersample that comes out exactly balanced.

# %%
def undersampling_correction(p_s, y_full, kept, tau_s):
    """Undo class-dependent undersampling of the genuine class.

    Args:
        p_s: (m,) scores of a model trained on the undersample.
        y_full: (N,) labels of the FULL training set, in {0, 1}.
        kept: (N,) boolean, True for the rows the undersampler kept
            (every fraud is kept).
        tau_s: scalar threshold used on p_s.
    Returns:
        (p_prime, tau_prime, beta): the corrected (m,) scores, the
        matched threshold, and the keep rate beta measured from the data.
    """
    # BEGIN SOLUTION
    genuine = y_full == 0
    beta = kept[genuine].sum() / genuine.sum()
    p_prime = beta * p_s / (beta * p_s - p_s + 1)
    tau_prime = beta * tau_s / ((beta - 1) * tau_s + 1)
    return p_prime, float(tau_prime), float(beta)
    # END SOLUTION


# %%
# Infrastructure (do not modify): the undersampler.
def undersample(y, beta, seed):
    """Keep every fraud and each genuine row with probability beta."""
    return (y == 1) | (np.random.default_rng(seed).random(len(y)) < beta)


# Local referees: the correction moves no decision, and the sample prior
# as tau_s maps to the full-data prior.
_y_full = (np.random.default_rng(1).random(5000) < 0.05).astype(int)
_kept = undersample(_y_full, 0.2, 2)
_ps = np.random.default_rng(3).random(400)
_pp, _tp, _b = undersampling_correction(_ps, _y_full, _kept, 0.5)
assert np.array_equal(_ps >= 0.5, _pp >= _tp)
assert np.all(np.diff(_pp[np.argsort(_ps)]) >= 0)  # monotone: no rank moves
_, _tau_full, _ = undersampling_correction(_ps, _y_full, _kept, _y_full[_kept].mean())
assert abs(_tau_full - _y_full.mean()) < 1e-12

# %%
distill.check("undersampling-correction", undersampling_correction)

# %% [markdown]
# On the simulator: a decision tree is a poor probability model, so the
# demonstration uses the smooth one, a logistic regression, trained on the
# full training week and on a 5% undersample of it, and fed to YOUR
# minimum-risk rule. The ranking metric does not move; the decisions do.

# %%
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

y_tr = y[test_geom_train]
keep = undersample(y_tr, 0.05, seed=0)
lr_full = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X[test_geom_train], y_tr)
lr_under = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(
    X[test_geom_train][keep], y_tr[keep])
p_full = lr_full.predict_proba(X[test_geom_test])[:, 1]
p_s = lr_under.predict_proba(X[test_geom_test])[:, 1]
p_corr, _, beta = undersampling_correction(p_s, y_tr, keep, 0.5)
print(f"measured beta = {beta:.4f}")
for name, p in [("full data", p_full), ("undersampled p_s", p_s), ("corrected p'", p_corr)]:
    dec, cost, sav = bmr_report(a_te, p, y_te, C_A)
    print(f"{name:>17}: AP {average_precision(y_te, p):.3f}, Brier {np.mean((y_te - p) ** 2):.5f}, "
          f"{int(dec.sum())} alerts, savings {sav:.1%}")

# %% [markdown]
# ## 7. Prequential model selection
#
# The last function of the harness composes the others. Given a
# deployment whose training window starts on `start_train_test`, the
# validation lesson's shift says the newest admissible validation copy of
# the geometry starts training $\delta + \Delta_{\text{valid}}$ days earlier:
#
# $$s_0 = s_{\text{test}} - (\delta + \Delta_{\text{valid}}),$$
#
# so that its validation block ends where the deployment's delay begins.
# From $s_0$, YOUR `prequential_split` builds the $n$ folds (test block =
# validation block, $\Delta_{\text{valid}}$ days). For every candidate
# configuration and every fold: fit on the fold's training rows, score its
# validation rows, and record AP (YOUR `average_precision`), ROC-AUC
# (`roc_auc_score` is fine) and the mean of YOUR `card_precision_top_k`.
# Report each metric's mean and standard deviation over folds
# (`ddof=1`) and the index of the configuration each metric selects
# (`argmax`, first index on ties).
#
# A model enters as a fit-callable, `fit_fn(config, X_train, y_train)`,
# returning a `predict(X)` that gives scores. The function never sees
# anything but the rows each fold allows.

# %%
def prequential_selection(fit_fn, configs, X, y, day, card, start_train_test,
                          n_folds, d_train, d_delay, d_valid, k):
    """Validation scores of each config on prequential folds, and the picks.

    Args:
        fit_fn: fit_fn(config, X_train, y_train) -> predict, with
            predict(X) -> (m,) scores.
        configs: list of C candidate configurations.
        X: (n, f) features; y, day, card: (n,) as in prequential_split.
        start_train_test: first training day of the DEPLOYMENT geometry.
        n_folds, d_train, d_delay, d_valid: fold geometry (d_valid is the
            validation block, also the shift between folds).
        k: the card budget for CP@k.
    Returns:
        (means, stds, best): means and stds are (3, C) arrays with rows
        AP, ROC-AUC, mean CP@k over folds (stds with ddof=1); best is a
        (3,) integer array, the argmax of each row of means.
    """
    # BEGIN SOLUTION
    s0 = start_train_test - (d_delay + d_valid)
    folds = prequential_split(day, card, y, s0, n_folds, d_train, d_delay, d_valid)
    scores = np.empty((3, len(configs), n_folds))
    for j, config in enumerate(configs):
        for i, (tr, va) in enumerate(folds):
            s = fit_fn(config, X[tr], y[tr])(X[va])
            scores[:, j, i] = (average_precision(y[va], s),
                               roc_auc_score(y[va], s),
                               card_precision_top_k(day[va], card[va], y[va], s, k).mean())
    means = scores.mean(axis=2)
    return means, scores.std(axis=2, ddof=1), means.argmax(axis=1)
    # END SOLUTION


# %%
distill.check("prequential-selection", prequential_selection)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Compute $s_0$, call YOUR `prequential_split` once, then a double loop
# (configs × folds) filling a `(3, C, n_folds)` array. Means and stds over
# the last axis; `argmax(axis=1)` on the means.
# </details>
#
# <details><summary>Hint 2 — where the folds start</summary>
#
# Passing `start_train_test` straight to the splitter makes fold 0's
# validation block the deployment's *test* week: the selection then reads
# rows whose labels do not exist at deployment time. Shifting by
# $\Delta_{\text{valid}}$ alone puts the validation block in the
# deployment's delay period, whose labels are still in transit. The shift
# is $\delta + \Delta_{\text{valid}}$.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# s0 = start_train_test - (d_delay + d_valid)
# folds = prequential_split(day, card, y, s0, n_folds, d_train, d_delay, d_valid)
# scores = np.empty((3, len(configs), n_folds))
# for j, config in enumerate(configs):
#     for i, (tr, va) in enumerate(folds):
#         s = fit_fn(config, X[tr], y[tr])(X[va])
#         scores[:, j, i] = (average_precision(y[va], s),
#                            roc_auc_score(y[va], s),
#                            card_precision_top_k(day[va], card[va], y[va], s, k).mean())
# means = scores.mean(axis=2)
# return means, scores.std(axis=2, ddof=1), means.argmax(axis=1)
# ```
# </details>

# %% [markdown]
# ### The referee at work: a depth grid on four folds
#
# The harness now runs the validation lesson's experiment on this stream:
# trees of depth 2 to 50, four weekly folds ending where the deployment's
# delay begins (training starts on days 56, 49, 42, 35), CP at the
# handbook's budget of 100 cards a day. Then every depth is also trained on
# the deployment's training week and scored on the test week, the quantity
# the validation is supposed to predict. About half a minute.

# %%
# Infrastructure (do not modify): the tree fit-callable and the grid.
DEPTHS = [2, 3, 4, 5, 6, 8, 10, 20, 50]


def fit_tree(depth, X_train, y_train):
    model = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X_train, y_train)
    return lambda X_new: model.predict_proba(X_new)[:, 1]


val_means, val_stds, best = prequential_selection(
    fit_tree, DEPTHS, X, y, day, card, START_TEST_TRAIN, 4, D_TRAIN, D_DELAY, D_TEST, 100)
test_scores = np.empty((3, len(DEPTHS)))
te = test_geom_test
for j, depth in enumerate(DEPTHS):
    s = fit_tree(depth, X[test_geom_train], y[test_geom_train])(X[te])
    test_scores[:, j] = (average_precision(y[te], s), roc_auc_score(y[te], s),
                         card_precision_top_k(day[te], card[te], y[te], s, 100).mean())
plot_selection(DEPTHS, val_means, val_stds, test_scores, title="Depth selection on four prequential folds")
for r, name in enumerate(["AP", "ROC-AUC", "CP@100"]):
    print(f"{name:>8} selects depth {DEPTHS[best[r]]:>2}: validation {val_means[r, best[r]]:.3f} "
          f"± {val_stds[r, best[r]]:.3f}; at depth 50: {val_means[r, -1]:.3f}")

# %%
# What the three panels say, as asserts. Depth 50 is the fully grown tree:
# AP ranks it last of the grid, at well under two-thirds of the best depth.
# ROC-AUC rises from depth 20 back up to depth 50 and puts the fully grown
# tree within one fold-standard-deviation of its own pick. CP@100 keeps
# every depth from 3 to 50 within 0.03 of each other.
ap, auc, cp = val_means
assert np.argmin(ap) == len(DEPTHS) - 1 and ap[-1] < 0.65 * ap.max()
assert auc[-1] > auc[DEPTHS.index(20)] + 0.01
assert auc.max() - auc[-1] < val_stds[1, best[1]]
assert cp[1:].max() - cp[1:].min() < 0.03

# %% [markdown]
# The handbook's run of the same experiment had validation ROC-AUC
# *select* depth 50, at 0.823 against about 0.81 for the depths around 4;
# on this run the order of those two numbers is reversed by a similar
# margin. Both runs agree on the part that does not depend on the draw:
# ROC-AUC climbs from depth 20 back up to the fully grown tree and leaves
# it within one fold-standard-deviation of the best depth, while AP puts
# it last at little more than half the best value. A selection by ROC-AUC
# on these folds is a coin flip between the best tree and the overfitted
# one; a selection by AP is not. CP@100 settles neither way: it barely
# separates the depths from 3 to 50, all within a couple of hundredths of
# each other against a fold standard deviation of about 0.01.

# %% [markdown]
# ## 8. Written answer: why ROC-AUC forgives the fully grown tree
#
# In 3–6 sentences: why does validation ROC-AUC score the depth-50 tree
# level with the best depth, and above depth 20, while average precision
# ranks it last? Use what a fully grown tree's scores look like, what the
# ROC area does with them, and what AP weights instead. "Overfitting" is
# where the answer starts, not the answer.

# %%
distill.submit_review(
    "why-auc-forgives-depth-fifty",
    "A tree grown to pure leaves scores almost every validation row 0 or 1: "
    "on these folds about 99% of the rows get 0, so the ROC curve has one "
    "interior point (FPR, TPR) and the area is (1 + TPR - FPR)/2 - the "
    "straight segment to (1, 1) credits half of every fraud-genuine pair "
    "tied in the score-0 block. That point sits at a recall of 0.6-0.7 and "
    "a false-positive rate under 0.5%, so the area lands level with the "
    "best moderate tree; depth 20 has many small leaves of low precision "
    "and earns less from its curve than the deep tree earns from the free "
    "triangle. AP instead weights precision at each fraud's rank: the deep "
    "tree's score-1 block is about half genuine rows whose training leaves "
    "happened to be pure, and the frauds in the score-0 block are credited "
    "at the precision of the whole list, near the prevalence, so AP falls "
    "to about recall times 0.55. ROC-AUC integrates the region beyond any "
    "alert budget, where the free triangle lives; AP reads the top of the "
    "ranking, where the deep tree is worst.",
)

# %% [markdown]
# ## 9. Open task: beat the held-out week
#
# `data/holdout_week.csv` is one week of a second run of the same
# generator, with a seed that is not published: the week a model deployed
# on its day 84 would score, with known cards already removed, 15 feature
# columns in `FEATURES` order and no labels. Train any model on any rows
# of this notebook's stream — more weeks, other model classes, other
# features computed from the columns given — and submit one score per
# held-out row.
#
# The server grades ROC-AUC, one of the three metrics the platform's
# checkpoint API computes (ROC-AUC, accuracy, RMSE); CP@100 and savings
# need card ids and days that the held-out file deliberately omits. The bar is **0.85**. For scale on the held-out week: a depth-2
# tree scores about 0.80 and the best trees of the grid about 0.83–0.84,
# whether trained on one week or on six — no single tree clears it.
#
# The cell below expects two arrays from you: `holdout_scores`, one score
# per held-out row in file order, and `mine`, the same model class trained
# on rows a model deployed on day 84 could have used (labels up to day
# 76) and scored on this stream's cleaned test week (`X[te]`). The second
# is what your harness can judge here: the cell prints its ROC-AUC — a
# local proxy of the graded number — AP and CP@100 next to the depth-4
# tree's, and draws both PR curves.

# %%
holdout_X = np.loadtxt("data/holdout_week.csv", delimiter=",", skiprows=1)
print("held-out rows:", holdout_X.shape)

# %%
# BEGIN SOLUTION
# Six warm weeks with labels in by day 84, a smooth score instead of leaves.
rows = np.flatnonzero((day >= 35) & (day <= 76))
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)).fit(X[rows], y[rows])
holdout_scores = model.predict_proba(holdout_X)[:, 1]
mine = model.predict_proba(X[te])[:, 1]
# END SOLUTION
cp_mine = card_precision_top_k(day[te], card[te], y[te], mine, 100).mean()
cp_tree = card_precision_top_k(day[te], card[te], y[te], p4, 100).mean()
print(f"test week, your model: ROC-AUC {roc_auc_score(y[te], mine):.3f}, "
      f"AP {average_precision(y[te], mine):.3f}, CP@100 {cp_mine:.3f}")
print(f"test week, depth-4 tree: ROC-AUC {roc_auc_score(y[te], p4):.3f}, "
      f"AP {average_precision(y[te], p4):.3f}, CP@100 {cp_tree:.3f}")
plot_pr_steps({"your model": (y[te], mine), "depth-4 tree": (y[te], p4)}, title="Test week")

# %%
distill.submit_predictions("beat-holdout-week", holdout_scores)

# %% [markdown]
# Try first; the hints are below.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Two levers: more training data and a model that averages many trees or
# fits a smooth score. This notebook's stream has labels for every day, and
# the held-out week belongs to a different run, so every warm week (from
# about day 35, once the 30-day windows are full) is fair training data
# for `holdout_scores`; for `mine`, stop at day 76. A logistic regression on
# standardised features (section 6 built one), a random forest or a
# gradient-boosted model each clear the bar.
# </details>
#
# <details><summary>Hint 2 — reading a failure</summary>
#
# A submission near 0.5 is usually a shape problem: one score per held-out
# row, in file order, as a 1-D array of floats — `predict_proba(...)[:, 1]`,
# not `predict(...)`, whose 0/1 output throws the ranking away.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# rows = np.flatnonzero((day >= 35) & (day <= 76))
# model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
# model.fit(X[rows], y[rows])
# holdout_scores = model.predict_proba(holdout_X)[:, 1]
# mine = model.predict_proba(X[te])[:, 1]
# ```
# </details>

# %% [markdown]
# ## What the harness is
#
# Seven functions now stand verified: a step-sum AP that respects ties, a
# savings measure with the cheaper trivial policy as its baseline, a
# prequential splitter with per-day known-card removal, a daily card
# precision with caught cards leaving the pool, the per-transaction
# minimum-risk decision, the undersampling correction with its matched
# threshold, and a selection routine that validates only on labels a
# deployment would have. The feature lab of module 3 scores its features
# with them, the scorecard lab of module 4 decides between two detectors
# with them, and the capstone reports its cumulative CP@100 with them.

# %%
distill.dump()
