# Research brief: streaming-audio-resampling-and-subband-link (Streaming Audio Resampling and Subband Link)

status: planned
module: multirate-communications-and-compression
type: synthesis
goal: Evaluate an end-to-end audio link under alias, rate, reconstruction, quantization, channel, computation, and latency constraints.
est_minutes: 40

## ARC

- **Inherits:** **Analytic Signals and Quadrature Communication**, **Quantization, Dither, and Subband Allocation**, **Finite-Word Realizations**, **Polyphase Rational Sample-Rate Conversion**, and **Fast Convolution and Streaming Blocks** established the I/Q signal path, rate–distortion decisions, finite-precision limits, low-rate converter schedule, and seam-safe OLA/OLS execution used by the complete link.
- **Spine step:** “Quadrature transport and finite-bit subbands close an end-to-end audio link whose alias, reconstruction, rate, noise, computation, and latency budgets must agree.” (*The full link closes*). Caption: “Communication and compression expose accumulated departures from ideal DSP.”
- **Contributes:** Evaluate an end-to-end audio link under alias, rate, reconstruction, quantization, channel, computation, and latency constraints. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** No later course lesson. The terminal transfer task carries the complete link into adaptive, packetized, and hardware DSP work beyond this course.

## Sources to consult

- MIT 6.003, Session 25 slides 17–34 — 176.4/44.1 kHz acquisition/playback ladder and practical transition bands.
- Vaidyanathan, ch. 4 and Appendix C — polyphase conversion, quantizer models, bit allocation, and coding gain; chs. 5–6 are optional depth for a rigorous perfect-reconstruction-bank variant.
- J. O. Smith, chs. 8–11 — overlap processing, filter-bank audio, multirate banks, and reconstruction.
- Lyons, chs. 8–10 and 12 — I/Q transport, rate conversion, and finite-word implementation.

## Key points the lesson must cover

1. **The closing move of the course**: every module contributed a component
   that passed its own acceptance test; the link asks whether the composed
   system passes ANY end-to-end test, and the honest answer is "only if the
   budgets were summed, not assumed." The lesson's method is the ledger, and
   the ledger is the deliverable.
2. **Rate arithmetic runs the show**: 96 kb/s payload over 44.1 kHz mono is
   ~2.18 bits per source sample — so the subband allocator must reach a
   fractional average via unequal integer bits plus paid-for side
   information (the quantization lesson's portfolio, now under a hard
   budget); QPSK at 2 bits/symbol turns the 108.8 kb/s wire rate into a
   54.4 kBd symbol stream. Every one of these numbers is derivable from the
   warm-up's ledger.
3. **Latency decomposes into named, chargeable parts**: converter filter
   group delay (at the LOW rate side after polyphase), OLS block gathering
   ($N-M+1$ samples), packetization (10 or 20 ms), and jitter buffer — the
   strategy exercise's two configurations differ block by block, and the
   42 ms warm-up total is the model computation.
4. **Polyphase work counts exclude discarded products** — the module's
   efficiency theorem restated as an auditable ledger row, with the
   $10^{-10}$ direct-agreement check as the admission ticket (inherited
   verbatim from `polyphase-rational-conversion`).
5. **Oversampled subbands are a deliberate retreat from criticality**: the
   link chooses measurable recombination error plus robustness over a
   fragile PR proof — the PR/wavelet branch explains what was traded, but
   the core path must state the decision and measure the floating-point
   recombination baseline BEFORE quantization so later error is attributable
   (its own ledger row, not a mystery).
6. **Impairments compound through delay**: carrier phase error rotates all
   symbols ($\cos\phi$ recovery from the analytic lesson), clock drift
   (±50 ppm) walks the resampler's phase accumulator into FIFO slip unless
   bounded, and both interact with block latency — the first-failed-threshold
   diagnosis is the lesson's capstone skill: find WHICH budget broke, in
   which stage, before touching any knob.
7. **An audible failure/repair pair is mandatory evidence**: numbers close
   the ledger; the ear validates that the ledger measured the right things
   (bundled clip: `prometheus-excerpt-44k1.wav`; see data gate).

## Misconception to refute (L13)

- "Every component met its spec, so the system meets its spec." Prevalent
  because it is how component datasheets invite you to think, and because it
  worked for single-stage designs all course. Refutation: compose stages
  that individually pass — converter agreement $10^{-10}$, subband
  recombination $-80$ dB, EVM under 5%, blocks seam-clean — and watch the
  end-to-end budget fail anyway: latencies ADD past 100 ms, quantized
  coefficients revive alias terms the floating-point test never saw, and
  carrier error multiplies EVM into the quantization margin. Replacement
  model: budgets compose by summation and interaction, so the system spec is
  a ledger with a row per stage and a column per resource — and the
  falsification exercise makes the reader repair the FIRST violated cell,
  not the loudest symptom.

## Pitfalls / subtleties to flag

- Clock ratios, filter delay, PR sensitivity, quantizer correlation, carrier synchronization, packet overhead, and independent coefficient rounding accumulate end to end.
- Component-level passes do not guarantee the link budget: sample-rate conversion delay, block buffering, packet overhead, I/Q error, and quantization noise accumulate and must be summed end to end.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A direct and polyphase converter can agree below $10^{-10}$ while the polyphase schedule executes under 35% of the multiplies; the oversampled subband stage then isolates the separate recombination and quantization errors.
- Worked case grounded in Lyons chs. 8–10: convert 48 kHz audio to 44.1 kHz with $147/160$, verify direct/polyphase agreement before quantization, then close a rate ledger through the oversampled subband and I/Q stages to locate the first latency or payload-budget violation.

