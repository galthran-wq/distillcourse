# Research brief: z-transform-poles-zeros-and-roc (z-Transform, Poles, Zeros, and ROC)

status: planned
module: filter-design-and-implementation
type: core
goal: Analyze sequences and rational systems using region of convergence, pole-zero geometry, causality, and stability.
est_minutes: 40

## ARC

- **Inherits:** **DTFT and Frequency Response** and **Difference Equations and Stability** established unit-circle frequency response, recursive modes, causality, and BIBO stability questions.
- **Spine step:** “The z-plane connects response to causality and stability; FIR and IIR methods approximate specifications with different phase and order costs.” (*Specifications become filters*). Caption: “Poles, zeros, ripples, and delay turn a desired response into coefficients.”
- **Contributes:** Analyze sequences and rational systems using region of convergence, pole-zero geometry, causality, and stability. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `fir-filter-design-and-verification`, which design and densely verify a linear-phase FIR filter from ripple, attenuation, transition-width, and delay requirements.

## Sources to consult

- Oppenheim–Schafer, ch. 3 §§3.1–3.5 and ch. 5 §§5.1–5.5 — ROC, inversion, system functions, pole-zero geometry, and response.
- MIT 6.003, Sessions 8–13 — transform representations, pole motion, stability regions, feedback, and Bode reasoning.
- Lyons, ch. 6 §§6.3–6.5 — z-transform, direct-form example, and pole/zero response geometry.
- Orfanidis, chs. 5–6 — z-transform operations, rational systems, causality, inverse feasibility, and state realizations.

## NOTATION

- Ledger family `z-transform`: pair every $X(z)$ with its ROC, write poles as $p_i$ and zeros as $z_i$, and do not silently assume causality. Example: $1/(1-0.5z^{-1})$ with $|z|>0.5$ is the right-sided sequence.
## Key points the lesson must cover

1. A rational expression without its ROC is incomplete.
2. The DTFT exists when the unit circle lies in the ROC.
3. Causal stable rational systems have poles inside the unit circle.
4. Pole-zero vectors predict magnitude and phase.

## Pitfalls / subtleties to flag

- Pole-zero cancellation, finite precision, hidden unstable modes, and omitted ROC make symbolic transfer functions misleading.
- A rational formula without its ROC does not identify a sequence, causality, or stability; the same poles and algebraic expression can describe incompatible left- and right-sided signals.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- The same rational formula represents different sequences under different ROCs; only one may be causal and stable.
- Worked case grounded in Oppenheim–Schafer ch. 3: $X(z)=1/(1-0.5z^{-1})$ with ROC $|z|>0.5$ yields $(0.5)^n u[n]$, while ROC $|z|<0.5$ yields the left-sided sequence; only the first is causal and includes the unit circle for a stable DTFT.

## FIGURE PLAN

1. `draw:` **Same rational expression with exterior, interior, and annular ROCs and different sequences.** (sequence, 3–7 frames; one delta per frame) — Draw: ROC is explanatory. Inspiration: Oppenheim §3.1.
2. `draw:` **Pole/zero vectors to a point on the unit circle, yielding magnitude and phase.** (single) — Draw: geometry and formula must be linked.
3. `draw:` **Causality/stability regions as concentric boundaries.** (single) — Draw: mathematical regions should be drawn.
4. `draw:` **Near-cancelled pole-zero pair before and after coefficient rounding.** (single) — Draw: constructed failure exposes implementation sensitivity.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $X(z)=1/(1-0.5z^{-1})$, tabulate $n=-3,\ldots,3$ under ROCs $|z|>0.5$ and $|z|<0.5$. Mark support, causality, and unit-circle inclusion; verify exterior samples $[0,0,0,1,0.5,0.25,0.125]$ and interior samples $[-8,-4,-2,0,0,0,0]$.
2. **E6 — boundary probe.** Treat a pole at zero, pole on the unit circle, exact cancellation, and empty ROC; state which theorem hypotheses fail.
3. **E6 — claim to refute.** Refute 'the algebraic rational expression uniquely determines the sequence' with two ROCs.
4. **E6 — derivation not shown.** Derive the frequency-response magnitude from pole/zero distances for a first-order system.
5. **E6 — strategy choice.** On $\omega_m=\pi m/4095$ for $m=0,\ldots,4095$, evaluate two real filters, each scaled so $H(e^{j0})=1$: benign design A has conjugate poles $0.60e^{\pm j0.30\pi}$ and zeros $0.20e^{\pm j0.65\pi}$; near-cancelled design B has conjugate poles $0.980e^{\pm j0.30\pi}$ and zeros $0.979e^{\pm j0.30\pi}$. Use expanded polynomials or factored pole-zero/SOS evaluation. The cue is near-cancellation conditioning; choose a form for A’s float32 preview and B’s accuracy audit, then submit float32-versus-float64 peak errors and labeled pole-zero plots.
6. **FORWARD (E7).** Invert an ideal lowpass response and truncate the resulting sinc symmetrically; the next lesson turns that approximation into an FIR design. Reaches `fir-filter-design-and-verification`; the solution must name the connection and include a `<Ref>`.
