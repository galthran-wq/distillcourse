# Research brief: fast-convolution-and-streaming-blocks (Fast Convolution and Streaming Blocks)

status: planned
module: filter-design-and-implementation
type: core
goal: Implement long FIR filtering with overlap-add or overlap-save while preserving linear convolution.
est_minutes: 38

## ARC

- **Inherits:** **FIR Filter Design and Verification** and **FFT Factorization and Machine Layout** established the long FIR coefficients to implement and the transform algorithm used to reduce their block-processing cost.
- **Spine step:** “Streaming blocks and finite words make implementation structure observable; an ECG cascade tests morphology, delay, transients, and stability.” (*Structures face machines*). Caption: “Equivalent formulas separate under latency and quantization.”
- **Contributes:** Implement long FIR filtering with overlap-add or overlap-save while preserving linear convolution. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `finite-word-realizations`, which evaluate a filter realization under coefficient quantization, roundoff, overflow, limit cycles, and section ordering.

## Sources to consult

- J. O. Smith, ch. 8 §§8.1–8.4 — short/long convolution, overlap-add, overlap-save, and zero-padding review.
- Steven W. Smith, *The Scientist and Engineer's Guide to Digital Signal Processing*, ch. 18 — FFT convolution and break-even intuition.
- Orfanidis, ch. 10 §§10.9–10.12 — circular convolution, FFT convolution, OLA/OLS, and matched filtering.
- Lyons, ch. 13 §13.10 — practical FFT FIR filtering.

## Key points the lesson must cover

1. Circular wrap is eliminated by padding and overlap.
2. OLA sums tails while OLS discards corrupted prefixes.
3. Block length trades latency against throughput.
4. The direct/FFT crossover is hardware-dependent.

## Pitfalls / subtleties to flag

- Circular wrap, block boundaries, FFT normalization, buffer latency, cache sizes, and changing filters decide the real crossover.
- FFT multiplication is circular; insufficient zero padding or the wrong valid-region rule produces boundary wrap that can look like legitimate signal energy at every block seam.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A long room impulse response changes the best block length by hardware: the mathematical $N\log N$ advantage does not specify the latency/crossover.
- Worked case grounded in J. O. Smith ch. 8: a four-sample block and three-tap kernel need transform length at least 6; show that a 4-point FFT wraps two tail samples, then use an 8-point overlap-add schedule and match direct convolution sample for sample.

## FIGURE PLAN

1. `draw:` **Linear convolution tail wrapped into circular convolution.** (single) — Draw: wraparound is explanatory. Inspiration: MIT 6.341 Lecture 16.
2. `draw:` **Overlap-add block timeline with zero padding and summed tails.** (sequence, 3–7 frames; one delta per frame) — Draw: the process unfolds by block.
3. `draw:` **Overlap-save timeline with corrupted prefix discarded.** (sequence, 3–7 frames; one delta per frame) — Draw: the changed valid region is the lesson.
4. `draw:` **Direct versus FFT operation/latency curves with crossover depending on block size.** (single) — Draw: course benchmark data should be newly computed.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Filter $x=[1,2,3,4]$ by $h=[1,-1,2]$ with one 8-point FFT block. State the minimum alias-free length, identify the two tail samples that a 4-point circular convolution wraps, and deliver padded vectors plus the overlap-add output; verify $[1,1,3,5,2,8]$ against direct convolution.
2. **E6 — boundary probe.** Handle a one-tap filter, block shorter than the kernel, exact-fit FFT length, and final partial block.
3. **E6 — claim to refute.** Refute 'circular convolution is an approximation to linear convolution' by naming the exact padding condition.
4. **E6 — research shaped.** Benchmark direct, overlap-add, and overlap-save for several kernel lengths and predeclare correctness/crossover thresholds.
5. **E6 — strategy choice.** A 48 kHz stream uses a 1024-tap FIR and 2048-point FFTs. Choose overlap-add for independently flushable 256-sample packets or overlap-save for one continuous fixed-buffer stream only when the ownership/discard cue warrants it; produce both buffer timelines, valid ranges, startup latency, memory, and seam error below $10^{-10}$ against direct convolution.
6. **FORWARD (E7).** Quantize one high-order direct form and its SOS factorization to the same coefficient word length; the next lesson explains their divergence. Reaches `finite-word-realizations`; the solution must name the connection and include a `<Ref>`.
