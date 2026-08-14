# Lab: penalized regression from scratch — research brief

Lesson: `regularization-lab` (module: linear-model, type: lab, planned). NEW.
Goal: Build OLS, ridge, and lasso solvers in numpy — normal equations, SVD shrinkage, coordinate-descent soft thresholding — and reproduce the prostate study's coefficient table against held-out error.

## ARC
- Inherits: every derivation of module 3 — normal equations (ols), SVD shrinkage and soft thresholding (ridge-lasso), standardization discipline (regression-diagnostics), the published numbers to hit (prostate-study).
- Contributes: the derivations as verified code; the learner's first full estimator suite and the experience that the closed forms actually reproduce a published table.
- Hands off: a working penalized-regression toolkit that the validation lab (module 5) will wrap in honest evaluation, and that later labs reuse as a baseline.
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3, final item).

## LAB PLAN

Artifact: one notebook building a `linreg.py`-style toolkit — `fit_ols`, `fit_ridge` (SVD path), `fit_lasso` (cyclic coordinate descent over a λ grid with warm starts) — culminating in a reproduction of the ESL prostate coefficient table (Table 3.3's OLS/ridge/lasso columns) and a held-out test-error comparison.

CANON GROUNDING: modelled on ISLP Lab 6.5 "Linear Models and Regularization Methods" (dossier: "forward stepwise selection, Cp/BIC/CV-based model-size choice, ridge regression and the lasso …, all worked end-to-end on the Hitters salary data set"), transplanted from Hitters to ESL's prostate data so the acceptance test is the published Table 3.3 the application lesson just read; the coordinate-descent internals ISLP delegates to sklearn are hand-built here (the course's depth mandate), following ESL §3.8.6's pathwise coordinate optimization description. Departure from the canon assignment: no stepwise-selection section (subset selection is not a course lesson; one optional exercise instead), and CV appears only as a fixed provided fold assignment (module 5 owns the machinery).

Dataset: the prostate dataset (97×9, public domain via the ESL site, ~10 KB CSV) shipped in `data/` with the book's own train/test indicator column. License: freely distributed with ESL's materials; credit Stamey et al. 1989.

Checkpoints (plan; lab-author may split/deepen):
1. `center-standardize` (exact): standardize predictors, center y; return means/scales. Verifies the convention every later number depends on. Consumes: raw data.
2. `ols-solve` (exact): coefficients via `lstsq`/QR; checked against normal-equations solution on a well-conditioned subset. Consumes: 1.
3. `ridge-svd` (exact): ridge via SVD with shrinkage factors d_j²/(d_j²+λ); checked against the (XᵀX+λI)⁻¹ form. Consumes: 1.
4. `soft-threshold` (exact): S(z,γ) scalar/vector. Warm-up-grade, one function.
5. `lasso-cd` (exact): cyclic coordinate descent over a decreasing λ grid with warm starts; convergence by max coefficient change. Consumes: 1, 4. Verified at three grid λs against reference values.
6. `prostate-table` (exact): assemble the OLS/ridge(df≈5)/lasso(3-variable) coefficient table on the book's training split. Consumes: 2, 3, 5. The composition checkpoint — the published-table reproduction.
7. `why-exact-zeros` (review, optional): why CD produces exact zeros and ridge cannot (subgradient interval at 0).
8. `beat-test-error` (metric, optional, LAST): tune λ on the provided folds and beat OLS's held-out prostate test MSE (threshold ≈ the book's 0.521 OLS test error; reference lasso ≈ 0.48 — calibrate at build time; rmse-style negated threshold).

Known-wrong variants worth declaring: forgetting to standardize before penalizing (produces a recognizably wrong coefficient table); penalizing the intercept; soft-threshold sign error S(z,γ)=sign(z)(|z|+γ); coordinate descent using stale (not updated-in-place) residuals; ridge shrinkage applied to d_j instead of d_j².

NOT blanked (ships complete): data loading, the train/test split indicator, plotting helpers for coefficient paths, the fixed CV fold assignment for checkpoint 8.

est_hours: 4. Progression: two warm-up-ish exact single-function checkpoints (1, 4), middle checkpoints composing (2/3/5 feed 6), exactly one open metric task last (8, optional), one optional review (7). Required set: 1–6.
