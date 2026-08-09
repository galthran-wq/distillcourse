# Research brief: variance-reduction-cuped (Variance reduction: CUPED)

status: planned
module: experiments
type: core
goal: Derive the CUPED adjustment and compute its variance reduction from pre-experiment correlation

The module's cleanest derivation lesson: elementary probability start to
finish (the paper's own boast), a headline formula, real production
numbers, and one sharp trap. Primary source read in full (Deng, Xu,
Kohavi, Walker, WSDM 2013).

## ARC (L10)

- **Inherits:** The 1/√n wall (power-and-mde): traffic buys sensitivity
  at brutal rates; peeking's fix cost extra samples.
- **Contributes:** Spine step 6 continued: the noise itself is partly
  predictable — subtract the predictable part. Control variates,
  θ* = cov/var, var×(1−ρ²), why randomization makes it unbiased with no
  E[X] needed, covariate choice, and the post-treatment trap.
- **Hands off:** experiment-pathologies inherits the trap (post-treatment
  conditioning) as one instance of its catalog; the CUPED lesson proves
  the mechanism, the pathologies lesson generalizes it.

## Sources to consult

- **CUPED paper** (cached improvingthe- PDF/txt, full):
  - §2.1 eq 1: var(Δ) = var(Ȳt)+var(Ȳc); the target: smaller-variance
    unbiased Δ*.
  - §3.2.1 eq 3-5: Ŷcv = Y − θX + θE[X]; θ* = cov(Y,X)/var(X);
    var = var(Y)(1−ρ²); OLS/R² connection; nonlinear f(X) note (eq 6).
  - §3.2.2 eq 7: the CENTRAL step — randomization ⇒ E[X^t]=E[X^c] for
    any PRE-experiment X, so Δcv = Ŷcv^t − Ŷcv^c is unbiased with E[X]
    unknown; θ estimated pooled (must be same for both arms).
  - §3.1 stratification as the discrete twin; §3.3/Appendix A the
    equivalence for categorical covariates.
  - §4.1/5.2.1: best covariate = same metric, pre-period (~45-50% for
    queries/user); §4.2 missing pre-period users (indicator + constant);
    §4.3 the general validity condition E[X^t]=E[X^c] ("pre-triggering");
    day-of-week-first-seen as a valid non-pre-period covariate.
  - §5.1/Fig 2: the 250ms slowdown — borderline p after 2 weeks naive,
    CUPED significant day 1, still significant with half the users;
    later confirmed p=2e-13.
  - §5.2.2 Figs 3-4: coverage-vs-correlation tradeoff; 2-week pre-period
    plateau ~50%.
  - §5.2.3: revenue/user <5% reduction (weak pre/post correlation) —
    CUPED is not magic.
  - §5.3/Fig 7: the DQ post-triggering covariate flipping the sign —
    95% CI below zero for a true positive effect.
  - §6: 45%/52%/49% on three real experiments; 1–2 week pre-period
    recommendation.
- **Kohavi ch.1** — none needed beyond context.

## Key points the lesson must cover

1. **The problem restated in variance terms**: the experiment's noise is
   mostly BETWEEN-USER heterogeneity (heavy vs light users), which
   existed before the experiment — so it is predictable and removable.
   Spiral: heterogeneity was module 1's modeling target; here it is
   nuisance.
2. **Control variates from scratch** (the audience's Monte Carlo
   memory): Ŷcv unbiased for ANY θ; optimize θ; get (1−ρ²). Then the
   experiment twist: E[X] unknown — but randomization equalizes it
   across arms, so it cancels in the difference. Mark that step as the
   theorem's hinge (the paper's eq 7 discussion).
3. **Practical recipe**: same-metric-pre-period covariate; pooled θ;
   missing-user indicator; 1-2 week pre-period (coverage vs correlation
   tension, Figs 3-4); expected gains by metric (queries ~50%, revenue
   <5%) — with WHY (autocorrelation of the metric).
4. **The production proof**: 250ms slowdown case end-to-end; "same power
   from half the users" as the money line; three-experiment 45/52/49%
   record.
5. **The trap, promoted to a principle**: any covariate the treatment
   can move re-introduces bias — Fig 7's sign flip on real data; the
   validity condition E[X^t]=E[X^c] is the entire license. Regression
   "controls" in experiments obey the same law (bad-controls preview,
   `<Ref>` difference-in-differences).

## Set pieces and worked examples to recreate

- **A 30-user toy CUPED**: pre/post metric table, compute θ*, adjusted
  means, variance before/after — full arithmetic visible (L7).
- **The 250ms case**: narrate with the two sourced p-value charts.
- **ρ→reduction table**: ρ = 0.3/0.5/0.7/0.9 → 9/25/49/81% variance cut
  → traffic multipliers ×1.1/×1.33/×1.96/×5.3 — the practical currency
  of the lesson.
