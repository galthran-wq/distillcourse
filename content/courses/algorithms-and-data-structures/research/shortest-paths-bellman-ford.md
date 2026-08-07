# Brief: shortest-paths-bellman-ford

Goal: implement Bellman-Ford; handle negative weights; detect negative
cycles. Completes the SSSP landscape table and delivers the module's
real-world payoff (arbitrage).

## Sources to consult
- CLRS §22.1 (Bellman-Ford; Theorem 22.5 correctness; Fig 22.1 — why a
  reachable negative cycle makes δ = −∞; path-relaxation property
  Lemma 22.15 as the proof backbone).
- MIT 6.006 L12: the k-edge-distance view δ_k(s,v); witnesses — a vertex
  whose |V|-edge distance beats its (|V|−1)-edge distance certifies a
  negative cycle; the worked numeric example (weights −5, −4, 6, 3) with
  the round-by-round table — recreate this trace.
- Erickson §8.7: Bellman-Ford as the DP dist_{≤i}(v) recurrence — ties
  the previous lesson's correspondence back in (this algorithm IS a DP
  over edge-count-bounded paths); Moore's queue-based refinement at
  mention level.
- Sedgewick 4.4: arbitrage — currency table → complete digraph with
  weight = −ln(rate); product of rates > 1 ⟺ negative cycle; the worked
  $1000 → 741 EUR → 1012.206 CAD → $1007.14 loop.

## Key points the lesson must cover
1. The two distinct problems negative edges create: (a) Dijkstra's greedy
   proof breaks (last lesson's counterexample — recap sentence);
   (b) a reachable negative CYCLE makes "shortest" undefined (−∞ by
   looping) — these must not blur (L13 slot: "negative edges = no
   shortest paths" is false; only negative cycles kill the problem).
2. The algorithm: V−1 rounds of relax-every-edge. Correctness via the
   path-relaxation property: after round i, every shortest path using ≤ i
   edges is found; simple paths have ≤ V−1 edges. Carried with the
   induction explicit (spiral: this is DP-I's "subproblem = paths of ≤ i
   edges" in disguise — one paragraph making the DP view explicit per
   Erickson §8.7).
3. Full worked trace: the 6.006 example graph, distance table per round,
   convergence visible before round V−1 (early-exit optimization one
   sentence).
4. Detection: run round V; any improvement ⇒ negative cycle reachable
   from s; recovering the cycle by walking parents (sketch level).
5. Cost O(VE); the completed landscape table — BFS / DAG / Dijkstra /
   Bellman-Ford with their preconditions and costs; choosing by graph
   class is the module's takeaway skill.
6. Application: arbitrage detection — log-transform turns multiplicative
   rate products into additive weights; a profitable loop is exactly a
   negative cycle. Worked with 3 currencies end to end. (Also the
   module's L16 application slot, and a preview of "reduction" — name
   the word informally, <Ref> reductions-between-problems.)

## Worked examples and set pieces
- **Round-by-round table** (6.006 L12): the lesson's L7 centerpiece;
  parallel exercise on a fresh graph.
- **Negative-cycle demonstration**: a 3-vertex cycle summing to −1;
  walking it k times gives cost → −∞ — the undefinedness made concrete.
- **Arbitrage** (Sedgewick 4.4): real-looking rate table, −ln transform,
  the negative cycle found and cashed out in dollars: $1000 →
  $1007.14497 per loop. Keeper number.
- E3 spiral exercise: on a DAG with negative edges, compare Bellman-Ford
  O(VE) against topological relaxation O(V+E) — same answers, different
  cost; when do you pay for generality.
- E7 forward-reach exercise: the arbitrage transformation itself —
  "solve currency arbitrage using a shortest-path subroutine" is a
  reduction; the next module names and formalizes the move (<Ref>
  reductions-between-problems).

## Pitfalls
- V−1 is about SIMPLE paths, not "the algorithm needs V−1 rounds on
  every input" — early convergence is common; the bound is worst-case.
- Detection certifies a negative cycle REACHABLE FROM s only.
- Relaxation order within a round affects intermediate tables (not final
  answers) — fix a printed order for the trace and say so.
- Do not develop Johnson's algorithm / all-pairs (course 2); one closing
  sentence naming APSP as the next size up.

## FIGURE PLAN
- draw: the two failure modes side by side — panel A: negative edge,
  well-defined answer, Dijkstra merely wrong; panel B: negative cycle,
  −∞, no algorithm can answer. Single <Figure>. Inspired by CLRS
  Fig 22.1.
- draw: <FigureSequence>, 5 frames: Bellman-Ford rounds on the worked
  graph — the distance table as a growing grid (rows = rounds), improved
  entries highlighted per frame, stabilization visible. Inspired by
  6.006 L12's table.
- draw: k-edge-paths view — concentric "paths of ≤ k edges" sets
  expanding toward all simple paths at k = V−1. Single <Figure>.
  Inspired by Erickson §8.7's dist_{≤i} derivation.
- draw: <FigureSequence>, 3 frames: detection — round V finds an
  improvement, parent walk enters the cycle, the cycle isolated with its
  negative sum annotated.
- draw: arbitrage pipeline — rate table → digraph with −ln weights →
  negative cycle highlighted → the dollar walk-through of one loop.
  Single <Figure> (three joined panels). Inspired by Sedgewick 4.4's
  rates/arbitrage pair (redraw with fresh numbers).
- draw: the completed SSSP landscape table — four algorithms ×
  precondition × cost, the lesson's row now filled. Single <Figure>
  (styled table; format-contract continuity).
