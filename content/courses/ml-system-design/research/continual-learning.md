# Continual learning and retraining policy — research brief

Lesson: `continual-learning` (module: operations, core, planned).
Goal: Formulate a retraining policy — stateless versus stateful, trigger design — and assess the evaluation risks of learning from live data.

## Sources
- DMLS Ch.9 (pp.264-291): champion/challenger (Fig 9-1); stateless retraining vs stateful training (Fig 9-2) — the Grubhub result: daily stateful cut compute 45× and raised purchase-through 20% (Egg 2021); why continual learning (sudden shifts, rare/seasonal events, continuous cold start — TikTok adapting within a handful of videos); challenges — fresh-data access (streaming vs warehouse; label computation), evaluation (risk amplification, adversarial manipulation — Tay shut down in 16 hours), algorithm constraints (trees vs online-updatable models); the four maturity stages (manual stateless → automated retraining → automated stateful → trigger-driven); value-of-freshness experiments (Fig 9-5: staggered windows tested on today; Facebook's weekly→daily = 1% CTR-loss cut); model iteration vs data iteration.
- MLPS Ch.16 (pp.296-300): fine-tune vs full retrain; when-to-retrain policies; automated retraining; drift-triggered loops.
- TFX §4.1 warm-starting — recalled: stateful training's platform mechanism (inside-tfx).
- Rules of ML #8 (know your freshness requirements), #33 (test on post-cutoff data), #28 (short-term equivalence hides long-term difference — the doc_id×query model that can never generalize).
- Babushkin Ch.14 §14.4.4 (how to react) — retraining window choice; Burkov Ch.9 §9.5 (when/how to update; validation gates before redeploy).

## Key points
1. Reframe: every system HAS a retraining policy (never / on-incident / scheduled / triggered) — the design questions are cadence, warm vs cold start, data window, and gating. The maturity stages give the roadmap (and tie back to MLOps levels from M4 — same ladder, model-refresh axis).
2. Stateless vs stateful precisely: full retrain on a window vs continue from the champion's checkpoint on new data (checkpoint machinery recalled). Grubhub's 45×/20% as the economics; the discipline stateful requires: lineage (which data has this model seen), schema stability, periodic full retrains to escape accumulated bias ("calibration resets").
3. How often is WORTH it — the freshness-value experiment as a designed measurement: train on staggered historical windows, evaluate all on today; the gap between window-N and window-N+1 prices a day of staleness (Facebook's 1% CTR-loss datum). This turns cadence from opinion into measurement.
4. Trigger design: time (simple, blind), performance (needs labels — lag recalled), volume (data accumulation), drift (monitoring's alarms → this lesson's actuator). Each trigger with its false-fire mode; combined policies in practice.
5. Evaluation under continual learning — the risk section: the champion/challenger gate (offline-evaluation recalled) run per refresh; post-cutoff testing (Rule #33); Tay as the adversarial cautionary tale (16 hours); Rule #28's deeper point — A/B-equivalent short-term behavior can hide structural inability to adapt (the doc_id×exact_query memorizer); degenerate loops amplified by faster retraining (failures-and-drift recalled) — faster loops need MORE randomization, not less.
6. Model iteration vs data iteration: where the next unit of effort pays — fresh data usually beats architecture churn at maturity (Rules #38-#41's arc, one Remark).

## Set pieces & gems
- Grubhub 45×/20% — keeper pair.
- Tay's 16 hours — the adversarial exhibit.
- The staggered-window experiment design (DMLS Fig 9-5) — recreate; it's a reusable measurement pattern.
- TikTok's few-video adaptation — continuous cold start made concrete.
- Rule #28's doc_id×query model — the subtle "looks fine, can't learn" case.
- Weibo's 10-minute cadence (deployment myths recalled) as the far end of the cadence spectrum.

## Pitfalls
- "Continual learning" ≠ online SGD on every event: DMLS is explicit — it's usually micro-batch/periodic; say so early or readers picture streaming gradient descent.
- Catastrophic forgetting: name it in one Remark; do not open the research literature.
- The Tay story is about ADVERSARIAL data + no gate — draw the engineering lesson (gates + rate limits + rollback), not a content-moderation editorial.
- Keep trigger design concrete: each trigger gets its false-fire mode and its cost, or the section is a list.

## FIGURE PLAN
- draw: The policy space: cadence (never→minutes) × start (cold/warm) plane with named systems placed (quarterly tabular, daily Grubhub, 10-min Weibo) and the maturity stages as regions. Original — key image.
- draw: Stateless vs stateful: two timelines — full retrains on sliding windows (big bars, from scratch) vs daily fine-tune steps from checkpoints with periodic full-reset bars; compute cost shaded. Inspired by DMLS Figs 9-1/9-2.
- draw: FigureSequence (3 frames): the freshness-value experiment — frame 1 models A/B/C trained on staggered windows; frame 2 all evaluated on today's data; frame 3 the performance-vs-staleness curve read off, cadence decision marked where the curve's slope crosses the retraining cost. Inspired by DMLS Fig 9-5.
- draw: The trigger board: four triggers with signal source, false-fire mode, and cost — a 4×3 panel. Original.
- draw: The gated refresh loop: monitoring alarm → challenger trained (warm) → offline gate vs champion → canary → promote; the loop drawn as one circuit tying modules 4-6 together. Original.

## EXERCISE PLAN
1. Warm-up: from a freshness-value table (given: today-eval accuracy for models 1/3/7/14 days stale), compute the per-day staleness cost and pick a cadence given a stated retraining cost.
2. Boundary probe: a task with zero drift (physics simulation surrogate) — show every trigger except volume is silent forever and the correct policy is "never (until the domain changes)"; state which monitoring stays on anyway (skew/schema — the pipelines can still break).
3. Claim to refute: "stateful daily training means we never need full retrains." Name the two accumulating failure modes (schema/feature evolution can't be absorbed by fine-tuning; distribution bias accumulates) and the reset policy that bounds them.
4. Derivation the lesson skipped: for label lag L days and sudden concept drift at t=0, derive the minimum time until a PERFORMANCE trigger can fire (≥L) vs a drift trigger on predictions (~detection window); compute both for L=3, window=1h.
5. Research-shaped: design the Tay-proof gate for a continually-trained chat ranker: the three checks (adversarial-content filter on training data; behavioral test suite from offline-evaluation; canary with auto-rollback) each with its trigger threshold.
6. Mixed/spaced (E3): warm-starting (distributed-training) and the champion/challenger gate (offline-evaluation) — write the exact artifact list (checkpoint components + lineage rows) a stateful daily pipeline must persist per refresh.
7. FORWARD (E7): your drift trigger needs a concrete detector on live text inputs. Name the test you'd run on embeddings and the two windows you'd compare. Solution: exactly the MMD-on-embeddings walkthrough executed next lesson → Ref drift-detection-in-practice.

## ARC
- Inherits: alarms from monitoring-and-observability; the gate from module 4; rollout machinery from module 5.
- Contributes: the policy layer — stateless/stateful economics, measured cadence, trigger design, and evaluation under self-influence.
- Hands off: the module's application runs the detectors for real → drift-detection-in-practice; the loop is now closed — modules 7-8 apply the whole system to the canonical shapes.
- Spine step: "Deployment is the beginning, not the end…" (step 7, Closing the loop).
