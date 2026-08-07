# Research brief: joint-and-conditional-entropy (Joint and conditional entropy)

status: drafted (kept slug — revise; the lesson also MOVES module, from
shared-information to foundations)
module: foundations
type: core
goal: Compute conditional entropy from a joint distribution table.
est_minutes: 32

## ARC

- **Inherits:** `H(X)` as expected surprisal (`entropy-as-average-surprise`).
- **Spine step:** "Observing a second variable lowers average uncertainty, so a
  real source's information is per-symbol entropy given everything before it —
  not the entropy of its symbol frequencies." (step 2, *Context destroys
  uncertainty*, 1948–1951)
- **Contributes:** `H(Y|X)`, the chain rule, and the fact that conditioning
  reduces entropy on average but not pointwise. This is the machinery
  `entropy-of-english` measures with and `mutual-information` differences.
- **Hands off to:** `entropy-of-english` immediately (entropy rate is a limit of
  conditional entropies), and to `mutual-information` two modules on.

## Why it moved

Under the previous plan this lesson opened the shared-information module.
Conditional entropy is not a fact about *pairs of variables in the abstract*; it
is the tool that makes "the entropy of English" a well-posed question. Putting
it in the foundations module lets module 1 end on a real measurement, and lets
the shared-information module open directly on `I(X;Y)`. The cost: this lesson
no longer has `prefix-codes` available, so the redundancy framing moves to
`entropy-of-english` where it belongs.

## Sources to consult

- Cover & Thomas, **§2.2** — `H(X,Y)`, `H(Y|X)`, and **Theorem 2.2.1** (chain
  rule); **Theorem 2.6.5** (conditioning reduces entropy).
- MacKay, **ch. 8 §8.1** — joint ensembles, marginal/conditional entropy, the
  chain rule, and the additive area diagram (fig. 8.1). Also **fig. 8.2**, his
  explicit warning that the Venn reading is misleading — use it.
- Weissman (EE376A), **ch. 2 §2.2** — the `H(X|Y) ≤ H(X)` derivation straight
  from `D(P_xy || P_x P_y) ≥ 0`.

## Key points the lesson must cover

1. A **joint table** assigns one probability to each pair; row and column sums
   are the marginals.
2. **Joint entropy** `H(X,Y)` is the ordinary entropy formula over pairs.
3. **Conditional entropy** `H(Y|X)` is the average over `x` of `H(Y|X=x)`.
   Compute it both ways — `Σ_x p(x) H(Y|X=x)` and `-Σ p(x,y) log p(y|x)` — and
   show they agree on the running 2x2 table.
4. **Chain rule** `H(X,Y) = H(X) + H(Y|X) = H(Y) + H(X|Y)`, with both
   decompositions computed on the same table so the asymmetry of the parts and
   the symmetry of the total are both visible.
5. **Conditioning reduces entropy on average**, `H(Y|X) ≤ H(Y)`, equality iff
   independent. Pointwise it does not: `H(Y|X=x)` can exceed `H(Y)` for a
   particular `x`. Build a table where this happens and show the average still
   obeys the bound. This is the lesson's reversal seam — state the expectation,
   then break it.
6. Deterministic dependence `Y = f(X)` gives `H(Y|X) = 0` while `H(X|Y)` need
   not vanish.

## Pitfalls / subtleties to flag

- `H(Y|X)` is an average; the commonest error is treating it as
  `H(Y|X = x)` for a particular `x`.
- `H(Y|X) ≠ H(X|Y)` in general — they differ by `H(Y) - H(X)`.
- Conditionals `p(y|x)` are undefined where `p(x) = 0`; those `x` carry weight
  zero and are skipped, not assigned an arbitrary value.
- The area diagram is a mnemonic. Say so where it is introduced, and flag that
  the three-variable version admits a negative overlap — MacKay's fig. 8.2 point,
  which `mutual-information` will need.

## FIGURE PLAN

