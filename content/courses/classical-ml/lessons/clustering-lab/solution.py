# %% [markdown]
# # Lab: k-means and EM from scratch
#
# You will build the module's two clustering engines with nothing but numpy:
# a vectorized Lloyd's algorithm with k-means++ seeding, an image
# vector-quantizer that compresses a real photograph with its own bit ledger,
# and a full EM fitter for Gaussian mixtures whose responsibilities are
# computed in log space. Both convergence proofs from the module become
# executable assertions — your k-means distortion history must never
# increase, and your EM log-likelihood must climb at every step, because the
# theory says they must.
#
# Ground rules:
#
# - **No sklearn, no scipy** — the algorithms are yours end to end. (Using
#   them to sanity-check on your own machine is fine; the graded work is
#   numpy.)
# - Vectorize over the data: no Python loops over points. Loops over the K
#   clusters or components are fine — K is small, n is not.
# - Each checkpoint cell submits your function to the course server, which
#   compares outputs against a reference. Run them as you go; partial
#   completion is normal — three of the ten checkpoints are optional
#   (k-means++ seeding, the open recovery task, the written answer), and the
#   checklist on the lesson page marks which.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/clustering-lab")

# %% [markdown]
# ## 1. The assignment step
#
# k-means minimizes the distortion — the mean squared distance from each
# point to the centroid it is assigned to:
#
# $$J = \frac{1}{n}\sum_{i=1}^{n} \big\lVert x_i - c_{a(i)} \big\rVert^2$$
#
# Lloyd's algorithm alternates two moves, each of which can only lower $J$.
# The first move holds the centroids fixed and picks the best assignment:
# every point goes to its nearest centroid,
# $a(i) = \arg\min_k \lVert x_i - c_k \rVert^2$. Broadcasting does this in
# two lines: a `(n, K)` matrix of squared distances, then an argmin over the
# centroid axis. Ties go to the lower centroid index — which is what
# `np.argmin` already does.

# %%
def assign(X, C):
    """Nearest-centroid assignment.

    Args:
        X: (n, d) points.
        C: (K, d) centroids.
    Returns:
        (n,) integer array; entry i is the index of the centroid with the
        smallest squared euclidean distance to X[i] (ties: lowest index).
    """
    # BEGIN SOLUTION
    return ((X[:, None, :] - C[None, :, :]) ** 2).sum(-1).argmin(1)
    # END SOLUTION

# %%
# Hand-checkable cases before submitting: two points next to their own
# centroids, and an equidistant point, which must take the lower index.
assert np.array_equal(assign(np.array([[0.0, 0.0], [10.0, 0.0]]),
                             np.array([[0.0, 1.0], [10.0, 1.0]])), [0, 1])
assert assign(np.array([[5.0, 0.0]]), np.array([[0.0, 0.0], [10.0, 0.0]]))[0] == 0

# %%
distill.check("assign-step", assign)

# %% [markdown]
# ## 2. The update step
#
# The second move holds the assignment fixed and picks the best centroids:
# with the assignment frozen, $J$ is a sum of independent per-cluster
# squared-distance terms, and each is minimized by the cluster's mean,
#
# $$c_k = \frac{1}{|S_k|} \sum_{i \in S_k} x_i .$$
#
# One practical failure the formula ignores: a cluster can end up with no
# points, and the mean of nothing is undefined. The standard repair re-seeds
# the dead centroid on the most poorly served point. Exact specification,
# in order:
#
# 1. Compute the mean of every non-empty cluster.
# 2. Compute each point's squared distance to the new centroid of its own
#    cluster.
# 3. For each empty cluster, in ascending cluster index: place its centroid
#    on the point with the largest step-2 distance not already claimed by an
#    earlier repair (ties: lowest point index).

# %%
def update(X, labels, K):
    """Centroid update with empty-cluster repair.

    Args:
        X: (n, d) points.
        labels: (n,) integer assignment, values in [0, K).
        K: number of centroids.
    Returns:
        (K, d) centroids: per-cluster means, empty clusters re-seeded on the
        farthest points per the specification above.
    """
    # BEGIN SOLUTION
    C = np.empty((K, X.shape[1]))
    empty = [k for k in range(K) if not np.any(labels == k)]
    for k in range(K):
        if k not in empty:
            C[k] = X[labels == k].mean(0)
    if empty:
        d2 = ((X - C[labels]) ** 2).sum(1)
        order = np.argsort(-d2, kind="stable")
        for i, k in enumerate(empty):
            C[k] = X[order[i]]
    return C
    # END SOLUTION

