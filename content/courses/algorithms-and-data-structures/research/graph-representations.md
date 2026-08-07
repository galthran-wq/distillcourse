# Brief: graph-representations

Goal: compare adjacency-list and adjacency-matrix representations and select
by operation cost. Opens the graph arc — the lesson also carries the "graphs
are everywhere in disguise" case, backed by real artifacts.

## Sources to consult
- Erickson §5.1-5.4: the history (Königsberg; Tabula Peutingeriana; the
  canon-law marriage trees; the word 'graph' 1878); definitions
  (walk/path/cycle/connected/tree/DAG); "a graph is not its drawing"
  (Figs 5.4/5.5); Table 5.1 (adjacency list vs matrix costs) and Figs
  5.10/5.11 (one graph, both representations).
- CLRS §20.1 (representations; the handshake-lemma Θ(V+E) space count).
- Sedgewick 4.1 (the graph-applications table: maps, circuits, schedules,
  hypertext, social networks; the blogosphere image lives in 4.2's deck).
- VisuAlgo /graphds for the operations checklist.

## Key points the lesson must cover
1. The model: G = (V, E); directed vs undirected; weighted vs unweighted;
   degree; the disguised-graph gallery (dependency lists, road networks,
   call graphs, hyperlinks, state machines) — each one sentence.
2. Vocabulary in one disciplined section (L11c: ≤3 new terms per
   paragraph): path, cycle, connectivity, tree as connected acyclic graph,
   DAG. Defer anything not needed by the next three lessons.
3. A graph is not its drawing: same edge set, two layouts — isomorphism
   at intuition level only.
4. Adjacency list: per-vertex neighbor bags; Θ(V+E) space (handshake
   argument carried); neighbors of v in O(deg v); edge test O(deg v).
5. Adjacency matrix: Θ(V²) space; O(1) edge test; O(V) neighbor listing;
   undirected symmetry.
6. The selection rule: sparse (E ≪ V²) — the overwhelmingly common case —
   favors lists; dense graphs or edge-test-heavy workloads favor the
   matrix. Concrete scale computation: a 1M-node road network at avg
   degree 4 ⇒ list ~MBs, matrix 10^12 cells — keeper numbers.
7. Close: representation fixed, the next question is systematic
   exploration (L10c → BFS).

## Worked examples and set pieces
- **One 6-8 vertex graph carried through everything**: drawing, adjacency
  list, adjacency matrix, degree table — and reused by the next three
  lessons (the module's running example; pick it here and say so in the
  brief for bfs/dfs/scc).
- **Königsberg 1736** (Erickson §5.1 / Sedgewick 4.1): the founding
  problem — city map → multigraph abstraction; state Euler's
  even-degree answer in two sentences (proof out of scope). Source image.
- **Roman roads** (Tabula Peutingeriana): route diagrams predate
  computing by two millennia — one paragraph with the artifact
  (alternative: use in an Aside if the lesson gets image-heavy).
- **Political blogosphere** (Adamic-Glance 2005): a real measured graph
  whose STRUCTURE (two clusters) is visible only through graph eyes —
  the "graphs reveal structure" payoff. Source image.
- E7 forward-reach exercise: hand-simulate "visit every vertex reachable
  from s" on the running example and notice the need for a visited set
  and a frontier discipline — BFS's ingredients (<Ref>
  breadth-first-search).

## Pitfalls
- Do not teach traversal here; the frontier exercise only sets the table.
- Multigraphs/self-loops: one sentence each, then simple graphs assumed.
- Edge-list representation: one sentence (Kruskal will want it —
  forward note).
- Keep the artifact images to two; the marriage trees and Varignon
  engravings stay in the pool unclaimed (seductive-details risk).

## FIGURE PLAN
- draw: the running-example graph — drawing + adjacency list + adjacency
  matrix side by side, one vertex's row/list color-linked across all
  three views. Single <Figure>. Inspired by Erickson Figs 5.10/5.11.
- draw: directed and weighted variants of the same graph — arrowheads,
  then edge labels; the adjacency structures updated alongside. Single
  <Figure>.
- draw: "a graph is not its drawing" — the same 6-vertex edge set in two
  very different layouts, edge lists shown identical. Single <Figure>.
  Inspired by Erickson Fig 5.4.
- draw: cost/space comparison table — list vs matrix × space / edge test /
  enumerate neighbors / add edge, with the sparse-vs-dense verdict row.
  Single <Figure> (styled table). Inspired by Erickson Table 5.1.
- source: algorithmspa-s2-konigsberg-bridges — save under figures/ as
  `konigsberg-1736.png` (crop the engraved map + multigraph panel).
  Reader must be able to see: the river/island map with the seven
  bridges and the abstracted multigraph beside it. Placement: float
  right beside the history opening. (Historical artifact of the founding
  problem.)
- source: algorithmspa-s2-political-blogosphere-graph — save under
  figures/ as `blogosphere-2004.png`. Reader must be able to see: the
  two red/blue clusters and the sparse links between them. Placement:
  centered in the "graphs reveal structure" section. (Published
  visualization of measured data; a redraw would fabricate the dataset.)
- draw: scale panel — 1M-vertex, 4M-edge network: list vs matrix memory
  bars (linear vs 10^12). Single <Figure>, small.
