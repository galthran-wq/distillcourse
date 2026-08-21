# %% [markdown]
# # Lab: gradient boosting from scratch
#
# Module 7 derived the boosting family three times over — AdaBoost's
# reweighting arithmetic, Friedman's function-space gradient descent, and
# XGBoost's second-order leaf formula. This lab turns the derivations into
# one running machine: an exhaustive-search regression stump, the
# least-squares boosting loop with shrinkage, staged predictions for
# whole-path evaluation, the same loop under binomial deviance, XGBoost's
# Newton leaf inside your own booster, and one executable AdaBoost round
# that referees the hand table from the AdaBoost lesson. The finale is
# open: configure your booster any way you like and beat a held-out
# probability-error bar on the spam corpus.
#
# Ground rules:
#
# - **No sklearn, no scipy** — the stump, the loop, and the gradients are
#   your numpy end to end. (Checking against a library on your own machine
#   is fine; the graded work is yours.)
# - Each checkpoint cell submits your function's outputs to the course
#   server, which compares them against a reference. Run them as you go.
#   Six of the nine checkpoints are required — the stump, the two boosting
#   loops, staged predictions, the shrinkage curves, and the AdaBoost
#   round; the Newton-leaf extension, the open task and the written answer
#   are optional — partial completion is a normal way to finish.
# - Everything is deterministic: no randomness enters after the data is
#   loaded, so two runs of a correct notebook agree to the last bit.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/boosting-lab")

# %%
# Infrastructure (do not modify): the sigmoid and the Bernoulli
# log-likelihood from the logistic-regression lab, shipped complete, plus
# the probability-error measure the final task is scored by and one plot
# helper used for every curve in this lab.
def sigmoid(z):
    """Elementwise logistic function of an array."""
    return 1.0 / (1.0 + np.exp(-z))

def bernoulli_nll(y, p):
    """Summed negative log-likelihood of probabilities p for labels y in {0,1}."""
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.sum(y * np.log(p) + (1 - y) * np.log(1 - p)))

def root_brier(y, p):
    """Root-mean-square error of probabilities against 0/1 labels."""
    return float(np.sqrt(np.mean((y - p) ** 2)))

def plot_rounds(series, ylabel, title):
    """series: (rounds, values, label) triples, one line each."""
    for x, v, label in series:
        plt.plot(x, v, lw=1.2, label=label)
    plt.xlabel("boosting rounds m")
    plt.ylabel(ylabel)
    plt.title(title)
    plt.legend()
    plt.show()

# %% [markdown]
# ## 1. The stump — one split, found exhaustively
#
# Everything in this lab stands on a depth-1 regression tree: one feature,
# one threshold, two constant leaves. The trees lesson established how the
# best split is found — sort each feature once, then every threshold worth
# trying sits between two consecutive distinct values, and a running-sum
# scan prices them all in one pass. Here that scan becomes a function with
# an exact contract, because five later checkpoints call it.
#
# The contract, which the checker verifies exactly:
#
# - candidate thresholds for feature $j$ are the midpoints between
#   consecutive *distinct* values of that feature — never the data values
#   themselves;
# - a stump sends rows with $x_j \le t$ left and the rest right; each leaf
#   predicts the mean of its rows' targets;
# - the split minimizes the residual sum of squares
#   $\sum_{\text{left}} (y_i - \bar{y}_L)^2 + \sum_{\text{right}} (y_i - \bar{y}_R)^2$;
# - ties break toward the smallest feature index, then the smallest
#   threshold.

# %%
def fit_stump(X, y):
    """Best depth-1 regression tree by exhaustive scan.

    Args:
        X: (n, d) features.
        y: (n,) real-valued targets.
    Returns:
        (j, t, left_mean, right_mean), all floats: the feature index, the
        threshold (a midpoint between consecutive distinct values of
        feature j), and the two leaf means, per the contract above.
        None when no feature has two distinct values — there is then no
        candidate threshold, so no stump exists. Section 9 relies on this.
    """
    # BEGIN SOLUTION
    n = len(y)
    best_rss, best = np.inf, None
    for j in range(X.shape[1]):
        order = np.argsort(X[:, j], kind="stable")
        xs, ys = X[order, j], y[order]
        cum, cumsq = np.cumsum(ys), np.cumsum(ys * ys)
        nl = np.arange(1, n)
        sl, s2l = cum[:-1], cumsq[:-1]
        sr, s2r = cum[-1] - sl, cumsq[-1] - s2l
        rss = (s2l - sl * sl / nl) + (s2r - sr * sr / (n - nl))
        ok = np.flatnonzero(xs[1:] > xs[:-1])
        if len(ok) == 0:
            continue
        i = ok[np.argmin(rss[ok])]
        if rss[i] < best_rss:
            best_rss = rss[i]
            best = (float(j), float((xs[i] + xs[i + 1]) / 2),
                    float(sl[i] / (i + 1)), float(sr[i] / (n - i - 1)))
    return best
    # END SOLUTION

# %%
def predict_stump(stump, X):
    """Predictions of a fitted stump.

    Args:
        stump: (j, t, left_mean, right_mean) as returned by fit_stump.
        X: (m, d) rows to predict.
    Returns:
        (m,) array: left_mean where X[:, j] <= t, right_mean elsewhere.
    """
    # BEGIN SOLUTION
    j, t, cl, cr = stump
    return np.where(X[:, int(j)] <= t, cl, cr)
    # END SOLUTION

