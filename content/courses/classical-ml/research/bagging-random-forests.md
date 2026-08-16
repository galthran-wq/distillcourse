# Bagging and random forests — research brief

Lesson: `bagging-random-forests` (module: ensembles, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/bagging-random-forests/lesson.mdx (28 min).
Goal: Explain how bagging reduces variance and why random forests decorrelate trees, using the correlated-average variance formula.

## Sources
- Breiman 2001 (primary): Definition 1.1; Theorem 1.2 (a.s. convergence — more trees never overfit); the strength/correlation bound PE* ≤ ρ̄(1−s²)/s² (Thm 2.3); OOB estimates §3.1; Forest-RI (F=1 often competitive!); permutation importance §10; Var_rf = ρσ² (regression §15-parallel).
- ESL §8.7 (bagging: population averaging never hurts under squared loss eq 8.52, CAN hurt 0–1 classifiers — the honesty case; Fig 8.9–8.10 bootstrap trees), Ch. 15 (Var of correlated average eq 15.1: ρσ² + (1−ρ)σ²/B; OOB §15.3.1; importance Fig 15.5; RF-vs-boosting bias discussion §15.4.2 — RF does NOT reduce bias; the m→ridge analogy p.601).
- ISLP §8.2.1–8.2.2 (gentle build; OOB free-CV framing; the 15-class gene-expression comparison).
- Murphy §18.3–18.4 (63.2% rate — inherited from module 5; ensemble concentration arithmetic §18.2: 0.51 accuracy × 1000 voters → 0.73).

## Key points
1. The inherited wound: trees are low-bias, high-variance (spam-tree's measured instability table). Averaging B iid replicas would divide variance by B — but we have ONE dataset. The bootstrap (module 5) manufactures the replicas.
2. THE formula derived in full: for identically distributed trees with pairwise correlation ρ, Var(average) = ρσ² + (1−ρ)σ²/B. Read three ways: B→∞ leaves the floor ρσ²; bias unchanged (averaging identically-biased things); the whole ensemble program = attack ρ or σ² without raising bias.
3. Bagging: bootstrap + aggregate; why it needs unstable low-bias learners (stable learners → trees nearly identical → ρ≈1 → nothing gained; k-NN counterexample); the 0–1-loss subtlety (ESL: averaging BAD classifiers can make them worse — the wisdom-of-crowds condition is being right on average).
4. Random forests: at each split, only m ≈ √p random candidate features — decorrelate the trees at a small bias/strength cost; Breiman's strength-vs-correlation frame (his Thm 2.3 stated with reading); the surprise that m=1 is often competitive; the m-small ↔ ridge analogy (every correlated predictor gets its turn).
5. OOB: each tree's ~37% unseen points give free CV (module 5's 63.2% cashed); OOB error tracks test error; Breiman's convergence theorem — adding trees cannot overfit (proof deferred; statement precise: the LIMIT exists; the limit can still be bad).
6. Variable importance: Gini-decrease vs permutation (Breiman's §10); their biases (cardinality bias of Gini; correlation masking of permutation) — one honest paragraph each; the spam importances ('george','hp') as the running example.
7. What forests do NOT do: reduce bias (ESL §15.4.2 — RF bias ≥ single deep tree's) — the boosting hand-off.

## Set pieces & gems
- Murphy's voting arithmetic: 1,000 independent 51%-voters → 73%; 10,000 → 97% — then the punchline that INDEPENDENCE is the unobtainable ingredient, which is what ρ measures.
- Breiman's "40× faster than Adaboost on zip-code data with F=1" — one systems sentence.
- ESL's Fig 8.9-panel idea (11 bootstrap trees) — connects directly to spam-tree's instability table.

## Pitfalls
- "OOB = test error" overclaim: OOB is an estimate with its own bias at small B; state it.
- "More trees never overfit" is about B, not about depth/m — the two knobs must not blur.
- Do not do boosting comparisons beyond the bias sentence (spam-ensembles owns the race).

## FIGURE PLAN
- draw: The formula dissected — Var(avg) = ρσ² + (1−ρ)σ²/B with underbraces (floor / vanishing part); curves of variance vs B at ρ = 0, 0.3, 0.7 showing the floors. Key image.
- draw: FigureSequence (4 frames): bagging assembled — (1) one dataset, (2) three bootstrap replicas with their differing trees (spam-tree's instability recycled), (3) their three boundaries overlaid, (4) the averaged boundary, smoother; test-error tally per frame.
- draw: Decorrelation — two panels of tree-pair prediction scatter (bagged trees: tight diagonal, ρ high; RF trees with m=√p: cloud, ρ low), with the measured ρ printed. Computed.
- draw: OOB mechanics — B rows of n cells, in-bag cells filled, each point's OOB committee bracketed; OOB-vs-test error curves over B converging. Single Figure + inset.
- draw: m sweep — test error and measured ρ vs m on one dataset (Breiman Fig 1's story recreated): strength plateaus, correlation climbs, error minimized at small m. Computed line chart.
- draw: Importance duel — Gini vs permutation importances on the spam data as paired bars; the disagreements circled and diagnosed. Inspired by ESL Fig 15.5.

## EXERCISE PLAN
1. Warm-up: evaluate Var(avg) for σ²=1, ρ=0.5 at B = 10, 100, ∞; state the floor.
2. Derivation skipped: derive the ρσ² + (1−ρ)σ²/B formula from the covariance expansion of Var(ΣXᵢ/B) (the lesson shows the setup; reader completes).
3. Boundary probe: bag a STABLE learner — the sample mean itself; show the bagged estimator ≈ the original (ρ≈1), formalizing "bagging needs instability"; then the 0–1 case: three classifiers each 40% accurate, majority vote worse — the wisdom-of-crowds hypothesis named.
4. Claim to refute: "random forests overfit if you add too many trees." Refute with Breiman's convergence theorem + an experiment (error vs B flat at B=2000); then name what DOES overfit forests (deep trees + tiny m on noisy targets — the limit itself being bad).
5. Mixed review (E3): compute the OOB probability a given point is out-of-bag for one tree (36.8%) and in at least 30% of trees' OOB sets at B=100 (binomial) — module-5 arithmetic reused.
6. Research-shaped: reproduce Breiman-style m-sweep on the spam corpus: m ∈ {1, √p, p/2, p}; report error and mean tree-pair correlation; check the strength-plateaus/correlation-climbs pattern.
7. FORWARD (E7): fit a random forest to a 1-D stepwise target with heavy label noise vs a slowly-varying smooth target; observe the forest nails the first and stays biased on the second (smoothness beyond leaf resolution). Solution: attacking BIAS sequentially is boosting → Ref adaboost.

## ARC
- Inherits: tree instability measured (spam-tree), the bootstrap (module 5), the variance term (bias-variance).
- Contributes: the variance half of the ensemble resolution — one formula, two algorithms, one free error estimate.
- Hands off: the bias half → adaboost; the race on the corpus → spam-ensembles.
- Spine step: "The ensemble resolution: averaging kills the variance trees pay…" (step 7).

## REVISION (vs old draft)
- Gains: full derivation of the correlated-average formula (draft states it); the stable-learner and 0–1 boundary probes; Breiman's strength/correlation frame with the m-sweep reproduction; the OOB-probability computation; the bias-not-reduced closing (draft mentions it — now it is the hand-off argument).
- Loses: interview register; the importance section's listicle becomes the duel figure + two argued paragraphs.
- Demo: none (unchanged).
