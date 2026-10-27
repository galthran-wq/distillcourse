# %% [markdown]
# # Lab: an Isolation Forest and an autoencoder from scratch
#
# The module ran its label-free scorers through library calls: a forest of
# random isolation trees, a network that reproduces payments, a distance from
# the mean. On day 2 of the ULB card file the distance and both forests
# ranked the frauds at a ROC-AUC of 0.96, level with a logistic regression
# trained on day 1's labels, and the autoencoder below that: 0.86 trained on
# all rows, 0.92 on genuine ones. In the day's top 100 the label-free scores
# put between 8 and 38 frauds, where the regression put 81. A library
# call hides the details those numbers depend on: which $n$ the score is
# normalised by, what a tree charges a point it stopped splitting, which
# rows the network learnt to reproduce, and in which coordinates a new
# payment is placed. Each is one line, and each can be wrong without any
# error being raised.
#
# Here you build both scorers in numpy from their definitions, and check
# each build against something that does not depend on your own code: the
# forest against the closed forms of its normaliser and the paths of a
# planted outlier, the network's gradient against finite differences. Then
# both score the ULB file, trained on day 1 and judged on later payments.
#
# One function per checkpoint: `c_n` with `isolation_score`, `build_itree`,
# `path_length`, `isolation_forest_scores`, `ae_forward` with `ae_loss`,
# `ae_backward`, and `reconstruction_scores` (which calls your
# `train_autoencoder`). Each later function calls the earlier ones, so the
# forest you submit in checkpoint 4 runs on the tree of checkpoint 2.
#
# Ground rules:
#
# - Inside the graded functions, numpy only: no `sklearn.ensemble`, no
#   autograd. Comparing your scores with scikit-learn's `IsolationForest` on
#   your own machine is fine; its random draws differ from the ones the
#   checker fixes, so expect the same order, not the same digits.
# - The data loaders, the finite-difference referee, the average-precision
#   function, k-means and every plotting helper ship complete. They are
#   infrastructure: read them, do not edit them.
# - The seven exact checkpoints are the required set. The written answer and
#   the open task at the end are optional; partial completion is a normal
#   way to finish a lab.

# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve

import distill

distill.open_lab("fraud-ml/anomaly-scorers-lab")

# %% [markdown]
# ## 1. The yardstick and the score
#
# A random cut isolates a point after some number of cuts, its path length.
# Before path lengths can be compared across forests built on samples of
# different sizes, they need a yardstick: the isolation-forest lesson used
# the expected path of a typical point among $n$ evenly spread points,
#
# $$c(n) = 2\,(H_n - 1) = 2\left(\tfrac12 + \tfrac13 + \dots + \tfrac1n\right),
# \qquad c(0) = c(1) = 0,$$
#
# where $H_n$ is the $n$-th harmonic number. The paper prints the same
# quantity as $c(n) = 2H(n-1) - 2(n-1)/n$ (its Eq. 1); since
# $H(n-1) = H_n - 1/n$, the two are equal term for term. It is also the average cost of
# a search for an absent key in a binary search tree built from $n - 1$
# random keys. The score divides a point's mean path $E[h(x)]$ over the
# forest by the yardstick of the sample size $n$ **each tree was built on**,
# and maps the ratio into $(0, 1]$:
#
# $$s(x, n) = 2^{-E[h(x)]/c(n)}.$$
#
# A typical path gives exactly 0.5, a path near 0 gives a score near 1, and
# long paths give scores near 0. Compute the harmonic number as the sum it
# is: the approximation $H(i) \approx \ln i + 0.5772$ is good from about
# ten points up, and put into the paper's form it gives $c(2) = 0.15$ where
# one cut is certain.

# %%
def c_n(n):
    """Expected path length of a typical point among n points.

    Args:
        n: int >= 0.
    Returns:
        float: 2 * (H_n - 1), and 0.0 for n <= 1.
    """
    # BEGIN SOLUTION
    if n <= 1:
        return 0.0
    return 2.0 * float(np.sum(1.0 / np.arange(2, n + 1)))
    # END SOLUTION


def isolation_score(h, n):
    """Isolation anomaly score from mean path lengths.

    Args:
        h: (m,) array of mean path lengths E[h(x)].
        n: int, the sample size each tree was built on (n >= 2).
    Returns:
        (m,) float array, 2 ** (-h / c(n)).
    """
    # BEGIN SOLUTION
    return 2.0 ** (-np.asarray(h, dtype=float) / c_n(n))
    # END SOLUTION

# %%
# Local referees: the small cases of the isolation-forest lesson, its three
# printed yardsticks, and the score's three fixed points.
assert c_n(1) == 0.0 and np.isclose(c_n(2), 1.0) and np.isclose(c_n(3), 5 / 3)
assert np.allclose([c_n(135), c_n(256), c_n(4096)], [8.97, 10.25, 15.79], atol=0.01)
assert np.isclose(isolation_score([c_n(256)], 256)[0], 0.5)
assert isolation_score([1e-9], 256)[0] > 0.999 and isolation_score([200.0], 256)[0] < 1e-5

# %%
distill.check("path-normaliser", lambda ns, h, n: (np.array([c_n(k) for k in ns]),
                                                  isolation_score(h, n)))

# %% [markdown]
# ## 2. One isolation tree
#
# A tree is grown on a sample $X$ by cutting it at random until every point
# is alone, or until the tree reaches a height limit $l$. At a node of depth
# $e$ holding the rows $X$:
#
# - **stop** if $e \ge l$, or $X$ has at most one row, or all rows of $X$
#   are identical; the node is an external node that records how many rows
#   reached it, its **Size**;
# - **otherwise** draw an attribute $q$ uniformly among the $d$ columns, then
#   a split value $p$ uniformly between the minimum and the maximum of
#   column $q$ **among the rows at this node**, send the rows with
#   $x_q < p$ left and the rest right, and grow both children at depth
#   $e + 1$.
#
# The range is the node's, not the data set's: a cut drawn from the whole
# data's range often falls outside the node's points and separates nothing.
# The height limit makes the tree a partial model: below it, nothing is
# built, and the Size kept at a truncated node is what section 3 uses to
# charge the cuts that were never made.
#
# The checker replays your random draws, so their order is part of the
# contract: at each internal node, first `q = rng.integers(d)`, then
# `p = rng.uniform(lo, hi)`; grow the whole left subtree before the right.
# Nodes are plain dicts:
#
# - external: `{"size": m}`;
# - internal: `{"attr": q, "split": p, "left": <node>, "right": <node>}`.

