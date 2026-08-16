# %% [markdown]
# # Lab: logistic regression from scratch
#
# You will build a complete logistic-regression classifier with nothing but
# numpy — the sigmoid, a numerically stable log-loss, a gradient you derive
# yourself, a batch gradient-descent trainer, L2 regularization, Newton's
# method — plus your own ROC-AUC scorer, and then use that code to diagnose
# real tumors, submitting predictions against held-out labels you never see.
# Along the way you reproduce the module's central pathology on purpose:
# a trainer whose weights diverge on separable data, until your penalty
# stops them.
#
# Ground rules:
#
# - **No sklearn, no scipy** — the model and the scorer are yours end to end.
#   (Using them to sanity-check on your own machine is fine; the graded work
#   is numpy.)
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go; partial
#   completion is normal — three of the ten checkpoints are optional, and
#   the checklist on the lesson page marks which (Newton's method, the open
#   modeling task, the written answer).

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/logreg-lab")

# %% [markdown]
# ## 1. The sigmoid
#
# Logistic regression models the log-odds as a linear function of the
# features. To turn a score $z = w^\top x + b$ back into a probability, we
# invert the log-odds — that inverse is the sigmoid:
#
# $$\sigma(z) = \frac{1}{1 + e^{-z}}$$

# %%
def sigmoid(z):
    """Elementwise sigmoid.

    Args:
        z: float array of any shape.
    Returns:
        Array of the same shape, values in (0, 1).
    """
    # BEGIN SOLUTION
    return 1.0 / (1.0 + np.exp(-z))
    # END SOLUTION

# %%
# Quick local sanity check before submitting. The last line is the one that
# catches a flipped exponent sign — the first two hold for σ(−z) as well.
assert sigmoid(np.array([0.0]))[0] == 0.5
assert np.allclose(sigmoid(np.array([-3.0, 3.0])), 1 - sigmoid(np.array([3.0, -3.0])))
assert sigmoid(np.array([2.0]))[0] > 0.5, "sigmoid must be increasing: check the sign in the exponent"

# %%
distill.check("sigmoid", sigmoid)

# %% [markdown]
# ## 2. A numerically stable log-loss
#
# The loss is the negative mean log-likelihood of a Bernoulli model — the
# further your predicted probability is from the label, the more you pay:
#
# $$L(w, b) = -\frac{1}{n}\sum_{i=1}^{n} \Big[\, y_i \log p_i + (1-y_i)\log(1-p_i) \,\Big],
# \qquad p_i = \sigma(w^\top x_i + b)$$
#
# The trap: for $|z| \gtrsim 40$ the sigmoid saturates to exactly `0.0` or
# `1.0` in float64, and `log(0)` is `-inf`. Writing the loss as
# `log(sigmoid(z))` therefore breaks on confident predictions — which real
# trained models produce all the time. Rewrite the logs directly in terms of
# $z$:
#
# $$\log \sigma(z) = -\log(1 + e^{-z}), \qquad \log(1 - \sigma(z)) = -\log(1 + e^{z})$$
#
# and compute $\log(1+e^{t})$ with `np.logaddexp(0, t)`, which is exact for
# any magnitude of $t$. The challenge inputs for this checkpoint contain
# logits past ±300 on purpose: a loss written through `log(sigmoid(z))` goes
# non-finite there and can never match.

# %%
def log_loss(w, b, X, y):
    """Mean negative log-likelihood of labels y under the logistic model.

    Args:
        w: (d,) weights.
        b: scalar intercept.
        X: (n, d) features.
        y: (n,) labels in {0, 1}.
    Returns:
        Scalar loss (finite for any magnitude of the logits).
    """
    # BEGIN SOLUTION
    z = X @ w + b
    return np.mean(y * np.logaddexp(0.0, -z) + (1 - y) * np.logaddexp(0.0, z))
    # END SOLUTION

# %%
# The stability test your implementation must survive: huge logits, finite loss.
_w_big = np.full(3, 200.0)
assert np.isfinite(log_loss(_w_big, 0.0, np.eye(3), np.array([1.0, 0.0, 1.0])))

