# %% [markdown]
# # Lab: a scorecard and a boosted tree under the same referee
#
# Two detectors built by the learner — a points scorecard assembled table by
# table and a boosted tree tuned by random search — scored by the same
# forward-in-time referee, with the choice between them argued in money.
#
# The module read both detectors and compared them on other people's runs.
# Here every number of the card is yours: the bins, the weights of evidence,
# the information values, the χ² that chooses between two groupings, the
# points. The boosted tree gets the selection procedure of the model-selection
# lesson, random search on prequential folds, with a backtest that says what
# the search delivered and what hindsight would have chosen. Then the
# module-2 referee scores both on the same test folds, in average precision,
# card precision and savings, and you write down which one you would ship.
#
# You write six functions, one per checkpoint: `equal_frequency_bins`,
# `woe_iv`, `chi2_groupings`, `scorecard_points`, the `fit` and `woe_matrix`
# methods of a `Scorecard` class, and `random_search_backtest`. The first
# four are checked against the textbook tables the scorecard lesson worked
# by hand; the class composes them into a card fitted on a week of payments;
# the last one wraps the module-2 harness.
#
# Ground rules:
#
# - Inside the graded functions, numpy and pandas only, with two exceptions:
#   the scorecard's logistic regression is scikit-learn's, called with the
#   settings the docstring fixes (the lab is about the card, not the solver),
#   and `random_search_backtest` calls the shipped harness.
# - The generator, the feature builder, the module-2 harness, the boosted-tree
#   fits and the plotting helpers ship complete. The harness is the one you
#   wrote in the evaluation lab; if yours passed its checkpoints it is
#   interchangeable with the copy below.
# - The six exact checkpoints are the required set. The written answer and
#   the open task are optional; partial completion is a normal way to finish.

# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve

import distill

distill.open_lab("fraud-ml/scorecard-vs-gbm-lab")

DAY = 86400

# %% [markdown]
# ## The log and the referee
#
# The data is the card log of the point-in-time lab, from the same
# generator: the course's card-network simulator rewritten from its stated
# rules (see References), with payment types, countries and personal hours.
# 1,000 cardholders and 2,000 terminals on a 100 × 100 grid, whose four
# quadrants are four countries (BE, NL, DE, FR); one payment in ten is a
# cash withdrawal (`ATM`), and each card pays online with its own
# probability, up to 25%, at one of three favourite web merchants registered
# in one of six countries (the four plus GB and US). Three fraud scenarios:
# any payment above €220; every day one physical terminal compromised for 28
# days; every day two cards leaked for 14 days, a third of their payments
# fraudulent, made at any hour, four in five of them online at a random web
# merchant, at the owner's usual amounts. 60 days from Sunday 1 April 2018,
# about 118,000 payments, 1.9% fraud; labels arrive seven days late.
#
# The feature builder is a compact version of the point-in-time lab's
# matrix: the amount; the card's number of payments and average amount over
# 1, 7 and 30 days, strictly earlier payments only; the amount divided by the
# card's 30-day average (the comparison the scorecard lesson printed as a
# line of its own); how far the payment's hour is from the card's usual hour
# (one minus the cosine of the angle to the circular mean of its earlier 30
# days, once it has three payments); how many earlier payments the card
# made at this terminal in 30 days; the terminal's number of payments and
# fraud rate over 1, 7 and 30 days ending seven days before the payment.
# Sixteen numbers, plus three categories for the card to bin: the payment
# type, the country and a four-hour band of the clock.
#
# The referee is the module-2 harness: `average_precision`, `savings`,
# `prequential_split`, `card_precision_top_k` and `prequential_selection`,
# with the folds' fit-and-score callable. The investigators call **20 cards
# a day**: the lessons' 100 calls were on 5,000 cardholders, and this log
# has 1,000.

# %%
# Infrastructure (do not modify): the generator.
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


# %%
# Infrastructure (do not modify): the feature builder.
WINDOWS = (1, 7, 30)
HOUR_BANDS = np.array(["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"])


def _window_sum(key, t, values, width, lag=0, strict=True):
    """Per row: sum of `values` over rows with the same key and time in
    (t - lag - width, t - lag), the right end closed unless `strict`."""
    o = np.lexsort((t, key))
    k = key[o] * 10**9 + t[o]
    hi = np.searchsorted(k, k - lag, side="left" if strict else "right")
    lo = np.searchsorted(k, k - lag - width, side="right")
    cs = np.r_[0.0, np.cumsum(np.asarray(values, dtype=float)[o])]
    out = np.empty(len(t))
    out[o] = cs[hi] - cs[lo]
    return out


