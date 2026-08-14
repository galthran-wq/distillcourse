# Insurance claims: Poisson regression at scale — research brief

Lesson: `insurance-claims` (module: estimation, core, planned). NEW — module 2's APPLICATION lesson (L16).
Goal: Apply the GLM machinery to a real 678k-policy claims dataset and explain why deviance, not squared error, ranks the models.

## Sources
- Murphy §12.5 (the entire artifact: French motor-insurance claims, 678k rows, 94% zero-claim; dummy/ridge/Poisson comparison; Table 12.1 deviance vs MSE/MAE; calibration plots; Fig 12.1 four-histogram panel).
- Murphy §12.2.2–12.3 (binomial/Poisson regression mechanics; link options) — supporting.
- ESL §10.14.2 (NZ fisheries zero-inflated catch modeling E(Y|X)=E(Y|Y>0,X)·Pr(Y>0|X)) — ★ aside on composite models for excess zeros, with the real trawl-map image available.

## Key points (APPLICATION spec)
- The artifact: Murphy's published insurance-claims study — a real actuarial modeling task (pricing risk = predicting claim frequency).
- Module results used: GLM construction and the log link (glm); MLE fitting (mle-map, gradient-descent); deviance as the likelihood-derived metric (glm); the universal gradient for fitting at scale (glm + gradient-descent: SGD is what makes 678k rows routine).
- Where the idealization departs: exposure varies per policy (offset terms — introduce log-exposure offset briefly); portfolios are not iid (correlated risks, drift year to year); the target is long-tailed beyond Poisson (overdispersion — name negative binomial as the exit).
1. The data's shape first (L4): the claim-count histogram — 94% zeros, a long tail. What a Gaussian likelihood asserts about this histogram, and why that is absurd (mass below zero, symmetric tails).
2. The three models compared as in the source: constant-rate dummy, ridge (Gaussian likelihood), Poisson GLM. Ridge predicts negative claim rates for real policies — show it.
3. The ranking flip: MSE ranks ridge above Poisson; deviance ranks them correctly. Compute both metrics on a 6-row extract by hand so the flip is visible arithmetic, then report the full-data numbers.
4. Calibration for rate models: predicted-decile vs observed-frequency plot; what an actuary actually needs (prices, not point predictions).
5. The offset: modeling counts with unequal exposure — one derivation paragraph (rate × exposure inside the log link).

## Set pieces & gems
- Murphy Fig 12.1's four histograms — the real image is captured; the hand-computed 6-row deviance/MSE flip is our own addition.
- The ★ NZ fisheries zero-inflation aside (ESL §10.14.2) with the trawl map — real science using the same GLM discipline.

## Pitfalls
- This is an application lesson: no new theory beyond the offset; everything else is module-2 retrieval-plus-application.
- Do not moralize ("always use deviance") — state the scope: likelihood-derived metrics for likelihood-modeled targets.
- Keep actuarial vocabulary minimal (policy, exposure, claim frequency — three terms, each defined).

## FIGURE PLAN
- source: probabilisti-s3-insurance-claims-fig12-1 — stem `claims-histograms`, reader must see the four log-scale histograms (data vs dummy/ridge/Poisson predictions) including ridge's negative-rate mass; placement: centered, after the models are fitted.
- draw: What each likelihood asserts — the claim-count histogram with a Gaussian density overlaid (mass < 0 shaded red) vs a Poisson pmf overlaid (support on 0,1,2…). Two-panel comparison; the lesson's opening visual.
- draw: The ranking-flip table as a figure — 6 policies × (true count, ridge pred, Poisson pred) with MSE and deviance computed per row and totaled; amber on the flipped verdict. Single Figure.
- draw: Calibration-by-decile plot — predicted rate deciles vs observed frequency for ridge and Poisson (recreated qualitatively from the source's description). Single Figure.
- draw: The offset — two policies, same risk rate, exposures 0.5yr vs 2yr; expected counts differing 4×; the log-exposure term entering η. Single small Figure.
- source: theelements-s2-nz-fish-trawl-map — stem `nz-trawls`, reader must see the real trawl locations and presence dots around NZ; placement: inside the ★ zero-inflation aside, float right.

## EXERCISE PLAN
1. Warm-up: compute the Poisson deviance contribution of one policy (y=2, μ̂=0.5) from the formula derived in glm.
2. Boundary probe: a policy with y=0 — show its deviance term reduces to 2μ̂ and stays finite, while log-likelihood terms with ŷ→0 under a mis-specified model diverge; which model family owns the failure.
3. Claim to refute: "ridge's better MSE means it predicts claims better." Refute with the decomposition: MSE rewards predicting near the conditional MEAN even via impossible negatives; deviance scores the whole asserted distribution. Name the step (metric ≠ likelihood) that fails.
4. Derivation skipped: derive the Poisson GLM with offset — show log E[y] = log t + wᵀx gives the rate interpretation, and the gradient keeps the (y−μ)x form.
5. Research-shaped: reproduce the flip in miniature — fit constant, linear-Gaussian, and Poisson models on a provided 1,000-row synthetic portfolio (generator stated) and report MSE + deviance for each; state which ordering agrees with Murphy's Table 12.1.
6. FORWARD (E7): fit the Gaussian model anyway and examine its residual-vs-fitted plot — the funnel shape. Solution: that funnel is heteroscedasticity, diagnosed properly in module 3 → Ref regression-diagnostics.

## ARC
- Inherits: the whole of module 2 — likelihood engine, GLM factory, deviance, SGD-scale fitting.
- Contributes: the module cashed out on a real 678k-row actuarial task; the demonstration that the metric belongs to the model family, not to habit.
- Hands off: the Gaussian linear model, about to get its own module — including the diagnostic toolkit whose absence this lesson just exposed (funnel residuals).
- Spine step: "Estimation has a common engine — the likelihood — and a floor…" (step 2, closing move).
