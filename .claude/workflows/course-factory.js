export const meta = {
  name: 'course-factory',
  description: 'Research-driven course production: canon discovery, source-reading swarm, structure synthesis with a resumable research dossier; then per-lesson write→demo→QA iteration',
  whenToUse: 'Invoked by the /course-architect (phase: structure) and /lesson-factory (phase: lessons) skills. Args: {phase, slug, topic?, count?}.',
  phases: [
    { title: 'Canon', detail: 'perplexity deep research: the mainstream sources', model: 'opus' },
    { title: 'Read', detail: 'scope → readers (big books shard by ToC) → merge; readers capture image candidates and the source\'s own assignments', model: 'sonnet' },
    { title: 'Synthesize', detail: 'course.yaml (chapters + the labs the canon\'s assignments justify) + research dossier', model: 'fable' },
    { title: 'Lessons', detail: 'write(opus) → figures (drawn + sourced, in parallel) → demo → QA(opus) → fix → re-QA(opus), per lesson; a lab lesson goes to lab-author instead of the writer' },
  ],
}

const CANON_SCHEMA = {
  type: 'object',
  required: ['sources'],
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'kind', 'why'],
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          url: { type: 'string' },
          kind: { type: 'string', description: 'textbook | syllabus | lecture-notes | survey | visual-resource' },
          why: { type: 'string', description: 'why this is canon, one line' },
        },
      },
    },
  },
}

const SUMMARY_SCHEMA = {
  type: 'object',
  required: ['title', 'topics', 'key_results', 'chapter_map'],
  properties: {
    title: { type: 'string' },
    access: { type: 'string', description: 'full | toc-only | summary-based' },
    topics: { type: 'array', items: { type: 'string' }, description: 'ToC-order topic list, chapter/section granularity' },
    key_results: { type: 'array', items: { type: 'string' }, description: 'central theorems/definitions with chapter pointers' },
    pedagogy: { type: 'string', description: 'proof style, exercise style, assumed prerequisites' },
    figures: { type: 'array', items: { type: 'string' }, description: 'notable/canonical visualizations and where — ideas to recreate in house style' },
    image_candidates: {
      type: 'array',
      description: 'at most 8, ranked: images that would have to be the REAL artefact (photo, scan, apparatus, published data plot) rather than a redrawing — each already captured to disk',
      items: {
        type: 'object',
        required: ['id', 'capture', 'shows', 'located', 'why_real'],
        properties: {
          id: { type: 'string', description: 'kebab-case id, unique within the source' },
          capture: { type: 'string', description: 'path of the captured file (whole page or downloaded image)' },
          shows: { type: 'string', description: 'what the image shows, one line' },
          located: { type: 'string', description: 'exact position: page, figure/plate number' },
          why_real: { type: 'string', description: 'why a house-style redrawing would destroy its point' },
          url: { type: 'string', description: 'direct URL, or the PDF + page it lives in' },
          license: { type: 'string', description: 'as the source page states it: public domain | CC-BY-… | publisher © (teaching use) | unknown' },
          quality: { type: 'string', description: 'scan legibility, resolution, colour — anything visible' },
        },
      },
    },
    gems: { type: 'array', items: { type: 'string' }, description: 'memorable worked examples, striking numbers, analogies, case studies — with chapter pointers' },
    assignments: {
      type: 'array',
      items: { type: 'string' },
      description: 'what the source makes students BUILD by hand (homeworks, problem sets with code, projects, labs), one line each: name + pointer, what the student produces, how the work is cut into steps, what scaffold is given, how it is verified. Empty when the source assigns nothing — never invent one',
    },
    chapter_map: { type: 'array', items: { type: 'string' }, description: '"topic -> chapter/section" lines' },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['lessons'],
  properties: {
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        required: ['slug', 'type', 'hasDemo'],
        properties: {
          slug: { type: 'string' },
          type: { type: 'string', description: 'the lesson entry\'s type field — "lab" routes to the lab-author skill, everything else to lesson-writer' },
          hasDemo: { type: 'boolean' },
        },
      },
      description: 'lessons with status planned, in course order (modules in order, lessons in order)',
    },
  },
}

const SCOPE_SCHEMA = {
  type: 'object',
  required: ['access', 'where', 'shards'],
  properties: {
    access: { type: 'string', description: 'full | toc-only | summary-based | not-found' },
    where: { type: 'string', description: 'best reading location found: URL(s), archive.org id, mirror — enough that a reader needs no re-hunting; for not-found, what you tried' },
    shards: {
      type: 'array',
      description: '1 entry = no split; 2-4 entries only for big fully-accessible sources, split on chapter boundaries',
      items: {
        type: 'object',
        required: ['range'],
        properties: {
          range: { type: 'string', description: 'explicit chapter/page range, e.g. "chs. 1-9 (pp. 1-310)"' },
          note: { type: 'string', description: 'what this stretch of the book covers, one line' },
        },
      },
    },
  },
}

