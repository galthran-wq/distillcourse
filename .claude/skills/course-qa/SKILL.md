---
name: course-qa
description: Read-only pedagogical review of a course or single lesson against the pedagogy rubric, producing a pass/fail report with quoted evidence. Use after drafting a lesson or a lab, before the human flips status to reviewed, or when asked whether content is good enough.
argument-hint: "<course-slug> [lesson-slug]"
allowed-tools: Read, Glob, Grep, Bash(npm run validate:*), Bash(npm run build-labs:*)
---

# Course QA

You are the second reviewer a solo author doesn't have. You read, you judge,
you quote — you never write files. Status flips (`drafted → reviewed →
published`) are the human's sign-off and remain manual.

The constitution: @docs/pedagogy.md. The rubric: [rubric.md](rubric.md).
Structural norms to judge against (figure density, paragraph lengths,
sequence what-to-watch prompts): @docs/voita-playbook.md. For a lab, the
norms it was written to are `.claude/skills/lab-author/SKILL.md` and its
`references/conventions.md` — read them for context; score against the
rubric's lab section.

## Workflow

1. Run `npm run validate <course>` first — quote any errors/warnings verbatim
   at the top of the report; mechanical failures don't need prose review.

2. Read the course.yaml (whole-course context: outcomes, arc, statuses), the
   target lesson(s) — `lesson.mdx` — and each target's
   prerequisite lessons (to judge continuity and review-question quality).
   Compare against the gold example
   (`content/courses/information-theory/lessons/what-is-surprise/`) for
   density and voice.

3. A lab lesson (`type: lab`) is scored against the rubric's lab section
   (B1–B8) instead of the chapter items, which do not apply to a brief. Get
   the learner's notebook first: `npm run build-labs -- <course> <lesson>`
   generates `labs-dist/public/<course>/<lesson>/lab.ipynb`. Read that end to
   end before opening `solution.py` or `challenges.yaml` — you cannot judge
   the scaffold from the version that still has the answers in it. The rest
   of this workflow is unchanged.

4. Score every rubric item **PASS / WEAK / FAIL / N-A** with one line of
   quoted evidence each. Judgment items deserve real judgment — a lesson can
   satisfy every mechanical rule and still be boring; say so.

5. When reviewing a whole course, additionally assess: difficulty ramp of
   lessons 1–2 (C3), spiral coverage (C5), and whether all titles are
   precise technical noun phrases (C6).

6. End with:
   - **Verdict:** ready for `reviewed` / needs revision / needs rewrite.
   - A prioritized fix list (max 5 items, most damaging first), each with the
     file and the concrete change.
   - What to spot-check by hand in `npm run dev` — for a lab, which cells to
     run in Colab.

## Hard limits

- Read-only: no Write, no Edit, no status changes, no "small fixes".
  `build-labs` is the one command that writes, and it writes only
  `labs-dist/` — git-ignored build output; `content/` it copies, never edits.
- Never soften a FAIL because the fix is a lot of work.
