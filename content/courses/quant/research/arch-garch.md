# ARCH and GARCH — research brief

Lesson: `arch-garch` (module: volatility-dynamics, core, planned). NEW.
Goal: Construct the ARCH and GARCH models and prove their stationarity and heavy-tail properties from conditionally Gaussian shocks.

## Sources
- Engle 1982: §1's three-model progression (exogenous-variable variance — needs a known cause; bilinear — unconditional variance zero or infinite; ARCH — both fixed) — the dossier calls it "the natural way to motivate ARCH from scratch"; the ARCH(1)/ARCH(p) definitions; §3 Theorem 1 (2r-th moment exists iff $\alpha^r\prod(2j-1) < 1$: variance needs α<1, fourth moment needs 3α²<1 — heavy tails PROVED from Gaussian conditionals; the "temporal clustering of outliers" reading); §4 Theorem 2 (ARCH(p) stationarity, unconditional variance $\alpha_0/(1-\sum\alpha_j)$). Title-page capture on disk for the artifact slot.
- Bollerslev 1986: §1 (the practical problem — ARCH needs long ad hoc lags; the ARMA-vs-AR analogy), §2 (GARCH(p,q) definition; Theorem 1 stationarity iff $A(1)+B(1)<1$; the ARMA-in-squares representation eqs 6–7 with $v_t = r_t^2 - \sigma_t^2$), §3 (GARCH(1,1): Theorem 2 moment condition $\mu(\alpha,\beta,m)<1$; the closed-form kurtosis $6\alpha^2/(1 - \beta^2 - 2\alpha\beta - 3\alpha^2)$ — verify against the page image, OCR-garbled; mean/median lag), §4 (ACF/PACF of squares as the identification tool), Fig 1 (the moment-boundary curve family — source image on disk), Fig 2 (fitted GARCH(1,1) lag decay vs Engle–Kraft's imposed 8th-order declining lag — source image), §7's "adaptive learning" framing; the Engle–Kraft comparison numbers (mean lag forced 3⅓ vs data-chosen 5.85).
- Hull §23.2–23.3, §23.6 (EWMA as the β-only special case with ω=0 — RiskMetrics λ=0.94; mean reversion and the forecast term structure $E[\sigma^2_{t+k}] = V_L + (\alpha+\beta)^k(\sigma_t^2 - V_L)$, eq 23.14) — the practitioner layer.
- stylized-facts' forward exercise (ARCH(1) fitted, decay underpredicted) — the flaw this lesson's β fixes; Ref in the opening seam.

## Key points
1. Engle's progression as the lesson's opening argument (flaw-first, three beats): variance driven by an observable cause (works only when you know the cause); variance from $y_{t-1}$ multiplicatively (bilinear — degenerate unconditionally); variance from $r_{t-1}^2$ additively — ARCH: $\sigma_t^2 = \omega + \alpha r_{t-1}^2$, conditionally Gaussian, unconditionally well-behaved.
2. ARCH(1)'s two theorems proved at course depth: unconditional variance $\omega/(1-\alpha)$ (tower property — module 2's tools, Ref); the fourth moment and the kurtosis > 3 whenever α > 0 with existence iff 3α² < 1 (the law-of-iterated-expectations computation carried through). The punchline boxed as a synthesis: fat tails NEED no fat-tailed shocks — clustering alone manufactures them (the mechanism behind the stylized facts' coexistence of Gaussian-ish conditionals and wild unconditionals).
3. The flaw (from the forward exercise): ARCH(1)'s $|r|$-ACF dies at rate α per lag — too fast; matching months of memory needs many α's, and free lags go negative (Engle's own practice: ad hoc declining-weight restrictions). GARCH's fix: one β carrying yesterday's whole variance state — $\sigma_t^2 = \omega + \alpha r_{t-1}^2 + \beta\sigma_{t-1}^2$; the ARCH(∞) expansion with geometrically decaying weights $\alpha\beta^{j-1}$ (two parameters, infinite memory).
4. GARCH(1,1)'s structure theorems: stationarity iff α + β < 1 with $V_L = \omega/(1-\alpha-\beta)$; the ARMA(1,1)-in-squares representation (persistence parameter α+β — Box–Jenkins intuition transfers, per Bollerslev's own framing); the kurtosis closed form; the moment-boundary geometry (Fig 1); EWMA as the boundary case α+β=1, ω=0 (no mean reversion, no unconditional variance — why RiskMetrics forecasts are flat).
5. Forecasting: the k-step variance forecast's geometric decay toward $V_L$ at rate (α+β); the term structure of forecast volatility (Hull eq 23.14) — the object module 8's application lays against the implied term structure (plant the hand-off).

## Set pieces & gems
- Engle's three-model progression — the founding paper's own pedagogy, reused.
- The kurtosis-from-clustering theorem — the module's "aha", proved not asserted.
- Bollerslev Fig 2's two lag curves (imposed declining vs fitted geometric) and the mean-lag numbers (3⅓ forced vs 5.85 chosen) — the GARCH-beats-ARCH story in one figure.
- The Engle title page as artifact (source image) — the founding document of conditional heteroskedasticity.

## Pitfalls
- Everything here is under P — no pricing; say once that σ_t models the PHYSICAL dynamics, and pricing with it needs care (premia; the application lesson).
- Verify Bollerslev's kurtosis formula against the page image (the OCR garbles it; the dossier flags this) — the lesson must print the correct closed form and check it by simulation.
- α+β < 1 is covariance stationarity; the fourth moment needs strictly more (the Fig-1 boundary) — two different fences students conflate; box the distinction.
- IGARCH (α+β=1) gets one Remark (EWMA's home), not a section.
- Notation: Engle's $h_t$ vs Bollerslev's — standardize on $\sigma_t^2$ with a ledger note.

## FIGURE PLAN
- source: autoregressi-title-page — Engle 1982's Econometrica title page; save as `engle-1982-title`; the reader must see title/byline/abstract; placement: float right at the lesson's opening — the primary source as object.
- draw: The three-model progression — three boxes (exogenous / bilinear / ARCH), each with its equation and its one-line failure or fix; arrows left to right. From Engle §1; the lesson's opening figure.
- draw: The clustering machine — FigureSequence (3 frames): a large shock enters (frame 1); σ² jumps via α (frame 2); β carries it forward, decaying geometrically, spawning further large |r| (frame 3, the ACF inset building). Original — GARCH as mechanism, one change per frame.
- draw: Kurtosis from clustering — two histograms at equal variance: constant-σ Gaussian vs GARCH-mixed (a scale mixture drawn as overlaid narrow+wide Gaussians with the mixture's heavy result); the kurtosis formula beneath, color-bound. Original — the theorem as picture.
- source: generalizeda-fig2-lag-distribution — Bollerslev's Fig 2, fitted GARCH decay vs Engle–Kraft's imposed lag; save as `garch-vs-arch8-lags`; the reader must see the smooth geometric curve vs the truncated linear one; placement: beside the GARCH-fixes-ARCH section; the actual fitted-1948–83 curves are the evidence a redraw would fake.
- draw: The (α, β) map — the unit simplex with the stationarity line α+β=1, the fourth-moment boundary curve inside it (recomputed, inspired by Bollerslev Fig 1), Hull's fitted S&P point and RiskMetrics' EWMA point plotted. Original; the demo's static twin.
- draw: The forecast term structure — $E[\sigma^2_{t+k}]$ decaying geometrically to $V_L$ from above (post-shock) and below (calm); the annualized term-vol curve derived from it; the "implied term structure meets this" slot dashed. From Hull §23.6.

## EXERCISE PLAN
1. Warm-up: for ω = 2e-6, α = 0.13, β = 0.86: compute $V_L$, the persistence, the half-life of a variance shock, and tomorrow's σ after a 3% return day from σ = 1%.
2. Derivation skipped: derive the ARCH(1) kurtosis in full (compute $E[r^4]$ by iterated expectations with $E[\varepsilon^4]=3$) and verify the 3α² < 1 existence boundary; check by simulation at α = 0.5 vs α = 0.6.
3. Boundary probe: α + β = 1 exactly (IGARCH/EWMA): show $V_L$ diverges, the unconditional variance ceases to exist, yet the process remains well-defined conditionally; compute the k-step forecast (flat) and name what mean reversion's absence does to long-horizon risk estimates.
4. Claim to refute: "GARCH's fat tails come from its Gaussian assumption being wrong." Refute with the theorem: conditionals are EXACTLY Gaussian by construction and the unconditional kurtosis still exceeds 3; then the honest counterpoint — empirically even GARCH-standardized residuals stay somewhat fat (Cont's fact 7), so BOTH mechanisms operate; separate them cleanly.
5. Derivation skipped (second): derive the ARMA(1,1)-in-squares representation (define $v_t = r_t^2 - \sigma_t^2$, show it is a martingale difference, rearrange) and read off the persistence parameter.
6. Mixed/spaced (E3): the shuffle test (stylized-facts' demo) applied to a SIMULATED GARCH series: predict which of its measured properties survive shuffling, then verify — the model's tails are marginal, its clustering is dynamic, exactly like the data's.
7. FORWARD (E7): write the Gaussian conditional log-likelihood of a return series under GARCH(1,1) as a function of (ω, α, β) — just the expression, noting σ_t²'s recursive dependence on ALL earlier parameters. Solution: evaluating and maximizing this recursion is the next lesson's whole subject → Ref garch-mle.

## ARC
- Inherits: the specification $r_t = \sigma_t\varepsilon_t$ and the facts to reproduce (stylized-facts); conditional expectation's toolkit (module 2).
- Contributes: the model family — ARCH from Engle's progression, its proved fat tails, GARCH's two-parameter memory, stationarity/moment boundaries, and the forecast term structure.
- Hands off: the parameters are three numbers no theory supplies — estimation by maximum likelihood → garch-mle.
- Spine step: "Returns confess: volatility clusters, tails are heavy…" (step 8).
