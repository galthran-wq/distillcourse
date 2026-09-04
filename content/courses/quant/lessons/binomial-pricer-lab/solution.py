# %% [markdown]
# # Lab: binomial pricer and the exercise boundary
#
# Modules 2 and 3 proved three things about the binomial market on paper: a
# claim's price is computed by backward induction, the delta process
# replicates the claim exactly along every path, and an American claim adds a
# maximum at every node whose winning set is the exercise region. This lab
# turns the three into one pricer whose claims about itself are measured
# rather than asserted: the hedge is walked along every path and its mismatch
# printed, the exercise boundary is extracted as data, and the pricer is run
# out to thousands of steps against a fine-grid reference.
#
# Ground rules:
#
# - **No library pricers** — every line below is your numpy. (Checking a
#   number against a library on your own machine is fine; the graded work is
#   yours.)
# - **Lattices are lists of arrays.** Date $i$ holds an array of length
#   $i + 1$; index $j$ counts the heads (up moves) so far, so the stock price
#   at node $(i, j)$ is $S_0 u^j d^{\,i - j}$. Every function in the lab takes
#   and returns lattices in this form.
# - Each checkpoint cell submits your function's outputs to the course
#   server, which compares them against a reference. Run them as you go. The
#   seven exact checkpoints are the required set; the written answer and the
#   open task at the end are optional — partial completion is a normal way
#   to finish a lab.

# %%
from dataclasses import dataclass

import numpy as np
import matplotlib.pyplot as plt

import distill

distill.open_lab("quant/binomial-pricer-lab")

# %% [markdown]
# ## 0. The market, the payoffs, and the helpers that ship complete
#
# A binomial market is five numbers: the initial price, the two factors, the
# per-period interest rate and the number of periods. The rate convention is
# Shreve's — $r$ is the simple rate per period, so one unit in the money
# market becomes $1 + r$ one toss later, and the paper's gross rate of $1.1$
# is $r = 0.1$ here.
#
# Nothing in this cell is a task. `flat` turns a lattice into one vector for
# the checkpoints; `call` and `put` build payoff functions; `crr_tree`
# calibrates a tree to a volatility and a horizon, with the formulas the next
# module derives ($u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$, the rate
# compounded over one step); `all_paths` lists every toss sequence; the rest
# draws.

# %%
@dataclass(frozen=True)
class Tree:
    """An n-period binomial market.

    S0: initial stock price; u, d: up and down factors; r: simple interest
    rate per period (the money market grows by 1 + r each period); n: periods.
    """
    S0: float
    u: float
    d: float
    r: float
    n: int


def flat(lattice):
    """Concatenate a lattice (one array per date) into a single vector, date by date."""
    return np.concatenate([np.asarray(level, dtype=float).ravel() for level in lattice])


def call(K):
    """Payoff function of a call struck at K: s -> max(s - K, 0)."""
    return lambda s: np.maximum(s - K, 0.0)


def put(K):
    """Payoff function of a put struck at K: s -> max(K - s, 0)."""
    return lambda s: np.maximum(K - s, 0.0)


def crr_tree(S0, rate, sigma, T, n):
    """The Cox–Ross–Rubinstein calibration of an n-step tree over [0, T].

    Args:
        S0: initial stock price.
        rate: continuously compounded annual interest rate.
        sigma: annual volatility.
        T: horizon in years.
        n: number of steps.
    Returns:
        Tree with u = exp(sigma * sqrt(T/n)), d = 1/u, r = exp(rate * T/n) - 1.
    """
    dt = T / n
    u = np.exp(sigma * np.sqrt(dt))
    return Tree(S0, u, 1.0 / u, np.exp(rate * dt) - 1.0, n)


def all_paths(n):
    """Every toss sequence of length n as the rows of a (2**n, n) 0/1 array; 1 is a head (up move)."""
    return (np.arange(2**n)[:, None] >> np.arange(n)[None, :]) & 1


# ---- drawing: nothing below is graded ----------------------------------------

def draw_lattice(tree, S, values=None, exercised=None, ax=None, fmt="{:.3f}"):
    """Draw a small tree: nodes at (date, price), labelled with values if given.

    Exercise nodes (exercised[i][j] True) are filled.
    """
    ax = ax or plt.gca()
    for i in range(tree.n):
        for j in range(i + 1):
            ax.plot([i, i + 1], [S[i][j], S[i + 1][j + 1]], color="0.75", lw=1, zorder=1)
            ax.plot([i, i + 1], [S[i][j], S[i + 1][j]], color="0.75", lw=1, zorder=1)
    for i in range(tree.n + 1):
        for j in range(i + 1):
            hit = exercised is not None and bool(exercised[i][j])
            ax.scatter(i, S[i][j], s=60, zorder=2, facecolor="C1" if hit else "white",
                       edgecolor="C1" if hit else "C0", lw=1.5)
            label = f"S={S[i][j]:g}"
            if values is not None:
                label += "\nV=" + fmt.format(values[i][j])
            ax.annotate(label, (i, S[i][j]), textcoords="offset points", xytext=(8, -4), fontsize=8)
    ax.set_xticks(range(tree.n + 1))
    ax.set_xlabel("date")
    ax.set_ylabel("stock price")
    return ax


