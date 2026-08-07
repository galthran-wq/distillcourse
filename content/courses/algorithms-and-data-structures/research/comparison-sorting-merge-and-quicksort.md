# Brief: comparison-sorting-merge-and-quicksort

Goal: implement merge sort and quicksort; analyze via Master theorem and
average-case argument. The module opener and the divide-and-conquer concept's
formal introduction.

## Sources to consult
- CLRS §2.3 (merge sort + the merge loop invariant — spiral back to the
  invariants lesson), Ch. 7 (quicksort: Lomuto partition Fig 7.1; worst-case
  9-to-1 discussion Fig 7.4; randomized version §7.3; expected-case intuition
  §7.4 — take the intuition, not the full indicator-variable proof).
- Erickson §1.4-1.5: mergesort/quicksort on the 'SORTING EXAMPLE' string
  (worked array-state traces); recursion trees for good vs worst pivots
  (Figs 1.10-1.11); correctness by induction framing.
- Sedgewick 2.2/2.3: ~2N ln N average compares; shuffle-then-sort as the
  practical randomization; 3-way partitioning for duplicate keys (one
  paragraph); Timsort note; the war stories (below).
- Morin ODS §11.1.1-11.1.2 for compact statements.

## Key points the lesson must cover
1. Divide-and-conquer named formally (concept introduction): divide /
   conquer / combine; both sorts instantiate it with the work in different
   phases (combine = merge vs divide = partition) — the opening's framing.
2. Merge: two-finger walk over sorted halves, O(n), stable; its loop
   invariant stated (spiral). Merge sort recurrence T(n)=2T(n/2)+Θ(n) ⇒
   Θ(n log n) by the Master theorem (spiral); Θ(n) auxiliary space.
3. Partition (Lomuto): in-place scan, invariant of the four regions; pivot
   placement. Quicksort recurrence: balanced T(n)=2T(n/2)+Θ(n); worst case
   T(n)=T(n-1)+Θ(n)=Θ(n²) on sorted input with first/last-element pivot —
   carry the summation.
4. Randomized pivots: expected Θ(n log n) for every input — the argument at
   intuition level (a random pivot lands in the middle half with prob 1/2,
   so depth is O(log n) in expectation); full proof cited (CLRS Thm 7.4).
5. Practice: in-place vs stable trade; why library sorts are hybrids
   (introsort/Timsort/dual-pivot — one short section, the source image
   carries the artifact).
6. L13 refutation slot: "quicksort is O(n log n)" stated unconditionally —
   refute with the sorted-input trace; the fix is randomization or
   median-of-three (one sentence).

## Worked examples and set pieces
- **Full merge-sort and quicksort traces** on one 8-element array (adapt
  Erickson's 'SORTING EXAMPLE' device) — same input through both algorithms,
  the module's running example.
- **Organ-pipe war story** (Sedgewick 2.3, Bentley-McIlroy 1993): a Unix
  qsort ran for WEEKS on an organ-pipe array (1..n,n..1) — quadratic blowup
  in production; motivates engineering the pivot.
- **Dual-pivot paper trail** (Sedgewick 2.3 slides 53-56): Yaroslavskiy's
  Sept-2009 mailing-list post → Oct-2009 OpenJDK commit b05abb410c52 →
  every Java Arrays.sort since. The source image is the artifact.
- **Timsort** (Sedgewick 2.2): Python/Java's real-world merge sort variant
  exploiting existing runs — one paragraph, References pointer.
- **Poker shuffle bug** (Sedgewick 2.1 slides 60-62): planetpoker's broken
  shuffle (seed = ms since midnight, 32-bit seed) let attackers predict the
  deck — usable as an Aside where randomized pivots are introduced:
  randomness that isn't random voids the expected-case guarantee.
- E7 forward-reach exercise: count comparisons merge sort makes on n=8 and
  compare against lg(8!) = 15.3 — the reader brushes the lower bound the
  next lesson proves (<Ref> heapsort-and-the-sorting-lower-bound).

## Pitfalls
- Hoare vs Lomuto partition: teach Lomuto (simpler invariant), name Hoare's
  as the original (Hoare 1961 citation) with one sentence.
- Do not run the full expected-comparisons indicator-variable analysis —
  intuition + citation; the course reserves that machinery.
- Stability: merge sort stable only if merge breaks ties left-first — say
  it precisely once.
- Keep 3-way partitioning / duplicate keys to a paragraph.

## FIGURE PLAN
- draw: divide-and-conquer template card — split/solve/combine boxes with
  the two sorts' work-location annotated (merge: combine; quicksort:
  divide). Single <Figure>.
- draw: <FigureSequence>, 4-5 frames: the merge two-finger walk on two
  4-element sorted halves, one output element per frame (pointer positions
  visible). Inspired by CLRS §2.3.1.
- draw: merge-sort recursion tree on the 8-element running example with
  level totals (recap of the recurrences lesson, now with real data).
  Single <Figure>.
- draw: <FigureSequence>, 5 frames: Lomuto partition scan — i/j pointers,
  the four invariant regions shaded, one swap per frame, final pivot
  placement. Inspired by CLRS Fig 7.1.
- draw: good-split vs worst-case recursion trees side by side — balanced
  depth lg n vs the n-deep left spine on sorted input, per-level work
  annotated. Single <Figure>. Inspired by Erickson Fig 1.11.
- source: algorithmspa-s1-bentley-mcilroy-mailinglist — save under figures/
  as `dualpivot-openjdk-papertrail.png`. Reader must be able to see:
  Yaroslavskiy's 2009 mailing-list post header and the OpenJDK changeset id
  b05abb410c52. Placement: centered inside the "engineering a library sort"
  section. (Real historical paper trail; a redraw would fabricate it.)
