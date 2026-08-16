# %% [markdown]
# # Lab: penalized regression from scratch
#
# Module 3 derived three estimators on paper: least squares through the
# normal equations, ridge through SVD shrinkage, the lasso through
# soft-thresholding and coordinate descent. Here the derivations become
# verified code. You build a small toolkit — `standardize`, `fit_ols`,
# `fit_ridge`, `fit_lasso` — and point it at the module's running dataset:
# the composition checkpoint reproduces the prostate study's OLS/ridge/lasso
# coefficient table with your own solvers, and the open task is to beat
# least squares' held-out test error with your tuned lasso.
#
# Ground rules:
#
# - **No sklearn, no scipy** — every fit below is your numpy end to end.
#   (Checking your answers against sklearn on your own machine is fine; the
#   graded work is yours.)
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go. The six exact
#   checkpoints are the required set; the written answer and the open task
#   at the end are optional — partial completion is a normal way to finish.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/regularization-lab")

# %% [markdown]
# ## 1. Standardization — the convention every later number depends on
#
# Neither penalty is unit-invariant: measuring a predictor in millimeters
# instead of meters multiplies its coefficient by 1000 and its share of
# $\|\beta\|^2$ or $\|\beta\|_1$ by the same factor, so the penalty's
# verdict on that predictor depends on the units it happened to arrive in.
# The fix, fixed once here and assumed by everything below:
#
# - each predictor column is standardized to mean 0 and unit **population**
#   variance (`np.std`'s default, ddof=0), with statistics computed on the
#   rows being fitted — never on held-out rows;
# - the response is **centered, never scaled** — predictions must come back
#   in the units of $y$;
# - with both in place the intercept separates from the penalized problem:
#   $\hat\beta_0 = \bar y$, and no penalty ever touches it.
#
# $$\tilde x_{ij} = \frac{x_{ij} - \bar x_j}{\sigma_j}, \qquad
#   \tilde y_i = y_i - \bar y$$

# %%
def standardize(X, y):
    """Standardize predictors, center the response.

    Args:
        X: (n, d) raw predictors.
        y: (n,) raw response.
    Returns:
        (Xs, yc, x_mean, x_scale, y_mean):
        Xs: (n, d) columns with mean 0 and population std 1 (ddof=0).
        yc: (n,) y minus its mean — centered, NOT scaled.
        x_mean, x_scale: (d,) the statistics used, for transforming new rows.
        y_mean: scalar, the intercept of every model fitted downstream.
    """
    # BEGIN SOLUTION
    x_mean, x_scale = X.mean(axis=0), X.std(axis=0)
    return (X - x_mean) / x_scale, y - y.mean(), x_mean, x_scale, y.mean()
    # END SOLUTION

# %%
# Quick local sanity check before submitting.
_rng = np.random.default_rng(0)
_X, _y = _rng.normal(3.0, 7.0, size=(30, 4)), _rng.normal(size=30)
_Xs, _yc, _mu, _sd, _ybar = standardize(_X, _y)
assert np.allclose(_Xs.mean(0), 0.0) and np.allclose(_Xs.std(0), 1.0)
assert np.isclose(_yc.mean(), 0.0) and np.isclose(_yc.std(), _y.std())

# %%
distill.check("center-standardize", standardize)

# %% [markdown]
# ## 2. OLS by least squares, not by the normal equations
#
# The estimator is the one the OLS lesson derived,
# $\hat\beta = (X^\top X)^{-1} X^\top y$ — but that formula is a statement
# about the minimizer, not an instruction for computing it. Forming
# $X^\top X$ squares the condition number of the problem: predictors that
# are merely correlated in $X$ become numerically indistinguishable in
# $X^\top X$, and the solve loses twice the digits. Solve the least-squares
# problem directly instead (`np.linalg.lstsq`, which factorizes $X$ itself).
# The demonstration cell after the checkpoint puts numbers on the
# difference.