def plot_walk(X, claim, title=""):
    """Wealth of the hedge versus the claim's value along one path, with the running mismatch."""
    fig, (a, b) = plt.subplots(1, 2, figsize=(9, 3))
    dates = np.arange(len(X))
    a.plot(dates, claim, "o-", label="claim value along the path")
    a.plot(dates, X, "x--", label="hedge wealth")
    a.set_xlabel("date"); a.legend(fontsize=8); a.set_title(title, fontsize=9)
    b.plot(dates, X - claim, "o-", color="C1")
    b.axhline(0, color="0.6", lw=0.8)
    b.set_xlabel("date"); b.set_title("wealth − claim", fontsize=9)
    fig.tight_layout()


def plot_boundary(tree, S, exercised, boundary, K):
    """Every node of the tree, exercise nodes filled, with the extracted boundary drawn through them."""
    fig, ax = plt.subplots(figsize=(8, 4))
    for i in range(tree.n + 1):
        hit = np.asarray(exercised[i], dtype=bool)
        ax.scatter(np.full(i + 1, i)[~hit], S[i][~hit], s=6, color="0.7")
        ax.scatter(np.full(i + 1, i)[hit], S[i][hit], s=6, color="C1")
    ax.plot(np.arange(tree.n + 1), boundary, color="C0", lw=1.5, label="highest exercising node")
    ax.axhline(K, color="0.4", ls="--", lw=0.8, label="strike")
    ax.set_ylim(0.3 * K, 1.5 * K)
    ax.set_xlabel("date"); ax.set_ylabel("stock price"); ax.legend(fontsize=8)
    fig.tight_layout()


def plot_convergence(ns, prices, reference=None):
    """Price against step count; the reference, if given, as a horizontal line."""
    fig, ax = plt.subplots(figsize=(8, 3.5))
    ax.plot(ns, prices, ".-", lw=0.8, ms=3)
    if reference is not None:
        ax.axhline(reference, color="C1", lw=1, label="fine-grid reference")
        ax.legend(fontsize=8)
    ax.set_xlabel("steps n"); ax.set_ylabel("American put price")
    fig.tight_layout()


# Two trees the module computed by hand, used as test vectors throughout.
SHREVE = Tree(S0=4.0, u=2.0, d=0.5, r=0.25, n=3)      # Shreve's running market
CRR79 = Tree(S0=80.0, u=1.5, d=0.5, r=0.10, n=3)      # Cox–Ross–Rubinstein §4

# %% [markdown]
# ## 1. The stock lattice
#
# The tree recombines: a head then a tail and a tail then a head both land on
# $S_0 u d$, so date $i$ has $i + 1$ distinct prices rather than $2^i$, and
# the price at node $(i, j)$ — date $i$, $j$ heads so far — is
#
# $$S_i(j) = S_0\, u^{\,j}\, d^{\,i - j}, \qquad j = 0, \ldots, i .$$
#
# Build the whole lattice at once. Index $j$ runs upward: `S[i][0]` is the
# lowest price on date $i$ and `S[i][i]` the highest. One numpy expression
# per date is enough; the pricer's open task runs this at $n$ in the
# thousands, where a per-node Python loop over millions of nodes is the
# difference between a second and a minute.

# %%
def stock_lattice(tree):
    """The recombining stock price lattice.

    Args:
        tree: the market.
    Returns:
        list of tree.n + 1 arrays; S[i] has shape (i + 1,) and S[i][j] is the
        price on date i after j heads, S0 * u**j * d**(i - j).
    """
    # BEGIN SOLUTION
    S = []
    for i in range(tree.n + 1):
        j = np.arange(i + 1)
        S.append(tree.S0 * tree.u**j * tree.d ** (i - j))
    return S
    # END SOLUTION

# %%
# Two trees from the module, by hand: Shreve's $4 stock doubles or halves and
# reaches 32, 8, 2, 1/2 on date three; the 1979 paper's 80-stock reaches
# 270, 90, 30, 10.
_S = stock_lattice(SHREVE)
assert len(_S) == 4 and _S[3].shape == (4,)
assert np.allclose(_S[3], [0.5, 2.0, 8.0, 32.0])
assert np.allclose(_S[2], [1.0, 4.0, 16.0])
assert np.allclose(stock_lattice(CRR79)[3], [10.0, 30.0, 90.0, 270.0])

