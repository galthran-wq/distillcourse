# Research brief: experiment-pathologies (Experiment pathologies: interference, novelty, dilution)

status: planned
module: experiments
type: core
goal: Diagnose interference, novelty and primacy effects, dilution, and segment traps in experiment readouts

The failure catalog: four ways a formally valid A/B readout misleads, each
with mechanism + diagnostic + containment. Sources: Kohavi ch.1 (full) +
chs. 3/20/22/23 at TOC depth (⚠ unread — no page-level claims), CUPED §5.3
(full — the post-treatment mechanism), module-2's Simpson machinery.

## ARC (L10)

- **Inherits:** Valid design + trust checks (ab-tests), power arithmetic,
  and CUPED's validity condition (E[X^t]=E[X^c]) — the seed this lesson
  grows into a catalog.
- **Contributes:** Spine step 6 continued: the documented failure modes —
  interference (SUTVA), time-dependence (novelty/primacy, long-term
  effects), dilution/triggering, and segment traps (Simpson again) — each
  named, mechanized, diagnosed, contained.
- **Hands off:** oec-and-guardrails closes the trustworthy-testing design
  (what to measure); multi-armed-bandits and the causal lessons pick up
  designs for when containment fails (cluster/switchback → module 4's
  toolbox).

## Sources to consult

- **Kohavi ch.1 (full)**: the ice-cube-in-a-cold-room analogy (p.23) —
  threshold effects need large/long experiments; two-sided marketplace
  and primacy/change-aversion named there; guardrail teaser.
- **Kohavi TOC (unread chapters — pointer depth only)**: ch.3 (internal/
  external validity threats, segment differences, Simpson's paradox);
  ch.20 (triggering, the Kohavi-Longbotham numeric example, dilution,
  overall treatment effect); ch.22 (leakage/interference, practical
  solutions, detection); ch.23 (long-term effects, why short≠long).
  Phrase as "the book's chapter on X treats…" without page claims.
- **CUPED §5.3 (full)** — the one fully-sourced mechanism: post-treatment
  conditioning flips signs; generalize from covariates to triggering and
  segmentation ("only analyze users who did X" is the same crime when X
  is downstream of treatment).
- **Module 2** (north-star lesson) — the Simpson/mix Δ-decomposition,
  reused on experiment segments.
- **Bandit book ch.31 note** (gym-in-January) — nonstationarity flavor
  for novelty framing (one clause).
- Marketplace cannibalization: construct the toy two-sided example
  ourselves (no page-level source): treatment users book the limited
  inventory control users would have booked — the effect estimate
  includes theft between arms.

## Key points the lesson must cover

1. **The two silent assumptions**, stated as the frame: (i) no
   interference — my outcome depends only on my assignment (SUTVA's
   informal form); (ii) stability over time — the effect measured this
   week is the effect next quarter. The catalog = ways (i) and (ii) fail.
2. **Interference**: marketplaces (shared inventory — cannibalization
   between arms, worked toy example with numbers), social/network
   spillovers, shared caches/budgets. Diagnostics: effects that shrink
   at rollout ("we A/B'd +8%, shipped +2%"). Containment: cluster
   randomization (markets/regions as units — n collapses, power pays),
   switchback (time slices as units) — mechanics sketched, each with its
   own bias/variance tradeoff.
3. **Time-dependence**: novelty (effect decays) vs primacy/change
   aversion (effect builds); the ice-cube threshold picture for effects
   that need accumulation; long-running experiments and their
   contamination problems (TOC pointer). Diagnostic: effect-vs-time
   plot, first-exposure cohorting (day-since-exposure curves — cohort
   thinking returns, `<Ref>` cohorts-and-funnels).
4. **Dilution and triggering**: 90% of users never touch the changed
   surface ⇒ measured lift = true lift × trigger share (a 10% feature
   lift reads as 1%); triggering restores sensitivity but ONLY on
   pre-treatment-determined trigger status; post-treatment triggering =
   CUPED §5.3's sign-flip mechanism. The arithmetic of diluted power
   (ties to power-and-mde: MDE on the triggered subpopulation).
5. **Segment traps**: subgroup significance hunting (multiple
   comparisons preview, `<Ref>` oec-and-guardrails) and Simpson on
   experiment segments — the Δ-decomposition reused: segment shares can
   differ by arm ONLY through randomization failure or post-treatment
   segmentation; if segment membership is post-treatment, comparisons
   within segments are biased. The rule: segment by pre-treatment
   attributes only.

## Set pieces and worked examples to recreate

- **Marketplace cannibalization toy**: 100 units of inventory, treatment
  improves search; per-arm bookings vs true market-level effect —
  computed both ways; the A/B overstates by the stolen amount.
- **Dilution arithmetic**: trigger share 10%, true lift 10% → observed
  1%; required n at each analysis level (from the power lesson's
  formula) — a 100× sample difference.
- **Novelty curve**: effect-by-week plot decaying to zero (constructed);
  the "ship it" decision at week 1 vs week 6.
- **Post-treatment segmentation flip**: users segmented by "engaged
  during experiment" — treatment moves engagement, segment comparisons
  reverse (CUPED Fig 7 logic transplanted; our toy numbers).

## Pitfalls / subtleties to flag

- Chapters 20/22/23 are UNREAD (TOC only): the lesson's numbers must be
  constructed or come from ch.1/CUPED; label constructed examples as
  such. Re-deepen after the book is bought.
- Cluster randomization changes the variance unit — power collapses
  with cluster count, not user count; one honest formula-free paragraph
  (design effect named).
- Switchback assumes no carryover across time slices — its own SUTVA in
  time; say it.
- Do not sprawl: four pathologies, one section each, uniform shape
  (mechanism → diagnostic → containment). The catalog IS the format
  contract here.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the two assumptions**: one diagram of
   user i's outcome with arrows only from own assignment (allowed) and
   crossed arrows from others' assignments and from calendar time (the
   two failure axes) — the catalog's map.
