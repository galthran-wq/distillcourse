# Research brief: adaptive-filters-and-lms (Adaptive FIR Filters and the LMS Algorithm)

status: planned
module: multirate-communications-and-compression
type: extra
goal: Analyze LMS adaptation of an FIR filter through steepest descent, step-size stability, and misadjustment, and apply it to interference cancellation.
est_minutes: 40

## ARC

- **Inherits:** **Impulse Response and Convolution** supplies the FIR structure being adapted; **Correlation, PSD, and Welch Estimation** supplies stationarity, autocorrelation, and expectation — the language the Wiener solution is written in.
- **Spine step:** off-path extra within *The full link closes*: the streaming-link application names adaptive equalization as beyond-course transfer; this branch supplies the smallest honest version of that machinery.
- **Contributes:** Analyze LMS adaptation of an FIR filter through steepest descent, step-size stability, and misadjustment, and apply it to interference cancellation. This is the lesson's single move; optional derivations must remain subordinate to it.
- **Hands off to:** no later lesson (extra; lint-enforced that no non-extra lesson requires it). Optional backward link: the Widrow 1975 ECG application revisits `ecg-cleanup-under-morphology-constraints` with an adaptive notch replacing the fixed one.

## Sources to consult

- Orfanidis, §24.1 (in corpus: `texts/orfanidis-s4.txt`) — the scalar mean-tracking case: exact least-squares solution, the instantaneous-gradient replacement (Eqs. 24.1.7–24.1.8), equivalence of scalar LMS with the exponential smoother, and the LMS/RLS distinction stated honestly.
- Widrow et al., *Adaptive Noise Cancelling: Principles and Applications*, Proc. IEEE 63(12), 1975 (in corpus: `texts/widrow-1975-adaptive-noise.pdf`) — the noise-canceller structure (primary + reference input), LMS convergence conditions, misadjustment, and measured applications: fetal ECG, 60 Hz cancellation in ECG (Section IX), and speech.
- Widrow & Stearns, *Adaptive Signal Processing*, Prentice-Hall 1985 — canonical text for the FIR Wiener/LMS chain; access: cite-only (not in corpus); verify chapter pointers before quoting.
- Haykin, *Adaptive Filter Theory* — canonical modern treatment; access: cite-only. Use for terminology cross-checks only.

## NOTATION

- Ledger family `adaptive`: coefficient vector $\mathbf{w}[n]$, regressor $\mathbf{x}[n]=[x[n],\ldots,x[n-N+1]]^T$, error $e[n]=d[n]-\mathbf{w}[n]^T\mathbf{x}[n]$, update $\mathbf{w}[n+1]=\mathbf{w}[n]+\mu e[n]\mathbf{x}[n]$. Declare whether $\mu$ is raw or normalized (NLMS divides by $\mathbf{x}^T\mathbf{x}+\varepsilon$) before any stability claim.

## Key points the lesson must cover

1. **The flaw first.** Every filter so far was designed once, from a
   specification known in advance. An echo path, a fetal-ECG electrode mix,
   or a drifting interference tone is not known in advance and not constant;
   a fixed design chases a moving target. The adaptive answer changes what a
   "filter" is: the coefficients become the state of a second dynamical
   system.
2. **The Wiener solution is the destination, stated before the algorithm**:
   minimizing $E[e^2]$ over FIR weights gives the normal equations
   $\mathbf{R}\mathbf{w}^\star=\mathbf{p}$ with $\mathbf{R}$ the input
   autocorrelation matrix and $\mathbf{p}$ the cross-correlation — the Welch
   lesson's statistics reused as design data (C5 revisit). Solve a 2-tap
   case by hand so the destination is concrete.
3. **LMS is steepest descent with the expectation deleted**: replace the
   gradient $-2\mathbf{p}+2\mathbf{R}\mathbf{w}$ by its one-sample estimate
   and the update $\mathbf{w}[n{+}1]=\mathbf{w}[n]+\mu e[n]\mathbf{x}[n]$
   falls out — Orfanidis §24.1 does exactly this deletion in the scalar case
   and lands on the exponential smoother, which is the reader's bridge from
   a known object (first-order recurrence, module 1) to the new one.
4. **Step size is a stability parameter, not a knob**: convergence of the
   mean requires $0<\mu<2/\lambda_{\max}$, with the practical surrogate
   $\mu<2/(N\cdot P_x)$ ($P_x$ = input power); the eigenvalue spread of
   $\mathbf{R}$ sets convergence-speed disparity across modes. This is
   module-1 mode analysis reborn: the weight-error system is a recurrence
   whose poles $1-\mu\lambda_i$ must sit inside the unit circle.
5. **Misadjustment is the price of never stopping**: the deleted expectation
   leaves gradient noise, so steady-state MSE exceeds the Wiener floor by
   roughly $\mu\cdot\mathrm{tr}(\mathbf{R})/2$ relative excess — fast
   adaptation and low floor trade against each other through the same $\mu$.
   State it as the engineering budget line; the exact constant is
   text-dependent (verify against Widrow 1975 §IV before quoting a formula).
