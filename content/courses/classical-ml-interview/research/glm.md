# Research brief: glm (Generalized linear models) — EXTRA

status: planned
module: linear-classification
type: extra
goal: Construct GLMs from the exponential family and derive linear, logistic, and Poisson regression as special cases.

Off-path chapter: asked in stats-heavy DS loops ("why Poisson for counts",
"what's a link function"), rarely in ML-engineer loops. Core path must
survive skipping it.

## Sources to consult

- CS229 **ch. 3** — the construction: exponential family form
  b(y)exp(ηᵀT(y) − a(η)); Bernoulli and Gaussian rewritten into it (worked);
  the three GLM assumptions; OLS and logistic regression derived as
  consequences; the store-visits Poisson motivating example.
- Murphy **ch. 12** — GLM as conditional exponential family; mean/variance
  from derivatives of a(η) (12.1); linear/binomial/Poisson examples (12.2);
  **§12.5 the insurance worked example**: 678k-row French auto data, 94%
  zero-claims; Table 12.1 shows MSE/MAE favor ridge while deviance and the
  calibration plot (Fig 12.2) show Poisson regression is right (predicts
  11,930 total claims vs true 11,935 vs ridge's 10,693). The set-piece gem.
- Murphy **§3.4** — exponential family properties (starred) for the
  cumulant/log-partition facts.
- Bishop **§4.3.6** (canonical link functions) for cross-checking the
  canonical-link statement.

## Key points the lesson must cover

1. Motivating flaw (need-then-method): OLS on counts predicts negative
   values and assumes constant variance; on binary data predicts outside
   [0,1] — the pattern is "wrong response distribution".
2. **Exponential family**: definition; rewrite Bernoulli (η = log φ/(1−φ) —
   the logit appears BY ITSELF) and Gaussian (η = μ) into the form, fully
   worked (L4). Mean = a'(η), variance = a''(η) stated with one-line proof.
3. **The three GLM assumptions** (CS229): (i) y|x ~ ExpFam(η); (ii) predict
   E[T(y)|x]; (iii) η = θᵀx. Turn the crank: Gaussian → linear regression;
   Bernoulli → logistic (the sigmoid DERIVED, not chosen — the payoff
   sentence); Poisson → log link, rate = e^{θᵀx}.
4. Canonical links: identity/logit/log as the η-inverses; why the canonical
   choice makes the gradient (y − ŷ)x uniformly (one derivation covering all
   three — reinforces logistic-regression's gradient).
5. **Deviance** as the GLM generalization of RSS; model comparison; the
   Murphy insurance case: MSE/MAE mislead, deviance + calibration pick the
   Poisson model. Exposure/offset in one sentence (log-exposure offset).
6. Where GLMs sit in interviews: insurance/pricing, ads (Poisson/negative
   binomial mention), A/B metrics; overdispersion caveat.

## Interview questions to work as exercises

- "Show the Bernoulli is an exponential family; read off the canonical link."
  (set piece)
- "Why does logistic regression use the sigmoid?" (GLM answer: it is the
  canonical response function of the Bernoulli — contrast with the 'squash to
  [0,1]' hand-wave)
- "You must predict claim counts per policy. Which model and which loss?"
  (Poisson with log link + exposure offset; why not OLS/ridge — cite the
  calibration story)
- "Derive the Poisson regression gradient." ((y − e^{θᵀx})x — same form again)
- "What is deviance and why prefer it to MSE for a rate model?"
- "Counts are overdispersed (variance ≫ mean). What breaks and what do you
  use?" (Poisson variance=mean assumption; negative binomial / quasi-Poisson
  one-liner)

## Pitfalls / subtleties to flag

- T(y)=y for the three cases used; do not present the general T machinery
  beyond one sentence — scope control.
- Canonical link is a *choice with consequences* (simple gradient, nice
  theory), not a law; probit exists (one sentence).
- log link means effects are MULTIPLICATIVE on the rate — interpretation
  differs from linear coefficients; a one-line reading example.
- The insurance example's punchline is metric choice, not model magic —
  connect to classification-metrics' proper-scoring theme (spiral).

## FIGURE PLAN

1. **single `<Figure>`** — the flaw panel: OLS line on binary data escaping
   [0,1] and OLS on counts going negative, each with the GLM fix curve
   overlaid. One idea: wrong response distribution, visibly.
2. **`<FigureSequence>` (3 frames)** — Bernoulli into exponential-family
   form: (1) pmf φ^y(1−φ)^{1−y}; (2) exp/log rearrangement with terms
   regrouped and color-bound to b, η, T, a; (3) η = logit(φ) boxed →
   sigmoid as its inverse. House formula-dissection; inspiration CS229 ch. 3.
3. **single `<Figure>`** — the GLM assembly line: three assumption boxes
   feeding a crank that outputs the three named models as stamped badges
   (identity/logit/log links labeled). One idea: one recipe, three models.
4. **single `<Figure>`** — the three link functions plotted side by side
   (identity, sigmoid, exp) mapping η to the mean, with valid response
   ranges shaded.
5. **single `<Figure>`** — calibration verdict: recreate the idea of Murphy
   Fig 12.2 — predicted vs observed claim frequency for ridge vs Poisson,
   with the totals tally (10,693 vs 11,930 vs true 11,935). One idea: the
   right loss finds the calibrated model. (Recreate schematically; do not
   copy.)
6. **single `<Figure>`** — the uniform gradient: (y − ŷ)x annotated three
   times with ŷ = θᵀx / σ(θᵀx) / e^{θᵀx}; one formula, three models.
