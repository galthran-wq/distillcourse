# example-dependent-cost — ledger

**Problem.** A miss costs the payment's amount, an alert a fixed call; a 0.5
(or any single) threshold ignores the amount: what rule accounts for it, and
how is a detector measured in money? Answer: per-payment cost matrix
(c_FN,i = Amt_i, c_TP,i = c_FP,i = C_a, c_TN,i = 0); Cost(d) summed row by
row; savings against the cheaper of flag-nothing / flag-everything (on card
streams flag-nothing); Bayes minimum-risk rule flag iff C_a ≤ Amt·p (p* =
C_a/Amt) on calibrated p; costs always in the decision, in the fit where the
learner takes weights, never via class rebalancing; amounts in weights OR
threshold, not both.

## Explained
- Constant miss price (convention: 100 alerts, €500 at C_a = €5 → τ = 0.01) fails: €10 at p 0.05 flagged (risk €0.50 vs €5 call), €3,000 at p 0.008 left (risk €24); Task: leave A needs c < €100, flag B needs c ≥ €625 — §One price for every miss buys the wrong alerts
- Definition: example-dependent cost matrix; costs as data columns (figure cost-columns.svg); c_TP = C_a assumes catching saves the whole amount; bug c_TP = 0 (body: flatters cost, shifts rule; worked out only in an exercise); amount ≠ whole loss (probe, Ref economics), remaining credit as alternative column — same §, ### The miss cost is the payment's own amount
- Cost(d) = Σ [y_i(1−d_i)Amt_i + d_i C_a] — §What a day of decisions costs… / ### Summing the four cells
- Baseline Cost_base = min(Σ y Amt, N C_a); flag-all cheaper iff C_a < base rate × average fraud amount (€0.25/payment at 1/400, €100) → flag-nothing on card streams — ### The baseline
- Definition: savings S = (Cost_base − Cost)/Cost_base = economics value as a share of the fraud amount; ceiling 1 − n_f C_a/Σ y Amt; no floor (negative) — same (no KeyFact)
- Baseline phrased as: a detector is worth running only if its cost is below both trivial rules. Bayes minimum-risk decision: E[cost|flag] = p c_TP + (1−p) c_FP vs E[cost|leave] = p c_FN + (1−p) c_TN; substituted → C_a ≤ Amt·p (left side loses p because the call is charged on a caught fraud too) — §The decision that minimises expected cost / ### Two expected costs, four cells
- Theorem (with collapsed proof): row-separable expected cost, flag iff C_a ≤ Amt_i p_i; needs real probabilities — same
- p* = C_a/Amt: €10 → 0.5, €10,000 → 0.0005; Amt ≤ C_a never flagged; figure threshold.svg (key image); constant price gives horizontal line C_a/c; general four-cell threshold left to an exercise (no in-body preview); KeyFact: fixed τ is optimal only for amount C_a/τ (0.5 ↔ €10, 0.01 ↔ €500) — ### Reading the threshold
- Rule on the day: FigureSequence plane-1..3 (0.5 / τ = 0.01 / per-payment) with Task — ### The rule on the day
- Opens with Ref to undersampling-calibration #an-amount-weighted-queue-reverses (reminder, not re-taught); new consequence: raw undersampled p_s (β = 0.02) same order, rule flags 5,900 → savings −96%; correct to p' first; other miscalibration (trees, boosting) → reliability check + calibrator (classical-ml); figure savings-threshold.svg; KeyFact: a fixed cut survives an uncorrected model by retuning one number (correction increasing), the per-payment rule cannot (each amount needs its own matched cut = the correction) — §The rule reads probabilities as numbers
- Log-loss weighs a €6 (G6) and a €1,200 (G5) fraud equally; G6 has 12× the frauds — §Costs in the fit… opener
- Cost as weighted error: Cost = Σ_fraud C_a + Σ_fraud (1−d)(Amt − C_a) + Σ_genuine d C_a → sample weights Amt − C_a (fraud miss; €1 for €6, €1,195 for €1,200), C_a (false alarm); fraud below C_a → negative weight — ### The cost is a weighted error
- Weighted model's own 0.5 cut = per-payment rule, two steps: weight = copies (Ref imbalance), amount is a feature so same-x rows share Amt, log-loss fit estimates weighted share q with odds p/(1−p)·(Amt−C_a)/C_a; q ≥ 0.5 ⟺ p·Amt ≥ C_a (holds as far as the fit recovers the weighted odds) — ### Why the weighted model's own 0.5 cut is the cost decision
- Cost-sensitive logistic regression (expected-cost objective, non-convex, general search); cost-sensitive tree (leaf flagged iff C_a × rows ≤ fraud amounts; split by cost drop; 40-row leaf with €900 + €30 frauds flagged) — ### Two learners built around the cost
- Why class rebalancing cannot carry amounts: genuine rows all weigh C_a, so undersampling genuine is just the class ratio again; the fault is on the fraud side (weights differ by hundreds; a class factor gives €6 and €1,200 frauds the same weight; SMOTE adds invented amounts, weight follows density not cost); genuine-side weights matter only if c_FP varied by payment (automatic block, Ref economics); cost-proportionate sampling = weighting by another route; KeyFact: decide with costs always, fit where possible, never rebalance for cost, amounts in weights or threshold not both — ### Why resampling cannot carry the amount
- Published processor comparison (unnamed in body): 120M txns Jan 2012–Jun 2013, 40,000 frauds (0.025%); four feature sets glossed in one clause (raw fields; agg1/agg2 card aggregates, agg2 restricted to merchant type or country; per = time-of-day periodic), table uses the all-features bars, features themselves left to transaction-aggregates; subset 236,735 at 1.50%, €895,154; 50/25/25; test 71,226, 1.45%, €262,167; savings read off chart, all features: LR 12% / +rule 45% / CSLR 67%; DT 52/60/CSDT 71; RF 57/64; € at test baseline ≈ 31k / 118k / 168k / 186k; resampling did not improve savings; caveats: single split, no delay block, dense subset — ### What a published comparison on processor data shows (sourced figure bahnsen-savings-by-algorithm.png, Fig. 6, in the lesson)
- Savings vs AP/CP@k: order-only vs amounts+decision+calibration+C_a — §Savings beside average precision and card precision
- Why savings does not select models: rests on few frauds (G5's 3 frauds = 24 pts, G6's 36 = 1.4 pts → noisy across folds); not the model's alone (C_a, β correction, rule; 64.4% at €5 vs 34.5% at €40); CP@k on prequential folds selects (ranking only, a card counts once), blind to amounts, which enter via rule/weights; savings reported beside it for the chosen model — ### Why savings does not choose the model

