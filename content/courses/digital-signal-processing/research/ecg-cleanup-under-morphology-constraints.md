# Research brief: ecg-cleanup-under-morphology-constraints (ECG Cleanup Under Morphology Constraints)

status: planned
module: filter-design-and-implementation
type: synthesis
goal: Design and validate an ECG filter cascade that suppresses interference without erasing diagnostic waveform structure.
est_minutes: 40

## ARC

- **Inherits:** **Fast Convolution and Streaming Blocks** plus **Finite-Word Realizations** established block-valid filtering, state/latency accounting, coefficient sensitivity, overflow, and stability checks. Minimum-phase/allpass structure is optional enrichment, not an application prerequisite.
- **Spine step:** “Streaming blocks and finite words make implementation structure observable; an ECG cascade tests morphology, delay, transients, and stability.” (*Structures face machines*). Caption: “Equivalent formulas separate under latency and quantization.”
- **Contributes:** Design and validate an ECG filter cascade that suppresses interference without erasing diagnostic waveform structure. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `decimation-interpolation-and-antialiasing`, which analyze integer sample-rate changes and specify filters that prevent folding and suppress images.

## Sources to consult

- MIT 6.003, Lecture 20 slides 12–19 — measured 60-second ECG and distinct drift, cardiac, broadband, and 60 Hz regions.
- Orfanidis, Example 27.2.2 and Examples 15.11.1–15.11.3 — ECG interference, comb/notch choices, and long transients.
- Oppenheim–Schafer, 2nd ed., §5.1.2 and §5.7.2 (printed pp. 242–245, 295–297), plus §§6.6–6.9.1 (printed pp. 395–416) — group delay, generalized linear phase, finite-word quantizers, realization noise, and zero-input limit cycles.
- Captured artifact `ecg-spectrum` — use only as measured evidence with its CC BY-NC-SA attribution.

## Key points the lesson must cover

1. **The specification comes from the physiology, and it is contested
   territory**: baseline wander sits below ~0.5 Hz (respiration, electrode
   motion), QRS energy concentrates in roughly the 5–25 Hz band, mains sits
   at exactly 60 Hz (or 50), and the ST segment — the clinically decisive
   slow feature — shares the lowest frequencies with the drift. There is no
   empty band to spend; every rejection choice trades against a diagnostic
   feature. (Verify clinical band statements against the MIT 6.003 Session 20
   material; state them as engineering bands, not medical advice.)
2. **The highpass is the dangerous stage, not the notch**: an aggressive
   drift filter's phase distorts the ST segment — the documented mechanism
   behind conservative highpass cutoffs in diagnostic mode. Linear-phase FIR
   removal or subtract-a-smoothed-baseline both fix phase and pay elsewhere
   (delay; boundary transients).
3. **Notch design as a pole-radius decision**: zeros on the circle at
   $e^{\pm j2\pi 60/f_s}$ kill the line; poles at radius $r$ just inside pull
   the response back to unity elsewhere. Bandwidth $\approx2(1-r)$ rad and
   ringing duration $\propto1/(1-r)$ move oppositely — the narrower the
   notch, the longer it rings after each QRS impulse, and a QRS is exactly an
   impulse-rich event. Compute both for $r=0.95$ and $r=0.995$ at
   $f_s=360$ Hz and let the reader pick against the morphology budget.
4. **Delay is a clinical constraint**: linear-phase drift removal at 360 Hz
   with sub-hertz transition needs hundreds of taps — seconds of latency at
   $(N-1)/2$ samples — acceptable offline, unacceptable on a wearable; the
   FIR/IIR strategy choice is real and the acceptance ledger decides it.
5. **The finite-word ledger transfers verbatim** from
   `finite-word-realizations` (spiral revisit): quantized pole radii of the
   high-Q notch, state range under a 1 mV-scale input, and the zero-input
   limit-cycle test, all on the actual cascade.
6. **Morphology metrics are the acceptance criteria**: aligned QRS peak
   amplitude change, QRS width change, and timing shift after group-delay
   compensation — measured on the bundled record against its beat
   annotations, not judged by eye.
7. **Measured noise beats synthetic noise**: the bundled nstdb baseline-
   wander and electrode-motion records are physically measured interference;
   mixing them into record 100 at declared SNRs gives controlled ground truth
   with real spectral structure (see data gate). The 60 Hz line may be added
   synthetically at declared amplitude since record 100's residual line is
   weak.

## Misconception to refute (L13)

- "The filter with the most stopband attenuation cleans the signal best."
  Prevalent because attenuation is the axis every datasheet advertises.
  Refutation: sharpen the 60 Hz notch until the line is 60 dB down and watch
  the ringing tail it plants after every QRS complex exceed the residual
  mains it removed; or steepen the drift highpass and watch the ST segment
  tilt. Replacement model: the objective is morphology-constrained
  suppression — attenuation, delay, ringing, and feature distortion enter
  one acceptance ledger, and the winning cascade is the one that passes all
  rows, not the one with the deepest notch.

## Pitfalls / subtleties to flag

