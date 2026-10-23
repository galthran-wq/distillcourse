# Real-time scoring: latency budgets, feature stores and the rule layers — research brief

Lesson: `real-time-scoring-architecture` (module: system, core, planned). NEW.
Goal: Design the serving path of a fraud detector — latency budget, batch and streaming features from one store, rule layers around the model, daily retraining — and verify offline/online parity.

## Sources
- Handbook Ch2.3 (the five layers with their clocks: terminal and blocking rules in ms before authorisation; scoring rules and DDM near real time (< 1 s); investigators offline; aggregated features computed by the DDM layer); Dal Pozzolo 2018 Sec. II-B, II-D (profile features precomputed offline per cardholder; DDM retrained once a day at end of day; rules edited by humans); APATE Sec. 2.2 and 3 (six-seconds rule; acceptance check → online sanity check → offline sanity check; features extracted in real time; network scores recomputed at midnight for the next day; Fig 3 sliding window); Baesens Ch1 pp.29–30 (under 8 seconds; real-time trend variables may be infeasible), Ch4 p.136 (no high-latency external data in real-time scoring), Ch6 pp.280–281 (testing latency such as under 5 s; missing/extreme inputs); Bahnsen Sec. 6 (feature recomputation latency may exceed decision time).
- FraudFinder (primary for the serving pattern): 03 streaming (Beam sliding window 1 h / period 1 min; TS_DIFF; new-records filter; 15/30/60-min counts by conditional sums; composite key entity_windowEnd; WriteFeatureValues; lines 1869–2160); 02 batch windows and the feature store (one store for training and serving; lines 849–851, 1360–1688); bqml/07 and main.py (Pub/Sub push → Cloud Run → store lookup → payload → endpoint predict → BigQuery log; OIDC; ack-deadline 600 s; 204 always; null → 0.0; L3779–3891, L5962–6106); bqml/04 online loop (print raw message, payload, prediction; 2821–2876); the PAYLOAD_SCHEMA contract copied four times; README's architecture (stream → warehouse → batch and streaming features → store → training → registry → endpoint → Cloud Run → monitoring, with the feedback loop to the warehouse).
- Point-in-time-features brief (as-of reads, feature_time, the three skews, the parity check as the omitted test); fraudfinder-monitoring-read (the silent failures); model-risk-monitoring (the monitored quantities and their clocks); concept-drift (daily retraining; Dal Pozzolo 2014's cadence); alert-feedback-selection-bias (the daily F/D loop as the retraining input); guilt-by-association (APATE's midnight exposure recompute as a batch graph layer); score-to-action (the decision zones the serving path executes); psd2-sca-tra / tra-exemption-engine (the exemption lane inside the decision); AI Act Art 12 (automatic logs), AMLR Art 77 (records), RTS Art 29 (traceability, synchronised timestamps) — one sentence each.
- Altman Sec. 3.1 and Fig. 6 (cross-bank sharing: private vs shared graph) and AMLR Art 75 (partnerships) — one paragraph on the cross-institution variant of the architecture; Handbook Ch7.1 (federated averaging of same-architecture weights) — one line.

