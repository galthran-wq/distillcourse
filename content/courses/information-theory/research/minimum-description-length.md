# Research brief: minimum-description-length (Minimum description length)

status: drafted (kept slug — revise, do not rewrite)
module: principles
type: core
goal: Apply two-part code lengths to select a model that neither underfits nor overfits.
est_minutes: 36

## ARC

- **Inherits:** the uncomputable ideal (`kolmogorov-complexity`), the
  model/compressor equivalence (`compression-is-prediction`), and the Kraft
  budget (`kraft-inequality`) which is what licenses reading a code length as a
  probability.
- **Spine step:** step 10, *Bits traded for fidelity and for models* — "…and
  charging a model for its own description turns model selection into the same
  compression problem."
- **Contributes:** model selection with no held-out set and no significance
  test, and the resolution of the debt left open by
  `language-models-as-compressors`.
- **Hands off to:** `information-bottleneck` and, thematically, back to the
  whole course: description length is what every objective here has been.

## Sources to consult

- **Grünwald 2004** (primary) — ch. 1 for the crude two-part principle with the
  three-bit-sequences and polynomial examples; §2.2 the Kraft/code-length
  correspondence restated; **§2.4** crude MDL worked on Markov and Bernoulli
  models, giving the `(k/2) log n` parameter cost; §2.6 refined MDL and NML
  (state only); §2.9-2.10 the MDL-versus-BIC correction and the honest failure
  modes; §1.2.1 and §2.9.4 the tie to Kolmogorov complexity.
- MacKay, **ch. 28** — Bayesian model comparison, the Occam factor, and §28.3's
  demonstration that the two-part message length `L(H) + L(D|H)` is formally
  `-log P(H|D)`. Also **§28.1's** `-1, 3, 7, 11` sequence puzzle: "add 4" versus
  a cubic that also fits all four points, with odds of about 40 million to one
  in favour of the simple rule computed entirely from Occam factors. That is the
  best single worked example in the literature for this lesson.
- Cover & Thomas, **§14.12-14.13** — the Kolmogorov sufficient statistic and the
  structure function, i.e. the ideal two-part code MDL approximates.
- Delétang et al. §3.3 — the parameter-adjusted compression rate, which is the
  concrete modern instance.

## Key points the lesson must cover

1. **The problem.** Fitting a richer model always reduces residual error, so
   "fit the data" cannot select a model. Something must charge for complexity.
   Open on the `-1, 3, 7, 11` puzzle before any formalism.
2. **The two-part code.** Send the hypothesis, then the data given the
   hypothesis: `L(H) + L(D|H)`. Both terms are in bits, and `L(D|H) = -log2
   P(D|H)` by the code-probability correspondence — which is Kraft, cited.
3. **The trade-off is U-shaped.** Work a polynomial-fit example numerically:
   `L(D|H)` falling, `L(H)` rising, the total with a visible minimum. Report the
   selected degree.
4. **The parameter cost.** Encoding `k` parameters to the precision the data
   supports costs about `(k/2) log2 n` bits. Derive the shape of the argument:
   precision beyond `1/√n` is not supported by the data, so each parameter needs
   about `(1/2) log2 n` bits. This connects MDL to BIC and should be stated.
5. **It is not a heuristic.** `L(H) + L(D|H) = -log2 P(H) - log2 P(D|H) = -log2
   P(H,D)`, so minimizing description length is maximizing posterior
   probability. State the equivalence and its condition (the code for `H` is a
   prior).
6. **Ideal versus practical.** The ideal two-part code uses `K`, and is
   uncomputable. Practical MDL replaces `K` with a code from a chosen family.
   The choice of family is where the modelling assumptions live, and it is not
   eliminable. Say this plainly — it is MDL's honest limitation.
7. **The modern instance.** Charge a neural model for its parameters. Report the
   adjusted compression rate and the reversal it produces, and note that the
   `(k/2) log2 n` term is what makes the accounting less brutal than counting
   full float precision.

## Pitfalls / subtleties to flag

- MDL depends on the code chosen for hypotheses. Different codes give different
  answers, and "the shortest description" is only defined relative to a
  description language — the same caveat that `kolmogorov-complexity`
  established, inherited here.
