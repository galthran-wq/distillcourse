# Research brief: market-revolution (The Market Revolution)

status: planned
module: early-republic
type: core
goal: Explain how transportation, factory labor, and finance transformed the antebellum Northern economy.

## Sources to consult

- **American Yawp Ch.8 "The Market Revolution"** — the spine: transportation and
  industrial transformation, the Erie Canal, wage labor, and the reorganization
  of households and time.
- **Give Me Liberty Ch.9 "The Market Revolution, 1800-1840"** — the freedom
  framing (whether wage labor is freedom), and the transportation-network maps.
- **MIT 21H.101 Week 9** — Thomas Dublin, *Women at Work*, on the Lowell mills:
  the assigned question is whether Lowell really was an egalitarian alternative
  to English factory labor, and whether that character survived to 1860. That is
  a genuinely testable claim and the lesson's best analytic set piece.
- **American Panorama, Canals layer** (dsl.richmond.edu/panorama/canals) — per
  canal, freight tonnage by commodity 1820-1860. The Erie Canal's 1849 total is
  1,622,444 tons. Use the *data*; draw the chart ourselves.
- **Wood, *Empire of Liberty* Ch.9 and Ch.15** — for the social texture: the
  democratization of manners, the rise of the middling sort, and Peale's museum
  as commercial popular culture.

## Key points the lesson must cover

1. **Transport costs collapsed.** The Erie Canal (opened 1825) cut the cost of
   moving a ton from Buffalo to New York City by roughly an order of magnitude
   and cut transit time from weeks to days. Steamboats did the same on western
   rivers; railroads followed from the 1830s. Every other change follows from
   this price change.
2. **What a market economy did to households.** Production moved out of the
   household and into shops and mills; households became buyers of what they had
   made; the cash nexus and store credit reorganized rural life; clock time
   replaced task time.
3. **Wage labor as a new and contested condition.** Lowell's recruitment of
   young farm women into boardinghouse-supervised mill work was explicitly
   marketed as a moral alternative to Manchester; by the 1830s the same workers
   were striking ("turn-outs") and publishing the *Lowell Offering* and labor
   papers. Test the claim rather than repeating the brochure.
4. **Finance and its shocks.** State-chartered banks, note issue, and the credit
   chain that made expansion possible — and the Panic of 1819 and Panic of 1837
   that showed what it cost. Ties forward to the Bank War.
5. **Uneven geography.** The market revolution's benefits were concentrated in
   the North and Northwest; the South's rail and canal network stayed thin
   because its capital was invested in land and people. Set up the sectional
   divergence the next module exploits.
6. **Popular culture as a market product.** Peale's Philadelphia museum, penny
   papers, and the beginnings of a paying mass audience.

## Set pieces and worked examples to recreate

- **The Erie Canal freight ledger** (American Panorama Canals): commodity mix
  1825-1860 — flour and wheat, lumber, agricultural products, manufactures — with
  the 1849 total (1,622,444 tons) called out. The changing commodity mix, not the
  total, is the interesting series: it shows a hinterland becoming a market.
- **The Lowell test** (Dublin via MIT Week 9): state the claim (Lowell as
  egalitarian alternative), give the evidence for (wages, boardinghouses,
  literacy, savings), the evidence against (speed-ups, the 1834 and 1836
  turn-outs, replacement of Yankee women by Irish immigrants after 1845), and
  reach a qualified verdict. This is the lesson's worked example of judging a
  historical claim; the parallel exercise should hand the reader a second claim.
- **A freight-cost computation**: cost per ton-mile before and after the canal,
  worked with real numbers, then repeated by the reader for a different route.
- **Peale's museum** as a commercial venue: paid admission, tens of thousands of
  annual visitors, natural history sold as popular entertainment (Wood Ch.15).

## Pitfalls / subtleties to flag

- "Market revolution" is a historians' periodizing term, not a contemporary one;
  introduce it as such (Charles Sellers's coinage, contested in scope and dating).
- Markets existed before 1815; what changed is scale, speed, and the share of
  household production sold rather than consumed.
- Do not treat the transformation as universally welcomed: it produced real wage
  dependency, deskilling, and periodic destitution, which is why it produced
  labor organizations.
- Distinguish industrialization (factories) from commercialization (market
  participation) — most Americans experienced the second long before the first.
- The Panorama screenshots are Stamen Design's copyrighted interface images:
  cite and link the atlas, but build our own charts from its underlying data.

## FIGURE PLAN

1. `source:` **wood-eol-peale-artist-in-museum** — save as `peale-artist-in-his-museum-1822`.
   Reader must be able to see: Peale lifting the curtain, the ranked specimen
   cases, and the mastodon bones — a paying public attraction. Placement: float
   right in the popular-culture section. (Low priority; drop if the section is
   cut.)
2. `draw:` single `<Figure>` — **transport cost per ton-mile, 1815 vs 1850**:
   wagon, canal boat, steamboat, railroad as four bars with the wagon bar
   dominating. One idea: distance got cheap.
3. `draw:` single `<Figure>` — **Erie Canal freight composition, 1825-1860**: a
   stacked area chart of commodity categories built from the American Panorama
   Canals data, with the 1849 total annotated. Inspiration: the Panorama canal
   panel; our own drawing.
4. `draw:` `<FigureSequence>` (4-5 frames) — **the transportation network fills
   in**: the same base map at 1800, 1825, 1840, 1860, adding roads, then canals,
   then rail; the sparse Southern network visible by the last frame.
5. `draw:` single `<Figure>` — **the Lowell system as a diagram**: recruitment →
   boardinghouse → mill floor → wages → remittance home, with the three pressure
   points (speed-up, wage cut, labor substitution) marked where the turn-outs
   occurred.
6. `draw:` single `<Figure>` — **household production before and after**: two
   panels of the same farm household, with home-produced goods in the first
   replaced by purchased goods in the second, and a cash arrow appearing.
