# Research brief: burn-runway-default-alive (Burn, runway, and default alive)

status: planned
module: startup-finance
type: core
goal: Compute runway and default-alive status from a financial model and quantify their uncertainty by Monte Carlo simulation

The survival read on the model's cash line. Business words: burn,
runway, default alive/dead. Academic layer: trajectory extrapolation;
Monte Carlo over driver uncertainty; runway as a distribution.
Dig-deeper: Paul Graham, "Default Alive or Default Dead?" (2015).

## ARC (L10)

- **Inherits:** the financial model's cash trajectory and its
  sensitivity tornado (previous lesson's forward exercise found the
  minimum-cash month by hand).
- **Contributes:** Spine step 15's survival criterion: default alive
  as a computable predicate; the fatal pinch; and the honest version —
  growth and churn are random, so runway is a distribution and
  P(default alive) a number.
- **Hands off:** "you raise because the distribution says so" —
  cap-table-and-dilution opens the raising machinery; the Monte Carlo
  posture returns in venture-economics (portfolio-level) and the
  capstone.

## Sources to consult

- **PG, "Default Alive or Default Dead?" (FULL, cached)**:
  - The definition: constant expenses + current revenue-growth trend
    ⇒ profitable before zero cash? (opening paragraphs); founders
    don't know their own answer; Trevor Blackwell's calculator
    pointer (external tool — mention, don't depend).
  - The fatal pinch: default dead + slow growth + short runway.
  - "Fundraising is never more than Plan A"; write Plan B with its
    trigger date.
  - Growth-spend non-correlation; "don't hire too fast" as the
    leading self-inflicted death; the composite death-spiral
    narrative; Airbnb's four months of zero hires.
  - Footnotes: >5×/yr revenue growth attracts investors while
    unprofitable (fn 1); bootstrap-abstinence analogy (fn 2); VC
    kill-or-cure portfolio rationality (fn 3 — seeds
    venture-economics); Altman/Buchheit premature-scaling (fn 4).
- **Financial-model lesson (internal)** — the deterministic
  machinery; this lesson adds the stochastic layer.
- **WeWork S-1 (forward tease)** — a company whose burn was the
  statement; one sentence.
- Monte Carlo methodology: the audience knows simulation — no
  external source needed; the content is WHICH drivers get
  distributions (growth rate, churn) and reading fan charts /
  P(alive) honestly.

## Key points the lesson must cover

1. **Definitions with edges**: gross vs net burn; runway = cash/net
   burn is exact only at constant burn — the trajectory version from
   the model (burn changes as revenue grows and hires land); the
   deterministic default-alive computation on the course case.
2. **PG's decision frame**: the fatal pinch as a region of the
   (growth, runway) plane; Plan A/Plan B with a written trigger; the
   >5×/yr investability line — investability as a model output, not
   a mood.
3. **The overhiring diagnosis**: spending and growth empirically
   uncorrelated; the death-spiral sequence (raise on story → so-so
   growth → hire to force it → growth unmoved → unraisable); Airbnb
   counterexample; premature scaling (Buchheit) = scaling bad unit
   economics — Part I's models as the test.
4. **Runway as a distribution**: growth and churn as random drivers
   (calibrate spreads from the cohort data's own noise); simulate
   cash paths; median runway vs 10th percentile; P(default alive) =
   fraction of paths reaching cashflow-positive before zero. The
   deterministic number sits near the median and says nothing about
   the killing tail.
5. **Decisions under the distribution**: hiring steps sized to keep
   P(alive) above a floor; when the distribution — not the point
   estimate — says raise; late cuts fail on the median path (the
   fatal-pinch demo task).

## Set pieces and worked examples to recreate

- The deterministic check on the course case: constant expenses,
  revenue trend extrapolated — profitable at month 19 with cash-zero
  at month 16 ⇒ default dead by 3 months; then the fix menu
  (cut/raise/grow) sized.
- The fan chart: 500 simulated paths at growth μ=8%/mo, σ=4%/mo —
  median runway 17mo, p10 11mo, P(alive)=0.64 (illustrative numbers
  computed for the case, all checkable).
- The PG plane: (weekly growth, months runway) with the fatal-pinch
  region shaded and the case company plotted.
- The death-spiral narrative retold as a 5-row model run (each stage
  a driver change) — PG's prose as a simulation.

## Pitfalls / subtleties

- Default alive is defined on CURRENT trend + CONSTANT expenses — a
  counterfactual discipline, not a forecast; keep PG's operational
  definition exact.
- Growth-rate distributions: lognormal-ish, serially correlated —
  keep the simulation honest but simple (iid monthly draws stated as
  the simplification; autocorrelation as a starred note).
- The >5× threshold is a 2015 folklore number from one essay — flag
  provenance; the mechanism (growth buys investability) is the
  content.
- Don't turn this into a fundraising-advice lesson: the deliverable
  is the computation and the decision frame.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the deterministic picture: revenue and
   expense lines crossing (profitability month) vs the cash line
   hitting zero — default alive iff the crossing precedes the zero;
   both cases drawn.
2. `draw:` single `<Figure>` — the fatal-pinch plane: growth rate vs
   runway; regions default-alive / raisable / fatal pinch; the case
   company's dot with its Plan-B trigger drawn as a dated arrow.
3. `draw:` `<FigureSequence>` (3 frames) — from point to
   distribution: frame 1 the deterministic cash path; frame 2 twenty
   sampled paths fanning; frame 3 the full fan with median/p10 bands
   and the P(alive) readout. One layer per frame.
4. `draw:` single `<Figure>` — the runway histogram: distribution of
   cash-zero months across simulations; deterministic runway marked
   near the median; the left tail annotated "the number that kills".
5. `draw:` single `<Figure>` — the death spiral as a model run: five
   stages (raise, hire, flat growth, burn spike, unraisable) on one
   cash trajectory with driver-change pins (PG's narrative, our
   numbers).

## EXERCISE PLAN

1. Warm-up: cash $1.8M, gross burn $220k/mo, revenue $70k/mo growing
   $10k/mo — compute net burn now, naive runway, and trajectory
   runway; state which is longer and why. (Definitions once.)
2. Boundary probe: zero growth — trajectory runway equals cash/net-
   burn exactly and default-alive reduces to "already profitable?";
   then negative growth (churn > adds): show runway is SHORTER than
   cash/current-burn — the naive formula's error flips sign with the
   growth sign.
3. Claim to refute: "We have 14 months of runway, plenty of time to
   raise in a year." Using the fan chart's p10 (9 months) and a
   3-month fundraise lead time, compute the actual decision deadline;
   name the two uncertainties the point estimate hid (growth
   variance, raise duration).
4. Derivation the lesson skipped: with revenue r_t = r₀(1+g)^t and
   constant expenses E, derive the profitability month t* =
   log(E/r₀)/log(1+g) and the closed-form cash minimum; the
   default-alive condition as an inequality between t* and the
   cash-zero root.
5. Research-shaped: calibrate the growth-rate σ from the course
   case's own monthly history (12 observations) and state the
   simulation's honest limitation at n=12 (the σ estimate's own
   error — Part II's power instincts applied to your own metrics).
6. FORWARD (E7): the distribution says raise $2.5M within 6 months.
   Compute the ownership sold at pre-money $10M vs $14M and the
   founder stake after a 12% pool top-up. Solution: this arithmetic —
   price, pool, dilution — is the cap table, next lesson; `<Ref>`
   cap-table-and-dilution.
7. Spaced (E3): PG's footnote-3 says kill-or-cure is rational for a
   VC portfolio but not for a founder — quantify with a toy: a bet
   that doubles growth with p=0.3 or halves runway — compute each
   party's expected value (fund holds 20 such bets, founder holds 1)
   and connect to the power-law lesson ahead (Ref venture-economics).
