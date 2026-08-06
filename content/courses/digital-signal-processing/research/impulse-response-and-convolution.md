# Research brief: impulse-response-and-convolution (Impulse Response and Convolution)

status: planned
module: discrete-signals-and-systems
type: core
goal: Compute and interpret the output of a discrete-time LTI system by convolution.
est_minutes: 36

## ARC

- **Inherits:** **Sampled Sequences and Physical Units** established analyze a measured waveform as a discrete sequence with explicit index, time, amplitude, and rate units.
- **Spine step:** “Impulse decomposition and convolution make LTI behavior predictable; recurrence adds memory whose stability must be tested against measured dynamics.” (*One response predicts a system*). Caption: “A perching-glider model closes the first time-domain loop.”
- **Contributes:** Compute and interpret the output of a discrete-time LTI system by convolution. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `difference-equations-and-stability`, which analyze a causal difference equation through its modes, impulse response, and BIBO stability condition.

## Sources to consult

- Oppenheim–Schafer, 2nd ed., ch. 2 §2.1.1 and §§2.2–2.4 — every-sequence impulse decomposition, LTI tests, convolution, and its properties.
- Orfanidis, ch. 3 §§3.2–3.3 and ch. 4 §§4.1.1–4.1.10, §§4.3.1–4.3.4 — the LTI convolution derivation, direct and matrix methods, and sample-processing implementations.
- MIT 6.003, Session 8 slides 15–48 and Problem Set 5 Problems 1–3 with solutions — system tests, impulse responses, and worked convolution.
- Steven W. Smith, *The Scientist and Engineer's Guide to Digital Signal Processing*, chs. 5–7 — linear systems and flip-and-slide convolution.

## NOTATION

- Ledger family `systems-and-convolution`: write $T\{x\}$ for system action, $h[n]$ for impulse response, and use local dummy $m$ in $\sum_m x[m]h[n-m]$ so it cannot collide with later bin $k$ or decimation $M$. Example: `[1,2]*[1,-1]=[1,1,-2]`.
## Key points the lesson must cover

1. Linearity and time invariance are separate tests.
2. Every sequence is a weighted sum of shifted impulses.
3. $y[n]=\sum_m x[m]h[n-m]$.
4. Finite buffers require an explicit boundary convention.

## Pitfalls / subtleties to flag

- Finite buffers require padding, boundary conventions, state retention, and latency choices absent from the infinite sum.
- A constant probe identifies only the tap sum under an eternal or periodic input, steady-state-only scoring, circular observation, or a crop that excludes edge transients. The startup partial sums of a full zero-padded finite experiment can reveal individual taps, so do not claim non-identifiability there.
- Passing a scaling test does not establish time invariance, and passing a shift test does not establish linearity; test superposition and shifts separately before using convolution.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- A three-tap echo turns each nonzero coefficient into a directly audible delay and makes the kernel identifiable on a second input.
- Numeric three-tap worked case: at $f_s=8\,\text{kHz}$, let $x[0]=1\,\text{V}$ and $x[1]=2\,\text{V}$, with $x[n]=0$ otherwise, and let $h[0]=1$, $h[1]=0.5$, $h[2]=0.25$, with $h[n]=0$ otherwise. Hand convolution gives $y[0:3]=[1,2.5,1.25,0.5]\,\text{V}$; adding one copy of $h$ and a twice-scaled copy shifted by one sample gives the same result.
- Demo identification contract: use truth $h=[0.70,0.25,0.10]$ and show that $[0.90,0.05,0.10]$ has the same sum under an eternal constant input when only steady state is observed. Validate on a held-out unit impulse: its first three convolution equations form the $3\times3$ identity and therefore have rank three. Score $E=\lVert\hat y-y\rVert_2/\max(\lVert y\rVert_2,\epsilon)$; if both target and prediction are zero define $E=0$, and if the target is zero but the prediction is nonzero, fail. Passing requires every tap within 0.01 and held-out impulse $E<0.01$.

## FIGURE PLAN

1. `draw:` **Four-frame flip-and-slide convolution sequence with only overlap changing.** (sequence, 3–7 frames; one delta per frame) — Draw: the sequence explains a process and should not source a foreign diagram. Inspiration: Oppenheim §2.3; Orfanidis §4.1.
2. `draw:` **Impulse decomposition: scaled shifted deltas entering identical shifted copies of h[n].** (single) — Draw: the abstraction needs aligned formula labels.
3. `draw:` **Three-tap echo FIR with dry, early, and late paths labeled in samples and milliseconds.** (single) — Draw: a deployed effect is still an explanatory block diagram.
4. `draw:` **The same convolution as sum, Toeplitz matrix, and streaming circular buffer.** (single) — Draw: coordinated representations need house typography. Inspiration: Orfanidis §§4.1–4.3.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Convolve $x[n]=[1,2,-1]$ for $n=0,1,2$ with $h[n]=[1,0.5]$ for $n=0,1$. Show the four overlap sums and return $y=[1,2.5,0,-0.5]$; verify the result against a shifted-impulse decomposition.
2. **E6 — boundary probe.** Use δ[n], a length-one kernel, and a zero kernel to identify the identity and annihilator cases and explain each.
3. **E6 — claim to refute.** Under an eternal constant input with only steady state scored, refute 'a kernel fitted to one constant input is uniquely identified' by comparing $[0.70,0.25,0.10]$ and $[0.90,0.05,0.10]$, which share tap sum 1.05; explain why retaining a zero-padded startup edge changes the conclusion.
4. **E6 — research shaped.** Measure or synthesize a short room echo, estimate three dominant delay taps, and state an agreement threshold before fitting.
5. **E6 — strategy choice.** Apply $x=[1,2,-1]$ and $h=[1,0.5]$ using linear convolution for a zero-padded finite record and 3-point circular convolution for a periodic buffer. The cue is the boundary convention; produce both output arrays, circle the wrapped term, and state which result a nonperiodic echo system requires.
6. **FORWARD (E7).** Feed a first-order feedback rule with an impulse and compute six outputs; the next lesson identifies the homogeneous mode controlling the tail. Reaches `difference-equations-and-stability`; the solution must name the connection and include a `<Ref>`.
