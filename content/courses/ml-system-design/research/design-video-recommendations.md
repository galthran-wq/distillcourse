# End-to-end design: video recommendation — research brief

Lesson: `design-video-recommendations` (module: canonical-designs, synthesis, planned). MODULE-FINAL APPLICATION LESSON (L16) and near-capstone: one complete design exercising the whole course to date.
Goal: Produce a complete system design for video recommendation — requirements through monitoring — exercising the full course template.

## Sources
- Aminian & Xu Ch.6 Video Recommendation (pp.115-144): the reference design this lesson follows and critiques — requirements dialogue, framing, two-tower retrieval + ranking funnel, multi-task engagement ranking, positional bias handling, serving diagram.
- Khang Pham Ch.4 YouTube Video Recommendations (pp.155-169): the fixed template (problem → metrics/requirements → model/data/features → calculation & estimation → high-level design → scale) — the back-of-envelope discipline. The sibling designs (LinkedIn feed, ads, search) are now the module's own case lessons — Ref design-feed-ranking / design-ad-click-prediction / design-search-ranking rather than re-covering them.
- System Design Primer appendix: powers-of-two + latency numbers for the estimation section.
- The course's own lessons — the actual source material: funnel (M7), ranking/CTR + position bias (M7), embedding search (M7), natural labels (M3), batch/online prediction + servers (M5), A/B + interleaving (M5), degenerate loops + exploration + retraining (M6), metrics chain + design doc (M1).
- Real-system departures: YouTube's multi-algorithm retrieval (Khang Ch.2), TikTok's exploration pools (M6), continual training cadence (M6).