# %%
def fit_ols(X, y):
    """OLS coefficients, no intercept (the data arrive centered).

    Args:
        X: (n, d) standardized predictors.
        y: (n,) centered response.
    Returns:
        (d,) coefficient vector minimizing ||y - X @ beta||².
    """
    # BEGIN SOLUTION
    return np.linalg.lstsq(X, y, rcond=None)[0]
    # END SOLUTION

# %%
# On a well-conditioned design the two routes agree to machine precision —
# the point of the lstsq route is what happens when the design is NOT.
_X = _rng.normal(size=(40, 3))
_y = _X @ np.array([1.0, -2.0, 0.5]) + _rng.normal(size=40)
assert np.allclose(fit_ols(_X, _y), np.linalg.solve(_X.T @ _X, _X.T @ _y))

# %%
distill.check("ols-solve", fit_ols)

# %%
# Infrastructure (do not modify): the fragility demonstration.
# Two predictors that differ by one part in a billion — the collinear
# regime the diagnostics lesson dissected, pushed to the floating-point
# edge. cond(XᵀX) is cond(X)² ≈ 10¹⁸, past float64's ~16 digits: the
# normal equations have no digits left, and their answer stops minimizing
# anything — its residual is worse than lstsq's, and the two solutions
# disagree by six orders of magnitude coefficient by coefficient. What
# survives in BOTH is the sum β₁+β₂ ≈ 2: the canyon geometry from the
# diagnostics lesson, now in floating point.
_demo_rng = np.random.default_rng(3)
_u = _demo_rng.normal(size=50)
_Xn = np.column_stack([_u, _u + 1e-9 * _demo_rng.normal(size=50)])
_Xn = _Xn - _Xn.mean(0)
_yn = _Xn @ np.array([1.0, 1.0]) + 0.01 * _demo_rng.normal(size=50)
_b_lstsq = fit_ols(_Xn, _yn)
_b_normal = np.linalg.solve(_Xn.T @ _Xn, _Xn.T @ _yn)
print(f"cond(X) = {np.linalg.cond(_Xn):.1e}, so cond(XᵀX) = cond(X)² = {np.linalg.cond(_Xn)**2:.1e}")
print(f"lstsq:            beta = {_b_lstsq}, sum = {_b_lstsq.sum():.3f}, "
      f"residual = {np.linalg.norm(_yn - _Xn @ _b_lstsq):.4f}")
print(f"normal equations: beta = {_b_normal}, sum = {_b_normal.sum():.3f}, "
      f"residual = {np.linalg.norm(_yn - _Xn @ _b_normal):.4f}  <- not the minimum")

# %% [markdown]
# ## 3. Ridge as SVD shrinkage — the whole path from one decomposition
#
# Ridge is the penalized least-squares problem
#
# $$\hat\beta^{\text{ridge}}(\lambda)
#   = \arg\min_\beta \; \|y - X\beta\|^2 + \lambda \|\beta\|^2 .$$
#
# The penalties lesson proved its anatomy on the thin SVD
# $X = U D V^\top$: the solution is the OLS solution taken apart along the
# principal directions $v_j$, with the OLS coefficient along each
# direction, $u_j^\top y / d_j$, multiplied by a shrinkage factor built
# from that direction's variance $d_j^2$ and $\lambda$ — close to 1 where
# $d_j^2$ dwarfs $\lambda$, close to 0 where it doesn't. Derive the factor
# yourself: substitute the SVD into $(X^\top X + \lambda I)^{-1} X^\top y$
# and read off what multiplies each OLS component. The referee cell below
# checks your derivation against that closed form at one $\lambda$.
#
# The decomposition is also why ridge paths are cheap: one SVD, then
# every $\lambda$ on a grid costs only elementwise arithmetic — no repeated
# solves. Implement the vectorized-over-$\lambda$ version.

# %%
def fit_ridge(X, y, lams):
    """Ridge coefficients along a λ grid, via one SVD.

    Args:
        X: (n, d) standardized predictors.
        y: (n,) centered response.
        lams: (L,) penalty values, λ ≥ 0.
    Returns:
        (L, d) array; row i is the ridge solution at lams[i]. Row at λ=0
        must equal the OLS solution.
    """
    # BEGIN SOLUTION
    U, dv, Vt = np.linalg.svd(X, full_matrices=False)
    comp = U.T @ y
    return np.stack([Vt.T @ ((dv / (dv**2 + lam)) * comp) for lam in lams])
    # END SOLUTION

