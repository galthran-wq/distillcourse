# isolation-forest — ledger

**Problem.** Neighbour scores cost N² in the unsupervised regime and are
blinded by a group of more than k anomalies: can "how many random cuts
isolate a payment" be a score, and why does a small sub-sample help?
Answer: isolation tree (random column, uniform cut between the node's min
and max), path length h(x), averaged over t trees; yardstick
c(n) = 2(H_n − 1) derived from the random-gap recursion; score
s = 2^{−E[h]/c(n)}; sub-sampling clears masking/swamping when anomalies
crowd (best ψ ≈ N/g), but where frauds come in small clumps (ULB) a small ψ buys nothing;
height limit ⌈log₂ψ⌉ with e + c(Size); linear cost; fails on irrelevant
columns (kurtosis selection repairs); label-derived inputs make it no longer
label-free; on the simulator decent AUC, poor AP.

## Explained
- Isolation = separating one point from all others; the cut procedure on a 2-D toy (FigureSequence cuts-1..6, key image cuts-5) — §Cutting a point off from the rest / ### Random cuts, counted
- Why o's path is short: "different" (0.74 beyond the others' max on x, a cut in that gap isolates it) and "few" (nothing near it); uniform-in-value cuts hit sparse tails often (first two cuts removed 9 and 1 points) — same ###
- Opening: recalls both walls of density-and-distance-scores AND its last exercise's part (c): against a random 2,000-row reference all 40 planted rows reached the top 100 (≈2.5 members < k); sub-sampling already cleared masking for kNN, at O(MN) with one reference draw — intro
- Definition: isolation tree (test "q < p", q random, p uniform in node's [min,max] of q; leaf = one point or identical points), path length h(x); n leaves, n − 1 internal; not a decision tree (no labels, no criterion). KeyFact: shift / positive rescaling of a column leaves every path's distribution unchanged (no standardisation needed, unlike neighbour scores); a nonlinear transform (log amount) does change paths — ### The cuts form a tree
- Single tree is noisy (o 1–10 cuts, m 4–22; sd 1.7 / 2.9; m ≤ o in < 1% of trees; next two easiest points 4.9); average over t trees, E[h(x)]; sd/√t (0.53 at 10, 0.17 at 100); default t = 100 (figure convergence.svg) — §One tree is a lottery
- Theorem (with proof): cut at a uniformly random gap ⇒ c(n) = 2(H_n − 1) = 2H_{n−1} − 2(n−1)/n; recursion, difference c(n+1) = c(n) + 2/(n+1); small cases c(1)=0, c(2)=1, c(3)=5/3; H_i ≈ ln i + 0.5772; equals unsuccessful-search cost in a random BST of n−1 keys (one sentence) — §How long is a typical path? / ### A cut at a random gap
- Yardstick assumption: exact only for evenly spread points; Gaussian toy mean path 10.44 vs c(135) = 8.97 (uniform square: 8.83) — ### What the yardstick assumes
- Why not n−1 (typical → 0: 0.067 at 135, 0.0002 at 100,000) or log₂ n (ratio drifts 1.19 / 1.28 / 1.32 at 16 / 256 / 4,096) — ### Why not divide by n, or by log n?
- Definition: s(x, n) = 2^{−E[h(x)]/c(n)}; 0.5 at typical, →1 short, →0 long; n = points per tree (ψ), NOT data size (common bug); Example o 0.75, m 0.39 (figure score.svg); in-body exercise mean path 10.44 → 0.45 (bunched data below 0.5). KeyFact: within one forest s ranks exactly as E[h]; matters across sample sizes; reading approximate — §The anomaly score
- Seam (pointer to the opening's planted 40, numbers not restated): does a crowd lengthen a path as it shortened a neighbour distance, and does a per-tree sample clear it as the 2,000-row reference did? Masking (anomalies numerous and close: paths grow) and swamping in two steps (normal points pressed against an anomaly lengthen its path; those neighbours sit in the sparse fringe too, so their own paths are as short or shorter and they rank beside/above it = false alarms); Mulcross figure (mulcross-subsample.png, landed, credits.yaml; caption describes panels only): 4,096 points (no column count given), each cluster masks itself and is swamped by normal points around it, AUC 0.67 → 0.91 with samples of 128 (stated once, in body) — §Fewer points per tree / ### Two ways a crowd hides an anomaly
- ψ = sub-sample size defined; planted-group experiment on ULB (32,000 rows V1–V28 + g copies at 2× fraud mean, sd 0.05; 100 trees; AP of the planted group): all rows 0.16 / 0.30 / 0.43 for g = 40 / 200 / 1,000; peaks at ψ ≈ 1,024 (0.49), 64–256 (0.80), 16–64 (0.94); rule ψ ≈ N/g (one or two members per sample); too small ψ cannot describe normal data; g = 40 at ψ = 256: all 40 in top 100, median rank 53 (all rows: 21%, median 119; the kNN numbers are given only in the opening, here only pointed to). Same cause for both recoveries: the comparison set holds fewer group members than the score needs — < k for kNN (the 2,000-row reference met it), ≈ 1 for a tree (each extra member adds cuts), so the tree asks for the smaller sample (figure psi-crowd.svg). KeyFact: few in each sample, not in the data; ψ ≈ N/g. What the forest adds: a fresh sample per tree without replacement (100 draws vs one reference), and the sample is the model (≈ c(256) = 10 comparisons per tree vs 2,000 distances in 28 columns). Demo IsolationSplitter placed here with Task (Single outlier: predict A/B/C; Masked cluster: 380 pts, 50 planted among 30 normals, lower ψ until the cluster's forest mean path < normal points' — flips near ψ = 16, N/g ≈ 7.6) — ### How small
- Small clumps, no crowd: ULB frauds in clumps of ~7 (59% of a fraud's 10 neighbours are fraud) ⇒ N/g ≈ 40,000; a 256-sample holds a given clump's member in < 1% of trees (0.006). Five forests per ψ, AP mean (range): 256 0.20 (0.10–0.27), 1,024 0.24 (0.20–0.30), 4,096 0.28 (0.23–0.31), all rows 0.25 (0.24–0.28); AUC 0.95 throughout. Ranges overlap: no best size claimed; 256 gains nothing, lowest mean, widest spread. Default 256 serves because it thins most crowds; without a crowd ψ is a setting chosen on prequential folds — ### When the frauds come in small clumps, a small sample buys nothing
- Height limit l = ⌈log₂ψ⌉ (8 at 256, below c(256) = 10.25; shorter paths exact); truncated leaf with Size points: h = e + c(Size) (figure height-limit.svg, ψ = 8, leaf of 3: 3 + 5/3 = 4.67); in-body exercise A/B/C (10.57 / 3 / 8 → 0.49 / 0.82 / 0.58) — §A partial tree is enough / ### Stopping at depth ⌈log₂ ψ⌉
- Cost: ≤ 2ψ − 1 = 511 nodes; build ≈ tψ log ψ, score ≈ N t log ψ (linear); ULB one core: build 0.2 s, score 284,807 rows 0.9 s (vs ~5 min pairwise, 21 s against 20,000 sample); 12M ≈ 40 s; one payment 100 walks of ≤ 8 comparisons. KeyFact: larger ψ cheap where used — scoring grows with log₂ψ (ψ = 4,096: 12 per tree vs 8), building with ψ log ψ (≈ 24× for 16× sample); 4,096 named as the best ULB mean, not as proven better, paid once per forest — ### What a forest costs
- Irrelevant columns: ULB 50,000 rows + 500 uniform noise columns: AP 0.20 → 0.015, AUC 0.95 → 0.76; kurtosis (tail weight) per tree on its sample, top 28 → picks exactly the V columns, AP 0.16; distance scores suffer too; forest's assumption in framing-table form (few in each sample; differ in value on at least one column) — §Where isolation fails
- Simulator (evaluation lab run, seed 0; CP@100 recalled with a Ref to alert-budget-metrics#card-precision-at-k-the-team-calls-cards and a one-clause gloss; built on days 42–48, 68,898 payments, no labels; scored days 56–62 after known-card removal, 60,212 / 440, 0.73%; ψ = 256, 100 trees, 3-forest means): 12 label-free AUC 0.60 / AP 0.03 / CP@100 0.05; 15 inputs 0.84 / 0.26 / 0.27; LR (labels) 0.89 / 0.63 / 0.33; RF 0.89 / 0.69 / 0.35 — §What an isolation score finds in payments / ### The setup
- Daily top-100 shares (figure sim-scenarios.svg): label-free forest amount>220 42%, terminal 1%, leaked 32%; 15-input forest 15 / 64 / 23%; LR 92 / 66 / 65%; honest top filled by night payments (73% vs 17% of stream: a minority 0/1 column gives short paths); terminal rates are label-built so the 15-input forest reads labels (stated in body). KeyFact: the label-free row (AP 0.03) is the forest's number for a stream without labels; the 15-input 0.26 exists only where labels arrive, where a supervised model gets 0.63. (The handbook's 10-tree benchmark-run result is NOT in the body.) — ### Which frauds reach the top
- Decent AUC, poor AP (Ref reachable region): AUC rewards ordering the bulk, the top 100 is all the team sees. The simulator ψ sweep is NOT in the body (Exercise 5's solution only) — ### A decent ranking, a poor top

## Notation
- o (outlier, (3.2, 2.6)), m (central point) of the toy
- h(x) path length; E[h(x)] mean over trees; t number of trees; n points per tree; c(n); H_n harmonic number; s(x, n) anomaly score
- ψ sub-sample size; l height limit; Size points in a truncated leaf; e depth reached
- N data size, g size of an anomalous group (ψ ≈ N/g rule)
- Exercise 4: R_q range of others on column q, m_q margin, d columns

## Running cases
- Toy: 134 N(0, I) points (seed 3) + o; m nearest the centre; tree seed 22: o cuts y=−1.38 (135→126), x=−2.29 (→125), x=0.24 (→48), y=2.27 (alone); m 12 cuts; 1,000-tree means o 3.75, m 12.08; all-point mean 10.44; c(135) = 8.97; scores 0.75 / 0.39
- Planted ULB groups and ψ sweep as above; ULB ψ sweep; noise table
- Simulator tables as above (the ceiling 0.56 / 50–68 compromised cards a day is no longer used in this lesson)
- Exercises: c(16) 4.70 (exact 4.76), c(256) 10.25, c(4,096) 15.79; s(5) 0.48 / 0.71 / 0.80; ψ = 2 → all s = 0.5, ψ = 3 → 0.66 / 0.44; Ex 2(c): curves with N/g ≫ 16 fall at the smallest ψ (40-row 0.36 → 0.13, 200-row 0.79 → 0.54), the 1,000-row curve (N/g = 32) is flat 0.94 at 16 and 64; rare-combination B (correlation 0.8, 254 pts + A, B): B mean path 6.6, s 0.64, rank 5 of 256 (A 0.61, rank 8); first-cut isolation m/(R+m), o: ½·0.74/6.03 = 0.061, after cut 3 0.74/2.92 = 0.25; group member ≈ lone path + c(g) (c(40) 6.56, c(200) 9.76); simulator ψ sweep AP label-free 0.011/0.017/0.034/0.074/0.088/0.081, 15 inputs 0.036/0.14/0.26/0.31/0.31/0.32 (ψ 16…all); PCA 2 components reconstruction on standardised 15 inputs AUC 0.86 / AP 0.27 (4 comps AP 0.21; label-free 0.085); Exercise 7 (seed-0 label-free forest, CP@100 0.05 = 35 cards/week): figure shares predict 11 + 3 + 38 = 52 fraud payments in top-100 lists (7.4/day); card collapse −8 (leaked card twice in a day) → 44; detected-card removal −14 (leaked cards found earlier) → 30; max label +5 (terminal victims entering via a genuine payment) → 35 = 11 amount / 8 terminal / 16 leaked; 119 leaked frauds belong to 31 cards; strategy choice among kNN / LOF / Mahalanobis / forest (Ex 8(a): deciding properties are the bursts and no clean reference, not time — the pairwise pass is ~10 min; kNN with k ≥ burst size or against a small reference also works)

## Assumed
- density-and-distance-scores: N² cost and its numbers, clump masking, planted-40 exercise (median rank 31,323), ULB clumps (59%), payment B / Mahalanobis, minor-component score, 21 s / 5 min timings
- anomaly-detection-framing: family table, label regimes, compromised-terminal frauds have no label-free departure (context-turned-into-a-column)
- alert-budget-metrics: AP, CP@100, card collapse (max score / max label), detected-card removal, reachable region, benchmark simulator run (five-models)
- delayed-labels-prequential: known-card removal, prequential folds
- point-in-time-features: delayed terminal fraud rate built from labels
- cost-aware-evaluation-lab: its simulator run and deployment geometry (days 42–48 / 56–62)
- canonical-datasets: ULB set, simulator scenarios
- classical-ml: logistic regression, random forest, PCA, ROC-AUC; harmonic numbers / BST as general CS background

## Left open
- One-class boundaries, autoencoder reconstruction error, semi-supervised fusion → one-class-and-reconstruction (forward exercise 6: PCA reconstruction)
- Unsupervised scores on ULB under AP / budget, k-means rule → ulb-unsupervised-scores
- Implementation (c(n), iTree, path length with c(Size), forest, ψ sweep) → anomaly-scorers-lab
- Not taught: extended/rotated isolation forests, streaming variants, the forest's contamination threshold parameter
