# Guilt by association: relational classifiers and random walks with restart — research brief

Lesson: `guilt-by-association` (module: graphs, core, planned). NEW.
Goal: Derive the fraud-personalised PageRank as a random walk with restart on the transaction graph, implement it by power iteration with time-decayed weights, and explain why plain PageRank is useless for fraud.

## Sources
- Baesens Ch5 pp.233–238 and 246–257 (primary): relational neighbour P(c|n) = (1/Z) Σ w(n, n_j) over neighbours of class c — 2 fraud, 3 non-fraud → 2/5, 3/5 (Fig 5.16); probabilistic RN with neighbours' probabilities → 2.25/5 = 0.45 (Fig 5.17); relational logistic regression / link features (Lu & Getoor); PageRank PR(A) = α Σ PR(i)/D_out,i + (1 − α)e_A; matrix form r = αAr + (1 − α)e with column-normalised A; power iteration not inversion; α = 0.85; fraud PageRank: restart vector e = 1 on known fraud nodes normalised; output a ranking not a score; plain PageRank correlates with degree (Fortunato 2008) and is useless; personalised ranks D, F, E, then legitimate G above fraudulent I (Table 5.12); Gibbs sampling (burn-in, counts over iterations), iterative classification, relaxation labelling, loopy belief propagation in a paragraph each; Table 5.13 both PageRanks side by side; Gotcha! (pp.270–277): bipartite company–resource network, intrinsic + direct egonet + indirect propagated exposure, temporal weighting, anticipating and forgiving effects, propagation alternating spreading and absorbing between companies and resources, Random Forest, out-of-time ROC, top-100 precision 24% → 44% (t1), 13% → 44% (t3), up to 71% counting bankrupt firms.
- APATE Sec. 3.2.2–3.2.3 (primary): GOTCHA propagation ξ_k = αQ_norm ξ_{k−1} + (1 − α)z_norm, α = 0.85 (Eq. 2); the tripartite Q_tri = [[0, M], [Mᵀ, 0]] column-normalised (Eq. 3–4); starting vector z with exp(−γh) on confirmed-fraud transaction nodes, zero elsewhere, normalised (Eq. 5); power iteration to convergence; exposure per cardholder / merchant / transaction; nodes absent from the window get 0; repeat pairs use the most recent transaction's score; local update for a new pair ξ_tx = ξ_cch/(Σ_j w_ij + 1) + ξ_mc/(Σ_j w_kj + 1) with new edge weight 1 (Eq. 6); nine features (TX, CCH, MC × LT/MT/ST), recomputed at midnight; Sec. 4.2 Table 5 ablation: network-only AUC 0.920; RFM-only 0.953; all 0.986; max correlation 0.1 between the sets; Table 1 exposure means tiny (merchant 0.063, transaction 1.1e-3) because z sums to 1; Sec. 4.2 signs: LT merchant score negative, LT transaction and cardholder positive; the γ typo (α written for γ) noted.
- Akoglu Sec. 2.1.1 (PageRank random walk with damping; PPR/RWR with restart node q, step probability (1 − α)/d_u; high for nodes with many short high-weight paths; SimRank; Katz), Sec. 2.1.2 (bridge nodes via PPR normality), Sec. 2.2.3 (collective classification local vs global; LBP; no convergence guarantee; linear in edges), Sec. 5.7 (TrustRank from trusted seeds decaying with distance and out-degree; Anti-TrustRank backward from spam seeds along in-links; combination), Sec. 5.2–5.3 (RMN + LBP with heterophilous vs homophilous compatibilities; rules as priors in SNARE), Sec. 5.5 (trustiness/honesty/reliability HITS-like recursion).
- CS6890 PS2 (lab canon): TrustRank over a payment graph from a separate file of bad nodes.
- Neo4j L5: guilt by association as prioritisation, validated by volume — recall.
- Weber Sec. 3.2: GCN as the learned relative (forward).

## Key points
1. The simplest relational classifier: RN on the 20-node toy (2/5, 3/5); probabilistic RN (0.45); link features in a logistic regression — all one-hop; the failure: a node whose neighbours are unlabelled or whose fraud is two hops away.
2. Random walk with restart: define the walk (follow an edge with probability α, restart at z with 1 − α); stationary distribution ξ = αQξ + (1 − α)z; derive the closed form ξ = (1 − α)(I − αQ)⁻¹z and why power iteration is used instead (sparse, n in millions); convergence (spectral radius of αQ < 1); interpretation as the expected number of visits discounted by hops — "many short, heavy paths to a seed".
3. Plain vs personalised: uniform z gives PageRank, which tracks degree (Table 5.12: I ranked low); z on fraud nodes gives exposure; the toy worked by hand for two iterations and the ranking D, F, E, G > I read off; what G's position means (guilt by association, not proof).
4. APATE's construction: the tripartite Q, z from labelled fraudulent transactions decayed by age, the three time scales, nine features, midnight recompute; the cold-start local update (Eq. 6) derived from one step of the iteration; the ablation (0.920 alone; +0.033 AUC on top of RFM with correlation ≤ 0.1); signs of the LT scores (merchant negative, cardholder positive).
5. Gotcha's bipartite propagation (companies ↔ resources), temporal decay, anticipating and forgiving effects (exposure high with no direct fraud link; low despite an old one), the top-100 precision table (24% → 44%).
6. The family beyond RWR: TrustRank/Anti-TrustRank (forward trust from good seeds vs backward distrust from bad seeds along in-links — the payment direction matters), belief propagation with compatibility matrices (homophily vs heterophily from fraud-as-a-graph), Gibbs/iterative classification/relaxation labelling — one paragraph each; "guilt by association" fails under heterophily unless the compatibility says so.
7. ★ Starred: SimRank and Katz; the HITS-like trustiness recursion; the closed-form linear solve as a sparse system (conjugate gradient).

