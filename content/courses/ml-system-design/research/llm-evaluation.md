# Evaluating LLM systems — research brief

Lesson: `llm-evaluation` (module: ai-engineering, core, planned).
Goal: Build an evaluation pipeline for open-ended outputs — exact metrics where possible, AI judges with known biases, and comparative ranking.

## Sources
- AI Engineering Ch.3: why FM evaluation is hard (open-endedness, saturation, black boxes, pp.113-118); exact evaluation — functional correctness/pass@k (HumanEval lineage, pp.125-127), similarity against references: exact match's trap (the Anne Frank date: "September 12, 1929" contains the right year, wrong date, p.130), lexical (BLEU/ROUGE limits), semantic similarity (embedding-based); AI-as-judge (pp.136-147): judge-prompt design (task, criteria, discrete scale beats continuous), measured biases — self-bias (GPT-4 +10%, Claude +25% for own outputs), FIRST-position bias (opposite of human recency), verbosity bias (longer preferred even when wrong); specialized judges (reward/reference-based/preference models, one Remark); comparative evaluation (pp.148-155): win rates → Elo/Bradley-Terry, LMSYS's 57 models/244k comparisons ≈ 153/pair, transitivity assumption contested, the Arena's messy prompts (180 'hello' variants of 33k; one brainteaser 44×).
- AI Engineering Ch.4: evaluation-driven development (the used-car-dealership opener: a model live for a year, nobody knew if it was right, p.159); the four criteria buckets; factual-consistency detection (SAFE's 4-step decompose-and-search pipeline Fig 4-1; NLI/entailment one Remark; TruthfulQA with the coughing-heart-attack examples); instruction-following (IFEval's 25 verifiable types) one Remark; the pipeline design section (pp.199-208): evaluate every component/turn, criteria tied to business metrics, scoring rubrics, slicing (Simpson recalled), the sample-size rule (3× smaller effect ≈ 10× more samples, Table 4-7), evaluate-the-evaluator, contamination detection (n-gram overlap, perplexity) + "a benchmark stops being useful as soon as it becomes public" + Schaeffer's satirical pretrain-on-test paper; HELM's $80-100k full-run cost.
- Made With ML: the GPT-3.5/GPT-4 zero/few-shot benchmark (f1 0.781→0.930; capture) — a small, real, reproducible eval.
- Offline-evaluation lesson (M4): slices, baselines, gates — extended here to open-ended outputs; metrics-hierarchy (M1) — the criteria-to-business tie.

