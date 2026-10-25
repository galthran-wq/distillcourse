# neural-tabular-detectors — ledger

**Problem.** What must be done to make a feed-forward network competitive with
tuned XGBoost (simulator bar 0.869 / 0.687 / 0.303) on the fifteen engineered
inputs, and what does it buy that trees cannot? Answer: sigmoid output +
cross-entropy; early stopping with patience on a validation week (restore the
best weights); Adam; standardised inputs fitted on the training block (log1p
for long tails); dropout searched with epochs; embeddings for categories. Tuned
on prequential folds it ties XGBoost on CP@100 (sim 0.303 vs 0.303; real 0.236
vs 0.235) and trails it below the top on real data (AUC 0.894 vs 0.928, AP
0.084 vs 0.095), at ~6× the wall-clock on 10× the processors (sim). Reasons to
train it, stated as what a network makes cheap or natural beside a tree
ensemble (not what trees cannot do): updating the same weights, learning its
own inputs end to end, weight averaging across banks, a different kind of
mistake for stacking (named, not measured).

## Explained
- Network as detector: hidden ReLU layer a_j = max(0, Σ w_ij x_i + b_j), one sigmoid output read as P(fraud); logistic regression = network with no hidden layer (the scorecard's model, additive, no interactions); hidden units = hinges that can bend the log-odds surface (recalls scorecards-woe last exercise: ratio effect ×265 among ordinary amounts vs ×23 above €201.82) — §A network that outputs a fraud probability / ### One output unit, read as P(fraud)
- BCE; Example: 200 payments / 132 fraud (q 0.66): mean BCE 0.693 at p 0.5, 0.852 at 0.9, 0.641 at 0.66; derivative → minimiser p = q; network estimates P(fraud|x) on the TRAINING distribution (rebalanced → correction needed) — ### Cross-entropy: the loss whose best answer is the fraud share
- First-shot setup (L0g): 15 standardised inputs, 1,000 ReLU units, SGD lr 0.07, batch 64, 150 epochs, trained 25–31 Jul 2018, scored on 8–14 Aug (alert-budget-metrics setup): 0.864 / 0.653 / 0.286 vs LR 0.871/0.606/0.291, RF 0.867/0.658/0.287, XGB 0.862/0.639/0.273; 851 s on a GPU vs ~7 s for default XGBoost — ### The first network on the fifteen inputs
- Epoch = one pass (1,051 batches of 64 on 67,240 rows); loss curves (key image loss-curves.svg): train 0.035 → 0.014, record covers epochs 1–20 and 110–129 of the 150 (~5.7 s/epoch); test-week loss 0.0197 at epoch 10, 0.0194 at 128 (118 epochs, ~11 of the 14 minutes, bought nothing); 17,001 parameters ≈ 28 per training fraud; universal approximation theorem; overfitting is gradual, so epochs is a setting; loss levels on different weeks not comparable (BCE grows with fraud share; test 0.66% vs train 0.89%) — §Fourteen minutes of training, ten epochs of learning / ### What the two curves say
- Watching the test week = tuning on it; validation week in hold-out geometry: train 11–17 Jul, delay 18–24, validate 25–31 Jul — ### A week to watch that is not the test week
- Definition: early stopping with patience P (best epoch b, counter e − b, stop when counter = P + 1, restore weights of b); counter = epochs since best, not consecutive increases; a common implementation forgets to save/restore; why watch loss not CP@100 (smooth, every row vs steps of one card) — ### Stopping when the validation loss stops improving
- SGD lr 0.0005, patience 2: stops after 251 epochs, best 248 ≈ 0.0218; why: output gradient p − y is a few thousandths for most rows on a 99.1%-genuine table (batch of 64 holds ~half a fraud), step = lr × gradient; SGD at 0.07 (first run) reached its level in ~10 epochs → SGD needs lr matched to gradient scale — §Which optimiser: 251 epochs or 13 / ### Plain SGD at a small rate
- Adam recalled (prerequisite) with update formula; m̂/√v̂ ≈ ±1 → each weight moves ~η per step regardless of gradient magnitude; Adam lr 0.0005: best 0.0180 at epoch 10, stop at 13; below SGD's 248-epoch value from epoch 2 (0.0211); SGD's right rate moves with gradient size (fraud share, inputs, stage); Adam's rate still chosen but from a fixed range 1e-4…1e-3, a short list (the one the grid searches) (figure sgd-adam.svg); no KeyFact — ### What Adam changes
- Early stopping on the Adam log (FigureSequence early-stop-1..3; Task); losses 0.02292, 0.02114, 0.02032, 0.02067, 0.01915, 0.01883, 0.02007, 0.01889, 0.01810, 0.01805, 0.01875, 0.01909, 0.01815; in-body exercise: P 0 → stop 4, restore 3 (0.0203); P 1 → stop 8, restore 6 (0.0188); P 2 → stop 13, restore 10 (0.0180) — ### The stopping rule on the Adam run
- Trees invariant to monotone transforms (Ref gbm exercise); input sds on one simulated week 0.05 (terminal fraud rates) to 40.5 (amount), factor ~800 (figure input-scales.svg); ∂L/∂w_ij = δ_j x_i; Example: count 80 vs terminal 7-day rate 0.6 → gradient ratio 133 raw; standardised 0.10 vs 8.9 → 88× the other way; derived for one logistic unit: ∂²BCE/∂w_i² = mean of p(1−p)x_i² → curvature ≈ mean square of x_i (6,800 for 30-day count vs 0.003 for 30-day rate, >10⁶); derived on the local quadratic: a plain step multiplies distance to the minimum by (1 − ηc), so it overshoots when η > 1/c, diverges when |1 − ηc| > 1 i.e. η > 2/c; η < 2/6,800 moves the rate weight ~10⁻⁶ of the way per step → one lr cannot suit both → divergence — §Scaling the inputs: trees compare, networks multiply / ### A step proportional to the input
- Ablation (Adam + dropout, validation week): raw inputs need lr cut 0.0005 → 0.0001 to avoid divergence, losses still noisier/worse. Why Adam does not cure it: it equalises the step in weight space, but a step η on w_ij moves the unit's sum by η x_i (80η vs 0.007η); all weights at once move a raw sum by η × a few hundred vs ~a dozen standardised; at initialisation (weights a few tenths) counts/amounts (positive, tens) set every unit's sum → units with a negative counts-and-amounts part are dead (no gradient), live ones start blind to terminal rates — ### What happened without scaling
- Scaler fitted on training block only (refit per prequential fold; whole-table pitfall Ref transaction-aggregates); standardising fixes spread not shape; log1p for long tails (real amounts); on the simulator log1p over-corrects (skew +1.7 → −0.8; amount-1..2 sequence); form decided on the folds — ### Standardise on the training block; compress a long tail first
- Dropout rate p: zero each unit w.p. p per batch, scale survivors 1/(1−p); random sub-network per batch; full network ≈ average = forest's move inside one set of weights (Ref gbm random forest) — §Dropout / ### Each batch trains a different sub-network
- train/eval flag pitfall (model.train()/model.eval()) — ### Training mode and evaluation mode
- Dropout rate trade-off (mechanism only, no numbers): larger p averages more but each unit gets a fraction 1−p of updates (60% at 0.4) → best rate depends on training length → rate chosen with epochs on validation data, 0 included — ### How much dropout: a setting searched with the epochs
- One-hot width (10,000 terminals × 500 units = 5M weights; ~7 payments per terminal per training week, 67,240/10,000); Definition: embedding (table E, |C| × k, row e_c, trained); identity o_c E = e_c → embedding = bias-free linear layer on one-hot with k outputs; convention k = ⌈log₂|C|⌉ (weekday 3, terminals 14), init U[−0.05, 0.05] (figure embedding.svg, illustrative weekday table); in-body exercise: Thursday row, 147,000 vs 5M parameters, unseen terminal → untrained "unknown" row, blind to new compromises — §Categorical inputs: embeddings
- Null result: terminal id + weekday embeddings (dim 10) add nothing on the simulator: delayed terminal rate = point-in-time target encoding of the terminal id (Ref point-in-time-features), a learned terminal vector = lookup table; weekday: simulator fraud ignores the calendar (weekend IV 0.002, Ref scorecards-woe); embeddings earn their place on real categorical fields and sequence models — ### What the terminal and the weekday added on the simulator: nothing
- Grid: lr {1e-4, 2e-4, 1e-3} × batch {64,128,256} × epochs {10,20,40} × dropout {0,0.2,0.4} × layers {1,2} of 500 = 162, Adam, epochs as a setting (no early stopping inside folds); 7,350 s with 10 parallel fits vs XGBoost 1,251 s single core (≈6× wall-clock, 10× processors) — §What the tuning costs / ### The grid
- Aside: the "two hidden layers" setting kept the extra layer in a plain Python list → unregistered, never trained (fixed random layer); check by counting model.parameters() — same §
- Grid slice evidence (after the grid is set up): lr 0.001, batch 64, 20 epochs: dropout 0.2 better than 0, 0.4 worse (validation and test); AUC/AP picks used 0.4 with 40 epochs → the 20-epoch slice alone would have ruled out the chosen rate — ### Dropout and epochs move together
- Batch size × epochs = number of updates: 1,051 vs 263 updates/epoch at batch 64 vs 256; in-body exercise: 40 epochs @256 = 10,520 updates ≈ 10 @64 (10,510) ≈ 20 @128 (10,520) — ### Batch size and epochs count the same thing
- Triplet: picks AUC 0.001/256/40/0.4, AP 0.001/64/40/0.4, CP 0.0002/64/40/0.2 (rate/batch/epochs/dropout); validation 0.881/0.701/0.288; best-est 0.876±0.01/0.675±0.01/0.303±0.02; optimal 0.878/0.683/0.304; costs 0.002/0.008/0.001; no default row → no gain; random search applies — ### Three numbers for the network
- Benchmark (figure benchmark.svg): sim tuned DT 0.797/0.579/0.284, LR 0.868/0.623/0.297, RF 0.870/0.678/0.299, XGB 0.869/0.687/0.303, NN 0.876/0.675/0.303; real (same geometry as gbm real searches; NN grid 36 candidates: 500 units, dropout 0/0.2, lr 1e-3/1e-4, epochs 5/10/20, batch 64/128/256) DT 0.869/0.068/0.232, LR 0.816/0.054/0.211, RF 0.912/0.080/0.227, XGB 0.928/0.095/0.235, NN 0.894/0.084/0.236; KeyFact; refutation of "the more flexible network should beat trees once tuned" (inputs already the summaries; trees cut strong uneven inputs with one threshold); KeyFact = synthesis (tie at the budget, nothing better, trails below top on real, costs more → accuracy no reason to choose it) — §The verdict / ### A tie on the simulator, a loss below the top on real data
- Four reasons, each what a network makes cheap/natural vs a tree ensemble (figure four-reasons.svg): updating the same model (boosting can append trees fitted on the newest day but old splits stay and the ensemble grows; network continues gradient steps on the same weights, same size; either avoids rereading months of raw payments, data-protection law); learning its own inputs end to end (gradient reaches raw fields; a hard split passes no gradient back, so before trees the summary is built separately); federated averaging (same-architecture weights average into a network; averaged split thresholds are not a tree; federated boosting exists but banks exchange split statistics while each tree is grown); a partner unlike the trees (tree ensembles on the same inputs cut on the same strong inputs; a network is a likelier source of different mistakes); none measured — ### Four things that come naturally to a network
- ★ Weighted BCE (= class weight), balanced sampler (= batchwise undersampling, needs β correction), focal loss (1 − p_t)^γ; none run; two-output softmax wrappers (skorch) ≡ one sigmoid on z₁ − z₀ — §★ Imbalance levers inside the loss

## Notation
- x_i inputs (15), w_ij, b_j first-layer weights/biases, a_j hidden ReLU outputs, h hidden units, σ sigmoid, z weighted sum
- BCE(y, p); q fraud share of a group
- e epoch, V_e validation loss, b best epoch, P patience
- m_t, v_t, m̂_t, v̂_t, η, ε (Adam); δ_j derivative of loss w.r.t. unit j's weighted sum (NOT the label delay δ — written δ_j with subscript only here)
- p dropout rate (dropout section only; elsewhere p = probability)
- C value set, |C|, k embedding dimension, E table, e_c row, o_c one-hot row; M = EW (exercise)
- ω fraud weight, p_t, γ (★ only)

## Running cases
- Simulator training week 25–31 Jul 2018 (67,240 / 598), test 8–14 Aug (0.66% after removal); hold-out training 11–17 Jul, validation 25–31 Jul
- First run 15-1000-1 SGD 0.07: test 0.864/0.653/0.286; 851 s GPU; loss logs epochs 1–20 and 110–129
- SGD vs Adam at 0.0005 on 15-1000-1: 251 epochs/≈0.0218 vs 13 epochs/0.0180 (best at 10)
- Input stats on one simulated week (lab holdout week, 58,957 payments): sds above; means count30 77.0, terminal 7-day rate 0.007; amount skew +1.7, log1p −0.8
- Grid and benchmark numbers as above
- Exercises: per-prediction cost (15-500-1: 8,501 params, 8,000 MACs; +second layer 259,001 params, ~258,000 MACs; depth-6 tree 6 comparisons; XGB 100×depth 3: 300); dropout edges p 0.9 / p 0 for 200 epochs; refute "scaling cannot matter" (representable ≠ learnable at one lr); embedding + linear = rank ≤ k one-hot layer, 147,000 vs 5M; stacking backtest design (overlap, rank averaging, λ chosen on folds, paired weekly differences, ~0.02 needed with 4 weeks); balanced sampler β = 598/66,642 ≈ 0.009, p_s 0.5 → 0.0089, 0.95 → 0.146, €200 at C_a €5 cut 0.025, ranking unchanged; forward: last five raw payments concatenated (500 weights per slot, no weight sharing, padding) → sequence models

## Assumed
- Prerequisite: MLP, backpropagation, Adam, dropout (recalled, Adam formula restated)
- gbm-model-selection: XGBoost bar, triplet (three-test-numbers-for-one-model-class), forest averaging, random search, real-stream searches and geometry, tree invariance exercise, 1,251 s
- alert-budget-metrics: five-model setup and single-week baselines, CP@100, noise line
- delayed-labels-prequential: test week cannot choose, hold-out validation geometry, fully grown tree memorises
- scorecards-woe: logistic regression as the card's model, top amount bin 200/132, interaction exercise, weekend IV 0.002
- example-dependent-cost: cost rule C_a ≤ Amt·p; undersampling-calibration: β correction, bias ≈ 1/β below the peak
- transaction-aggregates: identifier lookup table, whole-table pitfall; point-in-time-features: delayed terminal rate = target encoding
- imbalance-techniques-revisited: remedies move the boundary, mildest rebalancing best; ulb-handbook-benchmark: default training times; fraud-detection-system: nightly retrain

## Left open
- Eight-model real-data comparison incl. CNN/LSTM/attention → worldline-model-comparison (conclusion hand-off)
- Raw sequences, weight sharing over positions → sequence-models-for-transactions (forward exercise)
- Incremental updating under drift → stream-learning-and-adaptation
- Autoencoder (sibling network) → one-class-and-reconstruction; GNNs → graph-neural-networks
- Storage limits on raw history → gdpr-financial-crime-data (named only as "data-protection law")
- Not run/taught: weighted BCE, focal loss, balanced samplers on the simulator; federated averaging and stacking not measured; ensembles of networks for drift not taught; batch normalisation, LR schedules not taught
