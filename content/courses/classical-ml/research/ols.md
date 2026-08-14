# Ordinary least squares — research brief

Lesson: `ols` (module: linear-model, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/ols/lesson.mdx (26 min).
Goal: Derive the OLS normal equations by matrix calculus and by projection geometry, and prove the Gauss–Markov theorem.

## Sources
- ESL §3.2 (normal equations, projection geometry Figs 3.1–3.2, Gauss–Markov §3.2.2, sampling distribution β̂ ~ N(β, σ²(XᵀX)⁻¹)).
- Murphy §11.2 (OLS as MLE; geometric interpretation; QR/SVD as the numerically right solvers — the lab needs this), §7.7 (least-squares solving).
- ISLP §3.1–3.2 (inference framing: SEs, t/F statistics — keep light; the Advertising confounder story feeds regression-diagnostics instead).
- CS229 Ch. 1 (matrix-derivative derivation, every step — mirror its completeness).
- Casella & Berger §11.3 (t-pivots for slope/intercept — pointer only).

## Key points
1. Three derivations of one estimator, in order: (a) calculus — expand ‖y−Xβ‖², matrix gradient, normal equations, with the matrix-calculus identities stated as a mini notation ledger; (b) geometry — ŷ is the projection of y onto col(X); residual ⊥ columns IS the normal equations; hat matrix H = X(XᵀX)⁻¹Xᵀ as a projection (H²=H, symmetric); (c) likelihood — Gaussian noise makes OLS the MLE (module-2 seam, two lines).
2. The estimator as a random object: E[β̂] = β (unbiased), Cov(β̂) = σ²(XᵀX)⁻¹ — derived; the fisher-information seam: this equals the CRLB under Gaussian noise, so OLS is efficient there.
3. Gauss–Markov proved in full: any linear unbiased estimator = ((XᵀX)⁻¹Xᵀ + D)y with DX = 0; its covariance exceeds OLS's by DDᵀ ⪰ 0. Assumptions surfaced BEFORE the proof (exogeneity, homoscedasticity, full rank) and each pointed at the diagnostics lesson that stress-tests it.
4. What Gauss–Markov does NOT say: best among LINEAR UNBIASED only — nonlinear or biased estimators may beat it (ridge will; James–Stein one-sentence ★). This honesty is the door to ridge-lasso.
5. Singularity: collinear columns / p>n make XᵀX singular; infinitely many minimizers; the minimum-norm choice named (module 11 seam planted quietly).
6. Practice notes: never invert — QR/SVD (lab seam); units and centering.

## Set pieces & gems
- The projection picture (ESL Fig 3.2) — THE figure of this lesson.
- Gauss's/Legendre's priority dispute — one dry sentence of history max (1795/1805/1809).
- ISLP Fig 3.3 (population line vs many sample lines) — the unbiasedness visual.

## Pitfalls
- The three derivations must not read as three lessons: one estimator, three lights; seams say what each adds (existence/geometry/optimality-context).
- Keep inference (t/F tests) to one paragraph + pointer — this course is prediction-first; diagnostics lesson handles interpretation traps.
- State the fixed-design convention (X fixed, y random) once, explicitly.

## FIGURE PLAN
- draw: FigureSequence (4 frames) of the calculus derivation — the objective expanded, gradient term by term, set to zero, solved; formula-dissection style with underbraces (voita rule 7).
- draw: The projection picture — y above the col(X) plane, ŷ its foot, residual perpendicular; the normal equations written as the perpendicularity statement beside it. Recreation of ESL Fig 3.2. The lesson's key image.
- draw: Sampling variability — one true line, 20 fitted lines from resampled noise (spaghetti), their average on the truth; Cov(β̂) bound to the spread. Inspired by ISLP Fig 3.3.
- draw: Gauss–Markov proof map — the space of linear unbiased estimators as a plane with OLS at the variance minimum; the D-matrix decomposition annotated. Single schematic Figure.
- draw: Singular case — two collinear columns spanning a line, the fit unique on the line but β non-unique; a small "many β, one ŷ" panel. Single Figure (plants ridge AND min-norm).

## EXERCISE PLAN
1. Warm-up: solve the normal equations by hand for n=3, p=1 with intercept; check against the x̄,ȳ formulas.
2. Derivation skipped: prove H is a projection (H²=H, Hᵀ=H) and that trace(H) = p — the reader meets effective df's ancestor. Solution notes trace(H)=p returns in splines-gams → Ref.
3. Boundary probe: duplicate one column of X exactly. Show XᵀX is singular, exhibit two different β with identical ŷ, and state which Gauss–Markov hypothesis died.
4. Claim to refute: "since OLS is BLUE, no estimator has smaller MSE." Name the two escape doors (nonlinear, biased) and exhibit the trivial biased counterexample β̃=0 when β is small.
5. Mixed review (E3): verify OLS attains the Cramér–Rao bound under Gaussian noise for p=1 (fisher-information composed with this lesson).
6. Research-shaped: on the prostate data extract (8 predictors, provided), compute β̂ via lstsq and via explicit inverse; report the coefficient difference under a deliberately near-collinear duplicate column — numerical fragility measured.
7. FORWARD (E7): compute β̂λ = (XᵀX+λI)⁻¹Xᵀy on the singular duplicate-column problem for λ=0.01 — suddenly unique and finite. Solution: that repair is ridge, next lesson → Ref ridge-lasso.

## ARC
- Inherits: MLE (the Gaussian-noise reading), the CRLB (the efficiency context), Newton-free closed forms.
- Contributes: the linear model's exact solution, its geometry, and its optimality certificate with the fine print exposed.
- Hands off: the fine print's two exits — deliberate bias (ridge-lasso) and assumption failure (regression-diagnostics).
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3).

## REVISION (vs old draft)
- Gains: the full Gauss–Markov proof (old draft states it; depth target demands the D-matrix argument); the hat-matrix/projection development (trace(H)=p exercise); the fisher-information efficiency seam (new upstream lesson); the singularity section expanded to plant min-norm for module 11; QR/SVD practice note for the lab.
- Loses: "most common whiteboard request" framing and all interview register; the derivation-as-performance tone becomes derivation-as-argument.
- Exercises rebuilt to the floor; add the CRLB mixed item.
