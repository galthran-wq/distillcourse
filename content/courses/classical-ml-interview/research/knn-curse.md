# Research brief: knn-curse (k-nearest neighbors and the curse of dimensionality)

status: planned
module: foundations
type: core
goal: Apply k-NN as a bias–variance dial and quantify why distance-based methods fail in high dimensions.

## Sources to consult

- CS4780 (Weinberger), **Lecture 2 "k-Nearest Neighbors / Curse of
  Dimensionality"** — the spine: k-NN rule, Bayes optimal classifier as the
  floor, the Cover–Hart theorem (1-NN error ≤ 2× Bayes error as n→∞, with
  the full proof), the unit-cube edge-length table (d=2→0.10, d=10→0.63,
  d=100→0.955, d=1000→0.9954), the "n = k·10^d points needed — more than
  electrons in the universe" aside, pairwise-distance histograms, and the
  hyperplane-distance exception.
- ESL **§2.5** — curse quantified: e_p(r)=r^(1/p); "capture 10% of the data
  in 10-d requires 80% of each coordinate's range"; median-distance-to-
  nearest-neighbor formula d(p,N) = (1−(1/2)^(1/N))^(1/p) with the N=500,
  p=10 → 0.52 number; Fig 2.6. Also §2.3 for 15-NN vs 1-NN on the mixture
  data, and §13.3 for practical k-NN.
- Bishop **§1.4** — the sphere-shell fact: fraction of a D-ball's volume
  within ε of the surface is 1−(1−ε)^D → 1 (Eq 1.76).
- ISLP **§2.2.3** — KNN as the Bayes-classifier approximation; the k=1 vs
  k=100 boundary comparison figure.
- Huyen **§8.1** — interview calibration for k-NN questions (choosing k,
  complexity, failure scenarios).

## Key points the lesson must cover

1. The rule: majority vote (classification) / average (regression) among the
   k nearest points; distance choice (Euclidean/Minkowski); ties. Worked
   micro-example on a 6-point table computed by hand (L4).
2. **k is the bias–variance dial**: k=1 → zero train error, jagged boundary,
   high variance; k=n → predict the majority class, high bias. Spiral link to
   bias-variance lesson; typical selection by CV (forward ref).
3. The Bayes classifier argmax_y P(y|x) and Bayes error as the irreducible
   floor (concept introduced here, reused in metrics/lda lessons); Cover–Hart:
   1-NN ≤ 2× Bayes asymptotically — statement plus proof sketch (the
   neighbor's label is a draw from ~the same conditional).
4. **Curse of dimensionality with real numbers**: the edge-length table; the
   80%-of-range-for-10% fact; distance concentration (all pairwise distances
   similar → neighbors not meaningfully near). The sphere-shell computation
   as a worked example.
5. Consequences and mitigations: feature scaling is mandatory (one feature in
   km dominates one in mm); dimensionality reduction (PCA forward ref);
   feature selection; metric learning one sentence. When k-NN is actually a
   good answer: low-d, cheap training, non-parametric baseline.
6. Complexity: train O(1), predict O(nd) — the inverted cost profile; KD-tree
   one-sentence pointer (fails in high d).

## Interview questions to work as exercises

- "How do you choose k? What happens at k=1 and k=n?" (bias-variance answer,
  spaced review of the decomposition — E3)
- "Compute the 3-NN prediction for this query on this 6-point table." (hand
  execution)
- "Why does k-NN degrade in high dimensions? Give a quantitative argument."
  (edge-length or sphere-shell computation)
- "k-NN vs k-means" disambiguation (the perennial confusion; one is
  supervised prediction, the other unsupervised partitioning — forward ref).
- "Your k-NN model performs badly after you add 50 features. Why, and what do
  you do?" (curse + scaling + selection)
- Compute the sphere-shell fraction for ε=0.01, D=500 (numbers land near 1).

## Pitfalls / subtleties to flag

- Cover–Hart is asymptotic (n→∞); at finite n in high d the premise "the
  nearest neighbor is close" already fails — the two results are in tension,
  say so explicitly.
- Distance concentration does not mean *all* high-d data is hopeless: data on
  low-dimensional manifolds (the hyperplane exception in CS4780) is why
  real-world k-NN sometimes works; one Remark.
- Even k values and ties; weighting by inverse distance as the common patch.
- Normalize features BEFORE computing distances; interviewers plant this.

## FIGURE PLAN

1. **single `<Figure>`** — the hand-worked query: 2D scatter of 6 labeled
   points, query star, circles marking the 3 nearest, vote tally. One idea:
   the whole algorithm in one picture.
2. **single `<Figure>`** — k-NN boundaries at k=1 vs k=15 vs k=51 on the same
   two-class data, three panels: noise islands → smooth → oversmoothed.
   Inspiration: ESL Figs 2.2–2.3 / ISLP k comparison.
3. **single `<Figure>`** — test/train error vs 1/k (flexibility axis): the
   U-curve reappearing for k-NN, train error hitting 0 at k=1. Spiral figure
   reusing the bias-variance U-curve template.
4. **single `<Figure>`** — edge-length curves e_p(r)=r^(1/p) for p=1,2,3,10
   with the (10%, 80%) point called out. Inspiration: ESL Fig 2.6.
5. **`<FigureSequence>` (3 frames)** — sphere shell filling up: annulus of
   width ε in d=2, thick shell in d=10, nearly-everything shell in d=100,
   with 1−(1−ε)^D values as tallies. Inspiration: Bishop §1.4.
6. **single `<Figure>`** — pairwise-distance histograms in d=2 vs d=100
   (simulated uniform cube): spread-out vs concentrated spike; label "nearest
   ≈ farthest". Inspiration: CS4780 lec 2 histogram figure.
