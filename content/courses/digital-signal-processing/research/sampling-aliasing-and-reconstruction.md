# Research brief: sampling-aliasing-and-reconstruction (Sampling, Aliasing, and Reconstruction)

status: planned
module: fourier-representation-and-computation
type: core
goal: Evaluate whether sampling preserves a bandlimited signal and specify the anti-alias and reconstruction conditions.
est_minutes: 40

## ARC

- **Inherits:** **DTFT and Frequency Response** established analyze LTI behavior with the DTFT, transform properties, magnitude, phase, and group delay.
- **Spine step:** “Complex modes and the DTFT turn LTI behavior into magnitude and phase, and sampling becomes spectral replication with an irreversible overlap boundary.” (*Modes expose frequency*). Caption: “Rotation, response, and sampling share one frequency axis.”
- **Contributes:** Evaluate whether sampling preserves a bandlimited signal and specify the anti-alias and reconstruction conditions. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `dft-bins-symmetry-and-scaling`, which compute and interpret a finite DFT with explicit indexing, normalization, symmetry, and circular-convolution conventions.

## Sources to consult

- Oppenheim–Schafer, ch. 4 §§4.1–4.3 — periodic spectral replication, aliasing, ideal reconstruction, and sinc interpolation; §4.8.1 — analog anti-alias prefiltering and practical transition width; §4.8.4 — zero-order hold, sinc droop, delay, compensation, and reconstruction filtering.
- MIT 6.003, Session 21 slides 14–47 — sampling multiplication, replica overlap, anti-alias filtering, and audible alias examples.
- Osgood EE 261, ch. 5 — impulse-train sampling, interpolation, and sampling theorem.
- Lyons, ch. 2 §§2.1–2.5 — lowpass/bandpass aliasing, spectral inversion, and sample-rate choice.
- Orfanidis, ch. 1 §§1.3–1.6 — sampling theorem, signed modulo-$f_s$ aliases, Poisson spectral replication, ideal sinc interpolation, zero-order hold, droop compensation, and analog postfiltering.

## Key points the lesson must cover

1. Sampling creates spectral replicas at multiples of $f_s$.
2. Given known uniform $T_s$, a declared bandlimited signal class, the complete exact ideal sample sequence, and a declared reconstruction band, strict replica separation is sufficient for unique reconstruction.
3. At $f_s=2B$, closed supports touch. Equality is safe only with an explicit endpoint convention such as zero boundary spectrum; it is not a phase-independent guarantee for a sinusoid at $f_s/2$.
4. Digital filtering cannot undo analog aliasing.

## Pitfalls / subtleties to flag

- Real antialias and reconstruction filters have transition bands, delay, hold droop, jitter, and finite impulse responses.
- Spectral replicas are harmless only while they remain disjoint; once acquisition aliases two analog bands into the same discrete frequency, no digital reconstruction filter can separate them.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.
- Use the normalized convention $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$ with $\operatorname{sinc}(0)=1$. In $\operatorname{sinc}((t-nT_s)/T_s)$ the argument is dimensionless; the unit-height interpolation kernel is distinct from the ideal impulse-train reconstruction filter's frequency-domain gain $T_s$.

## Concrete gems / worked examples

- MIT’s Bach example plays the same recording at successively halved sample rates with and without anti-alias filtering, making irreversible folding audible.
- Worked case grounded in MIT 6.003 sampling examples: sample 700 Hz and 300 Hz cosines at 1 kHz and show that their sequences coincide because $700=1000-300$; an anti-alias lowpass must therefore act before the samples are formed.

## Frozen theorem and demo contract

