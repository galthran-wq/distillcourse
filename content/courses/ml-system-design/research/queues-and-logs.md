# Message queues and event logs — research brief

Lesson: `queues-and-logs` (module: data-systems, core, planned).
Goal: Contrast acknowledgment-based brokers with log-based brokers and use change data capture to keep derived systems consistent.

## Sources
- DDIA Ch.11: messaging systems — direct vs broker, load balancing vs fan-out (Fig 11-1), ack/redelivery reordering (Fig 11-2, pp.441-446); partitioned logs — Kafka model, offsets, disk-as-buffer, replay (Fig 11-3, pp.446-450); the 6TB/150MB-s ≈ 11 hours back-of-envelope (pp.449-450); dual writes race (Fig 11-4, p.453); CDC — DB as leader, derived systems as followers (Fig 11-5, pp.452-456); event sourcing vs CDC (pp.457-459); state/stream duality — "the log is the truth, the database is a cache of the log" (Fig 11-6, pp.459-460).
- DMLS Ch.3 (pp.72-78): three modes of dataflow; the N² microservice request mesh → broker diagram (Figs 3-8/3-9); pubsub vs message queue; event lifecycle in a real-time transport (Fig 3-10).
- System Design Primer: asynchronism section — back pressure definition.
- designingmac-s1-kafka-rabbitmq-companies capture — industry-adoption panel (optional exhibit).

## Key points
1. The motivating failure: N interdependent services calling each other synchronously — the N² mesh, coupled latencies (tail arithmetic recalled), cascading failure. The broker decouples in time and topology.
2. Two broker families as a real design fork: ack-and-delete (RabbitMQ-style; per-message load balancing; redelivery reorders — Fig 11-2's crash scenario) vs partitioned log (Kafka: append-only per partition, consumer offsets, ordering within partition, replay). The chooser: task queues want the first; data pipelines and ML event streams want the second.
3. Disk-as-buffer arithmetic worked: 6TB at 150MB/s ≈ 11 hours at full throttle — why a log broker retains days and why "replay last week" is a feature, not a hack. Replay = the training-data superpower (reprocess features after a bug — forward plant to batch-and-stream and training-serving-skew).
4. Dual writes: app writes DB then search index; a crash between them, or interleaving, diverges the two forever — no ordering authority. CDC: make the DB the leader, publish its change log, let index/cache/warehouse follow. This is how the feature platform's online store stays in step (module app).
5. State/stream duality: the table is the integral of the change stream; log compaction as "keep the latest per key". Event sourcing distinguished from CDC in one Remark (intent events vs row changes).
6. Backpressure and failure semantics: slow consumer → lag (measured in offsets — a monitorable! forward-Ref monitoring); at-least-once + idempotent consumers as the default posture; exactly-once deferred one sentence to batch/stream lesson.

## Set pieces & gems
- The 11-hours-of-buffer computation — keeper number, reproduced in an exercise with different hardware.
- Fig 11-4's dual-write race — the "this is why CDC exists" diagram; recreate faithfully in house style.
- Pat Helland's "the log is the truth" line — quotable, attributed.
- The N²-mesh-to-broker before/after pair (DMLS Figs 3-8/3-9).

## Pitfalls
- No Kafka administration content (ISR, acks=all tuning) — the model, not the ops.
- Event sourcing gets one Remark; CQRS not even named.
- Keep the ML thread visible: every mechanism lands on an ML consumer (click events → training data; DB changes → online features; replay → backfill).
- Exactly-once: name it, defer it; do not open the transactional-messaging box here.

## FIGURE PLAN
- draw: N² request mesh vs broker-mediated: two panels, same four services. Inspired by DMLS Figs 3-8/3-9.
- draw: Two broker families side by side: ack/delete queue (message vanishes, redelivery arrow crossing order) vs partitioned log (offsets 0..n, two consumer groups at different offsets). Inspired by DDIA Figs 11-1/11-3.
- draw: FigureSequence (4 frames): dual-write divergence — frame 1 app writes DB; frame 2 crash before index write; frame 3 second app instance interleaves the other order; frame 4 DB and index disagree permanently. Inspired by DDIA Fig 11-4.
- draw: CDC topology: DB leader → change log → {search index, cache, warehouse, online feature store} as followers, all reading the same order. Inspired by DDIA Fig 11-5.
- draw: State/stream duality: a 4-event stream integrated into a 2-row table; log compaction shown keeping latest-per-key. Inspired by DDIA Fig 11-6.
- source: designingmac-s1-kafka-rabbitmq-companies — the DMLS industry-adoption panel (save as `broker-adoption`); reader must see the two named ecosystems' real adopters; float right beside the broker-families section (small; optional — drop if it reads decorative).

## EXERCISE PLAN
1. Warm-up: your cluster's log disks are 12TB at 300MB/s sustained write — compute the full-throttle retention window; then at the realistic 10% duty cycle.
2. Boundary probe: a single-partition log gives total order; show what ordering guarantee survives with 8 partitions keyed by user_id, and construct the two-user scenario where cross-user order is lost but nothing breaks — then the scenario (a transfer between users) where it does.
3. Claim to refute: "we write features to both the warehouse and Redis in the app code, wrapped in a try/except, so they stay consistent." Break it with the dual-write race; name the fix and what new component it requires.
4. Diagnosis: consumer lag grows linearly from 14:00; list three hypotheses (consumer crash-loop, poison message redelivery, throughput regression) and the one offset/metric pattern that distinguishes each.
5. Derivation the lesson skipped: at-least-once delivery + a non-idempotent consumer (increment counter) — compute the expected overcount for redelivery probability p; make the consumer idempotent with an offset-keyed write and show the overcount vanish.
6. FORWARD (E7): clicks arrive on a log; the model needs "clicks in the last 30 min per item" updated continuously. Sketch the consumer that maintains it and name the two clocks involved (when clicked vs when processed). Solution: that distinction and the machinery around it is the next lesson → Ref batch-and-stream-processing.

## ARC
- Inherits: the substrate at rest (engines, replicas, partitions); systems so far exchange data by reading each other's stores.
- Contributes: data in motion — the two broker families, replayable logs, CDC as the honesty mechanism between stores.
- Hands off: events now flow; computing OVER the flow — with correct clocks and windows — is stream processing → batch-and-stream-processing.
- Spine step: "Data in motion…" (step 3, The substrate in motion).
