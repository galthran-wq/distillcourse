# Failure modes and data distribution shift — research brief

Lesson: `failures-and-drift` (module: operations, core, planned).
Goal: Classify production ML failures and formalize distribution shift — covariate, label, and concept — as decompositions of $P(X,Y)$.

## Sources
- DMLS Ch.8 (pp.225-250): the opening grocery-model war story (degrades over a year); failure taxonomy — software vs ML-specific, the 60/96 Google stat (Papasian & Underwood); "ML systems fail silently"; edge case vs outlier (p.231, Fig 8-1 — one outlier bends a boundary); degenerate feedback loops — definition, resume-screening example (p.233), detection via popularity/diversity metrics, fixes: randomization (TikTok traffic pools, p.235) and position features (two-model / position-feature scheme, Table 7-1 in CS329S numbering); the formal shift typology (pp.237-241): covariate P(X) changes P(Y|X) fixed, label P(Y) changes P(X|Y) fixed, concept P(Y|X) changes; feature change & label-schema change.
- CS329S Lecture 8/10 (parallel): the Wuhan-query concept-drift example; COVID housing-price example; degenerate-loop detection metrics (hit-rate-vs-popularity).
- Burkov Ch.9 §9.3.1: the "three cannots" (can't always explain, can't reliably predict, can't always fix) and the crazy-error examples (backward braking at 120 km/h; the fluorescent-bulb factory camera).
- Rules of ML #36: positional features held constant at serving (recalled from training-serving-skew — now placed in the feedback-loop frame).
- Sculley §4: direct vs hidden feedback loops (recalled from M1 — now mechanized).
- Babushkin Ch.14 §14.4.2: concept-drift tempos — gradual (tastes), sudden (COVID), recurring (seasonality); the UK 2022 tax-bracket change example; Madoff as a decades-wrong label.

## Key points
1. Open with the taxonomy and the 60/96 stat: most production ML failures are software failures — dependency, deployment, hardware — and are caught by ordinary monitoring; the ML-specific remainder fail SILENTLY (no exception, wrong numbers). The lesson is about the silent class.
2. Skew vs drift boundary re-drawn precisely (inherits training-serving-skew's definition): skew = pipelines disagree (fixable by engineering); drift = the world moved (needs detection + adaptation). Edge case vs outlier: data property vs performance property (Fig 8-1's one-point boundary bend).
3. The shift typology as three decompositions of P(X,Y), one fully worked example each: covariate — breast-cancer screening age distribution shifts (P(X) moves, biology fixed); label — a fraud crackdown halves fraud prevalence (P(Y) moves); concept — "Wuhan" queries or COVID housing prices (same X, new Y). Emphasize: real shifts are mixtures; the typology tells you what MIGHT still be valid (a covariate-shifted model's P(Y|X) still holds — reweighting can save it; a concept-drifted model is simply wrong).
4. Tempos and shapes: gradual / sudden / recurring (seasonality is drift you can schedule for); feature change and label-schema change as the mundane-but-common shifts (upstream renames a category — data-validation recalled).
5. Degenerate feedback loops mechanized: output → exposure → engagement → training data → output; the resume-screener entrenching "went to Stanford"; the popularity spiral in recommenders; DETECTION (accuracy/diversity stratified by item popularity) and the two FIXES — randomized exploration (TikTok's initial traffic pools: every new video gets unbiased impressions) and position features (trained on, fixed at serving — the skew-by-design device recalled).
6. The three cannots as operational humility: what this implies for the module — monitor everything (next lesson), retrain deliberately (lesson after), design fallbacks.

## Set pieces & gems
- The grocery-demand consulting story — module opener narrative.
- 60/96 — keeper stat.
- Wuhan-query pair (2019 travel info → 2020 pandemic origin) — the cleanest concept-drift illustration.
- TikTok's traffic pools — exploration as production policy.
- The fluorescent-bulb factory camera + backward-braking — the "errors can be arbitrarily weird" pair.
- Madoff (a label wrong for decades) and the 2022 UK tax change — concept drift outside tech.

## Pitfalls
- Keep the typology's math at conditional-probability level — decompositions, not densities; no importance-weighting derivations (one Remark names covariate-shift correction).
- The feedback-loop section must not duplicate Sculley's M1 treatment — that named the phenomenon; this lesson gives detection metrics and fixes.
- Don't blur skew back into drift — the boundary paragraph is load-bearing for the whole module.
- Resist a COVID-anecdote parade: one example per shift type, each fully worked.

## FIGURE PLAN
- draw: The failure tree: production failures → software (60/96, caught by ops monitoring) vs ML-specific → {skew (M3, fixed by engineering), drift (this module), loops (this lesson)} — the module's map. Original — key image.
- draw: The shift typology as three panels over the same scatter+boundary: covariate (points move, boundary valid), label (class balance shifts), concept (labels flip in place, boundary now wrong) — one changed element per panel. Inspired by DMLS pp.237-241 + MLPS Figs 16-4/16-5.
- draw: FigureSequence (4 frames): a degenerate feedback loop forming — frame 1 model ranks item A slightly higher; frame 2 A gets more exposure → more clicks; frame 3 retrain on the new logs, A's advantage grows; frame 4 the popularity spiral curve vs the true-quality dashed line. Original.
- draw: Edge case vs outlier: two panels — an outlier the model handles (far but correct) vs an in-distribution edge case it fails; the definitional axes labeled. Inspired by DMLS Fig 8-1 / CS329S Fig 7-1.
- draw: Drift tempos: three time-series sketches (gradual slope, step change, seasonal wave) each tagged with its detection implication (trend test / changepoint / seasonal baseline). Inspired by Babushkin Figs 14-8/14-9.
- draw: The exploration fix: new-item traffic pool — a slice of impressions allocated uniformly before popularity data exists, drawn as a gated funnel. Inspired by the TikTok description.

## EXERCISE PLAN
1. Warm-up: classify six incidents (holiday traffic doubles; a bot farm floods signups; competitor exits and price sensitivity changes; upstream renames a country code; new UI shifts click positions; fraud ring adapts to the model) as software failure / skew / covariate / label / concept / loop.
2. Boundary probe: pure covariate shift with P(Y|X) exactly fixed — show the Bayes-optimal decision boundary is UNCHANGED, so what actually degrades? (Aggregate metrics via region reweighting; calibration in shifted regions with few training points.) State why this justifies reweighting rather than retraining.
3. Claim to refute: "our accuracy is stable, so there's no drift." Construct label shift that leaves accuracy constant while precision collapses (base rate falls 10×) — recall the consistency-metrics observation from requirements-and-metrics.
4. Derivation the lesson skipped: under label shift with known new priors P'(Y), derive the posterior correction P'(Y|X) ∝ P(Y|X)·P'(Y)/P(Y) and apply it to a 2-class numeric example.
5. Research-shaped: design the measurement distinguishing "position bias" from "true preference" for a ranked feed — what does the randomized-position holdout estimate, and how large must it be (tie to A/B sizing from module 5)?
6. Mixed/spaced (E3): the spam-filter hidden loop from M1 (users can only report what they see) — which loop fix applies (Rule #34's 1% held-out exposure, recalled from labels-and-feedback-loops), and what does it cost?
7. FORWARD (E7): you suspect covariate shift in one feature. Name the statistical object you must compare (reference vs current window distributions) and the two design choices before any test runs (window length, comparison baseline). Solution: two-sample tests and window design — next lesson → Ref monitoring-and-observability.

## ARC
- Inherits: a deployed, measured service from module 5; skew already engineered away (module 3) — what remains moving is the world.
- Contributes: the failure taxonomy, the P(X,Y) shift typology with per-type validity implications, and feedback loops with their two fixes.
- Hands off: named failure modes need instruments — the monitoring stack → monitoring-and-observability.
- Spine step: "Deployment is the beginning, not the end…" (step 7, Closing the loop).
