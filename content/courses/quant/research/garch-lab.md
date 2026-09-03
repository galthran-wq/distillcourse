# Lab: GARCH(1,1) from scratch — research brief

Lesson: `garch-lab` (module: volatility-dynamics, type: lab, planned). NEW.
Goal: Build a GARCH(1,1) fitter from scratch — variance recursion, Gaussian likelihood, MLE by numerical optimization, term-structure forecasts — on real daily equity returns, and beat the EWMA baseline out of sample.

## ARC
- Inherits: the stylized facts and their measurements (stylized-facts), the GARCH family and its theorems (arch-garch), the likelihood recursion and diagnostics (garch-mle), the MLE/optimization/held-out habits (classical-ml prerequisite), the realized-vol scoring context (realized-implied-smile).
- Contributes: the human's named artifact — "GARCH from scratch on real returns" — as verified code: the course's estimation spine executed end to end on decades of real market data, with an out-of-sample referee.
- Hands off: course exit — the fitted machine is the realized-side witness of the closing lesson's confrontation, and the toolchain (simulate → price → invert) the reader now owns in full.
- Spine step: "Returns confess: volatility clusters, tails are heavy…" (step 8, closing item).

## LAB PLAN

Artifact: one notebook building `GarchFitter` — log returns and stylized-fact statistics; the EWMA baseline; the GARCH(1,1) variance recursion; the Gaussian conditional log-likelihood; MLE by numerical optimization with constraint reparameterization; sandwich standard errors (optional depth for the author); the k-step forecast term structure; and an out-of-sample volatility-forecast evaluation on a held-out final year, where the fitted model must beat EWMA. Returns in, (ω̂, α̂, β̂) with uncertainty and forecasts out.

CANON GROUNDING: Hull Ch.23 §23.5–23.6 is the assigned mini-project this lab industrializes — the dossier records his complete worked S&P 500 MLE fit (Table 23.1, Figs 23.1–23.2) as "a complete reproducible worked example… as close to a full mini-project as the book gets", performed in a spreadsheet with Solver exactly as his problem sets direct; Bollerslev 1986 §7's empirical pipeline (raw series → mean model → ARCH-LM → fit → diagnostics → forecast bands) is, per the dossier, "essentially the recipe for a GARCH-from-scratch lab's narrative arc" and is the checkpoint order; Engle 1982 §§6, 8 supply the estimation mechanics (scoring/likelihood) and the ARCH-LM test the lab computes. 18.S096 Lecture 9 (ARCH/GARCH) sits among the lectures whose biweekly problem sets carried 75% of that course's grade — the university confirmation that this is assigned work.
DEPARTURES: Hull fits in Excel with Solver — here numpy + scipy.optimize with explicit constraint transforms; Bollerslev's mean equation (AR(4) inflation) is replaced by a demeaned-returns assumption (stated); the out-of-sample QLIKE-style referee replaces in-sample comparison — the classical-ml validation habit imposed on the econometric canon.

Datasets / inputs: `market-returns.csv` — daily US equity market returns, long history (Fama–French daily market factor Mkt-RF + RF from the Ken French Data Library, openly redistributed for research/teaching; credit the library in the data cell), trimmed to ~1990–2019 (~7,500 days), final year held out. This choice avoids proprietary index-quote licences while being real, standard, and long enough for the persistence to be sharp. Private: the held-out year's returns and realized-vol targets, the reference fit, the metric threshold.

Checkpoints (plan; lab-author may split or deepen):
1. `log-returns` (exact, warm-up): log returns from the shipped series (or direct returns handling — spec fixes it), plus the stylized-fact card: kurtosis, ACF of $r$ and $r^2$ at stated lags; checked digests.
2. `ewma-variance` (exact, warm-up): the λ = 0.94 recursion over the series; probe values checked. The baseline that must later be beaten.
3. `garch-recursion` (exact): σ²-path for given (ω, α, β) with the stated initialization; probe values at fixed parameters. Consumes 1.
4. `garch-loglik` (exact): the summed Gaussian conditional log-likelihood; checked at two parameter points (one near-optimal, one poor — the ordering must be right too). Consumes 3.
5. `garch-fit` (exact, the composition): maximize via scipy with the positivity/stationarity reparameterization; (ω̂, α̂, β̂) within tolerance of the reference fit on the shipped training window; report persistence and $V_L$. Consumes 4.
6. `variance-forecast` (exact): the k-step forecast $V_L + (\alpha+\beta)^k(\sigma_t^2 - V_L)$ and the annualized term-vol curve from a stated date; probe values. Consumes 5.
7. `why-fat-tails` (review, required: false): the learner explains kurtosis > 3 from conditionally Gaussian shocks (the mixture argument) and points at their own checkpoint-1 kurtosis vs the fitted model's implied kurtosis; rubric grades the mechanism.
8. `oos-forecast` (metric, required: false, LAST): forecast daily variance through the held-out year (rolling one-step, parameters frozen); score = negative mean QLIKE (or negative average negative-log-likelihood — the build fixes one) against realized squared returns; threshold calibrated so the reference GARCH fit passes and EWMA does not (the margin is real but modest — honest). Hints after the attempt: don't refit daily; check the initialization at the holdout boundary.

Known-wrong variants worth declaring: variance recursion indexed off by one (σ_t² using r_t² — lookahead; likelihood too good, the classic; hint names conditioning); likelihood missing the $\log\sigma_t^2$ term (optimizer runs σ → ∞ or the fit lands on nonsense — instructive failure); optimizing raw parameters without constraints (negative ω or α+β > 1 excursions, NaNs); initialization at σ₀² = 0 (first terms explode); annualizing with 365 instead of 252 (all vols off by a stable factor — caught by probe values; hint names trading days); scoring the holdout with MSE on VOLS instead of the stated loss (rewards the wrong model — a hint that names why QLIKE-style losses are the volatility-forecast convention).

NOT blanked (ships complete): the data loader and credit cell, plotting helpers (return series, σ_t path over returns, ACF panels, term-structure chart), the ARCH-LM utility (the learner met its derivation in the lesson; here it ships as a diagnostic), the reparameterization helper's SIGNATURE (the transform itself is learner-written), and the metric harness. The learner writes the recursion, the likelihood, the fit, and the forecasts.

est_hours: 4. Progression: warm-ups 1–2 → recursion 3 → likelihood 4 → the fit 5 → forecasts 6 → review 7 → the held-out referee 8. Required: 1–6.
