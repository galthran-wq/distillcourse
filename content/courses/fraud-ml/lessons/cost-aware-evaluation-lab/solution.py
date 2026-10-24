# %% [markdown]
# # Lab: a budget- and cost-aware evaluation harness
#
# A fraud detector's number is honest only if three things hold: the folds
# respect the label delay, the metric respects the investigators' call
# budget, and the probabilities are undone from the undersampling the model
# was trained on. Concretely that means average precision and card precision
# at the budget instead of accuracy and ROC-AUC, forward-in-time folds with a
# delay block and known cards removed, cost and savings in money, the
# per-transaction Bayes-minimum-risk decision, and the correction that turns
# an undersampled model's scores back into probabilities. None of it is code
# yet. Every model comparison is decided by this referee, so the referee has
# to exist, and be right, before any model is worth comparing.
#
# You build it here, one function per checkpoint:
# `average_precision`, `savings`, `prequential_split`,
# `card_precision_top_k`, `undersampling_correction`, `bmr_decide_and_price`
# and `prequential_selection`. Each obvious implementation of these is wrong
# in a specific way — a trapezoid where a step belongs, three alerts for one
# card, the known-card list frozen at the end of training, a keep rate
# confused with a class ratio — and the checkers name the bug when your
# output matches one. At the end the harness referees a real decision: which
# depth of decision tree to ship on a simulated card stream, where ROC-AUC
# and average precision disagree about the fully grown tree.
#
# Ground rules:
#
# - Inside the seven graded functions, numpy and pandas only — no
#   `sklearn.metrics` for AP, no ready-made splitter. Checking your result
#   against scikit-learn on your own machine is fine. The one exception is
#   ROC-AUC inside `prequential_selection`, where `roc_auc_score` is allowed:
#   it is not what this lab teaches.
# - The simulator, the feature builder, the plotting helpers and the model
#   fits ship complete. They are infrastructure; read them, do not edit them.
# - The seven exact checkpoints are the required set. The open task and the
#   written answer at the end are optional — partial completion is a normal
#   way to finish a lab.

# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import roc_auc_score, roc_curve

import distill

distill.open_lab("fraud-ml/cost-aware-evaluation-lab")

# %% [markdown]
# ## 1. Average precision as a step sum
#
# A model has ranked a list of transactions; the team works down it. At each
# fraud it reaches, the precision of the alerts opened so far is what that
# fraud cost to find. Average precision is the mean of those precisions over
# all frauds — equivalently, the area under the precision-recall staircase
# drawn with rectangles:
#
# $$\mathrm{AP} = \sum_n (R_n - R_{n-1})\, P_n ,$$
#
# where the sum runs over the cuts of the ranked list and $P_n$, $R_n$ are
# the precision and recall of the top $n$. Two details carry the whole
# definition:
#
# - **No interpolation.** Recall moves only when a fraud is passed, and the
#   precision-recall walk is not monotone; joining its points with straight
#   lines describes cuts nobody can make. Rectangles, never trapezoids.
# - **Ties are one cut.** A block of rows with the same score cannot be
#   ordered by the model, so the team opens it whole: every fraud inside the
#   block is reached at the precision of the cut after the block. Cuts are
#   placed only between distinct score values.
#
# The ten-transaction toy from the alert-budget lesson is the local referee:
# frauds at ranks 1 and 4, AP $= \tfrac12(1/1 + 2/4) = 0.75$.

# %%
def average_precision(labels, scores):
    """Average precision of a ranking, step sum, ties as one cut.

    Args:
        labels: (n,) array of 0/1, at least one 1.
        scores: (n,) float array; higher means more suspicious.
    Returns:
        float: sum over distinct-score cuts (highest score first) of
        (recall gained at the cut) * (precision at the cut).
    """
    # BEGIN SOLUTION
    labels = np.asarray(labels, dtype=float)
    scores = np.asarray(scores, dtype=float)
    order = np.argsort(-scores, kind="stable")
    s, y = scores[order], labels[order]
    # The last row of each block of equal scores closes one cut.
    last = np.r_[s[1:] != s[:-1], True]
    tp = np.cumsum(y)[last]
    n_alerts = np.flatnonzero(last) + 1
    precision = tp / n_alerts
    recall = tp / y.sum()
    return float(np.sum(np.diff(np.r_[0.0, recall]) * precision))
    # END SOLUTION

# %%
toy_labels = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])
toy_scores = np.array([0.9, 0.35, 0.45, 0.4, 0.2, 0.2, 0.2, 0.1, 0.1, 0.0])
assert np.isclose(average_precision(toy_labels, toy_scores), 0.75)
# A constant score is one tied block: AP is the base rate, exactly.
assert np.isclose(average_precision(toy_labels, np.zeros(10)), 0.2)

# %%
distill.check("average-precision", average_precision)

# %% [markdown]
# ## 2. Cost and savings in money
#
# Ranking metrics ignore amounts. The example-dependent-cost lesson priced
# each transaction instead: an alert costs the investigator's call $C_a$
# whether the transaction was fraud or not, and a missed fraud costs its
# amount. With $d_i \in \{0, 1\}$ the decision to alert,
#
# $$\mathrm{Cost}(d) = \sum_i \bigl[\, y_i (1 - d_i)\, \mathrm{Amt}_i + d_i\, C_a \bigr].$$
#
# A caught fraud still costs $C_a$ — the call was made. Savings measures a
# set of decisions against the cheaper of the two policies that need no
# model, flagging nothing (cost: the fraud amount) and flagging everything
# (cost: $N C_a$):
#
# $$\mathrm{Cost_{base}} = \min\Bigl(\sum_i y_i \mathrm{Amt}_i,\; N C_a\Bigr), \qquad
#   S = \frac{\mathrm{Cost_{base}} - \mathrm{Cost}(d)}{\mathrm{Cost_{base}}}.$$
#
# Which trivial policy is cheaper depends on $C_a$: on a card stream it is
# almost always flagging nothing, but a cheap enough call flips it. The
# function prices the same decisions under several alert costs at once so
# that both branches are exercised.

