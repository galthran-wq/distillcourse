# Brief: median-of-medians (type: extra)

Goal: explain how the median-of-medians pivot rule makes selection worst-case
O(n). Off-path starred chapter: no other lesson may depend on it; it may
freely depend on the core path (prereq: binary-search-and-order-statistics).

## Sources to consult
- CLRS §9.3: the SELECT algorithm; Fig 9.3 (the canonical columns-of-5
  diagram proving the ≥ 3n/10 elimination bound); Theorem 9.3 and the
  recurrence T(n) ≤ T(n/5) + T(7n/10) + Θ(n).
- Erickson §1.8: MomSelect — the cleanest exposition; the explicit
  "sanity check" on why block size 5 works and 3 does not (Fig 1.13's
  side-by-side recursion trees); attribution Blum-Floyd-Pratt-Rivest-Tarjan
  1973 (strip the "Thanks, Mom" whimsy per L9).
- MIT 6.046 L2: compact recurrence treatment; good exercise variants.

## Key points the lesson must cover
1. The flaw inherited from quickselect: expected O(n) but worst-case Θ(n²);
   an adversary (or sorted data with naive pivots) forces it. What is needed:
   a pivot GUARANTEED to be near the middle, found in O(n).
2. The construction: split into ⌈n/5⌉ groups of 5; median of each group by
   brute force (≤ 6 comparisons each); recursively select the median of the
   ⌈n/5⌉ group-medians; use it as the pivot.
3. The elimination bound: at least half the group-medians ≤ pivot, each
   bringing 3 of its group ⇒ ≥ 3n/10 − O(1) elements on each side; so the
   recursion keeps at most 7n/10 + O(1). Carry the grid-counting argument
   in full — it IS the lesson.
4. The recurrence T(n) ≤ T(n/5) + T(7n/10) + cn solves to O(n) because the
   recursive fractions sum below 1 (1/5 + 7/10 = 9/10); recursion-tree
   argument as a geometric series (spiral to recurrences lesson — this
   recurrence is outside the Master theorem's shape, which is itself a
   teaching point).
5. Why 5: groups of 3 give T(n/3) + T(2n/3) + cn — fractions sum to 1,
   every level costs cn, Θ(n log n). Groups of 7 also work; 5 is smallest.
6. Perspective: constants are large; in practice randomized quickselect
   wins; the value is the guarantee and the technique (a recursion used to
   steer another recursion). One paragraph, honest.

## Worked examples and set pieces
- **Full MomSelect round on 25 concrete elements**: 5 groups, medians
  marked, median-of-medians found, partition sizes counted against the
  3n/10 bound — numbers, not just symbols.
- **The grid argument** (CLRS Fig 9.3 / Erickson's 5×(n/5) grid): columns
  sorted top-to-bottom, columns ordered by median, the guaranteed-smaller
  quadrant shaded — the canonical picture, recreated.
- **Groups-of-3 failure** (Erickson Fig 1.13): the recursion-tree pair —
  geometric decay vs equal level sums.
- E6c derivation exercise: verify 1/5 + 7/10 < 1 makes the tree geometric;
  compute the constant. E6b claim to refute: "groups of 3 with the same
  argument also give O(n)".

## Pitfalls
- Exact constants in the elimination bound (3n/10 − 6 etc.): state the
  clean asymptotic form, footnote the floor/ceiling slop (Erickson's
  license from the recurrences lesson applies).
- This lesson must remain skippable: no forward references from core
  lessons into it; it may <Ref> backward freely.
- Do not open the deterministic-vs-randomized philosophical discussion
  beyond the one honest paragraph.

## FIGURE PLAN
- draw: the groups-of-5 grid — elements as dots in 5-tall columns, each
  column's median highlighted, columns arranged by median order, the
  ≥ 3n/10 "guaranteed smaller" region shaded with its count annotated.
  Single <Figure>. Inspired by CLRS Fig 9.3 (canonical; recreate).
- draw: <FigureSequence>, 4 frames: one MomSelect round on 25 elements —
  frame 1 grouping, frame 2 group medians, frame 3 recursive
  median-of-medians, frame 4 partition with side sizes counted.
- draw: recursion tree for T(n/5) + T(7n/10) + cn — level sums decaying
  geometrically (9/10 factor per level). Single <Figure>. Inspired by
  Erickson Fig 1.13 left.
- draw: the failing groups-of-3 tree beside it — level sums constant,
  Θ(n log n). Single <Figure>. Inspired by Erickson Fig 1.13 right.
- draw: guarantee-vs-practice card — randomized quickselect (expected O(n),
  tiny constants) vs SELECT (worst-case O(n), large constants); when each
  is the right call. Single <Figure>.
