# %% [markdown]
# # Lab: the stochastic calculus test bench
#
# The module proved four things about limits: the sampled quadratic
# variation of a Brownian path converges to the elapsed time while a smooth
# path's converges to zero; the left-endpoint sums of $\int W\,dW$ converge
# to $\tfrac12 W(T)^2 - \tfrac12 T$ and no other evaluation point gives that
# answer; the Itô–Doeblin formula holds along every path; and the Euler
# scheme for an SDE converges to the solution driven by the same Brownian
# motion, at strong order $\tfrac12$. Each is a statement about what a sum
# does as a mesh shrinks, and a sum over a mesh is a thing a computer does.
# This lab builds the bench that computes those sums — paths, a
# quadratic-variation meter, stochastic-integral quadratures, an
# Euler–Maruyama solver — and runs the module's theorems on it as
# measurements, with the noise reported.
#
# The bench is Higham's *An Algorithmic Introduction to Numerical Simulation
# of Stochastic Differential Equations* (SIAM Review, 2001) rebuilt in NumPy:
# `bpath`, `stint`, `em`, `emstrong` and `chain` are here, in order. Three
# departures from that source, stated once. Higham works one MATLAB listing
# at a time; the bench is vectorized over paths and every study reports a
# distribution across hundreds or thousands of seeded paths, not one run.
# Higham has no quadratic-variation section; here it leads, because it is
# the module's spine and because the integral and the solver studies are
# both quadratic-variation statements in disguise. Milstein's scheme, weak
# convergence and linear stability (Higham's §§6–7) are left out: the
# course never needs an order above $\tfrac12$, and stability belongs to a
# numerics course. Nothing here hedges anything — the process and the
# calculus are this lab's; the hedge built on them is the next module's lab.
#
# Ground rules:
#
# - **A path is an array on a uniform grid.** A path on $[0, T]$ with $n$
#   steps is an array of $n + 1$ values at $t_k = kT/n$, starting at the
#   path's value at $0$. Every function takes and returns paths in this
#   form; a batch of $M$ paths is an $(M, n + 1)$ array.
# - **One fine path, many meshes.** A study never draws new randomness for a
#   coarser mesh. It draws the finest increments once and coarsens them —
#   reads every `stride`-th grid point, or sums increments in blocks — so the
#   only thing that changes between rows of a table is the mesh.
# - **No library integrators.** Every line below is your numpy. Checking a
#   number against a library on your own machine is fine; the graded work is
#   yours.
# - Each checkpoint cell submits your function's outputs to the course
#   server, which compares them against a reference. Run them as you go.
#   The seven exact checkpoints are the required set; the written answer
#   and the open task at the end are optional, and partial completion is a
#   normal way to finish a lab.

# %%
import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("quant/quadratic-variation-lab")

# %% [markdown]
# ## 0. Grids, increments and the helpers that ship complete
#
# Nothing in this cell is a task. `grid` is the time axis of a path;
# `brownian_increments` draws $\sqrt{\Delta t}\,Z$ increments, one row per
# path, from a generator you pass in — every study seeds its own generator,
# so a rerun reproduces its numbers to the last digit; `fit_slope` is the
# least-squares slope on log–log axes that the two convergence studies
# report; the rest draws.

# %%
def grid(n, T):
    """The n + 1 grid points 0 = t_0 < t_1 < ... < t_n = T, spacing T / n."""
    return np.linspace(0.0, T, n + 1)


def brownian_increments(n, T, rng, paths=None):
    """Increments of Brownian motion on the grid of n steps over [0, T].

    Args:
        n: number of steps.
        T: horizon.
        rng: numpy Generator.
        paths: None for one path, else the number of paths.
    Returns:
        (n,) array — or (paths, n) — of independent N(0, T/n) draws.
    """
    shape = (n,) if paths is None else (paths, n)
    return np.sqrt(T / n) * rng.standard_normal(shape)


def fit_slope(x, y):
    """Least-squares slope of log y against log x."""
    return float(np.polyfit(np.log(x), np.log(y), 1)[0])


# ---- drawing: nothing below is graded ----------------------------------------

def plot_paths(t, paths, title="", labels=None, ax=None):
    """One or several paths against the grid."""
    ax = ax or plt.gca()
    paths = np.atleast_2d(paths)
    for k, p in enumerate(paths):
        ax.plot(t, p, lw=0.9, label=None if labels is None else labels[k])
    ax.set_xlabel("t")
    ax.set_title(title, fontsize=9)
    if labels is not None:
        ax.legend(fontsize=8)
    return ax


def show_qv_table(cells, table, names, limits):
    """The sampled quadratic variation of several processes across meshes, with each limit."""
    head = "cells".rjust(8) + "".join(f"{c:>12d}" for c in cells) + "       limit"
    print(head)
    for name, row, lim in zip(names, table, limits):
        print(f"{name:>8s}" + "".join(f"{v:12.5f}" for v in row) + f"{lim:12.5f}")


def plot_qv_vs_mesh(cells, table, names, limits):
    """Sampled quadratic variation against the number of cells, one line per process, limits dashed."""
    fig, ax = plt.subplots(figsize=(7, 3.5))
    for name, row, lim in zip(names, table, limits):
        line, = ax.plot(cells, row, "o-", ms=4, lw=1, label=name)
        ax.axhline(lim, color=line.get_color(), lw=0.8, ls="--")
    ax.set_xscale("log")
    ax.set_xlabel("number of cells")
    ax.set_ylabel("sampled quadratic variation")
    ax.legend(fontsize=8)
    fig.tight_layout()


def plot_sums(cells, sums, limits, title=""):
    """Riemann–Itô sums against the number of cells for several evaluation points, limits dashed.

    sums and limits are dicts keyed by the evaluation point.
    """
    fig, ax = plt.subplots(figsize=(7, 3.5))
    for point, values in sums.items():
        line, = ax.plot(cells, values, "o-", ms=4, lw=1, label=point)
        ax.axhline(limits[point], color=line.get_color(), lw=0.8, ls="--")
    ax.set_xscale("log")
    ax.set_xlabel("number of cells")
    ax.set_ylabel("sum")
    ax.set_title(title, fontsize=9)
    ax.legend(fontsize=8)
    fig.tight_layout()


def plot_loglog(dts, errors, label, reference_order=0.5, ax=None):
    """Error against the step size on log–log axes, with the fitted slope and a reference slope."""
    ax = ax or plt.figure(figsize=(5, 3.5)).gca()
    slope = fit_slope(dts, errors)
    ax.loglog(dts, errors, "o-", ms=4, lw=1, label=f"{label} (fitted slope {slope:.3f})")
    ref = errors[-1] * (np.asarray(dts) / dts[-1]) ** reference_order
    ax.loglog(dts, ref, "--", lw=0.8, color="0.5", label=f"reference slope {reference_order}")
    ax.set_xlabel("Δt")
    ax.set_ylabel("error")
    ax.legend(fontsize=8)
    return ax