# %%
# Hand-checkable case: two clusters of two points, clusters 2 and 3 both
# empty. The means are (1,0) and (10,2); both right-hand points are 2 away
# from their own centroid, and the tie goes to the lower point index — so
# the first repair (cluster 2) claims point 2 at (10,0), and the second
# (cluster 3) must take the next point, (10,4), never the same one twice.
_Xu = np.array([[0.0, 0.0], [2.0, 0.0], [10.0, 0.0], [10.0, 4.0]])
_Cu = update(_Xu, np.array([0, 0, 1, 1]), 4)
assert np.allclose(_Cu[0], [1.0, 0.0]) and np.allclose(_Cu[1], [10.0, 2.0])
assert np.allclose(_Cu[2], [10.0, 0.0]), "first repair: the farthest point, ties to the lower index"
assert np.allclose(_Cu[3], [10.0, 4.0]), "second repair must skip the point the first one claimed"

# %%
distill.check("update-step", update)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Three passes, in order. First the means of the non-empty clusters — the
# boolean mask `labels == k` selects a cluster's rows. Then one `(n,)`
# vector of squared distances from each point to its own cluster's new
# centroid — indexing the centroid array with `labels` lines the two up
# row for row. Last, walk the empty clusters in ascending index and hand
# each the farthest still-unclaimed point: a stable descending ordering of
# the distances gives the claim order and the tie rule in one move.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# C ← (K, d), uninitialized
# for each k with at least one point: C[k] ← mean of X[labels == k]
# if any cluster is empty:
#     d2    ← rowwise ‖X − C[labels]‖²        # (n,), computed once
#     order ← indices of d2, descending, stable
#     for i, k over the empty clusters in ascending k:
#         C[k] ← X[order[i]]
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# `np.argsort(-d2, kind="stable")` is the whole ordering: descending in
# distance, ties broken toward the lower point index. Taking `order[0]`,
# `order[1]`, … for successive repairs is what "not already claimed" means
# in code.
# </details>

# %% [markdown]
# ## 3. Lloyd's algorithm
#
# Now alternate the two moves. Each lowers $J$ or leaves it unchanged, so
# the recorded distortion history must be non-increasing — the module's
# convergence argument, and this lab's first executable proof. If your
# history ever rises, one of your two steps is not the argmin it claims to
# be.
#
# Specification:
#
# - run exactly `iters` iterations;
# - each iteration: assign against the current centroids, record the
#   distortion $J$ (the **mean** squared distance, with the labels just
#   computed and the centroids they were computed against), then update;
# - return the final centroids, the final labels, and the `(iters,)` history.
#   "Final labels" means the assignment computed inside the last iteration —
#   before that iteration's update. Do NOT re-assign against the returned
#   centroids: that is half an iteration the spec does not run, and on a
#   large input even one point switching sides is a different answer.

# %%
def kmeans(X, C0, iters):
    """Lloyd's algorithm from a given initialization.

    Args:
        X: (n, d) points.
        C0: (K, d) initial centroids.
        iters: number of assign-record-update iterations.
    Returns:
        (C, labels, J): final (K, d) centroids, final (n,) labels, and the
        (iters,) distortion history; J[t] is the mean squared distance
        recorded right after the assignment of iteration t, before the
        update. labels is the assignment computed inside the final
        iteration, before the last update — it is NOT recomputed against
        the returned C.
    """
    # BEGIN SOLUTION
    C = C0.copy()
    J = np.empty(iters)
    for t in range(iters):
        labels = assign(X, C)
        J[t] = ((X - C[labels]) ** 2).sum(1).mean()
        C = update(X, labels, len(C))
    return C, labels, J
    # END SOLUTION

# %%
# Infrastructure (do not modify): the two plot helpers for the whole lab.
def plot_clusters(X, labels, C=None, title=""):
    plt.scatter(X[:, 0], X[:, 1], c=labels, s=8, cmap="tab10")
    if C is not None:
        plt.scatter(C[:, 0], C[:, 1], marker="x", s=120, c="black")
    plt.title(title); plt.gca().set_aspect("equal"); plt.show()

def plot_histories(ylabel, **series):
    for name, values in series.items():
        plt.plot(values, label=name)
    plt.xlabel("iteration"); plt.ylabel(ylabel); plt.legend(); plt.show()

