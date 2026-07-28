# Research brief: bias-variance (The bias–variance decomposition)

status: planned
module: foundations
type: core
goal: Derive the bias–variance decomposition of expected test error and use it to diagnose underfitting and overfitting.

This is the course opener (C3): the most polished lesson, ending in a felt win —
the reader reproduces the full decomposition proof unaided.

## Sources to consult

- CS4780 (Weinberger), **Lecture 12 "Bias-Variance Tradeoff"** — the complete
  decomposition proof via the expected label ȳ(x) and expected classifier
  h̄ = E_D[h_D], using the "cross term vanishes" trick twice. The cleanest
  interview-register proof; mirror its structure.
- ESL **§7.3** (Eqs 7.9–7.14) — Err(x0) = σ_ε² + Bias² + Var; the k-NN and
  linear-model special cases (bias/variance formulas as functions of k and p).
- ISLP **§2.2.2** (Eq 2.7, Figs 2.9–2.12) — the canonical flexibility-vs-MSE
  U-curve and the three-term plot; simplest statement of the decomposition.
- Caltech LFD **Lecture 8** — the average hypothesis ḡ view and the sine toy:
  fit f(x)=sin(πx) from N=2 points with H0 (constants) vs H1 (lines); H0 wins
  out-of-sample (bias 0.50/var 0.25 vs bias 0.21/var 1.69). "Match model
  complexity to the data resources, not to the target complexity."
- CS229 **§8.1–8.2** (Figs 8.1–8.12) — underfit/good/overfit polynomial
  running example; mention double descent in one Aside (modern follow-up
  question at research-flavored interviews).
- CS4780 Lecture 12 Figs 1–3 — dartboard diagram and train/test-vs-n learning
  curves for diagnosis (high bias: both errors high and converged; high
  variance: large gap).

## Key points the lesson must cover

1. Setup: data (x,y) ~ P with y = f(x) + ε, E[ε]=0, Var(ε)=σ²; f̂ trained on a
   random draw D. The quantity decomposed is E_{D,ε}[(y − f̂_D(x0))²] at a
   fixed x0.
2. **The full proof** (L4: run it on a concrete quadratic-target example
   first, then general): add and subtract E_D[f̂(x0)]; expand; show both cross
   terms vanish by independence/zero-mean; land on noise + bias² + variance.
   Every algebra step visible — this is a literal interview task.
3. Meaning of each term, with the dartboard picture (recreate, not copy: rows =
   bias low/high, columns = variance low/high).
4. The U-curve: bias falls and variance rises with flexibility; test error is
   their sum; training error keeps falling (that is overfitting, defined here).
5. Diagnosis and remedies table: high bias → bigger model, more/better
   features, less regularization; high variance → more data, regularization,
   ensembles/averaging, fewer features. Learning curves as the diagnostic.
6. Forward pointers (spiral): k in k-NN, λ in ridge, tree depth, bagging are
   all knobs on this same trade-off — one sentence each with lesson refs.

## Interview questions to work as exercises (with full solutions)

- "Derive the bias–variance decomposition." (the set piece; Huyen 7.3, every
  ML loop)
- "Your model has 5% train error, 25% validation error. What is wrong and what
  do you try, in what order?" (diagnosis from the gap)
- "Give an estimator with zero variance. What is its bias?" (constant
  predictor; connects to the decomposition's degenerate corners)
- Caltech's sine-toy numbers: verify constants beat lines for N=2 (compute
  bias and variance of H0 given the stated values; ISL-style conceptual).
- "Does adding training data reduce bias?" (no — it reduces variance; learning
  curves flatten to the bias floor)
- "Is a k-NN classifier with k=1 high-bias or high-variance?" (spaced link
  forward once knn-curse exists — keep as a plain question here, zero train
  error + high variance).

## Pitfalls / subtleties to flag

- The decomposition is exact for **squared loss** only; for 0/1 loss it is a
  heuristic (variants exist) — say so in one Remark, interviewers probe it.
- Bias and variance are properties of the *procedure over datasets*, not of
  one fitted model. The expectation over D is the crux students misstate.
- Irreducible noise is not removable by any model — distinct from bias.
- "Tradeoff" is a misnomer sometimes: regularization tuned well reduces
  variance more than it adds bias²; the sum is what matters.
- Do not conflate overfitting with "too many parameters" — it is fitting noise;
  double descent (CS229 §8.2) is the modern counterexample, one Aside only.

## FIGURE PLAN

1. **`<FigureSequence>` (4 frames)** — the proof as staged algebra: (1) the
   quantity E[(y−f̂)²] with y expanded; (2) add/subtract E[f̂] with the two
   groups color-coded; (3) cross terms struck out with the reason labeled;
   (4) the three surviving terms named noise/bias²/variance. Inspiration:
   CS4780 lec 12 derivation, house formula-dissection style.
2. **single `<Figure>`** — dartboard 2×2: low/high bias × low/high variance,
   shots as dots around a bullseye. Inspiration: CS4780 Fig 1 /
   Fortmann-Roe's canonical diagram (recreate idea).
3. **single `<Figure>`** — three-panel polynomial fits on the same noisy
   sample: degree 1 (underfit), 3 (good), 9 (overfit), with train/test error
   tallies under each. Inspiration: CS229 pp.18/115 three-panel.
4. **single `<Figure>`** — the U-curve: bias², variance, noise, and their sum
   vs model flexibility; training error dashed and monotone. Inspiration:
   ISLP Fig 2.12.
5. **single `<Figure>`** — many refit curves overlaid (10 resamples) at degree
   1 vs degree 9: tight sheaf vs wild sheaf around the same mean curve —
   variance made visible. Inspiration: Caltech ḡ view / ESL Fig 7.2 idea.
6. **single `<Figure>`** — two learning-curve panels (error vs N): high-bias
   regime (curves converge high) vs high-variance regime (persistent gap),
   each labeled with the remedy. Inspiration: CS4780 lec 12 Fig 3.
