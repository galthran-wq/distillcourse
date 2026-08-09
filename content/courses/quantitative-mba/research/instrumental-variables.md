# Research brief: instrumental-variables (Instrumental variables and noncompliance)

status: planned
module: causal-inference
type: core
goal: Estimate a local average treatment effect from an encouragement design with noncompliance via the Wald/IV estimator

The business door into IV is noncompliance: you randomize the OFFER, users
decide the treatment. ITT, Bloom, Wald, LATE, weak instruments. Sources:
MIT 14.387 (full — the whole derivation and all worked numbers), MHE ch.4
at TOC depth.

## ARC (L10)

- **Inherits:** Potential outcomes and selection algebra
  (difference-in-differences); module 3's randomization machinery.
- **Contributes:** Spine step 7 continued: randomization of ASSIGNMENT
  survives noncompliance — ITT; scaling ITT by compliance (Bloom/Wald)
  recovers a causal effect for compliers only (LATE); the IV
  generalization (independence + exclusion + monotonicity + first
  stage); weak-instrument bias as the practical failure mode.
- **Hands off:** synthetic-control (the one-treated-unit situation);
  uplift-and-causal-forests (kappa-weighting/complier ideas echo in
  heterogeneous-effects machinery; Part III will reuse IV thinking for
  incrementality).

## Sources to consult

- **14387-iv-heterogeneous-effects.txt (full)** — the lesson's core:
  - Bloom result: TOT = ITT / P(comply); JTPA: OLS $3,970 (selection),
    ITT $1,117 (diluted), IV/TOT $1,825 (the honest number) — Table
    4.4.1; the three-numbers-one-dataset set piece.
  - LATE theorem: independence, exclusion, monotonicity, first stage ⇒
    Wald = E[Y1−Y0 | complier]; compliers/always-takers/never-takers;
    proof as in the deck (reproduce at sketch level).
  - MDVE (Minneapolis Domestic Violence Experiment): multi-arm
    noncompliance (43-99% compliance by cell) — the messy-real-RCT
    example.
  - Angrist-Evans twins vs samesex instruments: −.084 vs −.138, 2SLS
    combo −.098 with weights from first-stage strength — different
    instruments, different compliers, different LATEs.
  - External validity: twins vs samesex complier populations differ yet
    conclusions align — "LATE is what you get; whether it's what you
    want is a design question".
- **14387-iv-constant-effects.txt (full)** — Wald estimator; 2SLS
  mechanics ("so simple a fool can do it… and many do!" — the three
  canonical mistakes); weak-instrument bias toward OLS ∝ 1/(F+1)
  (Bekker sketch); the Monte Carlo (1 good + 19 worthless instruments,
  F=1.5 wrecks 2SLS; LIML stays centered) — report as fact, not
  derivation; Angrist-Krueger QOB as the canonical natural experiment
  (sawtooth figure sourced).
- **MHE ch.4 TOC** — chapter pointers only.
- Business translation (constructed, clearly labeled): feature-adoption
  encouragement (randomized email nudging feature adoption; adoption is
  the treatment), free-trial extensions, sales-touch encouragement —
  the standard product-analytics encouragement designs.

## Key points the lesson must cover

1. **Noncompliance is the norm**: you randomize offers/nudges, not
   behavior. As-treated and per-protocol comparisons reintroduce
   selection (derive in one line from the DiD lesson's decomposition);
   ITT stays valid but answers the offer question, diluted by
   compliance.
2. **Bloom/Wald**: with one-sided noncompliance, TOT = ITT/P(comply) —
   derive; JTPA's $3,970/$1,117/$1,825 as the keeper triple (state
   which question each number answers).
3. **LATE**: two-sided noncompliance; the four types
   (compliers/always/never/defiers); monotonicity kills defiers;
   theorem statement + proof sketch; the Wald ratio as reduced-form /
   first-stage. The uncomfortable honest point: the estimand is
   instrument-specific (twins vs samesex worked numbers) — different
   nudges measure different customers.
4. **IV beyond experiments**: instrument = a variable moving treatment
   with no direct outcome path (exclusion); QOB as the canonical
   natural experiment (sourced figure); business instruments are rare
   and mostly self-made (encouragement designs) — the practical
   verdict: in product analytics, BUILD the instrument by randomizing
   encouragement.
5. **Weak instruments**: bias toward OLS ∝ 1/(F+1); first-stage F as a
   design metric; the 20-instrument Monte Carlo as the cautionary
   fact; rule — few strong instruments, report the first stage.

## Set pieces and worked examples to recreate

