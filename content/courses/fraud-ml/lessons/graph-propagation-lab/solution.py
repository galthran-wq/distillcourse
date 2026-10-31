# %% [markdown]
# # Lab: fraud propagation and a GCN on a transaction graph
#
# The graph module computed its scores with a few lines of scipy shown in
# the text and a figure of numbers: the 20-node toy's exposure ranking D, F,
# E, G, I, its feature table, the card toy's exposure 0.052 for a cardholder
# who never touched the stolen card, and on the Elliptic Bitcoin graph a
# random forest on hand-built aggregates ahead of every graph network. Each
# of those numbers rests on a line that can be wrong without any error being
# raised: which index of the transition matrix is the one the walker leaves,
# whether the restart vector sums to 1, whether the self-loop is added before
# the degree is taken, which nodes the loss is averaged over.
#
# Here you build the module's tools in numpy and scipy from an edge list, and
# check each against something that does not depend on your own code: the
# toy's printed table and ranking, the card toy's printed exposures, and,
# for the network's gradient, finite differences. Then the tools run on the
# Elliptic graph of 203,769 Bitcoin transactions.
#
# One function per checkpoint, each later one calling the earlier ones:
# `build_transition`, `union_find_components`, `restart_walk`,
# `card_exposure` with `cold_start_scores`, `egonet_features`,
# `normalized_adjacency` with `gcn_forward` and `weighted_bce`,
# `gcn_backward`, and `fit_and_score` (which calls your `train_gcn`).
#
# Ground rules:
#
# - Inside the graded functions, numpy and `scipy.sparse` only: no
#   `scipy.sparse.csgraph`, no networkx, no autograd. Comparing your results
#   with `connected_components` or networkx's PageRank on your own machine is
#   fine.
# - Everything that runs on Elliptic must stay sparse. A dense
#   $203{,}769 \times 203{,}769$ matrix needs 330 GB.
# - The data loader, the finite-difference referee, the scorers and every
#   plotting helper ship complete. They are infrastructure: read them, do not
#   edit them.
# - The eight exact checkpoints are the required set. The written answer
#   and the open task at the end are optional.

# %%
import hashlib
import os
import urllib.request
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import scipy.sparse as sp
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_recall_curve, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import QuantileTransformer

import distill

distill.open_lab("fraud-ml/graph-propagation-lab")

# %%
# Infrastructure (do not modify): what the checks compare, and the toy.
def dense(M):
    """A scipy sparse matrix or an array, as a dense float array."""
    return M.toarray() if sp.issparse(M) else np.asarray(M, dtype=float)


def sigmoid(z):
    return np.exp(-np.logaddexp(0.0, -np.asarray(z, dtype=float)))


TOY_NAMES = "ABCDEFGHIJKLMNOPQRST"
TOY_EDGES = np.array([(TOY_NAMES.index(a), TOY_NAMES.index(b)) for a, b in
                      "AB AG AH AI AO AT BC BD DE DF EF DG FG GI IK IN HK JK LM LN MN OP OQ QR QS".split()])
TOY_FRAUD = np.isin(np.arange(20), [TOY_NAMES.index(c) for c in "DEFI"]).astype(float)
TOY_POS = np.array([(330, 190), (200, 115), (120, 80), (120, 180), (50, 240), (120, 305), (225, 245),
                    (450, 260), (335, 325), (575, 385), (470, 360), (175, 465), (320, 470), (250, 405),
                    (440, 140), (500, 70), (560, 180), (640, 135), (640, 230), (300, 85)], dtype=float)


def draw_toy(sizes, title="", ax=None):
    """The 20-node toy, discs sized by `sizes`, the four frauds ringed."""
    ax = ax or plt.subplots(figsize=(5, 4))[1]
    for a, b in TOY_EDGES:
        ax.plot(*TOY_POS[[a, b]].T, color="0.75", lw=0.8, zorder=1)
    s = np.asarray(sizes, dtype=float)
    ax.scatter(*TOY_POS.T, s=4000 * s / max(s.max(), 1e-12), color="C1", alpha=0.5, zorder=2)
    ax.scatter(*TOY_POS.T, s=160, facecolor="white", zorder=3,
               edgecolor=np.where(TOY_FRAUD[:, None] > 0, [[0.85, 0.45, 0.1, 1]], [[0.4, 0.4, 0.4, 1]]),
               linewidth=np.where(TOY_FRAUD > 0, 2.2, 0.8))
    for i, name in enumerate(TOY_NAMES):
        ax.text(*TOY_POS[i], name, ha="center", va="center", fontsize=8, zorder=4)
    ax.invert_yaxis(); ax.set_aspect("equal"); ax.axis("off"); ax.set_title(title, fontsize=9)
    return ax


draw_toy(np.ones(20), "the 20-node toy: D, E, F and I are fraudulent")
plt.show()

# %% [markdown]
# ## 1. From an edge list to a transition matrix
#
# Every score in this lab multiplies by one matrix built from an edge list.
# An edge list is an `(m, 2)` integer array of pairs `(src, dst)` over nodes
# `0 .. n-1`, plus each edge's age $h$ in hours. Its weight fades with age,
#
# $$w = e^{-\gamma h},$$
#
# with $\gamma$ set from a horizon: $e^{-\gamma H} = 0.05$ gives the week
# horizon $\gamma = \ln 20 / 168 \approx 0.0178$ per hour. Several edges
# between the same pair **add** their weights: the pair's weight is a
# recency-weighted count of its payments.
#
# The walk of section 3 stands at node $j$ and moves to $i$ with probability
# proportional to the weight of the edge it follows. So the weight matrix
# $W$ is indexed `W[to, from]`, and the transition matrix divides every
# **column** by its total, the strength $s_j = \sum_i W_{ij}$ of the node
# the walker leaves:
#
# $$Q = W S^{-1}, \qquad Q_{ij} = \frac{W_{ij}}{s_j}.$$
#
# A column with no weight (a node the walker cannot leave) stays a column of
# zeros. Dividing rows instead gives $S^{-1}W$, the neighbour average,
# which is a different matrix with a different fixed point.
#
# Where the edges have a direction, `src` paid `dst`, and the walk may go
# either way. `mode` says which:
#
# - `"undirected"`: an edge joins both ways, `W[dst, src]` and `W[src, dst]`;
# - `"with"`: the walker follows the money, from `src` to `dst`, so the
#   weight goes to `W[dst, src]`;
# - `"against"`: the walker goes back along incoming payments, from `dst` to
#   `src`, so the weight goes to `W[src, dst]`. Restarted at a confirmed
#   mule, this walk reaches who fed the mule.
#
# Return both matrices as `scipy.sparse` CSR matrices: the same function
# builds the Elliptic graph in section 9. `sp.csr_matrix((vals, (rows,
# cols)), shape=(n, n))` adds the values of repeated `(row, col)` pairs, and
# `M @ sp.diags(v)` scales the columns of `M` by `v`.

# %%
def build_transition(edges, ages, gamma, n, mode):
    """Weight matrix and column-normalised transition matrix of an edge list.

    Args:
        edges: (m, 2) int array of (src, dst) pairs over nodes 0..n-1.
        ages: (m,) float array, each edge's age h in hours.
        gamma: float, decay per hour; an edge weighs exp(-gamma * h).
        n: int, number of nodes.
        mode: "undirected", "with" (W[dst, src]) or "against" (W[src, dst]).
    Returns:
        (W, Q): (n, n) scipy.sparse CSR matrices. W sums the weights of
        repeated pairs; Q = W S^-1 with s_j the j-th column sum of W, and a
        zero column where s_j = 0.
    """
    # BEGIN SOLUTION
    edges = np.asarray(edges, dtype=np.int64).reshape(-1, 2)
    w = np.exp(-gamma * np.asarray(ages, dtype=float))
    src, dst = edges[:, 0], edges[:, 1]
    if mode == "undirected":
        rows, cols, vals = np.r_[dst, src], np.r_[src, dst], np.r_[w, w]
    elif mode == "with":
        rows, cols, vals = dst, src, w
    elif mode == "against":
        rows, cols, vals = src, dst, w
    else:
        raise ValueError(mode)
    W = sp.csr_matrix((vals, (rows, cols)), shape=(n, n))
    s = np.asarray(W.sum(axis=0)).ravel()
    Q = (W @ sp.diags(1.0 / np.where(s > 0, s, 1.0))).tocsr()
    return W, Q
    # END SOLUTION