plt.figure(figsize=(6, 4))
draw_lattice(SHREVE, _S)
plt.title("Shreve's running market: S0 = 4, u = 2, d = 1/2", fontsize=9)
plt.show()

# %%
distill.check("stock-lattice", lambda S0, u, d, r, n: flat(stock_lattice(Tree(S0, u, d, r, n))))

# %% [markdown]
# ## 2. The risk-neutral probability
#
# Every backward pass in this lab weights the up-child by one number. It is
# the probability that makes the discounted stock a martingale: $\tilde p$
# solves $S_0 = \frac{1}{1 + r}\,(\tilde p\, u S_0 + (1 - \tilde p)\, d S_0)$,
# and it lies strictly between $0$ and $1$ exactly when the market is
# arbitrage-free, $0 < d < 1 + r < u$. Solve that equation for $\tilde p$.

# %%
def risk_neutral_prob(tree):
    """The risk-neutral probability of a head (up move).

    Args:
        tree: the market.
    Returns:
        float p̃ in (0, 1) with S0 = (p̃ u S0 + (1 − p̃) d S0) / (1 + r).
    """
    # BEGIN SOLUTION
    return (1.0 + tree.r - tree.d) / (tree.u - tree.d)
    # END SOLUTION

# %%
# Shreve's market has p̃ = 1/2; the paper's has p̃ = 0.6. The check that
# matters is the martingale identity itself, at every node of the lattice.
assert np.isclose(risk_neutral_prob(SHREVE), 0.5)
assert np.isclose(risk_neutral_prob(CRR79), 0.6)
for _tree in (SHREVE, CRR79, crr_tree(40.0, 0.07, 0.3, 3.0, 12)):
    _S, _p = stock_lattice(_tree), risk_neutral_prob(_tree)
    for _i in range(_tree.n):
        assert np.allclose(_S[_i], (_p * _S[_i + 1][1:] + (1 - _p) * _S[_i + 1][:-1]) / (1 + _tree.r))

# %%
distill.check("risk-neutral-prob", lambda S0, u, d, r, n: risk_neutral_prob(Tree(S0, u, d, r, n)))

# %% [markdown]
# ## 3. European claims by backward induction
#
# A European claim pays $g(S_n)$ on the last date and nothing before. Its
# value lattice is filled from the right: the terminal date holds the payoff,
# and every earlier node holds the discounted risk-neutral average of its two
# children — the up-child $(i + 1, j + 1)$ weighted by $\tilde p$, the
# down-child $(i + 1, j)$ by $\tilde q = 1 - \tilde p$:
#
# $$V_i(j) = \frac{1}{1 + r}\bigl(\tilde p\, V_{i+1}(j + 1) + \tilde q\, V_{i+1}(j)\bigr).$$
#
# The function takes the payoff as a function of the terminal price, so the
# same pass values a call, a put, a straddle or a digital. Reuse
# `stock_lattice` and `risk_neutral_prob` rather than re-deriving them; the
# checkpoint composes all three.

# %%
def european_values(tree, payoff):
    """Value lattice of a European claim paying payoff(S_n) at the last date.

    Args:
        tree: the market.
        payoff: function mapping an array of terminal prices to an array of payoffs.
    Returns:
        list of tree.n + 1 arrays; V[i] has shape (i + 1,) and V[i][j] is the
        claim's value at node (i, j). V[0][0] is the price.
    """
    # BEGIN SOLUTION
    S = stock_lattice(tree)
    p = risk_neutral_prob(tree)
    disc = 1.0 / (1.0 + tree.r)
    V = [None] * (tree.n + 1)
    V[tree.n] = payoff(S[tree.n])
    for i in range(tree.n - 1, -1, -1):
        V[i] = disc * (p * V[i + 1][1:] + (1 - p) * V[i + 1][:-1])
    return V
    # END SOLUTION

# %%
# Three numbers the module computed by hand. Shreve's one-period call struck
# at 5 is worth 1.20; his three-period call is worth 2.304, with V_2(16) = 12
# and V_1(8) = 5.28 on the way; the paper's 80-stock call is worth 34.080 —
# the paper prints 34.065 because it rounds its discount factors, as the
# arbitrage-trade lesson notes.
assert np.isclose(european_values(Tree(4.0, 2.0, 0.5, 0.25, 1), call(5.0))[0][0], 1.20)
_V = european_values(SHREVE, call(5.0))
assert np.isclose(_V[0][0], 2.304) and np.isclose(_V[2][2], 12.0) and np.isclose(_V[1][1], 5.28)
assert np.isclose(european_values(CRR79, call(80.0))[0][0], 34.0797, atol=1e-4)
# Put–call parity holds node by node on the tree, not only at the root.
_C, _P, _S = european_values(SHREVE, call(5.0)), european_values(SHREVE, put(5.0)), stock_lattice(SHREVE)
for _i in range(4):
    assert np.allclose(_C[_i] - _P[_i], _S[_i] - 5.0 / 1.25 ** (3 - _i))

