# Research brief: course-capstone (Capstone: from cohort data to a term sheet)

status: planned
module: startup-finance
type: synthesis
goal: Construct the course's full pipeline end to end — fit the case's cohorts, build the model, price a round with a waterfall, and value the company two ways

COURSE AND MODULE APPLICATION (L16). No new theory. The running SaaS
case's dataset in, a term-sheet verdict out — every intermediate
number computed by a model the course built, every answer
auto-checkable against the chain.

## ARC (L10)

- **Inherits:** everything — named per stage below; the capstone is
  the spine's final step ("the capstone runs the whole course from
  cohort events to a term-sheet verdict").
- **Contributes:** the demonstration that the course's models
  compose: cohort matrix → sBG → CLV → channel plan → driver model →
  runway → raise → conversion → waterfall → valuation → verdict.
- **Hands off:** nothing — closes the course; the final section
  names each module's caveat one last time (what real data does to
  each stage).

## APPLICATION spec (L16)

- **Artifact:** a computational study on the course's running case —
  the reader executes the full chain and checks a vector of numbers;
  closed with one LIVE read: the (dated) BVP Cloud Index median
  multiple for the comp — real market data enters at the final
  stage.
- **Module results used (by stage)**:
  1. Cohort matrix + sBG fit (Part I lessons 1–3) — retention
     parameters from the case's event log.
  2. CLV and unit economics (Part I) — margin-adjusted values, CAC
     caps.
  3. Channel plan (Part III) — portfolio allocation from fitted
     saturation + incrementality-corrected values; max bids.
  4. Driver model (Part IV) — 24-month statements; runway
     distribution; raise size from P(default alive) floor.
  5. Deal (Part IV) — SAFE stack conversion, pool, priced round;
     waterfall at three exits; ESOP grant valued honestly.
  6. Valuation (Part IV) — dated comp multiple conditioned on
     Rule-of-X percentile vs driver-model DCF; reconciliation.
  7. Verdict — take the round or not, from BOTH sides (founder
     dilution + option value; investor return-the-fund arithmetic).
- **Departures from idealisation (the closing section)**: real event
  logs are dirty (identity resolution, censoring); channel values
  are attribution-model-dependent (the incrementality gap); driver
  models miss regime changes; deal docs carry control terms the
  economics ignore (Venture Deals pointer, toc-only); live multiples
  move (dating discipline). One paragraph each, each with its
  module's <Ref>.

## Sources to consult

- All course-internal. External touchpoints: the cached BVP snapshot
  (bvpnasdaq-live-data.json — re-fetch at write time and date it);
  the YC SAFE formulas (postmoney- caches) for the conversion stage;
  the Foresight waterfall algorithm for the distribution stage.
- The case dataset: defined by Part I's lessons (the course's
  synthetic-but-fixed SaaS event log). The capstone does NOT invent
  new data — it reuses the exact case numbers earlier lessons
  established, so every stage's answer is already pinned.

## The task sequence (the lesson IS the exercise set)

1. **Fit**: from the case's cohort triangle, report (α, β), year-3
   survival, and new-customer CLV at d=12%. [Check: matches Part I's
   published fit.]
2. **Unit verdict**: CAC caps (both), payback, the channel table's
   marginal returns — the allocation for a $60k/mo budget.
3. **Model**: the 24-month statements; minimum-cash month;
   P(default alive) at current plan; the raise that lifts it above
   80% ($2.5M).
4. **Deal**: convert the $700k SAFE stack, top the pool to 12%,
   close $2.5M at $10M pre; founder %, investor %, ESOP pool —
   full cap table. Waterfall at $8M / $40M / $150M exits; the
   20,000-option grant's honest value.
5. **Value**: DCF (WACC from lesson 2's structure; TV both ways) vs
   the DATED EMCLOUD median conditioned on the case's Rule-of-X
   percentile; reconcile to a defended range.
6. **Verdict**: founder side (dilution vs runway bought vs option
   value of staging) and investor side (ownership vs
   return-the-fund exit) — write both memos; compare with the
   model's numbers.

## Set pieces

- The answer vector, stated up front as the contract: ~12 numbers
  (α, β, CLV, CAC cap, allocation split, cash-zero month, raise,
  founder %, common payout at $40M, grant value, EV range, verdict
  threshold) — each auto-checkable.
- The one-page pipeline diagram (figure 1) as the course's summary
  object.
- The live-data moment: the reader pulls (or reads the dated
  snapshot of) the EMCLOUD median — the only number in the course
  that changes after publication, and the lesson says exactly how
  to handle that.

## Pitfalls / subtleties

- The capstone must not re-teach: every step is a <Ref> plus a
  computation; prose budget goes to the seams and the verdict.
- Keep the answer vector stable: all case constants come from
  earlier lessons; any drafting change upstream must propagate
  (note to writers: the case constants live in the Part I briefs).
- The verdict is a judgment supported by numbers — model both
  accept and decline defensibly; the lesson grades the reasoning
  protocol, not one "right" answer.
- Time-box: est 45 min is the course maximum; ruthless about
  narrative padding.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the pipeline: ten stages as a
   left-to-right chain, each node labeled with its lesson <Ref> and
   its output number — the course on one page.
2. `draw:` single `<Figure>` — the answer-vector scorecard: the ~12
   numbers as a checkable table with blank reader column and model
   column (revealed) — the contract object.
3. `draw:` `<FigureSequence>` (4 frames) — the deal stage animated:
   SAFE conversion → pool top-up → round close → waterfall at $40M;
   the cap table's wedges tracked across all four (reprise of the
   deal lessons' figures at speed).
4. `draw:` single `<Figure>` — the valuation reconciliation: DCF
   range bar vs dated-comp range bar, overlap shaded, the three
   named assumption gaps as arrows between them.
5. `draw:` single `<Figure>` — both memos' decision map: founder
   axes (dilution vs P(alive) gained), investor axes (ownership vs
   required exit) — the two rationalities on one page, the deal in
   the overlap.

## EXERCISE PLAN

(The capstone's body IS the task sequence above; the closing
exercise set adds cross-checks and stress tests.)

1. Warm-up/integrity: verify the MRR waterfall ties to the cohort
   sum in month 12 of your model — the invariant check performed on
   your own artifact.
2. Boundary probe: rerun the chain with retention one posterior
   s.d. worse (α, β shifted) — report which downstream numbers move
   most (CLV → CAC cap → raise size → valuation) and which barely
   move; the sensitivity structure of the whole course in one run.
3. Claim to refute: "The company is worth $10M because that's the
   round's pre-money." Using the waterfall and the preference
   terms, compute the implied common value per share vs the
   preferred price and state why the headline is not the price of
   common (the 409A gap, live in your own cap table).
4. Derivation the lesson skipped: the investor's IRR at the $150M
   exit in year 6 through the waterfall — connect multiple-based
   and IRR-based reporting on one deal (Ref venture-economics,
   npv-and-irr).
5. Research-shaped (the live task): re-fetch the EMCLOUD median and
   quartiles as of your reading date; recompute stage 5's comp
   value and state whether the reconciliation verdict changed —
   the dating discipline exercised for real.
6. FORWARD (E7 — the course's last): write the three sentences you
   would say to the CFO, the head of growth, and the lead investor
   — each sentence must contain one number from the answer vector
   and survive the relevant module's named caveat. Solution: the
   course's claim is that these three sentences are now computable;
   there is no next lesson — the <Ref> is the reader's own next
   dataset.
