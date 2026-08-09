# Research brief: uplift-and-causal-forests (Uplift modeling and causal forests)

status: planned
module: causal-inference
type: core
goal: Estimate heterogeneous treatment effects (CATE) with honest causal forests and evaluate the targeting they imply

The reader's home territory (ML) meeting causal discipline — pace fast,
rigor on the causal deltas: honesty, AIPW, and evaluation (QINI/RATE)
rather than tree mechanics. Sources: Wager & Athey (full), Athey/Spiess/
Wager course (full).

## ARC (L10)

- **Inherits:** Potential outcomes, unconfoundedness intuition (DiD
  lesson), the LATE lesson's closing question ("which users should we
  nudge?"), bandits' segment-blindness.
- **Contributes:** Spine step 8 opens: "estimate the effect as a
  function of the customer." CATE τ(x); why off-the-shelf ML on raw
  outcomes fails (regularization bias, adaptive overfitting); honest
  causal forests with valid CIs; AIPW scores and cross-fitting; and the
  evaluation problem — you never observe individual effects, so
  QINI/RATE and calibration tests replace test-set MSE.
- **Hands off:** policy-learning-and-targeting turns scores into
  decisions with value estimates and constraints.

## Sources to consult

- **Wager & Athey 2018** (estimationan-.txt, full):
  - §2.1-2.2: setup; unconfoundedness + overlap; trees as adaptive
    nearest neighbors.
  - §2.4 + Appendix B: HONESTY — split on one sample, estimate on
    another; the corner counterexample where adaptive CART's bias GROWS
    with n (rare outliers isolated into corner leaves); the
    "re-randomize the split per tree so no data is wasted" resolution;
    Appendix B.1 the optimal-k paradox (adaptive needs k=64, honest
    fine at k=1).
  - Theorem 11: asymptotic normality + infinitesimal-jackknife CIs (the
    headline — state, don't prove).
  - §5: simulations — forest holds MSE flat to d=30 while k-NN degrades
    10×; the 19.2× MSE ratio (course slide).
- **Athey course bookdown** (machinelearn cache):
  - ch.3: AIPW derivation from IPW + outcome model; double robustness;
    cross-fitting ≠ cross-validation; the GSS welfare-wording running
    dataset (the wording flip ~35pt — great business-adjacent RCT).
  - ch.4: pre-specified subgroups + Romano-Wolf/Bonferroni (spiral to
    multiple comparisons); causal_forest workflow; the WARNING pair —
    spread-out CATE histogram ≠ heterogeneity; concentrated ≠ none;
    test_calibration (α mean, β differential) as the omnibus test;
    CATE quintiles with cross-fitted validity; best linear projection.
  - ch.4.3: TOC curve; RATE = ∫TOC; AUTOC vs QINI weightings (QINI =
    Radcliffe 2007 — the uplift-literature bridge); doubly-robust
    estimation + CLT (Yadlowsky et al.).
  - Slides: k-NN circle vs tree rectangle (sourced); QINI curve slide
    (sourced); forest-vs-knn scatter (sourced).
- **Business framing**: uplift modeling = the marketing literature's
  name for CATE-based targeting (retention offers, discounts, nudges);
  the four uplift quadrants (persuadables / sure things / lost causes /
  do-not-disturbs) — folklore taxonomy, present as vocabulary mapped
  onto τ(x) signs and levels (no external source needed; constructed).

## Key points the lesson must cover

1. **The object**: τ(x) = E[Y(1)−Y(0)|X=x]; never observed per person;
   estimable under experiment data (free) or unconfoundedness+overlap
   (stated, with the DiD lesson's selection algebra as the risk model).
   The uplift quadrants as τ(x) vocabulary.
2. **Why naive ML fails**: two separate regressions (T-learner) inherit
   regularization bias into the DIFFERENCE; subgroup hunting on
   significance is multiple comparisons (spiral); adaptive splitting
   overfits noise into "segments" — the Appendix-B counterexample where
   MORE data makes it WORSE (the lesson's jolt).
3. **Honesty + forests**: split/estimate sample separation; per-tree
   re-randomization; subsampled forests → Gaussian limits and
   infinitesimal-jackknife CIs (Theorem 11 stated with its conditions
   named); trees as adaptive k-NN (the sourced circle-vs-rectangle
   diagram's argument).
4. **AIPW/doubly-robust scores + cross-fitting**: the score formula;
   unbiased if EITHER nuisance is right; why cross-fitting is required;
   scores as the universal currency (feeds CATE quintile testing, RATE,
   and next lesson's policy values).
5. **Evaluation without ground truth**: the histogram warnings;
   test_calibration's two coefficients; CATE-sorted quintile ATEs
   (cross-fitted); TOC/QINI/RATE as the ROC-of-targeting with
   doubly-robust estimates and CIs; when AUTOC vs QINI has power
   (concentrated vs diffuse heterogeneity).

## Set pieces and worked examples to recreate

- **The corner counterexample** (Appendix B): τ≡0.1, rare outliers,
  adaptive forest's bias rising with n — recreate as a two-line chart
  (bias vs n, honest flat at 0, adaptive climbing); the "more data
  makes it worse" keeper.
- **k-NN vs forest**: the 19.2× MSE ratio + d=2→30 robustness table;
  sourced scatter slide.
- **GSS welfare-wording experiment** as the worked dataset narrative
  (wording flip ~35pt; then CATE by political views/age — from the
  bookdown's actual analysis).
- **QINI curve read-through**: gain vs fraction treated; where the
  curve's slope crosses cost (next lesson's territory — one clause).
- **The quintile table**: CATE-sorted buckets with AIPW-estimated ATEs
  and the calibration test verdict.

## Pitfalls / subtleties to flag

- Experiment data ≥ observational for this: with an RCT, propensity is
  known and half the assumptions vanish; the lesson's default is
  RCT-collected data (the running case's nudge experiment), with
  observational as the starred extension.
- CIs are pointwise and asymptotic; boundary bias exists (paper's own
  Discussion) — one honest sentence.
- Never rank by t-stat of τ̂(x) (noise ranking); rank by score, judge
  by RATE.
- The uplift-quadrant folklore is vocabulary, not method — say so and
  map it to τ(x).
- grf/EconML named as the production libraries (course used grf);
  keep code pointers, not tutorials.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **ATE hides structure**: one bar (ATE
   +2pt) exploding into a τ(x) histogram spanning −4..+9 with the four
   uplift quadrants labeled on the axis. (Original.)
2. `source:` **machinelearn-partition-circle-vs-tree** — save as
   `knn-vs-tree-partition`. Reader must see: the circle (k-NN) vs the
   axis-aligned rectangle (tree) around the same test point. Placement:
   float-right at the adaptive-neighborhood argument; the inventor's
   own teaching diagram.
3. `draw:` `<FigureSequence>` (4 frames) — **honesty**: frame 1 one
   sample both splitting and estimating — outlier isolated, leaf mean
   corrupted; frame 2 the sample split in two; frame 3 splits from half
   A applied to half B's outcomes — corruption gone; frame 4 forest
   averaging with per-tree re-splits. One change per frame (idea:
   Wager-Athey Procedure 1 + Appendix B).
4. `draw:` single `<Figure>` — **bias vs n, adaptive vs honest**: the
   Appendix-B counterexample's two curves; "more data, worse estimate"
   annotated on the adaptive one.
5. `draw:` single `<Figure>` — **AIPW score dissected** (voita rule 7):
   the doubly-robust score with the outcome-model term and the
   IPW-correction term bracketed; "either one right ⇒ unbiased" as the
   payoff line; cross-fitting folds sketched under it.
6. `source:` **machinelearn-qini-curve** — save as `qini-curve-slide`.
   Reader must see: gain vs fraction treated, three strategies, the
   random-targeting diagonal. Placement: centered in the evaluation
   section; the course's real fitted curves (shapes not reconstructible
   from cached code).
7. `draw:` single `<Figure>` — **the evaluation ladder**: histogram
   (forbidden) → calibration test → quintile ATEs → RATE/QINI, each
   with its one-line verdict of what it does/doesn't establish.

## EXERCISE PLAN

1. Warm-up: none (audience fluency assumed; work starts at judgment).
2. Boundary probe: overlap fails (a segment where everyone was
   treated): show the AIPW weights blow up and τ(x) there rests on
   extrapolation; state the trimming response and what question
   remains answerable (τ on the overlap region only).
3. Claim to refute: "Our uplift model's CATE histogram is wide, so
   heterogeneity is strong — target the top decile." Refute with the
   bookdown's own warning (spread = signal + noise); prescribe the
   calibration test + RATE with CIs; then state when the top-decile
   decision is right ANYWAY (positive RATE with tight CI).
4. Derivation the lesson skipped: show the AIPW score's double
   robustness — take expectations with (a) correct outcome model,
   wrong propensity, (b) the reverse; both give τ. Mark where
   cross-fitting is needed (nuisance independence from the scored
   unit).
5. Research-shaped: reproduce (or verify from the cached notes) the
   Appendix-B experiment's qualitative result — adaptive forest bias
   at the corner point rising from n=1k to n=10k while honest stays
   ~0; report your two bias numbers.
6. FORWARD (E7): with AIPW scores Γ_i in hand for the nudge
   experiment, compute the estimated value of the policy "treat
   everyone with τ̂(x) > 0" as the mean of the chosen-arm scores — and
   note the trap you must avoid (using the same data to pick and to
   value). Solution: policy value, its honest estimation, and the
   thresholding warning are the next lesson; `<Ref>`
   policy-learning-and-targeting.
7. Spaced (E3, multiple comparisons + bandits): (a) why is CATE
   estimation not "subgroup hunting" — what replaced the 40-segment
   fishing trip (regularized joint estimation + honest inference)?
   (b) restate the bandits lesson's segment-blindness in τ(x) terms.
