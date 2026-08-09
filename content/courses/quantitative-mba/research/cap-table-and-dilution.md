# Research brief: cap-table-and-dilution (The cap table: priced rounds, option pools, and dilution)

status: planned
module: startup-finance
type: core
goal: Compute ownership through priced rounds — share price, pre/post money, option-pool placement, pro-rata — on a full cap table

Deal mechanics, part 1. Business words: cap table, pre/post-money,
option pool, dilution, pro-rata. Academic layer: none new —
conservation arithmetic done exactly; the content is the clauses that
move the numbers. Dig-deeper: Venture Deals chs. 5, 9 (toc-only);
Foresight tool (fully read).

## ARC (L10)

- **Inherits:** burn-runway's conclusion (raise $2.5M within 6
  months — the forward exercise priced a round naively).
- **Contributes:** Spine step 16 opens: ownership as a spreadsheet
  with conservation laws — the three identities, the option-pool
  shuffle, multi-round dilution with pro-rata.
- **Hands off:** SAFEs stack BEFORE the priced round
  (safe-conversion); what the shares are WORTH at exit is the
  waterfall (two lessons ahead); the economics/control split frames
  both.

## Sources to consult

- **Foresight cap-table tool (FULL, cell-verified; cached dumps)**:
  - "2 - Equity Issuance": share price = pre-money / fully-diluted;
    post = pre + raise — the identities with a worked round.
  - "2 - …2nd Round": pro-rata exercised to hold ownership.
  - "3 - Premoney/Postmoney Option Pool": THE set piece — identical
    round ($750k at $3M pre, 20% pool): pre-money pool → price
    $0.225, founders 60%→36%; post-money pool → price $0.30,
    dilution shared with the investor. Same headline, different
    deal.
  - Pool self-dilution correction: Options = %·Post/(Price·(1−%)).
  - Changelog: the author's own "impossible to unpack" confession —
    the legibility-over-cleverness modeling lesson (one aside).
- **Venture Deals (TOC-ONLY)** — the frame: term sheet = economics +
  control (ch. 5/6 titles); cap table as its own chapter (9);
  Appendix B's real Foundry term sheet exists — cite as artifact to
  buy, no content claims.
- **YC SAFE primer (forward)** — one sentence: the pre-round
  converting layer is next lesson.
- **WeWork lesson (backward)** — dual-class voting as the control
  side already seen in the wild.

## Key points the lesson must cover

1. **The three identities**: price = pre/FD-shares; post = pre +
   raise; new ownership = raise/post. Worked immediately on the
   course case's $2.5M round. Everything else is bookkeeping around
   them.
2. **Fully diluted means everything**: founders, issued options,
   POOL INCLUDING UNGRANTED, safes-as-converted (forward), warrants;
   the denominator choice is where negotiations hide.
3. **The option-pool shuffle** (the lesson's discriminating example):
   the Foresight twin scenarios computed side by side; "$3M pre with
   a 20% pool created pre-money" is a LOWER price than the headline
   — effective pre-money arithmetic; the negotiation reading (pool
   sizing belongs with hiring-plan needs, not custom).
4. **Multi-round dilution**: two rounds worked with and without
   exercising pro-rata; the compounding founder stake table;
   pro-rata as an option that costs money to keep.
5. **Economics vs control** (Venture Deals frame): the cap table
   records economics; control (board, protective provisions) rides
   beside it — one honest section at pointer depth, WeWork's 20:1
   votes as the seen example; full price-of-control at the
   waterfall.

## Set pieces and worked examples to recreate

- The course case's Series A: $2.5M at $10M pre with a 12% post-
  money pool, two prior founders 55/35 + 10% issued options —
  complete before/after cap table, every identity checked.
- The Foresight twin pool scenarios transcribed to our numbers
  (same structure, our case) — the shuffle quantified.
- Three-round founder-stake trajectory (pre-seed to B) with the
  compounding dilution product Π(1−d_i).
- The "same headline valuation, three different deals" table:
  pool pre/post, and raise size varied — effective price per share
  as the honest comparator.

## Pitfalls / subtleties

- Venture Deals is toc-only: the economics/control taxonomy is
  chapter-title-level and safe; NO clause-by-clause claims from the
  book.
- Fully-diluted definitions vary by term sheet — state the
  convention used and flag that the definition is itself negotiated.
- Do not introduce preferences/participation here — shares in this
  lesson are still "percent ownership"; the waterfall lesson breaks
  that equivalence deliberately.
- Round modeling order (pool before or after conversion) interacts
  with SAFEs — next lesson owns it; keep this lesson SAFE-free.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the cap table as conservation:
   before/after ownership bars for the worked round; the new-shares
   wedge entering, every other slice shrinking proportionally.
2. `draw:` `<FigureSequence>` (4 frames) — the round executes:
   frame 1 pre-round table; frame 2 price computed from pre/FD;
   frame 3 new shares minted to the investor; frame 4 pool topped
   up — ordering visible. One operation per frame.
3. `draw:` single `<Figure>` — THE shuffle: two panels, identical
   headline ($750k at $3M pre, 20% pool), pool pre-money vs
   post-money; founder % and share price labeled in both — the
   difference boxed.
4. `draw:` single `<Figure>` — founder stake trajectory: line from
   100% through four rounds with/without pool top-ups; the
   compounding product annotated.
5. `draw:` single `<Figure>` — the term-sheet map: economics column
   (valuation, pool, pro-rata → this lesson) vs control column
   (board, protective provisions → pointer), waterfall terms grayed
   "priced later" (the module's roadmap object).

## EXERCISE PLAN

1. Warm-up: $4M pre, 8M FD shares, $1M raise — price, post, investor
   %, founder dilution. (Identities once.)
2. Boundary probe: raise → ∞ at fixed pre — investor % → 100% and
   price is UNCHANGED; explain why price protects nobody about
   dilution, and which identity governs each quantity (the common
   conflation of price and ownership named).
3. Claim to refute: "We got a higher valuation than the other term
   sheet, so it's the better deal." Two sheets: $12M pre with 25%
   pre-money pool vs $10M pre with 10% post-money pool — compute
   effective price per share and founder % under both; the higher
   headline loses.
4. Derivation the lesson skipped: derive the pool self-dilution
   correction Options = p·Post/(Price·(1−p)) from "pool must be p of
   post-round FD including itself"; verify on the worked round.
5. Research-shaped: using the Foresight tool's published twin-
   scenario numbers (cached cell dump), reproduce both cap tables
   from the identities alone and confirm the $0.225 vs $0.30 share
   prices — a cell-level replication of a real modeling artifact.
6. FORWARD (E7): the course case's round has $700k of outstanding
   SAFEs at an $8M cap. Attempt the cap table treating them as
   "just more investors at the round price" and observe the
   ownership doesn't close (someone's % must give). Solution: SAFE
   conversion has its own denominator rules — next lesson;
   `<Ref>` safe-conversion.
7. Spaced (E3): the pool exists to hire — size it from the sales
   lesson's hiring plan (6 reps + 4 eng at market grant sizes)
   rather than the investor's 20% default; state the negotiation
   consequence (Ref sales-motion-and-acv, financial-model).