# %%
distill.check("log-loss", log_loss)

# %% [markdown]
# ## 3. The gradient
#
# Now differentiate the loss with respect to $w$ and $b$ — **on paper, from
# scratch**. No formula is printed here; the referee below decides. The
# finite-difference check in the next cell brute-force differentiates *your
# own loss* and compares — an analytic gradient that disagrees with it is
# wrong, no matter how plausible the algebra felt. This is the debugging
# move that transfers to every gradient you will ever hand-derive. The
# result simplifies sharply — the $\sigma'$ factor is supposed to cancel;
# if yours still carries it, keep simplifying. The lesson has the worked
# derivation to verify against afterwards.

# %%
def grad(w, b, X, y):
    """Gradient of `log_loss` at (w, b).

    Args:
        w: (d,) weights.  b: scalar.  X: (n, d).  y: (n,) in {0, 1}.
    Returns:
        (dw, db): (d,) array and scalar.
    """
    # BEGIN SOLUTION
    p = sigmoid(X @ w + b)
    return X.T @ (p - y) / len(y), np.mean(p - y)
    # END SOLUTION

# %%
# Infrastructure (do not modify): finite-difference gradient referee.
# If your analytic gradient is right, it must agree with brute-force numeric
# differentiation of your own loss — the strongest local test you can run.
def numeric_grad(f, x, eps=1e-6):
    g = np.zeros_like(x)
    for i in range(x.size):
        step = np.zeros_like(x); step[i] = eps
        g[i] = (f(x + step) - f(x - step)) / (2 * eps)
    return g

_rng = np.random.default_rng(0)
_X, _y = _rng.normal(size=(30, 4)), (_rng.random(30) > 0.5).astype(float)
_w, _b = _rng.normal(size=4), 0.2
_dw, _db = grad(_w, _b, _X, _y)
assert np.allclose(_dw, numeric_grad(lambda w: log_loss(w, _b, _X, _y), _w), atol=1e-5), \
    "analytic dw disagrees with the numeric gradient of your own loss"
assert np.isclose(_db, numeric_grad(lambda b: log_loss(_w, b[0], _X, _y), np.array([_b]))[0], atol=1e-5)

# %%
distill.check("grad", grad)

# %% [markdown]
# If stuck, open the folds in order — the section text above is the strategy.
#
# <details><summary>Hint 1 — pseudocode</summary>
#
# Differentiate through $z_i = w^\top x_i + b$ with the chain rule. The logs
# contribute $-y_i/p_i + (1-y_i)/(1-p_i)$, the sigmoid contributes
# $\sigma'(z_i) = p_i(1-p_i)$ — and that factor cancels against both
# denominators, collapsing the whole per-example derivative to $p_i - y_i$.
# What remains is $\partial z_i/\partial w = x_i$, $\partial z_i/\partial b = 1$,
# and the $1/n$ from the mean:
#
# ```
# p  ← sigmoid(X @ w + b)          # (n,)
# dw ← rows of X combined with the residual (p − y), averaged over n
# db ← the residual itself, averaged over n
# ```
# </details>
#
# <details><summary>Hint 2 — last resort</summary>
#
# `X.T @ (p - y) / len(y), np.mean(p - y)`. The averaging and the
# $(p - y)$ sign are exactly what the two wrong-variant verdicts name: a sum
# where the loss is a mean, and $(y - p)$ — the gradient of the
# log-likelihood instead of its negative.
# </details>

# %% [markdown]
# ## 4. Batch gradient descent
#
# Now assemble the trainer. Specification:
#
# - initialize `w = np.zeros(d)`, `b = 0.0`;
# - at every iteration, **first** record the current `log_loss` in `losses`,
#   **then** take one step: $w \leftarrow w - \eta \nabla_w$,
#   $b \leftarrow b - \eta \nabla_b$;
# - return `(w, b, losses)` after exactly `iters` iterations.

