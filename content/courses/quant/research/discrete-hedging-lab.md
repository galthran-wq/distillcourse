# Lab: the discrete-hedging error study — research brief

Lesson: `discrete-hedging-lab` (module: black-scholes, type: lab, planned). NEW.
Goal: Build a delta-hedging simulator and measure how hedging error scales with rebalancing frequency, against the stop-loss benchmark that never improves.

## ARC
- Inherits: GBM simulation (ito-formula), BS price/delta (black-scholes-formula), the one-step P&L ledger and the $1/\sqrt n$ heuristic (greeks-hedging-error), the stop-loss rule and its plateau (stop-loss-paradox); from quadratic-variation-lab, the seeded-study and coupled-refinement habits and the measured strong order $1/2$ — the same exponent this lab now meets as a hedging-error law.
- Contributes: the module's two quantitative laws measured, not asserted — the delta hedge's −1/2 log-log slope and the stop-loss plateau — plus a gamma-aware schedule that beats uniform rebalancing at equal trade count.
- Hands off: the hedge engine's P&L-distribution habit (report the histogram, not the mean) recurs in monte-carlo-lab's standard-error discipline; the realized-vs-implied P&L identity surfaces in module 8's closing lesson.
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5, closing item).

## LAB PLAN

Artifact: one notebook building a hedging laboratory — `simulate_gbm(paths, grid)`, vectorized `bs_price`/`bs_delta`, `hedge(path, schedule, rule)` returning the position ledger and terminal P&L, and `study(rule, frequencies, n_paths)` returning the P&L distribution per frequency — culminating in the module's headline chart: error std vs rebalance count on log-log axes, delta hedge sloping at −1/2, stop-loss flat, and the learner's own gamma-aware schedule beating uniform at a fixed budget of 52 trades.

CANON GROUNDING: this lab is Hull Ch.19's own simulation study, reproduced and extended — Tables 19.1 (stop-loss performance measure at six monitoring frequencies), 19.2–19.3 (the written 20-week call hedged along two paths, cost ≈ the BS 240,000), and 19.4 (delta-hedge performance falling with frequency); the dossier's pedagogy notes flag these tables as "the chapter's central pedagogical contrast", and Hull's two-tier problem sets direct students to run exactly such spreadsheet simulations (Business Snapshot 21.2's cell-by-cell recipe is the book's own lab instruction). The scaling law measured in checkpoint 5 is Boyle & Emanuel (1980), "Discretely Adjusted Option Hedges" (JFE 8) — the paper is access-pending (see sources.yaml); the lab's measurement stands on its own and the brief cites the result as the published law being reproduced.
DEPARTURES: Hull works one path at a time in a spreadsheet; this lab runs 10,000 vectorized paths and reports distributions with standard errors (the classical-ml validation habit). Hull's performance measure (cost std / option price) is kept for the two reproduction checkpoints; the scaling checkpoint uses P&L std directly.

Datasets / inputs: none shipped — all paths simulated in-notebook under fixed seeds. Fixed test vectors: Hull's 20-week call parameters ($S_0=49$, $K=50$, $\sigma=20\%$, $r=5\%$, $\mu=13\%$); the published Table 19.1 and 19.4 performance values as reference rows (transcribed constants). Private: the build's own high-precision study results (error stds per frequency, the gamma-schedule benchmark) for the exact checks and the metric threshold.

Checkpoints (plan; lab-author may split or deepen):
1. `gbm-paths` (exact, warm-up): exact-scheme GBM simulation on an arbitrary grid (log-Euler with the $-\tfrac12\sigma^2$ correction); checked on moment identities at fixed seed.
2. `bs-price-delta` (exact, warm-up): vectorized price and delta; checked against stored values (incl. the 4.76 worked example).
3. `hedge-engine` (exact): the self-financing ledger along one path — shares, cash accruing at $r$, rebalance trades, terminal P&L = portfolio − payoff; reproduces Hull Table 19.2's final cost within tolerance on the stored path. Consumes 1–2.
4. `stop-loss-benchmark` (exact): the stop-loss rule in the same engine; performance measure at Hull's six frequencies; the plateau reproduced (values within simulation tolerance of Table 19.1). Consumes 3.
5. `error-scaling` (exact, the composition): `study` over n ∈ {4, 8, …, 512} × 10,000 paths; the fitted log-log slope of P&L std, required in [−0.58, −0.42] — the Boyle–Emanuel law as a measurement. Consumes 3.
6. `where-error-lives` (review, required: false): the learner buckets per-step P&L by moneyness/time and reports where the variance concentrates, naming gamma as the weight; rubric grades the gamma identification and the near-expiry-ATM concentration.
7. `gamma-schedule` (metric, required: false, LAST): with exactly 52 rebalances per path, design a schedule (state-dependent triggers or gamma-proportional time allocation) whose P&L std beats uniform-52 by a stated margin; score = negative error std, threshold calibrated by the build against a move-based-trigger reference (~10–15% improvement is attainable; the hints section names time-vs-move triggers only after the attempt).

Known-wrong variants worth declaring: simulating GBM without the $-\tfrac12\sigma^2$ correction (terminal mean right, distribution wrong — caught by the log-mean check); accruing no interest on the cash leg (P&L biased by the carry, looks like a systematic hedge loss); delta computed with $T$ instead of $T - t$ (error explodes near expiry); rebalancing with the PREVIOUS step's delta (one-step stale hedge — the slope flattens toward −0.25-ish, a subtle one worth a targeted hint); P&L measured as portfolio value alone, forgetting the short option's payoff (sign-flipped tail).

NOT blanked (ships complete): plotting helpers (ledger table, histogram, log-log chart), the seed/grid fixtures, the Hull reference constants, and the metric checkpoint's scoring harness. The learner writes the simulator, both hedge rules, the study loop, and the schedule design — the mathematics and the experiment, not the chrome.

est_hours: 4. Progression: warm-ups 1–2 → the engine 3 → benchmark 4 → the scaling study 5 → review 6 → open metric 7. Required: 1–5.
