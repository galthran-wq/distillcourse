# A deployed pipeline's monitoring read against the theory — research brief (module 9 APPLICATION)

Lesson: `fraudfinder-monitoring-read` (module: governance, core, planned). NEW. Module-final application (L16): a deployed reference pipeline read against the module.
Goal: Evaluate the monitoring and deployment gates of Google's FraudFinder reference pipeline against this module's results and locate the gates that pass a constant model.

## Sources
- FraudFinder (primary, read in full): bqml/05 Model training pipeline formalization (L2898–3276: BQML logistic regression inside a KFP pipeline; custom component fetching eval metrics; accuracy-gated Condition > 0.95 at L3172/L3227; endpoint create and deploy; upload_model_enpoint hard-codes the model name and picks the most recently updated endpoint L3144–3147); bqml/06 Model deployment (L3277–3659: Explainable AI spec sampled Shapley L3420–3442; deploy; Model Monitoring job — feature schema for drift, training-data sample as skew baseline, explanation spec for attribution skew/drift L3410–3416; EmailAlertConfig, ScheduleConfig monitor_interval hours, RandomSampleConfig 0.5, DriftDetectionConfig 0.05 and SkewDetectionConfig 0.5 per feature L3517–3527, ObjectiveConfig; logs to model_deployment_monitoring_{ENDPOINT_ID}.serving_predict L3906; 9 of 25 features monitored; clean-up L3642–3656); bqml/07 Model inference (L3660–3919: Cloud Run Flask app on a Pub/Sub push subscription; OIDC; ack-deadline 600 s; handler returns 204 always, catches no exceptions; 403 to the browser "is correct"; request/response logs in BigQuery); vertex_ai/06 Formalization (L5253–5743: KFP v1 pipeline of ingest-features, dataset, train, evaluate with an average_precision_score > 0.2 gate at L5418/L5694, create endpoint, deploy; 0.8/0.1/0.1 fractions); vertex_ai/04 (L4296–4322: balancing before the train/test split; L4442–4495: threshold sweep, ROC, argmax(tpr − fpr); L4493–4495: "near-perfect ROC AUC is an artefact of synthetic data; the labs teach architecture, not model quality"; L4411: loop variable reused, "best" model = last); train_xgb.py (log_loss and F1 on hard predictions L4966–5001); main.py (null → 0.0 L6036–6040); PAYLOAD_SCHEMA hand-copied in four places; the dossier's pedagogy note (stale pinned stack: KFP v1, GCPC 0.3.0, python 3.7/3.8 images, tf2-cpu.2-5; inconsistent notebook pointers); 01 EDA (~148M transactions, 5,000 terminals, ~50k customers, ~2% fraud; customers with 8,000–11,000 transactions have fraud rates > 60% — a simulator artefact).
- Baesens Ch6 (the life cycle, SSI, performance lights, calibration tests, documentation test) — the module's results to read against; Ch6 pp.280–281 testing stage (latency, missing/extreme inputs, dummy fraud cases).
- Module 2 (why accuracy 0.95 is passed by "never alert" at 2% fraud; AP as the gate the sibling track uses; balancing before the split as a leak; threshold from costs, not argmax(tpr − fpr)).
- Point-in-time-features brief (skew taxonomy; the zero-filled placeholders; the fill bug) — the serving-side defects re-read as monitoring blind spots.
- Alert-explanations (sampled Shapley attributions as the explanation spec; attribution drift).
- AI Act Art 72–73 (post-market monitoring plan; incident reporting), Art 15(3) (declared metrics), AMLR Art 77 (the record), RTS Art 21 (quarterly monitoring per exemption) — one sentence each: what a regulator would ask of this pipeline; forward.

