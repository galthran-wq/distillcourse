# Model compression and inference optimization — research brief

Lesson: `model-compression` (module: serving, core, planned).
Goal: Apply quantization, distillation, and pruning to fit a model into its latency budget, and compile it to the target hardware.

## Sources
- DMLS Ch.7 (pp.206-223): the four families — low-rank factorization (SqueezeNet 50× fewer params at AlexNet accuracy; MobileNets depthwise/pointwise 8-9× cut), knowledge distillation (DistilBERT: 40% smaller / 97% capability / 60% faster), pruning (lottery-ticket sidebar), quantization (PTQ vs QAT, 16/8/1-bit); cloud vs edge tradeoffs (cost/latency/privacy/offline); IRs and 'lowering'; local optimizations (vectorization/parallelization/loop tiling/operator fusion); the Stanford DAWN 23×-slower-than-hand-optimized finding; autoTVM (~70 trials to beat cuDNN — capture available); WASM 45-55% slower.
- MLPS Ch.6 (pp.67-96): PTQ variants (dynamic range 4×/2-3×; full integer 4×/3×+; float16 2×) and QAT; the MobileNet measured accuracy-vs-latency scatter (capture); pruning — Optimal Brain Damage lineage, TF pruning API level; distillation math — softmax temperature, blended loss L = (1-α)L_hard + αL_KL; TMKD multi-teacher results (capture); the 10×-ensemble-to-one-model speech numbers (58.9/61.1/60.8).
- MLDP DP19 Two-Phase Predictions (pp.389-401): small on-device gate + cloud model; the AutoML Edge export tradeoff UI (6MB/360ms vs 0.6MB/56ms — capture available).
- Babushkin Ch.15 §15.2: accuracy/cost tradeoff; the ImageNet accuracy-vs-params frontier (capture) — diminishing returns framing.

