# Research brief: descriptions-in-a-proof-checker (Definite descriptions and the tautology test in a proof assistant)

status: planned
module: logical-atomism
type: core — APPLICATION lesson (L16) closing the Russell/Tractatus module
goal: Analyze how a working proof assistant handles 'the $x$ such that $\varphi$' when nothing or several things satisfy $\varphi$, and compare its choice with Frege's, Russell's and the Tractatus's.

## ARC (L10)

- **Inherits:** From russell-theory-of-descriptions: the contextual elimination of 'the $F$', scope, Frege's conventional denotation called 'artificial', $m - n$ as a description (and the FORWARD exercise about $3 - 5$). From tractatus-logic-as-tautology: 6.1203's decision method, 5.132's 'no laws of inference', 3.333's dismissal of types. From logical-constructions-and-acquaintance: the theory of types.
- **Contributes:** The module's machinery read against a system that must run: the four options for an empty description (Meinong's object, Frege's default, Russell's elimination, Strawson's gap — the last named only as the next module's) and the engineers' choice of a total function with a default value; Hilbert's $\iota$ and $\varepsilon$ as the description operator; `decide` as 6.1203; the inference rules and the type hierarchy the Tractatus said were superfluous and unnecessary.
- **Hands off:** To strawson-on-referring (the truth-value gap as the fourth option, and partial logics as its engineering form), to kripke-rigid-designation (scope of a description under a modal operator — MIT 24.244 take-home q8), to grice-conversational-implicature (the formal/ordinary 'or').

Spine step: "… — the method is clean enough to run on a machine."

## APPLICATION spec (L16)

- **Artefact:** the Lean 4 theorem prover with the Mathlib library, where `x / 0 = 0` and `0⁻¹ = 0` are theorems (`div_zero`, `inv_zero`) and division is a total function on every `DivisionRing`; Lean's `Classical.choose` / `Exists.choose` (a choice operator: from a proof of $\exists x\,\varphi$, a term); Isabelle/HOL's `THE x. φ` (Hilbert's $\iota$: the unique $x$ if there is one, an unspecified value otherwise) and `SOME x. φ` ($\varepsilon$); Principia Mathematica *14.01–*14.02 (Russell's contextual definition with scope marker). The lesson reads the actual definitions and one Mathlib proof that goes through *because* of the default (e.g. `a / b = a * b⁻¹` with no side condition).
- **Module results it uses:** the theory of descriptions (elimination; scope); Frege's conventional default and Russell's objection; the tautology decision method (6.1203) as the `decide` tactic for propositional goals; 5.132 (no laws of inference) against the assistant's explicit rules; 3.333 (types unnecessary) against Lean's universe hierarchy; the type theory of logical-constructions-and-acquaintance.
- **Where the artefact departs from the idealisation:** (1) the engineers chose Frege's 'artificial' option in working clothes — totality with a default — because every theorem would otherwise carry a side condition and every proof a case split; Russell's elimination survives as the *statement* of the theorems (uniqueness hypotheses), not as the term language; (2) scope does not disappear: 'the inverse of $A$ is invertible' is true in Lean for singular $A$ under the default and the user must know it; (3) the Tractatus's 'logic takes care of itself' holds for `decide` on propositional goals and fails beyond — predicate-logic validity is undecidable, so the assistant needs tactics and rules; (4) the type hierarchy the Tractatus called unnecessary is the one thing the assistant cannot do without.

## Sources to consult

- **Russell 'On Denoting'**: the Frege paragraph (null class 'artificial'; 'the King of France is bald' false because the null class has no hair — check the exact wording), the $m - n$ paragraph, the Tempest sentence, primary/secondary occurrence.
- **Tractatus 6.1203, 6.1262, 5.132, 3.333, 6.1251** (tractatuslog-s3-tlp-en-5-7.txt; tlp.pdf for the 6.1203 diagram).
- **Beaney VSI Ch. 2 (K1)–(K5)** for the staging of the elimination.
- **Mathlib documentation** (NOT in the dossier; research/sources.yaml): `div_zero`, `inv_zero`, `DivisionRing`, `Classical.choose`, `Exists.choose_spec`; the Mathlib wiki page 'Division by zero in type theory'; Isabelle's `THE` (`Hilbert_Choice` and `the_equality`); PM *14.01–*14.02 (any edition; the scope marker `[(ιx)(φx)]`). The writer stages these as text excerpts before writing.
- **MIT 24.244 take-home q8** (research/texts/mit24244-takehome.txt): three scope readings of a modal sentence with a description — reuse as the FORWARD exercise.
- **Strawson** — not staged; the gap option is stated as the next module's and not argued here.

