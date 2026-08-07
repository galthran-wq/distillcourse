# Brief: dynamic-programming-ii-two-dimensional

Goal: apply DP to 2-D state spaces (edit distance, 0/1 knapsack).
Worked-practice: the method from DP-I run on states that need two indices.

## Sources to consult
- Erickson §3.7 (edit distance: the recursive alignment structure; the
  FOOD→MOOD→MON∧D→MONED→MONEY worked alignment; O(mn) table), §3.8
  (subset sum as a 2-D boolean DP — exercise fodder).
- CLRS §14.4 (LCS as the alternative 2-string DP — use as exercise/aside,
  not a second full worked example).
- MIT 6.006 L16 (LCS on "hieroglyphology"/"michaelangelo"; the
  subproblem-design lessons: constrain vs expand), L18 (subset sum O(nT),
  pseudopolynomial — plant the term, the coping lesson harvests it).
- 0/1 knapsack: CMU 15-210 L7 (subproblem parameterization pitfalls) and
  CLRS exercises; greedy-failure callback from the greedy lesson.

## Key points the lesson must cover
1. Why one index stops sufficing: the subproblem for comparing strings is
   a PAIR of prefixes — state (i, j); table size (m+1)×(n+1). Cash out
   DP-I's E7 exercise.
2. Edit distance in full: the three-way recurrence (insert / delete /
   substitute-or-match), base rows/columns, fill order options (row-major;
   any topological order works — foreshadow the DAG lesson in one
   sentence), cost Θ(mn), traceback → the actual alignment.
3. Worked end to end on FOOD → MONEY (5×7 table, every cell), traceback
   arrows drawn, the edit script read off.
4. 0/1 knapsack: state (items considered, capacity remaining); take/skip
   recurrence; table on a concrete 4-item instance; the greedy
   counterexample from the greedy lesson now solved optimally (E3
   spiral). Cost Θ(nW) — and W is a NUMBER, not a size: name
   "pseudopolynomial" here in one flagged paragraph (the NP module
   returns to it — <Ref> coping-with-np-hardness forward seam).
5. Reconstruction discipline generalized: store or re-derive the argmax;
   walk backward.
6. Space note: only the previous row is needed for the VALUE (O(min(m,n))
   space) but full table for reconstruction — one paragraph.

## Worked examples and set pieces
- **FOOD → MONEY** (Erickson §3.7): the canonical small edit-distance
  instance; full table + alignment rendering.
- **hieroglyphology × michaelangelo** (6.006 L16): the memorable LCS pair
  with multiple optimal answers (hello/heglo/iello/ieglo) — use as the
  LCS exercise showing non-unique reconstructions.
- **Knapsack instance** where greedy value/weight fails but DP finds the
  optimum — reuse the exact instance from the greedy lesson (continuity).
- **Subset sum trace** {1,4,5} reaching sums {0,1,4,5,6,9,10} (CLRS §35.5's
  P-lists / Erickson §3.8 flavor) — exercise.
- E7 forward-reach exercise: draw the dependency arrows of the edit
  -distance table as a directed graph and observe it has no cycles — the
  reader is one rename away from the DAG-shortest-paths synthesis
  (<Ref> shortest-paths-in-dags-and-dp).

## Pitfalls
- Do not teach LCS AND edit distance as parallel full examples — edit
  distance carries the prose; LCS is exercise material (they are too
  confusable side by side at full depth; E3 interleaving handles the
  discrimination in exercises instead).
- Indexing discipline: (i, j) = prefix LENGTHS (not last characters);
  off-by-one is the whole difficulty — one explicit warning + consistent
  convention.
- Do not claim knapsack's Θ(nW) is polynomial — the pseudopolynomial
  paragraph exists precisely to block that reading (L13 slot).
- Traceback ties: state that any argmax works; determinism convention.

## FIGURE PLAN
- draw: state-space picture — the (i, j) prefix-pair grid with one cell's
  meaning spelled out ("cost of editing FOOD[1..i] into MONEY[1..j]").
  Single <Figure>.
- draw: the three-neighbor recurrence cell — a cell with its three
  incoming arrows (diagonal/left/up) labeled match-substitute/insert/
  delete. Single <Figure>, co-located with the recurrence.
- draw: <FigureSequence>, 4-5 frames: the FOOD→MONEY table filling — base
  row/column, then a few cells with choice arrows, then the completed
  table, then the traceback path highlighted, final frame the alignment
  rendered as stacked strings with edit operations. Inspired by
  Erickson §3.7.
- draw: <FigureSequence>, 3 frames: knapsack take/skip on the 4-item
  instance — the table filling with the take-arrow (up-left by weight)
  and skip-arrow (up) distinguished; final frame the chosen item set.
- draw: pseudopolynomial scale panel — Θ(nW) table area growing as W
  doubles in VALUE but only +1 bit in input LENGTH; the "polynomial in
  the number, exponential in its bits" contrast drawn. Single <Figure>.
  Inspired by 6.006 L18.