## Key points
1. APPLICATION SPEC. Artifact: the complete design itself — a design document (M1's template) for a YouTube-scale video recommender, produced section by section in the lesson's own voice, then compared against the two interview-book reference designs and against documented real systems. Module results used: literally every module contributes a section and the lesson SAYS which (the throughline device: each section opens with its Ref). Departures from the idealisation: the interview template is single-pass and static; real systems run multi-source retrieval portfolios, continual training, exploration budgets, and organizational seams (separate retrieval/ranking teams) the template hides.
2. Requirements + estimation FIRST (numbers before boxes): DAU, corpus size, watch sessions/day → peak QPS, candidate volumes, latency budget (the funnel arithmetic recalled), storage for embeddings/features, index rebuild cost. One full back-of-envelope worked with powers-of-two discipline.
3. Framing + labels: engagement objective decomposed (watch-time vs clickbait — the misaligned-objective discussion); natural labels (watch/skip/finish) with loop lengths; position bias declared at data-design time (not discovered later); the degenerate loop declared upfront with its exploration budget.
4. The design core, drawn as one diagram built in stages: multi-source candidate generation (subscriptions, co-watch, fresh pool, topic similarity) → two-tower retrieval with ANN → multi-task ranker (engagement score table recalled) → re-ranking (diversity, freshness, guardrail heads) — with per-stage counts and latencies on the diagram.
5. Serving + freshness plan: what is precomputed (item embeddings, candidate lists?) vs per-request; index refresh cadence; feature freshness split (profile batch, session streaming); caching decisions; failure fallbacks (popular-in-region as the degraded mode — Burkov's fallback doctrine).
6. Measurement + operations plan: offline (nDCG on held-out engagement, calibration per head), online (A/B on watch-time with guardrail metrics; interleaving for ranker iterations), monitoring (prediction bias per slice, popularity-diversity for loop health), retraining policy (stateful daily for the ranker, weekly two-tower + index rebuild — justified via freshness-value reasoning).
7. The critique section: where the produced design would break at real scale — the template-vs-reality table (single retrieval model vs portfolios; static eval vs continual; no org boundaries) — critical reading as the module's exit skill.

## Set pieces & gems
- The full back-of-envelope block (DAU 2B → QPS ~ 100k peak; corpus 1B videos → two-tower index sizing at d=128 FP16 ≈ 256GB → sharded) — the estimation discipline made concrete.
- The one-diagram design assembled over the lesson — the course's most synthetic figure.
- The engagement-score guardrail heads (hide/block negative weights) recalled as product-safety-by-scoring.
- The template-vs-reality critique table — the honest close.

## Pitfalls
- This is SYNTHESIS: no new mechanisms may be introduced; every technique appears with a Ref to its lesson. If a needed mechanism has no lesson, the design must say "out of scope" (e.g., video understanding models).
- Keep the interview framing subordinate: the artifact is an engineering design doc, not interview theater (L9); the books are sources of the template, not the register.
- The estimation numbers must carry frames (per L12): every quantity gets its denominator/comparison.
- The sibling shapes (search, feed, ads, integrity) now have their own case lessons earlier in the module — this lesson Refs them for deltas and repeats none of their dissections; its distinct job is COMPOSITION at hundred-million-corpus scale (deep funnel + multi-head scoring + operations plan in one design), and the critique of the template.

## FIGURE PLAN
- draw: FigureSequence (5 frames): the design assembling — frame 1 requirements/numbers panel; frame 2 + candidate sources; frame 3 + two-tower/ANN retrieval; frame 4 + ranker and re-ranker; frame 5 + serving/monitoring overlays (caches, exploration slice, dashboards). One layer added per frame; final frame is the module's capstone image. Original, informed by Aminian Fig 1.23/Ch.6 and Khang Ch.4's diagrams.
- draw: The estimation block as a computation card: DAU → QPS → per-stage volumes → memory/index sizing, arrows carrying units. Original.
- draw: The label-design panel: watch/skip/finish events on a session timeline with loop lengths and the position-bias/exploration annotations made at design time. Original.
- draw: The freshness map: every component (embeddings, index, features, ranker weights) on a staleness axis with its refresh mechanism. Original.
- draw: Template-vs-reality table rendered as a two-column comparison with three named real-system departures. Original.

## EXERCISE PLAN
1. Warm-up: redo the back-of-envelope for a mid-size product (20M DAU, 10M-item corpus): peak QPS, retrieval volume, index memory at d=64 — and state which parts of the big design collapse (single-shard index; maybe no funnel — boundary recalled from funnel lesson).
2. Boundary probe: the cold-start extreme — day-one product, no engagement data at all. Which stages of the design survive (content-based retrieval, popularity) and which are unbuildable (two-tower, CTR ranker)? Sequence the bootstrap.
3. Claim to refute: "optimize watch time; it's the business metric." Use the clickbait/borderline-content failure mode to show watch time is a proxy with a gap (metrics chain recall); redesign the objective with guardrail heads and name the online metric that audits the gap.
4. Production (the module's E2 centerpiece): write the full design doc — 2 pages max — for "People You May Know" (graph-shaped, from Aminian Ch.11's territory) reusing the template: what replaces the two-tower (graph candidate generation: friends-of-friends), what replaces watch labels, where the loop hides.
5. Research-shaped: compare your produced design against Khang's published YouTube template — list three points where the designs disagree and adjudicate each with a course lesson.
6. FORWARD (E7): your re-ranker must now insert a conversational assistant's answer card above the video grid. List the two components of this course you have NOT yet built that the card needs (a generative model behind an API; retrieval over documents rather than items). Solution: that stack is module 8 → Ref foundation-models-in-production, retrieval-augmented-generation.

## ARC
- Inherits: every module 1-7 result; the funnel, ranking, and search machinery lessons plus the four case dissections (search, feed, ads, integrity) as the immediate parts bin — the feed lesson's multi-head scoring and the loop audits transfer directly, at a corpus scale that forces the deep funnel the feed did not need.
- Contributes: the synthesis — one complete, numbered, critiqued design; proof the course composes.
- Hands off: the classical story is complete; module 8 re-runs the discipline where the model is a foundation model someone else trained.
- Spine step: "The standard shapes…" (step 8, The canonical shapes) — closes the step.
