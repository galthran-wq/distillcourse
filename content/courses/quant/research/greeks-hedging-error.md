# The Greeks and discrete hedging error — research brief

Lesson: `greeks-hedging-error` (module: black-scholes, core, planned). NEW.
Goal: Compute delta, gamma, and theta, prove the identity linking them, and quantify the error of rebalancing a delta hedge at discrete times.

## Sources
- Shreve II §4.5.5: delta/theta/gamma closed forms, the delta-neutral long-gamma construction and Fig 4.5.1 (the tangent-line diagram — convexity profits either way), the Greeks-identity reading of the PDE.
- Hull Ch.19: §19.4 delta hedging with the two path simulations (Tables 19.2–19.3: the written 20-week call, $S_0=49$, $K=50$; hedge cost 263,300 vs 256,600 on ITM/OTM paths, both near the 240,000 BS value ×1.02–1.10); Table 19.4 (performance measure falling with rebalance frequency: 1.0→0.5 as interval shrinks — the contrast with stop-loss's plateau); §19.5–19.8 theta/gamma/vega shapes; eq 19.4 ($\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = r\Pi$); the "buy high, sell low" reading of delta hedging.
- Boyle & Emanuel 1980 (NOT FOUND — abstract-level): single-period hedge P&L ~ chi-squared, error std ~ $1/\sqrt n$; cite as the source of the scaling law with the "full copy pending" flag in References; the lesson's own simulation carries the evidentiary weight.
- Baxter & Rennie Figs 3.15–3.17 (two simulated paths with evolving option value and hedge ratio; delta → 1 or 0) — figure inspiration.
- Hull vega §19.8: vega defined here (needed by module 7), one section.

## Key points
1. The Greeks as the formula's derivatives, each computed and SHAPED: $\Delta = N(d_1)$ (the ramp; steepens near expiry), $\Gamma = N'(d_1)/(S\sigma\sqrt{T-t})$ (a bump at the money, exploding at the kink as $t \to T$), $\Theta$ (negative for calls, the mirror of gamma), $V = S\sqrt{T-t}N'(d_1)$ (vega, always positive — the module-7 hook).
2. The identity: the PDE re-read as $\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = r\Pi$ — for a delta-neutral book, theta is gamma's rent: $\Theta \approx -\tfrac12\sigma^2S^2\Gamma$. Proved by substitution; then used to interpret every simulation that follows.
3. One-step P&L of a delta-hedged short call: $-\tfrac12\Gamma(\Delta S)^2 - \Theta\Delta t + O(\Delta t^{3/2})$; expectation ≈ 0 by the identity (with $E[(\Delta S)^2] = \sigma^2S^2\Delta t$); variance $\propto \Gamma^2 S^4\sigma^4 (\Delta t)^2$ per step, $n$ steps ⟹ terminal error std $\propto 1/\sqrt n$. The Boyle–Emanuel law derived at the heuristic level the course can support, then MEASURED.
4. Hull's simulation read closely: Tables 19.2–19.3's two paths narrated (the hedge "buys high, sells low" and the accumulated cost IS the option value); Table 19.4's performance-vs-frequency line against the stop-loss plateau (Ref stop-loss-paradox — the promised contrast delivered; C5 spiral).
5. Delta-neutral long-gamma as a position: profits $\tfrac12\Gamma(\Delta S)^2$ from a move EITHER way, bleeds $\Theta\Delta t$; the breakeven daily move $S\sigma\sqrt{\Delta t}$ — "realized vs implied" in embryo (one forward sentence to module 8).

## Set pieces & gems
- Fig 4.5.1's tangent diagram — the single most reusable options picture; recreate carefully.
- Hull's two-path hedge tables — the worked "watch the hedge in action" narrative (with B&R's delta→1/0 endings).
- The breakeven-move computation ($S = 49$, $\sigma = 20\%$: daily breakeven ≈ 0.62) — a number with a frame.
- The identity as "theta pays gamma's rent" — stated dry, derived exactly.

