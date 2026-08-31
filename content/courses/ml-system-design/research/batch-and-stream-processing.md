# Batch and stream processing — research brief

Lesson: `batch-and-stream-processing` (module: data-systems, core, planned).
Goal: Select between batch and stream processing for a feature pipeline, handling event time, windows, and reprocessing correctly.

## Sources
- DDIA Ch.10: the Unix log-analysis one-liner vs Ruby program (pp.391-393); MapReduce's four steps as the pipeline generalized (Fig 10-1, pp.391-399); joins — sort-merge / broadcast hash / partitioned hash (pp.404-410, LIGHT); Google's 5%-preemption-per-hour stat and fault-tolerance-by-design (pp.417-418); dataflow engines vs materialized intermediates (Spark/Flink, pp.419-423).
- DDIA Ch.11: event time vs processing time + the Star Wars release-order analogy (p.469); the redeployment-backlog artifact (Fig 11-7, p.470); window types (p.472); stream joins (stream-stream/stream-table/table-table, pp.472-476, LIGHT); microbatch/checkpoint/idempotence for effectively-once (pp.476-479).
- DDIA Ch.12: lambda architecture and its problems; unifying batch and stream; the railway-gauge reprocessing analogy (pp.494-497).
- DMLS Ch.3 (pp.78-79): batch→static features vs streaming→dynamic features; "batch is a special case of streaming" (Flink position). Ch.7 (pp.203-205): unifying batch and streaming pipelines — the two-team two-pipeline bug figure (Figs 7-7/7-8).
- MLPS Ch.5 (pp.64-66): time-series windowing (history/offset/total window) and 'time travel' avoidance; the Max Planck weather dataset (capture available).

## Key points
1. Batch first, as the simplest honest machine: input bounded, output a pure function of input, rerun-from-scratch as the fault-tolerance AND the reprocessing story. The Unix pipeline → MapReduce's four steps → dataflow engines in one arc; the 5%-preemption stat explains the design posture.
2. Reprocessing is the underrated feature: a bug in feature code is fixed by rerunning the batch job over the retained log (railway-gauge analogy for side-by-side schema migration). Batch output = today's static features table (plant: this is the feature store's offline half, already met).
3. Stream processing: the same computation, unbounded, incremental, with state. The two clocks — event time vs processing time (Star Wars analogy; the redeploy-backlog spike artifact of windowing by processing time). Stragglers and the completeness/latency tradeoff.
4. Window types with one ML feature each: tumbling (daily aggregates), hopping (30-min counts refreshed every 5), sliding (last-30-min per item — the queues lesson's forward exercise resolved), session (user-session features).
5. Joins in one restrained section: stream enrichment (stream-table: click + user profile — where stale profiles = the skew story, forward plant) named; batch join algorithms one paragraph total.
6. The two-pipeline problem: lambda architecture (batch + speed layers) and its two-codebase divergence tax; unification (batch as bounded stream — Flink; or log-and-reprocess); DMLS's "two pipelines, two teams, one bug" as the ML-specific statement. Land on: static vs streaming features — the split every serving decision in module 5 inherits.
7. Effectively-once in one Remark: microbatch/checkpoint/idempotent sinks — enough to demystify the term.

## Set pieces & gems
- The Unix one-liner (cat|awk|sort|uniq -c|sort|head) worked against the Ruby program — sorting-vs-in-memory as the deep idea.
- Star Wars event-time analogy (episodes IV-VI shot first) — keep, it's the canonical device.
- Google 5%/hour preemption number — why MapReduce looks the way it does.
- The DoorDash/UberEats feature pair (mean prep time batch, current queue depth streaming) from DMLS — the lesson's closing exhibit.
- machinelearn-s1-weather-periodicity capture — real seasonal series for the windowing section (optional).

## Pitfalls
- Join algorithms: one paragraph, no more — this is the #1 scope hazard (DDIA has 30 pages; the ML reader needs the existence and the names).
- Do not do watermarks formally; "how long to wait for stragglers" stated as a tradeoff, not an algebra.
- Exactly-once: Remark-level only.
- Every window type MUST carry an ML feature example or the section is a taxonomy (L10e).

## FIGURE PLAN
- draw: The Unix pipeline and MapReduce's four steps aligned vertically (read/split → map → sort/shuffle → reduce), same toy log data flowing through both. Inspired by DDIA Fig 10-1.
- draw: Event time vs processing time scatter: events plotted on (event_t, processed_t) axes with lag; the redeploy backlog shown as a vertical stripe misread as a traffic spike by processing-time windows. Inspired by DDIA Fig 11-7.
- draw: FigureSequence (4 frames): one stream of 12 click events windowed four ways — tumbling, hopping, sliding, session — one window type per frame, same events, only the brackets change. Inspired by DDIA p.472 taxonomy + MLPS windowing figures.
- draw: Lambda architecture vs unified: batch+speed layers merging at query time (two codebases flagged) vs one log-driven engine; annotate the DMLS two-team bug. Inspired by DDIA Ch.12 + DMLS Figs 7-7/7-8.
- draw: Static vs streaming features split for the delivery example: mean-prep-time (nightly batch, warehouse) and current-queue-depth (stream, online store) meeting at the prediction request. Original; this figure returns in batch-and-online-prediction.
- source: machinelearn-s1-weather-periodicity — real Max Planck temperature series (save as `weather-seasonality`); reader must see genuine noisy multi-year seasonality (not an idealized sine) motivating window choice; float right in the windowing section.

## EXERCISE PLAN
1. Warm-up: for four features (user's 90-day purchase count; items in cart right now; store's median delivery time last month; clicks on this ad in the last 10 minutes) — batch or stream, and which window type where applicable.
2. Boundary probe: shrink a tumbling window to size → one event: stream processing degenerates to per-event transformation; grow it to ∞: it degenerates to batch. State what "batch is a special case of streaming" means operationally and what is lost at each extreme (state size; latency).
3. Claim to refute: "we window by processing time; it's simpler and close enough." Use the redeploy-backlog scenario to produce a fictitious traffic spike in a fraud-rate feature and name the decision it corrupts.
4. Derivation the lesson skipped: a counter with at-least-once input and idempotent (offset-keyed) state updates — show effectively-once emerges; then break it by making the sink non-idempotent.
5. Research-shaped: reproduce the Unix-pipeline experiment in spirit: estimate whether sorting 10GB of URLs on one machine (disk sort at ~100MB/s effective) beats a naive in-memory hash approach that swaps; use the latency-numbers table from requirements-and-metrics.
6. Mixed/spaced (E3): the CDC topology from queues-and-logs — which of its followers is a batch consumer and which a stream consumer? What does replay mean for each?
7. FORWARD (E7): compute "orders per store, last 30 min" as a hopping window and state where the result must be written for a 10ms serving read. Solution: a stream job materializing into an online KV store — exactly the feature platform assembled next lesson → Ref feature-platform.

## ARC
- Inherits: the log from queues-and-logs — ordered, replayable events; and the warehouse from storage-and-data-models.
- Contributes: the two computation machines over data — batch (rerunnable truth) and stream (fresh, two-clocked) — and the static/streaming feature split.
- Hands off: substrate complete; the module's application assembles warehouse + stream + KV store into a feature platform → feature-platform.
- Spine step: "Data in motion…" (step 3, The substrate in motion).
