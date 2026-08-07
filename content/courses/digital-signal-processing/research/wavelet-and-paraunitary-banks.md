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

1. **The flaw first.** The previous lesson's PR identity is easy to satisfy
   badly (Haar) and fragile to satisfy well (long coupled filters). Structure
   is the answer twice over: paraunitary factorizations build PR into the
   parameterization so no cancellation can be lost, and modulation/tree
   structures generate many channels from one designed prototype.
2. **Paraunitary means energy accounting**: $\tilde E(z)E(z)=I$ makes the
   analysis stage an energy-preserving (lossless) transform for every input —
   derive $\sum|x|^2=\sum|y|^2$ from the identity, and note the FIR
   factorization result (Vaidyanathan ch. 6): every FIR paraunitary matrix is
   a product of rotations and delays, so quantizing the ROTATION ANGLES
   preserves paraunitariness exactly — the structural cure for the previous
   lesson's coefficient fragility.
3. **Daubechies-4 as the concrete orthonormal pair**:
   $h=\frac1{4\sqrt2}[1{+}\sqrt3,\,3{+}\sqrt3,\,3{-}\sqrt3,\,1{-}\sqrt3]$ —
   verify by hand that $\sum h[n]=\sqrt2$, $\sum h[n]^2=1$, and the shift-2
   orthogonality $h_0h_2+h_1h_3=0$; two vanishing moments annihilate linear
   ramps where Haar leaves residue. A four-number example carries the whole
   orthonormal-wavelet apparatus.
4. **The dyadic tree is recursion on the lowpass branch only**: octave bands,
   constant-Q tiling, and the coefficient count staying exactly $N$ at every
   depth (critical sampling preserved through the tree). The worked
   `[3,1,0,4]` two-level example already in this brief is the anchor;
   energy 26 at every level is the paraunitary ledger made visible.
5. **Finite trees vs infinite bases**: iterating a PR pair infinitely need
   not converge to a legitimate scaling function — the $z\mapsto z^3$
   counterexample fails the scaling-function condition while remaining
   perfectly paraunitary at every finite level. This is the lesson's
   boundary between filter-bank truth and wavelet truth.
6. **Cosine modulation as the economy of scale**: $M$ channels from one
   prototype via cosine modulation, implemented as prototype polyphase + fast
   DCT — the structure inside MP3-era audio coders (J. O. Smith ch. 11
   context), and the reason modulated banks dominate when $M$ is large.
7. **Tiling as measurement choice**: uniform STFT tiles vs constant-Q dyadic
   tiles answer different questions about the same signal — the
   tone-plus-click strategy exercise makes the reader measure the difference
   rather than admire it.

## Misconception to refute (L13)

- "Any PR (even paraunitary) two-channel pair, iterated, gives an orthonormal
  wavelet basis." Prevalent because finite-level trees DO inherit PR from the
  pair, so the infinite claim looks like a free limit. Refutation: the
  $z\mapsto z^3$ pair is paraunitary, passes every finite-level
  reconstruction test, and fails the scaling-function Nyquist condition —
  its iterated lowpass does not converge to a usable $\phi$. Replacement
  model: finite-level PR is a filter-bank property; a wavelet basis
  additionally needs the infinite-product/scaling conditions (Vaidyanathan
  §11.5), which Haar and Daubechies satisfy and the counterexample does not.

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
