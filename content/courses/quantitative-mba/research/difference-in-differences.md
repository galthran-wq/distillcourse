# Research brief: difference-in-differences (Potential outcomes and difference-in-differences)

status: planned
module: causal-inference
type: core
goal: Estimate a treatment effect by difference-in-differences and assess the parallel-trends assumption behind it

The causal-inference foundation lesson: potential outcomes formalized
(module 3 used the intuition), selection bias as algebra, then DiD as the
first no-randomization estimator. Sources: MHE ch.1 (full) + ch.2/5 TOC
(⚠ book unread beyond ch.1), MIT 14.387 (full — the derivation layer),
Card & Krueger named from the reading lists.

## ARC (L10)

- **Inherits:** Randomization as the gold standard and the intuition
  that it "zeroes selection" (ab-tests); the conditioning principle
  (never condition on what treatment can move — CUPED/pathologies).
- **Contributes:** Spine step 7 continued: "the counterfactual must be
  reconstructed… under stated assumptions." Potential outcomes {Y(1),
  Y(0)}; observed-difference = ATT + selection-bias algebra; the ideal
  experiment as a thought tool (MHE's FAQs); DiD with parallel trends —
  stated, used, probed; bad controls formalized.
- **Hands off:** instrumental-variables (a different assumption set for
  a different data situation); synthetic-control (DiD's generalization
  when there is one treated unit and parallel trends fails).

## Sources to consult

- **MHE ch.1 (full, free PUP PDF)** — the four research FAQs (causal
  relationship? ideal experiment? identification strategy? inference
  mode?); FUQs (fundamentally unidentified questions — school start
  age); Haavelmo's "experiments we should like to make" quote; the
  Hirano haiku ("T-stat looks too good / Try clustered standard
  errors— / Significance gone") for the close.
- **MHE TOC (unread)**: ch.2 selection-problem algebra; ch.3.2.3 "Bad
  Control"; ch.5 DiD/regression-DD — named chapters; derivations below
  come from 14.387 instead.
- **14.387 (full, cached)**:
  - 14387-regression-recap.txt: OVB formula; CIA; selection-bias
    decomposition (observed gap = ATT + selection bias) — the algebra
    to reproduce.
  - 14387-recitation1-expectations.txt slides 15-19: the bad-controls
    derivation (random schooling, control for occupation → composition
    bias "no causal interpretation") — full worked algebra.
  - 14387-recitation3-late-diff.txt: DiD setup; regression-DD; Card
    (1992) grouped estimator; Athey-Imbens Changes-in-Changes as the
    starred generalization (rank preservation instead of parallel
    trends).
  - 14387-matching.txt: Angrist (1998) veterans matching study —
    $1,233 raw gap → −$197 matched (whites): selection bias measured in
    dollars; regression-vs-matching weighting (starred at most).
- **Card & Krueger 1994**: named as THE canonical DiD (NJ/PA minimum
  wage); we have no full text — use the design shape (bordering states,
  before/after) without importing unverified numbers; References
  pointer.
- **Synthetic control paper §II.B** — DiD as the λ_t-constant special
  case of the factor model: the forward seam.

## Key points the lesson must cover

1. **Potential outcomes, finally formal**: Y_i(1), Y_i(0); individual
   effect unobservable (the fundamental problem); ATE/ATT distinction;
   the observed-difference decomposition
   E[Y|D=1] − E[Y|D=0] = ATT + {E[Y(0)|D=1] − E[Y(0)|D=0]} — derive
   fully, name the second term selection bias, show randomization
   zeroes it (the module-3 promise, now algebra).
2. **Selection bias is large in practice**: Angrist's veterans numbers
   ($1,233 → −$197) — selection measured, not hypothesized. The
   business translation: adopters of any feature differ from
   non-adopters BEFORE adoption (plant: the uplift lesson's
   observational data needs).
3. **The ideal-experiment discipline** (MHE FAQs): before any estimator,
   state the experiment you WISH you'd run; FUQs — some questions have
   no ideal experiment even in principle. One business FUQ worked (e.g.
   "did our brand campaign cause the culture shift").
4. **DiD**: two groups × two periods; ΔΔ estimator; parallel trends as
   the identifying assumption — exactly what replaces randomization;
   pre-trend inspection as partial testability (and its limits);
   regression-DD (unit + time effects) for covariates/inference; the
   Card & Krueger design as the canonical shape. Worked example: a
   pricing change in one country (running case), neighboring country as
   control — computed table.
5. **Bad controls, formalized**: conditioning on post-treatment
   variables manufactures selection bias even under randomization — the
   recitation-1 algebra; unify with CUPED §5.3 and pathologies'
   segmentation rule (the course's third pass at the principle — say
   it's the third pass).
6. **Inference caveat**: serially correlated panels make naive DiD
   standard errors optimistic (Bertrand et al. named; the haiku);
   clustered SEs as the practice pointer — one paragraph, not a
   derivation.

## Set pieces and worked examples to recreate

- **The decomposition derivation** as the lesson's central proof —
  three lines, every term named, boxed.
- **Veterans numbers** (Angrist 1998 via 14.387): the raw-vs-matched
  table for whites/nonwhites — selection bias in dollars.
- **The running-case DiD**: price +10% shipped in market A only;
  four-cell table (A/B × before/after), ΔΔ computed; then a drawn
  pre-trend check with one violation scenario (A was already
  decelerating).
- **Bad-control worked algebra** (recitation 1's example translated to
  business: random onboarding-flow assignment, "control for activation"
  → biased).

## Pitfalls / subtleties to flag

- MHE beyond ch.1 is TOC-only: derivations must come from the 14.387
  cached decks (they suffice); no MHE page-level cites beyond ch.1.
- Card & Krueger numbers not verified — design cited, numbers not
  imported.
- Parallel trends is about COUNTERFACTUAL trends; pre-trends are
  evidence, not proof (anticipation, mean reversion) — one dry
  paragraph.
- Log vs level parallel trends are different assumptions — one clause
  (functional-form dependence; CiC as the fix, starred).
- Two-way fixed effects with staggered adoption has modern
  complications — name in one sentence as out of scope (recent
  literature pointer), avoid teaching the pathological case.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the fundamental problem**: one unit's
   two potential outcomes, observed one solid, counterfactual ghosted;
   the individual effect as the unobservable gap.
2. `draw:` single `<Figure>` — **the decomposition dissected** (voita
   rule 7): observed gap = ATT + selection bias with each term colored
   and the randomization-zeroes-this bracket on the bias term.
3. `draw:` `<FigureSequence>` (4 frames) — **DiD constructed**: frame 1
   treated group's observed path with a level jump at T; frame 2
   control group's path; frame 3 control's trend transplanted onto
   treated (the counterfactual built); frame 4 the ΔΔ gap shaded. One
   element per frame.
4. `draw:` single `<Figure>` — **parallel-trends diagnostics**: three
   pre-period panels (parallel / diverging / converging) with verdicts;
   the diverging one annotated with what DiD would wrongly attribute.
5. `draw:` single `<Figure>` — **bad control**: DAG-style sketch —
   treatment → mediator → outcome, conditioning box on the mediator
   opening the bias path; tied by caption to CUPED Fig-7 and the
   segmentation rule (the course's recurring principle).
6. `source:` **mostlyharmle-cover** — save as `mhe-cover`. Reader must
   see: the book. Placement: small float-right in dig-deeper; caption
   notes ch.1 is free and the rest is the canon's purchase list.
   (Citation image; drop if crowded.)

## EXERCISE PLAN

1. Warm-up: fill the four-cell DiD table from given numbers and compute
   ΔΔ. (Mechanics once.)
2. Boundary probe: apply DiD when the control group is itself partially
   treated (spillover from pathologies): derive the sign of the bias in
   ΔΔ and connect to interference — parallel trends can hold and the
   estimate still be wrong; which assumption (control untreated) did
   the work?
3. Claim to refute: "We controlled for engagement, so the retention
   comparison between adopters and non-adopters is causal." Run the
   bad-control algebra (engagement is post-adoption) AND the selection
   argument (adopters differ pre-adoption); state what design (DiD on
   the adoption rollout, or the uplift lesson's assumptions) would be
   needed instead.
4. Derivation the lesson skipped: derive the DiD estimand under the
   parallel-trends assumption formally (write both groups' Y(0) paths
   with common trend δ_t, show ΔΔ = ATT); then show a group-specific
   trend γ enters the estimate additively — the bias formula for
   violated trends.
5. Research-shaped: reproduce the veterans selection-bias arithmetic
   from the cached 14.387 matching table (raw $1,233, matched −$197 for
   whites; raw $2,449 → $840 nonwhites) and write the two-sentence
   conclusion about observational adopter comparisons in product
   analytics.
6. FORWARD (E7): your DiD control is one other country whose pre-trend
   visibly diverges. Try reweighting several countries by hand to make
   the weighted pre-period track the treated unit. Solution: choosing
   weights to match the pre-path IS synthetic control — next-next
   lesson formalizes it (`<Ref>` synthetic-control); the next lesson
   first handles a different failure — noncompliance (`<Ref>`
   instrumental-variables).
7. Spaced (E3, module 3): restate the experiment-pathologies
   "condition only on pre-treatment variables" rule in potential-
   outcomes notation, and show CUPED's validity condition is the same
   statement about X.
