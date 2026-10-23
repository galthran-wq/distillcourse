# The economics of detection — research brief

Lesson: `economics-of-detection` (module: problem, core, planned). NEW.
Goal: Compute the precision, expected cost and inspection value of a detector from its error rates, the base rate and the alert budget.

## Sources
- Bolton & Hand 2002 Sec. 1 p.236: the base-rate example (99%/99% at 1 in 1,000 → ~9 true per 100 flagged); the value arithmetic (0.1% of 100M transactions at £10 = £1M); suspicion scores ranked against investigative capacity; Sec. 3 p.239: misclassification rate useless at 0.1% (all-legitimate scores 0.001 error); cost-weighted loss OR fix the budget and maximise frauds caught. Provost's comment p.249–251: value decays with delay, evidence accrues with delay; 1M accounts × 1% false alarms = 10,000 a day; automatic action only on strong evidence; case lists.
- Handbook Ch4.1–4.2: why accuracy/MME fails; cost matrix c_ij and weighted loss WL = (TN·c00 + FN·c01 + FP·c10 + TP·c11)/N; fixed vs amount-dependent cost (FN cost = amount); spending limits, reaction time, contractual constraints; "no consensus on cost". Ch4.3: capacity argument — 100 checks/day of ~8,300 tx/day ≈ 1%, real systems ~0.1%.
- Baesens Ch6 pp.286–290: hit rate (100% hit rate = too few inspections); utility per outcome (inspect-fraud, inspect-non-fraud with scare-off value, skip-non-fraud, skip-fraud strongly negative); optimal inspection budget maximises total utility; expected fraud amount = P × amount (90% × EUR 10 = 9 not worth it; 25% × EUR 10,000 = 2,500 is). Ch7 pp.334–336 TCO and ROI (one line).
- Dal Pozzolo 2014 Sec. 5: cost of fraud is not the amount (test with small amounts then replicate larger; reaction time; a false alert costs a phone call, too many cost the customer); the three outcomes accept / refuse / block card.
- Bahnsen 2016 Sec. 2: Elkan example-dependent cost matrix (preview only; the lesson example-dependent-cost derives it); Hand's constant 100× cost.
- PSD2 Art 74 (EUR 50 payer cap; no payer loss without SCA) — ONE sentence: who bears the loss (forward to psd2-sca-tra).