# %%
# Two local referees: the λ=0 limit is OLS, and the closed form
# (XᵀX + λI)⁻¹Xᵀy — fine at this scale — must agree with the SVD route.
_X = _rng.normal(size=(30, 5)); _X = (_X - _X.mean(0)) / _X.std(0)
_y = _X @ np.array([1.0, 0.0, -1.0, 0.5, 0.0]) + _rng.normal(size=30)
_y = _y - _y.mean()
_path = fit_ridge(_X, _y, np.array([0.0, 2.0, 20.0]))
assert np.allclose(_path[0], fit_ols(_X, _y))
assert np.allclose(_path[1], np.linalg.solve(_X.T @ _X + 2.0 * np.eye(5), _X.T @ _y))
# Monotone shrinkage: the norm can only go down as λ grows.
assert np.linalg.norm(_path[0]) > np.linalg.norm(_path[1]) > np.linalg.norm(_path[2])

# %%
distill.check("ridge-svd", fit_ridge)

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Substitute $X = UDV^\top$ into $(X^\top X + \lambda I)^{-1} X^\top y$.
# Then $X^\top X = V D^2 V^\top$, and because $V V^\top = I$ the identity
# rides along: $X^\top X + \lambda I = V (D^2 + \lambda I) V^\top$ — the
# whole matrix is diagonal in the $v$-basis. Inverting a diagonal matrix is
# elementwise, so the expression collapses to: for each $j$, some scalar
# built from $d_j$ and $\lambda$ times the component $u_j^\top y$, summed
# against $v_j$. Read that scalar off.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# U, d, Vt ← svd(X, full_matrices=False)   # ONE decomposition, before the grid
# comp ← U.T @ y                           # (r,) the components u_j·y
# for each lam in lams:                    # only elementwise work per λ
#     scale ← f(d, lam)                    # (r,) — your derived factor
#     row ← Vt.T @ (scale * comp)          # (d,)
# stack the rows → (L, d)
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# The row for one λ is `Vt.T @ ((d / (d**2 + lam)) * (U.T @ y))`: the OLS
# component $(u_j^\top y)/d_j$ times the shrinkage factor
# $d_j^2/(d_j^2+\lambda)$, multiplied out into one fraction.
# </details>

# %% [markdown]
# ## 4. The soft-thresholding operator
#
# The lasso's elementary move, derived in the penalties lesson as the exact
# solution of the orthonormal-case problem:
#
# $$S(z, \gamma) = \operatorname{sign}(z)\,\max(|z| - \gamma,\, 0)$$
#
# Shrink toward zero by $\gamma$; anything within $\gamma$ of zero lands
# exactly on it. Vectorize it — checkpoint 5 calls it once per coordinate
# update.

# %%
def soft_threshold(z, gamma):
    """Soft thresholding, elementwise.

    Args:
        z: float array, any shape (scalars also work).
        gamma: threshold γ ≥ 0.
    Returns:
        Array of z's shape: sign(z) · max(|z| − γ, 0).
    """
    # BEGIN SOLUTION
    return np.sign(z) * np.maximum(np.abs(z) - gamma, 0.0)
    # END SOLUTION

# %%
# The three regimes, checked at the boundary.
assert np.allclose(soft_threshold(np.array([3.0, -3.0]), 1.0), [2.0, -2.0])
assert np.allclose(soft_threshold(np.array([0.5, -0.5, 1.0]), 1.0), 0.0)
assert np.allclose(soft_threshold(np.array([1.0, -0.3]), 0.0), [1.0, -0.3])

# %%
distill.check("soft-threshold", soft_threshold)

