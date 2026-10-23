# Point-in-time correctness: as-of joins, feature stores and parity — research brief

Lesson: `point-in-time-features` (module: features, core, planned). NEW.
Goal: Design a feature pipeline whose training rows contain only what was known at each transaction's timestamp and whose serving path computes the same values.

## Sources
- FraudFinder (primary): 02_feature_engineering_batch lines 849–851 (batch over days in SQL, streaming over minutes in Beam, one Feature Store as the single source for training and serving), 993–1006 (feature tables keyed by feature_time), 1237–1358 (placeholder minute-window columns zero-filled for schema agreement), 1360–1688 (why a feature store: real-time reads, same values for training and serving, time-series model supports point-in-time queries; Featurestore → EntityType → Feature; ingestion with feature_time); bqml/04 2448–2545 (read-instances table of entity ids + event timestamp + pass-through label; BatchReadFeatureValues returns the last value up to, but not after, each timestamp — line 2473; labels by LEFT JOIN tx to txlabels; "time travel" to a date when labels are settled — line 2452); vertex_ai/04 L4160–4225 (batch_serve_to_df); 03 lines 1869–2160 (sliding window 1 h / period 1 min; TS_DIFF; new-records filter; 15/30-min counts by conditional sums; composite key entity_windowEnd; WriteFeatureValues); scripts/cloud_run_model_inference/main.py L6022–6106 (online read entity_type.read(entity_ids, feature_ids='*'); None → 0.0; 25-feature payload); PAYLOAD_SCHEMA repeated in bqml/04 (2378–2404), bqml/07 L3733, train_xgb.py L4898, monitoring L3517–3527 (hand-copied contract); the dossier's pedagogy note: "the series never demonstrates the train/serve skew it is built to prevent and never compares streaming values to batch".
- Handbook Ch3.3 and shared_functions: features computed offline on the whole frame with rolling windows — the batch idealisation; Ch2.3: aggregated features computed by the DDM layer; Ch2.4 challenge "near real-time".
- Dal Pozzolo 2018 Sec. II-B: profile features precomputed offline per cardholder, updated once a day; Sec. VI-A card-ID removal.
- Bahnsen Sec. 6: unlimited feature count → per-transaction recomputation latency may exceed decision time.
- Baesens Ch4 p.136 and Ch1 pp.29–30: operational efficiency — real-time scoring cannot afford trend variables or high-latency external data; under 8 seconds.
- APATE Sec. 2.2 and 3: scores recomputed at midnight and used for the next day's transactions; features extracted in real time; six-second rule.
- Altman App. D: GFP processes edges in timestamp order so features use past data only — the same rule on a graph.
- AMLR Art 10(1) last paragraph (new technologies risk-assessed before launch) — one sentence, forward to module 10.

