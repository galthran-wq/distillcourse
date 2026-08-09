# Research brief: roas-and-max-bid (ROAS, target CPA, and the maximum bid from CLV)

status: planned
module: growth-channels
type: core
goal: Derive the maximum affordable bid and target CPA from the course's CLV model and payback constraint, and connect ROAS targets to contribution margin

The spiral lesson that welds Part III to Part I: the bid is a
unit-economics output. Business words: ROAS, tROAS/tCPA, max bid.
Academic layer: none new — composition of existing models; the point IS
the composition. Dig-deeper: Skok (paid-CAC discipline), Balseiro–Gur
(where v enters the bid).

## ARC (L10)

- **Inherits:** bid = v/(1+μ) with v unopened (bidding-and-pacing);
  CLV = Σ m·S(t)/(1+d)^t and residual-value logic (Part I); payback as
  the liquidity cap (payback-and-the-cash-trough).
- **Contributes:** Spine step 10's close: the CLV model IS the bid. The
  conversion chain CPC→CPA→CAC run backwards from customer value to a
  per-click number; ROAS translated into margin-and-time-honest targets.
- **Hands off:** Per-channel spend now has a value model; measuring
  whether the channel DELIVERS that value at scale is the next two
  lessons (MMM, attribution/incrementality).

## Sources to consult

- **Part I internal**: churn-and-the-sbg-model (fitted S(t)),
  customer-lifetime-value (CLV/RLV, the m/c bias direction),
  cac-and-ltv-cac (blended vs paid CAC; the >3 folklore),
  payback-and-the-cash-trough (payback cap; magic number). This lesson
  cites course-internal results with <Ref>, not external sources.
- **Skok SaaS Metrics 2.0 (cached)** — paid-CAC discipline; the
  "LTV/CAC>3 and payback<12mo" guidelines with the author's own hedging
  (already established in Part I; here they become bid ceilings).
