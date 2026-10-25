# Research brief: grice-conversational-implicature (Grice's maxims: implicature and the end of the ordinary-language programme)

status: planned
module: ordinary-language-philosophy
type: core — APPLICATION lesson (L16) closing the ordinary-language module
goal: Apply Grice's cooperative principle and maxims to derive, as implicatures, the divergences between the logician's 'or', 'some' and 'if' and their ordinary use, and state what that does to the ordinary-language method.

## ARC (L10)

- **Inherits:** From austin-speech-acts: force vs content, 'it takes two to make a truth'; from strawson-on-referring: sentence vs use, presupposition, and the FORWARD exercise on 'some … in fact all'; from tractatus-logic-as-tautology: the truth-functional connectives; from meaning-as-use: use as the datum. From ryle-category-mistake: Williams's critique that the method underestimated theory.
- **Contributes:** The module's own method turned into a theory and run on the module's own best examples: the formal/ordinary divergence table; the cooperative principle and the four maxims; the calculation of an implicature; the tests (cancellable, non-detachable, not part of what is said); conventional implicature as the contrast; and the verdict — the theory hands the logicians back their constants and takes Strawson's best examples away from him, which is where the programme ends and pragmatics begins. Plus the tool's present life (linguistics; language-model evaluation).
- **Hands off:** To putnam-twin-earth (what a competent speaker is obliged to know — the stereotype — as the next account of 'competence'), to gettier-problem (the analytic paper and its intuitions as 'what we would say'), to the Kripke module (semantics without ordinary-language policing).

Spine step: as for ryle-category-mistake ("… the method's own best tool, the theory of conversation, hands the logicians back their constants").

## APPLICATION spec (L16)

