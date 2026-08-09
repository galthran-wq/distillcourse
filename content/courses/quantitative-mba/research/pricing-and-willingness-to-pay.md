# Research brief: pricing-and-willingness-to-pay (Pricing and willingness-to-pay)

status: planned
module: unit-economics
type: core
goal: Estimate an acceptable price range from Van Westendorp survey data and connect price to churn, expansion, and margin

Business words: pricing, willingness-to-pay, tiers. Academic layer: Van
Westendorp PSM (primary source, 1976, read in full with transcribed data);
the WTP elicitation ladder and price discrimination (Monetizing Innovation
— TOC-ONLY, pointer depth); elasticity arithmetic. Dig-deeper: Monetizing
Innovation; conjoint literature (hierarchical logit named as the reader's
statistical territory, not taught here).

## ARC (L10)

- **Inherits:** Contribution margin (margins-and-the-unit-pnl) and the
  revenue ledger (mrr-nrr-and-negative-churn): price changes land in
  expansion/contraction/churn, not just per-unit revenue.
- **Contributes:** Spine step 3's close: "a willingness-to-pay curve
  measured on 269 Dutch razor buyers" — WTP as a measurable distribution;
  PSM curves and their crossings; elasticity connecting price to volume;
  tiering as price discrimination on the WTP distribution.
- **Hands off:** Step 4 turns to metric systems; pricing returns in Part
  III (auctions/bidding) and Part IV (valuation) — one sentence.

## Sources to consult

- **Van Westendorp 1976** (nssprice.txt + nssprice-appendix-data.txt, full
  transcription of the electric-razor tables):
  - The four questions and the two scale orderings; 25–40 price steps;
    impossible-answer correction (~few % of respondents).
  - Definitions: IDP (cheap × expensive crossing; razors Dfl. 88.50 @14%),
    OPP (too-cheap × too-expensive; Dfl. 72.50 @4%), MGP/MDP and the range
    of acceptable prices (Dfl. 52.50–122.50); Table 4 as the "PSM output
    card".
  - Table 3: the psychological threshold — cumulative "expensive" jumps
    20%→40% across Dfl. 95→100 vs ±5-6pt neighboring steps.
  - Table 1: IDP tracks market anchors (median paid price / leading brand).
  - Table 7 + section F: the frozen IDP under inflation (Sinas lemonade,
    Dfl. 0.98 in 1973 AND 1975 vs cost-adjusted 1.27; price-raisers lost
    share).
  - Table 10: bundle value analysis (63/37 split matching an independent
    constant-sum question).
  - The author's own hedges (perceptual not behavioral; no significance
    tests; IDP ≠ propensity to buy) — quote the "word of warning".
- **Monetizing Innovation** (TOC-only — flag every use): Ch.4 WTP
  elicitation ladder (direct → purchase probability → most/least conjoint →
  build-your-own → purchase simulation); Ch.1-2 failure taxonomy (Feature
  Shock/Minivation/Hidden Gem/Undead; 72% stat); Ch.6 Good/Better/Best
  (~25-30% entry tier; compromise effect) and the pizza-bundling
  arithmetic ($3,300 vs $4,400); Gillette India (design-to-price). All
  secondary-sourced until the human buys the book — keep to pointer depth,
  no invented page cites.
- **Skok / module context** — price ↔ NRR: expansion is priced-in upsell;
  price rises flow through churn (elasticity in retention space).

## Key points the lesson must cover

1. **WTP is a distribution, not a number**: across customers (heterogeneity
   again — the module 1 theme in price space). Price picks a point on the
   demand curve implied by that distribution; revenue = p·D(p); margin
   enters via m(p) = (p − unit cost)·D(p).
2. **PSM mechanics, fully worked** on the razor data: build all four
   cumulative curves from the transcribed appendix table; locate
   IDP/OPP/MGP/MDP; state what each crossing means and the paper's own
   caveats (perceptual, no significance theory).
3. **Thresholds are real**: the Dfl. 95→100 doubling step; charm-price
   implications stated dryly (the $9.99 cliff is the same object —
   Monetizing Innovation Ch.11 pointer).
4. **The elicitation ladder**: what PSM can and cannot answer; when you
   need conjoint/purchase simulation (the reader's hierarchical-logit
   territory — name it, point, move on).
5. **Price in the unit system**: a price change re-prices margin (up),
   volume (down via elasticity), churn/NRR (retention elasticity), and
   CAC tolerance. One worked pass: +10% price with −3pt retention on the
   running case — net CLV effect computed. Tiers as second-degree price
   discrimination on the WTP distribution; Good/Better/Best shares.

## Set pieces and worked examples to recreate

- **The four-curve razor chart, rebuilt from data** (the transcribed
  appendix): our own interactive-quality figure; the 1976 originals shipped
  as artifacts beside it.
