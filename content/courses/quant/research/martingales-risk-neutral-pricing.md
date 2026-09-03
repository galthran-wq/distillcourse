# Martingales and risk-neutral pricing — research brief

Lesson: `martingales-risk-neutral-pricing` (module: binomial-model, core, planned). NEW.
Goal: Derive the general risk-neutral pricing formula by proving that discounted prices are martingales under the risk-neutral measure.

## Sources
- Shreve I §2.4: martingale/super/submartingale definitions; Theorem 2.4.4 (discounted stock is a $\tilde P$-martingale); Theorem 2.4.5 + Corollary 2.4.6 (discounted wealth of any self-financing strategy is a $\tilde P$-martingale ⟹ no arbitrage — the first fundamental theorem's easy direction, in the discrete setting); Theorem 2.4.7 (the risk-neutral pricing formula $V_n = \tilde E_n[(1+r)^{-(N-n)}V_N]$); Theorem 2.4.8 (cash-flow valuation) briefly.
- Shreve I §2.5: Markov processes, Theorem 2.5.8 (prices as functions $v_n(S_n)$ under $\tilde P$) — the licence for recombining-tree pricers.
- Shreve I §1.5 Notes: Harrison–Kreps / Harrison–Pliska attribution for risk-neutral pricing — one line of history at the close.
- Baxter & Rennie §2.3: the binomial representation theorem (any $\tilde P$-martingale = $N_0 + \sum \phi_k \Delta S_k$ with previsible $\phi$) — state and prove in the discrete setting; it is the discrete twin of module 6's martingale representation theorem and makes "hedge exists" a theorem here too.

## Key points
1. Martingale defined (with sub/super variants); first examples computed: the discounted stock under $\tilde P$ (Thm 2.4.4, full proof — one application of independence + the definition of $\tilde p$), and NOT under generic $P$ (compute the drift). The measure is what makes the game fair.
2. Discounted wealth: linearity + taking-out-what-is-known turn the wealth equation into $\tilde E_n[(1+r)^{-(n+1)}X_{n+1}] = (1+r)^{-n}X_n$ (Thm 2.4.5, full proof). Corollary: no self-financing strategy starting at 0 can end $\ge 0$ with a positive-probability gain — martingales cannot be beaten. This IS "existence of a risk-neutral measure ⟹ no arbitrage"; name it as the first fundamental theorem's forward direction and flag that the converse (no arbitrage ⟹ existence) is stated here, proved in the continuous setting only in outline (module 6).
3. Theorem 2.4.7: the pricing formula, and the recognition that backward induction (module 2's algorithm) and the conditional expectation (this lesson's formula) are the same computation — tower property = one backward step. The lesson's central seam.
4. The binomial representation theorem (B&R §2.3): every $\tilde P$-martingale is a stock-trading gain process. Consequence: define $V_n := \tilde E_n[\ldots]$, it is a martingale, hence tradeable, hence hedged — pricing and hedging are two readings of one object.
5. Markov property (Thm 2.5.8, proof sketched honestly): for path-independent payoffs $V_n = v_n(S_n)$; what fails for lookbacks (augment the state). One section, tied to the pricer's data structures.

## Set pieces & gems
- The drift computation under three measures ($p = 0.5$, $p = \tilde p$, $p = 0.9$) on the standard tree — one table, the martingale row flagged; makes "the measure is a choice of bookkeeping" tactile before Girsanov ever appears.
- Backward-induction-equals-conditional-expectation shown by literally re-deriving module 2's root value 34.065 (CRR tree) as $\tilde E[(1+r)^{-3}V_3]$ over the eight paths with binomial weights.
- Harrison–Pliska name-drop with dates (1979/1981) as the close's one historical line.

## Pitfalls
- "Martingale = no drift under the pricing measure," never "prices are martingales": the UNDISCOUNTED stock is not a martingale under $\tilde P$; the discounting is load-bearing — make this a boxed near-miss (playbook-math near-miss slot).
- Do not conflate the representation theorem with completeness rhetoric yet; module 6 owns the taxonomy. Here it is a concrete construction on the tree.
- The converse FTAP direction is subtle even discretely (separating hyperplane); state it, cite Shreve §1.5 Notes/Appendix C of Vol II, and fence it honestly rather than fake-proving.
- $\tilde E$ notation must carry the tilde everywhere; a bare $E$ in a pricing formula is the classic silent error — add to the notation ledger.

## FIGURE PLAN
- draw: One process, three measures — the same 3-period discounted stock tree with expected-next-value arrows drawn under $p=0.5$, $\tilde p$, $0.9$; only the middle panel's arrows are level. Three-panel comparison (voita rule 8).
- draw: The martingale property dissected — $\tilde E_n[(1+r)^{-(n+1)} X_{n+1}] = (1+r)^{-n} X_n$ with underbraces: "tomorrow's wealth, discounted, averaged over the next toss" vs "today's"; the wealth-equation substitution shown step by step. FigureSequence (3 frames).
- draw: Backward induction = conditional expectation — split panel: left the module-2 backward pass at one node, right the tower-property computation of $\tilde E_1[(1+r)^{-2}V_3]$; identical numbers highlighted. Single Figure, the lesson's signature.
- draw: The representation theorem as portfolio assembly — a target martingale's increments at each node matched by $\phi_k \times$ stock increments (a fan of nodes, $\phi$ solved per node); caption: a martingale is a trading strategy in disguise. Inspired by B&R §2.3.
- draw: Markov collapse — a 3-period tree whose $2^3$ path-values fold onto 4 recombining node-values for a vanilla payoff, and refuse to fold for a lookback (values annotated). Reuses module-2's recombining figure at higher depth (C5 spiral).

## EXERCISE PLAN
1. Warm-up: on the $u=2, d=\tfrac12, r=\tfrac14$ tree, verify by direct computation that $(1+r)^{-n}S_n$ is a $\tilde P$-martingale at every node, and compute its drift under $p = 0.7$.
2. Derivation skipped: prove Theorem 2.4.8's special case — a claim paying cash flows $C_1, C_2$ at both dates is priced by summing discounted conditional expectations; show the hedge needs a consumption term.
3. Boundary probe: $r$ such that $\tilde p \to 0$ (i.e. $1+r \to d$). What happens to the pricing formula, which no-arbitrage inequality is tight, and what trade appears exactly at the boundary?
4. Claim to refute: "the stock price itself is a martingale under the risk-neutral measure." Compute $\tilde E_n[S_{n+1}] = (1+r)S_n \ne S_n$; name the object that IS the martingale and why discounting is the fix.
5. Proof-comprehension (playbook-math): in the proof of Theorem 2.4.5, name the exact step where self-financing is used, and exhibit a non-self-financing strategy (inject \$1 at $n=1$) whose discounted wealth is not a martingale.
6. Mixed/spaced (E3): reprice module 1's Example 1.1.1 put via the pricing formula directly (no backward pass) and reconcile with the parity check from the option-chain lesson.
7. FORWARD (E7): compute $\tilde E_n[(1+r)^{-(N-n)}\max(K - S_N, 0)]$ at every node of a 2-period tree and compare with $\max(K - S_n, 0)$ node by node; find the node where intrinsic value exceeds the conditional expectation. Solution: at that node a European price is "too low to be American" — the defect the Snell envelope repairs → Ref american-derivatives.

## ARC
- Inherits: conditional expectation with proved properties (coin-toss-probability); the backward-induction algorithm (multiperiod-binomial).
- Contributes: the module's headline — the risk-neutral measure as consequence: discounted prices are martingales, martingales cannot be beaten (no arbitrage), and price = discounted conditional expectation; representation makes the hedge a theorem.
- Hands off: the measure exists — but what IS a measure change, as an object? The Radon–Nikodym view → state-prices-change-of-measure.
- Spine step: "Chaining one-period replications backward through a tree prices every claim…" (step 2).
