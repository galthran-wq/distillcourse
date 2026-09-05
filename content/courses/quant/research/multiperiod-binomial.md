# Multiperiod replication and backward induction — research brief

Lesson: `multiperiod-binomial` (module: binomial-model, core, planned). NEW.
Goal: Construct the price and replicating portfolio of an arbitrary claim on an N-period binomial tree by backward induction, and prove the multiperiod replication theorem.

## Sources
- Shreve I §1.2: the multiperiod model, the wealth equation, Theorem 1.2.2 (replication in the multiperiod model — proof by induction, carried in FULL, every step: this is the honest-math half's first real theorem), Definition 1.2.3 (the price), Figs 1.2.1–1.2.2 (three-period trees). §1.3 computational considerations: recombining trees, $v_n(s)$ functions, when path-dependence (lookback example, Fig 2.5.1) forbids the shortcut.
- CRR 1979 §4 opening: the S=80, n=3, K=80, u=1.5, d=0.5, r=1.1 tree — stock tree with path probabilities, call tree, Δ tree (0.719 at the root, drifting to 1 or 0). Use the TREES here; the arbitrage TRADE is the module application's.
- Baxter & Rennie §2.2: the 3-step recombinant tree with full hedge tables along two realized paths (rosy 15→25→40 ending 100% stock; break-even path) — the tick-by-tick device this lesson adopts.
- Hull §13.3–13.5 (two-step trees, the general formulas) as a gentler secondary.

## Key points
1. The wealth equation $X_{n+1} = \Delta_n S_{n+1} + (1+r)(X_n - \Delta_n S_n)$ introduced as the definition of trading without cash injections — self-financing named here, and flagged as the exact object that becomes $dX = \Delta dS + r(X - \Delta S)dt$ in module 5.
2. Backward induction as repeated one-period replication: $V_n = \frac{1}{1+r}[\tilde p V_{n+1}(H) + \tilde q V_{n+1}(T)]$ per node, $\Delta_n$ per node from the slope formula. Concrete-first: run the CRR 3-period tree completely before the theorem.
3. Theorem 1.2.2 stated and proved by induction with no skipped algebra (L7 standard): if $X_0 = V_0$ and $\Delta_n$ follows the formula, then $X_N = V_N$ for EVERY outcome sequence. The proof's engine is one line of the wealth equation plus the one-period identity — say so before the proof (playbook-math: mode + roadmap).
4. Path-count honesty: $2^N$ paths vs $N+1$ recombining nodes; when the claim is a function of $S_N$ only, $v_n(s)$ suffices (Markov preview, formalized next-but-one lesson); a lookback needs the path.
5. Delta is a process, not a number: the CRR Δ-tree read as "the hedge leans harder as the option goes deeper in" — 0.719 → 1.00 (delivered) or → 0 (abandoned).

## Set pieces & gems
- The B&R two-path hedge tables: along the rosy path and the break-even path, tabulate stock held, bond debt, portfolio value, claim value at every date — the "hedge never misses" experience the demo then makes adversarial.
- CRR's three trees (stock, call, Δ) as the canonical triptych.
- The 1.20 call of Example 1.1.1 extended to two periods (continuity with module 1's running example).

## Pitfalls
- State clearly that $\tilde p$ is the SAME at every node only because $u, d, r$ are constants — a tree with varying coefficients still works node by node (one sentence; Shreve's generality remark).
- Path-dependent claims: replication still holds (Thm 1.2.2 is path-general); only the computational shortcut dies. Do not let "recombining" contaminate the theorem.
- Keep the real probability $q$ out of every formula; it appears once, in a Remark, as the thing that never showed up.
- The demo must not become the lesson: the tables in prose carry the argument; the demo is the retrieval.

## FIGURE PLAN
- draw: The three-period stock tree with claim values filled by backward induction — FigureSequence (4 frames): terminal payoffs; one backward step (the acted-on nodes highlighted, one one-period formula shown); second step; root, with $\Delta_0$ read off. One thing changes per frame (voita figure rule 2). Inspired by Shreve Fig 1.2.2 / CRR §4.
- draw: The wealth equation dissected in place — underbraces binding "shares ride the stock" and "rest grows at $1+r$" to the two terms, with the node diagram beside. Voita rule 7.
- draw: The Δ-tree — CRR's hedge-ratio tree redrawn, values at each node, color intensity = |Δ|; annotations at the 1.00 and 0 leaves. Inspired by CRR §4 (lines 671–693).
- draw: Hedge-table figure — the B&R rosy-path table as a house-style table-figure: rows = dates, columns = stock, Δ, bond, portfolio, claim; portfolio and claim columns shaded identically to make equality visible.
- draw: Recombining vs non-recombining — two small trees: $ud = du$ merges nodes ($N+1$); a lookback annotates each node with the running max and the merge fails. Inspired by Shreve §1.3/Fig 2.5.1.

## EXERCISE PLAN
1. Warm-up: price the two-period call of module 1's forward exercise formally: fill all $V_n$, all $\Delta_n$; confirm the root matches your by-hand answer.
2. Derivation skipped: the closed form skipped by backward induction — prove $V_0 = \frac{1}{(1+r)^N}\sum_k \binom{N}{k}\tilde p^k \tilde q^{N-k} V_N(k)$ for path-independent claims by unrolling the recursion; this is CRR's eq (6).
3. Boundary probe: a claim paying 1 in every state (a bond). Show backward induction gives $V_0 = (1+r)^{-N}$ and $\Delta_n = 0$ throughout — the theorem prices non-options too, and the hedge knows it.
4. Claim to refute: "on a recombining tree, the hedge $\Delta_n$ depends only on the current stock price, so replication cannot handle path-dependent claims." Split the claim: the first half is true for path-independent claims (and false in general), the second half does not follow — exhibit a 2-period lookback, price it, and give its (path-dependent) $\Delta_1$ values.
5. Error-diagnosis: a student computes $\Delta_1(H) = \frac{V_2(HH) - V_2(HT)}{S_2(HH) - S_2(TT)}$ and gets a mis-hedged portfolio; find the wrong index, recompute, and state at which node the wealth first misses the claim.
6. Mixed/spaced (E3): verify put–call parity at EVERY node of the 3-period tree, not just the root — parity is a claim about processes.
7. FORWARD (E7): compute $\tilde E[\text{discounted } S_3]$ on the CRR tree and compare to $S_0$; then compute $\tilde E$ of the discounted call value process at $n = 0, 1, 2, 3$ along the tree. Solution: both are constant in $n$ — the property has a name, martingale, and the next two lessons build the machinery that proves it always happens → Ref martingales-risk-neutral-pricing.

## ARC
- Inherits: the one-period replication mechanism and $\tilde p$-as-algebra (one-period-binomial).
- Contributes: the model scaled to any horizon — the wealth equation, backward induction, the fully proved replication theorem; the computational structure every later pricer uses.
- Hands off: the recursion smells like conditional expectation; making that exact requires probability on the coin-toss space → coin-toss-probability.
- Spine step: "Chaining one-period replications backward through a tree prices every claim…" (step 2).