# %%
def fit(X, y, lr, iters):
    """Train logistic regression by batch gradient descent.

    Args:
        X: (n, d) features.  y: (n,) labels in {0, 1}.
        lr: learning rate.  iters: number of full-batch steps.
    Returns:
        (w, b, losses): (d,) weights, scalar intercept, (iters,) loss history
        where losses[t] is the loss BEFORE step t.
    """
    # BEGIN SOLUTION
    w, b = np.zeros(X.shape[1]), 0.0
    losses = np.empty(iters)
    for t in range(iters):
        losses[t] = log_loss(w, b, X, y)
        dw, db = grad(w, b, X, y)
        w -= lr * dw
        b -= lr * db
    return w, b, losses
    # END SOLUTION

# %%
# Infrastructure (do not modify): curve plot, reused throughout the lab.
def plot_curves(ylabel, **series):
    for name, values in series.items():
        plt.plot(values, label=name)
    plt.xlabel("iteration"); plt.ylabel(ylabel); plt.legend(); plt.show()

# What a healthy run looks like — and what a broken one looks like. The same
# code, two learning rates: 0.5 descends monotonically; 12.0 overshoots and
# oscillates upward. If your curve looks like the second one, your gradient
# may be fine and your learning rate is not.
_demo_rng = np.random.default_rng(1)
_Xd = _demo_rng.normal(size=(100, 3))
_yd = (_demo_rng.random(100) < sigmoid(_Xd @ np.array([1.5, -2.0, 1.0]))).astype(float)
plot_curves("log-loss", **{"lr=0.5 (healthy)": fit(_Xd, _yd, 0.5, 120)[2],
                           "lr=12 (diverging)": fit(_Xd, _yd, 12.0, 120)[2]})

# %%
distill.check("fit-gd", fit)

# %% [markdown]
# ## 5. L2 regularization
#
# On separable data the likelihood pushes $\|w\| \to \infty$; the fix from the
# lesson is a penalty on the weights. The objective:
#
# $$L_{\lambda}(w, b) = L(w, b) + \lambda \|w\|^2$$
#
# Derive its gradient yourself — it is one line on top of checkpoint 3, with
# two details to get right: what the derivative of $\lambda\|w\|^2$
# actually is, and the fact that the intercept is **not** penalized ($b$
# absorbs the base rate of the positive class and says nothing about model
# complexity).

# %%
def loss_grad_l2(w, b, X, y, lam):
    """L2-penalized loss and gradient.

    Args:
        w: (d,).  b: scalar.  X: (n, d).  y: (n,) in {0, 1}.  lam: λ ≥ 0.
    Returns:
        (loss, dw, db): penalized scalar loss, (d,) gradient, scalar gradient.
    """
    # BEGIN SOLUTION
    dw, db = grad(w, b, X, y)
    return log_loss(w, b, X, y) + lam * (w @ w), dw + 2.0 * lam * w, db
    # END SOLUTION

# %%
# Two local checks before submitting. At λ=0 the penalized objective IS
# checkpoints 2–3; and db must not move as λ rises — the intercept is
# unpenalized.
_l2_rng = np.random.default_rng(5)
_Xl, _yl = _l2_rng.normal(size=(20, 3)), (_l2_rng.random(20) > 0.5).astype(float)
_wl, _bl = _l2_rng.normal(size=3), -0.4
_loss0, _dw0, _db0 = loss_grad_l2(_wl, _bl, _Xl, _yl, 0.0)
_dw_ref, _db_ref = grad(_wl, _bl, _Xl, _yl)
assert np.isclose(_loss0, log_loss(_wl, _bl, _Xl, _yl)), \
    "at λ=0 the penalized loss must equal log_loss on the same arguments"
assert np.allclose(_dw0, _dw_ref) and np.isclose(_db0, _db_ref), \
    "at λ=0 the penalized gradient must equal grad on the same arguments"
assert np.isclose(loss_grad_l2(_wl, _bl, _Xl, _yl, 3.0)[2], _db_ref), \
    "db must not depend on λ: the intercept is unpenalized"

# %%
distill.check("l2", loss_grad_l2)

