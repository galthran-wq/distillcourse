# Lab: an Isolation Forest and an autoencoder from scratch — research brief

Lesson: `anomaly-scorers-lab` (module: anomaly, type: lab, planned). NEW.
Goal: Build an Isolation Forest and a numpy autoencoder as anomaly scorers, verify each against the paper's constants and a finite-difference referee, and score the ULB credit-card set under average precision.

## ARC
- Inherits: path length, c(n), the score and sub-sampling (isolation-forest); the AE architecture and reconstruction error (one-class-and-reconstruction); the MLP forward/backward (neural-tabular-detectors); the harness (cost-aware-evaluation-lab); the ULB reading (ulb-unsupervised-scores).
- Contributes: both scorers as verified code — the paper's constants reproduced, the truncated-leaf adjustment implemented, the AE gradient refereed — and the module's refrain measured by the learner (AUC decent, AP low).
- Hands off: the scorers as a module the capstone may stack (score fusion W1A); the numpy backprop reused for the GCN lab.
- Spine step 5 (final item): "…a complement to the supervised score, not its replacement."

## LAB PLAN

Artifact: one notebook producing `anomaly.py`-style tooling — `c_of_n`, `iforest_score`, `ITree`, `path_length`, `IsolationForest`, `Autoencoder` (forward, loss, backward, train) — exercised on the paper's toy geometries and on the ULB credit-card set, ending with an AP target on a held-out split.

CANON GROUNDING: modelled on CS6890 PS4 (dossier: "fraud detection with an autoencoder and a variational autoencoder on the 284,807-transaction credit card dataset, scored with prediction score and F1 … student must justify architecture and loss; log-scaling of Time and Amount") and on HKU FITE7410 A1 Part II (dossier: "cluster analysis on the ULB creditcardfraud … assigning test points to the nearest centre … confusion-matrix evaluation") for the dataset and the "unsupervised scorer on ULB" shape; the Isolation Forest half extends the canon with Liu et al.'s algorithms 1–3, which the course's isolation lesson derives and which the handbook uses as its unsupervised baseline. Departures: the VAE is dropped (one scorer per family is the lesson; PS5's synthesis is out of scope); F1 at 0.5 is replaced by AP and P@k (the module's claim); the k-means rule becomes a shipped baseline cell, not a checkpoint; the AE is numpy with a finite-difference referee rather than a framework call, because the gradient is the content.

Dataset: `data/ulb_train.csv` (≈ 60k genuine rows + all training-split frauds from the first 36 hours, 31 columns, ≈ 10 MB — if too large, 30k rows) and `data/ulb_holdout_features.csv` (≈ 20k rows from the last 12 hours, features only); holdout labels in `private/`. Source: the Kaggle "Credit Card Fraud Detection" dataset (ULB, Dal Pozzolo 2015), licence stated on Kaggle as Database Contents License (DbCL) v1.0 — the human confirms shipping an extract (issue gate); fallback is the reduced simulator (features from the module-3 lab). Toy fixtures: a seeded 135-point Gaussian with one planted outlier (Fig. 1's geometry); a seeded Mulcross-style cloud with two dense anomaly clusters.

Checkpoints (plan; lab-author may split or deepen):
1. `path-normaliser` (exact, warm-up): c(n) = 2H(n − 1) − 2(n − 1)/n with H(i) = ln i + γ (γ = 0.5772156649), c(1) = 0, c(2) = 1; and s(E[h], n) = 2^{−E[h]/c(n)}; verified at n ∈ {2, 16, 256, 4096} and seeded E[h]; wrong variants: H(n) instead of H(n − 1); natural vs base-2 exponent.
2. `itree-build` (exact): a random iTree on a seeded sub-sample (random attribute, uniform split between the node's min and max, stop at singleton / all-equal / height limit ⌈log₂ ψ⌉), returning a nested structure whose split sequence under the seed is digested; wrong variants: split drawn from the global range instead of the node's; no height limit.
3. `path-length` (exact): h(x) through a tree, adding c(Size) at a truncated external node; verified on the seeded tree for a batch of points; consumes 2; wrong variants: no c(Size) adjustment; counting nodes instead of edges.
4. `iforest-score` (exact): t = 100 trees on ψ = 256 sub-samples drawn without replacement, mean path length, score per point; verified on the 135-point toy (planted outlier's score > 0.6, mean of normals < 0.5) and on the Mulcross-style cloud (the anomaly clusters' mean score rises when ψ drops from N to 128 — the local assert); consumes 2, 3; wrong variants: one sub-sample shared by all trees; sampling with replacement; normalising by ψ's c but scoring paths built on N.
5. `autoencoder-forward-loss` (exact): forward pass of a tied-weight 30 → 20 → 8 → 20 → 30 autoencoder (ReLU hidden, linear output) and MSE loss on a seeded batch; wrong variant: loss averaged over rows only (not columns).
6. `autoencoder-gradient` (exact): backprop for the tied-weight AE, refereed by a finite-difference cell the learner runs locally; server checks the gradient on a seeded batch; consumes 5; wrong variants: tied-weight gradient missing the transpose term; ReLU derivative at 0 mishandled (sign).
7. `train-autoencoder` (exact): Adam loop on genuine training rows (log1p on Time-difference and Amount, standardise on training stats), early stopping on a genuine validation slice; verified by the loss decreasing (local assert) and by the reconstruction-error digest on a fixed seeded batch after a fixed number of steps; consumes 5, 6; wrong variants: training on all rows including frauds; standardising with holdout statistics.
8. `why-auc-flatters` (review, optional): the learner's account of why both scores reach a respectable ROC-AUC and a poor AP on ULB; rubric requires "rare genuine rows score high too, and under a budget they fill the top ranks" or equivalent; "imbalance" alone insufficient.
9. `beat-ap-bar` (metric, optional, LAST): AP on the holdout split from either scorer or any fusion (W1A allowed); threshold calibrated so the reference iForest clears it by ≥ 0.02 and a Mahalanobis baseline (shipped) does not (reference AP on ULB for iForest ≈ 0.15–0.25 depending on split — to calibrate; the handbook's simulator AE is 0.18).

Final open task: checkpoint 9 — metric AP; rough threshold ≈ 0.15 (calibrate on the reference run).

Known-wrong variants: H(n) vs H(n − 1); global-range splits; missing c(Size); shared sub-sample; sampling with replacement; untied gradient; ReLU derivative sign; training on frauds; test-statistics standardisation.

NOT blanked (ship complete): data loading and the log1p/standardise helper, the k-means cluster-rule baseline (HKU's pipeline as a reference cell), the Mahalanobis baseline, the finite-difference referee, the harness import (AP, P@k), plotting (score histograms by class on log scale; AUC-vs-ψ curve; loss curves correct and diverging).

est_hours: 4.5. Progression: warm-up (1) → two composing chains (2 → 3 → 4; 5 → 6 → 7) → one open metric last (9) → review garnish (8). Required: 1–7.
