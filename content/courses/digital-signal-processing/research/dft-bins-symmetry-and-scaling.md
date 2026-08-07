# Research brief: dft-bins-symmetry-and-scaling (DFT Bins, Symmetry, and Scaling)

status: planned
module: fourier-representation-and-computation
type: core
goal: Compute and interpret a finite DFT with explicit indexing, normalization, symmetry, and circular-convolution conventions.
est_minutes: 40

## ARC

- **Inherits:** **DTFT and Frequency Response** established the continuous, periodic frequency representation that finite DFT bins sample.
- **Spine step:** “The DFT supplies finite coordinates and the FFT computes them efficiently; a DTMF receiver turns coefficients into a constrained decision.” (*Finite coordinates become computation*). Caption: “Indexing, scaling, factorization, and latency meet in one receiver.”
- **Contributes:** Compute and interpret a finite DFT with explicit indexing, normalization, symmetry, and circular-convolution conventions. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `fft-factorization-and-layout`, which construct a factored FFT and account for arithmetic, storage, ordering, and scaling.

## Sources to consult

- Oppenheim–Schafer, ch. 8 §§8.1–8.7 — DFT definition, periodic sequences, symmetry, circular convolution, and matrix view.
- Lyons, ch. 3 §§3.1–3.14 — bin interpretation, leakage, zero padding, gain, and DTFT relation.
- MIT 6.003, Sessions 17–18 — DTFS/DFT roots of unity and matrix analysis/synthesis.
- Schaedler, lessons 15 and 21–23 — glyph-by-glyph DFT notation, quadrature dot products, and eight-point trace.

## Key points the lesson must cover

1. Bin $k$ maps to $kf_s/N$ only after $f_s$ and $N$ are known.
2. Real data produce conjugate-symmetric coefficients.
3. Forward and inverse scale factors must be declared.
4. DFT multiplication produces circular convolution.

## Pitfalls / subtleties to flag

- Library scaling, packed-real layouts, frequency ordering, half-open records, and zero padding routinely cause correct formulas to yield wrong plots.
- Bin index $k$ has no hertz value until both $N$ and $f_s$ are declared; also state whether negative frequencies are wrapped, shifted, or represented by conjugate bins.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- An eight-point DFT can be audited multiply by multiply, then compared with four common FFT-library output/scaling conventions.
- Worked case grounded in Oppenheim–Schafer ch. 8: the eight samples $x[n]=(-1)^n$ produce the unnormalized result $X[4]=8$ and zero elsewhere; inverse scaling by $1/8$ recovers the samples, while a unitary library reports magnitude $\sqrt{8}$ instead.

## FIGURE PLAN

1. `draw:` **Continuous DTFT curve sampled at N DFT-bin locations.** (single) — Draw: the relation is explanatory. Inspiration: Lyons §3.14.
2. `draw:` **DFT as correlations against rows of a complex basis matrix.** (single) — Draw: literal grids and highlighted rows support the computation.
3. `draw:` **Real-input full spectrum, positive-only spectrum, packed layout, and normalization ledger.** (single) — Draw: software conventions require a house-style mapping. Inspiration: Schaedler Lesson 28.
4. `draw:` **Same data: unpadded, zero-padded, and genuinely longer records.** (single) — Draw: constructed comparison distinguishes interpolation from resolution.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Compute the unscaled four-point DFT of $x=[1,0,-1,0]$ at $f_s=8$ kHz. Tabulate $k$, frequency in hertz, and complex $X[k]$; verify conjugate symmetry and recover $x$ with the inverse $1/N$ normalization.
2. **E6 — boundary probe.** Handle N=1, constant input, alternating input, and even/odd N Nyquist-bin cases without silently duplicating energy.
3. **E6 — claim to refute.** Refute 'the DFT output is the spectrum only at physically present sinusoids' using leakage from an off-bin tone.
4. **E6 — derivation not shown.** Derive Parseval scaling for the lesson's declared DFT convention and verify it on a short real sequence.
5. **E6 — strategy choice.** For a real $1$ kHz cosine sampled at $8$ kHz with $N=8$, choose a two-sided complex DFT or a one-sided amplitude spectrum for (a) phase-sensitive reconstruction and (b) reporting tone amplitude. The cue is whether negative-frequency phase must be retained; produce both spectra with the correct factor-of-two rule and verify inverse reconstruction.
6. **FORWARD (E7).** Split an eight-sample DFT sum into even and odd indices and identify the repeated four-point sums; the FFT formalizes that reuse. Reaches `fft-factorization-and-layout`; the solution must name the connection and include a `<Ref>`.
