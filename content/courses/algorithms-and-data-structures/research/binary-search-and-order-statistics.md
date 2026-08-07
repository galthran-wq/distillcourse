# Brief: binary-search-and-order-statistics

Goal: apply binary search (incl. the monotonic-predicate generalization) and
implement quickselect for expected-linear selection. Closes the
sorting-and-searching module: what sorted order buys you, and what you can
get without fully sorting.

## Sources to consult
- CLRS Exercise 2.3-6 / §4 intro for binary search; the invariant treatment
  should mirror the loop-invariants lesson (spiral).
- MIT 6.006 L04: the comparison-model Ω(log n) search lower bound (decision
  tree with n+1 outcomes) — binary search is optimal in its model; ties the
  module's two lower-bound arguments together.
- CLRS §9.1 (min/max in n−1 comparisons; simultaneous min-max in ~3n/2 —
  exercise fodder), §9.2 (RANDOMIZED-SELECT, expected Θ(n)).
- Erickson §1.8 (Quickselect: clean presentation + the "good pivot" framing
  that sets up median-of-medians); §1.5 partition reuse.
- Sedgewick 1.4 (binary search code + its use in TwoSumFast; the
  ThreeSum → N² log N case study as an application set piece).

## Key points the lesson must cover
1. Binary search worked with its invariant (target, if present, lies in
   [lo, hi)) — initialization/maintenance/termination carried; off-by-one
   discipline via half-open intervals. O(log n) by range-halving.
2. Optimality: lg(n+1) comparisons needed in the comparison model (6.006
   decision-tree argument in two paragraphs — reinforces last lesson's
   technique on a new problem).
3. The generalization that matters in practice: binary search over any
   monotonic predicate (first index where f flips F→T) — sorted-array
   lookup is the special case. Worked example: first capacity that
   satisfies a feasibility check (sets up "binary search the answer").
4. Application set piece: TwoSum/ThreeSum sped from N³ to N² log N by
   sort + binary search (Sedgewick 1.4) — algorithm design by reduction to
   sorted structure.
5. Selection: the k-th smallest without sorting. Quickselect = quicksort's
   partition recursing into one side; expected Θ(n) via the geometric
   series n + 3n/4 + (3/4)²n + … (middle-half pivot with prob 1/2);
   worst case Θ(n²) stated with the adversarial trace.
6. Close the module: the scoreboard of search/selection costs; the
   worst-case-linear fix exists (median of medians) — flagged as the
   optional extra lesson (L10c; extra lessons are skippable by
   construction, so phrase as "an optional deepening", never a dependency).

## Worked examples and set pieces
- **Binary search trace** on a 16-element sorted array, every lo/hi/mid
  state shown; a companion FAILED search trace (absence certified).
- **Monotonic predicate**: find the first n where n² ≥ 2000 — no array at
  all; the predicate view naked.
- **Quickselect trace** (Erickson §1.8 flavor): find the 4th-smallest of 12
  elements; two partitions, one side discarded each time, discarded regions
  shaded.
- **Expected-cost series**: n + 3n/4 + 9n/16 + … ≤ 4n carried numerically
  on n = 64.
- E7 forward-reach exercise: run quickselect with an adversary picking
  max-element pivots — Θ(n²); reader hits the wall median-of-medians
  removes (<Ref> median-of-medians, noting it is optional).

## Pitfalls
- (lo+hi)/2 overflow bug: mention as a one-line implementation note
  (mid = lo + (hi−lo)/2) without war-story elaboration (not in our
  sources' read set).
- Keep expected-value machinery informal (series, not indicator algebra).
- Do not teach median-of-medians here — the extra lesson owns it; no
  non-extra content may depend on it (lint: extra-prereq).
- Half-open vs closed interval conventions: pick half-open, use it
  everywhere, say why once.

## FIGURE PLAN
- draw: <FigureSequence>, 4 frames: binary search on 16 elements — [lo,hi)
  shaded, mid compared, range halved per frame; final frame the
  found/absent verdict. Inspired by the standard range-halving diagram.
- draw: monotonic-predicate strip — FFFFFFTTTT with the flip point marked
  and "sorted-array search = this with f(i) := A[i] ≥ target" annotated.
  Single <Figure>.
- draw: search decision tree for n = 7 — depth lg 8 = 3, the n+1 outcome
  leaves. Single <Figure>. Inspired by 6.006 L04.
- draw: <FigureSequence>, 3 frames: quickselect for k = 4 on 12 elements —
  partition, discard shaded side, recurse; rank bookkeeping annotated.
  Inspired by Erickson §1.8.
- draw: shrinking-work series bar chart — bars n, 3n/4, 9n/16, … summing
  under 4n. Single <Figure>.
- draw: module scoreboard — sorted-array search O(log n) / build O(n log n);
  selection expected O(n); full sort O(n log n); counting-model exceptions
  noted. Single <Figure> (styled table).