# %% [markdown]
# ## 5. Lasso by cyclic coordinate descent
#
# No closed form exists for
#
# $$\min_\beta \; \frac{1}{2n}\|y - X\beta\|^2 + \lambda \|\beta\|_1 ,$$
#
# but the one-dimensional slice of the problem — all coordinates frozen
# except $\beta_j$ — has one, and it is exactly checkpoint 4's operator.
# Derive the update yourself: write the objective as a function of $\beta_j$
# alone, using the **partial residual** (the residual with $x_j$'s own
# contribution added back), and reduce the minimization to one soft
# threshold. With standardized columns ($\frac{1}{n}x_j^\top x_j = 1$) the
# result is a single clean assignment. Then cycle through the coordinates
# until none of them moves.
#
# The algorithm, from the pathwise-coordinate-optimization recipe the
# penalties lesson described:
#
# - `lambdas` arrives **decreasing**; start at the largest value and reuse
#   each solution as the starting point for the next (**warm starts** — near
#   the top of the path almost everything is zero and convergence is
#   instant);
# - one cycle = one in-place update of each coordinate in order
#   $j = 0, \dots, d-1$, each seeing the coefficients as they are **right
#   now**, including this cycle's earlier updates;
# - stop cycling when the largest coefficient change in a full cycle is
#   below `tol`; never exceed `max_cycles` cycles per λ.
#
# Do not call sklearn's `Lasso` here (comparing against it on your own
# machine while debugging is fine).

# %%
def fit_lasso(X, y, lambdas, tol=1e-10, max_cycles=10_000):
    """Lasso coefficient path by cyclic coordinate descent with warm starts.

    Args:
        X: (n, d) standardized predictors (mean 0, population variance 1).
        y: (n,) centered response.
        lambdas: (L,) penalty grid, DECREASING.
        tol: stop cycling at a λ when no coefficient moved more than this.
        max_cycles: hard cap on cycles per λ.
    Returns:
        (L, d) array; row i is the solution at lambdas[i].
    """
    # BEGIN SOLUTION
    n, d = X.shape
    beta = np.zeros(d)
    out = np.empty((len(lambdas), d))
    for i, lam in enumerate(lambdas):
        for _ in range(max_cycles):
            delta = 0.0
            for j in range(d):
                r = y - X @ beta
                z = beta[j] + X[:, j] @ r / n
                bj = soft_threshold(z, lam)
                delta = max(delta, abs(bj - beta[j]))
                beta[j] = bj
            if delta < tol:
                break
        out[i] = beta
    return out
    # END SOLUTION

# %%
# Three local referees. (1) As λ → 0 the lasso approaches OLS. (2) At every
# λ, your solution must beat both the zero vector and the OLS vector on the
# objective it claims to minimize — coordinate descent that converged to
# anything else has a bug. (3) More penalty, fewer (or equal) survivors.
def _lasso_obj(X, y, b, lam):
    return ((y - X @ b) ** 2).mean() / 2 + lam * np.abs(b).sum()

_grid = np.array([0.6, 0.2, 0.05, 1e-8])
_path = fit_lasso(_X, _y, _grid)
assert np.allclose(_path[-1], fit_ols(_X, _y), atol=1e-4)
for _lam, _b in zip(_grid, _path):
    assert _lasso_obj(_X, _y, _b, _lam) <= _lasso_obj(_X, _y, np.zeros(5), _lam) + 1e-12
    assert _lasso_obj(_X, _y, _b, _lam) <= _lasso_obj(_X, _y, fit_ols(_X, _y), _lam) + 1e-12
_nnz = (np.abs(_path) > 1e-12).sum(axis=1)
assert (np.diff(_nnz) >= 0).all(), "shrinking λ should only ever add coefficients here"

