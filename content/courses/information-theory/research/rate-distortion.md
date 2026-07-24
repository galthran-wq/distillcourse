# Research brief: rate-distortion (Rate-distortion theory)

status: planned
module: principles
type: core
goal: Compute the rate-distortion function of a source under a fidelity constraint.

New lesson. The third of Shannon's coding theorems (lossless source coding,
channel capacity, lossy source coding) and the direct parent of the information
bottleneck, which generalizes it. It also carries a strong ML payoff: neural
image codecs (Ballé) minimize rate + λ·distortion directly. Placed after
max-entropy and before MDL/IB so the information-bottleneck lesson can open by
naming rate-distortion's flaw (a hand-picked distortion function) and fixing it.

## Sources to consult

- Shannon 1948, **Part V, §27-29** — fidelity criteria reduce to an averaged
  pairwise distortion `ρ(x, x̂)` (§27); the rate is
  `R_1 = min_{p(x̂|x)} I(x; x̂)` subject to a fidelity bound (§28, Theorem 21);
  the Gaussian/RMS closed form `R = W log(Q/N)` (§29). The origin of the field.
- Cover & Thomas, **ch. 10 "Rate Distortion Theory"** — §10.2 definitions,
  §10.3.1 the **Bernoulli(p) / Hamming** result `R(D) = H(p) - H(D)` for
  `D ≤ min(p,1-p)`, §10.3.2 the **Gaussian / squared-error** result
  `R(D) = ½ log(σ²/D)`, §10.4-10.5 converse and achievability. The primary
  computational source.
- Polyanskiy & Wu, **ch. 23-25** — R(D) definition, the two closed forms
  (§25.1), the "two nested spheres" packing picture, Blahut-Arimoto (pointer).
- Ballé, Laparra & Simoncelli 2017 (arXiv:1611.01704) — the modern payoff:
  end-to-end learned image compression as `min R + λ·D`, the differentiable-
  quantization trick, and the exact R-D-objective ↔ VAE equivalence (§3.1).
- Tishby et al. 1999, §1-2.1 — one-sentence forward pointer: IB generalizes
  rate-distortion by replacing the distortion with a second mutual information.

## Key points the lesson must cover

1. **The problem** (concrete opener): perfect reconstruction is unnecessary and
   expensive. Fix a distortion measure `d(x, x̂)` (Hamming for bits, squared
   error for reals) and a tolerance D; ask for the fewest bits per symbol that
   reconstruct within average distortion D.
2. **The rate-distortion function**: `R(D) = min over test channels p(x̂|x) of
   I(X;X̂)` subject to `E[d(X,X̂)] ≤ D`. The reconstruction X̂ is a processed
   version of X, so `I(X;X̂)` is the rate — mutual information is the currency
   (reuse `mutual-information`; the DPI applies since X̂ is derived from X).
3. **Endpoints and shape**: `R(0) = H(X)` (lossless, recover source coding as
   the D = 0 corner), `R(D)` decreasing and convex, hitting `R = 0` when D is
   large enough that a constant reconstruction suffices.
4. **Bernoulli(p) source, Hamming distortion** (worked, exact):
   `R(D) = H(p) - H(D)` for `0 ≤ D ≤ min(p, 1-p)`, else 0. Compute at p = 0.5
   (R(D) = 1 - H(D)) and a biased p; check R(0) = H(p) and the zero point. This
   is the demo's curve.
5. **Gaussian source, squared error** (worked, stated): `R(D) = ½ log₂(σ²/D)`
   for `D ≤ σ²`, else 0; note this uses differential entropy — flag it as the one
   continuous result, stated, and that the difference of differential entropies
   (the rate) is coordinate-safe even though differential entropy alone is not.
6. **The modern payoff** (Ballé, precise): a learned codec parametrizes the
   encoder/decoder as networks and trains `min R + λ·D`, where R is the entropy
   of the quantized latent and D the reconstruction error; λ sweeps the R-D
   curve exactly as the Lagrangian here does. Uniform-noise relaxation makes
   quantization differentiable; the objective coincides with a VAE loss.

## Pitfalls / subtleties to flag

- **X̂ is processed from X**: the Markov chain is `X → X̂` (a test channel),
  not a generative model of X. The DPI applies and `I(X;X̂)` is the rate.
- R(D) is the min of I over test channels satisfying the constraint — a
  minimization, unlike capacity's maximization. Contrast the two explicitly (one
  minimizes I to compress, the other maximizes I to communicate).
- The **Gaussian result uses differential entropy**; do not silently carry
  discrete-entropy intuitions over. It is stated, not derived, and flagged.
- `R(D)` is an achievable limit (achievability + converse), not the performance
  of any particular quantizer; real codecs sit above it.
- Hamming-distortion R(D) is flat 0 past `D = min(p,1-p)`: once you may err on a
  min(p,1-p) fraction, guessing the majority symbol costs no rate. Show it.
- Distortion is **chosen by the designer** — this is exactly the flaw the
  information-bottleneck lesson removes. Plant the pointer, do not resolve it.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the R(D) plane: rate vs distortion, the
   convex `R(D)` curve, `R(0) = H(X)` at the left axis and `R = 0` where
   distortion is free, the achievable region shaded above the curve. One idea:
   fewer bits buy more error. Static twin of the RateDistortionCurve demo.
   Inspiration: Ballé fig. 2 / Cover & Thomas ch. 10 (recreate).
2. **single `<Figure>` (component)** — the objective dissected:
   `R(D) = min_{p(x̂|x)} I(X;X̂)  s.t.  E[d] ≤ D` with labels-above-symbols —
   "test channel", "rate = mutual information", "fidelity constraint". One idea:
   compress = minimize I under a distortion budget. Inspiration: Shannon §28.
3. **`<FigureSequence>` (3 frames)** — the Bernoulli curve built: frame 1 the
   lossless corner `R(0) = H(p)`; frame 2 subtract `H(D)` as D grows; frame 3 the
   curve hitting 0 at `D = min(p,1-p)`. Delta = one construction step. One idea:
   `R(D) = H(p) - H(D)`. Inspiration: Cover & Thomas §10.3.1.
4. **single `<Figure>` (component)** — capacity vs rate-distortion side by side:
   two near-identical panels, `C = max I(X;Y)` (communicate) and
   `R(D) = min I(X;X̂)` (compress), the changed word (`max`/`min`, `Y`/`X̂`)
   highlighted. One idea: the two extreme points of mutual information.
   Inspiration: Cover & Thomas fig. 1.2 / playbook two-panel comparison.
5. **single `<Figure>` (component)** — the neural codec loop: image →
   encoder → quantize → entropy code (rate R) → decoder → reconstruction
   (distortion D), trained on `R + λ·D`; the λ dial sweeping the R-D curve. One
   idea: the trade-off made trainable. Inspiration: Ballé fig. 1 (recreate,
   simplify).
6. **single `<Figure>` (component)** — the Gaussian curve `R(D) = ½ log₂(σ²/D)`:
   the log curve over D ∈ (0, σ²], with the "6 dB per bit" annotation (each extra
   bit quarters the distortion). One idea: for a Gaussian source, one bit halves
   the amplitude error. Inspiration: Cover & Thomas §10.3.2.