6. **The noise-canceller structure is the killer application**: primary
   input (signal + interference) minus an adapted filtering of a REFERENCE
   input (correlated with the interference only) — the adaptive filter
   learns the interference path with no model of it. Widrow's measured 60 Hz
   ECG cancellation is the canonical instance and pays off the fixed-notch
   lesson: the adaptive notch tracks a drifting mains frequency that the
   fixed zeros of `ecg-cleanup-under-morphology-constraints` cannot follow.
7. **NLMS as the deployable default**: normalizing by instantaneous input
   power makes $\mu$ dimensionless and robust to level changes — one
   paragraph, since every practical system (echo cancellers, equalizers)
   ships it.

## Pitfalls / subtleties to flag

- A reference input correlated with the SIGNAL (not only the interference) makes the canceller remove signal — the structure's one fatal wiring error; state the correlation conditions explicitly.
- LMS convergence claims are about the mean and mean-square of the WEIGHTS under stationarity assumptions; a bounded-looking error trace from one run proves neither (module-1 finite-trace lesson, adaptive edition).
- Eigenvalue spread slows convergence in directions the input barely excites; an unexcited mode simply does not adapt (rank/persistency of excitation — one honest sentence, no full theory).
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Scalar-case equivalence: LMS on a constant-mean tracking problem IS the exponential smoother $\hat a_n=\hat a_{n-1}+2\mu(y_n-\hat a_{n-1})$ (Orfanidis Eq. 24.1.8ff) — the reader has already implemented LMS without knowing it.
- Two-tap identification by hand: input white with $P_x=1$, unknown plant $h=[1,0.5]$; $\mathbf{R}=I$, $\mathbf{p}=[1,0.5]^T$, Wiener solution equals the plant, stability bound $\mu<1$ (with $\lambda_{\max}=1$), and the weight-error recurrence contracts by $(1-\mu)$ per step — every number checkable on paper.
- Widrow 1975's measured applications as sourced evidence: fetal ECG separation and 60 Hz cancelling with real recordings — the paper's plots are the historical artifacts; a course reproduction can run the same structure on `ecg-mitbih-v1` (record 100 + synthetic drifting 60 Hz line) and on `audio-clips-v1` speech.

## FIGURE PLAN

1. `draw:` **Fixed design pipeline versus adaptive loop: the coefficients join the state.** (single) — One idea: what changed structurally when filters became adaptive.
2. `draw:` **Error surface (2-tap bowl) with steepest-descent path and noisy LMS path.** (single) — One idea: LMS is descent with gradient noise; misadjustment is visible as the rattling around the minimum.
3. `draw:` **Weight trajectories at three step sizes: slow, fast, diverging.** (sequence, 3 frames; one $\mu$ per frame) — One idea: $\mu$ is a pole location, not a preference.
4. `draw:` **Adaptive noise canceller block diagram with the correlation conditions labeled on each path.** (single) — One idea: the structure works because of what the reference is correlated WITH.
5. `draw:` **Adaptive 60 Hz cancellation on the bundled ECG with a drifting mains line, against the fixed notch.** (single) — Draw: computed from `ecg-mitbih-v1`; the payoff comparison with the module-4 application.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Run five LMS steps by hand for the 2-tap identification gem: white input samples $[1,-1,1,1,-1]$, plant $h=[1,0.5]$, $\mathbf{w}[0]=[0,0]$, $\mu=0.5$. Tabulate $e[n]$ and $\mathbf{w}[n]$; verify monotone shrinkage of the weight error and state the $\mu<1$ bound this run respects.
2. **E6 — boundary probe.** Probe $\mu$ at and beyond $2/\lambda_{\max}$, a zero-input interval (no adaptation), and a reference identical to the primary (signal cancellation); name which assumption each case breaks.
3. **E6 — claim to refute.** Refute "a smaller error at sample 500 means the filter converged" using one run with a slow eigen-mode still adapting; connect to the module-1 finite-trace refutation.
4. **E6 — derivation not shown.** Derive the mean-weight recurrence $E[\mathbf{w}[n+1]]=(I-\mu\mathbf{R})E[\mathbf{w}[n]]+\mu\mathbf{p}$ under the independence assumption and read the stability bound from its modes.
5. **E6 — research shaped.** Reproduce Widrow's 60 Hz cancelling on `ecg-mitbih-v1` record 100 plus a synthetic 60 Hz line whose frequency drifts by 0.5 Hz over the record: adaptive canceller with a mains-derived reference versus the fixed `[1,-1,1]`-numerator notch; report attenuation, QRS morphology change, and tracking behavior after the drift.
6. **FORWARD (E7, terminal transfer).** Sketch how the same update, applied to a channel-equalization error, becomes the adaptive equalizer the streaming-link application names as beyond-course; state which stationarity assumption a packetized channel violates. No later-course `<Ref>` exists by design; link back to `streaming-audio-resampling-and-subband-link`.
