# The perpetual American put in continuous time — research brief

Lesson: `perpetual-american-put` (module: black-scholes, type: EXTRA, planned). NEW. Off-path starred chapter — no core lesson may require it.
Goal: Solve the perpetual American put's free-boundary problem and derive the optimal exercise level by smooth pasting.

## Sources
- Shreve II §8.3: 8.3.1 price under arbitrary exercise level $L$ (Lemma 8.3.4: the candidate family $v_L(x) = (K-L)(x/L)^{-2r/\sigma^2}$ for $x \ge L$), 8.3.2 optimality (Thm 8.3.5/Cor 8.3.6; $L^* = \frac{2r}{2r+\sigma^2}K$ by maximizing over $L$; Figs 8.3.1 — the envelope of candidates tangent to the intrinsic kink — and 8.3.2 — the 1-D maximization of $g(L) = (K-L)L^{2r/\sigma^2}$), 8.3.3 linear complementarity (8.3.18–8.3.20, stated), 8.3.4 probabilistic characterization (one paragraph).
- Merton 1973 §8 (eqs 48–52): the original — the free boundary $C^* = \frac{\gamma E}{1+\gamma}$, $\gamma = 2r/\sigma^2$, and the Samuelson "high-contact" condition's first rigorous use — the historical origin of smooth pasting; cite with the primary page.
- Shreve I §5.4 (the discrete perpetual put, boundary at 2) — the object this lesson takes the limit of; Ref heavily (C5 spiral).

## Key points
1. Setup: with no expiry, time drops out — $v(x)$ solves the stationary ODE $rv = rxv' + \tfrac12\sigma^2x^2v''$ in the continuation region, $v = K - x$ below the boundary; the PDE from module 5 with $c_t = 0$ (Ref).
2. The candidate family: for exercise-at-$L$, solve the Euler ODE (two power solutions $x^1$, $x^{-2r/\sigma^2}$; boundedness kills one) with $v_L(L) = K - L$: the closed form. Each candidate is a legitimate value-of-a-rule; the family plotted is Shreve Fig 8.3.1's envelope.
3. Optimization = tangency: maximize $g(L) = (K-L)L^{2r/\sigma^2}$; the first-order condition is EXACTLY $v_{L^*}'(L^*) = -1$ — matching the intrinsic payoff's slope. Smooth pasting derived as a first-order condition, not postulated — the lesson's point.
4. $L^* = \frac{2r}{2r+\sigma^2}K$: read the comparative statics ($r \uparrow$ ⟹ exercise later is costlier ⟹ $L^*$ closer to $K$… check signs carefully: $r\uparrow \Rightarrow 2r/(2r+\sigma^2) \uparrow \Rightarrow L^*\uparrow$ — exercise sooner/higher; $\sigma \uparrow \Rightarrow L^* \downarrow$ — optionality argues for waiting).
5. Certification: the Snell test from module 3 restated in continuous clothes — $v \ge$ intrinsic everywhere; $e^{-rt}v(S_t)$ a supermartingale globally, martingale above $L^*$ (Itô check shown); linear complementarity as the compact modern packaging.
6. Closing spiral: the discrete example's boundary (stock = 2 at $u=2, d=\tfrac12, r=\tfrac14, K=4$) vs the continuous formula's prediction — one honest paragraph on how the discrete parameters map and how close the answers land.

## Set pieces & gems
- Shreve Fig 8.3.1's envelope-with-tangency — smooth pasting as geometry; the course's best free-boundary picture.
- Merton's priority: the 1973 §8 closed form — smooth pasting's first rigorous appearance; one Notes line with the page.
- The $g(L)$ one-dimensional maximization plot (Fig 8.3.2) — an optimization a first-year student can check.

## Pitfalls
- This is an EXTRA: it must not be load-bearing — no core lesson may Ref it as prerequisite knowledge; forward references FROM it are fine.
- The supermartingale verification at the boundary uses the second derivative's jump (the value function is $C^1$ but not $C^2$ at $L^*$) — handle via the one-sided Itô argument stated honestly, or cite Shreve's handling; do not fake a clean Itô application across the kink.
- Keep the finite-expiry American put OUT except one Remark (free boundary becomes a curve, no closed form, numerical methods — Shreve §8.4 pointer).

## FIGURE PLAN
- draw: The candidate envelope — $v_L$ for five $L$ values against the intrinsic $K - x$; the unique tangent one highlighted; smooth pasting visible as tangency vs crossing. Faithful recreation of Shreve Fig 8.3.1. The lesson's signature.
- draw: $g(L)$'s hump — the 1-D objective with its interior maximum at $L^*$, endpoints annotated (exercise at $K$: zero value; exercise at 0: never collect). Inspired by Fig 8.3.2.
- draw: The three regions of the certification — the $x$-axis split at $L^*$: below, $v =$ intrinsic (exercise); above, ODE holds (martingale); at the point, both slope conditions; the linear-complementarity pair boxed per region. Original.
- draw: Comparative statics — $L^*/K$ as a function of $\sigma$ at three $r$ values; the $\sigma \to 0$ and $\sigma \to \infty$ limits annotated. Original.
- draw: Discrete-to-continuous — the module-3 discrete boundary (level 2 on the tree) beside the continuous $L^*$ formula's value for matched parameters; the mapping table underneath. Original (C5 spiral).

## EXERCISE PLAN
1. Warm-up: for $K = 100$, $r = 4\%$, $\sigma = 30\%$: compute $L^*$ and the put's value at $x = 120$; check $v > K - x$ there.
2. Derivation skipped: solve the Euler ODE from scratch (power ansatz, indicial equation), and show why the $x^1$ solution is excluded for the put (boundedness as $x \to \infty$).
3. Boundary probe: $r \to 0$ — show $L^* \to 0$ (never exercise) and reconcile with module 3's boundary-probe result that zero interest kills early exercise for puts; then $\sigma \to 0$ — $L^* \to K$ and the put degenerates to immediate-exercise intrinsic; name what each limit switches off.
4. Claim to refute: "value matching ($v(L) = K - L$) determines the boundary; smooth pasting is an extra assumption analysts impose." Refute via the candidate family: EVERY $v_L$ value-matches; only the maximizer is tangent — smooth pasting is the optimality condition, derived.
5. Mixed/spaced (E3): verify by Itô's formula (module 4) that $e^{-rt}v_{L^*}(S_t)$ has zero drift in the continuation region and negative drift below $L^*$ — the supermartingale certification, computed.
6. FORWARD (E7): price the same perpetual put by Monte Carlo under the risk-neutral measure with the $L^*$ exercise rule (simulate to first passage, discount) and compare to the closed form. Solution: pricing American claims by simulation in general — beyond a known boundary — is exactly what regression Monte Carlo (Longstaff–Schwartz, named in module 3's application) solves; this course's MC module covers the European machinery it builds on → Ref monte-carlo-pricing.

## ARC
- Inherits: the free-boundary problem's discrete twin (first-passage-perpetual-put), the stationary PDE (black-scholes-pde), the Snell certification pattern (american-derivatives).
- Contributes: the one American problem the continuum solves in closed form, and smooth pasting derived as optimality — the extra depth for readers who want the boundary theory.
- Hands off (as an extra, optional): free boundaries beyond closed form → numerical methods, outside the course's core path.
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5; off-path item).
