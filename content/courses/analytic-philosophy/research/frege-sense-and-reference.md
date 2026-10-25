# Research brief: frege-sense-and-reference (Sense and reference)

status: planned
module: frege
type: core
goal: Explain the distinction between sense and reference and use it to account for informative identities and for the failure of substitution in belief reports.

## ARC (L10)

- **Inherits:** From frege-function-and-quantifier: names stand for objects, predicates for concepts, sentences name truth-values; compositionality of reference is already implicit in the function–argument picture.
- **Contributes:** The tradition's first theory of meaning. Two puzzles (informative identity; substitution in belief contexts) that a pure standing-for theory cannot solve; sense as mode of presentation; sense and reference assigned to every expression, composing in parallel; indirect reference as the type-shift that saves substitution.
- **Hands off:** To russell-theory-of-descriptions (Russell rejects the distinction and offers a different account of the same puzzles), to two-dogmas-analyticity (Quine's 'meaning is not reference' is this lesson's distinction with the senses thrown away), to kripke-against-descriptivism (the description theory of names is what Frege's 'sense of a name' became), and to putnam-twin-earth (Frege's anti-psychologism — senses are not ideas — is assumption (I) Putnam attacks).

Spine step: as for frege-function-and-quantifier.

## Sources to consult

- **SEP Frege §3 (intro), §3.1.1–3.1.2, §3.2** (research/texts/sep_frege.txt): the context principle vs compositionality tension (one paragraph); puzzle of identity with $117 + 136 = 253$, morning/evening star, Twain/Clemens; the attitude-report puzzle with the valid Twain argument beside the invalid 'John believes' version, John having learned 'Mark Twain' from Huckleberry Finn and 'Samuel Clemens' from a survey; sense = way of conceiving; $4$ vs $8/2$; senses without reference (Pegasus); sentence denotes a truth-value, expresses a thought; the 'John loves Mary' tree of $d[\cdot]$ and $s[\cdot]$; indirect reference. §3.3 (Bobzien's Stoic thesis) is OPTIONAL — a `## ★` aside at most.
- **Beaney VSI Ch. 3 'Sense and reference'** and Fig. 3 (Hesperus/Phosphorus); Box 3 (paradox of analysis) and 'informative by being transformative' — one paragraph here, developed in moore-common-sense (extra).
- **Russell 'On Denoting'** (research/texts/russell-on-denoting.txt), the Frege section and fn N8–N9: Russell's terms 'meaning/denotation' for Sinn/Bedeutung; Frege's conventional null denotation that Russell calls artificial — the FORWARD seam.
- **Kripke NN Lecture I pp. 57–60 and n. 22**: Frege's 'sense' conflates meaning-giving with reference-fixing; in modal semantics the sense of a rigid term is a constant function — one forward clause only.

## Explanation plan

1. **The problem.** Two true identity sentences about one planet; one is a discovery, one is trivial. Obvious attempt: identity is a relation between *names* — '$a = b$' says that 'a' and 'b' name the same thing. Why it fails: then the astronomical discovery would be a fact about language, and the knowledge that Hesperus is Phosphorus would be knowledge about the words 'Hesperus' and 'Phosphorus', which it plainly is not (Frege's own 1879 view and his reason for abandoning it).
2. **Second puzzle, same cause.** The Twain/Clemens substitution argument, valid in 'was an author', invalid under 'John believes'. If names only stand for objects, Leibniz's law is violated. Obvious attempt: belief contexts are exceptions to substitution. Why it fails as an explanation: 'exception' names the problem, it does not say what the belief is about if not the object.
3. **The answer.** A name has a reference (the object) and a sense (the way the object is given — the mode of presentation). The senses of 'Hesperus' (the evening star) and 'Phosphorus' (the morning star) differ; the references coincide; the identity is informative because grasping both senses does not reveal the coincidence. The because: cognitive value must attach to something that differs between the two names and is not the object — and the only candidate that is objective (not a private image; Frege's anti-psychologism, in one paragraph) is the mode of presentation.
4. **Extend to every expression** — why the distinction cannot stop at names: a predicate has a sense and refers to a concept; a sentence expresses a thought (its sense) and refers to its truth-value. The argument for the last: substitute a co-referring name in a sentence — the thought changes, something stays — and what stays is the truth-value (the 'what remains invariant' argument). The 'John loves Mary' tree, two layers.
5. **Indirect reference saves substitution.** In 'John believes that Twain was an author', the name refers to its ordinary sense. Then the two belief sentences have different references for their embedded names, and Leibniz's law was never broken. The mathematician will see a type-shift; say so. The price: senses of senses in nested contexts (one clause).
6. **Why it mattered / what came of it.** Three consequences the course follows: (a) Russell will reject sense and replace it with scope and acquaintance (next module); (b) the description theory of names grows out of 'the sense of a name is a description', and Kripke kills it in 1970; (c) 'meaning is not reference' is the one part Quine keeps. The paradox of analysis (Beaney Box 3) gets one paragraph as a dividend: an analysis can be correct and informative because sense ≠ reference.

## Set pieces and worked examples to recreate

- **Hesperus/Phosphorus** (Beaney Fig. 3): the lesson's running example; the discovery dated (Babylonian, via Pythagoras — do not overstate).
- **$117 + 136 = 253$ and $4 = 8/2$** (SEP §3.1.1, §3.2): the arithmetic cases, for this reader.
- **Twain/Clemens** as a two-column argument (valid / invalid), with John's two sources of the names (SEP §3.1.2).
- **The 'John loves Mary' two-layer tree** (SEP §3.2): denotations compose to a truth-value, senses compose to a thought; 'two truth-values but infinitely many thoughts'.
- **Pegasus / 'the least rapidly convergent series'**: sense without reference, and Frege's demand that a scientific language assign a reference by convention — the seam Russell will attack.
- **The paradox of analysis** (Beaney Box 3) in one Remark.

## Pitfalls / subtleties to flag

- 'Sense' is not 'connotation', 'idea', or 'the description the speaker has in mind' — the last is the descriptivist reading that Kripke attacks; present Frege's sense as objective and leave the question of how it is fixed open (one sentence that Frege's own footnote allows different senses of 'Aristotle' to different speakers).
- Keep 'Bedeutung' translated as 'reference' throughout; note once that Russell's 'denotation' and older translations' 'meaning' are the same word.
- Sentences naming truth-values: present as Frege's uniformity, flag that the Tractatus (4.063, 4.431) and almost everyone after rejects it — do not defend it.
- The Stoic-borrowing controversy (SEP §3.3) is seductive detail: starred aside or nothing.
- No 'Frege's puzzle' as a puzzle-lesson: the puzzles are the problem statement, the theory is the lesson.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **one planet, two routes**: Venus at the centre, 'Hesperus' with an evening-sky mode of presentation on one side, 'Phosphorus' with a morning-sky one on the other, both arrows landing on the same object; the sense arrows labelled, the reference arrows labelled. Inspired by Beaney Fig. 3 (recreated as a diagram, not the painting).
2. `draw:` single `<Figure>` — **the two Twain arguments side by side**: valid left, invalid right, the one changed phrase ('believes that') highlighted; a tally 'substitution holds / fails'. Inspired by SEP §3.1.2.
3. `draw:` single `<Figure>` — **the two-layer composition tree for 'John loves Mary'**: denotation layer below (objects → concept → truth-value), sense layer above (senses → thought), 'expresses' and 'refers to' arrows between layers. Inspired by SEP §3.2.
4. `draw:` `<FigureSequence>` (3 frames) — **indirect reference as a shift**: frame 1 'Twain' refers to the man; frame 2 'believes that' box drawn around the embedded sentence; frame 3 the reference arrow of 'Twain' re-routed to its ordinary sense, with the substitution now blocked because the two senses differ. Inspired by SEP §3.2.
5. `draw:` single `<Figure>` — **sense without reference**: 'Pegasus', 'the least rapidly convergent series', 'the King of France' each with a sense bubble and a dashed, empty reference target; the caption names this as the case Russell takes up. Inspired by SEP §3.2 and Russell's Frege section.
6. `source:` none.

## EXERCISE PLAN

1. (warm-up) Assign sense and reference to each part of '$8/2 = 4$' and say which component makes the sentence informative to a child and trivial to a calculator.
2. (refute) "Sense is just the mental image a speaker associates with a name." Break it: give Frege's reason that two speakers with different images can grasp the same sense (communication, the objectivity of thoughts), and state what goes wrong for mathematics if senses were images.
3. (derivation) Reconstruct the argument that a sentence's reference is its truth-value: start from compositionality and the substitution of 'Hesperus' by 'Phosphorus' in 'Hesperus is a planet', identify what changes and what stays, and show that only the truth-value fits the role.
4. (boundary probe) 'The King of France is bald' has sense and, on Frege's view, no truth-value. State what the composition tree does at the missing node, what Frege proposed for a scientific language (the conventional null reference), and what a logician loses if a sentence may lack a truth-value.
5. (claim to break, cross-lesson) Using the previous lesson's levels, explain why 'the concept *horse* is not a concept' is, on Frege's own view, a problem: 'the concept horse' is a saturated expression and so names an object. State the problem in two sentences; do not solve it.
6. (FORWARD → russell-theory-of-descriptions) Take the sentence 'the author of Waverley is Scott' and try to explain its informativeness by sense alone; then ask what the *sense* of 'the author of Waverley' is if it is not a description of a way the man is given. The solution says the next lesson replaces the sense of a description by a quantifier structure, with a `<Ref>`.
7. (research-shaped) The SEP entry lists the morning star, Twain/Clemens and $117+136$ as Frege's own examples; find, in the Hesperus case, the actual historical identification (which civilisation, roughly when) and say what the discovery consisted in — observations, not word-study — to make Frege's point about the 1879 view concrete.
