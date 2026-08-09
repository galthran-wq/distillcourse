# Research brief: wework-s1-reading (Reading an S-1 adversarially: WeWork 2019)

status: planned
module: startup-finance
type: synthesis
goal: Evaluate WeWork's S-1 with the statements toolkit — non-GAAP reconciliations, lease obligations against backlog, related-party disclosures — and reach the verdict before the market did

MID-MODULE APPLICATION. No new theory: the statements toolkit
(lessons 3–6) against the most instructive filing of the decade. The
разбор format: data → tasks → verdict → what actually happened (IPO
pulled Sept 2019, valuation $47B → ~$8B).

## ARC (L10)

- **Inherits:** P&L/rev-rec (non-GAAP ladder), balance-sheet/cash-flow
  (articulation, lease liabilities), burn/runway (the survival read),
  goodharts-law (self-favoring metric design), Zynga's filing-reading
  protocol.
- **Contributes:** Spine step 15's stress test: the toolkit applied
  adversarially — two registers, reconciliation autopsy, duration
  mismatch, related-party arithmetic — reaching the market's verdict
  from the document alone.
- **Hands off:** governance-as-numbers (dual-class, related parties)
  previews cap-table/control terms; "what a valuation claim is made
  of" seeds valuation-multiples-and-dcf.

## APPLICATION spec (L16-style, mid-module)

- **Artifact:** The We Company Form S-1 (Aug 14, 2019), read in full
  by the swarm; all numbers cited below are cached and page-pinned.
- **Module results used:** non-GAAP reconciliation reading (lesson
  pnl), three-statement articulation and lease/working-capital
  mechanics (lesson balance-sheet), burn/runway trajectory (lesson
  burn), vanity-metric diagnostics (Part I).
- **Departure from idealisation:** the course's clean SaaS case has
  short contracts both ways; WeWork's mismatch (15-year liabilities,
  monthly assets) is exactly the structure the toolkit's SaaS
  defaults hide — the lesson names why "SaaS metrics for a real
  estate company" was itself the category error.

## Sources to consult (single source: the cached S-1)

- Front matter: dedication page; the blank red-herring cover.
- Summary/Business: $3T "total opportunity" TAM chart (p.134–135);
  cost-per-employee chart (p.128) with mismatched-measurement
  footnote; committed backlog $0.5B→$4.0B (p.131) paired with a
  self-sourced stat.
- Risk factors: lease term ~15yr vs monthly memberships (p.25);
  $47.2B undiscounted lease obligations vs $4.0B backlog.
- MD&A: KPI definitions (workstations, memberships, run-rate
  revenue); contribution margin's construction; THE Adjusted EBITDA
  reconciliation p.114 — $(34.0)M → $(297.2)M excluding straight-line
  lease cost; "Community Adjusted EBITDA" is NOT in this filing
  (2018 bond memo) — teach the correction.
- Financials: net loss 2018 $1.93B > revenue $1.82B; H1'19 loss
  $904.7M; cash fell 2017→2018 despite $2.66B financing; Note 23
  lease table ~$34.0B; ASC 842 $18.45B discounted (F-pages).
- Related parties: $362.1M Neumann loan (Note 26, one paragraph);
  $500M personal credit line from underwriter affiliates; the 'we'
  trademark $5.9M; ARK/Rhône structure (org chart p.165); 20-votes
  Class B/C with the $1B-charity 10-vote trigger; ~$1.27B of future
  lease payments to insider landlords (June 2019).
- The clean E&Y opinion (F-2), no going-concern — against all of the
  above.
- Governance/comp: Neumann's $50B/$72B/$90B market-cap-triggered
  option tranches vs the $47B last private mark.

## The lesson's task sequence (key points)

1. **Two registers**: put the TAM chart and the lease table side by
   side; the filing contains its own refutation — the reading skill
   is knowing which sections are mandated. Task: classify five given
   excerpts as narrative vs mandated.
2. **Reconciliation autopsy**: walk the nine-quarter Adjusted EBITDA
   table bottom-up; classify the eight add-backs; verdict — even the
   friendliest metric is negative and widening. Task: compute the
   add-back share by class per quarter.
3. **The duration mismatch as the core diagnosis**: $47.2B / 15yr
   fixed vs monthly revenue; compute the coverage ratio (backlog/
   commitments ≈ 8.5%); contrast with a SaaS company where the SAME
   metrics mean the opposite (deferred revenue = customer financing).
   Task: build the mismatch table for WeWork vs Dropbox.
4. **Burn read**: net loss > revenue; financing inflows vs investing
   outflows; H1'19 investing at 3× H1'18 — the trajectory read from
   the burn lesson applied to filed statements. Task: estimate
   months-to-zero at the H1'19 rates absent the IPO.
