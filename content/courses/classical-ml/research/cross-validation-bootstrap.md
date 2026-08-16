# Cross-validation and the bootstrap — research brief

Lesson: `cross-validation-bootstrap` (module: evaluation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/cross-validation-bootstrap/lesson.mdx (26 min).
Goal: Design validation protocols — hold-out, k-fold, LOOCV, nested CV, bootstrap — and justify the choice of k and the one-standard-error rule.

## Sources
- ESL §7.4–7.6 (optimism = (2/N)ΣCov(ŷᵢ,yᵢ) DERIVED; Cp/AIC as corrected training error; effective df tying to splines-gams), §7.10 (K-fold, learning-curve argument for k; GCV), §7.11 (bootstrap error estimates: naive downward bias, leave-one-out bootstrap, .632 and the 1-NN breakdown to .632+), §7.12 (CV estimates EXPECTED not conditional error — the honest reading).
- ISLP Ch. 5 (validation-set variability Fig 5.2; LOOCV leverage shortcut eq 5.2 — regression-diagnostics' exercise cashed; k-fold bias-variance §5.1.4; bootstrap §5.2 with the two-asset α story).
- Efron & Tibshirani 1993 — NOT READABLE (flagged); bootstrap depth grounded in ESL/ISLP instead.
- Murphy §4.7.3 (bootstrap as approximate sampling distribution — cross-check).

## Key points
1. The flaw first: training error's optimism — derive E[Err_in] − E[err] = (2/N)ΣCov(ŷᵢ,yᵢ); for linear fits = 2dσ²/N. Optimism is a THEOREM with a formula, not a slogan; Cp/AIC read as "training error + rent for df" (splines-gams' df scale reused).
2. Hold-out and its variance (ISLP Fig 5.2's ten-splits spread — recreate); k-fold as the variance fix; LOOCV: definition, the exact leverage shortcut for linear smoothers (derived — the hat matrix pays off again), and its high variance (correlated fits).
3. Choosing k via the learning-curve argument (ESL §7.10.1): at steep parts of the curve, small training fractions bias the estimate up; k=5–10 as the standard compromise — argued, not decreed.
4. The bootstrap: resample-with-replacement; the 63.2% = 1−1/e in-bag rate DERIVED; SEs for any statistic (the two-asset α example worked); for prediction error: naive bootstrap's downward bias, leave-one-out bootstrap, .632 rule and its 1-NN breakdown (err=0, truth 0.5 → .632×0.5 wrong; .632+ named).
5. Selection bias and nested CV: choosing λ by CV then reporting that CV score is optimistic; outer/inner loops; one-SE rule stated formally (prostate-study's black box opened).
6. What CV estimates: expected error over training sets, NOT this model's conditional error (ESL §7.12) — one honest section; grouped/time-series folds (random folds invalid when rows share provenance — the leakage bridge).

## Set pieces & gems
- ESL's optimism derivation — rarely taught, the lesson's analytic spine.
- The .632 breakdown case (Breiman via ESL §7.11) — a boundary probe built into the canon.
- ISLP's Auto polynomial-degree running example (validation → LOOCV → k-fold answering the same cubic-term question three ways).

## Pitfalls
- The LOOCV shortcut applies to LINEAR smoothers only — state the scope precisely.
- Do not present the bootstrap as magic: what it approximates (sampling from F̂) and when it fails (extremes, dependence) in one honest paragraph.
- Keep AIC/BIC to the optimism-rent reading; model-selection-philosophy is out of scope.

## FIGURE PLAN
- draw: Optimism anatomized — the identity with underbraces; below, one dataset fitted by df=2 and df=20 smoothers with train error, true error, and the 2dσ²/N wedge drawn as a literal gap. Single Figure.
- draw: The protocol gallery — hold-out / 5-fold / LOOCV as row-of-boxes diagrams (colored train/validation cells), each with its bias and variance verdict. Single Figure (the format contract for all later protocol discussion).
- draw: FigureSequence (3 frames): ten random validation splits → ten different error-vs-degree curves (spread visible) → the 10-fold CV curve with ±SE band stabilizing the answer. ISLP Figs 5.2/5.4 recreated as a build.
- draw: The 63.2% derivation — one row of n balls, P(miss all n draws) = (1−1/n)ⁿ → e⁻¹ plotted vs n; in-bag/out-of-bag split labeled (OOB foreshadows module 7). Single Figure.
- draw: Nested CV — outer folds each containing an inner λ-selection loop; the one number that may be reported circled. Single schematic Figure.
- draw: One-SE rule — CV curve with SE bars, minimum marked, the leftmost model within one SE chosen. Recreation of the prostate-study figure's logic, now explained.

## EXERCISE PLAN
1. Warm-up: compute the .632 rate for n = 5, 20, 100 exactly and compare with 1−1/e.
2. Derivation skipped: derive the LOOCV shortcut CV = (1/n)Σ[(yᵢ−ŷᵢ)/(1−hᵢᵢ)]² for linear smoothers (the lesson sketches; the reader completes via the rank-one update or the deleted-residual identity).
3. Boundary probe: LOOCV for 1-NN — the left-out point's nearest neighbor; show plain training error is 0 while LOOCV is honest; then run .632 on the label-independent case and reproduce the 0.316-vs-0.5 breakdown.
4. Claim to refute: "10-fold CV error is an unbiased estimate of MY fitted model's error." Two failures: it estimates error at training size 0.9n (bias), and expected — not conditional — error (§7.12); name both.
5. Mixed review (E3): for ridge on the prostate data, compute Cp with df(λ) = Σd_j²/(d_j²+λ) and compare its chosen λ with 10-fold CV's (splines-gams + this lesson composed).
6. Research-shaped: reproduce ISLP's Auto experiment: LOOCV and 10-fold curves for polynomial degrees 1–10; report whether the cubic-term verdict agrees across protocols.
7. FORWARD (E7): screen the top-10 of 1,000 noise features by correlation on ALL data, then 5-fold-CV a 1-NN on the survivors — record the (absurd) CV error. Solution: this is the wrong-way-CV blunder, dissected two lessons ahead → Ref wrong-way-cv.

## ARC
- Inherits: metrics to estimate (classification-metrics); df and the hat matrix (module 3); the optimism intuition from module 1's train/test gap.
- Contributes: the estimation theory OF error estimates — optimism, protocols, resampling, and their own bias/variance.
- Hands off: the ways protocols fail in the wild (imbalance handling, leakage) → imbalance-leakage; the machinery prostate-study borrowed is now paid for.
- Spine step: "Measurement is part of the method…" (step 5).

## REVISION (vs old draft)
- Gains: the optimism derivation as the opening theorem (absent in draft); the LOOCV leverage shortcut derived (ties to revised regression-diagnostics); the .632 breakdown boundary probe; the §7.12 expected-vs-conditional honesty section; the Cp mixed exercise.
- Loses: interview register; the leakage material moves to imbalance-leakage/wrong-way-cv (keep only the forward exercise here — the old draft's "CV done wrong" key idea is now a separate lesson).
- Demo: none (unchanged).
