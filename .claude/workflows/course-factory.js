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

if (phaseArg === 'structure') {
  const topic = args?.topic ?? slug

  phase('Canon')
  const canon = await agent(
    `Identify the canonical mainstream materials for learning "${topic}" at the level of a busy engineer (no prior expertise, comfortable with math). Use ToolSearch to load mcp__perplexity__perplexity_research and run ONE deep research query, then curate its output yourself. Wanted: 4-7 items total — the 2-3 standard textbooks, 1-2 strong university course syllabi/lecture notes (with URLs), and 1-2 exceptional visual/interactive resources. Prefer freely accessible materials. Return via structured output; put verified URLs where you have them.`,
    { label: 'canon-scout', model: 'sonnet', schema: CANON_SCHEMA },
  )
  const sources = canon.sources.slice(0, 7)
  log(`canon: ${sources.length} sources — ${sources.map((s) => s.title).join('; ')}`)

  phase('Read')
  const summaries = (
    await parallel(
      sources.map((s) => () =>
        agent(
          `Source to summarize: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind})${s.url ? `, URL: ${s.url}` : ' — locate it yourself (WebSearch), prefer official/legal copies'}. Reason it is canon: ${s.why}. Follow your source-reader briefing.`,
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
      `You are the course architect for the course "${topic}" (slug: ${slug}) in this repo. Read docs/pedagogy.md (C rules), docs/content-model.md, docs/voita-playbook.md (lesson skeleton, framework-first + flaw-driven sequencing, density norms), and the example .claude/skills/course-architect/examples/course.yaml.`,
      `Source summaries from the reading swarm (JSON): ${JSON.stringify(summaries)}`,
      `Produce, in content/courses/${slug}/:`,
      `1. course.yaml — outcomes first (Bloom), then 10-15 lessons across 3-5 modules per the pedagogy rules (easy openers, acyclic prerequisites, spiral reinforces, technical noun-phrase titles, declarative openings, demo specs only where the concept is dynamic). Include intro, course-level prerequisites, key_results, sources. All lessons status: planned.`,
      `2. concepts.yaml — skeleton registry for every introduced concept.`,
      `3. research/sources.yaml — the canon list with URLs, access notes, and one-line roles.`,
      `4. research/<lesson-slug>.md for EVERY lesson — the resumable brief: which source chapters/sections to consult (from the chapter maps), the key points the lesson must cover, and any pitfalls. Include a FIGURE PLAN section: 4-8 planned visuals for the lesson — for each, one line saying what it shows, whether it is a single <Figure> or a <FigureSequence> step-through (processes/algorithms should be sequences), and which source figure inspired it (recreate ideas, never copy drawings — see docs/figures.md). These briefs are what lesson-writer agents will be grounded in later — make them specific.`,
      `Then run \`npm run validate ${slug}\` and fix everything. Final message: outcomes, one-line module arc, per-source role, assumptions made.`,
    ].join('\n\n'),
    { label: 'synthesize-structure' },
  )
  return { phase: 'structure', sources: sources.length, read: summaries.length, synthesis }
}

if (phaseArg === 'lessons') {
  phase('Lessons')
  const plan = await agent(
    `Read content/courses/${slug}/course.yaml and return ALL lessons with status "planned", in course order (modules in file order, lessons in file order within each module). hasDemo = the lesson's demo field is not null.`,
    { label: 'plan', model: 'sonnet', schema: PLAN_SCHEMA },
  )
  const todo = plan.lessons.slice(0, args?.count ?? plan.lessons.length)
  log(`writing ${todo.length} lesson(s): ${todo.map((l) => l.slug).join(', ')}`)

  const written = []
  // Sequential on purpose: each lesson must read its prerequisites' final text.
  for (const lesson of todo) {
    await agent(
      `Write the lesson: course-slug ${slug}, lesson-slug ${lesson.slug}. Follow your lesson-writer briefing (lesson-author skill + research brief).`,
      { label: `write: ${lesson.slug}`, phase: 'Lessons', agentType: 'lesson-writer' },
    )
    await agent(
      [
        `Component-figure pass for lesson ${slug}/${lesson.slug}, non-interactive.`,
        `Read the figure plan in content/courses/${slug}/research/${lesson.slug}.md and the lesson at content/courses/${slug}/lessons/${lesson.slug}/lesson.mdx. Collect every <Figure name="..."> and <FigureSequence name="..."> PascalCase component reference and check components/figures/index.ts. If every referenced component figure is already registered, stop and report "nothing missing" — build nothing.`,
        `Otherwise build each missing figure by reading .claude/skills/figure-artist/SKILL.md and following it exactly (component tier; register each in components/figures/index.ts, with frames: N for sequences). The render-and-look loop is mandatory — never ship a figure you have not rendered and looked at. Respect the skill's hard limits.`,
      ].join('\n\n'),
      { label: `figures: ${lesson.slug}`, phase: 'Lessons' },
    )
    if (lesson.hasDemo) {
      await agent(
        `Execute this repo's demo-builder skill, non-interactively: read .claude/skills/demo-builder/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug}. Respect its hard limits.`,
        { label: `demo: ${lesson.slug}`, phase: 'Lessons' },
      )
    }
    const qaPrompt = `Execute this repo's course-qa skill, non-interactively: read .claude/skills/course-qa/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug} (read-only, full rubric). Then produce structured output: ready=true only if no REQUIRED fixes remain; fixes = prioritized required fixes (max 5).`
    const qa = await agent(qaPrompt, {
      label: `qa: ${lesson.slug}`, phase: 'Lessons', model: 'opus', schema: QA_SCHEMA,
    })
    // The recorded verdict must describe the lesson as it stands: when a fix
    // agent ran, re-QA and record the post-fix verdict, not the stale one.
    let finalQa = qa
    let revised = false
    if (qa && !qa.ready && qa.fixes.length > 0) {
      await agent(
        `Revise the lesson ${slug}/${lesson.slug}: apply these required QA fixes — ${JSON.stringify(qa.fixes)} — following your lesson-writer briefing (revision mode, same hard limits). Validate after.`,
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
