# Research brief: max-entropy-principle (The maximum entropy principle)

status: drafted (kept slug — revise, do not rewrite)
module: principles
type: core
goal: Derive the maximum-entropy distribution under expectation constraints.
est_minutes: 36

## ARC

- **Inherits:** entropy and its maximum at the uniform distribution
  (`entropy-as-average-surprise`), and `D(p||q) ≥ 0` (`kl-divergence`).
- **Spine step:** "Run the machinery backwards and entropy becomes an objective:
  among distributions consistent with what is known, the entropy-maximizing one
  assumes nothing further, and in physics that choice carries a measurable
  energy price." (step 9, *Entropy as a choice rule*, 1929–1961)
- **Contributes:** the first lesson where entropy is *maximised* rather than
  measured. This inversion is the module's organising move and should be stated
  as such.
- **Hands off to:** `thermodynamics-of-information` (the physics face) and,
  by structural analogy, to every later objective in the module.

## Sources to consult

- **Jaynes 1957** (primary) — §2 derives the exponential/partition-function form
  under expectation constraints; §3 recovers the Boltzmann distribution and
  equilibrium statistical mechanics as inference; §6 insists max-ent is a method
  of reasoning, not a law of physics. That last point is the lesson's ethical
  centre and must survive.
- Cover & Thomas, **ch. 12**: §12.1 Theorem 12.1.1 (the exponential form);
  §12.2 the worked examples — the gas at fixed temperature, **Boltzmann's dice**
  (given `n` dice summing to `nα`, the max-entropy face distribution is both the
  most probable macrostate and carries almost all the probability), and the
  exponential atmosphere (max-ent under a mean-height constraint gives an
  exponential density, and the real atmosphere has one).
- MacKay, **ch. 22 §22.5** — maximum-entropy fitting; **ch. 23** for the
  distribution catalogue showing which constraint yields which family.
- Weissman / Polyanskiy for the Gibbs-inequality proof structure.

## Key points the lesson must cover

1. **The setup.** Constraints of the form `E[f_r(X)] = F_r` leave a convex set
   of candidate distributions. Something must choose one. Open with the concrete
   case: a six-sided die known only to have mean 4.5 (Jaynes' Brandeis
   problem) — write down three distributions consistent with it and ask which to
   use.
2. **The answer** `p(x) ∝ exp(-Σ_r λ_r f_r(x))`, normalised by the partition
   function `Z(λ)`, with the `λ_r` fixed by the constraints.
3. **The proof by Gibbs' inequality**, not variational calculus: let `q` be any
   distribution satisfying the constraints and `p` the exponential candidate.
   Then `0 ≤ D(q||p) = -H(q) - Σ q log p = -H(q) + H(p)` because
   `Σ q log p = Σ p log p` when the constraints match. Three lines, no
   Lagrange multipliers, and it delivers uniqueness for free. This is the
   lesson's best moment.
4. **Worked instances**, each computed: no constraint → uniform; mean
   constraint on a finite set → geometric-like exponential tilt (do the die at
   mean 4.5 numerically, reporting `λ`); mean and variance on the reals →
   Gaussian; mean on the positive reals → exponential; the atmosphere, where the
   prediction is physically checkable.
5. **The identification.** `p(x) ∝ exp(-E(x)/kT)` is the Boltzmann distribution
   and `p(x) ∝ exp(z_x)` is the softmax layer. They are the same solution with
   different names for the constrained quantity. Say this and stop; do not
   over-claim that softmax was derived this way historically.
6. **What the principle is and is not.** It is a rule for choosing a
   distribution given constraints, and its justification is that any other
   choice smuggles in information you do not have. It is not a claim about
   physical reality, and Jaynes says so explicitly.

## Pitfalls / subtleties to flag

- Max-ent depends on the choice of the base measure. Over a finite set the
  uniform is the obvious default; over a continuum "maximum entropy" is
  parameterisation-dependent and the honest statement is minimum divergence from
  a stated reference. Flag this at the moment continuous examples appear.
- The constraints must be consistent and the feasible set non-empty; a mean of
  7 on a six-sided die has no solution.
