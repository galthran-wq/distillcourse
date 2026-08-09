# Research brief: pnl-and-revenue-recognition (The income statement: revenue recognition and EBITDA)

status: planned
module: startup-finance
type: core
goal: Construct a SaaS income statement with correct revenue recognition and evaluate EBITDA and its non-GAAP variants

Statements, part 1 of 2. Business words: P&L, revenue recognition,
deferred revenue, EBITDA, non-GAAP. Academic layer: accrual accounting
as a state machine; the recognition timing rules as invariants.
Dig-deeper: Berk & DeMarzo ch.2 (toc-only); primary filings (Zynga,
WeWork, Dropbox — all cached in full).

## ARC (L10)

- **Inherits:** Part I's bookings/billings/revenue triple and the unit
  P&L (margins-and-the-unit-pnl); Zynga's bookings mechanics (module 5
  application already exercised the identity).
- **Contributes:** Spine step 15 opens: the two clocks (cash vs
  earning) and the machinery separating them — deferred revenue,
  accrual lines, the P&L's anatomy — plus the discipline for reading
  EBITDA and its "adjusted" descendants.
- **Hands off:** the balance-sheet accounts this lesson keeps invoking
  (deferred revenue, AR, prepaids) get their statement next lesson;
  the non-GAAP reading skill peaks at wework-s1-reading.

## Sources to consult

- **Berk & DeMarzo ch.2 (TOC + preface highlights)** — the statement
  anatomy skeleton (income statement lines, the DuPont pointer);
  structure only, numbers built in-course.
- **Zynga filings (FULL, cached)** — the primary worked material:
  - Bookings = revenue + Δdeferred (S-1 pp.47–48); durable vs
    consumable virtual goods; the 15→12-month life change adding
    $14.1M (10-K MD&A p.48) — estimates as levers.
  - 2011 net loss −$404.3M driven by IPO-triggered ZSU comp — the
    line-reading exercise (operating vs one-time).
- **WeWork S-1 (FULL, cached)** — the Adjusted EBITDA reconciliation
  (MD&A p.114): nine quarters, eight add-backs, both flavors negative
  and widening — the non-GAAP ladder exhibit (full treatment in the
  wework lesson; here one reconciliation walked once).
- **Dropbox S-1 (FULL)** — the restrained counterexample: ONE non-GAAP
  metric (FCF), defined plainly — non-GAAP is a choice, not a law.
- **Skok (cached)** — SaaS P&L conventions (rev rec for annual
  prepay; gross-margin lines); the practitioner layout the model
  lesson will use.
- ASC 606 (five-step model): describe at register level (no cached
  source) — performance obligations, ratable recognition for
  subscriptions; keep to the subscription case, no license/percent-
  complete detours.

## Key points the lesson must cover

1. **The two clocks**: a $12,000 annual prepay — cash now, revenue
   1,000/month, deferred revenue the difference; the SAME contract's
   three tracks (booking day, billing day, twelve recognitions) —
   Part I's triple now with the liability account named.
2. **P&L anatomy top-down**: revenue → COGS → gross margin → opex
   (S&M, R&D, G&A) → operating income → below-the-line (interest,
   tax) → net income; which lines are unit-driven (Part I's unit P&L
   aggregates up) and which are step/period costs.
3. **Recognition as rules, estimates as levers**: ratable recognition
   for subscriptions (ASC 606 shape); where judgment enters —
   Zynga's durable-goods life change (+$14.1M from one estimate);
   the general lesson: recognized revenue is a policy output.
4. **EBITDA**: definition; the legitimate job (comparing operating
   engines across capital structures/D&A policies); the abuse
   gradient (EBITDA → adjusted EBITDA → adjusted-with-house-
   adjustments); reconciliations read BOTTOM-UP (start at net income,
   interrogate each add-back as an argument).
5. **The reading protocol** (the lesson's transferable skill): for
   any income statement — (a) reconcile revenue to billings via
   Δdeferred; (b) separate one-time from operating lines; (c) check
   which estimates the notes disclose changing; (d) treat every
   non-GAAP metric as a claim with a burden of proof.

## Set pieces and worked examples to recreate

- The $12,000-contract triple-track table across 12 months: booking,
  billing, recognition, deferred balance — the lesson's spine
  computation.
- The course case's first full monthly P&L assembled from Part I's
  unit economics (ARPA, GM%, S&M=CAC×adds, R&D/G&A as period costs)
  — the artifact financial-model extends to 24 months.
- Zynga's estimate lever recomputed (exercise 5 of the zynga brief,
  now from the accounting side).
