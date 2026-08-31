# The AI application reference architecture — research brief

Lesson: `ai-application-architecture` (module: ai-engineering, synthesis, planned). MODULE-FINAL APPLICATION LESSON (L16) and course capstone.
Goal: Assemble the reference architecture for an LLM application — context construction, guardrails, router and gateway, caches, agent patterns — and instrument it for feedback.

## Sources
- AI Engineering Ch.10 — the backbone: the incremental architecture build-up (Figs 10-1..10-10, pp.449-464), each step motivated by a failure the prior architecture couldn't handle: bare query→model→response; +context construction; +guardrails (input: PII leakage/prompt attacks — the PII masking/reverse-map flow Fig 10-3; output: quality/safety failures, retry, human fallback); +model router and gateway; +caching (exact vs semantic; semantic's false-hit risk); +agent patterns/write actions; monitoring for LLM apps — drift of system prompt/user behavior/underlying model; conversational feedback signals (regeneration, early termination, complaints); feedback design — Midjourney's implicit-feedback UI (capture), the Luma reversed-emoji bug (capture); feedback biases (leniency, position, degenerate loops/sycophancy — Sharma et al.).
- AI Engineering Ch.6 (pp.275-300): agents — tool inventory (knowledge/capability/write); the compound-error arithmetic (0.95^10 = 60%, 0.95^100 = 0.6%, p.278); plan-then-validate-then-execute decoupling (Fig 6-9); ReAct/Reflexion one Remark each; agent failure taxonomy (planning/tool/efficiency) one Remark; memory hierarchy (internal/short/long — Fig 6-16) one Remark tying back to RAG-as-long-term-memory.
- MLPS Ch.12 (p.191): RouteLLM — routing between big and small models, >2× cost cut without quality loss; Ch.22 GenAI attacks recalled (jailbreak/injection — prompting lesson's map) and Llama Guard named.
- Module recalls that this lesson USES: RAG (context construction lane), llm-evaluation (guardrails ARE inline evals; judges in monitoring), llm-inference (caches/router as cost levers; prompt cache vs semantic cache distinguished), prompting (injection defenses in the gateway), M6 monitoring pyramid (extended with the three LLM drift sources), M5 rollout (prompts/models canaried like models).
- The GPT-drift capture (foundation-models) recalled — the "underlying model drift" evidence.

## Key points
1. APPLICATION SPEC. Artifact: the reference architecture assembled step by step for one concrete product (a support assistant over company docs), exactly as Ch.10 does — each layer added in response to a named failure, and each layer explicitly Ref'd to the course lesson that built it. Module results used: RAG lesson (step 1: context), llm-evaluation (step 2: guardrails as inline evals + monitoring judges), foundation-models + llm-inference (step 3-4: router/gateway economics, exact/prompt/semantic caching), prompting (injection defenses at the gateway), M5/M6 (rollout + monitoring pyramid). Departures from the idealisation: every guardrail adds latency the budget must absorb (the waterfall recomputed with guardrail costs); caching fights personalization and freshness; the reference diagram is a menu, not a mandate — real stacks omit layers deliberately; and agents multiply both capability and error (the compounding arithmetic).
2. The build-up as flaw-driven sequence (playbook: each mechanism fixes the previous stage's named failure): bare call fails on knowledge → context; grounded call fails on bad inputs/outputs → guardrails both ways (PII mask/reverse-map worked; output quality/safety gates; retry + human fallback as the degraded modes — Burkov's fallback doctrine recalled); one model overpays → router + gateway (RouteLLM's 2×; the gateway as the single choke point for auth/limits/logging); repeated queries overpay → caches (exact vs prompt-prefix vs semantic; semantic's false-hit worked example); finally write-capable agents — LAST, because of the arithmetic.
3. Agents scoped honestly: tool inventory (read vs write); the compound-error computation as the design law (0.95^10=60%); plan-validate-execute decoupling and write-action approval gates (prompting's system-level defenses returning); memory hierarchy Remark (RAG = long-term memory).
4. Instrumentation: the M6 pyramid extended with LLM-specific layers — format-failure rate, faithfulness scores (judge lane from llm-evaluation), safety triggers, cost/latency per request; the three drift sources (system prompt edits, user-behavior drift, provider-model drift — the GPT-drift capture recalled); conversational implicit signals (regeneration = negative, early termination, "actually…" corrections).
5. Feedback design as product engineering: Midjourney's buttons as graded implicit signal (capture); the Luma reversed-emoji bug (capture) as the cautionary UX exhibit; feedback biases (leniency, position) and the degenerate loop returning at course scale — sycophancy as the LLM-native popularity spiral (M6's loop, final reprise).
6. The course's close: the finished diagram re-labeled with all eight modules — the whole course visible in one system; what was NOT covered (training foundation models; multimodal; formal verification) named honestly with references.

## Set pieces & gems
- The incremental build-up — the single most reusable diagram sequence in the canon; recreated as the lesson's FigureSequence spine.
- 0.95^10 = 60% — keeper arithmetic, computed in text.
- RouteLLM 2× and the Anthropic caching numbers (inference recall) — the economics of steps 3-4.
- The PII reverse-map flow — a compact, clever mechanism worth one precise figure.
- Luma + Midjourney captures — feedback design done wrong and right, side by side.
- Sycophancy as degenerate feedback (Sharma et al.) — the course's last spiral closure.

## Pitfalls
- SYNTHESIS discipline: no new mechanisms except the router/gateway/semantic-cache/agent-pattern glue this lesson owns; everything else must Ref its lesson — if a section re-teaches, cut it.
- Agents: this is one section, not a course — resist ReAct/Reflexion expansion; the arithmetic and the gates are the content.
- Do not depend on the finetuning extra (extra-prereq lint).
- The close must not balloon into a course summary essay; the labeled diagram + one paragraph is the ending.

## FIGURE PLAN
- draw: FigureSequence (6 frames) — THE build-up: frame 1 bare query→model→response with its failure stamped; frame 2 +context construction (RAG lane); frame 3 +input/output guardrails; frame 4 +router/gateway; frame 5 +cache layers; frame 6 +agent/write-action loop with approval gate. One layer per frame, failures as the captions. Inspired by AI-Eng Figs 10-1..10-10 — the course's capstone sequence.
- draw: The PII mask/reverse-map flow: request → entities masked with placeholders → external model call → response → placeholders reversed locally; the trust boundary drawn. Inspired by Fig 10-3.
- draw: Compound-error curve: per-step accuracy 0.9/0.95/0.99 → success over N steps (three curves, N to 100, log-ish drop), the 60% point marked. Original from the arithmetic.
- draw: Cache decision panel: exact / prompt-prefix (inference recall) / semantic — hit condition, staleness risk, false-hit risk per row; one semantic false-hit worked ("reset my password" vs "reset my 2FA"). Original.
- source: aiengineerin-s3-midjourney-feedback-ui — the real U/V/regenerate grid (save as `midjourney-feedback`); reader must see graded implicit signal as shipped UI; float right in the feedback section.
- source: aiengineerin-s3-luma-emoji-rating — the reversed-emoji form (save as `luma-emoji`); reader must see the annotated bug that scored praise as 1/5; paired beneath the Midjourney capture.
- draw: The final labeled architecture: the complete diagram with each component tagged by course module (M2 substrate under the index, M5 serving under the model box, M6 pyramid on the side, M8 layers on top) — the course in one figure. Original.

## EXERCISE PLAN
1. Warm-up: compute end-to-end success for a 6-step agent at 97% per-step, and the per-step accuracy needed for 90% at 10 steps.
2. Boundary probe: strip the architecture to the minimum for an internal dev tool (no PII, trusted users, no writes) — which layers survive (context + output format check) and which failure re-appears first as usage grows?
3. Claim to refute: "semantic caching is free money — 30% hit rate!" Construct the false-hit that answers the wrong user question, price it against the compute saved, and state the two guards (similarity threshold + per-user scoping + cache TTL on doc updates).
4. Latency budget: recompute the request waterfall with guardrails (input screen 40ms, retrieval 80ms, inference TTFT 500ms, output judge 300ms) against a 1.5s TTFB target — which layer moves to async/streaming, and what risk does async output-checking accept?
5. Research-shaped: design the instrumentation page for the support assistant: 6 monitors spanning the extended pyramid (format failures, faithfulness judge sample, safety triggers, cost/request, regeneration rate, provider-drift eval), each with cadence and alert policy — the M6 artifact rebuilt for LLMs.
6. Mixed/spaced (E3): the sycophancy loop — trace it through M6's degenerate-feedback template (output → user approval signal → preference training → more agreeable output) and name the two loop-breakers transplanted from M6/M7 (randomized eval traffic; guardrail heads in the reward).
7. FORWARD/CLOSE (E7 variant — the last lesson points back): take the design-video-recommendations system and add the assistant card from its forward exercise — write the one-page integration: which existing components are reused (funnel, feature store, monitoring) and which M8 layers wrap the new model. Solution: the two halves of the course are one system; Ref design-video-recommendations and the final labeled diagram.

## ARC
- Inherits: everything — RAG, evals, inference economics, prompting defenses, plus the classical stack's serving and monitoring.
- Contributes: the module's application and the course's synthesis — the reference architecture assembled failure by failure, instrumented, and labeled with the whole course.
- Hands off: nothing — the course closes here; the final diagram states what was built and the honest scope line states what was not.
- Spine step: "Trust and cost at scale…" (step 10, Trust and cost at scale) — closes the course.
