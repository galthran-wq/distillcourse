# Brief: reductions-between-problems

Goal: construct a reduction between problems to compare difficulty. Opens
the limits module — but the lesson's first job is POSITIVE: reductions as
the everyday design move that extends the whole course's toolkit for free.

## Sources to consult
- Sedgewick 6.5: reduction's three uses (design new algorithms, establish
  lower bounds, classify problems); linear-time reduction examples
  (element distinctness → sorting); the Archimedes-lever framing (use as
  an epigraph-style one-liner at most, dry).
- Erickson §1.1 (reduction as THE fundamental design move), §5.7 (flood
  fill → reachability — a tiny complete worked reduction), §12.5 (the
  general reduction pattern the NEXT lesson will inherit).
- CLRS §22.4 (difference constraints → shortest paths / Bellman-Ford —
  the surprising cross-domain bridge; Fig 22.8 constraint graph).
- Sedgewick 4.4 (arbitrage — cash out the Bellman-Ford lesson's E7:
  formalize the transformation already performed).
- MIT 6.006 L19 intro (A ≤ B definition and the hardness-transfer
  directions — stated cleanly).

## Key points the lesson must cover
1. Definition: reduce A to B = transform any A-instance into a B-instance
   (efficiently) so that B's answer converts back to A's answer;
   solver-for-B ⇒ solver-for-A. Diagrammed once, used everywhere.
2. Cost accounting: time(A) ≤ time(transform) + time(B on transformed
   instance) — with a worked numeric instance of the accounting.
3. Worked reduction 1 (design): arbitrage → negative-cycle detection —
   the full formal version of what Bellman-Ford's lesson previewed:
   instance map (rate table → weighted digraph, w = −ln r), answer map
   (cycle found ⟺ arbitrage exists), correctness both directions
   (log turns products into sums; monotonicity). The lesson's L7
   centerpiece.
4. Worked reduction 2 (surprise): difference constraints (a system of
   x_j − x_i ≤ b_k inequalities) → single-source shortest paths — a
   feasibility question about inequalities solved by Bellman-Ford; carry
   the constraint-graph construction and the triangle-inequality
   correspondence (CLRS §22.4). Demonstrates reductions crossing domain
   lines.
5. The direction of hardness: if A reduces to B, then B is at least as
   hard as A (modulo the transform's cost) — "A ≤ B" notation introduced;
   the lower-bound use (element distinctness inherits sorting's Ω(n log n)
   in the comparison model — one compact example, spiral to the sorting
   lower bound).
6. What a reduction is NOT: an analogy or resemblance — it is a checked
   pair of instance/answer maps with correctness in both directions
   (L13 slot: "modeling a problem as a graph" ≠ reduction until the maps
   and proofs are explicit; show a sloppy "reduction" failing the
   answer-map direction).
7. Close: the same tool, pointed at problems NOBODY can solve fast, turns
   into a hardness-spreading machine (L10c → p-np-and-np-completeness).

## Worked examples and set pieces
- **Flood fill → reachability** (Erickson §5.7): the two-sentence
  reduction — pixels to grid-graph vertices; good warm-up before the
  meatier two.
- **Arbitrage** end to end with fresh numbers (3 currencies, one
  profitable loop).
- **Difference constraints** (CLRS §22.4): 5 inequalities → 6-vertex
  constraint graph → Bellman-Ford distances = a feasible assignment;
  infeasible ⟺ negative cycle. Both cases worked.
- **Element distinctness lower bound** (Sedgewick 6.5): sorting solves
  it; a faster-than-n-log-n distinctness algorithm would violate…
  careful: state the standard "distinctness has an Ω(n log n)
  comparison lower bound, hence so does sorting" DIRECTION correctly —
  distinctness ≤ sorting transfers the lower bound FROM distinctness TO
  sorting; use it as the direction-of-hardness drill (E6b candidate).
- E7 forward-reach exercise: reduce 3-coloring-style puzzle to SAT-style
  constraints informally — the reader performs the shape of an
  NP-completeness reduction one lesson early (<Ref>
  p-np-and-np-completeness).

## Pitfalls
- Direction confusion is THE failure mode of this topic; drill it
  (which way does the solver flow, which way does hardness flow) with a
  dedicated figure and at least two exercises.
- Keep all reductions here polynomial-time and honest about transform
  cost; the ≤_p notation formality can wait one lesson.
- Bipartite matching → max flow: name as the classic (course-2 flow
  module), do not develop.
- No NP vocabulary yet — this lesson works entirely with solvable
  problems; the cliffhanger is structural, not terminological.

## FIGURE PLAN
- draw: the reduction schema — A-instance → transform box → B-instance →
  B-solver box → B-answer → answer-map box → A-answer; cost annotations
  under each box. Single <Figure>; the lesson's reusable diagram
  (reused by the next lesson with "NP-hard" stamped on B).
- draw: direction-of-flow pair — solver flows B→A, hardness flows A→B;
  two mirrored mini-diagrams. Single <Figure>, co-located with the
  hardness discussion.
- draw: <FigureSequence>, 4 frames: arbitrage reduction — rate table;
  digraph with −ln weights; negative cycle highlighted; answer mapped
  back to a trade loop with dollar amounts. Inspired by Sedgewick 4.4
  (fresh numbers).
- draw: difference-constraints construction — the inequality list beside
  its constraint graph, one inequality color-linked to its edge; the
  feasible-assignment readout beneath. Single <Figure>. Inspired by
  CLRS Fig 22.8.
- draw: failed-"reduction" panel — a transformation with no valid answer
  map (the B-answer that cannot be converted back), crossed out. Single
  <Figure>.
- draw: toolkit map — problems met so far (sorting, SSSP, MST, DP…) as
  nodes with reduction arrows from newly-solved problems (arbitrage,
  constraints, scheduling) into them. Single <Figure>.
