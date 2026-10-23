# Isolation Forest — research brief

Lesson: `isolation-forest` (module: anomaly, core, planned). NEW.
Goal: Derive the Isolation Forest anomaly score from expected path length under random partitioning and explain why sub-sampling improves detection.

## Sources
- Liu, Ting, Zhou 2008 (primary, read in full): Sec. 1 (profiling's false alarms and cost; anomalies "few and different"; two parameters t, ψ; no distance or density); Sec. 2 (random partitioning Fig. 1: x_i 12 splits vs x_o 4; averages 12.82 vs 4.02 over 1,000 trees; iTree definition — internal node test q < p with q random, p uniform between min and max of q; grow until height limit, |X| = 1 or all equal; proper binary tree n external, n − 1 internal; path length h(x); BST analogy — c(n) = 2H(n − 1) − 2(n − 1)/n, H(i) ≈ ln i + 0.5772 (Eq. 1, Table 1, Preiss §10.3.3); s(x, n) = 2^{−E[h(x)]/c(n)} (Eq. 2); E[h] → c(n) gives 0.5, → 0 gives 1, → n − 1 gives 0; s near 1 = anomaly, well below 0.5 = normal, all ≈ 0.5 = no distinct anomaly; why not normalise by n or log n; Fig. 2–3); Sec. 3 (sub-sampling helps: swamping and masking; Fig. 4 Mulcross 4,096 points AUC 0.67 vs 128-point sub-sample 0.91; different sub-samples per tree act as specialised experts; sampling without replacement); Sec. 4 (height limit l = ⌈log₂ ψ⌉ — only shorter-than-average paths matter, a partial model; ψ = 256, t = 100; path lengths converge before t = 100; Algorithm 3 returns e + c(Size) at a truncated external node; training O(tψ log ψ), evaluation O(nt log ψ); top-m by sorting); Sec. 5 (ORCA k = 5, LOF k = 10, RF with synthetic class; Table 2 datasets; Table 3: Http iForest 15.58 s AUC 1.00 vs ORCA 9,487 s AUC 0.36; Mulcross 12.5 s vs 2,512 s; LOF on Shuttle 7,490 s; kNN detects only anomaly clusters smaller than k; Fig. 5 AUC converges early in t; Fig. 6 near-optimal AUC at ψ = 128 (Http) / 512 (ForestCover), little variation after; Sec. 5.3 high-dimensional: 506 noise attributes, kurtosis selection restores AUC; Sec. 5.4 training on normal only: Http 0.9997 → 0.9919, ForestCover 0.8817 → 0.8802, larger ψ restores); Sec. 6 memory < 511·t·b bytes; Http 283,748 points in 7.6 s; ψ 64× larger → time 1.6×; Sec. 1 names credit-card fraud as the first application.
- Handbook Ch7 Autoencoders: Isolation Forest baseline on the simulator 0.808 / 0.164 / 0.19 (AUC / AP / CP@100) vs AE 0.836 / 0.18 / 0.217 — the fraud numbers.
- Chandola Sec. 5 pros/cons (test cost of kNN) and Sec. 11 (kNN/clustering miss a tight anomaly cluster) — the problems isolation addresses.
- CS6890 PS4 / HKU A1 (lab canon, next lessons).

## Key points
1. The idea as a repair: distance/density methods profile normal (O(N²), swamped by dense anomaly clusters); isolation profiles nothing — it asks how many random cuts separate a point. Fig. 1's 12 vs 4 computed-by-eye; the 1,000-tree averages 12.82 vs 4.02.
2. The iTree precisely: random attribute, uniform split between the node's min and max, recursion to singletons or the height limit; a proper binary tree; h(x) counts edges.
3. The normaliser derived: an iTree on n points has the structure of a BST built by random insertions; the average unsuccessful-search depth is c(n) = 2H(n − 1) − 2(n − 1)/n; compute c(2) = 1, c(256) ≈ 10.2, c(4096) ≈ 15.7; why n (max height) and log n (average height) both fail as normalisers (one unbounded, one not comparable).
4. The score: s = 2^{−E[h]/c(n)} with its three anchor cases; the reading rules (near 1, ≈ 0.5, ≪ 0.5); monotone in h; the contour picture (Fig. 3).
5. Sub-sampling as the second idea: swamping (normals near anomalies isolated with them) and masking (dense anomaly clusters hide); Mulcross 0.67 → 0.91 by using 128 points; each tree on its own sub-sample; ψ = 256, t = 100 as defaults; height limit ⌈log₂ ψ⌉ and the c(Size) adjustment at truncated leaves (Algorithm 3) — derive why: the untraversed subtree below the limit would have added c(Size) on average.
6. Cost: O(tψ log ψ) training independent of N; O(nt log ψ) scoring; memory 511 nodes per tree; the Http timings against ORCA/LOF; the kNN limitation (anomaly clusters larger than k).
7. On fraud: the handbook's 0.808 / 0.164 / 0.19 on the simulator — AUC respectable, AP low — the module's refrain; what isolation catches on the simulator (scenario 1's amounts; scenario 3's ×5 amounts relative to the customer only if the features are the module-3 deviations).
8. ★ Starred: high dimensions and kurtosis attribute selection; training on normal only; the random-forest-with-synthetic-class baseline.

## Set pieces & gems
- 12 vs 4 splits; 12.82 vs 4.02.
- c(n) from the BST analogy — a derivation the reader can follow in five lines.
- Mulcross 0.67 → 0.91 with 128 of 4,096 points.
- Http: 15.58 s / AUC 1.00 vs ORCA 9,487 s / 0.36.
- 511·t·b bytes; ψ 64× → time 1.6×.
- "The paper names credit card fraud as its first application."

## Pitfalls
- State sampling without replacement and the per-tree sub-sample; a common implementation error is one sub-sample for all trees.
- The c(Size) adjustment at truncated leaves is the canonical bug (lab's wrong variant) — show it explicitly.
- Do not oversell on fraud: AP 0.164 vs supervised 0.646 on the same split.

## FIGURE PLAN
- draw: `<FigureSequence>` (5 frames): random axis-parallel splits on a 2-D Gaussian cloud, one split per frame, until the planted anomaly is alone at depth 4 while the normal point is still in a crowd — our own re-enactment of Fig. 1(a)–(b). Key image.
- draw: The path-length average vs number of trees for the two points converging to ~12.8 and ~4.0 — computed on our cloud (Fig. 1(c)'s idea).
- draw: c(n) vs n (log x) with n, log₂ n and c(n) as three curves — why c(n) is the right normaliser. Computed from Eq. 1.
- draw: s as a function of E[h] with the three anchors (0, c(n), n − 1) marked and the 0.5 line — Fig. 2 recreated.
- source: isolationfor-fig4-swamping-masking — stem `mulcross-subsample`; the reader must see the 4,096-point Mulcross cloud with its two triangle anomaly clusters wrapped in normal circles, beside the 128-point sub-sample where the clusters stand clear; centered in the sub-sampling section (the authors' actual generated data behind the 0.67 → 0.91 claim).
- draw: The height-limit adjustment: a truncated iTree with the untraversed subtree drawn faint and "+ c(Size)" written at the leaf — single figure.
- draw: Score contour map of an iForest on a 64-point Gaussian with contours at 0.5, 0.6, 0.7 — computed (Fig. 3's idea).

## EXERCISE PLAN
1. Warm-up: compute c(n) for n ∈ {2, 16, 256, 4096} and the score of a point with E[h] = 4 at n = 256 and at n = 4096.
2. Derivation the lesson skipped: derive c(n) from the BST unsuccessful-search recurrence (or from the expected depth of a random insertion), and show c(n) ~ 2 ln n − O(1).
3. Boundary probe: all points identical in every attribute — the tree stops at the root; what h, c and s become, and why the paper's stopping rule ("all values equal") is needed to avoid an infinite loop.
4. Claim to refute: "Using the full dataset per tree (ψ = N) gives better trees because each sees more data, so AUC must be at least as high as with ψ = 256." Refute with Mulcross and the swamping/masking mechanism; name the step (isolation depth of a point inside a dense anomaly cluster) that fails.
5. Research-shaped: reproduce the Mulcross effect on a seeded 2-D dataset (two dense anomaly clusters inside a normal cloud): AUC at ψ ∈ {N, 1024, 256, 128, 64}; report the curve.
6. FORWARD (E7): run the iForest on the simulator's 14 features and inspect the ten highest-scored genuine transactions — the reader finds rare-but-legitimate behaviour (large amounts, night) and asks what a model trained to reconstruct genuine rows would say about them → lands on `one-class-and-reconstruction`'s reconstruction error and the "low precision alone" finding.
7. Mixed review (E3): score a simulator week with the iForest and with LOF (density-and-distance-scores); compute AUC and AP with the module-2 harness; compare with the handbook's 0.808 / 0.164.

## ARC
- Inherits: the framework and the distance/density family's costs and failures (previous two lessons).
- Contributes: isolation as a profiling-free score with a derived normaliser, the sub-sampling argument, linear cost; the fraud numbers.
- Hands off: reconstruction as the learned alternative (one-class-and-reconstruction); the ULB application and the lab's first half.
- Spine step 5: the unlabeled frontier.
