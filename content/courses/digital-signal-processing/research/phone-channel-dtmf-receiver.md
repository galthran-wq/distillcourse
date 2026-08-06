# Research brief: phone-channel-dtmf-receiver (Phone-Channel DTMF Receiver)

status: planned
module: fourier-representation-and-computation
type: synthesis
goal: Design an auditable finite-latency DTMF decision contract from finite Fourier evidence with explicit tolerance, rejection, timing, and cost gates.
est_minutes: 40

## ARC

- **Inherits:** **FFT Factorization and Machine Layout** and **Sampling, Aliasing, and Reconstruction** established finite transform computation plus the frequency-mapping and anti-alias conditions needed to interpret telephone tones.
- **Spine step:** “The DFT supplies finite coordinates and the FFT computes them efficiently; a DTMF receiver turns coefficients into a constrained decision.” (*Finite coordinates become computation*). Caption: “Indexing, scaling, factorization, and latency meet in one receiver.”
- **Contributes:** Turn finite Fourier evidence at the eight DTMF frequencies into an explicit, falsifiable row-plus-column key-or-reject decision with declared tolerance, timing, latency, and cost contracts. This is the lesson’s single move; optional resonator or implementation derivations remain subordinate to it.
- **Hands off to:** `windows-leakage-and-resolution`, which evaluate analysis windows from main-lobe width, sidelobes, coherent gain, scalloping, and equivalent noise bandwidth.

## Sources to consult

- MIT 6.003, Problem Set 6 Engineering Problem 6 and solution pp. 9–12 — sampled resonator DTMF detection and radius/selectivity/settling tradeoff.
- Orfanidis, §9.2 Example 9.2.1 and §16.1.1 Example 16.1.1 — selective DFT/Goertzel and eight-frequency filter-bank receiver.
- Lyons, ch. 13 §13.17 — Goertzel single-tone detection and FFT comparison.
- ITU-T Q.23 (11/1988, in force), §§6–7 and Fig. 1/Q.23 — the 697/770/852/941 Hz and 1209/1336/1477/1633 Hz groups, keypad allocation, ±1.8% sender tolerance, and distortion limit; ITU-T Q.24 (11/1988, in force), §§2.2–2.5 and Annex A — one-frequency-per-group reception and receiver parameter categories. Use the AT&T column of Q.24 Annex A as a named laboratory profile, not as a universal ITU receiver table; paraphrase its values without reproducing the table. Official records: https://www.itu.int/rec/T-REC-Q.23 and https://www.itu.int/rec/T-REC-Q.24-198811-I.

## Key points the lesson must cover

1. One simultaneous low-group tone and one simultaneous high-group tone encode a candidate key; every invalid or ambiguous case has an explicit `reject` output.
2. A rectangular $N=205$ frame at $8$ kHz is a $25.625$ ms spectral-feature frame. It broadens off-grid tones and does not establish the selected profile’s temporal qualification by itself.
3. The named AT&T column of Q.24 Annex A supplies this lesson’s laboratory profile: operate at frequency offset up to ±1.5%, non-operate from ±3.5%, accept high-minus-low twist from −8 through +4 dB, operate from 40 ms, non-operate through 23 ms, require a 40 ms pause, and tolerate interruption through 10 ms. The 23–40 ms interval is a gray region, not a forced pass or reject interval.
4. Frequency, energy/dominance, twist, exactly-one-per-group, duration, pause, and interruption are separate gates. A key is emitted only when every frozen gate passes; otherwise the output is `reject`.
5. Exact-nominal correlations $C(f)$ and ordinary FFT bins $X[k]$ are different coordinates unless $f=kf_s/N$. Comparisons must use the same coordinates and keep real additions/multiplications, complex additions/products, and historical multiply-add units in separate ledgers.
6. The frozen synthetic receiver study is now executable and reproducible: clean accuracy is 512/512, the active-tone 10 dB grid with independent low/high offsets inside ±1.5% is 1023/1024, mandatory-negative rejection is 637/640, and maximum accepted hard-set latency is 50 ms from received-signal onset. The clean ≥99% and hard-grid ≥95% targets pass; all-negative rejection and the ≤40 ms latency target fail.

## Pitfalls / subtleties to flag