plt.figure(figsize=(6, 4))
draw_lattice(SHREVE, _S, _V)
plt.title("the three-period $5 call: values by backward induction", fontsize=9)
plt.show()

# %%
# The check uses a straddle, |S_n − K|: a pass that only knows how to value a
# call does not survive it.
distill.check(
    "european-price",
    lambda S0, u, d, r, n, K: flat(european_values(Tree(S0, u, d, r, n), lambda s: np.abs(s - K))),
)

# %% [markdown]
# ## 4. The replicating portfolio, and the walk that verifies it
#
# The pass of section 3 is a price; the replication theorem is a hedge. At
# every node the seller holds $\Delta_i(j)$ shares and the rest of the
# claim's value in the money market, and rebalances one toss later without
# adding or withdrawing money. The number of shares is the slope of the
# claim's value across the two successors — the ratio of the value spread to
# the price spread between the up-child and the down-child of the same node
# — and the money-market position is what is left of the claim's value after
# the shares are bought:
#
# $$B_i(j) = V_i(j) - \Delta_i(j)\, S_i(j).$$
#
# Both are defined on dates $0$ to $n - 1$ only; there is nothing to hedge
# on the last date. Write the two lattices, then the walker that carries the
# portfolio along a toss sequence with the wealth equation of module 2 —
# shares ride the stock, the money-market position grows by $1 + r$ — and
# returns the wealth at every date.

# %%
def hedge(tree, V):
    """Delta and money-market lattices replicating a value lattice V.

    Args:
        tree: the market.
        V: value lattice as returned by european_values (or american_values).
    Returns:
        (Delta, B), two lists of tree.n arrays each; Delta[i] and B[i] have
        shape (i + 1,). Delta[i][j] is the number of shares held at node
        (i, j) from date i to date i + 1; B[i][j] = V[i][j] − Delta[i][j] * S[i][j]
        is the money-market position taken at date i (negative when borrowed).
    """
    # BEGIN SOLUTION
    S = stock_lattice(tree)
    Delta, B = [], []
    for i in range(tree.n):
        dV = V[i + 1][1:] - V[i + 1][:-1]
        dS = S[i + 1][1:] - S[i + 1][:-1]
        Delta.append(dV / dS)
        B.append(V[i] - Delta[i] * S[i])
    return Delta, B
    # END SOLUTION


def walk_hedge(tree, X0, Delta, path):
    """Wealth of the self-financing hedge along one toss sequence.

    Starts with wealth X0 at date 0 and, on each date i, holds Delta[i][j]
    shares (j = heads so far) with the remaining wealth in the money market.

    Args:
        tree: the market.
        X0: initial wealth (the claim's price, for a replicating hedge).
        Delta: share lattice from hedge().
        path: (tree.n,) array of 0/1 tosses; 1 is a head (up move).
    Returns:
        (tree.n + 1,) array X with X[0] = X0 and X[i] the wealth at date i.
    """
    # BEGIN SOLUTION
    X = np.empty(tree.n + 1)
    X[0] = X0
    S, heads = tree.S0, 0
    for i, toss in enumerate(path):
        S_next = S * (tree.u if toss else tree.d)
        X[i + 1] = Delta[i][heads] * S_next + (1 + tree.r) * (X[i] - Delta[i][heads] * S)
        S, heads = S_next, heads + int(toss)
    return X
    # END SOLUTION

