# Research brief: dtft-and-frequency-response (DTFT and Frequency Response)

status: planned
module: fourier-representation-and-computation
type: core
goal: Analyze LTI behavior with the DTFT, transform properties, magnitude, phase, and group delay.
est_minutes: 40

## ARC

- **Inherits:** **Complex Sinusoids and Phasors** and **Impulse Response and Convolution** established complex-frequency modes and the LTI convolution relation that the DTFT diagonalizes.
- **Spine step:** “Complex modes and the DTFT turn LTI behavior into magnitude and phase, and sampling becomes spectral replication with an irreversible overlap boundary.” (*Modes expose frequency*). Caption: “Rotation, response, and sampling share one frequency axis.”
- **Contributes:** Analyze LTI behavior with the DTFT, transform properties, magnitude, phase, and group delay. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `sampling-aliasing-and-reconstruction`, which evaluate whether sampling preserves a bandlimited signal and specify the anti-alias and reconstruction conditions.

## Sources to consult

- Oppenheim–Schafer–Buck, 2nd ed., §2.2 Example 2.4 for the moving-average definition; §2.6.1 Example 2.20 for its frequency response; §2.6.2 for suddenly applied tones and transients; §§2.7–2.9 for the DTFT and its properties; §5.1.2 for phase/group-delay interpretation; and §5.5 for allpass phase behavior.
- Orfanidis, 2nd ed., §§1.5 and 5.4 for the DTFT pair, periodicity, unit-circle response, symmetry, and existence; §§6.3.1–6.3.2 for sinusoidal response, phase/group delay, and input-on/input-off transients; and ch. 9 §§9.1–9.2 for finite-window spectral computation.
- MIT 6.003, Sessions 17–18 — unit-circle response, phase-only systems, DTFT from periodic limits, and z-transform relation.
- Osgood EE 261, chs. 2–3 and 7 — Fourier projection, convolution, and filter interpretation.

## NOTATION

- Ledger families `frequency-response` and `fourier-transform-pair`: write DTFT values as $X(e^{j\omega})$, frequency response as $H(e^{j\omega})$, and DFT coefficients as $X[k]$; do not alternate with undeclared $H$ or $H(\omega)$. The course uses $e^{-j\omega n}$ in analysis and an unscaled forward DFT. Example: an $N$-point DFT samples the finite record’s DTFT at $2\pi k/N$.
- Claim ordinary continuity only for finite or absolutely summable sequences. For $h\in\ell^1$, $H(e^{j\omega})$ exists continuously on the unit circle; an eternal $e^{j\omega n}$ is an exact eigenfunction at every index, whereas a causal-start tone has a transient before its settled response.
- Display phase only where $H(e^{j\omega})\ne0$. Define $\tau_g(\omega)=-d\theta_H(\omega)/d\omega$ on a connected nonzero-response region where the chosen unwrapped phase is continuous and differentiable; never unwrap through an exact zero.

## Key points the lesson must cover

1. A finite or absolutely summable sequence has an ordinary continuous, $2\pi$-periodic DTFT; $\ell^2$ sequences and eternal sinusoids require weaker or generalized interpretations.
2. Convolution becomes multiplication.
3. Time shift changes phase without changing magnitude.
4. Group delay approximates envelope delay only for a sufficiently narrow occupied band where $H(e^{j\omega})$ is nonzero and differentiable, phase is continuously unwrapped, and magnitude is nearly constant.

## Pitfalls / subtleties to flag

- Finite and $\ell^1$ sequences have continuous periodic DTFTs, but code evaluates a finite grid; an $\ell^2$ DTFT may exist only in mean square and an eternal sinusoid uses generalized impulses.
- Plotted DFT/FFT values are samples of a finite record’s continuous DTFT and must not be mistaken for the transform itself or for improved window-limited resolution.
- For a stable LTI system, $H(e^{j\omega})$ describes an eternal input exactly and a suddenly applied tone only after its startup transient settles; a causal FIR has partial-overlap edge samples and a stable IIR approaches the settled response asymptotically.
- Phase, phase delay, and group delay are undefined at response zeros. Unwrap and differentiate only on a connected nonzero-response region, and invoke envelope delay only for a sufficiently narrow band with nearly constant magnitude.
- Declare sign, scale, index, endpoint, support, and unit conventions before importing formulas or plots; use $H(e^{j\omega})$ in definitions and exact answers.

## Concrete gems / worked examples

- A stable allpass response leaves every sinusoidal magnitude unchanged, while frequency-dependent phase can strongly reshape a multicomponent waveform by changing relative component alignment.
- Worked case grounded in Oppenheim–Schafer ch. 2: for the three-tap averager $h[n]=(1/3)[1,1,1]$, compute $H(e^{j\omega})=(1+e^{-j\omega}+e^{-j2\omega})/3$ and verify the exact null at $\omega=2\pi/3$ against a time-domain sinusoidal run.

## FIGURE PLAN

1. `draw:` **One DTFT period wrapped on the frequency circle with repeated endpoints.** (single) — Draw: the periodic geometry is explanatory.
2. `draw:` **Convolution in time paired with multiplication in frequency.** (single) — Draw: a dual-domain identity needs aligned symbols. Inspiration: Osgood §3.1.
3. `draw:` **Magnitude and phase response acting on three input spectral components.** (sequence, 3–7 frames; one delta per frame) — Draw: one component changes per frame.
4. `draw:` **Two narrowband packets through equal magnitudes but different group delays.** (single) — Draw: constructed packet comparison explains phase distortion. Inspiration: MIT 6.341 PS1.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $h[n]=(1/3)[1,1,1]$ on indices $0,1,2$, compute $H(e^{j\omega})$ at $\omega=0$, $2\pi/3$, and $\pi$: respectively $1$, $0$, and $1/3$, with principal phases $0$, undefined, and $0$. Verify the exact null and check $H(e^{j(\omega+2\pi)})=H(e^{j\omega})$ at one nonzero point, treating $-\pi$ and $+\pi$ as the same frequency endpoint.
2. **E6 — boundary probe.** Analyze a system with $H(e^{j\omega_0})=0$ and undefined phase there; explain that zero steady-state magnitude remains meaningful while phase, phase delay, and group delay do not.
3. **E6 — claim to refute.** Refute 'equal magnitude responses produce identical waveforms' with two systems having different phase.
4. **E6 — derivation not shown.** Derive conjugate symmetry of the DTFT for a real sequence and identify even/odd real-imaginary parts.
5. **E6 — strategy choice.** For the three-tap averager, use $H(e^{j\pi/3})=(2/3)e^{-j\pi/3}$ to predict the eternal/settled output $y_{ss}[n]=(2/3)\cos(\pi n/3-\pi/3)$. Then define exactly five cycles by $x_g[n]=\cos(\pi n/3)$ for $0\le n\le29$ and zero otherwise. Time-domain convolution must give $y[0:4]=[1/3,1/2,1/3,-1/3,-2/3]$; full-overlap agreement holds for $2\le n\le29$, followed by turn-off values $y[30]=0$, $y[31]=1/6$, and $y[32]=0$. The cue is eternal/settled eigenfunction response versus a finite gated transient.
6. **FORWARD (E7).** Multiply a bandlimited continuous spectrum by an impulse-train model and sketch three shifted copies; the next lesson names their overlap condition. Reaches `sampling-aliasing-and-reconstruction`; the solution must name the connection and include a `<Ref>`.
