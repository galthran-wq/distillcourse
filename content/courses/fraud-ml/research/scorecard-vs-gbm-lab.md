# Lab: a scorecard and a boosted tree under the same referee — research brief

Lesson: `scorecard-vs-gbm-lab` (module: supervised, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Build a weight-of-evidence scorecard from scratch, train a gradient-boosted detector on the same prequential folds, and choose between them by savings and card precision with a written case for the choice
Opening (verbatim, the lesson must start with it): Two detectors built by the learner — a points scorecard assembled table by table and a boosted tree tuned by random search — scored by the same forward-in-time referee, with the choice between them argued in money.

## Sources to consult
- Baesens et al. 2015 Ch2 Tables 2.5–2.8 and 2.10 (coarse classification with χ² 583 vs 662; the 2,000-row age table with WOE and IV 0.6502), Ch4 pp.131–133 and Fig. 4.7 (Factor 28.85, Offset −12.87, points per attribute, the summed score) — `research/texts/fraudanalyti-s2-ch2-3.txt`, `fraudanalyti-s3-ch04a.txt`.
- Handbook Ch5 "Model selection" (random search 10 of 18 combos; XGBoost grid depth {3,6,9}, trees {25,50,100}, lr {0.1,0.3}; `prequentialSplit`, `card_precision_top_k_custom`) — `research/texts/reproducible-Chapter_5_ModelValidationAndSelection_ModelSelection.md`, `reproducible-s3-Chapter_5_ValidationStrategies.txt`.
- Bahnsen et al. 2016 Sec. 2 (Cost and Savings, Eqs. 1–5; C_FN = Amt, C_TP = C_FP = C_a) and Sec. 4.3 (BMR decision) — `research/texts/staged-bahnsen2016-feature-engineering.txt`.
- HKU FITE7410 A2 handout and answer: two supervised algorithms, the practical comparison essay, the cost argument (mean fraudulent claim $60,302, $4,214 per investigation, XGB $921,949 vs KNN $1,101,826, 16.3% cheaper) — `research/texts/hku-fite7410-a2q.txt`, `hku-fite7410-a2a.txt`, `hku-fite7410-a2code.txt` (note the target-encoding leak before the split).
- CS6890 PS3 (example-dependent cost-sensitive learning, TP = FP = 6, TN = 0, FN per row) — `research/texts/cs6890-ps3.txt`.
- The module-2 harness (`cost-aware-evaluation-lab`): `savings`, `prequential_split`, `card_precision_top_k`, `bmr_decision`.
- The module-3 lab's `build_feature_matrix` (`point-in-time-feature-lab`).

## EXPLANATION PLAN
### The problem as the newcomer meets it
The module argued that the gap between model classes is smaller than the gap between metrics, and that a reviewable card costs something a tree does not. The learner has read both detectors; neither exists as their code. The lab makes them build the card from bins to points (so every number in it is theirs), tune the tree with the selection procedure they read about, and then do what the course keeps asking: decide in money under one referee, and write the decision down.

### Chain of sub-problems
1. **Bins** — equal-frequency binning with edges and counts; the wrong variant is equal-width.
2. **WOE and IV** — per bin and per variable, checked against the 2,000-row age table (IV 0.6502).
3. **Choosing between binnings** — χ² against independence on two candidate groupings (583 vs 662 on the product table).
4. **Points** — Factor and Offset from the two anchors; points per attribute from a fitted logistic regression on WOE features.
5. **The card** — bins → WOE → fit → points, scoring a held-out table; the score must equal a linear map of the logistic log-odds.
6. **The tree** — random search over the boosted-tree grid on prequential folds with the module-2 harness, best-validation configuration per metric.
7. **The decision** — savings and card precision of both on the same folds; a written case.
8. **The bar** — the better detector's savings on a held-out week against a private threshold.

### Set pieces and worked examples to recreate
- The age table as the WOE/IV fixture: 1,806 / 194, bins Missing…44+, WOE −57.28 … +166.08 (%), IV 0.6502 (Baesens Tables 2.8, 2.10).
- The product-type groupings as the χ² fixture: 583 vs 662 (Baesens Tables 2.5–2.7).
- Factor 28.85, Offset −12.87 for 100 @ 50:1 and 20 pdo (Baesens Ch4 p.132).
- The XGBoost grid and the random-search budget (Handbook Ch5).
- The dollar comparison as the model for the written case (HKU A2 'Model suggestion').

### Pitfalls and terms to define
- WOE sign convention fixed as ln(non-fraud share / fraud share); the checker expects it.
- Zero-count bins: a 0.5 smoothing is specified in the docstring so the exact check is deterministic.
- The logistic fit on WOE features uses sklearn (allowed; the lab is about the card, not the solver), with a fixed C and seed.
- Savings need calibrated probabilities for the BMR decision: the tree's scores are used as scores for CP@k and as probabilities only after the harness's calibration step, stated in the notebook.
- The HKU code's target encoding before the split is shown as a counterexample cell, not as a step.

### Recalled, not re-taught
- WOE, IV, points (`scorecards-woe`), the selection triplet and random search (`gbm-model-selection`), savings and BMR (`example-dependent-cost`): a <Ref> and one formula line each above the relevant checkpoint.
- The harness and the feature matrix are imported from the two earlier labs, not rebuilt.

## LAB PLAN
Artifact: one notebook producing a `Scorecard` object (fit from bins to points, score a table, print the card) and a `tuned_gbm` configuration with its prequential scores, plus a one-page written decision; the two detectors scored on identical prequential folds by the module-2 harness.

CANON GROUNDING: modelled on HKU FITE7410 Assignment 2 ("the student builds two fraud detectors with any two supervised algorithms on the Auto Insurance Claims data, plus an essay of at most 2 pages describing the two models' performance and arguing which is more suitable in practice, citing examples … human marking, no automatic tests") — the two-detector structure and the practical, money-based verdict are kept; on Baesens' worked scorecard tables (Tables 2.5–2.10, Fig. 4.7), which the textbook gives as hand computations without exercises and which become exact checkpoints here; and on CS6890 PS3 ("implement example-dependent cost-sensitive regression twice … TP = FP = 6, TN = 0, FN per row") for the cost half of the verdict. Departures: the insurance data (1,000 rows, 24.7% fraud) is replaced by the course's simulator-generated card data at a realistic base rate, because the module's argument is about card precision under an alert budget; R is replaced by Python; the essay becomes a review checkpoint with a rubric; the cost-sensitive FIT of PS3 is not required (the harness decides with costs).

Dataset/inputs: `data/transactions.csv` (the same seeded simulator log as the module-3 lab, ≈ 130k rows, 60 days) run through the shipped `build_feature_matrix` to give the 14 features plus three categorical variables (terminal region, hour band, payment type) added by the generator for the card to bin; the age-table fixture and the product-type fixture as literals; `data/holdout_week.csv` features with labels and amounts in `private/`. Licence: our generator written from the handbook's description; no copied code; the textbook tables are small numeric fixtures.

Checkpoints (ids as in course.yaml, in order):
1. `equal-frequency-bins` (exact, warm-up): bin edges and counts for a numeric column at a given number of bins on a seeded array; wrong variant: equal-width edges.
2. `woe-iv` (exact, warm-up): WOE per bin and IV for a binned variable, with 0.5 smoothing on zero counts; verified on the age-table fixture (IV 0.6502, WOE −1.0783 at 18–22) and a seeded frame; consumes 1's bins; wrong variants: flipped sign; distributions computed over all rows instead of per class.
3. `chi2-binning-compare` (exact): χ² against independence for two candidate groupings of a categorical variable, returning both statistics and the better grouping; verified on the product-type fixture (583, 662); wrong variant: χ² computed on counts without the independence expectation.
4. `scorecard-points` (exact): Factor and Offset for given anchors (100 @ 50:1, 20 pdo → 28.85, −12.87), and the points table of a fitted logistic regression on WOE features (points_ij = (WOE_ij β_j + β_0/N) Factor + Offset/N); consumes 2; verified on a seeded fit with fixed coefficients; wrong variants: Offset not divided by N; log base 10.
5. `fit-scorecard` (exact): the full pipeline bins → WOE → logistic fit (fixed C, seed) → points, scoring a held-out table; verified by the scores on a seeded table and by the identity score = Offset + Factor × log-odds; consumes 1–4; wrong variant: bins re-estimated on the held-out table.
6. `tuned-gbm` (exact): random search (seeded, 8 of the 18-point grid) over depth {3,6,9} × trees {25,50,100} × lr {0.1,0.3} on prequential folds with the module-2 harness, returning the best-validation configuration for AP and for CP@100; verified on a reduced seeded run; consumes the harness; wrong variant: selection on the test fold.
7. `which-to-ship` (review, optional): the written case — savings and CP@100 of both detectors on the same folds, the investigation cost, and what the loser buys (reviewability or precision); rubric requires numbers from the learner's own run, a money comparison, and the named trade-off; a verdict with no cost figure fails.
8. `beat-savings` (metric, optional, LAST): either detector's savings on the held-out week (C_a given), scored by the harness against private labels and amounts; threshold calibrated so the tuned tree clears it by ≥ 0.02 and the card at the default cut-off does not.

Final open task: checkpoint 8, savings on the held-out week; rough threshold ≈ 0.55 (to calibrate: tuned tree with the BMR cut-off ≈ 0.62–0.68 on our generator; the card ≈ 0.50–0.55).

Known-wrong variants worth declaring: flipped WOE sign, class distributions over all rows, Offset/N dropped, bins refit on test, selection on test.

NOT blanked (ships complete): the generator and `build_feature_matrix`, the module-2 harness import, the sklearn logistic and XGBoost fits (called with learner-chosen settings), plotting helpers (WOE bar chart per variable; the card printed as a table; validation vs test per configuration), the savings and CP@100 scoring calls.

est_hours: 4. Progression: warm-ups (1, 2) → composing chain (3 → 4 → 5 for the card; 6 for the tree, both feeding 7 and 8) → one open metric last (8) → review garnish (7). Required: 1–6.

## ARC
- Spine step 4 "Supervised detectors compared": "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
- Inherits: the card (`scorecards-woe`), the selection procedure and random search (`gbm-model-selection`), the one-table-three-winners reading (`worldline-model-comparison`), savings and BMR (`example-dependent-cost`), the harness (`cost-aware-evaluation-lab`), the feature matrix (`point-in-time-feature-lab`).
- Contributes: the module's two detectors as verified code and a decision argued in money.
- Hands off: the scorecard's points as an explanation to `alert-explanations`; the tuned tree as the detector the capstone retrains (`pipeline-capstone-lab`); the written-case habit to `tra-exemption-engine` and `eu-transaction-monitoring-design`.
