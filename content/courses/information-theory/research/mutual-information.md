# Research brief: mutual-information (Mutual information)

status: planned
module: shared-information
type: core
goal: Compute the mutual information between two variables as the drop in uncertainty.

## Sources to consult

- Cover & Thomas, **§2.3 "Relative Entropy and Mutual Information"** (definition
  `I(X;Y) = Σ p(x,y) log[ p(x,y) / (p(x)p(y)) ] = D( p(x,y) || p(x)p(y) )`) and
  **§2.4 "Relationship Between Entropy and Mutual Information"** (Theorem 2.4.1:
  `I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X,Y)`, and
  `I(X;X) = H(X)`, self-information). Non-negativity `I ≥ 0` from §2.6 (Jensen /
  information inequality).
- MacKay, **ch. 8, §8.2 "Mutual information"** — the same identities and the area
  diagram; MacKay is good on the "information conveyed about X by Y" reading.
  Locate §8.2.

## Key points the lesson must cover

1. **Definition as a drop in uncertainty**: `I(X;Y) = H(X) - H(X|Y)` — the bits
   of uncertainty about X removed, on average, by observing Y. Compute directly
   from the conditional entropies of the previous lesson.
2. **Symmetry**: `I(X;Y) = I(Y;X) = H(Y) - H(Y|X)` — Y tells you as much about X
   as X does about Y. Non-obvious; show via the joint-entropy identity
   `I = H(X) + H(Y) - H(X,Y)`.
3. **Divergence form**: `I(X;Y) = D( p(x,y) || p(x)p(y) )` — mutual information is
   the KL divergence between the true joint and the independent product; this is
   why `I ≥ 0`, and why `I = 0` **exactly** iff X and Y are independent
   (forward-ref `kl-divergence` for `D ≥ 0`).
4. **`I(X;X) = H(X)`**: a variable shares its full entropy with itself — hence
   entropy is "self-information".
5. **Correlation misses dependence, mutual information does not**: an example of
   a dependent pair with zero linear correlation (e.g. `Y = X^2` on a symmetric X,
   or a rotated joint) where `corr = 0` but `I > 0`.
6. Worked on a 2x2 joint morphing from independent to lockstep (the
   MutualInfoDial demo), splitting `H(X)` into `H(X|Y) + I(X;Y)` live.

## Pitfalls / subtleties to flag

- `I(X;Y) ≤ min(H(X), H(Y))` — you cannot learn more about X than X's total
  uncertainty. State the bound; equality iff one variable determines the other.
- Mutual information is **not** a distance (the "overlap" in the area diagram is a
  helpful picture but for three or more variables the analogous "interaction
  information" can go negative — flag as beyond scope).
- Zero mutual information means **statistical independence**, a stronger and
  cleaner condition than zero correlation. This is the lesson's headline
  (`<KeyFact>`): "MI is zero only for genuine independence".
- Units are bits (same log base as entropy); MI in nats if natural logs used.
- Do not confuse `I(X;Y)` (a single non-negative number) with pointwise mutual
  information `log[p(x,y)/(p(x)p(y))]`, which can be negative for individual
  pairs. MI is the average of PMI and is ≥ 0.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the area diagram completed from the
   previous lesson: the `H(X)`/`H(Y)` overlap now **labeled** `I(X;Y)`, with the
   three identities (`H(X)-H(X|Y)`, `H(Y)-H(Y|X)`, `H(X)+H(Y)-H(X,Y)`) each shown
   as a way to read the overlap off the picture. One idea: MI is the overlap.
   Inspiration: Cover & Thomas fig. 2.2 (recreate).
2. **single `<Figure>` (component)** — the stacked-bar split: `H(X)` bar divided
   into `H(X|Y)` (leftover) and `I(X;Y)` (removed by Y). One idea: observing Y
   carves I bits out of H(X). Binds the MutualInfoDial demo.
3. **`<FigureSequence>` (4 frames)** — the dependence dial: joint distribution
   morphing independent -> noisy -> coupled -> lockstep, with the `I(X;Y)` bar
   growing from 0 to `H(X)` each frame while `H(X|Y)` shrinks to 0. One delta per
   frame. Inspiration: the demo's dependence slider.
4. **single `<Figure>` (component)** — MI as divergence-from-independence: the
   true joint grid beside the product `p(x)p(y)` grid, cell-by-cell differences
   shaded, labeled `I = D(joint || product)`. One idea: MI measures how far from
   independent. Inspiration: Cover & Thomas §2.3.
5. **single `<Figure>` (component)** — correlation blind spot: a scatter/joint of
   a dependent pair with `corr ≈ 0` but visibly structured, tallying `corr = 0`
   yet `I > 0`. One idea: correlation is a linear shadow; MI sees the whole
   dependence. Warning-color the "corr = 0" to mark the trap.
