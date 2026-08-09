# Research brief: seo-and-content-economics (SEO and content as an amortizable asset)

status: planned
module: growth-channels
type: core
goal: Compute the value of a content portfolio as depreciating capital — perpetual-inventory stock, decay rate, and portfolio NPV

COURSE-ORIGINAL SYNTHESIS — flagged as such in prose. No canonical
"SEO NPV" source exists; the lesson adapts fully-read machinery:
Peters & Taylor's intangible-capital capitalization, Broadbent's decay,
Part I's CLV/discounting. Business words: SEO, content marketing,
compounding channel. Academic layer: perpetual inventory, depreciation
estimation, portfolio NPV under skew.

## ARC (L10)

- **Inherits:** adstock's geometric-decay recursion (media-mix-modeling)
  and the discount machinery running since CLV; Bullseye's channel map
  (SEO/content = compounding channels).
- **Contributes:** Spine step 12's third move: content spend is
  investment in a decaying stock, valued by NPV — with honestly
  uncertain decay rates and skewed article-level outcomes making the
  portfolio the unit of account.
- **Hands off:** channel-portfolio (a compounding channel's marginal
  economics differ from paid — allocation must compare NPV per dollar,
  not period ROAS); Part IV's npv-and-irr formally names the rule used
  here; financial-model (content spend as a capitalizable driver line —
  and the books' refusal to capitalize it).

## Sources to consult

- **Peters & Taylor 2017 (FULL, cached)** — the machinery:
  - §1.2 eq.3: G_t = (1−δ)G_{t−1} + spend_t; δ=15% (R&D), 20% (org
    capital from 20%-of-SG&A) — the literature's conventions.
  - Fig 1: intangible intensity 27%→47% of total capital (the "books
    undercount capital" motivation).
  - Appendix A: the initial-stock boundary method (pre-window
    investment estimated from cohort growth rates) — transfers to
    "value a content library mid-life".
  - The 20%-of-SG&A judgment call + robustness (0–40%) — "not all
    content spend is an asset" carries over verbatim.
- **Ewens, Peters & Wang 2019 (read alongside)** — real depreciation
  rates from 1,521 purchase-price allocations: R&D δ ≈ 32% avg, 25–49%
  by industry; only 28% of SG&A is true investment. The ×2 parameter
  uncertainty that mandates sensitivity analysis.
- **Broadbent 1979** — decay measured on awareness: modal half-life 5
  weeks for ads; contrast with content (much slower) — the point is
  the SAME recursion at different δ; his half-life convention reused.
- **Traction ch.1 blurbs + ch.3** — SEO/content as channels; Marketo's
  pre-product SEO blog (14,000-buyer pipeline) as the canonical
  content-asset anecdote; stair-step compounding.
- **Peters & Taylor caveat para**: GAAP (ASC 350-50/730) expenses
  content/marketing — the lesson's model is economic, not accounting;
  the wework/pnl lessons show what books do instead.

## Key points the lesson must cover

1. **The flow/stock distinction**: paid traffic is a flow (stops with
   spend); content/SEO accrue to a stock (article inventory, domain
   authority) yielding traffic — the stair-step signature; Mint's
   19-channel map tags which channels compound.
2. **The recursion**: G_t = (1−δ)G_{t−1} + I_t — literally adstock at
   asset scale; half-life reporting; the initial-stock problem for an
   existing library (Appendix-A method).
3. **Decay is uncertain ×2**: assumed 15–20% vs transaction-implied
   25–49% for R&D-like assets; content decay must be measured per
   portfolio (traffic decay curves per article vintage — a cohort
   matrix of articles! the Part I object returns with articles as
   customers).
4. **Article NPV and the portfolio**: article = upfront cost C, traffic
   y_t = y₀(1−δ)^t, value = y_t × conversion × CLV·GM; NPV computed;
   rank outcomes are heavily skewed (a few articles carry the traffic)
   — expected value lives in the tail, so the portfolio, not the
   article, is the decision unit (echoes venture-economics forward).
5. **The honest disagreement with the books**: GAAP expenses all of it;
   the P&L of a content-heavy company understates its asset build —
   the Peters-Taylor argument, applied. The lesson SAYS it is a
   synthesis; the model's value is decisions (budgeting, channel
   comparison), not reporting.

## Set pieces and worked examples to recreate

- The article-cohort matrix: articles-by-publication-quarter × age,
  traffic per cell — Part I's cohort matrix rebuilt for content;
  decay rate fitted like a retention curve.
- Worked portfolio: 40 articles at $1,500 each, y₀ distribution skewed
  (80/20), δ=25%/yr, conversion 1.5%, CLV·GM $400 — portfolio NPV at
  10% discount vs the same $60k in paid at CAC $50 (the honest
  comparison paid-vs-compounding).
- Peters-Taylor Fig 1 read: intangibles ~half of capital — why this
  matters beyond marketing (bridge to Part IV valuation: the market
  prices assets the books omit).
- Marketo pre-launch pipeline anecdote (2 sentences, from Traction
  ch.3 — full text read).

## Pitfalls / subtleties

- COURSE-ORIGINAL: no external authority for "SEO NPV" — every
  formula must be derived in-lesson from cited machinery; do not
  invent citations.
- Content ≠ SEO: content is the asset, search ranking the yield
  mechanism; algorithm updates are the platform risk (repricing δ
  overnight — forward pointer to channel-portfolio/platform-risk).
- Survivorship in decay estimates: dead articles leave the sample —
  censoring again (Ref retention-and-survival).
- Do NOT overstate compounding: domain-level decay events (algorithm
  updates) are common-shock risk, not independent article decay.

## FIGURE PLAN

1. `draw:` single `<Figure>` — flow vs stock: two panels — paid channel
   (traffic tracks spend, stops at zero) vs content channel (traffic =
   yield on accumulating, decaying stock; spend stops, traffic decays
   from a height).
2. `draw:` `<FigureSequence>` (4 frames) — the recursion at work:
   frame 1 one article's traffic decay; frame 2 monthly publication
   stacking cohorts; frame 3 the summed stair-step total; frame 4
   spend halts at month 12, stock decays. One change per frame.
3. `draw:` single `<Figure>` — the article cohort matrix: rows =
   publication quarter, columns = age, cell shade = traffic; the
   diagonal censoring edge visible — deliberately identical layout to
   Part I's cohort matrix figure.
4. `draw:` single `<Figure>` — decay-rate uncertainty: NPV of the
   worked portfolio as a function of δ over 15–49%, with the
   literature's assumed (15/20%) and transaction-implied (32%) rates
   marked; the ×2 uncertainty band shaded.
5. `source:` **gapno-fig1-intangible-intensity** — save as
   `intangible-capital-intensity`. Reader must see: the measured rise
   of intangible share 27%→47% (all firms) with the High-tech series
   above 60%. Placement: float-right beside the "books undercount
   capital" section. Published measured series; a redraw would fake
   the data.
6. `draw:` single `<Figure>` — portfolio skew: sorted per-article NPV
   bars (few large positive, long tail near −C), the portfolio sum
   line — expected value in the tail.

## EXERCISE PLAN

1. Warm-up: compute the content stock G_t over 8 quarters at δ=6%/qtr
   with spend 10/qtr, and the half-life implied. (Recursion once.)
2. Boundary probe: δ→0 (evergreen content, no decay) — portfolio NPV
   diverges as horizon grows; name what actually bounds it (traffic
   ceiling = keyword volume — a saturation cap, Ref hill-saturation)
   and re-derive NPV with a volume cap.
3. Claim to refute: "Content is free growth — after the article is
   paid for, traffic costs nothing." Compute the maintenance reality:
   at δ=25%, the spend needed to HOLD the stock constant is 25% of
   the stock per year — content has an ongoing capital charge; name
   the analogous line in Part IV's statements (depreciation).
4. Derivation the lesson skipped: derive steady-state traffic under
   constant publishing I per period: G_∞ = I/δ, and the NPV of the
   infinite program; show the program's IRR condition in terms of
   (y₀ × conversion × CLV·GM)/C and δ.
5. Research-shaped: reproduce Ewens-Peters-Wang's headline: from their
   reported 32% avg R&D depreciation vs the assumed 15%, compute how
   much a 15%-δ valuation overstates a content stock built by equal
   spend over 5 years (ratio of G under each δ); state which side the
   error favors when pitching content budgets.
6. FORWARD (E7): compare $60k into content (portfolio NPV from the
   worked example) with $60k into paid at current mROAS from the MMM
   lesson's fitted curve. The comparison requires putting both on
   NPV-per-marginal-dollar terms. Solution: this common currency is
   exactly how channel-portfolio allocates, and the discounting rule
   gets its formal treatment in npv-and-irr; `<Ref>` channel-portfolio,
   npv-and-irr.
7. Spaced (E3): the article-vintage decay estimate is a censored
   survival problem — write which cells of the article cohort matrix
   are censored and how Kaplan–Meier would combine vintages (Ref
   retention-and-survival).
