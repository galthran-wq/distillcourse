# Eight models on Worldline data: the metric-dependent ranking — research brief (module 4 APPLICATION)

Lesson: `worldline-model-comparison` (module: supervised, core, planned). NEW. Module-final application (L16): the handbook's real-data model-selection and global comparison read as one artifact.
Goal: Evaluate the handbook's eight-model comparison on real card data and attribute each ranking to the metric, the validation design and the compute spent.

## Sources
- Handbook Ch5 Model selection — Real-world data (primary): overfitting reproduced (test AUC 0.838 at depth 6 vs train 0.886; AP test 0.049 peak at depth 4–5 vs train 0.18–0.28); prequential results (test, optimal): DT 0.869/0.068/0.232 (depth 6–8); LR 0.816/0.054/0.211; RF 0.912/0.08/0.227 (100 trees, depth 10); XGB 0.928/0.095/0.235 (100/0.1/6; CP@100 0.249 at 50 trees); validation estimates track test for DT; model selection can miss the optimum; tuned DT matches XGBoost on CP@100 at 1–2 orders lower cost; LR fastest and worst; optimal depth 6–9 on real vs simulated; depth-2 and depth-50 results match Ch3 (reproducibility as design).
- Handbook Ch7.5 Real-world data (primary): FFNN 0.894/0.084/0.236; CNN 0.882/0.093/0.221; LSTM 0.892/0.104/0.220; LSTM+Attention 0.898/0.105/0.232; the global comparison table (8 models × 3 metrics); sequential models beat tree ensembles on AP, tie on CP@100, lose on AUC; sequential beat FFNN (history carries signal); attention adds little; best LSTM from the slowest schedule (lr 1e-4, batch 256, fewest epochs); hyperparameter sweeps with interdependent sweet spots (4 folds).
- Handbook Ch7.6 summary: FFNN for tabular; AE reconstruction error as extra feature; CNN/LSTM/attention build contextual features from the preceding sequence keyed by CustomerID; NN tuning costly but competitive.
- Handbook Ch6.5 for the balanced variants on real data (Balanced RF 0.925/0.093/0.254; Weighted XGB 0.928/0.097/0.249) — the full leaderboard has these too.
- Handbook Ch3 RWD / Ch4.5: the data (400k/day, 0.25%, ~300 cards/day); the −1 missing-value convention; the feature set (14 baseline features on real data).
- Jurgovsky 2018 Tables 4–5 and Sec. 5.2 (the sibling result on a different Worldline extract): LSTM vs RF by channel; TP-set Jaccard 25%/35% — models catch different frauds (forward to module 7, cited here as the "why combine" hint).
- Dal Pozzolo 2014 Sec. 7.2.1 and APATE Sec. 4.1: RF > NN > LR on their Worldline extracts — three papers, one ordering on AUC.

## Key points
1. The artifact: one table, eight rows (DT, LR, RF, XGB, FFNN, CNN, LSTM, LSTM+Attn), three columns (AUC, AP, CP@100), four prequential folds on 2018 Belgian e-commerce data with the 14 baseline features (sequence models on the preceding history). Quote it whole.
2. Three leaderboards: AUC — XGB 0.928 > RF 0.912 > LSTM+Attn 0.898 > FFNN 0.894 > …; AP — LSTM+Attn 0.105 > LSTM 0.104 > XGB 0.095 > CNN 0.093 > …; CP@100 — FFNN 0.236 ≈ XGB 0.235 ≈ DT 0.232 ≈ LSTM+Attn 0.232 > RF 0.227 > CNN/LSTM 0.22. Each attributed: AUC rewards global ranking; AP the high-precision region where sequence context helps; CP@100 the top-100 cards, which every decent model orders alike.
3. Overfitting on real data with the depth curves: optimal depth higher (6–9) because feature–label relations are more complex; validation tracks test for DT; selection misses the optimum for XGBoost (100 vs 50 trees).
4. Compute: the grids' cost (DT 1,617 s, XGB 8,788 s, FFNN 7,350 s on the simulator, CNN 26,905 s / LSTM 14,751 s with n_jobs = 10) against the gains — the dry economics of model choice.
5. The balanced variants (Ch6.5) and what they add on real data (Balanced RF 0.254 CP@100 — the best single number in the whole table) — rebalancing inside the ensemble, not of the data.
6. Why combine: Jurgovsky's 25% TP overlap between RF and LSTM; the handbook's stacking-diversity argument; the practical stack is tree + sequence + rules (module 11).
7. Departures (L16): complete labels in the replay; the 14 features are the handbook's not Worldline's production set; 4 folds; the best LSTM "from the slowest convergence, hinting even less training helps"; static figures, no re-run.

