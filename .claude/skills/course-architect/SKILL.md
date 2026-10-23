---
name: course-architect
description: Launch the course-factory workflow to research and design a new course structure (canon discovery, source-reading swarm, synthesis into course.yaml + a resumable research dossier), in an isolated worktree branch. Use when creating a new course.
argument-hint: "<topic, plus any design intent — e.g. 'ml system design; practical not academic; prerequisite is classical ML'>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Workflow, EnterWorktree, Bash(npm run validate:*), Bash(git *)
---

# Course Architect (factory mode)

You are the orchestrator button for course structure. The heavy lifting runs
in the `course-factory` workflow; your job is the worktree, the launch,
and the report. The workflow pins each stage's model itself — the canon scout
on Opus, the readers on Sonnet, synthesis on Fable — so any session model can
orchestrate it.

## Workflow

1. **Resolve the course.** Split the argument into the TOPIC (the subject,
   which slugifies to kebab-case) and the DESIGN INTENT — anything the human
   said about format, audience, angle, or what the course must assume its
   reader already knows. The intent is not decoration: it binds both canon
   selection and structure synthesis, so carry it through verbatim rather
   than paraphrasing it away. If there is none, there is none.

   If `content/courses/<slug>/course.yaml` already exists on the current
   branch, this is a restructure — confirm with the user before proceeding
   (existing `drafted`+ lessons are frozen either way). A directory holding
   only `research/` is NOT a restructure: that is staged raw material for a
   course that does not exist yet, and the run proceeds normally.

   Note what is staged: list `content/courses/<slug>/research/texts/`. Files
   there are source copies the human obtained for this course, and the
   factory treats each as canon by fiat. Report the count in step 4.

2. **Isolate.** Enter a git worktree on branch `course/<slug>`
   (EnterWorktree). One course = one branch; nothing lands on master until
   the human merges. All subsequent work — this run and later
   /lesson-factory runs — happens inside this worktree.

3. **Launch the factory.** Invoke the Workflow tool:
   `{name: "course-factory", args: {phase: "structure", slug: "<slug>", topic: "<topic>", brief: "<design intent, verbatim>", root: "<absolute worktree path>"}}`.
   Omit `brief` only when the human stated no intent at all — it is what
   keeps a course from defaulting to a generic survey of its subject.
   `root` is mandatory: workflow subagents inherit the session's launch
   directory, not your worktree — without it they write into the wrong
   checkout (usually master).
   The workflow runs: canon discovery on Opus (perplexity deep research) → a
   sonnet reading swarm (one source-reader agent per source, each also
   reporting what its source makes students BUILD — homeworks, projects,
   labs) → synthesis on
   Fable, producing `course.yaml`, `concepts.yaml`, and the
   **research dossier** (`research/sources.yaml`, `research/images.yaml` —
   the shortlist of real images the readers found worth sourcing — and
   `research/<lesson>.md` per lesson, whose FIGURE PLAN tags each visual
   `draw:` (house style) or `source:` (a real artefact, already captured
   under `research/images/`) — the resumable state that later grounds
   lesson writing).
   Labs are structure, decided here: a module may close with a `type: lab`
   lesson — a 3–5 h notebook assignment — carrying `lab.est_hours` and a
   drafted checkpoint plan, and its brief's LAB PLAN records which canon
   assignment grounds it. A module whose canon assigns nothing gets no lab;
   a course whose canon assigns nothing gets none at all. The labs
   themselves are written later, by /lesson-factory.

4. **On completion:** run `npm run validate <slug>`; then report to the
   human: the outcomes, the module arc (one line each), the source list with
   roles, which modules end with a lab and the canon assignment each lab is
   grounded in, and where the dossier lives. If the workflow result lists
   `not_fully_read` sources (books the swarm could not find or could only
   read second-hand), surface them PROMINENTLY — never silently omit a
   source: the human will obtain copies from the publishers, and the read
   can be re-run for them. Remind them:
   - curate `course.yaml` AND the per-lesson research briefs in the worktree
     (this is the main editorial checkpoint — the briefs steer every future
     lesson), including which planned visuals are `source:` real images and
     which are `draw:` — that choice is cheap to change now and expensive
     later, and likewise which modules end with a lab and what each lab
     builds (a lab is 3–5 h of the learner's time; cut the ones the canon
     does not back);
   - when satisfied, run `/lesson-factory <slug>` to write lessons;
   - merge the `course/<slug>` branch only when the course is worth shipping.

## Hard limits

- Never write lesson.mdx files; never change `status` of existing lessons.
- Never run the factory on master — worktree first.
- No lesson-count cap (C2): accept whatever count the material justifies,
  but reject padding and micro-slicing — every lesson needs one substantive
  goal. Never have the workflow cut material just to hit a number.
