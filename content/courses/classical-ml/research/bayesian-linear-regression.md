# Bayesian linear regression — research brief

Lesson: `bayesian-linear-regression` (module: uncertainty, core, planned). NEW.
Goal: Derive the posterior and posterior-predictive distributions for linear regression and use the marginal likelihood for model selection.

## Sources
- Bishop §3.3 (the canonical treatment: Gaussian posterior N(m_N, S_N) by completing the square; sequential updating Fig 3.7 — the prior-to-posterior film; predictive variance σ² + xᵀS_Nx eq 3.59), §3.4–3.5 (Bayesian model comparison; the evidence's Occam behavior Fig 3.13; evidence approximation one paragraph), §1.2.6 (Bayesian curve fitting).
- Murphy §11.7 (posteriors/predictives worked; centering removes posterior correlation §11.7.5's wheel-of-fortune; Fig 11.20 sequential film; Fig 11.21 plugin-vs-posterior error bars — the GP setup figure; ARD §11.7.7 one paragraph).
- Murphy §5.2.3 (Bayesian Occam's razor via conservation of probability mass — Fig 5.7's schematic; CV↔marginal-likelihood connection §5.2.4 one sentence).
- mle-map (internal): the MAP=ridge identity now upgraded to the full posterior.

## Key points
1. The move named: modules 2–3 kept point estimates and (module 5) measured uncertainty by resampling; module 9 gave worst-case guarantees. The third road: carry the whole posterior — uncertainty becomes an OUTPUT of the model, priced by its assumptions (the assumption-dependence is the honest refrain the module ends by fixing with conformal).
2. The conjugate derivation IN FULL: Gaussian prior N(0, τ²I) × Gaussian likelihood → posterior N(m_N, S_N) by completing the square (the matrix square-completion carried step by step — the course's one full multivariate conjugacy proof); MAP = ridge recovered as the mode (λ = σ²/τ² — module 3's dictionary now a corollary).
3. The sequential film: prior → posterior after 1, 2, 20 points in (w₀, w₁) space with sampled lines alongside (Bishop Fig 3.7 recreated) — Bayesian updating as data arriving.
4. The predictive distribution derived: y* | x*, D ~ N(m_Nᵀx*, σ² + x*ᵀS_Nx*) — the variance SPLIT read aloud (noise floor + parameter uncertainty); error bars widening away from data PLOTTED; plugin-MLE's flat bars beside it (Murphy Fig 11.21's contrast — the reason this module exists).
5. Marginal likelihood: p(D | model) with parameters integrated out; the Occam mechanism (normalized over datasets — complex models spread thin) via the three-model schematic; polynomial-degree selection by evidence on one worked dataset (no CV used — then one sentence on their relationship). Sets up GP hyperparameter selection verbatim.
6. The honest close: everything is conditional on the model (kernel/basis, Gaussianity, σ) — mis-specify and the beautiful bars lie; the module's arc stated: GPs generalize the prior (next), conformal drops the assumptions (after).

## Set pieces & gems
- Bishop Fig 3.7 — the most reproduced Bayesian-updating figure in the canon; recreate as a FigureSequence.
- Murphy's plugin-vs-posterior Fig 11.21 — "why error bars" in one contrast.
- The wheel-of-fortune centering observation (§11.7.5) — a small practical gem (uncentered features → correlated posterior).

## Pitfalls
- Keep σ² known (the full Normal-Inverse-Gamma treatment is out of scope; one honesty sentence).
- The evidence integral: compute via the completed-square identity, not via approximations; state the closed form and verify dimensions.
- Do not preach Bayes-vs-frequentism; the course's frame is engineering (what each machinery outputs and assumes).

## FIGURE PLAN
- draw: FigureSequence (4 frames): the sequential film — (w₀,w₁)-space density + sampled lines panels at n = 0, 1, 2, 20 for the running line-fitting example. Recreation of Bishop Fig 3.7. Key image.
- draw: The square-completion — the exponent's quadratic form rearranged with the (w − m_N)ᵀS_N⁻¹(w − m_N) block highlighted and the identification arrows to m_N, S_N. Formula-dissection Figure.
- draw: The predictive split — fitted band over data: inner band σ² (noise floor, constant) and outer band adding x*ᵀS_Nx* (flaring outside the data); the plugin-MLE's constant band as a gray ghost. Single Figure; the module's thesis image.
- draw: Occam's conservation — three model curves (simple/medium/complex) as normalized distributions over "all datasets" with the observed D₀'s vertical line; the medium model tallest at D₀. Recreation of Bishop Fig 3.13/Murphy Fig 5.7's schematic.
- draw: Evidence-based degree selection — log-evidence vs polynomial degree on the worked dataset with the peak at the truth-adjacent degree; test error curve alongside agreeing. Computed.

## EXERCISE PLAN
1. Warm-up: for a 1-D Gaussian mean with known σ, compute the posterior after 3 given observations (the scalar case of the machinery).
2. Derivation skipped: derive the posterior predictive by integrating the likelihood against the posterior (the Gaussian-integral steps the lesson compresses; guided).
3. Boundary probe: τ² → ∞ (flat prior — posterior mean → OLS, S_N → σ²(XᵀX)⁻¹: module 3's sampling covariance REAPPEARS as a posterior; state the two readings of the same matrix); τ² → 0 (the prior wins, data ignored).
4. Claim to refute: "Bayesian error bars are honest uncertainty." Refute by mis-specification: fit the linear model to quadratic truth and show the predictive band confidently excludes the truth in extrapolation; name what the bars condition on (the model), and which module-10 tool repairs it (conformal — forward).
5. Mixed review (E3): show the posterior mean equals ridge with λ = σ²/τ² and verify numerically against the regularization-lab's ridge solver on the same data.
6. Research-shaped: reproduce the Occam effect — generate data from a degree-2 polynomial, compute the evidence for degrees 1–8, and report the argmax across 20 replications; compare with 5-fold-CV's choice (module 5 composed).
7. FORWARD (E7): rewrite the predictive mean as Σᵢ k(x*, xᵢ)·(weights) for the basis-function model — prediction as a kernel-weighted combination of training targets. Solution: pushing that observation to infinitely many basis functions is the Gaussian process → Ref gaussian-processes.

## ARC
- Inherits: MAP/priors (mle-map), ridge (module 3), the assumption-honesty habit (modules 5/9).
- Contributes: the full-posterior machinery — conjugate derivation, predictive bands that flare honestly, evidence-based selection — and the module's central caveat (conditional on the model).
- Hands off: the same machinery kernelized into distributions over functions → gaussian-processes.
- Spine step: "Predictions with guarantees: put the distribution back…" (step 10).
