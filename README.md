# distillcourse

Textbook-quality interactive courses on fundamental topics, built for busy
engineers who keep starting textbooks and never finishing them.

The human curates course structure by editing files in git; Claude Code
skills and workflows generate the content. `docs/pedagogy.md` is the
constitution; the playbook stack holds the mechanics behind it —
`docs/playbook-core.md` (universal invariants), `docs/voita-playbook.md`
(exposition layer), `docs/playbook-math.md` / `docs/playbook-history.md`
(domain overlays).

## Repo layout

```
content/          # THE curation surface — courses, lessons, figures (see below)
apps/frontend/    # the Next site: app/ components/ lib/ public/ scripts/ tests/
apps/backend/     # the FastAPI service: API, and later the tutor harness
ops/              # caddy config, postgres init, the backup restore drill
compose.yml       # caddy · frontend · backend · postgres · backup
docs/ .claude/    # the constitution and the authoring skills/workflows
```

`content/` sits at the root rather than inside the frontend because it is what
the human curates and what the content factory writes; the site is one consumer
of it. The root `package.json` proxies the everyday scripts into
`apps/frontend`, so every command below runs from the repo root.

## How content works

```
content/courses/<course>/
  course.yaml        # THE curation surface: outcomes, modules, lessons
  concepts.yaml      # concept registry
  research/          # the factory's resumable dossier:
    sources.yaml     #   canon list with roles and URLs
    images.yaml      #   real-image candidates the readers found worth using
    images/          #   their captures — the source is never re-read
    texts/           #   raw fetched material (PDFs, extracted text) with
                     #   .meta.yaml sidecars — git-ignored; writers read from
                     #   here instead of re-fetching the sources
    <lesson>.md      #   per-lesson brief: which chapters to consult, key
                     #   points, figure plan (each visual draw: or source:)
  lessons/<slug>/
    lesson.mdx       # a textbook chapter: free-form MDX, no frontmatter —
                     # numbered Definition/Theorem/Proof/Example/Remark
                     # environments, KeyFact/Task callouts, figures and
                     # step-through sequences, Exercises with collapsible
                     # Solutions, References; right ToC rendered automatically
    figures/         # SVGs we drew + sourced images (photos, scans, real
      credits.yaml   #   plots), each credited here — provenance or no image
```

- `course.yaml` is the single source of structural truth (no MDX frontmatter).
- Lesson status flow: `planned → drafted → reviewed → published`. Skills may
  only set `drafted`; `reviewed`/`published` are manual human sign-offs.
- **Visibility:** production renders `published` only. Dev — and any build
  with `CONTENT_PREVIEW=1` (the Docker staging default, see
  `apps/frontend/Dockerfile`) — renders `drafted` and `reviewed` too, so
  drafts are reviewed in the real site before any status flip.
- `npm run validate` gates every build (Docker runs validate && build).

## Authoring: the course factory (primary path)

Course production is a two-button workflow, orchestrated on Fable (both
buttons refuse to run on other models), inside a git worktree on branch
`course/<slug>` — nothing lands on master until the human merges.

1. `/course-architect "<topic>"` — canon discovery (perplexity deep
   research) → a sonnet swarm reads the sources, each reader also scouting
   the few images that would have to be the real artefact → synthesis writes
   `course.yaml`, `concepts.yaml`, and the `research/` dossier (including
   `images.yaml`, the shortlist, and per-lesson figure plans that say which
   visuals we draw and which we source).
2. **Human curates** `course.yaml` AND the per-lesson `research/` briefs in
   the worktree — the main editorial checkpoint.
3. `/lesson-factory <slug> [n]` — per planned lesson, sequentially:
   lesson-writer (session model, grounded in the brief) → figure-artist
   agents in parallel (drawn figures, and sourced images cut from the
   research captures) → demo-builder where specced → opus QA → one fix
   cycle. Requires the `research/` dossier.
4. Human reviews in `npm run dev`, flips statuses, merges the branch.

## Manual single-lesson tools (escape hatch)

`/lesson-author <course> <lesson|next>`, `/demo-builder <course> <lesson>`,
`/figure-artist <Name|file-stem>`, `/course-qa <course> [lesson]` — the same
skills the factory drives,
invocable directly for one-off writing or revision.

## Development

```bash
npm run install:frontend   # first time only: installs apps/frontend/node_modules
npm run dev        # dev server (renders drafted + reviewed + published)
npm run validate   # schema + shell lint over all content
npm test           # vitest
npm run lint       # eslint over the frontend
npm run typecheck  # tsc --noEmit
npm run figure -- <Name> [frame] [--dark]   # render a component figure
npm run image -- check <file>               # sourced-image toolkit: verify,
                                            # fetch, PDF-extract, crop, fit
npm run preview -- <course> <lesson>        # render a chapter, both themes
npm run sync-assets  # copy lesson raster figures into the frontend's public/
npm run build      # production build
```

Rendered previews (`figure`, `preview`) land in `apps/frontend/.preview/`.

The backend needs `uv` and a Postgres; `docker compose up -d db` gives one,
plus the `_test` database its suite insists on. `apps/backend/README.md` covers
the service, migrations and the dormant mail module.

```bash
docker compose up -d db          # postgres 17 + the test database
./apps/backend/scripts/lint.sh   # ruff + mypy strict
./apps/backend/scripts/test.sh   # pytest, on a database built by the migrations
npm run generate-client          # backend OpenAPI -> apps/frontend/lib/api
```

`lib/api/` and the spec it comes from are generated, not committed: run
`npm run generate-client` after a clone and after any API change.

## Running the whole thing

`compose.yml` is the deployment and the way to run the full stack locally:
caddy in front, the Next site, the API, Postgres, and a daily backup
container. `cp .env.example .env`, then `make up`. `docs/deployment.md` has
the topology, the manual `make deploy` procedure, and the backup and restore
drill.

The frontend finds `content/` by climbing out of `apps/frontend`, so it must
be built with that as the working directory (what the root `npm run build`
does). A host that builds from somewhere else fails the build with an
explicit message; point it at the tree with `CONTENT_ROOT=/abs/path/content`.

Sourced images (photographs, scans, published plots) need `poppler-utils`
and `imagemagick` for extraction and resizing; `npm run validate` itself
stays dependency-free.

Key code (all under `apps/frontend/`): `lib/content/schema.ts` (Zod schemas —
normative), `lib/content/lint.ts` (shell rules). Guides:
`docs/content-model.md` (schema guide),
`docs/components.md` (MDX vocabulary), `docs/figures.md` +
`docs/voita-playbook.md` (figure and structure mechanics),
`docs/playbook-core.md` + domain overlays (argument and evidence mechanics).
