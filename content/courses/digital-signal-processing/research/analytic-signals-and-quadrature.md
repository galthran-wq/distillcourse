# Research brief: analytic-signals-and-quadrature (Analytic Signals and Quadrature Communication)

status: planned
module: multirate-communications-and-compression
type: core
goal: Construct an analytic signal and use I/Q processing for modulation, demodulation, and image rejection.
est_minutes: 40

## ARC

- **Inherits:** **Complex Sinusoids and Phasors**, **DTFT and Frequency Response**, and **FIR Filter Design and Verification** established complex rotation, conjugate symmetry, modulation, unit-circle response, and a realizable linear-phase Hilbert/delay pair. Perfect-reconstruction and wavelet banks are optional neighboring depth, not prerequisites.
- **Spine step:** “Quadrature transport and finite-bit subbands close an end-to-end audio link whose alias, reconstruction, rate, noise, computation, and latency budgets must agree.” (*The full link closes*). Caption: “Communication and compression expose accumulated departures from ideal DSP.”
- **Contributes:** Construct an analytic signal and use I/Q processing for modulation, demodulation, and image rejection. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `quantization-dither-and-subband-allocation`, which evaluate quantizer, dither, and subband bit-allocation choices against distortion, noise, overload, and rate.

## Sources to consult

- Lyons, chs. 8–9 — quadrature signals, negative frequency, complex downconversion, Hilbert transformers, and analytic generation.
- MIT 6.003, Sessions 23–24 — modulation, coherent phase error, AM/FM, multiplexing, and sampled radio chains.
- MIT 6.341, Problem Set 11 — Hilbert transforms, analytic signals, phase splitters, and delay alignment.
- J. O. Smith, Appendix B shift/modulation theorems and Appendix E/G analytic and complex-channel material.

## Key points the lesson must cover

1. Analytic signals suppress negative-frequency content.
2. I and Q are orthogonal projections.
3. Complex mixing translates one spectral direction.
4. Gain and phase imbalance create image leakage.

## Pitfalls / subtleties to flag

- Finite Hilbert filters need delay alignment; I/Q gain/phase imbalance, carrier offset, and sample-clock error create images and constellation rotation.
- A finite Hilbert transformer needs a matched delay in the real path; otherwise the intended negative-frequency cancellation leaks an image even when the Hilbert magnitude response looks correct.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A coherent AM receiver with phase error $\phi$ recovers a factor $\cos\phi$ and vanishes at $\pi/2$, whereas an envelope receiver pays a carrier-power cost.
- Worked case grounded in Lyons ch. 9: convert $\cos(0.2\pi n)$ to $e^{j0.2\pi n}$, mix by $e^{j0.3\pi n}$, and obtain only the $+0.5\pi$ component; repeating with a real cosine mixer produces both sum and difference images.

## FIGURE PLAN

1. `draw:` **Real spectrum with conjugate sidebands transformed into a one-sided analytic spectrum.** (sequence, 3–7 frames; one delta per frame) — Draw: the cancellation is explanatory. Inspiration: SASP Appendix D; Lyons Ch. 9.
2. `draw:` **Parallel real-delay and Hilbert paths with matched group delay.** (single) — Draw: the implementation architecture should be drawn.
3. `draw:` **Quadrature up/down-conversion chain with desired and image bands.** (single) — Draw: a communication pipeline is math-bound.
4. `draw:` **QPSK constellation under gain error, phase error, and carrier offset.** (sequence, 3–7 frames; one delta per frame) — Draw: constructed impairment sequence teaches diagnosis.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $n=0,\ldots,7$, start with $x[n]=\cos(\pi n/4)$, form ideal analytic $z[n]=e^{j\pi n/4}$, and mix by $e^{j\pi n/2}$. Deliver an eight-row real/quadrature/analytic/mixed table and an 8-point DFT check showing support moves from bin $+1$ to bin $+3$ without a difference image.
2. **E6 — boundary probe.** Handle DC, Nyquist, a purely real constant, and odd/even FIR Hilbert lengths with forced zeros.
3. **E6 — claim to refute.** Refute 'multiplying by a real cosine shifts only to +fc' by deriving both spectral images.
4. **E6 — derivation not shown.** Derive image-rejection ratio for a small I/Q gain or phase mismatch to first order.
5. **E6 — strategy choice.** Create an analytic 48 kHz stream over 0.5–18 kHz using a 129-tap FIR Hilbert transformer with matched 64-sample delay or a 1024-sample overlap-processed FFT construction. The cue is a 5 ms live latency cap versus a 90 dB offline image-rejection target; submit rejection versus frequency, delay mismatch, latency, operations, and seam error.
6. **FORWARD (E7).** Quantize I and Q at progressively lower precision and measure image rejection and EVM; the next lesson separates overload, rounding, and dither effects. Reaches `quantization-dither-and-subband-allocation`; the solution must name the connection and include a `<Ref>`.