# %%
# Local referees before submitting. First by hand: four points, one
# feature, a clean step at 2.5.
_X4 = np.array([[1.0], [2.0], [3.0], [4.0]])
_y4 = np.array([0.0, 0.0, 1.0, 1.0])
assert fit_stump(_X4, _y4) == (0.0, 2.5, 0.0, 1.0)
assert np.array_equal(predict_stump((0.0, 2.5, 0.0, 1.0), _X4),
                      np.array([0.0, 0.0, 1.0, 1.0]))
# Duplicated values: candidates sit between DISTINCT values, so the only
# threshold here is 1.5 — not 1.0 or 2.0.
assert fit_stump(np.array([[1.0], [1.0], [2.0], [2.0]]), _y4)[1] == 1.5
# The degenerate case: no feature with two distinct values, no candidate
# threshold, no stump — the contract says None. Section 9 depends on it.
assert fit_stump(np.ones((3, 2)), np.array([1.0, 2.0, 3.0])) is None
# A stump is a function of the data set, not of the row order.
_rng = np.random.default_rng(0)
_Xp = _rng.normal(size=(60, 3))
_yp = (_Xp[:, 1] > 0.3).astype(float)
_perm = _rng.permutation(60)
assert np.allclose(fit_stump(_Xp, _yp), fit_stump(_Xp[_perm], _yp[_perm]))

# %%
# The scan must be a scan: the boosting sections below call fit_stump
# hundreds of times, and a per-threshold recomputation of both means is
# the difference between seconds and hours in section 4.
import time
_Xbig = np.random.default_rng(0).normal(size=(2000, 8))
_ybig = np.random.default_rng(1).normal(size=2000)
_t0 = time.perf_counter()
fit_stump(_Xbig, _ybig)
_dt = time.perf_counter() - _t0
print(f"fit_stump on 2000x8: {_dt * 1000:.1f} ms")
assert _dt < 2.0, ("too slow for the sections ahead: sort each feature once "
                   "and price every threshold with prefix sums")

# %%
def _stump_check(X, y, Xq):
    """What the checker sees: the fitted stump and its predictions on Xq."""
    stump = fit_stump(X, y)
    return np.array(stump), predict_stump(stump, Xq)

distill.check("stump-fit", _stump_check)

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# One loop over features; no loop over thresholds. Sort the feature (carry
# $y$ along in the same order). If the first $k$ sorted rows go left, the
# left RSS is $\sum_{i \le k} y_i^2 - (\sum_{i \le k} y_i)^2 / k$ — both
# sums readable from `np.cumsum(ys)` and `np.cumsum(ys**2)` at position
# $k$, and the right side from the totals minus the same entries. Mask out
# split positions where the sorted feature does not change (those are not
# between distinct values), take the argmin, convert the position back to
# a midpoint threshold and two means.
# </details>
#
# <details><summary>Hint 2 — the tie and boundary traps</summary>
#
# Three classic misses: a threshold placed AT a data value instead of the
# midpoint (the contract's candidates are `(xs[i] + xs[i+1]) / 2` where
# `xs[i+1] > xs[i]`); a split offered between two equal values (the two
# sides then depend on sort stability — the mask `xs[1:] > xs[:-1]` rules
# them out); and an off-by-one where the boundary row's target is counted
# in both prefix sums.
# </details>
#
# <details><summary>Hint 3 — pseudocode</summary>
#
# ```
# for j in features:
#     xs, ys <- feature j and y, sorted by the feature
#     cum, cumsq <- cumsum(ys), cumsum(ys^2)
#     for split size k = 1..n-1 (vectorized):
#         rss[k] = (cumsq[k-1] - cum[k-1]^2 / k)
#                + (cumsq[-1] - cumsq[k-1] - (cum[-1] - cum[k-1])^2 / (n - k))
#     keep only k where xs[k] > xs[k-1]; track the global argmin
# return j*, (xs[k*-1] + xs[k*]) / 2, left mean, right mean
# ```
# </details>

# %% [markdown]
# ## 2. The least-squares boosting loop
#
# The gradient-boosting lesson reduced Friedman's general recipe to its
# squared-loss "reality check": the pseudo-residual is the plain residual,
# so boosting is *fit the residuals, shrink, add, repeat*. With the stump
# verified, that loop is about ten lines, and this section holds you to
# ESL Algorithm 10.3 exactly:
#
# - $f_0$ is the best constant under squared loss — the mean of $y$;
# - at round $m$: compute residuals $r = y - f$ against the CURRENT model,
#   fit a stump to $(X, r)$, and update $f \leftarrow f + \nu \cdot
#   \text{stump}(X)$;
# - the stored stump is the raw fit to the residuals; the learning rate
#   $\nu$ lives in the update (and in prediction), never inside the stored
#   leaf values.

# %%
def boost_ls(X, y, M, nu):
    """Least-squares gradient boosting with stumps.

    Args:
        X: (n, d) features; y: (n,) real targets.
        M: number of boosting rounds.
        nu: learning rate applied to every stump's contribution.
    Returns:
        (f0, stumps): f0 the initial constant (float), stumps an (M, 4)
        float array whose row m is the round-m stump (j, t, left_mean,
        right_mean), fitted per the contract above.
    """
    # BEGIN SOLUTION
    f0 = float(y.mean())
    f = np.full(len(y), f0)
    stumps = np.empty((M, 4))
    for m in range(M):
        r = y - f
        s = fit_stump(X, r)
        stumps[m] = s
        f = f + nu * predict_stump(s, X)
    return f0, stumps
    # END SOLUTION

