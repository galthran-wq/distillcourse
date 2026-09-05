# Model-free bounds and put–call parity — research brief

Lesson: `static-bounds-parity` (module: arbitrage, core, planned). NEW.
Goal: Derive dominance bounds, put–call parity, and the no-early-exercise theorem for calls using only no-arbitrage.

## Sources
- Merton 1973, §2: Theorem 1 ($f(S,\tau;E) \ge \max[0, S - EP(\tau)]$, pure dominance proof, p.144), Theorems 2–3 (no premature exercise absent payouts; perpetual warrant = stock), Theorems 4–6 (monotonicity/convexity in the strike), Theorem 8 (value nondecreasing in Rothschild–Stiglitz riskiness — state, don't prove). §4: Theorem 12 put–call parity via two replicating portfolios (pp.157–159); Theorem 13 (American puts do carry an early-exercise premium — the asymmetry).
- Hull Ch.11: §11.3 bounds (eqs 11.4–11.9), §11.4 parity + Business Snapshot 11.1 (equity as a call on the firm), §11.5–11.6 the call/put early-exercise asymmetry with the intuition, §11.7 dividends.
- Shreve I §4.5 Theorem 4.5.1 is the tree-model version of no-early-exercise — mention as forthcoming, do not prove here (it needs conditional Jensen; the module-3 lesson owns it).

## Key points
1. The two-portfolio dominance pattern established as a reusable proof device: a table, rows = portfolios A/B, columns = terminal states ($S_T \le K$, $S_T > K$); if A never pays less than B, then A costs at least as much today — else the explicit arbitrage (buy A, sell B). Every result in the lesson is one instance of this table.
2. Bounds proved: $c \le S_0$; $c \ge \max(0, S_0 - Ke^{-rT})$ (Merton Thm 1, the course's cleanest "not an opinion" statement — no distribution, no model, no preferences beyond more-is-better); the put analogues $p \le Ke^{-rT}$, $p \ge \max(0, Ke^{-rT} - S_0)$.
3. Put–call parity derived twice (Merton §4's two portfolios): stock + put vs call + bond both pay $\max(S_T, K)$, so $c - p = S_0 - Ke^{-rT}$ — exact, distribution-free, and the single most-used identity in the rest of the course (it recurs in option-chain-bounds, black-scholes-formula, implied-volatility, vol-surface-lab).
4. American ≥ European trivially; the surprise: an American call on a non-dividend stock is never exercised early — alive, it is worth at least $S - Ke^{-rT} > S - K$; exercised, exactly $S - K$. Killing it burns the time value of the strike. So American call = European call. State clearly what breaks it (dividends) — module 3's application picks that up.
5. American puts are NOT symmetric (Merton Thm 13): deep enough in the money, $K - S$ now beats any waiting — early exercise is real for puts even without dividends. Plant the asymmetry; module 3 prices it.
6. The honest close: bounds are an interval, parity is a relation between two unknowns — arbitrage alone never produced a number for the call itself. Naming the missing ingredient (a model of movement) is the hand-off.

## Set pieces & gems
- Merton's Theorem 1 dominance proof, worked as the lesson's central Example with the payoff table in both states — and the ORIGINAL 1973 page shown as an artifact (source image).
- The "perpetual warrant equals the stock" paradox (Merton Thm 3 + footnote 11: real perpetual warrants do NOT trade at the stock price, because real stocks pay dividends) — a boxed Remark on what a theorem's hypotheses are for.
- Business Snapshot 11.1: parity reread as capital structure — equity is a call on the firm's assets with strike = debt face value. One paragraph, an Aside; it shows parity's reach without opening a corporate-finance detour.

## Pitfalls
- Keep every proof strictly distribution-free; if a lognormal sneaks in, the lesson's entire point is lost.
- Parity is European-only: say so, and give the American parity FAILURE (Merton Thm 13 means no exact American parity — only inequalities; do not derive them, just state the fact).
- Dividends: handle by one clean statement ($S_0 \to S_0 - PV(D)$ throughout), not a taxonomy.
- Do not do Merton's Theorems 9–10 (homogeneity/convexity in $(S,E)$ under D.I.S.P.) — off the spine.

## FIGURE PLAN
- draw: The dominance-table template — the reusable two-portfolio payoff table with the "never pays less ⟹ never costs less" arrow; rendered once as a general schema, reused (filled) in two later figures. Inspired by Merton's recurring proof pattern (the reader summary flags it as "the visual backbone").
- source: thepricing-fig1-option-value — the original 1973 Black–Scholes Figure 1 (bounds A and B with the dotted maturity curves between them); crop to the plot area; save as `bs1973-fig1`; the reader must see the 45° upper bound, the kinked lower bound, and curves T1–T3 sitting between them; placement: centered after the bounds are proved, captioned as the historical statement of exactly these bounds.
- draw: The no-arbitrage corridor — modern redraw of the same idea in house style: shaded region between $\max(0, S-Ke^{-rT})$ and $S$; annotations name the trade that punishes a price outside each edge. Single Figure.
- draw: FigureSequence (3 frames) for parity: frame 1 the two portfolios assembled (stock+put | call+bond); frame 2 terminal payoffs superimposed — identical $\max(S_T,K)$ hockey-stick; frame 3 the algebra $c - p = S_0 - Ke^{-rT}$ with each symbol color-bound to its portfolio leg. Inspired by Merton §4.
- draw: Early-exercise asymmetry panel — two small plots: call value vs $S$ always above $S-K$ for $S<\infty$ (dead value below alive value), put value vs $S$ crossing $K-S$ at a critical level; the crossing flagged "module 3 computes this point". Inspired by Hull Fig 11.x family.
- source: theoryof-theorem1-page — Merton's original Theorem 1 page; save as `merton-theorem1`; reader must be able to read the theorem statement and the first lines of the dominance proof; placement: float right beside the Example that reworks the proof, captioned as the primary source.

## EXERCISE PLAN
1. Warm-up: $S_0 = 31$, $K = 30$, $r = 10\%$, $T = 0.25$, European call quoted at 0.75. Which bound is violated, and what is the arbitrage table?
2. Derivation skipped: prove the put bounds $\max(0, Ke^{-rT} - S_0) \le p \le Ke^{-rT}$ by constructing the two dominance tables yourself.
3. Claim to refute: "an American put on a non-dividend stock, like the call, should never be exercised early — waiting always preserves optionality." Break it with the $S \to 0$ case: exercised now, $K - S \approx K$ invested at $r$ beats any possible later payoff. Name which step of the call's proof fails (the call argument compares against $S - Ke^{-rT}$; the put's mirror comparison runs the interest the wrong way).
4. Boundary probe: set $r = 0$. Show parity collapses to $c - p = S_0 - K$ and the early-exercise argument for puts loses its engine; state exactly which hypothesis ($r > 0$) each module-1 result uses.
5. Mixed/spaced (E3): re-derive the forward price of the previous lesson as a corollary of parity (long call, short put at the same strike = forward at $K$; set the package's value to zero).
6. Research-shaped: using Hull's May 2013 GOOG quotes (call 56.30, put 31.00 around $S_0=871.30$, matching expiry), test parity: back out the implied interest-plus-dividend adjustment and judge whether the deviation clears the bid–ask spread.
7. FORWARD (E7): for a two-outcome stock ($S_T \in \{uS_0, dS_0\}$), show the dominance bounds pin the call price to an interval whose two endpoints coincide — compute the resulting unique price for $S_0=4$, $u=2$, $d=\tfrac12$, $r=\tfrac14$, $K=5$. Solution: 1.20; the collapse of interval to point is the next lesson's theorem → Ref one-period-binomial.

## ARC
- Inherits: arbitrage and replication from `expectation-vs-arbitrage`; the open problem — the kinked payoff resisted static replication.
- Contributes: everything no-arbitrage alone can say about options — bounds, parity, the exercise asymmetry — via one reusable dominance device; and the honest limit: an interval, not a price.
- Hands off: closing the interval requires a model of movement; the smallest one that works is two states → `one-period-binomial`.
- Spine step: "A derivative's price is enforced, not estimated…" (step 1).
