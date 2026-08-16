# Tumor gene expression: unsupervised structure in the clinic — research brief

Lesson: `tumor-microarray` (module: unsupervised, core, planned). NEW — module 8's APPLICATION lesson (L16).
Goal: Apply clustering and PCA to real tumor gene-expression data and evaluate what the recovered structure does and does not establish.

## Sources
- ESL §14.3.8 (the NCI human-tumor microarray: 64 samples × 6,830 genes; K-means at K=3 grouping cancer types; THE misdiagnosis catch — two "breast" samples clustering with melanomas, later confirmed metastasized melanomas; Fig 14.8 elbow), §14.3.12 (the dendrogram+heatmap treatment), §14.3.3 (standardization effects on this data), Fig 1.3 (the raw heatmap — captured).
- ISLP §12.5.4 (NCI60 lab: PCA score plots colored by type; hierarchical dendrograms cut at 4; the comparison with K-means at 4 — the lesson's protocol source).
- ISLP Fig 1.4 (PCA of NCI60 showing coherent type clusters unlabeled).
- Module 8's internal toolkit: kmeans, hierarchical-dbscan (linkage choices, ARI), pca (Gram trick — p≫n!), tsne (the embedding read with discipline).

## Key points (APPLICATION spec)
- The artifact: the NCI60/NCI microarray panel — real expression data where unsupervised structure had CLINICAL consequences (the misdiagnosis catch) — the module's methods run as a genuine analysis, decisions documented.
- Module results used: k-means with restarts and the K question (kmeans); hierarchical clustering with linkage choice + dendrogram literacy + ARI against known types (hierarchical-dbscan); PCA via the Gram trick (p=6,830 ≫ n=64 — pca's computational section vindicated); t-SNE/UMAP views read under the misreading law (tsne); GMM honestly declared unusable here (n=64, full covariances impossible — a negative result that teaches).
- Where the idealization departs: n=64 makes every stability claim fragile (bootstrap the clustering, show linkage changes the tree); "cluster = cancer type" is a hypothesis, not a finding — the misdiagnosis catch was CONFIRMED by pathology, not by the dendrogram; batch effects and normalization choices move the answer.
1. The data introduced for engineers (L11): what a microarray measures, why p≫n is the norm, the 64×6,830 matrix drawn as the heatmap.
2. The analysis run in the ISLP-lab protocol order: PCA scores (types roughly separate — unlabeled first, then colored: the module-1 "unsupervised learning works" moment, now at p≫n); hierarchical dendrograms under 3 linkages (trees differ — the choice documented); cut at K=4 vs K-means at K=4; ARI between the two and against the type labels.
3. The catch retold precisely: the two breast-labeled samples in the melanoma branch; what the analysts did next (re-examination → metastasized melanoma confirmed) — unsupervised structure as HYPOTHESIS GENERATOR, the module's closing law enacted.
4. The stability audit: bootstrap resampling of samples → dendrogram top-structure frequency; standardize-vs-not rerun (ESL §14.3.3's warning on THIS data); what survives all choices (the strong type clusters) vs what doesn't (fine structure).
5. The honest ledger: what this analysis established (reproducible coarse structure, two flagged samples), what it cannot (K, subtype claims, any causal reading).

## Set pieces & gems
- The misdiagnosis catch — the single best story in unsupervised classical ML; told dryly with its verification step.
- The p≫n Gram-trick payoff — 6,830-dim PCA on a laptop in milliseconds.
- The negative GMM result — knowing when a module tool does NOT apply is the skill.

## Pitfalls
- Numbers: our reruns won't exactly match ESL's (preprocessing versions); label ours vs published (reproduction discipline, as in prior application lessons).
- No biology overreach: three domain terms max (expression, microarray, metastasis), each defined in a clause.
- Do not turn this into a survival-analysis or classification study (excluded scope).

## FIGURE PLAN
- source: theelements-s1-microarray-heatmap — stem `nci-heatmap`, reader must see the real red/green measured expression matrix with tumor-type labels; placement: centered, the opener (the data IS the artifact).
- draw: PCA scores — PC1/PC2 scatter of the 64 samples, first gray (structure visible unlabeled), then colored by type (structure validated); two aligned panels. Recreation of ISLP Fig 1.4's build. Key image.
- draw: The linkage triptych on this data — average/complete/single dendrograms side by side with the breast-in-melanoma branch highlighted amber in each where it appears. Computed.
- draw: The agreement table as a figure — ARI matrix: {K-means, hier-cut, spectral?} × {each other, type labels}; with SE from bootstrap. Computed.
- draw: The stability audit — top-split frequency across 50 sample-bootstraps as bars; the standardized-vs-raw rerun's ARI beside. Computed.
- draw: The ledger — two-column close: "established / not established" with one-line evidence pointers. Single small Figure (the application lesson's verdict genre).

## EXERCISE PLAN
1. Warm-up: from the provided distance matrix extract (8 samples), draw the average-linkage dendrogram and cut at K=3.
2. Boundary probe: run K-means at K=64 and K=1 on the data (conceptually) — the two degenerate ARIs; then justify why held-out likelihood is unavailable here (no density model fitted) and what replaced it (stability, external labels used ONLY for evaluation).
3. Claim to refute: "the dendrogram proves there are 4 cancer types." Refute via the module's law: cutting height is a choice; linkage changes the tree; the type count came from pathology — state what the dendrogram DID contribute (grouping hypotheses + two anomalies).
4. Research-shaped (core): reproduce the catch — with the provided NCI60 data, cluster with average linkage and report which samples' labels disagree with their branch; check the two breast/melanoma samples appear among them.
5. Mixed review (E3): run PCA via the Gram trick and verify the top-5 eigenvalues match the direct SVD (pca's computational claim, tested at p=6,830).
6. FORWARD (E7): compute the total variance explained by 5 components (~large) and ask what a SUPERVISED use of these components would require to be honest — feature extraction inside CV folds. Solution: the discipline is module 5's, and the supervised story of p≫n returns in module 11's feature discussions → Ref wrong-way-cv (retrieval) — noting this lesson closes the unsupervised arc.

## ARC
- Inherits: the entire module-8 toolkit plus its validation humility.
- Contributes: the module cashed out on real clinical data — including the canon's best unsupervised-discovery story and a documented negative result.
- Hands off: the toolkit's limits under p≫n and small n; the course turns from methods to guarantees (module 9) — the closing sentence sets that turn.
- Spine step: "Structure without labels…" (step 8, closing move before the lab).
