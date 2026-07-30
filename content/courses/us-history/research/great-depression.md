# Research brief: great-depression (The Great Depression)

status: planned
module: depression-and-war
type: core
goal: Explain the causes of the crash and depression, Hoover's response, and the uneven suffering that followed.

## Sources to consult

- **Kennedy, *Freedom from Fear*** — **Ch.1** (the eve: 1920s fragilities),
  **Ch.2** "Panic" (the 1929 crash and aftermath), **Ch.3** "The Ordeal of
  Herbert Hoover" (associationalism, the RFC, the Bonus Army, the 1932 collapse),
  **Ch.4** "Interregnum" (the 1932-33 lame-duck banking crisis), **Ch.6** "The
  Ordeal of the American People" (migration, family strain, everyday suffering).
- **American Yawp Ch.23 "The Great Depression"** — the spine, including the
  Dust Bowl migration section and its Lange photo essay.
- **Give Me Liberty Ch.20** — the collapse of business-culture freedom claims.
- **MIT 21H.102 Session 11** — reading-list level only.

## Key points the lesson must cover

1. **The crash and the depression are two different events.** October 1929 wiped
   out paper wealth concentrated among a small share of households; the
   depression that followed came from collapsing demand, a banking system with
   thousands of undiversified unit banks and no deposit insurance, debt
   deflation, a contracting money supply, and the international gold-standard
   transmission mechanism (plus Smoot-Hawley's contribution to the trade
   collapse). State the mechanism chain explicitly.
2. **Scale.** Output down roughly a third 1929-1933; unemployment ~25% at the
   trough and ~50% for Black workers in 1932; roughly 9,000 bank failures;
   farm prices down more than half. Numbers first, images second.
3. **Hoover reassessed.** Kennedy's argument: a sincere, activist engineer-
   president constrained by associationalist doctrine (voluntary cooperation over
   compulsion) and by balanced-budget and gold-standard orthodoxy. He did more
   than any predecessor — the RFC, public works, the Federal Home Loan Bank
   system — and far less than the situation required. Reject the do-nothing
   caricature and the rehabilitation both.
4. **The Bonus Army (1932).** Veterans camped in Washington demanding early
   payment of their bonus; the Army under MacArthur burned the Anacostia camp
   with the Capitol dome in view. The image ended Hoover politically.
5. **The interregnum.** The four-month lame-duck gap between the November 1932
   election and the March 1933 inauguration, during which the banking system
   disintegrated state by state — an institutional failure that produced the 20th
   Amendment. Kennedy treats this as a case study in what happens when authority
   has passed but power has not.
6. **Uneven suffering.** Black unemployment at twice the national rate and
   "last hired, first fired" practice; Mexican and Mexican-American repatriation
   (hundreds of thousands, including US citizens); women's paid work attacked as
   taking men's jobs; Dust Bowl ecology and migration — Oklahoma lost 440,000
   people, 18.4% of its 1930 population.
7. **How it was documented.** The FSA photography program produced the images
   that became the Depression's public memory. Treat the photographs as
   commissioned documentary evidence with a purpose, not as neutral windows.

## Set pieces and worked examples to recreate

- **The transmission chain, worked**: from a bank failure in one county to
  deposit loss, credit contraction, cancelled orders, layoffs, and further
  defaults. Worked example: trace one shock through the chain; parallel exercise:
  trace the same shock in a system with deposit insurance (forward reference to
  new-deal).
- **The Bonus Army photograph** with the Capitol in frame — composition as
  indictment.
- **Lange's Dust Bowl sequence** (Yawp Ch.23): destitute pea pickers, the family
  walking across Oklahoma, and *Migrant Mother*, treated as a documentary essay
  about internal migration. Include the fact that the FSA commissioned the work
  and that Lange's caption identified a specific woman (Florence Owens Thompson),
  later interviewed about the photograph's use.
- **Oklahoma's 18.4% population loss** paired directly with the photographs, so
  the image has a magnitude attached.
- **Black unemployment at ~50% vs. ~25% nationally in 1932** — one line, quoted
  with its source.

## Pitfalls / subtleties to flag

- The crash did not cause the Depression by itself; a lesson that stops at
  October 1929 has explained nothing.
- Monetary (Friedman-Schwartz), Keynesian demand, debt-deflation, and
  gold-standard accounts are complementary rather than mutually exclusive here;
  present the mechanisms, note that weighting them is contested.
- Do not use Depression photographs as decoration: each one used must be
  identified, dated, and attributed to the FSA program with its purpose stated.
- Dust Bowl migrants were a minority of Depression migrants and most Californian
  arrivals were not Dust Bowl refugees; keep the proportion honest.
- Hoovervilles, Hoover blankets, and similar coinages are evidence of political
  blame, not of policy content.

## FIGURE PLAN

1. `source:` **ffear-bonus-army-anacostia-fire** — save as
   `bonus-army-anacostia-1932`. Reader must be able to see: the burning camp with
   the Capitol dome behind it. Placement: centered in the Hoover section. The
   juxtaposition in one frame is the argument.
2. `source:` **ffear-dust-bowl-stratford-1935** — save as
   `dust-storm-stratford-1935`. Reader must be able to see: the storm front
   towering over the town. Placement: float right beside the Dust Bowl section;
   caption gives the date and the surveying agency.
3. `source:` **yawp-migrant-mother** — save as `lange-migrant-mother-1936`.
   Reader must be able to see: Florence Owens Thompson and the two children
   turned away. Placement: centered, closing the migration section. Caption must
   name the FSA commission, the sitter, and the date.
4. `draw:` single `<Figure>` — **the four series**: real GDP, unemployment,
   bank failures, and the price level, 1929-1933, as four small aligned panels
   sharing one time axis. One idea: everything fell together.
5. `draw:` `<FigureSequence>` (5 frames) — **the transmission chain**: bank
   failure → deposits lost → credit contracts → orders cancelled → layoffs →
   defaults feeding back to banks. One arrow added per frame, closing the loop in
   the final frame.
6. `draw:` single `<Figure>` — **unemployment was not evenly shared**: national,
   Black, and by-region rates in 1932 as bars, with the ~25% / ~50% contrast
   stated.
7. `draw:` single `<Figure>` — **Hoover's toolkit**: what he did (RFC, public
   works, Federal Home Loan Banks, voluntary wage agreements) against what
   associationalist and balanced-budget doctrine ruled out (direct relief,
   deficit spending, leaving gold).
8. `draw:` single `<Figure>` — **the interregnum**: a November 1932 to March 1933
   timeline with bank holidays declared state by state, the count rising to
   near-total closure by inauguration day. Idea from Kennedy Ch.4.