# %%
def build_itree(X, height_limit, rng, depth=0):
    """Grow one isolation tree.

    Args:
        X: (m, d) float array, the rows reaching this node.
        height_limit: int l; a node at depth >= l is external.
        rng: numpy Generator; draws q = rng.integers(d), then
            p = rng.uniform(min, max of column q in X), left subtree first.
        depth: int, depth e of this node (0 at the root).
    Returns:
        dict: {"size": m} for an external node, or
        {"attr": q, "split": p, "left": node, "right": node}.
    """
    # BEGIN SOLUTION
    if depth >= height_limit or len(X) <= 1 or np.all(X == X[0]):
        return {"size": len(X)}
    q = int(rng.integers(X.shape[1]))
    p = float(rng.uniform(X[:, q].min(), X[:, q].max()))
    left = X[:, q] < p
    return {"attr": q, "split": p,
            "left": build_itree(X[left], height_limit, rng, depth + 1),
            "right": build_itree(X[~left], height_limit, rng, depth + 1)}
    # END SOLUTION

# %%
# Infrastructure (do not modify): a tree as a table, and the cuts of one tree
# drawn over 2-D data.
def tree_table(tree, depth=0):
    """Pre-order rows [depth, attr, split, size]: attr = -1 and split = 0 at
    an external node, size = 0 at an internal one."""
    if "size" in tree:
        return np.array([[depth, -1, 0.0, tree["size"]]])
    return np.vstack([[depth, tree["attr"], tree["split"], 0],
                      tree_table(tree["left"], depth + 1),
                      tree_table(tree["right"], depth + 1)])


def plot_cuts(tree, X, title="", ax=None):
    ax = ax or plt.subplots(figsize=(4.5, 4.5))[1]
    ax.scatter(X[:, 0], X[:, 1], s=8, color="0.3")

    def draw(node, box):
        if "size" in node:
            return
        (x0, x1), (y0, y1) = box
        p = node["split"]
        if node["attr"] == 0:
            ax.plot([p, p], [y0, y1], color="C0", lw=0.8)
            draw(node["left"], ((x0, p), (y0, y1))); draw(node["right"], ((p, x1), (y0, y1)))
        else:
            ax.plot([x0, x1], [p, p], color="C0", lw=0.8)
            draw(node["left"], ((x0, x1), (y0, p))); draw(node["right"], ((x0, x1), (p, y1)))

    pad = 0.5
    draw(tree, ((X[:, 0].min() - pad, X[:, 0].max() + pad), (X[:, 1].min() - pad, X[:, 1].max() + pad)))
    ax.set_title(title, fontsize=9); ax.set_xticks([]); ax.set_yticks([])
    return ax

# %%
# Local referees on a 64-point sample: every row ends in exactly one external
# node, no node is deeper than the limit, and a node splits only when it can.
_X = np.random.default_rng(0).normal(size=(64, 2))
_t = tree_table(build_itree(_X, 6, np.random.default_rng(1)))
_leaves = _t[_t[:, 1] == -1]
assert _leaves[:, 3].sum() == 64 and _t[:, 0].max() <= 6
assert np.all((_leaves[:, 0] == 6) | (_leaves[:, 3] <= 1))
# With no height limit to speak of, every row is isolated.
_full = tree_table(build_itree(_X, 1000, np.random.default_rng(1)))
assert np.all(_full[_full[:, 1] == -1, 3] == 1)

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# The function is the definition above, read top to bottom: one `if` for the
# three stopping conditions, two draws, one boolean mask, two recursive
# calls. The mask is computed once and used for both children (`X[mask]`,
# `X[~mask]`), so every row goes to exactly one side.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# if depth >= height_limit or rows <= 1 or all rows equal: return {"size": rows}
# q = rng.integers(d)
# p = rng.uniform(min of X[:, q], max of X[:, q])
# mask = X[:, q] < p
# return {"attr": q, "split": p,
#         "left":  build_itree(X[mask],  ..., depth + 1),
#         "right": build_itree(X[~mask], ..., depth + 1)}
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# The draws, with the casts that keep the dict printable:
#
# ```python
# q = int(rng.integers(X.shape[1]))
# p = float(rng.uniform(X[:, q].min(), X[:, q].max()))
# ```
# </details>

# %%
distill.check("itree-build", lambda X, l, rng: tree_table(build_itree(X, l, rng)))

# %% [markdown]
# The cuts of one tree on the 64-point sample with three points moved far
# out, at height limit 6 and with no limit. The far points are cut off in
# the first few cuts; the crowd in the middle needs many more, and at the
# limit of 6 part of it is left in nodes holding several points.

# %%
_X = np.random.default_rng(0).normal(size=(64, 2))
_X[:3] += [5.0, 4.0]
fig, axes = plt.subplots(1, 2, figsize=(9, 4.5))
plot_cuts(build_itree(_X, 6, np.random.default_rng(3)), _X, "height limit 6", axes[0])
plot_cuts(build_itree(_X, 1000, np.random.default_rng(3)), _X, "no height limit", axes[1])
plt.show()

# %% [markdown]
# ## 3. Path length, with the cuts a truncated node never made
#
# A point's path length is the number of edges from the root to the
# external node it falls into: at each internal node it goes left if
# $x_q < p$, right otherwise, and the count goes up by one. Ending there
# would charge every point stopped by the height limit the depth of the
# limit, as if it had been isolated, however many rows it shares its node
# with. The external node remembers its Size, so the path is completed with
# the expected number of cuts a full subtree on those rows would have
# taken:
#
# $$h(x) = e + c(\text{Size}),$$
#
# where $e$ is the depth of the external node. At a node holding one row
# $c(1) = 0$ and nothing is added.
#
# Write it for a whole matrix of points at once: split the rows with the
# node's mask and recurse on each side, rather than walking one point at a
# time. The forest of section 4 scores hundreds of thousands of payments
# through a hundred trees, and a Python loop over the points would take
# minutes where the masks take a second.

