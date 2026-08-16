# The wrong way to cross-validate — research brief

Lesson: `wrong-way-cv` (module: evaluation, core, planned). NEW — module 5's APPLICATION lesson (L16): a published result reproduced as a computational study.
Goal: Reproduce ESL's wrong-way cross-validation experiment and audit a modeling pipeline for the leakage class it exemplifies.

## Sources
- ESL §7.10.2 (THE artifact: N=50, p=5000 iid noise predictors, true error 50%; screen the 100 most label-correlated predictors on ALL data, then 5-fold-CV a 1-NN on them → average CV error 3%; the authors: "we have seen this blunder committed many times in published papers in top rank journals"; Fig 7.10 — correlation histograms under wrong vs right protocols).
- ESL §7.10.3 ("does CV really work?" — the companion honesty discussion).
- ISLP §6.4 (high-dimensional p>n intuition: with enough features something always correlates — supporting arithmetic).
- imbalance-leakage's taxonomy (internal): this is train-test contamination via selection.

## Key points (APPLICATION spec)
- The artifact: ESL's published demonstration, reproduced end to end with our own code and seeds — a "paper's central result reproduced" application.
- Module results used: k-fold CV mechanics and what CV estimates (cross-validation-bootstrap); the leakage taxonomy locating the blunder (imbalance-leakage); selection-is-fitting (feature-engineering); the metric being corrupted (classification-metrics' error rate).
- Where the idealization departs: real pipelines rarely screen on ALL data this nakedly — the same leak hides inside "we normalized/imputed/tuned on the full dataset," inside deduplication failures, and inside benchmark reuse; the audit checklist maps the pure case onto the disguised ones.
1. The setup stated as a bet: pure noise, so ANY honest protocol must report ≈50%. The wrong pipeline reported 3%.
2. The reproduction: our run's numbers (expect ≈2–5% wrong-way, ≈50% right-way), with seeds and fold counts stated — reproduction discipline modeled.
3. The mechanism dissected: after screening on all data, the kept features are correlated with the labels OF THE VALIDATION FOLDS TOO; the fold is no longer exchangeable with the future. The correlation-histogram figure (screened features' label-correlations computed on held-out folds: wrong way ≈ 0.28, right way ≈ 0) — ESL Fig 7.10 recreated.
4. Why the selection-inside-the-fold fix is exactly nested CV (cross-validation-bootstrap's machinery); the general rule: every data-dependent choice is part of the model.
5. The audit: five disguised versions of the same leak found in real workflows (full-data scaling; full-data imputation; tuning on the test set across papers; screening in bioinformatics — the source's own context; benchmark overfitting à la KDDCUP99) — each mapped to the pure case.
6. Scale of the wound: one dry paragraph on the published record (the ESL quote; microarray-era retractions context, stated soberly without a literature review).

## Set pieces & gems
- The 3%-vs-50% headline pair — the course's most memorable measurement number.
- ESL Fig 7.10's histogram pair — the mechanism made visible.
- The authors' "top rank journals" sentence — quote it once, verbatim, cited.

## Pitfalls
- Keep the tone forensic, not moralizing; the lesson's power is the reproduction, not the scolding.
- The lesson is short-ish (28 min) and single-purpose — resist growing a general leakage chapter (previous lesson owns the taxonomy).
- State clearly that screening per se is fine — INSIDE the fold; the position of the step, not the step, is the bug.

## FIGURE PLAN
- draw: The two pipelines side by side — screen→split→CV (wrong) vs split→screen-within-fold→CV (right), the leak arrow crossing the split only on the left; reported numbers stamped on each (3% / 50%). Key image; the lesson in one figure.
- draw: FigureSequence (3 frames): the mechanism — (1) 5,000 noise correlations as a histogram (±0.2 spread), (2) the top-100 tail selected (shaded), (3) those 100 features' correlations RECOMPUTED on held-out folds: wrong way still ≈0.28 (they were selected using those folds), right way centered on 0. Recreation of ESL Fig 7.10 as a build.
- draw: Our reproduction's result table as a figure — wrong-way CV error, right-way CV error, truth, across 10 seeds as dot strips with means. Computed.
- draw: The disguised-leaks map — five real-workflow patterns each drawn as a mini-pipeline with its leak arrow highlighted, labeled with the pure case's name. Single Figure (the audit checklist, visual form).

## EXERCISE PLAN
1. Warm-up: with p=5,000 independent noise features and n=50, compute the expected maximum |correlation| ballpark (≈2.9/√n via extreme-value heuristics — guided) and hence why the screened features look strong.
2. Boundary probe: rerun the wrong-way pipeline with p=50 features instead of 5,000 — measure how the bogus gap shrinks; state the scaling moral (the leak's size grows with the selection pool).
3. Claim to refute: "we avoided the blunder because we used 10-fold CV, not 5-fold." Refute: the fold count is irrelevant to a pre-split selection; identify the exchangeability property that is violated regardless of k.
4. Derivation skipped: show formally that screening on all data makes fold-error estimates biased down, by writing the selection event into the conditional distribution of validation labels (sketch level, guided).
5. Research-shaped (the lesson's core): reproduce the experiment yourself at N=50, p=5000, top-100, 5 folds, 20 repetitions; report both protocols' means ± SE and compare with ESL's 3%/50%.
6. FORWARD (E7): repeat the honest protocol but let the screening size k itself be tuned by the SAME folds that report the final number — measure the residual optimism. Solution: the fully nested harness that removes it is what the lab builds next → Ref validation-lab.

## ARC
- Inherits: the entire module — protocols, taxonomy, fold discipline, metrics.
- Contributes: the module cashed out as a reproduced published result and a transferable audit method.
- Hands off: the lab builds the harness that makes the right way the easy way; module 9 will later explain WHY uniform guarantees need the hypothesis fixed before the data — the same principle in theorem form (plant one sentence).
- Spine step: "Measurement is part of the method…" (step 5, closing move before the lab).
