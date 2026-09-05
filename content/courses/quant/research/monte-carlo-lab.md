# Lab: Monte Carlo pricing with variance reduction — research brief

Lesson: `monte-carlo-lab` (module: risk-neutral-pricing, type: lab, planned). NEW.
Goal: Build a Monte Carlo pricing engine validated against the Black–Scholes closed form, then cut its variance far enough to price an Asian option to half a cent inside a fixed budget.

## ARC
- Inherits: the pricing expectation and the closed form (risk-neutral-valuation), exact GBM sampling (ito-formula), the estimator/variance-reduction theory (monte-carlo-pricing), the SE discipline (classical-ml prerequisite).
- Contributes: the module's expectation computed by the learner's own engine, with the closed form playing both referee (validation) and teammate (control variate); the budget-constrained Asian task makes variance reduction the difference between feasible and not.
- Hands off: the engine plus the implied-vol solver (module 7's lab) are the two halves of a working desk stack; the GARCH lab reuses the path-simulation skeleton for P-measure dynamics.
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6, closing item).

## LAB PLAN

Artifact: one notebook building `MCPricer` — an exact risk-neutral terminal sampler, a path sampler on a grid, an estimator core returning (price, standard error, N), antithetic and control-variate wrappers with measured variance ratios, an Euler-vs-exact bias study, and finally an arithmetic-Asian pricer that must reach SE < \$0.005 inside a fixed budget of 10⁷ path-steps — reachable only with the geometric-Asian control variate. Every number the engine emits carries its interval.

CANON GROUNDING: Hull Business Snapshot 21.2 is, per the dossier, "a literal cell-by-cell Excel recipe for checking the BSM formula via 1,000 simulated paths — a ready-made lab exercise embedded in the text"; §21.6–21.7 (the estimator, antithetic and control variates) is the assigned method chapter, and Hull's Practice/Further Questions around Ch.21 direct students to run these estimators in spreadsheets or DerivaGem. This lab is that assignment, upgraded from spreadsheet to numpy with the classical-ml course's standard-error discipline. The Asian task's control-variate design (arithmetic priced with the geometric's closed form as control) is the standard Kemna–Vorst construction the variance-reduction canon assigns; Shreve II §7.5's "Asian options have no known closed form" is the fact that makes the task honest.
DEPARTURES: Hull's recipe stops at the naive estimator; this lab requires the variance-reduction stages to be MEASURED (variance ratios reported, not asserted) and adds the Euler-bias study Hull discusses but does not assign; the budget constraint on the Asian task replaces open-ended "simulate more".

Datasets / inputs: none shipped — all sampling in-notebook under fixed seeds. Fixed references: the 4.76/0.81 worked example and a table of BS prices across strikes (transcribed constants). Private: the build's high-precision Asian reference price (10⁹-step control-variate run at build time), the variance-ratio references, and the metric threshold.

Checkpoints (plan; lab-author may split or deepen):
1. `terminal-sampler` (exact, warm-up): exact lognormal draws under $\tilde P$; moment checks at fixed seed (mean $S_0e^{rT}$, log-variance $\sigma^2T$).
2. `mc-european` (exact, warm-up): price + SE for the running call; the check verifies the estimator value at fixed seed AND that |estimate − BS| < 3·SE — the validation habit as an assertion. Consumes 1.
3. `antithetic-pairs` (exact): the paired estimator; measured variance ratio vs naive on the call (expected ≈ 0.4–0.6) and on a straddle (expected ≈ 1 — the counterexample built in, the check reads both numbers). Consumes 2.
4. `control-variate` (exact): CV estimator with pilot-sample β̂ (the plug-in-bias trap is the declared wrong variant); variance ratio on the call with $S_T$ as control, then with the BS delta-payoff control (ratio ≈ 0.01–0.1). Consumes 2.
5. `euler-bias` (exact): 12-step Euler paths vs exact terminal sampling at matched seeds; the measured bias and its sign; halving Δt halves it (two points suffice). Consumes 1.
6. `why-control-works` (review, required: false): the learner states the $1-\rho^2$ mechanism and names one payoff/control pair where it fails (low correlation); rubric grades mechanism + failure case.
7. `asian-budget` (metric, required: false, LAST): arithmetic Asian call (monthly averaging, 12 fixings, parameters given); budget = 10⁷ path-steps total (pilot included); score = −SE (with a correctness gate: |estimate − reference| < 3·SE); threshold −0.005, calibrated by the build. Naive spends the budget at SE ≈ \$0.02; the geometric control (closed form supplied as a stated formula in the notebook, its derivation a starred pointer) reaches ≈ \$0.002. Hints (after the attempt cell): the geometric average of lognormals is lognormal; β̂ from a pilot.

Known-wrong variants worth declaring: simulating with drift μ instead of r (the module's own refutation exercise — price too high by a stable margin; hint names the measure); SE computed with the population instead of sample std or forgetting the discount on the SE (interval wrong by a factor); antithetic pairs averaged as 2N independent draws (SE understated — the correlation ignored); β̂ estimated on the SAME sample used for the estimate (small bias, caught by the reference comparison; hint names the pilot split — the classical-ml leakage lesson in one line); Euler with the drift term $rS\Delta t$ but volatility $\sigma S\sqrt{\Delta t}\,z$ applied to the WRONG state (previous-step confusion).

NOT blanked (ships complete): plotting helpers (convergence funnel, ratio table), the fixed-seed harness, the BS closed-form functions (the learner built them in discrete-hedging-lab; repetition teaches nothing), the geometric-Asian closed-form FORMULA (stated), and the metric scoring harness. The learner writes the samplers, the estimator core, both variance-reduction wrappers, the bias study, and the Asian pricer.

est_hours: 4. Progression: warm-ups 1–2 → wrappers 3–4 → bias study 5 → review 6 → the budgeted open task 7. Required: 1–5.