# %% [markdown]
# The data for this section, section 4, and the final open task is the
# lab's clustering workbench, `data/blobs.csv`: 830 synthetic 2-d points,
# drawn once from six Gaussian clusters with hand-picked centers and
# committed with the lab — nothing regenerates it. One row is one point,
# its two coordinates comma-separated. The six clusters are deliberately
# unequal in both population (80 points up to 200) and spread (per-axis
# standard deviations from about 0.3 to 0.55), and the inequality is the
# design: tight small clusters beside broad large ones are what put bad
# local optima within reach — a crowded start can split a broad cluster
# and merge two tight ones and still converge. The generating centers are
# held out on the course server; recovering them is the lab's final task.

# %%
# Two runs of your kmeans from different hand-picked starts: both
# staircases descend — they must — but to different plateaus. Convergence
# is guaranteed; a good optimum is not. That gap is what seeding is about.
X_blobs = np.loadtxt("data/blobs.csv", delimiter=",")

_C_good = np.array([[-6.0, 3.0], [-4.0, -4.0], [-2.0, 4.0], [1.0, -2.0], [2.5, 4.0], [5.0, 2.0]])
_C_bad = X_blobs[np.argsort(X_blobs[:, 0])[-6:]]  # all six seeds crowded in one corner
_, _, _J_good = kmeans(X_blobs, _C_good, 25)
_Cb, _labb, _J_bad = kmeans(X_blobs, _C_bad, 25)
plot_histories("distortion J", **{"spread-out start": _J_good, "crowded start": _J_bad})
plot_clusters(X_blobs, _labb, _Cb, f"local optimum, J = {_J_bad[-1]:.3f}")

assert np.all(np.diff(_J_good) <= 1e-10), "distortion rose: one of your two steps is not an argmin"
assert np.all(np.diff(_J_bad) <= 1e-10), "distortion rose: one of your two steps is not an argmin"

# %%
distill.check("lloyd-loop", kmeans)

# %% [markdown]
# ## 4. k-means++ seeding (optional)
#
# The bad plateau above came from a bad start. k-means++ replaces uniform
# seeding with $D^2$ sampling: pick each next center with probability
# proportional to the squared distance from the nearest center already
# chosen — far, unclaimed regions get seeded; already-covered ones do not.
#
# The checkpoint replays your random draws, so the specification pins them
# exactly. With `rng` the passed-in generator and `n = len(X)`:
#
# - first center: `X[rng.integers(n)]`;
# - each subsequent center: `X[rng.choice(n, p=D2 / D2.sum())]`, where
#   `D2[i]` is the squared distance from `X[i]` to the nearest center chosen
#   so far;
# - exactly one generator call per center, in this order, and nothing else
#   touches `rng`.

# %%
def kmeanspp(X, K, rng):
    """k-means++ initialization by D² sampling.

    Args:
        X: (n, d) points.
        K: number of centers to choose.
        rng: numpy Generator; consumed exactly as specified above.
    Returns:
        (K, d) chosen centers (rows of X).
    """
    # BEGIN SOLUTION
    n = len(X)
    C = np.empty((K, X.shape[1]))
    C[0] = X[rng.integers(n)]
    d2 = ((X - C[0]) ** 2).sum(1)
    for k in range(1, K):
        C[k] = X[rng.choice(n, p=d2 / d2.sum())]
        d2 = np.minimum(d2, ((X - C[k]) ** 2).sum(1))
    return C
    # END SOLUTION

# %%
# The experiment behind the claim: 20 single runs per seeding scheme, same
# data, and the distribution of final distortions. Neither scheme is safe in
# a single run — that is what restarts are for — but D² seeding reaches the
# best plateau about twice as often here, and its worst runs are less wrong.
def restart_experiment(X, K, n_restarts, seed):
    rng_u, rng_p = np.random.default_rng(seed), np.random.default_rng(seed)
    uniform, plus = [], []
    for _ in range(n_restarts):
        uniform.append(kmeans(X, X[rng_u.choice(len(X), K, replace=False)], 40)[2][-1])
        plus.append(kmeans(X, kmeanspp(X, K, rng_p), 40)[2][-1])
    return np.array(uniform), np.array(plus)

_uni, _pp = restart_experiment(X_blobs, 6, 20, seed=7)
plt.hist([_uni, _pp], bins=12, label=["uniform", "k-means++"])
plt.xlabel("final distortion J"); plt.ylabel("runs"); plt.legend(); plt.show()
print(f"runs at the best plateau (J < 0.55): uniform {np.sum(_uni < 0.55)}/20, k-means++ {np.sum(_pp < 0.55)}/20")
assert _pp.mean() < _uni.mean(), "on this data D² seeding should beat uniform on average"

