# Research brief: ad-auctions-gsp-vcg (Ad auctions: second-price logic, GSP, and VCG)

status: planned
module: growth-channels
type: core
goal: Compute allocations and payments under second-price, GSP, and VCG rules and exhibit the bid profile where GSP truth-telling fails

The module's heaviest theory lesson and the course's mechanism-design
debut. Business words: CPC, ad rank, quality score. Academic layer:
Vickrey auction, position auctions, GSP vs VCG, envy-free equilibrium.
Dig-deeper: Krishna ch.16 (toc-only — pointer depth), EOS 2007, Varian
2007.

## ARC (L10)

- **Inherits:** Spine step 9's map: paid channels are the largest family
  and their price is set somewhere. The reader knows CAC as an outcome;
  this lesson opens the mechanism that generates it.
- **Contributes:** Spine step 10's opening: "the CPC is a mechanism's
  equilibrium price, not a fee." Second-price truthfulness, the GSP
  position auction actually run by search engines, VCG as the truthful
  benchmark, and the exact example where they diverge.
- **Hands off:** Revenue-side design (reserves, revenue equivalence,
  first-price migration) to reserve-prices-and-first-price; the bidder's
  problem under budgets to bidding-and-pacing.

## Sources to consult

- **Vickrey 1961 (FULL, cached counterspecu-)** — Sec. III pp.20–24: the
  founding definition and the dominant-strategy case analysis (bid less:
  lose winnable auctions at no price benefit; bid more: risk unprofitable
  wins). The "why not third-price?" aside p.23. Dutch flower auction
  aside p.14 for the format taxonomy. Sec. II: first-price/Dutch
  equivalence and the uniform-case bid (N−1)/N·v — plant it here, derive
  it next lesson.
- **Edelman–Ostrovsky–Schwarz (FULL, cached internetadve-)** — the
  lesson's spine:
  - Sec. 2.2: history per-impression → Overture first-price 1997 (price
    war, Figure 1 sawtooth) → Google GSP 2002. Scale numbers (Google 2004
    revenue $3.19B, >98% from GSP).
  - Sec. 3: GSP rules (slot i pays b_(i+1)), VCG recursive payments
    p^V(i) = (α_i−α_{i+1})b_(i+1) + p^V(i+1); Remarks 1–3.
  - The $10/$4/$2 running example in all three variants: first-price
    instability; GSP truthful at CTRs 200/100 (payments $800+$200, VCG
    $600+$200); Remark 3 flip at 200/199 (truthful $1,200 vs shaded
    $1,592).
  - Sec. 2.4: why engines kept GSP over VCG (explainability, transition
    revenue, uncertainty); footnote 8 — Google's own "Nobel Prize-winning"
    marketing claim, gently debunked.
- **Varian 2007 (FULL, cached positionauct-)** — Sec. 2 SNE definitions
  and the two breakeven thought experiments (2.1) as the intuitive
  derivation of bid bounds; Sec. 5 the VCG = SNE-lower-bound identity;
  Sec. 8 quality scores (bid × e_s, same inequalities rescaled); Sec. 10
  the 2,425-auction empirical fit (mean 5.8% deviation) and Table 2's
  "value ≈ $1, pay ≈ 50¢" anchor.
- **Easley & Kleinberg ch.9 + ch.15 (FULL, gapno-s2)** — the pedagogical
  register to imitate: VCG price = "harm to others" worked on a 3×3
  example; matching-market framing. Use its teaching sequence, cite EOS/
  Varian for the results.
- **Krishna (TOC-ONLY)** — cite as the graduate reference (Ch.16
  "Packages and Positions"); no chapter internals may be asserted.

## Key points the lesson must cover

1. **Second-price truthfulness first** (Vickrey Sec. III): the two-case
   dominance argument in full — this is the one complete proof of the
   lesson. State the practical meaning: bidders need only self-knowledge,
   no market forecasting.
2. **Position auctions**: slots × CTR vector; per-click vs per-impression;
   quality scores turn bid ranking into expected-revenue ranking (Varian
   Sec. 8 — one paragraph, rescaled bids).
3. **GSP mechanics and the near-miss**: GSP looks like Vickrey (your price
   is someone else's bid) but is NOT truthful. Run the EOS example all
   three ways; the 200/100 → 200/199 CTR tweak flipping the incentive is
   the lesson's discriminating example (L13 refutation: the documented
   misconception is "Google runs a Vickrey auction so bid your value" —
   Google's own marketing said so).
4. **VCG as the benchmark**: payment = externality; recursive computation
   on the same numbers; truthfulness restored; why platforms didn't
   switch (EOS 2.4).
5. **Equilibrium rescue**: envy-free/SNE equilibria of GSP replicate VCG
   payoffs (state Varian's identity and EOS Theorem 7 as facts with the
   breakeven intuition, proofs pointed to); Varian's empirical check that
   real bids sit within ~5.8% of SNE — theory that survives contact with
   2,425 real auctions.

## Set pieces and worked examples to recreate

- The EOS $10/$4/$2 example as the lesson's single running dataset (L6
  rule 4): first-price war → GSP truthful → GSP shading → VCG, all on one
  table.
