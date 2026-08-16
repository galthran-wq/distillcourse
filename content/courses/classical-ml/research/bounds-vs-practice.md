# Bounds against practice: the margin experiment — research brief

Lesson: `bounds-vs-practice` (module: learning-theory, core, planned). NEW — module 9's APPLICATION lesson (L16): a paper's central experiment reproduced + the module's bounds priced numerically.
Goal: Reproduce the boosting-margin experiment and compute the module's bounds numerically to evaluate which explanations survive contact with data.

## Sources
- Schapire–Freund–Bartlett–Lee 1998 (the artifact): Fig 1 (letter dataset: C4.5 13.8% alone; boosting train error 0 at round 5, test 8.4%→3.1% by round 1000; margin CDFs at 5/100/1000 — captured image); §2.2's own bound-vs-data numbers ("meaningful only for tens of thousands"; Fig 3's bound-vs-n plot idea); Fig 4's replication grid.
- Mohri/SSBD (the bound formulas being evaluated — internal Refs).
- Module 7's boosting-lab artifacts (staged predictions) and spam-ensembles' race data — the reproduction substrate.

## Key points (APPLICATION spec)
- The artifact: the 1998 margin experiment — the paper that explained boosting — rerun by the reader's own tools on the course's own data.
- Module results used: the margin CDF and its theorem (margin-bounds Thm 7.7's exponential push); the ensemble bound's T-independence (Lemma 7.4's consequence); the VC bound's vacuity at these n (vc-dimension); the finite-class bound's per-number pricing (learning-theory); Rademacher terms evaluated (rademacher-stability).
- Where the idealization departs: our stumps/corpus differ from C4.5/letter — the PHENOMENON must replicate (shape), the numbers will not (values); the bounds' constants are loose by orders of magnitude — the lesson prices the looseness honestly rather than hiding it; margins EXPLAIN but do not PRESCRIBE (Breiman's anomaly carried in from margin-bounds).
1. The experiment run: boost stumps on spam (or the provided letter-like data) to T=1000; the two-panel figure produced — error curves over margin CDFs at T ∈ {5, 100, 1000}; the qualitative claims checked off: train 0 early; test still falling; CDF marching right.
2. The bounds priced, one table: for the SAME fitted model at n≈3,000 — (a) finite-class union bound with discretized stumps (number); (b) VC bound with d(T) growing (vacuous, shown); (c) the margin bound at the observed ρ (loose — e.g. promising ≤ 0.6 while truth is 0.05 — but FINITE and T-stable). The table IS the lesson's verdict: which explanation survives.
3. Sensitivity checks that make it science: label-noise injection (10%) — margins on noisy points stop growing, test error turns up at large T (the theory's own hypothesis, tested); a bagged ensemble's margin CDF beside boosting's (bagging moves margins less — SFBL's Fig 1 contrast).
4. What an engineer keeps: margins as a monitoring diagnostic (cheap, computable from staged scores); bounds as explanations and design guides (norm/margin control), CV as the measurement (module 5 unthroned by nothing); the module's honest hierarchy stated.

## Set pieces & gems
- SFBL Fig 1 — the captured original beside OUR reproduction (same layout, our data) — the course's reproduction discipline at its most iconic.
- The bound-pricing table — bounds evaluated to actual numbers next to measured error; few courses ever do this.
- The noise-injection flip — the theory predicting its own failure mode correctly.

## Pitfalls
- Compute budget: stumps ×1000 rounds on a subsampled corpus (documented); staged predictions reused from boosting-lab's machinery (no refitting per T).
- Do not let the vacuity of VC read as "theory useless" — the table's point is DISCRIMINATION between explanations; the honest hierarchy paragraph carries this.
- Margin definition normalization (Σα) must match margin-bounds' exactly; one notation check.

## FIGURE PLAN
- source: boostingthe-fig1-margin-distribution — stem `sfbl-fig1`, reader must see the original 1998 two-row panel (error curves; margin CDFs at 5/100/1000); placement: float right at the top, the claim being reproduced.
- draw: OUR reproduction — the same two-row layout from our run: error-vs-rounds (train hitting 0, test falling) over margin CDFs at three round counts; axes matched to the original for eye comparison. Key image.
- draw: The pricing table as a figure — three bounds (finite/VC/margin) × {promised ε, status} beside the measured test error; the vacuous cell literally off-scale. The verdict figure.
- draw: The noise flip — test-error-vs-rounds at 0% and 10% label noise with the margin-CDF insets showing noisy points' margins stalling. Computed two-panel.
- draw: Bagging vs boosting margin CDFs on the same data — the mechanism contrast (variance tool vs margin tool) drawn once. Computed.

## EXERCISE PLAN
1. Warm-up: from your run's staged scores, compute the margin of three named test points at T=100 and T=1000.
2. Boundary probe: compute the margin CDF at T=1 (a single stump: margins ∈ {−1, +1} only — the degenerate CDF) and explain why the march needs many rounds by Thm 7.7's form.
3. Claim to refute: "test error fell after round 5, so training longer always helps boosting." Refute with your own 10%-noise run's upturn; name the hypothesis (persistent edges on clean data) that failed.
4. Research-shaped (core): the reproduction itself — run the experiment, produce the two-panel figure, and write a five-sentence results paragraph in the reproduction register (what replicated, what differed, why).
5. Mixed review (E3): price the finite-class bound for your stump family (thresholds × features × signs discretized) at your n — the learning-theory calculator applied to your own model.
6. FORWARD (E7): evaluate your margin bound at n = 300 vs n = 3,000 (subsample) and note the bound only enters the meaningful range as n grows — then ask what guarantee survives when a model INTERPOLATES noise and margins cannot save it. Solution: that is module 11's question (double descent); and for calibrated uncertainty the course first takes the Bayesian/conformal road → Ref bayesian-linear-regression (next module) and double-descent (the epilogue's opening).

## ARC
- Inherits: everything module 9 proved, plus module 7's algorithms and artifacts.
- Contributes: the module cashed out — the field's explanatory experiment reproduced, the bounds priced against reality, and an honest hierarchy of what theory delivers.
- Hands off: guarantees of a different kind — distributions over predictions — module 10; and the regime where even margins fall silent — module 11.
- Spine step: "Why any of it works…" (step 9, closing move).