# %%
distill.check("kmeanspp", kmeanspp)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — pseudocode</summary>
#
# ```
# C[0] ← X[rng.integers(n)]
# D2   ← squared distances from every point to C[0]
# for k in 1..K−1:
#     C[k] ← X[rng.choice(n, p=D2 / D2.sum())]
#     D2   ← elementwise min of D2 and squared distances to C[k]
# ```
# The two classic bugs are the two wrong-variant verdicts: weighting by
# distance instead of squared distance, and forgetting to refresh `D2`
# after each draw.
# </details>
#
# <details><summary>Hint 2 — last resort</summary>
#
# `np.minimum(d2, ((X - C[k]) ** 2).sum(1))` is the refresh. If the check
# still fails, count your generator calls: one `integers`, then K−1
# `choice` calls, nothing else — an extra draw desynchronizes the replay.
# </details>

# %% [markdown]
# ## 5. Image compression by vector quantization
#
# A color image spends 24 bits per pixel: 8 per channel. Vector quantization
# spends them differently — cluster the pixels' RGB values, keep only the K
# centroid colors (the *codebook*) and each pixel's centroid index. The
# ledger for an image of $n$ pixels:
#
# $$\text{bits} = \underbrace{24K}_{\text{codebook}} + \underbrace{n \log_2 K}_{\text{indices}},
# \qquad \text{bpp} = \frac{24K + n \log_2 K}{n}.$$
#
# For the 200×150 photograph below ($n = 30{,}000$): K=4 gives 2.003 bpp — a
# 12× compression — and K=16 gives 4.013 bpp, 6×. The distortion your
# k-means minimizes is exactly the reconstruction error of that compression,
# measured in RGB space.
#
# The photograph: astronaut Eileen Collins, NASA (public domain), as
# distributed with scikit-image, downsampled to 200×150.

# %%
# Infrastructure (do not modify): load and show the image. Pixel values are
# scaled to [0, 1]; the (h, w, 3) array flattens to (n, 3) points for your
# kmeans.
img = np.load("data/photo.npy").astype(np.float64) / 255.0
plt.imshow(img); plt.axis("off"); plt.title(f"original, 24 bpp, {img.shape[0]}x{img.shape[1]}"); plt.show()

# %% [markdown]
# Specification for `vq_image`:
#
# - flatten to `(n, 3)` pixels;
# - initialize with the deterministic spread
#   `pixels[np.linspace(0, n - 1, K).astype(int)]` (no randomness: the
#   checkpoint compares exact outputs);
# - run your `kmeans` for `iters` iterations;
# - return the `(K, 3)` codebook, the `(h, w)` index map (final labels,
#   reshaped), and the bits-per-pixel from the ledger above.

# %%
def vq_image(img, K, iters):
    """Vector-quantize an RGB image with k-means.

    Args:
        img: (h, w, 3) float array, values in [0, 1].
        K: codebook size.
        iters: k-means iterations.
    Returns:
        (codebook, idx, bpp): (K, 3) centroid colors, (h, w) integer index
        map, scalar bits per pixel of the compressed representation.
    """
    # BEGIN SOLUTION
    px = img.reshape(-1, 3)
    n = len(px)
    C0 = px[np.linspace(0, n - 1, K).astype(int)]
    C, labels, _ = kmeans(px, C0, iters)
    return C, labels.reshape(img.shape[:2]), (24.0 * K + n * np.log2(K)) / n
    # END SOLUTION

# %%
# The compression, seen: reconstruct by looking each pixel's index up in the
# codebook. K=4 posterizes; K=16 is already hard to tell apart at a glance.
for _K in (4, 16):
    _cb, _idx, _bpp = vq_image(img, _K, 15)
    plt.imshow(_cb[_idx]); plt.axis("off")
    plt.title(f"K={_K}: {_bpp:.3f} bpp, {24.0 / _bpp:.1f}x smaller"); plt.show()

# %%
distill.check("image-vq", vq_image)