# %% [markdown]
# ## 6. The pathology, live: separable data
#
# On linearly separable data the likelihood has no maximizer: once some $w$
# classifies every point correctly, scaling it up pushes every probability
# closer to its label and the loss lower still — forever. Gradient descent
# obliges: $\|w\|$ grows without bound (logarithmically in the iteration
# count) while the loss creeps toward zero and every prediction saturates
# toward a confident 0 or 1. The lesson derived this as algebra; here it
# happens to your own trainer, and your own penalty stops it.
#
# Build the instrumented trainer: checkpoint 5's penalized gradient inside
# checkpoint 4's loop, recording $\|w\|$ instead of the loss. With
# $\lambda = 0$ it is plain gradient descent.
#
# - initialize `w = np.zeros(d)`, `b = 0.0`;
# - at every iteration, **first** record the Euclidean norm $\|w\|$ in
#   `norms`, **then** step against the gradient of the $\lambda$-penalized
#   objective (checkpoint 5), both `w` and `b`;
# - return `(w, b, norms)` after exactly `iters` iterations.

# %%
def fit_l2(X, y, lr, iters, lam):
    """Train on the L2-penalized objective, tracking the weight norm.

    Args:
        X: (n, d) features.  y: (n,) labels in {0, 1}.
        lr: learning rate.  iters: number of full-batch steps.  lam: λ ≥ 0.
    Returns:
        (w, b, norms): (d,) weights, scalar intercept, (iters,) history
        where norms[t] is ||w|| BEFORE step t.
    """
    # BEGIN SOLUTION
    w, b = np.zeros(X.shape[1]), 0.0
    norms = np.empty(iters)
    for t in range(iters):
        norms[t] = np.sqrt(w @ w)
        _, dw, db = loss_grad_l2(w, b, X, y, lam)
        w -= lr * dw
        b -= lr * db
    return w, b, norms
    # END SOLUTION

# %%
# Infrastructure (do not modify): one ||w|| history per λ — the experiment
# the checkpoint verifies, run with your fit_l2.
def norm_histories(X, y, lr, iters, lams):
    return tuple(fit_l2(X, y, lr, iters, lam)[2] for lam in lams)

# %%
# The experiment: 30 points, two clusters a clean margin apart — separable.
# Watch λ=0 climb forever (every doubling of the iteration count adds about
# the same increment — logarithmic, but unbounded) while λ=0.1 flatlines.
_sep_rng = np.random.default_rng(7)
X_sep = np.vstack([_sep_rng.normal(size=(15, 2)) * 0.6 + np.array([-2.0, -2.0]),
                   _sep_rng.normal(size=(15, 2)) * 0.6 + np.array([2.0, 2.0])])
y_sep = np.concatenate([np.zeros(15), np.ones(15)])

_n0, _nl2 = norm_histories(X_sep, y_sep, 1.0, 4000, (0.0, 0.1))
plot_curves("||w||", **{"λ=0 (diverging)": _n0, "λ=0.1 (capped)": _nl2})

_w_div, _b_div, _ = fit_l2(X_sep, y_sep, 1.0, 4000, 0.0)
print(f"λ=0:   ||w|| after 2000 steps {_n0[2000]:.2f}, after 4000 {_n0[-1]:.2f} — still climbing")
print(f"λ=0.1: ||w|| after 2000 steps {_nl2[2000]:.2f}, after 4000 {_nl2[-1]:.2f} — capped")
print(f"λ=0 loss {log_loss(_w_div, _b_div, X_sep, y_sep):.1e}: near zero and falling — nothing in the objective says stop")
assert _n0[-1] > _n0[2000] + 0.2, "unpenalized ||w|| should still be growing at iteration 4000"
assert abs(_nl2[-1] - _nl2[2000]) < 1e-3, "the L2-penalized ||w|| should have stabilized"

# %%
distill.check("separable-divergence", norm_histories)

