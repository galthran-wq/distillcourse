# Research brief: synthetic-control (Synthetic control)

status: planned
module: causal-inference
type: core
goal: Construct a synthetic control for a single treated unit and test the effect by placebo permutation

One treated unit (a country launch, a policy, a pricing change in one
market) — the everyday business situation with n_treated = 1. Primary
source read in full (Abadie, Diamond & Hainmueller 2007). Demo lesson
(SyntheticControlLab).

## ARC (L10)

- **Inherits:** DiD and parallel trends (difference-in-differences); its
  forward exercise: hand-reweighting donor countries to match a
  pre-trend.
- **Contributes:** Spine step 7's close: "a weighted combination of
  donor states stands in for a California that never passed Prop 99."
  The estimator (convex weights minimizing pre-period mismatch), its
  factor-model justification (DiD nested as a special case), sparse
  interpretable weights, and permutation/placebo inference for n=1.
- **Hands off:** uplift-and-causal-forests changes the question from
  "what was the effect" to "on whom".

## Sources to consult

- **Abadie, Diamond & Hainmueller 2007** (syntheticcon-.txt, full):
  - §II.B: factor model Y^N = δ_t + θ_t Z + λ_t μ + ε; DiD = λ_t
    constant special case; matching condition (eq 2) and asymptotic
    unbiasedness as pre-period grows; single-pre-period AR variant.
  - §II.C: the estimator — min ||X1 − X0·W||_V, W convex; V by
    training/validation MSPE; the extrapolation cost of unconstrained
    weights (footnote).
  - §II.D + §III.D: placebo inference — rerun on all 38 donors;
    post/pre MSPE ratio; California ≈130, rank 1/39 ⇒ p = 1/39 ≈
    0.026; progressive cutoffs (all → 20× → 5× → 2×) as the robustness
    narrative (Figs 4-7).
  - §III: Prop 99 background (1988: +25¢ tax, media campaign); donor
    pool rules (drop states with own programs / big tax hikes; drop
    DC); predictors (price, log income, %15-24, beer) + lagged sales
    (1975/80/88); Table 1 balance; Table 2 weights (CO .164, CT .069,
    MT .199, NV .234, UT .334, rest 0); results: ~26 packs (~25%)
    below counterfactual by 2000; ~20 packs 1989-2000 average; vs
    Fichtenberg & Glantz's 14 packs/yr regression estimate (fn 18).
  - Appendix B: West Germany reunification twin case (−6%/−1,460
    USD/yr; in-time placebo at 1980) — the small-donor-pool variant.
- **Athey course bookdown ch.7** (machinelearn cache) — synthetic
  control + synthetic DiD placed in the modern panel toolbox; use for
  the one-paragraph "where the field went" close (synthetic DiD named).

## Key points the lesson must cover

