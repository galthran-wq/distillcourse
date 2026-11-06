# %% [markdown]
# # Lab: a stream-learning toolkit — change detectors and an adaptive classifier
#
# Three lessons gave you four change detectors, the measures that judge them,
# a score that moves with the stream and rules for forgetting, and quoted
# their results. Here you write them and make the numbers your own.
#
# A detector is judged on a stream whose change point is known, so you start
# by generating one. Then come the detectors, each as a small class with one
# method, `update(x)`, returning whether it alarms on this item, so that any
# of them can later be put on a model's error stream: Page–Hinkley, DDM, the
# reference-and-sliding test, ADWIN. A scorecard runs each over many seeded
# streams and reports false alarms and delays. A prequential scorer follows a
# model's accuracy and Kappa as they move. A streaming naive Bayes takes the
# alarm and resets. The last part leaves bits behind: 60 days of payments in
# which the fraud changes twice.
#
# The functions, in order, each later part using the earlier ones:
# `drift_bit_stream`, `PageHinkley`, `DDM`, `TwoWindowTest`, `adwin_splits`
# with `adwin_cut`, `Adwin`, `detector_scorecard`, `prequential_scores`,
# `welford_update` with `StreamingNaiveBayes` and `run_adaptive`.
#
# Ground rules:
#
# - Numpy only inside the graded functions. Comparing with `river` on your own
#   machine is fine.
# - The notation is the course's: $v$ the allowance, $h$ the threshold, $\alpha$
#   ADWIN's confidence, $W$ a window length, $\phi$ a fading factor, $\delta$ the
#   label delay. Libraries call the first and third of these `delta`.
# - Positions are 0-based: an alarm at position `i` is raised by the update
#   that read `x[i]`.
# - The stream generators, the data loader, `trace`, `run_detector`, the CUSUM
#   class and every plotting helper ship complete. They are infrastructure:
#   read them, do not edit them.
# - The exact checkpoints are the required set. The written answer and the open
#   task at the end are optional.

# %%
from collections import deque

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score

import distill

distill.open_lab("fraud-ml/drift-detector-lab")

# %%
# Infrastructure (do not modify): running a detector over a stream, and the plots.
def run_detector(detector, x):
    """Feed x to detector.update item by item. Returns the alarm positions, (k,) int."""
    return np.array([i for i, value in enumerate(x) if detector.update(float(value))], dtype=np.int64)


def trace(detector, x, attrs):
    """Like run_detector, also recording the named attributes after each update.

    Returns (alarms, a_1, ..., a_m), the a_j being (len(x),) float arrays. An
    attribute read on an alarm's step shows the state after the restart.
    """
    alarms, rows = [], []
    for i, value in enumerate(x):
        if detector.update(float(value)):
            alarms.append(i)
        rows.append([float(getattr(detector, a)) for a in attrs])
    rows = np.array(rows, dtype=float).reshape(len(rows), len(attrs))
    return (np.array(alarms, dtype=np.int64), *rows.T)


def plot_alarms(x, rows, changes=(), title=""):
    """The stream above one row of ticks per detector. rows: {name: alarm positions}."""
    fig, (top, low) = plt.subplots(2, 1, figsize=(8, 2.2 + 0.35 * len(rows)), sharex=True,
                                   height_ratios=[3, max(len(rows), 1)])
    top.plot(x, ".", ms=1, color="0.5")
    top.set_ylabel("value"); top.set_title(title, fontsize=9)
    for ax in (top, low):
        for c in changes:
            ax.axvline(c, color="C3", lw=0.8, ls="--")
    for r, (name, alarms) in enumerate(rows.items()):
        low.plot(alarms, np.full(len(alarms), r), "|", ms=10, color="C0")
    low.set_yticks(range(len(rows)), list(rows), fontsize=8); low.set_xlabel("position")
    low.set_ylim(-0.7, len(rows) - 0.3)
    plt.tight_layout(); plt.show()


def plot_tradeoff(cards):
    """Delay against false alarms, one line per detector. cards: {name: [(mtfa, mtd, label), ...]}."""
    fig, ax = plt.subplots(figsize=(6, 4))
    for name, points in cards.items():
        a, b = [p[0] for p in points], [p[1] for p in points]
        ax.plot(a, b, "o-", ms=4, label=name)
        for p in points:
            ax.annotate(p[2], (p[0], p[1]), fontsize=7, xytext=(3, 3), textcoords="offset points")
    ax.set_xscale("log"); ax.set_yscale("log")
    ax.set_xlabel("MTFA, stable items per false alarm (a lower bound where none rang)")
    ax.set_ylabel("MTD, items after the change")
    ax.legend(fontsize=8); plt.tight_layout(); plt.show()


def plot_scores(curves, changes=(), ylabel="accuracy", title=""):
    """Curves against position, with the planted changes shaded. changes: [(start, end), ...]."""
    fig, ax = plt.subplots(figsize=(8, 3))
    for name, c in curves.items():
        ax.plot(c, lw=1, label=name)
    for a, b in changes:
        ax.axvspan(a, b, color="C3", alpha=0.15, lw=0)
    ax.set_xlabel("position"); ax.set_ylabel(ylabel); ax.set_title(title, fontsize=9)
    ax.legend(fontsize=8); plt.tight_layout(); plt.show()

# %% [markdown]
# ## 1. A stream whose change is known
#
# MTFA needs a stretch where nothing changes, and MTD needs a true change
# position: on a real error stream neither is known, so you plant them. A
# stream of bits draws each item from one of two concepts: concept A gives a
# 1 with probability $p_a$, concept B with probability $p_b$. Which concept
# supplies item $t$ is itself random, and the chance that it is B rises along
# a sigmoid centred at `position`, with a width $w$:
#
# $$\mathrm{mix}_t = \frac{1}{1 + e^{-4 (t - \text{position}) / w}}.$$
#
# The slope at the centre is $1/w$, so the transition takes about $w$ items.
# At $w = 1$ it is over in about three items, and that is how a change gets
# called abrupt here.
#
# The bits must be reproducible by the checker, so the order of the draws is
# part of the contract: one generator, `n` uniforms that choose the concept
# (B when the uniform is below $\mathrm{mix}_t$), then `n` uniforms that
# choose the bit (1 when the uniform is below the chosen concept's
# probability).

# %%
def drift_bit_stream(n, p_a, p_b, position, width, seed):
    """Bits whose probability of a 1 moves from p_a to p_b along a sigmoid.

    Args:
        n: stream length.
        p_a, p_b: probability of a 1 under concepts A and B.
        position: the sigmoid's centre, a position in the stream.
        width: w in the formula above, at least 1.
        seed: for np.random.default_rng.
    Returns:
        (bits, mix): bits is (n,) int in {0, 1}; mix is (n,) float, the
        probability that each item comes from concept B.
    """
    # BEGIN SOLUTION
    rng = np.random.default_rng(seed)
    t = np.arange(n)
    mix = 1.0 / (1.0 + np.exp(np.clip(-4.0 * (t - position) / width, -500, 500)))
    from_b = rng.random(n) < mix
    bits = (rng.random(n) < np.where(from_b, p_b, p_a)).astype(np.int64)
    return bits, mix
    # END SOLUTION

# %%
_bits, _mix = drift_bit_stream(4000, 0.05, 0.5, 2000, 1, seed=1)
assert _mix[1997] < 0.001 and _mix[2000] == 0.5 and _mix[2003] > 0.999   # abrupt
assert abs(_bits[:2000].mean() - 0.05) < 0.02 and abs(_bits[2000:].mean() - 0.5) < 0.04
_bits, _mix = drift_bit_stream(4000, 0.05, 0.5, 2000, 1000, seed=1)
assert abs(_mix[2000] - 0.5) < 1e-12 and 0.11 < _mix[1500] < 0.13        # w/2 before the centre

# %%
distill.check("drift-bit-stream", drift_bit_stream)

# %% [markdown]
# ## 2. Page–Hinkley
#
# The first detector does not need to be guessed at: its sibling is written
# below, complete. CUSUM knows the stream's $\mu$ and $\sigma$ in advance and
# keeps one number, $g_t = \max(0, g_{t-1} + z_t - v)$, with $z_t$ the
# standardised item. A class with `update` holds it, and the alarm clears the
# sum.

# %%
class Cusum:
    """One-sided CUSUM with a known level. Nothing to change here."""

    def __init__(self, mu, sigma, v, h):
        self.mu, self.sigma, self.v, self.h = mu, sigma, v, h
        self.g = 0.0

    def update(self, x):
        """Read one item; True when it alarms."""
        self.g = max(0.0, self.g + (x - self.mu) / self.sigma - self.v)
        if self.g > self.h:
            self.g = 0.0
            return True
        return False


_x = np.r_[np.zeros(200), np.ones(50)]
assert run_detector(Cusum(0.0, 1.0, 0.5, 4.0), _x).tolist() == [208, 217, 226, 235, 244]

# %% [markdown]
# A model's error has no such constants, so Page–Hinkley uses the stream's own
# running mean: $\bar x_t$ is the mean of the items since the last restart,
# **including $x_t$**, and the statistic is
#
# $$PH_t = \max\bigl(0,\ PH_{t-1} + x_t - \bar x_t - v\bigr),$$
#
# in the units of $x$, so no division by $\sigma$. It alarms when $PH_t > h$,
# and then **everything** restarts, the mean as well: the level before the
# change is no longer the level.
#
# The running mean is a few noisy values at first and again after each restart,
# so the alarm is held while the number of items since the restart is below
# `warm_up`. The sums keep running during that time.
#
# As in the lesson's exercise, the test should also be able to watch both ways.
# A fall is the same test on $-x_t$, so a second statistic
# $PH^-_t = \max(0, PH^-_{t-1} + \bar x_t - x_t - v)$ runs beside the first, and
# with `two_sided=True` either one crossing $h$ alarms.

