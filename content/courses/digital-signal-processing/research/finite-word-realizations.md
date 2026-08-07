# Research brief: finite-word-realizations (Finite-Word Realizations)

status: planned
module: filter-design-and-implementation
type: core
goal: Evaluate a filter realization under coefficient quantization, roundoff, overflow, limit cycles, bounded dither, and section ordering.
est_minutes: 40

## ARC

- **Inherits:** **IIR Filter Design and Bilinear Mapping** established stable rational transfer functions and recursive realizations whose coefficients, states, and poles now face finite precision.
- **Spine step:** “Streaming blocks and finite words make implementation structure observable; an ECG cascade tests morphology, delay, transients, and stability.” (*Structures face machines*). Caption: “Equivalent formulas separate under latency and quantization.”
- **Contributes:** Evaluate a filter realization under coefficient quantization, roundoff, overflow, limit cycles, and section ordering. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `ecg-cleanup-under-morphology-constraints` on the core path; `minimum-phase-and-allpass-structures` is optional.

## Sources to consult

- Oppenheim–Schafer, ch. 6 §§6.8–6.9 — finite-register effects, coefficient quantization, roundoff noise, overflow, and limit cycles.
- MIT 6.341, Lecture 7 pp. 1–20 and PS4 Problems 4.1–4.7 with solutions — direct/cascade/parallel/SOS structures, coefficient sensitivity, quantized pole movement, scaling, and finite-word stability.
- Lyons, §6.7 (PDF pp. 270–272) and ch. 12 — fixed/floating formats, scaling, limit cycles, dither mitigation with SNR cost, and implementation risk.
- Vaidyanathan, ch. 9 — filter-bank coefficient/roundoff effects and structure-preserving quantization.
- Orfanidis, §2.5 and Example 2.5.1 (physical PDF pp. 111–116; printed pp. 88–93) — subtractive/nonsubtractive dither, error whitening, and the 0.75-LSB sinusoid experiment.

## NOTATION

- Ledger family `quantization`: use $q$ for quantization step and reserve $\delta[n]$ for the impulse; declare bit depth, rounding/truncation, saturation/wrap, and full scale. Example: rounding without overload gives $|e[n]|\le q/2$.

## First exposure: dither

- **Definition:** Dither is a declared random sequence added before quantization to break deterministic locking between the input and quantization error; nonsubtractive dither raises the output noise floor, while subtractive dither requires the decoder to reproduce and remove the identical sequence.
- **Canonical case:** Use a fixed seed and a 0.75-LSB sinusoid. Compare no dither with triangular nonsubtractive dither near one LSB peak-to-peak, reporting input/error correlation, the largest coherent error spur, and the broadband-noise increase.
- **Boundary and near-miss:** Zero or too-small dither can leave grid-locked spurs; excessive dither can satisfy a correlation threshold while needlessly violating SNR; subtractive dither fails catastrophically if encoder and decoder sequences lose alignment.

## Key points the lesson must cover

1. **The flaw first.** Two realizations of the *same* rational transfer
   function — expanded direct form and SOS cascade — produce different
   outputs, different noise floors, and sometimes different stability once
   coefficients and states live on a finite grid. Algebraic equivalence is a
   real-arithmetic theorem; the lesson tests what survives its failure.
2. **Why direct forms fail first**: a high-order polynomial's roots are
   ill-conditioned functions of its coefficients — the sensitivity of pole
   $p_i$ to coefficient $a_k$ carries a $\prod_{j\ne i}(p_i-p_j)^{-1}$ factor
   (Oppenheim–Schafer §6.8), so clustered narrowband poles amplify rounding
   catastrophically. SOS factoring keeps each conjugate pair in its own
   quadratic, where rounding moves only that pair. Derive the sensitivity
   factor; do not just assert the folklore.
3. **Quantization noise as an injected-source model**: each rounding point
   injects a bounded error ($|e|\le q/2$; variance $q^2/12$ under the
   conditional model the quantization lesson will formalize), and each source
   reaches the output through its own transfer function. Roundoff-noise gain
   is therefore a *structure* property: pairing and ordering of sections
   change the output noise floor at identical coefficients.
4. **Scaling is the overflow contract**: $\ell_\infty$/$\ell_1$/$\ell_2$
   norms give guaranteed / worst-case / energy scalings; scaling down buys
   overflow margin and pays in SNR, which is why ordering (spread the gain,
   put high-Q sections where their peaking is absorbed) is a real decision
   and not a convention.
5. **Coefficient rounding moves poles and zeros** — the quantized-pole cloud
   figure — with the acceptance rule that every quantized pole radius stays
   strictly below 1 and the dense response error stays within its mask.
6. **Zero-input limit cycles are the signature nonlinearity**: rounding in
   the feedback loop creates fixed points and oscillations the linear model
   forbids (the §6.9.1 trapped-state worked case); saturation vs wraparound
   arithmetic changes which large-signal oscillations can persist.
7. **Seeded dither trades coherent grid-locked error for measurable broadband
   noise; it does not repair overload or unstable quantized poles** — keep the
   first-exposure block below as the authoritative treatment.
