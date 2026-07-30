# Research brief: redlining (Redlining: New Deal Housing Maps and the Racial Wealth Gap)

status: planned
module: depression-and-war
type: extra
goal: Analyze the HOLC security maps as primary sources and trace their consequences to present-day inequality.

`extra` (starred) chapter: a document-and-data deep dive off the core path. It is
the course's best single demonstration that a primary source can be read as
policy and its effects measured decades later.

THESIS ROLE. The course's premier documents-to-data case study, and the
promise-and-enforcement outcome's economic chapter: the same federal capacity
the thesis credits with building the middle class (mortgage insurance, the GI
Bill's channel) documented writing race into its credit geography — policy
text, maps, and measured present-day gradients, no editorializing needed in
either direction. The method (read the form, then measure the consequence) is
the course's register at its purest.

## Sources to consult

- **Mapping Inequality: Redlining in New Deal America** (DSL Richmond) — the
  entire source base. Read: the **Introduction** (Robert K. Nelson), **"How and
  Why the Home Owners' Loan Corporation Made Its Redlining Maps"** (Todd M.
  Michney), **"Agents of the New Deal Mapping State"**, **"Hotter, Wetter,
  Sneezier, & Wheezier"**, and **"Redlining and Health"**. The site's data:
  10,154 graded polygons across 314 city/state pairs in 42 states; ~8,000 area
  descriptions searchable.
- **American Panorama, "Renewing Inequality"** — urban renewal displacement,
  1950-1966; the Baltimore statistic (74% of 8,600+ displaced families were
  families of color) for the postwar continuation.
- **Kennedy, *Freedom from Fear*, Ch.9** and **American Yawp Ch.23** — for the
  New Deal housing agencies' place in the larger program.
- **Give Me Liberty Ch.21** — the New Deal state's racial boundaries.

## Key points the lesson must cover

1. **The grading scheme, in the surveyors' own words.** A/"Best" (green), lenders
   willing to lend up to 75-80% of appraisal; B/"Still Desirable" (blue), ~65%;
   C/"Definitely Declining" (yellow), characterized by "obsolescence [and]
   infiltration of lower grade population"; D/"Hazardous" (red), "detrimental
   influences in a pronounced degree, undesirable population or an infiltration
   of it", with lenders advised to refuse loans. The term *redlining* is literal:
   grade D was drawn in red ink.
2. **The correction most accounts get wrong.** HOLC did not use these maps to
   deny its own loans — about 90% of its roughly one million refinancings had
   closed before the City Survey began, and the maps were confidential. The
   **FHA** made its own neighborhood-rating maps from 1934 and its underwriting
   rules were what actually shaped lending for decades; the FHA destroyed most of
   its maps after the 1968 Fair Housing Act, which is why the HOLC survey is now
   the largest surviving documentary evidence of redlining. State this plainly.
3. **Race in the criteria, quoted.** Frederick Babcock's *Underwriting Manual*:
   "The infiltration of inharmonious racial groups... tend[s] to lower the levels
   of land values". Area descriptions across dozens of cities downgrade
   neighborhoods for Black, Jewish, Italian, Mexican, and Asian residents.
4. **Who drew the maps.** Local realtors, bankers, and insurance agents as paid
   consultants — a public-private partnership (e.g. Charles B. Shattuck as
   ringleader of 26 realtors in Los Angeles). The federal government
   systematized private industry practice rather than inventing it.
5. **Mechanism, not just correlation.** Mortgage credit availability → who could
   buy → where equity accumulated → what a family could pass on. Homeownership is
   the principal channel of intergenerational wealth in the US, which is how
   1930s credit geography becomes a present-day wealth ratio (the DSL editors
   cite roughly 13:1 median white-to-Black household wealth).
6. **Downstream measurements.** Present-day disparities by former grade in tree
   canopy and surface temperature, asthma and other health outcomes, and the
   routing of urban renewal and interstate highways through C- and D-graded
   areas. These are published findings; cite them as such.
7. **Method as content.** 150+ maps georectified with ~72,000 control points,
   ~230,000 polygon vertices, ~1,000,000 transcribed data points. The labor of
   turning paper archives into queryable spatial data is itself worth showing.

## Set pieces and worked examples to recreate

