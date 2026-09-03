# Feature engineering at scale — research brief

Lesson: `features-at-scale` (module: training-data, core, planned).
Goal: Design features that survive production — hashing for unbounded vocabularies, crosses, embeddings, and generalization checks.

## Sources
- DMLS Ch.5: the Amazon brand-encoding escalation (2M brands → crash → UNKNOWN starves new sellers → hashing, pp.129-131); Booking.com collision study (Fig 5-4, 50% collisions <0.5% log loss — capture available); feature crossing (pp.131-132); missing values MNAR/MAR/MCAR + the age-0 imputation production bug (pp.123-125); scaling with train-only statistics (pp.126-127); feature importance (top-10 features carry ~50% at Facebook, Fig 5-10) and feature generalization: coverage + distribution overlap (pp.141-146).
- ML Design Patterns DP1 Hashed Feature (pp.69-83): the airport-code worked example (347 airports; ORD/BTV/MCI collide at 100 buckets; the collision-probability table — 100k buckets still 45% chance of some collision); ~5-entries-per-bucket rule; why fingerprint not cryptographic hashes. DP2 Embeddings (pp.83-104): plurality similarity matrix (Tables 2-6/2-7 — one-hot identity vs Twins≈Triplets 0.99); dimension rules of thumb (4th root; 1.6√n). DP3 Feature Cross (pp.104-116): the natality benchmark (linear+cross RMSE 1.05 in 0.42 min vs DNN 1.07 in 48 min); bucketize-before-crossing; L1/L2 against sparsity; don't cross correlated features.
- Khang Pham Ch.1 (pp.12-32): cross features' XOR toy; embedding dimension d = D^(1/4) TensorFlow heuristic; co-trained vs pretrained embeddings; Hadamard-vs-cosine LinkedIn quote; the Netflix raw-timestamp +30% offline gem (a feature that helps offline and complicates serving).
- Rules of ML #16-#22: features scale with data (the 1k examples→dozen features / 10M→100k table, Rule #21); clean up unused features (Rule #22); feature ownership (Rule #11).
- Sculley §3: underutilized dependencies — legacy/bundled/ε-/correlated features (leave-one-feature-out).

## Key points
1. The unbounded-vocabulary escalation as the lesson's opening arc (Amazon brands, three acts) — production categoricals grow; every naive encoding fails differently; hashing accepts collisions to buy total-function behavior. Then the measured cost: Booking's curve; MLDP's collision-probability table (birthday arithmetic: 100k buckets, 347 keys → 45% chance of a collision SOMEWHERE, yet log-loss cost tiny — distinguish "a collision exists" from "collisions hurt").
2. Feature crosses: give a linear model its interactions; the XOR toy computed; the natality benchmark's startling economics (cross+linear ≈ DNN at 1/100 the training time); the discipline (bucketize continuous first; regularize the blown-up space; don't cross correlated).
3. Embeddings as features: what one-hot destroys (identity similarity matrix) vs learned closeness (Twins/Triplets 0.99); co-trained vs pretrained tradeoff; dimension heuristics as heuristics. ML-system angle: embeddings are features that need serving infrastructure (precompute + store — feature platform recalled; ANN forward-planted).
4. Production hygiene: missing values from upstream schema changes (the age-0 bug — MNAR taxonomy in one Remark); scaling statistics are train-artifacts (leakage recalled); the Netflix timestamp gem — offline lift, serving skew (forward plant to next lesson).
5. Feature lifecycles: coverage and train/serve distribution overlap as generalization checks; importance concentration (top-10 ≈ 50%); Rules #21-#22 — features scale with data and unused features are debt (Sculley's ε-features; leave-one-feature-out as the audit).

