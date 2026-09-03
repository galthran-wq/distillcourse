# %% [markdown]
# # Lab: Gaussian process regression with conformal intervals
#
# Module 10 built two uncertainty machines on paper. This lab turns both into
# code you can point at data. The first is a Gaussian process: a kernel, the
# Cholesky implementation of the predictive equations, the log marginal
# likelihood that scores hyperparameters without a validation set, and a grid
# search over it. The second is split conformal: one calibration quantile, two
# score functions, and a coverage measurement. Then both are aimed at the same
# record — the monthly CO₂ series from Mauna Loa — and graded on data neither
# of them saw.
#
# Ground rules:
#
# - **No sklearn, no scipy, no GPy** — every line below is your numpy. (Checking
#   your answers against a library on your own machine is fine; the graded work
#   is yours.)
# - **Never form a matrix inverse.** Every solve in this lab goes through one
#   Cholesky factorization; section 4 measures what `np.linalg.inv` costs you.
# - Each checkpoint cell submits your function's outputs to the course server,
#   which compares them against a reference. Run them as you go. The seven
#   exact checkpoints are the required set; the written answer and the open
#   task at the end are optional — partial completion is a normal way to
#   finish a lab.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/gp-lab")

# %% [markdown]
# ## 1. The kernel is the model
#
# A Gaussian process is fixed by its covariance function, and every modeling
# decision in this lab is a decision about that function. The working choice is
# the squared exponential, module 4's RBF kernel under its GP-literature name:
#
# $$k(x, x') = \sigma_f^2 \exp\!\Big( -\frac{(x - x')^2}{2\ell^2} \Big) .$$
#
# Two numbers with units. The **lengthscale** $\ell$ is the distance in input
# space you must move before the function may change appreciably; the **signal
# variance** $\sigma_f^2$ is the value of $k$ at zero distance, so it is the
# prior variance of $f(x)$ at every single input — the vertical scale of the
# functions the prior considers plausible.
#
# Everything downstream calls this function on pairs of input sets, so write it
# to take two vectors and return the full matrix of pairwise values — and write
# it without a Python loop. The grid search in section 6 calls it once per grid
# cell, so a loop over the $n^2$ entries would dominate the runtime of every
# fit below. Numpy's broadcasting rules are what replace the loop: the shapes
# you give the two input vectors decide the shape of what comes back.

# %%
def se_kernel(XA, XB, lengthscale, signal_var):
    """Squared-exponential kernel matrix between two sets of 1-D inputs.

    Args:
        XA: (n,) inputs.
        XB: (m,) inputs.
        lengthscale: ℓ > 0.
        signal_var: σf² > 0, the kernel's value at zero distance.
    Returns:
        (n, m) array with entry [i, j] equal to k(XA[i], XB[j]).
    """
    # BEGIN SOLUTION
    r = XA[:, None] - XB[None, :]
    return signal_var * np.exp(-(r**2) / (2 * lengthscale**2))
    # END SOLUTION

# %%
# Three local referees before submitting: the diagonal is the signal variance,
# the matrix is symmetric when both argument sets are the same, and it is
# positive semidefinite — Mercer's condition, checked numerically.
_x = np.linspace(0.0, 4.0, 9)
_K = se_kernel(_x, _x, 1.0, 2.0)
assert _K.shape == (9, 9)
assert np.allclose(np.diag(_K), 2.0)
assert np.allclose(_K, _K.T)
assert np.linalg.eigvalsh(_K).min() > -1e-10
# Correlation falls off with distance and with a shorter lengthscale.
assert se_kernel(np.array([0.0]), np.array([1.0]), 1.0, 1.0)[0, 0] > \
       se_kernel(np.array([0.0]), np.array([1.0]), 0.3, 1.0)[0, 0]

# %%
distill.check("kernel-matrix", se_kernel)

# %% [markdown]
# ## 2. What the prior asserts, drawn
#
# The kernel is a claim about functions, and the claim can be looked at before
# any data arrives. Evaluate $k$ on a grid of inputs and the prior over the
# function values there is the plain multivariate Gaussian $\mathcal{N}(0, K)$;
# a draw from it is one sample function, plotted against the grid.
#
# Drawing it is where the Cholesky factorization enters the lab.
# `np.linalg.cholesky(K)` returns the lower-triangular $L$ with
# $L L^\top = K$, and that factor is the whole of what you are given: the draw
# has to be assembled from it and a vector of independent standard normals.
# Work out $\mathbb{E}[(Az)(Az)^\top]$ for a fixed matrix $A$ and
# $z \sim \mathcal{N}(0, I)$, and both the arrangement and which side the
# factor goes on follow from matching it to $K$. Factor once; every draw after
# that costs one matrix–vector product.
#
# One numerical detail is not optional. The SE kernel matrix on a fine grid is
# severely ill-conditioned — neighboring inputs are correlated to within
# floating-point noise, so the smallest eigenvalues sit at the rounding level
# and can come out slightly negative. `np.linalg.cholesky` then raises
# `LinAlgError`. The repair is the **jitter** the signature carries, the same
# $\sigma_n^2 I$ the noisy model adds for statistical reasons, at a size chosen
# to be invisible in the draws. Invisible in the draws is not invisible in the
# factorization: $K$ here is ill-conditioned enough that both the value of
# $\varepsilon$ and where in the matrix it lands change the numbers that come
# out, so it is part of the answer rather than a safety net — use it as the
# docstring declares it.
#
# The draws `Z` arrive as an argument rather than being generated inside, so
# that the same standard-normal numbers can be reused across lengthscales:
# column `j` of the output is one sample function, and reusing `Z` makes the
# panels below comparable rather than three unrelated random pictures.

# %%
def prior_samples(X, Z, lengthscale, signal_var, jitter=1e-8):
    """Sample functions from the GP prior N(0, K) at the inputs X.

    Args:
        X: (n,) inputs to evaluate the sample functions at.
        Z: (n, s) standard-normal draws, one column per sample.
        lengthscale, signal_var: kernel hyperparameters, for se_kernel.
        jitter: added to the diagonal of K before factorizing.
    Returns:
        (n, s) array; column j is one draw from N(0, K) evaluated at X.
    """
    # BEGIN SOLUTION
    K = se_kernel(X, X, lengthscale, signal_var)
    L = np.linalg.cholesky(K + jitter * np.eye(len(X)))
    return L @ Z
    # END SOLUTION

# %%
# Referees: the draws have the right shape, and — averaged over many of them —
# the right covariance. 4000 draws pin the sample covariance to about 1.6% of
# the signal variance, so a tolerance of 0.1 is loose but a factor of 6 tighter
# than the largest off-diagonal error a transposed or diagonal-only draw makes.
_rng = np.random.default_rng(0)
_grid = np.linspace(-2.0, 2.0, 8)
_S = prior_samples(_grid, _rng.standard_normal((8, 4000)), 1.0, 1.5)
assert _S.shape == (8, 4000)
assert np.abs(np.cov(_S) - se_kernel(_grid, _grid, 1.0, 1.5)).max() < 0.1

# %%
distill.check("prior-samples", prior_samples)

# %%
# Infrastructure (do not modify): the same four draws at three lengthscales.
# The shared Z is what makes the panels comparable — only ℓ changes.
_g = np.linspace(0.0, 10.0, 300)
_Z = np.random.default_rng(4).standard_normal((300, 4))
fig, axes = plt.subplots(1, 3, figsize=(12, 3), sharey=True)
for ax, ell in zip(axes, [0.3, 1.0, 3.0]):
    ax.plot(_g, prior_samples(_g, _Z, ell, 1.0), lw=1)
    ax.axhline(0.0, color="k", lw=0.5)
    ax.fill_between(_g, -2.0, 2.0, color="0.85", zorder=0)
    ax.set_title(f"ℓ = {ell}")
    ax.set_xlabel("x")
axes[0].set_ylabel("f(x)")
fig.suptitle("draws from the SE prior; shaded band is ±2σf")
plt.show()

