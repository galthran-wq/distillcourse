# Experiment tracking, versioning, and reproducibility — research brief

Lesson: `experiment-tracking-and-versioning` (module: training-pipelines, core, planned).
Goal: Implement experiment tracking and data/model versioning so any production model is traceable to its exact code, data, and configuration.

## Sources
- DMLS Ch.6 (pp.162-165): what to track (loss curves, metrics, samples/predictions, speed, system metrics, hyperparameter trajectories); why data versioning is hard (line diffs meaningless, merge conflicts undefined, GDPR vs immutability); DVC-style pointer versioning.
- DMLS Ch.10 (pp.322-323): the model store's eight artifact types (definition, parameters, featurize/predict functions, deps, data pointers, generation code, experiment artifacts, tags) motivated by the Stitch Fix debugging scenario.
- MLPS Ch.4 (pp.43-45): MLMD — artifacts/executions/contexts, events/attributions; the lineage query ("all models trained from dataset X"). Ch.15 (pp.245-254): experiment tracking tools survey, notebook limits.
- Sculley §6: configuration debt — config lines outnumber code; the six principles (diffable, hard to misconfigure, easy to see diffs, auto-verifiable, detects unused settings, code-reviewed); the worked feature-availability/logging-window config vignette.
- Burkov Ch.3 §3.11.3: data-versioning maturity levels 0-3 (unversioned → snapshot → data+code as one asset → specialized tooling).
- Made With ML experiment-tracking lesson: MLflow dashboard (capture available), loading best checkpoint from a run — the concrete tool anchor.
- Babushkin Ch.13 §13.1: the Python 3.5→3.6 JPEG-library reproducibility bug ("hardcore software archeology into 6-year-old build logs").

## Key points
1. The motivating scenario (Stitch Fix, DMLS): production model misbehaves at 3 a.m. — what must be retrievable to debug it? Derive the eight artifact types from the debugging needs, not as a list.
2. Experiment tracking: what to log and why each item earns storage (curves for divergence forensics, samples for behavior diffs, system metrics for cost attribution, hyperparameter trajectories for search audits). MLflow as the concrete instance; the dashboard capture as the visual anchor.
3. Data versioning is a different problem from code versioning — the three obstructions (diff/merge/GDPR) each argued; pointer-based versioning (hash the data, version the pointer) as the resolution; Burkov's levels 0-3 as the maturity scale with level 2 (data+code one asset) the recommended default.
4. Lineage as a graph: artifacts (datasets, models) and executions (runs) with edges; the two queries that justify it — "which models must be retrained after this bad dataset?" and "which dataset produced this model?" — worked on a small drawn graph. GDPR right-to-be-forgotten as a lineage query (forward plant to privacy extra).
5. Configuration debt: config outnumbers code in mature systems; the six principles as a review checklist; the Babushkin interpreter-bump bug as the reproducibility parable (the environment IS configuration — pin it).
6. Reproducibility statement: run = f(code, data, config, environment, seed) — each term with its versioning mechanism; what remains irreducible (GPU nondeterminism) admitted in one Remark.

## Set pieces & gems
- Stitch Fix 3 a.m. scenario as the derivation device for the artifact list.
- The Python 3.5→3.6 / C JPEG library bug — reproducibility archeology, memorable and precise.
- Sculley's config vignette ("Feature A incorrectly logged 9/14-9/17… Feature Q precludes R") — quote-adjacent paraphrase as the config-debt exhibit.
- MLflow dashboard capture (madewith-mlflow-dashboard) — real tool output.
- GDPR-vs-immutability tension — a genuinely non-obvious design constraint.

## Pitfalls
- Not a tool bake-off: MLflow appears as the exemplar; W&B/Neptune named once.
- MLMD internals: the graph idea and two queries only — no API.
- Don't overclaim reproducibility: bitwise-identical training is often impossible (GPU nondeterminism, data order) — reproducible-enough (same data/code/config, metrics within tolerance) is the honest target.
- Config section: six principles + one vignette; resist a YAML-hygiene tutorial.

## FIGURE PLAN
- draw: The 3 a.m. debugging tree: symptom → questions asked → artifact that answers each — ending with the eight artifact types as leaves. Original composition; the lesson's key image.
- draw: Pointer-based data versioning: git repo holding small pointer files → content-addressed blobs in object storage; a dataset edit producing a new hash while history stands. Inspired by DVC's model / Burkov §3.11.3.
- draw: Lineage graph: 3 datasets, 4 runs, 3 models as nodes; the "bad dataset" query shaded downstream, the "which data made this model" query shaded upstream. Inspired by MLPS MLMD description.
- source: madewith-mlflow-dashboard — the real MLflow runs table (save as `mlflow-dashboard`); reader must see sortable runs with params/metrics columns — what tracking buys at a glance; float right beside the tracking section.
- draw: FigureSequence (3 frames): the JPEG-library bug — frame 1 model + env v3.5, prediction P; frame 2 interpreter bumped, C lib silently changes, prediction P'; frame 3 the pinned-environment fix (lockfile in the artifact). Original drawing of Babushkin's story.
- draw: The reproducibility equation run = f(code, data, config, env, seed) with each argument annotated by its versioning mechanism. Original.

## EXERCISE PLAN
1. Warm-up: from a run's tracked artifacts (given list), answer four debugging questions (when did loss diverge? which data version? what LR schedule? cost of the run?) — name the artifact used for each.
2. Boundary probe: what CAN'T be recovered even with all eight artifacts versioned — construct the GPU-nondeterminism case where two byte-identical runs differ, and state the tolerance-based definition of reproduced.
3. Claim to refute: "we snapshot the training table to S3 before each run, so our data is versioned." Name the two failures (no lineage to the run; mutable upstream between snapshot and label-join) and the level (Burkov 1) it corresponds to; upgrade it to level 2.
4. Derivation the lesson skipped: design the GDPR deletion procedure for a lineage graph — given user U's rows in dataset D3, list the artifacts and models transitively affected and the order of operations (this is a reachability computation; show it on the drawn graph).
5. Config audit: a provided 12-line training config with three planted defects (unused key, magic threshold duplicated from code, env var not pinned) — find them and cite the violated principle.
6. Mixed/spaced (E3): the data-validation lesson's schema — is it code, config, or data? Defend the answer with the six principles (it's config that must be versioned WITH the data it describes).
7. FORWARD (E7): your tracked run at batch 512 diverges where batch 128 didn't, LR unchanged. Log the hypothesis you'd test next. Solution: large-batch training needs scaled learning rates — the measured curve is next lesson's exhibit → Ref distributed-training.

## ARC
- Inherits: gated data from module 3; training runs on it — currently untracked and unreproducible.
- Contributes: traceability — tracking, pointer versioning, lineage, configuration discipline — the precondition for industrial training.
- Hands off: with runs recorded, the next question is making them fit and fast on real hardware → distributed-training.
- Spine step: "Training becomes an industrial process…" (step 5, Training as a pipeline).
