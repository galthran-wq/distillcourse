# Figure style guide

Figures are authored as code and visually verified — the scalable equivalent
of Voita-style hand-drawn slides. No generated raster images, no
screenshots, no mermaid. Two tiers:

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
4. **Recreate, never copy.** Source figures found during research are
   inspiration for what to SHOW; the drawing itself is always ours, in this
   style. Never trace or reproduce a copyrighted figure.

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

## Worked references

- Component figure (gold): `components/figures/examples/W2vOneStep.tsx` —
  aligned grid composition, KaTeX with role-bound colors, SVG matrix graphic,
  step badges reused in the loss formula.
- Raw SVG: `content/courses/information-theory/lessons/what-is-surprise/figures/rarity.svg`
  (single figure, two-color comparison).