- The Lagrange multipliers are not free parameters; each is fixed by its
  constraint, and solving for them is generally numerical.
- Max-ent is not a physical law and gives no guarantee that nature obeys it.
  The atmosphere example is a confirmation, not a proof.

## FIGURE PLAN

1. `draw:` **brandeis-1..4.svg** (exist, `<FigureSequence>`) — the die at mean
   4.5: candidate distributions consistent with the constraint, then the
   max-entropy one, with `λ` and `H` tallied.
2. `draw:` **gibbs-1..3.svg** (exist, `<FigureSequence>`) — the three-line
   proof.
3. `draw:` **NEW, single `<Figure>`** — the feasible set as a region: the
   probability simplex for three outcomes with the constraint drawn as a line
   across it, candidate points marked, and the entropy contours showing which
   point on the line is highest. One idea: the constraint is a slice and entropy
   picks a point on it. Inspiration: the probability-simplex motif that recurs
   through Cover & Thomas ch. 11.
4. `draw:` **NEW, single `<Figure>`** — the constraint-to-family table as a
   figure: no constraint → uniform; mean → exponential; mean and variance →
   Gaussian; mean of log → power law. Each row with a small sketch of the
   density. One idea: the constraint chooses the family.
5. `draw:` **NEW, single `<Figure>`** — Boltzmann and softmax side by side: the
   same exponential form with `E(x)/kT` on one side and logits on the other,
   colour-bound term by term. One idea: identical algebra, two vocabularies.
6. `draw:` **NEW, single `<Figure>`** — the atmosphere: predicted exponential
   density against altitude with real measured density overlaid. One idea: the
   principle makes a checkable prediction. (Data source must be stated; if no
   clean public series is at hand, draw the prediction alone and say so.)

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Find the max-entropy distribution on `{1,…,6}` with mean 3.5 and
   with mean 2.0; report `λ` and `H` in each case.
2. **Boundary probe.** What happens as the constrained mean approaches 6? Report
   the limiting distribution and the limiting entropy, and identify which term of
   the exponential form is running away.
3. **Claim to refute.** "The maximum-entropy distribution is the most likely
   one." Distinguish the two claims, then give the sense in which Boltzmann's
   dice make the statement *nearly* true (most probable macrostate, carrying
   almost all the probability) and the sense in which it remains false.
4. **Derivation the lesson skipped.** Derive the Gaussian as the max-entropy
   density on the reals under a variance constraint, using the Gibbs-inequality
   argument rather than variational calculus. Then state what changes if the
   support is `[0, ∞)`.
5. **Derivation, second direction.** Show that the partition function generates
   the constrained moments: `-∂ log Z / ∂λ_r = E[f_r]`. Verify numerically on
   the die example.
6. **Research-shaped.** Fit a max-entropy model to a real dataset with two
   constraints you choose (say, mean and mean-of-squares of a measured
   quantity), report the fitted `λ`s, and compare the fitted density against a
   histogram. State what discrepancy would tell you a constraint is missing.
7. **FORWARD (E7).** A physical system has states with energies `E(x)` and a
   fixed average energy. Write the max-entropy distribution, identify `1/kT` as
   the multiplier, then compute the change in entropy when a two-state system is
   forced into a single known state. Convert the answer into joules at room
   temperature. Reaches `thermodynamics-of-information` — the solution names
   Landauer's bound and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph stating the inversion explicitly: for eight lessons entropy was
  measured; from here it is maximised. The current draft does not mark the turn.
- Figures 3, 4, 5, 6 above.
- The base-measure caveat at the point continuous examples enter — currently
  absent and it is the single most common error in applying max-ent.
- The atmosphere example and Boltzmann's dice as worked instances (Cover &
  Thomas §12.2), both currently missing.
- Jaynes' own "method of reasoning, not a law of physics" position, stated in
  the closing.
- Depth toward 36 minutes.

**Lose**
- Any suggestion that softmax was historically derived from max-ent.
- Callouts restating the exponential form after deriving it (L15).
