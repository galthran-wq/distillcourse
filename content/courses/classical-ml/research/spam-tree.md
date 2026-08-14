# A classification tree for spam — research brief

Lesson: `spam-tree` (module: local-models, core, planned). NEW — module 6's APPLICATION lesson (L16).
Goal: Grow, prune, and read a CART tree on the spam corpus and evaluate it against the module's smoothers and the linear baselines.

## Sources
- ESL §9.2.5 (the spam tree: grown, cost-complexity pruned to 17 leaves, 9.3% test error; Fig 9.5 — the full tree with split rules and per-node counts; the discussion of which splits matter).
- ESL §9.1.2 (additive logistic regression on spam: 5.3% — the GAM rung of the ladder; the partial-plot reading).
- spam-filter lesson (internal): the corpus, the linear baselines (~7%), the leakage audit — all inherited.
- decision-trees (internal): every tool used here.

## Key points (APPLICATION spec)
- The artifact: ESL's published spam tree — a real pruned CART model on the course benchmark, read line by line.
- Module results used: greedy growth + impurity (decision-trees), cost-complexity pruning with CV-chosen α (decision-trees + module 5), the smoother/GAM comparison rung (kernel-smoothing/splines-gams via ESL §9.1.2), tree instability measured on the corpus itself.
- Where the idealization departs: 0–1 error hides asymmetric mail costs (module 5's point, applied); the tree's readability invites over-trust — the audit shows split thresholds move under resampling; leakage features ('george') sit right in the tree's upper splits, making the interpretability double-edged.
1. Grow and prune on our split: the α-path, CV curve, chosen subtree (~15–20 leaves; compare with ESL's 17); test error reported with SE (~9%).
2. READ the tree: the top splits ('$' frequency, 'remove', '!', 'hp', capital-run-length); trace two real messages down their paths aloud — the auditable-decision property demonstrated, not asserted.
3. The ladder updated with honest placement: linear ~7% / GAM 5.3% / tree 9.3% — the tree LOSES on accuracy while winning on readability and robustness-to-junk-features; why (axis-aligned bias + variance; additive structure fits this corpus well).
4. Instability audit on real data: refit on 10 bootstrap resamples; tabulate top-split identity and the test-error spread; the module's exit wound now measured on the benchmark (this exact table is module 7's opening evidence).
5. The interpretability caveat: 'george' near the root — an auditable model faithfully displaying a leaked feature; auditability finds bugs, it does not prevent them (ties to module 5's audit discipline).

## Set pieces & gems
- ESL Fig 9.5's 17-leaf tree — recreate OUR fitted tree in its style (drawing theirs verbatim adds nothing; fitting our own is the reproduction).
- The two-message trace — one obvious spam, one borderline ham walked down the tree.
- The ladder table gaining its module-6 rungs.

## Pitfalls
- No new theory; the lesson is fit → read → compare → audit.
- Our numbers vs ESL's numbers labeled separately (different splits); agreement within ~1% expected.
- The GAM rung: do not re-teach GAMs — one recap sentence + Ref splines-gams; report the 5.3% as ESL's.

## FIGURE PLAN
- draw: OUR pruned spam tree (~15 leaves) drawn in house style: split rules on edges, spam-fraction bars in nodes, the two traced message paths highlighted amber/blue. Key image; recreation of ESL Fig 9.5's genre.
- draw: The α-path and CV curve — subtree size vs α with the CV-error curve and one-SE choice; two aligned panels. Module-5 machinery visibly at work.
- draw: The ladder — the benchmark error ladder as of module 6: linear ~7 / GAM 5.3 / tree 9.3 (+ the module-7 rungs grayed out as "next"). Single Figure, updated per module (course-level visual thread).
- draw: Instability table as a figure — 10 bootstrap refits: top-split feature frequency + test-error strip plot; caption hands off to module 7. Computed.
- source: avisual-preview-tree — stem `r2d3-balldrop`, reader must see R2D3's ball-drop tree render (points falling through forks into leaves) as the genre's most famous visualization of exactly this object; placement: float right in the read-the-tree section, credited as the visualization that popularized tree-reading.

## EXERCISE PLAN
1. Warm-up: trace a given feature vector down the drawn tree; report the leaf's spam fraction and the decision at threshold 0.5.
2. Boundary probe: prune with α = 0 and α → ∞ — reproduce the full tree and the root stump; compute the stump's error from the corpus base rate and one split.
3. Claim to refute: "the tree is worse than logistic (9.3 vs 7), so trees are the wrong tool for text-frequency data." Partially concede, then refute the generalization: show the tree beats logistic on a feature-subset with strong interactions (constructed from the corpus's capitals×'$' interaction); name what decides it (additive vs interaction structure).
4. Research-shaped: rerun the fit at 5 seeds/splits; report the test-error spread and whether the 17-leaf size is stable; compare with ESL's single published number — what a point estimate hides.
5. Mixed review (E3): using module 5's cost machinery, re-threshold the tree's leaf probabilities for 10:1 false-positive cost and recompute the confusion matrix — the tree as a probability model, not just a labeler.
6. FORWARD (E7): average the 10 bootstrap trees' leaf probabilities and report the test error vs the single tree's. Solution: this IS bagging, and its variance arithmetic opens module 7 → Ref bagging-random-forests.

## ARC
- Inherits: the corpus and its baselines (spam-filter), the full tree toolkit (decision-trees), pruning-by-CV (module 5), the GAM rung (splines-gams).
- Contributes: module 6 cashed out — a real tree grown, read, priced against the ladder, and audited for the instability that motivates ensembles.
- Hands off: the measured instability and the 9.3% rung — module 7's raw material.
- Spine step: "Giving up the formula…" (step 6, closing move).
