# Graph convolutional networks for node classification — research brief

Lesson: `graph-neural-networks` (module: graphs, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Derive the GCN layer as neighbourhood aggregation with a normalised adjacency, show that a skip connection makes it at least a logistic regression, and evaluate when it beats hand-aggregated neighbour features
Opening (verbatim, the lesson must start with it): Hand-built neighbourhood features summarise a node's neighbours with fixed statistics — counts, means, maxima — chosen in advance. Could a network learn which summary of the neighbourhood matters, the way a convolution learns which summary of nearby pixels matters, and what does one layer of such a network compute?

## Sources to consult
- Sanchez-Lengeling, Reif, Pearce, Wiltschko 2021 (Distill) — "Images as graphs" (the 5×5 pixel grid with its banded adjacency; convolution as neighbourhood aggregation), "The challenges of using graphs in ML" (adjacency matrices are not permutation-invariant, sparse, factorially many; adjacency lists O(edges)), "The simplest GNN" (an MLP per node, connectivity unused), "GNN predictions by pooling", "Passing messages between parts of the graph" (gather, aggregate, update; k layers = k hops; the analogy to convolution), "Adding global representations" (master node), "Some empirical GNN design lessons" (best at 2 layers, deeper dilutes; ≈3k parameters suffice; sum slightly better on average), "Comparing aggregation operations" (sum/mean/max and the graph pairs each cannot distinguish), "Graph convolutions as matrix multiplications" (AX is sum aggregation; A^k counts walks), "GCN as subgraph function approximators", "Sampling graphs and batching" (neighbourhood sub-graphs, masked loss), "Graph attention networks" (attention as a permutation-invariant weighted sum) — research/texts/agentle-.txt.
- Weber et al. 2019 — Sec. 3.2 (H^(l+1) = σ(Â H^(l) W^(l)), Â = D̃^{−1/2}(A + I)D̃^{−1/2}; the two-layer GCN softmax(Â ReLU(Â X W0) W1); Skip-GCN with the X W̃ term reducing to logistic regression at W0 = W1 = 0), Sec. 3.3 (EvolveGCN: GCN weights evolved by a GRU), Sec. 4 (hyperparameters: 2 layers, embedding 100, 1,000 epochs, Adam 0.001, weighted cross-entropy 0.3/0.7; Table 1: GCN 0.812/0.512/0.628, Skip-GCN 0.812/0.623/0.705, RF(AF) 0.956/0.670/0.788; Table 2 EvolveGCN 0.720), Sec. 2.2 (hand aggregates lose information under heterogeneous neighbourhood sizes), Sec. 5 (why RF beats GCN; GCN ends in an LR layer) — research/texts/antimoney-.txt.
- Altman et al. 2023 Sec. 4 (GIN, GIN+EU, PNA edge classification; PNA near-par with boosted trees without hand features; GBT needs graph feature preprocessing) and App. E (≈1,000 GPU hours) — research/texts/realisticsyn-.txt (one paragraph on the alternative architectures and the cost).
- Akoglu et al. 2015 Sec. 2.2.3 (relational learning as the family GNNs belong to) — research/texts/graphbased-s1-.txt.
- CS6890 PS1 (GCN embeddings for clustering a payment graph) — research/texts/cs6890-ps1.txt (lab pointer).

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has neighbour aggregates chosen by hand (max, mean, std of neighbours' features; exposure from a walk) and knows from lesson 2 that a max over 3 neighbours and over 3,000 are not the same feature. In image classification the same problem — which summary of a pixel's neighbours matters — was solved by learning the summary: a convolution. A payment graph is not a grid: nodes have different numbers of neighbours in no order. What the newcomer lacks: a way to write "aggregate the neighbours" that does not depend on their order or number (not yet: message passing, permutation invariance, sum/mean/max aggregation); the matrix form of one such layer (not yet: normalised adjacency Â, GCN layer); why it is at least as good as ignoring the graph (not yet: skip connection); how to train it on a graph that does not fit in memory (not yet: neighbourhood sampling, masked loss); and what two layers see (two hops) and why more is worse.

### Chain of sub-problems
1. **Why a convolution does not transfer directly.** — An image is a graph whose adjacency is banded and whose neighbourhood is always 8 pixels in a fixed order; the filter's 9 weights are indexed by position. A transaction graph's node has 3 or 3,000 neighbours in no order; a weight per neighbour position does not exist. Answer: an operation that is invariant to the order of neighbours and defined for any count — a sum, mean or max over neighbour vectors. Because: the adjacency matrix of the same graph has factorially many row orderings; a network that read it as a picture would learn the ordering, not the graph.
2. **The simplest graph network.** — An MLP applied to every node's features separately, with the graph used only at the end (pooling for a graph-level prediction): nothing about neighbours enters a node's vector. Why it is the baseline: for node classification it is exactly module 4's MLP on local features (Elliptic's MLP(LF) 0.649 illicit F1). Because: the question is what the graph adds, so the no-graph model must be named first.
3. **Message passing: gather, aggregate, update.** — For each node: gather the neighbours' vectors, aggregate them with a permutation-invariant function, update the node's vector with a learned transform of (own vector, aggregate). Stacking k layers lets a node's vector depend on nodes k hops away — the receptive field of the convolution analogy. Because: this is the one operation that respects what a graph is; sum, mean and max each fail to distinguish some pairs of neighbourhoods (sum sees counts, mean does not; max sees salient features, neither sees multiplicity).
4. **The matrix form: one GCN layer.** — AX sums each node's neighbours' rows — sum aggregation is a sparse matrix product; A + I adds the node itself; scaling by D̃^{−1/2} on both sides turns the sum into a degree-normalised mean so that a 3,000-neighbour node is not 1,000× louder; so H' = σ(Â H W) with Â = D̃^{−1/2}(A + I)D̃^{−1/2}; two layers: softmax(Â ReLU(Â X W0) W1) — W0 and W1 are the learned "which summary matters". Because: the only learned objects are W0, W1 — the aggregation is fixed and the graph supplies the weights; this is where lesson 4's ξ ← αQξ + (1−α)z reappears with W learned.
5. **Never worse than no graph: the skip term.** — Obvious worry: forcing every node through its neighbours could hurt when neighbours are noise. Answer: add X W̃ to the layer (Skip-GCN); with W0 = W1 = 0 the model is exactly logistic regression on the node's own features, so training can fall back to it. Because: on Elliptic, Skip-GCN 0.705 vs GCN 0.628 illicit F1 says the inputs were already informative and the plain layer was diluting them.
6. **Depth, dilution, long range.** — Best models at 2 layers, deeper dilutes (each layer averages over a wider ball; the node's own signal washes out); a global node connected to everything for long-range information; attention as a learned, per-edge weighted sum instead of the degree weights. Because: two hops is the merchant's other cardholders — the depth the fraud signal lives at.
7. **Training on a million nodes.** — The whole adjacency does not fit; sample each training node's k-hop neighbourhood, batch the sub-graphs, mask the loss to the core nodes whose neighbourhoods are complete; weighted cross-entropy (0.3 licit / 0.7 illicit) for the imbalance; inductive training (the test steps' graphs are unseen). Because: a GCN on a sub-graph is correct only for nodes whose receptive field is inside it.
8. **How do we know it works, and when it does not.** — Elliptic: RF on hand aggregates 0.788 > Skip-GCN 0.705 > GCN 0.628 > LR; concatenating GCN embeddings to the features helps LR and RF a little; the temporal evolution EvolveGCN adds 0.72 vs 0.705; on the synthetic laundering world a graph network without hand features (PNA) is near par with boosted trees *given* graph features — at about 1,000 GPU hours. Because: the GCN's last layer is a logistic regression and a forest is an ensemble of thresholds — on tabular aggregates the forest wins; the network earns its place where the aggregates are not yet known or the graph is the only input (lesson 6 and the lab decide).

### Set pieces and worked examples to recreate
- The 5×5 smiley as pixels, as a banded adjacency matrix and as a graph; text as a chain graph (Distill "Images as graphs").
- The four-node graph with all its permuted adjacency matrices (Distill "Challenges").
- Gather–aggregate–update on a 5-node toy, with the information reaching a node after 1, 2, 3 layers (Distill "Passing messages").
- AX on the 4-node toy as the sum of neighbour rows; A² as 2-hop walks (Distill "Graph convolutions as matrix multiplications"; the lesson-2 example reused).
- The Â normalisation worked on a node of degree 1 and a node of degree 3 (Weber Sec. 3.2).
- Skip-GCN at W0 = W1 = 0 is logistic regression (Weber Sec. 3.2).
- The empirical sweep: ≈3k parameters reach high performance; best depth 2; aggregation choice not uniform (Distill "Empirical design lessons").
- The pooling counter-examples: graph pairs sum, mean and max cannot tell apart (Distill "Comparing aggregation operations").
- Elliptic's Table 1 and Table 2 numbers (Weber Sec. 4).

### Pitfalls and terms to define
- "Permutation invariance" — define with the permuted-matrix picture before message passing.
- "Receptive field" borrowed from CNNs — define as "the set of nodes whose features can influence this node's vector" at first use.
- Â's symmetric normalisation vs the column normalisation of lesson 4's Q — the lesson contrasts them explicitly (one gives a mean, the other a probability flow).
- "Inductive" vs "transductive": Elliptic's test steps are disconnected graphs, so the model must be inductive — say what that means in one sentence.
- Illicit-F1 vs micro-F1 is lesson 6's subject; here quote only illicit-class numbers.
- Do not present attention or EvolveGCN beyond a paragraph each; the lesson's object is the GCN layer.

### Recalled, not re-taught
- MLP, backpropagation, Adam, weighted cross-entropy (`neural-tabular-detectors`, classical-ml): Refs.
- Matrix powers as path counts and hand aggregates' size dependence (`neighbourhood-and-centrality`): Refs at sub-problems 1 and 4.
- The random walk's iteration (`guilt-by-association`): Ref at sub-problem 4 as the unlearned cousin.
- Convolution on images: prerequisite (NN basics), one clause.

## FIGURE PLAN
- draw: the same 5×5 image as pixel grid, banded adjacency matrix and graph, with one pixel's 8 neighbours highlighted in all three — single <Figure>; inspired by Distill's "Images as graphs".
- draw: a 4-node graph beside three of its permuted adjacency matrices — single <Figure>; inspired by Distill's "Challenges".
- draw: <FigureSequence>, 4 frames: gather (neighbour vectors as cell strips), aggregate (summed strip), update (through W), and the two-hop reach after a second layer shaded on the graph; inspired by Distill's message-passing schematic. **Key image.**
- draw: Â H W as cell grids — Â sparse with the diagonal added and the D̃^{−1/2} scaling written on two rows of different degree, H as feature rows, W as the learned block — single <Figure>; in the house's matrix-as-grid style.
- draw: Skip-GCN wiring: X → Â X W0 → ReLU → Â · W1, with the X W̃ bypass arrow, and the W0 = W1 = 0 case greyed to leave logistic regression — single <Figure>.
- draw: neighbourhood sampling — a large graph, a sampled 2-hop sub-graph around three core nodes, the loss mask on the core — single <Figure>; inspired by Distill's sampling figure.
- draw: Elliptic illicit-F1 bars LR / MLP / GCN / Skip-GCN / RF with the AF vs LF pairs — single <Figure>; from Weber Table 1.

## EXERCISE PLAN
1. [warm-up] Compute Â for a 4-node graph by hand and one forward pass of a GCN layer with a 2×2 W on 2-dimensional node features.
2. [boundary probe] A node with no neighbours: what does Â H W compute for it, and why does the self-loop in A + I matter; then a star of degree 3,000 — compare sum, mean and the symmetric normalisation at the hub.
3. [claim to refute] "Adding a third and fourth GCN layer lets the model see 4 hops, so it must be at least as good as the 2-layer model." Refute: dilution (each layer averages over a wider ball; own signal washes out) and the empirical sweep; name the mechanism, not just the number.
4. [derivation skipped] Show that two GCN layers without nonlinearity compute Â² X W0 W1, so the model is a logistic regression on 2-hop-averaged features, and that the nonlinearity is what makes the first layer's output not just a smoothed X.
5. [research-shaped] On the Elliptic subset, train logistic regression on the 94 local features, on the 94 + 72 aggregates, and on the 94 + a 2-layer GCN embedding concatenated; report illicit F1 for each and state the margin that would reproduce the paper's "embeddings help LR" finding.
6. FORWARD → `elliptic-illicit-nodes`: compute micro-F1 and illicit-class F1 for a classifier that predicts "licit" for every node on a 2%-illicit test set — the reader meets the accuracy trap in a graph setting one lesson before it is the subject.
7. [mixed review] Using `guilt-by-association`: rewrite one power-iteration step of the fraud walk as a GCN layer with fixed weights (which W, which normalisation, which nonlinearity), and say which of the two is a model and which is a feature.

## ARC
- Spine step 6 "The graph around the transaction": "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, found by testing whether fraud clusters, summarising and partitioning the neighbourhood, propagating known fraud through the graph as a random walk with restart, or learning the neighbourhood with a graph network."
- Inherits: hand aggregates and their size dependence, A^k as paths (`neighbourhood-and-centrality`); the walk's iteration and sparse Q (`guilt-by-association`); the MLP pipeline (`neural-tabular-detectors`).
- Contributes: message passing, the GCN layer in matrix form, the skip argument, depth and sampling, and the honest comparison with a forest on hand aggregates.
- Hands off: the Elliptic protocol and its three facts to `elliptic-illicit-nodes`; the two-layer GCN with a finite-difference referee to `graph-propagation-lab`; "representation learning instead of hand features" to module 7's sequence models.