# %%
def path_length(X, tree, depth=0):
    """Path length of every row of X through one tree.

    Args:
        X: (m, d) float array of points.
        tree: a node as built by build_itree.
        depth: int, depth of `tree` (0 at the root).
    Returns:
        (m,) float array: depth of the external node reached plus
        c(Size) of that node; left when x[attr] < split.
    """
    # BEGIN SOLUTION
    if "size" in tree:
        return np.full(len(X), depth + c_n(tree["size"]))
    left = X[:, tree["attr"]] < tree["split"]
    out = np.empty(len(X))
    out[left] = path_length(X[left], tree["left"], depth + 1)
    out[~left] = path_length(X[~left], tree["right"], depth + 1)
    return out
    # END SOLUTION

# %%
# Local referee: a hand-made tree. Point a goes left at the root and ends
# alone at depth 1; b goes right, then right, and ends at depth 2 in a node
# that still holds 3 rows: 2 + c(3) = 3.67.
_tree = {"attr": 0, "split": 0.0,
         "left": {"size": 1},
         "right": {"attr": 1, "split": 1.0, "left": {"size": 2}, "right": {"size": 3}}}
assert np.allclose(path_length(np.array([[-1.0, 0.0], [1.0, 2.0], [1.0, 0.0]]), _tree),
                   [1.0, 2 + 5 / 3, 2 + 1.0])

# %%
distill.check("path-length", path_length)

# %% [markdown]
# ## 4. The forest
#
# One tree is one random partition; the forest averages the path over $t$
# trees, each grown on its own **sub-sample** of $\psi$ rows drawn without
# replacement, with height limit $l = \lceil \log_2 \psi \rceil$. The
# sub-sample is part of the detector, not a shortcut: a small sample thins
# the normal crowd, so fewer normal points sit beside an anomaly and cut
# it off later (swamping), and a clump of anomalies is broken up, so fewer
# of them hide each other (masking). Sampling **with** replacement puts
# duplicate rows in a tree, which can never be cut apart and sit in nodes
# that look like crowds.
#
# Every point scored is then compared with the yardstick of the sample each
# tree saw, $c(\psi)$, not with the size of the data set: the data set's size
# describes no tree in the forest. And the score is computed from the
# **mean path**, $s = 2^{-\bar h / c(\psi)}$ with $\bar h$ the average of
# the $t$ path lengths, not as the mean of $t$ per-tree scores.
#
# The draws, in the order the checker replays them: for each tree in turn,
# `idx = rng.choice(N, psi, replace=False)`, then `build_itree(X_fit[idx],
# l, rng)` with the same `rng`. When $\psi$ exceeds the number of rows
# $N$, use $\psi = N$.

# %%
def isolation_forest_scores(X_fit, X_score, n_trees, psi, rng):
    """Isolation-forest anomaly scores.

    Args:
        X_fit: (N, d) rows the trees are grown on.
        X_score: (m, d) rows to score.
        n_trees: int t, number of trees.
        psi: int, sub-sample size (capped at N).
        rng: numpy Generator; per tree, rng.choice(N, psi, replace=False),
            then build_itree(..., rng).
    Returns:
        (m,) float array of scores s = 2 ** (-mean path / c(psi)).
    """
    # BEGIN SOLUTION
    psi = min(psi, len(X_fit))
    limit = int(np.ceil(np.log2(psi)))
    total = np.zeros(len(X_score))
    for _ in range(n_trees):
        idx = rng.choice(len(X_fit), psi, replace=False)
        total += path_length(X_score, build_itree(X_fit[idx], limit, rng))
    return isolation_score(total / n_trees, psi)
    # END SOLUTION

# %% [markdown]
# The forest's first test is the one its paper opened with: 135 points from
# a Gaussian and one planted outside it. Grow trees on all 136 points with
# no height limit and follow two points as trees are added: the outlier
# $x_o$ and the normal point nearest the centre, $x_i$. Each tree gives each
# a path; the running mean settles as the trees accumulate. The paper's own
# cloud gave about 4 cuts for its outlier and about 12.8 for its central
# point; this cloud is another draw, so expect the same gap, not the same
# digits.

# %%
_rng = np.random.default_rng(7)
toy = np.vstack([_rng.normal(size=(135, 2)), [[3.2, 3.6]]])
x_i, x_o = toy[np.argmin(np.sum(toy[:135] ** 2, axis=1))], toy[135]
paths = np.array([path_length(np.array([x_i, x_o]), build_itree(toy, 1000, _rng))
                  for _ in range(1000)])
running = np.cumsum(paths, axis=0) / np.arange(1, 1001)[:, None]
fig, ax = plt.subplots(figsize=(6, 3))
ax.semilogx(np.arange(1, 1001), running[:, 0], label=f"x_i, central point: {running[-1, 0]:.2f}")
ax.semilogx(np.arange(1, 1001), running[:, 1], label=f"x_o, outlier: {running[-1, 1]:.2f}")
ax.axhline(c_n(136), color="0.6", ls=":", label=f"c(136) = {c_n(136):.2f}")
ax.set_xlabel("number of trees"); ax.set_ylabel("mean path length"); ax.legend(fontsize=8)
plt.show()
assert running[-1, 1] < 6 < 10 < running[-1, 0]

# %%
# Local referees: the outlier outscores every normal point, and a forest is
# reproducible from its seed.
_s = isolation_forest_scores(toy, toy, 100, 64, np.random.default_rng(0))
assert _s[135] > _s[:135].max() and np.all((_s > 0) & (_s <= 1))
assert np.array_equal(_s, isolation_forest_scores(toy, toy, 100, 64, np.random.default_rng(0)))

# %%
distill.check("iforest-score", isolation_forest_scores)

# %% [markdown]
# ### Masking, made visible
#
# A clump of 40 anomalies placed tightly together away from 1,000 normal
# points. Grown on all 1,040 rows, a tree needs many cuts to separate the
# clump's members from one another, and they look like a crowd of their
# own. Grown on 64 rows, a tree sees two or three of them, which are cut off
# quickly. The ROC-AUC below is the probability that a clump member
# outscores a normal point.

