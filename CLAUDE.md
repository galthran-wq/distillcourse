@AGENTS.md

# Project: course platform "distillcourse"

AI-authored, human-curated interactive courses. Read `README.md` for the
authoring loop and `docs/pedagogy.md` before writing ANY lesson content —
it is the constitution for all content generation.

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
- `lib/content/schema.ts` is the normative schema; `docs/content-model.md` is
  the human-readable guide — keep them in sync when either changes.
