# Research brief: financial-model (The driver-based financial model)

status: planned
module: startup-finance
type: core
goal: Construct a 24-month driver-based financial model from the course case's unit economics — funnel and sales drivers through to three statements

The course's synthesis machine: Part I's models become the revenue
engine, Part III's channels the acquisition engine, last lesson's
statements the output. Business words: financial model, plan, forecast.
Academic layer: none new — architecture discipline; every formula is a
course citation. Dig-deeper: Janz SaaS Financial Plan 2.0.

## ARC (L10)

- **Inherits:** the metric tree (Part I) as the model's dependency
  graph; sBG retention (churned-MRR line), MRR waterfall, CAC/payback;
  sales capacity (Part III); linked statements (previous lesson).
- **Contributes:** Spine step 15's centerpiece: the 24-month machine —
  named input drivers, two acquisition engines, cohort-driven revenue,
  step-cost headcount, statements as outputs, reconciliation checks as
  invariants.
- **Hands off:** the cash line's survival read (burn-runway, next);
  the model IS the DCF's forecast (valuation) and the capstone's
  chassis.

## Sources to consult

- **Janz, SaaS Financial Plan 2.0 (FULL post, cached; the .xlsx
  itself unopened — in-cell comments unread, flag)**:
  - Architecture: blue input cells vs black computed — the discipline
    the lesson adopts as "drivers vs derived".
  - Two acquisition engines: marketing-funnel (organic growth rate,
    budget/CAC, conversion, ARPU, churn) for low-touch tiers; sales-
    driven (revenue targets, quota, headcount) for Enterprise —
    exactly Part III's PLG and sales lessons as spreadsheet blocks.
  - The Enterprise year-1 churn bootstrap (synthetic trailing-12-month
    acquisition history) — "you need a metric's history before you
    have history".
  - Deliberate exclusions list (no capex, no interest/tax beyond
    payroll, netted expansion/contraction, renewal-only Enterprise
    price changes) — a model is a stated-assumption machine; teach
    the list as a feature.
  - CS-cost allocation debate (CoGS vs S&M) — definitional choices
    move CAC and GM; Part I's definitions land in cells.
  - MRR-is-not-GAAP-revenue note — reconcile with the rev-rec lesson
    (the model tracks MRR AND recognized revenue; say where they
    differ).
- **WbD bowtie / sales-motion lesson** — the capacity engine's
  parameters (quota, ramp, cycle).
- **Part I internal** — sBG S(t) for cohort churn; NRR mechanics for
  expansion; payback for the S&M budget line.
- **Skok** — the metrics the model must emit (MRR waterfall, CAC,
  payback, magic number) as its dashboard.

## Key points the lesson must cover

1. **Architecture first**: a model is a DAG from ~15 named drivers to
   statements; the input/computed discipline; every computed cell
   traceable; changes happen at drivers only. (The metric tree run
   forward — say so with a Ref.)
2. **The revenue engine is Part I**: monthly acquisition cohorts ×
   sBG survival × ARPA (+ expansion rate) = MRR by cohort; the MRR
   waterfall (new/expansion/churned) reconciles to the cohort sum BY
   CONSTRUCTION — the model's first invariant check.
3. **Two acquisition engines**: funnel (visitors × conversion, CAC
   from channel mix — Part III's portfolio table) and capacity (reps
   × quota × ramp with hiring lead times); their different failure
   modes (demand-limited vs capacity-limited).
4. **The cost side**: headcount as step functions with start dates;
   payroll timing; COGS as % of MRR (hosting + support + CS);
   S&M = channel budget + sales comp; the hiring plan as the main
   discretionary lever.
5. **Statements and checks**: MRR → recognized revenue → deferred
   (annual-prepay share); P&L → balance sheet → cash (last lesson's
   articulation automated); invariants (waterfall ties, cash ties,
   headcount×salary ties) as the model's unit tests; the month cash
   crosses zero as the headline output.
6. **Honest modeling**: the exclusions list; sensitivity as a
   first-class output (which driver moves cash-zero most —
   tornado-style reading); a model's job is decisions, not prophecy.

