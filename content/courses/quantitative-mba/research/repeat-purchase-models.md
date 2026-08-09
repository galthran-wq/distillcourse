# Research brief: repeat-purchase-models (Repeat purchase: BG/NBD and P(alive))

status: planned
module: customer-base
type: core
goal: Compute P(alive) and expected future transactions from recency and frequency under the BG/NBD model

Business words: repeat purchase, "is this customer still alive". Academic
layer: the 2×2 taxonomy, buy-till-you-die, BG/NBD (Pareto/NBD named as the
ancestor), sufficiency of (x, t_x, T). Dig-deeper: the canonical Fader &
Hardie pair; lifetimes / pymc-marketing.

## ARC (L10)

- **Inherits:** CLV and the sBG machinery — both assumed churn observable
  (contractual). The previous lesson's forward exercise ended on the wall:
  arbitrary inactivity windows give arbitrary answers.
- **Contributes:** Spine step 2 continued: "the same machinery … scores
  whether a silent one is still alive." The contractual/noncontractual
  divide; the buy-till-you-die model; P(alive|x, t_x, T) and conditional
  expected transactions; the zero-class lesson.
- **Hands off:** clv-in-production runs this exact model in a deployed
  library on CDNOW; module 2 then prices acquisition against the values
  computed here.

## Sources to consult

- **Fader & Hardie 2009** (probabilitym-.txt) — the map: 2×2 taxonomy
  (Fig 2) with the four-examples-per-cell texture; Vodafone (7.3M, real
  count) vs Amazon ("76M active" = 12-month-window artifact — change the
  window, the "base" changes); Fig 3's four-customer intuition pump (A-D
  recency/frequency reasoning BEFORE any formula); Figs 4-5 aggregate
  deceleration from individual straight lines that stop; the naming chain
  (NBD, Pareto/NBD, BG/NBD, BG/BB, sBG).
- **Counting Your Customers (2005)** (countingyour-.txt) — the model:
  five assumptions (§3); individual likelihood (eq 3) built
  transaction-by-transaction; population likelihood (eq 6) with no
  hypergeometric; P(alive) (eq A2); E[Y(t)|x,t_x,T] (eq 10); the
  A1·A2·(A3+δA4) GAMMALN decomposition (§7 p.280); CDNOW results: Table 2
  (r=0.243, α=4.414, a=0.793, b=2.426; LL −9582.4 beats Pareto/NBD's
  −9595.0; χ² passes where Pareto/NBD fails), Table 3 (0.996 correlation),
  the zero class (1,411 silent customers → 334 holdout transactions = 18%;
  BG/NBD 0.23 vs actual 0.24 vs Pareto/NBD 0.14).
- **ART Forum Part 2** pp.66-128 — leaky-bucket framing; BG/BB on the
  11,104-donor cohort; donor 100004 vs 100009 (4 vs 5 gifts, expected
  future 2.71 vs 1.81 — recency beats frequency); RFM heat-map tables
  (expected transactions and P(alive) by recency × frequency).
- **PyMC notebook** — forward pointer only (next lesson).

## Key points the lesson must cover

