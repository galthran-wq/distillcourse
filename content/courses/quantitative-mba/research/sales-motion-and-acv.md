# Research brief: sales-motion-and-acv (Sales motion: ACV, the bowtie funnel, and rep capacity)

status: planned
module: growth-channels
type: core
goal: Analyze a sales-led funnel as a throughput system — stages, cycle time, quota capacity — and calibrate ACV against CAC and payback

The human-powered channel, treated as a machine. Business words: ACV,
sales cycle, quota, pipeline, magic number. Academic layer: none new —
throughput/capacity arithmetic + the bowtie instrumentation; Part I
payback reprised. Dig-deeper: Winning by Design bowtie; Skok.

## ARC (L10)

- **Inherits:** payback discipline and CAC (Part I), the funnel object
  (Part I lesson 1), PLG's PQL handoff (previous lesson's forward
  exercise).
- **Contributes:** Spine step 12's close: sales is a capacity-
  constrained queue — the ACV↔CAC diagonal decides which motion can
  exist, the bowtie instruments the full revenue relationship, and
  bookings capacity = reps × quota × ramp.
- **Hands off:** channel-portfolio (sales as a portfolio position with
  step-function capacity); financial-model (the sales-capacity engine
  becomes a driver block — Janz's Enterprise tab).

## Sources to consult

- **Winning by Design (FULL, cached)**:
  - The Recurring Revenue Bowtie (Figure 1): Awareness–Education–
    Selection | close | Onboard–Impact–Expand; the VM1–8/CR1–7/Δt1–7
    instrumentation (CC BY-NC 4.0 — notation reusable with credit).
  - THE stat: 72–93% of customer lifetime value arrives after the
    close — the number that reorganizes sales thinking around NRR.
  - The seven "X, not Y" reframes — use 2–3 (results-not-usage,
    orchestrating-not-onboarding) as the post-close discipline, list
    the rest in one line.
  - Methodology-span history (solution/consultative/strategic selling,
    2003 dating) — one short paragraph, flagged as the source's own
    unsourced dating.
- **Skok SaaS Metrics 2.0 (cached, Part I canon)** — sales-capacity
  planning: reps ramping, quota, pipeline coverage; magic number =
  payback in disguise (Part I already introduced; here per-motion).
- **Christoph Janz's "five ways to build a $100M business" ACV ladder**
  — NOT in canon; do not cite. The ACV↔CAC diagonal must be built from
  first principles instead: payback ≤ N months ⇒ CAC ≤ ARPA·GM·N —
  each motion has a CAC floor (labor cost of the motion), which
  implies an ACV floor. Derive, don't attribute.
- **OpenView benchmarks** — sales-touch discipline numbers (14% vs
  30%+) for the PLG-overlay paragraph.
- **Dropbox S-1** — "nearly all of our largest outbound deals
  originated as smaller self-serve deployments": the layered-motion
  evidence sentence.

## Key points the lesson must cover

1. **Motions as cost structures**: self-serve / inside sales / field
   sales — each has a floor CAC set by labor (rep salary + SDR + SE
   per closed deal). Derive the viability diagonal: ACV must clear
   CAC floor × payback discipline; off-diagonal cells (field-selling
   a $500 product) die by arithmetic, not taste.
2. **The B2B funnel with stages and times**: MQL/SQL/opportunity/close
   as conversion×time pairs; pipeline coverage ratios; sales cycle
   length as the Δt that sets cash timing (ties to Part I cash
   trough — long cycles deepen it).
3. **Capacity arithmetic**: bookings ceiling = reps × quota × ramp
   factor; hiring lead time makes revenue a lagged headcount function;
   the practical planning identity (to add $1M ARR at $50k
   quota-attainment/quarter, hire N reps M months early).
4. **The bowtie**: the post-close cone (onboard → impact → expand)
   instrumented like the pre-close funnel; 72–93% post-close ⇒ CS/AM
   staffing follows NRR; expansion CR as a metric peer of close rate.
5. **Blended motions**: PLG + sales (PQL-fed reps), the
   ACV-repricing effect (self-serve seeds expanding into outbound
   deals — Dropbox sentence); magic number/sales efficiency as the
   cross-motion comparator (= payback, Ref).

## Set pieces and worked examples to recreate

- The viability diagonal built numerically: four motions × (CAC floor,
  min viable ACV at 12-month payback, GM 80%) — a 4-row table the
  reader can extend.
- A full pipeline model for the course case's Enterprise tier: leads →
  SQL 30% → opp 50% → close 25%, cycle 90 days, quota $400k/yr, ramp
  6 months — compute reps needed for the plan and the pipeline
  coverage required.
- The bowtie instrumented with the course case's numbers: CRs and Δts
  on both cones; NRR target ⇒ expansion CR needed.
- 72–93% post-close: verify the claim's arithmetic from Part I
  machinery (NRR ~100%, multi-year lifetimes ⇒ post-close share of
  LTV) — the source's stat recomputed rather than quoted.

## Pitfalls / subtleties

- WbD is a training vendor; the bowtie is licensed CC BY-NC with
  attribution — credit the framework, recompute the numbers.
- The 2003 strategic-selling dating and methodology history are
  asserted, unsourced — keep to one flagged paragraph or cut.
- Quota attainment is not 100%: use attainment-adjusted capacity
  (industry ~60–70%, flag as folklore range) or model explicitly.
- Don't re-teach CAC/payback — Ref Part I; this lesson's new content
  is capacity and the diagonal.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the ACV↔CAC diagonal: log-ACV vs
   log-CAC plane; viable band along the diagonal; motions placed
   (self-serve, inside, field); dead corners labeled with why
   (payback fails / demand fails).
2. `draw:` single `<Figure>` — the bowtie: pre-close funnel mirrored
   by the expansion cone, CR/Δt labels on every stage, the 72–93%
   post-close share shaded (recreate WbD Figure 1's structure in
   house style, credited).
3. `draw:` `<FigureSequence>` (4 frames) — capacity into revenue:
   frame 1 hire 2 reps (ramp curve); frame 2 productive capacity vs
   time; frame 3 bookings lagging hires; frame 4 the planning read —
   to hit Q4 bookings, hiring happened in Q1. One layer per frame.
4. `draw:` single `<Figure>` — pipeline waterfall for the worked
   Enterprise plan: leads → SQL → opp → won with counts and the
   coverage ratio called out; cycle time as horizontal extent.
5. `draw:` single `<Figure>` — cash timing by motion: cumulative cash
   for one $60k ACV deal (90-day cycle, annual prepay) vs 100 × $600
   self-serve — same bookings, different trough shape (Part I trough
   revisited per motion).

## EXERCISE PLAN

1. Warm-up: reps cost $180k OTE loaded, close 3 deals/quarter after a
   2-quarter ramp — compute the CAC floor per deal and the minimum
   ACV at a 12-month payback with 80% GM. (The diagonal once.)
2. Boundary probe: push cycle time to 12 months with annual-prepay
   billing — show the deal's cash payback becomes cycle + payback,
   and a fast-growing team goes cash-negative even at LTV:CAC > 5
   (the trough deepened by Δt; Ref payback-and-the-cash-trough).
3. Claim to refute: "Our close rate doubled, so we can halve the
   sales team." Use the capacity identity and pipeline coverage to
   show close rate moves bookings per rep, not the demand ceiling;
   name the constraint that actually binds (lead flow vs capacity —
   diagnose which regime from the data given).
4. Derivation the lesson skipped: verify 72–93% post-close from first
   principles — at NRR 110%/yr and 5-year expected relationship,
   compute the fraction of total contract value arriving after the
   initial close; state the NRR/lifetime combinations spanning the
   source's range.
5. Research-shaped: the magic number (net new ARR × 4 / S&M spend) —
   compute it for HubSpot's published quarters (Part I dataset, Ref
   hubspot-unit-economics) and translate to implied payback; check
   against the 1.0-magic-number ≈ 12-month folklore.
6. FORWARD (E7): the sales plan needs 6 reps hired by Q1 to make the
   Q4 number — at $180k each this is a payroll line that precedes
   revenue by 3 quarters. Compute the cash-flow profile of the hire
   cohort. Solution: this step-function cost line is exactly what the
   driver-based financial model schedules, and what makes runway a
   trajectory not a division; `<Ref>` financial-model,
   burn-runway-default-alive.
7. Spaced (E3): which stage of the bowtie is a controlled experiment
   possible on, and which suffers interference (territory
   assignment)? Design the A/B for a new pitch deck (unit, metric,
   MDE with 40 deals/quarter — likely underpowered; say what that
   implies) (Ref power-and-mde).