# %%
_rng = np.random.default_rng(11)
clumped = np.vstack([_rng.normal(size=(1000, 2)), _rng.normal([3.5, 3.5], 0.08, size=(40, 2))])
clump_y = np.r_[np.zeros(1000), np.ones(40)]
for psi in (1040, 256, 64):
    s = isolation_forest_scores(clumped, clumped, 100, psi, np.random.default_rng(0))
    print(f"psi = {psi:5d}: ROC-AUC {roc_auc_score(clump_y, s):.3f}, "
          f"clump median score {np.median(s[1000:]):.3f}")

# %% [markdown]
# ## 5. A tied-weight autoencoder: forward pass and loss
#
# The second scorer learns what genuine payments look like by learning to
# reproduce them through a bottleneck. A payment $x \in \mathbb{R}^d$ is
# encoded into $k < d$ numbers and decoded back; a payment unlike the ones
# the network was trained on comes back badly, and its reconstruction error
# is its anomaly score.
#
# The network here is the smallest one that does this: one hidden layer
# with a $\tanh$ code and **tied weights**, the decoder reusing the
# encoder's matrix transposed. With $W \in \mathbb{R}^{d \times k}$, a code
# bias $b_1 \in \mathbb{R}^k$ and an output bias $b_2 \in \mathbb{R}^d$, for
# a batch $X \in \mathbb{R}^{n \times d}$ (one payment per row):
#
# $$Z = \tanh(X W + b_1), \qquad \hat X = Z W^\top + b_2 .$$
#
# The output is linear: the inputs are standardised columns, which take any
# real value. Each row's error is the mean of its squared differences over
# the $d$ columns, and the training loss is the mean over rows:
#
# $$e_i = \frac{1}{d}\sum_{j=1}^{d} (\hat x_{ij} - x_{ij})^2, \qquad
#   L = \frac{1}{n}\sum_{i=1}^{n} e_i .$$
#
# Tying the weights halves the parameters, and it makes $W$ appear twice in
# the network, which section 6 has to account for.

# %%
def ae_forward(X, W, b1, b2):
    """Forward pass of the tied-weight autoencoder.

    Args:
        X: (n, d) inputs. W: (d, k). b1: (k,). b2: (d,).
    Returns:
        (Z, X_hat): (n, k) codes tanh(X W + b1) and (n, d)
        reconstructions Z W^T + b2.
    """
    # BEGIN SOLUTION
    Z = np.tanh(X @ W + b1)
    return Z, Z @ W.T + b2
    # END SOLUTION


def ae_loss(X, W, b1, b2):
    """Per-row reconstruction error.

    Args:
        X: (n, d) inputs. W: (d, k). b1: (k,). b2: (d,).
    Returns:
        (n,) array e_i = mean over the d columns of (x_hat_ij - x_ij)^2.
    """
    # BEGIN SOLUTION
    return np.mean((ae_forward(X, W, b1, b2)[1] - X) ** 2, axis=1)
    # END SOLUTION

# %%
# Local referees: with W = 0 the code is tanh(b1), the output is b2, and the
# error is the mean squared distance from b2. A one-column network with a
# small weight is nearly linear: x_hat ~ w^2 x.
_X = np.array([[1.0, 2.0], [3.0, -1.0]])
assert np.allclose(ae_loss(_X, np.zeros((2, 1)), np.zeros(1), np.array([1.0, 0.0])), [2.0, 2.5])
_Z, _Xh = ae_forward(np.array([[0.5]]), np.array([[1e-3]]), np.zeros(1), np.zeros(1))
assert _Z.shape == (1, 1) and np.isclose(_Xh[0, 0], 1e-6 * 0.5, rtol=1e-5)

# %%
distill.check("autoencoder-forward-loss",
              lambda X, W, b1, b2: (*ae_forward(X, W, b1, b2), ae_loss(X, W, b1, b2)))

# %% [markdown]
# ## 6. The gradient, refereed by finite differences
#
# Training moves $W$, $b_1$ and $b_2$ against the gradient of the mean loss
#
# $$L(W, b_1, b_2) = \frac{1}{nd}\sum_{i=1}^{n}\sum_{j=1}^{d}
#   \Bigl(\bigl[\tanh(XW + b_1)\,W^\top + b_2\bigr]_{ij} - x_{ij}\Bigr)^2 .$$
#
# Derive it with the chain rule, from the loss back to the parameters, and
# write it out. The derivation is the checkpoint, so no formula for it is
# printed here; three facts to keep in view:
#
# - $W$ enters twice, in the encoder and in the decoder, and its gradient
#   is the sum of what both uses contribute;
# - the derivative of $\tanh$ is written most cheaply through its output:
#   $\tanh'(a) = 1 - \tanh^2(a)$;
# - $L$ is a mean over $n \cdot d$ squared differences.
#
# Your derivation is judged locally before it is submitted. The referee
# below perturbs each parameter entry by $\pm\varepsilon$, computes
# $\bigl(L(\theta + \varepsilon) - L(\theta - \varepsilon)\bigr)/2\varepsilon$
# from your `ae_loss`, and compares it with your gradient. A central
# difference is accurate to about $\varepsilon^2$, so on a correct gradient
# the relative error is near $10^{-8}$; a missing term shows up as an error
# of order 1.

# %%
def ae_backward(X, W, b1, b2):
    """Gradient of the mean reconstruction loss L = mean(ae_loss(X, ...)).

    Args:
        X: (n, d) inputs. W: (d, k). b1: (k,). b2: (d,).
    Returns:
        (dW, db1, db2): arrays shaped like W, b1, b2.
    """
    # BEGIN SOLUTION
    Z, X_hat = ae_forward(X, W, b1, b2)
    G = 2.0 * (X_hat - X) / X.size          # dL / dX_hat
    dA = (G @ W) * (1.0 - Z ** 2)          # dL / d(XW + b1)
    dW = X.T @ dA + G.T @ Z                # encoder use + decoder use
    return dW, dA.sum(axis=0), G.sum(axis=0)
    # END SOLUTION