1. **The situation**: one treated unit, aggregate outcome, no
   randomization possible; naive DiD against "rest of US" fails
   visibly (Fig 1's pre-divergence). Business translations up front:
   country pricing launch, city-level marketplace policy, TV campaign
   in one region (the incrementality bridge to Part III, one clause).
2. **The estimator**: choose convex weights to reproduce the treated
   unit's PRE-period path and predictors; the post-period gap is the
   estimate. Why convexity (no extrapolation, interpretable sparse
   weights — five states you can READ); V/predictor choices and the
   validation split.
3. **Why it identifies** (kept to intuition + one display): the factor
   model — matching a long pre-period forces matching factor loadings;
   DiD is the constant-loadings special case (the lesson's theory
   pearl: synthetic control ⊇ DiD).
4. **Inference with n=1**: no CLT — permutation: every donor gets the
   placebo treatment; California's post/pre MSPE ratio is 1st of 39;
   exact p = 1/39. The progressive-cutoff reporting pattern as
   reusable communication craft.
5. **The result + the twin case**: 26 packs/25% by 2000; German
   reunification (−6%, in-time placebo) for the small-pool/in-time
   variant; honest limits: donor contamination (spillovers!, `<Ref>`
   pathologies), post-period shocks hitting donors, cherry-picking
   risk (pre-registration of donor pool and predictors).

## Set pieces and worked examples to recreate

- **Fig 1 → Fig 2 rhetorical pair**: naive average fails → synthetic
  matches; recreate both as our charts AND ship the originals (the
  published pair is the method's origin story).
- **Table 2's five-state weights** verbatim — the interpretability
  argument in one table.
- **The placebo spaghetti + MSPE-ratio histogram** (Figs 4, 8):
  sourced originals; our simplified redraw for the mechanism.
- **Business worked example** (constructed): running case launches a
  price change in one of 12 markets; build the synthetic from the
  other 11 (toy numbers), run the placebo loop, read the rank.

## Pitfalls / subtleties to flag

- Pre-period fit quality gates everything: a bad-fit placebo inflates
  the null distribution — hence the MSPE-ratio statistic and cutoffs;
  state plainly.
- p = 1/39 is the MINIMUM attainable with 39 units — small donor
  pools cap significance; in-time placebos as the fallback (Germany).
- Do not blur with matching-on-covariates: the pre-OUTCOME path is
  the primary matching object; covariates assist.
- Spillovers: donors must be untreated AND unaffected (Prop 99's
  donor-pool exclusion rules are the model to imitate).
- The 2007 WP vs 2010 JASA published version differ slightly — cite
  the WP we read; numbers from cached text only.

## FIGURE PLAN

1. `source:` **syntheticcon-fig1-ca-vs-restus** — save as
   `prop99-naive-control`. Reader must see: pre-1988 divergence of
   California vs rest-of-US. Placement: the failure exhibit, centered,
   early. The published original carries the "this really is the
   authors' own naive baseline" weight.
2. `source:` **syntheticcon-fig2-ca-vs-synthetic** — save as
   `prop99-synthetic`. Reader must see: near-perfect pre-1988 overlap,
   post-1988 divergence. Placement: centered immediately after the
   estimator section — THE canonical chart of the method.
3. `draw:` `<FigureSequence>` (4 frames) — **building the synthetic**:
   frame 1 California's pre-path + 38 donor paths faint; frame 2 five
   donors highlighted with weights appearing; frame 3 the weighted
   combination drawn onto the pre-period (fit tightens); frame 4 the
   post-period gap shaded as the estimate. Our own simplified data.
4. `draw:` single `<Figure>` — **the weights table as figure**: the
   five states with weight bars (0.334 Utah … 0.069 Connecticut), all
   others zero — sparsity visible.
5. `source:` **syntheticcon-fig4-placebo-gaps** — save as
   `prop99-placebo-spaghetti`. Reader must see: California's black gap
   line leaving the gray band post-1988. Placement: inference section,
   centered.
6. `source:` **syntheticcon-fig8-mspe-ratio-hist** — save as
   `prop99-mspe-ratio`. Reader must see: California isolated at ~130.
   Placement: directly after fig 5; together they ARE p = 1/39.
   (Four sourced images is above the 1-2 norm — justified: this
   lesson's argument IS a published empirical sequence; our redraws
   handle mechanism, the originals carry evidence. Drop fig 1 first
   if QA flags density.)
7. `draw:` single `<Figure>` — **DiD ⊂ synthetic control**: two small
   panels — DiD as equal-weights-with-parallel-trends vs SC as
   fitted-weights; the factor-model λ_t annotation distinguishing
   them.

## EXERCISE PLAN

1. Warm-up: given three donor paths and weights (.5/.3/.2), compute
   the synthetic path and the post-period gap. (Mechanics once.)
2. Boundary probe: a treated unit OUTSIDE the donor convex hull
   (fastest-growing market): show no convex weights fit the pre-path;
   what do unconstrained weights do instead (extrapolation), and why
   the paper forbids them? State the honest verdict when the hull
   fails (method refuses — a feature).
3. Claim to refute: "The gap appears right at the intervention, so
   causality is established." Construct the confound: a donor-pool-
   wide shock hitting the treated unit differently (border tax
   change); explain what the placebo test does and does NOT rule out
   (it calibrates noise, not confounds timed with treatment).
4. Derivation the lesson skipped: show DiD is the synthetic-control
   special case with equal weights and λ_t constant (write both
   estimators on the two-period factor model); derive what varying
   λ_t adds.
5. Research-shaped: with the paper's Table 2 weights and cached
   per-year series, recompute the 2000 gap (~26 packs) and the
   1989-2000 mean gap (~20 packs); compare to Fichtenberg & Glantz's
   14 packs/yr and explain the direction (naive trend control
   understates).
6. FORWARD (E7): the placebo loop treats every unit symmetrically —
   the same permutation logic that graded California grades ANY
   scoring rule. Write the permutation test for "our uplift model's
   top-decile targeting beats random targeting". Solution:
   rank-based evaluation of targeting rules is the QINI/RATE
   machinery of the next lesson; `<Ref>` uplift-and-causal-forests.
7. Spaced (E3, DiD + pathologies): the donor-pool exclusion rules
   (drop states with own tobacco programs) are an interference
   defense — restate them as the SUTVA requirement from
   experiment-pathologies applied to observational donors.
