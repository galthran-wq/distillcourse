# Research brief: cac-and-ltv-cac (Customer acquisition cost and LTV:CAC)

status: planned
module: unit-economics
type: core
goal: Evaluate an LTV:CAC ratio from first principles — blended vs paid CAC, margin adjustment, and the folklore thresholds

Business words: CAC, LTV:CAC. Academic layer: none new — the lesson's rigor
is definitional care plus connecting the ratio's numerator to module 1's
CLV. Its distinctive move: treating the ">3" rule as folklore with a
traceable origin and the author's own hedging on record.

## ARC (L10)

- **Inherits:** Margin-adjusted contribution per customer
  (margins-and-the-unit-pnl) and probabilistic CLV (module 1).
- **Contributes:** Spine step 3 continued: "the quoted ratios are folklore
  to be re-derived from the model, not recited." CAC's definitional
  choices (blended vs paid, what's in the numerator), LTV:CAC assembled
  correctly, and the guideline's provenance and failure modes.
- **Hands off:** payback-and-the-cash-trough converts the same quantities
  from a profitability ratio into a liquidity constraint.

## Sources to consult

- **Skok definitions page** (saasmetrics-definitions.txt) — "CAC – Cost to
  Acquire a Customer": total S&M spend / new customers, with the
  early-stage caveat (discount founder-heavy spend); "LTV:CAC Ratio";
  "Months to recover CAC" including the explicit upward revision ("in many
  enterprise businesses… around 20 months… very rare to find less than
  12") — the author walking back his own folklore.
- **Skok main article** — "Is your SaaS business viable?" (LTV:CAC > 3,
  best-in-class 7–8; "these are only guidelines, there are always
  situations where it makes sense to break them"); "Three uses for the SaaS
  Guidelines" (accelerator timing, lead-source evaluation, segmentation);
  the working-backwards rule ($500/month customer justifies ≤$6,000 CAC).
- **HubSpot Forbes table** (image saasmetrics-hubspot-ltv-cac-forbes) —
  the 1.7× → 4.7× trajectory; introduced here as the running real case,
  computed in full in hubspot-unit-economics (say so).
- **ART Part 2 / module 1 numbers** — the corrected CLV ($362 vs $324) to
  substitute into the ratio: folklore numerator vs model numerator.

## Key points the lesson must cover

1. **CAC is a quotient of choices.** Numerator: which spend (paid media
   only? salaries? tools? founder time)? Denominator: which customers
   (all new? paid-attributed only?)? Blended vs paid CAC and when each
   answers a real question (unit health vs channel scaling). The marginal
   vs average distinction: the channel's NEXT customer costs more than its
   average one (plant for Part III).
2. **LTV:CAC assembled right**: numerator is margin-adjusted, discounted,
   model-based CLV (module 1), not ARPA×GM/churn; show the same company
   getting 2.4 with the folklore numerator and 3.1 with the model (running
   case numbers) — the ratio is decision-relevantly sensitive to the CLV
   method.
3. **The folklore, sourced**: >3 healthy, 7–8 best-in-class; where it came
   from (VC pattern-matching, Skok's "early guesses held up well"), the
   author's own hedges, and the later revision of the payback guideline.
   Refutation framing (L13): the misconception is treating the threshold
   as a theorem; the replacement model is "the ratio is an NPV statement
   whose right threshold depends on discount rate, risk, and capital cost"
   — computed, not recited.
4. **Failure modes of the ratio**: long-tailed LTV makes the numerator a
   forecast (uncertainty bands from module 1 belong in the ratio); blended
   CAC hides channel saturation; segment mixing (HubSpot's direct 1.5 vs
   channel 5.0 teaser).
5. **Working backwards**: given payback discipline and ARPA, the max
   affordable CAC — the bridge to bidding (Part III) stated in one
   sentence.

## Set pieces and worked examples to recreate

- **One company, four CACs** (constructed on the running case): paid-only /
  +salaries / blended / marginal — four defensible numbers from one ledger,
  spanning 2×. The lesson's opening jolt.
- **Folklore vs model numerator**: LTV:CAC computed both ways with module
  1's $324/$362 numbers.
- **Skok's $6,000 rule** worked: $500/month ARPA × 12-month payback bound.
- **HubSpot row-1 teaser**: read LTV:CAC 1.7× (Q1'11) and 4.7× (Q2'12)
  off the real table; defer the full audit.

## Pitfalls / subtleties to flag

- CAC ≠ CPA: cost per acquisition of a CUSTOMER vs of an action/lead;
  conflating them breaks funnel arithmetic. One definition box.
- Time alignment: this quarter's spend acquires next quarter's customers;
  fast-growing companies overstate CAC by naive same-period division.
- LTV:CAC without a time dimension can bless a business that dies of cash
  — explicitly set up the next lesson (this is the seam).
- Do not present ">3" as wrong — present it as a prior with stated
  provenance that the model can override in either direction.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the CAC quotient dissected**: numerator
   stack (media, salaries, tools, agencies) and denominator options, with
   the four resulting CACs as a small bar row. (Original.)
2. `draw:` single `<Figure>` — **blended vs paid vs marginal CAC**: one
   channel-mix diagram (organic pool + paid channel) showing why blended
   falls as organic grows while marginal paid CAC rises. (Idea: Skok's
   lead-source ROI discussion.)
3. `draw:` single `<Figure>` — **the ratio's anatomy**: LTV:CAC written
   large with each symbol annotated by its owning lesson (m — margins;
   S(t) — churn model; d — discounting; CAC — this lesson): the module map
   reused from margins fig 5, now two nodes lit.
4. `source:` **saasmetrics-hubspot-ltv-cac-forbes** — save as
   `hubspot-ltv-cac-table`. Reader must see: the six metric rows across
   five quarters, LTV:CAC row legible (1.7 → 4.7). Placement: centered at
   the "real companies publish this" section; caption notes it is
   third-party-published (Forbes) real data, fully audited in the module's
   final lesson. Real artifact — a redraw would be our numbers, not
   HubSpot's.
5. `draw:` single `<Figure>` — **threshold as region, not line**: LTV:CAC
   on one axis, payback months on the other; the folklore box (>3, <12)
   drawn as a shaded region with Skok's own revision arrows pushing the
   payback edge to ~20 for enterprise. (Idea: Skok's two-guideline
   pairing.)

## EXERCISE PLAN

1. Warm-up: quarterly S&M $180k (of which $60k salaries), 300 new
   customers (120 paid-attributed) — compute blended-all, blended-paid,
   paid-only CAC. (The definitional mechanics, once.)
2. Boundary probe: a product with 100% organic acquisition: paid CAC is
   undefined (0/0) and blended CAC ≈ content-team salary / signups — state
   what LTV:CAC then measures and why the >3 rule says nothing about
   whether to START paid acquisition (marginal ≠ average at the boundary).
3. Claim to refute: "Our LTV:CAC is 5, so we should double marketing
   spend." Break it two ways: channel saturation (marginal CAC > average)
   and cash timing (the ratio has no clock). Name what additional numbers
   the decision needs.
4. Derivation the lesson skipped: derive the max affordable CAC implied by
   requiring NPV > 0 at discount d for the sBG-based CLV, and show Skok's
   12×ARPA rule is its zero-discount, zero-churn-after-12-months special
   case.
5. Research-shaped: from the HubSpot table, compute LTV/CAC yourself for
   Q1'11 and Q2'12 from the LTV and CAC rows and check against the printed
   ratio; note any rounding discrepancy and what it implies about their
   computation order.
6. FORWARD (E7): for the running case (CAC $500, contribution $37.50/mo
   with retention), compute cumulative contribution net of CAC month by
   month and find the break-even month. Solution: that is the payback
   period, and its company-level sum is the cash trough — `<Ref>`
   payback-and-the-cash-trough.
7. Spaced (E3, module 1): recompute the LTV numerator with the naive m/c
   formula vs the sBG CLV for the running case and state which decision
   (hire a sales team? raise a round?) the difference could flip.
