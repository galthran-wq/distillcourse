# Research brief: cross-validation-bootstrap (Cross-validation and the bootstrap)

status: planned
module: evaluation
type: core
goal: Design validation protocols — hold-out, k-fold, LOOCV, nested CV, bootstrap — and justify the choice of k and the one-standard-error rule.

## Sources to consult

- ISLP **ch. 5** — the spine: validation-set approach and its two flaws
  (5.1.1–5.1.2), LOOCV with the leverage shortcut Eq 5.2, k-fold, the
  bias–variance argument for k=5/10 over LOOCV (5.1.4), CV for
  classification; bootstrap via the portfolio-α example (5.2, SE≈0.083
  reproduced from one sample); **Exercise 5.4.2**: P(in bootstrap sample) →
  1−1/e ≈ 0.632 — derive it in-lesson (it explains OOB's ~1/3, spiral to
  bagging).
- ESL **§7.10–7.11** — the right and the WRONG way to do cross-validation:
  screening features on ALL data before CV wildly biases the estimate — the
  canonical leakage set piece (reprised in imbalance-leakage); 7.10.1's
  "CV estimates the error of the procedure, not of this fitted model".
- ISLP **§6.1.3** — one-standard-error rule on the Credit data (flat CV curve
  3–11 features → pick 3).
- Caltech LFD **Lecture 13** — the one-line proof of validation's optimistic
  bias (two hypotheses, E[min(e1,e2)] < 0.5); K=N/5 rule of thumb; validation
  vs regularization as two estimates of the same penalty term.
- Ace the DS Interview ch. 6/7 + Huyen §7.1 — question phrasing calibration
  (why k=5, nested CV, time-series splits).

## Key points the lesson must cover

1. The problem: training error is optimistically biased (fit to the noise it
   is scored on); a concrete overfit-polynomial number pair first (L4).
2. **Hold-out** and its two flaws (high variance from one split; wastes
   data), then **k-fold** as the fix; LOOCV as the k=n limit with the
   closed-form shortcut for least squares (state Eq 5.2, use it once).
3. **Choosing k**: LOOCV ≈ unbiased but high variance (n nearly identical
   training sets → correlated fold errors) and expensive; k=5/10 the
   accepted compromise. Present as the bias–variance trade-off applied to
   the *estimator of test error* (spiral to bias-variance — the meta-level
   is the interview differentiator).
4. **Model selection with CV**: choosing hyperparameters ON the CV score
   makes that score optimistic (Caltech min-of-two proof, worked); fixes:
   train/val/test discipline, **nested CV** (outer measures the whole tuning
   procedure), one-standard-error rule for parsimony.
5. **Bootstrap**: resample-with-replacement mechanics; the 0.632 derivation
   worked in full; use cases — SEs/CIs for any statistic (portfolio-α
   story), and the link to bagging/OOB (forward ref).
6. **When random folds are invalid**: time series (use forward-chaining
   splits), grouped/clustered data (group k-fold: all rows of one user on
   one side), duplicated rows; stratification for imbalanced labels — one
   paragraph each.

## Interview questions to work as exercises

- "Why k=5 or 10 rather than LOOCV?" (the full bias/variance/cost answer)
- "Derive: a given point appears in a bootstrap sample with probability
  → 1 − 1/e." (set-piece computation)
- "You tuned 50 hyperparameter configs by 5-fold CV and report the best
  fold score. What is wrong?" (selection bias; nested CV; Caltech min proof
  as the quantitative core)
- "How do you cross-validate a time-series forecasting model?" (no shuffle;
  expanding-window diagram)
- "Design the split for churn data with multiple rows per customer."
  (group k-fold; leakage otherwise — E3 forward echo)
- "ESL's wrong-way CV: screening 1000 genes on all data, then CV on the top
  20 — what error rate will you estimate and why?" (near zero; the fix)
- "What does the one-standard-error rule do and why use it?"

## Pitfalls / subtleties to flag

- CV estimates the expected error of the *procedure* retrained on ~n(1−1/k)
  points, not the error of the specific final model — subtle, and asked.
- The LOOCV-variance argument is standard but genuinely debated in the
  literature; present the standard story, flag the nuance in one sentence.
- Any per-fold preprocessing (scaling, encoding, imputation, feature
  screening) must be fit inside the fold — pipeline framing; the single most
  common practical error (ESL 7.10.2 set piece).
- Stratify classification folds by default; without it small folds can miss
  a class entirely.
- Bootstrap CIs on tiny n or heavy tails misbehave — one caution sentence.

## FIGURE PLAN

1. **single `<Figure>`** — split schematics stacked: hold-out, 5-fold
   (rotating held-out block), LOOCV as the limit; colored train/validation
   blocks. Inspiration: ISLP Figs 5.1/5.3/5.5.
2. **single `<Figure>`** — hold-out instability: CV-error-vs-degree curves
   for 10 different random splits (spaghetti) vs the tight 10-fold curve.
   Inspiration: ISLP Fig 5.2's two-panel idea.
3. **`<FigureSequence>` (3 frames)** — the 0.632 derivation: (1) one draw
   misses point i with prob (1−1/n); (2) n draws → (1−1/n)^n; (3) limit
   1/e with the in/out ≈ 63%/37% bar. One idea per frame.
4. **single `<Figure>`** — bootstrap schematic on a 3-point toy dataset:
   original Z and resamples Z*1, Z*2 with visible repeats, each producing an
   α̂*, histogram of α̂* forming the SE. Inspiration: ISLP Figs 5.9–5.11.
5. **single `<Figure>`** — nested CV: outer folds boxed, inner tuning loop
   drawn inside one outer-training block; labels "inner picks λ, outer
   scores the whole recipe".
6. **single `<Figure>`** — the wrong-way-CV pipeline vs the right-way:
   feature screening placed outside vs inside the fold loop, with the biased
   vs honest error tallies. Inspiration: ESL §7.10.2. One idea: order of
   operations is the whole game.
7. **single `<Figure>`** — time-series forward-chaining splits (expanding
   window) vs shuffled k-fold with a leaked-future block struck out.
