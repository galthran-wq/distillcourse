# Lab: a scorecard and a boosted tree under the same referee — research brief

Lesson: `scorecard-vs-gbm-lab` (module: supervised, type: lab, planned). NEW.
Goal: Build a weight-of-evidence scorecard from scratch, train a gradient-boosted detector on the same prequential folds, and choose between them by savings and card precision with a written case for the choice.

## ARC
- Inherits: binning, WOE, IV, points scaling (scorecards-woe); the selection triplet and random search (gbm-model-selection); the harness (cost-aware-evaluation-lab); the feature module (point-in-time-feature-lab); the three-leaderboard reading (worldline-model-comparison).
- Contributes: the interpretable detector as verified code (Baesens' tables reproduced exactly) and the module's thesis — selection beats class at the operational metric — measured by the learner.
- Hands off: a fitted scorecard whose points are the explanation alert-explanations reads; a tuned GBM the capstone retrains daily; the written cost case as the first governance artefact (score-to-action).
- Spine step 4 (final item): "…the gap between model classes is smaller than the gap between metrics."

## LAB PLAN

Artifact: one notebook producing a `scorecard.py`-style module — `equal_frequency_bins`, `woe_iv`, `chi2_binning_compare`, `scorecard_points`, `fit_scorecard` — plus a tuned gradient-boosted detector selected by random search on the module-2 harness, ending with both scored on a held-out week and a written verdict argued in savings.

CANON GROUNDING: modelled on HKU FITE7410 Assignment 2 (dossier: "any TWO supervised algorithms on Auto Insurance Claims data … essay: performance of both, and which suits the case from a practical standpoint … cost matrix: mean fraudulent claim $60,302, $4,214 per investigation; XGB $921,949 vs KNN $1,101,826") for the two-detector-plus-cost-verdict shape, on Baesens' worked scorecard pipeline (Tables 2.5, 2.8, 2.10; Fig 4.7: 583 vs 662, IV 0.6502, Factor 28.85 / Offset −12.87) for the exact fixtures, and on CS6890 PS3's cost framing. Departures: HKU's second algorithm was KNN and its models were library calls — here the scorecard is built from scratch (the course's depth mandate) and the GBM is a library model tuned with the learner's own harness, because the lesson is selection, not boosting internals (classical-ml's boosting-lab already builds the booster); the insurance-claims data (1,000 rows, 24.7% fraud) is replaced by the reduced simulator so that CP@k and prequential folds exist; HKU's target encoding over the full data before the split is declared as a known-wrong variant.

Dataset: the reduced simulator log with the module-3 feature module applied (shipped complete: generator + feature builder); Baesens' Table 2.8 counts (age bins) and Table 2.5 odds table as literals; `data/holdout_week_features.csv` with labels, card ids, amounts in `private/`. Licence: our own generator; Baesens' tables as short quoted fixtures.

Checkpoints (plan; lab-author may split or deepen):
1. `equal-frequency-bins` (exact, warm-up): bin edges and counts for q bins of a numeric column, ties handled by rank; wrong variant: equal-interval edges.
2. `woe-iv` (exact, warm-up): WOE per bin and IV for a (bin, fraud count, non-fraud count) table; verified on Table 2.8 (IV 0.6502, WOE −107.83% … +166.08%) and a seeded table; wrong variants: ratio inverted (bad/good); IV without the (DistGood − DistBad) weighting (sum of WOE).
3. `chi2-binning-compare` (exact): chi-squared of two candidate binnings on the odds table — 583 vs 662 on Table 2.5's two options; consumes 1's bins for the simulator variable; wrong variant: expected counts from row totals only.
4. `scorecard-points` (exact): Factor and Offset from (points at odds, pdo) — 28.85 / −12.87 for the textbook's anchors; per-attribute points (WOE·β + b₀/N)·Factor + Offset/N for a given fitted β; verified by summing to the total score on a seeded applicant; consumes 2's WOE; wrong variants: Offset without the b₀/N split (points do not sum); ln vs log₂.
5. `fit-scorecard` (exact): the whole pipeline on the simulator folds — bins fitted on the training fold only, WOE columns, logistic fit (library allowed), points, scores for a held-out table; verified on a seeded fold by the scores' digest; consumes 1, 2, 4; wrong variants: bins/WOE fitted on train + test; current-row-inclusive features (from the module-3 leak).
6. `tuned-gbm` (exact): random search (n = 10 of an 18-point grid over trees/depth/learning rate) on the prequential folds with the module-2 harness; returns the best-validation configuration per metric (AP, CP@100) — expected to differ; verified by the returned configurations under the seed; consumes the harness; wrong variants: selection on test folds; grid in place of random (returns the same winner but fails the call-count check).
7. `which-to-ship` (review, optional): the learner's written case naming the shipped detector, the savings and investigation-cost figures behind it, and what the other buys (explanation, latency, regulatory reading); rubric requires a money comparison and a non-money consideration; "GBM has higher AUC" alone insufficient.
8. `beat-savings` (metric, optional, LAST): savings on the held-out week (C_a stated) from either detector's scores under BMR; threshold calibrated so the tuned GBM clears by ≥ 0.02 and the scorecard sits near it (reference: GBM ≈ 0.62, scorecard ≈ 0.55 on our reduced simulator — to calibrate).

Final open task: checkpoint 8 — metric savings; rough threshold ≈ 0.58 (calibrate).

Known-wrong variants: WOE inverted; IV as plain sum; Offset without the b₀/N split; bins fitted on all data; selection on test; the module-3 current-row leak reused.

NOT blanked (ship complete): generator, feature module (from the module-3 lab, imported), harness (module-2 lab, imported), the logistic-regression and GBM library calls (the fits are not the lesson; the pipeline around them is), plotting (WOE bars per variable; validation curves per configuration; savings vs C_a).

est_hours: 4. Progression: warm-ups (1, 2) → composing chain (1 → 3; 2 → 4 → 5; 6 on the harness) → one open metric last (8) → review garnish (7). Required: 1–6.
