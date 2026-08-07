# Brief: union-find

Goal: implement union-find with union by rank + path compression and analyze
its near-linear cost. Closes the module (L16 application: percolation, and
the forward contract with Kruskal). The α(n) result is stated and made
tangible, not proved.

## Sources to consult
- CLRS Ch. 19: §19.1 (operations; connected-components application), §19.2
  (linked-list representation + weighted-union heuristic, Fig 19.3 the
  Θ(n²)-vs-Θ(n) sequence), §19.3 (forests, union by rank, path compression),
  §19.4 (the Ackermann build-up A_k(n), α(n) ≤ 4 "for any conceivable n").
- Tarjan, Cornell TR 72-148 (research/texts/, OCR'd): the primary artifact.
  Names: "Weighting Rule", "Collapsing Rule". Figures 1-2 hand-drawn
  (captured). The Conclusion quote: "probably the first example of a simple
  algorithm with such a complicated running time." Upper bound O(n log* n)
  there; the tight O(m α(n)) is Tarjan 1975 (cite).
- Sedgewick 1.5: the pedagogical ladder quick-find → quick-union → weighted
  → +compression, each with its cost; percolation case study
  (p* ≈ 0.592746 by Monte Carlo).
- CS166 L18: the iterated-log family framing (log log n → log* n → …) —
  mine only the "numbers ladder" gems.

## Key points the lesson must cover
1. The interface: make-set / find / union; the invariant that groups
   partition the elements; motivating problems (dynamic connectivity,
   Kruskal's cycle test — forward <Ref>).
2. Quick-find (id array): O(1) find, O(n) union — and why n unions on n
   elements then costs Θ(n²) (Sedgewick's "30+ years at 10^9 ops" framing).
3. Forest representation: parent pointers, root = representative; naive
   union can chain to height n.
4. Union by rank (weighting): smaller tree under larger ⇒ height ≤ lg n.
   Carry the "rank grows only when equals merge" doubling argument.
5. Path compression: every found node repointed to the root; one before/
   after worked example.
6. Both together: m operations in O(m α(n)); α defined informally via the
   tower ladder (α = 4 already needs n ≥ tower of 65536 twos); "effectively
   constant" made precise as "≤ 4 for any n that fits in the universe."
   State clearly: proof is beyond this course (CLRS §19.4 / Tarjan 1975).
7. Percolation as the closing application: N×N grid, open sites, does the
   top connect to the bottom; union-find + virtual top/bottom nodes; the
   measured threshold p* ≈ 0.593.

## Worked examples and set pieces
- **The Θ(n²) vs Θ(n) sequence** (CLRS Fig 19.3): the concrete op sequence
  where naive union dies and weighted union cruises — recreate as the
  "why heuristics matter" example.
- **Tarjan TR 72-148 as primary source**: the rules' original names, the
  hand-drawn collapsing figure (source image), and the closing quote — a
  short history paragraph; the 1972→1975 bound-tightening arc
  (O(n log* n) → O(m α(n))) told in two sentences.
- **Ackermann ladder** (CLRS §19.4): A_1(1)=3, A_2(1)=7, A_3(1)=2047,
  A_4(1) ≈ tower dwarfing atoms in the universe ⇒ α(n) ≤ 4. Keeper
  numbers for the lesson.
- **Percolation** (Sedgewick 1.5): the virtual-source trick and the Monte
  Carlo estimate — the L16 computational study the reader could re-run.
- E7 forward-reach exercise: given a weighted graph's edges sorted by
  weight, use union-find to add edges skipping cycle-makers — the reader
  has executed Kruskal's algorithm before it is named
  (<Ref> minimum-spanning-trees).

## Pitfalls
- Union by RANK vs by SIZE: pick rank, note size works identically; don't
  do both analyses.
- Do not attempt the α(n) amortized proof (Seidel-Sharir/CLRS 19.4 is
  course-2-hard); the lesson's honesty beat is "statement heavy, proof
  cited."
- Path compression variants (halving, splitting): one sentence.
- α symbol collision with hash-table load factor — add the disambiguating
  sentence here (later lesson).

## FIGURE PLAN
- draw: partition-of-elements diagram — n dots grouped into blobs, union
  merging two blobs, find returning a blob's representative. Single
  <Figure>.
- draw: quick-find id-array vs forest — same partition shown both ways.
  Single <Figure>. Inspired by Sedgewick 1.5.
- draw: <FigureSequence>, 3 frames: union by rank — two trees of unequal
  rank merge (short under tall), then two equal-rank trees merge (rank
  ticks up). Inspired by Tarjan Fig 2 (redraw with subtree triangles).
- draw: <FigureSequence>, 3 frames: a find on a long path — walk to root,
  then every visited node repointed; final frame the flattened star.
  Inspired by Tarjan Fig 1 (redraw in house style).
- source: efficiencyof-fig1-find-collapsing — save under figures/ as
  `tarjan-1972-collapsing-rule.png`. Reader must be able to see: the
  hand-drawn 5-node path tree T and the flattened T' after one FIND, with
  the triangle subtrees. Placement: float right beside the history
  paragraph naming the Collapsing Rule. (Original 1972 hand-drawn figure;
  redrawing would erase the provenance.)
- draw: the tower ladder — 2, 2², 2^2², … as a growing stack against
  α = 1,2,3,4 markers; annotation "atoms in the universe" at the relevant
  rung. Single <Figure>. Inspired by CLRS §19.4.
- draw: percolation grid — open/blocked/full sites with virtual top and
  bottom nodes wired in. Single <Figure>. Inspired by Sedgewick 1.5.
