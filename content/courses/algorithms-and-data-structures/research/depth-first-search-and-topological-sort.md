# Brief: depth-first-search-and-topological-sort

Goal: implement DFS; classify edges; detect cycles; topologically sort.
The structural traversal: where BFS measures distance, DFS exposes
structure (timestamps, edge classes, ordering).

## Sources to consult
- CLRS §20.3 (DFS with discovery/finish times; parenthesis theorem
  Fig 20.4-20.5 — the nested-intervals timeline; white-path theorem at
  mention level), §20.4 (topological sort; Professor Bumstead's clothing
  DAG Fig 20.7 — the memorable example, recreate dryly as a
  getting-dressed dependency DAG).
- Erickson Ch. 6: §6.1 (pre/post numbering; the four edge classes and the
  Lemma 6.1 interval characterization; the active-interval Gantt
  diagrams Figs 6.4/6.5), §6.2 (dag ⟺ no back edge), §6.3 (reverse
  postorder IS topological order — with proof by the edge-case analysis).
- MIT 6.006 L10 (full-DFS wrapper; cycle detection returning the actual
  cycle via ancestor stack).
- VisuAlgo /dfsbfs for the edge-class color convention (tree/back/
  forward-cross) the figures should standardize on.

## Key points the lesson must cover
1. bag = stack (or recursion) in the skeleton from last lesson — DFS
   plunges; the recursion stack is the implicit data structure
   (stacks-and-queues callback).
2. Discovery/finish timestamps; the parenthesis property: two vertices'
   intervals are nested or disjoint, never interleaved — proved from the
   recursion structure; the timeline figure carries it.
3. Edge classification on directed graphs: tree / back / forward / cross,
   each defined by the endpoints' interval relation; worked on one
   annotated example graph.
4. Cycle detection: a back edge (to a vertex still on the stack) exists
   iff a cycle exists — both directions argued; recovering the cycle from
   the stack.
5. Topological sort: DAG defined via dependencies; reverse finish order
   respects every edge — the case analysis (for edge u→v, v finishes
   first in every case unless a back edge exists). Worked on the
   getting-dressed DAG; non-uniqueness stated with two valid orders.
6. Cost O(V+E), same accounting as BFS.
7. Close: DFS timestamps power one more trick — mutually-reachable
   clusters (L10c → SCC).

## Worked examples and set pieces
- **Getting-dressed DAG** (CLRS Fig 20.7, "Professor Bumstead"): socks
  before shoes, shirt before tie before jacket — recreate as a dry
  dependency DAG (no professor persona; L9), with the sorted line-up
  below. THE topological-sort teaching example; also the build-system /
  course-prerequisite framing for engineers.
- **Parenthesis timeline** (CLRS Fig 20.4 / Erickson Fig 6.4): vertices
  as bracketed intervals on a time axis, nesting visible — recreate.
- **Cycle witness walkthrough**: add one edge to the dressing DAG (tie →
  socks) and watch detection fire with the recovered cycle.
- E7 forward-reach exercise: run DFS on a graph with two mutually
  reaching clusters; observe finish times separate the clusters — the
  observation Kosaraju's algorithm exploits (<Ref>
  strongly-connected-components).

## Pitfalls
- Undirected DFS has only tree/back edges — one sentence; the lesson
  works in directed graphs (say so up front).
- "Topological sort = sort by in-degree" (Kahn's algorithm) is a
  different valid algorithm; one sentence naming it, not two treatments.
- Recursion depth = stack overflow on deep graphs; one implementation
  note (explicit stack).
- The white-path theorem: name-drop only if SCC needs it; prefer keeping
  the SCC lesson self-contained at intuition level.
- Timestamps are bookkeeping, not wall-clock — trivial but worth one
  clause.

## FIGURE PLAN
- draw: skeleton card updated — bag = stack row filled in; recursion
  noted as the implicit stack. Single <Figure>, small (format-contract
  continuity with the BFS lesson).
- draw: <FigureSequence>, 5-6 frames: DFS on the running example — one
  discovery or finish event per frame, timestamps stamped d/f, stack
  contents shown. Inspired by CLRS §20.3's trace.
- draw: parenthesis timeline — each vertex an interval bar [d, f] on a
  shared axis, nested/disjoint structure visible, one would-be
  interleaving crossed out. Single <Figure>. Inspired by CLRS Fig 20.4 /
  Erickson's active-interval Gantt.
- draw: edge-classification gallery — one digraph with its DFS tree bold
  and one edge of each class (tree/back/forward/cross) color-coded,
  interval relations annotated beside each class. Single <Figure>.
  VisuAlgo color convention.
- draw: getting-dressed DAG with the reverse-finish-order line-up
  beneath, arrows all pointing rightward along the line. Single
  <Figure>. Inspired by CLRS Fig 20.7 (recreate, depersonalized).
- draw: <FigureSequence>, 3 frames: cycle detection — the added tie→socks
  edge, DFS reaching it while the target is on-stack, the cycle read off
  the stack. 
