---
name: lesson-factory
description: Launch the course-factory workflow's lesson phase — iterate over planned lessons (write on Opus, build specced demos, author labs through lab-author, opus QA, one fix cycle each) inside the course's worktree branch. Use after the human has curated the course structure and research briefs.
argument-hint: "<course-slug> [count]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Workflow, EnterWorktree, Bash(npm run validate:*), Bash(uv --version), Bash(git *)
---

# Lesson Factory

The second button: turns curated structure + research briefs into lessons.

The workflow pins each stage's model itself — writers, lab authors and QA on
Opus — so any session model can orchestrate it.

## Workflow

1. **Get into the course worktree.** Work must happen on branch
   `course/<slug>`. If the current checkout is not that branch, enter its
   worktree (EnterWorktree). Verify `content/courses/<slug>/course.yaml` and
   `content/courses/<slug>/research/` exist — if the research dossier is
   missing, stop and point the user at /course-architect.

2. **Preflight.** `npm run validate <slug>` must be green before starting —
   the human's curation edits may have broken references. Then, if
   `course.yaml` holds any `type: lab` lesson, run `uv --version` yourself
   and stop on a non-zero exit: labs are authored by executing their
   solution, so without `uv` the lab agent dies hours into the run. Validate
   will not have caught it — it builds only labs already at `drafted`, and
   even then a missing `uv` is a warning there, not an error.

3. **Pilot first.** When the course has no `drafted` lesson yet, or the
   factory (the workflows, the lesson-author / lab-author / course-qa
   skills, docs/pedagogy.md or the playbooks) has changed since the
   course's last drafted lesson, the run covers ONLY the first module that
   still has planned lessons: set `count` to that module's planned
   lessons, whatever the human asked for, and say so. After it, stop and
   ask the human to read the module before the rest of the course is
   written. A mistake in the factory then costs one module, not a course;
   the next run, once the human has read the pilot, takes the count they
   ask for.

4. **Launch:** Workflow
   `{name: "course-factory", args: {phase: "lessons", slug: "<slug>", count: <n if given>, root: "<absolute worktree path>"}}`.
   `root` is mandatory: workflow subagents inherit the session's launch
   directory, not your worktree — without it they write into the wrong
   checkout (usually master).
   Per planned lesson, sequentially (prerequisite order): lesson-writer agent
   (Opus, grounded in the research brief) → figure-artist agents in
   parallel: drawn figures, and the brief's `source:` visuals cut from the
   captures the reading swarm already took, verified and credited →
   demo-builder execution where a demo is specced → course-qa on opus with a
   structured verdict → one revision cycle if QA requires fixes.
   A `type: lab` lesson takes the other route: the lab-author skill's
   write → `uv run` → green loop produces the brief, `solution.py` and
   `challenges.yaml` (no lesson-writer, no figure scan), and QA scores it
   against the rubric's lab section. Labs are slow — a single one is a
   multi-hour authoring loop; `count` applies to them like any lesson.

5. **On completion:** run `npm run validate <slug>`; report per-lesson
   outcomes (written / QA verdict / revised), remaining planned lessons, and
   remind the human: review in `npm run dev`, flip statuses to `reviewed`
   themselves, and merge the branch when ready — a lab is reviewed by
   solving a few of its cells in Colab, not by reading its brief.

## Hard limits

- Statuses `reviewed`/`published` are never set by you or the workflow.
- If validate fails at preflight, stop and report — never launch on a broken
  structure.
