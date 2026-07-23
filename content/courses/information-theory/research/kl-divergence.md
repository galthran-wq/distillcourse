# Research brief: kl-divergence (KL divergence)

status: planned
module: information-in-ml
type: core
goal: Compute the KL divergence between two distributions as expected extra bits.

## Sources to consult

- Cover & Thomas, **§2.3 "Relative Entropy and Mutual Information"** — definition
  `D(p||q) = Σ p(x) log[ p(x) / q(x) ]`, conventions (`0 log 0/q = 0`,
  `p log p/0 = ∞`), and asymmetry. **§2.6 "Jensen's Inequality and Its
  Consequences"** — the **information inequality** (Theorem 2.6.3): `D(p||q) ≥ 0`,
  equality iff `p = q` (Gibbs' inequality, via Jensen on the convex `-log`).
- Cover & Thomas, **§5.4 "Bounds on the Optimal Codelength"** — the operational
  reading: coding `p` with a code built for `q` costs `H(p) + D(p||q)` bits, so
  `D(p||q)` is exactly the **expected extra bits** (reuse from
  source-coding-theorem-lite).
- MacKay, **ch. 2** — relative entropy is introduced with the entropy material;
  MacKay's Gibbs'-inequality treatment. Locate the exact § (relative entropy
  appears in the ch. 2 exercises / §2.6 region).

## Key points the lesson must cover

1. **Operational definition first** (playbook: example before definition): a code
   optimized for `q` gives symbol `x` length `-log2 q(x)`; using it on data
   distributed as `p` costs `Σ p(x) (-log2 q(x))` on average, which exceeds the
   optimal `H(p)` by exactly `D(p||q)`.
2. **Formula**: `D(p||q) = Σ p(x) log2[ p(x)/q(x) ]`, the expected log-ratio,
   in bits.
3. **Non-negativity** (Gibbs): `D(p||q) ≥ 0`, zero **iff** `p = q`. Proof via
   Jensen on the convex `-log`. This is why "coding with the wrong distribution
   always costs".
4. **Asymmetry**: `D(p||q) ≠ D(q||p)` — it matters which distribution is real
   (the data) and which is the code/model. Worked with a concrete asymmetric
   example computing both directions.
5. **Not a metric**: asymmetric and violates the triangle inequality; it is a
   *divergence*. Still the natural "distance" for coding cost and for ML.
6. **The missing-outcome disaster**: if `q(x) = 0` but `p(x) > 0`, then
   `D(p||q) = ∞` — a model that rules out something the data produces pays
   unbounded cost (matches the KLMismatch demo's "missing-outcome" preset).

## Pitfalls / subtleties to flag

- **Direction convention**: `D(p||q)` with `p` = truth/data, `q` = model/code.
  ML "forward" (`D(p||q)`, mean-seeking) vs. "reverse" (`D(q||p)`, mode-seeking)
  KL differ in behavior; the coding story is always `D(data||model)`. State the
  convention up front and keep it consistent with cross-entropy-loss.
- `D` is finite only when `q` is absolutely continuous w.r.t. `p` in the discrete
  sense (`q(x)=0 => p(x)=0`); otherwise `+∞`.
- Non-negativity is *the* workhorse theorem — it underlies the source coding
  lower bound, `I(X;Y) ≥ 0`, and the cross-entropy story. Give it prominence.
- KL is **not** symmetric even approximately for far-apart distributions; do not
  average the two directions casually (that is a different quantity, JS
  divergence — mention only as beyond scope).
- Units: bits (log2) here; ML libraries usually report nats (natural log).

## FIGURE PLAN

1. **`<FigureSequence>` (3 frames)** — extra bits per symbol: frame 1 the optimal
   `q`-code lengths `-log2 q(x)`; frame 2 overlay the ideal `p`-code lengths
   `-log2 p(x)`; frame 3 shade the per-symbol gaps, weighted by `p(x)`, summing
   to `D(p||q)`. One delta per frame. Inspiration: Cover & Thomas §5.4.
2. **single `<Figure>` (component)** — the two draggable distributions `p` (true)
   and `q` (model) as 4-bar charts with readouts `H(p)`, cross-entropy `H(p,q)`,
   and the gap `D(p||q)`. Static twin of the KLMismatch demo. One idea: the gap
   is the divergence.
3. **single `<Figure>` (component)** — asymmetry, two panels: `D(p||q)` and
   `D(q||p)` computed for the same pair, different values, arrow between them
   crossed out to say "not equal". One idea: direction matters. Inspiration: the
   forward/reverse-KL literature (recreate schematically).
4. **single `<Figure>` (component)** — the missing-outcome blowup: `q` puts zero
   mass on an outcome `p` produces; the term `p log p/0` shooting off to `∞`,
   annotated "a model that says 'impossible' about something real pays forever".
   Warning-color. One idea: zeros in the model are catastrophic. Binds the demo's
   "missing-outcome disaster" preset.
5. **single `<Figure>` (component)** — Gibbs schematic: the convex `-log` curve
   with a Jensen chord, showing `E[-log(q/p)] ≥ -log E[q/p] = 0`. One idea: why
   `D ≥ 0`. Inspiration: Cover & Thomas §2.6 Jensen figure (recreate).
