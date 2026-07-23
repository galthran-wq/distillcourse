# Research brief: joint-and-conditional-entropy (Joint and conditional entropy)

status: planned
module: shared-information
type: core
goal: Compute conditional entropy from a joint distribution table.

## Sources to consult

- Cover & Thomas, **§2.2 "Joint Entropy and Conditional Entropy"** — definitions
  `H(X,Y) = -Σ p(x,y) log p(x,y)`, `H(Y|X) = Σ p(x) H(Y|X=x) = -Σ p(x,y) log
  p(y|x)`, and the **chain rule Theorem 2.2.1** `H(X,Y) = H(X) + H(Y|X)`. Also
  `H(Y|X) ≤ H(Y)` (conditioning reduces entropy) — their Theorem 2.6.5.
- MacKay, **ch. 8 "Dependent Random Variables", §8.1** — joint ensembles,
  marginal / conditional entropy, the chain rule, and MacKay's diagram relating
  `H(X)`, `H(Y)`, `H(X,Y)`, `H(X|Y)`, `H(Y|X)` (the additive area diagram,
  MacKay fig. 8.1). Locate §8.1 precisely.

## Key points the lesson must cover

1. A **joint distribution table** assigns one probability to each pair `(x,y)`;
   the row/column sums are the marginals `p(x)`, `p(y)`.
2. **Joint entropy** `H(X,Y)`: the uncertainty in the pair, from the flattened
   joint distribution — same entropy formula, over pairs.
3. **Conditional entropy** `H(Y|X)`: the *average* over `x` of the entropy of the
   conditional distribution `p(y|x)`. Compute it two ways and show they agree:
   `Σ_x p(x) H(Y|X=x)` and `-Σ_{x,y} p(x,y) log p(y|x)`.
4. **Chain rule** `H(X,Y) = H(X) + H(Y|X) = H(Y) + H(X|Y)`: total uncertainty
   splits into "learn X, then learn Y given X". Worked on a 2x2 (sky x rain)
   table matching the JointEntropyGrid demo.
5. **Conditioning reduces entropy on average**: `H(Y|X) ≤ H(Y)`, with equality
   iff X and Y are independent. But *pointwise* `H(Y|X=x)` can exceed `H(Y)` for
   a particular x — a specific observation can increase surprise.
6. Sets up mutual information as the drop `H(Y) - H(Y|X)`.

## Pitfalls / subtleties to flag

- **`H(Y|X)` is an average**, not `H(Y|X=x)` for some fixed x. The most common
  error is confusing the averaged quantity with a single-conditional entropy.
  The `≤ H(Y)` bound holds for the *average* only.
- **Asymmetry of conditioning**: `H(Y|X) ≠ H(X|Y)` in general (they differ by
  `H(Y) - H(X)`); only the joint `H(X,Y)` is symmetric.
- Independence gives `H(X,Y) = H(X) + H(Y)` and `H(Y|X) = H(Y)` — a checkable
  special case; use the demo's "independent" preset.
- Zero cells in the joint table contribute nothing (`0 log 0 = 0`), and
  conditionals `p(y|x)` are undefined where `p(x)=0` — skip those x (they carry
  weight 0 anyway).
- Deterministic dependence (`Y = f(X)`) gives `H(Y|X) = 0` but `H(X|Y)` need not
  be 0 — a good demo "perfectly linked" preset to probe.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the joint table as a 2x2 grid of masses
   with marginals written along the margins; one cell highlighted with its
   `p(x,y) log 1/p(x,y)` contribution. One idea: the joint table is the object.
   Inspiration: MacKay's joint-ensemble grid (ch. 8).
2. **`<FigureSequence>` (3 frames)** — computing `H(Y|X)` as an average: frame 1
   the two conditional rows `p(y|X=sun)`, `p(y|X=rain)` with their separate
   entropies; frame 2 weights each by `p(x)`; frame 3 sums to `H(Y|X)`. One delta
   per frame. Inspiration: the two-way definition of conditional entropy.
3. **single `<Figure>` (component)** — the chain rule as a bar decomposition:
   `H(X,Y)` bar split into `H(X)` + `H(Y|X)`, and the *same* total split the
   other way into `H(Y)` + `H(X|Y)`. One idea: same whole, two orders.
   Inspiration: Cover & Thomas Theorem 2.2.1.
4. **single `<Figure>` (component)** — the additive area diagram: two overlapping
   regions for `H(X)` and `H(Y)`, labeling the union `H(X,Y)`, the crescents
   `H(X|Y)`, `H(Y|X)`, and the overlap (foreshadowing `I(X;Y)`, unlabeled here).
   One idea: uncertainties tile an area. Inspiration: MacKay fig. 8.1 /
   Cover & Thomas fig. 2.2 (recreate, do not copy).
5. **`<FigureSequence>` (3 frames)** — conditioning reduces entropy: independent
   table (`H(Y|X) = H(Y)`), mildly linked (`H(Y|X) < H(Y)`), deterministic
   (`H(Y|X) = 0`), the `H(Y|X)` bar shrinking each frame. One idea: information
   about X eats uncertainty in Y. Binds the JointEntropyGrid demo.