# %%
class PageHinkley:
    """The Page-Hinkley test.

    Args:
        v: allowance, in the units of x.
        h: threshold, in the units of x.
        warm_up: no alarm while fewer than this many items were read since
            the last restart.
        two_sided: alarm on a fall as well as on a rise.
    Attributes:
        up, down: PH_t and PH^-_t. Both are 0.0 at the start and after a restart.
    """

    def __init__(self, v, h, warm_up=30, two_sided=False):
        # BEGIN SOLUTION
        self.v, self.h, self.warm_up, self.two_sided = v, h, warm_up, two_sided
        self.reset()
        # END SOLUTION

    def reset(self):
        """Restart everything, as after an alarm."""
        # BEGIN SOLUTION
        self.n, self.mean, self.up, self.down = 0, 0.0, 0.0, 0.0
        # END SOLUTION

    def update(self, x):
        """Read one item (a float); returns True when it alarms, having restarted."""
        # BEGIN SOLUTION
        self.n += 1
        self.mean += (x - self.mean) / self.n
        self.up = max(0.0, self.up + x - self.mean - self.v)
        self.down = max(0.0, self.down + self.mean - x - self.v)
        crossed = self.up > self.h or (self.two_sided and self.down > self.h)
        if self.n >= self.warm_up and crossed:
            self.reset()
            return True
        return False
        # END SOLUTION

# %% [markdown]
# Before the server, a fixture from a published notebook: 3,000 values,
# uniform on $[0, 0.3]$ for 750 steps and on $[0, 0.4]$ for 250, then on
# $[0.4, 0.5]$ for 1,000 and on $[0.7, 1]$ for 1,000, made with one line of
# seeded numpy. This is the three-segment stream of the change-detectors
# lesson. At $v = 0.005$, $h = 50$ your test
# alarms at 1,154 and 2,135, the lesson's row for Page–Hinkley at $h = 50$, which
# is what this class is. The row beside it, `river`'s version, reads 1,156 and
# 2,136 because that library fades the sum, multiplying it by 0.9999 at each step;
# its mean is plain, and with `alpha=1` it gives 1,154 and 2,135 too. At
# $h = 10$ the alarms move to 1,005 and 2,026: only a threshold changed.

# %%
# Infrastructure (do not modify): the three-segment fixture.
def uniform3():
    np.random.seed(42)
    a = np.concatenate((np.random.uniform(0, 0.3, 750), np.random.uniform(0, 0.4, 250)))
    return np.concatenate((a, np.random.uniform(0.4, 0.5, 1000), np.random.uniform(0.7, 1, 1000)))


U3 = uniform3()
print("Page-Hinkley, h = 50:", run_detector(PageHinkley(0.005, 50), U3))
print("Page-Hinkley, h = 10:", run_detector(PageHinkley(0.005, 10), U3))
print("the fall, two-sided on the stream reversed:", run_detector(PageHinkley(0.005, 50, two_sided=True), U3[::-1]))
assert run_detector(PageHinkley(0.005, 50), U3).tolist() == [1154, 2135]
assert run_detector(PageHinkley(0.005, 10), U3).tolist() == [1005, 2026]
assert len(run_detector(PageHinkley(0.005, 50), U3[::-1])) == 0   # a one-sided test misses a fall
assert run_detector(PageHinkley(0.005, 50, two_sided=True), U3[::-1]).tolist() == [1133, 2218]
assert run_detector(PageHinkley(0.005, 50, two_sided=True), U3).tolist() == [1154, 2135]   # a rise still rings
# The sum is back over h 11 items after the first alarm; the second alarm still waits out the warm-up.
_x = np.r_[np.zeros(50), np.ones(12), np.full(40, 3.0)]
assert run_detector(PageHinkley(0.01, 2.0), _x).tolist() == [52, 82]

# %%
# What the checker calls: your class on one stream, one-sided and two-sided.
def page_hinkley_traces(x, v, h, warm_up):
    alarms_1, up_1 = trace(PageHinkley(v, h, warm_up), x, ["up"])
    alarms_2, up_2, down_2 = trace(PageHinkley(v, h, warm_up, two_sided=True), x, ["up", "down"])
    return alarms_1, up_1, alarms_2, up_2, down_2


distill.check("page-hinkley", page_hinkley_traces)

# %% [markdown]
# ## 3. DDM
#
# On a stream of 0s and 1s the noise needs no estimate. With $t$ counting items
# **since the last reset** and $p_t$ the mean of those items, the number of
# errors is binomial, so
#
# $$s_t = \sqrt{\frac{p_t (1 - p_t)}{t}}.$$
#
# Keep two registers $p_{\min}, s_{\min}$, the best the rate has been. In the
# order of the steps of one update, once $t \ge$ `warm_up`:
#
# 1. if $p_t + s_t < p_{\min} + s_{\min}$, overwrite the registers with
#    $p_t, s_t$ (they start at infinity after a reset, so the first test always
#    overwrites them);
# 2. the warning state is on exactly while $p_t + s_t \ge p_{\min} + 2 s_{\min}$;
# 3. if $p_t + s_t \ge p_{\min} + 3 s_{\min}$, drift: reset everything and
#    return True.
#
# Below the warm-up the registers are not touched, the warning is off and there
# is no alarm. The running $p_t$ and $s_t$ still advance.
#
# The boundary from the lesson is still here: a stream with no error in its
# first `warm_up` items has $p = s = 0$, sets the registers to 0, and the test
# as written declares drift at once. Keep it as written. It is why the warm-up
# is a real parameter at a low error rate.

# %%
class DDM:
    """The drift detection method on a stream of 0s and 1s.

    Args:
        warm_up: items read since the last reset before the registers and the
            two tests start.
    Attributes:
        p, s: the current p_t and s_t, 0.0 at the start and after a reset.
        warning: True while in the warning state, False after a reset.
    """

    def __init__(self, warm_up=30):
        # BEGIN SOLUTION
        self.warm_up = warm_up
        self.reset()
        # END SOLUTION

    def reset(self):
        """Restart everything, as after a drift."""
        # BEGIN SOLUTION
        self.t, self.p, self.s = 0, 0.0, 0.0
        self.p_min, self.s_min = np.inf, np.inf
        self.warning = False
        # END SOLUTION

    def update(self, x):
        """Read one item (0 or 1); returns True on drift, having reset."""
        # BEGIN SOLUTION
        self.t += 1
        self.p += (x - self.p) / self.t
        self.s = np.sqrt(self.p * (1 - self.p) / self.t)
        if self.t < self.warm_up:
            return False
        level = self.p + self.s
        if level < self.p_min + self.s_min:
            self.p_min, self.s_min = self.p, self.s
        self.warning = level >= self.p_min + 2 * self.s_min
        if level >= self.p_min + 3 * self.s_min:
            self.reset()
            return True
        return False
        # END SOLUTION

# %%
_x = np.r_[np.tile([0.0] * 9 + [1.0], 100), np.ones(100)]
_alarms, _p, _s, _w = trace(DDM(warm_up=50), _x, ["p", "s", "warning"])
assert abs(_p[999] - 0.1) < 1e-12 and abs(_s[999] - np.sqrt(0.09 / 1000)) < 1e-12
assert _alarms[0] > 1000 and _w[_alarms[0] - 1] == 1   # the warning comes before the drift
print("DDM on the three-segment values, read as if they were error rates:", run_detector(DDM(), U3))

# %%
# What the checker calls: your class, traced.
def ddm_traces(x, warm_up):
    return trace(DDM(warm_up), x, ["p", "s", "warning"])


distill.check("ddm-bands", ddm_traces)

# %% [markdown]
# ## 4. The reference window against the sliding window
#
# DDM is slow because its $p_t$ averages everything since the last reset. The
# repair compares two finite stretches: a fixed reference window of $n_0$ items
# and a sliding window of the latest $n_1$. Under no change the difference of
# means is about normal, so at a two-sided $z$ (1.96 for 5%) the test alarms when
#
# $$|\hat\mu_0 - \hat\mu_1| > z \sqrt{\frac{\sigma_0^2}{n_0} + \frac{\sigma_1^2}{n_1}},$$
#
# with $\sigma^2$ each window's own variance, $\frac{1}{n}\sum (x - \hat\mu)^2$.
# The windows do not overlap.
#
# The contract:
#
# - the first $n_0$ items fill the reference. It then stays fixed;
# - the following items fill the sliding window. The test runs on the update
#   that makes it hold $n_1$ items and on every update after that;
# - on an alarm the sliding window's items **become the reference**, whose size
#   is therefore now $n_1$, and the sliding window starts empty. An $n_0$ that
#   differs from $n_1$ is used only once.
#
# Keep running sums, or the test costs a pass over the windows on every item:
# the scorecard below calls it millions of times. Do not call `scipy.stats`.

# %%
class TwoWindowTest:
    """Reference window against sliding window, normal test.

    Args:
        n0, n1: sizes of the first reference and of the sliding window.
        z: the normal quantile of the test.
    """

    def __init__(self, n0, n1, z=1.96):
        # BEGIN SOLUTION
        self.n0, self.n1, self.z = n0, n1, z
        self.ref, self.ref_sum, self.ref_sq = [], 0.0, 0.0
        self.win, self.win_sum, self.win_sq = deque(), 0.0, 0.0
        # END SOLUTION

    def update(self, x):
        """Read one item (a float); returns True when it alarms."""
        # BEGIN SOLUTION
        if len(self.ref) < self.n0:
            self.ref.append(x)
            self.ref_sum += x
            self.ref_sq += x * x
            return False
        self.win.append(x)
        self.win_sum += x
        self.win_sq += x * x
        if len(self.win) > self.n1:
            old = self.win.popleft()
            self.win_sum -= old
            self.win_sq -= old * old
        if len(self.win) < self.n1:
            return False
        n0, n1 = len(self.ref), self.n1
        mean0, mean1 = self.ref_sum / n0, self.win_sum / n1
        var0 = max(self.ref_sq / n0 - mean0 * mean0, 0.0)
        var1 = max(self.win_sq / n1 - mean1 * mean1, 0.0)
        if abs(mean0 - mean1) > self.z * np.sqrt(var0 / n0 + var1 / n1):
            self.ref, self.ref_sum, self.ref_sq = list(self.win), self.win_sum, self.win_sq
            self.n0 = n1
            self.win, self.win_sum, self.win_sq = deque(), 0.0, 0.0
            return True
        return False
        # END SOLUTION

