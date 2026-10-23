# Imbalance techniques under honest metrics and the undersampling correction — research brief

Lesson: `imbalance-techniques-revisited` (module: rare-positives, core, planned). NEW.
Goal: Derive the posterior bias introduced by undersampling and its inverse correction, and evaluate when cost-sensitive learning, resampling and balanced ensembles help under AP and card precision.
Prerequisite from classical-ml (imbalance-leakage): the playbook order (metric, class weights, resampling, threshold moving), SMOTE mechanics, "resampling distorts calibration — the prior-correction formula, derived". This lesson EXTENDS that formula to the β form and tests the playbook under AP/CP@k.

## Sources
- Dal Pozzolo 2015 (primary for the derivation): Sec. III-A selection variable s with p(s|y,x) = p(s|y), p(s=1|+) = 1, β = p(s=1|−): p_s = p/(p + β(1−p)) (Eq. 3); Eq. 4/9 inverse p′ = βp_s/(βp_s − p_s + 1), monotone so ranking unchanged; Table I (1,000 positives in 10,000: β = 0.11 discards 88.9% of negatives for 50/50; β = 0.5 → 5,500 rows, 81.8% negative); Sec. III-B bias largest when classes overlap (Fig 1, δ = w⁺ − w⁻ near 0); III-D two Gaussians μ = 3 vs 15, σ = 3, 10% positives (Figs 2–4: p′ overlays p); IV-A Bayes minimum-risk threshold τ = (l10 − l00)/((l10 − l00) + (l01 − l11)) → τ = π⁺ with prior-based costs; IV-B τ_s = π_s⁺ (0.5 if balanced), τ′ = βτ_s/((β−1)τ_s + 1) = π⁺ — same decisions; Table V: AUC and G-mean rank sums identical for p_s and p′, Brier: p best, p′ second, p_s worst (p vs p′ not significantly different); Appendix: equivalence to Saerens et al. and Elkan; credit-card data (Figs 5–6): undersampling improves AUC yet worsens Brier, p′ fixes it; conclusion: report p′, not p_s.
- Handbook Ch6 in full: IR = |X1|/|X0|; cost matrix with FN 1, FP = IR (Fig 1–2); class_weight None/balanced/{0:c,1:c}; toy (5,000 points, 95/5, class_sep 0.5): weighting raises balanced accuracy DT 0.786 → 0.898, LR 0.641 → 0.899 while AUC/AP drop (DT) or stay (LR); transaction data (919,767 tx, 8,195 frauds): DT best AUC and CP@100 at weight 0.01 but worst AP (0.537 vs 0.600 at 1.0); LR AP 0.571 at 0.01 vs 0.623 at 1; Ch6.2 summary: boundary shifted toward the minority → many FPs → AP falls. Resampling taxonomy (ROS, SMOTE, ADASYN, RUS, NearMiss, Tomek, ENN, centroids, hybrids); toy results (DT depth 5; baseline 0.906/0.528/0.786; ROS .88/.456/.888; SMOTE .913/.499/.91; RUS .913/.408/.896; ENN removes only ~212 of 3,784; SMOTE(0.5)+RUS(1.0) 1,892/1,892); transaction data (DT depth 5): baseline .81/.600/.284; SMOTE .845/.573/.289; RUS .83/.594/.277; SMOTE+RUS .847/.544/.288 — all raise AUC, all lower AP; samplers inside the prequential pipeline (imblearn Pipeline). Ensembles: bagging 63.2% unique per replica; balanced bagging / balanced RF rebalance each bootstrap by RUS; XGBoost only scale_pos_weight; toy: balanced bagging BA 0.748 → 0.92 with AUC/AP unchanged; simulated test: Bagging .856/.678/.293; Balanced bagging .879/.680/.305; RF .870/.678/.299; Balanced RF .872/.677/.302; XGB .872/.687/.302; Weighted XGB .872/.687/.300; optimal class weight for XGB is 1; optimal IR depends on metric (AP at natural 0.02, AUC near 0.5, CP@100 near 0.1); authors' conclusion: balanced-bagging gains from diversity, not rebalancing; real data (Ch6.5): Bagging .912/.072/.209; Balanced bagging .919/.086/.248; RF .912/.080/.227; Balanced RF .925/.093/.254; XGB .928/.095/.235; Weighted XGB .928/.097/.249; best IR for AP/CP@100 is the lowest (no rebalancing); weighted XGB helps only 1 → 5; class weighting/SMOTE/RUS on real DT: AUC .869 → .881–.892 but AP and CP@100 fall, SMOTE+RUS worst (AP .045, CP .119). Summary: XGBoost most robust, residual boosting upweights the minority implicitly.
- Dal Pozzolo 2014 Sec. 3.2, 7.2.4: undersampling to 50/50 discards 99.6% of genuine per chunk; EasyEnsemble repairs the variance with 5 undersamples; SMOTE and EasyEnsemble beat plain undersampling; the best balancer depends on the update strategy.
- Bahnsen Sec. 4.3: sampling did not improve savings (distorts the cost distribution) — one line, forward.
- Baesens Ch4 pp.190–198 for the scorecard tradition: avoid fully balanced samples, step odds 5 points at a time until AUC stagnates; 80/20 industry practice; Saerens posterior adjustment Table 4.13 (resampled 0.5 → 0.039 on a 1% prior) — the same formula in its prior-ratio form.
- Lucas & Jurgovsky Sec. 2 as the map (SMOTE/ADASYN/Borderline-SMOTE, EasyEnsemble, UnderBagging, SMOTEboost).

