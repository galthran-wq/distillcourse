# Research brief: rate-distortion (Rate-distortion theory)

status: drafted (kept slug — revise, do not rewrite)
module: principles
type: core
goal: Compute the rate-distortion function of a source under a fidelity constraint.
est_minutes: 38

## ARC

- **Inherits:** mutual information (`mutual-information`), the entropy floor for
  lossless coding (`source-coding-theorem-lite`), `D(p||q)`
  (`kl-divergence`), and the data-processing inequality.
- **Spine step:** "Giving up exact reconstruction turns the coding limit into a
  curve R(D), and charging a model for its own description turns model selection
  into the same compression problem." (step 10, *Bits traded for fidelity and
  for models*, 1959–1978)
- **Contributes:** the lossy limit, and the observation that the rate is again a
  mutual information — now minimised rather than maximised. The structural
  mirror of channel capacity should be made explicit.
- **Hands off to:** `information-bottleneck` (which replaces the distortion
  measure) and `learned-image-compression` (which implements the Lagrangian).

## Sources to consult

- Cover & Thomas, **ch. 10**: §10.2 definitions; **§10.3** the closed forms —
  Bernoulli under Hamming `R(D) = H(p) - H(D)` (Thm 10.3.1) and Gaussian under
  squared error `R(D) = (1/2) log(σ²/D)` (Thm 10.3.3); §10.4-10.5 converse and
  achievability; §10.3 also gives reverse water-filling for parallel Gaussian
  sources. The chapter opening's elephant-and-chicken analogy (why joint
  description beats separate description) is worth a sentence.
- Weissman (EE376A), **ch. 8** — the whole chapter, and specifically §8.2's
  explicit test-channel constructions (`U = V ⊕ Z` for the binary case,
  `U = V + Z` for the Gaussian) that *achieve* the bound, plus §8.5's covering
  interpretation. This is the most usable derivation for our level.
- Polyanskiy & Wu, **ch. 23-25**: §23.1 scalar quantization and Lloyd's
  algorithm with its non-uniqueness counterexample; the Panter-Dite high-rate
  result (optimal point density ∝ `p^{1/3}`); §25.1 the closed forms;
  §25.1.1's Hamming worked example (100 bits to 50 buys 11% distortion, against
  25% for the naive store-half-guess-half scheme) — this is the single best
  motivating computation in the lesson.
- Shannon 1948 Part V, §27-29 — the original rate-distortion formulation.

## Key points the lesson must cover

1. **The flaw first.** Lossless coding of a photograph or an audio stream is
   both impossible to do well and unnecessary. But "close enough" needs a
   definition, and the definition is a choice with consequences.
2. **The distortion measure** `d(x, x̂)`, with the two standard cases: Hamming
   for discrete, squared error for continuous. State plainly that the measure is
   an input, not a discovery — this is the flaw `information-bottleneck` will
   attack.
3. **The definition** `R(D) = min over p(x̂|x) with E[d] ≤ D of I(X;X̂)`. Note
   the mirror: capacity was `max I` over inputs for a fixed channel; `R(D)` is
   `min I` over channels for a fixed source. Draw the parallel explicitly.
4. **Bernoulli under Hamming**: `R(D) = H(p) - H(D)` for `D ≤ min(p, 1-p)`, zero
   beyond. Derive it, including the test channel that attains it. Then run the
   Polyanskiy example: at `p = 1/2` and `R = 1/2`, `D = 0.11`, against the naive
   scheme's 0.25. A factor of more than two, from the same bit budget.
5. **Gaussian under squared error**: `R(D) = (1/2) log2(σ²/D)`. Note the
   consequence engineers actually use: one extra bit per sample buys a factor of
   four in mean-squared error, i.e. about 6 dB per bit.
6. **The covering picture.** Channel coding *packs* disjoint noise balls into
   the output space; rate-distortion *covers* the source's typical set with
   distortion balls. Same geometry, opposite direction. Give both pictures side
   by side — this is the lesson's payoff and it makes the min/max mirror visual.
7. **Scalar quantization as the practical floor**: Lloyd's algorithm, its
   convergence to a centroidal tessellation, and the fact that it can converge
   to a local optimum. State the Panter-Dite high-rate rule (`p^{1/3}` point
   density) as the design heuristic it is.

## Pitfalls / subtleties to flag

- `R(D)` is a limit over long blocks; a scalar quantizer does not attain it, and
  the gap (about 0.25 bit/sample at high rate for a Gaussian) is why vector
  quantization and transform coding exist.
- The distortion measure decides everything downstream. Mean squared error is
  chosen for tractability, not for perceptual validity — this claim is cashed
  out with real images in `learned-image-compression`.
- `R(D) = 0` for `D` at or above the trivial distortion (the best constant
  reconstruction), and the curve is convex and decreasing. Boundary behaviour
  matters and is a good exercise.
