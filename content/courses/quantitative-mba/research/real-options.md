# Research brief: real-options (Real options: the value of waiting)

status: planned
module: startup-finance
type: core
goal: Evaluate irreversible investment decisions as options — compute the option value of delay and the investment trigger the NPV rule misses

The option machinery turned on the firm's own choices. Business words:
real options, optionality, pivot, staging. Academic layer:
irreversibility + delay = option; the McDonald–Siegel trigger;
hysteresis. Dig-deeper: Dixit & Pindyck (SUMMARY-BASED — worked
numbers verified only from Pindyck's 1991 JEL survey; flag).

## ARC (L10)

- **Inherits:** binomial pricing and risk-neutral valuation (previous
  lesson's forward exercise priced "wait" as an option); NPV and its
  rule (lesson 1 of the module).
- **Contributes:** Spine step 17's second half: with irreversibility
  and the ability to wait, "invest when V > I" is wrong — the full
  cost includes the killed option; the trigger V* = β/(β−1)·I; the
  band of inaction; startup readings (staging, runway-as-options,
  pivot as abandonment).
- **Hands off:** venture staging logic feeds venture-economics
  (rounds as compound options) and the capstone's raise design; the
  pseudo-precision warning tempers the DCF lesson's terminal values.

## Sources to consult

- **Dixit & Pindyck (SUMMARY-BASED — access note)**: the book is
  borrow-gated; chapter titles/pages verified; ALL worked numbers
  below verified from Pindyck's 1991 JEL survey ("Irreversibility,
  Uncertainty, and Investment", read in full by the swarm) and the
  book's documented reputation. The lesson must cite the survey for
  numbers and the book for the framework. BUY flag stands.
  - Ch.2's widget factory (verified via survey §2): I=$800, price
    $100 now, 50/50 → $150 or $50 forever. Invest-now NPV = $300;
    wait-and-invest-only-if-up NPV = $386; full cost of investing
    today = 800 + 386(option killed) = $1,186 > V=$1,100. Breakeven
    I=$642; breakeven q=0.88. THE worked example — reproduce with
    the reader's own binomial machinery (previous lesson).
  - The futures-market aside: hedgeability does NOT restore the NPV
    rule — irreversibility, not risk aversion, drives the wedge.
  - Ch.4–5 (survey §3): McDonald–Siegel — F(V)=aV^β,
    V* = β/(β−1)·I with β from the fundamental quadratic;
    value-matching + smooth-pasting named as the boundary conditions
    (state, don't derive the ODE — no stochastic calculus).
  - Ch.7 (title-verified only): entry/exit/lay-up/scrapping —
    hysteresis band; teach the two-trigger IDEA with our own
    two-state numbers, no book-specific figures asserted.
  - Ch.10 flavor (via Majd–Pindyck/survey): staged investment as
    compound options; the $50-market-research variant (spend to
    learn before committing $1,200) — sequential spend can be
    optimal at negative whole-project NPV.
- **CRR (previous lesson)** — all pricing runs on the binomial tree;
  this lesson adds no pricing machinery.
- **PG default-alive (backward)** — runway buys options: the essay's
  Plan-B trigger reread as an exercise-or-abandon date.

## Key points the lesson must cover

1. **The flaw in the rule** (flaw-first): the widget factory computed
   both ways with the reader's own tools — direct comparison AND
   risk-neutral pricing agree: waiting is worth $86 more than
   invest-now's positive NPV. The NPV rule fails not at NPV<0 but at
   NPV>0 with a live option.
2. **What creates the wedge**: BOTH irreversibility (sunk I) and
   delayability; kill either and NPV-rule reasoning returns; the
   futures aside (hedging doesn't help) to kill the risk-aversion
   misreading.
3. **The trigger**: comparative statics first (breakeven I=$642,
   q=0.88 — where now/wait switch); then the continuous-time result
   STATED: V* = β/(β−1)·I > I, wedge increasing in σ, decreasing in
   δ (opportunity cost of waiting); zero-volatility limit recovers
   the classical threshold. Numbers from the survey, formula named
   McDonald–Siegel.
4. **Hysteresis**: paired entry cost + exit cost ⇒ a band [V_low,
   V_high] where the current state persists — operating at a loss
   and declining to enter at a profit are both rational; the
   two-trigger diagram (built with our own two-state example).
5. **Startup readings, disciplined**: staging (seed→A as a compound
   option — pay to observe, then decide), runway as option premium
   (PG's Plan-B trigger = exercise date), pivot as abandonment
   option; AND the pseudo-precision warning — real-options numbers
   need an identifiable V process and σ; where those are vibes, the
   framework ranks decisions, not prices them.

## Set pieces and worked examples to recreate

- The widget factory END TO END, twice (comparison; risk-neutral
  hedge with the short position, recovering $386) — survey-verified
  numbers.
- The comparative-statics table: option value and decision vs I
  (642 breakeven) and vs q (0.88) — the survey's own sensitivity.
- The $50-market-research staging variant: whole-project NPV
  negative, stage-1 positive — information as the asset bought.
- The hysteresis toy: entry cost 100, exit cost 30, two-state
  profit flow — compute the enter and exit triggers and exhibit the
  band.

## Pitfalls / subtleties

- SOURCE HONESTY: the book is summary-based this round — every
  number must trace to the read survey; no book page numbers, no
  book-figure recreations; framework attribution "Dixit & Pindyck
  (1994), results as surveyed in Pindyck (1991)".
- Do not derive the smooth-pasting ODE — state β's role and move;
  the audience can accept a named boundary condition.
- Real options ≠ excuse for any bet: the option value is only as
  real as the learning that waiting/staging buys; state the
  discipline (what will you know later that you don't now?).
- Distinguish from financial options: no traded underlying ⇒ the
  risk-neutral argument is an analogy running on spanning
  assumptions — one honest paragraph (survey's own caveat).

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (4 frames) — the widget factory:
   frame 1 the two-state price tree and invest-now NPV $300;
   frame 2 the wait branch (invest only on up) NPV $386; frame 3
   the full-cost accounting (I + killed option > V); frame 4 the
   verdict table. One computation per frame.
2. `draw:` single `<Figure>` — the decision map: (I, q) plane with
   the invest-now / wait boundary through (642, ·) and (·, 0.88) —
   comparative statics as geography.
3. `draw:` single `<Figure>` — the trigger wedge: V* /I as a
   function of σ (rising from 1 at σ=0), the classical NPV
   threshold as the flat line at 1 — "uncertainty widens the wedge"
   in one curve (standard M–S comparative static, our rendering).
4. `draw:` single `<Figure>` — hysteresis band: profit-state axis
   with entry trigger above exit trigger, the inaction band shaded;
   arrows showing state persistence inside the band (our toy's
   numbers).
5. `draw:` single `<Figure>` — staging as a compound option: the
   seed→A→B decision tree with option nodes (continue/abandon) at
   each round; premium/exercise labels mapping venture rounds onto
   option vocabulary.

## EXERCISE PLAN

1. Warm-up: rerun the widget factory with the down price at $75
   (instead of $50) — recompute invest-now vs wait and the verdict.
   (The comparison once.)
2. Boundary probe: make the investment fully reversible (resale at
   I, no friction) — show the wait option's value collapses to zero
   and the NPV rule returns exactly; irreversibility is the
   load-bearing hypothesis, not uncertainty alone.
3. Claim to refute: "We can hedge the output price, so we should
   invest now." Reproduce the survey's futures-market argument on
   the widget numbers: hedging changes risk exposure, not the
   value of waiting; identify the step in the wait-value computation
   the hedge fails to touch.
4. Derivation the lesson skipped: in the two-state world, derive the
   general breakeven condition I* such that invest-now = wait —
   i.e., re-derive $642 symbolically as a function of (P_now, P_up,
   P_down, q, r) — the comparative static as a formula.
5. Research-shaped: reproduce the staging result — with stage-1 cost
   $50 revealing the true state before a $1,200 commitment, compute
   the program's value at whole-project NPV = −$40 and state the
   condition (information value > stage cost) in general form.
6. FORWARD (E7): a fund invests $1M at seed knowing the A-round
   go/no-go arrives in 18 months. Compute the seed as a stage-1
   option (premium $1M, exercise = lead the $4M A on good news) —
   whose expected value depends entirely on the outcome
   distribution's tail. Solution: that tail is the power law, next
   lesson; `<Ref>` venture-economics.
7. Spaced (E3): the abandonment option in PG's terms — the fatal
   pinch is the region where the abandonment option is the only one
   left with value; restate the Plan-B trigger date as an option's
   expiry and compute it for the burn lesson's fan chart (Ref
   burn-runway-default-alive).
