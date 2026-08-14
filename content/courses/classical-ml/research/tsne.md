# Neighbor embeddings: t-SNE and UMAP — research brief

Lesson: `tsne` (module: unsupervised, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/tsne/lesson.mdx (22 min; t-SNE only). RE-SCOPED: now t-SNE + UMAP + the misreading discipline.
Goal: Explain how t-SNE and UMAP preserve local neighborhoods, why heavy tails fix crowding, and how to read — and not misread — their maps.

## Sources
- van der Maaten & Hinton 2008 (primary): SNE conditionals + perplexity §2; symmetric joint form §3.1; the crowding problem's volume argument §3.2; the Student-t fix and gradient §3.3 (Fig 1 gradient heatmaps — captured); optimization tricks (early exaggeration/compression) §3.4; MNIST/COIL-20 results (Figs 2/5/7 — captured).
- Wattenberg, Viégas & Johnson (Distill 2016, CC-BY): the misreading catalogue — hyperparameters matter (Fig 1 frames captured); cluster sizes mean nothing (Fig 3); distances mean little (Fig 4); noise looks clustered at low perplexity (Fig 6 pair captured); bowed lines (Fig 8); trefoil instability (Fig 12).
- McInnes et al. 2018 (UMAP): §3's computational view (kNN graph, ρ/σ normalization, fuzzy union, cross-entropy layout); Appendix C (a=b=1 recovers t-SNE's kernel); §4.3 hyperparameters (n_neighbors/min_dist — Fig 1 color-cube captured); §6 weaknesses incl. the constellation effect and the Kobak–Linderman initialization caveat; Fig 4 comparison grid (captured).
- Murphy §20.4.10 (t-SNE summary cross-check; Barnes–Hut sentence).