1. `draw:` **joint-table.svg** (exists) — the 2x2 grid of masses with marginals
   in the margins, one cell's contribution highlighted.
2. `draw:` **cond-average-1..3.svg** (exists, `<FigureSequence>`) — computing
   `H(Y|X)` as an average: the two conditional rows with their separate
   entropies, then weighted, then summed.
3. `draw:` **chain-bars.svg** (exists) — the chain rule as a bar decomposition,
   the same total split two ways.
4. `draw:` **area-bars.svg** (exists) — the additive area diagram with the
   overlap left unlabelled (it becomes `I(X;Y)` later).
5. `draw:` **conditioning-1..3.svg** (exists, `<FigureSequence>`) — independent,
   mildly linked, deterministic: `H(Y|X)` shrinking each frame.
6. `draw:` **NEW, single `<Figure>`** — the pointwise counterexample: a joint
   where `H(Y|X = x1) > H(Y)` while `H(Y|X) < H(Y)`, drawn as two conditional
   bars beside the marginal bar with the weighted average marked. One idea:
   the bound is on the average, and only on the average. This figure carries the
   reversal seam and is the lesson's most important missing visual.
7. `draw:` **NEW, single `<Figure>`** — the misleading-Venn warning: the
   two-variable area diagram beside a three-variable version with the central
   region marked "can be negative", using `Z = X XOR Y` with independent `X, Y`
   as the instance. One idea: the picture is a mnemonic, not an identity.
   Inspiration: MacKay fig. 8.1 versus 8.2.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* From a given 3x2 joint table compute `H(X)`, `H(Y)`, `H(X,Y)`,
   `H(Y|X)` and `H(X|Y)`, and verify the chain rule both ways.
2. **Boundary probe.** Construct a joint where `H(Y|X) = 0` but `H(X|Y) = 1`
   bit. State what relation between `X` and `Y` forces this, and what would have
   to change to make both zero.
3. **Claim to refute.** "Conditioning reduces entropy, so `H(Y|X=x) ≤ H(Y)` for
   every `x`." Produce a table violating it, and name where the averaging step
   was smuggled in.
4. **Derivation the lesson skipped.** Prove the general chain rule
   `H(X1,…,Xn) = Σ H(Xi | X1,…,X_{i-1})` by induction from the two-variable
   case, then use it to show `H(X1,…,Xn) ≤ Σ H(Xi)` with equality iff
   independent.
5. **Mixed review (E3).** Given only the numbers `H(X) = 1.5`, `H(Y) = 1.0`,
   `H(X,Y) = 2.1`, decide whether `X` and `Y` are independent, and state the
   largest and smallest `H(X,Y)` consistent with those two marginals.
6. **Research-shaped.** Take an English text, tabulate the joint distribution of
   (letter, next letter) over a few thousand characters, and compute `H(next |
   current)`. Compare it against the single-letter entropy you computed in the
   previous lesson and report the drop in bits.
7. **FORWARD (E7).** Using the same text, extend exercise 6 to condition on two
   preceding letters and report the new value. Plot the three numbers (0, 1, 2
   letters of context) and extrapolate. Reaches `entropy-of-english`: the
   solution names the limit as the entropy rate and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph placing the lesson in spine step 2 and naming the hand-off to
  `entropy-of-english` (the module's application), which the current draft does
  not do because the lesson used to sit in a different module.
- Figures 6 and 7 above — the pointwise counterexample and the Venn warning.
  Both are load-bearing and both are currently prose-only.
- The reversal seam written explicitly (L10b): state the expectation that
  conditioning always helps, then break it on the counterexample table.
- Depth toward 32 minutes: both computations of `H(Y|X)` carried out in full on
  the same table, plus the deterministic and independent boundary cases worked
  rather than asserted.

**Lose**
- Any prerequisite recap of `prefix-codes` or coding language: this lesson now
  precedes the coding module and must not lean on it.
- Restatement of the chain rule in a callout immediately after deriving it
  (L15).