## Key points
1. The artifact: the DAG (train → evaluate → gate → endpoint → deploy), the monitoring job (skew vs training baseline, drift over time, attribution skew/drift, hourly schedule, 50% sampling, email alerts, logs), the serving handler (store lookup, payload, predict, log). Read as a system, with its clocks.
2. The gate: accuracy > 0.95 with a 2% fraud rate — a constant "genuine" model scores 0.98 and deploys; the sibling track's AP > 0.2 gate as the correct kind (and the threshold's arbitrariness noted); what the module's lights would add (AP and CP@k vs the champion, not a fixed number; the bootstrap light).
3. The monitoring job against the spec: skew (serving vs the training table) and drift (serving over time) per feature with thresholds 0.5 and 0.05 — unjustified defaults; 9 of 25 features; no score PSI; no performance monitoring at all (labels arrive later — the lag the series ignores); attribution drift monitored (good) on the same 9 features; what it would catch (a feature's distribution moving) and what it would miss (prior shift; a label proxy going stale; the zero-filled minute features that never move in training).
4. The serving defects as monitoring blind spots: null → 0.0 turns cold customers into zero-activity customers and the skew monitor sees a plausible value; the handler returns 204 always and catches nothing — failures are invisible; the feature contract copied by hand in four places — the monitor's 9 names can drift from the model's 25.
5. Evaluation hygiene read against module 2: balancing before the split (the test set balanced — a leak); threshold by argmax(tpr − fpr) rather than cost or budget; log_loss on hard labels; "best model = last" bug; AUC 1.0 on synthetic data acknowledged by the authors — the honest note.
6. What a regulator reads (forward to module 10): the request/response log as the record (AMLR Art 77 wants score, assessment, action, disposition — the log has request and response only); the declared metric (AI Act Art 15(3)) is accuracy; no post-market monitoring plan (Art 72); the RTS's quarterly per-exemption monitoring absent (not a card-issuer pipeline, but the shape is the same).
7. Departures (L16): synthetic data with AUC 1.0; a vendor stack frozen at 2023 versions; a guided tour with no autograder; the architecture is correct and the controls are placeholders — the lesson's verdict is about the controls, not the architecture.

## Set pieces & gems
- Accuracy > 0.95 passed by a constant model at 2% fraud.
- Skew 0.5 vs drift 0.05 "with no stated reason"; 9 of 25 features.
- null → 0.0: the cold customer the monitor cannot see.
- Returns 204 always.
- The hand-copied contract in four places.
- Balancing before the split; argmax(tpr − fpr); log_loss on hard labels; "best = last".
- The authors' own honesty note about AUC 1.0.

## Pitfalls
- Vendor product names are the artifact; the lesson's content is the pattern and its defects; no product comparison.
- Spot-the-bug is the lesson's exercise mode, not its tone — stay dry; each defect is named with its consequence, not mocked.
- The capstone's application reuses the architecture image; this lesson reads the monitoring notebooks and the handler, so it sources no image (drawn figures only), to avoid crediting the same file twice without need.

## FIGURE PLAN
- draw: The pipeline DAG with the gate as a diamond ("accuracy > 0.95") and a constant model's path through it highlighted in the warning colour — single figure. Inspired by bqml/05's pipeline description (misc/images/pipeline_run_example.png exists in the repo but is not captured; draw). Key image.
- draw: `<FigureSequence>` (3 frames) of the gate: (1) the class mix 98/2, (2) the constant model's confusion matrix with accuracy 0.98, (3) the same model's AP (0.02) under the sibling gate — the gate that fails it.
- draw: Skew vs drift as two near-identical panels: a feature's serving histogram against the training baseline (skew) and against last week's serving histogram (drift), with the 0.5 / 0.05 thresholds as labels and the question mark on their origin (voita rule 8).
- draw: The monitoring coverage grid: 25 features × (monitored? skew? drift? attribution?) with the 9 monitored rows shaded and the 16 unmonitored (including the zero-filled minute windows) left blank — from bqml/06's threshold lists.
- draw: The serving handler as a flow: message → store read → null→0.0 → payload → predict → log → 204, with the three silent-failure points marked (cold fill, uncaught exception, contract copy).
- draw: The module's monitoring spec grid (from model-risk-monitoring) with a column "present in FraudFinder?" ticked or struck — the verdict as a table.

## EXERCISE PLAN
1. Warm-up: compute the accuracy, AP and CP@k of a constant "never alert" model on a 2%-fraud test table; state which gates it passes.
2. Boundary probe: set the skew threshold to 0 and the drift threshold to 1 — what the job alerts on (everything, nothing); derive from the SSI bands (model-risk-monitoring) a defensible pair and the feature-binning they require.
3. Claim to refute: "The monitoring job covers the model because it tracks attribution drift on the most important features." Refute: 16 features untracked including the zero-filled ones, no score PSI, no performance with lag; name the drift type (prior shift) that attribution drift on 9 features cannot see.
4. Research-shaped: reproduce the balancing-before-split leak on the simulator: balance then split vs split then balance; report test AP under both and the inflation.
5. Derivation the lesson skipped: show that argmax(tpr − fpr) (Youden) is the cost-optimal threshold only when C_FP·(1 − π) = C_FN·π, and compute the cost ratio it silently assumes at π = 0.02.
6. FORWARD (E7): list what the request/response log contains and what AMLR Art 77(1)(b) and the RTS Art 21 report require (score, assessment, action, disposition; per-exemption counts and values) — the reader finds the gap between a log and a record → lands on `eu-aml-single-rulebook` and `psd2-sca-tra`.
7. Mixed review (E3): the null → 0.0 fill (point-in-time-features) seen by the skew monitor: compute the skew statistic on the "count last 15 minutes" feature when 30% of serving customers are cold and all training rows carry 0 — why the monitor stays green.

## ARC
- Inherits: the life cycle and stability tests (model-risk-monitoring); explanations (alert-explanations); the decision gates (score-to-action); the skew taxonomy (point-in-time-features); module 2's metrics.
- Contributes: the module cashed out on a deployed reference — each control named present, placeholder or absent, with the module result that judges it.
- Hands off: the legal reading of the same gaps (module 10); the architecture read in full (eu-transaction-monitoring-design); the capstone's monitor and ledger.
- Spine step 9: from score to governed decision.

## APPLICATION (L16)
- Artifact: GoogleCloudPlatform/fraudfinder notebooks bqml/05–07 and vertex_ai/04–06 plus scripts/cloud_run_model_inference/main.py (public, Apache-2.0 repository).
- Module results used: the life cycle and champion–challenger (model-risk-monitoring); SSI/PSI and performance lights with their δ lag; attribution monitoring (alert-explanations); the gate as a decision (score-to-action); module 2's AP/CP@k vs accuracy.
- Departures from the idealisation: synthetic data with AUC 1.0 (acknowledged by the authors); placeholder thresholds; partial feature coverage; no performance monitoring; a frozen 2023 vendor stack; a guided tour rather than a production system — the architecture is a skeleton and the controls are the lesson's subject.
