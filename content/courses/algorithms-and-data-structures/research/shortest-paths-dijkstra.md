# Brief: shortest-paths-dijkstra

Goal: justify Dijkstra's correctness for nonnegative weights; implement with
a binary heap. Opens the weighted module; also the union of three earlier
threads (BFS's frontier, the heap, greedy choice + its proof obligation).

## Sources to consult
- Dijkstra 1959 (primary; research/texts/anote-dijkstra1959.txt): Problem 2 —
  the A/B/C node partition (settled/frontier/unseen), the two repeated
  steps, prose only. Remark 2 = tentative-vs-final distance labels. The
  storage-frugality motivation ("fewer than n branches stored") — 1959's
  scarce resource was memory.
- Erickson §8.1-8.6: the tense-edge/Relax primitive as the shared atom of
  ALL shortest-path algorithms (adopt this framing: define relaxation
  first, then Dijkstra as best-first relaxation); Theorem 8.5 correctness
  via extraction order nondecreasing; the negative-edge pathology
  (exponential Shier-Witzgall behavior at mention level; the simple
  wrong-answer example is what the lesson needs).
- CLRS §22.3 (Theorem 22.9 correctness — the cut-style argument; triangle
  inequality and upper-bound properties from §22.5 as the lemma kit).
- MIT 6.006 L13: the changeable-priority-queue interface; the running-time
  table by PQ backing (array O(V²), binary heap O((V+E) log V), Fibonacci
  O(E + V log V) — cite-level); worked numeric trace table.
- VisuAlgo /sssp: the "Dijkstra killer" adversarial graph idea for the
  broken-case demo preset.
- Image pool: mit6-dijkstra-photo, algorithmspa-s2-dijkstra-portrait-quotes
  available but NOT claimed (portrait adds no instructional load; keep the
  1959 page as the one artifact).

## Key points the lesson must cover
1. The problem shift: BFS's "fewest edges" → "minimum total weight"; the
   counterexample from BFS's E7 exercise (cheap long path beats expensive
   short one).
2. Relaxation defined once, as the module's atom: if dist[u] + w(u,v) <
   dist[v], improve dist[v] and set parent. Safety: relaxation never makes
   a distance too small (upper-bound property, one-paragraph argument).
3. Dijkstra = BFS with the FIFO queue replaced by a min-priority queue on
   tentative distance; the three vertex states (settled / frontier /
   unseen) mapped explicitly onto the 1959 paper's A/B/C sets.
4. Full worked trace on a 7-8 vertex weighted graph: extract-min order,
   relaxations, the distance table per step (6.006-style).
5. Correctness: when u is extracted, dist[u] is final — the argument via
   "any other route to u must exit the settled set through a frontier
   vertex at least as far away, and edges cannot shrink it" (nonnegativity
   used EXACTLY here; flag the line). Greedy + exchange-flavored reasoning:
   spiral to the greedy lesson's proof obligation.
6. The failure mode: one negative edge, wrong answer, NO error signaled —
   worked micro-example (3-4 vertices). Sets up Bellman-Ford (L10c).
7. Implementation: binary heap + lazy deletion (re-insert, skip stale
   entries) vs decrease-key; O((V+E) log V); the PQ-backing table.

## Worked examples and set pieces
- **The 1959 paper as artifact**: the algorithm's first publication is
  nine sentences of prose, no pseudocode, no diagrams — the visited/
  frontier picture every textbook draws was invented by later teachers.
  Storage, not speed, was the selling point. Short history section with
  the source image; also note the same 3-page note contains Problem 1 =
  Prim's MST algorithm (forward <Ref> minimum-spanning-trees).
- **Full trace table** (6.006 L13 flavor): extraction order vs final
  distances — the lesson's L7 centerpiece with a parallel exercise graph.
- **Negative-edge counterexample**: settled-too-early vertex with the
  wrong final label; the reader traces exactly which proof line broke.
- E7 forward-reach exercise: run V−1 rounds of relax-every-edge on the
  broken example and watch correct distances emerge — Bellman-Ford
  before it is named (<Ref> shortest-paths-bellman-ford).

## Pitfalls
- "Dijkstra fails on negative edges" must be shown, not asserted — and
  distinguished from "negative cycles make the problem undefined" (next
  lesson's territory; keep the two failure modes separate).
- Decrease-key vs lazy re-insertion: pick lazy for the implementation
  (simpler, same asymptotics up to log factors), note decrease-key + the
  Fibonacci-heap bound as cite-level (course 2).
- Do not present Dijkstra as "just BFS generalized" without the proof —
  the greedy-finalization step is where all the mathematical content is.
- Directed vs undirected: works for both; state once (1959's Remark 1).

## FIGURE PLAN
- draw: relaxation atom — edge (u,v) with dist labels before/after,
  the improvement condition annotated; parent pointer flip shown. Single
  <Figure>, co-located with the definition.
- draw: three-state partition diagram — settled core, frontier ring,
  unseen outside; labeled both with our terms and A/B/C from the 1959
  paper. Single <Figure>.
- draw: <FigureSequence>, 6-7 frames: full Dijkstra trace on the worked
  graph — one extract-min per frame; PQ contents, distance table,
  settled shading, relaxed edges flashing. Inspired by 6.006 L13's
  numeric trace and the VisuAlgo stepper.
- draw: correctness picture — the settled set as a region, a hypothetical
  cheaper path to u forced to cross the frontier at y with
  dist[y] ≥ dist[u], nonnegative suffix annotated. Single <Figure>.
  Inspired by CLRS Thm 22.9's argument.
- draw: <FigureSequence>, 3 frames: the negative-edge failure — the small
  graph, the premature settlement, the correct-vs-reported table.
- source: anote-p2-problem2 — save under figures/ as
  `dijkstra-1959-problem2.png`. Reader must be able to see: the
  "Problem 2" heading and the Step 1 / Step 2 prose paragraphs of the
  original typeset page. Placement: float right beside the history
  section. (The algorithm's first publication; a redraw would destroy
  the no-pseudocode point.)
- draw: running-time table by PQ backing — array / binary heap /
  (Fibonacci, cited) with the sparse-vs-dense verdict. Single <Figure>
  (styled table). Inspired by 6.006 L13.