## Notation
- C_a alert cost (from economics); Amt_i amount; c_TP,i, c_FP,i, c_FN,i, c_TN,i per-payment costs; y_i label; d_i decision (1 = flag; deliberately not c_i, which would clash with costs); p_i calibrated probability (= p'); p* = C_a/Amt per-payment threshold; Cost(d); Cost_base; S(d) savings; n_f number of frauds; N payments; τ fixed threshold; h_θ model output (CSLR objective only)

## Running cases
- Day of 10,000 payments, C_a = €5, eight groups (payments, amount, p, frauds): G1 4,100/€15/0.001/4; G2 3,000/€80/0.002/6; G3 2,400/€300/0.005/12; G4 300/€20/0.05/15; G5 100/€1,200/0.03/3; G6 60/€6/0.6/36; G7 30/€400/0.4/12; G8 10/€250/0.8/8; fraud €15,056 (96 frauds); flag-all €50,000
- Rules: 0.5 → 70 calls, missed €12,840, cost €13,190, S 12.4%; τ = 0.01 → 500 calls, missed €4,140, cost €6,640, S 55.9% (best single τ); per-payment → G5, G7, G8, 140 calls, missed €4,656, cost €5,356, S 64.4%; gap €1,284 = G4 + G6 losses; perfect detector ceiling 96.8% (not stated in body)
- Raw p_s at β = 0.02: 0.048 / 0.091 / 0.20 / 0.72 / 0.61 / 0.99 / 0.97 / 0.995 → 5,900 calls, cost €29,560, S −96%
- In-body exercises: C_a = €1 → baseline flag-all €10,000, S 53.6% (69.2% if wrongly vs do-nothing); C_a = €40 → G7, G8, S 34.5%, constant rule −60.3%
- Exercises: thresholds €2/50/500/5,000; boundary (Amt < C_a, C_a → 0); AP 0.85 vs 0.69 with savings 2.2% vs 96.4% (ten rows, €2,000 + 3 × €20, k = 3); general τ = (c_FP − c_TN)/((c_FP − c_TN) + (c_FN − c_TP)), zero-diagonal 1/(1 + c_FN/c_FP), priors → π, c_TP = 0 bug (€10: 0.33; G6 flagged; +0.8 pt); weighted model + rule double-count (€1,000 at p 0.001 → q 0.166 → flagged; uses the body's weighted-odds result); known-card baseline 60% vs 73.3%; published test set (1,033 frauds, €254 avg, flag-all cheaper below €3.68, ceiling 98.0%, €186k/€118k); forward budget k = 100 → G8, G7, 60 of G5, S ≈ 56.2%, spare calls unused beyond the rule

## Assumed
- economics-of-detection: cost matrix, C_a, amount convention and probe/spending-limit caveats, do-nothing baseline, value can be negative
- undersampling-calibration: τ = C_a/c_FN on p', p_s = p/(p + β(1−p)), correction p', matched threshold, 0.5 on balanced = base rate
- imbalance-techniques-revisited: weights = copies = deletions, SMOTE, conclusion (frauds counted as one)
- alert-budget-metrics: AP, CP@k, three-metric rule
- delayed-labels-prequential: known-card removal, delay block, prequential selection
- classical-ml: calibration, reliability diagram, sample weights, log-loss

## Left open
- Rule vs fixed budget, action zones → score-to-action (forward exercise)
- Five baselines benchmarked → ulb-handbook-benchmark; savings/BMR as lab checkpoints → cost-aware-evaluation-lab
- Aggregated/periodic features raising savings (same published study) → transaction-aggregates
- Savings against the PSD2 liability / TRA → tra-exemption-engine; adversary gaming a cost-sensitive classifier → adversarial-classification
- Whitrow-style normalised cost not taught
