# Foundation models as system components — research brief

Lesson: `foundation-models-in-production` (module: ai-engineering, core, planned). Opens the AI-engineering module.
Goal: Analyze what changes when the model is a foundation model — sampling and hallucination as system properties, per-token economics, and the model-selection workflow.

## Sources
- AI Engineering Ch.1: the three-layer AI stack (Fig 1-14, p.38); AI vs ML engineering; product-first iteration (Fig 1-16, p.47); the last-mile problem (LinkedIn: 1 month to 80%, 4 more to 95%, pp.33-34); use-case risk framing (one Remark).
- AI Engineering Ch.2 (pp.88-111): sampling — logits→softmax→probabilities pipeline (Figs 2-14..2-18), temperature (the 2-token toy: logits [1,2]), top-k/top-p; the probabilistic nature — inconsistency + hallucination's two hypotheses (self-delusion/snowballing — Ortega; mismatched internal knowledge — Gao/Schulman); the LLaVA shampoo-bottle exhibit (capture).
- AI Engineering Ch.4 (pp.160-208): model selection — hard vs soft attributes; the 4-step workflow (filter → public benchmarks → own evals → monitor, Fig 4-5); build vs buy's 7 axes (Table 4-4); open-weight gap chart (Fig 4-7 capture); the a16z survey (capture); data contamination + "a benchmark stops being useful as soon as it becomes public"; the Gemini-vs-ChatGPT MMLU trap (CoT@32 vs 5-shot: matched conditions flip the winner — pp.44-45); API cost curves vs self-hosting; the GPT-drift measurement (Chen et al., Fig 4-9 capture) — the provider-model-drift risk.
- DMLS/module recalls: metrics chain (evals will extend it); the drift-detection forward exercise resolved (provider drift is a NEW drift source).
- Scaling/pretraining content (Chinchilla, RLHF): explicitly OUT of scope — one Remark with references; this course consumes models, not trains them.

