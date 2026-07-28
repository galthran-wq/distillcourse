# Research brief: ridge-lasso (Ridge and lasso regularization)

status: planned
module: linear-regression
type: core
goal: Explain why the L1 penalty produces exact zeros while L2 only shrinks, using constraint geometry, soft thresholding, and Bayesian priors.

"Why does L1 sparsify?" has three canonical answers; the lesson must give all
three (geometry, soft-thresholding algebra, Laplace prior) — interviewers
accept any one but the strong candidate has all.

## Sources to consult

- ESL **§3.4.1** — ridge: penalized RSS, closed form (XᵀX+λI)⁻¹Xᵀy, the SVD
  view (shrink component j by d_j²/(d_j²+λ), low-variance directions most),
  Bayesian posterior-mode reading, effective df(λ) = Σ d_j²/(d_j²+λ).
- ESL **§3.4.2–3.4.3** — lasso; the orthonormal-case comparison **Table 3.4**:
  best subset = hard threshold, ridge = proportional shrink, lasso = soft
  threshold sign(β̂)(|β̂|−λ)₊; **Fig 3.11** diamond-vs-disk (the figure to
  recreate); coefficient-path Figs 3.8/3.10 on the prostate data.
- ISLP **§6.2** — accessible restatement; constraint form (Eqs 6.8–6.9);
  Credit-data coefficient paths (Figs 6.4/6.6); Fig 6.7 (their redraw of the
  diamond/disk); the explicit "ridge has a solution even when p>n" point;
  §6.2.3 choosing λ by CV.
- Murphy **§11.3–11.4** — MAP readings (Gaussian → ridge, Laplace → lasso),
  elastic net, coordinate descent one-liner.
- CS4780 **Lecture 10** — the ERM table mapping OLS/ridge/lasso/elastic-net
  onto loss+regularizer; use as the lesson's framing device.
- StatQuest "Regularization Part 1" gem — the two-point overfit demo: a line
  through 2 training points has SSR=0 but explodes on test points; a small
  ridge penalty fixes it. Recreate as the motivating example (dry register).

## Key points the lesson must cover

1. Motivation (flaw-first): OLS variance blows up under collinearity/p≈n —
   recap from ols; the two-point demo as the concrete opener (L4).
2. **Ridge**: objective, closed form derived (two-line extension of the OLS
   derivation), XᵀX+λI always invertible (fixes p>n), bias↑ variance↓ with λ
   (spiral to bias-variance). SVD shrinkage view with the d_j²/(d_j²+λ)
   factors — also pre-seeds the PCA connection (reinforced in pca lesson).
3. **Lasso**: objective; no closed form in general; the orthonormal case
   solved fully → soft thresholding derived with the case analysis (the
   algebraic "why zeros" answer). Table 3.4's three-way comparison.
4. **The geometry**: RSS ellipses meeting the L1 diamond at corners vs the L2
   disk tangentially — the picture-proof of sparsity. State clearly it is the
   constrained (equivalent) formulation being drawn.
5. **Bayesian**: Gaussian prior → ridge, Laplace prior → lasso (cash in the
   mle-map bridge); Laplace's point mass of density at 0 intuition.
6. Practice: standardize features first (penalty is scale-sensitive; don't
   penalize the intercept); λ by cross-validation (forward ref); elastic net
   for correlated groups (lasso picks one arbitrarily — the flaw, EN the fix);
   coefficient paths as the diagnostic picture.

## Interview questions to work as exercises

- "L1 vs L2 regularization — differences and when to use which?" (Uber, per
  Ace ch. 7; the full three-argument answer)
- "Why does lasso produce exactly zero coefficients?" (reader reproduces one
  of the three arguments in full, others sketched)
- "Derive the ridge closed form. Why is XᵀX+λI always invertible?"
  (eigenvalues shift by λ)
- "What happens to bias and variance as λ→0 and λ→∞?" (OLS limit; null model
  — E3 spaced link to bias-variance)
- "Derive soft thresholding for a single-feature/orthonormal lasso."
- "Two features are highly correlated. What do ridge and lasso each do?"
  (ridge splits weight; lasso picks one arbitrarily; elastic net)
- "Why standardize before regularizing?"

## Pitfalls / subtleties to flag

- The penalized and constrained forms are equivalent (λ ↔ t correspondence)
  but the diamond picture is drawn in constrained form — students conflate.
- Soft-thresholding formula holds in the orthonormal/uncorrelated design; the
  general lasso needs coordinate descent/LARS — one sentence, no algorithm.
- Ridge is NOT scale-invariant; forgetting standardization silently reweights
  the penalty.
- Lasso instability under correlated features is a feature-selection caveat
  (feeds feature-engineering lesson).
- MAP-lasso: the Laplace prior gives the lasso as posterior MODE; the
  posterior mean is not sparse — one Remark for the probing interviewer.

## FIGURE PLAN

1. **single `<Figure>`** — the two-point overfit demo: 2 train points, exact
   line, scattered test points with large errors; ridge-shrunk line beside it
   with error tallies. Inspiration: StatQuest regularization pt 1.
2. **single `<Figure>`** — THE diamond vs disk: two panels, RSS contour
   ellipses touching the L1 diamond at a corner (β1=0 labeled) and the L2
   disk off-axis. Inspiration: ESL Fig 3.11 / ISLP Fig 6.7 (recreate).
3. **`<FigureSequence>` (3 frames)** — soft thresholding built: (1) OLS
   estimate on the axis; (2) shift toward zero by λ; (3) clip at zero — the
   S-curve of β̂_lasso vs β̂_OLS emerging, with the hard-threshold and
   proportional-shrink curves joining in frame 3 as the Table 3.4 trio.
4. **single `<Figure>`** — coefficient paths: ridge panel (all → 0 smoothly)
   vs lasso panel (hit exactly 0 one at a time) vs λ. Matches the demo.
   Inspiration: ISLP Figs 6.4/6.6 (Credit data).
5. **single `<Figure>`** — SVD shrinkage: principal directions of X with
   shrink factors d²/(d²+λ) annotated per direction; low-variance direction
   shrunk hardest. Inspiration: ESL §3.4.1; reused when pca lands.
6. **single `<Figure>`** — priors panel: Gaussian vs Laplace density over a
   coefficient, the Laplace spike at 0; labels "−log prior = λ‖β‖²/λ‖β‖₁".
   Reinforces the mle-map bridge figure.
