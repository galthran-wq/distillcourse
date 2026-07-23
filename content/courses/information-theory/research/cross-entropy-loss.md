# Research brief: cross-entropy-loss (Cross-entropy)

status: planned
module: information-in-ml
type: core
goal: >
  Explain why minimizing cross-entropy loss drives a model's predictions toward
  the true label distribution.

## Sources to consult

- Cover & Thomas, **§5.4 "Bounds on the Optimal Codelength"** — the identity
  `Σ p(x)(-log q(x)) = H(p) + D(p||q)`, i.e. cross-entropy = entropy + KL. This
  is the mathematical core; no separate "cross-entropy" section exists in Cover &
  Thomas, so §5.4 is the anchor. Reuse `D ≥ 0` from §2.6.
- MacKay, **ch. 2 / ch. 6** — the log-loss / predictive-coding reading; MacKay
  frames prediction cost as bits, which is the bridge to the loss.
- Deletang et al. 2023, "Language Modeling Is Compression", §2 (background) — the
  explicit statement that a model's expected `-log q` on data = its coding cost,
  used to frame log-loss training as compression. For the ML framing only.

## Key points the lesson must cover

1. **Log-loss on one example = model's surprisal at the truth**: for observed
   outcome `x`, the loss `-log2 q(x)` is exactly how surprised the model is that
   `x` happened (reuse surprisal from `what-is-surprise`). A confident-correct
   prediction costs ~0; a confident-wrong one costs a lot.
2. **Cross-entropy** `H(p,q) = -Σ p(x) log2 q(x)` = expected bits to code
   `p`-data with `q`'s code = average log-loss over the true distribution.
3. **The decomposition** `H(p,q) = H(p) + D(p||q)` — the lesson's headline
   identity. `H(p)` is the irreducible data entropy; `D(p||q) ≥ 0` is the
   model's excess.
4. **Why minimizing cross-entropy minimizes KL**: `H(p)` does not depend on the
   model `q`, so `argmin_q H(p,q) = argmin_q D(p||q)`, achieved at `q = p`.
   Training on cross-entropy is training on model-data divergence.
5. **The classification case**: labels are one-hot, so `p` is a point mass and
   `H(p,q) = -log2 q(true class)` — plain negative log-likelihood; `H(p) = 0`, so
   cross-entropy *equals* the KL there.
6. **The confident-wrong blowup** (worked example): `q(true)` small drives
   `-log q` large; the same reason a rare event carries large surprisal. Motivates
   why overconfidence is punished.

## Pitfalls / subtleties to flag

- **Cross-entropy is not symmetric**: `H(p,q) ≠ H(q,p)`; the loss uses
  `H(data, model)`. Keep the direction consistent with `kl-divergence`.
- The **`H(p)` term is out of the model's hands** but is *not* zero in general
  (only for one-hot labels). With soft/noisy labels the achievable loss floor is
  `H(p) > 0`; a loss above zero is not necessarily a bad model. State this — a
  common misreading of the loss value.
- Minimizing cross-entropy = maximizing likelihood: `-Σ log q(x_i)` over data is
  the empirical cross-entropy; make the equivalence explicit for the ML audience.
- Softmax + cross-entropy: the gradient is the clean `q - p` (prediction minus
  target); worth a one-line remark but the derivation is beyond scope.
- Do not conflate cross-entropy (a loss/coding cost, ≥ H(p)) with entropy (a
  property of one distribution).

## FIGURE PLAN

1. **single `<Figure>` (component)** — the decomposition dissected:
   `H(p,q) = H(p) + D(p||q)` as a stacked bar, `H(p)` (irreducible floor, one
   color) plus `D(p||q)` (model's excess, accent), with labels-above-symbols
   arrows onto each term. One idea: cross-entropy = floor + mismatch. This is the
   lesson's centerpiece figure (course.yaml notes a figure carries the identity).
   Inspiration: Cover & Thomas §5.4.
2. **`<FigureSequence>` (4 frames)** — training drives `q -> p`: a model
   distribution `q` starting far from the true `p`, each frame a step closer, the
   `D(p||q)` bar (and the cross-entropy) shrinking toward the fixed `H(p)` floor.
   One delta per frame. Inspiration: gradient descent on log-loss.
3. **single `<Figure>` (component)** — one-hot collapse: a general `p` beside a
   one-hot label; on the one-hot, `H(p)=0` so `H(p,q) = D(p||q) = -log2 q(true)`.
   Two-panel comparison, the changed piece highlighted. One idea: for hard labels,
   cross-entropy *is* the negative log-likelihood.
4. **single `<Figure>` (component)** — the confident-wrong blowup: the `-log2 q`
   curve with a dot sliding toward `q(true) -> 0`, the loss shooting up; annotate
   "confident and wrong = large surprisal = large loss". Reuses the surprisal
   curve from lesson 1. One idea: overconfidence is punished by the log.
5. **single `<Figure>` (component)** — log-loss = surprisal, side by side: the
   surprisal definition `-log2 p` from lesson 1 next to the single-example loss
   `-log2 q(true)`, same curve, labels swapped. One idea: the loss is surprisal
   under the model. Binds the module back to the foundations.
