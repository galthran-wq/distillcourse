# Partitioning and sharding — research brief

Lesson: `partitioning` (module: data-systems, core, planned). Carries the ReshardingExplorer demo.
Goal: Design a partitioning scheme — key range or hash, with rebalancing and hot-key mitigation — for a dataset that outgrows one node.

## Sources
- DDIA Ch.6: partitioning + replication combined (Fig 6-1, p.200); key-range partitioning (encyclopedia intuition, Fig 6-2, p.202); hash partitioning + consistent-hashing sidebar (pp.203-204); Cassandra's compound-key compromise (p.204); skew/hot spots — the celebrity problem and the two-digit random-suffix mitigation with its read fan-out cost (p.205); secondary indexes by document vs by term (Figs 6-4/6-5, pp.206-209); rebalancing — hash mod N anti-pattern, fixed partition count, dynamic partitioning, proportional-to-nodes (pp.209-213); request routing three topologies + ZooKeeper (Fig 6-7/6-8, pp.214-216).
- System Design Primer: sharding & federation sections (disadvantages lists).
- DDIA Ch.1 (pp.11-13): Twitter celebrity fan-out — recalled from requirements-and-metrics, now as a partitioning problem.
- Khang Pham Ch.1 (p.83-96): serving embeddings / LinkedIn Pensive — partition-aware serving as the ML consumer (light touch; module app develops it).

## Key points
1. The problem statement in numbers: a 10TB feature table, 64GB nodes — some key must map records to nodes; that key choice is the design.
2. Range vs hash: range keeps scans (time-series features, leaderboards) but concentrates load (today's partition is hot); hash spreads load but destroys ranges. Cassandra's compound key (hash the partition key, sort within) as the both-worlds compromise — directly the pattern for (user_id, timestamp) event tables in ML systems.
3. Hot keys survive hashing: the celebrity — one key's load, not key count. Mitigation: split the key with a random suffix; cost: every read must fan out to all splits (tie to tail-latency arithmetic from requirements-and-metrics).
4. Rebalancing: hash mod N moves ~everything when N changes (worked: 10→11 nodes moves ~10/11 of keys); fixed partition count (create 1,000 partitions up front, move whole partitions); consistent hashing with virtual nodes (~1/N moves). The demo makes the reader measure all three.
5. Secondary indexes: local (document-partitioned — cheap writes, scatter/gather reads) vs global (term-partitioned — the reverse); which one an ANN index shard resembles (forward plant for recommender-funnel).
6. Request routing: the three topologies; where the partition map lives (ZooKeeper/config service) — one section, closing with "each node is leader for some partitions, follower for others" (Fig 6-1) tying replication + partitioning together.

## Set pieces & gems
- The encyclopedia-volume figure for range partitioning — instantly graspable, recreate.
- hash mod N worked arithmetic (10→11 nodes): the anti-pattern quantified.
- Celebrity hot key + suffix mitigation with its read-cost bill — connects two lessons' arithmetic.
- Fig 6-1 (partitioning × replication grid) — the module's unifying diagram; recreate as the section-closer.

## Pitfalls
- Consistent hashing: teach the ring + virtual nodes intuition the demo shows; skip the academic variants (jump hash, rendezvous) entirely.
- Secondary indexes: keep to the two-way contrast; no B-tree-vs-inverted-index digression.
- Don't let the lesson become Cassandra documentation; name systems once each.
- The demo must have a stated task in prose BEFORE explanation (D4): "add a node under each scheme, record moved %".

## FIGURE PLAN
- draw: Range vs hash partitioning as two panels over the same 12-key set (alphabet ranges vs hashed buckets), with a range query drawn succeeding on one and shattering on the other. Inspired by DDIA Figs 6-2/6-3.
- draw: FigureSequence (3 frames): hot key formation — frame 1 balanced hash partitions; frame 2 one celebrity key's traffic swells its partition; frame 3 the key split into 10 suffixed keys across partitions, with the read fan-out arrows appearing. Inspired by DDIA p.205 prose.
- draw: Rebalancing comparison strip: hash mod N (10→11, ~91% keys move, red) vs fixed partitions (move 3 whole partitions, green) vs consistent-hash ring with virtual nodes (~9% move). Numbers on-figure; the demo recreates this live. Original composition.
- draw: Local vs global secondary index two-panel on a used-car table (color=red query): scatter/gather reads vs multi-partition writes. Inspired by DDIA Figs 6-4/6-5.
- draw: The combined grid: 4 nodes × 8 partitions, each node leader for 2 and follower for 2 — replication and partitioning as one picture. Inspired by DDIA Fig 6-1.

## EXERCISE PLAN
1. Warm-up: 6 nodes, hash mod 6 → hash mod 7: compute the expected fraction of keys that move; then the same under 60 fixed partitions.
2. Boundary probe: partition a dataset whose entire load is one key (a global counter). Show no partitioning scheme helps, and name the two actual fixes (key splitting with aggregation; or move the problem to a stream — forward plant).
3. Claim to refute: "hash partitioning balances load, so p99 is safe." Use a Zipf-distributed key popularity (80/20) to show partition load imbalance survives perfect key balance; compute the hottest partition's share for a toy Zipf(1) over 8 partitions.
4. Design: an events table keyed how? Compare (timestamp), (user_id), (user_id, timestamp) compound for three queries (user history scan, daily backfill, single event fetch); pick and defend.
5. Derivation the lesson skipped: on a consistent-hash ring WITHOUT virtual nodes, derive the expected max arc length for N=8 (order-statistics hand-wave acceptable) and explain why virtual nodes tighten the balance.
6. Mixed/spaced (E3): the GitHub failover from replication — restate the blast radius if the same incident hits a cluster where each node leads 1/8 of the keyspace.
7. FORWARD (E7): your ANN index over 100M item embeddings must answer top-k in 20ms. Propose a partitioning (shard the corpus, query all shards, merge top-k) and compute the fan-out cost at p99. Solution: this scatter/gather IS how retrieval serving works → Ref recommender-funnel.

## ARC
- Inherits: replication's copies; the substrate holds data that no longer fits one node.
- Contributes: the split — range vs hash, hot keys, rebalancing arithmetic, routing — and the combined partitioned+replicated picture.
- Hands off: data at rest is now placed; the remaining substrate question is data IN MOTION between systems — queues, logs, CDC → queues-and-logs. (The consistency fine print of the split-brain world is the extra lesson.)
- Spine step: "Every ML system stands on a data substrate…" (step 2, The substrate at rest).
