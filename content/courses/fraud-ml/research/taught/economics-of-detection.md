# economics-of-detection — ledger

**Problem.** A detector catches 99% of frauds and flags 1% of genuine payments on a 1-in-1,000 stream: what share of alerts are fraud, what does each outcome cost, how many alerts should be staffed? Answer: precision ≈ 9% (base rate sets it); a cost matrix with a fixed alert cost and a miss cost by convention; value = cost removed from doing nothing, can be negative; staff while the next call's expected saving exceeds its cost (hit rate low by design); timing is part of value. (★: queue by expected fraud amount.)

## Explained
- Base rate π = prevalence; funnel example 1,000 → 1 fraud → ~11 alerts → ~1 true; precision ≈ 9% — §What share of the alerts are fraud: the base rate decides / Counting a thousand payments
- Precision via Bayes' rule in TPR, FPR, π; base-rate neglect stated and refuted; odds form: posterior odds = (TPR/FPR) × prior odds (99 × 1:999 ≈ 1:10) — § Bayes' rule, and why the error rates cannot rescue precision
- Remark: even odds needs TPR/FPR > (1−π)/π (FPR < ~0.1% at 1 in 1,000) — same §
- Precision vs base rate curve: 1/100 → 50%, 1/400 → 20%, 1/1,000 → 9%, 1/10,000 → 1%; error rates travel between streams, precision does not; KeyFact: a precision is a property of the stream it was measured on (99/99 detector ≈ 92% on a 1-in-10 enriched sample, ≈ 9% at 1 in 1,000), compare precisions only at the same base rate — § The same detector on different streams
- Accuracy fails: do-nothing rule has accuracy 0.999 vs 0.99 for the 99/99 detector — §Accuracy prices every mistake the same
- Definition: cost matrix c_TP, c_FN, c_FP, c_TN, weighted loss; accuracy as special case — same §
- Alert cost C_a = c_TP = c_FP (a call); unit caveat: §§1–3 price each flagged payment as one call (simplification; a call settles a card with ~3 frauds), §4 switches to cards; when the model blocks on its own, a false positive costs the customer a card that stops working (not an investigator a call); recalls fraud-detection-system's blocking argument → automatic action only on near-certain patterns — § What an alert costs
- Miss cost: amount (reimbursed) vs fixed c (probe-then-spend argues equal weight) vs spending limit; no agreed convention; cost-matrix figure (fixed-c vs amount conventions, do-nothing column blue) placed at the end of this subsection; every outcome costs something except leaving a genuine payment alone (c_TN = 0) — § What a miss costs
- Do-nothing baseline = blue column (all c_FN); also a ceiling (0.1% of 100M at €10 = €1M); cost(do nothing) = (TP+FN)c_FN, cost(detector) = (TP+FP)C_a + FN·c_FN; value = TP·c_FN − (TP+FP)C_a = TP(c_FN − C_a) − FP·C_a — §What a detector is worth: the cost it removes
- Cost per caught fraud = C_a/precision; value > 0 iff c_FN > C_a/precision — same §
- Card unit: V = summed c_FN of a card's remaining frauds; U(k) = value formula in expectation over top k cards (E[TP] = Σp_r, E[FP] = k − Σp_r) = V Σ p_r − C_a k; marginal V p_k − C_a; stop when p_k = C_a/V — §How many alerts to pay for / The value of the next call
- Definition: hit rate h(k) = precision of the top k; falls monotonically along a ranking; 100% hit rate = understaffed; only comparable at fixed k — § Why hit rate is not a target
- Aside: four-outcome utilities (fines, deterrence/scare-off, non-economic value), marketing targeting analogue — same §
- ★ (starred, off the core path) Expected fraud amount P × amount; €9 vs €2,500; banded grid with staircase frontier; frontier = stopping rule with amount for V (expected amount > C_a, €10 unconstrained) raised to €200 by a binding team capacity; needs calibrated p — §★ Which alerts first: expected amount, not probability
- Value of catching falls with delay while evidence rises; acting at the probe would save the most (€1,000) if it fired, but at P = 0.05 its expected saving is only €50; self-revealing fraud worth nothing to detect; time to detection belongs in evaluation; graded responses (immediate call/block vs a watch list with a lower call threshold on the next payment); expected saving peaks between weakest evidence and nothing left — §What waiting costs: value falls as evidence grows

## Notation
- π base rate; TPR, FPR; c_TP, c_FN, c_FP, c_TN; C_a alert cost; A average fraud amount; k budget (from fraud-detection-system); p_r probability that the rank-r case is fraud; V saving per call to a compromised card; U(k) value of working top k; h(k) hit rate; y_r label at rank r

## Running cases
- 99%/99% detector at π = 0.001: precision 9%, odds 1:10
- Belgian stream (400,000/day, 0.25%): 99/99 detector → 4,980 alerts, 990 fraud, precision 20% (in-body exercise)
- 1,000,000 payments/day, π = 0.001, C_a = €10: 10,980 alerts; A = €100 → value −€10,800/day; A = €200 → +€88,200; break-even A ≈ €111 = C_a/precision; in-body exercise: C_a ≈ €9.02 or FPR ≈ 0.89% for break-even; both fix the alert bill (TP+FP)C_a at TP·c_FN = €99,000
- Staffing: p_r = 0.3 e^{−r/60} (≈15 compromised in top 100), V = €500, C_a = €10 → k* ≈ 162, U ≈ €6,775/day, hit rate 10%, last call 2%; U(100) ≈ €6,300, U(50) ≈ €4,600 at 20% hit rate, U(500) ≈ €4,000
- Expected-amount grid: probability bands × amount bands (€5,000+ as €7,500), frontier €200
- Stolen card: €1 probe then 5 × €200; P(fraud) 0.05/0.40/0.70/0.85/0.95/0.99; expected saving peaks €420 after second €200
- Exercises: 1 in 200 → 33%, 1 in 10,000 → 1%; FPR 0.01% → 50% precision at ~1 in 9,900; hit-rate 80% at k=20 (€7,800) vs 40% at k=100 (€19,000); general stopping rule p*(u's); insurer (hypothetical, unsourced figures): tree TP58/FN9/FP32 vs kNN TP59/FN8/FP88, $60,302 claim, $4,214 investigation → $921,978 vs $1,101,874 (16.3%), at $400 kNN wins; three rankings with AUC 0.625 and different top-1/top-3 precision

## Assumed
- fraud-detection-system: k ≈ 100 ranking cut, blocking-rule precision argument, Belgian stream, ~15 compromised cards in LR top 100
- financial-crime-typology: five crimes and their label sources (mixed-review exercise)
- classical-ml: precision, recall, confusion matrix, ROC area

## Left open
- Precision at the budget / card precision as metrics, AUC's blindness to the cut → alert-budget-metrics
- Amount-dependent Bayes rule, savings measure → example-dependent-cost
- Calibration of p under undersampling → undersampling-calibration
- Full action zones from scores → score-to-action
- What public datasets contain (base rates, amounts, delays) → canonical-datasets
