# Unsupervised scores on the ULB credit-card set — research brief

Lesson: `ulb-unsupervised-scores` (module: anomaly, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. Module-final APPLICATION lesson.
Goal: Evaluate Isolation Forest, an autoencoder and a k-means cluster rule on the ULB credit-card data against a supervised baseline, and explain why a cluster that is 71% fraud still floods the queue
Opening (verbatim, the lesson must start with it): On the public two-day credit-card set, a k-means cluster picked for its fraud share is 71% fraud on the test split, against a base rate of 0.2%. Alerting every member of that cluster still floods the queue. What do isolation, reconstruction and clustering scores actually deliver on real card data, judged by the metrics investigators use?

## Sources to consult
- HKU FITE7410 Assignment 1, Part II and its student answer — research/texts/hku-fite7410-a1q.txt (the spec: 25% k-means cluster analysis on the ULB creditcard set), hku-fite7410-a1a.txt Part II Steps 1–6 (70/30 split, SMOTE and ROSE on train, drop Time and Class, scale; elbow k = 3 under SMOTE and k = 4 under ROSE; nstart = 25; PCA cluster plot; naming clusters by fraud share; assignment of test points to the nearest centre; confusion matrices: ≈71% fraud in the best cluster under SMOTE, 66% under ROSE, recall near 1, precision and F1 near 0; 60,512 true negatives vs 43,334), hku-fite7410-a1code.txt (predict.kmeans by squared distance to centres; the recall/precision definitions are swapped in the text — correct them).
- CS6890 Problem Statement 4 — research/texts/cs6890-ps4.txt (autoencoder then VAE on the 284,807-row set, log-scale Time and Amount, evaluate by prediction score and F1 on test; no marks scheme).
- Dal Pozzolo et al. 2015 Sec. VI end and footnote 1 (the dataset: two days of September 2013, 492 frauds / 284,807, 28 PCA components, Time and Amount; minimum β ≈ 0.00173) — research/texts/staged-dalpozzolo2015-calibrating-undersampling.txt.
- Handbook Ch7 Autoencoders (the AE and IF recipes and the simulator numbers to compare against) — research/texts/reproducible-Chapter_7_DeepLearning_Autoencoders.md; Ch2.4's note that the Kaggle set is the only public card data, two days and obfuscated — reproducible-Chapter_2_Background_MachineLearningForFraudDetection.md.
- Chandola et al. 2009 Sec. 6.1 (clustering forces every point into a cluster; anomalies hidden in large clusters; anomaly clusters undetected) — research/texts/anomalydetec-s1-.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The module's three scores have only been run on the simulator, whose frauds were planted by three rules. The one public set of real card payments is 284,807 rows over two days with 492 frauds (0.172%), 28 PCA components with no names, Time in seconds and Amount — no cardholder, no terminal, no history. Two university assignments run unsupervised methods on it: one clusters the rows with k-means and reads clusters as fraud or not, the other trains an autoencoder and a variational autoencoder and scores by F1. The published student run finds a cluster that is 71% fraud on the test split, 350× the base rate, and still reports precision near zero. The newcomer needs to see why both facts are true at once, what each unsupervised score delivers under AP and precision at a budget (not F1 at 0.5), and which of the module's conclusions this two-day, entity-less set can and cannot test.

### Chain of sub-problems
1. **The artifact and what it is.** — The dataset's provenance (released with the undersampling-calibration paper; two days; PCA'd for confidentiality; the only public real card data); the two assignments that run on it; what "the artifact" means here: two coursework pipelines whose outputs the lesson reproduces and re-scores. Because: an application lesson reads a real thing against the module's results.
2. **Clustering as a detector: the student pipeline.** — Obvious attempt: k-means on the 28 components, pick k by the elbow, call the fraud-heavy clusters "fraud clusters", assign test rows to the nearest centre. Why it half-works: the elbow gives k = 3 under SMOTE and k = 4 under ROSE; the best cluster is 71% (SMOTE) or 66% (ROSE) fraud on the test split against 0.2%. Why it still fails: assigning a whole cluster is a rule with recall near 1 and precision and F1 near 0, because a cluster of thousands of rows holds a few hundred frauds and the rest are genuine rows that look like them — 60,512 true negatives under SMOTE vs 43,334 under ROSE says how many genuine rows each version drags in. Because: a cluster is a region, not a ranking; module 2's lesson that a budget needs a ranking applies — the fix the student proposes (alert only the purest cluster) is a crude threshold on a crude score.
3. **Where the resampling went wrong.** — The pipeline resamples (SMOTE, ROSE) *before* clustering, so the clusters are shaped by synthetic points that do not exist on the test split; the elbow moves with the resampler (3 vs 4). Because: resampling belongs inside the training fold of a supervised pipeline (module 2); applied before an unsupervised step it writes the resampler's geometry into the clusters. The lesson re-runs k-means without resampling and reports what the "fraud cluster" becomes.
4. **Scores, not regions: the module's three scorers on the same split.** — Run Isolation Forest, the autoencoder (trained on the training split's genuine rows, Time and Amount log-scaled as the other assignment suggests) and a Mahalanobis/cluster-distance score, and the supervised baseline (a logistic regression or boosted tree on the same split); score all by AUC, AP and precision at k = 100 per day (two days) — the metrics the module uses, not the assignments' F1 at threshold 0.5. Expected shape (to be computed by the writer, not asserted from the dossier): AUC high for every unsupervised scorer, AP an order of magnitude below the supervised one — the simulator's pattern again on real data. Because: F1 at 0.5 on a 0.17% base rate answers no operational question; the assignments' own metric hides what the module's metrics show.
5. **Why AUC flatters here.** — The 28 components are orthogonal directions of maximal variance of mostly genuine rows; frauds that are extreme on any component get isolated early and reconstructed badly, so they rank above almost all genuine rows — AUC high. The frauds that sit inside the genuine cloud (the ones a cardholder's history would expose) rank with the genuine rows; the top 100 fills with extreme-but-genuine rows — AP low. Because: this is lesson 1's "outside normal is not toward fraud" measured.
6. **What the set cannot test.** — No cardholder or terminal: no contextual feature, no card precision, no known-card removal, no profile deviation; two days: no delay block, no drift, no feedback loop; PCA'd features: no explanation. Because: every method of modules 3, 7 and 8 is untestable here, which is why the course's main case study is the simulator plus the Worldline replays, and why a result on this set generalises less than its popularity suggests.
7. **How do we know it works.** — The closing table (three unsupervised scorers, one supervised, three metrics) and the verdict: an unsupervised score is a second queue for what the supervised model never saw, and on this set it is not a replacement for it.

### Set pieces and worked examples to recreate
- The student's k-means result: elbow at k = 3 (SMOTE) and 4 (ROSE); best cluster 71% / 66% fraud on test; recall ≈ 1, precision and F1 ≈ 0; 60,512 vs 43,334 true negatives (HKU A1 answer, Part II Steps 2–5).
- The hand-written predict.kmeans by squared distance to the centres, because the library's kmeans has no predict (HKU A1 code, end of Part 2) — reuse in the lab.
- The dataset facts: 284,807 / 492 / 0.172% / 30 attributes; two days of September 2013; minimum β ≈ 0.00173 (Dal Pozzolo 2015 Sec. VI; CS6890 PS4).
- The CS6890 nudge: log-scale Time-difference and Amount before the autoencoder (CS6890 PS4).
- The simulator's three-way table (AE 0.836 / 0.18 / 0.217; IF 0.808 / 0.164 / 0.19; supervised 0.859 / 0.646 / 0.28) as the comparison row (Handbook Ch7 Autoencoders).
- The resampling-before-clustering leak as a teaching counter-example; the target-encoding leak in the sibling assignment (HKU A2 code) as a second one.

### Pitfalls and terms to define
- "Fraud share of a cluster" is a precision of a rule that alerts the whole cluster — say so; the newcomer will read 71% as a model precision.
- F1 at threshold 0.5 vs AP: define once why the assignments' metric is not the module's (Ref to module 2).
- The recall/precision definitions in the student report are swapped (precision printed as TP/(TP+FN)); the lesson uses the correct ones and does not reproduce the error.
- ROSE: a resampler that draws from a smoothed density (kernel) around existing rows — define at first use since classical-ml covered SMOTE only.
- The 28 components are anonymous; the lesson never invents meanings for V1…V28.
- Two days means "per day k = 100" is two numbers; report both and the mean.

### Recalled, not re-taught
- k-means, elbow, SMOTE (classical-ml): one clause each.
- The three scorers' definitions (`density-and-distance-scores`, `isolation-forest`, `one-class-and-reconstruction`): Refs only.
- AP, P@k and why not F1 (`alert-budget-metrics`); resampling inside the fold (`imbalance-techniques-revisited`); the dataset's provenance (`canonical-datasets`): Refs.

## FIGURE PLAN
- draw: the base-rate bar — 284,807 rows, 492 frauds, drawn as a 1,000-row strip with 1.7 red cells — single <Figure>; the number the reader must hold.
- draw: <FigureSequence>, 3 frames: the PCA-plane scatter of the test split, (1) coloured by k-means cluster, (2) the "fraud cluster" highlighted with its fraud share 71%, (3) the same cluster drawn as the alert set, with its thousands of genuine members shaded — the flood made visible; inspired by the student's Figs 14–16. **Key image.**
- draw: elbow curves under no resampling, SMOTE and ROSE on one axis, with the three chosen k marked — single <Figure>; inspired by the student's Fig. 13, recomputed.
- draw: the per-day precision-at-100 and AP of the four scorers as grouped bars, with AUC as a second panel — single <Figure>; computed by us.
- draw: "what the set cannot test" as the course's loop diagram (module 1's layers and clocks) with the parts the dataset lacks greyed out — single <Figure>.
- draw: reconstruction-error histograms of genuine vs fraud rows of the ULB test split on a log axis, with the k = 100 cut — single <Figure>; the simulator picture redone on real data.

