# Brief: linear-time-sorting

Goal: implement counting sort and radix sort; explain how they sidestep the
lower bound. Worked-practice lesson: heavy on carried computation, lighter on
new theory.

## Sources to consult
- CLRS §8.2 (counting sort — tally, prefix sums, stable right-to-left
  placement), §8.3 (radix sort, Lemma: d passes of a stable sort by digit;
  the d(n+k) bound and base choice), §8.4 (bucket sort — mention only).
- MIT 6.006 L05: direct-access-array sort → tuple sort → radix sort
  development; the observation that n integers < n^c sort in O(cn); base
  choice b = n optimal.
- Sedgewick 5.1: key-indexed counting as the primitive; LSD radix on
  fixed-length strings; stability emphasized as the correctness linchpin.

## Key points the lesson must cover
1. The escape hatch restated: use the value as an index — an operation the
   comparison model does not allow. No contradiction with the lower bound
   (L13: "counting sort violates the theorem" — no; it leaves the model.
   Refute explicitly with the model's definition).
2. Counting sort in full: tally array of size k, prefix sums = final
   positions, place from the right for stability. Work every array state
   on a concrete 8-element input over {0..5}. O(n + k) time, O(n + k)
   space; k must be modest or the tally array dwarfs the input.
3. Stability defined precisely; WHY placing right-to-left preserves input
   order of equals — carried, not asserted.
4. Radix sort LSD: sort by least-significant digit first with a STABLE
   pass per digit; induction argument that after pass i the keys are
   sorted on their last i digits. Counterexample when the pass sort is
   unstable (two 2-digit keys) — the pitfall made concrete.
5. Cost d(n + k); choosing digit size/base: base n gives O(n) for keys
   < n^c (6.006's framing). When radix beats n log n in practice and when
   it doesn't (long keys, cache behavior — one honest paragraph).
6. Bucket sort: one paragraph (expected O(n) for uniform reals; cite).

## Worked examples and set pieces
- **Counting sort full trace** (CLRS §8.2's example): input, tally, prefix
  sums, placement — every intermediate array shown; the lesson's L7
  centerpiece with a parallel exercise on fresh data.
- **Radix on 3-digit numbers** (CLRS Fig 8.3-style): 7 numbers, three
  passes, columns showing the sort stabilizing digit by digit.
- **Instability counterexample**: keys 21, 25, 23 vs a same-tens set —
  show one unstable pass scrambling the previous pass's work.
- E3 spiral exercise: use counting sort as the stable pass inside radix
  and account the total cost (reinforces both).
- E7 forward-reach exercise: sort n=1M 64-bit IDs — reader weighs
  8 passes × (n + 256) against n lg n comparisons and meets the "which
  model wins depends on constants" judgment that closes the module.

## Pitfalls
- k's role must stay visible: counting sort is NOT "O(n), full stop"
  (E6a boundary probe: k = n² kills it).
- Radix MSD variant: one sentence, not developed.
- Do not re-prove the lower bound; one <Ref> back.
- Negative numbers/keys needing offset: exercise, not prose.

## FIGURE PLAN
- draw: comparison-model boundary card — two worlds: "may only ask
  a < b?" vs "may compute index from value"; the lower bound stamped on
  the first world only. Single <Figure>.
- draw: <FigureSequence>, 4 frames: counting sort — input array; tally
  array filled; prefix sums; right-to-left placement with one element's
  flight path highlighted. Inspired by CLRS §8.2 / ODS Fig 11.7.
- draw: stability micro-diagram — two equal keys with their input order
  tracked through placement, right-to-left vs left-to-right contrasted.
  Single <Figure>.
- draw: <FigureSequence>, 3 frames: LSD radix on 7 three-digit numbers,
  one stable pass per frame, the sorted-suffix-of-digits property
  annotated. Inspired by CLRS Fig 8.3 / Sedgewick 5.1.
- draw: cost-regime chart — d(n+k) vs n lg n as key length grows; the
  crossover region shaded. Single <Figure>. Inspired by 6.006 L05's
  base-choice discussion.