# %% [markdown]
# ## 6. The E-step: responsibilities in log space
#
# k-means assigns each point to one cluster, all or nothing. The Gaussian
# mixture from the lessons replaces that hard choice with a posterior — the
# responsibility of component $k$ for point $x_i$:
#
# $$r_{ik} = \frac{\pi_k \, \mathcal{N}(x_i \mid \mu_k, \Sigma_k)}
# {\sum_{j=1}^{K} \pi_j \, \mathcal{N}(x_i \mid \mu_j, \Sigma_j)},
# \qquad
# \ln \mathcal{N}(x \mid \mu, \Sigma) = -\tfrac{1}{2}\big( d \ln 2\pi
# + \ln \lvert \Sigma \rvert + (x-\mu)^\top \Sigma^{-1} (x-\mu) \big).$$
#
# The trap is the same one the logistic-regression lab hit with
# `log(sigmoid)`: a point far from every component has densities that
# underflow to exactly `0.0` in float64, and the ratio becomes `0/0`. The
# ratio itself is perfectly well defined — only the detour through raw
# densities breaks. So never leave log space until the end: build the
# `(n, K)` matrix $\ln \pi_k + \ln \mathcal{N}(x_i \mid \mu_k, \Sigma_k)$,
# get $\ln p(x_i)$ by log-sum-exp over each row (subtract the row max before
# exponentiating), and exponentiate only the difference. The checkpoint
# inputs contain a point hundreds of standard deviations out on purpose: an
# implementation that exponentiates first produces NaN there and cannot be
# graded as anything but wrong.
#
# `np.linalg.slogdet` and `np.linalg.solve` handle the determinant and
# $\Sigma^{-1}(x-\mu)$; a loop over the K components is fine.

# %%
def e_step(X, pi, mu, Sigma):
    """Responsibilities and per-point log-evidence of a Gaussian mixture.

    Args:
        X: (n, d) points.
        pi: (K,) mixing weights, summing to 1.
        mu: (K, d) component means.
        Sigma: (K, d, d) component covariances.
    Returns:
        (R, logpx): R is (n, K), rows summing to 1, R[i, k] the
        responsibility of component k for point i; logpx is (n,), the log
        marginal density ln p(x_i) under the mixture.
    """
    # BEGIN SOLUTION
    n, d = X.shape
    K = len(pi)
    logw = np.empty((n, K))
    for k in range(K):
        diff = X - mu[k]
        _, logdet = np.linalg.slogdet(Sigma[k])
        maha = (diff * np.linalg.solve(Sigma[k], diff.T).T).sum(1)
        logw[:, k] = np.log(pi[k]) - 0.5 * (d * np.log(2 * np.pi) + logdet + maha)
    m = logw.max(1, keepdims=True)
    logpx = (m + np.log(np.exp(logw - m).sum(1, keepdims=True))).ravel()
    return np.exp(logw - logpx[:, None]), logpx
    # END SOLUTION

# %%
# The stability test your implementation must survive: a point 500 units
# from every component. Its responsibilities are still a well-defined split
# between the components — if you see nan here, you exponentiated before
# normalizing.
_pi_t = np.array([0.6, 0.4])
_mu_t = np.array([[0.0, 0.0], [3.0, 0.0]])
_Sig_t = np.stack([np.eye(2), np.eye(2)])
_R_t, _lp_t = e_step(np.array([[1.0, 1.0], [500.0, 500.0]]), _pi_t, _mu_t, _Sig_t)
assert np.allclose(_R_t.sum(1), 1.0), "responsibility rows must sum to 1"
assert np.all(np.isfinite(_R_t)) and np.all(np.isfinite(_lp_t)), \
    "nan/inf on the outlier: stay in log space until the final exp"

# %%
distill.check("e-step", e_step)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — pseudocode</summary>
#
# ```
# for k in 0..K−1:
#     diff        ← X − mu[k]                        # (n, d)
#     maha        ← rowwise diff · Σₖ⁻¹ diff         # (n,), via solve
#     logw[:, k]  ← ln πₖ − ½ (d ln 2π + ln|Σₖ| + maha)
# m     ← rowwise max of logw
# logpx ← m + ln Σₖ exp(logw − m)                    # log-sum-exp
# R     ← exp(logw − logpx)
# ```
# </details>
#
# <details><summary>Hint 2 — last resort</summary>
#
# The Mahalanobis row is
# `(diff * np.linalg.solve(Sigma[k], diff.T).T).sum(1)`. If the check fails
# with finite outputs, the two wrong-variant verdicts name the usual
# omissions: the $\pi_k$ weights, or the $\ln \lvert \Sigma_k \rvert$
# normalizer.
# </details>

