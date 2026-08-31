# Replication and consistency — research brief

Lesson: `replication` (module: data-systems, core, planned).
Goal: Explain leader-based replication, its lag anomalies, and the failover risks that asynchronous replication creates.

## Sources
- DDIA Ch.5: leaders and followers, sync vs async (Figs 5-1/5-2, pp.152-160); failover failure modes incl. the GitHub 2012 stale-follower incident (pp.157-158); replication-lag guarantees — read-your-writes (Fig 5-4), monotonic reads, consistent prefix (the Mr Poons/Mrs Cake dialogue, pp.161-167); multi-leader (use cases, conflicts, LWW; the Amazon shopping-cart resurrection sidebar, pp.168-176); leaderless/Dynamo (quorums w+r>n, Fig 5-11; sloppy quorums, read repair, pp.177-184); concurrent writes/version vectors (pp.184-191 — SKIM, one Remark only).
- DDIA Ch.9 (pp.335-337): "The Unhelpful CAP Theorem" sidebar — the honest phrasing.
- System Design Primer: consistency patterns (weak/eventual/strong), availability patterns (fail-over active-passive/active-active), CAP section.
- DMLS Ch.2 (p.29-32): reliability requirement — the ML hook (a feature store or model registry is a replicated system whether you asked or not).

## Key points
1. Why replicate: read scale, latency (geo), fault tolerance. Leader-based mechanics: replication log, sync vs async followers, the semi-synchronous compromise; setting up a follower from a snapshot + log position.
2. Failover is the dangerous part — worked incident: GitHub 2012, an out-of-date follower promoted to leader reissued auto-increment keys already referenced in Redis, leaking private data across users. Split brain and the discarded-writes dilemma. This is the lesson's centerpiece narrative.
3. Replication lag as a user-visible phenomenon; the three guarantees defined by their violations: read-your-writes (you comment, refresh, it's gone), monotonic reads (time runs backwards between refreshes), consistent prefix (the answer before the question — Mr Poons). For each: symptom → guarantee → implementation sketch (read-own-writes via leader-pinned reads, monotonic via session-sticky replica).
4. Multi-leader in one section: when needed (multi-DC, offline clients), why conflicts are the price; LWW silently drops data — the Amazon cart bug (deleted items resurrected) as the exhibit. Version vectors in one Remark.
5. Leaderless quorums: w + r > n overlap geometry; sloppy quorums break the overlap; quorum ≠ linearizable (one sentence, forward-Ref extra lesson).
6. CAP, honestly: "consistent or available when partitioned" — the sidebar's argument that 'pick 2 of 3' misleads; eventual consistency as the default posture of ML-serving infrastructure (features slightly stale ≫ features unavailable), stated as an engineering judgment with its own failure mode (staleness budget → forward-Ref monitoring).

## Set pieces & gems
- GitHub 2012 incident (DDIA pp.157-158) — dated, named, mechanically explained.
- Mr Poons / Mrs Cake (DDIA pp.165-166) — the consistent-prefix scene, quoted briefly (it is a primary illustrative device, allowed under L8a as the source's named example).
- Amazon shopping-cart LWW bug (DDIA sidebar p.174).
- The w+r>n overlap drawn as literal set overlap (DDIA Fig 5-11).
- CAP-Venn capture available (thesystem-cap-theorem-venn) but a house redraw is cleaner — do NOT source it; the hand-drawn sketch adds no evidentiary value (drawing explains better).

## Pitfalls
- Version vectors and sibling merges: one Remark, no five-step walkthrough — off the ML path.
- Do not teach consensus here (extra lesson owns it); "how a new leader is chosen" gets one forward-Ref sentence.
- Every guarantee needs its ML instantiation (e.g., read-your-writes for a user's just-updated preference feature) or the section reads as pure DDIA.
- Keep CAP to 2 paragraphs; the debunk IS the content, not a theory of distributed systems.

## FIGURE PLAN
- draw: Leader-based replication topology with one sync and one async follower on a timeline showing the ack points. Inspired by DDIA Fig 5-2.
- draw: FigureSequence (4 frames): the GitHub failover — frame 1 healthy leader+lagging follower; frame 2 leader dies; frame 3 stale follower promoted, reissues key 4567; frame 4 Redis still maps 4567 → old user: wrong data served. Original drawing of the incident mechanics.
- draw: Three lag anomalies as three mini-panels (user-refresh comment vanishes / time reversal / answer-before-question), each with the violated guarantee named on-panel. Inspired by DDIA Figs 5-4/5-5.
- draw: Quorum overlap: n=5 nodes, w=3 writes shaded, r=3 reads circled, the guaranteed intersection highlighted; a second panel with sloppy quorum breaking the overlap. Inspired by DDIA Fig 5-11.
- draw: CAP as a forced choice under partition: two partitions, a write on one side, the reject-or-diverge decision labeled C-or-A. Original (deliberately not the Venn).

## EXERCISE PLAN
1. Warm-up: n=7 replicas — which (w, r) pairs guarantee read-your-writes through quorum overlap, and which minimize write latency at r=1?
2. Boundary probe: set w=n (fully synchronous). Which anomaly class disappears, what availability property is destroyed, and why does one slow follower now set the p99 write latency (tie to requirements-and-metrics' tail arithmetic)?
3. Claim to refute: "our replicas are eventually consistent, so any read anomaly is temporary and harmless." Use the ML case — a fraud model reading a stale account-age feature approves the fraudster's second transaction — to show 'temporary' has a cost; name the guarantee that would have prevented it.
4. Diagnosis: three incident vignettes (comment disappears on refresh; dashboard counter decreases; recommendation reflects a preference change for user A but not B) — name the anomaly and the cheapest fix each.
5. Derivation the lesson skipped: show LWW with unsynchronized clocks can drop a WRITE THAT HAPPENED LAST by wall-clock truth (construct the two-node clock-skew scenario); conclude what "last" means without a clock — an ordering problem, which the extra lesson takes up.
6. FORWARD (E7): your feature store's online Redis is a replicated cluster serving a partitioned keyspace. One shard's replica lags 30s during a failover. Write the one-sentence blast-radius statement (which users, which features). Solution: bounding blast radius by keyspace is exactly partitioning → Ref partitioning.

## ARC
- Inherits: storage engines on one machine from storage-and-data-models; the substrate now goes multi-node.
- Contributes: copies disagree — lag anomalies as named guarantees, failover as the risk event, quorum overlap as the mechanism, CAP as the honest framing.
- Hands off: replication copies everything everywhere; when data outgrows any single machine, the substrate must SPLIT — → partitioning.
- Spine step: "Every ML system stands on a data substrate…" (step 2, The substrate at rest).
