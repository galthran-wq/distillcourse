# Classification metrics: ROC, precision–recall, and calibration — research brief

Lesson: `classification-metrics` (module: evaluation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/classification-metrics/lesson.mdx (28 min).
Goal: Select the right classification metric for a task and compute confusion-matrix, ROC, PR, and calibration quantities by hand.

## Sources
- ISLP §4.4.2 (the Default-data set piece: 2.75% training error but 252/333 defaulters missed at threshold 0.5; threshold-vs-error-type Fig 4.7; ROC Fig 4.8, AUC 0.95; Tables 4.4–4.7).
- Murphy §5.1.2–5.1.4 (ROC/EER; PR curves and class imbalance; F-scores; proper scoring rules, Brier, log-loss), §17.3.5 (Platt scaling and its calibrated-failure example).
- ESL — light (metrics are thin there); Angelopoulos & Bates §3.1 (the two-group marginal-vs-conditional picture is CONFORMAL's — do not preempt; one design echo only).
- Module-1 decision theory (thresholds from costs) — internal Ref.

## Key points
1. The flaw first: accuracy on the 3.3%-default data — the all-negative classifier scores 96.7%; the Default confusion matrix worked with real numbers (keeper: 75.7% of defaulters missed at 0.5).
2. The confusion matrix and its derived rates in ONE table with both naming systems (sensitivity/recall, specificity, precision/PPV, FPR); per-cell frames (denominator = which row/column) — the unbound-token discipline applied to metric names.
3. Threshold sweep → ROC; AUC = P(random positive outranks random negative) PROVED (the rank-statistic argument — logreg-lab built this scorer; now the theorem); where ROC misleads (heavy imbalance: FPR's denominator is huge).
4. PR curves: why precision's denominator makes it imbalance-sensitive in the useful direction; F_β derived from harmonic-mean logic; the ROC-barely-moves-precision-collapses demonstration (demo task).
5. Calibration: reliability diagrams; proper scoring rules (log-loss, Brier — properness DEFINED and proved for Brier in two lines); Platt scaling with Murphy's failure case (a perfectly-ranked SVM whose Platt probabilities still miss the true log-odds); NB's overconfidence from module 4 cashed.
6. Choosing: the decision-theory route (threshold from costs — module 1's asymmetric-loss derivation reused on the Default data); metric-selection table organized by QUESTION ASKED (ranking? probabilities? decisions at a fixed budget?).

## Set pieces & gems
- ISLP Default tables 4.4–4.5 — the lesson's running data.
- Murphy's Platt-scaling counterexample (§17.3.5) — separates ranking from calibration sharply.
- The spam-filter threshold-economics computation (module 4) revisited with full machinery — spiral.

## Pitfalls
- Metric-zoo sprawl: every metric must enter via a question it answers; anything not tied to a decision gets cut (L12).
- AUC proof needs the tie convention stated (the lab handled ties — reuse its convention).
- Calibration ≠ accuracy: keep the two axes explicitly orthogonal (a perfectly calibrated useless model and a perfectly ranked uncalibrated one — both exhibited).

## FIGURE PLAN
- draw: The confusion matrix as THE map — 2×2 with every derived rate drawn as an arrow bundling its cells, color per denominator row/column. Single Figure; key image.
- draw: FigureSequence (3 frames): threshold sweep — two score histograms with a moving threshold at three positions; each frame's confusion counts and the growing ROC trace beside it (the ROC built point by point).
- draw: ROC vs PR under imbalance — same classifier at 1:1 and 1:100 priors: ROC nearly identical, PR collapsing; two-panel comparison bound to the demo preset. 
- draw: AUC-as-ranking — all positive-negative pairs as a grid, concordant cells shaded; the count/total = AUC identity annotated. Single Figure (the proof's picture).
- draw: Reliability diagrams — calibrated logistic vs overconfident NB (module 4's real spam fits recreated), with Brier decomposition noted. Two-panel.
- draw: Cost curves — expected cost vs threshold for two cost ratios on the Default data; chosen thresholds marked; the module-1 formula in the margin. Single Figure.

## EXERCISE PLAN
1. Warm-up: complete a confusion matrix from (n=1000, prevalence 5%, recall 0.8, precision 0.4) and read off FPR.
2. Derivation skipped: prove AUC equals the probability a random positive outranks a random negative, ties counted half (formalize the lab's scorer).
3. Boundary probe: a classifier that predicts the positive class with probability p regardless of x — compute its ROC (the diagonal), its PR curve (horizontal at prevalence), and its calibration (perfect!) — the useless-but-calibrated extreme, and which metric catches it.
4. Claim to refute: "a model with higher AUC is the better choice for deployment at any threshold." Construct two ROC curves that cross — model A better at low FPR, B at high; name what AUC integrates away.
5. Mixed review (E3): from the spam-filter lesson's fitted logistic model, compute the operating threshold for a 10:1 false-positive cost via module 1's derivation, and the resulting (precision, recall).
6. Research-shaped: reproduce ISLP's Default numbers: fit LDA on provided Default data, report the 0.5-threshold confusion matrix and the 0.2-threshold one; compare with Tables 4.4–4.5.
7. FORWARD (E7): compute the training-set AUC and a held-out AUC for the same model; observe the gap. Solution: quantifying and correcting that optimism is the next lesson → Ref cross-validation-bootstrap.

## ARC
- Inherits: fitted classifiers and scores from module 4; module 1's decision theory (thresholds from costs).
- Contributes: the measurement vocabulary — what question each metric answers — and calibration as a property orthogonal to ranking.
- Hands off: every metric so far was computed on data the model saw or one lucky split; honest estimation of the numbers themselves → cross-validation-bootstrap.
- Spine step: "Measurement is part of the method…" (step 5).

## REVISION (vs old draft)
- Gains: the AUC theorem proved (draft asserts it); properness defined with the Brier proof; the Platt failure case; module-4 spiral (spam threshold economics, NB reliability) which did not exist before; the calibrated-but-useless boundary probe.
- Loses: interview register; metric listicle entries that answer no question (L12 audit).
- Demo: keep ThresholdMetricsExplorer; spec's falsification task ("AUC is all you need") already D1-compliant.
