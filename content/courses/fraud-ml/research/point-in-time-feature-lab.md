# Lab: a point-in-time feature pipeline — research brief

Lesson: `point-in-time-feature-lab` (module: features, type: lab, planned). NEW.
Goal: Build a feature pipeline that turns raw transaction logs into the handbook's windowed aggregates, Bahnsen's conditional aggregates, a delayed terminal risk and a periodic time flag, joined point-in-time onto every scoring row.

## ARC
- Inherits: the aggregate semantics and the delayed terminal risk (transaction-aggregates), the von Mises flag (behavioural-profiles), the as-of join and the skew taxonomy (point-in-time-features), the harness (cost-aware-evaluation-lab) for the metric checkpoint, the artefact reading of PaySim (paysim-feature-matrix).
- Contributes: the feature builder as verified code (Table 5 and Table 6 reproduced exactly; the terminal risk as a rolling difference; an as-of join); the parity discipline practised on a planted leak.
- Hands off: the feature module to the scorecard lab (features for both detectors) and to the capstone (the feature log the as-of lookup serves).
- Spine step 3 (final item): "…computed from what was known at scoring time — including labels that had not yet arrived."

## LAB PLAN

Artifact: one notebook producing a feature module — `calendar_flags`, `customer_windows`, `conditional_aggregates`, `terminal_risk_delayed`, `periodic_time_flag`, `asof_join` — that turns the reduced simulator's raw log (and a PaySim extract) into a feature matrix, with every value provably computed from strictly earlier rows, and a leak the learner must locate in a shipped "reference" pipeline.

CANON GROUNDING: modelled on FraudFinder notebook 02_feature_engineering_batch (dossier: "customer 1/7/14-day window features, terminal risk features with 7-day delay, placeholder real-time columns, Feature Store ingestion with feature_time"; the SQL RANGE windows and nested delay offsets, lines 979–1235) and on HKU FITE7410 A1 Part I (dossier: "Step 6 feature engineering (step mod 24, numeric IDs and per-account transaction counts)" on PaySim), with Bahnsen 2016's worked Tables 5–6 as the exact fixtures the canon's own paper provides. Departures: the cloud services (BigQuery, Feature Store, Dataflow) are replaced by pandas on a timestamped log; the FraudFinder windows include the current row and the lab makes strictly-earlier the contract (the inclusion is the planted leak); the streaming minute windows are not built here (the capstone's as-of lookup covers the serving side); HKU's R EDA becomes the PaySim extract's sanity cells, shipped complete.

Dataset: (a) the reduced simulator log from the module-2 lab's generator (shipped complete again, seeded; ≈ 150k rows over 70 days with customer, terminal, amount, timestamp, label with a label-arrival timestamp = transaction + δ); (b) `data/paysim_extract.csv`: a 200k-row stratified extract of the Kaggle PaySim log restricted to TRANSFER/CASH_OUT with original columns (≈ 15 MB — if too large, 100k rows; licence CC BY-SA 4.0 per Kaggle, to be confirmed by the human before shipping; fall back to simulator-only if not confirmed); (c) Bahnsen's seven-row and six-row tables as literals. Held-out week features/labels for the metric checkpoint in `private/`.

Checkpoints (plan; lab-author may split or deepen):
1. `calendar-flags` (exact, warm-up): weekend and night (hour < 6 — the handbook's errata say ≤ 6 vs < 6; fix one and state it) flags from timestamps; wrong variant: weekday numbering off by one (Sunday = 0 vs 6).
2. `customer-windows` (exact): count and mean amount over the customer's previous 1, 7, 30 days using strictly earlier rows; verified on a seeded 40-row frame with a hand answer and on Bahnsen's Table 5 for the 24 h case (0/0, 1/250, 2/650, 3/900, 3/700, 2/150, 3/400 counts/sums); wrong variants: window includes the current row; window measured in rows instead of time.
3. `conditional-aggregates` (exact): the same restricted to same type and same country — Table 5's second pair of columns (0/0, 1/250, 0/0, 0/0, 1/50, 2/150, 0/0); consumes 2's window helper; wrong variant: condition applied to the current row's value from the wrong side (rows sharing the NEXT row's country).
4. `terminal-risk-delayed` (exact): fraud rate over [t − (d + w), t − d] as rolling(d + w) − rolling(d), using label-arrival timestamps; verified on a seeded terminal history; wrong variants: d = 0 (uses labels not yet known); divisor from the full window instead of the shifted one.
5. `periodic-time-flag` (exact): circular mean, R̄ → κ, the α-level arc and the inside flag; verified on Bahnsen's Table 6 (periodic mean 21:07 for transaction 6; 06:00 outside 17:19–01:46 → False) and on a seeded set; wrong variants: arithmetic mean of hours; arc not wrapped at midnight.
6. `point-in-time-join` (exact): as-of join of a (entity, feature_time, value) log onto scoring rows — last value ≤ t; verified on a seeded log with values after t planted; consumes 4's log as input; wrong variants: merge on nearest (either side); ≤ replaced by <; no sort by time.
7. `find-the-leak` (review, optional): the shipped reference pipeline includes the current row in its 1-day window; the learner names the function, the row on which the leak first changes a value, and the mechanism (AVG_AMOUNT encodes the row's own amount); rubric accepts any correct localisation with mechanism; "it uses future data" alone insufficient.
8. `feature-lift` (metric, optional, LAST): the learner's feature matrix for the held-out week scored by a FIXED logistic regression (shipped) and the module-2 harness's AP; threshold calibrated so the full feature set clears by ≥ 0.02 and calendar-plus-raw does not (reference: raw+calendar AP ≈ 0.45, full ≈ 0.60 on our reduced simulator — to calibrate).

Final open task: checkpoint 8 — metric AP on the held-out week; rough threshold ≈ 0.55 (calibrate).

Known-wrong variants to declare: current-row inclusion; row-count windows; d = 0 terminal risk; arithmetic hour mean; nearest-merge as-of join; unsorted log.

NOT blanked (ship complete): the simulator generator, data loading, the PaySim sanity EDA (type gate, step mod 24 histogram — HKU's findings reproduced for the learner to look at), the shipped "reference" pipeline (complete, with the planted leak), the fixed logistic regression and the harness import, plotting (timeline with window brackets; clock with arc).

est_hours: 4. Progression: warm-up (1) → composing chain (2 → 3; 4 → 6; 5 independent) → one open metric last (8) → review garnish (7). Required: 1–6.
