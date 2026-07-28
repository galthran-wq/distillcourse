# Research brief: tsne (t-SNE and neighbor embeddings)

status: planned
module: unsupervised
type: core
goal: Explain how t-SNE preserves local neighborhoods, why heavy tails fix the crowding problem, and when to prefer it over PCA.

Interview register: "PCA vs t-SNE" and "how do you read a t-SNE plot" are
the asked questions; the math depth stays at the cost-function level (no
gradient derivation in the core path).

## Sources to consult

- van der Maaten & Hinton 2008 (JMLR) — the single deep source: SNE
  conditional probabilities p_{j|i} (Eq 1) and the KL cost's asymmetry
  (Eq 2: near points mapped far = big penalty, far points mapped near =
  small — the "local structure bias" sentence); perplexity 2^H as
  effective neighbor count, binary search for σᵢ, typical 5–50; symmetric
  p_ij (§3.1); **the crowding problem** (§3.2: the 11-equidistant-points-
  in-10D-but-not-2D argument + r^D volume scaling); the Student-t fix
  (§3.3, Fig 1's gradient comparison); optimization tricks (early
  exaggeration — one sentence); the three named weaknesses (§6.2:
  d>3 unclear, intrinsic-dimensionality curse, non-convex).
- StatQuest "t-SNE, Clearly Explained" — pacing for the mechanics
  narrative (move points to match neighbor distributions).
- Distill-style folklore "How to Use t-SNE Effectively" (Wattenberg et al.,
  distill.pub 2016) — cite for the reading-pitfalls section (cluster sizes
  and distances not meaningful, perplexity sweeps); statement-level (not
  swarm-read; verify claims against the linked article when writing).
- pca lesson — the contrast anchor: PCA preserves global variance
  (linear, parametric, deterministic); t-SNE preserves local neighborhoods
  (nonlinear, non-parametric, stochastic).

## Key points the lesson must cover

1. The goal shift: PCA optimizes for variance/reconstruction; visualization
   wants NEIGHBORHOODS preserved. A concrete failure of linear projection
   (Swiss-roll-style or nested rings flattened) opens the lesson (L4).
2. **The construction**: Gaussian neighbor probabilities around each point;
   per-point σᵢ set by perplexity (effective #neighbors — the one formula
   worth memorizing: Perp = 2^H); map points get their own q distribution;
   minimize KL(P‖Q). The asymmetry argument: which mistakes cost.
3. **The crowding problem**: the volume argument (moderate-distance shell
   in high-D has no 2D room) + the 11-equidistant-points fact; consequence
   — everything gets crushed centrally in plain SNE.
4. **The fix**: Student-t (Cauchy) tails in the map; heavy tails let
   moderate distances map to larger map distances; the attraction/repulsion
   reading (mismatch acts like springs — one sentence, dry).
5. **Reading t-SNE plots — the checklist**: cluster SIZES mean nothing
   (equalized densities); INTER-cluster distances mean little; axes mean
   nothing; run-to-run variation (non-convex, random init); perplexity
   changes topology (shattering at low, merging at high — the demo's
   presets); always sweep perplexity and seeds before claiming structure.
6. **PCA vs t-SNE decision table**: preprocessing/features/speed/
   determinism/new-point projection (parametric out-of-sample) → PCA;
   final-mile visualization of cluster structure → t-SNE; "PCA to 30–50
   dims, then t-SNE" as the standard pipeline (the paper's own recipe);
   UMAP one-sentence positioning.

## Interview questions to work as exercises

- "PCA vs t-SNE — when each, and can t-SNE replace PCA as preprocessing?"
  (no: non-parametric, no out-of-sample mapping, distances distorted)
- "What does perplexity control? What happens at 2 and at 100 on n=500?"
- "Why Student-t in the map but Gaussian in the original space?" (crowding
  argument reproduced)
- "Your t-SNE shows 3 clusters; k-means on the 2D t-SNE output confirms 3.
  What's wrong with this pipeline?" (clustering on distorted distances;
  cluster in original/PCA space instead — E3 spiral to kmeans)
- "Two runs give different maps. Is the data unstable?" (non-convexity,
  seeds; KL is not identifiable up to layout)
- "A stakeholder reads 'cluster A is twice as big and far from B' off your
  t-SNE. Correct them." (the reading-checklist answer)

## Pitfalls / subtleties to flag

- KL(P‖Q) direction matters; swapping it changes which errors are punished
  — state once, no derivation.
- t-SNE preserves neighborhoods, not densities or distances — the single
  most-violated reading rule.
- Perplexity > n/3-ish degenerates; tiny perplexity shatters real clusters
  into artifacts — sweep, don't trust one run.
- O(n²) plain; Barnes-Hut/FIt-SNE one-liner for scale.
- Do not feed t-SNE coordinates into downstream models; embeddings are for
  eyes. (Interviewers set this trap via the k-means-on-t-SNE question.)

## FIGURE PLAN

1. **single `<Figure>`** — the goal shift: nested rings projected by PCA
   (overlapping mess) vs t-SNE unrolling them into two islands; tally of
   neighbor-preservation. One idea: variance ≠ neighborhood.
2. **single `<Figure>`** — the perplexity dial: p_{j|i} bell around one
   point with σ small vs large, the effective-neighbor count annotated;
   Perp = 2^H formula bound to the picture.
3. **`<FigureSequence>` (3 frames)** — the crowding argument: (1) a
   high-D point with near shell and mid shell (volumes tallied r^D);
   (2) both shells forced into a 2D disk — mid-shell points overlap the
   near shell (crushed); (3) heavy-tail map kernel stretches the mid
   shell outward — room restored. Inspiration: §3.2–3.3.
4. **single `<Figure>`** — Gaussian vs Student-t curves overlaid with the
   matching-q-at-larger-distance construction drawn: same similarity,
   bigger map distance. Inspiration: paper Fig 1's logic (recreate).
5. **single `<Figure>`** — the misreading gallery: one t-SNE map annotated
   with three struck-out claims ("A is denser", "A–B gap = dissimilarity",
   "x-axis = feature") and the one valid claim ("these points are mutual
   neighbors"). One idea: what the map licenses.
6. **single `<Figure>`** — perplexity sweep strip: the same labeled data
   at perplexity 2 / 5 / 30 / 100 (matches demo presets), artifact labels
   under the extremes. Inspiration: Wattenberg et al. sweeps.
7. **single `<Figure>`** — the decision table: PCA vs t-SNE rows
   (objective, linearity, params, determinism, out-of-sample, use) as a
   compact card; the "PCA→30 dims→t-SNE" pipeline arrow underneath.
