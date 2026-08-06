# Research brief: perfect-reconstruction-filter-banks (Perfect-Reconstruction Filter Banks)

status: planned
module: multirate-communications-and-compression
type: extra
goal: Design and test an analysis/synthesis bank that cancels aliasing and reconstructs a delayed input.
est_minutes: 40

## ARC

- **Inherits:** **Polyphase Rational Sample-Rate Conversion** established design an efficient $L/M$ converter using polyphase components, noble identities, and a low-rate schedule.
- **Spine step:** “Rate changes are filtering problems, and polyphase schedules and filter-bank matrices remove redundant work while controlling alias transfer.” (*Rates become channel structures*). Caption: “Rational conversion opens an optional rigorous reconstruction-bank and wavelet branch.”
- **Contributes:** Design and test an analysis/synthesis bank that cancels aliasing and reconstructs a delayed input. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `wavelet-and-paraunitary-banks` within the optional advanced branch. No core lesson depends on this lesson.

## Sources to consult

- Vaidyanathan, chs. 5–6 — maximally decimated banks, alias/distortion transfer, polyphase matrices, and paraunitary PR.
- J. O. Smith, chs. 9 and 11 — DFT/STFT filter-bank view, critical sampling, and PR multirate banks.
- MIT 6.341, Lecture 21 pp. 1–5, Lecture 22 pp. 1–6, and PS10 Problems 10.1–10.4 — STFT/modulated-bank equivalence, polyphase/FFT implementations, alias-component sums, and reconstruction conditions.
- Orfanidis, §20.4, especially Eqs. 20.4.4–20.4.15 — two-channel Mallat analysis/synthesis, subband aliasing, quadrature conditions, and exact reconstruction.

## Key points the lesson must cover

1. Critical sampling removes redundancy.
2. Analysis and synthesis jointly determine alias transfer.
3. Perfect reconstruction permits gain and delay.
4. Subband quantization breaks exact cancellation.

## Pitfalls / subtleties to flag

- Good stopbands do not ensure PR, coefficient quantization breaks cancellations, and critical sampling leaves no redundancy for errors.
- Critical sampling leaves no redundancy to absorb mismatch; good individual stopbands do not prove the coupled alias terms cancel after analysis, decimation, interpolation, and synthesis.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Perturb one synthesis coefficient while both channel magnitude plots still look good; the cancellation residual jumps by tens of decibels.
- Worked case grounded in Orfanidis §20.4: use the two-tap Haar analysis/synthesis pair on `[3,1,0,4]`, compute low/high subbands, and reconstruct the input up to the declared gain/delay; perturb one synthesis tap to make the alias residual nonzero.

## FIGURE PLAN

1. `draw:` **Two-channel analysis → decimate → process → interpolate → synthesis pipeline.** (single) — Draw: the architecture is explanatory.
2. `draw:` **Desired transfer plus alias transfer separated algebraically.** (single) — Draw: formula terms bind to paths.
3. `draw:` **Polyphase product equal to scaled delay for PR.** (single) — Draw: matrix cells and delay identity need typesetting.
4. `draw:` **Subband tiling and recombination of a transient-rich spectrum.** (sequence, 3–7 frames; one delta per frame) — Draw: one channel contribution changes per frame.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Apply normalized Haar analysis to $x=[3,1,0,4]$ with $a=(x_{even}+x_{odd})/\sqrt2$ and $d=(x_{even}-x_{odd})/\sqrt2$, then synthesize all samples. Deliver $a=[2\sqrt2,2\sqrt2]$, $d=[\sqrt2,-2\sqrt2]$, and the maximum reconstruction error.
2. **E6 — boundary probe.** Probe identity/delay-chain banks, no decimation, zero synthesis branch, and one channel containing all energy.
3. **E6 — claim to refute.** Refute 'each channel being a good filter guarantees PR' with a bank whose magnitude plots look plausible but aliases remain.
4. **E6 — derivation not shown.** Derive the two-channel alias and distortion terms and solve one simple cancellation condition.
5. **E6 — strategy choice.** Select an orthonormal paraunitary bank for energy-bounded transform coding or a linear-phase biorthogonal bank for constant-alignment waveform processing using supplied coefficient tables. The cue is energy preservation versus exact linear phase; submit polyphase-product residual, delay, energy ratio, and reconstruction error before and after quantizing one coefficient.
6. **FORWARD (E7).** Factor one valid two-channel bank into its paraunitary matrix form and predict how a dyadic tree repeats the channel split. Reaches `wavelet-and-paraunitary-banks`; the solution must name the connection and include a `<Ref>`.
