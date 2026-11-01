# Content model

Human-readable guide to the content schema. The normative source is
`apps/frontend/lib/content/schema.ts` (Zod) — if this document and the code disagree, the
code wins and this file needs fixing. Cross-file rules are enforced by
`apps/frontend/lib/content/lint.ts` via `npm run validate`.

## Layout

```
content/courses/<course-slug>/
  course.yaml          # curation surface — the human owns this file
  intro.mdx            # optional rich introduction (full component vocabulary;
                       #   figures resolve against course-level figures/)
  figures/             # course-level figures for intro.mdx (+ credits.yaml)
  concepts.yaml        # concept registry (append-mostly)
  research/            # the factory's dossier (see README)
    images.yaml        # index of real-image candidates found while reading
    images/            # their captures: whole pages / downloaded files
    taught/<lesson>.md # ledger of what each drafted lesson explained (terms
                       #   as defined, notation, running examples, what it
                       #   left open) — written by the lesson's writer
  lessons/<lesson-slug>/
    lesson.mdx         # the chapter; NO frontmatter (directory name = slug)
    figures/           # SVGs and sourced raster images used by <Figure>
      credits.yaml     # provenance of every raster file in this directory
    solution.py        # lab lessons only — the reference solution (jupytext)
    challenges.yaml    # lab lessons only — the verification contract
    pyproject.toml     # lab lessons only — the lab's direct, pinned deps
    uv.lock            # lab lessons only — the committed transitive lock
    data/              # lab lessons only, optional — small data files
    private/           # lab lessons only, optional — never published
```

Modules exist only inside `course.yaml`; lesson directories are flat under
`lessons/`. Moving a lesson between modules is a YAML edit, no file moves.

## course.yaml

The only place structural metadata lives. Diff-friendly by convention: block
style YAML, one lesson per list entry, slugs immutable once status ≥ `drafted`.

