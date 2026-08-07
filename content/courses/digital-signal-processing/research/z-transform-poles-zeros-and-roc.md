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

1. **The flaw first.** The DTFT could not represent the growing mode the course
   already met: $h[n]=1.2^nu[n]$ from **Difference Equations and Stability** has
   no convergent DTFT series, yet its recurrence is one line. The z-transform
   weights samples by $r^{-n}$ so that a large enough contour radius restores
   convergence — the transform exists on a *region*, and the region is data.
2. **ROC families follow support.** Right-sided sequences converge outside the
   outermost pole; left-sided inside the innermost; two-sided on an annulus;
   finite-length everywhere except possibly $0$ and $\infty$. Derive each from
   the geometric series, then state the master fact: a rational expression
   without its ROC is not a sequence.
3. **The DTFT is the unit-circle restriction**, defined exactly when the ROC
   contains $|z|=1$. This closes the loop with the drafted transform lessons:
   $1.2^nu[n]$ has ROC $|z|>1.2$, which is why no frequency response existed.
4. **Inversion by partial fractions**, including one repeated-pole case
   ($nr^nu[n]$ terms), worked completely — this is the tool every later design
   lesson assumes.
5. **Causal + stable ⇔ all poles strictly inside the unit circle with an
   outward ROC.** Both directions argued, and the converse trap named: the same
   poles with an interior ROC give an anticausal stable or causal unstable
   reading (see misconception below).
6. **Pole-zero vector geometry**: $|H(e^{j\omega})|$ is the product of
   distances to zeros over distances to poles, phase the sum of angles. Reread
   the module-1 resonator with $\rho=0.97$, $\omega_0=0.36\pi$: its transfer
   function $1/(1-2\rho\cos\omega_0z^{-1}+\rho^2z^{-2})$ has the conjugate pole
   pair the recurrence lesson found by trial mode — same numbers, new geometry
   (spiral revisit, C5).
7. **Hidden-mode caution as the bridge to implementation**: an exactly
   cancelled pole-zero pair leaves the input-output response clean while the
   realization can hold an internal growing state; finite precision un-cancels
   it. This is the seam to `finite-word-realizations`.

## Misconception to refute (L13)

- "Poles inside the unit circle means stable." Prevalent because it is the
  correct *causal* specialization stated without its hypothesis. Refutation:
  $1/(1-0.5z^{-1})$ with ROC $|z|<0.5$ has its pole inside the circle and is
  the *unbounded anticausal* sequence $-(0.5)^nu[-n-1]$... whose absolute sum
  diverges. The replacement model: stability is a property of (expression,
  ROC) pairs — the ROC must contain the unit circle; causal systems then force
  poles inside. Discriminating example: the two inversions of the warm-up
  exercise.

## Pitfalls / subtleties to flag

- Pole-zero cancellation, finite precision, hidden unstable modes, and omitted ROC make symbolic transfer functions misleading.
- A rational formula without its ROC does not identify a sequence, causality, or stability; the same poles and algebraic expression can describe incompatible left- and right-sided signals.
- A pole ON the unit circle admits no stable reading under either ROC; the accumulator $1/(1-z^{-1})$ is the canonical marginal case and connects back to the divergent step response of the stability lesson.
- $z$ and $z^{-1}$ polynomial conventions flip which "roots" are poles; imported coefficient arrays (`[b, a]` order, leading-coefficient normalization) must be declared before any pole plot is trusted.
- Zeros may lie anywhere, including outside the unit circle, without harming stability — readers routinely transfer the pole restriction to zeros; the FIR case ($h=[1,-2]$, zero at $z=2$, perfectly stable) breaks that transfer and seeds `minimum-phase-and-allpass-structures`.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- The same rational formula represents different sequences under different ROCs; only one may be causal and stable.
- Worked case grounded in Oppenheim–Schafer ch. 3: $X(z)=1/(1-0.5z^{-1})$ with ROC $|z|>0.5$ yields $(0.5)^n u[n]$, while ROC $|z|<0.5$ yields the left-sided sequence; only the first is causal and includes the unit circle for a stable DTFT.
- The module-1 resonator reread: $h[n]=\rho^n\frac{\sin((n+1)\omega_0)}{\sin\omega_0}u[n]$ transforms to $1/(1-2\rho\cos\omega_0\,z^{-1}+\rho^2z^{-2})$, ROC $|z|>\rho$. With $\rho=0.97$, $\omega_0=0.36\pi$ these are exactly the FeedbackStabilityLab coefficients $a_1=0.8260$, $a_2=-0.9409$; the pole radius the reader tuned by slider is now a dot on the z-plane, and the settling gate $N_{1\%}=\lceil\ln 0.01/\ln\rho\rceil$ is readable from that radius alone.
- Peaking geometry with numbers: for the same resonator, the distance from $e^{j0.36\pi}$ to the near pole is $1-\rho=0.03$, so the magnitude response peaks by roughly $1/0.03\approx33$ relative to the far-pole and zero factors — the vector picture predicts the resonance height before any dense evaluation.
- The mask hand-off: an FIR is all zeros (poles only at $z=0$), so its response is built entirely from zero placements; sketching the ten circle zeros of an 11-tap averager (the eleventh root at $z=1$ is cancelled) explains its comb of nulls at $2\pi k/11$, $k=1,\ldots,10$... a two-minute computation that makes the FIR lesson's zero plots familiar on arrival.

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
