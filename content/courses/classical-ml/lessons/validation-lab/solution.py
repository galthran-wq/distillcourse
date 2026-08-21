# %% [markdown]
# # Lab: a validation harness
#
# Module 5 established the protocols; this lab turns them into code you can
# point at any estimator. You build a small toolkit — `kfold_indices`,
# `cv_score`, `bootstrap_se`, `one_se_pick` — warm it up on a real
# model-selection question (polynomial degree and ridge penalty on the Auto
# data), and then run the module's famous blunder through it three ways:
# a full-data feature screen on pure noise that reports a few percent
# error; the honest screen with a *tuned* screen size, which still
# reports about eight points below the truth; and the fully nested
# harness — selection in an inner loop, measurement in an outer loop that
# took no part in the choice — which reports the truth, 50%. The harness
# is proven honest by watching its own report change.
#
# Ground rules:
#
# - **No sklearn, no scipy** — every protocol below is your numpy end to
#   end. (Checking against sklearn on your own machine is fine; the graded
#   work is yours.)
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go. The seven
#   exact checkpoints are the required set; the open task and the written
#   answer at the end are optional — partial completion is a normal way to
#   finish.
# - Everything is seeded and the checkers verify the exact contract stated
#   in each docstring, so "deterministic under a seed" is not a stylistic
#   preference here: a protocol you cannot rerun is not a protocol.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/validation-lab")

# %%
# Infrastructure (do not modify): error measures and a plot helper, complete.
# `err` callables all have the same shape — err(y_true, y_pred) -> scalar —
# which is what lets one harness score every estimator in this course; your
# AUC from the logistic-regression lab plugs into the same slot as
# 1 - roc_auc(y, scores) unchanged.
def mse(y_true, y_pred):
    """Mean squared error of predictions on one fold."""
    return float(np.mean((y_true - y_pred) ** 2))

def err_rate(y_true, y_pred):
    """Misclassification rate of hard label predictions on one fold."""
    return float(np.mean(y_true != y_pred))

def plot_cv_curve(xs, mean, se=None, xlabel="", title="", logx=False):
    if se is None:
        plt.plot(xs, mean, marker="o", ms=3)
    else:
        plt.errorbar(xs, mean, yerr=se, capsize=2)
    if logx:
        plt.xscale("log")
        plt.gca().invert_xaxis()
    plt.xlabel(xlabel)
    plt.ylabel("CV mean squared error")
    plt.title(title)
    plt.show()

# %% [markdown]
# ## 1. Fold assignment — who trains, who grades
#
# Every protocol in this lab starts by deciding, row by row, who trains and
# who grades, and the resampling lesson's requirements for that decision
# are three. Every row validates exactly once — that is what makes the $k$
# fold errors add up to one pass over the data. Each fold keeps the class
# balance of the whole: the imbalance lesson's degenerate case is a fold
# that drew no positives, on which an error rate grades nothing and a
# ranking metric is undefined. And the assignment is a pure function of a
# seed, because the wrong-way lesson's standard applies to you now: a
# reproduction is worth exactly as much as its protocol statement.
#
# The contract, which the checker verifies exactly:
#
# - `rng = np.random.default_rng(seed)`, created once;
# - for each class value in `np.unique(y)` order: shuffle that class's row
#   positions with `rng.permutation`, then deal them round-robin — the
#   $j$-th shuffled row of the class goes to fold $j \bmod k$.
#
# Round-robin dealing is what spreads each class's remainder one per fold;
# any block-based split piles the leftovers somewhere.

# %%
def kfold_indices(y, k, seed):
    """Deterministic stratified k-fold assignment.

    Args:
        y: (n,) class labels; np.unique(y) fixes the class order. A constant
            y (all one value) degenerates to plain shuffled k-fold — the lab
            uses that for regression targets.
        k: number of folds.
        seed: for np.random.default_rng.
    Returns:
        (n,) integer array with values in {0, ..., k-1}: entry i is the fold
        on which row i is validated. Built per the contract above.
    """
    # BEGIN SOLUTION
    rng = np.random.default_rng(seed)
    folds = np.empty(len(y), dtype=np.int64)
    for c in np.unique(y):
        rows = np.flatnonzero(y == c)
        perm = rng.permutation(rows)
        folds[perm] = np.arange(len(perm)) % k
    return folds
    # END SOLUTION

# %%
# Local referees before submitting: the three requirements, as asserts.
_y = np.repeat([0.0, 1.0], [21, 9])
_f = kfold_indices(_y, 5, 0)
assert _f.shape == (30,) and set(np.unique(_f)) <= set(range(5))
# Every row validates exactly once, and each CLASS spreads evenly: the 21
# negatives deal 5-4-4-4-4, the 9 positives 2-2-2-2-1, never 4-0-...
assert np.bincount(_f, minlength=5).sum() == 30
assert np.ptp(np.bincount(_f[_y == 0.0], minlength=5)) <= 1
assert np.ptp(np.bincount(_f[_y == 1.0], minlength=5)) <= 1
# A protocol, not a dice roll: same seed, same folds; new seed, new folds.
assert np.array_equal(_f, kfold_indices(_y, 5, 0))
assert not np.array_equal(_f, kfold_indices(_y, 5, 1))

# %%
distill.check("kfold-indices", kfold_indices)

