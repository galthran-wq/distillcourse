# Maximum likelihood and MAP estimation — research brief

Lesson: `mle-map` (module: estimation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/mle-map/lesson.mdx (22 min).
Goal: Compute maximum-likelihood and MAP estimates for standard models and connect priors to regularization penalties.

## Sources
- Murphy §4.2 (MLE definition; justification via KL to the empirical distribution; worked Bernoulli/categorical/Gaussian/linear-regression MLEs), §4.5 (MAP = regularized NLL; add-one smoothing; shrinkage), §4.6.2 (beta-binomial fully worked: posterior, mode, mean, predictive).
- Casella & Berger §7.2.2 (MLE definition and invariance property), §6.3.1 (the likelihood function as the data's summary).
- Bishop §1.2.5 + §2.1–2.2 (regularized curve fitting = MAP with λ = α/β; conjugate Beta/Dirichlet machinery; the (N−1)/N variance bias, Fig 1.15).
- SSBD §24.1 (MLE = ERM under log-loss; the θ̂=0 infinite-risk overfitting example).

## Key points
1. The likelihood as a function of θ with data fixed; the recipe (log, differentiate, solve) run in full on: Bernoulli (θ̂ = k/n), Gaussian (μ̂ = x̄, σ̂² with its 1/n bias derived — Bishop Fig 1.15 idea), categorical (Lagrange multiplier for the simplex constraint — show it).
2. MLE ≡ minimizing KL(empirical ‖ model) ≡ ERM with log-loss (Murphy §4.2.2 / SSBD 24.1.2) — bind module 1's frame to module 2's engine. KeyFact candidate.
3. Least squares as MLE under Gaussian noise — derived here in scalar form; module 3 does the matrix version. Sets the pattern "loss = negative log-likelihood".
4. Failure mode: zero counts / small n. SSBD's Bernoulli θ̂=0 giving infinite log-loss risk; the black-swan framing.
5. The fix: priors. Beta-Bernoulli worked completely — posterior Beta(α+k, β+n−k); MAP as pseudo-counts; add-one smoothing recovered. MAP = argmax [log-lik + log prior]: the log prior IS a penalty. Gaussian prior → L2, Laplace prior → L1, stated with the one-line algebra, flagged as used all course.
6. MLE vs MAP vs full posterior — one honest paragraph: MAP is a point estimate; the full-posterior road is module 10's.

## Set pieces & gems
- Bishop's Fig 1.15 (three 2-point samples showing why σ̂²_MLE underestimates) — recreate.
- Murphy's black-swan / add-one smoothing story (§4.5.1).
- Casella–Berger invariance property (MLE of g(θ) is g(θ̂)) as a ★ starred section with the plug-in proof sketch.

## Pitfalls
- Keep the Bayesian machinery minimal — conjugacy appears ONLY as Beta-Bernoulli; Dirichlet gets one sentence (naive-bayes will use it).
- Don't do Fisher information here (next lesson); don't derive the matrix OLS (module 3).
- The σ² bias derivation must not silently swap n and n−1 conventions.

## FIGURE PLAN
- draw: The likelihood function — for 7 coin flips (5 heads), L(θ) plotted with the maximum marked; second panel log L(θ) with the same argmax (monotone transform). Two panels, one idea: why we may take logs.
- draw: FigureSequence (3 frames): the recipe on the Gaussian mean — (1) three data points and a sliding μ with the product of densities as bar heights, (2) the log-likelihood curve in μ, (3) derivative-zero at x̄. One element changes per frame.
- draw: Bias of σ̂²_MLE — several 2-point samples, each with its fitted (mean-centered) Gaussian narrower than the truth; the E[σ̂²] = (n−1)/n·σ² statement bound to the picture. Recreation of Bishop Fig 1.15.
- draw: Beta-Bernoulli updating — prior Beta(2,2), likelihood for 5H/2T, posterior Beta(7,4) as three aligned curves with the pseudo-count arithmetic labeled on the axis. Single Figure.
- draw: The penalty dictionary — MAP objective with the log-prior term underbraced; two columns: Gaussian prior ↔ λ‖θ‖², Laplace prior ↔ λ‖θ‖₁, each with its density silhouette. Single Figure (the course's most-reused correspondence).

## EXERCISE PLAN
1. Warm-up: MLE for the exponential distribution's rate from 4 given observations (log, differentiate, solve — a family the lesson didn't do).
2. Derivation skipped: derive the categorical MLE with the Lagrange multiplier for Σθ_j = 1 in full (the lesson shows the setup; the reader finishes).
3. Boundary probe: n=1 Gaussian observation — σ̂²_MLE = 0; state exactly which use of the estimate breaks (predictive density is a delta) and how MAP with any proper prior repairs it.
4. Claim to refute: "the MLE is unbiased." Break it with σ̂²; then exhibit an unbiased estimator with larger MSE (the module-1 shrinkage echo), naming the trade.
5. Mixed review (E3): compute the risk (module 1's definition, log-loss) of θ̂=0 after 3 tails — infinite; then of the add-one estimate — finite. The memorizer's ghost in estimation.
6. FORWARD (E7): for the Bernoulli MLE, compute Var(θ̂) = θ(1−θ)/n and compare with 1/(n·I(θ)) computed from I(θ) = 1/(θ(1−θ)) — they match. Solution: that denominator is the Fisher information; the coincidence is the next lesson's theorem → Ref fisher-information.

## ARC
- Inherits: risk/ERM from module 1; the open question "where do the losses come from?".
- Contributes: the likelihood as the universal loss factory; MAP as the penalty factory. Estimation now has one engine.
- Hands off: "how good can any estimator be?" → fisher-information.
- Spine step: "Estimation has a common engine — the likelihood — and a floor…" (step 2).

## REVISION (vs old draft)
- Gains: the KL/ERM equivalence section (binds module 1); full Beta-Bernoulli derivation (old draft states pseudo-counts without the posterior algebra); σ²-bias derivation with figure; the SSBD infinite-risk example; the FORWARD exercise into Fisher information; L10 seams (opening move-placement + closing hand-off to fisher-information, which did not exist before).
- Loses: interview register; the "used all course" claim must become concrete forward Refs (ridge-lasso, naive-bayes, bayesian-linear-regression).
- Exercises rebuilt to the floor above; old drill items retired.
