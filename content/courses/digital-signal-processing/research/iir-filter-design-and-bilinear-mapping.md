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

1. **The flaw first.** The FIR lesson's mask arithmetic gets expensive when
   the transition is sharp: the same 60 dB mask that costs ~89 FIR taps at a
   2 kHz transition costs hundreds when the transition narrows. Feedback meets
   sharp magnitude cheaply — the lesson's question is what the recursion
   charges in phase, sensitivity, and transients.
2. **Prototype families are named tradeoffs**: Butterworth (maximally flat,
   slow rolloff), Chebyshev I (passband ripple buys rolloff), Chebyshev II
   (stopband ripple, flat passband), elliptic (ripple both sides, minimum
   order). Keep the Orfanidis shared-mask order comparison (35/10/10/5) as the
   headline, and add a fully derived Butterworth order: for $f_s=48$ kHz,
   1 dB at 6 kHz, 60 dB at 8 kHz, prewarped edges give
   $\Omega_p=96000\tan(\pi\cdot6/48)=96000\tan(22.5^\circ)\approx39.8$ krad/s,
   $\Omega_s=96000\tan(30^\circ)\approx55.4$ krad/s, ratio $1.394$, and
   $n\ge\log_{10}\!\big[(10^{6}-1)/(10^{0.1}-1)\big]/\big(2\log_{10}1.394\big)
   \approx22.9$ → order 23 Butterworth where an elliptic meets the same mask
   near order 6 — the family choice is an order-of-magnitude decision.
3. **Impulse invariance vs bilinear, argued not listed**: sampling an analog
   impulse response aliases its tail (usable only for strictly bandlimited
   prototypes); the bilinear transform is an algebraic map with no aliasing
   whose price is frequency warping $\omega=2\arctan(\Omega T/2)$. State why
   the left half-plane maps exactly onto the open unit disk — stability
   preservation is a theorem, not a habit.
4. **Prewarping is exact only where you spend it**: chosen edges land
   exactly; everything between warps. The worked ledger
   ($\Omega_p=2f_s\tan(\omega_p/2)$, map, invert, land) is the lesson's
   central computation.
5. **Phase is the bill**: IIR phase is nonlinear by construction; group delay
   peaks near the band edge and grows with pole Q. An elliptic that saves 4×
   the order can cost a band-edge group-delay peak an order of magnitude above
   its passband average — compute it on the worked design rather than assert
   it.
6. **High-Q poles are fragile poles**: sensitivity and settling both scale
   with $1/(1-\rho)$; the settling gate from module 1
   ($N_{1\%}=\lceil\ln0.01/\ln\rho\rceil$) reappears here as a design output
   (spiral revisit). A pole at $\rho=0.995$ needs ~919 samples to settle to
   1% — sharp filters ring long before they quantize badly.
7. **Realization preview, one sentence**: the transfer function chosen here
   is not yet an implementation; direct-form vs SOS divergence is the next
   lesson's subject, so this lesson reports only the maximum pole radius as
   the fragility indicator.

## Misconception to refute (L13)

- "Lower order means cheaper." Prevalent because multiply counts are the
  visible cost. Refutation: charge the order-6 elliptic its full bill on the
  worked mask — band-edge group-delay spread, 1% settling time from its
  maximum pole radius, and the coefficient word length the high-Q sections
  will demand next lesson — against the order-23 Butterworth's (or a linear-
  phase FIR's) flat delay and benign sensitivity. Replacement model: order
  counts multiplies; delay spread, settling, and precision are the rest of
  the price, and either candidate can win once all four are on the table.

## Pitfalls / subtleties to flag

- Bilinear warping, nonlinear group delay, high-Q coefficient sensitivity, state growth, and startup transients matter more than ideal order.
- Offline forward-backward filtering (filtfilt) squares the magnitude and cancels phase — a legitimate escape from IIR phase cost, but only for finished records; presenting it as a general fix hides its acausality and its doubled attenuation. Name it once, with both caveats.
- The bilinear map compresses the entire infinite analog axis onto $(-\pi,\pi)$; comparing an analog prototype's rolloff "in Hz" with the digital response without the $\tan$ map misreads every frequency except the prewarped edges.
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
