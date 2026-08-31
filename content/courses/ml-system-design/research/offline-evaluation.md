# Offline evaluation beyond aggregate accuracy — research brief

Lesson: `offline-evaluation` (module: training-pipelines, core, planned).
Goal: Evaluate a model the way production requires — against baselines, on slices, calibrated, and under behavioral and invariance tests.

## Sources
- DMLS Ch.6 (pp.179-188): baselines recalled; evaluation methods — perturbation tests, invariance tests (the Berkeley mortgage study: 1.3M creditworthy Black/Latino applicants rejected; removing race flipped outcomes), directional expectation tests, calibration (Platt; Nate Silver "the single most important test"), confidence measurement, slice-based evaluation + Simpson's paradox (Tables 6-4/6-5 — kidney-stone 1986 and Berkeley 1973 both real).
- Khang Pham Ch.2 (pp.121-126): calibration = sum(predictions)/sum(labels); causes of miscalibration; isotonic + Platt; Facebook's downsampling correction q = p/(p+(1-p)/w); calibration plots — logreg (good) vs SVM (AUC 0.97 but S-shaped miscalibration) with captures.
- TFX paper §5: the two-part goodness definition — safe-to-serve vs prediction quality; machine-facing validation (threshold AND baseline comparison; canary; auto-block); slicing (country=US) because aggregates hide slice regressions.
- MLPS Ch.8 (pp.111-131): TFMA's model-vs-model per-version view; Fairness Indicators metric taxonomy (positive rate → demographic parity; TPR/FNR → equal opportunity) — one Remark, privacy extra develops.
- Rules of ML #24 (measure the delta between models — symmetric difference of results), #26 (look for patterns in measured errors), #27 (quantify undesirable behavior).
- Made With ML evaluation lesson: behavioral testing trio (invariance/directional/minimum-functionality — CheckList) with the concrete three examples; confident-learning label-error detection (cleanlab) — one Remark.

## Key points
1. Reframe evaluation as answering production's questions: better than what (baseline — recalled from M1), for whom (slices), meaning what (calibration), under what perturbations (behavioral), and may it ship (gates). One aggregate number answers none of these.
2. Slice-based evaluation + Simpson's paradox worked in full: the numeric table where model A beats B on both subgroups and loses overall (93/87 and 73/69 vs 78/83); both real provenances named. How slices are found: heuristics, error clustering, slice finders (one sentence).
3. Calibration as a production requirement, not a nicety: expected-value consumers (ad auctions — forward plant to ranking-and-ctr; thresholded decisions) need probabilities to mean frequencies. The definition sum(pred)/sum(label); reliability curves; the logreg-vs-SVM measured contrast (better AUC, worse calibration — the two captures); repairs (Platt/isotonic); the exact downsampling correction q = p/(p+(1-p)/w) derived (one-line Bayes computation).
4. Behavioral tests as unit tests for models: perturbation (robustness to noise), invariance (protected attribute swap must not change output — the mortgage study as stakes), directional (more rain → not-lower ETA); minimum-functionality cases. CheckList lineage in References.
5. Delta evaluation (Rule #24): two models with equal aggregate scores can disagree on 10% of traffic — measure the symmetric difference, inspect the flips; cheap and mandatory before any swap.
6. The validation gate assembled (TFX §5): safe-to-serve checks (loads, latency budget, resource ceiling) + quality thresholds + beats-current-baseline (with slices) → blessing; auto-block otherwise. This is the machine-facing distillation of the lesson, and the artifact inside-tfx reads in situ.

## Set pieces & gems
- Simpson's paradox double-real example (kidney stones + Berkeley admissions) — the flagship table.
- Berkeley mortgage invariance result (1.3M applicants) — stakes for invariance tests.
- The downsampling-correction formula — small derivation the reader can own.
- Calibration plot pair — sourced images (machinelearn-khang-calibration-logreg / -svm): measured, paired, the AUC-vs-calibration decoupling as data.
- Nate Silver calibration line — one inline attribution (named-thesis case under L8a).

## Pitfalls
- Do not re-teach metrics (ROC/PR known); the lesson is about evaluation DESIGN.
- Fairness gets the invariance test + one Remark pointing to the privacy extra — not a full treatment here.
- cleanlab/label-error detection: Remark only.
- Gates must not duplicate deployment lesson: offline gate here; online experiments (A/B) are module 5's — the seam says so explicitly.

## FIGURE PLAN
- draw: The five questions panel: better-than-what / for-whom / meaning-what / under-what / may-it-ship — each mapped to its instrument (this lesson's outline as one figure). Original.
- draw: Simpson's paradox as a mosaic plot: two subgroups' accuracies with group sizes as widths — the visual reason the aggregate reverses. Inspired by DMLS Tables 6-4/6-5, recomputed.
- source: machinelearn-khang-calibration-logreg — measured logreg reliability curve + histogram (save as `calibration-logreg`); reader must see near-diagonal wiggle; placed left of a two-up pair.
- source: machinelearn-khang-calibration-svm — the SVM contrast (save as `calibration-svm`); reader must see the S-shape despite higher AUC; right of the pair. (Counts as this lesson's two sourced images; both small floats in the calibration section.)
- draw: The downsampling correction: predicted p on downsampled data → corrected q, the formula dissected with a worked number (w=10, p=0.5 → q=0.09). Original.
- draw: FigureSequence (3 frames): delta evaluation — frame 1 two models, equal accuracy 91%; frame 2 the prediction-overlap Venn (9% flips); frame 3 flip inspection table by slice. Inspired by Rule #24.
- draw: The validation gate as a gate: candidate model → {safe-to-serve checks, quality vs threshold, delta vs champion on slices} → blessed / blocked. Inspired by TFX §5.

## EXERCISE PLAN
1. Warm-up: compute overall accuracy from two slices' accuracies and sizes for both models in a provided table; verify the Simpson reversal and state which number a launch review should look at.
2. Boundary probe: a perfectly calibrated model with AUC 0.5 — construct it (predict the base rate always), and state which production consumers it satisfies (none that rank) — calibration and discrimination are orthogonal axes.
3. Derivation the lesson skipped: derive q = p/(p+(1-p)/w) from Bayes' rule for negative downsampling by factor w; verify at w=1 and w→∞.
4. Claim to refute: "the new model's AUC is +0.01, ship it." List the three checks this skips (slices, delta inspection, calibration) and construct the one-slice regression hidden by +0.01 aggregate.
5. Behavioral suite: write six behavioral tests (2 invariance, 2 directional, 2 minimum-functionality) for the delivery-ETA model; each as input-pair → expected relation.
6. Mixed/spaced (E3): the warm-started model from distributed-training — write its gate: which comparisons run against the CURRENT production model, and why threshold-only is insufficient (regression on a slice the aggregate hides).
7. FORWARD (E7): your gate blesses the model offline, but the business metric is take-rate, measurable only on live traffic. Name what the offline gate structurally cannot see (feedback effects, distribution under its own influence). Solution: online experiments — module 5's deployment lesson → Ref deployment-and-online-experiments.

## ARC
- Inherits: trained candidates at scale from distributed-training; the metrics chain from module 1 (offline metrics are proxies).
- Contributes: evaluation redesigned for production — slices, calibration, behavioral tests, delta evaluation — assembled into the validation gate.
- Hands off: gated models need a factory to run the whole loop automatically → pipelines-and-orchestration; the gate's online counterpart waits in module 5.
- Spine step: "Training becomes an industrial process…" (step 5, Training as a pipeline).