# %% [markdown]
# ## 7. Newton's method (optional)
#
# Logistic regression has no closed-form solution, and gradient descent is
# not the only iterative option. Newton's method (a.k.a. IRLS) uses the
# curvature of the loss and converges in single-digit steps where gradient
# descent needs thousands. The generic step, over the stacked parameter
# $\theta = (w, b)$:
#
# $$\theta \leftarrow \theta - H^{-1} \nabla_\theta L$$
#
# You already derived $\nabla_\theta L$ in checkpoint 3. **Derive the Hessian
# yourself** — differentiate the gradient once more; the same $\sigma'$ that
# cancelled there now stays, as a per-example weight.
#
# Implementation notes: stack a column of ones onto X so the intercept rides
# along in $\theta$; solve the linear system (`np.linalg.solve`), never
# invert; record `log_loss` before each step, like `fit`.
#
# The checkpoint verifies the speed claim itself, on features made deliberately
# collinear — the geometry that stalls gradient descent and leaves Newton
# indifferent: your Newton's 8-step loss history, next to what your `fit`
# has reached after the same 8 steps and after 2,000.

# %%
def newton(X, y, iters):
    """Train logistic regression by Newton's method.

    Args:
        X: (n, d) features.  y: (n,) labels in {0, 1}.
        iters: number of Newton steps from a zero initialization.
    Returns:
        (w, b, losses): (d,) weights, scalar intercept, (iters,) loss history
        where losses[t] is the loss BEFORE step t.
    """
    # BEGIN SOLUTION
    n, d = X.shape
    Xa = np.column_stack([X, np.ones(n)])
    theta = np.zeros(d + 1)
    losses = np.empty(iters)
    for t in range(iters):
        losses[t] = log_loss(theta[:d], theta[d], X, y)
        p = sigmoid(Xa @ theta)
        g = Xa.T @ (p - y) / n
        H = (Xa * (p * (1 - p))[:, None]).T @ Xa / n
        theta = theta - np.linalg.solve(H, g)
    return theta[:d], theta[d], losses
    # END SOLUTION

# %%
# Infrastructure (do not modify): the speed comparison the checkpoint verifies.
# Your newton and your fit, same data, same start.
def newton_vs_gd(X, y, lr, newton_iters, gd_iters):
    _, _, ln = newton(X, y, newton_iters)
    _, _, lg = fit(X, y, lr, gd_iters + 1)
    return ln, lg[newton_iters], lg[gd_iters]

# %%
# See it locally first: two nearly-collinear feature pairs. Newton is done in
# a handful of steps; count how many gradient-descent needs to catch up.
_ill_rng = np.random.default_rng(3)
_Z = _ill_rng.normal(size=(200, 4))
X_ill = _Z.copy()
X_ill[:, 1] = 0.99 * _Z[:, 0] + np.sqrt(1 - 0.99 ** 2) * _Z[:, 1]
X_ill[:, 3] = 0.99 * _Z[:, 2] + np.sqrt(1 - 0.99 ** 2) * _Z[:, 3]
y_ill = (_ill_rng.random(200) < sigmoid(X_ill @ (3.0 * np.array([1.0, -1.2, 0.8, -1.0])) + 0.2)).astype(float)

_wN, _bN, _lN = newton(X_ill, y_ill, 8)
_newton_final = log_loss(_wN, _bN, X_ill, y_ill)
_lG = fit(X_ill, y_ill, 1.0, 3000)[2]
_caught_up = np.nonzero(_lG <= _newton_final + 1e-6)[0]
_steps = int(_caught_up[0]) if _caught_up.size else 3000
print(f"Newton: converged within 8 steps (loss {_newton_final:.6f})")
print(f"GD, lr=1: {_steps} steps to reach the same loss (+1e-6)")
plot_curves("log-loss", **{"Newton (8 steps)": _lN, "GD (first 3000)": _lG})
assert _steps > 800, "on this geometry GD should need well over 800 steps to match 8 Newton steps"

# %%
distill.check("newton", newton_vs_gd)