## Explanation plan

1. **The problem.** `1/0` returns `0`, no error. The mathematician's three alternatives: (a) make every theorem about division carry '$b \neq 0$'; (b) make `1/0` a type error (meaningless); (c) make `1/0` denote nothing. Each is one of the module's theories: (a) is Russell's uniqueness/existence clause moved into the theorem statements; (b) is Russell's 'the round square' as a type violation (Tractatus 3.333's spirit); (c) is Frege's gap, or Strawson's. And the system chose (d): Frege's conventional default. Sub-problem: why?
2. **What a description operator is.** From a proof of $\exists x\,\varphi(x)$ Lean's `Classical.choose` produces a term; Isabelle's `THE x. φ` produces a term whether or not $\varphi$ is uniquely satisfied, with `the_equality` as the only rule that says anything about it. Hilbert's $\iota$ and $\varepsilon$. Contrast PM *14.01: '$[(\iota x)(\varphi x)]\,\psi(\iota x)(\varphi x) \,=_{df}\, \exists b\,(\forall x(\varphi x \leftrightarrow x = b) \wedge \psi b)$' — the description eliminated *per sentence* with the scope bracket. The because: an operator that always returns a term keeps the term language simple; Russell's elimination keeps the ontology simple; the two trade off.
3. **Why totality won.** Walk through `a / b = a * b⁻¹` in Mathlib: with the default, it is a theorem with no hypothesis; without it, every use would need a case split on $b = 0$. Then the price: `x / x = 1` is *not* a theorem (false at 0) — exactly the shape Russell predicted for a description in primary occurrence ('$3 - 5 = 2$' false; the FORWARD exercise of the descriptions lesson). The engineers moved the existence-and-uniqueness clause from the *terms* into the *theorems*: Russell's analysis survives as the statement of the hypotheses.
4. **Scope survives.** 'The inverse of $A$ is invertible' for singular $A$: with the default $A^{-1} = 0$, '$A^{-1}$ is invertible' is false (0 is not invertible) — but '$A^{-1}$ is not invertible' is true, and the two readings of the descriptions lesson reappear as 'does the default apply inside or outside the predicate'. The user has to know which the library means. One worked case.
5. **The tautology test and the rules.** `decide` on a propositional goal is 6.1203: enumerate truth-possibilities, check all-T. 6.1262's 'proof is a mechanical expedient' is literally the tactic. But the assistant also carries modus ponens and the quantifier rules as *rules*, which 5.132 said were superfluous — and here the Tractatus is right and wrong: for propositional logic the rules are eliminable (truth tables decide), for predicate logic they are not (no decision procedure), and the assistant's whole design is the second fact.
6. **Types.** 3.333 dismissed Russell's types as unnecessary once one sees that a function cannot be its own argument. The assistant's universe hierarchy (`Type 0 : Type 1 : …`) is that very observation made a rule the checker enforces — the Tractatus's 'logic takes care of itself' means, in practice, 'a type checker takes care of it'.
7. **Verdict.** Which results the reading used; where the artefact departs (the four points of the spec); and the open question the next module presses: Strawson's gap as a *fourth* semantics (partial logics, Kleene tables) and why no mainstream assistant chose it (every theorem would need a definedness side condition — Russell's objection to Frege, in a new form).

## Set pieces and worked examples to recreate

- **`1/0 = 0`** with the Mathlib theorem name, and **`x / x = 1` not a theorem** — the pair as the lesson's Example 1.
- **PM *14.01 with the scope bracket** beside Lean's `Classical.choose` — the two operators side by side.
- **The inverse of a singular matrix**: the scope case.
- **`decide` on $\neg(p \wedge \neg p)$** beside the 6.1203 line diagram.
- **The universe hierarchy** beside the type ladder of logical-constructions-and-acquaintance.
- **Russell's $m - n$** and the natural-number subtraction in Lean (`Nat.sub` truncates: $3 - 5 = 0$) — a second default, same philosophy.

## Pitfalls / subtleties to flag

