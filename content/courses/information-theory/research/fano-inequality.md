# Research brief: fano-inequality (Fano's inequality)

status: planned (NEW lesson — split out of noisy-channel-coding, where it was a
paragraph)
module: shared-information
type: core
goal: Derive a lower bound on any decoder's error probability from the conditional entropy that observation leaves behind.
est_minutes: 34

## ARC

- **Inherits:** conditional entropy as leftover uncertainty
  (`joint-and-conditional-entropy`), and mutual information as the amount
  observation removes (`mutual-information`).
- **Spine step:** step 5, *What one variable says about another* — "…leftover
  conditional entropy forces a minimum error rate…"
- **Contributes:** the conversion from an entropy statement to an impossibility
  statement. Every converse in the rest of the course runs through it.
- **Hands off to:** `noisy-channel-coding`, whose converse is Fano plus the
  data-processing inequality and nothing else.

## Why it is a lesson

In the previous plan Fano appeared inside `noisy-channel-coding` as a lemma, and
the coding theorem's converse was compressed into a paragraph as a result. Fano
is a general-purpose tool with uses outside channel coding (minimax risk lower
bounds, the impossibility side of estimation problems), and the coding theorem
is heavy enough without it. Splitting also lets the proof — a genuinely elegant
two-way expansion — be shown in full.

## Sources to consult

- Cover & Thomas, **§2.10, Theorem 2.10.1** — the statement
  `H(Pe) + Pe log(|X|-1) ≥ H(X|X̂) ≥ H(X|Y)` and the proof introducing the
  binary error indicator `E` and expanding `H(E, X | X̂)` two ways. This proof
  is explicitly flagged in the source survey as small, elegant and
  self-contained; walk it step by step.
- Polyanskiy & Wu, **§5.3** (Theorem 5.3 and the general form, plus the `F_M`
  function whose concave non-monotone shape bounds `H` in terms of the maximum
  probability mass) and **§5.4** (Fano-LeCam and minimax risks, worked for
  Bernoulli mean estimation with the explicit constant, and contrasted with
  Cramér-Rao). §5.6 has the tensorized version linking entropy rate to symbol
  error rate.
- Weissman (EE376A), **§5.7** — the compact statement and the weak form
  `Pe ≥ (H(X|Y) - 1)/log|X|`, which is the form most useful for quick bounds.
- Cover & Thomas **§7.9** for the use that follows next lesson.

## Key points the lesson must cover

1. **The setup.** `X` is unknown, `Y` is observed, `X̂ = g(Y)` is any guess.
   `Pe = Pr[X̂ ≠ X]`. The claim is a bound on `Pe` that holds for **every** `g`
   — which is what makes it an impossibility result rather than an analysis of
   one decoder.
2. **The statement**: `H(X|Y) ≤ H(Pe) + Pe log2(|X| - 1)`, and the weak form
   `Pe ≥ (H(X|Y) - 1) / log2 |X|`.
3. **The proof.** Define `E = 1{X̂ ≠ X}`. Expand `H(E, X | X̂)` two ways with
   the chain rule; one expansion gives `H(X|X̂) + 0` (since `E` is a function of
   `X` and `X̂`), the other gives `H(E|X̂) + H(X | E, X̂) ≤ H(Pe) + Pe
   log(|X|-1)`. Conclude, then apply data processing to replace `H(X|X̂)` with
   `H(X|Y)`. Mark the step where the `|X|-1` comes from (given an error, `X` is
   one of the other `|X|-1` values).
4. **Reading it as an impossibility.** Rearranged: if you want `Pe` small you
   need `H(X|Y)` small, which means `I(X;Y)` must be close to `H(X)`. Work a
   numeric instance: `|X| = 256`, `H(X|Y) = 4` bits ⇒ `Pe ≥ about 0.4`.
5. **Tightness.** Exhibit the distribution that attains the bound (uniform over
   the wrong symbols given an error). Tightness is why the coding-theorem
   converse cannot be improved by a cleverer argument — worth stating explicitly.
