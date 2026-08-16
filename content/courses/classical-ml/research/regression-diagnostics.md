# Linear regression assumptions and diagnostics — research brief

Lesson: `regression-diagnostics` (module: linear-model, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/regression-diagnostics/lesson.mdx (24 min).
Goal: Analyze violations of the linear-model assumptions — collinearity, heteroscedasticity, outliers, leverage — and select the standard remedies.

## Sources
- ISLP §3.3.3 (the six potential problems, each with its diagnostic plot; the Credit-data collinearity demonstration — swapping age for rating inflates limit's SE 12×, p 0.70, Table 3.11 + Fig 3.15's flat valley; VIF), §3.2.2 (Advertising newspaper-coefficient sign flip + ice-cream/shark-attack confounding).
- ESL Fig 3.15-context and §3.2 (Z-scores; correlated-predictor credit reshuffling — feeds prostate-study too).
- Casella & Berger §12.4 (robust regression: LAD vs LS vs M-estimate; the potoroo one-typo catastrophe — slope −0.89→−0.23 for LS, barely moves for LAD; breakdown values 0% vs 50%; Table 12.4.1 data), §11.3.
- Murphy §11.6 (robust likelihoods: Laplace/Student-t noise, Huber loss, RANSAC naming).

## Key points
1. The audit maps each assumption to the exact step of the Gauss–Markov/inference story it supports (structure the lesson AS the proof's checklist, not a listicle): linearity → the model, exogeneity → unbiasedness, homoscedasticity+independence → the covariance formula, full rank → existence, normality → the t/F machinery only.
2. Collinearity: the flat RSS valley picture; Var(β̂_j) ∝ 1/(1−R_j²) derived; VIF; the Credit 12× demonstration with real numbers; remedies (drop/combine/ridge — the ridge seam explicit).
3. Residual diagnostics: residual-vs-fitted for nonlinearity; scale-location for heteroscedasticity (the insurance-claims funnel called back); remedies — transformations, weighted LS (one derivation paragraph: WLS as MLE under known unequal variances), robust (sandwich) SEs named.
4. Leverage and influence: h_ii defined from the hat matrix (ols's exercise cashed); outlier ≠ influential; the potoroo typo worked with real numbers; LAD/Huber as the robust family (Murphy's likelihood reading: heavy-tailed noise models), breakdown value 0% vs 50%.
5. Interpretation traps: confounding (newspaper/shark-attack), R² vs adjusted R², "significant ≠ causal ≠ important" — one disciplined section.

## Set pieces & gems
- Credit-data collinearity numbers (ISLP Table 3.11): keeper numbers 12× SE inflation.
- The potoroo catastrophe (C&B Example 12.4.2 + Fig 12.4.1): one mistyped 18→10 swings LS slope 4×; recreate the three-line figure with the real table data.
- The newspaper coefficient dying (2.2σ → p=0.86) once TV/radio enter — the confounding set piece.
- Anscombe quartet (Murphy Fig 2.5) — identical R², four stories; use as the diagnostics opener.

## Pitfalls
- Not a catalog: every diagnostic must name the assumption it tests and the Gauss–Markov consequence of its failure (L10e).
- Don't teach causal inference (excluded); confounding appears only as an interpretation warning.
- Robust regression: derivations stay at the likelihood-reading level; M-estimation theory belongs to no lesson.

## FIGURE PLAN
- draw: The assumption→consequence map — Gauss–Markov's proof as a column of steps, each with its assumption plugged in and the diagnostic that tests it on the right. Single Figure; the lesson's spine.
- draw: Anscombe-style quartet (our own four datasets, same fit/R², different pathologies: fine / nonlinear / one outlier / one leverage point). Single Figure, opener.
- draw: FigureSequence (3 frames): the flat valley — RSS contours for (a) orthogonal predictors (bowl), (b) correlated (valley), (c) near-duplicate (canyon), with the β̂ uncertainty ellipse widening. Inspired by ISLP Fig 3.15.
- draw: Residual gallery — 2×2 panel: healthy / funnel (heteroscedastic) / curved (nonlinear) / one high-leverage point, each with its verdict caption. Single Figure.
- draw: The potoroo three lines — LS vs LAD vs Huber fits with and without the typo point (two panels), real data values. Recreation of C&B Fig 12.4.1.
- draw: Leverage vs outlier 2×2 — high/low residual × high/low leverage with influence marked only in one cell. Single small Figure.

## EXERCISE PLAN
1. Warm-up: compute VIF for a predictor with R_j² = 0.9 and 0.99; state the SE inflation factor each implies.
2. Boundary probe: h_ii = 1 for some point — show the fit passes through it exactly and its residual is forced to 0; the diagnostic that therefore CANNOT flag it, and what to use instead (deleted residuals).
3. Claim to refute: "heteroscedasticity biases the OLS coefficients." Refute: unbiasedness never used homoscedasticity (point at the audit map); what actually breaks (the covariance formula, hence SEs and efficiency).
4. Derivation skipped: derive weighted least squares as the MLE under N(0, σ_i²) noise with known weights; show it is OLS on rescaled data.
5. Mixed review (E3): the insurance-claims funnel — diagnose from the residual plot, then say why the module-2 answer (Poisson GLM) beats variance-stabilizing patches for counts.
6. Research-shaped: reproduce the Credit collinearity flip on provided data: regress balance on {age, limit} then {rating, limit}; report the limit SE ratio and compare with ISLP's ≈12×.
7. FORWARD (E7): for the potoroo data, compute the leave-one-out fitted values via the shortcut ŷ_(−i) trick using h_ii. Solution: that identity is the LOOCV engine of module 5 → Ref cross-validation-bootstrap.

## ARC
- Inherits: OLS's guarantees and their exact hypotheses; ridge as one remedy already in hand.
- Contributes: the audit discipline — every guarantee tied to a testable assumption with a named remedy.
- Hands off: flexibility done safely (splines-gams) once the linear form itself is the failing assumption; the LOOCV identity to module 5.
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3).

## REVISION (vs old draft)
- Gains: the assumption→proof-step map as the organizing structure (old draft is a checklist); WLS derivation; the robust-regression section with the potoroo set piece and likelihood reading (new); leverage developed from the hat matrix (needs ols's revised content); the LOOCV forward exercise.
- Loses: interview framing; "what interviewers probe" phrasing; the R²/p-value section tightened to the traps that matter (L12).
- No demo (unchanged); figures above replace the old draft's sparser plan.
