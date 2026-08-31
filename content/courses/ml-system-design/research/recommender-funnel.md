# The retrieval–ranking funnel — research brief

Lesson: `recommender-funnel` (module: canonical-designs, core, planned).
Goal: Design the candidate-generation → ranking → re-ranking funnel and justify each stage from the compute budget.

## Sources
- Khang Pham Ch.2 (pp.102-120): the three-stage pipeline as the organizing diagram; candidate generation — content-based, collaborative/matrix factorization (one Remark — classical-ml owns MF), Pinterest's co-occurrence/random-walk/Pins2Vec stack, YouTube's multi-algorithm retrieval; re-ranking (freshness/diversity/fairness); impression discounting (LinkedIn PYMK); Ch.1 (pp.24-26, 70-71): two-tower retrieval; sampled-softmax bias correction s^c = s − log(p_j); Fig two-tower.
- Aminian & Xu Ch.6 (pp.115-144): the video-recommendation funnel design; two-tower + ANN serving; Ch.2 (pp.46-51): ANN families (tree/LSH/clustering; Faiss/ScaNN), indexing + query pipelines.
- AI Engineering Ch.6 (pp.256-266): ANN algorithms (LSH, HNSW, product quantization, IVF) and ANN-Benchmarks metrics (recall/QPS/build time/index size) — reused here ahead of RAG.
- DMLS Ch.8/9 (recalled): TikTok exploration pools (cold start); degenerate loops.
- Requirements-and-metrics: the funnel-as-latency-budget forward exercise — now resolved.

## Key points
1. The funnel derived from arithmetic, not convention: 100M items × ~1ms heavy-ranker scoring = 28 hours per request; therefore stage 1 must be sublinear (index lookup), stage 2 scores hundreds, stage 3 re-orders tens. Work the budget: 200ms page → retrieval 20ms, ranking 100ms at 500 candidates, re-rank 10ms. (Resolves the M1 forward exercise verbatim.)
2. Candidate generation as a portfolio: multiple cheap sources in parallel (co-occurrence "watched-together", content similarity, graph walks, popular-in-cohort, fresh-pool), union → dedupe; YouTube/Pinterest as documented multi-source stacks. Why a portfolio: each source has a recall blind spot.
3. Two-tower retrieval mechanically: user tower and item tower trained so dot product ≈ engagement; the serving asymmetry that makes it work — item embeddings precomputed and indexed, user embedding computed per request, retrieval = MIPS. In-batch negatives and the popularity-bias correction (subtract log p_j) derived in3 lines — popular items are oversampled as negatives; the correction un-biases the softmax.
4. ANN in one disciplined section: exact top-k is a scan; the three index families (hash/LSH, tree/space-partition IVF, graph/HNSW) at intuition level; the tradeoff surface (recall vs QPS vs build time vs memory) with ANN-Benchmarks as the measurement source; index refresh cadence as a freshness decision (batch rebuild vs incremental).
5. Re-ranking as the product layer: diversity (dedupe near-identical), freshness quotas, business rules, impression discounting (seen-but-ignored decays); exploration slice for cold start (TikTok pools recalled — the loop-breaking device from M6 placed in its home).
6. The funnel's failure geography: retrieval misses are invisible to the ranker (recall ceiling); ranker miscalibration corrupts ordering (next lesson); position bias corrupts the labels the whole stack trains on (next lesson).

## Set pieces & gems
- The 28-hours-per-request computation — the funnel's raison d'être as one number.
- The sampled-softmax correction — small derivation with real production provenance (YouTube).
- Pinterest's three retrieval sources + YouTube's multi-algorithm stack — documented portfolio exhibits.
- machinelearn-aminianxu-pinterest-visual-search capture — the shipped product face of retrieval (optional here; embedding-based-search may use it instead — decide there, avoid double use).
- LinkedIn impression discounting — a production detail that generalizes (decay what the user ignored).

## Pitfalls
- Matrix factorization: one Remark ("classical-ml covered MF; production retrieval wraps it in the same index machinery") — no re-teach.
- ANN: intuition + tradeoffs; NO algorithm internals (HNSW layer math out of scope).
- Keep the two-tower training details minimal (loss shape + negative sampling); module 7's focus is the SYSTEM.
- The funnel diagram must carry numbers (counts, latencies per stage) — an unlabeled funnel is decoration.
- Impression discounting: one clause naming it among the re-ranking rules — design-feed-ranking owns the mechanism (LinkedIn's decay factor) later in the module.

## FIGURE PLAN
- draw: THE funnel with numbers: 100M → 5k (multi-source retrieval, 20ms) → 500 ranked (100ms) → 20 re-ranked (10ms) → page; per-stage cost-per-item annotated. Original — the module's key image, reused by the design walkthrough.
- draw: The candidate-source portfolio: four parallel sources with their blind spots labeled, union/dedupe join. Inspired by Khang's Pinterest/YouTube descriptions.
- draw: FigureSequence (4 frames): two-tower serving — frame 1 item tower embeds the corpus offline; frame 2 index built; frame 3 request: user tower embeds live; frame 4 MIPS top-k returned; the offline/online boundary drawn as a vertical line. Inspired by Khang Ch.1 two-tower figure + Aminian Fig 2.19/2.20.
- draw: The sampled-softmax correction dissected: the batch as accidental negative sampler (popular items overrepresented), the corrected logit s − log p_j with each term labeled. Original derivation figure.
- draw: ANN tradeoff surface: recall vs QPS curves for three index families (schematic, shapes per ANN-Benchmarks), the operating-point choice marked. Inspired by ANN-Benchmarks convention.
- draw: Re-ranking pass: a top-20 list transformed by dedupe/diversity/freshness/exploration-slot rules, before/after columns with moved items traced. Original.

## EXERCISE PLAN
1. Warm-up: rebudget the funnel for a 100ms page with a 2ms/item ranker — max ranked candidates? Which stage absorbs the cut?
2. Boundary probe: corpus of 10k items — show the funnel degenerates (rank everything, one stage); compute the corpus size where retrieval becomes necessary given the ranker's cost, and state what this says about premature funnel-building.
3. Derivation the lesson skipped: derive the in-batch-negative bias — with items appearing as negatives ∝ popularity p_j, show the uncorrected softmax underscores popular items, and verify s − log p_j cancels it (write the softmax ratio).
4. Claim to refute: "our retrieval recall@500 is 98%, so retrieval isn't our problem." Name the measurement's circularity (recall against labels generated by the current system's exposure — loop from M6) and design the exploration-based estimate that isn't circular.
5. Research-shaped: from published ANN benchmark shapes, choose an index for (a) 1M items updated hourly, (b) 1B items rebuilt weekly, (c) 100k items with exact top-k feasible — justify with the four-way tradeoff.
6. Mixed/spaced (E3): the funnel's retrieval index is a partitioned scatter/gather system — recall the partitioning exercise and state the p99 implication of querying 16 shards (tail amplification, again).
7. FORWARD (E7): your ranker outputs P(click)=0.31 for the top item, and the ads team multiplies it by bid. Test whether 0.31 means 31%: bucket predictions and compare to observed rates. Solution: calibration for money — next lesson's core → Ref ranking-and-ctr.

## ARC
- Inherits: the whole classical stack — embeddings (M3), online prediction (M5), exploration (M6) — now composed into a product shape.
- Contributes: the funnel as compute-budget arithmetic, the retrieval portfolio, two-tower + ANN serving, and re-ranking as the product layer.
- Hands off: stage 2 in depth — CTR prediction, calibration, position bias → ranking-and-ctr.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
