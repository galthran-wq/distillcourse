# Research brief: liquidation-preferences-and-waterfall (Liquidation preferences and the exit waterfall)

status: planned
module: startup-finance
type: core
goal: Compute exit proceeds through a preference stack — seniority, participation, caps, conversion — and locate each class's conversion point

Deal mechanics, part 3 — where ownership percentages stop being the
answer. Business words: liquidation preference, participation,
waterfall, 1×. Academic layer: the waterfall as an algorithm with a
conservation invariant; payoff kinks as the bridge to options.
Dig-deeper: Foresight tool sheet 5 (cell-verified); Venture Deals ch.5
(toc-only).

## ARC (L10)

- **Inherits:** the full post-conversion cap table (safes converted,
  pool topped, round closed) and the safe's greater-of payoff shape
  (previous lesson's forward exercise).
- **Contributes:** Spine step 16's close: the waterfall algorithm —
  seniority order, per-tranche greater-of(preference, convert),
  participation regimes, the zone of indifference — and the business
  meaning: the same "valuation" with different preference stacks is
  a different security; common is paid last.
- **Hands off:** every class's payout-vs-exit curve is a kinked
  (option-like) claim — esop-and-option-pricing prices the kinks;
  venture-economics uses the investor's payoff distribution.

## Sources to consult

- **Foresight "5 - Exit Waterfall" (FULL, cell-verified)**:
  - The algorithm rows 106–210: per tranche — residual → preference →
    cap on participation → implied-if-converted vs implied-if-
    preference → take the max → subtract, descend; common last.
  - The three participation regimes (non-part / full / capped) and
    the capped class's ZONE OF INDIFFERENCE (row-124 note: payout
    flat in exit value until conversion overtakes).
  - Conservation checks (rows 213/222/250: payouts ≡ exit value) —
    the model's own invariant, adopt as the lesson's self-check.
  - General seniority/pari-passu blocks — mention capability, teach
    strict seniority.
  - The author's "proud and disgusted" one-formula confession —
    legibility aside (shared with cap-table lesson; use once only).
- **Venture Deals ch.5 (TOC-ONLY)** — term names (preference,
  participation, seniority) at chapter-title level; the
  economics-vs-control frame continues.
- **Good Technology (Del. Ch.)**:
  - ⚠ The fetched opinion is the PROCEDURAL 2017 arbitrability
    ruling — it contains ZERO waterfall numbers. The famous facts
    ($425M sale to BlackBerry, preferred paid, common/employees
    ~wiped, alleged conflicted process) must be attributed to press/
    secondary accounts and FLAGGED as such until the merits opinion
    is sourced. The lesson may use the case NAME and the captured
    caption page as provenance that the litigation is real; every
    dollar figure carries a "secondary, unverified" marker or is
    replaced by a hypothetical "Good-Tech-shaped" stack.
- **WSJ/press accounts** — NOT in canon; if the human sources the
  merits opinion later, upgrade; meanwhile the worked $425M-style
  stack is explicitly hypothetical.
- **Black–Scholes 1973 (forward)** — the equity-as-option footnote;
  plant one sentence.

## Key points the lesson must cover