# %% [markdown]
# Two blanks in one cell, and the second depends on the first. Try both
# before opening the folds; the assertions in the next cell tell the two
# apart — a wrong delta fails the first assertion, a wrong walk fails the
# mismatch check after it.
#
# <details><summary>Hint 1 — strategy</summary>
#
# **The hedge.** The two successors of node $(i, j)$ are $(i + 1, j + 1)$
# and $(i + 1, j)$, so on date $i + 1$ the up-child of every date-$i$ node
# is `V[i + 1][1:]` and the down-child is `V[i + 1][:-1]` — the same two
# slices section 3's pass averaged, each of length $i + 1$ and aligned with
# date $i$. The slope across the successors is the value spread over the
# price spread of those same two slices, and the stock lattice supplies the
# price spread. $B$ is then the displayed formula, one line, on date $i$'s
# own arrays. Both lattices stop at date $n - 1$.
#
# **The walk.** Three running quantities: the current price (start at
# $S_0$), the number of heads so far (start at $0$ — it is the node index
# $j$ on the current date) and the wealth (start at $X_0$). At each date
# the hedger reads the shares at the node they are standing on, *before*
# the toss; then the toss moves the price by $u$ or $d$; then the new
# wealth is what the shares are now worth plus what the money-market
# position grew to. Update the price and the head count only after the
# wealth is written.
#
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# hedge(tree, V):
#     S = stock_lattice(tree)
#     for i in 0 .. n-1:
#         Delta[i] = (value spread across date i+1's adjacent nodes)
#                    / (price spread across the same nodes)      # length i+1
#         B[i]     = V[i] - Delta[i] * S[i]
#
# walk_hedge(tree, X0, Delta, path):
#     X[0] = X0;  price = S0;  heads = 0
#     for i, toss in enumerate(path):
#         shares    = Delta[i][heads]
#         new_price = price * (u if toss == 1 else d)
#         X[i + 1]  = shares * new_price + (1 + r) * (X[i] - shares * price)
#         price, heads = new_price, heads + toss
# ```
#
# </details>

# %%
# The module's numbers: 0.719 shares at the root of the paper's tree, and on
# Shreve's three-period call Δ_1(H) = 0.9 — the value the error-diagnosis
# exercise of the multiperiod lesson corrected 0.72 to.
_Vc = european_values(CRR79, call(80.0))
_D, _B = hedge(CRR79, _Vc)
assert np.isclose(_D[0][0], 0.719, atol=5e-4)
assert np.isclose(hedge(SHREVE, european_values(SHREVE, call(5.0)))[0][1][1], 0.9)
# Shares plus money market equals the claim at the node the position is taken.
for _i in range(3):
    assert np.allclose(_D[_i] * stock_lattice(CRR79)[_i] + _B[_i], _Vc[_i])

# %% [markdown]
# The replication theorem says the walk ends on the payoff along every path,
# and equals the claim's value at every intermediate node too. Measure it:
# the maximum absolute mismatch between the hedge's wealth and the value
# lattice, over all $2^n$ paths of the tree, should be rounding noise. The
# broken run below hedges with ten percent too few shares; its mismatch is
# the plot to remember when a checkpoint goes red — a wrong delta shows up
# one toss after it is used, and it does not heal.

# %%
def max_hedge_mismatch(tree, V):
    """Largest |wealth − claim value| over every date of every path, hedging V from V[0][0]."""
    Delta, _ = hedge(tree, V)
    worst = 0.0
    for path in all_paths(tree.n):
        X = walk_hedge(tree, V[0][0], Delta, path)
        heads = np.concatenate([[0], np.cumsum(path)])
        claim = np.array([V[i][heads[i]] for i in range(tree.n + 1)])
        worst = max(worst, np.abs(X - claim).max())
    return worst


for _tree, _payoff in ((SHREVE, call(5.0)), (CRR79, call(80.0)), (crr_tree(100.0, 0.05, 0.4, 1.0, 8), put(105.0))):
    _V = european_values(_tree, _payoff)
    assert max_hedge_mismatch(_tree, _V) < 1e-10, "the hedge misses the claim somewhere"
print("max |wealth − claim| over all paths of three trees: below 1e-10")

_path = np.array([1, 0, 0])
_V = european_values(SHREVE, call(5.0))
_D, _ = hedge(SHREVE, _V)
_heads = np.concatenate([[0], np.cumsum(_path)])
_claim = np.array([_V[i][_heads[i]] for i in range(4)])
plot_walk(walk_hedge(SHREVE, _V[0][0], _D, _path), _claim, "correct Δ along H T T")
plot_walk(walk_hedge(SHREVE, _V[0][0], [0.9 * d for d in _D], _path), _claim, "Δ ten percent short")
plt.show()

# %%
distill.check(
    "replicating-portfolio",
    lambda S0, u, d, r, n, K: tuple(flat(x) for x in hedge(Tree(S0, u, d, r, n), european_values(Tree(S0, u, d, r, n), call(K)))),
)

# %%
def _walk_check(S0, u, d, r, n, K, path):
    tree = Tree(S0, u, d, r, n)
    V = european_values(tree, call(K))
    Delta, _ = hedge(tree, V)
    return walk_hedge(tree, V[0][0], Delta, path)


distill.check("hedge-walk", _walk_check)

