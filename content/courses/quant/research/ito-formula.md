# The Itô–Doeblin formula — research brief

Lesson: `ito-formula` (module: continuous-limit, core, planned). NEW.
Goal: Apply the Itô–Doeblin formula to Brownian motion and Itô processes, and solve the geometric Brownian motion and Ornstein–Uhlenbeck equations.

## Sources
- Shreve II §4.4: Theorem 4.4.1 (Itô–Doeblin for BM; the Taylor-expansion derivation with Fig 4.4.1 — carry the derivation, fencing the convergence of the remainder honestly), Lemma 4.4.4 + Theorem 4.4.6 (Itô processes and the general formula; $dX\,dX$ computed by the multiplication table), Example 4.4.8 (generalized GBM solved), Theorem 4.4.9 (deterministic-integrand integrals are Gaussian — from last lesson's boundary probe, now official), Example 4.4.10 (Vasicek/OU solved by integrating factor — present as "the Ornstein–Uhlenbeck process", mean-reverting; the interest-rate reading gets one sentence per the rates fence), Example 4.4.11 (CIR: same trick gives moments but no closed form — the honest counterpoint, one Remark).
- Shreve II §4.6: the Itô product rule (Corollary 4.6.3) — needed for module 5's derivation; two-dimensional formula stated, Lévy's theorem NAMED only (module 6 cites it for Girsanov's fence).
- Baxter & Rennie §3.3 (Itô's formula via partition sums; the Doléans exponential) as secondary.
- Shreve II Ch.6 summary's recipe ("find the martingale, take the differential, set the dt term to zero") — introduce the phrase here as a closing observation; module 6 elevates it.

## Key points
1. The derivation as honest Taylor bookkeeping: $f(W_{t+dt}) - f(W_t) = f'\Delta W + \tfrac12 f''(\Delta W)^2 + o$; summed over a partition, the first term → Itô integral, the second → $\tfrac12\int f''\,dt$ by the QV theorem (Ref), the rest → 0 (sizes tabulated: $\Delta t^{3/2}$ and smaller). The formula is the QV theorem wearing a chain rule's clothes.
2. Immediate audit: $f(x) = x^2$ reproduces last lesson's $\int W\,dW$ result — continuity of evidence, one line.
3. Itô processes ($dX = \mu\,dt + \sigma\,dW$, both adapted) and the multiplication table ($dW dW = dt$, $dW dt = dt dt = 0$) as the mechanical rule; the general formula; $dX\,dX = \sigma^2 dt$ (drift invisible to QV — the earlier boundary probe now a theorem).
4. GBM solved in full: apply the formula to $\log S$, integrate, exponentiate — $S(t) = S_0\exp((\alpha - \tfrac12\sigma^2)t + \sigma W)$; the $-\tfrac12\sigma^2$ met for the third time (walk limit, naive-audit, now Itô) — reconcile all three in one Remark; the median-vs-mean gap computed (a stock with $\alpha = 0$, $\sigma = 40\%$ halves its median in ~4.3 years while its mean is flat — a number with a frame, L12b).
5. OU by integrating factor: $d(e^{\beta t}R)$ via the product rule; the closed form; mean reversion read off (deterministic decay toward the long-run mean + accumulating Gaussian noise). CIR contrast in a Remark: the same trick yields mean/variance but the SDE has no closed-form solution — "solvable" is the exception, and module 6's Monte Carlo is the general tool (forward sentence).
6. SDEs named as objects (existence/uniqueness fenced to Lipschitz conditions, cited); the product rule; the closing observation: every pricing argument to come is "write a candidate value process, apply Itô, and kill the $dt$ term" — the recipe stated once, dryly.

## Set pieces & gems
- The size table for Taylor terms ($\Delta W \sim \sqrt{\Delta t}$, $(\Delta W)^2 \sim \Delta t$, $(\Delta W)^3 \sim \Delta t^{3/2}$, $\Delta W \Delta t \sim \Delta t^{3/2}$) — the whole formula in one table.
- GBM's $-\tfrac12\sigma^2$ triangulated from three independent computations — the course's recurring constant earns a synthesis KeyFact (L15-compliant: it's a cross-lesson synthesis, not a restatement).
- The Vasicek/CIR pairing as a "when can you solve the SDE" case study (reader-summary gem), compressed to one Example + one Remark.

## Pitfalls
- The remainder-term convergence in the derivation is where the real analysis lives; fence it explicitly ("the full proof controls these sums uniformly; see Shreve §4.4 references") — the derivation shown is the honest heuristic Shreve himself stages.
- Do not present the multiplication table as an axiom; it is the QV theorem plus two size estimates — Ref back every time it is first used.
- OU must not become an interest-rate lesson: name Vasicek once, then call the process OU; CIR gets a Remark, not a section (rates fence).
- The product rule needs cross-variation $dX\,dY$; define it in one line via polarization, don't develop covariation theory.

## FIGURE PLAN
- draw: Taylor under the microscope — FigureSequence (3 frames): frame 1 a smooth $f$ over one BM increment with the tangent (first-order) error shaded; frame 2 the second-order parabola correction absorbing most of it, $(\Delta W)^2$ labeled; frame 3 the summed ledger with the size table, surviving terms boxed. Inspired by Shreve Fig 4.4.1.
- draw: The multiplication table as a literal 3×3 grid ($dW, dt$ against themselves), entries $dt, 0, 0$…, each cell citing its one-line justification. Single Figure, referenced by later lessons.
- draw: GBM solved — the derivation dissected in place: $d\log S$ computed with underbraces (chain-rule term / QV correction), then the exponentiated solution with the drift split $(\alpha - \tfrac12\sigma^2)t$ color-bound to its origin brace. Voita rule 7. The lesson's signature.
- draw: Mean vs median fan — 200 simulated GBM paths ($\alpha = 0$, $\sigma = 0.4$, 10y): the mean line flat, the median decaying, a handful of huge paths carrying the mean; annotation with the halving-time number. Original.
- draw: OU mean reversion — three OU paths from different starts converging in distribution to the long-run band; the integrating-factor identity beside, its two terms bound to "decay" and "accumulated noise". Original.

## EXERCISE PLAN
1. Warm-up: apply the formula to $f(t, x) = e^{\sigma x - \sigma^2 t/2}$ and show $dZ = \sigma Z\,dW$ — the exponential martingale has no $dt$ term (this object returns as Girsanov's kernel; note it).
2. Derivation skipped: prove the Itô product rule from the two-argument formula (or from $(X+Y)^2$ polarization) — the corollary module 5's derivation will consume.
3. Boundary probe: $\sigma = 0$ throughout — confirm the formula degenerates to the ordinary chain rule, and identify exactly which term the classical rule was always missing and why it vanished.
4. Claim to refute: "for the driftless stock ($\alpha = 0$), $S(t)$ neither grows nor decays, so a typical path stays near $S_0$." Refute with the solved form: the TYPICAL (median) path decays like $e^{-\sigma^2 t/2}$; the mean is held up by rare large paths. Name the term responsible.
5. Strategy choice (playbook-math mix): three SDEs — GBM, OU, and $dX = X^2 dt + dW$; for each, say which solution technique applies (log transform / integrating factor / none — cite the fence) BEFORE computing; then solve the two solvable ones.
6. Mixed/spaced (E3): re-derive the binomial limit of module 4's opening lesson by applying Itô's formula to $\log S$ under GBM and comparing with the CRR-calibrated tree's per-step mean and variance of $\log$-increments.
7. FORWARD (E7): let $c(t,x)$ be any smooth function and $S$ a GBM. Expand $dc(t, S(t))$ by the formula and collect the $dW$ and $dt$ terms separately (do not set anything to zero). Solution: the two collected lines are the exact raw material of the Black–Scholes derivation — next module equates them to a hedge's evolution → Ref black-scholes-pde.

## ARC
- Inherits: the Itô integral and its QV accounting (ito-integral); QV itself (brownian-motion).
- Contributes: the chain rule of the rough world, the multiplication table, GBM and OU in closed form, the product rule — the complete working toolkit the pricing modules consume.
- Hands off: the toolkit turned on the hedging problem (stop-loss first — the cautionary application; then Black–Scholes) → stop-loss-paradox, black-scholes-pde.
- Spine step: "Refining the tree does not smooth the randomness away…" (step 4).
