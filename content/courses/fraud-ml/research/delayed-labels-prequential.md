# Temporal validation with delayed labels: prequential folds — research brief

Lesson: `delayed-labels-prequential` (module: rare-positives, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Design a train/delay/test validation for a transaction stream and explain why prequential folds estimate the test week where random folds and AUC-selected depth do not
Opening (verbatim, the lesson must start with it): You want to know how well the model will do on next week's payments. But a payment's label arrives a week or more after the payment, so the latest labelled data ends a week before today, and some of the cards in next week's data are ones the bank already blocked. How do you cut the history into training and test sets so that the test number predicts what next week will show?

## Sources to consult
- Handbook Ch3 BaselineModeling "Defining the training and test sets" (the delay period as feedback delay; one week as a simplification; get_train_test_set: for each test day remove transactions of cards known compromised at day − delay; 67,240 train / 598 frauds; test 58,264 / 385) and Ch5 ValidationStrategies (Fig. 1 stream of blocks: training, delay, test, old blocks dropped; Fig. 2 and Fig. 4 validation shifted back by δ_delay + δ_valid; hold-out, repeated hold-out (4 random 70% subsamples), prequential (Fig. 5, 4 folds each shifted one block back); the train-vs-test depth sweep: train AUC → 0.97 at depth 50, test AP peaks at depth 4–6 then falls to ~0.31, test AUC rebounds to 0.788 at 50 while CP@100 stays 0.243; validation chooses depth 50 for AUC (validation 0.823, test-optimal 4); hold-out estimates: depth 2 AP 0.524 valid vs 0.496 test, CP@100 0.243 vs 0.241; prequential std AP 0.022 vs repeated hold-out 0.0065, CP@100 0.014 vs 0.0018; prequentialSplit and GridSearchCV(refit=False, cv=indices); dataset 919,767 transactions, 8,195 frauds, 2018-06-11 to 09-14, training start 07-25, all deltas 7 days). Files: research/texts/reproducible-Chapter_3_GettingStarted_BaselineModeling.md, reproducible-Chapter_5_ModelValidationAndSelection_ValidationStrategies.md, reproducible-ch5-validation-tables-full.txt, reproducible-Chapter_References_shared_functions.md.
- Handbook Ch4.4 (remaining frauds 74–91 → 41–60 after removal; ~29 detected per day). File: reproducible-Chapter_4_PerformanceMetrics_TopKBased.md.
- Dal Pozzolo 2018 Sec. VI-A (CARD ID removed because a card is blocked after its first detected fraud, otherwise offline evaluation is optimistic), Sec. III and Fig. 2 (δ = 7). File: research/texts/creditcard-tnnls.txt.
- Jurgovsky 2018 Sec. 4.1 (test starts more than a week after training ends because investigator labels arrive about a week late; account-level undersampling; drop transactions with fewer than 9 predecessors so RF and LSTM see identical sets). File: research/texts/staged-jurgovsky2018-sequence-classification.txt.
- Gama et al. 2014 Sec. 4.2 (cross-validation mixes temporal order and is not applicable to evolving streams; hold-out unbiased for the concept at time t) — one paragraph. File: research/texts/asurvey-.txt.
- APATE Sec. 4 (out-of-time split: last week as test, earlier weeks as feature pool). File: research/texts/apatea-s2-.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has the metrics and knows cross-validation from classical-ml. They will shuffle the 183 days, split 80/20, report AP, and be wrong three times: the training set contains the test week's future, its labels include ones that did not exist yet, and its test set contains cards the bank had already blocked. The lesson builds the split from the three facts in the opening — labels come δ days late, the model is deployed on days after the last label, blocked cards are not scored — and then asks how to choose hyperparameters without touching the test week. Terms not yet available: delay block, test block, known-card removal, hold-out vs repeated hold-out vs prequential, best-estimated vs optimal.

### Chain of sub-problems
1. **Why not a random split?** — Obvious attempt: shuffle and split. Why it fails: the model is trained on payments from after the test payments (it sees the future), the training labels include ones that arrive after the test week starts, and the fraud of a card spread over days lands on both sides. Answer: cut in time — train on the past, test on the future. Because: deployment scores tomorrow with what was known yesterday, and the estimate must imitate deployment.
2. **Where does the training set end?** — Obvious attempt: train up to the day before the test week. Why it fails: the last δ days before any date have no labels yet (δ ≈ 7 in the data); training on them with their final labels uses information the deployed model never had. Answer: a delay block of width δ between training and test, from which nothing is used. Because: the training set is what was labelled at training time, not what is labelled now.
3. **Which test transactions would actually be scored?** — Obvious attempt: score every transaction of the test week. Why it fails: a card whose fraud was found before the test day is blocked; its later frauds are not scored, and counting them as detections (or as misses) is wrong; it is also why the card id must leave the feature vector — a model would learn "this card was blocked" as a feature. Answer: for each test day d, drop transactions of cards whose frauds were known by d − δ; remaining frauds drop from 74–91 a day to 41–60. Because: the metric counts what the investigators could get.
4. **How to pick hyperparameters without the test week?** — Obvious attempt: tune on the test week, report the test week. Why it fails: the reported number is then optimistic by construction. Answer: a validation set that mimics the test set — same delay, same width — placed before it: shift the whole geometry back by δ_delay + δ_valid (hold-out validation). Its estimates land close (depth 2: AP 0.524 valid vs 0.496 test, CP@100 0.243 vs 0.241). Because: the validation estimate predicts the test estimate only if the validation set stands to its training data exactly as the test week stands to the deployed model's.
5. **Why does the depth sweep show overfitting on validation and still pick the wrong depth?** — The set piece: training AUC climbs to ~0.97 at depth 50 while test AP peaks at depth 4–6 and falls to ~0.31; yet test AUC rebounds to 0.788 at depth 50 and validation AUC picks 50 (0.823) where the test-optimal depth is 4. Answer: the metric chooses the model — AUC is forgiving of the fully grown tree because pure leaves produce two scores that rank most positives above most negatives, while AP punishes it because precision in the top region collapses. Because: the earlier lesson's point, now biting the model selection.
6. **How good is one validation number?** — Obvious attempt: repeat the hold-out on random 70% subsamples of the same training period (repeated hold-out) and take the mean and standard deviation. Why it fails: the four folds share the same period, so their spread (AP std 0.0065) understates the real uncertainty, and each trains on less data. Answer: prequential validation — four folds with the same train/delay/validation geometry each shifted one block further into the past; the spread across folds (AP std 0.022, CP@100 0.014) is 3–8× larger and honest, and the fold estimates agree best with the test week. Because: the variance that matters is across weeks, not across subsamples of one week. Cost: four times the training.
7. **Does prequential fix the AUC problem?** — Answer: no; prequential AUC still picks depth 50. The validation design makes the estimate honest; the metric choice makes the selection honest. Because: they are independent decisions.

### Set pieces and worked examples to recreate
- The block timeline: training blocks, a delay block, a test block, old blocks dropped; then the same shifted back for validation; then four prequential folds. (Handbook Ch5 Figs. 1, 2, 4, 5 — recreate, do not source.)
- The simulator split numbers: 67,240 / 598 frauds training; 58,264 / 385 (0.66%) test; remaining frauds 74–91 → 41–60. (Handbook Ch3, Ch4.4.)
- The depth sweep with the three metrics, train vs test, and the validation pick (AUC → 50, AP → 3, CP@100 → 5; optimal 4/4/5). (Handbook Ch5.)
- Hold-out agreement at depth 2 (0.524 vs 0.496; 0.243 vs 0.241). (Handbook Ch5 Hold-out.)
- Prequential vs repeated hold-out spreads (0.022 vs 0.0065; 0.014 vs 0.0018). (Handbook Ch5.)
- Dataset facts: 919,767 transactions, 8,195 frauds, 2018-06-11 to 09-14, training start 07-25, all deltas 7 days, 4 folds. (Handbook Ch5.)
- The card-id leak argument. (Dal Pozzolo 2018 Sec. VI-A.)
- The sequence paper's gap: test starts more than a week after training ends. (Jurgovsky Sec. 4.1.)
- The sklearn integration trick: a list of (train, test) index pairs as cv, refit=False. (Handbook Ch5 "Integration in scikit-learn".)

### Pitfalls and terms to define
- "Delay block" is not a validation set; it is unused data. The newcomer will try to validate on it.
- "Known compromised at d − δ" — the removal date is δ before the test day, not the end of training; the day-by-day shift matters and is the canonical bug.
- "Prequential" here means the handbook's block folds; module 7 uses the same word for per-instance interleaved test-then-train — say that the two are related and that module 7 will distinguish them.
- Hold-out vs repeated hold-out vs prequential: three names, define each where derived.
- "Best-estimated" vs "optimal" parameters is the next module's vocabulary; here only "the validation pick" and "the test optimum".
- The handbook's week-long delay is a simplification of labels that trickle in; say so.

### Recalled, not re-taught
- Cross-validation and overfitting (classical-ml): one clause.
- AP, CP@k, the AUC/AP reversal (<Ref alert-budget-metrics>); verification latency and blocked cards (<Ref fraud-detection-system>).

## FIGURE PLAN
- draw: key image — the stream of weekly blocks with training, delay and test bands and old blocks greyed; frames shift the geometry back for validation and then stack four prequential folds. <FigureSequence>, 4 frames. Inspired by Handbook Ch5 Figs. 1–5 (recreated; the handbook's own prequential diagram was dropped from the image pool as a schematic).
- draw: a test day's rows with the cards whose fraud was known by d − δ struck out; the remaining-fraud counts before and after. Single <Figure>.
- draw: three-panel metric-vs-depth (AUC, AP, CP@100), train vs test, with the validation pick as a dashed line per metric. Single <Figure>, inspired by Handbook Ch5's panels.
- draw: validation vs test estimates for hold-out, repeated hold-out (±2 std band) and prequential (band), same three panels. Single <Figure>.
- draw: why a random split leaks: a timeline with training rows from the test week's future circled and a card's three frauds split across train and test. Single <Figure>.
- draw: the card-id leak: a card's timeline with "first fraud detected → blocked" and the frauds after it that a backtest would wrongly score. Single <Figure>.

## EXERCISE PLAN
1. [warm-up] Given 14 weekly blocks, δ_delay = δ_test = δ_valid = 1 week and 4 folds, list the block indices of training, delay and validation for each fold.
2. [boundary probe] Set δ = 0: show the delay block vanishes and the removal rule removes only cards found before the test day; then δ = 30 days on the simulator — how many frauds remain to score, and what does that do to the CP@100 ceiling?
3. [claim to refute] "Repeated hold-out with 10 subsamples gives a tighter interval than 4 prequential folds, so it is the better estimate." Name the step that fails (the subsamples share one period; the interval is tight about the wrong quantity).
4. [derivation skipped] Show that the removal rule with d − δ instead of the training end changes the test set day by day, and compute the difference on the simulator's seven test days from the two remaining-card series the lesson gives.
5. [research-shaped] From the depth sweep's numbers, estimate how much AP the AUC-selected depth (50) loses against the AP-selected depth (3) on the test week, and design the one extra experiment that would show whether the loss comes from pure leaves (hint: cap min_samples_leaf).
6. [mixed review] Apply the removal rule to the typology's laundering row (<Ref financial-crime-typology>): what is "a known account" when the label is a report filed months later, and what does the delay block become?
7. FORWARD → `undersampling-calibration`: train the depth-4 tree on the training block with all frauds and one genuine in ten, then read its leaf probabilities on the validation block against the observed fraud rate per leaf; the reader sees the probabilities sit far above the rates before the correction is derived.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: the label delay and blocked cards (fraud-detection-system), AP/CP@k and the AUC/AP reversal (alert-budget-metrics), the simulator (canonical-datasets).
- Contributes: the train/delay/test geometry, known-card removal with the d − δ date, hold-out / repeated hold-out / prequential folds and their spreads, the metric-dependent depth pick.
- Hands off: every later evaluation in the course; gbm-model-selection (best-estimated vs optimal on these folds); transaction-aggregates and point-in-time-features (the delay reappears inside features); stream-learning-and-adaptation (the per-instance prequential); cost-aware-evaluation-lab (the split generator).
