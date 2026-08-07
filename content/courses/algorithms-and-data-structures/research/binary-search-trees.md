# Brief: binary-search-trees

Goal: implement BST search/insert/delete and analyze cost as O(h). Opens the
ordered-structures module: what hashing gave up (order) this structure
restores — at the price of a height dependence the next lesson fixes
(flaw-driven sequencing: this lesson must END on the degeneracy flaw).

## Sources to consult
- CLRS Ch. 12: §12.1 (invariant + in-order traversal), §12.2 (search, min,
  successor), §12.3 (insert; delete via the four structural cases,
  Figs 12.3/12.4).
- Sedgewick 3.2: search/insert cost ∝ depth; ~2 ln n average under random
  insertion; sorted insertion ⇒ linked list; Hibbard deletion (1962, named)
  and the note that repeated Hibbard deletions skew the tree; Reed 2003
  expected height ~4.311 ln n (cite level only).
- Morin ODS Ch. 6 (clean unbalanced-BST treatment), Ch. 7 §7.1 (random-BST
  expected O(log n) height — mine for the exercise on why random order is
  good).
- Stanford CS166 L08: the measured height scatter (source image below).

## Key points the lesson must cover
1. The BST invariant stated precisely (ALL left-subtree keys smaller — not
   just the child; a classic misconception, L13 slot with a counterexample
   tree that satisfies the child-only condition but breaks search).
2. Search and insert walk one root-to-leaf path ⇒ O(h). Worked trace each.
3. In-order traversal yields sorted order (one-paragraph induction argument)
   — this is the "order restored" payoff vs hash tables; min/successor give
   range queries hashing cannot do.
4. Deletion: leaf / one child / two children (replace with in-order
   successor, which has at most one child — prove that claim). Full worked
   example of the two-child case.
5. h ranges log₂(n+1) (complete) to n-1 (chain); sorted insertion produces
   the chain; random insertion averages ~2 ln n ≈ 1.39 log₂ n depth.
6. Close on the flaw: real workloads insert sorted or nearly-sorted data all
   the time; the fix (rotations + invariants) is the next lesson (L10c).

## Worked examples and set pieces
- **Insert 1..8 in sorted order vs shuffled**: chain of height 8 vs height 3
  — the demo's task, also worked in prose with two drawings.
- **Hibbard deletion** (Sedgewick 3.2): named, dated 1962; the empirical
  note that delete-heavy workloads skew shape even from random inserts —
  honest "analysis is open/subtle" texture.
- **CS166 height experiment**: measured heights up to n = 10^21 hugging
  2.99 lg n (source image) — theory-meets-measurement set piece for the
  average-case section.
- E7 forward-reach exercise: insert an increasing run and measure height;
  reader hits the degenerate O(n) wall that balanced-search-trees removes
  (<Ref>).

## Pitfalls
- Do not prove the expected-height theorem (harmonic/indicator machinery —
  cite Sedgewick/Reed; CS166's proof is course-2 depth). State constants,
  show the measurement.
- Successor-based delete vs predecessor: pick successor, mention symmetry.
- Parent pointers: implementation detail, one sentence.
- Keep "BST" and "binary search on a sorted array" clearly separated — the
  sorted-array connection (a balanced BST is binary search made insertable)
  is worth exactly one sentence of foreshadowing.

## FIGURE PLAN
- draw: the invariant diagram — root with shaded left/right subtree regions
  labeled "< k" / "> k", plus the counterexample tree where only children
  (not subtrees) were checked. Single <Figure>.
- draw: <FigureSequence>, 4 frames: search for a key, one comparison per
  frame down the path; failed-search frame shows where insert would attach.
  Inspired by CLRS Fig 12.3.
- draw: the three deletion cases in one row (leaf / one child / two children
  with successor lift), each a small before→after pair. Single <Figure>.
  Inspired by CLRS Fig 12.4.
- draw: same 8 keys, two insertion orders — sorted (chain, h=7) vs shuffled
  (bushy, h=3); heights ruled beside each. Single <Figure>.
- source: stanfordcs16-s2-random-bst-height-scatter — save under figures/ as
  `random-bst-height-measured.png`. Reader must be able to see: the scatter
  of measured heights across n up to 10^21 and the fitted trendline with
  slope ≈ 2.91 annotation. Placement: centered, in the average-case section
  after the ~2 ln n claim. (Published plot of measured data; a redraw would
  fabricate the noise band that is the point.)
- draw: in-order traversal unrolling — tree above, its keys projected onto a
  sorted line below with traversal arrows. Single <Figure>.
