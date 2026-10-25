# Point-in-time correctness: label-derived features, as-of joins and parity — research brief

Lesson: `point-in-time-features` (module: features, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Design a feature pipeline whose training rows contain only what was known at each transaction's timestamp — including a terminal risk shifted by the label delay — and whose serving path computes the same values
Opening (verbatim, the lesson must start with it): A terminal's fraud rate over the last month is a strong feature, but the frauds of the last week are not yet known when today's payment is scored. If the training table is built from the final labels, the feature there contains information the live system will never have, and the offline score is a fiction. How do you build every feature so that each training row holds only what was knowable at that row's moment, and the serving path computes the same value?

## Sources to consult
- Handbook Ch3 "Baseline feature transformation", terminal section: the risk over a window shifted back by the delay d = 7, computed as (delay+window rolling sums) minus (delay rolling sums), `get_count_risk_rolling_window`, RISK_WINDOW = NB_FRAUD_WINDOW/NB_TX_WINDOW, 0 if no transaction; terminal 3059 as the example — `research/texts/reproducible-Chapter_3_GettingStarted_BaselineFeatureTransformation.md` (lines ~300–440).
- Handbook Ch3 Baseline_RealWorldData: the depth-2 tree on real data splits on TERMINAL_ID_RISK_30DAY_WINDOW > 0.075 then CUSTOMER_ID_NB_TX_1DAY_WINDOW > 13.5 — `research/texts/reproducible-Chapter_3_GettingStarted_Baseline_RealWorldData.md`.
- FraudFinder notebook 02 (batch features): customer windows with `RANGE BETWEEN n PRECEDING AND CURRENT ROW` over 86400/604800/1209600 s (includes the current row); the terminal risk index with a 7-day delay (fraud count in window minus fraud count in the last 7 days over tx count minus delay count, +0.0001); placeholder minute-window columns zero-filled for schema agreement; the feature store hierarchy and ingestion with feature_time — `research/texts/fraudfinder-gcp.txt` (lines ~979–1688).
- FraudFinder bqml/04 and vertex_ai/04: the read-instances table (entity ids + event timestamp + pass-through label), batch serving that returns the last value up to but not after each timestamp; the label-delay caveat ("time-travel to a date when labels are settled"; the lab goes back to yesterday) — `research/texts/fraudfinder-gcp.txt` (lines ~2448–2545, ~4160–4225).
- FraudFinder main.py and bqml/07: the serving handler reads the online store, replaces None with 0.0, assembles the 24/25-feature payload; the hand-copied PAYLOAD_SCHEMA in four places; the never-run parity comparison — `research/texts/fraudfinder-gcp.txt` (lines ~5962–6106, ~3733).
- HKU FITE7410 A2 code: target encoding by fraud mean computed on the full data before the split — a label leak into test features — `research/texts/hku-fite7410-a2code.txt`.
- Dal Pozzolo 2018 Sec. II-B (aggregated features precomputed offline per cardholder) and Sec. VI-A (card ID removal because cards are blocked after the first detected fraud) — `research/texts/creditcard-tnnls.txt`.
- Lucas & Jurgovsky Sec. 4.1 (likelihood/target encoding is feature engineering that uses labels) — `research/texts/creditcard-.txt`.

## EXPLANATION PLAN
### The problem as the newcomer meets it
Module 2 separated training from test by a delay block because labels arrive late. The previous two lessons built features from earlier rows. This lesson meets the case where a feature is built from earlier *labels*: a terminal's fraud rate. The training table is assembled months later, when every label has arrived, so the natural computation — frauds in the last 30 days over payments in the last 30 days — uses labels that, on the day of the payment, had not been reported yet. The model learns to rely on a number that is sharper than anything the live system can produce; its offline card precision is real on the table and false in production. The second half of the problem is the same leak from the other side: even a correctly built training feature is useless if the serving code computes something slightly different. Terms the newcomer does not have: "point-in-time", "as-of join", "feature log/store", "parity", "training–serving skew", "target encoding".

### Chain of sub-problems
1. **Why a label-derived feature leaks** — Obvious attempt: terminal risk = frauds among the terminal's last 30 days of payments ÷ its payments, on the final table. Why it fails: on day t the frauds of days t−7…t are not yet labelled (verification latency δ ≈ 7); the training feature sees them, the live feature cannot. Answer: compute the rate over the window [t − (d + w), t − d]: labels from the last d days excluded. Because: those are exactly the labels an investigator had produced by day t.
2. **Computing the shifted window cheaply** — Obvious attempt: for each row, filter the terminal's history by two dates. Why it fails: quadratic per terminal, and the lab's pandas will not finish. Answer: two rolling sums over the sorted terminal rows — frauds and counts over (d + w) days minus frauds and counts over d days — then divide; zero where the window is empty. Because: a window that ends d days ago is the difference of two windows that end now.
3. **Does the delayed feature still carry signal** — on a real week the depth-2 tree splits first on the 30-day terminal risk at 0.075 and then on the 1-day customer count at 13.5; on the simulator, scenario 2 (terminals compromised for 28 days) is found by this feature. Because: a compromised terminal stays compromised longer than the delay, so the stale rate still points at it.
4. **Other label-derived features** — target (likelihood) encoding of a category by its fraud mean is the same object; computed on the whole table before the split it leaks the test labels into the test features (the HKU code does exactly this). Answer: any statistic that uses labels is computed as of the row's date minus δ, from training rows only. Because: "uses labels" is the test, not the feature's name.
5. **Which value of a feature belongs to a row** — Obvious attempt: join the training rows to the feature table by entity id. Why it fails: an entity's feature changes over time; a join by id attaches the latest value to every row, including rows from before the value existed. Answer: the as-of (point-in-time) join — for each row, the last feature value recorded up to, and never after, the row's timestamp; the read-instances table of (entity, timestamp, label) is what drives it. Because: the feature a model should learn from is the one the live system would have read at that instant.
6. **Keeping one definition for training and serving** — Obvious attempt: SQL for the training table, application code for the live path, "the same formula". Why it fails: two implementations drift; the reference pipeline declares its feature contract by hand in four places, zero-fills minute-window columns in the batch table while serving real values, and fills a missing feature with 0.0 so a new customer becomes a customer with no activity. Answer: a time-keyed feature log (the feature store) written once and read two ways — as-of a timestamp for training, latest value for serving. Because: one write path means one definition; two reads of one log cannot disagree.
7. **Proving they agree** — Obvious attempt: trust the store. Answer: a parity check — replay a day's events through the serving path, diff the feature vectors against the batch table for the same rows, and count the disagreements per feature; the reference pipeline is built to prevent skew and never runs this check. Because: a skew that is not measured is a skew that is deployed.
8. **The label-settled training date** — assembling a training set on date t means features as of each row and labels settled by t − δ; the reference lab "time-travels" only to yesterday because its labels arrive instantly. Because: this is the delay block of module 2 seen from the pipeline's side (forward to `label-maturation`).
9. **What else must leave** — the card id (blocked cards never return), and any feature whose computation needs the authorisation to have already happened. ★ Starred: batch (days) vs streaming (minutes) features and why both land in one store — forward to `real-time-scoring-architecture`.

### Set pieces and worked examples to recreate
- The delayed terminal risk as two rolling sums: NB_FRAUD_DELAY_WINDOW − NB_FRAUD_DELAY over NB_TX_DELAY_WINDOW − NB_TX_DELAY, windows 1/7/30 days, delay 7, terminal 3059 (Handbook Ch3 feature chapter, `get_count_risk_rolling_window`).
- The real-data tree: TERMINAL_ID_RISK_30DAY_WINDOW > 0.075 AND CUSTOMER_ID_NB_TX_1DAY_WINDOW > 13.5 (Handbook Ch3 Baseline_RealWorldData, Fig. 2).
- The read-instances table (customer, terminal, timestamp, label) and "last value up to, but not after, each timestamp" (FraudFinder bqml/04 lines ~2463–2473).
- Zero-filled minute features in training vs real ones in serving; the 24-column payload schema hand-copied in notebook, Cloud Run app, training script and monitoring config (FraudFinder 02 lines ~1264–1319; bqml/06 lines ~3517–3527).
- None → 0.0 in the inference handler (FraudFinder main.py lines ~6036–6040).
- Target encoding on the full insurance table before the 70/30 split (HKU a2code).
- The "time-travel to a settled date" caveat, done only to yesterday (FraudFinder bqml/04 line ~2452).

### Pitfalls and terms to define
- "Point-in-time" and "as-of join": define with a two-row picture (feature values at 09:00 and 14:00; a payment at 12:00 gets the 09:00 value) before the term.
- "Feature store": a time-keyed log with two read modes, not a product; name no vendor in the body.
- "Training–serving skew" vs "drift": skew is the same feature computed differently now; drift is the data changing later (module 7); keep them apart.
- Window inclusivity: the reference SQL window includes the current row; the handbook's delay formula excludes the last d days; state both conventions.
- "+0.0001" in the reference risk denominator is a divide-by-zero guard, not part of the definition.
- Do not use "feedback samples" or "delayed samples" (module 8); say "labels that had arrived".

### Recalled, not re-taught
- Verification latency and the delay block (`fraud-detection-system`, `delayed-labels-prequential`): one clause each.
- Windowed aggregates and the earlier-rows rule (`transaction-aggregates`): recalled, with the new rule stated as its extension to labels.
- Data leakage in general (classical-ml): the reader knows the word; the lesson adds the two fraud-specific forms.

## FIGURE PLAN
- draw: key image — a terminal's timeline with payments and frauds; the 30-day window and the 7-day delay drawn so the risk window [t−37, t−7] is visible; `<FigureSequence>` 3 frames: the naive window ending at t, the labels not yet known shaded out, the shifted window that remains (inspired by the handbook's delay description; redrawn).
- draw: the two-rolling-sums construction as a bar diagram: sum over 37 days minus sum over 7 days = sum over the shifted window; single `<Figure>`.
- source: reproducible-wl-decision-tree — stem `wl-depth2-tree`; the reader must see the two split conditions (terminal risk 30-day > 0.075, customer 1-day count > 13.5) with their leaf counts on real data; centered, under the "does it still carry signal" section (check legibility of node text; if unreadable, draw instead and drop).
- draw: the as-of join as two timelines: a feature log with values at 09:00 and 14:00 and payments at 08:30, 12:00, 15:00, arrows to the value each receives (12:00 → 09:00's value); single `<Figure>` (inspired by the read-instances table).
- draw: one feature log, two reads: batch read "as-of t" for training rows, online read "latest" for the live payment; single `<Figure>` (inspired by the reference architecture, no vendor icons).
- draw: `<FigureSequence>` 3 frames of skew: training table with zero-filled minute columns → serving payload with real minute values → the parity diff per feature with the disagreeing column highlighted.
- draw: the training set as of date t: rows up to t, features as of each row, labels settled only up to t − δ, blocked cards struck out; single `<Figure>`.

## EXERCISE PLAN
1. [warm-up] For a terminal with payments and frauds listed by day over 40 days, compute the 30-day risk with delay 7 on day 40 by the two-sums method and check it against a direct count.
2. [boundary probe] Set the delay to zero and to a value larger than the window; show what the shifted risk becomes in each case and why the second is identically zero.
3. [claim to refute] "Target-encoding the terminal id by its fraud mean on the training rows only is point-in-time correct." Refute: the training rows' labels include frauds reported after each row's date; the step that fails is "as of the row", not "training only".
4. [derivation skipped] Show that an as-of join of n payments onto a feature log of m timestamped values costs O((n + m) log(n + m)) after sorting, with a two-pointer merge, and why a naive per-row filter is O(nm).
5. [research-shaped] On the simulator, train a depth-5 tree on the naive 30-day terminal risk and on the delayed one, evaluate both with the module-2 harness on a test week, and report the CP@100 gap — the size of the fiction.
6. [mixed review] Apply the undersampling correction of `undersampling-calibration` to the model of exercise 5, and explain why a leaky feature cannot be repaired by recalibration.
7. FORWARD → `label-maturation`: compute, for each day of the simulator's test month, the share of that day's frauds that would be labelled by day + 7, + 30 and + 90 under a dispute clock drawn from a given distribution; the reader sees labels mature at different speeds before the lesson that names label sources.

## ARC
- Spine step 3 "Features are context": "A raw transaction has no fraud signal; the signal is the deviation from the entity's own history, which means windowed aggregates over the cardholder and the terminal, computed from what was known at scoring time — including labels that had not yet arrived."
- Inherits: verification latency and the delay block (`fraud-detection-system`, `delayed-labels-prequential`); windowed aggregates (`transaction-aggregates`).
- Contributes: the delayed terminal risk, the as-of join, the feature log read two ways, the parity check, the training set as of a date.
- Hands off: the leak to find in `point-in-time-feature-lab`; the store and the serving path to `real-time-scoring-architecture`; label settling to `label-maturation`; skew monitoring to `fraudfinder-monitoring-read`.
