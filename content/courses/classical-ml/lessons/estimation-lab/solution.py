# %% [markdown]
# # Lab: the estimator's report card
#
# Module 2 proved that a floor exists. The Cramér–Rao inequality says no
# unbiased estimator of $\theta$ has variance below $1/(nI(\theta))$, and
# the maximum-likelihood estimator reaches that floor in the limit — a
# claim about *variance across repeated samples*, which no single dataset
# can confirm or refute. This lab builds the instrument that can: a small
# estimation toolkit — `loglik`, `score`, `expected_information`,
# `observed_information`, a Newton solver driven by the last two, and a
# replicate harness `study(...)` — and then a report card. For each
# (family, estimator, $n$) it reports the empirical variance, the
# $1/(nI(\theta_0))$ floor, their ratio, and how far the standardized
# estimate has travelled toward $\mathcal{N}(0,1)$.
#
# Four verdicts come out of the same harness: an estimator sitting on the
# floor, an unbiased one above it, a biased one legitimately below it, and
# a family where the floor is fiction because a hypothesis you can name has
# failed. The last section turns the instrument on the fitted Poisson claims
# model of the insurance-claims lesson and prices its coefficients'
# standard errors.
#
# Ground rules:
#
# - **No scipy, no statsmodels** — numpy and matplotlib are the whole stack.
#   (Checking against `scipy.stats` on your own machine is fine; the graded
#   work is yours.)
# - Everything below is generic in the *family*. Your functions receive a
#   record of callables and may read only its fields; the checkpoints hand
#   them families this notebook never defines, so nothing can be special-cased.
# - The seven exact checkpoints are the required set. The written answer and
#   the open task at the end are optional — partial completion is a normal
#   way to finish a lab.
# - Everything is seeded. A variance claim you cannot rerun is not a
#   measurement, which is the whole subject of this lab.

# %%
import math
from types import SimpleNamespace

import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("classical-ml/estimation-lab")

# %% [markdown]
# ## 0. The family record
#
# One notation decision organizes the whole lab. Every regular family here
# is written twice: in its **natural parameter** $\eta$, where the GLM
# lesson's moment factory gives the mean and the variance as $A'(\eta)$ and
# $A''(\eta)$ for free, and in the **parameter of interest** $\theta$ — the
# rate, the probability, the variance — which is what an estimator
# estimates and what the floor is stated for. A family record carries both
# sides plus the map between them:
#
# $$p(y \mid \theta) = h(y)\, \exp\big(\eta(\theta)\, T(y) - A(\eta(\theta))\big).$$
#
# The two derivatives `d_eta` and `d2_eta` of the map $\theta \mapsto \eta$
# are what let you move information between the two parameterizations — the
# reparameterization rule $I(\eta) = I(\theta)\,(d\theta/d\eta)^2$ of the
# information lesson, in whichever direction you need it.

# %%
# Infrastructure (do not modify): the family record and three regular
# families. `sample` and `crude_start` belong to the harness, not to the
# mathematics: the checkpoints pass records WITHOUT them, so a graded
# function that reads either will fail.
def family(name, T, A, dA, d2A, log_h, eta, d_eta, d2_eta, sample, crude_start):
    """One-parameter exponential family, in both parameterizations.

    Fields your graded functions may read:
        T(y):        sufficient statistic, elementwise.
        A(e):        log-partition A(eta), elementwise.
        dA(e):       A'(eta)  = E[T(Y)].
        d2A(e):      A''(eta) = Var(T(Y)).
        log_h(y):    log base measure, elementwise.
        eta(th):     the natural parameter at theta.
        d_eta(th):   deta/dtheta.
        d2_eta(th):  d2eta/dtheta2.
    Harness-only fields:
        sample(theta, n, rng) -> (n,) draws.
        crude_start(y) -> where Newton starts: half the method-of-moments
            estimate. Deliberately rough, and deliberately BELOW the
            estimate — an undamped Newton step started on the far side of
            the curvature can leave the parameter space in one move, and
            the repair real solvers use is the line search the optimization
            lesson mentions rather than a better guess.
    """
    return SimpleNamespace(
        name=name, T=T, A=A, dA=dA, d2A=d2A, log_h=log_h,
        eta=eta, d_eta=d_eta, d2_eta=d2_eta,
        sample=sample, crude_start=crude_start,
    )

_LGAMMA = np.vectorize(math.lgamma, otypes=[float])

BERNOULLI = family(
    "Bernoulli(theta)",
    T=lambda y: y,
    A=lambda e: np.logaddexp(0.0, e),
    dA=lambda e: 1.0 / (1.0 + np.exp(-e)),
    d2A=lambda e: 1.0 / (1.0 + np.exp(-e)) * (1.0 - 1.0 / (1.0 + np.exp(-e))),
    log_h=lambda y: np.zeros_like(np.asarray(y, dtype=float)),
    eta=lambda th: np.log(th / (1.0 - th)),
    d_eta=lambda th: 1.0 / (th * (1.0 - th)),
    d2_eta=lambda th: (2.0 * th - 1.0) / (th * (1.0 - th)) ** 2,
    sample=lambda th, n, rng: (rng.random(n) < th).astype(float),
    crude_start=lambda y: 0.5 * float(np.mean(y)),
)

POISSON = family(
    "Poisson(lambda)",
    T=lambda y: y,
    A=lambda e: np.exp(e),
    dA=lambda e: np.exp(e),
    d2A=lambda e: np.exp(e),
    log_h=lambda y: -_LGAMMA(np.asarray(y, dtype=float) + 1.0),
    eta=lambda th: np.log(th),
    d_eta=lambda th: 1.0 / th,
    d2_eta=lambda th: -1.0 / th**2,
    sample=lambda th, n, rng: rng.poisson(th, n).astype(float),
    crude_start=lambda y: 0.5 * float(np.mean(y)),
)

# The Gaussian with a KNOWN mean 0 and the variance as the parameter:
# theta = sigma^2, T(y) = y^2, eta = -1/(2 theta).
NORMAL_VAR = family(
    "Normal(0, theta)",
    T=lambda y: y**2,
    A=lambda e: -0.5 * np.log(-2.0 * e),
    dA=lambda e: -0.5 / e,
    d2A=lambda e: 0.5 / e**2,
    log_h=lambda y: np.full_like(np.asarray(y, dtype=float), -0.5 * np.log(2 * np.pi)),
    eta=lambda th: -0.5 / th,
    d_eta=lambda th: 0.5 / th**2,
    d2_eta=lambda th: -1.0 / th**3,
    sample=lambda th, n, rng: rng.normal(0.0, np.sqrt(th), n),
    crude_start=lambda y: 0.5 * float(np.mean(y**2)),
)

FAMILIES = [BERNOULLI, POISSON, NORMAL_VAR]

