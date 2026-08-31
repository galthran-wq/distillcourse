# Problem framing and the baseline ladder — research brief

Lesson: `problem-framing-and-baselines` (module: production-ml, core, planned).
Goal: Formulate a business problem as an ML task and select the baseline that must be beaten before any model earns its complexity.

## Sources
- DMLS Ch.2 (pp.35-43): types of ML tasks; the next-app reframing (Figs 2-5/2-6: N-way multiclass classifier that breaks when an app is added vs regression over (user, environment, app) tuples); high-cardinality/hierarchical classification.
- Rules of ML: Rule #1 (launch without ML; heuristic = 50% of the value; install-rate/recency/alphabetical heuristics), Rule #2 (metrics before ML), Rule #3 (ML over a complex unmaintainable heuristic), Rules #12-#15 (objective choice: simple, observable, attributable; direct actions vs indirect effects vs unmeasurable).
- DMLS Ch.6 (pp.179-181): baselines — random, simple heuristic, zero rule, human, existing solution; "a good system isn't necessarily a useful one"; the F1=0.90-equals-majority-class gem.
- CS329S Lecture 5/6: the Four Phases of ML development (before ML → simplest ML → optimizing simple → complex); "graduate student descent".
- Burkov Ch.2 (§2.1-2.2): impact×cost prioritization; the superlinear cost-vs-accuracy curve (Fig 1); "simplify the problem to estimate it" (10-topic pilot before the 1000-topic classifier); Ch.5 §5.1.4 zero-rule math (80/20 dataset → 80% free accuracy).
- ML Design Patterns, DP28 Heuristic Benchmark (Table 7-1): the benchmark-by-scenario cookbook (regression → median; time series → persistence; recommender → most-popular-in-category); the warning never to use a trained model as the benchmark.
- Babushkin Ch.2-3: problem space vs solution space; the "magic oracle" approximation; the Super Bill story (Zipf's-law labeling beat a deep-semantic-search proposal, shipped in 3 weeks).

## Key points
1. Framing decides system properties, not accuracy: the next-app example worked in full — the multiclass framing must be retrained whenever the app catalog changes; the (user, app)→score regression framing survives catalog churn. Framing choice = maintenance choice.
2. Objectives must be observable and attributable (Rule #13's three tiers): clicks/downloads/reports train models; next-day-return works only for A/B analysis; "user happiness" is not a training objective. Tie back to natural labels (forward Ref labels-and-feedback-loops).
3. The baseline ladder, each rung with its worked number: random (base-rate math), zero rule (80/20 → 80% accuracy free; the F1=0.90 majority-class trap worked as a confusion-matrix computation), heuristic (Rule #1's examples + DP28's Table 7-1 cookbook), human, existing system. The rung you must beat is the existing solution, not zero.
4. Launch without ML (Rule #1) as doctrine, not slogan: the heuristic both ships value and becomes the benchmark; the four phases place it as phase 1; "ML over a heuristic" is justified when the heuristic becomes unmaintainable (Rule #3).
5. Cost grows superlinearly with the accuracy target (Burkov Fig 1): a 99.9% requirement is a red flag to renegotiate; simplify-to-estimate (the 10-topic pilot) as the scoping tool.
6. Refutation slot (L13 — real misconception): "start with the SOTA model, it's best." Refute with the phases + the Super Bill story + DP28's cost argument; replacement model: complexity must buy its way in against the ladder.

## Set pieces & gems
- F1=0.90-that-is-majority-class: work the confusion matrix so the reader computes why F1 alone can be a lie without a baseline (DMLS p.179).
- The next-app reframing pair of diagrams (DMLS Figs 2-5/2-6) — recreate.
- Super Bill (Babushkin ch2): frequency-sorted labeling + Levenshtein narrowing shipped in <3 weeks where DSSM search was proposed — the practitioner parable for phase discipline.
- DP28's Table 7-1 heuristic cookbook — recreate as the lesson's reference table.
- Burkov's cost-vs-accuracy curve — recreate; keeper: the knee near ~95-99%.

## Pitfalls
- Do not re-teach task types (classification/regression definitions) — audience knows; the content is the CONSEQUENCES of framing.
- The ladder is not "always use a heuristic forever" — Rule #3 gives the exit condition; state it or the lesson overshoots.
- Keep the four phases descriptive, not a maturity religion; MLOps maturity (M4) is the formal version.
- "Human baseline" needs a cost note (Mechanical Turk / expert panel), not a methodology detour.

## FIGURE PLAN
- draw: The next-app reframing: two side-by-side framings (N-output classifier vs (user, app) scoring), with the catalog-change event shown breaking one and not the other. FigureSequence, 3 frames (works → app added → one breaks). Inspired by DMLS Figs 2-5/2-6.
- draw: Rule #13's three-tier objective taxonomy as a stacked diagram (trainable actions / A/B-only signals / never-optimize), with product examples per tier. Original composition.
- draw: The baseline ladder as literal rungs, each annotated with its computed number for the lesson's running example (spam-ish binary task). Original.
- draw: The F1-trap worked confusion matrix: majority-class predictor on a 90/10 split, F1 computed on-figure. Inspired by DMLS p.179.
- draw: Cost vs accuracy-target curve with the knee marked and 'renegotiate here' annotation. Inspired by Burkov Ch.2 Fig 1.
- draw: The four phases as a horizontal timeline with the exit condition of each phase stated under it. Inspired by CS329S sidebar.

## EXERCISE PLAN
1. Warm-up: compute random and zero-rule baselines (accuracy, precision, recall, F1) for a 95/5 imbalanced task; state which metric makes the zero rule look best.
2. Claim to refute: "our fraud model's F1 of 0.91 proves it works." Given the confusion matrix, show the existing rule-based system already scores 0.89 and the model loses to it on recall at matched precision — name the missing ladder rung.
3. Framing task: a food-delivery product wants "estimated arrival times users trust." Propose two framings (point regression vs quantile/interval) and give one system consequence of each (this lands on the underprediction/overprediction asymmetry — Ref requirements-and-metrics' bias discussion).
4. Boundary probe: when is the heuristic the FINAL system? Construct the case where Rule #3's exit condition never triggers (static patterns, enumerable rules) and say which "when ML shines" condition from ml-in-production stays false.
5. Research-shaped: pick a task from DP28's Table 7-1 (time-series demand), implement the persistence heuristic on a provided 30-day toy series, and report the MAPE a model would have to beat.
6. FORWARD (E7): for the demand-forecast task above, draft the six section headings of the document you would write before building — problem, metrics, data, validation, baseline, risks. Solution: this is the design document, next lesson's artifact → Ref the-design-document.

## ARC
- Inherits: requirements and the metrics chain from requirements-and-metrics — the numbers exist; the open question is what task earns them and what must be beaten.
- Contributes: framing-as-maintenance-choice, observable objectives, and the baseline ladder with computed rungs.
- Hands off: framing + metrics + baseline are exactly the skeleton of a design document → the-design-document.
- Spine step: "A trained model is the small part…" (step 1, The model is the easy part).
