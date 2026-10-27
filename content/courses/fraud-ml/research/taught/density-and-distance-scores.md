# density-and-distance-scores — ledger

**Problem.** A k-th neighbour distance ranks an outlier beside a dense group
below every point of a sparse honest group: how to score distance relative
to the local crowd, what it costs, what it cannot see, and what the
statistical versions (z, fence, Grubbs, Mahalanobis, PCA score) assume?
Answer: k-th neighbour distance / radius count = inverse density estimate,
needs k ≥ size of any anomalous group; O(N²) when the set is scored against itself (unsupervised regime; LOF's reference densities), with pruning / indexes /
sub-sampling; LOF compares a point's density with its
neighbours' (≈1 inside any normal group); both blinded by fraud clumps of
size > k (fix: k ≥ group size or a reference believed clean; bracket: largest anomalous group ≤ k < smallest honest group, may not exist); clustering = same
idea against K centroids, fitted to last month or to the scored data, three assumptions; small-cluster score catches organised fraud (PaySim) but ranks rarer honest clusters first; statistical scores attach a
probability under a Gaussian; Mahalanobis = Σ y_i²/λ_i = major-component
score (first q, along the leading subspace) + minor-component score (rest,
off it); the low-variance directions hold the rare combinations of common
values, so only the minor half (= framing's subspace family) sees them.

## Explained
- Feature space = the course's feature table, payment = point; recalls framing's NN assumption and its forward exercise (planted point 51st of 551) — intro
- Standardise before any distance: €1,000/5 d vs €1,500/10 d, Euclid ≈ 500.02, Manhattan 505, recency ignored; standardise with reference-period mean/sd (Ref neural-tabular scaler); sd €400 / 4 d → 1.25 and 1.25 — §Distance to the k-th neighbour / ### The columns have to share a scale
- Aside: simple matching (2/5) vs Jaccard (1/4) on red flags; 100 flags, ~5 raised → SMC ≈ 0.9 for every pair — same ###
- 1-NN fails (declined fraud retried: near-duplicate rows; two frauds of one scheme); k-th neighbour distance; figure kcurve.svg (1,000 Gaussian points + twin pair + 6-point cluster: twin ranks 794th of 1,008 at k=1, 2nd at k=2; cluster member hidden until k=6). KeyFact: group of g anomalies seen only when k ≥ g (caption only describes the jumps) — ### One neighbour hides too much
- Definition: k-distance r_k(x), neighbour set 𝒩_k(x), k-th neighbour score, radius-count score 1/n(x,r); k/r_k^p = density estimate ⇒ the family is a density estimate, predicts the varying-density failure — ### Counting within a radius
- Cost: section opens on the unsupervised regime (Ref framing label regimes: no separate reference, every payment vs all others, N(N−1)/2, ×16 per ×4 data); one new payment vs a fixed reference = linear scan. (LOF's own quadratic need is stated in the LOF section, after its Definition.) ULB first named here with Ref canonical-datasets + reminder (two days of European card payments, V1–V28 PCs). Measured 32,000 ULB rows, V1–V28 unstandardised, brute force one core 3.7 s ⇒ day of 400,000 vs itself ~10 min; 30-day 12M vs itself ~6 days; for comparison each new payment vs 12M ~0.04 s, ~5 core-hours/day — §What the score costs
- Pruning for the top 500: random order, cutoff c = 500th best, scan reference in random order, abandon once current k-th distance < c; near-linear on random order; only top gets exact scores — ### Only the top of the ranking is needed
- Index trees degrade with columns; sub-sampling O(MN) (partition pruning cut): all 284,807 ULB rows vs 20,000 sample in ~21 s vs ~5 min estimated full; k-distances inflate, small normal groups lost — ### Fewer comparisons
- Toy (key image density-3.svg, FigureSequence density-1..3 + Task): knot D1–D4 square side 0.2 at origin; sparse S1–S4 = (4,0),(6,0),(4,2),(6,2); u = (10,5); v = (1.0,0.1); k = 2: r_2 knot 0.2, sparse 2, v 0.806, u 6.40 ⇒ kNN ranks u, S's, v — §Two densities, one scale
- Definition: reach_k(x,o) = max(r_k(o), d(x,o)); lrd_k = 1/mean reach; LOF_k = mean lrd(o)/lrd(x); right after it: LOF is quadratic even with a clean reference (needs every reference point's r_k and lrd, recomputed at each rebuild); each piece's reason (mean over k; floor handles near-duplicates inside a cluster, LOF exactly/near 1 inside; ratio cancels region scale) — ### Comparing a point's density with its neighbours'
- Example: lrd knot 5, LOF(v) = 4.03; sparse lrd 0.5, LOF 1; in-body exercise LOF(u) = 2.85 (reach 5 and 6.40, lrd 0.175) — same §
- Framing's 551-point set: planted point LOF_5 = 4.8, rank 1; sparse median LOF 1.1. KeyFact (boundary): LOF ≈ 1 inside a normal group only if the group holds more than k points; a group of ≤ k honest payments takes neighbours from outside and scores as outliers — ### Back to the planted point
- Clumps: 40 card tests at one shop ⇒ each has 39 test neighbours (Ref framing panel c); kNN blind for k < 40; LOF blinder (even a loose clump has ratio ≈ 1) — §A crowd of anomalies is its own neighbourhood
- ULB (setup in body): random 50,000 rows, 78 frauds, V1–V28 deliberately unstandardised, stated as a reversal of §1's standardise rule, in three steps (rotation keeps distances — map analogy; so whatever scaling the processor applied before its PCA is built into the V's and cannot be seen or redone — a raw-euro PCA would leave amount dominating; re-standardising the V's would not fix that: variances 3.8 for V1 → 0.11 for V28, dividing by sd multiplies V28 differences by ~3, V1 by ~0.5, near-constant directions count ~6× more = reweighting by variance, not a unit fix; using the V's as they are stated as a choice, not a guarantee), each row scored against the sample, AP vs labels; a fraud's 10 nearest rows 59% fraud (genuine 0.04%); AP kNN 0.160/0.237/0.217, LOF 0.003/0.044/0.444 at k = 10/50/200; base 0.0016; seeds 1–3 LOF k=10 0.002–0.003, k=200 0.48–0.57 (figure ulb-k.svg) — ### On real card data, fraud comes in clumps
- Two ways out: raise k (price: locality; honest groups of ≤ k look anomalous); score against a reference believed normal (semi-supervised; tonight's tests not in the reference). KeyFact (the bracket): against the data's own rows k must be ≥ largest anomalous group and < smallest honest group; such k may not exist; a clean reference removes the first bound — ### Two ways out
- Aside: COF (connectivity, line-shaped normal), ODIN (in-degree), LOCI (micro-clusters) — named, not taught further
- Clustering: K centroids (K ≠ neighbour k), K distances per payment, NK per k-means pass; ### Which payments the centroids come from: fitted to last month (clean reference) or to tonight's unlabelled data (unsupervised); three assumptions, each with its data (no cluster: DBSCAN on the scored data leaves noise, but 40 tests are a dense region; k-means forces assignment; near centroid: works fitted to last month, fails fitted to tonight's data — tests pull own centroid; small cluster: must be fitted to the set containing the anomalies, cluster size judged against the other clusters; cluster-based LOF combines size and distance); figure clusters.svg — §Clustering
- PaySim K = 8 on 532,909 transfers (Ref paysim exercises): cluster sizes table — smallest 3,891 (1 fraud), 4,159 (4,014 fraud), 23,016 (60), other five 59,287–137,266 (22 fraud); ranked by cluster size the fraud cluster comes second; two smallest = 8,050 rows hold 4,015 / 4,097 frauds (98%); coordinates include after-balances. KeyFact: small-cluster score turns organised fraud's repetition into signal while the scheme is a minority; a rarer honest pattern ranks above it — ### Does the small-cluster score find organised fraud?
- Statistical motivation: neighbour score has no scale/probability — §When "far" has units
- 3σ (99.73%), box-plot fence Q1 − 1.5 IQR / Q3 + 1.5 IQR = ±2.70σ (99.30%) on Gaussian (figure fences.svg); fence not pulled by outliers; extreme value (tail of same distribution) vs anomaly (other distribution, anywhere); raw-amount lower fence below zero ⇒ €1 test never outside — ### One column
- Grubbs' test: G = max|x − x̄|/s vs ((N−1)/√N)√(t²/(N−2+t²)), t = t_{α/(2N),N−2}; α/(2N) = N values both directions; critical G at α 0.05: 2.73 (21), 3.38 (100), 4.04 (1,000), 5.03 (100,000); iterate by removal; |z|>3 gives ~270 false of 100,000 — ### Grubbs' test
- Example on behavioural-profiles' break-point card (old 20 amounts, mean 40.00, s 7.56) + €80: x̄ 41.90, s 11.42, G 3.33 > 2.73 (t 3.50); removal: €55, G 1.98 < 2.71. Masking: +€80, €82, €85 ⇒ s 16.20, G 2.44 < 2.78, nothing flagged; run = level change = break-point's question — same
- Per-column scoring as the obvious multi-column extension: z per column, or *frequency profile* (histogram per column over reference period, score = rarity of the bin), summed. B's values each in a well-filled bin (13% further out per axis), standardised Euclid ranks A above B; the pair is rare (figure combination.svg). This is the ONLY place the per-column-blindness argument is made — §Many columns at once / ### A large payment on a small card
- Mahalanobis: x1 = std log amount, x2 = std log card 30-day mean, ρ = 0.8 (illustrative); A (2.5,2.5) Euclid 3.54 / D 2.64 (D² 6.94); B (1.5,−1.5) Euclid 2.12 / D 4.74 (D² 22.5); Definition D² = (x − x̄)ᵀS⁻¹(x − x̄); p = 1 ⇒ z; diagonal S ⇒ standardised Euclidean; 2-D formula (x1² − 2ρx1x2 + x2²)/(1 − ρ²); χ²_p, 2-D P(D² > c) = e^{−c/2}, 99.7% ⇒ D² ≤ 11.62, D ≤ 3.41 (figure mahalanobis.svg); in-body exercise C (0.5,−0.5): Euclid 0.71, D 1.58 — §Many columns at once
- ULB: V's are PCs ⇒ D² = Σ V_j²/var(V_j); χ²_28 99.7% cut 52.9 flags 15,078 rows (5.3%, 18× promise), holding 431 of 492 frauds (2.9% vs 0.17%): ranking usable, threshold not a confidence level; estimates contaminated by anomalies (→ exercise) — ### What the Gaussian costs on real data
- Theorem (with proof): S = VΛVᵀ, y = Vᵀ(x − x̄) ⇒ D² = Σ y_i²/λ_i; ρ = 0.8: y1 = (x1+x2)/√2 λ1 1.8, y2 = (x1−x2)/√2 λ2 0.2; A: 3.54²/1.8 = 6.9; B: 2.12²/0.2 = 22.5; x1 − x2 = log of the amount ÷ 30-day-mean ratio (Ref transaction-aggregates an-amount-needs-a-reference-point), found from data alone (figure principal.svg); split D² = major-component score Σ_{i≤q} (along the leading subspace) + minor-component score Σ_{i>q} (off it, in units of small variances); q = 1: A 6.9 + 0, B 0 + 22.5; minor score = framing table's subspace family (fails on anomalies inside the subspace, extreme along it); major score blind to B; χ²_q and χ²_{p−q}; robust PCA = components estimated resisting anomalies. KeyFact: rare combinations only through the minor half; leading components alone blind to B however robust — §Where the rare combinations live: principal coordinates
- Synthesis table (score | assumption | misses | cost per new payment) for kNN (misses groups of > k anomalies), LOF (anomalous groups > k; honest groups ≤ k), centroid, small-cluster score, z/fence/Grubbs, Mahalanobis, major-component (pq), minor-component (p(p−q)); opens with Ref to framing table; panels recalled by Ref, only LOF's verdict added (succeeds on ring, fails on panel c more surely) — §Which score for which data

## Notation
- x payment (feature vector), p number of columns, d distance on standardised columns, N reference size
- k neighbour count (budget written as a number in this lesson); r_k(x) k-distance; 𝒩_k(x) neighbour set; n(x, r) count within radius r
- reach_k(x, o), lrd_k(x), LOF_k(x)
- M sub-sample size; K number of clusters
- μ, σ; z; Q1, Q3, IQR; x̄, s; G, α, t (Grubbs)
- S sample covariance, D(x), D²(x) Mahalanobis; ρ correlation; λ_i, y_i, V, Λ (principal components); q = split point (first q = major, last p − q = minor)
- Toy names: D1–D4, S1–S4, u, v; payments A, B, C

## Running cases
- Ten-point toy above: kNN ranks u 6.40, S 2.0, v 0.806; LOF v 4.03, u 2.85, all others 1.00
- Framing's 551-point set (seed 0): kNN_5 planted 0.62 rank 51; LOF_5 4.8 rank 1; at k = 20 a sparse point between the clouds (3.24, 0.88) has LOF 13.9 and the planted point ranks 2 (not in body)
- kcurve dataset (seed 1): N(0,1) 1,000 pts, twin (4, 3.5)/(4.03, 3.5), 6-cluster around (−4, 3.5) sd 0.06
- ULB 50k-sample results; ULB χ² results; timings 0.04 / 0.24 / 3.7 s (2k/8k/32k)
- Break-point card + €80 Grubbs example; three-large-payments masking
- A/B/C Mahalanobis points at ρ = 0.8
- Exercises: 1-D warm-up (0,1,2,3 / 100,110,120,130 / q 7 / r 152; k = 2: q kdist 5 LOF 3.0; r kdist 32 LOF 1.8; edge point 0 kdist 2 LOF 1); toy with sparse group shrunk to S1, S2 (LOF S1 = S2 = 2.98, u 1.78; bracket applied: only k = 1 fits, a retry pair would leave none); unscaled LOF refutation x (1000, 5), a (1010, 30), b (1100, 6), sd €200 / 5 d: raw nearest a (26.9 vs 100), standardised nearest b (0.54 vs 5.0); fence derivation 2.698σ, 99.30%; log-normal(0,1): fence 4.14 → 7.8% above (22× Gaussian 0.35%), mean + 3 sd 8.13 → 1.8% (13× 0.13%), lower fence negative; ULB Mahalanobis all-rows cov AP 0.16 / 18 frauds in top 100 vs genuine-rows cov AP 0.52 / 92 in top 100 (gain from genuine correlations up to 0.17 that the frauds cancel in the all-rows PCA; genuine diagonal variances only: AP 0.17); split at q = 2: major (V1, V2) AP 0.03 / 6 in top 100, minor (V3–V28) AP 0.18 / 22 in top 100 (slightly above the full sum); forward: 40 planted points at 2× fraud mean + N(0, 0.05) in 32,000-row sample: k = 10 best rank 30,945 / median 31,323 of 32,040; k = 50 best 108 / median 128; single copy ranks 63; vs 2,000-row reference k = 10: all 40 in top 100 (best ~30); mixed review: 24-payment window (20 old + 80, 82, 85, 78): t_bp 10.6 (s_p 7.11), Grubbs G 2.22 < 2.80, nothing; strategy-choice items (merchant lunch/evening → LOF; correlated 30 columns → Mahalanobis on clean period; burst at one shop → score against last month; ATM daily totals → Grubbs on logs)

## Assumed
- anomaly-detection-framing: family table and NN assumption (every-detector-family-assumes-one-thing-about-normal-data), planar experiments panels a/b/c (three-planar-experiments), forward exercise (planted point), card testing, semi-supervised regime
- transaction-aggregates: feature table, ratio amount ÷ 30-day mean
- neural-tabular-detectors: standardise on the training block (standardise-on-the-training-block-compress-a-long-tail-first)
- canonical-datasets: ULB set, V1–V28 PCA of undisclosed features (the-ulb-card-set-two-days-with-the-card-removed)
- alert-budget-metrics: average precision (what-the-team-sees-at-each-fraud), base rate
- behavioural-profiles: break-point card amounts and t_bp (an-old-part-a-new-part-and-a-t-statistic)
- paysim-feature-matrix: k-means cluster exercise (exercises)
- classical-ml: k-means, PCA (eigenvalues = variances), standardisation, chi-square and t distributions

## Left open
- Linear-time scoring and sub-sampling as the cure for masking → isolation-forest (conclusion + forward exercise)
- One-class boundary, reconstruction → one-class-and-reconstruction
- Partition-based pruning not taught (cut)
- Full evaluation of unsupervised scores on ULB (incl. k-means cluster rule) → ulb-unsupervised-scores; major/minor split handed there
- Robust covariance estimation (MCD etc.) named only as "a method that resists anomalies"; mixtures of Gaussians for multimodal normal named only via panel (b)
- High-dimensional distance concentration not taught; COF/ODIN/LOCI only in an Aside
