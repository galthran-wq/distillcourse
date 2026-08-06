# Research brief: fir-filter-design-and-verification (FIR Filter Design and Verification)

status: planned
module: filter-design-and-implementation
type: core
goal: Design and densely verify a linear-phase FIR filter from ripple, attenuation, transition-width, and delay requirements.
est_minutes: 40

## ARC

- **Inherits:** **z-Transform, Poles, Zeros, and ROC** and **Windows, Leakage, and Resolution** established zero geometry, causality, and the window metrics used to predict and verify FIR tradeoffs.
- **Spine step:** “The z-plane connects response to causality and stability; FIR and IIR methods approximate specifications with different phase and order costs.” (*Specifications become filters*). Caption: “Poles, zeros, ripples, and delay turn a desired response into coefficients.”
- **Contributes:** Design and densely verify a linear-phase FIR filter from ripple, attenuation, transition-width, and delay requirements. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `iir-filter-design-and-bilinear-mapping`, which design a stable IIR filter and judge its magnitude, phase, order, and transient tradeoffs.

## Sources to consult

- Oppenheim–Schafer, ch. 7 §§7.1–7.6 — linear-phase types, window, frequency sampling, optimum design, and transformations.
- Orfanidis, ch. 11 §§11.1–11.5 — ideal responses, windows, Kaiser formulas, and equiripple FIR design.
- J. O. Smith, ch. 4 — specifications, windowed FIR, least squares, frequency sampling, and Remez/convex design.
- Harris, §§V.C–V.I — window families and endpoint/sidelobe behavior used by the window method.
- MIT 6.341, Lecture 2 pp. 5–6 and Lecture 9 pp. 4–6 — symmetric FIR constant group delay, equiripple alternation, and dense-grid Parks–McClellan exchange verification.

## NOTATION

- Ledger family `filter-specifications`: declare $\omega_p,\omega_s,\delta_p,\delta_s,A_s$ as inequalities before selecting a method. Example: $\delta_p=0.01$ is a linear bound, whereas $A_s=60$ dB must be converted before direct comparison.
## Key points the lesson must cover

1. Ideal sinc responses are infinite and noncausal.
2. Window families map transition width to sidelobes.
3. Symmetry yields exact linear phase.
4. Equiripple and least-squares optimize different errors.

## Pitfalls / subtleties to flag

- Ideal sinc responses are infinite; truncation causes Gibbs ripple, coefficient quantization shifts zeros, and dense-grid extrema can occur between design samples.
- The ideal sinc response is infinite and noncausal; truncation, shifting, and window choice jointly set delay and approximation error, so the ideal response cannot be deployed unchanged.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Increasing rectangular-window length narrows Gibbs ripples without reducing their peak, while a Kaiser design trades explicit width for attenuation.
- Worked case grounded in MIT 6.341 Lecture 2 pp. 5–6 and Lecture 9 pp. 4–6: make a 51-tap real FIR symmetric about sample 25, verify group delay 25 samples wherever magnitude is nonzero, then use the exchange algorithm’s dense verification grid to catch an inter-grid ripple violation.

## FIGURE PLAN

1. `draw:` **Ideal rectangle ↔ infinite sinc, then truncate, shift, and window.** (sequence, 3–7 frames; one delta per frame) — Draw: the design process is explanatory.
2. `draw:` **Rectangular, Hann, and Blackman truncations with transition/ripple tradeoffs.** (single) — Draw: analytic comparison should be redrawn.
3. `draw:` **Four linear-phase FIR symmetry types with forced zeros and delays.** (single) — Draw: typeset table plus small plots.
4. `draw:` **Equiripple error alternation with pass/stop weights.** (single) — Draw: the optimality pattern is explanatory.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Form a 7-tap rectangular-window lowpass with cutoff $\pi/2$ and symmetry center $n=3$ using $h[n]=\sin((\pi/2)(n-3))/(\pi(n-3))$, including the limiting center value, then normalize to unity DC gain. Deliver before/after taps, verify $h[n]=h[6-n]$, and report group delay 3 samples.
2. **E6 — boundary probe.** Design at zero transition width, even/odd length boundaries, and a Nyquist-constrained symmetry type; state impossibilities.
3. **E6 — claim to refute.** Refute 'more taps remove the Gibbs peak' while distinguishing ripple height from transition width.
4. **E6 — research shaped.** Reproduce a minimum-tap design under dense-grid verification and compare window and equiripple families.
5. **E6 — strategy choice.** At 48 kHz, meet passband through 8 kHz, stopband from 10 kHz, ripple at most 0.01, and attenuation at least 60 dB using Kaiser-windowed sinc or Parks–McClellan equiripple design. The cue is reproducible monotone tuning versus minimum feasible taps; produce both tap counts, delays, and a dense-grid extrema table that checks between design-grid samples.
6. **FORWARD (E7).** Meet the same magnitude mask with a much lower-order recursive candidate and inspect its phase; IIR design names that trade. Reaches `iir-filter-design-and-bilinear-mapping`; the solution must name the connection and include a `<Ref>`.
