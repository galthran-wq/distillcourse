# Research brief: attribution-and-incrementality (Attribution: Shapley credit and the incrementality gap)

status: planned
module: growth-channels
type: core
goal: Compute Shapley-value attribution over channel coalitions and demonstrate why no attribution scheme measures incrementality

Channel measurement from the bottom, and the module's sharpest
conceptual distinction. Business words: last-click, multi-touch,
data-driven attribution, incrementality. Academic layer: cooperative
games, the Shapley value and its axioms. Dig-deeper: Zhao et al. 2018;
Kaushik.

## ARC (L10)

- **Inherits:** MMM's top-down channel estimates and their calibration
  gap; Part II's potential-outcomes language (incrementality is a
  counterfactual quantity, already defined as such in
  difference-in-differences).
- **Contributes:** Spine step 11's second half: credit assignment done
  as well as it can be (Shapley) — and the proof by example that even
  done perfectly it answers a different question than incrementality.
- **Hands off:** The Matryoshka usage rule (last-click for in-flight,
  attribution for allocation, experiments for truth) feeds
  channel-portfolio's allocation inputs; incrementality experiments are
  Part II machinery, closing the course's measurement loop.

## Sources to consult

- **Zhao, Mahboobi & Bagheri 2018 (FULL, cached shapleyvalue-)**:
  - §1: the rule-based taxonomy (last/first-touch, linear, U-shaped,
    time-decay) — name them, one line each.
  - §2: channels as players; ν(S) = Σ_{T⊆S} R(T) with R(T) = revenue
    from users touching exactly T; the three axioms (efficiency, dummy,
    symmetry).
  - §3 Theorem 1: φ_j = Σ_S 1/(|S|+1)·R(S∪{j}); the 3-channel worked
    example (eq 13): φ₁ = R(1) + ½R(12) + ½R(13) + ⅓R(123);
    2^20 coalitions / 17 hours → 2 minutes.
  - §4: ordered (touchpoint-position) Shapley.
  - §5: the real campaign — 18 channels, 153,814 conversions, $14.3M;
    Figs 1–2 (category shares; 91.6% of credit at touchpoint 1);
    THE PARADOX: paid-search touchpoint-1 share 43.76% → 8.25% (filter
    1-channel journeys) → 4.37% (filter ≤2) — loyal users converting on
    one search visit, likely pre-exposed offline.
  - §6: offline-confound limitation; adstock extension pointer.
- **Kaushik (FULL, cached)**:
  - The definitional pair, verbatim-close: attribution = distributing
    credit for conversions that happened; incrementality = conversions
    that would NOT have happened without marketing.
  - The 10-conversions worked example ending at 3 incremental; the
    Patagonia-jacket vignette ("existing as a company" pathways); the
    0–25% incrementality benchmark (5–25% large companies, comments).
  - Matryoshka dolls: last-click (in-flight) ⊂ multi-touch (budget
    allocation) ⊂ incrementality (CFO decisions).
  - The Anand comment: pausing ads for 1.5 months, orders −60%, and why
    that before/after read is NOT an incrementality estimate (no
    control, seasonality, carryover) — a ready-made error-diagnosis
    exercise.
  - Brand-keyword bidding thread: even 7% incrementality can be worth
    it — nuance against the "always cut brand spend" overcorrection.
- **Part II internal**: potential outcomes, holdout experiments; the
  incrementality experiment IS an A/B test with spend as treatment
  (geo designs — Ref difference-in-differences / synthetic-control for
  when user-level holdouts fail).

## Key points the lesson must cover

1. **Rule-based attribution and its arbitrariness**: the five standard
   models on one journey; each is a weighting chosen by fiat (the
   first-click-girlfriend joke's content, in dry register: first-touch
   over-credits initiation).
2. **Axioms select Shapley**: efficiency + dummy + symmetry; channels as
   a cooperative game over journey-coalition revenues; Theorem 1's
   computable form with the 3-channel hand example. This is the
   "data-driven attribution" black box opened.
3. **The paradox as the discriminating case** (L13): raw Shapley seems
   to vindicate last-click (91.6% at touchpoint 1) — until journey-
   length segmentation collapses it (43.8→4.4%). Lesson: attribution
   outputs are population-composition statements, audit before use.
4. **Attribution ≠ incrementality, proved by construction**: Kaushik's
   10→3; the "existing as a company" base rate that no touchpoint data
   contains; typical incrementality 0–25%. Efficiency axiom forces
   credit to sum to ALL conversions — the axiom itself bakes in the
   error relative to incrementality.
5. **The usage rule**: Matryoshka layering; incrementality is measured
   by experiments (holdout/geo — Part II), attribution allocates within
   the experimentally-anchored envelope, MMM calibrated likewise
   (previous lesson) — the course's three measurement layers reconciled.