- **Artefact:** H. P. Grice, 'Logic and Conversation' (William James Lectures, Harvard 1967; published 1975): the opening divergence claim (the 'formalist' and 'informalist' camps; the devices $\neg$, $\wedge$, $\vee$, $\to$, $\forall$, $\exists$, $\iota$ and their vernacular counterparts); the cooperative principle; the maxims of Quantity, Quality, Relation, Manner; the worked implicatures (the reference letter — 'Mr X's command of English is excellent, and his attendance at tutorials has been regular'; 'there is a garage round the corner'; 'he is an Englishman; he is, therefore, brave' as conventional implicature); the features (cancellable, non-detachable, non-conventional, calculable, indeterminate). And the tool's working life: scalar implicature as a standard phenomenon in linguistics, and 'some/all' tests in the evaluation of language models.
- **Module results it uses:** Austin's force/content split (what is said vs what is done — the implicature is a third thing, what is *meant*); Strawson's sentence/use line (the implicature is what the use adds); Russell's 'the' (the uniqueness clause re-examined as presupposition or implicature); Ryle's method (find the use) applied as a theory.
- **Where the artefact departs from the idealisation:** (1) it is a theory with a principle and maxims — exactly what the ordinary-language method (Austin: 'fact is richer than diction'; Wittgenstein: no theses) refused to build; Williams's 'underestimated theory' answered by one of the method's own; (2) it sides with the logicians: the divergences between '$\vee$' and 'or' are not differences of *meaning* but of what is *implicated*, so Strawson's 'ordinary "some" is not $\exists$' loses its best cases and Russell's logic is vindicated for the connectives; (3) 'what is said' is nonetheless not fixed without the maxims in hard cases (the line between semantics and pragmatics moves), which the later literature contests; (4) in linguistics and in model evaluation the maxims are used as a *standard* a speaker should meet — a norm, where Grice offered a description of cooperative rationality.

## Sources to consult

- **Yablo comp2 prompt and s2_comp2** (research/texts/yablo-24251-assignments.txt lines 86–104, 573–670): the three-clause analysis of conversational implicature; the maxims; calculation uses conventional meaning + maxims + context + mutual knowledge; properties (cancellable, non-detachable, not part of what is said, the implicatum a disjunction of candidates); 'Englishman, therefore brave'; the student's analogy of finding the implicatum to proving a theorem known to be true.
- **Yablo paper 1 topic 3** (lines 55–66): Grice's (*) analysis of non-natural meaning (intend the hearer to believe $p$ by recognising the intention) — one paragraph, since it is the companion theory of meaning.
- **SEP Austin §2.1**: the Grice-style objection to the ordinary-language method ('words are our tools' answered by a theory of why ordinary use diverges); **§2.3**: Searle's systematisation.
- **Magee–Williams dialogue 7 pp. 144–148**: the shortcomings — underestimating theory (the beetle species), ahistorical, 'footling'; the legacy (responsibility to meanings; technique kept in its place).
- **Magee–Searle p. 189**: the two lines of development (truth-conditions vs use/intention), with Grice placed on the second.
- **Strawson brief** and **Russell 'On Denoting'** for the 'some'/'the' cases.
- **'Logic and Conversation' — NOT staged** (research/sources.yaml; 15 pp.); the reference letter, the garage and the Englishman are standard and must be verified; the writer stages the lecture before writing.

## Explanation plan

1. **The problem.** The divergence table: '$p \vee q$' true when both; 'or' heard as 'not both, and I don't know which'; '$\exists$' compatible with 'all'; 'some' heard as 'not all'; '$p \wedge q$' symmetric; 'and' heard as 'and then'; '$p \to q$' true whenever $p$ is false; 'if' heard as a connection. The informalists (the module's own strand) took this as proof that logic misdescribes English; the formalists as proof that English is defective. Sub-problem: is the divergence in the *words* or in something else that attaches to their use? Obvious attempt: ambiguity — 'or' has an exclusive and an inclusive sense, 'some' a 'not all' sense. Why it fails: 'some of the guests left — in fact all of them did' is not a contradiction and not a change of sense; the 'not all' can be *withdrawn* without withdrawing anything that was said. An ambiguity could not be cancelled that way.
2. **The answer: a theory of conversation.** The cooperative principle — make your contribution such as is required by the accepted purpose of the exchange — and the maxims: Quantity (as informative as required, not more), Quality (do not say what you believe false or lack evidence for), Relation (be relevant), Manner (be perspicuous: avoid obscurity, ambiguity; be brief and orderly). The because: a hearer who assumes the speaker is cooperating can infer, from what was said and the maxims, what the speaker must have meant; the inference is the implicature, and it belongs to the use, not the word.
3. **The calculation, worked.** 'Some of the guests left.' Quantity: had the speaker known all left, 'all' was required and available; the speaker is cooperative; so the speaker does not know, or knows it is false, that all left; so: not all (or: not known that all). Write the steps. Then 'or': the speaker who knew which disjunct held would have said it (Quantity), so 'I don't know which'; the exclusive reading as a further implicature where the disjuncts are known incompatible. Then 'and then': Manner (be orderly) — narrate in order, so the order of conjuncts implicates temporal order. Then 'if': Quantity again — one does not assert a conditional whose antecedent one knows false. The reference letter ('his command of English is excellent, and his attendance regular') flouts Quantity and implicates 'he is no good at philosophy'; 'there is a garage round the corner' implicates it is open (Relation).
4. **The tests.** Cancellable ('some left — in fact all did'); non-detachable (any way of saying the same thing carries the same implicature — unlike presupposition, which can be detached by rephrasing); not part of what is said (the truth-conditions are the logician's); calculable; and the contrast — conventional implicature: 'he is an Englishman; he is, therefore, brave' — 'therefore' conventionally implicates a connection without asserting it, and this is not cancellable. The because: these are the operational criteria that make 'implicature' a usable notion, and they are the tests a linguist still runs.
5. **What this does to the programme.** (a) The logician was right about the words: '$\vee$', '$\exists$', '$\wedge$', '$\to$' are the meanings; the rest is implicature — so the informalist's 'ordinary language differs from logic' is true of use and false of meaning. (b) Strawson's 'some' case and part of his 'the' case go to pragmatics: the uniqueness clause's oddity in 'the table is covered with books' can be a Quantity implicature (say as much as needed to identify, not more) rather than a defect in Russell. (c) A theory was built — principle, maxims, tests — by the method's own practitioner, which is Williams's point granted from inside: the distinctions were only interesting against a theory, and here is the theory. The programme ends not in refutation but in systematisation; what follows is called pragmatics.
6. **Verdict and the tool's present life.** Which module results the tool uses; where it departs (the four points of the spec); and where it runs today: scalar implicature as a textbook phenomenon (the 'some → not all' scale; 'warm → not hot'); the maxims as a standard in human–machine dialogue evaluation (does the system answer as informatively as required and no more?) — a norm, where Grice described cooperative rationality; and the open question — whether 'what is said' can be fixed without the maxims (the semantics/pragmatics boundary moves; named, not argued).

## Set pieces and worked examples to recreate

- **The divergence table** (formal device / ordinary counterpart / the felt difference) as the opening figure.
- **'Some of the guests left — in fact all of them did'** as the cancellability Example (and the Strawson FORWARD exercise's answer).
- **The reference letter** and **the garage round the corner** as flouting and Relation Examples.
- **'He is an Englishman; he is, therefore, brave'** as conventional implicature.
- **The calculation** of 'some → not all' as a numbered derivation — the lesson's one derivation, done in full.
- **Williams's beetle species** as the critique the theory answers.
- **A scalar implicature test item** (the kind used on language models: 'some of the cards are red' when all are) as the artefact's present life — one figure, no claims about any particular system.

## Pitfalls / subtleties to flag

- The lecture is not on disk; stage and verify the three standard examples and the exact wording of the maxims before writing.
- Keep implicature, presupposition and entailment apart with the three tests (cancellable? survives negation? survives rephrasing?); one table.
- Do not claim Grice 'refuted' Strawson: the lesson's verdict is a redistribution (semantics to Russell, phenomena to pragmatics); Strawson's presupposition survives for 'the' in part.
- Grice's (*) theory of meaning (intentions) is one paragraph, as the companion; not a second lesson.
- The language-model application is one figure and one paragraph; no benchmark numbers without a source on disk.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the divergence table**: four rows ($\vee$/or, $\exists$/some, $\wedge$/and, $\to$/if) × three columns (truth-table meaning; what is heard; the gap). Inspired by Grice's opening (standard).
2. `draw:` single `<Figure>` — **the cooperative principle and the four maxims**: one box with four labelled sub-boxes and one example sentence each. Inspired by 'Logic and Conversation'.
3. `draw:` `<FigureSequence>` (4 frames) — **calculating 'not all'**: frame 1 'some of the guests left' (said); frame 2 'all' was available and more informative; frame 3 the speaker is cooperative (Quantity); frame 4 so the speaker is not in a position to say 'all' — implicature: not all. One premise per frame. Inspired by Grice's calculation schema.
4. `draw:` single `<Figure>` — **three tests, three relations**: implicature / presupposition / entailment × cancellable / survives negation / survives rephrasing, with the verdicts. Inspired by the standard tests.
5. `draw:` single `<Figure>` — **the redistribution**: Russell's semantics on one side, Strawson's phenomena on the other, with arrows moving 'some', 'or', 'and then' to pragmatics and 'the' split between them. Inspired by the lesson's verdict.
6. `draw:` single `<Figure>` — **a scalar implicature test item**: 'some of the cards are red' over a row of all-red cards, with 'true?' and 'felicitous?' as two separate questions a system is asked. Inspired by the linguistics standard (no particular system named).
7. `source:` none.

## EXERCISE PLAN

1. (warm-up) Derive the implicature of 'it's warm out' (not hot), 'I tried to call you' (did not reach you), and 'the dog is somewhere in the house' (I don't know where), naming the maxim each uses.
2. (refute) "'Or' is ambiguous between inclusive and exclusive senses." Break it with cancellability: give the cancelling continuation for an 'or' sentence and show that an ambiguity could not be cancelled, then say what *is* exclusive in such cases (knowledge of incompatibility of the disjuncts) and where it lives.
3. (derivation) Derive 'and then' from Manner and show it is cancellable ('I fell and I was pushed — not in that order'); then explain why '$p \wedge q$' must still be symmetric for logic (commutativity) and why the implicature account preserves that.
4. (boundary probe) A speaker who is not cooperating — lying, or hostile. State which maxim the calculation of 'not all' assumes, show the implicature fails to arise, and say what this shows about implicature as a feature of rational cooperation rather than of the words.
5. (claim–evidence, cross-lesson) Strawson's 'the table is covered with books': treat the oddity of Russell's uniqueness clause as a Quantity implicature (say enough to identify, not more) and construct the case; then say what remains of Strawson's presupposition that the implicature account does not capture (the failed-reference case).
6. (FORWARD → putnam-twin-earth) Implicature assumes a competent speaker who knows what 'some' and 'all' mean. Say what the speaker must know about 'elm' for 'some of the trees are elms' to carry 'not all' — and whether he must be able to tell an elm from a beech. The solution says the next module asks exactly what a competent speaker is obliged to know (the stereotype), with a `<Ref>`.
7. (research-shaped) Design a six-item scalar implicature test (some/all, warm/hot, or/and, might/must) with the two questions 'true?' and 'would a cooperative speaker say it?' for each, and state what a respondent who answers only the first question has failed to show — and why Grice would say such a respondent may still *understand* the sentences.
