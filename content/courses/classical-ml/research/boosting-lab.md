# Lab: gradient boosting from scratch — research brief

Lesson: `boosting-lab` (module: ensembles, type: lab, planned). NEW.
Goal: Build a working gradient-boosting machine in numpy — regression stumps, residual fitting, shrinkage, logistic boosting, an AdaBoost round — and match sklearn's GBM on a real dataset.

## ARC
- Inherits: the stump/split machinery (decision-trees), the function-space loop and its dials (gradient-boosting), the AdaBoost round arithmetic (adaboost), XGBoost's g/h view (xgboost, for the optional Newton-step checkpoint), honest evaluation (validation-lab's pattern).
- Contributes: the module's central algorithm as verified code; the ν–M trade measured on the learner's own machine; the AdaBoost round they hand-computed now executing.
- Hands off: the staged-predictions machinery that bounds-vs-practice reuses for margin curves; the model whose test-vs-train curves reappear in module 9.
- Spine step: "The ensemble resolution…" (step 7, final item).

## LAB PLAN

Artifact: one notebook building `boost.py`-style tooling — an exhaustive-search regression stump, a least-squares boosting loop with shrinkage and staged predictions, a binomial-deviance booster, and one AdaBoost round — culminating in a held-out deviance target on a real tabular dataset.

CANON GROUNDING: modelled on ISLP Lab 8.3 "Tree-Based Methods" and ISLP Ch. 8's applied exercises (dossier: "build and prune regression trees …, then bagging/random forest/boosting … comparing test error"; Ex. 12's open-ended "apply boosting, bagging, random forests…"), with the library internals ISLP delegates to sklearn hand-built per ESL Algorithm 10.3 / Friedman's Algorithm 2 (LS_Boost) — the depth mandate again. Departures: BART is dropped (not in the course); the tree grower is capped at stumps/depth-2 (the boosting LOOP is the lesson; deep tree-growing was module 6's terrain and full CART implementation would blow the hour budget); an AdaBoost-round checkpoint is added because the by-hand table from the adaboost lesson deserves an executable referee.

Dataset: California-housing subsample for regression checkpoints (public, sklearn-bundled; ship a 5,000-row extract ~300 KB) and the spam corpus extract (from earlier lessons' data) for the classification half. Held-out targets in private/.

Checkpoints (plan; lab-author may split/deepen):
1. `stump-fit` (exact): best (feature, threshold, left/right means) by RSS via sorted exhaustive scan. Warm-up-grade single function.
2. `stump-predict` — folded into 1's verification (not a separate checkpoint).
3. `boost-ls` (exact): the loop — f₀ = mean; fit stump to residuals; f += ν·stump; M rounds. Consumes: 1.
4. `staged-predict` (exact): per-round predictions on a matrix (no refitting). Consumes: 3.
5. `shrinkage-curves` (exact): held-out error vs rounds at ν ∈ {1.0, 0.1}; asserts ν=0.1's minimum ≤ ν=1.0's (Friedman's finding reproduced). Consumes: 4.
6. `logit-boost` (exact): deviance gradient (y−p), probability output via sigmoid of the additive score, deviance history decreasing. Consumes: 1, 3's pattern.
7. `adaboost-round` (exact): one round on the 10-point lesson dataset — weighted error, α, new weights matching the lesson's hand table exactly. Independent (referees the adaboost lesson).
8. `newton-leaf` (exact, optional): replace leaf constants with −G/(H+λ) using g/h from logistic loss (XGBoost's step inside the learner's own booster). Consumes: 6.
9. `why-small-nu` (review, optional): the learner's own account of the ν–M trade, graded against the rubric (path-of-optimization argument accepted; "smaller steps = less overfitting" alone insufficient).
10. `beat-benchmark` (metric, optional, LAST): beat the held-out spam deviance threshold with any configuration of their booster (threshold calibrated so depth-2, ν=0.1, early-stopped clears it with ≥0.02 margin; stumps at ν=1 do not).

Known-wrong variants: residuals recomputed against f₀ instead of the current f (no accumulation); shrinkage applied to the residuals instead of the update; stump scan comparing unsorted thresholds (O(n²) AND off-by-one at ties); (p−y) sign flip in logit-boost; AdaBoost weights renormalized before computing ε.

NOT blanked: data loading, the sigmoid/deviance helpers from logreg-lab (imported complete), plotting (staged-error curves), the 10-point AdaBoost table.

est_hours: 4.5. Progression: warm-up (1) → composing chain (3 → 4 → 5; 6 → 8) + independent referee (7) → one open metric last (10, optional) → review garnish (9). Required: 1, 3, 4, 5, 6, 7.
