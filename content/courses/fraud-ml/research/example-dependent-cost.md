# Example-dependent cost-sensitive learning and the Bayes-minimum-risk threshold — research brief

Lesson: `example-dependent-cost` (module: rare-positives, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Derive the Bayes-minimum-risk decision rule for a transaction whose false-negative cost is its amount, and compute the savings of a detector against doing nothing
Opening (verbatim, the lesson must start with it): A missed fraud costs the bank the amount that was stolen, which runs from a few euros to thousands, while every alert costs the same few euros of an investigator's time whether it was fraud or not. A threshold of 0.5 on the fraud probability treats a EUR 10 payment and a EUR 10,000 payment alike. What decision rule accounts for the amount, and how do you measure a detector in money against the bank that does nothing?

## Sources to consult
- Bahnsen et al. 2016, Sec. 2 (Table 1 confusion matrix; why accuracy/F1 fail at 0.005–0.5% fraud; Table 2 Elkan's example-dependent matrix; Hand's constant 100 × C_a; Table 3 the paper's matrix C_FN = Amt, C_TP = C_FP = C_a, C_TN = 0; Eq. 1 Cost(f) = Σ y_i(1 − c_i)Amt_i + c_i C_a; Eq. 2 Whitrow normalised cost; Eq. 3 Cost_l = min(cost of all-0, all-1) = Σ y_i Amt_i for fraud; Eqs. 4–5 Savings; caveats: negative savings, small frauds, available credit as alternative FN cost), Sec. 4.3 (Eq. 15 BMR: flag if C_a P(f|x) + C_a P(l|x) ≤ Amt P(f|x), i.e. C_a ≤ Amt·P(f|x); Eq. 16 cost-sensitive LR via genetic algorithm; CSDT splitting on savings; sampling did not help savings), Sec. 4.1–4.2 (120M transactions, 40,000 frauds = 0.025%; working subset 236,735 at 1.50% fraud, EUR 895,154 loss; 50/25/25 split; test cost 262,167), Sec. 5 (Figs. 4–7; CSDT best, CSLR close; savings up to ~71%). File: research/texts/staged-bahnsen2016-feature-engineering.txt (PDF staged-bahnsen2016-feature-engineering.pdf for the tables).
- Dal Pozzolo 2015 Sec. IV-A (Bayes minimum-risk threshold τ = (l10 − l00)/((l10 − l00) + (l01 − l11)); with prior-derived costs τ = π+; Elkan). File: staged-dalpozzolo2015-calibrating-undersampling.txt.
- Baesens Ch4 pp. 198–200 (cost-sensitive cut-off P(1|x) > 1/(1 + C(2,1)/C(1,2)); total cost = C(−,+) FN + C(+,−) FP; MetaCost, AdaCost; sampling vs cost-sensitive roughly equivalent). File: fraudanalyti-s4-ch04b.txt.
- Handbook Ch4.2 (cost matrix c_ij and weighted loss WL; fixed vs amount-dependent cost; spending limit, reaction time, contractual constraints — no consensus). File: reproducible-Chapter_4_PerformanceMetrics_ThresholdBased.md.
- Dal Pozzolo 2014 Sec. 5 (fraud cost ≠ amount: probe then spend; blocked cards cost the customer). File: staged-dalpozzolo2014-learned-lessons.pdf.
- CS6890 PS3 (features A–K, label L, per-row FN cost M varying with a risk parameter; TP = FP = 6, TN = 0) as the assignment form of this lesson. File: research/texts/cs6890-ps3.txt.
- HKU FITE7410 A2 "Model suggestion" ($60,302 mean claim vs $4,214 per investigation). File: hku-fite7410-a2a.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has calibrated probabilities (after the β correction), the budget metrics, and the cost matrix from module 1 with its unresolved choice of FN cost. The opening says the FN cost is the amount and the alert cost is fixed; the question is the decision rule and the money metric. The newcomer knows "threshold at 0.5" and has met the constant-cost threshold in classical-ml at most as a formula. Terms not yet available: example-dependent cost, administrative cost C_a, Cost(f), Cost_l, savings, Bayes minimum risk.

### Chain of sub-problems
1. **Why does the usual cost matrix not fit a transaction?** — Obvious attempt: one cost per cell, C_FN = 100 × C_a say. Why it fails: real losses run from a few euros to thousands; a constant FN cost prices a EUR 5 miss and a EUR 5,000 miss alike, and the detector that optimises it will spend alerts on the wrong ones. Answer: a cost matrix per example: C_FN,i = Amt_i, C_TP,i = C_FP,i = C_a (every alert costs the investigator's time, caught or not), C_TN = 0. Because: the bank's loss on a miss is literally the amount, and its cost on an alert is literally the call. (Caveats: the amount is not the whole loss — the probe-then-spend pattern; available credit as an alternative; keep them as stated limits.)
2. **What is the total cost of a decision set?** — Answer: Cost(f) = Σ_i [y_i(1 − c_i) Amt_i + c_i C_a], with c_i the decision (1 = flag): a flagged row costs C_a whatever its label; an unflagged fraud costs its amount. Worked on a 6-row table in the text. Because: it is the four-cell matrix summed over rows with the per-row FN cost.
3. **What does the number mean?** — Obvious attempt: lower is better; report it. Why it fails: EUR 262,167 says nothing alone. Answer: compare with the cheapest trivial policy, Cost_l = min(cost of flagging nothing, cost of flagging everything); for fraud, flagging nothing costs the total fraud amount Σ y_i Amt_i, and that is what most institutions actually do. Savings = (Cost_l − Cost(f))/Cost_l. Savings can be negative — a detector that alerts too much costs more than the fraud it saves. Because: the detector is judged against the alternative of not having one.
4. **What decision rule minimises the expected cost per row?** — Obvious attempt: flag if P(fraud | x) > 0.5. Why it fails: 0.5 ignores the amount. Answer: expected cost of flagging = C_a (whatever happens); expected cost of not flagging = Amt · P(fraud | x); flag iff C_a ≤ Amt · P(fraud | x). Carry the steps from the general Bayes risk: flag iff C_FP(1 − p) + C_TP p ≤ C_FN p + C_TN (1 − p), substitute. For constant costs this is Elkan's threshold p > 1/(1 + C_FN/C_FP); with costs set from the priors it is τ = π+. Because: the threshold is where the two expected costs cross, and with an amount in one of them the threshold is a function of the amount: p* = C_a/Amt.
5. **Why does the rule need the corrected probability?** — Obvious attempt: use the model's score. Why it fails: Amt · p_s is wrong by the undersampling factor; a threshold in euros needs the real probability. Answer: p' from the previous lesson, then the rule. Because: the rule compares a probability to a ratio of euros; only a calibrated probability makes that comparison meaningful.
6. **Should the costs enter the fit, not just the decision?** — Obvious attempt: fit with the costs (a cost-sensitive logistic regression whose objective weights each row's error by its cost; a tree that splits on savings). Why it partly fails: they help (CSDT best, CSLR close, savings ≈ 71% with all features), but a calibrated model with the BMR rule gets most of the way, and resampling does not improve savings at all because it distorts the distribution of amounts. Answer: decide with costs always; fit with costs when the learner allows it; never resample for cost. Because: the decision rule is exact given p; the fit is a heuristic.
7. **What is savings worth as a metric beside AP and CP@k?** — Answer: it is amount-weighted and threshold-dependent; it prices the frontier module 9 draws; it is the comparison the lab's written verdict is argued in (the HKU-style dollar comparison). Because: investigators see cards, the board sees euros.

### Set pieces and worked examples to recreate
- The three cost matrices side by side: Elkan's (Table 2), Hand's constant 100 × C_a, the paper's (Table 3). (Bahnsen Sec. 2.)
- A 6–8 row worked table (amount, p', decision at 0.5, decision by BMR with C_a = EUR 5): compute Cost(f), Cost_l, Savings for both rules. (Constructed; numbers from the paper's scale.)
- Savings arithmetic on the paper's split: working subset 236,735 rows, 1.50% fraud, EUR 895,154 loss; test cost 262,167. (Bahnsen Sec. 4.)
- The Bayes derivation to C_a ≤ Amt · P(f|x). (Bahnsen Eq. 15; Dal Pozzolo 2015 Eq. 10.)
- Elkan's constant-cost threshold and the τ = π+ special case. (Baesens p. 199; Dal Pozzolo 2015 IV-A.)
- The results pattern: raw+agg1 vs agg2 vs periodic, CSDT best, CSLR close, resampling no help. (Bahnsen Sec. 5, Figs. 4–7 — the figures are sourced in the features module, here a bar of the algorithms' savings.)
- The HKU cost comparison as a dollar verdict. (HKU A2.)
- CS6890 PS3's cost matrix (TP = FP = 6, TN = 0, FN per row) as the assignment form.

### Pitfalls and terms to define
- "Example-dependent" = the cost matrix differs per row; say it at first use.
- C_TP = C_a is the subtle cell: a caught fraud still costs the alert. The canonical bug is C_TP = 0; name it.
- Cost_l is the cheaper of two trivial policies, not "all flagged"; for fraud it is always "flag nothing".
- Savings is not symmetric with AP: a detector can have higher AP and lower savings; say why (amounts).
- Hand's constant was 100 × C_a, not a universal recommendation; keep the two conventions apart.
- The BMR threshold p* = C_a/Amt exceeds 1 for Amt < C_a: such rows are never flagged — a boundary the exercises probe.

### Recalled, not re-taught
- The four-cell cost matrix and the do-nothing baseline (<Ref economics-of-detection>); p' (<Ref undersampling-calibration>); why resampling fails the referee (<Ref imbalance-techniques-revisited>).
- Expected value, Bayes decision (classical-ml): one clause.

## FIGURE PLAN
- draw: key image — the decision plane: amount on x (log), probability on y, the curve p = C_a/Amt dividing flag from not-flag, with the 0.5 line for contrast and the EUR 10 / EUR 10,000 examples placed. Single <Figure>.
- draw: the per-row cost matrix as a 2×2 with Amt_i in the FN cell and C_a in both alert cells, beside Elkan's and the constant version. Single <Figure>, inspired by Bahnsen Tables 2–3.
- draw: the worked 8-row table as a figure: rows with amount and p', two decision columns, the running cost under each, Cost_l at the bottom. <FigureSequence>, 3 frames (0.5 rule → BMR rule → totals and savings).
- draw: savings against threshold for a constant threshold vs the BMR rule on the simulator, the negative region shaded. Single <Figure>, computed.
- draw: algorithms' savings as bars (DT, LR, RF, their BMR versions, CSLR, CSDT) for one feature set. Single <Figure>, inspired by Bahnsen Fig. 6.
- source: featureengin-results-fig6-7 — stem `bahnsen-savings-by-algorithm`; the reader must see the grouped savings bars rising from raw to all-features and the BMR/CS variants above the plain ones; centered after sub-problem 6.

## EXERCISE PLAN
1. [warm-up] With C_a = EUR 5, compute the BMR threshold for amounts 2, 50, 500, 5,000 and say which rows can never be flagged.
2. [boundary probe] Amt < C_a for every row: show Cost_l = Cost(flag nothing) and that the best savings is 0; then C_a = 0: show the rule flags every row with p > 0 and savings is 1 only if the model's p is nonzero on every fraud.
3. [claim to refute] "A model with higher AP always has higher savings." Build two 10-row rankings with the same labels where the one with higher AP ranks the EUR 2,000 fraud lower; compute both savings.
4. [derivation skipped] Derive the general Bayes threshold τ = (C_FP − C_TN)/((C_FP − C_TN) + (C_FN − C_TP)) from the two expected costs and show that Elkan's and the τ = π+ forms are special cases.
5. [research-shaped] Reproduce the HKU verdict ($921,949 vs $1,101,826) and then re-run it with the FN cost equal to each claim's amount drawn from a lognormal with mean $60,302; report whether the winner changes.
6. [mixed review] Under the removal rule of <Ref delayed-labels-prequential>, a card's second fraud is not scored; show how Cost_l must be computed on the remaining frauds only, and what happens to savings if it is not.
7. FORWARD → `score-to-action`: draw the BMR curve on the (amount, probability) plane and overlay a fixed k = 100 budget per day — the reader finds that the rule flags more than the budget on some days and must rank within the flagged set, the problem the routing lesson solves.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: the cost matrix and do-nothing baseline (economics-of-detection), calibrated p' (undersampling-calibration), the failure of resampling (imbalance-techniques-revisited).
- Contributes: the per-row cost matrix, Cost(f), Cost_l, Savings, the BMR rule C_a ≤ Amt · p, the fit-vs-decide distinction.
- Hands off: cost-aware-evaluation-lab (savings and BMR as checkpoints), scorecards-woe and scorecard-vs-gbm-lab (the choice argued in money), score-to-action (the frontier), tra-exemption-engine (savings against the EUR 50 liability), adversarial-classification (the cost-sensitive classifier the adversary games).
