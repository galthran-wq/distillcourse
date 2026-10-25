# Research brief: frege-function-and-quantifier (The function–argument analysis and the quantifier)

status: planned
module: frege
type: core
goal: Apply Frege's function–argument analysis to render sentences with nested generality in quantifier notation, and demonstrate what the subject–predicate logic it replaced could not express.

## ARC (L10)

- **Inherits:** Nothing — the course's first lesson and its easiest (C3). The reader arrives owning the notation ($\forall x\,\exists y$, functions, truth tables) and not knowing that it is 1879 technology, nor what it replaced, nor that a theory of meaning fell out of it.
- **Contributes:** The one analysis every later lesson uses: a sentence is a function applied to arguments; a concept is a function to truth-values; a quantifier is a concept of concepts; and so existence is a second-level concept, never a predicate of a thing. The felt win: the reader writes 'every boy loves some girl' two ways and sees why Aristotle's logic could write neither.
- **Hands off:** To frege-logicism (number is also a second-level concept — the next question is what 'exactly two' says of a concept), to frege-sense-and-reference (the same analysis leaves identity statements unexplained), and to ontological-argument-under-the-new-logic (the second-level account of existence applied to an argument that treats it as first-level).

Spine step: "A new logic makes meaning a theory: sentences have function–argument form, quantifiers are concepts of concepts, so existence is never a property of a thing; from the same analysis numbers become properties of concepts and arithmetic a branch of logic, and a name carries a sense as well as a reference — the programme breaks in 1902, the tools survive."

## Sources to consult

- **SEP Frege §2.1–2.2.3** (research/texts/sep_frege.txt): functions and arguments, concepts as functions to truth-values, 'unsaturated' expressions (§2.1.1); predication as function application and the modern inversion (§2.1.2); only negation and the conditional primitive, universal quantifier only, second-order (§2.2.1–2.2.2); the 'John loves Mary' ⟹ 'something loves Mary' / 'John loves something' inference as one rule where Aristotle needed two, existence as second-level (§2.2.3). Also §2.7.2: lingua characteristica vs calculus ratiocinator; the Frege–Hilbert 'nightmare/dream' passage for the one paragraph on content vs form.
- **SEP Frege §1**: the dates only — Begriffsschrift 1879, Jena; the 1924 diary in one dry clause if biography is wanted at all (it is not needed).
- **SEP 'Conceptions of Analysis' §2** (research/texts/beaney-s6.txt): 'hydrogen is lighter than carbon dioxide' / 'carbon dioxide is heavier than hydrogen' — one content, two function–argument analyses; the key move that enabled quantification.
- **Beaney VSI Ch. 1 'Objects and concepts'** (research/texts/beaney-vsi-djvu.txt): falling under vs falling within; first-, second-, third-level concepts; Ch. 2 'Existential statements': existence as instantiation, negative existentials need no subsistence.
- **IEP §2a** for the one-sentence contrast with the idealists' logic, if any context is wanted (optional).
- **Frege's own texts are NOT staged** (research/sources.yaml): the Begriffsschrift Preface's sentence about the microscope and the eye is quotable from the SEP; verify wording against the Frege Reader before quoting.

## Explanation plan (L0: problem → attempts → answer with its because)

