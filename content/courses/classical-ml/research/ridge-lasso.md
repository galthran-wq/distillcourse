# Ridge and lasso regularization — research brief

Lesson: `ridge-lasso` (module: linear-model, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/ridge-lasso/lesson.mdx (28 min).
Goal: Explain why the L1 penalty produces exact zeros while L2 only shrinks, using constraint geometry, soft thresholding, and Bayesian priors.

## Sources
- ESL §3.4 (ridge eqs 3.41–3.44 incl. Bayesian view λ=σ²/τ²; SVD shrinkage view Fig 3.9 idea — d_j²/(d_j²+λ); lasso; Fig 3.11 diamond-vs-disk; Table 3.4 orthonormal operators: hard-threshold / proportional shrink / soft-threshold; LAR/piecewise-linear paths §3.4.4 as ★).
- Murphy §11.3–11.4 (ridge-PCA/SVD connection §11.3.2; lasso subsections: soft vs hard thresholding, why L1 sparsifies, regularization path, elastic net; Fig 11.10-12 prostate case).
- ISLP §6.2 (constraint-region formulations 6.8–6.10; the gentler geometry).
- SSBD Ch. 13 (RLM naming; stability reading — one forward sentence to module 9).
- Bishop §3.3 (ridge as MAP — cross-check).

## Key points
1. The problem inherited: OLS variance explodes under collinearity/p≈n (ols's singular door). Ridge: derive the closed form; existence for any λ>0 (XᵀX+λI ≻ 0 — prove).
2. The SVD anatomy: β̂ridge shrinks component j by d_j²/(d_j²+λ) — derived; small-variance directions (the unstable ones) shrink hardest. Bias and variance of ridge computed in the orthonormal case; the exact statement that some λ>0 beats OLS in MSE (existence argument).
3. Orthonormal trichotomy (ESL Table 3.4): best subset = hard threshold, ridge = proportional shrink, lasso = soft threshold — derive the lasso case honestly via the subgradient/case analysis at zero. The soft-thresholding operator S(z,γ) named and drawn (the lab's kernel).
4. Geometry: the constrained forms; diamond corners vs disk; why corners ⇒ exact zeros in general position. State clearly this is intuition made honest by the orthonormal derivation, not by the picture alone.
5. Bayesian reading: Gaussian→ridge, Laplace→lasso (mle-map's dictionary cashed); why the Laplace prior's spike at 0 is the sparsity engine.
6. Practice: standardize first (and why — penalty units), intercept unpenalized, λ by CV (forward Ref module 5), elastic net for correlated groups, the lasso path is piecewise linear (stated; LAR ★).

## Set pieces & gems
- The diamond/disk picture (ESL Fig 3.11) — "arguably the most reproduced diagram in applied statistics" — recreate in house style.
- Table 3.4's three operators plotted on one axis — the lesson's analytical punchline.
- Murphy's ridge-shrinks-small-singular-directions tie-back to eigen-geometry.

## Pitfalls
- The diamond picture alone proves nothing — pair it with the orthonormal derivation (refutation of picture-only teaching).
- Lasso has no closed form in general — say so; coordinate descent is the lab's job; don't hand-wave "solved by soft thresholding" for correlated X.
- Do not claim lasso always selects the true variables (irrepresentable-condition honesty, one sentence).

## FIGURE PLAN
- draw: The variance explosion — OLS coefficient spread vs correlation of two predictors (computed curve), with the ridge-repaired spread beside it. Single Figure; the flaw-first opener.
- draw: FigureSequence (3 frames): SVD shrinkage — (1) data ellipse with principal directions, (2) OLS components along each direction, (3) ridge multiplying each by d_j²/(d_j²+λ) with the small direction visibly crushed. Inspired by ESL Fig 3.9.
- draw: The three operators — hard threshold, proportional shrink, soft threshold plotted against the OLS coefficient on one axis (45° line dashed). Recreation of ESL Table 3.4 as a figure. Key image candidate.
- draw: Diamond vs disk — RSS contours meeting the L1 diamond at a corner (zero) vs the L2 disk off-axis; same contours both panels (voita comparison rule). Recreation of ESL Fig 3.11.
- draw: Coefficient paths — ridge paths (never zero) vs lasso paths (hitting zero one by one) vs λ on the prostate data, computed; vertical one-SE marker anticipated in gray. Replaces the old demo (see REVISION).
- draw: The two priors — Gaussian vs Laplace densities overlaid at matched variance; the Laplace spike at zero highlighted; MAP objective under each written beneath. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute S(z, γ) for z ∈ {−3, −0.5, 0.5, 3}, γ=1; sketch the map.
2. Derivation skipped: derive the orthonormal-case lasso solution by explicit case analysis (z>γ, |z|≤γ, z<−γ) from the one-coordinate objective ½(z−β)² + γ|β|.
3. Boundary probe: λ→∞ and λ→0 limits of both estimators; then the p>n case — show ridge is defined for all λ>0 while OLS is not, and what the lasso can select at most (min(n,p) variables — state, don't prove).
4. Claim to refute: "ridge with very large λ also produces sparsity, since coefficients go to zero." Refute: they vanish only in the limit and never exactly; the subgradient at 0 (absent for L2) is the mechanism; name the failing step.
5. Mixed review (E3): compute the ridge estimator's bias² + variance in the orthonormal case as a function of λ and find λ* minimizing MSE for given β, σ² — the bias-variance ledger with real algebra.
6. Research-shaped: on the prostate extract, fit lasso at the λ selecting 3 variables; compare YOUR selected set with ESL Table 3.3's (lcavol, lweight, svi); report agreement.
7. FORWARD (E7): fit ridge on 20 noisy samples of a sine curve using 12 polynomial features at three λ; observe wiggliness controlled by λ. Solution: penalizing derivatives directly instead of coefficients is the smoothing spline → Ref splines-gams.

## ARC
- Inherits: OLS and its two failure doors (variance under collinearity; singularity); the MAP dictionary from mle-map; the biased-can-beat-unbiased license from bias-variance/fisher-information.
- Contributes: the deliberate-bias toolkit and the exact mechanism separating shrinkage from selection.
- Hands off: penalties that act on function shape (splines-gams); the assumptions audit (regression-diagnostics); λ-selection debt to module 5.
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3).

## REVISION (vs old draft)
- Gains: the SVD-shrinkage derivation carried through (old draft states the factor); the orthonormal lasso case analysis in full; the exact ridge-beats-OLS MSE argument; the Laplace-prior mechanism section; depth to 40 min.
- Loses: the CoefficientPathExplorer DEMO — D1 failure (a λ-slider over a path plot is a static figure with extra steps; the entire path is one drawing). Replace with the drawn path figure above. Also loses interview register and any boxed restatement of the just-derived trichotomy (L15).
- Exercises rebuilt; keep nothing plug-in beyond the S(z,γ) warm-up.