# %%
# Local referees. One round at nu=1 is exactly mean + one stump on the
# centered targets.
_Xb = np.random.default_rng(2).normal(size=(50, 3))
_yb = _Xb[:, 0] - 2.0 * (_Xb[:, 2] > 0) + 0.1 * np.random.default_rng(3).normal(size=50)
_f0, _st = boost_ls(_Xb, _yb, 1, 1.0)
assert _f0 == _yb.mean()
assert tuple(_st[0]) == fit_stump(_Xb, _yb - _yb.mean())
# Each round projects the residual onto a two-leaf step function, so for
# 0 < nu < 2 the training MSE can never rise. Watch it fall.
_f0, _st = boost_ls(_Xb, _yb, 30, 0.3)
_f = np.full(50, _f0)
_mses = []
for _s in _st:
    _f = _f + 0.3 * predict_stump(tuple(_s), _Xb)
    _mses.append(np.mean((_yb - _f) ** 2))
assert all(a >= b - 1e-12 for a, b in zip(_mses, _mses[1:]))
print(f"training MSE after 1, 10, 30 rounds: "
      f"{_mses[0]:.3f}, {_mses[9]:.3f}, {_mses[-1]:.3f}")

# %%
distill.check("boost-ls", boost_ls)

# %% [markdown]
# If stuck: the residual is recomputed against the model as it stands this
# round — a loop that keeps fitting $y - f_0$ never accumulates anything —
# and $\nu$ scales the *update*, not the residuals handed to the stump.
# Fitting the stump to $\nu \cdot r$ stores scaled-down leaves and then
# adds them unscaled: the predictions come out identical, which is exactly
# why the checker inspects the stored stumps and not just a prediction.

# %% [markdown]
# ## 3. Staged predictions — the whole path from one fit
#
# A boosted model is a sum, so every prefix of it is also a model: after
# fitting once, the prediction of the first $m$ stumps is available for
# every $m$ with no refitting. This is the device that makes the next
# section's curves cheap — one fit at each $\nu$, then the entire
# test-error-versus-rounds curve from a single matrix — and it returns in
# module 9, where the same staged sums produce AdaBoost's margin curves.
#
# The contract: row $m$ holds the model after $m$ stumps, so row 0 is the
# constant $f_0$ and row $M$ is the full model — $M+1$ rows in all, each
# accumulated with the same $\nu$ used in training.

# %%
def staged_predict(f0, stumps, nu, X):
    """Predictions of every prefix model on the rows of X.

    Args:
        f0: the initial constant.
        stumps: (M, 4) array of stumps as returned by boost_ls.
        nu: the learning rate the model was trained with.
        X: (m, d) rows to predict.
    Returns:
        (M+1, m) array: row k is the prediction of f0 plus the first k
        stumps, each scaled by nu. Row 0 is constant f0.
    """
    # BEGIN SOLUTION
    out = np.empty((len(stumps) + 1, len(X)))
    f = np.full(len(X), float(f0))
    out[0] = f
    for m in range(len(stumps)):
        f = f + nu * predict_stump(tuple(stumps[m]), X)
        out[m + 1] = f
    return out
    # END SOLUTION

# %%
# Local referees: the last row is the full model; every consecutive pair
# of rows differs by one shrunk stump (two distinct values at most).
_stg = staged_predict(_f0, _st, 0.3, _Xb)
assert _stg.shape == (31, 50)
assert np.allclose(_stg[0], _f0)
assert np.allclose(_stg[-1] - _stg[-2], 0.3 * predict_stump(tuple(_st[-1]), _Xb))

# %%
distill.check("staged-predict", staged_predict)

# %% [markdown]
# ## 4. The shrinkage trade, measured
#
# The gradient-boosting lesson stated Friedman's finding: shrink each step
# by $\nu \approx 0.1$, spend ten times the rounds, and the test error
# lands lower than $\nu = 1$ ever reaches. So far that is a claim from a
# 2001 paper. Your machinery can now measure it: fit at several learning
# rates, score every prefix model on held-out data, and compare the curves.
#
# The contract: `error_curves` fits `boost_ls` on the training set once
# per learning rate and returns the held-out mean squared error of every
# prefix model — a `(len(nus), M+1)` array whose row $i$, column $m$ is
# the test MSE after $m$ rounds at learning rate `nus[i]`.

# %%
def error_curves(X_tr, y_tr, X_te, y_te, M, nus):
    """Held-out error of every prefix model, per learning rate.

    Args:
        X_tr, y_tr: training set; X_te, y_te: held-out set.
        M: rounds to fit at each learning rate.
        nus: sequence of learning rates.
    Returns:
        (len(nus), M+1) array: entry [i, m] is the mean squared error on
        (X_te, y_te) of the model fitted on (X_tr, y_tr) with nus[i],
        truncated to its first m stumps (m=0 is the constant f0).
    """
    # BEGIN SOLUTION
    out = np.empty((len(nus), M + 1))
    for i, nu in enumerate(nus):
        f0, stumps = boost_ls(X_tr, y_tr, M, nu)
        staged = staged_predict(f0, stumps, nu, X_te)
        out[i] = np.mean((staged - y_te) ** 2, axis=1)
    return out
    # END SOLUTION

# %%
# Local referees on a small split of section 2's data. Column 0 is the
# constant model f0 — the mean of y_tr — scored on the HELD-OUT rows,
# and the matrix has M+1 columns, exactly staged_predict's row count.
_ec = error_curves(_Xb[:30], _yb[:30], _Xb[30:], _yb[30:], 12, (1.0, 0.1))
assert _ec.shape == (2, 13)
assert np.allclose(_ec[:, 0], np.mean((_yb[30:] - _yb[:30].mean()) ** 2))

