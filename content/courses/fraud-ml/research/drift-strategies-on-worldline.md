# Updating strategies on 422 days of Worldline data — research brief

Lesson: `drift-strategies-on-worldline` (module: sequences-drift, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. Module-final APPLICATION.
Goal: Evaluate the static, update and forget strategies with three balancers over 422 daily chunks of real card data and attribute the rank ordering to drift and to the fraud count per chunk
Opening (verbatim, the lesson must start with it): Over 422 days of real card payments, six ways of handling time — train once; retrain daily, weekly or fortnightly on a window; keep every past fraud; three rebalancing methods — are ranked day by day. Which ordering comes out, and what does the ordering measure about the stream?

## Sources to consult
- Dal Pozzolo et al. 2014 (research/texts/staged-dalpozzolo2014-learned-lessons.pdf; txt staged beside it): Sec 4 (formalisation, 90-day history aggregates replacing the card id, P(X)/P(Y|X) drift), Sec 5 (AUC in rank form, AP, PrecisionRank at top-a), Sec 6 (Static Fig 1, Update Fig 2 with M models on K chunks and weights w_m, Forget Fig 3 with all past frauds + K_gen genuine chunks, balancing Fig 4, Table 2), Sec 7.1 (1 Feb 2012 – 20 May 2013, 422 days, 45 variables, 2,202,228 transactions, < 0.4% fraud, ≈ 5,218 per daily chunk, H = 90 days), Sec 7.2.1–7.2.5 (RF beats NNET and SVM; 30/60/90 training days; daily beats weekly and 15-day at K = 90; K = 1 worst; K_gen 0 → 30 helps, beyond rarely; SMOTE and EasyEnsemble beat plain undersampling; Static worst for every balancer; Forget better with EasyEnsemble, SMOTE with Update; Fig 9 compute cost; Fig 10 overall), Sec 7.2 method (per-chunk Friedman rank sums, paired t-tests on ranks, 5 replications; strategy naming Algo.Sampling.Frequency.MModels.Approach.K), Sec 8 (racing, HDDT, sub-concepts).
- Dal Pozzolo 2018 Sec VI-D (research/texts/creditcard-tnnls.txt): static S loses to W^D and AW over time (Fig. 5); the juxtaposed-months drift with CP_k loss 7.7% vs 12.5%; CP_k tracks the daily count of fraud cards (peak Feb 2015, trough Oct 2014).
- Gama et al. 2014 Sec 4.2.3 (research/texts/asurvey-s2-.txt): Friedman/Nemenyi CD = q_α √(k(k+1)/(6N)), Dunnett against a control — the statistics the ranking uses; Sec 4.2.1 why average accuracy masks adaptation.
- Jurgovsky 2018 Sec 5.1 and 6.1: day-to-day AUCPR variance co-moving with fraud density; dropout for time-stability — the sequence models' row.
- Lucas & Jurgovsky 2020 Sec 3.2 (research/texts/creditcard-.txt): the day-shift matrix as the label-free view of the same stream type.
- Weber et al. 2019 Sec 4: the step-43 collapse an RF retrained each step cannot recover from — the limit of retraining.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The previous lesson derived a cadence (daily, 90-day window, keep all frauds) from the stream's clocks. Now a real experiment ranks strategies over 422 days. The newcomer can read a table of ranks but not yet what a rank-sum over chunks is, why a rank rather than an average, how a balancer (module 2) interacts with a time strategy, or what the ordering says about drift. The module's claims are on trial: does the static model really lose, does daily beat weekly, does keeping frauds help.

### Chain of sub-problems
1. **How do you compare strategies on a stream fairly?** — Obvious attempt: average AP over 422 days. Why it fails: averages hide adaptation — a strategy great for a month and bad after can tie a steady one; and days differ in difficulty (fraud cards per day). Answer: score every strategy on every daily chunk, rank them within the chunk, sum the ranks (Friedman), test differences with paired t-tests on the ranks, repeat five times to average sampling noise. Because: within-day ranks remove day difficulty, which the previous lessons showed co-moves across models.
2. **What are the candidates?** — Answer: the naming scheme Algo.Sampling.Frequency.MModels.Approach.K — Static (one model on K chunks, used forever), Update (a new model per chunk on the K latest, M models ensembled with weights w_m = (PR_m − PR_min)/(PR_max − PR_min)), Forget (every model keeps all past frauds plus the genuine of the last K_gen chunks, size capped); each with undersampling, SMOTE or EasyEnsemble before learning; RF, NNET, SVM; daily, weekly, 15-day frequency. Because: these are exactly the memory, replacement and ensemble choices of the previous lesson, instantiated.
3. **Does the static model lose?** — Answer: last for every balancer and every metric (AP, AUC, PrecisionRank) — Fig 10. Because: over 14 months the stream moved; a model that never sees the move cannot follow it — the module's first claim confirmed.
4. **Does the frequency matter?** — Answer: at the same K = 90, daily beats weekly beats 15-day; the one-chunk window K = 1 is coherently worst. Because: fraud keeps evolving within a week, and one day holds a handful of frauds (< 0.4% of 5,218 ≈ 20) — the starved-learner failure from the previous lesson, measured.
5. **Does keeping old frauds help?** — Answer: K_gen from 0 to 30 days of genuine helps; beyond 30 rarely significantly; best AP/PrecisionRank with 5 models and K_gen = 30. Because: frauds are the scarce class, genuine history goes stale faster than fraud history.
6. **Does the balancer interact with the strategy?** — Answer: SMOTE and EasyEnsemble both beat plain undersampling (which at 0.4% fraud discards 99.6% of the genuine per chunk); EasyEnsemble pairs with Forget, SMOTE with Update; Forget has the highest prediction time, SMOTE the heaviest training. Because: EasyEnsemble repairs undersampling's variance by learning from five different undersamples per chunk — diversity again (module 2's balanced-bagging finding) — and the best balancer depends on how much history the strategy keeps.
7. **What does the ordering measure?** — Answer: the gap between Static and the adaptive strategies is the drift over 422 days as seen by the metrics; the gap between K = 1 and K = 90 is the fraud count per chunk; the balancer × strategy interaction is the imbalance ratio changing with the window. Because: each contrast isolates one of the previous lesson's variables.
8. **What does the experiment not show?** — Answer: labels are assumed available at once (no δ, no feedback bias — module 8), e-commerce only, one dataset, no cost metric, no detector-triggered replacement (the cadence is fixed). The Elliptic step 43 shows a change no retraining catches; the day-shift matrix shows the label-free view the experiment never took. Because: an application states where it departs from the idealisation.

