# Research brief: logistic-regression (Logistic regression)

status: planned
module: linear-classification
type: core
goal: Derive the logistic-regression gradient from the Bernoulli likelihood and explain why cross-entropy, not squared error, is the right loss.

## Sources to consult

- CS229 **§2.1** — the canonical derivation: sigmoid, σ'(z) = σ(z)(1−σ(z))
  identity, Bernoulli log-likelihood, gradient (y − h(x))x "identical in form
  to LMS"; Remark 2.1.1's logistic-loss notation. Mirror this derivation.
- Murphy **ch. 10** — MLE via IRLS/Newton (10.2.3-ish), MAP/L2-regularized
  logistic (10.2.7), multinomial/softmax (10.3), standardization note.
- ISLP **ch. 4** — odds/log-odds interpretation, Default-data worked
  coefficients, multiple logistic regression, confounding example.
- CS4780 **Lecture 6** — logistic regression as the discriminative
  counterpart of Gaussian naive Bayes; NB vs LR comparison (feeds lda-gda).
- Bishop **§4.3.2** (logistic regression) + §4.3.3 IRLS for the Newton
  update; the "number of parameters M vs M(M+5)/2+1 for generative" remark.
- StatQuest logistic series — McFadden pseudo-R²; odds-ratio reading
  (calibration source for exercises, not register).
- ESL **§4.4** — L1-regularized logistic one-liner; separating-hyperplane
  context.

## Key points the lesson must cover

1. Model: p(y=1|x) = σ(wᵀx); derive from "model the log-odds linearly" (the
   log-odds → sigmoid inversion computed, L4); decision boundary wᵀx=0 is
   linear; probabilities, not just labels.
2. **The MLE derivation in full**: Bernoulli likelihood → cross-entropy loss;
   the σ' identity derived; per-example gradient (y−p)x with every chain-rule
   step. The "same form as LMS but different h" observation (CS229) as a
   Remark.
3. **Why not squared error**: (a) squared loss on σ is non-convex in w;
   (b) gradient vanishes when confidently wrong; (c) MLE gives calibrated
   probabilities. Cross-entropy is convex (state; proof sketch or ref to
   gradient-descent lesson's convexity ledger).
4. Fitting: no closed form; gradient ascent/SGD (reinforce); Newton/IRLS —
   the update stated, why it is practical here (d small) — reinforce
   gradient-descent lesson.
5. **Separable data pathology**: weights diverge to ∞ (likelihood
   approaches 1 monotonically in ‖w‖); regularization (L2) as the fix; MAP
   reading (reinforce mle-map).
6. Interpretation: e^{w_j} as odds ratio per unit of x_j; the ISLP Default
   example numbers; multinomial softmax + cross-entropy in one section
   (gradient φ − e_y stated, not re-derived).

## Interview questions to work as exercises

- "Derive the gradient of the logistic-regression log-likelihood." (set piece)
- "Why cross-entropy instead of MSE for classification?" (full three-part
  answer)
- "What happens to logistic regression on linearly separable data?"
  (divergence; what regularization does — a favorite at quant/ML loops)
- "Interpret a coefficient of 0.7 on feature 'balance'." (odds multiply by
  e^0.7 ≈ 2.01 per unit)
- "Logistic regression's decision boundary is linear — prove it." (log-odds
  threshold)
- "How would you get nonlinear boundaries from logistic regression?"
  (feature maps; kernel pointer forward to svm-dual-kernels)
- "Is logistic loss convex? Sketch why." (E3 link back to gradient-descent)

## Pitfalls / subtleties to flag

- Logistic regression is a CLASSIFIER fit by regression machinery; the name
  confuses — one sentence.
- Coefficients are log-ODDS effects, not probability effects; the derivative
  of p w.r.t. x depends on p (nonconstant marginal effect).
- Perfect separation: software silently returns huge weights/warnings;
  regularize or use penalized likelihood (Firth one-liner).
- Class imbalance shifts the intercept, not the slopes (under the model);
  threshold choice belongs to classification-metrics — forward ref, do not
  duplicate.
- σ'(z)=σ(1−σ) is the step candidates flub live — drill it in an exercise.

## FIGURE PLAN

1. **single `<Figure>`** — the sigmoid with annotated regions: z→−∞ p→0,
   z=0 p=½ (the boundary), z→∞ p→1; secondary axis showing log-odds linear
   in x. One idea: linear log-odds ⇔ sigmoid probability.
2. **`<FigureSequence>` (4 frames)** — gradient derivation staged: (1)
   Bernoulli likelihood for one example; (2) log; (3) chain rule with σ'
   substitution highlighted; (4) the boxed (y−p)x with the LMS-form parallel
   noted. House formula-dissection; inspiration CS229 §2.1.
3. **single `<Figure>`** — 2D two-class scatter with the linear boundary and
   probability contours (0.1/0.5/0.9) as parallel lines. One idea: scores are
   distances through a squashing function.
4. **single `<Figure>`** — loss curves for a single example (y=1): cross-
   entropy vs squared-error-on-sigmoid vs z = wᵀx; CE convex and steep when
   wrong, MSE flat when confidently wrong (the vanishing-gradient region
   shaded). One idea: why CE trains and MSE stalls.
5. **single `<Figure>`** — separable data: ‖w‖ growing over iterations with
   the likelihood → 1 asymptote, plus the same run with L2 penalty leveling
   off. One idea: separation needs regularization.
6. **single `<Figure>`** — odds-ratio reading card: coefficient table for a
   tiny Default-style model with each w_j translated to e^{w_j} and one
   sentence of interpretation. Inspiration: ISLP ch. 4 tables.
