# Transactions as a graph: entities, motifs and entity resolution — research brief

Lesson: `fraud-as-a-graph` (module: graphs, core, planned). NEW. Framework lesson of the module.
Goal: Construct a bipartite or tripartite graph from a transaction log, resolve entities through shared identifiers, and classify laundering typologies as motifs.

## Sources
- Altman et al. 2023 Sec. 1 and 3.2 (primary for motifs): Fig. 1 — eight rows of a table vs the directed multigraph exposing the A → C → D → A cycle; nodes = accounts, edges = timestamped transactions; the eight patterns with definitions (fan-out/fan-in = vertex with k ≥ 2 distinct out/in neighbours; gather-scatter; scatter-gather over the same intermediate set; simple cycle; random; bipartite; stack); Table 8: 19,461 of 100,604 laundering transactions in patterns (1 per 9,047) and 81,143 "other" disguised as payroll/supplies; Table 6–7 pattern sizes up to 18 nodes, ~260–300 instances each; Sec. 3.4 entity graph (individuals, companies, banks; multi-account; cross-ownership; shells).
- APATE Sec. 3.2.1–3.2.2 (primary for the card graph): bipartite G = (V₁, V₂, E) cardholders × merchants, edges = transactions (Eq. 1); weights w = exp(−γh), γ chosen so weight ~0 after a month (LT 0.0001/days), week (MT 0.004/hours), day (ST 0.03/minutes); the edge-to-node transformation to a tripartite graph (each transaction node has exactly one cardholder and one merchant neighbour, Eq. 3; symmetric Q_tri, Eq. 4); Fig. 1 toy network with recency weights; Sec. 2.1 fraud as organised; Sec. 5 group fraud as future work.
- Neo4j GraphAcademy module 2, L1 and L5 (primary for entity resolution): P2P schema (User, Card, Device, IP; P2P, HAS_CC, HAS_IP, USED; ~790k nodes, 1.8M relationships, 204k users); 5-hop chains between flagged users; shared card/device between flagged users; projection choices (monopartite vs bipartite vs heterogeneous; Users + Cards + Devices, exclude IP); ER rule 1 P2P_SHARED_CARD (~6,000+); the high-degree identifier problem (coffee-shop IP, library device, compromised cards on the dark web); degree on identifiers (REVERSE); ER rule 2 SHARED_IDS (degree ≤ 10, > 2 shared ids; ~5,000+); "the threshold of 10 is a domain judgment, not a magic number".
- Baesens Ch5 pp.209–227 (primary for the homophily test): Bob and his five fraudster friends (different if he has 200 other friends?); graph components (directed/undirected, self/multi/hyper-edges, weighted incl. Jaccard, egonet); representation (transactional table to sociogram, adjacency matrix/list, weight matrix/list); homophily test — expected cross-labelled edge fraction 2lf, one-tailed proportion test; worked 12 nodes (8 legit, 4 fraud), 5 observed vs 8 expected cross-labelled edges, p = 0.02967; dyadicity D = m₁₁/E[m₁₁], heterophilicity H = m₁₀/E[m₁₀], E[m₁₁] = n₁(n₁ − 1)p/2, E[m₁₀] = n₁(N − n₁)p, connectance p = 2M/(N(N − 1)); dyadic + heterophobic = homophily; Ch5 pp.266–269 bipartite/affiliation graphs, connectivity matrix, recency-weighted edges, a triangle sharing one event vs two; pp.276–277 credit-card trick (transactions as nodes so labelled edges seed propagation). Ch6 p.292: claimants A and B sharing address, car, bank account and phone are probably one person.
- Akoglu Sec. 1.1 (four reasons for graphs: inter-dependence, representation, relational nature — opportunistic fraud spreads by word of mouth, organised fraud by groups; adversarial robustness — fraudsters lack the global view), Sec. 2.2.1 (the UNODC near-normal laundering quote), Sec. 2.2.3 and 5.2–5.3 (auction fraud heterophily: fraudster / accomplice / honest; accounting fraud homophily), Sec. 5.6 (blackhole/volcano), Sec. 6 (graph construction when data is not natively a network; multi-graphs).
- Bolton & Hand Sec. 2, 5: fraudsters seldom work alone; disconnected fraudsters call the same numbers from a new account (telecom) — the oldest entity-resolution signal.
- Weber Sec. 2.1 (Elliptic nodes = transactions, edges = BTC flow; address clustering heuristics) — one line, forward.

