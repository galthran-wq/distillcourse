# Nearest neighbors and the curse of dimensionality — research brief

Lesson: `knn-curse` (module: generalization, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/knn-curse/lesson.mdx (24 min).
Goal: Analyze k-NN as a bias–variance dial and quantify why local methods fail in high dimensions.

## Sources
- ESL §2.5 (curse: edge length r^{1/p}, eq 2.24, Fig 2.6), §13.3 (Cover–Hart 2× bound with the book's Bernoulli-variance proof sketch, eq 13.2–13.4), §13.4 (median-radius formula eq 13.7).
- SSBD Ch. 19: Lemma 19.1–19.2, Theorem 19.3 (finite-sample 1-NN bound ≤ 2·Bayes + 4c√d·m^{−1/(d+1)} under Lipschitz η) and Theorem 19.4 (matching lower bound via NFL-style argument — sample must scale as (c+1)^d). This gives the lesson real theorems, per the depth mandate.
- Murphy §16.1 (KNN posterior estimate; curse arithmetic from HTF: capture 10% of data in d=10 → edge 80% of each axis), §16.3.4 (KNN as balloon-KDE Bayes classifier — starred section candidate).
- ISLP §3.5 (KNN regression degrading with noise dimensions while linear regression barely moves — Figs 3.16–3.20).

## Key points
1. The rule (classification and regression forms), distance choice, and scaling sensitivity; k as the bias–variance dial with the closed form inherited from bias-variance.
2. Cover–Hart: asymptotically, 1-NN's error ≤ 2×Bayes. Give the intuition proof (the neighbor's label is a draw from η(x); error ≈ 2η(1−η) ≤ 2·min(η,1−η) pointwise) — a real result from almost no assumptions.
3. Finite-sample truth (SSBD Thm 19.3): the rate m^(−1/(d+1)) — fine at d=2, catastrophic at d=100. State, sketch the grid-cover proof idea, and read the exponent.
4. The curse in three computations: edge length r^{1/p} (worked: 10 dims, 10% of data → 0.8 of every axis); fraction of volume in the outer shell; median distance to nearest neighbor approaching the data's diameter. Numbers carried in a table (L12: keeper numbers).
5. The lower bound (SSBD Thm 19.4): the curse is information-theoretic, not an artifact of the method — no local rule escapes without assumptions.
6. Escape hatches, named for later: scale features (module 5), reduce dimension (module 8), inject invariance into the metric (next lesson), or abandon locality for structure (modules 3–7).

## Set pieces & gems
- The 1000× replication of ESL's "80% of each axis" number — the single most quotable curse fact.
- ISLP curse exercise (10%-neighborhood fractions 10% → 1% → ~0%) as a worked example.
- SSBD's grid-cover proof figure (d=2, T=5 grid) — recreate for the starred proof sketch.
- Murphy's "KNN was secretly Bayes with a balloon KDE" (§16.3.4) as a ★ section: the heuristic is a generative classifier in disguise.

## Pitfalls
- Don't overclaim the curse: real data escapes via low intrinsic dimension — that honesty IS the hand-off to zipcode-digits.
- Cover–Hart is asymptotic; keep it clearly separated from the finite-sample bound.
- k-NN "training is free, prediction is O(n)" — one sentence, not a systems digression.

## FIGURE PLAN
- draw: k-NN mechanics on 12 points — query point, k=3 neighborhood circle, vote tally; second panel k=11. Two-panel comparison figure.
- draw: The Cover–Hart argument as a picture: at query x, the true η(x) bar and the neighbor's label as a coin with the same bias; error tree computing 2η(1−η). Single Figure.
- draw: FigureSequence (3 frames): the r^{1/p} computation — unit square with a sub-square capturing 10% (edge .32), unit cube (edge .46), then the p=10 bar (edge .80) drawn against the full axis. One changed element per frame. Inspired by ESL Fig 2.6.
- draw: Distance concentration — histograms of pairwise distances for uniform data at d=2, 10, 100 (computed): the histogram narrowing to a spike. Single Figure.
- draw: Test error vs number of added pure-noise dimensions for 1-NN vs linear regression on the same target (ISLP §3.5 idea, recreated) — the practical reading of the curse.
- source: theelements-s1-usps-digits — stem `usps-digits-preview`, reader must see real scanned ZIP-code digits (messy strokes, varying slant); placement: float right beside the closing section that asks why 256-dimensional k-NN works anyway (the hand-off to the application lesson).

## EXERCISE PLAN
1. Warm-up: classify one query by 1-, 3-, 5-NN on a given 8-point table; note the flip.
2. Boundary probe: k = n — show the classifier becomes the constant majority vote, compute its bias/variance; which hypothesis of "locality" died.
3. Derivation skipped: derive the r^{1/p} edge-length formula and evaluate p = 1, 2, 10, 100 at r = 0.01 and 0.1 (make the table yourself).
4. Claim to refute: "adding features never hurts k-NN, since distances only gain information." Refute with the noise-dimension experiment; name the step that fails (distances concentrate; neighbors stop being near).
5. Mixed review (E3): using bias-variance's closed form, find k minimizing bias²+var for a given local linearity bound — the k ~ n^{4/5} flavor computation.
6. Research-shaped: estimate the intrinsic dimension USPS digits would need for 1-NN's observed 5.5% error to be consistent with the m^{−1/(d+1)} rate at m≈7300; compare with 256.
7. FORWARD (E7): compute the 1-NN error on 30 USPS-like digits when images are rotated ±15° vs upright — locality in pixel space fails under rotation. Solution: the tangent-distance fix is the next lesson's subject → Ref zipcode-digits.

## ARC
- Inherits: the bias–variance dial from `bias-variance`; the promise that flexibility's price can be computed.
- Contributes: the most flexible method's exact guarantees (2× Bayes) and its exact failure law (exponential sample cost in dimension) — the first time the course's question gets a quantitative answer for a concrete algorithm.
- Hands off: "why does 256-dimensional k-NN work on real digits at all?" → the application lesson answers with manifolds and invariance.
- Spine step: "A finite sample can be fitted perfectly and teach nothing…" (step 1).

## REVISION (vs old draft)
- Gains: the SSBD finite-sample theorem + lower bound (the old draft has only Cover–Hart and folklore numbers); the Cover–Hart proof sketch; the balloon-KDE ★ section; distance-concentration figure; seams to the new lesson 1 (Bayes error now inherited, not introduced — old draft introduces bayes-error, which stays here as the registry says, but the Bayes *predictor* is lesson 1's and must be Ref'd).
- Loses: interview-question framing; "practical consequences" listicle becomes an argued closing section pointing at named later lessons.
- Demo: keep KnnBoundaryExplorer with the find-best-k task.
