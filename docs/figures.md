# Figure style guide

Explanatory figures are authored as code and visually verified — the scalable
equivalent of Voita-style hand-drawn slides. No AI-generated imagery, no
mermaid. Where the content is a real artefact rather than an explanation
(a photograph, a scan, a measured plot), the real thing is sourced instead
and always ships with its provenance. Three tiers:

- **Component figures** (default for anything with formulas, running
  sentences, labeled pipelines, comparisons): pure React components in
  `components/figures/` — HTML/flex layout for text, KaTeX (`<M>`) for math,
  inline SVG for graphics, `palette.ts` constants, NO Tailwind. Registered
  in `components/figures/index.ts`, embedded via `<Figure name="…"/>`,
  verified with `npm run figure -- <Name>` + looking at the PNG. Gold
  example: `components/figures/examples/W2vOneStep.tsx`. Composition rules:
  `docs/voita-playbook.md`.
- **Raw SVG figures** (simple plots and diagrams with few short labels):
  the rules below. /figure-artist is the skill for both.
- **Sourced images** (photographs, portraits, apparatus, page scans,
  published plots of real data, canonical diagrams): raster files in the
  lesson's `figures/`, credited in `figures/credits.yaml`, embedded with the
  same `<Figure src>`/`<FigureSequence>` API. The reading swarm captures
  them during research; /figure-artist cuts, verifies and credits them.
  See §Sourced images.

## Principles

1. **One idea per figure.** A figure illustrates exactly the sentence(s) it
   follows. If it needs two captions, it's two figures.
2. **Density.** A substantive chapter carries a visual roughly every 3–4
   paragraphs — many small single-idea figures beat one crowded diagram
   (pedagogy L6). Small is good.
3. **Sequences for processes.** Anything that unfolds over steps (an
   algorithm, a renormalization, a proof idea) is a `<FigureSequence>`:
   frames share one layout and change ONE thing per frame, so the eye tracks
   the delta. 3–7 frames. This is the house signature — use it often.
4. **Explanations are ours; artefacts are theirs.** A source figure that
   explains an idea is inspiration for what to SHOW — the drawing itself is
   always ours, in this style, never traced. A figure whose value is that it
   is the real thing (a photograph, a scan, a measurement) is sourced as-is
   and credited; redrawing it would be a fabrication, not a style choice.

## Anatomy

- `viewBox` around 480–640 wide, height to fit; no fixed width/height
  attributes (CSS scales it; `max-w-xl` container).
- Text and axes: `fill="currentColor"` / `stroke="currentColor"` — figures
  are inlined and must survive both themes. Secondary text uses
  `opacity="0.55"` (the `.muted` convention).
- Font: `font-family="system-ui, sans-serif"`, sizes 11–14.
- Palette (sparingly, on top of currentColor):
  - **Accent** `#e2903a` (amber) — the subject of the figure: the curve, the
    highlighted path, the current element.
  - **Support blue** `#4c8dd6` — the contrast series (probability vs
    information, before vs after).
  - **Support green** `#5aa46a` — correctness/accept states when a third
    color is unavoidable.
  Never more than these three + currentColor in one figure.
- Shapes: rounded rects (`rx="3"`–`6`) for boxes/nodes, 4px-radius dots for
  points, `stroke-dasharray="3 3"` + `opacity="0.5"` for guides,
  simple line arrows (marker or two-segment) for flow.
- Labels live ON the figure, next to what they name — not in the caption and
  not in prose (L6). Captions state the takeaway or the task, one line.

## Files & usage

- Single figure: `figures/<name>.svg`, embedded with
  `<Figure src="./figures/<name>.svg" alt="…" caption="…" />`.
- Sequence: `figures/<name>-1.svg`, `<name>-2.svg`, … embedded with
  `<FigureSequence name="<name>" alt="…" caption="…" />` (validator warns
  under 2 frames). Frames must keep identical viewBox and layout — only the
  step's delta changes.
- Alt text: describe what the figure shows, factually, one sentence.

## Sourced images

The third tier: a real image we did not make. Use it when authenticity is the
content — historical photographs and portraits, apparatus, page scans of the
original paper, published plots of real data, canonical diagrams. Do NOT use
it for schematics, pipelines, or anything math-bound: a foreign-style diagram
with 8px labels is worse than a house-style drawing of the same idea.

- **Absolute rule: artifacts are sourced, never drawn.** Geographic maps,
  portraits, paintings, photographs, posters, and document pages are never
  hand-drawn — canonical public-domain copies exist (Commons, LoC, archives)
  and a redrawn map is a defect. The drawn tiers are for the course's own
  diagrams, charts, and step-throughs.
- **Files.** `figures/<name>.{png,jpg,jpeg,webp,gif}` in the lesson dir, same
  place as the SVGs. Embedded with `<Figure src="./figures/<name>.jpg" …/>`;
  a raster `<FigureSequence>` uses `<name>-1.png`, `<name>-2.png`, … and gets
  the same carousel. `float`/`width` work exactly as for the other tiers.
- **Provenance is mandatory.** Every raster file needs an entry in
  `figures/credits.yaml` (schema: `docs/content-model.md`) with the source
  page, the licence as the source states it, and the retrieval date. It
  prints itself once, as an "Image credits" list at the end of the lesson's
  `<References>` — never under the figure, where licence text buries the
  caption. One entry may cover a whole sequence via a `*` pattern
  (`shannon-1948-approximations-*.png`). No entry ⇒ `npm run validate` fails.
- **Quality floor.** ≥480px wide (the validator warns below it), ≤2.5 MB,
  never upscaled. `npm run image -- check <file>` proves the file is a
  complete, non-blank image of the format it claims; looking at it is what
  proves it is the right image, and that step is not optional.
  `npm run preview -- <course> <lesson>` renders the whole chapter to
  `.preview/` in both themes — the loop for judging a figure in place
  (text wrap, credit line, carousel) without a dev server.
- **Both themes.** Line art with a white or transparent background needs
  `background: light` in credits.yaml, which renders it on a light card.
- **Edits.** Cropping, trimming margins, resizing and flattening
  transparency only (`npm run image -- crop|fit`). Removing a curve, an axis
  or a label from a published plot is falsification.
- **Serving.** `scripts/sync-assets.ts` copies the files into
  `public/course-assets/<course>/<lesson>/` at `predev`/`prebuild`/
  `prevalidate`; run `npm run sync-assets` by hand when a dev server is
  already up. The copy is git-ignored — the content tree stays the source of
  truth.

## Worked references

- Component figure (gold): `components/figures/examples/W2vOneStep.tsx` —
  aligned grid composition, KaTeX with role-bound colors, SVG matrix graphic,
  step badges reused in the loss formula.
- Raw SVG: `content/courses/information-theory/lessons/what-is-surprise/figures/rarity.svg`
  (single figure, two-color comparison).
