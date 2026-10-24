# undersampling-calibration — ledger

**Problem.** A model trained after keeping every fraud and a fraction β of
genuine payments outputs 0.5 for payments that are fraud ~1 in 50: can the
output be turned back, and does that change the ranking? The general answer
(odds × 1/β, inverse p', monotone) is RECALLED from classical-ml, not
derived. What this lesson teaches is its use on a card stream: recovering β
and checking the selection has one; where the distortion is large (p*,
overlap); which decisions read the probability's value (€ threshold,
amount queue); correcting to a drifting base rate known a label delay late;
variance concentrated at the top.

## Explained
- Card-rate cut: 0.4% fraud, balanced chunk discards ~99.6% genuine — intro
- Recall (classical-ml imbalance-leakage, named in plain text) in this notation: s+ = 1, s- = β, odds_s = odds/β, log-odds + ln(1/β) (no symbol: δ is the label delay), p_s = p/(p+β(1−p)), p' = βp_s/(βp_s−p_s+1), monotone ⇒ ranking unchanged; opening numbers p=0.02 → p_s≈0.505, p_s=0.5 → p'=0.0196 — intro (key image map.svg)
- 100,000-payment bars (β = 1/0.1/0.02/0.002); π_s = π/(π+β(1−π)) and its inverse β = π(1−π_s)/(π_s(1−π)) (recover β from reported shares); 0.4% chunk → β≈0.004 — §The keep rate on a card stream / Reading β off a training set
- β is a keep rate, not a class ratio: β = stream odds π/(1−π) ÷ training odds π_s/(1−π_s); equals the stream's class ratio (1:499) only at the balanced cut, where training odds = 1; bug = pipeline keeps passing the logged stream class ratio after the cut moves off balanced — same §
- Coin flip with label-only bias; near-misses: keeping only small genuine payments; training on alerted payments (fast labels) ⇒ no β; KeyFact: whether β exists is read off the code that built the set (label + random draw only); a wrong correction is caught only by a reliability check on unselected stream payments — § / When the coin looks at the payment
- Bias p_s − p peaks at p* = √β/(1+√β), p_s = 1/(1+√β), max (1−√β)/(1+√β) (0.75 at β=0.02, p≈0.12) — §How large the distortion is, and where / The size of the bias as a function of p
- Two Gaussian tasks (σ=3, 10% fraud, μ=3 vs 15, β=0.5 and 1/9): Δx = σ² ln(1/β)/μ = 6.6 vs 1.3; 0.5 decision flips for 34% vs ~0.5% of rows; card fraud is the overlapping kind ⇒ many candidate payments under the hump (p 0.12 reported 0.88); below the hump ratio p_s/p = 1/(β+(1−β)p) → 1/β (7 at 0.12, 34 at 0.01, 46 at 0.002) ⇒ sums of raw outputs (expected counts/losses) inflated by a large multiple — § / Two tasks with the same β
- Card-rate simulation: AUC/AP unchanged, raw mean 0.032 (16×), Brier (recalled from classical-ml) p_s 0.0111 > constant 0.0020 > p' 0.0015 = all-rows fit; band 2,001–10,000: says 0.575, 3.1% fraud, p' 0.031; next-call rule would overstaff; KeyFact: uncorrected model passes AUC/AP/CP@k, only Brier/reliability catch it (monitoring) — § / What the distortion looks like on a simulated card stream
- Cost cut τ = C_a/c_FN (€10/€500 → 0.02); matched threshold recalled (classical-ml exercise), τ' = g(τ_s); habitual 0.5 on balanced 1/500 flags p ≥ 0.002 = the cost rule only if C_a/c_FN were 0.002, i.e. miss priced 500 alerts = €5,000; at β=0.02 the 0.5 cut ≈ p 0.0196 ≈ 51 alerts, matches €10/€500 by accident of β; rule: set τ from costs on p' — §Decisions that read the value of the probability / A threshold priced in euros
- Amount-weighted queue reverses (A €100 p_s 0.99 → €66; B €200 p_s 0.60 → €6); products with varying amounts are not one monotone map; in-body exercise C/D/E reverses fully — § / An amount-weighted queue reverses
- Prior shift at deployment: odds_t = [π_t/(1−π_t)]/[π_s/(1−π_s)] × odds_s; equals β when π_t = π; fraud wave 0.002→0.004: 0.5 → 0.039 (vs 0.0196), 0.9 → 0.265 (vs 0.153) — §After deployment / Correcting to a different base rate
- π_t known only a label delay late (latest fully labelled week); fitted calibrator has same lag and ~20 frauds per 10,000; prior factor cannot fix concept drift (p(x|fraud) changes); KeyFact: β stored with the model artifact at cut time; π_t re-estimated from the latest fully labelled week on the monitoring cadence and the prior factor re-applied — § / Where the current base rate comes from
- Variance lands at the top: slope β/(1−(1−β)p_s)² from β at the bottom, crossing 1 at p_s ≈ 0.88, → 1/β as p_s → 1 (0.001 at 0.999 → ~0.05 at β=0.02; figure slope.svg); classical-ml's general SE inflation recalled; correction keeps the noisy model's order — §What undersampling still costs: precision at the top / The correction amplifies errors where the list starts; closing hand-off under ### The question left open

