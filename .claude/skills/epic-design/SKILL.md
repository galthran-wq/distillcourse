---
name: epic-design
description: Turn a rough epic sketch (a GitHub issue or a prompt) into a fully-decided epic with child issues — through structured discussion, explicit decision confirmation, adversarial design review, and a self-audit. Use when the user wants to plan a large feature/epic before implementation.
argument-hint: "<epic issue number or a topic>"
disable-model-invocation: true
---

# Epic Design

You turn a sketch into an executable spec. The output is a GitHub epic +
child issues written per the `issue-writing` skill. The human is the
decision-maker; you are the one who makes every decision *explicit*.

Everything published to GitHub is written in **English**. Discussion happens
in the user's language.

## 0. MODEL GATE — check first, before anything else

Design is the highest-leverage stage: a wrong decision here costs every
downstream issue. Identify your own model from your system prompt. Epic
design MUST run on **Claude Fable 5** (`claude-fable-5`) or a Mythos-class
successor. If you are any other model (Opus, Sonnet, Haiku, …):
**STOP immediately.** Output exactly this and do nothing else:

> Epic design requires Fable. Switch the session model (/model) and re-run
> /epic-design.

## Phase 1 — Ground

1. Read the sketch (`gh issue view N`) and the current repo state (stack,
   entry points, what exists vs what the epic assumes). Name the gap
   explicitly ("this epic adds a backend where none exists").
2. Decompose the sketch into blocks with a dependency spine. Present your
   reading back to the user before designing anything.

## Phase 2 — Decide (the core loop)

Iterate over decision points, in dependency order. For each one:

- **Genuine forks** (answer changes the work materially): present options
  with tradeoffs and a recommendation; ask via AskUserQuestion. Never bury a
  fork inside prose.
- **Defaults** (conventional choice exists): state it in a clearly marked
  "defaults, silence = consent" list. The user vetoes what they disagree with.
- **User pushback**: argue fairly with facts once; if the user reaffirms,
  that is the decision — record it and move on.
- **Evidence exists** → research (perplexity / web) instead of opinion:
  pedagogy, scheduling policies, library capabilities, ecosystem state.
  Verify library APIs against current docs, not training data.
- **Scope cuts**: propose explicitly what leaves MVP. Each cut becomes a
  backlog issue, closed as `not planned`, with a "Reopen when:" condition.

Keep a running record: every agreed decision must later land in an issue
body. Nothing lives only in the chat.

## Phase 3 — Write & publish

1. Draft child issues per the `issue-writing` skill. Show drafts to the user
   in batches for review before publishing.
2. Predict issue numbers before creating (check max issue/PR number) so
   bodies can cross-reference; create in topological order; verify numbers.
3. Backlog issues: create, then close as `not planned`
   (`gh api -X PATCH ... -f state=closed -f state_reason=not_planned`).
4. Epic body: scope paragraph, architecture summary, MVP checklist
   (`- [ ] #N title`), dependency graph in a code block, waves, backlog list.

## Phase 4 — Adversarial review

Reviews always run from **fresh context** — you designed this epic, so you
cannot review it: you'd read your intent, not the spec. After publication,
launch two subagents in parallel (background), both on **Fable 5** (Agent
tool, `model: "fable"` — design review is not delegated down-tier), both
reading the published epic + issues via `gh` with no conversation context:

- **Hole-finder**: security, failure modes, races, missing schema
  fields/indexes, contradictions between issues, undefined contracts at
  boundaries, operational gaps, missing first-two-weeks pieces.
- **Alternatives**: for each major decision — what problem does it solve,
  does this project (at its real scale) have that problem, what is cheaper,
  which door is one-way. Must also list decisions that are right and should
  not be touched.

Relay findings to the user honestly. Sort them: accept-and-patch (apply),
re-litigations of the user's explicit decisions (present, recommend keeping,
user decides), genuine forks (ask). Patch issue bodies — edit in place, the
bodies are the spec, not an addendum trail.

## Phase 5 — Self-audit

Walk the whole discussion chronologically and diff it against the issue
bodies. The test: **an executor less capable than you, with zero
conversation context, must not have to make any decision the user already
made.** Every "we agreed" must be findable in a body; every number must be a
number, not a letter ("N per day" is a bug). Patch the misses.

## Rules

- Issue bodies are the single source of truth after this skill ends.
- Never start implementation; this skill ends at published, audited issues.
- Save a memory entry pointing to the epic and listing
  decisions-not-to-relitigate.