## Key points
1. The goal shift: PCA/spectral preserve global structure; visualization needs LOCAL neighborhoods in 2-D. SNE's device: neighbor probabilities p_{j|i} with per-point σ set by PERPLEXITY (= effective neighbor count, derived as 2^H); the asymmetric KL cost and what its asymmetry prices (keeping far things apart is cheap; tearing neighbors apart is dear).
2. The crowding problem DERIVED (the volume argument: d-dim mid-range shells have no 2-D room); the fix: Student-t (heavy tails) in the map — the gradient's attraction/repulsion anatomy (Fig-1 heatmaps read); early exaggeration in one honest paragraph.
3. The showcases: MNIST's ten islands (captured glyph map); COIL-20's closed loops — what success looks like WHEN structure is real.
4. The misreading catalogue as an L13 battery (each a genuine, prevalent misconception, each with a Distill frame): cluster SIZES mean nothing (density equalization by design); inter-cluster DISTANCES mean little; pure NOISE clusters at low perplexity (the flagship gotcha); axes mean nothing; run-to-run instability. Each stated → refuted → mechanism → discriminating example.
5. UMAP in the same frame: kNN graph with local ρ/σ normalization (the "custom metric per point" idea — same móve as perplexity), fuzzy union, cross-entropy layout with attraction/repulsion; a=b=1 recovers t-SNE's kernel (Appendix C — the unification); what UMAP adds (speed, some global structure via initialization) and the Kobak–Linderman honesty (initialization, not loss, drives much of the global-structure claim); n_neighbors/min_dist read via the color-cube sweep.
6. The discipline: embeddings are for HYPOTHESIS GENERATION; any structure claimed must be re-checked in the original space (cluster metrics, module 8's tools) — the lesson's closing law.

## Set pieces & gems
- The perplexity-2 noise clusters (Distill Fig 6, captured pair) — the course's sharpest "seeing is not believing".
- The MNIST glyph map (captured) — the genre's most famous figure.
- The constellation-effect phrase (UMAP §6) — quote once.
- The a=b=1 identity — the two methods unified in one line.

## Pitfalls
- Do not derive UMAP's category theory — the computational view only (the paper itself sanctions this split).
- Perplexity/n_neighbors are NOT interchangeable numbers — one comparison paragraph.
- Keep optimization details (momentum schedules, Barnes–Hut) to naming level.

## FIGURE PLAN
- draw: The neighbor-probability construction — one point's Gaussian bump over its neighbors at two σ, with perplexity readout 2^H; the per-point σ adapting to density. FigureSequence (3 frames).
- draw: The crowding argument — mid-range shell volumes in d=10 vs the 2-D ring that must hold them; then Gaussian vs Student-t map kernels with the tail gap shaded (where mid-range points get parked). Two-panel Figure; the lesson's mechanism image.
- source: visualizingd-fig7-mnist-randomwalk — stem `tsne-mnist`, reader must see the digit-glyph map with its ten islands; placement: centered in the showcase section.
- source: howto-fig06-p2-false-clusters + howto-fig06-p30-uniform-sphere — stem `noise-two-ways`, reader must see the SAME 100-D noise as convincing clusters (p=2) and as an honest disc (p=30); placement: the two 300px frames side by side, centered, in the misreading section (real stochastic outputs; a redraw would fabricate the evidence).
- draw: The misreading scoreboard — three mini-panels recreating Distill's size-illusion, distance-illusion, and bowed-lines cases with our own runs, each stamped with its one-line law ("sizes mean nothing", …). Computed (CC-BY permits reuse, but our own runs keep house style).
- source: umapuniform-fig4-algorithm-comparison — stem `umap-comparison-grid`, reader must see the real 5-algorithm × 4-dataset embedding grid (UMAP keeping global arrangement where t-SNE scatters it); placement: float right in the UMAP section.
- draw: UMAP's construction strip — kNN graph → per-point (ρ, σ) normalization → fuzzy union (edge opacities) → layout forces; the a=b=1 t-SNE identity boxed at the end. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute perplexity for a point with neighbor distribution (0.5, 0.3, 0.2) and confirm 2^H ≈ 2.97 "effective neighbors".
2. Boundary probe: perplexity ≥ n — the σ search has no solution/undefined behavior (the Distill erratum's case); and perplexity → 1 — every point a lone island; state what each extreme optimizes.
3. Claim to refute: "the left cluster is twice as spread as the right, so its class is more variable." Refute with the density-equalization mechanism + the Distill size case; state what IS preserved (neighbor identity, approximately).
4. Derivation skipped: derive the simplified t-SNE gradient's attraction/repulsion split (the (p−q)·kernel weighting) from the KL objective for the symmetric case (guided).
5. Mixed review (E3): embed the nested-rings data with t-SNE and with spectral clustering's eigenvector embedding (spectral-clustering composed); state which preserves the ring TOPOLOGY and which invents separations.
6. Research-shaped: reproduce the noise gotcha — 500 points of 100-D Gaussian noise at perplexity 2 and 30 (given runner); report what a naive reader would conclude at each; then verify with a module-8 statistic (silhouette on the original space) that no structure exists.
7. FORWARD (E7): run UMAP on the digits at n_neighbors = 5 and 200; observe local islands vs global layout trading places. Solution: the local↔global dial is the manifold-scale assumption — and the last word on what unsupervised structure claims mean belongs to the clinic study next → Ref tumor-microarray.

## ARC
- Inherits: PCA's global-linear limits, spectral embeddings (the eigenvector cousin), the curse (volume arguments), module-8 validation tools.
- Contributes: the visualization workhorses with their mechanisms AND their misreading law — the module's epistemic-hygiene lesson.
- Hands off: everything to the clinic — where embeddings, dendrograms, and PCA must survive contact with real tumor data → tumor-microarray.
- Spine step: "Structure without labels…" (step 8).

## REVISION (vs old draft)
- Gains: UMAP (entirely new half); the crowding volume argument derived (draft asserts); the gradient anatomy; the full misreading battery as structured L13 slots with sourced Distill frames (draft has one bullet); the noise-verification research exercise; title change to "Neighbor embeddings: t-SNE and UMAP".
- Loses: interview register; the PCA-vs-t-SNE "decision rule" bullet becomes the closing discipline section.
- Demo: keep PerplexityExplorer but ADD the pure-noise presets (p=2/p=30) so the falsification task is in the demo, not just prose (D1).
