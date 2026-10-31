# neighbourhood-and-centrality — ledger

**Problem.** Before neighbours' labels judge a node, does fraud cluster in
this graph, and which numbers about a node's neighbourhood and position can
an ordinary classifier take? Answer: test cross-labelled edges against 2lf
(one-tailed proportion test, which sees only the H side), split into
dyadicity D and heterophilicity H; homophily = D > 1 and H < 1; a fraudulent
neighbour is evidence when fraud nodes average more fraudulent neighbours than
legitimate ones, D(n1−1) > H n1, in effect D > H (homophily all but assures it,
inverse homophily rules it out; auction fraud inverse-homophilic, accounting
homophilic); then one-hop
columns (degree by label, egonet triangles by alter label, density, link
columns), walk counts from A^k f (own label removed), distance to nearest
fraud, closeness, betweenness, recursive aggregates (max drifts with
neighbourhood size), egonet-law score; the 20-node feature table shows
label-reading columns measure exposure (legit G scores highest), structural
columns measure position, none sees a ring as a group.

## Explained
- Why the "fraudulent neighbours" column needs a test first (points the wrong way if fraud links to honest users) — intro
- Cross-labelled edge; P(cross) = 2lf recalled (not re-derived) from the fraud-as-a-graph exercise; homophily named informally; Definition cross-edge test: π = true cross-edge probability, r̂ its estimate, H0: π ≥ 2lf vs H1: π < 2lf, one-tailed proportion test; rejection = fraud and legitimate joined less than chance — §Does fraud sit next to fraud? / ### Counting cross-labelled edges (figure homophily-test.svg = key image)
- Example: 12-user toy (from fraud-as-a-graph exercise) 2 of 14 cross vs 6.2 expected, SE 0.133, z = −2.27, p ≈ 0.012, H0 rejected; exact binomial 0.019 — same ###
- Test assumptions: edges not independent (high-degree users counted many times; label-permutation test as the fix, designed in the Elliptic exercise); "legitimate" = not known as fraud (silence read as genuine, conservative direction); test needs edges between labelled nodes of one kind (entity-resolution users, transfer accounts, or cardholder projection through shared merchant) — ### What the test assumes
- 20-node toy introduced; cross-edge test on it: 7 of 25 vs 8 expected, SE 0.093, z = −0.43, p = 0.33, H0 stands though D, E, F form a triangle (test never counts fraud–fraud edges) — §Two separate questions / ### A second toy, and a test that says no (figure toy20.svg)
- Connectance p = 2M/(N(N−1)); E[m11] = n1(n1−1)p/2, E[m10] = n1(N−n1)p derived from pair counts; Definition dyadicity D = m11/E[m11], heterophilicity H = m10/E[m10]; dyadic D > 1, anti-dyadic D < 1, heterophobic H < 1, heterophilic H > 1; homophilic = dyadic and heterophobic, inverse homophily = anti-dyadic and heterophilic. Example: both toys homophilic (12 users D 3.9 H 0.29; 20-node D 3.8 H 0.83) — ### The two ratios
- Cross-edge test sees only H: r̂/2lf = 0.32 vs H 0.29 (12 users), 0.88 vs H 0.83 (20 nodes), equal up to N/(N−1) (derived in an exercise), so H0 is in effect H ≥ 1 — same ###
- Which way the fraudulent-neighbour column points: mean fraudulent degree of fraud nodes 2m11/n1 = D(n1−1)p vs of legitimate nodes m10/(N−n1) = H n1 p; column points at fraud iff D(n1−1) > H n1, i.e. D/H > n1/(n1−1) (≈ D > H for many fraud nodes); 20-node toy 3.8·3 = 11.4 vs 0.83·4 = 3.3 → 1.5 vs 0.44 per node; homophily assures it unless D/H falls within n1/(n1−1) of 1, inverse homophily rules it out (D(n1−1) < n1−1 < n1 < H n1); other two quadrants depend on which ratio is larger; counterexample N 20, n1 4, M 40, m11 1, m10 1: D 0.79, H 0.07, fraud 0.5 vs legit 0.06 (anti-dyadic yet points at fraud) — ### Which way a fraudulent neighbour points (figure dh-plane.svg with D = H diagonal)
- Auction fraud: accomplices farm reputation by trading with honest users, fraudsters trade with accomplices, cheat honest buyers → inverse homophily; accounting fraud homophilic; fraudulent-neighbour column highest for accomplices, zero for fraudsters. KeyFact: checking homophily is the gate on every label-reading column, run before fitting; compare D(n1−1) with H n1 (roughly D vs H): at fraudsters when the first is larger, else at whoever fraudsters link to (auction: accomplices). A classifier could learn a negative weight; propagation methods cannot — ### When fraud avoids fraud
- Degree, in/out-degree, fraudulent / legitimate degree; degree heavy-tailed; G has the most fraudulent neighbours (3) of any node — §One hop / ### Degree, split by the neighbours' labels
- Definition egonet (ego, alters, all edges among them); triangle; fraudulent / legitimate / semi-fraudulent triangle by alter labels; egonet density 2M/(N(N−1)) = connectance inside the egonet; FigureSequence egonet-g-1..4 + Task; Example egonet of G (deg 4, fraud 3; 5 nodes 6 edges; triangles G–D–F fraudulent, G–A–I semi; density 0.6); in-body exercise egonet of D (same numbers, triangles D–E–F fraudulent, D–F–G semi); density misleads at small degree (every leaf = 1) — ### The egonet: triangles and density
- Intrinsic features; link columns: count (keeps everything, grows with degree), binary (any fraudulent neighbour; 1 of 1000 = 1 of 1), mode (majority only; fraudulent only for E, F, G on the toy); relational logistic regression = LR with these inputs; correlated → selection keeps one or two; label-reading columns obey point-in-time rule — ### Link columns for a regression
- Walk (may revisit) vs path; Proposition (A^k)_ij = number of walks of length k, proof by induction; 4-node example (edges 1–2, 1–4, 2–4, 3–4), (A²)_44 = 3 (figure walks.svg with A, A², A³); f = fraud indicator vector, (Af)_v = fraudulent degree, (A²f)_v two-step walks to fraud (G: 5), computed as A(Af) by two sparse passes; cautions: grows with degrees; a fraudulent node's own label returns via (A²)_vv = degree → subtract (column "walks to another fraudulent node") — §Beyond one hop / ### Counting walks with matrix powers
- Geodesic distance; BFS (multi-source from all fraud nodes) for distance to nearest fraud; Dijkstra on weighted graphs needs lengths, recency weights → 1/w; farness, closeness = inverse mean distance; A: (6 + 14 + 18)/19 = 2.0, closeness 0.50; unreachable nodes: computed within component — ### Distance to the nearest fraud, and closeness
- Definition betweenness Σ_{j<k} g_jk(v)/g_jk; bridge figure (three K4 groups joined through X: degree 3, betweenness 48 = 3·4·4; a group member degree 3, betweenness 0); Example Q = 35 (2·17 + 1), O = 63 (4·15 + 3); in-body exercise N = 34; fractions from tied shortest paths: A–D via A–B–D and A–G–D, B and G each 1/2; B = 18 (C to the 18 others) + 8 × 1/2 (D to A, H, O, P, Q, R, S, T) + 8 × 1/3 (E to the same eight, three routes) = 24.67; G 35.3, D 13.8, F 6.2 by the same split; mule = small degree, large betweenness (candidate profile); cost one search per node, estimated from sampled sources; PageRank named only, deferred — ### Betweenness: the node every route passes through
- Recursive aggregates: mean / min / max of any column over neighbours, repeated (one hop per round), near-duplicate columns pruned; A's max neighbour fraudulent degree 3 (via G); Elliptic's 72 aggregates (max, min, std, correlation of neighbours' local features, one hop back and forward); weakness: max grows with neighbourhood size, E[max of k std normals] 0.85 (k = 3), 1.54 (10), 2.51 (100) (figure aggregate-max.svg); mean hides the outlier; loss either way — §Columns nobody lists by hand / ### Recursive aggregates over the neighbours
- Egonet law: neighbours k vs egonet edges M = k + triangles, bounds star M = k, clique M = k(k+1)/2; power law M ∝ k^α, 1 ≤ α ≤ 2 on real graphs (the claim); the figure is an explicitly synthetic illustrative graph (~170 nodes, α = 1.25 fitted to its own dots); law fitted per graph, distance from it as label-free score; near-star (150 nbrs, 3 edges among them) ~ fan-in/fan-out, near-clique (12 nbrs, 58) closed group; = anomaly score on graph columns, ranks shapes not fraud (figure egonet-law.svg, synthetic) — ### Egonets against the law the others follow
- Full 20-node feature table (markdown); reading: label-reading columns = exposure (G top: 3 fraud nbrs, 5 two-step walks; I fraud with 0 fraud nbrs; split "≥ 2" catches D, E, F, G misses I); structural columns = position (I betweenness 65, closeness 0.45, but A and O rank above); RF on 4 positives learns nothing reliable; cost ladder one pass vs one search per node; columns cannot see beyond their reach nor a ring as a group. KeyFact: a node next to fraud looks like fraud in every label-reading column; G next fraudster or next victim — §The feature table / ### Reading the table
- Conclusion hands off to communities-and-components (rings are groups)

## Notation
- f, l fractions of fraudulent / legitimate nodes; π true cross-edge probability, r̂ observed cross-labelled fraction (its estimate); π0 = 2lf; H0: π ≥ 2lf
- N nodes, M edges (also used for an egonet's nodes/edges in the density formula and the egonet law), n1 fraudulent nodes, m11 / m10 / m00 edge counts by label pair, p connectance
- D dyadicity, H heterophilicity (math italic; toy nodes D and H are written as upright letters in prose)
- A adjacency matrix (math italic; toy node A upright); f fraud indicator vector (bold); (A^k)_ij walks of length k
- d(u, v) geodesic distance; farness, closeness(v); g_jk, g_jk(v) shortest-path counts; betweenness(v)
- k number of neighbours (egonet law and aggregates) — NOTE: k is the alert budget elsewhere in the course

## Running cases
- 12-user graph (F1–F4 fraud, L1–L8; edges F1F2, F1F3, F2F3, F3F4, F2F4, F4L1, F1L5, L1L2, L2L3, L3L4, L4L1, L5L6, L6L7, L7L8): 2 cross vs 6.22; z −2.27, p 0.012 (exact 0.019); p = 0.212, D 3.9, H 0.29
- 20-node toy (reconstructed so that every degree / triangle / density / closeness / betweenness / path-count value matches the source's sample network): fraud D, E, F, I; edges A–B, A–G, A–H, A–I, A–O, A–T, B–C, B–D, D–E, D–F, E–F, D–G, F–G, G–I, I–K, I–N, H–K, J–K, L–M, L–N, M–N, O–P, O–Q, Q–R, Q–S. m11 3, m10 7, m00 15; cross test p 0.33; p = 0.132, D 3.8, H 0.83
- Toy feature table (degree / fraud nbrs / triangles / density / dist / 2-hop walks to another fraud / closeness / betweenness): A 6/1/1/0.33/1/4/0.50/104; B 3/1/0/0.50/1/3/0.39/24.7; C 1/0/0/1/2/1/0.28/0; D 4/2/2/0.60/0/4/0.35/13.8; E 2/2/1/1/0/2/0.26/0; F 3/2/2/0.83/0/4/0.33/6.2; G 4/3/2/0.60/1/5/0.43/35.3; H 2/0/0/0.67/2/2/0.37/9; I 4/0/1/0.50/0/2/0.45/65; J 1/0/0/1/2/1/0.26/0; K 3/1/0/0.50/1/0/0.34/20; L 2/0/1/1/2/1/0.26/0; M same as L; N 3/1/1/0.67/1/0/0.34/34; O 3/0/0/0.50/2/1/0.40/63; P 1/0/0/1/3/0/0.29/0; Q 3/0/0/0.50/3/0/0.31/35; R, S 1/0/0/1/4/0/0.24/0; T 1/0/0/1/2/1/0.34/0. 3-hop walk counts (with own label, as in the source): A 18, G 25, D 19
- 4-node walks graph: A rows 0101/1001/0001/1110; A² 2111/1211/1110/1103; A³ 2314/3214/1103/4432
- Bridge graph: three K4 + X, X betweenness 48, connectors 27, others 0
- Exercises: warm-up A, K, N; triangles = (A³)_vv/2 (G: 4/2), E[m10]/M = 2n1(N−n1)/(N(N−1)) = 0.485 vs 2lf 0.444 (ratio N/(N−1), relative difference 1/(N−1): 9% on 12 nodes, 0.57 edge over 14); transfer star (account h paid 15 accounts, 5 known mules, 10 not, h unlabelled): D 0, H 0.73 (D(n1−1) 0 vs H n1 3.6), z −0.75 p 0.23, h fraud degree 5, betweenness 105, mules 0/0 → anti-dyadic, neighbour labels cannot find the next mule; columns point at h, which is either the mule controller or an honest payer (cannot tell); auction graph (F1 known, F2 unknown, C1, C2 accomplices, U1–U4; 11 edges): fraud degree tops accomplices, D 0, H 1.06 (anti-dyadic, heterophilic), claim assumes D(n1−1) > H n1 (fraud avg 0 vs others 5/6 = 0.83), shared-neighbour count (A²)_{v,F1} ranks F2 first (2); Elliptic max-aggregate vs neighbour count design + label-permutation homophily test; FORWARD relational-neighbour rounds on the toy (G 0.75 → 0.79, A 0.17 → 0.35, B 0.33 → 0.39, H 0 → 0.25, O 0 → 0.06); AP of rankings by fraud degree 0.61 vs betweenness 0.30 vs floor 0.2 under the tie convention, and why fraud-degree AP is optimistic for a ring found all at once

## Assumed
- fraud-as-a-graph: graph, adjacency matrix (matrix-or-list-what-the-graph-costs-to-store), entity resolution, two ways fraud is social (two-ways-fraud-is-social), motifs (eight-definitions), 12-user exercise (exercises)
- fraud-detection-system: silence read as genuine (silence-read-as-genuine-is-a-decision-not-a-fact)
- point-in-time-features: label-derived features, delayed terminal risk (a-feature-built-from-labels-what-the-bank-knew-that-morning)
- canonical-datasets: Elliptic, 94 local + 72 aggregates (elliptic-a-graph-whose-labels-come-from-names)
- anomaly-detection-framing: anomaly score = unlike normal
- alert-budget-metrics: AP and its tie convention (what-the-team-sees-at-each-fraud) — exercise
- classical-ml / prerequisites: logistic regression, one-proportion z-test, normal approximation, BFS/Dijkstra as standard algorithms, matrix powers

## Left open
- Communities, components, rings as groups, high-degree identifiers → communities-and-components (conclusion hand-off)
- Relational neighbour classifier, probabilistic form, PageRank (named only), random walk with restart → guilt-by-association (forward exercise)
- A layer that learns its own aggregation (heterogeneous neighbourhood sizes) → graph-neural-networks (named only as "a layer that learns its own aggregation", no Ref)
- Elliptic aggregates vs GCN results → elliptic-illicit-nodes (no performance numbers quoted here)
- Implementing the columns in code (egonet checkpoint) → graph-propagation-lab
- Not taught: graph centre / eccentricity, eigenvector centrality, clustering coefficient by name, Brandes' algorithm by name, quadrangles, normalised betweenness, weighted degree, edge-level (dyad) features
