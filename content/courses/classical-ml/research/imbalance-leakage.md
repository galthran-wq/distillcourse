# Class imbalance and data leakage — research brief

Lesson: `imbalance-leakage` (module: evaluation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/imbalance-leakage/lesson.mdx (26 min).
Goal: Analyze class imbalance and data leakage scenarios and select mitigations that survive deployment.

## Sources
- Murphy §5.1.4 (imbalance and PR framing); ISLP §4.4.2 (Default threshold moving — inherited); resampling/prior-correction: standard results, derive the correction ourselves (log-odds offset log(π₊/π₋) under resampling — elementary Bayes algebra).
- Rahimi & Recht 2007, footnote 1 (the KDDCUP99 fragility gem: 50 random training examples ≈ 8% error; CVM's 6.2% → 18% from shuffling training order, → 49% from a 15% regularization nudge — benchmark fragility with numbers).
- Murphy §18.4/§18.6 ('george'/'hp' spam leakage — inherited from spam-filter); ESL §7.10.2 pointer (the wrong-way-CV case is the NEXT lesson's artifact — here only taxonomized).
- Grinsztajn et al. §3.2 (benchmark-construction hygiene: what they had to exclude and why — deterministic datasets, side issues) as evidence that leakage-thinking shapes even benchmark design.

## Key points
1. Imbalance playbook IN ORDER, each step derived or evidenced: (a) fix the metric first (PR/cost curves — classification-metrics cashed); (b) class weights = cost-sensitive loss (show the weighted log-loss gradient — one line from module 4's (y−p)x); (c) resampling (up/down/SMOTE named) and its exact calibration distortion — DERIVE the prior-correction: resampling shifts the intercept by log of the sampling ratio; uncorrected probabilities are wrong by that offset; (d) threshold moving as the honest default.
2. The refutation slot (L13 — genuine misconception): "balance the classes first" as a reflex. State it, reject it: the base rate is information; resampling without recalibration produces systematically wrong probabilities; the discriminating example is a screening model whose resampled version triples the implied prevalence.
3. Leakage taxonomy with one REAL case each: target leakage (a post-outcome feature — the classic hospital example), temporal (training on the future), group (same patient in train and test), train-test contamination (preprocessing fitted on everything — the standardization example computed); the spam 'george' case reprised as deployment-shift leakage.
4. Detection heuristics as an audit checklist: too-good scores vs base rates; single dominant importance; performance collapse under time-split; duplicated rows across splits — each tied to the taxonomy row it catches.
5. Benchmark fragility: the KDDCUP99 numbers as the cautionary tale — a benchmark so leaky/oversampled that ordering and hyperparameter noise swing error 6%→49%; what that implies about reading published tables.

## Set pieces & gems
- The KDDCUP99 footnote (Rahimi–Recht) — quotable, numeric, and almost never taught.
- The derived resampling offset log(n₊′n₋/n₊n₋′) — turns folklore recalibration into two lines of Bayes.
- The 'george' feature as the bridge case: legitimate in-sample, leakage under deployment shift.

## Pitfalls
- SMOTE: name it, one sentence of mechanism, no recipe evangelism — evidence for its benefit over weights is weak; say so dryly.
- Don't merge this lesson with wrong-way-cv: HERE the taxonomy and playbook; THERE one blunder reproduced end to end.
- Every "real case" must be a documented pattern, not an invented persona (L9).

## FIGURE PLAN
- draw: The playbook as a decision strip — metric → weights → resampling(+recalibrate) → threshold, each box carrying its one-line cost; a red "recalibrate" tax stamped on the resampling box. Single Figure; key image.
- draw: The resampling distortion — reliability diagrams before/after 10× upsampling, and after the derived intercept correction (three panels, the middle one visibly miscalibrated). Computed.
- draw: FigureSequence (4 frames): the leakage taxonomy — one schematic pipeline (rows → features → split → fit → score) with the leak drawn as an arrow crossing the split line at a different point per frame (target/temporal/group/preprocessing).
- draw: Time-split collapse — a model's random-split score vs time-split score as paired bars for a drifting dataset; the gap as the diagnostic. Computed toy.
- draw: KDDCUP99 fragility — the published numbers as a dot plot: 6.2% (reported) / 18% (reshuffled) / 49% (nudged λ) / 8% (50 random samples baseline); caption reads the moral. Single Figure from Rahimi–Recht's footnote numbers.

## EXERCISE PLAN
1. Warm-up: a 1:99 problem, classifier with recall 0.7, precision 0.2 — compute the confusion matrix per 10,000 cases and the accuracy of the all-negative rival.
2. Derivation skipped: derive the resampling intercept offset for logistic regression (Bayes' rule on the sampling event); state the correction formula and verify on a 2×2 numeric case.
3. Boundary probe: downsample the majority class to 1:1 when the minority has 30 cases — compute the variance cost (effective n) and argue when weighting strictly dominates resampling.
4. Claim to refute: "our AUC is 0.99, so the model is excellent." List the three taxonomy rows most likely to produce 0.99 on this (screening) problem and the audit that would catch each — leakage-first skepticism as method.
5. Mixed review (E3): the standardization leak — compute μ,σ on all data vs train-only for a tiny table and show the held-out z-scores differ; connect to feature-engineering's pipeline rule (next lesson).
6. Research-shaped: design the experiment that distinguishes "model got better" from "leak got bigger" for a feature suspected of target leakage (prospective time-split protocol; state what result pattern indicts the feature).
7. FORWARD (E7): take 1,000 noise features, select the 20 most label-correlated on the FULL data, then honestly cross-validate on the survivors; record the impossible score. Solution: the anatomy of this number is the next lesson → Ref wrong-way-cv.

## ARC
- Inherits: metrics and calibration (classification-metrics); protocols (cross-validation-bootstrap); the 'george' case (spam-filter).
- Contributes: the two production failure modes with derivations (weighting gradient, resampling offset) and an audit discipline.
- Hands off: the canonical blunder reproduced in full → wrong-way-cv; the pipeline hygiene rules → feature-engineering.
- Spine step: "Measurement is part of the method…" (step 5).

## REVISION (vs old draft)
- Gains: the derived prior-correction (draft asserts "recalibrate after"); the weighted-gradient one-liner; the KDDCUP99 set piece; the L13 refutation structured properly; the ESL wrong-way case MOVES OUT to its own lesson (draft carried it as a bullet).
- Loses: interview register; SMOTE recipe detail.
- Demo: none (unchanged).
