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

1. **The flaw first.** The ideal lowpass the z-transform lesson inverted is an
   infinite two-sided sinc: exact in principle, undeployable as written. Every
   FIR method is a controlled answer to "what do we give up to make it finite
   and causal" — and the currency is a specification, not a vibe.
2. **Specification language before any method**: passband/stopband edges
   $\omega_p,\omega_s$, linear ripples $\delta_p,\delta_s$, and the conversion
   $A_s=-20\log_{10}\delta_s$ — a $60$ dB stopband is $\delta_s=10^{-3}$.
   Requirements are inequalities on a dense grid, never equalities at a few
   samples.
3. **The window method is the windows lesson reapplied**: truncation is
   multiplication in time, so the realized response is the ideal response
   convolved with the window transform (spiral revisit of
   `windows-leakage-and-resolution` — same convolution, new target). Gibbs
   follows: the rectangular truncation's ~9% overshoot and ~21 dB stopband do
   not improve with more taps; taps buy transition width, not ripple height.
   Canonical window-design stopbands: rectangular ~21 dB, Hann ~44 dB,
   Hamming ~53 dB, Blackman ~74 dB (verify exact values against
   Oppenheim–Schafer's window-design table before quoting).
4. **Kaiser makes the tradeoff a formula**: $\beta$ from the attenuation, tap
   estimate $N\approx(A_s-7.95)/(2.285\,\Delta\omega)$. Worked: 60 dB over a
   2 kHz transition at $f_s=48$ kHz gives $\Delta\omega=2\pi\cdot2/48=0.262$
   rad, $N\approx(60-7.95)/(2.285\cdot0.262)\approx87$ — call it 89 taps for
   odd symmetry. The reader should be able to produce this estimate unaided.
5. **Symmetry buys exact linear phase and costs delay**: the four
   linear-phase types with their forced zeros (type II forces $H=0$ at $\pi$ —
   no highpass; types III/IV force a zero at DC — differentiators and Hilbert
   transformers live there). Delay is $(N-1)/2$ samples: the 89-tap design
   above delays 44 samples $\approx0.92$ ms — the number the ECG application
   later charges against wearable latency.
6. **Equiripple as constrained optimality**: the alternation picture — the
   best weighted-Chebyshev design equalizes its error extrema, and the exchange
   algorithm hunts them on a dense grid. Equiripple beats windowed designs on
   tap count at the same mask because window designs waste attenuation where
   the mask does not require it; least squares instead minimizes energy and
   concedes edge peaks.
7. **Verification is part of design (the lesson title's second half)**:
   evaluate on a grid much denser than the design grid, check between-extrema
   behavior, and confirm coefficient symmetry survived rounding. A design that
   passes on its own grid and fails between samples is the documented failure
   mode of naive frequency sampling.

## Misconception to refute (L13)

- "Increase the filter length and the ripple goes away." Prevalent because it
  is true of transition width and false of Gibbs ripple height — truncation
  ripple converges in $L^2$, not uniformly. Refutation: rectangular designs at
  $N=31$, $101$, $301$ all peak near the same ~9% overshoot; only the window
  shape (or an equiripple formulation) moves the peak. Replacement model:
  taps buy transition width; the window's sidelobe envelope buys ripple.
  Discriminating example is the claim-to-refute exercise below.

## Pitfalls / subtleties to flag

- Ideal sinc responses are infinite; truncation causes Gibbs ripple, coefficient quantization shifts zeros, and dense-grid extrema can occur between design samples.
- The ideal sinc response is infinite and noncausal; truncation, shifting, and window choice jointly set delay and approximation error, so the ideal response cannot be deployed unchanged.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Increasing rectangular-window length narrows Gibbs ripples without reducing their peak, while a Kaiser design trades explicit width for attenuation.
- Worked case grounded in MIT 6.341 Lecture 2 pp. 5–6 and Lecture 9 pp. 4–6: make a 51-tap real FIR symmetric about sample 25, verify group delay 25 samples wherever magnitude is nonzero, then use the exchange algorithm’s dense verification grid to catch an inter-grid ripple violation.
- The Kaiser estimate as a planning tool: 60 dB / 2 kHz transition / 48 kHz sample rate → ~89 taps and 0.92 ms delay; halving the transition width doubles the taps and the delay. Three numbers a designer can produce on paper before touching a tool.
- Zero-plot literacy: a linear-phase FIR's zeros come in reciprocal-conjugate quadruples ($z_0$, $z_0^*$, $1/z_0$, $1/z_0^*$); stopband zeros sit ON the unit circle where the response must vanish, transition/passband shaping zeros sit off it. One annotated zero plot of the worked design makes equiripple structure visible.
- Type-II trap in one line: an even-length symmetric FIR has a forced zero at $z=-1$, so an even-length highpass "design" fails before it starts — the symmetry-type table is a feasibility check, not trivia.

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