## Key points
1. Why a graph: the eight-row table vs its multigraph (Fig. 1); the four reasons (Akoglu); the relational trait of the typology (module 1) now operational.
2. Representations: bipartite cardholder–merchant (APATE), account–account multigraph (AMLworld), user–identifier heterogeneous (Neo4j); adjacency vs weight matrix vs lists; time-decayed weights with the three γ (and the arithmetic check: exp(−0.004·168) = 0.51 — "near zero after a week" is approximate); the tripartite trick so labelled transactions become nodes (needed for propagation — forward).
3. Motifs: the eight laundering patterns defined by degree and reachability; which are per-node (fan-in/out), per-pair (scatter-gather), per-cycle; the 19% statistic — pattern matching caps recall; blackhole/volcano in trading as a temporal motif.
4. Entity resolution: add edges for shared identifiers; the high-degree identifier problem derived (an identifier of degree d links d users — a coffee-shop IP joins the city); degree cap 10 and the "> 2 shared identifiers" rule; the consequence: components over ER edges are rings (forward to graph-features-and-communities).
5. Homophily: the test computed on the 12-node toy (5 vs 8, p = 0.03); D and H; why it matters: guilt by association assumes homophily, and auction fraud is heterophilous (fraudsters trade with accomplices who look honest) — the assumption statement for module 6 as Chandola's was for module 5.
6. ★ Starred: Jaccard-weighted edges; multi-partite graphs and egonet sampling for scale; the Bitcoin graph's address-clustering heuristics.

## Set pieces & gems
- The eight-row table → cycle (Altman Fig. 1): a 20-second demonstration.
- "Bob and his five fraudster friends — different if he has 200 others?"
- 5 observed vs 8 expected cross-labelled edges, p = 0.02967.
- exp(−0.004·168) = 0.51 — a numerical sanity check the lesson performs.
- The coffee-shop IP; degree ≤ 10 as a domain judgment.
- 19% of laundering in the eight patterns.
- Auction heterophily vs accounting homophily.

## Pitfalls
- No propagation here (next-but-one lesson) and no community algorithms (next); this lesson builds the graph and states the assumptions.
- Keep AMLworld's definitions exact (fan-out k ≥ 2 distinct out-neighbours etc.).
- The ER degree cap is a design parameter; present the mechanism, not the number.

## FIGURE PLAN
- draw: `<FigureSequence>` (3 frames): (1) the eight-row transaction table, (2) the same rows drawn as a directed multigraph, (3) the cycle A → C → D → A highlighted amber. Inspired by Altman Fig. 1 (recreated). Key image.
- draw: The eight laundering motifs as a gallery of eight small graphs with their one-line definitions under each. Inspired by Altman Fig. 2 (recreated in house style).
- draw: Bipartite → tripartite: a cardholder–merchant edge replaced by a transaction node with exactly two neighbours; three transactions shown, one labelled fraud (amber). Inspired by APATE Sec. 3.2.2 and Baesens pp.276–277.
- draw: Time-decay weights: three exp(−γh) curves (day/week/month γ) on a log-time axis with the "~0 after one period" claim checked at the period marks.
- draw: Entity resolution with a high-degree identifier: users, cards, one coffee-shop IP; SHARED_IDS edges drawn only through identifiers under the cap; two near-identical panels (cap 10 vs no cap) with the giant component appearing. Inspired by Neo4j L5 (the demo's static version).
- draw: The homophily test on the 12-node toy: the graph with cross-labelled edges dashed, the 2lf expectation as a formula dissected in place, the observed 5 vs expected 8 as a tally (voita rule 7).

## EXERCISE PLAN
1. Warm-up: draw the multigraph of a provided 10-row transfer table and list its fan-ins, fan-outs and cycles.
2. Derivation the lesson skipped: derive E[m₁₀] = n₁(N − n₁)p and E[m₁₁] = n₁(n₁ − 1)p/2 under independent edge placement with connectance p; then compute D and H for the 12-node toy.
3. Boundary probe: an identifier shared by every user (a default device id) — what the ER edges become, what every component becomes, and the smallest cap that removes it; relate to the demo.
4. Claim to refute: "Shared devices between two accounts are evidence of a fraud ring." Refute with the high-degree identifier and the household case; state the two conditions (low-degree identifier, more than one shared) the Neo4j rule imposes and why each.
5. Research-shaped: from AMLworld's Table 7 (pattern instance counts and transactions per pattern), compute the average transactions per instance for cycle vs scatter-gather and state which motif a per-node degree feature can see and which needs a pair.
6. FORWARD (E7): on the tripartite toy, hand-propagate "fraud mass" from one labelled transaction node to its cardholder and merchant and then to their other transactions, halving at each hop — the reader has run a random walk by hand → lands on `guilt-by-association`'s RWR.
7. Mixed review (E3): for the simulator's compromised-terminal scenario (canonical-datasets), state what the terminal node's egonet looks like over the 28 days and which module-3 feature (delayed terminal risk) is a one-hop aggregate of it.

## ARC
- Inherits: the organised trait (typology), module-3's entity view, the datasets (Elliptic, AMLworld).
- Contributes: the graph as an object — representations, weights, motifs, entity resolution, the homophily assumption.
- Hands off: features and communities (next), propagation (guilt-by-association), GCNs, the Elliptic application, the lab's adjacency and components.
- Spine step 6: "Fraud is organised: the cardholders, merchants, devices and accounts around a transaction carry signal no per-row feature sees, recovered by propagating known fraud through the graph as a random walk with restart, or by learning the neighbourhood with a graph network."
