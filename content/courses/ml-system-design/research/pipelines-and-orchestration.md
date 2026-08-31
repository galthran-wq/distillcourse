# Pipelines, orchestration, and MLOps maturity — research brief

Lesson: `pipelines-and-orchestration` (module: training-pipelines, core, planned).
Goal: Compose training into an orchestrated DAG of tested components and place a team on the MLOps maturity ladder.

## Sources
- MLPS Ch.15 (pp.255-269): MLOps levels 0/1/2 (after Salama et al. 2021 — the canonical maturity diagrams); TFX component anatomy — ComponentSpec/Executor; Driver → Executor → Publisher against the metadata store; Ch.18 (pp.315-345): DAGs; the same pipeline object running on Beam/Kubeflow/Vertex by swapping the runner; orchestrator comparison/decision guide.
- DMLS Ch.10 (pp.311-319): cron vs schedulers vs orchestrators (when-to-run vs where-resources-come-from); workflow tools compared (Airflow/Argo/Prefect/Kubeflow/Metaflow) on containerization/parameterization/dynamism.
- Made With ML: scripting lesson (why notebooks are untestable — stateful, hidden execution order); testing lesson (pytest suites for code/data/models; overfit-a-batch as a smoke test); CI/CD lesson — the three GitHub Actions workflows (PR-triggered training job posting results as PR comments; push-to-main service rollout; docs deploy) composing the continual loop.
- Babushkin Ch.10: training pipeline's 7-step lifecycle; under/over-configuration spectrum; property-based testing of trained models (consistency/monotonicity/invariance — one Remark, behavioral tests already covered).
- Sculley §5: pipeline jungles + glue code (recalled — this lesson is their fix).

## Key points
1. From notebook to pipeline argued, not asserted: notebooks are stateful (out-of-order cells), unversionable diffs, untestable units — scripts with pure workload functions are the unit of orchestration. The pipeline-jungle debt (M1) is what organic growth produces; the DAG is the clean-slate redesign Sculley prescribes.
2. The pipeline as a DAG of typed components: the module's own lessons ARE the components (ingest → validate [M3's gate] → transform → train [distributed] → evaluate [the gate] → push); component anatomy — driver (reads metadata: has this input been processed?), executor (the work), publisher (writes lineage) — connecting straight back to the tracking lesson's metadata store.
3. Scheduler vs orchestrator distinction (when vs where); the tool landscape in one honest table (Airflow: general DAGs, mature; Kubeflow: k8s-native, per-step containers; Metaflow/Prefect: pythonic) — criteria, not endorsements. Runner-portability (same pipeline, three runners) as the design win.
4. Testing the factory: unit tests for workload functions, data tests (Great Expectations — recalled), model smoke tests (overfit-a-batch; shape/loss checks), and the pipeline-level test (one tiny end-to-end run in CI).
5. CI/CD for ML concretely — the Made With ML triple: PR opens → training workload runs on the PR's code → metrics posted as a review comment → merge deploys. What's new vs software CI/CD: the artifact under test is (code + data + model), and "green" includes the validation gate.
6. MLOps maturity 0/1/2 with the honest question per level: 0 (manual, notebook→model, fine for one-off/low-churn), 1 (automated continuous training — needed when retraining is routine), 2 (CI/CD of the pipeline itself — needed when many teams/pipelines). Placement is an engineering judgment, not a virtue scale.

## Set pieces & gems
- The Salama levels 0/1/2 diagrams — recreate as a three-panel ladder (the canonical MLOps visual).
- Driver/executor/publisher anatomy — the one non-obvious mechanism (caching/skipping via metadata) worth drawing precisely.
- The PR-comment-with-metrics screenshot-shaped device (Made With ML) — describe concretely; a drawn mock is fine.
- "Same pipeline, three runners" (MLPS Ch.18) — portability as an architectural property.

## Pitfalls
- Tool comparison must stay criteria-driven, one table; no tutorials, no YAML.
- Don't re-teach data validation or the model gate — they appear as DAG nodes with Refs.
- Level 2 CI/CD is easy to overload; keep the triple-workflow example as THE concrete instance and resist generic DevOps sermonizing.
- Property-based testing: one Remark (Babushkin), since behavioral tests were last lesson.

## FIGURE PLAN
- draw: The course-so-far as a DAG: the six component boxes each tagged with the lesson that taught it, metadata store underneath — the module's map figure. Inspired by TFX Fig 1 + MLPS Fig 15-7.
- draw: FigureSequence (4 frames): one component executing — frame 1 driver queries metadata (input seen before?); frame 2 cache hit → skip; frame 3 cache miss → executor runs; frame 4 publisher writes artifacts+lineage. Inspired by MLPS Fig 15-8 / Ch.19 Fig 19-1.
- draw: Scheduler vs orchestrator: a DAG (when/order) handed to a resource layer (where/machines) — two stacked planes with the handoff arrow. Inspired by DMLS Fig 10-8.
- draw: MLOps maturity ladder: three panels (manual / automated training / pipeline CI/CD), one new automated element highlighted per panel. Inspired by MLPS Figs 15-3..15-6 (Salama).
- draw: The CI/CD triple: PR → training workflow → metrics comment → merge → deploy workflow; drawn as a swimlane with the human review step explicit. Inspired by Made With ML cicd lesson.

## EXERCISE PLAN
1. Warm-up: order ten shuffled pipeline steps into a valid DAG and mark which pairs can run in parallel.
2. Boundary probe: a pipeline whose every component is cached and inputs unchanged — what does a rerun do (nothing), and what single metadata-store failure mode silently breaks the skip logic (missing lineage row → spurious re-run vs stale artifact reuse — which is safer and why)?
3. Claim to refute: "we put the notebook on a cron job — that's level 1." Name the missing elements (no gate, no lineage, no tests, no trigger diversity) using the level definitions; state the smallest upgrade that earns level 1.
4. Design: convert a described 300-line training script into components — name each component's inputs/outputs/artifacts and which two get unit tests vs which needs a data test.
5. Research-shaped: for the Made With ML triple, write the exact failure path when a PR's training run regresses the gate — which workflow fails, what the reviewer sees, what merges are blocked; compare to software CI on a failing test.
6. Mixed/spaced (E3): where in the DAG does the schema live (data-validation), and which component's publisher writes the lineage row that the GDPR-deletion exercise (tracking lesson) traverses?
7. FORWARD (E7): your level-1 pipeline retrains weekly. Write the three OTHER trigger types a mature system adds (performance drop, data volume, drift alarm). Solution: trigger design is continual learning's subject — → Ref continual-learning; and the platform that ran all of this first is next lesson's artifact → Ref inside-tfx.

## ARC
- Inherits: tracking/lineage, distributed training, the validation gate — three industrial capabilities, so far manual.
- Contributes: the factory — components on a DAG with caching and lineage, tested, triggered, placed on the maturity ladder.
- Hands off: the pattern's original at production scale — the TFX paper — read as the module's application → inside-tfx.
- Spine step: "Training becomes an industrial process…" (step 5, Training as a pipeline).