# %%
distill.check("lasso-cd", fit_lasso)

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — the one-dimensional problem</summary>
#
# Freeze every coordinate except $\beta_j$ and write the partial residual
# $r^{(j)} = y - \sum_{k \neq j} x_k \beta_k$. The objective in $\beta_j$
# alone is $\frac{1}{2n}\|r^{(j)} - x_j \beta_j\|^2 + \lambda|\beta_j| +
# \text{const}$ — a one-dimensional lasso with a single orthonormal-case
# "predictor", which is exactly the problem the penalties lesson solved with
# the soft threshold.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# beta ← zeros(d)
# for lam in lambdas:              # decreasing; beta carries over = warm start
#     repeat up to max_cycles:
#         delta ← 0
#         for j in 0..d-1:
#             r ← y − X @ beta                     # current full residual
#             z ← beta[j] + x_j · r / n            # add x_j's contribution back
#             new ← soft_threshold(z, lam)
#             delta ← max(delta, |new − beta[j]|); beta[j] ← new
#         if delta < tol: break
#     record beta as the row for lam
# ```
# </details>
#
# <details><summary>Hint 3 — the three classic bugs</summary>
#
# Thresholding $x_j^\top r / n$ with $r$ the **full** residual (forgetting
# to add $\beta_j$'s own contribution back) double-counts the coordinate
# being updated and converges to the wrong point. The threshold is
# $\lambda$ only under the $\frac{1}{2n}$ objective scaling above — if your
# path barely shrinks, you are probably minimizing $\frac12\text{RSS}$ and
# thresholding at an effective $\lambda/n$. And if the coefficients explode
# into overflow warnings and NaN, you computed the whole cycle from the
# coefficients as they stood when the cycle began: that is the Jacobi
# update, and on correlated designs it diverges — coordinate descent is
# Gauss–Seidel, each update seeing this cycle's earlier updates already in
# place.
# </details>

# %% [markdown]
# ## 6. The prostate table, reproduced by your own solvers
#
# The dataset is the one the module's application lesson read end to end:
# Stamey et al. (1989) examined 97 men about to receive a radical
# prostatectomy, recording the log PSA concentration (`lpsa`, the response)
# and eight clinical variables — log cancer volume, log prostate weight,
# age, log benign hyperplasia amount, seminal vesicle invasion, log
# capsular penetration, Gleason grade, and percent Gleason 4/5. The study's
# fixed split puts 67 patients in training and 30 in test.
# `data/prostate.csv` holds the 67 training rows; the 30 test rows'
# predictors sit in `data/holdout_X.csv`, and their `lpsa` values stay on
# the course server for the final checkpoint.
#
# Data: T. A. Stamey et al., "Prostate specific antigen in the diagnosis
# and treatment of adenocarcinoma of the prostate II", *J. Urology* 141(5),
# 1989. Distributed with *The Elements of Statistical Learning*
# (hastie.su.domains/ElemStatLearn).

# %%
# Infrastructure (do not modify): load the training rows.
COLS = ["lcavol", "lweight", "age", "lbph", "svi", "lcp", "gleason", "pgg45"]
_raw = np.loadtxt("data/prostate.csv", delimiter=",", skiprows=1)
X_raw, y_raw = _raw[:, :8], _raw[:, 8]
print(f"train: X {X_raw.shape}, y {y_raw.shape}")
print("column scales differ wildly — std per column:")
print({c: float(round(s, 2)) for c, s in zip(COLS, X_raw.std(0))})

# %% [markdown]
# Assemble the study's comparison: OLS, ridge, and lasso coefficients side
# by side on the training rows. The tuning values are the study's
# cross-validated choices, translated to this lab's conventions:
#
# - **ridge** at $\lambda = 23.12$ — the value at which the effective
#   degrees of freedom $\operatorname{df}(\lambda) = \sum_j
#   d_j^2/(d_j^2+\lambda)$ equal $5.0$ on this design (the application
#   lesson's back-solve);
# - **lasso** at $\lambda = 0.22$ — the value at which the shrinkage factor
#   $s = \sum_j|\hat\beta_j| / \sum_j|\hat\beta_j^{\text{ols}}|$ comes out
#   at $0.366$, the study's $\hat s \approx 0.36$.
#
# Everything in the function is composition: standardize once, fit three
# times, put the intercept $\bar y$ on top.

