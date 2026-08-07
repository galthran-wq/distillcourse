# Brief: p-np-and-np-completeness

Goal: explain P, NP, and NP-completeness. The course's capstone theory
lesson, grounded in two primary artifacts (Cook 1971, Karp 1972).

## Sources to consult
- CLRS §34.1-34.3: decision problems; P; polynomial-time verification and
  certificates (NP); reductions ≤_p; NP-completeness; Fig 34.3 (the
  P/NP/NPC Venn under the possible world-orders — recreate).
- Cook 1971 (primary, research/texts/): Theorem 1 = the Cook-Levin
  construction (tableau → CNF, variable families P/Q/S and clause groups
  B..I); the Section-2 quote stating P-vs-NP before the names existed
  ("…a major breakthrough in complexity theory"); the paper never says
  "NP", "SAT", or "NP-complete" — the terminological-gap teaching moment.
- Karp 1972 (primary): Main Theorem — the 21 problems; Figure 1 reduction
  tree (source image + house redraw); the 2009 retrospective (first
  presented at a seminar at Knuth's home; failed to classify LP, graph
  isomorphism, primality).
- MIT 6.006 L19: P ⊆ NP ⊆ EXP scaffolding kept light; the memorable
  NP-complete zoo (Sudoku, Minesweeper, Tetris, most video games) —
  one-line texture.
- Sedgewick 6.6: Gödel's 1956 letter to von Neumann anticipating P=NP —
  dated aside.
- Erickson §12.1-12.6 for a modern reduction presentation style (strip
  the salesman fiction per L9).

## Key points the lesson must cover
1. Decision problems as the level playing field; P defined; everything in
   this course so far lives in P (one-paragraph roll call — spiral).
2. NP via verification: a certificate + a polynomial-time checker; worked
   certificate examples (Hamiltonian cycle: the tour; SAT: the
   assignment; composite: the factor). P ⊆ NP (a solver is a checker).
   L13 slot — THE misconception: "NP = not polynomial / exponential".
   Refute head-on: NP is about checking, P ⊆ NP, and P vs NP is open
   precisely because no separation is known.
3. SAT defined concretely (variables, clauses, one satisfiable and one
   unsatisfiable 3-clause instance worked by hand).
4. Cook-Levin: every NP problem ≤_p SAT. Proof at the tableau-intuition
   level: an accepting computation is a T×T grid of local facts; local
   consistency is a big-but-polynomial CNF; a satisfying assignment IS an
   accepting computation. (Full construction cited to Cook 1971 / CLRS
   §34.3; the lesson carries the shape, not the clause bookkeeping.)
5. NP-completeness defined; the bootstrapping principle: with SAT in
   hand, ONE reduction SAT ≤_p X (plus X ∈ NP) makes X complete — carry
   one full reduction: SAT → CLIQUE (Karp's own construction: node =
   (literal, clause), edges between compatible literals in different
   clauses, k = #clauses; both correctness directions).
6. Karp's 21 and the spread since (thousands of problems); what a
   completeness proof buys an engineer: recognizing "my scheduling
   problem contains vertex cover" ends the search for an exact fast
   algorithm.
7. The open frontier, honestly: P vs NP (Millennium Prize); the
   in-between problems — LP (in P since Khachiyan 1979), primality (in P
   since AKS 2002), graph isomorphism (quasi-polynomial, Babai
   2015/2016, still not known in P or complete) — Karp's own 1972
   failures, resolved or still open. Close: what to DO about an
   NP-complete problem is the next lesson (L10c).

## Worked examples and set pieces
- **The terminological gap**: Cook 1971 states the field's central
  conjecture with none of today's words — quote the Section-2 sentence
  verbatim (inline naming justified: primary artifact being read, L8a).
- **Karp's origin story** (2009 retrospective): first told at Knuth's
  house; the Lawler/Tarjan attribution paragraph — reductions as a
  community effort; Karp could not crack undirected Hamiltonian cycle
  himself.
- **SAT → CLIQUE worked fully** on a 3-clause formula: the compatibility
  graph drawn, the satisfying assignment ↔ triangle correspondence
  checked both ways.
- **The 21-problem tree**: house redraw + the original as artifact.
- E3 spiral exercise: verify a certificate in polynomial time (write the
  checker's steps) for subset sum.
- E7 forward-reach exercise: your NP-complete scheduling instance has 30
  tasks — brute force 2^30 ≈ 10^9 is feasible; 60 tasks is not; the
  reader computes the wall the coping lesson addresses (<Ref>
  coping-with-np-hardness).

## Pitfalls
- Keep Turing-machine formalism OUT; "algorithm + input encoding"
  suffices at this course's level (CLRS's language-theoretic apparatus
  cited, not taught).
- NP-hard vs NP-complete distinction: one precise paragraph
  (completeness = hard ∧ in NP; optimization versions are NP-hard).
- Do not attempt a second full reduction; the reduction PRACTICE catalog
  is course 2 (say so).
- co-NP, EXP, PSPACE: at most a one-sentence map pointer.
- The Levin co-attribution: one sentence (independent 1973 Soviet
  discovery; sources.yaml cite).

## FIGURE PLAN
- draw: P/NP/NP-complete Venn — the two possible worlds (P ≠ NP with NPC
  ring disjoint from P; P = NP collapse), side by side. Single <Figure>.
  Inspired by CLRS Fig 34.3 / Erickson Fig 12.3.
- draw: solver-vs-verifier schematic — same instance fed to "find a
  solution" vs "check this certificate" boxes with their costs. Single
  <Figure>.
- draw: Cook-Levin tableau — computation history as a time × tape grid;
  one 2×3 window highlighted with "local rule → clauses" callout; the
  whole grid bracketed as "one big CNF". Single <Figure>. Inspired by
  the standard tableau picture (Cook's paper has NO figure — that
  absence is itself noted in prose).
- draw: <FigureSequence>, 4 frames: SAT → CLIQUE on the 3-clause
  instance — formula; node grid by clause; compatibility edges; the
  k-clique ↔ satisfying assignment highlighted both ways. Inspired by
  Karp's construction.
- source: thecomplexit-theorem1-construction — save under figures/ as
  `cook-1971-theorem1-page.png`. Reader must be able to see: the
  typewritten clause-group definitions (B, C, D … I) and the handwritten
  marginal correction. Placement: float right beside the Cook-Levin
  section's history paragraph. (The founding page of NP-completeness.)
- source: reducibility-fig1-complete-problems — save under figures/ as
  `karp-1972-fig1-tree.png`. Reader must be able to see: SATISFIABILITY
  at the root and legible problem names down the tree. Placement:
  centered in the Karp section, paired with our redrawn tree (artifact
  vs house diagram, explicitly captioned as such).
- draw: house-style redraw of the reduction tree, updated: SAT at root,
  the 21 problems, plus a "…thousands more (1972-today)" fringe. Single
  <Figure>.
- draw: what-happened-next timeline — LP 1979 / primality 2002 / graph
  isomorphism 2015-still-open / P vs NP open, on one time axis. Single
  <Figure>.