- **Theorem hypotheses:** Assume a known uniform $T_s$, an appropriate ordinary- or $L^2$-Fourier bandlimited class with $X_c(j\Omega)=0$ outside $|\Omega|\le\Omega_B$, all exact samples $x[n]=x_c(nT_s)$ for every integer $n$, and a declared reconstruction band. Require $\Omega_s>2\Omega_B$ (equivalently $f_s>2B$), unless an explicit endpoint convention removes boundary content. The equality counterexample $x_\phi(t)=\cos(2\pi(f_s/2)t+\phi)$ gives $x_\phi[n]=(-1)^n\cos\phi$, including the all-zero sequence at $\phi=\pi/2$.
- **Interpolation convention:** Freeze $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$ and $x_c(t)=\sum_n x[n]\operatorname{sinc}((t-nT_s)/T_s)$. Both $t$ and $nT_s$ are seconds, so the argument is dimensionless. The kernels have unit height at their own sample instants; the ideal continuous-time reconstruction response has gain $T_s$ over the selected baseband to cancel the sampled spectrum's $1/T_s$ scale.
- **Class being tested:** `AliasThresholdLab` tests ordinary ideal lowpass reconstruction for the full real class known a priori to be bandlimited to $|f|\le B=4.0$ kHz. The displayed mixture is an interface specimen, not a sparse-tone prior, and no model-based identification below the ordinary bandlimited rate is allowed.
- **Displayed mixture:** With frequency in kilohertz and $t$ in milliseconds, use $x_c(t)=\cos(2\pi\,0.7t+20^\circ)+0.75\cos(2\pi\,1.8t-35^\circ)+0.50\cos(2\pi\,3.1t+45^\circ)+0.35\cos(2\pi\,4.0t+\phi)$. Test 0.7, 1.8, 3.1, and 4.0 kHz separately at phases $0^\circ$, $45^\circ$, and $90^\circ$ so the edge tone cannot be hidden by aggregate error.
- **Exact grid and reconstruction:** Candidate rates are $6.00\le f_s\le10.00$ kHz on the exact $0.25$ kHz grid. Ideal sample-only reconstruction preserves a tone strictly below $f_s/2$, reconstructs its signed baseband alias above $f_s/2$, and at equality reconstructs only the observable projection $\cos\phi\cos(2\pi ft)$. This is an identifiability model, not a finite-filter simulation.
- **Metric and decision:** Evaluate reference and reconstruction without delay alignment at the same $M=512$ times $t_m=20m/M$ ms. Use $E=\lVert\widehat x-x\rVert_2/\max(\lVert x\rVert_2,\texttt{Number.EPSILON})$ and $E_{\rm dB}=20\log_{10}E$. Floor exact zero at $-120$ dB for display only. PASS requires the unfloored $E<10^{-3}$ for every tone-phase case, every supplied tone strictly inside Nyquist, and clearance $f_s/2-B\ge0.50$ kHz. Thus $9.00$ kHz is the unique lowest grid pass. At $8.00$ kHz and $\phi=90^\circ$, the nonzero 4 kHz component samples to zero and falsifies equality. Over continuous choices, $8$ kHz is only an unsafe infimum; there is no smallest strictly safe rate.

## FIGURE PLAN

1. `draw:` **Several continuous sinusoids through identical sample dots.** (single) — Draw: the curves are explanatory counterexamples. Inspiration: Lyons §2.1; Oppenheim §4.2.
2. `draw:` **Impulse-train sampling and spectral replicas moving toward overlap.** (sequence, 3–7 frames; one delta per frame) — Draw: one changed replica per frame makes alias onset visible.
3. `draw:` **Shifted normalized-sinc kernels summing to a bandlimited waveform.** (sequence, 3–7 frames; one delta per frame) — Draw $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$ and the dimensionless shifts $\operatorname{sinc}((t-nT_s)/T_s)$; distinguish their unit sample-time height from the ideal reconstruction filter's gain $T_s$. Inspiration: Oppenheim Figs. 4.8–4.10.
4. `draw:` **Ideal reconstruction versus zero-order hold with sinc droop and images.** (single) — Draw: paired formula/response labels require house style. Inspiration: Orfanidis §1.6.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Sample $x(t)=\cos(2\pi900t)+0.5\cos(2\pi3100t)$ at $f_s=4\,\text{kHz}$. Map both components into $[0,2\,\text{kHz}]$, show that they coincide at $900$ Hz with opposite discrete-frequency directions, and sketch the three nearest spectral replicas with hertz-labeled axes.
2. **E6 — boundary probe.** Probe a sinusoid exactly at fs/2 under phases 0 and π/2; explain why equality is not a phase-independent guarantee.
3. **E6 — claim to refute.** Refute 'sampling faster than the signal's nominal center frequency prevents aliasing' with a bandpass counterexample.
4. **E6 — derivation not shown.** For $f_s=4$ kHz, derive the signed nearest-shift representative $f_b=f-k^*f_s$ and apply it to $f=1.3$, $5.3$, and $10.7$ kHz. Use $k^*=\lfloor f/f_s+1/2\rfloor$ for these nonnegative inputs so $f_b\in[-f_s/2,f_s/2)$; an exact Nyquist tie retains $-f_s/2$. Report $f_b$, the real-cosine apparent frequency $|f_b|$, and that a negative representative maps phase $\phi$ to $-\phi$ when reported at positive frequency.
5. **E6 — strategy choice.** A sensor contains desired content through $1.6$ kHz, interference confined to $2.6$–$3.4$ kHz, and negligible energy elsewhere. Compare raising $f_s$ from $4$ to $8$ kHz with keeping $4$ kHz and adding an analog anti-alias lowpass whose magnitude ripple is at most $0.1$ dB through $1.6$ kHz and whose attenuation is at least $60$ dB from $2.6$ kHz upward. Produce a replica sketch and this passband/stopband mask. State that the rate-only option is valid only because the frozen interference support lies below its 4 kHz Nyquist boundary; without an upper support bound, raising $f_s$ alone is not a guarantee.
6. **FORWARD (E7).** Take eight samples from one period and compute their correlations with eight harmonic phasors; the resulting list is the DFT. Reaches `dft-bins-symmetry-and-scaling`; the solution must name the connection and include a `<Ref>`.
