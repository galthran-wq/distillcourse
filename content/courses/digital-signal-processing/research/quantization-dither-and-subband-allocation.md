# Research brief: quantization-dither-and-subband-allocation (Quantization, Dither, and Subband Allocation)

status: planned
module: multirate-communications-and-compression
type: core
goal: Evaluate quantizer, dither, and subband bit-allocation choices against distortion, noise, overload, and rate.
est_minutes: 40

## ARC

- **Inherits:** **STFT, Spectrograms, and Reconstruction**, **Finite-Word Realizations**, **Polyphase Rational Sample-Rate Conversion**, and **Analytic Signals and Quadrature Communication** established the subband coefficients, seeded-dither error model, equivalent low-rate schedule, and I/Q streams whose precision is now budgeted.
- **Spine step:** “Quadrature transport and finite-bit subbands close an end-to-end audio link whose alias, reconstruction, rate, noise, computation, and latency budgets must agree.” (*The full link closes*). Caption: “Communication and compression expose accumulated departures from ideal DSP.”
- **Contributes:** Evaluate quantizer, dither, and subband bit-allocation choices against distortion, noise, overload, and rate. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `streaming-audio-resampling-and-subband-link`, which evaluate an end-to-end audio link under alias, rate, reconstruction, quantization, channel, computation, and latency constraints.

## Sources to consult

- Oppenheim–Schafer, ch. 6 quantization sections and captured 3-bit/8-bit speech-error comparisons — conditional whiteness of error.
- Lyons, ch. 12 — fixed-point formats, quantization, overflow, truncation, and rounding.
- MIT 6.003, Session 22 slides 22–49 — bit-depth budgets and subtractive dither.
- Vaidyanathan, ch. 4 §§4.3–4.4 and Appendix C §§C.0–C.5 — equivalent polyphase scheduling, ideal subband coding, KLT, bit allocation, coding gain, and quantizer models.

## Key points the lesson must cover

1. **The flaw first.** The course has used "quantization noise" informally
   since module 1's converter chain; this lesson makes the model earn its
   keep and shows exactly where it lies. A quantizer is a deterministic
   nonlinearity; calling its error "noise" is a hypothesis with conditions,
   not a fact.
2. **Two failures with opposite cures**: granular error (bounded by $q/2$,
   shrinks with more bits) and overload (unbounded, shrinks with more RANGE).
   For a fixed word length, range and step trade directly; the loading
   decision — how many $\sigma$ of headroom — is a design choice with a
   measurable optimum, and the warm-up's saturating sample is the smallest
   demonstration.
3. **$q^2/12$ and its conditions**: derive the uniform-error variance, then
   the full-scale-sine consequence $\mathrm{SNR}\approx6.02b+1.76$ dB — and
   immediately exhibit the conditions failing: the 3-bit speech error is
   speech-shaped (captured artifact), and a low-level tone locks to the grid
   producing harmonic spurs, not a floor. The model is *conditional on the
   signal exercising many levels*.
4. **Dither converts distortion into noise, at a price**: the first-exposure
   block from `finite-word-realizations` is inherited (C5) and now
   quantified — triangular-PDF dither at the right level whitens the error
   and decouples it from the input; the SNR cost is explicit, and
   "correlation went down" is never accepted without the noise ledger.
5. **Subbands make bits a portfolio**: with per-band variances
   $\sigma_k^2$, the equal-noise allocation is
   $b_k=\bar b+\tfrac12\log_2(\sigma_k^2/\mathrm{GM})$; for the exercise's
   variances $[16,4,1,1]$: GM $=(16\cdot4)^{1/4}\cdot1^{1/2}=2.83$, ideal
   real-valued bits $[5.25,4.25,3.25,3.25]$, integers by water-filling.
   Coding gain = AM/GM of variances $=5.5/2.83\approx1.94\to2.9$ dB over
   flat allocation at the same average rate — a computed, checkable number
   (Vaidyanathan App. C).
