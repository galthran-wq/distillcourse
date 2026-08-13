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

## Exercise difficulty (E6, E7)

- **X1 (required)**: count the mechanical items — exercises whose work is
  substituting numbers into a formula the lesson displayed. More than one
  per set is a required fix. Quote them.
- **X2 (required)**: the set carries ≥2 of {boundary probe at a degenerate
  case; plausible false claim to refute; derivation the lesson skipped;
  research-shaped task}. Name which, or fail.
- **X3 (required)**: exactly one exercise reaches forward (E7) — the reader
  computes the object a later lesson names, or hits the wall its mechanism
  removes — and the solution says so with a `<Ref>`.

## Callouts & citations (L15, L8a a/b, L9a)

- **K1 (required)**: apply the deletion test to every `<KeyFact>`,
  `<Remark>`, `<Aside>`: does it carry a synthesis, a boundary, or a
  forward consequence the body lacks? A restatement of the preceding result
  is a required fix (cut or upgrade). Quote the worst offender.
- **K2 (required)**: no citation-for-its-own-sake — every inline source
  pointer buys the reader an alternative proof, a stronger statement, the
  origin of the notation, or something checkable. Borrowed proofs are
  attributed in the environment title, not in prose.
- **K3 (required)**: no narration of the obvious ("in expectation
  notation…", "recreated below", "does the work") and no idiom-for-flavour.
  Quote every instance.

## Visuals & demos
9. Each visual carries an idea; captions state facts or tasks, not
   descriptions (L6).
10. Demo (if present) makes dynamic behavior visible that a figure couldn't
    (D1), starts alive (D3), and any task stated in prose is achievable (D4).
    FAIL a demo whose only content is knobs on a curve the lesson already
    plots: it must let the reader hit a target, falsify a claim, find a
    threshold, or lose against a bound, with the prose asking for it first.

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

## Lab lessons (`type: lab`)

A lab is a 3–5 hour Jupyter assignment; the MDX is a brief and the teaching
happens in the notebook. On a lab lesson this section REPLACES the chapter
items above, except four that still apply to `lesson.mdx`: 1 (opening), 12
(references, where the brief cites), A1 (placement in the course's argument),
A3 (hand-off to what follows). Score the remaining chapter items N-A in one
line, not item by item. Register is scored here, as B6, over the brief and
the notebook's markdown cells together.

Read in this order: the brief; the `lab` block in `course.yaml` (checkpoint
list, `text` lines, `required` flags, `est_hours`); the generated
`labs-dist/public/<course>/<lesson>/lab.ipynb` end to end as the learner —
scaffold, prose, plots, hints, and nothing else; only then `solution.py` and
`challenges.yaml`, for what the learner cannot see (cut spans, wrong
variants, thresholds, rubrics). Reading the solution first is how a reviewer
misses that the cut version is unsolvable. Where no notebook can be generated
— a lab that is not a course lesson, such as the lab-author skill's own
example — read `solution.py` with the marked spans cut by hand instead.

- **B1 — One artifact (required)**: name what exists at the end that did not
  exist at the start. A tour of disconnected exercises — three unrelated
  functions sharing a dataset — fails here however good each exercise is.
- **B2 — Progression (required)**: warm-up `exact` checkpoints (one function,
  instant verdict) → composition → one open `metric` task last. Name the
  composition edges: which checkpoint's output is consumed by which later
  one. No edge is a FAIL — B1 failing again, in the verification contract.
  On the flags: the open task and any `review` checkpoint are `required:
  false`; a required checkpoint the hint ladder cannot rescue, or a set where
  everything is required, is a FAIL. Each `text` line in `course.yaml` names
  a step of the build ("gradient of the log-loss"), not an ordinal.
- **B3 — Honest difficulty (required)**: count the blanks and their depth (a
  vectorized function with a shape contract ≈ 20–40 min; an open modeling
  task ≈ 1–2 h), total them, and hold the total against `est_hours` and the
  3–5 h target. Two explicit fails: (a) the Ng floor — a blank that is one
  line inside a pre-written loop, where the learner transcribes a spec
  instead of writing the function; quote every one; (b) a difficulty cliff —
  a step whose depth jumps with no hint ladder (strategy → pseudocode →
  last-resort snippet) after it. Under ~3 h of honest work is a required fix,
  and the fix is deeper checkpoints, never more prose.
- **B4 — Scaffold (required)**: every blank sits behind a fixed signature and
  a docstring carrying Args/Returns with shapes. Judge the CUT cells: is what
  surrounds the blank still a map — imports present, call site visible, data
  in scope, the return contract stated — or did the cut take the argument
  with it? Free-form cells (no signature, no contract) are legitimate only in
  the final open task; anywhere else they are a FAIL.
- **B5 — Feedback (required)**: wherever a canonical bug exists (sign
  dropped, normalization forgotten, off-by-one in indexing, threshold before
  the sigmoid), `challenges.yaml` declares a `wrong` variant for that
  checkpoint. Name each missing one concretely — the bug a learner will write
  and the checkpoint that will answer it with nothing but ✗. Then read the
  hints that do exist: a hint names the bug ("lost the minus before the
  mean") and leaks neither the expected value nor the line to type.
- **B6 — Prose (required)**: the formula stands immediately before the blank
  it motivates, in the same cell or the one above; a plain-English
  restatement precedes every LaTeX block; the dataset arrives with a
  one-paragraph cover story (what it is, how it was measured, what one row
  means) before it is used; non-goals are explicit where a library call would
  dissolve the task. Register is `docs/pedagogy.md`'s — dry, declarative —
  across the brief and the notebook markdown alike; quote every rhetorical
  question, tease, or chatty aside.
- **B7 — Plots as infrastructure (required)**: plotting helpers ship
  complete — a blanked plotting function is a FAIL, because the learner
  debugs WITH the plot — and one helper is used to show both the correct
  shape and a broken one (diverging loss, a flat learning curve), so the
  learner knows what wrong looks like before they produce it. The `metric`
  task pairs its score with a plot of the same quantity, drawn from the
  learner's own results.
- **B8 — `review` rubrics are gradeable (required)**: for each `review`
  checkpoint, read the private rubric and ask whether two honest graders
  could disagree wildly; if they could, it fails. A rubric turning on a
  keyword ("mentions convexity") or on taste ("a good explanation") fails.
  It names what a passing answer must establish, admits the alternative
  routes to it, and fails only clearly off-task answers — a `review`
  checkpoint is a prompt to think, not a gate.

### What CI already owns (self-test before reporting)

`npm run validate` lints the lab and builds it, which means executing the
reference solution. It already fails on:

- a missing `solution.py` / `challenges.yaml` / `pyproject.toml` / `uv.lock`;
  duplicate checkpoint ids; ids or kinds that differ between `course.yaml`
  and `challenges.yaml`; a lab with no required checkpoint;
- a solution that errors; an output that will not canonicalize (NaN,
  infinity, saturating magnitude); a `metric` threshold the reference does
  not beat by ≥ 0.02; a missing `holdout` file;
- a solution marker, an output, or cell metadata surviving into `lab.ipynb`;
  a cut that leaves unparsable code; a dep in `pyproject.toml` missing from
  `uv.lock`; a model answer reaching the learner or the private artifact;
- nondeterminism between two builds (seeding is a build gate, not a reading).

Re-read every line you are about to report: if `npm run validate` would have
produced it, delete it. QA owns pedagogy; restating a CI finding buys the
author nothing the build did not already give them.
