# Playbook — mathematics overlay

Domain layer for mathematical courses (information theory and successors),
on top of `docs/playbook-core.md` and the constitution. Provenance: the
mathematics-didactics literature audit (July 2026 — worked-example and
fading meta-analyses, proof-comprehension research (Mejía-Ramos, Weber,
Selden), concept image / concept definition (Tall & Vinner), interleaving
RCTs (Rohrer), productive failure (Kapur), textbook-usage studies). Where a
finding contradicts our current lesson shape, this file states the new rule.

## Example–problem pairs, not exposition + tail (amends the L7 default)

Evidence favors alternating **worked example → near-isomorphic problem →
feedback** over "six examples, then six exercises". The end-of-lesson
`## Exercises` section stays (E1 — it holds the mixed and spaced material),
but every genuinely new technique gets its paired problem IN the body,
directly after its worked example, as an `<Exercise>` with collapsible
`<Solution>` in place. The reader attempts before revealing.

- **Fading ladder** for multi-step techniques (worked examples g=.48;
  fading smooths the transition): (1) full solution → (2) final step hidden
  → (3) final several steps hidden → (4) setup/strategy cue only → (5)
  independent. Backward fading (hide the last step first). A lesson that
  jumps from one full example straight to unscaffolded problems is too
  abrupt; a lesson that never fades is the opposite error.
- **Tiered help** instead of an all-or-nothing solution reveal: (1)
  strategy-selection hint → (2) first subgoal → (3) partial setup → (4)
  full solution. Until a tiered-hint component exists, approximate with a
  nested fold: a `<Solution>` whose first paragraph is the strategy hint,
  with the full path below a marked break. Require an attempt: the exercise
  text says what a genuine attempt looks like ("write the constraint before
  opening").

## Definitions: the minimum concept set (sharpens L4/L5)

A definition is learned as a boundary, not a sentence (concept image vs
concept definition). Every substantive `<Definition>` is accompanied,
within its section, by:

1. the **canonical example**;
2. a **structurally different** valid example (different surface, same
   structure);
3. a **boundary/degenerate** valid case;
4. a **near-miss** violating exactly ONE clause — with the clause named;
5. a prompt for a **learner-generated** example or non-example ("which
   clause decides your case?").

The near-miss is the mathematical instance of the refutation schema
(core playbook): correct-plus-diagnosed-incorrect beats two correct
examples. Definition-first vs example-first is conditional (core invariant
5): experience-first when a short case exposes the need; definition-first
when the terms are familiar and precision is the point.

## Proofs (sharpens L5)

- **Before** the proof: goal, hypotheses, proof mode (induction,
  contradiction, direct…), and a 2–5 step roadmap.
- **The proof itself stays linear and readable.** Light structure — short
  titled paragraphs, named lemmas — not hierarchical numbering: Leron-style
  structured layouts FAILED their comprehension test (readers understood
  less). Collapsible detail is fine; a proof-programming syntax is not.
- **After** the proof, comprehension tasks (self-explanation training on
  proofs: d=.95 lab, d=.41/.35 field): a one-sentence summary of the idea;
  justify one named step; identify the modules; apply the argument to a
  concrete instance; state where the method would fail or generalize.
- Mark the exact sentence where reasoning becomes general in generic-case
  arguments. Ban "clearly"/"obviously": each is either a justification or a
  Ref to the prerequisite.
- Annotations prompt, never replace (e-Proofs negative result): a "why this
  step?" fold asks the reader to answer before it explains.

## Notation ledger

Each course maintains a notation ledger (symbol, spoken form, type/domain,
meaning, one example, common confusion) — surfaced per lesson where new
notation lands. Editorial heuristic, honestly labeled as such (the
literature offers NO validated per-lesson symbol quota): one new notation
family per subsection, decoded in words and in a representation at point of
need, used successfully once before the next family stacks. Never reuse a
familiar symbol in a new semantic role silently.

## Retrieval gate and interleaving (sharpens E3)

- **Retrieval gate**: a lesson with hard prerequisites opens its first
  section with 2–4 closed-book retrieval prompts on them (a `<Task>` with
  folded answers) — before new material, not after.
- **Interleaving** (math cluster-RCT d=.83): from mid-course on, exercise
  sections mix confusable problem types from earlier lessons WITHOUT naming
  the method. The first sub-question is always "which kind of problem is
  this, and which cues decide?". Blocked drills of the new type (2–4 items)
  come first; then the mix. High blocked-practice accuracy is false
  fluency — the exam-relevant skill is selection.
- Two streams, not one: **low-load retrieval** for definitions, theorem
  conditions, canonical distributions and proof plans; **generative
  problem-solving** for strategy choice, modeling, proof, transfer. Both
  with feedback; retrieval targets the key decision or skeleton, not
  verbatim algebra.

## Productive failure, selectively

For at most one CENTRAL concept per module: a bounded struggle-first task
(accessible but unsolvable with current tools), 2–3 attempted
representations, then an immediate consolidation section that compares the
attempts with the canonical method and names what each missed (g=.36 for
concept/transfer without procedural cost). Never for procedural
prerequisites, and never without the consolidation — delayed instruction
alone is worthless.

## Motivation as intellectual need

The opening (L3) and throughline (L10a) carry the need. What is banned:
utility-value claims ("entropy matters in ML, physics, and data science") —
told utility can DEPRESS interest in low-confidence readers, and 75% of
students skip introductions anyway. What works: a question the current
toolkit provably cannot answer, a surprising contrast, a later task this
concept unlocks — stated in one or two sentences, immediately before the
concept, returned to after it.

## Exercise mix (math instantiation of E2)

For each major concept, the exercise set covers at least: one computation;
one strategy-choice item (which method, and why); one "explain why" at a
decision point; one error-diagnosis or true/false-with-justification; one
transfer/proof/modeling task. Compute-only banks train execution after the
method has been signaled — they underassess recognition, conditions, and
justification. All-prose banks are the equal and opposite error.
