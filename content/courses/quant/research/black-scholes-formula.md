# The Black–Scholes formula — research brief

Lesson: `black-scholes-formula` (module: black-scholes, core, planned). NEW.
Goal: Compute European option prices from the Black–Scholes formula and analyze its anatomy, limits, and convergence from the binomial model.

## Sources
- Shreve II §4.5.4 (the solution 4.5.19–4.5.22 with boundary conditions) and §4.5.6 (put–call parity on the closed forms).
- Black & Scholes 1973: the formula (eq 13), the hedge ratio $w_x = N(d_1)$ (eq 14), the elasticity > 1 remark, and the paper's own flag that the expected return does not appear (p.645) — the historical shock, with Sprenkle/Samuelson's dead-end formulas (pp.639–641) as the contrast; the empirical postscript (buyers overpay, writers receive about model value, low-variance stocks misjudged — pp.652–653) as a closing Remark.
- Hull §15.8–15.9 ($N(d_2)$ = risk-neutral exercise probability; $S_0N(d_1)e^{rT}$ as the conditional expected stock value; numeric N(x) computation), §15.3 + Business Snapshot 15.1 (the μ vs μ−σ²/2 compounding trap — 15/20/30/20/−25% averaging 14% but compounding to 12.4%/yr).
- CRR 1979 §5 (the convergence proof's statement: $\phi[a;n,p'] \to N(d_1)$ etc.) and §6 Table 2 (binomial vs BS values at n = 5/20/∞ across strikes and vols: \$0.25 off at n=5, \$0.07 at n=20, exact to the penny by n=150).
- Wolfram convergence demonstration: the sawtooth (Snapshots 1–4) — non-monotone convergence; note its reference is an American put but the sawtooth is generic to CRR trees; use the European analogue in our redraw and the snapshot as a source image.

## Key points
1. The formula stated with $d_{1,2}$ unpacked; a full numeric worked example (Hull's $S_0=42, K=40, r=10\%, \sigma=20\%, T=0.5$: $c = 4.76$, $p = 0.81$) with every intermediate digit (L7 standard).
2. Anatomy: derive the reading $c = e^{-rT}[\tilde E(S_T \mathbb 1_{S_T>K}) - K\tilde P(S_T > K)]$ — $N(d_2)$ as exercise probability under the risk-neutral measure, $S_0N(d_1)$ as the discounted conditional stock leg; note honestly this reading ANTICIPATES module 6 (the full integral derivation lives there); here it is verified by differentiating/limits, not derived.
3. Limits and edges, each computed: $t \to T$ (kink recovered); $\sigma \to 0$ (forward-intrinsic — matches the PDE probe); $\sigma \to \infty$ ($c \to S_0$: the module-1 upper bound attained in the limit); deep ITM/OTM asymptotics; monotonicity in every argument (vega > 0 flagged for the implied-vol module).
4. Parity verified algebraically on the closed forms ($N(-d) = 1 - N(d)$); the put formula read off.
5. Drift independence as history: Sprenkle/Samuelson/Boness had formulas requiring expected returns and risk preferences nobody could measure; BS's has five observables (and one — σ — that will turn out to be an opinion after all; one dry forward sentence to module 7).
6. Binomial convergence: CRR's calibration recap (Ref), Table 2's numbers, and the sawtooth — convergence is $O(1/n)$ but oscillatory (even/odd node placement around $K$); the practical rule (average adjacent $n$, or place a node at $K$) in one Remark.

## Set pieces & gems
- The full worked 4.76/0.81 computation — the lesson's central Example.
- The μ-vs-μ−σ²/2 Business Snapshot (arithmetic 14% vs realized 12.4%/yr) — the third meeting with the $-\tfrac12\sigma^2$, now in returns-reporting clothes; ties to ito-formula's median/mean fan (Ref).
- CRR Table 2's "penny by n = 150" — a quotable calibration for how discrete the continuum is.
- The BS empirical postscript (1972 tests) — the formula audited by its own authors in its birth year.

## Pitfalls
- $N(d_1)$ is NOT the exercise probability — the classic confusion; box the near-miss: $N(d_2) = \tilde P(S_T > K)$; $N(d_1)$ is the delta / the stock-measure probability (the second fact can be stated without numeraire machinery as "the conditional-value weight").
- All probabilities in the anatomy are risk-neutral; a real-world reading of $N(d_2)$ is wrong twice over (measure and drift) — L13 refutation slot.
- The sawtooth figure must be OUR computation (European call, CRR tree) — the Wolfram snapshots are American-put frames; use one as a source image with an honest caption, or skip; do not pass one off as the European case.
- Keep Greeks OUT (next lesson) except the one vega>0 sentence the anatomy needs.

## FIGURE PLAN
- draw: The formula dissected in place — $c = S_0N(d_1) - Ke^{-rT}N(d_2)$ with underbraces to "stock leg (conditional value)" and "strike leg (exercise probability × PV)", each brace dropping to a mini terminal-density plot with the relevant region shaded. Voita rule 7. The lesson's signature.
- draw: The price surface's slices — $c$ vs $S$ at three times to expiry converging to the kink (B&R Fig 3.14's idea), with the module-1 bounds drawn as the corridor the curves live in (C5 spiral of the bounds figure). Single Figure.
- draw: The worked example as a computation card — the 4.76 computation laid out: inputs → $d_1, d_2$ → $N$ values → legs → price; every number visible. Original.
- draw: Convergence — binomial price vs $n$ (our European computation): the sawtooth around the BS line, with CRR Table 2's checkpoints marked; inset zoom at $n = 100$–150 where it pins to a penny. Inspired by the Wolfram demonstration.
- source: convergenceo-snapshot-3 — the Wolfram demonstration's high-vol American-put frame with the binomial series crossing the reference repeatedly; save as `tree-convergence-sawtooth`; the reader must see the three method traces and the dashed reference; placement: float right beside the convergence Remark; caption states it is the demonstration's American-put study — the same phenomenon our European plot shows.
- draw: The dead-end formulas — a small table: Sprenkle/Boness/Samuelson formulas' unmeasurable inputs (ρ, expected return, utility parameter) vs BS's five observables; the last column crossed out. Original, from BS 1973's pp.639–641 review.

