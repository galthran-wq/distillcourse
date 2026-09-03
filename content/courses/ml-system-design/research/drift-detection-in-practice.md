# Drift detection in practice — research brief

Lesson: `drift-detection-in-practice` (module: operations, core, planned). MODULE-FINAL APPLICATION LESSON (L16) — a computational study the reader can run.
Goal: Apply drift detection to a real text stream — KS, chi-squared, and MMD on embeddings — and read detector outputs against the module's taxonomy.

## Sources
- Made With ML monitoring lesson — THE walkthrough this lesson reproduces: reference vs test windows on the ML-content tagging service's inputs; KS on text length (p=0.39 no-drift vs p≈7e-35 induced drift); chi-squared on token counts; MMD on scibert embeddings with the 'UNK'-prefix induced shift; alibi-detect's actual output dicts (is_drift: 0/1, distance, p_val, threshold); online drift detection (MMDDriftOnline) one Remark; outlier detection one Remark.
- "Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift" (Rabanser et al., cited by Made With ML) — the reduce-then-test recipe (PCA/autoencoder/BBSD reductions + two-sample tests); cite as the method's primary source in References.
- DMLS Ch.8 (pp.242-247): the detection-method framing this executes (recalled with Refs, not re-taught).
- DMLS Ch.8 Fig 8-2 / capture designingmac-s3-alibi-detect — Alibi Detect as the reference OSS toolkit.
- Babushkin Ch.14 §14.4.3: quality/segment/prediction-drift/input-drift metric families — the triage vocabulary.

## Key points
1. APPLICATION SPEC. Artifact: the executable drift-detection study — three detectors on one real text stream (the Made With ML tagging service's production-shaped inputs), with the actual numbers reproduced. Module results used: the shift typology (which detector sees which shift type), window design (reference/test choice from monitoring), two-sample test limits (KS's 1-D constraint driving the reduce-then-test recipe), and the trigger question (what threshold would have fired continual-learning's retrain). Departures from the idealisation: detection ≠ diagnosis (is_drift:1 names no cause); induced shifts are cleaner than real ones; p-values at production sample sizes reject for trivial effect sizes (statistical vs practical significance); no labels — none of the three detectors measures accuracy.
2. The setup taught as protocol: choose the reference window (deployment-time snapshot vs sliding), the test window, the cadence — every choice recalled from monitoring with its trap.
3. Detector 1 — KS on a scalar (text length): the two runs side by side (p=0.39 vs 7e-35); reading a p-value at n=thousands (tiny effects reject; add an effect-size floor).
4. Detector 2 — chi-squared on token counts (categorical path); when vocabulary churn makes it fire spuriously (new-slang seasonality).
5. Detector 3 — MMD on embeddings via reduce-then-test (Failing Loudly recipe): why raw high-dim two-sample testing fails (power collapses); dimensionality reduction as the fix; the 'UNK'-prefix induced shift caught; what the embedding detector can see that per-feature tests cannot (joint/multivariate shift) and what it loses (attribution — which feature moved?).
6. The triage protocol as the closing artifact: alarm → check pipeline health (skew/schema — data-validation machinery) → check seasonality (baseline swap) → check segments (which slice moved) → verdict {bug / seasonal / true drift} → actuator (fix pipeline / adjust baseline / trigger retrain per continual-learning). A one-page runbook the reader keeps.

## Set pieces & gems
- The p=0.39 → 7e-35 pair — the study's keeper contrast (35 orders of magnitude between "fine" and "shifted").
- alibi-detect's literal output dict — showing what an engineer actually reads at 2 a.m.
- The 'UNK'-prefix induced shift — a controllable, reproducible corruption; the pedagogy of induced failures.
- Failing Loudly's finding that BBSD (softmax outputs of a trained classifier) is a strong cheap reduction — one Remark: your model's own outputs are a drift sensor (prediction monitoring justified post hoc).

## Pitfalls
- This is an application lesson: mechanics were taught in monitoring — every detector section opens with a Ref, not a re-derivation.
- Keep the code presence light: fragments + outputs, not a notebook dump (no lab exists — the canon assigns none).
- The statistical-vs-practical significance point must be worked (effect size at n=10k), not asserted.
- Don't oversell MMD: quadratic cost, kernel choice sensitivity — one honesty Remark.

## FIGURE PLAN
- draw: The study's pipeline: production stream → {reference window, test window} → three detector lanes (scalar KS / categorical chi² / embedding reduce+MMD) → verdict panel — the lesson's map. Original — key image.
- draw: The KS pair: two ECDF overlays — no-drift (curves entwined, p=0.39) vs induced drift (visible gap, p≈7e-35), the statistic as the max vertical gap marked. Original, from the walkthrough's numbers.
- draw: FigureSequence (3 frames): reduce-then-test — frame 1 two high-dim clouds indistinguishable to per-axis tests; frame 2 projected to 2-D where they separate; frame 3 MMD verdict with the output dict rendered. Inspired by Failing Loudly's recipe.
- source: designingmac-s3-alibi-detect — the Alibi Detect output panels as printed in DMLS (save as `alibi-detect`); reader must see the toolkit's real result rendering; float right beside the detector-outputs section.
- draw: Statistical vs practical significance: p-value vs sample size for a fixed tiny effect — the curve crossing 0.05 at large n, with the effect-size floor drawn as the fix. Original.
- draw: The triage runbook as a decision flowchart (alarm → pipeline? → seasonal? → segment? → verdict → actuator), each branch tagged with the lesson that owns the check. Original.

## EXERCISE PLAN
1. Warm-up: given three alibi-detect output dicts (p=0.41; p=0.003 with distance 0.9; p=0.02 with tiny distance at n=50k), write the verdict line for each.
2. Boundary probe: run the KS test between two windows drawn from the SAME distribution 100 times at α=0.05 — expected false alarms? Now 400 features daily (recall the monitoring exercise) — what does this study's per-detector budget have to be?
3. Claim to refute: "the embedding MMD detector replaces all per-feature monitors." Name the two losses (attribution; cheap scalar checks catch pipeline bugs like null spikes faster) and the hybrid design.
4. Research-shaped (the study itself): reproduce the walkthrough's three detectors on any text stream (or trace the provided numbers): report the three p-values, one induced shift, and the effect-size floor you'd set; compare your KS pair against 0.39/7e-35.
5. Triage drill: an MMD alarm fires Monday 09:00 on a service redeployed Sunday night — walk the runbook; which branch resolves it (processing-time backlog artifact — recall batch-and-stream's redeploy figure) before "true drift" is reached?
6. FORWARD (E7): your detectors watch a classical tagging model. Note which of the three transfer unchanged to an LLM application's inputs (all — text length, tokens, embeddings) and what NEW drift source LLM apps add that no input detector sees. Solution: the provider's model changes under you — the GPT-drift exhibit in → Ref foundation-models-in-production and ai-application-architecture.

## ARC
- Inherits: the shift typology (failures-and-drift), the instruments and window discipline (monitoring), the retrain trigger (continual-learning).
- Contributes: the module's application — the instruments actually run on a real stream, outputs read, verdicts triaged, thresholds confronted.
- Hands off: the loop is closed for classical systems; module 7 composes everything into the canonical product shapes, module 8 re-runs the discipline for foundation models.
- Spine step: "Deployment is the beginning, not the end…" (step 7, Closing the loop) — closes the core of the step.
