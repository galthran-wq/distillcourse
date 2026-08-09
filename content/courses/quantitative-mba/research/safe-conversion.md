# Research brief: safe-conversion (SAFE conversion mechanics)

status: planned
module: startup-finance
type: core
goal: Compute SAFE conversions — post-money cap, discount, MFN — into a priced round and the resulting founder dilution

Deal mechanics, part 2 — the pre-round layer, from the primary legal
templates. Business words: SAFE, cap, discount, MFN. Academic layer:
none new — the instrument's exact formulas; the post-money redesign as
a definitional theorem. Dig-deeper: YC Post-Money Safe primer +
templates (fully read, CC BY-ND).

## ARC (L10)

- **Inherits:** cap-table identities and the failed attempt to treat
  SAFEs as ordinary investors (previous lesson's forward exercise).
- **Contributes:** Spine step 16's middle: conversion by formula —
  Safe Price = Cap / Company Capitalization, the greater-of rule, the
  inclusion/exclusion table that defines "post-money", the raise
  ceiling (amount/cap = ownership, so cap = max raise), and the full
  stacked-safes dilution cascade.
- **Hands off:** the safe's liquidity-event greater-of(cash-out,
  convert) clause is an option payoff — priced two lessons ahead;
  the converted stack enters the waterfall next lesson.

## Sources to consult

- **YC primer v1.1 + templates v1.2/1.3 (FULL, cached postmoney-)**:
  - Quick Start #1: cap sizing — ownership sold = amount/cap
    ($1M/15% ⇒ ~$6.7M cap).
  - §B: conversion — greater-of(round-price shares, Safe Price
    shares); Safe Price = Cap/Company Capitalization; the Company
    Capitalization definition (includes all safes + pre-existing
    pool, EXCLUDES new money and its pool increase) — the exact
    place "post-money" lives.
  - §B.4 the inclusion/exclusion table (pre-money vs post-money
    safe) — the redesign explained in one table.
  - §D.2 THE founder-ownership table: $5M cap; raise 0.5/2.5/5M ⇒
    founders 90/50/0% — "raising more than the cap implies negative
    ownership".
  - Quick Start #3 + §E: the pro-rata backsolve and the full
    52.62% dilution cascade worked.
  - Appendix II Example 1 (post-money only) and Example 2 (mixed
    pre/post — the recursive Company Capitalization headache) — the
    lesson's two graded worked examples.
  - Appendix I + templates: cap-only / discount-only (Discount Rate
    = 100% − discount; the sign-flip gotcha) / MFN (identical-
    replacement, no cherry-picking, one-shot); liquidity-event
    greater-of clause (§A.3/C).
  - Version note: templates are v1.2/1.3 (2023) vs primer v1.1 —
    templates authoritative on wording.
- **Foresight tool** — the four conversion methods (premoney /
  postmoney / %-ownership / $-invested) on identical inputs giving
  different splits — ★ starred section: conversion METHOD is itself
  a negotiated term; the YC post-money method is one of four.
- **Venture Deals ch.8 (TOC-ONLY)** — safes situated inside
  convertible instruments; name-level only.

## Key points the lesson must cover

1. **What the instrument is**: money now, shares later, not debt, no
   maturity/interest; the actual template's anatomy (5 pages,
   'THIS CERTIFIES THAT…'); three flavors. Show the real page — the
   brevity is the point.
2. **Post-money conversion, exactly**: Safe ownership = amount/cap,
   fixed at signing; Safe Price = cap/Company Capitalization; the
   greater-of discount interaction; worked cleanly on the course
   case ($700k at $8M cap into the $2.5M-at-$10M-pre round from
   last lesson — closing that exercise).
3. **The definitional table**: what Company Capitalization includes/
   excludes and hence who absorbs which dilution — pre-money safes
   made founder outcomes a DISTRIBUTION (the primer's own framing);
   post-money made them a number. The 2018 redesign as a lesson in
   definition engineering.
4. **The ceiling theorem**: ownership sold = Σ amounts/caps ⇒
   raising the cap amount sells 100%; the 90/50/0 table; stacked
   safes at different caps summed; the full cascade (safes → pool →
   round → pro-rata) reproducing the primer's 52.62%.
5. **Flavor mechanics**: discount-only (Discount Rate sign-flip),
   MFN (identical replacement, one-shot), the pro-rata side letter
   (cap-bearing safes only); liquidity event greater-of(cash-out,
   convert) — flagged as an option payoff, priced later.

## Set pieces and worked examples to recreate

- The course case's full conversion: two safes ($500k@$8M cap,
  $200k@$10M cap) + 12% pool + $2.5M at $10M pre — complete cap
  table, founder % at each stage of the cascade.