# %% [markdown]
# ## 2. One scorer for every estimator
#
# With the folds decided, the harness needs its central design decision:
# what a "model" is to the scorer. The answer is a *fit-callable* —
# `fit_fn(X_train, y_train)` returns a `predict` function — and the scorer
# hands it nothing but the training rows. That one signature is the whole
# leak-proofing: whatever happens inside `fit_fn` — scaling, feature
# screening, hyperparameter tuning — happens on the rows the fold
# discipline allows, because those are the only rows the callable ever
# receives. The features lesson stated the law ("every fitted step runs
# inside the fold"); this API makes following it the path of least
# resistance, which is the property section 6 will cash in.
#
# The estimate itself is the resampling lesson's:
#
# $$\operatorname{CV}_k = \frac{1}{k} \sum_{f=1}^{k} \operatorname{err}_f,$$
#
# but return the vector of the $k$ per-fold errors rather than its mean:
# the mean is the report, and the scatter across folds is the error bar
# that section 4's selection rule runs on.

# %%
def cv_score(fit_fn, X, y, folds, err):
    """Per-fold validation errors of a fit-callable.

    Args:
        fit_fn: fit_fn(X_train, y_train) -> predict, where predict(X_val)
            returns predictions for the rows of X_val.
        X: (n, d) predictors; y: (n,) target.
        folds: (n,) fold ids from kfold_indices; k = folds.max() + 1.
        err: err(y_true, y_pred) -> scalar, the error on one fold.
    Returns:
        (k,) array: entry f is err on the rows of fold f, for a model
        fitted on all other rows. Fold order 0..k-1.
    """
    # BEGIN SOLUTION
    k = int(folds.max()) + 1
    out = np.empty(k)
    for f in range(k):
        tr, va = folds != f, folds == f
        predict = fit_fn(X[tr], y[tr])
        out[f] = err(y[va], predict(X[va]))
    return out
    # END SOLUTION

# %%
distill.check("cv-score", cv_score)

# %% [markdown]
# ### The referee: LOOCV against its closed form
#
# The warm dataset is [ISLP's Auto data](https://www.statlearning.com/):
# 392 cars from the 1970s and early 80s, fuel economy `mpg` against engine
# `horsepower` and six other measurements, the running example of the
# resampling lesson (G. James et al., *An Introduction to Statistical
# Learning with Applications in Python*, Springer 2023, §5.1; the 397-row
# source drops 5 cars with missing horsepower). `data/auto.csv` ships the
# 392 complete rows.
#
# The resampling lesson proved that for a least-squares fit, leave-one-out
# CV needs no refitting at all: $\operatorname{CV}_n = \frac{1}{n} \sum_i
# \left[ r_i / (1 - h_{ii}) \right]^2$, with $r_i$ the residuals and
# $h_{ii}$ the leverages of the single full-data fit. That identity is a
# free referee for `cv_score`: run it with $n$ folds of one row each and it
# must reproduce the closed form to floating-point noise — on this data,
# the lesson's own 24.23.

# %%
# Infrastructure (do not modify): load Auto, fit-callable factory for
# polynomial (ridge) regression in one predictor. Powers are standardized
# on the training rows inside the callable — the convention of the
# regularization lab, now enforced by the harness's signature.
auto = np.loadtxt("data/auto.csv", delimiter=",", skiprows=1)
mpg, horsepower = auto[:, 0], auto[:, 3]
n_auto = len(mpg)
print(f"Auto: {auto.shape[0]} cars, mpg mean {mpg.mean():.1f}, "
      f"horsepower {horsepower.min():.0f}-{horsepower.max():.0f}")

def make_poly_fit(degree, lam=0.0):
    """Fit-callable: degree-d polynomial regression in one predictor,
    ridge-penalized with lam (lam=0.0 is plain least squares)."""
    def fit(Xtr, ytr):
        x = Xtr.ravel()
        xm, xs = x.mean(), x.std()
        def design(v):
            z = (np.asarray(v).ravel() - xm) / xs
            return np.column_stack([z ** d for d in range(1, degree + 1)])
        P = design(x)
        mu, sd = P.mean(0), P.std(0)
        Z = (P - mu) / sd
        ybar = ytr.mean()
        # Ridge as an augmented least-squares problem: one numerically
        # stable code path for every lam, including 0.
        A = np.vstack([Z, np.sqrt(lam) * np.eye(degree)])
        b = np.concatenate([ytr - ybar, np.zeros(degree)])
        coef = np.linalg.lstsq(A, b, rcond=None)[0]
        return lambda Xv: (design(Xv) - mu) / sd @ coef + ybar
    return fit

# %%
# The closed-form referee. folds = arange(n) is LOOCV: n folds of one row.
_X1 = horsepower[:, None]
_loo = cv_score(make_poly_fit(1), _X1, mpg, np.arange(n_auto), mse)
_G = np.column_stack([np.ones(n_auto), horsepower])
_h = np.einsum("ij,ji->i", _G, np.linalg.solve(_G.T @ _G, _G.T))
_r = mpg - _G @ np.linalg.lstsq(_G, mpg, rcond=None)[0]
_shortcut = np.mean((_r / (1 - _h)) ** 2)
print(f"LOOCV by your harness: {_loo.mean():.4f}   closed form: {_shortcut:.4f}")
assert abs(_loo.mean() - _shortcut) < 1e-6

