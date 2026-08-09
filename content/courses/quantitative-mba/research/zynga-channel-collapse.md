# Research brief: zynga-channel-collapse (Channel collapse in the filings: Zynga 2011–2012)

status: planned
module: growth-channels
type: synthesis
goal: Analyze Zynga's virality-driven rise and platform-dependent collapse from its S-1 and FY2012 10-K

MODULE APPLICATION (L16). No new theory. Raw material: two public
filings, before and after. The reader diagnoses with module tools:
engineered K, metric quality, platform concentration, portfolio math.
Every number is from the cached filings (public domain).

## ARC (L10)

- **Inherits:** the whole module — branching subcriticality, vanity-
  metric diagnostics (Part I goodharts-law), bookings/billings/revenue
  (Part I margins lesson), channel-portfolio's concentration dashboard
  and platform-risk covariance.
- **Contributes:** Spine step 13's close: the canonical platform-risk
  case run on primary documents; the verdict was computable from the
  S-1 alone.
- **Hands off:** Part IV — the filing-reading skills (registers,
  non-GAAP, estimates-as-levers) recur at WeWork; Zynga's
  bookings-vs-revenue mechanics preview pnl-and-revenue-recognition.

## APPLICATION spec (L16)

- **Artifact:** Zynga's S-1 (July 2011) and 10-K FY2012 — the same
  company's disclosure before and after the channel repriced.
- **Module results used:** Galton–Watson subcriticality (bought spikes
  decay at 1/(1−K), they do not self-sustain); engineered
  cross-promotion K (zBar) vs organic K; concentration metrics from
  channel-portfolio; vanity-metric diagnostics (DAU/MAU double-counting)
  from goodharts-law; bookings-vs-revenue deferral mechanics.
- **Departures from idealisation:** filings give aggregates — no
  per-cohort or per-generation data, so K is inferred, not measured;
  bookings mix durable/consumable goods with changing recognition
  estimates; platform terms (70/30, Credits) are disclosed but the
  bilateral negotiation is not. The lesson names all three.

## Sources to consult (cached filings; page-pinned renders exist)

- **S-1 (2011)**:
  - Founder's letter (unnumbered): 232M MAUs, 60M DAUs interacting
    416M times/day, 38,000 items/sec, $1.5B cumulative bookings —
    peak rhetoric, verbatim quotable (capture exists).
  - Risk factor #1 (p.14): Facebook dependency stated qualitatively —
    including the disclosed 2010 policy change that ALREADY cut
    players. The number missing from the sentence is the lesson's
    hook.
  - Business p.83: the zBar cross-promotion strip (annotated
    screenshot); p.80 CityVille energy modal (pay ~$1 or Ask
    Friends) — monetization coupled to the viral ask.
  - p.87: Facebook addendum — 70% remit of Credits (30% platform
    tax), expiry 2015.
  - Summary p.4: 9 quarters of accelerating bookings/EBITDA (chart
    capture); metric definitions (DAU/MAU double-counted across
    games; MUU deduplicated).
  - MLE-adjacent note: bookings = revenue + Δdeferred (defined
    p.47-48) — the non-GAAP top line.