const FIGLIST_SCHEMA = {
  type: 'object',
  required: ['missing'],
  properties: {
    missing: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'kind', 'isSequence', 'spec'],
        properties: {
          name: { type: 'string', description: 'PascalCase component name, or the kebab-case file stem for a sourced image' },
          kind: { type: 'string', description: 'component | sourced — drawn in house style, or cut from a captured real image' },
          isSequence: { type: 'boolean', description: 'true if referenced via <FigureSequence>' },
          spec: { type: 'string', description: 'one-paragraph build spec: for component figures, what to draw (from the writer\'s {/* fig */} comment + FIGURE PLAN); for sourced images, what the reader must see, the research/images.yaml candidate id and its capture path, and the placement (centered | float-left | float-right)' },
        },
      },
      description: 'component figures referenced by the lesson but absent from apps/frontend/components/figures/index.ts',
    },
  },
}

const QA_SCHEMA = {
  type: 'object',
  required: ['ready', 'fixes'],
  properties: {
    ready: { type: 'boolean', description: 'true if the lesson is ready for human review with no required fixes' },
    fixes: { type: 'array', items: { type: 'string' }, description: 'prioritized required fixes, empty when ready' },
  },
}

// Some launch paths deliver args as a JSON string instead of an object —
// tolerate both so a run never dies on the very first line.
const argv = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const phaseArg = argv.phase ?? 'structure'
const slug = argv.slug
if (!slug) throw new Error('args.slug is required')

// Subagents inherit the SESSION's launch directory, not the orchestrator's
// current worktree — so the orchestrating skill passes args.root (absolute
// path of the course worktree) and every agent prompt is prefixed with it.
const root = argv.root
const at = root
  ? `Repo root for ALL file reads and writes: ${root} (a git worktree). Use absolute paths under it; never touch any other checkout of this repo.\n\n`
  : ''

// Optional human design intent (format, audience, angle) — binding for both
// canon selection and structure synthesis when the course is not a plain
// "teach subject X" (e.g. interview prep, a workshop, an exam crammer).
const brief = argv.brief
  ? `\n\nCourse design intent from the human (binding — shape source choice and structure around it): ${argv.brief}`
  : ''

// agent() returns null once the runtime's own retries are exhausted — which
// a sustained 529 storm does within a minute. Without this, that null used to
// ride the pipeline all the way down: figure scans on a lesson never written,
// QA on nothing, the next lesson drafted against a missing prerequisite. A
// distinct label per attempt keeps each try its own line in the progress tree.
const RETRIES = 2
const run = async (prompt, opts = {}) => {
  let out = await agent(prompt, opts)
  for (let i = 1; out === null && i <= RETRIES; i++) {
    log(`${opts.label ?? 'agent'}: no result, retry ${i}/${RETRIES}`)
    out = await agent(prompt, { ...opts, label: `${opts.label ?? 'agent'} (retry ${i})` })
  }
  return out
}

