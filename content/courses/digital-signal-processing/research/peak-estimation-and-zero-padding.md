# Research brief: peak-estimation-and-zero-padding (Peak Estimation and Zero-Padding Limits)

status: planned
module: spectral-measurement
type: core
goal: Estimate sinusoidal frequency and amplitude without confusing spectral interpolation with physical resolution.
est_minutes: 36

## ARC

- **Inherits:** **Windows, Leakage, and Resolution** and **FFT Factorization and Machine Layout** established window-dependent peak shape and efficient evaluation of denser DFT grids.
- **Spine step:** “Finite records trade leakage against resolution, and isolated-tone interpolation cannot manufacture observation time.” (*Observation limits spectra*). Caption: “Window metrics replace visual preference with measurement.”
- **Contributes:** Estimate sinusoidal frequency and amplitude without confusing spectral interpolation with physical resolution. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `correlation-psd-and-welch`, which evaluate a stationary power-spectrum estimate through autocorrelation, bias, variance, leakage, overlap, and resolution.

## Sources to consult

- J. O. Smith, ch. 5 §§5.3–5.7 — windowed sinusoids, resolution criteria, QIFFT, interpolation bias, and zero-padding requirements.
- Lyons, §3.11 — DFT resolution, zero padding, and frequency-domain sampling.
- MIT 6.341, Lecture 17 pp. 2–3 and PS9 Problem 9.7 with solution p. 12 — zero padding as denser DTFT sampling, window length as resolution control, and estimator identification from sample density and peak width.
- Schaedler, lessons 24–26 — side-by-side longer-record, fixed-data zero-padding, and leakage interactions.

## Key points the lesson must cover

1. Record duration sets resolving power.
2. Zero padding interpolates the same DTFT.
3. Peak interpolation is window-dependent and biased.
4. Relative phase can create false two-peak resolution.

## Pitfalls / subtleties to flag

- Parabolic interpolation is window-dependent and biased; phase, neighboring tones, low SNR, and insufficient record length violate the single-peak model.
- Zero padding refines the display grid and can improve interpolation, but it does not narrow the window main lobe; only a longer informative record changes the physical resolving power.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A phase-quadrature two-tone pair can draw two apparent bumps before it is truly resolvable, and the bump locations are biased.
- Worked case grounded in MIT 6.341 Lecture 17: zero-pad one 64-sample tone record to 1024 points and observe a 16-times denser grid but the same main-lobe width; repeat with a 256-sample observation to obtain the narrower lobe that can actually separate a nearby tone.

## FIGURE PLAN

1. `draw:` **Three adjacent dB bins and fitted parabola with offset p.** (single) — Draw: the formula/geometry is explanatory. Inspiration: SASP §5.6.1.
2. `draw:` **Fixed samples with increasing zero padding versus genuinely longer samples.** (single) — Draw: constructed comparison carries the distinction.
3. `draw:` **Two equal tones under in-phase and quadrature cases with misleading peak locations.** (single) — Draw: analytic experiment should be redrawn. Inspiration: SASP Figs. 5.7–5.9.
4. `draw:` **Estimator error versus padding factor for several windows, with an asymptotic bias floor.** (single) — Draw: compute course curves from formulas rather than source a chart.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* A zero-padded spectrum has adjacent dB samples $\alpha=-12$, $\beta=0$, and $\gamma=-6$ at bins 19, 20, and 21 with 10 Hz grid spacing. Use $p=(1/2)(\alpha-\gamma)/(\alpha-2\beta+\gamma)$ to estimate the fractional-bin offset and frequency; state the zero-denominator boundary and isolated-peak assumption.
2. **E6 — boundary probe.** Handle an exactly bin-centered tone, a half-bin tone, zero amplitude, and two coincident tones.
3. **E6 — claim to refute.** Refute 'two visible bumps imply unbiased frequency estimates' with a phase-quadrature counterexample.
4. **E6 — derivation not shown.** Derive the closed-form parabolic offset from three samples and identify the zero denominator case.
5. **E6 — strategy choice.** For (a) locating one isolated off-bin tone more precisely from a fixed 64-sample record and (b) separating two tones hidden inside that record’s main lobe, choose between zero-padding plus peak interpolation and acquiring a longer record. The cue is single-peak localization versus physical multi-component resolution; produce the selected acquisition/FFT plan and check main-lobe width in original-bin units.
6. **FORWARD (E7).** Generate 50 equal-length white-noise records and measure one bin’s squared magnitude; the spread motivates an estimator rather than one transform. Reaches `correlation-psd-and-welch`; the solution must name the connection and include a `<Ref>`.
