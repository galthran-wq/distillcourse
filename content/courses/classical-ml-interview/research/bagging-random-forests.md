# Research brief: bagging-random-forests (Bagging and random forests)

status: planned
module: trees-ensembles
type: core
goal: Explain how bagging reduces variance and why random forests decorrelate trees, using the correlated-average variance formula.

"Why does bagging reduce variance" is on the human's explicit derivation
list; the ρσ² + (1−ρ)σ²/B formula is the lesson's spine.

## Sources to consult

- ESL **ch. 15** (esp. §15.2) — the variance-of-correlated-average formula
  ρσ² + (1−ρ)σ²/B and the reading: B→∞ kills the second term, correlation ρ
  sets the floor; random forests = bagging + per-split feature subsampling
  m ≈ √p to reduce ρ; bias/variance analysis §15.4.
- Breiman 2001 — Definition 1.1; **Theorem 1.2** (more trees never overfit —
  PE* converges a.s.); **Theorem 2.3** PE* ≤ ρ̄(1−s²)/s² (strength vs
  correlation — state, don't prove; one-sentence Chebyshev provenance);
  OOB estimates §3.1; Forest-RI and the small-F story (Figs 1–3: strength
  plateaus while correlation climbs); Table 4 noise robustness (5% label
  noise: AdaBoost +43%, RF +2% — save the full story for adaboost lesson,
  cite here); permutation importance §10 (votes data: variable 4 alone ≈
  full model).
- ISLP **§8.2.1–8.2.2** — accessible layer: bagging, OOB error ≈ LOOCV for
  large B; the dominant-predictor failure of plain bagging (all trees split
  the same top feature → correlated) motivating m=√p; variable importance;
  the gene-expression example (RF m=√p beating m=p).
- CS4780 **Lecture 18** — the WLLN framing; the proof that a bootstrap
  resample is marginally distributed as P (not independent across draws);
  the $300k ± $10k vs ± $50k OOB uncertainty analogy (usable, dry).
- Dietterich 2000 — the three-reasons frame (statistical / computational /
  representational, Fig 2) as the module-level organizer; the 21-voters-at-
  0.3 → 0.026 binomial computation; Fig 4 diagonal-boundary argument.
- ISLP Ex. 5.4.2 / cross-validation-bootstrap lesson — the 0.632/OOB ~1/3
  link (spiral; recap in one sentence).

## Key points the lesson must cover

1. Flaw-first: single trees are high-variance (recap decision-trees'
   instability figure in one sentence). Averaging i.i.d. estimators divides
   variance by B — but our trees are NOT independent: same data.
2. **The formula derived**: Var(mean of B identically distributed,
   pairwise-correlation-ρ variables) = ρσ² + (1−ρ)σ²/B — full derivation
   from the covariance expansion (interview set piece). Read both limits.
   Bias unchanged by averaging (one line). Why deep/unpruned trees: low
   bias, let averaging handle variance.
3. **Bagging**: bootstrap resample → tree → average/vote; Dietterich's
   binomial 21-voter computation as the independence-ideal benchmark; why
   bagging helps unstable learners only (stable learners → identical
   copies, ρ≈1).
4. **Random forests**: the dominant-predictor story → per-split candidate
   set of m features; m=√p (classification) / p/3 (regression) defaults;
   the strength-vs-correlation trade (Breiman Figs 1–3 narrative: small m
   decorrelates faster than it weakens trees); Theorem 2.3 stated as the
   formal version.
5. **OOB error**: each tree misses ~36.8% of points (spiral to the 0.632
   derivation); score each point by trees that never saw it — a free
   test-set estimate ≈ CV; OOB for tuning m.
6. **Variable importance**: Gini/split-gain importance (biased toward
   high-cardinality and correlated features) vs OOB permutation importance;
   the votes-data one-variable story; correlation caveat (importance splits
   across duplicated features).
7. More trees never overfit (Theorem 1.2, intuition: averaging converges,
   doesn't accumulate complexity) — but forests are not immune to
   overfitting via deep trees + tiny leaves on noisy data; RF vs boosting
   positioning (deferred detail to adaboost/gradient-boosting).

## Interview questions to work as exercises

- "Why does bagging reduce variance? Derive it." (the formula set piece)
- "Why do random forests subsample FEATURES if bagging already subsamples
  rows?" (dominant-predictor correlation story + formula's ρ term)
- "What is OOB error and why is it ~free? What fraction is OOB per tree?"
  (0.632 spiral — E3)
- "Does adding more trees overfit a random forest? Why not?" (convergence,
  contrast with boosting iterations)
- "Two importance measures disagree on a high-cardinality categorical.
  Which do you trust?" (bias mechanisms)
- "Random forest vs single tree vs linear model on 200 rows × 10,000
  features — discuss." (variance, m tuning, curse spiral)
- "Why unpruned trees in a forest but pruned when single?" (bias-variance
  division of labor — E3)

## Pitfalls / subtleties to flag

- ρ in the formula is correlation of PREDICTIONS between trees (as random
  functions of the training draw), not feature correlation — the common
  misstatement.
- Bagging reduces variance, ~never bias: it cannot rescue an underfit base
  learner. (Boosting is the bias tool — next lessons.)
- OOB error is honest for the forest but still optimistic if used to tune
  many hyperparameters repeatedly (selection bias spiral).
- "RF can't overfit" is FALSE as stated; only "more trees don't overfit" is
  true. Rose-KeyFact the distinction.
- Feature subsampling happens PER SPLIT, not per tree (common confusion
  with the random-subspace method).

## FIGURE PLAN

1. **single `<Figure>`** — averaging tames the sheaf: 10 single-tree
   boundaries (wild) vs their vote (smooth) on the same 2D data; echoes the
   bias-variance sheaf figure. One idea: variance visibly averaged away.
2. **`<FigureSequence>` (3 frames)** — the variance formula built: (1)
   Var(ΣZ/B) expanded into diagonal + off-diagonal covariance blocks
   (matrix-of-cells drawing); (2) blocks evaluated: B·σ² diagonal,
   B(B−1)·ρσ² off-diagonal; (3) simplified to ρσ² + (1−ρ)σ²/B with both
   limits annotated. House formula-dissection.
3. **single `<Figure>`** — the floor: variance vs B curves for ρ = 0, 0.3,
   0.7 — all flattening at ρσ²; arrow labeled "feature subsampling pushes
   this down". One idea: why B alone is not enough.
4. **single `<Figure>`** — dominant-predictor story: three bagged trees all
   rooted at the same strong feature (correlated) vs three RF trees rooted
   differently under m=√p. One idea: what m randomizes.
5. **single `<Figure>`** — strength vs correlation vs m: two curves (tree
   strength slowly falling, correlation falling faster) with the error-
   minimizing m band marked. Inspiration: Breiman Figs 1–3 (recreate
   schematically).
6. **single `<Figure>`** — OOB mechanics: one data point, the forest split
   into trees that saw it (grayed) and the ~1/3 that didn't (highlighted,
   voting); OOB error definition beside. Ties to the 0.632 spiral.
7. **single `<Figure>`** — importance comparison: bar chart pair
   (impurity-based vs permutation) on a dataset with one high-cardinality
   junk feature that only the impurity version ranks highly.