- **Fig 7 retold**: DQ/user highly correlated with queries/user AND
  moved by treatment ⇒ adjustment subtracts part of the effect itself;
  sign flips. Sourced image.

## Pitfalls / subtleties to flag

- CUPED ≠ regression adjustment in general: same estimator for linear
  case (App A equivalence with stratification for categorical), but the
  validity argument is design-based (randomization), not model-based —
  a sentence the audience will appreciate.
- θ estimated on pooled arms: using per-arm θ breaks unbiasedness (the
  paper's own implementation note).
- New users have no pre-period — coverage falls as the experiment runs
  (Fig 4's tension); the indicator trick.
- Ratio metrics need the delta method (App B) — name, don't derive.
- Don't oversell: revenue metrics resist; state the correlation
  diagnostic to run first.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **where the noise lives**: user-level
   metric scatter pre vs during experiment, colored by arm — the
   between-user spread dwarfs the treatment shift; the correlation the
   method will spend. (Original.)
2. `draw:` `<FigureSequence>` (4 frames) — **the adjustment**: frame 1
   raw Y distributions of two arms, overlapping heavily; frame 2 Y vs
   pre-period X scatter with the fitted θ line; frame 3 residuals
   Y−θ(X−X̄) — distributions tighten; frame 4 the same Δ, smaller error
   bars, (1−ρ²) tally. One change per frame.
3. `draw:` single `<Figure>` — **the hinge dissected** (voita rule 7):
   Δcv = (Ȳt − θX̄t) − (Ȳc − θX̄c) with the E[X̄t]=E[X̄c] cancellation
   bracketed and labeled "randomization pays here".
4. `source:` **improvingthe-fig2-pvalue-top** — save as
   `cuped-slowdown-pvalues`. Reader must see: naive t-test p-curve
   limping to .05 vs CUPED under it from day 1, log scale, 14 days.
   Placement: centered in the production-proof section; real measured
   jaggedness is the point.
5. `source:` **improvingthe-fig2-pvalue-half-users** — save as
   `cuped-half-traffic`. Reader must see: half-traffic CUPED still
   significant. Placement: directly under fig 4 as its pair; together
   they ARE the "half the users" claim.
6. `source:` **improvingthe-fig7-post-triggering-bias** — save as
   `cuped-bad-covariate`. Reader must see: CIs sitting below zero for a
   known-positive effect. Placement: float-right at the trap section;
   caption: this happened on real Bing data with a plausible covariate.
7. `draw:` single `<Figure>` — **ρ → traffic-multiplier bar row**: the
   currency table as a figure.

## EXERCISE PLAN

1. Warm-up: given var(Y)=4, cov(Y,X)=1.5, var(X)=1 — compute θ*, the
   adjusted variance, and the equivalent traffic multiplier. (Mechanics
   once.)
2. Boundary probe: ρ = 0 (new product, no pre-period signal) and ρ → 1
   (deterministic metric): show CUPED does nothing at 0 and everything
   at 1 — and why ρ→1 cannot happen for a metric the treatment is
   supposed to MOVE (a perfectly predictable outcome has no room for an
   effect… unless the effect shifts the mean — resolve the apparent
   paradox: prediction is within-arm, the effect is between-arm).
3. Claim to refute: "We adjusted for in-experiment engagement to reduce
   noise; the effect became clearly negative, so the feature hurts."
   Diagnose with the validity condition: engagement is post-treatment;
   the adjustment subtracted the effect's own pathway (Fig 7's
   mechanism); state the fix (pre-period engagement only).
4. Derivation the lesson skipped: prove Ŷcv is unbiased for every θ and
   derive θ* by minimizing the quadratic; then show the equivalence to
   regressing centered Y on centered X (the OLS/R² bridge the paper
   states).
5. Research-shaped: with 1-week pre-period correlation ρ=0.7 for
   sessions/user, compute how much shorter the running case's 4-week
   test becomes at equal power; then recompute for revenue at ρ=0.2 —
   reproduce the paper's qualitative split (big win vs almost none).
6. FORWARD (E7): triggering — analyzing only users who ever SAW the
   changed page — also shrinks variance. State the condition under
   which it is valid, in the same E[X^t]=E[X^c] form. Solution:
   trigger status must be unaffected by treatment; when it isn't, you
   get dilution or bias — the pathologies catalog next lesson; `<Ref>`
   experiment-pathologies.
7. Spaced (E3, module 1): the between-user variance CUPED removes is
   the same heterogeneity the sBG/BG-NBD models PARAMETERIZE — one
   paragraph: when heterogeneity is signal (modeling customers) vs
   nuisance (measuring a treatment), and how one dataset serves both.
