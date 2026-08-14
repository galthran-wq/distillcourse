# Decision trees — research brief

Lesson: `decision-trees` (module: local-models, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/decision-trees/lesson.mdx (26 min).
Goal: Construct classification and regression trees by greedy impurity minimization and prune them with cost-complexity pruning.

## Sources
- ESL §9.2 (CART: recursive binary splitting, regression eq 9.13, cost-complexity pruning 9.15–9.16 with weakest-link; classification impurities 9.17 + Fig 9.3; the categorical optimal-split theorem §9.2.4; Fig 9.2 partition/tree/surface triptych).
- ISLP §8.1 (the Hitters tree with its three memorable salary leaves; Fig 8.7 — the 2×2 when-trees-beat-linear panel; pruning curve Fig 8.5).
- SSBD Ch. 18 (Eq 18.1 MDL bound for trees — a real generalization statement; ID3 schema; gain measures).
- Bishop Ex. 14.11 (the 400/400 split counterexample: identical misclassification, different Gini/entropy — the growing-criterion argument made exact).
- Murphy §18.1 (greedy split NP-completeness note; Fig 18.3 remove-one-point instability — feeds the demo/closing).
- R2D3 Part 1 (the SF/NY housing build — pedagogy reference for the felt build; the ball-drop image available).

## Key points
1. The move: instead of fixed neighborhoods (kernel-smoothing's flaw at high d and mixed features), PARTITION adaptively — big leaves where data is plentiful/flat, small where it varies. Trees as adaptive nearest neighbors (ESL's reading).
2. One split fully by hand: a 10-row table, every candidate threshold enumerated, impurity decrease computed for each — the greedy step demystified (R2D3's spirit, our dry register).
3. Impurity: misclassification / Gini / entropy defined and plotted; the Bishop 400/400 counterexample WORKED showing why misclassification fails for growing (zero apparent gain across a genuinely useful split) while Gini/entropy see it; regression trees via RSS and leaf means.
4. Stopping vs pruning: why greedy stopping is myopic (the XOR-ish two-step split example — no single split helps, the pair does); grow-then-prune; cost-complexity C_α(T) with weakest-link pruning derived as the tree's own lasso path in α; α by CV (module 5).
5. What trees buy: mixed features, monotone-invariance (no scaling — feature-engineering's claim proved here), native missing-value routes (surrogate splits one paragraph; xgboost's default directions forward-Ref), and a readable decision path.
6. What they cost: axis-aligned bias (the diagonal-boundary failure — ISLP Fig 8.7 recreated); INSTABILITY — refit on bootstrap resamples and watch the top split flip (worked; Murphy Fig 18.3's remove-one-point version); high variance is the module's exit wound, named for module 7.
7. ★ The categorical-split theorem (ESL §9.2.4): order categories by outcome mean → optimal among 2^{q−1}−1 partitions; short elegant proof sketch.
8. ★ SSBD's MDL bound: err ≤ train err + complexity in tree-description bits — the first appearance of "description length pays for capacity" (module 9 doorstep).

## Set pieces & gems
- The Hitters tree (ISLP): Years<4.5 → $165k, else Hits<117.5 → $403k/$846k — three dollar leaves everyone remembers; use as the regression-tree worked example.
- Bishop Ex 14.11's numeric counterexample — the impurity argument at exam grade.
- Murphy's Fig 18.3 instability — one removed point, different tree.
- R2D3's ball-drop visualization idea — inspiration for the FigureSequence (recreate; do not copy).

## Pitfalls
- Greedy is not optimal (NP-completeness one sentence); do not imply the grown tree is "the best tree".
- Entropy/information-gain: define without information-theory prerequisites (one sentence tying to the entropy formula; the course has no info-theory module).
- Keep ID3/C4.5/CART naming to a one-line genealogy; teach CART.

## FIGURE PLAN
- draw: The triptych — feature-space partition, the tree that encodes it, and the piecewise-constant surface, all for one small dataset with matched colors. Recreation of ESL Fig 9.2. Key image.
- draw: FigureSequence (4 frames): one split chosen — candidate thresholds swept on one feature (impurity-decrease curve tracing), best marked, data partitioned, then the second-level split on one child. The by-hand example animated.
- draw: Impurity functions — misclassification/Gini/entropy vs p on one axis; the Bishop counterexample's two candidate splits placed as points showing zero vs positive gain. Single Figure binding the curves to the argument.
- draw: Pruning path — the full tree with weakest links collapsing as α grows (3 snapshots) over the CV-error-vs-α curve with the chosen α. FigureSequence (3 frames) + inset.
- draw: Axis-aligned bias — diagonal-truth data: tree's staircase boundary vs the linear model's one line; tallies. Recreation of ISLP Fig 8.7's contrast, 2 panels.
- draw: Instability — the same data bootstrap-resampled 3×: three visibly different trees (top split flipping), drawn small side by side; the module-7 promise in the caption. Computed; inspired by Murphy Fig 18.3.

## EXERCISE PLAN
1. Warm-up: compute Gini and entropy for a node with class counts (30, 10); then the weighted impurity decrease of a proposed split.
2. Derivation skipped: prove the leaf constant minimizing RSS is the mean, and the one minimizing misclassification is the majority class (two two-line arguments the lesson uses silently).
3. Boundary probe: a pure node — every impurity is 0 and no split helps; and the XOR configuration — NO single split reduces impurity, yet depth-2 solves it exactly; state what greedy myopia means for stopping rules.
4. Claim to refute: "entropy vs Gini materially changes the tree." Compute both on the by-hand table (same split chosen); state when they CAN differ (rare, near-tie multi-class) — calibrated skepticism, with Bishop's counterexample distinguishing them from misclassification instead.
5. Mixed review (E3): standardize all features and refit the by-hand tree — identical splits (monotone invariance proved by doing); contrast with knn on the same data (feature-engineering + module 1 composed).
6. Research-shaped: on a provided 500-row dataset, grow full trees on 20 bootstrap resamples; report the top-split feature's frequency table — instability quantified (this number feeds bagging's motivation).
7. FORWARD (E7): average the 20 bootstrap trees' predictions on a held-out set and compare test error with the single tree's. Solution: that averaging is bagging, module 7's opener → Ref bagging-random-forests.

## ARC
- Inherits: the local idea with adaptive ambition (kernel-smoothing's flaws); impurity's link to variance-reduction (bias-variance); CV for α (module 5).
- Contributes: the recursive partition — greedy growth, principled pruning, the interpretability/instability trade stated with evidence.
- Hands off: instability quantified and dangling → the spam tree reads a real one; module 7 averages the instability away.
- Spine step: "Giving up the formula…" (step 6).

## REVISION (vs old draft)
- Gains: the by-hand split promoted to a full FigureSequence; Bishop's 400/400 counterexample (draft asserts "misclassification bad for growing" without the proof-grade example); the XOR myopia probe; the instability bootstrap experiment (feeds module 7 quantitatively); SSBD's MDL bound ★ and the categorical-split theorem ★; adaptive-nearest-neighbor framing.
- Loses: interview register; the pros/cons "ledger" bullet turns into the argued buy/cost sections.
- Demo: keep TreeDepthExplorer; add the remove-one-point toggle to the spec (instability made manipulable — D1).
