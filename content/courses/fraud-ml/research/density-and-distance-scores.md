# Distance and density scores: kth-neighbour distance, LOF and Mahalanobis — research brief

Lesson: `density-and-distance-scores` (module: anomaly, core, planned). NEW.
Goal: Compute kth-nearest-neighbour, local-outlier-factor and Mahalanobis anomaly scores and explain the varying-density failure that LOF repairs.
Prerequisite from classical-ml: k-NN and the curse of dimensionality (knn-curse), DBSCAN's density notion (hierarchical-dbscan), PCA — recalled by Ref.

## Sources
- Chandola Sec. 5 (primary): assumption (normal in dense neighbourhoods, anomalies far from their closest neighbours); Sec. 5.1 kth-NN distance, sum of k distances, count within radius d (global density: fixed d → 1/n, fixed n → 1/d); only a positive-definite symmetric similarity needed; O(N²) and the speedups (Bay & Schwabacher pruning near-linear; partition bounds for top-n; sampling O(MN)); Sec. 5.2 varying density failure (Fig. 7: p₂ near dense C₂ hidden by sparse C₁); LOF = ratio of neighbours' average local density to the point's own, local density = k / volume of the smallest hypersphere holding k NN; COF for line structures (Fig. 8); ODIN (in-degree in the kNN graph); LOCI/MDEF (micro-clusters); pros/cons (fails if normals lack neighbours or anomalies have them — clustered fraud; expensive test; distance quality; kd/R-trees degrade with dimension).
- Chandola Sec. 7 (primary for the statistical family): assumption (normal in high-probability regions); 3σ holds 99.7% of Gaussian data; box-plot 1.5 IQR holds 99.3% — equivalent for Gaussian data (Fig. 9); Grubbs z = |x − x̄|/s with the t-based threshold at α/(2N) (Eq. 1–2); multivariate via Mahalanobis then Grubbs (Eq. 3); χ² statistic (Eq. 4); regression residuals as scores, robust regression; mixtures (Eskin λA + (1−λ)M); histogram profiles — bin-size trade-off, attribute-wise histograms miss rare combinations of common values (NIDES); Parzen; EVT footnote (extremes vs anomalies); pros/cons.
- Chandola Sec. 9: robust PCA score Σ_{i≤q} y_i²/λ_i ~ χ²_q (Eq. 5–6), equals Mahalanobis when q = p — spectral = statistical in a subspace.
- Baesens Ch2 "Outlier detection and treatment" (z > 3, 1.5 IQR, winsorising with s = IQR/(2·0.6745), invalid-but-not-outlying values) and Ch3 "Statistical outlier detection" (Grubbs iterated; Mahalanobis √((x − x̄)ᵀS⁻¹(x − x̄)); normality as the weakness), Ch3 "Distance metrics" (Minkowski; 500 vs 505 showing scale dominance → standardise; SMC vs Jaccard on red-flag binaries: 100 flags with ~5 raised, SMC makes all claims alike), Ch3 peer-group as a density-free neighbour method.
- Handbook Ch7 Autoencoders: Isolation Forest baseline 0.808 / 0.164 / 0.19 — the module's reference numbers (forward).
- Bolton & Hand Sec. 2: profiling + outlier detection; Grubbs' 1969 definition cited by Baesens.

