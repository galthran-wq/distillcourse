---
name: lesson-factory
description: Launch the course-factory workflow's lesson phase — iterate over planned lessons (write on the session model, build specced demos, opus QA, one fix cycle each) inside the course's worktree branch. Use after the human has curated the course structure and research briefs.
argument-hint: "<course-slug> [count]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Workflow, EnterWorktree, Bash(npm run validate:*), Bash(git *)
---

# Lesson Factory

The second button: turns curated structure + research briefs into lessons.

## 0. MODEL GATE — check first

Same rule as /course-architect: the orchestrating session model MUST be
**Claude Fable 5** (`claude-fable-5`) or a Mythos-class successor. Lesson
writing inherits the session model, so this gate protects lesson quality
directly. Any other model: **STOP** and output only:

> Lesson production requires Fable. Switch the session model (/model) and
> re-run /lesson-factory.

## Workflow

1. **Get into the course worktree.** Work must happen on branch
   `course/<slug>`. If the current checkout is not that branch, enter its
   worktree (EnterWorktree). Verify `content/courses/<slug>/course.yaml` and
   `content/courses/<slug>/research/` exist — if the research dossier is
   missing, stop and point the user at /course-architect.

2. **Preflight.** `npm run validate <slug>` must be green before starting —
   the human's curation edits may have broken references.

3. **Launch:** Workflow
   `{name: "course-factory", args: {phase: "lessons", slug: "<slug>", count: <n if given>, root: "<absolute worktree path>"}}`.
   `root` is mandatory: workflow subagents inherit the session's launch
   directory, not your worktree — without it they write into the wrong
   checkout (usually master).
   Per planned lesson, sequentially (prerequisite order): lesson-writer agent
   (session model, grounded in the research brief) → figure-artist agents in
   parallel: drawn figures, and the brief's `source:` visuals cut from the
   captures the reading swarm already took, verified and credited →
   demo-builder execution where a demo is specced → course-qa on opus with a
   structured verdict → one revision cycle if QA requires fixes.

4. **On completion:** run `npm run validate <slug>`; report per-lesson
   outcomes (written / QA verdict / revised), remaining planned lessons, and
   remind the human: review in `npm run dev`, flip statuses to `reviewed`
   themselves, and merge the branch when ready.

## Hard limits

- Statuses `reviewed`/`published` are never set by you or the workflow.
- If validate fails at preflight, stop and report — never launch on a broken
  structure.