5. **Related parties and control**: the loan paragraph, ARK, 20:1
   votes, the charity trigger — governance quantified; what the
   clean audit certifies vs what it does not. Verdict task: write
   the three-sentence pass on the offering, then compare with
   September 2019.

## Set pieces / keeper numbers

- $47.2B lease obligations vs $4.0B committed backlog.
- Net loss $1.93B on revenue $1.82B (2018).
- Adjusted EBITDA (most generous flavor) $(34.0)M → $(297.2)M.
- $362.1M loan to the CEO; ~$1.27B insider-landlord lease payments.
- 20 votes/share; falls to 10 if $1B charity pledge missed.
- Verified absence: "Community Adjusted EBITDA" is not in this S-1.

## Pitfalls / subtleties

- Precision discipline: every number page-pinned to the cached
  filing; do not import the folklore version of the story (community
  EBITDA, "tequila" anecdotes — press, not filing).
- WeWork was NOT primarily an accounting fraud story — the S-1
  disclosed everything; the lesson's point is that disclosure ≠
  salience, and the toolkit extracts salience.
- ASC 842 adoption mid-filing changes lease presentation between
  FY2018 and H1'19 statements — one careful sentence, not a detour.
- Stay in the dry register — the material is lurid enough without
  adjectives (L9).

## FIGURE PLAN

1. `draw:` single `<Figure>` — the mismatch chart: liabilities by
   duration (15-yr lease bars) vs revenue by commitment (monthly
   memberships + backlog sliver) on one time axis — the lesson's
   thesis in one picture (our chart from filed numbers).
2. `draw:` single `<Figure>` — the two-register map: the S-1's table
   of contents colored narrative vs mandated, with the five excerpts
   of task 1 pinned to their sections.
3. `source:` **forms-s1-dedication-page** — save as
   `wework-dedication`. Reader must see: "the energy of we" as a
   full page of an SEC filing. Placement: lesson opening, small.
   The register IS the datum.
4. `source:` **forms-s1-adjusted-ebitda-reconciliation** — save as
   `wework-ebitda-recon` (shared crop with the pnl lesson). Reader
   must see: add-back rows, widening negatives. Placement: centered
   in task 2.
5. `source:` **forms-s2-addressable-market-tam** — save as
   `wework-tam-chart`. Reader must see: the nested $1.7T/$3.0T
   circles. Placement: beside task 1; caption: the narrative
   register's flagship exhibit. The persuasive geometry is the
   payload — a redraw would neuter it.
6. `source:` **forms-s3-neumann-loan-subsequent-events** — save as
   `wework-neumann-loan`. Reader must see: the single flat paragraph
   disclosing $362.1M. Placement: float-right in task 5; caption:
   scale vs prose flatness.
7. `draw:` single `<Figure>` — the burn dashboard: filed CFO,
   investing, financing by period as grouped bars with the cash
   balance line — raised $2.66B, cash fell (our chart from F-pages).

## EXERCISE PLAN

1. Warm-up: from the filed figures, compute 2018 net margin, H1'19
   annualized loss rate, and the backlog/commitment coverage ratio.
   (Filing arithmetic once.)
2. Boundary probe: construct the hypothetical where WeWork's SAME
   metrics are healthy — leases 1 year, memberships 3-year prepaid —
   and show the coverage ratio flips above 1; the diagnosis was the
   DURATION STRUCTURE, not the loss (losses alone don't kill —
   Ref burn-runway-default-alive).
3. Claim to refute: "The auditor signed off, so the business was
   sound." State precisely what an unqualified opinion asserts
   (statements fairly presented per GAAP) and exhibit three filed
   facts it correctly coexists with; name the reader whose job the
   audit is not doing.
4. Derivation the lesson skipped: from Note 23's undiscounted $34.0B
   and the ASC 842 discounted $18.45B (wtd. rate ~8%), back out the
   implied average lease duration and check it against the disclosed
   ~15 years — the discounting identity run in reverse.
5. Research-shaped: locate contribution margin's definition in the
   MD&A and recompute it for one quarter WITHOUT the exclusions
   (stock comp, pre-opening); report how the sign changes and write
   the one-sentence rule for when a location-level metric may
   exclude a cost (Part I margins discipline).
6. FORWARD (E7): the S-1's governance section prices control:
   20 votes/share, supermajority provisions, tranches at $50/72/90B.
   Compute Neumann's voting share at IPO from the filed counts.
   Solution: control terms and their price return as the term
   sheet's second half in cap-table-and-dilution and the waterfall
   lessons; `<Ref>` cap-table-and-dilution.
7. Spaced (E3): the "committed revenue backlog" grew 8× while the
   membership term stayed monthly — which vanity-metric diagnostic
   from Part I catches the framing, and what denominator restores
   honesty (Ref goodharts-law).