# %%
def coef_table(X_raw, y_raw, lam_ridge, lam_lasso):
    """The OLS / ridge / lasso coefficient table on one dataset.

    Args:
        X_raw: (n, 8) raw predictors.
        y_raw: (n,) raw response.
        lam_ridge: ridge penalty.
        lam_lasso: lasso penalty.
    Returns:
        (9, 3) array. Column 0 = OLS, column 1 = ridge, column 2 = lasso.
        Row 0 is the intercept in original y units (identical for all three
        columns — no penalty touches it); rows 1..8 are the coefficients on
        the standardized predictors, in data column order.
        Use YOUR standardize / fit_ols / fit_ridge / fit_lasso.
    """
    # BEGIN SOLUTION
    Xs, yc, _, _, y_mean = standardize(X_raw, y_raw)
    table = np.zeros((9, 3))
    table[0] = y_mean
    table[1:, 0] = fit_ols(Xs, yc)
    table[1:, 1] = fit_ridge(Xs, yc, np.array([lam_ridge]))[0]
    table[1:, 2] = fit_lasso(Xs, yc, np.array([lam_lasso]))[0]
    return table
    # END SOLUTION

# %%
distill.check("prostate-table", coef_table)

# %%
# Infrastructure (do not modify): your table beside the published one
# (ESL Table 3.3, LS / ridge / lasso columns).
_BOOK = np.array([
    [2.465, 2.452, 2.468],
    [0.680, 0.420, 0.533],
    [0.263, 0.238, 0.169],
    [-0.141, -0.046, 0.000],
    [0.210, 0.162, 0.002],
    [0.305, 0.227, 0.094],
    [-0.288, 0.000, 0.000],
    [-0.021, 0.040, 0.000],
    [0.267, 0.133, 0.000],
])
_mine = coef_table(X_raw, y_raw, 23.12, 0.22)
print(f"{'':>10}  {'yours: OLS':>11} {'ridge':>7} {'lasso':>7}   "
      f"{'book: LS':>9} {'ridge':>7} {'lasso':>7}")
for _name, _a, _b in zip(["intercept"] + COLS, _mine, _BOOK):
    print(f"{_name:>10}  {_a[0]:11.3f} {_a[1]:7.3f} {_a[2]:7.3f}   "
          f"{_b[0]:9.3f} {_b[1]:7.3f} {_b[2]:7.3f}")

# %% [markdown]
# Read the two tables against each other. The structure reproduces exactly:
# ridge keeps all eight predictors and shrinks hardest where the design is
# worst-determined; the lasso zeroes `age`, `lcp`, `gleason`, `pgg45` and
# keeps the {`lcavol`, `lweight`, `svi`} core, with `lcavol` always the
# dominant coefficient. (`lbph`, which the book prints at 0.002, sits
# exactly on the entry boundary at this λ — yours holds it at zero.)
# The second decimals differ, and the application
# lesson already diagnosed why: the published table standardized with the
# sample standard deviation over **all 97 patients, test rows included** —
# the small leak the study could afford and this lab refuses. That lesson's
# rerun, which kept the study's sample divisor ($n-1$) but used training
# rows only, put `lcavol` at 0.716; this lab's population divisor (ddof=0,
# the section 1 convention) lands at 0.711. So every gap in the trio 0.680
# / 0.716 / 0.711 is a standardization convention — the first is the leak,
# the second is the divisor alone — and each is larger than several gaps
# between estimators in the table. The checkpoint you just passed verifies
# the honest train-only, ddof=0 reference, not the leaky one.

# %%
# Infrastructure (do not modify): coefficient paths, drawn with your solver.
def plot_path(lambdas, path, names, title):
    for j, name in enumerate(names):
        plt.plot(lambdas, path[:, j], label=name)
    plt.xscale("log"); plt.gca().invert_xaxis()
    plt.axhline(0.0, color="k", lw=0.5)
    plt.xlabel("λ (log scale, shrinking →)"); plt.ylabel("coefficient")
    plt.title(title); plt.legend(fontsize=7); plt.show()

_Xs, _yc, _, _, _ = standardize(X_raw, y_raw)
_lam_grid = np.max(np.abs(_Xs.T @ _yc)) / len(_yc) * np.logspace(0, -2.5, 40)
plot_path(_lam_grid, fit_lasso(_Xs, _yc, _lam_grid), COLS,
          "lasso path — coefficients enter one at a time, exactly zero before")
