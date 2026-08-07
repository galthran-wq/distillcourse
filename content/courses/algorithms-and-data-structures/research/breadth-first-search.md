# Brief: breadth-first-search

Goal: implement BFS and use it for unweighted shortest paths. The first
traversal — establishes visited-set discipline, the frontier, O(V+E)
accounting, and the parent-pointer tree that every later graph algorithm
reuses.

## Sources to consult
- CLRS §20.2: BFS with the white/gray/black coloring (simplify to
  visited/frontier/unvisited), the layer-by-layer correctness argument,
  shortest-path tree via parent pointers.
- MIT 6.006 L09: the level-set formulation L₀, L₁, L₂ … and the induction
  proof that BFS order = distance order; O(V+E) via each vertex enqueued
  once, each edge examined once (twice undirected — handshake callback).
- Erickson §5.5-5.6: WhateverFirstSearch with bag = queue ⇒ BFS — the
  unifying frame; plant it here in one paragraph (the DFS lesson and
  Dijkstra will instantiate the same skeleton; this is the module's
  format contract).
- Sedgewick 4.1: Kevin Bacon numbers / Erdős numbers as the application.

## Key points the lesson must cover
1. The traversal problem: visit everything reachable from s, once; the two
   ingredients from last lesson's exercise (visited set, frontier) made
   precise.
2. The generic skeleton (put s in the bag; repeatedly take a vertex, mark,
   add unmarked neighbors) — then: bag = FIFO queue gives BFS. One
   paragraph, one figure; named as a frame to be reused (Erickson's
   device).
3. BFS worked fully on the module's running example: queue contents,
   distances, parents at every step.
4. Why layers: induction on distance — when layer d is being processed,
   every vertex at distance d is already discovered with correct label.
   Carried at 6.006's level of rigor.
5. Cost O(V+E): each vertex enqueued ≤ once (visited check), each
   adjacency list scanned once.
6. The parent-pointer shortest-path TREE: path recovery by walking
   parents; edge count = distance.
7. Applications: unweighted shortest paths (the headline), connected
   components (loop over unvisited sources), bipartiteness via layer
   parity with an odd-edge witness — the last as a compact worked
   example.
8. Close: BFS answers "how few edges"; weighted "how cheap" needs
   Dijkstra (L10c forward seam); "explore deep first" is the other
   discipline (next lesson).

## Worked examples and set pieces
- **Kevin Bacon game** (Sedgewick 4.1): actors-movies bipartite graph;
  Bacon number = BFS distance /2 — the recognizable hook, one short
  section with a small worked actor graph.
- **Bipartiteness check**: run BFS on a 5-cycle vs a 6-cycle — odd cycle
  caught by a same-layer edge; even cycle 2-colors cleanly.
- **Level sets on a grid graph**: the ripple picture that VisuAlgo uses —
  distances as concentric diamonds; good demo preset alignment.
- E7 forward-reach exercise: put weights on the running example's edges
  and find a case where fewest-edges ≠ cheapest path — the wall Dijkstra
  removes (<Ref> shortest-paths-dijkstra).

## Pitfalls
- Mark vertices when ENQUEUED, not when dequeued — the classic bug that
  double-enqueues; make it an explicit warning (real misconception,
  L13-adjacent).
- Do not introduce edge classification here (DFS's tool).
- Queue is THE point — one sentence contrasting what a stack would do,
  saved for the DFS lesson's opening.
- Disconnected graphs: the wrapper loop in one paragraph, not a section.

## FIGURE PLAN
- draw: the generic traversal skeleton card — bag/marked-set/loop, with
  "bag = queue → BFS" filled in and two grayed future rows (stack → DFS,
  priority queue → Dijkstra). Single <Figure>. Inspired by Erickson's
  WhateverFirstSearch.
- draw: <FigureSequence>, 5-6 frames: BFS on the running example — one
  dequeue per frame; queue contents, visited shading, distance labels,
  parent arrows accumulating. Inspired by CLRS §20.2's trace.
- draw: level-set diagram — the graph redrawn with vertices grouped into
  columns L₀..L₃, all edges shown crossing at most one layer boundary.
  Single <Figure>. Inspired by 6.006 L09.
- draw: shortest-path tree extracted — parent edges solid, non-tree edges
  faint; one path walked back from a far vertex. Single <Figure>.
- draw: bipartiteness panel — 6-cycle 2-colored by layer parity beside a
  5-cycle with the violating same-layer edge flagged. Single <Figure>.
- draw: small actor-movie graph for the Bacon example — two actor columns
  bridged by movie nodes, one BFS distance annotated. Single <Figure>.
