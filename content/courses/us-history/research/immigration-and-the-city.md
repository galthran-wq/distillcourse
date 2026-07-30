# Research brief: immigration-and-the-city (Immigration and the Industrial City)

status: planned
module: industry-and-empire
type: core
goal: Analyze the new immigration and urbanization with flow data, and the exclusion politics they triggered.

Carries outcome co-data. Demo (ImmigrationWaves) specced in course.yaml — the
prose must set a concrete task ("find the decade the quota law bites") before
open exploration.

THESIS ROLE. Thesis element (4), immigration at continental scale, measured:
tens of millions of arrivals building the industrial cities and labor force
the previous lesson's expansion ran on — the data-first treatment (waves,
origins, return migration) IS the thesis's evidence here. The exclusion
politics stay in the same frame as documented institutional choices (the
Chinese Exclusion Act through the 1924 quotas), the boundary-drawing the
course tracks alongside every expansion.

## Sources to consult

- **American Yawp Ch.18 "Industrial America"** — urbanization, immigration,
  technology, the New South.
- **American Panorama, "Foreign-Born Population, 1850-2010"**
  (dsl.richmond.edu/panorama/foreignborn) — county-level foreign-born density,
  origin-country breakdowns by place and year, and migration-flow arcs. This is
  the lesson's quantitative backbone; build our own charts from its data.
- **MIT 21H.102 Lecture 6** — the "incorporation of people" strand: immigration
  and urbanization as inputs to industrial capitalism.
- **Give Me Liberty Ch.17 "Freedom's Boundaries, at Home and Abroad"** — the
  1890s politics of who belongs.
- **Milestone Documents** #43 Chinese Exclusion Act (1882).

## Key points the lesson must cover

1. **Two waves, distinguished by data not by adjective.** Pre-1880 arrivals came
   overwhelmingly from Ireland, Germany, Britain, and Scandinavia; after 1880 the
   composition shifts to Italy, Austria-Hungary, Russia and Poland (including
   about two million Jews fleeing pogroms and restriction), plus Mexican and
   Asian migration in the West. Show the composition shift with the Panorama
   data rather than asserting it.
2. **Where they went and why.** Chain migration into industrial cities; the
   foreign-born share exceeding a third of the population in New York, Chicago,
   and Milwaukee; the neighborhood as an institution (mutual aid societies,
   foreign-language press, parishes and synagogues).
3. **The tenement city.** Dumbbell tenements, density figures, water and sanitation,
   mortality; the 1901 Tenement House Act as the first serious regulatory
   response. Riis's photographs as the reform mechanism (analyzed in
   capital-and-labor; cross-reference here rather than repeating).
4. **Return migration and the sojourner pattern.** A large share of arrivals —
   for some nationalities a third or more — returned home. This complicates the
   "nation of immigrants who came to stay" story and is visible in the data.
5. **Exclusion politics.** The Chinese Exclusion Act (1882) as the first
   race-based bar, its 1892 and 1902 extensions, and the Gentlemen's Agreement
   (1907); the literacy-test campaigns; the rise of racial "science" underwriting
   restriction. Ends in the 1921/1924 quotas (the-twenties lesson).
6. **The urban political machine.** Tammany-style machines exchanging services
   for votes — corrupt by reform standards and functional as an unofficial
   welfare system; a real analytic tension worth stating rather than resolving.

## Set pieces and worked examples to recreate

- **A composition computation** from the Panorama Foreign-Born data: pick a city
  and year (its published example is San Francisco 1960; use a Gilded Age city
  such as New York 1890) and read off the top origin countries and counts. Worked
  example: state what the composition implies about labor markets and politics;
  parallel exercise: repeat for a different city or decade.
- **Chinese Exclusion read closely**: the Act's text names a nationality — quote
  the operative clause, then compare with the euphemistic drafting of EO 9066 in
  the wwii-home-front lesson. Two ways a state writes exclusion.
- **The tenement floor plan** as an artifact of regulation: the dumbbell design
  as an engineered response to an 1879 light-and-air rule that produced airshafts
  nobody could breathe in.
- Cameron Blevins's critique of reading these maps as showing a "welcoming"
  America is worth one sentence: the data show arrival, not reception.

## Pitfalls / subtleties to flag

- "New immigration" is a contemporary period label with nativist baggage; use it
  as a historians' term and say what it denotes.
- Do not treat the foreign-born share as monotonic: it peaked around 1890-1910,
  collapsed after 1924, and only recovered late in the twentieth century — the
  shape is the point, and the demo should make it visible.
- Immigrants were not only urban and industrial: substantial agricultural
  settlement in the Midwest and Plains, and Mexican migration in the Southwest,
  belong in the picture.
- Machine politics should be analyzed, not moralized in either direction.
- The Panorama screenshots are Stamen's copyrighted interface; build our own
  charts and link the atlas.

## FIGURE PLAN

1. `source:` **panorama-foreign-born** — save as `panorama-foreign-born-interface`.
   Reader must be able to see: the origin-country arcs, the county density map,
   the per-country counts, and the 1850-2010 time series. Placement: centered in
   the methodology/data section, credited to DSL/Stamen with a link. NOTE:
   publisher-copyright screenshot; if licensing is a concern, drop it and rely on
   drawn figures 2 and 3, linking the live atlas.
2. `draw:` single `<Figure>` — **foreign-born share of the US population,
   1850-2010**: one line with the 1890-1910 peak, the post-1924 collapse, the
   1970 trough, and the recent rise annotated. The demo animates this; the figure
   fixes it.
3. `draw:` `<FigureSequence>` (4 frames) — **origins shift**: stacked composition
   bars for 1860, 1880, 1900, and 1920, each frame changing only the composition,
   so the northwestern-to-southeastern European shift is a visible delta.
4. `draw:` single `<Figure>` — **the dumbbell tenement**: floor plan with the
   airshaft, room count, and typical occupancy labeled, plus the density figure
   for a Lower East Side block.
5. `draw:` single `<Figure>` — **arrivals and departures**: gross arrivals against
   estimated return migration by nationality, showing the sojourner pattern.
6. `draw:` single `<Figure>` — **the exclusion ladder**: 1875 Page Act → 1882
   Chinese Exclusion → 1892/1902 extensions → 1907 Gentlemen's Agreement → 1917
   literacy test → 1921/1924 quotas, as a single timeline with each measure's
   target group named. Ends with a forward pointer to the-twenties.
