# Lab: logistic regression from scratch — research brief

Lesson: `logreg-lab` (module: boundaries, type: lab, planned). KEPT SLUG — the old course's lab exists in full (solution.py, challenges.yaml, data) at content/courses/classical-ml-interview/lessons/logreg-lab/ and ports mechanically; the human judged it weak, so this brief specifies the strengthened version.
Goal: Implement logistic regression end to end in numpy — stable log-loss, hand-derived gradient, gradient descent, L2, Newton/IRLS, and a rank-based ROC-AUC — and classify real tumors against held-out labels.

## ARC
- Inherits: the loss/gradient/IRLS derivations (logistic-regression), GD mechanics and step-size discipline (gradient-descent), the separability pathology (logistic-regression §6).
- Contributes: module 4's central classifier as verified code, plus the learner's first scorer (AUC) — the bridge object module 5 dissects.
- Hands off: a working classifier + scorer pair that validation-lab (module 5) wraps in honest protocols; the AUC implementation reused there.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4, final item).

## LAB PLAN

Artifact: one notebook building a numpy logistic-regression classifier — stable loss, gradient, GD trainer, L2, Newton/IRLS — plus a rank-based ROC-AUC scorer, applied to the Wisconsin breast-cancer diagnostic data against a server-scored held-out AUC threshold.

CANON GROUNDING: modelled on the CS229 problem-set tradition the lecture notes repeatedly defer to ("see problem set 1" — PS1's classic trio: logistic regression trained by Newton's method, GDA comparison, regression practice) and on ISLP Ch. 4's applied-exercise pipeline (dossier: "Ch.4 Ex.14: create binary target → explore → split → fit LDA/QDA/logistic/NB/KNN → compare test error"). Departures: the sklearn calls ISLP uses are replaced by hand-built numpy (depth mandate); GDA/KNN comparison is dropped to keep one artifact (their comparison lives in the lda-gda exercise plan); the AUC scorer is added because module 5 needs it built once.

Strengthening vs the old (weak) lab, per the human's verdict:
1. Add a `separable-divergence` checkpoint — train on a deliberately separable 30-point subset, assert ‖w‖ grows without bound over iterations, then assert L2 caps it: the module's central pathology EXPERIENCED, not read (old lab never touches it).
2. Make the gradient checkpoint verify against finite differences (the referee pattern), not just fixed values — teaches the debugging move that transfers.
3. Keep Newton/IRLS but require the step-count comparison (≤10 Newton steps vs ~10³ GD steps to the same loss) as the checkpoint's asserted output.
4. Tighten the metric task: beat AUC on held-out tumors with any of the learner's own trained variants (regularized or not), threshold calibrated so plain GD + standardization clears it but unstandardized training does not — making the standardization lesson bite.

Dataset: Wisconsin breast-cancer diagnostic (569×30, public domain via UCI/sklearn; already shipped in the old lab's data/ — port as-is). Held-out labels stay in private/.

Checkpoints (plan; ids stable with the old lab where content matches, so ported verification carries over):
1. `sigmoid` (exact): elementwise sigmoid. Warm-up.
2. `log-loss` (exact): stable via logaddexp. Warm-up. Consumes: 1.
3. `grad` (exact): ∇ in (w,b), finite-difference-refereed. Consumes: 2.
4. `fit-gd` (exact): batch GD trainer with loss history (monotone under the given η). Consumes: 3.
5. `l2` (exact): penalized loss+gradient, intercept unpenalized. Consumes: 3.
6. `separable-divergence` (exact, NEW): ‖w‖ growth demo + L2 cap, asserted numerically. Consumes: 4, 5.
7. `newton` (exact, optional): Hessian, IRLS trainer, step-count comparison. Consumes: 3.
8. `auc` (exact): rank-statistic AUC with tie handling. Independent function (consumed by 9 and by module-5 lab).
9. `beat-auc` (metric, optional, LAST): beat the held-out AUC threshold (calibrate ≈0.99 achievable with standardized GD; reference clears by ≥0.02 per lab norms).
10. `why-not-mse` (review, optional): why cross-entropy, not squared error, in the learner's own words.

Known-wrong variants: log(sigmoid) computed naively (overflow on saturated logits); gradient sign flipped; (y−p) vs (p−y) confusion; AUC without tie averaging; penalizing the intercept; forgetting standardization (metric task fails — deliberate).

NOT blanked: data loading, train/calibration split, plotting helpers (loss curves, ROC), the finite-difference referee utility.

est_hours: 4.5. Progression: 2 warm-ups (1–2) → composing middles (3→4/5→6, 7) → one open metric last (9, optional) → review garnish (10). Required: 1–6, 8.