# %%
_x = np.r_[np.zeros(50), np.ones(50), np.ones(50), np.zeros(50)]
assert run_detector(TwoWindowTest(20, 10), _x).tolist() == [52, 62, 152, 162]
print("two windows of 250 on the three-segment stream:", run_detector(TwoWindowTest(250, 250), U3))

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# `update` has three phases, and only one of them tests: the reference is filling,
# the sliding window is filling, the window is full. For each stretch hold its size,
# its sum and its sum of squares; a mean and a variance come straight from those, as
# $\frac{1}{n}\sum x^2 - \hat\mu^2$. An item entering the window is added to both
# sums, and the item it pushes out is subtracted from both. The handover then moves
# the numbers across rather than recomputing them.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# if the reference holds fewer items than its size:
#     add x to it; return False
# add x to the window; if it holds more than n1, take the oldest out of the sums
# if it holds fewer than n1: return False
# compute both means and variances from the sums
# if the test passes:
#     reference = the window, with its sums; the reference's size is now n1
#     window = empty
#     return True
# return False
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# A `deque` gives the oldest item in constant time, and rounding can leave a sum of
# squares a hair under its mean's square:
#
# ```python
# self.win.append(x); self.win_sum += x; self.win_sq += x * x
# if len(self.win) > self.n1:
#     old = self.win.popleft(); self.win_sum -= old; self.win_sq -= old * old
# # later
# var0 = max(self.ref_sq / n0 - mean0 * mean0, 0.0)
# ```
# </details>

# %%
def two_window_alarms(x, n0, n1, z):
    return run_detector(TwoWindowTest(n0, n1, z), x)


distill.check("two-window-test", two_window_alarms)

# %%

# %% [markdown]
# ## 5. ADWIN's cut
#
# The two-window test still asks for sizes, and the right size depends on a rate
# of change nobody knows. ADWIN tries every length instead: for a window $W$ of
# items in $[0, 1]$, every split into an older part $W_0$ and a recent part
# $W_1$, of sizes $n_0$ and $n_1$. So many tests would ring constantly on noise,
# so the threshold pays for them:
#
# $$m = \frac{1}{1/n_0 + 1/n_1}, \qquad
#   \varepsilon_{\text{cut}} = \sqrt{\frac{1}{2m} \ln \frac{4 |W|}{\alpha}},$$
#
# and a split is cut when $|\hat\mu_{W_0} - \hat\mu_{W_1}| \ge \varepsilon_{\text{cut}}$.
# The $4|W|$ is the charge for the splits. Note what $m$ does: when one part is
# tiny $m$ is about that part's size, so a split cannot pass on the strength of
# the large side alone.
#
# `adwin_splits` computes both columns for all $|W| - 1$ splits in one pass:
# with cumulative sums it is $O(|W|)$, and it will be called thousands of times.
#
# `adwin_cut` then drops. While some split is cut, drop the items of $W_0$ of the
# **oldest** cut split, the one with the smallest $n_0$, and test the shorter
# window afresh, with its own $|W|$. Nothing is left to cut when it returns.

# %%
def adwin_splits(window, alpha):
    """The two sides of ADWIN's test at every split of a window.

    Args:
        window: (k,) float array in [0, 1], oldest item first, k >= 2.
        alpha: the confidence.
    Returns:
        (gaps, eps): two (k - 1,) float arrays. Index j is the split whose older
        part holds the first j + 1 items; gaps[j] is the absolute difference of
        the parts' means, eps[j] is the split's cut.
    """
    # BEGIN SOLUTION
    k = len(window)
    n0 = np.arange(1, k, dtype=float)
    n1 = k - n0
    head = np.cumsum(window)[:-1]
    gaps = np.abs(head / n0 - (window.sum() - head) / n1)
    m = 1.0 / (1.0 / n0 + 1.0 / n1)
    return gaps, np.sqrt(np.log(4 * k / alpha) / (2 * m))
    # END SOLUTION


def adwin_cut(window, alpha):
    """The window that remains after ADWIN's cuts.

    Args:
        window: (k,) float array in [0, 1], oldest item first, k >= 1.
        alpha: the confidence.
    Returns:
        (r,) float array, the most recent r items of window, 1 <= r <= k.
    """
    # BEGIN SOLUTION
    window = np.asarray(window, dtype=float)
    while len(window) >= 2:
        gaps, eps = adwin_splits(window, alpha)
        cut = np.flatnonzero(gaps >= eps)
        if len(cut) == 0:
            break
        window = window[cut[0] + 1:]
    return window
    # END SOLUTION

# %%
# The lesson's frozen window: 800 items, 0.05 -> 0.40 at item 600, alpha = 0.002,
# built with the same means as its figure. The split at 300 has a small
# difference because the change is diluted; the split at the change has the largest.
_w = np.r_[np.tile([1.0] + [0.0] * 19, 30), np.tile([1.0, 1.0, 0.0, 0.0, 0.0], 40)]
_g, _e = adwin_splits(_w, 0.002)
assert abs(_e[299] - np.sqrt(np.log(4 * 800 / 0.002) / (2 * (300 * 500 / 800)))) < 1e-12
assert _g[299] < _e[299] and _g[599] > _e[599]
assert np.argmax(_g - _e) > 500
assert 150 <= len(adwin_cut(_w, 0.002)) <= 300
assert len(adwin_cut(np.full(500, 0.2), 0.002)) == 500
print("frozen window: kept", len(adwin_cut(_w, 0.002)), "of", len(_w))

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# In `adwin_splits` everything is an array indexed by the split, so there is no loop:
# the sizes of the two parts, the sum of the older part from one cumulative sum, the
# sum of the recent part as the total minus that. `adwin_cut` is a loop around it, and
# each pass calls it on the window as it now stands, so each pass has its own $|W|$.
# The first index that passes says how many items go.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# adwin_splits:
#     n0 = 1, 2, ..., k - 1;  n1 = k - n0
#     head = cumulative sum of the window, without its last entry
#     gaps = |head / n0 - (total - head) / n1|
#     m = 1 / (1 / n0 + 1 / n1)
#     eps = sqrt(ln(4 k / alpha) / (2 m))
#
# adwin_cut:
#     while the window holds at least 2 items:
#         gaps, eps = adwin_splits(window, alpha)
#         if no gap reaches its eps: stop
#         j = the smallest index where one does
#         window = the items after index j
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# head = np.cumsum(window)[:-1]
# gaps = np.abs(head / n0 - (window.sum() - head) / n1)
# # in the cut
# cut = np.flatnonzero(gaps >= eps)
# window = window[cut[0] + 1:]
# ```
# </details>

# %%
def adwin_check(window, alpha):
    gaps, eps = adwin_splits(window, alpha)
    return gaps, eps, adwin_cut(window, alpha)


distill.check("adwin-cut", adwin_check)

# %% [markdown]
# ## 6. ADWIN on a stream
#
# Each cut is a pass over the window, so the detector does not run one per item.
# It reads items into the window, and on every `check_every`-th item since it
# was created (the count is not affected by alarms) it applies `adwin_cut`. A
# drop is an alarm. Unlike the other detectors it does not restart: what it
# keeps is the part of the window it still trusts, and that part's mean
# estimates the current level. The price of the check interval is that many
# items of delay.

# %%
class Adwin:
    """ADWIN as a detector.

    Args:
        alpha: the confidence.
        check_every: items between two applications of the cut.
    """

    def __init__(self, alpha=0.002, check_every=32):
        # BEGIN SOLUTION
        self.alpha, self.check_every = alpha, check_every
        self.items, self.seen = [], 0
        # END SOLUTION

    @property
    def width(self):
        """The number of items now in the window."""
        # BEGIN SOLUTION
        return len(self.items)
        # END SOLUTION

    def update(self, x):
        """Read one item in [0, 1]; returns True when items were dropped."""
        # BEGIN SOLUTION
        self.items.append(x)
        self.seen += 1
        if self.seen % self.check_every:
            return False
        kept = adwin_cut(np.array(self.items), self.alpha)
        if len(kept) == len(self.items):
            return False
        self.items = kept.tolist()
        return True
        # END SOLUTION

# %%
# The lesson's ADWIN row, 1,023 and 2,047, is the library's cut with the variance
# in it. The Hoeffding cut you wrote knows nothing of the variance and is slower.
print("ADWIN on the three-segment stream:", run_detector(Adwin(), U3))
plot_alarms(U3, {"Page-Hinkley h=50": run_detector(PageHinkley(0.005, 50), U3),
                 "Page-Hinkley h=10": run_detector(PageHinkley(0.005, 10), U3),
                 "DDM": run_detector(DDM(), U3),
                 "two windows, 250": run_detector(TwoWindowTest(250, 250), U3),
                 "ADWIN": run_detector(Adwin(), U3)},
            changes=(1000, 2000), title="one stream, one run: this measures settings")

# %%
def adwin_trace(x, alpha, check_every):
    return trace(Adwin(alpha, check_every), x, ["width"])


distill.check("adwin-stream", adwin_trace)