## Pitfalls
- The $1/\sqrt n$ derivation here is heuristic (independence of step P&Ls is approximate); say so and lean on the lab's measurement + the pending Boyle–Emanuel citation — the honesty fence again.
- Gamma explodes at the kink at expiry: flag that near-expiry ATM hedging error is dominated by one step — the $1/\sqrt n$ law is a smooth-regime statement (the demo's digital task shows the breakdown).
- Do not introduce vega hedging/vol trading; vega is defined, used in module 7.
- Hull's performance measure vs P&L std: keep ONE definition (std of cost / option price) consistent with the stop-loss lesson.

## FIGURE PLAN
- draw: The Greeks gallery — 2×2 small multiples: $\Delta, \Gamma, \Theta, V$ vs $S$ at two maturities each; shared axes; the ATM bump/ramp geometry visible. Inspired by Hull Figs 19.5–19.10.
- draw: The tangent diagram — option curve, tangent at $S_0$ (the hedge), the $\tfrac12\Gamma(\Delta S)^2$ gap shaded for an up and a down move; theta's bleed as a small downward arrow on the curve itself. Faithful recreation of Shreve Fig 4.5.1. The lesson's signature.
- draw: One-step P&L ledger — FigureSequence (3 frames): frame 1 the positions (short call, long $\Delta$ shares, cash); frame 2 the stock moves, each position's P&L labeled; frame 3 the net = $-\tfrac12\Gamma(\Delta S)^2 - \Theta\Delta t$, terms color-bound to the identity. Voita rule 7.
- draw: Hedge-in-action — B&R-style: one ITM-ending and one OTM-ending path, with delta's trajectory underneath each converging to 1 / 0; hedge cost accumulating in a third band. Inspired by B&R Figs 3.15–3.17 / Hull Tables 19.2–19.3.
- draw: Error vs frequency — log-log: delta hedge's error std falling with slope −1/2 (measured points from our simulation + Hull's Table 19.4 values), the stop-loss plateau overlaid from the module-4 application (same axes — the promised two-curve contrast in one frame). The module's headline chart.

## EXERCISE PLAN
1. Warm-up: for Hull's written call ($S_0 = 49$, $K = 50$, $\sigma = 20\%$, $r = 5\%$, 20 weeks): compute $\Delta, \Gamma, \Theta$, vega at inception and the week-1 rebalance size for a \$0.90 up-move.
2. Derivation skipped: prove the identity $\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rc$ directly from the closed forms (not via the PDE) — the differentiation gauntlet, including the $N'(d_1)$ cancellations.
3. Boundary probe: at $t \to T$, $S = K$ exactly: show $\Gamma \to \infty$ like $1/\sqrt{T-t}$ and $\Delta$'s jump; compute the one-step hedging error for the final step and conclude which claims of the lesson fail in this corner.
4. Claim to refute: "a delta-hedged position is riskless, so its P&L is zero every period." Refute with the one-step ledger: expectation ≈ 0, variance > 0; name the term (gamma) and the limit in which the claim becomes true.
5. Research-shaped: reproduce Hull Table 19.4's performance measures at intervals {4w, 2w, 1w, 0.5w, 0.25w} with 1,000 paths; fit the log-log slope and report it with a standard error (target: −0.5 within noise).
6. Mixed/spaced (E3): compute the delta-hedge's terminal cost along module 2's CRR tree path (discrete world) and reconcile with the continuous story: the tree hedge is EXACT — what about the tree makes the error zero, and what does the continuum charge for?
7. FORWARD (E7): for the delta-neutral long-gamma book, express the daily P&L as $\tfrac12\Gamma S^2(\text{realized move}^2 - \sigma^2\Delta t)$ and note it is a bet that realized variance exceeds the σ² used in the price. Solution: the P&L of every option book is a realized-vs-implied variance bet — module 8's closing lesson prices it → Ref realized-implied-smile.

## ARC
- Inherits: the formula (black-scholes-formula), the PDE (black-scholes-pde), quadratic variation's second-order verdict (module 4).
- Contributes: the risk inventory (Greeks), the identity binding them, and the quantitative law of discrete hedging — the $1/\sqrt n$ line the stop-loss plateau made necessary.
- Hands off: delta hedging at market scale, October 1987 → portfolio-insurance-1987; the measurement itself → discrete-hedging-lab.
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5).
