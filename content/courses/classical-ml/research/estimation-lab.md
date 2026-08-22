# Lab: the estimator's report card — research brief

Lesson: `estimation-lab` (module: estimation, type: lab, planned). NEW — added after the module's application lesson at the human's request, because the module argues about a floor no earlier lab ever measures.
Goal: Build a harness that scores any estimator against the Cramér–Rao floor — score, expected and observed information, Newton's method, a Monte-Carlo variance study, the asymptotic-normality check — and turn it on a fitted claims model to price its standard errors.

## ARC
- Inherits: the recipe (mle-map), the floor and its regularity conditions (fisher-information), Newton's step and its cost (gradient-descent), the exponential family and the canonical link (glm), and the fitted Poisson study (insurance-claims).
- Contributes: the module's claim turned into measurement — the bound is a statement about variance across repeated samples, so the learner generates the repetitions and watches the estimator settle onto the floor; then meets a family where it does not, and must name why.
- Hands off: the observed-information standard error, which module 10 replaces with a posterior (bayesian-linear-regression) and then with a distribution-free interval (conformal-prediction); the "measure across replicates" habit that validation-lab formalizes as protocol.
- Spine step: "Estimation is likelihood" (step 2, final item).

## LAB PLAN

Artifact: one notebook building a small estimation toolkit — `loglik`, `score`, `expected_information`, `observed_information`, a Newton solver driven by them, and a replicate harness `study(sampler, estimator, n, reps)` — and then a report card: for each (family, estimator, n) the empirical variance, the 1/(nI) floor, the ratio, and the KS distance of the standardized estimate from N(0,1). It ends by pricing standard errors for the claims model the previous lesson read.

CANON GROUNDING: the pencil-and-paper spine is Casella & Berger §7.3 (score, information, the Cramér–Rao inequality, the attainment condition, and the §7.3 exercises' irregular-family counterexamples — the dossier records this source's role as "Cramér–Rao with attainment and regularity counterexamples, MLE asymptotics, superefficiency"). The exponential-family and canonical-link half is CS229 Problem Set 1, Q3 (Poisson regression: show the family form, state the canonical response, derive the update, implement it) — https://cs229.stanford.edu/summer2020/ps1.pdf. Simulation studies that compare an estimator's realized variance against the bound are the standard computational form of those exercises in mathematical-statistics courses; this lab is that form.
DEPARTURES, state them in the lab: (a) CS229 has the student implement the Poisson GLM's optimizer — here the fit SHIPS COMPLETE, because `logreg-lab` already makes the learner build a likelihood optimizer with Newton/IRLS and repeating that skeleton with a different link teaches nothing new; this lab's subject is the information, not the ascent; (b) Casella & Berger prove attainment, this lab measures it, and the measurement is what exposes how many replicates a variance claim actually needs.

Datasets / inputs:
- Synthetic, generated in-notebook under fixed seeds, for every checkpoint through the study: Bernoulli(θ), Poisson(λ), Normal(μ, σ²) with σ² the parameter of interest, and Uniform(0, θ) for the irregular case. No file needed; the sampler is part of the harness contract.
- `claims.csv` for the final task: a seeded subsample (~8,000 policies, 6 numeric/one-hot features + exposure + claim count) of freMTPL2freq (OpenML dataset 41214, the same portfolio the `insurance-claims` lesson reads; openly redistributable, credit OpenML/CASdatasets in the notebook's data cell). Ship the fitted coefficient vector alongside it so the learner computes information at a KNOWN optimum rather than debugging someone else's convergence.
- Held-out material for the metric checkpoint lives in `private/`: bootstrap replicate SEs (2,000 resamples, seeded) and the coverage of the reference intervals.

Checkpoints (plan; lab-author may split or deepen):
1. `loglik` (exact, warm-up): log-likelihood of an exponential-family sample written in the natural parameter η, checked on Bernoulli and Poisson against hand values.
2. `score` (exact, warm-up): ∂ℓ/∂θ analytically, refereed inside the notebook by a central finite difference — the same referee pattern `logreg-lab` uses for its gradient. Consumes 1.
3. `expected-information` (exact): I(θ) as Var(score) for the three regular families; the notebook's local check confirms the equivalence with −E[∂²ℓ] on one of them (the identity the fisher-information lesson proves).
4. `observed-information` (exact): −∂²ℓ evaluated at the estimate on one realized sample, plus the quantity the report card needs — how far observed sits from expected at n = 20 versus n = 2,000. Consumes 1.
5. `mle-newton` (exact): Newton on the score stepped by the observed information, returning the estimate and the iteration count; must handle the Poisson and Normal-variance cases. Consumes 2, 4.
6. `crlb-study` (exact, the composition): `study(...)` over R replicates returning empirical variance, the 1/(nI(θ₀)) floor and their ratio; run for the MLE (ratio → 1) and for the biased σ̂²_MLE (ratio below 1 — a biased estimator is not bound by the unbiased floor, which the report card must state rather than flag as a bug). Consumes 3, 5.
7. `asymptotic-normality` (exact): √(nI)·(θ̂ − θ₀) across replicates, scored by a two-sample-free KS statistic against Φ, over n = 10, 100, 1,000 — the number falls; by eye it would not be arguable. Consumes 5, 6.
8. `irregular-family` (review, required: false): Uniform(0, θ). The learner runs the harness, reports that Var(θ̂) ≈ θ²/n² beats the naive bound, and NAMES the failed hypothesis (the support depends on θ, so differentiation under the integral sign is not licensed and the score identity that starts the derivation does not hold). Rubric grades the naming, not the prose.
9. `claims-standard-errors` (metric, required: false, LAST): compute SEs for the shipped claims fit from the observed information (the GLM's own X'WX with the Poisson weights), form 95% Wald intervals, and score interval coverage against the private bootstrap distribution; threshold calibrated by the build. The point that lands: information-based and bootstrap SEs agree on the well-identified coefficients and diverge on the sparse one-hot column — regularity again, now in production.

Known-wrong variants worth declaring: score with the sign flipped (the single most common slip, and finite differences catch it — so the referee must run BEFORE the check); information computed as +E[∂²ℓ] (sign); dividing by n instead of multiplying (the per-observation versus per-sample information confusion, which makes the ratio n²-wrong and looks like a bug in the study loop); the variance across replicates computed with ddof=1 where the floor is stated for the population variance (small but real, and the same ddof trap `validation-lab` already declares — keep the hint different); Newton stepped by the EXPECTED information (Fisher scoring) where the checkpoint asks for observed — converges, different iterate path, so the wrong-variant hint must name the distinction rather than the failure.

NOT blanked (ships complete): the samplers, the plotting helpers, the claims data loader, the fitted claims coefficients, the bootstrap SE table (private), and the KS-statistic utility — the learner writes the estimation mathematics, not the scaffolding.

est_hours: 4. Progression: warm-ups 1–2 → the information pair 3–4 → Newton 5 → the study composition 6 → 7 → review garnish 8 → one open metric last 9. Required: 1, 2, 3, 4, 5, 6, 7.
