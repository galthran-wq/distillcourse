# Research brief: traction-and-bullseye (Traction channels and the Bullseye framework)

status: planned
module: growth-channels
type: core
goal: Select and rank growth channels with the five-step Bullseye process, scoring channel tests by cost per customer, volume, and fit

Module opener: light, procedural, and grounded in one real spreadsheet.
Business words: traction, channel, Bullseye. Academic layer: channel choice
as search under budget (expected-information-per-dollar echoes Part II's
test hierarchy). Dig-deeper: Weinberg & Mares, Traction (2014).

## ARC (L10)

- **Inherits:** Part I's CAC (a channel produces customers at a price) and
  Part II's evidence discipline (a channel test is a cheap experiment with
  an ex-ante criterion).
- **Contributes:** Spine step 9: "channels are the search space, channel
  choice is a procedure, and every channel is a market that degrades as it
  is bought" — the taxonomy, the five-step algorithm, and the three numbers
  a channel test estimates.
- **Hands off:** "Paid acquisition is an auction" (spine step 10): the
  biggest channel family's price formation is the next four lessons; the
  degradation assumption returns as Hill saturation (media-mix-modeling)
  and as the portfolio principle (channel-portfolio).

## Sources to consult

- **Traction chs. 1–3 (FULL, publisher excerpt PDF; cached)** — the whole
  lesson skeleton:
  - Ch.1 pp.1–8: traction defined ("quantitative evidence of customer
    demand", Naval quote); the 19-channel list with one-line definitions
    and interviewee per channel; the channel-bias claim.
  - Ch.2 pp.9–17: Bullseye as FIVE steps (brainstorm, rank, prioritize,
    test, focus) — reader-verified against the primary text; the folklore
    "3-step" version is wrong, say so. Three-ring metaphor (Inner circle /
    Promising / Long-shot). "Bullseye in the Wild": Mint.com sidebar.
  - Ch.3 pp.19–28: 50% rule / Product Trap; "what Lean is to product,
    Bullseye is to traction"; three phases and moving-the-needle scale
    shifts; leaky bucket (ties to Part I retention); DuckDuckGo's 6-year
    bright-spots story; Dropbox's $230-CAC-for-$99-product SEM test.
  - Chs. 4–25 are TOC-ONLY: cite chapter titles as the per-channel map,
    never chapter internals.
- **thebullseye-peter-thiel-quote sidecar** — Thiel's "one channel is
  optimal / poor distribution is the number one cause of failure" quote,
  verbatim as published in Weinberg's own article.

## Key points the lesson must cover

1. **The claim before the procedure:** distribution risk is symmetric with
   product risk (50% rule); Dropbox's failed SEM test ($230 to acquire a
   $99 customer) as the two-sentence opening case — a channel verdict
   computed with Part I's own CAC arithmetic.
2. **The 19-channel taxonomy** as a reference grid (channel, one-line
   definition, canonical example company). This is vocabulary coverage:
   each name gets one line, no more.
3. **Bullseye, five steps**, with the test step formalized: a channel test
   estimates (a) cost per customer, (b) addressable volume, (c) fit — for
   a few hundred dollars, not a scaled rollout. Connect to Part II: it is
   a cheap experiment with an ex-ante success criterion, not a commitment.
4. **The Mint.com worked case** (the module's first real dataset): the
   actual test table — TechCrunch 300k traffic/10% CTR/25% conv; Google
   Ads 1M/3%/35%; sponsorships 200k/40%/65%; totals 116,725/104,225.
   Compute implied CAC and volume per source; reproduce Kagan's ranking.
5. **Focus and repeat:** Thiel's one-optimal-channel claim; the stair-step
   growth curve (find channel → saturate → re-run Bullseye); channels
   degrade — stated here as an empirical pattern, formalized in
   media-mix-modeling (saturation) and channel-portfolio (marginal CAC).

## Set pieces and worked examples to recreate

- Mint's spreadsheet as both artifact and exercise dataset (transcribe the
  numbers from the capture).
