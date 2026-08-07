# Brief: heapsort-and-the-sorting-lower-bound

Goal: derive the Ω(n log n) comparison-sort lower bound (decision trees) and
implement heapsort. Two halves, one arc: a third O(n log n) sort, then the
proof that no comparison sort beats it — the course's first impossibility
result and the setup for linear-time sorting's escape.

## Sources to consult
- CLRS §6.4 (heapsort, Fig 6.4 full trace), §8.1 (Theorem 8.1 decision-tree
  lower bound; Corollary 8.2 heapsort/mergesort asymptotically optimal).
- Morin ODS §11.1.3-11.1.4: the cleanest written decision-tree proof
  (comparison tree with n! leaves, height ≥ log(n!) = n log n − O(n));
  includes the extension to randomized algorithms (exercise-level mention).
- Sedgewick 2.2 (slide 32: decision tree for 3 keys — the concrete instance),
  2.5 (the sorting-algorithms characteristics table: stable/in-place/
  worst/average — the module's closing scoreboard).
- MIT 6.006 L05 (log(n!) = Ω(n log n) via Stirling-free bounding:
  n! ≥ (n/2)^{n/2}).

## Key points the lesson must cover
1. Heapsort: build-max-heap in O(n) (spiral from the heap lesson), then n
   extract-max into the shrinking array tail — in-place O(n log n) worst
   case. Full trace on the module's 8-element running example.
2. Heapsort vs merge/quick in practice: optimal on paper, slower constants
   and poor locality — the honest engineering note; the scoreboard table.
3. The lower-bound question posed properly: is n log n an artifact of our
   three algorithms or a wall? Answer: a wall, for ANY algorithm that only
   compares.
4. The decision-tree model: every comparison sort ≡ a binary tree; leaves =
   permutations; every one of the n! orderings must be a reachable leaf
   (else two different inputs get the same output — carry this argument).
5. Height ≥ lg(n!); bound lg(n!) ≥ (n/2) lg(n/2) = Ω(n log n) without
   Stirling. Conclude Theorem: any comparison sort needs Ω(n log n)
   comparisons in the worst case; merge sort and heapsort are optimal.
6. Scope of the theorem — exactly what "comparison-based" excludes; the
   closing seam: algorithms that index by value are not bound by it
   (L10c → linear-time-sorting).

## Worked examples and set pieces
- **Decision tree for n = 3** (Sedgewick 2.2 slide 32 / ODS Fig 11.5-11.6):
  the full tree with 6 leaves, depth 3 ≥ lg 6 ≈ 2.58 — the concrete
  instance before the general theorem (L4).
- **Heapsort full trace** (CLRS Fig 6.4): heap shrinking as the sorted
  suffix grows — the in-place picture.
- **lg(n!) numbers**: lg(8!) ≈ 15.3 (cash out the previous lesson's E7
  exercise); n=1000 ⇒ ≈ 8,530 comparisons minimum. Keeper numbers.
- E7 forward-reach exercise: sort 1000 values known to lie in {0,…,9} —
  the reader invents counting by value and lands on counting sort
  (<Ref> linear-time-sorting).

## Pitfalls
- The lower bound is on COMPARISONS and worst case; do not let prose slide
  into "sorting takes n log n time" (L13 slot: the misconception that the
  bound binds all sorting — the next lesson exists to break it; state the
  model dependence sharply here).
- Randomized algorithms: the bound still applies in expectation (ODS Thm
  11.6) — one sentence + exercise, not a section.
- Average-case Ω(n log n) also holds; mention, don't prove.
- Keep build-heap's O(n) as a recap sentence with <Ref>, not a re-proof.

## FIGURE PLAN
- draw: <FigureSequence>, 5 frames: heapsort on the 8-element running
  example — swap root with last, shrink heap boundary, sift-down; sorted
  suffix shaded growing right-to-left. Inspired by CLRS Fig 6.4.
- draw: the full decision tree for sorting 3 elements — internal nodes
  labeled a:b comparisons, 6 leaves labeled with permutations, depth
  ruler beside it. Single <Figure>. Inspired by Sedgewick slide 32 / ODS
  comparison-tree figure.
- draw: leaves-force-height diagram — a binary tree silhouette with L
  leaves needing height ≥ lg L; n! plugged in. Single <Figure>.
- draw: two-inputs-one-leaf failure sketch — the pigeonhole argument for
  why a tree with too few leaves must merge two orderings and answer one
  wrong. Single <Figure>.
- draw: the sorting scoreboard — merge/quick/heap × worst/average/space/
  stable/in-place. Single <Figure> (styled table). Inspired by Sedgewick
  2.5's characteristics table.
