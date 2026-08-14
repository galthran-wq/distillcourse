# Hierarchical clustering and DBSCAN — research brief

Lesson: `hierarchical-dbscan` (module: unsupervised, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/hierarchical-dbscan/lesson.mdx (22 min).
Goal: Compare linkage-based hierarchical clustering and density-based DBSCAN and select the right paradigm for a data shape.

## Sources
- ESL §14.3.12 (agglomerative algorithms; linkage functions; dendrograms; cophenetic caveat), §14.3.8/14.3.10 (microarray and country-dissimilarity examples — the first feeds tumor-microarray).
- ISLP §12.4.2–12.4.3 (dendrogram reading — what horizontal position does NOT mean; correlation vs Euclidean dissimilarity; the socks-and-computers scaling case §12.4.3).
- Murphy §21.2 (linkage algebra; the 5-point worked dendrogram §21.2's Fig 21.2), §21.1 (evaluation: purity, Rand/ARI with the worked numeric example, NMI — the module's evaluation toolkit lands HERE).
- SSBD §22.1 (linkage-based clustering formalized), §22.5 (Kleinberg's impossibility theorem — scale invariance / richness / consistency, Thm 22.4).
- DBSCAN: standard formulation (Ester et al. named); Murphy/von Luxburg context for density clustering.

## Key points
1. The flaw inherited: k-means sees only isotropic blobs. Two escapes: build a HIERARCHY of merges (no K, no shape assumption at merge time), or define clusters by DENSITY (arbitrary shapes, noise points allowed).
2. Agglomerative mechanics worked on 5 points end to end (distance matrix → merges → dendrogram); the linkage zoo — single (chaining artifact demonstrated), complete (crowding), average, Ward (the k-means kinship derived: merge cost = ΔJ) — each with its characteristic pathology on the same data.
3. Dendrogram literacy: cutting at a height; heights = merge dissimilarities; the two classic misreadings refuted (horizontal adjacency means nothing; two leaves' similarity is the height of their JOIN, not their distance on the page) — ISLP's warnings as an L13 slot (genuinely prevalent misconception).
4. DBSCAN: core/border/noise definitions; the two parameters (ε, minPts) and the k-distance heuristic; two-moons solved; the varying-density failure (mutual reachability one sentence; HDBSCAN named only).
5. Evaluation toolkit for the module: silhouette derived; Rand/ARI with Murphy's worked 17-object numeric example; NMI named — and the honesty frame: external metrics need labels the setting says we lack; stability as the practical check.
6. ★ Kleinberg's impossibility: no clustering function satisfies scale-invariance + richness + consistency — statement, the 2-of-3 map of real algorithms, proof sketch (single-linkage variants realize any two). The module's "no free lunch".
7. Paradigm selection: the shape → method table argued via the module's running gallery (blobs/moons/nested/varying-density).

## Set pieces & gems
- Murphy's worked Rand-index example (purity 0.71, Rand 0.68) — reproduce with the same numbers.
- ISLP's socks-and-computers scaling story — one figure's worth: three scalings, three clusterings, all "correct".
- Kleinberg's theorem — a real impossibility result most courses omit; the module's intellectual anchor.
- ESL's Cold-War country 3-medoids (Table 14.3) — charming; use ONLY if it survives L12 (likely cut; one sentence at most).

## Pitfalls
- DBSCAN parameter folklore: present the k-distance plot as a heuristic with failure modes, not a rule.
- Ward's method needs Euclidean/variance framing — state its scope.
- Do not run the microarray example here — tumor-microarray owns it; use synthetic + small worked data.

## FIGURE PLAN
- draw: FigureSequence (5 frames): 5-point agglomeration — distance matrix with the min highlighted, merge drawn, dendrogram growing a bar per frame; final cut line yielding clusters. Key image (Murphy Fig 21.2's genre).
- draw: The linkage zoo — same elongated-plus-blob data under single/complete/average/Ward: four dendrograms + four cut partitions, chaining and crowding annotated. Computed 2×4 panel.
- draw: Dendrogram misreadings — one dendrogram with the two wrong readings crossed out (adjacent leaves ≠ similar; the join-height rule illustrated with three leaf pairs). Single Figure; the L13 slot's visual.
- draw: DBSCAN anatomy — ε-balls around core points, border points attached, noise isolated; then the two-moons dataset solved with k-means' failure inset. FigureSequence (3 frames).
- draw: The k-distance heuristic — sorted 4-NN distances with the knee marked and the honest "heuristic" label; beside it a varying-density case where no single ε works. Two panels.
- draw: The 2-of-3 impossibility map — Kleinberg's three axioms as a triangle, algorithms placed on the edges they satisfy. Single small Figure (★ section).

## EXERCISE PLAN
1. Warm-up: complete the 5-point single-linkage dendrogram from a given distance matrix (two merges done, reader finishes).
2. Derivation skipped: prove single linkage's chaining formally on a path of equally-spaced points (the merge sequence is the path); state why complete linkage breaks it.
3. Boundary probe: DBSCAN with ε larger than the data diameter (one cluster) and minPts > n (all noise); then the borderline: a point reachable from two clusters — show DBSCAN's assignment is order-dependent, and why the definition tolerates it.
4. Claim to refute: "the dendrogram shows observations 3 and 9 are similar because they are adjacent at the bottom." Refute with a re-drawable flip (2^{n−1} orderings); compute the actual join height.
5. Mixed review (E3): compute the silhouette of a given 8-point 2-cluster configuration; then merge the clusters and recompute — the metric moving the right way (uses kmeans' distance machinery).
6. Research-shaped: reproduce Murphy's Rand-index example (17 objects) — compute purity, Rand, ARI from the given contingency table and match his 0.71/0.68.
7. FORWARD (E7): construct nested circles data; verify single linkage handles it while k-means/Ward/DBSCAN-at-one-ε struggle in different ways; compute the 10-NN graph's connected components. Solution: clustering on the GRAPH's structure — eigenvectors of its Laplacian — is spectral clustering → Ref spectral-clustering.

## ARC
- Inherits: k-means and its isotropy flaw; distance/scaling judgment.
- Contributes: two shape-liberated paradigms, dendrogram literacy, the module's evaluation toolkit, and the impossibility frame that calibrates all clustering claims.
- Hands off: graph-based clustering (spectral-clustering); the likelihood road (gmm-em); the real-data verdict (tumor-microarray).
- Spine step: "Structure without labels…" (step 8).

## REVISION (vs old draft)
- Gains: the worked 5-point agglomeration sequence; Ward↔k-means derivation; the Rand/ARI worked example (evaluation moves HERE from scattered mentions); Kleinberg ★; the DBSCAN order-dependence probe; the L13 dendrogram-misreading slot structured properly.
- Loses: interview register; the paradigm-selection table stays but must be argued from the gallery, not asserted.
- Demo: none (unchanged).
