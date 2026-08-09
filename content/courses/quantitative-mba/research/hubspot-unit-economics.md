# Research brief: hubspot-unit-economics (Unit economics from a real company: HubSpot 2011–2012)

status: planned
module: unit-economics
type: synthesis
goal: Judge HubSpot's unit economics from its five published quarters — lifetime, LTV, LTV:CAC, payback — and defend the verdict

MODULE APPLICATION (L16). No new theory. Raw material: a real company's
published quarterly unit-economics table (Forbes 2012) plus the
segment-level decision it drove. The reader recomputes every cell,
audits the definitions, and issues a verdict the record later graded
(HubSpot IPO'd in 2014).

## ARC (L10)

- **Inherits:** Every module-2 object: margins, CAC, LTV:CAC, payback,
  churn→lifetime arithmetic, NRR framing, Goodhart diagnostics — plus
  module 1's warning that naive lifetime math is biased.
- **Contributes:** Spine step 4's close: "HubSpot's five published
  quarters get a verdict." The module exercised end-to-end on real
  numbers, including where the published table's own methods are naive.
- **Hands off:** Module 3: the levers this analysis surfaces (retention,
  channel mix) are causal claims that need experiments — the verdict says
  WHAT improved, not what CAUSED it; randomization is the next module's
  opening.

## APPLICATION SPEC (L16)

- **Artifact:** HubSpot's quarterly unit-economics table, Q1'11–Q2'12
  (published by Forbes, Sept 2012; image
  saasmetrics-hubspot-ltv-cac-forbes): rows LTV:CAC, CAC, MRR churn, AVG
  MRR/customer, Software Margin, LTV — five quarters. Plus Brad Coffey's
  segment table (direct LTV:CAC 1.5 vs channel 5.0) and the rep
  reallocation (12→2 direct, 4→25 channel within a year) from Skok's
  article.
- **Module results used:** lifetime = 1/churn and its bias
  (customer-lifetime-value); LTV = ARPA×GM×lifetime (cac-and-ltv-cac);
  payback from CAC/(ARPA×GM) (payback-and-the-cash-trough); revenue vs
  customer churn (mrr-nrr-and-negative-churn); definitional audit +
  gaming checks (goodharts-law); margin's role (margins-and-the-unit-pnl).
- **Departures from the idealisation (must be named):** the table uses
  undiscounted, naive 1/churn lifetime (no sBG, no heterogeneity — the
  module 1 correction is unavailable from published data and the lesson
  computes the direction of the resulting bias); CAC is blended, spend
  timing unstated; "Software Margin" definition unstated; churn is
  MRR churn, not logo churn. The audit names each and bounds its effect.

## Sources to consult

- **saasmetrics-full.txt** — "Unit Economics in Action: HubSpot Example"
  (the table's framing: "improved dramatically… driven by reducing MRR
  churn 3.5% → 1.5%"); "The Importance of Customer Segmentation" (Coffey:
  direct 1.5 vs channel 5.0; the rep shift). Both quarters' guidelines
  sections for the thresholds to judge against.
- **Image saasmetrics-hubspot-ltv-cac-forbes** — the primary numeric
  source; transcribe all 30 cells into the lesson's data table.
- **Module lessons' briefs** — the formulas being exercised; no new
  sources.
- Context (References only, no new claims): HubSpot S-1 (2014) exists and
  is the natural "what happened next" pointer; do not import S-1 numbers
  without verification.

## Key points the lesson must cover

1. **Recompute the table**: from churn + AVG MRR + margin, rebuild
   lifetime, LTV, and the ratio per quarter; check against the printed
   rows; find where rounding or definition choices show. (LTV:CAC 1.7 →
   1.9 → 1.9 → 2.6 → 3.5 → 4.7 across the published span — note the table
   shows 5-6 columns; transcribe exactly when drafting.)
2. **Attribute the improvement**: decompose ΔLTV:CAC into Δchurn, ΔARPA,
   Δmargin, ΔCAC contributions (the metric-tree decomposition applied);
   the finding — churn 3.5%→1.5% did most of the work: retention, not
   cheaper acquisition, fixed the unit.
3. **Audit the definitions** (Goodhart discipline): naive lifetime bias
   direction under heterogeneity (true LTV likely HIGHER than printed —
   state why, from module 1); blended CAC and what it hides; undiscounted
   sum at 60+ month implied lifetimes (discounting would cut LTV
   materially at 1.5% churn — compute both).
4. **The segment cut and the decision**: 1.5 vs 5.0 by channel; what the
   reallocation (12→2, 4→25 reps) assumed (marginal ≈ average within
   channel; channel capacity) and how fast it paid.
5. **The verdict, written like an operator**: Q1'11 HubSpot fails every
   guideline; Q2'12 passes; the honest statement of what the published
   data CANNOT establish (causality of any lever; cohort-level NRR;
   cash position) — each gap naming the course lesson that would close
   it.

## Set pieces and worked examples to recreate

- **The full recomputation table**: printed cells vs recomputed cells,
  discrepancies highlighted — the audit as a table.
- **The decomposition waterfall**: ΔLTV:CAC 1.7→4.7 split into the four
  drivers' contributions.
- **Discounted vs undiscounted LTV at 1.5% monthly churn** (implied
  lifetime 67 months): the tail's share of printed LTV, at d = 1%/mo.
- **The channel decision**: expected portfolio LTV:CAC before/after the
  rep shift under stated assumptions.

## Pitfalls / subtleties to flag

- Transcribe the table from the image carefully at drafting time; quote
  quarters exactly as printed (the reading swarm reports Q1'11–Q2'12 with
  ratio path 1.7→4.7 and churn 3.5%→1.5%).
- This is Forbes-published company-provided data: third-party printed,
  self-reported — say so once; that dual status is itself a teaching
  point (audit posture).
- Resist adding S-1/IPO numbers without verification; the "what happened
  next" is one sentence with a References pointer.
- The lesson must not re-teach formulas — every formula appears as a
  `<Ref>` + one-line recap (L11d), then gets USED.

## FIGURE PLAN

1. `source:` **saasmetrics-hubspot-ltv-cac-forbes** — save as
   `hubspot-forbes-table` (same crop as cac lesson but full-width
   placement). Reader must see: every row/column legible — this is the
   lesson's dataset. Placement: centered at the top, immediately after
   the opening; caption states provenance (Forbes 2012, company-provided)
   and that every cell gets recomputed below.
2. `draw:` single `<Figure>` — **recomputed vs printed**: the table
   redrawn with recomputed cells beside printed ones, mismatches marked
   amber.
3. `draw:` single `<Figure>` — **the improvement decomposed**: waterfall
   from 1.7 to 4.7 with churn/ARPA/margin/CAC contribution bars.
4. `draw:` single `<Figure>` — **discounting the tail**: printed
   undiscounted LTV bar vs discounted bar at d=1%/mo, the tail share
   shaded; caption ties to module 1's bias discussion (two corrections
   pulling opposite directions — naive-vs-sBG raises, discounting cuts).