# %%
# Local referees. The toy, every edge weight 1: G has four neighbours, so a
# walker at G goes to each with probability 1/4, and every column sums to 1.
_W, _Q = build_transition(TOY_EDGES, np.zeros(25), 0.0, 20, "undirected")
_G = TOY_NAMES.index("G")
assert np.allclose(dense(_Q)[:, _G][[TOY_NAMES.index(c) for c in "ADFI"]], 0.25)
assert np.allclose(dense(_Q).sum(axis=0), 1.0) and np.allclose(dense(_W), dense(_W).T)
# A two-edge chain 0 -> 1 -> 2, ages 0 and 39 hours at the week horizon: the
# second edge has decayed to half weight; node 2 pays nobody, so the walk
# with the money cannot leave it, and against the money node 0 is the dead end.
_g = np.log(20) / 168
_W, _Q = build_transition(np.array([[0, 1], [1, 2]]), np.array([0.0, 39.0]), _g, 3, "with")
assert np.isclose(dense(_W)[2, 1], 0.5, atol=0.01) and np.allclose(dense(_Q)[:, 2], 0)
assert np.allclose(dense(build_transition(np.array([[0, 1], [1, 2]]), np.zeros(2), _g, 3, "against")[1])[:, 0], 0)
# Two payments between the same pair add.
assert np.isclose(dense(build_transition(np.array([[0, 1], [0, 1]]), np.zeros(2), _g, 2, "with")[0])[1, 0], 2.0)

# %%
def transition_check(edges, ages, gamma, n):
    return tuple(dense(M) for mode in ("undirected", "with", "against")
                 for M in build_transition(edges, ages, gamma, n, mode))


distill.check("sparse-adjacency", transition_check)

# %% [markdown]
# ## 2. Rings: connected components by union-find
#
# A ring of accounts that share cards, devices or addresses shows as a
# connected component: the nodes reachable from each other along edges in
# either direction. Direction does not matter here, since a shared device
# links two accounts whichever way the money went.
#
# Union-find keeps, for every node, a pointer `parent[v]` towards a
# representative of its component, the **root**, the one node whose
# parent is itself. It needs two operations:
#
# - `find(v)`: follow parents from `v` to the root. Then point every node
#   met on the way straight at the root (**path compression**), so the next
#   `find` from any of them takes one step;
# - `union(a, b)`: find both roots; if they differ, make one the parent of
#   the other. Linking the roots, not `a` and `b` themselves, is what merges
#   the two whole components.
#
# One pass over the edge list with a `union` per edge leaves one root per
# component. The output is canonical, so that it can be compared: every
# node is labelled with the **smallest node index in its component**, and
# the component sizes come in decreasing order, isolated nodes counted as
# components of size 1. Linking the larger root under the smaller one
# makes the root the smallest index, which gives the labels directly.
#
# Without path compression the result is the same and the cost is not: a
# chain of a hundred thousand payments built in the wrong order makes every
# `find` walk the whole chain.

# %%
def union_find_components(edges, n):
    """Weakly connected components by union-find with path compression.

    Args:
        edges: (m, 2) int array of (src, dst) pairs over nodes 0..n-1;
            direction is ignored.
        n: int, number of nodes.
    Returns:
        (labels, sizes): labels is an (n,) int array, each node's smallest
        component member; sizes is an int array of every component's size,
        largest first, isolated nodes included as size 1.
    """
    # BEGIN SOLUTION
    parent = np.arange(n)

    def find(a):
        root = a
        while parent[root] != root:
            root = parent[root]
        while parent[a] != root:
            parent[a], a = root, parent[a]
        return root

    for a, b in np.asarray(edges, dtype=np.int64).reshape(-1, 2):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)
    labels = np.array([find(v) for v in range(n)])
    sizes = np.sort(np.bincount(labels)[np.unique(labels)])[::-1]
    return labels, sizes
    # END SOLUTION

# %%
# Local referees: the toy is one piece; two triangles and a loner are three.
_lab, _sz = union_find_components(TOY_EDGES, 20)
assert np.all(_lab == 0) and list(_sz) == [20]
_lab, _sz = union_find_components(np.array([[4, 5], [5, 3], [0, 1], [2, 1], [0, 2]]), 7)
assert list(_lab) == [0, 0, 0, 3, 3, 3, 6] and list(_sz) == [3, 3, 1]
# A chain given backwards: correct with or without compression, but this is
# where compression pays. 100,000 nodes should take about a second.
_lab, _sz = union_find_components(np.c_[np.arange(99_999, 0, -1), np.arange(99_998, -1, -1)], 100_000)
assert _lab.max() == 0 and list(_sz) == [100_000]

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Write `find` as a nested function that reads and writes `parent`. First
# loop up to the root; then loop again from the start, setting each visited
# node's parent to the root. `union` is three lines. After the pass over the
# edges, call `find` on every node: that is the labelling, once the root of
# every component is its smallest member.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# parent = [0, 1, ..., n-1]
# find(a): root = a; while parent[root] != root: root = parent[root]
#          while parent[a] != root: next = parent[a]; parent[a] = root; a = next
#          return root
# for (a, b) in edges: ra, rb = find(a), find(b); if ra != rb: parent[max] = min
# labels = [find(v) for v in nodes]; sizes = counts of each label, sorted down
# ```
# </details>

# %%
distill.check("connected-components", union_find_components)

# %% [markdown]
# ## 3. The exposure score: a walk that restarts at known fraud
#
# The walker of section 1 follows an edge with probability $\alpha$ and with
# probability $1 - \alpha$ jumps back to a node drawn from a restart vector
# $e$. Put the restart on the known frauds and the share of time the walker
# spends at each node is its exposure, the fixed point of
#
# $$\xi = \alpha Q \xi + (1 - \alpha)\, e .$$
#
# $e$ is a probability vector: the seed weights you are given (1 for a
# fraud, or a weight that fades with the fraud's age) divided by their sum.
# Computed by power iteration, start from $\xi = e$, apply the right-hand
# side, and stop at the first step whose change $\lVert \xi_{\text{new}} -
# \xi \rVert_1$ falls below `tol`, returning the new vector. Each step
# shrinks the distance to the fixed point by at least the factor $\alpha$;
# on the toy at $\alpha = 0.85$, a tolerance of $10^{-10}$ is reached at
# the 96th step.
#
# On the toy with the restart on D, E, F and I at $\alpha = 0.85$, the walk
# ranks D, F, E, G, I: the unflagged G above the flagged I.

# %%
def restart_walk(Q, seeds, alpha=0.85, tol=1e-10, max_steps=1000):
    """Random walk with restart by power iteration.

    Args:
        Q: (n, n) column-normalised transition matrix, sparse or dense.
        seeds: (n,) non-negative restart weights, not all zero.
        alpha: float, follow probability.
        tol: float; stop at the first step whose L1 change is below tol.
        max_steps: int, cap on the number of steps.
    Returns:
        (n,) float array xi with xi = alpha Q xi + (1 - alpha) e,
        e = seeds / seeds.sum(), started from xi = e.
    """
    # BEGIN SOLUTION
    e = np.asarray(seeds, dtype=float)
    e = e / e.sum()
    xi = e.copy()
    for _ in range(max_steps):
        new = alpha * (Q @ xi) + (1 - alpha) * e
        if np.abs(new - xi).sum() < tol:
            return new
        xi = new
    return xi
    # END SOLUTION

# %%
# Local referee: the toy's exposure ranking and its printed values.
_, _Q = build_transition(TOY_EDGES, np.zeros(25), 0.0, 20, "undirected")
toy_xi = restart_walk(_Q, TOY_FRAUD)
top = [TOY_NAMES[i] for i in np.argsort(-toy_xi)[:5]]
print("top five:", top, np.round(np.sort(toy_xi)[::-1][:5], 3))
assert top == list("DFEGI")
assert np.allclose(np.sort(toy_xi)[::-1][:5], [0.169, 0.145, 0.114, 0.109, 0.094], atol=5e-4)
assert np.isclose(toy_xi.sum(), 1.0)
# Uniform restart is PageRank, which ranks the busy nodes: A first.
assert TOY_NAMES[np.argmax(restart_walk(_Q, np.ones(20)))] == "A"

# %%
distill.check("restart-walk", restart_walk)

# %%
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
draw_toy(restart_walk(_Q, np.ones(20)), "uniform restart (PageRank)", axes[0])
draw_toy(toy_xi, "restart at D, E, F, I (exposure)", axes[1])
plt.show()

