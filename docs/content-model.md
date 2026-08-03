# Content model

Human-readable guide to the content schema. The normative source is
`lib/content/schema.ts` (Zod) — if this document and the code disagree, the
code wins and this file needs fixing. Cross-file rules are enforced by
`lib/content/lint.ts` via `npm run validate`.

## Layout

```
content/courses/<course-slug>/
  course.yaml          # curation surface — the human owns this file
  concepts.yaml        # concept registry (append-mostly)
  research/            # the factory's dossier (see README)
    images.yaml        # index of real-image candidates found while reading
    images/            # their captures: whole pages / downloaded files
  lessons/<lesson-slug>/
    lesson.mdx         # the chapter; NO frontmatter (directory name = slug)
    figures/           # SVGs and sourced raster images used by <Figure>
      credits.yaml     # provenance of every raster file in this directory
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
| `slug`, `title`, `tagline` | identity |
| `status` | `planned \| in_progress \| published \| archived` |
| `audience`, `tone` | prose hints consumed by lesson-author |
| `outcomes[]` | backward design: `id`, `text`, `bloom` level |
| `modules[]` | `slug`, `title`, `outcomes` (ids claimed), `lessons[]` |

Per lesson:

| Field | Meaning |
|---|---|
| `slug` | kebab-case, = directory name, immutable once drafted |
| `type` | `core \| worked-practice \| synthesis \| review \| extra`. `extra` = advanced off-path chapter (a "starred section"): shown with an `extra` badge, and no non-extra lesson may list it as a prerequisite (lint: `extra-prereq`) — the core path must survive skipping every extra. |
| `status` | `planned → drafted → reviewed → published`. Skills may only set `drafted`; `reviewed`/`published` are manual human sign-offs. Production renders `published` only; dev and `CONTENT_PREVIEW=1` builds also render `drafted` and `reviewed`. |
| `goal` | exactly one objective, starts with a Bloom verb |
| `opening` | declarative first sentence stating the problem the lesson solves; lesson.mdx must open with it verbatim (no teasers, no rhetorical questions) |
| `est_minutes` | positive integer ≤60 (schema); 5–45 is the linted guidance band (warn only) |
| `prerequisites` | lesson slugs; forms an acyclic knowledge graph |
| `concepts.introduces / reinforces` | concept ids; spiral revisits visible here |
| `key_ideas` | 1–5 (schema); the author's planning aid, never a mandated section list (pedagogy L2) |
| `demo` | optional `{component: PascalCase, spec: prose}` consumed by demo-builder; `null` if none |
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
bytes stay in the content tree; `scripts/sync-assets.ts` copies them into
`public/course-assets/<course>/<lesson>/` at `predev`/`prebuild`/`prevalidate`
(the copy is git-ignored).

## lesson.mdx

No frontmatter. Layout auto-renders title/goal/est_minutes from course.yaml —
never duplicate them in the MDX. The body is a free-form textbook chapter:
`##` sections (numbered automatically, listed in the right-hand contents
sidebar), KaTeX math, and the component vocabulary from
`docs/components.md`: numbered environments `Definition`, `Theorem`,
`Proof`, `Example`, `Remark`; `Figure`, `Demo`, `Aside`; an `## Exercises`
section of `<Exercise>` blocks with collapsible `<Solution>`s; a final
`<References>` section.

The validator checks the shell, not the prose: unknown components,
unparseable MDX, demo-name mismatches, a `<Figure src>` with no file behind
it, a broken/truncated image, and an uncredited sourced image are errors; a
lesson not starting with its `opening`, missing exercises, missing
references, an exercise without a solution, a low-resolution or oversized
image, and an unused credits entry are warnings.

## Validation

- `npm run validate [course [lesson]]` — CLI, prints per-file pass/fail with
  rule ids. Every authoring skill runs this before reporting done.
- `next build` loads all content through the same schemas — invalid content
  cannot deploy (Dockerfile runs validate && build).
