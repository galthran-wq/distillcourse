# Tree ensembles and prequential model selection — research brief

Lesson: `gbm-model-selection` (module: supervised, core, planned). NEW.
Goal: Evaluate decision trees, random forests and XGBoost under prequential selection on simulated and real card data, and explain why a tuned tree matches the boosted ensemble on card precision at a hundredth of the cost.
Prerequisite from classical-ml (gradient-boosting, xgboost, bagging-random-forests): the algorithms themselves — NOT re-taught; one recall paragraph each.

## Sources
- Handbook Ch5 Model selection (primary): argmax over M candidates of validation performance; models of increasing complexity; bias/variance; the summary triplet (best-estimated params → their test performance; optimal params on test); decision tree: AUC picks depth 50, AP 3, CP@100 5, optimal 4/4/5; validation AUC 0.823 vs test 0.797; model class ranking on simulated data (LR 0.868/0.623/0.297; RF 0.87/0.678/0.299; XGB 0.869/0.687/0.303; DT 0.797/0.579/0.284 — gap clearest in AP); RF plateaus at depth 10–20, gains shrink with trees, time linear in trees, 12 combos 587 s; XGBoost 18 combos 1,251 s, past 50 trees helps AUC/AP slightly and lowers CP@100; random search 10 of 18 in 690 s with the same scores (Bergstra & Bengio 2012: grid cost exponential, random explores important parameters at more values); defaults vs tuned: XGBoost default AUC 0.859 vs tuned 0.869–0.872; LR default already at plateau; model_selection_performances defaults (DT depth 50, LR C = 1, RF 100/50, XGB 100/0.1/3); prequential std AP ~0.022, CP@100 ~0.014.
- Handbook Ch5 RWD: overfitting on real data (test AUC 0.838 at depth 6 vs train 0.886; AP test 0.049 peak at depth 4–5 vs train 0.18–0.28); results (test, optimal): DT 0.869/0.068/0.232 (depth 6–8); LR 0.816/0.054/0.211 (regularisation irrelevant); RF 0.912/0.08/0.227 (100 trees, depth 10); XGB 0.928/0.095/0.235 (100 trees, lr 0.1, depth 6; CP@100 optimum 0.249 at 50 trees); grid times DT ~1,617 s vs XGB ~8,788 s; "a tuned decision tree matches XGBoost on CP@100 at 1–2 orders of magnitude lower cost"; optimal depth higher on real data (6–9) — more complex feature–label relationships; depth-2 and depth-50 match Ch3's baseline (reproducibility).
- Handbook Ch6 summary and Ch6.4: XGBoost most robust to imbalance (residual-based boosting upweights the minority); weighted XGBoost optimal weight 1 (simulated), 1 → 5 helps on real data; balanced RF 0.925/0.093/0.254 on real data.
- Dal Pozzolo 2014 Sec. 7.2.1: RF clearly beats NNET and SVM on AP, AUC, PrecisionRank; more training days helps (30/60/90).
- Dal Pozzolo 2018 Sec. IV-A and V-A: RF as the favoured learner; balanced bootstrap undersampling inside RF.
- APATE Sec. 4.1: RF AUC 0.986 vs NN 0.974 vs LR 0.972; RF with 500 trees each on all frauds + 2× random genuine (Chen et al. 2004); at 1% FPR RF recall 87.4%.
- Baesens Ch4 pp.164–168: RF ranks among the best; permutation importance; p.166 boosting's noisy-label risk (upweights hard examples, which in fraud are often mislabelled) — the one theoretical caution.
- Altman Table 2: GFP + XGBoost / LightGBM beat GNNs on AMLworld (preview for module 6).
- HKU A2: XGB best round 20 under 5-fold CV, train AUC 0.997 vs test 0.854; tuning adds almost nothing; KNN k = 1 → 3 (0.706 → 0.750) — a student's artifact confirming "selection matters more than tuning".