## Key points
1. Why the M4 toolkit breaks: no single reference answer (exact match's trap worked — Anne Frank), saturated/contaminated public benchmarks, and outputs whose quality is multi-criteria (correctness, faithfulness, format, tone). Evaluation-driven development as the stance (the used-car opener).
2. Salvage exact evaluation wherever it exists — the preference ladder: functional correctness (code: pass@k defined and computed for k=1,3; format checks: IFEval-style verifiable instructions) > semantic similarity > lexical overlap > exact match; each rung's failure mode named.
3. AI-as-judge as an instrument with a datasheet: judge-prompt design (criteria + discrete scale + rubric); the measured biases (self +10-25%, first-position, verbosity) and the mechanical mitigations (swap order and average; length-controlled comparisons; a different-family judge); judges are cheap, consistent-ish, and NOT ground truth — calibrate against a human-labeled slice (evaluate-the-evaluator).
4. Faithfulness for RAG (resolves the forward exercise): claim decomposition → per-claim verification against retrieved context (SAFE's shape, simplified); local (against context) vs global (against world) consistency distinguished.
5. Comparative evaluation: pairwise win rates → Elo/Bradley-Terry (mechanics in one worked 3-model example); when comparative beats absolute (subtle quality differences) and its costs (quadratic pairs, transitivity assumption, no absolute meaning); Arena's messy reality (the 'hello' statistic) as sampling-bias evidence.
6. The pipeline assembled (the M1 metrics chain extended): business metric → criteria → per-criterion method (exact/judge/human) → eval SET curation (slices; contamination-checked; sized by the 3×/10× rule — recalled from A/B sizing, same statistics) → regression harness in CI (M4's gates, now with judge verdicts) → drift of the eval itself (saturation; provider updates — foundation-models recall).
7. Contamination as a first-class threat: n-gram overlap and perplexity anomalies; the quip and the satirical paper as the two memorable anchors; private eval sets as the answer.

## Set pieces & gems
- The Anne Frank exact-match trap — small and decisive.
- Judge bias numbers (+10%/+25%, first-position, verbosity) — the datasheet.
- The Arena 'hello' statistic (180/33k = 0.55%) — crowd-sourced eval's messy denominator.
- The 3×-effect/10×-samples rule (Table 4-7) — reused from A/B sizing; now for eval sets.
- madewith-gpt-benchmarks capture — a real, small eval with readable numbers (GPT-4 few-shot 0.93 vs fine-tuned model) as the worked "own eval" exhibit.
- TruthfulQA's coughing-heart-attack false answer — one vivid factuality example.
- HELM's $80-100k — evaluation has a budget line.

## Pitfalls
- Don't re-teach classification metrics or slicing — Refs to M4; the new content is open-endedness, judges, comparative ranking, pipeline curation.
- Judge biases must carry their numbers and mitigations together — naming biases without mitigations is trivia.
- Elo: one worked example, no rating-theory detour.
- Benchmarks (MMLU/HELM/etc.): named as landscape, never taught as content.

## FIGURE PLAN
- draw: The exact-evaluation preference ladder: functional correctness → semantic → lexical → exact match, each rung with its failure case attached (Anne Frank at the bottom). Original — key image.
- draw: FigureSequence (3 frames): judging with position-bias mitigation — frame 1 judge prompt with A/B answers, verdict A; frame 2 order swapped, verdict A again (consistent) vs verdict B (position-biased); frame 3 the swap-and-average protocol as the rule. Original, from Ch.3's bias findings.
- draw: The judge datasheet card: three measured biases with their numbers and mitigation per row. Original.
- draw: Faithfulness pipeline: answer → claims decomposed → each claim matched against retrieved chunks → per-claim verdicts → faithfulness score. Inspired by SAFE's Fig 4-1, simplified to the RAG-local case.
- draw: Elo from win rates: 3 models, a 6-cell win matrix → ratings computed in two iterations, the transitivity assumption flagged. Inspired by AI-Eng Table 3-6.
- source: madewith-gpt-benchmarks — the measured zero/few-shot bar chart (save as `gpt-benchmarks`); reader must see the real f1 bars (0.78→0.93) of a small own-eval; float right in the pipeline section as the "your eval, your numbers" exhibit.
- draw: The eval pipeline as CI: eval set (sliced, contamination-checked, sized) → harness (exact + judge lanes) → gate → dashboard; the M4 gate diagram extended with a judge lane. Original.

## EXERCISE PLAN
1. Warm-up: compute pass@1 and pass@3 from 10 problems × 3 samples with given per-problem pass counts; explain why pass@3 ≥ pass@1 in expectation.
2. Boundary probe: a task whose answers are verifiable by a program (SQL generation against a test DB) — show the judge is unnecessary and strictly worse (cost, bias); state the rule: descend the ladder only when the rung above is impossible.
3. Claim to refute: "GPT-4 rated our new prompt 8.2/10 vs 7.9 — ship it." Three breaks: no swap-order control, continuous scale (the source's discrete-beats-continuous finding), and n too small for a 0.3 gap (apply the 3×/10× rule); rewrite the eval to be decision-grade.
4. Derivation the lesson skipped: from the sample-size rule, derive the eval-set size to detect a 3% quality difference at ~1,000-example baseline (10× per 3× reduction) — and reconcile with the A/B formula from module 5 (same statistics, different costumes).
5. Research-shaped: reproduce the Made With ML comparison in design: specify the 4-condition eval (2 models × zero/few-shot) on a 200-example set — metrics, slices, judge-vs-exact lanes, and the one contamination check you'd run first.
6. Mixed/spaced (E3): your RAG bot's nightly faithfulness eval (RAG lesson's forward exercise) — write its pipeline card: sample size for daily 1% regressions, judge model choice (different family — why), and the human-calibration slice cadence.
7. FORWARD (E7): your eval pipeline costs $0.02/answer with a judge; at 10k/day that's $73k/yr — inference costs now gate evaluation. List the two serving levers that would cut judge cost (smaller judge via distillation; batching/caching). Solution: inference economics — next lesson → Ref llm-inference.

## ARC
- Inherits: M4's evaluation discipline (baselines/slices/gates) and RAG's faithfulness question; the metrics chain from M1.
- Contributes: evaluation rebuilt for open-endedness — the exactness ladder, calibrated judges, comparative ranking, and the curated pipeline with contamination discipline.
- Hands off: every judge call and every user request is inference — the serving economics that make all of module 8 affordable → llm-inference.
- Spine step: "Trust and cost at scale…" (step 10, Trust and cost at scale).
