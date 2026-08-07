# Brief: binary-heaps-and-priority-queues

Goal: implement a binary heap and build a priority queue on it. The module's
"less order for less cost" move: heap property is weaker than the BST
invariant and buys an array layout with no pointers.

## Sources to consult
- CLRS Ch. 6: §6.1 (heap as array + tree dual view, Fig 6.1), §6.2
  (MAX-HEAPIFY sift-down, Fig 6.2), §6.3 (BUILD-MAX-HEAP bottom-up, Fig 6.3,
  the Σ-heights O(n) proof), §6.5 (priority queues: insert, extract,
  increase-key). (§6.4 heapsort belongs to the NEXT lesson — draw the line.)
- MIT 6.006 L08: the array↔complete-tree index bijection
  (parent i/2, children 2i, 2i+1 — or 0-based 2i+1/2i+2; pick 0-based to
  match engineering practice and say so); priority-queue-sort framework;
  build-heap Σ height(i) = Θ(n) proof.
- Morin ODS Ch. 10 §10.1 (clean BinaryHeap treatment).
- Sedgewick 2.4: taxicab numbers (1729) via PQ enumeration; event-driven
  simulation application; d-ary heap aside.

## Key points the lesson must cover
1. The priority-queue interface first (insert / find-min / extract-min /
   optionally decrease-key), and why a sorted structure is overkill for it —
   scoreboard row: sorted array O(n) insert, BST O(log n) everything, heap
   O(log n) with tiny constants and no pointers.
2. Heap property (parent ≤ children, min-heap) vs BST invariant: no
   left/right order, so search is O(n) — the deliberate trade.
3. Complete-tree-in-array layout: index arithmetic replaces pointers; height
   ⌊lg n⌋. Work the arithmetic on a 10-element example.
4. Sift-up (insert) and sift-down (extract-min): each walks one root-leaf
   path ⇒ O(log n). Full traces.
5. Build-heap bottom-up in O(n): the counterintuitive result. Carry the
   Σ_{h} (n/2^{h+1})·O(h) = O(n) argument (6.006's version); contrast with
   n inserts costing O(n log n).
6. Applications registry (one line each + <Ref>s): heapsort (next lesson),
   Dijkstra (weighted-graphs module), event-driven simulation, top-k.

## Worked examples and set pieces
- **Dual-view figure** (CLRS Fig 6.1): same 10 numbers as tree and as array
  with index arrows — the lesson's anchor visual.
- **Sift-down trace** (CLRS Fig 6.2): full worked MAX-HEAPIFY… use min-heap
  orientation consistently (say once that CLRS uses max-heaps; we use min
  to match Dijkstra later).
- **Build-heap on a 10-element unsorted array** (CLRS Fig 6.3): frame per
  heapify call, right-to-left from the last internal node.
- **Taxicab 1729** (Sedgewick 2.4): enumerate sums a³+b³ in order with a PQ,
  discover 1729 = 1³+12³ = 9³+10³ — compact, striking PQ application;
  good exercise or aside.
- E7 forward-reach exercise: extract-min n times from a heap and write down
  the output order — the reader has implemented heapsort one lesson early
  (<Ref> heapsort-and-the-sorting-lower-bound).

## Pitfalls
- Keep heapsort itself OUT (next lesson owns it) — the E7 exercise is the
  only bridge.
- decrease-key: define it (Dijkstra needs the idea) but note binary-heap
  Dijkstra can also re-insert; don't open the Fibonacci-heap door beyond
  one named sentence (course 2).
- The build-heap sum: present the intuition (most nodes are near the
  bottom, sift distance small) BEFORE the algebra; bound the sum with the
  Σ h/2^h ≤ 2 fact stated as a lemma.
- 0-based vs 1-based indexing: choose 0-based, state the 1-based variant
  once — inconsistency here breeds bugs and confusion.

## FIGURE PLAN
- draw: heap dual view — the same array drawn as boxes with indices and as
  a complete tree, arrows binding index i to nodes 2i+1/2i+2; one
  parent-child pair color-linked in both views. Single <Figure>. Inspired
  by CLRS Fig 6.1 / 6.006 L08.
- draw: heap property vs BST invariant — two small trees over the same
  keys, shaded constraint regions ("≤ everything below" vs "left < root <
  right"). Single <Figure>.
- draw: <FigureSequence>, 4 frames: insert with sift-up — element appended
  at the end, swapping up one level per frame until the property holds.
- draw: <FigureSequence>, 4 frames: extract-min — root removed, last leaf
  promoted, sift-down choosing the smaller child each frame. Inspired by
  CLRS Fig 6.2.
- draw: <FigureSequence>, 4-5 frames: build-heap right-to-left on a
  10-element array, one heapify per frame. Inspired by CLRS Fig 6.3.
- draw: the Σ-heights picture — tree levels with node counts n/2, n/4, …
  and sift distances 0,1,2,… multiplied out beside each level, total area
  visibly linear. Single <Figure>. Inspired by 6.006 L08's proof.
