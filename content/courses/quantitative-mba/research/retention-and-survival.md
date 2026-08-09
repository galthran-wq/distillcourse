# Research brief: retention-and-survival (Retention curves and survival analysis)

status: planned
module: customer-base
type: core
goal: Compute survivor functions and retention rates from censored cohort data

Second lesson — still front-loaded polish (C3). Business word outside:
retention. Academic layer inside: survival analysis, censoring, the
Kaplan–Meier product-limit estimator (starred section). Dig-deeper pointer:
survival analysis texts + Kaplan & Meier (1958).

## ARC (L10)

- **Inherits:** The cohort matrix and its unobserved triangle
  (cohorts-and-funnels); spine step 1: "retention curves are its rows read
  as survival data."
- **Contributes:** S(t) = r_1·r_2·…·r_t and its inverse r_t = S(t)/S(t−1);
  censoring as the defining feature of live cohorts; the product-limit idea
  (combine cohorts of different lengths by multiplying conditional
  survival); curve-shape diagnostics.
- **Hands off:** Spine step 2 — the observed r_t series RISES with tenure in
  real data, and projecting S(t) beyond the window is the open problem;
  churn-and-the-sbg-model models it.

## Sources to consult

- **Kaplan & Meier 1958** (nonparametri-kmpaper.txt) — Section 1.3's
  two-cohort worked example (100 items from 1955, 1000 from 1956): the
  "absurd result" pitfall (P(2)=15/850≈0.018) then the correct
  P(2)=0.255×0.50=0.127; Section 2.1 Table 464 (8-item life table: deaths
  0.8, 3.1, 5.4, 9.2; losses 1.0, 2.7, 7.0, 12.1; P(9.2)=0.2625); the
  ambiguity bound exp(−N°(t)P(t)) < 1% once 5 remain at risk (eq 2d);
  Section 3.2 informative-censoring caveat.
- **Fader & Hardie 2007** (How to Project…), Introduction pp.76-78 — eq 1-2:
  S(t) = r_1…r_t, r_t = S(t)/S(t−1); the truncation problem stated (project
  S(t) beyond the observed horizon).
- **ART Forum Part 1** (appliedproba-intro-2016.txt) pp.5-6 — survivor
  function and retention rate as the vocabulary of duration data; the
  0.631 → 0.742 → 0.816 → 0.853 rising r_t series on the 1000-customer
  cohort (use as the closing cliff-hanger fact, not yet explained).
- **Skok** — retention-curve shape as product-market-fit diagnostic
  (flattening = a retained core exists); cohort tables.

## Key points the lesson must cover

1. **Retention curve = survival curve.** S(t) as fraction-still-active; the
   product identity S(t) = r_1 r_2 … r_t and its inverse. Derive on the
   running case's oldest cohort (numbers from lesson 1's forward exercise —
   `<Ref>` it: they already computed these).
2. **Censoring.** Live cohorts' lifetimes are mostly unfinished; "lifetime >
   observed" is information, not a missing value. The naive pooled estimate
   (deaths / everyone ever observed) is the absurd-result pitfall — recreate
   KM §1.3's two-cohort example with the real 1955/1956 numbers.
3. **The product-limit estimator (★ starred section).** Multiply conditional
   survival fractions over risk sets; the 8-item Table 464 computed fully by
   hand (risk set shrinking from deaths AND losses). State without proof
   that it is the nonparametric MLE (KM §5); ambiguity-bound rule of thumb:
   don't trust the tail once <5 remain at risk.
4. **Independent censoring is an assumption.** KM §3.2's surgical-technique
   example, translated to product terms: a pricing change 5 months ago
   censors only recent cohorts — age and vintage effects entangle.
5. **Shape diagnostics.** Flattening curve = retained core (PMF signature);
   curve to zero = leaky bucket; and the observed fact that r_t rises with
   tenure (0.631→0.853) — stated, NOT explained. The explanation is the next
   lesson's job; close on it as an open question of fact.

## Set pieces and worked examples to recreate

- **KM two-cohort example** (§1.3): the single best teaching device for
  censoring ever published — wrong answer first, then the product logic.
  Keep their actual numbers (100/1000 items, P(1)=0.255, P(2)=0.127).
- **KM 8-item life table** (Table 464): full hand computation as the starred
  section's worked example; parallel exercise on fresh numbers.
