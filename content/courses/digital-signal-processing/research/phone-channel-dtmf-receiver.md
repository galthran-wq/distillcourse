# Research brief: phone-channel-dtmf-receiver (Phone-Channel DTMF Receiver)

status: planned
module: fourier-representation-and-computation
type: synthesis
goal: Design and validate a finite-latency dual-tone receiver under noise, offset, twist, and channel distortion.
est_minutes: 40

## ARC

- **Inherits:** **FFT Factorization and Machine Layout** and **Sampling, Aliasing, and Reconstruction** established finite transform computation plus the frequency-mapping and anti-alias conditions needed to interpret telephone tones.
- **Spine step:** “The DFT supplies finite coordinates and the FFT computes them efficiently; a DTMF receiver turns coefficients into a constrained decision.” (*Finite coordinates become computation*). Caption: “Indexing, scaling, factorization, and latency meet in one receiver.”
- **Contributes:** Design and validate a finite-latency dual-tone receiver under noise, offset, twist, and channel distortion. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `windows-leakage-and-resolution`, which evaluate analysis windows from main-lobe width, sidelobes, coherent gain, scalloping, and equivalent noise bandwidth.

## Sources to consult

- MIT 6.003, Problem Set 6 Engineering Problem 6 and solution pp. 9–12 — sampled resonator DTMF detection and radius/selectivity/settling tradeoff.
- Orfanidis, §9.2 Example 9.2.1 and §16.1.1 Example 16.1.1 — selective DFT/Goertzel and eight-frequency filter-bank receiver.
- Lyons, ch. 13 §13.17 — Goertzel single-tone detection and FFT comparison.
- ITU-T Q.23 (11/1988, in force), §§6–7 and Fig. 1/Q.23 — the 697/770/852/941 Hz and 1209/1336/1477/1633 Hz groups, keypad allocation, ±1.8% transmit tolerance, and distortion limit; ITU-T Q.24 (11/1988, in force), §§2.2–2.5 and Annex A — one-frequency-per-group reception, tolerance, received-level/twist considerations, and timing parameters. Official records: https://www.itu.int/rec/T-REC-Q.23 and https://www.itu.int/rec/T-REC-Q.24-198811-I.

## Key points the lesson must cover

1. Two simultaneous frequency groups encode a key.
2. Finite windows broaden each tone.
3. Twist and detuning require tolerance bands.
4. Thresholds trade misses against false alarms.

## Pitfalls / subtleties to flag

- Real tones are off-bin, finite, unequal, reverberant, noisy, clipped, and frequency-offset; thresholds trade misses against false alarms.
- A valid DTMF decision needs exactly one row and one column tone; two peaks from the same group, a single strong tone, or speech-like energy must be rejected rather than mapped to a key.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- At 10 kHz, a resonator radius between roughly 0.9 and 0.99 exposes the useful region between poor discrimination and excessive ringing.
- Worked case grounded in ITU-T Q.23 and Orfanidis Example 16.1.1: synthesize key 5 from 770 and 1336 Hz, require exactly one detected row and one column, and reject a lone 770 Hz tone even when it exceeds both individual energy thresholds.

## FIGURE PLAN

1. `draw:` **DTMF row/column frequency grid with one key highlighted.** (single) — Draw: the standard mapping is explanatory.
2. `draw:` **Acoustic/telephone channel → framing → spectral features → threshold decision.** (single) — Draw: a processing pipeline should be drawn.
3. `draw:` **One noisy key in time, spectrum, and I/Q detector outputs.** (single) — Draw: compute from the runnable study.
4. `draw:` **Confusion matrix across SNR and frequency offset.** (single) — Draw: a new measured course result, not a sourced illustration.
5. `draw:` **Latency and multiply-count ledger for FFT versus direct matched correlations.** (single) — Draw: aligned quantitative comparison needs house typography.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For key 5 ($770$ and $1336$ Hz), $f_s=8$ kHz, and $N=205$, compute the nearest DFT-bin indices and their frequency offsets. Return a two-row table and check both offsets against a declared $\pm1.5\%$ frequency-tolerance gate.
2. **E6 — boundary probe.** Test the shortest tone duration, zero amplitude in one component, and a tone exactly between two decision bands.
3. **E6 — claim to refute.** Refute 'the largest two FFT bins always name the key' with leakage/noise or harmonic interference.
4. **E6 — research shaped.** Reproduce the receiver accuracy target over a seeded impairment grid and provide the confusion matrix.
5. **E6 — strategy choice.** Implement detection for an $N=205$ frame using a full FFT and eight Goertzel/matched-frequency evaluations. The cue is whether the receiver needs the whole spectrum or only the eight DTMF frequencies; produce operation counts, the detected row/column, and identical pass/reject decisions over a seeded 12-key test set.
6. **FORWARD (E7).** Move a strong DTMF tone half a bin and place a weak neighboring line 40 dB lower; the next lesson chooses a window from the failure. Reaches `windows-leakage-and-resolution`; the solution must name the connection and include a `<Ref>`.
## APPLICATION

- **Artifact/study:** A deployed dual-tone telephone signaling receiver tested through a real loudspeaker/microphone or supplied channel recording.
- **Results cashed out:** complex projection; frequency response; DFT binning and scaling; FFT cost.
- **Executable protocol:**
  - Generate the standard row/column tone pairs and pass them through a recorded or browser-simulated phone channel.
  - Build a fixed-latency detector using FFT bins or matched complex correlations; do not identify the method in the final mixed test.
  - Sweep noise, frequency offset, amplitude twist, and key duration; produce a confusion matrix.
  - Compare direct correlations and FFT computation at the chosen block size.
- **Target / threshold:** At least 99% accuracy on clean keys and 95% at 10 dB SNR with ±1.5% frequency offset, using no more than 40 ms decision latency.
- **Falsification:** Refute 'more zero padding always fixes two-tone decisions' by holding record duration fixed while changing only FFT length.
- **Idealization gap:** Orthogonal bin-centered sinusoids become off-bin, unequal, noisy, reverberant, and time-limited in a real acoustic/telephone path.
- **Deliverable:** Receiver code, threshold table, confusion matrix, failure example, and arithmetic/latency budget.
- **Data/rights gate:** SOURCED — `research/data/dtmf-v1/` holds a deterministic Q.23/Q.24 corpus (clean keys, offset/twist/duration stress cases with declared expected outcomes, seeded noise, 300–3400 Hz channel and its impulse response) regenerable via `generate.py`. The browser may additionally record the learner's own tones locally.