# %%
# What the jitter is for: the same factorization without it, on a grid fine
# enough to make K numerically singular.
_fine = np.linspace(0.0, 10.0, 300)
try:
    np.linalg.cholesky(se_kernel(_fine, _fine, 3.0, 1.0))
    print("factorized without jitter (this machine's LAPACK tolerated it)")
except np.linalg.LinAlgError as exc:
    print(f"no jitter: {exc}")
print("smallest eigenvalue of K:",
      f"{np.linalg.eigvalsh(se_kernel(_fine, _fine, 3.0, 1.0)).min():.3e}",
      "— negative by rounding alone")

# %% [markdown]
# ## 3. The data: a wave under noise that grows
#
# The development set is generated, so that every claim about coverage can be
# checked against a truth you can print:
#
# $$f(x) = \sin(2\pi x) + 0.4\,x, \qquad
#   y = f(x) + \sigma(x)\,\varepsilon, \quad
#   \sigma(x) = 0.04 + 0.5\,(x/3)^2, \quad \varepsilon \sim \mathcal{N}(0, 1) .$$
#
# The noise level is **not** constant: it runs from 0.04 at the left edge to
# 0.54 at the right, a factor of thirteen. Nothing in the model below will know
# that. The GP will be fitted with a single noise variance $\sigma_n^2$, which
# is a false claim about this data, and section 8 measures what the falsehood
# costs each of the two constructions.
#
# Three splits, drawn independently from the same generator, so they are
# exchangeable by construction — the hypothesis the conformal theorem needs:
# 80 training points, 300 calibration points, 600 test points.

# %%
# Infrastructure (do not modify): the generator and the three splits.
def true_f(x):
    return np.sin(2 * np.pi * x) + 0.4 * x


def noise_sd(x):
    return 0.04 + 0.5 * (x / 3.0) ** 2


_data_rng = np.random.default_rng(11)


def _draw(m):
    x = np.sort(_data_rng.uniform(0.0, 3.0, size=m))
    return x, true_f(x) + noise_sd(x) * _data_rng.standard_normal(m)


x_train, y_train = _draw(80)
x_calib, y_calib = _draw(300)
x_test, y_test = _draw(600)
print(f"train {len(x_train)}, calibration {len(x_calib)}, test {len(x_test)}")
print(f"noise sd at x=0.5: {noise_sd(0.5):.3f}   at x=2.8: {noise_sd(2.8):.3f}")


def plot_band(x_grid, mu, sd, title, z=1.6448536):
    """Posterior mean and a z-sigma band over a grid, with the training data."""
    plt.figure(figsize=(9, 3.2))
    plt.fill_between(x_grid, mu - z * sd, mu + z * sd, color="0.85",
                     label=f"±{z:.2f}σ band")
    plt.plot(x_grid, mu, color="C1", lw=1.5, label="posterior mean")
    plt.plot(x_grid, true_f(x_grid), color="C0", lw=1, ls="--", label="truth")
    plt.plot(x_train, y_train, "k.", ms=4, label="training data")
    plt.xlabel("x"); plt.ylabel("y"); plt.title(title)
    plt.legend(fontsize=7, loc="upper left"); plt.show()


plt.figure(figsize=(9, 3.2))
plt.plot(x_test, y_test, ".", ms=3, color="0.6", label="test draws")
plt.plot(x_train, y_train, "k.", ms=5, label="training data")
_fine_grid = np.linspace(0, 3, 400)
plt.plot(_fine_grid, true_f(_fine_grid), color="C0", lw=1.5, label="f(x)")
plt.xlabel("x"); plt.ylabel("y"); plt.title("the development set: noise widens to the right")
plt.legend(fontsize=7); plt.show()

# %% [markdown]
# ## 4. Algorithm 2.1: the posterior, without an inverse
#
# The predictive equations for a test input $x_*$, derived in
# the GP lesson by conditioning a partitioned Gaussian:
#
# $$\bar f_* = \mathbf{k}_*^\top (K + \sigma_n^2 I)^{-1} y,
#   \qquad
#   \mathbb{V}[f_*] = k_{**} - \mathbf{k}_*^\top (K + \sigma_n^2 I)^{-1} \mathbf{k}_* .$$
#
# Those are statements about the distribution, not instructions for a program.
# The inverse is never formed: it costs about three times the arithmetic of a
# factorization-and-solve, and it multiplies the error of the result by the
# condition number of $K + \sigma_n^2 I$, which is large exactly when training
# inputs crowd together — the regime every GP fit lives in.
#
# What replaces it is one Cholesky factorization $L L^\top = K + \sigma_n^2 I$,
# reused three times: for the mean (through $\alpha$, the solution of
# $(K + \sigma_n^2 I)\alpha = y$, obtained as two triangular solves), for the
# variance (through $v = L^{-1} \mathbf{k}_*$, one triangular solve per test
# point), and in section 5 for the evidence. Derive the two expressions
# yourself: substitute $L L^\top$ for $K + \sigma_n^2 I$ in the equations above
# and read off what each triangular solve produces. `np.linalg.solve` on a
# triangular matrix does the right thing here; `np.linalg.inv` does not appear.
#
# The function takes kernel *matrices* rather than inputs and hyperparameters,
# so it works for any kernel at all — section 9b drops an eleven-hyperparameter
# composite kernel into exactly this code.

