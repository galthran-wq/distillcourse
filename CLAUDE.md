@AGENTS.md

# Project: course platform "distillcourse"

AI-authored, human-curated interactive courses. Read `README.md` for the repo
layout and the authoring loop, and `docs/pedagogy.md` before writing ANY lesson
content — it is the constitution for all content generation.

Monorepo: `content/` and `docs/` at the root, the Next site in
`apps/frontend/`, the FastAPI backend in `apps/backend/`, the `distill` client
a lab notebook talks to it with in `apps/lab-client/`, deployment in
`compose.yml` + `ops/` + `Makefile`. The root `package.json` proxies
`npm run dev|build|test|validate|figure|preview|image|export-index|build-labs`
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
`apps/backend/app/memory/`, the spaced-repetition ladder those proactive
messages are mostly made of in `apps/backend/app/review/`, and everything the
lab API is — pairing and bearer tokens, the manifest a notebook reads,
the checkpoints it submits and what they are graded against — in
`apps/backend/app/labs/`. Pairing runs notebook-first: `distill.login()` gets
a device code, prints an approval URL (`/labs/pair/[code]`, cookie-authed) and
polls until the raw token is released — exactly once, only its hash ever
stored; the code a learner copies off the lesson page into `login("<code>")`
is the no-browser fallback, and a `DISTILL_TOKEN` env var or Colab Secret
outranks both. Its one kind no comparison can answer, a `review`
checkpoint, is decided by a single toolless model call (`app/labs/judge.py`)
that borrows the harness's plumbing — the model, the usage row and the monthly
ceiling, which sums `lab_submissions.usage` alongside `messages.usage`.
The harness's prompt modules
(`app/harness/prompts/*.md`) are content, not configuration: `docs/pedagogy.md`
governs them exactly as it governs lessons, and they are written in the same
dry register.

Rules that override defaults:

- `content/courses/*/course.yaml` is the human's curation surface. Skills and
  agents may only flip a lesson's `status` from `planned` to `drafted` and
  set that lesson's `key_image` there — plus, for a `type: lab` lesson,
  rewrite that lesson's own `lab` block (checkpoint ids/kinds/required flags,
  `est_hours`) to keep it in sync with the `challenges.yaml` the authoring
  loop executed, and nothing else;
  never set `reviewed`/`published`, never restructure modules/lessons without
  being explicitly asked.
- Lesson slugs are immutable once status ≥ `drafted`.
- After generating or editing any content file, run `npm run validate` and fix
  failures before reporting done.
- Lesson MDX has no frontmatter; structural metadata lives in `course.yaml` only.
- Lab lessons (`type: lab`) are authored ONLY through the `lab-author` skill:
  `solution.py` (jupytext percent) + `challenges.yaml`, executed to green in
  the authoring loop before commit. `lab.ipynb` is a build artifact — never
  hand-written, never committed. The lesson's `data/` is republished to the
  public mirror file for file; anything a checkpoint is graded against —
  held-out labels above all — lives in the lesson's `private/`, which the
  build copies into the run and into neither artifact. A `review`
  checkpoint's `required` defaults to false (the judge is a model call, and
  an outage leaves its verdict pending with nothing to re-grade it);
  `exact` and `metric` default to true.
