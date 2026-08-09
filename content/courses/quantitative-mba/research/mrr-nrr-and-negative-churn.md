# Research brief: mrr-nrr-and-negative-churn (MRR, NRR, and negative churn)

status: planned
module: unit-economics
type: core
goal: Decompose MRR movement into new, expansion, and churned components and compute NRR and GRR from cohort revenue

Business words: MRR/ARR, NRR/GRR, expansion/contraction, negative churn.
Academic layer: none new — the rigor is ledger discipline plus the
compounding arithmetic of negative churn. Fully grounded in Skok (read in
full).

## ARC (L10)

- **Inherits:** Customer-level churn (module 1) and the revenue side of the
  unit P&L (margins-and-the-unit-pnl); payback's cash flows.
- **Contributes:** The revenue ledger at company level: the MRR waterfall,
  the revenue-vs-customer churn split, NRR/GRR, and negative churn as
  growth without acquisition. Spine step 3's ledger piece.
- **Hands off:** north-star-and-metric-trees builds the driver tree whose
  leaves are exactly these movements; pricing-and-willingness-to-pay
  explains where expansion revenue comes from.

## Sources to consult

- **Skok main article** (saasmetrics-full.txt) — "SaaS Bookings: Three
  Contributing Elements" (Net New MRR = New + Expansion − Churned; why it
  replaces 'bookings'); "The Importance of Customer Retention" (3% of 100
  vs 3% of 1,000,000 customers; the churn ceiling: constant churn +
  constant adds ⇒ ARR asymptote — Ron Gill's commentary); "The Power of
  Negative Churn" ($6k/mo constant bookings → $140k at +3% churn vs $450k
  at −3% after 40 months); "Revenue Churn vs Customer Churn" (the
  100-customer worked example: 10% customer churn = 3.4% revenue churn).
- **Skok definitions page** (saasmetrics-definitions.txt) — the churn/
  retention glossary table: % Net MRR Churn, MRR Expansion, Customer
  Renewal Rate, Gross Dollar Renewal Rate (=GRR), NRR/DRR; the NRR worked
  cohort ($100k − $10k churn + $20k expansion = 110%); "most public SaaS
  companies run NRR ≥ 120%"; the four-most-important-metrics list (Net New
  ARR growth, burn, months-to-recover-CAC, NRR).
- **Image: saasmetrics-hubspot-waterfall-chart** — HubSpot's real nightly
  Net MRR tracking dashboard (Brad Coffey), the operating artifact.

## Key points the lesson must cover

1. **The waterfall**: New + Expansion − Contraction − Churned = Net New
   MRR; monthly ledger on the running case; why Net New MRR replaced
   bookings as the SaaS operating number (contract-length mixing).
2. **Two churches of churn**: customer (count) vs revenue (dollars); the
   worked divergence (50×$100 + 50×$1,000; lose 9 small + 1 large → 10%
   vs 3.4%). Neither is "correct" — they answer different questions
   (product stickiness vs revenue durability).
3. **NRR and GRR on a cohort**: the $100k → $110k example; GRR ≤ 100% by
   construction, NRR can exceed it; NRR ≥ 120% as the public-SaaS norm —
   with the frame that NRR > 100% means the installed base compounds.
4. **Negative churn compounds** (the keeper chart): identical $6k/mo new
   bookings, ±3% net revenue churn → $140k vs $450k and still diverging at
   month 40. Derive the asymptote for positive churn (ceiling = adds/churn)
   and the compounding for negative — the difference between a geometric
   series that converges and one that doesn't.
5. **The churn ceiling as diagnosis**: a company's current ARR position
   relative to adds/churn says how much growth is left at current motion —
   a one-line formula with real diagnostic force.

## Set pieces and worked examples to recreate

- **The ±3% cohort layer-cake pair** (Skok): recreate both charts from the
  stated parameters; the $140k/$450k endpoints are the keepers.
- **Revenue-vs-customer churn table**: Skok's exact 100-customer example.
- **NRR cohort ledger**: the $100k January cohort walked 12 months.
- **Ceiling arithmetic**: adds $6k/mo, net churn 3%/mo ⇒ ARR ceiling
  $200k MRR — compute, then show the company's growth curve bending toward
  it.