# %%
# Infrastructure (do not modify): the finite-difference referee.
def numerical_gradient(X, W, b1, b2, eps=1e-6):
    grads = []
    for P in (W, b1, b2):
        g = np.zeros_like(P)
        for idx in np.ndindex(P.shape):
            old = P[idx]
            P[idx] = old + eps; up = ae_loss(X, W, b1, b2).mean()
            P[idx] = old - eps; down = ae_loss(X, W, b1, b2).mean()
            P[idx] = old
            g[idx] = (up - down) / (2 * eps)
        grads.append(g)
    return grads


def relative_error(a, b):
    return np.max(np.abs(a - b) / np.maximum(1e-8, np.abs(a) + np.abs(b)))


_rng = np.random.default_rng(5)
_X = _rng.normal(size=(12, 6))
_W, _b1, _b2 = _rng.normal(0, 0.5, (6, 3)), _rng.normal(0, 0.1, 3), _rng.normal(0, 0.1, 6)
for name, mine, ref in zip(("dW", "db1", "db2"), ae_backward(_X, _W, _b1, _b2),
                           numerical_gradient(_X, _W, _b1, _b2)):
    err = relative_error(mine, ref)
    print(f"{name}: relative error {err:.1e}")
    assert err < 1e-6, f"{name} disagrees with finite differences"

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Name the intermediate quantities of the forward pass, $A = XW + b_1$,
# $Z = \tanh(A)$, $\hat X = Z W^\top + b_2$, and go backwards one at a time,
# carrying the gradient of $L$ with respect to each, shaped like the
# quantity itself: first $\hat X$, then $Z$, then $A$. Each parameter's
# gradient is read off where the parameter is used. $b_2$ and the decoder's
# $W^\top$ are used in the last step; $b_1$ and the encoder's $W$ in the
# first. Check every product by its shapes: $(d \times n)(n \times k)$ for
# a $W$-shaped term.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# G   = dL/dX_hat                    (n, d)   from the mean of squares
# db2 = G summed over rows           (d,)
# dZ  = G @ W                        (n, k)   through X_hat = Z W^T
# dA  = dZ * tanh'(A), via Z         (n, k)
# db1 = dA summed over rows          (k,)
# dW  = (encoder term from X and dA) + (decoder term from G and Z)    (d, k)
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# G = 2.0 * (X_hat - X) / X.size
# dA = (G @ W) * (1.0 - Z ** 2)
# dW = X.T @ dA + G.T @ Z
# ```
# </details>

# %%
distill.check("autoencoder-gradient", ae_backward)

# %% [markdown]
# ## 7. Training on genuine payments, scoring by reconstruction
#
# The network becomes a scorer in three steps, each with one way to go
# wrong:
#
# 1. **Train on genuine payments only.** A network fitted to a sample that
#    contains frauds learns to reproduce those frauds too, and scores them
#    low. Keeping only the training rows labelled genuine uses the labels,
#    so the result belongs beside the supervised models in a comparison; on
#    the ULB file it was the difference between an average precision of
#    0.12 and 0.31.
# 2. **Standardise with the training rows' statistics**, and place every
#    payment to be scored with that same mean and standard deviation. The
#    ULB lesson's flood came from standardising a test split with its own
#    statistics; without standardising at all, a column measured in large
#    units dominates the squared error.
# 3. **Minibatch gradient descent** with your `ae_backward`.
#
# `train_autoencoder` does step 3 from a fixed starting point; the checker
# replays its draws, in this order: `W = rng.normal(0, 1 / sqrt(d), (d, k))`,
# `b1` and `b2` zeros; then for each epoch one `order = rng.permutation(n)`,
# cut into consecutive batches of `batch_size` rows (the last may be
# shorter), each followed by one step $\theta \leftarrow \theta - \eta\,
# \nabla_\theta L_{\text{batch}}$ on all three parameters.
# `reconstruction_scores` does steps 1 and 2 around it and returns each
# scored payment's error $e_i$.

# %%
def train_autoencoder(X, k, lr, epochs, batch_size, rng):
    """Minibatch gradient descent on the mean reconstruction loss.

    Args:
        X: (n, d) training rows, already standardised.
        k: int, code size.
        lr: float, step size.
        epochs: int, passes over the data.
        batch_size: int, rows per step.
        rng: numpy Generator; draws the initial W, then one permutation per
            epoch.
    Returns:
        (W, b1, b2) after training.
    """
    # BEGIN SOLUTION
    n, d = X.shape
    W = rng.normal(0.0, 1.0 / np.sqrt(d), (d, k))
    b1, b2 = np.zeros(k), np.zeros(d)
    for _ in range(epochs):
        order = rng.permutation(n)
        for start in range(0, n, batch_size):
            batch = X[order[start:start + batch_size]]
            dW, db1, db2 = ae_backward(batch, W, b1, b2)
            W -= lr * dW
            b1 -= lr * db1
            b2 -= lr * db2
    return W, b1, b2
    # END SOLUTION


def reconstruction_scores(X_train, y_train, X_score, k, lr, epochs, batch_size, seed):
    """Reconstruction-error anomaly scores from an autoencoder trained on the
    genuine training rows.

    Args:
        X_train: (n, d) raw training rows. y_train: (n,) 0/1, 1 = fraud.
        X_score: (m, d) raw rows to score.
        k, lr, epochs, batch_size: passed to train_autoencoder.
        seed: int; train_autoencoder gets np.random.default_rng(seed).
    Returns:
        (m,) array: ae_loss of each scored row, standardised with the mean
        and standard deviation of the genuine training rows.
    """
    # BEGIN SOLUTION
    genuine = X_train[np.asarray(y_train) == 0]
    mean, std = genuine.mean(axis=0), genuine.std(axis=0)
    params = train_autoencoder((genuine - mean) / std, k, lr, epochs, batch_size,
                               np.random.default_rng(seed))
    return ae_loss((X_score - mean) / std, *params)
    # END SOLUTION