## Set pieces & gems
- Amazon brand escalation — the narrative spine of section 1.
- Booking collision curve — sourced image (capture designingmac-s2-booking-hashing-collision; the khang duplicate exists — use the DMLS one).
- Natality cross benchmark numbers (0.42 min / RMSE 1.05 vs 48 min / 1.07) — keeper.
- Plurality similarity matrices before/after — recreate as paired grids.
- Netflix raw-timestamp +30% — the cliffhanger into training-serving-skew.
- Facebook importance concentration (top 10 ≈ 50%, last 300 < 1%).

## Pitfalls
- No sklearn-level feature-engineering tutorial (binning, one-hot mechanics known from classical-ml); production failure modes are the content.
- The hashing section must separate two probabilities (any-collision vs per-key collision rate) or the birthday table misleads.
- Embeddings: do NOT teach word2vec mechanics; treat embeddings as infrastructure objects (classical-ml/NLP courses own the training math).
- Feature selection: importance-audit level only; no wrapper/filter taxonomy (Babushkin has one; skip it).

## FIGURE PLAN
- draw: FigureSequence (3 frames): the Amazon escalation — frame 1 integer-encoded brands crash on unseen id; frame 2 UNKNOWN bucket absorbing all new brands (new sellers starved); frame 3 hashed buckets absorbing new brands with collisions marked but bounded. Inspired by DMLS pp.129-131 prose.
- source: designingmac-s2-booking-hashing-collision — Booking.com's measured collision/log-loss curve (save as `booking-hashing`); reader must see log-loss flat until extreme collision rates; centered in the hashing section.
- draw: The two collision probabilities: birthday P(any collision) vs expected collisions per key, plotted against bucket count for 347 keys, with the "which one matters" annotation. Inspired by MLDP's table, recomputed.
- draw: XOR/quadrant cross: scatter not linearly separable → bucketized axes → crossed quadrant feature makes it separable — 3-panel strip. Inspired by MLDP Figs 2-14..2-18.
- draw: One-hot vs embedding similarity matrices for plurality (identity grid vs structured grid, Twins/Triplets cell highlighted). Inspired by MLDP Tables 2-6/2-7.
- draw: Feature-generalization panel: coverage and train/serve distribution overlap for one good and one rotten feature (the age-0 spike drawn in serving distribution). Original.

## EXERCISE PLAN
1. Warm-up: 50k-key vocabulary into 2^b buckets — pick b for ≤10 expected keys/bucket and compute the per-key collision exposure.
2. Boundary probe: hash a 12-value categorical into 2^20 buckets — show what is wasted and why the UNKNOWN-bucket design is actually correct at tiny cardinality; state the cardinality regime where hashing wins.
3. Claim to refute: "45% collision probability at 100k buckets means the feature is 45% corrupted." Untangle any-collision vs affected-key fraction; compute the expected fraction of traffic-weighted keys sharing a bucket for a Zipf popularity.
4. Derivation the lesson skipped: for a linear model on two binary features, prove no weights represent XOR; add the crossed feature and exhibit the weights.
5. Research-shaped: reproduce the natality economics in spirit — estimate parameter counts of (a) linear + day×airport cross vs (b) a 2-hidden-layer DNN on the raw features, and argue the training-time ratio from FLOPs.
6. Mixed/spaced (E3): which of the module-2 stores serves the hashed-feature transform's vocabulary... trick: hashing needs NO vocabulary store — contrast with the embedding table, which needs one; state where each artifact lives (nothing vs feature platform/model artifact).
7. FORWARD (E7): the Netflix raw-timestamp feature: +30% offline. Write the serving-time value of that feature and explain why the offline gain may be fictitious. Solution: train/serve feature-value mismatch — the skew this course names next lesson → Ref training-serving-skew.

## ARC
- Inherits: honest splits from data-leakage-and-splitting; features can now be evaluated without lying to ourselves.
- Contributes: features that survive production — hashing, crosses, embeddings, hygiene, lifecycle audits.
- Hands off: the features are good; keeping them THE SAME on both sides of the train/serve boundary is the next problem → training-serving-skew.
- Spine step: "Training data is manufactured, not given…" (step 4, Data is manufactured).