def build_feature_matrix(log, delay_days=7):
    """Sixteen numeric features and three categories, one row per payment."""
    t = log.TX_TIME_SECONDS.to_numpy()
    card, term = log.CUSTOMER_ID.to_numpy(), log.TERMINAL_ID.to_numpy()
    amount = log.TX_AMOUNT.to_numpy()
    fraud = np.nan_to_num(log.TX_FRAUD.to_numpy(dtype=float))
    X = pd.DataFrame({"TX_AMOUNT": amount})
    for w in WINDOWS:
        n = _window_sum(card, t, np.ones(len(t)), w * DAY)
        s = _window_sum(card, t, amount, w * DAY)
        X[f"CUSTOMER_NB_TX_{w}DAY"] = n
        X[f"CUSTOMER_AVG_AMOUNT_{w}DAY"] = np.where(n > 0, s / np.maximum(n, 1), 0.0)
    X["AMOUNT_TO_AVG_30DAY"] = np.where(X.CUSTOMER_NB_TX_30DAY > 0,
                                        amount / np.maximum(X.CUSTOMER_AVG_AMOUNT_30DAY, 0.01), 1.0)
    # The card's usual hour: the circular mean of its earlier 30 days'
    # clock times, trusted from three payments on; 0 = at the usual hour,
    # 2 = twelve hours away.
    angle = (t % DAY) / DAY * 2 * np.pi
    usual = np.arctan2(_window_sum(card, t, np.sin(angle), 30 * DAY),
                       _window_sum(card, t, np.cos(angle), 30 * DAY))
    X["HOUR_DEVIATION_30DAY"] = np.where(X.CUSTOMER_NB_TX_30DAY >= 3, 1 - np.cos(angle - usual), 0.0)
    X["CARD_TERMINAL_NB_TX_30DAY"] = _window_sum(card * 10**4 + term, t, np.ones(len(t)), 30 * DAY)
    # A label is readable seven days after its payment: the terminal's
    # window ends there, closed on the right.
    for w in WINDOWS:
        n = _window_sum(term, t, np.ones(len(t)), w * DAY, delay_days * DAY, strict=False)
        f = _window_sum(term, t, fraud, w * DAY, delay_days * DAY, strict=False)
        X[f"TERMINAL_NB_TX_{w}DAY"] = n
        X[f"TERMINAL_RISK_{w}DAY"] = np.where(n > 0, f / np.maximum(n, 1), 0.0)
    X["TX_TYPE"] = log.TX_TYPE.to_numpy()
    X["TX_COUNTRY"] = log.TX_COUNTRY.to_numpy()
    X["TX_HOUR_BAND"] = HOUR_BANDS[(t % DAY) // (4 * 3600)]
    return X


stream = simulate(seed=0)
F = build_feature_matrix(stream)
NUMERIC = [c for c in F.columns if c not in ("TX_TYPE", "TX_COUNTRY", "TX_HOUR_BAND")]
CATEGORICAL = ["TX_TYPE", "TX_COUNTRY", "TX_HOUR_BAND"]
days = stream.TX_TIME_DAYS.to_numpy()
cards = stream.CUSTOMER_ID.to_numpy()
y = stream.TX_FRAUD.to_numpy().astype(np.int64)
amounts = stream.TX_AMOUNT.to_numpy()
print(f"{len(stream):,} payments, {y.mean():.2%} fraud; by scenario:",
      stream.TX_FRAUD_SCENARIO.value_counts().sort_index().to_dict())
F.head()

# %%
# Infrastructure (do not modify): the module-2 harness.
def average_precision(labels, scores):
    labels, scores = np.asarray(labels, dtype=float), np.asarray(scores, dtype=float)
    order = np.argsort(-scores, kind="stable")
    s, yy = scores[order], labels[order]
    last = np.r_[s[1:] != s[:-1], True]
    tp = np.cumsum(yy)[last]
    precision = tp / (np.flatnonzero(last) + 1)
    return float(np.sum(np.diff(np.r_[0.0, tp / yy.sum()]) * precision))


def savings(amounts, labels, decisions, c_a):
    amounts, yy, d = (np.asarray(a, dtype=float) for a in (amounts, labels, decisions))
    c_a = np.atleast_1d(np.asarray(c_a, dtype=float))
    cost = np.sum(yy * (1 - d) * amounts) + d.sum() * c_a
    cost_base = np.minimum(np.sum(yy * amounts), len(amounts) * c_a)
    return cost, cost_base, (cost_base - cost) / cost_base


def prequential_split(days, cards, labels, start, n_folds, delta_train, delta_delay, delta_test):
    roles = np.zeros((n_folds, len(days)), dtype=np.int64)
    for j in range(n_folds):
        s = start - j * delta_test
        roles[j, (days >= s) & (days < s + delta_train)] = 1
        for i in range(delta_test):
            d = s + delta_train + delta_delay + i
            known = cards[(labels == 1) & (days >= s) & (days <= d - delta_delay - 1)]
            roles[j, (days == d) & ~np.isin(cards, known)] = 2
    return roles


def card_precision_top_k(days, cards, scores, labels, k):
    frame = pd.DataFrame({"day": days, "card": cards, "score": scores, "label": labels})
    detected, out = set(), []
    for _, today in frame.groupby("day", sort=True):
        today = today[~today.card.isin(detected)]
        per_card = today.groupby("card")[["score", "label"]].max()
        top = per_card.sort_values("score", ascending=False, kind="stable").head(k)
        found = top.index[top.label == 1]
        out.append(len(found) / k)
        detected.update(found)
    return np.array(out)


def prequential_selection(days, cards, labels, candidates, fit_and_score,
                          deploy_start, n_folds, delta_train, delta_delay, delta_valid, k):
    """(table, picks): table (n_candidates, n_folds, 3) of [ROC-AUC, AP, mean
    daily CP@k] on the validation folds, picks the argmax of each column's
    mean over folds."""
    roles = prequential_split(days, cards, labels, deploy_start - delta_delay - delta_valid,
                              n_folds, delta_train, delta_delay, delta_valid)
    table = np.zeros((len(candidates), n_folds, 3))
    for j in range(n_folds):
        tr, va = np.flatnonzero(roles[j] == 1), np.flatnonzero(roles[j] == 2)
        for c, cand in enumerate(candidates):
            s = fit_and_score(tr, cand)[va]
            table[c, j] = (roc_auc_score(labels[va], s), average_precision(labels[va], s),
                           card_precision_top_k(days[va], cards[va], s, labels[va], k).mean())
    return table, table.mean(axis=1).argmax(axis=0)


def apply_bins(x, edges):
    """Bin index of each value: the number of edges strictly below it, so a
    value equal to an edge falls in the bin below the edge."""
    return np.searchsorted(edges, x, side="left")


# The deployment geometry: train on days 39-45, delay 46-52, test 53-59.
DEPLOY_START, N_FOLDS, D_TRAIN, D_DELAY, D_TEST, K = 39, 3, 7, 7, 7, 20
deploy = prequential_split(days, cards, y, DEPLOY_START, 1, D_TRAIN, D_DELAY, D_TEST)[0]
train_rows, test_rows = np.flatnonzero(deploy == 1), np.flatnonzero(deploy == 2)
print(f"training week: {len(train_rows):,} payments, {y[train_rows].sum()} frauds; "
      f"test week after known-card removal: {len(test_rows):,} payments, {y[test_rows].sum()} frauds")

# %% [markdown]
# ## 1. Equal-frequency bins
#
# The card replaces each number by a handful of ranges. Equal-frequency
# bins put the same share of the training rows in each: with $n$ bins the
# interior edges are the quantiles at $1/n, 2/n, \dots, (n-1)/n$. Two
# conventions make the answer unique:
#
# - a value equal to an edge belongs to the bin **below** it ("up to
#   €160"), which is what the shipped `apply_bins` does;
# - a variable with many equal values (a count, a rate that is zero for most
#   terminals) produces repeated quantiles, and a repeated edge makes an empty
#   bin. Keep each edge once.
#
# So "10 bins" means at most 10: a variable that is zero for 60% of the rows
# cannot be cut below its 60th percentile.

# %%
def equal_frequency_bins(x, n_bins):
    """Equal-frequency bin edges of a numeric variable, and the bin counts.

    Args:
        x: (n,) float array, no missing values.
        n_bins: int >= 2, the number of bins asked for.
    Returns:
        (edges, counts): edges is the (m,) sorted array of distinct interior
        edges, the quantiles of x at j / n_bins for j = 1 .. n_bins - 1
        (numpy's default quantile method), duplicates kept once, m <= n_bins - 1;
        counts is the (m + 1,) int array of rows per bin, a value equal to an
        edge counted in the bin below it.
    """
    # BEGIN SOLUTION
    x = np.asarray(x, dtype=float)
    edges = np.unique(np.quantile(x, np.arange(1, n_bins) / n_bins))
    counts = np.bincount(apply_bins(x, edges), minlength=len(edges) + 1)
    return edges, counts
    # END SOLUTION

# %%
_edges, _counts = equal_frequency_bins(np.arange(1.0, 101.0), 4)
assert np.allclose(_edges, [25.75, 50.5, 75.25]) and _counts.tolist() == [25, 25, 25, 25]
# Sixty zeros: the 20th and 40th percentiles are both 0, and kept once.
_edges, _counts = equal_frequency_bins(np.r_[np.zeros(60), np.arange(1.0, 41.0)], 5)
assert _edges[0] == 0.0 and len(_edges) == 3 and _counts[0] == 60 and _counts.sum() == 100

# %%
distill.check("equal-frequency-bins", equal_frequency_bins)

# %% [markdown]
# The training week's amounts in ten bins of each kind: equal-width cuts
# put almost every payment in the first bins, equal-frequency cuts put a
# tenth in each, and neither looks at the label.

# %%
# Infrastructure (do not modify): equal-width against equal-frequency.
_amt = F.TX_AMOUNT.to_numpy()[train_rows]
_ef_edges, _ef_counts = equal_frequency_bins(_amt, 10)
_ew_edges = np.linspace(_amt.min(), _amt.max(), 11)[1:-1]
_ew_counts = np.bincount(apply_bins(_amt, _ew_edges), minlength=10)
fig, axes = plt.subplots(1, 2, figsize=(10, 2.8), sharey=True)
for ax, cnt, name in ((axes[0], _ew_counts, "equal width"), (axes[1], _ef_counts, "equal frequency")):
    ax.bar(np.arange(len(cnt)), cnt, color="0.6")
    ax.set_title(f"amount, 10 bins, {name}"); ax.set_xlabel("bin")
axes[0].set_ylabel("training payments")
plt.tight_layout(); plt.show()

# %% [markdown]
# ## 2. Weight of evidence and information value
#
# Recalled from the scorecard lesson: for bin $i$ holding $g_i$
# of the $N_g$ genuine rows and $f_i$ of the $N_f$ frauds,
#
# $$\mathrm{WOE}_i = \ln\frac{g_i/N_g}{f_i/N_f}, \qquad
#   \mathrm{IV} = \sum_i \Big(\frac{g_i}{N_g} - \frac{f_i}{N_f}\Big)\,\mathrm{WOE}_i .$$
#
# The sign convention is the course's: genuine share over fraud share, so a
# risky bin has a negative weight. A bin with no frauds would get an infinite
# weight, so a constant `smooth` is added to **every** bin's two counts
# before the shares are taken, over the **raw** totals $N_g$ and $N_f$; the
# IV uses the same smoothed shares. With `smooth=0` the function must
# reproduce the lesson's age table: WOE $-1.078$ for 18–22 and IV 0.6502.

# %%
def woe_iv(genuine, fraud, smooth=0.5):
    """Weight of evidence per bin and the variable's information value.

    Args:
        genuine: (k,) genuine count per bin.
        fraud: (k,) fraud count per bin.
        smooth: float added to every bin's genuine and fraud count before
            the shares are taken; the totals stay the raw sums.
    Returns:
        (woe, iv): (k,) float array ln(genuine share / fraud share), and the
        float sum over bins of (genuine share - fraud share) * woe.
    """
    # BEGIN SOLUTION
    g = np.asarray(genuine, dtype=float)
    f = np.asarray(fraud, dtype=float)
    g_share = (g + smooth) / g.sum()
    f_share = (f + smooth) / f.sum()
    woe = np.log(g_share / f_share)
    return woe, float(np.sum((g_share - f_share) * woe))
    # END SOLUTION

# %%
# The lesson's 2,000 applications: missing, 18-22, 23-26, 27-29, 30-34, 35-43, 44+.
AGE_GENUINE = np.array([42, 152, 246, 405, 475, 339, 147])
AGE_FRAUD = np.array([8, 48, 54, 45, 25, 11, 3])
_w, _iv = woe_iv(AGE_GENUINE, AGE_FRAUD, smooth=0.0)
assert np.allclose(_w, [-0.573, -1.078, -0.715, -0.034, 0.713, 1.197, 1.661], atol=1e-3)
assert np.isclose(_iv, 0.6502, atol=1e-4)
# A bin with no frauds stays finite once smoothed.
assert np.isfinite(woe_iv(np.array([150, 1659]), np.array([0, 191]))[0]).all()

# %%
distill.check("woe-iv", woe_iv)

# %% [markdown]
# Every variable of the training week through your two functions: numbers
# in ten equal-frequency bins, categories one bin per value. The table is
# the shortlist the lesson's filter reads; the plot shows the bins of the
# four variables at the top.

# %%
# Infrastructure (do not modify): IV of every variable on the training week.
def bin_counts(bins, labels, n_bins):
    labels = np.asarray(labels, dtype=float)
    return (np.bincount(bins, weights=1 - labels, minlength=n_bins),
            np.bincount(bins, weights=labels, minlength=n_bins))


def variable_bins(col, train_frame, n_bins=10):
    """Bin index per training row and a label per bin."""
    x = train_frame[col].to_numpy()
    if x.dtype.kind in "OUS":
        levels, bins = np.unique(x, return_inverse=True)
        return bins, [str(v) for v in levels]
    edges, _ = equal_frequency_bins(x, n_bins)
    labels = [f"≤{e:.3g}" for e in edges] + [f">{edges[-1]:.3g}" if len(edges) else "all"]
    return apply_bins(x, edges), labels


def plot_woe(cols, train_frame, labels, n_bins=10):
    fig, axes = plt.subplots(1, len(cols), figsize=(3.2 * len(cols), 2.8))
    for ax, col in zip(np.atleast_1d(axes), cols):
        bins, names = variable_bins(col, train_frame, n_bins)
        w, iv = woe_iv(*bin_counts(bins, labels, len(names)))
        ax.bar(range(len(w)), w, color=np.where(w < 0, "C1", "C0"))
        ax.set_xticks(range(len(w)), names, rotation=90, fontsize=7)
        ax.set_title(f"{col}\nIV {iv:.3f}", fontsize=8); ax.axhline(0, color="0.5", lw=0.5)
    np.atleast_1d(axes)[0].set_ylabel("WOE")
    plt.tight_layout(); plt.show()


train_frame, y_train = F.iloc[train_rows].reset_index(drop=True), y[train_rows]
IV = {}
for col in NUMERIC + CATEGORICAL:
    bins, names = variable_bins(col, train_frame)
    IV[col] = woe_iv(*bin_counts(bins, y_train, len(names)))[1]
IV = pd.Series(IV).sort_values(ascending=False)
print(IV.round(3).to_string())
plot_woe(list(IV.index[:4]), train_frame, y_train)

# %% [markdown]
# ## 3. Choosing between two groupings: χ² against independence
#
# A category with six values is six lines on the card. Grouping them is
# coarse classification too, and two candidate groupings are compared by how
# far their counts sit from what independence predicts: a group holding
# $n_r$ of the $N$ rows expects $n_r N_g/N$ genuine and $n_r N_f/N$ frauds,
# and
#
# $$\chi^2 = \sum_{\text{groups}}\ \sum_{\text{class}}
#   \frac{(\text{observed} - \text{expected})^2}{\text{expected}} .$$
#
# Two groupings with the same number of groups have the same degrees of
# freedom, so the larger statistic is the better grouping. The local
# referee is the lesson's product table: option 1 scores 583.9 (≈ 584),
# option 2 662.9 (≈ 663), and option 2 wins.

# %%
def chi2_groupings(genuine, fraud, groupings):
    """χ² against independence for candidate groupings of one category.

    Args:
        genuine: (c,) genuine count per category value.
        fraud: (c,) fraud count per category value.
        groupings: list of (c,) int arrays; groupings[r][v] is the group
            (0 .. G-1) of value v under candidate r. Every candidate has the
            same number of groups G.
    Returns:
        (chi2, best): (n_candidates,) float array of χ² statistics, and the
        int index of the largest (the first on a tie).
    """
    # BEGIN SOLUTION
    g = np.asarray(genuine, dtype=float)
    f = np.asarray(fraud, dtype=float)
    stats = []
    for groups in groupings:
        groups = np.asarray(groups)
        obs = np.stack([np.bincount(groups, weights=g), np.bincount(groups, weights=f)], axis=1)
        exp = obs.sum(axis=1, keepdims=True) * obs.sum(axis=0, keepdims=True) / obs.sum()
        stats.append(np.sum((obs - exp) ** 2 / exp))
    stats = np.array(stats)
    return stats, int(np.argmax(stats))
    # END SOLUTION

# %%
# clothes, books, music, electronics, games, movies
PRODUCT_GENUINE = np.array([6000, 1600, 350, 950, 90, 10])
PRODUCT_FRAUD = np.array([300, 400, 140, 100, 50, 10])
OPTION_1 = np.array([0, 1, 1, 2, 2, 2])   # clothes | books and music | the other three
OPTION_2 = np.array([0, 2, 2, 1, 2, 2])   # clothes | electronics | the other four
_chi2, _best = chi2_groupings(PRODUCT_GENUINE, PRODUCT_FRAUD, [OPTION_1, OPTION_2])
assert np.allclose(_chi2, [583.9, 662.9], atol=0.05) and _best == 1

# %%
distill.check("chi2-binning-compare", chi2_groupings)

# %% [markdown]
# On the log, the country is the category to group: the four grid countries
# hold almost every physical payment, while web merchants sit in all six,
# and a leaked card's fraud goes online at a random one. Two candidate
# groupings into three: the grid against each foreign country, or France on
# its own (the training week's busiest grid country for fraud) with the two
# foreign countries together. The card keeps the winner as `COUNTRY_GROUP`.

# %%
# Infrastructure (do not modify): two groupings of the country.
COUNTRY_INDEX = pd.Series(range(len(COUNTRIES)), index=COUNTRIES)
_genuine, _fraud = bin_counts(COUNTRY_INDEX[train_frame.TX_COUNTRY].to_numpy(), y_train, len(COUNTRIES))
COUNTRY_GROUPINGS = {          # group of BE, NL, DE, FR, GB, US
    "BE+NL+DE+FR | GB | US": np.array([0, 0, 0, 0, 1, 2]),
    "BE+NL+DE | FR | GB+US": np.array([0, 0, 0, 1, 2, 2]),
}
_chi2, _best = chi2_groupings(_genuine, _fraud, list(COUNTRY_GROUPINGS.values()))
for name, stat in zip(COUNTRY_GROUPINGS, _chi2):
    print(f"{name:24s} χ² {stat:8.1f}")
CHOSEN_GROUPING = list(COUNTRY_GROUPINGS.values())[_best]
GROUP_NAMES = np.array(["+".join(COUNTRIES[CHOSEN_GROUPING == g]) for g in range(3)])


def country_group(countries):
    return GROUP_NAMES[CHOSEN_GROUPING[COUNTRY_INDEX[countries].to_numpy()]]


F["COUNTRY_GROUP"] = country_group(F.TX_COUNTRY)
train_frame = F.iloc[train_rows].reset_index(drop=True)
print("chosen:", list(COUNTRY_GROUPINGS)[_best])

# %% [markdown]
# ## 4. Points
#
# The fitted card gives a payment the log-odds
# $\beta_0 + \sum_{j=1}^{J}\beta_j\,\mathrm{WOE}_j(x)$, and the scale
# $S = \mathrm{Offset} + \mathrm{Factor}\cdot\ln(\text{odds})$ turns it into
# points. Two anchors fix the scale: a score $S_0$ at fraud odds $o_0$, and
# `pdo` points for every doubling of the odds; the card of the lesson used
# 100 points at odds 1 to 50 and 20 points per doubling, higher meaning more
# suspicious. The intercept and the offset belong to no variable and are
# spread evenly over the $J$ lines, so bin $i$ of variable $j$ carries
#
# $$\mathrm{points}_{ij} = \mathrm{Factor}\Big(\beta_j\,\mathrm{WOE}_{ij} + \frac{\beta_0}{J}\Big)
#   + \frac{\mathrm{Offset}}{J}.$$
#
# Deriving Factor and Offset from the two anchors is part of the task; the
# lesson's numbers, 28.85 and 212.87, are the local referee.
#
# The card's bins arrive flattened: one array of every bin's WOE, variable
# after variable, and beside it the index of the variable each bin belongs
# to.

# %%
def scorecard_points(woe, var_of_bin, intercept, coef, score0=100.0, odds0=1 / 50, pdo=20.0):
    """Factor, Offset and the points of every bin of a fitted card.

    Args:
        woe: (m,) WOE of every bin of every variable, flattened.
        var_of_bin: (m,) int, the variable (0 .. J-1) of each bin.
        intercept: float, the fitted beta_0.
        coef: (J,) the fitted beta_j, one per variable.
        score0, odds0: the anchor — a payment at fraud odds odds0 (fraud to
            genuine) scores score0.
        pdo: points added by every doubling of the fraud odds.
    Returns:
        (factor, offset, points): two floats and the (m,) points per bin.
    """
    # BEGIN SOLUTION
    coef = np.asarray(coef, dtype=float)
    n_vars = len(coef)
    factor = pdo / np.log(2)
    offset = score0 - factor * np.log(odds0)
    beta = coef[np.asarray(var_of_bin)]
    points = factor * (beta * np.asarray(woe, dtype=float) + intercept / n_vars) + offset / n_vars
    return float(factor), float(offset), points
    # END SOLUTION

# %%
# The lesson's amount line: beta = -0.352, beta_0 = -4.90, J = 7; top bin
# WOE -5.373 -> 64.8 points, bottom bin +0.283 -> 7.3. Only the amount's
# coefficient matters for these two bins; the other six are placeholders.
_f, _o, _pts = scorecard_points(np.array([0.283, -5.373]), np.array([0, 0]), -4.90,
                                np.array([-0.352, -1, -1, -1, -1, -1, -1]))
assert np.isclose(_f, 28.85, atol=0.01) and np.isclose(_o, 212.87, atol=0.01)
assert np.allclose(_pts, [7.3, 64.8], atol=0.1)

# %%
distill.check("scorecard-points", scorecard_points)

# %% [markdown]
# ## 5. The card
#
# The class below holds one card. `fit` does what the lesson did by hand,
# on the training rows only:
#
# 1. a numeric column gets your equal-frequency edges at `n_bins`; a
#    categorical column gets one bin per value seen in training, in sorted
#    order (`np.unique`);
# 2. each bin gets its genuine and fraud counts and your WOE, smoothed by
#    0.5;
# 3. the WOE matrix (one column per variable, numeric columns first, then
#    categorical, each in the order given) is fitted with
#    `LogisticRegression(C=1.0, max_iter=5000)`;
# 4. your `scorecard_points` turns the coefficients into points.
#
# `woe_matrix` maps any frame through the stored bins: a numeric value
# beyond the training range falls in the first or last bin, and a category
# never seen in training gets WOE 0, the population's own odds. `score`,
# `proba` and `table` are shipped and read only the attributes `fit` sets,
# so the attribute names in the docstring are a contract.
#
# Non-goal: no tree binning, minimum bin size or one-direction merging here —
# the lesson's card had them; this card uses equal-frequency bins, and what
# that costs is visible in the comparison below.

# %%
class Scorecard:
    """A points scorecard: bins -> WOE -> logistic regression -> points."""

    def __init__(self, numeric, categorical, n_bins=10, score0=100.0, odds0=1 / 50, pdo=20.0):
        self.numeric, self.categorical = list(numeric), list(categorical)
        self.n_bins, self.score0, self.odds0, self.pdo = n_bins, score0, odds0, pdo

    def fit(self, frame, labels):
        """Fit the card on a training frame.

        Args:
            frame: DataFrame holding every column in numeric + categorical.
            labels: (n,) 0/1 fraud labels of its rows.
        Sets:
            edges_: dict numeric column -> (m,) edges;
            levels_: dict categorical column -> sorted array of training values;
            woe_: dict column -> (bins,) WOE per bin;
            model_: the fitted LogisticRegression; coef_ (J,), intercept_ float;
            factor_, offset_: floats; points_: dict column -> (bins,) points.
        Returns:
            self.
        """
        # BEGIN SOLUTION
        labels = np.asarray(labels, dtype=float)
        self.edges_, self.levels_, self.woe_ = {}, {}, {}
        for col in self.numeric:
            x = frame[col].to_numpy(dtype=float)
            self.edges_[col] = equal_frequency_bins(x, self.n_bins)[0]
            bins, n = apply_bins(x, self.edges_[col]), len(self.edges_[col]) + 1
            self.woe_[col] = woe_iv(*bin_counts(bins, labels, n), smooth=0.5)[0]
        for col in self.categorical:
            self.levels_[col], bins = np.unique(frame[col].to_numpy(), return_inverse=True)
            self.woe_[col] = woe_iv(*bin_counts(bins, labels, len(self.levels_[col])), smooth=0.5)[0]
        self.model_ = LogisticRegression(C=1.0, max_iter=5000).fit(self.woe_matrix(frame), labels)
        self.coef_, self.intercept_ = self.model_.coef_[0], float(self.model_.intercept_[0])
        cols = self.numeric + self.categorical
        flat = np.concatenate([self.woe_[c] for c in cols])
        var_of_bin = np.concatenate([np.full(len(self.woe_[c]), j) for j, c in enumerate(cols)])
        self.factor_, self.offset_, pts = scorecard_points(flat, var_of_bin, self.intercept_, self.coef_,
                                                           self.score0, self.odds0, self.pdo)
        self.points_ = dict(zip(cols, np.split(pts, np.cumsum([len(self.woe_[c]) for c in cols])[:-1])))
        return self
        # END SOLUTION

    def woe_matrix(self, frame):
        """(n, J) WOE of every row on every variable, numeric columns first.

        A category absent from training gets WOE 0.
        """
        # BEGIN SOLUTION
        cols = []
        for col in self.numeric:
            cols.append(self.woe_[col][apply_bins(frame[col].to_numpy(dtype=float), self.edges_[col])])
        for col in self.categorical:
            levels, x = self.levels_[col], frame[col].to_numpy()
            idx = np.minimum(np.searchsorted(levels, x), len(levels) - 1)
            seen = levels[idx] == x
            cols.append(np.where(seen, self.woe_[col][idx], 0.0))
        return np.column_stack(cols)
        # END SOLUTION

    def score(self, frame):
        """(n,) points of every row: the sum of its bins' points."""
        return self.offset_ + self.factor_ * (self.woe_matrix(frame) @ self.coef_ + self.intercept_)

    def proba(self, frame):
        """(n,) fraud probability read back from the score."""
        return 1 / (1 + np.exp(-(self.score(frame) - self.offset_) / self.factor_))

    def table(self):
        rows = []
        for col in self.numeric:
            e = self.edges_[col]
            names = [f"≤ {v:.4g}" for v in e] + ([f"> {e[-1]:.4g}"] if len(e) else ["all"])
            rows += [(col, n, w, p) for n, w, p in zip(names, self.woe_[col], self.points_[col])]
        for col in self.categorical:
            rows += [(col, str(v), w, p) for v, w, p in zip(self.levels_[col], self.woe_[col], self.points_[col])]
        out = pd.DataFrame(rows, columns=["variable", "bin", "WOE", "points"])
        out["points"] = out.points.round(1)
        return out.round({"WOE": 3})

# %%
# Local referee: the score is a linear map of the regression's log-odds, and
# the sum of the looked-up points is that score.
_card = Scorecard(["TX_AMOUNT", "TERMINAL_RISK_7DAY"], ["TX_TYPE"], n_bins=5).fit(train_frame, y_train)
_w = _card.woe_matrix(train_frame)
assert _w.shape == (len(train_frame), 3)
assert np.allclose(_card.score(train_frame), _card.offset_ + _card.factor_ * _card.model_.decision_function(_w))
_row = train_frame.iloc[[0]]
_looked_up = (_card.points_["TX_AMOUNT"][apply_bins(_row.TX_AMOUNT.to_numpy(), _card.edges_["TX_AMOUNT"])]
              + _card.points_["TERMINAL_RISK_7DAY"][apply_bins(_row.TERMINAL_RISK_7DAY.to_numpy(),
                                                                _card.edges_["TERMINAL_RISK_7DAY"])]
              + _card.points_["TX_TYPE"][np.searchsorted(_card.levels_["TX_TYPE"], _row.TX_TYPE.to_numpy())])
assert np.allclose(_looked_up, _card.score(_row))
# A category never seen in training is scored at WOE 0.
_odd = _row.assign(TX_TYPE="CHEQUE")
assert np.isclose(_card.woe_matrix(_odd)[0, 2], 0.0)

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Write `woe_matrix` first: it is a lookup, one column per variable, and
# `fit` needs it for the regression. In `fit`, one loop over the numeric
# columns and one over the categorical ones fill `edges_`/`levels_` and
# `woe_`; then the regression on `self.woe_matrix(frame)`; then one call to
# `scorecard_points` on the flattened WOE, and `np.split` to hand the points
# back per variable.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# for col in numeric:      edges = equal_frequency_bins(x, n_bins)[0]; bins = apply_bins(x, edges)
#                          woe_[col] = woe_iv(genuine and fraud counts per bin, 0.5)[0]
# for col in categorical:  levels, bins = np.unique(x, return_inverse=True); woe_[col] = ...
# model_ = LogisticRegression(C=1.0, max_iter=5000).fit(woe_matrix(frame), labels)
# flat = concat(woe_[c] for c in numeric + categorical); var_of_bin = [j repeated len(woe_[c])]
# factor_, offset_, pts = scorecard_points(flat, var_of_bin, intercept_, coef_, ...)
# points_ = split pts back per column
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# The categorical lookup with WOE 0 for unseen values:
#
# ```python
# idx = np.minimum(np.searchsorted(levels, x), len(levels) - 1)
# col_woe = np.where(levels[idx] == x, self.woe_[col][idx], 0.0)
# ```
# </details>

# %%
def fit_scorecard(train, labels, test, numeric, categorical, n_bins):
    return Scorecard(numeric, categorical, n_bins).fit(train, labels).score(test)


distill.check("fit-scorecard", fit_scorecard)

# %% [markdown]
# ### The card on the log
#
# The lesson's two checks before a card is printed: the information-value
# filter at 0.1 shortlists, and every coefficient must be negative — a
# positive one gives a variable's riskiest bins the fewest points, against
# its own counts. The loop below fits the shortlisted variables, drops the
# line with the largest positive coefficient, and refits until every sign
# agrees. The country enters as your chosen grouping.

# %%
# Infrastructure (do not modify): IV filter, sign check, the printed card.
iv_group = woe_iv(*bin_counts(np.unique(train_frame.COUNTRY_GROUP, return_inverse=True)[1], y_train, 3))[1]
shortlist = [c for c in IV.index if IV[c] >= 0.1 and c != "TX_COUNTRY"] + (["COUNTRY_GROUP"] if iv_group >= 0.1 else [])
card_num = [c for c in shortlist if c in NUMERIC]
card_cat = [c for c in shortlist if c not in NUMERIC]
while True:
    card = Scorecard(card_num, card_cat, n_bins=10).fit(train_frame, y_train)
    names = card_num + card_cat
    print("coefficients:", dict(zip(names, np.round(card.coef_, 2))))
    if (card.coef_ <= 0).all():
        break
    drop = names[int(np.argmax(card.coef_))]
    print(f"  {drop} points the wrong way: dropped, refit")
    card_num, card_cat = [c for c in card_num if c != drop], [c for c in card_cat if c != drop]
print(f"Factor {card.factor_:.2f}, Offset {card.offset_:.2f}, beta_0 {card.intercept_:.2f}, J = {len(names)}")
card.table()

# %% [markdown]
# ## 6. The boosted tree: random search with a backtest
#
# The model-selection lesson judged a search by three test numbers: for
# candidate settings
# $\theta_1, \dots, \theta_M$ with validation means $V(\theta_m)$ and test
# means $T(\theta_m)$, the **best-estimated** score is $T(\hat\theta)$ with
# $\hat\theta = \arg\max_m V(\theta_m)$, and the **optimal** score is
# $\max_m T(\theta_m)$, known only in hindsight. Random search validates
# only $n$ of the grid's candidates.
#
# Write the search and its backtest around the harness:
#
# 1. draw the candidates: the grid positions
#    `np.random.default_rng(seed).choice(len(grid), n_draws, replace=False)`,
#    in that order;
# 2. $V$: the harness's `prequential_selection` on them, with `delta_test`
#    as the validation width — it places the validation folds;
# 3. $T$: the test folds are your `prequential_split` geometry started on
#    `deploy_start` itself — fold $j$ trains on the block starting
#    `deploy_start - j * delta_test` and is scored on the test block a
#    delay later. Fit every drawn candidate on each fold's training rows and
#    score its test rows;
# 4. keep two metrics, average precision and mean daily CP@k, as means
#    over folds; pick by $V$, read the pick's $T$, and the best $T$.
#
# `fit_and_score(train_idx, candidate)` fits on the rows `train_idx` and
# returns scores for all rows, as in the evaluation lab.

# %%
def random_search_backtest(grid, n_draws, seed, fit_and_score, days, cards, labels,
                           deploy_start, n_folds, delta_train, delta_delay, delta_test, k):
    """Random search on prequential validation folds, backtested on test folds.

    Args:
        grid: list of candidate settings.
        n_draws: number of candidates drawn.
        seed: seed of the draw.
        fit_and_score: fit_and_score(train_idx, candidate) -> (n,) scores.
        days, cards, labels: (n,) arrays.
        deploy_start, n_folds, delta_train, delta_delay, delta_test: the
            deployment geometry; validation folds come from the harness,
            test folds start on deploy_start.
        k: cards called per day.
    Returns:
        (drawn, V, T, picks, best_estimated, optimal):
        drawn (n_draws,) int grid positions in draw order;
        V, T (n_draws, 2) means over folds of [AP, mean daily CP@k] on the
        validation and the test folds;
        picks (2,) int grid positions of the candidate V picks per metric;
        best_estimated (2,) the test means of those picks;
        optimal (2,) the best test mean per metric.
    """
    # BEGIN SOLUTION
    drawn = np.random.default_rng(seed).choice(len(grid), n_draws, replace=False)
    cands = [grid[i] for i in drawn]
    val, _ = prequential_selection(days, cards, labels, cands, fit_and_score, deploy_start,
                                   n_folds, delta_train, delta_delay, delta_test, k)
    roles = prequential_split(days, cards, labels, deploy_start, n_folds, delta_train, delta_delay, delta_test)
    test = np.zeros((len(cands), n_folds, 2))
    for j in range(n_folds):
        tr, te = np.flatnonzero(roles[j] == 1), np.flatnonzero(roles[j] == 2)
        for c, cand in enumerate(cands):
            s = fit_and_score(tr, cand)[te]
            test[c, j] = (average_precision(labels[te], s),
                          card_precision_top_k(days[te], cards[te], s, labels[te], k).mean())
    V, T = val.mean(axis=1)[:, 1:], test.mean(axis=1)
    best = V.argmax(axis=0)
    return drawn, V, T, drawn[best], T[best, [0, 1]], T.max(axis=0)
    # END SOLUTION

# %%
# Local referee: ten days of four payments a day, each on its own card, one
# fraud a day; one fold, one-day training block and delay, two-day blocks
# scored. Validation scores days 5-6, the test fold days 8-9. Candidate
# "early" ranks right only before day 7, "late" only from day 7: the folds
# pick "early", whose test score is the worst, while hindsight would take
# "late" at a perfect 1.0.
_d = np.repeat(np.arange(10), 4)
_c = np.arange(len(_d))
_l = np.tile([1, 0, 0, 0], 10)


def _toy(train_idx, cand):
    right = _d >= 7 if cand == "late" else _d < 7
    return np.where(right, _l, 1 - _l).astype(float)


_drawn, _V, _T, _picks, _best, _opt = random_search_backtest(
    ["early", "late"], 2, 0, _toy, _d, _c, _l, 6, 1, 1, 1, 2, 1)
assert np.allclose(_V[_drawn.tolist().index(0)], 1.0) and np.allclose(_opt, 1.0)
assert _picks.tolist() == [0, 0] and (_best < 0.5).all()

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Two passes over the same drawn candidates. The validation pass is one
# call to `prequential_selection`; keep columns 1 and 2 of its table
# (column 0 is ROC-AUC). The test pass is a second loop of your own over
# `prequential_split(..., deploy_start, ...)` — the selection never sees it.
# The picks index the drawn list; the function returns grid positions.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# drawn = default_rng(seed).choice(len(grid), n_draws, replace=False)
# val, _ = prequential_selection(..., [grid[i] for i in drawn], ..., deploy_start, ...)
# roles = prequential_split(days, cards, labels, deploy_start, n_folds, ...)
# for each fold j, each candidate c: s = fit_and_score(train rows of j, c)[test rows of j]
#     test[c, j] = (AP, mean daily CP@k) on the test rows
# V, T = val.mean(axis=1)[:, 1:], test.mean(axis=1)
# best = V.argmax(axis=0)
# return drawn, V, T, drawn[best], T[best, [0, 1]], T.max(axis=0)
# ```
# </details>

# %%
distill.check("tuned-gbm", random_search_backtest)

# %% [markdown]
# Now the boosted tree. scikit-learn's histogram gradient boosting is the
# same algorithm family as XGBoost (a sum of shallow trees, each fitted to
# the remaining errors, shrunk by the learning rate); the grid is the
# lesson's, written trees/rate/depth: 25, 50 or 100 trees, rate 0.1 or 0.3,
# depth 3, 6 or 9. Eight of the eighteen are drawn. The categories enter as
# native categorical features.

# %%
# Infrastructure (do not modify): the boosted-tree fits and the backtest plot.
GBM_GRID = [(n, lr, d) for n in (25, 50, 100) for lr in (0.1, 0.3) for d in (3, 6, 9)]
X_gbm = F[NUMERIC + CATEGORICAL].copy()
for col in CATEGORICAL:
    X_gbm[col] = pd.Categorical(X_gbm[col]).codes
CAT_MASK = [c in CATEGORICAL for c in X_gbm.columns]


def make_gbm(setting):
    n, lr, depth = setting
    return HistGradientBoostingClassifier(max_iter=n, learning_rate=lr, max_depth=depth,
                                          early_stopping=False, random_state=0,
                                          categorical_features=CAT_MASK)


def fit_gbm(train_idx, setting):
    return make_gbm(setting).fit(X_gbm.iloc[train_idx], y[train_idx]).predict_proba(X_gbm)[:, 1]


def plot_backtest(names, V, T, metric_names=("average precision", f"CP@{K}")):
    fig, axes = plt.subplots(1, 2, figsize=(10, 3.2))
    for m, ax in enumerate(axes):
        ax.scatter(V[:, m], T[:, m], color="C0")
        for name, v, t in zip(names, V[:, m], T[:, m]):
            ax.annotate(name, (v, t), fontsize=7, xytext=(3, 3), textcoords="offset points")
        lo, hi = min(V[:, m].min(), T[:, m].min()), max(V[:, m].max(), T[:, m].max())
        ax.plot([lo, hi], [lo, hi], color="0.7", ls=":")
        ax.set_xlabel("validation mean"); ax.set_ylabel("test mean"); ax.set_title(metric_names[m])
    plt.tight_layout(); plt.show()


drawn, V, T, picks, best_est, optimal = random_search_backtest(
    GBM_GRID, 8, 7, fit_gbm, days, cards, y, DEPLOY_START, N_FOLDS, D_TRAIN, D_DELAY, D_TEST, K)
names = ["/".join(map(str, GBM_GRID[i])) for i in drawn]
print("trees/rate/depth   val AP  test AP   val CP  test CP")
for name, v, t in zip(names, V, T):
    print(f"{name:16s}   {v[0]:.3f}   {t[0]:.3f}    {v[1]:.3f}   {t[1]:.3f}")
for m, metric in enumerate(("AP", f"CP@{K}")):
    print(f"{metric:6s} pick {'/'.join(map(str, GBM_GRID[picks[m]]))}: best-estimated {best_est[m]:.3f}, "
          f"optimal {optimal[m]:.3f}, cost of selecting {optimal[m] - best_est[m]:.3f}")
plot_backtest(names, V, T)

# %% [markdown]
# ## The two detectors under one referee
#
# The tuned tree is the average-precision pick. Both detectors are now
# fitted on each test fold's training block and scored on its test block —
# the folds the selection never saw — by average precision, card precision
# at 20, and savings: the Bayes-minimum-risk rule of the
# example-dependent-cost lesson alerts when
# $C_a \le \mathrm{Amt}\cdot p$, priced against the cheaper trivial policy.
# The rule reads $p$ as a number. Neither model was trained on undersampled
# data, so the card's probability (read back from its log-odds) and the
# tree's `predict_proba` are taken as calibrated, without the correction the
# evaluation lab needed. The investigator's call is priced at $C_a = €5$,
# and the curve shows how the savings move with that price.

# %%
# Infrastructure (do not modify): both detectors on the test folds, in money.
TUNED = GBM_GRID[picks[0]]
C_A = 5.0
C_GRID = np.array([1.0, 2.0, 3.0, 5.0, 7.5, 10.0, 15.0, 20.0])


def card_proba(train_idx):
    model = Scorecard(card_num, card_cat, n_bins=10).fit(F.iloc[train_idx], y[train_idx])
    return model.proba(F)


def gbm_proba(train_idx):
    return fit_gbm(train_idx, TUNED)


def test_fold_report(proba_fn):
    roles = prequential_split(days, cards, y, DEPLOY_START, N_FOLDS, D_TRAIN, D_DELAY, D_TEST)
    rows = []
    for j in range(N_FOLDS):
        tr, te = np.flatnonzero(roles[j] == 1), np.flatnonzero(roles[j] == 2)
        p = proba_fn(tr)[te]
        decide = (C_GRID[:, None] <= amounts[te] * p).astype(int)
        sav = [savings(amounts[te], y[te], dec, c)[2][0] for dec, c in zip(decide, C_GRID)]
        rows.append([average_precision(y[te], p),
                     card_precision_top_k(days[te], cards[te], p, y[te], K).mean(), *sav])
    return np.array(rows)


reports = {"scorecard": test_fold_report(card_proba),
           f"boosted tree {'/'.join(map(str, TUNED))}": test_fold_report(gbm_proba)}
i5 = int(np.flatnonzero(C_GRID == C_A)[0]) + 2
print(f"{'':24s} {'AP':>13s} {'CP@' + str(K):>13s} {'savings at €5':>15s}")
for name, r in reports.items():
    print(f"{name:24s} " + "  ".join(f"{r[:, m].mean():.3f} ± {r[:, m].std():.3f}" for m in (0, 1, i5)))
print("savings by alert cost:", "  ".join(f"€{c:g}" for c in C_GRID))
for name, r in reports.items():
    print(f"  {name:24s}", "  ".join(f"{v:.2f}" for v in r[:, 2:].mean(0)))
fig, ax = plt.subplots(figsize=(5.5, 3.2))
for name, r in reports.items():
    ax.errorbar(C_GRID, r[:, 2:].mean(0), yerr=r[:, 2:].std(0), marker="o", capsize=2, label=name)
ax.set_xscale("log"); ax.set_xlabel("alert cost C_a (€)"); ax.set_ylabel("savings, mean over test folds")
ax.legend(fontsize=8); plt.show()

# %% [markdown]
# ## Written answer (optional)
#
# You are the analyst who has to recommend one of the two to the head of
# fraud operations. Using the numbers your own run printed above — savings at
# the investigator's price, card precision at 20, average precision, with
# their spreads over the test folds — say which detector you would ship
# and argue it in money: what the gap is worth per euro of fraud at stake,
# whether it exceeds the spread across folds, and how it moves if the call
# costs €2 or €15 instead of €5. Then name what the other detector buys
# that the numbers do not price, and say when that would reverse your
# choice.

# %%
distill.submit_review(
    "which-to-ship",
    "Ship the boosted tree. On the three test folds, with the call priced at 5 "
    "euros, it saves 0.45 +/- 0.02 of the baseline cost against 0.19 +/- 0.06 for "
    "the scorecard. The baseline here is flagging nothing, so of every 100 euros "
    "of fraud the bank would otherwise lose the tree keeps about 26 euros more, a "
    "gap four times the larger fold spread. The ranking metrics agree: average "
    "precision 0.47 against 0.14, and card precision at 20 0.30 against 0.19, "
    "about two more compromised cards a day out of 20 calls, beyond the 0.03-0.04 "
    "spread. The gap grows with the price of a call: at 2 euros 0.54 against "
    "0.37, at 15 euros 0.28 against 0.05. When calls are cheap almost any "
    "suspicion is worth one and both detectors save; when each call has to be "
    "paid for by amount times probability, the card's additive probability "
    "rarely clears the bar on its own lines, while the tree combines them (an "
    "unusual hour at a terminal the card has never used) and still does. What "
    "the card buys is reviewability: six lines of points a regulator, an "
    "investigator or a customer can check against bin counts, signs checked "
    "before deployment, and an explanation of every alert for free. If the bank "
    "had to justify each declined payment line by line, or could not validate "
    "the tree on fraud it has not seen, the card's lower savings would be the "
    "price of being allowed to deploy; on these numbers that price is about a "
    "quarter of the fraud losses, which is the figure to put to whoever imposes "
    "the requirement."
)

# %% [markdown]
# ## Open task (optional): beat the bar on a week you have never seen
#
# `data/holdout_week.csv.gz` is the test week (days 53–59) of a second run of
# the generator with a seed you do not have: the same columns as `F`, built
# by the same feature builder, known cards removed with the harness's rule,
# plus the day and card of each payment. Its labels stay on the server.
# Train either detector — or anything else — on any rows of the stream
# before day 53, and score the hold-out week.
#
# The server grades one number: ROC-AUC over the hold-out week's
# **card-days** (one row per card per day, its maximum score and maximum
# label), the unit card precision ranks, as in the evaluation lab. The
# platform's metrics are ranking and error measures; savings needs the
# amounts and a decision rule beside the labels, so the money comparison
# stays local, in the plot after the submission. The bar is **0.83**. The
# card of the cell above, fitted on days 39–45, scores about 0.80, and
# refitting it on more weeks does not move it; the tuned tree on the same
# single week scores about 0.84. The hold-out week is harder than the
# stream's own test week: every detector scores a few hundredths lower
# there. Choose with your folds, not with the grade.
#
# End your cell with `holdout_scores`, one score per hold-out row, and
# `test_scores`, the same model's scores on the stream's own test week
# `F.iloc[test_rows]`, used for the local picture. Hints follow the plot.

# %%
# Infrastructure (do not modify): hold-out loading and the card-day collapse.
holdout = pd.read_csv("data/holdout_week.csv.gz")
holdout["COUNTRY_GROUP"] = country_group(holdout.TX_COUNTRY)
holdout_gbm = holdout[NUMERIC + CATEGORICAL].copy()
for col in CATEGORICAL:
    holdout_gbm[col] = pd.Categorical(holdout_gbm[col], categories=pd.Categorical(F[col]).categories).codes


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
# The tuned tree, refitted on the five most recent weeks whose labels have
# all arrived by day 53.
recent = np.flatnonzero((days >= 11) & (days <= 45))
final = make_gbm(TUNED).fit(X_gbm.iloc[recent], y[recent])
holdout_scores = final.predict_proba(holdout_gbm)[:, 1]
test_scores = final.predict_proba(X_gbm.iloc[test_rows])[:, 1]
# END SOLUTION

# %%
distill.submit_predictions("beat-holdout-week", card_day_scores(holdout, holdout_scores))

# %%
# Infrastructure (do not modify): card-day ROC and savings on the stream's
# test week, your model against the card.
test_frame = stream.iloc[test_rows]
cd_labels = card_day_scores(test_frame, y[test_rows])
card_test = card.proba(F.iloc[test_rows])
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
for name, s in (("your model", test_scores), ("scorecard", card_test)):
    cd = card_day_scores(test_frame, s)
    fpr, tpr, _ = roc_curve(cd_labels, cd)
    axes[0].plot(fpr, tpr, label=f"{name}, card-day AUC {roc_auc_score(cd_labels, cd):.3f}")
    if s.min() >= 0 and s.max() <= 1:
        sav = [savings(amounts[test_rows], y[test_rows], (c <= amounts[test_rows] * s).astype(int), c)[2][0]
               for c in C_GRID]
        axes[1].plot(C_GRID, sav, marker="o", label=name)
axes[0].plot([0, 1], [0, 1], color="0.75", ls=":")
axes[0].set_xlabel("false-positive rate (card-days)"); axes[0].set_ylabel("true-positive rate")
axes[0].legend(loc="lower right", fontsize=8)
axes[1].set_xscale("log"); axes[1].set_xlabel("alert cost C_a (€)"); axes[1].set_ylabel("savings, test week")
axes[1].legend(fontsize=8)
plt.tight_layout(); plt.show()

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# A ranking over card-days rewards the tail of the ranking as much as its
# head: frauds the model ranks among the genuine card-days cost as much as
# false alarms at the top. A model that sees more weeks of labelled fraud
# sees more compromised terminals and leaked cards.
# </details>
#
# <details><summary>Hint 2 — what to try</summary>
#
# The tuned setting from your random search, trained on more than one week
# of the stream: every label of days 11–45, five weeks, has arrived by day
# 53. One week holds about 40 compromised terminals and leaked cards; five
# weeks hold several times as many schemes to learn from. Check the choice
# on your test folds before submitting.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# recent = np.flatnonzero((days >= 11) & (days <= 45))
# final = make_gbm(TUNED).fit(X_gbm.iloc[recent], y[recent])
# holdout_scores = final.predict_proba(holdout_gbm)[:, 1]
# test_scores = final.predict_proba(X_gbm.iloc[test_rows])[:, 1]
# ```
# </details>

# %% [markdown]
# ## References
#
# - B. Baesens, V. Van Vlasselaer, W. Verbeke, *Fraud Analytics Using
#   Descriptive, Predictive, and Social Network Techniques*, Wiley, 2015:
#   ch. 2 (equal-frequency binning, the χ² comparison of the product-type
#   groupings, Tables 2.5–2.7; the age table and its weights of evidence,
#   Table 2.8; information value, Table 2.10), ch. 4 (the scorecard scale,
#   factor and offset, points per attribute).
# - Y.-A. Le Borgne, W. Siblini, B. Lebichot, G. Bontempi, *Reproducible
#   Machine Learning for Credit Card Fraud Detection — Practical Handbook*,
#   Université Libre de Bruxelles, 2022: ch. 3.2 (the simulator), ch. 4
#   (average precision, card precision at k), ch. 5 (prequential validation,
#   model selection, random search over the XGBoost grid).
# - A. Correa Bahnsen, D. Aouada, A. Stojanovic, B. Ottersten, "Feature
#   engineering strategies for credit card fraud detection", *Expert Systems
#   with Applications* 51, 2016 (cost, savings and the Bayes-minimum-risk
#   decision).

# %%
distill.dump()