# %% [markdown]
# ## 5. American claims: a maximum at every node
#
# An American claim may be exercised at any date for its intrinsic value
# $g(S_i)$. The backward pass changes in one place: the node's value is the
# larger of exercising now and continuing, where the continuation value is
# exactly section 3's discounted average of the two children,
#
# $$V_i(j) = \max\Bigl\{\, g(S_i(j)),\ \tfrac{1}{1 + r}\bigl(\tilde p\, V_{i+1}(j + 1) + \tilde q\, V_{i+1}(j)\bigr) \Bigr\}.$$
#
# Return the value lattice and, beside it, the exercise lattice: a boolean
# per node that is `True` where exercising strictly beats continuing. The
# strictness is a convention the checkpoint relies on: a node where both
# sides are zero — a put far out of the money — is not an exercise node. On
# the last date, exercising beats continuing whenever the payoff is
# positive.

# %%
def american_values(tree, payoff):
    """Value and exercise lattices of an American claim with intrinsic value payoff(S_i).

    Args:
        tree: the market.
        payoff: function mapping an array of prices to an array of intrinsic values.
    Returns:
        (V, exercised): two lists of tree.n + 1 arrays. V[i][j] is the claim's
        value at node (i, j); exercised[i][j] is True where payoff(S_i(j)) is
        strictly greater than the continuation value (on the last date: where
        the payoff is strictly positive).
    """
    # BEGIN SOLUTION
    S = stock_lattice(tree)
    p = risk_neutral_prob(tree)
    disc = 1.0 / (1.0 + tree.r)
    V = [None] * (tree.n + 1)
    E = [None] * (tree.n + 1)
    intrinsic = payoff(S[tree.n])
    V[tree.n], E[tree.n] = intrinsic, intrinsic > 0
    for i in range(tree.n - 1, -1, -1):
        cont = disc * (p * V[i + 1][1:] + (1 - p) * V[i + 1][:-1])
        intrinsic = payoff(S[i])
        V[i] = np.maximum(intrinsic, cont)
        E[i] = intrinsic > cont
    return V, E
    # END SOLUTION

# %%
# The module's $5 put on the two-period tree: 1.36 American against 0.96
# European, exercised at S_1 = 2 and nowhere else before expiry.
_two = Tree(4.0, 2.0, 0.5, 0.25, 2)
_V, _E = american_values(_two, put(5.0))
assert np.isclose(_V[0][0], 1.36)
assert np.isclose(european_values(_two, put(5.0))[0][0], 0.96)
assert list(_E[1]) == [True, False] and not _E[0][0]
# An American claim is worth at least its European twin at every node, and the
# American call on a non-dividend stock is worth exactly it (section 7).
_Va, _ = american_values(SHREVE, put(5.0))
_Ve = european_values(SHREVE, put(5.0))
assert all(np.all(a >= e - 1e-12) for a, e in zip(_Va, _Ve))
assert all(np.allclose(a, e) for a, e in zip(american_values(SHREVE, call(5.0))[0], european_values(SHREVE, call(5.0))))

plt.figure(figsize=(6, 4))
draw_lattice(SHREVE, stock_lattice(SHREVE), _Va, american_values(SHREVE, put(5.0))[1])
plt.title("the three-period $5 American put; filled nodes exercise", fontsize=9)
plt.show()

# %%
def _american_check(S0, u, d, r, n, K):
    V, E = american_values(Tree(S0, u, d, r, n), put(K))
    return flat(V), flat(E)


distill.check("american-put", _american_check)

# %% [markdown]
# ## 6. The exercise boundary as data
#
# On the three-period tree the exercise region is a handful of nodes. On a
# calibrated tree with fifty steps it is a region of the $(i, S)$ plane, and
# the object the perpetual-put lesson studies is its upper edge: on each date
# the highest stock price at which exercising still beats continuing. Extract
# it from the exercise lattice — one number per date, the price of the
# highest exercising node, and $0$ on a date with no exercise node at all.
#
# The shape to expect is not monotone in the naive sense. Dates of the same
# parity share their price levels ($S_0 u^{2j - i}$), while adjacent dates
# interleave them, so the highest exercising node can step down from one
# date to the next even though the underlying boundary rises toward the
# strike. Within one parity class it never steps down: if exercising beats
# continuing at a price on date $i$, it does so at the same price two dates
# later, when there is less time left for continuation to be worth anything.
# The local assertions check exactly that.

# %%
def exercise_boundary(tree, S, exercised):
    """The critical stock price on each date: the highest exercising node.

    Args:
        tree: the market.
        S: stock lattice from stock_lattice.
        exercised: exercise lattice from american_values.
    Returns:
        (tree.n + 1,) array b with b[i] the price of the highest node on date i
        whose exercise flag is True, or 0.0 on a date with no exercise node.
    """
    # BEGIN SOLUTION
    b = np.zeros(tree.n + 1)
    for i in range(tree.n + 1):
        hits = np.flatnonzero(exercised[i])
        if hits.size:
            b[i] = S[i][hits.max()]
    return b
    # END SOLUTION