### Set pieces and worked examples to recreate
- Dataset facts: 422 days, 45 variables, 2,202,228 transactions, mean 5,218 per daily chunk, < 0.4% fraud, 90-day aggregates (Sec 7.1).
- Static / Update / Forget timelines with K = 3, M = 4, K_gen = 2 (Figs 1–3) and the balancing step (Fig 4).
- The rank-sum bar charts: Fig 5 (algorithm × training days), Fig 6 (frequency), Fig 7 (K_gen), Fig 8 (balancers × strategy), Fig 10 (all strategies: EasyEnsemble.Forget on top, Static at the bottom) — recreate as house-style horizontal bars with significance ticks.
- Undersampling to 50/50 at 0.4% discards about 99.6% of genuine per chunk (Sec 7.2.4).
- The compute chart: SMOTE training-heavy, Forget prediction-heavy (Fig 9).
- The juxtaposed-months abrupt drift: CP_k loss 7.7% (AW) vs 12.5% (W^D) (TNNLS Sec VI-D) — the same question with a planted change.
- Nemenyi's CD formula with k strategies and N = 422 chunks (Gama Sec 4.2.3).

### Pitfalls and terms to define
- "Rank sum" and "Friedman test": define before the bars; a reader will read the bar length as a score.
- PrecisionRank at top-a is module 2's P@k under another name; say so.
- The paper's K_gen and K are two different window parameters; keep them apart.
- "EasyEnsemble" and "SMOTE" are recalled from module 2, not re-taught; one clause each.
- The experiment assumes instant labels: say it at the departure step, not as a footnote.
- The paper's own naming scheme (RF.Under.Daily.5M.Update.90K) is a convenience; introduce it once.

### Recalled, not re-taught
- Memory/forgetting/ensembles and the cadence argument (<Ref> `stream-learning-and-adaptation`); drift kinds (<Ref> `concept-drift`); AP, AUC in rank form, P@k (<Ref> `alert-budget-metrics`); undersampling, SMOTE, balanced ensembles and the diversity finding (<Ref> `imbalance-techniques-revisited`); the sequence models' daily variance (<Ref> `sequence-models-for-transactions`); the Elliptic collapse (<Ref> `elliptic-illicit-nodes`).