# %% [markdown]
# ## 7. The M-step
#
# Given responsibilities, each component refits itself on its weighted share
# of the data. With $N_k = \sum_i r_{ik}$ the effective count:
#
# $$\pi_k = \frac{N_k}{n}, \qquad
# \mu_k = \frac{1}{N_k} \sum_i r_{ik}\, x_i, \qquad
# \Sigma_k = \frac{1}{N_k} \sum_i r_{ik}\, (x_i - \mu_k)(x_i - \mu_k)^\top
# + \varepsilon I .$$
#
# The $\varepsilon I$ term is the singularity guard from the lessons: it
# floors every eigenvalue of $\Sigma_k$ away from zero, so no component can
# collapse onto a single point and send the likelihood to infinity. Use
# `EPS` below. Note the covariance is centered on the component's own
# weighted mean $\mu_k$ — the one you just computed — and normalized by
# $N_k$, not $n$.

# %%
EPS = 1e-6  # covariance floor: Sigma_k gets EPS * I added, always

def m_step(X, R):
    """Refit mixture parameters from responsibilities.

    Args:
        X: (n, d) points.
        R: (n, K) responsibilities, rows summing to 1.
    Returns:
        (pi, mu, Sigma): (K,) mixing weights, (K, d) means, (K, d, d)
        covariances (floored by EPS * I).
    """
    # BEGIN SOLUTION
    n, d = X.shape
    Nk = R.sum(0)
    pi = Nk / n
    mu = (R.T @ X) / Nk[:, None]
    Sigma = np.empty((R.shape[1], d, d))
    for k in range(R.shape[1]):
        diff = X - mu[k]
        Sigma[k] = (R[:, k, None] * diff).T @ diff / Nk[k] + EPS * np.eye(d)
    return pi, mu, Sigma
    # END SOLUTION

# %%
# Sanity check: with hard 0/1 responsibilities the M-step must reduce to
# per-cluster sample statistics — the k-means update with extra bookkeeping.
_rng_m = np.random.default_rng(2)
_Xm = _rng_m.normal(size=(30, 2))
_Rm = np.zeros((30, 2)); _Rm[:20, 0] = 1.0; _Rm[20:, 1] = 1.0
_pim, _mum, _ = m_step(_Xm, _Rm)
assert np.allclose(_pim, [2 / 3, 1 / 3])
assert np.allclose(_mum[0], _Xm[:20].mean(0)), "hard responsibilities must give the plain cluster mean"

# %%
distill.check("m-step", m_step)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Compute `Nk = R.sum(0)` first — all three formulas divide by it. The
# means need no loop: $R^\top X$ is `(K, d)`, and row $k$ is component
# $k$'s weighted sum. The covariances are a loop over the K components,
# and the no-loops-over-points rule is satisfied by turning the weighted
# outer-product sum $\sum_i r_{ik}\, d_i d_i^\top$ into one matrix
# product: scale each row of the centered data by its responsibility, then
# contract against the unscaled centered data. Center on $\mu_k$ — the
# mean you just computed — and add the floor to every component,
# unconditionally.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# Nk ← column sums of R                        # (K,)
# pi ← Nk / n
# mu ← (Rᵀ X) with row k divided by Nk[k]      # (K, d)
# for k in 0..K−1:
#     diff     ← X − mu[k]                     # (n, d)
#     Sigma[k] ← (diff rows scaled by R[:, k])ᵀ · diff / Nk[k] + EPS·I
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# The weighted contraction is `(R[:, k, None] * diff).T @ diff` — the
# `None` makes the responsibility column `(n, 1)` so it broadcasts across
# the d coordinates. If the check still fails, the wrong-variant verdicts
# name the canonical omissions: pi left unnormalized, centering on the
# global mean, dividing by n instead of N_k, and the missing EPS floor.
# </details>

# %% [markdown]
# ## 8. Full EM on Old Faithful
#
# The data is real and famously two-regime: 272 consecutive eruptions of the
# Old Faithful geyser in Yellowstone National Park — each row an eruption's
# duration and the waiting time until the next one, both in minutes. Short
# eruptions are followed by short waits, long by long, and the two regimes
# make it the canonical two-component mixture dataset (it runs through
# Bishop's PRML mixture chapters; the 272-row version ships with R). The
# loader below standardizes both columns.
#
# Assemble the fitter — your E-step and M-step in alternation. The module
# proved the loop can never lower the data's log-likelihood: the E-step
# makes the ELBO tight, the M-step maximizes it. Your `ll` history is that
# proof, run on real data.
#
# Specification:
#
# - run exactly `iters` iterations from the given initialization;
# - each iteration: E-step, record `ll[t] = logpx.mean()` — the mean
#   log-likelihood at the parameters iteration t started from, so it is
#   recorded **before** the M-step moves them — then M-step;
# - return the final parameters and the `(iters,)` history.