- The committed artifact is synthetic: generated DTMF PCM passed through a deterministic 101-tap, 300–3400 Hz course FIR. It is not a deployed receiver, real loudspeaker/microphone recording, reverberant path, or clipping test; the FIR is essentially flat across the eight DTMF frequencies and mainly contributes 50 samples (6.25 ms) of delay.
- Keep Q.23’s ±1.8% sender tolerance distinct from the named AT&T Q.24 Annex A receiver profile.
- The corpus now separates `key5-short-20ms-must-reject.wav` from `key5-short-25ms-indeterminate.wav`: 20 ms lies safely inside the profile’s non-operation side, while 25 ms lies in the 23–40 ms gray region and is excluded from conformance accuracy.
- Use $N=205$ only for a spectral feature/cost frame. Temporal qualification for the 40 ms boundary aggregates at least 320 received samples at 8 kHz in a declared state machine.
- A valid decision needs exactly one accepted row and one accepted column plus all other gates. Two peaks from the same group, a lone tone, a gap frequency, out-of-band detuning, failed dominance/twist, or insufficient duration returns `reject` rather than the nearest key.
- Exact-nominal $C(f)$, $N=205$ DFT bins, and zero-padded $N=256$ FFT bins are not interchangeable. Zero padding changes the sampled grid but not the physical record-window main lobe or observation time.
- Measure primary receiver latency from received-signal onset to emitted key-or-reject, with sample-boundary and frame/hop alignment stated. Report source-onset latency separately; it includes the synthetic FIR’s measured 50-sample group delay.
- The legacy 15 dB filenames use power over the full tone-plus-pause sequence and measure about 18 dB over active tones. The newer committed 10 dB WAV fixtures freeze active-tone masks but retain nominal frequencies and one reset LCG sequence; they are not the held-out grid. The separate study generates 1024 balanced synthetic 10 dB trials with independent low/high offsets and split-specific PRNG state, and its results must not be attributed to the two sequence WAVs.
- The executed study uses a 160-sample exact-nominal spectral record and 5 ms temporal blocks, not the lesson’s separate $N=205$ or padded $N=256$ cost alternatives. Its frozen thresholds are block energy 0.028, group energy 0.035, dominance 3 dB, measured twist −10 through +5 dB, and detuning at most 2%.
- The receiver is not fully successful: it accepts one two-low trial as `B`, one low-twist trial as `5`, and one 38 ms-pause trial as `2`; its one hard-set error rejects `*` at the twist gate. Among accepted hard trials, median and p95 latency are 45 ms and maximum latency is 50 ms, so the ≤40 ms target fails.
- Declare sign, scale, index, endpoint, frequency coordinate, and operation unit before importing formulas, plots, or cost comparisons.

## Concrete gems / worked examples

- For key 5 at $f_s=8$ kHz and $N=205$, 770 Hz maps to nearest bin 20 at 780.488 Hz and 1336 Hz maps to nearest bin 34 at 1326.829 Hz. Those bin-center offsets lie inside the named ±1.5% intervals, but this fact does not prove edge-of-band receiver operation; exact nominal evaluation uses $C(770)$ and $C(1336)$ instead.
- The $N=205$ frame contains 205 samples (25.625 ms), while the named 40 ms operation boundary requires at least 320 received samples. The synthetic FIR’s separate source-to-receiver delay is 50 samples (6.25 ms).
- For the committed clean key-5 frame, the two largest magnitudes over all 205 bins are the positive/negative conjugate pair for the high tone. For a lone 770 Hz cosine, the two largest positive-frequency bins are leakage from that one tone. Both cases refute a two-largest-bins classifier and motivate separate group gates plus `reject`.
- A unit complex line at bin coordinate 20.5 leaks to a point 1.5 bins away at about −13.46 dB under the $N=205$ rectangular window, which is 26.54 dB above a −40 dB weak line. The next lesson owns the window repair.

## FIGURE PLAN

1. `draw:` **DTMF row/column frequency grid with key 5 highlighted and an explicit reject branch.** (single) — Draw an original keypad matrix from the verified numeric mapping; do not reproduce Q.23/Q.24 artwork or tables.
2. `draw:` **Synthetic course FIR → $N=205$ feature frames → ≥320-sample temporal state → frozen gates → key or reject.** (single) — Keep spectral evidence and temporal qualification visibly separate.
3. `draw:` **Key 5 at exact nominal coordinates versus nearest $N=205$ and padded $N=256$ FFT-grid coordinates.** (single) — The figure must label these as different evaluations, not identical coefficients.
4. `draw:` **Named AT&T Annex A duration profile: ≤23 ms non-operation, 23–40 ms gray region, and ≥40 ms operation boundary.** (single) — Paraphrase only; make the 25 ms corpus fixture visibly indeterminate.
5. `draw:` **Coordinate, arithmetic-unit, and latency-origin ledger.** (single) — Compare only like coordinates, keep real and complex operation ledgers separate, and show received-onset latency separately from the FIR’s 6.25 ms source-path delay.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For key 5 ($770$ and $1336$ Hz), $f_s=8$ kHz, and $N=205$, compute the nearest DFT-bin indices and their frequency offsets. Return a two-row table and ask only whether the bin centers lie inside the named AT&T Annex A ±1.5% intervals; do not infer receiver operation at the tolerance edges.
2. **E6 — boundary probe.** Under the named AT&T profile, classify a tone no longer than 23 ms as mandatory non-operation, a 25 ms tone as gray-zone/locally specified, and a tone of at least 40 ms as satisfying only the duration gate. Then test zero amplitude in one group and a frequency in the open gap between decision bands; both return `reject`.
3. **E6 — claim to refute.** Refute “the largest two FFT bins always name the key” twice: once over all bins using real-signal conjugate symmetry, and once over positive bins using the lone-770-Hz leakage counterexample.
4. **E6 — research shaped.** Audit the frozen executable study rather than redesigning it. Recompute 512/512 clean, 1023/1024 at 10 dB with independent low/high offsets inside ±1.5%, and 637/640 negative-control rejection from the raw confusion counts; verify that training and all 128 gray-duration trials are excluded. Identify the two passed targets, the three named false accepts, and the 50 ms hard-set maximum that fails the ≤40 ms target. Then explain why these deterministic synthetic results are neither statistical confidence nor standards-conformance evidence.
5. **E6 — strategy choice.** Specify one apples-to-apples implementation comparison: either eight selected $N=256$ grid sums versus a full $N=256$ FFT at the same bins, or eight exact-nominal direct correlations versus a noninteger-frequency Goertzel/resonator implementation at the same physical frequencies. Keep operation units separate, do not assume a seeded 12-key fixture, and explain why exact-nominal outputs cannot be declared identical to ordinary FFT-grid coefficients.
6. **FORWARD (E7).** For a length-205 complex rectangular record, place a unit line at bin coordinate 20.5 and a zero-relative-phase line of amplitude 0.01 at bin 22. Compute the strong-line leakage at the weak coordinate and show why zero padding alone cannot repair it. The solution hands window selection to `windows-leakage-and-resolution`, names the connection, and includes a `<Ref>`.

