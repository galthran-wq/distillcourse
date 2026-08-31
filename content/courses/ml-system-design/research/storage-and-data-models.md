# Storage engines and analytical processing — research brief

Lesson: `storage-and-data-models` (module: data-systems, core, planned). Opens the classic-system-design module the course intent explicitly requires.
Goal: Select between row and column storage, transactional and analytical engines, and warehouse versus lake architectures for a given ML workload.

## Sources
- DDIA Ch.3: hash indexes / append-only logs (Bitcask, pp.72-76); SSTables and LSM-trees (memtable, compaction, Bloom filters, pp.76-79); B-trees (pages, WAL, pp.79-83); B-tree vs LSM tradeoffs (write amplification, pp.83-85); OLTP vs OLAP + data warehousing/ETL (pp.90-95); column storage, bitmap/run-length compression, vectorized processing (pp.95-101); data cubes/materialized views (pp.101-103).
- DDIA Ch.10 (pp.414-415): the "sushi principle" / data lake / schema-on-read framing.
- DMLS Ch.3 (pp.53-72): row-major CSV vs column-major Parquet (and the pandas-is-columnar gotcha); structured vs unstructured; warehouse vs lake; OLTP/OLAP "now-blurring" via storage/compute decoupling; ETL vs ELT (Fig 3-7).
- Made With ML data-engineering lesson: ELT with Airbyte→BigQuery→dbt; "start with analytics, add ML later".
- CS329S Lecture 2 Part 2 (parallel track; Fig 2-1 row/column layout).

## Key points
1. Two access patterns, two physics: OLTP (point reads/writes by key, index-driven) vs OLAP (scan a few columns over everything). Work one concrete number: scanning a 1-billion-row, 100-column table for AVG(one column) touches 1/100th of the bytes in column layout — that ratio IS the warehouse.
2. Row vs column format concretely: CSV/Avro vs Parquet; why sorted columns compress (run-length, bitmap); vectorized execution one paragraph. The pandas gotcha (DataFrame is columnar; row iteration is the slow path) as a familiar hook.
3. One section under the hood, tightly budgeted: LSM (append + compact; fast writes, read via memtable/SSTables/Bloom) vs B-tree (update-in-place, WAL); the tradeoff stated as write amplification vs read predictability. This is context for Kafka (log-structured, next lessons) and RocksDB-backed feature stores — say so.
4. Warehouse vs lake: schema-on-write vs schema-on-read; where training data is actually assembled; lake-becomes-swamp warning. ETL → ELT explained by storage/compute decoupling (cheap object storage made transform-after-load rational).
5. ML placement: which store serves which lifecycle stage — logs land in the lake, features are built in the warehouse (batch) — planting the offline half of the feature platform (module app).

## Set pieces & gems
- The 1-in-100-columns scan arithmetic (our worked number, grounded in DDIA Ch.3's column-store argument).
- DDIA's star-schema grocery example (Fig 3-9) — one compact recreated diagram for "what a warehouse table looks like": fact table + dimensions.
- The Unix log one-liner vs Ruby program (DDIA pp.391-393) — save for batch lesson; here only mention logs-as-source-of-analytics.
- Made With ML's ELT stack (Airbyte → BigQuery → dbt) as the modern concrete instantiation, one figure.

## Pitfalls
- Ruthless scope control: this is not a databases course. LSM/B-tree gets ONE section with one figure pair; no fractal of index types (skip data cubes, skip multi-dimensional indexes).
- Don't moralize SQL vs NoSQL (the primer's decision list is enough in one Remark); document/graph models are out of scope except a sentence.
- Keep every engine choice tied to an ML consumer (training scan, feature point-read, log ingestion) — that's what makes this an ML-system lesson, not a DDIA summary.
- The "OLTP/OLAP is blurring" caveat (DMLS): one sentence, not a section.

## FIGURE PLAN
- draw: Row-major vs column-major layout of the same 6×4 table as two byte-strip diagrams, with the query "AVG(price)" shading exactly the bytes each layout must read. Inspired by DDIA Fig 3-10 / CS329S Fig 2-1.
- draw: FigureSequence (4 frames): LSM write path — frame 1 write hits memtable; frame 2 flush to sorted segment; frame 3 second segment accumulates; frame 4 compaction merges. Inspired by DDIA Figs 3-4/3-5.
- draw: B-tree page lookup (3-level descent, one highlighted path) as the contrast panel to the LSM sequence. Inspired by DDIA Fig 3-6.
- draw: OLTP vs OLAP contrast panel: request shape, rows touched, latency, engine examples — two columns, one row per axis. Original.
- draw: Star schema for the retail case (fact_sales + 4 dimensions), reusing Supermegaretail so the module keeps one running example. Inspired by DDIA Fig 3-9.
- draw: The modern ELT stack: sources → EL (Airbyte) → warehouse → transform (dbt) → training reads / dashboards; annotate where the lake sits. Inspired by Made With ML data-engineering diagrams.

## EXERCISE PLAN
1. Warm-up: for four workloads (user profile fetch, nightly feature backfill, fraud point-lookup at serving, ad-hoc analyst query), pick row vs column store and one-line justify.
2. Boundary probe: a table with 3 columns and heavy full-row updates — compute the column-store advantage for a full-row read (it inverts); state the crossover condition under which columnar loses.
3. Derivation the lesson skipped: estimate write amplification of an LSM with size-tiered compaction across 3 levels (each byte rewritten once per level) vs a B-tree page write; state which wins for a write-heavy event log and why Kafka-style logs go further still.
4. Claim to refute: "we'll put everything in the lake and decide schemas later — it's strictly more flexible." Name the two costs (swamp/discoverability; schema-on-read pushed onto every consumer) and the case where lake-first is right anyway.
5. Research-shaped: take the latency-numbers table (primer appendix): compute how long a 1TB training scan takes at SSD sequential rate vs over the network from object storage; frame what "storage/compute decoupling" costs and buys.
6. FORWARD (E7): your model needs "orders in the last 30 minutes per store" at serving time with p99 < 20ms. Show the warehouse cannot serve it (scan latency) and the OLTP store cannot compute it (aggregation over a stream). Solution: the missing machine is stream processing feeding an online store → Ref batch-and-stream-processing and feature-platform.

## ARC
- Inherits: from step 1, the claim that the system around the model decides its fate; the design doc's data section is an unfilled stub.
- Contributes: the resting substrate — which engine serves which access pattern, and where training data physically lives.
- Hands off: one machine's engines chosen; the next problem is many machines holding copies — replication and its anomalies → replication.
- Spine step: "Every ML system stands on a data substrate…" (step 2, The substrate at rest).
