# Research brief: reserve-prices-and-first-price (Reserve prices, revenue equivalence, and the first-price migration)

status: planned
module: growth-channels
type: core
goal: Derive the revenue-maximizing reserve price from virtual values and explain the 2019 migration of display auctions to first price

The revenue side of auction design: what the seller controls. Business
words: reserve price, price floor, first-price, bid shading. Academic
layer: revenue equivalence, Myerson's optimal auction, virtual values.
Dig-deeper: Myerson 1981; Krishna chs. 2–4 (toc-only).

## ARC (L10)

- **Inherits:** GSP/VCG mechanics and the truthfulness results; the
  exercise-6 discovery that first-price and second-price expected revenue
  coincided in a special case.
- **Contributes:** The general theorem behind that coincidence (revenue
  equivalence), the one lever it leaves (reserve prices, via virtual
  values), and the 2019 institutional shift to first price with the bid
  shading it forces.
- **Hands off:** "Shading responsibility moves to the bidder" — the
  bidder's constrained problem is bidding-and-pacing; the reserve/floor
  vocabulary returns in channel-portfolio (platforms repricing).

## Sources to consult

- **Myerson 1981 (FULL, cached optimalaucti-)**:
  - §3–4: revelation principle (Lemma 1), the feasibility lemma, and the
    Revenue-Equivalence corollary (eq 4.12) — teach the envelope argument
    at sketch depth (payoff = integral of win probability), point to the
    paper for rigor.
  - §5 (p.67): virtual value c(t) = t − (1−F)/f; uniform[0,100] worked
    example — c(t)=2t−100, reserve 50; n=1 collapses to monopoly posted
    price 50, revenue 25. THE keeper numbers.
  - §5 asymmetric example c_i = 2t_i − b_i (optimal auction discriminates
    against the stronger bidder) — starred-section material.
  - §7 correlated-values full-surplus extraction — one-sentence boundary
    note only (independence is load-bearing).
- **Vickrey 1961** — Sec. II uniform-case first-price equilibrium bid
  ((N−1)/N)·v and the same-expected-price observation (pp.16–17, App. I):
  the historical seed of revenue equivalence; also price-variance
  difference (2N/(N−1) factor) for a starred aside.
- **EOS 2005** — Figure 1 sawtooth + Sec. 2.2.2: why first-price was
  UNSTABLE in 1997–2002 under continuous bid adjustment (no pure
  equilibrium, cycling), setting up "why did it come back?"
- **Google Ad Manager announcement 2019 (FULL, cached simplifyingp-)** —
  the primary artifact of the migration: the chained
  second-price-inside-first-price problem, "winner pays what they bid",
  explicit scope (Ad Manager display/video only, NOT Search/YouTube),
  the two asks (publishers re-think floors; bidders adjust bidding).
- **Balseiro & Gur** — one forward sentence: modern autobidders do the
  shading algorithmically, which is why first-price is now viable.

## Key points the lesson must cover

1. **Revenue equivalence as the organizing theorem**: statement, the
   envelope-argument sketch, and its meaning — format choice alone buys
   the seller nothing under symmetric IPV. Recover last lesson's
   exercise-6 coincidence and Vickrey's 1961 observation as instances.
2. **What breaks it** (one paragraph each, from Krishna's toc map +
   Myerson): risk aversion, asymmetry, correlation — the boundary of the
   theorem, honestly cited at pointer depth.
3. **The Myerson reserve**: virtual value derivation at MBA-friendly
   depth (marginal-revenue interpretation: ψ(v) is the MR of selling to
   type v — the monopoly analogy makes it teachable); uniform[0,100] ⇒
   reserve 50 worked in full; reserve independent of n; the seller
   sometimes keeps the item although a bidder values it — optimal ≠
   efficient.
4. **Reserves in the wild**: AdWords/AdX floors, Varian's 5-cent reserve
   note, and the practical asymmetry — real platforms set floors from
   fitted bid distributions, exactly Myerson's F.
