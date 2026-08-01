# Playbook — exposition layer (Voita dissection)

Rules for how lessons are structured, paced, and illustrated — the
EXPOSITION layer of the playbook stack: `docs/playbook-core.md` holds the
universal invariants (two-corpus convergence + learning-science audit), and
`docs/playbook-math.md` / `docs/playbook-history.md` hold the domain
overlays. This file is distilled from a statistical dissection of one of
the two reference corpora (Lena Voita, "NLP Course For You": five lesson
pages, the landing page, and a corpus of figures, analyzed July 2026).
Everything below is stated as OUR rule, ready to apply. One deliberate
divergence from the reference: its friendly conversational voice is not
adopted — our register stays dry and declarative (pedagogy L9).

## Course-level principles

1. **Format contract.** Every lesson of a course has the same shape: the
   same section kinds, the same named blocks (environments, Exercises,
   References), the same navigation anchors. A reader who finished one
   lesson can navigate any other blindly. Deviations from the shape are
   course-level design decisions, never per-lesson improvisation.
2. **Depth on demand.** The linear reading path stays lean; everything
   optional or heavy sits behind a fold — collapsed proofs, collapsed
   solutions, `<Aside>` deep-dives, references at the end. Measured on the
   reference course: 44–70% of a page's content mass is deferred behind an
   interaction, and step sequences compress 7:1–20:1 into one figure slot.
   Target for us: 25–40% of a chapter's mass behind folds. Collapse by
   default: solutions, full proofs, alternative approaches, tangents. Never
   collapse: definitions, theorem statements, key-fact callouts, the primary
   figure. The fold-stripped skeleton (headings + callout one-liners +
   captions) must still reconstruct the argument — course-qa checks this.
3. **Escalating reader agency.** Early lessons and early sections ask the
   reader only to follow; later ones ask them to compute, then to solve,
   then to judge. Within a lesson the same gradient runs from prose to
   worked examples to exercises.
4. **Prerequisites are links, not chapters.** Needed material from another
   lesson gets a cross-reference (`<Ref>`) plus at most two sentences of
   recap. If a course needs another course, that is a course-level
   prerequisite entry in course.yaml.

## Callout color roles (constant across all courses)

- **Rose `<KeyFact>`** — the load-bearing or surprising fact, one sentence.
  A returning reader scans for rose to recall the lesson's punchlines.
- **Green `<Task>`** — something the reader does right now (compute this,
  drag that, check this), stated as an instruction with an observable.
- **Amber** — the accent: links, the figure subject, active states.
- Typed math environments (Definition/Theorem/Example/Remark) keep their
  existing neutral panels. At most one KeyFact and one Task per section.

## Writing principles (register-neutral; voice stays dry per L9)

1. **Roadmap sentence.** After the opening statement, one sentence lists
   what the lesson establishes, in order. The reader always knows where
   they are in the arc.