## Key points
1. The base-rate funnel computed in full: N = 1,000, 1 fraud, 999 genuine; sensitivity 0.99 → 0.99 true alerts; specificity 0.99 → 9.99 false alerts; precision = 0.99/10.98 ≈ 9%. Then the general formula precision = π·TPR / (π·TPR + (1−π)·FPR) and its limit as π → 0: precision → π·TPR/FPR — precision is prevalence over FPR; to keep precision at 0.5 with π = 0.001 one needs FPR ≈ 0.001·TPR. State the consequence: the reachable FPR is set by k/N.
2. The cost matrix: four cells, c_TN = 0 by convention; expected cost per transaction; the do-nothing baseline (cost = π·c_FN) and the alert-everything baseline (cost = (1−π)·c_FP); a detector is worth running only between them. Constant-cost threshold preview: flag iff P > c_FP/(c_FP + c_FN) (classical-ml's expected-loss threshold, recalled with a Ref, not re-derived).
3. Costs are not symmetric and not constant: FN ≈ amount (but the probe-then-spend pattern makes small frauds matter); FP = a call plus friction plus, repeated, a lost customer; delay changes both (Provost's curves).
4. The budget as the binding constraint: with k alerts a day the question is not "which threshold" but "which k rows"; the expected-value-of-inspection rule P × amount vs cost per investigation (Baesens' two numbers); the optimal budget as argmax of total utility over k; hit-rate paradox.
5. Friction as a cost on the genuine side: 10,000 false alarms a day; detection vs customer experience; who pays (PSD2 Art 74 in one sentence) — the cost matrix has a column the fraud literature often zeroes.

## Set pieces & gems
- The funnel 1,000 → 1 → ~11 flagged → ~1 true: compute it on the page and draw it.
- Bolton & Hand's "all-legitimate classifier has error 0.001" — the do-nothing baseline as the number to beat.
- Baesens' EUR 9 vs EUR 2,500 expected fraud amounts — the frontier the decision lesson draws (score-to-action) appears here as two numbers.
- Provost's two curves (value falls with delay, evidence rises with delay) — drawn.
- Handbook's "no consensus on the cost of a fraud" — say it dryly; the course uses amount as the FN cost in module 2 and says why.

## Pitfalls
- Do not derive the Bayes-minimum-risk per-transaction rule here (example-dependent-cost does); do the constant-cost threshold as recall from classical-ml only.
- No metrics beyond accuracy/precision here (alert-budget-metrics owns AP, CP@k); this lesson is arithmetic and economics.
- Every number carries its frame (L12b): per day, per 1,000, per account.

## FIGURE PLAN
- draw: The base-rate funnel as a `<FigureSequence>` (4 frames): (1) 1,000 transactions, one amber; (2) sensitivity keeps the amber one; (3) specificity lets ~10 blue through; (4) the alert set of 11 with precision 9% written as a tally. Inspired by Bolton & Hand Sec. 1's text (no figure exists). Key image.
- draw: Precision as a function of FPR for π ∈ {0.1, 0.01, 0.001} at TPR = 0.9 — three curves on a log-FPR axis with the reachable region k/N shaded. Single figure, computed.
- draw: The cost matrix as a 2×2 grid with the two baselines (do nothing, alert everything) written as totals beside it, and the detector's cost as a point between them — a cell grid per voita-playbook rule 9.
- draw: Provost's two curves: value of detection vs delay (falling) and evidence vs delay (rising) on one axis, the crossing marked "act here". Inspired by Provost's comment (text only).
- draw: The investigation-value plane: probability × amount with iso-value curves P·A = cost and the two Baesens points (0.9, 10) and (0.25, 10,000) placed. Single figure (score-to-action later draws the stepwise frontier over it).
- draw: Total utility vs budget k: a concave curve with its argmax, built from a toy alert ranking with per-alert utilities — the "optimal inspection budget" picture from Baesens Ch6 (text + Table 6.5), computed on a 20-alert toy.

## EXERCISE PLAN
1. Warm-up: redo the funnel at π = 0.0025 (Worldline) with TPR 0.8, FPR 0.005; report precision and the number of alerts per 400,000 transactions.
2. Derivation the lesson skipped: show precision → π·TPR/FPR as π → 0 and derive the FPR needed for precision p* at prevalence π; evaluate at π = 0.001, p* = 0.5.
3. Boundary probe: set c_FP = 0 — what does the optimal policy become, why is "alert everything" not what any bank does, and which cost the matrix was silently omitting (friction, capacity).
4. Claim to refute: "A detector with ROC-AUC 0.95 is good enough for production." Construct two score distributions with equal AUC where one gives precision 0.4 at k = 100 and the other 0.05; name what AUC does not see (the budget region).
5. Research-shaped: from Baesens' numbers (mean fraud EUR 60,302, investigation ≈ EUR 4,214 per case from a EUR 50,564 salary, as HKU A2 computes), derive the break-even probability below which an alert is not worth working, and compare with the two example points.
6. FORWARD (E7): compute the expected cost of a detector at a FIXED threshold 0.5 for ten listed transactions with amounts and probabilities, then find the per-transaction rule that does better — the reader derives the amount-dependent threshold → lands on `example-dependent-cost`'s BMR rule.
7. Mixed review (E3): place the budget k and the delay δ of fraud-detection-system's loop into the cost formula: which cost is a function of δ and which of k.

## ARC
- Inherits: the budget and the label clocks (fraud-detection-system); classical-ml's expected-loss threshold.
- Contributes: the arithmetic of rarity — precision bounded by prevalence over FPR, the cost matrix with amount and friction, the inspection-value rule, the budget as the constraint.
- Hands off: the reachable ROC region and CP@k (alert-budget-metrics); amount-dependent costs (example-dependent-cost); the frontier and friction harm (score-to-action); liability (psd2-sca-tra).
- Spine step 1: the detector inside the loop.