def plot_sigma_estimates(counts, estimates, truth=None, title="", ax=None):
    """Volatility estimates, in percent, against each path's observation count m.

    The theorem's spread of the meter is sqrt(2/m) relative on sigma^2, which is
    sigma / sqrt(2m) on sigma. With `truth` (the simulated sigma, percent) that
    band is drawn around the truth and the estimates fall inside it or do not;
    without a truth each estimate wears the same band as its own error bar —
    the precision the theorem grants it, centred on the only level available.
    """
    ax = ax or plt.figure(figsize=(6, 3.5)).gca()
    counts, estimates = np.asarray(counts, dtype=float), np.asarray(estimates, dtype=float)
    if truth is None:
        ax.errorbar(counts, estimates, yerr=estimates / np.sqrt(2 * counts),
                    fmt="o", ms=3, lw=0.6, alpha=0.7, label="σ̂ ± σ̂/√(2m)")
    else:
        m = np.linspace(counts.min(), counts.max(), 200)
        ax.fill_between(m, truth - truth / np.sqrt(2 * m), truth + truth / np.sqrt(2 * m),
                        color="0.85", label="σ ± σ/√(2m)")
        ax.axhline(truth, color="0.4", lw=0.8, ls="--", label="σ")
        ax.plot(counts, estimates, "o", ms=3, alpha=0.7, label="σ̂")
    ax.set_xlabel("observations m")
    ax.set_ylabel("σ̂ (percent)")
    ax.set_title(title, fontsize=9)
    ax.legend(fontsize=8)
    return ax

# %% [markdown]
# ## 1. The scaled random walk
#
# The module's first object was the scaled symmetric random walk: $n$ coin
# tosses per unit of time, each moving the walk by $\pm 1/\sqrt n$, so that
# the variance over any interval is the interval's length at every $n$. On a
# grid of $n$ steps over $[0, T]$ the step is $\pm\sqrt{\Delta t}$ with
# $\Delta t = T/n$ — a head moves the walk up, a tail down — and the walk is
# the running sum of the steps, starting at $0$.
#
# Build it from a toss sequence. The output has $n + 1$ entries, the first
# of them $0$.

# %%
def scaled_walk(tosses, T):
    """The scaled symmetric random walk on [0, T] built from a toss sequence.

    Args:
        tosses: (n,) array of 0/1; 1 is a head (a step up), 0 a tail (a step down).
        T: horizon.
    Returns:
        (n + 1,) array W with W[0] = 0 and W[k] the walk after k tosses:
        each toss moves it by +sqrt(T/n) on a head and -sqrt(T/n) on a tail.
    """
    # BEGIN SOLUTION
    tosses = np.asarray(tosses)
    steps = np.sqrt(T / tosses.size) * np.where(tosses == 1, 1.0, -1.0)
    return np.concatenate([[0.0], np.cumsum(steps)])
    # END SOLUTION

# %%
# The module's numbers: at n steps per unit time, every step is 1/sqrt(n)
# in size, the variance of the increment over [s, t] is t − s, and the
# walk's own quadratic variation up to time t is exactly t, at every n.
_rng = np.random.default_rng(1)
_tosses = _rng.integers(0, 2, size=1024)
_W = scaled_walk(_tosses, 1.0)
assert _W.shape == (1025,) and _W[0] == 0.0
assert np.allclose(np.abs(np.diff(_W)), 1 / 32)                 # every step is ±1/sqrt(1024)
assert np.isclose(np.sum(np.diff(_W) ** 2), 1.0)                # [W, W](1) = 1 exactly
assert np.isclose(np.sum(np.diff(_W)[:256] ** 2), 0.25)         # and [W, W](1/4) = 1/4
_many = np.array([scaled_walk(_rng.integers(0, 2, size=256), 2.0)[-1] for _ in range(4000)])
assert abs(_many.mean()) < 0.1 and abs(_many.var() - 2.0) < 0.15   # Var W(2) = 2