# %%
def gp_posterior(K, y, Ks, kss, noise_var):
    """GP predictive mean and variance of the latent f at test inputs.

    Args:
        K: (n, n) kernel matrix of the training inputs, WITHOUT noise.
        y: (n,) observed targets, already centered.
        Ks: (n, m) kernel matrix between training and test inputs.
        kss: (m,) prior variances k(x*, x*) at the test inputs.
        noise_var: σn², the observation noise variance.
    Returns:
        (mean, var): both (m,). var is V[f*], the LATENT function's variance —
        no noise added. Use one Cholesky factorization and triangular solves;
        do not form an inverse.
    """
    # BEGIN SOLUTION
    L = np.linalg.cholesky(K + noise_var * np.eye(len(y)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    v = np.linalg.solve(L, Ks)
    return Ks.T @ alpha, kss - (v**2).sum(axis=0)
    # END SOLUTION

# %%
# Four referees, each one a boundary the equations must respect.
_xt = np.array([-2.0, -0.7, 0.4, 1.9])
_yt = np.array([0.3, -1.1, 0.8, 0.2])
_xs = np.array([-2.0, 0.4, 40.0])          # two training inputs, one far away
_K = se_kernel(_xt, _xt, 1.0, 1.0)
_mu, _var = gp_posterior(_K, _yt, se_kernel(_xt, _xs, 1.0, 1.0),
                         np.full(3, 1.0), 1e-8)
# (1) with almost no noise the posterior interpolates the observations,
assert np.allclose(_mu[:2], [0.3, 0.8], atol=1e-4)
# (2) and its variance there collapses to the noise floor.
assert _var[0] < 1e-6
# (3) Far from every observation the prior comes back untouched.
assert abs(_mu[2]) < 1e-9 and abs(_var[2] - 1.0) < 1e-9
# (4) A variance is never negative and never exceeds the prior.
_mu2, _var2 = gp_posterior(_K, _yt, se_kernel(_xt, _fine_grid, 1.0, 1.0),
                           np.full(len(_fine_grid), 1.0), 0.04)
assert _var2.min() > -1e-12 and _var2.max() <= 1.0 + 1e-12

# %%
distill.check("gp-posterior", gp_posterior)

# %%
# Infrastructure (do not modify): what the inverse costs, measured.
# Twelve inputs crowded into a tenth of a lengthscale — the geometry any dense
# design has locally. Both routes compute the same mean in exact arithmetic;
# the residual of the linear system they claim to have solved is not the same.
_crowd = np.linspace(0.0, 0.1, 12)
_Kc = se_kernel(_crowd, _crowd, 1.0, 1.0) + 1e-10 * np.eye(12)
_yc = np.sin(3 * _crowd)
_alpha_chol = np.linalg.solve(np.linalg.cholesky(_Kc).T,
                              np.linalg.solve(np.linalg.cholesky(_Kc), _yc))
_alpha_inv = np.linalg.inv(_Kc) @ _yc
print(f"cond(K + σn²I) = {np.linalg.cond(_Kc):.2e}")
print(f"‖Kα − y‖ via Cholesky solves: {np.linalg.norm(_Kc @ _alpha_chol - _yc):.3e}")
print(f"‖Kα − y‖ via inv(K) @ y:      {np.linalg.norm(_Kc @ _alpha_inv - _yc):.3e}")

# %% [markdown]
# ## 5. The evidence: one number that ranks kernels
#
# Under the model, $y$ is a single draw from $\mathcal{N}(0, K_y)$ with
# $K_y = K + \sigma_n^2 I$ — the joint prior with the function values
# integrated out — so the log marginal likelihood is one Gaussian log density:
#
# $$\log p(y \mid X, \theta)
#   = -\tfrac12\, y^\top K_y^{-1} y
#     \;-\; \tfrac12 \log |K_y|
#     \;-\; \tfrac{n}{2} \log 2\pi .$$
#
# Every hyperparameter is inside $K_y$, and no held-out data appears. The
# first term rewards fit, the second charges for the volume of datasets the
# prior spreads itself over, and their balance is the Occam mechanism module 10
# derived.
#
# Both matrix quantities come out of the factorization you already computed:
# $y^\top K_y^{-1} y$ from the same $\alpha$, and the log determinant from the
# diagonal of $L$ — work through what $|L L^\top|$ is in terms of $L_{ii}$
# before writing the line. This is the third use of one $O(n^3)$ factorization;
# the evidence is free once the posterior has been computed.

# %%
def log_marginal(K, y, noise_var):
    """Log marginal likelihood log p(y | X, θ) of a zero-mean GP.

    Args:
        K: (n, n) kernel matrix of the training inputs, WITHOUT noise.
        y: (n,) observed targets, already centered.
        noise_var: σn².
    Returns:
        Scalar log density, in nats.
    """
    # BEGIN SOLUTION
    L = np.linalg.cholesky(K + noise_var * np.eye(len(y)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    return -0.5 * y @ alpha - np.log(np.diag(L)).sum() - 0.5 * len(y) * np.log(2 * np.pi)
    # END SOLUTION

# %%
# Referee: the two-point case, where the Gaussian density can be written out by
# hand. With Ky = [[a, c], [c, a]], the inverse is [[a, -c], [-c, a]]/(a²−c²)
# and the determinant is a²−c².
_c = float(se_kernel(np.array([0.0]), np.array([1.3]), 1.0, 1.0)[0, 0])
_a = 1.0 + 0.05
_y2 = np.array([0.7, -0.4])
_quad = (_a * (_y2**2).sum() - 2 * _c * _y2[0] * _y2[1]) / (_a**2 - _c**2)
_closed = -0.5 * _quad - 0.5 * np.log(_a**2 - _c**2) - np.log(2 * np.pi)
assert np.isclose(log_marginal(se_kernel(np.array([0.0, 1.3]), np.array([0.0, 1.3]), 1.0, 1.0),
                               _y2, 0.05), _closed)
# A second referee: the evidence of the true generating configuration should
# beat a lengthscale ten times too long on data drawn from it.
_xg = np.sort(np.random.default_rng(5).uniform(0, 6, 40))
_yg = np.sin(_xg) + 0.2 * np.random.default_rng(6).standard_normal(40)
assert log_marginal(se_kernel(_xg, _xg, 1.0, 1.0), _yg, 0.04) > \
       log_marginal(se_kernel(_xg, _xg, 10.0, 1.0), _yg, 0.04)

# %%
distill.check("log-marginal", log_marginal)

# %%
# Infrastructure (do not modify): the three terms of the evidence, on the
# development data, as the lengthscale is swept with σn² held at 0.04.
_ells = np.logspace(-1.5, 1.0, 60)
_yc_train = y_train - y_train.mean()
_fit, _cplx = [], []
for _e in _ells:
    _L = np.linalg.cholesky(se_kernel(x_train, x_train, _e, float(np.var(_yc_train)))
                            + 0.04 * np.eye(len(x_train)))
    _al = np.linalg.solve(_L.T, np.linalg.solve(_L, _yc_train))
    _fit.append(-0.5 * _yc_train @ _al)
    _cplx.append(-np.log(np.diag(_L)).sum())
plt.figure(figsize=(7, 3.2))
plt.plot(_ells, _fit, label="data fit  −½yᵀKy⁻¹y")
plt.plot(_ells, _cplx, label="complexity  −½log|Ky|")
plt.plot(_ells, np.array(_fit) + np.array(_cplx)
         - 0.5 * len(x_train) * np.log(2 * np.pi), lw=2, label="log p(y|X)")
plt.xscale("log"); plt.ylim(-300, 100); plt.axhline(0, color="k", lw=0.5)
plt.xlabel("lengthscale ℓ (log scale)"); plt.ylabel("nats")
plt.title("the Occam trade, computed on your data"); plt.legend(fontsize=7); plt.show()

# %% [markdown]
# ## 6. Choosing the hyperparameters by evidence
#
# With the objective in hand, hyperparameter selection is a search. Gradients
# of $\log p(y \mid X, \theta)$ have a closed form and real GP libraries climb
# them; this lab searches a grid instead, which needs no derivatives, exposes
# the whole landscape (including the second optimum the GP lesson exhibited),
# and costs one factorization per grid cell.
#
# Two conventions, fixed here and assumed by everything below: the signal
# variance $\sigma_f^2$ is not searched but set to the sample variance of the
# centered targets, and the targets are centered before fitting because the
# prior mean is zero.
#
# Return the full table as well as the winner — the landscape is the diagnostic,
# and section 9 reads it.
#
# Before writing the search, look at what it is for. The cell below fits the
# development data at the far corner of the grid the search will sweep — a
# lengthscale of 5, longer than the whole input range, with a noise standard
# deviation of 2 — and draws the posterior with the same `plot_band` you will
# use on the selected fit. This is the shape of a wrong choice: the mean is a
# nearly flat line through the middle of the data, because the model has filed
# the entire wave under measurement error, and the band is wide enough to
# contain almost anything, which is the only way such a mean can cover. A band
# can be perfectly calibrated and useless. Nothing in the fit complains; the
# only complaint is the evidence, which is what this section maximizes.

# %%
# Infrastructure (do not modify): the failure shape, at the corner of the grid.
_bad_ell, _bad_nv = 5.0, 2.0**2
_bad_m = y_train.mean()
_bad_sf2 = float(np.var(y_train - _bad_m))
_bad_mu, _bad_var = gp_posterior(
    se_kernel(x_train, x_train, _bad_ell, _bad_sf2), y_train - _bad_m,
    se_kernel(x_train, _fine_grid, _bad_ell, _bad_sf2),
    np.full(len(_fine_grid), _bad_sf2), _bad_nv)
plot_band(_fine_grid, _bad_mu + _bad_m, np.sqrt(_bad_var + _bad_nv),
          f"a deliberately wrong configuration (ℓ = {_bad_ell:.0f}, "
          f"σn = {np.sqrt(_bad_nv):.0f}): the wave filed as noise")
_bad_ev = log_marginal(se_kernel(x_train, x_train, _bad_ell, _bad_sf2),
                       y_train - _bad_m, _bad_nv)
print(f"log p(y|X) at this configuration: {_bad_ev:.1f} nats")

# %%
def select_hyperparams(x, y, ell_grid, noise_grid, signal_var):
    """Pick (ℓ, σn²) by maximizing the log marginal likelihood on a grid.

    Args:
        x: (n,) training inputs.
        y: (n,) centered training targets.
        ell_grid: (P,) candidate lengthscales.
        noise_grid: (Q,) candidate noise VARIANCES σn².
        signal_var: σf², held fixed.
    Returns:
        (best_ell, best_noise_var, table): the maximizing pair, and the
        (P, Q) array with table[i, j] = log p(y | X) at
        (ell_grid[i], noise_grid[j]). Use your se_kernel and log_marginal.
    """
    # BEGIN SOLUTION
    table = np.empty((len(ell_grid), len(noise_grid)))
    for i, ell in enumerate(ell_grid):
        K = se_kernel(x, x, ell, signal_var)
        for j, nv in enumerate(noise_grid):
            table[i, j] = log_marginal(K, y, nv)
    i, j = np.unravel_index(np.argmax(table), table.shape)
    return ell_grid[i], noise_grid[j], table
    # END SOLUTION

# %%
# Referee: on data generated with a known lengthscale and known noise, the
# evidence must prefer the neighborhood of the generator over the extremes.
_xr = np.sort(np.random.default_rng(8).uniform(0, 10, 60))
_yr = np.sin(_xr) + 0.3 * np.random.default_rng(9).standard_normal(60)
_e, _nv, _tab = select_hyperparams(_xr, _yr - _yr.mean(),
                                   np.array([0.05, 0.3, 1.0, 3.0, 30.0]),
                                   np.array([1e-4, 0.01, 0.09, 1.0]), _yr.var())
assert 0.3 <= _e <= 3.0, f"selected ℓ = {_e}, but the data wiggles on a scale of ~1"
assert 0.01 <= _nv <= 0.09, f"selected σn² = {_nv}, but the noise sd was 0.3"

# %%
distill.check("hyperparam-grid", select_hyperparams)

# %%
# Infrastructure (do not modify): fit the development data and look at the
# selected configuration two ways — the evidence surface, and the posterior.
ELL_GRID = np.logspace(np.log10(0.02), np.log10(5.0), 25)
NOISE_GRID = np.logspace(np.log10(0.01), np.log10(2.0), 20) ** 2
y_mean = y_train.mean()
SIGNAL_VAR = float(np.var(y_train - y_mean))
ell_hat, nv_hat, table = select_hyperparams(x_train, y_train - y_mean,
                                            ELL_GRID, NOISE_GRID, SIGNAL_VAR)
print(f"σf² = {SIGNAL_VAR:.3f} (fixed) | selected ℓ = {ell_hat:.3f}, "
      f"σn = {np.sqrt(nv_hat):.3f} | log p(y|X) = {table.max():.1f}")

plt.figure(figsize=(5.5, 3.6))
plt.contourf(np.sqrt(NOISE_GRID), ELL_GRID, np.maximum(table, table.max() - 200), 30)
plt.plot([np.sqrt(nv_hat)], [ell_hat], "r*", ms=12)
plt.xscale("log"); plt.yscale("log")
plt.xlabel("noise sd σn"); plt.ylabel("lengthscale ℓ")
plt.title("log evidence over the grid (clipped 200 nats below the peak)")
plt.colorbar(label="nats"); plt.show()


def gp_fit_predict(x_tr, y_tr, x_q, ell, nv, sf2):
    """Fit on (x_tr, y_tr) and predict at x_q: mean and sd of a new OBSERVATION."""
    m = y_tr.mean()
    mu, var = gp_posterior(se_kernel(x_tr, x_tr, ell, sf2), y_tr - m,
                           se_kernel(x_tr, x_q, ell, sf2), np.full(len(x_q), sf2), nv)
    return mu + m, np.sqrt(var + nv)


_mu_g, _sd_g = gp_fit_predict(x_train, y_train, _fine_grid, ell_hat, nv_hat, SIGNAL_VAR)
plot_band(_fine_grid, _mu_g, _sd_g,
          f"posterior at the selected (ℓ = {ell_hat:.2f}, σn = {np.sqrt(nv_hat):.2f}); "
          "90% band for a new observation")

# %% [markdown]
# The band is very nearly the same width everywhere, because the model was
# given one noise variance to describe data whose noise varies by a factor of
# thirteen. The evidence picked the compromise that fits 80 points best on
# average. Whether that band is honest is not a question the fit can answer —
# it is a question about data the fit never saw, and the rest of the lab is
# about measuring it.
#
# ## 7. The calibration quantile
#
# Split conformal converts any model's scores into intervals with a coverage
# guarantee, and the entire machinery is one order statistic of the calibration
# scores: for a target miscoverage $\alpha$ and $n$ calibration scores, the
# threshold is the $k$-th smallest score, at the rank $k$ the coverage proof
# pins. Reconstruct that rank from the proof rather than reaching for
# `np.quantile`, whose interpolated $(1-\alpha)$ position is a different number
# and whose difference from it is not cosmetic: the rank that ignores the seat
# the theorem reserves for the unseen test point covers, at $n = 10$ and
# $\alpha = 0.1$, with probability $9/11 \approx 0.82$ against the promised
# $0.90$.
#
# Two demands on the function. It returns the rank next to the threshold — an
# off-by-one is the commonest bug in a conformal implementation, and the rank
# is where it is visible. And it respects the boundary: for $\alpha$ small
# enough, the rank the recipe asks for exceeds the number of scores you have,
# and then the threshold is $+\infty$ and the interval is everything. $n$
# points cannot certify arbitrary confidence, and the recipe refuses instead of
# pretending.

# %%
def conformal_quantile(scores, alpha):
    """The split-conformal calibration threshold.

    Args:
        scores: (n,) nonconformity scores from the calibration set.
        alpha: target miscoverage in (0, 1).
    Returns:
        (k, q): the 1-based rank k the split-conformal recipe selects, and the
        k-th smallest score — np.inf for the score when k exceeds len(scores).
    """
    # BEGIN SOLUTION
    n = len(scores)
    k = int(np.ceil((n + 1) * (1 - alpha)))
    return k, (np.inf if k > n else float(np.sort(scores)[k - 1]))
    # END SOLUTION

# %%
# Referees, starting with the conformal lesson's worked example: nine scores at
# α = 0.2 must select the 8th smallest.
_s9 = np.array([0.05, 0.12, 0.19, 0.28, 0.36, 0.45, 0.58, 0.72, 0.90])
assert conformal_quantile(_s9, 0.2) == (8, 0.72)
# The same nine scores at α = 0.1 reach the largest score, and no further.
assert conformal_quantile(_s9, 0.1) == (9, 0.90)
# Below 1/(n+1) the recipe refuses: the rank it asks for is past the last score.
assert conformal_quantile(_s9, 0.05)[1] == np.inf
# The threshold can only grow as α tightens.
_qs = [conformal_quantile(_s9, a)[1] for a in (0.5, 0.4, 0.3, 0.2)]
assert all(b >= a for a, b in zip(_qs, _qs[1:]))

# %%
distill.check("conformal-quantile", conformal_quantile)

# %% [markdown]
# ## 8. Two scores, two bands, one measurement
#
# The threshold is only as useful as the score fed to it, and a GP hands you
# two. The **residual score** $s = |y - \mu(x)|$ ignores the model's own
# uncertainty and yields a band of one constant width, $\mu(x) \pm \hat q$. The
# **scaled score** $s = |y - \mu(x)| / \sigma(x)$ divides by the GP's predictive
# standard deviation first, so the threshold is measured in units of the
# model's own error bar and the band it produces is
# $\mu(x) \pm \hat q\, \sigma(x)$ — a band that inherits the GP's shape while
# the guarantee stays distribution-free. (Angelopoulos and Bates catalogue this
# as conformalizing a scalar uncertainty estimate.)
#
# Both are conformal scores in the sense the theorem needs, so both are valid;
# they differ only in shape and width. Implement them side by side, and report
# what each buys: the fraction of test points that land inside, and the mean
# width of the intervals.

# %%
def conformal_report(mu_cal, sd_cal, y_cal, mu_test, sd_test, y_test, alpha):
    """Split-conformal intervals under two scores, with their measured coverage.

    Scores: residual s = |y − μ(x)|, and scaled s = |y − μ(x)| / σ(x).
    Intervals: μ(x) ± q̂ and μ(x) ± q̂·σ(x) respectively.

    Args:
        mu_cal, sd_cal, y_cal: (n,) model mean, model sd, and observed target
            on the calibration set.
        mu_test, sd_test, y_test: (m,) the same on the test set.
        alpha: target miscoverage.
    Returns:
        (cov_res, width_res, cov_scaled, width_scaled): for each score, the
        fraction of test points inside the interval and the MEAN interval
        width (hi − lo). Use your conformal_quantile.
    """
    # BEGIN SOLUTION
    res = np.abs(y_cal - mu_cal)
    _, q = conformal_quantile(res, alpha)
    _, q_scaled = conformal_quantile(res / sd_cal, alpha)
    dev = np.abs(y_test - mu_test)
    return (float(np.mean(dev <= q)), float(2 * q),
            float(np.mean(dev <= q_scaled * sd_test)),
            float(np.mean(2 * q_scaled * sd_test)))
    # END SOLUTION

# %%
# Referee: on data whose noise really is constant and whose model is correct,
# both scores must land near 1 − α, and the scaled band must be close to the
# residual band in width because σ(x) is nearly constant there.
_r = np.random.default_rng(3)
_mc, _sc = np.zeros(400), np.full(400, 0.5)
_yc2 = _mc + 0.5 * _r.standard_normal(400)
_mt, _st = np.zeros(2000), np.full(2000, 0.5)
_yt2 = _mt + 0.5 * _r.standard_normal(2000)
_c1, _w1, _c2, _w2 = conformal_report(_mc, _sc, _yc2, _mt, _st, _yt2, 0.1)
assert abs(_c1 - 0.9) < 0.03 and abs(_c2 - 0.9) < 0.03
assert abs(_w1 - _w2) < 0.05
# The theoretical width for a correct Gaussian model at α = 0.1: 2·1.645·0.5.
assert abs(_w1 - 2 * 1.6448536 * 0.5) < 0.1

# %%
distill.check("coverage-check", conformal_report)

# %%
# Infrastructure (do not modify): the three bands measured on the development
# data — the GP's own, and the two conformal ones — overall and on the two
# halves of the input range. Their noise levels differ by a factor of four:
# averaging σ(x) = 0.04 + 0.5(x/3)² gives 0.082 on x < 1.5 and 0.332 on
# x ≥ 1.5, which one call to `noise_sd` confirms.
mu_cal, sd_cal = gp_fit_predict(x_train, y_train, x_calib, ell_hat, nv_hat, SIGNAL_VAR)
mu_test, sd_test = gp_fit_predict(x_train, y_train, x_test, ell_hat, nv_hat, SIGNAL_VAR)
Z90 = 1.6448536
quiet, noisy = x_test < 1.5, x_test >= 1.5
gp_hit = np.abs(y_test - mu_test) <= Z90 * sd_test
c_res, w_res, c_sca, w_sca = conformal_report(mu_cal, sd_cal, y_calib,
                                              mu_test, sd_test, y_test, 0.1)
_, q_res = conformal_quantile(np.abs(y_calib - mu_cal), 0.1)
_, q_sca = conformal_quantile(np.abs(y_calib - mu_cal) / sd_cal, 0.1)
res_hit = np.abs(y_test - mu_test) <= q_res
sca_hit = np.abs(y_test - mu_test) <= q_sca * sd_test
print(f"{'band (nominal 90%)':<26} {'all':>7} {'x<1.5':>8} {'x≥1.5':>8} {'width':>8}")
for name, hit, width in [("GP posterior ±1.645σ", gp_hit, float(np.mean(2 * Z90 * sd_test))),
                         ("conformal, residual", res_hit, w_res),
                         ("conformal, scaled by σ", sca_hit, w_sca)]:
    print(f"{name:<26} {hit.mean():7.3f} {hit[quiet].mean():8.3f} "
          f"{hit[noisy].mean():8.3f} {width:8.2f}")

# %%
# The repair the conformal lesson prescribes for a coverage gap between known
# groups: calibrate once per group, at the same rank within its own scores.
groups_cal, groups_test = x_calib < 1.5, x_test < 1.5
covered = np.zeros(len(x_test), dtype=bool)
for g in (True, False):
    _, q_g = conformal_quantile(np.abs(y_calib - mu_cal)[groups_cal == g], 0.1)
    covered[groups_test == g] = np.abs(y_test - mu_test)[groups_test == g] <= q_g
    print(f"group x{'<' if g else '≥'}1.5: n_cal = {(groups_cal == g).sum():3d}, "
          f"q̂ = {q_g:.3f}, coverage = {covered[groups_test == g].mean():.3f}")

# %% [markdown]
# Read the two tables against each other before going on. Three findings, all
# measured on data no fit touched:
#
# 1. **The GP's own band under-covers**, and the miss is not spread evenly: it
#    covers essentially everything on the quiet half and far less than nominal
#    on the noisy half. Its width was set by a fitted $\sigma_n$ that does not
#    exist in the data, and no amount of extra data would repair it — the model
#    is wrong, and the band is exactly as honest as the model.
# 2. **The conformal bands restore marginal coverage**, landing within the
#    Beta wobble of 0.90 (at $n = 300$ calibration points the standard
#    deviation of realized coverage is about 0.017). The band is not smarter
#    than the model — it is the same mean, with a width read off the model's own
#    mistakes.
# 3. **Marginal coverage is an average, and the average hides the same split.**
#    Both conformal bands over-cover the quiet half and under-cover the noisy
#    one, exactly as the conformal lesson's two-group construction predicts,
#    because a single quantile spends its miscoverage budget where it is
#    cheapest. Calibrating per group repairs it, at the cost of splitting the
#    calibration set.
#
# ## 9. The record: Mauna Loa, 1958–2003
#
# Charles David Keeling began sampling air at the Mauna Loa Observatory —
# 3,397 m up a Hawaiian volcano, in mid-Pacific air mixed over a hemisphere —
# in March 1958. The monthly means are the longest continuous instrumental
# record of the atmosphere's composition, and the file here holds them from
# March 1958 through December 2003: a rise from 315.7 ppm to about 376, an
# annual sawtooth of five to six ppm riding on it, and small year-to-year
# wanderings that are neither.
#
# Data: NOAA Global Monitoring Laboratory, *Trends in Atmospheric Carbon
# Dioxide — Mauna Loa* (`co2_mm_mlo.txt`, public domain; X. Lan, NOAA/GML, and
# R. Keeling, Scripps Institution of Oceanography). 150 of the 550 months have
# been removed from `data/co2.csv` and are the subject of the open task; the
# 400 that remain carry a fold id 0–9, assigned at random once so that everyone
# splits the record the same way. This section fits on folds 0–6 and keeps
# folds 7–9 as a held-out pool.
#
# A random month-wise split is the exchangeability hypothesis satisfied by
# construction: the held-out months are interleaved with the kept ones. Section
# 9b keeps every line of the code and changes only which months the fit is
# given.

# %%
# Infrastructure (do not modify): load, split, fit with your own tools.
_raw = np.loadtxt("data/co2.csv", delimiter=",", skiprows=1)
co2_t, co2_y, co2_fold = _raw[:, 2], _raw[:, 3], _raw[:, 4].astype(int)
T0 = 1980.0                      # time in years since 1980, so ℓ is in years
is_train, is_pool = co2_fold <= 6, co2_fold >= 7
print(f"train {is_train.sum()} months, held-out pool {is_pool.sum()} months")

plt.figure(figsize=(9, 3.2))
plt.plot(co2_t, co2_y, ".", ms=3)
plt.xlabel("year"); plt.ylabel("CO₂ (ppm)")
plt.title("Mauna Loa monthly means, 1958–2003 (400 of 550 months)")
plt.show()

co2_x = co2_t - T0
co2_mean = co2_y[is_train].mean()
CO2_SF2 = float(np.var(co2_y[is_train] - co2_mean))
CO2_ELLS = np.logspace(np.log10(0.1), np.log10(30.0), 25)
CO2_NOISE = np.logspace(np.log10(0.05), np.log10(5.0), 15) ** 2
co2_ell, co2_nv, co2_table = select_hyperparams(co2_x[is_train], co2_y[is_train] - co2_mean,
                                                CO2_ELLS, CO2_NOISE, CO2_SF2)
print(f"σf = {np.sqrt(CO2_SF2):.1f} ppm (fixed) | selected ℓ = {co2_ell:.2f} yr, "
      f"σn = {np.sqrt(co2_nv):.2f} ppm | log p(y|X) = {co2_table.max():.1f}")

# %%
# Infrastructure (do not modify): the evidence surface has two basins here, and
# which one wins depends on how many months the fit is given. Read the best
# cell of each basin off the same table, at two training sizes.
def basins(mask):
    yy = co2_y[mask] - co2_y[mask].mean()
    _, _, tab = select_hyperparams(co2_x[mask], yy, CO2_ELLS, CO2_NOISE, float(np.var(yy)))
    out = []
    for name, rows in [("wiggly (ℓ < 5 yr)", CO2_ELLS < 5.0), ("smooth (ℓ ≥ 5 yr)", CO2_ELLS >= 5.0)]:
        sub = tab[rows]
        i, j = np.unravel_index(np.argmax(sub), sub.shape)
        out.append((name, CO2_ELLS[rows][i], np.sqrt(CO2_NOISE[j]), sub[i, j]))
    return out


for mask, label in [(co2_fold <= 4, "201 months"), (is_train, f"{is_train.sum()} months")]:
    print(label)
    for name, e, s, ev in basins(mask):
        print(f"    {name:<18} ℓ = {e:5.2f} yr, σn = {s:4.2f} ppm, log p(y|X) = {ev:8.1f}")

# %% [markdown]
# The two rows of each block are two stories about the same record, both
# coherent. The *smooth* one — a lengthscale of decades and a noise standard
# deviation near 2.6 ppm — has filed the entire annual cycle under measurement
# error: the sawtooth is about 6 ppm from peak to trough, so its standard
# deviation is roughly the σn this configuration reports, and the "noise" it
# posits repeats every May. The *wiggly* one, at a lengthscale of about six
# months and σn near 0.7 ppm, treats the same cycle as signal.
#
# Which story the evidence prefers depends on how many months it is given. At
# 201 training months the smooth story wins by 18 nats and no short-lengthscale
# configuration is competitive; at 274, 73 months later, the wiggly story wins
# by 3.7 nats and the grid search returns a different model. That is the GP
# lesson's two-optima phenomenon on real data, with its stated resolution — one
# optimum outgrows the other as data accumulates — visible between two folds of
# one record. It is also a warning about the grid: a selection that flips
# between neighboring training sets is a selection whose margin you should
# print, which is why `select_hyperparams` returns the whole table.
#
# What follows uses the configuration selected on the 274-month fit.

# %%
# Infrastructure (do not modify): the GP's own band on the held-out pool, then
# the conformal bands under the R-trials protocol the conformal lesson
# prescribes — one number is not a measurement of a procedure.
co2_mu, co2_sd = gp_fit_predict(co2_x[is_train], co2_y[is_train],
                                co2_x[is_pool], co2_ell, co2_nv, CO2_SF2)
co2_res = np.abs(co2_y[is_pool] - co2_mu)
print(f"residual rms on the pool: {np.sqrt(np.mean(co2_res**2)):.2f} ppm")
print(f"GP posterior band:      coverage {np.mean(co2_res <= Z90 * co2_sd):.3f}, "
      f"mean width {np.mean(2 * Z90 * co2_sd):.2f} ppm")

_trial_rng = np.random.default_rng(2)
_n_pool = int(is_pool.sum())
_half = _n_pool // 2
_pool_y = co2_y[is_pool]
_trials = []
for _ in range(200):
    _p = _trial_rng.permutation(_n_pool)
    _c, _t = _p[:_half], _p[_half:]
    _trials.append(conformal_report(co2_mu[_c], co2_sd[_c], _pool_y[_c],
                                    co2_mu[_t], co2_sd[_t], _pool_y[_t], 0.1))
_trials = np.array(_trials)
print(f"200 random {_half}/{_n_pool - _half} calibration–test splits of the pool:")
print(f"  conformal, residual     coverage {_trials[:, 0].mean():.3f} ± "
      f"{_trials[:, 0].std():.3f}, mean width {_trials[:, 1].mean():.2f} ppm")
print(f"  conformal, scaled by σ  coverage {_trials[:, 2].mean():.3f} ± "
      f"{_trials[:, 2].std():.3f}, mean width {_trials[:, 3].mean():.2f} ppm")

# %% [markdown]
# On the exchangeable split the two constructions separate cleanly. The GP's
# own band covers about 96% of the pool against a nominal 90%: over-covering,
# because a single stationary kernel with one noise variance is only
# approximately right for this record and the evidence bought safety with
# width. The conformal bands average their nominal 90% across the 200 splits —
# that is what the theorem promises and the spread of about 0.05 is the Beta
# wobble a 63-month calibration set is entitled to — and they do it with
# intervals roughly a sixth narrower than the GP's. The scaled score is not
# distinguishable from the plain residual score here: the GP's σ(x) varies
# little when the held-out months are scattered evenly through a dense record.
#
# ### 9b. The same machinery, asked to forecast
#
# Interpolating a month between its neighbors is the easy question. The
# question the record was famous for is the other one: fit through a cutoff,
# predict forward, and grade against what the atmosphere did next. Nothing
# about the code changes — only which months go into the training set.
#
# Two models are compared. The first is the SE kernel you have been fitting.
# The second is the eleven-hyperparameter composite kernel of Rasmussen and
# Williams §5.4.3, shipped complete below at its published fitted values: a
# long SE term for the trend, a periodic term times a slow SE decay for the
# seasonal cycle, a rational quadratic for medium-term wanderings, and a short
# SE plus independent noise. Building that kernel is the Mauna Loa lesson's
# subject; here it is a drop-in argument to `gp_posterior`, which never knew
# what kernel it was given.

# %%
# Infrastructure (do not modify): the composite kernel at the book's values.
def composite_kernel(XA, XB):
    """Rasmussen & Williams §5.4.3, fitted configuration. Time in years."""
    r = XA[:, None] - XB[None, :]
    trend = 66.0**2 * np.exp(-(r**2) / (2 * 67.0**2))
    seasonal = 2.4**2 * np.exp(-(r**2) / (2 * 90.0**2)
                               - 2 * np.sin(np.pi * r) ** 2 / 1.3**2)
    medium = 0.66**2 * (1 + r**2 / (2 * 0.78 * 1.2**2)) ** (-0.78)
    short = 0.18**2 * np.exp(-(r**2) / (2 * (1.6 / 12) ** 2))
    return trend + seasonal + medium + short


COMPOSITE_NOISE = 0.19**2

f_train = co2_t < 1994
f_cal = (co2_t >= 1994) & (co2_t < 1998)
f_test = co2_t >= 1998
print(f"forecast split: {f_train.sum()} training months (to 1993), "
      f"{f_cal.sum()} calibration (1994–97), {f_test.sum()} test (1998–2003)")

f_mean = co2_y[f_train].mean()
f_yc = co2_y[f_train] - f_mean
f_sf2 = float(np.var(f_yc))
f_ell, f_nv, _ = select_hyperparams(co2_x[f_train], f_yc, CO2_ELLS, CO2_NOISE, f_sf2)
print(f"SE fit on the pre-1994 months: ℓ = {f_ell:.2f} yr, σn = {np.sqrt(f_nv):.2f} ppm")


def forecast(kernel, noise_var, mask):
    """Mean and observation sd at the months in `mask`, from the pre-1994 fit."""
    mu, var = gp_posterior(kernel(co2_x[f_train], co2_x[f_train]), f_yc,
                           kernel(co2_x[f_train], co2_x[mask]),
                           np.diag(kernel(co2_x[mask], co2_x[mask])), noise_var)
    return mu + f_mean, np.sqrt(var + noise_var)


def se_pair(XA, XB):
    return se_kernel(XA, XB, f_ell, f_sf2)


for name, kern, nv in [("SE (ℓ selected by evidence)", se_pair, f_nv),
                       ("composite (book's 11 values)", composite_kernel, COMPOSITE_NOISE)]:
    ev = log_marginal(kern(co2_x[f_train], co2_x[f_train]), f_yc, nv)
    mu_c, sd_c = forecast(kern, nv, f_cal)
    mu_t, sd_t = forecast(kern, nv, f_test)
    rms = float(np.sqrt(np.mean((co2_y[f_test] - mu_t) ** 2)))
    gp_c = float(np.mean(np.abs(co2_y[f_test] - mu_t) <= Z90 * sd_t))
    cc, wc, _, _ = conformal_report(mu_c, sd_c, co2_y[f_cal], mu_t, sd_t, co2_y[f_test], 0.1)
    print(f"{name}\n    log evidence {ev:9.1f} | forecast rms {rms:6.2f} ppm"
          f" | GP band {gp_c:.3f} @ {np.mean(2 * Z90 * sd_t):5.2f} ppm"
          f" | conformal {cc:.3f} @ {wc:5.2f} ppm")

_grid_t = np.linspace(1990.0, 2004.0, 400) - T0
_mu_p, _var_p = gp_posterior(composite_kernel(co2_x[f_train], co2_x[f_train]), f_yc,
                             composite_kernel(co2_x[f_train], _grid_t),
                             np.diag(composite_kernel(_grid_t, _grid_t)), COMPOSITE_NOISE)
_mu_s, _ = gp_posterior(se_pair(co2_x[f_train], co2_x[f_train]), f_yc,
                        se_pair(co2_x[f_train], _grid_t),
                        np.full(len(_grid_t), f_sf2), f_nv)
plt.figure(figsize=(9, 3.6))
plt.fill_between(_grid_t + T0, _mu_p + f_mean - Z90 * np.sqrt(_var_p + COMPOSITE_NOISE),
                 _mu_p + f_mean + Z90 * np.sqrt(_var_p + COMPOSITE_NOISE),
                 color="0.85", label="composite 90% band")
plt.plot(_grid_t + T0, _mu_p + f_mean, color="C1", lw=1.2, label="composite mean")
plt.plot(_grid_t + T0, _mu_s + f_mean, color="C2", lw=1.2, label="SE mean")
plt.plot(co2_t[f_test], co2_y[f_test], "k.", ms=4, label="months after the cutoff")
plt.plot(co2_t[(co2_t >= 1990) & (co2_t < 1998)], co2_y[(co2_t >= 1990) & (co2_t < 1998)],
         ".", ms=4, color="C0", label="months before it")
plt.axvline(1994.0, color="k", lw=0.8, ls=":")
plt.ylim(350, 385); plt.xlabel("year"); plt.ylabel("CO₂ (ppm)")
plt.title("forecasting past 1993: two kernels, one implementation")
plt.legend(fontsize=7, loc="upper left"); plt.show()

# %% [markdown]
# Three measured facts about the forecast, before the question that follows.
#
# The SE model's forecast is worthless: past about one lengthscale beyond the
# last observation its mean has reverted to the training average, so it
# predicts the 1998–2003 months at roughly the 1970s level, missing by 38 ppm
# with a band 44 ppm wide that covers none of them. A zero-mean stationary
# prior forgets both the trend and the cycle, exactly as the GP lesson's
# extrapolation exercise said it must.
#
# The composite kernel, running through the same six lines of `gp_posterior`,
# forecasts the same months to 1.3 ppm and covers all of them. Its log evidence
# on the training months beats the SE model's by about 480 nats — computed with
# your `log_marginal`, on training data alone, with no forecast involved: the
# evidence ranked the two kernels correctly before either was graded.
#
# The conformal band around the composite mean, calibrated on 1994–97 residuals
# and deployed on 1998–2003, covers about 29% of the test months at a nominal
# 90%.
#
# ## 10. Written answer: which band survives which split
#
# You have now measured both constructions twice on the same record, and the
# ordering reversed between the two experiments. On the exchangeable split
# (months held out at random) the conformal bands average their nominal 90%
# while the GP's own band covers about 96% at a sixth more width. On the
# forecast split the composite GP's band covers every test month while the
# conformal band, calibrated on 1994–97 and deployed on 1998–2003, covers about
# a third of them. Note which GP band that was: over the same horizon the SE
# kernel's band widened to 44 ppm and covered none of the test months, so
# "the GP band survived" is a statement about one of the two kernels.
#
# In 4–8 sentences, and in mechanisms rather than labels: say what each band's
# width is computed from, and why that quantity was right in one experiment and
# wrong in the other. For the conformal band on the forecast, say what differs
# between a calibration month and a test month there, and in which direction
# that pushes a single threshold fitted on the former. For the GP band, say
# what carried it six years past the last observation; by the paragraph above,
# "it widens away from the data" cannot be it.

# %%
distill.submit_review(
    "gp-vs-conformal",
    "The GP band is an exact probability statement conditional on the kernel: "
    "its width is computed from k(x*,x*) minus what the training inputs "
    "reveal, before any residual is observed, so it grows with distance from "
    "the data and says nothing at all if the kernel's claims are false. The "
    "conformal band assumes nothing about the model and only that the "
    "calibration and test scores are exchangeable; it reads its width off the "
    "model's measured mistakes. On the random month-wise split exchangeability "
    "holds by construction, so the conformal band lands on its nominal "
    "coverage, while the GP band is wider than it needs to be because a single "
    "fitted noise variance and a stationary kernel are only approximately "
    "right for this record. On the forecast split exchangeability is destroyed "
    "by the time ordering: the calibration months sit 0-4 years past the "
    "training edge and the test months 4-10 years past it, residuals grow with "
    "horizon, so one quantile calibrated on near months is systematically too "
    "small far out and coverage decays as the horizon lengthens. What survives "
    "the forecast is not a GP band as such but a correct kernel: the composite "
    "kernel states the trend and the annual cycle explicitly, so its mean is "
    "still right six years out and the variance it reports at that horizon is "
    "the variance of a model that is nearly true. Widening is not the "
    "mechanism -- the SE kernel widened over the same months to a 44 ppm band "
    "and covered none of them, because a stationary zero-mean prior reverts to "
    "the training average and no width around the wrong mean is honest. "
    "Neither failure is "
    "visible from inside the method that suffers it; only coverage measured on "
    "held-out data separates them.",
)

# %% [markdown]
# ## 11. Open task: screen the record for corrupted readings
#
# `data/holdout_X.csv` holds the 150 months missing from `data/co2.csv`, each
# with a **candidate reading**. Half of the candidates are the values NOAA
# published. The other half were corrupted: a shift of between 1.0 and 4.0 ppm
# was added or subtracted, drawn uniformly, independently per month, with each
# month corrupted by the flip of a fair coin. Your task is to say which is
# which — submit a 1 for a candidate you accept as genuine and a 0 for one you
# reject. The server scores accuracy against the true flags; the bar is 0.85.
#
# The natural instrument is the one you built: a prediction interval at each
# held-out month, and the rule "accept the candidate if it falls inside".
# Everything then rides on the width. Too wide and every corruption is waved
# through; too narrow and genuine readings are rejected. Accepting everything
# scores 0.51.
#
# The width is what $\alpha$ controls, and $\alpha$ is a decision here rather
# than a statistical constant: the coverage the conformal band guarantees is
# the fraction of *genuine* readings you keep, and the corruptions you catch
# are paid for out of that same budget. So do not guess it. You know the
# corruption law exactly, and you have 126 calibration months whose true values
# you also know — build the screen on them, corrupt half of them yourself under
# the published law, and measure the accuracy your rule would have had. Average
# over many corruption draws before picking, in the resampling discipline of
# module 5: one draw of 126 months is a noisy estimate of a difference of a few
# percent.
#
# Attempts are limited per day, so run the local screen before spending one.
# What is open: the split between training and calibration months, the kernel
# and its hyperparameters, the score (residual or scaled), and $\alpha$. A
# sharper mean is worth as much as a better $\alpha$ here — every ppm of
# residual is a ppm of band width — and section 9b's `composite_kernel` fits
# this record considerably more sharply than the SE kernel does.
#
# The server returns one number, and one number will not tell you which half of
# the decision went wrong. Two plotting helpers ship below, complete; call both
# before you submit. `plot_screen(alphas, accuracies)` draws the curve your
# local screen produces — where its maximum sits, how flat it is around the
# maximum (a flat top means the choice of $\alpha$ barely matters and the mean
# is what to improve), and whether the whole curve is under the bar, which is a
# verdict on the fit rather than on $\alpha$.
# `plot_candidates(hold_t, hold_cand, mu_h, q)` draws every candidate's
# departure from your predicted mean against the band that accepts it: the
# genuine readings should form a cloud inside the band, the rejects should sit
# clearly outside, and any structure in the accepted cloud — drift with year, a
# seasonal wobble, a shoulder at the band's edge — is your mean's error showing
# through, not the atmosphere's.

# %%
# Infrastructure (do not modify): the candidates you are asked to screen, and
# the two views of the decision.
holdout = np.loadtxt("data/holdout_X.csv", delimiter=",", skiprows=1)
hold_t, hold_cand = holdout[:, 2], holdout[:, 3]
print(f"{len(hold_t)} candidate readings, {hold_t.min():.1f}–{hold_t.max():.1f}")
print("your submission: one 0/1 flag per row, in file order")


def plot_screen(alphas, accuracies):
    """The local screen's own curve: accuracy each α would have delivered.

    Args:
        alphas: (P,) the α values you screened.
        accuracies: (P,) mean simulated accuracy at each, over your draws.
    """
    alphas, accuracies = np.asarray(alphas), np.asarray(accuracies)
    i = int(np.argmax(accuracies))
    plt.figure(figsize=(6.5, 3.2))
    plt.plot(alphas, accuracies, "o-", ms=4, color="C0")
    plt.plot([alphas[i]], [accuracies[i]], "r*", ms=13,
             label=f"best: α = {alphas[i]:g} at {accuracies[i]:.3f}")
    plt.axhline(0.85, color="C3", lw=1, ls="--", label="the bar (0.85)")
    plt.axhline(0.51, color="0.5", lw=1, ls=":", label="accept everything (0.51)")
    plt.xscale("log"); plt.xlabel("α (log scale)")
    plt.ylabel("simulated accuracy")
    plt.title("the local screen: what each α would have scored")
    plt.legend(fontsize=7); plt.show()


def plot_candidates(t, cand, mu, q):
    """Every candidate's departure from your mean, against the accept band.

    Args:
        t: (m,) decimal years of the candidate months.
        cand: (m,) candidate readings, ppm.
        mu: (m,) your predicted mean at those months, ppm.
        q: half-width of the accept band, ppm (a scalar, or (m,) if your
            score was scaled by σ(x)).
    """
    d = np.asarray(cand) - np.asarray(mu)
    keep = np.abs(d) <= q
    order = np.argsort(t)
    half = np.broadcast_to(np.asarray(q, dtype=float), d.shape)[order]
    plt.figure(figsize=(9, 3.2))
    plt.fill_between(np.asarray(t)[order], -half, half, color="0.85",
                     label=f"accept band, ±{half.mean():.2f} ppm")
    plt.plot(t[keep], d[keep], "o", ms=4, color="C0",
             label=f"accepted ({int(keep.sum())})")
    plt.plot(t[~keep], d[~keep], "x", ms=5, color="C3",
             label=f"rejected ({int((~keep).sum())})")
    plt.axhline(0.0, color="k", lw=0.5)
    plt.xlabel("year"); plt.ylabel("candidate − your mean (ppm)")
    plt.title("the screen, month by month")
    plt.legend(fontsize=7); plt.show()

# %%
# BEGIN SOLUTION
# Section 9's fit already trains on folds 0-6 and holds out folds 7-9; reuse it
# and score by the plain residual.
mu_h, sd_h = gp_fit_predict(co2_x[is_train], co2_y[is_train],
                            hold_t - T0, co2_ell, co2_nv, CO2_SF2)
cal_scores = co2_res

# The local screen, run the way the rule will be deployed: calibrate on one
# half of the pool, corrupt the OTHER half under the published law, and measure
# the accuracy each α would have delivered. 400 draws, because the differences
# being resolved are a few percent.
alphas = np.array([0.4, 0.3, 0.2, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.02])
screen_rng = np.random.default_rng(7)
m = int(is_pool.sum())
screen = np.zeros(len(alphas))
for _ in range(400):
    perm = screen_rng.permutation(m)
    fit_half, screen_half = perm[: m // 2], perm[m // 2:]
    genuine = screen_rng.random(len(screen_half)) < 0.5
    shift = screen_rng.choice([-1.0, 1.0], len(screen_half)) * \
        screen_rng.uniform(1.0, 4.0, len(screen_half))
    cand = co2_y[is_pool][screen_half] + np.where(genuine, 0.0, shift)
    dev = np.abs(cand - co2_mu[screen_half])
    for i, a in enumerate(alphas):
        q = conformal_quantile(cal_scores[fit_half], a)[1]
        screen[i] += np.mean((dev <= q) == genuine) / 400
for a, s in zip(alphas, screen):
    print(f"  α = {a:.2f}: simulated accuracy {s:.3f}")
plot_screen(alphas, screen)
alpha_star = float(alphas[np.argmax(screen)])
_, q_star = conformal_quantile(cal_scores, alpha_star)
print(f"picked α = {alpha_star} (half-width {q_star:.2f} ppm)")
flags = (np.abs(hold_cand - mu_h) <= q_star).astype(float)
print(f"accepting {int(flags.sum())} of {len(flags)} candidates")
plot_candidates(hold_t, hold_cand, mu_h, q_star)
# END SOLUTION

# %%
distill.submit_predictions("coverage-target", flags)

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — the pipeline</summary>
#
# Reuse section 9's fit exactly: `select_hyperparams` on the training folds
# with `CO2_ELLS` and `CO2_NOISE`, then `gp_fit_predict` at the calibration
# months and at `hold_t - T0`. The calibration scores are
# `abs(y_cal - mu_cal)`; `conformal_quantile(scores, α)` gives the half-width;
# a candidate is accepted when `abs(candidate - mu) <= q`. Everything else is
# choosing α.
# </details>
#
# <details><summary>Hint 2 — the local screen, in pseudocode</summary>
#
# ```
# repeat R times:
#     split the held-out months in two: a calibration half and a screened half
#     genuine ← random booleans over the screened half, p = 1/2
#     cand    ← y + (genuine ? 0 : ±U(1, 4))          # the published law
#     for each α:
#         q̂ ← conformal_quantile(residuals of the calibration half, α)
#         accuracy[α] += mean((|cand − mu| ≤ q̂) == genuine) / R
# α* ← argmax accuracy;  deploy q̂ recalibrated on ALL the held-out months
# ```
# The split matters: calibrating and screening on the same months measures the
# quantile against the residuals that produced it and reports a coverage no
# fresh month will see. The scores used for `q̂` are always the *uncorrupted*
# residuals — the corruption belongs to the candidates being screened. R in the
# hundreds; the curve is flat near its peak and a single draw will not resolve
# it.
# </details>
#
# <details><summary>Hint 3 — what the curve looks like</summary>
#
# With the SE fit of section 9 the simulated accuracy rises from about 0.76 at
# α = 0.4 to a maximum near α = 0.05, then falls again as the band widens
# enough to swallow the smaller corruptions. The maximum sits at half the
# conventional α = 0.1, which is the point: the conventional value is a
# statement about coverage, and this task is not scored on coverage. A
# half-width near 1.4 ppm clears the bar; the corruptions start at 1.0 ppm, so
# no band catches them all.
# </details>

# %% [markdown]
# What exists now that did not exist four hours ago: a kernel, a prior you can
# draw from, the Cholesky implementation of the predictive equations, the
# evidence that ranks hyperparameters without a validation set, a grid search
# over it, and a conformal wrapper that turns any of it into intervals whose
# coverage you measured rather than assumed. The last section put the two
# uncertainty constructions on the same record and made them disagree, which is
# module 10's thesis in the only form that settles anything: a number computed
# on data the model never saw.

# %%
distill.dump()
