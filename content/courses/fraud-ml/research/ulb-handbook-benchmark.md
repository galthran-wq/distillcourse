# The handbook benchmark: five models, three metrics, simulated and real data — research brief

Lesson: `ulb-handbook-benchmark` (module: rare-positives, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. Module-final APPLICATION lesson.
Goal: Evaluate five baseline models on simulated and Worldline card data and attribute every ranking reversal to the metric and the data regime
Opening (verbatim, the lesson must start with it): Five standard classifiers — logistic regression, a shallow tree, an unpruned tree, a random forest and a boosted ensemble — are trained on a simulated week and on a week of real card payments, each scored three ways. Which one is best? The answer depends on the metric and the data, and the module's results should say exactly why.

## Sources to consult
- Handbook Ch3 BaselineModeling (train/delay/test with known-card removal; 67,240 training rows / 598 frauds; test 58,264 / 385 = 0.66%; depth-2 tree test AUC 0.763, AP 0.496, CP@100 0.241; random 0.5 / 0.007 / 0.017; the five-model table LR 0.871/0.606/0.291, DT2 0.763/0.496/0.241, DT∞ 0.788/0.309/0.243, RF 0.867/0.658/0.287, XGB 0.862/0.639/0.273; training AUC = AP = 1.0 for DT∞ and RF; the depth-2 tree's leaf counts 236 frauds / 66,498 genuine → p = 0.003536 and the threshold 218.67 vs the true 220; execution times), Ch3 Baseline_RealWorldData (~400,000 tx/day, ~1,000 frauds, ~300 compromised cards; the real tree: TERMINAL_ID_RISK_30DAY_WINDOW > 0.075 AND CUSTOMER_ID_NB_TX_1DAY_WINDOW > 13.5; XGBoost AUC 0.899 vs RF 0.78 and LR 0.788; AP much lower; RF AP below DT2 from overfitting), Ch4.3 (DT∞ vs DT2: AUC 0.788 vs 0.763, AP 0.309 vs 0.496; few points on tree curves), Ch4.5 Assessment_RealWorldData (random CP@100 ≈ 0.0025; LR ≈ 0.15; DT2 ≈ 0.1; PR curves squashed; APs 0.002 random, LR 0.035, DT2 0.024, DT∞ 0.003, RF 0.015, XGB 0.035), Ch3 Summary. Files: research/texts/reproducible-Chapter_3_GettingStarted_BaselineModeling.md, reproducible-Chapter_3_GettingStarted_Baseline_RealWorldData.md, reproducible-Chapter_4_PerformanceMetrics_Assessment_RealWorldData.md.
- Handbook Ch3.3 (the 14 baseline features, named: weekend/night flags, customer windows 1/7/30 days, terminal windows and risk) — the features the five models see; detail is module 3. File: reproducible-Chapter_3_GettingStarted_BaselineFeatureTransformation.md.
- Handbook Ch2.4 (the eight challenges, as the checklist the benchmark meets or dodges). File: reproducible-Chapter_2_Background_MachineLearningForFraudDetection.md.
- Dal Pozzolo 2014 Sec. 7.2.1 (random forest beats NNET and SVM; more training days help) — one line of cross-check. File: staged-dalpozzolo2014-learned-lessons.pdf.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has every tool of the module: three metrics, the delay-aware split, the undersampling correction, the rebalancing verdict, the cost rule. The opening puts five familiar classifiers on two datasets and asks the question every newcomer asks first — which is best — and the lesson's job is to show that the module's results, not a league table, answer it. The artifact is the handbook's own benchmark: its numbers, its figures, its split, re-read with the module in hand. No new method is introduced. Terms not yet available: none; the lesson consolidates.

### Chain of sub-problems
1. **What is being compared, exactly?** — Obvious attempt: five algorithms. Why it fails: each number depends on the split (train/delay/test with removal), the features (the 14 baseline ones), the metric and the data. Answer: fix the geometry first — one training week of 67,240 rows with 598 frauds, a one-week delay, one test week of 58,264 rows with 385 frauds after removal — and read the five models on it. Because: without the geometry, a reversal cannot be attributed.
2. **On the simulator, why do two trees swap places?** — The unpruned tree beats the depth-2 tree on AUC (0.788 vs 0.763) and loses on AP (0.309 vs 0.496); its training AUC and AP are 1.0. Answer: pure leaves give two scores (0 and 1); most frauds land in the 1-leaf with many genuine rows (AUC decent) but the top of the ranking is diluted (AP collapses); the depth-2 tree's four leaves put the amount > 220 leaf at the top with precision near the simulator's rule. Because: this is overfitting read through the two metrics — the module's claim about AUC in one pair of numbers.
3. **What did the shallow tree learn?** — Answer: its first split is amount ≤ 218.67 against the scenario's true 220, with a leaf of 236 frauds among 66,498 genuine rows (p = 0.0035) below and nearly pure fraud above — it read scenario 1 off the data; the handbook's simulator is a unit test, and the tree passed it. Because: the generating rule is known.
4. **Why does the ranking change on real data?** — On Worldline's week: XGBoost AUC 0.899 against RF 0.78 and LR 0.788; AP an order of magnitude lower (0.002 random, 0.035 LR and XGB, 0.015 RF, 0.003 DT∞); random forest's AP below the depth-2 tree's; CP@100 ≈ 0.15 for LR against 0.0025 random. Answer: with 0.25% fraud and ~3 frauds per card, precision is squashed to the floor for every model; the forest overfits the few positives; the boosted ensemble's robustness to imbalance (previous lesson) shows up as the AUC winner; CP@100 is the only number an investigator can read. Because: the regime (base rate, frauds per card, feature strength) sets which metric moves at all.
5. **What did the real tree learn?** — Answer: TERMINAL_ID_RISK_30DAY_WINDOW > 0.075 and CUSTOMER_ID_NB_TX_1DAY_WINDOW > 13.5 — a terminal with a 30-day fraud rate above 7.5% and a card with more than 13 payments today: a burst on a compromised terminal, not an amount. Because: real fraud is in the entity history, which is module 3's point; the amount rule of the simulator is a script.
6. **So which model should the bank ship?** — Obvious attempt: XGBoost, it wins AUC on real data. Why it fails: on CP@100 the models tie within noise, and the next module shows a tuned tree matching XGBoost at a hundredth of the compute. Answer: the question is ill-posed until the metric and the budget are fixed; what the module delivers is the referee, not the champion. Because: that is the spine's claim.
7. **Where does the artifact depart from the idealisation?** — The one-week delay is a simplification of labels that trickle in; the replay's labels are complete; the simulator's fraud is scripted and has no adversary; the real test week is one week; the features are the 14 baseline ones only. Because: every number carries these caveats forward.

### Set pieces and worked examples to recreate
- The five-model test table with three metrics, simulated; the training-set AUC = AP = 1.0 line for DT∞ and RF. (Handbook Ch3 BaselineModeling.)
- The depth-2 tree drawn with its leaf counts and the 218.67 threshold. (Handbook Ch3.)
- The AUC/AP swap of DT∞ vs DT2 with the two-score explanation; the PR curves with few points. (Handbook Ch4.3.)
- The real-data benchmark: AUC 0.899/0.78/0.788; APs 0.002–0.035; CP@100 0.15 vs 0.0025. (Handbook Ch3 RealWorld, Ch4.5.)
- The real tree's two splits. (Handbook Ch3 RealWorld, Fig. 2.)
- Random baselines on the simulator: AUC 0.5, AP 0.007 (the prevalence), CP@100 0.017. (Handbook Ch3.)
- Execution times as a first look at cost (module 4 takes it up). (Handbook Ch3.)

### Pitfalls and terms to define
- "Unpruned tree" / "DT∞": depth unlimited; say it.
- AP on real data of 0.035 is not a bad model — it is 17× the random 0.002; always give the random baseline beside it.
- CP@100 on real data counts cards against ~300 compromised a day; the ceiling is one third.
- The real-data figures are static (confidential replay); the lesson cannot reproduce them, only read them.
- Do not import module 4's tuning results beyond one forward sentence.

### Recalled, not re-taught
- All of module 2: AUC/AP/CP@k (<Ref alert-budget-metrics>), the split (<Ref delayed-labels-prequential>), the imbalance verdict (<Ref imbalance-techniques-revisited>), savings (<Ref example-dependent-cost>); the simulator and the Worldline numbers (<Ref canonical-datasets>).

## FIGURE PLAN
- draw: key image — five models × three metrics as grouped bars for the simulator, with the DT∞/DT2 swap highlighted and the random baselines as dashed lines. Single <Figure>, from the handbook's table.
- draw: the depth-2 tree with leaf counts and the 218.67 split, the true rule 220 annotated. Single <Figure>, inspired by Handbook Ch3's tree.
- draw: why pure leaves win AUC and lose AP: a ranking with two score values, most frauds in the top block mixed with many genuine; the ROC and PR points it produces. <FigureSequence>, 3 frames.
- draw: the same grouped bars for real data on a log-y axis, random baselines marked. Single <Figure>.
- source: reproducible-wl-decision-tree — stem `worldline-depth2-tree`; the reader must see the two split conditions (terminal risk > 0.075, 1-day count > 13.5) and the leaf class counts; centered under sub-problem 5 (check legibility; if the node text is unreadable, draw instead).
- source: reproducible-wl-pr-curves — stem `worldline-pr-floor` (shared with alert-budget-metrics; reuse the same crop); the reader must see every curve under 0.1 precision beyond a sliver of recall; float right beside sub-problem 4.
- draw: the departure checklist: the eight challenges as rows, simulator and real columns, met / dodged. Single <Figure>.

## EXERCISE PLAN
1. [warm-up] From the simulator's five-model table, compute each model's AP and CP@100 as multiples of the random baseline, and rank the models by each.
2. [claim to refute] "The unpruned tree is a better detector than the depth-2 tree because its AUC is higher." Give the two-score argument and the top-100 consequence; name the step (which region AUC integrates).
3. [boundary probe] A simulator with only scenario 1: show that the depth-1 tree at 220 is the optimal detector, that its AP is 1 before removal, and why removal of detected cards still lowers CP@100 below 1.
4. [research-shaped] From ~1,000 frauds on ~300 cards a day and CP@100 ≈ 0.15 for logistic regression, estimate how many of the day's compromised cards the hundred alerts recover and how many frauds that stops if a card averages three; state what would count as agreement with the handbook's "~29 detected per day" on the simulator.
5. [derivation skipped] Show that a model producing exactly two score values has AUC = ½(1 + TPR − FPR) at the single operating point and AP determined by the precision of the top block — the formulas behind sub-problem 2.
6. [mixed review] Price the simulator benchmark in savings (<Ref example-dependent-cost>): with C_a = EUR 5 and the test week's amounts, which of the five models saves most at the BMR rule, and does it match the AP order?
7. FORWARD → `gbm-model-selection`: record the training time and the CP@100 of the depth-2 tree, the forest and XGBoost on the simulator; compute CP@100 per second of compute — the reader finds the tree's ratio before the next module shows a tuned tree matching the ensemble.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: every result of the module and the two datasets.
- Contributes: the module's results applied to one real benchmark; the DT∞/DT2 reversal explained; the real-data regime (0.25%, 3 frauds per card, precision on the floor); what the real tree learned.
- Hands off: cost-aware-evaluation-lab (reproduces these numbers on a reduced simulator), gbm-model-selection and worldline-model-comparison (the same models tuned and extended), transaction-aggregates and point-in-time-features (the two features the real tree split on).
- APPLICATION spec: the artifact is the handbook's chapter-3 benchmark — five models on 67k simulated rows with 598 frauds and on one week of Worldline data, scored by AUC, AP and CP@100. Module results used: AP as the top-region metric and CP@100 with card collapsing and detected-card removal (alert-budget-metrics); the train/delay/test split with d − δ removal (delayed-labels-prequential); the AUC-up/precision-down reading of overfitting and rebalancing (imbalance-techniques-revisited); savings as the money reading (example-dependent-cost). Departures from the idealisation: a one-week delay stands in for labels that trickle in; the replay's labels are complete; the simulator's fraud is scripted with no adversary; one test week; the 14 baseline features only; the real-data figures are static and cannot be re-run.
