# Brief: divide-and-conquer-design

Goal: design a divide-and-conquer algorithm for a NEW problem and derive its
recurrence. Worked-practice lesson opening the paradigms module: the pattern
already used twice (sorting) is now applied where it isn't obvious —
multiplication.

## Sources to consult
- Erickson §1.9 (Karatsuba: the ac+bd−(a−b)(c−d) identity; Figs 1.14/1.15
  contrasting 4-call vs 3-call recursion trees — the visual payoff), §0.2
  (historical multiplication: lattice/Treviso, peasant duplation — the
  artifact image), §1.3 (Tower of Hanoi — the pure-recursion warm-up with
  the Benares legend and 2^64−1 moves).
- CLRS §4.1-4.2 (matrix multiply blocking; Strassen's 7-products trick,
  O(n^2.81)) — presented as "the same one-fewer-recursive-call move at
  matrix scale", statement + recurrence only.
- MIT 6.046 L2 (closest pair via D&C exists here if a second worked
  geometry example is wanted — but keep it a sketch: course.yaml's
  key_ideas promise only a gesture at the strip argument).

## Key points the lesson must cover
1. The design template extracted from the sorting lessons: (a) how to split,
   (b) what the subproblems return, (c) how to combine, (d) the recurrence
   the choices induce. State as a checklist the lesson then runs twice.
2. Warm-up: Tower of Hanoi — recursion in its purest form; T(n) = 2T(n−1)+1
   = 2^n − 1 (a non-dividing recurrence; contrast with the n/b shape).
   Include the Benares legend + 585-billion-years number as the scale gem.
3. Integer multiplication: grade-school Θ(n²); the naive 4-way split gives
   T(n) = 4T(n/2) + Θ(n) = Θ(n²) — splitting alone buys NOTHING (the
   lesson's central negative result, carried via the Master theorem;
   spiral).
4. Karatsuba: the 3-multiplication identity worked on concrete 4-digit
   numbers; T(n) = 3T(n/2) + Θ(n) = Θ(n^{lg 3}) = Θ(n^1.585). Cash out the
   recurrences lesson's E7 exercise explicitly.
5. The design lesson generalized: the combine/decompose insight is where
   the win lives, not the split; count recursive calls before anything
   else. Strassen as the same move on matrices (7 not 8); closest-pair
   sketch as the strip-pruning combine (optional ★ section).
6. When D&C does NOT help: subproblems that overlap — one paragraph seam
   into dynamic programming (L10c: the next lesson's flaw-fix).

## Worked examples and set pieces
- **Karatsuba on 1234 × 5678**: full three-product computation with the
  subtraction trick, every digit visible (L7 centerpiece), then the
  general recurrence.
- **Karatsuba origin story** (Erickson §1.9): 1960 — Kolmogorov's seminar
  conjectures n² is optimal; 23-year-old Karatsuba kills the conjecture
  within a week; Kolmogorov ends the seminar. Two sentences, dated.
- **Historical multiplication artifact** (Erickson §0.2): lattice
  multiplication from the 1458 Treviso Arithmetic — algorithms for
  multiplication are older than the word "algorithm"; the source image
  carries it. Peasant multiplication one-liner.
- **Tower of Hanoi legend**: 64 golden disks, 2^64−1 moves ≈ 585 billion
  years — keeper number for exponential recurrences.
- E7 forward-reach exercise: compute fib(n) by the naive recursion and
  count calls — the reader meets overlapping subproblems the next lesson
  names (<Ref> dynamic-programming-i-one-dimensional).

## Pitfalls
- Do not derive Strassen's seven products (statement + recurrence only);
  deriving them teaches nothing transferable at this level.
- Closest pair: if included, ★-starred and sketch-level (the full strip
  proof is course-2 geometry); nothing later depends on it.
- Keep "divide-and-conquer" distinct from "decrease-and-conquer" (binary
  search recursing into ONE half) — one clarifying sentence.
- The Karatsuba identity's middle term signs are error-prone: check the
  worked arithmetic twice.

## FIGURE PLAN
- draw: the D&C design checklist card — split/return-contract/combine/
  recurrence slots, filled in for merge sort as the known instance. Single
  <Figure>.
- draw: <FigureSequence>, 3 frames: Tower of Hanoi's recursive move —
  n−1 disks parked, largest moved, n−1 re-stacked. One change per frame.
- draw: the 4-call vs 3-call recursion trees side by side — level sums
  annotated (both Θ(n) per call at top; totals Θ(n²) vs Θ(n^1.585)); the
  one deleted subtree highlighted. Single <Figure>. Inspired by Erickson
  Figs 1.14/1.15 (the lesson's central visual).
- draw: <FigureSequence>, 4 frames: Karatsuba on 1234×5678 — split into
  high/low halves; three products computed; recombination with shifts;
  final answer assembled. Every number real.
- source: algorithms-s1-page23-multiplication-figures — save under
  figures/ as `treviso-1458-multiplication.png`. Reader must be able to
  see: the lattice-multiplication grid and the hand-set 1458 typography
  (the casting-out-nines mark is a bonus). Placement: float left beside
  the opening's "multiplication algorithms are five centuries old"
  paragraph. (15th-century artifact; a redraw would erase the point.)
- draw: Strassen block-partition panel — 2×2 block matrices with "8
  products → 7" annotated and the resulting exponent change. Single
  <Figure>, small.
