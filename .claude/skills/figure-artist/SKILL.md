---
name: figure-artist
description: Produce or revise ONE figure for a lesson — drawn in house style (component figure with HTML+KaTeX+SVG, or a simple raw SVG), or a real sourced image (photograph, scan, published data plot) placed and credited. Verified through the render-and-look loop. Use when a lesson needs a figure built, a source figure recreated, or an existing figure fixed.
argument-hint: "<FigureName | figure description | image file-stem> [reference image path]"
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run figure:*), Bash(npm run image:*), Bash(npm run preview:*), Bash(npm run validate:*), Bash(npx tsc:*), Bash(npx eslint:*), Bash(rsvg-convert:*), Bash(curl:*), Bash(pdftoppm:*), Bash(pdfimages:*), Bash(convert:*), Bash(identify:*)
---

# Figure Artist

You produce one figure per invocation, to Voita-grade quality, and you NEVER
ship a figure you haven't looked at.

The style contract: @docs/figures.md. The composition rules (12 load-bearing
rules from the reference-corpus dissection): @docs/voita-playbook.md §Figure
composition rules. Gold example:
`components/figures/examples/W2vOneStep.tsx`.

## Choose the tier

- **Component figure** (default for anything with formulas, sentences,
  labeled pipelines, comparisons): a pure hook-free React component in
  `components/figures/<course>/<Name>.tsx` — HTML/flex for text layout,
  `<M tex=…/>` (KaTeX) for ALL math, inline SVG only for pure graphics
  (arrows, boxes, curves, grids). Inline styles + `palette.ts` constants
  ONLY — no Tailwind (the verifier renders standalone). Register it in
  `components/figures/index.ts`. Embed via `<Figure name="<Name>" …/>`.
- **Raw SVG** (simple plots/diagrams with few short labels): author
  `figures/<name>.svg` in the lesson dir per docs/figures.md; embed via
  `<Figure src="./figures/<name>.svg" …/>`.
- **Sourced image** (the artefact tier): a real photograph, apparatus, page
  scan, portrait, or published plot of measured data — something a redrawing
  would falsify. You do not invent it and you do not redraw it: the reading
  swarm already captured it into `content/courses/<c>/research/images/`, and
  your job is to cut the figure out of that capture, verify it, and credit
  it. See §Sourced images below.

Drawn tiers are the default. A sourced image is the exception that earns its
place: a foreign-style schematic with 8px labels is worse than a clean
house-style drawing of the same idea. If a `source:` figure turns out to be
unusable, say so and draw it instead.

## Workflow (drawn tiers)

1. **Understand the subject.** Read the lesson context / research-brief
   figure plan. If a reference image is given (path or URL), curl it if
   needed and LOOK at it (Read) — you are recreating the idea in house
   style, never tracing the drawing (copyright).
2. **Design before drawing:** one idea; which semantic roles exist and
   which color each gets (accent = subject, support blue = second role, ≤4
   hues, every hue named in a label); reading order; where math binds to
   graphics (colors in the TeX must match the boxes).
3. **Author** the component/SVG.
4. **THE LOOP — mandatory:** render and look, fix, repeat:
   - component: `npm run figure -- <Name> [frame]`, then Read the PNG in
     `.preview/`; also check `--dark` once near the end. Not yet registered
     (e.g. parallel builds where index.ts is off-limits)? Render by path:
     `npm run figure -- components/figures/<course>/<Name>.tsx [frame]`.
   - raw SVG: `rsvg-convert -w 1200 -b white <file> -o /tmp/…png`, Read it.
   List the defects you SEE (clipped labels, collisions, broken TeX shown
   as red source, spacing, misaligned arrows) and fix them. Repeat until a
   pass finds zero defects. Never conclude from the code that it "should"
   look right.
5. **Check:** `npx tsc --noEmit` (component tier) and, if you touched the
   registry, `npx eslint components/figures`.
6. **Report:** final preview path, the defects each iteration caught, and
   the one-line statement of what the figure shows.

## Sourced images

