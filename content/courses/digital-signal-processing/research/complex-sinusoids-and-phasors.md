# Research brief: complex-sinusoids-and-phasors (Complex Sinusoids and Phasors)

status: planned
module: fourier-representation-and-computation
type: core
goal: Analyze amplitude, phase, and discrete frequency with complex exponentials and quadrature components.
est_minutes: 34

## ARC

- **Inherits:** **Difference Equations and Stability** established recursive modes and the distinction between oscillation, growth, and decay.
- **Spine step:** “Complex modes and the DTFT turn LTI behavior into magnitude and phase, and sampling becomes spectral replication with an irreversible overlap boundary.” (*Modes expose frequency*). Caption: “Rotation, response, and sampling share one frequency axis.”
- **Contributes:** Analyze amplitude, phase, and discrete frequency with complex exponentials and quadrature components. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `dtft-and-frequency-response`, which analyze LTI behavior with the DTFT, transform properties, magnitude, phase, and group delay.

## Sources to consult

- Schaedler, Lessons 7–12, 16–17, 19–21, 23, and 27 — synchronized phasor projections and radians; sampled frequency-equivalence families; rectangular/polar form and Euler’s identity; the one-projection null and sine/cosine correlation pair; DC, Nyquist, and conjugate-pair boundaries; and same-frequency addition with compatible-period energy.
- MIT 6.003, Sessions 14–18 — Fourier modes, projection, conjugate pairs, and DT frequency periodicity.
- Oppenheim–Schafer–Buck, 2nd ed., ch. 2 §§2.1.1, 2.6.1, and 2.8 — complex sequences and periodicity, LTI complex-exponential eigenfunctions, and real-signal conjugate symmetry.
- Lyons, Appendix A and ch. 8 §§8.2–8.5 — complex notation, phasors, and quadrature spectra.

## NOTATION

- Ledger families `frequency-axes` and `complex-number-and-phase`: use engineering $j$, distinguish dimensional $\Omega=2\pi f$ from periodic $\omega=\Omega T_s$, and say the units aloud. Example: 1 kHz at 8 kHz sampling is $\omega=\pi/4$ radians/sample.
- For $x[n]=A\cos(\omega n+\phi)$, reserve engineering phasor $P=Ae^{j\phi}$ for $x[n]=\Re\{Pe^{j\omega n}\}$. In the two-sided real-signal expansion, $C_+=(A/2)e^{j\phi}$ and $C_-=C_+^*$, so $P=2C_+$.
- For $x[n]=a\cos(\omega n)+b\sin(\omega n)$, $P=a-jb$. On a declared orthogonal integer-cycle interval $n=0,\ldots,N-1$ with $\omega$ neither DC nor Nyquist, use $I=(2/N)\sum x[n]\cos(\omega n)$ and $Q=-(2/N)\sum x[n]\sin(\omega n)$, so $P=I+jQ$ and $\phi=\operatorname{atan2}(Q,I)$.
- Display principal phase in $(-\pi,\pi]$, mapping $-\pi$ to $+\pi$; compare phases with circular error and never score phase at zero recovered magnitude.

## Key points the lesson must cover

1. Euler representation binds cosine and sine, while $P=Ae^{j\phi}$ and $C_+=P/2$ name distinct one-sided engineering and two-sided spectral conventions.
2. Discrete frequency is periodic modulo $2\pi$.
3. Real sinusoids require conjugate components.
4. A normalized, signed I/Q pair recovers amplitude and canonical phase on a declared orthogonal non-DC/non-Nyquist interval; phase is undefined at zero magnitude.

## Pitfalls / subtleties to flag

- Software phase conventions, real-signal conjugate pairs, normalization, and finite phase accumulators create sign and wrap errors. Normalize display to $(-\pi,\pi]$ and use circular phase error.
- Euler’s identity couples cosine and sine as the real and imaginary projections of one phasor; dropping the quadrature component can turn a phase rotation into a false amplitude null.
- Declare sign, scale, index, endpoint, input support, and unit conventions before importing formulas or plots; do not conflate $P$ with $C_+$.

## Concrete gems / worked examples

- Rotate one phasor while its cosine and sine projections update; the sine-only detector reaches a null exactly where the quadrature pair retains the tone.
- Worked case grounded in Schaedler’s phasor sequence: evaluate $e^{j\pi n/2}$ for $n=0,1,2,3$ to get $1,j,-1,-j$; the real projection alone vanishes at odd indices, while the complex pair preserves unit magnitude at every index.

## DEMO CONTRACT