## Set pieces and worked examples to recreate

- The driver sheet for the course case: ~15 drivers with values and
  provenance (each cites the lesson that estimated it — sBG α,β from
  Part I; CAC from the portfolio table; quota/ramp from sales
  lesson). The course literally assembles itself.
- The cohort-MRR engine worked for 6 months × 6 cohorts by hand
  (a visible triangle), then stated as the general recursion.
- The Enterprise bootstrap problem and Janz's synthetic-history fix,
  worked.
- One full invariant check: waterfall-vs-cohort-sum equality shown
  for month 6.
- The sensitivity table: cash-zero month under ±20% on five drivers.

## Pitfalls / subtleties

- The lesson builds OUR model; Janz's template is the cited
  reference artifact, not the deliverable — credit the architecture,
  own the formulas.
- The .xlsx's in-cell commentary is unread — do not quote cell
  comments; the blog post is the source.
- MRR vs GAAP revenue: the model carries both; the annual-prepay
  share creates the deferred line — do not let the waterfall
  silently become the P&L.
- Resist detail creep: no per-seat pricing tiers, no multi-currency;
  the exclusions list is the scope fence.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the model as a DAG: driver nodes
   (left) flowing through engines (acquisition, revenue, cost) into
   statements (right); the blue/black discipline as node coloring.
2. `draw:` `<FigureSequence>` (4 frames) — the revenue engine builds:
   frame 1 one cohort's MRR decaying along S(t); frame 2 stacked
   cohorts (the triangle); frame 3 the waterfall extracted
   (new/expansion/churned); frame 4 the reconciliation check ticking.
3. `draw:` single `<Figure>` — two engines side by side: funnel
   block (rates cascading) vs capacity block (reps × ramp staircase),
   both emitting "new customers/month" into the same cohort engine.
4. `draw:` single `<Figure>` — the 24-month output panel: MRR,
   recognized revenue, cash — three lines with the cash-zero month
   flagged; the model's headline view (our numbers).
5. `draw:` single `<Figure>` — sensitivity tornado: cash-zero-month
   shift under ±20% per driver, sorted — which assumptions the model
   actually rides on.

## EXERCISE PLAN

1. Warm-up: with adds = [40, 44, 48] and sBG-implied retention
   r₁=0.80, r₂=0.88 at ARPA $100 — compute month-3 MRR by cohort and
   via the waterfall; verify they tie. (The invariant once.)
2. Boundary probe: set the annual-prepay share to 100% — MRR and
   recognized revenue still tie, but billings and cash decouple
   maximally; compute month-1 cash vs revenue and state which
   statement the model MUST now carry to avoid nonsense (Ref
   balance-sheet-and-cash-flow).
3. Claim to refute: "The model says we hit $1M ARR in month 18, so
   we will." List the three driver estimates with the widest
   uncertainty (conversion, churn, ramp), propagate ±1 s.e. through
   to ARR-18 by hand (interval arithmetic), and restate the claim as
   a range — the point estimate was a scenario, not a forecast.
4. Derivation the lesson skipped: derive steady-state MRR under
   constant adds A and sBG survival: MRR_∞ = A·ARPA·Σ S(t), and
   connect Σ S(t) to Part I's expected lifetime — the model's
   long-run level is a CLV statistic (Ref customer-lifetime-value).
5. Research-shaped: Janz's Enterprise bootstrap — implement the
   synthetic trailing-12-month history for a segment with 20
   existing accounts and 25%/yr churn; show how month-1 churned-MRR
   differs with vs without the bootstrap and why omitting it
   understates early churn.
6. FORWARD (E7): read the model's cash line: find the minimum-cash
   month and amount under the base plan and under "hire 4 more in
   Q1". Solution: that minimum and its crossing time are burn/runway
   /default-alive — next lesson formalizes and randomizes them;
   `<Ref>` burn-runway-default-alive.
7. Spaced (E3): the S&M budget cell = target adds × blended CAC —
   replace with the channel-portfolio allocation (marginal-return
   equalization) and state what changes in the model's structure
   (CAC becomes spend-dependent; Ref channel-portfolio).