# %%
distill.check("shrinkage-curves", error_curves)

# %% [markdown]
# If stuck: "held-out" means every prefix model is scored on
# `(X_te, y_te)` — a curve that only ever falls is the training-error
# shape (section 2 proved training MSE cannot rise), so a curve with no
# minimum is measuring the wrong rows. And column $m$ is the error after
# $m$ stumps with $m = 0$ the constant alone: $M + 1$ columns, matching
# the referee above.

# %% [markdown]
# ### California housing: the ν–M trade on your own machine
#
# The measurement data is the [California housing
# set](https://www.dcc.fc.up.pt/~ltorgo/Regression/cal_housing.html) of
# Pace and Barry ("Sparse spatial autoregressions", *Statistics &
# Probability Letters* 33, 1997): one row per 1990-census block group,
# eight predictors (median income, house age, rooms and bedrooms per
# household, population, occupancy, latitude, longitude), target the
# block's median house value in units of \$100,000, capped at 5.0 in the
# source data. `data/calif.csv` ships a 3,500-row random extract; the
# rows are already shuffled, so a slice is a fair split. The training
# slice is deliberately small — 400 rows — so that the unshrunk booster's
# overfitting arrives inside the round budget and the whole experiment
# runs in well under a minute.
#
# Run your curves at $\nu = 1.0$ and $\nu = 0.1$ for 800 rounds and read
# the trade off the plot: the unshrunk booster reaches its best test
# error before round 200 and then climbs as later stumps fit noise; the
# shrunk one is still improving at the end of the budget and is lower
# than the other curve's best long before that — the lesson's claim, now
# a measurement.

# %%
# Infrastructure (do not modify): load, split, run YOUR curves, plot.
_cal = np.loadtxt("data/calif.csv", delimiter=",", skiprows=1)
_Xc_tr, _yc_tr = _cal[:400, :8], _cal[:400, 8]
_Xc_te, _yc_te = _cal[2000:, :8], _cal[2000:, 8]
print(f"California: {len(_yc_tr)} train / {len(_yc_te)} test rows, "
      f"median value mean {_cal[:, 8].mean():.2f} (x $100k)")
M_CAL = 800
_curves = error_curves(_Xc_tr, _yc_tr, _Xc_te, _yc_te, M_CAL, (1.0, 0.1))
plot_rounds([(np.arange(M_CAL + 1), _curves[0], "nu = 1.0"),
             (np.arange(M_CAL + 1), _curves[1], "nu = 0.1")],
            "held-out MSE", "stump boosting on California housing")
_m1, _m01 = int(np.argmin(_curves[0])), int(np.argmin(_curves[1]))
print(f"nu=1.0: best test MSE {_curves[0, _m1]:.4f} at round {_m1}")
print(f"nu=0.1: best test MSE {_curves[1, _m01]:.4f} at round {_m01}")
assert _curves[1, _m01] < _curves[0, _m1] - 0.03, "Friedman's finding should reproduce"
assert _m01 > 2 * _m1, "the shrunk booster pays for its minimum with many more rounds"

# %% [markdown]
# The curves are the ν–M trade: on this run the unshrunk booster bottoms
# out near test MSE 0.50 before round 200 and climbs from there, while
# $\nu = 0.1$ passes it for good a few hundred rounds in and is still
# inching down at 0.45 when the budget ends — its minimum is set by the
# round budget, which is the trade in its purest form: about ten percent
# lower error, bought with several times the rounds. Section 8 asks you
# to explain the mechanism; hold on to what the plot shows.

# %% [markdown]
# ## 5. The same loop under binomial deviance
#
# Friedman's point was that nothing in the loop is specific to squared
# loss: the tree is always a least-squares fit to the *negative gradient*
# of the outer loss with respect to the current scores. For classification
# with $y \in \{0, 1\}$, the model keeps a real-valued score $F$, converts
# it to a probability $p = \sigma(F)$ only at the end, and the outer loss
# is the summed binomial deviance
#
# $$L(y, F) = -\sum_i \bigl[ y_i \log \sigma(F_i) + (1 - y_i) \log(1 - \sigma(F_i)) \bigr].$$
#
# Derive the pseudo-residual $r_i = -\partial L / \partial F_i$ yourself —
# the logistic-regression lesson did this computation, and the referee
# below checks your algebra against finite differences before any
# boosting happens.

# %%
def deviance_residual(y, F):
    """Negative gradient of the summed binomial deviance in the scores.

    Args:
        y: (n,) labels in {0, 1}.
        F: (n,) real-valued scores.
    Returns:
        (n,) array: r_i = -dL/dF_i for the loss L printed above.
    """
    # BEGIN SOLUTION
    return y - sigmoid(F)
    # END SOLUTION

# %%
# The finite-difference referee: your algebra against the definition of
# the derivative, on random scores.
_rng5 = np.random.default_rng(5)
_yd = (_rng5.random(8) > 0.5).astype(float)
_Fd = _rng5.normal(size=8)
_num = np.empty(8)
for _i in range(8):
    _Fp, _Fm = _Fd.copy(), _Fd.copy()
    _Fp[_i] += 1e-6
    _Fm[_i] -= 1e-6
    _num[_i] = -(bernoulli_nll(_yd, sigmoid(_Fp)) - bernoulli_nll(_yd, sigmoid(_Fm))) / 2e-6