## Key points
1. The as-of join defined: for each row (entity, t), the feature value with the largest feature_time ≤ t — "up to but not after"; the read-instances table; training = as-of reads at each row's timestamp; serving = the latest value. One store, two reads.
2. Three clocks of feature freshness: daily batch (yesterday's aggregates), minute streaming (sliding windows), per-request (computed from the transaction itself). Which features belong on which clock, by latency budget and by label dependence (the delayed terminal risk can only be batch).
3. Label time travel: a feature derived from labels (terminal risk) has a feature_time equal to the label's arrival, not the transaction's; a training set built "as of yesterday" with a 7-day delay must read label-derived features as of t − δ; FraudFinder simplifies to yesterday and says so.
4. Training–serving skew, three forms: (a) different code paths for the same feature (SQL RANGE includes the current row; the pandas version excludes it), (b) different fill values (None → 0 at serving, NaN dropped at training; the cold customer becomes a "zero-activity" customer), (c) placeholder columns zero-filled in training and populated at serving (FraudFinder's minute windows) — the model never saw the feature's real distribution. The parity check as the test the series omits.
5. Sliding-window streaming: one 60-minute window with 1-minute period yields 15/30/60-minute aggregates by conditional sums on TS_DIFF; each element appears in many windows; the new-records filter writes an entity once per period.
6. Contracts: the feature list declared in four places by hand is how parity is lost; a single schema object; the monitoring job covering 9 of 25 features (forward to fraudfinder-monitoring-read).

## Set pieces & gems
- "Last value up to, but not after, each timestamp" (bqml/04 line 2473) — the sentence that defines the lesson.
- The zero-filled placeholder columns (02 lines 1264–1319): training on all-zero streaming features while serving sees real ones.
- None → 0.0 in main.py: the silent cold-start bug.
- The streaming trick (one window, three aggregates) and the composite key.
- APATE's midnight recompute as the batch clock; the six-second budget as the serving clock.

## Pitfalls
- Vendor names are the artifact, not the lesson: describe the design pattern; FraudFinder is quoted for its decisions and its omissions.
- Do not teach the serving system (module 11); this lesson is the data contract.
- The lab's planted leak is the current-row inclusion; keep that example visible here.

## FIGURE PLAN
- draw: The as-of join as a timeline: a feature log for one entity (values at feature_times) above, scoring rows (t₁, t₂, t₃) below, each row's arrow landing on the last value ≤ t — with one row's arrow deliberately pointing past a later value to show what "not after" excludes. Single figure; key image. Inspired by bqml/04's read-instances description.
- draw: `<FigureSequence>` (3 frames): the same timeline for a label-derived feature — (1) frauds occur, (2) labels arrive δ days later and the terminal-risk value updates at that feature_time, (3) the training row reads the value as of its own t, which still shows the pre-label risk.
- draw: One store, two reads: a feature table keyed by (entity, feature_time) with a batch read (as-of each row) and an online read (latest) drawn as two arrows — architecture tiers bottom-up (voita rule 5).
- draw: Training–serving skew triptych: three near-identical panels (code-path difference; fill difference; placeholder difference) each showing the training column and the serving column for the same feature with the mismatching cells highlighted. Inspired by FraudFinder's defects (dossier gems).
- draw: The sliding window: a 60-minute window stepping by 1 minute over an event stream, the 15/30/60-minute sub-counts as nested brackets, and the "new records" (TS_DIFF ≤ period) highlighted. Inspired by 03's pipeline description.
- source: fraudfindera-s1-architecture — stem `fraudfinder-architecture`; the reader must see stream → warehouse → batch and streaming feature engineering → one feature store → training/registry/endpoint/monitoring; centered at the end as the artifact the capstone revisits (vendor diagram, sourced because it is the thing read, not a redrawable idea). Placement note: the capstone's application reuses the same file; credit once per lesson.

## EXERCISE PLAN
1. Warm-up: given a feature log with five (feature_time, value) rows and four scoring timestamps, write the as-of values; then the online (latest) value.
2. Derivation the lesson skipped: show that a 1-day RANGE window that includes the current row and a strictly-earlier window differ exactly by the current row's contribution, and derive the resulting leak into AVG_AMOUNT as a function of n (window count).
3. Boundary probe: a brand-new customer at serving time — the store returns nothing; compare the three fills (0, NaN, "no profile" indicator) under a tree and under a logistic regression trained with NaN rows dropped; name which fill makes the serving distribution unseen at training.
4. Claim to refute: "If training and serving read from the same feature store, training–serving skew is impossible." Refute with the placeholder-column case and the fill case: same store, different values; name the two reads.
5. Research-shaped: replay one simulator day through a pandas "serving path" (per-transaction computation from a feature log) and through the batch rolling computation; diff feature by feature; report which feature differs and by how much (the parity check).
6. FORWARD (E7): build the training set "as of today" for the simulator with a δ = 7 delay and count the rows whose label is not yet knowable; then build it as of 7 days ago and compare the label counts → the reader meets the "which labels when" question → lands on `label-maturation` (and, nearer, the lab's point-in-time join).
7. Mixed review (E3): place the delayed terminal risk (transaction-aggregates) on the right clock (batch, label-time-travelled) and the von Mises arc (behavioural-profiles) on its clock; justify each by latency budget and label dependence.

## ARC
- Inherits: aggregates and profiles (previous two lessons); the delay clock (module 2).
- Contributes: the data contract — as-of reads, feature-time for label-derived features, the three skews, the parity check, the clocks.
- Hands off: the application (paysim-feature-matrix) and the lab; the serving architecture (real-time-scoring-architecture); the monitoring read (fraudfinder-monitoring-read); the training set as-of (label-maturation).
- Spine step 3: features are context.
