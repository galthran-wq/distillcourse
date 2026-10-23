export const meta = {
  name: 'course-revision',
  description: 'Revise already-drafted lessons against their briefs REVISION blocks, then figures, demo, QA→fix',
  whenToUse: 'After a structure re-synthesis leaves drafted lessons that must be brought up to the new plan. Args: {slug, root, count?, from?}.',
  phases: [{ title: 'Revise', detail: 'per lesson: rewrite → figures → demo → QA → fix' }],
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['lessons', 'skippedLabs'],
  properties: {
    skippedLabs: {
      type: 'array',
      items: { type: 'string' },
      description: 'slugs of the drafted `type: lab` lessons excluded from `lessons` — an empty array is the positive assertion that the course has none',
    },
    lessons: {
      type: 'array',
      description: 'lessons with status drafted, excluding type: lab, in course order (modules in file order, lessons in file order)',
      items: {
        type: 'object',
        required: ['slug', 'hasDemo', 'demoNeedsWork', 'hasRevisionBlock'],
        properties: {
          slug: { type: 'string' },
          hasDemo: { type: 'boolean', description: 'the lesson entry has a non-null demo field' },
          demoNeedsWork: { type: 'boolean', description: 'the brief REVISION block or demo spec asks for the demo to change (new target, threshold, falsification task)' },
          hasRevisionBlock: { type: 'boolean', description: 'research/<slug>.md contains a REVISION block' },
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
          name: { type: 'string' },
          kind: { type: 'string', enum: ['component', 'sourced'] },
          isSequence: { type: 'boolean' },
          spec: { type: 'string' },
        },
      },
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

const argv = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const slug = argv.slug
if (!slug) throw new Error('args.slug is required')
const root = argv.root
const at = root
  ? `Repo root for ALL file reads and writes: ${root} (a git worktree). Use absolute paths under it; never touch any other checkout of this repo.\n\n`
  : ''

phase('Revise')

const plan = await agent(
  `${at}Read content/courses/${slug}/course.yaml and return ALL lessons with status "drafted" EXCEPT \`type: lab\` ones (a lab is revised through the lab-author skill's execution loop, never by this workflow's writer), in course order (modules in file order, lessons in file order within each module). For each, also read content/courses/${slug}/research/<slug>.md: hasRevisionBlock = it contains a "REVISION" section; demoNeedsWork = the REVISION block or the course.yaml demo spec asks the demo to change (a target to hit, a threshold to find, a claim to falsify) rather than just exist. Return the drafted lab slugs you excluded in \`skippedLabs\` (empty array when the course has none) — they are reported to the human, never silently dropped.`,
  { label: 'plan', model: 'sonnet', schema: PLAN_SCHEMA },
)

let todo = plan.lessons
if (argv.from) {
  const i = todo.findIndex((l) => l.slug === argv.from)
  if (i > 0) todo = todo.slice(i)
}
todo = todo.slice(0, argv.count ?? todo.length)
log(`revising ${todo.length} drafted lesson(s): ${todo.map((l) => l.slug).join(', ')}`)
// A drafted lab this workflow steps over may carry a REVISION block of its
// own, and no writer here will ever act on it — say so instead of leaving the
// human to infer it from a count.
const skippedLabs = plan.skippedLabs ?? []
if (skippedLabs.length) log(`${skippedLabs.length} drafted lab(s) skipped — revise each with /lab-author: ${skippedLabs.join(', ')}`)

// One chain per lesson; pipeline() keeps each lesson's steps in order while
// letting the next lesson start as soon as a slot frees. Shared-file writers
// (the figure landers) are told to re-read before appending, since two
// landers can overlap.
const done = await pipeline(
  todo,
  (lesson) =>
    agent(
      [
        `${at}REVISE the already-drafted lesson: course-slug ${slug}, lesson-slug ${lesson.slug}. Follow your lesson-writer briefing (lesson-author skill, revision mode: keep what complies, rewrite what does not).`,
        `The course was just re-synthesized under constitution v2. Before writing, read: docs/pedagogy.md (especially L2a/b depth and starred sections, L8a a/b citation discipline, L9a/b no narration of the obvious, L10 throughline, L12 evidence budget, L15 callouts carry load, E6/E7 exercise floor and the forward-reaching exercise, D1 demo teeth), docs/playbook-core.md, docs/playbook-math.md (the difficulty floor), the course \`spine\` in course.yaml, and the lesson's brief content/courses/${slug}/research/${lesson.slug}.md — its ARC block, FIGURE PLAN, EXERCISE PLAN and, above all, its REVISION block.`,
        `The REVISION block's "Gain" and "Lose" lists are the specification for this pass: apply every item. In particular — add the L10 arc paragraph, section seams and the hand-off named in ARC; rebuild the exercise set against the EXERCISE PLAN and the E6 floor (at most one mechanical warm-up; ≥2 of boundary probe / claim to refute / skipped derivation / research-shaped task) with exactly one FORWARD exercise whose solution names the later lesson with a <Ref>; cut the callouts the block names as tautologies (L15) and the citation theatre (L8a); deepen toward the lesson's est_minutes with real derivations, worked examples and boundary cases rather than padding; put genuinely optional material in \`## ★\` sections the core path survives skipping.`,
        `Figures: author the plain-SVG figures the FIGURE PLAN calls for yourself, and leave {/* fig <Name>: ... */} handoff comments for component figures and {/* img <file-stem>: ... */} handoffs for sourced images — a later agent in this same run builds and lands them. Do NOT write a <Figure src> for an image file that does not exist yet.`,
        `Hard limits: touch only this lesson's directory (lesson.mdx, its figures/) — no course.yaml edits (it is already drafted and its key_image stays), no other lessons, no docs. Finish with \`npm run validate ${slug} ${lesson.slug}\` and report what you gained, what you cut, and the new exercise mix.`,
      ].join('\n\n'),
      { label: `revise: ${lesson.slug}`, phase: 'Revise', agentType: 'lesson-writer', model: 'opus' },
    ),
  async (_prev, lesson) => {
    const figs = await agent(
      `${at}Figure scan for lesson ${slug}/${lesson.slug}: read content/courses/${slug}/lessons/${lesson.slug}/lesson.mdx and the FIGURE PLAN in content/courses/${slug}/research/${lesson.slug}.md, and return everything still to build.\n\nTwo kinds. kind="component": <Figure name="..."> / <FigureSequence name="..."> references whose PascalCase name is NOT registered in apps/frontend/components/figures/index.ts (kebab-case names are plain SVG files already on disk — ignore those); the spec comes FIRST from the writer's {/* fig <Name>: ... */} comment — copy it verbatim — enriched from the FIGURE PLAN and surrounding prose. kind="sourced": every {/* img <file-stem>: ... */} handoff comment in the MDX and every \`source:\` entry in the FIGURE PLAN whose image file is not yet in the lesson's figures/ dir; the spec must carry what the reader must see, the research/images.yaml candidate id WITH its capture path under content/courses/${slug}/research/images/ when the pool has one — and when it does not, say "no pool candidate" plus whatever source pointer the handoff names, so the builder knows to hunt.`,
      { label: `figure-scan: ${lesson.slug}`, phase: 'Revise', model: 'sonnet', schema: FIGLIST_SCHEMA },
    )
    if (figs && figs.missing.length > 0) {
      log(`${lesson.slug}: building ${figs.missing.length} figure(s)`)
      const built = (
        await parallel(
          figs.missing.map((f) => () =>
            agent(
              f.kind === 'sourced'
                ? [
                    `${at}Produce ONE sourced image: ${f.name}${f.isSequence ? ' (multi-frame, used via <FigureSequence>)' : ''} for lesson ${slug}/${lesson.slug}.`,
                    `Spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow §Sourced images exactly, INCLUDING the visible-not-legible test in docs/figures.md: an image earns its slot only if LOOKING transmits something (a plot of measured data, an apparatus, a face, a place) — a scan whose content is its text is a defect. When the spec names a pool capture under content/courses/${slug}/research/images/, cut from it; when it says "no pool candidate", hunt (read the source page for author/caption/licence BEFORE downloading). Both halves of the loop are mandatory: \`npm run image -- check\`, then LOOK at the file against the checklist. If no honest copy exists at usable quality, produce nothing and say so.`,
                    `PARALLEL-SAFETY HARD LIMIT: other builders run concurrently — write ONLY content/courses/${slug}/lessons/${lesson.slug}/figures/${f.name}*.png (or .jpg) and, if you hunted, your own new capture under research/images/. Do NOT edit credits.yaml, lesson.mdx or research/images.yaml. Final message MUST contain, verbatim: (a) the credits.yaml entry, (b) the <Figure>/<FigureSequence> snippet with alt and caption, (c) any research/images.yaml entry for a hunted capture.`,
                  ].join('\n\n')
                : [
                    `${at}Build ONE component figure: ${f.name} (${f.isSequence ? 'multi-frame, used via <FigureSequence>' : 'single <Figure>'}) for lesson ${slug}/${lesson.slug}.`,
                    `Build spec: ${f.spec}`,
                    `Read .claude/skills/figure-artist/SKILL.md and follow it exactly (component tier). The render-and-look loop is mandatory — the figure is not yet registered, so render by file path: \`npm run figure -- apps/frontend/components/figures/${slug}/${f.name}.tsx [frame]\` — and LOOK at the PNG every iteration, listing visible defects before declaring it done.`,
                    `PARALLEL-SAFETY HARD LIMIT: other figure builders run concurrently — do NOT edit apps/frontend/components/figures/index.ts or any file outside apps/frontend/components/figures/${slug}/${f.name}.tsx. Final message: the figure's one-line description and, for sequences, the frame count N.`,
                  ].join('\n\n'),
              { label: `${f.kind === 'sourced' ? 'image' : 'figure'}: ${f.name}`, phase: 'Revise', model: 'opus' },
            ),
          ),
        )
      ).filter(Boolean)
      await agent(
        [
          `${at}Land the figures built for lesson ${slug}/${lesson.slug}. Built: ${JSON.stringify(figs.missing.map((f) => ({ name: f.name, kind: f.kind, isSequence: f.isSequence })))}. Builder reports: ${JSON.stringify(built)}.`,
          `Component figures: add an import and a registry entry per figure in apps/frontend/components/figures/index.ts (frames: N for sequences), then verify each renders by registry name (\`npm run figure -- <Name>\`).`,
          `Sourced images: append each builder's credits entry to content/courses/${slug}/lessons/${lesson.slug}/figures/credits.yaml (create it with \`schema_version: 1\` and \`images:\` if absent), replace the matching {/* img <file-stem>: ... */} comment in lesson.mdx with the builder's snippet, and append hunted-capture entries to content/courses/${slug}/research/images.yaml.`,
          `CONCURRENCY: another lesson's lander may be editing apps/frontend/components/figures/index.ts and research/images.yaml at the same time. Re-read each shared file immediately before you edit it, APPEND your entries only, and never rewrite a shared file wholesale or delete an entry you did not add.`,
          `Finish with \`npm run validate ${slug} ${lesson.slug}\` and \`npm run preview -- ${slug} ${lesson.slug}\`; Read the figures-only PNGs in both themes. If a figure failed to build, render or land, say so explicitly.`,
        ].join('\n\n'),
        { label: `figure-land: ${lesson.slug}`, phase: 'Revise', model: 'sonnet' },
      )
    }
    return lesson
  },
  async (lesson) => {
    if (lesson.hasDemo && lesson.demoNeedsWork) {
      await agent(
        `${at}Execute this repo's demo-builder skill, non-interactively: read .claude/skills/demo-builder/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug}. The demo already exists: bring it up to pedagogy D1 — the reader must be able to DO something (hit a stated target, find the threshold where behaviour changes, or falsify a claim), not merely move a slider on a curve the lesson already plots. The course.yaml demo spec and the brief's REVISION block say what the target is. Keep the component's registered name; respect the skill's hard limits.`,
        { label: `demo: ${lesson.slug}`, phase: 'Revise' },
      )
    }
    return lesson
  },
  async (lesson) => {
    const qaPrompt = `${at}Execute this repo's course-qa skill, non-interactively: read .claude/skills/course-qa/SKILL.md and follow it exactly for course-slug ${slug}, lesson-slug ${lesson.slug} (read-only, full rubric — including the new X1-X3 exercise-difficulty, K1-K3 callout/citation and demo-teeth checks). Then produce structured output: ready=true only if no REQUIRED fixes remain; fixes = prioritized required fixes (max 5).`
    const qa = await agent(qaPrompt, {
      label: `qa: ${lesson.slug}`, phase: 'Revise', model: 'opus', schema: QA_SCHEMA,
    })
    let finalQa = qa
    let fixed = false
    if (qa && !qa.ready && qa.fixes.length > 0) {
      await agent(
        `${at}Revise the lesson ${slug}/${lesson.slug}: apply these required QA fixes — ${JSON.stringify(qa.fixes)} — following your lesson-writer briefing (revision mode, same hard limits). Validate after.`,
        { label: `fix: ${lesson.slug}`, phase: 'Revise', agentType: 'lesson-writer', model: 'opus' },
      )
      fixed = true
      finalQa = await agent(qaPrompt, {
        label: `re-qa: ${lesson.slug}`, phase: 'Revise', model: 'opus', schema: QA_SCHEMA,
      })
    }
    log(`done: ${lesson.slug}${fixed ? ' (fixed after QA)' : ''}${finalQa && finalQa.ready ? '' : ' — REQUIRED FIXES REMAIN'}`)
    return { slug: lesson.slug, qaReady: finalQa ? finalQa.ready : null, fixed, fixes: finalQa ? finalQa.fixes : [] }
  },
)

const results = done.filter(Boolean)
return {
  phase: 'revision',
  revised: results.length,
  skippedLabs,
  ready: results.filter((r) => r.qaReady).length,
  outstanding: results.filter((r) => !r.qaReady).map((r) => ({ slug: r.slug, fixes: r.fixes })),
}
