# Research brief: minimum-description-length (Minimum description length)

status: planned
module: applications
type: core
goal: Apply two-part code lengths to select a model that neither underfits nor overfits.

Restructure note: `kolmogorov-complexity` is now a prerequisite lesson. Practical
(computable) MDL is the approximation of the uncomputable ideal — a two-part
Kolmogorov code — so open by recalling that ceiling in one sentence with a
`<Ref lesson="kolmogorov-complexity"/>` rather than re-motivating it from
scratch.

## Sources to consult

- **Grünwald 2004, "A Tutorial Introduction to the MDL Principle"**
  (arXiv:math/0406077) — the primary source.
  - **Ch. 1, §1.2** — regularity = compressibility; the three bit-sequences
    example (periodic / random / biased) and the polynomial curve-fitting
    example (their fig. 1.1).
  - **Ch. 1, §1.3-1.4** — the Crude Two-Part MDL Principle box: minimize
    `L(H) + L(D|H)`; why crude `L(H)` is arbitrary and refined MDL exists.
  - **Ch. 2, §2.2** — the Kraft / codelength-probability correspondence
    (`L = -log P` both ways) — recap territory, reuse from
    source-coding-theorem-lite rather than re-teach.
  - **Ch. 2, §2.4** — crude MDL worked on Markov chains / Bernoulli (Ex 2.8:
    `L(k,θ) + L(D|k,θ) = 2 log k + 1 + k log(n+1) - log P(D|k,θ)`), and the
    refinement to `O(1/√n)` parameter precision giving the `(k/2) log n` form.
  - **Ch. 2, §2.6** — refined MDL / NML and the complexity expansion
    `COMP_n ≈ (k/2) log(n/2π) + log ∫√|I(θ)| dθ`: STATE only, do not derive.
  - **Ch. 2, §2.9.2 and §2.10** — MDL ≠ BIC; failure modes under
    misspecification. For the honesty paragraph.
- MacKay, **ch. 28 "Model Comparison and Occam's Razor"** — the Bayesian dual:
  `P(x) = 2^{-L(x)}` makes MDL ≈ Bayesian model comparison; the Occam-factor
  picture.
- **Delétang et al. 2023, §3.3 "Optimal Model-Dataset Size Tradeoff"** — the
  parameter-adjusted (two-part) compression rate of Transformers; U-shaped
  adjusted-rate curves (their fig. 2): optimal model size grows with dataset
  size. The modern payoff.
- Cover & Thomas, **§14.13** (MDL under Kolmogorov complexity) — one-line
  pointer only.

## Key points the lesson must cover

1. **Regularity = compressibility** (concrete opener): three 24-bit strings —
   all zeros, a fair-coin string, a biased-coin string — and the length of the
   shortest description of each. Structure is what a short description
   exploits.
2. **Fit measured in bits**: `L(D|H) = -log2 P(D|H)` — the code-probability
   correspondence from the coding module applied to a *model*: a hypothesis
   that assigns the data high probability encodes it cheaply. Recap, not
   re-proof (link source-coding-theorem-lite).
3. **The two-part principle**: pick H minimizing `L(H) + L(D|H)`. The richest
   model always wins on `L(D|H)` alone (overfitting = maximum likelihood run
   amok); the `L(H)` term is the principled brake. Worked example with actual
   numbers: Bernoulli vs higher-order Markov chains on a binary string
   (Grünwald Ex 2.8 style), or polynomial degrees on a small dataset —
   compute both terms per candidate and exhibit the U-shape.
4. **The (k/2) log2 n parameter cost**: a k-parameter model's parameters are
   worth encoding only to precision `1/√n` (finer precision buys no fit), so
   `L(H) ≈ (k/2) log2 n` — the penalty grows with data size but slower than
   the fit term. Derivation at the heuristic level Grünwald §2.4 gives; state
   that refined MDL (NML) makes this exact and adds the Fisher-information
   term.
5. **Overfitting/underfitting asymmetry** (Grünwald §1.6 box): underfit models
   pay in `L(D|H)` forever; overfit models pay a bounded `L(H)` premium —
   and preferring the simpler model at small n is a *strategy* that works
   even when the true source is complex (the increasing-degree example).
6. **The modern payoff** (Delétang §3.3): charge a trained network its own
   parameter bits and the "adjusted compression rate" becomes U-shaped in
   model size — bigger is better only when the dataset amortizes the model;
   an MDL correction the raw training loss omits. Connect to the
   model-transmission caveat from compression-is-prediction.

## Pitfalls / subtleties to flag

- **Crude two-part L(H) is arbitrary** — different hypothesis encodings give
  different answers; refined MDL (one-part universal codes, NML) repairs this.
  State the limitation honestly; this lesson teaches the crude version because
  it is computable by hand.
- **MDL ≠ BIC**: the `(k/2) log n` form matches BIC only for fixed k as
  n → ∞ (Grünwald §2.9.2); do not present MDL as "BIC with extra steps".
- The hypothesis code must be **fixed before seeing the data** — an
  n-dependent or data-dependent code smuggles the data into L(H) and collapses
  to maximum likelihood (Grünwald §2.4.2).
- MDL selects among the *candidates offered*; under misspecification (no
  candidate near the truth) it can behave badly (Grünwald §2.10.2) — one
  honest sentence.
- Two-part coding here is **lossless coding of the data given the model** —
  distinct from lossy compression; do not conflate with rate-distortion.
- MDL is not a metaphysical Occam claim ("the world is simple"); it is a
  worst-case-regret coding strategy (Grünwald §1.5-1.6). Keep the register
  factual.

## FIGURE PLAN

1. **single `<Figure>` (component)** — three bit-strings with their shortest
   descriptions and description lengths tallied ("repeat 0 ×24" ≪ 24 bits;
   fair-coin string ≈ incompressible; biased string in between via its
   `-log2 P` cost). One idea: structure = short description. Inspiration:
   Grünwald §1.2.
2. **`<FigureSequence>` (3-4 frames)** — polynomial fits to one fixed scatter:
   frame per candidate degree (0, 2, high/interpolating), each frame showing
   the curve plus a two-bar tally `L(H)` / `L(D|H)`; the interpolating frame's
   L(H) bar dwarfs its zero fit cost. Delta = one candidate per frame.
   Inspiration: Grünwald fig. 1.1 (recreate).
3. **single `<Figure>` (component)** — the U-curve: total `L(H)+L(D|H)` vs
   model complexity k, its two components as thin lines, minimum marked "the
   MDL choice". Static twin of the TwoPartCode demo. One idea: the sum turns
   over.
4. **single `<Figure>` (component)** — the message diagram: a literal two-part
   bitstream `[ model bits | data-given-model bits ]` for two candidate
   models of the same data, total lengths compared. One idea: model selection
   = shortest total message. Inspiration: two-part-code definition, Grünwald
   §1.3 box.
5. **single `<Figure>` (component)** — the precision argument: a parameter
   axis with coarse vs fine grids; finer grid costs `log2` (grid size) bits
   while the fit gain flattens below spacing `1/√n`; annotate the resulting
   `(k/2) log2 n`. One idea: encode parameters only as finely as the data can
   see. Inspiration: Grünwald §2.4.2.
6. **single `<Figure>` (component)** — adjusted compression rate vs model size
   for two dataset sizes: two U-curves whose minima sit at different model
   sizes; raw (unadjusted) rate shown falling monotonically for contrast.
   One idea: charging the model its bits moves the optimum with the dataset.
   Inspiration: Delétang fig. 2 (recreate schematically, no copied data
   points).