# %% [markdown]
# ### The degree question, answered by the harness
#
# The resampling lesson's Auto verdict — the quadratic term is essential,
# the cubic buys nothing — came from a CV curve computed for the lesson.
# Reproduce it with your own machinery: 10-fold CV over polynomial degrees
# 1–10, folds from your `kfold_indices` (a constant label vector gives
# plain shuffled folds), models from the provided factory. The asserts are
# the lesson's own agreement criterion: the curve drops by more than 4 MSE
# from degree 1 to 2 and moves by less than 0.5 from degree 2 to 3.

# %%
# Infrastructure (do not modify): the degree curve, drawn by your cv_score.
_folds10 = kfold_indices(np.zeros(n_auto), 10, 1)
_degrees = np.arange(1, 11)
_curve = np.array([cv_score(make_poly_fit(d), _X1, mpg, _folds10, mse).mean()
                   for d in _degrees])
plot_cv_curve(_degrees, _curve, xlabel="polynomial degree",
              title="mpg ~ poly(horsepower): 10-fold CV by your harness")
print({int(d): float(round(c, 2)) for d, c in zip(_degrees, _curve)})
assert _curve[0] - _curve[1] > 4.0, "degree 2 must beat degree 1 by > 4 MSE"
assert abs(_curve[1] - _curve[2]) < 0.5, "the cubic term buys ~nothing"

# %% [markdown]
# ## 3. The bootstrap standard error
#
# The harness can now estimate a model's error; it cannot yet say how far
# any estimate is from the truth. The bootstrap is the module's
# general-purpose answer for statistics: resample the data with
# replacement, recompute the statistic on each replicate, and read the
# spread. With $\hat\theta^{*1}, \dots, \hat\theta^{*B}$ the replicate
# statistics and $\bar\theta^*$ their mean,
#
# $$\widehat{\operatorname{SE}}_B
#   = \sqrt{\frac{1}{B-1} \sum_{b=1}^{B}
#     \left( \hat\theta^{*b} - \bar\theta^* \right)^2}.$$
#
# The contract, which the checker verifies exactly:
# `rng = np.random.default_rng(seed)`, created once; replicate $b$ draws
# `idx = rng.integers(0, n, size=n)` — $n$ rows *with* replacement — for
# $b = 0, \dots, B-1$ in order.

# %%
def bootstrap_se(x, stat, B, seed):
    """Bootstrap standard error of a statistic.

    Args:
        x: (n,) sample.
        stat: callable, stat(sample) -> scalar (e.g. np.mean, np.median).
        B: number of bootstrap replicates.
        seed: for np.random.default_rng.
    Returns:
        scalar: the ddof=1 standard deviation of the B replicate
        statistics, drawn per the contract above.
    """
    # BEGIN SOLUTION
    rng = np.random.default_rng(seed)
    n = len(x)
    stats = np.array([stat(x[rng.integers(0, n, size=n)]) for _ in range(B)])
    return float(stats.std(ddof=1))
    # END SOLUTION

# %%
# Local referees. The mean is the one statistic with a textbook SE to
# check against: s/sqrt(n) — the bootstrap should land within a few
# percent of it (slightly below on average: resampling uses the ddof=0
# plug-in of the variance).
_se_boot = bootstrap_se(mpg, np.mean, 1000, 1)
_se_formula = mpg.std(ddof=1) / np.sqrt(n_auto)
print(f"SE of mean(mpg): bootstrap {_se_boot:.4f} vs formula {_se_formula:.4f}")
assert abs(_se_boot - _se_formula) < 0.02
# The 63.2% arithmetic, measured: a resample of size n leaves out each row
# with probability (1 - 1/n)^n -> 1/e, so about 63.2% of distinct rows are
# in each bag. This overlap is why the resampling lesson refused the naive
# bootstrap as an error estimator.
_rng = np.random.default_rng(0)
_frac = np.mean([len(np.unique(_rng.integers(0, n_auto, n_auto))) / n_auto
                 for _ in range(200)])
print(f"mean in-bag fraction: {_frac:.4f} (1 - 1/e = {1 - 1/np.e:.4f})")
assert abs(_frac - (1 - 1 / np.e)) < 0.01
# The payoff case: the median's SE has no clean formula, and the bootstrap
# does not care.
print(f"SE of median(mpg): bootstrap {bootstrap_se(mpg, np.median, 1000, 7):.4f}")

# %%
distill.check("bootstrap-se", bootstrap_se)

# %% [markdown]
# ## 4. Selection with error bars: the one-SE rule
#
# Sections 1–3 built measurement; selection is where measurement gets
# spent, and the resampling lesson's warning applies: the CV curve is an
# estimate, so the location of its minimum is partly noise, and the literal
# argmin rewards whichever setting drew the luckiest folds — with
# complexity as the prize. The scatter your `cv_score` returns supplies
# the scale for "indistinguishable": the standard error of a CV mean over
# $k$ folds is the fold errors' standard deviation over $\sqrt{k}$. The
# **one-standard-error rule**: among all settings whose CV mean lies within
# one standard error of the minimum — one band, anchored at the minimum —
# take the simplest.
#
# Orientation matters and the checker enforces it: the table below arrives
# with columns ordered simplest first, so "the simplest setting in the
# band" is the smallest column index that clears it.