# %% [markdown]
# ## 1. The log-likelihood, in the natural parameter
#
# The recipe of the likelihood lesson starts by writing $\ell$. For an iid
# sample $y_1, \dots, y_n$ from the family above, taking logs and summing
# gives
#
# $$\ell(\theta) \;=\; \eta(\theta) \sum_{i=1}^n T(y_i) \;-\; n\,A\big(\eta(\theta)\big)
#   \;+\; \sum_{i=1}^n \log h(y_i),$$
#
# which is the sufficiency collapse of the GLM lesson in one line: the
# sample reaches the parameter only through the single number
# $\sum_i T(y_i)$ and the count $n$. The last sum does not contain
# $\theta$ and cannot move the maximizer — but it is part of the
# log-likelihood, and the checkpoint compares values, not maximizers.
#
# Write it so it takes a *grid* of $\theta$ at once: every plot and every
# finite-difference referee below evaluates $\ell$ at many parameter values,
# and looping in Python over a grid is the one habit this lab does not want.

# %%
def loglik(fam, theta, y):
    """Log-likelihood of an iid sample, as a function of theta.

    Args:
        fam: family record; read T, A, log_h, eta.
        theta: scalar, or (m,) array of parameter values.
        y: (n,) sample.
    Returns:
        float if theta is a scalar, else (m,): the sample log-likelihood
        at each theta. No constants dropped.
    """
    # BEGIN SOLUTION
    th = np.asarray(theta, dtype=float)
    e = fam.eta(th)
    total_T = np.sum(fam.T(y))
    base = np.sum(fam.log_h(y))
    out = e * total_T - len(y) * fam.A(e) + base
    return float(out) if th.ndim == 0 else out
    # END SOLUTION

# %%
# Local referees before submitting: two hand values.
# Bernoulli, 3 successes in 5 trials, at theta = 0.5. Every sequence of 5
# flips has probability 0.5^5, so l = 5 log 0.5 = -3.4657, whatever the data.
_y5 = np.array([1.0, 0.0, 1.0, 1.0, 0.0])
assert abs(loglik(BERNOULLI, 0.5, _y5) - 5 * np.log(0.5)) < 1e-12
# Poisson, the sample (0, 1, 2) at lambda = 1: l = -3 + 3 log 1 - log 2! .
assert abs(loglik(POISSON, 1.0, np.array([0.0, 1.0, 2.0])) - (-3.0 - np.log(2))) < 1e-12
# The shape contract: a scalar theta returns a float, a grid returns a grid.
assert isinstance(loglik(POISSON, 1.0, np.array([0.0, 1.0, 2.0])), float)
assert loglik(BERNOULLI, np.linspace(0.2, 0.8, 7), _y5).shape == (7,)
# The maximizer is where the recipe says: the sample mean, on a fine grid.
_grid = np.linspace(0.01, 0.99, 9801)
assert abs(_grid[np.argmax(loglik(BERNOULLI, _grid, _y5))] - 0.6) < 1e-3

# %%
distill.check("loglik", loglik)

# %% [markdown]
# ## 2. The score, refereed by finite differences
#
# Step two of the recipe differentiates. The object it produces is the
# score $\ell'(\theta) = \partial_\theta \log L$, whose two readings the
# information lesson separated: at fixed data its root is the estimate, and
# at fixed $\theta$ it is a mean-zero random variable whose variance is the
# whole subject of this lab.
#
# Differentiate the display in section 1 yourself. Only one term contains
# $\theta$ twice over — $\theta$ enters everything through $\eta(\theta)$,
# so the chain rule has something to contribute, and `d_eta` is in the
# record for a reason. Two properties are worth predicting before you write
# the code, because they are the two ways this function goes wrong: the
# bracket that multiplies the chain-rule factor is *observed total minus
# expected total* (get the order backwards and every variance below still
# looks plausible), and the derivative in the natural parameter has the same
# root as the derivative in $\theta$ (so omitting the chain-rule factor
# survives every root-finding test and corrupts every information).
#
# A derivative has a referee that needs no algebra: the central difference
# $[\ell(\theta + \varepsilon) - \ell(\theta - \varepsilon)]/(2\varepsilon)$
# of the function you already wrote. Run it before you submit.

# %%
def score(fam, theta, y):
    """Score: the derivative of the sample log-likelihood in theta.

    Args:
        fam: family record; read T, dA, eta, d_eta.
        theta: scalar, or (m,) array of parameter values.
        y: (n,) sample.
    Returns:
        float if theta is a scalar, else (m,): l'(theta).
    """
    # BEGIN SOLUTION
    th = np.asarray(theta, dtype=float)
    e = fam.eta(th)
    out = (np.sum(fam.T(y)) - len(y) * fam.dA(e)) * fam.d_eta(th)
    return float(out) if th.ndim == 0 else out
    # END SOLUTION

# %%
# The referee: central differences of YOUR loglik, on all three families.
def fd_score(fam, theta, y, eps=1e-5):
    """Central-difference derivative of loglik in theta — the referee."""
    return (loglik(fam, theta + eps, y) - loglik(fam, theta - eps, y)) / (2 * eps)

_rng = np.random.default_rng(0)
for _fam, _th in [(BERNOULLI, 0.4), (POISSON, 2.5), (NORMAL_VAR, 1.7)]:
    _y = _fam.sample(_th, 60, _rng)
    _analytic, _numeric = score(_fam, 0.9 * _th, _y), fd_score(_fam, 0.9 * _th, _y)
    print(f"{_fam.name:18s} score {_analytic:12.5f}   finite difference {_numeric:12.5f}")
    assert abs(_analytic - _numeric) < 1e-4 * max(1.0, abs(_numeric))
    # The score vanishes at the estimate, which for all three families is the
    # moment match mean(T(y)) = A'(eta): that root is what section 5 hunts.
    assert abs(score(_fam, np.mean(_fam.T(_y)), _y)) < 1e-8

# %%
distill.check("score", score)

# %% [markdown]
# ## 3. Expected information: the score's variance, before the data
#
# The Fisher information of one observation is the variance of its score at
# the true parameter, and it is the number the floor is made of. Computing
# it as a variance means an integral; the moment factory removes the
# integral. For an exponential family, $A''(\eta) = \operatorname{Var}(T(Y))$
# — that is the information *in the natural parameter*, and the record hands
# it to you as `d2A`. What the floor needs is the information in $\theta$,
# and the two are not the same number: information is a property of the
# parameterization, not only of the model. The information lesson's
# closing exercise made this exact point on the Bernoulli, where
# $I(\eta) = \theta(1-\theta)$ and $I(\theta) = 1/(\theta(1-\theta))$ are
# reciprocals rather than equals.
#
# Return the information of **one** observation. A sample of $n$ carries
# $n\,I(\theta)$ — information is additive, which is the only reason the
# floor falls like $1/n$ — and keeping the per-observation convention in one
# place stops that factor from being applied twice.

