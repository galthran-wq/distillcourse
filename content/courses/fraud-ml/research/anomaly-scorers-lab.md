# Lab: an Isolation Forest and an autoencoder from scratch — research brief

Lesson: `anomaly-scorers-lab` (module: anomaly, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Build an Isolation Forest and a numpy autoencoder as anomaly scorers, verify each against the paper's constants and a finite-difference referee, and score the ULB credit-card set under average precision
Opening (verbatim, the lesson must start with it): Two scorers that use no labels — random isolation trees and a reconstruction network — built from the formulas, checked against the paper's constants and a finite-difference referee, and ranked on the real card set by average precision.

## Sources to consult
- Liu, Ting, Zhou 2008 — Sec. 2 (c(n) Eq. 1, score Eq. 2, Fig. 1's 12.82 / 4.02), Sec. 4.1 Algorithms 1–2 (iForest, iTree with height limit ⌈log₂ψ⌉, ψ = 256, t = 100), Sec. 4.2 Algorithm 3 (PathLength with e + c(Size) at a truncated external node), Sec. 3 (swamping and masking) — research/texts/isolationfor-.txt.
- Handbook Ch7 Autoencoders (15-100-20-100-15, MSE score, genuine-only training, the IF and AE simulator numbers; the code's non-registered layer lists and deprecated calls the lab must not inherit) — research/texts/reproducible-Chapter_7_DeepLearning_Autoencoders.md; Ch7 FeedForwardNeuralNetworks (training loop, early stopping, scaling) — reproducible-Chapter_7_DeepLearning_FeedForwardNeuralNetworks.md.
- CS6890 PS4 and HKU A1 Part II (the canon assignments; the log-scaling nudge; predict.kmeans) — research/texts/cs6890-ps4.txt, hku-fite7410-a1q.txt, hku-fite7410-a1a.txt, hku-fite7410-a1code.txt.
- Chandola et al. 2009 Sec. 4.1 (replicator network score δ_i) — research/texts/anomalydetec-s1-.txt.
- The lab-author conventions: .claude/skills/lab-author/references/conventions.md; the module-2 harness built in `cost-aware-evaluation-lab` (average_precision) is imported, not rebuilt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has the formulas of two label-free scorers and the module's numbers for both on the simulator and on the ULB set. The lab asks them to build each from its definition, in numpy, and to prove each build right by a check that does not depend on their own code: the forest against the paper's constants (c(n) at fixed n; the 12-vs-4 cut counts on the paper's kind of Gaussian cloud; the score limits 0.5 / 1 / 0) and the autoencoder's gradient against finite differences. Then both score the ULB test split, and the reader compares their AP with the supervised ceiling from the previous lesson. What they lack is the practice: a recursive tree with a height limit and the c(Size) adjustment is twelve lines that are easy to get subtly wrong (n in the score, the truncation adjustment, sampling with replacement); a tied-weight autoencoder's backward pass is a chain rule they have not written since classical-ml.

### Chain of sub-problems
1. **c(n) and s(x, n) as pure functions** — the harmonic number with the Euler constant; the three limits as asserts. Because: everything downstream is normalised by them, and a wrong c(n) shifts every score silently.
2. **One isolation tree** — recursion on a seeded sub-sample: random attribute, random split uniform between the node's min and max, stop at |X| = 1, equal values or the height limit; store Size at external nodes. Because: the tree is the object the paper defines; the height limit is what makes it a partial model.
3. **Path length with the truncation adjustment** — walk x down, add c(Size) at a truncated leaf. Because: without it, every truncated point reads as an anomaly at height l.
4. **The forest** — t trees on ψ-sub-samples drawn without replacement, mean path, score matrix. Because: the sub-sampling is the detection mechanism, not an efficiency trick.
5. **Autoencoder forward and loss** — a tied-weight 30-16-30 network (ULB has 30 columns after log-scaling Time and Amount) with tanh code, MSE per row. Because: tying halves the parameters and makes the gradient a clean test case.
6. **Backward pass refereed by finite differences** — the chain rule through the tied weights; the referee is shipped complete. Because: the derivation is the checkpoint (the printed formula would make it transcription); the referee judges.
7. **Training on genuine rows only, scoring by reconstruction error** — minibatch gradient steps with a fixed seed and epoch count; the error histogram of genuine vs fraud. Because: this is the semi-supervised regime.
8. **Scoring the ULB test split under AP** — both scorers, the imported step-sum AP, the supervised number as the ceiling; the open task invites any combination.

### Set pieces and worked examples to recreate
- c(2), c(256), c(4096) and the score limits (Liu et al. Eq. 1–2).
- The 135-point Gaussian with one planted outlier: mean path ≈ 4 vs ≈ 12.8 over many trees (Fig. 1).
- The paper's Table 1 BST analogy as the comment explaining c(n) (Sec. 2).
- The handbook's AE error trajectory and fraud/genuine gap as the sanity target on the simulator (Ch7 Autoencoders).
- The ULB base rate and split (284,807 / 492; two days) (Dal Pozzolo 2015; CS6890 PS4).

### Pitfalls and terms to define
- n in s(x, n) is ψ, the sub-sample size each tree saw — the canonical bug.
- Sampling with replacement (bootstrap) is not the paper's sub-sampling; duplicates distort path lengths.
- Forgetting c(Size) at truncated leaves; using the height limit on the whole dataset's size instead of ψ.
- In the autoencoder: forgetting the tied-weight term in the gradient (the transpose contribution), the 1/n in the MSE, tanh's derivative; training on all rows instead of genuine rows (a different regime, different result).
- The labels file must sit in private/; the public data/ carries features only.

### Recalled, not re-taught
- Step-sum AP (`cost-aware-evaluation-lab`): imported.
- The forest's derivation and the AE's definition (`isolation-forest`, `one-class-and-reconstruction`): Refs in the brief; the notebook states the objectives, never the gradient.
- Backpropagation and finite-difference checking (classical-ml prerequisite): one sentence and the shipped referee.

## LAB PLAN

Artifact: one notebook producing `anomaly_scorers.py` — `c_n`, `isolation_score`, `build_itree`, `path_length`, `isolation_forest_scores`, `ae_forward`, `ae_loss`, `ae_backward`, `train_autoencoder`, `reconstruction_scores` — exercised on a seeded 2-D Gaussian toy (the paper's constants), the simulator's test week (sanity against the handbook's direction) and the ULB split (the real result), ending with the learner's best label-free ranking of the held-out ULB rows scored by AP.

CANON GROUNDING: modelled on CS6890 PS4 — dossier: "build and justify an autoencoder, then a VAE, for fraud detection on the ULB credit card data; evaluate with prediction score and F1 on a test split. Student designs architecture and loss. No marks scheme stated" (research/texts/cs6890-ps4.txt) — and on HKU FITE7410 Assignment 1 Part II — dossier: "k-means cluster analysis on the ULB creditcard data (25%) … how k was chosen and cluster names/interpretation … human marking, no autograder" (hku-fite7410-a1q.txt, a1a.txt). Departures: (a) the autoencoder is built in numpy with a finite-difference referee instead of a framework, so the derivation is the checkpoint and the server can verify it; (b) the VAE is dropped — its reparameterisation adds a second derivation with no new anomaly-detection idea for this course, and the assignment itself delegates its justification to lectures we do not have; (c) scoring is by AP and precision at a daily budget, not F1 at 0.5, per module 2; (d) the k-means half of the HKU assignment is reproduced in the previous lesson's exercises, not here — the lab's cluster content is the optional k-means-on-code garnish in the open task; (e) the Isolation Forest half is the course's addition, grounded in the paper's constants and algorithms (Liu et al. 2008 Algorithms 1–3), not in any assignment — included because it is the module's linear-time scorer and its checkpoints are exact.

Dataset / inputs: (1) a seeded 2-D Gaussian toy with one planted outlier, generated in-notebook (complete cell); (2) a reduced handbook-style simulator week as in `cost-aware-evaluation-lab` (complete generator cell) for the direction check; (3) the ULB creditcard set: `data/ulb_features.csv` — a stratified-by-day subset (first day as training pool, second day as held-out, ≈ 60,000 rows total, Time and Amount log1p-scaled plus V1–V28, ≈ 12 MB) with the training-day labels included in `data/` (the learner trains on genuine rows, so they need them) and the held-out day's labels in `private/`. Source: Kaggle "Credit Card Fraud Detection" (ULB MLG), licence stated on Kaggle as Open Database Licence (ODbL) — verify at build time and credit the Machine Learning Group of ULB; the subset is republished under the same licence.

Checkpoints (plan; lab-author may split or deepen):
1. `path-normaliser` (exact, warm-up): `c_n(n)` for n in {2, 16, 256, 4096} and `isolation_score(h, n)` on a seeded array of path lengths; wrong variants: H(n) instead of H(n − 1); natural log without the Euler constant; score with base e instead of 2.
2. `itree-build` (exact, warm-up): `build_itree(X, height_limit, rng)` on a seeded 64×2 sub-sample; verified by the multiset of external-node sizes and depths (the tree structure canonicalised); wrong variants: split drawn from the whole data's range instead of the node's; no height limit; stopping at |X| ≤ 2.
3. `path-length` (exact): `path_length(x, tree)` for a seeded set of query points, including points landing on truncated leaves; consumes 2; wrong variants: no c(Size) adjustment; adding c(Size) at every leaf including singletons (c(1) = 0, so the variant must be at Size = 2 to bite); off-by-one edge count.
4. `iforest-score` (exact): `isolation_forest_scores(X, t=100, psi=256, rng)` on the 135-point Gaussian toy and a seeded 2,000×8 matrix; verified on canonical score vectors and on the toy's outlier scoring above all 135 normals; consumes 1–3; wrong variants: sub-sampling with replacement; n = len(X) instead of ψ in the score; mean of scores instead of score of mean path.
5. `autoencoder-forward-loss` (exact, warm-up for the second half): tied-weight forward pass W, b₁, b₂ with tanh code and linear output, per-row MSE; seeded weights and inputs; wrong variants: MSE without the 1/d factor; untied decoder initialised separately.
6. `autoencoder-gradient` (exact): gradients of the mean loss w.r.t. W, b₁, b₂ on seeded inputs; verified against the server's analytic gradient, with the shipped finite-difference referee as the local assert; consumes 5; wrong variants: dropping the transpose (tied) contribution; tanh derivative as (1 − x²) of the pre-activation; averaging over rows twice.
7. `train-autoencoder` (exact): `train_autoencoder` with a fixed seed, batch size, learning rate and epoch count on the simulator week's genuine rows, returning the final weights and the reconstruction-score vector for the test week; verified by the score vector's digest and by the property that the genuine median error falls below the fraud median; consumes 5–6; wrong variants: training on all rows (fraud included); no feature scaling.
8. `why-auc-flatters` (review, optional): the learner's account of why both scorers reach AUC ≈ 0.8 and AP ≈ 0.17 on the simulator; rubric accepts "off-distribution genuine rows fill the top of the ranking; AUC integrates the whole ranking, AP weights the top"; "unsupervised is weaker" alone insufficient.
9. `beat-ap-bar` (metric, optional, LAST): any label-free scorer or combination (both scores rank-averaged; the forest on the code; k-means distance on the code) on the held-out ULB day, scored by the imported step-sum AP against the private labels; the supervised ceiling from `ulb-unsupervised-scores` is printed beside it.

Final open task: checkpoint 9 — metric AP on the held-out ULB day; rough threshold: the reference forest at ψ = 256, t = 100 on the 30 log-scaled columns, to be measured when the lab is built (the handbook's simulator value is 0.164; on ULB the writer calibrates so that the reference clears the bar by ≥ 0.02 and a forest with n = len(X) in the score or sampling with replacement does not).

Known-wrong variants to declare: listed per checkpoint; the canonical bugs are ψ vs N in the score, sampling with replacement, the missing c(Size), the missing tied-weight gradient term, and training the autoencoder on all rows.

NOT blanked (ship complete): the toy and simulator generators, the ULB loader and log-scaling, the finite-difference referee, the step-sum AP imported from the module-2 harness, plotting helpers (the partition-lines picture for one tree; path-length convergence; error histograms on a log axis; the PR curve), the k-means-on-code helper for the open task.

est_hours: 4.5. Progression: warm-ups (1, 2, 5) → composing chains (2 → 3 → 4; 5 → 6 → 7) → one open metric last (9) → review garnish (8). Required: 1–7.

## ARC
- Spine step 5 "The unlabeled frontier": "Supervised models detect only the fraud they were shown; new fraud enters as a departure from normality scored by distance, isolation or reconstruction, which buys a decent ROC-AUC and a poor precision — a complement to the supervised score, not its replacement."
- Inherits: the forest's constants and algorithms (`isolation-forest`), the autoencoder's definition and the genuine-only regime (`one-class-and-reconstruction`), the ULB split, log-scaling and supervised ceiling (`ulb-unsupervised-scores`), the AP implementation (`cost-aware-evaluation-lab`), backpropagation from classical-ml.
- Contributes: the module's two scorers as verified code, and the reader's own measurement of the AUC-decent / AP-poor pattern on real data.
- Hands off: a numpy network with a refereed gradient as the pattern the graph lab's GCN follows (`graph-propagation-lab`); the reconstruction score as a candidate second queue in the capstone (`pipeline-capstone-lab`).
