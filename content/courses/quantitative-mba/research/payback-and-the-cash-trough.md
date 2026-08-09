# Research brief: payback-and-the-cash-trough (Payback period and the cash trough)

status: planned
module: unit-economics
type: core
goal: Project cumulative cash flow for a growing customer base and locate the payback period and maximum cash need

Business words: payback period, cash trough / burn from growth. Academic
layer: light — deterministic cash projection; sales efficiency / magic
number as algebraic aliases of payback. Demo lesson (CashTroughLab).

## ARC (L10)

- **Inherits:** CAC and margin-adjusted contribution (cac-and-ltv-cac,
  margins-and-the-unit-pnl); the seam: LTV:CAC has no clock.
- **Contributes:** The time dimension: payback as the liquidity metric;
  the cash trough deepening with growth; profitability and solvency as
  separate questions. Spine step 3: "from gross margin through CAC and the
  cash trough…"
- **Hands off:** mrr-nrr-and-negative-churn moves from cash mechanics to
  the recurring-revenue ledger those cash flows roll up into.

## Sources to consult

- **Skok main article** (saasmetrics-full.txt) — "The SaaS P&L / Cash Flow
  Trough": single-customer cash curve; the growing-base trough deepening
  and lengthening with bookings growth; re-entering the trough on "hitting
  the accelerator". "Months to recover CAC < 12" original guideline.
- **Skok definitions page** — "Months to recover CAC" (formula
  CAC/(ARPA×GM%)); the enterprise revision (~20 months, land-and-expand);
  "Sales Efficiency"/"Magic Number" (Scale Venture Partners: 4×ΔGAAP
  revenue / prior-quarter S&M) and the stated equivalence: efficiency 1.0
  ≈ 12-month payback, 0.5 ≈ 24.
- **Skok** — "Getting paid in advance" ("Months up Front"): prepay pulls
  the trough shallower at the price of discounts; churn interaction.
- **Module 1 fitted retention** — the contribution stream that gets
  cumulated is the unit P&L from margins-and-the-unit-pnl.

## Key points the lesson must cover

1. **One customer's cash curve**: −CAC at t=0, +contribution monthly,
   crossing zero at the payback month; with churn, SOME customers never
   pay back — payback is a statement about the expected curve, and the
   sBG survivor function belongs inside it (payback with churn-adjusted
   contribution: CAC / (ARPA·GM·S̄) intuition, computed properly by
   cumulating m·S(t)).
2. **The base-level trough**: sum the curves over a growing acquisition
   schedule; derive that under steady growth g the trough depth scales
   with g × CAC × payback (roughly cohort overlap); "growth chooses the
   depth of the hole".
3. **Payback vs LTV:CAC**: same ingredients, different questions —
   profitability (ratio) vs financing need (clock). A great unit can still
   die of cash; a mediocre unit with 3-month payback self-funds.
4. **Aliases in the wild**: sales efficiency and the magic number as
   payback modulo gross margin — derive the equivalence so the reader can
   translate VC-speak.
5. **Levers on the trough**: prepay (months up front), margin, CAC,
   payback discipline; each moved once in the demo.

## Set pieces and worked examples to recreate

- **The trough, built not asserted**: running case — 20 new customers/mo
  growing 10%/mo, CAC $500, contribution $37.50/mo with sBG retention:
  compute the company cash curve month by month; find trough ≈ month N and
  depth ≈ $X (fix exact numbers when drafting; keep round).
- **Skok's accelerator story**: the same base doubling acquisition at
  month 12 — the second dip, drawn.
- **Magic number translation table**: efficiency 0.5 / 0.8 / 1.0 / 1.5 ↔
  payback months, one row each.
- **Prepay variant**: annual prepay at 15% discount vs monthly — trough
  halves, LTV dips slightly: the tradeoff in two numbers.

## Pitfalls / subtleties to flag

- Payback uses CONTRIBUTION margin, not revenue — the single most common
  spreadsheet error; call it out once, dryly.
- Churn inside payback: quoting CAC/(ARPA×GM) assumes survival through
  payback; for high-churn products the expected-payback correction is
  material — show it, don't just warn.
- The trough is not "burn rate" in general (fixed costs excluded here);
  Part IV's runway lesson will add opex. One scoping sentence.
- Discounting is second-order at 12–24 month horizons; say why it's
  omitted here (contrast CLV where the tail made it first-order).

## FIGURE PLAN

1. `draw:` single `<Figure>` — **one customer's cash curve**: step-down at
   CAC, monthly climbs shrinking with S(t), zero-crossing labeled payback;
   a second faded curve for a churned-at-month-3 customer that never
   crosses. (Idea: Skok's single-customer trough chart, recreated.)
2. `draw:` `<FigureSequence>` (4 frames) — **cohorts stack into the
   trough**: frame 1 one cohort's curve; frame 2 three staggered cohorts;
   frame 3 their sum (the trough emerges); frame 4 growth rate doubled —
   same unit economics, deeper hole. One change per frame.
3. `draw:` single `<Figure>` — **trough depth vs growth rate**: depth and
   trough-month as functions of g for fixed unit economics; the "growth is
   a financing decision" payoff line. (Static twin of the demo.)
4. `draw:` single `<Figure>` — **payback ↔ magic number**: the two
   formulas aligned symbol by symbol with the GM% wedge between them
   (voita rule 7 dissection).
5. `draw:` single `<Figure>` — **prepay pulls cash forward**: monthly vs
   annual-prepay billing on one cohort's cash curve; trough and payback
   both marked. (Idea: Skok "Getting paid in advance".)

## EXERCISE PLAN

1. Warm-up: CAC $800, ARPA $120/mo, GM 75% — months to recover CAC
   ignoring churn; then with flat 3%/mo churn (expected contribution
   m·S(t)), find the corrected payback. (Two-step, unfamiliar second
   half.)
2. Boundary probe: a segment where monthly churn × payback ≈ 1 (e.g. 8%
   churn, 14-month naive payback): show expected cumulative contribution
   NEVER reaches CAC — payback is infinite though LTV:CAC ≈ 1.1 > 1.
   Which assumption (survival through payback) broke?
3. Claim to refute: "We're default-profitable on every customer, so
   growing faster can't hurt." Compute the trough at 2× growth against a
   fixed cash balance and exhibit the insolvency month; name the missing
   constraint (financing, not unit profitability).
4. Derivation the lesson skipped: derive the steady-state relation
   trough-depth ≈ Σ_{t<payback} (CAC − cum-contribution(t)) × adds(t) and
   show why depth is linear in adds for constant adds but superlinear
   under compounding growth.
5. Research-shaped: take Skok's stated equivalence (sales efficiency 1.0 ≈
   12-month payback) and derive the exact GM% under which it is exact;
   check with the definitions-page formulas.
6. FORWARD (E7): express the whole trough calculation as a function of the
   MRR waterfall's three components (new, expansion, churned) rather than
   customer counts. Solution: that ledger is the next lesson's object —
   `<Ref>` mrr-nrr-and-negative-churn.
7. Spaced (E3, module 1): replace flat churn with the fitted sBG S(t) in
   the payback computation and state the direction the correction moves
   payback for a reverse-J heterogeneity (early losses front-loaded —
   payback lengthens).