# %% [markdown]
# If stuck, open the folds in order — the section text above is the strategy.
#
# <details><summary>Hint 1 — pseudocode</summary>
#
# ```
# Xa ← [X | column of ones]        # (n, d+1)
# θ  ← zeros(d+1)
# repeat iters times:
#     record log_loss(θ[:d], θ[d], X, y)
#     p ← sigmoid(Xa @ θ)
#     g ← Xa.T @ (p − y) / n
#     H ← ?                        # (d+1, d+1), built from Xa and a
#                                  # per-example weight — your derivation
#     θ ← θ − solve(H, g)
# ```
# The per-example weight is what differentiating the gradient once more
# produces: the $\sigma'$ factor that cancelled in checkpoint 3 stays here.
# </details>
#
# <details><summary>Hint 2 — last resort</summary>
#
# The Hessian is $H = X_a^\top \,\mathrm{diag}(p(1-p))\, X_a / n$ — as code,
# `(Xa * (p * (1 - p))[:, None]).T @ Xa / n`. If the check still fails,
# confirm the loss is recorded BEFORE each step, exactly like `fit`.
# </details>

# %% [markdown]
# ## 8. Implement AUC
#
# Before the open task you need a way to score yourself — so build the scorer.
# The direct route never builds the ROC curve at all: AUC is the probability
# that a random positive outscores a random negative (ties count half), which
# makes it a rank statistic. With $R_1$ the sum of the positives' ranks among
# all $n_1 + n_0$ scores:
#
# $$\mathrm{AUC} = \frac{R_1 - n_1(n_1+1)/2}{n_1 n_0}$$
#
# The craft is in the ties: **tied scores must share the average of their
# ranks**, or the formula silently favors whichever order the sort produced.
# The challenge inputs are quantized on purpose — an implementation that
# ranks by sort position alone will not match.

# %%
def roc_auc(y, scores):
    """Area under the ROC curve, by the rank formula.

    Args:
        y: (n,) labels in {0, 1}, both classes present.
        scores: (n,) real-valued scores, ties possible.
    Returns:
        Scalar AUC in [0, 1].
    """
    # BEGIN SOLUTION
    order = np.argsort(scores, kind="stable")
    ranks = np.empty(len(scores))
    i = 0
    while i < len(scores):
        j = i
        while j + 1 < len(scores) and scores[order[j + 1]] == scores[order[i]]:
            j += 1
        ranks[order[i : j + 1]] = (i + j) / 2.0 + 1.0
        i = j + 1
    n1 = int(y.sum())
    n0 = len(y) - n1
    return (ranks[y == 1].sum() - n1 * (n1 + 1) / 2.0) / (n1 * n0)
    # END SOLUTION

# %%
# Hand-checkable cases: a perfect ranking, and an all-tied one.
assert roc_auc(np.array([0.0, 1.0]), np.array([0.2, 0.9])) == 1.0
assert roc_auc(np.array([0.0, 1.0, 0.0, 1.0]), np.full(4, 0.5)) == 0.5

# %%
distill.check("auc", roc_auc)

# %% [markdown]
# <details><summary>Hint 1 — pseudocode</summary>
#
# ```
# order ← argsort(scores)            # ascending
# ranks ← 1..n placed via order, then every group of TIED scores
#         replaced by the group's average rank
# R1    ← sum of ranks where y == 1
# return (R1 − n1(n1+1)/2) / (n1 · n0)
# ```
# </details>
#
# <details><summary>Hint 2 — last resort</summary>
#
# Tie-averaging without an explicit loop: with
# `u, inv, counts = np.unique(scores, return_inverse=True, return_counts=True)`
# the tie-averaged rank of each score is
# `(np.cumsum(counts) - (counts - 1) / 2)[inv]`. Re-run the two hand cases
# above before submitting.
# </details>

# %% [markdown]
# ## 9. Open task: diagnose real tumors
#
# `data/train.csv` is the Wisconsin breast-cancer diagnostic dataset: 400
# rows, one tumor each. For every tumor a fine-needle aspirate — cells drawn
# from the mass through a thin needle — was stained and photographed under a
# microscope, and the 30 numbers in columns 0–29 are computed from that
# digitized image: ten measurements of the cell nuclei (radius, texture,
# concavity, ...), each reported as its mean, its standard error, and its
# worst value across the nuclei in the image. Column 30 is the biopsy
# verdict, coded 1 = benign — 62.75% of the training rows, 62.7% of the
# holdout — so the quantity your AUC ranks is benignity, not malignancy.
# Fit whatever
# logistic-regression pipeline you like **using only the code you wrote
# above** — plain GD, L2, or Newton, your choice — predict probabilities for
# the 169 tumors in `data/holdout_X.csv`, and submit them. The server scores
# AUC against labels you don't have; the passing threshold is shown on the
# lesson page. Attempts are limited per day, so validate locally before you
# submit.
#
# This checkpoint is optional, but it is where every function you verified
# above runs together on real data for the first time.
#
# Data: W. H. Wolberg, W. N. Street, O. L. Mangasarian, *Breast Cancer
# Wisconsin (Diagnostic)*, UCI Machine Learning Repository, 1993.