# %%
def one_se_pick(fold_errors):
    """The one-standard-error selection from a per-fold error table.

    Args:
        fold_errors: (k, L) array; fold_errors[f, j] is fold f's validation
            error at setting j. Columns ordered simplest (j=0) to most
            complex (j=L-1).
    Returns:
        (mean, se, i_min, i_pick):
        mean: (L,) column means.
        se: (L,) columnwise standard error, std(ddof=1) / sqrt(k).
        i_min: int, argmin of mean.
        i_pick: int, the SMALLEST j with mean[j] <= mean[i_min] + se[i_min].
    """
    # BEGIN SOLUTION
    k = fold_errors.shape[0]
    mean = fold_errors.mean(0)
    se = fold_errors.std(0, ddof=1) / np.sqrt(k)
    i_min = int(np.argmin(mean))
    i_pick = int(np.flatnonzero(mean <= mean[i_min] + se[i_min])[0])
    return mean, se, i_min, i_pick
    # END SOLUTION

# %%
distill.check("one-se-rule", one_se_pick)

# %% [markdown]
# ### Ridge on Auto, tuned by the rule
#
# Composition: the degree-10 polynomial from section 2, now
# ridge-penalized, with $\lambda$ chosen by your rule. The grid runs from
# heavy shrinkage (left, simple: the fit approaches a constant) to nearly
# none (right, complex: the full degree-10 wiggle room). Everything below
# is your machinery — folds, per-fold errors, the pick.

# %%
# Infrastructure (do not modify): the lambda grid and the tuning table.
_lams = np.logspace(5, -3, 17)          # decreasing: simplest -> most complex
_tbl = np.column_stack([
    cv_score(make_poly_fit(10, lam), _X1, mpg, _folds10, mse) for lam in _lams
])
_mean, _se, _i_min, _i_pick = one_se_pick(_tbl)
plot_cv_curve(_lams, _mean, _se, xlabel="lambda (log scale, shrinking ->)",
              title="ridge poly-10 on Auto: CV with one-SE bars", logx=True)
print(f"argmin: lambda = {_lams[_i_min]:.4g} at CV {_mean[_i_min]:.2f} "
      f"+/- {_se[_i_min]:.2f}")
print(f"one-SE pick: lambda = {_lams[_i_pick]:.4g} at CV {_mean[_i_pick]:.2f}")
assert _i_pick <= _i_min
assert _mean[_i_pick] <= _mean[_i_min] + _se[_i_min]

# %% [markdown]
# The printout is the rule doing its job: the minimum sits in the flat
# noisy tail at nearly zero penalty, and the rule walks three orders of
# magnitude of $\lambda$ back toward simplicity while giving up less than
# one error bar of estimated accuracy — the resampling lesson's trade,
# executed by your own code.
#
# The harness is now complete: folds, a scorer that quarantines fitting,
# error bars, and a selection rule. What remains is the acceptance test.

# %% [markdown]
# ## 5. The famous blunder, through your own harness
#
# The referee problem, from ESL §7.10.2 as the wrong-way lesson reproduced
# it: $N = 50$ samples in two classes of 25, and $p = 5{,}000$ features of
# pure standard Gaussian noise, drawn without reference to the labels.
# Independence makes every classifier's true error exactly 50%, so any
# protocol reporting materially less is measuring its own leak, in
# percentage points, with the sign known in advance.
#
# The recipe under test is the genomics-scale "typical strategy": screen
# the features, keep the strongest, cross-validate a classifier on the
# survivors. Done in the wrong order — screen first, on all 50 rows, then
# CV — it reported 3% in ESL and about 5% in the lesson's reproduction.
# Implement exactly that wrong order, with your own folds and scorer.
#
# The contract, which the checker verifies exactly: score every column by
# its Pearson correlation with $y$ computed on ALL $n$ rows,
#
# $$r_j = \frac{\sum_i (x_{ij} - \bar{x}_j)(y_i - \bar{y})}
#   {\sqrt{\sum_i (x_{ij} - \bar{x}_j)^2}\sqrt{\sum_i (y_i - \bar{y})^2}},$$
#
# keep the `n_keep` columns with the *largest signed* $r_j$ (the lesson's
# protocol), then run 5-fold CV of the provided 1-NN on the kept columns,
# with `folds = kfold_indices(y, k, seed)` and the provided `err_rate`.

# %%
# Infrastructure (do not modify): the classifier. 1-NN is chosen
# deliberately — the nearest-neighbor lesson's memorizer converts
# contamination into agreement faster than any other model.
def fit_1nn(Xtr, ytr):
    """Fit-callable: 1-nearest-neighbor under Euclidean distance."""
    def predict(Xv):
        d2 = ((Xv[:, None, :] - Xtr[None, :, :]) ** 2).sum(-1)
        return ytr[np.argmin(d2, axis=1)]
    return predict

# %%
def screen_then_cv(X, y, n_keep, k, seed):
    """The WRONG pipeline: screen on all rows, then cross-validate.

    Args:
        X: (n, p) features; y: (n,) labels in {-1.0, +1.0}.
        n_keep: number of columns the screen keeps.
        k: number of folds; seed: passed to YOUR kfold_indices.
    Returns:
        scalar: the mean over folds of the 1-NN error rate, per the
        contract above. Use YOUR kfold_indices and cv_score, and the
        provided fit_1nn and err_rate.
    """
    # BEGIN SOLUTION
    Xc = X - X.mean(0)
    yc = y - y.mean()
    r = (Xc.T @ yc) / (np.sqrt((Xc ** 2).sum(0)) * np.sqrt((yc ** 2).sum()))
    kept = np.argsort(r)[-n_keep:]
    folds = kfold_indices(y, k, seed)
    return float(cv_score(fit_1nn, X[:, kept], y, folds, err_rate).mean())
    # END SOLUTION

