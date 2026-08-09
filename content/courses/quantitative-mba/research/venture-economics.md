# Research brief: venture-economics (Venture economics: the power law and the Kelly criterion)

status: planned
module: startup-finance
type: core
goal: Explain investor behavior from the power-law return distribution — fund arithmetic, portfolio expectation, and Kelly sizing

Why investors act the way they act, derived from the distribution.
Business words: fund, carry, TVPI/DPI/IRR, "return the fund". Academic
layer: power-law/heavy-tail portfolio math; Kelly 1956. Dig-deeper:
Dixon/a16z (Horsley Bridge data); Kelly 1956; Easley–Kleinberg ch.18.

## ARC (L10)

- **Inherits:** the waterfall (an investor's payoff per company is a
  preference-floored, participation-shaped claim), real-options'
  staging read, and the burn lesson's footnote-3 misalignment tease.
- **Contributes:** Spine step 18's first half: the return
  distribution is the explanation — fund arithmetic (why each check
  must be able to return the fund), the Babe Ruth data (magnitude
  beats batting average; best funds strike out MORE), structural
  founder–investor misalignment, and Kelly sizing (why over-betting
  positive-EV portfolios ruins).
- **Hands off:** valuation (what the power law implies for entry
  prices and ownership targets) and the capstone's term-sheet
  verdict.

## Sources to consult

- **Dixon/a16z Babe Ruth essay (FULL, cached; 4 chart captures)**:
  - Headline concentration: ~6% of investments (4.5% of dollars) →
    ~60% of returns (Horsley Bridge, hundreds of funds since 1985).
  - Home-run frequency rises with fund quality (<1% → ~18–19% of
    deals >10×); magnitude JUMPS for the best funds (~20× → ~70×) —
    the elbow, not the slope.
  - THE U-shape: loss rates by fund bucket 74% → ~35–39% → ~44–45%
    (count- and dollar-weighted twins) — great funds lose MORE often
    than good funds.
  - Thiel and Gurley pull-quotes; loss-aversion framing.
