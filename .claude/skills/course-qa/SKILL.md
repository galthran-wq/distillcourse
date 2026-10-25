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
   target lesson(s) — `lesson.mdx` — and what the newcomer already knows:
   the ledger `research/taught/<slug>.md` of every earlier lesson, plus the
   full text of the target's prerequisite lessons and of the immediately
   preceding one (open any other earlier lesson the ledger points to).
   That decides both what may be assumed and what would be repetition.
   Check the target's own ledger entry too: it must exist and match what
   the lesson actually explains — a missing or wrong entry is a required
   fix (U7).
   Compare against the gold example
   (`content/courses/information-theory/lessons/what-is-surprise/`) for
   apparatus density only — its opening and second paragraph predate the
   newcomer rule (L0) and are not the standard.

3. A lab lesson (`type: lab`) is scored against the rubric's lab section
   (B1–B8) in place of the chapter items, minus the carry-overs that section
   names. Get the learner's notebook first: `npm run build-labs -- <course>
   <lesson>` generates `labs-dist/public/<course>/<lesson>/lab.ipynb`. Read
   that end to end before opening `solution.py` or `challenges.yaml` — you
   cannot judge the scaffold from the version that still has the answers in
   it.

4. Run the newcomer test (rubric U1–U9) FIRST, before any other item and
   before your judgment is anchored by the checklist: you are the reader
   who knows the prerequisites and nothing else. Then score every rubric
   item **PASS / WEAK / FAIL / N-A** with one line of
   quoted evidence each. Judgment items deserve real judgment — a lesson can
   satisfy every mechanical rule and still be boring; say so.

5. When reviewing a whole course, additionally assess: difficulty ramp of
   lessons 1–2 (C3), spiral coverage (C5), and whether all titles are
   precise technical noun phrases (C6).

6. End with:
   - **Verdict:** ready for `reviewed` / needs revision / needs rewrite.
   - A prioritized fix list (max 5 items, most damaging first), each with the
     file and the concrete change. Newcomer-test (U1–U4, U6, U8, U9) failures rank above
     everything else; a lesson with an open U item is never "ready".
     The list is not a quota: a fix belongs on it only if you would hold
     the lesson back from a human reader over it. When what remains is
     polish, say so and mark the lesson ready — the fix loop has two
     rounds, and every round spent on polish is a rewrite that can open a
     new gap.
   - What to spot-check by hand in `npm run dev` — for a lab, which cells to
     run in Colab.

## Hard limits

- Read-only: no Write, no Edit, no status changes, no "small fixes".
  `build-labs` is the one command that writes, and it writes only
  `labs-dist/` — git-ignored build output; `content/` it copies, never edits.
- Never soften a FAIL because the fix is a lot of work.
