# Research brief: recorded-audio-spectral-analysis (Recorded Audio Spectral Analysis)

status: planned
module: spectral-measurement
type: synthesis
goal: Defend spectral-analysis parameters on measured music and speech and verify reconstruction.
est_minutes: 40

## ARC

- **Inherits:** **STFT, Spectrograms, and Reconstruction** established how window, hop, FFT length, and overlap conditions control time-frequency evidence and reconstruction. Parametric Spectral Estimation is optional enrichment; the application is fully completable with the core STFT/PSD path.
- **Spine step:** “Random and changing signals require PSD estimators and local spectra whose bias, variance, time resolution, and reconstruction are declared.” (*Spectra become estimates*). Caption: “Recorded audio tests stationary, stochastic, and short-time claims.”
- **Contributes:** Defend spectral-analysis parameters on measured music and speech and verify reconstruction. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `z-transform-poles-zeros-and-roc`, which analyze sequences and rational systems using region of convergence, pole-zero geometry, causality, and stability.

## Sources to consult

- J. O. Smith, ch. 3 “Spectrum Analysis of an Oboe Tone” and ch. 7 §§7.2–7.3 — captured oboe window comparisons and speech spectrograms.
- J. O. Smith, ch. 5 §§5.4–5.5 — phase-dependent false resolution and tone-separation criteria.
- Harris, §VI — fixed-axis controlled window comparison for a weak neighbor.
- MIT 6.341 Project I — phase audibility and noisy-speech analysis as empirical project patterns.

## Key points the lesson must cover

1. Instrument harmonics test leakage and dynamic range.
2. Speech tests changing formants and voicing.
3. Autocorrelation, Welch, and repeated frames expose estimator variability from complementary views.
4. A reconstruction null test checks conventions.

## Pitfalls / subtleties to flag

- Attacks, vibrato, inharmonicity, formant motion, colored noise, and phase evolution make a stationary sinusoid-plus-white-noise model incomplete.
- A stationary harmonic model may describe the sustain but fail at an attack or moving formant; require claims to persist across adjacent frames before treating one attractive spectrum as evidence.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- The same oboe recording under rectangular, Hamming, and Blackman windows reveals or hides different upper harmonics without changing the instrument.
- Worked case grounded in J. O. Smith’s PARSHL comparison: resynthesize one piano frame once with measured phases and once with phases discarded, align both to the original, and use the residual waveform to show why equal magnitude spectra do not imply equal reconstruction.

## FIGURE PLAN

1. `source:` **jos-s1-oboe-rectangular** (single sourced raster) — Recorded oboe under rectangular analysis. Source: the weak-harmonic masking is measured.
2. `source:` **jos-s1-oboe-hamming** (single sourced raster) — Same oboe under Hamming analysis. Source: the controlled measured comparison matters.
3. `source:` **jos-s1-oboe-blackman** (single sourced raster) — Same oboe under Blackman analysis. Source: the measured harmonic/noise-floor result matters.
4. `source:` **speech-spectrograms-compared** (single sourced raster) — One utterance under four spectral/perceptual displays. Source: the data-dependent representation changes are evidence.
5. `source:` **jos-s4-parshl-phase-comparison** (single sourced raster) — Piano original, phase-aware synthesis, and magnitude-only synthesis. Source: the reconstruction mismatch is measured.
6. `draw:` **Analysis parameter ledger and adjacent-frame stability checks.** (single) — Draw: this is a new course study result.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* At $f_s=16$ kHz, convert a 25 ms window and 10 ms hop to samples, choose $N_{\mathrm{FFT}}=512$, compute grid spacing, and determine the number of complete frames in a 1.000 s clip without end padding. Deliver a parameter ledger and check that changing $N_{\mathrm{FFT}}$ alone does not change the 25 ms observation duration.
2. **E6 — boundary probe.** Analyze silence, a single impulse, a steady sine, and a frame straddling an attack; state which estimator assumptions hold.
3. **E6 — claim to refute.** Refute 'magnitude alone determines the waveform' with the phase-ablation reconstruction.
4. **E6 — research shaped.** Reproduce one harmonic-visibility or spectrogram comparison with a rights-cleared clip and predeclared parameters.
5. **E6 — strategy choice.** For (a) estimating the average noise floor of a steady 500 ms oboe sustain and (b) locating moving speech formants across a one-second utterance, choose between Welch PSD averaging and an order-preserving STFT. The cue is whether frame order is disposable or is itself evidence; produce the parameter ledger, a neighboring-frame stability check, and an STFT reconstruction null below $-80$ dB.
6. **FORWARD (E7).** Fit a rational response to one measured spectral envelope and mark the implied poles; the next module makes ROC and stability explicit. Reaches `z-transform-poles-zeros-and-roc`; the solution must name the connection and include a `<Ref>`.
## APPLICATION

- **Artifact/study:** Recorded oboe, speech, and piano analyses comparing leakage, peak estimation, Welch stability, STFT resolution, and phase-aware resynthesis.
- **Results cashed out:** window figures of merit; peak interpolation; PSD estimation; STFT/COLA; phase interpretation.
- **Executable protocol:**
  - Use one rights-cleared isolated note and one utterance; publish exact sample rate, frame length, window, hop, and FFT length.
  - Predict which weak harmonics each window will reveal before computing the spectra.
  - Estimate fundamental/partials and repeat across adjacent frames; compare raw periodogram and Welch variability.
  - Compute a finite-lag autocorrelation-derived PSD on one steady segment and explain any disagreement with Welch from lag truncation, windowing, or nonstationarity.
  - Compute two spectrogram parameterizations and one magnitude-only versus phase-preserving reconstruction.
- **Target / threshold:** Stable voiced-frequency estimates within 1% across adjacent frames, and reconstruction error below −80 dB for the phase-preserving COLA path; every claimed harmonic must persist under a neighboring-frame check.
- **Falsification:** Reject 'the plot with the most FFT bins has the best physical resolution' using fixed-data padding and longer-data comparisons.
- **Idealization gap:** Stationary sinusoids, white noise, exact bin centering, and perfect COLA are approximations; attacks, vibrato, formant motion, colored noise, and finite frames break them.
- **Deliverable:** Parameter ledger, matched spectrum panels, variability statistics, reconstruction check, and listening files.
- **Data/rights gate:** SOURCED (license review deferred) — `research/data/audio-clips-v1/` holds a sustained oboe C4 (Iowa MIS, 44.1 kHz) and clean speech (CMU Arctic, 16 kHz); run the lesson's protocol on these. Published JOS plots remain rights-gated context; never redraw measured curves. See provenance.json for the pre-publication license checklist.