## Key points
1. The clocks as the design driver: authorisation in seconds (six / eight); the model's share under one second; rules in milliseconds; aggregates precomputed; graph exposure at midnight; retraining nightly; labels in days to weeks — each feature is assigned to the fastest clock that can compute it without reading the future (point-in-time) and within the budget (latency).
2. Three feature paths into one store: batch (daily windows, delayed terminal risk, exposure scores), streaming (minute windows by one sliding window with a period; the conditional-sum trick; the new-records filter), per-request (the transaction's own fields and the calendar flags) — the store keyed by (entity, feature_time) serving the online read (latest) and the training read (as-of).
3. The serving path as a sequence: message → entity ids → store lookup (customer, terminal) → payload assembly against ONE schema object → score → decision (zones; the exemption lane; blocking rules before, routing rules after) → log row (score, attributions, decision, state) → acknowledgement; the failure modes read from the reference: null → 0.0 (cold entity), 204-always (invisible failures), a schema copied by hand.
4. Parity as a test: replay a day's stream through the serving path, diff feature by feature against the batch computation, assert zero on the batch-clock features and bounded lag on the streaming ones; which skews it catches (code-path, fill, placeholder) and the one it cannot (a feature that is zero in training by design).
5. The rule layers around the model: blocking rules (fast, very precise) before scoring; scoring rules and the model in the same latency slot; routing rules after; decision tables (score-to-action) as the engineering of the rule layers; who edits what (rules by humans; the model by retraining).
6. Retraining as part of serving: nightly on feedbacks + delayed samples (the F/D loop), the window and forgetting policy, the model registry and the champion–challenger switch (model-risk-monitoring); the pre-determined-change clause (AI Act Art 43(4)) as the documentation of this cadence.
7. ★ Starred: cross-institution variants (shared graph/model; federated averaging; partnerships under Art 75) with AMLworld's numbers; the Pub/Sub/Cloud Run mechanics as one vendor's instance; RTS Art 29's traceability (unique session ids, synchronised timestamps) as the log's spec.

## Set pieces & gems
- The clocks table: ms / < 1 s / midnight / nightly / days–weeks.
- One 60-minute window → three aggregates (15/30/60) by conditional sums.
- "Up to but not after" served by one store to two readers.
- null → 0.0 and 204-always: two silent failures in one handler.
- The parity diff as the test the reference never ran.
- Six seconds (APATE) / eight seconds (Baesens) / under one (handbook) — three sources, one budget.

## Pitfalls
- No vendor tutorial; name the pattern; cite FraudFinder for its decisions and omissions only.
- Keep this lesson on the serving and feature paths; labels and the training set are label-maturation; the legal overlay is the design lesson.
- The parity check is a test, not a monitor: say where it runs (pre-deployment and after each pipeline change) vs the monitors of module 9.

## FIGURE PLAN
- draw: The serving architecture as tiers bottom-up (stream → store → scoring → decision → log) with three feature paths entering the store (batch/streaming/per-request) and the clocks written on each arrow — single component figure; key image (voita rule 5).
- draw: `<FigureSequence>` (5 frames) of one transaction through the path: (1) arrives, blocking rules, (2) store lookup returns customer and terminal features with their feature_times, (3) payload assembled, (4) score → zone → exemption lane check, (5) log row written and the acknowledgement — one element per frame.
- draw: The sliding window with a period: a 60-minute window stepping each minute over an event stream, the 15/30-minute sub-windows nested, "new records" highlighted — reused idea from point-in-time-features, now with the write to the store shown.
- draw: The parity diff: two columns of feature values (serving replay vs batch) for one day with the mismatching cells highlighted and the three skew types labelled — a table figure.
- draw: The rule layers around the model as a horizontal pipeline: blocking rules → [scoring rules + model] → routing rules → queue, with "who edits" under each (humans / retraining / humans).
- draw: The nightly cycle as a clock face: score all day → collect feedbacks → append delayed samples → retrain → register → challenger check → deploy at midnight → exposure recompute — one figure.
- source: fraudfindera-s1-architecture — stem `fraudfinder-architecture` — NOT used here (sourced in point-in-time-features and in eu-transaction-monitoring-design); this lesson draws its own.

## EXERCISE PLAN
1. Warm-up: assign each of twelve features (calendar flags, 1-day count, 30-day terminal risk, 15-minute count, exposure score, von Mises flag, amount, device id) to a clock and a path, with the reason.
2. Derivation the lesson skipped: show that for a sliding window of width W and period p, each event is included in ⌈W/p⌉ windows, and that the "new records" filter (TS_DIFF ≤ p) selects each event exactly once; derive the storage written per hour for N events.
3. Boundary probe: a streaming feature whose window is shorter than the serving latency (a 1-second count on a 2-second path) — what the serving read sees; and a batch feature read at 00:05 when the midnight recompute has not finished — the as-of read's answer and why the training set must use the same cut-over time.
4. Claim to refute: "The parity check passed, so there is no training–serving skew." Refute with the placeholder case (zero in training by design): the diff is zero because both paths agree on a value the model never learned from; name the test (a distribution comparison between the training column and the serving column) that catches it.
5. Research-shaped: implement the replay-and-diff on the simulator for one day with the module-3 feature module as the batch path and a per-transaction loop as the serving path; report the features that differ and the magnitude.
6. FORWARD (E7): extend the log row with what the nightly retrain needs (which transactions were alerted, their dispositions, when their labels will settle) — the reader specifies the labelling pipeline → lands on `label-maturation`.
7. Mixed review (E3): place the TRA engine (tra-exemption-engine) in the serving path: which features its six flags read, on which clock, and where its controller state lives (a batch-clock value read per request).

## ARC
- Inherits: the five layers (fraud-detection-system); the as-of contract and skews (point-in-time-features); decisions (score-to-action); the cadence (concept-drift, drift-strategies-on-worldline); the F/D loop (alert-feedback-selection-bias); the exemption engine; the monitoring read.
- Contributes: the serving design — clocks, three feature paths into one store, the path with its failure modes, parity as a test, rules around the model, retraining as part of serving.
- Hands off: the labelling pipeline (label-maturation); the full design with the legal overlay (eu-transaction-monitoring-design); the capstone's as-of lookup and daily loop.
- Spine step 11: "The system assembles it all: real-time scoring on point-in-time features served from one store, labels that mature over weeks and feed a retraining cadence, monitoring that closes the loop, and a record the regulator can audit."
