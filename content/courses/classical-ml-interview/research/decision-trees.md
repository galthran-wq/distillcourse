# Research brief: decision-trees (Decision trees)

status: planned
module: trees-ensembles
type: core
goal: Construct classification and regression trees by greedy impurity minimization and prune them with cost-complexity pruning.

## Sources to consult

- ISLP **§8.1** — the spine: the Hitters regression tree (Years<4.5,
  Hits<117.5, salaries $165k/$403k/$845k — the field's canonical first tree),
  recursive binary splitting on RSS (Eqs 8.1–8.3), cost-complexity pruning
  (Eq 8.4, **Algorithm 8.1**: grow → prune sequence → pick α by CV,
  Figs 8.4–8.5 selecting a 3-node tree), classification trees with
  Gini/entropy (Eqs 8.6–8.7), the Heart-data point that a split can improve
  purity without reducing classification error, trees-vs-linear-models
  (Fig 8.7 idea), pros/cons list (§8.1.4).
- CS4780 **Lecture 17** — Gini impurity; entropy DERIVED as KL-to-uniform
  (nice depth touch, keep to an Aside); ID3; the XOR example (no single
  split helps — greedy's blind spot); tree-depth-vs-train/test overfit
  curve; parametric-vs-non-parametric placement.
- ESL **§9.2** — CART formalism: why exact impurity vs misclassification
  error for GROWING (differentiability/sensitivity) but error is fine for
  pruning; surrogate splits for missing values one-liner; categorical
  predictor 2^(q−1)−1 subset trick one-liner.
- StatQuest "Decision and Classification Trees" — the hand-buildable toy
  dataset pattern (popcorn/soda/age → loves 'Cool as Ice'): compute Gini for
  each candidate root split, pick the best, recurse. Recreate structure with
  a neutral dataset (dry register).
- Murphy §18.1 for a compact modern statement.

## Key points the lesson must cover

1. The model: axis-aligned recursive partition; tree ⇄ rectangles duality
   (draw both); prediction = leaf majority/mean.
2. **A split chosen fully by hand** (L4): small table (~10 rows, 2–3
   features), compute Gini for every candidate split of every feature,
   weighted child average, pick argmax reduction. This is the interview
   mechanics question.
3. Impurity zoo: Gini Σp(1−p), entropy −Σp log p, misclassification error;
   Gini/entropy nearly indistinguishable in practice (say so — interviewers
   ask "which and why"; the honest answer is "differentiable/sensitive, and
   it rarely matters"); why misclassification error is bad for growing
   (insensitive: the ISLP purity-without-error-change example).
4. Regression trees: RSS objective, leaf = mean; greedy exact search over
   split points; the Hitters-style worked example.
5. **Overfitting and pruning**: fully grown trees memorize; early stopping
   (max depth/min leaf) vs grow-then-prune; cost-complexity
   C_α(T) = error + α|T| — "the tree's lasso" (spiral to ridge-lasso's
   penalty framing); α by CV (spiral to cross-validation-bootstrap).
6. The ledger (feeds ensembles): interpretable, mixed features, no scaling,
   monotone-transform invariant, native missing handling vs high variance
   (small data changes → different tree), axis-aligned bias (diagonal
   boundaries need staircases), greedy myopia (XOR), weak accuracy alone —
   the stated flaw the next three lessons fix (playbook flaw-driven
   sequencing).

## Interview questions to work as exercises

- "Given this table, build the first two levels of a decision tree by hand
  with Gini." (the mechanics set piece)
- "Gini vs entropy — formulas, ranges, when they differ?" (compute both on
  p = (0.5,0.5) and (0.9,0.1))
- "Why not use classification error to grow trees?" (the worked
  purity-vs-error example)
- "How do trees handle categorical features and missing values?" (subset
  splits, surrogates/default directions — forward echo of xgboost)
- "Why are single trees high-variance? Show what a one-point change does."
  (E3 spaced link to bias-variance; sets up bagging)
- "Does feature scaling affect decision trees?" (no — splits are order-based;
  contrast with k-NN/SVM, spaced link)
- "When would a decision tree beat logistic regression?" (interactions,
  nonlinearity, mixed types; and the reverse case)

## Pitfalls / subtleties to flag

- Trees are UNSTABLE, not "always overfit": a depth-limited tree can also
  underfit badly (bias); both failure directions exist.
- Information gain favors high-cardinality categoricals (ID-like features
  get spurious purity) — gain-ratio one-liner; feeds the variable-importance
  bias discussion in bagging-random-forests.
- Greedy ≠ optimal: XOR example; optimal tree construction is NP-hard (one
  sentence).
- Categorical splits with many levels: 2^(q−1)−1 subsets — exponential;
  practical orderings exist for binary outcomes (one-liner).
- Pruning selects a NESTED sequence indexed by α — students think every
  subtree is a candidate.

## FIGURE PLAN

1. **single `<Figure>`** — tree ⇄ partition duality: the same 2-split model
   drawn as a tree (left) and as nested rectangles in feature space (right),
   colors binding leaf ↔ region. Inspiration: ISLP Figs 8.1–8.3.
2. **`<FigureSequence>` (4 frames)** — the hand-built split: (1) the data
   table and candidate splits listed; (2) Gini computed for split A (numbers
   visible); (3) Gini for split B, comparison tally; (4) winner applied, the
   two child nodes formed and the recursion arrow. Inspiration: StatQuest
   hand computation, house style.
3. **single `<Figure>`** — impurity curves for binary p: Gini, entropy
   (scaled), misclassification error on one axes; the flat-top of error
   highlighted as its growing weakness. Inspiration: ESL Fig 9.3 idea.
4. **single `<Figure>`** — the purity-without-error example: a split whose
   children keep the same majority label (error unchanged) but purer
   distributions, with both metrics tallied. Inspiration: ISLP Heart
   discussion.
5. **single `<Figure>`** — overfit curve: train/test error vs tree depth
   with the CV-chosen depth marked; alongside a pruned-vs-full tree pair.
   Inspiration: ISLP Figs 8.4–8.5 / CS4780 lec 17.
6. **single `<Figure>`** — instability: two trees grown on the same data
   ± one point, visibly different structures, similar accuracy. One idea:
   variance in model space — the ensemble motivation.
7. **single `<Figure>`** — axis-aligned bias: diagonal true boundary
   approximated by a staircase partition; caption points at ensembles
   smoothing this (Dietterich Fig 4 echo, used again next lesson).