if (phaseArg === 'structure') {
  const topic = argv.topic ?? slug

  // The human may stage source copies (PDFs) under research/texts/ before the
  // run — the paywalled books the swarm could never reach on its own. Those
  // are canon by fiat: the scout adds to them, it never replaces them.
  const stagedNote = `\n\nBEFORE any searching: list content/courses/${slug}/research/texts/ (if it does not exist, skip this paragraph). Every file there is a copy the HUMAN staged for this course. Each is canon by fiat: emit it in your output as a source, with title and author taken from the file itself (read its first pages with \`pdftotext -l 3\`, never guessed from the filename alone), \`url\` set to its absolute path on disk, and \`why\` stating that the human staged it plus the role you judge it fills. Then supplement with what you find yourself, and make each addition earn a role the staged set does not already cover. Never drop, rename or silently substitute a staged source.`

  phase('Canon')
  const canon = await run(
    `${at}Identify the canonical mainstream materials for learning "${topic}" at the level of a busy engineer (no prior expertise, comfortable with math). Use ToolSearch to load mcp__perplexity__perplexity_research and run ONE deep research query, then curate its output yourself. If that MCP server is not connected in this session, fall back to WebSearch — several targeted queries (standard textbooks, university syllabi, primary sources, best visual resources) — and say in your output which route you took. Source count is subject-dependent — no fixed cap; for a rich subject expect roughly 10-15 items: the standard textbooks, strong university course syllabi/lecture notes (with URLs), the load-bearing primary papers, good surveys, and 1-2 exceptional visual/interactive resources. Every item must earn a distinct role (a lesson or module it grounds) — no padding with redundant near-duplicates. Prefer freely accessible materials, but NEVER omit a canonical source just because you found no accessible copy — include it anyway; inaccessible sources are reported to the human, who can obtain copies from the publishers. Return via structured output; put verified URLs where you have them.${stagedNote}${brief}`,
    { label: 'canon-scout', model: 'opus', schema: CANON_SCHEMA },
  )
  // The human may stage copies after a run — the books the swarm reported as
  // toc-only. On resume every unchanged scope/read replays from cache, so
  // `reread` names the canon sources whose scope prompt must change (they are
  // then found on disk), and `extraSources` adds staged books the scout never
  // listed.
  const reread = (argv.reread ?? []).map((t) => t.toLowerCase())
  const rereadNote = (s) => reread.some((t) => s.title.toLowerCase().includes(t))
    ? ' RE-READ: the human has since staged a copy of this source under research/texts/ — it is there now; find it and confirm it against its first pages.'
    : ''
  const sources = [...canon.sources, ...(argv.extraSources ?? [])]
  log(`canon: ${sources.length} sources — ${sources.map((s) => s.title).join('; ')}`)

  phase('Read')
  // Big fully-accessible books are sharded across readers by a deterministic
  // ToC split: one context window per ~10-15 chapters instead of one per
  // book, so the long tail of a 900-page source stops evaporating. A scoper
  // finds the source and proposes the split; shard readers see ONLY their
  // range; a merger folds shard summaries back into one per-source summary
  // (same shape, so synthesis downstream is unchanged). pipeline(): each
  // source flows scope -> read -> merge without waiting for the others.
  // Access is tracked per source so that anything short of a full read is
  // REPORTED to the human at the end, never silently omitted — the human can
  // obtain missing books from the publishers and re-run the read for them.
  const accessLog = []
  const capNote = `Capture directory for image candidates: content/courses/${slug}/research/images/ — create it if missing, and prefix every id with a short source tag so the swarm's ids never collide. Texts cache for the raw material you fetch (PDFs, extracted text, flattened chapters — each with its .meta.yaml sidecar, per your briefing): content/courses/${slug}/research/texts/ — create it if missing; lesson writers will read from it instead of re-fetching.`
  const summaries = (
    await pipeline(
      sources,
      (s) =>
        run(
          `${at}Scope ONE source for a reading swarm: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind})${s.url ? `, URL: ${s.url}` : ' — locate it yourself (WebSearch), prefer official/legal copies'}. Before searching the web, list content/courses/${slug}/research/texts/: if a file there IS this source (confirm against the PDF’s own first pages, not just the filename), that is your answer — access "full", \`where\` = that file’s absolute path, and say in \`where\` that the human staged it. Only hunt online when nothing on disk matches. Otherwise, find where it can actually be read, fetch its table of contents, and decide the split. Shard ONLY when the full text is accessible AND the source is big (roughly 350+ pages or 25+ chapters): 2-4 shards along chapter boundaries, balanced by page count. Otherwise return a single shard covering everything. Report access honestly (full | toc-only | summary-based | not-found) and pass on the best reading location you found so readers do not re-hunt. If you cannot find the source at all, do NOT invent a location and do NOT quietly settle for second-hand descriptions of it — return access "not-found" with \`where\` describing what you tried; the human will obtain a copy from the publisher.${rereadNote(s)}`,
          { label: `scope: ${s.title.slice(0, 28)}`, phase: 'Read', model: 'sonnet', schema: SCOPE_SCHEMA },
        ).then((scope) => {
          accessLog.push({ title: s.title, access: scope ? scope.access : 'scope-failed', where: scope ? scope.where : '' })
          return scope
        }),
      (scope, s) =>
        scope &&
        scope.access !== 'not-found' &&
        parallel(
          scope.shards.map((shard, i) => () =>
            run(
              `${at}Source to summarize: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind}). Reason it is canon: ${s.why}. Access per the scoper: ${scope.access}; read it at: ${scope.where}. ${scope.shards.length > 1 ? `YOUR SHARD (${i + 1}/${scope.shards.length}): ${shard.range} — read ONLY this range, report ONLY from it, and stay silent about the rest of the book; the swarm covers it.` : 'You cover the whole source.'} Follow your source-reader briefing.\n\n${capNote} For this source use the tag \`${(s.title.match(/[A-Za-z0-9]+/g) || ['src']).slice(0, 2).join('').toLowerCase().slice(0, 12)}${scope.shards.length > 1 ? `-s${i + 1}` : ''}-\`.`,
              { label: `read: ${s.title.slice(0, 22)}${scope.shards.length > 1 ? ` [${i + 1}/${scope.shards.length}]` : ''}`, phase: 'Read', agentType: 'source-reader', schema: SUMMARY_SCHEMA },
            ),
          ),
        ),
      (parts, s) => {
        const kept = (parts || []).filter(Boolean)
        if (kept.length === 0) return null
        if (kept.length === 1) return kept[0]
        return run(
          `${at}Merge these shard summaries of ONE source — "${s.title}"${s.author ? ` by ${s.author}` : ''} — into a single source summary of the same shape. Concatenate topics, chapter_map and assignments in book order; keep EVERY key_result, gem, assignment and figure idea with its chapter pointer (dedupe only true duplicates); rank image_candidates across shards and keep at most 8 (do NOT delete the losing captures from disk — just omit them from the list); synthesize one pedagogy note. Shard summaries (JSON): ${JSON.stringify(kept)}`,
          { label: `merge: ${s.title.slice(0, 28)}`, phase: 'Read', model: 'sonnet', schema: SUMMARY_SCHEMA },
        )
      },
    )
  ).filter(Boolean)
  log(`read: ${summaries.length}/${sources.length} sources summarized`)
  if (summaries.length === 0) throw new Error('no source could be read — aborting before synthesis')
  const degraded = accessLog.filter((a) => a.access !== 'full')
  if (degraded.length) log(`ATTENTION — sources NOT fully read (report to the human, never silently omit; they can obtain copies from the publishers): ${degraded.map((d) => `"${d.title}" [${d.access}]`).join('; ')}`)

  phase('Synthesize')
  const synthesis = await run(
    [
      `${at}You are the course architect for the course "${topic}" (slug: ${slug}) in this repo. Read docs/pedagogy.md (C rules AND L2/L10/L15/L16, E6/E7, D1 — they constrain what you plan), docs/content-model.md, docs/playbook-core.md, the domain overlay (docs/playbook-math.md for a mathematical subject, docs/playbook-history.md for a historical one), docs/voita-playbook.md (lesson skeleton, framework-first + flaw-driven sequencing, density norms), and the example .claude/skills/course-architect/examples/course.yaml.${brief}`,
      `Source summaries from the reading swarm (JSON): ${JSON.stringify(summaries)}`,
      `Produce, in content/courses/${slug}/:`,
      `1. course.yaml — outcomes first (Bloom), then modules/lessons per the pedagogy rules (no lesson-count cap — scope follows the material; no padding or micro-slicing, every lesson has one substantive goal) (easy openers, acyclic prerequisites, spiral reinforces, technical noun-phrase titles, declarative openings, demo specs only where the concept is dynamic AND the reader can DO something in it per D1 — sliders on a curve the lesson already plots do not qualify). Mark advanced off-path chapters \`type: extra\` — the core path must survive skipping them; no non-extra lesson may list one as a prerequisite (lint: extra-prereq). Include intro, course-level prerequisites, key_results, sources.`,
      `1a. REQUIRED — \`spine\`: the course's argument as an ordered chain of moves (pedagogy L10), each step with its \`step\` sentence, display \`label\`, \`years\`/range where meaningful, a concrete \`caption\`, and the \`lessons\` that carry it. Every lesson must appear in exactly one step. The spine is what makes lesson N+1 feel like it follows from lesson N; if a lesson cannot be placed in the chain, the chain or the lesson is wrong.`,
      `1b. REQUIRED — \`intro\`: an INTRODUCTION, not a description of the course. It states the question the course answers and the shape of the answer, in the voice the lessons use. "This course covers entropy, coding, channels and applications" is a table of contents and fails.`,
      `1c. REQUIRED — one APPLICATION lesson at the end of every module (L16): a deployed system, a paper's result reproduced, or a computational study that cashes out that module's theorems on something real (for information theory: JPEG/WebP quantisation, zstd's entropy stage, an LLM's tokenizer and bits-per-byte, a channel-coding standard). It names which module results the artifact uses and where the artifact departs from the idealisation. Give these lessons real goals and briefs like any other.`,
      `1g. LABS — a module MAY close with a lab: a \`type: lab\` lesson, a 3-5 hour notebook assignment the learner solves in Jupyter while the platform verifies checkpoints (docs/content-model.md "Lab lessons" for the schema, .claude/skills/lab-author/SKILL.md for the genre norms). Decide this per module FROM THE DOSSIER: the reader summaries' \`assignments\` say what the canon makes students build by hand. Each lab you plan must name that grounding ("YSDA's homework 2 has students write attention from scratch"); a module whose canon assigns nothing gets no lab, a course whose canon assigns nothing anywhere gets none at all, and there is never more than one lab per module. Labs are never invented to fill a quota — an unfounded lab is worse than no lab, because it burns 4 hours of the learner's time on work nobody teaching this subject asks for. A lab does not replace the module's APPLICATION lesson (1c) and does not absolve it: the application lesson reads a real artifact, the lab makes the learner build one, and where a module has both the lab comes last.`,
      `1h. A planned lab is a lesson entry like any other — \`status: planned\`, \`type: lab\`, goal, opening, key_ideas, prerequisites, a spine step — with two differences: \`est_minutes\` is the time to READ THE BRIEF (the assignment's own length is \`lab.est_hours\`), and it carries a \`lab\` block: \`est_hours\` (3-5) plus \`checkpoints\`, the drafted plan. The checkpoint plan follows the progression norm: 2-4 warm-up \`exact\` checkpoints (one function each, instant verdict) -> middle checkpoints that COMPOSE (a later one consumes what an earlier one built) -> exactly one open \`metric\` task last, \`required: false\`; \`review\` checkpoints are optional garnish and always \`required: false\`; at least one checkpoint must stay required. Each id is a kebab-case slug and its \`text\` names a step of the build ("gradient of the log-loss"), never an ordinal ("part 2"). State in the lab's \`goal\` the ONE artifact the learner ends up with — a tour of disconnected exercises is not a lab. The plan is a plan: the lab-author skill executes it later and may split or deepen a checkpoint, so aim the set at an honest 3-5 hours rather than at a count.`,
      `1d. Lesson depth target: a core lesson is planned at 30-40 est_minutes of substantial reading (L2a) — derivations carried through, worked examples, boundary cases — with genuinely optional material planned as \`## ★\` starred sections inside the lesson rather than as thin extra chapters. Do NOT split coherent lessons to hit a number, and do not pad.`,
      `1f. Math in metadata (docs/content-model.md): tagline, goal, outcome and key_result text are typeset with KaTeX — write inline LaTeX between single dollars ($\\sum_i 2^{-l_i} \\le 1$), never ASCII mangling like "2^-li <= 1" or "sigma^2". Short and inline only.`,
      `1e. SLUG CONTINUITY — this course already exists and has drafted lessons. Read the current content/courses/${slug}/course.yaml FIRST. Where your new plan keeps a lesson whose subject matches an existing one, REUSE its exact slug and keep \`status: drafted\` plus any \`key_image\` (its prose will be revised later against the new plan; the brief must say what has to change). Only genuinely new or re-scoped lessons are added with \`status: planned\`. Never rename a drafted slug. In your final message, list explicitly: kept slugs, new slugs, and any existing lesson your plan drops (with the reason) — dropping requires the human's decision, so leave dropped lessons in place and flag them instead of deleting.`,
      `2. concepts.yaml — skeleton registry for every introduced concept.`,
      `3. research/sources.yaml — the canon list with URLs, access notes, and one-line roles.${degraded.length ? ` Sources the swarm could NOT fully read (JSON): ${JSON.stringify(degraded)} — record each with its access status, and flag them prominently in your final message: the human will obtain full copies from the publishers, so the research can be re-run for them later.` : ''}`,
      `4. research/images.yaml — the index of the captured image pool: every image_candidate the readers surfaced, deduplicated, each with its \`id\`, \`capture\` path under research/images/, what it shows, source, exact location, URL/PDF pointer, licence as stated, and quality note. The files are already on disk — nobody re-reads the source later. Delete captures you drop as duplicates so the pool and the index agree.`,
      `5. research/<lesson-slug>.md for EVERY lesson — the resumable brief: which source chapters/sections to consult (from the chapter maps), the key points the lesson must cover, and any pitfalls. Mine the reader summaries' figures and gems: name the concrete worked examples and set pieces (with source pointers) the lesson should recreate — do not let them evaporate between reading and writing. Include a FIGURE PLAN section: 4-8 planned visuals for the lesson, each tagged \`draw:\` or \`source:\`. \`draw:\` (the default, most of them) — one line on what it shows, whether it is a single <Figure> or a <FigureSequence> step-through (processes/algorithms should be sequences), and which source figure inspired the idea (recreate ideas, never copy drawings — docs/figures.md). \`source:\` — a real artefact from research/images.yaml that a redrawing would falsify (photograph, apparatus, scan of the original statement, published plot of measured data): give the images.yaml id (its capture is already on disk), the file stem to save the finished crop under, what the reader must be able to see in it, and placement (centered, or float left/right beside the prose). How many \`source:\` entries a lesson earns depends on the subject: for a technical course 1-2 is plenty, because the house voice is drawn figures; for a subject whose artefacts ARE the material (history, art, biology, medicine — photographs, documents, maps, specimens) sourced images can carry half the visuals. Never source what a clean drawing would explain better, and never pad a lesson with decoration. These briefs are what lesson-writer agents will be grounded in later — make them specific.`,
      `5a. Every brief also carries an EXERCISE PLAN (pedagogy E6/E7 + the domain overlay's difficulty floor): 4-8 planned exercises, each one line, and the plan must clear the floor — at most one mechanical warm-up, and at least two of {boundary probe at the degenerate case; plausible false claim to refute; derivation the lesson skipped (corollary, reverse direction, second proof, tight case); research-shaped task (reproduce a number from the source, estimate from real data, design the distinguishing experiment)}. Exactly one exercise is marked FORWARD (E7): it lands the reader on the doorstep of a later lesson's result — computing the object that lesson will name, or hitting the wall its mechanism removes — and the plan says which lesson it reaches. Plugging numbers into the formula just displayed is not an exercise; if the plan reads like a drill sheet, rewrite it.`,
      `5b. Every brief carries an ARC block (L10): what the lesson inherits from the spine, what it contributes, what it hands off — quoted from the spine step it belongs to — plus, for module-final lessons, the APPLICATION spec (the artifact, the module results it uses, the departure from the idealisation). For briefs of lessons that already exist as drafts (kept slugs), add a REVISION block: what the current lesson.mdx must gain (arc/seams/hand-off, exercise overhaul against the floor, application section, deeper derivations toward the depth target) and what it must lose (tautological KeyFacts per L15, citation theatre per L8a, knob-only demos per D1, obvious-narration per L9a).`,
      `5c. A LAB lesson's brief (1g) replaces the FIGURE PLAN and the EXERCISE PLAN with a LAB PLAN — the ARC block still applies, and this brief is what the lab-author skill is grounded in later. The LAB PLAN states: the one artifact the learner builds; the CANON GROUNDING, quoted from the dossier's \`assignments\` with its source pointer (which assignment of which source this lab is modelled on, and where it departs); the dataset or inputs, small enough to ship, with where they come from and their licence; one line per planned checkpoint — what the learner writes, what verifies it, and which earlier checkpoint's output it consumes; the final open task with its metric and a rough threshold to calibrate against; and the canonical bugs worth declaring as known-wrong variants (the sign a learner drops, the normalization they forget). Say what is deliberately NOT blanked (plotting helpers, data loading) — those ship complete.`,
      `Then run \`npm run validate ${slug}\` and fix everything. Final message: outcomes, one-line module arc, per-source role, which modules end with a lab and the canon assignment each is grounded in (or, when the canon assigns nothing, that no labs were planned and why), assumptions made.`,
    ].join('\n\n'),
    { label: 'synthesize-structure', model: 'fable' },
  )
  return { phase: 'structure', sources: sources.length, read: summaries.length, not_fully_read: degraded, synthesis }
}