assert np.allclose(deviance_residual(_yd, _Fd), _num, atol=1e-5), \
    "the finite-difference referee disagrees with your gradient"
print("deviance gradient confirmed by finite differences")

# %% [markdown]
# The loop itself changes in exactly three places, as the lesson's
# loss-table said it would: the initialization (the deviance-minimizing
# constant score is the log-odds of the base rate,
# $F_0 = \log \bar{y} / (1 - \bar{y})$), the residuals the stump is fit
# to, and nothing else — the stump fit stays least-squares, the update
# stays $F \leftarrow F + \nu \cdot \text{stump}(X)$, and the sigmoid is
# applied once, at prediction time.

# %%
def boost_logit(X, y, M, nu):
    """Gradient boosting of the binomial deviance with stumps.

    Args:
        X: (n, d) features; y: (n,) labels in {0, 1}, not all equal.
        M: rounds; nu: learning rate.
    Returns:
        (F0, stumps): F0 = log(ybar / (1 - ybar)) the initial score
        (float), stumps an (M, 4) array; row m is the round-m stump fitted
        by least squares to YOUR deviance_residual of the current scores,
        stored raw, with nu applied only in the score update.
    """
    # BEGIN SOLUTION
    ybar = y.mean()
    F0 = float(np.log(ybar / (1 - ybar)))
    F = np.full(len(y), F0)
    stumps = np.empty((M, 4))
    for m in range(M):
        r = deviance_residual(y, F)
        s = fit_stump(X, r)
        stumps[m] = s
        F = F + nu * predict_stump(s, X)
    return F0, stumps
    # END SOLUTION

# %%
# Local referees: scores are scores until the end (probabilities live in
# (0,1) only after the sigmoid), and the training deviance falls round by
# round — staged_predict works unchanged on score models.
_rng6 = np.random.default_rng(6)
_Xg = _rng6.normal(size=(120, 3))
_yg = ((_Xg[:, 0] + _Xg[:, 1] ** 2 - 0.8) > 0).astype(float)
_F0g, _stg2 = boost_logit(_Xg, _yg, 40, 0.3)
assert _F0g == float(np.log(_yg.mean() / (1 - _yg.mean())))
_scores = staged_predict(_F0g, _stg2, 0.3, _Xg)
_dev = [bernoulli_nll(_yg, sigmoid(_s)) / len(_yg) for _s in _scores]
assert all(a >= b - 1e-12 for a, b in zip(_dev, _dev[1:])), \
    "training deviance must fall every round"

# %%
# What a healthy run looks like — and what the sign bug looks like. The
# same loop with the stump fit to the gradient itself, p - y, performs
# ascent: every round pushes the scores away from the labels and the
# deviance climbs from round one. If your curve looks like the second
# one, the finite-difference referee already named the descent direction.
_F_flip = np.full(len(_yg), _F0g)
_dev_flip = [_dev[0]]
for _m in range(40):
    _s_flip = fit_stump(_Xg, sigmoid(_F_flip) - _yg)
    _F_flip = _F_flip + 0.3 * predict_stump(_s_flip, _Xg)
    _dev_flip.append(bernoulli_nll(_yg, sigmoid(_F_flip)) / len(_yg))
plot_rounds([(np.arange(41), np.array(_dev), "fit y - p (descent)"),
             (np.arange(41), np.array(_dev_flip), "fit p - y (diverging)")],
            "mean binomial deviance", "logistic boosting on synthetic data")

# %%
def _logit_check(X, y, M, nu):
    """What the checker sees: the full model's training-row probabilities."""
    F0, stumps = boost_logit(X, y, M, nu)
    return sigmoid(staged_predict(F0, stumps, nu, X)[-1])

distill.check("logit-boost", _logit_check)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — the sign</summary>
#
# The stump is fit to the NEGATIVE gradient. If your booster's training
# deviance rises from round 1, you fit the gradient itself — the referee
# above already told you which of $y - p$ and $p - y$ is the descent
# direction.
# </details>
#
# <details><summary>Hint 2 — the initialization</summary>
#
# $F_0$ is a score, not a probability: it is the log-odds of the base
# rate, the constant minimizing the deviance. Initializing with
# $\bar{y}$ itself starts the model at the wrong point and every staged
# row inherits the offset.
# </details>

# %% [markdown]
# ## 6. Optional: XGBoost's leaf inside your booster
#
# The XGBoost lesson derived the optimal leaf value from the second-order
# expansion of the loss: with $g_i$ and $h_i$ the first and second
# derivatives of the loss in the score, a leaf containing rows $S$ emits
#
# $$w^* = -\frac{G}{H + \lambda}, \qquad
#   G = \sum_{i \in S} g_i, \quad H = \sum_{i \in S} h_i,$$
#
# rather than the mean pseudo-residual. For the deviance,
# $g_i = p_i - y_i$ and $h_i = p_i (1 - p_i)$ — the same pair the
# logistic-regression lesson's Newton step used. This checkpoint grafts
# that leaf into your booster: keep the split search exactly as in
# `boost_logit` (a least-squares stump fit to the pseudo-residuals decides
# $j$ and $t$), then discard the fitted leaf means and emit the Newton
# values instead.

