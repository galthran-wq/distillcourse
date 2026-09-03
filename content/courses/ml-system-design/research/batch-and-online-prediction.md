# Batch and online prediction — research brief

Lesson: `batch-and-online-prediction` (module: serving, core, planned).
Goal: Select among batch prediction, online prediction with batch features, and online prediction with streaming features for a given product.

## Sources
- DMLS Ch.7 (pp.197-205): the canonical three-architecture diagrams (Figs 7-4/7-5/7-6); batch waste — DoorDash/Grubhub ~2% daily-login users (p.201); unifying batch and streaming pipelines (Figs 7-7/7-8); the four deployment myths (pp.194-197 — use myth 3 "update rarely" and myth 4 "scale isn't my problem" as refutation slots).
- ML Design Patterns DP17 Batch Serving (pp.361-372): batch inference as embarrassingly parallel warehouse work (the CFPB 1.58M-complaints-in-35s BigQuery case — capture available); lambda-style combination; precompute+cache+refresh for recommendations. DP20 Keyed Predictions (pp.401-419): pass-through keys for unordered parallel outputs.
- MLPS Ch.12 (pp.183-194): batch vs real-time use-case catalogs; sync vs async (push/poll) delivery; the blue-socks staleness example (p.187); windowed temporal features at serving (taxi/jet-engine examples pp.193-194).
- CS329S Lecture 7/8: the DoorDash hybrid feature split (mean prep time batch; current queue depth + courier availability streaming).
- Module-2 recall: static/streaming features (batch-and-stream-processing), the feature platform's two stores.

## Key points
1. The three architectures as one decision, drawn: (a) batch prediction — precompute for all users nightly, serve from a table; (b) online prediction, batch features — model runs per request, features fetched precomputed; (c) online with streaming features — model per request, features seconds-fresh. The axis underneath: prediction freshness AND feature freshness are separate dials.
2. Batch prediction's economics both ways: throughput-optimal, tolerant of heavy models — and wasteful (predicting for the 98% who won't come — DoorDash) and stale (blue socks: the cart purchase can't update tonight's recommendations). When it's right: stable preferences, enumerable inputs, heavy models (translation pre-2016 style).
3. What moving to online actually requires (this is the systems content): a low-latency model (compression — next lesson), feature retrieval within budget (feature platform's online store), and for (c) a streaming pipeline maintaining windowed features (module 2's machinery, now load-bearing). The latency budget decomposed: network + feature fetch + inference + overhead against p99 (module-1 arithmetic recalled).
4. Unification: the two-pipeline bug (batch training pipeline vs streaming serving pipeline computing the same feature — skew, recalled with a Ref) and the two cures (stream-first with batch as bounded stream; or transform-in-model).
5. Keyed predictions in one section: batch/parallel outputs return unordered; client-supplied keys rejoin them — also enables sliced continuous evaluation (plant for module 6).
6. Hybrid reality: most products mix modes (precomputed candidates + online ranking — plants the funnel of module 7 explicitly).

## Set pieces & gems
- DoorDash 2%-login waste + blue-socks staleness — the two failure directions of batch, both concrete.
- The CFPB 1.58M-in-35s batch-inference run — sourced image (machinelearn-s3-fig5-1-bigquery-batch-serving) showing the actual console numbers; plus its comedic sentiment-model failure footnote (a furious complaint scored most-positive) as a Remark on batch QA.
- The three-diagram set (DMLS Figs 7-4..7-6) — the module's foundational visual, recreated in house style.
- Deployment myths 3/4 as refutation material (L13): "models should be updated rarely" (Weibo 10-minute cadence) and "only big tech needs scale".

## Pitfalls
- This lesson chooses the MODE; servers/batching/scaling mechanics belong to model-servers-and-scaling — keep the seam clean.
- Don't reopen stream-processing mechanics; Ref module 2 and use its vocabulary.
- Keyed predictions: one section, no SDK detail.
- The freshness discussion must quantify (staleness bounds per mode) or it degenerates to vibes.

## FIGURE PLAN
- draw: The three architectures as three aligned panels (batch table lookup / online + feature store fetch / online + stream-fed features), same user request entering each, freshness annotations per panel. Inspired by DMLS Figs 7-4/7-5/7-6 — the lesson's key image.
- draw: The two-dial picture: prediction freshness × feature freshness plane with real products placed (nightly recs, ETA, fraud, translation). Original.
- draw: FigureSequence (3 frames): the blue-socks failure — frame 1 nightly batch writes recs; frame 2 user buys blue socks at 14:00; frame 3 evening page still recommends blue socks; the "next batch run" arrow showing the staleness bound. Inspired by MLPS p.187.
- draw: Latency budget waterfall for online prediction: 200ms p99 decomposed into network / feature fetch / inference / margin, with the two attack points labeled (faster model → next lesson; cached features → feature platform). Original.
- source: machinelearn-s3-fig5-1-bigquery-batch-serving — the real BigQuery execution-details screenshot (save as `bigquery-batch`); reader must see 1,582,045 rows and 35.1s elapsed — batch inference as warehouse work; float right in the batch-economics section.
- draw: Keyed predictions: requests with client keys fanned to parallel workers, unordered results rejoined by key. Inspired by DP20.

## EXERCISE PLAN
1. Warm-up: for five products (translation app, credit-card fraud, homepage recommendations, weekly demand forecast, dynamic pricing), pick the mode and state the staleness bound each accepts.
2. Boundary probe: batch prediction where the input space is UNBOUNDED (arbitrary search queries) — show precomputation is impossible by cardinality, and what the halfway option is (precompute for the head, online for the tail; estimate head coverage from a Zipf assumption).
3. Claim to refute: "online prediction is strictly better — fresher is always worth it." Price it: compute cost per 1M predictions for a 50ms-GPU model online vs batched at 128, plus the streaming-pipeline tax; name the products where batch's staleness costs nothing.
4. Research-shaped: from the DoorDash 2% number, estimate the waste ratio of daily batch prediction for all users, and the break-even login rate where batch beats online on compute.
5. Mixed/spaced (E3): the feature platform's two stores — for architecture (b), which store is on the request path and what does its p99 do to the budget waterfall? (Recall the tail-amplification arithmetic with 3 feature fetches.)
6. FORWARD (E7): architecture (c) needs the model itself under ~30ms on CPU. Your BERT classifier takes 330ms. List the three compression families you'd try. Solution: exactly next lesson's toolkit, and the Roblox application lesson executes this very path → Ref model-compression, serving-bert-at-scale.

## ARC
- Inherits: a pushed, gated model from module 4; the feature platform and stream machinery from module 2.
- Contributes: the serving-mode decision — three architectures, two freshness dials, honest economics.
- Hands off: online modes need models that fit the request path's budget → model-compression.
- Spine step: "A model becomes a service…" (step 6, The model becomes a service).