- **The PSM output card** (Table 4 style): IDP/OPP/MGP/MDP/range as a
  reusable template the exercises fill in for a second product.
- **Sinas frozen IDP** (1973 vs 1975 vs cost-adjusted): perception lags
  inflation; brands that repriced lost share — a pricing-power episode in
  three numbers.
- **Bundle split validation** (Table 10): PSM 63/37 vs constant-sum
  6.3/3.7 — two methods agreeing as a validity argument.
- **The +10%-price worked pass** on the running case (constructed):
  margin, volume, churn, CLV, NRR each recomputed.

## Pitfalls / subtleties to flag

- PSM measures price PERCEPTION, not purchase behavior — the inventor says
  so; do not oversell (his own words are the guardrail).
- OPP ≤ IDP in all the paper's product data; the income exception (Table
  6) shows the method transferring domains — starred aside at most.
- Monetizing Innovation numbers (72%, pizza arithmetic) are
  secondary-sourced: mark in prose as "reported", cite in References with
  the access caveat; re-verify when the book is bought.
- Elasticity here is arc/local arithmetic, not econometric estimation —
  estimating it properly needs the experiments of module 3 (say so; this
  is a seam the course exploits later with incrementality).
- No conjoint mechanics: naming the model family is the scope.

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (4 frames) — **building the PSM chart**:
   frame 1 the four questions asked at one price; frame 2 cumulative
   "cheap"/"expensive" curves drawn from the razor data; frame 3 their
   crossing = IDP (Dfl. 88.50); frame 4 the other pair added, OPP and the
   acceptable range bracketed. Recreated from transcribed data (idea:
   Appendix figs 1→5).
2. `source:` **nssprice-fig1-electric-razors-cross** — save as
   `psm-1976-idp-original`. Reader must see: the 1976 typeset plot, the
   crossing annotation at 14%/Dfl. 88.50. Placement: float-right beside
   the IDP definition; caption: the founding chart of the method, ESOMAR
   1976 — the redraw next to it is ours, this is his.
3. `source:` **nssprice-fig5-composite-full** — save as
   `psm-1976-composite-original`. Reader must see: all four curves with
   IDP/OPP/MGP/MDP marked and the range bracketed. Placement: centered at
   the section assembling the full picture; pairs with our rebuilt
   version.
4. `draw:` single `<Figure>` — **the threshold step**: cumulative
   "expensive" around Dfl. 90–105 with the 20→40% jump at 100 highlighted
   vs the ±5pt neighbor steps (Table 3 data).
5. `draw:` single `<Figure>` — **WTP distribution → demand curve → tiers**:
   one WTP density with three tier prices cutting it into segments;
   captured revenue shaded per tier vs single-price revenue tally (idea:
   Good/Better/Best + second-degree discrimination).
6. `draw:` single `<Figure>` — **price through the unit system**: the +10%
   worked pass as a small flow — price → margin↑, volume↓, churn↑ → CLV/
   NRR net effect with the running case numbers.

## EXERCISE PLAN

1. Warm-up: from a 6-price transcribed slice of the razor "expensive" and
   "cheap" cumulative data, locate the IDP by linear interpolation.
2. Boundary probe: a product where the "too cheap" curve is ~0 everywhere
   (no quality inference — e.g., a commodity API): show OPP degenerates to
   the too-expensive curve's toe and the "range of acceptable prices"
   loses its lower edge — which of the four questions carried the
   information, and why it fails for commodities?
3. Claim to refute: "PSM says the optimal price is Dfl. 72.50, so pricing
   at 88.50 leaves money on the table." Refute with the paper's own
   caveats: OPP is minimum RESISTANCE, not maximum profit; no volume or
   margin enters PSM; compute a margin-weighted counterexample where the
   profit-maximizing price sits above IDP.
4. Derivation the lesson skipped: from a linear demand D(p) = a − bp and
   unit cost c, derive p* = (a/b + c)/2 and elasticity at p*; show why
   high-margin software pushes p* toward the WTP distribution's upper
   mass, not its mode.
5. Research-shaped: rebuild all four cumulative curves from
   nssprice-appendix-data.txt and verify IDP = 88.50 @14% and OPP = 72.50
   @4%; report the crossing coordinates you get and the interpolation
   choice that moves them.
6. FORWARD (E7): the +10% price test cannot be judged from the ledger
   alone — design (in three sentences) the experiment that would measure
   the churn response, naming assignment unit and the metric to read.
   Solution: that is a controlled experiment with retention as OEC —
   `<Ref>` ab-tests-and-randomization (and note pricing tests' interference
   risks, `<Ref>` experiment-pathologies).
7. Spaced (E3, module 1): the WTP distribution is heterogeneity in price
   space — write the parallel: Beta over churn θ (sBG) ↔ distribution over
   reservation price; state what "sorting" corresponds to after a price
   rise (price-sensitive customers churn first, measured churn falls over
   time at the new price).
