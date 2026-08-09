# Research brief: valuation-multiples-and-dcf (Valuation: ARR multiples, Rule of 40, and DCF)

status: planned
module: startup-finance
type: core
goal: Evaluate a SaaS company's value two ways — market multiples conditioned on growth, margin, and retention, and a driver-model DCF — and reconcile the gap

The loop closes: metrics → price. Business words: multiple, ARR
multiple, Rule of 40, DCF, terminal value. Academic layer: a multiple
as a compressed DCF; conditioning on fundamentals; live-data
discipline. Dig-deeper: Damodaran packets; BVP Cloud Index (live).

## ARC (L10)

- **Inherits:** WACC (the DCF's rate), the driver model (the DCF's
  forecast), NRR/margin/growth (the conditioning variables — Part I),
  venture-economics (the investor's required outcome).
- **Contributes:** Spine step 18's second half: multiples as
  compressed DCFs, the cross-section that prices growth/margin/
  retention (Rule of 40/X verified on live data), the 13-year
  compression history that makes dating mandatory, and the DCF built
  on the course's own model — reconciled.
- **Hands off:** the capstone runs both methods on the case and
  defends the reconciliation.

## Sources to consult

- **BVP Nasdaq Emerging Cloud Index (LIVE; snapshot 2026-08-08
  cached bvpnasdaq-live-data.json + summary)**:
  - 64 constituents; total cap ~$2.4T; avg EV/LTM 7.9×, forward
    6.6×; avg growth 19.7% (snapshot-dated — RE-FETCH near
    publication; the lesson must date every number).
  - The 25× intra-index spread: Palantir 34.7× forward vs Weave
    1.3× — "the SaaS multiple" does not exist.
  - THE compression series (UI-hidden weekly quartiles): median
    ~4.75–4.8× (2013) → 15.95× median / 24.55× top-quartile
    (2021-02-10) → 4.38× / 7.12× (2026-08-07) — the full round trip.
  - Efficiency Score = growth% + FCF margin% (reverse-engineered,
    verified on all 64 rows) = Rule of 40 as a continuous score;
    hidden ruleOfX = 2×growth + margin — the market's ~2:1 growth
    weighting; Palantir 136.2 vs 229.0 as the divergence example.
  - Extremes for the same-day contrast: PLTR (92.8% growth, 43.4%
    FCF margin) vs AI/C3.ai (−52.5% growth, −93.1% margin).
  - FCF definition on the page: CFO − capex.
- **Damodaran (FULL, cached nyustern-)**:
  - valpacket2: the multiples discipline — define consistently /
    describe the distribution / analyze drivers / apply to true
    comparables; ~85% of equity research is multiples; the Whole
    Foods multi-year regression case as the method template.
  - valpacket1: DCF anatomy (cash flows, growth, terminal value,
    narrative-to-numbers); the "impossible/implausible/improbable"
    narrative check; terminal value dominance.
  - dcfrates: WACC inputs (previous lesson's machinery, cited not
    re-taught).
  - The Ginzu spreadsheet as the deployed instance (one pointer).
- **Financial-model lesson (internal)** — the 24-month model extended
  to a 5-year FCF sketch for the DCF; state the extension's
  assumptions explicitly (post-model growth fade, margin target).
- **Venture-economics (internal)** — the investor's entry-price
  arithmetic meeting the company's valuation — the term-sheet
  moment.

## Key points the lesson must cover

1. **A multiple is a compressed DCF**: derive EV/ARR from a
   constant-growth FCF perpetuity — multiple = f(growth, margin,
   retention, rate); every "comp" smuggles a DCF's assumptions;
   conditioning is therefore mandatory (comps must match on the
   drivers, not the sector label).
2. **The cross-section, live**: the EMCLOUD snapshot — the 25×
   spread; Rule of 40 as the industry's linear score and Rule of X's
   2:1 growth weighting (both verified against the cached data);
   what the market pays for a point of growth vs margin — with the
   dating discipline (every number carries its as-of).
3. **Compression history**: the 4.8→16→4.4 round trip; multiples
   are macro-dependent (rates!) — the same company at three dates is
   three prices; never let a comp's vintage differ from the
   valuation's.
4. **The DCF on our model**: driver model → 5-year FCF → WACC →
   terminal value (Gordon with faded growth AND exit-multiple
   cross-check); terminal value's share of total (usually >60%) —
   the honesty requirement; Damodaran's narrative discipline (the
   numbers must tell one story).
5. **Reconciliation**: when multiple and DCF disagree, itemize —
   (a) forecast vs market's implied growth; (b) rate; (c) terminal
   assumptions; (d) the market being wrong is a claim that needs a
   reason. The gap is information; the lesson's protocol extracts
   it.

