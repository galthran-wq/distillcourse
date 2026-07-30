export const meta = {
  name: 'course-factory',
  description: 'Research-driven course production: canon discovery, source-reading swarm, structure synthesis with a resumable research dossier; then per-lesson write→demo→QA iteration',
  whenToUse: 'Invoked by the /course-architect (phase: structure) and /lesson-factory (phase: lessons) skills. Args: {phase, slug, topic?, count?}.',
  phases: [
    { title: 'Canon', detail: 'perplexity deep research: the mainstream sources', model: 'sonnet' },
    { title: 'Read', detail: 'one sonnet reader per source; each captures its image candidates', model: 'sonnet' },
    { title: 'Synthesize', detail: 'course.yaml + research dossier (session model)' },
    { title: 'Lessons', detail: 'write → figures (drawn + sourced, in parallel) → demo → QA(opus) → fix → re-QA(opus), per lesson' },
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
        required: ['slug', 'hasDemo'],
        properties: {
          slug: { type: 'string' },
          hasDemo: { type: 'boolean' },
        },
      },
      description: 'lessons with status planned, in course order (modules in order, lessons in order)',
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
      description: 'component figures referenced by the lesson but absent from components/figures/index.ts',
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

if (phaseArg === 'structure') {
  const topic = argv.topic ?? slug

  phase('Canon')
  const canon = await agent(
    `${at}Identify the canonical mainstream materials for learning "${topic}" at the level of a busy engineer (no prior expertise, comfortable with math). Use ToolSearch to load mcp__perplexity__perplexity_research and run ONE deep research query, then curate its output yourself. Source count is subject-dependent — no fixed cap; for a rich subject expect roughly 10-15 items: the standard textbooks, strong university course syllabi/lecture notes (with URLs), the load-bearing primary papers, good surveys, and 1-2 exceptional visual/interactive resources. Every item must earn a distinct role (a lesson or module it grounds) — no padding with redundant near-duplicates. Prefer freely accessible materials. Return via structured output; put verified URLs where you have them.`,
    { label: 'canon-scout', model: 'sonnet', schema: CANON_SCHEMA },
  )
  const sources = canon.sources.slice(0, 20)
  log(`canon: ${sources.length} sources — ${sources.map((s) => s.title).join('; ')}`)

  phase('Read')
  const summaries = (
    await parallel(
      sources.map((s) => () =>
        agent(
          `${at}Source to summarize: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind})${s.url ? `, URL: ${s.url}` : ' — locate it yourself (WebSearch), prefer official/legal copies'}. Reason it is canon: ${s.why}. Follow your source-reader briefing.\n\nCapture directory for image candidates: content/courses/${slug}/research/images/ — create it if missing, and prefix every id with a short source tag (e.g. \`shannon48-\`) so the swarm's ids never collide.`,
          { label: `read: ${s.title.slice(0, 30)}`, agentType: 'source-reader', schema: SUMMARY_SCHEMA },
        ),
      ),
    )
  ).filter(Boolean)
  log(`read: ${summaries.length}/${sources.length} sources summarized`)
  if (summaries.length === 0) throw new Error('no source could be read — aborting before synthesis')

  phase('Synthesize')
  const synthesis = await agent(
    [
      `${at}You are the course architect for the course "${topic}" (slug: ${slug}) in this repo. Read docs/pedagogy.md (C rules), docs/content-model.md, docs/voita-playbook.md (lesson skeleton, framework-first + flaw-driven sequencing, density norms), and the example .claude/skills/course-architect/examples/course.yaml.`,
      `Source summaries from the reading swarm (JSON): ${JSON.stringify(summaries)}`,
      `Produce, in content/courses/${slug}/:`,
      `1. course.yaml — outcomes first (Bloom), then modules/lessons per the pedagogy rules (no lesson-count cap — scope follows the material; no padding or micro-slicing, every lesson has one substantive goal) (easy openers, acyclic prerequisites, spiral reinforces, technical noun-phrase titles, declarative openings, demo specs only where the concept is dynamic). Mark advanced off-path chapters \`type: extra\` — starred sections the core path must survive skipping; no non-extra lesson may list one as a prerequisite (lint: extra-prereq). Include intro, course-level prerequisites, key_results, sources. All lessons status: planned.`,
      `2. concepts.yaml — skeleton registry for every introduced concept.`,
      `3. research/sources.yaml — the canon list with URLs, access notes, and one-line roles.`,
      `4. research/images.yaml — the index of the captured image pool: every image_candidate the readers surfaced, deduplicated, each with its \`id\`, \`capture\` path under research/images/, what it shows, source, exact location, URL/PDF pointer, licence as stated, and quality note. The files are already on disk — nobody re-reads the source later. Delete captures you drop as duplicates so the pool and the index agree.`,
      `5. research/<lesson-slug>.md for EVERY lesson — the resumable brief: which source chapters/sections to consult (from the chapter maps), the key points the lesson must cover, and any pitfalls. Mine the reader summaries' figures and gems: name the concrete worked examples and set pieces (with source pointers) the lesson should recreate — do not let them evaporate between reading and writing. Include a FIGURE PLAN section: 4-8 planned visuals for the lesson, each tagged \`draw:\` or \`source:\`. \`draw:\` (the default, most of them) — one line on what it shows, whether it is a single <Figure> or a <FigureSequence> step-through (processes/algorithms should be sequences), and which source figure inspired the idea (recreate ideas, never copy drawings — docs/figures.md). \`source:\` — a real artefact from research/images.yaml that a redrawing would falsify (photograph, apparatus, scan of the original statement, published plot of measured data): give the images.yaml id (its capture is already on disk), the file stem to save the finished crop under, what the reader must be able to see in it, and placement (centered, or float left/right beside the prose). At most 1-2 \`source:\` entries per lesson: the house voice is drawn figures, and sourced images are the exception that earns its place. These briefs are what lesson-writer agents will be grounded in later — make them specific.`,
      `Then run \`npm run validate ${slug}\` and fix everything. Final message: outcomes, one-line module arc, per-source role, assumptions made.`,
    ].join('\n\n'),
    { label: 'synthesize-structure' },
  )
  return { phase: 'structure', sources: sources.length, read: summaries.length, synthesis }
}

if (phaseArg === 'lessons') {
  phase('Lessons')
  const plan = await agent(
    `${at}Read content/courses/${slug}/course.yaml and return ALL lessons with status "planned", in course order (modules in file order, lessons in file order within each module). hasDemo = the lesson's demo field is not null.`,
    { label: 'plan', model: 'sonnet', schema: PLAN_SCHEMA },
  )
  const todo = plan.lessons.slice(0, argv.count ?? plan.lessons.length)
  log(`writing ${todo.length} lesson(s): ${todo.map((l) => l.slug).join(', ')}`)

  const written = []
  // Sequential on purpose: each lesson must read its prerequisites' final text.
  for (const lesson of todo) {
    await agent(
      `${at}Write the lesson: course-slug ${slug}, lesson-slug ${lesson.slug}. Follow your lesson-writer briefing (lesson-author skill + research brief).`,
      { label: `write: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer' },
    )
    // Figures fan out in parallel — drawn and sourced alike. Builders own
    // only their own files: they never touch the registry, credits.yaml or
    // lesson.mdx, and one closing agent lands everything shared.
    const figs = await agent(
      `${at}Figure scan for lesson ${slug}/${lesson.slug}: read content/courses/${slug}/lessons/${lesson.slug}/lesson.mdx and the FIGURE PLAN in content/courses/${slug}/research/${lesson.slug}.md, and return everything still to build.\n\nTwo kinds. kind="component": <Figure name="..."> / <FigureSequence name="..."> references whose PascalCase name is NOT registered in components/figures/index.ts (kebab-case names are plain SVG files already on disk — ignore those); the spec comes FIRST from the writer's {/* fig <Name>: ... */} comment — copy it verbatim — enriched from the FIGURE PLAN and surrounding prose. kind="sourced": every {/* img <file-stem>: ... */} handoff comment in the MDX and every \`source:\` entry in the FIGURE PLAN whose image file is not yet in the lesson's figures/ dir; the spec must carry what the reader must see, the research/images.yaml candidate id WITH its capture path under content/courses/${slug}/research/images/, and the placement.`,
      { label: `figure-scan: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet', schema: FIGLIST_SCHEMA },
    )
    if (figs && figs.missing.length > 0) {
      const sourced = figs.missing.filter((f) => f.kind === 'sourced').length
      log(`${lesson.slug}: building ${figs.missing.length} figure(s) in parallel (${sourced} sourced)`)
      const built = (
        await parallel(
          figs.missing.map((f) => () =>
            agent(
              f.kind === 'sourced'
                ? [
                    `${at}Produce ONE sourced image: ${f.name}${f.isSequence ? ' (multi-frame, used via <FigureSequence>)' : ''} for lesson ${slug}/${lesson.slug}.`,
                    `Spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow §Sourced images exactly. The capture is already on disk under content/courses/${slug}/research/images/ — cut from it; only re-capture if it is missing or shows the wrong page. Both halves of the loop are mandatory: \`npm run image -- check\`, then LOOK at the file and answer the image checklist. If the material cannot carry the figure honestly, say so and produce nothing rather than shipping mush.`,
                    `PARALLEL-SAFETY HARD LIMIT: other builders run concurrently — write ONLY content/courses/${slug}/lessons/${lesson.slug}/figures/${f.name}*.png (or .jpg). Do NOT edit credits.yaml, lesson.mdx, or anything else. Final message MUST contain, verbatim and ready to paste: (a) the credits.yaml entry (a single \`*\` pattern entry if you made a sequence) and (b) the <Figure .../> or <FigureSequence .../> snippet with alt and caption, plus float/width for a floated placement.`,
                  ].join('\n\n')
                : [
                    `${at}Build ONE component figure: ${f.name} (${f.isSequence ? 'multi-frame, used via <FigureSequence>' : 'single <Figure>'}) for lesson ${slug}/${lesson.slug}.`,
                    `Build spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow it exactly (component tier). The render-and-look loop is mandatory — the figure is not yet registered, so render by file path: \`npm run figure -- components/figures/${slug}/${f.name}.tsx [frame]\` — and LOOK at the PNG every iteration, listing visible defects before declaring it done.`,
                    `PARALLEL-SAFETY HARD LIMIT: other figure builders run concurrently — do NOT edit components/figures/index.ts or any file outside components/figures/${slug}/${f.name}.tsx. Final message: the figure's one-line description and, for sequences, the frame count N.`,
                  ].join('\n\n'),
              { label: `${f.kind === 'sourced' ? 'image' : 'figure'}: ${f.name}`, phase: 'Lessons', model: 'opus' },
            ),
          ),
        )
      ).filter(Boolean)
      await agent(
        [
          `${at}Land the figures built for lesson ${slug}/${lesson.slug}. Built: ${JSON.stringify(figs.missing.map((f) => ({ name: f.name, kind: f.kind, isSequence: f.isSequence })))}. Builder reports: ${JSON.stringify(built)}.`,
          `Component figures: add an import and a registry entry per figure in components/figures/index.ts (frames: N for sequences, per the builder report), then verify each renders by registry name (\`npm run figure -- <Name>\`).`,
          `Sourced images: append each builder's credits entry to content/courses/${slug}/lessons/${lesson.slug}/figures/credits.yaml (create the file with \`schema_version: 1\` and \`images:\` if absent), and replace the writer's matching {/* img <file-stem>: ... */} comment in lesson.mdx with the builder's <Figure>/<FigureSequence> snippet. You are the only writer of these two files — never let a builder's snippet land twice.`,
          `Finish with \`npm run validate ${slug} ${lesson.slug}\` and \`npm run preview -- ${slug} ${lesson.slug}\`; Read the figures-only PNGs, both themes. If a figure failed to build, render or land, say so explicitly so QA catches it.`,
        ].join('\n\n'),
        { label: `figure-land: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet' },
      )
    }
    if (lesson.hasDemo) {
      await agent(
        `${at}Execute this repo's demo-builder skill, non-interactively: read .claude/skills/demo-builder/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug}. Respect its hard limits.`,
        { label: `demo: ${lesson.slug}`, phase: 'Lessons' },
      )
    }
    const qaPrompt = `${at}Execute this repo's course-qa skill, non-interactively: read .claude/skills/course-qa/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug} (read-only, full rubric). Then produce structured output: ready=true only if no REQUIRED fixes remain; fixes = prioritized required fixes (max 5).`
    const qa = await agent(qaPrompt, {
      label: `qa: ${lesson.slug}`, phase: 'Lessons', model: 'opus', schema: QA_SCHEMA,
    })
    // The recorded verdict must describe the lesson as it stands: when a fix
    // agent ran, re-QA and record the post-fix verdict, not the stale one.
    let finalQa = qa
    let revised = false
    if (qa && !qa.ready && qa.fixes.length > 0) {
      await agent(
        `${at}Revise the lesson ${slug}/${lesson.slug}: apply these required QA fixes — ${JSON.stringify(qa.fixes)} — following your lesson-writer briefing (revision mode, same hard limits). Validate after.`,
        { label: `fix: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer' },
      )
      revised = true
      finalQa = await agent(qaPrompt, {
        label: `re-qa: ${lesson.slug}`, phase: 'Lessons', model: 'opus', schema: QA_SCHEMA,
      })
    }
    written.push({ slug: lesson.slug, qaReady: finalQa ? finalQa.ready : null, revised })
    log(`${written.length}/${todo.length} done (${lesson.slug}${revised ? ', revised after QA' : ''})`)
  }
  return { phase: 'lessons', written }
}

throw new Error(`unknown phase "${phaseArg}" — use "structure" or "lessons"`)
