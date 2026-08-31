# Embedding-based retrieval and search ranking — research brief

Lesson: `embedding-based-search` (module: canonical-designs, core, planned).
Goal: Design an embedding-based retrieval system — contrastive training, the ranking-metric ladder, and the production indexing pipeline.

## Sources
- Aminian & Xu Ch.2 Visual Search (pp.31-51): representation learning; contrastive training (query/positive/in-batch negatives → similarity → softmax → cross-entropy, Figs 2.6-2.11); self-supervised positives via augmentation (SimCLR/MoCo-style); the metric ladder BY COUNTEREXAMPLE — MRR's blind spot (Fig 2.14: two models both MRR=1/2, one returns 3 relevant items), precision@k ignores order, recall@k=0 hides a rank-15-vs-50 gap (Ch.4 p.87), nDCG fully worked (relevances [0,5,1,4,2]: DCG=6.151, IDCG=4.131... check: IDCG for sorted [5,4,2,1,0]; nDCG=0.587... note source says DCG 2.423? use the summary's Ch.2 numbers: DCG@5=2.423, IDCG@5=4.131, nDCG@5=0.587 — recompute independently when writing and trust the arithmetic, not the transcription); indexing + query pipelines (Figs 2.19/2.20); Ch.4 YouTube search: text+visual fused, frame-level vs video-level (one Remark).
- Aminian & Xu Ch.9 Similar Listings (pp.195-210): the Airbnb listing-embeddings reconstruction — skip-gram over click sessions; the booked-listing-as-global-context fix; same-market hard negatives; average-rank-of-the-booked-listing as the offline metric. (Original: Grbovic & Cheng, KDD 2018 — cite as primary in References.)
- Khang Pham Ch.1 (pp.19-30): co-trained vs pretrained embeddings; similarity choices (cosine, dot — dot favors popular/high-norm items; the LinkedIn Hadamard quote); embedding evaluation via downstream tasks.
- Khang Ch.7 Airbnb Search Ranking (pp.195-207): nDCG as the offline metric for search; two-tower for search ranking.
- Recommender-funnel lesson: ANN + two-tower — this lesson reuses both with Refs; do not re-teach.