## FIGURE PLAN

1. `draw:` **48 kHz input → 147/160 polyphase converter → oversampled subband analysis → bit allocation → QPSK → synthesis pipeline.** (single) — Draw: the system architecture is explanatory.
2. `draw:` **Sample-rate, bit-rate, operation, and latency ledger at every stage.** (single) — Draw: quantitative bindings belong on the pipeline.
3. `draw:` **Input/output spectra with alias masks and subband noise floors.** (single) — Draw: compute from the runnable study.
4. `draw:` **Constellation and EVM before/after I/Q correction.** (single) — Draw: new study evidence, not a sourced plot.
5. `draw:` **Exact-float, quantized-shared, and independently-quantized reconstruction errors.** (single) — Draw: paired course outputs expose the idealization gap.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Close a link ledger: convert 48 kHz by $147/160$ to 44.1 kHz; packetize 441 samples (10 ms) at 96 kb/s payload with a 16-byte header; use stage delays 8, 12, 10, and 12 ms. Deliver stage/cumulative rows verifying 12.8 kb/s overhead, 108.8 kb/s wire rate, and 42 ms latency.
2. **E6 — boundary probe.** Test silence, an impulse at a packet boundary, a full-scale tone at a band edge, and a dropped packet.
3. **E6 — claim to refute.** Refute 'meeting every component specification guarantees the end-to-end target' with accumulated delay/noise/error budgets.
4. **E6 — research shaped.** Reproduce the complete threshold table on a supplied clip and include an audible failure/repair pair.
5. **E6 — strategy choice.** Filter the 44.1 kHz complex I/Q stream with a 257-tap FIR and choose 10 ms packets with 512-point overlap-save blocks for an interactive link under 50 ms and 5 ms jitter, or 20 ms packets with 1024-point blocks for power-limited playback under 100 ms. After synthesis, apply $r[n]=1.05e^{j5\pi/180}s[n]+v[n]$: with $P_s=N^{-1}\sum_n|s[n]|^2$, draw independent standard-normal $a[n],b[n]$ from PCG64 seed 20260805 and set $v[n]=\sqrt{P_s/(2\cdot10^3)}(a[n]+jb[n])$ for exactly 30 dB SNR. The cue is joint buffering, header, FFT, and jitter cost; submit complete ledgers including the 256- versus 768-sample OLS valid ranges, plus seam error, alias level, unequalized RMS EVM, and first failed threshold.
6. **TRANSFER BEYOND COURSE (E7 exception).** Extend the complete link with one of packet loss, adaptive equalization, real-time scheduling, or hardware saturation. State an acceptance test and identify which course result remains valid and which new model is required; there is deliberately no nonexistent later-course `<Ref>`.
## APPLICATION

- **Artifact/study:** A local streaming audio link that resamples 48 kHz to 44.1 kHz, splits into subbands, quantizes under a bit budget, transmits I/Q symbols, and reconstructs.
- **Results cashed out:** rate conversion and anti-aliasing; polyphase efficiency; STFT-derived subband analysis/synthesis; analytic/IQ communication; quantization and bit allocation.
- **Executable protocol:**
  - Record or load rights-cleared 48 kHz audio and implement the 441/480 converter both directly and polyphase.
  - Run every long FIR stage through a declared OLA or OLS block schedule and verify packet/block seams against direct convolution before closing the latency ledger.
  - Split through an oversampled analysis/synthesis subband stage, establish its measured floating-point recombination baseline, estimate subband variances, allocate bits under a 96 kb/s payload budget, and packetize.
  - Map payload to QPSK, add a controlled channel impairment, recover, synthesize, and restore 44.1 kHz audio.
  - Measure alias rejection, reconstruction error, EVM, rate, operation count, latency, and listening artifacts.
- **Target / threshold:** Polyphase/direct output difference below 1e−10 in floating point, out-of-band aliases below −70 dB, subband recombination error below −80 dB before coefficient quantization, channel EVM below 5%, payload at or below 96 kb/s, and end-to-end latency below 100 ms.
- **Falsification:** Test 'meeting every component threshold guarantees the end-to-end target' by combining coefficient quantization, carrier error, and block latency, then identify and repair the first exceeded budget.
- **Idealization gap:** Infinite filters, exact rational clocks, independent white quantization noise, perfectly matched analysis/synthesis coefficients, synchronized carriers, and zero packet delay do not survive finite buffers and fixed-point transport.
- **Deliverable:** Runnable link, rate/latency/operation ledger, spectra and constellation, reconstruction metrics, and one audible failure/repair pair.
- **Data/rights gate:** SOURCED (license review deferred) — `research/data/audio-clips-v1/derived/prometheus-excerpt-44k1.wav` (12 s music, native 44.1 kHz) plus a declared 48 kHz resample; the 44.1↔48 converter study should treat the ffmpeg resample as reference only. Speech alternative: arctic_a0001. See provenance.json.
