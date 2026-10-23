# The handbook benchmark: five models, three metrics, simulated and real data — research brief (module 2 APPLICATION)

Lesson: `ulb-handbook-benchmark` (module: rare-positives, core, planned). NEW. Module-final application (L16).
Goal: Evaluate the handbook's five baseline models on simulated and Worldline data and attribute every ranking reversal to the metric and the data regime.

## Sources
- Handbook Ch3 BaselineModeling (primary): train/delay/test with known-card removal; 67,240 train / 598 frauds; test 58,264 / 385 (0.66%); decision tree depth 2 — test AUC 0.763, AP 0.496, CP@100 0.241; random 0.5 / 0.007 / 0.017; the tree reads off amount > 220 (threshold 218.67; leaf 236 frauds / 66,498 genuine → p = 0.003536); five-model table (LR 0.871/0.606/0.291; DT2 0.763/0.496/0.241; DT∞ 0.788/0.309/0.243; RF 0.867/0.658/0.287; XGB 0.862/0.639/0.273); train AUC = AP = 1.0 for DT∞ and RF (overfitting); execution times; "accuracy must be traded against memory/time".
- Handbook Ch3 Baseline_RealWorldData and Ch4.5 Assessment_RealWorldData: Belgian e-commerce 2018, ~400,000 tx/day, ~1,000 frauds/day (0.25%), ~300 compromised cards/day; random CP@100 ≈ 0.0025; LR CP@100 ≈ 0.15, DT2 ≈ 0.1; the real tree splits TERMINAL_ID_RISK_30DAY_WINDOW > 0.075 AND CUSTOMER_ID_NB_TX_1DAY_WINDOW > 13.5 (burst); XGBoost AUC 0.899 vs RF 0.78 and LR 0.788; AP much lower overall; RF AP below DT2 due to overfitting; the PR curves (APs 0.002 random, LR 0.035, DT2 0.024, DT∞ 0.003, RF 0.015, XGB 0.035); daily detected cards bounded by k; -1 as missing values in real data (shared_functions read_from_files).
- Handbook Ch4.3–4.4 for the metric readings (already taught; recalled).
- Handbook Ch1.1–1.3 and Foreword: reproducibility as the book's purpose; Colab vs Binder; licences (code GPL v3, prose CC BY-SA 4.0) — one sentence on what can be re-run (simulator) and what cannot (Worldline).
- Handbook Ch2.4: the eight challenges (imbalance, drift, near real time, categoricals, sequences, overlap, no consensus on metrics, no public data) — the benchmark is where several show.

## Key points
1. The artifact: a reproducible notebook benchmark — simulator run, 14 features, five models with default parameters, one week test after a one-week delay. State the geometry and the counts.
2. Simulated reversals: DT∞ vs DT2 (AUC +0.025, AP −0.19); RF train-perfect but test behind LR on AUC; XGBoost below RF on every metric here (defaults, no tuning — forward to gbm-model-selection). Each reversal attributed: AUC rewards the low-recall region DT∞'s pure leaves reach; AP punishes the many 1.0-score genuine leaves.
3. The depth-2 tree as a reader of the simulator: amount > 220 learned as 218.67 from the sample — scenario 1 is a unit test; the other two scenarios need the terminal and customer windows (scenario 2 → terminal risk; 3 → customer amount deviation) — the baseline features were designed for them.
4. Real data: the tree finds terminal risk × daily burst; precision floors at 0.1 for everyone; CP@100 0.1–0.15 against a random 0.0025 = a 40–60× lift; AP numbers that look like failure and are not; the k = 100 ceiling against 300 cards/day.
5. What the replay departs from: a fixed one-week delay; complete labels; the real feature set is still the 14 baseline features; no tuning; static pickles the reader cannot re-run.
6. Reading the handbook as an artifact: errata (AUC 0.764 vs 0.763; night hour ≤ 6 vs < 6), dated code (DataFrame.append, make_scorer(needs_proba)) — reproducibility is a practice, not a state.

## Set pieces & gems
- 218.67 vs 220: the tree reads the simulator's rule.
- DT∞: train AUC = AP = 1.0, test AP 0.309 — overfitting with a metric that hides it (AUC 0.788).
- Real data: random CP@100 0.0025 vs LR 0.15 — a 60× lift that is still "one in seven alerts".
- RF AP < DT2 AP on real data.
- The read_from_files −1 → 0 missing-value line: the dataset's own footnote.