# %%
def fit_gmm(X, pi0, mu0, Sigma0, iters):
    """Fit a Gaussian mixture by EM.

    Args:
        X: (n, d) points.
        pi0: (K,) initial mixing weights.
        mu0: (K, d) initial means.
        Sigma0: (K, d, d) initial covariances.
        iters: number of EM iterations.
    Returns:
        (pi, mu, Sigma, ll): final parameters and the (iters,) history;
        ll[t] is the mean log-likelihood BEFORE the M-step of iteration t.
    """
    # BEGIN SOLUTION
    pi, mu, Sigma = pi0, mu0, Sigma0
    ll = np.empty(iters)
    for t in range(iters):
        R, logpx = e_step(X, pi, mu, Sigma)
        ll[t] = logpx.mean()
        pi, mu, Sigma = m_step(X, R)
    return pi, mu, Sigma, ll
    # END SOLUTION

# %%
# Infrastructure (do not modify): scatter colored by responsibility, with
# each component's 2-sigma covariance ellipse.
def plot_gmm(X, R, mu, Sigma, title=""):
    plt.scatter(X[:, 0], X[:, 1], c=R[:, 0], s=10, cmap="coolwarm")
    t = np.linspace(0, 2 * np.pi, 100)
    circle = np.stack([np.cos(t), np.sin(t)])
    for k in range(len(mu)):
        vals, vecs = np.linalg.eigh(Sigma[k])
        ellipse = (vecs @ (2 * np.sqrt(vals)[:, None] * circle)).T + mu[k]
        plt.plot(ellipse[:, 0], ellipse[:, 1], c="black", lw=1)
    plt.xlabel("eruption duration (std)"); plt.ylabel("waiting time (std)")
    plt.title(title); plt.show()

# %%
# The run the checkpoint verifies: a deliberately crossed initialization —
# each mean starts inside the wrong regime — so EM has visible work to do.
# The staircase must climb at every step; the module proved it has to.
raw_faithful = np.loadtxt("data/faithful.csv", delimiter=",")
X_faithful = (raw_faithful - raw_faithful.mean(0)) / raw_faithful.std(0)

pi0 = np.array([0.5, 0.5])
mu0 = np.array([[-1.0, 1.0], [1.0, -1.0]])
Sigma0 = np.stack([np.eye(2), np.eye(2)])

_pi_f, _mu_f, _Sig_f, _ll = fit_gmm(X_faithful, pi0, mu0, Sigma0, 50)
plot_histories("mean log-likelihood", EM=_ll)
_R_f, _ = e_step(X_faithful, _pi_f, _mu_f, _Sig_f)
plot_gmm(X_faithful, _R_f, _mu_f, _Sig_f, "Old Faithful, K=2, after 50 EM iterations")

assert np.all(np.diff(_ll) >= -1e-9), \
    "the log-likelihood decreased: EM's monotonicity theorem says the bug is in your E- or M-step"
assert _ll[5] - _ll[0] > 0.01, \
    "no progress in five iterations: is the M-step actually moving the parameters?"

# %%
distill.check("em-monotone", fit_gmm)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Both moves already exist and are already verified — this function only
# alternates them, so if it misbehaves the bug is almost always in the
# bookkeeping, not the math. One iteration is: E-step, record, M-step —
# in that order. The E-step hands you `logpx` for free, and its mean IS
# `ll[t]`: the likelihood at the parameters iteration t started from.
# Nothing needs computing twice — if you find yourself calling `e_step`
# a second time just to get a number to record, the recording is in the
# wrong place (that is exactly the wrong-variant verdict: a history
# shifted one step, which still climbs but matches nothing).
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# pi, mu, Sigma ← pi0, mu0, Sigma0
# ll ← (iters,)
# for t in 0..iters−1:
#     R, logpx ← e_step(X, pi, mu, Sigma)
#     ll[t]    ← mean of logpx
#     pi, mu, Sigma ← m_step(X, R)
# return pi, mu, Sigma, ll
# ```
# </details>

# %% [markdown]
# ## 9. Written answer: the singularity your floor prevents
#
# The maximum-likelihood surface of a Gaussian mixture has no global
# maximum. In 3–6 sentences, in the cell below: describe a concrete
# initialization of a 2-component mixture on this dataset that would drive
# the log-likelihood to $+\infty$ if nothing guarded against it, name which
# parameter runs away and why the likelihood grows without bound, and state
# what in your `m_step` stops it. (You can watch it happen: set `EPS = 0`
# above, re-run with your adversarial initialization, and restore `EPS`
# afterwards.)

