# TFX: the production pipeline pattern — research brief

Lesson: `inside-tfx` (module: training-pipelines, core, planned). MODULE-FINAL APPLICATION LESSON (L16) — a primary-source systems paper read as a design.
Goal: Analyze the original TFX paper as a system design — continuous training over hundreds of billions of examples, warm starts, validation gates, and the serving fixes behind Google Play.

## Sources
- TFX paper (KDD 2017) in full — THE source: §1 the four platform-design complications (one platform many tasks; continuous training AND serving; human-in-the-loop; production reliability at scale); §2.2 Figure 1 (the component architecture — ancestor of every ML platform diagram since); §4.1 warm-starting; §4.2 FeatureColumns/Estimator (one sentence); §5 evaluation vs validation (human-facing vs machine-facing; safe-to-serve; canary; slicing); §5.5 the adoption finding; §6.1 the multitenancy threadpool fix (p99.9 ~500-1500ms → ~75-150ms during model loads); §6.2 the lazy protobuf parser 2-5×; §7 Google Play case study (retrieval-then-ranking; O(100B) examples; the data-validation +2% already covered in M3 — referenced, not repeated).
- MLPS Ch.15/18-19 for what the pattern became (Kubeflow/Vertex; runner portability) — the "descendants" section.
- Sculley et al. 2015 — the sibling paper: TFX is Google's own answer to its own debt paper; one paragraph of intellectual history (2015 problem statement → 2017 platform).

## Key points
1. APPLICATION SPEC. Artifact: the TFX paper itself, read with the module's tools. Module results used: Figure 1 maps 1:1 to the DAG the previous lesson assembled (each box → the lesson that taught it); warm-starting = the checkpoint/warm-start machinery (distributed-training) deployed as policy; the evaluation/validation split = offline-evaluation's gate, run continuously with canary; lineage/config = tracking lesson. Departures from the idealisation: TF-only coupling (Estimator/FeatureColumns), Google-scale assumptions (O(100B) examples justify warm-start complexity), and the parts the paper leaves manual (schema curation, threshold picking) — plus what descendants generalized (per-step containers, runner portability).
2. Reading protocol taught explicitly (this is the course's first full paper read): claims → mechanisms → numbers → what transfers. The lesson models how an engineer reads a systems paper.
3. Continuous training as the paper's core novelty: not "train a model" but "keep a fresh model flowing"; warm-starting general parameters (embeddings) so freshness doesn't cost full retrains; visibility of the freshness-vs-quality dial.
4. Validation as a machine's decision: the canary process; threshold AND baseline comparison; auto-block; slicing (country=US) — and §5.5's human finding: teams ignored validation until an incident, then demanded it; on-by-default as the design conclusion.
5. The serving numbers as systems lessons: isolating model-loading into its own threadpool cut p99.9 tail latency ~10× during loads (tail latency recalled from M1); the specialized lazy parser's 2-5× (profile before optimizing — forward plant to serving module).
6. Lineage of the pattern: 2015 debt paper names the disease; 2017 TFX ships the treatment; 2019+ Kubeflow/Vertex generalize it. One short section, References carry the rest.

## Set pieces & gems
- TFX Figure 1 — sourced image (tfxa-fig1-architecture), the original artifact; then the previous lesson's house-style DAG shown beside it as "what you already built".
- The p99.9 threadpool fix numbers (500-1500 → 75-150ms) — a complete micro-case in resource isolation.
- §5.5 adoption anecdote — organizational engineering as a first-class result.
- The label-leak example (§3.3) recalled in one sentence as the boundary between data validation (M3) and model validation (this module).

## Pitfalls
- The Google Play +2% belongs to data-validation (M3) — reference with a Ref, do NOT re-narrate.
- Resist paper-summary register: the lesson must ARGUE the mapping (paper component → module concept) and the departures; a précis fails L10e.
- No TFX product tutorial (current APIs differ from the paper); the paper's ideas, not its interfaces.
- Keep the descendants section short — one paragraph + table; module 4 already compared orchestrators.

## FIGURE PLAN
- source: tfxa-fig1-architecture — the original Figure 1 cropped from the page render (save as `tfx-fig1`); reader must see the component chain and shared config/orchestration layers as printed in 2017; centered at the top of the mapping section.
- draw: The mapping figure: TFX Fig 1 redrawn in house style with each component color-tagged by the course lesson that owns it (validation→M3, trainer→distributed-training, model validation→offline-evaluation, serving→M5 forward). Single Figure — the module's summary image.
- draw: FigureSequence (3 frames): continuous training — frame 1 day N model serving while day N+1 data arrives; frame 2 warm-start: embeddings copied, rest re-trained; frame 3 candidate gated (canary vs live), promoted; loop arrow back. Original drawing of §4.1+§5.3.
- draw: The threadpool fix: one shared pool (load spike stalls requests, p99.9 bar tall) vs isolated load pool (requests unaffected) — two panels with the measured numbers on-figure. Inspired by §6.1's prose.
- draw: Timeline of the pattern: 2015 debt paper → 2017 TFX → Kubeflow/Vertex/SageMaker descendants, three annotated milestones. Original.

## EXERCISE PLAN
1. Warm-up: match each TFX Figure-1 component to the course lesson that taught its job, and mark the two components this course has not yet covered (serving, logging → module 5/6).
2. Boundary probe: for which team is TFX-style continuous training OVERKILL? Construct the case (quarterly-retrained tabular model, one pipeline) and place it on the maturity ladder; state which single TFX idea still transfers (the validation gate).
3. Claim to refute: "warm-starting is just fine-tuning; it risks nothing." Name the inherited-bias risk and the paper's own mitigation (the gate + baseline comparison); connect to the catastrophic-drift concern the continual-learning lesson formalizes.
4. Research-shaped: from §6.1's numbers, compute the p99.9 improvement factor range and explain why the fix targets tail (not mean) latency — which module-1 concept predicts that model loads hit exactly the tail?
5. Reading exercise: extract the paper's three quantitative claims (threadpool fix, parser speedup, install lift) and classify each as micro-benchmark / system metric / business metric — the metrics chain applied to a paper.
6. FORWARD (E7): TFX's serving section solves multitenancy inside ONE server. List the three serving problems the paper does not address (batch-vs-online choice, model compression, staged rollout). Solution: those are module 5's lessons in order → Ref batch-and-online-prediction, model-compression, deployment-and-online-experiments.

## ARC
- Inherits: the assembled factory from pipelines-and-orchestration — components, gates, lineage, maturity.
- Contributes: the module's application — the original production instance of the pattern, read critically: continuous training, machine-gated deployment, and two serving numbers, with departures named.
- Hands off: the pipeline ends at a pushed model; everything after the push — serving modes, compression, servers, rollout — is module 5.
- Spine step: "Training becomes an industrial process…" (step 5, Training as a pipeline) — closes the step.
