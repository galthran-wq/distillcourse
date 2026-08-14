# Spectral clustering — research brief

Lesson: `spectral-clustering` (module: unsupervised, core, planned). NEW.
Goal: Derive spectral clustering as a relaxed graph cut and explain when Laplacian eigenvectors find clusters that centroids cannot.

## Sources
- von Luxburg 2007 (primary, read in full): §2 similarity graphs (ε/kNN/mutual-kNN and the multi-density comparison Fig 3 — captured); §3 Laplacians (Prop 1: f'Lf = ½Σw_ij(f_i−f_j)², PSD; Prop 2: zero-eigenspace = connected components — both PROVED, short); §4 the three algorithms; §5 RatioCut/Ncut relaxations (the k=2 RatioCut derivation §5.1 carried; trace form §5.2); §5.4 the cockroach-graph failure; §8.3 eigengap heuristic (Fig 4 captured); §8.5 the L_rw recommendation with the Dirac-eigenvector pathology (Fig 5); §6 random-walk view (Prop 5: Ncut = escape probability) as ★.
- ESL §14.5.3 (concentric-circles example); SSBD §22.3 (compact treatment cross-check); Murphy §21.5 (kernel-PCA/normalized-cut connections — one paragraph).

## Key points
1. The inherited failure: nested rings / two moons — no centroid, no Gaussian, no single ε works; but the kNN GRAPH of the data knows (rings = two connected components, almost). Clustering becomes a graph-partition problem.
2. Similarity graphs as the modeling step: ε vs kNN vs mutual-kNN on multi-density data (von Luxburg's Fig 3 case recreated/sourced); the graph choice IS the bias injection (course theme).
3. The Laplacian: L = D − W; the quadratic-form identity PROVED (three lines); consequences: PSD, constant vector in the kernel; Prop 2 proved — the zero-eigenspace spans component indicators. The ideal case is a theorem, not a demo.
4. The real case: components connected by a few edges — indicators perturbed into the smallest-eigenvalue eigenvectors; the RatioCut k=2 relaxation DERIVED (the assignment vector with ±√ constants, its constraints, Rayleigh–Ritz → second eigenvector); the general k trace form stated; the k-means-in-the-embedding final step and WHY it is principled there (points near indicator corners).
5. The algorithm(s): unnormalized vs Shi–Malik (L_rw) vs Ng–Jordan–Weiss (L_sym + row-normalize); von Luxburg's verdict — use L_rw — with her three converging reasons (cut objective, consistency, no Dirac pathology) compressed honestly.
6. Choosing k: the eigengap heuristic with its graceful degradation (Fig 4's three-blur sweep); honesty: relaxation has NO approximation guarantee — the cockroach graph (O(n)-worse cut) as the counterexample.
7. ★ The random-walk reading: Ncut = probability the walk escapes the cluster (Prop 5) — one elegant page; the kernel-PCA kinship sentence.

## Set pieces & gems
- The four-Gaussians eigenvector panel (von Luxburg Fig 1, captured): eigenvectors piecewise-constant on clusters — the "why it works" made visible from a real computation.
- The cockroach graph — a rare honest counterexample IN the canon tutorial.
- The Dirac-eigenvector pathology (Fig 5) — why the unnormalized Laplacian misbehaves.
- Rings data thread: gmm-em's forward exercise lands here (the second eigenvector's sign pattern).

## Pitfalls
- Keep matrix-perturbation formality out (Davis–Kahan named in one sentence as the formal backing).
- The three-Laplacian zoo can swamp the lesson: derive with L, present the normalized pair as the practice recommendation with reasons, not three parallel derivations.
- Eigen-solver practicalities: one paragraph (smallest eigenvectors, sparse solvers), no numerics excursion.

## FIGURE PLAN
- draw: The failure gallery inherited — rings/moons with k-means' and GMM's wrong partitions (from earlier lessons' machinery), then the kNN graph overlaid showing near-disconnection. FigureSequence (3 frames); the flaw-first opener.
- draw: The quadratic-form identity — f'Lf expanded over edges with one edge's (f_i−f_j)² term highlighted on the graph drawing; smooth-on-the-graph reading. Formula-dissection Figure.
- draw: The ideal-case theorem — a 3-component graph, its block W, and the three indicator eigenvectors as bar-plots over vertices (eigenvalue 0 ×3). Single Figure.
- source: atutorial-fig1-toy-eigenvectors — stem `luxburg-eigenvectors`, reader must see the real computed eigenvalues/eigenvectors on the 4-Gaussian data (piecewise-constant on the kNN graph, smooth on the full graph); placement: centered after the perturbed-case section (real computation, not schematic).
- draw: FigureSequence (4 frames): the pipeline on rings — (1) data, (2) kNN graph, (3) embedding by eigenvectors 2–3 (rings become two tight blobs), (4) k-means in the embedding, colors mapped back. Key image.
- draw: The eigengap — three datasets of increasing overlap with their bottom-10 eigenvalue stems; the gap closing. Recreation of von Luxburg Fig 4's design (or crop the captured original — decide at figure time; drawn preferred for house style).
- draw: The cockroach graph — the ladder with removed rungs, the optimal vertical cut vs the relaxation's horizontal cut, cut costs tallied. Single Figure; the honesty slot.

## EXERCISE PLAN
1. Warm-up: build W, D, L for a given 5-vertex graph; verify f'Lf for one given f against the edge-sum formula.
2. Derivation skipped: prove Prop 2 (zero-eigenspace = span of component indicators) — the lesson proves one direction; the reader completes the other.
3. Boundary probe: the fully-connected graph with equal weights — compute the spectrum (0 with multiplicity 1, the rest equal); what the eigengap heuristic returns (k=1) and why that is the right degenerate answer; then a graph with an isolated vertex — the pathological "cluster of one".
4. Claim to refute: "spectral clustering finds the minimum RatioCut." Refute with the relaxation gap — the cockroach construction's O(n) factor; name the step (dropping the discreteness constraint) where optimality is lost.
5. Mixed review (E3): show the embedding step is kernel PCA with the graph's implicit kernel in the ideal case (pca composed); one paragraph answer.
6. Research-shaped: reproduce von Luxburg's Fig-1 experiment in miniature — 200 points from 4 Gaussians on a line, 10-NN graph, bottom-5 eigenvalues/eigenvectors of L_rw; report whether the eigengap sits at 4.
7. FORWARD (E7): compute the spectral embedding of a 3-ring dataset and t-SNE's embedding of the same (given helper); note both unroll structure PCA cannot — but t-SNE also invents cluster sizes/distances. Solution: what neighbor embeddings preserve and what they fabricate is the next lesson → Ref tsne.

## ARC
- Inherits: k-means (the final step and the failure gallery), GMM's ring failure, eigen machinery (pca), kNN graphs (module 1's neighborhoods reused as structure).
- Contributes: clustering as graph partitioning — theorems for the ideal case, a derived relaxation, working recommendations, and an honest counterexample.
- Hands off: eigen-embeddings for VISUALIZATION with their own distortions → tsne; the toolkit verdict on real data → tumor-microarray.
- Spine step: "Structure without labels…" (step 8).
