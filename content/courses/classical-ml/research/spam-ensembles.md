# The spam benchmark: bagging, forests, and boosting compared — research brief

Lesson: `spam-ensembles` (module: ensembles, core, planned). NEW — module 7's APPLICATION lesson (L16).
Goal: Reproduce the spam-corpus ensemble race — bagging, random forest, gradient boosting — and attribute each method's gain to the mechanism this module derived.

## Sources
- ESL Fig 15.1 + §15.1–15.3 (the race: bagging 5.4%, RF 4.88%, gradient boosting 4.5% on spam, with the McNemar-backed claim RF beats bagging significantly; test-error-vs-trees curves; captured image theelements-s4-fig15-1-spam-comparison).
- ESL §10.8 (gradient boosting on spam: 4.5%, the importance/PDP readings).
- spam-filter and spam-tree (internal): the ladder so far — linear ~7 / GAM 5.3 / tree 9.3.
- bagging-random-forests / gradient-boosting / xgboost (internal): every mechanism being tested.

## Key points (APPLICATION spec)
- The artifact: ESL's published three-way race on the course benchmark, REPRODUCED with our own fits (plus an XGBoost lane the book predates).
- Module results used: the correlated-average variance formula (why bagging plateaus where it does); decorrelation via m (the bagging→RF gap); bias reduction via stagewise fitting (the RF→GBM gap); OOB curves as free validation; shrinkage/early stopping (module 7 + module 5 discipline).
- Where the idealization departs: gaps of 0.4–0.9 points on a 1,536-message test set carry binomial SEs ~0.5 — the reproduction must show which published gaps survive uncertainty (ESL's own McNemar point); 0–1 error still hides mail costs; the corpus's leakage features inflate everyone equally.
1. The race run: error-vs-number-of-trees curves for bagging, RF (m=√p), GBM (depth 5, ν=0.1), XGBoost — our numbers beside ESL's published ones.
2. Each gap explained BY A FORMULA: bagging's plateau = ρσ² floor (measure tree-pair correlation ≈ its prediction); RF's drop = measured ρ falling at similar strength; GBM's further drop = bias attacked (show a target-region where bagged trees are systematically wrong and boosting is not).
3. OOB curves overlaid on test curves — the free-validation claim checked on the benchmark.
4. The full course ladder closed for supervised spam: 9.3 → 5.4 → 4.9 → 4.5 (± SEs), with module attributions; what did NOT change (the leakage features still top the importances — audit habit maintained).
5. The honest close: which differences are statistically real here (RF vs bagging: yes per McNemar; GBM vs RF: borderline), and what a deployment would actually decide on (costs, drift-robustness, latency) — modules 5's questions resurfacing.

## Set pieces & gems
- ESL Fig 15.1 — the captured original beside OUR reproduction (reproduction discipline: same axes, our seeds).
- The measured-ρ table — the module's central formula audited on real data (rarely done in teaching).
- The McNemar significance note — evaluation rigor applied to the module's own claims.

## Pitfalls
- No new algorithms; XGBoost's lane uses xgboost-lesson defaults, stated.
- Keep runtimes small (subsampled corpus documented); numbers labeled ours-vs-published throughout.
- Resist the leaderboard tone: the lesson's payoff is mechanism-attribution, not medals.

## FIGURE PLAN
- source: theelements-s4-fig15-1-spam-comparison — stem `esl-spam-race`, reader must see the original three published curves converging to their plateaus; placement: float right at the top (the claim being reproduced).
- draw: OUR race — the same three (plus XGBoost) error-vs-trees curves from our fits with ±SE band on the endpoints; drawn to the same axes as the original for eye comparison. Key image.
- draw: The ρ audit — measured pairwise tree correlation and single-tree error (σ² proxy) for bagging vs RF as a 2×2 mini-table figure, with the formula's predicted floors vs observed plateaus. Single Figure; the module's theory meeting its data.
- draw: OOB vs test — two curves per method overlaid, divergence (if any) annotated. Computed.
- draw: The final ladder — the benchmark ladder completed across modules 4–7, one bar per rung with module tags; SE whiskers; leakage caveat footnoted. The course-thread figure's final update until module 11.

## EXERCISE PLAN
1. Warm-up: from our curves, read the B beyond which bagging's error is flat; state the formula term that predicts flatness.
2. Boundary probe: run RF with m = p (all features) — verify it collapses onto bagging's curve within SE (the decorrelation knob turned off); which parameter IS bagging inside RF's family.
3. Claim to refute: "GBM beats RF here, so boosting > forests in general." Refute with scope: cite Breiman's noise results (module 7) and the Grinsztajn benchmark's within-family spread (module 11 preview) — one dataset ranks methods on itself only; name what generalizes (the mechanisms, not the ranking).
4. Research-shaped (core): reproduce the race at 3 seeds; report mean ± SE per method and a McNemar test for RF-vs-bagging on one split; state which published gaps you confirm.
5. Mixed review (E3): re-threshold the winning model for the 10:1 mail-cost regime (module 5) and report the operating point — the deployment question the error ladder ignores.
6. FORWARD (E7): for the boosted model, plot training error (hits 0) and test error (still falling) vs rounds on this real corpus — the adaboost mystery reproduced at benchmark scale. Solution: module 9 exists to explain this plot → Ref margin-bounds.

## ARC
- Inherits: everything module 7 derived, plus the benchmark and its ladder (modules 4/6).
- Contributes: the module cashed out — mechanisms audited against measured quantities on the course benchmark; the classical supervised toolkit's final standings.
- Hands off: the mystery plot reproduced at scale (module 9's mandate); the boosting-lab builds the winner from scratch.
- Spine step: "The ensemble resolution…" (step 7, closing move before the lab).
