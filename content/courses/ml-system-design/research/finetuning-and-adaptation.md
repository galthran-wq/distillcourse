# Fine-tuning and parameter-efficient adaptation — research brief

Lesson: `finetuning-and-adaptation` (module: ai-engineering, EXTRA, planned). Off-path chapter; core path (prompt → RAG → evals → inference → architecture) survives skipping it.
Goal: Judge when to fine-tune and how — memory math, LoRA and QLoRA, multi-adapter serving — after prompting and RAG have been exhausted.

## Sources
- AI Engineering Ch.7: reasons to finetune (structured outputs, domain register, distillation to small models) and NOT to (task interference, up-front cost, base-model churn, pp.311-318); the BloombergGPT cautionary tale (Table 7-1: $1.3-2.6M, 1.3M A100-hours, 50B params — beaten by zero-shot GPT-4-0314 on FiQA 87.15-vs-75.07 and ConvFinQA 76.48-vs-43.41); memory math (pp.322-331 — recalled from distributed-training, now applied); PEFT taxonomy; LoRA deep dive (pp.332-346): W' = W + (α/r)AB, GPT-3 at 0.0027% trainable params, why-it-works/intrinsic dimension one Remark, multi-LoRA serving arithmetic (100 finetunes: 1.68B params merged vs 23.3M as rank-8 adapters), QLoRA (4-bit NF4 base + adapters; 65B on one 48GB GPU; Guanaco 65B Elo 1022 above ChatGPT 966); model merging one starred Remark (task vectors/SLERP named only).
- AI Engineering Ch.8 (data for finetuning, LIGHT): LIMA (1,000 curated pairs competitive in 43% of judgments); synthetic data + model collapse (Shumailov) one Remark; distillation path (Alpaca-style) one paragraph.
- MLPS Ch.22 (pp.412-415): LoRA/S-LoRA serving framing; DPO's loss shape and RLHF/RLAIF one Remark each — alignment methods NAMED, not taught (scope fence).
- Distributed-training lesson (M4): the memory bill machinery this lesson reuses on 7B/65B numbers.
- RAG lesson: the form-vs-facts fork — this lesson is the "form" branch's mechanics.

