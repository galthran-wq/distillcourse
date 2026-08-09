# Research brief: plg-and-freemium (Product-led growth and freemium economics)

status: planned
module: growth-channels
type: core
goal: Analyze freemium and free-trial funnels against benchmark conversion data and evaluate PLG economics on Dropbox's published cohorts

The product-as-channel lesson, grounded in one benchmark survey and one
S-1. Business words: PLG, freemium, free trial, activation, PQL.
Academic layer: none new — funnel arithmetic + Part I metrics on a new
motion; versioning/price-fence economics reprised. Dig-deeper: OpenView
benchmarks; Dropbox S-1.

## ARC (L10)

- **Inherits:** virality (the free tier is the viral surface; K needs a
  population to run on), NRR/negative churn (Part I) — PLG's expansion
  engine, and pricing-and-willingness-to-pay (free as the bottom tier).
- **Contributes:** Spine step 12's second move: the product is the
  channel. Freemium vs free-trial funnel arithmetic with benchmark
  rates, the free tier priced as channel spend, PLG's metric set, and
  Dropbox's cohorts as the evidence.
- **Hands off:** sales-motion-and-acv (PLG-to-sales layering: PQLs feed
  reps); channel-portfolio (PLG as a portfolio position with its own
  saturation); financial-model (self-serve engine as a driver block).

## Sources to consult

- **OpenView pillar + 2022 Benchmarks (FULL via Wayback, cached)**:
  - Definitions & history: PLG coined 2016; three GTM eras.
  - THE Story of 1,000 Visitors: freemium 6% visit→signup (60), 5%
    free→paid (3, ~2 self-serve); trial 4% (40), 17% (7, 1 self-serve).
  - Convert: only 5% of freemium signups ever pay; a third of freemium
    companies sales-touch every signup vs standout ~14%; PQL adoption
    45% (freemium) vs 19% (sales-led).
  - Scale: 30-day retention 20% freemium / 16% standout; Discover:
    organic search 53% + product referrals 13% of best freemium
    acquisition.
  - Measurement: NDR 130–150% best-in-class; activation 20–40%; the
    $10M-ARR crossover (PLG slower below, >2× likelier to hit 100%
    growth above); smile-curve retention as the fundraising signal.
  - Caveat: report charts were client-rendered — numbers come from
    prose; the underlying per-bar values are unrecoverable.
- **Dropbox S-1 (FULL, cached forms-dbx)**:
  - >90% self-serve revenue; no significant outbound; largest deals
    originated self-serve.
  - Cohort chart: every quarterly cohort's subscription revenue grows
    after signup; Jan-2015 cohort doubled in <3 years; later cohorts
    monetize faster.
  - 500M registered vs 11.0M paying (2017) — the free-base ratio;
    ~300M "likelier to pay" framing; 40% of new Business teams
    included a prior individual subscriber; NRR ~100% (Business) />90%
    blended.
  - Infrastructure COGS story (33→67% GM) belongs to
    balance-sheet-and-cash-flow — one cross-ref only.
  - The "3900% referral growth" figure is NOT in the filing — teach
    that absence as a source-criticism beat.
- **Easley & Kleinberg ch.17** — network effects/tipping for the ★
  section: freemium products with network value have adoption
  thresholds; Granovetter bottleneck (small price/quality change ⇒
  discontinuous adoption jump) as the formal version of "PLG compounds
  past a threshold".
- **Part I internal**: pricing lesson's versioning/price fences;
  mrr-nrr (expansion mechanics).

## Key points the lesson must cover

1. **The motion defined**: acquisition/conversion/expansion in-product;
   self-serve vs sales-assisted; the three-era GTM history in one
   paragraph (field sales → inbound → PLG).
2. **Freemium vs free trial as two funnels**: the 1,000-visitors
   arithmetic end to end; the tradeoff (volume vs close rate); reverse
   trials one sentence. Benchmarks are medians of a 450-company survey
   — carry the uncertainty honestly.
3. **The free tier priced as a channel**: cost = hosting/support ×
   free base (COGS from Part I); yield = conversions (5%) + viral
   surface (K from previous lesson) + data. Compute effective CAC of a
   freemium signup and compare with paid channels — free is cheap per
   signup, expensive per customer, and the ratio is computable.
4. **PLG metrics**: activation, PQL (behavior-scored sales handoff),
   NDR 130–150%, natural-rate-of-growth; the discipline: sales-touch
   the 14%, not the 100% (needle-in-haystack).
5. **Dropbox as the evidence**: cohort expansion curves (the S-1's own
   charts), >90% self-serve at $1.1B revenue, individual→team seeding
   (40%), and the $10M-ARR crossover claim tested against its history.

## Set pieces and worked examples to recreate

