# fraud-as-a-graph — ledger

**Problem.** Eight transfer rows each look ordinary; together they hold
A → C → D → A. How to turn a log into a graph (nodes, edges, weights), what
shared identifiers add, and which shapes are laundering? Answer: transfers =
directed multigraph of accounts; card payments = bipartite cardholder–merchant
graph with weights e^{−γh}, γ set from a horizon; the payment promoted to a
node (tripartite, Q_tri) so the label sits on a node; identifiers as nodes and
entity-resolution edges (with the high-degree caveat deferred); eight motifs
as features that need a window, amounts and account history, and that cover
only ~1 in 5 laundering transactions.

## Explained
- Why rows/history features cannot see the cycle: property of three accounts; following money = self-join per hop, unknown hop count — intro
- Graph G = (V, E); transaction graph: accounts as nodes, transfer = directed edge with timestamp and amount; parallel edges kept (directed multigraph) because order matters (E→D twice); laundering label sits on an edge — §Eight rows, one cycle / ### Each row is an edge (FigureSequence eight-rows-1..3, key image eight-rows-3)
- Cycle = path starting and ending at the same node, no other node twice; money-cycle needs increasing dates and shrinking amounts (fee per hop); B→C→D→A is a time-ordered path, not a cycle. KeyFact: a self-join must fix the hop count before it runs (one query per guessed cycle length); a walk needs no such number — ### Money that returns: a cycle in time order
- Delayed terminal risk recast as a one-hop graph feature (payment → merchant → merchant's other customers); graph extends to the next hop; CNP bulk theft links cards through one merchant — §Card payments / ### Cardholders, merchants, and no edge between two of a kind
- Definition bipartite (E ⊆ V1 × V2); "bipartite" ≠ two halves (a card graph is usually connected; bipartite only means no edge joins two of a kind); card edges undirected (money always flows one way) — same ###
- Weight matrix (adjacency matrix when weights 1) vs weight list; sparsity; 1M cardholders + 100k merchants → ~1.2×10^12 cells vs ~30M list lines a month; list (sparse format) runs, matrix is what the maths is written in (matrix–vector products); bipartite full matrix [[0, W],[Wᵀ, 0]] with W n_c × n_m — ### Matrix or list: what the graph costs to store
- Decay w = e^{−γh}; half-life ln2/γ; γ has units; γ = ln(1/ε)/H from a horizon H; ε = 0.05: day γ ≈ 0.125/h (half-life 5.5 h), week 0.0178/h (39 h), month 0.0042/h (~7 days); half weight at 23% of H; several graphs (day/week/month) because frauds move at different speeds; rebuilt on a schedule, edges below a floor dropped — §Time on the edges / ### Choosing the decay from a horizon (decay.svg)
- Several payments per pair: merged (unlike transfers) because the weight matrix has one cell per pair and the decay already records recency; W_ij = Σ_k e^{−γh_k} = recency-weighted frequency (RFM frequency on a pair); graph at t holds only payments before t — ### Several payments between the same pair
- Label on an edge: one hop is fine (terminal risk counts labelled edges at a merchant), but spreading further (p1 → m1 → c2 → c2's other merchants) is repeated matrix × node-indexed vector, which has no entry for a payment; putting it on an endpoint is wrong (cardholder = victim, merchant may be innocent) — §Where the label sits
- Definition tripartite transformation (V1, V2, V3; E ⊆ (V1×V3) ∪ (V2×V3); each payment node exactly one cardholder and one merchant neighbour; new edges carry the payment's weight); M (n_c+n_m) × n_p; Q_tri = [[0, M],[Mᵀ, 0]] of size n_c+n_m+n_p; tripartite graph is itself bipartite (entities vs payments); costs: path lengths double, one node per payment (decay keeps it bounded). KeyFact: whatever carries the label must be a node before suspicion can flow from it more than one hop — ### The tripartite graph (tripartite.svg, q-tri.svg)
- Identifiers (device, card number, IP, postal address, phone) as nodes because a fraudster must reuse them; heterogeneous graph defined; P2P schema User/Card/Device/IP with P2P, HAS_CC, USED, HAS_IP; telco takeover: contact list as identifier; Aside: spider constructions (bankrupt employer's resources reappear in a new company) — §One person, many accounts / ### What a fraudster has to reuse (identifiers.svg)
- Why a user–user edge when user–card–user exists: a rule can combine conditions no two-step path states (share a card AND transferred money), and components / neighbour counts run on user–user edges. Definition entity resolution (this course): add an edge between entities satisfying a shared-identifier rule ("share a card", "share a card and transferred money"), a hypothesis of one controller; the card-sharing transfer rule spelled out as a chargeback scheme (stolen card funds account 1, money moves to account 2, owner disputes, reversal hits the emptied account 1); one shared identifier can be innocent (family laptop, couple's card), several harder to explain; café IP / library device links everyone → deferred to communities-and-components — ### Entity resolution: shared identifiers become edges
- Projection table: users only / users + identifiers / heterogeneous, what each captures and loses; the choice follows the question; drop identifier types that link too many (IP) — ### Which graph to build
- Motif defined; the eight shapes AMLworld plants with k ≥ 2 definitions (fan-out, fan-in, gather-scatter, scatter-gather, simple cycle, random, bipartite, stack); structuring diamond = scatter-gather; eight rows: C fan-in k = 3, D fan-in k = 2, E and B fan-out k = 2, rows 1/4/6 simple cycle (4 of 5 accounts match a fan shape) — §The shapes of laundering / ### Eight definitions (motifs.svg)
- Shapes are vocabulary, not verdict (payroll fan-out, shop fan-in, household gather-scatter); evidence needs time window (e.g. 6 h scatter-gather, 1 day others, time order), pass-through amounts, account traits (young, no other activity, shared identifiers); window cuts both ways (the 5-week cycle vs refunds); motif counts as features computed in time order, handed to a classifier — ### A shape is evidence only with a clock and an amount
- Recall ceiling: ~1 in 5 AMLworld laundering transactions in a shape (Ref canonical-datasets, not re-taught) — ### What the shapes miss
- Opens on the problem: rows can be disguised, so a graph wins only if fraud lives between rows. Fraud social two ways (opportunistic spread, organised collaboration) → fraud near fraud; a fraudster cannot see/shape their position in the global graph; laundering imitates rows, hard to imitate a neighbourhood; P2P queries: 5-hop chains between flagged users (unflagged middles = new suspects), flagged users sharing cards/devices (candidate single controller); explicitly not proof of clustering without the comparison against unflagged pairs. KeyFact: graph helps where fraud is organised; lone opportunist leaves one edge — §What a fraudster cannot fake, and what a graph cannot see

## Notation
- G = (V, E); V_1 cardholders, V_2 merchants, V_3 payment nodes
- w = e^{−γh}: γ decay constant (per hour), h payment age at the moment of use, H horizon, ε residual weight at H
- W: n_c × n_m cardholder–merchant weight block; n_c, n_m, n_p counts of cardholders, merchants, payments
- M: (n_c + n_m) × n_p entity–payment weight matrix; Q_tri = [[0, M],[Mᵀ, 0]]
- k: motif size threshold (k ≥ 2) — NOTE: k is also the alert budget elsewhere; here only inside motif definitions
- Toy node names c1–c3, m1–m3, p1–p5 (p = payment node, not time)

## Running cases
- Eight rows (lesson's own, AMLworld-style): 1 2 May A→C 1,400; 2 9 May B→C 700; 3 12 May E→C 950; 4 20 May C→D 1,300; 5 27 May E→D 2,300; 6 4 Jun D→A 1,200; 7 11 Jun B→E 650; 8 19 Jun E→D 2,500; cycle rows 1/4/6, five weeks, 1,400 → 1,300 → 1,200
- Card toy: p1 c1–m1 2 h FRAUD, p2 c1–m2 30 h, p3 c2–m1 5 h, p4 c2–m3 100 h, p5 c3–m3 20 h; week weights 0.97/0.59/0.91/0.17/0.70; day weights 0.78/0.02/0.54/4e-6/0.08 (in-body exercise; day graph links c1, c2 via m1)
- Q_tri toy 11 × 11 (M table in the Example)
- P2P dataset: ~33,700 users (33,732), ~790,000 nodes (> 9 in 10 identifiers), ~1.8M relationships
- Exercises: 4-payment log (weights 0.81/0.43/0.90/0.28, W c2m2 = 1.18); Q² = diag(MMᵀ, MᵀM) derivation; γ = 0.004/h → 0.51 at a week, half-life 173 h, 0.05 at ~31 days = month graph; cycle rule precision at 1/1,750 and LR 20 ≈ 1.1% (odds 1:87); PaySim fraud pair = two disconnected edges, no motif; 12-user homophily toy (4 F, 8 L, 14 edges, 2 cross vs 2lf·M ≈ 6.2 expected); point-in-time graph spec (payments before t_i, ages at t_i, labels arrived by t_i)
- In-body exercise: firm F payroll fan-out (k = 40) vs account X gather-scatter (6 in, 3 out, 98% forwarded within 3 h)

## Assumed
- financial-crime-typology: placement/layering/integration (placement-layering-integration), single transaction tells nothing (why-a-single-transaction-tells-nothing), CNP bulk theft (card-present-card-not-present), structuring diamond exercise, cloned phone
- canonical-datasets: AMLworld, complete labels, ~1 in 5 in shapes (labels-that-follow-the-money, what-the-world-contains)
- transaction-aggregates: windowed history features, RFM (summarising-a-cards-past-recency-frequency-monetary)
- point-in-time-features: delayed terminal risk, point-in-time correctness (exercise 7)
- economics-of-detection: odds form of Bayes (exercise 4)
- paysim-feature-matrix: fraud pair, receiver never holds the money (exercise 5)
- ulb-unsupervised-scores: ULB file has no entities
- course prerequisite: sparse matrices, matrix powers

## Left open
- Homophily test, degree, triangles, egonet, centrality → neighbourhood-and-centrality (forward exercise 6 computes the cross-edge count without naming it)
- High-degree identifiers, degree cap, components as rings, Louvain → communities-and-components
- Propagation / random walk with restart on Q_tri, exposure scores, time-decayed seed vector → guilt-by-association (exercise 2 forward)
- Adjacency as a network input, message passing → graph-neural-networks
- Edge list → sparse Q construction in code → graph-propagation-lab
- Not taught: Jaccard / normalized edge weights, hyper-edges, self-edges; blackhole/volcano patterns; no performance numbers for graph features (APATE AUC deferred to guilt-by-association)