if (phaseArg === 'lessons') {
  phase('Lessons')
  const plan = await run(
    `${at}Read content/courses/${slug}/course.yaml and return ALL lessons with status "planned", in course order (modules in file order, lessons in file order within each module). type = the entry's \`type\` field verbatim; hasDemo = the lesson's demo field is not null.`,
    { label: 'plan', model: 'sonnet', schema: PLAN_SCHEMA },
  )
  const todo = plan.lessons.slice(0, argv.count ?? plan.lessons.length)
  log(`writing ${todo.length} lesson(s): ${todo.map((l) => `${l.slug}${l.type === 'lab' ? ' [lab]' : ''}`).join(', ')}`)

  const labPrompt = (lessonSlug, fixes) =>
    [
      `${at}Execute this repo's lab-author skill, non-interactively: read .claude/skills/lab-author/SKILL.md (and the conventions it references) and follow it exactly for course-slug ${slug}, lesson-slug ${lessonSlug}.`,
      fixes
        ? `REVISION pass on a lab that already exists: apply these required QA fixes — ${JSON.stringify(fixes)} — and nothing else. Every fix that touches the solution or the checkpoints goes back through the execution loop.`
        : `Ground the lab in the LAB PLAN of content/courses/${slug}/research/${lessonSlug}.md — the artifact, the canon assignment it is modelled on, the dataset, the checkpoint-by-checkpoint plan and the bugs worth declaring as wrong variants — and in the \`lab\` block already planned in course.yaml. That checkpoint list (ids, kinds, required flags, est_hours) is the plan, not a cage: split or deepen a checkpoint where the difficulty calibration demands it.`,
      `In course.yaml, THIS lesson's status ends at \`drafted\` (flip it from \`planned\` yourself) and its \`lab\` block ends in sync with the \`challenges.yaml\` you executed; touch nothing else there. Never ask questions — report blockers in your final message.`,
    ].join('\n\n')

  const written = []
  // Sequential on purpose: each lesson must read its prerequisites' final text.
  for (const lesson of todo) {
    // A lab is authored by executing code, not by writing prose: the
    // lab-author skill's write -> uv run -> green loop, never lesson-writer.
    const isLab = lesson.type === 'lab'
    const draft = await (isLab
      ? run(labPrompt(lesson.slug), { label: `lab: ${lesson.slug}`, phase: 'Lessons', model: 'opus' })
      : run(
        `${at}Write the lesson: course-slug ${slug}, lesson-slug ${lesson.slug}. Follow your lesson-writer briefing (lesson-author skill + research brief).`,
        { label: `write: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer', model: 'opus' },
      ))
    // No draft means nothing downstream has a subject, and every later lesson
    // is written against this one's final text — stop here rather than plod on.
    if (draft === null) {
      log(`${lesson.slug}: writer produced nothing after retries — stopping; ${todo.length - written.length} lesson(s) left planned`)
      break
    }
    // Figures fan out in parallel — drawn and sourced alike. Builders own
    // only their own files: they never touch the registry, credits.yaml or
    // lesson.mdx, and one closing agent lands everything shared. A lab has no
    // FIGURE PLAN: its brief is short and its visuals are plots the notebook
    // draws from the learner's own results.
    const figs = isLab ? null : await run(
      `${at}Figure scan for lesson ${slug}/${lesson.slug}: read content/courses/${slug}/lessons/${lesson.slug}/lesson.mdx and the FIGURE PLAN in content/courses/${slug}/research/${lesson.slug}.md, and return everything still to build.\n\nTwo kinds. kind="component": <Figure name="..."> / <FigureSequence name="..."> references whose PascalCase name is NOT registered in apps/frontend/components/figures/index.ts (kebab-case names are plain SVG files already on disk — ignore those); the spec comes FIRST from the writer's {/* fig <Name>: ... */} comment — copy it verbatim — enriched from the FIGURE PLAN and surrounding prose. kind="sourced": every {/* img <file-stem>: ... */} handoff comment in the MDX and every \`source:\` entry in the FIGURE PLAN whose image file is not yet in the lesson's figures/ dir; the spec must carry what the reader must see, the research/images.yaml candidate id WITH its capture path under content/courses/${slug}/research/images/ when the pool has one — and when it does not, say "no pool candidate" plus whatever source pointer the handoff names, so the builder knows to hunt.`,
      { label: `figure-scan: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet', schema: FIGLIST_SCHEMA },
    )
    if (figs && figs.missing.length > 0) {
      const sourced = figs.missing.filter((f) => f.kind === 'sourced').length
      log(`${lesson.slug}: building ${figs.missing.length} figure(s) in parallel (${sourced} sourced)`)
      const built = (
        await parallel(
          figs.missing.map((f) => () =>
            run(
              f.kind === 'sourced'
                ? [
                    `${at}Produce ONE sourced image: ${f.name}${f.isSequence ? ' (multi-frame, used via <FigureSequence>)' : ''} for lesson ${slug}/${lesson.slug}.`,
                    `Spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow §Sourced images exactly. When the spec names a pool capture under content/courses/${slug}/research/images/, cut from it. When it says "no pool candidate" — or the pooled copy turns out inadequate — HUNT: find the image yourself (references/image-sources.md recipes; read the source page for caption/author/licence first), capture it into content/courses/${slug}/research/images/ under a new id, and use that. Both halves of the loop are mandatory: \`npm run image -- check\`, then LOOK at the file and answer the image checklist. If no honest copy exists at usable quality, say so and produce nothing rather than shipping mush.`,
                    `PARALLEL-SAFETY HARD LIMIT: other builders run concurrently — write ONLY content/courses/${slug}/lessons/${lesson.slug}/figures/${f.name}*.png (or .jpg) and, if you hunted, your own new capture file(s) under research/images/. Do NOT edit credits.yaml, lesson.mdx, or research/images.yaml. Final message MUST contain, verbatim and ready to paste: (a) the credits.yaml entry (a single \`*\` pattern entry if you made a sequence), (b) the <Figure .../> or <FigureSequence .../> snippet with alt and caption, plus float/width for a floated placement, and (c) if you hunted, the research/images.yaml entry for your new capture.`,
                  ].join('\n\n')
                : [
                    `${at}Build ONE component figure: ${f.name} (${f.isSequence ? 'multi-frame, used via <FigureSequence>' : 'single <Figure>'}) for lesson ${slug}/${lesson.slug}.`,
                    `Build spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow it exactly (component tier). The render-and-look loop is mandatory — the figure is not yet registered, so render by file path: \`npm run figure -- apps/frontend/components/figures/${slug}/${f.name}.tsx [frame]\` — and LOOK at the PNG every iteration, listing visible defects before declaring it done.`,
                    `PARALLEL-SAFETY HARD LIMIT: other figure builders run concurrently — do NOT edit apps/frontend/components/figures/index.ts or any file outside apps/frontend/components/figures/${slug}/${f.name}.tsx. Final message: the figure's one-line description and, for sequences, the frame count N.`,
                  ].join('\n\n'),
              { label: `${f.kind === 'sourced' ? 'image' : 'figure'}: ${f.name}`, phase: 'Lessons', model: 'opus' },
            ),
          ),
        )
      ).filter(Boolean)
      await run(
        [
          `${at}Land the figures built for lesson ${slug}/${lesson.slug}. Built: ${JSON.stringify(figs.missing.map((f) => ({ name: f.name, kind: f.kind, isSequence: f.isSequence })))}. Builder reports: ${JSON.stringify(built)}.`,
          `Component figures: add an import and a registry entry per figure in apps/frontend/components/figures/index.ts (frames: N for sequences, per the builder report), then verify each renders by registry name (\`npm run figure -- <Name>\`).`,
          `Sourced images: append each builder's credits entry to content/courses/${slug}/lessons/${lesson.slug}/figures/credits.yaml (create the file with \`schema_version: 1\` and \`images:\` if absent), replace the writer's matching {/* img <file-stem>: ... */} comment in lesson.mdx with the builder's <Figure>/<FigureSequence> snippet, and append any hunted-capture entries the builders reported to content/courses/${slug}/research/images.yaml. You are the only writer of these three shared files — never let a builder's snippet land twice.`,
          `Finish with \`npm run validate ${slug} ${lesson.slug}\` and \`npm run preview -- ${slug} ${lesson.slug}\`; Read the figures-only PNGs, both themes. If a figure failed to build, render or land, say so explicitly so QA catches it.`,
        ].join('\n\n'),
        { label: `figure-land: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet' },
      )
    }
    if (lesson.hasDemo) {
      await run(
        `${at}Execute this repo's demo-builder skill, non-interactively: read .claude/skills/demo-builder/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug}. Respect its hard limits.`,
        { label: `demo: ${lesson.slug}`, phase: 'Lessons' },
      )
    }
    const qaPrompt = `${at}Execute this repo's course-qa skill, non-interactively: read .claude/skills/course-qa/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug} (read-only, ${isLab ? 'lab lesson — build the notebook and score it against the rubric\'s lab section B1-B8, reading it as the learner before you open solution.py; report nothing `npm run validate` already reports' : 'full rubric'}). Then produce structured output: ready=true only if no REQUIRED fixes remain; fixes = prioritized required fixes (max 5).`
    const qa = await run(qaPrompt, {
      label: `qa: ${lesson.slug}`, phase: 'Lessons', model: 'opus', schema: QA_SCHEMA,
    })
    // The recorded verdict must describe the lesson as it stands: when a fix
    // agent ran, re-QA and record the post-fix verdict, not the stale one.
    let finalQa = qa
    let revised = false
    if (qa && !qa.ready && qa.fixes.length > 0) {
      await (isLab
        ? run(labPrompt(lesson.slug, qa.fixes), { label: `fix: ${lesson.slug}`, phase: 'Lessons', model: 'opus' })
        : run(
          `${at}Revise the lesson ${slug}/${lesson.slug}: apply these required QA fixes — ${JSON.stringify(qa.fixes)} — following your lesson-writer briefing (revision mode, same hard limits). Validate after.`,
          { label: `fix: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer', model: 'opus' },
        ))
      revised = true
      finalQa = await run(qaPrompt, {
        label: `re-qa: ${lesson.slug}`, phase: 'Lessons', model: 'opus', schema: QA_SCHEMA,
      })
    }
    written.push({ slug: lesson.slug, type: lesson.type, qaReady: finalQa ? finalQa.ready : null, revised })
    log(`${written.length}/${todo.length} done (${lesson.slug}${isLab ? ' [lab]' : ''}${revised ? ', revised after QA' : ''})`)
  }
  return { phase: 'lessons', written }
}

throw new Error(`unknown phase "${phaseArg}" — use "structure" or "lessons"`)
