# Updating strategies on 422 days of Worldline data — research brief (module 7 APPLICATION)

Lesson: `drift-strategies-on-worldline` (module: sequences-drift, core, planned). NEW. Module-final application (L16): a paper's central experiment read in full and its design reproduced on the simulator.
Goal: Evaluate the static, update and forget strategies with three balancers over 422 daily chunks of real card data and attribute the rank ordering to drift and to the fraud count per chunk.

## Sources
- Dal Pozzolo et al. 2014 (primary, read in full): Sec. 2 the practitioner questions (which algorithm, update frequency, training size, rebalance or not, which metric); Sec. 3.2 balancers (undersampling, SMOTE, EasyEnsemble); Sec. 4 formalisation (history window T, aggregated features replace the card id; drift as non-stationary P(X,Y)); Sec. 5 metrics (AUC rank form, AP, PrecisionRank at top-a); Sec. 6 strategies — Static (Fig 1, one model on K chunks), Update (Fig 2, M models on the K latest chunks, ensemble weights w_m = (PR_m − PR_min)/(PR_max − PR_min)), Forget (Fig 3, all past frauds + K_gen chunks of genuine), balancing step (Fig 4), Table 2 strengths/weaknesses; Sec. 7.1 dataset (Feb 2012–May 2013, 422 days, 45 variables, 2,202,228 transactions, < 0.4% fraud, daily chunks averaging 5,218, H = 90-day aggregation, e-commerce only); Sec. 7.2 method (per-chunk ranking summed over chunks — Friedman rank sums; paired t-tests on ranks; 5 replications; naming scheme Algo.Sampling.Frequency.MModels.Approach.K); 7.2.1 RF > NNET > SVM; 30/60/90 days improve static; 7.2.2 best RF.Under.Daily.5M.Update.90K; K = 1 worst (too few frauds); daily > weekly > 15-day at the same K; 7.2.3 K_gen 0 → 30 helps, beyond 30 rarely; best 5 models, K_gen = 30; 7.2.4 SMOTE and EasyEnsemble > undersampling; static worst for every balancer; Forget > Update with EasyEnsemble, SMOTE better with Update; SMOTE heavy, Forget highest prediction time (Fig 9); 7.2.5 overall best EasyEnsemble + Forget + daily update; multi-chunk > single-chunk; with overlapping training sets single models can beat ensembles; the balancer depends on the strategy; Sec. 8 future work (racing/F-race, HDDT, combination rules, minority sub-concepts); Sec. 9 conclusion; caveats — single dataset, e-commerce only, no cost-based metric, daily chunks, labels assumed available at once (no delay modelled).
- Dal Pozzolo 2018 Sec. VI-D (the delayed-label sequel: S < W^D < AW over time; synthetic abrupt drift 7.7% vs 12.5% loss) — the "what changes with δ" paragraph.
- Jurgovsky Sec. 5.1 (daily AUCPR co-moves across models; fraud density per day explains part of it) and Fig. 3–4.
- Lucas & Jurgovsky Fig. 4 (day-shift matrix) and Weber's step 43 — the two other drift artifacts the lesson sets beside this one.
- Gama Sec. 4.2 (prequential, controlled permutations, Nemenyi) for the evaluation design the paper uses in its own form.
- Handbook Ch6 (balancer findings under AP/CP@k) — the module-2 result to reconcile: here SMOTE/EasyEnsemble help; there they hurt AP — the reconciliation is the strategy × balancer interaction plus the metric (PrecisionRank at a vs CP@k with card removal).