plot_path(_lam_grid * 1000, fit_ridge(_Xs, _yc, _lam_grid * 1000), COLS,
          "ridge path, same design — everything shrinks, nothing reaches zero")
# What a BROKEN lasso path looks like: near-flat lines that barely move off
# OLS across the whole grid. That shape is the λ/n scale bug from hint 3 —
# simulated here by feeding the thresholds that bug effectively uses.
plot_path(_lam_grid, fit_lasso(_Xs, _yc, _lam_grid / len(_yc)), COLS,
          "broken: a path that never shrinks means your threshold is λ/n")

# %% [markdown]
# ## 7. Written answer: why exact zeros?
#
# The two paths above are the module's central contrast drawn by your own
# solvers: lasso coefficients sit at exactly zero over whole ranges of
# $\lambda$; the ridge path shrinks every coefficient and never produces a
# zero. In 3–6 sentences in the cell
# below: why does coordinate descent produce exact zeros, and why can ridge
# not — however large $\lambda$? Name the mechanism, not the slogan.

# %%
distill.submit_review(
    "why-exact-zeros",
    "The lasso penalty |beta_j| is not differentiable at zero: its "
    "subgradient there is the whole interval [-lambda, lambda], so beta_j = 0 "
    "satisfies the optimality condition whenever the coordinate's correlation "
    "with the residual, x_j^T r / n, lies inside that interval. Coordinate "
    "descent makes the mechanism concrete: every update is a soft threshold, "
    "which maps the entire interval |z_j| <= lambda to exactly 0 — an input "
    "set of positive width lands exactly on zero, so zeros are reached and "
    "kept. Ridge's penalty beta_j^2 is smooth, and its solution shrinks each "
    "SVD component by the factor d_j^2/(d_j^2+lambda), a number strictly "
    "between 0 and 1 for finite lambda — a nonzero coefficient is multiplied "
    "down but never reaches zero, because the smooth penalty's optimality "
    "condition 2*lambda*beta_j = (correlation) has no interval at zero to "
    "absorb the pull of the data.",
)

# %% [markdown]
# ## 8. Open task: beat least squares on the held-out 30
#
# The study's headline: OLS trained on the 67 scores a test mean squared
# error of **0.521** on the 30 held-out patients (against 1.057 for
# predicting the training mean). Your task is to beat it with your own
# lasso: choose $\lambda$ using **only the training rows**, refit, predict
# `lpsa` for the 30 patients in `data/holdout_X.csv`, and submit. The
# server scores root-mean-squared error against the held-out values; the
# passing bar on the lesson page sits just under OLS's own RMSE
# ($\sqrt{0.521} \approx 0.722$): merely tying least squares does not
# clear it — the task is to beat OLS, and a well-tuned lasso does so with
# room to spare. Attempts are
# limited per day — sanity-check your error locally before spending one,
# knowing what the local number is worth: the CV estimate below runs high
# (each fold's model fits on ~60 rows and is scored on 6–7, while the
# model you submit fits on all 67), so it is a scale check, not a
# go/no-go against the bar.
#
# So that everyone tunes on the same resamples, `data/cv_folds.csv` fixes a
# 10-fold assignment of the 67 training rows (fold ids 0–9, built by sorting
# on the response and dealing round-robin, the deterministic device from the
# application lesson's exercise; module 5 builds the machinery properly).
# Two rules make the tuning honest, both already familiar:
#
# - standardize **inside** each fold, with statistics from that fold's
#   training rows only — the held-out fold is data that arrived later;
# - predictions are compared in original `lpsa` units, so map back with the
#   training statistics: $\hat y = \tilde X \hat\beta + \bar y$.

# %%
# Infrastructure (do not modify): the CV curve behind the number you submit.
# Pair every submission with this picture: a healthy curve falls, flattens,
# and rises gently toward small λ; the bar is one standard error.
def plot_cv(lambdas, cv_mean, cv_se):
    plt.errorbar(lambdas, cv_mean, yerr=cv_se, capsize=2)
    plt.xscale("log"); plt.gca().invert_xaxis()
    plt.xlabel("λ (shrinking →)"); plt.ylabel("CV mean squared error")
    plt.show()

