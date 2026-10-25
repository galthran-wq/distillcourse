# Research brief: strawson-on-referring (Strawson's presupposition against Russell's descriptions)

status: planned
module: ordinary-language-philosophy
type: core
goal: Formulate Strawson's objection that Russell analysed sentences rather than uses, explain presupposition and the truth-value gap, and evaluate Russell's reply.

## ARC (L10)

- **Inherits:** From russell-theory-of-descriptions: the analysis, scope, 'the King of France is bald' is false, and the boundary exercise on 'the author of Principia' (what a hearer would say); from austin-speech-acts: 'it takes two to make a truth', the sentence/occasion distinction, truth as assessment of an act; from descriptions-in-a-proof-checker: the truth-value gap as the fourth option engineers declined.
- **Contributes:** The one head-on collision between the two strands of the tradition on one sentence: sentence vs use vs utterance; referring as something speakers do, not expressions; presupposition vs entailment; the truth-value gap; the uniqueness clause does not belong to the assertion; Russell's 1957 reply (different questions; egocentricity; a logic for science); what came of it (Donnellan; Kripke's speaker's/semantic reference; presupposition in linguistics).
- **Hands off:** To grice-conversational-implicature (the implicature as what a use adds to the sentence — Strawson's best examples re-explained), to kripke-rigid-designation and kripke-against-descriptivism (names vs descriptions again, with scope vs rigidity), to gettier-problem (Case I's description read attributively).

Spine step: as for ryle-category-mistake ("… a sentence refers only in a use …").

## Sources to consult

- **Beaney VSI Ch. 6 'Ordinary language philosophy'** (research/texts/beaney-vsi-djvu.txt): Strawson's 'On Referring' — presupposition, truth-value gap vs Russell's 'false'; Russell analysed sentences not uses.
- **SEP 'Conceptions of Analysis' §8** (research/texts/beaney-s6.txt): Strawson on 'On Referring' against Russell; descriptive vs revisionary metaphysics; the connective model (concepts complex yet irreducible).
- **Russell 'On Denoting'** (research/texts/russell-on-denoting.txt): the King of France paragraphs; the Franco intro's gloss on Donnellan (lines 1–118) — secondary, note only.
- **Yablo comp1 and s2_comp1** (research/texts/yablo-24251-assignments.txt): Strawson's objection as the 'single most decisive objection' to Russell — the exercise's shape; the student's scope example.
- **Kripke NN Lecture I n. 3 (p. 25)**: the Smith/Jones leaf-raker; semantic reference vs speaker's reference; Addendum (f): Donnellan, Chastain, Kaplan's Dthat.
- **SEP Austin §2.2**: the 1950 Austin–Strawson symposium on truth; Strawson's performative account and Austin's 'descriptive fallacy' remark — for the Oxford context in one paragraph.
- **Magee–Searle p. 194**: propositional content and illocutionary force — the frame in which 'use' becomes a theory.
- **'On Referring' (1950); Russell, 'Mr Strawson on Referring' (1957); Donnellan 1966 — NOT staged** (research/sources.yaml). The lesson's statements of Strawson's three distinctions (sentence / use / utterance), of the 'table covered with books' example, of Russell's reply (egocentricity; 'the logic book'), and of Donnellan's martini are standard and must be verified against the texts once staged.

## Explanation plan