- **Balseiro & Gur** — where v slots into the autobidder.
- **Kaushik (cached)** — one planted sentence: attributed ROAS ≠
  incremental ROAS; brand-keyword bidding example (paying for clicks
  you'd get organically) as the teaser for attribution lesson.
- **Google Ads docs register** (no cached source; describe generically):
  tROAS/tCPA campaign targets are exactly the numbers this lesson
  derives — say so without vendor-doc citation theatre.

## Key points the lesson must cover

1. **The chain, stated as measurable conditional probabilities**:
   click → conversion (signup) → customer, each with a rate; max CPC =
   allowed CAC × p(customer|click). Every link is an estimate with
   variance — multiplying point estimates compounds optimism (connect to
   Part II's estimation discipline).
2. **Allowed CAC has two caps**: profitability cap (margin-adjusted CLV /
   target LTV:CAC) and liquidity cap (payback window × monthly
   contribution). Compute both on the course case; the binding one wins.
   New-customer CLV, not residual value, is the right numerator —
   sorting means marginal acquired customers are worse than the base
   (Part I's ruse, now with money attached).
3. **ROAS decoded**: revenue/spend; breakeven ROAS = 1/GM%; a 400% ROAS
   target at 25% margin is exactly breakeven — the arithmetic most
   marketing dashboards hide. Contribution-ROAS and the payback window
   version; first-order vs LTV-ROAS (subscription revenue arrives over
   S(t), so ROAS windows are censored — cohort thinking again).
4. **The assembled bid**: v = margin-adjusted CLV × p(customer|click);
   paced bid = v/(1+μ); a full worked number for the course case.
5. **Marginal vs average, planted**: the bid cap derived from average
   CLV overpays at the margin (channel-quality mix, saturation) — one
   honest paragraph, formalized in media-mix-modeling and
   channel-portfolio.

## Set pieces and worked examples to recreate

- The course case end to end: sBG-fitted S(t) → new-customer CLV at 10%
  discount → allowed CAC at 3× and at 12-month payback → tCPA at 40%
  signup→customer → max CPC at 2% click→signup → paced bid at μ=0.2.
  One table, every row checkable.
- Breakeven-ROAS ladder: the same campaign judged at 100%/300%/400% ROAS
  under margins 80%/33%/25% — which cells are actually profitable.
- The censored-ROAS trap: a cohort's 30-day ROAS vs its modeled LTV-ROAS
  using S(t) — the observed window understates by a computable factor.

## Pitfalls / subtleties

- Attributed revenue in the ROAS numerator is an attribution output —
  the next lesson's whole subject; flag, don't resolve.
- p(conversion|click) varies by keyword/audience an order of magnitude;
  a single tCPA per account is a modeling choice, not a fact.
- Bid caps are per-auction ceilings; autobidders optimize subject to
  them — don't conflate the cap with the bid.
- Use NEW-customer CLV (not residual) and PAID CAC (not blended) —
  both directional errors inflate the cap; each got its own Part I
  lesson, Ref them.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the chain as a pipeline: click → signup →
   customer → margin stream, with rates on arrows and the value flowing
   backwards as caps (CLV → CAC → CPA → CPC); the lesson's master
   diagram.
2. `draw:` `<FigureSequence>` (4 frames) — deriving the bid on the course
   case: frame 1 S(t) and CLV; frame 2 the two CAC caps computed, tighter
   one highlighted; frame 3 tCPA and max CPC; frame 4 the paced bid with
   μ. Numbers carried through, one stage per frame.
3. `draw:` single `<Figure>` — breakeven-ROAS surface: ROAS target vs
   gross margin, the breakeven curve ROAS=1/GM% separating profit from
   loss regions; markers for software (80%), ecommerce (33%), grocery
   (25%).
4. `draw:` single `<Figure>` — the censored-ROAS fan: cumulative
   contribution per acquired customer over months (from S(t)), with
   30/90/365-day observation windows cutting it; observed ROAS at each
   window vs asymptote.
5. `draw:` single `<Figure>` — two-caps bar chart: profitability cap vs
   liquidity cap under three growth postures (bootstrapped, funded,
   blitz), showing which binds when (payback discipline from Part I
   revisited).

## EXERCISE PLAN

1. Warm-up: given CLV·GM = $900, target ratio 3, p(customer|click)=0.8%,
   compute allowed CAC, tCPA at 40% signup→customer, and max CPC.
   (The chain once, clean.)
2. Boundary probe: let churn → 0 in the folklore LTV = ARPA·GM/c — the
   cap diverges and the "affordable bid" becomes infinite; name what the
   sBG-based CLV with discounting does instead, and why the discount
   rate is now load-bearing (Ref customer-lifetime-value).
3. Claim to refute: "Our ROAS is 350%, so ads are profitable." With 25%
   gross margin and a 12-month payback rule on subscription revenue,
   show 350% attributed 30-day ROAS can be cash-negative; list the three
   corrections (margin, window, incrementality) in order of size.
4. Derivation the lesson skipped: derive breakeven ROAS = 1/GM% from the
   contribution identity, then the payback-window version
   ROAS_w ≥ 1/(GM% · F_w) where F_w is the fraction of discounted
   lifetime margin arriving by w — compute F_12 from the course sBG fit.
5. Research-shaped: pick a public benchmark CPC (state your source and
   date) for one keyword family; combine with plausible funnel rates to
   back out the CLV a bidder at that CPC must believe — judge whether
   the implied economics are sane.
6. FORWARD (E7): your tCPA holds at $50 while spend doubles — but the
   marginal CPA observed rises to $85. Compute average vs marginal CPA
   from a spend-conversions table and state which one the bid cap should
   police. Solution: rising marginal cost IS the saturation curve MMM
   fits and the portfolio lesson allocates on; `<Ref>`
   media-mix-modeling, channel-portfolio.
7. Spaced (E3): the tCPA uses p(customer|click) estimated from historical
   converters — which Part II failure (selection on post-click behavior,
   Ref experiment-pathologies triggering) biases it, and what experiment
   estimates the causal rate?
