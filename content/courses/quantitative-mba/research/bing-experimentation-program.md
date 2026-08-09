# Research brief: bing-experimentation-program (The Bing experimentation program)

status: planned
module: experiments
type: synthesis
goal: Evaluate an experimentation program — win rate, velocity, revenue contribution — from Bing's published record

MODULE APPLICATION (L16). Artifact: Bing/Microsoft's experimentation
program as documented in Kohavi ch.1 (read in full) — the one large
experimentation program with published win rates, revenue attribution,
and incident stories. The reader audits a PROGRAM, not a single test:
velocity, portfolio win rate, revenue accounting, guardrail incidents.

## ARC (L10)

- **Inherits:** The whole of spine steps 5–6: design vocabulary, power,
  peeking discipline, CUPED, pathologies, the OEC/guardrail scorecard.
- **Contributes:** The module's application: the scorecard and trust
  machinery applied to a real program's published record; program-level
  arithmetic (expected value of an experiment portfolio under low win
  rates).
- **Hands off:** Module 4: Bing's fixed-horizon program is the
  base case; when allocation cost or non-randomizability binds, the
  next module's tools take over.

## APPLICATION SPEC (L16)

- **Artifact:** the Bing experimentation program as publicly documented
  in Kohavi/Tang/Xu ch.1 (the authors ran it): ~monthly experiment
  "packages" with measured revenue impacts (Fig 1.4, perturbed but
  shape-true), named case studies (ad titles, latency, malware, social
  search), and published idea win rates.
- **Module results used:** OEC choice (sessions/user vs queries/user
  reasoning), guardrails (latency, SRM; malware incident), power at
  scale (10ms detectability), Twyman's law (surprising wins
  re-verified), portfolio statistics (win rates × effect sizes),
  peeking discipline at platform scale.
- **Departures from the idealisation (must be named):** revenue figures
  are deliberately perturbed (footnoted by the authors); only ch.1 of
  the book is readable — the program's full mechanics (chs. 4, 15-16)
  are TOC-level; survivor/selection bias in published case studies (the
  $100M wins get written up, the nulls don't — the reader must treat
  ch.1 as a curated sample and SAY so: the win-rate numbers, not the
  case studies, carry the portfolio argument).

## Sources to consult

- **Kohavi ch.1 (full, trustworthyo-ch1.txt)** — everything:
  - Ad-title experiment: 12% revenue lift, >$100M/yr US, 6 months in
    the backlog (pp.3-4).
  - Win rates: ~1/3 of Microsoft ideas positive (Kohavi/Crook/
    Longbotham 2009); 10-20% at optimized domains (Manzi); Slack ~30%
    monetization (Mosavat); Netflix ~90% wrong (Moran); Etsy "nearly
    everything fails" (McKinley).
  - Fig 1.4: ~2.5 years of monthly packages incl. negative months
    (−1.2%, −3.1%, −0.6%) and a rollback — "winning inch by inch".
  - Speed: 2012 — every 10ms pays an engineer's year; 2015 — 4ms;
    Amazon 100ms ↔ −1% sales (Linden).
  - Malware removal: 3.8M affected users, every key metric up, hundreds
    of ms faster.
  - 41 shades of blue (Google) + Bing color experiments (>$10M/yr).
  - Social-search kill: 2 years, >$25M, no significant impact →
    stopped ("achieved failure").
  - Amazon shopping-cart recs (Linden): SVP opposed, experiment won.
  - Amazon '24' search fix: +3% revenue from a backend relevance
    change.
- **Kohavi TOC** — ch.4 (maturity models), chs. 15-16 (ramping,
  scaling): name as the program's unread machinery.
- **Module lessons** — the scorecard (oec-and-guardrails), power
  (10ms at Bing scale worked in power-and-mde), Twyman.

## Key points the lesson must cover

1. **The program's arithmetic**: value = velocity × win rate × average
   win size − cost of losers caught. Compute the portfolio EV with
   ch.1's numbers: at 1/3 win rate, the program's job is cheap, fast,
   trustworthy verdicts — connect back to the module opener's kill
   funnel (same economics, now instrumented).
2. **Idea-ranking failure as a law**: the $100M backlog story + the
   win-rate roundup ⇒ organizations cannot rank their own ideas;
   therefore breadth of testing beats conviction. Tenet 3 revisited
   with its receipts.
3. **Revenue accrues inch by inch**: Fig 1.4 read properly — monthly
   packages, negative months, rollbacks; no single silver bullet; the
   compounding of ~1% wins. Contrast with the case-study sample's
   glamour (selection stated).
4. **Guardrails and speed as first-class results**: the latency
   economics (10ms = engineer-year — recompute what that implies about
   n and metric sensitivity at Bing scale, tying power-and-mde);
   malware as guardrails-catching-harm; the OEC (sessions/user) doing
   its job in the social-search kill — $25M strategy stopped by a null
   result, the program's most expensive and most valuable verdict.