# %%
# Local referee: points on a curve in 3-D with a few off it. Trained on the
# curve, the network reproduces it better than the points off it, and the
# training loss falls.
_rng = np.random.default_rng(9)
_t = _rng.uniform(-1, 1, 600)
_curve = np.c_[_t, _t ** 2, np.sin(2 * _t)] + _rng.normal(0, 0.03, (600, 3))
_y = np.r_[np.zeros(580), np.ones(20)]
_curve[580:] = _rng.normal(0, 0.8, (20, 3))
_e = reconstruction_scores(_curve, _y, _curve, 1, 0.1, 30, 32, 0)
assert np.median(_e[580:]) > 5 * np.median(_e[:580])
_g = (_curve[:580] - _curve[:580].mean(0)) / _curve[:580].std(0)
_start = ae_loss(_g, *train_autoencoder(_g, 1, 0.1, 0, 32, np.random.default_rng(0))).mean()
_end = ae_loss(_g, *train_autoencoder(_g, 1, 0.1, 30, 32, np.random.default_rng(0))).mean()
assert _end < 0.7 * _start

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Write `train_autoencoder` first and check that its loss falls on the
# referee's curve. The order of the draws is the whole difficulty: the
# initial `W` comes from the generator before anything else, and the
# permutation is drawn inside the epoch loop, once per epoch, never once for
# all epochs. In `reconstruction_scores`, compute the mean and standard
# deviation once, from the genuine training rows, and apply them to both
# matrices.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# train_autoencoder:
#     W = rng.normal(0, 1/sqrt(d), (d, k)); b1 = zeros(k); b2 = zeros(d)
#     repeat epochs times:
#         order = rng.permutation(n)
#         for start in 0, batch_size, 2*batch_size, ...:
#             rows = order[start : start + batch_size]
#             step W, b1, b2 by -lr * ae_backward(X[rows], W, b1, b2)
#
# reconstruction_scores:
#     G = genuine rows of X_train; mean, std of G
#     params = train_autoencoder((G - mean)/std, ..., default_rng(seed))
#     return ae_loss((X_score - mean)/std, *params)
# ```
# </details>

# %%
distill.check("train-autoencoder", reconstruction_scores)

# %% [markdown]
# ## The ULB file: built on the morning, judged on the evening
#
# `data/ulb_day1.csv.gz` is the first day of the ULB card file: 144,786
# online card payments of European cardholders from September 2013, 281 of
# them fraud, released by the Machine Learning Group of the Université
# Libre de Bruxelles under the Open Database License (see the References
# cell). Each payment carries the seconds since the file's first payment
# (`Time`), 28 anonymous principal components `V1`–`V28` (rounded here to
# three decimals), the `Amount` and the label `Class`. The inputs are the
# components and $\log(1 + \text{Amount})$, the logarithm because amounts
# have a long tail; `Time` only splits the day.
#
# The day is split in time as a deployed scorer meets it: the scorers are
# built on the first 16 hours and judged on the last 8, which none of them
# has seen. The ULB lesson made the same cut between the two days of the
# file; this lab keeps day 2 for the open task at the end. Its baselines
# are the plain distance from the training mean in training standard
# deviations, which needs no model, and a logistic regression trained on
# the first 16 hours' labels, which is the supervised ceiling.

# %%
# Infrastructure (do not modify): loading, the split, the baselines and the
# metrics.
V_COLS = [f"V{i}" for i in range(1, 29)]


def ulb_features(frame):
    return np.c_[frame[V_COLS].to_numpy(), np.log1p(frame.Amount.to_numpy())]


day1 = pd.read_csv("data/ulb_day1.csv.gz")
X_all, y_all = ulb_features(day1), day1.Class.to_numpy()
early = day1.Time.to_numpy() < 16 * 3600
X_fit, y_fit, X_val, y_val = X_all[early], y_all[early], X_all[~early], y_all[~early]
mu, sd = X_fit.mean(axis=0), X_fit.std(axis=0)
print(f"first 16 hours: {len(X_fit):,} payments, {y_fit.sum()} frauds; "
      f"last 8 hours: {len(X_val):,} payments, {y_val.sum()} frauds")


def average_precision(labels, scores):
    """Step-sum AP with tied scores opened as one cut (the module-2 harness)."""
    labels = np.asarray(labels, dtype=float); scores = np.asarray(scores, dtype=float)
    order = np.argsort(-scores, kind="stable")
    s, y = scores[order], labels[order]
    last = np.r_[s[1:] != s[:-1], True]
    tp = np.cumsum(y)[last]
    n_alerts = np.flatnonzero(last) + 1
    return float(np.sum(np.diff(np.r_[0.0, tp / y.sum()]) * tp / n_alerts))


def precision_at(labels, scores, k=100):
    return float(np.asarray(labels)[np.argsort(-np.asarray(scores), kind="stable")[:k]].mean())


def distance_scores(X):
    return np.sqrt((((X - mu) / sd) ** 2).sum(axis=1))


def report(scores):
    print(f"{'score':34s} {'ROC-AUC':>8s} {'AP':>7s} {'P@100':>7s}")
    for name, s in scores.items():
        print(f"{name:34s} {roc_auc_score(y_val, s):8.3f} {average_precision(y_val, s):7.3f} "
              f"{precision_at(y_val, s):7.2f}")


def plot_pr(scores, title=""):
    fig, ax = plt.subplots(figsize=(5.5, 4))
    for name, s in scores.items():
        order = np.argsort(-s, kind="stable")
        tp = np.cumsum(y_val[order])
        ax.plot(tp / y_val.sum(), tp / np.arange(1, len(s) + 1), label=name, lw=1)
    ax.set_xlabel("recall"); ax.set_ylabel("precision"); ax.set_ylim(0, 1.02)
    ax.set_title(title, fontsize=9); ax.legend(fontsize=7)
    plt.show()


logreg = LogisticRegression(max_iter=1000).fit((X_fit - mu) / sd, y_fit)
baselines = {"distance from the mean (no model)": distance_scores(X_val),
             "logistic regression (labels)": logreg.decision_function((X_val - mu) / sd)}

# %% [markdown]
# Your two scorers on the same split: a forest of 100 trees on samples of
# $\psi = 256$ and of $\psi = 4{,}096$ grown on the first 16 hours (the
# forest never reads a label), and the autoencoder with a code of 16 numbers
# trained twice, on the genuine payments and on all of them (`y_train` of
# zeros keeps every row). Expect about half a minute.

