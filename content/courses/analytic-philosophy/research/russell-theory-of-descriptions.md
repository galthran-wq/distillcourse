# Research brief: russell-theory-of-descriptions (The theory of descriptions)

status: planned
module: logical-atomism
type: core
goal: Construct the logical form of a sentence containing a definite description and use it to explain informative identities, negative existentials and the two readings of a negated description.

## ARC (L10)

- **Inherits:** From frege-function-and-quantifier: quantifiers and second-level existence. From frege-sense-and-reference: the puzzles (informative identity, substitution) and Frege's answer (sense), plus Frege's conventional null reference for empty terms — the thing Russell calls artificial.
- **Contributes:** The method of the module and the tradition's model analysis: grammatical form misleads, logical form is recovered by analysis, 'the $F$' is a quantifier phrase, and scope explains what sense had explained. Ramsey's 'paradigm of philosophy'.
- **Hands off:** To logical-constructions-and-acquaintance (descriptions are the template for every 'logical fiction'; the acquaintance principle is this essay's closing paragraph), to descriptions-in-a-proof-checker (the application), to strawson-on-referring (the objection), to kripke-rigid-designation and kripke-against-descriptivism (names as disguised descriptions — the Apollo paragraph — and scope vs rigidity), and to gettier-problem (Case I's description).

Spine step: "Analysis as the method: a sentence's grammar can hide its logical form, 'the F' is a quantifier phrase and not a name, and whatever is known only by description can be rebuilt as a logical construction out of what is known by acquaintance."

## Sources to consult

