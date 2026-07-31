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
(component figures with real KaTeX, verified by render-and-look). For a
figure that must be the real artefact — a historical photograph, a scan, a
published plot of measured data — that is /figure-artist's sourced-image
tier: the reading swarm captured it into `research/images/` and the figure
agent cuts, verifies and credits it (docs/figures.md §Sourced images).

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
   - First paragraph opens with the `opening` **verbatim**, then the
     throughline paragraph (L10): two to four declarative sentences placing
     this lesson in the course's argument — what the spine (course.yaml) has
     established so far, what stands open, what this lesson contributes. To
     write it you MUST read the course `spine` and the CLOSING section of the
     immediately preceding lesson's lesson.mdx. Every `##` section opens with
     a sentence tying it to the lesson's running question or the previous
     section — never a cold definition. The final section (before Exercises)
     ends by naming what is now established and what the next lesson takes
     up, as fact (no suspense). Sections ARGUE, not inventory (L10e):
     paragraphs run claim → evidence → bearing on the lesson's question;
     apply the cover test (hide the seam and the last sentence — the body
     must still show what the section contributes) before calling a
     section done.
   - Free-form `##` sections; substantial is good — depth over brevity, but
     every sentence carries a fact (L9: dry engineering register — no
     rhetorical questions, no teasers, no chattiness, no narrative framing;
     second person only in instructions).
   - A concrete instance or computation precedes every general formula (L4).
   - First exposure is the contract (L11): anchor every first-mention place
     (locator figure or relative clause), date every first-mention event
     with a half-sentence of what happened, introduce at most ~3 new named
     terms per section, and re-anchor earlier lessons' material with <Ref>
     plus a reminder clause — never assume the reader remembers or knows.
   - Environments numbered automatically — never hand-number them.
   - Visuals dense per L6 — roughly one every 3–4 paragraphs: `<Demo>` where
     specced; `<Figure>` SVGs you author in `figures/`; `<FigureSequence>`
     step-throughs for anything that unfolds over steps (algorithms,
     derivation ideas — frames change one thing at a time). ALL figures
     follow @docs/figures.md — the house style is non-negotiable. The
     research brief's figure plan lists what to draw; recreate ideas from
     sources, never copy their drawings.
   - The brief's FIGURE PLAN tags each visual `draw:` or `source:`. A
     `source:` entry is a real artefact (photograph, scan, published data
     plot) that a figure-artist agent lands after you: do NOT write the
     `<Figure src>` tag for it (the file does not exist yet and validation
     would fail) and do NOT invent a substitute drawing. Leave the handoff
     comment where the figure goes, and write the prose as if the image were
     already there:
     `{/* img <file-stem>: what the reader must see; candidate <images.yaml
     id> — <source>, <location>, <url>; placement centered|float-right */}`
     You may also ADD such handoffs beyond the plan — where a real artefact
     would serve the prose better than any drawing — with or without a pool
     candidate (no candidate = the figure agent hunts one; name the likely
     source if you know it). The bar is the same: the artefact must carry
     material, not decorate it.
   - **Never hand-draw what exists as an artifact.** Geographic maps,
     portraits, paintings, photographs, posters, and document pages are
     ALWAYS sourced (`{/* img */}` handoff) — a hand-drawn SVG map is a
     defect, not a figure. The drawn tiers exist for the course's OWN
     constructs: comparisons, causal diagrams, data charts, step-throughs.
     For artifact-rich subjects (history, art, biology) the brief's FIGURE
     PLAN is a floor, not a ceiling: add `{/* img */}` handoffs liberally
     wherever a real artifact carries material — for this kind of course,
     sourced images should carry roughly half the lesson's visuals, and
     Wikimedia Commons / LoC hold canonical public-domain copies of nearly
     every map, portrait, and painting you will want.
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
   - Attribution follows L8a: state narrative facts directly — no
     "the Yawp's chapter describes…" scaffolding mid-prose. Name a source
     inline ONLY when the source is the subject: a primary document read or
     quoted, a measurement whose method is the point, a named thesis.
     Secondary surveys live in References only.
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

5. **Flip status and pick the key image.** In course.yaml set THIS lesson's
   `status: planned` → `drafted`, and set its `key_image` — the lesson's
   signature visual, rendered as the thumbnail in the course contents.
   Prefer the strongest sourced image; a raster key_image must already have
   its credits.yaml entry (a not-yet-landed handoff image cannot be the key
   image — pick a drawn figure and note the intended swap in your report).
   These are the only course.yaml edits you may ever make.

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
