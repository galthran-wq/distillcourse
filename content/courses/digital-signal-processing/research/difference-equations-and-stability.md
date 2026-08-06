# Research brief: difference-equations-and-stability (Difference Equations and Stability)

status: planned
module: discrete-signals-and-systems
type: core
goal: Analyze a causal difference equation through its modes, impulse response, and BIBO stability condition.
est_minutes: 38

## ARC

- **Inherits:** **Impulse Response and Convolution** established compute and interpret the output of a discrete-time LTI system by convolution.
- **Spine step:** “Impulse decomposition and convolution make LTI behavior predictable; recurrence adds memory whose stability must be tested against measured dynamics.” (*One response predicts a system*). Caption: “A perching-glider model closes the first time-domain loop.”
- **Contributes:** Analyze a causal difference equation through its modes, impulse response, and BIBO stability condition. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `perching-glider-system-identification`, which evaluate a discrete model against measured flight data and identify where its physical idealization fails.

## Sources to consult

- MIT 6.003, Sessions 2–7 — recurrences, system functionals, feedback, modes, poles, and CT/DT stability comparisons.
- Oppenheim–Schafer, chs. 2–3 — difference equations, impulse responses, z-transform foundations, causality, and stability.
- Lyons, ch. 6 §§6.1–6.5 — recursive filters, z-domain analysis, and pole geometry.
- Orfanidis, ch. 3 §§3.4–3.5, ch. 5 §5.6, and ch. 6 §§6.3.2, 6.4.2 — feedback difference equations, BIBO absolute summability, initial conditions, dominant-pole settling, and conjugate-pole behavior.

## Key points the lesson must cover

1. Initial conditions are part of a recursive computation.
2. Homogeneous modes determine decay or growth.
3. BIBO stability requires absolute summability of $h[n]$.
4. Finite traces cannot establish asymptotic stability.

## Pitfalls / subtleties to flag

- Finite observation cannot prove stability, and state initialization, overflow, coefficient rounding, and saturation alter recurrences.
- A recursive trace depends on initial state as well as input; silently resetting state between blocks can make a stable recurrence click or make an unstable mode appear absent.
- The radius cap and settling limit are separate constraints. With integer settling $N_{1\%}=\lceil\ln(0.01)/\ln r\rceil$, the strict requirement $N_{1\%}<200$ means $r\le0.01^{1/199}\approx0.977124$; therefore $r=0.98$ fails settling, and $0.977$ is the largest passing value on a 0.001 grid.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Compare the geometric envelopes $0.999^n$, $1^n$, and $1.001^n$ on one fixed, unnormalized vertical scale: at $n=99$ they are approximately $0.906$, $1$, and $1.104$, so all three finite prefixes are bounded and visually close even though only the first has an absolutely summable infinite tail. If sinusoidal resonator traces replace the envelopes, hold $f_0=0.180$ cycles/sample, numerator 1, impulse input, zero initial state, and the shared scale fixed across all three.
- Worked case grounded in Oppenheim–Schafer ch. 2: for $y[n]=a y[n-1]+x[n]$ at rest, derive $h[n]=a^n u[n]$; $a=1/2$ gives absolute sum 2, while $a=2$ grows, so a short bounded-looking prefix cannot settle the BIBO question.

## DEMO AND SECOND-ORDER ASSET CONTRACT

- Use $f_s=1000$ samples/s and request $f_0=180$ Hz, equivalently $0.180$ cycles/sample and $\omega_0=2\pi f_0/f_s=0.36\pi$ radians/sample.
- Fix the normalized all-pole numerator to $1$: $H(z)=1/(1-2r\cos\omega_0 z^{-1}+r^2z^{-2})$. Drive it with $x[n]=\delta[n]$ from $y[-1]=y[-2]=0$ and compute output indices $n=0,\ldots,N-1$ without resetting state inside a trace.
- Use the implementation sign convention $y[n]=x[n]+a_1y[n-1]+a_2y[n-2]$, where $a_1=2r\cos\omega_0$ and $a_2=-r^2$. If feedback terms move to the left, the denominator coefficient pattern is $[1,-a_1,-a_2]=[1,-2r\cos\omega_0,r^2]$.
- The state-table asset fixes $r=0.970$ and the declared requested frequency. Read the old pair before writing the new state; its first five impulse outputs are $[1,0.8260118,-0.2586045,-0.9908049,-0.5750956]$ for $n=0,\ldots,4$.
- The tuning demo passes only when relative frequency error is strictly below $1\%$, $r\le0.98$, and integer $N_{1\%}<200$. Stage the finite-record refutation at $f_0=0.180$, $r=1.002$: the first 100 samples are a bounded finite prefix, but extending the same zero-state computation to 1000 exposes growth; never call the short prefix stable.

## FIGURE PLAN

1. `draw:` **Feedback loop unrolled into successive delayed feedforward paths.** (sequence, 3–7 frames; one delta per frame) — Draw: the derivation is explanatory. Inspiration: MIT 6.003 Session 2.
2. `draw:` **Pole radius/angle paired with damped or growing sinusoidal samples.** (single) — Draw: linked geometry and waveform need shared color semantics.
3. `draw:` **A state-update table for the declared $r=0.970$, $f_0/f_s=0.180$ normalized all-pole impulse recurrence from zero initial state.** (single) — Draw: literal cells support read-before-write tracing over $n=0,\ldots,4$.
4. `draw:` **Three 100-sample geometric envelopes with radii 0.999, 1.000, and 1.001 on one fixed shared scale.** (single) — Draw: constructed comparison exposes that a bounded finite prefix cannot certify an infinite tail.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $y[n]=0.5y[n-1]+x[n]$, $y[-1]=2$, and $x[n]=\delta[n]$, compute $y[0]$ through $y[4]$. Report the zero-input and zero-state parts separately and check that their sum equals the direct recursion at every index.
2. **E6 — boundary probe.** Compare repeated and zero poles, a pole at zero, and a pole on the unit circle; separate decay, boundedness, and summability.
3. **E6 — claim to refute.** Refute 'a bounded 100-sample impulse response proves BIBO stability' with a slowly growing mode.
4. **E6 — derivation not shown.** Derive the impulse response and settling-time approximation for a first-order feedback system from the recurrence.
5. **E6 — strategy choice.** For $n=0,\ldots,5$, use the literal input $x[n]=[1,0,-1,2,0,0]$ in $y[n]=0.8y[n-1]+x[n]$. Solve once by sample-by-sample recursion with $y[-1]=1$ and once by convolution with $h[n]=0.8^n u[n]$. The cue is the nonzero initial state: produce both length-6 sequences, identify the missing zero-input term in the convolution-only result, and state when the two methods agree.
6. **FORWARD (E7).** Fit two recurrences of different order to a time-ordered record and reserve the final segment; the application uses held-out residuals to choose between them. Reaches `perching-glider-system-identification`; the solution must name the connection and include a `<Ref>`.
