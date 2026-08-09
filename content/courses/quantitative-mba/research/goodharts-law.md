# Research brief: goodharts-law (Goodhart's law and vanity metrics)

status: planned
module: unit-economics
type: core
goal: Predict how a metric degrades once it becomes a target and diagnose gamed or vanity metrics in reported numbers

Business words: vanity metrics, metric gaming. Academic layer: Goodhart's
law with its actual provenance (Strathern 1997 popularizing via Hoskin;
Goodhart 1975 as the origin), Campbell's law and the Lucas critique named
as siblings (Kohavi ch.7 TOC pointer). Primary source read in full.

## ARC (L10)

- **Inherits:** The metric tree (north-star-and-metric-trees): metrics as
  steering instruments; the planted seam "pulling a leaf need not move the
  parent".
- **Contributes:** Spine step 4's warning: metrics "predictably break when
  targeted." The mechanism (selection + gaming under optimization
  pressure), the canonical phrasing with correct provenance, the vanity-
  metric taxonomy, and working diagnostics.
- **Hands off:** hubspot-unit-economics applies the whole module including
  these diagnostics to a real published table; oec-and-guardrails (module
  3) inherits gameability as an OEC design criterion — say so explicitly.

## Sources to consult

- **Strathern 1997** (full, gwern mirror; image
  improvingrat-goodharts-law-quote):
  - p.308: "When a measure becomes a target, it ceases to be a good
    measure" + the 2.1-exam discriminator example; attribution via Hoskin
    (1996) — Strathern did NOT quote Goodhart 1975 directly (provenance is
    content here, L8a applies).
  - pp.306-310: the 1792 Cambridge numerical-marking proposal ("'is' and
    'ought' brought into proper alignment"); accountability originating in
    university examination, looping into commerce and back.
  - p.311: Power's audit loop — "standards of performance shaped by the
    need to be auditable"; audit as a system observing itself.
  - pp.313-319: proxy pressure institutionalized (performativity;
    transferable-skills disembedding) — mine ONE compact idea: making the
    measure explicit changes the behavior that produced it.
- **Kohavi ch.1 (full) + ch.6-7 (TOC)** — "Gameability" sidebar named in
  ch.6 TOC; ch.7's section title "Goodhart's Law, Campbell's Law, and the
  Lucas Critique" (name the siblings, one line each, References-level
  cite); ch.1's guardrail concept as the operational descendant.
- **Fader & Hardie 2009** p.63 — Amazon's "76M active customers" as a
  window-artifact count: a vanity metric with a precise mechanism (change
  the window, the base changes, nothing real moved). Spiral from
  repeat-purchase-models.
- **Issue #85 anchor** — Groupon's ACSOI (marketing costs excluded from
  the profitability metric in its S-1) is the sketch's named example: we
  have NO swarm source; if used, verify against the S-1 text before
  drafting or keep to one qualitative clause flagged for verification.

## Key points the lesson must cover