## Key points
1. The inversion stated as workflow: classical ML iterates model-first (train → evaluate → deploy); AI engineering iterates product-first on a fixed model (prompt → evaluate → ship → maybe adapt) — the three-layer stack locating this course's work in the application layer. The last-mile problem (80% in a month, 95% in five) as the module's recurring cost curve.
2. Sampling as configuration, not noise: the logits→temperature→softmax→truncation pipeline worked on the 2-token toy (compute the probabilities at T=0.5/1/2); top-p defined; consequence: the same system with T>0 is nondeterministic BY SETTING (Babushkin's ChatGPT triple-answer recalled); seeds/logprobs as the observability hooks.
3. Hallucination as a system property with two working mechanisms: self-delusion (own generated tokens treated as evidence — snowballing; the LLaVA milk-bottle exhibit) and mismatched knowledge (SFT teaches the model to answer beyond its knowledge); each hypothesis implies a different mitigation family (grounding/context vs calibration/refusal) — the RAG and evals lessons pick these up by name.
4. Token economics: input/output pricing asymmetry; cost per request estimated for a concrete app (support bot: 2k-token context, 300-token answer × volume); TTFT vs full-response latency (prefill/decode named, deep-dive deferred to llm-inference); the API-vs-self-host crossover as a utilization argument (7 axes compacted to the three that usually decide: privacy, cost-at-volume, control).
5. Model selection as the 4-step loop with contamination discipline: filter by hard attributes (license, context length, modality, on-prem); read public benchmarks SUSPICIOUSLY (the Gemini CoT@32 trap worked — prompt-setting confounds; contamination — the "public benchmark" quip; Schaeffer's satirical 1M-param model as reductio); then YOUR evals (llm-evaluation builds them); then monitor — including the provider drifting under you (the GPT March-vs-June measurement) — the new drift source module 6 never had.
6. What this module will NOT cover (scope contract): pretraining, RLHF mechanics, scaling laws — named, referenced, excluded; the course consumes foundation models as components.

## Set pieces & gems
- The temperature toy (logits [1,2]) computed at three temperatures — small, complete.
- LLaVA shampoo/milk — sourced image; hallucination as an authentic input/output pair.
- The Gemini MMLU comparison trap — benchmark-reading as a skill.
- GPT drift (March vs June 2023) — sourced image; "the model changed under you" as data.
- LinkedIn last-mile numbers (1 month to 80%, 4 more to 95%).
- The Convai "as an AI model I don't have physical abilities" case (Ch.4 p.189) — a Remark on why over-refusal forces model switches.

## Pitfalls
- Do NOT teach transformers/attention/pretraining — the scope contract paragraph exists precisely to fence this; references carry it.
- Hallucination hypotheses are HYPOTHESES — present with the source's own uncertainty; no folk certainty.
- The 7 axes must be compressed (three deciders + table), not enumerated as doctrine.
- Cost arithmetic with current prices dates fast — use symbolic prices with one dated worked example flagged as dated.

## FIGURE PLAN
- draw: The three-layer stack with this course's modules mapped onto it (application layer = M8; model development = out of scope; infrastructure = M2/M5 reused). Inspired by AI-Eng Fig 1-14 — key image.
- draw: FigureSequence (3 frames): the sampling pipeline on the 2-token toy — frame 1 logits; frame 2 temperature rescaling (three T values side by side); frame 3 softmax probabilities + a sampled output differing between runs. Inspired by AI-Eng Figs 2-14..2-16.
- source: aiengineerin-s1-llava-hallucination — the shampoo-bottle/milk pair (save as `llava-hallucination`); reader must see the real photo and the real transcript snowballing; centered in the hallucination section.
- draw: The two hallucination mechanisms as two causal chains (own-token feedback loop vs SFT-beyond-knowledge), each ending in its mitigation family arrow (→ grounding / → calibration+refusal). Original.
- draw: The 4-step selection loop with the contamination filter drawn as a caution overlay on step 2 (public benchmarks). Inspired by AI-Eng Fig 4-5.
- source: aiengineerin-s2-fig4-9-gpt-drift — the measured March/June GPT behavior change (save as `gpt-drift`); reader must see the same task scored across versions — provider drift as data; float right in the monitoring paragraph.
- draw: Token-economics card: one request's cost anatomy (context tokens × in-price + output tokens × out-price), TTFT vs total latency bar underneath. Original.

## EXERCISE PLAN
1. Warm-up: compute the toy distribution at T=0.5, 1, 2 for logits [1,2] and state which T makes the argmax's probability 0.73.
2. Boundary probe: T→0 — show sampling degenerates to greedy argmax and outputs still vary across API calls in practice; list the residual nondeterminism sources (batching order, floating-point, provider updates) — determinism is not a temperature setting.
3. Claim to refute: "Model A beats Model B on MMLU by 3 points, so use A." Name the three confounds this ignores (prompt setting — the Gemini trap; contamination; your-task mismatch) and write the two-step protocol that would settle it (matched-condition rerun; own eval set).
4. Research-shaped: price a support bot at 100k requests/day (2k in / 300 out) at stated per-token symbolic prices; find the request volume where a self-hosted 13B at $2/GPU-hr with 3,000 tok/s breaks even (numbers deliberately round).
5. Derivation the lesson skipped: show that top-p at p=1 and top-k at k=|V| both reduce to plain temperature sampling, and construct the distribution where top-k=2 and top-p=0.9 select different candidate sets.
6. Mixed/spaced (E3): the drift-detection runbook (M6) — add the provider-drift branch: which monitor detects it (behavioral eval suite re-run on schedule; output-distribution shift) given inputs did NOT change?
7. FORWARD (E7): your selected model fails on company-specific questions. Before touching training, list the two cheaper adaptation rungs and what each requires. Solution: prompting/context engineering and RAG — the next two lessons → Ref prompting-and-context, retrieval-augmented-generation.

## ARC
- Inherits: the whole classical discipline (metrics, serving, drift) — and a new component class nobody in-house trained.
- Contributes: the inversion (adaptation-first workflow), sampling/hallucination as system properties, token economics, and suspicious model selection.
- Hands off: the cheapest adaptation layer — prompts and context as engineered, versioned, attacked system components → prompting-and-context.
- Spine step: "Foundation models invert the workflow…" (step 9, The foundation-model inversion).