# %%
def savings(amounts, labels, decisions, c_a):
    """Cost, baseline cost and savings of a set of alert decisions.

    Args:
        amounts: (n,) transaction amounts in euros.
        labels: (n,) 0/1, 1 = fraud.
        decisions: (n,) 0/1, 1 = alert.
        c_a: float or (m,) array of alert costs in euros.
    Returns:
        (cost, cost_base, saving): three (m,) arrays (m = 1 for a scalar
        c_a), one entry per alert cost.
    """
    # BEGIN SOLUTION
    amounts = np.asarray(amounts, dtype=float)
    y = np.asarray(labels, dtype=float)
    d = np.asarray(decisions, dtype=float)
    c_a = np.atleast_1d(np.asarray(c_a, dtype=float))
    missed = np.sum(y * (1 - d) * amounts)
    cost = missed + d.sum() * c_a
    cost_base = np.minimum(np.sum(y * amounts), len(amounts) * c_a)
    return cost, cost_base, (cost_base - cost) / cost_base
    # END SOLUTION

# %%
# Five payments, two frauds worth €1,150. At C_a = €5 flagging all five
# (€25) is the cheaper trivial policy; at C_a = €500 flagging nothing is.
_amt = np.array([12.0, 250.0, 40.0, 8.0, 900.0])
_y = np.array([0, 1, 0, 0, 1])
_cost, _base, _sav = savings(_amt, _y, _y, np.array([5.0, 500.0]))
assert np.allclose(_base, [25.0, 1150.0]) and np.allclose(_cost, [10.0, 1000.0])
assert np.allclose(_sav, [0.6, 150 / 1150])
# Flagging nothing saves nothing when flagging nothing is the baseline.
assert np.allclose(savings(_amt, _y, np.zeros(5), 500.0)[2], 0.0)

# %%
distill.check("savings-metric", savings)

# %% [markdown]
# ## The stream: a simulated card network
#
# The rest of the lab runs on a simulated payment-card stream: the
# transaction data simulator, rewritten here from its stated rules (see the
# References cell). One row is one card payment. 5,000 cardholders and
# 10,000 terminals sit on a 100 × 100 grid; each cardholder pays only at
# terminals within distance 5, a Poisson number of times a day with a mean
# drawn between 0 and 4, amounts normal around a personal mean between €5
# and €100. Three fraud scenarios run on top:
#
# 1. any payment above €220 is fraud — an obvious pattern a detector must
#    catch;
# 2. every day two terminals are compromised, and every payment on them for
#    the next 28 days is fraud;
# 3. every day three cards leak, and for the next 14 days a third of their
#    payments are fraud with the amount multiplied by five.
#
# 63 days, day 0 = Sunday 1 April 2018, about 620,000 payments, 0.7% fraud.
# The feature builder adds the 15 standard baseline features: the amount,
# weekend and night flags, the card's number of payments and mean amount over
# the last 1, 7 and 30 days, and the terminal's number of payments and fraud
# rate over 1, 7 and 30 days ending a week ago — a terminal's fraud labels
# arrive a week late, like every label in this stream.

# %%
# Infrastructure (do not modify): the simulator and the feature builder.
DAY = 86400


