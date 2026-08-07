# Brief: minimum-spanning-trees

Goal: implement Kruskal's and Prim's; justify both by the cut property.
Synthesis lesson closing the weighted module: greedy + exchange argument +
union-find + priority queue all cash out here.

## Sources to consult
- CLRS Ch. 21: §21.1 (the generic method: invariant "A is a subset of some
  MST"; cuts, crossing edges, light edges; Theorem 21.1 with the
  exchange-argument proof; Figs 21.2-21.3 the cut diagrams), §21.2
  (Kruskal via disjoint sets; Prim via priority queue; both O(E log V)).
- Erickson Ch. 7: Lemma 7.1 (distinct weights ⇒ unique MST; the
  tie-breaking trick making weights effectively distinct); the generic
  safe/useless-edge framework; §7.3 Borůvka advocacy (mention-level
  outlook); Figs 7.3-7.5 — the SAME small graph run through all
  algorithms (adopt this device).
- Sedgewick 4.3: cut property statement; the historical table of MST
  improvements ending "20xx: ???" (linear-time deterministic MST still
  open — honest frontier note); single-link clustering = Kruskal stopped
  at k components.
- Dijkstra 1959 Problem 1 (the same paper again — Prim's algorithm
  independently; ties back to the Dijkstra lesson's artifact).
- CMU 15-210 L21 (Blue/Red rules framing — optional enrichment).

## Key points the lesson must cover
1. The problem: connect all vertices, minimize total edge weight; the
   answer is a spanning TREE (any cycle edge could be dropped — carry
   this micro-argument); n−1 edges.
2. The cut property (Theorem 21.1) with its exchange proof carried in
   full: light edge e across cut (S, V−S); any spanning tree without e
   plus e contains a cycle crossing the cut somewhere else at weight ≥
   w(e); swap improves-or-ties. This is THE proof of the lesson —
   explicit spiral to the greedy lesson's exchange schema.
3. Kruskal: edges by increasing weight, add unless it closes a cycle;
   cycle test = union-find (cash out the union-find lesson's E7
   exercise); correctness = cut property applied to the cut separating
   the two components being joined; O(E log E) from the sort.
4. Prim: grow one tree from a root; frontier edges in a priority queue;
   correctness = cut property on (tree, rest); O(E log V); the
   structural rhyme with Dijkstra stated precisely — same loop, different
   key (edge weight vs path length) — and the warning that they answer
   DIFFERENT questions (L13 slot: "MST paths are shortest paths" — false;
   counterexample triangle with weights 1,1,1.5).
5. Both on the same worked graph, same MST out (unique because distinct
   weights); tie-handling one paragraph (multiple MSTs, same total).
6. Edge-weight signs never matter (contrast with the shortest-path saga —
   one crisp sentence why: the exchange argument never sums paths).
7. Applications + outlook: network design (the origin problem — Borůvka
   1926, electrification of Moravia), clustering as Kruskal-stopped-early;
   the still-open linear-time question.

## Worked examples and set pieces
- **One 8-vertex weighted graph through both algorithms** (Erickson's
  same-example device): Kruskal's forest merging vs Prim's frontier
  growth, both FigureSequences, same final tree.
- **MST ≠ shortest paths counterexample**: the 3-vertex triangle — MST
  picks {1,1}, but the 1.5 edge is the shortest s-t path.
- **History set piece**: Borůvka 1926 (power grid), Kruskal 1956, Prim
  1957, Dijkstra 1959's Problem 1 — then the improvement table to
  Chazelle/Pettie-Ramachandran and "still open" (Sedgewick 4.3). Two
  paragraphs max, References-anchored.
- **Clustering**: single-link clustering on 2-D points = Kruskal stopped
  at k components — the L16-flavored cross-domain payoff.
- E3 spiral exercises: union-find ops count during Kruskal; heap ops
  during Prim; exchange-argument drill on a fresh cut.
- E7 forward-reach exercise: "connect offices where some links are
  forbidden / must-include" — modeling twists that preview reductions
  thinking (<Ref> reductions-between-problems).

## Pitfalls
- Prove the cut property ONCE, then derive both algorithms from it; do
  not run two separate correctness proofs.
- Distinct-weights assumption: state Erickson's lexicographic
  tie-breaking as the hygiene move; don't belabor multiple-MST theory.
- Borůvka: outlook paragraph only (parallel-friendliness one sentence);
  course 2 owns contraction.
- Do not conflate "safe edge" formalism with the plain cut property —
  use one vocabulary (cut property) and mention "safe edge" as CLRS's
  term once.

## FIGURE PLAN
- draw: cut diagram — vertex set split into two shaded regions, crossing
  edges emphasized, the lightest crossing edge highlighted. Single
  <Figure>. Inspired by CLRS Fig 21.2.
- draw: <FigureSequence>, 3 frames: the exchange proof — tree T without
  light edge e; T+e's cycle with the other crossing edge e′ marked;
  T+e−e′ re-drawn with the weight comparison tally. Inspired by CLRS
  Thm 21.1.
- draw: <FigureSequence>, 5-6 frames: Kruskal on the worked graph — edges
  considered in weight order, accepted edges bold, rejected
  (cycle-closing) edges crossed out, union-find components as colored
  blobs merging. Inspired by Erickson Fig 7.5 / VisuAlgo.
- draw: <FigureSequence>, 5-6 frames: Prim on the same graph — tree
  region growing, frontier PQ contents listed per frame; final frame
  identical MST to Kruskal's. Inspired by Erickson Figs 7.3-7.4.
- draw: MST-vs-shortest-path triangle counterexample — the 1/1/1.5
  triangle with both objects drawn. Single <Figure>, small.
- draw: history strip — 1926 Borůvka → 1956 Kruskal → 1957 Prim → 1959
  Dijkstra(P1) → … → "linear time? open". Single <Figure>. Inspired by
  Sedgewick 4.3's table.
