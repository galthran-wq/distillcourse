# Research brief: correlation-psd-and-welch (Correlation, PSD, and Welch Estimation)

status: planned
module: spectral-measurement
type: core
goal: Evaluate a stationary power-spectrum estimate through autocorrelation, bias, variance, leakage, overlap, and resolution.
est_minutes: 40

## ARC

- **Inherits:** **Peak Estimation and Zero-Padding Limits** and **DTFT and Frequency Response** established finite-record spectral limits and the transform relation used to connect autocorrelation with power spectral density.
- **Spine step:** “Random and changing signals require PSD estimators and local spectra whose bias, variance, time resolution, and reconstruction are declared.” (*Spectra become estimates*). Caption: “Recorded audio tests stationary, stochastic, and short-time claims.”
- **Contributes:** Evaluate a stationary power-spectrum estimate through autocorrelation, bias, variance, leakage, overlap, and resolution. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `stft-spectrograms-and-reconstruction`, which design an STFT with window, hop, FFT length, and reconstruction conditions matched to a changing signal.

## Sources to consult

- Stoica–Moses, ch. 1 §§1.3–1.5 and ch. 2 §§2.2–2.7 — PSD, periodogram/correlogram equivalence, bias, variance, windows, and refined estimators.
- J. O. Smith, ch. 6 §§6.4–6.15 — autocorrelation, PSD, periodogram, Welch, filtered noise, and processing gain.
- Oppenheim–Schafer, Appendix A and ch. 10 — random-process review and spectral estimation.
- Harris, §IV.A–C — ENBW, processing gain, and overlap correlation.

## NOTATION

- Ledger family `random-signals`: distinguish expectation $E\{\cdot\}$ from a sample average, use $r_{xx}[\ell]$ for lag and $S_{xx}(e^{j\omega})$ for PSD, and declare one/two-sided and per-Hz/per-radian scaling. Example: unit-variance white noise has $r_{xx}[\ell]=\delta[\ell]$.
## Key points the lesson must cover

1. PSD is the DTFT of autocorrelation for WSS processes.
2. A raw periodogram is not a consistent estimator.
3. Averaging reduces variance at a resolution cost.
4. Overlapped frames are correlated evidence.

## Pitfalls / subtleties to flag

- Stationarity is a model, periodogram variance persists, overlap creates correlation, and smoothing can hide narrow components.
- The PSD–autocorrelation transform pair assumes a WSS process, while a finite-record correlogram is only an estimator; do not use one realization’s sample average as if it were the ensemble expectation.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Repeated white-noise periodograms stay jagged; Welch looks stable only after the plot also reveals the broader effective spectral smoothing.
- Worked case grounded in Stoica–Moses ch. 2: form 16 equal-length periodograms from independent seeded white-noise records, average them, and compare bin variance with one raw periodogram; the roughness drops while the segment-length main lobe fixes the sacrificed resolution.

## FIGURE PLAN

1. `draw:` **Lag products building an autocorrelation estimate and its PSD transform.** (sequence, 3–7 frames; one delta per frame) — Draw: the estimator is explanatory.
2. `draw:` **Many periodograms from one process beside their unchanged variance envelope.** (single) — Draw: seeded course simulation, not sourced data.
3. `draw:` **Welch framing: window, overlap, squared FFT, average.** (single) — Draw: a pipeline should be redrawn.
4. `draw:` **Resolution–variance Pareto plot as frame length changes.** (single) — Draw: compute from the demo trials. Inspiration: Stoica–Moses Ch. 2; SASP Ch. 6.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $x=[1,-1,1,-1]$, compute biased autocorrelation estimates at lags 0 through 3 using denominator $N$ and mirror the positive lags. Evaluate the finite Fourier sum at $\omega=0$ and $\pi$; verify $\hat r=[1,-0.75,0.5,-0.25]$, $\hat S(0)=0$, and $\hat S(\pi)=4$ before interpreting the high-frequency power.
2. **E6 — boundary probe.** Analyze white noise, a deterministic impulse, a constant random variable, and a record too short for a requested lag.
3. **E6 — claim to refute.** Refute 'the periodogram is consistent because its expected value approaches the PSD' by separating bias from variance.
4. **E6 — research shaped.** Reproduce the stated coefficient-of-variation result over seeded trials and report confidence intervals.
5. **E6 — strategy choice.** Estimate the PSD of a stationary 16,384-sample record containing two tones $0.04$ cycles/sample apart in seeded white noise using either one full-record periodogram or Welch averaging with shorter overlapped segments. The cue is required tone separation versus estimator variance; produce a predeclared segment/window/overlap choice, predicted resolution, and coefficient-of-variation check over 50 trials.
6. **FORWARD (E7).** Keep the Welch frames in time order and locate when one tone begins; the STFT preserves exactly the information averaging discarded. Reaches `stft-spectrograms-and-reconstruction`; the solution must name the connection and include a `<Ref>`.