- Crude two-part MDL is not the state of the art; refined MDL (NML) removes some
  of the arbitrariness. State it, do not derive it.
- MDL is not the same as cross-validation and does not always agree with it.
- The `(k/2) log2 n` cost is asymptotic and assumes regularity conditions that
  fail for singular models — neural networks among them. Flag this before the
  modern instance, or the modern instance overclaims.
- Minimizing description length is maximizing a posterior only when the code for
  `H` corresponds to a genuine prior.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the sequence puzzle: `-1, 3, 7, 11` with two
   continuations drawn (the "add 4" line and a cubic through all four points),
   and the two description lengths tallied. One idea: both explain the data, one
   costs less to say.
2. `draw:` **single `<Figure>`** — the two-part message as a literal bitstream:
   a shaded block for `L(H)` followed by a block for `L(D|H)`, for three
   candidate models, drawn to scale. One idea: model selection is comparing
   message lengths.
3. `draw:` **`<FigureSequence>` (4 frames)** — the U-curve built: frame 1
   `L(D|H)` falling with degree; frame 2 `L(H)` rising; frame 3 the sum; frame 4
   the minimum marked with the selected degree. Binds the TwoPartCode demo.
4. `draw:` **single `<Figure>`** — the precision argument: a parameter's
   likelihood peak with width `1/√n`, and the bits needed to name a point within
   that width, annotated as `(1/2) log2 n`. One idea: the data decides how
   precisely you may quote a parameter.
5. `draw:` **asymmetric-price.svg** (exists) — keep, placed where the asymmetry
   between the two terms is argued.
6. `draw:` **single `<Figure>`** — the modern instance: total description length
   against corpus size for a large model with and without its parameter cost
   charged, and gzip's line, with the crossover marked. Deliberately the same
   figure family as `language-models-as-compressors` figure 6, now with the
   `(k/2) log2 n` accounting rather than raw float precision. One idea: the debt
   from the previous module, paid.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* For a polynomial fit with `k` coefficients on `n = 100` points,
   compute the parameter cost `(k/2) log2 n` for `k = 1, 3, 10` and report the
   totals given supplied residual costs.
2. **Boundary probe.** Take `n → ∞` with `k` fixed, and then `k` growing like
   `n`. State what the two-part total does in each case and which regime the
   `(k/2) log2 n` approximation is valid in.
3. **Claim to refute.** "MDL is just Occam's razor with extra steps, so it has
   no more justification than a preference for simplicity." Refute by exhibiting
   the equivalence to posterior maximization and naming the condition it
   requires.
4. **Claim to refute, second kind.** "A model with more parameters always has a
   longer description, so MDL always prefers the smaller model." Give a case
   where the richer model wins, and quantify the crossover.
5. **Derivation the lesson skipped.** Derive the `(1/2) log2 n` per-parameter
   cost from the observation that the likelihood is flat to within `1/√n`. State
   the regularity assumption you used and name a model class that violates it.
6. **Research-shaped.** Reproduce MacKay's sequence-puzzle odds: set up the two
   hypotheses for `-1, 3, 7, 11`, choose explicit codes for each, and compute
   the odds ratio. Report your number and compare with the published ~4 × 10^7,
   stating which coding choice your answer is most sensitive to.
7. **FORWARD (E7).** You want a compressed representation that keeps only what
   is needed to predict a label, and you have no distortion measure to hand.
   Write down a two-part-like objective in which the "cost" is the bits kept
   from the input and the "fit" is measured against the label. Reaches
   `information-bottleneck` — the solution names `I(X;T) - β I(T;Y)` and
   `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph and the explicit payment of the debt left by
  `language-models-as-compressors` (a new lesson that did not exist when this
  draft was written). The closing must state that the ranking reversal there is
  resolved by the `(k/2) log2 n` accounting here.
- Figures 1, 2, 4, 6 above. Only `asymmetric-price.svg` exists today.
- MacKay's sequence puzzle with the computed odds, currently absent.
- The singular-model caveat before the neural instance, currently absent and
  necessary — `(k/2) log2 n` does not apply to neural networks without
  qualification.
- Depth toward 36 minutes.

**Lose**
- Any presentation of MDL as a free lunch that removes modelling choices.
- Callouts restating the two-part formula (L15).