1. **The law, stated and sourced**: Strathern's phrasing; provenance chain
   (Goodhart 1975 banking origin → Hoskin → Strathern's popularization);
   the 2.1-exam example as the cleanest instance: the more a 2.1 becomes
   an expectation, the worse it discriminates.
2. **The mechanism, made mechanical** (this is where the lesson earns its
   place in a quantitative course): a proxy correlates with the goal over
   the HISTORICAL distribution of behaviors; optimization pressure samples
   from new behaviors chosen BECAUSE they move the proxy — the correlation
   was never causal support, and selection on the proxy destroys it.
   Regression-to-proxy framing the audience already owns (overfitting the
   reward; Goodhart as distribution shift under optimization). Tie to the
   metric tree: dashed edges (fitted rates) break under pressure; solid
   edges (identities) cannot.
3. **Vanity-metric taxonomy with mechanisms**: cumulative counts (can only
   rise), window-defined actives (Amazon case — denominator choice),
   ratios with selected denominators, milestone metrics timed for
   reporting. For each: what it hides, one diagnostic.
4. **Diagnostics**: does the metric move its tree parent? does it survive
   a definition perturbation (window ±50%)? is its improvement
   concentrated exactly where the incentive bites (discontinuities at
   thresholds — the 2.1 boundary, quarter ends)? threshold-bunching as the
   empirical fingerprint.
5. **Design response, previewed**: paired/guardrail metrics, hard-to-game
   OECs — one paragraph, `<Ref>` oec-and-guardrails; the lesson's business
   verdict: never publish (or bonus on) a metric you haven't tried to
   break yourself.

## Set pieces and worked examples to recreate

- **The 2.1-exam discriminator, computed**: a toy signal-vs-threshold
  model — ability distribution, grade as noisy measure, then teaching-to-
  the-threshold shifts mass to just-above-2.1; the grade's correlation
  with ability before vs after, computed. (Our arithmetic; Strathern's
  example.)
- **Amazon window arithmetic** (2009 paper): actives at 12-month vs
  9-month windows on the running case's purchase data — the "customer
  base" shrinking with nothing real changing.
- **The 1792 numerical-marking anecdote** (Strathern p.307) as the
  historical one-liner: quantification as moral instrument, 200 years of
  the same loop. One short paragraph, no more (L12).
- **Threshold bunching sketch**: histogram with a spike just above the
  incentivized cutoff — the auditor's screening picture.

## Pitfalls / subtleties to flag

- Provenance discipline: Strathern's sentence is the CITABLE phrasing;
  Goodhart's 1975 original says something narrower about monetary
  targets. The lesson must not attribute the sentence to Goodhart 1975.
- Goodhart ≠ "metrics are bad": the law is about targeting pressure, not
  measurement; the fix is design (guardrails, pairing), not abandonment.
  This is the documented misconception worth a refutation slot (L13).
- Do not moralize or list scandals; every example must carry a mechanism
  the reader can compute (L12: evidence pulled by the argument).
- Groupon/ACSOI: only with verification (see sources note).

## FIGURE PLAN

1. `source:` **improvingrat-goodharts-law-quote** — save as
   `strathern-1997-goodhart-page` (crop to the paragraph). Reader must
   see: the sentence in situ with the 2.1 example and the Hoskin
   attribution. Placement: float-right at the provenance passage — the
   citable artifact; a redraw would be typesetting, not evidence.
2. `draw:` `<FigureSequence>` (4 frames) — **how a proxy dies**: frame 1
   goal and proxy scattered, correlated (historical behaviors); frame 2
   the target line drawn on the proxy; frame 3 new behavior mass appears
   along the proxy axis (moves proxy, not goal); frame 4 the correlation
   recomputed — gone. One change per frame; our own toy data.
3. `draw:` single `<Figure>` — **the 2.1 threshold before/after**: grade
   distributions pre/post targeting with the just-above-2.1 bunch, and
   the grade→ability discriminating power annotated as a tally.
4. `draw:` single `<Figure>` — **window-defined actives**: the same
   purchase log counted at 12- and 9-month windows; two "customer base"
   bars differing ~20% with zero behavioral change (Amazon case, our
   numbers).
5. `draw:` single `<Figure>` — **vanity-metric field guide**: four small
   panels (cumulative curve; window-active; chosen denominator; milestone
   timing), each with its one-line diagnostic under it. Single-idea
   panels, one figure slot.

## EXERCISE PLAN

1. Warm-up: none — no formula was displayed worth drilling; start at
   diagnosis. (Floor rule: at most one warm-up; zero is allowed.)
2. Boundary probe: a metric that is an accounting identity of the goal
   (revenue targeted by… revenue): show Goodhart pressure has no proxy
   gap to exploit — gaming must move the goal or move the LEDGER
   (channel-stuffing = moving recognition across time). Conclude: even
   identities are gameable in the time dimension; name which module-2
   lesson's machinery detects it (bookings vs billings vs revenue).
3. Claim to refute: "Goodhart's law means KPIs are self-defeating, so we
   shouldn't set metric targets." Refute with the mechanism: the law
   conditions on proxy pressure with a proxy gap; paired metrics and
   guardrails shrink the exploitable gap — give the paired-metric fix for
   one concrete gamed metric (support tickets closed/hour paired with
   reopen rate).
4. Derivation the lesson skipped: in the toy model (goal g, proxy
   p = g + ε, agent chooses effort allocation), derive that optimizing p
   allocates effort to ε whenever ε is cheaper to move than g — Goodhart
   as a corollary of cost asymmetry, not malice.
5. Research-shaped: take the Amazon "active customers" definition and the
   running case's log: compute actives under 12/9/6-month windows and
   plot the "growth" a window change alone manufactures; state the
   disclosure that would neutralize it (fixed window + cohort detail).
6. FORWARD (E7): your team's experiment OEC is "clicks per session".
   List two behaviors that raise it while harming the business, then
   propose the metric pair that would catch each. Solution: this is OEC
   design with guardrails — `<Ref>` oec-and-guardrails.
7. Spaced (E3, north-star lesson): mark on the running-case metric tree
   which three nodes are most gameable (dashed edges near incentives) and
   which reads (cohort vs blended) resist gaming longest.
