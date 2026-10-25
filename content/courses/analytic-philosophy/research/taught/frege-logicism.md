# Taught: frege-logicism

## Problem
Can the number words be defined from logic alone, with no numeral and no 'and so on' smuggled in, so that arithmetic is analytic and needs no intuition (against Kant)? Answer: yes, given Hume's principle and second-order logic (number as a property of a concept → #F as object → 0, successor, ancestral, Nat, induction as theorem, Peano axioms); the 1884/1893 route got Hume's principle from extensions via Basic Law V, which the letter of 16 June 1902 showed inconsistent. What fell: extensions as logical objects / the claim that arithmetic was derived from pure logic. What stood: Peano axioms from Hume's principle in second-order logic. Open: is Hume's principle logic?

## Explained
- Kant's two distinctions, first introduced here: analytic (predicate contained in subject concept; 'married' in 'husband') / synthetic; a priori (knowable without experience) / a posteriori; 7+5=12 as synthetic a priori, resting on counting-on in the intuition of time — intro paragraphs
- Why doubt it: no intuition of 37,863 fingers, yet 135,664 + 37,863 = 173,527 is certain because provable — intro
- Logicism defined: every truth of arithmetic provable from laws of logic and definitions; test = definitions with only quantifiers, connectives, identity, concept variables — intro
- Number statements are about concepts: desk (1 book/150 pages/38,000 words), four companies / 500 men, 'Venus has 0 moons' (Quote §46), King's carriage four horses; number statement = first-level concept falls within second-level concept — "A statement of number is about a concept"
- 'Exactly n' in pure logic for n = 0, 1, 2 (formulas displayed); recursive form: exactly n+1 ⇔ ∃a(Fa ∧ exactly n under [Fx ∧ x≠a]) ('remove-one-object step') — "'Exactly n' without the numeral n"
- Why that is not a definition of number: no number-object to quantify over (∀n), no identity between numbers; so need #F as object and a criterion of identity — ### Why this does not yet define the number two
- Waiter: knives and plates paired by 'immediately to the right of' (paraphrase of §70); equinumerous F ≈ G (Definition: ∃R, four clauses); link to Cantor's 'same cardinality'; Hume's principle #F = #G ↔ F ≈ G (boxed as a Remark: a principle, not a definition — no expression replaces '#F'), Hume 1739 remark quoted inline — "The same number without counting"
- Second-order (variables over concepts/relations) vs previous lesson's second-level (what a function takes as argument); concept-script second-order from 1879 — same section
- The England problem: HP doesn't say whether #F = England; 1884 fix: #F := extension of 'equinumerous with F'; extension = class of objects falling under a concept; in four steps: (1) levels problem — 'equinumerous with F' is second-level, has no extension in the class-of-objects sense; (2) every concept given an extension that is an object, so concepts equinumerous with F are swapped for their extensions; (3) first-level concept '( ) is the extension of some concept equinumerous with F', whose extension is #F; (4) the assumption stated outright: every concept has an extension and that extension is an object (flagged as what the 1902 section turns on); HP proved from it via ≈ equivalence relation (so HP is a theorem there, not a starting point) — ### What Hume's principle cannot decide
- Why not posit 0 and successors: definitions must be eliminable and conservative; positing existence adds a (possibly synthetic) premise — "Zero, the successor and one" intro
- 0 = #[x ≠ x] (logic proves it empty; 'moon of Venus' only astronomically); all empty concepts have number 0 via the empty relation (the four ≈ clauses range over all objects and hold vacuously: no object satisfies their antecedents); P(m,n) definition (Fa clause); 1 = #[x = 0]; Example: P(0,1); 2 = #[x=0 ∨ x=1], 3 likewise; 4-frame sequence `numbers`; in-body Exercise 1: P(1,2) with lemma 0 ≠ 1 — ### Zero and the successor / ### One, two and the construction continued
- Ancestral: father-of chain a→b→c→d, hereditary property (descendant of Charlemagne yes, left-handed no), Definition R*(a,b) via ∀F; = transitive closure without iteration; discovering vs being the case (§80 paraphrase) — ### Ancestors without running through the line
- Nat(n) ↔ n = 0 ∨ P*(0,n); Theorem with proof: induction from the definition; Quote §80 ('reduce the argument from n to (n+1) … to the general laws of logic'); KeyFact: induction a theorem, logic only if second-order logic is — ### The natural numbers, and induction as a theorem
- Table: five Peano axioms in Nat/P vocabulary and their sources; 'every number has a successor' via concept 'natural number up to and including n', needs 'no natural number follows itself' (by induction); sketched 1884, carried out 1893 — ### From the definitions to the Peano axioms
- Bolzano 1817 IVT from limit-definition of continuity, vs drawing the graph; Weierstrass 1872 (Berlin Academy) continuous, nowhere-differentiable function: continuous yet undrawable, so a picture-proof of IVT leaves a gap — "What the definitions were for"
- 1884 sharpened 'analytic': a question of justification; proof back to first premises: only logic + definitions ⇒ analytic; special science ⇒ synthetic; facts about particular objects ⇒ a posteriori; Kant's 'analytic = empty' objection answered: fruitful definitions; Quote §88 'plants in their seeds, not beams in a house'; gapless proof as why the concept-script existed — ### Analytic, in a sharpened sense
- Basic Law V (boxed as a Remark: a law/axiom of the treatise, not a definition — not eliminable, asserts every concept has an extension; prose 'a law of logic for extensions'): ext(F)=ext(G) ↔ ∀x(Fx↔Gx); membership a ∈ ext(F) iff Fa — "The 1902 letter"
- The letter (Quote, Russell to Frege 16 June 1902, trans. Woodward: predicate w / class of classes not belonging to themselves); 3-line derivation with W = 'extension of some concept it does not fall under', w = ext(W) (after the letter's 'w'), BLV used once left-to-right; Cantor diagnosis: BLV demands an injection from subsets of the domain into the domain — ### The letter
- Reply (Quote, Frege to Russell 22 June 1902: 'greatest surprise… consternation… Rule V… is false'); lead-in glosses 'courses-of-values' = extensions, 'Grundgesetze' = the treatise's German title, 'Rule V' = Basic Law V; 1903 appendix weakened BLV ad hoc, found inadequate, programme abandoned; died 1925 — ### The reply and the appendix
- Theorem (unnamed in body): second-order logic + HP + definitions ⊢ Peano axioms; BLV not needed; HP consistent (model in the naturals); noticed 1960s, worked out 1980s–90s; dependency figure what-stood.svg (key_image) — "What fell and what stood"
- Is HP logic? for: explains 'the number of' like direction/parallel; against: implies infinitely many objects; comprehension principle ∃F∀x(Fx ↔ φ(x)) (φ not mentioning F) written out, used by the successor step and the paradox, an existence claim of the same kind as BLV (logic supplies an entity for whatever can be written), consistent by itself but an existence claim; 'neo-logicism' named once; survivors: ancestral = transitive closure, eliminable+conservative standard — ### What logicism now turns on

## Notation
- #F 'the number of F'; #[φ(x)] number of the concept 'φ( )'
- F ≈ G equinumerous (witnessing relation R)
- 0 = #[x ≠ x]; 1 = #[x = 0]; 2 = #[x = 0 ∨ x = 1]
- P(m, n) 'm immediately precedes n' ⇔ ∃F∃a(Fa ∧ n = #F ∧ m = #[Fx ∧ x ≠ a])
- R*(a, b) 'b follows a in the R-series' (ancestral); P* = 'less than'
- Nat(n) ⇔ n = 0 ∨ P*(0, n)
- ext(F) extension of F; W = 'extension of some concept it does not fall under' (paradox concept), w = ext(W); R is reserved for relations (witness of ≈, the relation in R*)
- Comprehension: ∃F∀x(Fx ↔ φ(x))
- Names in body: Kant (Critique of Pure Reason 1781), Hume (1739), Bolzano (1817, Prague), Weierstrass (1872, Berlin Academy), Cantor, Charlemagne. The Jena mathematician and the English logician are NEVER named in body (source-in-prose: Frege, Russell, Whitehead are in sources.yaml); they appear only in Quote source labels. 'Frege's theorem' / 'Russell's paradox' named only in References. Books referred to as 'the 1884 book', 'the 1893 treatise' / 'two-volume treatise of 1893 and 1903'.

## Running cases
- Desk: 1 book / 150 pages / 38,000 words (figure desk-counts.svg)
- Four companies / 500 men; Venus has 0 moons; King's carriage four horses; 'the number of Jupiter's moons is four' (dated: the moons known in 1884)
- 135,664 + 37,863 = 173,527 vs 7 + 5 = 12
- Waiter, plates and knives (knives-plates.svg)
- England vs the number of moons of Venus (the identity problem HP leaves open)
- Father-of chain a, b, c, d (ancestral.svg)
- Keeper facts: 0 = #[x≠x]; HP ⟹ Peano in second-order logic, BLV used only for HP; letter dated 16 June 1902 (reply 22 June, vol. 2 1903 with appendix)
- Exercises: exactly three (quantifier count n+1, n(n−1)/2 distinctness clauses); ≈ equivalence relation (identity, converse, composite); nothing precedes 0 / role of Fa; transitivity of R* (P*(10,12) but not P(10,12)); refute 'definitions refuted'; 3-object domain: 8 concepts vs 3 objects (BLV fails), 4 sizes vs 3 objects (HP fails) ⇒ HP needs an infinite domain; levels classification of 'exactly two', #, Nat, ≈ (# = second-level function, not a concept); forward: 7+5=12 true by meaning or by fact

## Assumed
- frege-function-and-quantifier: concept = function to truth-values, object/concept, first/second-level concepts, falls under/within, levels figure, 'exactly two Fs' formula (its last exercise), 'the capital of ( )' near miss, existence as second-level, gapless rules (EG etc.)
- Course prerequisites: Cantor's theorem / cardinality via bijection, power set; Peano axioms assumed familiar

## Left open
- Classes as logical fictions, theory of types → logical-constructions-and-acquaintance (forward Ref in Conclusion)
- Informative identities → frege-sense-and-reference (next lesson, Ref in Conclusion). Raised in the Conclusion as a question separate from the letter, coming from HP itself: '#F = #G' true just when F ≈ G, both sides name one number, yet equinumerosity can be news (planets / legs of a spider, 8 each, learned by counting); 'a = b' vs 'a = a'. Only the classes question is counted as the contradiction's consequence.
- Kant's and the logical empiricists' 'analytic' in full; analytic without logicism → a-priori-as-analytic (forward exercise Ref)
- Whether HP / second-order logic (comprehension) is logic (neo-logicism) — named, arguments for/against given, not settled
- Rule-following link (what a definition like the ancestral 'settles') — not mentioned; rule-following may Ref the ancestral section
- Kant's 'intuition of time' given only in outline