## EXERCISE PLAN
1. [warm-up] From the student's confusion matrix counts, compute precision, recall and F1 correctly (the report's definitions are swapped) and the queue size the cluster rule produces per day.
2. [boundary probe] k = 1 and k = n for the cluster rule: what is the "fraud cluster", its fraud share and its queue in each limit — and why no k turns a region into a ranking.
3. [claim to refute] "A cluster that is 71% fraud on the test split is a detector with 71% precision." Refute: name the queue size and the budget; show that precision at k = 100 inside the cluster needs a within-cluster ranking the rule does not have.
4. [research-shaped] Reproduce the student's k-means with and without SMOTE (same seed policy, same split) and report how the elbow and the best cluster's fraud share move — the resampling leak measured.
5. [derivation skipped] Show that assigning a test row to the nearest k-means centre and scoring by distance to its centre is the clustering family's assumption (2) from `density-and-distance-scores`, and that scoring by the cluster's training fraud share is a different (supervised) rule — name which labels each uses.
6. FORWARD → `anomaly-scorers-lab`: train the module-4 MLP on the ULB training split and report its AP on the test split; this is the ceiling the lab's two unsupervised scorers are measured against.
7. [mixed review] Using `undersampling-calibration`: the student balanced the training split before clustering; if instead a classifier were trained on the balanced split, compute β and the correction that returns its probabilities to the 0.172% prior.