# %%
def boost_logit_newton(X, y, M, nu, lam):
    """Logistic boosting with second-order (Newton) leaf values.

    Args:
        X, y, M, nu: as in boost_logit.
        lam: the L2 leaf penalty lambda >= 0.
    Returns:
        (F0, stumps): F0 as in boost_logit; stumps (M, 4), row m holding
        (j, t, w_left, w_right) where j and t come from the least-squares
        stump fit to the pseudo-residuals and each leaf value is
        -G/(H + lam) summed over that leaf's training rows. The update
        stays F += nu * leaf value.
    """
    # BEGIN SOLUTION
    ybar = y.mean()
    F0 = float(np.log(ybar / (1 - ybar)))
    F = np.full(len(y), F0)
    stumps = np.empty((M, 4))
    for m in range(M):
        p = sigmoid(F)
        g, h = p - y, p * (1 - p)
        j, t, _, _ = fit_stump(X, -g)
        left = X[:, int(j)] <= t
        wl = float(-g[left].sum() / (h[left].sum() + lam))
        wr = float(-g[~left].sum() / (h[~left].sum() + lam))
        stumps[m] = (j, t, wl, wr)
        F = F + nu * np.where(left, wl, wr)
    return F0, stumps
    # END SOLUTION

# %%
# Local referees: an enormous lambda pins every leaf near zero (the
# penalty term dominating the gain, as the XGBoost lesson's formula says),
# and at lambda = 0 the Newton leaf beats the plain gradient leaf on
# training deviance for the same number of rounds.
_F0n, _stn = boost_logit_newton(_Xg, _yg, 40, 0.3, 1e9)
assert np.abs(_stn[:, 2:]).max() < 1e-6
_F0n, _stn = boost_logit_newton(_Xg, _yg, 40, 0.3, 0.0)
_dev_newton = bernoulli_nll(_yg, sigmoid(staged_predict(_F0n, _stn, 0.3, _Xg)[-1]))
_dev_plain = bernoulli_nll(_yg, sigmoid(staged_predict(_F0g, _stg2, 0.3, _Xg)[-1]))
print(f"training deviance after 40 rounds - plain: {_dev_plain:.2f}, "
      f"Newton: {_dev_newton:.2f}")
assert _dev_newton < _dev_plain

# %%
def _newton_check(X, y, M, nu, lam):
    """What the checker sees: the Newton model's training-row probabilities."""
    F0, stumps = boost_logit_newton(X, y, M, nu, lam)
    return sigmoid(staged_predict(F0, stumps, nu, X)[-1])

distill.check("newton-leaf", _newton_check)

# %% [markdown]
# ## 7. One AdaBoost round, refereed
#
# The AdaBoost lesson ran two rounds by hand on ten points and left the
# third as an exercise. That arithmetic deserves an executable referee:
# one function computing a full round in the lesson's convention (ESL
# Algorithm 10.1, labels in $\{-1, +1\}$), checked against the lesson's
# own table.
#
# The contract, given normalized weights $w$, labels $y$ and stump
# predictions $h$ (both $\pm 1$ vectors):
#
# - the weighted error $\varepsilon = \sum_i w_i \mathbf{1}\{h_i \ne y_i\}$;
# - the vote weight $\alpha = \tfrac{1}{2} \ln \frac{1 - \varepsilon}{\varepsilon}$;
# - new weights $w_i \, e^{-\alpha y_i h_i}$, renormalized to sum to 1.

# %%
def adaboost_round(w, y, h):
    """One AdaBoost reweighting round in the +-1 convention.

    Args:
        w: (n,) nonnegative weights summing to 1.
        y: (n,) true labels in {-1, +1}.
        h: (n,) the weak learner's predictions in {-1, +1}.
    Returns:
        (eps, alpha, w_new): the weighted error (float), the vote weight
        (float), and the (n,) updated normalized weights, per the
        contract above.
    """
    # BEGIN SOLUTION
    eps = float(w[h != y].sum())
    alpha = float(0.5 * np.log((1 - eps) / eps))
    w_new = w * np.exp(-alpha * y * h)
    return eps, alpha, w_new / w_new.sum()
    # END SOLUTION

# %%
# The lesson's ten points, and its two hand-computed rounds as referees.
_pts = np.array([[1, 3], [2, 2], [4, 8], [5, 6], [6, 9],
                 [4, 3], [5, 1], [6, 4], [9, 7], [8, 2]], dtype=float)
_lab = np.array([1, 1, 1, 1, 1, -1, -1, -1, -1, -1], dtype=float)
# Round 1: h1(x) = +1 if x1 < 3. The lesson's table: eps 0.30,
# alpha = 0.5 ln(7/3), misses C, D, E at 1/6, the rest at 1/14.
_h1 = np.where(_pts[:, 0] < 3, 1.0, -1.0)
_e1, _a1, _w1 = adaboost_round(np.full(10, 0.1), _lab, _h1)
assert np.isclose(_e1, 0.3) and np.isclose(_a1, 0.5 * np.log(7 / 3))
assert np.allclose(_w1, [1/14, 1/14, 1/6, 1/6, 1/6, 1/14, 1/14, 1/14, 1/14, 1/14])
# Round 2: h2(x) = +1 if x1 < 7. The table: eps 3/14, alpha = 0.5 ln(11/3),
# F, G, H at 1/6, C, D, E at 7/66, A, B, I, J at 1/22.
_h2 = np.where(_pts[:, 0] < 7, 1.0, -1.0)
_e2, _a2, _w2 = adaboost_round(_w1, _lab, _h2)
assert np.isclose(_e2, 3 / 14) and np.isclose(_a2, 0.5 * np.log(11 / 3))
assert np.allclose(_w2, [1/22, 1/22, 7/66, 7/66, 7/66, 1/6, 1/6, 1/6, 1/22, 1/22])
# The property the lesson proved from the normalizer's closed form: after
# every round, the fresh mistakes hold exactly half the mass.
assert np.isclose(_w2[_h2 != _lab].sum(), 0.5)
print("both hand-computed rounds reproduced, fresh misses hold half the mass")

