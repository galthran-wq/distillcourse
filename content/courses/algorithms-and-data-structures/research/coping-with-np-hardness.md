# Brief: coping-with-np-hardness

Goal: select a practical strategy for an NP-hard problem. The course
finale and the limits module's L16 application: a decision procedure for
the working engineer, each branch demonstrated on a real algorithm with a
proven guarantee or an honest lack of one.

## Sources to consult
- CLRS §35.1 (APPROX-VERTEX-COVER, Theorem 35.1 — the 2-approximation
  with its charging argument; five lines of algorithm, one page of
  proof), §35.2 (TSP: 2-approx via MST doubling under triangle
  inequality; Theorem 35.3 — NO constant-factor approximation for
  general TSP unless P=NP, the gap-creating reduction sketched).
- Williamson & Shmoys Ch. 1 (definitions: α-approximation, PTAS, FPTAS;
  the "Fast. Cheap. Reliable. Choose two." framing — usable dryly),
  Ch. 2.4 (Christofides 3/2; unbeaten since ~1976 — Ch. 17's open-problem
  framing for the honest-frontier note).
- MIT 6.006 L18 (pseudopolynomial time: knapsack/subset-sum O(nT);
  weak-vs-strong NP-hardness at mention level) + Erickson §12.12
  "Caveat Reductor" (the "didn't we already solve subset sum with DP —
  where's my million dollars?" reconciliation — the single best
  misconception-resolver in the sources).
- MIT 6.046 L17 (vertex-cover natural greedy is only log-factor;
  set-cover ln n greedy — cite-level texture), L18 (fixed-parameter
  2^k·V vertex cover — one paragraph).
- Sedgewick 6.6 (N=1000 TSP brute force vs every electron in the
  universe — the scale gem).
- VisuAlgo /mvc, /tsp, /steinertree (special-case polynomial islands:
  vertex cover on trees via DP).

## Key points the lesson must cover
1. Reframe: NP-completeness ends the search for exact+fast+general — you
   keep any two. The lesson is organized as that three-way trade
   (exactness / speed / generality), each relaxation a section.
2. Relax generality — exploit instance structure: vertex cover on TREES
   by DP (worked; spiral to DP-on-structure); bounded parameters:
   the 2^k·n branch-and-bound for k-size vertex cover (small k rescues
   real instances); planted structure in real data as the practical
   norm.
3. Relax speed, keep exactness: pseudopolynomial DP — knapsack O(nW)
   revisited (cash out DP-II's flagged paragraph; Caveat Reductor
   reconciliation carried: NP-hardness of subset sum measures bits of T,
   the DP is exponential in bit-length — no contradiction, and the L13
   slot); plain exponential search with pruning: 2^30 ≈ 10^9 is a
   lunch-break, 2^60 is not — the practitioner's arithmetic.
4. Relax exactness with a GUARANTEE — approximation: vertex-cover
   2-approximation worked end to end with its charging proof (maximal
   matching lower-bounds OPT); metric TSP 2-approx via MST double-walk
   (spiral: MST lesson) — and the boundary theorem: general TSP admits
   NO constant factor unless P=NP (statement + one-paragraph gap
   intuition). PTAS/FPTAS named with one-line definitions.
5. Relax exactness without a guarantee — heuristics: greedy
   construction + local search / simulated annealing named honestly
   ("no bound, often excellent, measure on your instances"); one
   paragraph, not a section — the course refuses to bless unmeasured
   claims.
6. The decision procedure assembled as the course's closing artifact:
   recognize (yesterday's lesson) → classify your instances (small?
   structured? metric? small parameter?) → pick the branch → know what
   guarantee you hold. Close the course: name what course 2 deepens
   (LP/rounding, flows, randomization — one sentence, References to the
   proposal).

## Worked examples and set pieces
- **Universe-scale TSP arithmetic** (Sedgewick 6.6): 1000! vs 10^79
  electrons × 10^12 ops × 10^17 seconds — the keeper numbers for "why
  brute force is not a plan."
- **Vertex-cover 2-approximation full trace** on an 8-vertex graph:
  pick edge, take both endpoints, delete; the charging argument
  (chosen edges form a matching; any cover pays ≥ 1 per matched edge).
- **Metric-TSP double-tree walkthrough**: MST → doubled multigraph →
  Euler walk → shortcut tour, with the 2×OPT accounting per step.
- **Caveat Reductor** (Erickson §12.12): the apparent
  DP-vs-NP-completeness contradiction resolved in one page.
- **Christofides note**: 3/2 since ~1976, still the best constant for
  metric TSP (W&S Ch. 17) — the field's open frontier in one sentence.
- E3 spiral exercises: run the tree-DP for vertex cover (DP), the MST
  step inside TSP-approx (MST lesson), a 2^k branch trace (recursion).
- Final synthesis exercise (E6d research-shaped): given three described
  production problems (routing with metric costs; scheduling with small
  k; subset-sum-like with small budgets), pick the coping branch for
  each and state the guarantee held.

## Pitfalls
- Every claimed ratio needs its proof or its citation — no folklore
  ("annealing finds near-optimal solutions" is exactly what NOT to
  assert).
- Approximation ratios are worst-case bounds, not typical behavior —
  one explicit sentence.
- Do not open LP-based approximation (course 2's machinery); greedy/
  combinatorial approximations only.
- Keep the FPT paragraph to one; it is a door-opener, not a treatment.
- The lesson must end the COURSE: the closing section names what is now
  established (the whole spine walked backward in ~6 sentences) — the
  L10c close at course scale.

## FIGURE PLAN
- draw: the three-way trade triangle — exact / fast / general, with each
  coping strategy pinned to the edge it sacrifices. Single <Figure>;
  the lesson's organizing diagram, referenced by every section.
- draw: brute-force scale panel — 2^n and n! wall-clock bars at n = 20,
  30, 50, 60, 1000 against second/hour/universe-lifetime rulers. Single
  <Figure>. Inspired by Sedgewick 6.6 / 6.006 L01 table.
- draw: <FigureSequence>, 4 frames: vertex-cover 2-approximation — pick
  an edge, take both endpoints, delete incident edges, repeat; final
  frame the matching-based charging tally (|C| = 2|M| ≤ 2·OPT).
  Inspired by CLRS §35.1.
- draw: <FigureSequence>, 4 frames: metric-TSP double-tree — MST;
  doubled edges; Euler walk order; shortcut tour with the ≤ 2×OPT
  inequality chain beneath. Inspired by CLRS §35.2.
- draw: vertex-cover-on-a-tree DP panel — the take-root/skip-root
  recurrence on a small tree with the table beside it. Single <Figure>.
- draw: guarantee ladder — exact / FPTAS / PTAS / constant-factor /
  log-factor / no-guarantee heuristic, with one named algorithm per
  rung. Single <Figure> (styled table). Inspired by W&S Ch. 1
  definitions.
