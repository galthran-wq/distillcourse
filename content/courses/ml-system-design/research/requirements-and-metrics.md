# Requirements, latency, and the metrics hierarchy — research brief

Lesson: `requirements-and-metrics` (module: production-ml, core, planned). Second lesson — still C3 territory: polished, ends in a computable win (the reader sizes a latency budget and an availability chain by hand).
Goal: Derive system requirements and a metrics chain from a business objective — percentile latency, throughput, and the offline-proxy → online → business hierarchy.

## Sources
- DDIA Ch.1 (pp.10-18): load parameters (the Twitter fan-out example with real Nov-2012 numbers: 4.6k tweets/s avg, 12k/s peak, 300k timeline reads/s); percentiles p50/p95/p99, tail-latency amplification across parallel calls; Amazon's 100ms→1% sales and why p99.9 SLAs target the best customers; scaling up vs out.
- DMLS Ch.1 (pp.16-18) + Ch.2 (pp.26-32): latency-vs-throughput with batching (Fig 1-4 — higher latency AND higher throughput); the four requirements (reliable/scalable/maintainable/adaptable); business vs ML objectives (Netflix take-rate); decoupling objectives (pp.41-43) — separate quality/engagement models with serving-time weights.
- System Design Primer: availability in numbers (9s table; series 99.9%×99.9%=99.8%, parallel 1-(0.001)²=99.9999%); latency-numbers table + visualization; performance-vs-scalability one-liner.
- Babushkin Ch.5 §5.2: hierarchy of metrics (offline/online/proxy/business), consistency metrics (precision unstable vs TPR/FPR stable under imbalance shifts — the fraud code example); Ch.12 §12.1.2 the airline WAPE/bias worked example (two models, identical WAPE, ±10% bias, $75,300 vs $83,900 revenue).
- CS329S Lecture 1: Booking.com 30% latency ↔ 0.5% conversion; Google/Akamai latency numbers.
- MLPS Ch.11 (p.175): optimizing metric vs gating metric (accuracy optimized, 200ms latency as a hard gate).

## Key points
1. Latency is a distribution: define p50/p95/p99 on a real histogram; then tail amplification — a request fanning out to N backends is as slow as the slowest: P(slow) = 1-(1-p)^N, worked at p=0.01, N=100 → 63%. Amazon's 100ms→1% sales and the p99.9-is-your-best-customers argument give the stakes. Demo (TailLatencyExplorer) does this live; prose sets the task before the reveal (D4).
2. Latency vs throughput are not reciprocal: batching 10 queries can take 20ms instead of 10×10ms — worse latency, 5× throughput (DMLS Fig 1-4). This single fact previews dynamic batching (M5) and continuous batching (M8).
3. Availability arithmetic: the 9s table; series multiplies availabilities down, parallel multiplies failure probabilities down — the 99.8% vs 99.9999% worked pair. Define SLO/SLA and error budget in one paragraph.
4. The metrics chain: loss → offline metric → online proxy → business metric. Each link has a named validity gap: loss vs metric (log loss down, F1 flat), offline vs online (distribution shift — forward Ref M6), proxy vs business (clicks vs revenue; the airline WAPE/bias example shows identical aggregate error, ~10% revenue difference). Rule #13's three-tier objective taxonomy (directly attributable actions / A/B-only indirect effects / never-optimize "happiness").
5. Decoupling objectives: newsfeed quality vs engagement as two models combined by α at serving time — retuning α needs no retraining. This is the first design pattern of the course.
6. Requirements checklist: reliable/scalable/maintainable/adaptable — one sentence each, forward-Ref'd to the modules that implement them.

## Set pieces & gems
- Twitter fan-out (DDIA pp.11-13): the canonical load-parameters case — worked as prose + figure here (join-at-read vs fan-out-on-write vs celebrity hybrid); reused in partitioning (hot keys).
- The p=1%, N=100 → 63% computation — the lesson's keeper number.
- Airline ticket bias example (Babushkin pp.236-237) — identical WAPE, opposite bias, $8,600 revenue gap over 4 days: proof that aggregate error metrics hide business asymmetry.
- Consistency-metrics observation (Babushkin §5.2): precision moves when class balance moves even if the model didn't change — plant for monitoring (M6).

## Pitfalls
- Don't drift into queueing theory; the course needs percentiles and fan-out arithmetic, not M/M/1.
- The metrics-hierarchy section must not become a metrics glossary (audience knows ROC-AUC); it's about the CHAIN and its gaps.
- Keep decoupling-objectives concrete (two models, one weight) — the general multi-objective literature is out of scope.
- SLO/SLA: define once, use everywhere later; don't re-derive the 9s table beyond the one worked pair.

## FIGURE PLAN
- draw: A latency histogram with p50/p95/p99 marked and the mean shown landing in a misleading spot (single Figure; labels on the visual). Inspired by DDIA Fig 1-4.
- draw: FigureSequence (3 frames): tail amplification — frame 1 one call, 1% slow; frame 2 fan-out to 10, shaded probability; frame 3 fan-out to 100 with 63% of user requests hitting a slow call. Inspired by DDIA Fig 1-5.
- draw: Batching panel: 10 sequential single queries vs one batch of 10 — timeline bars showing latency up, throughput up. Inspired by DMLS Fig 1-4.
- draw: Series vs parallel availability: two components chained (99.8%) vs mirrored (99.9999%), with the arithmetic on the figure. Inspired by the primer's prose.
- draw: The metrics chain as a four-link diagram — loss → offline → online proxy → business — each link annotated with its named gap and the module that studies it (this figure returns in llm-evaluation). Original composition from Babushkin's hierarchy.
- draw: Objective decoupling: one blended-loss model (retrain to change weights) vs two models + serving-time α (retune freely), side-by-side comparison panel. Inspired by DMLS pp.41-43.

## EXERCISE PLAN
1. Warm-up: a service calls 30 backends in parallel, each with 0.5% slow calls — compute the fraction of slow user requests, and the per-backend rate needed to keep it under 2%.
2. Boundary probe: with N=1 (no fan-out), p99 of the user request equals p99 of the backend; show where the amplification formula degenerates and why serial (not parallel) call chains ADD latencies instead — compute p99 for 3 serial calls from given distributions and note it is not the sum of p99s.
3. Claim to refute: "we improved mean latency 20%, so users are better off." Construct a distribution (cache-hit speedup + heavier tail) where the mean falls and p99 rises; name what the mean hides.
4. Derivation the lesson skipped: derive the availability of a two-of-three quorum of 99% nodes (binomial), and compare with the series/parallel extremes.
5. Research-shaped: reproduce the airline bias computation (Babushkin pp.236-237) from its table — two models, same WAPE, compute the revenue difference; state which single scalar you would add to the metric report to catch it (signed bias).
6. Mixed/spaced (E3): the ads walkthrough from ml-in-production — assign each of its 12 steps to a link of the metrics chain.
7. FORWARD (E7): the demo's fan-out task shows p99 exploding with N. Estimate the latency budget left per stage of a 3-stage pipeline (retrieve → rank → re-rank) inside a 200ms page budget. Solution: this budget IS why ranking systems are funnels → Ref recommender-funnel.

## ARC
- Inherits: the systems claim from ml-in-production — the model is 5%; the open question is what the other 95% must satisfy.
- Contributes: the language of specification — percentiles, throughput, availability, SLOs — and the metrics chain that every later evaluation hangs on.
- Hands off: with requirements and metrics fixed, the next question is what task and what baseline — → problem-framing-and-baselines.
- Spine step: "A trained model is the small part…" (step 1, The model is the easy part).
