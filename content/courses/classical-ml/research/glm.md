# Generalized linear models — research brief

Lesson: `glm` (module: estimation, core — was `extra` in the old course, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/glm/lesson.mdx (28 min).
Goal: Construct GLMs from the exponential family and derive linear, logistic, and Poisson regression as special cases.

## Sources
- CS229 Ch. 3 (the cleanest construction: exponential family form, Bernoulli and Gaussian membership derived, the three GLM assumptions, OLS and logistic falling out, canonical link/response functions).
- Murphy Ch. 12 (GLM = exponential-family response with η = wᵀx; shared gradient g = (y−μ)x and Hessian; §12.4 convexity/uniqueness of the MLE), §3.4 (log-partition derivatives give mean and variance — derive).
- Bishop §2.4 (exponential family, sufficient statistics, conjugate priors; §4.3.6 canonical links make the gradient universal).
- Casella & Berger §3.4 (exponential families precisely: natural parameterization, curved vs full; Thm 3.4.2 differentiation identity).

## Key points
1. The exponential family form p(y|η) = b(y) exp(ηT(y) − a(η)); Bernoulli, Gaussian, Poisson each REWRITTEN into it with the algebra shown (the rewriting is the skill).
2. The log-partition a(η) as the moment factory: a′(η) = E[T], a″(η) = Var[T] — derived by differentiating the normalization identity; ties back to fisher-information (I(η) = a″(η)).
3. The three GLM assumptions (CS229's framing) and what each buys; the canonical link falling out rather than chosen; the response-function table (identity / sigmoid / exp).
4. The universal gradient: ∇ℓ = Σ(y_i − μ_i)x_i for EVERY canonical GLM — derived once, then read three ways (least squares' residuals, logistic's (y−p)x, Poisson's (y−e^{wᵀx})x). This is the lesson's punchline; module 4 will lean on it.
5. Fisher scoring = IRLS preview: Newton with the expected Hessian XᵀWX; one derivation paragraph, full IRLS deferred to logistic-regression.
6. Deviance defined (2×log-lik gap to saturated model) with squared error recovered as the Gaussian case — the metric the application lesson needs.
7. Sufficiency one-pager: exponential families are exactly the fixed-size-summary families (Pitman–Koopman flavor, stated) — why these families and no others.

## Set pieces & gems
- The "one gradient, three models" table — the unification made visual; the module's keeper.
- Bernoulli's natural parameter IS the log-odds — the sigmoid is not a choice, it is algebra (sets up logistic-regression's opening).
- Casella–Berger's curved-family parabola (Example 3.4.8) as a ★ aside.

## Pitfalls
- Do not re-derive full Newton (gradient-descent owns it) or full IRLS (logistic-regression owns it).
- Dispersion parameters (Gaussian σ², overdispersion) — one honest paragraph, not the full two-parameter family machinery.
- Keep Poisson concrete: rates, counts, the log link's positivity guarantee; the application lesson does the data work.

## FIGURE PLAN
- draw: The rewriting machine — Bernoulli pmf transformed step by step into exponential-family form with each identified component (η, T, a, b) color-bound to its slot in the general formula. FigureSequence (3 frames: Bernoulli, Gaussian, Poisson), same layout each frame.
- draw: a(η) for the Bernoulli with its first two derivatives plotted: mean curve (sigmoid!) and variance curve — the moment-factory picture. Single Figure.
- draw: The GLM assembly diagram — x → linear predictor η = wᵀx → response function → mean μ → exponential-family noise → y; the three model rows (linear/logistic/Poisson) as instances below, arrows only up/right (voita arch. rule). Single Figure.
- draw: The universal gradient dissected — ∇ℓ = Σ(y−μ)x with underbraces: "prediction error" × "features"; the three instantiations listed under the brace. Single Figure.
- draw: Canonical-link geometry — for Poisson: the mean μ=e^η always positive vs a straight-line fit going negative (the flaw the application lesson exhibits on real data). Two-panel comparison.

## EXERCISE PLAN
1. Warm-up: rewrite the geometric distribution into exponential-family form; identify η, T, a.
2. Derivation skipped: derive Var[T] = a″(η) (the lesson derives the mean; reader does the second derivative).
3. Boundary probe: the Bernoulli at p→0 — η → −∞: the natural parameter space is open; what does an MLE at the boundary mean (perfect separation preview) and why is the MAP finite?
4. Claim to refute: "any invertible response function gives a GLM with the (y−μ)x gradient." Refute: derive the extra μ′(η) factor for a non-canonical link (probit); name what canonicity was doing.
5. Mixed review (E3): compute the Fisher information matrix XᵀWX for logistic regression at a given 3-point dataset (fisher-information + this lesson composed).
6. Research-shaped: for the insurance-claims setting (94% zeros, mean rate ≈ 0.1), compute what fraction of a Gaussian model's probability mass falls below zero at the fitted mean — quantify the wrongness the next lesson shows on real data.
7. FORWARD (E7): write the deviance for the Poisson model and evaluate it on a 5-row toy portfolio for two candidate models. Solution: this is the metric that ranks the real models in the application lesson → Ref insurance-claims.

## ARC
- Inherits: the likelihood engine (mle-map), curvature/information (fisher-information), Newton (gradient-descent).
- Contributes: the unification — one family, one gradient, one link discipline — that turns module 2's engine into a model factory.
- Hands off: the factory run on real data (insurance-claims); the Bernoulli branch expanded into module 4's first road (logistic-regression).
- Spine step: "Estimation has a common engine — the likelihood — and a floor…" (step 2).

## REVISION (vs old draft)
- Status change: extra → core. The draft must gain the module-spine seams (it was an off-path appendix; now it is the unification the module argues toward).
- Gains: the a″(η) = I(η) tie to fisher-information (new lesson); the sufficiency one-pager; deviance defined here (the old draft mentions deviance in one key_idea — now it needs the derivation since insurance-claims depends on it); FigureSequence for the rewriting machine.
- Loses: the insurance-claims worked case moves OUT (it becomes the application lesson — keep only a one-sentence pointer); interview framing.
- Exercises rebuilt to floor; add the mixed fisher-information item.
