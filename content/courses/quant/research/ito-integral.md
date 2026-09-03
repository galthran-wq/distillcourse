# The Itô integral — research brief

Lesson: `ito-integral` (module: continuous-limit, core, planned). NEW.
Goal: Construct the Itô integral for simple integrands, prove the martingale property and the Itô isometry, and compute $\int W\,dW$.

## Sources
- Shreve II §4.2: construction for simple (piecewise-constant adapted) integrands — Fig 4.2.1's rectangle picture; Theorem 4.2.1 (martingale), Theorem 4.2.2 (isometry), Theorem 4.2.3 (QV of the integral). All three proofs carried in full — they are finite-sum arguments at this stage, exactly the honesty budget allows.
- Shreve II §4.3: extension to general integrands by $L^2$ approximation (Figs 4.3.1–4.3.2), stated with the isometry as the bridge — the approximation limit itself fenced (cited); Theorem 4.3.1 (the general integral is a martingale); the worked $\int_0^T W\,dW = \tfrac12 W^2(T) - \tfrac12 T$ from the definition (partition sums).
- Baxter & Rennie §3.3 (pp.57–59): the $d(W^2) \ne 2W\,dW$ surprise via partition sums with the wrong-expectation check — the motivating computation this lesson opens with (already planted as last lesson's forward exercise).
- Shreve II Exercise 4.4-style evaluation-point discussion (left endpoint vs midpoint → Itô vs Stratonovich): one ★ starred section, one computation.

## Key points
1. Open by cashing the forward exercise: the naive $\int W\,dW = \tfrac12W^2$ fails its own expectation audit ($0 \ne T/2$… i.e. $E[\tfrac12 W^2(T)] = T/2$ but naive gain of a fair game must be 0). Something in ordinary integration is wrong for BM — locate it (the evaluation point matters because QV ≠ 0).
2. Simple integrands ARE trading strategies: hold $\Delta(t_i)$ (decided at $t_i$ — adapted) over $[t_i, t_{i+1})$; the integral is the P&L $\sum \Delta(t_i)(W(t_{i+1}) - W(t_i))$. The finance reading is the definition (L4).
3. The three theorems proved: martingale (conditional expectation kills the forward increment — adaptedness is exactly what's used; mark the step); isometry $E[I^2] = E\int\Delta^2 dt$ (cross terms vanish by conditioning, squares contribute $\Delta t$ — the QV mechanism again); $[I, I](t) = \int_0^t \Delta^2 du$ (the integral accumulates QV at rate $\Delta^2$ — volatility scales, drift doesn't).
4. Adaptedness is load-bearing, shown by counterexample: let $\Delta$ peek one step ahead ($\Delta(t_i) = \mathrm{sign}(W(t_{i+1}) - W(t_i))$) — the "integral" has strictly positive expectation; the martingale proof's conditioning step is precisely what fails. (Discrete twin already seen in stopping-times' foresight rule — Ref, spiral.)
5. General integrands by approximation: statement, the isometry as the reason the limit exists, fence on the density argument. Then $\int W\,dW$ computed honestly from partitions: the algebraic identity $\sum W_i(W_{i+1} - W_i) = \tfrac12 W_n^2 - \tfrac12\sum(W_{i+1} - W_i)^2$ — QV walks in as the correction term, in the algebra itself.
6. ★ Stratonovich aside: midpoint evaluation gives $\tfrac12W^2$ (and breaks the martingale property) — the choice of evaluation point is a modeling decision, and finance needs Itô because traders cannot see the midpoint.

## Set pieces & gems
- The B&R wrong-expectation audit — the cleanest possible motivation, done in four lines.
- The summation-by-parts identity where QV appears algebraically (not by decree) — the lesson's centerpiece derivation.
- The peeking counterexample with its computed positive drift — adaptedness taught by the money it would mint.