# %%
def expected_information(fam, theta):
    """Fisher information of ONE observation at theta.

    Args:
        fam: family record; read d2A, eta, d_eta.
        theta: scalar, or (m,) array of parameter values.
    Returns:
        float if theta is a scalar, else (m,): I(theta) per observation.
    """
    # BEGIN SOLUTION
    th = np.asarray(theta, dtype=float)
    out = fam.d2A(fam.eta(th)) * fam.d_eta(th) ** 2
    return float(out) if th.ndim == 0 else out
    # END SOLUTION

# %%
# Local referees: the three hand values from the information lesson, and
# the definition itself measured by Monte Carlo — I(theta) is the variance
# of the score of a ONE-observation sample, drawn at the true theta.
assert abs(expected_information(BERNOULLI, 0.4) - 1 / (0.4 * 0.6)) < 1e-12
assert abs(expected_information(POISSON, 2.5) - 1 / 2.5) < 1e-12
assert abs(expected_information(NORMAL_VAR, 1.7) - 1 / (2 * 1.7**2)) < 1e-12

_rng = np.random.default_rng(1)
for _fam, _th in [(BERNOULLI, 0.4), (POISSON, 2.5), (NORMAL_VAR, 1.7)]:
    _draws = _fam.sample(_th, 5000, _rng)
    _scores = np.array([score(_fam, _th, _draws[i:i + 1]) for i in range(len(_draws))])
    print(f"{_fam.name:18s} I(theta) {expected_information(_fam, _th):8.4f}   "
          f"Var(score of one draw) {_scores.var():8.4f}   "
          f"mean score {_scores.mean():+8.4f}")
    assert abs(_scores.var() / expected_information(_fam, _th) - 1) < 0.20
    # Mean zero is the identity the whole theory rests on; it is also the
    # first thing that fails when a support depends on the parameter.
    assert abs(_scores.mean()) < 4 * np.sqrt(_scores.var() / len(_scores))

# %%
distill.check("expected-information", expected_information)

# %% [markdown]
# ## 4. Observed information: the curvature this sample actually has
#
# Expected information is an average over samples that were never drawn.
# The **observed information** is the curvature of the log-likelihood the
# data in front of you produced: $-\ell''(\theta)$, no expectation taken.
# It is the quantity that prices a standard error in practice, on the
# argument of [Efron and Hinkley
# (1978)](https://doi.org/10.1093/biomet/65.3.457) that a fit should be
# reported with the curvature it obtained rather than the one it expected.
#
# Differentiate your score once more. The derivative has two terms — the
# score is a product, and both factors depend on $\theta$ — and `d2_eta` is
# in the record for the second one. Return $-\ell''$, positive-oriented, for
# the whole sample of $n$; the referee below is again a central difference,
# now of `score`.
#
# One prediction to make before running it. At a general $\theta$ the two
# informations are different numbers, one random and one not. At the
# maximum-likelihood estimate the sample's score is zero by construction,
# and for the families in this notebook that kills the second term outright:
# observed information at $\hat\theta$ equals $n\,I(\hat\theta)$ *exactly*,
# not approximately. That coincidence is why the GLM lesson could say that
# Newton's method and Fisher scoring are the same step under a canonical
# link, and it is why a standard error can be read off a Hessian at no extra
# cost. Away from $\hat\theta$ the coincidence is gone, and the two
# histograms below are what "gone" looks like.

# %%
def observed_information(fam, theta, y):
    """Observed information of a sample: -l''(theta), for all n observations.

    Args:
        fam: family record; read T, dA, d2A, eta, d_eta, d2_eta.
        theta: scalar, or (m,) array of parameter values.
        y: (n,) sample.
    Returns:
        float if theta is a scalar, else (m,): -l''(theta) for this sample.
    """
    # BEGIN SOLUTION
    th = np.asarray(theta, dtype=float)
    e = fam.eta(th)
    curvature = len(y) * fam.d2A(e) * fam.d_eta(th) ** 2
    slope = (np.sum(fam.T(y)) - len(y) * fam.dA(e)) * fam.d2_eta(th)
    out = curvature - slope
    return float(out) if th.ndim == 0 else out
    # END SOLUTION

# %%
# Referee 1: the central difference of YOUR score, negated.
def fd_observed(fam, theta, y, eps=1e-5):
    """-(central-difference derivative of score) — the referee for section 4."""
    return -(score(fam, theta + eps, y) - score(fam, theta - eps, y)) / (2 * eps)

_rng = np.random.default_rng(2)
for _fam, _th in [(BERNOULLI, 0.4), (POISSON, 2.5), (NORMAL_VAR, 1.7)]:
    _y = _fam.sample(_th, 60, _rng)
    _a, _n = observed_information(_fam, 1.3 * _th, _y), fd_observed(_fam, 1.3 * _th, _y)
    assert abs(_a - _n) < 1e-3 * max(1.0, abs(_n)), (_fam.name, _a, _n)
    # Referee 2: at the estimate the score vanishes and the two informations
    # coincide exactly — a property of the family, not a numerical accident.
    _hat = float(np.mean(_fam.T(_y)))
    _obs = observed_information(_fam, _hat, _y)
    _exp = len(_y) * expected_information(_fam, _hat)
    print(f"{_fam.name:18s} at theta-hat: observed {_obs:10.4f}   n I(theta-hat) "
          f"{_exp:10.4f}   at 1.3 theta0: observed {_a:10.4f}")
    assert abs(_obs - _exp) < 1e-8 * _exp

# %%
distill.check("observed-information", observed_information)

# %% [markdown]
# ### How far observed sits from expected, at two sample sizes
#
# At the truth $\theta_0$ the observed information is a random variable: it
# is a sum of $n$ per-observation curvatures, and the curvature identity of
# the information lesson says its mean is $n\,I(\theta_0)$ exactly. Its
# *spread* is what shrinks. Draw many samples at $\theta_0$ and histogram
# the ratio $-\ell''(\theta_0) / (n I(\theta_0))$: at $n = 20$ it is a wide
# distribution around one, at $n = 2{,}000$ a spike. The two panels below
# are the same plot helper, given the same estimator at two sample sizes —
# the reason the module could get away with treating the two informations
# as interchangeable is entirely on the right-hand panel.

# %%
# Infrastructure (do not modify): the ratio histogram, run at two sizes.
def plot_ratio_hist(ratios, labels, title, xlabel):
    """Overlaid histograms of a ratio against its ideal value of 1."""
    lo, hi = min(r.min() for r in ratios), max(r.max() for r in ratios)
    bins = np.linspace(lo, hi, 60)
    for r, lab in zip(ratios, labels):
        plt.hist(r, bins=bins, alpha=0.55, density=True, label=lab)
    plt.axvline(1.0, color="k", lw=0.8)
    plt.xlabel(xlabel)
    plt.ylabel("density")
    plt.title(title)
    plt.legend()
    plt.show()

_rng = np.random.default_rng(3)
_ratios = []
for _n in (20, 2000):
    _r = np.empty(4000)
    for _i in range(4000):
        _y = POISSON.sample(3.0, _n, _rng)
        _r[_i] = observed_information(POISSON, 3.0, _y) / (
            _n * expected_information(POISSON, 3.0))
    _ratios.append(_r)
    print(f"n = {_n:5d}: observed / expected at theta0 — mean {_r.mean():.4f}, "
          f"sd {_r.std():.4f}")
