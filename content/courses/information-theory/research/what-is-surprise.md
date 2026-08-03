# Research brief: what-is-surprise (Surprisal)

status: drafted (kept slug — revise, do not rewrite)
module: foundations
type: core
goal: Compute the surprisal of an event from its probability.
est_minutes: 28

## ARC

- **Inherits:** nothing. This is lesson one, and C3 makes it the most polished
  chapter in the course.
- **Spine step:** "An event's information content is fixed by its probability
  alone; requiring that independent events add forces the logarithm, and
  averaging that quantity over a source defines entropy." (step 1,
  *Information has a size*, 1928–1948)
- **Contributes:** the quantity `-log2 p` and, more importantly, the reason it
  is a logarithm and nothing else. Every later bit-count in the course is a sum
  of these.
- **Hands off to:** `entropy-as-average-surprise`, which averages it. The
  closing paragraph names that move as fact.

## Sources to consult

- Shannon 1948, Part I, **§6 "Choice, Uncertainty and Entropy"** — the
  logarithmic measure and the additivity motivation. Primary anchor.
- MacKay, **ch. 2 §2.4** — "Shannon information content" `h(x) = log2 (1/p(x))`;
  note the lowercase-`h` convention for per-event content versus `H` for the
  ensemble average.
- Cover & Thomas, **§2.1** — entropy defined directly; surprisal appears only as
  the summand. Use for the `E[log 1/p]` framing.
- Hartley 1928 — historical, for the units paragraph (the base-10 hartley).
- MacKay, **Appendix C.4 "Some numbers"** — the powers-of-two-against-reality
  table, if a scale anchor is wanted for the units section.

## Key points the lesson must cover

1. Information content is a property of the reported event's **probability**,
   not of message length or wording.
2. Two constraints on any candidate `f(p)`: `f(1) = 0`, and `f` strictly
   decreasing. These alone underdetermine the form — `1-p` and `1/p - 1` both
   pass and both fail additivity.
3. The **additivity axiom** over independent events, `f(pq) = f(p) + f(q)`,
   reduces to Cauchy's functional equation via `g(t) = f(e^{-t})`; continuity
   forces `f(p) = -c log p`. This is the load-bearing derivation and it must be
   carried through, not gestured at.
4. Definition `I(x) = -log2 p(x)` in **bits**; `I = 0` at `p = 1`, unbounded as
   `p -> 0`.
5. **Units**: bits, nats, hartleys as a change of measurement unit only;
   `1 nat = log2 e ≈ 1.443 bits`.
6. **Composite events**: additivity holds only for independent events; the
   general case is `I(A ∩ B) = I(A) + I(B|A)`, and disjoint events fail it the
   other way.
7. Closing tie: surprisal is per event, not per random variable — which is what
   the next lesson fixes.

## Pitfalls / subtleties to flag

- The constant `c` is exactly the choice of log base; there is no further
  freedom. Do not present base 2 as "natural".
- `-log2 p` is undefined at `p = 0`. Surprisal of an impossible event is not
  "infinite information", it is undefined; the `0 log 0` convention belongs to
  the entropy lesson.
- Corpus letter frequencies are estimates, not constants.
- Additivity is an axiom being *chosen*, and the lesson should say why it is the
  right one to choose (bits over independent channels must add) rather than
  presenting it as forced by nature.

## FIGURE PLAN

1. `draw:` **rarity.svg** (exists, single `<Figure>`) — three events ordered by
   probability, information growing as `p` shrinks. Keep; it is the two-colour
   comparison gold example cited in docs/figures.md.
2. `draw:` **additivity.svg** (exists, single `<Figure>`) — coin-flip tree:
   probabilities multiply along branches, information adds.
3. `draw:` **candidates-1..3.svg** (exist, `<FigureSequence>`, 3 frames) — why
   `1-p` and `1/p - 1` fail: plot all three candidates, overlay the additivity
   test point, leave only `-log2 p` passing both required points.
4. `draw:` **curve.svg** (exists, single `<Figure>`) — the `-log2 p` curve with
   coin (1 bit), die (2.58), ace of spades (5.70) marked as dots.
5. `draw:` **units.svg** (exists, single `<Figure>`) — one surprisal value in
   bits, nats and hartleys with the conversion factors as labelled arrows.
6. `draw:` **split.svg** (exists, single `<Figure>`) — the ace-of-spades
   additivity check as two boxes, `log2 52 = log2 4 + log2 13`.
7. `source:` **amathematica-title-page** → save as
   `figures/shannon-1948-title.png`, float right beside the paragraph that
   introduces the bit as a unit. The reader must be able to read the title, the
   byline, and the BSTJ volume/page line. One sourced image is the budget for
   this lesson; it is the founding document and a redrawn title card proves
   nothing.

## EXERCISE PLAN

1. *(warm-up, the only mechanical item)* Compute the surprisal of drawing a
   named card, a named suit, and a red card; check that the first equals the sum
   of the second and a third quantity the reader must identify.
2. **Boundary probe.** Take `p -> 0` and `p -> 1` separately. State what
   `I(x)` does in each limit, then explain why the `p = 0` case is undefined
   rather than infinite, and which clause of the definition rules it out.
3. **Claim to refute.** "Information content is additive, so the surprisal of
   'the card is a heart AND the card is the ace of hearts' is the sum of the two
   surprisals." Produce the correct value, and name the step that fails.
4. **Derivation the lesson skipped.** The lesson derives `f(p) = -c log p` from
   `f(pq) = f(p) + f(q)` plus continuity. Show that dropping continuity is not
   harmless: state what the functional equation alone permits, and give the
   monotonicity assumption that also suffices to rule the pathologies out.
5. **Research-shaped.** Take any English text of at least 2000 characters,
   count the letters, and compute the surprisal of the rarest and commonest
   letter in your sample. Report both, and say how much the numbers move if you
   fold case and strip punctuation. State what would count as agreement with the
   published monogram figures.
6. **FORWARD (E7).** For the distribution {A: 1/2, B: 1/4, C: 1/8, D: 1/8},
   compute the surprisal of each outcome, then compute the probability-weighted
   average of those four numbers. Do not simplify. Reaches
   `entropy-as-average-surprise`: the number produced is the entropy, and the
   solution says so with a `<Ref>`.

## REVISION (kept slug — what the current lesson.mdx must gain and lose)

**Gain**
- An ARC paragraph after the opening (L10a): two to four declarative sentences
  placing this as move one of the spine, naming what stands open.
- Depth to the 28-minute target: carry the Cauchy functional-equation step
  fully (currently compressed), and add the `I(A∩B) = I(A) + I(B|A)` general
  case as a worked instance rather than a remark.
- The sourced Shannon title page (figure 7 above) with a credits.yaml entry.
- An exercise set rebuilt against the floor above. The current set opens with a
  restatement of the sunrise/Cairo example — replace it.
- A closing paragraph naming what is established and what the next lesson takes
  up, stated as fact (L10c).

**Lose**
- The demo/prose misalignment noted in the previous QA round: the SurprisalSlider
  has a 3-bit target the prose never mentions. The demo spec in course.yaml now
  states three explicit targets; the prose `<Task>` must state them too (D1/D4).
- Any `<KeyFact>` that restates `-log2 p` after deriving it (L15). If a KeyFact
  stays, it must carry the condition (independence) or the forward consequence.
- The duplicated units display equation now covered by units.svg (L9a).
