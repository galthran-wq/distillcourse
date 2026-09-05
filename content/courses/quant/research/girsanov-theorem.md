# Girsanov's theorem and the risk-neutral measure — research brief

Lesson: `girsanov-theorem` (module: risk-neutral-pricing, core, planned). NEW.
Goal: Construct the risk-neutral measure for the Black–Scholes market via Girsanov's theorem and prove that the change of measure moves only the drift.

## Sources
- Shreve II §1.6: Theorem 1.6.1 (a.s.-positive $Z$ with $EZ = 1$ builds an equivalent measure) and Example 1.6.6 — the recentering-a-normal computation ($Y = X + \theta$ becomes standard normal under $Z = e^{-\theta X - \theta^2/2}$) — the dossier calls it "a fully worked miniature of exactly the Girsanov trick… with zero stochastic calculus overhead". It opens the lesson.
- Shreve II §5.2.1–5.2.3: the Radon–Nikodym process $Z(t) = \exp(-\int\theta dW - \tfrac12\int\theta^2 du)$, Girsanov's theorem for one Brownian motion (Thm 5.2.3), the stock under $\tilde P$ ($dS = rS\,dt + \sigma S\,d\tilde W$), the market price of risk $\theta = (\alpha - r)/\sigma$; the proof's reliance on Lévy's characterization (Thm 4.6.4) — STATED, the fence.
- Baxter & Rennie §3.4: C-M-G with the likelihood-ratio-on-a-mesh construction (the discrete-to-continuous bridge told well) and the converse (only drift can change); "change of measure only ever changes drift" as the slogan proved.
- Module 2's state-prices-change-of-measure — the discrete rehearsal this lesson continuously extends (Ref throughout).