## Key points
1. The statistical family first (simplest, oldest): z-score, 1.5 IQR, Grubbs; the identity 1.5 IQR ≈ 3σ for Gaussians (99.3% vs 99.7%) — derive it from the quartiles of N(0,1) (Q₃ = 0.6745, fence at 2.698σ); Mahalanobis as the multivariate z with the covariance; χ² reading in q dimensions; where it fails (non-Gaussian amounts: log first; multimodal behaviour).
2. Distance scores: kth-NN distance and the radius count; the distance's requirements; standardisation (500 vs 505) and the binary case (Jaccard vs SMC); cost O(N²) and the pruning idea; the curse (classical-ml Ref).
3. The varying-density failure derived on Fig. 7's geometry: a point at distance r from a dense cluster vs a sparse cluster's own members at spacing 2r — the global score ranks the normal sparse members above the real anomaly.
4. LOF: reachability distance, local reachability density, LOF as the ratio; LOF ≈ 1 inside a cluster of any density, > 1 at its edge, ≫ 1 for isolated points; worked on a 7-point toy (k = 3); what LOF misses (a tight anomaly cluster of size > k — Fig. 10(c) again) and the COF/LOCI variants in one line each.
5. Histogram/profile models: per-attribute frequency as a score; the rare-combination blind spot (each value common, the pair rare) — the reason multivariate methods exist; peer-group analysis placed in this family (distance to peers' statistic).
6. Robust PCA as Mahalanobis in a subspace: the χ²_q score; the identity at q = p; the subspace reading (anomalies off the correlation structure) — ties the spectral family to the statistical one and previews the autoencoder bottleneck (one-class-and-reconstruction).
7. ★ Starred: Grubbs' iterated test and its t-threshold; Eskin's mixture; EVT vs anomaly.

## Set pieces & gems
- 1.5 IQR ≡ 2.7σ: the two textbook rules reconciled.
- Fig. 7's p₂: the picture that motivates LOF.
- 500 vs 505 and the Jaccard-vs-SMC red-flag example.
- "Each value common, the combination rare" — the histogram blind spot.
- Robust PCA = Mahalanobis at q = p.

## Pitfalls
- LOF has several reachability conventions; fix Breunig's (reach-dist_k(p, o) = max(k-distance(o), d(p, o))) and show one worked table.
- Do not re-teach PCA; one Ref and the score formula.
- Keep the fraud reading explicit: these scores are computed on the module-3 feature vector (aggregates, profiles), not on raw amounts alone — say which features and why scaling matters.

## FIGURE PLAN
- draw: Fig. 7 recreated: a sparse cluster C₁, a dense cluster C₂, point p₁ inside C₁'s spacing and p₂ just outside C₂ — with each point's kth-NN radius drawn as a circle so the ranking reversal is visible. Single figure; key image.
- draw: `<FigureSequence>` (4 frames) of LOF on a 7-point toy with k = 3: (1) k-distance circles, (2) reachability distances for one point, (3) local reachability densities as numbers, (4) the LOF ratio per point with the outlier's value highlighted. Computed.
- draw: The 1.5-IQR fence and the 3σ line on the same Gaussian density with the tail masses 0.7% and 0.3% annotated — the equivalence. Computed.
- draw: Mahalanobis vs Euclidean on a correlated 2-D cloud: two near-identical panels with the same contour radius drawn as a circle (Euclidean) and an ellipse (Mahalanobis), a point that is far in one and near in the other highlighted (voita rule 8).
- draw: Histogram blind spot: two attributes' histograms (both values common) beside the 2-D scatter where the pair sits alone — three small panels.
- draw: Robust PCA: the principal axes of the cloud with a point's projection on the top-q axes and the χ²_q score dissected under it; the q = p case noted (voita rule 7).

## EXERCISE PLAN
1. Warm-up: compute the 1.5-IQR fences and the z-scores for a provided 12-value amount sample; which values each rule flags.
2. Derivation the lesson skipped: derive the 1.5-IQR fence's position in σ units for a Gaussian (2.698σ) and its two-sided tail mass; then show the fence's position for a log-normal amount distribution in the log scale.
3. Boundary probe: LOF with k larger than the dense cluster's size — compute what the local densities become and why LOF ≈ 1 everywhere; then k = 1.
4. Claim to refute: "A kNN distance score with k = 5 is robust to the dense/sparse problem if the data are standardised first." Refute on Fig. 7's geometry: standardisation rescales axes, not the local spacing; name the quantity LOF introduces (relative density).
5. Research-shaped: reproduce Fig. 7 (seeded two-cluster data with a 4:1 density ratio and one planted anomaly) and report the rank of the anomaly under kth-NN distance and under LOF for k ∈ {5, 10, 20}.
6. FORWARD (E7): compute the kth-NN distance score on a 100,000-row simulator extract and time it; then time the same on a 1,000-row random sub-sample and note that the anomaly's rank barely moves — the reader has found sub-sampling before the mechanism is named → lands on `isolation-forest`'s ψ = 256 and the swamping/masking argument.
7. Mixed review (E3): Mahalanobis on the 14 handbook features with the covariance from the training block only (delayed-labels-prequential) — state why the covariance must not see the test week, and compute AP on a simulator week with the module-2 harness.

## ARC
- Inherits: the framework (anomaly-detection-framing); classical-ml's kNN/PCA; module-3 features.
- Contributes: the statistical and distance/density families computed — z/IQR/Grubbs/Mahalanobis, kth-NN, LOF — with the varying-density failure and the subspace identity.
- Hands off: isolation (next) as the answer to O(N²) and to masking; the reconstruction score as the learned subspace (one-class-and-reconstruction); the ULB application.
- Spine step 5: the unlabeled frontier.