1. **The problem.** 'The King of France is wise', said in earnest today. Russell: false. You: 'there is no King of France' — the question whether he is wise does not arise. Said in 1670: true or false. Sub-problem: what is the thing that is true or false — the sentence, or something a speaker did with it on an occasion? Obvious attempt: the sentence, and Russell's analysis gives its truth-conditions; your reluctance to say 'false' is politeness. Why it fails: the same sentence has *different* truth-values on different occasions, and no sentence has two truth-values; so the bearer of truth is not the sentence.
2. **Sentence, use, utterance.** Three things: the sentence-type (a string, meaningful, neither true nor false); a *use* of it on an occasion (true or false, or neither); an *utterance* (the event). 'Referring' is something a speaker does *in a use* — 'the King of France' does not refer; a speaker uses it to refer, successfully in 1670 and unsuccessfully today. The because: meaning belongs to the sentence (the rules for using it), truth to the use; Russell conflated them by assigning a truth-condition to the string.
3. **Presupposition, not entailment.** On Russell's analysis 'the King of France is wise' *entails* 'there is a King of France' (it is a conjunct). Strawson: a use of 'the F is G' *presupposes* that there is one F — if the presupposition fails, the question of truth does not arise; the use is neither true nor false (the truth-value gap). Test: entailment survives negation reversal ('the King is not wise' would not entail there is a King on Russell's narrow scope), presupposition does not reverse — 'the King is not wise' presupposes the King exactly as 'the King is wise' does. The because: 'the' is a signal to the hearer that a referent is available, not a claim that one exists.
4. **The uniqueness clause.** 'The table is covered with books' does not assert that there is exactly one table in the universe; context supplies which table. So Russell's uniqueness conjunct misdescribes what is said. The because: 'the' presupposes a uniquely identifiable referent *in the context*, which is a fact about the use, not a conjunct of the sentence.
5. **Russell's reply (1957).** Two points: (a) Strawson's problem is *egocentricity* (indexicals — 'the present King', 'I', 'this'), which is a separate problem Russell had treated elsewhere; strip the egocentric element and the sentence has a determinate truth-value; (b) the theory of descriptions was built for mathematics and science, where 'the' must be eliminable and every sentence must have a truth-value — a logic book is not a description of ordinary speech, and ordinary speech is not the arbiter of logic. State the reply at its strongest: Russell and Strawson were answering different questions — what are the truth-conditions of a regimented sentence vs what does a speaker do with an English one.
6. **Why it mattered / what came of it.** Mattered: the first clear statement of the semantics/pragmatics split, with each side keeping its half — Russell's analysis survives as the semantics of 'the' in a regimented language (and in Lean, `<Ref>`), Strawson's presupposition survives as a tool of linguistics (presupposition projection; the 'neither true nor false' option as partial logic). What came of it: Donnellan 1966 — 'the man drinking a martini' used *referentially* (to pick out that man, even if it is water in his glass) or *attributively* (whoever it is — 'Smith's murderer is insane'), a distinction neither Russell nor Strawson had; Kripke 1977 — speaker's reference vs semantic reference (the leaf-raker: 'Jones is raking the leaves' said of Smith), which keeps Russell's semantics and gives Strawson's phenomena to pragmatics; and Grice (next lesson), who explains Strawson's best examples as implicatures and so hands the logician back his 'the'.

## Set pieces and worked examples to recreate

- **'The King of France is wise' today and in 1670** as the opening Example.
- **The sentence / use / utterance triad** as a figure.
- **The negation test** for presupposition vs entailment — the lesson's derivation.
- **'The table is covered with books'** as the uniqueness case.
- **Russell's 'logic book'** and **egocentricity** reply in two paragraphs, stated as Russell would.
- **Donnellan's martini** and **Smith's murderer** as the referential/attributive pair (one Remark).
- **Kripke's leaf-raker** (n. 3) as the speaker's/semantic reference case.
- **The Austin–Strawson 1950 symposium** — one clause for the Oxford setting.

## Pitfalls / subtleties to flag

- 'On Referring' is not on disk; every characterisation is standard and must be verified; References say so.
- The negation test is the lesson's one derivation; do it in full (both readings of the negated sentence from the descriptions lesson, `<Ref>`).
- Do not declare a winner: the lesson's verdict is the split, with each side's half stated; the Yablo student's 'Strawson refutes Russell' is a claim to refute in an exercise.
- 'Presupposition' is introduced here and used in Grice; define at §3 with the test.
- Keep Donnellan and Kripke 1977 to one paragraph each; they are 'what came of it', not the lesson.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **one sentence, two occasions**: 'the King of France is wise' with 1670 (a referent; true or false) and today (no referent; 'the question does not arise'), the sentence-type above both, unchanged. Inspired by Strawson's opening (standard).
2. `draw:` single `<Figure>` — **sentence, use, utterance**: three stacked boxes — type (meaning; rules), use (truth-value; referring), utterance (event) — with 'Russell assigned this ↑ to this ↓' drawn as the misplacement. Inspired by 'On Referring' §I (standard).
3. `draw:` `<FigureSequence>` (3 frames) — **presupposition vs entailment under negation**: frame 1 Russell's analysis with 'there is a King' as a conjunct; frame 2 negate — on narrow scope the conjunct survives, on wide scope it goes; frame 3 Strawson: 'the King is not wise' still presupposes the King — the presupposition drawn beneath both sentences, untouched. Inspired by the standard negation test.
4. `draw:` single `<Figure>` — **the table and the books**: a room with several tables; 'the table is covered with books' picking one by context, with Russell's '∃! table' crossed in warning colour. Inspired by 'On Referring' (standard example).
5. `draw:` single `<Figure>` — **two questions**: 'what are the truth-conditions of this regimented sentence?' (Russell; mathematics and science) and 'what does a speaker do with this English sentence?' (Strawson; ordinary use), with the 1957 reply as the line between them. Inspired by Russell 1957 via Beaney.
6. `draw:` single `<Figure>` — **what came of it**: a three-row table — Donnellan (referential/attributive), Kripke 1977 (speaker's/semantic reference), Grice (implicature) — each with the case ('the man drinking a martini'; the leaf-raker; 'some left') and which half it assigns the phenomenon to. Inspired by Kripke n. 3 and Addendum (f).
7. `source:` none.

## EXERCISE PLAN

1. (warm-up) For 'the author of Waverley was Scott', 'the largest prime is odd' and 'the table is covered with books', state what a Russellian truth-condition gives, what a Strawsonian use presupposes, and where the two disagree on the verdict.
2. (refute) "Strawson refutes Russell: the theory of descriptions is simply wrong about 'the'." Break it with Russell's 1957 reply: state the question each theory answers, and give the sentence of mathematics for which Strawson's gap would be a defect and Russell's analysis a necessity.
3. (derivation — the negation test) Using the two scope readings from the descriptions lesson, show that Russell's existence conjunct survives narrow-scope negation and not wide-scope; then show that Strawson's presupposition survives both; conclude what 'presupposes' adds that 'entails' lacks, in one sentence.
4. (boundary probe) A use with a *false* but identifying description: 'the man drinking a martini is a spy' said of a man drinking water. On Russell, false (no such man); on Strawson, the presupposition fails. Both seem wrong — the speaker said something true of that man. State what Donnellan's referential use adds and what it costs Strawson (the description did not even need to be true to refer).
5. (claim–evidence, cross-lesson) Lean's `x/0 = 0` is Frege's default; Russell's 'false'; Strawson's 'no truth-value' would be a partial logic. State in two lines what a theorem prover with truth-value gaps would have to carry on every theorem, and say which of the three the Strawsonian gap most resembles in cost — the engineers' reason for declining it.
6. (FORWARD → grice-conversational-implicature) 'Some of the guests left' is true if all did, on the logician's 'some'; the ordinary speaker takes it to mean not all. Strawson would say ordinary 'some' differs from $\exists$. Try to state the rule of use that makes 'not all' part of what 'some' means, and then say what happens when the speaker adds 'in fact, all of them did'. The solution says the next lesson explains the 'not all' as added by the use, not the word, with a `<Ref>`.
7. (research-shaped) Presupposition projection: 'if the King of France is wise, the court is lucky' — does the conditional presuppose there is a King? And 'if France has a king, the King of France is wise'? Construct the two cases, state the rule linguists use (presuppositions of the consequent are filtered by the antecedent), and say which theory — Russell's entailment or Strawson's presupposition — the rule is a theory of.
