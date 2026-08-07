# Research brief: svm-max-margin (Maximum margin and the soft-margin SVM)

status: planned
module: svm-kernels
type: core
goal: Formulate the hard- and soft-margin SVM as a quadratic program and interpret C, slack, and the hinge-loss view.

## Sources to consult

- CS229 **§6.1–6.4** — margins intuition (points A/B/C at increasing distance
  = increasing confidence), functional vs geometric margin, the
  normalization to functional margin 1, the optimal-margin QP
  min ½‖w‖² s.t. yᵢ(wᵀxᵢ+b) ≥ 1. The canonical build-up; mirror it.
- CS229 **§6.7** — the outlier gem: one added point swings the hard-margin
  hyperplane dramatically — the motivating flaw for soft margins (recreate).
- Bishop **§7.1** — Fig 7.1 (THE margin diagram: hyperplane, y=±1 margin
  lines, circled support vectors); margin as perpendicular distance; soft
  margin §7.1.1; relation to logistic regression §7.1.2 (loss-curve overlay).
- Cortes & Vapnik 1995 **§2–3** — the original: margin ρ = 2/‖w‖; slack
  variables ξᵢ, the NP-completeness remark for counting errors and σ=1 as
  the tractable choice; C·Σξ objective.
- ESL **§12.1–12.2** (Fig 12.1) — the M = 1/‖w‖ picture and overlap
  handling; **Table 12.1 / §12.3.2** — hinge vs binomial deviance vs squared
  loss and what each estimates.
- CS4780 **Lecture 9** — compact margin derivation; Fig 2's five-panel sweep
  of the boundary as C varies (demo/figure inspiration); the unconstrained
  hinge + L2 formulation.

## Key points the lesson must cover

1. Setup: linearly separable 2D data has infinitely many separating lines;
   which to pick and why the fattest-margin one (generalization intuition +
   the noise-robustness argument). Signed distance computed for a concrete
   line and point first (L4).
2. **Margin geometry**: functional margin y(wᵀx+b); scale freedom; fix the
   closest points to functional margin 1 → geometric margin = 1/‖w‖, full
   margin width 2/‖w‖ — the derivation interviewers ask ("why does
   maximizing the margin mean minimizing ‖w‖?").
3. **Hard-margin QP**: min ½‖w‖² s.t. yᵢ(wᵀxᵢ+b) ≥ 1; convex (spiral to
   gradient-descent's convexity ledger); support vectors named informally as
   the points that touch (formal KKT story deferred to svm-dual-kernels —
   explicit forward pointer).
4. **The flaw → soft margin**: the one-outlier swing; slack ξᵢ ≥ 0 per
   point, objective ½‖w‖² + CΣξᵢ; the three point regimes (outside margin
   ξ=0; inside margin 0<ξ<1; misclassified ξ>1). C as inverse
   regularization: large C ≈ hard margin (low bias, high variance), small C
   wide margin (reinforce bias-variance).
5. **ERM/hinge view**: eliminating ξ gives min Σ max(0, 1−yf(x)) + λ‖w‖² —
   the same problem as loss + regularizer (reinforce the CS4780 lecture-10
   table frame from ridge-lasso). Hinge vs logistic loss plotted: both
   convex surrogates for 0/1; hinge gives sparsity in examples and no
   probabilities; logistic gives probabilities, never exactly zero loss.
6. Practical notes: feature scaling matters (margin is Euclidean — spiral to
   knn-curse's scaling lesson); C tuned by CV (spiral).

## Interview questions to work as exercises

- "Derive why the margin equals 2/‖w‖." (set piece)
- "What is a support vector, geometrically? What happens to the boundary if
  you delete a non-support vector?" (nothing — and why)
- "Explain C. What happens as C→∞ and C→0?" (hard margin / underfit; E3
  link to bias-variance)
- "Write the SVM objective as a loss function + regularizer. Compare hinge
  and logistic loss." (the ERM translation)
- "Why does an SVM not output probabilities? How would you get them?"
  (hinge's flat zero region; Platt scaling pointer to
  classification-metrics' calibration)
- "One mislabeled point sits deep inside the other class. Hard-margin vs
  soft-margin behavior?" (infeasible vs pays slack)

## Pitfalls / subtleties to flag

- C multiplies the SLACK (error term), not the regularizer — so C behaves
  like 1/λ; students flip it constantly. Rose-KeyFact material.
- The functional-margin normalization is a *choice*, not a fact; scale
  freedom is why it is allowed. Spell it out — the derivation collapses
  without it.
- "Support vectors" in the soft-margin case include margin-touching AND
  margin-violating points, not just the touchers.
- Hard-margin SVM is infeasible on non-separable data — the QP has no
  solution at all, not a bad one.
- Do not start the dual here; the lesson's contract is primal + geometry
  only, dual next lesson (keeps L1 single-objective).

## FIGURE PLAN

1. **single `<Figure>`** — many separating lines through the same two-class
   data vs the max-margin choice with the margin band shaded; tally of
   nearest-point distances. One idea: the selection criterion.
2. **single `<Figure>`** — THE margin diagram: hyperplane, dashed y=±1
   lines, support vectors circled, 2/‖w‖ width arrow, w vector normal to
   the plane. Inspiration: Bishop Fig 7.1 / Cortes-Vapnik Fig 2 (recreate).
3. **`<FigureSequence>` (3 frames)** — the margin derivation: (1) signed
   distance formula for a point; (2) scale freedom — same line, w doubled,
   margins relabeled; (3) closest point pinned to 1 → width 2/‖w‖ boxed.
4. **single `<Figure>`** — the outlier swing: hard-margin boundary before
   and after one added point (dramatic rotation), soft-margin boundary
   staying put with the outlier's ξ labeled. Inspiration: CS229 §6.7.
5. **single `<Figure>`** — slack taxonomy: one margin band with three
   annotated points (ξ=0, 0<ξ<1, ξ>1) and their contributions to Σξ.
6. **single `<Figure>`** — loss-curve overlay vs margin yf(x): 0/1, hinge,
   logistic (scaled); flat-at-zero region of hinge highlighted.
   Inspiration: ESL Table 12.1 / Bishop §7.1.2.
7. **single `<Figure>`** — C sweep: three panels (C small/medium/large) of
   the same overlapping data, margin width shrinking and slack count
   falling. Inspiration: CS4780 lec 9 Fig 2 five-panel (compressed to 3).