- **Russell, 'On Denoting'** (research/texts/russell-on-denoting.txt) — read the whole essay; skip the Franco editorial intro (lines 1–118, secondary and partly wrong). Key paragraphs: the opening (three cases: denotes nothing / one / ambiguously; acquaintance vs knowledge about); 'My theory, briefly…' (the variable, 'always true' as primitive, everything/nothing/something); 'It remains to interpret phrases containing *the*' (the father of Charles II; uniqueness: 'if $y$ begat Charles II, $y$ is identical with $x$'); the Meinong paragraph (law of contradiction); the Frege paragraphs (Scott/Waverley; the King of France; the Tempest line; the conventional null class 'artificial'; the Gray's Elegy regress — OPTIONAL, starred); the three puzzles (George IV; excluded middle and the wig; the difference between A and B); the solutions (primary/secondary occurrence; the touchy yacht owner); non-entities (round square, Apollo, Hamlet — the seed of descriptivism); mathematical definitions ($m - n$); 'the usefulness of identity'; the acquaintance paragraph; the closing challenge; fn N14.
- **SEP 'Conceptions of Analysis' §3**: the formula $\exists x(Kx \wedge \forall y(Ky \to y = x) \wedge Bx)$; Ramsey's 'paradigm'; eliminativism's origin.
- **Beaney VSI Ch. 2**: the four 'is a philosopher' cases (I / my wife / the King of France / Pangloss) as an opening set piece; (K1)–(K5) staged unpacking; 'the description has no meaning in itself'.
- **Ayer LTL Ch. 3 pp. 49–51 and 1946 Introduction pp. 193–194**: the standard paraphrases and Ayer's own admitted error (Stebbing's objection; Russell's three-conjunct version; Moore on 'author' vs 'wrote') — a Pitfall to avoid, and an exercise.
- **Yablo 24.251 comp1 and s2_comp1**: the three-puzzle reconstruction task and the typical student error (treating Russell's method as general) — exercise shape and a claim to refute.
- **Kripke NN n. 3 (semantic vs speaker's reference) and Preface pp. 10–14**: forward only.

## Explanation plan

1. **The problem.** The four 'is a philosopher' sentences (Beaney): 'I am', 'my wife is', 'the present King of France is', 'Pangloss is'. The third has a grammatical subject and no king. Sub-problem 1: if the sentence is false, what is it false *of*? Obvious attempt (Meinong): the King of France subsists without existing, so the sentence is about him. Why it fails: the existent present King of France then both exists (by his description) and does not; the round square is round and not round — the law of contradiction (Russell's paragraph). Obvious attempt 2 (Frege): the phrase has a sense and no reference, and the sentence no truth-value; for a scientific language assign the null class by convention. Why it fails: the Tempest sentence ('if Ferdinand is not drowned, Ferdinand is my only son') is plainly meaningful and plainly false, not truth-valueless; and the null-class convention is 'artificial' — 'the King of France is bald' would come out false because the null class has no hair.
2. **The answer: the phrase is not a name.** Start from the quantifier phrases the reader already handles — 'a man', 'every man', 'no man' are not names and nobody thinks they are ('a man' in '$C$(a man)' = '$\exists x(Mx \wedge Cx)$'). Then 'the': 'the father of Charles II was executed' = someone begat Charles II, that person was executed, and if anyone begat Charles II he is that person. $\exists x(Fx \wedge \forall y(Fy \to y = x) \wedge Gx)$. The because: 'the' carries a uniqueness claim that 'a' does not, and uniqueness is a quantifier structure, so the whole phrase dissolves into quantifiers and the sentence keeps a truth-value whatever France has.
3. **Consequences, each as a problem solved.** (a) The King of France is bald: false, because the existence conjunct fails. (b) Negative existentials: 'the round square does not exist' = $\neg\exists x(Rx \wedge Sx \wedge \ldots)$, true, about nothing. (c) Informative identity: 'Scott is the author of Waverley' is not '$a = b$' but 'Scott wrote Waverley and no one else did' — informative without senses. (d) The 'incomplete symbol': the description has no meaning in isolation; only sentences containing it do — Frege's context principle, made a tool.
4. **Scope.** 'The King of France is not bald': $\exists x(Kx \wedge \ldots \wedge \neg Bx)$ false, $\neg\exists x(Kx \wedge \ldots \wedge Bx)$ true; excluded middle is saved because the two are not contradictories; 'Hegelians… will conclude he wears a wig'. George IV: 'wished to know whether Scott was the author of Waverley' — the description inside or outside 'wished'; substitution would yield 'whether Scott was Scott', and 'an interest in the law of identity can hardly be attributed to the first gentleman of Europe'. The yacht: 'I thought your yacht was larger than it is'. For this reader: scope is where the quantifier sits relative to $\neg$ or the attitude verb — immediate in notation, invisible in English.
5. **What it cost and bought.** Identity becomes useful ('no one outside a logic-book wishes to say $x = x$'); mathematical definitions by description ($m - n$ = 'the number which added to $n$ gives $m$', false in primary occurrence when no unique number); and the acquaintance principle: all understood propositions are built from acquainted constituents, so matter and other minds are known only by description — the next lesson's starting point.
6. **What came of it.** Ramsey 1931: 'that paradigm of philosophy'; the programme of eliminative analysis. What refuted or refined: Strawson 1950 (sentences vs uses; presupposition), Donnellan 1966, Kripke 1970 (the Apollo/Hamlet paragraph makes names abbreviated descriptions — the view Gödel/Schmidt kills) — one paragraph each, stated as forward seams.

## Set pieces and worked examples to recreate

- **The four 'is a philosopher' cases** (Beaney Ch. 2) as the opening Example.
- **The father of Charles II** in Russell's plain English, then in notation — the lesson's worked Example 1 (uniqueness clause shown in words first).
- **(K1)–(K5)** (Beaney): the staged unpacking of 'the King of France is a philosopher' as a `<FigureSequence>`.
- **The wig** and **the touchy yacht owner** as scope examples; **George IV** as the attitude case.
- **The Tempest line** as the refutation of Frege's gap.
- **$m - n$** as the mathematical dividend.
- **The closing challenge** ('until he has attempted to construct a theory of his own') as a `<Quote>` ending the core narrative.
- **The Gray's Elegy regress** only as a `## ★` starred section, flagged as contested.

## Pitfalls / subtleties to flag

- Russell's 'denotation' is technical and not Mill's; his 'meaning' is Frege's sense. Say so once.
- Ayer's 1936 paraphrase 'one person, and one person only, wrote Waverley, and that person was Scotch' is the standard *mis*statement (Stebbing, Moore); use Russell's three-conjunct form and note the trap in an exercise, never as the lesson's own paraphrase.
- Russell's methodological credo about stocking the mind with puzzles is a `<Quote>` aside at most: the human brief says lessons are not built around puzzles; here the puzzles are *tests* of a theory already stated, and the lesson's order follows Russell's (theory first).
- Do not claim the essay contains the referential/attributive distinction (Franco's intro does; the essay does not).
- 'Primary/secondary occurrence' = scope; teach it in notation and keep Russell's terms as labels.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **four subjects, one predicate**: 'I / my wife / the King of France / Pangloss' + 'is a philosopher', with the reference arrow of each subject: two land on a person, one on nothing (dashed), one on a fiction. Inspired by Beaney Ch. 2.
2. `draw:` `<FigureSequence>` (5 frames) — **unpacking 'the King of France is bald'** (K1)–(K5): the sentence, then the existence conjunct, the uniqueness conjunct, the predicate conjunct, the formula. One clause added per frame. Inspired by Beaney (K1)–(K5).
3. `draw:` single `<Figure>` — **surface grammar vs logical form**: 'Scott is a man' (name + predicate) beside 'the author of Waverley is a man' (quantifier structure, no subject term); the grammatical 'subject' slot shown empty on the right. Inspired by SEP conceptions §3.
4. `draw:` single `<Figure>` — **two scopes of 'not'**: the two formulas for 'the King of France is not bald' side by side with the $\neg$ placed inside / outside, truth-values F / T, and the 'wig' caption. Inspired by Russell's puzzle (2).
5. `draw:` single `<Figure>` — **George IV and the attitude verb**: 'wished to know whether [ … ]' with the description drawn inside the bracket (de dicto, sensible) and outside it (de re, 'whether Scott was Scott'). Inspired by Russell's puzzle (1).
6. `draw:` single `<Figure>` — **three theories, one empty phrase**: a 3-row table — Meinong (subsistent object; contradiction), Frege (sense, no reference; null class by convention), Russell (quantifier structure; false) — with the Tempest sentence as the test column. Inspired by Russell's Frege/Meinong sections.
7. `source:` none.

## EXERCISE PLAN

1. (warm-up) Render 'the smallest prime is even' and 'the largest prime is odd' in Russell's form and give each its truth-value with the conjunct that decides it.
2. (refute) "The theory of descriptions is a general method: any sentence can be rewritten so that it refers only to things that exist." Break it (the Yablo student error): state what the theory analyses (phrases of the form 'the $F$'), what it does not (names, general terms), and where Russell himself extends it only by stipulation (Apollo as 'the sun-god').
3. (derivation) Show that 'the $F$ is $G$' and 'the $F$ is not $G$' (narrow scope) are contraries, not contradictories, and that excluded middle holds for the pair 'the $F$ is $G$' / 'it is not the case that the $F$ is $G$'. Then write the yacht owner's two readings.
4. (boundary probe) Apply the analysis to 'the author of Principia Mathematica was English' (two authors). Which conjunct fails, what is the truth-value, and what does the result say about 'the' in ordinary speech where a hearer would simply ask 'which one?' — the seam Strawson will press.
5. (claim–evidence, cross-lesson) Ayer's 1936 paraphrase 'one person and one only wrote Waverley, and that person was Scotch' was corrected by Stebbing. State what the paraphrase omits relative to Russell's three conjuncts and construct a situation in which the two come apart.
6. (FORWARD → logical-constructions-and-acquaintance) Take 'the centre of mass of the solar system at the first instant of the twentieth century' (Russell's own example). Say what, on the acquaintance principle, you can be acquainted with in it and what you cannot, and write the sentence 'that point is in empty space' in Russell's form. The solution says the next lesson generalises this to matter itself, with a `<Ref>`.
7. (research-shaped) Russell's $m - n$: write the contextual definition and determine the truth-value of '$3 - 5 = 2$ or $3 - 5 \neq 2$' in the natural numbers under primary and under secondary occurrence; state which convention a calculator that returns 0 for $3 - 5$ is using (the doorstep of descriptions-in-a-proof-checker).
