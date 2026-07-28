# Research brief: gradient-descent (Gradient descent and convex optimization)

status: planned
module: foundations
type: core
goal: Explain how batch gradient descent, SGD, and Newton's method minimize training loss and when each is appropriate.

## Sources to consult

- CS229 **§1.1** — LMS on the Portland housing data (47 examples); batch GD
  converges to θ0=71.27, θ1=0.1345 (quotable concrete numbers); the
  "GD on a bowl" contour trajectory figure (p.12); SGD variant.
- CS4780 (Weinberger), **Lecture 7 "Gradient Descent (and Beyond)"** — GD
  motivated from the first-order Taylor expansion; learning-rate schedules;
  Adagrad in one paragraph; Newton's method as second-order Taylor with step
  s = −H⁻¹g, including divergence cases; the hybrid GD-then-Newton strategy.
- Murphy **ch. 8** — first/second-order methods, SGD (8.4), constrained
  optimization/Lagrange/KKT (8.5) — cite 8.5 as the forward reference the
  svm-dual-kernels lesson will use.
- Huyen **§5.1.4** — interview-calibration: convexity questions ("show
  cross-entropy/logistic loss is convex"), Jacobian/Hessian definitions.
- Caltech LFD Lecture 9 (logistic regression + GD) for the "why fixed-size
  steps along −∇" framing.

## Key points the lesson must cover

1. The frame: every fit in this course is argmin of a training loss (link back
   to mle-map: loss = negative log-likelihood). ERM in one sentence.
2. Batch GD: update rule, derivation from first-order Taylor (the step that
   decreases the linearization), learning-rate trichotomy — too small (slow),
   right, too large (oscillate/diverge). Concrete run on a 1D quadratic with
   numbers for 3 iterations (L4).
3. SGD and mini-batch: unbiased noisy gradient; per-step cost n× cheaper;
   noise as implicit regularization (one sentence, no mysticism); typical
   schedules (decay). When batch is fine (small n, convex, e.g. IRLS-size
   problems).
4. Newton's method: quadratic model, step −H⁻¹∇; converges in one step on a
   quadratic; O(d²) memory / O(d³) solve cost; why it is used for logistic
   regression (IRLS, d small) but never for large d.
5. Convexity: definition (chords above graph), first/second-order
   characterizations; convex ⇒ local = global; the classical-ML convexity
   ledger: OLS, ridge, lasso, logistic, hinge/SVM convex; k-means, GMM, trees
   not fit by convex optimization.
6. Practical checklist: feature scaling makes contours round (why GD cares —
   ties forward to feature-engineering); monitoring loss curves; gradient
   checking in one line.

## Interview questions to work as exercises

- "What happens if the learning rate is too large? Show it on f(x)=x²."
  (compute the divergent sequence for η > 1)
- "Batch vs stochastic vs mini-batch GD — costs and when each wins."
- "Why isn't Newton's method used for deep nets / large d?" (Hessian cost)
- "Show f(x) = ‖Ax−b‖² is convex; find its minimizer." (bridges to ols)
- "Does gradient descent always converge? To the global minimum?" (convex vs
  non-convex; saddle points one sentence)
- "Why does feature scaling speed up gradient descent?" (condition number,
  zig-zag on elongated contours)

## Pitfalls / subtleties to flag

- GD converges under conditions (convexity + suitable η, e.g. η < 2/L); do
  not state unconditional convergence.
- SGD "noise helps escape local minima" — keep to one careful sentence; the
  claim is empirical folklore in the classical setting.
- Newton can diverge or head to saddle points when H is not PD; mention the
  fix (damping / switching from GD) per CS4780.
- Distinguish non-convex *loss surface* (GMM likelihood) from non-smooth
  convex (lasso |·|) — different remedies (EM vs subgradients/coordinate
  descent, each one sentence with forward refs).

## FIGURE PLAN

1. **`<FigureSequence>` (4 frames)** — GD on elongated 2D contours from a
   fixed start: frames advance 1, 3, 8, 20 steps showing the zig-zag path
   settling into the valley. Delta = trajectory only. Inspiration: CS229 p.12
   contour figure.
2. **single `<Figure>`** — learning-rate trichotomy: three loss-vs-iteration
   curves (too small / right / divergent) with η values labeled. One idea:
   the only hyperparameter that can explode.
3. **single `<Figure>`** — batch vs SGD trajectories on the same contours:
   smooth path vs jittery path arriving in the same basin, with per-step cost
   tally (n gradients vs 1). Comparison panel per house style.
4. **single `<Figure>`** — Newton in one jump: quadratic contours, GD path
   (many steps) vs Newton (one arrow to the center); side label of costs
   O(d) vs O(d³) per step. Inspiration: CS4780 lec 7.
5. **single `<Figure>`** — convexity: a convex curve with a chord above it
   and a non-convex curve with local minimum trap; the classical-loss
   convexity ledger as a two-column list beside it.
6. **single `<Figure>`** — round vs elongated contours after/before feature
   scaling with GD paths on both. One idea: scaling fixes conditioning.
