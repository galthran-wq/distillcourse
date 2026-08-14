# Principal component analysis — research brief

Lesson: `pca` (module: unsupervised, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/pca/lesson.mdx (28 min).
Goal: Derive PCA as variance maximization solved by the covariance eigendecomposition and apply it correctly — centering, scaling, choosing components.

## Sources
- CS229 Ch. 12 (variance-maximization derivation via Lagrange — the clean route; eigenfaces application).
- Murphy §20.1 (reconstruction-error view proved equivalent; PCA-via-SVD; the d≫n Gram trick; why held-out reconstruction error cannot choose L §20.1.4 — with the profile-likelihood/scree alternatives; MNIST-9 and Olivetti examples — images captured).
- ESL §14.5.1 (SVD X=UDVᵀ as best rank-q approximation; Fig 14.21-22 digit-3 study — image captured), §3.4.1 (ridge-PCA link — reinforce).
- Bishop §12.1 (max-variance and min-error both derived; the sequential/induction argument).
- SSBD §23.1 (Theorem 23.2 — the compact optimality proof; Yale-faces figure captured).

## Key points
1. The derivation, twice, proved equivalent: (a) max variance — maximize uᵀSu s.t. ‖u‖=1 → Lagrange → Su = λu, top eigenvector; the induction for subsequent components (deflation/orthogonality constraint carried honestly); (b) min reconstruction error — the same subspace (Pythagoras split: total = retained + lost). Both full.
2. SVD as the computational truth: X = UDVᵀ; principal directions = right singular vectors; eigenvalues = d_j²/n; why code must never form XᵀX (conditioning); the d≫n Gram-trick (n×n eigenproblem) — the eigenfaces enabler.
3. Explained variance and choosing q: scree/elbow honestly; the theorem-grade warning (Murphy §20.1.4): HELD-OUT reconstruction error still decreases monotonically in q — unlike supervised validation; what does work (profile likelihood, downstream task performance).
4. Real-image anatomy: eigenfaces (Olivetti/Yale — captured) with components read as lighting/pose; the digit-3 study (ESL) and MNIST-9 (PC1≈rotation, PC2≈stroke width) — components as directions of real variation; the rotated-'6' circle recalled from zipcode-digits (spiral).
5. Practice discipline: center ALWAYS (uncentered PCA finds the mean direction — show it); scale when units differ (correlation vs covariance PCA — the choice is a modeling claim); PCA before k-NN/k-means; PCR named (prostate-study's deferred row paid).
6. Limitations argued: linear; variance ≠ relevance (a two-class example where the discriminative direction is the LAST component — worked); components unidentifiable up to sign; the door to nonlinear maps (tsne) and to supervised projections (LDA's Fisher view, one back-Ref).

## Set pieces & gems
- Eigenfaces with the 10-component reconstructions (SSBD Yale figure captured; Murphy Olivetti captured) — the module's most vivid real-data payoff.
- The variance≠relevance counterexample — under-taught, exam-grade.
- Murphy's "reconstruction error cannot choose L" — the unsupervised model-selection honesty gem (pairs with kmeans' K discussion).

## Pitfalls
- Centering: the single most common implementation bug — give it a boxed warning with the uncentered failure drawn.
- Do not develop probabilistic PCA (one ★ paragraph naming it and its σ→0 limit).
- Eigenvector sign/rotation non-uniqueness — one sentence, prevents "why do our answers differ".

## FIGURE PLAN
- draw: FigureSequence (4 frames) of the derivation — (1) a centered cloud with a candidate unit direction and its projections, (2) the variance-of-projections objective written, (3) the Lagrangian and Su=λu emerging, (4) the top eigenvector drawn on the cloud with λ₁ as the projected variance. Formula-dissection style. Key image.
- draw: The two views — max-variance direction and min-error perpendiculars on the SAME cloud; the Pythagoras identity total = along + across annotated. Single Figure (Bishop Fig 12.2's genre).
- draw: SVD anatomy — X = UDVᵀ as sized blocks with the rank-q truncation shaded; the "never form XᵀX" note bound to the conditioning number. Single Figure.
- source: understandin-s3-pca-yale-faces — stem `pca-yale-faces`, reader must see real faces, their 10-D reconstructions, and the 2-D scatter separating people; placement: centered in the real-image section.
- source: theelements-s3-pca-digit3-grid — stem `digit3-grid`, reader must see the 130 real handwritten 3s whose variation PCA is about to explain; placement: float right, before the components are shown.
- draw: The digit-3 component plane — our own recreation: mean digit ± each of the first two components rendered as digit thumbnails on a 2-D grid (the "what components mean" figure). Computed on public digits; inspired by ESL Fig 14.23/Murphy Fig 20.2.
- draw: Variance ≠ relevance — two elongated class clouds side by side where PC1 is within-class direction and the class signal lives on PC-last; projections onto each compared. Computed counterexample.
- draw: Scree + the honesty panel — a scree curve beside the monotone held-out reconstruction curve (labeled "cannot select q"), with the profile-likelihood knee marked on the scree. Two panels.

## EXERCISE PLAN
1. Warm-up: compute the covariance matrix and its eigendecomposition for 4 given 2-D points; report PC1 and its explained-variance share.
2. Derivation skipped: prove the second component solves the constrained problem (max variance ⊥ u₁) via the induction/deflation argument the lesson sketches.
3. Boundary probe: isotropic data (S = σ²I) — every direction is an eigenvector; connect to the demo's unstable-axes preset and to sign/rotation non-uniqueness; then uncentered PCA on data with a large mean — show PC1 ≈ the mean direction, the classic bug.
4. Claim to refute: "keep components until 95% variance is explained — that guards predictive information." Refute with the variance≠relevance counterexample; name the correct criterion when a downstream task exists (its validation error, module 5).
5. Mixed review (E3): show ridge and PCA operate on the same eigendirections — ridge shrinks by d²/(d²+λ), PCA truncates; place both on one "spectrum treatment" table (module 3 composed).
6. Research-shaped: eigenfaces in miniature — on the provided Olivetti subset, compute the top-10 components via the Gram trick, reconstruct one face at q = 3/10/50, and report reconstruction SSE per q.
7. FORWARD (E7): project the digit data to 2-D with PCA and color by class — clusters overlap heavily; note the maps module 8 ends with (t-SNE's MNIST figure) separate them. Solution: nonlinear neighbor-preserving embeddings → Ref tsne. (Also plants spectral-clustering: kernelized eigenproblems.)

## ARC
- Inherits: eigen/SVD machinery (used informally since module 3), the curse (module 1), ridge's spectrum view (module 3).
- Contributes: the module's linear-structure workhorse — derived twice, computed right, read on real images, and honestly bounded.
- Hands off: eigenproblems on similarity graphs → spectral-clustering; nonlinear neighborhood maps → tsne; the clinic verdict → tumor-microarray.
- Spine step: "Structure without labels…" (step 8).

## REVISION (vs old draft)
- Gains: both derivations in full with the equivalence (draft does max-variance only); the SVD/Gram-trick computational section; the variance≠relevance counterexample; the reconstruction-error-cannot-choose-q honesty; real-image set pieces (two sourced captures + computed digit plane).
- Loses: interview register; the limitations listicle becomes the argued closing section.
- Demo: keep PcaExplorer; the isotropic-degenerate task already matches the boundary probe (D1 good).