# %%
distill.check("screen-then-cv", screen_then_cv)

# %%
# The bogus number, on this notebook's own draw of the referee problem.
def noise_problem(seed):
    """N=50, p=5000, labels fixed first-25 positive — the ESL construction."""
    rng = np.random.default_rng(seed)
    return rng.normal(size=(50, 5000)), np.repeat([1.0, -1.0], 25)

_Xn, _yn = noise_problem(5)
_wrong_report = screen_then_cv(_Xn, _yn, 100, 5, 5)
print(f"true error 50% — the wrong-way pipeline reports: {_wrong_report:.1%}")
assert _wrong_report < 0.12, "the leak should look spectacular, not mild"

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Three stages, two of which already exist. Score all 5,000 columns in
# one vectorized shot — center `X` columnwise and `y`, then one matrix
# product `Xc.T @ yc` gives every numerator and the two norms are
# columnwise sums; no Python loop over columns. Keep the top `n_keep`,
# take `folds = kfold_indices(y, k, seed)` from YOUR assigner, and hand
# `X[:, kept]` to YOUR `cv_score` with the provided `fit_1nn` and
# `err_rate`. Return the mean over folds as a float.
# </details>
#
# <details><summary>Hint 2 — the argsort direction</summary>
#
# `np.argsort` ascends, so `[:n_keep]` keeps the hundred most
# ANTI-correlated columns. The largest *signed* correlations sit at the
# END of the order: `np.argsort(r)[-n_keep:]`, with no absolute value —
# the contract is the lesson's protocol, signed $r$.
# </details>
#
# <details><summary>Hint 3 — pseudocode</summary>
#
# ```
# Xc, yc <- X - column_means(X), y - mean(y)
# r      <- (Xc.T @ yc) / (column_norms(Xc) * norm(yc))
# kept   <- argsort(r)[-n_keep:]
# folds  <- kfold_indices(y, k, seed)
# return mean of cv_score(fit_1nn, X[:, kept], y, folds, err_rate)
# ```
# </details>

# %% [markdown]
# Every fold was disjoint and the classifier was refit five times, yet the
# report is fiction: the screen read all fifty labels before the folds
# existed, so each held-out fold grades features selected partly for
# agreeing with it. Fold hygiene inspects the split; this leak does not
# live in the split.

# %% [markdown]
# ## 6. The fix is a position, not a technique
#
# ESL's corrected recipe changes no component — only the order: folds
# first, then screen *inside* each fold, on its training rows alone. In
# your harness that is not a new protocol but a one-sentence relocation:
# make screening part of the fit. Build the screened fit as a *factory*,
# `make_screened_fit(n_keep)`: it returns a fit-callable that screens the
# training rows it is handed, fits 1-NN on the survivors, and remembers
# which columns to select at prediction time. Write the factory once —
# section 8 hands the same factory to an inner selection loop — then pass
# its output to your `cv_score` unchanged. The scorer's signature does
# the discipline for you: a fit-callable cannot leak rows it was never
# given.

# %%
def make_screened_fit(n_keep):
    """Fit-callable factory: screen inside the fit, 1-NN on the survivors.

    Args:
        n_keep: number of columns the screen keeps.
    Returns:
        fit_fn(Xtr, ytr) -> predict. Inside: the screening statistic of
        screen_then_cv (largest signed Pearson r), computed on Xtr and
        ytr ALONE; the provided fit_1nn fitted on the kept columns of
        Xtr; and a predict function that selects the SAME kept columns
        of its full-width argument before calling the 1-NN predictor.
    """
    # BEGIN SOLUTION
    def fit(Xtr, ytr):
        Xc = Xtr - Xtr.mean(0)
        yc = ytr - ytr.mean()
        r = (Xc.T @ yc) / (np.sqrt((Xc ** 2).sum(0)) * np.sqrt((yc ** 2).sum()))
        kept = np.argsort(r)[-n_keep:]
        predict = fit_1nn(Xtr[:, kept], ytr)
        return lambda Xv: predict(Xv[:, kept])
    return fit
    # END SOLUTION

# %%
def screen_within_cv(X, y, n_keep, k, seed):
    """The RIGHT pipeline: the screen runs inside each fold.

    Same arguments, screening statistic, classifier, folds, and error
    measure as screen_then_cv — with the one change that the screen runs
    inside the fit-callable from YOUR make_screened_fit, scored by YOUR
    cv_score on folds from YOUR kfold_indices.
    Returns:
        scalar: the mean over folds of the 1-NN error rate.
    """
    # BEGIN SOLUTION
    folds = kfold_indices(y, k, seed)
    return float(cv_score(make_screened_fit(n_keep), X, y, folds, err_rate).mean())
    # END SOLUTION

# %%
distill.check("screen-within-cv", screen_within_cv)

# %%
# The same data, the same screen, the same classifier, the same folds —
# one step moved across the fold boundary.
_right_report = screen_within_cv(_Xn, _yn, 100, 5, 5)
print(f"screen outside the folds: {_wrong_report:.1%}   "
      f"screen inside each fold: {_right_report:.1%}")
