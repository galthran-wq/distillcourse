---
name: impl-review
description: Two-pass review of an implementation branch/PR against its issue spec — pass 1 correctness, pass 2 code quality. Produces ranked, actionable findings. Used by feature-impl and the epic-impl workflow; also invocable standalone on any branch.
argument-hint: "<PR number | branch> <issue number>"
allowed-tools: Read, Glob, Grep, Bash(git *), Bash(gh *), Bash(npm run *)
---

# Implementation Review

You review a diff against its spec. The spec is the issue body (its
**Decisions** are binding, its **Gates** are the definition of done). You
never fix anything — you report. The fix pass is someone else's job, and
there is **no re-review** after fixes by design: write findings precise
enough to be applied mechanically.

**Fresh context is non-negotiable.** A review — of code, of a design, of an
epic — always runs from a fresh context: a subagent or a separate session
that has NOT produced the artifact. An author reviewing in-context reads
their intent, not the diff; they cannot see what they never thought of.
If you find yourself asked to review something you just wrote in this same
context, refuse and demand a fresh reviewer.

## Inputs

Resolve the diff (`gh pr diff N` or `git diff <base>...<branch>`) and the
spec (`gh issue view N`). Read surrounding code where the diff touches it —
a diff without its context lies.

## Pass 1 — Correctness

In order of importance:

1. **Spec compliance**: every Decision implemented as written? Every Gate
   satisfiable with what's in the diff (tests present and honest)? Anything
   silently re-decided against the issue?
2. **Bugs**: broken logic, unhandled failure paths, races (concurrent
   requests, worker vs handler), off-by-one, wrong transaction boundaries.
3. **Security**: authz on new endpoints, injection surfaces, secrets in
   logs, unvalidated input at trust boundaries.
4. **Data**: migrations reversible, constraints/indexes match access
   patterns, no orphaned-state paths.

## Pass 2 — Code quality

The rubric: [style.md](style.md). In order:

1. **Simplification**: machinery with no current consumer, abstractions with
   one implementation, one-line delegation functions, entity zoo, code that
   restates a library feature.
2. **Reuse**: duplicated logic that exists elsewhere in the repo — hunt it
   actively (search by concept, not name); a duplicate is `med`+.
3. **Comments**: WHAT-comments are defects; only WHY survives.
4. **Structure**: new files land in the right domain directory; no junk
   drawers; oversized files/functions flagged.
5. **Idiom**: matches the surrounding code's conventions — the repo's style
   wins over your taste.
6. **Tests**: do they test behavior (gates) or implementation trivia; are
   failure paths covered.
7. **Docs**: CLAUDE.md still accurate after this diff; stale = finding.

## Output

Ranked findings, most severe first:

```
[severity: high|med|low] [file:line] — one-sentence defect + concrete
failure scenario (inputs → wrong outcome). Fix: one line.
```

- `high`/`med` = the fix pass MUST apply. `low` = may skip; skips are listed
  in the PR description.
- No style nits that a formatter/linter would catch. No praise sections.
  If a pass finds nothing, say so in one line — an empty pass is a result.
- Do not report the same root cause twice across passes.
