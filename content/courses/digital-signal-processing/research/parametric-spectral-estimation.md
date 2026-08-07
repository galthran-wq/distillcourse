# Research brief: parametric-spectral-estimation (Parametric Spectral Estimation)

status: planned
module: spectral-measurement
type: extra
goal: Evaluate AR and subspace spectral estimates against order, conditioning, identifiability, and model mismatch.
est_minutes: 40

## ARC

- **Inherits:** **Correlation, PSD, and Welch Estimation** established stochastic spectral claims, estimator variance, and the autocorrelation statistics used by AR models.
- **Spine step:** “Random and changing signals require PSD estimators and local spectra whose bias, variance, time resolution, and reconstruction are declared.” (*Spectra become estimates*). Caption: “Recorded audio tests stationary, stochastic, and short-time claims.”
- **Contributes:** Evaluate AR and subspace spectral estimates against order, conditioning, identifiability, and model mismatch. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to (optional enrichment):** compare AR or subspace estimates with the core estimators in `recorded-audio-spectral-analysis`; **Recorded Audio Spectral Analysis remains fully completable from its declared core prerequisite, STFT, Spectrograms, and Reconstruction.**

## Sources to consult

- Stoica–Moses, ch. 3 §§3.2–3.7 — AR/MA/ARMA spectra, Yule–Walker, prediction, order recursion, and conditioning.
- Stoica–Moses, ch. 4 §§4.2–4.8 — sinusoidal models, MUSIC, min-norm, ESPRIT, and forward–backward methods.
- MIT 6.341, Lecture 12 pp. 2–4 — deterministic/stochastic prediction and Yule–Walker systems.
- J. O. Smith, ch. 5 §5.7 — least-squares and maximum-likelihood sinusoidal estimation and prewhitening.

## Key points the lesson must cover

1. AR spectra are rational all-pole models.
2. Yule–Walker links covariance to prediction.
3. MUSIC separates signal and noise subspaces.
4. Model order and mismatch can invent peaks.

## Pitfalls / subtleties to flag

- An AR spectrum is a model output, not a higher-resolution periodogram.
- Covariance estimates, order selection, and root conditioning can dominate the plotted peak.
- MUSIC/ESPRIT assume a correct source count and uncorrelated or properly handled sources.

## Concrete gems / worked examples

- An over-order AR fit can place sharp poles on random fluctuations, producing a more detailed and less truthful spectrum than Welch.
- Worked case grounded in Stoica–Moses chs. 3–4: generate an AR(2) process with poles of radius 0.95 at a declared angle, recover a sharp peak with the correct order, then overfit an AR(12) model to the same short record and identify unsupported extra poles as model-created detail.

## FIGURE PLAN

1. `draw:` Welch spectrum beside AR spectra of orders 4, 12, and 40 (single comparison; Stoica–Moses ch. 3).
2. `draw:` Yule–Walker Toeplitz covariance matrix with one highlighted equation row (single component).
3. `draw:` pole-radius and pole-angle map tied to the all-pole PSD (single component).
4. `draw:` covariance eigenvalues split into signal and noise subspaces (sequence, four frames).
5. `draw:` one two-tone record where MUSIC resolves and an over-order model invents a peak (single controlled comparison).

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $x[n]=0.8x[n-1]+e[n]$ with unit innovation variance, compute $S_{xx}(e^{j\omega})=1/|1-0.8e^{-j\omega}|^2$ at $\omega=0$ and $\pi$. Report the peak-to-trough ratio and confirm that the pole radius is below one before calling the model stationary.
2. **E6 — boundary probe.** Fit AR order zero and order $N-1$ to the same record; identify what each degenerate model can and cannot claim.
3. **E6 — claim to refute.** Refute “a sharper parametric peak is a more accurate peak” with an over-order white-noise fit.
4. **E6 — derivation not shown.** Derive the order-2 Yule–Walker equations from orthogonality of prediction error.
5. **E6 — research shaped.** Run a seeded Monte Carlo comparison of Welch and AR frequency error under correct and incorrect model order; state the agreement metric first.
6. **Strategy choice.** Generate (a) $N=4096$ samples of zero-mean unit-variance Gaussian noise with PCG64 seed 20260805 and (b) $N=512$ retained samples of the AR(2) process whose poles are $0.95e^{\pm j0.22\pi}$, driven by zero-mean Gaussian innovations of variance $1$ from PCG64 seed 20260806, initialized with $x[-2]=x[-1]=0$, and stripped of 1024 burn-in samples. Choose between Welch estimation and an AR/Yule–Walker spectrum. The cue is whether a low-order model survives residual-whiteness and a final-128-sample held-out check; produce the selected spectrum, order/segment rationale, held-out residual test, and a comparison marking unsupported peaks.
7. **FORWARD (E7, optional enrichment).** Compare AR and Welch peaks on the same oboe frame and state which disagreements can be tested on later frames; use the audio application only as an optional comparison. **Recorded Audio Spectral Analysis remains fully completable from its declared core prerequisite.** Reaches `recorded-audio-spectral-analysis` as optional enrichment; the solution must name the connection and include a `<Ref>`.