# %%
distill.submit_review(
    "singularity-hunt",
    "Place one component's mean exactly on a single data point and shrink its "
    "initial covariance toward zero, with the other component left broad to "
    "cover the rest. The runaway parameter is that component's covariance: the "
    "density of the point it sits on scales like 1/sqrt(det(Sigma)), which grows "
    "without bound as Sigma -> 0, while the broad component keeps every other "
    "point's density bounded away from zero, so the total log-likelihood "
    "increases to infinity along this path. It is a degeneracy of the "
    "likelihood surface, not a good fit: the collapsing component explains one "
    "point infinitely well and nothing else. The EPS * I term added to every "
    "covariance in m_step floors the eigenvalues at EPS, which bounds "
    "1/sqrt(det(Sigma)) and removes the singular path.",
)

# %% [markdown]
# ## 10. Open task: recover the centers
#
# `data/blobs.csv` — the six-cluster workbench from sections 3 and 4 — was
# generated from six Gaussian clusters whose true centers are held on the
# course server. Recover them. This is the lab's k-means pipeline — seeded
# restarts, selection, one answer — run end to end, and this time the
# decisions are yours: how to seed (your `kmeanspp` if you built it;
# uniform draws of K distinct points also work and just land on the best
# plateau less often — section 4 measured how much less), how many restarts
# to run, how many iterations per run, and how to pick the winner. Section
# 3 showed what a single run risks; choose a budget under which missing the
# best plateau every time is implausible, and be ready to defend the
# criterion your selection uses.
#
# Only the submission format is fixed, because the server compares against
# a sorted reference: sort your six winning centroids by their first
# coordinate, flatten to shape `(12,)`, and submit. The score is the
# root-mean-square error against the true centers, shown negated (every
# metric on the platform reads higher-is-better); the passing threshold is
# on the lesson page.
#
# Before spending a submission — attempts are limited per day — look at
# your winner:
#
# ```python
# plot_clusters(X_blobs, labels, C, f"winning run, J = {bestJ:.3f}")
# ```
#
# Six tight blobs, each with an × at its heart, is the picture that
# passes. A run stuck on a plateau from section 3 shows a split blob and a
# merged pair, and its final distortion sits well above the reference
# pipeline's best, about 0.49. The plot is free; a submission is not.

# %%
# BEGIN SOLUTION
# Budget rationale: section 4's experiment put single-run success (J < 0.55)
# at roughly 1/2 for D² seeding, so 20 restarts miss with probability ~2⁻²⁰.
_rng_r = np.random.default_rng(0)
_best, _best_lab, _bestJ = None, None, np.inf
for _ in range(20):
    _C, _lab, _J = kmeans(X_blobs, kmeanspp(X_blobs, 6, _rng_r), 50)
    if _J[-1] < _bestJ:
        _bestJ, _best, _best_lab = _J[-1], _C, _lab
plot_clusters(X_blobs, _best_lab, _best, f"winning run, J = {_bestJ:.3f}")
preds = _best[np.argsort(_best[:, 0])].ravel()
# END SOLUTION

# %%
distill.submit_predictions("recover-centers", preds)

# %% [markdown]
# If stuck, open the folds in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Everything is built: a seeder, `kmeans`, and one number per run that is
# comparable across runs — the final distortion `J[-1]`, on the same data
# with the same K — so "keep the run with the lowest final J" is the
# selection criterion, exactly how section 4's experiment ranked runs. For
# the budget, section 4 is the calibration: it counted how often a single
# run of each seeding lands at the best plateau (J < 0.55); pick a number
# of restarts that makes missing every time implausible. Reuse one
# generator across all restarts so each seeding differs.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# rng ← default_rng(your seed)
# best ← None; bestJ ← ∞
# repeat (your budget) times:
#     C0 ← your seeding of 6 centers
#     C, labels, J ← kmeans(X_blobs, C0, enough iterations to plateau)
#     if J[-1] < bestJ: keep C, labels, J[-1]
# plot the kept run; submit when it looks right
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# If your submission scores just under the threshold while your best J is
# near 0.49, the sort is the likely culprit: sort the six rows by the first
# coordinate only, keep each row intact, and flatten row-major — exactly
# `C[np.argsort(C[:, 0])].ravel()`.
# </details>

# %%
distill.dump()