6. **Beyond channels** (may be a `## ★` starred section): the same inequality
   lower-bounds the risk of any estimator via the two-point / Fano-LeCam
   reduction. State the Bernoulli-mean example and the conclusion that the
   empirical mean is rate-optimal.

## Pitfalls / subtleties to flag

- The bound is on the **best possible** decoder, so it is a statement about the
  problem, not about an algorithm. Beating it is impossible, not difficult.
- `H(Pe)` on the right is the binary entropy of the error probability — the same
  curve from module 1, reappearing in a different role. Bind it explicitly.
- The `log(|X| - 1)` factor matters: with a binary alphabet it vanishes and the
  bound reads `H(X|Y) ≤ H(Pe)`, which is much stronger than the general form
  suggests. Work the binary case separately.
- Small `H(X|Y)` does not mean small `Pe` in an operational sense if `|X|` is
  huge; read the weak form's denominator carefully.
- Fano gives a lower bound on error, never an upper bound. A decoder achieving
  it exists only in special cases.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the setup: `X → channel → Y → g → X̂` with
   `Pe` marked on the last arrow and `H(X|Y)` annotated on the middle one. One
   idea: the bound relates two labelled quantities on one diagram.
2. `draw:` **`<FigureSequence>` (4 frames)** — the proof: frame 1 introduces `E`
   as a new node; frame 2 expands `H(E,X|X̂)` the first way; frame 3 expands it
   the second way; frame 4 equates and reads off the bound. One delta per frame,
   shared terms colour-bound.
3. `draw:` **single `<Figure>`** — the bound as a region: `Pe` on the horizontal
   axis, `H(X|Y)` on the vertical, with the curve `H(Pe) + Pe log(|X|-1)` for
   two alphabet sizes and the forbidden region shaded. One idea: leftover
   uncertainty buys you a minimum error rate.
4. `draw:` **single `<Figure>`** — the binary special case: the same plot with
   `|X| = 2`, showing the bound collapse to the binary entropy curve, with a
   worked point (`H(X|Y) = 0.5` ⇒ `Pe ≥ 0.11`).
5. `draw:` **single `<Figure>`** — the tight case: the conditional distribution
   attaining equality (mass `1 - Pe` on the true symbol, `Pe/(|X|-1)` spread
   uniformly over the rest), drawn as a bar chart with the entropy tallied.
   One idea: the bound is achieved, so it cannot be improved.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Given `|X| = 32` and `H(X|Y) = 2` bits, compute the Fano lower
   bound on `Pe` using both the full and the weak form, and report the gap
   between them.
2. **Boundary probe.** Evaluate the bound as `H(X|Y) → 0` and as
   `H(X|Y) → log2 |X|`. State what `Pe` the bound forces at each end, and check
   the second against the error rate of pure guessing.
3. **Claim to refute.** "Fano's inequality shows that if `I(X;Y)` is large then
   a good decoder exists." Explain why the inequality cannot support this, and
   name which of the coding theorem's two halves does.
4. **Derivation the lesson skipped.** Prove the binary case directly
   (`|X| = 2`, so `H(X|Y) ≤ H(Pe)`) without the general machinery, and invert it
   to get `Pe ≥ H^{-1}(H(X|Y))`. State why the inverse is well defined only on
   `[0, 1/2]`.
5. **Derivation, tightness.** Construct a joint distribution attaining the bound
   with equality for `|X| = 4` and `Pe = 0.3`, and verify both sides numerically.
6. **Research-shaped.** Take a real classification problem with `k` classes and
   an estimate of the conditional entropy of the label given the features
   (estimate it by binning, honestly). Report the Fano floor on error rate, then
   compare with the best test error you can obtain from any classifier you like.
   State what a violation would imply about your entropy estimate.
7. **FORWARD (E7).** A code sends one of `2^{nR}` messages over `n` uses of a
   channel with capacity `C`. Assume the block error probability tends to zero,
   and use Fano plus the data-processing inequality to derive an inequality
   relating `R`, `C` and `n`. Reaches `noisy-channel-coding` — the solution
   notes that the reader has just proved the converse and `<Ref>`s it.
