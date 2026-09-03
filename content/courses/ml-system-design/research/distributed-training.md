# Distributed training — research brief

Lesson: `distributed-training` (module: training-pipelines, core, planned).
Goal: Select a parallelism strategy — data, model, or pipeline — from the memory and communication budget of a training job.

## Sources
- AI Engineering Ch.7 (pp.319-331): the memory math — inference ≈ N×M×1.2; training = weights + activations + gradients + optimizer states; Adam = 3 extra values per trainable parameter; the 13B example (78GB for grads+optimizer under full training vs 6GB at 1B trainable); numeric formats FP32/FP16/BF16 (range-vs-precision bits; the Llama-2 BF16-vs-FP16 loading bug cautionary tale).
- DMLS Ch.6 (pp.168-172): data parallelism — synchronous SGD (stragglers) vs asynchronous (staleness, sparse-update mitigation); batch-size/LR scaling issues; model parallelism; pipeline parallelism with micro-batches (GPipe schedule, Fig 6-8).
- ML Design Patterns DP14 Distribution Strategy (pp.301-322): sync all-reduce vs async parameter-server framed by worker reliability; Fig 4-20 — Goyal et al. ImageNet top-1 error vs batch size (flat 64-8k, degrades ≥16k; capture available); LAMB's BERT 3-days→76-minutes; I/O bottlenecks and prefetch. DP12 Checkpoints (pp.267-288): full training state ≠ exported model; virtual epochs.
- MLPS Ch.7 (pp.97-108): ETL input-pipeline timing diagrams (inefficient vs pipelined); tf.distribute strategy family names (one Remark); GPipe/PipeDream pointers.
- TFX paper §4.1: warm-starting — initialize general parameters (embeddings) from the prior version; the freshness-vs-cost tradeoff (feeds inside-tfx).
- mldp-s2-fig4-17 throughput-scaling capture (optional exhibit).

## Key points
1. Start from the memory bill, not the cluster: the worked 13B budget — weights (2 bytes/param BF16 = 26GB), gradients (26GB), Adam states (52GB), activations — exceeding any single card; the two outgrowths (too slow vs doesn't fit) mapped to the two fix families.
2. Data parallelism: replicate model, split batch; sync all-reduce (gradient = mean; stragglers set the pace — tail latency recalled from module 1) vs async parameter server (no waiting; stale gradients bias updates). When each wins (homogeneous reliable workers → sync; flaky/heterogeneous → async).
3. The batch-size/learning-rate coupling as a measured fact: Goyal's curve (validation error flat to 8k, degrades past 16k) + linear LR scaling + warmup one paragraph + LAMB's 3-days→76-minutes as the payoff number. This resolves the tracking lesson's forward exercise.
4. Model parallelism (tensor-level split) vs pipeline parallelism (layer-level split + micro-batches filling the bubble) — the GPipe schedule drawn; communication patterns contrasted (weights/activations).
5. Input pipelines as the silent bottleneck: the ETL timing diagram — GPU idle while CPU decodes; prefetch/parallel-read/cache as the fixes; "check utilization before buying GPUs".
6. Checkpoints and warm-starting: full state (optimizer, schedule, RNG) vs exported model; virtual epochs (fix total examples, not steps) for hyperparameter-safe comparisons; warm-starting as transfer from the previous production model — TFX's answer to O(100B)-example retraining (plants inside-tfx and continual-learning's stateful training).

## Set pieces & gems
- The 13B/78GB memory arithmetic — keeper computation, done in full on-page.
- Goyal batch-size curve — sourced image (mldp-s2-fig4-20-batchsize-plot): measured, load-bearing.
- LAMB 3-days→76-minutes — the one-line why-this-matters.
- The Llama-2 BF16/FP16 loading bug — numeric formats have teeth; one Remark.
- Google's 5%/hour preemption stat (recalled from batch lesson) as why checkpointing is non-negotiable.

## Pitfalls
- No SGD theory (convergence proofs, momentum math) — classical-ml owns optimization; this lesson budgets memory and communication.
- tf.distribute/PyTorch API names: one Remark table, zero tutorials.
- ZeRO/FSDP: name in one starred paragraph as "sharding the optimizer states" — do not develop.
- Don't promise LLM training coverage; fine-tuning memory math returns in finetuning-and-adaptation (extra) — say so.

## FIGURE PLAN
- draw: The training memory bill as a stacked bar for the 13B model (weights/grads/Adam/activations), against an 80GB card outline; second bar showing the 1B-trainable variant fitting. Inspired by AI-Eng Ch.7's formulas — the lesson's key image.
- draw: FigureSequence (4 frames): sync data parallelism — frame 1 batch split to 4 workers; frame 2 local gradients; frame 3 all-reduce averaging; frame 4 identical update applied; then one contrast frame: async worker pushing a stale gradient to a parameter server. Inspired by DMLS Fig 6-6.
- source: mldp-s2-fig4-20-batchsize-plot — Goyal et al.'s measured error-vs-batch-size curve (save as `batchsize-error`); reader must see the flat region and the ≥16k degradation with the confidence band; centered in the batch-size section.
- draw: Pipeline parallelism: 4 layers × 4 devices timeline — naive (staircase bubble shaded idle) vs micro-batched GPipe schedule (bubble shrunk); one changed element between panels. Inspired by DMLS Fig 6-8.
- draw: Input-pipeline timing bars: sequential read→prep→train with GPU idle gaps vs prefetched overlap. Inspired by MLPS Figs 7-2/7-3.
- draw: Checkpoint anatomy: what's inside (weights, optimizer state, schedule, RNG, step) vs the exported model (weights + transform graph) — two labeled boxes. Inspired by DP12.

## EXERCISE PLAN
1. Warm-up: compute the full-fine-tune memory bill for a 7B model in BF16 with Adam (weights+grads+states, ignore activations); does it fit one 80GB card?
2. Boundary probe: data parallelism with batch-per-worker = 1 and 1,024 workers — what breaks (effective batch 1,024 needs LR scaling; sync cost dominates compute) and where does the Goyal curve say you land?
3. Claim to refute: "async parameter servers are strictly better — no stragglers." Use gradient staleness to construct the two-worker divergence sketch and name the regime where async still wins.
4. Derivation the lesson skipped: pipeline bubble fraction — for D devices and M micro-batches, derive idle fraction (D-1)/(M+D-1); evaluate at D=4, M=1 vs M=32.
5. Research-shaped: from the input-pipeline diagram, estimate GPU utilization if decode takes 8ms/batch, training step 10ms, no prefetch — then with prefetch depth 2; propose the measurement that would confirm it (profiler trace — the serving module shows one).
6. Mixed/spaced (E3): which checkpoint components must be restored for (a) resuming a preempted run bit-exactly, (b) warm-starting next week's model, (c) serving? Tie to the artifact-types list from experiment-tracking-and-versioning.
7. FORWARD (E7): warm-starting from last week's model cuts training 10×, but the new model inherits last week's behavior. Name the evaluation that must gate it before it replaces production. Solution: the validation gate — next lesson's subject → Ref offline-evaluation.

## ARC
- Inherits: tracked, versioned runs from experiment-tracking-and-versioning; jobs now have identity but not scale.
- Contributes: the memory/communication budget calculus and the three parallelism families, plus checkpoints and warm-starting.
- Hands off: models can be trained at scale; whether a trained model may SHIP is offline evaluation's question → offline-evaluation.
- Spine step: "Training becomes an industrial process…" (step 5, Training as a pipeline).
