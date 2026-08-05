---
name: issue-writing
description: House format for writing GitHub issues — dry, decision-first, self-sufficient for a less capable executor. Use when creating or rewriting any implementation issue, standalone or as an epic child.
argument-hint: "<what the issue is about>"
---

# Issue Writing

An issue is a spec for an executor who is **less capable than you and has
none of your context**. If the executor would have to re-decide anything the
humans already decided, the issue is broken.

Written in **English**. Dry, straight to the point. No motivation essays.

## Structure

```
Epic: #X. Depends on: #A, #B.        ← first line; omit what doesn't apply

## Decisions
- The chosen approach, one bullet per decision, WITH the tradeoff and the
  one-line rationale ("X, not Y: <reason>"). Rationale exists so the
  executor doesn't re-decide, not to persuade.

## Schema / Contract                  ← when the issue touches data or APIs
- SQL / signatures / file layout, exact. Names are binding.

## Scenario                           ← when a user-visible flow exists
- One concrete end-to-end walk-through.

## Gates
- [ ] Checkbox list = definition of done. Testable, specific.

## Out of scope
- What the executor must NOT build, with issue refs to where it lives.
```

## Rules

- **Numbers, not letters.** "cap 20/day", not "cap N/day". Values that are
  genuinely tunable are marked `(config)` — with a starting value anyway.
- **Decisions are binding.** The executor implements them; disagreement goes
  back to the human, not into the code.
- **Tradeoffs stay.** Recording why the losing option lost prevents
  re-litigation by future readers (human or model).
- **Cross-reference, don't duplicate.** A table owned by another issue is
  referenced (`#13`), never re-specified.
- **Gates are the review contract.** Reviewers (see `impl-review`) verify
  the diff against the gates; write gates you'd be able to check.
- **Backlog issues** are small: what it is, why it's not in MVP, what in the
  current design already reserves space for it, and a "Reopen when:" line.
  Created, then closed as `not planned`.
- Self-test before publishing: read the body as a stranger. Every "how"
  question you can ask must be answered by the body, a referenced issue, or
  be genuinely an implementation detail (naming a local variable — fine;
  choosing an auth model — never).