# %% [markdown]
# ## 7. The scorecard
#
# The plot above is one run of five settings, and it says nothing about false
# alarms. The measures from the lesson need many seeded runs of the same stream,
# on the same streams for every detector.
#
# Let $c$ be the first position the change can touch: `position - width // 2`.
# For $w = 1$ that is `position`. For a gradual change it is the start of the
# window, not its centre, because a detector can only be blamed for delay from
# the moment there is something to detect. Over runs $r = 0, \dots, R - 1$, each
# on the stream from `drift_bit_stream` with seed `seed + r` and a new detector:
#
# - an alarm before $c$ is false. Its count over all runs is `false_alarms`, and
#   $\text{MTFA} = R c / \max(\text{false\_alarms}, 1)$. With no false alarm the
#   number is only a lower bound, which is why `false_alarms` is returned beside
#   it. Alarms after $c$ are not false, whatever else they are.
# - the first alarm in $[c, c + \text{horizon})$ detects the change, with delay
#   (alarm $- c$). MTD is the mean delay over the runs that detected, or `horizon`
#   when none did.
# - a run with no such alarm is missed; MDR is the share of missed runs.
#
# The MTFA estimate is censored unless the stable stretch is long against it: a
# detector with an MTFA of 14,000 needs hundreds of thousands of stable items to
# show more than a handful of alarms. And the first alarm after $c$ can itself
# be a false one that fell there by chance, so MTD and MTFA are only separable
# while the delay is short against the MTFA.

# %%
def detector_scorecard(make_detector, n_runs, n, p_a, p_b, position, width, horizon, seed):
    """MTFA, MTD and MDR of a detector over seeded runs of the bit stream.

    Args:
        make_detector: called with no arguments, returns a new detector with
            an update method.
        n_runs: R, the number of runs.
        n, p_a, p_b, position, width: passed to drift_bit_stream.
        horizon: how many items after c an alarm still counts as a detection.
        seed: run r uses seed + r.
    Returns:
        (4,) float array: mtfa, mtd, mdr, false_alarms.
    """
    # BEGIN SOLUTION
    c = position - width // 2
    false_alarms, delays, missed = 0, [], 0
    for r in range(n_runs):
        bits, _ = drift_bit_stream(n, p_a, p_b, position, width, seed + r)
        alarms = run_detector(make_detector(), bits)
        false_alarms += int((alarms < c).sum())
        hits = alarms[(alarms >= c) & (alarms < c + horizon)]
        if len(hits):
            delays.append(hits[0] - c)
        else:
            missed += 1
    mtfa = n_runs * c / max(false_alarms, 1)
    mtd = float(np.mean(delays)) if delays else float(horizon)
    return np.array([mtfa, mtd, missed / n_runs, false_alarms], dtype=float)
    # END SOLUTION

# %%
class _AlwaysAt:
    """Local test double: alarms at fixed positions, whatever it reads."""

    def __init__(self, positions):
        self.positions, self.i = set(positions), -1

    def update(self, x):
        self.i += 1
        return self.i in self.positions


_c = detector_scorecard(lambda: _AlwaysAt([100, 500, 1010, 1300]), 2, 2000, 0.1, 0.5, 1000, 21, 200, 0)
assert _c.tolist() == [2 * 990 / 4, 20.0, 0.0, 4.0]   # c = 990; 1,300 is after c and not false
_c = detector_scorecard(lambda: _AlwaysAt([]), 3, 2000, 0.1, 0.5, 1000, 1, 200, 0)
assert _c.tolist() == [3000.0, 200.0, 1.0, 0.0]
_c = detector_scorecard(lambda: _AlwaysAt([990]), 2, 2000, 0.1, 0.5, 1000, 21, 200, 0)
assert _c.tolist() == [1980.0, 0.0, 0.0, 0.0]       # an alarm exactly at c is a detection, not a false alarm
_c = detector_scorecard(lambda: _AlwaysAt([1190]), 2, 2000, 0.1, 0.5, 1000, 21, 200, 0)
assert _c.tolist() == [1980.0, 200.0, 1.0, 0.0]     # c + horizon is outside the horizon

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# `run_detector` already returns the alarm positions as an array, so each run is two
# boolean masks on that array and no pass over the stream of your own. Compute $c$ once
# before the loop. Across the runs keep three things: a count of false alarms, a list
# of delays and a count of missed runs. The four numbers come from those after the loop.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# c = position - width // 2
# for r in 0 .. n_runs - 1:
#     bits = drift_bit_stream(..., seed + r), the first element
#     alarms = run_detector(make_detector(), bits)
#     false_alarms += number of alarms before c
#     hits = alarms in [c, c + horizon)
#     if there are hits: append hits[0] - c to delays
#     else: missed += 1
# mtfa = n_runs * c / max(false_alarms, 1)
# mtd = mean of delays, or horizon if there are none
# mdr = missed / n_runs
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# false_alarms += int((alarms < c).sum())
# hits = alarms[(alarms >= c) & (alarms < c + horizon)]
# ```
# </details>

# %%
distill.check("detector-scorecard", detector_scorecard)

# %% [markdown]
# Now the comparison. Stable error 0.05, a change to 0.20 at item 20,000, 8 runs
# each, one setting per dot. Eight runs give only rough numbers: Page–Hinkley at
# $v = 0.015$, $h = 8.5$ prints 70 items and ADWIN at $\alpha = 0.002$ prints 479, and
# the lesson's table has many more runs behind it. This runs a few million updates and
# takes about a minute.

# %%
# Infrastructure (do not modify): the settings and the table.
SETTINGS = {
    "Page-Hinkley": [(lambda h=h: PageHinkley(0.015, h), f"h={h}") for h in (4, 8.5, 16)],
    "DDM": [(lambda w=w: DDM(w), f"warm-up {w}") for w in (30, 1000)],
    "two windows": [(lambda w=w: TwoWindowTest(w, w), f"{w}") for w in (250, 1000)],
    "ADWIN": [(lambda a=a: Adwin(a), f"alpha {a}") for a in (0.002, 0.2)],
}
STREAM = dict(n_runs=8, n=25000, p_a=0.05, p_b=0.20, position=20000, width=1, horizon=5000, seed=100)


def scorecard_table(settings, stream):
    cards = {}
    print(f"{'detector':14s}{'setting':14s}{'MTFA':>9s}{'false':>7s}{'MTD':>8s}{'MDR':>6s}")
    for name, rows in settings.items():
        cards[name] = []
        for make, label in rows:
            mtfa, mtd, mdr, fa = detector_scorecard(make, **stream)
            print(f"{name:14s}{label:14s}{mtfa:9.0f}{int(fa):7d}{mtd:8.0f}{mdr:6.2f}")
            cards[name].append((mtfa, mtd, label))
    return cards


cards = scorecard_table(SETTINGS, STREAM)
plot_tradeoff(cards)

# %% [markdown]
# Two things in the DDM rows are not noise. Its delay is above the lesson's figure
# for a calm of 5,000 because this calm is 20,000: $p_t$ averages all of it, and by
# the lesson's $\sqrt{T}$ law four times the calm costs about twice the delay. The
# warm-up 30 row prints 615 against the lesson's 347, nearly twice. The warm-up 1,000
# row reaches about three times, 663 against 201: these means have a long tail and
# eight runs are few, so read the size of the factor and not its digits.
# And the warm-up 30 row's MTFA of 6,957, which is 160,000 stable items over 23 false
# alarms, is not a rate, because DDM's false alarms do not arrive at a steady one. They
# crowd into the first thousands of items after a start, the shortest within the
# warm-up's boundary, and once $t$ is large the rate can hardly move: a stream gets a
# couple of them however long it runs, and about a third of starts never alarm. So a
# stable stretch of 20,000 sees mostly the crowded part, and a longer one would raise
# this MTFA with no change in the detector. An MTFA is a statement about a stretch of a
# given length, and for this detector the length changes the answer.
#
# A gradual change costs each detector its own amount. The same rise over a
# window of 4,000 items, delay measured from the window's start, one setting of
# each:

# %%
_ramp = {name: [rows[-1]] for name, rows in SETTINGS.items()}
_ramp["Page-Hinkley"] = [SETTINGS["Page-Hinkley"][1]]
_ = scorecard_table(_ramp, dict(STREAM, position=20000, width=4000, n=26000))

# %% [markdown]
# ## 8. A score that moves with the stream
#
# A learner that forgets has to be scored where it is now. For a stream of
# predictions and labels, with $L_t = 1$ when prediction $t$ was right:
#
# - the *landmark* accuracy is the mean of all $L_i$ so far;
# - the *sliding* accuracy is the mean of the last $W$, or of all so far while
#   there are fewer;
# - the *fading* accuracy keeps two numbers, $S_t = L_t + \phi S_{t-1}$ and
#   $N_t = 1 + \phi N_{t-1}$ from $S_0 = N_0 = 0$, and reports $S_t / N_t$.
#
# Accuracy on a fraud stream is mostly the share of genuine payments, so the
# fourth column is Kappa over the same sliding window. Within the window take the
# observed accuracy $p_o$, the share of items flagged $q$ and the share of fraud
# $\pi$; then the chance agreement at the model's own flagging rate and Kappa are
#
# $$p_c = q\pi + (1-q)(1-\pi), \qquad \kappa = \frac{p_o - p_c}{1 - p_c},$$
#
# with $\kappa = 0$ when $p_c = 1$: a window with no fraud and no flag, or all
# fraud and all flags, shows nothing beyond chance.
#
# Each column is $O(n)$: cumulative sums for the windows, one pass for the fade.
# A second, more popular chance term, $\sum_c \Pr[c]^2$, also exists. It is not
# this one.

