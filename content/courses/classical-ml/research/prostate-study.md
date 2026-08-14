# The prostate study: six estimators, one dataset — research brief

Lesson: `prostate-study` (module: linear-model, core, planned). NEW — module 3's APPLICATION lesson (L16).
Goal: Compare OLS, best subset, ridge, and lasso on the prostate-cancer dataset and justify a model choice with the one-standard-error rule.

## Sources
- ESL §3.2.1 + §3.3–3.4 (the prostate thread: Stamey et al. 1989 data — 97 men, log-PSA from 8 clinical predictors; Table 3.3 comparing LS/best-subset/ridge/lasso/PCR/PLS coefficients and test errors; Figs 3.5–3.7 one-SE model-size selection; Figs 3.8/3.10 ridge and lasso paths vs df; Fig 1.1 scatterplot matrix).
- Murphy §11.4.5 (the same data through OLS/subset/ridge/lasso with a coefficient table AND test-error boxplot — "the single best compare-four-estimators-end-to-end worked example").
- ISLP §6.1.3 (Cp/BIC/adjusted-R² vs validation — one paragraph of context only; CV detail deferred).

## Key points (APPLICATION spec)
- The artifact: ESL's own running study — the canonical published comparison this module's lab then rebuilds.
- Module results used: OLS fit + inference (ols); ridge/lasso paths and their geometry (ridge-lasso); collinearity reading of coefficient reshuffling (regression-diagnostics); df as the common complexity scale (splines-gams).
- Where the idealization departs: n=97 — error bars on estimated prediction error overlap, so "the winner" is not statistically separable (ESL says this; the lesson makes it the headline honesty point); the train/test split is a single split; clinical usefulness ≠ predictive R².
1. The data introduced properly (L11): what PSA is, the 8 predictors, the correlations that matter (lcavol–lcp ≈ .7, gleason–pgg45).
2. The scatterplot-matrix read — before any fitting, what the eye already sees (lcavol dominant).
3. The six fits: full OLS (with Z-scores; which predictors look significant), best subset (size by one-SE), ridge (df≈5), lasso (3 survivors: lcavol, lweight, svi). Coefficient table reproduced; PCR/PLS as one contextual row each (not derived — name them, point at pca for the idea).
4. Reading the table as this module's exam: why lasso zeroed lcp (its signal routed through lcavol — the collinearity reshuffle); why ridge kept everyone small; why subset and lasso roughly agree here.
5. The one-SE rule stated and applied: prefer the simplest model within one SE of the best; the estimated-error-with-bars figure. CV machinery is a black box here with an explicit IOU to module 5 (one sentence).
6. The verdict paragraph: what a practitioner reports (test errors ~0.44–0.57, overlapping bars), and what the module's theory adds to the raw numbers.

## Set pieces & gems
- ESL Table 3.3 — reproduce as OUR table (rounded per L12; exact values in the lab's acceptance test).
- Murphy's test-error boxplot idea — recreate.
- The lcavol/lcp sign-flip under lasso as the collinearity morality tale.

## Pitfalls
- No new estimators, no new theory: PCR/PLS get named, not taught (pca owns the idea later).
- Keep the CV black box honest: say exactly what is deferred (how the bars were computed) and where it lands (cross-validation-bootstrap).
- Don't oversell the lasso's selection as "finding the true variables" — n=97.

## FIGURE PLAN
- draw: Scatterplot-matrix extract — 4×4 corner of the prostate matrix (lpsa, lcavol, lweight, lcp) with the strong pairs highlighted. Inspired by ESL Fig 1.1. Opener.
- draw: The coefficient table as a figure — 8 predictors × 4 estimators dot-plot (aligned dots per row, one color per estimator; zeros rendered as hollow) — the comparison at a glance. Key image candidate.
- draw: Paths with the chosen point — ridge path and lasso path side by side (from ridge-lasso's machinery, this data), each with its selected λ/df marked. Two-panel.
- draw: Estimated prediction error vs model size with ±1 SE bars and the one-SE choice marked. Recreation of ESL Fig 3.7's logic.
- draw: Test-error verdict — five estimators' test errors as dots with overlapping interval bars; caption states the non-separability honestly. Inspired by Murphy Fig 11.12.

## EXERCISE PLAN
1. Warm-up: from the reproduced table, read off which predictors every estimator keeps and which only OLS keeps; one sentence each on why.
2. Boundary probe: apply the one-SE rule when the error curve is flat (all sizes within one SE) — what does the rule return, and why is that the right degenerate answer (the smallest model)?
3. Claim to refute: "lasso dropped lcp, so lcp is unrelated to PSA." Refute with the marginal correlation (it is strongly related) vs conditional role (routed through lcavol); name the confusion (selection ≠ marginal relevance).
4. Derivation skipped: show that if two columns are exactly equal, the lasso solution set contains a continuum (any split of one coefficient), while ridge picks the symmetric split — derive the ridge claim from strict convexity.
5. Research-shaped: with the provided data and your ridge-lasso knowledge, refit at the published λ choices and report where your coefficients differ from Table 3.3 beyond rounding; diagnose one difference (standardization convention).
6. FORWARD (E7): compute the 10-fold CV curve for the lasso path yourself using a given fold assignment; mark the one-SE point. Solution: why 10 folds, and what this estimate's own bias/variance are, is module 5's opening question → Ref cross-validation-bootstrap.

## ARC
- Inherits: the whole of module 3 — solution, penalties, diagnostics, df scale.
- Contributes: the module cashed out on its own canonical dataset; the honest reading of a real model-selection table (including its non-verdict).
- Hands off: the machinery this lesson used as a black box (CV, one-SE bars) becomes module 5's subject; the lab rebuilds every estimator used here.
- Spine step: "The linear model makes the bias–variance trade explicit…" (step 3, closing move before the lab).
