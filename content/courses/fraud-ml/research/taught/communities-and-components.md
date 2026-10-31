# communities-and-components — ledger

NOTE (data): the P2P dataset has 33,732 users (~790,000 nodes, > 9 in 10
identifiers); course.yaml `opening`, fraud-as-a-graph and
neighbourhood-and-centrality now agree. The course.yaml key_ideas still say
"204k users" (planning text, not rendered). The workshop's "204,000 users",
"mean component size ~2.4", "<0.1% of users" and "130× random" are
inconsistent with its own table; the lesson uses 0.63%, mean ~1.2 and "about
ten times" a random set (with the 2f baseline). Louvain community count:
~11,500 (the workshop's communityCount), ~200 with a flag.

**Problem.** A ring is a group, not a node: how to cut a payment graph
into groups so that the few holding a known fraudster are where to look
(narrowing), and how to draw rings an auditor can check (assignment)?
Answer: cuts → modularity → Louvain for narrowing (one run sets aside 98%
of communities); Louvain unfit for assignment (resolution limit,
run-to-run changes, density is no reason); connected components by
union-find (unique, order-independent, explainable) run on
entity-resolution edges with an identifier degree cap; rings validated
without labels by money share against a baseline sharing their bias.

## Explained
- Two jobs: narrowing (wrong group = wasted calls) vs assigning rings (acted on, defended, reproduced); neighbour lists of flagged users have no boundary — intro
- Cut(S, T) = weight between sides; MinCut detaches the quietest node (G, cut 3 < 4) — §Cutting a graph / ### The cheapest cut isolates one account
- RatioCut = Cut(1/|S| + 1/|T|), MinMaxCut = Cut(1/in(S) + 1/in(T)), in(S) = weight inside; both pick ABC|DEFG over all 63 bisections; both need the number of groups fixed — ### Pricing the cut by what it leaves on each side (FigureSequence cuts-1..4)
- Edge ends, strength s_v (weighted degree), e_CC = share of edge ends inside C, a_C = strength share; a_C² = chance share (ends attached proportional to strength); Definition modularity Q = Σ(e_ii − a_i²); community, community detection defined; one group Q = 0, all singletons negative; no score bands taught (high Q on a fragmented graph is in §Narrowing) — §Modularity: the share inside, against a random baseline / ### Counting edge ends
- Girvan–Newman (edge betweenness, remove, recompute) named and costed, no toy run — §Louvain / intro
- Proposition merge gain ΔQ = w_XY/M − s_X s_Y/(2M²) with proof; node joining = special case; leaving = −(merge gain with the rest of its community), so a move's gain = gain of joining − gain of staying — ### The gain of one move
- Louvain phase 1 (local moves: best positive joining-minus-staying gain), phase 2 (aggregate, self-loops), levels/hierarchy; ~one edge sweep per pass; local optimum, visiting order dependence, community ids not stable — ### Two phases, repeated (FigureSequence louvain-1..4)
- P2P run: users+cards+devices, IPs excluded; ~11,500 communities, Q ≈ 0.98, ~200 (1.7%) with a flagged user; rank by flagged count (large rings) and share (tight); unflagged members = targets (accomplice, mule, victim, bystander); 98% is of communities not users; high Q on a fragmented graph. KeyFact: modularity contains no label — §Narrowing the search on a peer-to-peer graph (figure search-funnel)
- Resolution limit: merge iff w_XY > s_X s_Y/(2M); 3-account cell (s 7) + neighbour (s 41): kept apart at M = 100 (threshold 1.4), swallowed at M = 10⁶; equal strengths merge below √(2M) ≈ 1,400 at 10⁶ edges; property of Q, inherited by every optimiser — §Why a community is not a ring / ### Small cells disappear in large graphs (figure resolution-limit)
- Run is not a record (ring list as evidence, stable membership and ids needed; Louvain's order dependence Ref'd back to ### Two phases, repeated, not restated); density is not a reason (fraudster and victims in one community; "modularity grouped them" not checkable) — ### A run is not a record / ### Density is not a reason
- Definition connected component (path; maximal; weakly connected = ignoring direction); equivalence relation ⇒ unique partition; useless on raw graph (café IP Ref'd to fraud-as-a-graph, popular payee merge everything) — §Connected components: groups defined by a path
- Union-find: make-set, find, union; Python with path halving and smaller-id-root rule ⇒ component named by its smallest id; production union by size names components by minimum member in a pass after the run (### Cost and change); Proposition order-independence with invariant proof; in-body exercise (reversed order: different redundant edges, same components) — ### Union-find (FigureSequence union-find-1..4)
- Near-linear cost (milliseconds on 33,732 users); incremental unions on new edges; removals can split ⇒ recompute; weight threshold = an edge-drawing choice — ### Cost and change
- Entity-resolution edges carry the hypothesis; Rule 1: transfer + shared card (6,240 edges) = chargeback scheme's middle step — §Drawing the edges / ### Rule 1
- High-degree identifier: one-vs-several and café recalled by Ref to fraud-as-a-graph (not re-taught); new here: a busy identifier merges whole components (every ring its users touch); shared for reasons unrelated to one operation (library PC, card stolen and resold to many buyers); identifier degree = users attached; identifier degree cap; cap fails both ways: too high puts every café/library customer in a ring's component (labelled), too low drops ring identifiers — ### The high-degree identifier (figure identifier-cap = key image; Demo IdentifierDegreeCap built and embedded, presets cap 1/10/500, Task: rings exact for caps 3–59, U8 drops at 2, U4/U5/U9 join at 60)
- Rule 2: share ≥1 card/device of degree ≤ 10 AND > 2 identifiers in total incl. IPs (5,316 edges); café IP can count but never create an edge; insurance claimants sharing address/car/account/phone = one person — ### Rule 2
- WCC on rule edges only: 28,203 components; 24,283 singletons, 3,165 pairs, 481 triples, 151 of 4, 61 of 5, 62 of 6–175, largest 175; label = share a component with a flagged user: 452 = 241 flagged (118 alone) + 211 new; 118 ≈ half of flagged share no rule edge — ### Components on the resolution edges alone (figure component-sizes)
- Audit: spanning tree defined (edges joining every member, no cycle; union-find's non-redundant unions are one) and its edge list (example sentences use made-up ids U17/U42 card 4471, U305/U2210 device 8812 card 6090 — not toy nodes), one sentence per edge, reproducible. KeyFact: union-find is the simplest algorithm of the chapter; rules + cap are the hypothesis written as data — ### What an auditor reads
- Label-free validation: 211 = 0.63% of users touch 12.7% of money; 65% of flagged↔unflagged money goes through them; random set touches 1 − (1−f)² ≈ 1.3% ⇒ ~10×; activity bias of rule 2 ⇒ matched baseline; FraudRisk = reason to call, not verdict, resting on chosen settings (one clause). KeyFact — §Checking the rings without labels
- Method loop explore → hypothesise → encode → resolve → label → validate, rule 1 came from inspecting Louvain communities; cap 10 and ">2" are settings of the loop, tuned by what each change labels and investigators confirm (stated only here); extensions (more rules, weights, thresholds) — §The method (figure method-loop)

## Notation
- M total edge weight (number of edges when unweighted; consistent with neighbourhood-and-centrality's M); s_v strength (weighted degree); s_X strength of a group; w_XY weight between groups X, Y
- Cut(S, T), in(S), RatioCut, MinMaxCut; e_ii (e_CC), a_i (a_C), Q; ΔQ
- union-find: parent, find, union, root
- f in the volume test = fraction of users in a set (not the fraud vector **f** of earlier lessons; the forward exercise uses bold **f** in that earlier sense)

## Running cases
- Seven-account weighted toy: A–B 8, B–C 6, A–C 6, D–E 9, E–F 9, D–F 9, F–G 3, C–D 3, B–E 1; M = 54; strengths A 14, B 15, C 15, D 21, E 19, F 21, G 3; MinCut {G} 3; ABC|DEFG cut 4, RatioCut 7/3, MinMaxCut 1/3; {G} RatioCut 3.5; Q(ABC|DEFG) = 0.41 (max over 877 partitions); Q(ABC|DEF|G) = 0.385; all singletons −0.16; Louvain gains A→B +0.112, C→{A,B} +0.148 vs →{D} +0.002, D→{E} +0.098 vs {F} +0.091 vs {ABC} −0.103, G→{DEF} +0.024; merge of the two −0.41; all 5,040 visiting orders give the same result
- Identifier toy U1–U9 (flagged U2, U7): k1 {1,2,3} deg 3, d1 {1,2} 2, d2 {2,3} 2, k2 {6,7} 2, d3 {6,7,8} 3, d4 library PC {3,4,5,9}+56 deg 60, p1 café IP {1,3,4,5,6,8,9}+393 deg 400; simplified rule (share any identifier ≤ cap): rings exact for caps 3–59; cap 2 drops U8; cap 60 merges ring 1 with 59 others (61 unflagged labelled); cap 400 one component; union-find edges U1–U2, U2–U3, U1–U3, U6–U7, U7–U8, U6–U8
- P2P dataset: 33,732 users, ~790,000 nodes, 241 flagged (~0.7%, chargeback-based); Louvain ~11,500 communities, Q ≈ 0.98, ~200 with a flag; ER edges 6,240 + 5,316 = 11,556; WCC numbers as above; 211 new, 12.7% of money, 65% of flagged↔unflagged money
- Exercises: 8-node unweighted split (cut 2, RatioCut 1, MinMaxCut 5/6, Q = 0.32; MinCut {8}, RatioCut 8/7); cap sweep on the identifier toy incl. strict rule 2 (no ring pair shares > 2 identifiers: U1–U2 k1,d1; U2–U3 k1,d2; U1–U3 k1,p1; U6–U7 k2,d3; U6–U8 d3,p1; U7–U8 d3 — rule 2 keeps no ring edge, both rings vanish); Q ≤ 1 − 1/k by Cauchy–Schwarz (11,500 pieces → 0.99991); refutation of "Q 0.98 = 98% confidence"; volume baseline 2f − f², activity-matched permutation design, (c) transfers inside a component are circular evidence (rule 1 edges are transfers) ⇒ recompute excluding them for the 211 and every draw; FORWARD walk counts to U2 on a 5-user component (lengths 1–4: U1 1/1/3/6, U3 1/1/4/6, U4 0/1/1/5, U5 0/0/1/1), geometric weighting β = 0.3 → converged U1 0.62, U3 0.67, U4 0.22, U5 0.07 (U1's first four terms 0.52); converges for β < 1/λmax, λmax ≈ 2.2; U3 > U1 by degree only; mixed review with economics staffing (p_r = 0.3e^{−r/60}, V €500, C_a €10): q = 0.1 replaces ranks 66–100 (35 calls/day, ~6 days for 211, ~€400/day), q estimated by calling a random 20

## Assumed
- fraud-as-a-graph: P2P dataset and its node/edge types (what-a-fraudster-has-to-reuse), entity resolution and the chargeback scheme (entity-resolution-shared-identifiers-become-edges), café/library deferral
- neighbourhood-and-centrality: dyadicity as a chance baseline (the-two-ratios), node betweenness (betweenness-the-node-every-route-passes-through), walk counts A^k f (counting-walks-with-matrix-powers), identifier degree as degree
- fraud-detection-system: ~100 cases a day (ranking-then-cutting-at-the-capacity)
- economics-of-detection: value of the next call V p − C_a, staffing example (the-value-of-the-next-call) — exercise 7
- course prerequisites: Cauchy–Schwarz, BFS/shortest paths, Python

## Left open
- Decaying multi-hop suspicion score, random walk with restart → guilt-by-association (forward exercise 6, conclusion)
- Union-find as a lab checkpoint → graph-propagation-lab
- Component as an explanation for investigators / connection subgraphs → alert-explanations (not taught here; Akoglu connection subgraph not used)
- WCC-on-ER-edges workflow in the EU monitoring design → eu-transaction-monitoring-design
- Not taught: spectral clustering, overlapping/bottom-up communities and membership exposure, modularity score bands, Louvain tolerance/maxLevels parameters, Leiden, the actors/movies hierarchy numbers, weighted vs unweighted Louvain comparison, degree centrality orientation options, seeded WCC by name, sampled WCC strategy
