# The one-period binomial model — research brief

Lesson: `one-period-binomial` (module: arbitrage, core, planned). NEW.
Goal: Construct the replicating portfolio for a one-period contingent claim and derive the risk-neutral pricing formula as its cost.

## Sources
- Shreve I §1.1: the whole section — no-arbitrage condition $0 < d < 1+r < u$ (eq 1.1.2, DERIVED from explicit trades, not assumed), Example 1.1.1 ($S_0=4$, $u=2$, $d=\tfrac12$, $r=\tfrac14$, $K=5$; borrow 0.80, buy $\tfrac12$ share, price 1.20, both arbitrage directions in dollars), the replication equations, $\Delta_0 = \frac{V_1(H)-V_1(T)}{S_1(H)-S_1(T)}$, $\tilde p = \frac{1+r-d}{u-d}$ emerging as the coefficients that cancel $\Delta_0$ (eqs 1.1.3–1.1.10).
- CRR 1979 §2 ("The Basic Idea"): the $50/$50 example — S=\$50, S* ∈ {25,100}, r=25%: write 3 calls, buy 2 shares, borrow \$40 ⟹ C=\$20; Table 1's arbitrage table. §3: the state-price $(\pi_u, \pi_d)$ derivation; the trinomial impossibility (lines 574–582): with three states, two instruments cannot span — the necessity theorem restated in §7.
- Baxter & Rennie §2.1: the $1 stock to $2/$0.50 one-branch example, "the whole story in one step".
- Hull §13.1–13.2: the no-arbitrage argument retold with the $20/$22/$18 stock; §13.7 P-measure vs Q-measure (real probability changes the expected growth rate, not the price).

## Key points
1. Setup and the no-arbitrage condition: $0 < d < 1+r < u$ proved by exhibiting the money pump for each violated inequality (stock dominates bond / bond dominates stock). The condition is a theorem about which models are even admissible.
2. Replication as two linear equations in two unknowns ($\Delta_0$, bond position), solved in full for the general claim $(V_1(H), V_1(T))$; then Example 1.1.1 in dollars, both directions of the arbitrage when the quote is 1.50 or 1.00.
3. The central reveal, staged exactly as Shreve stages it: solve the equations, group terms, and the coefficients $\tilde p, \tilde q$ appear as bookkeeping — Shreve is explicit that they are "not the actual probabilities". Only after the algebra: they lie in $(0,1)$ precisely because of the no-arbitrage condition, they sum to 1, and under them the expected discounted stock is today's stock. Probability is the interpretation of an algebraic identity, not an input. This ordering is the design intent's "risk-neutral measure as a CONSEQUENCE" in miniature — protect it.
4. CRR's quotable: "bulls and bears must agree on the value of the call, relative to its underlying stock price" — the real probability $q$ appears nowhere.
5. Why exactly two states: with three terminal values, the two replication equations in two unknowns are overdetermined — arbitrage alone cannot price; a residual risk survives. CRR's necessity theorem stated (two-state movement is necessary and sufficient for pure arbitrage pricing with stock and bond). This both justifies the binomial model and forecasts the continuous story (a single Brownian driver = instantaneously two states).
6. Delta as slope: $\Delta_0 = \frac{V_1(H)-V_1(T)}{S_1(H)-S_1(T)}$ read as the payoff's difference quotient — the seed of $\Delta = c_x$ in module 5 (say so in one sentence).

## Set pieces & gems
- Shreve Example 1.1.1 with all dollar amounts — the course's canonical running example; reuse the same numbers in module 2 and the module 3 tree.
- CRR §2's write-3-calls/buy-2-shares/borrow-\$40 hedge (Table 1) — worked as the second Example (structurally different surface, same mechanism: playbook-math minimum concept set).
- Hull §13.7's P-vs-Q point as the refutation slot: the documented misconception "risk-neutral pricing assumes investors are risk-neutral" — refute per L13 (the price is preference-free because the hedge removes the risk; risk-neutrality is a reading of the formula, not an assumption about people).

