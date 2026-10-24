# Lab: the pipeline on the simulator stream — research brief

Lesson: `pipeline-capstone-lab` (module: system, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. This brief is what the lab-author skill is grounded in.
Goal: Assemble the full detector on the handbook simulator's stream — point-in-time feature lookup, daily scoring with a top-k alert queue, feedbacks and delayed labels feeding a retraining cadence, a stability monitor, the PSD2 fraud-rate controller and an alert ledger — and report cumulative card precision over the stream
Opening (verbatim, the lesson must start with it): Every lab so far built a part; this one runs them as a system over a simulated stream: features as of each day, a model retrained on what the investigators returned, alerts capped at the budget, a monitor and a controller watching the result, and a ledger that records why each alert was raised.

## Sources to consult
- FraudFinder (research/texts/fraudfinder-gcp.txt): 02 (batch windows, delayed terminal risk, feature_time ingestion), bqml/04 (read-instances table, point-in-time batch serve, the online loop), bqml/07 and main.py (the serving handler and its request/response log) — guided tours, the shape of the loop; bqml/06 (skew/drift monitoring on the training baseline) for the monitor's baseline idea.
- Dal Pozzolo 2018 (research/texts/creditcard-tnnls.txt): Sec III Eqs 1–6 (A_t top-k, F_t, D_{t−δ}, P_k, CP_k, NCP_k; the 40-of-100 / 50-cards example CP 0.4, NCP 0.8), Sec V Algorithm 1 and V-A (train on Q days of feedbacks and M days of delayed samples, P_A = αP_F + (1−α)P_D, α = 0.5, Q = δ + M; random forest with balanced bootstrap), Sec VI-A (card id removed), Table III (AW P_k 0.77 vs W 0.61; CP_k 0.37 vs 0.25).
- Handbook Ch3.2–3.3, Ch4.4, Ch5, shared_functions (reproducible-Chapter_3_*, Chapter_4_PerformanceMetrics_TopKBased.md, Chapter_References_shared_functions.md): the simulator's description, the 14 features, get_train_test_set's known-card rule, card_precision_top_k with remove_detected_compromised_cards, prequentialSplit — semantics only (GPL code not copied).
- Baesens Ch6 (fraudanalyti-s6-ch6-7.txt): SSI = Σ(obs − exp)ln(obs/exp) with 0.10 / 0.25 lights, the worked 0.0605 and 0.304 (Tables 6.6, 6.8); case-management ledger fields (priority, routing, audit trail).
- PSD2 RTS (research/texts/directiveeu-rts.txt): Art 19(1) (value-weighted 90-day rate, fraud whether recovered or not, SCA'd and exempted in the denominator), Art 20 (two consecutive quarters above → cease; one quarter below → resume), the Annex (0.13% / 0.06% / 0.01% for cards at EUR 100 / 250 / 500).
- AMLR Art 77 (regulationeu-s4-amlr-ch4-end.txt): the assessment record kept whether or not reported — the ledger's legal shape.
- The module-2, module-3 and module-7 lab briefs (research/cost-aware-evaluation-lab.md, point-in-time-feature-lab.md, drift-detector-lab.md): the harness, the feature pipeline and the scorer this lab imports.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The learner has a harness (M2 lab), a feature pipeline (M3 lab), two detectors (M4 lab), anomaly scorers (M5), a propagator (M6 lab) and a stream toolkit (M7 lab). None has run as a loop over days with labels arriving late and alerts chosen by the model. The capstone is that loop. What the learner must hold before the first cell: the loop's order inside a day (lookup → score → queue → feedbacks → delayed labels → retrain → monitor → ledger) and that every number the system reports is defined on cards per day under a budget.

### Chain of sub-problems
1. **Features for today's rows without looking at today** — an as-of lookup from a timestamped feature log (M3 lab's join, now called daily). Because: the store answers "what was known at t".
2. **A day's alerts** — score, collapse to cards (max score), take the top k, one alert per card; the feedback rows are all recent rows of the alerted cards. Because: the budget is cards, and the investigators review the card's recent history.
3. **Labels arriving** — feedbacks now; everything from day t − δ after δ days with silence as genuine; cards blocked after a confirmed fraud removed from later days' candidates. Because: M11's label clocks and M2's known-card rule.
4. **Retraining** — two models (feedbacks over Q days, delayed samples over M days) averaged at α = 0.5, against one pooled model as the baseline the learner must beat. Because: M8's result.
5. **Watching the inputs** — SSI of the score distribution per period against the training baseline with the 0.10 / 0.25 lights. Because: M9's monitor; the M7 detector sits on the output side and is optional here.
6. **Watching the law** — the rolling 90-day value-weighted rate per band with the two-quarter trip and one-quarter reset. Because: M10's controller.
7. **Remembering why** — one ledger row per alert: score, top attributions, action, disposition, timestamps, kept whether escalated or not. Because: M11's record is M8's label.
8. **One number** — cumulative CP@100 over the stream. Because: the system is judged where the investigators are.

### Set pieces and worked examples to recreate
- The worked CP_k / NCP_k example: 40 of 100 detected, 50 fraud cards that day → CP 0.4, NCP 0.8 (Dal Pozzolo 2018 Sec III).
- Algorithm 1 with δ = 7, M = 2, Q = 9 and the training-window timeline (Fig. 4).
- Table III's AW vs W contrast as the number the learner's checkpoint 4 reproduces in kind (0.77 vs 0.61 on real data; our stream gives its own pair).
- SSI worked to 0.0605 (green) and 0.304 (red) (Baesens Tables 6.6, 6.8).
- The Annex bands and Art 20's switch as a state machine with three states (exempting, tripped, resuming).
- The ledger row against Art 77(1)(b) and Baesens' case-management fields.

### Pitfalls and terms to define
- "Feedbacks" are rows of alerted CARDS, not the alerted rows only.
- Delayed labels at t − δ include the feedback rows of that day too (F_{t−δ} ⊂ D_{t−δ}); the two models' training sets overlap by design.
- The known-card rule applies to candidates for alerting, not to retraining rows.
- The fraud rate is value-weighted and its denominator includes the SCA'd flow; a count-weighted rate is the canonical bug.
- SSI bins come from the training baseline, fixed; re-binning each period hides the drift.
- The ledger must be written before the disposition exists (the disposition is appended later): two writes, one row.

### Recalled, not re-taught
- Everything, by <Ref>: CP@k, folds, known-card removal (M2); the as-of join and the terminal risk (M3); feedbacks/delayed samples (M8); SSI (M9); the RTS rate and Art 20 (M10); the serving path and the ledger (M11). The notebook's prose points, never re-derives.

## LAB PLAN

Artifact: one notebook that runs a `FraudSystem` class day by day over a simulated stream — `asof_lookup`, `daily_alerts`, `label_arrival`, `retrain_feedback_delayed`, `stability_monitor`, `fraud_rate_controller`, `ledger` — importing the module-2 harness (`card_precision_top_k`, `savings`, `undersampling_correction`), the module-3 feature pipeline and the module-7 windowed scorer, and ending with cumulative CP@100 over a held-out stream.

CANON GROUNDING:
- FraudFinder notebooks 02, 04 and 07 (dossier `assignments`: "run BigQuery SQL building 1/7/14-day customer and terminal features … ingest from BigQuery with feature_ts"; "build the read-instances table, call batch_serve_to_bq for the point-in-time training table … score 10 live Pub/Sub transactions with features looked up from the store"; "deploy the provided Cloud Run container … then query serving_predict in BigQuery"). These are guided tours — every cell is given, nothing is blanked, verification is by eyeballing outputs — so they ground the SHAPE of the loop (store → point-in-time table → daily scoring → online lookup → logged scores), not the exercise form. Departure: the lab blanks each stage and verifies it; it replaces the vendor services with an in-memory feature log and a pandas loop, and adds what the series lacks (a delay block, a budget, a feedback classifier, a monitor the theory justifies, a controller, a ledger) — exactly the parts `eu-transaction-monitoring-design` added.
- Dal Pozzolo 2018 Algorithm 1 (Sec V): "train F_t on Q days of feedbacks, D_t on M days of delayed samples, P_A(+|x) = α P_F + (1−α) P_D, α = 0.5" with the alert, feedback and delayed-sample definitions of Sec III — checkpoints 2–4 implement it as the paper states it (daily loop, k cards, δ = 7). Departure: a gradient-boosted tree or random forest without the balanced bootstrap is allowed; the paper's 10 repetitions and Friedman ranking are replaced by one seeded run and the exact checkpoints.
- The module-2 and module-3 labs' canon (CS6890 PS3, HKU A2, HKU A1 Part I) carries through by import; no new canon claim is made for the pieces reused.

Dataset / inputs (all shipped, all ours):
- `data/stream_days_1_90.csv` (≈ 90 days at a reduced scale — 1,000 customers, 2,000 terminals, ≈ 2,000 rows/day, the three scenarios at the paper's rates, plus remote-payment flags and amounts in the three bands for the controller): our handbook-style simulator written from the published description (the handbook's code is GPL v3 and is not copied); labels for days 1–90 ship, because the loop needs them to simulate arrival.
- `data/stream_days_91_150.csv`: the held-out stream's rows (features only, with card ids and timestamps); `private/stream_days_91_150_labels.csv` and `private/dispute_delays.csv` (per-fraud label arrival day) for the metric checkpoint — the server replays the learner's submitted daily alert lists against them.
- `data/baseline_bins.json`: the SSI baseline bin edges from days 1–30 (shipped, so the monitor's baseline is fixed).
- Small fixtures for the exact checkpoints: a 7-day mini-stream (≈ 200 rows) with hand-computable answers; a 20-row ledger example; a 120-day remote-payment table for the controller with a planted breach in quarter 2.

Checkpoints (ids as in course.yaml; the lab-author may split or deepen):
1. `feature-asof-lookup` (exact, warm-up): point-in-time lookup from a timestamped feature log for a day's scoring rows (last value up to, never after, each timestamp); verified on the mini-stream; wrong variants: ≤ vs < at equal timestamps; a merge that takes the latest value regardless of time.
2. `daily-alert-queue` (exact, warm-up): one day's scores → card collapse (max score) → top k = 100 with one alert per card → the feedback rows (all recent rows of the alerted cards within Q days); consumes 1; wrong variants: top-k transactions instead of cards; feedbacks = alerted rows only.
3. `label-arrival` (exact, warm-up): given day t, return the feedback labels available at once, the delayed labels of day t − δ with silence as genuine, and the candidate rows for day t + 1 with blocked cards removed; consumes 2; wrong variants: delayed labels at t instead of t − δ; blocked cards removed from the retraining rows instead of the candidates.
4. `feedback-delayed-retrain` (exact): two models on F (Q days) and D (M days), P_A = 0.5 P_F + 0.5 P_D, against one pooled model; verified by the ranking of a seeded day's scores (digest) and by the identity that α = 1 returns the feedback model; consumes 3 and the mini-stream; wrong variants: pooled training reported as the aggregate; α applied to logits instead of probabilities (the manifest fixes probabilities).
5. `stability-monitor` (exact): SSI of the score distribution per 7-day period against the shipped baseline bins with the 0.10 / 0.25 lights; verified against Baesens' worked 0.0605 on a shipped table; consumes 4's scores; wrong variants: natural log vs log10 mixed (the manifest fixes ln); bins re-estimated per period; the 0.25 light at ≥ vs >.
6. `fraud-rate-controller` (exact): rolling 90-day value-weighted rate per band, numerator fraud whether recovered or not, denominator all remote value in the band (exempted and SCA'd), quarterly evaluation, trip after two consecutive quarters above the Annex reference, resume after one below; verified on the 120-day table with the planted breach; wrong variants: count-weighted; denominator exempted only; trip after one quarter.
7. `alert-ledger` (exact): a per-alert row — alert id, card, day, score, top-3 attributions (from the model's feature contributions, helper shipped), action, disposition (appended when it arrives), timestamps — appended for every alert whether or not escalated; verified by the row set after three days of the mini-stream; consumes 2 and 3; wrong variants: dropping closed-as-nothing alerts; overwriting the row on disposition instead of appending the field.
8. `parity-report` (review, optional): the learner replays day 30 through the serving-style lookup (1) and diffs against the batch features; rubric accepts an answer that names the feature that disagrees (a shipped reference batch table carries a planted terminal risk computed with today's labels) and says why (the delay).
9. `cumulative-card-precision` (metric, optional, LAST): the learner's assembled system over days 91–150 submits its daily alert lists; the server computes cumulative CP@100 with detected cards removed against the private labels and dispute delays.

Final open task: cumulative CP@100 over days 91–150; rough threshold ≈ 0.26 — calibrated by running the reference (the feedback–delayed aggregate with a depth-6 tree retrained daily ≈ 0.31 on our stream; a static model trained on days 1–60 ≈ 0.22; the reference must clear the bar by ≥ 0.02).

Known-wrong variants to declare: listed per checkpoint; the canonical bugs are the timestamp inequality (1), transaction-level top-k (2), delayed labels at t (3), the pooled model passed off as the aggregate (4), per-period re-binning (5), the count-weighted rate (6), the dropped closed alerts (7).

NOT blanked (ship complete): the simulator, loaders, the module-2 harness and module-3 pipeline as imported modules (with their own checkpoints already passed), the attribution helper, plotting helpers (daily CP@100 with the retraining and trip events marked; SSI per period with the lights; the 90-day rate per band against the reference line), the `FraudSystem` skeleton with its day loop and docstrings (the stages are the learner's).

est_hours: 5. Progression: warm-ups (1, 2, 3) → composing chain (3 → 4 → 5 and 7; 6 independent, consumes the loop's alerts for the exempted flow) → one open metric last (9) → review garnish (8). Required: 1–7.

## ARC
- Spine step 11 "The system": "The system assembles it all: real-time scoring on point-in-time features served from one store, labels that mature over weeks and feed a retraining cadence, monitoring that closes the loop, and a record the regulator can audit."
- Inherits: every lab (the harness, the pipeline, the scorers, the propagator, the stream toolkit) and the design of `eu-transaction-monitoring-design`; the daily loop (`alert-feedback-selection-bias`), the monitor (`model-risk-monitoring`), the controller (`tra-exemption-engine`), the ledger (`label-maturation`), the serving path (`real-time-scoring-architecture`).
- Contributes: the course's argument as a running system with one number.
- Hands off: nothing — the course's last lesson.