## EXERCISE PLAN
1. Warm-up: compute the price of the $S_0 = 100$, $K = 95$, $\sigma = 30\%$, $r = 3\%$, $T = 0.25$ put by formula, then via parity from the call; digits must agree.
2. Derivation skipped: differentiate the formula w.r.t. $S_0$ and show $\partial c/\partial S_0 = N(d_1)$ exactly — the terms from $d_{1,2}$'s dependence on $S_0$ cancel (the classic surprise cancellation); this hands the next lesson its delta.
3. Boundary probe: expand $c$ for at-the-money-forward ($S_0 = Ke^{-rT}$) in small $\sigma\sqrt{T}$ and derive $c \approx 0.4\,S_0\sigma\sqrt{T}$ — the trader's approximation; state its error at $\sigma\sqrt T = 0.3$.
4. Claim to refute: "$N(d_2)$ is the probability the option finishes in the money, so a 25-delta option has roughly a 25% chance of paying off in the real world." Two errors: measure ($\tilde P$ vs $P$) and object ($N(d_1)$ vs $N(d_2)$); quantify both on the worked example with $\mu = 13\%$.
5. Research-shaped: reproduce one cell of CRR Table 2 (Jan/35/σ=0.3-style parameters): compute the CRR tree price at n = 5, 20, 150 and match the paper's convergence pattern.
6. Mixed/spaced (E3): verify the formula satisfies the module-1 bounds for all inputs, and find which input's limit attains each bound (σ→∞ for the upper; σ→0 for the lower).
7. FORWARD (E7): fix the market price of the worked example's call at 4.76 and perturb σ: tabulate price vs σ ∈ {15%, 20%, 25%, 30%} and note strict monotonicity. Solution: monotonicity makes σ recoverable from price — the inversion that defines implied volatility → Ref implied-volatility.

## ARC
- Inherits: the PDE and the verification duty (black-scholes-pde); the tree calibration and CLT limit (module 4).
- Contributes: the formula as a working instrument — anatomy, edges, parity, the drift-free surprise, and its distance from the tree quantified.
- Hands off: the formula's derivatives are a hedger's risk inventory → greeks-hedging-error; its inversion is the market's quoting device → implied-volatility (module 7).
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5).
