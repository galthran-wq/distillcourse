# BERT at a billion requests: the Roblox serving stack — research brief

Lesson: `serving-bert-at-scale` (module: serving, core, planned). MODULE-FINAL APPLICATION LESSON (L16).
Goal: Analyze Roblox's path to serving BERT at over a billion daily requests on CPUs, mapping each step to the module's compression and serving tradeoffs.

## Sources
- DMLS Ch.7 (p.211, Fig 7-10 + boxed case study): the Roblox case — BERT → DistilBERT → dynamic-shape inputs → INT8 quantization; 100 → 3,015 inferences/sec; p50 latency 330ms → 10ms; quantization alone 7× latency / 8× throughput; the capture designingmac-s2-roblox-bert-latency (the published bar+line chart). Original: Le & Kaehler, "How We Scaled BERT to Serve 1+ Billion Daily Requests on CPUs," Roblox Tech Blog 2020 — cite as primary.
- MLPS Ch.6 quantization tables + Ch.13 GPU/CPU economics — the reference numbers the case is read against.
- DMLS Ch.7 (p.439 via AI-Eng summary): the PyTorch Llama-7B stacking case (compile → INT8 → INT4 → speculative decoding) — the "same playbook, next generation" closer; note the source's own caveat: quality cost never stated.
- Module lessons: model-compression (families and multipliers), model-servers-and-scaling (batching, capacity math), requirements-and-metrics (percentiles), deployment-and-online-experiments (how such a change ships safely).

## Key points
1. APPLICATION SPEC. Artifact: the Roblox optimization stack, replayed step by step with its published numbers. Module results used: distillation and PTQ-INT8 multipliers (model-compression), dynamic shapes as a serving-layer trick (model-servers), p50/p99 framing and capacity arithmetic (requirements + servers lessons), and the rollout such a swap requires (deployment lesson — the case doesn't describe it; we reconstruct it as an exercise). Departures from the idealisation: the published chart reports p50 (not p99 — what would the tail do?), reports no quality delta for INT8 (the critical omission), and CPU-only economics that flip if a GPU fleet already exists.
2. The replay, one section per step with its delta: baseline BERT (100 inf/s, 330ms); DistilBERT (~1.7× with 97%-quality citation from compression lesson); dynamic shapes (padding waste eliminated — explain WHY fixed-shape batching pads to max length and what that costs at short-median lengths); INT8 (the dominant win: 7×/8×).
3. Capacity arithmetic as the lesson's production: from 3,015 inf/s per host to a fleet for 1B/day (≈11,600/s average; peak factor; headroom; the p99-vs-p50 caution) — the reader computes a deployment.
4. Critical reading as a taught skill: what the case omits (quality deltas, tail latency, cost baseline) and how to read vendor/blog benchmarks (recall the NVIDIA 33× caveats); the PyTorch Llama-7B case shown briefly as the same stacking pattern one hardware generation later — bridging to LLM inference (M8).
5. The general lesson extracted: optimization stacks COMPOUND (each multiplier applies to the previous result), and the ordering matters operationally (distill first — it retrains; quantize last — it's cheap to redo).

## Set pieces & gems
- The published chart — sourced image (designingmac-s2-roblox-bert-latency): the actual measured bars.
- The compounding table: step / throughput / p50 / cumulative multiplier — reconstructed from the case's numbers.
- The "what's missing" checklist — quality delta, tail, cost — as the critical-reading takeaway card.
- Dynamic-shape padding arithmetic: median 24 tokens vs max 128 → ~5× wasted compute at fixed shape — a computable insight.

## Pitfalls
- This is an application lesson: NO new theory; every step must Ref the lesson that taught its mechanism.
- Don't invent numbers Roblox didn't publish (quality deltas); the omission IS content.
- The capacity math must state its assumptions (peak/average ratio, replica headroom) as assumptions.
- Keep the Llama-7B closer to one section — it is a bridge, not a second case study.

## FIGURE PLAN
- source: designingmac-s2-roblox-bert-latency — the published Roblox chart (save as `roblox-chart`); reader must see the four configurations' measured throughput/latency bars; centered at the top of the replay.
- draw: The compounding waterfall: throughput 100 → ~170 → ~380 → 3,015 inf/s as a stepped bar chart, each step labeled with its mechanism and the lesson that taught it. Original — key image.
- draw: FigureSequence (3 frames): fixed-shape padding — frame 1 a batch padded to 128 tokens, waste shaded; frame 2 dynamic shapes, batch grouped by length; frame 3 the compute saved computed on-figure. Original.
- draw: Capacity plan: from per-host inf/s to fleet size — the arithmetic drawn as a pipeline (1B/day → avg/s → peak/s → hosts with headroom), assumption boxes explicit. Original.
- draw: The critical-reading card: the published claims vs the three unreported quantities, laid out as a checklist the reader reuses on any benchmark. Original.

## EXERCISE PLAN
1. Warm-up: verify the cumulative multiplier from 100 to 3,015 inf/s and attribute the largest single factor.
2. Capacity: compute the fleet for 1B requests/day at a 3× peak-to-average ratio and 40% headroom on 3,015 inf/s hosts; then re-compute if p99 (not p50) constraints force batch size down 2×.
3. Boundary probe: at what request rate does this CPU stack lose to one A100 doing 8,000 inf/s at $X/hr? Set up the cost-crossover inequality with cloud prices as symbols — the answer's FORM (crossover exists) matters, not the exact number.
4. Claim to refute: "INT8 gave 7× for free." List what "free" omits (quality delta unreported; calibration-set work for PTQ; kernel support requirements) and design the measurement that would price it (offline gate on slices — Ref offline-evaluation).
5. Research-shaped: reconstruct the rollout plan Roblox does NOT describe: shadow with skew comparison, canary trigger metric (given 3-day label lag, which proxy?), A/B unit — one paragraph citing the deployment lesson.
6. FORWARD (E7): apply the same stacking instinct to a 7B-parameter generative model and identify which new bottleneck appears that BERT classification never had (autoregressive decode — one token at a time, memory-bound). Solution: that bottleneck is the whole subject of → Ref llm-inference.

## ARC
- Inherits: the full serving module — modes, compression multipliers, server mechanics, rollout discipline.
- Contributes: the module's application — a real published optimization stack replayed, its numbers verified, its omissions named, and a deployment computed from it.
- Hands off: a model serving cheaply at scale still decays in the world it serves — module 6 closes the loop (monitoring, drift, retraining).
- Spine step: "A model becomes a service…" (step 6, The model becomes a service) — closes the step.
