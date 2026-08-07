# Research brief: pca (Principal component analysis)

status: planned
module: unsupervised
type: core
goal: Derive PCA as variance maximization solved by the covariance eigendecomposition and apply it correctly — centering, scaling, choosing components.

"Derive PCA in matrix form" (Airbnb, per Ace) is on the explicit derivation
list. Two derivations exist (max variance / min reconstruction); do the
first in full, the second as a stated equivalence.

## Sources to consult

- CS229 **ch. 12** — the Lagrange derivation: maximize uᵀΣu s.t. uᵀu=1 →
  Σu = λu → top eigenvector; top-k subspace statement; the mph/kph
  redundant-feature and RC-helicopter (skill vs enjoyment) motivating
  examples; pre-normalization steps.
- ESL **§14.5.1** — PCA via SVD: X = UDVᵀ, principal components = V, scores
  = UD; best rank-q affine approximation (min reconstruction error,
  Eqs 14.49–14.55); the **handwritten '3's gem**: 130 threes, first two
  components = "lower-tail lengthening" and "thickness", ~50/256
  components for 90% variance.
- Bishop **§12.1** — both formulations (max variance §12.1.1, min error
  §12.1.2) proved equivalent; sequential extraction of further components.
- Setosa "PCA Explained Visually" — the interaction grammar for the demo
  (draggable 2D cloud with live axes; 3D best-camera-angle analogy) and the
  **'Eating in the UK' gem**: 17-dim food-consumption table, PC1/PC2
  scatter isolating Northern Ireland — recreate as the applied case study.
- StatQuest "PCA Step-by-Step" — scree plots, % variance explained, the
  eigenvector-as-recipe framing (calibration for practical-tips section).
- ISLP **§6.3** (PCR) and **§12.1** — PCA before regression; biplots
  one-liner; the scaling-changes-components USArrests-style point.
- ridge-lasso lesson — the SVD-shrinkage figure to reprise: ridge shrinks
  exactly along principal directions (spiral).

## Key points the lesson must cover

1. Motivation: correlated/redundant features (mph-kph example); compression
   and visualization; curse spiral (knn-curse Ref).
2. Setup discipline: CENTER the data (PCA is about directions through the
   mean); the covariance matrix Σ̂ = XᵀX/n on centered X. A 2D numeric
   example: compute Σ̂ for ~6 points, get eigenvectors, draw them (L4).
3. **The derivation in full**: projected variance = uᵀΣu; Lagrangian for
   the unit constraint; ∇ = 0 → Σu = λu; the maximizer is the TOP
   eigenvector and the achieved variance IS λ (u ᵀΣu = λ) — every step.
   Then components 2..k by orthogonality (stated with the deflation/
   Rayleigh argument in one paragraph).
4. **Equivalent views**: min reconstruction error (state equivalence,
   Pythagoras picture: variance kept + error = total); SVD route (why
   practice uses SVD of X, not eig of Σ̂ — conditioning, no explicit Σ̂);
   scores/loadings vocabulary.
5. **Using it**: explained-variance ratio λ_j/Σλ; scree plot + cumulative
   90-95% conventions; scale features when units differ (variance is
   unit-sensitive — the one-feature-in-grams-vs-kg example); whitening one
   sentence; PCR pointer; PCA as preprocessing for k-NN/k-means (spirals).
6. **Limitations + contrasts**: linear only (kernel PCA one sentence);
   max-variance directions need not be class-discriminative — the PCA vs
   LDA (Fisher) contrast picture (spiral to lda-gda); components are
   mixtures — interpretability loss; variance ≠ importance for a
   downstream label. t-SNE contrast deferred to next lesson (pointer).

## Interview questions to work as exercises

- "Derive PCA: show the max-variance direction is the top eigenvector of
  the covariance matrix." (the set piece — Airbnb phrasing)
- "Compute the principal components of this 2×2 covariance matrix by
  hand." (eigen decomposition numerics)
- "Why center before PCA? What happens if you don't?" (first component
  chases the mean offset)
- "When do you standardize before PCA, and when not?" (units differ vs
  meaningful shared units; components change — not a cosmetic choice)
- "How many components do you keep?" (scree/variance thresholds/CV on the
  downstream task — E3 spiral to cross-validation-bootstrap)
- "PCA vs LDA for reducing dimensions before classification?" (E3 spiral;
  unsupervised variance vs supervised separation, the crossed-clouds
  counterexample)
- "Is PCA affected by outliers? What would you do?" (variance is —
  robust PCA one-liner)
- "Your teammate runs PCA on one-hot categorical data and reports elegant
  clusters. Concerns?" (distances/variance on dummies; scaling; honest
  caveat discussion)

## Pitfalls / subtleties to flag

- Eigenvector SIGNS (and rotations within tied eigenvalues) are arbitrary
  — "my PC1 points the other way" is not a bug; same as Huffman-tree
  non-uniqueness genre.
- PCA ≠ feature selection: components mix ALL original features; sparse
  PCA one-liner if interpretability is demanded.
- Correlation-matrix PCA ≡ covariance-matrix PCA on standardized data —
  the vocabulary interviewers use interchangeably; say it once.
- The 90% variance convention is a heuristic, not a theorem; tie choice to
  the downstream task when one exists.
- SVD of the DATA vs eigendecomposition of the COVARIANCE: relation
  λ_j = d_j²/n; students double-count the 1/n.

## FIGURE PLAN

1. **single `<Figure>`** — the 2D cloud with PC1/PC2 axes drawn at the
   mean, axis lengths ∝ √λ; the same cloud's projections onto PC1 vs onto
   x-axis compared with variance tallies. Inspiration: Setosa's 2D widget
   (static recreation); matches the demo.
2. **`<FigureSequence>` (4 frames)** — the derivation staged: (1) the
   projection variance uᵀΣu with u on the unit circle; (2) Lagrangian
   assembled, constraint color-bound; (3) gradient → Σu = λu boxed; (4)
   read λ as the variance achieved, eigenvalue ordering. House
   formula-dissection. Inspiration: CS229 ch. 12.
3. **single `<Figure>`** — Pythagoras of PCA: a point, its projection on
   the PC line, the orthogonal residual; total = kept + lost variance bar
   beneath. One idea: max variance ⇔ min reconstruction error.
   Inspiration: Bishop §12.1.2.
4. **single `<Figure>`** — scree + cumulative curve for an 8-feature
   example with the elbow and the 90% line both marked; caption on
   convention vs theorem.
5. **single `<Figure>`** — scaling changes the answer: same two-feature
   data (one feature ×1000 units) with PCA axes before vs after
   standardization — PC1 hijacked by the big-unit feature. One idea:
   variance is unit-bound.
6. **single `<Figure>`** — PCA vs LDA: two elongated class clouds where
   max-variance direction is USELESS for separation and Fisher's direction
   is orthogonal to it; 1D projections histogrammed under each. Spiral of
   lda-gda's Fisher figure with the PCA axis added.
7. **single `<Figure>`** — the UK-food case recreated schematically:
   17-dim table → PC1 strip plot (three countries bunched, one apart) →
   PC1/PC2 scatter isolating the outlier; caption tells the
   Northern-Ireland story. Inspiration: Setosa's 17D example.