## APPLICATION

- **Artifact/study:** The locally generated `dtmf-v1` PCM corpus passed through its deterministic 101-tap, 300–3400 Hz synthetic course FIR. This is a reproducible course idealization, not a deployed or standards-conforming receiver and not a real acoustic/channel recording.
- **Named profile:** Use the AT&T column of ITU-T Q.24 Annex A as a laboratory profile. Keep its frequency, twist, duration, pause, and interruption gates separate; treat 23–40 ms as gray; return `reject` whenever any frozen gate fails.
- **Feature and timing contract:** An $N=205$ rectangular frame supplies spectral features only. A temporal state machine must aggregate at least 320 received samples before satisfying the 40 ms duration gate. Primary latency is measured from received-signal onset to emitted key-or-reject with the sample-boundary and frame/hop convention stated; source-onset latency is reported separately and includes the synthetic FIR’s 50-sample (6.25 ms) group delay.
- **Coordinate and cost contract:** Write the actual physical frequency in every exact-nominal sum. Compare complex coefficient values only on a common coordinate set; compare decision behavior, not coefficient identity, across exact-nominal and FFT-grid detectors. Report real multiplications/additions, complex products/additions, and historical multiply-add units separately.
- **Executed protocol:** `receiver_study.py` freezes the detector gates and threshold table from 640 training trials, then evaluates disjoint seeded splits with 17 key-plus-`REJECT` labels, row-normalized confusion matrices, explicit active-tone SNR, and received-onset latency. The study uses a 160-sample exact-nominal spectral record and 40-sample/5 ms temporal blocks; training and the 128 unscored 24–39 ms gray trials are excluded from held-out conformance denominators.
- **Frozen partial results:** Clean passes at 512/512 (100%) against ≥99%. The 10 dB active-tone-SNR split with independent low/high offsets inside ±1.5% passes at 1023/1024 (99.90234375%) against ≥95%. Mandatory negatives fail the all-rejected target at 637/640 (99.53125%): `negative-two_low-013` emits `B`, `negative-twist_low-063` emits `5`, and `negative-insufficient_pause_lt_40ms-013` emits `2`. Accepted hard-set latency has median/p95 45 ms and maximum 50 ms, failing ≤40 ms. Therefore `all_declared_targets_met=false`.
- **Falsification:** Refute 'more zero padding always fixes two-tone decisions' by holding record duration fixed while changing only FFT length.
- **Idealization gap:** The committed tones are finite, sometimes off-nominal, unequal, and synthetically noisy; the FIR adds deterministic telephone-band filtering and delay. The artifact contains no reverberation, clipping, speech, dial tone, echo, or acoustic capture and supports no claim about those impairments.
- **Authoring deliverable:** A key-or-reject decision contract, named-profile gate diagram, coordinate-safe arithmetic ledger, latency ledger, deterministic feature counterexamples, and an audit of the frozen executable study. Publish positive accuracies only beside the three false accepts, the failed 50 ms latency maximum, exact denominators, and the synthetic non-conformance limits; a compact target ledger is preferable to an unreadable 17×17 matrix.
- **Data/rights gate:** SYNTHETIC — `research/data/dtmf-v1/` is deterministic and regenerable via `generate.py`. Its manifest now labels 20 ms as mandatory non-operation, 25 ms as indeterminate, 45 ms as above the operation boundary, legacy 15 dB files by whole-sequence SNR, and new 10 dB files by an explicit active-tone mask. The fixtures are inputs and boundary cases, not receiver-performance evidence. No dataset, generator, or receiver code is changed by this prose repair.