1. **The problem the reader can state.** Write 'every boy loves some girl' and 'some girl is loved by every boy'. They differ; the second implies the first and not conversely. Now try to prove that with a logic whose only sentence form is 'S is P'. Sub-problem: what is the subject of 'every boy loves some girl'? Obvious attempt: 'every boy' is the subject, 'loves some girl' the predicate. It fails because 'loves some girl' is not one property — it is itself quantified, and the two readings differ in where 'some girl' sits. The syllogistic has no place to put a second quantifier (SEP §2.2.3; Beaney's 'two unrelated rules').
2. **Second attempt: treat 'loves' as a two-place relation and the names as its arguments.** 'John loves Mary' = $L(j, m)$. Why this and not subject–predicate: the same content can be cut as 'John' + 'loves Mary' or 'Mary' + 'John loves' (the hydrogen/CO2 example), and no cut is privileged — so the sentence is a function with argument places, and *which* place is left open is what the analysis chooses (SEP conceptions §2). The because: a function with an argument place open is exactly what can be generalised over.
3. **What a concept is, then.** If $L(j, m)$ names a truth-value, 'loves Mary' is a function from objects to truth-values — Frege's concept — and 'unsaturated' is the right word for it: it has a hole. Object vs concept: an object can *fall under* a concept, a concept can *fall within* a higher one, never the reverse (Beaney Ch. 1). The levels ladder figure.
4. **Generality as a concept of concepts.** $\forall x\,Fx$ says of the concept $F$ that it maps every object to the True. So the quantifier is a second-level concept, and 'every boy loves some girl' is $\forall x(Bx \to \exists y(Gy \wedge Lxy))$ vs $\exists y(Gy \wedge \forall x(Bx \to Lxy))$. The inference the syllogistic could not state becomes one rule: from $\varphi(a)$ infer $\exists x\,\varphi(x)$ (SEP §2.2.3, derived from Basic Law IIa). Why only $\forall$, $\neg$, $\to$: economy, and $\exists$ is $\neg\forall\neg$ — a mathematician's point, one line.
5. **The consequence that matters for the rest of the course: existence.** 'Unicorns exist' is $\exists x\,Ux$ — a claim about the concept *unicorn*, that it is instantiated. 'Unicorns do not exist' needs no shadowy unicorns to be about (Beaney Ch. 2). Kant's 'existence is not a real predicate' is now not a thesis but a feature of the notation: there is no first-level predicate 'exists' to apply to a name. Keep the ontological argument for the application lesson — one forward sentence.
6. **Why it mattered / what survived.** Everything in the course after this uses the analysis; what did not survive is the two-dimensional script (one figure, then abandoned), truth-values as objects, and Frege's belief that logic has content (lingua characteristica) — Hilbert's formalism won that dispute, and the 'nightmare/dream' passage says why the two talked past each other. State plainly: the notation was ignored for twenty years; Russell made it current.

## Set pieces and worked examples to recreate

- **'Every boy loves some girl' / 'some girl is loved by every boy'**: both readings written out, a 3×3 boys-and-girls grid showing a model where the first is true and the second false (the lesson's Example 1).
- **Hydrogen lighter than CO2 / CO2 heavier than hydrogen** (SEP conceptions §2): one content, two cuts — the lesson's demonstration that function–argument form is a choice of analysis.
- **'John loves Mary' ⟹ 'something loves Mary' / 'John loves something'** (SEP §2.2.3): one rule, two places; against the syllogism's two.
- **The army / divisions / regiments** is NOT this lesson (it is logicism's); use only 'how many things are on this desk?' as a one-sentence pointer forward, or not at all.
- **The microscope and the eye** (Begriffsschrift Preface): the notation as a microscope — precise for one purpose, useless for ordinary seeing. One sentence, quoted.
- **Frege's 2-D notation vs modern** (SEP §2.2.1–2.2.2 tables): one figure showing the conditional stroke and the concavity for generality; then never used again.

## Pitfalls / subtleties to flag

- Do not teach first-order logic. The reader has it; the lesson is about what the analysis *is* and what it replaced. Every formula appears as the answer to 'how else could this be written?'.
- 'Concept' is a technical term here (a function to truth-values), not the everyday word; define once, italicise once.
- 'Second-level' is not 'second-order': Frege's logic is second-order (quantifies over concepts), and the quantifier is a second-level concept. Keep both terms but introduce 'second-order' only in the logicism lesson where it is needed.
- Frege's claim that sentences *name* truth-values will look odd to the reader; present it as the price of uniformity and note the Tractatus (4.063, 4.442) will reject it — one forward clause.
- No Russell's paradox. No biography beyond 'Jena, 1879'.
- The lesson's register for Aristotle: not a strawman; the syllogistic handled 'all/some S is P' perfectly and multiple generality is the one thing it could not.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **two readings, one model**: a 3×3 boys/girls grid with arrows for 'loves'; left panel satisfies $\forall x\exists y$ and not $\exists y\forall x$, right panel satisfies both. Labels carry the formulas. Inspired by the standard model-theory picture, not by any source figure.
2. `draw:` `<FigureSequence>` (4 frames) — **cutting one sentence three ways**: 'hydrogen is lighter than carbon dioxide' with the function–argument cut moving: frame 1 'hydrogen' + '…is lighter than CO2'; frame 2 'CO2' + 'hydrogen is lighter than…'; frame 3 both names out, $L(\,\cdot\,,\cdot\,)$ with two holes; frame 4 a hole filled by a bound variable. Inspired by SEP conceptions §2's HLC/CHH example.
3. `draw:` single `<Figure>` — **the levels ladder**: objects at the bottom, first-level concepts ('…is a boy'), second-level ('every object falls under …', 'some object falls under …', 'exactly two objects fall under …'); 'falls under' and 'falls within' as two different arrow styles. Inspired by Beaney Ch. 1 and SEP §2.2.3/§2.5.
4. `draw:` single `<Figure>` — **Frege's script and ours**: the conditional stroke and the concavity-with-letter beside $\forall x(Fx \to Gx)$; the caption says this is the last time the 2-D form appears. Inspired by SEP §2.2.1–2.2.2 tables (Frege column recreated as a drawing, not copied).
5. `draw:` single `<Figure>` — **existence is second-level**: 'unicorns exist' drawn as the concept *unicorn* with an arrow from the second-level concept 'is instantiated' pointing at it, versus the crossed-out picture of a unicorn object with a predicate 'exists' attached. Warning colour on the crossed-out form.
6. `source:` none in the pool. images.yaml records a WANTED capture (a Begriffsschrift 1879 page, archive.org scan); if the figure-artist obtains it, place it floated right beside figure 4 so the reader can see the two-dimensional layout as a real page — otherwise figure 4 stands alone.

## EXERCISE PLAN (floor: ≤1 warm-up; ≥2 of boundary / refute / derivation / research; one FORWARD)

1. (warm-up) Render 'every natural number has a successor' and 'there is a number that succeeds every number' in quantifier notation, and give a one-line model where exactly one of them holds.
2. (refute) "Aristotle's logic could handle 'every boy loves some girl' by treating 'loves some girl' as a predicate." Break it: show that the move loses the second reading and cannot state the inference from the stronger to the weaker; name what the syllogistic lacks (a variable bound inside a predicate).
3. (derivation the lesson skipped) Show that $\exists x\,\varphi(x)$ defined as $\neg\forall x\,\neg\varphi(x)$ validates the rule 'from $\varphi(a)$ infer $\exists x\,\varphi(x)$' given only $\forall x\,\varphi(x) \to \varphi(a)$ and propositional logic.
4. (boundary probe) Take the concept $x \neq x$. What does 'something falls under it' say, and why is 'nothing' not the name of an object that falls under it? Use this to explain what is wrong with 'Nothing is better than eternal happiness; a ham sandwich is better than nothing'.
5. (analysis choice) Give two function–argument analyses of '$2 < 3$' and say which one the proof of 'for every $n$ there is a larger prime' uses, and why the choice matters for what can be generalised.
6. (FORWARD → frege-logicism) Write 'there are exactly two $F$s' using only $\exists$, $\forall$, $\neg$, $\wedge$, $\to$ and $=$, without the numeral 2. The solution shows the formula and says that the next lesson defines the number 2 as what all such concepts have in common (Hume's principle), with a `<Ref>`.
7. (research-shaped) The Begriffsschrift sold badly and was reviewed as unreadable; Russell's Principles of Mathematics (1903) made it current. From the dates in the lesson, state how many years the notation waited, and name the feature of the 2-D script (from figure 4) that most plausibly cost it readers.