## Set pieces and worked examples to recreate

- The compression chart from the cached weekly series (median +
  quartile band, 2013–2026) — the lesson's centerpiece, OUR chart
  from the hidden data.
- The conditioning table: 6–8 named EMCLOUD constituents (dated)
  with growth/margin/NRR-proxy and multiples — fit the crude
  cross-sectional line multiple ≈ a + b·(Rule of X) and read b.
- The derivation: EV/Revenue = margin×(1+g)/(WACC−g) for the
  perpetuity case — three lines, then its failure modes (g near
  WACC).
- The case DCF end to end: model FCF, fade to 15% growth, 25% FCF
  margin at maturity, WACC from lesson 2, TV both ways — EV range;
  vs the dated comp multiple — reconcile.
- PLTR vs C3.ai same-day contrast as the "fundamentals price
  multiples" bookend.

## Pitfalls / subtleties

- LIVE DATA: every EMCLOUD number is a dated snapshot; the lesson
  text must show the as-of date and instruct re-fetching; the
  Efficiency/ruleOfX formulas are reverse-engineered (verified
  algebraically) — say so, since the site never defines them.
- EV vs equity value, ARR vs GAAP revenue — two definitional traps;
  one paragraph each with the correction.
- Terminal value: Gordon requires g < WACC; the exit-multiple TV
  reintroduces comps into the DCF — circularity acknowledged and
  managed (use both, report the spread).
- Private-company discounts (illiquidity, preference stacks) — the
  bridge sentence to the capstone; not a detour.
- Rule of 40 is a cross-sectional regularity, not a law — refute
  the threshold reading (a 39 is not a failing grade).

## FIGURE PLAN

1. `draw:` single `<Figure>` — the compression chart: EMCLOUD median
   EV/rev with interquartile band, 2013–2026, peak (16×, Feb 2021)
   and current (4.4×) annotated, as-of date stamped — from the
   cached weekly series.
2. `draw:` single `<Figure>` — the cross-section: dated scatter of
   ~10 constituents, Rule-of-X score vs forward multiple, crude fit
   line; PLTR and C3.ai labeled at the extremes.
3. `draw:` `<FigureSequence>` (3 frames) — multiple = compressed
   DCF: frame 1 the FCF perpetuity; frame 2 divide by revenue —
   the multiple formula appears; frame 3 the three dials (g, margin,
   WACC) moving the multiple. One transformation per frame.
4. `draw:` single `<Figure>` — DCF anatomy bar: PV of years 1–5 vs
   terminal value as stacked components of EV (TV share ~60–70%
   visible); the two TV methods' range as an error bar.
5. `draw:` single `<Figure>` — the reconciliation ladder: DCF value
   → adjust to market-implied growth → adjust rate → adjust TV →
   comp value; each rung labeled with the assumption that moves it
   — the lesson's protocol as a diagram.

## EXERCISE PLAN

1. Warm-up: margin 25%, growth 12% fading, WACC 9% — compute the
   perpetuity-implied EV/revenue; compare with the current (dated)
   EMCLOUD median. (The derivation once.)
2. Boundary probe: push g → WACC in the Gordon formula — the
   multiple diverges; compute the multiple at g = 8.9% vs 8.5%
   (WACC 9%) to see the explosion, and state the modeling rule
   (fade growth below the rate before the terminal year, or the TV
   is an artifact).
3. Claim to refute: "SaaS companies trade at 10× ARR" (heard in
   2021). Use the compression series: date the claim, show the
   median at three dates, and compute the valuation error from
   using a 2021 comp in 2026 on the course case.
4. Derivation the lesson skipped: from EV = m·R·(1+g)/(WACC−g),
   derive d(multiple)/dg and d(multiple)/dm at the current-median
   point and compute the implied growth:margin dollar exchange rate
   — compare with Rule of X's 2:1 and reconcile.
5. Research-shaped: re-fetch (or use the cached snapshot of) the
   EMCLOUD constituent table; verify Efficiency Score = growth +
   FCF margin on five rows; fit the crude multiple-vs-ruleOfX line
   and report its R² — how much of the cross-section fundamentals
   explain today.
6. FORWARD (E7): value the course case both ways (comp multiple at
   the dated median conditioned on its Rule-of-X percentile; DCF
   from the model) and write the three-line reconciliation.
   Solution: this is the capstone's final section performed once at
   half scale; `<Ref>` course-capstone.
7. Spaced (E3): NRR enters the multiple through g's durability —
   using Part I's negative-churn compounding (Ref
   mrr-nrr-and-negative-churn), show two companies with equal
   headline growth but NRR 95% vs 120% deserve different multiples,
   and estimate the gap via the perpetuity formula's g.
