# Research brief: iir-filter-design-and-bilinear-mapping (IIR Filter Design and Bilinear Mapping)

status: planned
module: filter-design-and-implementation
type: core
goal: Design a stable IIR filter and judge its magnitude, phase, order, and transient tradeoffs.
est_minutes: 40

## ARC

- **Inherits:** **z-Transform, Poles, Zeros, and ROC** established pole-zero geometry, causality, stability, and unit-circle response for rational systems.
- **Spine step:** “The z-plane connects response to causality and stability; FIR and IIR methods approximate specifications with different phase and order costs.” (*Specifications become filters*). Caption: “Poles, zeros, ripples, and delay turn a desired response into coefficients.”
- **Contributes:** Design a stable IIR filter and judge its magnitude, phase, order, and transient tradeoffs. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `fast-convolution-and-streaming-blocks`, which implement long FIR filtering with overlap-add or overlap-save while preserving linear convolution.

## Sources to consult

- Oppenheim–Schafer, ch. 7 IIR-design sections and Appendix B — analog prototypes, impulse invariance, bilinear transform, and frequency transformations.
- Orfanidis, chs. 12–13 — bilinear mapping, Butterworth, Chebyshev, elliptic prototypes, order comparison, and LP/HP/BP/BS transformations.
- Lyons, ch. 6 §§6.6–6.13 — IIR structures, impulse invariance, bilinear design, warping, and comparisons.
- MIT 6.341, Lecture 8 pp. 1–2 and Lecture 7 pp. 1–3, 6–20, with PS4 Problems 4.1–4.5 — IIR magnitude specifications, bilinear prewarping, direct/cascade/parallel realizations, and coefficient-quantization sensitivity.

## Key points the lesson must cover

1. Analog prototypes trade flatness and ripple.
2. The bilinear transform preserves stability.
3. Prewarping corrects selected frequency edges.
4. High-Q poles increase sensitivity and settling time.

## Pitfalls / subtleties to flag

- Bilinear warping, nonlinear group delay, high-Q coefficient sensitivity, state growth, and startup transients matter more than ideal order.
- Analog prototype families trade passband flatness, ripple, stopband ripple, order, and delay differently; the lowest-order magnitude match may have unacceptable group-delay variation.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Under one shared brick-wall specification, Orfanidis reports orders 35, 10, 10, and 5 for Butterworth, Chebyshev I, Chebyshev II, and elliptic designs.
- Worked case grounded in Oppenheim–Schafer §7.1.2: prewarp a digital edge $\omega_p=0.2\pi$ with $\Omega_p=(2/T)\tan(0.1\pi)$, design the analog prototype at that edge, and map back to verify the selected edge lands exactly while other frequencies warp.

## FIGURE PLAN

1. `draw:` **Analog lowpass poles mapped inside the digital unit circle.** (sequence, 3–7 frames; one delta per frame) — Draw: the bilinear mapping is explanatory.
2. `draw:` **Frequency prewarping: analog Ω axis compressed onto digital ω.** (single) — Draw: formula and axis mapping need shared labels.
3. `draw:` **Butterworth, Chebyshev, and elliptic responses at matched specification with order/group delay ledger.** (single) — Draw: analytic comparison should be redrawn.
4. `draw:` **Impulse/step responses of equal-magnitude-ish FIR and IIR choices showing delay and ringing.** (single) — Draw: course-computed comparison carries engineering judgment.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* With $f_s=8$ kHz and desired digital edge $\omega_p=0.2\pi$, compute $\Omega_p=2f_s\tan(\omega_p/2)$ and map the pole $s=-\Omega_p$ through $z=(1+s/(2f_s))/(1-s/(2f_s))$. Deliver a four-line ledger verifying $\Omega_p\approx5198.7$ rad/s, $z\approx0.5095$, and the inverse-mapped edge $0.2\pi$.
2. **E6 — boundary probe.** Probe poles near z=1, repeated poles, zero cutoff, and a requested linear-phase IIR; identify infeasible or sensitive cases.
3. **E6 — claim to refute.** Refute 'lower order means lower total cost' using group delay, state range, and coefficient precision.
4. **E6 — derivation not shown.** Derive the prewarped analog edge for one digital cutoff and verify it maps back exactly.
5. **E6 — strategy choice.** At 48 kHz, meet a 6 kHz passband, 8 kHz stopband, 1 dB passband allowance, and 60 dB stopband attenuation using Butterworth or elliptic prototypes. The cue is whether ripple and high-Q settling are acceptable for fewer sections; submit order, maximum pole radius, ripple, stopband peak, 1% settling time, and group-delay spread, identifying the first rejected metric.
6. **FORWARD (E7).** Estimate the direct convolution cost of a 4096-tap FIR in 256-sample blocks and choose an FFT length; the next lesson supplies valid overlap bookkeeping. Reaches `fast-convolution-and-streaming-blocks`; the solution must name the connection and include a `<Ref>`.
