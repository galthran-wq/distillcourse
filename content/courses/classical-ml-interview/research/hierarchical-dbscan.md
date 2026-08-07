# Research brief: hierarchical-dbscan (Hierarchical clustering and DBSCAN)

status: planned
module: unsupervised
type: core
goal: Compare linkage-based hierarchical clustering and density-based DBSCAN and select the right paradigm for a data shape.

## Sources to consult

- ISLP **§12.4.2** — agglomerative clustering: the algorithm, the four
  linkages (single/complete/average/centroid; add Ward from ESL), the
  dendrogram-interpretation warning (vertical fusion height means
  similarity, horizontal adjacency means NOTHING — the classic
  misreading), the "no two leaves' closeness readable" example, practical
  issues (scaling, where to cut, dissimilarity choice incl. correlation-
  based for shoppers).
- ESL **§14.3.12** — linkage trade-offs stated sharply: single-linkage
  chaining, complete-linkage crowding/diameter, group average as the
  compromise (+ its scale dependence); Ward as variance-merging (ties to
  k-means' J — spiral).
- Ester, Kriegel, Sander, Xu 1996 (KDD) — DBSCAN's original definitions:
  ε-neighborhood, core point (≥ minPts), directly density-reachable,
  density-connected, noise; the two-parameter algorithm; the k-distance
  plot heuristic for choosing ε. (Cite paper; statement-level only — the
  swarm did not read it; keep claims to the standard definitions.)
- Murphy **§21.1–21.2** — evaluating clusterings: silhouette (formalize
  the kmeans teaser), adjusted Rand index when labels exist; hierarchical
  clustering in modern notation.
- StatQuest "Hierarchical Clustering" and "Clustering with DBSCAN" — the
  step-by-step merge narration and the core/border/noise walk-through;
  mechanics pacing for the worked examples (dry register).
- Huyen §8.1 — k-means-fails scenarios as the connective tissue from last
  lesson.

## Key points the lesson must cover

1. Flaw-first bridge: kmeans' failure gallery (rings, unequal blobs) —
   recap one sentence + Ref. Two escape routes: don't commit to k
   (hierarchies), or define clusters by density (DBSCAN).
2. **Agglomerative clustering worked** (L4): 6 points, distance matrix;
   merge steps with single linkage — the full sequence of matrices; draw
   the dendrogram as it grows; then the SAME data under complete linkage
   producing a different tree (the punchline: linkage is a modeling
   choice).
3. Linkage taxonomy + artifacts: single (chains through noise bridges —
   good for elongated shapes, fragile), complete (compact equal-diameter
   clusters, breaks large ones), average (compromise, scale-dependent),
   Ward (merges minimizing within-cluster variance increase — "k-means'
   sibling"; default in practice).
4. **Dendrogram literacy**: cutting at height h ⇒ clusters; the number of
   clusters read from a cut, not chosen upfront; fusion height =
   dissimilarity; horizontal order is arbitrary (the interview trap
   question); when hierarchies are real (taxonomies) vs imposed.
5. **DBSCAN**: definitions (ε, minPts, core/border/noise) on a worked
   picture; the algorithm as connected components of core points;
   strengths — arbitrary shapes, no k, explicit noise; weaknesses —
   varying densities (one ε cannot fit two densities), high-d distance
   concentration (spiral to knn-curse), ε/minPts selection (k-distance
   elbow heuristic); complexity O(n log n) with an index vs O(n²).
6. **Evaluation + selection**: silhouette formula computed on a tiny
   example; ARI one paragraph; the closing four-way table k-means /
   hierarchical / DBSCAN / GMM(next lesson): shape assumption, k needed?,
   noise handling, scalability, output type.

## Interview questions to work as exercises

- "Perform agglomerative clustering with complete linkage on this 5-point
  distance matrix; draw the dendrogram." (mechanics set piece)
- "Single vs complete linkage — failure mode of each?" (chaining vs
  breaking; small worked instance in solution)
- "What can and can't you read off a dendrogram?" (the horizontal-order
  trap)
- "Explain core, border, and noise points; classify the points in this
  picture for ε=1, minPts=3." (hand execution)
- "Two clusters with very different densities — what does DBSCAN do and
  what would you try?" (single-ε failure; OPTICS/HDBSCAN one-liner)
- "Compute the silhouette of this point given these distances." (E3:
  reuses distances/scaling discipline from knn-curse/kmeans)
- "When k-means over DBSCAN?" (big n, roughly spherical, need centroids/
  fast scoring; and the reverse)

## Pitfalls / subtleties to flag

- Agglomerative clustering is greedy and never undoes merges — early
  mistakes propagate; one sentence.
- Ward requires Euclidean distances; single/complete/average work on any
  dissimilarity — the flexibility argument for hierarchies.
- DBSCAN border points can be reachable from two clusters — assignment is
  order-dependent (minor nondeterminism); noise ≠ outlier detection
  guarantee.
- Silhouette assumes convex-ish clusters — it scores DBSCAN's rings
  poorly even when they're right; do not use one metric to referee across
  paradigms blindly.
- Standardize before ANY distance-based clustering — third repetition of
  the scaling drum (deliberate spiral).

## FIGURE PLAN

1. **`<FigureSequence>` (5 frames)** — agglomerative run: distance matrix
   + scatter; each frame merges the closest pair (matrix shrinks by one
   row/col, dendrogram grows one fusion); final frame the full dendrogram
   with a cut line producing 2 clusters. Delta = one merge.
   Inspiration: ISLP §12.4.2 walk-through.
2. **single `<Figure>`** — linkage gallery: same elongated-plus-blob data
   under single/complete/average/Ward, four small panels with the
   characteristic artifact labeled on each (chain, split, compromise,
   variance-tight). Inspiration: ESL §14.3.12.
3. **single `<Figure>`** — dendrogram literacy card: one dendrogram with a
   correct reading (fusion heights) checked and a wrong reading
   (horizontal adjacency) struck out. Inspiration: ISLP's warning example.
4. **single `<Figure>`** — DBSCAN anatomy: point cloud with ε-circles on
   three representative points labeled core / border / noise; minPts
   tally inside each circle. Inspiration: Ester et al. definitions.
5. **single `<Figure>`** — DBSCAN vs k-means on two rings + scattered
   noise: side-by-side results, noise points marked by DBSCAN, rings
   split wrongly by k-means. The payoff comparison.
6. **single `<Figure>`** — the ε dilemma: dense cluster + sparse cluster
   with one ε too small for the sparse and too large for the dense;
   k-distance elbow plot beside it. One idea: one density parameter, two
   densities.
7. **single `<Figure>`** — silhouette computed: one highlighted point with
   its a (intra) and b (nearest-other) distance bundles drawn, formula
   with the numbers, and the [-1,1] scale bar.