# %% [markdown]
# ## 4. Exposure on a card graph, and a payment the graph has not seen
#
# On card data the label sits on a payment, not on a cardholder or a
# merchant, and payments age. The walk therefore runs on the tripartite
# graph: every payment is a node joined to its cardholder and to its
# merchant, both edges weighted $e^{-\gamma h}$ by the payment's age $h$.
# Node order, here and in the check: payments `0 .. P-1`, then cardholders
# `P .. P+C-1`, then merchants `P+C .. P+C+M-1`.
#
# The restart sits on the confirmed frauds, weighted by how long ago each
# was confirmed: entry $p$ of the seed vector is $e^{-\gamma r_p}$, with
# $r_p$ the hours since payment $p$ was confirmed as fraud. A payment never
# confirmed has $r_p = \infty$, which gives the weight $e^{-\infty} = 0$.
#
# The second function scores a payment made after the walk ran. A new
# payment between cardholder $c$ and merchant $m$ is a new node with two
# edges of weight 1. One step of the walk from last night's scores brings it
#
# $$\xi_{\text{new}} \approx \frac{\xi_c}{s_c + 1} + \frac{\xi_m}{s_m + 1},$$
#
# with $s$ the strength of each endpoint in last night's graph (its column
# sum of $W$), and the factor $\alpha$ dropped since it changes no ranking.
# A cardholder or merchant with no payments has $\xi = 0$ and $s = 0$.
#
# The card toy of the graph chapters checks both: five payments $p_1$ to
# $p_5$ at ages 2, 30, 5, 100 and 20 hours, the fraud $p_1$ confirmed now,
# the week horizon. The walk gives $p_1$ 0.324, $m_1$ 0.186, $c_1$ 0.175,
# $c_2$ 0.052; a first payment of $c_3$ at $m_1$ scores about 0.066 before
# any rerun.

# %%
def card_exposure(card, merchant, age, restart_age, n_cards, n_merchants, gamma, alpha=0.85):
    """Exposure of every node of the payment-cardholder-merchant graph.

    Args:
        card: (P,) int array, each payment's cardholder in 0..n_cards-1.
        merchant: (P,) int array, each payment's merchant in 0..n_merchants-1.
        age: (P,) float array, each payment's age in hours.
        restart_age: (P,) float array, hours since the payment was confirmed
            as fraud; np.inf for a payment never confirmed.
        n_cards, n_merchants: ints C and M.
        gamma: float, decay per hour.
        alpha: float, follow probability.
    Returns:
        (xi, s): (P + C + M,) float arrays in the node order payments,
        cardholders, merchants: the exposure (restart_walk, tol=1e-12) and
        each node's strength, the column sums of W.
    """
    # BEGIN SOLUTION
    P = len(card)
    n = P + n_cards + n_merchants
    pay = np.arange(P)
    edges = np.r_[np.c_[pay, P + np.asarray(card)], np.c_[pay, P + n_cards + np.asarray(merchant)]]
    W, Q = build_transition(edges, np.r_[age, age], gamma, n, "undirected")
    seeds = np.zeros(n)
    seeds[:P] = np.exp(-gamma * np.asarray(restart_age, dtype=float))
    xi = restart_walk(Q, seeds, alpha, tol=1e-12)
    return xi, np.asarray(W.sum(axis=0)).ravel()
    # END SOLUTION


def cold_start_scores(xi, s, card_node, merchant_node):
    """One-step exposure of new payments, each with two edges of weight 1.

    Args:
        xi, s: (N,) exposure and strength of every node, as card_exposure.
        card_node, merchant_node: (k,) int arrays, node indices (not card
            or merchant ids) of each new payment's two endpoints.
    Returns:
        (k,) float array, xi_c / (s_c + 1) + xi_m / (s_m + 1).
    """
    # BEGIN SOLUTION
    return xi[card_node] / (s[card_node] + 1) + xi[merchant_node] / (s[merchant_node] + 1)
    # END SOLUTION

# %%
# Local referee: the card toy. Cardholders c1..c3 and merchants m1..m3 are
# ids 0..2; node 5 + 0 is c1, node 5 + 3 + 0 is m1.
_xi, _s = card_exposure(card=np.array([0, 0, 1, 1, 2]), merchant=np.array([0, 1, 0, 2, 2]),
                        age=np.array([2.0, 30, 5, 100, 20]),
                        restart_age=np.array([0.0, np.inf, np.inf, np.inf, np.inf]),
                        n_cards=3, n_merchants=3, gamma=np.log(20) / 168)
print("p1 m1 c1 c2:", np.round(_xi[[0, 8, 5, 6]], 3))
assert np.allclose(_xi[[0, 8, 5, 6]], [0.324, 0.186, 0.175, 0.052], atol=2e-3)
assert np.isclose(cold_start_scores(_xi, _s, np.array([7]), np.array([8]))[0], 0.066, atol=2e-3)

# %%
def card_check(card, merchant, age, restart_age, n_cards, n_merchants, gamma, new_card, new_merchant):
    xi, s = card_exposure(card, merchant, age, restart_age, n_cards, n_merchants, gamma)
    # Cardholders, merchants and new payments only: few enough values to be
    # compared one by one, within a tolerance, rather than as a digest.
    P = len(card)
    return xi[P:], s[P:], cold_start_scores(xi, s, P + new_card, P + n_cards + new_merchant)


distill.check("card-exposure", card_check)

# %% [markdown]
# ## 5. Egonet features from powers of the adjacency
#
# A classifier reads the neighbourhood as columns. On an undirected graph
# with 0/1 adjacency $A$ (no self-loops) and the fraud indicator
# $\mathbf f$, five per node $v$:
#
# 1. the degree, $\sum_u A_{vu}$;
# 2. the fraudulent neighbours, $(A\mathbf f)_v$;
# 3. the triangles through $v$: pairs of $v$'s neighbours that are joined
#    to each other;
# 4. the walks of length 2 from $v$ that end on a fraudulent node **other
#    than $v$**;
# 5. the same for walks of length 3.
#
# $(A^k)_{vu}$ counts the walks of length $k$ from $v$ to $u$, and walks may
# revisit nodes, so columns 4 and 5 count walks, not distinct paths. A
# fraudulent $v$ also reaches itself, and that term is its own label inside
# its own feature: subtract the walks that return to $v$. Every triangle
# through $v$ is a closed walk of length 3, gone round in two directions.
#
# On Elliptic $A$ has 203,769 rows; $A^2$ stays sparse, $A^3$ need not be
# formed. A product with a vector, $A(A\mathbf f)$, costs one pass over the
# edges per factor. For the diagonal of a product, $(BA)_{vv} = \sum_u
# B_{vu} A_{uv}$, which is a row sum of an element-wise product.
#
# The toy's feature table has the first four columns. G: degree 4, three
# fraudulent neighbours, triangles G–D–F and G–A–I, and five 2-walks to
# fraud (G–D–E, G–D–F, G–F–D, G–F–E, G–A–I).

# %%
def egonet_features(A, fraud):
    """Neighbourhood columns from the adjacency and its powers.

    Args:
        A: (n, n) symmetric 0/1 adjacency, no self-loops; numpy array or
            scipy sparse (convert with sp.csr_matrix(A)).
        fraud: (n,) 0/1 array, the fraud indicator f.
    Returns:
        (n, 5) float array: degree, fraudulent neighbours, triangles,
        2-walks and 3-walks ending on a fraudulent node other than v.
    """
    # BEGIN SOLUTION
    A = sp.csr_matrix(A, dtype=float)
    f = np.asarray(fraud, dtype=float)
    deg = np.asarray(A.sum(axis=1)).ravel()
    closed3 = np.asarray((A @ A).multiply(A).sum(axis=1)).ravel()   # (A^3)_vv
    f1 = A @ f
    f2 = A @ f1
    f3 = A @ f2
    return np.c_[deg, f1, closed3 / 2, f2 - deg * f, f3 - closed3 * f]
    # END SOLUTION

