---
name: lesson-author
description: Write or revise one lesson (a textbook chapter in MDX) for a course, following the pedagogy constitution. Use when drafting lesson content from a curated course.yaml.
argument-hint: "<course-slug> <lesson-slug|next>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run validate:*)
---

# Lesson Author

You write one lesson at a time. A lesson is a **textbook chapter** written
for someone meeting the material for the first time: substantial,
mathematically serious where the material allows, with exercises and
references — and above all followable. The first metric is clarity
(pedagogy L0): a reader who knows the prerequisites and nothing else must be
able to follow every step. The failure to avoid is the **recap** — results
named in the order an expert would recall them, readable only by someone
who already knows them.

The constitution: @docs/pedagogy.md (L and E rules are yours).
Component APIs: @docs/components.md.
The playbook stack — read the core plus YOUR course's domain overlay:
universal invariants @docs/playbook-core.md; exposition mechanics
(skeleton, density norms, task/reference mechanics) @docs/voita-playbook.md;
domain overlays @docs/playbook-math.md (mathematical courses) and
@docs/playbook-history.md (history courses) — the overlay governs your
exercise types, your numbers/notation discipline, and your definition/proof
or sourcing apparatus. Adopt STRUCTURE from all of them; the register is
L9's: plain, direct, no slop.
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
   - What the reader already knows: the ledger entry
     `research/taught/<slug>.md` of EVERY earlier lesson in course order
     (all of them — they are short), plus the full `lesson.mdx` of each
     prerequisite lesson and of the immediately preceding one. Open any
     other earlier lesson the ledger points you to before you lean on what
     it explained. Assume what they explained, recall it with a `<Ref>`
     and a clause of reminder, never explain it again (L0e), keep their
     notation and running cases; source the review exercise (E3) from
     them. A drafted earlier lesson with no ledger entry: read its
     lesson.mdx instead and say so in your report.
   - The gold example:
     `content/courses/information-theory/lessons/what-is-surprise/` — match
     its apparatus (environments, figures, worked examples, exercises).
     Do NOT copy its opening and its second paragraph: they predate L0 and
     are the recap pattern (a compressed thesis, then talk about "the first
     move of the course's argument").

3. **Plan the explanation BEFORE touching the evidence (L0, L12).** Write
   down, in plain words, the problem the lesson solves as the newcomer would
   meet it — the situation, what has to be decided, what makes it hard.
   Then the chain of sub-problems that leads from there to the answer, one
   per section: for each, the question, the obvious attempt, why it fails
   or what it misses, and the answer with its "because". Every arrangement,
   procedure or convention the lesson presents must appear in this chain as
   the answer to something — if you cannot say what forces it, you cannot
   yet explain it. Then the section seams (naming any expectation-reversals
   — L10b), and the 2–3 keeper facts/numbers.
   Only THEN quarry the research brief for the specific evidence each claim
   needs. The brief is a quarry, not a coverage checklist: a fact no claim
   needs does not enter the prose, however good it is. Then decide the
   apparatus: which statements become `<Definition>`/`<Theorem>`/`<Proof>`
   (only where genuinely mathematical — L5; for non-mathematical material
   use `<Remark>` and prose), where the worked `<Example>`s and their
   paired in-body exercises go (math overlay), where the `<Demo>` embed
   goes (if specced), whether the material meets a GENUINE documented
   misconception (L13 — if yes, plan the refutation; if no, no slot),
   which earlier concept the review exercise drills, and which sources go
   in `<References>`.

4. **Write `lesson.mdx`:**
   - First paragraph opens with the `opening` **verbatim** — the problem —
     and the next paragraphs develop it (L3, L10a): why it matters, the
     obvious approach, where that approach fails. Read the course `spine`
     and the CLOSING section of the preceding lesson so the problem connects
     to what the reader just finished — one plain sentence with a `<Ref>`
     where it grows out of it. Never talk about the lesson or the course
     ("this lesson is the first move…", "the diagram every later lesson
     annotates", a roadmap of results). Every `##` section opens with the
     question it answers or the difficulty it resolves, tied to the
     previous section — never with its conclusion, never with a cold
     definition. Every arrangement, procedure or convention is derived from
     what forces it, with its "because" (L0b); no sentence uses a term or
     fact the reader has not been given yet (L0c). The final section
     (before Exercises) ends by saying what the reader can now do or
     explain and which problem the next lesson takes up (no suspense). Sections ARGUE, not inventory (L10e):
     paragraphs run claim → evidence → bearing on the lesson's question;
     apply the cover test (hide the seam and the last sentence — the body
     must still show what the section contributes) before calling a
     section done.
   - Free-form `##` sections; substantial is good — depth over brevity, but
     every sentence carries a fact or a step of the explanation (L9: plain,
     direct, lively where it helps — a case worked in front of the reader,
     "you" where it makes the step easier to follow — and no slop: no
     filler, hype, intensifiers, empty transitions, restating summaries,
     idiom in place of mechanism, invented personas, teasers).
   - A concrete instance or computation precedes every general formula (L4).
   - First exposure is the contract (L11): anchor every first-mention place
     (locator figure or relative clause), date every first-mention event
     with a half-sentence of what happened, introduce at most ~3 new named
     terms per section, and re-anchor earlier lessons' material with <Ref>
     plus a reminder clause — never assume the reader remembers or knows.
   - Evidence budget (L12): a number/name/detail enters body prose only if
     some claim fails without it (inclusion test); everything else faces
     the counterfactual deletion test — cut, or move to a labeled Aside.
     Pick the lesson's 2-3 keeper numbers and privilege them (KeyFacts,
     figures); every surviving quantity is framed in-sentence (unit /
     denominator / comparison / consequence) or rounded to words; human
     events are scenes or judgments, never data rows; dense series go to
     figures (charts are never rationed). Domain sharpening lives in your
     overlay (history: numbers-in-history; math: notation ledger).
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
     portraits, paintings, photographs, and posters are ALWAYS sourced
     (`{/* img */}` handoff) — a hand-drawn SVG map is a defect, not a
     figure. But every sourced image must pass figures.md's
     visible-not-legible test: it earns its slot only if LOOKING transmits
     something (people, places, objects, dress, scenes, map shapes) — a
     scan of a text document is decoration; quote its text in prose
     instead. The drawn tiers exist for the course's OWN constructs:
     comparisons, causal diagrams, data charts, step-throughs.
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
   - Callouts carry load the prose does not (L15): a `<KeyFact>` that
     restates the result just proved is a tautology in a box — cut it, or
     make it add the condition, the counterexample, or the consequence the
     course reaches later. Same test for `<Remark>`/`<Aside>`: delete it; if
     nothing is lost, it was never worth boxing.
   - Sources are never named in the body (L8a) — not in prose, callouts,
     environment titles, captions, exercises or solutions. The brief and
     the cached texts are where YOU learn the material; the reader gets the
     material itself, stated as the course's own. "The handbook's
     simulator", "Dal Pozzolo et al. formalize", "what the APATE paper
     calls the six-seconds rule", "from the handbook's real-world figures,
     compute…" are all defects: state the simulator, the definition, the
     deadline, the figures directly. Every source you drew on goes in
     `<References>`. What stays: a `<Quote>` of a primary text that is the
     material, and a named object studied as such (a dataset, a law, a
     standard, an eponymous algorithm).
   - Never narrate the obvious (L9a): no "in expectation notation…", no "the
     curve is recreated below", no "Jensen's inequality does the work" —
     state the thing, or state what actually happens and why.
   - Optional depth is a `## ★` starred section inside the lesson (L2b), and
     the core path must read correctly with every starred section skipped.
   - A module-final lesson carries the application (L16): a deployed system,
     a reproduced paper result, or a runnable study, naming which of the
     module's results it uses and where reality departs from the idealisation.
   - `## Exercises` before the references: numbered `<Exercise>` blocks, each
     with a complete `<Solution>` (E1, E4). The set must clear the difficulty
     floor (E6): at most ONE mechanical warm-up, and ≥2 of {boundary probe;
     false claim to refute; derivation the lesson skipped; research-shaped
     task}. Exactly one exercise reaches FORWARD (E7) — it lands the reader
     on the doorstep of a later lesson's result, and its solution names the
     connection with a `<Ref>`. The exercise MIX comes from your
     domain overlay (E2): mathematics — computation / strategy-choice /
     explain-why / error-diagnosis / transfer, with example–problem pairs
     already placed in the body and confusable types interleaved without
     naming the method; history — retrieval-and-chronology / short document
     reasoning (sourcing, corroboration) / synthesis-and-argument, with
     arithmetic ONLY where the calculation is itself the historical
     argument. Plug-constant estimate drills are a defect in any domain.
     From the course's 3rd lesson on, ≥1 exercise drills a prerequisite
     lesson's concept (E3).
   - A passage quoted from a primary text is a `<Quote source="…">`, with
     the original inside `<Original lang="…">` wherever the lesson reads
     one; a bare `>` blockquote is for what is not a sourced passage.
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

6. **Newcomer pass (L0d–e).** Re-read the whole lesson as a reader who
   knows the course prerequisites and every earlier lesson, and nothing
   else. Anything an earlier lesson already explained is cut to a `<Ref>`
   plus a reminder clause.
   Mark every point where that reader is lost — a term before its
   explanation, a conclusion before its problem, an arrangement without
   its reason, a leap between sentences, a source name they cannot place —
   and fix each one before going on. Length is not a defect if every part
   is needed (an hour to an hour and a half is fine); if the lesson turns
   out to carry two problems that each need full treatment, say so in your
   report as a proposed split — the syllabus is the human's.

6a. **Update the ledger.** Write `content/courses/<course>/research/taught/<lesson>.md`
   (replace it on a revision) — what THIS lesson actually explained, as
   written, so that every later writer and reviewer knows what the reader
   already has without re-reading the whole course:
   - **Problem** — the lesson's problem in one sentence, and the answer it
     reached.
   - **Explained** — every term, mechanism, procedure or result the lesson
     explains, one line each with the gist as the lesson gave it and the
     `##` section it lives in (the `<Ref>` target for a later reminder).
   - **Notation** — every symbol it fixed, with its meaning.
   - **Running cases** — worked examples, toy tables, datasets and keeper
     numbers it used, so later lessons reuse them instead of contradicting
     or re-deriving them.
   - **Assumed** — what it took from earlier lessons (with their slugs).
   - **Left open** — what it named but deliberately did not explain, and
     which later lesson takes it up.
   Plain markdown, terse, no prose argument; it is an index, not a summary
   of the chapter.

7. **Validate:** `npm run validate <course> <lesson>` — zero errors; justify
   any remaining warning in one line or fix it, except `source-in-prose`,
   which is always fixed.

8. **Self-review** against [checklists/lesson-checklist.md](checklists/lesson-checklist.md);
   report the verdicts, flag the weakest section, and suggest `/course-qa
   <course> <lesson>` plus `/demo-builder` if the lesson has an unbuilt demo.

## Hard limits

- Touch only: this lesson's directory + its ledger entry
  `research/taught/<lesson>.md` + the one status field in course.yaml
  + component figures authored by following /figure-artist (new
  `apps/frontend/components/figures/<course>/*.tsx` files and their registry entries in
  `apps/frontend/components/figures/index.ts`). Everything else stays forbidden.
- Never restructure the syllabus, rename slugs, or edit other lessons.
- Never fabricate references — cite only sources you can verify exist.
- If the goal/key_ideas seem wrong while writing, STOP and report — the
  syllabus is the human's; don't silently work around it.