5. **Audit against the scorecard**: for each case study, name the OEC,
   guardrails, and trust checks visible in the record; where the record
   is silent (peeking policy, correction policy), say "not disclosed" —
   the audit's honesty is the lesson.

## Set pieces and worked examples to recreate

- **Portfolio EV table**: velocity (experiments/yr) × win rate × mean
  lift → program value; sensitivity to win rate (why +5pt win rate is
  worth less than 2× velocity at low rates).
- **Fig 1.4 read-through**: recreate the shape (our chart) + ship the
  sourced original; compute the implied cumulative revenue path and
  the share contributed by negative-month rollbacks avoided.
- **The social-search kill as decision theory**: $25M sunk, OEC null →
  stop; the counterfactual cost of shipping on conviction.
- **Latency-experiment arithmetic**: what MDE on revenue does "10ms
  detectable" imply at Bing's n — reverse-engineer the sensitivity.

## Pitfalls / subtleties to flag

- Perturbed numbers: the authors say so; treat shapes and orders of
  magnitude as real, digits as illustrative — model this epistemic
  hygiene in prose.
- Case-study selection bias: ch.1 is a highlight reel; the win-rate
  stats are the representative data. Keep the two roles separate.
- Do not idolize: Bing-scale traffic is the enabling condition most
  readers lack; the closing section must translate each practice to
  startup scale (what survives: trust checks, scorecards, kill
  discipline; what doesn't: 10ms sensitivity, 41 shades).
- All content is ch.1-sourced; nothing from unread chapters beyond
  named pointers.

## FIGURE PLAN

1. `source:` **trustworthyo-fig1-4-bing-revenue** — save as
   `bing-revenue-inch-by-inch` (crop to the chart). Reader must see:
   the monthly package annotations including negative months and the
   rollback. Placement: centered in the inch-by-inch section; the
   program's actual (perturbed) trace — a redraw would erase its
   evidentiary role.
2. `draw:` single `<Figure>` — **program EV dissected**: value =
   velocity × win rate × mean win − losses avoided, each factor
   annotated with its ch.1 number and the lesson that owns improving
   it (velocity ← cheap trust checks; win size ← OEC sensitivity…).
3. `draw:` single `<Figure>` — **win-rate league table**: Microsoft
   1/3, optimized products 10-20%, Slack ~30%, Netflix ~10%, Etsy
   "nearly all fail" — bars with sources, the base-rate wall.
4. `source:` **trustworthyo-fig1-6-bing-malware-ads** — save as
   `bing-malware-serp`. Reader must see: the injected-ads page a real
   user saw. Placement: float-right at the guardrail incident; the
   degraded reality a mockup would understate.
5. `source:` **trustworthyo-fig1-7-amazon-search-24** — save as
   `amazon-search-24`. Reader must see: towel bars vs the TV series.
   Placement: float-right at the backend-changes-are-experiments
   passage; the absurdity is the datum. (Drop if the lesson runs
   image-heavy; priority below #1 and #4.)
6. `draw:` single `<Figure>` — **the kill funnel, instrumented**: the
   module-opener's funnel redrawn with Bing's numbers (ideas → tested →
   won → shipped → revenue), closing the module's frame.

## EXERCISE PLAN

1. Warm-up: none (application lesson).
2. Research-shaped (core): from ch.1's stated figures, estimate the
   ad-title experiment's absolute revenue base (12% ↔ >$100M/yr ⇒
   US ad revenue ≳ $0.8B/yr) and check the order of magnitude against
   the Fig 1.4 RPM framing; state assumptions.
3. Boundary probe: a startup with 5k weekly users adopts "test
   everything": with the power lesson's MDE at that n, compute what
   fraction of Bing-sized wins (~1%) are even detectable; conclude
   which parts of the program transfer and which are scale-gated.
4. Claim to refute: "Experimentation is pointless — 2/3 of ideas fail."
   Invert with the portfolio EV table: LOW win rates are precisely why
   cheap verdicts compound; compute program value at win rates 10% vs
   33% with fixed velocity and show both dominate ship-on-conviction
   under any plausible mean loss for shipped losers.
5. Derivation the lesson skipped: the program's monthly packages mix
   many small effects: derive what a portfolio of independent ±1%
   monthly effects implies for the variance of annual revenue drift,
   and why rollback discipline truncates the left tail (a
   real-options flavor, one paragraph — Part IV seed).
6. FORWARD (E7): Bing certifies variants with fixed-horizon tests at
   huge n. For the running case's homepage with 5 candidate headlines
   and 20k weekly users, compute how long certifying the best via
   sequential A/B pairs takes — and note what you actually need is the
   best arm, not five certificates. Solution: best-arm identification
   / bandit allocation, next lesson; `<Ref>` multi-armed-bandits.
7. Spaced (E3, peeking + OEC): the record shows near-real-time
   dashboards AND trustworthy verdicts coexisting. Name the two
   mechanisms from this module that reconcile them (always-valid
   monitoring; trust-gated readouts) and where each appears in the
   scorecard.
