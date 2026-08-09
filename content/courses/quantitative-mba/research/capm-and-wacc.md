# Research brief: capm-and-wacc (Cost of capital: CAPM, beta, and WACC)

status: planned
module: startup-finance
type: core
goal: Estimate a discount rate — cost of equity via CAPM, cost of debt via ratings, WACC assembly — and state where the machinery breaks for startups

Where the rate comes from. Business words: cost of capital, beta,
WACC, hurdle rate. Academic layer: Sharpe 1964 (primary), ERP
estimation, bottom-up beta. Dig-deeper: Sharpe 1964; Damodaran
dcfrates; Luenberger chs. 8–9 (toc-only).

## ARC (L10)

- **Inherits:** NPV's dependence on d (previous lesson's forward
  exercise: rate errors hit long-dated projects hardest).
- **Contributes:** Spine step 14's second half: risk has a price and
  CAPM's price is covariance only — the theory (Sharpe), the
  practice (Damodaran's toolkit), and the honest boundary (startups).
- **Hands off:** WACC is the DCF's discount rate
  (valuation-multiples-and-dcf); the startup boundary sets up
  venture-economics (power-law targets replace the SML for VC).

## Sources to consult

- **Sharpe 1964 (FULL, cached capitalasset-)**:
  - Part II: mean-variance preferences (Fig 2), diversification
    bending the frontier (Fig 3), riskless asset ⇒ two-fund
    separation (Fig 4–5).
  - Part III: equilibrium ⇒ the Capital Market Line; all efficient
    portfolios perfectly correlated (footnote 20 — the hinge that
    licenses "the market portfolio").
  - Part IV: the regression decomposition (Fig 8 — systematic vs
    unsystematic risk), the first SML (Fig 9), defensive/aggressive
    closing translation (p.442).
  - Asides worth keeping: Treynor simultaneous-discovery footnote 7;
    "judge a theory by its implications, not assumptions" (p.434).
- **Damodaran dcfrates.pdf (FULL, cached nyustern-)**:
  - Riskfree rules (currency-matched, default-free) pp.30–46.
  - ERP: historical s.e. ≈ 20%/√N argument (p.49) vs implied ERP;
    country premia (3 routes) — one section at survey depth.
  - Bottom-up beta recipe pp.88–98 (unlever comparables by D/E,
    average by business, relever) with the Embraer case (0.95
    unlevered → 1.07; note the 2/3-of-country-spread judgment).
  - Synthetic ratings pp.99–106 (coverage ratio → rating → spread).
  - WACC assembly p.107–112: market weights, hybrid split
    (convertible $125M → $91.45M debt + $48.55M equity), Embraer
    9.97%.
- **Berk & DeMarzo (TOC)**: chs. 10–12 structure — the 92-year
  risk/return record framing; beta estimation practice; project
  vs firm cost of capital. Structure only.
- **Luenberger (TOC-ONLY)**: chs. 8–9 as the math-first reference
  pointer (two-fund separation theorem, CAPM derivation).
- **BVP/EMCLOUD + venture forward**: one sentence — public-SaaS
  betas exist; seed-stage ones do not.

## Key points the lesson must cover

1. **The question sharpened**: d is an opportunity cost — the return
   available elsewhere at the same risk; "same risk" needs a theory
   of which risk is paid for.
2. **The Sharpe argument in three moves** (teach the geometry, point
   to the paper): (a) diversification kills independent risk
   (frontier bends); (b) a riskless asset collapses choice to one
   tangency portfolio (two-fund separation); (c) in equilibrium that
   portfolio is the market and only covariance with it — beta — is
   priced. The SML: E[r_i] = r_f + β_i(E[r_m] − r_f).
3. **Beta as a regression slope**: total variance = β²σ_m² + residual;
   the residual diversifies away, the slope does not; defensive vs
   aggressive stocks (Sharpe's own closing translation).
4. **Practice, Damodaran-style**: riskfree (currency-matched); ERP —
   why historical estimates are noise (20%/√N: 90 years ⇒ ±2.1%) and
   implied ERP as the alternative; bottom-up beta (regression betas
   are noisy, comparable-set averaging cuts s.e. by √n); cost of debt
   via synthetic rating; WACC at market weights; the Embraer 9.97%
   worked case end to end.
5. **The startup boundary (honest close)**: no return series ⇒ no
   beta; failure risk is idiosyncratic and CAPM says idiosyncratic
   risk is FREE — yet VCs demand 30–60% "rates". Resolution: venture
   target rates are not CAPM discount rates but power-law portfolio
   arithmetic + survival-biased cash-flow correction (either discount
   EXPECTED flows at CAPM-ish rates, or promised flows at venture
   rates — never mix). Full treatment in venture-economics; here the
   boundary is drawn.

## Set pieces and worked examples to recreate

- The diversification computation: N equal-weight uncorrelated assets,
  portfolio σ ∝ 1/√N; then with common-factor correlation, the floor
  that remains — systematic risk in two lines of algebra.
- Embraer end to end (Damodaran's numbers): bottom-up beta → cost of
  equity with country premium → synthetic-rating debt cost → WACC
  9.97%.
- The ERP standard-error argument: 20%/√90 ≈ 2.1% — the risk premium
  is estimated to ± its own plausible magnitude.
- The mixing error worked: discounting promised (non-survival-
  -adjusted) startup cash flows at 12% vs expected flows at 12% vs
  promised at 45% — show the first is the common inflated-valuation
  bug.

## Pitfalls / subtleties

- CAPM's empirical record is contested (value/size anomalies) — one
  honest sentence with a pointer (Fama-French named, not taught).
- Levered vs unlevered beta: the relever formula uses target D/E;
  state it, don't derive tax-shield variants (Berk–DeMarzo ch.18
  territory — out of scope).
- Damodaran materials are DATED annually — every number cited carries
  its vintage (2026 packet).
- Do not let the lesson become a data tour: one worked case
  (Embraer), one dataset pointer.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the frontier story: risky-asset cloud,
   efficient frontier, riskless rate, tangency line (CML); two-fund
   separation labeled (recreation of Sharpe Figs 3–5 compressed to
   one panel).
2. `draw:` `<FigureSequence>` (3 frames) — diversification: frame 1
   one stock's variance; frame 2 ten uncorrelated — σ/√10; frame 3
   correlated — the systematic floor remains, labeled β²σ_m².
3. `draw:` single `<Figure>` — the SML: E[r] vs β through (0, r_f)
   and (1, E[r_m]); defensive/aggressive regions; one mispriced
   asset above the line with the arbitrage arrow.
4. `source:` **capitalasset-fig9-sml** — save as `sharpe-1964-sml`.
   Reader must see: the hand-drafted original with B_ig axis — the
   first SML ever printed. Placement: float-right beside our SML
   figure; caption: the 1964 original our redrawn version descends
   from. Historical artifact; the redraw sits alongside, not instead.
5. `draw:` single `<Figure>` — the WACC assembly diagram: equity
   (CAPM) and debt (rating spread, after tax) flowing into the
   market-value-weighted average; Embraer's numbers annotated.
6. `draw:` single `<Figure>` — the two-consistent-pairs matrix:
   {expected, promised} cash flows × {CAPM, venture} rates — two
   cells valid, two invalid, the common error cell marked (the
   startup-boundary summary object).

## EXERCISE PLAN

1. Warm-up: r_f=4%, ERP=5%, β=1.3 — cost of equity; add debt 30% of
   value at 6% pre-tax, tax 25% — WACC. (Assembly once.)
2. Boundary probe: β=0 asset with high total volatility (a biotech
   coin-flip) — CAPM says discount at r_f; explain why (who bears
   the risk in a diversified portfolio), and why a founder holding
   90% of net worth in the company rationally disagrees — the
   under-diversified-holder wedge (seeds venture-economics).
3. Claim to refute: "Our startup is risky, so discount its plan at
   60%." Show the double-count: the plan's cash flows are already
   survival-weighted (sBG!) or they are not — compute a 2-branch
   example (80% failure) both correct ways and exhibit the
   double-discount error's magnitude.
4. Derivation the lesson skipped: derive the SML from the tangency
   condition (the marginal contribution of asset i to the market
   portfolio's Sharpe ratio must be equal across assets) — the
   three-line modern proof Sharpe's footnote 22 does in 1964
   notation.
5. Research-shaped: pull Damodaran's current implied ERP series
   (cached ERPAug26 snapshot): report the latest implied ERP, the
   1979 and 1999 values, and reconcile with the historical-average
   estimate ± its standard error — which estimate moved and why it
   matters for every DCF this month.
6. FORWARD (E7): compute WACC for the course case at its planned
   Series-A capital structure, then note the DCF you'd run it in
   needs a 24-month forecast first. Solution: the forecast machine
   is the financial model (three lessons ahead) and the DCF lands in
   valuation-multiples-and-dcf; `<Ref>` financial-model,
   valuation-multiples-and-dcf.
7. Spaced (E3): beta estimation is a regression on ~60 monthly
   observations — compute the s.e. of a beta of 1.2 with R²=0.3 and
   connect to Part II's power logic: what n would halve it, and why
   bottom-up (comparable-averaged) beta is variance reduction by
   another name (Ref variance-reduction-cuped).