folds = np.loadtxt("data/cv_folds.csv", dtype=int)
holdout_X = np.loadtxt("data/holdout_X.csv", delimiter=",", skiprows=1)
print(f"folds: {np.bincount(folds)} rows per fold; holdout: {holdout_X.shape}")

# %%
# BEGIN SOLUTION
lam_grid = np.max(np.abs(_Xs.T @ _yc)) / len(_yc) * np.logspace(0, -2, 30)
errs = np.zeros((10, len(lam_grid)))
for k in range(10):
    tr, va = folds != k, folds == k
    Xt, yt, mu_k, sd_k, ybar_k = standardize(X_raw[tr], y_raw[tr])
    path = fit_lasso(Xt, yt, lam_grid)
    Xv = (X_raw[va] - mu_k) / sd_k
    for i, b in enumerate(path):
        errs[k, i] = np.mean((y_raw[va] - (Xv @ b + ybar_k)) ** 2)
cv_mean, cv_se = errs.mean(0), errs.std(0, ddof=1) / np.sqrt(10)
plot_cv(lam_grid, cv_mean, cv_se)

# The 1-SE rule from the application lesson: sparsest λ within one standard
# error of the minimum. The minimum itself sits in the flat noisy tail.
best = int(np.argmin(cv_mean))
pick = int(np.nonzero(cv_mean <= cv_mean[best] + cv_se[best])[0][0])
Xs_all, yc_all, mu, sd, ybar = standardize(X_raw, y_raw)
beta = fit_lasso(Xs_all, yc_all, lam_grid[: pick + 1])[-1]
preds = (holdout_X - mu) / sd @ beta + ybar
# END SOLUTION

# %%
distill.submit_predictions("beat-test-error", preds)

# %% [markdown]
# If stuck, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Grid: start at $\lambda_{\max} = \max_j |x_j^\top \tilde y| / n$ on the
# standardized full training set (the smallest λ where everything is zero)
# and run two decades down, log-spaced. For each fold: standardize on the
# fold's training rows, fit the whole path with `fit_lasso` (warm starts
# make this cheap), score the held-out fold in original units. Choose λ by
# the 1-SE rule — the minimum lies in a flat region where the folds
# disagree; the rule picks the sparsest statistical tie.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# grid ← lam_max · logspace(0, −2, 30)
# for k in 0..9:
#     train ← rows with folds ≠ k;  val ← rows with folds = k
#     Xs, yc, mu, sd, ybar ← standardize(train)
#     path ← fit_lasso(Xs, yc, grid)
#     err[k, i] ← mean squared error of (Xval−mu)/sd @ path[i] + ybar
# pick λ: largest value with mean err ≤ min + one SE
# refit on all 67 (standardize once more), predict holdout, submit
# ```
# To read your CV curve before submitting: the CV mean at the pick is an
# MSE, and its square root is on the RMSE scale the server reports — but
# expect it to run HIGH. Each fold's model fits on ~60 rows and is scored
# on 6–7, while the model you submit fits on all 67, so a CV estimate of
# ~0.8 RMSE is what a passing submission looks like locally. Treat it as a
# scale check (0.8 is healthy, 1.0 means the tuning went wrong), never as
# a go/no-go against the 0.72 bar.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# With these folds the 1-SE rule lands near $\lambda \approx 0.18$, a
# five-coefficient model that clears the bar with room to spare. Ridge at
# $\operatorname{df}=5$ also passes, barely — sparser is stronger here.
# </details>

# %% [markdown]
# What exists now did not exist four hours ago: a standardization
# convention, three fitted estimators that agree with their closed forms
# and referees, a published table reproduced under an honest protocol, and
# a tuned model that beats the study's baseline on data it never saw. The
# validation lab of module 5 wraps this same toolkit in the machinery this
# lab borrowed on faith: where the folds come from, what the 1-SE bar
# means, and how tuning on the test set corrupts all of it.

# %%
distill.dump()
