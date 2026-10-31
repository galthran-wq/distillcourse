# guilt-by-association — ledger

**Problem.** A never-flagged cardholder paid at shops where stolen cards
paid: how much suspicion should reach them, how far, how fast it fades,
computed nightly for a million nodes and for a payment arriving after the
night's run? Answer: the relational neighbour rule (one hop) and its
repetition fail (no distance discount: plain repetition sends every unknown
node to 1); a random walk with restart at the confirmed frauds,
ξ = αQξ + (1−α)e, sums paths of every length with weight α^k, divided at
each step by the strength left (busy intermediate nodes no longer multiply
the score, scores bounded, sum 1, any α < 1 converges); the endpoint's own
strength still multiplies it (ξ = Sp; p = S⁻¹ξ is the per-link reading);
plain PageRank (uniform restart) measures
activity; computed by power iteration (one sparse pass per step, error ×α);
run on the column-normalised tripartite card graph with age-weighted
restart on confirmed fraud payments, three horizons → nine columns at
midnight; new pair scored by the local update ξ_c/(s_c+1) + ξ_m/(s_m+1);
on real card data the nine columns are weak alone (AUC 0.920) and add ~3
AUC points beside history (0.953 → 0.986), correlation ≤ 0.1.

## Explained
- Why one-hop columns score the opening's cardholder 0 (its tripartite neighbours are its own payments); walk counts grow with degree (Ref communities exercise); five requirements incl. "not reward busyness, on the path or at its end" — intro
- Definition relational neighbour classifier P(fraud|v) = (1/Z) Σ_{fraud nbrs} w_vu, Z = weight to labelled neighbours = s_v when non-fraud counts as legit; 2/5 example; decay weights change it (in-body exercise 0.9, 0.1 vs 0.2, 0.2, 0.1 → 0.67) — §One hop with weights
- Probabilistic relational neighbour (neighbours' probabilities from a local model or a previous round), 0.45 example (FigureSequence neighbour-1..2); homophily gate recalled (Ref which-way-a-fraudulent-neighbour-points) — ### Neighbours that carry probabilities instead of labels
- Collective inference defined; plain repetition converges every unknown node to 1 on a connected graph (no distance discount) — ### Repeating the rule: collective inference
- Column-normalised Q_ij = w_ij/s_j, Q = W S^{-1} (column index = where the walker comes from); walker step x → Qx; restart vector e; Definition random walk with restart / PageRank (uniform e), α = 0.85; expansion ξ = (1−α) Σ α^k Q^k e (paths weighted α^k, divided by strength at each step); β-sum needs β < 1/λmax, set by hubs (star of 400 leaves: λmax = 20, β < 0.05); Q columns sum to 1 → Q^k e probability vectors, converges for any α < 1, scores sum to 1, α chosen for reach alone — §Following a walk / ### A walker who follows edges and sometimes restarts
- Endpoint strength survives the division: five-user component (U1–U2, U1–U3, U2–U3, U3–U4, U4–U5, restart U2, α .85) ξ U2 .322 U3 .282 U1 .217 U4 .125 U5 .053 (β-sum had U3 .67 U1 .62); explanation by "doors" (U2 hands U1, U3 equal halves; U3 has two other incoming edges, U1 one); ξ/s: U1 .108 > U3 .094; pointer to Remark p = S⁻¹ξ — ### What the division leaves: the endpoint's own strength
- Proposition (with proof): without restart stationary distribution s_v/2M on undirected graph (uniqueness on a connected graph stated in plain words, not proved); toy plain PageRank A first, corr with degree 0.97, Q second (two leaves); KeyFact plain PageRank = activity (figure degree-scatter.svg) — ### Plain PageRank ranks by degree
- Definition exposure score (restart e = f/|f|); toy ranking D .169, F .145, E .114, G .109, I .094, A .088 (figure plain-vs-fraud.svg) — §Restarting at the known fraud
- Why G > I (three of four neighbours are restart nodes; I's mass leaves to non-fraud neighbours); within triangle order = degree order; Remark spreading vs averaging: ξ = S p, walk = averaged suspicion × strength; per-degree E .057 > F .048 > D .042; p is the score that put U1 above U3 — ### Why G outranks I
- Directed graphs: walk with the money (whom a mule paid) vs against it (who fed it; transpose), the laundering direction (figure direction.svg); card graph undirected — ### Which way to walk on a transfer graph
- Inversion infeasible (dense inverse 10^12 entries, 8 TB); power iteration ξ^(0) = e, ξ^(k+1) = αQξ^(k) + (1−α)e; Example first step (G .177, D .215); in-body exercise E .162, I .0375, A .053; FigureSequence walk-1..5 (key image walk-5) + Task; Demo RestartWalkPropagator (toggle seeds, step) + Task: default seeds settle from step 6 to D, F, E, G, I, A (G over I), seed pairs {D,I}, {E,I}, {F,I} put I above G, no triangle pair does; contraction argument (‖Qx‖₁ ≤ ‖x‖₁) → unique fixed point, error ×α per step; toy change .78 → .0016 (step 20) → 2e-6 (step 50); Python `exposure(W, seeds, alpha, tol)` with scipy.sparse, stops at the 85th step on toy at tol 1e-9; KeyFact cost and α — §Computing it for a million nodes
- Card graph: walk on column-normalised Q_tri (alternates entity ↔ payment); restart e^{−γh_i} on confirmed fraud payment nodes, h = time since confirmed, normalised; Example card toy week graph; FigureSequence tripartite-1..4; in-body exercise step 2 (p2 .137, p1 .561) — §Labels on payments, weights that fade
- Three horizons × (cardholder, merchant, payment) = nine columns; recomputed at midnight, read next day; restart vector only confirmations arrived (Ref point-in-time rule); scores sum to 1 so shrink as graph grows → multiply by night's node count; ranking not probability — ### Three horizons, nine columns, computed at midnight
- Local update for a new pair: new edges weight 1, walker at c moves to new payment w.p. 1/(s_c+1) → ξ_new ≈ ξ_c/(s_c+1) + ξ_m/(s_m+1) (α dropped, same for all); Example c3–m1 0.066 vs full rerun 0.075 (figure cold-start.svg); in-body exercise c2–m2 0.048; existing pair = most recent payment's score (that payment node sits between the same endpoints, already scored); new entity = 0 — §A payment the graph has not seen
- Evaluation setup (L0g): Belgian issuer, ~3.3M payments, 5 weeks, ~48,000 frauds (~1 in 70), labels within 2 weeks, refused and > €5,000 dropped; weeks 1–2 history only, weeks 3–4 training (2.2M), week 5 test (~500k), RF 500 trees each on all frauds + 2× genuine; 9 exposure + 60 RFM + customer/location; AUC: network only .920, RFM+customer .953, +country/currency/averages .955, all .986, correlation ≤ 0.1 (figure ablation.svg); critical reading: AUC over unreachable FPRs (Ref alert-budget-metrics), 87% recall at 1% FPR ≈ 700 genuine alerts/day, no delay block (Ref delayed-labels-prequential exercises: weeks 3–4 trained on labels not yet arrived), unstated point-in-time restart — ### Five weeks of a card issuer
- Signs in an LR on same columns: month cardholder and payment exposure +, month merchant exposure − (reading offered, not shown: merchant mass ∝ strength) — ### What the signs say
- Anticipating (high exposure, no direct fraud link) and forgiving (old link decayed) effects on a company–resource social-security graph; top-100 frauds over three years baseline 24/19/13 vs with network columns 44/37/44 (trained one date, scored the next); figure gotcha-exposure-anticipating-forgiving.png (exposure vs direct fraud links, R² .87, anticipating/forgiving outliers); KeyFact exposure = columns, uncorrelated, ranking not probability — ### Anticipating and forgiving
- ★ iterative classification, relaxation labelling, Gibbs sampling (burn-in), loopy belief propagation; exact inference NP-hard, no convergence guarantee, order-dependent; RWR the exception (contraction) — §★ Other collective inference procedures

## Notation
- w_vu edge weight, s_v strength (from communities-and-components), N(v) neighbours, Z normaliser
- W weight matrix, S = diag(strengths), Q = W S^{-1} column-normalised (Q_ij = w_ij/s_j; NOTE toy node Q is a different thing, written as "node Q")
- α follow probability (0.85), 1−α restart probability; e restart vector (sums to 1); ξ score / exposure vector; ξ^(k) k-th power-iteration iterate; f fraud indicator (from neighbourhood), |f| count
- p = S^{-1} ξ averaged suspicion (Remark only); π_v = s_v/2M stationary (Proposition); M total edge weight
- γ, h decay (from fraud-as-a-graph); here h_i in the restart = time since confirmation
- Local update: ξ_{p6} ≈ ξ_c/(s_c+1) + ξ_m/(s_m+1)

## Running cases
- 20-node toy (edges as in neighbourhood ledger; fraud D, E, F, I): exposure at α 0.85 A .0877 B .0635 C .018 D .1685 E .1144 F .1452 G .1094 H .0236 I .0941 J .0112 K .0396 L .017 M .017 N .0344 O .0206 P .0058 Q .0112 R .0032 S .0032 T .0124 (matches the source table exactly); plain PageRank A .1084 Q .0755 I .0706 D .0684 G .0671 O .0667 … (corr with degree .97); α 0.5 → I above G; α .999 → A first; seeds {D,I}, {E,I} or {F,I} put I above G
- Five-user component (from communities-and-components exercise), restart U2: ξ U1 .2169 U2 .3222 U3 .2824 U4 .1253 U5 .0532; ξ/s U1 .1085 U2 .1611 U3 .0941 U4 .0626 U5 .0532; iterates step 1 (.425, .15, .425, 0, 0), step 2 (.184, .451, .244, .120, 0)
- Iterates: step 1 D .215 F .197 G .177 E .162 A .053 I .0375; step 2 D .215 F .189 E .139 G .117 I .113 A .061
- Card toy (fraud-as-a-graph, week weights, fraud p1): converged p1 .324, m1 .186, c1 .175, p3 .114, p2 .088, c2 .052, m2 .037, p4 .008, p5 .007, m3 .006, c3 .003; strengths c1 1.56 c2 1.08 c3 .70 m1 1.88 m2 .59 m3 .87; step 1 c1 = m1 = .425, p1 .15; step 2 p1 .561 p3 .175 p2 .137 c1 = m1 .064; c2/c3 ≈ 18×
- New payment p6 c3–m1: local .066, rerun .075 (rerun: c3 .042, m1 .184, p1 .284); c2–m2 local .048
- Exercises: 4-node a–b, b–c, c–d, b–d seed a: steps (.15,.85,0,0), (.391,.128,.241,.241), (.186,.537,.139,.139), limit (.256,.375,.185,.185); error ≤ 2α^k → 90 steps for 1e-6, error ≤ α/(1−α) × last change (5.7×); Elliptic design: no edges between steps → within-step masked-seed test, AP vs floor and degree; GCN form H' = σ(ÂHW1 + XW2) with Â = Q, W1 = α, W2 = 1−α (skip connection); δ = 7 timeline (merchant compromised day 0, frauds days 0–2, confirmed +7; day graph never, week graph nights 7–8, month graph from night 7; horizons ≤ δ seeded only by fast, model-selected labels)

## Assumed
- communities-and-components: components label all alike (conclusion), walk-count exercise with β and U1/U3 (exercises), strength s_v (counting-edge-ends)
- neighbourhood-and-centrality: relational-neighbour rounds exercise (exercises), homophily gate D(n1−1) > H n1 (which-way-a-fraudulent-neighbour-points), G next fraudster or victim (reading-the-table), link columns / relational LR (link-columns-for-a-regression), one-hop fraud degree (degree-split-by-the-neighbours-labels), A^k f
- fraud-as-a-graph: tripartite Q_tri and card toy (the-tripartite-graph), decay e^{−γh} and horizons (choosing-the-decay-from-a-horizon), sparse storage (matrix-or-list-what-the-graph-costs-to-store)
- point-in-time-features: labels arrived by t_i (two-ways-a-training-row-can-know-too-much)
- fraud-detection-system: deadline (the-deadline-splits-the-work-in-two), fast labels on alerted cards (investigators-fast-labels-on-the-alerted-cards)
- alert-budget-metrics: reachable FPR (how-much-of-the-curve-a-hundred-alerts-can-reach)
- delayed-labels-prequential: the five-week split with no delay block (exercises)
- transaction-aggregates: RFM history columns; behavioural-profiles: missing-not-zero (how-much-history-the-arc-needs); canonical-datasets: Elliptic structure
- prerequisites: sparse matrices, Markov chain stationarity, power iteration, scipy.sparse (irreducibility not named)

## Left open
- Learned aggregation, skip connection, two-hop layers → graph-neural-networks (conclusion + forward exercise 6)
- Exposure as one column on Elliptic, within-step evaluation → elliptic-illicit-nodes (exercise 5 design only, nothing run)
- Sparse Q construction, walk, toy ranking in code → graph-propagation-lab
- Nightly recomputation + local update inside the scoring path → real-time-scoring-architecture
- Short-horizon seeds from model-selected fast labels → alert-feedback-selection-bias (exercise 7)
- Choosing α on validation folds named only (exercise 2)
- Not taught: TrustRank/Anti-TrustRank by name, belief-propagation equations, personalised PageRank approximations (push algorithms), the APATE γ values (inconsistent units in the source; the course's own γ from fraud-as-a-graph is used), the 0.971 first-transaction AUC, exposure magnitudes table