# %%
def prequential_scores(pred, y, W, phi):
    """Landmark, sliding and fading accuracy, and sliding Kappa, at every step.

    Args:
        pred: (n,) int predictions in {0, 1}.
        y: (n,) int labels in {0, 1}.
        W: the sliding window length.
        phi: the fading factor.
    Returns:
        (landmark, sliding, fading, kappa): four (n,) float arrays.
    """
    # BEGIN SOLUTION
    pred, y = np.asarray(pred, dtype=float), np.asarray(y, dtype=float)
    n = len(y)
    right = (pred == y).astype(float)
    t = np.arange(1, n + 1)
    start = np.maximum(t - W, 0)
    size = t - start

    def windowed(values):
        total = np.r_[0.0, np.cumsum(values)]
        return (total[t] - total[start]) / size

    landmark = np.cumsum(right) / t
    sliding = windowed(right)
    fading = np.empty(n)
    s, m = 0.0, 0.0
    for i in range(n):
        s = right[i] + phi * s
        m = 1.0 + phi * m
        fading[i] = s / m
    q, pi = windowed(pred), windowed(y)
    pc = q * pi + (1 - q) * (1 - pi)
    kappa = np.divide(sliding - pc, 1 - pc, out=np.zeros(n), where=pc < 1)
    return landmark, sliding, fading, kappa
    # END SOLUTION

# %%
# The lesson's Examples A and B: 100,000 payments, 0.2% fraud.
_y = np.r_[np.ones(200, dtype=int), np.zeros(99800, dtype=int)]
assert abs(prequential_scores(np.zeros(100000, dtype=int), _y, 100000, 0.99)[3][-1]) < 1e-12   # A: never flags
_p = np.r_[np.ones(100, dtype=int), np.zeros(100, dtype=int), np.ones(400, dtype=int), np.zeros(99400, dtype=int)]
assert abs(prequential_scores(_p, _y, 100000, 0.99)[3][-1] - 0.28) < 0.005                     # B: 500 flags, 100 fraud
_c = prequential_scores(np.array([1, 0, 0, 0]), np.array([0, 0, 0, 0]), 2, 0.5)
assert _c[1].tolist() == [0.0, 0.5, 1.0, 1.0] and _c[3].tolist() == [0.0, 0.0, 0.0, 0.0]
assert abs(_c[2][1] - (1 + 0.5 * 0) / 1.5) < 1e-12

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Three of the four columns need a mean over the same window, so write that once, as a
# small function of an array, and call it on the right-or-wrong column, the predictions
# and the labels. With a cumulative sum that starts at 0, a window's total is the
# difference of two entries, and clipping the window's start at 0 covers the first
# $W - 1$ steps. Fading is the one column that needs a loop. Kappa's boundary is one
# argument of `np.divide`.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# right = 1 where pred == y, else 0
# t = 1, 2, ..., n;  start = max(t - W, 0)
# windowed(v) = (total[t] - total[start]) / (t - start), with total = [0, cumsum(v)]
#
# landmark = cumsum(right) / t
# sliding  = windowed(right)
# fading:  S = right[i] + phi * S;  N = 1 + phi * N;  fading[i] = S / N
# q, pi = windowed(pred), windowed(y)
# pc = q * pi + (1 - q) * (1 - pi)
# kappa = (sliding - pc) / (1 - pc), and 0 where pc = 1
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# total = np.r_[0.0, np.cumsum(values)]
# window_mean = (total[t] - total[start]) / (t - start)
# kappa = np.divide(sliding - pc, 1 - pc, out=np.zeros(n), where=pc < 1)
# ```
# </details>

# %%
distill.check("prequential-scorer", prequential_scores)

# %% [markdown]
# The landmark overstates the error of a learner that is still improving. A learner
# whose error falls as $1/\sqrt t$ has error 0.02 at $T = 2{,}500$, while the mean of
# all its errors so far reads about $2/\sqrt T = 0.04$: it reports twice the current error, and it hardly moves
# when the learner fails. The plot is a seeded run of that learner with a jump in
# its error at item 1,800.

# %%
_rng = np.random.default_rng(5)
_t = np.arange(1, 2501)
_err = 1 / np.sqrt(_t)
_wrong = _rng.random(2500) < _err
_land, _slid, _fade, _ = prequential_scores(1 - _wrong.astype(int), np.ones(2500, dtype=int), 500, 0.996)
print(f"at T = 2,500: true error 0.020, landmark error {1 - _land[-1]:.3f}")
_wrong2 = _rng.random(2500) < np.where(_t > 1800, 0.25, _err)
_land, _slid, _fade, _ = prequential_scores(1 - _wrong2.astype(int), np.ones(2500, dtype=int), 500, 0.996)
plot_scores({"landmark": _land, "sliding, W = 500": _slid, "fading, phi = 0.996": _fade},
            changes=[(1800, 1801)], title="the same predictions, three scores")
assert abs(1 - prequential_scores(1 - _wrong.astype(int), np.ones(2500, dtype=int), 500, 0.996)[0][-1] - 0.04) < 0.012

# %% [markdown]
# ## 9. A naive Bayes that needs no stored items
#
# A batch naive Bayes stores nothing it could not compute from a few numbers per
# class and attribute. Over one item at a time the only hard part is the
# variance, because the textbook formula wants the mean first, and the running
# mean moves. Welford's update keeps $n$, the mean and $M_2 = \sum (x_i - \bar x)^2$:
#
# $$n \leftarrow n + 1, \quad d = x - \bar x, \quad \bar x \leftarrow \bar x + d/n,
#   \quad M_2 \leftarrow M_2 + d\,(x - \bar x),$$
#
# with the new mean in the last factor. The variance is then $M_2 / (n - 1)$.
#
# The classifier holds, per class $c \in \{0, 1\}$, a count $n_c$, and per
# attribute the running mean and $M_2$. The contract for its score, the log
# posterior odds:
#
# $$\text{score}(x) = \ln\frac{n_1 + 1}{n_0 + 1}
#   + \sum_j \bigl[\ln \mathcal N(x_j; \bar x_{1j}, \sigma^2_{1j}) - \ln \mathcal N(x_j; \bar x_{0j}, \sigma^2_{0j})\bigr],$$
#
# where $\sigma^2_{cj} = M_{2,cj}/(n_c - 1) + \text{var\_floor}$ for $n_c \ge 2$,
# and 1.0 for $n_c < 2$. A class with no items has mean 0. The floor is there
# because a column can be constant among one class's items, and the fallback
# because a class seen once has no variance. `predict_one` flags when the score
# is above 0.
#
# What this holds is a fixed count of numbers, whatever the stream's length:
# $2 + 2 \cdot 2 \cdot d$ per model, the two class counts and a mean and an $M_2$
# per class and attribute. Page–Hinkley adds four: its count, its mean and its two
# statistics. `Adwin` as you wrote it adds its whole window, $|W|$ numbers. The
# exponential histogram of the change-detectors lesson holds the same window in
# $O(\log |W|)$ buckets; this lab keeps the plain list.

# %%
def welford_update(count, mean, m2, value):
    """One step of Welford's update, element-wise.

    Args:
        count: a number, the items so far.
        mean, m2: (d,) float arrays.
        value: (d,) float array, the new item.
    Returns:
        (count, mean, m2), new values. The arguments are not changed.
    """
    # BEGIN SOLUTION
    count = count + 1
    d = value - mean
    mean = mean + d / count
    return count, mean, m2 + d * (value - mean)
    # END SOLUTION


class StreamingNaiveBayes:
    """Gaussian naive Bayes learned one item at a time.

    Args:
        n_features: d.
        var_floor: added to each estimated variance.
    Attributes:
        n: (2,) the class counts.
        mean, m2: (2, d) float arrays.
        var_floor: as given.
    """

    def __init__(self, n_features, var_floor=1e-6):
        # BEGIN SOLUTION
        self.d, self.var_floor = n_features, var_floor
        self.reset()
        # END SOLUTION

    def reset(self):
        """Forget everything learned."""
        # BEGIN SOLUTION
        self.n = np.zeros(2, dtype=np.int64)
        self.mean = np.zeros((2, self.d))
        self.m2 = np.zeros((2, self.d))
        # END SOLUTION

    def learn_one(self, x, y):
        """Learn one item. x: (d,) float array; y: 0 or 1."""
        # BEGIN SOLUTION
        self.n[y], self.mean[y], self.m2[y] = welford_update(self.n[y], self.mean[y], self.m2[y], x)
        # END SOLUTION

    def score_one(self, x):
        """Log posterior odds of class 1. x: (d,) float array. Returns a float."""
        # BEGIN SOLUTION
        total = np.log((self.n[1] + 1) / (self.n[0] + 1))
        for c, sign in ((1, 1.0), (0, -1.0)):
            var = self.m2[c] / (self.n[c] - 1) + self.var_floor if self.n[c] >= 2 else np.ones(self.d)
            total += sign * np.sum(-0.5 * np.log(2 * np.pi * var) - (x - self.mean[c]) ** 2 / (2 * var))
        return float(total)
        # END SOLUTION

    def predict_one(self, x):
        """1 when the score is above 0, else 0."""
        # BEGIN SOLUTION
        return int(self.score_one(x) > 0)
        # END SOLUTION

# %%
_rng = np.random.default_rng(6)
_x = _rng.normal(3.0, 2.0, (500, 2))
_n, _m, _v = 0, np.zeros(2), np.zeros(2)
for _row in _x:
    _n, _m, _v = welford_update(_n, _m, _v, _row)
assert np.allclose(_m, _x.mean(axis=0)) and np.allclose(_v / (_n - 1), _x.var(axis=0, ddof=1))
_nb = StreamingNaiveBayes(2)
assert _nb.score_one(np.array([1.0, 1.0])) == 0.0 and _nb.predict_one(np.array([1.0, 1.0])) == 0
for _row, _y in zip(_x, (_x[:, 0] > 3).astype(int)):
    _nb.learn_one(_row, int(_y))