- The minimising `p(x̂|x)` is called a test channel and is not a physical
  channel; it is a device for stating the bound.
- Do not conflate `R(D)` with what a codec achieves. It is a bound, and real
  codecs sit above it.

## FIGURE PLAN

1. `draw:` **bernoulli-curve-1..3.svg** (exist, `<FigureSequence>`) — `R(D)` for a
   Bernoulli source traced as `D` grows, reaching zero at `D = p`.
2. `draw:` **NEW, single `<Figure>`** — the min/max mirror: two panels, capacity
   (`max I` over inputs, channel fixed) and `R(D)` (`min I` over test channels,
   source fixed), with the shared `I(X;Y)` symbol colour-bound across both. One
   idea: the same quantity, optimised in opposite directions.
3. `draw:` **NEW, single `<Figure>`** — packing against covering: two circles-in-
   a-space panels, one with disjoint balls packed inside (channel coding) and one
   with overlapping balls covering (rate-distortion), each with its count
   annotated. One idea: the geometry is dual. Inspiration: Weissman §8.5 and
   Polyanskiy §25.1.1's nested-sphere picture.
4. `draw:` **NEW, single `<Figure>`** — the Hamming worked example as a tally:
   100 source bits, a 50-bit budget, and two schemes — store half and guess
   (25% error) against the rate-distortion optimum (11%) — with both error
   counts drawn. One idea: the optimum is not the obvious scheme.
5. `draw:` **NEW, single `<Figure>`** — the Gaussian curve with the 6 dB-per-bit
   rule marked: `R(D)` on log axes with two points one bit apart and the factor
   of four in `D` annotated.
6. `draw:` **`<FigureSequence>` (3 frames)** — Lloyd's algorithm on a
   one-dimensional density: frame 1 initial centroids and cells; frame 2
   centroids move to cell means; frame 3 boundaries move to midpoints, repeat.
   One idea: alternate two conditions until neither moves.
7. `draw:` **NEW, single `<Figure>`** — the test channel for the binary case:
   `X = X̂ ⊕ Z` with `Z ~ Bernoulli(D)`, drawn as a channel diagram, with the
   resulting `I(X;X̂) = H(p) - H(D)` written beneath. One idea: the bound is
   attained by an explicit construction.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Compute `R(D)` for a Bernoulli(0.3) source at `D = 0.05, 0.15,
   0.3, 0.4`, and for a Gaussian with `σ² = 4` at `D = 1, 0.25`.
2. **Boundary probe.** Evaluate `R(D)` at `D = 0` and at `D` equal to the
   trivial distortion for both source types. Report both, and state which
   hypothesis of the definition makes `R(0)` equal the entropy for the discrete
   case and infinite for the Gaussian.
3. **Claim to refute.** "Halving the rate roughly doubles the distortion." Test
   this against both closed forms and report where it is approximately right and
   where it fails badly, naming the regime.
4. **Derivation the lesson skipped.** Derive `R(D) = H(p) - H(D)` for the binary
   source: exhibit the test channel, compute `I(X;X̂)`, and prove the converse
   direction using the fact that conditioning reduces entropy.
5. **Derivation, second direction.** Derive the Gaussian `R(D)` and then show
   the 6 dB-per-bit rule follows, converting the factor of four into decibels
   explicitly.
6. **Research-shaped.** Take a grayscale image, quantize it uniformly to 1, 2, 3
   and 4 bits per pixel, and measure the mean squared error at each. Plot rate
   against distortion and compare the slope against the 6 dB-per-bit prediction.
   Report where your curve sits relative to the Gaussian `R(D)` and give one
   reason for the gap.
7. **FORWARD (E7).** You must compress images so that a downstream classifier
   still identifies the object. Squared error is a poor proxy for that. Write
   down what you would actually want to preserve, express it as a quantity
   involving the label, and state what the objective becomes. Reaches
   `information-bottleneck` — the solution names `I(T;Y)` and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph and the min/max mirror with capacity made explicit — the current
  draft states `R(D)` without connecting it structurally to `C`, and that
  connection is the reason the lesson belongs in this module.
- Figures 2, 3, 4, 5, 6, 7 above. Only the Bernoulli sequence exists today.
- The Polyanskiy Hamming example (11% against 25%), which is the best
  motivation available and is currently absent.
- Lloyd's algorithm and the practical-quantizer gap, currently absent, and
  needed so that `learned-image-compression` is not the reader's first contact
  with a real quantizer.
- The 6 dB-per-bit consequence, stated as the rule engineers use.
- Depth toward 38 minutes.

**Lose**
- Any presentation of the distortion measure as natural or given. It is chosen,
  and the lesson must say so, because the next lesson attacks exactly that.
- Callouts restating the definition (L15).
