# Eight models on Worldline data: the metric-dependent ranking — research brief

Lesson: `worldline-model-comparison` (module: supervised, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Evaluate the eight-model comparison on real card data and attribute each leaderboard to the metric, the validation design and the compute spent
Opening (verbatim, the lesson must start with it): Eight model families are trained and tuned on the same weeks of real card payments and scored by three metrics. The random forest, the attention-LSTM and a depth-six tree each top one of the three leaderboards. What in the validation design, the metrics and the compute spent produces three different winners from one experiment?

## Sources to consult
- Handbook Ch7 "Real-world data" (7.5): FFNN sweeps (0.894±0.01 / 0.084±0.02 / 0.236; optimal 0.898 / 0.085); CNN 0.882±0.01 / 0.093±0.02 / 0.221±0.03; LSTM 0.892 / 0.104±0.03 / 0.22±0.03; LSTM+attention validation 0.89 / 0.105 / 0.243, test 0.898±0.01 / 0.105±0.02 / 0.232±0.03; the global table with DT 0.869 / 0.068 / 0.232, LR 0.816 / 0.054 / 0.211, RF 0.912 / 0.080 / 0.227, XGB 0.928 / 0.095 / 0.235; "sequential models are better than the regular feed-forward network … attention brings a little value"; the best LSTM from the slowest convergence (lr 1e-4, batch 256, fewest epochs) — `research/texts/reproducible-Chapter_7_DeepLearning_RealWorldData.md`.
- Handbook Ch5 "Model selection, real-world data": overfitting curves, prequential selection per class, grid times (DT 1,617 s, XGB 8,788 s), the 50-tree CP@100 optimum 0.249 missed — `research/texts/reproducible-Chapter_5_ModelValidationAndSelection_ModelSelection_RealWorldData.md`.
- Handbook Ch3 Baseline_RealWorldData and Ch4 Assessment_RealWorldData: the data (~400,000 tx/day, ~1,000 frauds/day, 0.25%, ~300 compromised cards/day, random CP@100 ≈ 0.0025; −1 read as missing), PR curves squashed to the floor (AP 0.002 random, LR 0.035, DT2 0.024, RF 0.015, XGB 0.035 at baseline settings), daily detected cards bounded by k — `research/texts/reproducible-Chapter_3_GettingStarted_Baseline_RealWorldData.md`, `reproducible-Chapter_4_PerformanceMetrics_Assessment_RealWorldData.md`.
- Handbook Ch7 "Sequential modeling" (prequential grid-search costs CNN 26,905 s, LSTM 14,751 s, LSTM+attn 16,736 s with n_jobs = 10; the simulator benchmark where sequence models only tie) — `research/texts/reproducible-Chapter_7_DeepLearning_SequentialModeling.md` (shard 6 read to 130,000 of 146,768 chars — the tail is unread; flag any number taken from it).
- Dal Pozzolo 2018 Sec. VI-C Table III (the best top-k ranker is not the best global ranker: F has the worst AUC 0.87 and near-best P_k; R has the best AUC 0.96 and is mid-table on P_k) — `research/texts/creditcard-tnnls.txt`.
- Jurgovsky 2018 Sec. 5.2 (RF and LSTM catch different frauds: 25% Jaccard of true positives on card-present data) — `research/texts/staged-jurgovsky2018-sequence-classification.txt`.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has three detectors (scorecard/logistic, tree ensembles, feed-forward network) and three metrics. The application puts eight families on the same real weeks under the same prequential procedure and reads one table. The newcomer expects one winner; the table has three, and the lesson's job is to make each winner follow from something the module established. The three columns were chosen in module 2; the sequence models (CNN, LSTM, attention) are named here only as rows of the table — what they are is module 7's lesson, and the reader is told that. Terms the newcomer does not have: "LSTM", "attention" (named, not explained), "global table".

### Chain of sub-problems
1. **The experiment** — Obvious attempt: compare papers. Why it fails: different data, different splits, different metrics. Answer: one dataset (Worldline, 2018, Belgian e-commerce, ~400k payments a day, 0.25% fraud), one validation (four prequential folds with a one-week delay), one feature matrix (the 14 features; raw -1 read as missing), one grid per class, three metrics with ± std. Because: a leaderboard is only a leaderboard under one referee.
2. **Leaderboard one, ROC-AUC** — XGBoost 0.928, RF 0.912, LSTM+attention 0.898, FFNN 0.894, LSTM 0.892, CNN 0.882, DT 0.869, LR 0.816. Because: AUC rewards ranking over the whole stream, where ensembles of trees separate the easy mass; the module-2 argument that most of this curve is unreachable applies.
3. **Leaderboard two, average precision** — LSTM+attention 0.105, LSTM 0.104, XGB 0.095, CNN 0.093, FFNN 0.084, RF 0.080, DT 0.068, LR 0.054. Because: AP weights the high-precision head of the ranking, where the history of the card carries signal the aggregates compress away; sequence models beat the feed-forward net on the same inputs plus history, so the history matters — on real data, unlike the simulator (module 7 will say when).
4. **Leaderboard three, card precision at 100** — XGB 0.235 (0.249 at the unfound 50 trees), FFNN 0.236, DT 0.232, LSTM+attention 0.232, RF 0.227, CNN 0.221, LSTM 0.22, LR 0.211 — a six-way tie inside ± 0.03–0.07. Because: a hundred alerts a day against ~300 compromised cards is a ceiling every reasonable model reaches the same way; the number investigators use does not separate the families.
5. **Why the spreads are what they are** — ± 0.01 on AUC, ± 0.02–0.03 on AP, ± 0.03–0.07 on CP@100: four folds from four weeks with different fraud counts. Because: CP@100 is a precision over 100 draws per day, and the day-to-day fraud count moves it (module 2's remaining-fraud ceiling).
6. **What the compute bought** — DT grid 1,617 s, XGB 8,788 s, LSTM 14,751 s, CNN 26,905 s (on ten cores): the tie on CP@100 cost two orders of magnitude; the best LSTM came from the slowest schedule (lr 1e-4, batch 256, few epochs), a sign that less training would help. Because: the selection procedure finds a point near the optimum for each class and the classes differ in how expensive that point is.
7. **Reading the table against module 2's warning** — the best top-k ranker is not the best global ranker (a feedback-trained model with the worst AUC and the best alert precision); models that score alike catch different frauds (25% true-positive overlap between a forest and an LSTM). Because: the leaderboards disagree for the same reason the metrics were introduced — they answer different questions — and the practical reply is to combine, not to crown.
8. **Departures from the idealisation** — the replay's labels are complete (no delay in the labels themselves, only in the split), the grids are four folds of one summer, the sequence models' grids were cut by compute, the data is e-commerce only, -1 fills are read as missing, and the tail of the sequence chapter was not read in the dossier (any number from it is flagged). Because: L16 asks where the artifact departs.

### Set pieces and worked examples to recreate
- The global table, eight models × three metrics with ± std (Handbook Ch7 RWD, lines ~355–370).
- Three leaderboards sorted from the one table (derived from the same).
- The real-data overfitting curves and the 50-tree CP@100 miss (Handbook Ch5 RWD).
- Grid costs DT 1,617 s, XGB 8,788 s, LSTM 14,751 s, CNN 26,905 s, LSTM+attn 16,736 s (Handbook Ch5 RWD, Ch7 Sequential modeling).
- Data facts: ~400,000 payments/day, ~1,000 frauds/day, ~300 compromised cards/day, random CP@100 ≈ 0.0025 (Handbook Ch3 RWD).
- Baseline-setting PR curves on the floor: AP 0.035 for LR and XGB, 0.003 for the unpruned tree (Handbook Ch4 RWD, Fig. 2).
- F worst AUC 0.87 / near-best P_k; R best AUC 0.96 / mid P_k (Dal Pozzolo 2018 Table III); 25.2% Jaccard RF vs LSTM on F2F (Jurgovsky Sec. 5.2).

### Pitfalls and terms to define
- The sequence rows: say in one sentence what an LSTM and attention are (a model that reads the card's previous payments in order; a learned weighting over them) and point to module 7; do not explain them.
- The LSTM+attention CP@100 of 0.232 has a validation value of 0.243 — report test numbers only, with std.
- The baseline-setting PR curves (AP 0.035) and the tuned AP (0.095) are different experiments (baseline hyperparameters vs prequential selection); do not mix them.
- "Best" must always carry its metric in the same sentence.
- The unread tail of shard 6: the sequence-chapter cost numbers come from the read part; mark anything else as unverified.

### Recalled, not re-taught
- The three metrics and what each sees (`alert-budget-metrics`): one clause each.
- Prequential selection and the triplet (`gbm-model-selection`): one clause.
- The network's five decisions (`neural-tabular-detectors`): one clause.
- The scorecard as a logistic regression (`scorecards-woe`): the LR row is the card's score.

## FIGURE PLAN
- draw: key image — the global table drawn as three horizontal leaderboards (AUC, AP, CP@100), each sorted, with the same eight model names in the same colours so the reader sees the rows reorder; single `<Figure>`.
- draw: AP against CP@100 as a scatter with error bars per model, the CP@100 cluster inside one band; single `<Figure>`.
- source: reproducible-wl-pr-curves — stem `wl-pr-curves-baseline`; the reader must see precision squashed below 0.1 for every baseline model on real data, with the random floor at 0.002; float right beside the "what the data is" paragraph (viewed, 785×416, use as-is).
- draw: compute (log seconds) against CP@100 and against AP, one dot per family; single `<Figure>`.
- draw: `<FigureSequence>` 3 frames: the daily compromised-card count over the four test weeks → the k = 100 line → the detected count bounded by the line, showing why CP@100 ties (inspired by the handbook's WL_TopK figure; computed from the stated numbers, not the crop).
- draw: the true-positive overlap idea as a Venn of two models' top-100 alerts on one day with the 25% intersection; single `<Figure>` (inspired by Jurgovsky's Jaccard matrix).
- draw: the departures grid for this artifact: labels complete, four folds, grids cut, e-commerce only; single `<Figure>`.

## EXERCISE PLAN
1. [warm-up] From the global table, write the three leaderboards and mark which pairs are inside one standard deviation on each.
2. [boundary probe] If investigators could check 1,000 cards a day instead of 100, predict from the remaining-fraud ceiling which leaderboard CP@1000 would resemble, and why the tie would break.
3. [claim to refute] "The attention-LSTM is the best model for this bank because it tops average precision." Refute with the CP@100 tie, the ± std and the compute: the step that fails is that AP's winner is not the budget's winner.
4. [research-shaped] From the table's means and stds, run a paired comparison across the four folds (assume the folds are the same) for XGB vs DT on CP@100 and state whether 0.235 vs 0.232 could be a fold effect.
5. [derivation skipped] Show that if two models each have precision 0.23 at k = 100 and their alert sets overlap by 25%, the union of alerts at k = 200 has an expected precision bounded between the two individual precisions and their disjoint combination — the arithmetic of combining rankers.
6. [mixed review] Apply the Bayes-minimum-risk rule of `example-dependent-cost` to the XGBoost scores on one real-looking day (simulated amounts) and report how many alerts it raises against the budget of 100.
7. FORWARD → `sequence-models-for-transactions`: on the simulator, train the FFNN on the aggregates and again on the aggregates plus the raw previous five payments; the AP gap is near zero — the reader has the null result that the next lesson explains by what the simulator's fraud looks like.

## ARC
- Spine step 4 "Supervised detectors compared": "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
- Inherits: the three metrics (`alert-budget-metrics`), the selection procedure and real-data grids (`gbm-model-selection`), the network (`neural-tabular-detectors`), the scorecard as LR (`scorecards-woe`).
- Contributes: the one-table-three-winners reading; the compute-vs-metric verdict on real data; the combine-not-crown conclusion.
- Hands off: the sequence rows to `sequence-models-for-transactions`; the ranker-disagreement to `alert-feedback-selection-bias`; the decision between detectors in money to `scorecard-vs-gbm-lab`; the leaderboard logic to `drift-strategies-on-worldline`.
- APPLICATION spec: the artifact is the handbook's real-world model-selection chapter and the global comparison table (eight families × three metrics on Worldline weeks). Module results used: prequential selection with the best-estimated/optimal triplet (`gbm-model-selection`), the network's training decisions (`neural-tabular-detectors`), the scorecard/logistic baseline (`scorecards-woe`), the three metrics and the remaining-fraud ceiling (module 2). Departures: labels in the replay are complete; four folds of one summer; sequence grids cut by compute and the best LSTM from the slowest schedule; e-commerce only; −1 values read as missing; the tail of the sequence chapter unread in the dossier.
