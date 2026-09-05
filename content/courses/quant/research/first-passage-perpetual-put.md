# First passage and the perpetual American put — research brief

Lesson: `first-passage-perpetual-put` (module: american-options, core, planned). NEW.
Goal: Compute first-passage distributions for the random walk via the reflection principle and derive the perpetual put's optimal exercise boundary by comparing candidate rules.

## Sources
- Shreve I §5.1–5.2: the symmetric random walk (Fig 5.1.1), first passage times, Theorems 5.2.2/5.2.3/5.2.5 (moment generating function $E[\alpha^{\tau_1}]$ via the martingale trick, exact distribution).
- Shreve I §5.3: the reflection principle — Fig 5.3.1's eight coin-toss paths and four reflected paths; the same first-passage distribution proved combinatorially. The "same result, two proofs" structure is deliberate; keep it (the reader summary flags it as an algebra-vs-combinatorics set piece).
- Shreve I §5.4: the perpetual American put — $u=2$, $d=\tfrac12$, $r=\tfrac14$, $K=4$; value each candidate rule $\tau_{-m}$ ("exercise when $S$ first falls to $2^{-m}S_0$-level") via the first-passage formula; the comparison discovers the boundary at stock price 2; then optimality proved (smallest supermartingale dominating intrinsic). Fig 5.4.1 (the value function's kinked shape).
- Shreve II §3.6–3.7 named once as the Brownian re-run (exponential martingale, reflection) — a forward pointer only; the continuous perpetual put is the module-5 extra.

## Key points
1. First passage $\tau_1 = \min\{n: M_n = 1\}$ for the symmetric walk: is it finite? The martingale trick in full — the exponential martingale $\left(\frac{2}{\alpha + \alpha^{-1}}\right)^n \alpha^{M_n}$… stopped at $\tau_1$, optional sampling (Ref last-but-one lesson — spiral), solve for $E[\alpha^{\tau_1}] = \left(\frac{1-\sqrt{1-\alpha^2}}{\alpha}\right)$; extract $P(\tau_1 < \infty) = 1$ and $E[\tau_1] = \infty$ — a striking pair, box it: you will get there, but not soon on average.
2. The reflection principle: count paths reaching level 1 by time $n$ by reflecting post-passage segments; the 8-paths/4-reflections figure worked completely; the distribution re-derived and matched against the generating-function answer. Two proofs, one theorem — say why the course shows both (the reflection idea returns for Brownian motion; the martingale idea returns everywhere).
3. The perpetual put by honest search (Shreve §5.4's discovery narrative preserved): for each candidate boundary, value = intrinsic-at-boundary × first-passage discount factor $\tilde E[(1+r)^{-\tau}]$ (computed from step 1's MGF at $\alpha = 1/(1+r)$); tabulate $\tau_0, \tau_{-1}, \tau_{-2}, \tau_{-3}$; the boundary "stock = 2" dominates.
4. Only then optimality: the candidate's value function checked against the Snell characterization (dominates intrinsic; discounted value a supermartingale; martingale in the continuation region). Discovery first, proof second — the lesson's structure IS this order.
5. The boundary as economics: exercise where the interest earned on $K$ outweighs the option's remaining upside; the same trade-off returns in closed form in the continuous extra ($L^* = \frac{2r}{2r+\sigma^2}K$ — one forward sentence).

## Set pieces & gems
- The eight-path reflection figure (Shreve Fig 5.3.1) — canonical, recreated exactly in house style.
- The $P(\tau_1 < \infty) = 1$, $E[\tau_1] = \infty$ pair — boxed KeyFact (it also inoculates against a common gambler's fallacy).
- The candidate-boundary comparison table ($\tau_0$ through $\tau_{-3}$ with values) — the discovery artifact.
- Fig 5.4.1's kinked value function $v(2^j)$ — value = intrinsic left of the boundary, strictly above right of it.

## Pitfalls
- Optional sampling at an UNBOUNDED stopping time needs care (the theorem proved was finite-horizon): state the limiting argument honestly (truncate at $n$, let $n \to \infty$, dominated convergence on the finite tree levels) — this is exactly the kind of fence the course promises to flag, in miniature.
- Keep the walk SYMMETRIC for §5.2–5.3 and switch to the risk-neutral walk for §5.4 explicitly; mixing the two measures silently is the classic error here.
- The perpetual put is a limit object (no expiry): define its price as the sup over stopping times directly; do not pretend a backward induction terminates.
- Do not develop barrier options — reflection is used for first passage only (anti-sprawl).

## FIGURE PLAN
- draw: Five steps of the symmetric walk with first passage marked — the walk, level 1 dashed, $\tau_1$ circled. Inspired by Shreve Fig 5.1.1.
- draw: The reflection figure — FigureSequence (3 frames): frame 1 the eight 3-toss paths; frame 2 the four that touch level 1 early, their tails reflected (dashed); frame 3 the counting identity assembled ($P(\tau_1 \le 3)$ from the pairing). Faithful house recreation of Fig 5.3.1.
- draw: The exponential martingale trick dissected — the identity $E[\alpha^{\tau_1}]$ solved: the stopped martingale's expectation pinned at 1, the algebra unrolled with underbraces. Voita rule 7.
- draw: Candidate-boundary comparison — bar chart of perpetual-put value under $\tau_0, \tau_{-1}, \tau_{-2}, \tau_{-3}$ with the winner highlighted; beside it the tree with each boundary drawn as a horizontal line. Original (from §5.4's table).
- draw: The kinked value function — $v(s)$ against $s$ on a log grid of node values: intrinsic segment, smooth continuation segment, the kink at the boundary; the module-5 extra's smooth-pasting contrast flagged in the caption. Inspired by Fig 5.4.1.

## EXERCISE PLAN
1. Warm-up: from the MGF, compute $P(\tau_1 = 1), P(\tau_1 = 3), P(\tau_1 = 5)$ and check they sum toward 1.
2. Derivation skipped: derive $E[\alpha^{\tau_2}] = E[\alpha^{\tau_1}]^2$ (strong-Markov/fresh-start argument on the tree) and generalize to level $m$.
3. Boundary probe: the ASYMMETRIC walk ($p \ne \tfrac12$) toward the unlikely side — show $P(\tau_1 < \infty) < 1$, compute it from the same martingale with the appropriate $\alpha$-equation, and say which step of the symmetric proof breaks.
4. Claim to refute: "since the walk hits level 1 with probability 1, the strategy 'buy at 0, sell at +1' earns 1 with certainty — an arbitrage." Refute with $E[\tau_1] = \infty$ plus discounting: compute $\tilde E[(1+r)^{-\tau_1}]<1$ and name the theorem that says fair games stay fair at stopping times.
5. Research-shaped: reproduce Shreve's §5.4 comparison table to three decimals (values of exercising at each candidate boundary) and confirm the published winner.
6. Mixed/spaced (E3): show the perpetual put's value process under the winning rule is a martingale strictly above the boundary and a supermartingale at it — the Snell characterization of last lesson, verified by hand at two nodes.
7. FORWARD (E7): plot the reflection-principle count for the walk reaching level $m$ in $n$ steps as $n$ grows with $m = \lceil\sqrt{n}\rceil$; observe the count's normalized limit resembles a Gaussian tail. Solution: the reflection principle survives the scaling limit and becomes the Brownian first-passage law — the walk itself becomes Brownian motion next module → Ref random-walk-to-brownian-motion.

## ARC
- Inherits: stopping times + optional sampling (stopping-times), the Snell characterization (american-derivatives), the martingale toolkit (module 2).
- Contributes: distributional control of stopping times (two proofs) and the first exercise boundary computed exactly — by search, then certified.
- Hands off: the walk's fine structure (reflection, first passage) survives the continuum limit; module 4 takes the limit of the walk itself; the continuous perpetual put waits as a module-5 extra.
- Spine step: "An American claim adds a choice…" (step 3).