- Dropbox SEM test verdict recomputed: CAC $230 vs price $99 vs (forward)
  a margin-adjusted CLV — the "compute don't vibe" template.
- DuckDuckGo timeline (2008–2013 flat, NSA-leak inflection) as the
  bright-spots/pivot heuristic — diagnostic, not numeric; keep short.

## Pitfalls / subtleties

- Bullseye is 5 steps, not 3 (the task brief that spawned this course said
  3; the primary text says 5 — cite Ch.2 directly).
- Chs. 4–25 unread: no channel-tactic specifics may be asserted beyond the
  Ch.1 blurbs. Mark the per-channel grid as name+definition only.
- tbook.us companion links are dead — do not cite.
- The Mint numbers are self-reported by a participant; frame as "the
  book's own canonical evidence", not audited data.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the 19-channel reference grid: 19 rows ×
   (channel, definition, example company), grouped paid/owned/earned/
   outbound; a poster-style leave-behind (inspired by the book's Ch.1
   list).
2. `draw:` single `<Figure>` — the Bullseye target: three concentric rings
   (Inner circle ≤3 / Promising / Long-shot) with example channels placed;
   the book's namesake visual redrawn properly (the excerpt renders it as
   an empty table).
3. `draw:` `<FigureSequence>` (5 frames) — the five steps run on Mint's
   data: frame per step, the channel set narrowing 19 → 3 → 1, ending on
   the focus choice (targeting blogs). One element changes per frame.
4. `draw:` single `<Figure>` — channel-test economics: three bars per
   tested channel (CAC, volume, fit-score) from the Mint table, with the
   chosen channel highlighted.
5. `source:` **tractiona-bullseye-in-the-wild-mint** — save as
   `mint-channel-test-spreadsheet`. Reader must see: the 10 source rows,
   Traffic/CTR/Conversion/Users columns, the 116,725 total. Placement:
   centered in the Mint section; caption notes it is the book's own
   evidence artifact. A redraw would erase its status as a real operator's
   spreadsheet.
6. `draw:` single `<Figure>` — the stair-step growth curve: flat → spike
   (channel found) → plateau (saturation) → spike (Bullseye re-run);
   recreate the cover's dashed curve as a labeled chart (inspired by
   tractiona-cover; do not embed the cover itself).

## EXERCISE PLAN

1. Warm-up: from the Mint table, compute users and implied CAC per source
   given stated costs; rank sources by cost per confirmed user.
   (Unfamiliar computation on a real artifact.)
2. Boundary probe: a channel with fit=0 (audience mismatch) but excellent
   CAC and volume — show why the Bullseye ranking still rejects it, and
   which of the three test numbers is non-compensatory.
3. Claim to refute: "We should run all 19 channels a little to
   diversify risk." Use the test-budget arithmetic (fixed budget, per-test
   cost, statistical noise at small n from Part II's power lesson) to show
   parallel-3-then-focus dominates spread-19.
4. Derivation the lesson skipped: formalize channel choice as maximizing
   E[information]/cost over tests with a budget; show the inner-circle
   size ~3 falls out of a simple explore/exploit split (forward echo of
   multi-armed-bandits, backward Ref).
5. Research-shaped: take a real product the reader knows; write the
   brainstorm row for all 19 channels (one idea each) and the ex-ante
   success criterion for the top-3 tests — the Bullseye artifact itself.
6. FORWARD (E7): Dropbox's SEM test — with CAC $230, price $99/yr, and an
   assumed 80% gross margin and 60%/yr retention, compute how many years a
   customer must survive to repay acquisition. Solution: the number is a
   payback/CLV read that says "this channel can never work at this price",
   and the CPC that WOULD work is exactly what the auction lessons price;
   `<Ref>` ad-auctions-gsp-vcg and roas-and-max-bid.
7. Spaced (E3): restate the leaky-bucket claim in Part I's terms — which
   cohort-matrix signature (retention flattening or not) licenses spending
   on traction, and why testing channels pre-PMF still has value.
