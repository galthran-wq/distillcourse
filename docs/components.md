# MDX component vocabulary

The contract between lesson content and the site. Components live in
`components/mdx/` (mapped in the lesson page); demos live in
`components/demos/<course>/` (registered in `components/demos/index.ts`).
Lesson MDX may use ONLY these components — the validator errors on anything
else. Lesson prose is otherwise free-form markdown + KaTeX math; the page
renders a right-hand table of contents from `##`/`###` headings
automatically.

## Textbook environments (auto-numbered per section)

Numbering is CSS-driven: "Definition 2.1" = section 2, first definition.
Use them where the material is genuinely mathematical; for courses without
theorems (history, philosophy, speech, music) use `<Remark>` and plain prose
— never force the form (pedagogy L5).

- `<Definition title?="surprisal">…</Definition>` — a precise definition.
- `<Theorem title?="…">…</Theorem>` — a stated result; body renders italic.
- `<Proof>…</Proof>` — collapsed by default, ∎ appended. Always nested
  INSIDE the `<Theorem>` (before its closing tag), never after it.
- `<Example title?="…">…</Example>` — worked example, every step shown (L7).
- `<Remark title?="…">…</Remark>` — numbered note; the generic
  in-text environment for any subject.

## Role-colored callouts (colors constant course-wide)

- `<KeyFact>…</KeyFact>` — rose; the load-bearing/surprising fact of a
  section, one sentence. What a returning reader scans for.
- `<Task>…</Task>` — green; an instruction the reader executes right now,
  naming the observable ("compute H(0.75); it should land near 0.811").
At most one of each per section (voita-playbook, callout roles).

## Exercises

```mdx
## Exercises

<Exercise>
Problem statement.

<Solution>
Full solution — complete path to the answer (E4).
</Solution>
</Exercise>
```

Numbered "Exercise 1…n" per lesson. `<Solution>` is collapsed until clicked.
No interactive grading. Validator warns on an `<Exercise>` without a
`<Solution>` and on lessons with no exercises at all.

## `<References>` (required — pedagogy L8)

Last block of every lesson: a markdown ordered list of real, verified
sources with chapter-level pointers.

## `<Figure src?="./figures/x.svg" name?="ComponentName" alt="..." caption?="..." float?="left|right" width?="s|m" />`

Static visual, three tiers (docs/figures.md): `src` = a file relative to the
lesson directory — a raw SVG (inlined, `currentColor` themes) or a sourced
raster image (`.png/.jpg/.jpeg/.webp/.gif`, credited in
`figures/credits.yaml`, cut and credited via /figure-artist); `name` = a component
figure registered in `components/figures/index.ts` (HTML + KaTeX + SVG, for
math/text-rich figures — authored via /figure-artist). Exactly one of
`src`/`name`. `float` sets the figure beside the prose (`width="s"` ≈ 260px,
`"m"` ≈ 380px). Labels belong inside the figure (L6); a sourced image's
provenance prints itself in `<References>` — never in the caption.

## `<FigureSequence name="x" alt="..." caption?="..." />`

Step-through carousel (the house signature for processes): renders
`figures/<name>-1.svg`, `<name>-2.svg`, … (or `-1.png`, `-2.png`, … for
sourced images) with prev/next controls and a
frame counter. Frames share one layout and change one thing per step —
3–7 frames recommended; ≥2 is the enforced floor (validator warns below it). Style per
`docs/figures.md`.

## `<Demo name="ComponentName" caption?="..." />`

Embeds a registered interactive demo (client island, lazy-loaded). `name`
must match the lesson's `demo.component` in course.yaml (validated). Demo
components: `"use client"`, self-contained, ≤~200 LOC, no new deps, no
network, <200ms feedback, meaningful initial state, named presets,
keyboard/touch usable (rules D1–D5).

## `<Ref lesson="slug" id?="heading-id">label?</Ref>`

Cross-reference to another lesson of the same course. Renders the target
lesson's title (or the given children) as a link; `id` deep-links a heading
anchor. If the target isn't published/readable yet it renders as plain
text. Validator errors on unknown slugs (`ref-target`).

## `<Aside>…</Aside>`

Collapsible tangent; never load-bearing.

## Page chrome (not authored in MDX)

The lesson layout renders from course.yaml: title, goal, estimated minutes,
module breadcrumb, prev/next navigation, and the right-hand contents
sidebar. Lesson MDX never duplicates these.