plot_ratio_hist(_ratios, ["n = 20", "n = 2,000"],
                "Observed information at the truth, against its expectation",
                "-l''(theta0) / (n I(theta0))")
assert abs(_ratios[0].mean() - 1) < 0.01 and abs(_ratios[1].mean() - 1) < 0.01
assert _ratios[0].std() > 8 * _ratios[1].std()

# %% [markdown]
# The means agree with one to three decimals at both sizes — that is the
# curvature identity, measured. The standard deviations differ by a factor
# of ten, which is $\sqrt{2000/20}$: the observed information concentrates
# on the expected one at the usual $1/\sqrt{n}$ rate. At $n = 20$ a
# standard error computed from the expected information and one computed
# from the observed information routinely differ by a tenth of themselves,
# and only one of them used the data.

# %% [markdown]
# ## 5. Newton's method, stepped by the observed information
#
# The recipe's third step — *solve* — has no closed form in general, and
# the optimization lesson supplied the answer: Newton's method on the
# score, which divides the gradient by the curvature. Both are now
# functions you own, so the solver is two lines of arithmetic inside a
# loop:
#
# $$\theta_{t+1} \;=\; \theta_t \;+\; \frac{\ell'(\theta_t)}{-\ell''(\theta_t)}.$$
#
# Note the plus. The score is the derivative of a function being
# *maximized*, and $-\ell''$ is positive near the maximum, so the step
# climbs. The contract, which the checker verifies exactly:
#
# - iterate from `theta0`; step $t$ uses `score` and `observed_information`
#   at the current iterate;
# - stop as soon as $|\theta_{t+1} - \theta_t| \le \texttt{tol}$, or after
#   `max_iter` steps, whichever comes first;
# - return the last iterate and the number of steps *taken* (a call that
#   converges on its third step returns 3).
#
# The step divides by the **observed** information, not the expected one.
# Both converge to the same estimate — that is Fisher scoring, and the
# optimization lesson showed it lands on the Bernoulli MLE in a single step
# from anywhere — but they walk different paths, and the checker compares
# the iterate count as well as the estimate.

# %%
def mle_newton(fam, y, theta0, tol=1e-10, max_iter=100):
    """Maximum likelihood by Newton's method on the score.

    Args:
        fam: family record.
        y: (n,) sample.
        theta0: starting value; the harness supplies fam.crude_start(y).
        tol: stop when a step moves theta by tol or less.
        max_iter: hard cap on the number of steps.
    Returns:
        (theta_hat, steps): the last iterate as a float, and the number of
        steps taken as a float, per the contract above.
    """
    # BEGIN SOLUTION
    theta = float(theta0)
    for step in range(1, max_iter + 1):
        move = score(fam, theta, y) / observed_information(fam, theta, y)
        theta = theta + move
        if abs(move) <= tol:
            return theta, float(step)
    return theta, float(max_iter)
    # END SOLUTION

# %%
# Local referees. All three families have a closed-form MLE — the moment
# match mean(T(y)) — so Newton is checked against an answer it never sees.
_rng = np.random.default_rng(4)
for _fam, _th in [(BERNOULLI, 0.35), (POISSON, 3.0), (NORMAL_VAR, 2.0)]:
    _y = _fam.sample(_th, 200, _rng)
    _hat, _steps = mle_newton(_fam, _y, _fam.crude_start(_y))
    _closed = float(np.mean(_fam.T(_y)))
    print(f"{_fam.name:18s} Newton {_hat:.10f} in {int(_steps)} steps   "
          f"closed form {_closed:.10f}")
    assert abs(_hat - _closed) < 1e-9
    # A maximum, not just a root: the log-likelihood really is higher there.
    assert loglik(_fam, _hat, _y) > loglik(_fam, _fam.crude_start(_y), _y)

# %%
distill.check("mle-newton", mle_newton)

# %% [markdown]
# ## 6. The report card: variance across replicates against the floor
#
# Everything so far ran on one sample. The Cramér–Rao bound does not: it
# bounds $\operatorname{Var}_\theta(W)$, an average over the samples that
# could have been drawn, so checking it means drawing them. That is the
# harness this section builds, and it is the piece that makes the module's
# theorem measurable rather than quotable.
#
# `study` draws `reps` independent samples of size `n` at the true
# parameter, runs one estimator on each, and reports four numbers: the mean
# of the estimates (whose distance from $\theta_0$ is the bias), their
# variance, the floor $1/(n I(\theta_0))$, and the ratio of the two. The
# contract, which the checker verifies exactly:
#
# - `rng = np.random.default_rng(seed)`, created once, before the loop;
# - replicate $r$ draws `y = sampler(n, rng)` and records
#   `estimator(y)`, for $r = 0, \dots, \texttt{reps} - 1$ in order;
# - the variance is the **population** variance of the replicate estimates,
#   `ddof=0`: the floor is a statement about $\mathbb{E}[(W - \mathbb{E}W)^2]$,
#   and the $1/(R-1)$ correction estimates a different target;
# - `info` is the per-observation $I(\theta_0)$ — the value your
#   `expected_information` returns — so the floor is $1/(n \cdot \texttt{info})$.
#
# Note what `study` is *not* given: the family. A sampler and an estimator
# are all a variance study needs, which is why the same function will run on
# a family that has no exponential-family form at all in section 8.

# %%
def study(sampler, estimator, theta0, info, n, reps, seed):
    """Monte-Carlo variance of an estimator against the Cramer-Rao floor.

    Args:
        sampler: sampler(n, rng) -> (n,) draws at the true parameter.
        estimator: estimator(y) -> scalar estimate of theta.
        theta0: the true parameter the sampler draws at.
        info: per-observation Fisher information I(theta0).
        n: sample size per replicate; reps: number of replicates.
        seed: for np.random.default_rng, per the contract above.
    Returns:
        (estimates, report):
        estimates: (reps,) the replicate estimates, in draw order.
        report: (4,) [mean, variance, floor, ratio] — variance with ddof=0,
            floor = 1 / (n * info), ratio = variance / floor.
    """
    # BEGIN SOLUTION
    rng = np.random.default_rng(seed)
    estimates = np.empty(reps)
    for r in range(reps):
        estimates[r] = estimator(sampler(n, rng))
    variance = float(estimates.var())
    floor = 1.0 / (n * info)
    report = np.array([float(estimates.mean()), variance, floor, variance / floor])
    return estimates, report
    # END SOLUTION

# %%
distill.check("crlb-study", study)

