# Lab: a volatility surface from a real option chain — research brief

Lesson: `vol-surface-lab` (module: volatility-smile, type: lab, planned). NEW.
Goal: Build the implied-volatility pipeline — a robust Black–Scholes inverter, chain cleaning via parity, a surface across strikes and expiries with static-arbitrage checks — on a real S&P 500 option chain.

## ARC
- Inherits: the inversion with its Newton/bisection craft and wing ill-conditioning (implied-volatility), parity-implied forwards (option-chain-bounds — the module-1 move returning at full scale), the smile taxonomy (volatility-smile), the static-arbitrage tests as the surface's laws (implied-density, local-volatility), the SVI shape (spx-surface-2005).
- Contributes: the human's named artifact — "inverting Black–Scholes on a real option chain to build the volatility surface" — as verified code: chain in, arbitrage-checked surface out, with a fitted smile per expiry scored on held-out quotes.
- Hands off: the surface the learner built is the implied side of module 8's realized-vs-implied confrontation; the GARCH lab supplies the other witness.
- Spine step: "Inverting Black–Scholes on market quotes should return one number…" (step 7, closing item).

## LAB PLAN

Artifact: one notebook building `SurfaceBuilder` — vectorized vega; a Newton-with-bisection-fallback implied-vol solver hardened against wings; per-expiry forward/discount extraction by parity regression; quote filtering; the IV surface as a tidy (expiry, strike, IV, total variance) table; butterfly/calendar violation flags; and a per-expiry smooth smile fit (quadratic-in-log-moneyness minimum; SVI for the ambitious — both accepted by the metric) scored on held-out quotes. The learner ends with the module's central object built from raw quotes by their own code.

CANON GROUNDING: computing implied volatilities from market prices is Hull's own assigned work (§15.11's iterative procedure; Practice Questions around Chs. 15 and 20 have students compute IVs and read smiles/surfaces, with DerivaGem as the book's supplied tool — this lab replaces the tool with the student's code); the surface-construction-and-fit study is Gatheral Ch.3's SPX case (reproduced at small scale in the spx-surface-2005 lesson; here the learner runs the pipeline themselves); the derivation-level canon is Shreve II Exercises 6.9–6.10 ("implying the volatility surface"), whose computational half this lab is. 18.S096 Lecture 10's regularized-calibration lecture documents the same pipeline (and its ill-posedness) as taught practice.
DEPARTURES: Gatheral's fits are near-arbitrage-free SVI across all expiries jointly; the lab's required fit is per-expiry and simpler (the metric accepts any smooth parameterization beating the RMSE bar on held-out quotes); crossing-expiry constraints appear only as CHECKS, not as fit constraints.

Datasets / inputs: `spx-2005-chain.csv` — the September 15, 2005 SPX chain transcribed from Gatheral's published tables/figures (Tables 3.x context + Table 5.1; a few hundred rows: expiry, strike, call bid/ask, put bid/ask; © Wiley teaching-use transcription — licence flagged for human review in the data cell), plus `synthetic-chain.csv` — a build-generated chain from a known SVI surface with realistic bid/ask noise (the round-trip truth for the solver tests and the held-out metric's clean half). Private: the held-out quote subset, the reference surface values, the metric threshold.
NOTE for the human: if the transcription-licence call goes against shipping the 2005 quotes, the synthetic chain (generated from the published SVI parameters, which are facts) carries the whole lab with one honesty sentence added; the lab-author should confirm before building.

Checkpoints (plan; lab-author may split or deepen):
1. `bs-vega` (exact, warm-up): closed-form vega, vectorized; checked at stored values.
2. `implied-vol-solver` (exact, warm-up): Newton with vega, bisection fallback on stall/bracket-exit; round-trip test (price a grid of (K, T, σ), invert, recover σ to 1e-8) including deep wings where pure Newton must not be trusted. Consumes 1.
3. `forward-from-parity` (exact): per expiry, regress $c - p$ on $K$ across strikes; slope gives the discount factor, intercept the forward; checked against reference values on both chains. (The module-1 exercise industrialized.)
4. `surface-build` (exact): filter quotes (corridor test, min price threshold), invert all mids, assemble the (T, K, IV, total-variance) table; checked on summary digests (count of valid quotes, IV values at probe points). Consumes 2–3.
5. `arbitrage-checks` (exact): butterfly (convexity of price in K) and calendar (total variance nondecreasing in T at fixed moneyness) flags; must find the build's planted violations in a doctored test chain and pass the real one. Consumes 4.
6. `why-one-vol-per-strike` (review, required: false): the parity argument for a single IV per (K,T) restated in the learner's words, plus why the AMERICAN put in an equity chain breaks it; rubric grades both halves.
7. `smile-fit` (metric, required: false, LAST): fit a smooth curve per expiry on a training subset of quotes; score = negative RMSE (in vol points) on the held-out subset; threshold calibrated by the build against a quadratic-fit reference (≈ inside 0.5 vol points on the synthetic chain's held-out half). Hints after the attempt: fit in total variance, weight by vega, try SVI's five parameters.

Known-wrong variants worth declaring: inverting BID or ASK instead of mid (systematic IV shift, caught by probe values; hint names the convention); Newton without a bracket (NaNs in the wings — the ill-conditioning lesson made executable); forward taken as $S_0 e^{rT}$ with an assumed $r$ instead of parity-extracted (small but systematic smile tilt — the classic; the hint names the parity regression); total variance computed with calendar time vs the row's actual $T$ mismatch; convexity checked on IVs instead of PRICES (butterfly test is a price-space statement — a genuinely instructive wrong variant); filtering so aggressively the wings vanish (the metric's held-out wings punish it).

NOT blanked (ships complete): the chain loaders, plotting helpers (smile per expiry, surface mesh, violation map), the corridor-test utility (module-1 bounds as a given function), the doctored-chain fixtures, and the metric harness. The learner writes vega, the solver, the parity regression, the assembly, the checks, and the fit.

est_hours: 4. Progression: warm-ups 1–2 → parity 3 → the build 4 → the checks 5 → review 6 → the open fit 7. Required: 1–5.
