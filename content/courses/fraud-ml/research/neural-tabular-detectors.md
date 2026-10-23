# Feed-forward networks on transaction features — research brief

Lesson: `neural-tabular-detectors` (module: supervised, core, planned). NEW. Also the course's anchor for neural-network vocabulary (course-level prerequisite says "having trained one"; this lesson re-anchors MLP, BCE, Adam, dropout in two paragraphs each and no more).
Goal: Construct and tune a feed-forward network on engineered transaction features and explain when a network earns its place against a tree ensemble that already wins.

## Sources
- Handbook Ch7.1 (primary): why NNs despite trees winning on static tabular data — incremental training (less compute, no long-term storage / regulation), representation learning replacing manual aggregates, federated averaging of same-architecture weights, diversity for stacking.
- Handbook Ch7 FFNN (primary): architecture (engineered features → ReLU hidden → one sigmoid = P(fraud)); BCE loss; the training loop (zero_grad / forward / loss / backward / step; train vs eval for dropout); the overfitting set piece (SGD lr 0.07, 150 epochs, 851 s: train loss 0.035 → 0.0137 while validation sits ~0.019 and fluctuates); first-shot MLP 0.864/0.653/0.286; early stopping with patience (best checkpoint not saved in the book's version); SGD lr 5e-4 ~250 epochs (valid ~0.0218) vs Adam lr 5e-4 stops at epoch 12 with 0.0180; dropout as Bernoulli masks (L2-like and bagging-like), p a hyperparameter that may be 0; scaling (trees invariant, first-layer neurons not; standard scaling smoother and faster; log1p for heavy-tailed amount; without scaling lr had to drop to 1e-4 and was still worse); embeddings (dim k = FC on one-hot; inspectable; terminal id + weekday added NOTHING over aggregates on the simulator); ensembles for drift (components specialising on recent vs old); skorch wrapper (2-output softmax; array dataset); grid 162 nets × 4 folds = 7,350 s → random search; optimal hyperparameters depend on the metric; larger batch needs more epochs; dropout 0.2 helps, 0.4 hurts; benchmark NN 0.876/0.675/0.303 vs XGB 0.869/0.687/0.303, RF 0.870/0.678/0.299, LR 0.868/0.623/0.297, DT 0.797/0.579/0.284; validation-choice vs oracle (AP 0.675 vs 0.683, CP@100 0.303 vs 0.304); imbalance for NNs not run (weighted BCE, focal loss, balanced sampler).
- Handbook Ch7.5 RWD: FFNN 0.894/0.084/0.236 vs XGB 0.928/0.095/0.235 — wins nothing, ties CP@100.
- Jurgovsky Sec. 4.2: entity embeddings d = ⌈log₂|C|⌉, init U[−0.05, 0.05]; time as year/month/weekday/day/hour/minute/second categoricals; Sec. 4.3: 2-layer LSTM + logistic output, dropout, Adam, Keras; Sec. 6.1: validation right after training favours low regularisation but hurts later days; dropout gives time-stable predictions; LSTM overfits easily — start small; L2 > L1; Adam > SGD; SGD variants suit online updating.
- Baesens Ch4 pp.144–149: logistic regression is a one-neuron network; one hidden layer suffices (universal approximation); fraud nets typically 6–12 hidden neurons; weight decay; pp.150–155 opening the black box (forward to alert-explanations).
- Dal Pozzolo 2014: NNET loses to RF (Sec. 7.2.1). APATE: NN 0.974 vs RF 0.986.
- HKU A2 and CS6890 PS4 (lab canon for module 5): the numpy autoencoder will reuse this lesson's forward/backward.

## Key points
1. The honest frame first: on the simulator the net ties XGBoost (wins AUC by 0.007, loses AP by 0.012, ties CP@100); on real data it loses AUC and AP and ties CP@100. The four reasons to train one anyway are operational, not accuracy — state them and which later lessons use each (incremental → concept-drift; representation → sequence models; federated → eu-transaction-monitoring-design's cross-bank note; diversity → arms-race-replay's ensembles).
2. The model and the loop in two paragraphs: MLP 15-1000-1 (the handbook's), sigmoid output as P(fraud), BCE; the five-line loop; train/eval modes.
3. The overfitting set piece with numbers; early stopping with patience as the fix; the checkpoint bug in the book's version (save the best).
4. Optimiser and scaling: SGD 251 epochs vs Adam 13 to a better minimum; scaling as a necessity for the first layer (trees don't care); log1p for amount; the lr-had-to-drop ablation.
5. Regularisation and interaction of hyperparameters: dropout 0.2 vs 0.4; batch × epochs; metric-dependent optima; the 7,350 s grid and random search (reinforce gbm-model-selection).
6. Embeddings: definition (k-dim lookup = FC on one-hot), the dimension convention, inspectability; the null result on the simulator and the reason (aggregates already carry the terminal's history); when embeddings should pay (lots of real data, high-cardinality merchants).
7. ★ Starred: NN ensembles for drift (components on recent vs old); imbalance variants for BCE (weighted, focal) stated not run; skorch plumbing.

## Set pieces & gems
- Train 0.035 → 0.0137 while validation sits at 0.019 — the overfitting curve.
- 251 vs 13 epochs (SGD vs Adam), 0.0218 vs 0.0180.
- "Without scaling lr had to drop to 1e-4 to avoid divergence, yet still worse."
- Terminal-id + weekday embeddings: nothing over aggregates.
- 162 networks × 4 folds = 7,350 s.
- The four operational reasons (Ch7.1) — the lesson's thesis.

## Pitfalls
- The audience has trained an MLP; two paragraphs of recall, no backprop derivation (module 5's lab referees gradients by finite differences).
- Keep AUC/AP/CP@100 triples exact; do not round the net into a win.
- No sequence models here (module 7); embeddings only as tabular inputs.

## FIGURE PLAN
- draw: Train vs validation loss per epoch for the SGD run (10-epoch moving average) with the divergence after epoch ~40 marked; beside it the Adam run stopping at 13 — two panels joined by an arrow (voita rule 8). Computed on our simulator run; inspired by Handbook Ch7 FFNN figures. Key image.
- draw: The 15-1000-1 network as a tiered diagram (data → scaled features → hidden layer → sigmoid → P(fraud)) with BCE dissected under the output (voita rules 5, 7).
- draw: `<FigureSequence>` (3 frames): raw TX_AMOUNT histogram → log1p → standardised; the first-layer weight's gradient magnitude annotated per frame. Inspired by Ch7's amount histograms.
- draw: Dropout as a thinned network: full network vs one Bernoulli-masked sub-network, two near-identical panels with dropped units greyed (inspired by Srivastava's figure as described in Ch7, redrawn).
- draw: Embedding = lookup table: an index → row of a k × |C| matrix → concatenated with numeric features; beside it the equivalent one-hot × FC product (voita rule 9 cell grid).
- draw: The benchmark table as a dot plot per metric for DT, LR, RF, XGB, NN with the ±2σ band — the "tie" made visible. From Ch7 FFNN benchmark.

## EXERCISE PLAN
1. Warm-up: count the parameters of 15-1000-1 and of 15-100-20-100-15 (next module's autoencoder); state the compute per forward pass in multiply-adds.
2. Derivation the lesson skipped: show that an embedding layer of dimension k on a categorical with |C| values is exactly a linear layer on the one-hot input with a k × |C| weight matrix, and that its gradient updates only the row of the observed value.
3. Boundary probe: dropout p → 1 and p = 0 — what the network computes at train and at eval time in each case; why the handbook treats p as a hyperparameter that may be 0.
4. Claim to refute: "Trees are scale-invariant and the net is not, so standardising the inputs only matters for the net's speed, not its optimum." Refute with the lr-had-to-drop ablation: scaling changed the reachable optimum under a fixed budget; name the mechanism (conditioning of the first-layer gradient).
5. Research-shaped: on the simulator, reproduce SGD-vs-Adam with early stopping (patience 3) on the 14 features; report epochs to stop and best validation loss for each; compare with 251 / 13.
6. FORWARD (E7): train the same MLP with the output sigmoid removed and the hidden layer forced to 2 units, then plot the 2-D hidden codes of genuine vs fraud transactions — the reader sees a learned representation separate classes with no handcrafted aggregates and asks what a network trained with no labels would learn → lands on `one-class-and-reconstruction`'s autoencoder bottleneck.
7. Mixed review (E3): place the 7,350 s grid in the random-search arithmetic of gbm-model-selection and state how many random draws would cover each important hyperparameter at 10 distinct values.

## ARC
- Inherits: features (module 3), selection and random search (gbm-model-selection), the harness.
- Contributes: the third supervised detector and the NN vocabulary the course reuses — early stopping, Adam, scaling, dropout, embeddings — with the honest benchmark.
- Hands off: the autoencoder (one-class-and-reconstruction), sequence nets (sequence-models-for-transactions), GCN layers (graph-neural-networks), the eight-model table (worldline-model-comparison).
- Spine step 4: supervised detectors compared.