5. `draw:` single `<Figure>` — **the channel split decision**: two
   segment panels (direct 1.5, channel 5.0) with rep headcounts before/
   after as the changed element (voita rule 8).

## EXERCISE PLAN

1. Warm-up: none (application lesson; starts at work).
2. Research-shaped (core): recompute lifetime, LTV, LTV:CAC for Q1'11 and
   Q2'12 from churn, AVG MRR, and Software Margin; identify which printed
   cells your numbers reproduce within rounding and which need an
   unstated definition to match.
3. Boundary probe: at churn → 1.5%/mo the implied lifetime is 67 months —
   recompute LTV truncated at 36 months and at d=1%/mo discounting; state
   how much of the printed LTV lives in a tail the data never observed
   (the fit-vs-extrapolation lesson of module 1, now in dollars).
4. Claim to refute: "LTV:CAC hit 4.7, so HubSpot should have cut price to
   grow faster." Break it with the module's machinery: price flows to
   margin AND churn (pricing lesson); the ratio's numerator is a
   forecast; and the decision metric for financing growth is payback —
   compute payback per quarter from the table and see what it says.
5. Derivation the lesson skipped: derive the exact decomposition of
   Δ(LTV:CAC) into the four drivers (log-differentiation makes it
   additive: Δln ratio = Δln ARPA + Δln GM − Δln churn − Δln CAC) and
   apply it to the printed endpoints.
6. FORWARD (E7): the table shows churn falling while LTV:CAC rises — list
   three rival explanations (product improved; mix shifted to channel
   customers who churn less; definitional change), and state for each
   what data or DESIGN would distinguish it. Solution: distinguishing
   them is a causal question — randomization or quasi-experiment — the
   next module's whole subject; `<Ref>` ab-tests-and-randomization.
7. Spaced (E3, module 1): using the sBG intuition, argue the direction of
   bias in "lifetime = 1/(blended MRR churn)" when the base mixes young
   and old cohorts — and which way HubSpot's printed LTV most likely errs.