## Key points
1. Derivation in full: Bayes with the selection variable → p_s; the inverse; monotonicity (so AUC, AP are unchanged by the correction — only calibration and any cost-based threshold change); the matched-threshold identity τ′ = π⁺; the overlap dependence (the bias is a function of p, maximal at p ≈ ½ in the undersampled scale).
2. Worked arithmetic: Table I of the paper; the two-Gaussian pictures; the Brier ranking p > p′ ≫ p_s.
3. Cost-sensitive learning on the transaction data: class weight moves the boundary toward the minority; AUC and CP@100 can rise while AP falls; "costs are a hyperparameter" and the IR heuristic's limits.
4. Resampling: same pattern — AUC up, AP down, CP@100 mixed; SMOTE's interpolation across overlapping classes; samplers inside the fold (the leakage trap from classical-ml, now in the prequential pipeline).
5. Balanced ensembles: the gains are diversity; XGBoost robust; on real data the best IR is "do nothing" for AP and CP@100.
6. The verdict (Handbook Ch6 summary): the literature's gains from rebalancing are AUC/balanced-accuracy gains; under the operational metrics the playbook's first step (metric) is the only one that always applies. Dal Pozzolo 2014's caveat: in streams the balancer interacts with the update strategy (forward to drift-strategies-on-worldline).
7. ★ Starred: Saerens' general prior-shift form and its equivalence; EasyEnsemble; the credit-scoring optimal-odds search.

## Set pieces & gems
- The one-line class_weight change that moves LR balanced accuracy 0.641 → 0.899 with AUC and AP identical — threshold metric moves, ranking metrics do not.
- Table I's β arithmetic; the μ = 3 vs 15 Gaussians.
- "AUC up in all, AP down in all" on transactions (Baseline vs SMOTE vs RUS vs Combined).
- Balanced bagging toy BA .748 → .92 with AP flat.
- 99.6% of genuine discarded at 50/50 — EasyEnsemble as the variance repair.
- The XGBoost implicit-cost argument.

## Pitfalls
- The β derivation assumes train and test share the same prior; the paper notes variance of undersampled estimates is unaddressed — say both.
- Keep AUC/AP/CP@100 triples exact and sourced; do not round the reversals away.
- Do not re-derive SMOTE (classical-ml); one sentence and a Ref.

## FIGURE PLAN
- draw: `<FigureSequence>` (3 frames) of the selection model: (1) full data with prior π, (2) negatives thinned by β, the prior rises, (3) the posterior curve p_s above p with the inverse arrow back. Inspired by Dal Pozzolo 2015 Figs 2–4 (recreated with our own Gaussians). Key image.
- draw: p_s − p as a function of p for β ∈ {1, 0.5, 0.1, 0.01} — the bias curve peaking at mid probabilities. Computed from Eq. 3.
- draw: Decision-surface triptych on the 95/5 toy: baseline DT, class-weighted DT, RUS DT — three near-identical panels with the boundary's shift highlighted. Inspired by Handbook Ch6.2–6.3 triptychs, computed on our own make_classification-style data.
- draw: Metric-vs-technique dot plot for the transaction data (Baseline, class weight, SMOTE, RUS, SMOTE+RUS; three metrics) with arrows up for AUC and down for AP — the reversal made visible. From Handbook Ch6.3/6.5 numbers.
- draw: Performance vs imbalance ratio for balanced bagging: three panels (AUC peaks near 0.5, AP at the natural ratio, CP@100 near 0.1). Inspired by Handbook Ch6.4 curves, computed on our own simulator run.
- draw: Brier score vs β for p, p′, p_s as three curves (the paper's Fig 6 idea), computed on our two-Gaussian toy.

## EXERCISE PLAN
1. Warm-up: with 492 positives in 284,807 rows, compute β for a 50/50 undersample and the number of negatives discarded; then p′ for p_s ∈ {0.5, 0.9}.
2. Derivation the lesson skipped: derive the matched threshold τ′ from the odds relation and show it equals π⁺ when τ_s = π_s⁺; then show that for a general cost ratio the BMR threshold on p′ and on p_s give identical decisions.
3. Boundary probe: β → 0 (keep almost no negatives): what p_s tends to for every x, what p′ does with it, and why the variance of the estimate — not the formula — is what breaks.
4. Claim to refute: "Rebalancing improved AUC from 0.81 to 0.85 on the transaction data, so the rebalanced model will catch more fraud at the investigator's budget." Refute with the CP@100 and AP columns, naming the region of the ROC the gain came from.
5. Research-shaped: reproduce the toy — 5,000 points, 95/5, class_sep 0.5, decision tree depth 5 — baseline vs class weight vs RUS, report AUC/AP/balanced accuracy and compare with the handbook's table within noise.
6. FORWARD (E7): on the lab's simulator week, apply the BMR rule with constant costs to p_s and to p′ and count the alerts each produces; then replace the constant FN cost by the amount and watch the two decision sets diverge → lands on `example-dependent-cost`.
7. Mixed review (E3): place the sampler inside vs outside a prequential fold (delayed-labels-prequential) and state which rows of the delay block an outside sampler touches.

## ARC
- Inherits: classical-ml's playbook and prior-correction; the honest metrics and folds (alert-budget-metrics, delayed-labels-prequential).
- Contributes: the β correction and matched threshold; the finding that rebalancing buys AUC and costs AP/CP@k; XGBoost's robustness; samplers inside the fold.
- Hands off: amount-dependent decisions (example-dependent-cost); the benchmark (ulb-handbook-benchmark); balancer × strategy in streams (drift-strategies-on-worldline); calibration monitoring (model-risk-monitoring).
- Spine step 2: rare positives, honest metrics.
