---
name: feature-impl
description: Implement ONE GitHub issue end-to-end - worktree branch, implementation, two-pass review (impl-review), fixes, PR, CI wait, merge. Detects whether the issue is an epic child (PR targets the epic branch) or standalone (PR targets master). Also executed by agents inside the epic-impl workflow.
argument-hint: "<issue number>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, ToolSearch
---

# Feature Implementation

You implement exactly one issue. The issue body is the spec: **Decisions are
binding** (never re-decide them), **Gates are the definition of done**.
Model note: this pipeline is designed to run on **Opus**-class models.

## 1. Resolve

1. `gh issue view <N>` — read the full body. Follow references to other
   issues it depends on (`Depends on:` line) enough to know the contracts
   you consume.
2. Determine the base branch:
   - Body starts with `Epic: #X` AND a branch `epic/<slug>` exists on
     origin → **epic child**: base = `epic/<slug>`.
   - Otherwise → **standalone**: base = `master`.
3. If a `Depends on:` issue is still open and its output is required to
   build (not just to integrate later), STOP and report the blocker instead
   of stubbing around it.

## 2. Isolate

```
git fetch origin
git worktree add .claude/worktrees/issue-<N> -b feat/issue-<N> origin/<base>
```
All work happens inside the worktree. One issue = one branch = one PR.

## 3. Implement

- Code style is binding: `.claude/skills/impl-review/style.md` — simplicity
  above all; WHY-comments only; **grep for existing functionality before
  writing any helper** (duplication because you didn't search is the worst
  failure mode); keep domains separated in the file tree; update CLAUDE.md
  in the same PR if the change invalidates it.
- **Refactor check first**: before building a large feature, assess whether
  the surrounding code needs a refactor to accept it cleanly. A refactor
  that unblocks the feature goes in its own commit.
- Build to the spec. Write the tests the Gates demand — gates without tests
  are not done.
- Run the repo's checks locally before review: whatever CI runs (lint,
  typecheck, tests, `npm run validate` where relevant).
- Ambiguity the spec genuinely doesn't cover AND that materially changes
  the work: if a human is reachable, ask; if running unattended (inside the
  epic workflow), take the narrowest reasonable reading and record it under
  **Assumptions** in the PR body — never silently widen scope.
- Commit in reviewable chunks with imperative messages referencing the
  issue (`#N`).

## 4. Review → fix (one round, no re-review)

1. Run the `impl-review` skill on the branch: **two passes** — correctness
   and code quality — each as a **fresh-context subagent** (Agent tool).
   Never run the review yourself in this context: you wrote the diff, you'd
   read your intent instead of the code. If subagents are unavailable, stop
   and ask the user to run `/impl-review` from a separate session.
2. Apply every `high`/`med` finding. `low` findings may be skipped — list
   skips in the PR body.
3. There is deliberately **no re-review** after fixes; keep fixes minimal
   and mechanical so this stays safe.

## 5. PR → CI → merge

1. Push; open the PR against the base branch:
   `gh pr create --base <base> --title "<issue title>" --body ...`
   Body: `Closes #N`, a summary of what was built, **Assumptions** (if any),
   skipped `low` findings (if any).
2. Wait for CI: `gh pr checks <PR> --watch`. No checks configured → treat as
   green, but say so in the report.
3. **Red CI**: fix and push; at most **2** fix rounds, then stop and report
   blocked — do not thrash.
4. **Green** — merge policy (binding, house-wide; squash merge always):
   - Epic child → `gh pr merge --squash --delete-branch` into the epic
     branch. The epic branch is an integration branch, agent-mergeable.
   - Standalone (base is master/develop) → **NEVER merge.** Main branches
     are merged exclusively by the human after their explicit review. Leave
     the PR with a review-ready summary and stop.
5. Remove the worktree (`git worktree remove ...`).

## Report

Issue, branch, PR URL, merge state, gates status (each gate: met/how),
assumptions made, findings skipped.