## FIGURE PLAN
- draw (key image): the overall rank-sum chart — horizontal bars for every strategy with EasyEnsemble.Forget at the top and Static at the bottom, significance against the best marked. Inspired by Dal Pozzolo Fig 10.
- draw: <FigureSequence>, 3 frames — the per-chunk ranking procedure: frame 1 three strategies' AP on five days, frame 2 ranks within each day, frame 3 the rank sums.
- draw: daily frauds per chunk over the 422 days as a strip with the K = 1, 7, 30, 90 windows drawn to scale — the fraud count each window holds.
- draw: frequency contrast — rank sums for daily / weekly / 15-day at K = 90 and the K = 1 bar. Inspired by Fig 6.
- draw: balancer × strategy interaction as a 3 × 2 grid of rank sums (Under / SMOTE / EasyEnsemble × Update / Forget). Inspired by Fig 8.
- draw: compute cost per strategy and balancer as grouped bars (training vs prediction time). Inspired by Fig 9.
- draw: the departures panel — the experiment's timeline with "labels instant" against the course's δ-late timeline, and the Elliptic step-43 curve beside it as what retraining cannot fix.

## EXERCISE PLAN
1. Warm-up: given AP for three strategies on six days, compute the Friedman rank sums and say which is best.
2. [claim to refute] "Strategy A has the higher mean AP over 422 days, so it beats strategy B." Construct a six-day example where A wins the mean and B wins the rank sum, and say which the deployment should prefer and why (day difficulty).
3. [derivation skipped] Derive the Nemenyi critical difference for k = 6 strategies on N = 422 chunks at α = 0.05 and state how far apart two rank sums must be; then show why overlapping training windows make consecutive chunk ranks dependent and what that does to the test.
4. [boundary probe] K_gen = 0 with Forget: the training set is all past frauds and the current day's genuine; compute its imbalance ratio after 300 days on the paper's stream and say what a balancer does to it.
5. [research-shaped] On the simulator over 120 days, implement Static, Update (daily, K = 30) and Forget (all frauds + 30 days genuine) with a random forest and rank them per day on AP and CP@100; report whether Static is last and whether the K = 1 window is starved.
6. [mixed review] Re-run exercise 5 with labels arriving δ = 7 days late (<Ref> `delayed-labels-prequential`): which strategy loses most, and what does the "feedback" sample of <Ref> `alert-feedback-selection-bias` (the next module) look like in this loop?
7. FORWARD → `adversarial-classification`: plant a fraudster on the simulator who, each week, moves the fraud amount just below the threshold the retrained model learned; rank Static and daily Update on that stream — the reader watches the adaptive strategy chase a target that moves because of it, the arms race the next module names.

## ARC
- Spine step 7 "Drift and sequence": "The transaction stream drifts and the fraud evolves, so a model trained once ranks last: the sequence of an entity's events is itself a feature, change is measured on the features before labels arrive and detected on the error stream once they do, and the learner remembers, forgets and replaces itself on a cadence that the stream's own evaluation has to score."
- Inherits: every claim of the module — sequence models' daily variance, the kinds of change, the detectors' delay, memory/forgetting/ensembles and the cadence; module 2's metrics and balancers.
- Contributes: the ranking method for streams and the measured ordering: Static last, daily first, frauds kept, balancer × strategy.
- Hands off: the fixed cadence as the baseline the capstone's loop runs (`pipeline-capstone-lab`); drift the model causes (`adversarial-classification`, `alert-feedback-selection-bias`); performance backtesting per period (`model-risk-monitoring`).
- APPLICATION spec: the artifact is the 422-day Worldline strategy comparison (2.2M e-commerce transactions, daily chunks, 90-day aggregates, Friedman rank sums). It uses the module's results: prequential-style per-chunk scoring (lesson 38), the window/forgetting/ensemble choices (lesson 38), the drift taxonomy to name what the Static gap measures (lesson 36), module 2's metrics and balancers. Departures from the idealisation: labels are taken as instantly available (no δ, no alert-feedback bias); replacement is on a fixed cadence, never detector-triggered (lesson 37's detectors are absent); e-commerce only, one processor, no cost metric; no label-free shift measurement; and the Elliptic collapse shows a change retraining cannot follow.