assert _nb.n.sum() == 500 and _nb.predict_one(np.array([7.0, 3.0])) == 1 and _nb.predict_one(np.array([0.0, 3.0])) == 0
assert sum(a.size for a in (_nb.n, _nb.mean, _nb.m2)) == 2 + 2 * 2 * 2      # classes x attributes x (mean, M2): no stored item
_nb.reset()
assert _nb.n.sum() == 0 and _nb.score_one(np.array([1.0, 1.0])) == 0.0

# %% [markdown]
# ## 10. Predict, then score, then learn
#
# A learner that takes the item before predicting on it reads its own answer. So
# every item goes through one order:
#
# 1. score the item with the model as it stands, and record the prediction;
# 2. give the detector the error indicator (1.0 when the prediction was wrong);
# 3. if it alarms, reset the model and record the position;
# 4. only then learn the item, so that the item which rang the alarm is the
#    first thing the new model knows.

# %%
def run_adaptive(model, X, y, detector=None):
    """Prequential run of a model on a stream, optionally reset on alarm.

    Args:
        model: has score_one, predict_one, learn_one and reset.
        X: (n, d) float array.
        y: (n,) int labels in {0, 1}.
        detector: a detector with update, fed the error indicator, or None.
    Returns:
        (scores, preds, alarms): scores (n,) float from score_one, preds (n,) int,
        1 where the score is above 0, alarms (k,) int positions.
    """
    # BEGIN SOLUTION
    n = len(y)
    scores, preds, alarms = np.empty(n), np.empty(n, dtype=np.int64), []
    for i in range(n):
        scores[i] = model.score_one(X[i])
        preds[i] = int(scores[i] > 0)
        if detector is not None and detector.update(float(preds[i] != y[i])):
            model.reset()
            alarms.append(i)
        model.learn_one(X[i], int(y[i]))
    return scores, preds, np.array(alarms, dtype=np.int64)
    # END SOLUTION

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# The class holds three arrays and no items: `n` of shape (2,), `mean` and `m2` of shape
# (2, d). `learn_one` applies `welford_update` to the row of class `y`. `score_one` is
# the prior term and then the same computation for each class, with a sign: a (d,) array
# of variances, then the sum of the log densities. The fallback for a class seen fewer
# than twice replaces the whole array. `run_adaptive` is the four numbered steps in
# that order, one pass, with one branch, on the alarm.
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# score_one(x):
#     total = ln((n[1] + 1) / (n[0] + 1))
#     for class c, sign in (1, +1), (0, -1):
#         var = m2[c] / (n[c] - 1) + var_floor if n[c] >= 2, else all ones
#         total += sign * sum over j of ln N(x[j]; mean[c, j], var[j])
#
# run_adaptive, for each item i:
#     scores[i] = model.score_one(X[i]);  preds[i] = 1 if scores[i] > 0, else 0
#     if there is a detector and it alarms on the error indicator:
#         model.reset();  record i
#     model.learn_one(X[i], y[i])
# ```
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# total += sign * np.sum(-0.5 * np.log(2 * np.pi * var) - (x - self.mean[c]) ** 2 / (2 * var))
# # in the loop
# if detector is not None and detector.update(float(preds[i] != y[i])):
# ```
# </details>

# %%
# What the checker calls: your classes composed, without and with a detector.
def adaptive_nb(X, y, v, h, warm_up):
    d = X.shape[1]
    s0, p0, _ = run_adaptive(StreamingNaiveBayes(d), X, y)
    s1, p1, alarms = run_adaptive(StreamingNaiveBayes(d), X, y, PageHinkley(v, h, warm_up))
    return s0, p0, s1, p1, alarms


distill.check("streaming-naive-bayes", adaptive_nb)

# %% [markdown]
# ### On a drifting feature stream
#
# The generator below is the SEA stream: three uniform
# attributes on $[0, 10]$, label 1 when $x_1 + x_2 \le \theta$, the third
# attribute irrelevant, 10% of the labels flipped. A drift changes $\theta$, along
# the same sigmoid as your bits. The first run has its usual concepts, 9, 8, 7 and
# 9.5. Those barely move the boundary against the noise, so the second run uses a
# parameterisation that swings it.
#
# The curves: the model that keeps everything, the model reset by Page–Hinkley,
# and a hold-out curve, the model frozen after the first 5,000 items. Read the
# frozen curve against the prequential ones: it says what a held-out block would
# have reported for a model that stopped learning.

# %%
# Infrastructure (do not modify): the SEA-like stream, and three learners side by side.
def sea_stream(n, thetas, changes, seed, noise=0.1):
    """X (n, 3), y (n,). changes[k] = (position, width) leads from thetas[k] to thetas[k + 1]."""
    rng = np.random.default_rng(seed)
    X = rng.uniform(0, 10, (n, 3))
    concept = np.zeros(n, dtype=np.int64)
    for k, (position, width) in enumerate(changes):
        mix = 1.0 / (1.0 + np.exp(np.clip(-4.0 * (np.arange(n) - position) / width, -500, 500)))
        concept[rng.random(n) < mix] = k + 1
    y = (X[:, 0] + X[:, 1] <= np.asarray(thetas)[concept]).astype(np.int64)
    flip = rng.random(n) < noise
    y[flip] = 1 - y[flip]
    return X, y


