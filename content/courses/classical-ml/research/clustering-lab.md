# Lab: k-means and EM from scratch — research brief

Lesson: `clustering-lab` (module: unsupervised, type: lab, planned). NEW.
Goal: Implement Lloyd's algorithm, k-means++ seeding, image vector quantization, and EM for Gaussian mixtures — with a monotone log-likelihood as the correctness witness.

## ARC
- Inherits: the two convergence arguments (kmeans' block descent, gmm-em's ELBO monotonicity) — each becomes an executable assertion; the VQ arithmetic (kmeans); numerical-stability craft (logreg-lab's logaddexp pattern, now log-sum-exp).
- Contributes: the module's two central algorithms as verified code whose own invariants test them — the course's cleanest "the proof is the unit test" experience.
- Hands off: a clustering/density toolkit; the responsibilities machinery that echoes in any later latent-variable reading.
- Spine step: "Structure without labels…" (step 8, final item).

## LAB PLAN

Artifact: one notebook building `cluster.py`-style tooling — vectorized Lloyd's algorithm with k-means++ seeding, an image vector-quantizer with bit accounting, and a full EM for 2-D Gaussian mixtures with log-sum-exp responsibilities — culminating in image compression at K=4/16 and an EM fit on Old Faithful whose log-likelihood provably never decreases.

CANON GROUNDING: modelled on the CS229 problem-set lineage the notes point to (k-means image compression and EM for GMMs are the classic CS229 PS3 pairing; the notes' own §10–11 present exactly these algorithms and defer practice to problem sets) and on ISLP Lab 12.5 (dossier: "K-means and hierarchical clustering lab … NCI60 Data Example") — the hierarchical half of ISLP's lab is NOT rebuilt (tumor-microarray's exercises cover reading it via scipy; building linkage trees adds hours without a new idea). Bishop §9.1.1's photograph-compression worked example (dossier gem, with the bit-count arithmetic) supplies the VQ checkpoint's design. Departure: EM verification uses the monotonicity theorem as an assertion — an invariant-based test the canon proves but never operationalizes; that is this lab's pedagogical addition.

Datasets: Old Faithful (272×2, public — Bishop's Appendix A dataset, ships as a 4 KB CSV) and one CC0/public-domain photograph (~200×150, shipped in data/, credited in credits at build time). Held-out points for the metric task in private/.

Checkpoints (plan; lab-author may split/deepen):
1. `assign-step` (exact): nearest-centroid assignment, vectorized (no Python loops over points). Warm-up.
2. `update-step` (exact): centroid means with empty-cluster repair (re-seed farthest point). Warm-up. 
3. `lloyd-loop` (exact): full k-means; asserts the distortion history is non-increasing (the convergence proof as a test). Consumes: 1, 2.
4. `kmeanspp` (exact): D²-sampling seeding under a fixed seed; verified distortion distribution over 20 restarts beats uniform seeding. Consumes: 3.
5. `image-vq` (exact): quantize the photo at K=4 and K=16; return codebook, index map, and bits-per-pixel from the 24K + N·log₂K ledger. Consumes: 3.
6. `e-step` (exact): responsibilities via log-sum-exp (stability checked against a distant-outlier case that overflows the naive form). Independent function.
7. `m-step` (exact): weighted means/covariances/mixing weights (covariance floored at εI). Consumes: 6.
8. `em-monotone` (exact): full EM on Old Faithful; asserts log-likelihood never decreases across 50 iterations AND increases > tol for the first 5 (guards trivial constant implementations). Consumes: 6, 7.
9. `singularity-hunt` (review, optional): describe an initialization driving one component's likelihood to infinity and the fix their code applies (the εI floor).
10. `beat-distortion` (metric, optional, LAST): with ≤10 k-means++ restarts, beat the distortion threshold on the held-out blob dataset (threshold set so uniform-seeded single runs fail ~half the time; reference clears comfortably).

Known-wrong variants: assignment by squared distance to the WRONG axis (unvectorized transpose bug); update dividing by K instead of cluster size; distortion computed after assignment but before update (staircase looks non-monotone); naive exp in responsibilities (overflow); covariance without the weighted mean re-centering; forgetting to renormalize π.

NOT blanked: data loading, image I/O helpers, plotting (cluster colors, ellipse drawing, likelihood staircase), the fixed seeds.

est_hours: 4. Progression: warm-ups (1, 2) → composing chains (3 → 4, 5; 6 → 7 → 8) → one open metric last (10, optional) → review garnish (9). Required: 1, 2, 3, 5, 6, 7, 8.
