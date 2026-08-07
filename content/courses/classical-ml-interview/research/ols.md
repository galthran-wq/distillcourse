# Research brief: ols (Ordinary least squares)

status: planned
module: linear-regression
type: core
goal: Derive the OLS normal equations by matrix calculus and state the Gauss–Markov guarantees and their assumptions.

## Sources to consult

- CS229 **§1.2** — the canonical matrix-calculus derivation: matrix-derivative
  toolkit (§1.2.1, incl. the worked f(A) example), then ∇θ J = XᵀXθ − Xᵀy = 0
  → θ̂ = (XᵀX)⁻¹Xᵀy (§1.2.2). Mirror this derivation step-for-step; it is the
  interview standard.
- CS229 **§1.3** — probabilistic interpretation: i.i.d. Gaussian noise ⇒
  maximizing likelihood ≡ minimizing RSS (ties back to mle-map).
- ESL **§3.2** — the geometric projection view (ŷ = Hy, hat matrix), sampling
  properties, and **§3.2.2** Gauss–Markov (Eqs 3.17–3.20): minimum variance
  among linear unbiased estimators; the explicit remark that biased (shrunk)
  estimators can beat OLS in MSE — the door to ridge.
- CS4780 **Lecture 8** — OLS and ridge from the MLE/MAP view in compact
  notation (w = (XXᵀ)⁻¹Xy in their convention; note the transpose-convention
  difference and pick one).
- ISLP **ch. 3** — interpretation layer: coefficients, standard errors,
  confidence intervals; qualitative predictors (one-hot) in regression.
- CS229 §1.1 gem — Portland housing fitted numbers (θ0=71.27, θ1=0.1345) as
  the running concrete example.

## Key points the lesson must cover

1. Model and loss: J(θ) = ½‖Xθ − y‖²; design matrix with intercept column
   absorbed. A 3-point 1D example computed numerically first (L4), then the
   general derivation.
2. **The full matrix-calculus derivation** with the two needed identities
   (∇ aᵀθ = a, ∇ θᵀAθ = 2Aθ for symmetric A) stated and used explicitly —
   no skipped steps. Second-order check: XᵀX ⪰ 0 (convex, per
   gradient-descent lesson).
3. **Geometric view**: normal equations ⇔ Xᵀ(y − Xθ̂) = 0 — residual
   orthogonal to the column space; ŷ is the projection; hat matrix H named.
4. MLE connection: Gaussian noise model makes least squares the MLE
   (reinforce mle-map, two-line derivation).
5. **Gauss–Markov**: statement (BLUE), the assumption list (linearity in
   parameters, exogeneity E[ε|X]=0, homoscedastic uncorrelated errors, no
   perfect collinearity — NO normality needed), proof sketch (any other
   linear unbiased estimator = OLS + D, variance adds). Normality is only
   needed for exact inference; flag as classic interview trap.
6. When (XᵀX)⁻¹ fails: exact collinearity, p > n. Pseudoinverse one sentence;
   ridge as the standard fix (forward pointer). Computation note: solve, don't
   invert; QR/Cholesky one sentence.

## Interview questions to work as exercises

- "Derive the closed-form OLS solution." (the set piece)
- "Why minimize squared error rather than absolute error?" (MLE-Gaussian +
  differentiability; L1 → median, robustness trade — one full answer)
- "What are the assumptions of linear regression / Gauss–Markov, and what
  breaks if each fails?" (feeds regression-diagnostics next lesson)
- "When is XᵀX not invertible? What do you do?" (duplicated feature, one-hot
  dummy trap with intercept, p>n)
- "Show the residuals of OLS are orthogonal to every column of X; conclude
  they sum to zero when there is an intercept."
- "Does OLS require Gaussian errors?" (no — trap question; unbiasedness/BLUE
  vs inference distinction)

## Pitfalls / subtleties to flag

- Distinguish assumptions needed for: closed form (none beyond invertibility)
  vs unbiasedness (exogeneity) vs BLUE (add homoscedasticity) vs t-tests
  (add normality). Interviewers love the layered version.
- The dummy-variable trap: full one-hot + intercept = exact collinearity.
- Never numerically invert XᵀX in practice; mention conditioning in one line.
- CS229 and CS4780 use transposed conventions (X rows-as-examples vs
  columns); fix rows-as-examples and stay consistent.
- Gauss–Markov says minimum variance among LINEAR UNBIASED — do not oversell:
  biased estimators (ridge, James–Stein one-liner) can have lower MSE.

## FIGURE PLAN

1. **single `<Figure>`** — 1D scatter with fitted line and residuals drawn as
   vertical segments; RSS as the sum of squared segment lengths, values
   tallied for the 3-point example. One idea: what is being minimized.
2. **`<FigureSequence>` (4 frames)** — the derivation staged: (1) J(θ) in
   matrix form expanded; (2) gradient identities applied term by term;
   (3) set to zero → normal equations; (4) solved form boxed with
   invertibility condition flagged. House formula-dissection style,
   inspiration CS229 §1.2.2.
3. **single `<Figure>`** — the projection picture: column space of X as a
   plane, y as a vector above it, ŷ as the foot of the perpendicular,
   residual arrow orthogonal. Inspiration: ESL §3.2 geometry.
4. **single `<Figure>`** — Gauss–Markov assumption ladder: four rungs
   (closed form → unbiased → BLUE → exact t-tests) with the assumption each
   rung adds. One idea: which claim needs which assumption.
5. **single `<Figure>`** — collinearity failure: two nearly-identical columns
   drawn as almost-parallel vectors; the flat-bottomed valley of J with many
   near-minimizers. Sets up both diagnostics and ridge lessons.
6. **single `<Figure>`** — Portland-style numbers panel: small feature table
   → fitted θ̂ values → prediction for a new x, arrows through the pipeline.
   One idea: closed form to prediction end-to-end.
