# Transactions, linearizability, and consensus — research brief

Lesson: `consistency-and-transactions` (module: data-systems, EXTRA, planned). Off-path chapter: the core course survives skipping it; no non-extra lesson may require it (lint: extra-prereq).
Goal: Explain what isolation levels, linearizability, and consensus actually guarantee — and what they cost — for the rare ML-adjacent cases that need them.

## Sources
- DDIA Ch.7: ACID unpacked ("the C doesn't really belong in ACID", pp.223-227); weak isolation anomalies — dirty reads/writes (Fig 7-5 used car), read skew (Alice's two $500 accounts, Fig 7-6), lost updates (Fig 7-1 counter), write skew + phantoms (the on-call doctors, Fig 7-8, pp.233-251); serializability's three routes — serial execution, 2PL, SSI (pp.251-266).
- DDIA Ch.8: unreliable networks/timeouts (pp.277-286); monotonic vs time-of-day clocks, LWW dangers (Fig 8-3), process pauses (GC pauses "several minutes", the checklist, pp.287-300); the HBase lease bug + fencing tokens (Figs 8-4/8-5, pp.300-303); system models, safety vs liveness (pp.306-310).
- DDIA Ch.9: linearizability definition + football-score story (Fig 9-1, pp.324-329); the Unhelpful CAP sidebar (pp.335-337); Lamport timestamps (p.343-348, LIGHT); 2PC as a system of promises + the marriage analogy (pp.354-360); consensus properties + "to elect a leader we need a leader" epoch resolution (pp.364-370); what ZooKeeper actually provides (pp.370-373).

## Key points
1. Scope statement up front: most ML infrastructure deliberately avoids this machinery (eventual consistency, idempotent retries); the cases that need it are exact — a model registry's "exactly one production version", a training-job scheduler's locks, billing/labeling ledgers. This lesson is the fine print.
2. ACID honestly: A = abortability (not concurrency), C = application invariants (not the DB's job), I = the negotiable dial, D = risk reduction. Then the anomaly zoo, each as a 4-line worked scenario: dirty read (email + unread counter), read skew (Alice's $500+$500 looks like $900), lost update (two counter increments), write skew (both doctors go off call under snapshot isolation — the sharpest exhibit).
3. Serializability's three implementations in one section: actually-serial (VoltDB/Redis: fits-in-RAM, short transactions), 2PL (pessimistic, deadlocks, latency cliffs), SSI (optimistic, abort on detection). One-paragraph each + a chooser table.
4. Why distributed versions are worse: unbounded network delays, clocks that jump (LWW drops the true last write), process pauses (multi-minute GC while holding a lease). Fencing tokens as the general fix — the HBase bug worked.
5. Linearizability = single-copy illusion; needed for locks/uniqueness; costs availability under partition (honest CAP). 2PC: promises + blocking coordinator (the marriage analogy). Consensus in one page: the four properties, epochs breaking the circularity, and ZooKeeper as packaged consensus (linearizable ops + total order + ephemeral sessions + watches) — which is why every orchestrator in module 4 leans on it.
6. Close by re-drawing the line: what in an ML platform genuinely needs linearizability (registry pointer flips, distributed locks, quota counters) vs what tolerates eventual consistency (feature reads, metrics, caches).

## Set pieces & gems
- The on-call doctors write-skew story — the cleanest illustration in the literature; work it fully.
- Alice's two accounts read-skew — 4 lines + one timeline figure.
- "In order to elect a leader, we first need a leader" — the epoch-number resolution, quotable and load-bearing.
- The GC-pause checklist (VM migration, laptop lid, SIGSTOP) — a Remark.
- The marriage-ceremony 2PC analogy — keep, it is the source's canonical device.

## Pitfalls
- This is an EXTRA lesson but still must argue, not tour: frame every mechanism by the ML-platform case that needs it or the lesson floats free of the course.
- No Paxos/Raft internals; consensus is characterized by its properties and its packaged form (ZooKeeper), full stop.
- Do not let isolation levels expand into a matrix of every level × every anomaly; the zoo + the three serializability routes suffice.
- Lamport timestamps: two paragraphs max, only to show total order ≠ real-time order.

## FIGURE PLAN
- draw: The anomaly zoo as four mini-timeline panels (dirty read / read skew / lost update / write skew), two transactions each, the anomalous read circled. Inspired by DDIA Figs 7-1/7-6/7-8.
- draw: FigureSequence (4 frames): write skew — frame 1 both doctors read "2 on call"; frame 2 both checks pass; frame 3 both write; frame 4 invariant broken, zero on call. Inspired by DDIA Fig 7-8.
- draw: The paused-client lease bug → fencing fix: two panels — client 1 pauses, lease expires, client 2 writes, client 1 wakes and corrupts; same with token 34 rejected after token 35. Inspired by DDIA Figs 8-4/8-5.
- draw: Linearizability timing diagram: three clients' operations as bars, the atomic-effect points forming a valid real-time order. Inspired by DDIA Figs 9-2/9-4.
- draw: 2PC message sequence with the two irrevocable points marked (participant's yes; coordinator's decision record) and the blocking window shaded. Inspired by DDIA Fig 9-9.
- draw: "Where the line sits" panel: ML-platform components sorted into needs-linearizability vs tolerates-eventual columns. Original.

## EXERCISE PLAN
1. Warm-up: classify five two-transaction interleavings by anomaly name.
2. Boundary probe: run the doctors scenario under actual-serial execution — show the anomaly cannot occur by construction, and name the property of the workload (short, in-memory) that makes serial execution affordable.
3. Claim to refute: "our writes go to a quorum (w+r>n), so reads are linearizable." Use DDIA's nonlinearizable-strict-quorum construction to break it; name the missing ingredient (read repair before returning / consensus on order).
4. Derivation the lesson skipped: prove that with LWW and skewed clocks, a causally-later write can lose; then show fencing tokens restore correctness without synchronized clocks — state exactly what the resource must check.
5. Design: the model registry needs "promote model v42 to prod exactly once, visible to all servers in order." Specify which primitive each requirement maps to (linearizable CAS; total-order notification) and which packaged system provides both.
6. FORWARD (E7): your training pipeline's scheduler must ensure one active run per pipeline. Sketch the lock with an epoch/fencing token and note where the metadata store sits. Solution: this is exactly the coordination layer orchestrators outsource — → Ref pipelines-and-orchestration.

## ARC
- Inherits: replication's disagreement between copies and partitioning's split — the substrate at rest, with its guarantees left informal.
- Contributes: the formal fine print — isolation anomalies, linearizability, consensus — and the judgment of where ML platforms actually need it.
- Hands off: nothing on the core path depends on this chapter (extra by construction); readers rejoin at queues-and-logs.
- Spine step: "Every ML system stands on a data substrate…" (step 2, The substrate at rest) — starred appendix to the step.
