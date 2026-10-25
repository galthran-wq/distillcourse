# The economics of detection: base rates, costs and the alert budget — research brief

Lesson: `economics-of-detection` (module: problem, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Compute the precision, expected cost and value of a detector from its error rates, the base rate and the number of alerts a team can work, and explain why hit rate is not a target
Opening (verbatim, the lesson must start with it): A detector catches 99 of every 100 frauds and wrongly flags 1 of every 100 genuine payments. On a stream where one payment in a thousand is fraud, what share of its alerts are actually fraud, what does each alert and each miss cost, and how many alerts a day should the bank pay people to look at?

## Sources to consult
- Bolton & Hand 2002, Sec. 1 pp. 235–237 (the 99%/99% at 1-in-1,000 example → about 9 true frauds per 100 flagged; suspicion score ranked against limited capacity; cost of effort; 0.1% of 100 million transactions at £10 = £1m; adverse publicity), Sec. 3 p. 239 (misclassification rate useless at 0.1% bad rate; fix the budget and maximise frauds caught), Sec. 8 (time to detection; graded investigation), Provost's comment pp. 249–251 (value decays with delay while evidence accrues; 10,000 false alarms a day). File: research/texts/statisticalf-.txt.
- Baesens et al. 2015, Ch6 "Selecting the sample to investigate" pp. 286–290 (hit rate is not a target; utility per outcome; optimal inspection budget; expected fraud amount = P × amount, the EUR 9 vs EUR 2,500 example; Table 6.5), Ch1 p. 29 (detection power vs false-alarm rate). File: research/texts/fraudanalyti-s6-ch6-7.txt and fraudanalyti-s1-preface-ch01.txt.
- Handbook Ch4.1–4.2 (why accuracy fails: 0.1% fraud and predict-all-genuine scores 0.99; the cost matrix c_ij and weighted loss; fixed vs amount-dependent cost; no consensus on cost). File: research/texts/reproducible-Chapter_4_PerformanceMetrics_ThresholdBased.md.
- Dal Pozzolo 2014, Sec. 5 (cost of a fraud is not its amount — small probe then large; false alerts cost a call, blocked cards cost the customer; accept / refuse / block outcomes). File: research/texts/staged-dalpozzolo2014-learned-lessons.pdf (text via pdftotext) — the reader summary has the points.
- HKU FITE7410 A2 answer, "Model suggestion" (mean fraudulent claim $60,302; investigator $4,214 per case; XGB $921,949 vs KNN $1,101,826) as a worked dollar comparison. File: research/texts/hku-fite7410-a2a.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has a detector with two error rates and a stream with a base rate, and a team that can check a fixed number of alerts. They know precision and recall from classical-ml but have never computed what prevalence does to precision at 1 in 1,000, never priced an alert, and will assume "99% and 99%" is a good detector. Terms not yet available: base rate (define as prevalence, one line), hit rate, cost matrix, inspection budget, expected fraud amount, utility.

### Chain of sub-problems
1. **What share of the alerts are fraud?** — Obvious attempt: 99% sensitivity and 99% specificity, so about 99% of alerts are right. Why it fails: per 1,000 payments there is 1 fraud (caught with probability 0.99) and 999 genuine (about 10 flagged at 1%); the alerts are ~11, of which ~1 is fraud. Answer: precision ≈ 1/11 ≈ 9%; the base rate, not the error rates, sets it. Because: false positives are drawn from the huge class, true positives from the tiny one. Carry the Bayes step: P(fraud | alert) = 0.99·0.001 / (0.99·0.001 + 0.01·0.999).
2. **Then why not measure accuracy?** — Obvious attempt: report accuracy. Why it fails: a detector that never alerts has accuracy 0.999 and catches nothing; misclassification rate weighs a missed fraud and a wrong alert the same. Answer: a cost per outcome — the four-cell cost matrix (c_TN, c_FP, c_FN, c_TP). Because: the two errors cost different things to different people (the bank loses the amount; the investigator loses ten minutes; the customer loses a card).
3. **What does each cell cost?** — Obvious attempt: a missed fraud costs the amount, an alert costs nothing. Why it fails: a caught fraud still costs the alert (the call); a false alert costs the call and possibly the customer (a wrongly blocked card); and a missed fraud's cost is not simply the amount — fraudsters test with a small payment and then spend, so a missed small fraud costs the later large one. Answer: fixed alert cost C_a on both TP and FP; FN cost either a constant (100 × C_a in one convention) or the amount (another); TN free. The choice is a modelling decision with no consensus; the amount-dependent version is derived in module 2. Because: the costs are what the bank actually pays, and they are not symmetric.
4. **What is a detector worth, then?** — Obvious attempt: total cost. Why it fails: a total cost of EUR 300,000 means nothing without the comparison. Answer: compare against doing nothing (everything approved; cost = all fraud amounts) — the baseline most institutions actually run; a detector's value is the cost it removes, and it can be negative when alerts cost more than they save. Because: a detector is a purchase, judged against the alternative purchase.
5. **How many alerts should the bank pay for?** — Obvious attempt: maximise the hit rate (the fraction of inspected cases that are fraud). Why it fails: a 100% hit rate is reached by inspecting one obvious case; it signals under-investment. Answer: assign a utility to each of the four outcomes (inspect fraud: amount + costs + penalty; inspect non-fraud: a scare-off value minus the cost; skip non-fraud: zero; skip fraud: strongly negative), compute total utility at each budget level, and staff the budget that maximises it — the same curve as the optimal targeting fraction in marketing. Because: each extra inspector catches less fraud than the previous one, and costs the same.
6. **Which alerts first?** — Obvious attempt: highest probability first. Why it fails: 90% on EUR 10 is EUR 9 of expected fraud; 25% on EUR 10,000 is EUR 2,500. Answer: rank by expected fraud amount P × amount, which draws a stepwise frontier over probability and amount bands (the full frontier is module 9's score-to-action). Because: the budget buys money recovered, not frauds counted.
7. **What does waiting cost?** — Obvious attempt: wait until the evidence is clear. Why it fails: the value of catching a fraud falls with delay (more payments go through) while the evidence for it grows (more payments to look at); a fraud that reveals itself ends in a customer complaint anyway. Answer: time to detection is part of the evaluation; a graded investigation (very high scores get immediate expensive review, moderate scores cheap observation) spends the budget where delay is costly. Because: the two curves cross, and the crossing point is a business decision.

### Set pieces and worked examples to recreate
- The 99%/99% at 1 in 1,000 funnel: 1,000 → 1 fraud → ~11 flagged → ~1 true; precision ≈ 9%. (Bolton & Hand Sec. 1 p. 236.)
- The do-nothing classifier: error 0.001 at a 0.1% bad rate; accuracy 0.99 at 1% fraud in the handbook's phrasing. (Bolton & Hand Sec. 3; Handbook Ch4.1.)
- The value arithmetic: 0.1% of 100 million transactions at £10 is £1 million. (Bolton & Hand Sec. 1.)
- 1M accounts × 1% daily false alarms = 10,000 calls a day. (Provost comment p. 250.)
- EUR 9 vs EUR 2,500 expected fraud amount; Table 6.5's probability × amount grid with an investigate frontier. (Baesens Ch6 p. 290.)
- The utility-per-outcome table and the total-utility-vs-budget curve. (Baesens Ch6 pp. 288–289.)
- The dollar comparison: $60,302 mean fraudulent claim vs $4,214 per investigation; XGB $921,949 vs KNN $1,101,826, 16.3% cheaper — a cost matrix turning AUC and F1 into money. (HKU A2 answer, "Model suggestion".)
- The probe-then-spend pattern: a small test payment, then the large one, so a missed small fraud costs more than its amount. (Dal Pozzolo 2014 Sec. 5; Baesens Ch2 p. 39.)

### Pitfalls and terms to define
- "Base rate" = prevalence = share of positives in the stream; say it once in the funnel.
- "Hit rate" is the fraction of inspected cases that are fraud (Baesens' word); it equals precision over the inspected set. Define at sub-problem 5 and say why it is not a target.
- Do not let the reader take "C_FN = amount" as settled; present both conventions and defer the derivation.
- Keep probability and expected value apart: a 90% probability is not a EUR 9 loss; the product is.
- The HKU cost example charges every flagged and missed case simply; say it is a worked illustration, not a recommended cost model.
- "Utility" is money with signs; do not import decision-theory vocabulary beyond that.

### Recalled, not re-taught
- Precision, recall, the confusion matrix (classical-ml): one clause each; the lesson computes with them, never defines them.
- The investigators' hundred and the ranking cut (<Ref fraud-detection-system>): one clause.

## FIGURE PLAN
- draw: key image — the base-rate funnel as proportional areas: 1,000 payments, 1 fraud, ~10 false alarms, ~1 true alarm; the alerts box enlarged beside it with 1 dark and 10 light. <FigureSequence>, 3 frames (stream → errors applied → alerts box). Inspired by the text of Bolton & Hand Sec. 1.
- draw: precision vs prevalence curve at fixed 99%/99%, log-x from 1 in 10 to 1 in 100,000, with the 1-in-1,000 point marked. Single <Figure>.
- draw: the cost matrix as a 2×2 with the two conventions side by side (constant FN cost vs amount), the do-nothing column highlighted. Single <Figure>.
- draw: total utility against inspection budget: a rising-then-falling curve with the optimum marked and the hit-rate curve falling monotonically beside it. Single <Figure>, inspired by Baesens Ch6 pp. 288–289.
- draw: the probability × amount grid with the stepwise investigate frontier, EUR 9 and EUR 2,500 cells marked. Single <Figure>, inspired by Baesens Table 6.5.
- draw: value-of-detection falling with delay and evidence rising with delay, crossing. Single <Figure>, from Provost's text.

## EXERCISE PLAN
1. [warm-up] Recompute the funnel at 1 in 200 (card data) and at 1 in 10,000 (laundering): precision of the same 99%/99% detector.
2. [boundary probe] Specificity 100%: show that precision is 1 regardless of prevalence and recall; then specificity 99.99%: what prevalence makes precision 50%? Which hypothesis of the funnel does each case remove?
3. [claim to refute] "Raising the hit rate from 40% to 80% proves the new model is better." Refute with the budget: give two budgets that produce both numbers from the same ranking, naming the step (hit rate depends on how many are inspected).
4. [derivation skipped] Derive the budget that maximises total utility when each inspected case in rank order has fraud probability p_i and the four utilities are given; show the stopping rule is "inspect while p_i·(u_TP − u_FN) + (1 − p_i)·(u_FP − u_TN) > 0".
5. [research-shaped] Reproduce the $921,949 vs $1,101,826 comparison from the two confusion matrices and the two unit costs; then change the investigation cost to $400 and report which model wins.
6. [mixed review] For each row of the typology (<Ref financial-crime-typology>), say whether "FN cost = amount" is even definable (laundering: no single amount; sanctions: a fine, not an amount).
7. FORWARD → `alert-budget-metrics`: rank ten scored payments (two fraud) and compute the fraction of fraud among the top 3 for three different rankings with the same area under the ROC curve — the reader finds that one number does not order the rankings before precision at k is named.

## ARC
- Spine step 1 "The detector inside the loop": "A fraud detector is one layer of a system: rules run before it, investigators with a budget of about a hundred alerts a day run after it, and the labels those investigators produce come back weeks later and only for what was alerted — every later difficulty is a consequence of that loop."
- Inherits: the investigator budget and the ranking cut (fraud-detection-system); the crimes' units and amounts (financial-crime-typology).
- Contributes: the base-rate funnel, the cost matrix with its two conventions, the do-nothing baseline, utility over the budget, expected fraud amount, time-to-detection.
- Hands off: alert-budget-metrics (precision at the budget as the metric); example-dependent-cost (C_FN = amount, savings against doing nothing, the Bayes rule); score-to-action (the full investigation frontier, zones); undersampling-calibration (the funnel's Bayes step reappears as the prior shift).