## ARC
- Spine step 5 "The unlabeled frontier": "Supervised models detect only the fraud they were shown; new fraud enters as a departure from normality scored by distance, isolation or reconstruction, which buys a decent ROC-AUC and a poor precision — a complement to the supervised score, not its replacement."
- Inherits: every scorer of the module; the metrics and the resampling-inside-the-fold rule of module 2; the dataset's provenance (`canonical-datasets`).
- Contributes: the module's results checked on the one public real card set, the cluster-as-detector failure explained, the list of what the set cannot test.
- Hands off: the ULB split, the log-scaling and the supervised ceiling to `anomaly-scorers-lab`; "what this set lacks" to module 6 (entities and the graph) and module 7 (time).
- APPLICATION spec: the artifact is the pair of coursework pipelines on the ULB set (k-means cluster analysis; autoencoder/VAE scored by F1), reproduced and re-scored. Module results used: the family/assumption table and "outside normal is not toward fraud" (`anomaly-detection-framing`), the clustering family's assumptions and Mahalanobis in the PCA subspace (`density-and-distance-scores`), the forest (`isolation-forest`), the autoencoder and the AUC-decent/AP-poor expectation (`one-class-and-reconstruction`), AP and P@k (`alert-budget-metrics`), resampling inside the fold (`imbalance-techniques-revisited`). Departures from the idealisation: no entity, no time axis beyond two days, PCA'd anonymous features, labels from disputes with unknown completeness, no delay block and no feedback loop — the set tests scores, not systems.