## Pitfalls
- Everything numeric here is quoted from the handbook or computed on our simulator run — label which (the Worldline numbers cannot be reproduced).
- Do not tune models (module 4's job); this lesson is defaults, reversals, regimes.
- The application must state which module results it uses (L16) — write the sentence.

## FIGURE PLAN
- draw: The five-model × three-metric dot plot for simulated data with connecting lines (reversals visible), and the same for real data beside it — two panels joined by an arrow; key image. Computed/quoted.
- draw: The depth-2 tree on the simulator as a drawn tree with the 218.67 split and leaf counts (236 / 66,498), beside a copy of the simulator's scenario-1 rule — "the model read the rule". Recreated from Handbook Ch3 (not traced).
- source: reproducible-wl-decision-tree — stem `worldline-depth2-tree`; the reader must see the two real splits (terminal risk 30-day > 0.075, customer 1-day count > 13.5) with their leaf counts; centered in the real-data section; check legibility first (2014×778 render).
- source: reproducible-wl-pr-curves — stem `worldline-pr-floor`; the reader must see five PR curves squashed near the x-axis with the random baseline at 0.002 and the APs in the legend; float right beside the "precision floors at 0.1" paragraph.
- draw: `<FigureSequence>` (3 frames): a test week's daily compromised cards (300), the remaining after known-card removal, the detected under k = 100 — frame by frame on the real-data scale. Inspired by reproducible-wl-card-precision-topk (that image is sourced in alert-budget-metrics; here a drawn schematic of the accounting).
- draw: Train vs test AP for DT2, DT∞, RF, XGB as paired bars with the gap labelled — the overfitting reading. From Handbook Ch3 numbers.

## EXERCISE PLAN
1. Warm-up: from the leaf counts 236 / 66,498 compute the leaf's fraud probability and the implied lift over the training prevalence 598/67,240.
2. Boundary probe: a model that outputs only two distinct scores (DT∞ with pure leaves) — compute its ROC (two points) and show the trapezoid AUC can exceed a smooth model's while its AP is tiny; name the interpolation that AUC performs and AP does not.
3. Claim to refute: "On the real data XGBoost's AP of 0.035 means it is barely better than random (0.002), so the model is not useful." Compute the lift (17×) and the CP@100 it implies at 300 cards/day; name the number investigators use.
4. Research-shaped: re-run the simulated benchmark on your own simulator run (the lab's reduced generator) and report the five × three table; state which reversals survive the seed.
5. Derivation: show that for a classifier with scores constant within leaves, AP equals a weighted sum of leaf precisions ordered by leaf probability — and that the pure-leaf DT∞ thereby puts all its genuine-with-score-1 rows ahead of every fraud with score < 1.
6. FORWARD (E7): take the handbook's simulated five-model table and ask which model would win if its depth/trees were chosen by validation CP@100 rather than left at default — the reader computes a small depth sweep and finds DT at depth 4–6 beating default XGBoost on CP@100 → lands on `gbm-model-selection`.
7. Mixed review (E3): apply the β correction (imbalance-techniques-revisited) to a 50/50-trained LR's scores on the simulator week and report whether AP changed and whether savings (example-dependent-cost) under BMR changed.

## ARC
- Inherits: AP/CP@k, the validation geometry, the imbalance findings, costs (the whole module).
- Contributes: the module's results cashed out on the course's two instruments — the simulator (reproducible) and the Worldline replay (quoted) — with every reversal attributed.
- Hands off: the harness lab (next); tuning (gbm-model-selection); the real-data eight-model table (worldline-model-comparison).
- Spine step 2: rare positives, honest metrics.

## APPLICATION (L16)
- Artifact: the handbook's Chapter 3 baseline notebook (simulator + 14 features + five default models) and its Chapter 3/4 real-world replays on Worldline's 2018 Belgian e-commerce data.
- Module results used: AP as step sum and CP@k with detected-card removal (alert-budget-metrics); train/delay/test with known-card removal (delayed-labels-prequential); the AUC-vs-AP reversal mechanism (imbalance-techniques-revisited); the cost frame for reading a 0.035 AP (example-dependent-cost).
- Departures from the idealisation: fixed one-week delay; labels complete in the replay; untuned defaults; the simulator's scripted fraud that a depth-2 tree can read; the Worldline results are static figures (no code, no data), so the real half is read, not run.