- **The rising-retention series** 0.631 → 0.742 → 0.816 → 0.853 (ART Part
  1 p.53-54) on the 1000-cohort: the module's central mystery, planted here.
- **Renewal-rate magazine stat** (Fader & Hardie 2009 p.67): 30% first
  renewal, 50% second, 75% longtime — same mystery in the wild.

## Pitfalls / subtleties to flag

- KM is for continuous/fine-grained time; monthly cohort data is discrete —
  the discrete life-table version is what businesses actually compute. Don't
  overclaim KM mechanics where simple cohort division suffices; KM earns its
  place when cohorts of different lengths must be combined.
- The canonical "staircase" KM plot is NOT in the 1958 paper (reader note) —
  don't attribute it; draw our own.
- Retention definitions vary (active-in-period vs not-yet-churned); fix one
  definition for the course (contractual: not-yet-cancelled) and say
  noncontractual "active" is deferred to repeat-purchase-models.
- Do not explain the rising-r_t fact here — resist; it is the next lesson's
  opening reveal.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **matrix row → curve**: left, the cohort
   matrix with one row highlighted; right, that row plotted as S(t). The
   bridge figure from lesson 1's object to this lesson's.
2. `draw:` `<FigureSequence>` (4 frames) — **the two-cohort product-limit
   logic** (KM §1.3): frame 1 both cohorts drawn as bars with their
   observation windows; frame 2 the naive pooled fraction computed and
   marked wrong; frame 3 year-1 survival from both cohorts (0.255); frame 4
   year-2 conditional from the old cohort only, product 0.127.
3. `draw:` single `<Figure>` — **risk set shrinking** (idea from KM Table
   463 schematic): a timeline with death marks and censoring marks, the
   at-risk count written between events, conditional fractions under each
   death.
4. `source:` **nonparametri-title-page** — save as `kaplan-meier-1958`.
   Reader must see: title, authors, and the abstract stating the
   product-limit formula in original notation. Placement: float-right beside
   the starred section's opening; caption notes ~64k citations make it one
   of the most-cited statistics papers ever. This is the module's primary
   historical artifact; a redraw would destroy its point.
5. `draw:` single `<Figure>` — **shape diagnostics**: three stylized
   retention curves (flattening / straight to zero / rising-then-flat) with
   one-line verdicts under each. Inspired by Skok's PMF folklore.
6. `draw:` single `<Figure>` — **the mystery plot**: r_t vs t rising
   (0.631→0.853) with the question mark deliberately absent — dry caption
   "retention rates rise with tenure; explaining this is the next lesson."

## EXERCISE PLAN

1. Warm-up: given S(1)=0.60, S(2)=0.45, S(3)=0.38, compute r_1..r_3; then
   invert: given r's, recover S. (Unfamiliar computation — allowed warm-up.)
2. Boundary probe: a cohort where nobody churns in period 2 (r_2 = 1) and
   one where everybody does (r_2 = 0): what do S(t) and the later r_t look
   like, and which cells of the matrix can no longer be estimated after
   r=0? (Risk set empties — the estimator's domain ends.)
3. Claim to refute: "We can estimate 24-month retention by averaging the
   24-month retention of all customers who have been with us at least 1
   month." Show with the KM 1955/1956 numbers what this computes instead,
   and name the error (dropping censored lifetimes ≠ conditioning).
4. Derivation the lesson skipped: prove S(t) = Π r_i from the definition of
   conditional probability, and state exactly where independent censoring
   enters when risk sets combine two cohorts.
5. Research-shaped (KM Table 464): recompute the 8-item product-limit
   estimate by hand and check P(9.2) = 21/80 = 0.2625 against the paper.
6. FORWARD (E7): for the 1000-customer cohort (r_t = 0.631, 0.742, 0.816,
   0.853), fit the best CONSTANT retention rate r̄ by eye and project S(8).
   Then compute what r̄ predicts for r_5 vs the trend. Solution: no constant
   rate fits a rising series — the failure churn-and-the-sbg-model's
   mixture model repairs; `<Ref>` churn-and-the-sbg-model.
7. Spaced (E3, from lesson 1): identify which cells of the cohort matrix the
   KM risk-set computation used — column, row, or diagonal read?