## Key points
1. Open with the cautionary tale: BloombergGPT's numbers vs zero-shot GPT-4 — domain pretraining lost to scale+generality; the lesson's stance: fine-tuning is a positioned tool (last rung of the ladder), not a default; the decision inherits RAG's form-vs-facts fork with eval gates.
2. When fine-tuning genuinely wins: reliable structured output/format compliance, domain register/style, latency-cost via DISTILLING a big model's behavior into a small one you own, bias correction; when it loses: facts (RAG), fast-moving base models (your finetune ages with its base), task interference.
3. The memory bill recalled and applied (M4's machinery): full fine-tune of 7B in BF16 + Adam ≈ 112GB before activations — the number that motivates PEFT; then LoRA's ledger: rank-r adapters on attention matrices, trainable fraction computed (the 0.0027% GPT-3 datum), merged-at-serving (zero latency cost) or kept separate.
4. LoRA mechanics honestly light: the decomposition W + (α/r)AB drawn on one matrix; r and α as the knobs; what quality evidence says (matches full FT on most adaptation tasks at r=8-64) — no intrinsic-dimension theory beyond a Remark.
5. QLoRA: quantized frozen base (4-bit) + BF16 adapters — the 65B-on-48GB result and Guanaco's Elo receipts; the compression machinery (M5 quantization) meeting the training machinery (M4).
6. Multi-adapter serving as the systems payoff: one base + N adapters (the 1.68B-vs-23.3M arithmetic worked); per-customer models become an inventory of small deltas — the serving implication (adapter swap per request, S-LoRA) bridging to llm-inference's batching world.
7. Data for fine-tuning in one section: LIMA's less-is-more datum (1k curated pairs); distillation from a teacher (Alpaca pattern) with its license caveats; synthetic-data feedback risk (model collapse) one Remark. Alignment (RLHF/DPO): scope-fenced to a Remark — consumed, not built.

## Set pieces & gems
- BloombergGPT vs GPT-4 table — the module's sharpest buy-vs-build datum.
- The 0.0027% and 1.68B-vs-23.3M arithmetic — both computed on-page.
- QLoRA/Guanaco Elo (1022 vs ChatGPT 966) — a 4-bit open finetune beating a closed product, dated and cited.
- LIMA's 1,000 pairs — data quality over quantity, quantified.
- The 7B full-FT memory bill — continuity with M4's method.

## Pitfalls
- EXTRA lesson: everything here must be skippable — the architecture lesson may NOT depend on it (lint: extra-prereq); the RAG lesson carries the decision framework for core-path readers.
- No RLHF/DPO training content — one Remark each with references; the fence is explicit.
- Model merging: starred Remark only (names + one sentence).
- Don't let LoRA become linear-algebra theory; the systems consequences (memory, serving, inventory) are the lesson.

## FIGURE PLAN
- draw: The adaptation ladder (from RAG lesson) with this lesson's branch expanded: the finetune rung split into full FT / PEFT-LoRA / QLoRA with their memory bills as bars. Original — key image.
- draw: LoRA on one matrix: W (d×d frozen) + A (d×r) B (r×d) trained, the parameter-count arithmetic on-figure at d=4096, r=8; the merge W' = W + (α/r)AB shown collapsing to one matrix at serving. Inspired by AI-Eng Fig 7-11.
- draw: FigureSequence (3 frames): multi-adapter serving — frame 1 one customer = one merged 7B model ×100 (the 1.68B... scale: use 100×16.8M matrix example as source states); frame 2 one shared base + 100 adapter pairs (23.3M); frame 3 a request routed with its adapter attached at runtime. Inspired by AI-Eng Fig 7-12.
- draw: The BloombergGPT scoreboard: cost/params/GPU-hours vs the two benchmark scores against zero-shot GPT-4 — a comparison card, numbers from Table 7-1. Original rendering of the table.
- draw: QLoRA's memory stack: 4-bit frozen base + BF16 adapters + paged optimizer, against the 48GB card line, 65B annotated. Inspired by AI-Eng Ch.7.
- draw: Decision flowchart: failure observed → information or behavior? → RAG | prompt-tune | finetune-distill, each exit tagged with its eval gate. Original (compresses Ch.7's workflow).

## EXERCISE PLAN
1. Warm-up: compute LoRA's trainable-parameter count for rank 16 on the four attention matrices (d=4096, 32 layers) and its fraction of a 7B model.
2. Boundary probe: r → d (full-rank adapters) — show LoRA degenerates to full fine-tuning of those matrices (parameter count and expressivity), and r=1's floor; what the r-sweep therefore measures.
3. Claim to refute: "we'll fine-tune the model on our product docs so it knows them." Diagnose with the form/facts fork (knowledge cutoff returns the moment docs change; hallucination on gaps) and prescribe RAG + optional format-finetune; cite the BloombergGPT lesson for the extreme version.
4. Derivation the lesson skipped: derive the break-even adapter count N where multi-adapter serving beats N merged models in memory: N·(merged size) vs base + N·(adapter size); solve for the source's 16.8M-matrix example.
5. Research-shaped: reconstruct the QLoRA headline: verify 65B × 4 bits ≈ 33GB base and fit the remaining budget (adapters, optimizer, activations) into 48GB — state which term the paper's paged-optimizer trick addresses.
6. Mixed/spaced (E3): your fine-tuned 13B ages when the provider ships a better base. Using M6's language, which maintenance posture does owning a finetune commit you to (retraining policy per base release + eval-gated migration) — write the trigger.
7. FORWARD (E7): serving 100 adapters means batches mix requests with different adapters. State the batching problem this creates for GPU kernels. Solution: adapter-aware batching lives in the same continuous-batching machinery as → Ref llm-inference.

## ARC
- Inherits: the form-vs-facts fork from retrieval-augmented-generation; memory-bill machinery from distributed-training; quantization from model-compression.
- Contributes: the last adaptation rung, costed — when it wins, LoRA/QLoRA mechanics at systems level, multi-adapter inventories.
- Hands off: nothing on the core path requires this chapter (extra by construction); readers rejoin at llm-evaluation.
- Spine step: "Foundation models invert the workflow…" (step 9, The foundation-model inversion) — starred appendix to the step.