- The lab build is `apps/frontend/lib/labs/` (TypeScript orchestration plus
  `python/`, which runs inside each lab's own uv environment) driven by
  `scripts/build-labs.ts`. It EXECUTES the reference solution, and
  `npm run validate` runs it in check mode: a lab whose checkpoints are not
  green fails validation like broken MDX, and `uv` is a validate dependency
  wherever a lab lesson exists — missing, it is an error in both modes.
  Both modes skip a lab whose fingerprint (its sources, the driver, the
  mirror URLs) matches its last green run, stamped in `labs-dist/stamps/`;
  `make deploy` runs `build-labs` on the host before the image build, and the
  image validates with `--no-labs` — the one place labs are not executed.
  Output is `labs-dist/` (git-ignored), split
  into `public/` (student notebook, manifest, data — the mirror's half) and
  `private/` (expected outputs, labels, rubrics — the checkpoint API's half);
  never let the public half carry anything the private half exists to protect.
  A full build (no course or lesson named) also deletes from both halves what
  it did not rebuild: ingest reads the private half as the complete list of
  the labs that exist, so a leftover artifact is an answer key nothing can
  retire.
  `python/distill_capture.py` is the single implementation of the capture API
  and of canonicalization — the authoring loop copies that same file — and
  the committed files beside it are what hold the three implementations to
  one contract: `canon_vectors.json` (the value format),
  `metric_vectors.json` (what each metric is worth — `rmse` negated, so every
  metric reads higher-is-better) and `wire_shapes.json` (the field names of
  every message they pass), each read by all the suites that state them.
- `apps/lab-client/` is the `distill` package a learner's notebook installs:
  Python 3.10 (Colab's floor), httpx + numpy and nothing else,
  `./apps/lab-client/scripts/lint.sh` and `uv run pytest` before reporting
  done. It is the third implementation of canonicalization and holds itself to
  the same `canon_vectors.json`; the wire shapes it posts belong to
  `app/labs/schemas.py`, so a change to either is one PR touching both. The
  package is the source, `client/` in the public mirror is a copy of it.
- A lab lesson renders the standard lesson shell and then
  `components/labs/LabPanel`. Its checklist IS the lesson's own `lab` block —
  content, never a second read of the build — and only the state beside each
  row is the API's, through `lib/labs/api.ts` (the browser half of a directory
  that is otherwise the build's). The one thing the page takes from the built
  manifest is a `metric` checkpoint's threshold: the build calibrates it, so
  course.yaml cannot state it. Nothing is pushed to that page — it re-asks on
  focus and on a slow beat, and asks nothing while the tab is hidden.
- `apps/frontend/lib/content/schema.ts` is the normative schema;
  `docs/content-model.md` is the human-readable guide — keep them in sync when
  either changes.
- The backend reaches content ONLY through the `documents` table. It is filled
  by `npm run export-index` → `python -m app.content.ingest` (`make reindex`),
  never by reading `content/`. The export decides visibility with the site's
  own `isReadable`, and chunk anchors come from the site's own rehype-slug —
  if you change how lessons are rendered or which ones render, the export
  follows automatically; if you fork either, search starts lying.
  The one exception is a lab's answer key: the same command also loads
  `labs-dist/private/` (`npm run build-labs`, which `make reindex` runs) into
  `lab_challenges` via `app/labs/ingest.py`. It is an exception because it is
  the opposite rule — expected outputs, held-out labels and rubrics must NEVER
  become `documents` rows, which search returns and the tutor quotes. The
  manifest the notebook reads is served from `lab_challenges.spec["public"]`,
  whole; nothing assembles it field by field.
- The site's look is one layer, not per-page decisions: the tokens in
  `apps/frontend/app/globals.css` and the primitives in
  `apps/frontend/components/ui`. `@theme inline` holds the colors, `--radius-*`
  and `--shadow-card|popover` — consumed as Tailwind utilities
  (`rounded-sm|md|full`, `shadow-card`), not dereferenceable as CSS variables.
  Motion and elevation are plain `:root` variables, per theme: `--motion-fast`
  and `--motion-base` used as `duration-(--motion-*)`, `--elevation-card`
  and `--elevation-popover` reached through the `--shadow-*` utilities, and
  `--field`, the fill in `FIELD_CLASS` — a surface that is itself panel-filled
  overrides it (`[--field:var(--paper)]`) so a field is always one step off
  what it sits on. The prose blocks in `globals.css` (`.env`, `.callout`,
  `pre`) are surfaces too and write the surface radius out as `0.5rem`: they
  style markdown, not a class list.
  Anything that reads as a button is `ui/Button` — `solid` for the one primary
  action a view has, `outline`, `ghost`; menu rows, the switch and the chip —
  a small outlined control, mostly naming a thing rather than doing one — are
  their own controls and say so. Every text field carries
  `FIELD_CLASS` with a `FIELD_LABEL_CLASS` label — or, where the field is a box
  holding controls rather than a bare one, the pair `FIELD_BOX_CLASS` on the
  box and `FIELD_BOX_INPUT_CLASS` on the control inside it, which leaves the
  caller only geometry (the tutor's composer, whose send button is inside the
  field): the border, the fill and the ring are the box's, and the control
  hands its ring over. Every mono micro-cap carries `LABEL_CLASS`.
  The chip a referenced passage is shown as carries
  `CHIP_CLASS`; a menu or a preview that hangs open over the page carries
  `POPOVER_CLASS`, plus `MENU_CLASS`/`MENU_ITEM_CLASS` when it is a dropdown,
  and `MENU_ROW_CLASS` in place of `MENU_ITEM_CLASS` where the row lays
  columns of its own out (a name and a date) rather than one label —
  all from `ui/styles.ts`, with only geometry left to the caller. Never
  hand-roll one of those in a page or a demo; the
  focus ring is global (`@layer base`, so a utility can still override it) —
  including the one such a box wears for the control in it, which is the same
  rule in `globals.css` with `.field-box` added to its selector list, never a
  second statement of the ring in a class string.
  Motion belongs to that layer too, and there is no animation library: an
  entrance is an `@starting-style` transition (`starting:` utilities, or a rule
  in `globals.css` where the element's geometry already lives there), nothing
  runs longer than `--motion-base`, except an idle loop, which is a multiple
  of it, and `.anchor-flash` — the 2s one-shot marking the heading a reference
  sent the reader to, which is a message rather than a movement and is the one
  selector the blanket `prefers-reduced-motion` rule at the end of
  `globals.css` carves out. That rule turns off everything else, and a
  component never repeats it for itself. An exit needs the element to stay mounted
  while it plays: that is `useExitDelay` in `lib/ui/exit.ts`, fed
  `MOTION_BASE_MS`/`MOTION_FAST_MS` from `ui/styles.ts` — the millisecond
  copies of the two tokens, retuned with them. Never a second timer. A menu
  goes away the same way everywhere — a press outside it or Escape, which it
  spends rather than passing to the layer under it: `useDismiss` in
  `lib/ui/dismiss.ts`, never a second pair of those listeners. The one
  route transition, the page turn between two lessons, is the same layer:
  `experimental.viewTransition`, a `<ViewTransition>` around the lesson header
  — React runs a transition only for a commit that holds one, so this is what
  makes the turn happen at all — and `::view-transition-*` rules keyed on the
  type a `<Link transitionTypes>` sets.
- Code style is binding for ALL code in this repo:
  `.claude/skills/impl-review/style.md` — simplicity above all, WHY-comments
  only, grep before writing (no duplicated functionality), domain-separated
  file tree. Keep this CLAUDE.md current: a change that invalidates it
  updates it in the same PR.
