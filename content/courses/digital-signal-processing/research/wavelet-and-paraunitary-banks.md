# Research brief: wavelet-and-paraunitary-banks (Wavelet and Paraunitary Filter Banks)

status: planned
module: multirate-communications-and-compression
type: extra
goal: Analyze paraunitary, cosine-modulated, and dyadic wavelet banks as structured perfect-reconstruction systems.
est_minutes: 40

## ARC

- **Inherits:** **Perfect-Reconstruction Filter Banks** established design and test an analysis/synthesis bank that cancels aliasing and reconstructs a delayed input.
- **Spine step:** “Rate changes are filtering problems, and polyphase schedules and filter-bank matrices remove redundant work while controlling alias transfer.” (*Rates become channel structures*). Caption: “Rational conversion opens an optional rigorous reconstruction-bank and wavelet branch.”
- **Contributes:** Analyze paraunitary, cosine-modulated, and dyadic wavelet banks as structured perfect-reconstruction systems. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** an optional comparison with `analytic-signals-and-quadrature`; that core lesson remains independently accessible and does not inherit this branch.

## Sources to consult

- Vaidyanathan, ch. 6 §§6.1–6.5 — paraunitary matrices and FIR factorizations.
- Vaidyanathan, ch. 11 §§11.4–11.5 — discrete orthonormal wavelets, tree banks, and scaling-function conditions.
- J. O. Smith, ch. 11 §§11.8–11.9 — oversampled/critical banks, MPEG context, and wavelet tiling.
- MIT 6.341, Lecture 21 pp. 3–5, Lecture 22 pp. 1–6, and PS10 Problems 10.1–10.4 — STFT/modulated-filter-bank equivalence, polyphase/FFT implementation, and alias-component reconstruction conditions only; wavelet and paraunitary claims must come from Vaidyanathan or J. O. Smith.

## Key points the lesson must cover

1. Paraunitary banks preserve energy.
2. Cosine modulation generates channels from one prototype.
3. Dyadic banks trade time and frequency resolution by scale.
4. Critical sampling remains sensitive to coefficient error.

## Pitfalls / subtleties to flag

- Finite filter-bank PR and an infinite-level wavelet basis require different conditions.
- Critical sampling leaves coefficient perturbations exposed unless structure preserves the identities.
- Constant-Q and uniform resolution answer different measurement questions.

## Concrete gems / worked examples

- The Haar pair satisfies the infinite-level wavelet conditions, while a paraunitary $z\mapsto z^3$ counterexample fails the scaling-function Nyquist condition.
- Worked case grounded in Vaidyanathan ch. 11: apply one Haar stage to `[3,1,0,4]`, split averages from differences, then recurse only on the lowpass pair; exact inverse stages recover all four samples while the coefficient locations display dyadic time-frequency tiling.

## FIGURE PLAN

1. `draw:` uniform DFT tiles beside dyadic wavelet tiles (single comparison; JOS ch. 11).
2. `draw:` two-channel analysis bank recursively expanding into a three-level tree (sequence, four frames).
3. `draw:` paraunitary polyphase identity $\widetilde E(z)E(z)=I$ with energy ledger (single component).
4. `draw:` Haar analysis/synthesis samples through one level and exact reconstruction (sequence, five frames).
5. `draw:` Haar versus $z\mapsto z^3$ counterexample at the scaling-function Nyquist test (single comparison; Vaidyanathan §11.5.3).

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Apply two normalized Haar levels to $x=[3,1,0,4]$, recursing only on the two lowpass coefficients. Deliver the two-level tree and coefficient order $[4,0,\sqrt2,-2\sqrt2]$; verify input and coefficient energies both equal 26.
2. **E6 — boundary probe.** Use a one-level tree and then take levels toward infinity; identify why finite-level PR alone does not guarantee a valid continuous wavelet basis.
3. **E6 — claim to refute.** Refute “every paraunitary two-channel pair generates an orthonormal wavelet basis” with the stated lowpass/scaling counterexample.
4. **E6 — derivation not shown.** Derive energy preservation for one paraunitary analysis stage from the polyphase identity.
5. **E6 — research shaped.** Compare transient localization in a uniform STFT and a dyadic Haar/Daubechies bank on the same rights-cleared click-plus-tone recording.
6. **Strategy choice.** Analyze the 48,000-sample signal $x[n]=0.8\cos(2\pi4000n/48000)+p[n]$, where $p[n]=0.5[1-\cos(2\pi(n-24000)/95)]$ for $24000\le n\le24095$ and zero otherwise. Compare (a) an 8-channel critically sampled unitary block-DFT bank with prototype $h[n]=1/\sqrt8$ for $n=0,\ldots,7$, analysis modulation $e^{-j2\pi kn/8}$, and inverse-DFT synthesis, against (b) a five-level orthonormal Haar dyadic tree with symmetric end extension. The cue is fixed absolute bandwidth versus scale-dependent localization; submit tiling maps, reconstruction/energy errors, tone-bin width, and click time spread.
7. **FORWARD (E7, optional comparison).** Compare a dyadic bank’s octave tiles with uniform I/Q channelization; the independently accessible core lesson uses quadrature to transport one band. Reaches `analytic-signals-and-quadrature` as optional enrichment; the solution must name the connection and include a `<Ref>`.
