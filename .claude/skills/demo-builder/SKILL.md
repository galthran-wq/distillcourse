---
name: demo-builder
description: Implement the interactive demo component specced in a lesson's course.yaml entry as a self-contained React client component. Use when building or revising a lesson's demo widget.
argument-hint: "<course-slug> <lesson-slug>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run typecheck:*), Bash(npm run lint:*), Bash(npm run validate:*)
---

# Demo Builder

You build one explorable widget per invocation. A demo is a *teaching
instrument*, not a toy: if it doesn't make the lesson's goal visible, it
shouldn't exist.

Demo rules D1–D5: @docs/pedagogy.md. Component contract: @docs/components.md.
Reference implementation: [examples/ExampleDemo.tsx](examples/ExampleDemo.tsx).

## Workflow

1. **Read the spec.** The lesson's `demo.component` + `demo.spec` in
   `content/courses/<course>/course.yaml`, and the surrounding segment of
   `lesson.mdx` (the prose that introduces the demo and states the guided
   task).

2. **Gate on D1.** State in one sentence what the learner will *see change*
   that a static figure could not show. If you can't, report that a `<Figure>`
   would serve better and stop — that's a successful outcome, not a failure.

3. **Design the interaction before coding:**
   - What is manipulated (slider, drag, click) and what responds.
   - Initial state = already showing the interesting behavior (D3).
   - 2–4 named presets that the lesson prose can reference (D3).
   - The guided task from the prose/caption must be achievable in it (D4).

4. **Implement** `apps/frontend/components/demos/<course>/<Component>.tsx`:
   - `"use client"`; default export; props optional-only.
   - Self-contained: one demo file + `@/components/ui` imports; no new
     dependencies, no network, no context; the demo file itself ≤~200 LOC.
   - **Compose from the `@/components/ui` kit** (`Panel`, `Button`,
     `PresetGroup`, `Slider`, `Readout`): outer container = `<Panel>`,
     preset row = `<PresetGroup>` (compute `activeIndex` from live state,
     `null` when nothing matches), range inputs = `<Slider>` (with `display`
     for the formatted value), aria-live text readouts = `<Readout>`. Never
     hand-roll a button/slider/container inside the demo. If a primitive you
     need is missing, ADD it to `apps/frontend/components/ui` (export it via
     its `index.ts`, style it only with theme tokens / Tailwind
     theme classes such as `border-line`, `bg-panel`, `text-accent`) and then
     use it.
   - Custom visuals stay plain SVG/DOM + Tailwind classes; recompute
     synchronously on input (<200ms, D2).
   - Keyboard operable (kit controls render real `<input type="range">`/
     `<button>` elements — never divs); touch targets ≥44px; sensible at
     360px width.
   - Label axes/values inside the SVG; use `currentColor` for text so themes
     work.

5. **Register** it in `apps/frontend/components/demos/index.ts` (lazy import, name =
   component name).

6. **Check:** `npm run typecheck` and `npm run lint` — fix
   everything. Then `npm run validate <course>`.

7. **Self-review** against [checklists/demo-checklist.md](checklists/demo-checklist.md)
   and report: the D1 sentence, the presets, and anything you'd want a human
   to try by hand in `npm run dev`.

## Hard limits

- Never edit lesson.mdx or course.yaml (if the spec is
  unbuildable as written, report why instead of reinterpreting it).
- Never add npm dependencies.
