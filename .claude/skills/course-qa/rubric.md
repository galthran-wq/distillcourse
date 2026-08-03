# QA rubric

Score each item PASS / WEAK / FAIL / N-A with quoted evidence.

## Opening & register
1. The first paragraph states precisely what problem the lesson solves, in
   declarative sentences. Flag any rhetorical question or teaser here as
   FAIL (L3).
2. Formalism never precedes the concrete instance that grounds it (L4): find
   the first formula and check what stands before it.

## Substance & structure
3. Everything serves the single stated goal (L1); name any section serving a
   different goal.
4. The chapter is substantial (L2): would it hold its own next to a good
   textbook's treatment at this level? Name what's missing if not.
5. Environments are honest (L5): definitions precise, theorems stated with
   hypotheses, proofs real (or labeled sketches); no theorem-dressing on
   non-mathematical material.

## Exercises
6. Most exercises require production IN THE DISCIPLINE'S METHOD (E2, domain
   overlay): math — computation / strategy-choice / explain-why / error
   diagnosis / transfer; history — retrieval-chronology / document
   reasoning / synthesis-argument. At least one is genuinely parallel to a
   worked example (L7). Flag as FAIL any transplanted-arithmetic exercise
   (plug-constant estimates whose calculation tests nothing the discipline
   cares about); in history, a computation passes only if the calculation
   is itself the historical argument and the solution states uncertainty.
7. From the course's 3rd lesson on: ≥1 exercise requires an earlier lesson's
   concept to solve, not just mentions it (E3); mid-course lessons mix
   confusable types without naming the required method.
8. Every solution shows the full path, to the worked-example standard (E4);
   no trick questions (E5).

## Visuals & demos
9. Each visual carries an idea; captions state facts or tasks, not
   descriptions (L6).
10. Demo (if present) makes dynamic behavior visible that a figure couldn't
    (D1), starts alive (D3), and any task stated in prose is achievable (D4).

## Density & scannability (voita-playbook norms)
11a. Cadence: no more than 3 consecutive prose paragraphs anywhere without
    a figure/callout/environment/heading break; sections over ~200 words
    have `###` subheaders. Quote the worst run.
11b. Skeleton test: strip everything but headings, callout one-liners, and
    figure captions — does the remainder reconstruct the argument without
    opening a single fold? Quote the skeleton if it fails.
11c. Typed emphasis: bold only payoff-words/run-in labels, italic only
    first-use terms, inline code for literal tokens; em-dashes ≤~3 per
    1,000 words. Flag violations with quotes.

## Prose craft & references
11. Dry engineering register (L9): declarative facts throughout. Flag every
    rhetorical question, tease, narrative framing, or chatty aside with the
    quoted sentence; jargon defined at first use; no filler.
12. References are real, relevant, and chapter-precise (L8) — spot-check that
    each cited work exists and covers the claimed material.

## Course-level (whole-course reviews only)
13. Lessons 1–2 are the most polished and gentlest entry (C3).
14. Spiral: second-half lessons reinforce first-half concepts in course.yaml
    AND in actual exercises (C5, E3).
15. No count cap, but no padding or micro-slicing either (C2 — each lesson
    has one substantive goal); every outcome claimed and actually served (C1); all
    titles are precise technical noun phrases (C6).

## Arc (L10 — throughline)

- **A1 (required)**: the paragraph after the opening places the lesson in the
  course's argument — inherits / open question / contribution — consistent
  with the `spine` in course.yaml. A content-map paragraph ("The route: …")
  alone fails this.
- **A2 (required)**: sample three `##` seams: each section's first sentence
  ties to the running question or the previous section. A cold definition or
  fresh-start fact fails the seam. Where the section's material breaks the
  reader's natural expectation, the seam must state the expectation and
  break it (L10b reversal) — an itinerary seam in front of
  expectation-breaking material is a WEAK; a manufactured reversal in front
  of neutral material is a FAIL.
- **A3 (required)**: the last content section ends with the hand-off — what is
  established, what the next lesson takes up — and it matches the spine.
- **A4 (advisory)**: section headings are claims where the material allows
  ("Tobacco set the Chesapeake's demography"), not bare topics ("Tobacco").
- **A5 (required)**: sample two body sections and apply the L10e cover
  test — hide the seam sentence and the section's last sentence; the body
  must still show its bearing on the lesson's argument. An inventory-shaped
  section (facts cataloged, bearing invisible) is a required fix.
- **Read-through test (required)**: read the CLOSING section of the previous
  lesson, then this lesson's opening — judge the join as a reader. A join
  that requires the reader to guess why this lesson follows fails.

## Attribution (L8a)

- **T1 (required)**: no mid-prose citations of the course's secondary
  surveys or syntheses ("The American Yawp describes…", "Johnson's history
  opens with…") — narrative facts are stated directly and sourced in
  References. Inline naming passes only where provenance is content: primary
  artifacts read or quoted, measurements whose method carries the argument,
  named theses under discussion.

## Anchoring (L11)

- **N1 (required)**: sample three paragraphs dense with proper nouns; every
  place name is anchored (locator figure or relative clause), every event
  carries its date and a what-happened clause at first mention.
- **N2 (required)**: no paragraph introduces more than ~3 new named terms;
  foreign institutions are glossed at first use and given their own
  paragraph beat.
- **N3 (required)**: material established in earlier lessons is recalled
  with an explicit <Ref> and a reminder clause, not assumed ("the conquests
  of Mexico and Peru" without date or Ref fails).

## Evidence budget (L12)

- **M1 (required)**: sample numeric sentences — every number in prose
  carries its frame (unit, denominator, comparison, or consequence) in the
  same sentence. An unframed count ("about 400 were killed") is a required
  fix.
- **M2 (required)**: the lesson's keeper numbers are identifiable and live
  in KeyFacts/figures; prose is not carrying unframed precision that a
  figure or aside should hold.
- **M3 (required)**: no data-row narration of human events — casualties,
  migrations, and battles are scenes or judgments with at most one framed
  number each.
- **M4 (required)**: deletion test — sample five body-prose details
  (numbers, dimensions, names, curios) and ask: would deleting this impair
  an objective, an inference, or a later exercise? Each "no" is a seductive
  detail: required fix (cut, or move to a labeled Aside). Charts and
  figures are exempt — a dense series in a figure is the correct home.
- **M5 (required)**: visible-not-legible — every sourced raster passes the
  figures.md test: the caption names a VISIBLE fact the reader is meant to
  see (a face, place, object, scene, map shape, mark). A scan whose content
  is its text (title page, manuscript leaf, printed page) is a required
  fix: quote the text in prose, cut the scan — unless the visible features
  themselves are the evidence and the caption reads them.

## Refutation & register (L13, L14)

- **R1 (advisory)**: where the material meets a documented popular
  misconception, the lesson refutes it explicitly (schema: misconception
  stated once → rejection → why it fails → replacement). A strawman "some
  believe…" with no documented currency is an L9 FAIL.
- **R2 (advisory)**: importance is marked by device shift (withdrawn
  apparatus, stable container grammar — never the same box style for
  essential and optional material), not by intensifying adjectives. Flag
  intensifier-marked importance with quotes.
