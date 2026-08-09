# Research brief: oec-and-guardrails (OEC, guardrail metrics, and multiple comparisons)

status: planned
module: experiments
type: core
goal: Construct an experiment scorecard — one OEC, guardrail metrics, and a multiple-comparisons correction

The design-synthesis lesson of module 3: what to measure, what to protect,
how to correct for measuring many things. Sources: Kohavi ch.1 (full) +
chs. 6/7/21 TOC (⚠ unread — pointer depth), Johari §6 (full — the
FDR machinery and the deployed rationale), Goodhart lesson (spiral).

## ARC (L10)

- **Inherits:** OEC as a named term (ab-tests), Goodhart's law (module
  2), the pathologies catalog (segment hunting = many comparisons), and
  always-valid p-values (Johari) whose §6 builds the corrections.
- **Contributes:** Spine step 6's close on the measurement side: the
  scorecard — one OEC engineered against gaming, guardrails that catch
  harm the OEC misses, and FWER/FDR discipline for many metrics ×
  variants.
- **Hands off:** bing-experimentation-program audits a real program
  against exactly this scorecard; module 4 then leaves the fixed test.

## Sources to consult

- **Kohavi ch.1 (full)** — OEC definition (short-term measurable,
  causally linked to long-term value, pp.6-7); guardrail concept with
  the Eastern Air Lines Flight 401 story (p.22: crew fixated on a
  burned-out indicator, altitude — the guardrail — sank); malware
  experiment improving EVERY metric class (usage, quality, revenue) as
  the rare clean sweep; Tenet 1 (formalized OEC as an organizational
  act).
- **Kohavi TOC (unread)**: ch.6 "Metrics Taxonomy / Formulating /
  Evaluating / Evolving; Sidebar: Guardrail Metrics; Sidebar:
  Gameability"; ch.7 "Combining Key Metrics into an OEC; OEC for
  Amazon e-mail; OEC for Bing; Goodhart's Law, Campbell's Law, Lucas
  Critique"; ch.21 SRM + trust guardrails. Named as chapters; no page
  claims. The Amazon-email and Bing OEC examples exist there — refer to
  them as documented worked cases the reader can pursue, without
  inventing their content.
- **Johari §6 + Appendix (full)** — multiple comparisons from
  always-valid p-values: Bonferroni (FWER) vs Benjamini-Hochberg
  q-values (FDR); Optimizely's explicit user-research rationale for FDR
  ("customers focused on the significant results and expected most (but
  not all) to be accurate") — a statistics-meets-UX decision, quote it.
- **Goodhart lesson** — gameability as OEC design criterion; the
  clicks-per-session forward exercise lands here.
- **Strathern/metric-tree spiral** — proxy validation: an OEC is a proxy
  whose causal link to long-term value is itself a hypothesis (Kohavi
  ch.23 long-term pointer).

## Key points the lesson must cover

1. **The OEC design problem**: short-term measurable ∧ causally
   predictive of long-term value ∧ hard to game ∧ sensitive enough to
   move (power!). These pull against each other — engagement is
   sensitive but gameable; revenue is real but slow and noisy; the OEC
   is an engineered compromise, usually a weighted combination with
   pinned weights (ex ante, or the weights become the gaming surface).
2. **Proxy validation debt**: every OEC carries an IOU — evidence that
   moving it moves the long-term object (long-running holdouts,
   quasi-experiments; ch.23/ch.7 pointers). Sessions-per-user vs
   queries-per-user reasoning from ch.1's Bing discussion: queries can
   rise from WORSE search; sessions-per-user is the better OEC — the
   one fully-sourced OEC argument we have; use it as the worked case.
3. **Guardrails**: the metrics you refuse to trade — latency, crashes,
   unsubscribes, SRM (trust guardrails vs harm guardrails). Flight 401
   as the archetype: optimizing the focal indicator while the guardrail
   sank. Guardrails are powered DIFFERENTLY (non-inferiority framing:
   you must be able to DETECT harm of the size you care about — power
   arithmetic reappears).
4. **Many metrics, many variants**: the counting problem (40 segments ×
   10 metrics × 3 variants); FWER (Bonferroni: divide α, safest,
   power-poor) vs FDR (BH: control the fraction of false discoveries);
   Optimizely's shipped choice and its stated rationale. Rule: OEC and
   guardrails at full α with correction across variants; exploratory
   metrics at FDR, labeled exploratory.