assert 0.3 < _right_report < 0.7, "honest CV on pure noise reads ~50%"

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Do not write a new CV loop. Write only the factory: inside its
# `fit(Xtr, ytr)`, screen on `Xtr, ytr` exactly as in `screen_then_cv`
# (same correlation, same signed top-`n_keep`), fit the provided
# `fit_1nn` on the kept columns of `Xtr`, and return a predict function.
# `screen_within_cv` is then two lines: your folds, your `cv_score` on
# `make_screened_fit(n_keep)` with the full `X`.
# </details>
#
# <details><summary>Hint 2 — the prediction-time trap</summary>
#
# The kept column indices are part of the fitted model. The predict
# function you return receives the *full-width* validation rows and must
# select the same columns before calling the 1-NN predictor:
# `lambda Xv: predict(Xv[:, kept])`. Forgetting the selection makes the
# shapes disagree — a loud failure; selecting with a *recomputed* kept set
# would be a quiet one.
# </details>
#
# <details><summary>Hint 3 — pseudocode</summary>
#
# ```
# def make_screened_fit(n_keep):
#     def fit(Xtr, ytr):
#         r    <- correlations of Xtr's columns with ytr   # training rows only
#         kept <- argsort(r)[-n_keep:]
#         p    <- fit_1nn(Xtr[:, kept], ytr)
#         return (Xv -> p(Xv[:, kept]))
#     return fit
# def screen_within_cv(X, y, n_keep, k, seed):
#     folds <- kfold_indices(y, k, seed)
#     return mean of cv_score(make_screened_fit(n_keep), X, y, folds, err_rate)
# ```
# </details>

# %% [markdown]
# ## 7. The screen is honest; the tuning is not
#
# `n_keep = 100` was handed to you. In practice nobody knows the right
# screen size, so the routine move is to tune it: run the honest pipeline
# at every size on a grid and report the winner. Each fixed size now
# yields a roughly unbiased estimate — and the reported minimum is still
# biased, because the minimum of five noisy unbiased numbers sits below
# the truth: picking the winner picks its luck. It is the wrong way one
# level up, with the grid as the feature pool — five candidates instead
# of five thousand, hence points of optimism instead of tens. The
# wrong-way lesson measured the shortcut at 45.8% ± 1.3 over twenty
# repetitions of this problem; the ten-seed study you run in section 9
# lands at 42.0% ± 1.8 through this same pipeline. The two figures sit
# under two combined standard errors apart — the same finding at both
# studies' resolution: a few points of optimism, bought by reporting the
# winner. The cell below shows it on this notebook's draw, through your
# own honest pipeline.

# %%
# Infrastructure (do not modify): the leak picture, and the tuning
# shortcut on one seed. plot_reports is the lab's second plot helper —
# error reports against the 50% truth line; section 9's acceptance test
# reads its three protocols off the same axes.
def plot_reports(series, xlabel, title, logx=False):
    """Error reports against the truth. series: (x, y, marker, color,
    label) tuples, each drawn as one scatter; the black line is 0.5."""
    for x, y, marker, color, label in series:
        plt.scatter(x, y, marker=marker, color=color, label=label)
    plt.axhline(0.5, color="k", lw=0.5)
    if logx:
        plt.xscale("log")
    plt.ylim(-0.02, 0.75)
    plt.xlabel(xlabel)
    plt.ylabel("5-fold CV error report")
    plt.title(title)
    plt.legend(loc="center right")
    plt.show()

GRID = [10, 25, 50, 100, 200]
_honest_means = np.array([screen_within_cv(_Xn, _yn, nk, 5, 5) for nk in GRID])
plot_reports(
    [([100], [_wrong_report], "x", "tab:red", "screen outside the folds"),
     (GRID, _honest_means, "o", "tab:blue", "screen inside each fold")],
    xlabel="screen size n_keep",
    title="one draw, every screen size — true error 0.5", logx=True,
)
print({nk: float(round(m, 3)) for nk, m in zip(GRID, _honest_means)})
print(f"every size honest — the reported winner: {_honest_means.min():.1%}")
assert np.all((_honest_means > 0.3) & (_honest_means < 0.7))
assert _honest_means.min() < 0.5, "the winner's score sits below the truth"

# %% [markdown]
# The picture is what wrong looks like: the red cross is a report hugging
# zero on a problem whose truth is the black line, while every honest
# report straddles the line — and the lowest dot dips below it, which is
# the shortcut in miniature. Selection has consumed the folds' verdict:
# the winner was chosen *for* scoring well, so its score may not be
# reported as the error estimate. Fold hygiene cannot see this either —
# every individual run above was honest.

# %% [markdown]
# ## 8. Nested cross-validation: the outer loop never voted
#
# The repair is the one you already built, applied one level up.
# Screening leaked until it moved inside the fold; selection leaks until
# it moves inside the fold too. For each outer fold, run a complete inner
# cross-validation on that fold's training rows alone — your `cv_score`
# over the grid, your `one_se_pick` for the choice (the grid is ordered
# simplest first, so the rule's tie-break toward simplicity applies) —
# then fit the chosen size on those training rows and let the outer fold
# grade a choice it never took part in.
#
# The contract, which the checker verifies exactly:
#
# - outer folds: `kfold_indices(y, k, seed)`;
# - for outer fold $f$, with training rows `tr`: inner folds =
#   `kfold_indices(y[tr], k, seed)` — a fresh assignment of the 40
#   training rows, same `k`, same `seed`;
# - the inner table: column $j$ holds `cv_score` of
#   `make_screened_fit(grid[j])` on `(X[tr], y[tr])` under the inner
#   folds, with `err_rate`;
# - the pick: `grid[i_pick]` from YOUR `one_se_pick` on that table;
# - outer error $f$: fit `make_screened_fit(pick)` on the training rows,
#   score `err_rate` on fold $f$'s rows.