5. **The first-price migration (2019)**: the header-bidding daisy chain
   (Google's own diagram), why a mixed stack made second-price prices
   un-auditable, the announcement's operational asks, and the new
   equilibrium: bidders shade ((n−1)/n·v as the benchmark), floors mean
   something different, and shading is now software (forward).

## Set pieces and worked examples to recreate

- The uniform[0,100] optimal auction end to end: virtual values, reserve
  50, expected revenue with and without reserve at n=2 (compute: 25/12 →
  higher with reserve), the n=1 monopoly special case.
- Vickrey's variance comparison (same mean price, different variance) as
  a starred aside — mechanisms equal in expectation differ in risk.
- The 2019 diagram's story retold as a numbers example: a $10 bid
  filtered through an inner second-price auction re-enters an outer
  first-price auction — show how the clearing price loses meaning.

## Pitfalls / subtleties

- Revenue equivalence needs risk neutrality + symmetry + IPV + same
  allocation — list the hypotheses; the exercises probe them.
- Myerson's regularity condition (monotone virtual value): state it,
  note the ironing fix exists (pointer), don't derive.
- The migration is scoped: display/video via Ad Manager, NOT Google
  Search — the common student misconception, refute explicitly (L13).
- Reserve-vs-floor language: publisher floors in programmatic are
  per-impression reserves, sometimes above Myerson-optimal for
  price-pressure reasons — flag as institutional detail, not theory.

## FIGURE PLAN

1. `draw:` single `<Figure>` — revenue equivalence as a picture: two
   payment paths (first-price shaded bid vs second-price expected
   second-highest) over the same allocation, areas under the curves
   marked equal (inspired by Krishna's reader-suggested schematic).
2. `draw:` single `<Figure>` — the virtual-value line: ψ(v)=2v−100 on
   [0,100], zero-crossing at 50 highlighted, regions "exclude" /
   "allocate by ψ" labeled; second panel: expected revenue vs reserve r
   with the maximum at 50 (Myerson §5 has no figures — this is ours).
3. `draw:` `<FigureSequence>` (3 frames) — the daisy-chain problem:
   frame 1 bids enter an exchange's second-price auction; frame 2 its
   winning bid re-enters the publisher's first-price auction among other
   exchanges; frame 3 unified first-price. Recreate Google's own
   two-panel diagram as a step-through (source diagram is the
   inspiration; house style).
4. `source:` **optimalaucti-reserve-price-page** — save as
   `myerson-reserve-page`. Reader must see: the original typeset
   derivation with c(t)=2t−100 and "reservation price of 50". Placement:
   float-right beside our derivation; caption: the 1981 page the phrase
   "Myerson reserve" points to. Retypesetting is our job; the artifact
   proves the provenance.
5. `source:` **simplifyingp-hero** — save as `google-first-price-2019`.
   Reader must see: Google's own before/after panels with the '2nd
   Price' box nested inside a '1st Price' flow. Placement: centered in
   the migration section; caption: what Google itself said the problem
   was. Every secondary account reproduces this exact diagram.
6. `draw:` single `<Figure>` — shading benchmark: bid functions b(v)=v
   (second-price) vs b(v)=(n−1)/n·v for n=2,5,20 converging to truthful
   as n grows.

## EXERCISE PLAN

1. Warm-up: n=2, values uniform[0,1], no reserve — compute expected
   revenue under second-price (E[min]=1/3) and first-price with
   b=v/2 (also 1/3). (The equivalence made concrete.)
2. Boundary probe: introduce asymmetry — bidder A uniform[0,2], bidder B
   uniform[0,1], second-price vs first-price. Show (numerically or by
   citing Vickrey's App. III result) revenues now differ; name the
   hypothesis that failed.
3. Claim to refute: "A reserve price can only lose revenue — it
   sometimes blocks the sale." Compute n=2 uniform[0,100] revenue with
   r=0 (33.3) vs r=50 (41.7); explain which types pay for the gain and
   why the loss (no-sale probability 1/4) is worth it.
4. Derivation the lesson skipped: derive the optimal reserve r*=(1+u)/2
   for one bidder uniform[0,1] and seller value u (the Easley–Kleinberg
   form); verify r* > u always — the seller optimally risks keeping an
   item worth less to them.
5. Research-shaped: Myerson's asymmetric example — with bidders uniform
   on [0,1] and [0,2], compute who wins under the optimal auction when
   t₁=0.8, t₂=0.9 (virtual values 2t−b_i), and state the discrimination
   result in one sentence.
6. FORWARD (E7): a bidder in a first-price auction has a per-day budget
   that binds across many auctions. Show by a two-auction example that
   bidding the static equilibrium shade in each auction overspends, and
   that a uniform down-scaling of bids restores feasibility. Solution:
   the scaling factor is 1/(1+μ) — the shadow price the next lesson
   derives; `<Ref>` bidding-and-pacing.
7. Spaced (E3): revenue equivalence assumed a fixed allocation rule and
   risk-neutral bidders — connect to Part II's MDE logic: if a platform
   A/B-tests second-price vs first-price on live traffic, what outcome
   metric and what interference problem (Ref experiment-pathologies)
   does the test face?