6. **Schedules do not change statistics**: direct and polyphase analysis
   produce identical retained coefficients, hence identical variances and
   allocations — efficiency and coding decisions are orthogonal, which is
   the module's running theme applied to bits (derivation exercise 5).
7. **Side information is part of the rate**: transmitted allocations,
   scale factors, and headers all spend the same budget the subband bits do;
   the transient-variance-swap case in the strategy exercise makes the
   accounting bite before the link application charges it end to end.

## Misconception to refute (L13)

- "Quantization error is white noise, independent of the signal, at
  $q^2/12$ — always." Prevalent because the model works so well at high
  resolution that it gets remembered without its hypotheses. Refutation: the
  captured 3-bit speech error is audibly and visibly speech-correlated, and
  a 0.75-LSB sine quantizes to a deterministic distorted square-ish wave
  whose "noise" is odd harmonic spurs. Replacement model: error =
  deterministic function of input; the white model is an approximation valid
  when the signal is large and busy relative to $q$ — and dither is the tool
  that buys the model's validity at low levels, at a stated SNR cost.

## Pitfalls / subtleties to flag

- Overload, deterministic spurs, correlated low-bit error, finite codebooks, packet headers, and psychoacoustic weighting violate high-resolution models.
- Step-size error and overload are distinct: shrinking the step lowers granular noise only until the reduced range clips peaks, while dither decorrelates error at an explicit noise cost.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Three-bit speech error remains speech-shaped and correlated; eight-bit error looks much closer to the familiar white-noise model.
- Worked case grounded in MIT 6.003 Session 22: quantize a sub-LSB sinusoid at 3 bits first without dither and then with a fixed seeded dither sequence, reporting input/error correlation, largest error spur, and SNR so decorrelation is not mistaken for free noise reduction.

## FIGURE PLAN

1. `draw:` **Quantizer staircase with ±1/2-LSB error and overload regions.** (single) — Draw: the model is explanatory.
2. `draw:` **Undithered versus dithered low-level tone: waveform, error correlation, and spectrum.** (single) — Draw: compute from the demo.
3. `source:` **eight-bit-quantization** (single sourced raster) — Measured 8-bit speech quantization-error correlation/spectrum. Source: the near-white high-resolution case is empirical.
4. `source:` **three-bit-quantization** (single sourced raster) — Measured 3-bit speech quantization-error correlation/spectrum. Source: the structured low-resolution failure is empirical.
5. `draw:` **Subband variances, aligned quantizer steps, and bit budget ledger.** (single) — Draw: the allocation relation is explanatory. Inspiration: Vaidyanathan Appendix C.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Quantize $x=[0.10,0.30,0.90,1.10]$ with a saturating 3-bit midrise quantizer over $[-1,1)$, $q=0.25$. Deliver code/output/error rows, verify outputs $[0.125,0.375,0.875,0.875]$, label only the last sample overload, and compare $q^2/12$ with granular-only MSE.
2. **E6 — boundary probe.** Probe zero input, sub-LSB constant input, overload, one empty subband, and a one-bit quantizer.
3. **E6 — claim to refute.** Refute 'quantization error is always white and independent' with a deterministic low-level counterexample.
4. **E6 — derivation not shown.** Derive equal-noise-variance bit allocation under a fixed average bit budget and identify the integer-rounding step.
5. **E6 — derivation not shown.** Show that a direct analysis-channel implementation and its polyphase schedule produce the same retained coefficients and subband variances before quantization; then compare their multiply counts.
6. **E6 — strategy choice.** Allocate 16 bits across four subbands with variances $[16,4,1,1]$ using equal $[4,4,4,4]$ allocation or variance-matched integer allocation such as $[6,4,3,3]$. The cue is stable reported variance versus a transient whose variances swap before side information arrives; submit bit/noise ledgers, measured MSE, overload count, and signaling cost.
7. **FORWARD (E7).** Allocate a fixed number of bits across measured subband variances and predict total distortion; the final application tests the allocation inside the full link. Reaches `streaming-audio-resampling-and-subband-link`; the solution must name the connection and include a `<Ref>`.
