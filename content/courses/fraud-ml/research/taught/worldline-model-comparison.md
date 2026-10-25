# worldline-model-comparison — ledger

**Problem.** Eight families (tuned DT, LR, RF, XGBoost, feed-forward net, CNN,
LSTM, LSTM + attention) on the same real Belgian e-commerce weeks, same
fifteen inputs, same four prequential folds and four forward test weeks:
three metrics, three leaders (XGBoost AUC 0.928, attention-LSTM AP 0.105,
feed-forward net CP@100 0.236). What produced each? Answer: under the
one-std rule no top place belongs to one family (AUC: two ensembles; AP: band
of five; CP@100: all eight inside 2.5 cards/day vs weekly std 3–7 cards); the
only leader clear of a whole class is XGBoost in AUC, a lead below the
hundredth card; weekly CP spread is 2–4× the binomial sampling floor because
weeks differ; the folds' choice of candidate within a family moves CP@100 as
much as the choice of family; the sequence nets' AP gain at flat CP@100 has
two readings; tied models catch different frauds → combine and measure, not
crown.

NOTE (syllabus): the course.yaml `opening` says "the random forest, the
attention-LSTM and a depth-six tree each top one of the three leaderboards";
the source table contradicts it (AUC: XGBoost; CP@100: feed-forward net,
XGBoost 0.235, tree 0.232). The lesson opens with a corrected sentence
(validate warns `opening-first`); the course.yaml opening needs the human's fix
(replace with lesson.mdx line 1 verbatim). key_ideas also stale: the real
single-tree test AP peaks at depth 6, not 4–5. Both still open after the QA
revision: course.yaml `opening`/`key_ideas` are outside what an agent may edit.

