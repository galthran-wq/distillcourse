# Research brief: union-victory (Total War and Union Victory, 1863-1865)

status: planned
module: civil-war-and-reconstruction
type: core
goal: Explain why the Union won — total war on Confederate resources, the 1864 election, and the meanings Lincoln gave the war.

## Sources to consult

- **McPherson, *Battle Cry of Freedom*, Ch.21-28** — Gettysburg and Vicksburg
  (Ch.21), Chickamauga and Chattanooga (Ch.22), war-weariness (Ch.23), the
  Overland Campaign (Ch.24), the 1864 stalemate and election politics (Ch.25),
  the fall of Atlanta and Lincoln's re-election (Ch.26), Sherman's march (Ch.27),
  Appomattox (Ch.28). McPherson's contingency claim — Atlanta saved Lincoln's
  re-election and with it the Union's political will — is this lesson's spine.
- **Blight, HIST 119 Lectures 14, 17-19** — the 1863 turning points, hard war and
  its social impact, why the Union won and the Confederacy lost, and "To
  Appomattox and Beyond".
- **Library of Congress Lincoln Papers** — Gettysburg Address Nicolay copy
  (mal4356500), Second Inaugural manuscript (mal4361300), Everett's November 20
  1863 letter, and the Blind Memorandum (Aug 23, 1864).
- **American Yawp Ch.14** — closing sections.
- **Milestone Documents** #35 Articles of Agreement for the Surrender of the Army
  of Northern Virginia.

## Key points the lesson must cover

1. **1863's turning points and their limits.** Gettysburg (51,000 casualties,
   the war's bloodiest battle) and Vicksburg (splitting the Confederacy and
   completing Union control of the Mississippi) ended Confederate offensive
   capacity — but not the war, which ran two more years. Say what each did and
   did not decide.
2. **Total war as strategy.** Grant's Overland Campaign accepting attrition
   (Cold Harbor: about 7,000 Union casualties in roughly thirty minutes, the
   decision Grant most regretted); Sherman's march from Atlanta to Savannah and
   through the Carolinas as an attack on resources, morale, and slavery's
   economic base. Define "hard war" precisely: the target set widened from armies
   to the war-making society, while deliberate mass killing of civilians remained
   outside it.
3. **The 1864 election was the Confederacy's last strategy.** In August 1864
   Lincoln wrote and had his cabinet blindly endorse the memorandum expecting
   defeat; the Democratic platform called the war a failure; Atlanta fell on
   September 2 and Lincoln won 212-21 in the electoral college. A national
   election held in the middle of a civil war is itself a fact worth stating.
4. **Why the Union won.** Combine: material capacity converted into logistics;
   emancipation and 200,000 Black soldiers converting a Confederate resource into
   a Union one; naval blockade; the failure of cotton diplomacy after Antietam;
   Confederate internal division and inflation; and, decisively, Northern
   political will holding through November 1864.
5. **The war's meanings, in Lincoln's own words.** The Gettysburg Address (272
   words; Everett's letter conceding he had not come as near "the central idea of
   the occasion, in two hours" as Lincoln in two minutes) and the Second
   Inaugural's theology of national guilt and "with malice toward none".
6. **The cost.** ~750,000 dead by Hacker's revised estimate (superseding the
   older 620,000); roughly 2% of the 1860 population; the largest cause of
   death was disease. Appomattox terms; Lincoln's assassination five days later.

## Set pieces and worked examples to recreate

- **The casualty-scale infographic** (Blight L1): 620,000 → ~750,000, the 23,000
  candles lit annually at Antietam for the battle's eight deadliest hours, and
  the ~65,000 Civil War books published since Appomattox.
- **The Blind Memorandum** as a worked document: what Lincoln expected, what he
  committed his cabinet to, and what changed within two weeks.
- **Atlanta → election** as a counterfactual set piece (McPherson Ch.26): state
  the causal claim, the evidence for it, and what a negotiated peace would have
  meant for emancipation.
- **The Gettysburg Address, read structurally**: four score / dedication / the
  living's task — 272 words diagrammed against Everett's two-hour oration.
- **"Bottom rail on top dis time!"** (Yawp Ch.14) — a freedman's line to his
  former enslaver; the inversion of power in one sentence.
- **The first Memorial Day** (Blight L19): Black Charlestonians honoring Union
  dead on May 1, 1865 — introduce it here and hand the erasure to
  civil-war-memory.

## Pitfalls / subtleties to flag

- Do not let hindsight flatten 1864: through the summer, informed observers on
  both sides expected Lincoln to lose.
- "Total war" is a contested label for Sherman's campaigns; state what was and
  was not targeted (property and infrastructure yes; systematic killing of
  civilians no) rather than using the phrase as a verdict.
- Casualty figures vary by source and definition; give the revised estimate with
  its author and note the disease share.
- The surrender at Appomattox did not end the war — Confederate forces
  surrendered over the following weeks — and it did not settle the terms of
  peace, which is the next lesson's subject.
- Avoid treating the Gettysburg Address as self-evidently great; show what
  argument it makes (the war as a test of whether such a nation can endure, and
  a refounding on the Declaration's premise).

## FIGURE PLAN

1. `source:` **loc-lincoln-gettysburg-nicolay-copy** — save as
   `gettysburg-nicolay-copy`. Reader must be able to see: the Executive Mansion
   letterhead with the blank date and the opening line in Lincoln's hand.
   Placement: centered in the Gettysburg section; caption notes it is one of five
   manuscript copies and arguably the reading copy.
2. `source:` **loc-lincoln-second-inaugural-manuscript** — save as
   `second-inaugural-manuscript-1865`. Reader must be able to see: the
   "Fellow Countrymen" heading and Lincoln's hand. Placement: float right beside
   the Second Inaugural analysis.
3. `source:` **loc-lincoln-gardner-portrait-1865** — save as
   `lincoln-gardner-1865`. Reader must be able to see: Lincoln holding spectacles
   and pencil, weeks before his death. Placement: float left at the closing
   section. (Small file — check rendered size; drop if it prints too small.)
4. `draw:` single `<Figure>` — **the cost, to scale**: US war deaths across all
   American wars as bars with the Civil War's ~750,000 dominating and the 1860
   population share annotated. Idea from Blight L1's scale figures.
5. `draw:` `<FigureSequence>` (5 frames) — **1864 in five moves**: Overland
   Campaign attrition → Cold Harbor → the Blind Memorandum (Aug 23) → Atlanta
   falls (Sept 2) → the November result. Each frame adds one event and updates a
   small "Lincoln's re-election odds as contemporaries saw them" bar.
6. `draw:` single `<Figure>` — **Sherman's march as a target list**: the route
   from Atlanta to Savannah to Columbia with the categories destroyed (railroads,
   mills, stores, plantations) tallied, and the categories excluded stated.
7. `draw:` single `<Figure>` — **why the Union won**: five contributing factors
   as weighted bars (logistics, emancipation and Black enlistment, blockade,
   Confederate internal collapse, Northern political will), with the note that
   the last was the one that could have failed.
8. `draw:` single `<Figure>` — **272 words against two hours**: a proportional
   comparison of the Everett oration and the Gettysburg Address with the
   Address's three-part structure labeled.
