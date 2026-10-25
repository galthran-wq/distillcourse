# Research brief: ontological-argument-under-the-new-logic (The ontological argument under the new logic)

status: planned
module: frege
type: core — APPLICATION lesson (L16) closing the Frege module
goal: Analyze Anselm's and Descartes's ontological argument with the second-level account of existence, and state where a modal reformulation escapes that diagnosis.

## ARC (L10)

- **Inherits:** From frege-function-and-quantifier: existence as a second-level concept, the concept/object distinction and the levels ladder. From frege-sense-and-reference nothing is needed (say so in the brief's APPLICATION spec: the reading uses the logic, not the semantics).
- **Contributes:** The module's analysis run on a real argument that has been attacked for nine centuries: the diagnosis that 'existence is a perfection' puts a second-level concept where a first-level one must go; the two parodies as evidence that the form proves too much; and the one reformulation (modal, higher-order) that moves the predicate to a place the diagnosis does not reach — with the 2013–2016 computer check as the artefact that shows what that costs.
- **Hands off:** To russell-theory-of-descriptions (the FORWARD exercise: 'the most perfect being' as a description, Russell's n. 14), and to kripke-rigid-designation and lewis-possible-worlds (necessary existence as a modal property; S5).

Spine step: as for frege-function-and-quantifier.

## APPLICATION spec (L16)

- **Artefact:** the ontological argument in its two classical statements (Anselm, Proslogion II, 1078; Descartes, Fifth Meditation, 1641) and its 2013 computer formalisation — Gödel's 1970 version encoded in higher-order modal logic and checked in Isabelle/HOL and Coq (Benzmüller & Woltzenlogel Paleo 2013), with the 2016 follow-up showing Gödel's original axiom set inconsistent and Scott's variant consistent.
- **Module results it uses:** existence as $\exists x\,Fx$, a second-level concept (frege-function-and-quantifier §5); the concept/object levels (§3); the rule that a first-level predicate cannot take a concept as argument.
- **Where the artefact departs from the idealisation:** Gödel's version does not say 'existence is a perfection'; it says *necessary existence* is a positive property and works in a logic where properties are quantified over and 'positive' is a third-level operator — exactly the apparatus Frege's levels permit. So the diagnosis blocks Anselm and leaves Gödel standing; what the machine then found is that the axioms prove everything (modal collapse: $\varphi \to \Box\varphi$), which is the modern form of 'proves too much'.

## Sources to consult

- **Beaney VSI Ch. 2 'Does a perfect God exist?'** (research/texts/beaney-vsi-djvu.txt): the scariest devil parody (Fig. 2) and the Fregean diagnosis via second-level existence; 'Existential statements' for the setup.
- **Russell 'On Denoting'**, the paragraph 'The whole realm of non-entities…' and fn N14: the argument recast with 'the most perfect being' as a description; with perfection = all positive predicates the class can be proved empty 'almost formally'.
- **Ayer LTL Ch. 1 pp. 25–27** (research/texts/languagetrut-s1-ch01-03.txt) and 1946 Introduction pp. 196–197: 'martyrs exist' vs 'martyrs suffer'; Moore's 'all tame tigers growl / exist' — existence is not an attribute, 'and this blocks the ontological argument'.
- **SEP Frege §2.2.3**: existence as a second-level concept and Kant's 'not a real predicate'.
- **Kant, Critique of Pure Reason A598/B626** (the hundred thalers) — not staged; quote from any standard translation, verified.
- **Benzmüller & Woltzenlogel Paleo 2013 (arXiv 1308.4526) and 2016 (the inconsistency note)** — NOT in the dossier (research/sources.yaml); the writer stages and reads the abstract, the axiom list (A1–A5, D1–D3, T1–T3) and the modal-collapse result before writing §6.
- **Plantinga 1974 (The Nature of Necessity Ch. 10)** — not staged; the modal version is stated from the standard summary (maximal greatness entails maximal excellence in every world; S5) and flagged as such.

## Explanation plan

1. **The problem.** State Anselm's argument in five lines (the fool, 'that than which nothing greater can be conceived', exists in the understanding, would be greater if it existed in reality, so it exists in reality) and Descartes's (existence belongs to the essence of a supremely perfect being as three angles belong to a triangle). Then the parodies: Gaunilo's perfect island (1078, the same decade), and the scariest devil (Beaney Fig. 2): a devil that exists is scarier than one that does not, so the scariest devil exists. Everyone agrees the parodies fail; nobody could say which *step* they share with the original and whether that step is the fault.
2. **Obvious attempt: deny a premise.** 'A being that exists is not greater than one that does not.' Why it fails as a diagnosis: it is a counter-assertion, and the theist has as much right to the opposite one. The argument is not refuted by disagreeing with it.
3. **Kant's move.** 'Existence is not a real predicate': a hundred real thalers contain not a coin more than a hundred possible thalers; adding 'exists' to a concept adds nothing to the concept. Why it is only half an answer: Kant says what existence is not and leaves what it *is* unexplained, so the theist can reply that it is a special predicate.
4. **Frege's completion.** Existence is instantiation, a property of concepts: '$F$s exist' is $\exists x\,Fx$. Now rewrite Descartes's premise 'existence belongs to the essence of a perfect being' in the notation. It cannot be written: 'essence of $G$' lists first-level properties of objects falling under $G$; 'is instantiated' is not one of them, it is a property *of* $G$. The argument's crucial step is a level confusion — the ladder figure with the predicate 'exists' drawn at the wrong rung. The parodies share exactly this step, which is why they come out as the same argument with a different concept plugged in.
5. **Russell's version (forward seam only).** 'The most perfect being exists' with a description: $\exists x\,(Px \wedge \forall y(Py \to y = x))$; the argument needs the existence-and-uniqueness premise it was supposed to prove. One paragraph; the derivation is the FORWARD exercise.
6. **Where the diagnosis stops: the modal version and the machine.** Plantinga and Gödel do not use 'exists' as a predicate of an object; they use *necessary existence* as a property among properties, in a logic where properties are quantified over (second-order) and 'positive' is a predicate of properties (third-level). Frege's levels allow that. So the 2013 formalisation in Isabelle/HOL is a legitimate higher-order modal object, the theorem follows from the axioms, and the diagnosis of §4 does not apply. What the machine added: the 2016 finding that Gödel's original axioms are inconsistent and that Scott's variant, while consistent, entails modal collapse ($\varphi \to \Box\varphi$) — nothing is contingent. The 'proves too much' objection returns in formal dress: not a perfect island, but the necessity of everything.
7. **Verdict.** Which module results the reading used (levels, second-level existence), which it did not need (sense/reference), and where the idealisation departs (Frege's logic is not modal; the modal argument lives in a logic the module has not met — S5 — and will meet in Kripke and Lewis).

## Set pieces and worked examples to recreate

- **Anselm in five lines and Descartes's triangle** as a two-column Example.
- **Gaunilo's island and the scariest devil** (Beaney Fig. 2) as the parody pair.
- **The hundred thalers** (Kant) as one quoted sentence.
- **The level diagram** with 'exists' tried at the first level and rejected.
- **Russell's n. 14**: 'the class of most perfect beings can be proved empty almost formally' — one Remark.
- **The Gödel axiom list** (A1–A5, D1–D3) reproduced as a short table in a `## ★` starred section, with the 2016 inconsistency and the modal-collapse theorem stated; the computer's role explained (the proof is checked, the axioms are the philosophy).

## Pitfalls / subtleties to flag

- The lesson is not theology and takes no stand on God; it is a worked case of a logical diagnosis. Say so once, dryly.
- Do not let the modal section become a modal-logic tutorial: 'necessary' and 'possible' are used informally here, with one forward sentence to the Kripke module; the S5 axiom is named, not derived.
- Benzmüller's papers must be read before §6 is written; the brief's statements about modal collapse and the 2016 inconsistency are from the standard account and need checking against the papers' own wording.
- The parodies are evidence, not jokes: they show that the form is the fault.
- No Russell's paradox, no Gaunilo biography.

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (5 frames) — **Anselm's argument as moves**: the fool, the definition, 'in the understanding', 'would be greater in reality', 'therefore exists'; frame 5 adds the parody column with 'devil' substituted, the same five moves, and a warning-coloured 'same form' bracket. Inspired by Beaney Ch. 2's four-case opening.
2. `draw:` single `<Figure>` — **the hundred thalers**: two identical stacks of coins labelled 'possible' and 'real', with '+ exists' drawn as adding no coin. Inspired by Kant's example.
3. `draw:` single `<Figure>` — **'exists' on the ladder**: the levels ladder from lesson 1; 'exists' tried as a first-level predicate (crossed, warning colour) and placed correctly as a second-level concept 'is instantiated' pointing at the concept *perfect being*. Inspired by SEP §2.2.3.
4. `draw:` single `<Figure>` — **Russell's version**: 'the most perfect being exists' unpacked into the three-conjunct formula with the existence-and-uniqueness conjunct highlighted as 'the premise the argument needed'. Inspired by Russell n. 14.
5. `draw:` single `<Figure>` — **where the modal version lives**: a three-level diagram (objects; properties; 'positive' as a predicate of properties) with 'necessary existence' placed as a property and the diagnosis arrow of figure 3 shown stopping short of it. Inspired by the Gödel/Scott axiom structure.
6. `draw:` single `<Figure>` — **what the machine found**: a small table — Gödel 1970 axioms: inconsistent (2016); Scott variant: consistent, proves modal collapse $\varphi \to \Box\varphi$; the 'proves too much' row aligned with the parody row of figure 1. Inspired by Benzmüller & Woltzenlogel Paleo.
7. `source:` none in the pool. (A screenshot of the Isabelle proof would be apparatus, not evidence.)

## EXERCISE PLAN

1. (warm-up) Rewrite 'martyrs suffer' and 'martyrs exist' in quantifier notation and state, from the forms, why only the first attributes a property to martyrs.
2. (refute) "Kant already refuted the ontological argument; Frege added nothing." Break it: state what Kant's thalers show and what they leave open, and give the one Fregean sentence (existence is instantiation) that closes it.
3. (boundary probe) Run the diagnosis on 'the largest prime does not exist'. Show that the sentence is $\neg\exists x\,(Px \wedge \forall y(Py \to y \le x))$, that nothing need 'subsist' to be denied, and what a defender of subsistent objects would have to say about primes.
4. (derivation — Russell's version) Using the formula from figure 4, show that the ontological argument with a description is valid only if 'there is exactly one most perfect being' is a premise, and that with 'perfection = having every positive predicate' the class is empty whenever two positive predicates are incompatible (Russell n. 14). The solution notes this is the next lesson's theory of descriptions used ahead of time.
5. (FORWARD → russell-theory-of-descriptions) The same sentence 'the most perfect being exists' has, on Russell's reading, no subject at all. State what its grammatical subject is and what its logical form contains instead, and say what the lesson after this will call that gap. The solution gives the name 'incomplete symbol' with a `<Ref>`.
6. (research-shaped) From the 2013 paper's axiom list (staged by then), identify which axiom makes 'necessary existence' a positive property and which licenses the inference from 'possibly God exists' to 'God exists'; state in one sentence why the second needs S5. Then say which of the two the 2016 inconsistency result bears on.
7. (claim–evidence) Gaunilo's reply is dated the same decade as the Proslogion. Using the parody as evidence, argue in a paragraph that the medieval reader already knew the argument proved too much, and state what was missing until 1879 for the diagnosis to be more than a counter-example.