# %%
_tree = crr_tree(40.0, 0.07, 0.3, 3.0, 50)
_S = stock_lattice(_tree)
_V, _E = american_values(_tree, put(45.0))
_b = exercise_boundary(_tree, _S, _E)
assert _b.shape == (51,)
assert 0 < _b[-1] < 45.0                       # the last date exercises everything below the strike
assert np.all(np.diff(_b[0::2]) > -1e-9) and np.all(np.diff(_b[1::2]) > -1e-9)   # monotone within a parity class
assert _b[0] < _b[-1]                          # and it rises toward the strike
plot_boundary(_tree, _S, _E, _b, 45.0)
plt.show()

# %%
def _boundary_check(S0, K, rate, sigma, T, n):
    tree = crr_tree(S0, rate, sigma, T, n)
    S = stock_lattice(tree)
    _, E = american_values(tree, put(K))
    return exercise_boundary(tree, S, E)


distill.check("exercise-boundary", _boundary_check)

# %% [markdown]
# ## 7. The call that is never exercised
#
# Run the American pass on a call on the same calibrated tree and count the
# exercise nodes. The cell is complete; the task is the paragraph after it.

# %%
_tree = crr_tree(40.0, 0.07, 0.3, 3.0, 200)
_Vc, _Ec = american_values(_tree, call(45.0))
n_exercise = int(sum(np.count_nonzero(e) for e in _Ec[:-1]))
print(f"exercise nodes before expiry: {n_exercise} of {200 * 201 // 2}")
print(f"American call {_Vc[0][0]:.6f}  European call {european_values(_tree, call(45.0))[0][0]:.6f}")

# %% [markdown]
# In a few sentences: which theorem of the module predicted the count, what
# are its hypotheses, and — for at least one of them — what would the count
# do if that hypothesis failed? (Section 6 is a worked instance of one
# failure.) Write the answer as a string and submit it; a model reads it
# against a rubric that grades the theorem, the hypotheses named and the
# failure case, not the prose.

# %%
distill.submit_review(
    "no-early-exercise-call",
    "The count is zero because of the convex-payoff theorem, Shreve's Theorem 4.5.1: "
    "in an arbitrage-free tree with r >= 0, an American claim whose intrinsic value "
    "g(S) is a convex function with g(0) = 0 has the European price at every node, "
    "and waiting until expiry is optimal. The three hypotheses are convexity of g, "
    "g(0) = 0, and a non-negative rate; the stock also pays no dividend, which is "
    "what makes the discounted stock a martingale so that conditional Jensen applies. "
    "The call payoff (S - K)^+ is convex and vanishes at 0, and r > 0 on the CRR tree. "
    "A put fails g(0) = 0 (g(0) = K), which is why section 6 found exercise nodes; a "
    "negative rate or a dividend breaks the chord inequality and restores early exercise "
    "for the call.",
)

# %% [markdown]
# ## 8. Open task: the continuous limit of the American put
#
# The price of an American put depends on the tree only through its
# calibration, and as the step count grows it converges to a limit that the
# next module identifies as the continuous-time price. The convergence is
# not monotone. Price the first put of the table below — $S_0 = 40$,
# $K = 45$, $r = 7\%$, $\sigma = 30\%$, three years, the parameters of the
# Bozoudis–Boutsikas binomial-versus-reference demonstration — for every
# step count from $n = 10$ to $n = 200$ and plot the result with
# `plot_convergence`. The sawtooth is a property of the lattice, not of your
# code: the strike falls between two price levels, and which side it falls
# on alternates with $n$.

# %%
holdout = np.loadtxt("data/holdout_puts.csv", delimiter=",", skiprows=1)   # columns: S0, K, r, sigma, T
print(holdout)

ns = np.arange(10, 201)
# `sweep`: the American put price at each step count in `ns`, same order.
# BEGIN SOLUTION
S0, K, rate, sigma, T = holdout[0]
sweep = np.array([american_values(crr_tree(S0, rate, sigma, T, int(n)), put(K))[0][0][0] for n in ns])
# END SOLUTION
plot_convergence(ns, sweep)
plt.show()

