# Research brief: kmeans (k-means clustering)

status: planned
module: unsupervised
type: core
goal: Apply Lloyd's algorithm by hand and prove it converges by coordinate descent on the distortion objective.

## Sources to consult

- CS229 **ch. 10** — the convergence proof: J(c,μ) = Σ‖xᵢ−μ_{c(i)}‖²;
  assignment step minimizes J over c with μ fixed; update step minimizes J
  over μ with c fixed (mean = argmin of squared distances — derive);
  monotone decrease ⇒ convergence; local optima; Fig 10.1 (the panel
  sequence to recreate).
- Bishop **§9.1** — the Old Faithful 9-panel run (Fig 9.1) and the
  monotone-J curve (Fig 9.2); the responsibility notation r_nk that
  gmm-em will soften (plant the notation here); K-means for image
  compression §9.1.1 as an Aside.
- ISLP **§12.4.1** — algorithm statement, multiple restarts (nstart)
  practice, the within-cluster-variation objective in ISLP notation.
- Arthur & Vassilvitskii 2007 (k-means++) — seeding: sample next center ∝
  D(x)²; O(log k)-competitive guarantee in one sentence. (Cite paper; no
  swarm summary — verify statement level only.)
- Huyen §8.1 + StatQuest k-means — interview calibration: elbow method,
  failure scenarios; the **mouse dataset gem** (k-means vs GMM on unequal
  blob sizes) — reuse in the demo presets and in gmm-em.
- ESL §14.3 for k-medoids one-liner (non-Euclidean/outlier-robust variant).

## Key points the lesson must cover

1. Problem setup: partition into k groups minimizing distortion J; NP-hard
   in general (one sentence) — Lloyd's is a heuristic that locally
   minimizes.
2. **One full run by hand** (L4): ~8 2D points, k=2, seeded centers; table
   of distances → assignments → new means → repeat until stable. Every
   number visible; the exercise re-runs from different seeds.
3. **The convergence proof**: both steps decrease the SAME J (assignment:
   pointwise argmin; update: the mean minimizes Σ‖x−μ‖², derived by
   setting the gradient to zero — micro-derivation); J ≥ 0 and finitely
   many partitions ⇒ terminates. What is NOT guaranteed: global optimum;
   k-means can converge to bad configurations.
4. **Initialization**: bad-seed example; random restarts keeping best J;
   k-means++ mechanics and why spreading seeds helps.
5. **Choosing k**: J always decreases with k (so no argmin over k); elbow
   heuristic; silhouette pointer (formalized next lesson); domain
   constraints as the honest answer.
6. **Failure modes**: non-spherical clusters (rings/moons), unequal
   variances/sizes (mouse data), unscaled features (spiral to knn-curse
   scaling), outliers dragging means (k-medoids one-liner); Euclidean
   assumption. Complexity O(nkd) per iteration; mini-batch variant one
   sentence. k-NN vs k-means disambiguation (spiral).

## Interview questions to work as exercises

- "Run k-means to convergence on these 6 points with these seeds." (hand
  mechanics set piece)
- "Prove k-means converges. Does it find the optimum?" (the coordinate-
  descent argument)
- "Show the mean minimizes Σ‖x−μ‖². What if you used L1 distance?"
  (median → k-medians; ties to L2/L1 loss discussion — E3 spiral to ols's
  'why squared error')
- "How do you choose k?" (elbow + silhouette + task-driven; why not argmin J)
- "Name three datasets where k-means fails and what you'd use instead."
  (rings → DBSCAN/spectral; unequal covariances → GMM; categorical →
  k-modes one-liner)
- "Why must features be scaled before k-means?" (E3 spaced link)
- "Is k-means sensitive to initialization? Fix it two ways." (restarts,
  k-means++)

## Pitfalls / subtleties to flag

- Empty-cluster edge case during iterations (re-seed the dead center) —
  implementation detail interviewers occasionally probe.
- k-means optimizes VARIANCE around centers, so it carves Voronoi cells —
  boundaries are linear; it cannot represent non-convex clusters no matter
  the k. State geometrically.
- The objective never increases, but the PARTITION can cycle only if ties
  are broken inconsistently — fix a tie rule.
- Elbow plots are frequently ambiguous — present as heuristic, not method.
- Distortion comparisons across different k or different scalings are
  meaningless; only compare J at fixed k and features.

## FIGURE PLAN

1. **`<FigureSequence>` (6 frames)** — the hand run: (1) points + seed
   crosses; (2) assignment coloring (Voronoi split line shown); (3) means
   move (arrows); (4) re-assignment flips two points; (5) means settle;
   (6) converged with J tally per frame decreasing. Delta = one half-step
   per frame. Inspiration: Bishop Fig 9.1 / CS229 Fig 10.1.
2. **single `<Figure>`** — J vs iteration staircase for the run above,
   annotated which drops came from assignment vs update steps.
   Inspiration: Bishop Fig 9.2.
3. **single `<Figure>`** — the two half-step lemmas side by side:
   assignment as per-point argmin (distance table) and update as the
   mean-minimizes-squared-distance derivation (3-line gradient). One idea:
   both moves descend the same J.
4. **single `<Figure>`** — bad seeding vs k-means++: same data, two seed
   sets, two converged solutions with J tallies; k-means++'s D²-sampling
   sketched as shaded selection probabilities.
5. **single `<Figure>`** — elbow plot: J vs k with the ambiguous bend
   marked and a caption warning; silhouette teaser value beside two
   candidate k's (forward ref).
6. **single `<Figure>`** — failure gallery, three panels: two rings,
   mouse-shaped unequal blobs, unscaled elongated data — k-means result
   overlaid on each with the true grouping ghosted. Feeds directly into
   hierarchical-dbscan and gmm-em (the module's flaw-driven sequence).
