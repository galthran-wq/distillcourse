---
name: epic-impl
description: Implement an entire epic via the epic-impl workflow - create the epic branch, run every child issue through the feature pipeline (implement/review/fix/PR/CI/squash-merge, all on Opus), then a multi-lens Fable 5 review of the full epic diff, ending in an epic → master PR for the human. Use when an epic designed via epic-design is ready to build.
argument-hint: "<epic issue number>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Workflow, Bash(git *), Bash(gh *), AskUserQuestion
---

# Epic Implementation (orchestrator)

You are the button. The heavy lifting runs in the `epic-impl` workflow; your
job is the gate, the branch, the launch, and the report. Implementation and
per-issue reviews run on **Opus**; the final epic review runs on **Fable 5**.

## 1. Gate

1. `gh issue view <N>` — the epic must have an MVP checklist of `#K` refs
   and a dependency graph (the `epic-design` output format). If it doesn't,
   stop: run `epic-design` first.
2. Parse the checklist + `Depends on:` lines of each child issue into
   `issues: [{number, deps: [...]}]`. Skip children already closed as
   completed (resuming a half-done epic is normal).
3. CI must exist on the repo (PR checks). If it doesn't, warn the user:
   merges will proceed on "no checks = green" — get explicit confirmation.
4. Show the user the resolved execution order and the estimated scale
   (~4 agents per issue + 4 for the final review). Get a go.

## 2. Branch

```
git fetch origin
git branch epic/<slug> origin/master   # slug: short kebab name for the epic
git push -u origin epic/<slug>
```
The epic branch is the integration target for every child PR. Nothing from
the epic touches master until the human merges the final PR.

## 3. Launch

Invoke the Workflow tool:

```
{name: "epic-impl",
 args: {epic: <N>, slug: "<slug>", root: "<absolute repo path>",
        issues: [{number: 5, deps: []}, {number: 6, deps: [5]}, ...]}}
```

`root` is mandatory — workflow subagents inherit the session's launch
directory. The workflow runs in the background; monitor via /workflows.

Pipeline the workflow executes (see `.claude/workflows/epic-impl.js`):

- **Dependency waves, parallel inside a wave, serialized merges.** Issues
  whose dependencies are all merged form a wave. Within a wave, each issue
  runs implement per `feature-impl` (opus) → two parallel `impl-review`
  passes (opus) → fix (opus) **in parallel** with the other issues of the
  wave. Then a **serialized merge queue**: one issue at a time rebases onto
  the freshest epic branch, waits CI (max 2 red rounds), squash-merges.
  A failed build or merge **stops the epic** — later issues depend on it.
- **Epic review**: three parallel **Fable 5** lenses over the full
  `master...epic` diff — spec compliance, cross-issue integration,
  cross-cutting quality.
- **Finalize**: apply findings on the epic branch, open the
  `epic/<slug> → master` PR. The human merges it — never the workflow.

## Merge policy (binding, house-wide)

- Squash merge is the default everywhere.
- Agents may merge **only into the epic branch** (it is an integration
  branch, fully agent-owned until the final PR).
- **Main branches (master/develop) are merged exclusively by the human
  after their explicit review.** No exceptions, no "user seemed to imply".

## 4. Report

When the workflow completes: issues merged (with PR links), where it
stopped if incomplete, epic-review finding count, the final PR URL, and
what needs the human (merge, skipped findings, assumptions recorded in PR
bodies). Tick merged issues' checkboxes in the epic body
(`- [x]`), close nothing — issues auto-close when the epic PR merges via
the `Closes #N` lines.