## Pitfalls
- The $L^2$-approximation extension is a real analytic theorem; fence it (cite Shreve §4.3's outline) rather than hand-wave "and so on".
- Do not define the integral pathwise; say once why pathwise Riemann–Stieltjes dies (infinite first variation, last lesson's result — Ref).
- The isometry needs $E\int\Delta^2 dt < \infty$; state the hypothesis, show one violating integrand in a footnote-level remark (fenced: local martingales named, not developed).
- Keep the Stratonovich section starred and short; no physics detour.

## FIGURE PLAN
- draw: Simple integrand as a trading strategy — FigureSequence (3 frames): the staircase $\Delta(t)$ over a BM path; one holding period's P&L rectangle ($\Delta \times$ increment); the total as the sum of signed rectangles. Inspired by Shreve Fig 4.2.1.
- draw: The martingale proof's step — $E_{t_i}[\Delta(t_i)(W(t_{i+1}) - W(t_i))]$ with taking-out-what-is-known and the zero-mean increment color-bound; the SAME two properties module 2 proved, now load-bearing (C5 spiral, caption says so). Voita rule 7.
- draw: The isometry as area accounting — left: $I(t)$'s fluctuation band $\pm\sqrt{E\int\Delta^2}$ around 0; right: the $\Delta^2(t)$ area under the curve; the equality arrow. Original.
- draw: The peeking integrand — two panels: adapted $\Delta$ (P&L a centered random walk) vs peeking $\Delta$ (P&L ratcheting up); the conditioning step that fails circled in the accompanying equation. Original — the lesson's signature.
- draw: $\int W\,dW$ by partitions — the summation-by-parts identity dissected: each term of $\tfrac12W_n^2 - \tfrac12\sum(\Delta W)^2$ under a brace, the second brace linked to last lesson's QV figure. Voita rule 7.

## EXERCISE PLAN
1. Warm-up: for the simple integrand $\Delta = 1$ on $[0,1)$, $\Delta = -1$ on $[1,2)$: write $I(2)$ explicitly, verify $E[I(2)] = 0$ and the isometry by direct computation.
2. Derivation skipped: prove Theorem 4.2.3 ($[I,I](t) = \int\Delta^2 du$) for simple integrands — squared increments of $I$ within one holding period are $\Delta^2 \times$ squared BM increments; assemble.
3. Boundary probe: $\Delta$ deterministic. Show $I(t)$ is then Gaussian with variance $\int\Delta^2$ (build from independent normal increments) — the special case Theorem 4.4.9 will use; state exactly which step of the general theory becomes elementary.
4. Claim to refute: "the Itô integral of a positive integrand is increasing in $t$." Refute with $\Delta = 1$ ($I = W$, not increasing); name the confusion (integration against $dW$, not $dt$) and give the statement that IS true (martingale, mean 0).
5. Mixed/spaced (E3): recompute the discrete stochastic sum $\sum \Delta_n(S_{n+1} - (1+r)S_n)$ from module 2's wealth equation and match each ingredient (adapted $\Delta$, martingale increments under $\tilde P$) to this lesson's construction — the binomial model was an Itô integral all along.
6. Research-shaped: simulate the peeking strategy at $n = 10^4$ steps, report its annualized "return" and Sharpe-like ratio, and identify the exact information leak in units of one step's foresight.
7. FORWARD (E7): compute $\int_0^T W^2\,dW$ by guessing the antiderivative $\tfrac13W^3$ and auditing the expectation as before; find the correction $-\int_0^T W\,dt$. Solution: the general bookkeeping that generates every such correction from a Taylor term is the next lesson's formula → Ref ito-formula.

## ARC
- Inherits: BM's roughness — infinite length, QV = $t$ (brownian-motion); adaptedness from the discrete world (coin-toss-probability, stopping-times).
- Contributes: the integral that survives the roughness — trading-gain semantics, martingale property, isometry, QV accounting — and the first computed stochastic integral with its correction term.
- Hands off: corrections one integral at a time is unsustainable; the chain rule that mass-produces them → ito-formula.
- Spine step: "Refining the tree does not smooth the randomness away…" (step 4).
