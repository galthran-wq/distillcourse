# Research brief: mle-map (Maximum likelihood and MAP estimation)

status: planned
module: foundations
type: core
goal: Compute maximum-likelihood and MAP estimates for standard models and connect priors to regularization penalties.

Second easy opener (C3): short computations with immediate wins; sets up the
probabilistic spine reused by OLS, logistic regression, naive Bayes, GMM.

## Sources to consult

- CS4780 (Weinberger), **Lecture 4 "Estimating Probabilities from Data"** —
  the running coin-toss example D = {H,T,T,H,H,H,T,T,T,T}: MLE θ̂ = n_H/(n_H+n_T),
  Beta prior conjugacy, MAP as "m hallucinated heads and tails". Reuse this
  exact arc; it recurs in lectures 5/6/8 the way our course reuses it.
- Bishop **§1.2.5–1.2.6** — curve fitting re-visited: Gaussian noise MLE ≡
  least squares (Eqs 1.60–1.64); Gaussian prior MAP ≡ ridge with λ = α/β
  (Eqs 1.65–1.67). State both results here; ols and ridge-lasso re-derive.
- Murphy **§4.2** (worked MLEs: Bernoulli, categorical, Gaussian, linear
  regression), **§4.5** (MAP/regularization), **§4.7.6** (MLE of σ² is biased
  — the 1/n vs 1/(n−1) interview classic).
- Ace the DS Interview, Ch. 6 — "Uber: MLE vs MAP mathematical comparison"
  (exercise material); Ch. 5 Facebook fair-vs-unfair-coin Bayes problem
  (posterior ≈ 97%) as a Bayes-rule warm-up exercise.

## Key points the lesson must cover

1. Likelihood as a function of parameters with data fixed; i.i.d. product →
   log turns it into a sum. The **two-step recipe**: write log-likelihood,
   set derivative to zero (check it is a max).
2. Worked example 1 (concrete first, L4): the coin. n_H heads in n flips →
   θ̂ = n_H/n derived fully (log, differentiate, solve).
3. Worked example 2: Gaussian μ̂ = sample mean, σ̂² = 1/n Σ(x−μ̂)² — and the
   fact that σ̂² is biased (E[σ̂²] = (n−1)/n · σ²); the Bessel correction.
4. MAP: posterior ∝ likelihood × prior; argmax adds log p(θ). Beta(α,β) prior
   on the coin → θ̂_MAP = (n_H+α−1)/(n+α+β−2): pseudo-counts. Smoothing =
   prior, first appearance of an idea reused in naive-bayes (Laplace).
5. **Priors are regularizers**: Gaussian prior → L2 penalty, Laplace prior →
   L1 penalty. Stated with the one-line algebra (log of the prior density);
   ridge-lasso lesson cashes it in.
6. MLE properties in one Remark: consistent, asymptotically efficient, but
   overfits small samples (θ̂=1 after 3 heads) — exactly what MAP fixes.
7. MLE vs MAP comparison table (the Uber question): objective, prior role,
   behavior as n→∞ (MAP → MLE), failure modes.

## Interview questions to work as exercises

- "Derive the MLE for a Bernoulli/coin." (fresh dataset, reader reproduces)
- "You flip a coin 10 times and see 8 heads. MLE of P(heads)? Now with a
  uniform/Beta(2,2) prior, the MAP?" (numbers all the way)
- "Show that the MLE of Gaussian variance is biased. What is the unbiased
  version?"
- "MLE vs MAP: when do they coincide?" (flat prior; and as n→∞)
- Facebook fair-coin problem (Ace ch. 5): posterior probability the fair coin
  was used given a flip sequence — full Bayes computation.
- "Why maximize log-likelihood rather than likelihood?" (monotone transform,
  sums vs products, numerical underflow)

## Pitfalls / subtleties to flag

- MAP estimate depends on parameterization (it is the mode of a density);
  MLE is invariant under reparameterization. One Remark, occasionally probed.
- The MAP-as-regularization equivalence needs the *negative log* prior —
  students drop signs; write the chain min −log P explicitly once.
- Do not claim MLE "assumes Gaussian" in general — the Gaussian enters only
  for specific models (least squares); the recipe is distribution-generic.
- θ̂=0 or 1 at the boundary: derivative test fails; note the boundary check.

## FIGURE PLAN

1. **single `<Figure>`** — likelihood curve L(θ) for the 10-flip coin dataset
   with the maximum marked at 0.6, log-likelihood below sharing the argmax.
   One idea: same argmax, easier calculus. Inspiration: CS4780 lec 4.
2. **`<FigureSequence>` (3 frames)** — the two-step recipe on the coin:
   (1) product likelihood written; (2) log turns it to n_H log θ + n_T log(1−θ);
   (3) derivative set to zero, θ̂ = n_H/n boxed. House formula-dissection.
3. **single `<Figure>`** — prior × likelihood → posterior for Beta(2,2) on
   the 8-heads data: three aligned density curves; MAP vs MLE marked as two
   ticks. Inspiration: CS4780 lec 4 Bayesian update.
4. **single `<Figure>`** — pseudo-count view: bar chart of real counts (8H/2T)
   with ghost bars for hallucinated counts stacked on top; the MAP formula
   annotated with which bar each symbol reads. One idea: prior = fake data.
5. **single `<Figure>`** — the bridge table as a graphic: Gaussian prior curve
   → ‖θ‖² penalty; Laplace prior curve → |θ| penalty; arrows labeled
   "−log". Forward-pointer figure reused conceptually in ridge-lasso.
6. **single `<Figure>`** — MLE overfit at small n: estimate trajectory θ̂ vs
   number of flips for MLE and MAP on the same simulated stream, MAP curve
   starting near 1/2 and merging with MLE as n grows. One idea: prior washes
   out.
