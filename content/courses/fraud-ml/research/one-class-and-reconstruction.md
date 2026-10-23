# One-class boundaries and reconstruction error — research brief

Lesson: `one-class-and-reconstruction` (module: anomaly, core, planned). NEW.
Goal: Explain one-class SVM and SVDD as boundary estimators and the autoencoder reconstruction error as an anomaly score, and evaluate the handbook's unsupervised and semi-supervised results.
Prerequisite from classical-ml (svm-dual-kernels): the SVM primal/dual and kernels — recalled; and neural-tabular-detectors for the MLP machinery.

## Sources
- Handbook Ch7 Autoencoders (primary; shard 6 partly read — the AE part is covered): definition and taxonomy; representation learning; PyTorch AE 15-100-20-100-15; unsupervised reconstruction-error scoring — trained AE mean MSE 8.0e-5 on validation, fraud mean error 1.83e-3 vs genuine 6.9e-5 (~27×); AUC 0.836, AP 0.18, CP@100 0.217; untrained AE's 0.93 average MSE falling to 8e-5; Isolation Forest 0.808 / 0.164 / 0.19; 2-D code scatter coloured by label and K-means (k = 10) on the code; semi-supervised W1A (score fusion) / W1B (AE score as a feature) / W2 (shared-code AE with a supervised head on labelled samples); supervised FFNN baseline 0.859 / 0.646 / 0.28; with reconstruction error added (W1B) 0.861 / 0.651 / 0.276 — "mitigated"; conclusion: unsupervised AE catches off-distribution points including rare genuine ones, so AUC is decent but precision-based metrics low.
- Chandola Sec. 4 (classification-based: multi-class vs one-class; one-class SVM Schölkopf 2001; one-class kernel Fisher; SVDD Tax & Duin smallest hypersphere), Sec. 4.1 replicator neural network (same input/output size, three hidden layers compressing; δ_i = (1/n)Σ_j (x_ij − o_ij)² as the score), Sec. 4 pros/cons (labels rather than scores; Platt scaling), Sec. 9 spectral (PCA low-variance components; robust PCA score — the linear autoencoder), Sec. 11 Fig. 10(b): a circular one-class boundary misses anomalies inside a ring of clusters.
- Baesens Ch3 "One-class SVMs": ν-SVM — separate data from the origin with hyperplane w·φ(x) − ρ = 0; ν bounds the fraction of outliers; objective ½Σw² − ρ + (1/(νn))Σe; the dual with a kernel.
- Baesens Ch4 pp.155–164 (SVM recap pointers) — Ref only.
- CS6890 PS4 (lab canon): AE and VAE on the ULB set, log-scaled Time/Amount, scored by F1; PS5 VAE synthesis — one line as what the course does not do.
- HKU A1 Part II: k-means cluster rule on ULB — recall near 1, F1 near 0 (the application's set piece; named here as a clustering-family instance).
- Akoglu Sec. 4.1 (NrMF residuals as anomaly indicators) — one forward sentence to module 6.

## Key points
1. One-class boundaries: the ν-SVM derived from the SVM margin story (classical-ml recall): hyperplane from the origin in feature space, ν as both the outlier-fraction bound and the support-vector-fraction bound; SVDD's hypersphere; the kernel makes the boundary a union of blobs — and Fig. 10(b)'s ring shows the boundary-around-everything failure when the kernel width is wrong; cost O(n²) and what that means at 400k/day (a sub-sample again).
2. The linear case first: PCA reconstruction — project onto the top q components, reconstruct, the residual norm is the score; equivalently the robust-PCA χ² score of density-and-distance-scores; a linear autoencoder with q hidden units learns exactly this subspace.
3. The autoencoder: encoder, bottleneck (code), decoder; trained on genuine rows (semi-supervised regime) with MSE; the reconstruction error as score; the 15-100-20-100-15 net and its numbers (0.93 → 8e-5; 27× gap; 0.836 / 0.18 / 0.217 vs iForest 0.808 / 0.164 / 0.19); the 2-D code scatter as a learned map where frauds sit at the edge; what the AE learns about scenario 1 (amount), 2 (terminal risk window), 3 (customer deviation) given module-3 features.
4. Why precision is low (the module's refrain, now explained mechanically): the AE reconstructs what is common; rare genuine behaviour (a large purchase, a night-time transaction) is reconstructed badly too; under a budget those rows fill the queue; AUC survives because frauds are, on average, rarer than rare-genuine.
5. Semi-supervised fusion: W1A (combine scores), W1B (AE error as a feature of the supervised model) — 0.646 → 0.651 on AP, 0.28 → 0.276 on CP@100: null; W2 (shared code with a supervised head); the honest reading: on the simulator the supervised model already sees the deviation features the AE would discover.
6. Regime placement: ν-SVM/SVDD and AE are semi-supervised (normal-only training) — contaminate the training set with frauds and the boundary/subspace absorbs them (Liu's Sec. 5.4 analogue); the cleaning step.
7. ★ Starred: the VAE as a density model (CS6890 PS4/PS5 do it; the course names it and stops); K-means on the code; NrMF forward.

## Set pieces & gems
- 6.9e-5 vs 1.83e-3: the 27× gap.
- Untrained 0.93 → trained 8e-5.
- W1B's 0.646 → 0.651 — the null result "reported honestly".
- "AE gets AUC 0.836 with zero labels but AP only 0.18."
- Fig. 10(b): the boundary that encloses the anomalies.
- The linear AE = PCA identity.

## Pitfalls
- The handbook shard was partially read (autoencoder part complete, sequence part cut short — module 7's brief notes it); do not cite seq2seq AE specifics.
- Do not write a VAE lesson; PS4's VAE is a lab option at most (not planned).
- Keep the semi-supervised/unsupervised vocabulary consistent with anomaly-detection-framing (AE trained on genuine = semi-supervised).

## FIGURE PLAN
- draw: `<FigureSequence>` (3 frames) of the ν-SVM in feature space: (1) the data and the origin, (2) the hyperplane pushed away from the origin with margin ρ/‖w‖, (3) the slack points beyond it as the ν-fraction. Inspired by Baesens Fig 3.32 (recreated).
- draw: Fig. 10(b) with a one-class boundary: a ring of five tight clusters, the anomalies at the centre, a wide-kernel boundary enclosing everything vs a narrow-kernel boundary hugging the clusters — two near-identical panels (voita rule 8).
- draw: The autoencoder as a tiered diagram 15 → 100 → 20 → 100 → 15 with the bottleneck highlighted and the reconstruction error dissected under the output (voita rules 5, 7). Key image.
- draw: Reconstruction-error histograms for genuine and fraud rows on log scale with the two means (6.9e-5 and 1.83e-3) marked — computed on our simulator run.
- draw: The 2-D code scatter coloured by label (frauds at the periphery) — computed; inspired by Handbook Ch7's bottleneck scatter.
- draw: Linear AE = PCA: a 2-D cloud with its first principal axis, a point, its projection and the residual as the score, beside a one-hidden-unit linear autoencoder diagram — identity figure.
- draw: Three fusion architectures W1A / W1B / W2 as three small tier diagrams with the supervised head marked — inspired by Handbook Ch7's taxonomy description.

## EXERCISE PLAN
1. Warm-up: compute the reconstruction error of three given rows under a provided 3 → 1 → 3 linear autoencoder (weights given) and rank them.
2. Derivation the lesson skipped: show that a linear autoencoder with a q-unit bottleneck and MSE loss has the PCA subspace as a global optimum (the Eckart–Young argument in outline), hence its score equals the PCA residual norm.
3. Boundary probe: ν → 0 and ν → 1 in the one-class SVM — what the boundary and the support-vector set become; why ν is "the fraction of outliers you are willing to declare".
4. Claim to refute: "Adding the autoencoder's reconstruction error as a feature to the supervised model must help, because it carries information about rarity the model lacks." Refute with W1B's numbers and the mechanism (the supervised model already sees the deviation features; rarity ≠ fraud); name what would have to be true (a fraud type absent from the labels) for the gain to appear.
5. Research-shaped: on the simulator, train the 15-100-20-100-15 AE on genuine rows of the training block and report AUC/AP/CP@100 on the test week with the module-2 harness; compare with 0.836 / 0.18 / 0.217.
6. FORWARD (E7): list the ten highest-reconstruction-error genuine transactions and the ten highest-scored by the supervised FFNN; compute the overlap of their cards with the cards of known frauds' counterparties (same terminal within 7 days) — the reader notices rarity in the AE list and shared terminals in the supervised list, and asks what the terminal's other customers would add → lands on `fraud-as-a-graph`.
7. Mixed review (E3): place iForest, LOF, ν-SVM and AE in the framework table (anomaly-detection-framing): assumption, regime, train cost, test cost; then state which one the budget k makes operationally usable at 400k rows/day.

## ARC
- Inherits: the framework and the distance/isolation scores; the MLP machinery (neural-tabular-detectors); classical-ml's SVM and PCA.
- Contributes: boundary and reconstruction scores with their numbers, the mechanism of low precision, the semi-supervised null result.
- Hands off: the ULB application (next) and the lab's AE half; the graph as the missing context (module 6); score fusion in the stack (module 11).
- Spine step 5: the unlabeled frontier.
