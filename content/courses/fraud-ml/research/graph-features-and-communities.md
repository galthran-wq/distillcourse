# Neighbourhood, centrality and community features — research brief

Lesson: `graph-features-and-communities` (module: graphs, core, planned). NEW.
Goal: Compute degree, triangle, egonet, path-count, closeness, betweenness and community features on a toy network and explain which ones narrow a fraud search and which ones rank suspects.
Prerequisite from classical-ml: spectral clustering and the graph Laplacian (spectral-clustering) — recalled by Ref for the community section.

## Sources
- Baesens Ch5 pp.227–246 (primary; the 20-node toy, Fig 5.13, Tables 5.3–5.13): degree; triangles in the egonet by alter labels (fraudulent / legitimate / semi); density d = 2M/(N(N − 1)); relational neighbour (forward); link features (mode, count by class, binary); geodesic distance via Dijkstra; graph-theoretic centre; average path length; x-hop path counts via A^x (worked 4-node A², A³); closeness = [Σd/(n − 1)]⁻¹; betweenness = Σ g_jk(v)/g_jk; Table 5.13 featurisation of all node features side by side; pp.258–265 community mining (peer pressure; credit-card store communities Fig 5.26; MinCut 4, RatioCut 7/3, MinMaxCut 1/3 on the toy; spectral; Girvan–Newman; modularity Q = Σ(e_ii − a_i²) = 0.41; complete vs partial communities; overlapping; exposure M_A); pp.266–269 bipartite extension; Gotcha's direct egonet features (2 of 3 suspicious resources).
- Neo4j GraphAcademy module 2 (primary for the fraud workflow): L2 Louvain (modularity bands < 0.3 weak … > 0.7 strong, "maybe suspiciously high"; two phases local move + aggregation; party-guests metaphor; hierarchy levels 1,578 → 680; weighted vs unweighted; resolution limit — misses 3-person cells in a million-node graph; non-deterministic ids); L3 search-space reduction (fraud-graph: ~11,500 communities, modularity ~0.98; ~200 (1.7%) contain a flagged user; rank by flaggedCount/flaggedPercent); L4 degree orientations; WCC as islands and bridges, union-find (make-set, union, find); WCC vs Louvain table; why determinism matters (legal, audit, stable ids); weighted/seeded WCC caveats; L5 WCC on ER edges only: ~28,000 components, 24,283 singletons, 3,165 pairs, 481 triples, max ~175, mean ~2.4; flagged components → 211 FraudRisk users; validation: 211 users (< 0.1%) handle ~13% of P2P volume, ~130× random; guilt by association as prioritisation, not proof; summary pro tips (Louvain vs WCC vs PageRank vs betweenness).
- Akoglu Sec. 2.1.1 (feature-based: node/dyad/egonet/group/global features; OddBall egonet power laws, e.g. neighbours vs triangles, score = distance to the fit; recursive features/ReFeX — mean/min/max over neighbours of any feature, pruned), Sec. 2.1.2 (bridge nodes via PPR normality; AutoPart MDL; SCAN hubs/outliers), Sec. 3.2 (dynamic graphs: snapshot distances, DeltaCon, scan statistics — ★ starred), Sec. 5.6 (blackhole/volcano in-weight then out-weight dominance).
- Weber Sec. 2.1.2: the 72 one-hop aggregated features (max, min, std, correlation of neighbours' local features) — "naive" graph features that beat the GCN (forward).
- Altman App. D (GFP): fan-in/out, scatter-gather in a 6-hour window, cycles up to length 10, vertex statistics — graph features computed in time order.
- APATE Sec. 4.2: variable importance — network scores at merchant level top.

## Key points
1. Local features on the 20-node toy, each computed: degree (by class), triangles by alter label, egonet density, link features (count/mode/binary) — Table 5.13 reproduced in part; recursive aggregates (ReFeX) as the generalisation; Weber's 72 one-hop features as the industrial instance.
2. Paths and centrality: A^k counts k-hop walks (worked on the 4-node matrix); Dijkstra for geodesics; closeness and betweenness computed on the toy; the graph-theoretic centre; what betweenness finds (bridges between communities — mules).
3. Components: union-find in three operations; WCC deterministic and auditable; on all edges it is one giant component (useless); on entity-resolution edges only it is the rings — the Neo4j size histogram (24,283 singletons … one of 175) and the 211-user validation (13% of volume, 130× random).
4. Communities: modularity defined and computed on the toy split (0.41); Louvain's two phases; the quality bands and the "suspiciously high" 0.98; the resolution limit (small cells merged) and non-determinism → communities narrow the search (1.7% of communities hold any fraud), they do not assign it; the cut criteria (MinCut/RatioCut/MinMaxCut) in one paragraph with the toy numbers; spectral as classical-ml recall.
5. The workflow (Neo4j): explore with Louvain → hypothesise → encode as ER edges → resolve with WCC → label → validate by volume share; where each feature family enters a classifier (featurisation) vs the triage (community ranking).
6. ★ Starred: OddBall's power-law egonet pairs; dynamic-graph change statistics (snapshot distance, scan statistics); blackhole/volcano as a temporal motif feature.

## Set pieces & gems
- Table 5.13: every feature of the toy side by side.
- A², A³ counting paths (the "Seidel" misattribution noted in the source — do not repeat).
- Modularity 0.41 on the toy; 0.98 on the fraud graph as a warning.
- 24,283 singletons … one component of 175.
- 211 users, 13% of volume, 130× random — validation without ground truth.
- "WCC gives deterministic communities; Louvain's ids change run to run."

## Pitfalls
- Do not run Cypher; the ideas are the content; the lab does union-find and A^k in numpy.
- Keep "community" (Louvain) and "component" (WCC) rigorously distinct — the source's own point.
- The toy's numbers come from Baesens' tables; compute, do not quote, where the computation is short.

## FIGURE PLAN
- draw: The 20-node toy network (recreated layout) with one node's egonet highlighted and its features (degree by class, triangles, density) written beside — single figure; key image. Inspired by Baesens Fig 5.13.
- draw: `<FigureSequence>` (3 frames): A, A², A³ as cell grids for the 4-node graph with one entry highlighted per frame and the paths it counts drawn on the graph (voita rule 9).
- draw: Closeness vs betweenness on the toy: two near-identical panels colouring nodes by each centrality, the bridge node standing out only on the right (voita rule 8).
- draw: Union-find as a `<FigureSequence>` (4 frames): make-set on six nodes, two unions, a find with path compression, the final components coloured.
- draw: Louvain's two phases on a 12-node graph: local moves (frame 1–2), aggregation into super-nodes (frame 3), the modularity value rising per frame — a 3-frame sequence.
- draw: Component-size histogram of WCC on ER edges (log y): singletons, pairs, triples … one of 175 — from Neo4j L5's table.
- draw: The search funnel: 204k users → 11,500 communities → 200 with fraud → 211 risk users, as a funnel with the volume share (13%) at the bottom. From Neo4j L3/L5.

## EXERCISE PLAN
1. Warm-up: compute degree, triangles and egonet density for two marked nodes of the toy.
2. Derivation the lesson skipped: prove (A^k)_ij counts walks of length k between i and j by induction, and derive the number of triangles through node i as (A³)_ii/2.
3. Boundary probe: WCC on a graph with one universal identifier (from fraud-as-a-graph) — one component; show modularity of any partition of a complete graph is ≤ 0 and what Louvain returns; which step of the workflow (the degree cap) prevents it.
4. Claim to refute: "A community with modularity 0.98 and 40% flagged users is a fraud ring." Refute on non-determinism, the resolution limit and the triage-vs-assignment distinction; name the deterministic object (a WCC over ER edges) that could carry the claim.
5. Research-shaped: reproduce the 211-user validation logic on the simulator: build ER-style edges (customers sharing a compromised terminal within 7 days), take components containing a known fraudulent card, count the unflagged customers and their share of transaction volume vs the random expectation.
6. FORWARD (E7): compute the "count of fraudulent neighbours / degree" feature for every node of the toy and rank — then notice two nodes with no fraudulent neighbour but fraudulent neighbours-of-neighbours rank zero; the reader wants a two-hop score → lands on `guilt-by-association`'s propagation.
7. Mixed review (E3): place the delayed terminal risk (transaction-aggregates) as a one-hop egonet aggregate over the tripartite graph, and state which of this lesson's features it is (a label-count link feature with a time window).

## ARC
- Inherits: the graph object and ER edges (fraud-as-a-graph); classical-ml's spectral clustering.
- Contributes: the feature families (egonet, paths, centrality, components, communities) with their roles — narrow (communities), resolve (components), rank (centrality/features).
- Hands off: propagation (guilt-by-association) as the two-hop-and-beyond feature; the GCN as learned aggregation; the lab's components and egonet checkpoints; the capstone's graph layer.
- Spine step 6: the graph around the transaction.
