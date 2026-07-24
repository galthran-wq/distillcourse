export const meta = {
  name: 'course-factory',
  description: 'Research-driven course production: canon discovery, source-reading swarm, structure synthesis with a resumable research dossier; then per-lesson write→demo→QA iteration',
  whenToUse: 'Invoked by the /course-architect (phase: structure) and /lesson-factory (phase: lessons) skills. Args: {phase, slug, topic?, count?}.',
  phases: [
    { title: 'Canon', detail: 'perplexity deep research: the mainstream sources', model: 'sonnet' },
    { title: 'Read', detail: 'one sonnet reader per source', model: 'sonnet' },
    { title: 'Synthesize', detail: 'course.yaml + research dossier (session model)' },
    { title: 'Lessons', detail: 'write → figures → demo → QA(opus) → fix → re-QA(opus), per lesson' },
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
    figures: { type: 'array', items: { type: 'string' }, description: 'notable/canonical visualizations and where' },
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
        required: ['name', 'isSequence', 'spec'],
        properties: {
          name: { type: 'string', description: 'PascalCase component name as referenced in the lesson' },
          isSequence: { type: 'boolean', description: 'true if referenced via <FigureSequence>' },
          spec: { type: 'string', description: 'one-paragraph build spec: what the figure shows, assembled from the lesson context and the research-brief FIGURE PLAN' },
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

const phaseArg = args?.phase ?? 'structure'
const slug = args?.slug
if (!slug) throw new Error('args.slug is required')

// Subagents inherit the SESSION's launch directory, not the orchestrator's
// current worktree — so the orchestrating skill passes args.root (absolute
// path of the course worktree) and every agent prompt is prefixed with it.
const root = args?.root
const at = root
  ? `Repo root for ALL file reads and writes: ${root} (a git worktree). Use absolute paths under it; never touch any other checkout of this repo.\n\n`
  : ''

if (phaseArg === 'structure') {
  const topic = args?.topic ?? slug

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
          `${at}Source to summarize: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind})${s.url ? `, URL: ${s.url}` : ' — locate it yourself (WebSearch), prefer official/legal copies'}. Reason it is canon: ${s.why}. Follow your source-reader briefing.`,
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
      `4. research/<lesson-slug>.md for EVERY lesson — the resumable brief: which source chapters/sections to consult (from the chapter maps), the key points the lesson must cover, and any pitfalls. Mine the reader summaries' figures and gems: name the concrete worked examples and set pieces (with source pointers) the lesson should recreate — do not let them evaporate between reading and writing. Include a FIGURE PLAN section: 4-8 planned visuals for the lesson — for each, one line saying what it shows, whether it is a single <Figure> or a <FigureSequence> step-through (processes/algorithms should be sequences), and which source figure inspired it (recreate ideas, never copy drawings — see docs/figures.md). These briefs are what lesson-writer agents will be grounded in later — make them specific.`,
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
  const todo = plan.lessons.slice(0, args?.count ?? plan.lessons.length)
  log(`writing ${todo.length} lesson(s): ${todo.map((l) => l.slug).join(', ')}`)

  const written = []
  // Sequential on purpose: each lesson must read its prerequisites' final text.
  for (const lesson of todo) {
    await agent(
      `${at}Write the lesson: course-slug ${slug}, lesson-slug ${lesson.slug}. Follow your lesson-writer briefing (lesson-author skill + research brief).`,
      { label: `write: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer' },
    )
    // Figures fan out in parallel: builders render by FILE PATH and never
    // touch the shared registry; one closing agent registers everything.
    const figs = await agent(
      `${at}Figure scan for lesson ${slug}/${lesson.slug}: read content/courses/${slug}/lessons/${lesson.slug}/lesson.mdx, collect every <Figure name="..."> and <FigureSequence name="..."> whose name is PascalCase (component tier — kebab-case names are plain SVG files, ignore those), and check which are NOT registered in components/figures/index.ts. For each missing one, the build spec comes FIRST from the writer's {/* fig <Name>: ... */} MDX comment above the reference — copy it verbatim, it is the writer's handoff; enrich (or reconstruct, if the comment is missing) from the FIGURE PLAN in content/courses/${slug}/research/${lesson.slug}.md and the surrounding lesson text.`,
      { label: `figure-scan: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet', schema: FIGLIST_SCHEMA },
    )
    if (figs && figs.missing.length > 0) {
      log(`${lesson.slug}: building ${figs.missing.length} component figure(s) in parallel`)
      const built = (
        await parallel(
          figs.missing.map((f) => () =>
            agent(
              [
                `${at}Build ONE component figure: ${f.name} (${f.isSequence ? 'multi-frame, used via <FigureSequence>' : 'single <Figure>'}) for lesson ${slug}/${lesson.slug}.`,
                `Build spec: ${f.spec}`,
                `Read .claude/skills/figure-artist/SKILL.md and follow it exactly (component tier). The render-and-look loop is mandatory — the figure is not yet registered, so render by file path: \`npm run figure -- components/figures/${slug}/${f.name}.tsx [frame]\` — and LOOK at the PNG every iteration, listing visible defects before declaring it done.`,
                `PARALLEL-SAFETY HARD LIMIT: other figure builders run concurrently — do NOT edit components/figures/index.ts or any file outside components/figures/${slug}/${f.name}.tsx. Final message: the figure's one-line description and, for sequences, the frame count N.`,
              ].join('\n\n'),
              { label: `figure: ${f.name}`, phase: 'Lessons' },
            ),
          ),
        )
      ).filter(Boolean)
      await agent(
        `${at}Register the freshly built component figures for lesson ${slug}/${lesson.slug} in components/figures/index.ts: ${JSON.stringify(figs.missing.map((f) => ({ name: f.name, isSequence: f.isSequence })))}. Builder reports: ${JSON.stringify(built)}. Add an import and a registry entry per figure (frames: N for sequences, per the builder report). Then verify each renders by registry name (\`npm run figure -- <Name>\`) and run \`npm run validate ${slug} ${lesson.slug}\`. If a figure failed to build or render, say so explicitly so QA catches it.`,
        { label: `figure-register: ${lesson.slug}`, phase: 'Lessons', model: 'sonnet' },
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
