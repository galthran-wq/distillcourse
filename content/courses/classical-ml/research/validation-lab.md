# Lab: a validation harness — research brief

Lesson: `validation-lab` (module: evaluation, type: lab, planned). NEW.
Goal: Build a leak-free model-evaluation harness — k-fold CV, the bootstrap, nested selection, and metric computation — and use it to expose the wrong-way-CV blunder on synthetic noise.

## ARC
- Inherits: protocols and their theory (cross-validation-bootstrap), the taxonomy (imbalance-leakage), the fold-discipline law (feature-engineering), and the reproduced blunder (wrong-way-cv).
- Contributes: the referee — a harness whose honesty is PROVEN by running the famous blunder through it both ways; the module's discipline turned into reusable code.
- Hands off: the harness pattern later labs assume (boosting-lab and gp-lab evaluate against held-out data in exactly this shape); the learner's own AUC scorer (logreg-lab) now embedded in a protocol.
- Spine step: "Measurement is part of the method…" (step 5, final item).

## LAB PLAN

Artifact: one notebook building `validate.py`-style tooling — stratified k-fold index generation, a generic `cv_score(fit_fn, X, y, folds, metric)`, bootstrap SEs, a nested-CV selector with the one-SE rule — culminating in the wrong-way vs right-way experiment run through the learner's OWN harness, reproducing ESL's 3%-vs-50% gap.

CANON GROUNDING: modelled on ISLP Lab 5.3 "Cross-Validation and the Bootstrap" (dossier: "validation-set approach, LOOCV, and k-fold CV to the Auto data …, then write/borrow a boot_SE helper to bootstrap standard errors … comparing to sm.OLS's analytic SEs") and on ESL §7.10.2's experiment (the dossier's wrong-way-CV demonstration, reproduced as the final composition). Departures: sklearn's cross_validate is replaced by hand-built fold logic (depth mandate — the folds ARE the lesson); the Auto polynomial-degree question is kept as the warm data but the capstone swaps to the noise-screening experiment because the course's application lesson just read it.

Datasets: (a) Auto (392×9, public via ISLP package; ~20 KB CSV) for the CV/bootstrap checkpoints; (b) synthetic noise (N=50, p=5000) generated in-notebook with a fixed seed for the capstone. Held-out truth for the metric checkpoint lives in private/.

Checkpoints (plan; lab-author may split/deepen):
1. `kfold-indices` (exact): deterministic stratified k-fold index generator; every index exactly once; stratification verified. Warm-up-grade.
2. `metric-fns` — folded into checkpoint naming below if needed; NOT a separate checkpoint (AUC ships from logreg-lab as a provided helper; MSE/error-rate are one-liners inside cv-score).
3. `cv-score` (exact): generic CV of a fit-callable; verified against a closed-form LOOCV shortcut case on a linear smoother. Consumes: 1.
4. `bootstrap-se` (exact): bootstrap SE of the median on Auto's mpg + measured in-bag rate ≈ 63.2%. Independent.
5. `screen-then-cv` (exact): the WRONG pipeline (full-data correlation screen top-100, then 5-fold 1-NN CV) on the seeded noise problem; asserts the bogus error < 10%. Consumes: 1, 3.
6. `nested-cv` (exact): screening inside each fold; asserts the honest error ∈ [0.4, 0.6]. Consumes: 3, 5's data.
7. `one-se-rule` (exact): λ-grid selection for ridge on Auto with per-fold SEs and the one-SE choice. Consumes: 3.
8. `leakage-gap` (metric, optional, LAST): quantified wrong-vs-right gap ≥ 0.35 averaged over 10 seeds (reference ≈ 0.45).
9. `why-the-gap` (review, optional): name the exchangeability/independence assumption the wrong protocol violates.

Known-wrong variants: fold indices reused across repetitions (seed leak); stratification off by rounding (a fold with no positives); bootstrap WITHOUT replacement; screening threshold computed once outside the repetition loop; one-SE rule applied to the max instead of the simplest side.

NOT blanked: data loading, the 1-NN and ridge fit-callables (they are module-3/1 material, shipped complete so the lab stays about PROTOCOL), plotting helpers, the AUC helper.

est_hours: 4. Progression: warm-ups (1, 4) → composing middles (3 → 5 → 6, 7) → one open metric last (8, optional) → review garnish (9). Required: 1, 3, 4, 5, 6, 7.
