# Research brief: frege-logicism (Logicism: number as a property of concepts)

status: planned
module: frege
type: core
goal: Explain Frege's claim that arithmetic is logic by deriving the definition of number from statements of the form 'there are $n$ $F$s', and state what Russell's 1902 letter did and did not destroy.

## ARC (L10)

- **Inherits:** From frege-function-and-quantifier: concepts as functions to truth-values, second-level concepts, and the FORWARD exercise's formula for 'exactly two $F$s'.
- **Contributes:** The first grand programme of the tradition and its first refutation: number as a property of concepts, Hume's principle, the definitions of 0, successor and 'natural number' (the ancestral), the philosophical point (against Kant: arithmetic without intuition), Basic Law V and the letter of 16 June 1902, and the surviving theorem.
- **Hands off:** To logical-constructions-and-acquaintance (Russell's types and 'classes as logical fictions' are the responses to what this lesson's paradox section describes), to a-priori-as-analytic (Vienna takes 'arithmetic is analytic' from here without needing logicism to succeed — Ayer says so), and to rule-following (the ancestral and '$y = x^2$ determines $y$' return as the question of what a definition settles).

Spine step: as for frege-function-and-quantifier.

## Sources to consult

- **SEP Frege §2.5** (research/texts/sep_frege.txt): the army/divisions/regiments passage (Grundlagen §46); 'exactly $n$' defined without circularity; the 'two authors of Principia Mathematica' example; equinumerosity; $\#F$ as the extension of 'equinumerous with $F$'; $0 = \#[\lambda x.\, x \neq x]$. §2.6: the ancestral (Begriffsschrift §26, Prop. 76), Precedes, $\mathrm{Number}(x)$, Hume's principle, Frege's theorem (Wright, Heck, Boolos). §2.3.2: definitions must be eliminable and conservative; against creative definitions. §2.4: Basic Law V, Russell's paradox in Frege's vocabulary, the collapse. §2.7.1: vs Kant — Bolzano and the intermediate value theorem, the Dirichlet function. §1: Russell's letter dated 16 June 1902.
- **Beaney VSI Ch. 1**: the study and the removals company ('how many things?'), 1 book = 150 pages = 38,000 words; the construction $0 = \{x : x\neq x\}$, $1 = \{x : x = 0\}$, $2 = \{x: x=0 \vee x=1\}$ (Beaney's simplified version — note it is not Frege's own definition, which is classes of equinumerous classes). Box 2 (Russell's paradox) and Ch. 2 'Responding to Russell's paradox': Frege's ad hoc exclusion vs Russell's types; the letter arriving while vol. 2 was in press.
- **Ayer LTL Ch. 4 pp. 75–77** (research/texts/languagetrut-s2-ch04-06.txt): 'logicism's fate does not matter for analyticity' — the forward pointer for Vienna.
- **Raven syllabus**: Grundlagen Introduction, §§1–4, 62–69 are the canonical short reading; the brief points the writer there once the Frege Reader is staged.

## Explanation plan

1. **The problem.** 'How many?' has no answer until a concept is supplied (the desk; the army). So a number statement attributes something to a concept. Sub-problem: which something? Obvious attempt: 'the number of $F$s is 2' says the concept $F$ has the property 'two'. This is right but circular as a definition — 'two' appears on both sides.
2. **'Exactly two' without the numeral.** Write $\exists x\exists y\,(x\neq y \wedge Fx \wedge Fy \wedge \forall z(Fz \to z = x \vee z = y))$ — the reader did this as the previous lesson's forward exercise. So 'there are exactly $n$ $F$s' is definable in pure logic for each $n$. Why this does not yet define *the number 2*: it defines a second-level concept for each numeral separately, and arithmetic needs numbers as objects to add and compare.
3. **Numbers as objects: equinumerosity.** When do two concepts have the same number? When there is a one-one correspondence (the waiter who lays one knife per plate without counting — Grundlagen §70, via SEP). Hume's principle: $\#F = \#G \leftrightarrow F \approx G$. The reader knows this as cardinality; the news is that it was stated in 1884 as a *definition* strategy and that the right-hand side is pure second-order logic.
4. **Getting the first number and the next.** $0 = \#[x \neq x]$ because nothing fails to be self-identical. $1 = \#[x = 0]$. Successor: $n$ precedes $m$ iff there is a concept $F$ and an object $a$ falling under it such that $m = \#F$ and $n = \#[Fx \wedge x\neq a]$ — the 'author of Principia other than Whitehead' example. Why these and not a list: a definition must be eliminable and conservative (SEP §2.3.2), so each numeral must be definable from the previous ones, not posited.
5. **'Natural number' via the ancestral.** Stating 'the numbers are 0, 1, 2, …' uses 'and so on'; Frege's ancestral replaces it: $x$ is a natural number iff $x = 0$ or $x$ follows 0 in the successor series, where 'follows in the series' is defined by hereditary properties (the father-of example). The reader knows this as transitive closure in second-order logic; the point is that 'and so on' is eliminated.
6. **What this was for.** Kant: $7 + 5 = 12$ is synthetic a priori, resting on intuition of time. If the definitions above are logic and the Peano axioms follow from them, arithmetic is analytic. Bolzano on the intermediate value theorem (drawing the graph is an appeal to intuition; the Dirichlet function shows intuition's limits) is the mathematician's motivation.
7. **The event of 1902.** To get numbers as objects Frege needed extensions, governed by Basic Law V. Russell's letter (16 June 1902): the concept 'extension that is not a member of itself'. Frege's reply and the appendix to vol. 2, already in press. State the contradiction in three lines and move on — it is the event, not the subject.
8. **What survived.** Frege's theorem: in second-order logic, Hume's principle alone yields the Peano axioms; Basic Law V was used only to prove Hume's principle. So the mathematics stood; what fell was the claim that Hume's principle is *logic*. One paragraph on why philosophers still argue about that (neo-logicism), then stop.

## Set pieces and worked examples to recreate

- **The study and the removals company** (Beaney Ch. 1): one book, 150 pages, 38,000 words — the opening example.
- **The army** (Grundlagen §46 via SEP §2.5): one army, three divisions, nine regiments.
- **'Exactly two' in pure logic**, then 'exactly three', and the general pattern (the lesson's Example 1).
- **The waiter and the plates** (Grundlagen §70): one-one correspondence without counting.
- **$0$, $1$, $2$ built in Beaney's simplified style** as a figure, with the note that Frege's actual definition is via equinumerosity classes.
- **The father-of series and the ancestral** (SEP §2.6).
- **The letter**: quote the two sentences of Russell's letter that state the paradox (SEP §2.4 / Beaney Box 2) and Frege's one-sentence reaction ('arithmetic totters') — a `<Quote>` carries its own attribution.
- **Frege's theorem as a dependency diagram**: HP ⟹ Peano; BLV ⟹ HP; BLV ⟂ (inconsistent).

## Pitfalls / subtleties to flag

- The brief is explicit: this is a philosophy lesson about a claim (arithmetic is analytic), not a cardinality lesson. The reader has Cantor; do not re-teach countability. Beaney's Ch. 1 infinity material is cut.
- Beaney's $2 = \{x : x = 0 \vee x = 1\}$ is a von Neumann-style simplification, not Frege; say so or use Frege's own.
- 'Second-order' is introduced here (quantifying over concepts) and distinguished from 'second-level' from the previous lesson.
- Do not organise the lesson around the paradox (human brief); one section, dated, with the dependency diagram showing why it mattered and what it left standing.
- 'Analytic' is used here in Frege's sense (provable from logic plus definitions); Kant's and Ayer's senses arrive in a-priori-as-analytic, with a `<Ref>` back.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **one desk, three counts**: the same desk with 'book' / 'page' / 'word' concepts overlaid and the count beside each. Inspired by Beaney Ch. 1.
2. `draw:` `<FigureSequence>` (3 frames) — **'exactly $n$ $F$s' without numerals**: $n = 0$, $1$, $2$ formulas appearing one at a time beneath a row of dots under the concept $F$, the quantifier structure growing by one clause per frame. Inspired by SEP §2.5's conditions table.
3. `draw:` single `<Figure>` — **one-one correspondence**: plates and knives with a bijection drawn; '$\#F = \#G$' written once as the thing the bijection licenses. Inspired by Grundlagen §70.
4. `draw:` `<FigureSequence>` (4 frames) — **building 0, 1, 2 and successor**: frame 1 the empty concept $x \neq x$ and $0$; frame 2 the concept $x = 0$ with one object and $1$; frame 3 $x = 0 \vee x = 1$ and $2$; frame 4 the general successor step with the 'other than $a$' clause. Inspired by Beaney Ch. 1 and SEP §2.5–2.6.
5. `draw:` single `<Figure>` — **the ancestral**: a chain $a \to b \to c \to d$ under father-of, with 'hereditary property' shown as a shaded region that, once it contains the successors of $a$, must contain $d$. Inspired by SEP §2.6.
6. `draw:` single `<Figure>` — **what fell and what stood**: a dependency diagram — Basic Law V (struck through, warning colour) ⟹ Hume's principle ⟹ Peano axioms; a dashed box 'is HP logic?' left open. Inspired by SEP §2.6's statement of Frege's theorem.
7. `source:` none. (A scan of Russell's 1902 letter would pass the visible-not-legible test only in pairs; not in the pool.)

## EXERCISE PLAN

1. (warm-up) Write 'there are exactly three $F$s' in pure logic and count the quantifiers; state the general pattern for $n$.
2. (derivation) From Hume's principle and the definition of $0$, prove that $\#[x \neq x] = \#[x \neq x \wedge x = x]$ and that no concept with an instance has number $0$.
3. (boundary probe) Apply the definition of 'precedes' to $0$: find the concept and object that make $0$ precede $1$, and explain why no concept makes anything precede $0$ — where exactly the definition's clause rules it out.
4. (refute) "Russell's paradox shows that Frege's definitions of the numbers are wrong." Break it: name the one axiom the paradox hits, state what Frege's theorem shows survives, and say what the paradox *did* refute (the claim that extensions are logical objects).
5. (research-shaped) The ancestral replaces 'and so on'. Take the Peano induction axiom as the reader knows it and show which of Frege's definitions it is a consequence of; state in one sentence why this is the step Kant said needed intuition.
6. (FORWARD → a-priori-as-analytic) Suppose logicism had succeeded. Would '$7+5=12$' then be true in virtue of the meanings of its symbols, or in virtue of a fact about concepts? Argue both sides in a paragraph; the solution says the Vienna Circle took the first answer without waiting for logicism, with a `<Ref>` to a-priori-as-analytic.
7. (claim–evidence) Frege dated Russell's letter 16 June 1902 and vol. 2 of the Grundgesetze appeared in 1903 with an appendix. From these two dates and the lesson's account of the appendix, state what Frege could and could not have changed, and what he actually tried.
