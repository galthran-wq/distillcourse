# Research brief: cohorts-and-funnels (Funnels, cohorts, and the cohort matrix)

status: planned
module: customer-base
type: core
goal: Construct a funnel and a cohort matrix from an event log and read conversion, retention, and revenue off them

Course opener (C3): must be the easiest, most polished lesson. One dataset
is built here — a small fictional SaaS ("the running case") whose event log
becomes the cohort matrix every later lesson fits models to. Define the
notation once; the whole course reuses it.

## ARC (L10)

- **Inherits:** Nothing — this is the course opening. It carries the spine's
  first move: "A business is a dataset: events roll up into funnels and
  cohorts, and the cohort matrix is the object every later quantity is
  computed from."
- **Contributes:** The objects and notation: funnel stages and conversion
  rates, cohorts indexed by acquisition period, the cohort × age matrix and
  its unobserved (censored) lower triangle, age vs calendar time.
- **Hands off:** retention-and-survival reads the matrix's rows as survival
  data — "retention curves are its rows read as survival data" (spine step 1
  caption).

## Sources to consult

- **Skok, SaaS Metrics 2.0** (research/texts/saasmetrics-full.txt) — sections
  "More on Churn: Cohort Analysis", "Two ways to run Cohort Analysis" (by
  count vs by revenue), "Funnel Metrics", "Using Funnel Metrics in Forward
  Planning". The cohort table with first-month churn improving 15% → 4%
  across vintages is the set piece.
- **Fader & Hardie ART Forum Part 2** (appliedproba-cba-2016.txt), pp.30-38 —
  the annual-contract cohort (1000 → 631 → 468 → 382 → 326) used throughout
  module 1, and the cohort-vs-pooled-aggregate retention chart (pp.36-38):
  blending cohorts of different vintages manufactures a flatter, more
  misleading aggregate curve.
- **Fader & Hardie 2009** (probabilitym-.txt), p.62 — the "foggy window"
  framing: past behavior is not a mirror of the future; a customer with two
  purchases last year is not a "two-per-year buyer". Good for the closing
  hand-off to probabilistic models.

## Key points the lesson must cover

1. **The event log is primary.** Everything else — funnel, cohort matrix,
   MRR, retention — is an aggregation of (customer, event, timestamp,
   amount). State this once and concretely with a 20-row toy log.
2. **Funnel:** ordered states with a conversion rate per hand-off; rates
   multiply along the path; the denominator and window of every rate must be
   stated (weekly signups → paid within 30 days, not "conversion is 3%").
3. **Cohort:** customers grouped by acquisition period. Two time axes —
   calendar time and age (periods since acquisition). The cohort matrix is
   cohort × age; live cohorts have unobserved cells (name the triangle; the
   word "censoring" lands next lesson).
4. **Reading the matrix:** down a column (same age, successive vintages) =
   product changes; along a row (one cohort aging) = retention; the diagonal
   = one calendar period. The 15% → 4% first-month-churn improvement across
   vintages (Skok) is read down a column.
5. **Why blended aggregates mislead:** pooling cohorts of different ages
   mixes vintage and age effects — the Fader/Hardie pooled-vs-cohort chart.
   This plants the module's recurring theme (aggregates lie) without the
   probability machinery yet.

## Set pieces and worked examples to recreate

- **The running case, defined here:** ~monthly cohorts of a fictional SaaS
  with realistic decay (fit later lessons' needs: month-1 retention ~65%,
  flattening near 30%). Keep numbers round and reusable; this dataset is the
  course's "one distribution" (voita figure rule 4).
- **1000 → 631 → 468 → 382 → 326** (ART Part 1/2 cohort): introduce as a
  worked read-through of one row; the same cohort returns in
  churn-and-the-sbg-model for fitting — say so at the close.
- **Skok's cohort table** (first-month churn 15% → 4% across Jan–Jul
  vintages): worked example of a column read.
- **Funnel forward-planning teaser** (Skok): given a revenue target, walk the
  funnel backwards to required leads — one worked pass; the full treatment
  belongs to north-star-and-metric-trees (say so).

## Pitfalls / subtleties to flag

- Rates without denominators/windows are the #1 practitioner error — enforce
  the discipline in every displayed number.
- Age vs calendar axes get conflated silently; the matrix figure must label
  both.
- Do not introduce survival notation (S(t), hazard) here — next lesson names
  it; here rows are just "fractions still active".
- Keep it easy: no MLE, no model, no Greek beyond none.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **event log → three aggregations**: a 6-row
   event log on the left, arrows to funnel / cohort matrix / MRR ledger.
   The lesson's thesis in one picture. (Original; no source figure.)
2. `draw:` `<FigureSequence>` (4 frames) — **building the cohort matrix**:
   frame 1 events bucketed into monthly cohorts; frame 2 first row filled by
   age; frame 3 all rows, staircase edge appears; frame 4 the unobserved
   triangle shaded with "future" label. One change per frame.
3. `draw:` single `<Figure>` — **funnel with multiplying rates**: 4 stages,
   per-hand-off rates, end-to-end product displayed; denominators and
   windows written on the arrows. (Idea: Kohavi's generic funnel + Skok
   "Funnel Metrics".)
4. `draw:` single `<Figure>` — **the three reads of the matrix**: same
   matrix drawn thrice small — row highlighted (aging), column highlighted
   (vintage), diagonal highlighted (calendar). Voita rule 9 (highlight
   exactly one row).
5. `draw:` single `<Figure>` — **pooled vs per-cohort retention**: two
   panels, same data; pooled curve flatter and misleading. Inspired by ART
   Part 2 pp.36-38 chart (recreate, don't copy).

## EXERCISE PLAN

1. Warm-up: from a 12-row event log, fill in a 3-cohort × 4-age matrix and
   compute each cohort's age-2 retention. (The one mechanical item.)
2. Boundary probe: a cohort acquired in the last observed month has exactly
   one filled cell — state what its retention curve is, and why any claim
   about "our retention improved this month" based on it is empty.
3. Claim to refute: "Our blended monthly retention rose from 88% to 91%, so
   the product got stickier." Construct a two-cohort counterexample where
   every cohort's retention is constant but the blend rises (mix shift from
   a growing young cohort). Name the mechanism.
4. Derivation the lesson skipped: show that end-to-end funnel conversion is
   the product of stage conversions only if each rate's denominator is the
   previous stage's survivors — build the double-counting failure when
   windows overlap.
5. Research-shaped: Skok's cohort table (given): read off whether the
   Jan→Jul improvement is a vintage effect or an age effect, and state which
   cells you compared.
6. FORWARD (E7): for the running case's oldest cohort, compute the fraction
   surviving each month and the per-month fraction-of-survivors lost. The
   numbers wobble; state which of the two series looks "more constant".
   Solution: the survivor fractions are S(t), the per-month losses are
   churn rates — the objects retention-and-survival names and
   churn-and-the-sbg-model models; `<Ref>` retention-and-survival.