## Pitfalls / subtleties to flag

- Expansion concentrates in surviving accounts — NRR mixes a survival
  effect and an upsell effect; a cohort NRR of 110% does NOT mean the
  average surviving account grew 10% (survivorship inside the metric —
  spiral to sorting).
- Windows again: monthly vs annual churn do not annualize by ×12 (compound:
  1−(1−c)^12); compute once.
- MRR is not revenue (rec. rules) and not cash (billing) — one sentence
  tying back to margins-and-the-unit-pnl's three ledgers.
- Beware NRR definitional games (which cohort, which window, logo vs
  dollar) — plant one clause for goodharts-law.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the MRR waterfall**: start-of-month bar →
   +new, +expansion, −contraction, −churned → end-of-month bar; running
   case numbers on the bars.
2. `source:` **saasmetrics-hubspot-waterfall-chart** — save as
   `hubspot-mrr-dashboard`. Reader must see: +New MRR, −Churned MRR, Net
   MRR tracks vs day-of-month plan with the % callouts — a real company's
   nightly operating chart. Placement: float-right beside the waterfall
   section; caption: this is what the ledger looks like as an internal
   tool (contributed by HubSpot's VP Strategy to Skok's article).
3. `draw:` single `<Figure>` — **customer vs revenue churn**: the
   100-customer grid (50 small, 50 large), churned cells crossed out, the
   two percentages computed beside it (10% vs 3.4%).
4. `draw:` single `<Figure>` — **±3% divergence**: both cumulative-revenue
   layer cakes on one axis pair, endpoints labeled $140k/$450k (recreated
   from Skok's parameters, not copied).
5. `draw:` single `<Figure>` — **the churn ceiling**: ARR trajectory under
   constant adds and churn bending to the adds/churn asymptote; three
   curves for churn 1%/2%/4% with ceilings marked.
6. `draw:` single `<Figure>` — **NRR dissected** (voita rule 7): the NRR
   fraction with churn and expansion terms colored, and the survivorship
   footnote drawn as a small inset (which accounts the expansion came
   from).

## EXERCISE PLAN

1. Warm-up: a month's ledger (start $80k; new $6k; expansion $3k;
   contraction $1k; churned $4k) — Net New MRR, ending MRR, net revenue
   churn %, and annualized churn. (Ledger mechanics, once.)
2. Boundary probe: NRR = 100% exactly — show the base neither grows nor
   decays and ALL growth must come from new logos; then show at NRR=100%
   with customer churn 15%, the surviving accounts must expand ~17.6% —
   NRR hides violent internal motion. Which definition step conceals it?
3. Claim to refute: "Our NRR is 115%, so even with zero marketing we'd
   grow 15% a year forever." Break it: cohort NRR decays with age
   (expansion front-loaded), NRR is measured on survivors of a chosen
   window, and the blended NRR mixes vintages — construct a two-cohort
   example where blended NRR is 115% while every cohort older than 2
   years runs 98%.
4. Derivation the lesson skipped: derive the MRR ceiling MRR_∞ = A/c for
   constant adds A and net churn c from the recursion
   MRR_{t+1} = (1−c)·MRR_t + A, and the doubling behavior when c < 0.
5. Research-shaped: reproduce Skok's $140k/$450k endpoints at month 40
   from $6k/mo adds and ±3%/mo net churn; state the recursion you used
   and your agreement tolerance.
6. FORWARD (E7): decompose the running case's Net New MRR into the driver
   product (leads × conversion × ARPA) + expansion − churn·MRR and compute
   the sensitivity of ending MRR to a 10% improvement in each driver.
   Solution: that decomposition-and-sensitivity is the metric tree —
   `<Ref>` north-star-and-metric-trees.
7. Spaced (E3, module 1): explain the mechanism behind "expansion
   concentrates in survivors" with the sorting effect: surviving accounts
   have lower θ AND longer exposure to upsell — two selection effects
   pointing the same way.