2. **Headings carry content.** A heading is a claim ("Additivity forces the
   logarithm") or a precise question ("How many bits does a letter of
   English carry?") — never a topic label ("Background").
3. **Recap as transition.** When a section builds on an earlier result,
   restate that result in one sentence with a `<Ref>` to where it was
   established, then build. Transitions carry facts, not filler.
4. **Need-then-method scaffold.** Before a technique, state in one line
   what must be computed and why; then state how. The reference course's
   "We need to: … / How: …" pair, in declarative form.
5. **Example before definition, definition before theorem.** A concrete
   instance is computed first, the general formalism names it afterwards
   (pedagogy L4); theorems come after their motivating computation.
6. **Typed emphasis, one channel per job.** Bold marks the single payoff
   word of a claim (three words at most) and run-in labels ("Bounds
   check:"). Italic marks a technical term exactly once, at its defining
   sentence. Inline code marks literal tokens and identifiers mentioned as
   objects. Never bold a clause; never italicize for tone. (Reference
   course: ~37 typed emphasis marks per 1,000 words across five disjoint
   channels, zero italics-as-emphasis.)
7. **Cadence and texture.** At most 3 consecutive prose paragraphs without
   a figure, callout, environment, or heading (reference median: 1).
   Paragraphs of 1–3 sentences. A `##` section over ~200 words gets `###`
   subheaders — a heading roughly every 150 words. Em-dashes at most ~3 per
   1,000 words: expansion is carried by colons and sentence breaks.
8. **Colon-gloss headings.** Where a heading can state its payoff, use
   "label: payoff" ("The range of entropy: 0 to log₂ n"). The reference
   course does this in 44% of headings; it makes the outline read as the
   argument.
9. **Inline links at first mention.** A named result, source, or tool is
   linked where it first appears, with the name as link text — in addition
   to, never instead of, the References block.

## How a lesson is ordered

1. Open with the problem and an explicit statement of what the lesson
   establishes. Handle prerequisites by linking the earlier lesson plus at
   most two sentences of recap — never re-teach them.
2. Present the general framework before any concrete method, then slot each
   method into it as a special case. When several methods exist, order them
   simple-and-historical first, modern last.
3. Introduce every new mechanism as the fix for an explicitly stated flaw of
   the previous one. Name the flaw first, then the mechanism.
4. Put the heaviest mathematics in the middle of the lesson, not at the
   start and not at the end.
5. Close the core narrative with "how do we know it works" (evaluation,
   bounds, checks), then the fixed tail: Exercises, then References.

## Quantitative norms

- Figures: 6–12 substantive visuals per 1,000 words of prose. In practice:
  one visual per 3–4 paragraphs, many small single-idea figures rather than
  one crowded diagram.
- Paragraphs: around 30–40 words, one idea each. Sentences around 20 words.
- Sections: 100–700 words of prose per top-level section, split into 2–5
  sub-steps. Headings state a claim or a precise question.
- Inline links: roughly 5 per 1,000 words, written into the sentence
  ("the paper X shows…"); formal citations live in the References block.
- Step-through sequences: 3–7 frames for us (the reference course goes up
  to 24). Every sequence and every demo carries one instruction line naming
  what the reader should watch for.

## How knowledge checks work

- After building an important idea, restate it as a single-sentence fact in
  a marked place (our `<Remark>` environment or a bold one-liner).
- Exercise solutions are hidden until clicked and framed with restraint:
  for open-ended exercises the label is "possible answers", not "the
  answer", and several known approaches are listed.
- The reader is told to actually think before opening a solution; the
  exercise text may say how long is reasonable.
- Mid-lesson, point forward to specific exercises with `<Ref>` when a
  section raises a question an exercise will drill.

## How references work

Three tiers, from cheap to expensive for the reader:

1. A short statement of the key result — always visible, and when possible
   promoted straight into a heading or list item ("entropy bounds lossless
   compression").
2. A deeper illustrated summary — collapsible, optional.
3. The source itself — linked with a chapter-level pointer.

Our `<References>` block covers tiers 1 and 3 today; tier 2 (collapsible
paper summaries) is a candidate feature for research-flavored courses.

## How figures are composed

Twelve rules from the visual dissection of the reference corpus. The
figure-artist skill applies them; course-qa judges against them.

1. Color means a semantic role, and the binding is literal: the same hex
   appears on the diagram element, on the word naming it in a label, and
   inside the formula symbol. A color is introduced only together with the
   word that names it. Palette: amber = the subject, blue = the second
   role, each further role earns exactly one new hue; at most four hues.
2. A sequence animates by changing exactly one element per frame; the rest
   stays pixel-identical, so the eye tracks the delta.
3. Number the steps of a process with bold headers, then reuse the same
   numbered badges inside formulas (under underbraces) to bind formula
   terms to pipeline stages.
4. Ground abstractions in one concrete running example (one sentence, one
   distribution) reused across the lesson's figures, with real values
   plugged into formulas.
5. Architecture diagrams stack tiers bottom-up: data, then representation,
   then computation, then prediction. Arrows point only up or right.
6. Arrows have three distinct jobs and looks: a fan for "relates to each of
   these", a straight line for data flow, a thin line for "this label names
   that symbol".
7. Dissect formulas in place: put short labels above the equation with
   arrows onto the exact symbols; group terms with underbraces that drop to
   an explanation or an inset plot.
8. Show comparisons as two near-identical panels side by side joined by a
   bold arrow, with the single changed phrase highlighted and the payoff
   stated as a tally.
9. Draw vectors and matrices as literal cell grids; highlight exactly one
   row — the item in focus.
10. Emphasis grammar: bold for the key noun, color for a role, a warning
    color only for "don't". Nothing decorative.
11. When geometry can't disambiguate, put a short color-matched legend
    directly under the graphic.
12. One idea per figure. A drawing that needs two captions is two figures.

Formulas require real typesetting (KaTeX) and long labels require flowing
HTML text — which is why rich figures are React components verified by the
render-and-look loop (`npm run figure`, see docs/figures.md), not raw SVG.

## Where this is already implemented

- Component figures with the visual verification loop: done
  (`components/figures/`, gold example `examples/W2vOneStep.tsx`,
  /figure-artist skill).
- Density and structure norms: encoded in pedagogy L2 and L6.
- Not yet built, candidates: a dedicated one-liner "key idea" box
  component; collapsible tier-2 paper summaries; a per-course "Analysis"
  section convention for research-flavored courses.
