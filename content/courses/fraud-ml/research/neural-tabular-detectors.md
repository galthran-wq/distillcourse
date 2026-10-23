# Feed-forward networks on transaction features — research brief

Lesson: `neural-tabular-detectors` (module: supervised, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Construct and tune a feed-forward network on engineered transaction features and explain what has to be done to make it competitive with a tree ensemble and what it buys that trees cannot
Opening (verbatim, the lesson must start with it): On a table of engineered features, boosted trees usually win and are cheaper to train. Yet banks train neural networks on the same tables. What has to be done to make a feed-forward network competitive on transaction features — scaling, optimiser, stopping, regularisation, categorical inputs — and what does the network buy that the trees cannot?

## Sources to consult
- Handbook Ch7 "Introduction" (the four reasons to train networks when trees win: incremental training, representation learning, federated averaging, diversity for stacking) — `research/texts/reproducible-Chapter_7_DeepLearning_Introduction.md`.
- Handbook Ch7 "Feed-forward neural networks": the neuron and layers, sigmoid output as P(fraud), BCE loss, the training loop (zero_grad / forward / loss / backward / step), model.train vs eval; the first-shot MLP 0.864 / 0.653 / 0.286; the 150-epoch SGD run (851 s, train loss 0.035 → 0.0137, validation ~0.019 and fluctuating); early stopping with patience (checkpoint not saved in the book's version); SGD lr 5e-4 ~251 epochs valid ~0.0218 vs Adam lr 5e-4 stops at epoch 12–13 best valid 0.0180; dropout 0.2 helps, 0.4 hurts; scaling (without it lr must drop to 1e-4 and the result is still worse; log1p for amounts on real data); embeddings of dim k = FC layer on one-hot; terminal-id and weekday embeddings add nothing on the simulator; ensembles for drift; skorch and the prequential grid search of 162 networks × 4 folds in 7,350 s; benchmark NN 0.876±0.01 / 0.675±0.01 / 0.303±0.02 vs oracle 0.878 / 0.683 / 0.304; hyperparameter interactions (batch size vs epochs) — `research/texts/reproducible-Chapter_7_DeepLearning_FeedForwardNeuralNetworks.md`.
- Handbook Ch7 FFNN benchmark summary table: DT 0.797/0.579/0.284, LR 0.868/0.623/0.297, RF 0.870/0.678/0.299, XGB 0.869/0.687/0.303, NN 0.876/0.675/0.303 — same file, end.
- Handbook Ch7 "Real-world data": FFNN 0.894±0.01 / 0.084±0.02 / 0.236 — `research/texts/reproducible-Chapter_7_DeepLearning_RealWorldData.md` (lines ~40–50).
- Baesens Ch4 "Neural networks" (logistic regression as a one-neuron network; one hidden layer suffices; 6–12 hidden neurons typical in fraud; tune on validation; weight decay) — `research/texts/fraudanalyti-s3-ch04a.txt`.
- Jurgovsky 2018 Sec. 4.2 (entity-embedding dimension ⌈log₂|C|⌉, init U[−0.05, 0.05], time split into categoricals) and Sec. 6.1 (dropout for time-stable predictions, L2 beats L1, Adam beats SGD, SGD variants suit online updating) — `research/texts/staged-jurgovsky2018-sequence-classification.txt`.
- Dal Pozzolo 2014 Sec. 7.2.1 (random forest beats NNET) — dossier summary.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has trained an MLP before (prerequisite) and has just seen trees tie or win on the 14 features. The lesson's problem is practical and honest: the first network trained with defaults on the same features scores below XGBoost and takes 14 minutes; each of five decisions (scale, optimiser, stopping, regularise, encode categories) moves it; after all five it ties the ensemble; and the reason to go through it is not accuracy. Terms the newcomer does not have: "early stopping with patience", "entity embedding", "federated averaging", "stacking diversity", "prequential grid search with a wrapper".

### Chain of sub-problems
1. **The network as a detector** — Obvious attempt: an MLP with a softmax over two classes and the default loss. Answer: inputs = the engineered features, ReLU hidden layer, one sigmoid output read as P(fraud), binary cross-entropy; the first shot with no validation use gives 0.864 / 0.653 / 0.286 on the test week. Because: the card precision and the cost rule need a probability, and BCE is the loss whose minimiser is the posterior.
2. **Why it overfits silently** — the 150-epoch SGD run: training loss falls from 0.035 to 0.0137 while validation sits near 0.019 and wanders. Answer: early stopping — stop when the validation loss has not improved for patience + 1 epochs, and keep the best checkpoint (the reference code forgets to). Because: a network of this size can fit any table (universal approximation); the validation loss, on a prequential block, is the only brake.
3. **Why the first layer cares about scale** — Obvious attempt: feed the features as they are, as the trees did. Why it fails: without scaling the learning rate had to drop to 1e-4 to avoid divergence and the result was still worse; the amount is heavy-tailed. Answer: standardise every input; log1p the amount on real data (little gain on the Gaussian simulator). Because: the first layer's gradients are proportional to the inputs, so a feature in the thousands dominates the step; trees compare, networks multiply.
4. **Which optimiser** — SGD at 5e-4 needs about 251 epochs to a validation loss of 0.0218; Adam at the same rate stops at epoch 12–13 at 0.0180. Answer: Adam by default, "without significant tuning". Because: per-parameter step normalisation with momentum crosses the flat, ill-scaled loss of a tabular network in a tenth of the steps.
5. **Regularisation** — dropout 0.2 helps, 0.4 hurts; treat p as a hyperparameter that may be 0; L2 beats L1; dropout also gives predictions that are stable over days. Because: dropout trains a random sub-network per batch, an ensemble in one model, and the simulator's signal is too simple to need much of it.
6. **Categorical inputs** — Obvious attempt: one-hot the terminal id (10,000 columns). Answer: an embedding of dimension k is exactly a linear layer on the one-hot input with k outputs, so it is learned end to end; dimension ⌈log₂|C|⌉ by convention; on the simulator terminal and weekday embeddings add nothing over the aggregates — a null result stated as such. Because: the aggregates already summarise what the id would carry; embeddings earn their place on real data with many entities and raw inputs.
7. **How much tuning costs** — 162 networks × 4 prequential folds = 7,350 s; batch size and epochs interact (a larger batch needs more epochs); the best point differs by metric. Answer: random search or a dedicated tuner; validation-chosen 0.876 / 0.675 / 0.303 against an oracle 0.878 / 0.683 / 0.304. Because: the selection cost of module 4's previous lesson applies with a larger grid.
8. **The verdict and the reason to bother** — benchmark: NN 0.876 / 0.675 / 0.303 vs XGBoost 0.869 / 0.687 / 0.303; on real data FFNN 0.894 / 0.084 / 0.236 vs XGBoost 0.928 / 0.095 / 0.235: a tie on card precision, a loss on AP. Answer: the four reasons — incremental updating (no retrain from scratch, no long-term storage of data the law limits), representation learning from raw sequences (module 7), averaging weights across institutions that cannot share data (federated), diversity for stacking with trees. Because: none of them is accuracy on a static table, and the lesson says so. ★ Starred: skorch's two-output softmax wrapper; the Dataset class that builds histories on the fly; weighted BCE and focal loss as the imbalance levers the chapter does not run.

### Set pieces and worked examples to recreate
- The 150-epoch SGD overfitting curve: train 0.035 → 0.0137, validation ~0.019 fluctuating, 851 s (Handbook Ch7 FFNN).
- SGD vs Adam at lr 5e-4 on a 15-1000-1 net: ~251 epochs to 0.0218 vs 12–13 epochs to 0.0180 (Handbook Ch7 FFNN).
- Scaling ablation: lr forced to 1e-4 without scaling, still worse; log1p on amounts (Handbook Ch7 FFNN).
- Dropout 0.2 vs 0.4; the embedding null result (Handbook Ch7 FFNN).
- Grid cost 7,350 s for 162 networks × 4 folds; validation vs oracle 0.675 vs 0.683 AP (Handbook Ch7 FFNN).
- The benchmark table of five models on the simulator; the real-data FFNN 0.894 / 0.084 / 0.236 (Handbook Ch7 FFNN summary; Ch7 RWD).
- Embedding dimension ⌈log₂|C|⌉, init U[−0.05, 0.05] (Jurgovsky Sec. 4.2); dropout for time-stable predictions, L2 > L1 (Jurgovsky Sec. 6.1).
- Fraud nets with 6–12 hidden neurons; logistic regression as a one-neuron network (Baesens Ch4 pp.145–149).

### Pitfalls and terms to define
- "Early stopping with patience" — define the counter; note the reference implementation's missing checkpoint save as a bug the lesson fixes.
- "Embedding = linear layer on one-hot" is the definition, not an analogy; show the matrix shapes.
- Do not present the FFNN as beating trees; the real-data AP loss is the honest number.
- The 15-1000-1 architecture of the SGD/Adam comparison is deliberately wide; say so.
- "Federated averaging" and "stacking" are named as reasons, not taught.
- model.train() vs model.eval() with dropout: a one-line pitfall.

### Recalled, not re-taught
- MLP, backpropagation, Adam, dropout (prerequisite): recalled by name; the lesson explains only why each matters here.
- Prequential folds and the selection triplet (`delayed-labels-prequential`, `gbm-model-selection`): one clause each.
- The 14 features and the amount's heavy tail (`transaction-aggregates`): one clause.

## FIGURE PLAN
- draw: key image — training vs validation loss per epoch for the 150-epoch SGD run with the early-stopping point marked; single `<Figure>` (computed; inspired by the handbook's loss curves).
- draw: SGD vs Adam side by side on the same net, epochs on the x-axis, the stop epochs 251 and 13 marked; single `<Figure>`.
- draw: `<FigureSequence>` 4 frames: the amount histogram raw → log1p → standardised → the first-layer weight gradients before and after.
- draw: an embedding as a lookup: a one-hot row times a |C| × k matrix equals the row of the table; single `<Figure>` (inspired by the handbook's embedding illustration).
- draw: hyperparameter sensitivity triptych (batch size, epochs, dropout) with validation and test curves and the chosen point; single `<Figure>`.
- draw: the five-model benchmark as grouped bars with error bars, NN beside XGBoost; single `<Figure>`.
- draw: the four reasons as four small panels: incremental update, raw-sequence input, averaged weights across banks, a stack of tree + net; single `<Figure>`.

## EXERCISE PLAN
1. [warm-up] For a 14-100-1 network, count the parameters and the FLOPs per prediction; compare with a depth-6 tree's comparisons.
2. [boundary probe] Set dropout to 0.9 and to 0; predict the validation curve shape from the sub-network picture and verify on the simulator.
3. [claim to refute] "Scaling the inputs changes nothing for the network because the first layer can learn any rescaling." Refute with the learning-rate argument (gradient ∝ input) and the ablation; the step that fails is that it can learn it only with a step size that diverges on the large features.
4. [derivation skipped] Prove that an embedding layer of dimension k followed by a linear layer is equivalent to a linear layer on the one-hot input of rank ≤ k, and state what the rank constraint buys.
5. [research-shaped] Reproduce the SGD vs Adam comparison on the simulator at lr 5e-4 with patience 5; report the stop epochs and the best validation losses.
6. [mixed review] Use the module-2 harness's undersampling correction on a network trained with a balanced sampler and show the calibration before and after (`undersampling-calibration`).
7. FORWARD → `sequence-models-for-transactions`: feed the network the last five raw transactions of the card concatenated as one vector (no aggregates) and compare its AP with the aggregate-fed network — the reader hits the wall that a sequence model with shared weights removes.

## ARC
- Spine step 4 "Supervised detectors compared": "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
- Inherits: the tree baseline and the selection cost (`gbm-model-selection`); prequential folds (`delayed-labels-prequential`); MLP training (prerequisite).
- Contributes: the five decisions that make a tabular network competitive; the embedding identity; the four reasons; the benchmark tie.
- Hands off: the network to `one-class-and-reconstruction` (the autoencoder is its sibling), `sequence-models-for-transactions` (the sequence input), `graph-neural-networks`; the real-data table to `worldline-model-comparison`; incremental updating to `stream-learning-and-adaptation`.