## Explained
- Why one referee: different studies change data, split and metric at once — §One stream, one referee, eight grids
- What is held fixed: Belgian stream (~400k/day, ~1,000 frauds, >300 compromised cards), fifteen inputs, four prequential folds + four forward test weeks, mean ± std across test weeks — ### What is held fixed
- Sequence rows named, not explained (one line each): input = the fifteen numbers of each of the card's last few payments incl. current, in time order (five on the simulator); 1D CNN = one small set of weights slid over neighbouring payments; LSTM = reads oldest first, state vector carried, final state → hidden layer → sigmoid; attention = learned weights over the states after every payment — ### Three rows that read the card's past (anchor three-rows-that-read-the-cards-past)
- Grid sizes per family (DT 11, LR 4, RF 12, XGB 18, every network 36 on real: rate 0.001/0.0001 × batch 64/128/256 × epochs 5/10/20 × dropout 0/0.2) — ### The grids each family got
- The eight-row table (below) — same §
- One-std rule applied with the larger std of the pair (test-week stds; the stricter test, so a quiet-spread family cannot be called ahead of a noisy one): AUC XGB clear of every network (gap ≥ 0.030 vs std ≤ 0.01), RF not separated from XGB nor from the two best networks; AP attention not separated from LSTM, XGB, CNN, RF (std 0.03), separated by 0.001 from FFNN, clearly from DT/LR; CP@100 none separated; only leader clear of a whole class = XGB in AUC, below the hundredth card — §Three leaderboards from one table (### per metric); KeyFact: CP@100, the column the deployment rule says should decide, is the one where the experiment decides nothing; the separating columns read far past card 100
- Sampling floor of a week's CP@100: X/700 binomial, sd = √(p(1−p)/700) = 0.016 at p = 0.23 (1.6 cards/day); measured 0.03–0.07 = 2–4× → weeks differ — §How much four weeks move by themselves, ### The sampling floor (Example)
- In-body exercise: simulator floor at p = 0.30 is 0.017 vs measured stds 0.01–0.02 → simulator weeks differ only by chance (same scripts every week) — same §
- What makes weeks differ: 200–370 unfound compromised cards/day, easy cases vary week to week, a rich week lifts every model; shown on ten months of European online payments (Aug 2014–May 2015) scored daily by three random-forest detectors (static / retrained daily / retrained with investigators' findings): daily CP of all three peaked Feb 2015 (most compromised cards), sank Oct 2014 (fewest); paired comparison cancels the shared week (sized in gbm exercises: σ_d 0.02 → 0.003 needs ~180 weeks, 0.02 needs ~4) — ### What makes one week unlike another
- History comparison FFNN vs LSTM (same current-payment inputs + previous payments): AP 0.084 → 0.104/0.105 (CNN 0.093); by the rule LSTM gap 0.020 < std 0.03 not separated, attention gap 0.021 clears std 0.02 by 0.001 (matches AP leaderboard §); all three same side; AUC/CP flat. Simulator reversal: FFNN 0.675, LSTM 0.665, attention 0.667, CNN 0.599 → no gain (scripts live in the aggregates); which property of real fraud → sequence-models-for-transactions — §What the card's history adds, and where it shows / ### One comparison that changes one thing
- AP up / CP@100 flat, two readings: (1) later payments of cards already near the top rise (payment-level AP credits each, card counted once; ~3 frauds/card/day); (2) a card just below the cut rises; neither adds a card to today's hundred; KeyFact: payment-level AP cannot tell the readings apart (frames 2 and 3 both 0.77), only card-counting quantities (card-level AP, CP at a larger budget) can — measured in Exercise 3; toy FigureSequence readings-1..3 — ### Average precision up, card precision flat: two readings
- Validation leaderboard ≠ test: validation CP spread 0.171–0.261 (9 cards) → test 0.211–0.236; XGB's fold lead over FFNN 0.043 > fold std 0.04 vanished; fold spread a floor on uncertainty — §What the search found, and what it missed / ### The leaderboard the bank sees on deployment day
- Hindsight (optimal) CP@100 order and cost of selecting table; costs CNN 0.024, LSTM 0.020, attention 0.015, XGB 0.014, others ≈ 0; KeyFact: within-family pick moves CP@100 up to 2.4 cards/day vs whole field 2.5 → ranking of families at the budget = ranking of lucky picks — ### Hindsight: the cost of selecting is as large as the field
- Real-data single-week depth sweep (defaults, baseline weeks): test AP peak 0.049 and CP 0.196 at depth 6, AUC 0.838 at depth 8, collapse to 0.003 / 0.017 at depth 50; training keeps rising → tree grid brackets its optimum; LSTM's three fold picks (one per metric) all at 5 epochs; fold and test scores traced against epochs at the extreme rate/batch pairs (0.001/64 vs 0.0001/256): slow pair higher, best at 5 epochs = slow corner = one dimension (amount of training) → sequence rows are lower bounds — ### A grid that brackets its optimum, and one that stops at its edge
- Compute: real times only for DT/LR/RF/XGB (Ref gbm); networks' real grids untimed; simulator (10 parallel fits) FFNN 162 cand ~2 h, LSTM 162 4.1 h, attention 162 4.6 h, CNN 216 7.5 h; per candidate 2–3× FFNN; XGB 18 cand 21 min one core; compute bought no card at the budget, bought the AP-band top place (measured either way), worth cards only under reading 2 if the budget grows — ### What the compute bought
- Jaccard J = s/(2n − s) ⇔ s/n = 2J/(1+J); 2015 European processor stream (Mar–Apr train, May test, cut at recall 0.2): RF vs LSTM e-commerce J 0.35 → 52% shared, face-to-face 0.25 → 40%; two RFs 0.475 → 64%, two LSTMs 0.508 → 67% — §Models that tie do not catch the same frauds / ### Measuring the overlap
- Combine, not crown: a 100-card list chosen from the two top-100 lists finds at most the union of their catches; rank averaging is not bound by that (can promote cards both rank just below the cut, demote cards only one ranks high), so the overlap does not settle its gain; rank averaging tested by the network lesson's backtest design; natural pair XGB + LSTM; not measured here — ### What the overlap means for the eight families
- Departures table: labels as finally known (delay only in split; no alert-selected labels), one summer's four weeks, e-commerce only, fifteen inputs (no categoricals), unequal/edge-bound grids and untimed network searches, one refit per test week — §Where this experiment departs from the bank

## Notation
- No new symbols beyond: X (compromised cards among a week's 700 card places), p (per-place probability) in the floor Example; J (Jaccard index), n, s (set size, shared elements). CP@k, AP, AUC, γ_t as before.

## Running cases
- Real-stream eight-row table, AUC / AP / CP@100 (± test-week std): DT 0.869±0.03 / 0.068±0.01 / 0.232±0.04; LR 0.816±0.02 / 0.054±0.01 / 0.211±0.03; RF 0.912±0.02 / 0.080±0.03 / 0.227±0.05; XGB 0.928±0.01 / 0.095±0.03 / 0.235±0.07; FFNN 0.894±0.01 / 0.084±0.02 / 0.236±0.04; CNN 0.882±0.01 / 0.093±0.02 / 0.221±0.03; LSTM 0.892±0.00 / 0.104±0.03 / 0.220±0.03; attention 0.898±0.01 / 0.105±0.02 / 0.232±0.03
- Validation CP@100 of the CP picks: DT 0.214, LR 0.171, RF 0.258, XGB 0.261, FFNN 0.218, CNN 0.227, LSTM 0.238, attention 0.243
- Optimal (hindsight) test CP@100: DT 0.232, LR 0.212, RF 0.227, XGB 0.249, FFNN 0.236, CNN 0.245, LSTM 0.240, attention 0.247; optimal AP: CNN 0.103, LSTM 0.110, attention 0.113 (not in body)
- Simulator eight-row AUC / AP / CP@100: DT 0.797/0.579/0.284, LR 0.868/0.623/0.297, RF 0.870/0.678/0.299, XGB 0.869/0.687/0.303, FFNN 0.876/0.675/0.303, CNN 0.872/0.599/0.288, LSTM 0.876/0.665/0.297, attention 0.874/0.667/0.295 (only AP and the three CPs quoted in body)
- Real single-week depth sweep (depths 2,3,4,5,6,7,8,9,10,20,50): test AUC .626 .715 .755 .791 .812 .826 .838 .831 .831 .520 .545; test AP .024 .032 .037 .045 .049 .029 .020 .020 .018 .008 .003; test CP .077 .134 .149 .187 .196 .114 .070 .049 .056 .014 .017; training AP to d9 .063→.282, training CP to d9 .147→.500
- Toy day (readings): 12 payments, cards A–J, frauds A×2, C×2, G×2; budget 3 cards; AP 0.63 → 0.77 (both readings), CP@3 0.67 throughout; card-level AP 0.698 / 0.698 / 0.806, CP@4 0.50 / 0.50 / 0.75 (exercise 3)
- Exercises: CP@1000 ceiling γ_t/1000 = 0.20–0.37 binds, floor ≈ 0.004; k = all cards → ≈ 0.0025 for every model (~120,000 cards/day assumption); attention-is-best refutation; reading-1-vs-2 design (card-level AP, CP@k for k > 100, paired weekly differences); Jaccard union 46/(1+J) = 46 / 34.1 / 23, union of two lists 111–188 cards, precision 0.18–0.31, budget-100 ceiling 34 binds only a list drawn from the two lists, rank averaging can land above 34 or below 23; scorecard via LR row: 2.5 cards/day, €900/day ≈ €330k/yr at V = €360, not separated; below the top AUC 0.816 vs 0.928, AP 0.054 vs ~0.1; grid extension along "amount of training" (2–3 epochs, batch 512, rates 5e-5, 2e-5) by random draws, dropout kept at 0/0.2 (two levels are both edges; not on the training-amount dimension; LSTM picks used 0.2 for AUC/AP, 0 for CP@100); forward: card-present vs e-commerce sequences

## Assumed
- gbm-model-selection: the four real searches and their table, triplet (default/best-estimated/optimal), AUC lead below the hundredth card (where-the-classes-differ-and-where-they-do-not), the 50-tree miss and validation class gap (the-fifty-trees-the-folds-did-not-find), real grid times on 40 cores (what-the-compute-buys), paired-difference exercise, random search
- neural-tabular-detectors: FFNN real result and grid, batch × epochs = amount of training, embedding null result, concatenation forward exercise, overlap/stacking backtest exercise, simulator benchmark (three-numbers-for-the-network)
- delayed-labels-prequential: prequential folds, one-std decision rule, fold spread a floor
- alert-budget-metrics: five-model setup (real half), 200–370 compromised cards/day, cards fill up to three payment slots, three-metric rule, ceiling min(1, γ_t/k)
- ulb-handbook-benchmark: simulator two leaves, unpruned tree falls to chance
- canonical-datasets: scripted frauds (exercise); fraud-detection-system: Belgian stream, fast labels chosen by the model, ~120,000 cards/day assumption
- scorecards-woe (exercise 5): card ≈ LR on CP@100, AP loss from one-direction merge; example-dependent-cost: expected-loss queue

## Left open
- What an LSTM/CNN/attention computes, and when order carries signal (card-present vs e-commerce) → sequence-models-for-transactions (forward exercise)
- Which reading (1 or 2) holds on the real weeks: designed in exercise 3, not measured
- Whether XGB and an LSTM catch different cards on this stream; the rank-averaging backtest → not run (network lesson's exercise design)
- Labels selected by the model's own alerts → alert-feedback-selection-bias; leaderboards over months of drift → drift-strategies-on-worldline
- Scorecard vs boosted tree in money → scorecard-vs-gbm-lab
- Not used: the feedback-vs-ideal classifier ranking contrast (top-k vs global ranker) — belongs to alert-feedback-selection-bias; the brief's sourced PR-curve image (already in alert-budget-metrics)