## Set pieces & gems
- The 8 × 3 table itself.
- Three different winners.
- Balanced RF 0.254 — best CP@100 of all.
- "Best LSTM from the slowest convergence."
- Jurgovsky's 25% Jaccard.
- Depth-2/depth-50 matching Ch3 — reproducibility as a design feature.

## Pitfalls
- Sequence models are quoted here only as rows of the table; their construction is module 7 — one sentence and a forward Ref.
- Keep "optimal" (oracle on test) and "selected" straight.
- The AP numbers (0.05–0.10) look like failure; frame them against random AP = 0.0025 (lift 20–40×) every time they appear.

## FIGURE PLAN
- draw: The 8 × 3 table as three ranked dot columns (one per metric) with lines joining each model across columns — the three-leaderboard figure; key image. From Ch7.5 numbers.
- draw: Train vs test AUC and AP vs depth on real data (test AUC peaking at 6, AP at 4–5, train rising to 50) as two panels — from Ch5 RWD numbers.
- draw: Compute seconds vs CP@100 scatter for the eight models (log x) — the cost of the last 0.01. From the handbook's reported times (simulator times for the nets, marked as such).
- draw: Lift over random: AP bars for the eight models drawn as multiples of 0.0025 — the "0.05 is 20×" reframing.
- draw: Jurgovsky's Jaccard heat map idea redrawn as a 2 × 2 schematic (RF∩RF high, RF∩LSTM low) with the numbers 50.8 / 37.8 / 25.2 — inspired by sequenceclas-fig5-jaccard (that image is sourced in module 7; here a schematic).
- draw: `<FigureSequence>` (3 frames): the top-100 cards of one day under XGB, under LSTM, under DT — the overlap of the three sets shrinking as the frames add a model (the CP@100 tie explained by shared top cards). Computed on our simulator run as an illustration (stated as simulator).

## EXERCISE PLAN
1. Warm-up: compute the lift over random AP (0.0025) and over random CP@100 (≈0.0025) for each of the eight models.
2. Boundary probe: a model with perfect ranking of the top 100 cards and random order below — compute its CP@100, its AP (approximately, given ~1,000 frauds/day) and its AUC; show why CP@100 saturates while AUC and AP do not.
3. Claim to refute: "LSTM+Attention has the best AP, so it should replace XGBoost in production." Refute on compute (16,736 s grid), on CP@100 (tie), on the TP-overlap argument (combine instead) and on operational constraints (module 11); name the metric under which the claim is true and why it is not the operational one.
4. Research-shaped: reproduce the simulator benchmark's FFNN row with the module-2 harness and early stopping; report the triplet and whether it ties XGBoost within the fold std.
5. Derivation the lesson skipped: show that if two models agree on the set of top-k cards but order them differently, their CP@k are equal — and that AP can still differ; conclude what CP@k cannot see.
6. FORWARD (E7): take the three CP@100 winners and compute, on the simulator week, the Jaccard overlap of their true-positive sets at recall 0.2 — the reader finds models catch different frauds and asks how a model would use the sequence of a card's transactions → lands on `sequence-models-for-transactions` (and the stacking idea).
7. Mixed review (E3): score the scorecard (scorecards-woe) on the same simulator folds and place it in the table with the harness; then apply BMR with C_a = 20 to the top two models and compare savings (example-dependent-cost).

## ARC
- Inherits: the three supervised detectors (this module), selection (gbm-model-selection), the harness (module 2).
- Contributes: the module's claim cashed out on real data — three leaderboards from one table, each explained.
- Hands off: the lab (next); sequence models as rows → module 7; combining models → module 11; monitoring the chosen model → module 9.
- Spine step 4: supervised detectors compared.

## APPLICATION (L16)
- Artifact: the handbook's Chapter 5 real-world model-selection notebooks and Chapter 7.5's global comparison on Worldline's 2018 Belgian e-commerce data (static results; data confidential).
- Module results used: the selection triplet and random search (gbm-model-selection); the scorecard's constraints as the reason LR/scorecards sit last (scorecards-woe); early stopping, scaling and the operational reasons for nets (neural-tabular-detectors); AP/CP@100 readings and the fold std (module 2).
- Departures from the idealisation: complete labels; the handbook's 14 features rather than a production set; 4 folds; figures only (no re-run); the sequence models' construction deferred to module 7.
