# Research brief: minimum-phase-and-allpass-structures (Minimum-Phase and Allpass Structures)

status: planned
module: filter-design-and-implementation
type: extra
goal: Analyze magnitude-equivalent systems through minimum-phase factors, allpass sections, Hilbert transformers, and analytic-signal construction.
est_minutes: 40

## ARC

- **Inherits:** **z-Transform, Poles, Zeros, and ROC** and **IIR Filter Design and Bilinear Mapping** established pole-zero geometry, stable rational systems, and the phase behavior of recursive filters.
- **Spine step:** “Streaming blocks and finite words make implementation structure observable; an ECG cascade tests morphology, delay, transients, and stability.” (*Structures face machines*). Caption: “Equivalent formulas separate under latency and quantization.”
- **Contributes:** Analyze magnitude-equivalent systems through minimum-phase factors, allpass sections, Hilbert transformers, and analytic-signal construction. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to (optional enrichment):** compare magnitude-equivalent zero placements in `ecg-cleanup-under-morphology-constraints`; **ECG Cleanup Under Morphology Constraints remains fully completable from its declared core prerequisites, Fast Convolution and Streaming Blocks and Finite-Word Realizations.**

## Sources to consult

- Oppenheim–Schafer, ch. 5 §§5.5–5.6.3 — allpass/minimum-phase decomposition, group delay, and energy-delay properties.
- MIT 6.341, Lecture 3 pp. 1–6 and Problem Set 2 — reciprocal zero pairing, spectral factorization, equalization, and counterexamples.
- J. O. Smith, ch. 4 minimum-phase and causal-cepstrum sections — magnitude-to-minimum-phase construction.
- Vaidyanathan, Appendix D §§D.1–D.3 — complex cepstrum and root-free minimum-phase spectral factorization.

## Key points the lesson must cover

1. Reciprocal-conjugate zero choices preserve magnitude.
2. Minimum phase concentrates energy earliest.
3. Allpass sections change phase at unit magnitude.
4. Hilbert transformers create quadrature pairs.

## Pitfalls / subtleties to flag

- A unit-circle zero prevents a stable causal inverse.
- Phase unwrapping and delay conventions must be declared before comparing group delay.
- Minimum phase is a joint pole/zero and ROC property, not “small phase.”

## Concrete gems / worked examples

- Four FIR sequences with identical magnitude accumulate energy at visibly different rates; the minimum-phase version leads every partial-energy curve.
- Worked case grounded in Oppenheim–Schafer §5.6.3: reflect the zero of $1-2z^{-1}$ inside the unit circle to obtain $2(1-0.5z^{-1})$; verify equal unit-circle magnitudes, then compare cumulative impulse-response energy to see the reflected version arrive earlier.

## FIGURE PLAN

1. `draw:` reflect one FIR zero through the unit circle while preserving unit-circle magnitude (sequence, three frames).
2. `draw:` four equal-magnitude impulse responses ordered by partial-energy accumulation (single comparison; Oppenheim §5.6.3).
3. `draw:` minimum-phase × allpass factorization with pole-zero pairs (single component).
4. `draw:` allpass unit-circle vector geometry proving equal numerator/denominator lengths (single).
5. `draw:` real signal, Hilbert pair, and one-sided analytic spectrum (sequence, four frames).

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Reflect the zero of $h_1=[1,-2]$ through the unit circle to form scaled minimum-phase $h_2=[2,-1]$. Evaluate magnitudes at $0$, $\pi/2$, and $\pi$, and compute normalized cumulative energy; verify common magnitudes $[1,\sqrt5,3]$ and first-tap energy fractions $1/5$ versus $4/5$.
2. **E6 — boundary probe.** Place a zero exactly on the unit circle and determine which inverse and minimum-phase claims fail.
3. **E6 — claim to refute.** Refute “equal magnitude response means equal delay” with a first-order allpass factor.
4. **E6 — derivation not shown.** Show that reflecting a real zero through the unit circle changes magnitude only by a constant scale.
5. **E6 — research shaped.** Factor a measured FIR response into minimum-phase and allpass parts and verify magnitude agreement and partial-energy ordering numerically.
6. **Strategy choice.** Generate the exact 255-tap linear-phase FIR $h[n]=(0.54-0.46\cos(2\pi n/254))\,0.36\,\operatorname{sinc}(0.36(n-127))$ for $n=0,\ldots,254$, using $\operatorname{sinc}(x)=\sin(\pi x)/(\pi x)$ and then normalizing $\sum_n h[n]=1$; sample its magnitude on a 16,384-point FFT grid with a $10^{-12}$ magnitude floor. Convert it to minimum phase using explicit root reflection or real-cepstrum reconstruction. The cue is short, well-conditioned roots versus clustered near-unit-circle roots and sampled magnitude only; submit maximum magnitude mismatch, median group delay, first-25%-energy index, and either a root-conditioning report or cepstral grid/floor convergence plot.
7. **FORWARD (E7, optional enrichment).** Construct two magnitude-equivalent ECG filters with different zero locations and compare peak timing; use the application’s morphology limits only as an optional comparison. **ECG Cleanup Under Morphology Constraints remains fully completable from its declared core prerequisites.** Reaches `ecg-cleanup-under-morphology-constraints` as optional enrichment; the solution must name the connection and include a `<Ref>`.
