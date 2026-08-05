# Demo checklist (demo-builder self-review)

Report PASS/FAIL for each.

1. **D1 objective:** one sentence names what dynamic behavior the demo makes
   visible that a static figure couldn't. The sentence mentions the lesson's
   goal.
2. **D2 feedback:** every manipulation updates the visual in the same frame —
   no async, no network, no transition longer than ~200ms.
3. **D3 alive on arrival:** screenshot of the initial state alone would still
   teach something; no blank/zero/degenerate start.
4. **D3 presets:** 2–4 named presets exist and match any names used in the
   lesson prose or caption.
5. **D4 guided task:** the task stated in the prose/caption is achievable and
   has a recognizable "you did it" moment.
6. **D5 self-contained:** one demo file + `@/components/ui` imports, no new
   deps, no globals; the demo file itself ≤~200 LOC (kit code doesn't count);
   default-exported client component.
7. **Accessible + kit-composed:** controls come from `@/components/ui`
   (`Panel`/`PresetGroup`/`Slider`/`Readout`/`Button`), not hand-rolled — a
   missing primitive was added to the kit (exported via `index.ts`, styled
   only with theme tokens/Tailwind theme classes) rather than built inline;
   fully operable by keyboard; controls are native elements; touch targets
   ≥44px; readable at 360px width.
8. **Theme-safe:** text/strokes use currentColor or Tailwind theme classes;
   checked mentally against dark background.
9. **Honest ranges:** parameter bounds can't produce NaN/Infinity/empty
   visuals; extreme values still mean something.
10. **tsc + eslint clean; registered in apps/frontend/components/demos/index.ts.**
