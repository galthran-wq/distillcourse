# Research brief: decimation-interpolation-and-antialiasing (Decimation, Interpolation, and Anti-Alias Filtering)

status: planned
module: multirate-communications-and-compression
type: core
goal: Analyze integer sample-rate changes and specify filters that prevent folding and suppress images.
est_minutes: 40

## ARC

- **Inherits:** **Sampling, Aliasing, and Reconstruction** and **FIR Filter Design and Verification** established spectral-replica overlap conditions and realizable transition-band filters for rate changes.
- **Spine step:** “Rate changes are filtering problems, and polyphase schedules and filter-bank matrices remove redundant work while controlling alias transfer.” (*Rates become channel structures*). Caption: “Rational conversion opens an optional rigorous reconstruction-bank and wavelet branch.”
- **Contributes:** Analyze integer sample-rate changes and specify filters that prevent folding and suppress images. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `polyphase-rational-conversion`, which design an efficient $L/M$ converter using polyphase components, noble identities, and a low-rate schedule.

## Sources to consult

- Vaidyanathan, ch. 4 §§4.1–4.2 — decimation/interpolation spectra, rate-change blocks, and noble identities.
- Oppenheim–Schafer, 2nd ed., ch. 4 §§4.6–4.9, especially §4.6.1 — decimation alias-sum derivation, interpolation images, rational conversion, and polyphase implementations.
- Orfanidis, ch. 14 §§14.1–14.6 — interpolation, decimation, multistage and rational conversion.
- MIT 6.003, Session 22 slides 50–60 and Session 25 slides 17–34 — rate-change spectra and CD oversampling chain.

## NOTATION

- Ledger family `multirate-polyphase`: write a sample rate on every edge, use $\downarrow M$ and $\uparrow L$, and state the ratio as output/input. Example: 48 kHz to 44.1 kHz reduces to $L/M=147/160$.
## Key points the lesson must cover

1. Downsampling stretches and sums spectra.
2. Upsampling inserts zeros and creates images.
3. Anti-alias filtering precedes decimation.
4. Anti-image filtering completes interpolation.

## Pitfalls / subtleties to flag

- Transition bands, filter delay, image rejection, clock domains, and multistage choices replace ideal brick-wall rate changes.
- Downsampling both stretches and sums spectral replicas; drawing only the stretched baseband hides the alias term and can falsely justify a rate change without an anti-alias filter.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- The CD chain oversamples at 176.4 kHz so analog hardware gets a wide transition band, then performs the sharp filtering digitally before fourfold decimation.
- Worked case grounded in Oppenheim–Schafer 2nd ed. §4.6.1: downsample $\cos(0.7\pi n)$ by two and reduce the resulting $1.4\pi$ frequency modulo $2\pi$ to $-0.6\pi$; the section’s alias-sum makes explicit why only a prefilter can prevent that folded component.

## FIGURE PLAN

1. `draw:` **Downsampling spectrum compression, shifted-copy sum, and alias overlap.** (sequence, 3–7 frames; one delta per frame) — Draw: the alias-sum is explanatory. Inspiration: Vaidyanathan Ch. 1; SASP §11.
2. `draw:` **Zero insertion, spectral images, and interpolation lowpass.** (sequence, 3–7 frames; one delta per frame) — Draw: one spectral stage changes per frame.
3. `draw:` **Safe decimation after antialias filtering versus excessive factor.** (single) — Draw: paired panels teach the condition.
4. `draw:` **Single-stage and multistage rate ladders with transition width and multiplies per second.** (single) — Draw: cost/spec comparison should be redrawn.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Let $x[n]=\cos(0.2\pi n)+0.5\cos(0.7\pi n)$ and downsample by 2. Map each signed frequency into $[-\pi,\pi)$ after $\omega_{out}=2\omega_{in}$; deliver a table and two-replica sketch verifying $0.4\pi$ for the first tone and folded $-0.6\pi$ for the second.
2. **E6 — boundary probe.** Analyze M=1, a band edge at the folding frequency, DC/Nyquist components, and a non-bandlimited impulse.
3. **E6 — claim to refute.** Refute 'downsampling merely removes every Mth value' by accounting for the summed spectral copies.
4. **E6 — derivation not shown.** Derive the DTFT alias-sum for decimation by M and verify it on a two-band example.
5. **E6 — strategy choice.** Decimate 96 kHz to 12 kHz while preserving 0–5 kHz and reaching 80 dB rejection by 6 kHz using one filter before $M=8$ or three $M=2$ stages. The cue is low-rate arithmetic versus accumulated transition widths and delay; submit per-stage masks/rates, multiplies per output, input-sample delay, and a dense alias test for both.
6. **FORWARD (E7).** Write the output indices of an $L/M$ converter and cross out products by inserted zeros or samples later discarded; polyphase form keeps only the survivors. Reaches `polyphase-rational-conversion`; the solution must name the connection and include a `<Ref>`.
