# Brief: asymptotic-notation

Goal: classify running times with O / Ω / Θ. First lesson of the course — C3
applies: this and the next lesson must be the most polished, ending in a felt
win (the reader ranks growth rates and finds a crossover themselves).

## Sources to consult
- CLRS 4th ed. Ch. 3 (§3.1 informal, §3.2 formal definitions + Theorem 3.1,
  §3.3 common functions). Fig 3.2 (three-panel O/Ω/Θ sandwich) is the canonical
  diagram to recreate. Ch. 1.2 for the computer-A-vs-B race.
- MIT 6.006 L01: word-RAM model in two sentences; the wall-clock table
  (Θ-classes × n = 1000 on a 1 GHz machine, ending in "10^281 millenia").
- Sedgewick booksite/slides 1.4: order-of-growth ladder
  (constant … exponential); the 3-SUM doubling experiment (measured times at
  n = 1000..8000, log-log regression slope b ≈ 2.999, predict-then-verify at
  n = 16,000); the distinction between tilde-notation modeling and Big-Oh
  classification (mention, don't adopt tilde).
- Erickson §0.6 for the register: analysis as counting elementary steps.
- Morin ODS §1.1 for the scale motivator (below).

## Key points the lesson must cover
1. Running time as a function of input size n; worst/best/average are three
   different functions of the same algorithm.
2. Formal definitions: O (exists c, n0 …), Ω, Θ; Theorem 3.1 (Θ = O ∧ Ω).
   L4 exception applies: definitions may come formal-first here because every
   term is familiar — but ONLY after one concrete counting example (count the
   exact steps of a 5-line loop, watch constants and lower-order terms drown).
3. Why constants and lower-order terms are dropped: machine/language
   independence; crossover points (n² vs 100n crosses at n = 100).
4. The growth ladder O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ),
   with wall-clock anchors.
5. Common pitfalls of the notation: O is an upper bound, not a synonym for
   "the running time"; f = O(g) is set membership despite the equals sign.

## Worked examples and set pieces (do not lose these)
- **Computer A vs computer B race** (CLRS §1.2, pp. 12-13): a 100×-faster
  machine running insertion sort (Θ(n²)) loses to a slow machine running merge
  sort (Θ(n log n)) once n = 10,000,000. Keeper numbers: 100× hardware, beaten
  anyway. Forward-reference both algorithms by name only (they arrive in later
  lessons).
- **Wall-clock table** (6.006 L01): recreate as a figure; the 2^Θ(n) row's
  "10^281 millenia" is the quotable scale anchor.
- **Google-scale back-of-envelope** (ODS §1.1): 10^6 items × 10^6 naive linear
  searches = 10^12 inspections ≈ 16.7 minutes at 10^9 ops/s; a sorted
  structure needs ~60 comparisons for a billion items. Use as the opening
  scale motivator (matches the course intro's hash-table hook).
- **3-SUM doubling experiment** (Sedgewick 1.4, slides 11-21): measured
  running times, log-log slope ≈ 3 — asymptotics is empirically checkable.
  Good final section: "how do we know the model is right".

## Pitfalls
- Do not introduce little-o/ω formally; one sentence that they exist (strict
  versions) suffices — they are never used later in the course.
- L13 refutation slot (real misconception): "O(n²) means the algorithm takes
  n² steps" / "an O(n log n) algorithm is always faster than an O(n²) one".
  Refute with the crossover computation and the definition's ∃c,n0.
- Keep the word-RAM model to a paragraph — enough to justify "one step",
  no formal machine model.
- est_minutes 26: resist bloating with every §3.3 identity; log rules used
  later (log(n!) ~ n log n) can wait for the sorting lower bound.

## FIGURE PLAN
- draw: three-panel O/Ω/Θ definition picture — f(n) sandwiched by c·g(n)
  curves past n0, one panel per notation. Single <Figure>, three aligned
  panels. Inspired by CLRS Fig 3.2 (the canonical diagram; recreate, never
  copy).
- draw: growth-race chart — log n, n, n log n, n², 2ⁿ on shared axes, linear
  scale beside log scale. Single <Figure>; static companion to the
  GrowthRaceChart demo. Inspired by Sedgewick's order-of-growth ladder.
- draw: crossover zoom — 100n vs n² with the n = 100 intersection marked and
  regions labeled "100n wins" / "n² loses". Single <Figure>.
- draw: wall-clock table — Θ-classes × concrete times at n = 10³, 10⁶, 10⁹ on
  a 1 GHz machine. Single <Figure> (styled table). Inspired by 6.006 L01.
- draw: <FigureSequence>, 3-4 frames: a short loop's cost assembled line by
  line — per-line counts → summed polynomial → the same curve with lower-order
  terms fading out → Θ(n²) label. One change per frame. Inspired by CLRS §2.2
  insertion-sort line-count analysis.