## Set pieces and worked examples to recreate

- The 3-channel Shapley hand computation (eq 13) with concrete R values
  — small enough to verify by enumeration.
- The paradox table: touchpoint-1 shares under no filter / >1 / >2
  journeys (43.76 / 8.25 / 4.37) recreated as our chart.
- Kaushik's 10-conversions diagram rebuilt in house style (his own
  figures are colored boxes; the reader summary explicitly recommends
  redrawing).
- The Anand before/after fallacy as an error-diagnosis worked example.

## Pitfalls / subtleties

- Shapley here is over CHANNEL COALITIONS as user-set partitions, not
  orderings — Zhao's ν(S) definition differs from Shao & Li's; one
  precise sentence, no literature weeds.
- Efficiency axiom = credit sums to observed conversions — a feature
  for allocation, the exact bug for incrementality; make the connection
  explicit, it is the lesson's sharpest line.
- Ordered Shapley ≠ time-decay heuristics — it is still credit, not
  causality.
- The 2^n cost matters at 20+ channels; Theorem 1 is why data-driven
  attribution ships at all.
- Google deprecated most rule-based models in favor of "data-driven"
  (dated claim — verify at write time; keep genre-level).

## FIGURE PLAN

1. `draw:` single `<Figure>` — one journey, five rules: a 4-touchpoint
   journey with credit bars under last/first/linear/U/time-decay —
   the arbitrariness in one look.
2. `draw:` `<FigureSequence>` (4 frames) — building Shapley: frame 1
   users partitioned by touched-channel set with revenues R(T); frame 2
   coalition value ν(S) assembled; frame 3 marginal contributions;
   frame 4 the 1/(|S|+1) formula with the 3-channel numbers.
3. `draw:` single `<Figure>` — the paradox: three grouped bars
   (unfiltered / >1 / >2 channels) of touchpoint-1 paid-search share
   with 43.8/8.3/4.4% labeled (data from Zhao Tables 2–4).
4. `draw:` single `<Figure>` — attribution vs incrementality: 10
   conversion tokens; attribution splits all 10 across channels;
   incrementality panel shows 7 shaded "would have happened anyway"
   (existing-as-a-company) and 3 incremental (Kaushik's canonical
   diagram, house-rebuilt).
5. `source:` **shapleyvalue-theorem1-formula** — save as
   `shapley-theorem1-original`. Reader must see: "Theorem 1" and eq
   (12)/(13) as published. Placement: small float-right beside our
   derivation; caption: the citation artifact (we re-typeset for
   teaching). Provenance is the payload.
6. `draw:` single `<Figure>` — the Matryoshka layering: three nested
   frames (last-click / multi-touch / incrementality) each labeled with
   its decision speed and decision owner.

## EXERCISE PLAN

1. Warm-up: three channels with R(A)=100, R(B)=60, R(AB)=80, R(∅)=0 —
   compute φ_A, φ_B via Theorem 1 and verify efficiency (sum =
   ν({A,B}) = 240). (Unfamiliar computation.)
2. Boundary probe: add a channel D with R(S∪D)=R(S) for all S (a true
   dummy) — show φ_D=0 from the formula; then explain why last-click
   can still award D 30% of credit if D is a common final touch
   (retargeting), and which axiom last-click violates.
3. Claim to refute: "Data-driven (Shapley) attribution measures each
   channel's causal contribution." Use the efficiency axiom + the 10→3
   example: any scheme summing to ALL conversions overstates causal
   effect whenever incrementality < 100%; name the exact axiom at
   fault and what experiment fixes the level.
4. Derivation the lesson skipped: verify Theorem 1 equals the classical
   permutation-average Shapley formula for n=3 by enumerating all 6
   orderings — the combinatorial identity made concrete.
5. Research-shaped: reproduce the paradox qualitatively on synthetic
   data — simulate 10,000 journeys where 70% are single-touch
   brand-search converters; compute touchpoint-1 share before/after
   filtering and compare to Zhao's 43.8→8.3 collapse; state the
   population fact the filter reveals.
6. FORWARD (E7): a budget allocator uses Shapley shares as weights.
   Given incrementality experiment results (search 8%, display 40%
   incremental), recompute the allocation weights as
   share × incrementality and note the ranking flip. Solution: this
   experiment-anchored blend is exactly what channel-portfolio
   allocates on; `<Ref>` channel-portfolio.
7. Spaced (E3): design the incrementality experiment for brand-keyword
   bidding (Kaushik's thread): unit of randomization, why user-level
   fails (Ref experiment-pathologies interference), and the geo/DiD
   fallback (Ref difference-in-differences) — three sentences each.
