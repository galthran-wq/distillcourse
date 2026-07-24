# Research brief: infonce (The InfoNCE bound)

status: planned
module: applications
type: core
goal: Derive the InfoNCE lower bound on mutual information from a contrastive classification loss.

## Sources to consult

- **van den Oord, Li & Vinyals 2018, "Representation Learning with
  Contrastive Predictive Coding"** (arXiv:1807.03748) — the primary source.
  - **§2.1** — why not model p(y|x) generatively: mutual information
    `I(x;c) = Σ p(x,c) log [p(x|c)/p(x)]` as the objective; reconstruction
    losses waste capacity on irrelevant detail.
  - **§2.3 "InfoNCE Loss and Mutual Information Estimation"** — the loss
    `L_N = -E[ log f(x_pos,c) / Σ_j f(x_j,c) ]` (categorical cross-entropy
    over 1 positive + N-1 negatives); proof that the optimal `f` is
    proportional to the density ratio `p(x|c)/p(x)`.
  - **Appendix A.1 (eqs. 6-11)** — the full derivation of
    `I(x;c) ≥ log N - L_N`; also the MINE remark (alternative estimator,
    stability comparison) for one sentence of context.
  - **§3** — cross-modal experiments (audio, vision, text, RL): cite
    precisely for the applications paragraph (LibriSpeech phone accuracy
    64.6 vs 39.7 MFCC baseline; ImageNet linear-probe top-1 48.7).
- Cover & Thomas, **§2.3** — mutual information as the expected log
  density-ratio `E[log p(x,y)/(p(x)p(y))]`: the identity the derivation
  turns on; reuse from the mutual-information lesson.
- Tishby et al. 1999 — one-sentence link back: IB says maximize I(T;Y); the
  practical question this lesson answers is how to estimate/optimize such an
  I from samples.

## Key points the lesson must cover

1. **The estimation problem** (the flaw motivating the mechanism): the
   course computed I(X;Y) from small joint tables; for images/audio/text the
   joint is unavailable and counting fails. Needed: a quantity computable
   from *samples* of pairs that certifies mutual information.
2. **The contrastive setup**: draw one true pair (x, y_pos) and N-1
   "negatives" y_j from the marginal p(y); train a scoring function
   f(x, y) and classify which candidate is the positive via softmax over
   scores. The loss L_N is an N-way cross-entropy — reuse cross-entropy-loss
   machinery directly.
3. **The optimal classifier recovers a density ratio**: the posterior that
   candidate i is the positive is
   `p(y_i|x) Π_{j≠i} p(y_j) / Σ_k [p(y_k|x) Π_{j≠k} p(y_j)]`, which
   simplifies to `[p(y_i|x)/p(y_i)] / Σ_k [p(y_k|x)/p(y_k)]` — so the loss
   is minimized when `f(x,y) ∝ p(y|x)/p(y)`. Full algebra shown; note the
   ratio is learned without ever modeling p(y|x) or p(y) separately.
4. **The bound**: substituting the optimal f gives
   `L_N ≥ log2 N - I(X;Y)` hence `I(X;Y) ≥ log2 N - L_N` (Appendix A.1
   route: the expectation over negatives concentrates the denominator around
   `1 + (N-1)·E[ratio] `-style terms; present the derivation at the paper's
   level of rigor and flag the approximation step explicitly).
5. **Worked toy example, exact numbers**: a small discrete pair (e.g. 4×4
   joint from the mutual-information lesson) where p(y|x)/p(y) is computable
   by hand; evaluate L_N with the optimal critic for N = 2 and N = 4 and
   compare `log2 N - L_N` to the true I(X;Y). Shows both the bound holding
   and its looseness.
6. **Saturation**: the bound never exceeds log2 N — with I(X;Y) > log2 N even
   a perfect critic saturates (the classification task becomes too easy to
   certify more bits). More negatives raise the ceiling; this is why
   contrastive methods use large batches.
7. **The applications payoff** (one section, precise): the same loss trains
   representations across audio/vision/text/RL (CPC), and the density-ratio
   trick is the common core of modern contrastive representation learning;
   link back to IB — InfoNCE is a trainable surrogate for the I(T;Y) term.

## Pitfalls / subtleties to flag

- **It is a lower bound**: low loss certifies high MI; high loss certifies
  nothing (the critic may just be bad). Direction matters — state it as a
  one-way certificate.
- **Negatives must come from the marginal p(y)**, not an arbitrary noise
  distribution — otherwise the recovered ratio is against the wrong
  reference. (Contrast with generic NCE in one sentence.)
- **Bits vs nats**: the paper works in nats (`log N`); the course states the
  bound in bits (`log2 N`). Convert consistently; ML implementations report
  nats.
- The optimal critic is independent of N, but the *bound's tightness* is not:
  it degrades when true MI approaches or exceeds log N — the toy example
  must exhibit this.
- `log2 N - L_N` is an estimate derived from a bound, and finite-sample
  estimates are biased; do not present it as an unbiased MI estimator.
- Do not derive the full CPC architecture (encoder + autoregressive context);
  a one-figure sketch suffices — the lesson's object is the bound, not the
  network.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the contrastive setup: a context x on
   the left, N candidate y's on the right (one highlighted as the true
   partner, the rest marked "drawn from p(y)"), the scorer f(x,y) fanning
   over candidates into a softmax. One idea: MI estimation as an N-way quiz.
   Inspiration: CPC §2.2-2.3 setup (recreate schematically).
2. **`<FigureSequence>` (4 frames)** — the derivation: frame 1 the N-way
   posterior over "which candidate is real"; frame 2 products of marginals
   cancel, leaving density ratios; frame 3 optimal `f ∝ p(y|x)/p(y)`
   boxed; frame 4 substitution yields `I ≥ log2 N - L_N`. Delta = one
   algebraic move per frame. Inspiration: Appendix A.1 (eqs. 6-11).
3. **single `<Figure>` (component)** — the bound dissected:
   `I(X;Y) ≥ log2 N - L_N` with labels-above-symbols — "budget: bits to name
   1 of N", "what the classifier pays", "what is left is certified
   information". One idea: certified bits = budget minus loss.
4. **single `<Figure>` (component)** — worked toy tally: the 4×4 joint, its
   ratio table p(y|x)/p(y), and computed rows for N=2 and N=4: L_N, bound,
   true I. One idea: the bound holds and tightens with N. Real numbers
   plugged in (playbook rule 4).
5. **single `<Figure>` (component)** — saturation: bound value vs true MI
   for N = 2, 16, 256 as three curves clipping at 1, 4, 8 bits. Static twin
   of the InfoNCESaturation demo. One idea: you cannot certify more than
   log2 N bits.
6. **single `<Figure>` (component)** — the CPC pipeline in one strip:
   waveform/patches → encoder z_t → context c_t → score future z_{t+k}
   against negatives; the InfoNCE box highlighted as "the only loss". One
   idea: where the bound sits in a real system. Inspiration: CPC fig. 1
   (recreate, simplify, never copy).