## Key points
1. The artifact: 422 daily chunks, three strategies × three balancers × three algorithms × windows, ranked per chunk and summed — Fig. 10's full ordering with EasyEnsemble.Forget first and Static last.
2. Why static is last: drift measured as a ranking; the K = 1 result (too few frauds) shows the other constraint — a window must hold enough positives, so the fraud count per chunk sets the minimum K; daily > weekly > 15-day at fixed K isolates the update frequency.
3. Forget's mechanism: positives are scarce and informative, negatives abundant and drifting — keep all past frauds, window the genuine (K_gen = 30); the cost (prediction time) and the limit (old frauds that no longer occur — Gama's reoccurring/obsolete concepts).
4. Balancer × strategy: SMOTE with Update, EasyEnsemble with Forget; undersampling discards 99.6% of genuine per chunk and EasyEnsemble repairs the variance with 5 draws — the interaction is the paper's methodological point; reconcile with module 2's "rebalancing hurts AP": different metric (PrecisionRank at top-a over a chunk), no card removal, and the stream setting where variance from tiny chunks dominates.
5. The evaluation design: Friedman rank sums over chunks (why ranks: chunk difficulty varies, as Jurgovsky's co-movement shows), paired t-tests on ranks, five replications; what it cannot say (effect sizes in AP units).
6. The simulator reproduction (the reader can run): Static vs Update (daily, K = 30) vs Forget (all frauds + 30 days genuine) with RF over 40 simulator days, ranked per day on AP and CP@100 with the module-2 harness — on scripted drift (scenario 2's 28-day terminals) the ordering reproduces; state what the simulator cannot show (fraud-type evolution).
7. Departures (L16): labels assumed instant (Dal Pozzolo 2018 adds δ and the feedback split — module 8); e-commerce only; one dataset; no cost metric; daily chunks; R implementation.

## Set pieces & gems
- K = 1 coherently worst; daily > weekly > 15-day.
- 99.6% of genuine discarded at 50/50; EasyEnsemble's five draws.
- Static at the bottom for every balancer and metric.
- The naming scheme RF.Under.Daily.5M.Update.90K.
- "The best balancer depends on the strategy."
- Fig. 9: SMOTE's and Forget's compute.

## Pitfalls
- PrecisionRank at a ≠ CP@k; say so when reconciling with module 2.
- Rank sums are not AP differences; the lesson reports the ordering and the test, not invented effect sizes.
- The 2014 paper models no label delay; the 2018 paper does — keep the chronology (the capstone uses the 2018 loop).

## FIGURE PLAN
- draw: The three strategies as three chunk timelines (Static: one model on K chunks predicting all future; Update: a model per chunk on the K latest, ensemble of M; Forget: all past frauds + K_gen genuine chunks) — one figure, three rows. Inspired by Figs 1–3 (recreated). Key image.
- draw: Rank-sum bar chart of the pooled strategies (EasyEnsemble.Forget at top, Static at bottom) for AP — a house-style recreation of Fig. 10's ordering from the paper's description (values as ordering only; mark as ordering).
- draw: `<FigureSequence>` (3 frames) of the K = 1 failure: (1) one day's chunk with ~20 frauds, (2) the model's decision region fitted to them, (3) the next day's frauds outside it — the "too few positives" picture, computed on the simulator.
- draw: Balancer × strategy as a 3 × 3 grid (Under / SMOTE / EasyEnsemble × Static / Update / Forget) shaded by rank, with the two diagonal winners marked — from Sec. 7.2.4–7.2.5.
- draw: Our simulator reproduction: per-day AP for Static / Update / Forget over 40 days as three lines with scenario-2 compromise windows shaded — computed.
- draw: Compute cost per strategy and balancer as a bar chart (SMOTE heavy, Forget slow to predict) — from Fig. 9's description, as relative bars.

## EXERCISE PLAN
1. Warm-up: with 5,218 transactions per daily chunk at 0.4% fraud, compute the expected frauds per chunk and the number of genuine rows retained by undersampling to 50/50.
2. Boundary probe: K → all history (Static with everything) and K = 1 — write what each training set contains on day 400 and why both lose: one to drift, one to variance; derive the chunk count at which the expected fraud count passes 100.
3. Claim to refute: "Module 2 showed rebalancing hurts AP, so this paper's finding that SMOTE and EasyEnsemble help must be wrong." Reconcile: different metric (PrecisionRank at a per chunk), tiny chunks where variance dominates, stream setting with daily refits; name the experiment that would decide (the same strategies scored by CP@k with card removal).
4. Research-shaped: reproduce the Static vs Update vs Forget ordering on the simulator (RF, daily, K = 30, K_gen = 30) over 40 days with the harness; report Friedman rank sums on AP and on CP@100.
5. Derivation the lesson skipped: show that the ensemble weight w_m = (PR_m − PR_min)/(PR_max − PR_min) gives the best model weight 1 and the worst 0 and is invariant to affine rescaling of PR; then show why with overlapping training windows the M models are nearly identical and the ensemble reduces to a single model (the paper's Sec. 7.2.5 remark).
6. FORWARD (E7): rerun Update on the simulator where only the top-100 alerted transactions of each day receive labels (the others remain unlabelled rather than being read as genuine) — the reader finds the strategy's rank collapsing and the training set's fraud share rising → lands on `alert-feedback-selection-bias`.
7. Mixed review (E3): compute the day-distinguishability AUC (concept-drift) between simulator day 10 and day 40 and state whether the Update strategy's gain on those days is explained by p(x) or p(y|x) change (scenario 2 is which?).

## ARC
- Inherits: sequence models and daily co-movement; the drift taxonomy, detectors and strategies; module 2's balancer findings and harness.
- Contributes: the module cashed out on 422 real days — the static model last, the cadence and window effects, the balancer × strategy interaction, and its reproduction on the simulator.
- Hands off: the delay-aware sequel (alert-feedback-selection-bias; Dal Pozzolo 2018); the retraining loop of the capstone; monitoring (model-risk-monitoring).
- Spine step 7: drift and sequence.

## APPLICATION (L16)
- Artifact: Dal Pozzolo et al. 2014's experiment on 2.2M Worldline e-commerce transactions over 422 days (static results; data proprietary), reproduced in design on the simulator.
- Module results used: the drift taxonomy and the window/forgetting/ensemble strategies (concept-drift); the sequence lesson's daily co-movement as the reason for rank-based evaluation; module 2's harness and balancer findings for the reconciliation.
- Departures from the idealisation: labels assumed instant, e-commerce only, one dataset, no cost metric, daily chunks; the simulator's drift is scripted (scenario 2) and shows no fraud-type evolution.