# %%
# Infrastructure (do not modify): the ROC curve behind the number you submit.
# Use it on your own validation split — a healthy curve hugs the top-left
# corner; the diagonal is a coin flip. Pair every submitted score with this
# picture before spending an attempt.
def plot_roc(y, scores):
    ts = np.unique(scores)[::-1]
    tpr = [np.mean(scores[y == 1] >= t) for t in ts]
    fpr = [np.mean(scores[y == 0] >= t) for t in ts]
    plt.plot([0.0, *fpr, 1.0], [0.0, *tpr, 1.0])
    plt.plot([0, 1], [0, 1], "--")
    plt.xlabel("FPR"); plt.ylabel("TPR"); plt.show()

# %%
# BEGIN SOLUTION
raw = np.loadtxt("data/train.csv", delimiter=",")
X_tr, y_tr = raw[:, :30], raw[:, 30]
X_ho = np.loadtxt("data/holdout_X.csv", delimiter=",")

mu, sd = X_tr.mean(axis=0), X_tr.std(axis=0)
w, b, losses = fit((X_tr - mu) / sd, y_tr, lr=1.0, iters=4000)
preds = sigmoid(((X_ho - mu) / sd) @ w + b)
# END SOLUTION

# %%
distill.submit_predictions("beat-auc", preds)

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# The features live on wildly different scales (mean area ≈ 650, mean
# smoothness ≈ 0.1). On raw features the loss surface is so badly
# conditioned that gradient descent diverges at any comfortable learning
# rate; a hand-tuned rate around 1e-4 works but needs tens of thousands of
# steps. Standardization is what lets plain gradient descent converge at
# lr ≈ 1 in a few thousand steps. Standardize — and standardize the holdout
# with the **train** mean and std, not its own: the holdout is data you
# pretend arrived after training.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# load train.csv → X (cols 0–29), y (col 30); load holdout_X.csv
# mu, sd = train stats;  X ← (X − mu)/sd;  X_ho ← (X_ho − mu)/sd
# w, b ← fit(X, y, lr≈1, iters≈a few thousand)   # watch plot_curves
# preds ← sigmoid(X_ho @ w + b)
# ```
# To estimate your AUC before spending an attempt, hold out ~80 rows of
# train.csv yourself and score them with YOUR `roc_auc` from checkpoint 8 —
# you have both the labels and the scorer.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# With standardization, `lr=1.0, iters=4000, λ=0` clears the threshold with
# room to spare. If your loss curve rises, reread the lr=12 plot above.
# </details>

# %% [markdown]
# ## 10. Written answer: why not squared error?
#
# In 3–6 sentences, in the cell below: why is squared error a poor training
# loss for logistic regression, and what exactly does cross-entropy fix? A
# model answer is graded leniently — name the real mechanism, not slogans.

# %%
distill.submit_review(
    "why-not-mse",
    "Squared error composed with the sigmoid is non-convex in the weights, so "
    "gradient descent loses its convergence guarantees and can stall in flat "
    "regions. Worse, its gradient carries a sigma'(z) factor that vanishes "
    "whenever the sigmoid saturates, so a confidently wrong prediction "
    "(z large, wrong sign) produces almost no learning signal. Cross-entropy "
    "is the negative Bernoulli log-likelihood; the sigma' cancels and the "
    "gradient becomes (p - y)x, which is large exactly when the model is "
    "confidently wrong, and the objective is convex.",
)

# %%
distill.dump()
