# Tree ensembles and prequential model selection — research brief

Lesson: `gbm-model-selection` (module: supervised, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Evaluate decision trees, random forests and XGBoost under prequential selection on simulated and real card data, and explain why a tuned single tree matches the boosted ensemble on card precision at a hundredth of the cost
Opening (verbatim, the lesson must start with it): A boosted tree ensemble with the right depth, learning rate and number of trees beats a single tree, but the right values depend on the data and the metric, and every candidate costs minutes to hours of compute. How do you choose the settings for next week's data when the only labels you have are a week old, and how much does the choice buy over a well-tuned single tree?

## Sources to consult
- Handbook Ch5 "Model selection": the four-step methodology, argmax of validation performance, bias/variance; decision tree depth grid (best-estimated 50 by AUC, 3 by AP, 5 by CP@100; optimal 4/4/5; validation AUC 0.823 vs test 0.797); logistic regression C; random forest (plateau at depth 10–20, training time linear in trees, 12 combos 587 s); XGBoost (18 combos 1,251 s; past 50 trees helps AUC/AP slightly, lowers CP@100 slightly); the comparison table (LR 0.868/0.623/0.297, RF 0.87/0.678/0.299, XGB 0.869/0.687/0.303, DT 0.797/0.579/0.284); random search 10 of 18 combos in 690 s with the same scores; defaults vs tuned — `research/texts/reproducible-Chapter_5_ModelValidationAndSelection_ModelSelection.md`, `reproducible-s3-Chapter_5_ModelSelection.txt`.
- Handbook Ch5 "Model selection, real-world data": overfitting reproduced (test AUC 0.838 at depth 6 vs train 0.886; AP peaks 0.049 at depth 4–5 vs train 0.18–0.28); per-class results — DT best-estimated depth 7/6/6, test 0.869/0.068/0.232, optimal 8/6/6 0.872/0.068/0.232; LR 0.816/0.054/0.211; RF 25/10 → 100/10, 0.912/0.08/0.227; XGB 100/0.1/6, 0.928/0.095/0.235, optimal CP@100 50 trees 0.249; grid times DT 1,617 s vs XGB 8,788 s — `research/texts/reproducible-Chapter_5_ModelValidationAndSelection_ModelSelection_RealWorldData.md` (lines ~100–310).
- Handbook Ch5 "Validation strategies": prequential folds; std across prequential folds AP 0.022 / CP@100 0.014 vs repeated hold-out 0.0065 / 0.0018; `prequentialSplit`, `card_precision_top_k_custom`, GridSearchCV(refit=False) — `research/texts/reproducible-s3-Chapter_5_ValidationStrategies.txt`.
- Handbook Ch6 summary (XGBoost most robust to imbalance; residual boosting upweights the minority) — `research/texts/reproducible-Chapter_6_ImbalancedLearning_Summary.md`.
- Baesens Ch4 "Ensemble methods" (bagging, AdaBoost α_t = ½ ln((1−ε)/ε), random forests, permutation importance VI; boosting's risk with noisy labels) and Ch4 p.136 (why trees are unstable, motivating ensembles) — `research/texts/fraudanalyti-s3-ch04a.txt`.
- Dal Pozzolo 2014 Sec. 7.2.1 (random forest beats NNET and SVM on AP, AUC, PrecisionRank; more training days help) — dossier summary.
- APATE Sec. 4.1 (RF 500 trees, each with all frauds and twice as many random non-frauds; RF AUC 0.986 vs NN 0.974 vs LR 0.972) — `research/texts/apatea-.txt`.
- Bergstra and Bengio 2012 via the handbook's Fig. 3 (grid vs random search over an important and an unimportant parameter) — recreate, do not crop.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader can train XGBoost (classical-ml) and has a forward-in-time validation with a delay block (module 2). What is new: on this data, validation picks the wrong depth for one metric and the right one for another; the grid for the ensemble costs hours; and after all that, a single tuned tree ties the ensemble on the number investigators care about. The constraint: the only labels available for choosing are a delay-block old, and the choice must hold on next week. Terms the newcomer does not have: "best-estimated vs optimal parameters", "random search", "prequential grid search" (the mechanics), "scale_pos_weight".

### Chain of sub-problems
1. **What model selection is** — Obvious attempt: pick the model with the best training score. Why it fails: training AUC reaches 1.0 for an unpruned tree and a random forest (module 2's set piece). Answer: a candidate set, a validation estimate per candidate on prequential folds with the deployment's geometry, the argmax; three numbers per candidate — the default's test score, the best-validation choice's test score, the truly optimal test score. Because: the gap between the last two is the cost of having to choose with old labels, and it can be measured on the simulator where the truth is known.
2. **The decision tree, three metrics, three answers** — depth grid 2…50: validation AUC picks 50 (its own estimate 0.823 against a test 0.797), AP picks 3, CP@100 picks 5; the test optimum is 4/4/5. Because: AUC integrates the low-recall region where pure leaves win, AP weights the high-precision region where they lose; the metric is a design choice that selects the model.
3. **Random forests** — bagging plus a random feature subset per split; performance plateaus at depth 10–20; more trees help less and cost linearly; 12 combinations took 587 s on one core. Because: the forest fixes the single tree's variance, and once variance is gone depth stops mattering.
4. **Boosting** — trees fitted in sequence on the previous residuals; depth 3–9, learning rate 0.1–0.3, 25–100 trees; 18 combinations, 1,251 s; past 50 trees AUC and AP rise slightly and CP@100 falls slightly. Because: residual boosting upweights the hard (minority) rows, which is why it is the most robust class under imbalance (module 2's finding, recalled).
5. **Paying less for the search** — Obvious attempt: a finer grid. Why it fails: the grid grows exponentially in the number of parameters and spends most draws on the parameter that does not matter. Answer: random search — 10 random combinations of the 18 gave the same scores in 690 s against 1,251 s. Because: a random draw visits as many distinct values of the important parameter as it has draws; a grid visits as many as it has levels.
6. **The real-data verdict** — the same procedure on Worldline weeks: the decision tree's best-estimated depth 7/6/6 gives 0.869 / 0.068 / 0.232 (optimal 8/6/6: 0.872 / 0.068 / 0.232); the random forest 0.912 / 0.080 / 0.227 at 100 trees, depth 10; XGBoost 0.928 / 0.095 / 0.235 at 100 trees, 0.1, depth 6 — but 50 trees would give CP@100 0.249, and validation did not find it. The grids cost 1,617 s for the tree and 8,788 s for XGBoost. Because: on card precision at 100 the tuned tree ties the ensemble at a hundredth of the compute; on AUC and AP the ensemble wins. Which number the bank buys is the question of module 2 again.
7. **How sure the choice is** — the spread across prequential folds (AP 0.022, CP@100 0.014) is three to eight times what repeated hold-out on one period reports (0.0065, 0.0018). Because: folds from different weeks see different fraud, and that is the uncertainty the deployment will meet.
8. **Defaults vs tuned** — XGBoost default AUC 0.859 vs tuned 0.869–0.872; logistic regression's default C already at the plateau. Because: tuning gains are small relative to model-class choice and metric choice. ★ Starred: permutation importance; class-balanced bootstraps per tree (all frauds plus twice as many genuine); boosting's sensitivity to noisy labels.

### Set pieces and worked examples to recreate
- The depth-selection triplet on the simulator: best-estimated 50/3/5, optimal 4/4/5; validation AUC 0.823 vs test 0.797 (Handbook Ch5 DT).
- The simulator comparison table LR / RF / XGB / DT by AUC / AP / CP@100: 0.868/0.623/0.297, 0.87/0.678/0.299, 0.869/0.687/0.303, 0.797/0.579/0.284 (Handbook Ch5 comparison).
- Grid vs random search: 1,251 s vs 690 s, same scores (Handbook Ch5 random search).
- Real data: DT 0.869/0.068/0.232 (1,617 s), RF 0.912/0.080/0.227, XGB 0.928/0.095/0.235 with 50-tree optimum 0.249 (8,788 s) (Handbook Ch5 RWD).
- Overfitting on real data: test AUC peaks 0.838 at depth 6 vs train 0.886; AP 0.049 at depth 4–5 vs train 0.18–0.28 (Handbook Ch5 RWD).
- Prequential vs repeated hold-out spreads: 0.022/0.014 vs 0.0065/0.0018 (Handbook Ch5 Validation strategies).
- Random forest beats NNET and SVM on 422 days (Dal Pozzolo 2014 Sec. 7.2.1); RF 0.986 vs NN 0.974 vs LR 0.972 AUC (APATE Table 3).

### Pitfalls and terms to define
- "Best-estimated" means chosen by validation; "optimal" means best on the test, known only in hindsight; a reader will swap them.
- The grids differ by model class; comparing compute across classes compares the grids chosen, say so.
- scikit-learn's grid search with a day-aware scorer needs the transactions frame passed through (`card_precision_top_k_custom`); mention as implementation, not theory.
- "Learning rate" in boosting is the shrinkage per tree, not SGD's step; define.
- Do not reopen the imbalance debate; recall module 2's result in one clause.
- Report ± std with every number; the differences between RF and XGB on CP@100 are inside the spread.

### Recalled, not re-taught
- Trees, random forests, gradient boosting, XGBoost (classical-ml): recalled by name; the lesson explains only what boosting does to the minority class.
- Prequential folds, the delay block, the overfitting set piece (`delayed-labels-prequential`): one clause each with <Ref>.
- Imbalance ratio and the robustness of XGBoost (`imbalance-techniques-revisited`): one clause.

## FIGURE PLAN
- draw: key image — three panels AUC / AP / CP@100 against tree depth on the simulator, validation and test curves, the validation-selected depth as a dashed line in each panel — showing 50, 3, 5 (inspired by the handbook's three-panel plots; computed).
- draw: the triplet bar chart per metric: default, best-estimated, optimal, for DT / LR / RF / XGB with error bars (inspired by the handbook's grouped bars).
- draw: `<FigureSequence>` 3 frames of the selection procedure: candidates listed → each scored on four prequential folds shifted back → the argmax picked and then scored on the test week.
- draw: grid vs random search as two scatter panels over an important and an unimportant parameter with the marginal curves (recreate the Bergstra–Bengio idea; the handbook's copy was removed from the image pool).
- draw: compute vs CP@100 on real data: a dot per model class at (grid seconds, CP@100) — DT (1,617, 0.232), XGB (8,788, 0.235 selected / 0.249 optimal), RF, LR; single `<Figure>`.
- draw: the spread across folds as box plots: prequential vs repeated hold-out for AP and CP@100; single `<Figure>`.
- draw: boosting on residuals as a 3-frame `<FigureSequence>`: the first tree, the residuals it leaves (frauds large), the second tree fitted on them.

## EXERCISE PLAN
1. [warm-up] Given validation scores for depths {2, 4, 6, 8, 50} under AUC and AP, write the best-estimated triplet and name the optimum from the supplied test row.
2. [boundary probe] Set the learning rate to 1.0 with 100 trees and to 0.01 with 25 trees; predict from the residual picture which one underfits and which overfits, then check on the simulator.
3. [claim to refute] "XGBoost's 100-tree configuration is the right one to ship because validation chose it on all three metrics." Refute with the 50-tree CP@100 of 0.249 vs 0.235: the step that fails is that a validation argmax is an estimate with a spread of 0.04.
4. [derivation skipped] Show that random search with n draws over k parameters visits up to n distinct values of each parameter, while a grid of n points visits n^{1/k}; state the n at which the two coincide for k = 3.
5. [research-shaped] Reproduce the prequential-vs-repeated-hold-out spread on the simulator for a depth-5 tree (four folds each) and report both standard deviations of AP.
6. [mixed review] Recompute the tree's CP@100 with and without known-card removal (`delayed-labels-prequential`) at the selected depth; which selection changes.
7. FORWARD → `neural-tabular-detectors`: train the same XGBoost on the 14 features with and without standard scaling and log1p on the amount; the scores do not move — the reader has the baseline the next lesson's network must match, and the first reason it is harder to train.

## ARC
- Spine step 4 "Supervised detectors compared": "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
- Inherits: prequential folds and the overfitting set piece (`delayed-labels-prequential`); the imbalance verdict (`imbalance-techniques-revisited`); the feature matrix (module 3); trees and boosting (classical-ml).
- Contributes: the selection procedure, the best-estimated/optimal triplet, random search, the compute-vs-precision verdict, the honest spread.
- Hands off: the tuned tree and ensemble to `neural-tabular-detectors` (the baseline) and `worldline-model-comparison`; the random-search checkpoint to `scorecard-vs-gbm-lab`; the metric-dependent selection to `drift-strategies-on-worldline` and `model-risk-monitoring`.