# %% [markdown]
# ### Four estimators, one floor
#
# The report card runs four rows at $n = 25$, and each is a verdict the
# information lesson argued on paper.
#
# - **Poisson $\bar{X}$**, reached by your Newton solver rather than by the
#   closed form: the lesson's own example of a floor that ends a search.
# - **Poisson $S^2$**, also unbiased for $\lambda$ (the Poisson's mean and
#   variance are the same number), and the estimator the floor eliminates
#   without anyone computing its variance in closed form.
# - **Poisson $0.8\,\bar{X}$**, the shrunken estimator from that lesson's
#   floor figure: biased, and therefore not bound by the floor at all.
# - **Gaussian variance with a known mean**, where the attainment condition
#   of the lesson is satisfied exactly.
#
# A report card that flags row 3 as a bug would be wrong, and this one
# prints the bias next to the ratio so that it cannot.

# %%
# Infrastructure (do not modify): the report-card table and its bar chart.
def report_card(rows, n, reps, seed):
    """Run study(...) on (label, sampler, estimator, theta0, info) rows."""
    print(f"{'estimator':34s} {'mean':>9s} {'bias':>9s} {'variance':>10s} "
          f"{'floor':>10s} {'ratio':>7s}")
    ratios, labels = [], []
    for label, sampler, estimator, theta0, info in rows:
        _, rep = study(sampler, estimator, theta0, info, n, reps, seed)
        mean, var, floor, ratio = rep
        print(f"{label:34s} {mean:9.4f} {mean - theta0:+9.4f} {var:10.5f} "
              f"{floor:10.5f} {ratio:7.3f}")
        ratios.append(float(ratio))
        labels.append(label)
    return labels, ratios

def plot_ratios(labels, ratios, title):
    """Variance-to-floor ratios as bars, with the floor itself as the line."""
    colors = ["tab:red" if r < 0.98 else "tab:blue" for r in ratios]
    plt.barh(range(len(ratios)), ratios, color=colors)
    plt.axvline(1.0, color="k", lw=1.0)
    plt.yticks(range(len(ratios)), labels, fontsize=8)
    plt.gca().invert_yaxis()
    plt.xlabel("empirical variance / Cramer-Rao floor")
    plt.title(title)
    plt.show()

def mle_of(fam):
    """The maximum-likelihood estimator of a family, as an estimator callable:
    your Newton solver started from the family's own crude start."""
    def estimate(y):
        return mle_newton(fam, y, fam.crude_start(y))[0]
    return estimate

def poisson_sampler(n, rng):
    return rng.poisson(3.0, n).astype(float)

def normal_sampler(n, rng):
    return rng.normal(0.0, np.sqrt(2.0), n)

_pois_mle = mle_of(POISSON)
_pois_info = expected_information(POISSON, 3.0)
_rows = [
    ("Poisson MLE (your Newton solver)", poisson_sampler, _pois_mle, 3.0, _pois_info),
    ("Poisson sample variance S^2", poisson_sampler,
     lambda y: float(y.var(ddof=1)), 3.0, _pois_info),
    ("Poisson 0.8 * MLE (biased)", poisson_sampler,
     lambda y: 0.8 * _pois_mle(y), 3.0, _pois_info),
    ("Gaussian variance MLE, mean known", normal_sampler, mle_of(NORMAL_VAR), 2.0,
     expected_information(NORMAL_VAR, 2.0)),
]
_labels, _ratios = report_card(_rows, n=25, reps=4000, seed=11)
plot_ratios(_labels, _ratios, "n = 25, 4,000 replicates — the floor is 1.0")
assert abs(_ratios[0] - 1) < 0.08, "the Poisson MLE sits on the floor"
assert _ratios[1] > 3, "S^2 is unbiased and far above the floor"
assert 0.55 < _ratios[2] < 0.75, "0.8 * MLE has 0.64 of the MLE's variance"
assert abs(_ratios[3] - 1) < 0.08, "the Gaussian variance MLE attains its floor"

# %% [markdown]
# Three of the four rows say what the module promised. $\bar{X}$ and the
# Gaussian variance MLE sit on their floors to within the Monte-Carlo error
# of 4,000 replicates (about 2% on a variance), so the attainment the
# lesson proved algebraically is now also measured. $S^2$ sits far above
# its floor, and the bound retires it as an estimator of $\lambda$ without
# anyone computing $\operatorname{Var}(S^2)$ in closed form — that is what a
# floor is *for*.
#
# Row 3 is the one to read carefully. Its variance is 64% of the floor,
# which is not a broken harness and not a broken theorem: $0.8\bar{X}$ has
# bias $-0.2\lambda$, and the Cramér–Rao bound never governed biased
# estimators. Its variance is $0.64\,\lambda/n$ exactly, by the same
# arithmetic that shrinks any estimator's variance by the square of the
# shrinkage factor, and the bias column is what tells the reader that a
# ratio below one is a legitimate trade rather than a red flag. The same
# arithmetic runs at industrial scale in ridge regression.

# %% [markdown]
# ## 7. Asymptotic normality, scored rather than eyeballed
#
# The other half of the module's asymptotic claim is a *shape*: the theorem
# says $\sqrt{n}(\hat\theta_n - \theta_0) \to \mathcal{N}(0, 1/I(\theta_0))$,
# so the standardized estimate
#
# $$z \;=\; \sqrt{n\,I(\theta_0)}\;\big(\hat\theta - \theta_0\big)$$
#
# should look standard normal, and look more so as $n$ grows. "Look" is not
# a measurement. The Kolmogorov–Smirnov distance — the largest vertical gap
# between the empirical distribution function of the $z$ and $\Phi$ — is
# one, and it is shipped below.
#
# The family for this section is the Gaussian variance with a known mean,
# whose MLE is a sum of squares: right-skewed at small $n$, symmetric only
# in the limit, so there is something for the number to detect. Write
# `normality_report` on top of your `study`: one call per sample size,
# standardize that size's replicate estimates, score them. The contract:
# every sample size uses the same `seed` (its draws differ anyway, because
# `n` does), and the sizes are reported in the order given.

# %%
# Infrastructure (do not modify): the normal cdf and the KS distance.
_ERF = np.vectorize(math.erf, otypes=[float])

def normal_cdf(x):
    """Standard normal cdf, elementwise."""
    return 0.5 * (1.0 + _ERF(np.asarray(x, dtype=float) / np.sqrt(2.0)))

def ks_to_normal(z):
    """Kolmogorov-Smirnov distance between the sample z and N(0, 1)."""
    zs = np.sort(np.asarray(z, dtype=float))
    m = len(zs)
    cdf = normal_cdf(zs)
    return float(max(np.max(np.arange(1, m + 1) / m - cdf),
                     np.max(cdf - np.arange(m) / m)))

def plot_z_hist(z, n, ks):
    """Standardized estimates against the standard normal they converge to."""
    grid = np.linspace(-4, 4, 200)
    plt.hist(z, bins=60, range=(-4, 4), density=True, alpha=0.6,
             label=f"n = {n}, KS = {ks:.3f}")
    plt.plot(grid, np.exp(-grid**2 / 2) / np.sqrt(2 * np.pi), "k-", lw=1)
    plt.xlabel("sqrt(n I(theta0)) (theta-hat - theta0)")
    plt.ylabel("density")
    plt.title("The standardized MLE against N(0, 1)")
    plt.legend()
    plt.show()