- **10-K FY2012**:
  - Item 1 p.6: 81% of bookings / 86% of revenue via Facebook; Credits
    discontinued June 2012; With Friends carve-out 2013.
  - Item 6 p.36 five-year table: bookings 35.9→328.1→838.9→1,155.5→
    1,147.6 ($M, first decline) vs DAU 41→56→57→63M and MAU up to
    302M — the divergence table.
  - Adjusted EBITDA 392.7 (2010) → 303.3 → 213.2; net income +90.6
    (2010) → −404.3 (2011) → −209.4 (2012); IPO-triggered ZSU comp.
  - Item 1A p.27 + Note 5: OMGPOP $183.1M (Mar 2012) → Draw Something
    DAU spike (Q2) → decline (Q3) → $95.5M impairment (Q3) — the
    nine-month spike trade.
  - Item 5 p.34: stock $15.91 (Q1'12 high) → $2.09 (Q4 low) → $2.36
    close; $200M buyback authorized, $11.8M used.
  - MD&A p.48: durable-goods useful life 15→12 months adding $14.1M
    revenue — estimates as levers (feeds Part IV).
  - Headcount 2,268 → 3,058 while bookings flat — operating leverage
    read.

## Key points / the lesson's task sequence

1. **Read the before**: the founder letter and the 9-quarter chart —
   what a peak-virality pitch looks like; then risk factor #1 and the
   metric definitions — the S-1 itself disclosed the dependency and
   the double counting. Task: from S-1 definitions, explain how one
   person playing three games daily counts as 3 DAUs, and what MUU
   corrects.
2. **Quantify the dependency**: the 10-K's 81%/86% + the 30% take.
   Task: recompute 2012 contribution if the take rose to 45% —
   channel-portfolio's repricing exercise on real numbers.
3. **Diagnose the growth engine**: zBar = engineered cross-promotion
   (bought/borrowed K), CityVille modal = monetization coupled to
   invites; OMGPOP as buying a supercritical spike that went
   subcritical in months (fit the decay story; the $95.5M writedown
   as the accounting echo). Task: model Draw Something's DAU path as
   a burst + subcritical decay; estimate the implied K trajectory.
4. **The divergence verdict**: 2012 record DAUs/MAUs with declining
   bookings — which metrics were load-bearing and which vanity;
   Goodhart diagnostics applied to an audited document.
5. **The portfolio read**: one channel, one counterparty, both sides
   knew (risk factor #1 → 86%); what a diversification plan would
   have required and when (the With Friends carve-out as the
   too-late move). Close: the market's verdict ($15.91→$2.36) against
   the reader's computed one.

## Set pieces / keeper numbers

- 81% bookings / 86% revenue via Facebook (2012).
- Bookings 1,155.5→1,147.6 first-ever decline WHILE avg DAUs 57→63M.
- OMGPOP: $183.1M in, $95.5M impaired, ~9 months.
- 70/30 split; Credits discontinued June 2012.
- Stock $15.91 → $2.36 (2012).
- 15→12-month life change = +$14.1M revenue (estimate lever).

## Pitfalls / subtleties

- Do NOT claim Zynga's K ever exceeded 1 — no filing supports it; the
  claim is engineered cross-promotion + paid installs masking
  subcritical organic virality. Inference labeled as inference.
- The 2011 net loss is largely IPO-triggered stock comp — not
  operations; separate before judging (mirrors WeWork's RSU story).
- Platform risk here is bilateral: Facebook needed Zynga too (12% of
  FB revenue at peak — that number is NOT in these filings; omit or
  source separately at write time).
- Keep the lesson diagnostic: tasks → verdict → compare with history
  (the разбор format from issue #85).

## FIGURE PLAN

1. `draw:` single `<Figure>` — the divergence chart: indexed bookings
   vs average DAUs vs MAUs 2009–2012 from the Item 6 table — the
   application's master exhibit (our chart from filed numbers).
2. `draw:` single `<Figure>` — the dependency stack: 2012 revenue bar
   split Facebook/other; inside the Facebook bar, the 70/30 take
   split — concentration and take in one picture.
3. `draw:` `<FigureSequence>` (3 frames) — the OMGPOP trade: frame 1
   acquisition ($183.1M, Mar); frame 2 Draw Something DAU spike
   (Q2 peak); frame 3 decay + $95.5M impairment (Q3) — a viral spike
   bought at the top, one event per frame.
4. `source:` **forms-znga-s1-founder-letter** — save as
   `zynga-founder-letter`. Reader must see: Pincus's own peak numbers
   (232M MAUs, 38,000 items/sec). Placement: lesson opening,
   centered. The rhetorical register IS the evidence; paraphrase
   would flatten it.
5. `source:` **forms-znga-10k-facebook-dependency** — save as
   `zynga-10k-dependency`. Reader must see: the 81%/86% sentences and
   the Credits-discontinuation disclosure in filing typography.
   Placement: beside task 2; the precision of the filed number is the
   payload.
6. `source:` **forms-znga-s1-zbar** — save as `zynga-zbar`. Reader
   must see: the annotated cross-promotion strip with Zynga's own
   callouts. Placement: float-right beside the engineered-K section.
   The company's own exhibit of its growth machine — irreplaceable.
7. `source:` **forms-znga-s1-cityville-energy** — save as
   `zynga-cityville-modal`. Reader must see: 'GET MORE ENERGY!' with
   the pay-or-Ask-Friends choice. Placement: small, beside the
   monetization-coupled-virality paragraph.
8. `draw:` single `<Figure>` — stock path 2011-12 with event pins
   (IPO, Draw Something peak, Credits announcement, Q3 writedown) —
   drawn from the Item 5 quarterly table.

## EXERCISE PLAN

1. Warm-up: from the Item 6 table, compute YoY bookings growth for
   2010–2012 and ABPU (bookings/DAU/day) for 2011 vs 2012 — state
   which direction each moved. (Filing arithmetic.)
2. Boundary probe: with the S-1's DAU definition (double-counted per
   game), construct a scenario where true unique users FALL while
   reported DAUs RISE (cross-promotion pushing multi-game play); name
   the metric (MUU) that catches it and check its 2012 trajectory.
3. Claim to refute: "Zynga died because Facebook killed Credits."
   Using the timeline (bookings decline began BEFORE the June-2012
   announcement; OMGPOP decay; web→mobile shift disclosed in risk
   factors), argue the sharper diagnosis: subcritical engine exposed
   when cross-promotion and platform distribution repriced — cite
   three filed numbers.
4. Derivation the lesson skipped: bookings = revenue + Δdeferred;
   from FY2012 revenue (+12%) and bookings (−1%), compute the change
   in deferred revenue and state what it says about forward demand —
   the accounting identity as a leading indicator (previews
   pnl-and-revenue-recognition).
5. Research-shaped: reproduce the useful-life arithmetic — show how
   shortening durable-goods life 15→12 months pulls deferred revenue
   forward and adds ~$14.1M with zero new cash; compute the
   sensitivity per month of life change given the deferral balance.
6. FORWARD (E7): Zynga's 2012 income statement swings on IPO-triggered
   stock compensation (−$404M net income in 2011 on +$90.6M in 2010's
   operations). Separate operating result from the comp charge using
   the filed add-backs. Solution: reading a non-GAAP bridge without
   being fooled is the WeWork lesson's core skill and the P&L
   lesson's subject; `<Ref>` pnl-and-revenue-recognition,
   wework-s1-reading.
7. Spaced (E3): apply the channel-portfolio dashboard to Zynga-2011:
   estimate the one-counterparty shares (acquisition, revenue,
   contribution) from the S-1 and state the reallocation the model
   would have demanded — then note what the 10-K shows they did
   (With Friends carve-out, mobile) and when (Ref channel-portfolio).