| Field | Meaning |
|---|---|
| `schema_version` | always `1` for now |
| `intro` | short markdown introduction (the course page's TL;DR: overall idea + scope); warn if absent |
| `prerequisites` (course-level) | list of `{text, course?}` — what the reader needs first; `course` optionally links another course by slug |
| `key_results` | list of `{text, lesson}` — the course's headline theorems/facts, each linking the lesson that establishes it (lesson must exist) |
| `spine` | the course's argument as an ordered chain of steps, each `{step, lessons: [slugs]}` — every core lesson belongs to a step (L10); errors on unknown slugs, warns on uncovered core lessons |
| `sources` | main sources used to compile the course (course page bibliography); warn if empty |
| `slug`, `title`, `tagline` | identity; the home page shows the title and the tagline as written under the course's figure |
| `cover` | optional `{lesson, image}` — the figure the home page frames for the course, `image` a path relative to that lesson's dir (an `.svg` is drawn art the dark theme inverts; a raster fills the frame and is only dimmed). Unset: the `key_image` of the first lesson in course order that has one, any status; neither: an empty frame. Errors as `key_image` does (missing file, uncredited or broken raster), plus when `lesson` is not a lesson of the course. Human-curated: agents never set it |
| `status` | `planned \| in_progress \| published \| archived` |
| `audience`, `tone` | prose hints consumed by lesson-author |
| `outcomes[]` | backward design: `id`, `text`, `bloom` level |
| `modules[]` | `slug`, `title`, `outcomes` (ids claimed), `lessons[]` |

Per lesson:

| Field | Meaning |
|---|---|
| `slug` | kebab-case, = directory name, immutable once drafted |
| `type` | `core \| worked-practice \| synthesis \| review \| extra \| lab`. `extra` = advanced off-path chapter (a "starred section"): shown with an `extra` badge, and no non-extra lesson may list it as a prerequisite (lint: `extra-prereq`) — the core path must survive skipping every extra. `lab` = notebook assignment closing a module (see [Lab lessons](#lab-lessons)). |
| `status` | `planned → drafted → reviewed → published`. Skills may only set `drafted`; `reviewed`/`published` are manual human sign-offs. Production renders `published` only; dev and `CONTENT_PREVIEW=1` builds also render `drafted` and `reviewed`. |
| `goal` | exactly one objective, starts with a Bloom verb |
| `opening` | the problem the lesson solves, in plain words for a reader who knows only the prerequisites — a concrete situation and what makes it hard, never the lesson's conclusion (pedagogy L3); lesson.mdx must open with it verbatim (no teasers) |
| `est_minutes` | positive integer ≤60 (schema); 5–45 is the linted guidance band (warn only) |
| `prerequisites` | lesson slugs; forms an acyclic knowledge graph |
| `concepts.introduces / reinforces` | concept ids; spiral revisits visible here |
| `key_ideas` | 1–5 (schema); the author's planning aid, never a mandated section list (pedagogy L2) |
| `key_image` | optional path relative to the lesson dir — the lesson's signature visual, shown as the contents thumbnail; errors if missing/uncredited raster, warns when a drafted lesson has none |
| `demo` | optional `{component: PascalCase, spec: prose}` consumed by demo-builder; `null` if none |
| `lab` | required when `type: lab`, forbidden otherwise (schema error either way) — see below |
| `notes` | optional free-form instructions to skills |

## concepts.yaml

```yaml
concepts:
  - id: surprisal
    name: Surprisal
    definition: "Information content of one event: -log2 p, in bits"
    introduced_in: what-is-surprise
```

Every `concepts.*` entry in course.yaml must resolve here; `introduced_in`
must match the lesson that declares `introduces`.

## figures/credits.yaml

Provenance for sourced raster figures (docs/figures.md, third tier). Every
`.png/.jpg/.jpeg/.webp/.gif` file in a lesson's `figures/` needs an entry —
an uncredited image is a validation error, not a warning. SVGs are ours and
need nothing.

```yaml
schema_version: 1
images:
  - file: shannon-maze-mouse.jpg     # file name inside figures/; a `*` pattern
                                     # (frames-*.png) covers a whole sequence
    title: "Shannon with Theseus, his maze-solving mouse"
    credit: "Bell Labs / AT&T Archives"    # attribution line under the figure
    source_url: "https://commons.wikimedia.org/wiki/File:…"   # the page
    license: "public domain"               # exactly what the source states
    license_url: "https://…"               # optional
    retrieved: "2026-07-30"                # ISO date of download
    located: "arXiv:2103.00020 p.5 fig.3"  # optional: where inside the source
    modifications: "cropped to panel b, resized to 1200px"    # optional
    background: light                      # none (default) | light card
```

Rendered as an "Image credits" list at the end of the lesson's
`<References>` — one entry per line, linked to the source page. The image
bytes stay in the content tree; `apps/frontend/scripts/sync-assets.ts` copies them into
`apps/frontend/public/course-assets/<course>/<lesson>/` at `predev`/`prebuild`/`prevalidate`
(the copy is git-ignored).

## lesson.mdx

No frontmatter. Layout auto-renders title/goal/est_minutes from course.yaml —
never duplicate them in the MDX. The body is a free-form textbook chapter:
`##` sections (numbered automatically, listed in the right-hand contents
sidebar), KaTeX math, and the component vocabulary from
`docs/components.md`: numbered environments `Definition`, `Theorem`,
`Lemma`, `Proposition`, `Corollary`, `Proof`, `Example`, `Remark`,
`Verdict`, `Postulate`, `Thesis`; `Figure`, `Demo`, `Aside`; an `## Exercises`
section of `<Exercise>` blocks with collapsible `<Solution>`s; a final
`<References>` section.

The validator checks the shell, not the prose: unknown components,
unparseable MDX, demo-name mismatches, a `<Figure src>` with no file behind
it, a broken/truncated image, an uncredited sourced image, a
`<Verdict>`/`<Postulate>` whose `grade` is missing or off its scale, a
`<Thesis>` with a grade off the scale or no `from` (`env-grade`), and a `$…$` span
that holds prose rather than math (`stray-math`: a dollar amount written as
a bare `$` pairs with the next one and KaTeX swallows the text between) are
errors; a
lesson not starting with its `opening`, missing exercises, missing
references, an exercise without a solution, a low-resolution or oversized
image, an unused credits entry, and a canon author's surname or a citation
marker ("et al.", "handbook") in the lesson body outside `<References>` and
`<Quote>` (`source-in-prose`, read from `research/sources.yaml`) are
warnings.

Every readable course and lesson also has a Markdown twin at its page URL
plus `.md`, indexed by `/llms.txt` (`lib/content/markdown-export.ts`). It is
converted from the MDX source with the page's own visibility rule and the
page's own numbering; every component needs a Markdown mapping there, and
one without fails the export's tests rather than being dropped.

## Lab lessons

A lab is a lesson of `type: lab` closing a module: a notebook assignment the
learner solves in Colab (or any Jupyter) while a thin client verifies
checkpoints against the backend. It is a lesson and not a field on one, so
completion, activity and the contents sidebar work exactly as for a chapter.
Its `lesson.mdx` is a short brief (goal, what gets built, prerequisites); the
work lives in the lesson directory's `solution.py` + `challenges.yaml`, whose
formats are fixed by `.claude/skills/lab-author/references/conventions.md`.
`lab.ipynb` is generated by the build from `solution.py` — never
hand-written, never committed (git-ignored).

```yaml
      - slug: logistic-regression-from-scratch
        title: "Lab: logistic regression from scratch"
        type: lab
        status: drafted
        est_minutes: 10          # reading the brief; the work is est_hours
        # …the usual lesson fields…
        lab:
          est_hours: 4           # honest solve time; labs target 3–5
          checkpoints:
            - id: logloss
              kind: exact        # exact | metric | review
              text: "Implement the log-loss and its gradient"
              required: true     # the default for exact and metric
            - id: beat-baseline
              kind: metric
              text: "Beat ROC-AUC 0.85 on the held-out set"
              required: false
            - id: why-not-mse
              kind: review
              text: "Say why squared error is the wrong loss here"
              # required defaults to FALSE on a review, and saying `true`
              # here means the lesson cannot be completed until a model
              # agrees with the answer.
```

A checkpoint id is kebab-case and at most 64 characters — the length the
checkpoint API's own key is (`app/content/locators.py`), checked here because
its ingest refuses a longer one only after the content index has committed.

`required` gates completion, and its default depends on the kind: `true` for
`exact` and `metric`, `false` for `review`. A review is decided by a model
call, and an outage or a spent monthly budget leaves that verdict pending with
nothing to re-grade it — so a review checkpoint gates a lesson only where an
author writes `required: true` out.

`lab.checkpoints` is the **display** contract — what the lesson page and the
backend say the lab asks for. `challenges.yaml` is the **verification**
contract — how each checkpoint is checked. Lint holds them to the same id set
and, where `challenges.yaml` states a `kind` of its own, to the same kind per
id — so the page can never promise work the notebook does not check, nor
announce a threshold where the notebook only asks for a written answer:

- `lab-files` — a drafted lab lesson whose directory lacks `solution.py`,
  `challenges.yaml`, `pyproject.toml` or `uv.lock`, whose `challenges.yaml`
  has no `checkpoints` mapping, or whose `pyproject.toml` floors Python below
  3.11 — the build driver parses the lock with `tomllib` (error).
- `lab-checkpoints` — id sets differing between the two files, a `kind` the
  two files disagree on, a duplicate checkpoint id, or a lab whose every
  checkpoint is optional (error).

The lab build (`npm run build-labs`, and `npm run validate` in check mode)
executes the reference solution in the environment `uv.lock` pins, and turns
what it produces into two artefacts under `labs-dist/` (git-ignored):

- `public/<course>/<lesson>/` — the generated `lab.ipynb` (solution spans
  replaced by `# YOUR CODE HERE`, outputs stripped, a Colab badge and two
  generated header cells prepended — setup, then the `distill.login(...)` cell
  the learner pastes the lesson page's pairing code into), `manifest.json`
  (per checkpoint:
  kind, seed, `inputs_code`, `atol` — inputs are not secret) and the lesson's
  `data/` files. This half is what the public mirror serves.
- `private/<course>/<lesson>.json` — the answer key: expected outputs or their
  digests, known-wrong variants with their hints, the held-out labels, the
  metric and its threshold, the review rubric. Each checkpoint also carries,
  under `public`, the same fields the manifest above publishes: the checkpoint
  API serves the manifest itself, and one file is what keeps the inputs a
  learner computes on and the outputs they are compared against from being two
  ingests apart. This half is what the checkpoint API loads
  (`python -m app.content.ingest <index.json> <labs-private-dir>`) and
  compares against; it never becomes a `documents` row.

A lab whose inputs — its sources, the build driver, the mirror URLs — match
its last green run is skipped in both modes: the fingerprint is stamped in
`labs-dist/stamps/`, and deleting that directory forces a full run.

The lesson directory's `data/` is republished into that public half file for
file, so anything a checkpoint is graded against — held-out labels above all —
belongs in the lesson's `private/` instead: the build copies it into the run
and into neither artefact. A full build (no course or lesson named) also
deletes what it did not rebuild from both halves, because the private half is
read as the complete list of the labs that exist — a leftover artefact would
be an answer key nothing can retire.

Metric scores are stored and compared as "higher is better", so `rmse` is
negated: its threshold is authored negative (`threshold: -0.5` means "an RMSE
under 0.5 passes") while the lesson page and the notebook print the error
itself.

A checkpoint that raises, a `wrong` variant that matches the solution, a
metric threshold the reference fails to clear by 0.02, or a solution marker
still standing in the generated notebook — a typo in `# BEGIN SOLUTION` /
`# END SOLUTION` leaves the answer in the cell — fails validate with the
checkpoint or cell named: a lab whose solution is not green is invalid
content, the same as unparsable MDX. Both halves carry
`content_version` = `sha256(solution.py ‖ challenges.yaml)`, so a notebook
opened against a since-rebuilt lab is rejected rather than graded against the
wrong reference. Canonicalization — how an output becomes a comparable value
list or digest — is pinned by
`apps/frontend/lib/labs/python/canon_vectors.json`, shared with the client and
the checkpoint API.

`est_minutes` keeps its usual meaning for a lab: the brief's reading time.
The assignment's own length is `lab.est_hours`. The checkpoints reach the
backend as `metadata.lab` (`est_hours`, each checkpoint with its `order`, and
`data_files` — the lesson's `data/` at the mirror URLs the notebook fetches
them from) on every exported chunk of the lesson, mirrored like
`solutions_total`.

## Validation

- `npm run validate [course [lesson]]` — CLI, prints per-file pass/fail with
  rule ids. Every authoring skill runs this before reporting done.
- `next build` loads all content through the same schemas — invalid content
  cannot deploy (Dockerfile runs validate && build).
