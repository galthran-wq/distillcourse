# Graph convolutional networks for node classification — research brief

Lesson: `graph-neural-networks` (module: graphs, core, planned). NEW.
Goal: Derive the GCN layer as neighbourhood aggregation with a normalised adjacency, show that a skip connection makes it at least a logistic regression, and evaluate when it beats hand-aggregated neighbour features.
Prerequisite: neural-tabular-detectors (MLP, BCE, Adam, early stopping); guilt-by-association (Q, power iteration).

## Sources
- Sanchez-Lengeling et al., Distill 2021 (primary for mechanics): graph = nodes, edges, global context; adjacency matrices sparse and not permutation-invariant (the 4-node permutation gallery), adjacency lists O(n_edges); the simplest GNN (one MLP per attribute type, connectivity unused); pooling (gather + aggregate ρ; edges → nodes, nodes → edges, nodes → global; readout); message passing in three steps (gather, aggregate, update), k layers = k hops; convolution analogy with variable neighbourhood; global/master node; empirical lessons (more communicating attributes better; best at 2 layers, deeper dilutes; sum slightly better on average, mean/max fine; ~3k parameters suffice); aggregation counterexamples (max vs sum/mean each fail on some pairs); AX as sum aggregation with binary A; A^k counts walks; GCN as subgraph function approximator; attention as a permutation-invariant weighted sum (Transformer = GNN on a complete graph); neighbourhood sampling and masked loss; edge prediction = node prediction on the dual; GNNExplainer (one line).
- Weber et al. 2019 Sec. 3.2–3.3 and 4–5 (primary for the fraud result): H^(l+1) = σ(Â H^(l) W^(l)), Â = D̃^{−1/2}(A + I)D̃^{−1/2}; two-layer GCN H₂ = softmax(Â ReLU(Â X W₀) W₁); Skip-GCN adds X W̃ — with W₀ = W₁ = 0 it reduces to logistic regression; EvolveGCN (GCN weights as a GRU's state); hyperparameters (2 layers, embedding 100, 1,000 epochs, Adam 0.001, weighted CE 0.3/0.7); Table 1 (illicit P/R/F1: RF(AF) 0.956/0.670/0.788; GCN 0.812/0.512/0.628; Skip-GCN 0.812/0.623/0.705; LR(AF) 0.481 F1; MLP(AF) 0.653; +NE node embeddings help LR and RF); Table 2 (EvolveGCN 0.720); Sec. 5: RF = voting ensemble; GCN ends in an LR layer; concatenating GCN embeddings to RF helps marginally; proposed differentiable decision forests.
- Altman Sec. 4 and App. C/E: GIN, GIN+EU (edge updates), PNA on AMLworld; neighbour sampling; PNA near-par with GBT + graph features (HI-Small: XGB 63.2 vs PNA 56.8; LI-Medium 28.2 vs 27.7); ~1,000 GPU hours; code IBM/Multi-GNN; temporal snapshots for train/val/test.
- Akoglu Sec. 2.2.3 (collective classification as the pre-neural relative), Sec. 4 (interpretation of graph anomalies — one line).
- Handbook Ch7 FFNN (the MLP vocabulary) and Ch7 SequentialModeling attention (the weighted-sum mechanism — Ref).
- CS6890 PS1 (lab canon): Node2Vec / spectral / GCN embeddings for clustering a payment graph.

## Key points
1. Flaw-first: RWR propagates a scalar from seeds with fixed weights; a one-hop logistic regression on (own, mean-of-neighbours) features (the forward exercise of the previous lesson) learns the weights but fixes the aggregation at one hop and one statistic. A GCN layer is that regression with learned W, applied in layers.
2. The layer derived: AX as sum over neighbours; (A + I) adds self; symmetric normalisation D̃^{−1/2}(A + I)D̃^{−1/2} so high-degree nodes do not dominate (compare with Q's column normalisation from RWR); H′ = σ(ÂHW); two layers = two hops; the walk-counting reading of Â^k.
3. Permutation invariance: why a flattened adjacency matrix cannot be a feature vector (the permutation gallery), and why aggregation must be invariant — sum/mean/max and the pairs each cannot distinguish; depth 2 as the empirical sweet spot and the dilution beyond; the global node for long range.
4. Skip-GCN: H′ = σ(ÂHW + XW̃); with W = 0 it is logistic regression on X — "cannot be worse than LR"; the empirical ladder on Elliptic: LR 0.48 → GCN 0.63 → Skip-GCN 0.71 → RF on hand-aggregated features 0.79.
5. Training a GCN on a fraud graph: node classification with a weighted CE for the illicit class; temporal split by snapshot; neighbourhood sampling with the masked loss for large graphs (Elliptic fits in memory; AMLworld does not); EvolveGCN as a GRU over the layer weights across time steps (+0.015 F1).
6. When it beats hand features: Weber's negative result (72 one-hop aggregates + RF beat GCN; aggregates are what the first layer would learn), Altman's near-par (PNA ≈ GBT + GFP), the cost (1,000 GPU hours); when it should pay: heterogeneous neighbourhood sizes the min/max/std aggregates lose, edge features (GIN+EU), unlabelled-majority graphs (semi-supervised propagation through the layer).
7. ★ Starred: attention aggregation (GAT) as a learned weighted sum; edge classification on the dual (AMLworld is an edge task); Node2Vec embeddings (PS1's other two methods) in one paragraph.

## Set pieces & gems
- The 4-node graph with all its permuted adjacency matrices.
- "After three layers a node has information about nodes three steps away."
- Skip-GCN reduces to LR at zero weights — a one-line argument.
- Elliptic ladder: LR 0.48 → GCN 0.63 → Skip-GCN 0.71 → RF 0.79.
- Aggregation counterexamples (max vs sum).
- ~3k parameters already reach high performance; 2 layers best.
- 1,000 GPU hours vs a random forest.

## Pitfalls
- Keep Â (symmetric, GCN) and Q (column-normalised, RWR) visibly distinct; one figure shows both.
- No spectral derivation of the GCN (Chebyshev filters); the neighbourhood-aggregation view is the lesson.
- The Elliptic numbers are the application's; here they are the ladder only.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of message passing on a 7-node graph: (1) node features as small cell vectors, (2) gather from neighbours (fan arrows), (3) aggregate (sum) into one vector, (4) update through W and σ — the target node's cell vector changing per frame (voita rules 6, 9). Key image.
- draw: Â dissected: (A + I), D̃, the normalised product as three cell grids with one row highlighted; beside it Q from RWR for the same graph — the two normalisations compared.
- draw: The 4-node graph and four of its permuted adjacency matrices as cell grids — "same graph, different matrix". Inspired by Distill's permutation figure (recreated).
- draw: Skip-GCN as a tiered diagram (X → ÂXW and XW̃ summed → σ → next layer) with the W = 0 case greyed to show the surviving LR path.
- draw: Aggregation counterexample: two small graphs that sum distinguishes and max does not, with the aggregated values written. Inspired by Distill's pooling counterexample (recreated).
- draw: Depth vs hop reach: the same graph with 1-, 2-, 3-hop neighbourhoods of a node shaded progressively, and a note on dilution. Three small panels.
- draw: The Elliptic ladder as a bar chart (LR, GCN, Skip-GCN, MLP, RF) of illicit F1 — from Weber Table 1.

## EXERCISE PLAN
1. Warm-up: compute Â for a 4-node path graph and one forward pass of ÂXW with given X (4 × 2) and W (2 × 1).
2. Derivation the lesson skipped: show that with W₀ = W₁ = 0 the Skip-GCN's output is a logistic regression on X, and that with W̃ = 0 and one layer it is a logistic regression on the symmetric-normalised neighbour mean plus self — the one-hop feature of the previous lesson's forward exercise.
3. Boundary probe: a graph with no edges (A = 0) — Â = I, the GCN is an MLP; and a complete graph — Â has rank one, every node's hidden state equals the global mean after one layer; what each says about when the graph term helps.
4. Claim to refute: "A deeper GCN sees more of the graph, so a 6-layer GCN should beat a 2-layer one on Elliptic." Refute with the dilution/over-smoothing argument (the complete-graph limit in miniature) and Distill's sweep; name the mechanism.
5. Research-shaped: reproduce the Distill finding on a seeded synthetic graph (two communities, node features correlated with class): F1 of 1-, 2-, 4-layer GCNs; report the peak.
6. FORWARD (E7): train a 2-layer GCN on Elliptic steps 1–34 (or the lab's subset) and plot illicit F1 per test step 35–49 — the reader sees the curve fall to zero at step 43 before any explanation → lands on `elliptic-illicit-nodes` (and module 7's drift).
7. Mixed review (E3): run RWR (guilt-by-association) from the labelled illicit nodes of a snapshot and feed ξ as an extra input column to a logistic regression; compare with the GCN's F1 on the same split — which "aggregation" won and why.

## ARC
- Inherits: MLP machinery (neural-tabular-detectors); RWR and Q (guilt-by-association); egonet aggregates (graph-features-and-communities).
- Contributes: the learned-aggregation detector — the GCN layer, invariance, depth, Skip-GCN's LR floor, training on a temporal graph — and the honest comparison with hand aggregates.
- Hands off: the Elliptic application (next); the lab's GCN checkpoints; the sequence models of module 7 as the temporal sibling; EvolveGCN's drift to module 7.
- Spine step 6: the graph around the transaction.
