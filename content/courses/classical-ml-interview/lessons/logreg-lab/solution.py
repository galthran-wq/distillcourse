# %% [markdown]
# # Lab: logistic regression from scratch
#
# You will build a complete logistic-regression classifier with nothing but
# numpy — the sigmoid, a numerically stable log-loss, a gradient you derive
# yourself, a batch gradient-descent trainer, L2 regularization, Newton's
# method, and your own ROC-AUC scorer — and then use that code to diagnose
# real tumors, submitting predictions against held-out labels you never see.
#
# Ground rules:
#
# - **No sklearn, no scipy** — the model and the scorer are yours end to end.
#   (Using them to sanity-check on your own machine is fine; the graded work
#   is numpy.)
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go; partial
#   completion is normal — three checkpoints are optional, and the checklist
#   on the lesson page marks which (Newton's method mid-lab, the open
#   modeling task, the written answer).

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml-interview/logreg-lab")

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
# Quick local sanity check before submitting.
assert sigmoid(np.array([0.0]))[0] == 0.5
assert np.allclose(sigmoid(np.array([-3.0, 3.0])), 1 - sigmoid(np.array([3.0, -3.0])))

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
# scratch**. This is the derivation interviewers actually ask for, so no
# formula is printed here. Two honest checks are below you: the
# finite-difference referee in the next cell will expose an analytic gradient
# that disagrees with your own loss, and the server compares against the
# reference. The result simplifies sharply — the $\sigma'$ factor is supposed
# to cancel; if yours still carries it, keep simplifying. The lesson has the
# worked derivation to verify against afterwards.

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
# Infrastructure (do not modify): finite-difference gradient check.
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
# Infrastructure (do not modify): loss-curve plot.
def plot_losses(**histories):
    for name, losses in histories.items():
        plt.plot(losses, label=name)
    plt.xlabel("iteration"); plt.ylabel("log-loss"); plt.legend(); plt.show()

# What a healthy run looks like — and what a broken one looks like. The same
# code, two learning rates: 0.5 descends monotonically; 12.0 overshoots and
# oscillates upward. If your curve looks like the second one, your gradient
# may be fine and your learning rate is not.
_demo_rng = np.random.default_rng(1)
_Xd = _demo_rng.normal(size=(100, 3))
_yd = (_demo_rng.random(100) < sigmoid(_Xd @ np.array([1.5, -2.0, 1.0]))).astype(float)
plot_losses(**{"lr=0.5 (healthy)": fit(_Xd, _yd, 0.5, 120)[2],
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
# Derive its gradient yourself — it is one line on top of checkpoint 3, but
# two details carry the points: what the derivative of $\lambda\|w\|^2$
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
distill.check("l2", loss_grad_l2)

# %% [markdown]
# ## 6. Newton's method (optional, the interview classic)
#
# "Logistic regression has no closed form — so what converges faster than
# gradient descent?" The expected answer is Newton's method (a.k.a. IRLS),
# and the expected follow-up is the Hessian. The generic step, over the
# stacked parameter $\theta = (w, b)$:
#
# $$\theta \leftarrow \theta - H^{-1} \nabla_\theta L$$
#
# You already derived $\nabla_\theta L$ in checkpoint 3. **Derive the Hessian
# yourself** — differentiate the gradient once more; the same $\sigma'$ that
# cancelled there now stays, as a per-example weight. Single-digit step
# counts reach what GD needs thousands of iterations for — the checkpoint
# trains in eight.
#
# Implementation notes: stack a column of ones onto X so the intercept rides
# along in $\theta$; solve the linear system (`np.linalg.solve`), never
# invert; record `log_loss` before each step, like `fit`.

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
distill.check("newton", newton)

# %% [markdown]
# ## 7. Implement AUC
#
# Before the open task you need a way to score yourself — so build the scorer.
# "Implement ROC-AUC" is itself a standard interview exercise, because the
# elegant route is not the ROC curve at all: AUC is the probability that a
# random positive outscores a random negative (ties count half), which makes
# it a rank statistic. With $R_1$ the sum of the positives' ranks among all
# $n_1 + n_0$ scores:
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
# ## 8. Open task: diagnose real tumors
#
# `data/train.csv` is the Wisconsin breast-cancer diagnostic dataset: 400
# fine-needle aspirates, 30 measured features per tumor (radii, textures,
# concavities — columns 0–29), label in column 30 (1 = benign). Fit whatever
# logistic-regression pipeline you like **using only the code you wrote
# above**, predict probabilities for the 169 tumors in `data/holdout_X.csv`,
# and submit them. The server scores AUC against labels you don't have; the
# passing threshold is shown on the lesson page. Attempts are limited per
# day, so validate locally before you submit.
#
# This checkpoint is optional — but it is the lab. Everything before it was
# parts; this is the machine.
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
w, b, losses = fit((X_tr - mu) / sd, y_tr, lr=1.0, iters=2000)
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
# smoothness ≈ 0.1). Gradient descent on raw features crawls. Standardize —
# and standardize the holdout with the **train** mean and std, not its own:
# the holdout is data you pretend arrived after training.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# load train.csv → X (cols 0–29), y (col 30); load holdout_X.csv
# mu, sd = train stats;  X ← (X − mu)/sd;  X_ho ← (X_ho − mu)/sd
# w, b ← fit(X, y, lr≈1, iters≈2000)      # watch plot_losses(losses)
# preds ← sigmoid(X_ho @ w + b)
# ```
# To estimate your AUC before spending an attempt, hold out ~80 rows of
# train.csv yourself and score them with YOUR `roc_auc` from checkpoint 7 —
# you have both the labels and the scorer.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# With standardization, `lr=1.0, iters=2000, λ=0` clears the threshold with
# room to spare. If your loss curve rises, reread the lr=12 plot above.
# </details>

# %% [markdown]
# ## 9. Written answer: why not squared error?
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
