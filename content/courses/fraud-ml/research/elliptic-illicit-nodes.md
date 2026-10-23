# Illicit-node classification on the Elliptic Bitcoin graph — research brief

Lesson: `elliptic-illicit-nodes` (module: graphs, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. Module-final APPLICATION lesson.
Goal: Evaluate the Elliptic benchmark — random forest, MLP, GCN, Skip-GCN, EvolveGCN on 49 time steps — and explain the collapse of every model at the dark-market shutdown
Opening (verbatim, the lesson must start with it): On 203,769 Bitcoin transactions, 2% labelled illicit, a random forest on the given features beats a two-layer graph network, every model's overall F1 sits above 0.93, and at the 43rd fortnight all of them fall to zero. What in the dataset, the features and the time split produces each of those three facts?

## Sources to consult
- Weber et al. 2019 — Sec. 1–1.1 (AML framing, >90% industry false-positive rates, know-your-customer's-customer), Sec. 2.1.1–2.1.3 (203,769 nodes, 234,355 edges, 4,545 illicit (2%), 42,019 licit (21%), the rest unlabelled; 166 features = 94 local + 72 one-hop aggregates; 49 time steps of ≈2 weeks, no cross-step edges, each a connected component confirmed within < 3 hours; Fig. 1 class balance per step), Sec. 2.2 (label heuristics; address clustering; mixers ignored), Sec. 3 (task framing, RF for accuracy and LR for explainability), Sec. 4 (temporal 70:30 split, steps 1–34 train / 35–49 test; Table 1 full grid; Table 2 EvolveGCN; Fig. 2 per-step illicit F1 and the step-43 collapse; even RF retrained up to T−1 with ground truth does not recover), Sec. 5 (why RF wins; hybrid ideas), Sec. 6 (Chronograph, UMAP) — research/texts/antimoney-.txt (the staged txt's reference list ends at [9]).
- Altman et al. 2023 Sec. 1, 3.1, 7 (real AML labels radically incomplete; card fraud's customer feedback vs laundering's absence of ground truth; temporal 60-20-20 split with growing snapshots; account ids excluded as features) — research/texts/realisticsyn-.txt.
- Handbook Ch4 (why accuracy and micro-averaged metrics fail under imbalance) — reproducible-Chapter_4_PerformanceMetrics_ThresholdBased.md (Ref only).
- Dal Pozzolo 2018 Sec. VI-D (synthetic abrupt drift: juxtapose two months, CP_k loss) — research/texts/creditcard-tnnls.txt (forward pointer to module 7).

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has the module's four tools (features, components, walk, GCN) and one real public graph on which they have all been compared: a published benchmark of Bitcoin transactions labelled licit, illicit or unknown over 49 fortnights. Three facts in the opening look contradictory to a newcomer: a learned graph model loses to a forest on fixed features; every model looks near-perfect on the standard F1; and every model stops working at one point in time, including a forest retrained with perfect hindsight. What the newcomer lacks is not a new method but the reading: what the features are (and that 72 of them already summarise the graph), what micro-F1 averages over, what the time split means when the test steps are disconnected graphs, and what a dark-market shutdown does to p(y | x).

### Chain of sub-problems
1. **The artifact.** — 203,769 transaction nodes, 234,355 directed edges (BTC flow), 2% illicit, 21% licit, 77% unlabelled; 166 features: 94 local (time step, inputs/outputs, fee, volumes, average counts) and 72 aggregated one-hop statistics (max, min, std, correlation of neighbours' local features) — note that the time step is itself feature 1; 49 steps, each a connected component of transactions confirmed within three hours, with *no edges between steps*. Labels from a heuristic entity categorisation (exchanges licit, dark markets illicit; mixers ignored). Because: every result below follows from these four facts.
2. **Why the forest beats the GCN.** — The 72 aggregates are already a one-hop message passing with fixed max/min/std/corr aggregators; the GCN's learned aggregation starts from them and adds a degree-normalised mean; its output layer is a logistic regression; a forest is an ensemble of thresholds that exploits the tabular aggregates directly. Table 1: RF(AF) 0.956 / 0.670 / 0.788 vs GCN 0.812 / 0.512 / 0.628 vs Skip-GCN 0.705; aggregates help every model (AF > LF); GCN embeddings concatenated help LR and RF a little (RF(AF+NE) 0.796). Because: Skip-GCN > GCN says the inputs were already informative — the graph's signal had been hand-extracted, which is lesson 5's "when it does not win".
3. **Why every model looks near-perfect.** — Micro-averaged F1 0.93–0.98 beside illicit F1 0.45–0.80: micro-F1 counts every node and the 98% licit majority dominates it; the paper reports illicit-class precision / recall / F1 as primary. Because: this is module 2's accuracy trap in a graph setting — the lesson computes both for the all-licit predictor (exercise 6 of lesson 5) and reads the gap.
4. **What the time split tests.** — Train on steps 1–34, test on 35–49; the test graphs share no edge with training; so the GCN is trained inductively and every model is tested on the future. Because: a random node split would leak the future and let a GCN read labels across the split; the module's temporal rule from module 2 applies to graphs.
5. **The collapse at step 43.** — Fig. 2: illicit F1 per test step for RF, GCN, Skip-GCN, EvolveGCN; at step 43 all fall to near zero; a dark market closed; even an RF retrained after every test step with ground truth does not recover reliably. Read it with the module-7 vocabulary in advance: the illicit population changed — p(y | x) moved — and no amount of graph or retraining on old labels helps when the new illicit transactions look like nothing before. Because: the benchmark's own authors name robustness to emerging events the open challenge; the course's answer is the next module.
6. **EvolveGCN and what time buys.** — GCN weights evolved by a GRU across steps: 0.720 vs 0.705 — consistent, small. Because: temporal weight evolution cannot see a market that did not exist in training.
7. **What this graph cannot test.** — Labels from entity heuristics, not investigations; most Bitcoin transactions unlabelled, and real laundering labels radically incomplete; no customer, no card, no delay block, no alert budget — the AML contrast with card fraud (customer feedback gives near ground truth for cards; nothing equivalent for laundering). Because: an application lesson names the departures.
8. **How do we know it works.** — The closing reading: on this graph the module's cheapest tool (hand aggregates + forest) wins, the walk's exposure would be one more column, and the GCN is the right tool when aggregates are not designed — and all of them are blind to the event that matters most.

### Set pieces and worked examples to recreate
- The dataset card: 203,769 / 234,355 / 2% / 21% / 166 = 94 + 72 / 49 steps, no cross-step edges (Weber Sec. 2.1).
- Table 1's full grid LR / RF / MLP × AF / LF / +NE and GCN / Skip-GCN; Table 2 EvolveGCN 0.720 vs 0.705 (Weber Sec. 4).
- Micro-F1 0.96–0.98 vs illicit F1 0.45–0.80 (Weber Table 1).
- Fig. 2: per-step illicit F1 with the step-43 collapse and the RF retrained to T−1 (Weber Sec. 4).
- Hyperparameters: RF 50 trees / 50 max features; GCN 2 layers, 100 units, 1,000 epochs, Adam 0.001, weighted CE 0.3/0.7 (Weber Sec. 4).
- The scale: full Bitcoin ≈438M nodes / 1.1B edges vs 203k (Weber Sec. 2.2).
- Industry AML false-positive rates above 90% as the motivating cost (Weber Sec. 3).
- Card fraud vs AML ground truth (Altman Sec. 7).

### Pitfalls and terms to define
- "Illicit F1" vs "micro-F1" — define both before quoting any number; the newcomer reads 0.97 as the model's quality.
- "Time step" here is a disconnected graph, not a day of a continuous stream — say so; the module-7 drift vocabulary (p(y|x) change) is used once in advance with a Ref forward, not defined here.
- The time step is a feature (feature 1): a model can learn "late steps are more licit"; name the leak risk.
- Labels are heuristic (entity categories), not investigations; "illicit" is a category of the counterparty, not a confirmed crime.
- The staged text's reference list is truncated at [9]; the writer cites the arXiv paper.
- Do not claim the GCN "fails" — it beats LR and ties RF(LF); the claim is that hand aggregates plus a forest win here.

### Recalled, not re-taught
- Hand aggregates and their size dependence (`neighbourhood-and-centrality`); the GCN layer and Skip-GCN (`graph-neural-networks`); exposure as a column (`guilt-by-association`): Refs.
- The accuracy trap and AP vs F1 (`alert-budget-metrics`); temporal validation (`delayed-labels-prequential`): Refs.
- Label completeness and AMLworld's transitive taint (`canonical-datasets`): Ref at sub-problem 7.

## FIGURE PLAN
- source: antimoney-fig2-f1-dark-market — stem `elliptic-step43-collapse`; the reader must see the real per-step illicit-F1 curves of RF, GCN, Skip-GCN and EvolveGCN over steps 35–49 falling together at step 43 against the bars of illicit counts; centered under sub-problem 5 (measured result; a redraw would imitate the collapse). **Key image.**
- draw: the dataset card as a figure — a strip of 49 disconnected graphs on a time axis, the 70:30 cut at step 34, the 2% / 21% / 77% label shares as a bar — single <Figure>; inspired by Weber Fig. 1 (recomputed from the public set).
- draw: the leaderboard as grouped bars: illicit F1 for LR / MLP / RF × LF / AF and GCN / Skip-GCN / EvolveGCN, with micro-F1 drawn as a second, flat row above them — single <Figure>; from Tables 1–2.
- draw: the "aggregates are already message passing" picture: a node, its neighbours' local features, the four fixed aggregators (max, min, std, corr) producing the 72 columns, beside the GCN's learned W — single <Figure>.
- draw: micro-F1 vs illicit F1 for the all-licit predictor and for RF(AF), as two 2×2 confusion matrices with the counts — single <Figure>.
- draw: the temporal split as a train/test strip with "no edges across" marked, next to a random node split with cross-split edges in red — single <Figure>.

## EXERCISE PLAN
1. [warm-up] From Table 1's precision and recall, recompute illicit F1 for RF(AF) and GCN and confirm the printed values.
2. [boundary probe] A test step with zero illicit nodes (as after a market closes): what are illicit precision, recall and F1 for any predictor, what is micro-F1, and what does Fig. 2's "near zero" mean there?
3. [claim to refute] "Micro-F1 above 0.96 for every model shows the task is nearly solved." Refute with the all-licit predictor's micro-F1 on a 2%-illicit step; name which metric the budget would use (precision at k per step).
4. [research-shaped] On the Elliptic subset, reproduce the direction of Table 1's AF > LF for a logistic regression and a random forest; report illicit F1 for both feature sets and state the margin that counts as reproducing.
5. [derivation skipped] Show why a model trained on steps 1–34 can use the time-step feature to lower its illicit rate on later steps (the class balance per step falls), and propose the ablation that removes the leak.
6. FORWARD → `concept-drift`: pool the illicit nodes of steps 40–42 and 43–45, train a classifier to tell the two groups apart on the 94 local features and report its AUC; the reader has measured the shift that caused the collapse before the next module names it.
7. [mixed review] Using `communities-and-components`: run union-find on step 43's edges, report the component containing the most illicit nodes and its size, and say what a ring-based alert would have found that the node classifiers did not.

## ARC
- Spine step 6 "The graph around the transaction": "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, found by testing whether fraud clusters, summarising and partitioning the neighbourhood, propagating known fraud through the graph as a random walk with restart, or learning the neighbourhood with a graph network."
- Inherits: every tool of the module; the metrics and temporal split of module 2; label completeness (`canonical-datasets`).
- Contributes: the module's results checked on the one public labelled transaction graph, the three facts explained, and the first sight of a change no graph method survives.
- Hands off: the Elliptic subset, the split and the weighted loss to `graph-propagation-lab`; the step-43 collapse as the opening evidence of module 7 (`concept-drift`, `drift-strategies-on-worldline`); the "no edges across steps" protocol to `pipeline-capstone-lab`'s graph feature.
- APPLICATION spec: the artifact is the published Elliptic benchmark (dataset, protocol, Tables 1–2, Fig. 2). Module results used: hand aggregates as fixed message passing and their size dependence (`neighbourhood-and-centrality`), the GCN layer and the skip argument (`graph-neural-networks`), exposure as a column (`guilt-by-association`), components as rings (`communities-and-components`), the accuracy trap and temporal validation (modules 2). Departures from the idealisation: heuristic entity labels rather than investigations; 77% unlabelled and real AML labels radically incomplete; disconnected fortnights rather than a continuous stream; no customer, no delay block, no budget, no adversary model; single runs without error bars.