## Pitfalls
- Do not say "probability of up move doesn't matter" without the caveat Shreve states: $q$ matters for whether the MODEL is calibrated well, and for the investor's P&L distribution — it does not matter for the arbitrage-enforced price GIVEN $u, d, r$.
- Keep per-period compounding ($1+r$) here; the notation note from lesson 1 carries the mapping to $e^{rT}$.
- The trinomial point is about spanning, not about realism — three states is a fine model; it just cannot be priced by stock+bond arbitrage alone.
- Do not introduce measure-theoretic language ("measure", "filtration") yet; the words arrive in module 2 with the machinery.

## FIGURE PLAN
- draw: The one-period branch — the canonical two-node diagram ($S_0 \to uS_0/dS_0$, claim values beside), colors binding stock (amber) and claim (blue) values across diagram and equations. Inspired by Shreve Fig 1.1.1/CRR's branch diagrams.
- draw: FigureSequence (4 frames): replication solved — frame 1 the two terminal equations; frame 2 subtract to isolate $\Delta_0$ (the slope picture drawn beside); frame 3 substitute back, terms regrouped; frame 4 the coefficients boxed and named $\tilde p, \tilde q$ — "bookkeeping, then probability". This is the lesson's signature visual (voita rule 7: dissect the formula in place).
- draw: The arbitrage table for Example 1.1.1 at a wrong quote (1.50): rows = positions, columns = the two states, bottom line the sure profit; twin table for 1.00. Inspired by CRR Table 1.
- draw: Two-state vs three-state spanning — payoff space as a plane: with two states, (stock, bond) span $\mathbb{R}^2$ (any claim reachable); with three states, the span is a plane inside $\mathbb{R}^3$ and the call sits off it, residual marked. Original; makes the necessity theorem geometric.
- draw: $\tilde p$ as a lever position — the risk-neutral probability locating $1+r$ between $d$ and $u$ on a number line ($\tilde p$ = the interpolation weight); degenerate ends flagged ($1+r \to u$ forces $\tilde p \to 1$). Original.

## EXERCISE PLAN
1. Warm-up: price a put with $K=5$ in the Example 1.1.1 market; report $\Delta_0$ (negative — short the stock) and the bond leg; verify parity against the call's 1.20.
2. Boundary probe: set $u = 1+r$. Show $\tilde p = 1$, the model's up state carries all the weight, and replication of any claim paying differently in the two states forces an arbitrage on the stock itself — which admissibility inequality failed and why the theorem excluded it.
3. Claim to refute: "if the up-move probability is 0.9, the call must be worth more than the 1.20 computed with $\tilde p = 0.5$." Refute with the explicit both-directions arbitrage; then reconcile: what DOES change when $q = 0.9$ (the buyer's expected profit, not the price).
4. Derivation skipped: derive the state prices $(\pi_u, \pi_d)$ directly (price of one dollar in each state) from the replication equations, and show the claim price is $\pi_u V(H) + \pi_d V(T)$ with $\pi_u + \pi_d = \frac{1}{1+r}$ — CRR §3's complete-markets route, and the doorway to module 2's state-price density.
5. CRR reproduction (research-shaped): reproduce the \$20 call price of CRR §2 from scratch, then re-run it with r=0 and explain in one sentence what the borrowed \$40 was doing.
6. FORWARD (E7): in the Example 1.1.1 market run TWO periods, price the call $K=5$ at every node by applying the one-period formula twice by hand. Solution: the backward pass just performed is the next lesson's algorithm → Ref multiperiod-binomial.

## ARC
- Inherits: arbitrage/replication (lesson 1) and the bounds' honest failure to produce a number (lesson 2).
- Contributes: the smallest model in which every claim is replicable; $\Delta$ as slope; $\tilde p$ as consequence-not-belief — the course's core mechanism at its smallest scale.
- Hands off: one period is a toy; chaining periods without losing the theorem is module 2's job → multiperiod-binomial.
- Spine step: "A derivative's price is enforced, not estimated…" (step 1).