- Varian's two breakeven thought experiments (what's the most I can bid
  without regretting winning the slot above / without provoking a swap) —
  the cleanest classroom derivation of the bid bounds.
- The Overture sawtooth as the historical evidence of first-price
  instability (also seeds next lesson).
- Vodka-dry aside: "why not third price?" (Vickrey p.23) as a boundary
  probe candidate.

## Pitfalls / subtleties

- Modern Google runs first-price for display (2019) but GSP-descendants
  with smart bidding for search — date every institutional claim; the
  migration story belongs to the NEXT lesson, plant one sentence.
- Quality scores mean the ranking is by bid×eCTR, so "slot i pays bid of
  i+1" is really "pays the minimum bid that holds rank" — say it once
  precisely.
- EOS payments vs Varian notation differ (per-click vs total); fix ONE
  notation (per-hour totals like EOS) and translate.
- Krishna attributions are toc-level only; never cite a Krishna theorem
  number.

## FIGURE PLAN

1. `draw:` single `<Figure>` — auction-format map: open/sealed ×
   first/second price (English, Dutch, first-price, Vickrey), with the
   two strategic equivalences drawn as arrows (inspired by Vickrey Sec.
   II–III).
2. `draw:` `<FigureSequence>` (4 frames) — the Vickrey dominance argument:
   frame 1 truthful bid wins at second price; frame 2 shade down — same
   price when winning, lost auctions added; frame 3 shade up — new wins
   are all above value; frame 4 verdict table. One case changes per
   frame.
3. `draw:` single `<Figure>` — the GSP ladder: two slots with CTR bars
   (200/100), three bidders with value tags, arrows showing each slot
   priced by the bid below; side column shows the VCG externality
   computation on the same numbers (idea from Krishna's reader-suggested
   'GSP ladder vs VCG payment column').
4. `draw:` `<FigureSequence>` (3 frames) — Remark 3 flip: frame 1 CTRs
   200/100, truthful payoffs; frame 2 CTRs 200/199, truthful payoffs;
   frame 3 bidder 1 drops to $3, takes slot 2, payoff comparison
   highlighted ($1,592 > $1,200).
5. `source:` **internetadve-sawtooth-fig1** — save as
   `overture-sawtooth`. Reader must see: the jagged climb-and-collapse of
   the top two bids over 14 hours of real July-2002 Overture data.
   Placement: float-right beside the history section (rotate the
   landscape original). This is the paper's only empirical exhibit; a
   redraw would fake measured data.
6. `source:` **gapno-s2-sponsored-search-serp** — save as
   `serp-sponsored-links-2010`. Reader must see: organic results left,
   Sponsored Links column right — the physical object the math prices.
   Placement: small, at the lesson opening. Period screenshot; a mockup
   would misrepresent it as illustration.
7. `draw:` single `<Figure>` — Varian's empirical fit: histogram sketch of
   quality-perturbation needed to rationalize 2,425 real auctions (peak
   ~5%), redrawn from positionauct-fig4's shape with our axes (the
   original is a low-contrast whole-page render).

## EXERCISE PLAN

1. Warm-up: three bidders, values 12/8/3, one slot, second-price rules —
   winner, price, each bidder's payoff; then repeat with a fourth bidder
   at 9. (Unfamiliar computation.)
2. Boundary probe: two slots with EQUAL CTRs (α₁=α₂) — show GSP truthful
   bidding becomes a money pump for the second bidder, derive the
   equilibrium, and name which assumption (strictly decreasing CTRs) the
   position-auction results need.
3. Claim to refute: "GSP is just Vickrey for multiple slots, so bid your
   value" (Google's own footnote-8 marketing). Refute with the 200/199
   computation; name the exact step of the Vickrey dominance proof that
   breaks (your bid sets the price for the slot ABOVE, not for you).
4. Derivation the lesson skipped: compute VCG payments for THREE slots
   (CTRs 300/200/100, values 10/6/4/2) via the recursion, and verify
   Remark 1 (GSP payments ≥ VCG at equal bids) on the result.
5. Research-shaped: reproduce Varian's Table-2-style margin read: with a
   fitted value-per-click ≈ $1 and observed CPC ≈ $0.50, compute the
   advertiser surplus share and compare with the lesson's SNE bounds;
   state what data you'd need to check it on a live account.
6. FORWARD (E7): for one bidder with value v uniform-anonymous rivals,
   compute expected payment under truthful second-price and under
   first-price with bid (n−1)/n·v for n=2,3 — the two numbers coincide.
   Solution: this equality is revenue equivalence, next lesson's theorem;
   `<Ref>` reserve-prices-and-first-price.
7. Spaced (E3): the quality score is an estimated CTR — connect to Part
   II: what experiment does the platform implicitly run to estimate it,
   and which pathology (novelty effect, Ref experiment-pathologies)
   biases a new ad's score?
