---
name: lab-author
description: Author or revise ONE lab lesson — a 3–5 hour Jupyter assignment with server-verified checkpoints — through the write→execute→green loop. The solution is real executed code, never generated text. Use when a course needs a lab built, a lab's difficulty recalibrated, or its checkpoints reworked.
argument-hint: "<course>/<lesson> [topic or revision notes]"
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(uv run:*), Bash(cp:*), Bash(rm:*), Bash(ls:*), Bash(npm run validate:*), Bash(npm run build-labs:*)
---

# Lab Author

You produce one lab per invocation, and you NEVER ship a lab whose solution
you haven't executed to green. A lab is not a lesson with code sprinkled in:
it is 3–5 hours of the learner building something real, checkpoint by
checkpoint, with the platform verifying outputs server-side.

Binding file formats: @references/conventions.md. Working example (all four
checkpoint mechanics, executes green): `references/example/`. The capture
module for the loop is the build's own:
`apps/frontend/lib/labs/python/distill_capture.py`. Pedagogy applies in full:
@docs/pedagogy.md — a lab is course content, same register, same bars.

## Design before writing

1. **One buildable artifact.** A lab builds one thing (a logistic regression
   from scratch, a tokenizer, a heap) — not a tour of disconnected
   exercises. Name what exists at the end that didn't at the start.
2. **Checkpoint plan on paper first**, following the progression norm:
   - open with 2–4 small `exact` checkpoints — one function each, instant
     verdict, warm-up depth (5–15 lines of learner code);
   - middle checkpoints **compose**: the thing verified in checkpoint 1 is a
     dependency of checkpoint 3 (the model built early gets extended, the
     loss feeds the training loop);
   - end with ONE open `metric` task — scaffold-free cell, real dataset,
     threshold to beat, hints section *after* it (try-first, spoilers
     below); mark it `required: false`;
   - `review` checkpoints are optional garnish (a "why" question with a
     rubric), always `required: false`.
3. **Difficulty calibration is a design act, not a vibe.** Estimate honest
   solve time: count blanks × their depth (a 15-line vectorized function
   with a shape contract ≈ 20–40 min; an open modeling task ≈ 1–2 h). Under
   ~3 h → deepen checkpoints, don't add prose. The Ng anti-pattern is the
   documented floor: if a blank is one line inside a fully pre-written loop,
   the learner is transcribing a spec — delete the scaffold until the blank
   is the function.
   Partial completion is the expected norm; gate `lesson_completed` on the
   required set only.

## The loop

Never write the whole lab and hope. Grow it checkpoint by checkpoint:

```
cd content/courses/<course>/lessons/<lesson>/
cp <repo>/apps/frontend/lib/labs/python/distill_capture.py distill.py   # transient
uv lock                                             # once, after editing pyproject deps
# write solution.py incrementally + challenges.yaml entries as you go
uv run --with pyyaml python solution.py             # runs against uv.lock
# ✓ per checkpoint, ✗ stops you: fix the solution, the spec, or the threshold
rm -rf distill.py captured.json .venv               # when done
```

- A red check is information: either the solution is wrong, the challenge
  spec is wrong, or (for `metric`) the threshold is miscalibrated — the stub
  demands reference score ≥ threshold + 0.02. Fix the real cause; never
  weaken a check to pass it.
- Inspect `captured.json` once at the end: expected outputs sane, wrong
  variants present where canonical bugs exist, labels captured.
- Everything seeded. Run the loop twice; identical `captured.json` or the
  lab is nondeterministic and will fail validate.
- Finish with `npm run build-labs -- <course> <lesson>` + `npm run validate`,
  and read the generated `labs-dist/public/<course>/<lesson>/lab.ipynb` as the
  learner would: scaffold intact, no markers, no outputs, header cell present.

## Checkpoint craft (the check vocabulary)

- `exact` inputs: small, hand-shaped, seeded — big enough to kill
  hardcoding, small enough to run in seconds. For large outputs the
  canonicalization digests them; you don't manage size beyond `atol`.
- **Wrong variants are mandatory where a canonical bug exists** (sign lost,
  normalization forgotten, off-by-one in indexing, sigmoid before
  threshold). The hint names the bug in one sentence — this is the single
  best feedback device the genre has.
- Property checks live in the notebook as plain asserts the learner runs
  locally (permutation non-invariance, monotonicity, "loss decreased") —
  they teach; the server checkpoint then verifies the outputs.
- Backprop/gradient tasks: include a numerical-gradient cross-check cell
  (finite differences) as a local assert — the YSDA device.
- `metric` tasks: state the baseline in the text, calibrate the threshold by
  running the reference, and pair the score with a plot of the same
  quantity (learning curve, ROC) generated from the learner's own results.
- Plotting is infrastructure: helpers shipped complete, never blanked; reuse
  one helper to show the correct shape AND a broken shape (diverging loss)
  — the plot is a debugging tool, not decoration.

## Scaffold and prose

- Every blank sits behind a fixed signature + docstring with Args/Returns
  and shapes. What surrounds the blank is the learner's map; what's inside
  is theirs entirely.
- The "reference → analogous" device earns its place: give one class fully
  working ("no need to change anything"), ask for the sibling by analogy.
- Formula immediately before the blank it motivates; plain-English
  restatement before LaTeX; dataset gets a one-paragraph cover story.
- Explicit non-goals in task text ("do not call sklearn's vectorizer here —
  debugging with it is fine").
- Hints as a ladder after hard tasks: strategy → pseudocode → last-resort
  snippet, each behind its own fold.
- Register is dry (docs/pedagogy.md). YSDA's structure without YSDA's memes.

## Definition of done

- [ ] Loop run green twice, deterministic; transient files removed.
- [ ] `course.yaml` checkpoint list matches `challenges.yaml` (ids, kinds,
      required flags); `est_hours` honest per the calibration estimate.
- [ ] Wrong variants on every checkpoint with a canonical bug.
- [ ] The generated `lab.ipynb` read end-to-end as the learner.
- [ ] `npm run validate` green — it builds the lab and fails on a red
      checkpoint.