# %%
def nested_cv(X, y, grid, k, seed):
    """Fully nested selection and evaluation of the screened 1-NN.

    Args:
        X: (n, p) features; y: (n,) labels in {-1.0, +1.0}.
        grid: candidate screen sizes, ordered simplest (smallest) first.
        k: number of folds at BOTH levels.
        seed: fold seed at both levels, per the contract above.
    Returns:
        (errors, picks):
        errors: (k,) outer per-fold error rates; entry f grades a screen
            size chosen without fold f's rows.
        picks: (k,) the n_keep chosen by fold f's inner CV, as floats.
    """
    # BEGIN SOLUTION
    outer = kfold_indices(y, k, seed)
    errors = np.empty(k)
    picks = np.empty(k)
    for f in range(k):
        tr, va = outer != f, outer == f
        inner = kfold_indices(y[tr], k, seed)
        table = np.column_stack([
            cv_score(make_screened_fit(nk), X[tr], y[tr], inner, err_rate)
            for nk in grid
        ])
        _, _, _, i_pick = one_se_pick(table)
        picks[f] = grid[i_pick]
        predict = make_screened_fit(int(grid[i_pick]))(X[tr], y[tr])
        errors[f] = err_rate(y[va], predict(X[va]))
    return errors, picks
    # END SOLUTION

# %%
# Local referee: the three reports side by side on this notebook's draw.
_nested_errors, _picks = nested_cv(_Xn, _yn, GRID, 5, 5)
print(f"wrong way {_wrong_report:.1%}   tuned shortcut {_honest_means.min():.1%}   "
      f"nested {_nested_errors.mean():.1%}   picks {_picks.astype(int)}")
assert 0.3 < _nested_errors.mean() < 0.7, "the nested report straddles the truth"

# %%
distill.check("nested-cv", nested_cv)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# One outer loop over `f`. Inside it, everything already exists:
# `kfold_indices` for the inner assignment, `np.column_stack` of
# `cv_score` calls over the grid for the inner table, `one_se_pick` for
# the choice. The only new code is the last two lines — fit the chosen
# size on the training rows, score the outer fold.
# </details>
#
# <details><summary>Hint 2 — the two assignments</summary>
#
# Both levels use the same `seed`, but on different row sets: the inner
# assignment is `kfold_indices(y[tr], k, seed)` — the 40 training rows
# dealt fresh. Reusing the outer assignment's entries for the training
# rows is a different protocol, and the checker will say no.
# </details>
#
# <details><summary>Hint 3 — pseudocode</summary>
#
# ```
# outer <- kfold_indices(y, k, seed)
# for f in 0..k-1:
#     tr, va <- outer != f, outer == f
#     inner  <- kfold_indices(y[tr], k, seed)
#     table  <- column_stack(cv_score(make_screened_fit(g), X[tr], y[tr],
#                                     inner, err_rate) for g in grid)
#     pick   <- grid[one_se_pick(table).i_pick]
#     p      <- make_screened_fit(pick)(X[tr], y[tr])
#     errors[f], picks[f] <- err_rate(y[va], p(X[va])), pick
# return errors, picks
# ```
# </details>

# %% [markdown]
# ## 9. Open task: the acceptance test, three protocols by ten seeds
#
# One seed is an anecdote. Run the full acceptance test: for seeds
# $0, 1, \dots, 9$, build the referee problem with `noise_problem(seed)`
# and compute three reports, always with the same `seed` for the folds —
#
# - **wrong way**: `screen_then_cv` at `n_keep=100`;
# - **tuned shortcut**: the *minimum* over `GRID` of `screen_within_cv`
#   — the minimum itself, deliberately: the shortcut under test reports
#   the winner's score, not a one-SE pick;
# - **nested**: the mean of the outer errors from
#   `nested_cv(Xs, ys, GRID, 5, seed)`.
#
# Collect three `(10,)` arrays in seed order and look at them with the
# provided plot. Then put an error bar on the headline number: the
# leakage gap $\text{gap}_s = \text{nested}_s - \text{wrong}_s$,
# summarized as its mean with a bootstrap standard error from YOUR
# `bootstrap_se` (`stat=np.mean`, `B=1000`, `seed=0`). Report the tuning
# shortcut's cost the same way: nested minus tuned, mean ± SE. The
# acceptance criterion, stated in advance: the mean gap lands within two
# of its standard errors of $0.45$, and the shortcut's cost is positive —
# reporting the winner bought a few points that were never real.
#
# Submit the thirty reports as one vector,
# `np.concatenate([wrong_reports, tuned_reports, nested_reports])`. The
# server scores it by RMSE against the reference study's own thirty
# reports, computed at build time and never published; the bar is an RMSE
# of $0.02$ — one resolution step of a 5-fold error rate on 50 rows. A
# correct study clears it by reproducing the reference report for report,
# and shortcuts fail on scatter: the per-seed reports vary by more than
# the bar, so submitting each protocol's typical value for all ten seeds
# misses, and a leak in any one protocol moves its ten numbers by whole
# points. This checkpoint is optional and attempts are limited per day;
# read the plot before spending one.

