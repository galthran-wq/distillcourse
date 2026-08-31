# Feast and the online–offline split — research brief

Lesson: `feature-platform` (module: data-systems, core, planned). MODULE-FINAL APPLICATION LESSON (L16).
Goal: Analyze a real feature platform — Feast's warehouse-plus-Redis architecture — as an application of the module's storage, replication, and streaming tradeoffs.

## Sources
- ML Design Patterns DP26 Feature Store (pp.500-517): Feast architecture — BigQuery offline + Redis online + Beam ingestion; FeatureSets/entities; batch vs online retrieval; the before/after diagrams (duplicated per-team computation vs centralized, Figs 6-12/6-15..6-18); alternatives (Uber Michelangelo, Hopsworks, Airbnb Zipline); Feature Store vs Transform pattern tradeoffs.
- Babushkin Ch.11 §11.4 (pp.~208-227): desired properties — read-write skew, precalculation/preaggregation hierarchy (Fig 11-14: raw events → item-day sums → windowed aggregates), feature versioning, dependency/lineage graphs (Fig 11-15), feature bundles, feature catalog; online+batch merge-at-read (Fig 11-13).
- DMLS Ch.10 (pp.325-327): the feature store's three problems — management, computation, consistency.
- Burkov Ch.4 §4.11.2: the four-part feature definition (name, description, metadata, definition) and the Michelangelo-inspired dual-store pattern.
- Module 2's own lessons — this lesson's real "source" is the substrate: column store (storage lesson), replicated partitioned KV (replication+partitioning), stream materialization (queues+batch/stream).

## Key points
1. APPLICATION SPEC. Artifact: Feast's architecture (with Michelangelo/Zipline as variants) read component by component against module 2. Module results used: the offline store IS a columnar warehouse (storage lesson: OLAP scans for training-set assembly); the online store IS a replicated, partitioned KV (replication: read-your-writes stance and staleness; partitioning: entity-key hashing, hot entities); ingestion IS a stream job materializing windows (batch/stream lesson); the sync between halves is CDC-shaped (queues lesson). Departure from the idealisation: the two stores are eventually consistent with each other — the same feature can answer differently online and offline at the same wall-clock moment; and point-in-time training joins are named but deferred (module 3 owns the leakage mechanics).
2. The read-write skew stated as the design driver: training reads years × millions of rows in bulk (throughput); serving reads one entity's vector in ~10ms (latency). One store cannot do both — the split follows, not from fashion but from module-2 physics.
3. The precomputation hierarchy: raw events → daily aggregates → windowed features; who computes what, when, and the cost/freshness tradeoffs at each level.
4. Feature management as the second product: catalog, ownership, versioning, dependency graphs — connect to Rules #11 (feature ownership/documentation) and to configuration debt (M1).
5. What a feature store does NOT solve by itself: transform consistency (two implementations can still diverge around it) — honest close, naming module 3's training-serving-skew lesson as the continuation.

## Set pieces & gems
- The before/after diagrams (every team recomputes vs compute-once) — the platform's economic argument; recreate.
- The ~10ms-vs-bulk-scan read-write skew numbers — the lesson's keeper contrast.
- Babushkin's preaggregation hierarchy figure — recreate with the retail running example (orders → store-day sums → 30-min windows).
- Michelangelo as the historical origin (Uber), one Remark with the Pensive/LinkedIn variant from Khang p.86 as another rendering.

## Pitfalls
- Do NOT preempt module 3: point-in-time correctness and the Spotify skew story belong to training-serving-skew; here they are named as open problems only.
- Avoid product-brochure register — every Feast component must be explained by a module-2 mechanism, or it's marketing.
- Keep vendor landscape to one Remark (Feast/Michelangelo/Zipline/Hopsworks named once).
- This is an application lesson: the reading protocol (component → module concept → tradeoff) is the content; no new theory.

## FIGURE PLAN
- draw: The lesson's centerpiece: Feast's architecture redrawn with every box color-tagged by the module-2 lesson that explains it (warehouse=storage, Redis=replication+partitioning, Beam=stream, sync=CDC). Single Figure, the module's summary image. Inspired by MLDP Figs 6-16/6-17.
- draw: Read-write skew panel: two request shapes against the two stores — a training query (years × entities, minutes, columnar scan) and a serving query (1 entity, 10ms, point read) — with the mismatched arrows crossed out on the wrong store. Original.
- draw: FigureSequence (3 frames): precomputation hierarchy — frame 1 raw order events; frame 2 store-day aggregates materialized nightly (batch); frame 3 30-min windows materialized continuously (stream) with both landing in online/offline stores. Inspired by Babushkin Fig 11-14.
- draw: Before/after economics: three teams each building "user 90-day spend" separately vs one governed feature consumed three times. Inspired by MLDP Figs 6-12/6-15.
- draw: The consistency seam: timeline showing online and offline values of one feature diverging between ingestion runs — the eventual-consistency window shaded, labeled "departure from the ideal". Original.

## EXERCISE PLAN
1. Warm-up: place six features (user age, 90-day spend, cart contents now, store median prep time, item embedding, last-10-min clicks) into the hierarchy level + store(s) each needs.
2. Boundary probe: a system with ONLY batch features and daily retraining — show the online store can be deleted (serve from a precomputed table) and state exactly which product requirement (freshness < 24h) forces it back.
3. Claim to refute: "the feature store guarantees training-serving consistency." Construct the counterexample: the app computes a normalization on top of the fetched feature differently in the training job and the service — consistency of storage ≠ consistency of transformation. Name which module-3 lesson closes this.
4. Design: for the Supermegaretail forecast (design-doc case), specify the feature platform: 4 features, their hierarchy level, refresh cadence, store placement, and the staleness budget each tolerates.
5. Research-shaped (spaced, E3): using partitioning-lesson arithmetic, estimate hot-entity risk for the online store when one store-chain (5% of entities, 60% of traffic) dominates — propose the key design.
6. FORWARD (E7): write the training-set assembly query for label "did the customer order within 7 days of T" joined to features "as of T". State what goes wrong if the join uses feature values as of NOW instead. Solution: that bug is temporal leakage, the next module's opening subject → Ref data-leakage-and-splitting and training-serving-skew.

## ARC
- Inherits: all four substrate lessons — engines, replicas, partitions, logs, and the two computation machines.
- Contributes: the module's application — a real ML platform component assembled from exactly those parts, with the eventual-consistency seam exposed.
- Hands off: the substrate can store and move features; whether the features and labels are RIGHT — leak-free, honestly labeled, consistent across the train/serve boundary — is module 3's question.
- Spine step: "Data in motion…" (step 3, The substrate in motion) — closes the step.