def simulate(seed, n_customers=5000, n_terminals=10000, n_days=63, radius=5.0):
    """One run of the card-stream simulator; rows sorted by time."""
    rng = np.random.default_rng(seed)
    cx, cy = rng.uniform(0, 100, (2, n_customers))
    mean_amt = rng.uniform(5, 100, n_customers)
    rate = rng.uniform(0, 4, n_customers)
    tx, ty = rng.uniform(0, 100, (2, n_terminals))
    near = [np.flatnonzero((tx - cx[c]) ** 2 + (ty - cy[c]) ** 2 < radius**2)
            for c in range(n_customers)]
    n_near = np.array([len(t) for t in near])

    counts = rng.poisson(rate[:, None], size=(n_customers, n_days)).ravel()
    cust = np.repeat(np.repeat(np.arange(n_customers), n_days), counts)
    day = np.repeat(np.tile(np.arange(n_days), n_customers), counts)
    sec = rng.normal(DAY / 2, 20000, len(cust)).astype(np.int64)
    amount = rng.normal(mean_amt[cust], mean_amt[cust] / 2)
    neg = amount < 0
    amount[neg] = rng.uniform(0, 2 * mean_amt[cust[neg]])
    keep = (sec > 0) & (sec < DAY) & (n_near[cust] > 0)
    cust, day, sec, amount = cust[keep], day[keep], sec[keep], amount[keep]
    first = np.r_[0, np.cumsum(n_near)[:-1]]
    pick = (rng.random(len(cust)) * n_near[cust]).astype(np.int64)
    term = np.concatenate(near)[first[cust] + pick]

    t = day * DAY + sec
    o = np.argsort(t, kind="stable")
    cust, day, term, amount, t = cust[o], day[o], term[o], np.round(amount[o], 2), t[o]
    fraud = (amount > 220).astype(np.int64)                       # scenario 1
    scenario = fraud.copy()
    for d0 in range(n_days):                                       # scenario 2
        hit = (day >= d0) & (day < d0 + 28) & np.isin(term, rng.choice(n_terminals, 2, replace=False))
        fraud[hit], scenario[hit] = 1, 2
    for d0 in range(n_days):                                       # scenario 3
        rows = np.flatnonzero((day >= d0) & (day < d0 + 14)
                              & np.isin(cust, rng.choice(n_customers, 3, replace=False)))
        chosen = rng.choice(rows, len(rows) // 3, replace=False)
        amount[chosen] = np.round(amount[chosen] * 5, 2)
        fraud[chosen], scenario[chosen] = 1, 3
    return pd.DataFrame({"TX_TIME_SECONDS": t, "TX_TIME_DAYS": day, "CUSTOMER_ID": cust,
                         "TERMINAL_ID": term, "TX_AMOUNT": amount,
                         "TX_FRAUD": fraud, "TX_FRAUD_SCENARIO": scenario})


def _window_sum(key, t, values, width, lag=0):
    """Per row: sum of `values` over rows with the same key and time in
    (t - lag - width, t - lag]. Rows must be sorted by (key, t)."""
    k = key * 10**9 + t
    hi = np.searchsorted(k, k - lag, side="right")
    lo = np.searchsorted(k, k - lag - width, side="right")
    cs = np.r_[0.0, np.cumsum(values)]
    return cs[hi] - cs[lo]


def build_features(df, label_delay_days=7):
    """The 15 baseline features, each computed from earlier rows only (a
    card's own windows include the current payment, as at scoring time)."""
    t = df.TX_TIME_SECONDS.to_numpy()
    out = pd.DataFrame({"TX_AMOUNT": df.TX_AMOUNT.to_numpy()})
    out["TX_DURING_WEEKEND"] = ((df.TX_TIME_DAYS.to_numpy() + 6) % 7 >= 5).astype(np.int64)
    out["TX_DURING_NIGHT"] = ((t % DAY) // 3600 <= 6).astype(np.int64)
    cust = df.CUSTOMER_ID.to_numpy()
    o = np.lexsort((t, cust))
    for w in (1, 7, 30):
        n = _window_sum(cust[o], t[o], np.ones(len(o)), w * DAY)
        s = _window_sum(cust[o], t[o], df.TX_AMOUNT.to_numpy()[o], w * DAY)
        out.loc[o, f"CUSTOMER_NB_TX_{w}DAY"] = n
        out.loc[o, f"CUSTOMER_AVG_AMOUNT_{w}DAY"] = s / n
    term = df.TERMINAL_ID.to_numpy()
    o = np.lexsort((t, term))
    lag = label_delay_days * DAY
    for w in (1, 7, 30):
        n = _window_sum(term[o], t[o], np.ones(len(o)), w * DAY, lag)
        f = _window_sum(term[o], t[o], df.TX_FRAUD.to_numpy()[o].astype(float), w * DAY, lag)
        out.loc[o, f"TERMINAL_NB_TX_{w}DAY"] = n
        out.loc[o, f"TERMINAL_RISK_{w}DAY"] = np.where(n > 0, f / np.maximum(n, 1), 0.0)
    return out


stream = simulate(seed=0)
X = build_features(stream).to_numpy()
FEATURES = list(build_features(stream.head(0)).columns)
days = stream.TX_TIME_DAYS.to_numpy()
cards = stream.CUSTOMER_ID.to_numpy()
y = stream.TX_FRAUD.to_numpy()
amounts = stream.TX_AMOUNT.to_numpy()
print(f"{len(stream):,} payments, {y.mean():.2%} fraud; by scenario:",
      stream.TX_FRAUD_SCENARIO.value_counts().sort_index().to_dict())

# %% [markdown]
# ## 3. Prequential folds with a delay block
#
# Stand on the first day of a test week. The model was trained on a block
# of `delta_train` days that ended `delta_delay` days earlier: the labels of
# the most recent days have not arrived yet, so those days sit in a delay
# block whose labels nobody uses. The test block is the `delta_test` days
# that follow. One such geometry is one fold; prequential validation repeats
# it `n_folds` times, **shifting the whole geometry** — training, delay and
# test — back by one test block per fold, so every fold keeps the delay
# between what was learned and what is scored.
#
# Fold $j$ ($j = 0, \dots$) for a given `start`:
#
# - training days $[s_j,\ s_j + \delta_{train})$ with $s_j = \text{start} - j\,\delta_{test}$;
# - test days $[s_j + \delta_{train} + \delta_{delay},\ \ldots + \delta_{test})$.
#
# **Known cards.** The bank blocks a card once a fraud on it is confirmed,
# so a test payment on such a card would never be scored. A card is known on
# test day $d$ when it has a fraud on some day in $[s_j,\ d - \delta_{delay} - 1]$:
# the labels of day $d - \delta_{delay}$ arrive during day $d$, too late for
# that morning's scoring. The date moves with $d$ — each test day has its own
# known-card list, which grows through the week. The count starts at the
# fold's training block, as in the delayed-labels lesson.
#
# Return the folds as a role matrix rather than index lists: entry
# `roles[j, i]` is 1 if row $i$ trains fold $j$, 2 if it is scored in fold
# $j$'s test block, 0 otherwise (delay-block rows, removed known-card rows,
# rows outside the fold).

# %%
def prequential_split(days, cards, labels, start, n_folds, delta_train, delta_delay, delta_test):
    """Prequential train/test folds with a delay block and known-card removal.

    Args:
        days: (n,) int day index of each transaction.
        cards: (n,) int card id.
        labels: (n,) 0/1 fraud label.
        start: first training day of fold 0.
        n_folds: number of folds; fold j's geometry starts at
            start - j * delta_test.
        delta_train, delta_delay, delta_test: block widths in days.
    Returns:
        (n_folds, n) int array: 1 = training row of that fold, 2 = scored
        test row of that fold, 0 = anything else.
    """
    # BEGIN SOLUTION
    days, cards, labels = np.asarray(days), np.asarray(cards), np.asarray(labels)
    roles = np.zeros((n_folds, len(days)), dtype=np.int64)
    for j in range(n_folds):
        s = start - j * delta_test
        roles[j, (days >= s) & (days < s + delta_train)] = 1
        for i in range(delta_test):
            d = s + delta_train + delta_delay + i
            known = cards[(labels == 1) & (days >= s) & (days <= d - delta_delay - 1)]
            roles[j, (days == d) & ~np.isin(cards, known)] = 2
    return roles
    # END SOLUTION

# %%
# Local referees: the five cards of the delayed-labels lesson. Training days
# 0-6, delay 7-13, test 14-20 (one fold, start 0). First frauds: card a on
# day 1, b on 5, c on 9, d on 11, e on 15. On test day 14 (labels known up to
# day 6) only a and b are removed; on day 20 (known up to day 12) c and d too.
_cards = np.array([0, 1, 2, 3, 4] * 3 + [0, 1, 2, 3, 4] * 2)
_days = np.array([1, 5, 9, 11, 15] + [14] * 5 + [20] * 5 + [3] * 5 + [17] * 5)
_lab = np.r_[np.ones(5, int), np.zeros(20, int)]
_r = prequential_split(_days, _cards, _lab, 0, 1, 7, 7, 7)[0]
assert set(_cards[(_days == 14) & (_r == 2)]) == {2, 3, 4}
assert set(_cards[(_days == 20) & (_r == 2)]) == {4}
assert set(_cards[(_days == 17) & (_r == 2)]) == {3, 4}  # d's fraud (day 11) known only from day 19
# The same cards with the fold started on day 2 (train 2-8, test 16-22): a's
# fraud on day 1 is before the training block, so a stays scored all week.
_r = prequential_split(_days, _cards, _lab, 2, 1, 7, 7, 7)[0]
assert set(_cards[(_days == 17) & (_r == 2)]) == {0, 3, 4}
assert set(_cards[(_days == 20) & (_r == 2)]) == {0, 4}
# Every fold keeps the delay: its last training day is delta_delay + 1 days
# before its first test day.
_r = prequential_split(np.arange(60), np.arange(60), np.zeros(60, int), 30, 3, 7, 7, 7)
for _j in range(3):
    assert np.flatnonzero(_r[_j] == 2).min() - np.flatnonzero(_r[_j] == 1).max() == 8

# %%
distill.check("prequential-split", prequential_split)

# %% [markdown]
# The deployment geometry for the rest of the lab: train on days 42–48,
# delay 49–55, test 56–62. The first plot shows the daily fraud counts with
# the blocks, and how much of the test week's fraud the known-card removal
# takes out (grey: all frauds; red: frauds still scored).
#
# The second plot is the same week with the known-card list frozen at the end
# of training — the bug the checker names for `prequential-split`. Day 56 is
# the same in both plots; from day 57 on, cards whose fraud on a delay-block
# day had been confirmed stay in the test set, and the red bars stand taller
# than in the first plot. Those extra frauds sit on cards the bank had
# already blocked. They are easy to catch (the card's recent history is
# fraud) and inflate every test-week number.

# %%
# Infrastructure (do not modify): block plot.
def plot_blocks(days, labels, roles_row, title=""):
    d = np.arange(days.max() + 1)
    fr = np.bincount(days, weights=labels, minlength=len(d))
    kept = np.bincount(days, weights=labels * (roles_row == 2), minlength=len(d))
    fig, ax = plt.subplots(figsize=(9, 3))
    ax.bar(d, fr, color="0.75", label="frauds")
    ax.bar(d, kept, color="C3", label="frauds scored after known-card removal")
    for role, color, name in ((1, "C0", "train"), (2, "C3", "test")):
        on = np.unique(days[roles_row == role])
        if len(on):
            ax.axvspan(on.min() - 0.5, on.max() + 0.5, color=color, alpha=0.08)
            ax.text(on.mean(), fr.max() * 1.02, name, ha="center", color=color)
    ax.set_xlabel("day"); ax.set_ylabel("frauds per day"); ax.set_title(title)
    ax.legend(loc="lower left", fontsize=8)
    plt.show()


deploy = prequential_split(days, cards, y, 42, 1, 7, 7, 7)[0]
train_rows, test_rows = np.flatnonzero(deploy == 1), np.flatnonzero(deploy == 2)
raw_test = (days >= 56) & (days <= 62)
print(f"test week: {raw_test.sum():,} payments, {y[raw_test].sum()} frauds raw; "
      f"{len(test_rows):,} and {y[test_rows].sum()} after known-card removal")
plot_blocks(days, y, deploy, "deployment geometry")

# The broken shape: known cards counted on the training block only.
frozen = deploy.copy()
known_at_train_end = np.unique(cards[(y == 1) & (days >= 42) & (days <= 48)])
frozen[raw_test & ~np.isin(cards, known_at_train_end)] = 2
print(f"frozen known-card list: {(frozen == 2).sum():,} test payments, "
      f"{y[frozen == 2].sum()} frauds")
plot_blocks(days, y, frozen, "known-card list frozen at the end of training (wrong)")

# %% [markdown]
# ## 4. Card precision at k
#
# The team calls cards, not transactions, and calls $k$ of them a day. Per
# test day $t$, collapse the day's payments to one row per card — the card's
# **maximum** score (its most suspicious payment decides whether it is
# called) and its **maximum** label (it is compromised that day if any of its
# payments is fraud) — take the $k$ cards with the highest scores, and count
# the compromised ones:
#
# $$\mathrm{CP@}k(t) = \frac{\#\{\text{compromised cards among the top } k\}}{k}.$$
#
# A compromised card found on day $t$ is blocked: its payments on later days
# of the week are removed before those days are ranked, so a card is never
# credited twice. Days are processed in increasing order; the divisor is
# $k$ even on a day with fewer than $k$ cards.

# %%
def card_precision_top_k(days, cards, scores, labels, k):
    """Daily card precision at k with detected-card removal.

    Args:
        days: (n,) int day of each transaction.
        cards: (n,) int card id.
        scores: (n,) float model score; no two cards share a maximum on a day
            in the checker's inputs, so tie-breaking is free.
        labels: (n,) 0/1 fraud label.
        k: cards called per day.
    Returns:
        (n_days,) float array, CP@k for each distinct day in increasing order.
    """
    # BEGIN SOLUTION
    frame = pd.DataFrame({"day": days, "card": cards, "score": scores, "label": labels})
    detected = set()
    out = []
    for _, today in frame.groupby("day", sort=True):
        today = today[~today.card.isin(detected)]
        per_card = today.groupby("card")[["score", "label"]].max()
        top = per_card.sort_values("score", ascending=False, kind="stable").head(k)
        found = top.index[top.label == 1]
        out.append(len(found) / k)
        detected.update(found)
    return np.array(out)
    # END SOLUTION

# %%
# Local referee: card 7's three alerts take one of the two slots on day 0
# (transaction-level precision would read 1.0); found on day 0, card 7 is
# not credited again on day 1 (without removal day 1 would read 0.5).
_d = np.array([0, 0, 0, 0, 0, 1, 1, 1])
_c = np.array([7, 7, 7, 8, 9, 7, 8, 9])
_s = np.array([0.9, 0.8, 0.7, 0.6, 0.1, 0.95, 0.5, 0.4])
_l = np.array([1, 1, 1, 0, 0, 1, 0, 0])
assert np.allclose(card_precision_top_k(_d, _c, _s, _l, 2), [0.5, 0.0])

# %%
distill.check("card-precision-top-k", card_precision_top_k)

# %% [markdown]
# The sanity reference: a depth-2 tree trained on days 42–48 and scored on
# the cleaned test week. The alert-budget lesson's tree on the full-size
# simulator scored a card precision at 100 of about 0.24 with removal; this
# run's daily fraud counts differ, so expect the same order, not the same
# digits.

# %%
tree2 = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X[train_rows], y[train_rows])
s_test = tree2.predict_proba(X[test_rows])[:, 1]
cp = card_precision_top_k(days[test_rows], cards[test_rows], s_test, y[test_rows], 100)
print("depth-2 tree, CP@100 per day:", np.round(cp, 2), f"mean {cp.mean():.3f}")
print(f"AP {average_precision(y[test_rows], s_test):.3f}, "
      f"ROC-AUC {roc_auc_score(y[test_rows], s_test):.3f}")

# %% [markdown]
# ## 5. Undoing the undersampling
#
# Trees and boosted models on fraud data are often trained after deleting
# most genuine rows: every fraud is kept, each genuine row with probability
# $\beta$. The model then estimates the fraud probability of the
# *undersampled* data, $p_s$, which overstates the stream's $p$ by up to
# $1/\beta$. The undersampling lesson inverted the distortion:
#
# $$p' = \frac{\beta\, p_s}{\beta\, p_s - p_s + 1},$$
#
# a monotone map — the ranking, hence AP and CP@k, is untouched; only
# decisions that read the probability's value change. A threshold
# $\tau_s$ chosen on the undersampled scale maps to $\tau'$ by the same
# formula, so that $p_s \ge \tau_s \iff p' \ge \tau'$.
#
# $\beta$ is a **keep rate** — the genuine rows kept divided by the genuine
# rows in the stream the training set was drawn from. It is not the class
# ratio of the stream, and not the class ratio of the training set.

# %%
def undersampling_correction(p_s, tau_s, n_fraud, n_genuine_stream, n_genuine_kept):
    """Map undersampled-model scores and a threshold back to the stream.

    Args:
        p_s: (n,) scores of a model trained on the undersampled set.
        tau_s: float threshold on the p_s scale.
        n_fraud: frauds in the stream (all kept in training).
        n_genuine_stream: genuine rows in the stream.
        n_genuine_kept: genuine rows kept in the training set.
    Returns:
        (p_prime, tau_prime): (n,) corrected probabilities and the matched
        float threshold.
    """
    # BEGIN SOLUTION
    beta = n_genuine_kept / n_genuine_stream

    def correct(p):
        return beta * p / (beta * p - p + 1)

    return correct(np.asarray(p_s, dtype=float)), float(correct(tau_s))
    # END SOLUTION

# %%
# Local referees: the undersampling lesson's 1-in-50 example (beta = 0.02,
# p_s = 0.5 -> p' = 0.0196), and decisions survive the map.
_p, _t = undersampling_correction(np.array([0.5]), 0.5, 1, 100, 2)
assert np.isclose(_p[0], 0.02 / 1.02)
_ps = np.random.default_rng(0).random(1000)
_p, _t = undersampling_correction(_ps, 0.3, 500, 99_500, 4_000)
assert np.array_equal(_ps >= 0.3, _p >= _t)
assert np.all(np.diff(_p[np.argsort(_ps)]) >= 0)

# %%
distill.check("undersampling-correction", undersampling_correction)

# %% [markdown]
# ## 6. The Bayes-minimum-risk decision on an undersampled model
#
# Card precision fixes the number of calls. The cost view fixes none: alert
# on a transaction when the expected cost of alerting is below the expected
# cost of not alerting. With a calibrated fraud probability $p_i$ and the
# costs of section 2, alerting costs $C_a$ whatever happens, leaving it costs
# $p_i\,\mathrm{Amt}_i$ in expectation, so
#
# $$d_i = 1 \iff C_a \le \mathrm{Amt}_i\, p_i .$$
#
# A €10 payment needs $p \ge 0.5$ at $C_a = €5$; a €5,000 payment needs
# $p \ge 0.001$.
#
# The rule reads the probability as a number, and the model priced below was
# trained on undersampled data: its scores $p_s$ are not that number. Write
# the whole decision as one function, from the model's scores to money: turn
# $p_s$ into probabilities with your `undersampling_correction`, decide by
# the rule once for each alert cost in `c_a` (the investigator's price is
# rarely known to the euro, so the decision is priced over a range), and
# price each set of decisions with your `savings` at its own alert cost.

# %%
def bmr_decide_and_price(amounts, labels, p_s, n_fraud, n_genuine_stream, n_genuine_kept, c_a):
    """Bayes-minimum-risk alerts from undersampled scores, and their savings.

    Args:
        amounts: (n,) amounts in euros.
        labels: (n,) 0/1 fraud labels (used only to price).
        p_s: (n,) scores of a model trained on the undersampled set.
        n_fraud, n_genuine_stream, n_genuine_kept: the undersampling counts,
            as in undersampling_correction.
        c_a: (m,) array of alert costs in euros.
    Returns:
        (decisions, saving): decisions is an (m, n) 0/1 int array, row r the
        alerts at c_a[r]; saving is an (m,) float array, row r's savings at
        c_a[r].
    """
    # BEGIN SOLUTION
    p, _ = undersampling_correction(p_s, 0.5, n_fraud, n_genuine_stream, n_genuine_kept)
    c_a = np.atleast_1d(np.asarray(c_a, dtype=float))
    decisions = (c_a[:, None] <= np.asarray(amounts, dtype=float) * p).astype(np.int64)
    saving = np.array([savings(amounts, labels, dec, c)[2][0] for dec, c in zip(decisions, c_a)])
    return decisions, saving
    # END SOLUTION

# %%
# Local referee: a €100 payment scored p_s = 0.5 by a model that kept 1 genuine
# row in 50 is a 2% fraud risk, €1.96 of expected loss: worth a €1 call, not
# a €5 one (read as 0.5 it would be worth both).
_dec, _sav = bmr_decide_and_price(np.array([100.0]), np.array([1]), np.array([0.5]),
                                  1, 100, 2, np.array([1.0, 5.0]))
assert _dec.tolist() == [[1], [0]]
assert np.allclose(_sav, [savings([100.0], [1], [1], 1.0)[2][0], savings([100.0], [1], [0], 5.0)[2][0]])

# %%
distill.check("bmr-threshold", bmr_decide_and_price)

# %% [markdown]
# ### The three pieces together, in money
#
# Train a depth-5 tree on the deployment week after keeping 5% of the
# genuine rows, score the test week, and price three policies at
# $C_a = €5$: the Bayes-minimum-risk rule on the raw undersampled scores, the
# same rule on the corrected probabilities, and the fixed budget of 100 calls
# a day. The ranking is identical in all three; what changes is how many
# alerts a probability read as a number buys.

# %%
rng = np.random.default_rng(1)
genuine_train = train_rows[y[train_rows] == 0]
kept = rng.choice(genuine_train, int(0.05 * len(genuine_train)), replace=False)
under_rows = np.sort(np.r_[train_rows[y[train_rows] == 1], kept])
tree5u = DecisionTreeClassifier(max_depth=5, random_state=0).fit(X[under_rows], y[under_rows])
p_s = tree5u.predict_proba(X[test_rows])[:, 1]
counts = (int(y[train_rows].sum()), len(genuine_train), len(kept))
no_correction = counts[:2] + (len(genuine_train),)  # keep rate 1: p' = p_s
amt_t, y_t = amounts[test_rows], y[test_rows]
top100 = np.zeros(len(test_rows), dtype=np.int64)
for d in np.unique(days[test_rows]):
    today = np.flatnonzero(days[test_rows] == d)
    top100[today[np.argsort(-p_s[today], kind="stable")[:100]]] = 1
for name, dec in (("BMR on raw p_s", bmr_decide_and_price(amt_t, y_t, p_s, *no_correction, np.array([5.0]))[0][0]),
                  ("BMR on corrected p'", bmr_decide_and_price(amt_t, y_t, p_s, *counts, np.array([5.0]))[0][0]),
                  ("100 calls a day", top100)):
    cost, base, sav = savings(amt_t, y_t, dec, 5.0)
    print(f"{name:20s} alerts {dec.sum():6,d}  cost €{cost[0]:9,.0f}  savings {sav[0]:+.1%}")
print(f"baseline (flag nothing) €{base[0]:,.0f}")

# %% [markdown]
# ## 7. Choosing a depth on prequential validation folds
#
# Which depth of tree to ship? The test week cannot answer — choosing on it
# makes its number optimistic. The validation block goes where the test
# block stands, shifted back by the delay plus one validation block, so the
# freshest fully labelled week validates: with the deployment training block
# starting on `deploy_start`, validation fold 0 is the geometry of your
# `prequential_split` started on `deploy_start - delta_delay - delta_valid`,
# and folds $1, 2, \dots$ shift back one validation block each, exactly as
# `prequential_split` already does.
#
# For each candidate and each fold, fit on the fold's training rows, score
# the fold's validation rows, and compute three numbers: ROC-AUC, your
# average precision and the mean of your daily card precision at $k$. Each
# metric then picks the candidate with the highest mean over folds (the
# first in `candidates` order on a tie). The model is behind a callable so
# that the same harness referees a tree, a forest or anything else:
# `fit_and_score(train_idx, candidate)` fits candidate `candidate` on the
# rows `train_idx` and returns scores for **all** $n$ rows.

# %%
def prequential_selection(days, cards, labels, candidates, fit_and_score,
                          deploy_start, n_folds, delta_train, delta_delay, delta_valid, k):
    """Validation metrics of every candidate on prequential folds, and each
    metric's pick.

    Args:
        days, cards, labels: (n,) arrays as in prequential_split.
        candidates: list of hyperparameter values.
        fit_and_score: fit_and_score(train_idx, candidate) -> (n,) scores.
        deploy_start: first training day of the deployment geometry.
        n_folds, delta_train, delta_delay, delta_valid: fold geometry.
        k: cards called per day for CP@k.
    Returns:
        (table, picks): table is (n_candidates, n_folds, 3) with
        [ROC-AUC, AP, mean daily CP@k] per candidate and fold; picks is (3,)
        int, the index into candidates of each metric's choice by its mean
        over folds.
    """
    # BEGIN SOLUTION
    roles = prequential_split(days, cards, labels, deploy_start - delta_delay - delta_valid,
                              n_folds, delta_train, delta_delay, delta_valid)
    table = np.zeros((len(candidates), n_folds, 3))
    for j in range(n_folds):
        tr, va = np.flatnonzero(roles[j] == 1), np.flatnonzero(roles[j] == 2)
        for c, cand in enumerate(candidates):
            s = fit_and_score(tr, cand)[va]
            table[c, j] = (roc_auc_score(labels[va], s),
                           average_precision(labels[va], s),
                           card_precision_top_k(days[va], cards[va], s, labels[va], k).mean())
    return table, table.mean(axis=1).argmax(axis=0)
    # END SOLUTION

# %%
distill.check("prequential-selection", prequential_selection)

# %% [markdown]
# Now the real question: the depth grid on four weekly validation folds of
# the stream (training starts on days 28, 21, 14 and 7), 100 cards a day.

# %%
# Infrastructure (do not modify): the tree fits and the three-panel plot.
def fit_tree(train_idx, depth):
    model = DecisionTreeClassifier(max_depth=int(depth), random_state=0)
    return model.fit(X[train_idx], y[train_idx]).predict_proba(X)[:, 1]


def plot_selection(candidates, table, picks, xlabel="max_depth"):
    names = ["ROC-AUC", "average precision", "CP@100"]
    fig, axes = plt.subplots(1, 3, figsize=(11, 3))
    pos = np.arange(len(candidates))
    for m, ax in enumerate(axes):
        ax.errorbar(pos, table[:, :, m].mean(1), yerr=table[:, :, m].std(1), marker="o", capsize=2)
        ax.axvline(picks[m], color="C3", ls=":")
        ax.set_xticks(pos, [str(c) for c in candidates])
        ax.set_title(names[m]); ax.set_xlabel(xlabel)
    plt.tight_layout(); plt.show()


depths = [2, 3, 4, 5, 6, 8, 10, 20, 50]
table, picks = prequential_selection(days, cards, y, depths, fit_tree, 42, 4, 7, 7, 7, 100)
print("depth  " + "   ".join(f"{m:>13s}" for m in ("ROC-AUC", "AP", "CP@100")))
for c, dep in enumerate(depths):
    print(f"{dep:5d}  " + "   ".join(f"{table[c, :, m].mean():.3f} ± {table[c, :, m].std():.3f}"
                                    for m in range(3)))
print("picks (AUC, AP, CP@100):", [depths[i] for i in picks])
plot_selection(depths, table, picks)

# %% [markdown]
# Read the table before going on. Average precision ranks the fully grown
# tree last by a wide margin; ROC-AUC puts it level with the best depths.
# Card precision at 100 separates few of the candidates by more than a fold's
# spread — the alert-budget lesson's warning that differences under about two
# cards a day are noise. Refit each metric's pick on the deployment training
# block and look at the test week once — the only look the selection is
# allowed, and too late to change the choice:

# %%
for dep in sorted({depths[i] for i in picks}):
    s = fit_tree(train_rows, dep)[test_rows]
    cp = card_precision_top_k(days[test_rows], cards[test_rows], s, y[test_rows], 100).mean()
    print(f"depth {dep:2d} on the test week: ROC-AUC {roc_auc_score(y[test_rows], s):.3f}  "
          f"AP {average_precision(y[test_rows], s):.3f}  CP@100 {cp:.3f}")

# %% [markdown]
# ## Written answer (optional)
#
# On the validation folds the fully grown tree (depth 50) scores a ROC-AUC
# level with the best depths while its average precision is the worst in the
# grid. Explain, from what the fully grown tree's scores look like and what
# each metric does with them, why the two metrics disagree about it. "It
# overfits" is true and is not the answer: say what about its ranking AUC
# forgives and AP does not.

# %%
distill.submit_review(
    "why-auc-spares-depth-50",
    "A fully grown tree has pure leaves, so on new payments it outputs almost "
    "only two scores, 1 and 0. Its ranking is one top block (the payments "
    "that land in fraud leaves) and one huge tied bottom block. ROC-AUC is "
    "the mean of the top block's TPR and TNR: the ROC curve is one corner "
    "joined to (1, 1) by a straight segment, and the tied bottom block counts "
    "every fraud-genuine pair inside it as half correct, so the area depends "
    "only on how many frauds the top block catches at a tiny false-positive "
    "rate - the frauds it misses cost little. Average precision weights the "
    "precision at each fraud: the frauds left in the tied bottom block are "
    "reached only when the whole block is opened, at the base-rate "
    "precision (under 1%), so they contribute almost nothing and AP is "
    "capped near recall-of-top-block times its precision. A moderate tree "
    "ranks those remaining frauds above most genuine payments, which AP "
    "rewards and AUC barely notices, because AUC spends its weight on "
    "false-positive rates far beyond a 100-alert budget.",
)

# %% [markdown]
# ## Open task (optional): beat the bar on a week you have never seen
#
# `data/holdout_week.csv.gz` is the test week (days 56–62) of a second run of
# the simulator with a seed you do not have, features already built, known
# cards already removed with the rule of section 3; its labels stay on the
# server. Train any model you like on any rows of `stream` — trees, a
# forest, a logistic regression, more training weeks, undersampling — and
# score the hold-out week.
#
# The server grades one number: ROC-AUC over the hold-out week's **card-days**
# (one row per card per day, its maximum score and maximum label) — the unit
# your card precision ranks, and a number the server can compute from your
# scores alone, without the card-removal state your harness carries day to
# day. Choose your model the way this lab says to: by CP@100 and AP on your
# prequential folds, not by the grade. The bar is **0.85**. No single tree
# clears it: trained on days 42–48, the best depth in the grid scores about
# 0.82 and the fully grown tree about 0.81.
#
# Write your solution in the empty cell below, ending with two arrays from
# the model you chose: `holdout_scores`, one score per row of `holdout`
# (`card_day_scores` turns them into the vector the server expects), and
# `test_scores`, its scores on the stream's own test week, `X[test_rows]`.
# The stream's test-week labels are local, so the cell after the submission
# draws the card-day ROC curve — the graded quantity — of your model against
# the depth-5 tree there. Train on days before 56 for that picture to be
# honest. Hints follow the plot — try first.

# %%
# Infrastructure (do not modify): hold-out loading and the card-day collapse.
holdout = pd.read_csv("data/holdout_week.csv.gz")


def card_day_scores(frame, row_scores):
    """Max score per (day, card), ordered by day then card id — the order of
    the server's labels."""
    g = pd.DataFrame({"d": frame.TX_TIME_DAYS.to_numpy(), "c": frame.CUSTOMER_ID.to_numpy(),
                      "s": np.asarray(row_scores, dtype=float)})
    return g.groupby(["d", "c"], sort=True).s.max().to_numpy()


print(f"hold-out week: {len(holdout):,} payments, "
      f"{holdout.groupby(['TX_TIME_DAYS', 'CUSTOMER_ID']).ngroups:,} card-days")

# %%
# BEGIN SOLUTION
# Candidates compared on the same four validation folds, by the harness.
def fit_model(train_idx, name):
    if name == "tree5":
        model = DecisionTreeClassifier(max_depth=5, random_state=0)
    elif name == "logreg":
        model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    else:
        model = RandomForestClassifier(n_estimators=100, min_samples_leaf=5, random_state=0)
    return model.fit(X[train_idx], y[train_idx]).predict_proba(X)[:, 1]


models = ["tree5", "logreg", "forest"]
mtable, mpicks = prequential_selection(days, cards, y, models, fit_model, 42, 4, 7, 7, 7, 100)
for c, name in enumerate(models):
    print(f"{name:7s} AUC {mtable[c, :, 0].mean():.3f}  AP {mtable[c, :, 1].mean():.3f}  "
          f"CP@100 {mtable[c, :, 2].mean():.3f}")
# The forest wins AP and CP@100 on the folds; refit it on the latest week.
forest = RandomForestClassifier(n_estimators=100, min_samples_leaf=5, random_state=0)
forest.fit(X[train_rows], y[train_rows])
holdout_scores = forest.predict_proba(holdout[FEATURES].to_numpy())[:, 1]
test_scores = forest.predict_proba(X[test_rows])[:, 1]
# END SOLUTION

# %%
distill.submit_predictions("beat-holdout-week", card_day_scores(holdout, holdout_scores))

# %%
# Infrastructure (do not modify): card-day ROC on the stream's test week,
# your model against the depth-5 tree.
test_frame = stream.iloc[test_rows]
cd_labels = card_day_scores(test_frame, y[test_rows])
fig, ax = plt.subplots(figsize=(4.5, 4.5))
for name, s in (("your model", test_scores), ("depth-5 tree", fit_tree(train_rows, 5)[test_rows])):
    cd = card_day_scores(test_frame, s)
    fpr, tpr, _ = roc_curve(cd_labels, cd)
    ax.plot(fpr, tpr, label=f"{name}, card-day AUC {roc_auc_score(cd_labels, cd):.3f}")
ax.plot([0, 1], [0, 1], color="0.75", ls=":")
ax.set_xlabel("false-positive rate (card-days)"); ax.set_ylabel("true-positive rate")
ax.set_title("stream test week, days 56-62"); ax.legend(loc="lower right", fontsize=8)
plt.show()

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# A single tree's scores come in a few dozen tied values, and every tie in
# the card-day ranking costs ROC-AUC. Models that average many trees, or a
# linear model on standardized features, produce a continuous score.
# </details>
#
# <details><summary>Hint 2 — what to compare</summary>
#
# Wrap each candidate in a `fit_and_score(train_idx, name)` callable and hand
# the list of names to your `prequential_selection` — the same folds that
# chose the depth. A random forest of 100 trees with `min_samples_leaf=5`
# clears the bar on one training week.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# forest = RandomForestClassifier(n_estimators=100, min_samples_leaf=5, random_state=0)
# forest.fit(X[train_rows], y[train_rows])
# holdout_scores = forest.predict_proba(holdout[FEATURES].to_numpy())[:, 1]
# test_scores = forest.predict_proba(X[test_rows])[:, 1]
# ```
# </details>

# %% [markdown]
# ## References
#
# - Y.-A. Le Borgne, W. Siblini, B. Lebichot, G. Bontempi, *Reproducible
#   Machine Learning for Credit Card Fraud Detection — Practical Handbook*,
#   Université Libre de Bruxelles, 2022: ch. 3.2 (the simulator), ch. 4
#   (average precision, card precision at k), ch. 5 (prequential validation
#   and model selection).
# - A. Dal Pozzolo, O. Caelen, R. A. Johnson, G. Bontempi, "Calibrating
#   probability with undersampling for unbalanced classification", IEEE
#   SSCI 2015 (the correction of section 5).
# - A. Correa Bahnsen, D. Aouada, A. Stojanovic, B. Ottersten, "Feature
#   engineering strategies for credit card fraud detection", *Expert Systems
#   with Applications* 51, 2016 (cost, savings and the Bayes-minimum-risk
#   decision).

# %%
distill.dump()
