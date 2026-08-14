# k-means clustering — research brief

Lesson: `kmeans` (module: unsupervised, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/kmeans/lesson.mdx (24 min).
Goal: Apply Lloyd's algorithm by hand and prove it converges by coordinate descent on the distortion objective.

## Sources
- Bishop §9.1 (distortion J; both steps as block minimization; Old Faithful walkthrough Figs 9.1–9.2; image compression §9.1.1 with the bit-count arithmetic 24K + N·log₂K — real photos, image captured).
- CS229 Ch. 10 (coordinate-descent convergence argument; the six-panel walkthrough — image captured, credited to Michael Jordan).
- Murphy §21.3 (K-means++ with the O(log K) guarantee; K-medoids one paragraph; why reconstruction error cannot choose K §21.3.7; vector quantization §21.3.3).
- ESL §14.3.6 (within-cluster scatter identity; the standardization-can-destroy-clusters counterexample Fig 14.5 — recreate).

## Key points
1. The setting shift named (module opener): no labels, no risk-with-a-target; objectives must come from geometry or likelihood — and the honest warning that "no ground truth" means validation is intrinsically weaker here (SSBD's two-clusterings ambiguity; Kleinberg is next lesson's).
2. The objective J = ΣΣ r_ik‖x_i − μ_k‖²; Lloyd's two steps DERIVED as exact minimization in each block (assignment given centers; means given assignments — the mean-minimizes-RSS lemma reused from decision-trees); hence J non-increasing and finite state space ⇒ convergence. The proof carried fully.
3. Convergence ≠ optimality: local minima worked (the demo's task); restarts; k-means++ — the D² seeding rule with its stated O(log K) expected guarantee (Arthur–Vassilvitskii cited).
4. Vector quantization: the Bishop bit-count arithmetic on a real photo (24N bits → 24K + N·log₂K); the Fisher-photo compression set piece (ESL's images captured) — compression as the objective's operational meaning.
5. Choosing K: why held-out distortion monotonically decreases (proved in one line) — the model-selection tools that DO work (elbow honestly labeled a heuristic, silhouette forward-Ref to hierarchical-dbscan, gap statistic named).
6. Failure geometry: elongated/unequal-density clusters (Euclidean isotropy assumption surfaced — the GMM hand-off); the ESL standardization counterexample (scaling can DESTROY real clusters — feature-engineering's judgment call returns).

## Set pieces & gems
- Bishop's image compression with real arithmetic — the lab's checkpoint ancestor.
- The Fisher-photograph VQ triptych (ESL Fig 14.9; three captured images) — the founder of modern statistics compressed by his descendants' algorithm; one dry sentence of that irony.
- CS229's six-panel walkthrough (captured) — the canonical iteration film; recreate as our FigureSequence (don't paste the courtesy image; cite it).
- ESL Fig 14.5 standardization counterexample.

## Pitfalls
- k-means vs k-NN confusion: one disambiguation box, factual.
- The elbow method: present with calibrated skepticism (a heuristic reading of a curve that always bends).
- Empty clusters during Lloyd's: the implementation reality, one paragraph (lab handles it).

## FIGURE PLAN
- draw: FigureSequence (6 frames): Lloyd's on Old-Faithful-shaped data — seeds; assignment recolor; centroid move; second assignment; second move; converged, with J ticking down under each frame. Recreation of CS229/Bishop's canonical film in house style. Key image.
- draw: The two-block proof — J written with its two argument groups; each step shown as "minimize over one block, other fixed" with the corresponding inequality; the monotone staircase of J values. Formula-dissection Figure.
- draw: Local optima — same data, three seedings, three converged partitions with their final J values (one visibly bad). Computed; matches demo task.
- draw: k-means++ — the D² sampling: first center, distance-squared shading, the far cluster lit up as high-probability; final seeds spread. FigureSequence (3 frames).
- source: patternrecog-s2-kmeans-image-segmentation — stem `kmeans-photo-vq`, reader must see Bishop's real photographs quantized at K=2,3,10 with genuine posterization artifacts; placement: centered in the VQ section (real compression artifacts cannot be honestly redrawn).
- draw: The bit-count ledger — original vs codebook+indices storage arithmetic as labeled boxes for K=4 and K=16 on a 240×180 image. Single small Figure.
- draw: Failure geometry — three panels: elongated clusters split wrong; unequal densities absorbed; the ESL standardization flip (raw separable / standardized merged). Computed.

## EXERCISE PLAN
1. Warm-up: one full Lloyd iteration by hand on 6 points, K=2 (given seeds); report J before/after.
2. Derivation skipped: prove the assignment step minimizes J over assignments and the mean step over centers (the two lemmas the proof cites); conclude termination via finitely many partitions.
3. Boundary probe: K = n (J = 0, useless) and K = 1 (J = total scatter); then a run where a cluster empties — what the algorithm does and the two standard repairs; which convergence-proof step survives each repair.
4. Claim to refute: "k-means finds the K-partition minimizing J." Refute with a worked two-seeding example landing at different J; name the guarantee actually proved (local, monotone) and the k-means++ patch's actual claim (expected O(log K)-optimal SEEDING).
5. Mixed review (E3): compute the compression ratio for the Fisher photo at K=200 (2×2 blocks) from the bit ledger and check ESL's 0.239 figure.
6. Research-shaped: on provided 3-cluster data with one cluster 10× denser, run 20 restarts at K=3; report the fraction of runs splitting the dense cluster — quantify the isotropy bias.
7. FORWARD (E7): for a converged solution, compute for one boundary point the two distances that tie; note the assignment is forced to be hard even at a 51/49 tie. Solution: soft assignments weighted by plausibility are the GMM's responsibilities → Ref gmm-em.

## ARC
- Inherits: distance geometry and scaling judgment (modules 1/5); the mean-minimizes-RSS lemma (decision-trees).
- Contributes: the unlabeled module's first objective and its convergence proof; compression as clustering's operational meaning; the isotropy flaw named.
- Hands off: shapes k-means cannot see → hierarchical-dbscan; hard assignments softened → gmm-em.
- Spine step: "Structure without labels…" (step 8).

## REVISION (vs old draft)
- Gains: the full two-block convergence proof (draft sketches); the VQ section with real-image set piece and bit arithmetic (new); k-means++'s stated guarantee; the standardization counterexample; module-opener framing of unsupervised validation weakness.
- Loses: interview register; the elbow/silhouette bullet becomes one honest paragraph with forward Refs.
- Demo: keep KMeansStepper with the find-a-bad-local-optimum task (D1).