- **Kelly 1956 (FULL, cached anew-)**:
  - The criterion: maximize E[log wealth] under reinvestment;
    even-money case ℓ* = q − p = edge; G_max = channel-capacity
    identity (one sentence of the information-theory reading, no
    more).
  - Bet-it-all maximizes E[wealth] AND ruins a.s. — the
    mean-vs-growth distinction (the lesson's sharpest tool).
  - The gambler's-wife caveat: no reinvestment ⇒ maximize plain EV —
    scope honesty; VC is BETWEEN the regimes (fund-level
    reinvestment across vintages, deal-level one-shot).
  - Track-take result: negative-EV bets can enter an optimal
    portfolio — the portfolio-vs-bet-level optimality point.
- **Easley–Kleinberg ch.18 (FULL)** — power-law mechanics register:
  log-log diagnostics, rich-get-richer generative story (one
  paragraph on WHY startup outcomes are heavy-tailed: preferential
  attachment in markets/network effects); the Salganik Music-Lab
  unpredictability experiment as the "you cannot pick the winners
  ex ante" evidence — one aside.
- **PG fn.3 (backward)** — kill-or-cure portfolio rationality.
- **Fund mechanics** (no single canon source — standard institutional
  facts kept generic): 2/20, 10-year fund, ~3× gross ≈ 20%+ IRR
  target, reserves/follow-ons, TVPI/DPI/IRR definitions. Flag as
  industry-standard conventions, not citations.

## Key points the lesson must cover

1. **The data first**: the four Horsley Bridge charts read carefully
   — concentration, frequency, the magnitude elbow, the U-shape; the
   claim they force: portfolio outcomes are decided by the tail's
   SIZE, not the hit rate.
2. **Fund arithmetic**: fees drag ~15–20% of committed capital;
   3× gross over 10 years; with power-law outcomes, E[fund] is
   dominated by P(≥1 outlier) × outlier size ⇒ every check must
   plausibly return the fund ⇒ ownership targets (10–20%), stage
   discipline, and the pass on "good but capped" businesses — the
   behavior derived, not asserted.
3. **The misalignment theorem**: a diversified fund's optimal risk
   on any single company exceeds the underdiversified founder's
   (fn.3 + the equity-holders-love-variance result from the options
   lesson) — kill-or-cure is portfolio-rational; founders should
   understand, not resent, and negotiate accordingly.
4. **Kelly**: the criterion derived in the even-money case (edge =
   fraction); over-betting ruins despite positive EV (bet-it-all
   example); fractional Kelly under estimation error and skew;
   reserves/follow-on sizing as the venture instance; the
   gambler's-wife boundary (when plain EV is right).
5. **What the LP sees**: TVPI/DPI/IRR defined; vintage dispersion —
   median fund mediocre, top-decile persistent-ish; reading a fund's
   numbers against the distribution (a 2× TVPI fund with no outlier
   is dead money awaiting DPI).

## Set pieces and worked examples to recreate

- The fund model: $100M fund, 25 checks of $2–6M, power-law outcome
  draws (calibrated to the Horsley Bridge shares: 6% of deals → 60%
  of value) — simulate/aggregate to show P(3× fund) as a function
  of ownership and tail exposure; the "return the fund" table
  (exit needed at 10% vs 20% ownership).
- The U-shape explained BY the model: condition on a fund catching
  an outlier — its optimal residual portfolio is more aggressive ⇒
  more zeros; the shape reproduced qualitatively.
- Kelly worked: p=0.6 even-money — ℓ*=0.2; growth curves at
  ℓ = 0.1/0.2/0.4/1.0 over 100 bets (over-betting's ruin visible);
  then the venture translation (check size as ℓ against fund).
- The waterfall tie-in: the SAME exit distribution passed through
  1× preference vs common — the investor's realized distribution is
  floored; expected-value gap = the preference's worth (closing the
  waterfall lesson's exercise 7).

## Pitfalls / subtleties

- Horsley Bridge data is aggregated and survivor-tilted (funds an
  LP chose); the charts carry no error bars — state provenance,
  keep claims qualitative-plus-two-numbers.
- Kelly assumes known edge and reinvestment; venture edges are
  estimated and illiquid — fractional Kelly and the gambler's-wife
  caveat are the honest bridges; do NOT present Kelly as a VC
  sizing formula, present it as the reason over-concentration
  ruins.
- Power law vs lognormal: the diagnostics can't separate them in
  25-observation funds — one honest sentence; the operational
  content (tail dominance) survives either.
- Do not moralize the misalignment — derive it and state the
  negotiation consequence (protective provisions, option pools,
  secondary sales).

## FIGURE PLAN

1. `draw:` single `<Figure>` — the distribution: sorted per-deal
   outcome bars for a stylized 25-company fund (many zeros, a few
   1–3×, one 70×) with the cumulative-value line — 6%→60% visible.
2. `source:` **performanced-strikeouts-count** — save as
   `babe-ruth-u-shape`. Reader must see: the U — loss rate falling
   then RISING with fund quality. Placement: centered in the data
   section. Measured LP data; the counterintuitive shape is the
   evidence itself.
3. `source:` **performanced-homerun-magnitude** — save as
   `babe-ruth-magnitude-elbow`. Reader must see: flat ~20× then the
   jump to ~70× in the best bucket. Placement: beside the magnitude
   paragraph; the elbow is the claim.
4. `draw:` single `<Figure>` — return-the-fund arithmetic: for a
   $100M fund, required exit value vs ownership % (hyperbola
   $100M/x) with 10%/15%/20% markers — the ownership-target chart.
5. `draw:` `<FigureSequence>` (3 frames) — Kelly: frame 1 one
   even-money bet's EV vs log-growth; frame 2 wealth paths at
   ℓ = 0.2 (Kelly) vs 1.0 (ruin) over 100 bets; frame 3 the growth-
   rate-vs-ℓ curve, maximum at the edge, negative beyond — one
   object per frame.
6. `draw:` single `<Figure>` — the misalignment: expected payoff vs
   strategy risk for the fund (rising — call-like, diversified) and
   the founder (humped — concentrated, preference-capped); the
   argmax gap labeled (uses the options lesson's variance result).

## EXERCISE PLAN

1. Warm-up: a $60M fund owns 12% of a company at exit — what exit
   value returns the fund? Repeat at 20% ownership and for a $400M
   fund. (The hyperbola once.)
2. Boundary probe: replace the power-law outcome with a uniform
   2–4× distribution (a "good business" world) — show the optimal
   portfolio flips to many small checks, batting average now
   matters, and the VC behaviors derived in the lesson (ownership
   targets, kill-or-cure) become irrational; the distribution IS
   the strategy.
3. Claim to refute: "The best funds pick better, so they lose less
   often." The U-shape says otherwise — reconstruct the selection
   logic (aggressive risk posture ⇒ more zeros AND more 70×) and
   name the statistic that improves with quality (tail magnitude,
   not loss rate).
4. Derivation the lesson skipped: derive ℓ* = 2q − 1 for even-money
   Kelly from d/dℓ E[log W] = 0, and the ruin claim for ℓ=1 (one
   loss zeroes the log); then the fractional-Kelly variance
   argument in two lines.
5. Research-shaped: from the four cached Horsley Bridge charts'
   printed values, reconstruct the implied per-bucket return
   decomposition (loss share × ~0 + mid share × mid multiple + HR
   share × HR multiple) for the <1× and ≥5× buckets and verify the
   ≥5× bucket's arithmetic actually clears 5× — a consistency check
   on the essay's own numbers.
6. FORWARD (E7): the fund's entry price for the course case's round:
   at a target 15% ownership and required-exit $500M, back out the
   maximum post-money it can pay under a 10× target multiple.
   Solution: this is a valuation from the investor side — the
   multiple/DCF machinery from the company side is the next lesson,
   and the two meet at the term sheet; `<Ref>`
   valuation-multiples-and-dcf.
7. Spaced (E3): pass the burn lesson's Monte Carlo exit distribution
   through the waterfall (Ref
   liquidation-preferences-and-waterfall): compute the fund's
   expected multiple with and without its 1× preference and report
   the preference's expected-value worth — the deal term priced by
   simulation.
