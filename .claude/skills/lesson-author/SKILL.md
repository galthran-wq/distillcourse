---
name: lesson-author
description: Write or revise one lesson (a textbook chapter in MDX) for a course, following the pedagogy constitution. Use when drafting lesson content from a curated course.yaml.
argument-hint: "<course-slug> <lesson-slug|next>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run validate:*)
---

# Lesson Author

You write one lesson at a time, to the standard of the gold example. A lesson
is a **textbook chapter**: substantial, declarative, mathematically serious
where the material allows — with exercises and references, not quizzes.

The constitution: @docs/pedagogy.md (L and E rules are yours).
Component APIs: @docs/components.md.
Structural mechanics (skeleton, density norms, task/reference mechanics —
distilled from the best reference course): @docs/voita-playbook.md. Adopt
its STRUCTURE; the register stays dry per L9.
For figures beyond simple SVGs, delegate to or follow /figure-artist
(component figures with real KaTeX, verified by render-and-look).

## Workflow

1. **Resolve the target.** Read `content/courses/<course>/course.yaml`. The
   second argument is a lesson slug, or `next` = the first `planned` lesson in
   course order. If the lesson is already `drafted`+, you are revising: keep
   what complies, rewrite what doesn't.

2. **Load context — all of it, before writing a word:**
   - The lesson's full entry (goal, opening, key_ideas, demo, notes, type)
     and the course `audience`/`tone` fields — your writing brief.
   - `concepts.yaml` — the definitions you must be consistent with.
   - Every prerequisite lesson's `lesson.mdx` — for continuity, to avoid
     re-explaining, and to source the review exercise (E3).
   - The gold example:
     `content/courses/information-theory/lessons/what-is-surprise/` — match
     its density, register, and structure.

3. **Plan briefly.** Sections follow the material (key_ideas are your plan,
   not a mandated section list). Decide: which statements become
   `<Definition>`/`<Theorem>`/`<Proof>` (only where genuinely mathematical —
   L5; for non-mathematical material use `<Remark>` and prose), where the
   worked `<Example>`s go, where the `<Demo>` embed goes (if specced), which
   earlier concept the review exercise drills, and which sources go in
   `<References>`.

4. **Write `lesson.mdx`:**
   - First paragraph opens with the `opening` **verbatim**, then states in
     one or two factual sentences what the lesson establishes (L3).
   - Free-form `##` sections; substantial is good — depth over brevity, but
     every sentence carries a fact (L9: dry engineering register — no
     rhetorical questions, no teasers, no chattiness, no narrative framing;
     second person only in instructions).
   - A concrete instance or computation precedes every general formula (L4).
   - Environments numbered automatically — never hand-number them.
   - Visuals dense per L6 — roughly one every 3–4 paragraphs: `<Demo>` where
     specced; `<Figure>` SVGs you author in `figures/`; `<FigureSequence>`
     step-throughs for anything that unfolds over steps (algorithms,
     derivation ideas — frames change one thing at a time). ALL figures
     follow @docs/figures.md — the house style is non-negotiable. The
     research brief's figure plan lists what to draw; recreate ideas from
     sources, never copy their drawings.
   - For every PascalCase component-figure reference you do NOT build
     yourself, put an MDX comment directly above it — your handoff to the
     figure builder:
     `{/* fig <Name>: what it shows; layout; exact labels and notation
     (KaTeX where math); color roles; for sequences: frame count and what
     changes per frame */}`. Be as specific as you are in your head — the
     builder sees only this comment, the research-brief figure plan, and
     the surrounding prose.
   - `## Exercises` before the references: numbered `<Exercise>` blocks, each
     with a complete `<Solution>` (E1, E4); most require producing a
     computation or argument (E2); from the course's 3rd lesson on, ≥1
     exercise drills a prerequisite lesson's concept (E3).
   - End with `<References>`: real, verified sources with chapter-level
     pointers (L8). Never invent a citation.
   - Math in KaTeX (`$...$`, `$$...$$`). Never write title/goal/est_minutes
     into the MDX — the layout renders them.
   - Scannability (playbook Writing principles 6–9, enforced by QA): typed
     emphasis (bold = payoff word / run-in label; italic = first-use term,
     once; inline code = literal tokens); no more than 3 consecutive prose
     paragraphs without a visual/callout/heading break; `###` subheaders in
     any section over ~200 words; colon-gloss headings where they sharpen
     the outline; em-dashes at most 3 per 1,000 words; inline links at
     first mention of named results. Mark each section's punchline with
     `<KeyFact>`; give the reader a `<Task>` at every demo and sequence.
   - Depth on demand (playbook course principle 2): push 25–40% of the
     chapter's mass behind folds — `<Aside>` deep-dives, collapsed proofs,
     solutions. The fold-stripped skeleton must still carry the argument.

5. **Flip status.** In course.yaml set THIS lesson's `status: planned` →
   `drafted`. That is the only course.yaml edit you may ever make.

6. **Validate:** `npm run validate <course> <lesson>` — zero errors; justify
   any remaining warning in one line or fix it.

7. **Self-review** against [checklists/lesson-checklist.md](checklists/lesson-checklist.md);
   report the verdicts, flag the weakest section, and suggest `/course-qa
   <course> <lesson>` plus `/demo-builder` if the lesson has an unbuilt demo.

## Hard limits

- Touch only: this lesson's directory + the one status field in course.yaml
  + component figures authored by following /figure-artist (new
  `components/figures/<course>/*.tsx` files and their registry entries in
  `components/figures/index.ts`). Everything else stays forbidden.
- Never restructure the syllabus, rename slugs, or edit other lessons.
- Never fabricate references — cite only sources you can verify exist.
- If the goal/key_ideas seem wrong while writing, STOP and report — the
  syllabus is the human's; don't silently work around it.
