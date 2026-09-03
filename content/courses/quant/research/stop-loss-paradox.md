# The stop-loss hedge paradox — research brief

Lesson: `stop-loss-paradox` (module: continuous-limit, core, planned). NEW. MODULE 4 APPLICATION (L16 — a computational study, Hull's Table 19.1 reproduced).
Goal: Explain via quadratic variation why the stop-loss hedge's cost does not converge to the option's value, reproducing Hull's simulation as the evidence.

## Sources
- Hull §19.3: the stop-loss strategy for a written call — buy the stock when $S$ rises through $K$, sell when it falls through; the naive accounting (cost $= S_0$ if $S_0 > K$ else 0… ultimately $\max(S_0 - K, 0)$-like); why it fails (purchases at $K + \epsilon$, sales at $K - \epsilon$, cannot both be at $K$); Table 19.1 — the performance measure (std of hedge cost / option price) at rebalance intervals 5, 4, 2, 1 weeks, 0.5, 0.25: 1.02, 0.93, 0.82, 0.77, 0.76, 0.70 — dropping slowly and PLATEAUING, versus delta hedging's steady fall (Table 19.4, next module's data). Reproduce Table 19.1's numbers.
- Shreve II Exercise 4.21 (stop-loss start-gain paradox): the strategy "hold the stock exactly when $S(t) > K$" fails to replicate in continuous time because of quadratic variation; local time as the correction. Present the ARGUMENT at sketch level with the fence stated (local time named, defined descriptively, not constructed; Exercise 4.20's smoothing construction cited).
- Shreve II §7.4.2's singular-continuity aside (running-max increases on a measure-zero set) — do NOT bring in; out of scope.
- Boyle & Emanuel 1980 named once as the systematic study of discrete-hedge P&L (paper pending full copy — flag in References as "to be obtained").

## Key points
1. The strategy stated and its naive case for working: in a world of paths with finite variation, "own the stock iff above $K$" buys and sells at exactly $K$ finitely often; terminal position replicates the call; cost ≈ forward-intrinsic. Every step of that reasoning named — because each will fail.
2. The experiment (the application's core): simulate GBM (Hull's 20-week call parameters: $S_0 = 49$, $K = 50$, $\sigma = 20\%$, $r = 5\%$, $\mu = 13\%$), implement the rule at monitoring intervals from weeks to hours, measure hedge-cost mean and dispersion; reproduce Table 19.1's plateau (~0.70 at the finest published frequency, and show it stays ~0.7 finer still). The number that refuses to fall is the lesson's finding.
3. The diagnosis, in module-4 language: each crossing trades at $K \pm$ an overshoot of size $\sim\sqrt{\Delta t}$; the number of crossings in a window grows like $1/\sqrt{\Delta t}$; product: a cost that does NOT vanish — it converges to a positive quantity, the local time at $K$ scaled by $\sigma K$. Brownian paths cross any level infinitely often (QV positive ⟹ no isolated crossings) — the finite-variation intuition dies exactly here.
4. The Itô-formula reading (Shreve Ex 4.21 sketched): $(S_T - K)^+$ is not smooth; smoothing the kink and applying Itô leaves a $\tfrac12 f''$ term that concentrates at $K$ as the smoothing sharpens — the hedge's missing cost is the payoff's second derivative (a point mass at the kink) integrated against the path's occupation of $K$. Gamma-at-the-kink foreshadows module 5's gamma everywhere (one forward sentence).
5. Verdict (the module's exit line): hedging error is second-order; a hedge ratio must come from a calculus that carries second-order terms — the Black–Scholes derivation is next.

## Set pieces & gems
- Hull Table 19.1 reproduced computationally — the plateau as the headline artifact.
- The overshoot × crossing-count scaling argument ($\sqrt{\Delta t} \times 1/\sqrt{\Delta t} = O(1)$) — two lines that explain a table.
- The smoothed-kink picture (Ex 4.20/4.21's device): $f_\epsilon''$ a narrowing spike, its integral constant — local time appearing as a limit of ordinary Itô corrections.

## Pitfalls
- The performance measure must be DEFINED before quoted (std of hedge cost / BS price — Hull's convention) or the numbers are unbound tokens (L12b).
- Local time is fenced: named, given the descriptive definition (occupation density at the level), used once; no Tanaka formula development.
- Do not let this become a "stop-loss orders are bad" trading claim; the strategy analyzed is the theoretical replication rule, and the lesson says so.
- The simulation uses the REAL-measure drift (13%) as Hull does — pricing is not involved; note the distinction (a hedge experiment, not a valuation).

## APPLICATION spec (L16)
- Artifact: Hull's stop-loss simulation (Table 19.1) — reproduced as a computational study the reader can run, extended one frequency finer to show the plateau is genuine.
- Module results used: quadratic variation and infinite crossings (brownian-motion), the Itô correction/smoothed-kink argument (ito-formula, ito-integral), GBM simulation (ito-formula).
- Departures from idealisation: the theory's limit statement (local time) vs the simulation's finite frequencies; discrete monitoring approximating continuous observation; transaction costs ignored (they make stop-loss strictly worse — one sentence).

## FIGURE PLAN
- draw: The strategy on one path — a GBM path with the level $K$; holdings shaded (in/out) below; buy/sell markers at the crossings with the overshoots exaggerated in an inset zoom. Single Figure.
- draw: The crossing ledger — FigureSequence (3 frames): frame 1 a coarse monitoring grid (few crossings, big overshoots); frame 2 finer (more crossings, smaller overshoots); frame 3 the cost table: count × size = constant. The scaling argument as pictures.
- draw: Table 19.1 as a chart — performance measure vs monitoring interval (log axis), Hull's published points, our reproduction overlaid, one finer point added; the plateau annotated against the $1/\sqrt{n}$ reference slope delta hedging will follow (dashed, "next module"). The lesson's headline figure.
- draw: The smoothed kink — $(x-K)^+$ with two smoothings $f_\epsilon$; below, $f_\epsilon''$ as narrowing spikes of constant area; the Itô $\tfrac12\int f_\epsilon''\,d[S,S]$ term labeled "does not vanish". Inspired by Shreve Ex 4.20.
- draw: Cost distribution histograms — hedge-cost histograms at weekly vs hourly monitoring, nearly identical spread; beside them (grey, faded) the delta-hedge histogram at hourly from module 5's data as the contrast to come. Original.

## EXERCISE PLAN
1. Warm-up: implement (or trace) the stop-loss rule on a given 20-step path; produce its trade list and terminal cost; compare with the naive prediction.
2. Research-shaped (the lesson's genre): reproduce Hull's Table 19.1 at the five published frequencies with 1,000 paths; report your performance measures with standard errors and state what counts as agreement (within simulation error of Hull's figures).
3. Boundary probe: run the same rule on a FINITE-VARIATION path (a smoothed/filtered version of the same Brownian path). Show the cost now vanishes as monitoring refines — the paradox is a property of roughness, not of the rule.
4. Claim to refute: "monitoring hourly instead of weekly should catch crossings earlier and eliminate the overshoot cost." Refute with the scaling ledger: overshoot shrinks as $\sqrt{\Delta t}$ but crossings multiply as $1/\sqrt{\Delta t}$; name the QV fact behind the crossing count.
5. Derivation skipped: from the smoothed-kink Itô computation, derive that the residual cost equals $\tfrac12\sigma^2K^2\int f_\epsilon''(S)\,dt$-type terms and argue its $\epsilon \to 0$ limit is monitoring-frequency-independent — why the plateau is exactly flat in theory.
6. FORWARD (E7): compute the discrete delta of the call payoff smoothed at scale $\epsilon$ ($f_\epsilon'$) and plot it against $S$ — a ramp from 0 to 1 around $K$. Solution: the ramp is the shape of $N(d_1)$; the hedge that works holds the RAMP amount, not the indicator, and deriving the exact ramp is the next lesson → Ref black-scholes-pde.

## ARC
- Inherits: the complete Itô toolkit (module 4), especially QV and the smoothed-kink use of the formula.
- Contributes: the module cashed on a famous failure — the naive hedge's cost measured (Hull's table reproduced) and explained; hedging revealed as a second-order problem.
- Hands off: the hedge that carries the second-order term correctly — Black–Scholes — opens module 5.
- Spine step: "Refining the tree does not smooth the randomness away…" (step 4, closing item).
