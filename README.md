# Grasp (working title)

Textbook-quality interactive courses on fundamental topics, built for busy
engineers who keep starting textbooks and never finishing them.

The human curates course structure by editing files in git; Claude Code
skills and workflows generate the content. `docs/pedagogy.md` is the
constitution; `docs/voita-playbook.md` holds the structural mechanics both
follow.

## How content works

```
content/courses/<course>/
  course.yaml        # THE curation surface: outcomes, modules, lessons
  concepts.yaml      # concept registry
  research/          # the factory's resumable dossier:
    sources.yaml     #   canon list with roles and URLs
    <lesson>.md      #   per-lesson brief: which chapters to consult,
                     #   key points, figure plan
  lessons/<slug>/
    lesson.mdx       # a textbook chapter: free-form MDX, no frontmatter —
                     # numbered Definition/Theorem/Proof/Example/Remark
                     # environments, KeyFact/Task callouts, figures and
                     # step-through sequences, Exercises with collapsible
                     # Solutions, References; right ToC rendered automatically
```

- `course.yaml` is the single source of structural truth (no MDX frontmatter).
- Lesson status flow: `planned → drafted → reviewed → published`. Skills may
  only set `drafted`; `reviewed`/`published` are manual human sign-offs.
- **Visibility:** production renders `published` only. Dev — and any build
  with `CONTENT_PREVIEW=1` (the Docker staging default, see Dockerfile) —
  renders `drafted` and `reviewed` too, so drafts are reviewed in the real
  site before any status flip.
- `npm run validate` gates every build (Docker runs validate && build).

## Authoring: the course factory (primary path)

Course production is a two-button workflow, orchestrated on Fable (both
buttons refuse to run on other models), inside a git worktree on branch
`course/<slug>` — nothing lands on master until the human merges.

1. `/course-architect "<topic>"` — canon discovery (perplexity deep
   research) → a sonnet swarm reads the sources → synthesis writes
   `course.yaml`, `concepts.yaml`, and the `research/` dossier.
2. **Human curates** `course.yaml` AND the per-lesson `research/` briefs in
   the worktree — the main editorial checkpoint.
3. `/lesson-factory <slug> [n]` — per planned lesson, sequentially:
   lesson-writer (session model, grounded in the brief) → demo-builder where
   specced → opus QA → one fix cycle. Requires the `research/` dossier.
4. Human reviews in `npm run dev`, flips statuses, merges the branch.

## Manual single-lesson tools (escape hatch)

`/lesson-author <course> <lesson|next>`, `/demo-builder <course> <lesson>`,
`/figure-artist <Name>`, `/course-qa <course> [lesson]` — the same skills
the factory drives, invocable directly for one-off writing or revision.

## Development

```bash
npm run dev        # dev server (renders drafted + reviewed + published)
npm run validate   # schema + shell lint over all content
npm test           # vitest
npm run figure -- <Name> [frame] [--dark]   # render a component figure to .preview/
npm run build      # production build
```

Key code: `lib/content/schema.ts` (Zod schemas — normative),
`lib/content/lint.ts` (shell rules), `docs/content-model.md` (schema guide),
`docs/components.md` (MDX vocabulary), `docs/figures.md` +
`docs/voita-playbook.md` (figure and structure mechanics).
