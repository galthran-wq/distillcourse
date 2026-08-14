# Basis expansions, splines, and additive models — research brief

Lesson: `splines-gams` (module: linear-model, core, planned). NEW.
Goal: Construct spline bases and smoothing splines, measure their complexity in effective degrees of freedom, and extend them to additive models by backfitting.

## Sources
- ESL Ch. 5 (§5.2 piecewise polynomials/natural cubic splines Figs 5.1–5.3; §5.4 smoothing splines — the infinite-dimensional problem's finite minimizer, θ̂=(NᵀN+λΩ)⁻¹Nᵀy "a generalized ridge regression"; §5.4.1 df(λ)=trace(S_λ); §5.5.2 bias-variance vs df; the BMD growth-spurt example Fig 5.6; the phoneme example §5.2.3 — jagged coefficients halved-error 0.255→0.158 by a 12-basis natural spline).
- ISLP Ch. 7 (gentler regression-spline build: piecewise → constrained → natural; knot placement; smoothing-spline df; local-regression pointer; GAMs §7.7 with Wage partial plots).
- ESL §9.1 (GAMs: backfitting Algorithm 9.1; additive logistic on spam — 5.3% number the spam lessons use).
- Hastie & Tibshirani 1986 paper (research/texts/generalizeda-1986paper.pdf): backfitting §7.1, local scoring §7.2, breast-cancer ANODEV table; the s(x)-with-parametric-overlay signature plot. (Monograph is toc-only — flagged in sources.yaml.)
- Murphy §11.5 (B-spline basis pictures, ties to ridge).

## Key points
1. The move: keep the linear machinery, change the columns. Polynomial basis and its boundary pathology (degree-15 tail wiggle — worked); piecewise cubics; continuity/derivative constraints counted (df arithmetic: pieces×4 − knots×3); natural splines' boundary linearity.
2. The smoothing spline theorem: minimize RSS + λ∫f″² over ALL twice-differentiable f — the minimizer is a natural cubic spline with knots at the data (statement + proof sketch of why: any competitor is beaten by its spline interpolant); the finite problem is generalized ridge. The ridge-lasso seam is structural, not decorative.
3. Effective df = trace(S_λ) — defined, computed for extremes (λ=0 → n, λ=∞ → 2); unifies this lesson with ridge (trace of its smoother) and k-NN (n/k) on ONE complexity scale. KeyFact material: df is a dial you buy with data.
4. Choosing λ: bias-variance vs df curves; CV named with forward Ref (module 5 owns the machinery); the hat-matrix LOOCV shortcut inherited from regression-diagnostics' exercise.
5. GAMs: f(x) = α + Σf_j(x_j); backfitting derived as coordinate descent on partial residuals; local scoring one paragraph; what additivity buys (interpretable partial plots) and costs (no interactions — the tree/boosting contrast planted).
6. The phoneme and BMD set pieces as the payoff: real curves no global polynomial fits; regularized coefficients as the difference between noise and signal.

## Set pieces & gems
- ESL Fig 5.6 (bone density by sex — female growth spurt ~2yr earlier): the human-visible smoothing-spline result; recreate with the public bmd data shape.
- Phoneme log-periodograms (ESL §5.2.3): jagged vs natural-spline-smoothed coefficient curves, 0.255→0.158 test error — keeper numbers.
- The 1986 GAM paper's expected-log-likelihood argument (§5): unconstrained per-point fitting sends logistic η to ±∞ — "smoothness is not cosmetic".
- ISLP Fig 7.7 (degree-15 polynomial vs 15-df natural spline tails).

## Pitfalls
- Do not build the B-spline recursion (computation detail — one sentence + reference); the truncated-power basis suffices for exposition.
- The smoothing-spline theorem proof: sketch only, honestly labeled; full proof is out of scope.
- GAM fitting subtleties (concurvity, se bands) — omit; one honest limitation sentence.
- Wavelets (ESL §5.9) — cut entirely (serves no outcome).

## FIGURE PLAN
- draw: FigureSequence (4 frames): same data fitted by (1) global cubic, (2) piecewise cubics discontinuous at 2 knots, (3) continuity+derivative constraints imposed, (4) natural spline with linear tails. One change per frame. Inspired by ESL Figs 5.1–5.2/ISLP Fig 7.3.
- draw: The df ruler — one horizontal axis of effective df with markers: OLS p, ridge trace, smoothing spline df(λ) at three λ, k-NN n/k; every smoother a point on one scale. Single Figure; the lesson's unification image.
- draw: Smoothing-spline λ sweep — three fits (rough/right/oversmooth) with df labels, plus the bias²/variance/total curves vs df beside them. Inspired by ESL Fig 5.9.
- draw: Backfitting — FigureSequence (3 frames) on 2-feature toy data: fit f₁ to partial residuals, fit f₂ to updated residuals, cycle converged; the partial-residual formula bound to the moving panel.
- draw: GAM partial-dependence panel — three per-feature smooths for a Wage-like fit (year/age/education), the additive surface read one axis at a time. Inspired by ISLP Fig 7.11.
- draw: The phoneme curves — raw 256-coefficient jagged logistic coefficients vs the 12-basis natural-spline version (recreated qualitatively); the two test errors as a tally. Inspired by ESL Fig 5.5.

## EXERCISE PLAN
1. Warm-up: count df for a cubic spline with 4 interior knots, then its natural version (the constraint arithmetic once).
2. Derivation skipped: show the truncated-power basis {1,x,x²,x³,(x−ξ)³₊} spans continuous-second-derivative piecewise cubics with one knot (verify continuity of f, f′, f″ at ξ).
3. Boundary probe: λ→∞ in the smoothing spline — the penalty annihilates f″; show the limit is the least-squares LINE (not a constant), and why (the null space of the penalty).
4. Claim to refute: "a smoothing spline with knots at every data point must interpolate and hence overfit." Refute via the penalty: knots give capacity, λ removes it; df(λ), not knot count, is the complexity. Name the confused quantities.
5. Mixed review (E3): compute trace(S) for ridge on orthonormal design (Σ d_j²/(d_j²+λ) with d_j=1) and place it on the df ruler — ridge-lasso composed with this lesson.
6. Research-shaped: reproduce the BMD result: fit smoothing splines by sex on the provided bmd sample at df≈12; report the age gap between the two spurt peaks and compare with ESL's ≈2 years.
7. FORWARD (E7): fit a GAM to 2-feature data generated with a strong x₁x₂ interaction; observe the additive fit's irreducible residual structure. Solution: models that learn interactions from data — trees (module 6) and boosted trees (module 7, where tree depth caps interaction order) → Ref decision-trees.

## ARC
- Inherits: the linear machinery (ols) and the penalty discipline (ridge-lasso — the smoothing spline IS generalized ridge).
- Contributes: flexibility bought inside the linear model, priced on one honest scale (effective df), and the additive-model compromise.
- Hands off: the whole module's estimators assembled for a verdict on real data → prostate-study; the interaction gap → module 6.
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3).
