# Early exercise in real markets — research brief

Lesson: `early-exercise-in-practice` (module: american-options, core, planned). NEW. MODULE 3 APPLICATION (L16).
Goal: Apply the no-early-exercise and Snell-envelope results to exchange-traded options and diagnose when real American options are exercised.

## Sources
- Hull §11.5 (never exercise the American call early — the practitioner statement, with the "sell it instead" refinement), §11.7 + §15.12 (dividends change the verdict; exercise just before ex-date), §26.3 briefly (Bermudan as the between case — one sentence, no catalog).
- Hull Ch.10 §10.8 (the OCC, assignment, auto-exercise thresholds) — mechanics needed to read the artifact.
- Hull Business Snapshot 12.1 "Losing Money with Box Spreads" (§12.3): a supposedly riskless box destroyed by early assignment — the module's cautionary artifact.
- CRR 1979 §6: the dividend-adjusted backward induction ($C(n,i,j)$ with $(1-\delta)^v S$; the critical price $\hat S$ above which exercise is immediate) — the algorithmic answer to dividends, already in the founding paper.
- Shreve II §8.5.2 (dividend recursion, one line) and Ch.8 Notes: the Longstaff–Schwartz pointer for when trees give out — cite as the standard industrial method beyond this course's scope.

## Key points
1. Theorem meets tape: on non-dividend stocks, American calls should never be exercised early (module theorem) — and the observable consequence: their market premia match European values; deep-ITM American calls trade at parity + time value, and the rational way out of a position is SALE, not exercise (exercise burns $K$'s interest and the volatility value).
2. Dividends as the licensed exception: the two-date comparison (exercise cum-dividend at $S - K$ vs hold through ex-date) worked in numbers; CRR §6's critical price $\hat S$: exercise is a race between the dividend capture and the strike's interest. The backward induction absorbs it with one modification — the module's algorithm was already general enough.
3. Puts exercise early with no dividend needed (module result); the practical reading: deep-ITM puts on low-rate names, assignment risk for the short side, auto-exercise at expiry (OCC 0.01 threshold).
4. The box-spread mishap read closely (L16 artifact #2): long call spread + short put spread = sure $K_2 - K_1$ at expiry — for EUROPEAN options; with American legs, early assignment on the short deep-ITM leg breaks the offset and the "riskless" position loses real money. Which module result diagnoses it: the short put's counterparty held a $\tau$ the box seller ignored — pricing must run over ALL adapted $\tau$, not the convenient one.
5. Departures from the idealisation (L16): assignment is a lottery across short holders (not a chosen $\tau$); exercise decisions carry fees and margin effects; the tree's known $u, d, r$ vs actual dividend uncertainty; and for many-date path problems the industry swaps trees for regression Monte Carlo (Longstaff–Schwartz, pointer only).

## Set pieces & gems
- The box-spread Business Snapshot as a worked post-mortem: positions, the assignment event, the P&L hole — with the module-language diagnosis.
- The dividend-capture computation on real-ish numbers (a \$0.50 quarterly dividend, 30 days to expiry, 1% rate): the inequality that decides.
- The "sell, don't exercise" decomposition: exercise value $S-K$ vs sale value $= S - K + \text{time value}$, in a two-bar figure.

## Pitfalls
- Do not turn this into an options-trading lesson; every claim must be an application of a module theorem, named.
- The OCC/assignment mechanics get exactly the vocabulary the artifacts need (L11c: ≤3 new terms per section).
- "American options are worth more, so exercise must sometimes be optimal" — near-true; the call case shows the premium can be zero. Keep the quantifiers exact.
- No Bermudan/exotic taxonomy; one sentence each at most (anti-sprawl).

## APPLICATION spec (L16)
- Artifact: exchange-traded American equity options as a system — OCC exercise/assignment mechanics, the box-spread failure case (Hull BS 12.1), and dividend-driven exercise around ex-dates.
- Module results used: Theorem 4.5.1 (no early exercise for convex payoffs without dividends), the Snell-envelope pricing over all adapted stopping times, the backward-induction algorithm with the CRR dividend adjustment, put early-exercise from american-derivatives.
- Departures from idealisation: assignment lotteries and pin risk, discrete dividends of uncertain size, transaction costs, and regression Monte Carlo replacing trees at scale (Longstaff–Schwartz pointer).

## FIGURE PLAN
- draw: Sell vs exercise — two bars decomposing a deep-ITM call's market value into intrinsic + time value; exercising collects the left bar only. Single Figure.
- draw: The dividend race — timeline around an ex-date: dividend capture (one arrow in) vs strike interest + optionality (arrows out); the critical price $\hat S$ as the balance point, with CRR's recursion boxed beside. Inspired by CRR §6.
- draw: FigureSequence (3 frames) — the box spread: frame 1 the four legs and the sure terminal payoff; frame 2 early assignment hits the short put leg (one leg vanishes, replaced by stock + cash); frame 3 the now-unbalanced position's exposure. One change per frame; warning color on the assignment.
- draw: The exercise decision as the module's node diagram — reuse of american-derivatives' exercise-or-continue panel, now populated with the dividend case's numbers (C5 spiral, same figure family at new depth).
- draw: Boundary vs calendar — the 6-period put boundary from the previous lesson's forward exercise, redrawn with a dividend date inserted: the boundary jumps at the ex-date. Original, quantitative.

## EXERCISE PLAN
1. Warm-up: a deep-ITM American call, $S = 120$, $K = 100$, 60 days, $r = 4\%$, no dividend: compute what exercising today forfeits (interest on $K$ plus the put value via parity) and state the rational action.
2. Research-shaped: reproduce the box-spread arithmetic of Hull's snapshot: build a 100/110 box from quoted-style prices, show its European value $= (K_2 - K_1)e^{-rT}$, then walk the assignment scenario and compute the loss.
3. Claim to refute: "early exercise of an American call is always irrational." Refute with the cum-dividend counterexample; state the exact hypothesis of Theorem 4.5.1 that the dividend violates (the payoff comparison uses the stock's martingale property under $\tilde P$, which the dividend drop breaks).
4. Boundary probe: as the dividend $D \to 0$, show the critical price $\hat S \to \infty$ — the exception continuously vanishes into the theorem.
5. Mixed/spaced (E3): using module 1's parity, derive the American put lower bound $P \ge K - S$ vs the European $p \ge Ke^{-rT} - S$, and identify on which side the early-exercise premium lives.
6. FORWARD (E7): price the American put on a 50-step tree and time it; estimate the node count for a 50-step problem with a path-dependent dividend rule, and note where the tree's economy dies. Solution: this cost wall is why the lab builds the tree pricer now and why industry adds Monte Carlo later; the course's own Monte Carlo module removes the wall for European claims → Ref monte-carlo-pricing.

## ARC
- Inherits: the full American theory — Snell envelope, $\tau^*$, Theorem 4.5.1, the boundary (all module 3).
- Contributes: the theory held against the listed-options system: which theorems the market obeys daily, which exception (dividends) the founding paper already priced, and one documented failure (the box) diagnosed in module language.
- Hands off: the lab makes the learner build the pricer these markets assume → binomial-pricer-lab.
- Spine step: "An American claim adds a choice…" (step 3).
