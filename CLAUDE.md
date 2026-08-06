@AGENTS.md

# Project: course platform "distillcourse"

AI-authored, human-curated interactive courses. Read `README.md` for the repo
layout and the authoring loop, and `docs/pedagogy.md` before writing ANY lesson
content — it is the constitution for all content generation.

Monorepo: `content/` and `docs/` at the root, the Next site in
`apps/frontend/`, the FastAPI backend in `apps/backend/`, deployment in
`compose.yml` + `ops/` + `Makefile`. The root `package.json` proxies
`npm run dev|build|test|validate|figure|preview|image|export-index`
into the frontend — run them from the repo root, with paths written from the
repo root.

Backend work: Python 3.14 + uv, async everywhere (`AsyncSession`, async
routes), SQLAlchemy 2.0 typed models — never SQLModel, never a sync session.
`./apps/backend/scripts/lint.sh` (ruff + mypy strict) and
`./apps/backend/scripts/test.sh` must pass before reporting done; both are
what CI runs. Migrations are explicit and always reversible — autogenerate is
a draft to rewrite, never the artefact. `apps/backend/README.md` is the guide.

The tutor harness lives in `apps/backend/app/harness/`; everything about
messages the platform starts by itself — the poller process, quiet hours, the
proactive slot — lives in `apps/backend/app/scheduling/`, the Telegram channel
it delivers over — webhook, pairing, sending — in `apps/backend/app/telegram/`,
what the tutor remembers about a learner across every chat and medium in
`apps/backend/app/memory/`, and the spaced-repetition ladder those proactive
messages are mostly made of in `apps/backend/app/review/`. The harness's prompt modules
(`app/harness/prompts/*.md`) are content, not configuration: `docs/pedagogy.md`
governs them exactly as it governs lessons, and they are written in the same
dry register.

Rules that override defaults:

- `content/courses/*/course.yaml` is the human's curation surface. Skills and
  agents may only flip a lesson's `status` from `planned` to `drafted` and
  set that lesson's `key_image` there;
  never set `reviewed`/`published`, never restructure modules/lessons without
  being explicitly asked.
- Lesson slugs are immutable once status ≥ `drafted`.
- After generating or editing any content file, run `npm run validate` and fix
  failures before reporting done.
- Lesson MDX has no frontmatter; structural metadata lives in `course.yaml` only.
- `apps/frontend/lib/content/schema.ts` is the normative schema;
  `docs/content-model.md` is the human-readable guide — keep them in sync when
  either changes.
- The backend reaches content ONLY through the `documents` table. It is filled
  by `npm run export-index` → `python -m app.content.ingest` (`make reindex`),
  never by reading `content/`. The export decides visibility with the site's
  own `isReadable`, and chunk anchors come from the site's own rehype-slug —
  if you change how lessons are rendered or which ones render, the export
  follows automatically; if you fork either, search starts lying.
- Code style is binding for ALL code in this repo:
  `.claude/skills/impl-review/style.md` — simplicity above all, WHY-comments
  only, grep before writing (no duplicated functionality), domain-separated
  file tree. Keep this CLAUDE.md current: a change that invalidates it
  updates it in the same PR.
