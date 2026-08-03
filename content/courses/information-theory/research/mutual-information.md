# Research brief: mutual-information (Mutual information)

status: drafted (kept slug — revise, do not rewrite)
module: shared-information
type: core
goal: Compute the mutual information between two variables as the drop in uncertainty.
est_minutes: 32

## ARC

- **Inherits:** `H(Y|X)`, the chain rule, and the fact that conditioning reduces
  entropy on average (`joint-and-conditional-entropy`, module 1).
- **Spine step:** "Mutual information measures shared uncertainty; processing
  can only destroy it, leftover conditional entropy forces a minimum error rate,
  and estimating any of it from finite samples is where the theory meets its
  limits." (step 5, *What one variable says about another*, 1948–2019)
- **Contributes:** `I(X;Y)`, the quantity that carries the second half of the
  course — capacity is a maximised `I`, rate-distortion is a minimised `I`, the
  bottleneck is a difference of two, and InfoNCE is a bound on one.
- **Hands off to:** `data-processing-inequality` immediately.

## Sources to consult

- Cover & Thomas, **§2.3-2.4** — `I(X;Y) = D(p(x,y) || p(x)p(y))`, and
  Theorem 2.4.1 giving the four equivalent forms; **§2.6** for non-negativity.
- MacKay, **ch. 8 §8.1** — the definitions, plus **fig. 8.1 against fig. 8.2**:
  the additive rectangle diagram and the explicit warning that a literal Venn
  reading breaks for three variables, with `z = x XOR y` as the instance.
- Weissman (EE376A), **ch. 2 §2.3** — the four equivalent definitions and the
  `I ≤ min(H(X), H(Y))` bound with its equality condition.
- Polyanskiy & Wu, **§2.3, §3.2** — `I` as a divergence to the nearest product
  distribution (the "centre of gravity" characterisation), useful for a starred
  section.

## Key points the lesson must cover

1. `I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X,Y)`. Compute all
   three on the running 2x2 table and confirm they agree; the symmetry is the
   surprise and should be stated as one (the drop in `X`'s uncertainty from
   seeing `Y` equals the drop in `Y`'s from seeing `X`, which nothing about the
   definition made obvious).
2. `I(X;Y) ≥ 0`, with equality exactly under independence — and the reason,
   which is that `I` is a divergence between the joint and the product of the
   marginals. Introduce that identity here even though `kl-divergence` is two
   modules away; it is the cleanest proof of non-negativity and it is the form
   InfoNCE and the bottleneck both use.
3. `I(X;Y) ≤ min(H(X), H(Y))`, with equality when one variable is a
   deterministic function of the other.
4. **Correlation versus dependence.** A joint with zero correlation and positive
   mutual information (e.g. `Y = X^2` on `X ∈ {-1,0,1}`) is the standard
   discriminating example; work it numerically.
5. **The Venn caution.** The two-variable area picture is exact; the
   three-variable extension is not, because the triple "intersection" can be
   negative. Give the XOR instance: `X, Y` independent bits, `Z = X ⊕ Y`; each
   pair is independent, all three together are not.

## Pitfalls / subtleties to flag

- `I(X;Y)` is a property of the joint distribution, not of a sample. Every
  number computed here assumes the table is the truth; the module's application
  lesson is about what happens when it is an estimate.
- `I(X;Y) = 0` means independence, full stop — unlike correlation zero.
- Mutual information is not a metric and does not satisfy a triangle
  inequality; the variation of information `H(X,Y) - I(X;Y)` is the metric, and
  is worth one sentence.
- Units: bits throughout. Papers in ML often report nats; the factor is 1.443.

## FIGURE PLAN

1. `draw:` **dependence-dial-1..4.svg** (exist, `<FigureSequence>`) — a joint
   morphing from independent to perfectly coupled, the stacked `H(X)` bar
   splitting into `H(X|Y)` and `I(X;Y)`.
2. `draw:` **NEW, single `<Figure>`** — the three equivalent formulas evaluated
   on one 2x2 table, side by side, all landing on the same number, with the
   shared terms colour-bound across the three expressions.
3. `draw:` **NEW, single `<Figure>`** — `I` as a divergence: the joint table
   beside the product-of-marginals table, cell-by-cell ratios annotated, and the
   weighted log-ratio sum tallied. One idea: `I` measures how far the joint is
   from pretending independence.
4. `draw:` **NEW, single `<Figure>`** — zero correlation, positive information:
   the `Y = X^2` joint drawn as a scatter with the fitted line flat at zero
   slope, beside the table with `I = 2/3` bit computed. One idea: a line cannot
   see this dependence.
5. `draw:` **NEW, single `<Figure>`** — the Venn caution: the two-variable
   diagram (exact) beside the three-variable one with the central region marked
   "can be negative", instantiated on `Z = X ⊕ Y`. Inspiration: MacKay fig. 8.1
   versus 8.2 — recreate the contrast, not the drawing.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* From a supplied 3x3 joint, compute `H(X)`, `H(Y)`, `H(X,Y)` and
   `I(X;Y)` by two different routes and confirm agreement.
2. **Boundary probe.** Construct a joint over a 4-symbol `X` and binary `Y` with
   `I(X;Y)` as large as possible. Report the value, and state which of the two
   upper bounds (`H(X)` or `H(Y)`) is binding and why.
3. **Claim to refute.** "If `I(X;Y) = 0` and `I(Y;Z) = 0` then `I(X;Z) = 0`."
   Refute with the XOR triple, and say what the failure tells you about treating
   mutual information as a distance.
4. **Derivation the lesson skipped.** Prove `I(X;Y) ≥ 0` from Jensen's
   inequality applied to `-log`, and state the equality condition. Then prove
   `I(X;Y) ≤ H(X)` and characterise equality.
5. **Mixed review (E3).** Given a joint table, compute the correlation
   coefficient and the mutual information. Then modify one cell so that the
   correlation stays fixed and the mutual information changes, and report both
   before and after.
6. **Research-shaped.** Take two columns of a real dataset (one categorical
   target, one binned feature), build the joint table, and compute `I`. Then
   shuffle the target column and recompute. Report both numbers and say what the
   shuffled value should be in theory.
7. **FORWARD (E7).** In exercise 6 the shuffled value came out above zero.
   Repeat with 10, 100 and 1000 samples and plot the shuffled estimate against
   sample size. Reaches `estimating-mutual-information` — the solution names the
   plug-in bias and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph placing this at the head of spine step 5, and naming the three
  later objects that are all built from `I` (capacity, `R(D)`, the bottleneck).
  The current draft treats `I` as a terminal definition.
- Figures 2, 3, 4, 5 above — only the sequence exists today.
- The `I = D(p_xy || p_x p_y)` identity, which the current draft omits and which
  every later lesson in the course needs.
- The symmetry stated as a reversal (nothing in `H(X) - H(X|Y)` predicts it).
- Depth toward 32 minutes.

**Lose**
- Any unqualified use of the Venn picture. The caution is required, not
  optional (MacKay is explicit about this and QA will check it).
- The `<KeyFact>` restating `I = H - H|` immediately after deriving it (L15).