## Notation
- β keep rate of genuine payments (= s-/s+ of classical-ml with s+ = 1); the log-odds shift is written ln(1/β), never δ (δ stays the label delay from fraud-detection-system)
- p = P(fraud|x) on the stream; p_s undersampled output; p' corrected; g the map p_s ↦ p'
- π stream base rate, π_s training-set base rate, π_t deployment base rate, p_t deployment posterior
- τ threshold on p; τ_s on p_s; τ' matched threshold on p'
- C_a, c_FN, V (from economics-of-detection)
- μ, σ Gaussian-task mean and spread; Δx crossing shift; p* bias peak

## Running cases
- Opening stream: 1 in 500, β = 0.02, training set 9.1% fraud; p = 0.02 ↔ p_s ≈ 0.5; p_s = 0.5 ↔ p' = 0.0196
- 100,000 payments: 200 frauds; β = 1 / 0.1 / 0.02 / 0.002 → 100,000 / 10,180 / 2,196 / ≈400 rows; 0.2% / 2.0% / 9.1% / 50% fraud
- Simulated stream (seeded): 500,000 train + 500,000 test, π = 0.002, two N(0,1) features, frauds shifted (2,2); β = 0.02 fit on 969 frauds / 11,165 rows; AUC 0.980, AP 0.395; numbers above
- Gaussian tasks; bias maxima 0.17 (β=0.5), 0.50 (β=0.11), 0.75 (β=0.02)
- Amount queues: A/B; C €50 0.995, D €500 0.80, E €2,000 0.30 → raw E,D,C (€600/€400/€49.75), corrected C,D,E (€40/€37/€17)
- Fraud wave π 0.002 → 0.004, factor 0.040
- Exercises: error diagnosis, 1%→20% portfolio recalibrated with class ratio 1/99 (0.5→0.0100, 0.9→0.083) instead of β = 4/99 (0.5→0.039, 0.9→0.267), cut 0.05 misses the 0.6 customer (0.057), code right only for balanced set; β edges (slope at 0.999: 45 at β=0.02, 222 at β=0.002); quiet month π_t 0.001: 0.9 → 0.082; lagged base rate 0.003 vs true 0.004: 0.213 vs 0.265 (β-only 0.153); two-region refutation (A 5/500, B 15/500, kept 4 and 16 → p' 0.0244 vs 0.0184); balanced β = 1/499 with €10/€500 → τ = 0.02, τ_s ≈ 0.91, 0.5 cut flags losing calls (€1–€10 saved per €10); Gaussian log-odds derivation, crossings 8.1/8.8, β=0.02 shifts 11.7 vs 2.3, flips ~89% vs ~1.4%; forward sim (π = 0.01, shift (1.5,1.5), β = 0.05, seed 0): AUC 0.938 / AP 0.312 all three; balanced accuracy 0.56 / 0.79 / 0.56; flagged 165 / 3,799 / 142

## Assumed
- classical-ml imbalance-leakage (named in plain text; Ref cannot cross courses): odds factor s+/s- and its selection-event proof with x-blind hypothesis, intercept shift (δ there; written ln(1/β) here), inverse correction, monotonicity (ROC/ranking unchanged), stated 0.5 on balanced set = prevalence (implicit cost (1−π)/π), matched threshold on stated scores, Platt/isotonic on unresampled held-out data, variance cost of downsampling (SE ∝ 1/√n−)
- classical-ml classification-metrics: calibration, reliability diagram, Brier score
- delayed-labels-prequential: leaf exercise (0.092 vs 0.01 at β = 0.1, p_s formula counted for a leaf); the label clock / delay block
- economics-of-detection: odds form of Bayes' rule, base rate π, C_a, c_FN, next-call rule C_a/V, ★ expected-amount queue, base-rate funnel (exercise)
- alert-budget-metrics: AUC, AP, CP@k depend only on order and ties
- fraud-detection-system: fast labels selected by the model (near-miss)

## Left open
- Whether rebalancing improves AP/CP@k on forward folds; balanced bagging recovering variance → imbalance-techniques-revisited
- Amount-dependent decision rule needing p' → example-dependent-cost
- Selection depending on x (alert feedback) → alert-feedback-selection-bias
- Change in p(x|fraud) (concept drift) → concept-drift; base-rate tracking beyond the prior formula → drift lessons
- Calibration backtests in monitoring → model-risk-monitoring; correction as a lab checkpoint → cost-aware-evaluation-lab