- The WeWork reconciliation walked once, briefly: net loss →
  +D&A → +stock comp → … → 'Adjusted EBITDA excl. lease cost' —
  still negative; label each add-back defensible/contestable.
- Dropbox's one-metric restraint as the contrast paragraph.

## Pitfalls / subtleties

- Berk–DeMarzo unread beyond ToC: statement anatomy is standard; no
  invented textbook page cites.
- ASC 606 has five formal steps — do NOT teach the full standard;
  subscription ratable recognition is the course's case, said once.
- EBITDA ≠ cash flow — the full argument needs the cash flow
  statement (next lesson); plant, don't resolve.
- Stock comp is a real expense in GAAP and the most common add-back —
  present both sides in one paragraph (dilution cost returns at
  cap-table-and-dilution).

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (4 frames) — the annual prepay's life:
   frame 1 signing (booking $12k, nothing else); frame 2 invoice
   paid (cash +12k, deferred +12k); frame 3 month 1 close (revenue
   1k, deferred 11k); frame 4 month 6 state (revenue-to-date 6k,
   deferred 6k). One account moves per frame.
2. `draw:` single `<Figure>` — P&L waterfall for the course case:
   revenue down to net income as a cascading bar chart, unit-driven
   bars tinted differently from period costs.
3. `draw:` single `<Figure>` — the two clocks: cumulative cash vs
   cumulative recognized revenue for one contract over 12 months;
   the deferred-revenue wedge shaded between them.
4. `draw:` single `<Figure>` — the non-GAAP ladder: net income at the
   bottom, each add-back a rung (D&A, stock comp, one-times, house
   adjustments), rungs colored by defensibility — the reading-order
   arrow pointing UP from GAAP.
5. `source:` **forms-s1-adjusted-ebitda-reconciliation** — save as
   `wework-adjusted-ebitda-recon`. Reader must see: the filed table's
   add-back rows and the still-negative bottom line widening across
   quarters. Placement: centered in the EBITDA section; caption: a
   reconciliation as filed — the artifact the protocol is for. The
   table's own structure is the payload; a redraw would tidy away the
   argument.
6. `draw:` single `<Figure>` — estimates-as-levers: deferred-revenue
   release schedules under 15- vs 12-month useful life, the pulled-
   forward revenue shaded (Zynga's $14.1M mechanic, our diagram).

## EXERCISE PLAN

1. Warm-up: a customer signs a $24,000 two-year contract, billed
   annually — produce the month-by-month booking/billing/revenue/
   deferred table for the first 14 months. (The mechanics once.)
2. Boundary probe: monthly billing with monthly recognition —
   deferred revenue collapses to ~zero and cash ≈ revenue; state
   exactly which business model makes the two clocks coincide and
   why annual-prepay SaaS chose to break them (working-capital
   financing — forward Ref balance-sheet-and-cash-flow).
3. Claim to refute: "Revenue grew 12%, so demand grew." Zynga
   FY2012: revenue +12%, bookings −1% — decompose via Δdeferred and
   the useful-life change; name which line is the demand signal and
   which is accounting release.
4. Derivation the lesson skipped: prove the identity
   billings = revenue + Δdeferred from the account definitions, and
   its corollary: cumulative billings − cumulative revenue = deferred
   balance — then use it to reverse-engineer billings from two
   public balance-sheet snapshots plus the P&L.
5. Research-shaped: from the WeWork reconciliation (cached capture),
   classify each of the eight add-backs as (a) non-cash, (b) one-time,
   (c) contestable-operating; compute what fraction of the
   loss-to-EBITDA bridge each class explains in the latest quarter.
6. FORWARD (E7): the course case books $600k of annual prepays in
   Q4. Compute Q4 revenue, the deferred balance, and — the new
   question — where the cash and the liability LIVE. Solution: they
   live on the balance sheet, next lesson's statement; `<Ref>`
   balance-sheet-and-cash-flow.
7. Spaced (E3): EBITDA's add-backs include stock comp — connect to
   the cap table: whom does the expense fall on if not the P&L, and
   which later lesson computes it (Ref cap-table-and-dilution;
   dilution as deferred compensation cost).