## Key points
1. Model selection as a procedure: candidates of increasing complexity; validation performance per metric on prequential folds; the triplet default/best-estimated/optimal; the decision tree's three different "best depths" — the metric sets the model.
2. The real-data finding: a tuned tree (0.232) vs XGBoost (0.235 selected, 0.249 optimal) on CP@100, at 1,617 s vs 8,788 s; selection missing the optimum (100 vs 50 trees); LR worst on everything and fastest. The dry conclusion: on this problem, selection beats model choice at the operational metric; model class matters on AUC/AP.
3. Where the ensemble earns its place: AP on simulated data (0.687 vs 0.579), AUC on real (0.928 vs 0.869); where it does not: CP@100. Attribute: CP@100 is set by the top of the ranking, which the tree's terminal-risk × burst split already orders.
4. Random search: cost arithmetic (grid exponential), the 10-of-18 result, why random explores important dimensions better; the prequential variance (std 0.022) as the resolution limit of any selection — differences below it are noise.
5. Robustness to imbalance: XGBoost's implicit upweighting; scale_pos_weight's effect on real data (1 → 5 helps, more hurts); balanced bootstraps in RF (APATE's 2×, Dal Pozzolo's balanced bagging) — the practical recipes.
6. The caution: boosting and label noise (Baesens); delayed/incomplete labels make the "hard examples" suspect — forward to label-maturation.
7. ★ Starred: compute budgets (587/1,251/8,788 s) and what they buy; HKU's KNN as a floor.

## Set pieces & gems
- Depth 50 / 3 / 5 selected vs 4 / 4 / 5 optimal.
- XGBoost 0.235 selected vs 0.249 optimal — selection missing the optimum.
- Tuned DT 0.232 at 1/5 the compute (1,617 vs 8,788 s).
- Random search 10 of 18 in 690 s — same scores.
- Real-data optimal depth 6–9 vs simulator 4–5.
- XGBoost default 0.859 vs tuned 0.869–0.872: tuning gain small relative to model-class choice (on AUC).

## Pitfalls
- No re-derivation of boosting/forests; Refs to classical-ml and one sentence each.
- Keep "best-estimated" (chosen on validation) and "optimal" (chosen on test — an oracle, not a procedure) distinct every time.
- Compute times are the handbook's machine; quote as ratios.

## FIGURE PLAN
- draw: `<FigureSequence>` (3 frames): three-panel validation-vs-test curves vs depth (AUC, AP, CP@100) with the validation-selected depth as a dashed line appearing per metric — one metric per frame. Inspired by Handbook Ch5's plots; computed on our simulator run. Key image.
- draw: Grouped bars per metric (default / best-estimated / optimal) for DT, LR, RF, XGB on real data with error bars — from Handbook Ch5 RWD numbers (quoted).
- draw: Grid vs random search on two parameters, one important and one not: the marginal coverage of each (Bergstra & Bengio's schematic idea, redrawn).
- draw: Compute cost vs CP@100 for the four model classes as a scatter — the "pay 5× for +0.003" picture. From Ch5 RWD.
- draw: The prequential ±2σ band (0.022 on AP) drawn over the model-class bars — which gaps are inside the noise. Computed.
- draw: Train vs test AP vs depth on real data (test peaking at 4–5, train rising to 0.28) as two curves — from Ch5 RWD numbers.

## EXERCISE PLAN
1. Warm-up: from the handbook's RWD numbers compute the CP@100 gap between tuned DT and XGBoost per second of training time.
2. Boundary probe: depth = 1 (a stump) and depth = ∞ — what each does to AUC vs AP on the simulator (pure leaves; the DT∞ case from the benchmark), and why CP@100 is nearly flat across the sweep.
3. Claim to refute: "Validation chose 100 trees for XGBoost, so 100 trees is the right production setting." Refute with the optimal-at-50 finding and the fold std: the difference is below the selection's resolution; name the triplet column that would have shown it.
4. Derivation the lesson skipped: for a grid of d parameters with v values each, the grid is v^d fits; show random search with n draws covers each important parameter's range with n distinct values; compute both for d = 4, v = 3, n = 10.
5. Research-shaped: reproduce the depth selection on the simulator with the module-2 harness: report the AUC-, AP- and CP@100-selected depths and the three test scores at each.
6. FORWARD (E7): train XGBoost on the raw features without the aggregates and with them; the reader sees the gap (features > models) and then asks whether a model could learn the aggregates from raw sequences → lands on `neural-tabular-detectors` (representation learning) and `sequence-models-for-transactions`.
7. Mixed review (E3): the scorecard (scorecards-woe) and the tuned tree on the same folds — report AP and CP@100, and savings (example-dependent-cost) with C_a = 20; which wins on which.

## ARC
- Inherits: the harness and selection triplet (delayed-labels-prequential); the imbalance findings (imbalance-techniques-revisited); features (module 3); classical-ml's ensembles.
- Contributes: the model-selection result — tuned tree ≈ XGBoost at CP@100, selection beats class, random search, robustness recipes.
- Hands off: the neural detector (neural-tabular-detectors); the eight-model table (worldline-model-comparison); the lab; the drift lesson's update cadence (concept-drift uses RF).
- Spine step 4: supervised detectors compared.