## Key points
1. The reduction: "similar images / similar listings / relevant videos" all become geometry — embed queries and items into one space where similarity = dot product; what changes across products is the TRAINING SIGNAL (co-click sessions, bookings, augmentations) and the EVALUATION.
2. Contrastive training mechanically: (query, positive, negatives) → similarities → softmax → cross-entropy; where positives come from — user co-engagement (sessions) vs self-supervised augmentation (visual search: crop/flip of the same image as free positives — the lion-augmentation capture); in-batch negatives recalled (funnel lesson's popularity correction Ref'd).
3. The metric ladder taught exactly as the source does — by successive counterexample, each metric introduced by the failure of the previous: MRR (only first relevant counts — the two-models-tie counterexample), precision@k (ignores order), recall@k (denominator explodes; hides rank-15-vs-50), nDCG (log-discounted gains normalized by ideal — worked in full on a 5-item list, every arithmetic step visible). This is the lesson's L7 centerpiece.
4. The Airbnb case as production embedding engineering: skip-gram over click sessions (word2vec transplanted — one sentence, no re-teach); the two named fixes and WHY each exists — booked listing as global context (the session's terminal success propagated to all its items), same-market hard negatives (random negatives are too easy — cross-market pairs teach nothing); the offline metric aligned with the business event (average rank of the eventually-booked listing).
5. The two production pipelines with different clocks: indexing (embed corpus → build ANN index → refresh cadence) vs query path (embed query → ANN → rerank); what goes stale in each and the freshness budget (funnel + feature-platform Refs).
6. Fused/multimodal search in one section: text match + visual similarity + engagement blended (YouTube search's weighted fusing) — a preview of hybrid search (RAG lesson takes the term further).

## Set pieces & gems
- The metric-ladder counterexamples — small, complete, and the course's best example of teaching-by-refutation (L13-adjacent but about metrics).
- The nDCG full computation — keeper worked example.
- Airbnb's booked-listing global context — a genuinely clever, documented trick; the average-rank metric as business-aligned evaluation (metrics-hierarchy callback).
- machinelearn-aminianxu-pinterest-visual-search capture — the shipped product exhibit (claimed HERE, not in funnel — coordinate).
- machinelearn-aminianxu-lion-augmentation capture — real pixel-level augmentations as free positives.

## Pitfalls
- Do not re-teach word2vec/skip-gram (classical-ml/NLP background assumed; one clause anchors it).
- ANN and two-tower: Refs to recommender-funnel, zero duplication.
- The nDCG arithmetic MUST be recomputed independently (the source transcription is suspect); show every step.
- Contrastive-loss zoology (InfoNCE/triplet/margin): name InfoNCE once; no loss taxonomy.

## FIGURE PLAN
- source: machinelearn-aminianxu-pinterest-visual-search — the real Pinterest crop-to-similar UI (save as `pinterest-visual-search`, cropped from the page render); reader must see query crop and result rail — the product the section designs; centered at the opening.
- draw: The contrastive step: query embedding, one positive, batch negatives as points; similarity column → softmax → loss; one training step pulls positive in, pushes negatives out (before/after inset). Inspired by Aminian Figs 2.6-2.11.
- source: machinelearn-aminianxu-lion-augmentation — the augmentation grid (save as `augmentation-grid`); reader must see actual pixel effects of flips/rotations/noise — self-supervised positives; float right in the training-signal section.
- draw: FigureSequence (4 frames): the metric ladder — frame 1 two ranked lists tying on MRR (counterexample visible); frame 2 precision@k blind to order; frame 3 recall@k hiding 15-vs-50; frame 4 nDCG's discounted gains computed on-figure. From Aminian Figs 2.14-2.18, recomputed.
- draw: Airbnb session → training pairs: a click session ending in a booking; context windows drawn; the booked listing's global-context edges to every session item; hard negatives sampled from the same market (map inset). Inspired by Aminian Ch.9 / Grbovic & Cheng.
- draw: The two pipelines with clocks: indexing lane (nightly: embed corpus → build index) and query lane (per request: embed → ANN → rerank), staleness annotations at the seam. Inspired by Aminian Figs 2.19/2.20.

## EXERCISE PLAN
1. Warm-up: compute DCG@5, IDCG@5, nDCG@5 for relevances [3,0,2,0,1] with log2 discounting — every step written.
2. Boundary probe: a query with exactly one relevant item — show nDCG and MRR coincide (up to convention), and precision@k is maximized by k=1; conclude which metric to report when relevance is binary and singular (and why MRR was designed for that world).
3. Claim to refute: "recall@100 = 0.99, our retrieval is essentially solved." Two breaks: (a) rank-within-100 unmeasured (the ranker's burden quantified — nDCG@100 could still be poor); (b) the relevance labels came from the current system's exposure (circularity — funnel lesson recall).
4. Derivation the lesson skipped: show why dot-product similarity favors high-norm (popular) items while cosine does not; construct the 2-item example where the ranking flips between the two; connect to the funnel's popularity correction.
5. Research-shaped: reconstruct Airbnb's design choices as a causal argument — for each fix (global context; in-market negatives), state the failure it addresses and the offline metric movement that would validate it (average rank of booked listing).
6. Mixed/spaced (E3): your image-embedding index refreshes nightly, but sellers upload 50k new listings/day. Which funnel component covers the gap until the next index build (a fresh-pool candidate source + exploration slice — funnel and M6 recalls)?
7. FORWARD (E7): your retrieval must now serve a TYPED QUERY — "loft with a garden near Lisbon" — where embedding similarity alone misses exact constraints and text match alone misses paraphrase. Sketch the union of a term-based retriever and your embedding retriever and name the new preprocessing the query needs before either can fire. Solution: query understanding + fused retrieval — the next lesson dissects the whole search system → Ref design-search-ranking.

## ARC
- Inherits: two-tower + ANN from recommender-funnel; embeddings-as-features from module 3; the ranking stage from ranking-and-ctr.
- Contributes: contrastive training signals, the order-respecting metric ladder (nDCG), and production embedding pipelines — the search machinery completed.
- Hands off: the machinery becomes a whole system — the module's four end-to-end dissections open with search → design-search-ranking; the retriever built here also returns as RAG's front half in module 8.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
