# Research brief: clv-in-production (Customer-base analysis in production: CDNOW end to end)

status: planned
module: customer-base
type: synthesis
goal: Reproduce the CDNOW Pareto/NBD analysis with pymc-marketing and interpret its fit, diagnostics, and per-customer scores

MODULE APPLICATION (L16). Artifact: the pymc-marketing ParetoNBDModel
pipeline run on the CDNOW sample — a deployed open-source system the reader
can run tonight. No new theory; the module's results cashed out.

## ARC (L10)

- **Inherits:** Everything in spine step 2: sBG/heterogeneity thinking,
  CLV as discounted expectation, BG/NBD and P(alive) with (x, t_x, T).
- **Contributes:** The module's application: the models running in a real
  library on real data, with the operator's questions answered — did it
  fit? whom do we contact? what do the diagnostics mean?
- **Hands off:** Module 2 takes the value side as given and closes the unit
  with costs: "A customer's value is half of the unit" (spine step 3).

## APPLICATION SPEC (L16)

- **Artifact:** pymc-marketing's `ParetoNBDModel` documentation notebook
  (cached: lifetimespym-pareto_nbd.txt) — RFM prep, MAP fit, full-Bayes
  fit, predictive methods, covariates; CDNOW 10% sample (2,349 customers,
  6,919 transactions).
- **Module results used:** censoring/cohort framing (data prep), the
  mixture worldview (Gamma heterogeneity on λ and μ), P(alive) and
  conditional expectations (scoring), CLV as discounted expected
  transactions (DERT), RFM sufficiency (the whole pipeline consumes only
  frequency/recency/T).