- Noise bands overlap the signal; ideal rejection can distort QRS peaks, ring around impulses, delay events, or destabilize after quantization.
- Removing baseline and 60 Hz energy is not sufficient: align for group delay and inspect QRS amplitude, width, ringing, and boundary transients before declaring the cleaned ECG acceptable.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- The measured ECG spectrum demands three behaviors—highpass, lowpass, and a 60 Hz notch—rather than one generic “noise filter.”
- Worked case grounded in MIT 6.003 Session 20: for a declared sample rate $f_s$, place notch zeros at $e^{\pm j2\pi60/f_s}$, align the filtered trace by measured group delay, and accept the stage only if the 60 Hz line falls while QRS peak amplitude and timing remain within the preset tolerance.
- Controlled-corruption protocol on the bundled data: take `mitdb100-60s.csv` (mostly clean, annotated beats), add `nstdb-bw-60s.csv` scaled to a declared SNR plus a synthetic 60 Hz line of declared amplitude, and clean it — ground truth is the uncorrupted record, so every morphology metric has an exact reference. Record 105 then serves as the held-out "no ground truth" test the research-shaped exercise wants.
- Notch arithmetic at $f_s=360$ Hz: $2\cos(2\pi\cdot60/360)=2\cos(\pi/3)=1$, so the zero pair gives numerator $[1,-1,1]$ exactly — the warm-up's coefficients are not approximations, and the pole pair $r=0.95$ vs $r=0.995$ gives 3 dB bandwidths of roughly $2(1-r)$ rad $\approx5.7$ Hz vs $0.57$ Hz with ringing envelopes $r^n$ settling to 1% in $\approx90$ vs $\approx919$ samples ($0.25$ s vs $2.6$ s of visible tail at 360 Hz).

## FIGURE PLAN

1. `source:` **ecg-spectrum** (single sourced raster) — Measured ECG trace and spectrum with drift and 60 Hz interference. Source: the irregular measured bands drive the design.
2. `draw:` **Preserve/reject bands annotated before any filter is selected.** (single) — Draw: this is the study's specification.
3. `draw:` **Baseline, notch, and lowpass cascade with per-stage pole/zero and delay budgets.** (single) — Draw: a processing architecture should be drawn.
4. `draw:` **Before/after ECG aligned at QRS peaks plus residual trace.** (single) — Draw: compute from the bundled record.
5. `draw:` **Floating-point versus fixed-point response, poles, and morphology metrics.** (single) — Draw: new implementation evidence belongs in a comparison.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* At $f_s=360$ Hz, place conjugate zeros at 60 Hz and compute $1-2\cos(2\pi60/f_s)z^{-1}+z^{-2}$. Deliver coefficients $[1,-1,1]$, zero locations, and response at DC and 60 Hz; verify DC gain one and a numerical zero at 60 Hz.
2. **E6 — boundary probe.** Test a QRS complex at a record boundary, a missing 60 Hz line, a shifted mains frequency, and a saturated sample.
3. **E6 — claim to refute.** Refute 'the filter with greatest stopband attenuation is best' using QRS distortion or ringing.
4. **E6 — research shaped.** Reproduce the suppression/preservation thresholds on a held-out ECG segment and report edge handling.
5. **E6 — strategy choice.** Clean a 360 Hz ECG with at least 30 dB rejection at 60 Hz and under 5% QRS peak change using a low-order IIR cascade or linear-phase FIR cascade with block convolution. The cue is sub-10 ms wearable delay versus offline alignable linear phase; submit attenuation, aligned QRS peak/width error, delay, ringing, seam error, and quantized maximum pole radius.
6. **FORWARD (E7).** Downsample the cleaned ECG by four without and then with a prefilter; the next module explains the folding difference. Reaches `decimation-interpolation-and-antialiasing`; the solution must name the connection and include a `<Ref>`.
## APPLICATION

- **Artifact/study:** A real ECG with baseline drift, cardiac content, broadband noise, and narrow 60 Hz interference.
- **Results cashed out:** pole-zero design; FIR/IIR tradeoffs; fast convolution; finite-word structures; delay and ringing.
- **Executable protocol:**
  - Inspect a redistributable ECG record in time and frequency; set preservation and rejection bands before designing.
  - Build a baseline-removal stage, 60 Hz notch, and high-frequency lowpass; compare FIR and IIR alternatives.
  - Measure QRS peak change, group delay, settling/ringing, 60 Hz attenuation, and fixed-point stability.
  - Process by direct filtering and block convolution where applicable; confirm block boundaries do not add artifacts.
- **Target / threshold:** Suppress 60 Hz by at least 30 dB and baseline drift by at least 20 dB while changing QRS peak amplitudes by less than 5%; no quantized pole may reach radius 1.
- **Falsification:** Refute 'the magnitude response alone determines the better medical filter' with delay/ringing and morphology evidence.
- **Idealization gap:** Ideal brick-wall separation is impossible because diagnostic content and noise overlap; finite delay, edge transients, coefficient rounding, and morphology preservation constrain the design.
- **Deliverable:** Filter cascade, dense response, before/after trace and spectrum, morphology metric, transient analysis, and word-length decision.
- **Data/rights gate:** SOURCED (license review deferred) — `research/data/ecg-mitbih-v1/` holds MIT-BIH records 100/105 with beat annotations plus measured baseline-wander and electrode-motion noise (nstdb), decoded to mV CSVs by `decode_212.py`; mix at declared SNRs for the cleanup study. The MIT 6.003 raster may be shown only under its stated license.
