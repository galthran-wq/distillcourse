# End-to-end design: search ranking — research brief

Lesson: `design-search-ranking` (module: canonical-designs, worked-practice, planned). First of the module's four end-to-end case dissections (RESTRUCTURE AMENDMENT): a full problem dissection in the engineering register — requirements → metrics → data → model → serving → monitoring — never interview prep.
Goal: Produce a complete design for a search-ranking system — query understanding, fused multimodal retrieval, graded-relevance labels from sessions, and the indexing/query serving split.

## Sources
- Khang Pham Ch.7 Airbnb Rental Search Ranking (pp.195-207): the reference end-to-end dissection this lesson follows — problem statement, nDCG as the offline metric, two-tower ranking architecture, calculation & estimation, high-level design, scale-out. Use its template discipline, not its interview register.
- Aminian & Xu Ch.4 YouTube Video Search (pp.71-91): the fused text-search + visual-search architecture (Fig 4.3); text preprocessing — normalization, tokenization, tokens-to-IDs via lookup table vs hashing; text representation (BoW/TF-IDF/embeddings/word2vec — Remark-level only, classical NLP assumed); video-level vs frame-level representation (one Remark); CTR/completion-rate/watch-time as online metrics; the weighted-sum fusing layer.
- Aminian & Xu Ch.9 / Grbovic & Cheng (KDD 2018): booking sessions as the label source — RECALLED from embedding-based-search (which owns the listing-embeddings dissection); here the sessions feed graded relevance for the RANKER.
- Khang Pham Ch.2 p.128: Airbnb's "Deep Learning is NOT a drop-in replacement" lessons — DL swapped for GBDT showed no offline gain; dropout gave +1% offline NDCG and zero online improvement; all-zero init failed until Xavier + random-uniform embeddings; LazyAdam for large embeddings. The lesson's candid what-didn't-work exhibit.
- Khang Pham Ch.1 (pp.83-96): serving embeddings (LinkedIn Pensive), ANN via Faiss/ScaNN — for the serving section, recalled from recommender-funnel.
- Course lessons this dissection assembles: embedding-based-search (contrastive training, the nDCG ladder, indexing vs query pipelines), ranking-and-ctr (the ranking stage's machinery), recommender-funnel (budget arithmetic, ANN), features-at-scale (hashing for query/token vocabularies), monitoring-and-observability (drift layers).

## Key points
1. Requirements and estimation FIRST, template discipline from Khang Ch.7: searches/day → peak QPS, corpus size, p99 page budget; the head/tail query distribution (Zipf) and what it buys (cache the head, model the tail). The defining contrast worked explicitly: a search funnel is QUERY-conditioned where a recommender funnel is USER-conditioned — the live side of the two-tower asymmetry flips to the query.
2. Query understanding as a pipeline stage with its own failure modes: normalization → tokenization → IDs (lookup vs hashing — features-at-scale recalled: query vocabularies are unbounded too) → query embedding computed per request. One Remark on spelling/expansion; no NLP zoology.
3. Fused retrieval as a portfolio (funnel recall): term-based text match over an inverted index + embedding similarity via ANN + engagement priors, union → dedupe (Aminian Fig 4.3's weighted fusing). State plainly that term-based and embedding-based retrieval have complementary blind spots — exact entity names vs paraphrase — one paragraph, because RAG's hybrid-search section develops it fully (forward plant).
4. Labels from sessions, graded: impression < click < long stay < booking as relevance grades 0–3; why the label choice fixes the metric (binary single-answer → MRR's world; graded lists → nDCG — ladder recalled from embedding-based-search, not re-taught); business asymmetry stated in requirements terms (an empty page and a bad first result cost differently).
5. The ranker: per query–listing pair features (text-match score AS a feature, quality, freshness, price fit), two-tower scoring per Khang Ch.7 — and the Airbnb negative-results exhibit read critically: what each non-result (no DL gain; offline+1%/online 0) demonstrates about offline–online divergence (offline-evaluation + deployment lessons Ref'd).
6. Serving and operations: the two pipelines with different clocks recalled (indexing lane vs query lane) plus search's own additions — head-query result caching with invalidation on index refresh; monitoring: query drift (new entities/events spike the unknown-token rate), null-result rate as a product alarm, session-success online metrics.

## Set pieces & gems
- Airbnb's "DL is not a drop-in replacement" list (Khang p.128) — the module's best documented negative result; read as evidence, not anecdote.
- The Zipf head-query cache arithmetic — fraction of traffic served from cache vs cache size, worked with real-ish numbers.
- The fused weighted-sum architecture (Aminian Fig 4.3) — the one diagram every search system redraws.
- The recall@10=0 counterexample (rank 15 vs rank 50, Aminian p.87) — recalled in one sentence as the reason the ladder exists; embedding-based-search owns the full ladder.
- The graded-relevance session mapping — a complete, small worked example (one session → one training row set).

## Pitfalls
- Do NOT re-teach the metric ladder, contrastive training, or ANN — embedding-based-search and recommender-funnel own them; this lesson Refs and applies.
- BM25/inverted-index internals: one paragraph of intuition; the full term-vs-embedding treatment belongs to retrieval-augmented-generation.
- BoW/TF-IDF/word2vec: one Remark; classical prerequisite.
- Engineering register throughout: no interviewer/candidate dialogue, no "in an interview you would…" framing (the amendment is explicit).
- Every estimation number carries its denominator; the design diagram carries per-stage counts and latencies.

## FIGURE PLAN
- draw: THE search system in one diagram with numbers: query → understanding → fused retrieval (inverted index + ANN, union/dedupe) → ranker → page, per-stage latencies and candidate counts annotated. Single <Figure>; original, informed by Aminian Fig 4.3 + Khang Ch.7's design diagram.
- draw: FigureSequence (3 frames): the two clocks — frame 1 offline: corpus embedded, ANN index + text index built; frame 2 a query arrives: normalized, tokenized, embedded; frame 3 both retrievers fire, results union, ranker orders. Inspired by Aminian Figs 2.19/2.20 + 4.3.
- draw: Graded relevance from one session: a search-session timeline (impressions, click, long stay, booking) mapped to grades 0–3, feeding an nDCG computation stub. Original, informed by Grbovic & Cheng's session structure.
- draw: The Zipf panel: query-frequency rank curve with the cache line drawn — shaded area = traffic served from a head cache of size k; the invalidation tie to index refresh noted. Original.
- draw: The asymmetry panel: two failed result pages side by side (empty page vs irrelevant first hit) with their different costs and the metric each failure moves (null-result rate vs nDCG@1). Original.
- draw: Offline–online divergence card for the Airbnb negative results: offline delta vs online delta per intervention (DL swap 0/0; dropout +1%/0), with the course lesson that names each failure. Original, from Khang p.128.

## EXERCISE PLAN
1. Warm-up: estimate for 10M listings and 50M searches/day: peak QPS (×3 diurnal factor), ANN index memory at d=128 FP16, and whether one node holds it — state which components shard first.
2. Boundary probe: navigational queries with exactly one right answer — show nDCG with a single grade-1 item degenerates to an MRR-like quantity, and the ranker's job collapses into retrieval; state what re-ranking still owes the page (dedup, freshness).
3. Claim to refute: "bookings are the business event, so train the ranker on bookings only." Work the sparsity (bookings per 1,000 sessions vs clicks), name the exposure bias bookings-only labels inherit, and rebuild the graded ladder as the fix.
4. Derivation the lesson skipped: from a 200ms page budget and a 1ms/candidate ranker, derive the maximum union size the fused retrievers may return; show the union of two 500-candidate retrievers forces the dedupe stage and compute the overlap rate at which fusion stops paying.
5. Research-shaped: take Airbnb's published negative results and, for each, design the check that would have caught it before launch (offline/online correlation audit; an A/A-calibrated online test with MDE sized for +1% NDCG) — cite the course lesson each check comes from.
6. Mixed/spaced (E3): after a world event, the unknown-token rate of query tokenization triples and null results spike — classify the shift (covariate, in $P(X)$) and name the monitoring layer that catches it before the business KPI does (M6 recall).
7. FORWARD (E7): swap listings for documentation paragraphs and the searcher for a chatbot: your fused term+embedding retriever now feeds top-k paragraphs to a generator instead of a ranked page to a person. State what changes in the metric (order within k stops mattering; containment of the answer starts). Solution: this is RAG's hybrid retriever → Ref retrieval-augmented-generation.

## ARC
- Inherits: the retrieval machinery and metric ladder from embedding-based-search; the ranking stage from ranking-and-ctr; the funnel's budget arithmetic from recommender-funnel.
- Contributes: the first full shape dissection — a query-conditioned system taken from requirements to monitoring, with the canon's documented negative results read as evidence.
- Hands off: the dissection discipline moves to the feed shape (small fresh inventory, many objectives) → design-feed-ranking; the fused term+embedding retriever returns as hybrid search in module 8's RAG lesson.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