1. **The divide is fundamental** (2009 paper's words: "the boundary cannot
   be crossed"): contractual churn is observed, noncontractual death is
   latent. Vodafone-vs-Amazon as the discriminating case; window-artifact
   "active customers" is also a Goodhart seed (plant one clause, `<Ref>`
   forward to goodharts-law).
2. **Intuition before formulas** (Fig 3's four customers): equal recency
   different frequency, equal frequency different recency — reason P(alive)
   ordering by hand first. The paradox to plant: HIGH frequency + long
   silence = most likely dead (the frequent buyer's silence is louder).
3. **The model** (BG/NBD as "Pareto/NBD made practical"): while alive,
   Poisson(λ) purchases with Gamma(r,α) heterogeneity; after each purchase,
   death with probability p, Beta(a,b) heterogeneity. One changed
   assumption vs Pareto/NBD (geometric-at-purchases vs continuous
   exponential death) buys Excel tractability; near-identical predictions
   (corr 0.996).
4. **Sufficiency of (x, t_x, T)**: the full history collapses to three
   numbers — this is WHY RFM data suffices and why CRM systems store what
   they store. Derive the likelihood's dependence on only these.
5. **The outputs that matter**: P(alive|x,t_x,T) (eq A2 structure: ratio of
   "never died" path to total likelihood) and E[future transactions] (eq
   10, one 2F1 evaluation AFTER estimation — state, don't derive the
   hypergeometric). The zero class: silent majority carries real future
   volume; models that write them off (or double them) fail visibly.
6. **Aggregate deceleration decoded** (Figs 4-5): concave cumulative sales
   with NO individual slowdown — the noncontractual twin of the sorting
   effect; spiral back to churn-and-the-sbg-model explicitly.

## Set pieces and worked examples to recreate

- **The 2×2 taxonomy with real examples per cell** (2009 Fig 2) — THE
  diagram of this literature; recreate faithfully in house style with the
  four-example texture (grocery/doctor/hotel; credit card/meal plan; event
  attendance/refills/charity; magazines/insurance/gym).
- **Four-customer timelines** (2009 Fig 3): A-D with x-marks; walk the
  ordering argument in prose beside it.
- **Donor 100004 vs 100009** (ART Part 2 pp.97-101): 4 vs 5 gifts, expected
  future 2.71 vs 1.81 — recency dominance in two real rows.
- **CDNOW zero class**: 1,411 of 2,357 silent in calibration; 334 holdout
  purchases; per-model conditional expectations 0.23/0.14 vs actual 0.24.
- **RFM heat map** (ART pp.109-116): expected transactions by recency ×
  frequency — the visual grammar all CRM tools copied.

## Pitfalls / subtleties to flag

- BG/NBD quirk: a customer cannot die before their first repeat purchase —
  the simulation's one failure mode (low penetration/frequency worlds,
  §6.2); mention as the model's known boundary.
- x is REPEAT purchases (total − 1); t_x = 0 for one-time buyers —
  definitions must match the CDNOW convention or nothing reproduces.
- Don't derive the Pareto/NBD likelihood (hypergeometric swamp); name it,
  state the delta, move on. The 2009 paper's narrative style is the model.
- P(alive) is a posterior, not a property: it changes with T even with no
  new purchases — worth an explicit sentence (it's the demo's core).
- Keep BG/BB (discrete-time) to a starred aside; the donor example can run
  there.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the 2×2 taxonomy** (recreation of 2009 Fig
   2 idea): axes relationship × transaction opportunities, four cells each
   with 3-4 real examples; the sBG's cell and this lesson's cell both
   marked (continuity with module).
2. `draw:` single `<Figure>` — **four customers, one verdict each** (Fig 3
   idea): timelines A-D, x-marks, and the hand-reasoned P(alive) ordering
   as labels.
3. `draw:` `<FigureSequence>` (4 frames) — **buy till you die** (Figs 4-5
   idea): frame 1 three individual cumulative-purchase lines, straight;
   frame 2 each stops at its death; frame 3 their sum decelerates; frame 4
   the aggregate alone with the wrong reading ("customers slowing down")
   struck out.
4. `draw:` single `<Figure>` — **the likelihood dissected** (voita rule 7):
   L(λ,p|x,t_x,T) = (1−p)^x λ^x e^{−λT} + δ·p(1−p)^{x−1} λ^x e^{−λt_x}
   with the two paths labeled: "never died through T" vs "died right after
   purchase x". The sufficiency of (x,t_x,T) visible in the symbols.
5. `draw:` single `<Figure>` — **P(alive) vs silence, by frequency**: three
   curves (x=2, 8, 19) of P(alive) as t−t_x grows: the steepest drop is the
   frequent buyer. This is the demo's static twin.
6. `source:` **countingyour-fig1-excel** — save as `bgnbd-excel-mle`.
   Reader must see: r, α, a, b, LL cells, the GAMMALN formula bar, and the
   2,357-row table feeding one SUM. Placement: float-right beside the
   "easy way" section; caption: the paper's thesis is the artifact.
7. `source:` **countingyour-fig2-fig3-empirical** — save as
   `bgnbd-cdnow-validation` (crop Fig 3, the conditional-expectations
   panel). Reader must see: actual vs BG/NBD vs Pareto/NBD expected holdout
   transactions by calibration count, including the zero class' agreement.
   Placement: centered in the validation section — published measured data
   a redraw would falsify.

## EXERCISE PLAN

1. Warm-up: classify six businesses into the 2×2 (bank card, SaaS seat,
   grocery app, charity, gym, mobile prepaid top-ups) and state for each
   whether churn is observed. (Recognition warm-up; the only one.)
2. Boundary probe: set p→0 in the individual likelihood — recover the plain
   Poisson/NBD world; show P(alive)≡1 and state which observed aggregate
   pattern (deceleration) the model then cannot produce. Which assumption
   was doing the work?
3. Claim to refute: "Customer A (12 purchases, silent 6 months) is safer
   than customer B (2 purchases, silent 6 months) — heavy users stick."
   Compute/reason both P(alive) under fitted CDNOW parameters and refute;
   name the step (the Poisson rate posterior makes A's silence damning).
4. Derivation the lesson skipped: derive P(alive|λ,p,x,t_x,T) =
   (1−p)^x e^{−λ(T−t_x)} / [(1−p)^x e^{−λ(T−t_x)} + p] from the two-path
   likelihood (eq A2's individual-level form), and show it is decreasing in
   T−t_x and in λ.
5. Research-shaped: from the cached CDNOW summary numbers, verify the zero
   class arithmetic — 334/1,411 = 0.237 vs BG/NBD's 0.23 and Pareto/NBD's
   0.14 — and write one sentence on why an 18%-of-volume segment with no
   calibration purchases is where models earn their keep.
6. FORWARD (E7): using P(alive) and E[future transactions | x,t_x,T],
   write the expression for a noncontractual customer's residual value at
   margin m and discount d (a discounted sum of expected transactions).
   Solution: this is DERT — exactly what the production library computes
   next lesson; `<Ref>` clv-in-production.
7. Spaced (E3, churn lesson): the BG/NBD's Beta(a,b) death-probability
   mixture is the sBG story transplanted — state which sBG quantity
   corresponds to p, and why sorting reappears among frequent buyers.