def compare_on_sea(thetas, changes, n=40000, seed=11, W=1000, freeze=5000, v=0.02, h=20.0):
    X, y = sea_stream(n, thetas, changes, seed)
    _, keep, _ = run_adaptive(StreamingNaiveBayes(3), X, y)
    _, reset, alarms = run_adaptive(StreamingNaiveBayes(3), X, y, PageHinkley(v, h))
    frozen = StreamingNaiveBayes(3)
    for i in range(freeze):
        frozen.learn_one(X[i], int(y[i]))
    held = np.array([frozen.predict_one(row) for row in X])
    curve = lambda p: prequential_scores(p, y, W, 1 - 2 / (W + 1))[1]
    print(f"thetas {thetas}: alarms at {alarms.tolist()}")
    print(f"  accuracy over the stream: keep everything {np.mean(keep == y):.3f}, "
          f"reset on alarm {np.mean(reset == y):.3f}, frozen {np.mean(held == y):.3f}")
    shade = [(p - w // 2, p + w // 2 + 1) for p, w in changes]
    plot_scores({"keep everything": curve(keep), f"reset on alarm": curve(reset), "frozen at 5,000": curve(held)},
                changes=shade, title=f"sliding accuracy, W = {W}, thetas {thetas}")
    return np.mean(keep == y), np.mean(reset == y), np.mean(held == y)


CHANGES = [(10000, 2000), (20000, 1), (30000, 4000)]
compare_on_sea([9, 8, 7, 9.5], CHANGES)
_keep, _reset, _held = compare_on_sea([13, 7, 11, 6], CHANGES)
assert _reset > _keep > _held

# %% [markdown]
# ## 11. The drifting payment stream
#
# Now the toolkit meets transactions. `data/tx_stream.csv.gz` holds 60 days of a
# thinned run of the course's transaction simulator, the one from the
# canonical-datasets lesson: 1,500 customers, 3,000 terminals, about 3,000 payments
# a day, and the 15 features of the course's baseline, with terminal risk computed
# from labels seven days old. Its fraud changes twice:
#
# - throughout, a compromised card's stolen payments are five times its usual
#   amount, and any amount above 220 is fraud;
# - **from day 25** terminals get compromised: each day one more, for 28 days,
#   every payment on it fraud, at the owner's usual amount;
# - **from day 45** the stolen-card method changes: the amounts stop being large,
#   and those payments become small, between 1 and 30, in the first six hours of
#   the day.
#
# The rows from day 40 on are split by a coin. `GRADED = 1` rows have no label
# (`TX_FRAUD` is empty); those are what the open task predicts. The others keep
# their labels, and so a learner can still follow the stream while being graded.
#
# First the toolkit as it stands. The learner runs over the labelled rows only,
# in time order, reading each label at once. That removes the label delay and
# keeps only what this section is about: what an alarm does to the score. Mean
# accuracy would tell you nothing here, so the curve is sliding Kappa at $W =
# 2{,}000$. This part takes about a minute.

# %%
# Infrastructure (do not modify): the loader and the comparison.
FEATURES = ["TX_AMOUNT", "TX_DURING_WEEKEND", "TX_DURING_NIGHT"] + [
    f"{entity}_{w}DAY" for entity in ("CUSTOMER_NB_TX", "CUSTOMER_AVG_AMOUNT", "TERMINAL_NB_TX", "TERMINAL_RISK")
    for w in (1, 7, 30)]


def load_tx_stream():
    return pd.read_csv("data/tx_stream.csv.gz")


def compare_on_stream(stream, detectors, W=2000):
    known = stream[stream.TX_FRAUD.notna()]
    X, y = known[FEATURES].to_numpy(dtype=float), known.TX_FRAUD.to_numpy(dtype=np.int64)
    days = known.TX_TIME_DAYS.to_numpy()
    curves, shade = {}, [tuple(np.searchsorted(days, [d, d + 1])) for d in (25, 45)]
    for name, make in detectors.items():
        _, preds, alarms = run_adaptive(StreamingNaiveBayes(len(FEATURES)), X, y, make() if make else None)
        kappa = prequential_scores(preds, y, W, 1 - 2 / (W + 1))[3]
        curves[name] = kappa
        ring = np.unique(days[alarms]).tolist()
        print(f"{name:24s} {len(alarms):3d} alarms, on days {ring}; sliding Kappa, "
              f"days 25-44 {kappa[(days >= 25) & (days < 45)].mean():.3f}, from day 45 {kappa[days >= 45].mean():.3f}")
    plot_scores(curves, changes=shade, ylabel="sliding Kappa",
                title=f"streaming naive Bayes over the labelled rows, W = {W}; the changes at days 25 and 45")
    return curves


stream = load_tx_stream()
print(f"{len(stream):,} payments; labelled share of fraud {stream.TX_FRAUD.mean():.2%}; "
      f"{int(stream.GRADED.sum()):,} graded rows")
tx_curves = compare_on_stream(stream, {
    "keep everything": None,
    "reset on Page-Hinkley": lambda: PageHinkley(0.02, 10.0, 2000),
    "reset on DDM": lambda: DDM(5000),
    "reset on ADWIN": lambda: Adwin(1e-5, 256),
})
assert tx_curves["reset on Page-Hinkley"][-5000:].mean() > tx_curves["keep everything"][-5000:].mean()

# %%
# Infrastructure (do not modify): what the model holds of one column as the stream runs.
def inspect_column(stream, column, make=None, spans=None, within=None, at=1.0):
    """Replay the labelled rows; per stretch, the rates and the model's hold on a column.

    Args:
        column: a name in FEATURES.
        make: builds the detector, as in compare_on_stream; None keeps everything.
        spans: [(first day, last day), ...] in order, one line each; default days 0-14.
        within: a day among spans, printed as one line per stretch ending at a fraud
            row or an alarm, with rows numbered from the day's start.
        at: the column's value at which the log odds are read.

    The rates are over the stretch. The class variances, the prior and the column's
    log odds are the model's at the stretch's end, so they are what the next rows meet.
    """
    known = stream[stream.TX_FRAUD.notna()]
    X, y = known[FEATURES].to_numpy(dtype=float), known.TX_FRAUD.to_numpy(dtype=np.int64)
    days, j = known.TX_TIME_DAYS.to_numpy(), FEATURES.index(column)
    model, detector = StreamingNaiveBayes(len(FEATURES)), make() if make else None
    preds = np.empty(len(y), dtype=np.int64)

    def advance(a, b):
        _, preds[a:b], alarms = run_adaptive(model, X[a:b], y[a:b], detector)
        return len(alarms)

    def log_density(c):
        var = model.m2[c, j] / (model.n[c] - 1) + model.var_floor if model.n[c] >= 2 else 1.0
        return var, -0.5 * np.log(2 * np.pi * var) - (at - model.mean[c, j]) ** 2 / (2 * var)

    def line(label, a, b, rang):
        p, t = preds[a:b], y[a:b]
        (var_1, term_1), (var_0, term_0) = log_density(1), log_density(0)
        print(f"{label:>10s}{b - a:7d}{t.mean():7.1%}{p.mean():7.1%}{(p != t).mean():7.1%}{(p > t).mean():7.1%}"
              f"{int(model.n[1]):8d}{var_1:10.6f}{var_0:10.6f}{np.log((model.n[1] + 1) / (model.n[0] + 1)):7.1f}"
              f"{term_1 - term_0:11.1f}{'  alarm' if rang else ''}")

    print(f"{column}, detector {'none' if make is None else type(detector).__name__}")
    print(f"{'days':>10s}{'rows':>7s}{'fraud':>7s}{'flag':>7s}{'error':>7s}{'false':>7s}"
          f"{'n fraud':>8s}{'var f':>10s}{'var g':>10s}{'prior':>7s}{f'at {at:g}':>11s}")
    done = 0
    for first, last in spans or [(d, d) for d in range(15)]:
        a, b = np.searchsorted(days, first), np.searchsorted(days, last, side="right")
        advance(done, a)
        done = b
        if first != within:
            line(f"{first}" if first == last else f"{first}-{last}", a, b, advance(a, b))
            continue
        start = a
        for i in range(a, b):
            rang = advance(i, i + 1)
            if rang or y[i] or i == b - 1:
                line(f"{start - a}-{i - a}", start, i + 1, rang)
                start = i + 1


inspect_column(stream, "TERMINAL_RISK_7DAY")
inspect_column(stream, "TX_DURING_WEEKEND", lambda: DDM(5000), spans=[(0, 1), (2, 2), (3, 5), (6, 6)], within=6)
inspect_column(stream, "TX_DURING_WEEKEND", lambda: DDM(5000), spans=[(14, 24), (25, 32)])

# %% [markdown]
# Three things to read in the output before you trust a detector on this stream.
# The tables come from `inspect_column`. Its rates are over the stretch; `false` is
# the share of rows flagged wrongly. Its last four columns are what the model holds at
# the stretch's end: the two class variances of the named column, the prior term, and
# the log odds that column alone gives a row at the value `at`.
#
# **The alarms of days 2–13 are not fraud.** Terminal counts and risk are computed from
# labels seven days old, so those columns are exactly 0 for the first week. In the first
# table the model that keeps everything flags 2.1% or less of the rows up to day 6, 37.7%
# on day 7, 53.2% on day 10 and 9.7% on day 13. While both classes hold a column on the
# variance floor its terms cancel: the 0.0 in the last column. They stop cancelling when
# one class learns a nonzero value, and the sign depends on which class. A class on the
# floor is a spike at 0: it gains on a row at exactly 0 and rules out any other value.
#
# One spike in full, in the second table: DDM's model, reset on day 2, meets its first
# weekend on day 6, so `TX_DURING_WEEKEND` is 1 on every row of the day. Fraud is on the
# floor at 0 and the first rows flag at 0%. The first fraud, row 187, lifts that class's
# variance to 0.0208, against 0.0156 for genuine rows. The Gaussian's penalty is
# $(x - \bar x)^2 / (2\sigma^2)$, and at $x = 1$ with both means near 0 that is
# $1 / (2 \cdot 0.0156) \approx 32$ for genuine and $1 / (2 \cdot 0.0208) \approx 24$ for
# fraud, so 8 in favour of fraud. The $-\frac12 \ln \sigma^2$ term takes 0.1 back, which
# gives the table's 7.9. The prior takes away 5.5, and the other columns decide the row:
# none of the next 67 flags, while genuine weekend rows lift their own variance. The
# second fraud starts the flags. After the third, row 285, the variances are 0.0576 and
# 0.0232, the same sum gives
# $21.6 - 8.7 - 0.5 = 12.4$, and the next 24 rows flag at 91.7%. Those false flags ring
# the alarm. Rerun `compare_on_stream` on a copy with that column at 0,
# `stream.assign(TX_DURING_WEEKEND=0)`, so that the later cells keep the real column. That
# alarm goes and DDM's others move, from days [2, 6, 9, 13, 32] to [2, 7, 8, 10, 14, 33],
# and the day 13 alarm of Page–Hinkley and ADWIN, whose model has seen only days 10–12,
# goes too.
# A detector on the error stream cannot tell a broken feature from new fraud: it reports
# that something changed.
#
# Two more of the same kind, for you to run. On day 10 fraud is the class on the floor in
# the risk columns: `inspect_column(stream, "TERMINAL_RISK_7DAY", within=10, at=0.0)`. On
# day 7 it is the counts: `inspect_column(stream, "TERMINAL_NB_TX_7DAY", within=7)`, where
# one fraud row with a nonzero count turns the last column from a large negative number to
# a large positive one, and the flags stay up until the genuine class's variance catches
# up.
#
# DDM's first alarm comes before any of that, for another reason. Its registers are set
# when the warm-up ends, on the first 5,000 items, while the card compromises have barely
# begun: its error is 0.4% over days 0–1 and 2.2% on day 2. Try a warm-up of 8,000 and of
# 12,000, and watch that alarm move.
#
# **Day 25 raises no alarm.** In the third table the terminal compromises move the fraud
# share from 0.9% over days 14–24 to 1.3% over days 25–32. An increase that small sits
# inside Page–Hinkley's allowance and under ADWIN's cut. This is the lesson's warning
# about raw error, now on your own output: the rate mostly reads the model's flagging,
# not the fraud. DDM's day 32 does not catch the terminals either. Its $p_t$ has averaged
# everything since day 13, which leaves a narrow drift band, and its error has crept from
# 3.3% to 4.1%, while false flags went from 3.0% to 3.5%: more than half of the rise.
#
# **Day 45 is caught by Page–Hinkley at these settings**, its first alarm since day 13.
# DDM and ADWIN do not ring at day 45: DDM's $p_t$ is averaging everything since day 32,
# and ADWIN's Hoeffding cut at this $\alpha$ does not reach a change this small.
# Page–Hinkley then keeps ringing, on days 47 to 57, without any further change: the new
# fraud sits in the first six hours of the day, so the error peaks every night, and a mean
# restarted at the last alarm reads each peak as a rise; day 48 is the weekend spike again,
# on a model reset the day before. From day 45 on Page–Hinkley's Kappa is 0.261 against
# 0.213 for the model that keeps everything, and not all of that is the alarm: ADWIN,
# silent since day 13, has 0.243, and DDM, silent since day 32, has 0.263. The gain in days
# 25–44 comes from the second week's resets, which threw away the days the zero columns
# had spoiled. Each alarm also throws away what the model knew, and a model on 1% fraud
# needs days to see any fraud again. Try $h = 20$, and $v = 0.005$, and watch what those
# cost.

# %% [markdown]
# ## 12. Which detector, on labels a week late
#
# So far each label arrived at once. In the course's system a label arrives
# about $\delta = 7$ days after the payment, investigators read a fixed number of
# cards a day, and the number of compromised cards swings by the day of the week
# without anything having changed.
#
# You are putting one detector on a deployed fraud model. Name the stream you
# feed it and the detector you choose, and say why. Say what its alarm can mean
# and what it cannot: how long after the fraud changed it can ring at the earliest,
# and how you would state and check how often it rings by itself. A few sentences
# per point are enough.

# %%
distill.submit_review(
    "which-detector-for-fraud",
    'Not the raw error rate: on a stream with under 1% fraud it reads the fraud share, '
    'and it moves whenever fraud volume moves. I would feed a per-day budget-normalised '
    "quantity, the share of the day's compromised cards the model missed in its top k "
    "(1 - CP@k style), computed once that day's labels are in. "
    ' '
    'Those labels are delta = 7 days old, so an alarm rings at c + delta + MTD at the '
    'earliest: a week plus the detection delay after the change at c. An alarm says the '
    'model was worse on a day a week ago, not why (it can be an emptier week for fraud '
    'or a change in what the investigators look at), and it says nothing about this '
    'week. It cannot stand in for a feature-drift monitor, which has no label delay. '
    ' '
    'The daily series is short and has a weekly rhythm. So Page-Hinkley, because the '
    'level moves between retrainings and it needs no known mu, with v and h simulated '
    'on a stable stretch of the same series so that I can state the MTFA I chose, say '
    "one false alarm a year, instead of hoping. ADWIN's Hoeffding cut would be blind at "
    'this length of series, and "no parameters" is not true of it either. I would check '
    'the MTFA by replaying a period with no known change, with the weekly shape '
    'removed or compared by same weekday. Each alarm then cuts the training memory; a '
    'false one costs the old frauds.'
)

# %% [markdown]
# ## 13. Open task: a learner that follows the stream
#
# Score the graded rows of days 40–59 as well as you can, with a learner of your
# design. Nothing here is a scaffold. Write `predict_stream` however you like, with
# any model, windows, resets, pools and features, as long as it obeys the one rule
# that makes the number mean something:
#
# **A row's label may be used only from seven days after its day.** To score day
# $d$ you may train on labelled rows of days up to $d - 7$. Nothing can check this.
# A model that peeks scores a stream that does not exist.
#
# Why ROC-AUC, after a section of Kappa: Kappa needs a flagging rate and a ranking does not,
# and a pooled ranking over 20 days is still punished by a model that lags, because
# what it misses after a change sinks to the bottom. `validate` draws two panels from
# your scores on the labelled half, against the frozen model. The first is ROC-AUC in
# bins of about three days, the graded quantity, and it shows where a lagging model
# loses its grade. The second is the sliding Kappa you built, at a top-1.2% cut: the
# operating view, what a team flagging that share would see.
#
# The bar and what stands below it, on the graded rows:
#
# | Learner | ROC-AUC |
# |---|---|
# | boosted trees (depth 3, `HistGradientBoostingClassifier` defaults) trained once on days 0–24 | 0.66 |
# | Gaussian naive Bayes trained once on days 0–24 | 0.72 |
# | the same trees retrained daily on all labels old enough | 0.815 |
# | **the bar** | **0.83** |
#
# The labelled half of the same days is your validation: same days, same fraud,
# same distribution. Hints are after the plot; try first.

# %%
def predict_stream(stream):
    """Fraud scores for every row from day 40 on.

    Args:
        stream: the DataFrame of load_tx_stream, whose TX_FRAUD is NaN on the
            graded rows.
    Returns:
        (m,) float array, higher meaning more suspicious, one score per row
        with TX_TIME_DAYS >= 40, in the stream's order.
    """
    # BEGIN SOLUTION
    data = stream.copy()
    data["HOUR"] = (data.TX_TIME_SECONDS % 86400) / 3600
    data["AMOUNT_OVER_30D"] = data.TX_AMOUNT / data.CUSTOMER_AVG_AMOUNT_30DAY
    data["AMOUNT_OVER_7D"] = data.TX_AMOUNT / data.CUSTOMER_AVG_AMOUNT_7DAY
    columns = FEATURES + ["HOUR", "AMOUNT_OVER_30D", "AMOUNT_OVER_7D"]
    X, y = data[columns].to_numpy(dtype=float), data.TX_FRAUD.to_numpy()
    days = data.TX_TIME_DAYS.to_numpy()
    scores = np.empty(len(data))
    for d in range(40, 60):
        last = d - 7
        rows = (days <= last) & (days > last - 14) & np.isfinite(y)
        model = HistGradientBoostingClassifier(max_depth=3, random_state=0).fit(X[rows], y[rows].astype(np.int64))
        today = days == d
        scores[today] = model.predict_proba(X[today])[:, 1]
    return scores[days >= 40]
    # END SOLUTION

# %%
# Infrastructure (do not modify): your scores against a frozen model, on the labelled half.
def validate(stream, scores, W=2000, share=0.012, edges=np.array([40, 42, 45, 48, 51, 54, 57, 60])):
    tail = stream[stream.TX_TIME_DAYS >= 40]
    known = tail.TX_FRAUD.notna().to_numpy()
    y = tail.TX_FRAUD.to_numpy()[known].astype(np.int64)
    train = (stream.TX_TIME_DAYS <= 24) & stream.TX_FRAUD.notna()
    frozen = HistGradientBoostingClassifier(max_depth=3, random_state=0).fit(
        stream.loc[train, FEATURES].to_numpy(dtype=float), stream.TX_FRAUD[train].astype(np.int64))
    base = frozen.predict_proba(tail[FEATURES].to_numpy(dtype=float))[:, 1][known]
    yours = np.asarray(scores, dtype=float)[known]
    print(f"labelled half of days 40-59: your ROC-AUC {roc_auc_score(y, yours):.3f}, "
          f"frozen on days 0-24 {roc_auc_score(y, base):.3f}")
    flagged = lambda s: (s >= np.quantile(s, 1 - share)).astype(np.int64)
    days = tail.TX_TIME_DAYS.to_numpy()[known]
    clock = tail.TX_TIME_SECONDS.to_numpy()[known] / 86400
    centres = (edges[:-1] + edges[1:]) / 2
    fig, (top, low) = plt.subplots(2, 1, figsize=(8, 5.5), sharex=True)
    for name, s in (("yours", yours), ("frozen on days 0-24", base)):
        top.plot(centres, [roc_auc_score(y[(days >= a) & (days < b)], s[(days >= a) & (days < b)])
                           for a, b in zip(edges[:-1], edges[1:])], "o-", ms=4, lw=1, label=name)
        low.plot(clock, prequential_scores(flagged(s), y, W, 1 - 2 / (W + 1))[3], lw=1, label=name)
    for ax in (top, low):
        ax.axvspan(45, 46, color="C3", alpha=0.15, lw=0)
        ax.legend(fontsize=8)
    top.set_ylabel("ROC-AUC")
    top.set_title("labelled half, ROC-AUC per bin of about three days; the method changes at day 45", fontsize=9)
    low.set_ylabel("sliding Kappa"); low.set_xlabel("day")
    low.set_title(f"the same scores, top {share:.1%} flagged, W = {W}", fontsize=9)
    plt.tight_layout(); plt.show()


stream_scores = predict_stream(stream)
assert stream_scores.shape == ((stream.TX_TIME_DAYS >= 40).sum(),)
validate(stream, stream_scores)

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# Stand on day 45 and look at what a model that keeps everything has learned: a
# great many frauds with large amounts, none of them small and nocturnal. When the
# method changes, its memory argues against the new fraud. The table says retraining
# already helps; try how long a memory the stream wants, by your own validation.
# The other half of the gap is that "large" and "at night" are relative to the card
# and to the clock, and the 15 features state them poorly.
#
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# for each day d in 40..59:
#     train on labelled rows with days in (d - 7 - K, d - 7]
#     score day d's rows
# sweep K; add features; compare on the labelled half
# ```
#
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# stream["AMOUNT_OVER_30D"] = stream.TX_AMOUNT / stream.CUSTOMER_AVG_AMOUNT_30DAY
# stream["HOUR"] = (stream.TX_TIME_SECONDS % 86400) / 3600
# ```
# Trees of depth 3 on these and the baseline columns, with a two-week memory, clear
# the bar. A reset-on-alarm naive Bayes reads the same idea from the other side, and
# you can test how far it gets.
#
# </details>

# %%
graded_rows = stream.GRADED.to_numpy()[stream.TX_TIME_DAYS.to_numpy() >= 40] == 1
distill.submit_predictions("beat-drifting-stream", stream_scores[graded_rows])

# %% [markdown]
# ## References
#
# - A. Bifet, R. Gavaldà, G. Holmes, B. Pfahringer, *Machine Learning for Data
#   Streams*, MIT Press, 2018: ch. 5 (the measures MTFA, MTD and MDR; Page–Hinkley;
#   the window tests; DDM; ADWIN), and Exercise 5.7, which this lab's first half
#   follows.
# - J. Gama, I. Žliobaitė, A. Bifet, M. Pechenizkiy, A. Bouchachia, "A Survey on
#   Concept Drift Adaptation", *ACM Computing Surveys* 46(4), 2014: Sec. 3.2 (the
#   detectors' formulas), Sec. 4.1 (Kappa), App. B.1 (the SEA generator).
# - R. Gavaldà, *MIRI Seminar on Data Streams*, UPC, 2015: Lecture 7, Exercise 1 (a
#   streaming naive Bayes made adaptive with a detector), Lecture 8, slides 6–11
#   (prequential evaluation).
# - MOA, *Tutorial 5: Introduction to Concept Drift*, Sec. 3 (the sigmoid window),
#   Sec. 7 (the SEA drift exercises).
# - A. Carta, *Continual Learning* course, University of Pisa, notebooks OML1 and
#   OML2 (the three-segment stream, the hand-written cumulative sum, the exercises on
#   windowed prequential accuracy).
# - Y.-A. Le Borgne, W. Siblini, B. Lebichot, G. Bontempi, *Reproducible Machine
#   Learning for Credit Card Fraud Detection — Practical Handbook*, Université Libre
#   de Bruxelles, 2022: Ch. 3 (the rules of the transaction simulator, implemented
#   here from their published description).

# %%
distill.dump()
