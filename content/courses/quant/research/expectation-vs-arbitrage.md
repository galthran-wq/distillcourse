# Expectation pricing and the arbitrage alternative — research brief

Lesson: `expectation-vs-arbitrage` (module: arbitrage, core, planned). NEW.
Goal: Explain why expected payoff under real-world probabilities cannot price a forward contract, and compute the arbitrage-enforced forward price.

## Sources
- Baxter & Rennie, "The parable of the bookmaker" (pp.1–2) and Ch.1 (pp.3–9): 1.1 expectation pricing (Kolmogorov's strong law as the naive justification, the log-normal stock model, the expectation-priced forward), 1.2 arbitrage pricing (the construction strategy, the enforced price $S_0e^{rT}$), 1.3 the thesis "arbitrage lurks everywhere".
- Hull Ch.1 §1.3 (forward contracts), §1.9 (arbitrageurs), Ch.5 §5.4 (the two-portfolio forward-pricing argument, $F_0 = S_0e^{rT}$, and the explicit trades when the quote is high or low).
- Hull §1.7 ImportCo/ExportCo (hedging removes risk, not regret) — background only, one sentence at most.
- 18.S096 Lecture 19 p.2: the "two-horse-race" bookmaking analogy (secondary confirmation of the parable's framing).

## Key points
1. The bookmaker parable carried in full, in dollars: a 25%/75% horse race, correctly estimated; odds set from beliefs lose $10,000 with certainty when the money wagered is lopsided; odds set from the book break even whichever horse wins. The lesson's claim: prices come from positions that cancel, not from forecasts that average out. This is L4 concrete-first — no formula until the parable has done its work.
2. Expectation pricing looks unimprovable: for a fair-coin bet paying $1, the strong law makes 50 cents the only long-run break-even price. State this honestly — expectation pricing is not stupid, it is correct exactly when risk can be repeated and diversified away.
3. The bait-and-switch (Baxter–Rennie 1.1→1.2): the identical reasoning prices a forward at $S_0e^{(\mu+\frac12\sigma^2)T}$ under the lognormal model — and that price is wrong, because a three-line strategy (borrow $S_0$, buy the stock, deliver at $T$) manufactures the forward payoff at cost $S_0e^{rT}$ regardless of $\mu$, $\sigma$, or anyone's probabilities. Work both arbitrage directions in dollars (quote high: sell the forward, run the construction; quote low: reverse).
4. Arbitrage defined precisely (zero cost, no loss, positive probability of gain), and the market discipline argument: any other quote is a money pump, so quotes cannot stay away from the replication cost.
5. The scope statement that frames the whole course: replication priced the forward because its payoff is linear in $S_T$. A call's kinked payoff cannot be manufactured from a static stock-plus-bond position — the gap the next two lessons (bounds, then the binomial model) fill in order.

## Set pieces & gems
- The parable of the bookmaker (B&R pp.1–2) — the course's opening scene, retold dry, with the arithmetic shown.
- The coin-toss/forward bait-and-switch (B&R 1.1–1.2) — the minimal counterexample; keep their two-price contrast $S_0e^{(\mu+\sigma^2/2)T}$ vs $S_0e^{rT}$ with explicit numbers ($S_0=100$, $\mu=10\%$, $\sigma=20\%$, $r=5\%$, $T=1$: expectation says ~112.75, arbitrage says ~105.13).
- Hull §5.4's gold-forward numbers as an exercise seed (spot 1,200, r, T — compute and arbitrage a mispriced quote).

## Pitfalls
- Do not moralize ("markets are efficient") — the claim is narrower and sharper: a mispriced forward is a construction away from free money; whether anyone takes it is irrelevant to the bound.
- Say explicitly that expectation pricing is NOT globally wrong — it fails where the risk is hedgeable. Otherwise lesson 3's "risk-neutral expectation" looks like a contradiction.
- Keep $e^{rT}$ vs $(1+r)^T$ conventions pinned once (continuous compounding here; the binomial modules use per-period $1+r$; say so in a notation note).
- No "efficient market hypothesis" detour; no CAPM.

## FIGURE PLAN
- draw: The bookmaker's two books — two side-by-side ledgers (price-from-beliefs vs price-from-wagers), each row a horse, payoff columns for both race outcomes; the beliefs ledger shows a certain loss in one column. Single Figure, inspired by the parable's arithmetic.
- draw: FigureSequence (3 frames): the forward replication — frame 1 borrow $S_0$ and buy the stock; frame 2 hold to $T$ (path irrelevant, two sample paths drawn fading); frame 3 deliver stock, repay $S_0e^{rT}$ — payoff identical to the forward in every state. Inspired by Hull §5.4's portfolio argument.
- draw: Two candidate forward prices on one axis — the expectation price (with its $\mu$-dependence shown as a family of arrows for different beliefs) vs the single arbitrage price; annotations name the trade that punishes each deviation. Original.
- draw: Payoff diagrams: long forward, long call, long put (the three hockey sticks, Hull Fig 1.2/1.5 recreated in house style) — introduced here because the whole course reads them; the call's kink flagged as "not static-replicable".
- draw: The arbitrage definition as a small decision diagram: cost now = 0 → no state loses → some state wins; each clause paired with the violated-clause counterexample (a lottery ticket, an insured bet). Original.

## EXERCISE PLAN
1. Warm-up: compute the one-year forward price for $S_0 = 40$, $r = 5\%$ continuous; a dealer quotes 43.50 — write out the arbitrage table (positions now, cash flows at $T$ in every state).
2. Claim to refute: "a forward on a stock with strong positive drift ($\mu = 20\%$) should cost more than one on a flat stock ($\mu = 0$), other things equal." Break it with the replication argument; name the exact step where belief enters expectation pricing and is refused entry by replication.
3. Boundary probe: run the replication argument with $r = 0$ and with a stock that pays a known dividend $D$ before $T$; show the enforced price becomes $(S_0 - PV(D))e^{rT}$ and say which leg of the construction changed.
4. Derivation skipped: the bookmaker's break-even odds in general — for wagers $w_1, w_2$ on two horses, derive the odds that make the book riskless, and show they depend only on $w_1/w_2$, never on the true win probability.
5. Research-shaped: from Hull's Table 1.2-style data (GOOG spot 871.30, quoted option expiries), estimate the implied cost of carry between two futures/forward quotes and compare to the T-bill rate of the period.
6. FORWARD (E7): a call with strike $K = S_0e^{rT}$ pays $\max(S_T - K, 0)$. Try to replicate it with a static stock-and-bond portfolio; show any such portfolio is wrong in at least one state whenever $S_T$ can take more than two values that straddle $K$ — and note that with exactly two possible values a solution exists. Solution: that two-state escape hatch is the next-but-one lesson's entire subject → Ref one-period-binomial.

## ARC
- Inherits: nothing — course opener (C3: easiest, most polished; the win is "I computed an enforceable price and the arbitrage that defends it").
- Contributes: the course's ground rule — prices are enforced by replication, beliefs are inadmissible evidence; arbitrage defined.
- Hands off: replication worked for the linear payoff; the kinked payoff resists → bounds (static-bounds-parity), then the two-state model that closes the gap.
- Spine step: "A derivative's price is enforced, not estimated…" (step 1).