- **Departures from the idealisation (must be named):**
  - Pareto/NBD here, not BG/NBD: continuous exponential death; the library
    chose the harder model + modern samplers (NUTS too slow → DEMetropolisZ)
    — the computational-history inversion of the 2005 paper's motivation.
  - Priors: HalfFlat vs default Weibull(2,10)/Weibull(2,1); MAP vs
    posterior; none of this exists in the 2005-era Excel story.
  - The 1/10 sample overfit warning (the notebook's own caveat).
  - Zero-spend rows filtered as returns/promos — data hygiene the papers
    assume away.
  - Gamma-Gamma spend model: independence assumption blocks reusing spend
    as a Pareto/NBD covariate — assumptions compounding across chained
    models.

## Sources to consult

- **PyMC-Marketing Pareto/NBD notebook** (lifetimespym-pareto_nbd.txt) —
  the whole lesson: RFM definitions (frequency = purchases − 1; recency;
  T); MAP with HalfFlat → r=0.61, α=16, s=0.45, β=14; DEMetropolisZ 4×3000
  in ~6s → α=15.67±1.07, β=12.8±3.6, r=0.622±0.047, s=0.432±0.061, r-hat
  ~1.00; PPC before/after fit; six named customers (1, 5, 10, 18, 46,
  1413); customer 1413: 19 purchases, recency 54, T=71, P(alive)≈0.30;
  customer 46's n-purchases × horizon heatmap; covariate fit
  (dropout_coefficient[log_std_cds_bought] = −0.95 story); P(alive)
  0.25–0.30 at-risk rule of thumb.
- **Counting Your Customers** §7-8 — the original CDNOW numbers to compare
  against (different sub-sample and model — expect agreement in structure,
  not digits; say so).
- **Fader & Hardie 2009** — the model-naming chain, for placing Pareto/NBD
  vs BG/NBD in one sentence.

## Key points the lesson must cover

1. **The pipeline as the module in miniature:** event log → zero-spend
   filter → RFM summary → model → scores. Each stage names the lesson that
   justified it.
2. **Fitting and diagnostics like an operator:** MAP first (fast, no
   uncertainty), then full Bayes; read r-hat, trace plots, prior vs
   posterior predictive checks — the audience knows these words; show them
   doing business work.
3. **Reading the four predictive surfaces:** expected purchases (with HDI
   bands), P(alive) now and projected, P(n purchases by t), new-customer
   baseline.
4. **Customer 1413** as the module's capstone example: heavy buyer, long
   silence, P(alive)≈0.30 → retention-offer candidate. The 0.25–0.30
   rule of thumb, flagged as a heuristic.
5. **Covariates and compounding assumptions:** covariates enter the mixing
   scales (α·e^{−γ'z}); the interpretable coefficient story (multi-CD
   buyers rarely drop out, −0.95); the Gamma-Gamma independence trap.
6. **What would break at scale:** sample-size caveat, stationarity, the
   contractual/noncontractual boundary — one closing section of honest
   limits.

## Set pieces and worked examples to recreate

- **The six-customer cast** (IDs 1, 5, 10, 18, 46, 1413) — reuse as
  personas across the lesson's readouts.
- **Customer 46's heatmap** (P of n purchases within t) — recreate as a
  drawn figure with the notebook's numbers.
- **The parameter table** MAP vs DEMetropolisZ vs the 2005 paper's
  Pareto/NBD (r=0.553, α=10.578, s=0.606, β=11.669) — three columns, with
  the sample-difference caveat carried in the caption.
- **PPC bar pair** (prior vs posterior predictive vs observed frequency).

## Pitfalls / subtleties to flag

- Do NOT let this become a library tutorial: every code output must be read
  against a module concept, or cut (L12).
- Parameterization differences (scale vs rate, α meaning) between the
  paper and the library — warn; digits won't line up across sources and
  that is expected and stated.
- MAP + PPC works for this model only because it samples latent λ,μ — the
  notebook's own subtle point; keep one sentence.
- The notebook's "periods" are weeks; keep units explicit everywhere.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the production pipeline**: five boxes
   (event log → filter → RFM table → model fit → scores/decisions), each
   annotated with the module lesson that owns it. The L16 "which results
   does the artifact use" figure.
2. `draw:` single `<Figure>` — **PPC before/after**: two panels, simulated
   vs observed purchase-frequency histograms under priors and under the
   fit (recreate from notebook description; our own simulated numbers ok).
3. `draw:` single `<Figure>` — **the six customers' P(alive)**: dot plot,
   x = P(alive) with HDI bars, customer 1413 highlighted amber.
4. `draw:` single `<Figure>` — **customer 46 heatmap**: n ∈ {0,3,…,15} ×
   t ∈ {15,…,90}, cell = probability, notebook's numbers.
5. `draw:` single `<Figure>` — **covariate effects**: two horizontal bars
   per covariate (purchase-rate coefficient vs dropout coefficient) making
   the −0.95 dropout story visible.
6. `source:` **appliedproba-bgnbd-mktsci-abstract** — save as
   `bgnbd-paper-abstract`. Reader must see: the real Marketing Science
   title/abstract page of the BG/NBD paper. Placement: small float-right in
   the closing "where this all came from" section — the primary-source
   pointer for the module's canon. (Single sourced image; the lesson is
   otherwise computational.)

## EXERCISE PLAN

1. Warm-up: from a 6-transaction customer history (dates given), compute
   the (frequency, recency, T) triple exactly as the library defines it —
   including the purchases−1 and t_x conventions. (Definitions bite here.)
2. Boundary probe: a customer with frequency 0 (one purchase ever): what
   are recency and P(alive) under the model, and why does the new-customer
   predictive, not the conditional one, apply? What does the model DO with
   the zero class it can't distinguish?
3. Claim to refute: "The full-Bayes fit gives different parameters than
   the 2005 paper, so one of them is wrong." Refute using: different
   sample (1/10 vs full), different model (Pareto/NBD vs BG/NBD),
   different parameterization; state what SHOULD agree (rank-ordering of
   customers, structure of P(alive) surface).
4. Research-shaped: run the cached notebook's MAP fit (or reproduce from
   its printed numbers) and check r=0.61, α≈16, s=0.45, β≈14; then verify
   customer 1413's P(alive) ≈ 0.30. State tolerance.
5. Derivation the lesson skipped: for Pareto/NBD, derive why P(alive) is
   strictly decreasing in T for fixed (x, t_x) — the exponential death
   clock keeps ticking between purchases (contrast BG/NBD, where death can
   only follow a purchase: P(alive) also falls, but through the posterior
   on λ — E7-adjacent contrast, kept internal).
6. FORWARD (E7): compute a rough residual value for customers 46 and 1413
   (expected 90-period purchases × $25 margin, undiscounted), then answer:
   which one justifies a $40 win-back offer, and what number would CAC
   have to beat? Solution: that comparison — value vs cost of acquiring
   or saving a customer — is module 2's whole subject; `<Ref>`
   cac-and-ltv-cac.
7. Spaced (E3, retention lesson): the notebook filters zero-spend rows.
   State which survival-analysis assumption (independent censoring) a
   returns-heavy segment would violate if returns correlated with churn.