# %%
def normality_report(sampler, estimator, theta0, info, ns, reps, seed):
    """KS distance from N(0,1) of the standardized estimate, per sample size.

    Args:
        sampler, estimator, theta0, info, reps, seed: as for study; the same
            seed is passed to study for every sample size.
        ns: sample sizes to run, in order.
    Returns:
        (len(ns),) array: ks_to_normal of the standardized replicate
        estimates at each sample size, in the order of ns.
    """
    # BEGIN SOLUTION
    out = np.empty(len(ns))
    for j, n in enumerate(ns):
        estimates, _ = study(sampler, estimator, theta0, info, n, reps, seed)
        z = np.sqrt(n * info) * (estimates - theta0)
        out[j] = ks_to_normal(z)
    return out
    # END SOLUTION

# %%
distill.check("asymptotic-normality", normality_report)

# %%
# The picture the number replaces. Same helper, two sample sizes: at n = 10
# the standardized MLE is visibly skewed, at n = 1,000 the histogram and the
# curve are one object — and "visibly" is doing work no reader can check.
def unit_normal_sampler(n, rng):
    return rng.normal(0.0, 1.0, n)

_NS = [10, 100, 1000]
_v_mle, _v_info = mle_of(NORMAL_VAR), expected_information(NORMAL_VAR, 1.0)
_ks = normality_report(unit_normal_sampler, _v_mle, 1.0, _v_info, _NS, 6000, 21)
print({n: float(round(k, 4)) for n, k in zip(_NS, _ks)})
for _n, _k in [(_NS[0], _ks[0]), (_NS[-1], _ks[-1])]:
    _est, _ = study(unit_normal_sampler, _v_mle, 1.0, _v_info, _n, 6000, 21)
    plot_z_hist(np.sqrt(_n * _v_info) * (_est - 1.0), _n, _k)
assert _ks[0] > _ks[1] > _ks[2], "the distance to normality must fall with n"
assert _ks[0] > 0.05 and _ks[-1] < 0.02

# %% [markdown]
# The number falls by a factor of nine from $n = 10$ to $n = 1{,}000$, and
# the middle size is where an eyeball would already have said "normal
# enough": at $n = 100$ the histogram looks symmetric and the KS distance
# is still three times its $n = 1{,}000$ value. That gap is the reason the
# check is scored rather than looked at. It is also worth knowing what the
# floor of this measurement is: with $R$ replicates the empirical
# distribution function itself wobbles by about $1/\sqrt{R}$, so at
# $R = 6{,}000$ nothing below roughly $0.01$ is distinguishable from a
# perfect fit. The last column is at that floor; more replicates, not a
# larger $n$, is what would sharpen it.

# %% [markdown]
# ## 8. The family where the floor is fiction
#
# Every result so far assumed the regularity conditions, and the
# information lesson was careful to say where they come from: the support
# $\{y : p(y \mid \theta) > 0\}$ must not depend on $\theta$. The standard
# counterexample is $\mathrm{Uniform}(0, \theta)$, whose density is
# $1/\theta$ on $[0, \theta]$ and zero outside — a support that *is* the
# parameter.
#
# Nothing stops the formulas from running. $\partial_\theta \log(1/\theta)
# = -1/\theta$, so $\mathbb{E}[s^2] = 1/\theta^2$ and the mechanical "floor"
# for unbiased estimators of $\theta$ is $\theta^2/n$. The estimator to run
# against it is the rescaled sample maximum $\frac{n+1}{n}\max_i y_i$, which
# is exactly unbiased. Both are shipped below; the study is yours, unchanged
# — this is the payoff of a harness that takes a sampler and an estimator
# rather than a family.

# %%
# Infrastructure (do not modify): the irregular family's sampler, its
# unbiased estimator, and the "information" the formula produces for it.
def uniform_sampler(theta):
    """Draws from Uniform(0, theta) — a support that moves with theta."""
    def draw(n, rng):
        return rng.uniform(0.0, theta, n)
    return draw

def unbiased_max(y):
    """(n+1)/n times the sample maximum: exactly unbiased for theta."""
    return float((len(y) + 1) / len(y) * np.max(y))

def naive_uniform_information(theta):
    """E[s^2] computed mechanically for Uniform(0, theta): 1 / theta^2."""
    return 1.0 / theta**2

_THETA0 = 2.0
print(f"{'n':>6s} {'variance':>12s} {'naive floor':>12s} {'ratio':>8s} "
      f"{'theta^2/(n(n+2))':>18s}")
for _n in (10, 50, 200):
    _, _rep = study(uniform_sampler(_THETA0), unbiased_max, _THETA0,
                    naive_uniform_information(_THETA0), _n, 4000, 33)
    _exact = _THETA0**2 / (_n * (_n + 2))
    print(f"{_n:6d} {_rep[1]:12.6f} {_rep[2]:12.6f} {_rep[3]:8.4f} {_exact:18.6f}")
    # The estimator is unbiased, and its variance is below the "floor" by a
    # factor that GROWS with n. No honest bound behaves like that.
    assert abs(_rep[0] - _THETA0) < 0.02
    assert abs(_rep[1] / _exact - 1) < 0.15
    assert _rep[3] < 1.3 / (_n + 2)

# %% [markdown]
# ### Written answer: name the hypothesis that failed
#
# The harness reports an unbiased estimator whose variance is
# $\theta^2/(n(n+2))$ against a "floor" of $\theta^2/n$ — beaten by a factor
# of $n+2$, which is twelve at $n = 10$ and two hundred at $n = 200$. In
# 3–6 sentences in the cell below: state which hypothesis of the
# Cramér–Rao theorem this family violates, say precisely where in the
# derivation the violation bites (the first identity that stops holding,
# and why), and say what that implies about the number $\theta^2/n$ — is it
# a floor the estimator cheated, or not a floor at all? Name the
# mechanism, not the slogan.

# %%
distill.submit_review(
    "irregular-family",
    "The violated hypothesis is the regularity condition that the support "
    "of the density not depend on the parameter: Uniform(0, theta) is "
    "supported on [0, theta], so the region where the density is positive "
    "moves with theta. Because of that, differentiating the identity "
    "integral p(y | theta) dy = 1 under the integral sign is not licensed - "
    "the Leibniz rule adds a boundary term from the moving endpoint - and "
    "the first casualty is the zero-mean identity for the score: here "
    "s(y; theta) = -1/theta identically, so E[s] = -1/theta, not 0. Every "
    "later step is built on that identity. The covariance identity "
    "Cov(W, l') = tau'(theta) fails, so the Cauchy-Schwarz step has nothing "
    "to bound, and theta^2/n is therefore not a floor that the rescaled "
    "maximum cheated: it is the output of a formula whose hypotheses were "
    "never met, and it bounds nothing at all. The estimator is genuinely "
    "unbiased, so no exception about biased estimators is being used here; "
    "the theorem simply does not apply to this family.",
)