# %% [markdown]
# Now the graded part. `data/holdout_puts.csv` lists eight American puts.
# Price every one of them, in the order given, to within four thousandths
# of a cent of the continuous limit. The wire unit is **tenths of a cent**
# — submit $1000 \times$ the dollar prices — and the server scores the
# root-mean-square error against a reference built from lattices of
# $40{,}000$ and $40{,}001$ steps, averaged; that reference is itself within
# about a thousandth of a cent of the limit on every put. The threshold is an
# RMSE of $0.04$ in the wire unit: four thousandths of a cent.
#
# Read the plot before starting. The sawtooth's amplitude shrinks like
# $1/n$, and measured against the reference the plain price at $n = 2000$
# is off by $0.0275$ cents RMS across the eight puts, at $n = 8000$ by
# $0.0087$ — seven times and twice the threshold — and a plain lattice
# first passes near $n = 16{,}000$: a hundred and thirty million nodes,
# which section 5's pricer stores three times over. The task is not a
# bigger tree. It is an idea about the sawtooth, or a pass that fits in
# memory, or both — the graded number is the same either way. Nothing is
# scaffolded here: `crr_tree`, your pricer and the plot above are the tools,
# and the notebook's memory is the constraint. Try it before opening the
# hints.

# %%
# `prices`: the eight American put prices, one per row of `holdout`, in dollars.
# BEGIN SOLUTION
def put_price(S0, K, rate, sigma, T, n):
    """American put on an n-step CRR tree, holding one date's vectors at a time."""
    tree = crr_tree(S0, rate, sigma, T, n)
    p, disc = risk_neutral_prob(tree), 1.0 / (1.0 + tree.r)
    j = np.arange(n + 1)
    S = tree.S0 * tree.u**j * tree.d ** (n - j)
    V = np.maximum(K - S, 0.0)
    for _ in range(n):
        S = S[:-1] * tree.u          # date i's node j is date i + 1's node j, one down move undone
        V = np.maximum(K - S, disc * (p * V[1:] + (1 - p) * V[:-1]))
    return V[0]


N = 16000
prices = np.array([(put_price(*row, N) + put_price(*row, N + 1)) / 2 for row in holdout])
# END SOLUTION
print(np.round(prices, 5))
distill.submit_predictions("converged-price", 1000 * prices)

# %% [markdown]
# <details><summary>Hint 1 — the sawtooth</summary>
#
# Adjacent step counts sit on opposite sides of the sawtooth, so averaging
# the prices at $n$ and $n + 1$ cancels most of the oscillation. Measured
# against the reference, in cents RMS across the eight puts: the average at
# $2000$ and $2001$ is off by $0.018$ where the plain price at $2000$ is off
# by $0.0275$; at $4000$ the average is $0.008$ against a plain $0.0145$; at
# $8000$ it is $0.0021$ against $0.0087$. Up to a few thousand steps the
# average is worth about a doubling of $n$ — the average at $500$ ($0.061$)
# is still worse than the plain price at $2000$, and the average at $2000$
# is about level with the plain price at $4000$ — and beyond that it is
# worth more: the average at $8000$ beats the plain price at $16{,}000$
# ($0.0038$) and matches the plain price at $32{,}000$. So the first
# averaged pair that passes is $8000$ and $8001$, with the lattice pricer
# as it stands, and a Richardson step on two averaged pairs, $2\,\bar
# P_{2n} - \bar P_n$, passes from $n = 2000$ — but only just, and the
# averaged pair is the step that matters.
#
# </details>
#
# <details><summary>Hint 2 — memory</summary>
#
# The backward pass never needs more than one date. Keep two vectors, the
# prices and the values on the current date, and walk them back: the price
# vector of date $i$ is date $i + 1$'s with its top entry dropped and every
# entry multiplied by $u$ (undoing one down move, since $d = 1/u$), and the
# value vector is the maximum of the intrinsic value and the discounted
# average of adjacent entries — section 5's line, on vectors instead of a
# lattice. Two arrays of length $n + 1$ and $n$ iterations: $n = 16{,}000$
# is a second, and a pair at $16{,}000$ passes with room to spare.
#
# ```
# put_price(S0, K, rate, sigma, T, n):
#     tree = crr_tree(...);  p = risk_neutral_prob(tree);  disc = 1 / (1 + r)
#     S = terminal prices, length n + 1;  V = max(K - S, 0)
#     repeat n times:
#         S = S[:-1] * u
#         V = max(K - S, disc * (p * V[1:] + (1 - p) * V[:-1]))
#     return V[0]
# ```
#
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# With `put_price` written as in hint 2:
#
# `prices = np.array([(put_price(*row, 16000) + put_price(*row, 16001)) / 2 for row in holdout])`
#
# </details>
#
# ---
#
# What now exists: a pricer whose hedge misses the claim by less than
# $10^{-10}$ on every path of every tree it was asked about, an exercise
# boundary read off as numbers, and a convergence study whose limit the
# next module computes in closed form.

# %%
distill.dump()
