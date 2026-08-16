# Feature engineering and selection — research brief

Lesson: `feature-engineering` (module: evaluation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/feature-engineering/lesson.mdx (26 min).
Goal: Select encoding, scaling, and feature-selection strategies for a modeling task and identify where each can leak information.

## Sources
- SSBD Ch. 25 (the theory-grade material: the Pearson-filter blind spot — x₁ useless marginally, essential jointly, constructed example §25.1.1; forward greedy/OMP; L1 as embedded selection; the feature-scale ridge pathology §25.2 — w*=[0,10000] invisible to ridge without ~10⁸ samples; AdaBoost as forward greedy selection Remark 25.3).
- Murphy §1.5.3–1.5.4 (one-hot, feature crosses, missing-data taxonomy MCAR/MAR/NMAR — keep taxonomy to one table).
- ESL §18.1 ("less fitting is better" p≫n framing — context), Ch. 9.6 (missing data, surrogate splits pointer to trees).
- ISLP §6.1 (subset selection — one paragraph; the course teaches selection via filters/embedded).

## Key points
1. Frame: features are where domain knowledge enters the bias budget; every transform is a modeling claim (echo zipcode-digits' invariance lesson — the course's through-theme).
2. Encodings: one-hot (and its collinearity with intercept — drop-one), ordinal (when order is real), target encoding with its leakage trap DERIVED (the encoded column contains y; out-of-fold encoding as the fix — connect to imbalance-leakage's taxonomy row).
3. Scaling: who needs it and exactly why — distance methods (knn), penalties (ridge/lasso — the SSBD 10⁸-sample pathology worked with its numbers), gradient conditioning (gradient-descent's bowl); who doesn't (trees, and why — split invariance under monotone transforms).
4. Selection three ways: filters (cheap, blind to interactions — the SSBD counterexample WORKED: y = x₁+2x₂ with x₂ = −x₁/2 + z/2 makes corr(x₁,y)=0); wrappers (greedy forward; cost); embedded (lasso from module 3 — the selection story completed). Selection is fitting ⇒ belongs inside the fold (the module's law applied).
5. Missing data: deletion/imputation/indicator; imputation is fitting too (fold discipline); trees' native handling (surrogate/default directions — forward Ref decision-trees/xgboost).
6. Manual features that still win: interactions, ratios, logs, binning — with the honest caveat that modules 6–7 automate parts of this; the tabular-showdown seam planted (uninformative features hurt some models more than others).

## Set pieces & gems
- SSBD's correlation-filter counterexample — the lesson's analytic core; numbers chosen so the reader can verify corr = 0 by hand.
- SSBD's ridge-scale pathology (w* = [0, 10000]) — scaling as a statistical, not cosmetic, decision.
- AdaBoost-as-greedy-selection (Remark 25.3) — one forward sentence to module 7.

## Pitfalls
- This lesson must not become a recipes listicle: every practice ties to a mechanism already derived (penalty units, distance geometry, leakage taxonomy).
- Target encoding detail: the K-fold scheme in full, exotic variants (ordered/leave-one-out) one sentence.
- No deep-learning feature-learning digression.

## FIGURE PLAN
- draw: The pipeline with fit-boundaries — raw → encode → impute → scale → select → model, with a bold "fitted on train only" bracket spanning every stage after the split line. Single Figure; the lesson's law as a picture.
- draw: Target-encoding leak — FigureSequence (3 frames): naive encoding (y flows into the feature, arrow crossing the split), the resulting too-good CV score, the out-of-fold fix rerouting the arrow.
- draw: The scale pathology — ridge coefficient paths for the SSBD two-feature example at raw vs standardized scales; the invisible-then-visible w₂. Computed, two panels.
- draw: The filter blind spot — scatter of (x₁, y) showing zero marginal correlation beside the joint fit's perfect plane (3-D inset or partial-residual view); the moral labeled. Computed from SSBD's construction.
- draw: Encoding decision table as a figure — categorical cardinality × model family grid with the recommended encoding per cell and its trap footnoted. Single Figure.

## EXERCISE PLAN
1. Warm-up: one-hot a 4-level feature with an intercept; exhibit the exact collinearity and the drop-one fix.
2. Derivation skipped: verify SSBD's construction — compute corr(x₁, y) = 0 analytically for y=x₁+2x₂, x₂=−x₁/2+z/2 with z⊥x₁; then show the joint regression recovers (1,2).
3. Boundary probe: target-encode a category that appears once — the encoded value IS that row's y; show the CV consequence and why rare-category smoothing (prior blending) is the degenerate-case fix.
4. Claim to refute: "trees need standardized features too, to compare splits fairly." Refute via split invariance under monotone transforms (prove for one split); name what trees DO need (nothing, for scaling — but encodings still matter).
5. Mixed review (E3): the lasso as embedded selection on the prostate data — which module-3 result already did feature selection, and what the fold discipline adds when reporting its error.
6. Research-shaped: on a provided 500×50 dataset with 5 real features, compare filter-k (correlation top-k) vs lasso selection inside honest CV: report selected-set stability across folds (Jaccard) and test error — quantify the filter's interaction blindness.
7. FORWARD (E7): standardize inside vs outside the folds on a small pipeline and measure the CV-score gap. Solution: the general form of this experiment — selection inside vs outside — is the next lesson's reproduction → Ref wrong-way-cv.

## ARC
- Inherits: penalties (ridge/lasso), distance geometry (knn), protocols and leakage taxonomy (this module).
- Contributes: features as bias-budget decisions with mechanisms, and the fold discipline extended to every preprocessing stage.
- Hands off: the module's synthesis blunder — selection outside the fold — reproduced at full scale → wrong-way-cv.
- Spine step: "Measurement is part of the method…" (step 5).

## REVISION (vs old draft)
- Gains: the two SSBD analytic set pieces (filter blind spot, scale pathology) with derivations — the draft's claims now get proofs; the pipeline-law figure; fold discipline as the organizing principle (draft organizes by feature type).
- Loses: interview register; encoding zoo trimmed to the decision-table figure (L12).
- Demo: none (unchanged).
