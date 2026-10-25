# Communities and connected components: narrowing the search to rings — research brief

Lesson: `communities-and-components` (module: graphs, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Compute Louvain communities and union-find components on a payment graph, explain why modularity narrows a fraud search but cannot assign a ring, and design entity-resolution edges on which components are the rings
Opening (verbatim, the lesson must start with it): A payment network has 204,000 users and a few hundred known fraudsters. Investigators cannot look at every user, and a fraud ring is a group, not a node. How do you cut the graph into groups so that the few groups containing a known fraudster are where to look, and how do you then draw rings whose membership an auditor can check line by line?

## Sources to consult
- Neo4j GraphAcademy module 2 — L2 (Louvain: modularity and its score bands < 0.3 weak … > 0.7 strong, maybe suspiciously high; two phases local move and aggregation; hierarchy levels 1,578 → 680; weighted vs unweighted; tolerance; limits: resolution limit misses 3-person cells, non-deterministic ids), L3 (fraud graph: ≈11,500 communities, modularity ≈0.98, ≈200 (1.7%) with any flagged user — a 98% cut of the search; rank by flagged count and percent; unflagged users in fraud-heavy communities as targets), L4 (degree centrality orientation; WCC as islands and bridges; union-find make-set / union / find; WCC vs Louvain table; why determinism matters — legal, audit, stable ids; weighted WCC threshold; seeded WCC's grow-only caveat), L5 (why not Louvain for assignment; the method explore → hypothesise → encode → resolve → label → validate; ER rule 1 P2P_SHARED_CARD ≈6,000; the high-degree identifier problem — coffee-shop IP, library device, dark-web compromised cards; ER rule 2 SHARED_IDS with identifier degree ≤ 10 and > 2 shared ids ≈5,000; WCC on ER edges only: ≈28,000 components, 24,283 singletons, 3,165 pairs, 481 triples, max ≈175, mean ≈2.4; 211 unflagged FraudRisk users; validation: < 0.1% of users carry ≈13% of P2P volume, ≈130× random; the threshold 10 is a judgment, not a constant) — research/texts/graphacademy-workshop-gds-module2.txt.
- Baesens et al. 2015 Ch5 pp.258–265 — community mining: credit-card store communities (Fig. 5.26); MinCut, RatioCut = Cut·(1/|S| + 1/|T|), MinMaxCut = Cut·(1/Cut(S,S) + 1/Cut(T,T)) with the toy values 4, 7/3, 1/3 (Fig. 5.27); Girvan–Newman by edge betweenness; modularity Q = Σ_i(e_ii − a_i²) = 0.41 on the toy split; complete vs partial bottom-up communities and overlap; membership exposure — research/texts/fraudanalyti-s5-ch05.txt.
- Akoglu, Tong, Koutra 2015 Sec. 2.1.2 (community-based anomalies: bridge nodes, normality as average PPR among neighbours) and Sec. 4.2 (connection subgraphs, CePS — given suspects find the connecting subgraph) — research/texts/graphbased-s1-.txt, graphbased-s2-.txt.
- Baesens Ch6 p.292 (claimants sharing address, car, bank account and phone are one person; cumulative vs marginal network growth) — research/texts/fraudanalyti-s6-ch6-7.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader can compute per-node features (last lesson) but the investigators' question is about groups: which users act together. On a peer-to-peer payment network of 204,000 users with a few hundred flagged, two tasks are distinct and are usually confused: (a) narrow the search — find the few groups where a known fraudster sits so investigators look there first; (b) assign rings — produce a list "these 7 users are one ring" that will be defended in a dispute and reproduced next week. What the newcomer lacks: a criterion for "a group" (not yet: cut, modularity), an algorithm that finds groups on a million nodes (not yet: Louvain, its two phases, its resolution limit and non-determinism), a deterministic alternative (not yet: connected components, union-find) and the design move that makes components mean rings (entity-resolution edges with the high-degree identifier problem handled).

### Chain of sub-problems
1. **What is a good partition?** — Obvious attempt: cut the fewest edges (MinCut). Why it fails: MinCut isolates one node with one edge — a useless "community". Answer: penalise unbalanced parts — RatioCut divides by part sizes, MinMaxCut by internal edge counts; on the toy, MinCut 4, RatioCut 7/3, MinMaxCut 1/3. Modularity generalises to many parts: Q = Σ_i(e_ii − a_i²), the share of edges inside communities minus what random placement with the same degrees would give; the toy split scores 0.41; bands: < 0.3 weak, 0.3–0.7 meaningful, > 0.7 strong or suspicious. Because: "dense inside, sparse between" needs a baseline, as the homophily test did.
2. **Finding communities at scale.** — Obvious attempt: remove the highest-betweenness edge repeatedly (Girvan–Newman) — correct and far too slow. Answer: Louvain's two phases — move each node to the neighbouring community that raises Q most, then collapse communities into nodes and repeat — producing a hierarchy of levels (1,578 communities at level 1 → 680 at level 3–4 on the movies graph). Because: local moves are cheap and the hierarchy exposes structure at several scales; the party-guests picture (move to the table where you know more people) is the intuition.
3. **Narrowing the search.** — On the fraud graph (users, cards, devices; IP excluded as noise): ≈11,500 communities, modularity ≈0.98; only ≈200 (1.7%) contain any flagged user; rank them by flagged count and share; the unflagged users inside fraud-heavy communities are the first targets. Because: 204k users → 200 communities is a 98% cut with one run — the search-space move.
4. **Why a community is not a ring.** — Louvain's resolution limit merges a 3-person cell into a large community in a million-node graph; its ids are non-deterministic run to run though membership is mostly stable; a modularity of 0.98 says the graph is already nearly disconnected. Because: a ring list that changes between runs cannot be audited or defended; assignment needs determinism and a definition an investigator can state.
5. **Connected components: the deterministic cut.** — Any path joins two nodes into one component; union-find (make-set, union, find) computes it in near-linear time with stable results; "a path connects them" is the whole explanation. Weighted WCC with a threshold; seeded WCC grows components but cannot split them, so edge removals need a recompute. Because: determinism is the property the audit needs, and the definition is the one a court can follow.
6. **Making components mean rings: encode the hypothesis as edges.** — Obvious attempt: WCC on all P2P edges — one giant component. Answer: build edges only where the hypothesis holds: rule 1, a P2P edge between users who share a card (≈6,000 edges); rule 2, > 2 shared identifiers among cards/devices with identifier degree ≤ 10 (≈5,000 edges) — the degree cap because a coffee-shop IP, a library device or a dark-web-sold card links everyone; then WCC on those edges alone: ≈28,000 components, 24,283 singletons, 3,165 pairs, 481 triples, the largest ≈175; components containing a flagged user are rings; 211 unflagged users labelled FraudRisk. Because: the method is explore (Louvain) → hypothesise → encode as relationships → resolve (WCC) → label → validate; the dumb deterministic algorithm runs on a graph the analyst designed.
7. **Validation without labels.** — The 211 users are < 0.1% of users and carry ≈13% of P2P volume, ≈130× a random set; guilt by association is prioritisation, not proof. Because: a labelled ground truth does not exist for rings, so the check is a quantity the hypothesis predicts (volume concentration). The threshold 10 is a judgment tuned against false positives, not a constant.
8. **From suspects to the subgraph that connects them.** — Given a set of flagged nodes, the connection subgraph (delivered current between them; the centre-piece generalisation to Q query nodes) draws the explanation an investigator reads; a false positive far from the others becomes a singleton. Because: this is the explanation side of the ring, picked up in module 9.

### Set pieces and worked examples to recreate
- MinCut 4 / RatioCut 7/3 / MinMaxCut 1/3 on the bisection toy; modularity 0.41 = (40/108 − (44/108)²) + (60/108 − (64/108)²) (Baesens pp.259–263, Figs 5.27–5.28).
- Louvain's hierarchy table 1,578 → 680 and the weighted-vs-unweighted actor pairs that split or join (Neo4j L2).
- The 98% cut: 11,500 communities, ≈200 with fraud (Neo4j L3).
- The component-size histogram 24,283 / 3,165 / 481 / 151 / 61 … / one of 175 (Neo4j L5).
- The two ER rules with their counts and the degree-≤10 / >2-shared-ids thresholds; the coffee-shop IP (Neo4j L5).
- The 211 FraudRisk users carrying 13% of volume, ≈130× random (Neo4j L5 Part 4).
- The claimant ring sharing address, car, bank account and phone (Baesens Ch6 p.292).
- Union-find's three operations as a 6-line routine (Neo4j L4).

### Pitfalls and terms to define
- "Community" vs "component": a community is dense inside relative to a baseline (soft, algorithm-dependent); a component is path-connected (hard, unique). Define both before Louvain and keep the distinction through the lesson.
- "Modularity" — define with the degree baseline a_i²; the newcomer reads it as "share of edges inside".
- "Resolution limit" — name and explain (small cells merge into big communities) at sub-problem 4.
- "Entity resolution" was defined narrowly in lesson 1; here the rules are its concrete form.
- Louvain ids differ between runs; the lesson never quotes a community id as if stable.
- The approximate counts (≈6,000, ≈5,000, ≈28,000) are the workshop's and vary by run; present as orders of magnitude.

### Recalled, not re-taught
- Entity resolution as edges and the identifier node types (`fraud-as-a-graph`): Ref at sub-problem 6.
- Degree, density and betweenness (`neighbourhood-and-centrality`): Refs at sub-problems 1 and 2.
- The inspection budget (`economics-of-detection`): Ref at sub-problem 3 — the 200 communities are the queue.
- PageRank-style normality (Akoglu's bridge nodes) deferred to lesson 4; named only.

## FIGURE PLAN
- draw: <FigureSequence>, 4 frames of one small graph: (1) the bisection toy, (2) the MinCut isolating one node, (3) the balanced cut with RatioCut and MinMaxCut values, (4) a 3-community partition with Q = 0.41 written; inspired by Baesens Figs 5.27–5.28.
- draw: Louvain's two phases — (a) a node moving to the neighbouring community with more links, (b) communities collapsed to super-nodes — <FigureSequence>, 3 frames; inspired by Neo4j L2's flowchart (idea only).
- draw: the search funnel 204,000 users → 11,500 communities → 200 with a flagged user → the unflagged members inside them — single <Figure>. 
- draw: the identifier graph with a coffee-shop IP of degree 400 linking everyone vs the same graph with identifiers of degree > 10 removed, two rings standing apart — single <Figure>; the demo's static companion. **Key image.**
- draw: the component-size histogram (log counts) from singletons to the 175-node component, flagged components tinted — single <Figure>; inspired by the L5 table.
- draw: the method as a loop: explore → hypothesise → encode → resolve → label → validate, with the artefact of each step — single <Figure>.

## EXERCISE PLAN
1. [warm-up] Compute MinCut, RatioCut, MinMaxCut and Q for a given 8-node split by hand.
2. [boundary probe] Identifier degree cap = 1 and cap = ∞: what components result on the P2P toy in each limit, and why neither finds a ring; then find the cap at which the planted rings first separate (the demo's task, in numbers).
3. [claim to refute] "Modularity 0.98 means the community detector found the fraud rings with 98% confidence." Refute: Q measures the partition's density relative to a degree baseline, not any label; a nearly disconnected graph scores high for any sensible partition; name what Q does say.
4. [derivation skipped] Show that modularity is bounded by 1 − 1/k for k equal communities on a graph with no inter-community edges, and derive from the degree term why a 3-node clique inside a 10⁶-edge graph cannot be its own community (the resolution limit in one inequality).
5. [research-shaped] On a PaySim subset, build shared-destination edges (two origin accounts paying the same destination within an hour) with a destination degree cap, run union-find, and report the volume share of components containing a flagged account vs a random set of the same size — the 130× check reproduced in form.
6. FORWARD → `guilt-by-association`: take one flagged component of the toy and count, for each unflagged member, the number of 2-hop paths to a flagged node via A²; then ask what number should replace the count when paths of length 3, 4, … also matter — the reader meets the need for a decaying walk the next lesson answers.
7. [mixed review] Using `economics-of-detection`: 200 communities hold 2,800 unflagged users; with k = 100 investigations a day and a hit rate of 13% volume concentration as the only evidence, write the utility calculation that decides whether to work the communities before the model's top-100 list.

## ARC
- Spine step 6 "The graph around the transaction": "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, found by testing whether fraud clusters, summarising and partitioning the neighbourhood, propagating known fraud through the graph as a random walk with restart, or learning the neighbourhood with a graph network."
- Inherits: the heterogeneous graph and entity resolution (`fraud-as-a-graph`); degree, density, betweenness (`neighbourhood-and-centrality`); the inspection budget (`economics-of-detection`).
- Contributes: cuts and modularity, Louvain for narrowing, union-find components for assignment, the degree cap and the encode-then-resolve method, label-free validation by volume concentration.
- Hands off: the union-find checkpoint to `graph-propagation-lab`; "a component is prioritisation, not proof" and the connection subgraph to `alert-explanations` (module 9); the WCC-on-ER-edges workflow to `eu-transaction-monitoring-design`; the need for a decaying multi-hop score to `guilt-by-association`.
