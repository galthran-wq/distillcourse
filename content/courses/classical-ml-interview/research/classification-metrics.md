# Research brief: classification-metrics (Classification metrics: ROC, precision–recall, and calibration)

status: planned
module: evaluation
type: core
goal: Select the right classification metric for a task and compute confusion-matrix, ROC, PR, and calibration quantities by hand.

Among the highest-frequency interview topics in the course; every DS loop
asks some version of "which metric and why".

## Sources to consult

- Murphy **§5.1.3–5.1.6** — the definitive reference: Tables 5.3–5.5 (raw /
  row- / column-normalized confusion matrices defining TPR, FPR, PPV, NPV,
  FDR, FOR in one place); ROC + AUC + EER (5.1.3); the explicit statement
  that ROC is class-imbalance-invariant while PR is not (5.1.3.3/5.1.4.4);
  precision–recall, average precision, F-beta and why harmonic mean (5.1.4);
  proper scoring rules, log-loss, Brier (5.1.6).
- Bishop **§1.5** — the 1-in-1000 cancer base-rate gem (99.9% accuracy by
  predicting 'normal'); loss matrices; the reject option (5.1.2.3 in Murphy:
  IBM Watson buzzing only when confident — usable one-liner).
- StatQuest "ROC and AUC, Clearly Explained" — the threshold-walk teaching
  device (slide a threshold across two score histograms, re-derive the
  confusion matrix each stop) and the Ebola-screening rationale for
  threshold ≠ 0.5. Recreate mechanics, dry register.
- Ace the DS Interview ch. 7 — "Uber: metrics for fraud detection with rare
  positives" as the anchor exercise.
- Huyen **§7.3** — the 30/20/5/40 confusion-matrix hand computation;
  F1-vs-accuracy phrasing calibration.

## Key points the lesson must cover

1. Open with the base-rate failure (Bishop's cancer number, L4): accuracy is
   the wrong question when classes or costs are asymmetric.
2. **The confusion matrix as the master object**: one fully labeled 2×2 with
   ALL derived rates named and computed on one running numeric example
   (~1000 cases, 1:9 imbalance). Sensitivity=recall=TPR, specificity=TNR,
   precision=PPV — the synonym table interviewers expect fluency in.
3. **Threshold sweep → ROC**: classifiers output scores; each threshold is
   one confusion matrix; trace TPR vs FPR. AUC: area AND the ranking
   interpretation (P(score+ > score−), tie to concordance); diagonal =
   chance; EER one sentence.
4. **PR curves**: precision vs recall over thresholds; baseline = prevalence
   (not 0.5); why PR moves and ROC barely does when positives are 1:1000 —
   the worked comparison (FPR denominator is huge). F1 and F-beta; why
   harmonic (punishes imbalance between P and R; the 0.9/0.1 example).
5. **Proper scoring and calibration**: log-loss (= cross-entropy, spiral to
   logistic-regression) and Brier; reliability curves (bin predictions, plot
   observed frequency); why AUC can be great while probabilities are junk;
   Platt/isotonic one sentence each.
6. **Choosing**: a decision table — balanced+cost-symmetric → accuracy is
   fine; rare positives, care about found fraction → PR/recall@precision;
   ranking use-case → AUC; probabilistic decisions downstream → log-loss +
   calibration; explicit costs → expected-cost threshold p* = c_FP/(c_FP+c_FN)
   style (Murphy 5.1.2.2 rule).

## Interview questions to work as exercises

- Huyen's 30/20/5/40 matrix: compute accuracy, precision, recall, F1, TPR,
  FPR by hand.
- "Uber fraud: 0.1% positives. Which metrics and why not accuracy/ROC-AUC
  alone?" (full reasoned answer, PR + recall@precision + cost view)
- "Interpret AUC = 0.85 in one sentence." (ranking probability)
- "Precision 0.9, recall 0.1: what is F1 and what does it tell you?"
  (harmonic ≈ 0.18 vs arithmetic 0.5 — the punchline)
- "When would you deliberately move the threshold off 0.5?" (cost asymmetry,
  imbalance; compute the cost-minimizing threshold for given c_FP/c_FN)
- "Model A has better AUC, model B better log-loss. Which ships?" (depends on
  use: ranking vs probability consumers; calibration argument)
- "Design the evaluation for a cancer screen at 1/1000 prevalence." (E3:
  spaced link to Bayes-rule/base rates from mle-map exercises)

## Pitfalls / subtleties to flag

- Precision depends on prevalence; TPR/FPR do not — this single fact explains
  the whole ROC-vs-PR debate. Make it a KeyFact.
- AUC is threshold-free and imbalance-insensitive — which is exactly why it
  can hide uselessness at deployable thresholds under heavy imbalance.
- F1 ignores TN entirely; do not use it when negatives matter symmetrically.
- Accuracy at threshold 0.5 on resampled/reweighted training data is
  incoherent — priors shifted; forward ref to imbalance-leakage.
- Micro vs macro averaging for multiclass — one Remark, one formula each.
- Log-loss explodes on confident wrong predictions — clipping note.

## FIGURE PLAN

1. **single `<Figure>`** — the master confusion matrix: 2×2 with counts from
   the running example; every derived rate written at its row/column margin
   with the synonym stack (recall=TPR=sensitivity). Inspiration: Murphy
   Tables 5.3–5.5 collapsed into one graphic.
2. **`<FigureSequence>` (4 frames)** — the threshold walk: two overlapping
   score histograms; a vertical threshold sweeps right in 4 stops; each frame
   shows the induced confusion matrix and plants one new point on a growing
   ROC inset. Delta = threshold position. Inspiration: StatQuest ROC walk.
3. **single `<Figure>`** — finished ROC: three curves (good/mediocre/chance)
   with AUC tallies and the ranking interpretation stated in the caption
   band; EER marked on one. Inspiration: Murphy Fig 5.2a.
4. **single `<Figure>`** — the imbalance stress test: same classifier at 1:1
   vs 1:100 shown as ROC pair (nearly identical) above PR pair (collapsing
   precision), with the FP/TP counts annotated to show why. Inspiration:
   Murphy 5.1.4.4. One idea: PR feels prevalence, ROC does not.
5. **single `<Figure>`** — F-score geometry: harmonic vs arithmetic mean over
   the (P,R) square as level curves; the (0.9,0.1) point landing on F1≈0.18.
6. **single `<Figure>`** — reliability diagram: predicted-probability bins vs
   observed frequency for an overconfident model and a calibrated one;
   Brier/log-loss tallies beside each. Inspiration: Murphy §5.1.6 /
   Fig 12.2's calibration idea.