# %%
# The graded case is round 3 — the round the lesson set as an exercise,
# so its outputs appear nowhere above: round 2's weights entering,
# h3(x) = +1 if x2 > 5.
distill.check("adaboost-round", adaboost_round)

# %% [markdown]
# If stuck: the lesson's convention is the $\pm 1$ one — the vote weight
# carries the $\tfrac{1}{2}$ (the 1997 paper's $\ln(1/\beta_t)$ is twice
# this $\alpha$, a different but equivalent convention), the update is one
# exponential $e^{-\alpha y_i h_i}$ covering both cases, and the division
# by $Z$ is what makes "the fresh misses hold half the mass" come out
# exactly.

# %% [markdown]
# ## 8. Written answer: why small ν wins
#
# Section 4 measured it: $\nu = 0.1$ spent several times the rounds of
# $\nu = 1.0$ and landed at a lower held-out error — with the same stumps
# and the same data, the unshrunk model run well past its optimum while
# $\nu = 0.1$'s minimum was still capped by the round budget. In
# 3–6 sentences in the cell below, explain the mechanism. "Smaller steps
# overfit less" restates the plot; say WHY the sequence of small steps
# ends somewhere better than the sequence of large ones — what each round
# commits to, and what that commitment costs the later rounds.

# %%
distill.submit_review(
    "why-small-nu",
    "Each round commits the model to the single stump that best fits the "
    "current residuals - a greedy choice made from the training data's "
    "noise as much as its signal. At nu = 1 the model absorbs each "
    "stump's full prediction, so the residuals handed to the next round "
    "have that greedy choice subtracted out entirely: early mistakes are "
    "locked in, and later rounds spend their capacity correcting for "
    "them in regions the early stumps already distorted. At nu = 0.1 "
    "only a tenth of each greedy step is taken, so the residuals change "
    "slowly, many subsequent stumps get to vote on the same structure, "
    "and the fitted function is closer to an average over many highly "
    "correlated weak fits than to a chain of committed ones. The model "
    "therefore traces a slower, less greedy path through function space, "
    "and the path passes closer to functions that generalize; the cost "
    "is that reaching a given training fit takes roughly 1/nu times as "
    "many rounds, which is exactly the nu-M trade the curves showed.",
)

# %% [markdown]
# ## 9. Open task: beat the spam benchmark
#
# The corpus is the course's running benchmark: the [UCI Spambase
# data](https://archive.ics.uci.edu/dataset/94/spambase) — 4,601 emails
# collected at Hewlett-Packard Labs in 1999 (Hopkins, Reeber, Forman,
# Suermondt), 57 features counting word and character frequencies plus
# capital-run statistics, 39% spam — the same data whose bagging /
# random-forest / boosting race the ensembles lesson reported.
# `data/spam_train.csv` ships 3,000 labeled rows;
# `data/spam_holdout_X.csv` ships 1,000 unlabeled rows whose labels live
# on the course server.
#
# The task: predict spam *probabilities* for the holdout rows with any
# configuration of the machinery you built — deeper trees by reusing
# `fit_stump` on subsets, Newton leaves, any $\nu$ and $M$, early stopping
# on a validation split you carve yourself. The server scores the
# root-mean-square error between your 1,000 probabilities and the held-out
# labels (`root_brier` above computes the same measure locally) and the
# bar is **0.235** — on the wire the metric is negated so that higher is
# better, so the checkpoint reports $-\text{RMSE}$ against a threshold of
# $-0.235$. Pair every submitted score with the picture
# `plot_validation_curve` below draws before spending an attempt: the
# curve says whether the round you picked is the minimum, and a curve
# still falling at the right edge says the budget, not the model, set
# your score.
#
# Calibration, measured on this data: predicting the base rate 0.39 for
# every row scores about 0.49. Fifty rounds of anything fails, and so
# does $\nu = 0.1$ with a stump budget sized for $\nu = 1$ — the ν–M
# budget arithmetic from section 4 is most of this task. What clears the
# bar is a booster given enough capacity for its learning rate: stumps at
# $\nu = 1.0$ need several hundred rounds; depth-2 trees at $\nu = 0.1$
# with early stopping get there too. Note the contrast with California:
# there $\nu = 1.0$ overfit visibly, here 57 informative features keep
# the additive model underfitting for hundreds of rounds, so full steps
# stay competitive — whether shrinkage helps at a given budget is a
# measurement, not a reflex. A 600-row validation estimate carries a few
# hundredths of noise, so treat a local score within 0.01 of the bar as
# a coin flip. The checkpoint is optional and attempts are limited per
# day — estimate your score on your own split before spending one.

# %%
# Infrastructure (do not modify): the spam data, and a validation split
# for your own protocol - the validation lab's discipline applies: the
# holdout grades a configuration your validation rows chose.
_spam = np.loadtxt("data/spam_train.csv", delimiter=",", skiprows=1)
_Xs_all, _ys_all = _spam[:, :57], _spam[:, 57]
_val = np.zeros(3000, dtype=bool)
_val[np.random.default_rng(9).permutation(3000)[:600]] = True
_Xs_tr, _ys_tr = _Xs_all[~_val], _ys_all[~_val]
_Xs_va, _ys_va = _Xs_all[_val], _ys_all[_val]
_Xs_ho = np.loadtxt("data/spam_holdout_X.csv", delimiter=",", skiprows=1)
print(f"spam: {len(_ys_tr)} train / {len(_ys_va)} validation / "
      f"{len(_Xs_ho)} holdout rows, base rate {_ys_all.mean():.3f}")

