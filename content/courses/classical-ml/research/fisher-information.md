# Fisher information and the Cramér–Rao bound — research brief

Lesson: `fisher-information` (module: estimation, core, planned). NEW — explicitly requested by the course design ("how good can an estimator be at all").
Goal: Derive the Cramér–Rao lower bound from the score function and explain when the MLE attains it.

## Sources
- Casella & Berger §7.3.2 (THE core: Cramér–Rao Thm 7.3.9 proved via Cauchy–Schwarz — the book itself flags the proof as "elegantly simple"; Corollary 7.3.10 iid form; Lemma 7.3.11 second-derivative form; Corollary 7.3.15 attainment condition; the worked saga: Poisson pp.335–339, Uniform(0,θ) regularity failure, Gaussian-variance attainable-iff-μ-known pair Examples 7.3.14/7.3.16).
- Casella & Berger §10.1 (consistency; Thm 10.1.12 asymptotic normality/efficiency of the MLE via Taylor-expanding the score; §10.6.1 Hodges' superefficiency counterexample; §10.6.2 regularity conditions A1–A6).
- ESL §8.2.2 (Fisher information in the bootstrap/ML context — light cross-ref).
- Murphy §4.7.2 (sampling distribution of the MLE ≈ N(θ, I⁻¹) — the practical reading).

## Key points
1. The score ∂/∂θ log p(x|θ): zero mean under regularity (derived — differentiate ∫p = 1 under the integral, with the honesty note that the swap is the regularity condition). Fisher information as Var(score) and as −E[∂² log p] (equivalence derived).
2. Information adds over iid samples: I_n = n·I(θ) — one line, big consequence.
3. Cramér–Rao proved in full: Cov(W, score) = d/dθ E[W] (derived), then Cauchy–Schwarz. Every step visible; this is the module's centerpiece proof (playbook-math proof protocol: goal/mode/roadmap first).
4. Worked triptych from Casella–Berger: (a) Poisson — X̄ attains the bound, so it is THE best unbiased estimator, no search needed; (b) Gaussian σ² with μ unknown — bound = 2σ⁴/n, S² has 2σ⁴/(n−1): honest but unattainable (attainment corollary shows why); (c) Uniform(0,θ) — the "bound" is beaten because support depends on θ: regularity is load-bearing.
5. MLE asymptotics: √n(θ̂−θ) → N(0, I⁻¹) — statement, proof roadmap (Taylor-expand the score at θ̂, CLT numerator, LLN denominator), and the practical consequence: standard errors from the observed information.
6. ★ Superefficiency (Hodges): the estimator that beats the bound at a single point — why "asymptotically optimal" carries fine print.
7. What this buys the course: a floor for module 3's Gauss–Markov (OLS attains Cramér–Rao under Gaussian noise), the curvature machinery reused in GLMs and IRLS, and the module-1 lesson repeated at higher stakes — biased estimators (ridge) can still beat the floor in MSE because the floor only governs the unbiased.

## Set pieces & gems
- The Poisson saga (Examples 7.3.8→7.3.12): "a lower bound is more useful than pairwise comparison" — reproduce as the lesson's first full example.
- The Uniform(0,θ) trap — canonical regularity counterexample; reproduce with the Leibniz-rule resolution.
- Hodges' estimator (Miscellanea 10.6.1) for the ★ section.
- The figure ESL/C&B never draw (noted by the reader): Var(W) vs the 1/(nI(θ)) floor as functions of θ with an attaining and a non-attaining estimator — "a genuine addition rather than a copy".

## Pitfalls
- Regularity conditions: state the two used (interchange of ∫ and d/dθ; support free of θ) precisely but without measure theory; the Uniform example is the enforcement.
- Keep the multiparameter information MATRIX to one closing paragraph (GLM lesson uses it); scalar θ carries the lesson.
- Do not let the lesson become pure math-stats: every result must be read back to "how good can my estimator be".

## FIGURE PLAN
- draw: The score as a function of x at fixed θ and as a function of θ at fixed x — two-panel figure fixing the "which variable" confusion; the zero-mean property marked on panel 1.
- draw: Fisher information as curvature — two log-likelihoods (sharp vs flat) with the same max; I(θ) bound to the second derivative; "one observation says a lot / a little". Single Figure.
- draw: FigureSequence (3 frames) of the Cramér–Rao proof skeleton: (1) the two random variables W and score with their covariance identity, (2) Cauchy–Schwarz stated on them, (3) the rearranged bound. Frames change one line of algebra (formula-dissection style).
- draw: The floor plot — Var vs θ for the Poisson: X̄ ON the 1/(nI) curve; a second unbiased estimator strictly above; ridge-style biased estimator dipping below with the caption "the floor binds only the unbiased". Single Figure (the reader-suggested original).
- draw: Uniform(0,θ) — density with support [0,θ] moving as θ changes; the max-order-statistic estimator's variance vs the naive "bound" line it beats. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute I(θ) for Bernoulli (=1/θ(1−θ)) and check the mle-map forward exercise's match is Cramér–Rao attainment.
2. Derivation skipped: prove the equivalence Var(score) = −E[∂² log p] (differentiate the zero-mean identity once more).
3. Boundary probe: θ → 0 in the Bernoulli — I(θ) → ∞; reconcile "infinite information" with the practical difficulty of estimating rare-event probabilities (the bound is on ABSOLUTE variance; relative error still explodes).
4. Claim to refute: "S² is not the best unbiased estimator of σ², since it misses the bound — a better unbiased one must exist." Refute with the attainment corollary (equality forces a specific score form no unbiased estimator satisfies when μ is unknown); Lehmann–Scheffé gets one naming sentence.
5. Derivation: the exponential-family case — show I(η) = A″(η) (variance of the sufficient statistic), connecting to glm's log-partition derivatives (do after reading glm? No: derivable now, payoff named). 
6. Research-shaped: from the 1977 EM paper's genetics data (n=197), compute the observed information at the MLE and hence a standard error for π̂; compare with C.A.B. Smith's published ≈0.051.
7. FORWARD (E7): compute Var(β̂) for one-parameter least squares under Gaussian noise and verify OLS sits exactly on the Cramér–Rao floor. Solution: module 3 proves the distribution-free version of this optimality (Gauss–Markov) → Ref ols.

## ARC
- Inherits: the likelihood engine from mle-map; module 1's lesson that estimators are random objects with variance.
- Contributes: the floor — what "best possible" means for estimation — plus the tools (score, information) the rest of the course silently uses (IRLS, GLM curvature, observed-information error bars).
- Hands off: an engine (likelihood) and a floor (CRLB) but no algorithm for hard likelihoods → gradient-descent; and the floor's linear-model incarnation → ols.
- Spine step: "Estimation has a common engine — the likelihood — and a floor…" (step 2).