# %%
scores = dict(baselines)
for psi in (256, 4096):
    scores[f"isolation forest, psi = {psi}"] = isolation_forest_scores(
        X_fit, X_val, 100, psi, np.random.default_rng(0))
scores["autoencoder, genuine rows (labels)"] = reconstruction_scores(
    X_fit, y_fit, X_val, 16, 0.5, 20, 256, 0)
scores["autoencoder, all rows"] = reconstruction_scores(
    X_fit, np.zeros_like(y_fit), X_val, 16, 0.5, 20, 256, 0)
report(scores)
plot_pr(scores, "last 8 hours of day 1")

# %% [markdown]
# The table is the ULB lesson's pattern on hours none of the scorers saw:
# every score, with labels or without, ranks the frauds at a ROC-AUC
# between 0.93 and 0.94, while the label-free ones reach an average
# precision of 0.09 to 0.17 against the regression's 0.63. The histogram of
# the reconstruction error shows where the frauds are and are not
# separated: most of them sit far above the typical genuine payment, and
# right of the dotted line, in the 100 highest errors the team would call,
# there are four genuine payments for every fraud.

# %%
fig, ax = plt.subplots(figsize=(6, 3))
e = scores["autoencoder, genuine rows (labels)"]
bins = np.logspace(np.log10(e.min()), np.log10(e.max()), 60)
ax.hist(e[y_val == 0], bins=bins, histtype="step", density=True, label="genuine")
ax.hist(e[y_val == 1], bins=bins, histtype="step", density=True, label="fraud")
ax.axvline(np.sort(e)[-100], color="C3", ls=":", label="top 100 starts here")
ax.set_xscale("log"); ax.set_xlabel("reconstruction error"); ax.set_ylabel("density")
ax.legend(fontsize=8)
plt.show()

# %% [markdown]
# ## Written answer (optional)
#
# On the last 8 hours of day 1, the forest, the autoencoder and the plain
# distance from the mean reach a ROC-AUC level with the logistic regression
# trained on labels, and an average precision between a seventh and a
# quarter of its value. Explain, from what the two metrics measure and where in the
# ranking the label-free scores make their mistakes, how both can hold. "The
# unsupervised scores are weaker" is true and is not the answer: say which
# part of the ranking AUC rewards that AP does not, and why a score that
# never saw a label fills exactly that part with genuine payments.

# %%
distill.submit_review(
    "why-auc-flatters",
    "ROC-AUC is the probability that a random fraud outscores a random genuine "
    "payment, so it averages over the whole ranking, and nearly all of its "
    "weight sits on the tens of thousands of ordinary genuine payments. "
    "The label-free scores put most frauds far above the typical genuine "
    "payment, which wins almost every such pair, so their AUC matches the "
    "regression's. Average precision weights the precision at each fraud, and "
    "that is set at the very top of the ranking, among the few hundred most "
    "extreme payments, where the team's budget reaches. There the label-free "
    "scores are filled with genuine payments that are unusual in some "
    "direction: a distance, an isolation path or a reconstruction error adds "
    "up departures along every input with no idea which directions mark "
    "fraud, so an honest payment far out on one component scores like a "
    "fraud. Those few hundred genuine payments cost almost nothing in AUC "
    "(a false-positive rate under 0.01) but push every fraud's precision "
    "down, so AP collapses. The regression learnt from labels which "
    "directions fraud departs along and keeps those genuine outliers below "
    "the frauds.",
)

# %% [markdown]
# ## Open task (optional): order the shortlist of day 2
#
# The team does not read a day's 140,000 payments. Suppose a first pass
# shortlists the payments that are most unusual by the cheapest score
# there is, the distance from day 1's mean, and the team works down the
# shortlist in the order a better score gives. `data/ulb_shortlist.csv.gz`
# is that shortlist for day 2 of the ULB file: the **1,000 payments of day
# 2 farthest from the day-1 mean** in day-1 standard deviations, over the
# same 29 inputs, sorted by time. 91 of them are fraud, out of the day's
# 211; their labels stay on the server.
#
# Every row on the shortlist is unusual, so what remains is the question
# the top 100 hangs on: which of the unusual payments are fraud. The
# server grades the order of the shortlist by ROC-AUC, the probability that
# a fraud on it outranks a genuine payment on it. Over the whole day, AUC
# rated the distance and both forests level with the regression; on the
# shortlist it measures the order among the most extreme payments, which
# is what average precision and the top 100 measure on the whole day. The
# distance orders its own shortlist at 0.61; a forest of 100 trees on
# samples of 256, fitted on day 1, at 0.61 to 0.71 depending on its seed;
# the autoencoder of this lab, trained on genuine rows, at 0.68. The bar
# is **0.76**.
#
# Write your scorer as one function, `my_scores(X_fit, y_fit, X_score)`,
# returning one score per row of `X_score`, higher meaning more suspicious.
# Use no labels in what it scores; `y_fit` is there for the autoencoder's
# genuine-only training, which the ULB lesson counts among the uses of
# labels, and the server cannot tell which you used. The cell after it runs
# your function twice: fitted on the first 16 hours and judged on the same
# kind of shortlist of the last 8 (the 0.7% farthest from the mean, with its
# labels, for the curve below and for choosing between candidates), then
# fitted on all of day 1 and run on the day-2 shortlist for submission.
# Choose on the evening shortlist, submit once. Hints follow the plot; try
# first.

# %%
# Infrastructure (do not modify): k-means for any cluster-based score.
def kmeans(X, K, seed, n_init=5, iters=30):
    """Lloyd's k-means from n_init random starts; returns the (K, d) centres
    of the start with the smallest within-cluster sum of squares."""
    rng = np.random.default_rng(seed)
    best, best_C = np.inf, None
    for _ in range(n_init):
        C = X[rng.choice(len(X), K, replace=False)]
        for _ in range(iters):
            D = (X ** 2).sum(1)[:, None] - 2 * X @ C.T + (C ** 2).sum(1)[None]
            a = D.argmin(axis=1)
            C = np.array([X[a == j].mean(axis=0) if np.any(a == j) else C[j] for j in range(K)])
        inertia = D[np.arange(len(X)), a].sum()
        if inertia < best:
            best, best_C = inertia, C
    return best_C


