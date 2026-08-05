# Code style (binding for implementation and review)

The governing principle: **simplicity**. Everything below is a consequence.
Derived from the owner's stated principles and their linter
(github.com/galthran-wq/sloplint + its wiki); thresholds are sloplint's
defaults. Slop is judged by **defects, not provenance** — never flag "this
looks AI-written", flag the concrete problem. Reviewers work like the
linter's corpus bar: **precision over recall** — flag only what you can
defend with a failure scenario or a named rule here.

## Comments

- **Default: no prose comments at all.** A comment must earn its place by
  carrying a WHY a competent reader can't get from code and names: a
  rationale, an invariant, a workaround reason, a real caveat
  (`# because the upstream API rejects empty payloads` — fine).
- WHAT-comments are defects: restating the code, docstrings that paraphrase
  the signature, `# Step 1:` narration, `# ====` dividers.
- **Deferral tells are high-severity**: `for now`, `in production this
  would`, `placeholder until`, `not implemented yet`, `simplified version`
  — the author admitting the code is unfinished. Hedging (`should work`,
  `probably fine`) is a finding too.
- No provenance in source (PR/issue numbers) — history lives in git.
  `TODO` only with a ticket reference.
- Over-documentation is also slop: a verbose docstring on a one-line body.

## Size, shape, decomposition

Thresholds (sloplint defaults; treat as review triggers, not hard walls):
file > 400 lines · control nesting > 4 · > 15 modules in one flat
directory · identifier > 4 words · if/elif dispatch ladder > 3 uniform
branches (use a dict / match / polymorphism) · data literal nesting > 3
(name the type).

- No one-line delegation functions (indirection must buy something).
- No entity zoo: no class/interface/abstraction before the second real call
  site. Deliberate abstraction (Protocol, ABC, dataclass) is fine — that's
  design, not slop.
- God classes: a class whose methods share no state is 2+ concepts in a
  trench coat — split it.
- **Averages hide slop**: judge the worst unit in the diff, not the overall
  impression. One 300-line function among tidy helpers IS the review.

## Duplication

- **Grep before writing** — the worst failure mode is functionality
  duplicated because the author didn't search (by concept, not just the
  name they would have chosen).
- Reviewers hunt near-clones actively: same logic with renamed identifiers
  across files is `med`+. Intentional duplication must be justified at both
  ends, in the PR body.

## Exceptions

- Broad `except` adding no value is a defect: `except: pass`, bare
  re-raise, log-and-swallow. Swallow-rate is the sharpest slop
  discriminator known.
- Legitimate: translation `raise NewError(...) from exc`, log-then-raise.

## Agent-pathology hunt list (reviewers check each, explicitly)

- **Phantom guards**: `@requires_auth` / `validate_token()` defined or
  imported nowhere — code that reads defended and isn't (CWE-693).
- **Placeholder data in prod paths**: `user@example.com`, `changeme`,
  `123-456-7890`, `{"foo": "bar"}` returns. (Tests exempt.)
- **Ghost scaffolding**: a top-level class/function referenced nowhere; a
  config flag read but never assigned — scaffolded in one step, never wired.
- **Hallucinated dependencies**: import present, manifest (pyproject /
  package.json) entry absent.
- **Corrupted write-backs**: markdown fences, conflict markers, `<file>`
  tags inside source files.
- **Cross-language bleed**: `.length`, `.toString()`, `array_push` in
  Python; Python idioms in TS.
- **Test theater**: tests that execute but assert nothing; suites that
  mirror implementation instead of behavior. Gates without honest
  assertions are not met.

## Structure

- **A directory is a domain, not a junk drawer.** Unrelated files piling up
  in one folder = wrong structure; split by responsibility.
- Before a large feature, check whether the surrounding code needs a
  refactor to accept it cleanly — refactor-then-build, refactor in its own
  commit (own PR if large).

## Documentation

- **CLAUDE.md stays current.** Any change that invalidates it (commands,
  moved directories, conventions) updates it in the same PR. Stale
  CLAUDE.md is a review finding.
