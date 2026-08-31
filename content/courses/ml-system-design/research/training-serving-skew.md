# Training–serving skew and the transform problem — research brief

Lesson: `training-serving-skew` (module: training-data, core, planned).
Goal: Design the transform architecture that eliminates training–serving skew — log serving-time features, bake transforms into the model, or serve from a feature store.

## Sources
- Khang Pham Ch.1 (pp.91-96): the Spotify Podcast Model postmortem — online transform implemented differently by a different team; four months of silent degradation; fixed by logging already-transformed features + TFDV drift alerts (Chebyshev distance).
- Rules of ML #29-#37: log serving-time features and pipe to training (#29); importance-weight sampled data (#30, one Remark); joined tables changing between train and serve (#31); reuse code between pipelines (#32); test on post-cutoff data (#33); ranking skew (#35, forward plant); positional features (#36 — position as feature, ablated at serving, additive never crossed); THE decomposition — #37's three gaps: train-vs-holdout (overfitting), holdout-vs-next-day (staleness/shift), next-day-vs-live (skew proper).
- ML Design Patterns DP21 Transform (pp.425-435): separate inputs/features/transforms; bake the transform graph into the artifact; tf.transform full-pass statistics; Feature Store as the alternative.
- MLPS Ch.3 (pp.28-31): instance-level vs full-pass transforms; the transform graph prepended to the SavedModel; Ch.12 (pp.195-197) training-serving skew's three causes.
- Babushkin Ch.14 §14.3.5: the St. Petersburg-vs-Cyprus AR demo story (trained in cloudy SPb, demoed under Cyprus sun).
- DMLS Ch.7 (pp.203-205): the "two pipelines, two teams" figure — recalled from module 2's batch/stream lesson.
- Khang/DMLS Netflix timestamp gem — resolved here (planted in features-at-scale).

## Key points
1. Define skew operationally and separate it from drift NOW (skew = your two pipelines disagree; drift = the world moved) — module 6 depends on this distinction being clean.
2. The Spotify postmortem worked as the opening exhibit: same transform, two implementations, no exception, no alert, four months. The mechanism of silence: offline metrics are computed in the offline (wrong-side) pipeline.
3. Rule #37's decomposition as the lesson's measurement framework: three gaps, each with its own cause family and its own fix; a table the reader can apply. Measurement precedes repair.
4. The three repairs, each honestly costed: (a) log-and-wait (#29) — serve-time features become next training set; cost: cold start for new features, storage; (b) transform-in-model (DP21) — one implementation shipped inside the artifact; cost: full-pass statistics need a prior pass, artifact weight; (c) feature store as single source — recall module 2's platform; cost: infrastructure + still doesn't cover post-fetch transforms (the feature-platform lesson's honest close, now resolved).
5. Point-in-time correctness: the as-of join worked on a tiny table (label at T, feature rows versioned; join as-of T) — the "time travel" bug named; this is leakage (module lesson 2) meeting the feature store.
6. Positional features (#36) in one section: position-as-feature at training, fixed at serving; kept additive; this is skew MANAGED DELIBERATELY — the one case where train and serve inputs differ by design. Forward plant for ranking-and-ctr.
7. The Netflix timestamp resolution: the +30% offline feature whose serving value ("now") training never saw — classify it with #37's gaps and prescribe.

## Set pieces & gems
- Spotify four-month postmortem — flagship.
- St. Petersburg/Cyprus — the environmental version of the same disease (one Remark; it's technically drift-flavored skew — use it to sharpen the skew/drift boundary).
- Rule #31's joined-table example (the table changes between training run and serving) — quick vignette.
- The as-of join worked micro-example — 6-row table, one wrong join circled.
- GitHub-style before/after: two-pipeline diagram vs transform-in-artifact diagram.

## Pitfalls
- Do not merge skew and drift; this lesson's boundary discipline pays off in module 6 (failures-and-drift opens by citing it).
- log-and-wait's limitation (new features have no history) must be stated or readers over-apply it.
- tf.transform specifics: pattern level only (analyze phase computes stats; transform graph ships) — no TFX code tutorial (inside-tfx will show the platform).
- Positional features: resist the temptation to teach IPS here; ranking-and-ctr owns it.

## FIGURE PLAN
- draw: FigureSequence (4 frames): the Spotify bug — frame 1 one logical transform, two boxes (Python batch / Java service); frame 2 the implementations diverge subtly; frame 3 offline metric computed on the left, users served from the right; frame 4 four months pass, the drift alert that finally fired. Original drawing of the postmortem.
- draw: Rule #37's three gaps as a horizontal pipeline: train → holdout → next-day → live, each gap bracketed with its cause family (overfit / staleness / skew) and its measuring instrument. Original composition — the lesson's key image.
- draw: The three repairs as three small architectures side by side: log-and-wait (arrow from serving logs to training set), transform-in-model (transform box inside the artifact), feature store (both pipelines reading one store) — costs annotated under each. Inspired by DP21 + Rules #29.
- draw: As-of join micro-example: a features table with validity intervals, a label at time T, the correct join row highlighted and the "as of now" wrong row struck out. Original.
- draw: Positional feature at train vs serve: training rows with position filled; serving request with position=1 constant; the additive-model note on-figure. Inspired by Rules #36.

## EXERCISE PLAN
1. Warm-up: three measured numbers — train accuracy 94, holdout 89, next-day replay 88.5, live sampled accuracy 81 — attribute the gaps with Rule #37 and pick which repair applies to the big one.
2. Boundary probe: a pure end-to-end model on raw text (no feature engineering at all) — which skew causes vanish by construction, and which survive (tokenization version! joined metadata!)? The degenerate case shows skew is about ANY computation before the model.
3. Claim to refute: "we use a feature store, so training-serving skew is solved." Recall the feature-platform close: post-fetch transforms and as-of joins remain; construct the concrete counterexample (normalize-by-current-mean applied in the service only).
4. Derivation the lesson skipped: log-and-wait changes the training distribution to the SERVED population — show with a two-segment toy (bots filtered at serving, present in warehouse) that this is sometimes a correction, not a bug; name when it back-fires (feedback loops — forward note to module 6).
5. Research-shaped: design the minimal skew monitor for the Supermegaretail forecast: which per-feature statistics, compared between which two datasets, at what cadence — and what Chebyshev/L∞ threshold Spotify's fix used.
6. Mixed/spaced (E3): the scaler-artifact exercise from data-leakage-and-splitting — restate its answer in this lesson's vocabulary (which repair strategy is "ship the scaler with the model"?).
7. FORWARD (E7): write the schema entry (type, presence, domain) for the `position` feature that exists in training and must NOT exist in serving requests. Solution: expressing per-environment presence is exactly schema environments, next lesson's machinery → Ref data-validation.

## ARC
- Inherits: production-grade features from features-at-scale and the platform's honest close (storage consistency ≠ transform consistency) from feature-platform.
- Contributes: skew named, measured (three gaps), and repaired (three architectures) — the module's central discipline.
- Hands off: repairs need an automated watchdog — schemas, statistics, comparators — the module's application → data-validation.
- Spine step: "Training data is manufactured, not given…" (step 4, Data is manufactured).