- **JTPA three-numbers table** — the single best "which question does
  each estimator answer" artifact in the literature.
- **The encouragement-design worked example** (constructed, running
  case): email nudge → 28% adoption vs 11% control; ITT on retention
  +0.9pt; Wald = 0.9/(28−11) = +5.3pt for compliers — full arithmetic,
  then the LATE caveat paragraph (who are these compliers?).
- **Twins vs samesex comparison** — two instruments, two LATEs, the
  2SLS blend and its first-stage weights.
- **MDVE** as the "real RCTs are messy" vignette (one paragraph).

## Pitfalls / subtleties to flag

- Exclusion is untestable and usually the weak point: the email nudge
  must not affect retention EXCEPT through adoption (reminder effects
  violate it) — give the violation example and the design patch
  (placebo email arm).
- ITT vs LATE vs ATE: never let the lesson imply LATE = ATE;
  heterogeneous effects make the difference real (Angrist-Evans).
- 2SLS mechanics at pointer depth (the audience can regress); the
  three canonical mistakes named (manual 2SLS SEs, forbidden
  regressions) without full econometrics.
- Weak-IV: quote 1/(F+1) as an approximation with its source
  (Bekker via 14.387), no derivation.
- Don't do QOB's full replication — it's the sourced illustration, not
  the worked example (business case carries the work).

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the compliance square**: assignment ×
   uptake 2×2 with the four types placed, defiers struck out by
   monotonicity; complier share as the visible slice.
2. `draw:` `<FigureSequence>` (4 frames) — **from ITT to LATE**: frame
   1 randomized offer, both arms with mixed uptake; frame 2 ITT
   computed (diluted); frame 3 the first stage (uptake difference)
   isolated; frame 4 the Wald ratio assembled with the complier slice
   highlighted. One move per frame.
3. `draw:` single `<Figure>` — **JTPA's three numbers**: three bars
   (OLS / ITT / IV-TOT) each labeled with the question it answers and
   its failure mode (selection / dilution / none-for-compliers).
4. `source:` **14387-angrist-krueger-qob-firststage** — save as
   `angrist-krueger-sawtooth`. Reader must see: the quarter-of-birth
   sawtooth in schooling AND in wages — a real natural experiment's
   first stage and reduced form. Placement: centered in the
   natural-instruments section; the most-reproduced figure in applied
   IV; our redraw would be fabrication.
5. `draw:` single `<Figure>` — **exclusion violated**: the nudge → 
   adoption → retention path with the forbidden direct nudge →
   retention arrow in red; the placebo-arm patch beside it.
6. `draw:` single `<Figure>` — **weak-instrument bias**: bias-toward-OLS
   as a function of first-stage F via 1/(F+1); the F=1.5 disaster
   point and F>10 folklore threshold marked (labeled folklore).

## EXERCISE PLAN

1. Warm-up: from the encouragement worked example's four cells, compute
   ITT, first stage, and the Wald estimate. (Mechanics once.)
2. Boundary probe: compliance difference → 0 (nudge barely moves
   adoption): show the Wald ratio's variance explodes and tiny
   exclusion violations get amplified 1/first-stage-fold — why weak
   first stages are catastrophic, not just imprecise.
3. Claim to refute: "Users who adopted the feature retained 12pt
   better than those who didn't, controlling for plan and tenure — the
   feature causes retention." Deploy selection + bad-controls + the
   encouragement design that would answer it; compute what the
   12pt gap could look like under pure selection using the veterans-
   style argument.
4. Derivation the lesson skipped: prove the LATE theorem for binary
   Z, D (decompose ITT over the four types; independence kills the
   assignment terms; exclusion kills always/never-taker contributions;
   monotonicity removes defiers; divide by complier share).
5. Research-shaped: from the cached deck, verify the Angrist-Evans
   2SLS blend −.098 as the first-stage-weighted average of −.084
   (twins, weight .74) and −.138 (samesex, .26); state why the blend
   is closer to the twins LATE.
6. FORWARD (E7): your nudge experiment shows the complier LATE is
   +5.3pt, but marketing asks "which users should we nudge?" — LATE is
   one number for one subpopulation. Solution: estimating the effect
   as a FUNCTION of user covariates is CATE/uplift — two lessons
   ahead; `<Ref>` uplift-and-causal-forests.
7. Spaced (E3, ab-tests + pathologies): the encouragement design is
   an A/B test whose SRM/trust checks still apply to ASSIGNMENT — list
   which module-3 checks survive noncompliance unchanged and which
   metric (uptake) becomes a first-stage guardrail.
