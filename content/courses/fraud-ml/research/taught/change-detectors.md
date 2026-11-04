# change-detectors — ledger

NOTE (data): all detector numbers were computed by the writer (numba implementations; `river` 0.26.1 agrees on ADWIN delays and supplied the three-segment row). A detector restarts after each alarm; ADWIN checks every 32 items at geometric split points. Horizon for a miss 60,000 items. Normal-noise table: 4M items, 4,000 runs. Weekly-rhythm rows re-measured on 40M days (C), 4,000–20,000 change runs.

**Problem.** What rule (a *change detector*; "detector" = that rule, "the model" = the fraud model, fixed in the intro) on the running error says a rise is real, and what does it cost in delay and false alarms? Answer: score rules by MTFA, MTD(θ), MDR(θ) at equal MTFA; CUSUM accumulates evidence with a floor (a max over possible start points of a log likelihood ratio), Page–Hinkley replaces μ with the running mean, DDM uses binomial noise and is slower the longer the calm, reference/sliding windows test two stretches, ADWIN tests every split with a threshold charged for the splits. On payments feed the share of compromised cards missed (slow) and CP@k (fast), never raw error; the alarm rings at c + δ + MTD and replaces a schedule only when retrains are further apart than the MTD.

## Explained
- Term: change detector; detector = the rule, the model = the fraud model — intro
- Window + fixed level recalled from concept-drift's exercise; scored with restarts: W 100 at 0.065: MTFA ~230, MTD ~70; W 1,000: ~13,000, ~510 — intro, §What makes one detector better than another
- Definition MTFA, false alarm rate 1/MTFA, MTD(θ), MDR(θ) with a stated horizon, ARL (MTFA = ARL(0)); boundaries always/never alarm; tempting score, share of alarms that were false, rejected: it depends on the stream, not the detector — same §
- A detector is a curve; compare delays at equal MTFA (figure trade-curve, at ~13,000: W100 625, W1000 510, CUSUM 404) — same §
- Plain sum wanders; allowance v gives a downward slope; hole after a calm; floor forgets; Definition CUSUM (z_t, v, h, reset, one number, one addition); figure cusum-floor — §Evidence has to accumulate: CUSUM / ### A sum, and why it needs a floor
- v = θ/2 from the normal log likelihood ratio θ(z − θ/2); floor = max over start c (empty sum 0); Proposition MTFA ≥ e^{2vh} with martingale proof; MTD ≈ h/(θ − v); v = θ/2 also minimises delay at fixed bound; MTD ≈ 2 ln(MTFA)/θ²; θ = 1 gives h = ln MTFA, guideline 3–5 — ### Where the floor, the allowance and the threshold come from
- Final h comes from simulating the stable stream; bound and slope formula give scaling only — same ###
- Definition Page–Hinkley (m_T, M_T, PH_T, running mean x̄_t up to each step, not x̄_T: with x̄_T the sum is −vT); identity PH_T = max(0, PH_{T−1} + x_T − x̄_T − v): CUSUM with running mean and no σ; class in Python, warm-up holds the alarm for 30 items because a running mean of few items is noise, and every restart returns there; two-sided left to exercise — §When the usual level is unknown: Page–Hinkley
- Demo DriftDetectorTuner (presets abrupt, gradual, noisier level; Show the change, Try every setting), task before result: abrupt passes (v 0.005, h 0.2: 5 steps, no false alarm), gradual 0 of 3,069 settings (clean catch 76 steps at best; within 50 steps at least 5 false alarms) because 50 steps of ramp give excess 0.1 against abrupt's 1.0; prices: delay from absorbing the change, scale (6 false alarms on noisier level; MTFA 14,000 → 900 at error 0.20) — §Setting Page–Hinkley's two numbers
- DDM Definition (p_t, s_t, registers on smallest p+s, warning 2, drift 3, store from warning, t since last reset, warm-up because s_t as sd of a roughly normal rate needs enough items); why two levels; 2 and 3 are control limits, no fixed false alarm rate — §A learner's error is a proportion: DDM
- Delay n ≈ 2σ√T/θ, table, figure ddm-bands; KeyFact slowest after the longest calm — ### Its price
- Warm-up boundary: 21% of streams at p = 0.05 have no error in 30 items, p = s = 0 and test 0 ≥ 0 fires; lucky early registers (s_min 0.024) put the line at 0.09, change to 0.08 never reaches it; warm-up 30 misses 7% / 16% (calm 5,000 / 50,000), warm-up 1,000 under 1% — ### A boundary: rare errors at the start
- Reference and sliding windows, normal test at 1.96 (0.05 vs 0.08, 1,000 each: 2.7 s.e.), 5% is not an MTFA (measured 13,000, either direction), level-free (12,300–13,200 at 0.01, 0.05, 0.20); stale reference, mean 1,120 median 706; χ² on variances adds nothing on bits — §Comparing two windows directly
- ADWIN Definition; m = n0 n1/(n0 + n1) = half the ordinary harmonic mean; Hoeffding stated for terms of width c_i; Proposition (constant mean: cut ≤ α/2; true difference > 2ε_cut: cut ≥ 1 − α/2) with direct proof; bits qualify, raw amounts do not; exponential histogram in two sentences; figure sequence adwin — §Letting the stream set the window: ADWIN
- Hoeffding cut cannot see 0.05 → 0.08 after a calm of 5,000 (m < 5,000 so ε_cut ≥ 0.040 > 0.03), ~13,700 late after 50,000; worst-case variance 1/4 vs 0.05; variance cut stated (α' = α/ln|W|, smaller charge because the histogram tests about log|W| split points), not covered by the proof; α a dial: 0.2 → MTFA 19,000, MTD 950; 0.002 → 2 alarms in 4M, MTD 2,200 — ### The guarantee and what it costs
- Three-segment single run and why it misleads (h = 10 puts Page–Hinkley first); table at equal MTFA except DDM and Hoeffding ADWIN, which cannot reach it (DDM: only setting is warm-up; Hoeffding: no alarm in 4M at α 0.999); CUSUM quickest at 0.20, plain window beats it at 0.065 and on the ramp; choose by what you know (KeyFact) — §Four detectors on one stream
- Raw error follows γ (1,000 + γ − 2TP); six-world table; alert precision/CP@k is same-day but moved by base rate and blind to an added method; TP/γ is NCP@k below the ceiling and carries on above it; needs slow labels — §On a payment stream / ### The raw error rate reads the fraud share
- Daily missed share mean 0.47, σ ≈ 0.08; alarm at c + δ + MTD = 17 days; half σ ~6 weeks (figure late-alarm) — ### What it costs in days
- Weekly rhythm table (weekend +0.16, v 0.5, h 5; MTFA days, delay on +0.08): weekday level and σ 21; whole-week level 0.516 and weekday σ ~200, 8; whole-week level and σ 0.108 ~7,000, 16; residual on last four same weekdays ~1,000, median 11, about a quarter never (the baseline absorbs a lasting rise in four weeks); weekday means and σ fixed from twelve stable weeks ~500, 10, 98% within four weeks (26 weeks ~700) — ### The week has a shape
- Alarm does not start learning on a nightly retrain; matters when the training block is longer than the MTD, triggers the kind-of-change procedure; KeyFact: replaces the schedule only when retrains are further apart than the MTD — ### What the alarm is for

## Notation
- x_t stream value, μ, σ usual level and sd, z_t standardised, θ size of change in σ (or in raw units where the table says "to 0.08")
- CUSUM: g_t, S_t plain sum, allowance v, threshold h (NOT δ, λ, k: those stay label delay, EWMA rate, alert budget). Libraries call them delta and threshold/lambda
- PH: x̄_t running mean, m_T, M_T, PH_T; same v, h in x's units
- DDM: p_t, s_t, p_min, s_min; T length of the calm, n items after the change
- Windows: n_0, n_1, μ̂_0, μ̂_1; ADWIN: W, W_0, W_1, m, ε_cut, α (not δ), α' = α/ln|W|, L = ln(4|W|/α) in exercises
- c day of the change, δ label delay (from concept-drift); TP, γ, k as in alert-budget-metrics

## Running cases
- Bit stream 0.05 → 0.08 at step 5,000 (from concept-drift's exercise), σ 0.218, θ 0.138σ, v 0.069
- Table at about equal MTFA, stable 0.05 (MTFA; MTFA at 0.20; MTD to 0.065 / 0.08 / 0.20; 0.08 after calm 50,000; ramp over 4,000): W1000 level 0.065 13,200; 1,000; 1,045/508/139; 515; 1,865. CUSUM h 38 12,700; 62; 1,252/404/52; 381; 2,040. PH v 0.015 h 8.5 14,000; 900; 2,089/506/55; 533; 2,189. DDM warm-up 30 500,000; 400,000; 5,698 (29% missed)/3,066 (7%)/344; 8,863 (16%); 5,830 (10%). DDM warm-up 1,000 none in 4M; none in 2M; 4,400 (5%)/1,360/201; 7,294; 3,599. Reference/sliding 1,000, 1.96: 13,200; 12,300; 3,143/1,123/448; 1,183; 2,333. ADWIN Hoeffding α 0.002 none; none; never/never/416; 13,659; never. ADWIN variance α 0.2 19,000; 9,500; 3,696/952/93; 1,052; 2,931
- Normal CUSUM v 0.5: h 3, 4, 5, 6: bound 20, 55, 148, 403; MTFA 119, 331, 949, 2,488; MTD θ=1 5.7, 7.8, 9.7, 11.5; θ=2 2.4, 3.1, 3.7, 4.3; θ=0.5 16.6, 25.2, 36.2, 50.3. v 0.25, h 8: MTFA 730, MTD 9.9 (θ=1), 25.8 (θ=0.5)
- DDM medians, calm 2,000/5,000/20,000/80,000: 700/1,090/2,520/5,390; predicted 650/1,030/2,050/4,110
- Demo streams: error rate per 100 items, 900 steps, change at step 612, rise 0.02, base 0.05 (0.20 on noisier level), ramp 250 on gradual
- Toy traces: CUSUM twelve days, alarm day 12 (S = −0.3); PH ten rates, v 0.005, h 0.12, alarm day 10, running mean 0.050 on day 6 to 0.070 on day 10
- Three segments (uniform [0,0.3] ×750, [0,0.4] ×250, [0.4,0.5] ×1,000, [0.7,1] ×1,000, numpy seed 42): ADWIN 1,023/2,047; DDM 1,059/2,085; CUSUM h 50 1,154/2,135; PH h 50 1,156/2,136; PH h 10 1,005/2,026; PH h 5 adds 825
- Six worlds, 1,000 alerts from online (raw error, precision, TP/γ): June 1.29, 1.00, 3.2; product 1.47, 1.00, 2.0; wave 1.58, 1.98, 3.2; ebb 1.15, 0.50, 3.2; method replacing 1.31, 0.20, 0.65; method added (petrol 10,160/200) 1.45, 1.00, 2.1
- Simulator test week, depth-2 tree, daily missed share 0.52, 0.36, 0.45, 0.47, 0.50, 0.41, 0.61: mean 0.47, sd ~0.08
- Keepers: MTD ≈ 2 ln(MTFA)/θ²; DDM delay ∝ √T; alarm at c + δ + MTD (17 days)
- Exercises: PH h sweep 2…12 MTFA 176…90,900, MTD 60…800; ADWIN abrupt first cut ~L/(2Δ²), ramp W* = (8L)^{1/3}Δ^{−2/3} (measured ×0.7), same r^{−2/3} as concept-drift's W*; EWMA chart λ 0.01, L 4: MTFA 35,000, MTD 1,350/990; review CP 0.30 → 0.18, γ 60 → 30, NCP 0.5 → 0.6; forward: warning-to-drift stretch median 845 items, ~7 frauds against 598 in the baseline training week

## Assumed
- concept-drift: forward exercise's stream, four worlds, likelihood ratio and odds, EWMA variance, window trade-off W* ∝ r^{−2/3}, kind-of-change procedure, calendar matrix, last-four-Sundays residual (here shown to absorb a lasting rise)
- alert-budget-metrics: CP@k, NCP@k and its ceiling, test week and depth-2 tree; delayed-labels-prequential: label clock; fraud-detection-system: fast labels, nightly retrain
- classical-ml: binomial variance, normal approximation. Martingale and optional stopping are glossed inside the folded proof only; nothing later may assume them

## Left open
- What to do on an alarm, how much to forget → stream-learning-and-adaptation (forward exercise, conclusion)
- The four detectors compared by the reader on a generated bit stream → drift-detector-lab
- Input-side stability index as complement → model-risk-monitoring; a controller with hysteresis → psd2-sca-tra
- Not taught: Kalman residuals, Bernstein derivation of the variance cut, EDDM, Kolmogorov–Smirnov variants, exact Bernoulli likelihood-ratio CUSUM, optimality of CUSUM.
