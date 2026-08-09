# Research brief: margins-and-the-unit-pnl (Gross margin, COGS, and the unit P&L)

status: planned
module: unit-economics
type: core
goal: Assemble a monthly unit-level P&L from cohort metrics, separating bookings, billings, revenue, and contribution margin

Module 2 opener. Business words: gross margin, COGS, contribution margin,
bookings/billings/revenue. Academic layer: none heavy — this is the
accounting substrate the rest of the module computes on. The definitional
lesson of the course; keep it concrete with the running case and one AI
twist (inference as variable cost).

## ARC (L10)

- **Inherits:** CLV as discounted margin (customer-lifetime-value) — but m
  was "given" there. Spine step 3 opens: "A customer's value is half of the
  unit; margin, acquisition cost, payback, and price close the loop."
- **Contributes:** What m actually contains: revenue recognition (bookings ≠
  billings ≠ revenue), COGS for software/AI, gross vs contribution margin,
  and a first monthly unit P&L for the running case.
- **Hands off:** cac-and-ltv-cac divides this margin stream by what a
  customer cost to acquire.

## Sources to consult

- **Skok definitions page** (saasmetrics-definitions.txt) — "Bookings,
  Billings and Revenue – An example": the $1,000/month 12-month contract
  with 6 months prepaid → $12,000 bookings, $6,000 billed in month 1,
  $1,000/month recognized, deferred revenue on the balance sheet. The
  lesson's central worked example.
- **Skok main article** (saasmetrics-full.txt) — Ron Gill (NetSuite) quote:
  gross margin must be inside LTV ("the big lever"); "Months up Front" and
  cash-vs-churn benefits of prepay; the P&L/cash-flow trough section
  (pointer — the trough itself is next-next lesson).
- **HubSpot Forbes table** (images: saasmetrics-hubspot-ltv-cac-forbes) —
  the "Software Margin" row (~80%s) as a real margin datum; used at pointer
  depth here, fully in hubspot-unit-economics.
- **Issue #85 sketch** — the AI-COGS angle: inference as a variable cost
  makes some AI products look like low-margin businesses wearing SaaS
  multiples; treat with a constructed example (no swarm source — keep
  numbers clearly illustrative, no named-company claims).

## Key points the lesson must cover

1. **Three revenue numbers** (Skok's worked example carried through): the
   contract signed (bookings), cash collected (billings), revenue earned
   (recognized ratably); deferred revenue as the balancing entry. Cash ≠
   revenue is the module's first accounting fact and Part IV's seed.
2. **COGS for software**: hosting, third-party licenses, support,
   onboarding — and for AI products, inference compute scaling per unit of
   usage. Gross margin = (revenue − COGS)/revenue; why 70–85% is the SaaS
   norm and what a 40% margin does to every downstream ratio.
3. **Contribution margin**: subtract ALL variable costs (COGS + variable
   S&M like payment fees); fixed costs excluded. Contribution is the m in
   CLV — restate the CLV sum with m unpacked (spiral, `<Ref>`).
4. **The unit P&L**: one cohort's monthly P&L assembled from the running
   case: revenue by month (from retention), COGS, contribution; then the
   company P&L as a sum over cohorts. The bridge sentence to Part IV
   (financial statements) stated once.
5. **Margin moves multiply through everything**: a 10-point margin change
   re-scales CLV, payback, and LTV:CAC linearly — the cheapest lever in
   the unit, usually the least examined.

## Set pieces and worked examples to recreate

- **The $12,000 contract walked through three ledgers** (Skok definitions):
  month-by-month table of bookings/billings/recognized/deferred. Parallel
  exercise: same contract, annual prepay.
- **Unit P&L for the running case**: cohort of 100 customers at $50/month,
  sBG retention from module 1, 75% gross margin → monthly contribution
  stream. This table IS the module's spine object (payback and LTV:CAC
  reuse it).
- **AI-margin contrast table** (constructed): classic SaaS (COGS ~20%) vs
  AI-heavy product (inference COGS scaling with usage, ~45%): same revenue,
  CLV and payback both recomputed. Label as illustrative.

## Pitfalls / subtleties to flag

- Revenue recognition rules (ASC 606 etc.) are named, not taught — one
  sentence and a pointer; Part IV will do statements properly.
- Support/onboarding sit in COGS for SaaS but S&M for some companies —
  definitional choices change margins by points; the lesson's discipline:
  every ratio names its definitions.
- Do not moralize about AI margins; compute both cases and let the numbers
  carry it (no named-company inference costs — we have no source).
- "Unit" means cohort-customer here, not SKU; say so once (manufacturing
  readers).

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (4 frames) — **one contract, three ledgers**:
   frame 1 the $12k contract signed (bookings bar); frame 2 $6k cash lands
   (billings + deferred-revenue balloon); frame 3 months tick, revenue
   recognized monthly, deferred drains; frame 4 month 7+ second billing.
   Skok's example animated one change per frame.
2. `draw:` single `<Figure>` — **the revenue dollar dissected**: a $1 bar
   split into COGS components (hosting, support, inference) and gross
   margin; second bar subtracting variable S&M to contribution. Labels on
   the bar (voita rule 1).
3. `draw:` single `<Figure>` — **unit P&L table as figure**: the running
   case cohort's monthly revenue → COGS → contribution rows, with the
   retention curve ghosted behind the revenue row (ties module 1 in
   visually).
4. `draw:` single `<Figure>` — **SaaS vs AI-heavy margin twin panels**:
   same revenue curve, different COGS share, resulting CLV and payback
   deltas as tallies (voita rule 8 comparison grammar).
5. `draw:` single `<Figure>` — **where margin feeds**: small dependency
   diagram m → CLV → LTV:CAC → payback (grayed future nodes labeled with
   their lessons) — the module map, drawn once, reused in later lessons.

## EXERCISE PLAN

1. Warm-up: a $2,400/year contract, quarterly billing, 70% gross margin —
   tabulate bookings/billings/revenue/deferred for the first 6 months.
2. Boundary probe: 100% prepay, 12-month contract, customer churns (with
   refund clause vs without) at month 6 — what happens to revenue,
   deferred revenue, and cash in each case? Which metric lied about
   health, and when?
3. Claim to refute: "We grew revenue 40% with an 85% gross margin — the
   business is healthier than last year." Construct the counterexample
   where contribution margin fell (payment fees + support reclassified),
   and name the definitional switch that hid it.
4. Derivation the lesson skipped: show CLV scales linearly in m but
   payback = CAC/(ARPA·GM) scales as 1/GM — hence a margin improvement
   shortens payback MORE (relatively) than it raises CLV when CAC is
   fixed. State the condition.
5. Research-shaped: from the HubSpot table's "Software Margin" row
   (~80%s) and AVG MRR, estimate monthly contribution per customer per
   quarter; keep the result — hubspot-unit-economics reuses it.
6. FORWARD (E7): for the running-case cohort's contribution stream,
   compute cumulative contribution month by month and find the month
   where it crosses $500 (a hypothetical acquisition cost). Solution:
   that crossing is the payback period, and the pre-crossing deficit is
   the cash trough — `<Ref>` cac-and-ltv-cac and
   payback-and-the-cash-trough.
7. Spaced (E3, module 1): the revenue row of the unit P&L came from the
   sBG survivor function — recompute month 4's revenue directly from
   S(4|α,β) and check it matches the table.
