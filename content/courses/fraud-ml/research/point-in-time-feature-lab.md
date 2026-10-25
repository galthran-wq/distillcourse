# Lab: a point-in-time feature pipeline — research brief

Lesson: `point-in-time-feature-lab` (module: features, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Build a feature pipeline that turns raw transaction logs into windowed aggregates, conditional aggregates, a delayed terminal risk and a periodic time flag, joined point-in-time onto every scoring row
Opening (verbatim, the lesson must start with it): The lab builds the feature pipeline: windowed aggregates over each entity's past, conditional sums, a terminal risk shifted by the label delay and a circular time feature, joined onto every scoring row as of its own timestamp — and a shipped reference pipeline hides one leak for the learner to find.

## Sources to consult
- Handbook Ch3 "Baseline feature transformation": weekend/night flags, customer rolling features over 1/7/30 days, the delayed terminal risk as two rolling sums, customer 0's parameters 62.26 and 2.18 — `research/texts/reproducible-Chapter_3_GettingStarted_BaselineFeatureTransformation.md`.
- Handbook Ch3.2 simulator description (grid, Poisson counts, Gaussian amounts, three scenarios) — `research/texts/reproducible-Chapter_3_GettingStarted_SimulatedDataset.md`; the generator is rewritten from this description, not copied (GPL v3 code).
- Bahnsen et al. 2016 Table 5 (seven-row aggregation table: 0/0/0/0, 1/250/1/250, 2/650/0/0, 3/900/0/0, 3/700/1/50, 2/150/2/150, 3/400/0/0), Table 6 and Appendix A (von Mises worked example: periodic mean 21:07, arc 15:21–02:52, True; 06:00 against 17:19–01:46, False) — `research/texts/staged-bahnsen2016-feature-engineering.txt`.
- FraudFinder notebook 02 (customer windows with RANGE BETWEEN; terminal risk with 7-day delay; zero-filled placeholder columns) and bqml/04 (read-instances table; last value up to but not after the timestamp) — `research/texts/fraudfinder-gcp.txt`.
- HKU FITE7410 A1 handout, Part I step 6 (numeric ids, per-account transaction counts on PaySim) — `research/texts/hku-fite7410-a1q.txt`, `hku-fite7410-a1a.txt`.
- The module-2 harness (`cost-aware-evaluation-lab`) for the metric checkpoint.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The learner has read three lessons of rules — earlier rows only, labels shifted by the delay, values as of the row — and one application that read a dataset against them. None of it exists as code they wrote. The lab makes them write the pipeline function by function on a raw log, check each function against a hand-computable table, and then catch the one place where a plausible shipped pipeline breaks the rules.

### Chain of sub-problems
1. **From timestamps to flags** — the calendar features are the warm-up: weekday ≥ 5 and hour < 6, checked on known dates (2018-05-01 Monday, 2018-09-30 Sunday).
2. **Windows over earlier rows** — rolling count and mean amount over 1/7/30 days per customer, strictly earlier rows; the obvious `rolling` includes the current row and the wrong variant is declared.
3. **Conditional sums** — the 24-hour window restricted to the same type and country, checked row by row against the seven-row table.
4. **The delayed terminal risk** — two rolling sums shifted by d = 7; the canonical bug is forgetting the shift (using all labels) or shifting the count but not the fraud sum.
5. **The circular flag** — circular mean, concentration, the α = 0.9 arc and the inside flag, checked against the worked example's two rows.
6. **The as-of join** — a timestamped feature log onto scoring rows, last value up to and never after; the wrong variant is a join by id (latest value) or an inclusive "up to and including a later same-second row".
7. **Find the leak** — a shipped reference pipeline that passes every exact check on its own outputs but computes the terminal risk from labels at the test date; the learner names it and the first row where it shows.
8. **Does the matrix help** — a fixed logistic regression on the learner's matrix scored by the module-2 harness on a held-out week.

### Set pieces and worked examples to recreate
- The seven-row table (Bahnsen Table 5) as the literal fixture for checkpoint 3.
- The von Mises worked rows (Bahnsen Table 6) as the fixture for checkpoint 5.
- Customer 0's convergence to 62.26 / 2.18 as a local assert for checkpoint 2 (Handbook Ch3).
- The two-rolling-sums identity for checkpoint 4 (Handbook Ch3 `get_count_risk_rolling_window`).
- The read-instances table and the "up to, never after" rule for checkpoint 6 (FraudFinder bqml/04).

### Pitfalls and terms to define
- Inclusivity of windows is the whole lab: every docstring states "strictly earlier".
- Time zones and same-second ties in the as-of join: the fixture includes a tie.
- The von Mises arc wraps midnight; the inside test must handle an arc like 17:19–01:46.
- Licence: PaySim's Kaggle terms are not stated in the staged paper; the lab ships a simulator-generated log (our generator from the handbook's description) and leaves PaySim as an optional local download with instructions, so nothing of uncertain licence is published.

### Recalled, not re-taught
- The three feature lessons are the lab's prerequisites; the notebook cites each with a <Ref> above the relevant checkpoint and gives one sentence of formula, never the derivation.
- The module-2 harness (`cost-aware-evaluation-lab`) is imported, not rewritten.

## LAB PLAN
Artifact: one notebook producing `features.py`-style functions — `calendar_flags`, `customer_windows`, `conditional_aggregates`, `terminal_risk_delayed`, `periodic_time_flag`, `point_in_time_join` — assembled into `build_feature_matrix(log, feature_log, delay)` that turns a raw transaction log into a scoring-ready matrix; run on a simulator-generated log to produce a matrix scored by the module-2 harness.