1. **Preferred stock exists because of this lesson**: same shares,
   extra rights; 1× non-participating as the standard; why investors
   demand downside protection when pricing uncertainty is extreme
   (connects to the safe's floor).
2. **The algorithm, exactly** (Foresight's rows as pseudocode):
   order by seniority; per tranche compute preference vs as-converted
   value; take the max (rational conversion); subtract; descend to
   common as residual claimant; conservation as the self-check.
   Worked fully on the course case's stack at three exit values.
3. **Participation regimes**: non-participating (either/or), full
   (both — "double dip"), capped (both until k×) — payout-vs-exit
   curves for each; the capped zone of indifference (flat segment)
   as the counterintuitive keeper.
4. **Conversion points**: the exit value where preference =
   as-converted for each class; kinks in the payout diagram; why
   "percent ownership" is only the asymptote at large exits.
5. **The business readings**: (a) a modest exit under a big stack
   zeroes common — the Good-Technology-shaped case (hypothetical
   numbers, real case named with the caveat); (b) preference stacks
   make headline valuations incomparable — a $100M-post round at 1×
   non-part vs 1× participating are different prices; (c) employee
   consequences — options under water vs preferences (bridge to
   next lesson).

## Set pieces and worked examples to recreate

- The course case's waterfall: common 62%, Series Seed $1.5M (1×),
  Series A $2.5M (1×), at exits $6M / $25M / $120M — full
  distribution tables; conversion points solved.
- The regime comparison on one stack: the three payout-vs-exit
  curves for Series A under non-part / full / capped-2×.
- The Good-Tech-shaped stress case: ~$300M of preferences (multiple
  rounds, some participating) against a $425M sale — common's
  residual computed ≈ small; then the minimum exit for common to
  clear a threshold. Explicitly labeled a reconstruction.
- The conservation check demonstrated once (payouts sum to exit at
  every slider position — also the demo's assertion).

## Pitfalls / subtleties

- THE SOURCE GAP: no verified primary numbers for Good Technology —
  the merits opinion must be obtained (flagged in sources.yaml);
  until then all figures are illustrative and say so. Do NOT launder
  press numbers into "the filing shows".
- Deemed liquidation ≠ bankruptcy: acquisitions trigger preferences;
  IPOs typically force conversion — one sentence each.
- Seniority vs pari-passu varies by deal; teach strict stacking,
  note the alternative.
- Rational conversion assumes classes act independently — with
  participation caps the greater-of per class is still correct
  tranche-by-tranche in the standard model; don't open game-theoretic
  edge cases.
- >1× multiples and cumulative dividends exist — name, don't model.

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (5 frames) — the algorithm runs at
   exit $25M on the course stack: frame 1 the stack ordered; frame 2
   Series A's greater-of computed; frame 3 subtract, descend to
   Seed; frame 4 common takes residual; frame 5 the conservation
   check row. One step per frame — this is the lesson's centerpiece.
2. `draw:` single `<Figure>` — payout-vs-exit curves, one per class,
   on the course stack: kinks at conversion points marked;
   percent-ownership asymptotes dashed.
3. `draw:` single `<Figure>` — the three regimes for one class:
   non-participating (max of two lines), full participating (sum),
   capped (sum until the cap, flat zone of indifference shaded, then
   conversion) — the keeper diagram.
4. `draw:` single `<Figure>` — the Good-Tech-shaped stress bar: at
   $425M exit, stacked payout bar dominated by preference tranches,
   common's sliver labeled; second bar at the common-breakeven exit.
   Caption carries the "reconstruction; merits opinion pending"
   flag.
5. `source:` **inre-caption-page1** — save as `good-tech-caption`.
   Reader must see: the real Chancery caption (C.A. No. 11580-VCL,
   LASTER V.C.) proving the litigation exists. Placement: small,
   float-right beside the case paragraph; caption states this is
   the procedural opinion and the waterfall numbers await the
   merits ruling — the honesty is part of the lesson.
6. `source:` **captable-waterfall-charts** — save as
   `foresight-waterfall-output`. Reader must see: the tool family's
   four payout charts across exits $2.5M–$320M (the hockey-stick
   crossover). Placement: centered near the demo hand-off; caption:
   what a production waterfall model outputs — the lesson's demo
   recreates this interactively. Real tool output; our demo is the
   redraw.

## EXERCISE PLAN

1. Warm-up: stack = $2M 1× non-part senior + $1M 1× non-part junior
   + common 70%; compute distributions at exits $2M, $5M, $20M.
   (The algorithm once.)
2. Boundary probe: exit exactly at total preferences ($3M) — common
   gets zero, both preferred take preference; then exit at the top
   class's conversion point — show the greater-of is exactly tied
   and both branches give the same payout (the kink is a true
   indifference, not a discontinuity).
3. Claim to refute: "I own 10% of a company that sold for $50M, so
   I got $5M." With $30M of 1× participating-capped-2× preferences
   ahead, compute the actual common payout; name the two clauses
   that broke the percentage read.
4. Derivation the lesson skipped: for a single 1× non-participating
   class with ownership fraction f and preference P, derive the
   conversion point V* = P/f and show payout = max(min(V,P), f·V) —
   then decompose it as a portfolio: f·V plus a put-like floor minus
   a give-up — naming the option structure before pricing it.
5. Research-shaped: reproduce the zone of indifference numerically
   from the Foresight model's regime (cap 2×): for invested $5M,
   f=25%, find the flat interval's endpoints [cap reached, conversion
   overtakes] and its width as a function of f.
6. FORWARD (E7): plot common's payout-vs-exit curve for the course
   stack and observe it is exactly a call option's hockey stick with
   strike = total preferences. Solution: pricing that call — and
   hence today's value of common vs preferred — is the next lesson's
   risk-neutral machinery (and the 409A gap's origin); `<Ref>`
   esop-and-option-pricing.
7. Spaced (E3): the Series A investor's payout distribution over the
   burn lesson's Monte Carlo exit scenarios — compute expected
   payoff with and without the 1× preference and state what the
   preference is "worth" in expectation (Ref
   burn-runway-default-alive; seeds venture-economics).
