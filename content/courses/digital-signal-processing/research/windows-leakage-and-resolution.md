# Research brief: windows-leakage-and-resolution (Windows, Leakage, and Resolution)

status: planned
module: spectral-measurement
type: core
goal: Evaluate analysis windows from main-lobe width, sidelobes, coherent gain, scalloping, and equivalent noise bandwidth.
est_minutes: 40

## ARC

- **Inherits:** **DFT Bins, Symmetry, and Scaling** established finite-record bin locations, normalization, and the distinction between linear and circular interpretations.
- **Spine step:** “Finite records trade leakage against resolution, and isolated-tone interpolation cannot manufacture observation time.” (*Observation limits spectra*). Caption: “Window metrics replace visual preference with measurement.”
- **Contributes:** Evaluate analysis windows from main-lobe width, sidelobes, coherent gain, scalloping, and equivalent noise bandwidth. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `peak-estimation-and-zero-padding`, which estimate sinusoidal frequency and amplitude without confusing spectral interpolation with physical resolution.

## Sources to consult

- Harris 1978, §§II–VII, especially §§III–IV and §VI — DFT-even records, leakage, ENBW, coherent/scalloping loss, and the unequal-tone experiment.
- J. O. Smith, Spectral Audio Signal Processing, ch. 3 — rectangular, generalized Hamming, Blackman–Harris, Kaiser, and measured oboe comparisons.
- MIT 6.341, Lecture 17 pp. 1–3 and PS9 Problems 9.1–9.5 — finite-record convolution, Kaiser main-lobe/sidelobe tradeoffs, picket-fence sampling, zero padding, and resolvability. Lecture 19 is FFT material and is not used for these window claims.
- Oppenheim–Schafer, ch. 10 §§10.1–10.4 — Fourier analysis of finite data and window effects.

## NOTATION

- Ledger family `windows-and-frames`: use $w[n]$ and $W(e^{j\omega})$ for a window and its DTFT, $R$ for hop, and $\ell$ for frame index. State symmetric versus periodic endpoints, coherent gain, centering, and whether $N$ is record or FFT length.
## Key points the lesson must cover

1. Leakage is caused by finite observation, not sampling.
2. Endpoint smoothness controls far sidelobes.
3. Narrow main lobes and low sidelobes conflict.
4. Coherent gain and ENBW calibrate signal and noise.

## Pitfalls / subtleties to flag

- No window is universally best; DFT-even conventions, coherent gain, ENBW, overlap, phase, and strong-neighbor bias matter.
- Leakage comes from finite observation and window sidelobes, whereas aliasing comes from sampling; changing the sample rate cannot repair a weak tone buried under a strong tone’s window sidelobes.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Harris’s -40 dB tone is perfectly visible beside a bin-centered strong tone and completely hidden when the strong tone moves half a bin.
- Worked case grounded in Harris §§III–VI: measure a bin-centered sinusoid through a Hann window, divide the spectral amplitude by the coherent gain $\sum_n w[n]$, and recover the input amplitude; omitting that correction creates a window-dependent calibration error even with no leakage.

## FIGURE PLAN

1. `draw:` **Off-bin sinusoid periodic extension before/after tapering.** (sequence, 3–7 frames; one delta per frame) — Draw: boundary repair is explanatory. Inspiration: Harris §§II–III.
2. `draw:` **Window time shape paired with main lobe, sidelobes, ENBW, and coherent gain.** (single) — Draw: several metrics need a common legend.
3. `draw:` **Strong kernel masking a −40 dB nearby tone.** (single) — Draw: the synthetic test is designed to expose leakage.
4. `draw:` **Window tradeoff map: worst-case loss versus peak sidelobe, with no single winner.** (single) — Draw: redraw the comparison; source plot is analytic, not an artifact. Inspiration: Harris Fig. 12.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For the periodic four-sample Hann window $w=[0,0.5,1,0.5]$, compute coherent gain $(\sum w)/N$ and ENBW $N\sum w^2/(\sum w)^2$ in bins. Apply the window to a bin-centered sinusoid of amplitude one and show which correction recovers amplitude one; report the uncorrected bias and the $1.5$-bin ENBW check.
2. **E6 — boundary probe.** Probe bin-centered and half-bin tones, equal-frequency tones, and two tones at the 6 dB crossover.
3. **E6 — claim to refute.** Refute 'Hann and Hamming differ only in spelling' by comparing endpoint continuity and far-sidelobe decay.
4. **E6 — derivation not shown.** Derive ENBW and coherent gain for a short numerical window and predict processing loss.
5. **E6 — strategy choice.** Choose between a rectangular window and a four-term Blackman–Harris window for (a) separating two equal tones one main-lobe width apart and (b) detecting a tone $40$ dB below a strong tone $5.5$ bins away. The cue is whether main-lobe width or sidelobe rejection limits the claim; produce a two-case selection table with measured main-lobe-width and local-leakage checks that could overturn each choice.
6. **FORWARD (E7).** Zero-pad one windowed off-bin tone and estimate its peak, then keep the observed samples fixed; the next lesson separates interpolation error from resolution. Reaches `peak-estimation-and-zero-padding`; the solution must name the connection and include a `<Ref>`.