# %%
# Local referee: the first four columns of the toy's table.
_A = dense(build_transition(TOY_EDGES, np.zeros(25), 0.0, 20, "undirected")[0])
toy_table = egonet_features(_A, TOY_FRAUD)
assert np.allclose(toy_table[:, :4].T, [
    [6, 3, 1, 4, 2, 3, 4, 2, 4, 1, 3, 2, 2, 3, 3, 1, 3, 1, 1, 1],
    [1, 1, 0, 2, 2, 2, 3, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 2, 1, 2, 2, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [4, 3, 1, 4, 2, 4, 5, 2, 2, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1]])
print(pd.DataFrame(toy_table, index=list(TOY_NAMES),
                   columns=["degree", "fraud nbrs", "triangles", "2-walks", "3-walks"]).astype(int))

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Four sparse products with the vector, one sparse product of matrices. The
# closed 3-walks are the diagonal of $A^2 \cdot A$: multiply $A^2$ and $A$
# element-wise (`.multiply`) and sum each row. From that diagonal come both
# the triangles and the 3-walks that return to $v$; the 2-walks that return
# to $v$ number its degree.
# </details>
#
# <details><summary>Hint 2 — the self-terms</summary>
#
# $(A^2)_{vv} = \deg v$ and $(A^3)_{vv} = 2 \times$ triangles. The walks to
# a fraudulent node other than $v$ are $(A^k\mathbf f)_v - (A^k)_{vv} f_v$.
# </details>

# %%
distill.check("egonet-features", egonet_features)

# %% [markdown]
# ## 6. One graph network: the normalised adjacency and the forward pass
#
# A graph convolutional layer mixes every node's row with its neighbours'
# rows through a fixed matrix and a learned one. The fixed matrix adds a
# self-loop to every node, so that a node hears itself, and divides each
# edge by the square root of both endpoints' degrees, **counted with the
# self-loop**:
#
# $$\tilde A = A + I, \qquad \tilde d_v = \sum_u \tilde A_{vu}, \qquad
# \hat A = \tilde D^{-1/2}\, \tilde A\, \tilde D^{-1/2}.$$
#
# The network has two such layers and a skip term, a logistic regression on
# the node's own features added to the graph term. With one output, the
# illicit logit:
#
# $$H_1 = \operatorname{ReLU}(\hat A X W_0), \qquad
# z = \hat A H_1 w_1 + X w_s + b, \qquad p = \sigma(z),$$
#
# with $X$ the $(n, d)$ features, $W_0$ of shape $(d, h)$, $w_1$ of length
# $h$, $w_s$ of length $d$ and a scalar $b$. A two-class softmax over
# $(0, z)$ is exactly $\sigma(z)$, so this is the two-class network.
#
# The loss is a cross-entropy over the labelled nodes only, a 0/1 `mask`,
# with a weight per class, $c_0$ for licit and $c_1$ for illicit, applied
# to each node and averaged with the same weights:
#
# $$L = \frac{\sum_v m_v\, c_{y_v}\, \ell_v}{\sum_v m_v\, c_{y_v}}, \qquad
# \ell_v = -y_v \log p_v - (1 - y_v)\log(1 - p_v) = \log(1 + e^{z_v}) - y_v z_v .$$
#
# The right-hand form of $\ell_v$ never takes the log of 0:
# `np.logaddexp(0, z) - y * z`.

# %%
def normalized_adjacency(A):
    """A_hat = D~^-1/2 (A + I) D~^-1/2, with d~ the degrees of A + I.

    Args:
        A: (n, n) symmetric adjacency, numpy array or scipy sparse.
    Returns:
        (n, n) scipy.sparse CSR matrix.
    """
    # BEGIN SOLUTION
    A_tilde = sp.csr_matrix(A, dtype=float) + sp.eye(A.shape[0], format="csr")
    d = np.asarray(A_tilde.sum(axis=1)).ravel()
    D = sp.diags(1.0 / np.sqrt(d))
    return (D @ A_tilde @ D).tocsr()
    # END SOLUTION


def gcn_forward(A_hat, X, W0, w1, ws, b):
    """Two-layer GCN with a skip term.

    Args:
        A_hat: (n, n) normalised adjacency. X: (n, d). W0: (d, h).
        w1: (h,). ws: (d,). b: float.
    Returns:
        (z, H1): (n,) logits and the (n, h) hidden layer ReLU(A_hat X W0).
    """
    # BEGIN SOLUTION
    H1 = np.maximum(A_hat @ (X @ W0), 0.0)
    z = A_hat @ (H1 @ w1) + X @ ws + b
    return z, H1
    # END SOLUTION


def weighted_bce(z, y, mask, class_weights):
    """Class-weighted cross-entropy over the masked nodes.

    Args:
        z: (n,) logits. y: (n,) 0/1 labels (any value where mask is 0).
        mask: (n,) 0/1, the nodes that carry a loss.
        class_weights: (c0, c1), the weights of class 0 and class 1.
    Returns:
        float, sum(m c_y l) / sum(m c_y).
    """
    # BEGIN SOLUTION
    c = np.where(y == 1, class_weights[1], class_weights[0]) * mask
    return float(np.sum(c * (np.logaddexp(0.0, z) - y * z)) / c.sum())
    # END SOLUTION

# %%
# Local referees: the four accounts of the graph-network chapter, numbered
# from 0, with d~ = (3, 3, 2, 4). A_hat is symmetric, its diagonal is 1/d~,
# and sqrt(d~) is an eigenvector with eigenvalue 1.
_A4 = np.zeros((4, 4))
for a, b in [(0, 1), (0, 3), (1, 3), (2, 3)]:
    _A4[a, b] = _A4[b, a] = 1
_Ah4 = dense(normalized_adjacency(_A4))
_d = _A4.sum(1) + 1
assert np.allclose(np.diag(_Ah4), 1 / _d) and np.allclose(_Ah4, _Ah4.T)
assert np.allclose(_Ah4 @ np.sqrt(_d), np.sqrt(_d))
# With W0 = w1 = 0 the network is the logistic regression X ws + b.
_X4 = np.arange(8.0).reshape(4, 2)
_z, _H = gcn_forward(_Ah4, _X4, np.zeros((2, 3)), np.zeros(3), np.array([0.5, -0.25]), 0.1)
assert np.allclose(_z, _X4 @ [0.5, -0.25] + 0.1) and _H.shape == (4, 3)
# The loss at z = 0 is log 2 whatever the weights; a masked-out node is free.
assert np.isclose(weighted_bce(np.zeros(4), np.array([1.0, 0, 0, 1]), np.ones(4), (0.3, 0.7)), np.log(2))
assert np.isclose(weighted_bce(np.array([0.0, 0, 0, 50]), np.array([1.0, 0, 0, 0]), np.array([1.0, 1, 1, 0]), (0.3, 0.7)),
                  np.log(2))

# %%
def forward_check(A, X, W0, w1, ws, b, y, mask, class_weights):
    A_hat = normalized_adjacency(A)
    z, H1 = gcn_forward(A_hat, X, W0, w1, ws, b)
    return dense(A_hat), z, H1, weighted_bce(z, y, mask, class_weights)


distill.check("gcn-forward", forward_check)

# %% [markdown]
# ## 7. The gradient, refereed by finite differences
#
# Training moves $W_0$, $w_1$, $w_s$ and $b$ against the gradient of the
# loss of section 6,
#
# $$L = \frac{\sum_v m_v c_{y_v}\bigl(\log(1 + e^{z_v}) - y_v z_v\bigr)}{\sum_v m_v c_{y_v}},
# \qquad z = \hat A\,\operatorname{ReLU}(\hat A X W_0)\, w_1 + X w_s + b .$$
#
# Derive it with the chain rule, from the loss back to each parameter, and
# write it out. The derivation is the checkpoint, so no formula for it is
# printed here. Four facts to keep in view:
#
# - $\frac{d}{dz}\log(1 + e^{z}) = \sigma(z)$;
# - the denominator is a constant: it depends on the labels and the mask,
#   not on the parameters;
# - $\hat A$ appears twice, and a product $\hat A U$ sends a gradient $G$
#   back to $U$ as $\hat A^\top G$; here $\hat A^\top = \hat A$, since the
#   graph is undirected;
# - the ReLU passes a gradient where its input was positive and blocks it
#   elsewhere.
#
# The referee below perturbs each parameter entry by $\pm\varepsilon$,
# takes $\bigl(L(\theta + \varepsilon) - L(\theta - \varepsilon)\bigr) /
# 2\varepsilon$ from your `gcn_forward` and `weighted_bce`, and compares it
# with your gradient. On a correct gradient the relative error is near
# $10^{-8}$; a missing term shows as an error of order 1.

# %%
def gcn_backward(A_hat, X, y, mask, W0, w1, ws, b, class_weights):
    """Gradient of weighted_bce(gcn_forward(...)) with respect to the parameters.

    Args:
        A_hat: (n, n) symmetric normalised adjacency. X: (n, d).
        y: (n,) 0/1 labels. mask: (n,) 0/1.
        W0: (d, h). w1: (h,). ws: (d,). b: float.
        class_weights: (c0, c1).
    Returns:
        (dW0, dw1, dws, db): arrays shaped like W0, w1, ws, and a float.
    """
    # BEGIN SOLUTION
    z, H1 = gcn_forward(A_hat, X, W0, w1, ws, b)
    c = np.where(y == 1, class_weights[1], class_weights[0]) * mask
    g = c * (sigmoid(z) - y) / c.sum()            # dL/dz
    g_hidden = A_hat.T @ g                         # dL/d(H1 w1)
    dH1 = np.outer(g_hidden, w1) * (H1 > 0)        # dL/d(A_hat X W0), through the ReLU
    dW0 = X.T @ (A_hat.T @ dH1)
    return dW0, H1.T @ g_hidden, X.T @ g, float(g.sum())
    # END SOLUTION

# %%
# Infrastructure (do not modify): the finite-difference referee.
def numerical_gradient(A_hat, X, y, mask, params, class_weights, eps=1e-6):
    params = [np.array(p, dtype=float) for p in params]
    grads = []
    for P in params:
        g = np.zeros_like(P)
        for idx in np.ndindex(P.shape):
            old = P[idx]
            P[idx] = old + eps
            up = weighted_bce(gcn_forward(A_hat, X, *params)[0], y, mask, class_weights)
            P[idx] = old - eps
            down = weighted_bce(gcn_forward(A_hat, X, *params)[0], y, mask, class_weights)
            P[idx] = old
            g[idx] = (up - down) / (2 * eps)
        grads.append(g)
    return grads


def relative_error(a, b):
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    return np.max(np.abs(a - b) / np.maximum(1e-8, np.abs(a) + np.abs(b)))


_rng = np.random.default_rng(11)
_A = np.triu(_rng.random((12, 12)) < 0.3, 1).astype(float)
_A = _A + _A.T
_Ah = dense(normalized_adjacency(_A))
_X = _rng.normal(size=(12, 5))
_y = (_rng.random(12) < 0.4).astype(float)
_mask = (_rng.random(12) < 0.75).astype(float)
_params = [_rng.normal(0, 0.7, (5, 4)), _rng.normal(0, 0.7, 4), _rng.normal(0, 0.3, 5), 0.2]
for name, mine, ref in zip(("dW0", "dw1", "dws", "db"),
                           gcn_backward(_Ah, _X, _y, _mask, *_params, (0.3, 0.7)),
                           numerical_gradient(_Ah, _X, _y, _mask, _params, (0.3, 0.7))):
    err = relative_error(mine, ref)
    print(f"{name}: relative error {err:.1e}")
    assert err < 1e-6, f"{name} disagrees with finite differences"

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Name the forward pass's intermediate quantities, $U = \hat A X W_0$,
# $H_1 = \operatorname{ReLU}(U)$, $r = H_1 w_1$, $z = \hat A r + X w_s + b$,
# and go backwards, carrying the gradient of $L$ with respect to each,
# shaped like the quantity itself: first $z$, then $r$, then $H_1$, then
# $U$. Each parameter's gradient is read off where the parameter is used:
# $b$ and $w_s$ at $z$, $w_1$ at $r$, $W_0$ at $U$. Check every product by
# its shapes: $(d \times n)(n \times h)$ for a $W_0$-shaped term.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# g    = dL/dz = c (sigma(z) - y) / sum(c)        (n,)     c = m * c_y
# db   = sum of g;   dws = X^T g                   (d,)
# gr   = dL/dr = A_hat^T g                         (n,)
# dw1  = H1^T gr                                   (h,)
# dU   = outer(gr, w1) where U > 0, else 0         (n, h)
# dW0  = X^T (A_hat^T dU)                          (d, h)
# ```
# </details>

# %%
distill.check("gcn-gradient", gcn_backward)

# %% [markdown]
# ## 8. Training on early time steps, scoring later ones
#
# On a transaction graph the labels arrive late, so a model is trained on
# the past and scores the future: nodes of time steps up to `last_train_step`
# carry the loss, later ones are only scored. The graph network sees the
# whole graph either way, since its layers read every node's features; only
# the loss is restricted. Three things decide whether the score of the later
# steps is honest:
#
# - **the mask**: a node carries a loss only if it is labelled (`y` is 1 or
#   0; `-1` means unknown) and its step is at most `last_train_step`. An
#   unknown node counted as licit teaches the network that most of the
#   graph is licit for no reason;
# - **the features**: column 0 of `X_raw` is the time step. A model that
#   reads it can learn "early steps are illicit", which says nothing about
#   a later step. Drop it;
# - **the start**: from `rng = np.random.default_rng(seed)`, in this order,
#   `W0 = rng.normal(0, sqrt(2/d), (d, hidden))` and
#   `w1 = rng.normal(0, sqrt(1/hidden), hidden)`; `ws = 0`, `b = 0`.
#
# The optimiser is Adam, with $\beta_1 = 0.9$, $\beta_2 = 0.999$,
# $\varepsilon = 10^{-8}$, applied to each parameter separately. At epoch
# $t = 1, 2, \dots$ with gradient $g_t$:
#
# $$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t, \quad
# v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2, \quad
# \theta_t = \theta_{t-1} - \eta\,\frac{m_t / (1 - \beta_1^t)}{\sqrt{v_t / (1 - \beta_2^t)} + \varepsilon},$$
#
# from $m_0 = v_0 = 0$. The divisions by $1 - \beta^t$ undo the pull towards
# 0 of averages that started at 0, and $m$ and $v$ are pulled unequally:
# without them the first step is $0.1/\sqrt{0.001} \approx 3.2$ times
# $\eta$ in every coordinate instead of $\eta$. Every epoch is one
# full-batch step; record the loss **before** each step's update.

# %%
def train_gcn(A_hat, X, y, mask, params, class_weights, lr, epochs):
    """Full-batch Adam on weighted_bce.

    Args:
        A_hat, X, y, mask, class_weights: as gcn_backward.
        params: [W0, w1, ws, b], the starting parameters (not modified).
        lr: float, the step size eta. epochs: int.
    Returns:
        (params, losses): the trained [W0, w1, ws, b] and an (epochs,)
        array, the loss at the start of each epoch.
    """
    # BEGIN SOLUTION
    params = [np.array(p, dtype=float) for p in params]
    m = [np.zeros_like(p) for p in params]
    v = [np.zeros_like(p) for p in params]
    losses = np.empty(epochs)
    for t in range(1, epochs + 1):
        losses[t - 1] = weighted_bce(gcn_forward(A_hat, X, *params)[0], y, mask, class_weights)
        grads = gcn_backward(A_hat, X, y, mask, *params, class_weights)
        for i, g in enumerate(grads):
            m[i] = 0.9 * m[i] + 0.1 * g
            v[i] = 0.999 * v[i] + 0.001 * g * g
            params[i] = params[i] - lr * (m[i] / (1 - 0.9 ** t)) / (np.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8)
    params[3] = float(params[3])
    return params, losses
    # END SOLUTION


def fit_and_score(A, X_raw, step, y, last_train_step, hidden, lr, epochs, seed,
                  class_weights=(0.3, 0.7)):
    """Train the GCN on the early steps and score every node.

    Args:
        A: (n, n) symmetric 0/1 adjacency, numpy or scipy sparse.
        X_raw: (n, 1 + d) features, column 0 the time step.
        step: (n,) int time step of every node.
        y: (n,) labels: 1 illicit, 0 licit, -1 unknown.
        last_train_step: int; labelled nodes of steps <= it carry the loss.
        hidden: int h. lr, epochs: as train_gcn. seed: int.
        class_weights: (c0, c1).
    Returns:
        (p, losses): (n,) illicit probabilities sigma(z) of every node after
        training, and the (epochs,) losses of train_gcn.
    """
    # BEGIN SOLUTION
    X = np.asarray(X_raw, dtype=float)[:, 1:]
    A_hat = normalized_adjacency(A)
    mask = ((y >= 0) & (step <= last_train_step)).astype(float)
    labels = (y == 1).astype(float)
    d = X.shape[1]
    rng = np.random.default_rng(seed)
    W0 = rng.normal(0, np.sqrt(2 / d), (d, hidden))
    w1 = rng.normal(0, np.sqrt(1 / hidden), hidden)
    params, losses = train_gcn(A_hat, X, labels, mask, [W0, w1, np.zeros(d), 0.0], class_weights, lr, epochs)
    return sigmoid(gcn_forward(A_hat, X, *params)[0]), losses
    # END SOLUTION

# %%
# Infrastructure (do not modify): a small graph of six time steps, no edge
# between steps, where illicit nodes sit together and differ in their own
# features too. Plots the loss curve of one run, and of a run at a step size
# that is too large.
def toy_time_graph(seed=0, steps=6, per_step=40):
    rng = np.random.default_rng(seed)
    n = steps * per_step
    step = np.repeat(np.arange(1, steps + 1), per_step)
    illicit = rng.random(n) < 0.25
    A = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            if step[i] == step[j] and rng.random() < (0.25 if illicit[i] == illicit[j] else 0.02):
                A[i, j] = A[j, i] = 1
    X = rng.normal(size=(n, 4)) + 0.8 * illicit[:, None] * [1, -1, 0, 0]
    y = np.where(rng.random(n) < 0.6, illicit.astype(int), -1)
    return A, np.c_[step, X], step, y, illicit


def plot_losses(curves, ax=None):
    ax = ax or plt.subplots(figsize=(5, 3))[1]
    for name, losses in curves.items():
        ax.plot(losses, label=name)
    ax.set_xlabel("epoch"); ax.set_ylabel("weighted cross-entropy"); ax.legend(fontsize=8)
    return ax


_A, _Xr, _st, _y, _ill = toy_time_graph()
_p, _loss = fit_and_score(_A, _Xr, _st, _y, 4, 8, 0.02, 150, 0)
_late = _st > 4
print(f"loss {_loss[0]:.3f} -> {_loss[-1]:.3f}; ROC-AUC on steps 5-6, all nodes: "
      f"{roc_auc_score(_ill[_late], _p[_late]):.3f}")
assert _loss[-1] < 0.8 * _loss[0] and roc_auc_score(_ill[_late], _p[_late]) > 0.8
# The first recorded loss is the loss of the starting parameters, before any step.
_Ah, _Xt = normalized_adjacency(_A), _Xr[:, 1:]
_mask, _lab = ((_y >= 0) & (_st <= 4)).astype(float), (_y == 1).astype(float)
_start = [np.full((4, 8), 0.1), np.full(8, 0.1), np.zeros(4), 0.0]
assert np.isclose(train_gcn(_Ah, _Xt, _lab, _mask, _start, (0.3, 0.7), 0.02, 3)[1][0],
                  weighted_bce(gcn_forward(_Ah, _Xt, *_start)[0], _lab, _mask, (0.3, 0.7))), \
    "losses[0] is not the loss of the starting parameters"
plot_losses({"lr 0.02": _loss, "lr 2.0": fit_and_score(_A, _Xr, _st, _y, 4, 8, 2.0, 150, 0)[1]})
plt.show()

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# `train_gcn` keeps two lists, `m` and `v`, of arrays shaped like the four
# parameters, and runs one loop over epochs with one inner loop over the
# four gradients `gcn_backward` returns. Copy the starting parameters
# first, so the caller's are not changed. `fit_and_score` is preparation
# (features, `A_hat`, mask, 0/1 labels, start) around one call to
# `train_gcn` and one to `gcn_forward`.
# </details>

# %%
distill.check("train-on-time-split", fit_and_score)

# %% [markdown]
# ## 9. The Elliptic graph
#
# The Elliptic data set is a graph of 203,769 Bitcoin transactions and
# 234,355 edges, an edge meaning that an output of one transaction was spent
# by the other. It covers 49 time steps about two weeks apart. Each node has
# 166 anonymised columns: the time step, 93 more local columns (amounts,
# fees, numbers of inputs and outputs), and 72 aggregates of the same
# columns over the node's one-hop neighbours. About 2% of the nodes are
# labelled illicit (scams, ransomware, dark markets) and 21% licit, from
# the entity that created them; the rest are unknown. The protocol of the
# Elliptic chapter trains on steps 1–34 and scores the labelled nodes of
# steps 35–49.
#
# The licence (CC BY-NC-ND 4.0) allows sharing the files unchanged, not a
# cut-down copy, so the loader below downloads the three original files,
# about 150 MB, checks them against fixed checksums, and caches them in
# `~/.cache/distill/elliptic` (set `ELLIPTIC_DIR` to use another folder; if
# the mirror is unreachable, download the three files from the Kaggle page
# in the references into that folder). It then **hides the labels of steps
# 35–49**: `y` holds `-1` there, and `scored` marks the 16,670 labelled
# nodes of those steps, whose labels the server keeps for the open task.
# The original file holds them too; reading them there makes the open
# task's score meaningless, and nothing stops you.

# %%
# Infrastructure (do not modify): download, check, load.
ELLIPTIC_URL = "https://data.pyg.org/datasets/elliptic"
ELLIPTIC_FILES = {
    "elliptic_txs_features.csv.zip": "d33d62159e64b5e889f1a7ea880227c612775b58d409598855e0c4400fa52b3e",
    "elliptic_txs_edgelist.csv.zip": "a2f9f6b67a39da2d8cf87fe77b9db89571ba6d880e5dd5b5991dc45c80fa34ec",
    "elliptic_txs_classes.csv.zip": "4ca957f0ceffd5dd164e255c7d5ad9ee69a6fa64ae1dd94d6f113e5ebf3b07ba",
}
ELLIPTIC_DIR = Path(os.environ.get("ELLIPTIC_DIR", Path.home() / ".cache" / "distill" / "elliptic"))


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def fetch_elliptic():
    ELLIPTIC_DIR.mkdir(parents=True, exist_ok=True)
    for name, digest in ELLIPTIC_FILES.items():
        path = ELLIPTIC_DIR / name
        if not path.exists() or sha256(path) != digest:
            print(f"downloading {name} ...")
            urllib.request.urlretrieve(f"{ELLIPTIC_URL}/{name}", path)
        assert sha256(path) == digest, f"{name}: checksum mismatch, delete it and rerun"


def load_elliptic(last_known_step=34):
    """Features, steps, labels with steps > last_known_step hidden, edges."""
    feat = pd.read_csv(ELLIPTIC_DIR / "elliptic_txs_features.csv.zip", header=None, dtype=np.float64)
    cls = pd.read_csv(ELLIPTIC_DIR / "elliptic_txs_classes.csv.zip", dtype=str)
    edges = pd.read_csv(ELLIPTIC_DIR / "elliptic_txs_edgelist.csv.zip")
    txid = feat[0].to_numpy().astype(np.int64)
    assert np.array_equal(cls.txId.to_numpy().astype(np.int64), txid)
    step = feat[1].to_numpy().astype(int)
    label = cls["class"].map({"1": 1, "2": 0, "unknown": -1}).to_numpy().astype(int)
    index = pd.Series(np.arange(len(txid)), index=txid)
    later = step > last_known_step
    return {
        "X_raw": feat.iloc[:, 1:].to_numpy(),          # column 0: the time step
        "step": step,
        "y": np.where(later, -1, label),
        "scored": later & (label >= 0),
        "edges": np.c_[index[edges.txId1].to_numpy(), index[edges.txId2].to_numpy()],
    }


fetch_elliptic()
ell = load_elliptic()
n_ell = len(ell["step"])
print(f"{n_ell:,} nodes, {len(ell['edges']):,} edges, {ell['X_raw'].shape[1]} columns; "
      f"steps 1-34: {np.sum(ell['y'] == 1):,} illicit, {np.sum(ell['y'] == 0):,} licit; "
      f"scored in steps 35-49: {ell['scored'].sum():,}")

# %% [markdown]
# Your union-find on the whole graph first. The Elliptic chapter said that no
# edge crosses from one time step to another; if so, every component lies
# inside one step. The components say more than that.

# %%
ell_labels, ell_sizes = union_find_components(ell["edges"], n_ell)
steps_per_component = pd.Series(ell["step"]).groupby(ell_labels).nunique()
print(f"{len(ell_sizes)} components; largest {ell_sizes[:3]}, smallest {ell_sizes[-3:]}; "
      f"components spanning more than one step: {(steps_per_component > 1).sum()}")
assert len(ell_sizes) == 49 and (steps_per_component == 1).all()

fig, ax = plt.subplots(figsize=(8, 2.6))
ax.bar(np.arange(1, 50), np.bincount(ell["step"])[1:], color="0.7")
ax.axvline(34.5, color="C1", ls="--", lw=1)
ax.text(35, ax.get_ylim()[1] * 0.9, "scored from here", color="C1", fontsize=8)
ax.set_xlabel("time step = connected component"); ax.set_ylabel("transactions")
plt.show()

# %% [markdown]
# Forty-nine components, one per time step: each step is a single piece,
# and nothing joins one step to the next. Two consequences follow for the
# rest of the lab.
#
# The first: a walk restarted at the known illicit nodes never leaves the
# training steps, so it gives every node of steps 35–49 an exposure of
# exactly 0. The cell below checks this with your walk, in both directions
# on the directed graph, the edges undecayed (the snapshot has no ages).

# %%
known_illicit = (ell["y"] == 1).astype(float)
later = ell["step"] >= 35
for mode in ("with", "against"):
    _, Q_ell = build_transition(ell["edges"], np.zeros(len(ell["edges"])), 0.0, n_ell, mode)
    xi = restart_walk(Q_ell, known_illicit, tol=1e-10)
    print(f"{mode:8s} the money: exposure mass on steps 35-49 = {xi[later].sum():.1e}")
    assert xi[later].sum() == 0

# %% [markdown]
# The second: a graph network trained on steps 1–34 still scores steps
# 35–49, because its layers read the features of a node and its
# neighbours, not their labels. The same holds for any neighbourhood
# column computed from scores rather than labels: run a first model on
# every node, then walk from its scores. The open task can use either.
#
# ## 10. The graph network on Elliptic
#
# Your `fit_and_score` on the whole graph, with the undirected adjacency.
# The test labels are hidden, so the comparison here keeps steps 25–34
# aside: train on the labelled nodes of steps 1–24, score steps 25–34. Two
# random forests on the same split are the comparison rows the Elliptic
# chapter set up: one on the 93 local columns, one on all 165 (the time
# step dropped). The network has 32 hidden units and trains for 300 epochs
# at step size 0.003, about two minutes. Illicit F1 at the threshold 0.5
# is the chapter's score; ROC-AUC, the open task's, reads the whole
# ranking.

# %%
# Infrastructure (do not modify): the validation split, the comparison
# forests, per-step F1 and precision-recall plots.
VAL_LAST_TRAIN = 24
val_rows = (ell["step"] > VAL_LAST_TRAIN) & (ell["y"] >= 0)
y_val_hidden = np.where(ell["step"] > VAL_LAST_TRAIN, -1, ell["y"])


def forest_scores(X, y, train_rows, seed=0):
    rf = RandomForestClassifier(n_estimators=50, max_features=50, n_jobs=-1, random_state=seed)
    return rf.fit(X[train_rows], y[train_rows]).predict_proba(X)[:, 1]


def report(name, scores, rows=val_rows, y=ell["y"]):
    print(f"{name:34s} ROC-AUC {roc_auc_score(y[rows], scores[rows]):.3f}   "
          f"illicit F1 at 0.5 {f1_score(y[rows], scores[rows] >= 0.5):.3f}")


def plot_validation(curves, rows=val_rows, y=ell["y"], step=ell["step"]):
    fig, axes = plt.subplots(1, 2, figsize=(11, 3.5))
    steps = np.unique(step[rows])
    for name, s in curves.items():
        f1 = [f1_score(y[rows & (step == t)], s[rows & (step == t)] >= 0.5, zero_division=0) for t in steps]
        axes[0].plot(steps, f1, marker="o", ms=3, label=name)
        prec, rec, _ = precision_recall_curve(y[rows], s[rows])
        axes[1].plot(rec, prec, label=name)
    axes[0].set_xlabel("time step"); axes[0].set_ylabel("illicit F1 at 0.5"); axes[0].set_ylim(0, 1)
    axes[1].set_xlabel("recall"); axes[1].set_ylabel("precision"); axes[1].legend(fontsize=8)
    plt.show()


X_all = ell["X_raw"][:, 1:]
train_rows = (ell["step"] <= VAL_LAST_TRAIN) & (ell["y"] >= 0)
rf_local = forest_scores(X_all[:, :93], ell["y"], train_rows)
rf_all = forest_scores(X_all, ell["y"], train_rows)

# %%
A_ell = build_transition(ell["edges"], np.zeros(len(ell["edges"])), 0.0, n_ell, "undirected")[0]
A_ell = (A_ell > 0).astype(float)
gcn_val, gcn_losses = fit_and_score(A_ell, ell["X_raw"], ell["step"], y_val_hidden,
                                    VAL_LAST_TRAIN, hidden=32, lr=0.003, epochs=300, seed=0)
print(f"loss {gcn_losses[0]:.3f} -> {gcn_losses[-1]:.3f}")
report("random forest, 93 local columns", rf_local)
report("random forest, all 165 columns", rf_all)
report("Skip-GCN, all 165 columns", gcn_val)
plot_validation({"forest, local": rf_local, "forest, all": rf_all, "Skip-GCN": gcn_val})

# %% [markdown]
# ## Written answer (optional)
#
# On steps 25–34 the forest on all 165 columns reaches an illicit F1 of
# 0.95 and the graph network 0.74; on the published test steps the forest
# on the same columns scored 0.788 and the Skip-GCN 0.705. The network sees
# the whole graph and learns how to combine a node with its neighbours; the
# forest sees one row per node. Explain why the forest wins here. "The
# network underfits" is not an answer: say what the 72 aggregate columns
# already are, in the vocabulary of message passing; what the network's
# output layer is; and what a forest can do with a column that the
# network's output cannot.

# %%
distill.submit_review(
    "why-rf-wins",
    "The 72 aggregate columns are already one round of message passing: for "
    "each node they gather the neighbours' local columns and aggregate them "
    "with fixed functions (maximum, minimum, standard deviation, "
    "correlation), so the forest's input contains the one-hop neighbourhood "
    "the GCN's first layer would compute, only with hand-chosen aggregators "
    "instead of a learned normalised sum. Given those columns, the graph "
    "adds little the forest does not already see. The GCN's last step is a "
    "logistic regression on its hidden layer and the skip term: one linear "
    "score passed through a sigmoid, so every column moves the logit in one "
    "direction by an amount proportional to its value. A forest cuts each "
    "column at thresholds and combines the cuts in branches, so it can use "
    "a column only in a range ('fee above x and few outputs'), interactions "
    "between columns, and heavy-tailed raw values that a linear score "
    "squashes; on tabular columns like these that is worth more than the "
    "learned aggregation. The network's mean-like normalised sum also "
    "dilutes a few suspicious neighbours among many ordinary ones, where a "
    "maximum keeps them. So the forest wins by having the aggregation "
    "precomputed and a more flexible classifier on top, not because the "
    "graph is useless.",
)

# %% [markdown]
# ## Open task (optional): rank the test steps through the graph
#
# The forest's lead came from the 72 aggregate columns, neighbourhood
# columns someone computed from the graph by hand. Can columns you compute
# from the graph with your own tools take their place? Using the **93 local
# columns** (column 0, the step, dropped; the 72 aggregates left out), the
# graph, and the labels of steps 1–34 only, rank the 16,670 scored nodes of
# steps 35–49. The server grades the ranking by ROC-AUC, the probability
# that an illicit node outranks a licit one.
#
# The classifier is fixed, so that the score measures your columns. Left
# free, the choice of classifier would decide the grade: on these steps
# gradient boosting on the 93 local columns alone reaches about 0.93 and
# the forest of section 10 0.891, with no graph at all, and the best graph
# columns add about half a point to the boosted model. That says which
# model to use, not whether the graph carries signal. Here the model is
# `rank_with_columns` below: a logistic regression, which is the graph
# network's output layer, on every column mapped to normal quantiles; it
# reads your columns beside the 93 local ones. On the test steps it scores
# 0.858 on the local columns alone and 0.902 with the layer's neighbour
# means $\hat A X$ added. The bar is **0.915**.
#
# Write `my_columns(X_local, step, y, edges, last_train_step)`, returning
# an `(n, k)` array, one row per node, and using the labels `y` of steps up
# to `last_train_step` only. Every column describes the node's
# **neighbourhood**: its neighbours' columns or scores, counts of walks to
# predicted-illicit nodes. A column computed from the node's own row (a transform
# of it, or a model's score of the node itself) lets a second classifier in
# through the columns, and the score stops measuring the graph; nothing
# checks this, as nothing checks the test labels. A first model's scores
# are material for neighbourhood columns: a node may read its neighbours'
# scores, not its own.
#
# The cell after it runs your function twice: trained up to step 24 and
# judged on steps 25–34 (labels known, for the curves below and for
# choosing between candidates), then trained up to step 34 and run on steps
# 35–49 for submission. The validation steps come before the change at step
# 43, so a validation score overstates the test score; use it to compare
# candidates, not to predict the grade. Hints follow the plot; try first.

# %%
# Infrastructure (do not modify): the fixed classifier the open task grades
# your columns through.
def rank_with_columns(X_local, columns, y, step, last_train_step):
    """Quantile-scaled logistic regression on the local columns and `columns`.

    Trained on the labelled nodes of steps <= last_train_step; returns one
    score per node. columns=None scores the local columns alone.
    """
    Z = X_local if columns is None else np.c_[X_local, columns]
    train = (step <= last_train_step) & (y >= 0)
    model = make_pipeline(
        QuantileTransformer(n_quantiles=200, output_distribution="normal", subsample=None, random_state=0),
        LogisticRegression(max_iter=2000, class_weight="balanced"))
    return model.fit(Z[train], y[train]).predict_proba(Z)[:, 1]


X_local = ell["X_raw"][:, 1:94]

# %%
# BEGIN SOLUTION
def my_columns(X_local, step, y, edges, last_train_step):
    # A first forest scores every node out of fold (a node of a training
    # step is scored by a forest that did not see its step), so that its
    # neighbours' scores are as honest on the training steps as on the later
    # ones. Columns: neighbour means of the local columns, undirected and
    # along each direction of the money, and the neighbours' scores summed,
    # averaged and counted by the egonet function.
    n = len(step)
    train = (step <= last_train_step) & (y >= 0)
    train_steps = np.arange(1, last_train_step + 1)
    first = np.zeros(n)
    for k in range(5):
        held = np.isin(step, train_steps[train_steps % 5 == k])
        rf = RandomForestClassifier(n_estimators=100, max_features=50, n_jobs=-1, random_state=0)
        first[held] = rf.fit(X_local[train & ~held], y[train & ~held]).predict_proba(X_local[held])[:, 1]
    rf = RandomForestClassifier(n_estimators=100, max_features=50, n_jobs=-1, random_state=0)
    first[step > last_train_step] = rf.fit(X_local[train], y[train]).predict_proba(
        X_local[step > last_train_step])[:, 1]

    no_age = np.zeros(len(edges))
    W = build_transition(edges, no_age, 0.0, n, "with")[0]       # row v: who paid v
    A = (build_transition(edges, no_age, 0.0, n, "undirected")[0] > 0).astype(float)

    def mean_over(M, V):
        return (M @ V) / np.maximum(np.asarray(M.sum(axis=1)), 1).reshape(-1, *[1] * (V.ndim - 1))

    return np.c_[normalized_adjacency(A) @ X_local, mean_over(W, X_local), mean_over(W.T, X_local),
                 W @ first, W.T @ first, A @ first,
                 mean_over(W, first), mean_over(W.T, first), mean_over(A, first),
                 egonet_features(A, (first > 0.5).astype(float))]
# END SOLUTION

# %%
val_base = rank_with_columns(X_local, None, y_val_hidden, ell["step"], VAL_LAST_TRAIN)
val_scores = rank_with_columns(X_local, my_columns(X_local, ell["step"], y_val_hidden, ell["edges"], VAL_LAST_TRAIN),
                               y_val_hidden, ell["step"], VAL_LAST_TRAIN)
report("local columns only, steps 25-34", val_base)
report("with your columns, steps 25-34", val_scores)
test_scores = rank_with_columns(X_local, my_columns(X_local, ell["step"], ell["y"], ell["edges"], 34),
                                ell["y"], ell["step"], 34)

# %%
distill.submit_predictions("rank-the-test-steps", test_scores[ell["scored"]])

# %%
# Infrastructure (do not modify): the classifier with and without your
# columns on the validation steps.
plot_validation({"local columns only": val_base, "with your columns": val_scores})

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Two kinds of neighbourhood column. Feature means: $\hat A X$ is what a
# graph layer computes before it learns anything, and it mixes payers and
# payees. The money has a direction, and the means over a node's payers
# and over its payees, taken apart, keep it: in mode `"with"`,
# `build_transition` puts a payment from $j$ to $i$ at `W[i, j]`, so row
# $i$ of $W$ lists who paid $i$ and row $i$ of $W^\top$ whom $i$ paid.
# Score columns: the labels cannot reach the test steps (section 9), but a
# first model's **scores** can. Score every node with a first model on its
# own row, then sum and average the neighbours' scores in each direction
# and count predicted-illicit neighbours and walks with your egonet
# function. On the training steps those scores must come from a model that
# did not see the node's label, or the classifier learns to trust a column
# that is the label in disguise: fit the first model on four fifths of the
# training steps and score the fifth, five times.
# </details>
#
# <details><summary>Hint 2 — what to compare</summary>
#
# On the test steps, through `rank_with_columns`: the local columns alone
# 0.858; with $\hat A X$, 0.902; with $\hat A X$, the sums of the
# neighbours' scores and the egonet counts, 0.918; with the payer and payee
# means of the local columns and the means of the neighbours' scores added
# to those, 0.936. Without the payer and payee means the set scores 0.922,
# and a walk restarted at the first model's scores, added to it, lowered it
# to 0.903: the restart returns part of each node's own score to it, which
# is the column the rules exclude. On the validation steps every
# number is higher: 0.923 for the local columns alone, 0.986 with the last set.
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# def my_columns(X_local, step, y, edges, last_train_step):
#     n = len(step); train = (step <= last_train_step) & (y >= 0)
#     ts = np.arange(1, last_train_step + 1); first = np.zeros(n)
#     for k in range(5):
#         held = np.isin(step, ts[ts % 5 == k])
#         rf = RandomForestClassifier(100, max_features=50, n_jobs=-1, random_state=0)
#         first[held] = rf.fit(X_local[train & ~held], y[train & ~held]).predict_proba(X_local[held])[:, 1]
#     rf = RandomForestClassifier(100, max_features=50, n_jobs=-1, random_state=0)
#     later = step > last_train_step
#     first[later] = rf.fit(X_local[train], y[train]).predict_proba(X_local[later])[:, 1]
#     h0 = np.zeros(len(edges))
#     W = build_transition(edges, h0, 0.0, n, "with")[0]
#     A = (build_transition(edges, h0, 0.0, n, "undirected")[0] > 0).astype(float)
#     def mean_over(M, V):
#         return (M @ V) / np.maximum(np.asarray(M.sum(axis=1)), 1).reshape(-1, *[1] * (V.ndim - 1))
#     return np.c_[normalized_adjacency(A) @ X_local, mean_over(W, X_local), mean_over(W.T, X_local),
#                  W @ first, W.T @ first, A @ first,
#                  mean_over(W, first), mean_over(W.T, first), mean_over(A, first),
#                  egonet_features(A, (first > 0.5).astype(float))]
# ```
# </details>

# %% [markdown]
# ## References
#
# - B. Baesens, V. Van Vlasselaer, W. Verbeke, *Fraud Analytics Using
#   Descriptive, Predictive, and Social Network Techniques*, Wiley, 2015:
#   ch. 5 (the 20-node sample network, Fig. 5.13; its neighbourhood
#   metrics; Table 5.12, the fraud-personalised PageRank ranking; Table
#   5.13, its featurisation).
# - V. Van Vlasselaer, C. Bravo, O. Caelen, T. Eliassi-Rad, L. Akoglu,
#   M. Snoeck, B. Baesens, "APATE: A novel approach for automated credit
#   card transaction fraud detection using network-based extensions",
#   *Decision Support Systems* 75, 2015: Sec. 3.2 (exponentially decayed
#   edge weights, the column-normalised tripartite matrix, power iteration,
#   the update for a new transaction).
# - L. Akoglu, H. Tong, D. Koutra, "Graph-based anomaly detection and
#   description: a survey", *Data Mining and Knowledge Discovery* 29(3),
#   2015: Sec. 5.7 (Anti-TrustRank, distrust propagated backward along
#   incoming links from known bad seeds).
# - T. N. Kipf, M. Welling, "Semi-Supervised Classification with Graph
#   Convolutional Networks", *ICLR* 2017: Sec. 2 (the normalised adjacency
#   with self-loops), Sec. 3 (the two-layer model trained on labelled
#   nodes).
# - M. Weber, G. Domeniconi, J. Chen, D. K. I. Weidele, C. Bellei,
#   T. Robinson, C. E. Leiserson, "Anti-Money Laundering in Bitcoin:
#   Experimenting with Graph Convolutional Networks for Financial
#   Forensics", KDD Workshop on Anomaly Detection in Finance, 2019: Sec. 3
#   (the data set, the GCN and Skip-GCN), Sec. 4 (the temporal split, the
#   0.3/0.7 weighted loss, the comparison of forests and graph networks).
# - D. P. Kingma, J. Ba, "Adam: A Method for Stochastic Optimization",
#   *ICLR* 2015: Algorithm 1 (the update and its bias correction).
# - Elliptic, "Elliptic Data Set" (`elliptic_txs_features.csv`,
#   `elliptic_txs_edgelist.csv`, `elliptic_txs_classes.csv`), CC BY-NC-ND
#   4.0: https://www.kaggle.com/datasets/ellipticco/elliptic-data-set. The
#   lab downloads the original files unchanged from the PyTorch Geometric
#   mirror and ships none of its own.

# %%
distill.dump()