CANON GROUNDING: modelled on FraudFinder notebook 02 ("run BigQuery SQL building 1/7/14-day customer and terminal features, add zero-default minute-window columns, create the feature store … ingest with feature_ts, read back three customers. Complete scaffold; verified by SELECT and entity_type.read" — a guided tour with no blanks, which this lab turns into blanks the learner fills) and its bqml/04 point-in-time retrieval ("build the read-instances table, call batch_serve_to_bq for the point-in-time training table"), and on HKU FITE7410 Assignment 1 Part I ("EDA on PaySim (25%) … feature engineering: step mod 24, numeric IDs and per-account transaction counts" — human-marked, no autograder). Departures: the cloud services are replaced by pandas functions with exact checkpoints, because the course's claim is about the definitions, not the platform; the terminal risk's delay and the circular time flag come from the lessons' sources (Handbook Ch3, Bahnsen Table 6), which the canon assignments do not ask for; the hidden leak is the lab's own device, motivated by the reference pipeline's zero-filled columns.

Dataset/inputs: `data/transactions.csv` — a seeded log from our own generator written from the handbook's description (1,000 customers, 2,000 terminals, 60 days, ≈ 130k rows, three scenarios, labels complete), ≈ 6 MB; `data/feature_log.csv` — a timestamped per-terminal feature log with deliberate ties for the as-of checkpoint; the seven-row and the von Mises fixtures as literals in the notebook; `data/holdout_week.csv` (features-only rows for the metric task) with its labels, card ids and dates in `private/`. Licence: our generator (CC BY-SA 4.0 prose described, GPL code not copied). PaySim is NOT shipped: its Kaggle licence is not stated in the staged sources; an optional cell shows how to run the same pipeline on a locally downloaded copy.

Checkpoints (ids as in course.yaml, in order):
1. `calendar-flags` (exact, warm-up): weekend and night flags from a timestamp column on a seeded 200-row frame; wrong variants: `hour <= 6` (the handbook's off-by-one), weekend as `weekday > 5`.
2. `customer-windows` (exact, warm-up): count and mean amount over the previous 1, 7, 30 days per customer, strictly earlier rows; verified on a seeded 500-row frame and by the customer-0 convergence assert locally; wrong variants: window includes the current row; windows computed on the unsorted frame.
3. `conditional-aggregates` (exact): 24-hour count and sum restricted to same type and same country; verified on the seven-row fixture (expected 0/0/0/0 … 3/400/0/0) and a seeded frame; consumes nothing, feeds 8; wrong variant: condition on type only.
4. `terminal-risk-delayed` (exact): risk over [t − (d + w), t − d] for w ∈ {1, 7, 30}, d = 7, as two rolling sums; verified on a seeded terminal history; wrong variants: no delay (labels up to t); delay applied to the count but not the fraud sum; division by zero not guarded to 0.
5. `periodic-time-flag` (exact): circular mean, concentration, α = 0.9 arc and inside flag for a customer's clock times; verified on the Table 6 fixture (21:07; 15:21–02:52 True; 17:19–01:46 False at 06:00) and a seeded set; wrong variants: arithmetic mean; arc that does not wrap midnight.
6. `point-in-time-join` (exact): as-of join of `feature_log` onto scoring rows — last value up to, never after, each timestamp, ties resolved to the earlier record; consumes 4's feature log layout; wrong variants: join by id (latest value); inclusive of later same-second rows.
7. `find-the-leak` (review, optional): the shipped `reference_pipeline()` computes the terminal risk from labels known at the test date; the learner names the function and the first row (terminal, date) where its value differs from checkpoint 4's; rubric accepts "terminal risk uses future labels / no delay shift" with the row; naming a different feature fails.
8. `feature-lift` (metric, optional, LAST): a fixed logistic regression (shipped, frozen hyperparameters) on the learner's full matrix for the held-out week, scored by the module-2 harness's AP against private labels; threshold calibrated so the full matrix clears it with ≥ 0.02 margin and the calendar-only matrix does not.

Final open task: checkpoint 8, metric AP on the held-out week; rough threshold ≈ 0.45 on our generator (to calibrate: full 14-feature matrix with a logistic regression ≈ 0.55–0.60 on the simulator's scale, calendar flags alone ≈ 0.05).

Known-wrong variants worth declaring: the inclusive window, the unshifted terminal risk, the arithmetic clock mean, the join by id, `hour <= 6`.

NOT blanked (ships complete): the generator and loaders, the `reference_pipeline()` (complete and wrong on purpose), plotting helpers (per-customer timeline with windows; the clock-face plot of a customer's times with the fitted arc), the module-2 harness import, the frozen logistic regression and the scoring call.

est_hours: 4. Progression: warm-ups (1, 2) → composing chain (3 and 4 feed the matrix; 6 consumes 4's log layout; `build_feature_matrix` consumes 1–6) → one open metric last (8) → review garnish (7). Required: 1–6.

## ARC
- Spine step 3 "Features are context": "A raw transaction has no fraud signal; the signal is the deviation from the entity's own history, which means windowed aggregates over the cardholder and the terminal, computed from what was known at scoring time — including labels that had not yet arrived."
- Inherits: every result of module 3 — windows and conditional sums (`transaction-aggregates`), the circular flag (`behavioural-profiles`), the delayed risk and the as-of join (`point-in-time-features`), the reading of a log as an artifact (`paysim-feature-matrix`); the harness of `cost-aware-evaluation-lab`.
- Contributes: the module's results as verified code; the feature matrix every later lab scores on.
- Hands off: `build_feature_matrix` to `scorecard-vs-gbm-lab` and `pipeline-capstone-lab`; the as-of join to the capstone's feature lookup; the leak as a thing the learner has now caught, recalled in `real-time-scoring-architecture`.
