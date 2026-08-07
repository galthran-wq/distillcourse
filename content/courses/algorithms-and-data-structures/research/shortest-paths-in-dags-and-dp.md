# Brief: shortest-paths-in-dags-and-dp

Goal: explain why DP = shortest paths on the subproblem DAG; compute DAG
shortest paths in O(V+E). Synthesis lesson — its content is a
CORRESPONDENCE, not a new algorithm family; keep it tight (est 26 min).

## Sources to consult
- Erickson §6.4: the central claim verbatim-adjacent — "memoized recursion
  is depth-first search; dynamic programming is postorder traversal of the
  dependency dag"; the edit-distance and longest-path-in-a-dag recurrences
  worked as graph traversals. THE grounding text for this lesson.
- Erickson §8.5 / MIT 6.006 L11: DAG relaxation — relax edges in
  topological order, O(V+E), negative weights fine (no cycles ⇒ no
  negative-cycle issue).
- MIT 6.006 L15 (the recursion-shape taxonomy: DP = DAG-shaped dependency
  graph); L11's SSSP-landscape table (which algorithm for which graph
  class) — recreate as the module's orientation card.
- Sedgewick 4.4: job-scheduling/critical-path via LONGEST path in a DAG —
  the engineering application (negate weights or max-relax).

## Key points the lesson must cover
1. DAG relaxation as an algorithm in its own right: topological order
   (spiral to DFS lesson) + one relaxation pass per edge; correctness by
   induction along the order (every predecessor final before v is
   processed); O(V+E); handles negative edge weights — the first
   algorithm here that does.
2. Worked trace on a small weighted DAG (include one negative edge to
   make the point).
3. The correspondence, built on a concrete case: coin change's recurrence
   drawn as a graph — nodes = amounts 0..T, edges = coin subtractions,
   edge weight 1; min-coins(T) IS the shortest path from T to 0. The
   reader has already filled this table (DP-I); now they see it as
   Dijkstra-free shortest paths because the dependency graph is acyclic.
4. Generalize: every DP's subproblem-dependency graph is a DAG (a cycle
   would make the recurrence circular); bottom-up fill order = a
   topological order; memoized recursion = DFS postorder. Edit distance's
   grid redrawn with arrows (cash out DP-II's E7 exercise).
5. Longest path: in general graphs NP-hard (one forward sentence →
   limits module); in DAGs trivial by max-relaxation — critical-path/
   project-scheduling worked briefly (Sedgewick's framing).
6. The module orientation card: unweighted → BFS; DAG → topological
   relaxation; nonnegative → Dijkstra; negative edges → Bellman-Ford
   (next lesson completes the table).

## Worked examples and set pieces
- **Coin-change-as-graph**: the lesson's centerpiece figure pair — the
  1-D table from DP-I beside the same data as a DAG with a highlighted
  shortest path.
- **Critical path**: a 6-task project DAG with durations; longest path =
  minimum completion time; which tasks are slack-free.
- E3 spiral exercise: run DAG relaxation over the edit-distance grid's
  DAG and confirm it reproduces the DP table.
- E7 forward-reach exercise: try topological-order relaxation on a graph
  WITH a cycle — no topological order exists; the reader hits the wall
  Bellman-Ford's V−1 rounds remove (<Ref> shortest-paths-bellman-ford).

## Pitfalls
- This lesson must not re-teach DP or re-teach topological sort — two
  <Ref>+recap sentences each (playbook: prerequisites are links).
- "DP = shortest paths" is an equivalence of COMPUTATION SHAPE, not of
  every DP objective (max/min/count all fit the same DAG with different
  ⊕/⊗); state the scope honestly — counting DPs are path-counting, not
  shortest-path.
- Longest-path-in-general-graphs hardness: assert + forward ref, no
  proof.
- Keep Sedgewick's arbitrage OUT (it belongs to Bellman-Ford/reductions).

## FIGURE PLAN
- draw: <FigureSequence>, 4 frames: DAG relaxation — topological order
  lined up left to right, one vertex's outgoing edges relaxed per frame,
  distance labels finalizing left to right (one negative edge included).
  Inspired by 6.006 L11.
- draw: the coin-change correspondence pair — top: the DP table row for
  amounts 0..8 with backpointers; bottom: the identical structure as a
  DAG with the shortest path highlighted; matching colors bind cells to
  nodes. Single <Figure> (the lesson's centerpiece).
- draw: edit-distance grid as a DAG — cells as nodes, the three arrow
  types (right/down/diagonal) with weights, one optimal path traced.
  Single <Figure>. Inspired by Erickson §6.4's dependency-graph device.
- draw: memoized-recursion-as-DFS panel — the fib(6) DAG from DP-I with
  DFS postorder numbers annotated matching the fill order. Single
  <Figure>.
- draw: critical-path project DAG — 6 tasks with durations, longest path
  bold, slack tasks grayed. Single <Figure>. Inspired by Sedgewick 4.4's
  job-scheduling sequence.
- draw: SSSP landscape card — graph class × algorithm × cost (BFS /
  DAG-relax / Dijkstra / Bellman-Ford row pending). Single <Figure>
  (styled table). Inspired by 6.006 L11's table.
