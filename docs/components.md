# MDX component vocabulary

The contract between lesson content and the site. Components live in
`apps/frontend/components/mdx/` (mapped in the lesson page); demos live in
`apps/frontend/components/demos/<course>/` (registered in `apps/frontend/components/demos/index.ts`).
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
- `<Theorem title?="…">…</Theorem>` — a stated result; body renders italic,
  between a heavy rule above and a light one below.
- `<Lemma title?="…">…</Lemma>` — an auxiliary result, set like a Theorem
  and numbered on Theorem's counter (Theorem 3.1, Lemma 3.2).
- `<Proposition title?="…">…</Proposition>` — a result of standing below a
  theorem; same look, same counter.
- `<Corollary title?="…">…</Corollary>` — a result that follows directly
  from the one before it; same look, same counter.
- `<Proof>…</Proof>` — collapsed by default, ∎ appended. Always nested
  INSIDE the `<Theorem>`/`<Lemma>`/`<Proposition>`/`<Corollary>` (before
  its closing tag), never after it; it renders after the statement's rules.
- `<Example title?="…">…</Example>` — worked example, every step shown (L7).
- `<Remark title?="…">…</Remark>` — numbered note; the generic
  in-text environment for any subject.
- `<Verdict grade="strong" decidedBy?="…" overturnedBy?="…">…</Verdict>` —
  the graded answer to a dispute the lesson staged and weighed (pedagogy
  L17), set like a result with its own counter, the claim upright:
  "Verdict 4.2 *(strong).*" `grade` is required and one of `established`,
  `strong`, `on balance`, `open` (anything else is a validation error).
  `decidedBy` (the evidence or argument that settles it) and `overturnedBy`
  (what finding would reverse it) are plain-text props, written as they
  should read after their labels, full stop included; they share one line
  under the claim. Only for subjects whose disputes are settled by evidence
  and argument — history, philosophy, political theory, social science,
  contested empirical claims. Never in a math or ML lesson: there a result
  is proved (`<Theorem>`, `<Proposition>`) or measured.

  ```mdx
  <Verdict
    grade="strong"
    decidedBy="the post-1689 record."
    overturnedBy="showing that the 1689 limits did not bind."
  >
  Hobbes's claim that a mixed or limited monarchy cannot stand fails: the
  settlements of 1660 and 1689 divided power and lasted.
  </Verdict>
  ```
- `<Postulate grade="argued" grounds?="…" overturnedBy?="…">…</Postulate>` —
  a premise of a doctrine set out as a derivation (pedagogy L17), set like a
  Verdict and numbered through the lesson, not per section: "Postulate 3
  *(strong).*", cited in prose and in a thesis's `from` as P3. `grade` is
  required: one of the four verdict grades, or `argued` for a value premise
  that is argued for rather than measured. `grounds` (what supports it) and
  `overturnedBy` share one line under the statement.
- `<Thesis from="P3, P4; Verdicts 15.2, 15.4" grade?="…">…</Thesis>` — what
  the doctrine derives, numbered through the lesson (T1, T2…): "Thesis 3
  *(on balance; from P3, P4; Verdicts 15.2, 15.4).*" `from` is required and
  names the postulates and verdicts the thesis follows from; `grade`
  (postulate scale) is optional.

The three graded environments share a scope: subjects settled by evidence
and argument, never math or ML. A one-line `<Verdict …>claim</Verdict>`
parses as inline MDX; write the opening and closing tags on their own lines,
as in the example. The props are plain text — no math, links or `<Ref>`.

## Callouts

- `<KeyFact>…</KeyFact>` — a tinted panel, the one filled block in a
  lesson; the load-bearing/surprising fact of a section, one sentence. What
  a returning reader scans for.
- `<Task>…</Task>` — on a dashed left rule; an instruction the reader executes right now,
  naming the observable ("compute H(0.75); it should land near 0.811").
At most one of each per section (voita-playbook, callout roles).

## Closing

- `<Conclusion>…</Conclusion>` — the lesson's closing (L10c), once, right
  before `## Exercises`: what the reader can now do, and the problem left
  open. The only place the lesson sums itself up. Not a callout: it stays in
  the prose, under a rule and a label, and is linkable as `#conclusion`.

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
figure registered in `apps/frontend/components/figures/index.ts` (HTML + KaTeX + SVG, for
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

## `<Quote source?="GS 108, trans. Nauckhoff">…</Quote>`

A passage quoted from a source — the evidence a reading rests on. The
markdown children are the text (in translation, where the lesson uses one);
`source` is the locator the reader checks it against — siglum, section,
translator — set as a small-caps label under the quote. Where the lesson reads the
original, put it first inside `<Original lang="de">…</Original>`: on a wide
screen the original sits beside the translation, on a phone above it.
`lang` is the original's BCP-47 tag and lives on that block alone, so
hyphenation and screen readers switch language there. `<Original>` is only
ever a child of `<Quote>`. A plain markdown `>` blockquote stays for what is
not a sourced passage: a paraphrased objection, a line the lesson puts in a
reader's mouth.

```mdx
<Quote source="GS 108, trans. Nauckhoff">
<Original lang="de">
Gott ist todt: aber so wie die Art der Menschen ist, wird es vielleicht noch
Jahrtausende lang Höhlen geben, in denen man seinen Schatten zeigt.
</Original>

God is dead: but given the way of men, there may for millennia yet be caves
in which his shadow is shown.
</Quote>
```

## `<Aside>…</Aside>`

Collapsible tangent; never load-bearing.

## Page chrome (not authored in MDX)

The lesson layout renders from course.yaml: title, goal, estimated minutes,
module breadcrumb, prev/next navigation, and the right-hand contents
sidebar. Lesson MDX never duplicates these.
