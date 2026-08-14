# Forecasting CO₂: the Mauna Loa Gaussian process — research brief

Lesson: `mauna-loa` (module: uncertainty, core, planned). NEW — module 10's APPLICATION lesson (L16).
Goal: Reconstruct the Mauna Loa CO₂ model — a composite kernel fitted by marginal likelihood — and evaluate its 20-year extrapolation against what actually happened.

## Sources
- GPML §5.4.3 (the artifact: 1958–2003 monthly CO₂; the 4-term composite kernel — SE trend + periodic×SE-decay seasonal + rational-quadratic medium-term + SE+noise short-term; 11 hyperparameters ALL set by marginal likelihood; Fig 5.6 captured; the fitted hyperparameters' physical readings — e.g. seasonal decay ~90 yr, period 1.000 yr).
- The Keeling-curve data itself (NOAA/Scripps, public domain, updated monthly — the lesson's unique asset: the 2003 extrapolation is now CHECKABLE against 20+ years of reality).
- gaussian-processes (internal): every tool; conformal-prediction (internal): the closing comparison.

## Key points (APPLICATION spec)
- The artifact: the canon's most famous GP — Rasmussen & Williams' composite-kernel CO₂ model — rebuilt and then judged against the atmosphere's actual record since 2003.
- Module results used: kernel algebra as hypothesis-writing (gaussian-processes); marginal-likelihood hyperparameter fitting (bayesian-linear-regression → gaussian-processes); predictive bands and their meaning; conformal wrapping as the assumption-free check (conformal-prediction).
- Where the idealization departs: the trend is NOT stationary (emissions accelerated — the SE-trend kernel underestimates late curvature); the model knows no physics (it extrapolates statistical habit, not carbon budgets); monthly averaging hides measurement structure; and the honest verdict section measures all of this.
1. The data introduced as a physical record (L11): what Mauna Loa measures, why the sawtooth (Northern-Hemisphere growing season), the 1958– record's shape; keeper numbers (315 ppm 1958 → ~375 by 2003 → ~420s now).
2. Kernel engineering as claim-writing, term by term: each additive kernel = one sentence about the atmosphere (long smooth rise; yearly cycle whose shape drifts slowly; medium-term wiggles; short noise) — the composite assembled with its 11 hyperparameters named.
3. The fit: all hyperparameters by marginal likelihood (no CV, no hand-tuning — the module's claim exercised); the fitted values READ physically (period ≈ 1.000 yr emerges, not imposed; seasonal decay ≈ decades).
4. The 2003-vintage extrapolation reproduced — then the reveal: overlay the post-2003 measured record on the 20-year forecast; where reality sits in the bands (the seasonal phase holds remarkably; the trend runs at/above the upper band as emissions accelerated — compute the realized coverage of the 95% bands by year).
5. The two uncertainty roads meet: conformalize the same model's residuals on a 1990s calibration window and compare band widths/coverage with the GP's own — model-based sharpness vs assumption-free validity, priced on one real problem (the module's thesis, enacted).
6. The verdict ledger: what the GP got right (structure, interpolation, honest short-range bands), where it failed and WHY (non-stationary trend = kernel assumption violated), and what neither method can do (physics).

## Set pieces & gems
- The reveal — a 2003 forecast graded by the actual atmosphere; the course's most cinematic honest-evaluation moment, executed in the dry register.
- The period-emerges-as-1.000-years fitted value — evidence the marginal likelihood finds real structure.
- GPML Fig 5.6 (captured) beside our reproduction — the reproduction discipline once more.

## Pitfalls
- Fitting 11 hyperparameters by gradient needs care — the lesson USES a provided fitted configuration near the book's, showing the marginal-likelihood surface locally; full optimization is the lab's/starred territory.
- Climate-policy commentary: none; the lesson is about model criticism, and says so in one sentence.
- Data licensing: NOAA GML data is public domain with a required credit line — include it.

## FIGURE PLAN
- source: gaussianproc-mauna-loa-co2 — stem `gpml-fig56`, reader must see the book's own fit/extrapolation figure (the published artifact); placement: float right at the top, the claim to reproduce.
- draw: The kernel, term by term — FigureSequence (4 frames): each additive component's prior samples (trend / seasonal / medium / noise) building up to composite samples that look like CO₂. The lesson's teaching core.
- draw: OUR reproduction + the reveal — the 1958–2003 fit with bands extrapolated to 2025, the post-2003 measured record overlaid in a second color; per-decade realized-coverage tallies beneath. Key image; the course's honest-evaluation emblem.
- draw: The fitted hyperparameters as a labeled table-figure — each value with its physical reading (period 1.000 yr; seasonal decay ~90 yr; trend lengthscale ~decades). Single Figure.
- draw: GP bands vs conformal bands — the same 1995–2003 window with both interval constructions and their measured coverages/widths. Computed two-panel; the module's thesis figure.

## EXERCISE PLAN
1. Warm-up: from the composite kernel, state which term produces the sawtooth and what doubling its lengthscale would claim about the atmosphere.
2. Boundary probe: delete the periodic term and refit (provided config) — describe the residual structure left behind; then delete only the SE-decay factor ON the periodic term — what claim about the seasonal cycle's constancy did it encode?
3. Claim to refute: "the model's 95% bands failed (reality escaped them), so the GP was wrong to be confident." Refute-and-concede precisely: the bands are conditional on stationarity of the trend kernel; the failure LOCATES the violated assumption (non-stationary growth) — which is the diagnostic value of honest bands; contrast with a model reporting no uncertainty at all.
4. Research-shaped (core): reproduce the reveal — fit (or load) the composite GP on data to 2003, extrapolate to 2024, overlay the real record (provided), and report per-5-year realized coverage of the 95% bands.
5. Mixed review (E3): compute the marginal-likelihood difference between the composite kernel and a plain SE kernel on the same window — the evidence quantifying what the structure buys (bayesian-linear-regression's Occam, at work on real data).
6. FORWARD (E7): compute the conformal residual quantile on the 1990–2003 calibration window and the resulting 2004+ bands' coverage; compare with the GP's. Solution: building both machines yourself is the lab, the module's last word → Ref gp-lab.

## ARC
- Inherits: the whole module — posteriors, kernels-as-assumptions, evidence, conformal validity.
- Contributes: the module cashed out on the canon's flagship GP, GRADED BY REALITY — the course's cleanest demonstration that honest uncertainty is diagnosable and criticizable.
- Hands off: the lab builds both uncertainty machines; the epilogue (module 11) then asks what happens where even these classical accounts break.
- Spine step: "Predictions with guarantees…" (step 10, closing move before the lab).
