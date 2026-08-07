# Research brief: regression-diagnostics (Linear regression assumptions and diagnostics)

status: planned
module: linear-regression
type: core
goal: Analyze violations of the linear-model assumptions — collinearity, heteroscedasticity, outliers, leverage — and select the standard remedies.

DS-interview loops (analytics/product) lean on this lesson more than on
derivations; keep it checklist-shaped and example-driven.

## Sources to consult

- ISLP **ch. 3, "Potential Problems"** — the definitive checklist: (1)
  non-linearity of the response, (2) correlated errors, (3) heteroscedastic
  errors, (4) outliers, (5) high-leverage points, (6) collinearity — each
  with its diagnostic plot and remedy. This section IS the lesson skeleton.
- ISLP ch. 3 — R², adjusted R², standard errors/confidence intervals,
  qualitative predictors and interactions; the Auto data mpg~horsepower
  non-linearity (residual pattern → add polynomial term).
- ESL **§3.2.2** — variance inflation under correlation (theoretical
  grounding); Z-scores; prostate-data Table 3.2 as the worked
  coefficient-table reading exercise.
- Ace the DS Interview, ch. 6 — "Two Sigma: multicollinearity in regression"
  (effects on coefficients, VIF, remedies) — worked as an exercise.
- Murphy §11.6 (robust regression: Student-t/Huber) — one-Aside pointer for
  the outlier remedy.

## Key points the lesson must cover

1. Frame: OLS answers are conditional on assumptions (recap ladder from ols,
   one sentence + Ref). The diagnostics are how you check each rung.
2. **Multicollinearity**: symptom — huge coefficient standard errors, signs
   flipping, individually insignificant but jointly significant features;
   measure — VIF_j = 1/(1−R_j²) with the compute-by-hand recipe (regress
   feature j on the rest), rule-of-thumb VIF>5–10; remedies — drop/combine,
   ridge (spiral ref). Predictions can remain fine — the point interviewers
   want.
3. **Heteroscedasticity**: funnel-shaped residual plot; consequences — OLS
   still unbiased, Gauss–Markov and standard errors break; remedies — log/
   variance-stabilizing transforms, weighted least squares, robust (sandwich)
   SEs in one sentence.
4. **Outliers vs leverage vs influence**: y-outlier (large residual) vs
   x-outlier (leverage h_ii from the hat matrix — reuse from ols) vs
   influence (Cook's distance = both). One 2D picture each; deletion is a
   last resort, investigate first.
5. Residual-plot reading as a skill: the 2×2 gallery (good / non-linear /
   funnel / autocorrelated) — the interview screenshot question.
6. **R² and adjusted R²**: R² never decreases when adding features (why —
   nested models), adjusted penalizes; R² says fit, not validity (Anscombe
   one-liner) and not causality. Coefficient interpretation: "holding others
   fixed" and why collinearity breaks that phrase.

## Interview questions to work as exercises

- "You add a feature and R² goes up. Is the model better?" (adjusted R², CV)
- "Two Sigma: what happens to your coefficients under multicollinearity, how
  do you detect (VIF) and fix it?" (full worked answer)
- "OLS residual plot shows a funnel. What breaks and what do you do?"
- "Your coefficient for price is positive in simple regression, negative
  with more features. Explain." (confounding/collinearity; Simpson's
  paradox one-liner)
- "Compute VIF for feature 1 given R₁²=0.9." (=10; interpret)
- "Point A has huge residual, point B sits far right on x with small
  residual. Which is more dangerous?" (leverage/influence)

## Pitfalls / subtleties to flag

- Multicollinearity hurts *inference/interpretation*, not necessarily
  *prediction* — the distinction is the interview point.
- Heteroscedasticity does NOT bias coefficients — only their standard errors
  and efficiency; a classic true/false trap.
- Do not teach p-value dredging: many-feature stepwise + p-values invites
  multiple-testing critique; one warning Remark.
- Correlated errors (time series) invalidate i.i.d. CIs — connect forward to
  time-split validation in cross-validation-bootstrap.
- High R² with a wrong model (nonlinear pattern) and low R² with a correct
  noisy model are both possible; R² is not a model-validity test.

## FIGURE PLAN

1. **single `<Figure>`** — the residual-plot gallery, 2×2: well-behaved /
   curved (non-linearity) / funnel (heteroscedasticity) / tracking
   (autocorrelation), each with a one-line diagnosis label. Inspiration:
   ISLP ch. 3 residual figures.
2. **single `<Figure>`** — collinearity: scatter of x1 vs x2 nearly on a
   line, plus the coefficient-uncertainty ellipse elongated along
   β1+β2=const; caption ties to "sum well-determined, split not".
   Inspiration: ESL §3.2.2.
3. **single `<Figure>`** — VIF pipeline: regress x_j on the rest → R_j² →
   VIF formula → threshold verdicts for a 4-feature example table. One idea:
   VIF is just an R².
4. **single `<Figure>`** — outlier vs leverage vs influence: three panels of
   the same base scatter with one added red point (high residual low
   leverage / high leverage low residual / both) and the fitted line with
   and without it. Inspiration: ISLP outlier/leverage figures.
5. **single `<Figure>`** — R² inflation: R² and adjusted R² vs number of
   junk features added to a fixed dataset; R² climbs, adjusted flattens/falls.
6. **single `<Figure>`** — heteroscedasticity before/after log transform:
   funnel residuals → even band, side by side. One idea: the standard fix
   visibly working.
