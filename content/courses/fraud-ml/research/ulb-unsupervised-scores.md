# Unsupervised scores on the ULB credit-card set — research brief (module 5 APPLICATION)

Lesson: `ulb-unsupervised-scores` (module: anomaly, core, planned). NEW. Module-final application (L16): the public ULB set and two canon student artifacts (HKU A1 Part II, CS6890 PS4) read against the module.
Goal: Evaluate Isolation Forest, an autoencoder and a k-means cluster rule on the ULB credit-card data against a supervised baseline, and explain why a cluster that is 71% fraud still floods the queue.

## Sources
- HKU FITE7410 A1 answer Part II and code (primary artifact): 70/30 split, then SMOTE and ROSE on the train split; drop Time and Class; scale; elbow (k = 3 under SMOTE, k = 4 under ROSE); kmeans nstart = 25; PCA cluster plot; class by cluster; naming fraud clusters; assigning test points to the nearest centre (custom predict.kmeans by squared Euclidean distance); confusion-matrix evaluation — test fraud share in the best cluster ~71% (SMOTE) / 66% (ROSE) against a base rate ~0.2%; recall near 1, precision and F1 near 0; SMOTE 60,512 true negatives vs ROSE 43,334; the proposed fixes (alert only cluster 2; LR or an ensemble inside clusters); the report's own notes: recall/precision definitions swapped in the text; resampling before clustering leaks the resampler into the clusters.
- CS6890 PS4 (artifact): AE then VAE on the 284,807-row set, 30 attributes, log-scaling Time and Amount, F1 on a test split; the student designs architecture and loss. PS5 (VAE synthesis of 2M rows) — mentioned as out of scope.
- Dal Pozzolo 2015 Sec. VI (the set's provenance; β floor 0.00173; undersampling improves AUC, worsens Brier — p′ fixes).
- Handbook Ch7 Autoencoders (the simulator numbers for comparison: AE 0.836 / 0.18 / 0.217; iForest 0.808 / 0.164 / 0.19; FFNN 0.859 / 0.646 / 0.28).
- Liu 2008 Sec. 1 (credit-card fraud as the first application) and Sec. 5.4 (training on normal only).
- Canonical-datasets brief: ULB has no entity, no history beyond 48 h, PCA'd features — what the set cannot test.
- Module 2 harness: AP and P@k on a forward split by Time (the set's only clock); CP@k impossible (no card id).

## Key points
1. The artifacts read: HKU's k-means pipeline step by step with its results; CS6890's AE/VAE brief; both as what the canon makes students build (the lab follows).
2. The cluster rule's arithmetic: base rate 0.17–0.2%; a cluster whose test members are 71% fraud is a 350× lift in precision — and "alert the cluster" still produces recall ≈ 1 with F1 ≈ 0 because the OTHER clusters, named non-fraud, are alerted too (the student's rule alerts every cluster above a share threshold; the 71% cluster is small). Recompute precision at the budget: alert the 71% cluster only — precision 0.71 at a recall that the lesson computes from the student's confusion counts.
3. Resampling before clustering: SMOTE/ROSE on the training split change the geometry the elbow sees (3 vs 4 clusters), and the cluster labels encode the resampler; the honest version clusters the raw training rows and reads labels afterwards. The classical-ml leakage lesson in an unsupervised setting.
4. The three scores compared on a forward Time split with the harness: iForest, AE (trained on genuine training rows), k-means distance-to-centre; AP and P@k per "day" (the set's two days split into hourly budgets); the supervised LR/GBM ceiling; the module's refrain quantified on real data: AUC respectable, AP a fraction of the supervised AP. (Numbers computed on our run; the handbook's simulator numbers quoted beside them.)
5. What the ULB set cannot test (L16 departures): no entity → no profiles, no CP@k, no terminal windows; PCA'd features → no semantic reading of what the AE learns; 48 hours → no delay, no drift; labels near-complete (disputes) — the one place where "unlabeled fraud" is not the real problem, so the unsupervised scores are being asked a question the set has already answered.
6. The canon's scoring choice (F1 at 0.5 in PS4; confusion matrices in HKU) against the module's: thresholds without a budget; the lesson re-scores the same models under AP and P@k and shows the ranking change.

## Set pieces & gems
- 71% fraud in a cluster vs 0.2% base rate — and F1 ≈ 0.
- Elbow 3 vs 4 depending on the resampler.
- predict.kmeans by hand (no predict method in R's kmeans).
- Log-scaling Time and Amount (PS4's one hint).
- "The set's two days" as the budget axis — hourly k.

## Pitfalls
- Student artifacts are evidence of what the canon assigns, not authorities on method; keep that reading dry and explicit.
- Our numbers on ULB must be computed and labelled as ours; the handbook's are simulator numbers.
- No VAE build here.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of the cluster rule: (1) PCA scatter of the training rows with k = 3 centres, (2) class mix per cluster as stacked bars, (3) test points assigned to nearest centres, (4) the confusion matrix of "alert the fraud-named clusters" with recall ≈ 1 and precision ≈ 0 written as tallies. Inspired by HKU Figs 14–17 (recreated on our run). Key image.
- draw: Elbow curves under raw / SMOTE / ROSE preprocessing as three lines — the knee moving. Computed.
- draw: Score distributions (iForest, AE error, k-means distance) for genuine vs fraud on log scale, three small panels. Computed on ULB.
- draw: AP and P@k (hourly budget) for the three unsupervised scores and the supervised baseline as a dot plot with the simulator numbers beside as hollow markers. Computed + quoted.
- draw: The "what ULB cannot test" card: the dataset's columns with the missing fields (card id, terminal, day axis, label delay) drawn as empty slots.
- draw: PR curves of the four scores on the forward split with random AP = 0.0017 as the floor — computed.

## EXERCISE PLAN
1. Warm-up: from HKU's reported counts (true negatives 60,512 vs 43,334; test size ≈ 85,443; 148 frauds in the test split) compute the false-positive counts and the precision of the two cluster rules.
2. Boundary probe: k = 1 and k = N in the cluster rule — what "alert the fraud cluster" becomes in each; which k the elbow method cannot choose and why.
3. Claim to refute: "The 71%-fraud cluster proves k-means found the fraud structure; deploying the cluster rule would catch 71% of frauds with 71% precision." Refute by separating the cluster's precision from the rule's (the rule alerts other clusters too), and by the test-set balancing in HKU's split; name the two numbers conflated.
4. Research-shaped: reproduce HKU's pipeline on the ULB set WITHOUT resampling and report the elbow, the per-cluster fraud share and the precision of "alert the best cluster only" at its own recall.
5. Derivation the lesson skipped: show that assigning test points to the nearest centre and alerting cluster c has precision equal to the cluster's test fraud share, and derive the recall as (frauds in c)/(all frauds); then show why maximising share over clusters is maximising precision at a cluster-sized budget.
6. FORWARD (E7): compute the iForest score's AP on ULB and then on a copy where the 28 PCA components are replaced by the same rows' two raw columns (Time, Amount) only — the reader sees the score collapse and asks which features an unsupervised method needs → lands on module 6's graph context (what the PCA hid: counterparties) and back to module 3's aggregates.
7. Mixed review (E3): apply the β correction (imbalance-techniques-revisited) to a supervised LR trained on HKU's SMOTE'd split and compare its AP before/after (unchanged) and its Brier score (changed).

## ARC
- Inherits: the four scorers (this module), the harness (module 2), the dataset card (canonical-datasets), classical-ml's k-means.
- Contributes: the module cashed out on real card data and on two canon assignments — the lift-vs-precision arithmetic of the cluster rule, the resampling leak in clustering, the unsupervised-vs-supervised gap under AP.
- Hands off: the lab (next); the context the set lacks → module 6; the budget framing → score-to-action.
- Spine step 5: the unlabeled frontier.

## APPLICATION (L16)
- Artifact: the ULB 2013 credit-card dataset (Kaggle) and the HKU FITE7410 A1 Part II / CS6890 PS4 student pipelines run on it.
- Module results used: label regimes and the rarity assumption (anomaly-detection-framing); distance-to-centre as a clustering-family score and standardisation (density-and-distance-scores); the iForest score and sub-sampling (isolation-forest); the AE reconstruction error and the low-precision mechanism (one-class-and-reconstruction); AP/P@k on a forward split (module 2).
- Departures from the idealisation: no entity or history, PCA'd features, 48 hours, near-complete labels (disputes), a resampled training split in the canon artifact, F1-at-0.5 scoring in the canon; CP@k impossible.