5. **The scorecard as artifact**: one page — hypothesis, OEC (with
   validation status), guardrails (with non-inferiority margins),
   correction policy, stopping rule (always-valid or fixed-horizon).
   The module's exercises fill it; Bing's program is audited against it
   next lesson.

## Set pieces and worked examples to recreate

- **Sessions-vs-queries OEC argument** (Kohavi ch.1): worked through the
  metric tree — queries/user = sessions/user × queries/session; degraded
  relevance raises queries/session (retries) while sinking
  sessions/user — the decomposition exposes the gaming surface.
- **Flight 401 retold in 5 lines** + its product translation (a team
  optimizing CTR while latency guardrail degrades).
- **The counting table**: 40 × 10 × 3 = 1,200 tests; expected false
  positives at α=.05 = 60; Bonferroni's α/1200 vs BH's adaptive
  threshold — computed on a constructed p-value list (10 lines).
- **The scorecard template** filled for the running case's pricing-page
  experiment.

## Pitfalls / subtleties to flag

- Chs. 6/7/21 unread: the Amazon-email OEC example is NAMED not
  reproduced; re-deepen post-purchase.
- FDR on correlated metrics: BH is conservative-ish under positive
  dependence — one sentence (Johari's appendix handles correlated
  p-values; pointer).
- Guardrail non-inferiority is not "p>.05 so fine" — absence of
  evidence trap; state the margin-based framing.
- One OEC does not mean one number on the dashboard — it means one
  DECISION criterion; the dashboard stays rich, the ship/no-ship rule
  is singular.
- Do not re-teach Goodhart; one recap sentence + `<Ref>`, then apply.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the OEC tension square**: four pulls
   (measurable soon / causally valid / ungameable / statistically
   sensitive) with candidate metrics plotted inside (revenue, sessions,
   clicks, NPS) — the design space, not a verdict.
2. `draw:` single `<Figure>` — **queries decomposition** (voita rule 7):
   queries/user = sessions/user × queries/session with the two factors'
   desired directions annotated and the retry-gaming arrow on
   queries/session.
3. `draw:` `<FigureSequence>` (3 frames) — **the scorecard assembling**:
   frame 1 hypothesis + OEC; frame 2 guardrails bolted around it with
   margins; frame 3 correction policy + stopping rule stamped — the
   finished artifact.
4. `draw:` single `<Figure>` — **FWER vs FDR on 100 p-values**: sorted
   p-value plot with the Bonferroni line (flat, low) and BH line
   (rising) and the discovery sets shaded; the constructed example's
   numbers.
5. `draw:` single `<Figure>` — **guardrail dashboard row**: OEC readout
   (green) beside guardrails with non-inferiority margins drawn as
   bands, one guardrail breaching (latency) — the ship decision blocked
   despite a winning OEC.

## EXERCISE PLAN

1. Warm-up: none.
2. Boundary probe: an experiment with the OEC at α=.05 and 12 guardrails
   read at α=.05 each: compute the probability some guardrail fires
   under the global null (~46%) and design the split (which side gets
   corrected, and why guardrails need power for HARM, not significance
   for safety).
3. Claim to refute: "Our 3 variants × 8 metrics gave one significant
   win (p=.02); we ship that variant." Compute expected false positives
   (24 tests), apply BH to a given p-list, and state the verdict; name
   the difference between confirmatory (OEC) and exploratory
   (everything else) claims.
4. Derivation the lesson skipped: prove Bonferroni controls FWER from
   the union bound in two lines, and show with independent p-values the
   power cost (probability of detecting one true effect of fixed size
   among m tests as m grows).
5. Research-shaped: design the OEC + guardrails scorecard for the
   running case's onboarding redesign — including the validation IOU
   (what long-term evidence would license the OEC) and the guardrail
   margins with the n each needs (power lesson reused). (Design
   production.)
6. FORWARD (E7): your OEC is fixed, but traffic only supports testing 2
   of 5 candidate variants at power. Propose how to spend the traffic
   when the goal is finding the best variant rather than certifying one
   — and note what you're trading. Solution: adaptive allocation —
   bandits, best-arm identification — the next lesson's subject; `<Ref>`
   multi-armed-bandits.
7. Spaced (E3, Goodhart + tree): take the clicks-per-session exercise
   from goodharts-law and finish it: the full scorecard with paired
   guardrails, and the metric-tree location of each (which parent each
   guardrail protects).