2. `draw:` `<FigureSequence>` (4 frames) — **marketplace theft**: frame 1
   shared inventory pool, two arms browsing; frame 2 treatment books
   more; frame 3 control's bookings fall (same pool); frame 4 the naive
   Δ vs true market effect tally. One change per frame.
3. `draw:` single `<Figure>` — **cluster vs user randomization**: the
   same map split user-wise (leaky) vs region-wise (contained), with the
   effective-n cost annotated.
4. `draw:` single `<Figure>` — **novelty vs primacy**: effect-by-week
   curves (decaying / building / step-at-threshold ice-cube), each with
   its wrong-week-1-decision annotation.
5. `draw:` single `<Figure>` — **dilution arithmetic dissected**:
   observed = true × trigger-share with the 10%×10%=1% numbers and the
   two MDE readouts (all-users vs triggered) side by side.
6. `draw:` single `<Figure>` — **pre- vs post-treatment segmentation**:
   two segment trees, one keyed on sign-up-date (valid), one on
   in-experiment engagement (invalid, arrow from treatment into the
   segmenting variable highlighted red).

## EXERCISE PLAN

1. Warm-up: trigger share 25%, observed all-users lift 0.8% — compute
   the triggered-population lift and the n each analysis needs for 80%
   power at the running case's baseline. (Reuses power formula — bridge
   mechanics.)
2. Boundary probe: cluster randomization with 6 markets: even with
   millions of users, what is the effective sample size, and why does
   the t-test's df make week-long switchbacks attractive? State the
   carryover assumption switchback adds.
3. Claim to refute: "Our referral-feature A/B showed +12% invites per
   treated user, so shipping it lifts invites 12%." Break it twice:
   network interference (invitees land in both arms — contamination
   dilutes control) and marketplace-style saturation of the invitable
   population; state the design (cluster by social component or
   ego-network) that would answer it.
4. Derivation the lesson skipped: derive observed-effect = true-effect ×
   trigger-share under no-effect-on-untriggered, and the variance
   consequence (why triggered analysis at the same data is higher-power
   despite smaller n).
5. Research-shaped: design the distinguishing experiment for novelty vs
   true effect for a UI change: two treatment cohorts started 4 weeks
   apart, compare effect at equal calendar time vs equal exposure age —
   state which pattern indicts novelty. (Design production, E2.)
6. FORWARD (E7): your experiment improved the OEC but a segment cut
   shows losses concentrated in one country, found after testing 40
   segments. Compute the expected number of "significant at .05"
   segments under the global null. Solution: 2 — multiple comparisons;
   the correction machinery (FWER/FDR) is next lesson; `<Ref>`
   oec-and-guardrails.
7. Spaced (E3, CUPED + north-star): unify three rules the course has
   now met — CUPED covariates, triggering, segmentation — under one
   principle (condition only on what treatment cannot move) and name
   the module-4 lesson where the same principle reappears as "bad
   controls" (`<Ref>` difference-in-differences).