## Set pieces & gems
- 2/5, 3/5 → 0.45: the one-hop ladder.
- Table 5.12: plain PageRank useless; personalised puts G above I.
- ξ = αQξ + (1 − α)z: the module's key result; power iteration as the algorithm.
- The cold-start update Eq. 6 — a one-step walk for a transaction nobody has seen.
- Network-only AUC 0.920; correlation ≤ 0.1 with RFM; 0.953 → 0.986.
- Anticipating and forgiving effects (Gotcha).
- exp(−0.004·168) = 0.51 — carry the sanity check.

## Pitfalls
- Q column-normalised (APATE) vs row-normalised (some texts): fix one convention and keep the iteration's matrix side consistent.
- z must be normalised to sum 1 or the exposure scale drifts; say so (Table 1's tiny means).
- The toy has 20 nodes; the lab verifies against it — keep its labels and layout fixed to Baesens' Fig 5.13.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of power iteration on the 20-node toy: (1) z on the fraud nodes, (2) after one step mass spreads to neighbours, (3) after three steps, (4) converged with node sizes ∝ ξ and the ranking D, F, E, G, I written. Key image. Inspired by Baesens Figs 5.23–5.24 (recreated).
- draw: Plain vs personalised PageRank as two near-identical panels of the same toy coloured by rank, with I and G's positions labelled in both (voita rule 8).
- draw: The iteration formula dissected in place: ξ = αQξ + (1 − α)z with "follow an edge" / "restart at a fraud seed" labels and the two terms colour-bound to the figure's arrows (voita rule 7).
- draw: APATE's tripartite propagation: a cardholder, a merchant, three transaction nodes (one labelled fraud, amber), the exposure flowing fraud-tx → cardholder & merchant → their other transactions — a 3-frame sequence.
- draw: The cold-start local update: a new cardholder–merchant pair with their exposures and degrees, the new transaction's score computed from Eq. 6 — formula dissected over the mini-graph.
- source: fraudanalyti-s5-gotcha-roc — stem `gotcha-out-of-time-roc`; the reader must see the network-feature ROC lying above the intrinsic-only baseline mainly at low false-positive rates; float right beside the Gotcha paragraph (measured result on proprietary data; crop the plot from the page render).
- draw: Exposure vs number of linked fraudulent companies as a schematic scatter with the anticipating (high, zero links) and forgiving (low, one old link) points marked — a house-style idea drawing inspired by Gotcha Fig 5.36 (the page capture exists but is unverified; prefer the drawing).

## EXERCISE PLAN
1. Warm-up: on a 5-node graph with one seed, run two power iterations by hand with α = 0.85 and report ξ.
2. Derivation the lesson skipped: show that ξ = (1 − α)Σ_k α^k Q^k z, hence the exposure of a node is a hop-discounted sum of walks from the seeds; derive the convergence rate from the spectral radius of αQ.
3. Boundary probe: α → 0 (exposure = z, no propagation) and α → 1 (plain PageRank's stationary distribution, degree-driven, seeds forgotten); state what α = 0.85 buys and what the toy's ranking does at each extreme.
4. Claim to refute: "A merchant with high long-term exposure is a fraudulent merchant." Refute with APATE's sign finding (LT merchant score negative in the LR) and the fraud-volume mechanism (big merchants absorb exposure); name what the feature measures (visited by fraud mass) vs what the claim asserts.
5. Research-shaped: reproduce Table 5.12's ranking on the 20-node toy by power iteration (α = 0.85) for plain and fraud-personalised PageRank and confirm G above I.
6. FORWARD (E7): on the toy, compute for each node the vector (own feature, mean of neighbours' features) and fit a logistic regression on the labelled nodes — the reader has built a one-layer aggregation with learned weights → lands on `graph-neural-networks`' GCN layer and Skip-GCN.
7. Mixed review (E3): compute the module-3 delayed terminal risk and the APATE ST merchant exposure for the same simulated terminal over its compromised window; state what the exposure adds (the cardholders' other terminals) and what the risk feature adds (the label delay).

## ARC
- Inherits: the graph, the tripartite trick, homophily (fraud-as-a-graph); features and components (graph-features-and-communities).
- Contributes: propagation — RN, RWR/personalised PageRank with the closed form and power iteration, APATE's exposure features, the collective-inference family and its homophily assumption.
- Hands off: the learned aggregation (graph-neural-networks); the Elliptic read; the lab's restart-walk checkpoint; the capstone's graph layer.
- Spine step 6: the graph around the transaction.