- The lesson is philosophy read on an artefact, not a Lean tutorial: no more than six lines of Lean, each explained in English, and the reader need not install anything.
- Verify every Mathlib name and statement against current documentation before writing; library names change. Give the version.
- Do not claim the engineers 'chose Frege': they chose a default for engineering reasons; the lesson's point is that the choice *is* Frege's option and inherits Russell's objection to it ('artificial'), which the library answers by moving hypotheses into theorems.
- Strawson's option is named, not taught, here — one paragraph with a forward `<Ref>`.
- 'Undecidable' is the reader's known result; do not re-prove it.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **four answers to an empty description**: a 4-row table — Meinong (an object; contradiction), Frege (default; 'artificial'), Russell (false; hypotheses elsewhere), gap (neither; definedness conditions) — with a fifth row 'Lean/Isabelle' aligned under Frege's. Inspired by Russell's Frege/Meinong sections.
2. `draw:` `<FigureSequence>` (3 frames) — **where the uniqueness clause goes**: frame 1 Russell's sentence with $\exists!$ inside; frame 2 the term `a / b` with the clause removed and a default; frame 3 the clause reappearing as the hypothesis `(hb : b ≠ 0)` of the theorem `x / x = 1`. Inspired by PM *14 and Mathlib.
3. `draw:` single `<Figure>` — **$\iota$ and $\varepsilon$ beside `choose`**: three boxes with input (a proof / a predicate) and output (a term), and what each guarantees. Inspired by Isabelle `THE`/`SOME` and Lean `Classical.choose`.
4. `draw:` single `<Figure>` — **scope in the library**: 'the inverse of $A$ is invertible' with the default applied inside vs outside the predicate, truth-values F / T, aligned with the King of France figure of the descriptions lesson. Inspired by Russell's primary/secondary occurrence.
5. `draw:` single `<Figure>` — **6.1203 and `decide`**: the line diagram for $\neg(p \wedge \neg p)$ on the left, the tactic's enumeration on the right; a dashed boundary labelled 'propositional only' with 'predicate logic: no decision procedure' outside it. Inspired by 6.1203.
6. `draw:` single `<Figure>` — **types the Tractatus said were unnecessary**: the universe ladder `Type 0 : Type 1 : Type 2` beside the Russell type hierarchy figure, with 3.333's sentence as caption. Inspired by 3.333 and Lean's universes.
7. `source:` none. (A screenshot of a Lean session is apparatus; the six lines of code are typeset.)

## EXERCISE PLAN

1. (warm-up) State, for each of `1/0 = 0`, `0⁻¹ = 0` and `x/x = 1`, whether it is a theorem under the default convention and which Russellian conjunct (existence, uniqueness, predicate) the failing case corresponds to.
2. (derivation) Show that with the default $x/0 = 0$ the identity $a/b = a \cdot b^{-1}$ holds for all $b$ while $(a/b) \cdot b = a$ holds only for $b \neq 0$; write both in Russell's contextual form and say which has the description in primary occurrence.
3. (boundary probe) `Nat.sub` truncates: $3 - 5 = 0$. Russell's $m - n$ 'is false in primary occurrence' when no unique number exists. State the two conventions, show they agree on every true subtraction and disagree exactly where Russell's sentence is false, and say which convention a theorem '$ (m - n) + n = m$' needs as hypothesis.
4. (refute) "A proof assistant vindicates Frege against Russell: descriptions do denote, by convention." Break it: show that the assistant's theorems carry Russell's existence-and-uniqueness hypotheses, so the elimination survives at the level of statements, and that Frege's convention is adopted only for terms.
5. (claim–evidence) 5.132 says laws of inference are superfluous. Give the propositional case where the assistant can replace them by `decide`, and a predicate-logic sentence (any valid first-order sentence with nested quantifiers) where it cannot; state the theorem of the reader's own logic that explains the difference.
6. (FORWARD → kripke-rigid-designation; from MIT 24.244 q8) Take 'necessarily, the inverse of $A$ is possibly invertible' and write its narrow, intermediate and wide scope readings. The solution says the next-but-one module will distinguish a description that is *not* rigid from a name that is, and that the scope ambiguity is where that distinction first shows, with a `<Ref>`.
7. (research-shaped) Find, in the Mathlib documentation, the stated rationale for `x / 0 = 0` and quote it in one sentence; then state which of Russell's objections to Frege (artificiality; 'the King of France is bald' coming out false for the wrong reason) it answers and which it accepts.
