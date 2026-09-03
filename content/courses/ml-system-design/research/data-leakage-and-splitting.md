# Data leakage and repeatable splitting — research brief

Lesson: `data-leakage-and-splitting` (module: training-data, core, planned).
Goal: Identify and prevent data leakage — temporal, preprocessing, duplication, group — with time-based and hash-based repeatable splits.

## Sources
- DMLS Ch.5 (pp.135-141): leakage defined; the six causes (time-correlated random splits — Fig 5-7 timeline split; scaling/imputing before split; duplication — CIFAR-10/100's 3.3%/10% dupes found a decade later; group leakage; data-generation leakage — the COVID CT scanner/machine confound); four detection techniques (single-feature predictive power, ablation, suspicious gains, guard the test split); the Kaggle Ion Switching leak sidebar.
- ML Design Patterns DP22 Repeatable Splitting (pp.435-450): hash a well-distributed correlated column with FARM_FINGERPRINT; the you-can't-chain-two-modulo-filters gotcha (MOD 70 then 8-in-10 fails; fix MOD 700); sequential splits for time series; stratified split note; the Kolmogorov–Smirnov split-check tip.
- Burkov Ch.3 §3.5: leakage typology — target-is-function-of-feature (the GDP = population × GDP-per-capita example), feature-hides-target, feature-from-future; leakage at partitioning and imputation.
- Babushkin Ch.7: validation schemas — time-series validation, nested validation (one Remark), adversarial validation (train a train-vs-test classifier; AUC≈0.5 = representative) + the DeepMind RETRO leakage-quantification mention; split-updating procedure §7.4 (Karpathy epigraph).
- Classical-ml prerequisite note: cross-validation itself is known; THIS lesson is about production-specific split integrity.

## Key points
1. Leakage defined precisely (label information in places prediction time won't have) and elevated: it produces confidently wrong offline numbers — worse than a weak model, because it passes review.
2. The taxonomy, one worked case per class: (a) trivial target leakage — GDP from population × per-capita (compute it); (b) future-in-features — random split on time-correlated data (draw the timeline; stock features, trend features); (c) preprocessing leakage — scaler statistics computed on the full set before splitting; (d) duplication — CIFAR's decade-old 3.3%; (e) group leakage — COVID CTs keyed on scanner (the model learned the machine, i.e., the doctor's prior); (f) generation-process leakage — Kaggle Ion Switching's reverse-engineered test labels.
3. Time-based splitting as the default for anything time-correlated; what "prospective evaluation" simulates.
4. Hash-based repeatable splitting: why random seeds are not reproducible across languages/runs and why the split key must be the CORRELATED unit (user, session, date — not row id); FARM_FINGERPRINT recipe; the nested-modulo gotcha worked (divisible-by-70 ⊂ divisible-by-10 — sampling then splitting on the same hash biases); KS-check on label distributions across splits.
5. Detection: single-feature AUC screen, ablation, too-good-to-be-true deltas; adversarial validation as the general instrument (also finds shift — dual use noted, module 6 reuses it).
6. Split updating over time (§7.4): test sets age; the refresh procedure and what must stay frozen for comparability.

## Set pieces & gems
- COVID CT scanner confound — the flagship group-leakage story.
- Kaggle Ion Switching: both winning teams exploited a test-label leak — leakage at competition scale.
- CIFAR duplicate rates (3.3%/10%) undiscovered for a decade — the humility number.
- The nested-modulo bug (MLDP pp.442-444) — a genuinely subtle production bug; work it fully.
- The imputed-age-0 bug (DMLS p.125) — preprocessing leakage's cousin; one Remark bridging to features-at-scale.
- Karpathy: "we spend as much time on test data as on training data" — epigraph-grade, used inline where split-updating is argued.

## Pitfalls
- Don't re-derive cross-validation; the audience knows it. The production point is WHAT UNIT you split on and WHEN.
- Adversarial validation must be shown as a procedure (5 lines of pseudocode), not名 named — and its AUC interpretation calibrated (0.5 good; 0.9 = find the top features distinguishing sets).
- Nested validation: one Remark; hyperparameter-search leakage is real but secondary here.
- Keep the register non-forensic: the goal is designs that prevent, not just war stories.

## FIGURE PLAN
- draw: The leakage taxonomy as a single map: six classes, each with a one-line case and the pipeline stage where it enters (collection/preprocessing/split/generation). Original composition.
- draw: FigureSequence (3 frames): time-correlated leakage — frame 1 events on a timeline colored by class; frame 2 random split scattering future into train; frame 3 time split with the cut drawn, "trained on past, tested on future". Inspired by DMLS Fig 5-7.
- draw: Preprocessing leakage: scaler fit on full data vs fit on train only — two small pipelines with the statistics' provenance arrows, the leaking arrow in warning color. Original.
- draw: The nested-modulo gotcha: number line with multiples of 10 and 70 marked, showing the sampled-then-split subsets coinciding; the MOD 700 fix beside it. Inspired by MLDP pp.442-444.
- draw: Adversarial validation loop: concat train+test with origin labels → classifier → AUC gauge (0.5 green / 0.9 red with "inspect top features" arrow). Original.
- draw: Group leakage panel: CT scans grouped by scanner, the split cutting through groups vs along groups. Inspired by the DMLS COVID case.

## EXERCISE PLAN
1. Warm-up: classify six one-line dataset descriptions into the leakage taxonomy (or "clean").
2. Boundary probe: pure i.i.d. data with no time structure, no groups, no duplicates — show random splitting is exactly correct, and state which taxonomy assumptions make it so; then perturb one (introduce sessions) and watch the required split unit change.
3. Claim to refute: "we removed the timestamp column, so there's no temporal leakage." Construct the counterexample (a rolling-mean feature encodes time; trend in the label) and name the class.
4. Derivation the lesson skipped: for the nested-modulo bug, compute exactly which fraction of the intended 80% train sample is actually selected under MOD(id,70)<10 followed by MOD(id,10)<8, and verify MOD 700 fixes it.
5. Research-shaped: run (or trace by hand on a 20-row toy) adversarial validation between a train set and a shifted test set; report AUC and the top distinguishing feature.
6. Mixed/spaced (E3): the labels lesson's 10-minute-click dataset — write its correct split (by impression time AND by user hash) and say which leakage class each guard blocks.
7. FORWARD (E7): fit a scaler on train only, deploy the model, and now the SERVING code must apply the same scaler — list what must be shipped alongside the model for that to hold. Solution: transform artifacts shipped with the model is the transform pattern → Ref training-serving-skew (via features-at-scale).

## ARC
- Inherits: labeled data from labels-and-feedback-loops; the question of whether offline numbers computed on it can be trusted.
- Contributes: the leakage taxonomy with worked cases, time/hash splitting discipline, adversarial validation as the instrument.
- Hands off: splits are honest; now the features themselves must survive production conditions → features-at-scale.
- Spine step: "Training data is manufactured, not given…" (step 4, Data is manufactured).