## Key points
1. Frame as economics: the accuracy-vs-cost frontier (ImageNet params plot) — compression moves along it deliberately; the latency budget from last lesson is the constraint. Archery analogy deferred to LLM lesson (AI-Eng owns it); here the three questions: smaller number format? fewer parameters? smaller architecture trained to mimic?
2. Quantization first (biggest practical wins): what INT8 does to memory and to throughput (memory-bandwidth intuition — planted for the LLM lesson's roofline); PTQ variants with their measured multipliers; when QAT is needed (accuracy cliff at PTQ); the measured MobileNet scatter as evidence quantization dominates on mobile CPU.
3. Distillation: the mechanism honestly (soft targets carry inter-class structure; temperature; blended loss — formula shown, one worked toy softmax at T=1 vs T=4); DistilBERT's numbers; the ensemble-compression result (>80% of ensemble gain in one student); when it fails (no capable teacher, tiny student gap).
4. Pruning and low-rank in one section: magnitude pruning + the lottery-ticket sidebar (starred); depthwise-separable convolutions computed (the K=3 8-9× arithmetic); honest status — pruning's wins are hardware-dependent (sparse kernels).
5. Compilation: lowering through IRs; operator fusion as the canonical win (memory-round-trip elimination); the 23× DAWN finding as motivation; autotuning (autoTVM's learned search, ~70 trials) — "measure, don't guess" (ties to the profiler thread).
6. Edge vs cloud: the four forcing functions (connectivity, latency floor = RTT, privacy/regulation, cost at scale); two-phase pattern (cheap on-device gate, heavy cloud model) with the AutoML export tradeoffs as real numbers.

## Set pieces & gems
- DistilBERT triple (40/97/60) and SqueezeNet 50× — keeper numbers.
- The T=1 vs T=4 softened-softmax toy — small computation that demystifies "dark knowledge".
- machinelearn-s1-mobilenet-quantization capture — measured accuracy-vs-runtime scatter.
- machinelearn-s3-fig5-9-automl-tradeoff capture — a real product exposing the tradeoff as radio buttons.
- Stanford DAWN 23× + autoTVM ~70 trials — the compilation section's two numbers.
- Two-phase instrument-classifier case (MLDP) — one Remark.

## Pitfalls
- No training-time efficiency content (that was distributed-training); this is inference.
- Lottery ticket: starred aside, not doctrine — replication status is contested; frame as "why pruning-then-retraining works at all".
- Don't preview KV-cache/LLM specifics beyond one forward sentence — llm-inference owns them.
- Keep hardware talk generic (CPU vector units, GPU parallelism); no CUDA tutorials.

## FIGURE PLAN
- source: machinelearn-babushkin-s2-imagenet-accuracy-vs-compute — the accuracy-vs-params frontier (save as `accuracy-params-frontier`); reader must see named models and the flattening curve; centered at the framing section.
- draw: The three compression levers as one diagram: number format (FP32→INT8 bar shrink), parameter count (pruned net), architecture (teacher→student) — each with its measured multiplier attached. Original composition — key image.
- draw: FigureSequence (4 frames): distillation — frame 1 teacher's hard prediction (argmax); frame 2 softened distribution at T=4 (inter-class structure visible); frame 3 student trained on blend of hard label + soft targets; frame 4 the loss formula dissected with braces. Inspired by MLPS Fig 6-8 + the temperature math.
- source: machinelearn-s1-mobilenet-quantization — measured float-vs-INT8 scatter on Snapdragon (save as `quantization-scatter`); reader must see the leftward (faster) shift at matched accuracy; float right in the quantization section.
- draw: Depthwise-separable convolution arithmetic: standard conv cost vs depthwise+pointwise cost computed on-figure for K=3, the 8-9× ratio boxed. Inspired by DMLS Fig 7-9.
- draw: Operator fusion: three ops with two memory round-trips vs one fused kernel — memory arrows counted. Inspired by DMLS Figs 7-13/7-14.
- draw: Two-phase edge/cloud: on-device gate (small, always-on) → conditional cloud call (heavy), with the AutoML export numbers annotated. Inspired by MLDP Fig 5-10.

## EXERCISE PLAN
1. Warm-up: a 440MB FP32 model — compute its INT8 size and the naive bandwidth-bound speedup on a memory-bound workload; state why compute-bound workloads gain less.
2. Boundary probe: distill a teacher into a student of EQUAL size — what remains of the benefit (ensemble compression, regularization) and what vanishes? Use the speech-ensemble numbers to argue.
3. Derivation the lesson skipped: derive the depthwise-separable parameter ratio (K²·Cin·Cout vs K²·Cin + Cin·Cout) and evaluate at K=3, Cin=Cout=256.
4. Claim to refute: "we pruned 80% of weights, so inference is 5× faster." Explain why unstructured sparsity often yields ~0× on dense kernels; name what actually delivers the speedup (structured pruning / sparse-aware hardware).
5. Research-shaped: from the AutoML export capture's three variants (6MB/360ms, 3.2MB/150ms, 0.6MB/56ms), fit the rough latency-vs-size relation and predict the latency of a hypothetical 1.5MB variant; state the confidence such an extrapolation deserves.
6. Mixed/spaced (E3): the latency waterfall from batch-and-online-prediction — your 330ms BERT must hit 30ms; allocate the reduction across quantization (×?), distillation (×?), and batching, citing measured multipliers from this lesson.
7. FORWARD (E7): quantization shrinks WEIGHTS, but a transformer serving long chats runs out of memory anyway. Compute what grows with sequence length that weights don't (per-token attention state). Solution: the KV cache — the object the LLM-inference lesson budgets → Ref llm-inference.

## ARC
- Inherits: the serving-mode decision and its latency budget from batch-and-online-prediction.
- Contributes: the compression toolkit with measured multipliers, plus compilation and the edge/cloud forcing functions.
- Hands off: a fast model still needs a server — batching, scaling, caching, versioned hot-swap → model-servers-and-scaling.
- Spine step: "A model becomes a service…" (step 6, The model becomes a service).
