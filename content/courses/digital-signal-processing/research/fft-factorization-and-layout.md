# Research brief: fft-factorization-and-layout (FFT Factorization and Machine Layout)

status: planned
module: fourier-representation-and-computation
type: core
goal: Construct a factored FFT and account for arithmetic, storage, ordering, and scaling.
est_minutes: 40

## ARC

- **Inherits:** **DFT Bins, Symmetry, and Scaling** established compute and interpret a finite DFT with explicit indexing, normalization, symmetry, and circular-convolution conventions.
- **Spine step:** “The DFT supplies finite coordinates and the FFT computes them efficiently; a DTMF receiver turns coefficients into a constrained decision.” (*Finite coordinates become computation*). Caption: “Indexing, scaling, factorization, and latency meet in one receiver.”
- **Contributes:** Construct a factored FFT and account for arithmetic, storage, ordering, and scaling. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `phone-channel-dtmf-receiver`, which design and validate a finite-latency dual-tone receiver under noise, offset, twist, and channel distortion.

## Sources to consult

- Cooley–Tukey 1965, journal pp. 297–300, eqs. 3–22 — composite factorization, operation counts, in-place radix-2 stages, and bit reversal.
- Oppenheim–Schafer, ch. 9 — FFT algorithms, flow graphs, decimation variants, and implementation issues.
- MIT 6.003, Session 18 slides 17–32 — even/odd radix-2 recurrence and $N\log_2N$ count.
- MIT 6.341, Lecture 19 pp. 1–4 — direct-versus-factorized cost, radix-2 DIF/DIT recurrences, butterfly counts, bit reversal, transposed flow graphs, and in-place layout.

## Key points the lesson must cover

1. Direct DFT cost is order $N^2$.
2. Composite lengths factor into stages.
3. Butterflies permit in-place updates.
4. Bit reversal and scaling are observable interface contracts.

## Pitfalls / subtleties to flag

- Radix choice, permutations, cache behavior, in-place overwrite, twiddle precision, and normalization determine real performance.
- $O(N\log N)$ is an algorithmic count, not a runtime guarantee: short transforms, cache layout, permutation traffic, and unsupported lengths can erase the expected speedup.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Cooley and Tukey’s table makes radix 3 only about 6% cheaper than radix 2 or 4, letting architecture override a small abstract optimum.
- Worked case grounded in MIT 6.341 Lecture 19: an 8-point direct DFT uses 64 complex products, while three radix-2 stages use 12 butterfly twiddle products; tracing indices `0,4,2,6,1,5,3,7` makes the bit-reversal cost visible rather than hiding it in a library call.

## FIGURE PLAN

1. `draw:` **N=8 even/odd decomposition as a 3–5 frame factorization.** (sequence, 3–7 frames; one delta per frame) — Draw: the algorithm unfolds by changing one stage. Inspiration: Cooley–Tukey journal pp. 297–301.
2. `draw:` **One butterfly with input/output, twiddle, and operation tally.** (single) — Draw: the formula and graph must share labels.
3. `draw:` **Direct N² versus FFT N log N operation curves with measured small-N crossover left unlabeled until benchmarked.** (single) — Draw: the asymptotic relation is explanatory; measured timing belongs to the study.
4. `draw:` **Natural, bit-reversed, and mixed-radix memory order on literal cell grids.** (single) — Draw: layout is a machine representation.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Draw the radix-2 decimation-in-time butterfly schedule for $N=8$, list the bit-reversed input order, and count complex multiplications and additions. Check all eight outputs against a direct DFT of $x=[1,2,3,4,0,0,0,0]$ to $10^{-12}$.
2. **E6 — boundary probe.** Treat prime N, N=1, and repeated factors; state what the original factorization does and does not guarantee.
3. **E6 — claim to refute.** Refute 'FFT changes the mathematical DFT result' by separating algorithm, ordering, and normalization errors.
4. **E6 — research shaped.** Benchmark direct DFT and library FFT over powers and non-powers of two; declare crossover and numerical-error thresholds first.
5. **E6 — strategy choice.** Choose direct DFT or radix-2 FFT for (a) one four-point transform and (b) 1000 transforms of length 1024. The cue is transform length and reuse, not numerical accuracy; produce exact operation-count estimates, output-order requirements, and a maximum coefficient-difference check on a seeded vector.
6. **FORWARD (E7).** Select only the row and column frequencies of a DTMF keypad instead of computing an indiscriminate full spectrum; the application turns them into a receiver. Reaches `phone-channel-dtmf-receiver`; the solution must name the connection and include a `<Ref>`.
