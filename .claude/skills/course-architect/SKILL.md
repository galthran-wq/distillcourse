---
name: course-architect
description: Launch the course-factory workflow to research and design a new course structure (canon discovery, source-reading swarm, synthesis into course.yaml + a resumable research dossier), in an isolated worktree branch. Use when creating a new course.
argument-hint: "<topic, e.g. 'financial mathematics'>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Workflow, EnterWorktree, Bash(npm run validate:*), Bash(git *)
---

# Course Architect (factory mode)

You are the orchestrator button for course structure. The heavy lifting runs
in the `course-factory` workflow; your job is the gate, the worktree, the
launch, and the report.

## 0. MODEL GATE — check first, before anything else

Identify your own model from your system prompt. Course architecture MUST be
orchestrated by **Claude Fable 5** (`claude-fable-5`) or a Mythos-class
successor. If you are any other model (Opus, Sonnet, Haiku, …):
**STOP immediately.** Output exactly this and do nothing else:

> Course architecture requires Fable. Switch the session model (/model) and
> re-run /course-architect.

## Workflow

1. **Resolve the course.** Slugify the topic (kebab-case). If
   `content/courses/<slug>/` already exists on the current branch, this is a
   restructure — confirm with the user before proceeding (existing `drafted`+
   lessons are frozen either way).

2. **Isolate.** Enter a git worktree on branch `course/<slug>`
   (EnterWorktree). One course = one branch; nothing lands on master until
   the human merges. All subsequent work — this run and later
   /lesson-factory runs — happens inside this worktree.

3. **Launch the factory.** Invoke the Workflow tool:
   `{name: "course-factory", args: {phase: "structure", slug: "<slug>", topic: "<topic>", root: "<absolute worktree path>"}}`.
   `root` is mandatory: workflow subagents inherit the session's launch
   directory, not your worktree — without it they write into the wrong
   checkout (usually master).
   The workflow runs: canon discovery (perplexity deep research) → a
   sonnet reading swarm (one source-reader agent per source) → synthesis on
   the session model, producing `course.yaml`, `concepts.yaml`, and the
   **research dossier** (`research/sources.yaml`, `research/images.yaml` —
   the shortlist of real images the readers found worth sourcing — and
   `research/<lesson>.md` per lesson, whose FIGURE PLAN tags each visual
   `draw:` (house style) or `source:` (a real artefact, already captured
   under `research/images/`) — the resumable state that later grounds
   lesson writing).

4. **On completion:** run `npm run validate <slug>`; then report to the
   human: the outcomes, the module arc (one line each), the source list with
   roles, and where the dossier lives. If the workflow result lists
   `not_fully_read` sources (books the swarm could not find or could only
   read second-hand), surface them PROMINENTLY — never silently omit a
   source: the human will obtain copies from the publishers, and the read
   can be re-run for them. Remind them:
   - curate `course.yaml` AND the per-lesson research briefs in the worktree
     (this is the main editorial checkpoint — the briefs steer every future
     lesson), including which planned visuals are `source:` real images and
     which are `draw:` — that choice is cheap to change now and expensive
     later;
   - when satisfied, run `/lesson-factory <slug>` to write lessons;
   - merge the `course/<slug>` branch only when the course is worth shipping.

## Hard limits

- Never write lesson.mdx files; never change `status` of existing lessons.
- Never run the factory on master — worktree first.
- No lesson-count cap (C2): accept whatever count the material justifies,
  but reject padding and micro-slicing — every lesson needs one substantive
  goal. Never have the workflow cut material just to hit a number.