- The primer's 90/50/0 table verbatim-recomputed.
- Appendix II Example 1's Q5 twist: round price BELOW Safe Price —
  the cap doesn't bind and the safe converts at round price
  (10.3% vs 10% — caps are ceilings on price, not guarantees).
- ★ The four-methods comparison on one deal (Foresight numbers):
  18.6% vs ~20% investor ownership from the method choice alone.

## Pitfalls / subtleties

- CC BY-ND on templates: verbatim quoting with attribution is
  licensed; NEVER present a modified template as the template.
- Discount Rate = 100 − discount% (an 80% Discount Rate IS a 20%
  discount) — the classic transcription trap; drill it.
- Mixed pre/post-money safe stacks make Company Capitalization
  self-referential (Example 2) — show the recursion once, in the ★
  section; the clean path is all-post-money.
- Safes convert at the NEXT equity financing regardless of size
  (no threshold in the standard template) — folklore says "qualified
  round"; the template says otherwise; check the actual text.
- Interest/maturity questions are convertible-NOTE features — one
  sentence of taxonomy, not a detour.

## FIGURE PLAN

1. `draw:` single `<Figure>` — instrument timeline: money in at
   signing → (time passes, no interest, no maturity) → priced round
   triggers conversion → shares; the safe drawn as a claim waiting
   on an event.
2. `draw:` `<FigureSequence>` (4 frames) — the cascade on the course
   case: frame 1 founders+pool; frame 2 safes convert at cap prices
   (ownership fixed at signing); frame 3 pool tops up; frame 4 new
   money in — the final table with every wedge labeled. One layer
   per frame.
3. `draw:` single `<Figure>` — THE ceiling chart: founder % vs
   amount raised on a $5M cap (linear to zero at $5M); the 90/50/0
   points marked (primer §D.2 as a graph).
4. `draw:` single `<Figure>` — the inclusion/exclusion table:
   pre-money vs post-money safe, rows (capital stock / options /
   pool increase / safes), Included/Excluded cells colored — the
   redesign in one look (primer §B.4 recreated).
5. `source:` **postmoney-safe-instrument-opening** — save as
   `yc-safe-page1`. Reader must see: the securities legend, "THIS
   CERTIFIES THAT", the blank Post-Money Valuation Cap line.
   Placement: float-right at the anatomy section; caption notes
   CC BY-ND and that a safe is five pages, not a term sheet. The
   legal artifact's brevity is the payload.
6. `draw:` single `<Figure>` — greater-of geometry: shares received
   vs round price, the cap branch flat and the discount branch
   rising, kink at the crossover (the conversion rule as a payoff
   diagram — quietly previewing option kinks).

## EXERCISE PLAN

1. Warm-up: $250k safe, $10M post-money cap — ownership at signing;
   shares at conversion if Company Capitalization is 10M shares;
   price per share. (The formula once.)
2. Boundary probe: round price BELOW the cap-implied price (down-ish
   round) — recompute Appendix-II-Q5-style: which branch of
   greater-of binds, and show the investor gets MORE than
   amount/cap; the cap is a floor on shares, not a fixed ownership
   when rounds go badly.
3. Claim to refute: "A $10M cap means we're valued at $10M." List
   the three ways it differs from a priced $10M valuation (no
   shares priced today; ownership fixed only for the safe; caps of
   stacked safes don't interact like one price) — and compute a
   stack (3 safes at 6/8/10M caps) whose total dilution exceeds
   what any single "valuation" reading suggests.
4. Derivation the lesson skipped: prove ownership additivity — for
   post-money safes, total safe ownership = Σ aᵢ/capᵢ regardless of
   round terms — from the Company Capitalization definition; then
   derive the founder-zero condition Σ aᵢ/capᵢ = 1.
5. Research-shaped: the primer's 52.62% cascade (Quick Start #3) —
   reproduce every intermediate percentage (4.41% pro-rata, 29.41%
   block, 39.41%, 9.09%, 4.12%) from the stated inputs; a
   line-by-line replication of the primary document's arithmetic.
6. FORWARD (E7): the safe's liquidity clause pays
   max(amount, as-converted value) if the company is acquired
   tomorrow. Plot the payoff vs acquisition price for the $500k/$8M
   safe and describe the shape. Solution: a floor plus upside — the
   kinked claims the waterfall stacks and the options lesson prices;
   `<Ref>` liquidation-preferences-and-waterfall,
   esop-and-option-pricing.
7. Spaced (E3): the safes were raised because runway said so —
   recompute burn-runway's raise trigger assuming the bridge is
   $700k of safes instead of equity, and state what changed in the
   cap table NOW vs LATER (Ref burn-runway-default-alive,
   cap-table-and-dilution).