- `QuadratureDetectorLab` uses the noise-free tone $x[n]=A\cos(\omega_0n+\phi)$ for $n=0,\ldots,19$, with $A=1$, $\omega_0=0.3\pi$ radians/sample $=0.15$ cycles/sample, and $N=20$, hence exactly three cycles. It makes no claim for noise, off-bin frequencies, arbitrary windows, DC, or Nyquist.
- With $c[n]=\cos(\omega_0n)$ and $s[n]=\sin(\omega_0n)$, compute $I=(2/N)\sum x[n]c[n]$ and $Q=-(2/N)\sum x[n]s[n]$. The negative sign follows the $e^{-j\omega n}$ analysis convention, yielding $P=I+jQ$, $\widehat A_{IQ}=\operatorname{hypot}(I,Q)$, and $\widehat\phi=\operatorname{atan2}(Q,I)$ in $(-\pi,\pi]$.
- The sine-only estimate is $\widehat A_{sine}=|Q|$ and cannot identify phase. At $\phi=0$ or $\pm180^\circ$ modulo $360^\circ$, declare it falsified only when $|Q|<10^{-12}$ and its relative amplitude error is greater than $0.99$.
- Initialize phase at $37^\circ$. Initialize the unsigned 32-bit seed at `0x6d2b79f5`; each seeded trial applies `seed=(imul(seed,1664525)+1013904223)>>>0` and `phaseDeg=round(seed/2^32*360-180)`, whose first six values are $-176,58,-66,176,47,103$ degrees.
- The finite regression grid is all 1,441 phases from $-180^\circ$ through $+180^\circ$ inclusive in $0.25^\circ$ steps. Every point must satisfy the strict inequalities $|\widehat A_{IQ}-A|/A<0.01$ and circular phase error $<2^\circ$; equality fails. Aggregate by the maximum errors, expected to be $8.881784197001252\times10^{-16}$ and $0^\circ$. Orthogonality proves the result for every real phase, while the finite grid is the deterministic implementation test. If recovered magnitude is zero, phase is undefined and is not scored; fixed $A=1$ excludes that benchmark case.

## FIGURE PLAN

1. `draw:` **Unit-circle rotation synchronized with cosine and sine traces.** (single) — Draw: coordinated explanatory views are the object. Inspiration: Schaedler Lessons 13–21.
2. `draw:` **One complex number decomposed into in-phase and quadrature projections.** (single) — Draw: formula dissection requires KaTeX and shared colors.
3. `draw:` **A real sinusoid assembled from positive/negative conjugate exponentials.** (sequence, 3–7 frames; one delta per frame) — Draw: the symmetry is mathematical.
4. `draw:` **An LTI block multiplying one complex mode by H(e^jω): gain and phase shift.** (single) — Draw: a general system relation is explanatory.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $x[n]=2\cos(\pi n/3+\pi/4)$, write both the engineering phasor $P=2e^{j\pi/4}$ and the two-sided positive-frequency coefficient $C_+=e^{j\pi/4}$, explicitly noting $P=2C_+$. Compute $x[0]$ through $x[5]$, check the six-sample period by showing $x[6]=x[0]$, and label amplitude, phase, and radians/sample.
2. **E6 — boundary probe.** Evaluate zero amplitude, DC, Nyquist frequency, and phases differing by 2π; identify which parameters cease to be identifiable.
3. **E6 — claim to refute.** Refute 'phase changes a tone's energy over an integer number of periods' for a declared non-DC/non-Nyquist interval whose doubled-frequency sum vanishes, while naming DC and Nyquist as exceptions.
4. **E6 — derivation not shown.** Derive the real conjugate-pair representation from Euler's identity. Then, on $n=0,\ldots,N-1$ for a non-DC/non-Nyquist orthogonal integer-cycle record, recover $P=I+jQ$, amplitude, and phase using the declared normalized projections $I=(2/N)\sum x[n]\cos(\omega n)$ and $Q=-(2/N)\sum x[n]\sin(\omega n)$.
5. **E6 — strategy choice.** Add $2\cos(\pi n/4)$ and $2\sin(\pi n/4)$ using rectangular I/Q components, then predict $x[37]$ using a polar phasor. The cue is component addition versus long-index rotation; produce the resultant amplitude/phase and verify the phasor prediction against direct trigonometric evaluation to $10^{-12}$.
6. **FORWARD (E7).** First pass the eternal input $e^{j\omega n}$, defined for every integer $n$, through a three-tap FIR and show the exact all-$n$ eigenfunction factor $e^{j\omega n}(h_0+h_1e^{-j\omega}+h_2e^{-j2\omega})$. Then contrast a causal start $u[n]e^{j\omega n}$ from initial rest: $y[0]=h_0$, $y[1]=e^{j\omega}(h_0+h_1e^{-j\omega})$, and the full factor applies only for $n\ge2$. Reaches `dtft-and-frequency-response`; the solution must name the connection and include a `<Ref>`.
