# Brief: dynamic-programming-i-one-dimensional

Goal: formulate a 1-D DP recurrence and implement it bottom-up. The
paradigm arrives as the fix for two named flaws: D&C's overlapping
subproblems (exponential recomputation) and greedy's unjustified
commitment.

## Sources to consult
- MIT 6.006 L15: the SRT BOT framework (Subproblems, Relate, Topological
  order, Base cases, Original problem, Time) — adopt as the lesson's
  method checklist; Fibonacci naive Ω(2^{n/2}) vs memoized O(n).
- Erickson §3.1 (Fibonacci; Figs 3.1/3.2 recursion tree vs memoized DAG —
  the most-reused DP diagram in the literature; Bellman's naming story
  with the 1984 autobiography citation), §3.4 ("smart recursion" framing).
- CLRS §14.1 (rod cutting: Fig 14.2 all 8 ways to cut length 4; the
  2^{n-1} blowup; memoized and bottom-up versions), §14.3 (elements of
  DP: optimal substructure + overlapping subproblems).
- CMU 15-210 L6: coin change with the feasibility ≪ optimization ≪
  counting hierarchy — a clean second worked problem and exercise mine.

## Key points the lesson must cover
1. The overlapping-subproblems flaw made concrete: naive fib(n) call tree,
   count of repeated fib(k) calls; exponential total (cash out the
   previous lesson's E7 exercise).
2. Memoization: cache on first computation; the call tree collapses to n
   distinct subproblems — top-down DP. Then bottom-up: fill the table in
   dependency order; same asymptotics, no recursion. Both shown on
   Fibonacci; space optimization (keep last two) as a one-paragraph coda.
3. The method (SRT BOT adapted): define the subproblem IN WORDS with its
   index; write the recurrence with the choice being minimized/maximized;
   identify order, bases, where the answer sits, and cost =
   (#subproblems) × (work per subproblem).
4. Optimal substructure: why the recurrence is CORRECT (an optimal
   solution's first choice leaves an optimal subsolution — cut-and-paste
   argument carried once, on rod cutting).
5. Rod cutting worked in full (CLRS's price table): recurrence
   r(n) = max_i (p_i + r(n−i)); table filled by hand to n = 8; solution
   reconstruction via a choice array.
6. Coin change (min coins, denominations {1,3,4}): the greedy failure from
   last lesson now solved correctly — the E3 spiral payoff; unreachable
   amounts as the boundary case.
7. Close: what "1-D" means (state = one index); the seam to 2-D states
   (L10c).

## Worked examples and set pieces
- **Fibonacci tree→DAG collapse** (Erickson Figs 3.1/3.2): the paradigm's
  signature picture, recreated as two co-located figures.
- **Bellman naming story** (Erickson §3.1): "dynamic programming" chosen
  to sound impressive to a mathematics-hostile Secretary of Defense —
  two dry sentences, dated 1950s, References to Bellman 1984.
- **Rod cutting** (CLRS §14.1): the 8-ways figure for n = 4 (2^{n−1}
  argument), then the DP table to n = 8 with reconstruction.
- **Coin change {1,3,4}**: full 1-D table for target 6 showing 2 coins
  where greedy said 3.
- E7 forward-reach exercise: write the subproblem definition for edit
  distance's prefix pair — the reader discovers a state needing TWO
  indices (<Ref> dynamic-programming-ii-two-dimensional).

## Pitfalls
- "DP = filling tables" is the misconception to refute (L13): DP is a
  correct recurrence + each subproblem solved once; the table is an
  implementation detail (memoized recursion is equally DP).
- Do not introduce the DAG-shortest-path equivalence yet — the synthesis
  lesson (shortest-paths-in-dags-and-dp) owns that punchline; here the
  dependency structure is drawn but not named as a graph algorithm.
- Keep "recurrence" terminology continuous with the running-time lesson
  but flag the difference: values now, not costs.
- Reconstruction (the actual cuts/coins) must be shown once fully.

## FIGURE PLAN
- draw: naive fib(6) call tree with repeated subtrees color-grouped and a
  tally of calls per fib(k). Single <Figure>. Inspired by Erickson
  Fig 3.1.
- draw: the same computation as a memoized DAG — six nodes, dependency
  arrows, evaluation order numbered. Single <Figure>, co-located directly
  after the tree. Inspired by Erickson Fig 3.2.
- draw: rod-cutting enumeration — all 8 cuttings of a length-4 rod with
  revenues annotated, the optimum highlighted. Single <Figure>. Inspired
  by CLRS Fig 14.2.
- draw: <FigureSequence>, 4-5 frames: bottom-up rod-cutting table fill to
  n = 8 — each frame one or two cells, the max-choice arrows back to
  earlier cells visible, final frame the reconstruction walk. 
- draw: SRT BOT checklist card — the six slots filled in for rod cutting.
  Single <Figure>. Inspired by 6.006 L15.
- draw: coin-change table for {1,3,4}, target 6 — with the greedy path
  (4+1+1) crossed out against the DP answer (3+3). Single <Figure>.
