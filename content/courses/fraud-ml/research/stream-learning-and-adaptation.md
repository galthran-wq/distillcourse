# Learning on a stream: prequential scoring, forgetting and adaptive ensembles — research brief

Lesson: `stream-learning-and-adaptation` (module: sequences-drift, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Design how a detector on a transaction stream remembers, forgets and replaces itself — windows, fading, blind vs triggered replacement, weighted ensembles, a retraining cadence — and score it with a prequential evaluation that moves with the stream
Opening (verbatim, the lesson must start with it): A detector cannot be retrained from scratch on every change, and a model that forgets everything after each alarm has too few frauds to learn from. How should a learner on a stream remember and forget, when should it replace itself, and how do you score a learner that keeps changing while the stream it is scored on changes too?

## Sources to consult
- Gavaldà, Lecture 8 (research/texts/gavalda-ds-lecture8.txt): slides 4–11 — loss on a stream, why batch splits do not translate, test-then-train with the N/M choice problem, prequential (predict; when the label is known, evaluate then train), its pessimism (error 1/√t at time t, observed prequential error ≈ 2/√t), the drift problem, fading/sliding windows as the fix, Kappa κ = (Pr[agree] − Pr[chance])/(1 − Pr[chance]) with chance = Σ Pr[c]², temporal dependence and the baseline pred_t = y_{t−1}; slides 13–18 — perceptron update, streaming bagging with Poisson(1) copies (Oza–Russell), boosting, dynamic ensembles (Exercise 1: rules for creating, deleting, predicting from a pool).
- Gavaldà, Lecture 7 (research/texts/gavalda-ds-lecture7.txt): slides 6–8 (two approaches: rebuild on change vs keep statistics in sync), 13–22 (VFDT / Hoeffding trees, CVFDT's window and parameters, Adaptive Hoeffding Trees with ADWIN at nodes, "no magic parameters"), 23 (memory table), Exercise 1 (streaming naive Bayes, then adaptive) — for the starred section and the lab.
- Gama et al. 2014 (research/texts/asurvey-s1-.txt, asurvey-s2-.txt): Sec 3.1 memory (single vs multiple examples; fixed/variable/landmark windows; reservoir sampling p = k/i; fading factor S_i = G(X_i, αS_{i−1}); exponential weights; "recency is not relevance"), Sec 3.3 learning modes (retraining vs incremental vs online; stability–plasticity; blind vs informed adaptation; global vs local replacement, CVFDT alternate subtrees), Sec 3.3.3 ensembles (SEA, DWM: multiply wrong experts by β, add on ensemble error, prune below θ; Wang's MSE weights; Learn++.NSE; DDD; Minku: low diversity before drift, high right after; FLORA3 sleeping models for reoccurring concepts), Sec 3.4 loss estimation (two windows, fading factors, PH on the ratio of short/long error), Sec 4.1–4.2 (Kappa, RAM-Hours, prequential landmark/sliding/fading, controlled permutations, McNemar M = sign(a−b)(a−b)²/(a+b) > 6.635, Nemenyi CD), App. A Algorithms 4–7 (CVFDT, DWM, AddExp), App. C (sliding window w = 1,000 tracks holdout; Leveraging Bagging best on a drifting RBF stream).
- MOA book ch. 5 (research/texts/moa-book-ch5-dealing-with-change.txt): 5.2 estimators (sliding window, EWMA) as the memory primitives; Ex. 5.2 (ensemble management under change).
- Carta OML1 (research/texts/carta-oml1-intro.txt): the predict-then-learn loop, "this order matters", progressive_val_score's climbing accuracy curve (44% at 10 items to 92% at 150), the exercises (windowed/discounted prequential accuracy, prequential vs hold-out, batch vs stream cost).
- MOA Tutorial 5 (research/texts/moa-tutorial5-concept-drift.txt): Sec 4.1 Leveraging Bagging recovering from three Agrawal drifts where naive Bayes does not (Fig. 12).
- Dal Pozzolo et al. 2014 (research/texts/staged-dalpozzolo2014-*): Sec 3.3 (stability–plasticity, forgetting rate, Gao's minority accumulation), Sec 6 (Static / Update with M models on K chunks and weights w_m = (PR_m − PR_min)/(PR_max − PR_min) / Forget: all past frauds + K_gen chunks of genuine; Figs 1–4, Table 2), Sec 7.2.2–7.2.3 (daily beats weekly; K = 1 worst; K_gen = 30) — the fraud instance, previewed here and judged in the application.
- Handbook Ch7 FFNN "Ensemble" (reproducible-Chapter_7_DeepLearning_FeedForwardNeuralNetworks.md): components specialised on recent vs old data.
- Bolton & Hand 2002 Sec 2 (research/texts/statisticalf-.txt): Cahill's rule — exclude very suspicious items from profile updates.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has a detector that fires (previous lesson) and a stream whose labels arrive late and hold a handful of frauds per day. Two reflexes conflict: keep everything (stale) or restart on alarm (starved). And the scorer of module 2 — fixed folds — cannot grade a model that changes every day. Terms not yet available: prequential evaluation (per item), landmark vs sliding vs fading estimate, Kappa, blind vs informed adaptation, local replacement, a weighted expert pool, Leveraging Bagging, Hoeffding tree.

### Chain of sub-problems
1. **How do you score a model that changes while the data changes?** — Obvious attempt: hold out a test set. Why it fails: a held-out block belongs to one concept; which items share the current concept is unknown. Answer: interleaved test-then-train — for each item predict, then (when the label arrives) score, then learn; every labelled item is a test item and the model is scored in the state it had when it predicted. Because: the order matters — learning first would score a model that has seen the answer.
2. **Why is the running prequential error misleading?** — Answer: it is cumulative since the start: if the true error at time t is 1/√t, the observed prequential error at T is ≈ (1/T)Σ 1/√t ≈ 2/√T, twice the current error; and after a drift it is arbitrarily off. Fix: a sliding window of w items or a fading factor α on the accumulated loss; a window of 1,000 tracks the hold-out curve. Because: the estimate must forget for the same reason the model must.
3. **What does "accuracy" mean on a stream with 0.2% positives and a weekly rhythm?** — Answer: Kappa against chance agreement Σ Pr[c]², and against the temporal baseline pred_t = y_{t−1} (temporal Kappa); for fraud, the module-2 metrics in a sliding window (CP_k per day is already prequential). Because: a constant "genuine" predictor scores 99.8% accuracy and "same as yesterday" scores well on any autocorrelated stream.
4. **What should the learner remember?** — Obvious attempt: everything (statistics converge). Why it fails: older items come from another concept. Answer: the memory primitives — a fixed window, a variable window set by a detector (ADWIN's own window), a landmark window reset on alarm, reservoir sampling for a uniform sample under a fixed budget, a fading factor S_i = G(X_i, αS_{i−1}) that weights by age without storing. Because: each is a different answer to "how fast is relevance decaying", and recency is not relevance when concepts reoccur (keep the Sunday model asleep, not deleted).
5. **When should the model be replaced?** — Answer: blind adaptation forgets at a constant rate (a window, a decay, an incremental learner) and is slow on an abrupt change; informed adaptation replaces on a detector's alarm — globally, or only the subtree whose error rose (the alternate subtree grown in parallel and swapped when better). Because: the detector tells when; the memory tells with what; a local replacement keeps what still works.
6. **Why not a committee?** — Answer: a pool of models, each weighted by recent performance: on an error multiply the wrong experts' weights by β, add a new expert when the ensemble errs, prune below θ (DWM); streaming bagging gives each item to each member Poisson(1) times; weights from w_m = (PR_m − PR_min)/(PR_max − PR_min) on recent chunks. Because: members trained on different periods cover different concepts, and low diversity wins before a drift while high diversity wins right after — the pool hedges the change pattern it cannot predict. On three abrupt switches a bagged ensemble recovers where a single naive Bayes does not.
7. **What does all of this come to for a fraud detector?** — Answer: the detector cannot learn one item at a time from labels that arrive by the day, so the unit is a daily chunk; retrain daily on a window of K days (90 beat shorter), keep every past fraud and only the recent genuine (the "forget" rule), because a one-day window holds too few frauds; retrain rather than update because the labels of a day arrive as a batch; use the detector to shorten the window on alarm, not to replace retraining. Because: the stream's own clocks (δ, k, the daily batch) set the cadence, and the next lesson ranks the strategies on 422 days.
8. **★ Can a tree learn one item at a time?** — Answer: a Hoeffding tree splits a leaf once the best attribute's gain beats the second's by the Hoeffding ε(|S|, δ); the adaptive version puts an ADWIN on each subtree's error and grows an alternate subtree when it rises — no window, no parameters but δ. Because: the bound turns "enough items to decide" into a number.

### Set pieces and worked examples to recreate
- The 2/√T pessimism: ∫ t^{-1/2} dt/T = 2/√T (Gavaldà L8 slide 7).
- Carta's climbing prequential curve: 44.4% at 10 items, 73.7% at 20, 90.9% at 100, 91.95% at 150, against a batch 91.1% (OML1).
- Kappa with chance = Σ Pr[c]² and the rain-tomorrow baseline (Gavaldà L8 slides 9–11).
- Sliding window w = 1,000 tracking holdout on a 1M-item stream (Gama App. C Fig. 11).
- DWM's rules in four lines and AddExp (Gama App. A Algorithms 5–7).
- Poisson(1) copies as bagging on a stream (Gavaldà L8 slide 16).
- Leveraging Bagging vs naive Bayes on three Agrawal switches at 25k (MOA Tutorial 5 Example 3, Fig. 12).
- Static / Update / Forget as three chunk timelines with K = 3, M = 4, K_gen = 2 (Dal Pozzolo 2014 Figs 1–3); the ensemble weight formula.
- CVFDT's parameter list (W 100,000; T1 20,000; T2 2,000; T3 10,000; T4 1,000) against the adaptive tree's single δ (Gavaldà L7 slides 19–22).
- Cahill's rule: do not update a profile with a very suspicious event (Bolton & Hand Sec 2).

### Pitfalls and terms to define
- "Prequential" now means test-then-train per item; module 2's "prequential folds" are the batch cousin — say in one sentence that the folds are the chunked version with a delay block.
- "Predict then learn": the order is the whole point; a scorer that learns first is the canonical lab bug.
- Fading factor α vs the detector's δ vs the label delay δ: distinct symbols.
- Kappa can be negative; a reader will take 0 as "random" only after the chance term is explained.
- "Incremental" (update per item) vs "retraining" (rebuild per chunk): the fraud detector of the course retrains, and the lesson must say why without making the stream algorithms look wrong.
- Minku's diversity result is empirical; state it as such.
- The starred Hoeffding-tree section is off the main line; nothing after it may depend on it.

### Recalled, not re-taught
- Detectors and their measures (<Ref> `change-detectors`); the window-size trade-off and reoccurring drift (<Ref> `concept-drift`); prequential folds (<Ref> `delayed-labels-prequential`); CP_k (<Ref> `alert-budget-metrics`); bagging and bootstrap (classical-ml); ensembles for diversity (<Ref> `neural-tabular-detectors`).

## FIGURE PLAN
- draw (key image): <FigureSequence>, 3 frames — the test-then-train loop on four items: predict, score, learn; frame 3 shows the wrong order (learn then predict) and the inflated score.
- draw: prequential landmark error vs sliding-window error vs hold-out on a stream with a drift at the midpoint — the landmark curve lagging and the window tracking. Inspired by Gama App. C Fig. 11.
- draw: the 2/√T effect as two curves (true error 1/√t, cumulative prequential 2/√t).
- draw: memory primitives as five small strips over a stream: fixed window, variable window, landmark window reset at an alarm, reservoir sample, fading weights.
- draw: <FigureSequence>, 4 frames — DWM: experts with weights, an error multiplies two weights by β, a new expert is added, one is pruned below θ.
- draw: Static / Update / Forget as three rows of daily chunks with the training sets shaded and the frauds kept across all chunks in the third row. Inspired by Dal Pozzolo Figs 1–3.
- draw: the three clocks of the loop on one timeline — δ (label delay), k (daily budget), the retraining cadence — with the detector's alarm as an event that shortens the window.

## EXERCISE PLAN
1. Warm-up: compute Kappa for a predictor with accuracy 0.998 on a stream with 0.2% positives that never predicts positive, and the temporal Kappa of "same as yesterday" on a stream with 70% day-to-day label agreement.
2. [derivation skipped] Show that the cumulative prequential error of a learner whose true error is 1/√t is ≈ 2/√T, and derive the window length w at which a sliding-window estimate's bias under a linear error trend equals its standard error.
3. [claim to refute] "A sliding-window prequential score of 0.92 beats the hold-out score of 0.90, so the streaming learner is better." Name what differs (which items, which model state, which concept) and what would make the comparison valid.
4. [boundary probe] DWM with β = 1 and with β = 0: what does each pool do on an abrupt change, and which one is the plain majority vote?
5. [research-shaped] Simulate three abrupt switches on a SEA-like stream and compare a single Gaussian naive Bayes with a Poisson(1)-bagged pool of ten under windowed prequential accuracy; report recovery time after each switch.
6. [mixed review] For the simulator's daily chunks, count the frauds in windows of 1, 7, 30 and 90 days and compute the imbalance ratio (<Ref> `imbalance-techniques-revisited`) of each; explain why the "keep all frauds" rule changes the ratio and what the undersampling correction (<Ref> `undersampling-calibration`) must then use as β.
7. FORWARD → `drift-strategies-on-worldline`: write the per-chunk ranking procedure (rank strategies per day, sum ranks over days) and apply it to three strategies on 20 simulator days — the reader produces the rank-sum table the next lesson reads on 422 real days.

## ARC
- Spine step 7 "Drift and sequence": "The transaction stream drifts and the fraud evolves, so a model trained once ranks last: the sequence of an entity's events is itself a feature, change is measured on the features before labels arrive and detected on the error stream once they do, and the learner remembers, forgets and replaces itself on a cadence that the stream's own evaluation has to score."
- Inherits: detectors and their trade (`change-detectors`), the kinds of change and the window trade-off (`concept-drift`), prequential folds and CP_k (module 2), the imbalance ratio (module 2), ensembles for diversity (module 4).
- Contributes: stream evaluation that moves with the stream, memory and forgetting primitives, blind vs informed replacement, adaptive ensembles, the fraud cadence.
- Hands off: the strategy ranking on real data (`drift-strategies-on-worldline`); the lab's scorer and adaptive naive Bayes (`drift-detector-lab`); the feedback/delayed split of the training set (`alert-feedback-selection-bias`); the retraining loop of the capstone (`real-time-scoring-architecture`, `pipeline-capstone-lab`).
