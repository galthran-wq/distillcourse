# Brief: loop-invariants-and-correctness

Goal: construct a loop invariant proving an iterative algorithm correct.
Second lesson — C3 polish applies. The felt win: the reader states the
invariant for a simple loop and carries all three proof parts themselves.

## Sources to consult
- CLRS §2.1-2.2: insertion sort with the initialization / maintenance /
  termination scheme — the lesson's spine. Figs 2.1/2.2 (playing-cards
  framing, then the 6-iteration array trace) are the canonical visuals.
- CLRS Problems 2-2 (bubblesort correctness) and 2-3 (Horner's rule) — ready
  exercise material with a different loop shape each.
- MIT 6.006 L01: correctness by induction on the birthday-matching example;
  the explicit line "induction is why recursion is such a key concept".
- Erickson §1.2: the induction-hypothesis framing of trusting recursive calls
  (the "Recursion Fairy" — use the idea, not the persona; L9 bans the
  whimsy). One paragraph connecting invariant ↔ induction hypothesis.

## Key points the lesson must cover
1. Terminating with an answer ≠ correct; tests sample, proofs cover.
2. The three obligations: initialization (holds before iteration 1),
   maintenance (holds-before ⇒ holds-after one iteration), termination
   (invariant + exit condition ⇒ postcondition). Explicitly map to induction:
   base case, inductive step, and the use of the conclusion.
3. Full worked proof for insertion sort: invariant "A[1..j-1] holds the
   original elements of A[1..j-1], in sorted order". Every step visible (L7).
4. A second, non-sorting worked example with a different invariant shape:
   running-maximum or array-sum loop ("s equals the sum of A[1..i-1]").
5. Choosing an invariant: it must be strong enough to imply the goal at exit
   and weak enough to survive one iteration — show one too-weak candidate
   failing maintenance.
6. Termination itself needs an argument (a decreasing, bounded quantity);
   one sentence on why for-loops get this for free and while-loops do not.

## Worked examples and set pieces
- **Insertion sort as sorting a hand of cards** (CLRS Fig 2.1): the framing
  everyone uses; one figure, then drop the metaphor and work the array trace.
- **Six-iteration trace** (CLRS Fig 2.2): recreate as the lesson's central
  FigureSequence with the sorted prefix visibly growing.
- **Horner's rule** (CLRS Problem 2-3): polynomial evaluation loop — the
  invariant is a partial-evaluation identity, a genuinely different flavor;
  use as an exercise with full solution.
- **Bubblesort** (Problem 2-2): nested loops = nested invariants; exercise.
- E7 forward-reach exercise: state the invariant for a "halve the search
  range" loop — the reader lands on binary search's invariant, named in
  binary-search-and-order-statistics (<Ref>).

## Pitfalls
- The insertion-sort running-time analysis belongs to the previous lesson's
  register; here only a one-sentence Θ(n²) callback (reinforce, don't
  re-derive).
- Do not present invariants as documentation/assert style; the point is the
  proof obligation structure.
- Avoid heavyweight Hoare-logic notation; plain quantified English claims.
- The too-weak-invariant example must genuinely fail maintenance, not be a
  strawman (L13: the real misconception is "any true statement about the loop
  is an invariant").

## FIGURE PLAN
- draw: playing-cards insertion figure — left hand holds sorted cards, right
  hand inserts the next; labels bind to the array picture below it. Single
  <Figure>. Inspired by CLRS Fig 2.1.
- draw: <FigureSequence>, 6 frames: insertion sort on a 6-element array, one
  iteration per frame; the sorted prefix shaded (the invariant region), the
  key element highlighted, shifts drawn as arrows. Inspired by CLRS Fig 2.2.
- draw: the three proof obligations as a ladder diagram — base rung
  (initialization), repeating rung (maintenance), top rung (termination ⇒
  postcondition); visually parallel to an induction ladder. Single <Figure>.
- draw: invariant-strength spectrum — too weak (true but implies nothing) /
  right (provable and sufficient) / too strong (fails maintenance), with the
  worked example's candidates placed on it. Single <Figure>.
- draw: <FigureSequence>, 3 frames: the running-sum loop with the invariant
  annotated before, during, after one iteration — the maintenance step made
  visual. One change per frame.
