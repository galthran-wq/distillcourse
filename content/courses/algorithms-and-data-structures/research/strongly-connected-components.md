# Brief: strongly-connected-components

Goal: compute SCCs with two DFS passes (Kosaraju). Worked-practice lesson
cashing out DFS finish times; the condensation DAG is the structural
payoff that lets DAG techniques apply to cyclic graphs.

## Sources to consult
- Erickson §6.5-6.6: definitions; scc(G) is a DAG; Lemma 6.2 (strong
  components are contiguous in any DFS forest); the Kosaraju-Sharir
  two-pass algorithm WITH full proof (Lemma 6.3); Figs 6.13/6.14 (graph
  with SCCs circled → condensation) and 6.16/6.17 (the two-pass trace) —
  the figure sequence to recreate. Tarjan's one-pass algorithm: mention
  + citation only (Tarjan 1972).
- CLRS §20.5 (Theorem 20.16; the G^T formulation).
- Sedgewick 4.2 (applications: web link clusters, kidney-exchange cycle
  matching — one-liners).

## Key points the lesson must cover
1. Mutual reachability as an equivalence relation; SCCs as its classes;
   worked identification by eye on an 8-vertex digraph.
2. The condensation: contract each SCC to a node — always a DAG (a cycle
   of SCCs would merge them; carry this one-paragraph argument). Payoff:
   any cyclic graph = DAG of tangles; topological order applies to the
   condensation (spiral to the previous lesson).
3. Why naive fails: one DFS from one vertex overshoots (reaches things
   that don't reach back); per-pair reachability is O(VE)-ish — the
   flaw the two-pass trick fixes.
4. Kosaraju's algorithm mechanically: (pass 1) DFS on G, record finish
   order; (pass 2) DFS on the reverse graph G^R in decreasing finish
   order; each pass-2 tree is exactly one SCC. Full trace on the
   8-vertex example.
5. The correctness intuition carried honestly (Erickson's level): the
   vertex with the latest finish time lies in a source SCC of G; in G^R
   that SCC is a sink, so pass 2's first tree cannot escape it; induct.
   (State as an argument with the key lemma, not a full formal proof.)
6. Cost: two DFS passes + one graph reversal = O(V+E).

## Worked examples and set pieces
- **The 8-vertex running trace** (adapt Erickson Figs 6.16/6.17): both
  passes shown completely — finish numbers from pass 1, the pass-2
  forest with each tree circled as an SCC.
- **Condensation payoff example**: a package-dependency graph with a
  cycle of mutually-importing modules; condensation gives the legal
  build order of CLUSTERS — ties the module to engineering reality.
- E3 spiral exercise: topologically sort the condensation (previous
  lesson's algorithm on this lesson's output).
- E7 forward-reach exercise: assign weights and ask for cheapest routes —
  traversal alone stops answering; the weighted module opens next
  (<Ref> shortest-paths-dijkstra).

## Pitfalls
- Do NOT attempt Tarjan's low-link algorithm — cite it as the one-pass
  refinement; Kosaraju is the teachable one.
- G^T reversal cost: note adjacency-list reversal is O(V+E), an easy
  exercise.
- "SCC" applies to DIRECTED graphs; undirected connectivity is plain
  components (BFS lesson) — one disambiguating sentence (real confusion).
- The proof can eat the lesson; keep it at key-lemma + induction sketch
  and label anything deeper as References (Erickson §6.6).

## FIGURE PLAN
- draw: digraph with SCCs circled — the 8-vertex example, mutual-reach
  pairs shaded per component. Single <Figure>. Inspired by Erickson
  Fig 6.13.
- draw: its condensation DAG beside it — each blob a node, arrows
  deduplicated; a topological order of the blobs listed underneath.
  Single <Figure>. Inspired by Erickson Fig 6.14.
- draw: <FigureSequence>, 3 frames: why-a-cycle-of-SCCs-merges — two
  circled components, an edge each way, the merged single component.
- draw: <FigureSequence>, 6 frames: Kosaraju trace — pass-1 DFS with
  finish numbers (2 frames), the reversed graph (1 frame), pass-2 trees
  peeling off one SCC at a time (3 frames). Inspired by Erickson
  Figs 6.16/6.17.
- draw: source-SCC/sink-SCC intuition panel — G and G^R side by side,
  the latest-finisher's component marked source in one, sink in the
  other. Single <Figure>.
