# Research brief: adaboost (AdaBoost)

status: planned
module: trees-ensembles
type: core
goal: Compute AdaBoost rounds by hand and derive the algorithm's equivalence to forward-stagewise additive modeling under exponential loss.

## Sources to consult

- ESL **§10.1** — Algorithm 10.1 (AdaBoost.M1 in the textbook ±1
  convention: ε_t, α_t = ½ln((1−ε_t)/ε_t), w ← w·exp(α·1[wrong]));
  **Fig 10.2 gem**: stumps on the χ²₁₀ simulated data — a 45.8%-error weak
  learner boosted toward the Bayes rate over 400 rounds, test error still
  falling after train error hits zero at ~250.
- ESL **§10.2–10.5** — THE equivalence derivation: boosting = forward
  stagewise additive modeling; exponential loss L(y,f)=e^{−yf}; solving the
  stagewise step reproduces α_t and the reweighting exactly (Eqs
  10.8–10.15); why exponential loss (population minimizer = ½ log-odds —
  §10.5).
- Freund & Schapire 1997 — the original: Theorem 6 training-error bound
  ε ≤ 2^T Π√(ε_t(1−ε_t)) ≤ exp(−2Σγ_t²) with γ_t = ½−ε_t (Eqs 21–23);
  NOTE the paper's β_t = ε/(1−ε) convention differs from the textbook α_t —
  flag once; the margin-based generalization story is Schapire et al. 1998
  (cite, do not attribute to the 1997 paper).
- CS4780 **Lecture 19** — AnyBoost view (boosting = gradient descent in
  function space — the bridge sentence to next lesson); the closed-form α
  derivation by minimizing the weighted exponential bound; O(log n) rounds
  to zero training error.
- StatQuest "AdaBoost, Clearly Explained" — the hand-worked stump rounds on
  the heart-disease toy table (chest pain / blocked arteries / weight):
  amount-of-say formula behavior at ε→0, ½, 1. Recreate the mechanics on a
  neutral 10-point dataset.
- Dietterich 2000 — label-noise sensitivity (AdaBoost collapses under 20%
  flips while bagging holds — Tables 1–2); the stagewise-as-implicit-
  regularization experiment (Fig 5) for the "why does it resist
  overfitting" discussion.
- Breiman 2001 Table 4 — the 5%-noise numbers (+43% vs +2%) as the concrete
  noise-sensitivity citation.

## Key points the lesson must cover

1. The weak-learning premise: error ½−γ, barely better than chance; stumps
   as canonical weak learners; contrast with bagging's strong/deep trees
   (bias vs variance division — spiral).
2. **The algorithm, then two full rounds by hand** (L4): 10 points, equal
   weights; stump 1 → ε₁, α₁, reweight (normalize); stump 2 on the
   reweighted data; running combined classifier shown. Every number
   visible; the exercise repeats round 3.
3. α behavior: ε→0 ⇒ α→∞; ε=½ ⇒ α=0; ε>½ ⇒ α<0 (vote flipped) — the
   sanity checks interviewers ask.
4. **The equivalence derivation**: additive model Σα_t h_t built stagewise;
   exponential loss; the stagewise minimization solved in two steps (best
   h_t = weighted-error minimizer; best α = ½ln((1−ε)/ε)) and the induced
   weight update = AdaBoost's — full algebra, this is the lesson's heavy
   middle.
5. **The training-error bound**: ε_train ≤ Πt 2√(ε_t(1−ε_t)) ≤ exp(−2Σγ²);
   read: any persistent edge γ drives training error down exponentially.
6. Test-error behavior: keeps improving after train error is zero — the
   margin explanation in one paragraph (larger margins keep growing);
   overfitting is possible (many rounds on noisy data — Dietterich/Breiman
   noise story); practical knobs: rounds by early stopping/CV.
7. Boosting vs bagging closing table: sequential vs parallel; bias vs
   variance; weak vs strong learners; noise sensitivity; weighted vote vs
   plain vote.

## Interview questions to work as exercises

- "Run one more AdaBoost round on this table." (mechanics set piece)
- "Derive the optimal α for a weak learner with weighted error ε." (the
  ½ln((1−ε)/ε) derivation)
- "Show AdaBoost is stagewise minimization of exponential loss." (the full
  equivalence, guided)
- "A weak learner has ε = 0.5. What does AdaBoost do with it? ε = 0.9?"
  (α=0 / flip the vote)
- "Why is AdaBoost sensitive to label noise while bagging is not?"
  (exponential weights on unfixable points; the +43%/+2% numbers)
- "Boosting vs bagging — five axes." (E3: variance formula spiral from
  bagging-random-forests)
- "Training error is zero at round 250 — why keep boosting?" (margins)

## Pitfalls / subtleties to flag

- TWO conventions circulate: Freund–Schapire's β = ε/(1−ε) with [0,1]
  labels vs the textbook α = ½ln((1−ε)/ε) with ±1 labels. Use the ±1/α
  convention and flag the other once — candidates get tripped comparing
  sources.
- exp(−2Σγ²) bounds TRAINING error; it says nothing direct about test
  error. The margin/generalization theory is a separate (1998) result.
- Reweighting must be normalized each round; hand computations drift
  without it.
- "Boosting never overfits" is folklore and FALSE in noise; state the
  precise observed phenomenon instead (often delayed overfitting on clean
  data).
- Weak learner must beat chance ON THE WEIGHTED distribution — that gets
  harder each round; termination when it can't.

## FIGURE PLAN

1. **`<FigureSequence>` (5 frames)** — two rounds on the 10-point set: (1)
   equal weights, stump 1 drawn, 3 misses marked; (2) weights re-sized
   (area ∝ weight), α₁ tallied; (3) stump 2 chosen on reweighted data;
   (4) α₂, weights again; (5) combined sign(α₁h₁+α₂h₂) region coloring.
   Point sizes are the delta channel. Inspiration: StatQuest rounds +
   Bishop Fig 14.2 idea.
2. **single `<Figure>`** — α vs ε curve with the three sanity-check points
   (ε→0, ½, →1) annotated. One idea: the vote-weight formula's shape.
3. **`<FigureSequence>` (4 frames)** — the equivalence derivation staged:
   (1) stagewise objective with exponential loss; (2) split into fixed
   part (=weights w_i) and new term — the reweighting FALLS OUT; (3)
   optimal h = weighted-error minimizer; (4) solve dα → α = ½ln((1−ε)/ε)
   boxed. Inspiration: ESL Eqs 10.8–10.15.
4. **single `<Figure>`** — loss-curve overlay vs margin yf: 0/1,
   exponential, hinge, logistic; exponential's explosive left tail
   highlighted as the noise-sensitivity culprit. Spiral of the
   svm-max-margin loss figure with one new curve.
5. **single `<Figure>`** — the Fig 10.2 story recreated schematically:
   train and test error vs rounds; train hits zero, test keeps drifting
   down; second panel with label noise where test turns up. Inspiration:
   ESL Fig 10.2 + Dietterich noise tables.
6. **single `<Figure>`** — boosting vs bagging comparison card: two
   pipelines drawn (sequential reweighted vs parallel bootstrap) with the
   five-axis verdict table beneath.