# %%
# Infrastructure (do not modify): the open task's picture. Feed it the
# root-Brier of every prefix model on YOUR validation rows and read the
# early-stopping round off the minimum. Draw it before every submission.
def plot_validation_curve(va_err):
    """va_err: sequence, validation root-Brier after 0, 1, ..., M rounds."""
    plot_rounds([(np.arange(len(va_err)), np.asarray(va_err, dtype=float),
                  "validation root-Brier")],
                "root-Brier on your validation split",
                "your booster on spam")

# %%
# Your open cell: train, validate, and produce holdout_probs - a (1000,)
# vector of spam probabilities for the rows of _Xs_ho, in order.
# BEGIN SOLUTION
def _fit_or_leaf(X, r):
    """A stump, or a constant pseudo-stump where no split exists."""
    if len(r) < 2 or (s := fit_stump(X, r)) is None:
        c = float(r.mean()) if len(r) else 0.0
        return (0.0, -np.inf, c, c)
    return s

def fit_tree2(X, r):
    """Depth-2 regression tree: a root stump, then a stump per side."""
    root = _fit_or_leaf(X, r)
    j, t = int(root[0]), root[1]
    left = X[:, j] <= t
    return root, _fit_or_leaf(X[left], r[left]), _fit_or_leaf(X[~left], r[~left])

def predict_tree2(tree, X):
    root, ltree, rtree = tree
    left = X[:, int(root[0])] <= root[1]
    out = np.empty(len(X))
    out[left] = predict_stump(ltree, X[left])
    out[~left] = predict_stump(rtree, X[~left])
    return out

_NU, _M_MAX = 0.1, 600
_ybar = _ys_tr.mean()
_F_tr = np.full(len(_ys_tr), np.log(_ybar / (1 - _ybar)))
_F_va = np.full(len(_ys_va), np.log(_ybar / (1 - _ybar)))
_F_ho = np.full(len(_Xs_ho), np.log(_ybar / (1 - _ybar)))
_F_ho_path = np.empty((_M_MAX + 1, len(_Xs_ho)))
_F_ho_path[0] = _F_ho
_va_err = [root_brier(_ys_va, sigmoid(_F_va))]
for _m in range(_M_MAX):
    _r = deviance_residual(_ys_tr, _F_tr)
    _tree = fit_tree2(_Xs_tr, _r)
    _F_tr = _F_tr + _NU * predict_tree2(_tree, _Xs_tr)
    _F_va = _F_va + _NU * predict_tree2(_tree, _Xs_va)
    _F_ho = _F_ho + _NU * predict_tree2(_tree, _Xs_ho)
    _F_ho_path[_m + 1] = _F_ho
    _va_err.append(root_brier(_ys_va, sigmoid(_F_va)))
_best_m = int(np.argmin(_va_err))
holdout_probs = sigmoid(_F_ho_path[_best_m])
plot_validation_curve(_va_err)
print(f"early stop at round {_best_m}, validation root-Brier {_va_err[_best_m]:.4f}")
# END SOLUTION

# %%
distill.submit_predictions("beat-benchmark", holdout_probs)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — configurations that clear the bar</summary>
#
# Your plain `boost_logit` is enough if you give it the budget its
# learning rate demands: at $\nu = 1.0$ the validation curve is still
# falling after several hundred rounds — run it there. For a stronger
# model, add capacity per round: a depth-2 tree is `fit_stump` on the
# root's residuals, then `fit_stump` again on each side's rows — with one
# degenerate case handled: a side can be a single row, or rows where no
# feature has two distinct values, and `fit_stump` returns None there —
# its contract's no-candidate-threshold case, which section 1's referee
# checked. Catch the None (or guard the call before it, if yours raises
# on the empty candidate set instead) and make
# that side a constant leaf predicting the mean of its residuals. At
# $\nu = 0.1$ with early stopping this tree clears the bar with room to
# spare.
# </details>
#
# <details><summary>Hint 2 — the trap in scoring yourself</summary>
#
# Track the validation error of every prefix (the staged idea) and pick
# the round that minimizes it; then submit the HOLDOUT probabilities from
# that same round. Submitting the final round's probabilities after
# validating an earlier one throws the early stopping away, and a
# validation minimum chosen on the same rows you trained on is the
# wrong-way lesson's blunder.
# </details>
#
# <details><summary>Hint 3 — probabilities, not labels</summary>
#
# The score is a probability error: submit $\sigma(F)$, never hard 0/1
# calls. Thresholding well-calibrated probabilities costs a few
# hundredths of root-Brier at identical ranking quality — from a
# borderline model that is exactly the margin you cannot afford.
# </details>

# %% [markdown]
# The module's algorithms now exist as your code, verified: a stump
# fitter, the least-squares and deviance boosting loops with the ν–M
# trade measured on real data, XGBoost's leaf as a drop-in change to
# yours, and the AdaBoost round the lesson computed by hand, executing.
# Two threads continue: module 9's margin-bounds lesson reuses exactly
# your staged predictions to draw AdaBoost's margin distributions and
# explain the test curve that keeps falling after training error hits
# zero, and the tabular-showdown lesson at the course's end returns to
# boosted trees as the method to beat on tables.

# %%
distill.dump()
