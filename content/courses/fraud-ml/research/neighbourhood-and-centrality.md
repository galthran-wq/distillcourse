# Neighbourhood and centrality features — research brief

Lesson: `neighbourhood-and-centrality` (module: graphs, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Test whether fraud clusters in a graph, then compute degree, triangle, density, path-count, closeness and betweenness features for a 20-node toy network and explain what each one tells a classifier
Opening (verbatim, the lesson must start with it): Before a node's neighbours are used to judge it, one fact has to be checked: do fraudulent nodes actually sit next to other fraudulent nodes in this graph, or next to honest ones? If they do cluster, what numbers about a node's neighbourhood — how many neighbours, how many of them fraudulent, how tightly knit, how central in the whole network — can be handed to an ordinary classifier?

## Sources to consult
- Baesens et al. 2015 Ch5 — pp.222–227 (is fraud a social phenomenon: the homophily test with expected cross-labelled edge fraction 2lf, one-tailed proportion test; worked 12 nodes, 8 legit / 4 fraud, 5 observed vs 8 expected, p = 0.02967; dyadicity D = m11/E[m11], heterophilicity H = m10/E[m10], E[m11] = n1(n1−1)p/2, E[m10] = n1(N−n1)p, p = 2M/(N(N−1)) — the text misprints D as m11/m11), pp.227–238 (neighbourhood metrics: degree by class, triangles by alter label, density 2M/(N(N−1)); Fig. 5.13 the 20-node toy; link features mode / count / binary for a relational logistic regression), pp.238–246 (geodesics and Dijkstra, graph-theoretic centre, A^x counts x-hop paths — attributed to 'Seidel 1995' in the text, a misattribution; worked 4-node A² and A³; closeness = [Σd/(n−1)]⁻¹, betweenness Σ g_jk(v)/g_jk), pp.254–257 (Table 5.13 featurisation: every metric side by side for the 20 nodes) — research/texts/fraudanalyti-s5-ch05.txt.
- Akoglu, Tong, Koutra 2015 — Sec. 2.1.1 (feature-based: node / dyad / egonet / group features; OddBall egonet pairs against power-law fits, e.g. neighbours vs triangles; recursive features ReFeX — mean/min/max of neighbours' features, pruned), Sec. 5.2–5.3 (auction fraud is heterophilous — fraudsters trade with accomplices and honest users; accounting fraud homophilous), Sec. 1.1 (fraudsters lack a global view) — research/texts/graphbased-s1-.txt, graphbased-s2-.txt.
- Weber et al. 2019 Sec. 2.1.2 and 2.2 (Elliptic's 72 one-hop aggregated features: max, min, std, correlation of neighbours' local features; their loss of information under heterogeneous neighbourhood sizes) — research/texts/antimoney-.txt (forward pointer).
- Sanchez-Lengeling et al. 2021, "Graph convolutions as matrix multiplications" (A^k_ij counts length-k walks) — research/texts/agentle-.txt (one paragraph).

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has a graph (last lesson) and a classifier that eats a table (module 4). To put the graph into the table they must compute numbers per node. The tempting first number — "how many of my neighbours are fraudulent" — is only informative if fraud actually clusters; in auction fraud it does not (fraudsters trade with honest users to farm reputation), so that feature would point the wrong way. What the newcomer lacks: a test of whether labels cluster in *this* graph (not yet: homophily, dyadicity, heterophilicity); the standard list of neighbourhood numbers and what each one measures (not yet: degree, triangle, egonet, density); the global-position numbers (not yet: geodesic, closeness, betweenness, matrix powers as path counts); and a sense of which of these a classifier can use and which it cannot (the recursive-aggregate idea, and the heterogeneous-neighbourhood loss that motivates lesson 5).

### Chain of sub-problems
1. **Does fraud cluster here?** — Obvious attempt: count fraud–fraud edges and see if there are "many". Why it fails: "many" needs a baseline — with 4 fraud nodes among 12, independent labels would still produce fraud–fraud edges by chance. Answer: if a fraction l of nodes are legitimate and f fraudulent, an edge joins the two classes with probability 2lf under independence; observe the fraction r̂ of cross-labelled edges; H₀: r̂ ≥ 2lf; a one-tailed proportion test with the normal approximation. Worked: 12 nodes, 8 legit, 4 fraud, 5 cross edges observed vs 8 expected, p = 0.0297 — reject at 0.05: homophilic. Refine into two ratios: dyadicity D = m11/E[m11] (fraud–fraud edges vs expectation n1(n1−1)p/2) and heterophilicity H = m10/E[m10] (cross edges vs n1(N−n1)p), with p = 2M/(N(N−1)) the connectance. D > 1 and H < 1: homophily; D < 1 and H > 1: inverse homophily (auction fraud). Because: the test decides whether "neighbour labels" is a feature or a trap, and the sign of H tells the classifier which way.
2. **What a node's immediate neighbourhood tells.** — Degree, and degree split by neighbour class (number of fraudulent neighbours, number of legitimate); the egonet (node + neighbours + the edges among them); triangles, classified by the labels of the two alters (fraudulent / legitimate / semi-fraudulent); density of the egonet 2M/(N(N−1)) — a triangle and a degree-1 egonet both have density 1, so density alone misleads. The 20-node toy: compute all of these for a few nodes by hand. Because: these are the cheapest features, one hop, computable from the adjacency list in one pass.
3. **The neighbourhood as a feature vector for a logistic regression.** — Link features in three forms: mode (the majority class among neighbours), count (degree per class), binary (any fraudulent neighbour); the warning that count features are correlated, so stepwise selection. Because: a "relational logistic regression" is just the module-4 model on these columns — the simplest way graph signal enters a classifier, and the baseline lesson 4 improves on.
4. **Beyond one hop: position in the whole graph.** — Geodesic distance (Dijkstra, non-negative weights), the graph-theoretic centre (smallest maximum distance — "if contaminated, fraud flows fast"), closeness = inverse average distance (unreachable nodes excluded), betweenness = share of all shortest paths through the node (the broker between communities). Because: a mule account is a bridge; its degree is small and its betweenness large.
5. **Counting paths with matrix powers.** — (A^x)_ij counts paths of length x from i to j; the worked 4-node A² and A³; so "number of 2-hop paths to a known fraudster" is one matrix product away, and the adjacency's powers are the whole of what lesson 5's layers compute. Because: this is the bridge between the feature table and the matrix view; sparse powers are cheap for small x.
6. **Features without choosing them by hand.** — Recursive aggregates: take any node feature, add its mean, min, max over neighbours, repeat, prune correlated columns (ReFeX); egonet feature *pairs* against a power-law fit (neighbours vs triangles — a star or a clique falls off the line, OddBall). Because: the hand list is finite and the aggregates generalise it — and they lose information when neighbourhood sizes vary (a max over 3 neighbours and over 3,000 are not comparable), which is the flaw lesson 5 names.
7. **How do we know it works.** — The 20-node featurisation table: every metric side by side; the honest reading that a random forest on such columns is what wins on Elliptic (72 one-hop aggregates, lesson 6).

### Set pieces and worked examples to recreate
- The 12-node homophily test: 5 observed vs 8 expected cross edges, p = 0.02967 (Baesens pp.225–226, Fig. 5.12).
- Dyadicity and heterophilicity with the connectance p = 2M/(N(N−1)); the auction vs accounting contrast (Baesens pp.226–227; Akoglu Secs 5.2–5.3).
- The 20-node toy network (Fig. 5.13) and its feature table (Table 5.13): degree, triangles, density, link features, path counts, closeness, betweenness — reuse as the lab fixture (Baesens pp.254–257).
- The 4-node A² and A³ path-count example (Baesens p.242–243, Fig. 5.21).
- Dijkstra stepwise on the toy (Fig. 5.20); betweenness bridging three communities (Fig. 5.22).
- OddBall's neighbours-vs-triangles power law and the star/clique outliers (Akoglu Sec. 2.1.1).
- Elliptic's 72 aggregates: max/min/std/corr of neighbours' 94 local features (Weber Sec. 2.1.2).

### Pitfalls and terms to define
- "Homophily" — define as "like links to like" with the card instance; the newcomer will assume fraud is always homophilous; the auction case says otherwise, and H's sign is the feature's sign.
- The source's dyadicity misprint (D = m11/m11) — the lesson writes D = m11/E[m11].
- "Seidel 1995" for matrix-power path counting is a misattribution in the source; the lesson states the fact without an attribution (it is elementary) and lists no name.
- "Egonet" — define before "egonet density"; the newcomer confuses the egonet with the neighbour set (it includes the edges among neighbours).
- Closeness with unreachable nodes: exclude them or the farness is infinite — say which convention the lesson uses.
- Do not introduce PageRank here (lesson 4), only name it as the one centrality kept for later.

### Recalled, not re-taught
- The graph object, adjacency matrix and list, tripartite Q (`fraud-as-a-graph`): Ref at sub-problem 2.
- Logistic regression and stepwise selection (classical-ml; `scorecards-woe` for sign constraints): one clause at sub-problem 3.
- Matrix powers and sparse products: course prerequisite.
- Proportion test with the normal approximation: assumed from the prerequisites, one sentence.

## FIGURE PLAN
- draw: the 12-node network with the 5 cross-labelled edges in amber and the 8 expected written beside — single <Figure>; inspired by Baesens Fig. 5.12. **Key image.**
- draw: the homophily / inverse-homophily 2×2 — D and H axes with "auction fraud" and "accounting fraud" placed — single <Figure>.
- draw: <FigureSequence>, 4 frames on one node of the 20-node toy: (1) its degree split by class, (2) its egonet with edges among neighbours, (3) its triangles coloured by alter labels, (4) its density computed; inspired by Baesens Figs 5.15–5.16.
- draw: the 4-node graph with A, A² and A³ as cell grids, one entry highlighted and its two paths drawn — single <Figure>; inspired by Baesens Fig. 5.21.
- draw: betweenness — three communities joined by two bridge nodes, with shortest paths flowing through them — single <Figure>; inspired by Fig. 5.22.
- draw: the featurisation table as a figure: the 20 nodes as rows, metrics as columns, fraud rows tinted — single <Figure>; inspired by Table 5.13.
- draw: OddBall's egonet-pairs scatter (neighbours vs triangles, log–log) with the power-law line and a star and a clique off it — single <Figure>; inspired by Akoglu Sec. 2.1.1 (idea only, synthetic data).

## EXERCISE PLAN
1. [warm-up] For three nodes of the 20-node toy, compute degree by class, triangles by alter label and egonet density by hand and check against the table.
2. [derivation skipped] Derive E[m11] = n1(n1−1)p/2 and E[m10] = n1(N−n1)p under independent edge placement with connectance p, and show that dyadic + heterophobic is exactly the one-tailed homophily rejection.
3. [boundary probe] A graph where every fraudster has degree 1 and links to one honest hub: compute D, H, the hub's betweenness and its fraudulent-neighbour count — which features point at the hub and which at the fraudsters, and what does the homophily test say?
4. [claim to refute] "A node with more fraudulent neighbours is always more suspicious." Refute with the auction structure (accomplices farm reputation by trading with honest users; H > 1) — name which feature sign flips.
5. [research-shaped] On the Elliptic subset, recompute three of the 72 one-hop aggregates (max, std, correlation of a local feature over in-neighbours) for nodes with 1, 10 and 100 neighbours and show how the max feature's distribution depends on degree — the information loss lesson 5 names.
6. FORWARD → `guilt-by-association`: on the 20-node toy, compute for each unlabelled node the weighted share of fraudulent neighbours Σw·[fraud]/Σw and then repeat using the neighbours' shares instead of their labels; the reader has built the relational neighbour classifier and its probabilistic form before they are named.
7. [mixed review] Using `alert-budget-metrics`: rank the 20 toy nodes by betweenness and by fraudulent-neighbour count; with k = 3 alerts, compute precision at 3 for each ranking against the toy's labels and say which position feature pays.

## ARC
- Spine step 6 "The graph around the transaction": "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, found by testing whether fraud clusters, summarising and partitioning the neighbourhood, propagating known fraud through the graph as a random walk with restart, or learning the neighbourhood with a graph network."
- Inherits: the graph and its representations (`fraud-as-a-graph`); logistic regression and feature selection (module 4); matrix powers (prerequisite).
- Contributes: the homophily test as the gate on neighbour-label features; the one-hop and position features; matrix powers as path counts; recursive aggregates and their size-dependence.
- Hands off: the feature table and the toy to `guilt-by-association` (relational neighbour, PageRank on the same 20 nodes) and `graph-propagation-lab` (egonet checkpoint); the 72 Elliptic aggregates and the heterogeneous-neighbourhood loss to `graph-neural-networks` and `elliptic-illicit-nodes`; cuts and modularity (which need density and degree) to `communities-and-components`.