# %%
# Infrastructure (do not modify): the acceptance-test picture — run after
# computing wrong_reports / tuned_reports / nested_reports as (10,) arrays.
def plot_three_reports(wrong_reports, tuned_reports, nested_reports):
    seeds = np.arange(len(wrong_reports))
    plot_reports(
        [(seeds, wrong_reports, "x", "tab:red", "screen outside the folds"),
         (seeds, tuned_reports, "^", "tab:orange",
          "honest screen, tuned size (min over grid)"),
         (seeds, nested_reports, "o", "tab:blue",
          "nested: selection inside, measurement outside")],
        xlabel="seed",
        title="one experiment, three protocols — true error 0.5",
    )

# %%
# BEGIN SOLUTION
wrong_reports = np.empty(10)
tuned_reports = np.empty(10)
nested_reports = np.empty(10)
for s in range(10):
    Xs, ys = noise_problem(s)
    wrong_reports[s] = screen_then_cv(Xs, ys, 100, 5, s)
    tuned_reports[s] = min(screen_within_cv(Xs, ys, nk, 5, s) for nk in GRID)
    nested_reports[s] = nested_cv(Xs, ys, GRID, 5, s)[0].mean()
plot_three_reports(wrong_reports, tuned_reports, nested_reports)
gaps = nested_reports - wrong_reports
se_gap = bootstrap_se(gaps, np.mean, 1000, 0)
cost = nested_reports - tuned_reports
se_cost = bootstrap_se(cost, np.mean, 1000, 0)
print(f"leakage gap: {gaps.mean():.3f} ± {se_gap:.3f}")
print(f"cost of reporting the tuning winner: {cost.mean():.3f} ± {se_cost:.3f}")
assert abs(gaps.mean() - 0.45) < 2 * se_gap + 0.05
assert cost.mean() > 0
# END SOLUTION

# %%
distill.submit_predictions(
    "leakage-gap", np.concatenate([wrong_reports, tuned_reports, nested_reports])
)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# A loop over `s in range(10)`: one call to `noise_problem(s)`, one to
# `screen_then_cv(Xs, ys, 100, 5, s)`, five to `screen_within_cv` (one
# per grid size — keep the smallest mean), one to
# `nested_cv(Xs, ys, GRID, 5, s)` (average its errors). Collect the three
# arrays, plot, take the two mean ± SE summaries with `bootstrap_se`,
# submit the concatenation — wrong block first, tuned second, nested
# third.
# </details>
#
# <details><summary>Hint 2 — reading a failure</summary>
#
# Crosses hugging a few percent, triangles a band below the dots, dots
# straddling 0.5: that passes. Crosses noticeably above ~10%: your
# `screen_then_cv` is not leaking hard enough — all 50 rows, largest
# signed correlations. Triangles at the dots' level: you selected with
# the one-SE rule here — this protocol reports the winner's own minimum.
# Dots systematically below ~0.45: the nested level leaks — the usual
# cause is an inner table built on all 50 rows, or the outer assignment
# reused as the inner one.
# </details>

# %% [markdown]
# ## 10. Written answer: why the gap survives disjoint folds
#
# Every fold in the wrong-way pipeline was disjoint from its training
# rows, and the classifier was honestly refit each round — yet the report
# was off by 45 points. In 3–6 sentences in the cell below: name the
# assumption honest cross-validation makes about the held-out fold, state
# precisely how the full-data screen violates it, and say why disjoint
# folds do not restore it. Name the mechanism, not the slogan.

# %%
distill.submit_review(
    "why-the-gap",
    "Honest CV assumes the held-out fold is exchangeable with fresh data "
    "conditional on everything used to build the rule being graded - the "
    "fold must be independent of the fitted rule, and the rule includes "
    "every fitted step, not just the classifier. The full-data screen "
    "breaks this: the kept feature set is a function of all fifty labels, "
    "including the held-out fold's, so conditional on the kept set the "
    "fold's labels are no longer a fresh draw - they correlate about 0.3 "
    "with every kept column on a problem whose population correlations "
    "are all zero. Disjoint folds cannot restore independence because the "
    "dependence does not live in the rows: it entered through the "
    "selection step, and the fold's labels already spent their "
    "information before the split was made. Moving the screen inside each "
    "fold restores the assumption, because then nothing about the rule "
    "was computed from the rows that grade it.",
)

# %% [markdown]
# What exists now did not exist four hours ago: a fold assigner that is
# stratified and reproducible, a scorer whose signature quarantines every
# fitted step, bootstrap error bars for arbitrary statistics, a selection
# rule that spends fold noise on simplicity — and a proof of honesty in
# three acts: the module's famous blunder reproduced, the subtler tuning
# shortcut caught reporting eight points below the truth, and both dissolved
# by pushing every choice — the screen, then the selection — inside a
# fold boundary, in your own code. Every later lab in this course
# evaluates against held-out data in exactly this shape: the boosting and
# Gaussian-process labs assume the harness pattern, and the AUC scorer
# you built in the logistic-regression lab drops into the same `err`
# slot. Measurement is now part of your method, not a hope appended to
# it.

# %%
distill.dump()
