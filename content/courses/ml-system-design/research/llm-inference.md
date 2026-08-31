# LLM inference optimization — research brief

Lesson: `llm-inference` (module: ai-engineering, core, planned). Carries the KVCacheBudget demo. Heaviest technical lesson of the module (est 40 min).
Goal: Apply the LLM serving toolkit — KV-cache budgeting, continuous batching, PagedAttention, quantization, speculative decoding — against TTFT and TPOT budgets.

## Sources
- AI Engineering Ch.9: prefill vs decode (compute-bound vs memory-bandwidth-bound, Fig 9-3); roofline concept (Fig 9-2, one Remark); metrics — TTFT/TPOT/total = TTFT + TPOT×tokens, percentile discipline recalled; throughput vs GOODPUT (SLO-satisfying throughput); utilization — nvidia-smi% vs MFU vs MBU (the MBU formula); KV-cache sizing 2·B·S·L·H·bytes with the Llama-2-13B worked example (batch 32, seq 2048 → 54GB > weights, pp.433-435); the 800KB/token 13B-OPT arithmetic (from vLLM §3 — same computation, use once); attention redesign (MQA/GQA/local/cross-layer; Character.AI's >20× KV cut via MQA+local+cross-layer, p.436); KV quantization; FlashAttention one Remark; batching static/dynamic/continuous with the bus analogy (Figs 9-15/9-16); prompt caching (Anthropic: 100k-token cached context, TTFT 11.5s→2.4s (−79%), −90% cost, Table 9-3); speculative decoding (draft K tokens, verify in parallel, accept agreeing prefix; DeepMind 4B-draft/Chinchilla-70B halved latency); parallelism (replica/tensor/pipeline — M4 recall); DistServe prefill/decode decoupling one Remark; the archery analogy (model/hardware/service levels, p.426).
- vLLM paper (research/texts, full): §3.1 fragmentation taxonomy (reserved/internal/external) with Fig 2's measured 20.4-38.2% utilization vs 96.3%; §4 PagedAttention — blocks=pages/tokens=bytes/requests=processes, block tables, the "Four score and seven years ago" worked trace (Figs 6-7); copy-on-write sharing for parallel sampling/beam search; §4.5 swap vs recompute (recompute ≤20% of swap latency); headline 2-4× throughput (Figs 12-13 capture); block size 16 (§7.2).
- Model-compression lesson (M5): quantization recalled; serving-bert lesson's forward exercise (the autoregressive bottleneck) resolved here.
- Finetuning extra's S-LoRA batching question: one sentence if space (adapter-aware batching exists) — do NOT depend on the extra lesson (lint).

## Key points
1. The two-workload anatomy: prefill (parallel over prompt tokens — compute-bound) vs decode (one token at a time, each step re-reading all weights + KV — memory-bandwidth-bound); why TTFT and TPOT are DIFFERENT budgets with different levers; total latency = TTFT + TPOT × output length. The roofline framing in one Remark (operational intensity decides which wall you hit).
2. The KV cache derived, then priced: why attention needs past K/V per token; the sizing formula built term by term; the double worked example — 800KB/token for 13B-OPT, and batch-32/seq-2048 → 54GB > the model's own weights. This is the object the rest of the lesson attacks. The demo (KVCacheBudget) turns the formula into a task (fit Llama-13B; find max batch under MHA/GQA/INT8-KV).
3. The waste, measured: vLLM's fragmentation taxonomy (reserved-to-max-length, internal, external) with the 20-38% real-utilization measurement; PagedAttention as virtual memory (blocks/pages analogy carried exactly as the paper does); block tables, sharing via copy-on-write (parallel sampling/prefix sharing); the 96.3% and 2-4× results; block size 16 as the parallelism-vs-fragmentation compromise.
4. Batching's evolution: static (bus waits for full seats) → dynamic (bus departs on timer — M5's server recalled) → continuous (seats refilled per token; the batch never drains) — why autoregressive generation forces the third form; goodput vs throughput (a batch that blows the SLO produces throughput and no goodput).
5. The attack catalog on decode, each with its price: GQA/MQA (heads share KV — Character.AI's 20×; quality cost small but nonzero), KV quantization (M5 recall), prompt caching (shared prefixes cached across requests — the Anthropic 79%/90% numbers; connects to semantic caching next lesson), speculative decoding (draft/verify — acceptance-rate dependence; halved latency at no quality loss since verification is exact).
6. Utilization honestly: nvidia-smi's busy% vs MFU/MBU; the MBU computation for a decode-bound workload showing "100% busy" GPUs doing little math — measurement literacy for capacity planning (serving-bert's fleet math recalled at LLM scale).
7. The archery close: model-level (arrows: quantization/distillation — M5), hardware (archer), service-level (process: batching/caching/routing) — the map of what this course optimized where.