# %% [markdown]
# ## 9. Open task: standard errors for the claims model
#
# The instrument is built; this section points it at a fitted model. The
# data is `data/claims.csv`: a seeded random subsample of **8,000
# policies** from [freMTPL2freq](https://www.openml.org/d/41214), the French
# motor third-party-liability portfolio of the insurance-claims lesson
# (OpenML dataset 41214, from the CASdatasets collection of Dutang and
# Charpentier; freely redistributable). Each row carries the policy's claim
# count, its exposure in years, and six features: driver age, vehicle age,
# the bonus-malus score, the log population density of the driver's
# commune, the area code, and a one-hot for vehicle brand B13. The five
# continuous columns arrive already standardized, so the design matrix is
# fixed and nothing about the fit is left to taste.
#
# Two properties of this design are worth knowing before you compute
# anything with it. **Area is a coarse binning of Density** in the source
# data, and both are kept: the two columns correlate at 0.97, so this
# information matrix is emphatically not diagonal. And **brand B13 is
# rare** — 144 of the 8,000 policies, filing 8 claims between them.
#
# The model is the Poisson GLM of the insurance-claims lesson, exposure in
# the log link as an offset:
#
# $$y_i \sim \mathrm{Poisson}(\mu_i), \qquad \mu_i = t_i \, e^{\,x_i^\top w}.$$
#
# The fit ships complete, below — it is the IRLS loop the GLM lesson
# derived, and coding that loop is what the logistic-regression lab exists
# for. This lab's subject is the information, not the ascent, so what ships
# with no answer is the uncertainty.

# %%
# Infrastructure (do not modify): the data, the fit, and a bootstrap.
COEF_NAMES = ["intercept", "driv_age", "veh_age", "bonus_malus",
              "log_density", "area", "brand_b13"]

_claims = np.loadtxt("data/claims.csv", delimiter=",", skiprows=1)
claim_nb, exposure = _claims[:, 0], _claims[:, 1]
X = np.column_stack([np.ones(len(_claims)), _claims[:, 2:]])
print(f"{len(_claims):,} policies, {claim_nb.sum():.0f} claims, "
      f"{exposure.sum():.0f} policy-years, {(claim_nb == 0).mean():.1%} silent; "
      f"design {X.shape}")

def fit_poisson_glm(X, y, exposure, w0=None, iters=50, tol=1e-12):
    """Poisson GLM with a log link and a log-exposure offset, by IRLS.

    The GLM lesson's loop verbatim: form the working response
    z = eta + (y - mu)/mu, solve the weighted least-squares problem with
    weights mu, repeat. Returns the fitted (d,) coefficient vector.
    """
    w = np.zeros(X.shape[1]) if w0 is None else np.array(w0, dtype=float)
    if w0 is None:
        w[0] = np.log(y.sum() / exposure.sum())
    for _ in range(iters):
        mu = exposure * np.exp(X @ w)
        z = X @ w + (y - mu) / mu
        root = np.sqrt(mu)
        nxt = np.linalg.lstsq(root[:, None] * X, root * z, rcond=None)[0]
        if np.max(np.abs(nxt - w)) < tol:
            return nxt
        w = nxt
    return w

W_HAT = fit_poisson_glm(X, claim_nb, exposure)
print("fitted coefficients:",
      {n: float(round(v, 4)) for n, v in zip(COEF_NAMES, W_HAT)})

def bootstrap_coefs(X, y, exposure, rare, reps, seed):
    """Refit the GLM on `reps` resamples of the rows, warm-started at W_HAT.

    An independent way to price the same uncertainty: no derivative, no
    curvature, no asymptotics — just the estimator run again on data
    resampled from itself, as the resampling lesson's bootstrap prescribes.

    Returns (coefs, silent): the (reps, d) refits, and a (reps,) boolean
    marking the resamples in which the `rare` cell drew no claim at all.
    """
    rng = np.random.default_rng(seed)
    n = len(y)
    out = np.empty((reps, X.shape[1]))
    silent = np.empty(reps, dtype=bool)
    for b in range(reps):
        idx = rng.integers(0, n, n)
        out[b] = fit_poisson_glm(X[idx], y[idx], exposure[idx], w0=W_HAT)
        silent[b] = y[idx][rare[idx]].sum() == 0
    return out, silent

_rare = X[:, 6] == 1.0
BOOT, BOOT_SILENT = bootstrap_coefs(X, claim_nb, exposure, _rare, 2000, 4)
BOOT_SE = BOOT.std(axis=0, ddof=1)
print(f"brand B13: {int(_rare.sum())} policies, {claim_nb[_rare].sum():.0f} claims — "
      f"and in {BOOT_SILENT.sum()} of {len(BOOT)} resamples it drew none at all, "
      f"where its coefficient has no maximum to converge to")

# %% [markdown]
# ### The task
#
# Compute a standard error for every coefficient of `W_HAT` from the
# **observed information of this fitted model**, form 95% Wald intervals
# $\hat w_j \pm 1.96\,\mathrm{se}_j$, and put the seven standard errors in
# `coef_se`, in `COEF_NAMES` order, with `lo` and `hi` holding the interval
# ends.
#
# Section 4 did this in one dimension: differentiate the log-likelihood
# twice, negate, and a standard error is the reciprocal square root of what
# comes out. Here $w$ has seven coordinates, so the second derivative is a
# $7 \times 7$ matrix and "reciprocal square root" is a statement about that
# matrix rather than about seven separate numbers. The log-likelihood is the
# Poisson one with $\mu_i = t_i e^{x_i^\top w}$, and the GLM lesson already
# differentiated it once for you: $\nabla_w \ell = \sum_i (y_i - \mu_i)x_i$.
# Differentiate that.
#
# Non-goals, stated explicitly. Do **not** submit `BOOT_SE`: the bootstrap
# is here as an independent referee, and the checkpoint grades the
# information computation — the two answers disagree on this data, which is
# the finding, not a discrepancy to paper over. Do not refit anything; `W_HAT`
# is a known optimum and every quantity you need is evaluated there.
#
# The score is the RMSE of your seven standard errors against the
# reference's, and the bar is 0.03 — roughly a tenth of the largest
# standard error in the model, so an answer that gets the matrix algebra
# right clears it by construction and one that inverts nothing, weights
# nothing, or reads the diagonal in the wrong order does not. This
# checkpoint is optional and attempts are limited per day; run the
# diagnostics below before spending one.

# %%
# Your work goes here. Leave three names behind for the cells below:
# coef_se (7,), and lo / hi holding the ends of the 95% Wald intervals.
# BEGIN SOLUTION
mu_hat = exposure * np.exp(X @ W_HAT)
J = X.T @ (X * mu_hat[:, None])
coef_se = np.sqrt(np.diag(np.linalg.inv(J)))
lo, hi = W_HAT - 1.96 * coef_se, W_HAT + 1.96 * coef_se
# END SOLUTION

