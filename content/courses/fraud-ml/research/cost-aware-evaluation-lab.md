# Lab: a budget- and cost-aware evaluation harness — research brief

Lesson: `cost-aware-evaluation-lab` (module: rare-positives, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Build an evaluation harness — prequential split with delay and known-card removal, average precision, card precision at k, savings, the Bayes-minimum-risk threshold and the undersampling correction — and use it to referee a model selection on the simulator
Opening (verbatim, the lesson must start with it): The lab builds the scorer every later lab is judged by: forward-in-time folds with a delay block, precision at the investigators' budget, savings in money and probabilities corrected for the undersampling the model was trained on — then uses it to settle which depth of tree to ship.

## Sources to consult
- Handbook Chapter_References shared_functions (get_train_test_set semantics: training window, delay window, test days dropping customers whose fraud was known up to test_day − delay, optional sampling_ratio; prequentialSplit shifting the training start back by i·delta_assessment per fold; card_precision_top_k per day with max prediction/max label per customer, top k, detected cards removed from later days, mean over days; card_precision_top_k_custom as a scorer rebuilding predictions_df from transactions_df.iloc[y_true.index]; get_summary_performances best-estimated vs optimal; threshold_based_metrics with precision = 1 when TP + FP = 0; read_from_files replacing −1 by 0). File: research/texts/reproducible-Chapter_References_shared_functions.md.
- Handbook Ch3.2 (the simulator's generating rules, for our own generator), Ch4.2–4.4 (the 10-transaction toy; AP step sum; P@k, CP@k with removal; the simulator's seven-day numbers: remaining frauds [55,60,56,56,59,58,41], P@100 mean 0.291, CP@100 0.286 → 0.241 with removal, remaining cards [50,50,49,47,46,44,31]), Ch5 (depth sweep: AUC picks 50, AP picks 3, CP@100 picks 5; optimal 4/4/5; all deltas 7 days, 4 folds). Files: reproducible-Chapter_3_GettingStarted_SimulatedDataset.md, reproducible-Chapter_4_PerformanceMetrics_*.md, reproducible-Chapter_5_ModelValidationAndSelection_*.md.
- Dal Pozzolo 2015 Eqs. 3, 9, 12 (p_s, p', τ') and Table I. File: staged-dalpozzolo2015-calibrating-undersampling.txt.
- Bahnsen 2016 Eqs. 1–5 and 15 (Cost(f), Cost_l, Savings, BMR). File: staged-bahnsen2016-feature-engineering.txt.
- CS6890 PS3 and HKU FITE7410 A2 handouts (the canon assignments). Files: cs6890-ps3.txt, hku-fite7410-a2q.txt, hku-fite7410-a2a.txt.
- .claude/skills/lab-author/references/conventions.md and docs/content-model.md "Lab lessons" (formats; metric thresholds authored higher-is-better; private/ for labels).

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has read module 2 and can state each result; they have not written any of it. Every later lab asks "what is your CP@100 on the held-out week", so a correct, tested implementation of the referee has to exist before anything else is built. The lab's problem is the module's: given scored rows with timestamps, card ids, amounts and late labels, produce the honest numbers — and the obvious implementations (trapezoidal AP, transaction-level precision, removal at the training end, β as a class ratio) are each wrong in a way the checkpoints catch.
### Chain of sub-problems
1. **A step-sum AP** — obvious: trapezoids; fails on the non-monotone PR curve; answer: Σ (R_n − R_{n−1}) P_n in rank order.
2. **Cost and savings** — obvious: C_TP = 0 and Cost_l = all-flag; fails: the caught fraud still costs the alert, and flagging everything is never the cheaper trivial policy for fraud; answer: Eqs. 1, 3–5.
3. **The fold generator** — obvious: shift only the test block; fails: the delay must stay between training and test in every fold; answer: shift the whole geometry back one block per fold, and remove per test day the cards known at day − δ.
4. **Card precision at k** — obvious: top-k transactions; fails: three alerts per card; answer: collapse per card per day, remove detected cards from later days.
5. **The BMR decision** — obvious: 0.5; answer: C_a ≤ Amt · p with the corrected p.
6. **The β correction** — obvious: p' = β p_s; fails: no renormalisation; answer: Eq. 9 with β the genuine keep rate and τ' matched.
7. **Prequential selection** — obvious: pick on the test folds; answer: validation folds shifted back by δ + the validation width, the pick per metric — AUC and AP must disagree.
### Set pieces and worked examples to recreate
- The 10-transaction toy as the AP checkpoint input (labels [1,1,0,0,0,0,0,0,0,0], scores [0.9,0.35,0.45,0.4,0.2,0.2,0.2,0.1,0.1,0]). (Handbook Ch4.2.)
- The seven-day CP@100 numbers as the sanity reference (≈ 0.24 for a depth-2 tree with removal). (Handbook Ch4.4.)
- Table I's β bookkeeping (1,000 of 10,000; β = 0.11 → 50/50). (Dal Pozzolo 2015.)
- The depth grid outcome: AUC's pick ≥ AP's pick. (Handbook Ch5.)
### Pitfalls and terms to define
- Removal date d − δ, not the training end; β = kept negatives / all negatives; AP without interpolation; C_TP = C_a; selection never on test folds.
- The handbook's code is GPL v3: rebuild from stated semantics, never vendor.
### Recalled, not re-taught
- Everything in the lab is module 2's content; the notebook prose recalls each result with a <Ref> and one sentence, then asks for the code.

## LAB PLAN
Artifact: one notebook producing a reusable evaluation module (`fraudeval`-style: `average_precision`, `savings`, `prequential_split`, `card_precision_top_k`, `bmr_decision`, `undersampling_correction`, `prequential_selection`), exercised end to end on a reduced run of the handbook-style simulator to referee a decision-tree depth selection and to produce a card-precision score on a held-out week. The later labs import this module.

CANON GROUNDING: modelled on CS6890 PS3 (dossier assignments: "implement example-dependent cost-sensitive regression twice, Bahnsen's approach and Nikou–Gunnemann's, on a table with features A–K, label L, per-row FN cost M. Document with algorithm and results. Marks: 10 each (5 code, 5 results)"; cs6890-ps3.txt) for the cost half; on HKU FITE7410 A2 (dossier: "the student builds two fraud detectors with any two supervised algorithms … plus an essay of at most 2 pages describing the two models' performance and arguing which is more suitable in practice"; the answer's cost comparison "$60,302 mean fraudulent claim; $4,214 per investigation; XGB $921,949 vs KNN $1,101,826"; hku-fite7410-a2q/a2a.txt) for the savings-based verdict; and on the handbook's reference implementations the reader is expected to re-run (shared_functions: prequentialSplit, card_precision_top_k with remove_detected_compromised_cards, get_train_test_set, performance_assessment). Departures: the cost-sensitive FIT (Bahnsen's CSLR with a genetic algorithm; the Nikou–Gunnemann variant) is dropped — the lab decides with costs rather than fitting with them, because the module's claim is about evaluation and the fit is a heuristic; HKU's two-algorithm essay becomes the review checkpoint on the depth selection; the handbook's functions are rebuilt from their stated semantics, not copied (GPL v3 code is not vendored).

Dataset/inputs: a reduced handbook-style simulator shipped as a complete, non-blanked generator cell (seeded; 1,000 customers, 2,000 terminals, 70 days, ≈ 150k rows, the three scenarios at the handbook's rates) so the learner generates train/delay/validation weeks in-notebook; `data/holdout_week.csv` (one further week of a second seed, features only, ≈ 2 MB) whose labels, card ids and dates sit in `private/` for the metric checkpoint. The 10-transaction toy ships as a literal. Licence: our own generator written from the handbook's description (prose CC BY-SA 4.0; code GPL v3, not copied).

Checkpoints (in course.yaml order):
1. `average-precision` (exact, warm-up): step-sum AP on the toy and on a seeded 2,000-row ranking; verified against stored values; wrong variants: trapezoidal interpolation; recall denominators from the ranked prefix instead of all positives.
2. `savings-metric` (exact, warm-up): Cost(f), Cost_l and Savings on a 50-row table of (amount, label, decision) with C_a given; wrong variants: C_TP = 0; Cost_l taken as the all-flag cost.
3. `prequential-split` (exact): a generator returning (train_idx, delay_idx, test_idx) for n folds shifted back one block each, with known-card removal applied to each test day at day − δ; verified on a seeded 30-day mini-stream against a hand-built answer; wrong variants: removal using labels known at the test day instead of day − δ; folds that shift only the test block.
4. `card-precision-top-k` (exact): per-day card collapsing (max score, max label), top k, detected-card removal from later days, mean over days; verified on a seeded 7-day frame with a hand-computable answer and on the simulator week against ≈ 0.24 for a depth-2 tree; consumes 3's test indices; wrong variants: transaction-level P@k; no removal.
5. `bmr-threshold` (exact): per-row decision C_a ≤ Amt · p on a table, priced with 2's cost helpers; wrong variants: constant threshold 0.5; comparison reversed.
6. `undersampling-correction` (exact): p' from p_s and β and the matched threshold τ'; verified on a seeded array and by the identity that decisions under (p', τ') equal decisions under (p_s, τ_s); wrong variants: p' = β p_s (no renormalisation); β defined as positives/negatives.
7. `prequential-selection` (exact): a depth grid {2,3,4,5,6,8,10,20,50} fitted (sklearn allowed) on 3's folds, scored by 1 and 4 and ROC-AUC, returning the best-validation depth per metric; the expected answer has AUC's depth ≥ AP's depth; wrong variant: selecting on test folds.
8. `why-auc-picks-fifty` (review, optional): the learner's account of why validation AUC prefers the overfitted tree; rubric accepts "pure leaves give two scores that win the low-recall region AUC integrates and lose the high-precision region AP weights"; "overfitting" alone is insufficient.
9. `beat-card-precision` (metric, optional, last): any model, scored by the learner's own `card_precision_top_k` on the held-out week; the server recomputes from submitted scores and the private labels; threshold calibrated so a depth-5 tree on the 14 baseline-style features clears it with ≥ 0.02 margin and a depth-2 tree does not.

Final open task: checkpoint 9 — CP@100 over the held-out week; rough threshold ≈ 0.26 (reference: depth-5 tree ≈ 0.28–0.30 on the reduced simulator, depth-2 ≈ 0.24; calibrate by running the reference).

Known-wrong variants worth declaring: AP interpolation; the removal date; transaction-level precision; the missing renormalisation in p'; β as a class ratio; C_TP = 0; selection on test.

NOT blanked (ships complete): the simulator generator, the 14-feature builder (module 3 teaches it), data loading, plotting helpers (daily counts with train/delay/test bands; three-panel metric-vs-depth; PR curve), the sklearn tree fits inside checkpoint 7's loop.

est_hours: 4. Progression: warm-ups (1, 2) → composing chain (3 → 4 → 7; 2 → 5; 6 independent, consumed by the capstone) → one open metric last (9) → review garnish (8). Required: 1–7.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: AP and CP@k (alert-budget-metrics), the geometry and removal (delayed-labels-prequential), p' and τ' (undersampling-calibration), the metric-dependent pick (imbalance-techniques-revisited), savings and BMR (example-dependent-cost), the benchmark numbers as the sanity reference (ulb-handbook-benchmark).
- Contributes: the module's results as verified code; the referee every later lab imports.
- Hands off: point-in-time-feature-lab (its metric checkpoint), scorecard-vs-gbm-lab (the comparison), drift-detector-lab (the windowed scorer sits beside it), pipeline-capstone-lab (cumulative CP@100, the β correction, the BMR decision).