- **Read one area description form.** The torn "CLARIFYING REMARKS" scan: "The
  particular hazard in the area is racial... but for the racial situation would
  be classed a low yellow... The area is accorded a medium red grade." Worked
  example: identify the stated criterion, the actual criterion, and the credit
  consequence. Parallel exercise: the Tacoma D1 description ("Three highly
  respected Negro families own homes...").
- **Carver Heights, Savannah (area C12)** — the single documented instance across
  200+ surveyed cities where assessors reconsidered a grade "from a negro
  standpoint of home ownership, rather than a white". The exception that
  measures the rule.
- **The "shade" vs. "smoke" search experiment**: searching the 8,000 area
  descriptions for these two words yields inverse grade distributions —
  environmental amenity and burden language tracking the grades. Reproduce as a
  simple bar chart; it is a compact, checkable demonstration.
- **The Daytona Beach non-HOLC map**: explicit "Negro Business Section" labels
  and red used for "Very Good White Residential" — the color convention inverted
  and the euphemism dropped. Proof that coding varied by locality.
- **The FHA Kenosha map (1934)**: same four-grade scheme, predating HOLC's survey.

## Pitfalls / subtleties to flag

- Do not say "HOLC denied loans in redlined areas" — that is the common error the
  source explicitly corrects. Attribute lending effects to the FHA and private
  practice, with HOLC's maps as evidence of the shared criteria.
- Redlining did not create segregation; racial covenants, violence, zoning, and
  realtor practice preceded it. It federalized and systematized it.
- Correlation between 1937 grades and 2020s outcomes runs through many
  intervening causes (urban renewal, highways, disinvestment, later lending
  discrimination); state the chain rather than implying direct causation.
- Grade D areas were not all Black, and grade A areas were not all wealthy;
  quote the actual criteria rather than generalizing.
- The map scans are public domain (NARA City Survey Files); the interface
  screenshots and the Panorama images are not. Credit accordingly.

## FIGURE PLAN

Artifact-heavy by design: the documents *are* the lesson.

1. `source:` **mapineq-decatur-holc-map-1937** — save as `holc-decatur-1937`.
   Reader must be able to see: the four-color grading across the city, the
   legend, and the title block with the July 1937 date. Placement: centered,
   introducing the genre.
2. `source:` **mapineq-area-description-clarifying-remarks** — save as
   `holc-area-description-remarks`. Reader must be able to see: the typed
   "CLARIFYING REMARKS" field and the sentence naming the hazard as racial.
   Placement: centered, as the object of the worked reading. This is the lesson's
   single most important image.
3. `source:` **mapineq-fha-kenosha-1934** — save as `fha-kenosha-1934`. Reader
   must be able to see: the same A-D color scheme with a 1934 date, predating the
   HOLC survey. Placement: float right beside the HOLC-vs-FHA correction.
4. `source:` **mapineq-daytona-beach-non-holc-map** — save as
   `daytona-beach-non-holc-map`. Reader must be able to see: the hand-lettered
   key naming "Negro Business Section" and "Negro Residential Section", and red
   used for white residential areas. Placement: centered in the
   local-variation section.
5. `source:` **mapineq-fhlbb-review-1936-article** — save as
   `fhlbb-security-maps-1936`. Reader must be able to see: the article title
   "Security Maps for Analysis of Mortgage Lending Areas" and the federal
   deposit stamp. Placement: float left; evidence that security mapping was
   promoted as national best practice.
6. `source:` **panorama-holc-redlining-philadelphia-1937** — save as
   `holc-philadelphia-1937`. Reader must be able to see: a second city's map so
   the reader can compare grading patterns. Placement: beside the Decatur map or
   in an exercise. Optional — drop if the lesson already carries five sourced
   images comfortably.
7. `draw:` single `<Figure>` — **the four grades**: A-D as a legend card with
   each grade's color, official label, quoted defining phrase, and the
   loan-to-appraisal figure lenders were advised to offer.
8. `draw:` single `<Figure>` — **"shade" vs. "smoke"**: two small bar charts of
   grade distribution for each search term, side by side, with the inversion as
   the payoff. Reproducible live on the site's own search tool.
9. `draw:` `<FigureSequence>` (4 frames) — **from grade to gap**: 1937 grade →
   mortgage credit availability → who buys and where equity accrues → 2020s
   household wealth and neighborhood temperature. One link per frame, with the
   intervening causes named on the arrows so the chain is not oversimplified.
10. `draw:` single `<Figure>` — **the archive as data**: 150+ maps, ~72,000
    control points, ~7,500 graded neighborhoods, ~1,000,000 transcribed data
    points, shown as a pipeline from paper scan to queryable polygon.
