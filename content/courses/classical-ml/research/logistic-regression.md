# Logistic regression — research brief

Lesson: `logistic-regression` (module: boundaries, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/logistic-regression/lesson.mdx (26 min).
Goal: Derive the logistic-regression loss and gradient from the Bernoulli likelihood and analyze its behavior on separable data.

## Sources
- ESL §4.4 (model; Newton–Raphson = IRLS eqs 4.21–4.28; the South African heart disease (CORIS) case §4.4.2 with Table 4.2's counterintuitive Z-scores; L1-logistic §4.4.4; logistic-or-LDA §4.4.5 — feeds lda-gda).
- Murphy Ch. 10 (MLE has no closed form; SGD/IRLS/bound optimization; MAP = weight decay; perceptron as the degenerate limit — one paragraph).
- Casella & Berger §12.3 (the Challenger O-ring example 12.3.1: 23 launches, Table 12.3.1 data, P(failure at 31°F)=0.9996, Fig 12.3.1).
- CS229 Ch. 2 (gradient derivation with σ′=σ(1−σ) — mirror the completeness).
- ISLP §4.3 (odds-ratio interpretation; Default data — context).

## Key points
1. Road 1 of 3 (module framing): model p(y=1|x) directly. The sigmoid is not a choice: it inverts the log-odds, and glm showed the Bernoulli's natural parameter IS the log-odds — recap seam, two sentences.
2. Likelihood → cross-entropy loss; the gradient derived in full: ∇ℓ = Σ(y_i − p_i)x_i (the glm universal gradient, now earned concretely); convexity proved via the Hessian XᵀWX ⪰ 0, W = diag(p_i(1−p_i)).
3. Newton = IRLS derived: the update as weighted least squares on the adjusted response z = Xβ + W⁻¹(y−p); why it converges in a handful of steps; the O(d³) price (gradient-descent seam).
4. Reading coefficients: log odds-ratios; the CORIS table — sbp and obesity NOT significant despite being risk factors (correlated-predictor reshuffling; diagnostics-module echo).
5. The Challenger worked end to end: data table, fit, the 31°F extrapolation 0.9996 — with the honest extrapolation caveat (no data below 53°F).
6. Separable data: the likelihood has no maximum — ‖β‖→∞, probabilities saturate; proof sketch (scaling any separating β increases likelihood); L2 regularization as the standard fix; a warning that perfect training accuracy on small-n wide-p data is this pathology, not success.
7. Multinomial/softmax extension — one compact section (the machinery, not a second lesson).

## Set pieces & gems
- Challenger (C&B Example 12.3.1) — THE application-grade worked example; real data in the exercise pool.
- CORIS Z-score table (ESL Table 4.2) — the interpretation trap set piece.
- Murphy's bi-tempered aside — skip (noise-robust logistic is off-path; one reference line at most).

## Pitfalls
- Do not re-derive the GLM frame — Ref glm and inherit; this lesson's new content is IRLS, separability, and interpretation.
- The Challenger extrapolation needs its honesty paragraph (the fitted curve is being read far outside the data).
- "Why not squared error on probabilities" — keep the old draft's point but ground it: non-convexity + gradient vanishing at confident wrong answers, shown with the actual gradient expression.

## FIGURE PLAN
- draw: The three roads signpost — one 2-class scatter with three question marks: p(y|x)? p(x|y)? margin? — the module's map, appearing here and re-inked in later lessons. Single small Figure.
- draw: Sigmoid anatomy — log-odds line η(x) below, sigma(η) above, decision boundary at η=0 marked on both; coefficients as slopes of the LOWER panel. Single Figure fixing the "logistic is nonlinear" half-truth.
- draw: FigureSequence (3 frames): IRLS on 1-D data — (1) current p_i with weights w_i as dot sizes, (2) the adjusted response z_i constructed, (3) the weighted least-squares refit; loss ticking down per frame.
- draw: The Challenger plot — O-ring failures (0/1) vs launch temperature with the fitted curve and the 31°F extrapolation highlighted beyond the data range (shaded "no data here" zone). Recreation of C&B Fig 12.3.1 with real data values.
- draw: Separable pathology — two separable clusters, three fitted sigmoids at ‖β‖ = 1, 5, 25 sharpening toward a step; loss decreasing, ‖β‖ exploding, tally beside. Single Figure.
- draw: Loss comparison — cross-entropy vs squared error on p as functions of η at y=1; squared error's flat region at confident-wrong marked. Single Figure.

## EXERCISE PLAN
1. Warm-up: given β̂ for the Challenger fit, compute the predicted failure probability at 65°F and the odds ratio per −5°F.
2. Derivation skipped: derive the Hessian XᵀWX from the gradient and conclude convexity; state where strict convexity fails (separable / rank-deficient).
3. Boundary probe: a dataset where one feature perfectly predicts y — show the MLE for that coefficient is +∞, the fitted probabilities are 0/1, and the L2-regularized optimum is finite; name the KKT-level reason.
4. Claim to refute: "logistic regression is a linear model, so it cannot give calibrated probabilities for nonlinear problems." Separate the two claims: the BOUNDARY is linear; calibration failure is a different property (module 5's subject) — construct a nonlinear-truth example where logistic's boundary is wrong but its probabilities near the boundary are still monotone-reasonable.
5. Mixed review (E3): recompute the CORIS puzzle in miniature — simulate two correlated risk factors where the weaker one's coefficient flips sign in the joint fit; explain via regression-diagnostics' confounding frame.
6. Research-shaped: fit the Challenger data yourself (23 rows provided); reproduce 0.9996 at 31°F and report the fitted coefficients against C&B's; state the launch-decision implication in one sentence.
7. FORWARD (E7): fit logistic regression on 2-class Gaussian data with EQUAL covariances and compare its boundary with the line you get from computing class means and pooled covariance directly. Solution: the second construction is LDA; the same functional form from opposite reasoning is the lda-gda lesson → Ref lda-gda.

## ARC
- Inherits: the GLM factory (glm) — sigmoid and gradient pre-paid; Newton (gradient-descent).
- Contributes: road 1 — the discriminative probabilistic boundary, its fitting (IRLS), its pathologies (separability), its interpretation discipline.
- Hands off: the same boundary reached from class-modeling (naive-bayes, lda-gda) and from geometry (svm-max-margin) — the module's comparison begins.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4).

## REVISION (vs old draft)
- Gains: full IRLS derivation (old has it as a bullet); the Challenger and CORIS set pieces with real data; the separability proof sketch (old asserts divergence); multinomial section; seams to glm (the old draft re-derives the sigmoid from scratch — now it must inherit and go deeper instead).
- Loses: interview framing; the standalone "why not squared error" section shrinks into the loss-comparison figure + one paragraph.
- Exercises rebuilt; the old set's derivation drills replaced by the floor items above.