- The 1,000-visitors table computed both ways, then extended one step:
  revenue per 1,000 visitors under each motion at a given ARPA — the
  full compare.
- Effective-CAC-per-paying-customer computation combining virality
  (K=0.6 exercise from previous lesson) with the 5% conversion.
- Dropbox cohort chart read as Part I machinery: which NRR the area
  chart implies; why cohort revenue growth = negative churn.
- The absent-3900% source-criticism beat: the famous growth-hacking
  number vs what the filing actually says.

## Pitfalls / subtleties

- OpenView is a VC selling the thesis — benchmark numbers are survey
  medians with unknown selection; state provenance, use as anchors not
  laws.
- Freemium cannibalization: free tier competes with paid where WTP
  overlaps — the fix is fence design (features/capacity/users), i.e.
  the pricing lesson's price-discrimination machinery; one section,
  reprise not re-teach.
- PLG ≠ no sales: standouts layer sales on PQLs; the dichotomy is a
  spectrum (WbD bowtie next lesson).
- Dropbox pre-pricing S-1: blank price fields; numbers are 2017 and
  dated — say so.

## FIGURE PLAN

1. `draw:` single `<Figure>` — two funnels side by side: freemium vs
   trial from 1,000 visitors, stage boxes with the OpenView rates and
   absolute counts, ending at 3 vs 7 paying (the lesson's master
   numbers).
2. `draw:` single `<Figure>` — the free tier as a channel: cost side
   (COGS × free base) vs yield side (conversions + viral loop arrow
   back to top of funnel + PQL stream to sales) — an economics diagram,
   not a marketing one.
3. `draw:` `<FigureSequence>` (3 frames) — individual→team→enterprise
   seeding: frame 1 one free individual inside a company; frame 2 a
   paying team forms around them (40% stat labeled); frame 3
   enterprise agreement — the Dropbox land-and-expand path.
4. `source:` **forms-dbx-cohort-economics-area-chart** — save as
   `dropbox-cohort-area-chart`. Reader must see: stacked quarterly
   cohorts each WIDENING with age (expansion), the 2013–2018 span.
   Placement: centered in the evidence section; caption: the S-1's own
   exhibit — the curve shapes are the filed evidence, not
   reconstructable. Redraw would fabricate the shapes.
5. `source:` **forms-dbx-cohort-expansion-line-chart** — save as
   `dropbox-cohort-index-chart`. Reader must see: three January
   cohorts indexed to month 1, later cohorts steeper. Placement: small,
   beside the NRR reading; pairs with #4 (same argument, per-cohort).
6. `draw:` single `<Figure>` — the smile curve vs decay curve:
   flattening cohort retention (PMF signal investors read) vs
   declining — with the Part I sBG fit overlaid on the flattening one
   (spiral visual).

## EXERCISE PLAN

1. Warm-up: recompute the Story of 1,000 Visitors for 10,000 visitors
   and ARPA $30/mo: signups, payers, self-serve payers, MRR per 10k
   visitors under each motion. (Benchmarks exercised once.)
2. Boundary probe: set free→paid conversion to 0 — the freemium
   channel's value reduces to its viral yield alone; compute the K
   that would justify a free base costing $0.40/user/yr COGS against
   paid CAC $40, and judge plausibility against the previous lesson's
   K benchmarks.
3. Claim to refute: "Freemium converts worse than trials (5% vs 17%),
   so trials are the better motion." Use the full per-1,000-visitors
   arithmetic (60×5% ≈ 3 vs 40×17% ≈ 7 — trials still win here) THEN
   flip it with a viral term (free base K=0.5 doubles effective
   signups) — the comparison is motion economics, not one rate; name
   the crossover condition.
4. Derivation the lesson skipped: derive the steady-state free-base
   size under signups s/month and free-tier churn c_f (base = s/c_f),
   and hence the steady-state COGS of "free" — the number missing
   from most freemium pitches.
5. Research-shaped: from the Dropbox S-1 numbers (11.0M payers, $1,107M
   revenue, ~100% Business NRR, 500M registered), estimate revenue per
   registered user and per paying user; compare the implied
   free-to-paid ratio with OpenView's 5% benchmark and reconcile the
   gap (cumulative registrations ≠ active free base — a vanity-metric
   read, Ref goodharts-law).
6. FORWARD (E7): a PLG company's PQL stream is 200/month; a rep can
   work 80 PQLs/month closing 25% at $6k ACV. Compute reps needed and
   bookings capacity. Solution: revenue became a headcount formula —
   sales capacity, next lesson's subject; `<Ref>` sales-motion-and-acv.
7. Spaced (E3): design the price fence between free and paid tiers
   using the pricing lesson's WTP distribution (Ref
   pricing-and-willingness-to-pay): which feature gates high-WTP users
   without destroying the viral surface — one paragraph, argued from
   the elicitation data shape.
