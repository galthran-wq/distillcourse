# American options and the Snell envelope — research brief

Lesson: `american-derivatives` (module: american-options, core, planned). NEW.
Goal: Compute American claim prices by dynamic programming and prove that the first time price equals payoff is an optimal exercise time.

## Sources
- Shreve I §4.1–4.2: the American put worked on the tree (Figs 4.2.2/4.2.3: price trees vs discounted trees side by side, showing where price separates from the martingale property). §4.4: Definition 4.4.1 + Theorem 4.4.2 (the price process dominates intrinsic value; discounted price is the SMALLEST supermartingale dominating it — the Snell envelope), Theorem 4.4.3 (the backward-induction algorithm), Theorem 4.4.4 (replication with consumption), Theorem 4.4.5 ($\tau^* = \min\{n: V_n = G_n\}$ optimal). §4.5: Theorem 4.5.1 (convex payoff, $g(0)=0$, $r\ge0$ ⟹ American = European; the conditional-Jensen one-paragraph proof — a gem, prove it in full).
- CRR 1979 §6: the dividend-adjusted American call/put backward induction; Table 3 (the 3-period American put with early-exercise nodes in italics, Δ hitting −1.00 at the deepest exercised node) — reuse the numbers.
- Hull §13.5, §11.5–11.6 as gentler secondaries.

## Key points
1. The algorithm first (concrete): the American put on the standard tree, $V_n = \max(G_n, \frac{1}{1+r}[\tilde p V_{n+1}(H) + \tilde q V_{n+1}(T)])$, every node computed; the nodes where the max is achieved by $G_n$ marked — the exercise region appears as a by-product.
2. What must be true of any American price process: (a) $V_n \ge G_n$ (else buy the option, exercise now); (b) discounted $V$ a supermartingale (else the seller is over-hedged somewhere — the consumption reading); (c) smallest such (else the price overcharges: Thm 4.4.2's minimality proved). The Snell envelope named.
3. Seller's side: replication with consumption (Thm 4.4.4) — the hedge works for EVERY buyer behavior, and at non-optimal buyer moves the seller withdraws cash. Buyer's side: $V_0 = \max_\tau \tilde E[(1+r)^{-\tau}G_\tau]$ and Theorem 4.4.5's proof that $\tau^*$ attains it (optional sampling from last lesson doing the work — Ref, then use).
4. Theorem 4.5.1 in full: for convex $g$ with $g(0) = 0$ and $r \ge 0$, the discounted intrinsic value is a submartingale, so waiting dominates — no early exercise; the American call = European call, now as a theorem about the model (module 1's dominance version re-proved with sharper tools; C5 spiral, say so).
5. Puts break the hypothesis ($g(0) = K \ne 0$): the worked tree's exercise nodes are real. The put/call asymmetry now has a proof-level explanation.

## Set pieces & gems
- Shreve Figs 4.2.2/4.2.3 recreated: price tree and discounted-price tree side by side, the supermartingale slack (consumption) visible at exercised nodes.
- CRR Table 3's American put with italic exercise nodes and Δ = −1.00 — the hedge going fully short exactly where exercise is optimal.
- The conditional-Jensen proof of 4.5.1 held up as "one clean idea reused" (the reader summary's phrase) — a Proof environment with the comprehension tasks after (playbook-math proof protocol).

## Pitfalls
- Keep the three characterizations (algorithm / smallest supermartingale / sup over stopping times) explicitly reconciled in one section — students otherwise learn three unconnected facts. The reconciliation IS the lesson.
- "Exercise when in the money" is a documented misconception (L13): refute with a computed node that is in the money but where continuation strictly exceeds intrinsic.
- The consumption term is not a modeling luxury: without it the seller's hedge would need to anticipate the buyer. One remark, precise.
- Do not introduce the perpetual case or first-passage math — next lesson.

## FIGURE PLAN
- draw: The backward pass with the max — FigureSequence (4 frames) on the American put tree: terminal payoffs; one interior node computed both ways (continuation vs intrinsic, the max circled); the full tree with exercise nodes shaded; the exercise region outlined as a boundary in ($n$, $S$). Inspired by Shreve Fig 4.2.2 / CRR Table 3.
- draw: The Snell sandwich — one axis: the intrinsic process $G$, the American price $V$ riding on or above it, a generic supermartingale dominating both; the "smallest" property as $V$ hugging $G$'s hull. Original.
- draw: Seller's ledger with consumption — hedge table along a path where the buyer exercises late: the withdrawal column nonzero at the node where the buyer should have exercised. Inspired by Thm 4.4.4's proof mechanics.
- draw: Theorem 4.5.1's geometry — convex $g$ with $g(0)=0$: the chord from origin to $(s, g(s))$ lying above $g(\lambda s)$; beside it the tree computation showing discounted $g(S_n)$ drifting up. Inspired by Shreve Fig 4.5.1.
- draw: Exercise-or-continue decision panel at one node — the two cash flows as small trees, values annotated, the comparison bar underneath; reused later by the lab's boundary checkpoint. Original.

## EXERCISE PLAN
1. Warm-up: price the American put $K = 5$ on the standard 3-period tree; mark the exercise nodes and give $\tau^*$ path by path.
2. Derivation skipped: prove minimality (Thm 4.4.2's "smallest" clause): any supermartingale dominating $G$ dominates the algorithm's $V$, by backward induction.
3. Boundary probe: set $r = 0$ in Theorem 4.5.1's put analogue — show the American put with $r = 0$ never exercises early (the discounted-put process becomes a submartingale too), and identify which inequality in the put's usual argument needed $r > 0$.
4. Claim to refute: "an American option's holder should exercise as soon as it is in the money — locking in a sure gain beats gambling." Refute with the computed in-the-money continuation node; name the comparison the claim skips (intrinsic NOW vs the conditional expectation of MORE later).
5. Error-diagnosis: a pricer computes $V_n = \max(G_n, \tilde p V_{n+1}(H) + \tilde q V_{n+1}(T))$ — no discounting in the continuation. On the worked tree, find the node where its decision first differs from the correct pricer's.
6. Mixed/spaced (E3): verify on the tree that the American CALL ($K=5$) equals the European call at every node, and cite which theorem predicted the equality before any computation.
7. FORWARD (E7): extend the American put tree to 6 periods (same $u, d, r$); tabulate the critical stock price (highest $S$ at which exercise happens) per date and observe it drifts. Solution: the boundary as an object of study — its shape and its infinite-horizon limit are the next lesson's subject → Ref first-passage-perpetual-put.

## ARC
- Inherits: stopping times and optional sampling (stopping-times); backward induction and the pricing formula (module 2).
- Contributes: the American pricing theory complete in the discrete setting — algorithm, Snell characterization, optimal rule, and the no-early-exercise theorem for convex payoffs.
- Hands off: the exercise boundary as an object — computed date by date here, in closed form for the perpetual case next → first-passage-perpetual-put.
- Spine step: "An American claim adds a choice…" (step 3).