## Key points
1. Opening move: Example 1.6.6 worked completely — a static Gaussian recentering by an explicit density ratio; every feature of Girsanov (exponential kernel, mean shift only, variance untouched) present with no calculus. The lesson's L4 concrete instance.
2. The dynamic version assembled: on the mesh, the likelihood ratio of a drifted walk vs a driftless one is a product of per-step Gaussian ratios; the product telescopes to $\exp(-\theta W_t - \tfrac12\theta^2 t)$ (B&R's construction, shown for constant $\theta$) — the discrete $Z_n$ ladder of module 2 with Gaussian rungs; the exponential martingale recognized from ito-formula's warm-up exercise (Ref).
3. Girsanov stated (adapted $\theta(t)$, Novikov's condition named as the integrability fence): under $\tilde P$ with $d\tilde P = Z(T)dP$, $\tilde W(t) = W(t) + \int_0^t\theta\,du$ is Brownian motion. Proof strategy honestly fenced: $\tilde W$ is a continuous martingale under $\tilde P$ (shown via the $Z\tilde W$ martingale computation — do this Itô calculation in full, it is instructive) with QV $= t$ (QV is a path property, measure-blind — the key insight, prove it in one line); concluding "martingale + QV $t$ ⟹ BM" is Lévy's theorem, stated not proved.
4. Volatility invariance elevated to a principle: QV is computed path by path (module 4's drumbeat), and equivalent measures share paths — only WEIGHTS change; so no equivalent measure change can alter σ. This single sentence is why the smile (module 7) is a crisis: the market disagrees about the one parameter measure changes cannot touch.
5. Application to the market: choose $\theta = (\alpha - r)/\sigma$; the stock's drift becomes $r$; discounted stock a $\tilde P$-martingale. The market price of risk named; all assets on one Brownian driver must share it or admit arbitrage (forward pointer to the FTAP lesson's Example 5.4.4).

## Set pieces & gems
- Example 1.6.6 as the opener — Girsanov in one Gaussian integral.
- The telescoping likelihood-ratio product — the discrete ladder visibly becoming the exponential kernel.
- The "QV is measure-blind" argument — three lines that carry module 7's entire tension.
- The $Z\tilde W$ product-rule computation (Shreve's Lemma 5.2.2 mechanics) as the lesson's worked Itô example.

## Pitfalls
- Novikov/integrability: name the condition, do not develop; the constant-θ case (all this course needs) satisfies it trivially — say so.
- Lévy's characterization is the load-bearing fence; state it as a boxed theorem-without-proof with the citation (Shreve Thm 4.6.4), consistent with the course's honesty standard.
- Do not claim the risk-neutral measure is unique here — that is the SECOND fundamental theorem (next-but-one lesson); here one measure is CONSTRUCTED.
- Equivalent ≠ equal-null-sets sloppiness: paths are shared, probabilities differ; the phrase "changes the odds, not the film" is idiom — replace with the precise statement (L9b).

## FIGURE PLAN
- draw: The recentering — two Gaussian densities (N(θ,1) and N(0,1)) with the ratio $Z(x)$ plotted beneath; multiplying density × ratio = the shifted density, shown as an area-preserving re-weighting. FigureSequence (2 frames). Inspired by Example 1.6.6.
- draw: The telescoping ladder — the discrete $Z_n$ ladder (module 2's figure recalled, same layout) with Gaussian per-step ratios; the product collapsing to $e^{-\theta W - \theta^2t/2}$; the module-2 twin shown small in a corner ("same construction, new rungs"). C5 spiral, the lesson's signature.
- draw: One path, two measures — a single Brownian path; below it two weight-bars (P-weight, Q-weight) for a bundle of nearby paths; drift arrows differ, the path set identical; QV readout identical. Original — the volatility-invariance picture.
- draw: The drift transplant — $dS = \alpha S dt + \sigma S dW$ rewritten as $rSdt + \sigma S(dW + \theta dt)$ with underbraces; $\theta$'s definition boxed; the $d\tilde W$ substitution highlighted. Voita rule 7.
- draw: The market price of risk as a shared slope — two assets on one $W$: excess return vs σ as points on the line through the origin with slope θ; an off-line asset marked "arbitrage (Example 5.4.4, next)". Original, forward-looking.

## EXERCISE PLAN
1. Warm-up: verify $E[Z] = 1$ for $Z = e^{-\theta X - \theta^2/2}$, $X \sim N(0,1)$, by completing the square; then verify $E[Z\,\mathbb 1_{X + \theta \le a}] = N(a)$ — the recentering, by hand.
2. Derivation skipped: carry out the $Z(t)\tilde W(t)$ Itô product computation and show its $dt$ terms cancel — the martingale half of Girsanov's proof, in full.
3. Boundary probe: $\theta = 0$ — the theorem trivializes; and $\sigma \to 0$ with $\alpha \ne r$: θ blows up, $Z$ degenerates — the market with a riskless mispriced asset has NO equivalent martingale measure; connect to the arbitrage this implies (a preview of FTAP's taxonomy).
4. Claim to refute: "under the risk-neutral measure the stock's expected return is $r$, so risk-neutral pricing assumes investors expect stocks to earn the risk-free rate." Refute: the measure is a computational re-weighting constructed FROM no-arbitrage; investor expectations live under $P$, untouched; point to the demo of module 1's ArbitrageLock as the mechanism that needs no expectations at all.
5. Mixed/spaced (E3): compute the discrete-tree $Z_n$ for the CRR-calibrated tree ($q \to \tilde p$) at $n$ steps and show its log converges to $-\theta W_t - \tfrac12\theta^2 t$ with $\theta = (\alpha - r)/\sigma$ — the module-2 object's limit IS Girsanov's kernel.
6. Research-shaped: simulate 10,000 GBM paths under $P$ ($\alpha = 13\%$); estimate $E[Z(T)f(S_T)]$ for a call payoff and compare against direct risk-neutral simulation — importance sampling avant la lettre; report agreement within standard errors.
7. FORWARD (E7): with the measure in hand, write $V(0) = \tilde E[e^{-rT}(S_T - K)^+]$ and reduce it to an integral against the lognormal density — set up (do not evaluate) the two-region split at $S_T = K$. Solution: evaluating it IS next lesson's derivation of Black–Scholes → Ref risk-neutral-valuation.

## ARC
- Inherits: the discrete change-of-measure ladder (state-prices-change-of-measure), the exponential martingale (ito-formula), QV's path-property status (brownian-motion).
- Contributes: the continuous risk-neutral measure constructed; drift moves, volatility cannot — the theorem and the principle.
- Hands off: pricing as expectation under the constructed measure, and the formula by integration → risk-neutral-valuation.
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6).