8. **The acceptance-ledger habit**: quantized pole radii, dense-grid response
   error, maximum state magnitude, overflow count, limit-cycle test — the
   five-row report the strategy-choice exercise demands and the ECG
   application reuses verbatim (C5 spiral into the module close).

## Misconception to refute (L13)

- "The poles are stable in floating point, so the fixed-point filter is
  stable." Prevalent because stability was just proved as a pole-location
  theorem. Refutation: quantizing the direct-form coefficients of a
  clustered-pole design moves a pole outside the unit circle at a word length
  where the SOS form of the *same* transfer function stays inside; and even
  with stable quantized poles, the §6.9.1 rounding loop sustains a nonzero
  zero-input output forever. Replacement model: stability of an
  implementation is a property of the realization + word format + rounding
  rule, checked by the acceptance ledger, not read off the ideal pole plot.

## Pitfalls / subtleties to flag

- Coefficient quantization, roundoff injection, accumulator overflow, limit cycles, and section ordering break algebraic equivalence.
- Second-order sections reduce sensitivity only when scaling and ordering are also controlled; an overflowing internal state or badly ordered high-Q section can still fail with stable quantized poles.
- Do not call a dithered result “better” from lower correlation alone: report the added noise, keep the seed reproducible, and test seed misalignment for any subtractive scheme.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- At one bit depth a high-order direct form can move a pole outside the unit circle while a paired SOS realization remains within 0.5 dB and stable.
- Worked case grounded in Oppenheim–Schafer §6.9.1: with $a=1/2$ and rounding to a grid containing $1/8$, initialize a zero-input first-order feedback state at $1/8$ and observe it remain trapped instead of decaying; the ideal pole is stable but the quantizer creates a limit cycle.
- Seeded dither case grounded in Orfanidis Example 2.5.1: quantize the same 0.75-LSB sinusoid without dither and with triangular dither, then show the odd coherent spurs spread into a broadband floor while the SNR cost remains explicit.

## FIGURE PLAN

1. `draw:` **Direct-form polynomial coefficients versus cascaded second-order sections.** (single) — Draw: the topology comparison is explanatory.
2. `draw:` **Quantization grid moving poles of a high-Q section.** (single) — Draw: constructed pole cloud demonstrates sensitivity.
3. `draw:` **Roundoff-noise sources injected at each state and accumulated to output.** (single) — Draw: a signal-flow/noise model should be drawn.
4. `draw:` **Zero-input limit cycle under wrap, saturation, and deadband quantizers.** (sequence, 3–7 frames; one delta per frame) — Draw: dynamic failure requires stages.
5. `draw:` **Seeded 0.75-LSB sine with no, insufficient, nominal triangular, and excessive dither: error correlation, spur height, and noise floor.** (sequence, 4 frames; one dither level per frame) — Draw from the reproducible experiment; the parameter sweep is explanatory evidence.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Run $y[n]=Q(0.5y[n-1])$ with $y[-1]=1/8$, step $q=1/8$, and ties rounded away from zero. Tabulate $n=0,\ldots,5$ beside the unquantized decay; check that every quantized state remains $1/8$ and label the nonzero fixed point as a limit cycle.
2. **E6 — boundary probe.** Probe one-bit coefficients, zero input with nonzero state, saturation versus wrap, and an exactly cancelled unstable mode.
3. **E6 — claim to refute.** Refute 'stable poles in floating point guarantee a stable fixed-point implementation' with a quantized counterexample.
4. **E6 — derivation not shown.** Derive one section's roundoff-noise gain and choose a scaling that avoids overflow for a stated input bound.
5. **E6 — research shaped.** With one fixed seed, sweep dither from 0 to 1.5 LSB peak-to-peak on a 0.75-LSB sine. Select the smallest level meeting both an input/error-correlation threshold and a coherent-spur threshold, then report the SNR penalty and repeat with a deliberately misaligned subtractive sequence.
6. **E6 — strategy choice.** Reproduce the digital lowpass defined by `scipy.signal.ellip(N=8, rp=0.2, rs=80, Wn=0.04, btype="lowpass", analog=False, output="zpk", fs=2.0)`, normalize its DC gain to one, and implement it in Q1.15 with a signed 32-bit accumulator, round-to-nearest/ties-away, and saturation. Compare one expanded high-order direct form with an SOS cascade ordered by increasing pole radius and scaled so each section’s peak gain on $\omega_m=\pi m/65535$, $m=0,\ldots,65535$, is at most one. The cue is pole sensitivity and internal-state range, especially radii above $0.98$; drive both with $x[n]=0.8\sin(0.02\pi n)+0.15\sin(0.20\pi n)$ for $n=0,\ldots,4095$, then submit quantized poles, maximum state, dense-response error, overflow count, and a 2048-sample zero-input limit-cycle test initialized to one LSB in every delay.
7. **FORWARD (E7).** Apply the chosen realization to an impulsive ECG segment and record delay, ringing, and state range; the module application evaluates those limits. Reaches `ecg-cleanup-under-morphology-constraints`; the solution must name the connection and include a `<Ref>`.