# %%
distill.submit_predictions("claims-standard-errors", coef_se)

# %%
# Infrastructure (do not modify): the two prices of the same uncertainty,
# and what fraction of the bootstrap's replicates each Wald interval holds.
def plot_intervals(names, w, lo, hi, boot):
    """Wald intervals from the information against bootstrap percentiles."""
    pos = np.arange(len(names))
    b_lo, b_hi = np.percentile(boot, [2.5, 97.5], axis=0)
    plt.errorbar(w, pos - 0.12, xerr=[w - lo, hi - w], fmt="o", ms=3,
                 capsize=3, color="tab:blue", label="Wald, from the information")
    plt.errorbar(np.median(boot, axis=0), pos + 0.12,
                 xerr=[np.median(boot, axis=0) - b_lo, b_hi - np.median(boot, axis=0)],
                 fmt="s", ms=3, capsize=3, color="tab:orange",
                 label="bootstrap 2.5-97.5%")
    plt.axvline(0.0, color="k", lw=0.5)
    plt.yticks(pos, names, fontsize=8)
    plt.gca().invert_yaxis()
    plt.xlabel("coefficient (log rate ratio per standardized unit)")
    plt.title("Two prices for the same uncertainty")
    plt.legend(fontsize=8)
    plt.show()

print(f"{'coefficient':14s} {'info se':>8s} {'Wald 95%':>18s} "
      f"{'bootstrap 2.5-97.5%':>21s} {'Wald covers':>12s}")
for _j, _name in enumerate(COEF_NAMES):
    _blo, _bhi = np.percentile(BOOT[:, _j], [2.5, 97.5])
    _cover = np.mean((BOOT[:, _j] >= lo[_j]) & (BOOT[:, _j] <= hi[_j]))
    print(f"{_name:14s} {coef_se[_j]:8.4f} {f'[{lo[_j]:+.3f}, {hi[_j]:+.3f}]':>18s} "
          f"{f'[{_blo:+.3f}, {_bhi:+.3f}]':>21s} {_cover:12.1%}")
plot_intervals(COEF_NAMES, W_HAT, lo, hi, BOOT)
assert np.all(coef_se > 0), "an information-based standard error is positive"
assert lo[3] > 0, "bonus-malus raises the claim rate, interval clear of zero"

# %% [markdown]
# Six of the seven rows agree: the information-based standard error and the
# bootstrap's land within a few percent of each other, and the Wald
# interval holds about 95% of the bootstrap replicates — which is what
# asymptotic normality asserts and what section 7 measured on synthetic
# data. The collinear pair is instructive rather than broken: `log_density`
# and `area` both carry standard errors four times the others', because two
# columns correlating at 0.97 split one column's worth of information
# between them, and both methods agree about that inflation. Inverting the
# information matrix is what accounts for it; the reciprocal square roots
# of its diagonal entries would have reported those two coefficients as
# four times better determined than they are.
#
# The seventh row is the one to keep. `brand_b13` is fitted on 144 policies
# carrying 8 claims between them, and there the two methods part company:
# the Wald interval holds under 90% of the bootstrap distribution rather
# than 95%, and the bootstrap's own interval is lopsided, reaching about
# twice as far below the estimate as above it. The asymmetry is the
# log-likelihood's own: a rare cell's log-rate is far better determined
# from above than from below, because a handful of claims can be explained
# by a much lower rate but not by a much higher one. The extreme case is
# printed above — in a resample where those 144 policies file no claim at
# all, the likelihood for that coefficient increases all the way to
# $-\infty$ and has no maximum, which is the perfect separation of the GLM
# lesson happening inside a bootstrap loop.
#
# Nothing was computed wrongly, and the information-based number is not a
# worse computation of the same thing. It is the width of a *quadratic
# approximation* to the log-likelihood at its peak, so it is a good width
# exactly when the log-likelihood is nearly quadratic there — the same
# large-sample condition section 7 measured, with eight claims standing in
# for $n$. This is the module's fine print arriving one last time in
# production: information-based standard errors are asymptotic claims, and
# the sample size that makes them true belongs to the *cell*, not to the
# file. Eight thousand policies is not a large sample for a coefficient
# that 144 of them inform.

# %% [markdown]
# If stuck, open the hints in order — each is more specific than the last.
#
# <details><summary>Hint 1 — strategy</summary>
#
# Three lines and no loop. Compute the fitted means `mu` at `W_HAT`,
# remembering the exposure offset; assemble the $7\times 7$ matrix of
# second derivatives of the negative log-likelihood; take the standard
# errors from it. Everything is evaluated at `W_HAT` — nothing is refitted,
# nothing is iterated.
# </details>
#
# <details><summary>Hint 2 — the two order-of-operations traps</summary>
#
# The GLM lesson wrote the Hessian of a canonical GLM as $-X^\top W X$ with
# $W = \operatorname{diag}(A''(\eta_i))$, and for the Poisson $A'' = \mu$:
# the weight on row $i$ is that policy's own fitted mean, exposure
# included. Then: the covariance of $\hat w$ is the **inverse** of
# $X^\top W X$, so invert first and read the diagonal second. Reading the
# diagonal first and inverting the entries is the same number only when the
# columns are orthogonal, and two of these columns correlate at 0.97.
# </details>
#
# <details><summary>Hint 3 — reading a failure</summary>
#
# All seven standard errors three to five times too small, the largest of
# them under 0.09: the weights are missing — you built $X^\top X$, which
# knows nothing about which policies carry information. The `log_density`
# and `area` standard errors near 0.05 while the others look right: you
# inverted the diagonal instead of the matrix, and only the collinear pair
# notices. Everything uniformly about 28% too small: `mu` was computed
# without the exposure factor $t_i$.
# </details>

# %% [markdown]
# ## What exists now
#
# Four hours ago the module's central claim was a theorem with a proof.
# What exists now is an instrument that measures it: a log-likelihood and a
# score that work for any family handed to them as a record, the two
# informations — expected, from the moment factory, and observed, from the
# sample's own curvature — a Newton solver driven by both, and a replicate
# harness that turns "variance across repeated samples" from a phrase into
# a number with a floor beside it. It has already returned five verdicts:
# two estimators on their floors, one legitimately above, one legitimately
# below with the bias printed next to it, and one family where the floor is
# not a floor at all.
#
# The last section is where the habit generalizes. A standard error is an
# information computation, the same computation in seven dimensions as in
# one, and it is exactly as good as the quadratic approximation underneath
# it — which is a statement about how much data informs each coefficient,
# not about how many rows the file has. Module 10 replaces this interval
# twice over, first with a posterior and then with a distribution-free
# conformal interval, and both are answers to the question this lab makes
# concrete. The measure-across-replicates habit returns as protocol in the
# validation lab: there the replicates are folds and the quantity is
# prediction error, but the discipline — never trust a spread you have not
# generated — is the one built here.

# %%
distill.dump()
