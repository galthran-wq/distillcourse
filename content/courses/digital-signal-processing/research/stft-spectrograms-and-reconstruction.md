# Research brief: stft-spectrograms-and-reconstruction (STFT, Spectrograms, and Reconstruction)

status: planned
module: spectral-measurement
type: core
goal: Design an STFT with window, hop, FFT length, and reconstruction conditions matched to a changing signal.
est_minutes: 40

## ARC

- **Inherits:** **Correlation, PSD, and Welch Estimation** established evaluate a stationary power-spectrum estimate through autocorrelation, bias, variance, leakage, overlap, and resolution.
- **Spine step:** “Random and changing signals require PSD estimators and local spectra whose bias, variance, time resolution, and reconstruction are declared.” (*Spectra become estimates*). Caption: “Recorded audio tests stationary, stochastic, and short-time claims.”
- **Contributes:** Design an STFT with window, hop, FFT length, and reconstruction conditions matched to a changing signal. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `recorded-audio-spectral-analysis` on the core path; `parametric-spectral-estimation` is an optional branch and is not a prerequisite.

## Sources to consult

- J. O. Smith, chs. 7–9 — STFT conventions, spectrograms, overlap processing, COLA/WOLA, and filter-bank view.
- Orfanidis, ch. 18 §§18.1–18.6 and §18.11 — STFT, inverse, COLA conditions, and hop/window experiments.
- MIT 6.341, Lecture 21 pp. 1–5, Lecture 22 pp. 1–6, and PS10 Problems 10.1–10.4 — short-time analysis, modulated-filter-bank equivalence, polyphase/FFT implementation, and reconstruction.
- Oppenheim–Schafer, ch. 10 §10.5 — speech and radar spectrograms.

## NOTATION

- Ledger family `stft-and-filter-banks`: write $X[\ell,k]$ for frame/bin coefficients, $g[n]$ for the synthesis window, and keep frame $\ell$ distinct from correlation lag. Declare centering, conjugation, FFT scale, endpoint padding, and synthesis normalization.
## Key points the lesson must cover

1. Window length trades time for frequency localization.
2. FFT length changes display sampling, not window resolution.
3. Hop size samples the time axis.
4. COLA/WOLA conditions govern reconstruction.

## Pitfalls / subtleties to flag

- Uniform time-frequency cells, edge padding, phase conventions, COLA, latency, and transient smearing constrain the display and inverse.
- A longer window improves frequency localization only by smearing changes in time, and a larger FFT at fixed window length merely densifies the displayed frequency samples.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A 20 ms speech window captures about two periods of a 100 Hz voiced fundamental while remaining short enough to localize most frames within one phoneme.
- Worked case grounded in J. O. Smith ch. 8: analyze a signal with a periodic Hann window and 50% hop, verify the overlap sum is constant away from boundaries, resynthesize below $10^{-10}$ relative error, then change only the hop and expose amplitude modulation.

## FIGURE PLAN

1. `draw:` **Sliding frame → window → FFT sequence over a chirp.** (sequence, 3–7 frames; one delta per frame) — Draw: the process changes one frame at a time.
2. `draw:` **STFT as local DFTs beside the equivalent modulated filter bank.** (single) — Draw: dual explanatory views need shared labels.
3. `draw:` **Time-frequency cells changing aspect ratio with window length.** (single) — Draw: the uncertainty tradeoff is explanatory.
4. `draw:` **Shifted windows summing to constant versus a rippled overlap sum.** (single) — Draw: the COLA condition is mathematical. Inspiration: SASP §7.1; Orfanidis §18.11.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Use periodic Hann samples $[0,0.5,1,0.5]$ with hop $R=2$. Add three shifted windows over the interior timeline, tabulate the overlap sum, and verify it is constant at one away from boundaries; state the synthesis normalization and predict the amplitude modulation if the hop changes to three.
2. **E6 — boundary probe.** Probe hop 1, hop equal to window length, a one-sample window, and a signal shorter than one frame.
3. **E6 — claim to refute.** Refute 'a narrower time window improves both time and frequency resolution' with an uncertainty-bound example.
4. **E6 — derivation not shown.** Derive the overlap-sum reconstruction condition for a selected window and hop.
5. **E6 — strategy choice.** Analyze a signal containing a 12 ms click and two steady tones 40 Hz apart using either 20 ms or 80 ms Hann STFT windows at 16 kHz. The cue is event timing versus narrow frequency separation; produce both parameter ledgers (sample count, hop, FFT length, bin spacing, latency), select one for each claim, and verify normalized overlap-add reconstruction below $-80$ dB.
6. **FORWARD (E7).** Run the declared STFT settings on a speech phrase and specify which measured structures must survive the audio application; the optional parametric branch is not required. Reaches `recorded-audio-spectral-analysis`; the solution must name the connection and include a `<Ref>`.
