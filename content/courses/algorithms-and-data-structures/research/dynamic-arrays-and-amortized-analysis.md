# Brief: dynamic-arrays-and-amortized-analysis

Goal: compute amortized cost of dynamic-array resizing by the aggregate
method. This is course 1's ONLY amortized-analysis lesson (aggregate method
only — accounting/potential are course-2 module A; say so at the close).

## Sources to consult
- CLRS §16.1 (aggregate analysis; the stack-with-MULTIPOP and binary-counter
  examples are exercise fodder), §16.4.1-16.4.2 (dynamic tables: expansion,
  then expansion+contraction and the 1/4 rule).
- Morin ODS §2.1 (ArrayStack: grow/shrink lemmas — the cleanest written
  aggregate proof; "never shrink below 1/4 full, halve at 1/2" argument).
- Sedgewick 1.3 slides 19-20: the adversarial push/pop trace at the boundary
  showing why shrink-at-half thrashes.
- MIT 6.006 L02: amortization definition; deletion hysteresis (shrink
  threshold strictly below the growth threshold).
- CS166 L09 for framing ideas (three parallel aggregate examples; the
  throughput-vs-latency distinction — use the content, not the dishwasher
  analogy).

## Key points the lesson must cover
1. The problem: fixed-capacity array + one more append. Growing by copying
   costs O(current size).
2. Doubling: appends 1..n trigger copies at sizes 1,2,4,…,2^⌊lg n⌋; total
   copy work < 2n; total cost of n appends ≤ 3n ⇒ amortized O(1). Carry the
   sum explicitly (L7: every step visible).
3. The aggregate method defined: bound the TOTAL cost of any sequence of m
   operations, divide by m. Amortized ≠ average-case over random inputs and
   ≠ expected time — it is worst-case over sequences (L13 refutation slot;
   the misconception "amortized O(1) means each operation is fast" — no:
   individual appends still cost Θ(n), only the sequence total is bounded).
4. Growth factor matters: +c fixed increment gives Θ(n²) total (arithmetic
   series — callback to the arrays lesson's E7 exercise); any factor > 1
   works, 2 is customary; golden-ratio/1.5 aside optional (cut if thin).
5. Shrinking: halve at 1/4 full, not 1/2 — the adversarial alternation at the
   boundary; guarantees the table stays within [1/4, 1] full and keeps O(1)
   amortized for mixed append/delete.
6. Where this shows up: every language's vector/ArrayList/list; also the
   hash-table resize argument next lesson (E7 pointer).

## Worked examples and set pieces
- **Cost trace of appends 1..17** with doubling — per-append cost spikes at
  2,3,5,9,17; running average visibly flattening under 3. The lesson's
  central figure + the DynamicArrayGrowth demo's static companion.
- **Thrash sequence** (Sedgewick slides 19-20): capacity-8 table at 4
  elements with shrink-at-half: push,pop,push,pop each costs Θ(n).
- **Morin's financial analogy** (ODS §1.5: worst-case mortgage vs amortized
  cash purchase vs expected insurance) — usable as a short labeled <Aside>
  distinguishing the three guarantee types; keep dry.
- **Binary counter** (CLRS 16.1): INCREMENT flips ≤ 2 bits amortized —
  strong exercise (E6c derivation the lesson did not do).
- E7 forward-reach: hash-table resize amortization (<Ref> hash-tables).

## Pitfalls
- Do NOT introduce the accounting or potential methods, even casually —
  course 2 owns them; one closing sentence names them as the general tools.
- Keep "amortized" scoped to deterministic sequence-total bounds here;
  expected-time hashing arrives next lesson and must not blur into it.
- The 3n bound needs its constituents named (n writes + <2n copy-writes).

## FIGURE PLAN
- draw: <FigureSequence>, 4-5 frames: appends into a doubling array —
  capacity 1→2→4→8 with copy events shown as ghost arrows from old to new
  block; one resize per frame. Inspired by Sedgewick's resizing trace.
- draw: per-append cost bar chart for appends 1..17 — spikes at
  powers-of-two+1, running-average line flattening below 3. Single <Figure>;
  static companion to the demo.
- draw: geometric-series area diagram — blocks of 1,2,4,…,n/2 stacked
  against a 2n ruler: the copy total visibly < 2n. Single <Figure>.
- draw: fixed-increment counterexample — same 17 appends with capacity += 1:
  every append copies, total area triangular (Θ(n²)). Side-by-side with the
  doubling chart. Single <Figure>.
- draw: <FigureSequence>, 3 frames: the shrink-at-1/2 thrash — full table,
  pop (halve+copy), push (double+copy); then one final frame showing the
  1/4-rule leaving slack on both sides. Inspired by ODS §2.1 / Sedgewick.
