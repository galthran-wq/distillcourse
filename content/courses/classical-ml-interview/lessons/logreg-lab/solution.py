# %% [markdown]
# # Lab: logistic regression from scratch
#
# You will build a complete logistic-regression classifier with nothing but
# numpy: the sigmoid, a numerically stable log-loss, its gradient, a batch
# gradient-descent trainer, L2 regularization — and then use your own code to
# diagnose real tumors, submitting predictions against held-out labels you
# never see.
#
# Ground rules:
#
# - **No sklearn, no scipy** — the model is yours end to end. (Using them to
#   sanity-check on your own machine is fine; the graded work is numpy.)
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go; partial
#   completion is normal — the last two checkpoints are optional.

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
# ## 2. Log-loss, without blowing up
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
# Differentiating the loss gives the cleanest gradient in classical ML — the
# same shape as least squares, with the residual $p - y$:
#
# $$\nabla_w L = \frac{1}{n} X^\top (p - y), \qquad
# \frac{\partial L}{\partial b} = \frac{1}{n}\sum_i (p_i - y_i)$$
#
# (The derivation is in the logistic-regression lesson: the $\sigma'$ factor
# cancels against the log's derivative.)

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
# lesson is a penalty on the weights. Combined objective and its gradient:
#
# $$L_{\lambda}(w, b) = L(w, b) + \lambda \|w\|^2, \qquad
# \nabla_w L_\lambda = \nabla_w L + 2\lambda w$$
#
# The intercept is **not** penalized: $b$ absorbs the base rate of the
# positive class and says nothing about model complexity.

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
# ## 6. Open task: diagnose real tumors
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
# Stuck? Open the hints in order.
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
# train.csv yourself and score against them (you have the labels there).
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# With standardization, `lr=1.0, iters=2000, λ=0` clears the threshold with
# room to spare. If your loss curve rises, reread the lr=12 plot above.
# </details>

# %% [markdown]
# ## 7. Written answer: why not squared error?
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
