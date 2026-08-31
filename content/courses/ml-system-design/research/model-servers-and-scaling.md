# Model servers and serving infrastructure — research brief

Lesson: `model-servers-and-scaling` (module: serving, core, planned).
Goal: Design the serving path — stateless serving functions, model servers, dynamic batching, caching, autoscaling — for a stated load.

## Sources
- ML Design Patterns DP16 Stateless Serving Function (pp.347-361): export as pure function (SavedModel/ONNX), the odd/even-counter statefulness sidebar, custom signatures; DP17's lambda combination (one Remark).
- MLPS Ch.13 (pp.203-221): TF Serving anatomy — servables/loaders/sources/managers and the five-step model-update event trace; Triton/TorchServe as the same shape; horizontal vs vertical scaling; containers/K8s in one section; SLOs/error budgets; load balancers across failure domains (Fig 13-7); NVIDIA CPU-vs-GPU inference benchmark (33× throughput / 31× latency); TPU cost chart (capture). Ch.14: TF Serving batch-config parameters; the TF Profiler trace (capture) — profiling as the diagnostic.
- System Design Primer: caching layers + the four update strategies (cache-aside/write-through/write-behind/refresh-ahead with the code sketches); load balancer L4/L7 (one Remark).
- TFX paper §6.1: the threadpool isolation fix — recalled with a Ref (inside-tfx owned it).
- Khang Pham Ch.1 (pp.83-96): aggregator/broker serving patterns, serving multiple models, LinkedIn Pensive embedding-serving pipeline (offline-batch vs nearline fan-out).
- Babushkin Ch.15: dynamic batching, caching incl. fuzzy caching (one forward sentence to semantic caching M8), model routing/fast-slow pattern (one Remark; M8 develops), profiling-first doctrine ("the best optimizing is minimum optimizing").

## Key points
1. The stateless serving function: why training state (dropout, optimizer, learning-phase flags) must be stripped; export formats (SavedModel/ONNX) as the language-neutral boundary; statelessness = horizontal scalability (any replica serves any request) — the property everything below leans on.
2. Model server anatomy via TF Serving's five-step update trace (source detects new version → aspires → manager applies policy → loader instantiates → clients switch): versioned hot-swap without downtime; Triton/TorchServe as the same shape (one table). Multi-model serving and the isolation lesson (Ref inside-tfx's threadpool numbers).
3. Dynamic batching as the server's latency/throughput dial: accumulate up to N requests or T ms — the tradeoff computed (batch 8 at +6ms queueing vs 8× throughput); connection to module-1's batching fact; config parameters that matter (max batch, timeout, queue depth).
4. Caching for ML: prediction caching (cache-aside worked; TTL vs event invalidation; when hit-rates justify it — skewed request distributions) and feature caching (the online store recalled); the four update strategies compact; staleness budget as the honest price (blue-socks recalled).
5. Scaling and reliability: replicas behind load balancers; autoscaling on QPS/latency signals and its trap (scale-up lag vs traffic spikes); failure domains and the SLO/error-budget loop (module-1 availability arithmetic applied); GPU vs CPU serving economics (the 33× benchmark, with the caveat: batch size and model size decide).
6. Profile before optimizing: the TF Profiler trace as the instrument (capture); Babushkin's minimum-optimizing doctrine; "the bottleneck is usually feature fetch or preprocessing, not the model" as the diagnostic prior.

## Set pieces & gems
- The five-step TF Serving update trace — the one mechanism worth step-through treatment.
- Dynamic-batching queueing arithmetic — small computable tradeoff.
- NVIDIA 33×/31× and the TPU cost chart (captures machinelearn-s2-tpu-gpu-cost-chart) — hardware economics as data.
- Primer's cache-aside code sketch — compact and familiar to backend readers.
- Pensive (LinkedIn) embedding serving — one Remark bridging to module 7's index serving.

## Pitfalls
- No Kubernetes tutorial; containers/orchestration get one section at concept level.
- The caching section must not fork into CDN/web caching generally — ML-relevant caches only.
- GPU-vs-CPU numbers need their caveats attached (vendor benchmark; batch-dependent) — read critically, as trained in module 1.
- Keep model-routing/ensemble serving to a Remark — M8's architecture lesson owns routing.

## FIGURE PLAN
- draw: The serving path end to end: client → LB → replica (server: batcher → model versions) → feature store/caches on the side; latency annotations per hop. Original composition — key image.
- draw: FigureSequence (5 frames): the TF Serving update trace — new version file lands; source aspires; manager policy; loader loads (memory drawn); traffic switches; old version unloads. Inspired by MLPS Fig 13-1's description.
- draw: Dynamic batching timeline: requests arriving, accumulation window T, batch fired; two settings side by side (T=2ms vs T=20ms) with p99 and throughput readouts. Original; the tradeoff computed on-figure.
- draw: Cache-aside for predictions: request → cache miss → model → set(TTL) → next request hits; a second panel showing the stale-hit failure after the user's state changed. Inspired by the primer's sketches.
- source: machinelearn-s2-tpu-gpu-cost-chart — Google's published cost/speed comparison (save as `tpu-gpu-cost`); reader must see the measured $87-vs-$50 bars and the 27×/38% annotation; float right in the hardware-economics section.
- source: machinelearn-s2-tf-profiler-trace — the real profiler trace of a BERT inference (save as `profiler-trace`); reader must see op-level spans at microsecond scale — what "profile first" concretely looks like; centered in the profiling section.

## EXERCISE PLAN
1. Warm-up: compute effective QPS per replica for a 25ms model at batch 8 with a 5ms batching window, and the replica count for 10k QPS with 2× headroom.
2. Boundary probe: dynamic batching at QPS so low the window always times out with batch=1 — show it only adds latency; derive the QPS threshold where expected batch size exceeds 2 (Poisson arrivals, window T).
3. Claim to refute: "we cache predictions with a 1h TTL, so 80% of traffic is served at cache speed." Given a Zipf request distribution, compute the actual hit rate for a 10k-entry cache and name the second error (stale predictions after feature changes — which invalidation strategy fixes it).
4. Design: pick CPU vs GPU serving for (a) 50 QPS BERT-base p99<100ms, (b) 20k QPS logistic regression, (c) 500 QPS ViT embedding — justify with batch-ability and the benchmark's caveats.
5. Research-shaped: from the profiler-trace capture, attribute the request's time across preprocess/inference/overhead and state which optimization family each share responds to.
6. Mixed/spaced (E3): the stateless-function property — which module-2 concept does replica statelessness replicate (partitioning routing? no: it's replication with no per-replica state), and why does a per-replica in-memory feature cache quietly break read-your-writes for a user bouncing between replicas?
7. FORWARD (E7): the server can hot-swap v42 for v41 in seconds. Write the three questions you must answer BEFORE routing 100% of users to v42. Solution: staged rollout and online experiments — next lesson → Ref deployment-and-online-experiments.

## ARC
- Inherits: a compressed model meeting its budget from model-compression; the serving-mode choice from batch-and-online-prediction.
- Contributes: the infrastructure between model and user — servers, batching, caches, scaling, and the profiling discipline.
- Hands off: the machinery can serve any version at scale; WHICH version, to whom, measured how — deployment strategies and online experiments → deployment-and-online-experiments.
- Spine step: "A model becomes a service…" (step 6, The model becomes a service).