The material is already on disk. `research/images.yaml` names the candidate
(id, what it shows, source, exact location, licence, quality) and
`research/images/<id>.png` is the capture the reading swarm took — a whole
page or the downloaded file. Nobody re-reads the source; you cut from the
capture.

1. **Frame the shot.** From the lesson's `{/* img <file-stem>: … */}` handoff
   and the brief's `source:` entry: one sentence on what the reader must be
   able to see, and the placement (centered ≈ 700px, floated ≈ 380px). That
   sentence is the acceptance test.
2. **Look at the capture** (Read it). If it is already the figure and nothing
   else — the reading swarm's PDF captures often extract the stored bitmap
   whole — there is nothing to cut: go straight to `fit` and the loop.
   Missing, or the wrong page? Re-capture from the pointer in images.yaml:
   `npm run image -- capture <url|pdf> <dest> [page] --dpi 220`. Only if the
   source itself is gone do you go hunting — catalogs and API recipes:
   [references/image-sources.md](references/image-sources.md).
3. **Cut and clean** (a page render, or a capture with page furniture on it).
   - `npm run image -- crop <capture> <out> <WxH+X+Y>` — coordinates come
     from LOOKING at the capture, then adjusting; two or three iterations is
     normal. Cut away printed captions, page furniture, neighbouring figures.
   - `--trim` kills scanner margins; `--extent WxH` pads sequence frames to
     one canvas (`<name>-1.png`, `<name>-2.png`, … for a carousel).
   - `npm run image -- fit <in> <out> --max-width 1400` strips metadata and
     brings the file under budget; `--flatten` when transparency would leave
     the figure invisible in one theme. Never upscale.
   - Land it as `content/courses/<c>/lessons/<l>/figures/<file-stem>.png`.
4. **THE LOOP — mandatory. Machine, then eyes:**
   - `npm run image -- check <file>`: real format, complete file, ≥480px
     wide, under 2.5 MB, not blank.
   - Read the file and answer every line of
     [checklists/image-checklist.md](checklists/image-checklist.md) — right
     subject, nothing clipped, labels legible at the placement width, no
     watermark/placeholder, both themes.
   - Then in the page: `npm run preview -- <course> <lesson>` renders the
     chapter to `.preview/<lesson>-{light,dark}.png` plus a figures-only
     pair. Read them. Text wrap, the credit list and the frame counter are
     only real there.
5. **Credit it.** Add the entry to `figures/credits.yaml` (schema:
   `lib/content/schema.ts`, guide: `docs/content-model.md`) — title, credit,
   source_url, licence exactly as the source states it, retrieved date,
   `located`, `modifications`, and `background: light` for white-background
   line art. One `*` pattern entry covers a whole sequence. The provenance
   prints itself in the lesson's References; never put it in the caption.
6. **Embed** `<Figure src="./figures/<file-stem>.png" alt caption [float
   width]/>` (or `<FigureSequence name="<file-stem>">`) in place of the
   writer's handoff comment, then `npm run validate <course> <lesson>` —
   zero errors.
7. **Report:** the file, its licence, what each loop iteration caught, and
   anything you refused to ship and why.

> Running inside the factory's parallel figure fan-out? Then you own only
> your own files: produce the image and RETURN the credits entry and the
> `<Figure …/>` snippet in your final message instead of editing
> `credits.yaml` or `lesson.mdx` — the closing agent writes both.

## KaTeX gotchas (learned the hard way)

- No `_`/`^` inside `\text{…}` — words: `u_{\text{cute}}`; symbols: `u_{w_1}`.
- No unicode symbols like ①② in TeX — use `(1)`, `(2)` styled with
  `\textcolor`.
- Bind colors with `\textcolor{<hex>}{…}` using the same palette constants
  as the graphics.

## Hard limits

- Never edit lesson prose (beyond swapping a figure handoff comment for the
  figure) or course.yaml.
- Never copy/trace a copyrighted figure into a drawn tier; recreate the idea
  in house style and note the inspiration for the lesson's References.
- A sourced image ships with its provenance or not at all, and only cropping,
  trimming, scaling and flattening are allowed on it. Removing a curve, an
  axis or a label from a published plot is falsification.
- Never present a sourced image as the house's own work.