# Higham's bpath, four times over on one coin: the same 1024 tosses read at
# every 64th, 16th, 4th and 1st step. The jaggedness does not smooth out.
fig, axes = plt.subplots(1, 4, figsize=(11, 2.6), sharey=True)
for ax, n in zip(axes, (16, 64, 256, 1024)):
    plot_paths(grid(n, 1.0), _W[:: 1024 // n], f"{n} cells", ax=ax)
fig.tight_layout()
plt.show()

# %%
distill.check("scaled-walk", scaled_walk)

# %% [markdown]
# The rest of the bench uses the Gaussian sibling: increments
# $\sqrt{\Delta t}\,Z$ from `brownian_increments`, turned into a path by the
# same running sum you just wrote. `cumpath` does that for a batch of
# increment rows at once and ships complete.

# %%
def cumpath(dW):
    """Path(s) from increment(s): a leading zero, then the running sum along the last axis.

    Args:
        dW: (n,) or (M, n) increments.
    Returns:
        (n + 1,) or (M, n + 1) path(s) starting at 0.
    """
    dW = np.asarray(dW, dtype=float)
    zero = np.zeros(dW.shape[:-1] + (1,))
    return np.concatenate([zero, np.cumsum(dW, axis=-1)], axis=-1)

# %% [markdown]
# ## 2. The quadratic-variation meter
#
# The sampled quadratic variation of a path over a partition is the sum of
# its squared increments over the partition's cells,
#
# $$Q_\Pi = \sum_{j=0}^{m-1} \bigl(X(t_{j+1}) - X(t_j)\bigr)^2 .$$
#
# The meter reads a path on its fine grid of $n$ steps at a coarser mesh: a
# `stride` of $s$ means the partition whose cells are $s$ fine steps long,
# so there are $m = n/s$ cells and the path is read every $s$-th point,
# from its first to its last. It works on any discretely observed path — a
# smooth function sampled on the grid, a random walk, a log price — because
# the definition does not know what produced the values. Write it for a
# batch too: on an $(M, n + 1)$ array it returns one number per row.

# %%
def sampled_qv(path, stride=1):
    """Sampled quadratic variation of a path at a given stride.

    Args:
        path: (n + 1,) path on a uniform grid, or (M, n + 1) batch of paths.
        stride: cell length in fine steps; divides n.
    Returns:
        float — or (M,) array — sum of squared increments over the n / stride cells
        of the partition that reads every stride-th grid point.
    """
    # BEGIN SOLUTION
    coarse = np.asarray(path, dtype=float)[..., ::stride]
    return np.sum(np.diff(coarse, axis=-1) ** 2, axis=-1)
    # END SOLUTION

# %%
# The module's two theorems, at one path each. The walk's own mesh gives T
# exactly; a smooth function's sum falls with the mesh — by about the
# refinement factor — and a Brownian path's stays near T with spread
# sqrt(2/m) around it.
_rng = np.random.default_rng(2)
_t = grid(4096, 2.0)
assert np.isclose(sampled_qv(scaled_walk(_rng.integers(0, 2, size=4096), 2.0)), 2.0)
_smooth = [sampled_qv(np.sin(_t), s) for s in (512, 64, 8, 1)]
assert _smooth[0] > 8 * _smooth[1] * 0.8 and _smooth[-1] < 1e-3, "a smooth path's quadratic variation dies with the mesh"
_bm = cumpath(brownian_increments(4096, 2.0, _rng, paths=500))
_Q = sampled_qv(_bm, 16)                                         # 256 cells, 500 paths
assert _Q.shape == (500,)
assert abs(_Q.mean() - 2.0) < 0.03 and abs(_Q.std() / 2.0 - np.sqrt(2 / 256)) < 0.02
print("smooth path, cells 8 → 64 → 512 → 4096:", np.round(_smooth, 5))
print(f"Brownian paths at 256 cells: mean {_Q.mean():.4f}, sd/T {_Q.std() / 2:.4f} (theory {np.sqrt(2 / 256):.4f})")

# %%
# The check reads two single paths at every stride, then a batch of paths at
# every stride — one array per stride, one number per row of the batch.
def _qv_check(smooth, W, batch, strides):
    table = np.array([[sampled_qv(p, s) for s in strides] for p in (smooth, W)])
    return (table, *(sampled_qv(batch, s) for s in strides))


distill.check("sampled-qv", _qv_check)

# %% [markdown]
# ## 3. The quadratic-variation study
#
# The first composition: four processes on one set of Brownian increments,
# read at every mesh from the fine grid up. The processes are the module's
# four cases, and the limit of each is a theorem:
#
# - $W$ itself: $[W, W](T) = T$.
# - a smooth path, $f(t) = \sin t$: quadratic variation $0$.
# - $W(t) + ct$, drift added: still $T$. The cross terms $2c\,\Delta t\,\Delta W$
#   sum to $2c\,\Delta t\,W(T)$ and the $c^2\Delta t^2$ terms to $c^2\Delta t\,T$;
#   both vanish with the mesh, and the drift is invisible to the meter.
# - $\log S$ for geometric Brownian motion, $S = S_0 \exp\{(\mu - \tfrac12\sigma^2)t + \sigma W\}$:
#   $[\log S, \log S](T) = \sigma^2 T$ — the realized-variance identity, the
#   fact the last task of this lab and all of module 8 rest on.
#
# Build the four paths from the given increments — the same $W$ in three of
# them, so the study's rows differ only in what was done to the path — and
# return the table of sampled quadratic variations, one row per process, one
# column per stride, in the order listed.

# %%
def qv_table(dW, T, c, S0, mu, sigma, strides):
    """Sampled quadratic variation of four processes built on one Brownian path, across meshes.

    Args:
        dW: (n,) Brownian increments on the grid of n steps over [0, T].
        T: horizon.
        c: drift rate of the third process, W(t) + c t.
        S0, mu, sigma: initial price, drift and volatility of the geometric Brownian motion.
        strides: sequence of k cell lengths, each dividing n.
    Returns:
        (4, k) array: rows are W, sin(t), W + c t, log S (in that order),
        column j the sampled quadratic variation at strides[j].
    """
    # BEGIN SOLUTION
    dW = np.asarray(dW, dtype=float)
    t = grid(dW.size, T)
    W = cumpath(dW)
    processes = [W, np.sin(t), W + c * t, np.log(S0) + (mu - 0.5 * sigma**2) * t + sigma * W]
    return np.array([[sampled_qv(p, s) for s in strides] for p in processes])
    # END SOLUTION

# %%
# The table at 2^14 fine steps, read at 4, 16, ..., 16384 cells. Every row
# is one path: the two Brownian rows agree to the cross terms, the smooth
# row falls by about four per column, and the log-price row sits at
# sigma^2 T times the first row's ratio to T.
_rng = np.random.default_rng(3)
_T, _sigma = 1.0, 0.4
_dW = brownian_increments(2**14, _T, _rng)
_strides = [4096, 1024, 256, 64, 16, 4, 1]
_table = qv_table(_dW, _T, 1.5, 100.0, 0.08, _sigma, _strides)
_names, _limits = ["W", "sin t", "W + ct", "log S"], [_T, 0.0, _T, _sigma**2 * _T]
show_qv_table([2**14 // s for s in _strides], _table, _names, _limits)
assert _table.shape == (4, 7)
assert abs(_table[0, -1] - _T) < 0.03 and abs(_table[2, -1] - _T) < 0.03
assert _table[1, -1] < 1e-3 and _table[1, 0] > 0.1
assert abs(_table[3, -1] / (_sigma**2 * _T) - _table[0, -1] / _T) < 1e-3   # log S's row is sigma^2 times W's
plot_qv_vs_mesh([2**14 // s for s in _strides], _table, _names, _limits)
plt.show()

# %% [markdown]
# The drift row and the $W$ row are the point to read twice. At the finest
# mesh they differ by $2c\,\Delta t\,W(T) + c^2\Delta t\,T$, a number of
# order $\Delta t$, and nothing else: a trend of $1.5$ per unit time — larger
# than the volatility — leaves no trace in the meter. That is the arithmetic
# behind the module's claim that quadratic variation is the one property of a
# price path a drift cannot change, and the reason the estimator of the last
# task needs no opinion about $\mu$.

# %%
distill.check("qv-study", qv_table)

# %% [markdown]
# ## 4. One path, three integrals
#
# Higham's `stint`: the integral $\int_0^T W\,dW$ approximated by a sum over
# a partition, with the integrand read at a chosen point of each cell and
# multiplied by the cell's Brownian increment. The module's construction
# reads the integrand at the left endpoint; the sum with the midpoint is the
# Stratonovich integral; the right endpoint is the third choice, with no
# name because nothing uses it. On the bench, a cell of `stride` $= s$ fine
# steps has its left endpoint at fine index $js$, its midpoint at
# $js + s/2$ ($s$ even) and its right endpoint at $(j + 1)s$; the increment
# is $W((j+1)s) - W(js)$ whatever the evaluation point.
#
# Write the quadrature for a general integrand given as a path on the same
# fine grid — a process, not a formula — so that the same function later
# integrates $W^2$, or $f_x(t, W(t))$, against $dW$. The integrand is read at
# the chosen point; the integrator's increment is always the whole cell's.

# %%
def ito_sum(integrand, W, stride, point="left"):
    """Riemann–Itô sum of an integrand against W over cells of a given stride.

    Args:
        integrand: (n + 1,) values of the integrand process on the fine grid.
        W: (n + 1,) Brownian path on the same grid.
        stride: cell length in fine steps; divides n, even if point is "mid".
        point: "left", "mid" or "right" — where in each cell the integrand is read:
            fine index j*stride, j*stride + stride/2, or (j + 1)*stride for cell j.
    Returns:
        float: sum over cells of integrand[point of cell] * (W[end of cell] - W[start of cell]).
    """
    # BEGIN SOLUTION
    integrand, W = np.asarray(integrand, dtype=float), np.asarray(W, dtype=float)
    n = W.size - 1
    offset = {"left": 0, "mid": stride // 2, "right": stride}[point]
    reads = np.arange(0, n, stride) + offset
    return float(np.sum(integrand[reads] * np.diff(W[::stride])))
    # END SOLUTION

# %%
# Two identities hold on every partition, before any limit: the right sum
# minus the left sum is the sampled quadratic variation of the same cells,
# and the average of the two is exactly W(T)^2 / 2. The midpoint sum is
# neither; it sits between them.
_rng = np.random.default_rng(4)
_T = 1.0
_W = cumpath(brownian_increments(2**12, _T, _rng))
_cells, _sums = [], {"left": [], "mid": [], "right": []}
for _s in (2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2):
    _cells.append(2**12 // _s)
    for _p in _sums:
        _sums[_p].append(ito_sum(_W, _W, _s, _p))
    assert np.isclose(_sums["right"][-1] - _sums["left"][-1], sampled_qv(_W, _s))
    assert np.isclose((_sums["right"][-1] + _sums["left"][-1]) / 2, _W[-1] ** 2 / 2)
_exact = {"left": (_W[-1] ** 2 - _T) / 2, "mid": _W[-1] ** 2 / 2, "right": (_W[-1] ** 2 + _T) / 2}
for _p in _sums:
    assert abs(_sums[_p][-1] - _exact[_p]) < 0.05, f"{_p} sum is not near its limit at 2048 cells"
print("W(T) =", round(float(_W[-1]), 4))
for _p in _sums:
    print(f"{_p:>5s}: at 2048 cells {_sums[_p][-1]:+.4f}, limit {_exact[_p]:+.4f}")
plot_sums(_cells, _sums, _exact, "∫ W dW on one path: three evaluation points")
plt.show()

# %% [markdown]
# The plot is the integral lesson's figure, from your own numbers. The three
# series converge to three different values on the same path, and the gaps
# between them are the sampled quadratic variation of the cells — the left
# and right sums differ by $Q_\Pi \to T$, the midpoint sits $Q_\Pi/2$ above
# the left. The $-\tfrac12 T$ of the module's headline formula is not a
# property of Brownian motion alone; it is a property of Brownian motion
# *and* the left endpoint, and the arithmetic above is where it comes from.

# %%
def _stint_check(dW, stride):
    W = cumpath(dW)
    return np.array(
        [ito_sum(W, W, stride, p) for p in ("left", "mid", "right")]
        + [ito_sum(W**2, W, stride, p) for p in ("left", "mid", "right")]
    )


distill.check("ito-vs-stratonovich", _stint_check)

# %% [markdown]
# ## 5. The Itô–Doeblin formula as a convergence claim
#
# Higham's `chain.m` confirms the stochastic chain rule on one path at one
# mesh and reports a discrepancy of $0.0151$. The bench does better: the
# formula
#
# $$f(T, W(T)) - f(0, 0) = \int_0^T f_t\,dt + \int_0^T f_x\,dW + \tfrac12\int_0^T f_{xx}\,dt$$
#
# is a statement about three sums, and the discrepancy between the left side
# and the sums is a random variable whose size should fall with the mesh at
# a rate. Write the right-hand side: given the three partial derivatives as
# functions of $(t, x)$, the time grid and the path, return the three sums
# separately — $\sum f_t\,\Delta t$, $\sum f_x\,\Delta W$ and
# $\tfrac12\sum f_{xx}\,\Delta t$ — over cells of the given stride, every
# partial derivative read at the cell's left endpoint. Two of the three are
# ordinary Riemann sums; the middle one is section 4's left sum with the
# integrand $f_x(t, W(t))$. Make it work on a batch of paths, one column of
# three per row, so the convergence study can average over hundreds.

# %%
def ito_rhs(f_t, f_x, f_xx, t, W, stride=1):
    """The three sums on the right of the Itô–Doeblin formula, left-endpoint evaluated.

    Args:
        f_t, f_x, f_xx: partial derivatives of f(t, x), vectorized over arrays (t, x).
        t: (n + 1,) time grid.
        W: (n + 1,) path, or (M, n + 1) batch.
        stride: cell length in fine steps; divides n.
    Returns:
        (3,) array — or (3, M) — of [sum f_t Δt, sum f_x ΔW, ½ sum f_xx Δt] over
        the cells, each partial evaluated at the cell's left endpoint (t_j, W(t_j)).
    """
    # BEGIN SOLUTION
    tc, Wc = np.asarray(t, dtype=float)[::stride], np.asarray(W, dtype=float)[..., ::stride]
    dt, dW = np.diff(tc), np.diff(Wc, axis=-1)
    tl, Wl = tc[:-1], Wc[..., :-1]
    return np.array([
        np.sum(f_t(tl, Wl) * dt, axis=-1),
        np.sum(f_x(tl, Wl) * dW, axis=-1),
        0.5 * np.sum(f_xx(tl, Wl) * dt, axis=-1),
    ])
    # END SOLUTION

# %%
# Two functions. The exponential martingale exp(x − t/2) has f_t + ½ f_xx = 0
# identically, so its dt sums cancel to the last digit on every mesh and the
# whole discrepancy is the Itô sum's. t x² has a genuine f_t = x² that does
# not cancel against ½ f_xx = t. In both, the RMS discrepancy over 400 paths
# falls like the square root of the step — the same order the solver study
# measures next, and for the same reason: a left-endpoint sum against dW is
# off by an increment's worth of the integrand's motion within each cell.
_rng = np.random.default_rng(5)
_T, _n, _M = 1.0, 2**12, 400
_t = grid(_n, _T)
_W = cumpath(brownian_increments(_n, _T, _rng, paths=_M))
_cases = {
    "exp(x − t/2)": (lambda t, x: np.exp(x - t / 2), lambda t, x: -0.5 * np.exp(x - t / 2),
                     lambda t, x: np.exp(x - t / 2), lambda t, x: np.exp(x - t / 2)),
    "t x²": (lambda t, x: t * x**2, lambda t, x: x**2, lambda t, x: 2 * t * x, lambda t, x: 2 * t + 0 * x),
}
_strides = [256, 64, 16, 4, 1]
_dts = [_T / _n * s for s in _strides]
fig, axes = plt.subplots(1, 2, figsize=(10, 3.5))
for ax, (name, (f, f_t, f_x, f_xx)) in zip(axes, _cases.items()):
    lhs = f(_T, _W[:, -1]) - f(0.0, 0.0)
    rms = []
    for s in _strides:
        terms = ito_rhs(f_t, f_x, f_xx, _t, _W, s)
        assert terms.shape == (3, _M)
        rms.append(np.sqrt(np.mean((lhs - terms.sum(axis=0)) ** 2)))
    if name.startswith("exp"):
        assert np.allclose(terms[0] + terms[2], 0.0, atol=1e-12), "f_t and ½ f_xx must cancel for the exponential martingale"
    slope = fit_slope(_dts, rms)
    assert 0.35 < slope < 0.65, f"discrepancy falls at order {slope:.2f}, expected about 1/2"
    print(f"{name:>12s}: RMS discrepancy {rms[0]:.4f} at {_strides[0]} steps/cell → {rms[-1]:.4f} at 1, slope {slope:.3f}")
    plot_loglog(_dts, rms, name, ax=ax)
    ax.set_ylabel("RMS |f(T, W(T)) − f(0, 0) − sums|")
fig.tight_layout()
plt.show()

# %% [markdown]
# If the shape assertion or the slope fails, open the hints in order.
#
# <details><summary>Hint 1 — the two axes</summary>
#
# Two axes, two jobs. The stride reads the grid, which is the last axis of a
# single path and of a batch alike — `W[..., ::stride]`, never `W[::stride]`,
# which on an $(M, n + 1)$ array keeps every stride-th path and leaves each
# on the fine grid. The sums run over the cells, also the last axis:
# `np.sum(..., axis=-1)` returns one number on a path and $M$ on a batch,
# and stacking the three gives $(3,)$ or $(3, M)$ with no branch on the
# input's shape. The time grid is one-dimensional either way; numpy
# broadcasts $\Delta t$ across the paths on its own.
#
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# tc <- t read at the stride;  Wc <- W read at the stride along its last axis
# dt <- diff(tc);              dW <- diff(Wc) along the last axis
# tl, Wl <- tc and Wc without their last entry: the cells' left endpoints
# return [sum(f_t(tl, Wl) * dt),  sum(f_x(tl, Wl) * dW),  0.5 * sum(f_xx(tl, Wl) * dt)]
#        each sum over the last axis
# ```
#
# </details>


# %%
# One path, then a batch of paths: the three sums of the first, then the
# (3, M) array of the second.
def _ito_check(f_t, f_x, f_xx, t, W, batch, stride):
    return ito_rhs(f_t, f_x, f_xx, t, W, stride), ito_rhs(f_t, f_x, f_xx, t, batch, stride)


distill.check("ito-formula-check", _ito_check)

# %% [markdown]
# ## 6. The Euler–Maruyama solver
#
# An SDE $dX = a(X)\,dt + b(X)\,dW$ has, in general, no closed form. Its
# discrete cousin does: freeze the coefficients at the start of each cell,
# read the cell's Brownian increment, and step,
#
# $$X_{j+1} = X_j + a(X_j)\,\Delta t + b(X_j)\,\Delta W_j .$$
#
# That is the Euler–Maruyama scheme — the scaled walk's construction applied
# to a process whose steps depend on where it is — and the increment it
# consumes is the cell's $\Delta W_j$, already of size $\sqrt{\Delta t}$;
# nothing scales it again. Write the solver for a batch of increment rows, a
# loop over time and vectorized over paths, with the coefficients given as
# functions of the state. The checkpoint runs it on geometric Brownian
# motion, $a(x) = \mu x$, $b(x) = \sigma x$, and compares it with the
# reference the module solved in closed form,
# $S(t) = S_0\exp\{(\mu - \tfrac12\sigma^2)t + \sigma W(t)\}$, driven by the
# same increments. The scheme is required to run on the price SDE itself:
# Euler applied to $\log S$ is exact, since that SDE has constant
# coefficients, and section 7's study would then measure nothing.

# %%
def em_solve(drift, diffusion, x0, dW, dt):
    """Euler–Maruyama on dX = drift(X) dt + diffusion(X) dW.

    Args:
        drift, diffusion: functions of the state, vectorized over arrays.
        x0: initial value (scalar).
        dW: (L,) increments of the driving Brownian motion on cells of length dt,
            or (M, L) for a batch of paths.
        dt: the cell length the increments live on.
    Returns:
        (L + 1,) array — or (M, L + 1) — with X[..., 0] = x0 and
        X[..., j + 1] = X[..., j] + drift(X[..., j]) dt + diffusion(X[..., j]) dW[..., j].
    """
    # BEGIN SOLUTION
    dW = np.asarray(dW, dtype=float)
    X = np.empty(dW.shape[:-1] + (dW.shape[-1] + 1,))
    X[..., 0] = x0
    for j in range(dW.shape[-1]):
        x = X[..., j]
        X[..., j + 1] = x + drift(x) * dt + diffusion(x) * dW[..., j]
    return X
    # END SOLUTION


def gbm_exact(S0, mu, sigma, t, W):
    """The closed-form geometric Brownian motion S0 exp((mu − sigma²/2) t + sigma W) on a path."""
    return S0 * np.exp((mu - 0.5 * sigma**2) * t + sigma * W)

# %%
# Higham's em.m: lambda = 2, mu = 1, X0 = 1 on [0, 1], the Brownian path at
# 2^8 steps and the scheme at four times that step, drawn over the exact
# solution on the same path.
_rng = np.random.default_rng(6)
_n, _T = 2**8, 1.0
_dW = brownian_increments(_n, _T, _rng)
_exact = gbm_exact(1.0, 2.0, 1.0, grid(_n, _T), cumpath(_dW))
_em = em_solve(lambda x: 2.0 * x, lambda x: 1.0 * x, 1.0, _dW.reshape(-1, 4).sum(axis=1), 4 * _T / _n)
assert _em.shape == (_n // 4 + 1,) and _em[0] == 1.0
assert abs(_em[-1] - _exact[-1]) < 0.5 * _exact[-1], "the scheme is nowhere near the solution it discretizes"
# The scheme on a batch is the scheme on each row.
_batch = brownian_increments(64, _T, _rng, paths=3)
_rows = em_solve(lambda x: 0.1 * x, lambda x: 0.3 * x, 50.0, _batch, _T / 64)
assert _rows.shape == (3, 65)
assert np.allclose(_rows[1], em_solve(lambda x: 0.1 * x, lambda x: 0.3 * x, 50.0, _batch[1], _T / 64))
fig, ax = plt.subplots(figsize=(6, 3.2))
plot_paths(grid(_n, _T), _exact, "em.m: Euler–Maruyama at Δt = 4δt over the exact path", ["exact solution"], ax)
ax.plot(grid(_n // 4, _T), _em, "r--*", ms=4, lw=0.8, label="Euler–Maruyama")
ax.legend(fontsize=8)
plt.show()

# %% [markdown]
# Higham's `chain.m`, on the same solver. For $dX = (\alpha - X)\,dt +
# \beta\sqrt{X}\,dW$ the Itô–Doeblin formula gives $V = \sqrt X$ its own SDE,
# $dV = \bigl(\tfrac{4\alpha - \beta^2}{8V} - \tfrac{V}{2}\bigr)dt + \tfrac{\beta}{2}\,dW$.
# Solve both with Euler–Maruyama on one set of increments and compare
# $\sqrt{X}$ with $V$: the maximum discrepancy is Higham's $0.0151$-style
# number at his mesh of $1/200$, and section 5's claim says it falls as the
# mesh refines. The cell is complete; it runs your solver.

# %%
_alpha, _beta = 2.0, 1.0
_rng = np.random.default_rng(7)
_fine = brownian_increments(200 * 64, 1.0, _rng)
for _N in (200, 800, 3200, 12800):
    _dt = 1.0 / _N
    _dWc = _fine.reshape(_N, -1).sum(axis=1)
    _X = em_solve(lambda x: _alpha - x, lambda x: _beta * np.sqrt(np.abs(x)), 1.0, _dWc, _dt)
    _V = em_solve(lambda v: (4 * _alpha - _beta**2) / (8 * v) - v / 2, lambda v: _beta / 2 + 0 * v, 1.0, _dWc, _dt)
    print(f"chain.m at δt = 1/{_N:<6d} max |sqrt(X) − V| = {np.max(np.abs(np.sqrt(np.abs(_X)) - _V)):.4f}")

# %%
distill.check(
    "euler-maruyama",
    lambda mu, sigma, x0, dW, dt: em_solve(lambda x: mu * x, lambda x: sigma * x, x0, dW, dt),
)

# %% [markdown]
# ## 7. Strong convergence, measured
#
# Higham's `emstrong`, the article's headline experiment. The strong error
# of a scheme at step $\Delta t$ is $E\,|X_{\Delta t}(T) - X(T)|$, the expected
# distance at the endpoint between the scheme and the exact solution *driven
# by the same Brownian path*, and the theorem says it is $O(\Delta t^{1/2})$
# for Euler–Maruyama. The measurement has one discipline that is the whole
# point: draw the finest increments once, $\delta t = T/N$, and for each
# coarser step $\Delta t = R\,\delta t$ feed the scheme the block sums of the
# same increments — $R$ fine increments summed make one coarse one, so every
# resolution sees the same path and the exact endpoint
# $S_0\exp\{(\mu - \tfrac12\sigma^2)T + \sigma W(T)\}$ is one number per
# path. Scheme and reference then differ only by the discretization, and the
# average over paths of that difference is the error.
#
# Write the study: given the fine increments of $M$ paths and the list of
# block sizes, return the mean endpoint error at each. The slope of its
# log–log plot against $\Delta t$ is the measured strong order; Higham gets
# $0.5384$ with a thousand paths.

# %%
def strong_errors(mu, sigma, x0, dW, dt, Rs):
    """Mean endpoint error of Euler–Maruyama on geometric Brownian motion at several step sizes.

    Args:
        mu, sigma, x0: the GBM dX = mu X dt + sigma X dW and its initial value.
        dW: (M, N) fine Brownian increments, cell length dt.
        dt: the fine step.
        Rs: sequence of block sizes; the scheme runs at step R dt on the block
            sums of dW, each R dividing N.
    Returns:
        (len(Rs),) array: for each R, the mean over the M paths of
        |X_em(T) − S(T)|, with S(T) the exact solution on the same path.
    """
    # BEGIN SOLUTION
    dW = np.asarray(dW, dtype=float)
    M, N = dW.shape
    T = N * dt
    exact = gbm_exact(x0, mu, sigma, T, dW.sum(axis=1))
    errors = []
    for R in Rs:
        coarse = dW.reshape(M, N // R, R).sum(axis=2)
        X = em_solve(lambda x: mu * x, lambda x: sigma * x, x0, coarse, R * dt)
        errors.append(np.mean(np.abs(X[:, -1] - exact)))
    return np.array(errors)
    # END SOLUTION

# %%
# Higham's emstrong: lambda = 2, mu = 1, X0 = 1, T = 1, δt = 2^-8, 1000 paths,
# Δt = δt, 2δt, ..., 16δt. The slope should land in [0.4, 0.6].
_rng = np.random.default_rng(8)
_N, _T, _M = 2**8, 1.0, 1000
_dt = _T / _N
_Rs = [1, 2, 4, 8, 16]
_dW = brownian_increments(_N, _T, _rng, paths=_M)
_err = strong_errors(2.0, 1.0, 1.0, _dW, _dt, _Rs)
_slope = fit_slope([R * _dt for R in _Rs], _err)
print("mean endpoint error:", np.round(_err, 4), f" fitted slope {_slope:.4f}")
assert _err.shape == (5,) and np.all(np.diff(_err) > 0), "the error must grow with the step"
assert 0.4 < _slope < 0.6, f"measured order {_slope:.3f}, expected 1/2"

# The same numbers with the discipline dropped: fresh increments for every
# step size. The Monte-Carlo spread of the exact endpoint across paths
# (its standard deviation is about 6 here) swamps the discretization error,
# and the slope is noise.
_uncoupled = []
for _R in _Rs:
    _fresh = brownian_increments(_N // _R, _T, _rng, paths=_M)
    _ref = gbm_exact(1.0, 2.0, 1.0, _T, brownian_increments(_N, _T, _rng, paths=_M).sum(axis=1))
    _X = em_solve(lambda x: 2.0 * x, lambda x: 1.0 * x, 1.0, _fresh, _R * _dt)
    _uncoupled.append(np.mean(np.abs(_X[:, -1] - _ref)))
fig, (a, b) = plt.subplots(1, 2, figsize=(10, 3.5))
plot_loglog([R * _dt for R in _Rs], _err, "coupled paths", ax=a)
a.set_title("emstrong.m", fontsize=9)
plot_loglog([R * _dt for R in _Rs], _uncoupled, "independent paths per Δt", ax=b)
b.set_title("the same study without the coupling", fontsize=9)
fig.tight_layout()
plt.show()

# %% [markdown]
# If the error does not grow with the step, or the slope lands outside
# $[0.4, 0.6]$, open the hints in order.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Three things are computed once and three things per $R$. Once: the
# horizon $T = N\,dt$; the endpoint $W(T)$ of every path, which is the row
# sum of its fine increments; and from it the exact endpoint $S(T)$ — one
# number per path, the same number at every $R$, since every resolution
# rides the same path. Per $R$: the coarse increments, which are the fine
# ones summed in blocks of $R$ along the time axis — a reshape to
# $(M, N/R, R)$ and a sum over the last axis, no new randomness anywhere;
# the scheme run on them at step $R\,dt$, which is `em_solve` on a batch;
# and the mean over paths of $|X(T) - S(T)|$. The mean of the absolute
# differences, path by path — not the absolute difference of the means,
# which is the weak error and falls at a different order.
#
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# M, N <- shape of dW;  T <- N * dt
# exact <- S(T) on every path from W(T) = row sums of dW          # (M,)
# for R in Rs:
#     coarse <- dW reshaped to (M, N / R, R), summed over the last axis
#     X <- em_solve(drift mu x, diffusion sigma x, x0, coarse, R * dt)
#     error[R] <- mean over paths of |X[:, -1] - exact|
# return the errors in the order of Rs
# ```
#
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```
# exact = gbm_exact(x0, mu, sigma, N * dt, dW.sum(axis=1))
# coarse = dW.reshape(M, N // R, R).sum(axis=2)
# X = em_solve(lambda x: mu * x, lambda x: sigma * x, x0, coarse, R * dt)
# errors.append(np.mean(np.abs(X[:, -1] - exact)))
# ```
#
# </details>


# %%
distill.check("strong-order", strong_errors)

# %% [markdown]
# ## 8. Why the left endpoint
#
# Section 4 produced three limits from one path, and the module's
# construction chose one of them. Read the gap again — the left and midpoint
# sums differ by $Q_\Pi / 2 \to T/2$ on the path you computed — and answer,
# in a few sentences: why does finance force the left endpoint, and what
# would a trader whose gains were computed with the midpoint rule be able to
# do? Name the property of the integrand that the left endpoint respects and
# the others violate. Write the answer as a string and submit it; a model
# reads it against a rubric that grades the property named and the
# consequence, not the prose.

# %%
distill.submit_review(
    "why-left-endpoint",
    "The integrand of a stochastic integral in finance is a position — the number of "
    "shares held over the cell — and a position is decided at the start of the cell, "
    "before the price increment it multiplies is known: the integrand is adapted "
    "(non-anticipating), settled at the cell's left endpoint. Only the left-endpoint "
    "sum multiplies each increment by a quantity known when the increment begins, "
    "so only it is the gain of a strategy someone could run. The midpoint rule reads "
    "the position halfway through the cell, so a midpoint trader sizes the position "
    "using half a step of the price move that is still in the future; on int W dW "
    "that peek is worth Q/2 → T/2 in the limit, an arbitrage-sized gain from "
    "information nobody has. The right endpoint peeks a full step ahead and is "
    "worth T. The Itô integral is the left-endpoint limit because that is the one "
    "evaluation point at which the integrand is measurable with respect to the "
    "filtration at the start of the cell.",
)

# %% [markdown]
# ## 9. Open task: volatility from a noisy feed
#
# Section 3 measured $[\log S, \log S](T) = \sigma^2 T$ on a simulated path
# whose $\sigma$ was known, at every mesh: the meter's reading of a log
# price does not move with the stride, up to the theorem's spread of
# $\sqrt{2/m}$ at $m$ cells. `data/holdout_paths.csv` holds 160 paths of
# geometric Brownian motion observed at discrete times — columns `path`,
# `t`, `S` — each with its own $S_0$, drift, horizon and observation count
# (80 to 400 observations after the first, over a quarter to two years),
# each simulated with a volatility that is held out. The prices did not
# arrive clean. They came through a feed that records, at every observation
# time, the true log price plus an error of its own:
#
# $$\log S^{\mathrm{obs}}(t_j) = \log S(t_j) + \varepsilon_j, \qquad
# \varepsilon_j \sim N(0, \eta^2) \text{ independent, of each other and of the path},$$
#
# with $\eta$ one number for the whole feed — bid–ask bounce and tick
# rounding in the stylized form of Roll (1984). The feed's $\eta$ is not
# given. Estimate $\sigma$ for every path, **in percent** (a volatility of
# $0.35$ is submitted as $35$), in path order. The server scores the
# root-mean-square error against the held-out truths; the threshold is an
# RMSE of $3.5$ percentage points.
#
# The baseline is section 3's identity applied as it stands,
# $\hat\sigma = \sqrt{Q_1 / T}$ with $Q_1$ the sampled quadratic variation
# of the observed log prices over the path's own grid and $T$ the path's own
# horizon. `plain_sigma` below is that estimator, complete; on the holdout
# it scores an RMSE of $6.6$ points. The theorem's spread alone,
# $\sigma / \sqrt{2m}$ per path, is $1.8$ points over this mix, and an
# estimator that models the feed scores between $2$ and $3$. The plot after
# the loader shows what the baseline meets: the meter's reading against the
# stride, on the holdout's three longest paths and on a clean simulated path
# of the same kind. Section 3 says the reading is flat in the stride; on the
# holdout's paths it is not.
#
# Work out from the noise model what the meter reads at stride $s$, and what
# the model implies for the covariance of consecutive observed log returns;
# build the estimator from the two facts. Write it as a function of the
# whole holdout — what the model says the paths share can only be estimated
# across them — with the signature below, which is the only scaffold: it
# returns the estimates and the noise level as the estimator read it, so
# the calibration bench can check both against what it was built with.
# No library volatility estimators. The classical-ml habit applies:
# `make_bench` simulates paths of the holdout's kind, noise included, at a
# $\sigma$ and an $\eta$ you choose, and the cell after the estimator runs
# yours on them against the truth before the holdout sees it. Try the task
# before opening the hints.

# %%
def load_holdout(path="data/holdout_paths.csv"):
    """The held-out paths as a list of (t, S) pairs, one per path id in order."""
    table = np.loadtxt(path, delimiter=",", skiprows=1)
    ids = table[:, 0].astype(int)
    return [(table[ids == k, 1], table[ids == k, 2]) for k in range(ids.max() + 1)]


def plain_sigma(t, S):
    """Section 3's identity as it stands: 100 sqrt(Q_1 / T), the sampled QV of log S at stride 1 over the horizon."""
    return 100 * np.sqrt(sampled_qv(np.log(S)) / (t[-1] - t[0]))


def make_bench(rng, sigma, eta, counts=(80, 160, 250, 400), size=400):
    """Paths of the holdout's kind with the truth known: GBM over one year, observed through a feed of level eta.

    Args:
        rng: numpy Generator.
        sigma, eta: the volatility every path is simulated with and the feed's noise level.
        counts: observation counts to draw from, one per path.
        size: number of paths.
    Returns:
        list of (t, S) pairs in the holdout's form, S the observed prices.
    """
    bench = []
    for m in rng.choice(counts, size=size):
        t = grid(int(m), 1.0)
        log_S = np.log(gbm_exact(100.0, 0.08, sigma, t, cumpath(brownian_increments(int(m), 1.0, rng))))
        bench.append((t, np.exp(log_S + eta * rng.standard_normal(t.size))))
    return bench


def plot_signature(paths, labels, strides=(1, 2, 3, 4, 6, 8, 12, 16), ax=None):
    """The meter's reading against the stride: 100 sqrt(Q_s / T_s) for each stride, one line per path.

    Q_s is the sampled quadratic variation of log S over the cells of s observations
    that fit in the path, T_s the time those cells cover.
    """
    ax = ax or plt.figure(figsize=(6, 3.5)).gca()
    for (t, S), label in zip(paths, labels):
        x, m = np.log(S), S.size - 1
        reads = [100 * np.sqrt(sampled_qv(x[: (m // s) * s + 1], s) / (t[(m // s) * s] - t[0])) for s in strides]
        ax.plot(strides, reads, "o-", ms=3, lw=1, label=label)
    ax.set_xlabel("stride s (observations per cell)")
    ax.set_ylabel("100·√(Q_s / T_s)")
    ax.legend(fontsize=8)
    return ax


holdout = load_holdout()
print(f"{len(holdout)} paths; observations per path from "
      f"{min(len(t) for t, _ in holdout) - 1} to {max(len(t) for t, _ in holdout) - 1}; "
      f"horizons {sorted({round(float(t[-1]), 2) for t, _ in holdout})}")

# %%
# The signature: the baseline's reading of a path at every stride. On a clean
# path it wanders within the theorem's spread and nothing else; on the
# holdout's paths it falls with the stride and settles.
_longest = sorted(range(len(holdout)), key=lambda k: -holdout[k][0].size)[:3]
_clean = make_bench(np.random.default_rng(10), sigma=0.35, eta=0.0, counts=(400,), size=1)
plot_signature([holdout[k] for k in _longest] + _clean,
               [f"holdout path {k}, m = {holdout[k][0].size - 1}" for k in _longest] + ["clean simulated path, σ = 35, m = 400"])
plt.title("the meter's reading against the stride", fontsize=9)
plt.show()

# %%
def estimate_sigma(paths):
    """Volatility of every path of a noisy feed, in percent, and the feed's noise level.

    Args:
        paths: list of (t, S) pairs — t (m + 1,) observation times, S (m + 1,) the
            observed prices — every path recorded by one feed with one noise level.
    Returns:
        sigma_hat: (len(paths),) array, the estimated volatility of each path in percent,
            in the order given.
        eta_hat: float, the feed's noise level as the estimator read it, in log-price
            units (nan if the route never estimates it).
    """
    # BEGIN SOLUTION
    # The feed's level, pooled: consecutive observed log returns share one error
    # with opposite signs, so their covariance is -eta^2 on every path.
    returns = [np.diff(np.log(S)) for _, S in paths]
    eta2 = -sum(np.sum(r[:-1] * r[1:]) for r in returns) / sum(r.size - 1 for r in returns)
    eta2 = max(eta2, 0.0)
    sigma_hat = []
    for t, S in paths:
        x, m = np.log(S), S.size - 1
        q1 = sampled_qv(x)
        # The reading at stride s is sigma^2 T + 2 (m / s) eta^2 with a spread of
        # sqrt(s) (1 + b / s) times the theorem's, b the noise-to-signal ratio:
        # smallest at s = b, with at least 20 cells kept. A pilot estimate sets b.
        pilot = max(q1 - 2 * m * eta2, 0.05 * q1)
        s = int(np.clip(round(2 * m * eta2 / pilot), 1, m // 20))
        cells = m // s
        variance = max(sampled_qv(x[: cells * s + 1], s) - 2 * cells * eta2, 0.0) / (t[cells * s] - t[0])
        sigma_hat.append(100 * np.sqrt(variance))
    return np.array(sigma_hat), float(np.sqrt(eta2))
    # END SOLUTION

# %% [markdown]
# The calibration study, before the holdout. `bench` is four hundred paths
# of the holdout's kind — geometric Brownian motion observed at $m$ points
# over a year through a feed of level `bench_eta` — every one simulated at
# $\sigma = 0.35$, the number the holdout keeps from you. The level is
# yours to set; the line below sets it to what your estimator reads off the
# holdout, which is the feed the estimator will face. Run yours and the
# baseline on the bench and read the plot: the points should fill the band
# $35 \pm 35/\sqrt{2m}$, thin at $m = 400$ and wide at $m = 80$, with the
# baseline's sitting above it by an amount that grows with $m$. The RMS
# errors printed under the plot should sit near the theorem's numbers
# count by count, and the level read back off the bench should be the
# level it was built with. An estimator whose points sit off the band by a
# constant factor is wrong in its scaling; one whose error grows with $m$
# still reads the noise as volatility; one whose level comes back at half
# or twice the truth has the covariance's sign or its count wrong.

# %%
bench_eta = estimate_sigma(holdout)[1]
bench = make_bench(np.random.default_rng(9), sigma=0.35, eta=bench_eta)
bench_counts = np.array([len(t) - 1 for t, _ in bench])
bench_hat, bench_eta_hat = estimate_sigma(bench)
bench_plain = np.array([plain_sigma(t, S) for t, S in bench])
assert bench_hat.shape == (len(bench),)
ax = plot_sigma_estimates(bench_counts, bench_hat, truth=35.0, title=f"the calibration study: σ = 35 known, feed level {bench_eta:.4f}")
ax.plot(bench_counts, bench_plain, "x", ms=3, alpha=0.5, color="0.5", label="baseline")
ax.legend(fontsize=8)
plt.show()
for _m in sorted(set(bench_counts)):
    _err, _err_plain = bench_hat[bench_counts == _m] - 35.0, bench_plain[bench_counts == _m] - 35.0
    print(f"m = {_m:>3d}: RMS error {np.sqrt(np.mean(_err**2)):.2f} points, theorem's σ/√(2m) = {35 / np.sqrt(2 * _m):.2f}, "
          f"baseline {np.sqrt(np.mean(_err_plain**2)):.2f}")
print(f"all m: RMS error {np.sqrt(np.mean((bench_hat - 35.0)**2)):.2f} points, baseline {np.sqrt(np.mean((bench_plain - 35.0)**2)):.2f}")
print(f"feed level: built with {bench_eta:.4f}, read back {bench_eta_hat:.4f}")

# %%
sigma_hat, eta_hat = estimate_sigma(holdout)
assert sigma_hat.shape == (len(holdout),)
print(f"the holdout's feed, as read: η = {eta_hat:.4f}")
distill.submit_predictions("qv-sigma", sigma_hat)

# %% [markdown]
# The score is one number over 160 estimates. Read the estimates themselves:
# each against its path's observation count, wearing the error bar the
# theorem grants a clean path, $\pm\hat\sigma/\sqrt{2m}$ — a floor, since
# the feed's noise widens it on the paths where the noise is a large share
# of the reading. The bars should shrink from left to right by the square
# root of the count, and the cloud should sit where the simulator's
# volatilities were drawn from.

# %%
counts = np.array([len(t) - 1 for t, _ in holdout])
plot_sigma_estimates(counts, sigma_hat, title="the held-out paths: your estimates, a clean path's bars")
plt.show()

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — what the meter reads on the feed</summary>
#
# The observed log return over a cell of $s$ observations is the true one
# plus the errors at the cell's two ends, $r_j + \varepsilon_{(j+1)s} -
# \varepsilon_{js}$; its square has expectation $\sigma^2 s\,\Delta t +
# 2\eta^2$, and over the $m/s$ cells
#
# $$E[Q_s] = \sigma^2 T + 2\,\frac{m}{s}\,\eta^2 .$$
#
# The reading is high by twice the noise variance per cell, a term that
# falls with the stride — the signature plot's falling curve — and that at
# stride $1$ on a low-volatility path with many observations is larger than
# the quantity being measured. The noise-to-signal ratio of a path,
# $b = 2m\eta^2 / (\sigma^2 T)$, is the number that decides everything below.
#
# </details>
#
# <details><summary>Hint 2 — the feed's level, from the data</summary>
#
# Consecutive observed returns at stride $1$ share one error with opposite
# signs, $r^{\mathrm{obs}}_j$ ending in $+\varepsilon_{j+1}$ and
# $r^{\mathrm{obs}}_{j+1}$ starting in $-\varepsilon_{j+1}$, so
# $\operatorname{Cov}(r^{\mathrm{obs}}_j, r^{\mathrm{obs}}_{j+1}) = -\eta^2$.
# The level is one number for the feed: average $r_j r_{j+1}$ over every
# consecutive pair of every path — about $38{,}000$ pairs — and negate. The
# same average over one path has a spread of about $\sigma^2\Delta t/\sqrt m$,
# larger than $\eta^2$ itself on most paths, and an estimator that corrects
# each path with its own level scores $3.2$ on the holdout against $2.7$ for
# the pooled one. Check the number on the bench: build it at a level and
# read the level back.
#
# </details>
#
# <details><summary>Hint 3 — two routes, and the choice</summary>
#
# Subtract: $\hat\sigma^2 = (Q_1 - 2m\hat\eta^2) / T$ is unbiased, with a
# spread of $(1 + b)$ times the theorem's — the noise is squared into every
# cell and does not average out of the sum. Coarsen: at stride $s$ the bias
# falls to $2(m/s)\eta^2$ and the theorem's spread grows by $\sqrt s$;
# subtracting the residual bias there leaves a spread of $\sqrt s\,(1 + b/s)$
# times the theorem's, smallest at $s = b$. So correct at stride $1$ where
# $b < 1$ — most of this holdout — and coarsen to about $s = b$ and correct
# there where $b > 1$, with a pilot estimate of $\sigma^2$ standing in for
# the truth in $b$ and at least twenty cells kept. On this holdout the
# stride rule scores $2.3$, the plain correction $2.7$, coarsening without
# the correction $3.2$, the baseline $6.6$. A corrected variance can come
# out negative on a low-volatility path — floor it at zero, or at a small
# fraction of $Q_1$.
#
# </details>
#
# <details><summary>Hint 4 — last resort</summary>
#
# The pooled level and the plain correction, which clears the threshold:
#
# ```
# returns = [np.diff(np.log(S)) for _, S in paths]
# eta2 = -sum(np.sum(r[:-1] * r[1:]) for r in returns) / sum(r.size - 1 for r in returns)
# sigma_hat = np.array([100 * np.sqrt(max(sampled_qv(np.log(S)) - 2 * (S.size - 1) * eta2, 0) / (t[-1] - t[0]))
#                       for t, S in paths])
# return sigma_hat, np.sqrt(eta2)
# ```
#
# </details>
#
# The estimator is realized volatility with Roll's correction, and the
# theorem behind it says its precision is set by the observation count and
# the noise-to-signal ratio, nothing else. Module 8 takes it to real prices,
# where the feed's level is neither constant nor independent of the path,
# sampling faster raises the count and the ratio together, and the signature
# plot you drew — the reading against the sampling interval — is the
# standard diagnostic for where the theorem's hypotheses, not its
# arithmetic, become the question.

# %%
distill.dump()
