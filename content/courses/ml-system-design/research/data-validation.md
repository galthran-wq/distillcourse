# Data validation pipelines — research brief

Lesson: `data-validation` (module: training-data, core, planned). MODULE-FINAL APPLICATION LESSON (L16).
Goal: Build a schema-driven data-validation pipeline — statistics, drift comparators, anomaly triage — and reproduce the reasoning behind the Google Play skew fix.

## Sources
- TFX paper (research/texts, full): §3.1 data analysis (streaming descriptive stats); §3.3 data validation — the versioned schema (presence/type/valency/domain), Figure 2's worked anomaly pair ('EDUCATION' unseen domain value → widen schema vs num_impressions NULL → deprecate feature), actionable-anomaly design principles; §5.5 the adoption-psychology finding (nobody asked for validation until an incident; on-by-default); §7 the case study — serving-log stats vs training stats, always-missing features found, +2% install rate by online A/B.
- MLPS Ch.2 (pp.15-19): TFDV mechanics — schema inference, three skew types (schema/feature/distribution; L∞ for categorical, Jensen–Shannon for numeric); the imbalanced spam/ham worked example. Ch.4 (pp.46-47): schema environments (label required in Training, absent in Serving); skew_comparator/drift_comparator.
- Made With ML testing lesson: Great Expectations — expectation suites (schema/type/null/uniqueness/leak expectations) as the code-level counterpart.
- DMLS Ch.8 (p.251-255): the four monitorable artifacts ordering — plant lightly; module 6 owns it.
- Sculley §7: prediction bias + up-stream producer SLAs — the monitoring cousins, one Remark.

## Key points
1. APPLICATION SPEC. Artifact: the TFX data-validation component + the Google Play incident, read end to end. Module results used: the schema formalizes feature contracts (features-at-scale's lifecycle/ownership), the comparators operationalize skew measurement (training-serving-skew's gap #3 — the same-day serving-vs-training stats comparison IS the instrument), and leakage guards (label present only in training = schema environments). Measured payoff: fixing the found skew bought +2% installs in an online A/B — evidence that data validation is a product feature, not hygiene. Departure from the idealisation: schemas lag reality (legitimate evolution vs bugs is a human triage), thresholds are hand-tuned, and validation of DATA cannot certify the MODEL (the label-leak example: a leaky model passes data validation and quality gates — the honest limit).
2. The schema as a contract, worked on Figure 2's pair: two anomalies, two OPPOSITE correct responses (evolve the schema vs block training and fix the pipeline). Triage is the intellectual content; detection is mechanical.
3. What gets computed: per-feature presence/type/domain checks, summary statistics, and cross-dataset comparators (train-vs-serve skew; day-over-day drift) with the two named distances (L∞, JS) — and why categorical/numeric need different ones.
4. Schema environments resolve the previous lesson's forward exercise verbatim: the label's presence differs by environment; position features likewise.
5. Great Expectations as the same idea outside TFX: an expectation suite for the retail case (row counts, null bounds, value domains, leak expectations) — 6-8 expectations, shown.
6. The adoption finding (§5.5) as an engineering-culture result: validation's value is invisible until the incident — hence on-by-default; connect to Sculley's monitoring-by-default stance.

## Set pieces & gems
- TFX Figure 2 — sourced image (tfxa-fig2-schema-validation): the original worked anomaly pair from the primary source.
- The +2% Google Play number with its full causal chain: stats comparison → always-missing features → fix → A/B — the course's cleanest "data quality = revenue" datum.
- The label-leak cautionary example (TFX §3.3): passes validation, great offline metrics, fails in production — the boundary of what data validation can promise.
- The spam/ham imbalance catch (MLPS worked example) — small, concrete.

## Pitfalls
- This is an application lesson: the TFX component is read as an artifact — resist re-teaching skew theory (Ref it).
- Do not turn it into a TFDV API tutorial; code appears as illustrative fragments only.
- The L∞/JS threshold discussion must admit arbitrariness (no cost model) — module 6's drift lesson deepens this; forward-Ref, don't duplicate.
- Great Expectations section: one suite, one screenshot-free listing; no tool comparison.

## FIGURE PLAN
- source: tfxa-fig2-schema-validation — the original TFX Figure 2 cropped from the page render (save as `tfx-schema-anomalies`); reader must see the example-vs-schema check and the two different suggested fixes; centered in the triage section.
- draw: The validation pipeline in place: ingestion → stats → schema check → comparators → {pass / alert+triage / block training}, drawn as the gate in front of the trainer. Inspired by TFX Fig 1's validation slice + MLPS Fig 3-1.
- draw: FigureSequence (3 frames): the Google Play incident — frame 1 training stats vs serving-log stats side by side, one feature's presence bar at 100% vs 0%; frame 2 the fix (feature made available at serving); frame 3 the A/B readout +2% installs. Original drawing of §7's narrative.
- draw: Triage decision panel: anomaly → "world changed?" → evolve schema | "pipeline broke?" → block & fix, with one example riding each branch. Original.
- draw: Schema environments: one schema, two environment overlays (Training: label required; Serving: label forbidden, position forbidden). Original; resolves the forward exercise.
- draw: A Great Expectations suite for Supermegaretail rendered as a checklist card (8 expectations with pass/fail ticks). Original.

## EXERCISE PLAN
1. Warm-up: given five anomaly reports (new category value; null spike; type change; count drop 40%; duplicate surge), sort into evolve-schema vs block-and-fix and name the check that caught each.
2. Boundary probe: a feature whose legitimate distribution is heavy-tailed and seasonal — show how a naive day-over-day JS threshold alarms every Monday; propose the comparator baseline that doesn't (same-weekday window), and say what this admits about thresholds.
3. Claim to refute: "our data validation passes, so the model is safe to ship." Use the label-leak example to name precisely what data validation certifies and what only model validation (M4) can.
4. Research-shaped: reconstruct the Google Play causal chain as a numbered argument (6 steps from stats diff to +2%), marking which step is correlational and where the A/B closes the loop.
5. Write the schema: full entries (type/presence/valency/domain/environments) for four retail features including the label and a position-like train-only feature.
6. Mixed/spaced (E3): which of Rule #37's three gaps does the serving-vs-training stats comparison measure, and which gap does it structurally MISS (train-vs-holdout)? What already measures the missed one?
7. FORWARD (E7): the validation gate blocks bad DATA before training. List the two artifacts a full pipeline must also gate (the trained model itself; the deployment) and what each gate would check. Solution: model validation gates and CI/CD — module 4's subject → Ref offline-evaluation and pipelines-and-orchestration.

## ARC
- Inherits: the module's whole manufacturing line — labels, splits, features, skew repairs — each currently verified by hand.
- Contributes: the module's application — the automated watchdog (schema + stats + comparators) read off the TFX primary source, with the measured +2% payoff and the honest limits.
- Hands off: data is gated; industrializing the rest of training — tracking, distribution, evaluation gates, orchestration — is module 4.
- Spine step: "Training data is manufactured, not given…" (step 4, Data is manufactured) — closes the step.
