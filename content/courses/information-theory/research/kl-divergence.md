# Research brief: kl-divergence (KL divergence)

status: drafted (kept slug — revise, do not rewrite)
module: information-in-ml
type: core
goal: Compute the KL divergence between two distributions as expected extra bits.
est_minutes: 32

## ARC

- **Inherits:** the decomposition `L = H(p) + (mismatch)` proved in
  `source-coding-theorem-lite`, where the mismatch term was left unnamed.
- **Spine step:** "Because a code is a bet on a distribution, betting wrong costs
  exactly a divergence — which makes cross-entropy loss a compressed file size
  and a trained language model a measurable compressor." (step 7, *The price of
  a wrong model*, 1951–2024)
- **Contributes:** `D(p||q)` with an operational definition — expected extra
  bits — rather than an axiomatic one. Every later objective in the course is
  built from it.
- **Hands off to:** `cross-entropy-loss` immediately, and to `max-entropy-principle`
  (whose optimality proof is a one-line divergence argument),
  `rate-distortion`, `information-bottleneck` and `infonce`.

## Sources to consult

- Cover & Thomas, **§2.3** (definition), **§2.6 Theorem 2.6.3** (the information
  inequality `D ≥ 0` via Jensen, with the equality condition), **§5.4.3** (the
  wrong-code theorem: coding `p` with `q`'s code costs `H(p) + D(p||q)`), and
  **§2.7** (the log-sum inequality and joint convexity of `D`).
- MacKay, **ch. 2 §2.6** — Gibbs' inequality, described there as "probably the
  most important inequality in this book".
- Polyanskiy & Wu, **§1.2** — the definition on general alphabets, Pinsker's
  inequality relating `D` to total variation, and the fair-coin-versus-
  always-heads example showing the asymmetry concretely (`D(Q||P) = 1` bit,
  `D(P||Q) = ∞`).
- Olah, "Visual Information Theory" — the four-scenario cross-entropy grid, for
  figure inspiration only.

## Key points the lesson must cover

1. **Recover the setting.** A prefix code built for `q` assigns
   `l(x) = -log2 q(x)`. Data arrives distributed as `p`. Expected length is
   `Σ p(x) log2(1/q(x))`, which exceeds `H(p)` by exactly
   `D(p||q) = Σ p(x) log2(p(x)/q(x))`. Compute it on a concrete pair before
   naming it.
2. `D(p||q) ≥ 0` with equality iff `p = q`. Prove via Jensen; state the equality
   condition precisely (strict concavity of log).
3. **Asymmetry, with a reason.** `D(p||q) ≠ D(q||p)` because it matters which
   distribution generates the data and which one you built the code for. The
   fair-coin/always-heads pair makes it visceral: observing a tail refutes
   "always heads" instantly (`D(P||Q) = ∞`), while no finite observation refutes
   "fair coin".
4. **Infinite divergence is a real failure mode.** If `q(x) = 0` where
   `p(x) > 0`, the code has no codeword for a symbol that occurs. In a
   classifier this is a model that assigns probability zero to the true label;
   the loss is unbounded and the gradient is undefined. Work it.
5. **Not a distance.** No symmetry, no triangle inequality. State what *is*
   true: Pinsker's inequality bounds total variation by `sqrt(D/2 ln 2)`, so
   small divergence does imply the distributions are close in a usable sense.
6. **The identity that carries the course**: `I(X;Y) = D(p(x,y) || p(x)p(y))`.
   Re-derive it here now that `D` has a name (it was stated in
   `mutual-information`), because the bottleneck and InfoNCE both use this form.

## Pitfalls / subtleties to flag

- `D` is measured in bits here; ML papers usually use nats. State the convention
  and the 1.443 factor once.
- `0 log(0/q) = 0` by convention; `p log(p/0) = ∞` is not a convention but the
  actual value.
- The "extra bits" reading needs `q` to be a genuine distribution. A code with
  Kraft slack corresponds to a sub-probability `q` and costs *more* than
  `H(p) + D(p||q)`; the slack term is the third piece of the decomposition and
  should be acknowledged.
- `D(p||q)` small does not mean the two distributions agree everywhere — it
  means they agree where `p` puts mass.

## FIGURE PLAN

1. `draw:` **extra-bits-1..3.svg** (exist, `<FigureSequence>`) — the mismatched
   code: true `p`, the code built for `q`, and the per-symbol excess accumulating
   into `D(p||q)`.
2. `draw:` **NEW, single `<Figure>`** — the decomposition bar: total expected
   length split into `H(p)` and `D(p||q)`, with the second labelled "avoidable".
   One idea: only one of the two terms is the model's fault.
3. `draw:` **NEW, single `<Figure>`** — the asymmetry, worked: two panels, `p`
   fair and `q` always-heads, showing `D(Q||P) = 1` bit and `D(P||Q) = ∞`, with
   the offending term circled. One idea: which one is real decides the answer.
4. `draw:` **NEW, single `<Figure>`** — the zero-probability disaster: a
   four-symbol `p` with a `q` that puts zero on the rarest, and the code table
   with a missing entry marked in warning colour. One idea: an impossible symbol
   that occurs costs everything.
5. `draw:` **NEW, single `<Figure>`** — `I(X;Y)` as a divergence: the joint table
   beside the product-of-marginals table, `D` computed cell by cell. Reuses the
   figure idea from `mutual-information` with `D` now named — an intentional
   spiral revisit.
6. `draw:` **NEW, single `<Figure>`** — Pinsker: `D` on one axis, total variation
   on the other, the forbidden region above `sqrt(D/2 ln 2)` shaded, two example
   distribution pairs plotted. One idea: `D` is not a distance but it controls
   one.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Compute `D(p||q)` and `D(q||p)` for two supplied four-symbol
   distributions and report both, in bits.
2. **Boundary probe.** Let `q` place `ε` on a symbol where `p` places 0.25.
   Compute `D(p||q)` as a function of `ε` and evaluate at `ε = 0.1, 0.01,
   0.001, 0`. State the limit and what it means for a trained model.
3. **Claim to refute.** "KL divergence measures how different two distributions
   are, so if `D(p||q)` is small then `D(q||p)` is small too." Give a pair where
   one is under 0.1 bits and the other exceeds 3, and name the structural
   feature that produces the gap.
4. **Derivation the lesson skipped.** Prove `D(p||q) ≥ 0` using the log-sum
   inequality instead of Jensen, and state the equality condition each proof
   delivers.
5. **Derivation, second direction.** Show that `D` is convex in the pair
   `(p,q)`, and use that to prove that mixing a model toward the truth never
   increases the divergence by more than the mixing weight.
6. **Mixed review (E3).** Given a source `p` and two candidate codes with
   supplied length tables, decide without building anything which code is better
   and by how many bits per symbol, then verify by direct computation.
7. **FORWARD (E7).** A classifier outputs `q` for an example whose true label
   distribution is a point mass on class `k`. Write `D(p||q)` for this case and
   simplify. Report what it reduces to, and note that `H(p) = 0` here. Reaches
   `cross-entropy-loss` — the solution names the decomposition and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph tying back explicitly to the unnamed mismatch term in
  `source-coding-theorem-lite` — that is the seam and the current draft does not
  use it.
- Figures 2, 3, 4, 5, 6. Only the three-frame sequence exists today.
- The `I(X;Y) = D(p_xy || p_x p_y)` identity re-derived here (spiral revisit).
- Pinsker as one paragraph plus figure 6 — it is the answer to "then what is `D`
  good for if it is not a distance", which readers ask.
- Depth toward 32 minutes.

**Lose**
- Any use of the word "distance" for `D` without immediate correction.
- Callouts restating `D ≥ 0` after proving it (L15).
