# Research brief: gradient-boosting (Gradient boosting)

status: planned
module: trees-ensembles
type: core
goal: Derive gradient boosting as gradient descent in function space and explain the roles of shrinkage, tree depth, and subsampling.

## Sources to consult

- Friedman 2001 — the origin: numerical optimization in function space
  (§2, treat the N fitted values F(xᵢ) as parameters); the finite-data
  fix — fit a base learner to the negative-gradient values by least
  squares (Eq 11) + line search (Eq 12) = **Algorithm 1 Gradient_Boost**;
  LS_Boost: squared loss ⇒ pseudo-residual = ordinary residual (§4.1);
  LAD (sign of residual, §4.2); the **TreeBoost per-leaf line search**
  (§4.3, Eq 18); logistic boosting (§4.5); **shrinkage** (§5, Eq 36,
  Fig 1 + Table 1: ν=1 optimal at M=15 err 0.48 vs ν=0.125 at M=146 err
  0.32 — quotable numbers); **tree size = interaction order** (§7,
  min(J−1, n) ANOVA argument, Fig 6); feature importance + partial
  dependence (§8) one paragraph.
- ESL **§10.9–10.12** — Algorithm 10.3 (the version to present); Table
  10.2 (gradients for squared/absolute/Huber/deviance — the lesson's
  table); right-sized trees, shrinkage, subsampling (stochastic gradient
  boosting §10.12.2).
- CS4780 **Lecture 19** — GBRT derivation: argmin_h Σ rᵢh(xᵢ) reduces to
  fitting a regression tree on pseudo-residuals tᵢ = −∂ℓ/∂H(xᵢ); ties
  AnyBoost (from adaboost lesson) to this lesson in one line.
- StatQuest Gradient Boost Parts 1–2 — the average-leaf start + successive
  residual trees on the height/weight toy; the mechanics presentation to
  mirror (dry register); Part 3–4 for classification via log-odds leaves
  (one section's worth).
- Murphy §18.5 for compact modern framing.

## Key points the lesson must cover

1. Flaw-first bridge: AdaBoost is specialized (exponential loss,
   classification); the general recipe should take ANY differentiable
   loss. Function-space view: gradient descent where the "parameter
   vector" is the function's values at the training points.
2. **The derivation**: negative gradient per point; for squared loss
   −∂/∂F ½(y−F)² = y−F — residuals, computed on a concrete 5-point
   example first (L4); the generalization problem (gradient only defined
   at training points) → fit a TREE to the pseudo-residuals; step size by
   line search; per-leaf constants (TreeBoost refinement, one paragraph).
3. **Algorithm box** (ESL 10.3 form): init F₀ = argmin_γ Σ L(yᵢ,γ) (mean /
   log-odds); loop: pseudo-residuals → tree → leaf values → F_m =
   F_{m−1} + ν·tree. Then classification: log-odds accumulation, sigmoid at
   the end, initial F₀ = log(p/(1−p)).
4. **The pseudo-residual table** (ESL Table 10.2): squared → residual;
   absolute → sign(residual); Huber → clipped; deviance → y − p (the
   beautiful reappearance of logistic-regression's gradient — spiral
   callout).
5. **The knobs and their couplings**: shrinkage ν (small ν + big M beats
   big ν — Friedman's Table 1 numbers); tree depth = max interaction order
   (the ANOVA argument, why depth 3–6); row subsampling (stochastic GB);
   early stopping on validation (spiral to cross-validation-bootstrap).
   Unlike RF, more iterations DO overfit — the structural contrast.
6. GBM vs RF closing comparison: sequential-bias vs parallel-variance;
   shallow vs deep trees; sensitive vs robust hyperparameters; both get
   feature importance/PDP (one sentence, pointer).

## Interview questions to work as exercises

- "Why is gradient boosting called 'gradient' boosting? Derive the
  connection for squared loss." (set piece)
- "Walk through 3 iterations of gradient boosting on this 5-point 1D
  dataset with stumps and ν=0.5." (hand mechanics with numbers)
- "What is a pseudo-residual for log-loss? Show it equals y − p."
  (E3 spiral to logistic-regression's gradient)
- "Learning rate 0.01 vs 0.3 — trade-offs? What do you co-tune?" (M;
  the ν–M frontier)
- "Why shallow trees in boosting but deep trees in random forests?"
  (bias/variance division + interaction-order argument — E3)
- "How does gradient boosting produce probabilities?" (log-odds leaves,
  sigmoid)
- "Your GBM's validation error rises after iteration 300. What do you
  do?" (early stopping; contrast with RF's immunity)

## Pitfalls / subtleties to flag

- The tree is fit to pseudo-residuals by SQUARED error regardless of the
  outer loss — the outer loss enters via pseudo-residuals + leaf values.
  Subtle and asked.
- Residual-fitting is EXACT only for squared loss; do not present "fit
  residuals" as the general algorithm — the general object is the
  negative gradient.
- Line search per leaf (TreeBoost) vs single multiplier — mention once;
  libraries do per-leaf Newton steps (bridge to xgboost).
- ν interacts with M; quoting a good ν without M is meaningless.
- Initialization matters for asymmetric losses (median for LAD, log-odds
  prior for classification) — hand-wavers get caught here.

## FIGURE PLAN

1. **`<FigureSequence>` (5 frames)** — boosting a 1D regression: (1) data
   + flat F₀ = mean; (2) residuals panel below, first stump fit to them;
   (3) F₁ = F₀ + ν·stump, residuals shrink; (4) after 10 rounds; (5)
   after 100 — fit hugging the curve, residuals ≈ noise. Two-panel frames
   (fit above, residuals below); delta = one boosting stage. Matches the
   demo. Inspiration: StatQuest GB Part 1 / Friedman LS_Boost.
2. **single `<Figure>`** — the function-space analogy: parameter-space GD
   (θ ← θ − η∇) beside function-space GD (F ← F + ν·tree≈−gradient),
   term-by-term color binding. One idea: same update, different space.
   Spiral of the gradient-descent lesson's imagery.
3. **single `<Figure>`** — the pseudo-residual table rendered: four losses,
   their −∂L/∂F, and a thumbnail of each gradient's shape vs residual
   (linear / sign / clipped / y−p). Inspiration: ESL Table 10.2.
4. **single `<Figure>`** — the ν–M frontier: test error vs M curves for
   ν = 1, 0.25, 0.125 — small-ν curves lower and later minima, with
   Friedman's Table 1 numbers as annotations. Inspiration: Friedman Fig 1.
5. **single `<Figure>`** — depth = interaction order: depth-1 stumps can
   only add per-feature effects (additive surface) vs depth-3 capturing a
   two-feature interaction (warped surface); tally "J−1 ≥ interaction
   order needed". Inspiration: Friedman §7.
6. **single `<Figure>`** — GBM vs RF card: two pipelines (sequential
   residual-chasing vs parallel bootstrap-vote) with the axis table
   (bias/variance, depth, overfit-with-size, tuning difficulty).
