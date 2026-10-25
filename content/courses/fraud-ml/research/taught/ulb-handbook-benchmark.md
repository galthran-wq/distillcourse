# ulb-handbook-benchmark — ledger

**Problem.** Five default models (LR, depth-2 tree, unpruned tree, random
forest, XGBoost) on the simulator's week and a real Belgian e-commerce week,
scored by AUC, AP, CP@100: which is best? Answer: the table cannot say; every
reversal is either a metric reading a different part of the list, noise
(one week), or the stream changing what 15 inputs let a model find
(measured from the depth-2 trees' leaves); each cause is labelled derived,
measured, or hypothesis (forest's diluted top and XGBoost's AUC lead are
located but their mechanisms are hypotheses; the uneven sim→real drop is attributed to leaf size, a hypothesis). The champion is chosen by CP@100
on prequential folds over tuned candidates (gbm-model-selection).

## Explained
- Setup held fixed: NOT re-taught — one paragraph Refs alert-budget-metrics §five-models-scored-on-a-test-week (weeks, counts, 15 inputs, five models at defaults, both streams) with a clause of reminder (delay derived in delayed-labels, known-card removal, nothing tuned or rebalanced). Added here only: full-depth tree is called "unpruned tree" in this lesson; DT2 = three splits, four leaves; RF tries a random subset of inputs at each split — §What the comparison holds fixed, and what it does not
- Nothing beyond the 15 inputs enters (no merchant category, country, card identifier); terminal rate from already-held labels, how → Ref point-in-time-features. The 15 are not listed again (alert-budget-metrics lists them); heading kept because transaction-aggregates links its anchor — ### Fifteen inputs, built the same way
- Stream-difference table (payments/day, test base rate, frauds per card-day, compromised cards/day) + the unlisted fifth: separability — same §, ### What changes between the streams
- Section question: why all five models, memorisers included, reach 47–100× the base rate in AP on the simulator; simulator reversals recalled in one clause, not re-taught (two-score tree; top three within 2 cards/day) — §The simulator: half the fraud in two leaves
- Training-week table (train vs test AUC/AP/CP@100), motivated as the test of which models memorised: memorisers (unpruned tree, RF, XGBoost) score ~1.0 on training, train→test AUC loss 0.13–0.21 vs LR 0.021, DT2 0.039; RF/XGB still near LR on test ⇒ memorised regions stayed fraudulent — same §, ### What the training week says
- Simulator depth-2 tree with full leaf counts (root: terminal 7-day fraud rate > 0.55 = scenario 2; amount > 218.67 = scenario 1, Ref canonical for why below 220; leaf 2 = scenario 1 (~37 frauds/week) plus the ~half of scenario 3's ×5 payments that exceed 220, so most of its 127 training frauds are scenario 3; the rest of scenario 3 in leaf 1; Ref canonical answer-key example) — same §, ### What the depth-2 tree found
- Example: reading a day's CP@100 off tied leaf blocks (day 129: 25 cards/21 + 22/2 + 53 drawn from 3,370 with 27 → 0.4; expected 0.23, measured 0.24); FigureSequence day-blocks; in-body exercise day 135 (0.19 without detected-card removal vs 0.12 with; removal costs 0.07–0.08/day from day 132, day 135's 0.07 is a large share only because the day had 19 cards) — same §
- KeyFact: two leaves hold half the simulator's test frauds at 97% — scripted frauds nearly separable and the regions persist week to week, so memorisers transfer there; models reach 47–100× base rate in AP — same §
- Real results table/figure; floors (AUC 0.5, AP = base rate ≈ 0.002, CP@100 random 0.0025); note that DT2's real CP@100 is 0.077, about eight cards/day (alert-budget-metrics' "about ten" a day, Ref §on-real-card-data, was read off its daily chart, 5–12/day) — §The real stream…, ### Every number against its floor
- AP multiple of base rate falls 5–30×; proof that a lower base rate alone cannot cause it: precision/π = TPR/(π TPR + (1−π) FPR) rises as π falls when TPR > FPR (same ROC ⇒ higher AP multiple) — same ###
- Uneven drop: unpruned tree ÷30 and RF ÷13 drop most; XGBoost, perfect on the simulator's training week, ÷5 like LR; DT2 ÷6. Neither a perfect simulator training score nor combining 100 trees predicts it — same ###. Leaf-size HYPOTHESIS: unpruned/forest trees split to purity (leaves of a handful of payments around frauds), depth-6 trees ≤ 64 leaves for 2.9M payments (~45,000/leaf); on the real training week only DT∞ and RF are perfect (XGBoost is not); the worst-hit models rank first payments in small regions cut around training frauds, rarely fraud again on real data — ### What separates the two ensembles: a hypothesis
- Bounding a two-score model from rounded AUC/AP: T ≥ 2AUC − 1, P₁ − π ≤ (AP − π)/T; real unpruned tree: T ≥ 0.09, P₁ ≤ 0.013 (< 0.02 with AP rounding) vs 0.53 on simulator — ### The unpruned tree falls to chance
- Payment-to-card conversion under the max-score collapse: block ≥ 5,500 payments/day so the 100 cards are a draw from it; compromised card ~3 fraud chances, genuine card ~3.3 payment chances (400k payments / ~120k cards); independent landing + small chances ⇒ factors cancel, card share ≈ payment share (owner's payments only raise it) ⇒ 1–2 cards allowed; measured CP@100 0.017 consistent, at the upper edge, not predicted. Independence fits tiny pure leaves; the clustered extreme (card-share exercise formula) would give < 1 card and contradict — same ###
- RF as an average of memorisers: simulator re-run 48,229 of 58,264 test payments (83%) scored exactly 0, holding 83 of 385 frauds; real AP 0.015 < DT2 0.024 while AUC/CP above; two-score bounds do not apply to graded scores; real PR curves (Ref alert-budget-metrics worldline-pr-floor figure, §what-a-ranking-with-no-information-scores) locate the loss: RF precision ~6%→4% over first 10% recall vs DT2 ~9%, LR 20%→12% (measured); why the top is diluted = the leaf-size hypothesis, untestable without the confidential data; CP gap 0.027 inside weekly spread 0.03–0.07 — ### The forest: an average of memorisers
- Locating an AUC lead: area over FPR ∈ [0, 0.001] ≤ 0.001, so ≤ 0.001 of XGBoost's 0.111 lead over LR is in the reachable strip (derived); mechanism = hypothesis (boosting lifts low-scored frauds, Ref imbalance); CP@100 6 cards/day behind LR ≈ one weekly std — ### XGBoost: a lead where the team never works
- Real depth-2 tree: terminal 30-day fraud rate > 0.075, then card payments today > 13.5 (compromised terminal + burst); leaf counts; no amount split; simulator vs real separability table (58% of frauds at ≥95% vs 4% at 64%; 39% vs 72% left in the big leaf); training AUC 0.64 / AP 0.063 from leaf counts vs test 0.626 / 0.024; one sentence: the leaves measure the overlap the imbalance lesson inferred as a "sign" (no KeyFact) — §What the shallow tree found on real payments
- Attribution table (reversals → cause → how firmly: derived / measured / hypothesis; includes uneven-drop row = leaf-size hypothesis; forest and XGBoost rows split into located (derived/measured) and mechanism (hypothesis)); which model to ship: none from this table (one week, noise, defaults; tuned + four-week-scored real depth-6 tree 0.232 / XGBoost 0.235 vs 0.090 — tuning and longer test period TOGETHER move numbers more than any gap, not separable; no tuned LR number; training times sim LR 1.6 s, DT2 0.08, DT∞ 0.76, RF 2.1, XGB 7.0; real RF/XGB ~100× LR on 20 cores) — §Accounting for every reversal
- Departures: fixed 7-day delay, labels used as unselected, no drift/adversary, one week/defaults/15 inputs, real half not re-runnable (figure departures.svg) — §Where the benchmark departs from deployment

## Notation
- T, F, P₁, π as in delayed-labels-prequential (two-score model). "Memorisers" = models that reach training AUC ≈ 1 (unpruned tree, RF, XGBoost at defaults); of these only the unpruned tree and RF drop most on real data — do not say "memorisers lose most"; on the real training week only DT∞ and RF are perfect. No new symbols. Exercise 4: s (fraud share of a tied block), c (fraud payments per compromised card), q (compromised share of the block's cards).

## Running cases
- Simulator split: train 25–31 Jul 2018, 67,240 / 598; test 8–14 Aug, 58,264 / 385 (0.66%); ~1.1 frauds per compromised card-day; ~40–55 compromised cards/day after known-card removal
- Simulator five-model test AUC/AP/CP@100 as in alert-budget-metrics; training: LR 0.892/0.663/0.419, DT2 0.802/0.586/0.394, DT∞ 1/1/0.576, RF 1/1/0.576, XGB 1/0.995/0.574
- Simulator depth-2 tree training leaves: 66,734/236; 129/127; 144/13; 233/222 (leaf numbering: 1 big, 2 amount, 3 = 9% leaf, 4 = terminal leaf); test leaves 57,968/182, 50/47, 106/19, 140/137
- Real PR-curve readings (first 10% recall): RF ~6%→4%, DT2 ~9% after a spike, LR 20%→12%
- Real: training week 2,858,663 payments / 6,605 frauds (0.23%); test base rate ≈ 0.2%; five models AUC/AP/CP@100: LR 0.788/0.035/0.150, DT2 0.626/0.024/0.077, DT∞ 0.545/0.003/0.017, RF 0.780/0.015/0.104, XGB 0.899/0.035/0.090; random 0.5/0.002/0.0025
- Real depth-2 tree leaves (training): 2,841,713/4,740 (0.17%); 9,230/554 (6.0%); 7,323/1,055 (14.4%); 397/256 (64.5%)
- AP multiples sim → real: LR 92→18, DT2 75→12, DT∞ 47→1.5, RF 100→8, XGB 97→18
- Exercises: CP@100 multiples (real LR 60, RF 42, XGB 36, DT2 31, DT∞ 7; sim 14–17); AUC-strip refutation; scenario-1-only boundary probe (CP@100 ≤ 0.05, NCP 1; memorisation harmless without overlap); card-share formula q = (s/c)/(s/c + 1 − s), leaf 3 → 0.053, leaf 4 → 0.38, CP estimate 0.05–0.09 vs 0.077; savings re-run at C_a = €5 on raw scores (fraud €33,301): LR 67.7% (787 flags), DT2 63.6% (224), DT∞ 68.1% (409, 218 caught), RF 73.5% (573); training-week selection diagnosis (sim: DT∞ 0.243 vs LR 0.291, ~5 cards/day, beyond the 2-card line; real: DT∞ and RF tie perfect on training, so the pick is 0.017 or 0.104 vs LR 0.150, ~13 or ~5 cards/day lost); CP@100 per training second (DT2 3.1, DT∞ 0.32, LR 0.19, RF 0.14, XGB 0.039; DT2 vs XGB ~3 cards/day, just past the 2-card line)

## Assumed
- alert-budget-metrics: the five-model experiment setup (§five-models-scored-on-a-test-week: weeks and counts, 15 inputs, five models, real-stream training counts), AUC/AP/CP@100, floors, tie convention, reachable FPR (< 0.1% real), noise line ~2 cards/day, five-model simulator table and three-rankings figure
- delayed-labels-prequential: split with delay and known-card removal, two-score formulas and the simulator inversion (T ≈ 0.58, P₁ ≈ 0.53), training week cannot choose, prequential depth pick 5 (CP 0.284 four-week)
- imbalance-techniques-revisited: real weekly CP@100 std 0.03–0.07, tuned real depth-6 tree / XGBoost numbers, boosting's implicit minority weighting, AP-multiple "sign" of overlap
- example-dependent-cost: per-payment BMR rule, savings, why savings does not select the model
- canonical-datasets: simulator scenarios, 218.67 explanation
- fraud-detection-system: Belgian stream numbers, model-chosen fast labels; financial-crime-typology: thief spends fast (card history)

## Left open
- Tuning and choosing among tuned models with training cost counted → gbm-model-selection, worldline-model-comparison
- Harness implementing split/AP/CP/savings/correction → cost-aware-evaluation-lab
- How terminal fraud-rate and card-count features are built point-in-time → transaction-aggregates, point-in-time-features
- Drift, adversary, alert-feedback selection → sequences-drift module, adversary module, alert-feedback-selection-bias; trickling labels → label-maturation
