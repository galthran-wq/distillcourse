# Lab: fraud propagation and a GCN on a transaction graph — research brief

Lesson: `graph-propagation-lab` (module: graphs, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Build a graph fraud scorer — sparse adjacency, connected components, a fraud-personalised random walk with restart with time-decayed weights, egonet features and a two-layer GCN in numpy — and score an Elliptic subset
Opening (verbatim, the lesson must start with it): From an edge list to an exposure score and a graph network: union-find for the rings, power iteration for the walk, a normalised adjacency for the layer, all refereed on a 20-node toy before the Bitcoin graph.

## Sources to consult
- CS6890 PS2 (TrustRank on a (sender, receiver, value) payment graph from a separate bad-node file; document with problem, dataset, algorithm, results; marks 5/10/5) and PS1 (Node2Vec, spectral and GCN embeddings of the payment graph, clustered; 10 per method) — research/texts/cs6890-ps2.txt, cs6890-ps1.txt.
- Neo4j GraphAcademy module 2 L4–L5 (union-find; ER edges; WCC on ER edges only; the component-size histogram; validation by volume share) — research/texts/graphacademy-workshop-gds-module2.txt.
- Baesens Ch5 Fig. 5.13 and Tables 5.3–5.13 (the 20-node toy with every metric tabulated, incl. Table 5.12's fraud-PageRank ranking D, F, E, G, I) — research/texts/fraudanalyti-s5-ch05.txt.
- APATE Sec. 3.2.1–3.2.3 (exp(−γh) weights, column-normalised Q, the tripartite form, power iteration, the cold-start update) — research/texts/apatea-s1-.txt.
- Weber et al. 2019 Sec. 3.2 and Sec. 4 (Â, the two-layer GCN, Skip-GCN, the 70:30 temporal split, weighted cross-entropy 0.3/0.7, illicit F1) — research/texts/antimoney-.txt.
- Akoglu Sec. 5.7 (Anti-TrustRank: backward along in-links from bad seeds) — research/texts/graphbased-s2-.txt.
- The lab-author conventions (.claude/skills/lab-author/references/conventions.md); the finite-difference referee pattern from `anomaly-scorers-lab`.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has derived four graph tools and seen them compared on Elliptic. The lab makes them build each from an edge list: a sparse transition matrix with decayed weights, union-find components, the restart walk by power iteration, egonet features from adjacency powers, and a two-layer GCN whose gradient a finite-difference referee judges — checked first on the textbook's 20-node toy, where every answer is tabulated, then run on an Elliptic subset under the paper's temporal split. What they lack is the practice: column vs row normalisation, the restart vector's scale, the self-loop and the symmetric normalisation in Â, the chain rule through two sparse products, and the masked, weighted loss.

### Chain of sub-problems
1. **Edge list → sparse Q.** — Build A (undirected for the toy, directed for Elliptic) and the column-normalised transition matrix with weights exp(−γh); dangling columns handled. Because: every later checkpoint multiplies by this matrix.
2. **Components by union-find.** — make-set / union / find with path compression; component sizes sorted. Because: the deterministic ring tool, and the first sanity check on the edge list.
3. **The restart walk.** — ξ ← αQξ + (1−α)z to tolerance; the toy's ranking must match Table 5.12. Because: the exposure score, verified against a published table.
4. **Egonet features from A, A², A³.** — degree, triangles (trace of A³/6 locally: (A³)_ii/2), 2- and 3-hop path counts to flagged nodes. Because: the lesson-2 features computed from matrix powers.
5. **GCN forward.** — Â = D̃^{−1/2}(A + I)D̃^{−1/2}; H1 = ReLU(Â X W0); logits = Â H1 W1 + X W̃. Because: the layer in matrix form, with the skip term.
6. **GCN backward.** — gradients w.r.t. W0, W1, W̃ for the weighted cross-entropy over a mask; the referee judges. Because: the derivation is the checkpoint.
7. **Train on the temporal split.** — steps ≤ 34 train, > 34 score; masked weighted loss; fixed seed and epochs. Because: Elliptic's protocol.
8. **The open task.** — any combination of walk scores, egonet features and GCN embeddings in any classifier, scored by illicit F1 on the held-out steps.

### Set pieces and worked examples to recreate
- Table 5.12's ranking D, F, E, G above I with α = 0.85 (Baesens Ch5).
- Table 5.13's featurisation of the 20 nodes: degree, triangles, path counts (Baesens Ch5).
- The component-size histogram shape 24,283 / 3,165 / 481 … (Neo4j L5) as the plot the shipped helper draws.
- Weber Table 1: GCN 0.628, Skip-GCN 0.705, RF(AF) 0.788 illicit F1 as the comparison row (Weber Sec. 4).
- The exp(−γh) sanity check (APATE Sec. 3.2.1).

### Pitfalls and terms to define
- Row vs column normalisation of Q (the fixed point changes); dangling nodes.
- The restart vector must sum to 1; α is the follow probability.
- Â needs A + I before the degree; D̃ is the degree *after* adding the self-loop; forgetting the symmetric (two-sided) scaling.
- Triangles via (A³)_ii double-count; path counts via A^k count walks, not simple paths — the checkpoint text says "walk counts".
- The weighted cross-entropy applies the class weight per node, not per batch; the mask excludes unlabelled nodes.
- Elliptic's time-step feature must be dropped from X (a leak).

### Recalled, not re-taught
- Everything in the module is Ref'd; the notebook prints objectives, never gradients.
- Finite-difference checking: the referee is shipped, as in `anomaly-scorers-lab`.
- Illicit-F1 (`elliptic-illicit-nodes`): the module-2 harness's step-sum AP is also imported for a second reading.

## LAB PLAN

Artifact: one notebook producing `graph_scorer.py` — `build_transition`, `union_find_components`, `restart_walk`, `egonet_features`, `gcn_forward`, `gcn_backward`, `train_gcn` — verified on the 20-node toy and run on an Elliptic subset, ending with the learner's best illicit-node ranking on the held-out time steps scored by illicit-class F1 (and AP as a second reading).

CANON GROUNDING: modelled on CS6890 PS2 — dossier: "compute TrustRank on the payment graph from a separate bad-node file; document with problem, dataset, algorithm, results. No scaffold. Marks: 5 documentation, 10 implementation, 5 results" (research/texts/cs6890-ps2.txt) — on CS6890 PS1 — dossier: "produce Node2Vec, spectral and GCN embeddings of a (sender, receiver, value) payment graph and cluster them; 10 per method (5 code, 5 results)" (cs6890-ps1.txt) — and on Neo4j GraphAcademy module 2 L5 — dossier: "end-to-end: degree of identifiers, create P2P_SHARED_CARD and SHARED_IDS, ER-only projection, WCC, label FraudRisk (expect 211), validate volume share (~13%). Scaffold: every query is given; learner runs and interprets" (graphacademy-workshop-gds-module2.txt). Departures: (a) TrustRank from bad seeds becomes the fraud-personalised restart walk of the lesson (the same iteration with the seed vector on the bad nodes; the course's version adds time decay and, on a directed graph, the backward direction — Anti-TrustRank — which the lab makes a parameter); (b) PS1's three embedding methods and clustering are reduced to one GCN whose embedding the learner may feed to any classifier in the open task — Node2Vec and spectral embeddings add no idea the module taught; (c) Neo4j's Cypher workflow is re-implemented in numpy as union-find on a given edge list, without the ER rule construction (the lesson's exercise does that on PaySim) — the lab's components checkpoint is the deterministic ring tool only; (d) results are verified by the server against the published toy table and canonical outputs, not by a hand-marked report.

Dataset / inputs: (1) the 20-node toy of the textbook rebuilt as our own edge list in-notebook (node labels and the Table 5.12 ranking as the referee's expected values; the drawing is not reproduced, only the graph); (2) a seeded synthetic bipartite cardholder–merchant graph with timestamps for the decay and cold-start checks (complete generator cell); (3) an Elliptic subset — `data/elliptic_subset_edges.csv`, `data/elliptic_subset_features.csv` (steps 30–49 only, ≈ 70,000 nodes, the 94 local features without the time-step column plus the 72 aggregates, labels for steps 30–34 in `data/`, labels for steps 35–49 in `private/`; ≈ 40 MB — if too large for the mirror, every 2nd step). Source: the Elliptic Data Set on Kaggle (Elliptic / MIT-IBM Watson AI Lab), licence stated on Kaggle as CC BY-NC — verify at build time; non-commercial use only and attribution required; if the licence blocks republication, the notebook downloads it from Kaggle with the learner's credentials and ships only the split indices.

Checkpoints (plan; lab-author may split or deepen):
1. `sparse-adjacency` (exact, warm-up): `build_transition(edges, weights, n, directed)` returning the sparse A and the column-normalised Q with exp(−γh) weights; verified on the toy and on a seeded 200-edge list; wrong variants: row-normalised; decay applied as exp(+γh); dangling columns left as zeros instead of uniform.
2. `connected-components` (exact, warm-up): `union_find_components(edges, n)` returning a canonical labelling and sorted sizes; verified on the toy (and on a seeded graph with 50 components); wrong variants: no path compression (correct but slow — declared only as a hint), treating directed edges as one-way (weak components must ignore direction).
3. `restart-walk` (exact): `restart_walk(Q, seeds, alpha=0.85, tol)` by power iteration; verified on the toy against the D, F, E, G, I ranking and on the seeded graph's canonical vector; consumes 1; wrong variants: un-normalised seed vector; restart applied as (1−α) added to every node; iterating with Qᵀ.
4. `egonet-features` (exact): degree, triangles per node and 2- and 3-hop walk counts to seed nodes from A, A², A³; verified against the toy's Table 5.13 columns; consumes 1; wrong variants: triangles not divided by 2; counting paths with the self-loop added.
5. `gcn-forward` (exact): Â and the two-layer forward pass with the skip term on seeded X, W0, W1, W̃; wrong variants: degree computed before adding I; one-sided normalisation D̃⁻¹(A+I); ReLU missing.
6. `gcn-gradient` (exact): gradients of the masked weighted cross-entropy w.r.t. W0, W1, W̃; verified against the server's analytic gradient; the shipped finite-difference referee is the local assert; consumes 5; wrong variants: class weights applied after averaging; mask applied to predictions but not to the loss count; dropping Âᵀ in the backward pass (Â is symmetric here, so the variant must be declared on the directed-Â option: the lab builds a symmetric Â from the undirected graph and says so).
7. `train-on-time-split` (exact): `train_gcn` with a fixed seed, epochs and learning rate on steps 30–34, returning illicit probabilities for steps 35–49 and the illicit F1 on the training steps; verified by the probability vector's digest and by the property that training-step illicit F1 exceeds the all-licit baseline; consumes 1, 5, 6; wrong variants: time-step column left in X; test steps' edges used in training's Â (a leak — in this subset there are no cross-step edges, so the variant is Â built on all steps at once, which changes nothing — declare instead the leak of training on all labels).
8. `why-rf-wins` (review, optional): the learner's account of why a random forest on the 72 hand aggregates beats the GCN; rubric accepts "the aggregates are already one-hop message passing; the GCN's last layer is a logistic regression; a forest exploits tabular thresholds" — "GCN underfits" alone insufficient.
9. `beat-illicit-f1` (metric, optional, LAST): any combination — walk scores from the training-step illicit seeds (forward and backward), egonet features, GCN embeddings, the 166 given features — in any classifier, scored by illicit F1 on steps 35–49 against the private labels (threshold chosen by the learner on steps 30–34).

Final open task: checkpoint 9 — illicit-class F1 over steps 35–49; rough threshold: the reference random forest on the 166 features plus the walk score and the GCN embedding, measured when built (the paper's RF(AF) reaches 0.788 on the full split; on the subset the writer calibrates so the reference clears the bar by ≥ 0.02 and the 2-layer GCN alone does not).

Known-wrong variants to declare: listed per checkpoint; the canonical bugs are row vs column normalisation, the un-normalised restart vector, D̃ before the self-loop, the one-sided normalisation, per-batch class weights, and the time-step leak.

NOT blanked (ship complete): the toy's edge list and expected tables, the synthetic bipartite generator, the Elliptic loader and split, the finite-difference referee, plotting helpers (the toy with node sizes by score; component-size histogram; per-step illicit F1 curve in the style of the paper's Fig. 2; PR curve), the illicit-F1 and imported AP scorers, a reference random-forest cell for the open task's comparison row.

est_hours: 4.5. Progression: warm-ups (1, 2) → composing chains (1 → 3; 1 → 4; 5 → 6 → 7) → one open metric last (9) → review garnish (8). Required: 1–7.

## ARC
- Spine step 6 "The graph around the transaction": "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, found by testing whether fraud clusters, summarising and partitioning the neighbourhood, propagating known fraud through the graph as a random walk with restart, or learning the neighbourhood with a graph network."
- Inherits: the edge list and decay (`fraud-as-a-graph`), the toy's feature table (`neighbourhood-and-centrality`), union-find (`communities-and-components`), the walk and the toy ranking (`guilt-by-association`), the GCN layer and Skip-GCN (`graph-neural-networks`), the Elliptic protocol (`elliptic-illicit-nodes`), the refereed-gradient pattern (`anomaly-scorers-lab`).
- Contributes: the module's four tools as verified code and the reader's own leaderboard on the Bitcoin graph.
- Hands off: the walk and components as nightly batch features to `real-time-scoring-architecture` and `pipeline-capstone-lab`; the per-step F1 curve as the drift evidence of module 7.