def nearest_centre(X, C):
    """(assignment, distance) of every row of X to its nearest centre."""
    D = np.maximum((X ** 2).sum(1)[:, None] - 2 * X @ C.T + (C ** 2).sum(1)[None], 0.0)
    a = D.argmin(axis=1)
    return a, np.sqrt(D[np.arange(len(X)), a])


shortlist = pd.read_csv("data/ulb_shortlist.csv.gz")
X_short = ulb_features(shortlist)
evening = np.argsort(-distance_scores(X_val), kind="stable")[: round(len(X_val) * 1000 / 140_021)]
print(f"day-2 shortlist: {len(X_short):,} payments; evening shortlist: {len(evening)} payments, "
      f"{y_val[evening].sum()} frauds")

# %%
# BEGIN SOLUTION
def rank(s):
    return np.argsort(np.argsort(s, kind="stable"), kind="stable") / (len(s) - 1)


def my_scores(X_fit, y_fit, X_score):
    # Two kinds of evidence: how quickly random cuts isolate a payment, with a
    # sample large enough that a clump of frauds is not cut off as a crowd,
    # and how small the k-means cluster it falls into is, with ties inside a
    # cluster broken by distance to the centre. Averaged as ranks, since the
    # two are on unrelated scales.
    forest = isolation_forest_scores(X_fit, X_score, 300, 4096, np.random.default_rng(0))
    m, s = X_fit.mean(axis=0), X_fit.std(axis=0)
    C = kmeans((X_fit - m) / s, 12, 0)
    sizes = np.bincount(nearest_centre((X_fit - m) / s, C)[0], minlength=len(C))
    a, dist = nearest_centre((X_score - m) / s, C)
    small_cluster = -sizes[a] + dist / (dist.max() + 1.0)
    return rank(forest) + rank(small_cluster)
# END SOLUTION

# %%
evening_scores = my_scores(X_fit, y_fit, X_val[evening])
holdout_scores = my_scores(X_all, y_all, X_short)

# %%
distill.submit_predictions("order-the-shortlist", holdout_scores)

# %%
# Infrastructure (do not modify): the ROC curve of your order on the evening
# shortlist, against the distance's own order.
fig, ax = plt.subplots(figsize=(4.5, 4.5))
for name, s in (("your scorer", evening_scores), ("distance from the mean", distance_scores(X_val[evening]))):
    fpr, tpr, _ = roc_curve(y_val[evening], s)
    ax.plot(fpr, tpr, label=f"{name}, AUC {roc_auc_score(y_val[evening], s):.3f}")
ax.plot([0, 1], [0, 1], color="0.75", ls=":")
ax.set_xlabel("false-positive rate (shortlist)"); ax.set_ylabel("true-positive rate")
ax.set_title("evening shortlist, last 8 hours of day 1", fontsize=9); ax.legend(loc="lower right", fontsize=8)
plt.show()

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# The ULB lesson's table names the candidates. A larger sample helped the
# forest on this file, because its frauds come in small clumps, which a
# 256-row sample still cuts off as crowds. The one label-free score that came
# near the supervised top read k-means by cluster size: the frauds that are
# extreme together form a small cluster of their own. Averaging two scores
# helps only when they make different mistakes at the top, and two
# distances make the same ones.
# </details>
#
# <details><summary>Hint 2 — what to compare</summary>
#
# On the evening shortlist, compare a forest with $\psi = 256$ and
# $\psi = 4{,}096$ (300 trees steady the order), the small-cluster score
# (`kmeans` on standardised training rows, each scored row ranked by the
# size of its nearest centre's cluster, smallest first, then by distance),
# and the average of a forest's and the small-cluster score's ranks. The
# number of clusters is a setting the lesson found only labels could
# choose: choose it on the evening shortlist, from about 6 to 16. The
# forest at $\psi = 4{,}096$ alone lands near the bar, above or below it
# with the seed.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# def rank(s):
#     return np.argsort(np.argsort(s, kind="stable"), kind="stable") / (len(s) - 1)
#
# def my_scores(X_fit, y_fit, X_score):
#     forest = isolation_forest_scores(X_fit, X_score, 300, 4096, np.random.default_rng(0))
#     m, s = X_fit.mean(axis=0), X_fit.std(axis=0)
#     C = kmeans((X_fit - m) / s, 12, 0)
#     sizes = np.bincount(nearest_centre((X_fit - m) / s, C)[0], minlength=len(C))
#     a, dist = nearest_centre((X_score - m) / s, C)
#     return rank(forest) + rank(-sizes[a] + dist / (dist.max() + 1.0))
# ```
# </details>

# %% [markdown]
# ## References
#
# - F. T. Liu, K. M. Ting, Z.-H. Zhou, "Isolation Forest", *IEEE ICDM*
#   2008: Sec. 2 (the 135-point Gaussian and its mean paths, Fig. 1;
#   $c(n)$, Eq. 1; the score, Eq. 2), Sec. 3 (swamping, masking,
#   sub-sampling without replacement), Sec. 4 (Algorithms 1–3: the forest,
#   the tree with height limit $\lceil\log_2\psi\rceil$, the path length
#   with the $c(\text{Size})$ adjustment).
# - Y.-A. Le Borgne, W. Siblini, B. Lebichot, G. Bontempi, *Reproducible
#   Machine Learning for Credit Card Fraud Detection — Practical Handbook*,
#   Université Libre de Bruxelles, 2022: ch. 7 (autoencoders for anomaly
#   detection, trained on genuine transactions; the isolation-forest
#   baseline).
# - V. Chandola, A. Banerjee, V. Kumar, "Anomaly Detection: A Survey", *ACM
#   Computing Surveys* 41(3), 2009: Sec. 4.1 (the replicator network and its
#   reconstruction-error score).
# - Machine Learning Group, Université Libre de Bruxelles, "Credit Card
#   Fraud Detection" (`creditcard.csv`), Open Database License:
#   https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud. The lab's files
#   are its first day and a shortlist of its second, components rounded to
#   three decimals.

# %%
distill.dump()