## Set pieces & gems
- The 54GB-vs-26GB (cache vs weights) computation — the module's keeper number, derived not quoted.
- vLLM Fig 2's measured waste — sourced image; the paper's load-bearing evidence.
- The blocks=pages/tokens=bytes/requests=processes analogy — carried verbatim as the explanatory spine.
- Anthropic prompt-caching numbers (−79% TTFT / −90% cost) — a dated, concrete before/after.
- Character.AI's 20× — production KV surgery.
- The bus analogy for batching — the source's own device, kept.
- The "Four score and seven years ago" block-table trace — the paper's worked example, recreated as a FigureSequence.

## Pitfalls
- No transformer-internals teaching: attention appears ONLY as "keys/values must be kept per token" — one anchoring clause, no QKV math derivation (scope fence from foundation-models holds).
- MFU/MBU: one worked MBU number, no benchmark tables.
- Speculative decoding: mechanism + acceptance intuition; no rejection-sampling correctness proof.
- Keep vLLM engineering (kernels, fused ops) out; the memory model is the content.
- Do not require the finetuning extra (S-LoRA mention must be dependency-free).

## FIGURE PLAN
- draw: Prefill vs decode as two panels: prompt tokens processed in parallel (wide, compute-shaded) vs generation loop (narrow repeated steps, memory-traffic-shaded), TTFT/TPOT brackets mapping metrics to phases. Inspired by AI-Eng Fig 9-3 — key image.
- draw: The KV-cache formula built term by term: 2 × B × S × L × H × bytes, each factor annotated, then the 13B numbers plugged in ending at 54GB beside the 26GB weights bar. Original derivation figure (the demo's static twin).
- source: efficientmem-fig2-waste — vLLM's measured memory-breakdown bars (save as `kv-waste`); reader must see 20-38% token-state share vs vLLM's 96.3%; centered in the fragmentation section.
- draw: FigureSequence (5 frames): PagedAttention's block table on the "Four score…" trace — frame 1 prompt fills logical blocks mapped to scattered physical blocks; frame 2 decode appends within a block; frame 3 block full → new physical block allocated; frame 4 second request interleaves its blocks; frame 5 shared prefix blocks with refcount 2 (copy-on-write). From vLLM Figs 6-8.
- draw: Batching evolution: three timelines (static/dynamic/continuous) of 4 requests with different lengths — idle seats shaded; continuous refills mid-flight. Inspired by AI-Eng Figs 9-15/9-16 (bus analogy in labels).
- draw: Speculative decoding one round: draft proposes 5 tokens, target verifies in one parallel pass, longest agreeing prefix accepted (3), the rejected tail discarded. Inspired by AI-Eng Fig 9-9 lineage.
- source: efficientmem-fig12-eval-curves — one cropped panel of the latency-vs-request-rate curves (save as `vllm-throughput`); reader must see the capacity knee moving right 2-4×; float right beside the results paragraph.

## EXERCISE PLAN
1. Warm-up: compute KV-cache per token for Llama-2-7B (32 layers, d=4096, FP16) and the max batch at 4k context on an 80GB card with 14GB weights (MHA).
2. Boundary probe: GQA with groups → 1 (MQA) and groups → heads (MHA) — compute the KV formula's H-factor at both extremes for the 13B example; state what MQA pays (per the sources: quality, mitigated how — Character.AI's interleaved design).
3. Derivation the lesson skipped: total latency = TTFT + TPOT×n — derive the output length n* where decode overtakes prefill for given TTFT=800ms, TPOT=40ms; then show why streaming (show tokens as they come) changes the PERCEIVED budget to TTFT alone.
4. Claim to refute: "our GPUs are at 98% utilization (nvidia-smi), we're compute-limited — buy more GPUs." Compute MBU for a decode workload (params×bytes×tok/s / bandwidth) showing bandwidth is the wall; name the two fixes that add throughput WITHOUT new hardware (bigger batches via paging; quantized KV).
5. Research-shaped: from vLLM's Fig 2 shares, estimate how much batch-size headroom eliminating fragmentation buys at fixed memory (utilization 30%→96% ≈ 3×) and check consistency with the paper's 2-4× throughput claim.
6. Mixed/spaced (E3): prompt caching is the prefix-sharing idea — connect it to PagedAttention's refcounted blocks AND to M5's cache-strategy vocabulary (what's the invalidation story when the system prompt changes?).
7. FORWARD (E7): with serving costs now legible, your product wants: cheap model for easy queries, expensive for hard ones, cached answers for repeats, guardrails on everything. Sketch the boxes. Solution: that IS the reference architecture — the course's final lesson assembles it → Ref ai-application-architecture.

## ARC
- Inherits: compression (M5), server batching (M5), the autoregressive bottleneck flagged by serving-bert; evaluation's cost pressure from llm-evaluation.
- Contributes: the decode-bound economics — KV-cache arithmetic, paged memory, continuous batching, caching, speculation — with measured results from the primary source.
- Hands off: cost and latency levers in hand, the final lesson assembles the whole guarded application → ai-application-architecture.
- Spine step: "Trust and cost at scale…" (step 10, Trust and cost at scale).
