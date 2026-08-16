# The bias–variance decomposition — research brief

Lesson: `bias-variance` (module: generalization, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/bias-variance/lesson.mdx (24 min, interview framing).
Goal: Derive the bias–variance decomposition of expected test error and use it to diagnose underfitting and overfitting.

## Sources
- ESL §2.9 (k-NN decomposition, eq 2.46–2.47, Fig 2.11 — the archetype U-curve), §7.2–7.3 (full treatment: Err(x0) = σ² + Bias² + Var, closed forms for k-NN eq 7.10 and linear/ridge fits eq 7.11–7.14; model bias vs estimation bias; §7.3.1 why 0–1 loss does NOT decompose additively).
- ISLP §2.2.2 (Figs 2.9–2.12 — the three-panel flexibility comparison; gentler derivation of Eq 2.7).
- Murphy §4.7.6 (MSE = bias² + variance for estimators; MAP-vs-MLE Gaussian-mean example where a well-tuned prior beats MLE; the trade-off "breaks down for classification").
- CS229 Ch. 8.1 (the double-descent teaser lives there — do NOT bring it in here; module 11 owns it, but the closing hand-off can note the U-curve will be revisited).

## Key points
1. The decomposition derived in full at a fixed x0: add and subtract E[f̂(x0)], expand, cross terms vanish by independence of ε and f̂ — every algebra step visible (L7 standard). State clearly what is random (the training set) and what is fixed (x0).
2. The three terms read as physics: noise (floor, from lesson 1's Bayes error), bias² (wrong family / too rigid), variance (sensitivity to the sample).
3. Closed forms: k-NN — Bias = f(x0) − (1/k)Σf(x(ℓ)), Var = σ²/k (ESL eq 7.10): k dials the trade explicitly. Linear regression: average variance = p/N·σ² — variance grows linearly in dimension.
4. Estimator version (Murphy §4.7.6): MSE(θ̂) = bias² + var; the shrunk mean with a mis-centered prior can still beat the MLE — the first hint that deliberate bias is a strategy (ridge foreshadowed).
5. The U-curve and diagnosis: learning curves for the two failure modes and the standard remedies table. KeyFact candidate: adding data cures variance, never bias.
6. Boundary honesty: the additive decomposition is a squared-error fact; for 0–1 loss, errors that don't cross the boundary are free (ESL §7.3.1) — a boxed warning, since "bias–variance" gets recited for classification where it is only a metaphor.

## Set pieces & gems
- ISLP Figs 2.9–2.12 recreated as the running demo data (three targets of increasing wiggliness, three fits each).
- Murphy Fig 4.24–4.26 (MSE-ratio-vs-n for MAP vs MLE) — recreate the ratio curve for the shrunk-mean example.
- The dartboard/bullseye bias-variance cartoon (Murphy) — SKIP; it explains estimators of a point, not curves, and invites misreading. Use fitted-curve spaghetti instead.

## Pitfalls
- The decomposition is over repeated training sets at fixed x0 — say so explicitly; the commonest confusion is "bias of one fitted model".
- Do not call the U-curve universal: module 11 breaks it. Plant one dry sentence: "this curve is the classical picture; the course returns to its edge cases at the end."
- Keep 0–1-loss caveat but don't develop margin theory here.

## FIGURE PLAN
- draw: The decomposition dissected in place — the identity with underbraces (noise / bias² / variance), each brace color-bound to a panel below showing what varies (voita figure rule 7). Single Figure.
- draw: FigureSequence (4 frames): 20 resampled training sets fitted by degree-1 then degree-9 polynomials; frame 1 one fit, frame 2 spaghetti of 20 fits (variance visible), frame 3 their average vs truth (bias visible), frame 4 the two panels side by side. This is the lesson's signature visual.
- draw: k-NN closed form — Var = σ²/k and Bias vs k plotted from a known target on one axis pair, sum overlaid; the analytic U-curve. Inspired by ESL Fig 2.11/7.3.
- draw: Learning-curve diagnosis panel — two side-by-side train/test-vs-n plots: high-bias (curves converge high) vs high-variance (gap persists); remedies listed under each. Inspired by ISLP/CS229 Fig 8.1 family.
- draw: Small comparison: squared loss vs 0–1 loss — an estimate that moves but never crosses the boundary changes squared error, not classification error. Two-panel figure for the §7.3.1 caveat.

## EXERCISE PLAN
1. Warm-up: for f̂(x0) with E[f̂]=3, Var=0.5, truth f(x0)=4, σ²=1: compute expected squared error and name each term's share.
2. Derivation skipped: derive the k-NN bias/variance closed form (ESL eq 7.10) from the decomposition; verify the k=1 and k=n endpoints.
3. Boundary probe: set σ²=0 (noiseless data). Which term survives for the memorizer from lesson 1? Show variance can still be nonzero while noise is zero — and what that says about "irreducible".
4. Claim to refute: "an unbiased estimator is always preferable." Use the shrunken-mean computation (Murphy §4.7.6) to exhibit a biased estimator with lower MSE; name where the claim's implicit step (comparing only bias) fails.
5. Mixed/spaced (E3): revisit lesson 1's resampling exercise — identify which observed quantity was bias and which was variance, now with names.
6. Research-shaped: reproduce ISLP Fig 2.12's qualitative result numerically: for one smooth target, tabulate bias²/variance at 3 flexibilities and check the sum tracks measured test MSE.
7. FORWARD (E7): compute the variance of the ridge estimator β̂λ = (XᵀX+λI)⁻¹Xᵀy in the orthonormal case as a function of λ, and note it is strictly less than OLS's at any λ>0. Solution: the bias it buys is priced in the ridge lesson → Ref ridge-lasso.

## ARC
- Inherits: risk and the memorizer from `statistical-learning` — fitting is free, learning is not; the open question is what exactly flexibility costs.
- Contributes: the exact price list — noise + bias² + variance — and the diagnosis toolkit.
- Hands off: a method that makes the dial physical (k in k-NN) and the dimension problem that breaks it → `knn-curse`.
- Spine step: "A finite sample can be fitted perfectly and teach nothing…" (step 1).

## REVISION (vs old draft)
- Gains: full ESL §7.3 treatment (closed forms for k-NN and linear fits; model-vs-estimation bias split); the estimator-level MSE version with the shrunk-mean worked example; the 0–1-loss non-decomposition caveat as a proper section; L10 seams placing the lesson after the new `statistical-learning` opener (the old draft self-introduces risk — now it must Ref lesson 1 instead); closing hand-off naming knn-curse and the module-11 return.
- Gains: exercise overhaul to the E6 floor above (old set is interview-drill flavored).
- Loses: interview framing throughout ("interview phrasing: the decomposition as answer skeleton" key idea and any "interviewers ask" sentences — L9); any KeyFact restating the just-proved identity (L15); citation theatre.
- Demo: keep BiasVarianceExplorer but add the resample task language (D1: the reader must DO the variance observation, not just slide degree).
