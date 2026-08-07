# Research brief: entropy-as-average-surprise (Entropy)

status: drafted (kept slug — revise, do not rewrite)
module: foundations
type: core
goal: Compute the entropy of a discrete distribution as expected surprisal.
est_minutes: 30

## ARC

- **Inherits:** `-log2 p` as the information in one event, and the additivity
  argument that forced it (`what-is-surprise`).
- **Spine step:** step 1, *Information has a size* — "…averaging that quantity
  over a source defines entropy."
- **Contributes:** `H(X) = E[-log2 p(X)]`, its range, and the binary entropy
  function, which is the single most reused curve in the course (BSC capacity,
  rate-distortion of a Bernoulli source, MDL parameter costs all call it).
- **Hands off to:** `joint-and-conditional-entropy` (two variables) and, through
  the coding module, to the claim that `H` is a floor on code length rather than
  a summary statistic.

## Sources to consult

- Shannon 1948, Part I, **§6** — the definition, the extremal properties, and
  **fig. 7**, the binary entropy curve.
- Cover & Thomas, **§2.1** (definition, binary entropy function) and
  **Theorem 2.6.4** (`H(X) ≤ log|X|` via Jensen).
- MacKay, **ch. 2 §2.4-2.5** — entropy of an ensemble; **ch. 2 §2.1** for the
  English monogram table giving `H ≈ 4.11` bits/char over 27 symbols.
- Weissman (EE376A), **ch. 2 §2.1** — Jensen primer and the `H ≤ log|X|`
  derivation at an elementary level; useful for pacing.

## Key points the lesson must cover

1. Entropy is the **probability-weighted** average of surprisal, not the plain
   average of the surprisal values. The weather example (1.5 bits, versus the
   misleading unweighted 1.67) makes the distinction concrete.
2. `H(X) = -Σ p(x) log2 p(x) = E[-log2 p(X)]`, with `0 log2 0 = 0` justified by
   the limit.
3. **Relabelling invariance**: `H` depends only on the multiset of
   probabilities.
4. **Range theorem** `0 ≤ H ≤ log2 n`: lower bound termwise, upper bound by
   Jensen on the concave log, with the equality condition (uniform on the
   support) stated precisely.
5. The **binary entropy function** `H(p)`: endpoints 0, maximum 1 bit at
   `p = 1/2`, symmetry, and the vertical tangent at the ends
   (`H'(p) = log2((1-p)/p)`), with `H(0.99) ≈ 0.081` as the anchor.
6. Reference values: fair die `log2 6 ≈ 2.585`; uniform byte 8; shuffled deck
   `log2 52! ≈ 225.6`; English monograms `≈ 4.11` against the ceiling
   `log2 27 ≈ 4.75`.
7. Operational preview: `H` will turn out to be a floor on bits per draw, not a
   convenient average. Stated as a fact to be proved, with a `<Ref>` forward.

## Pitfalls / subtleties to flag

- Jensen's equality condition forces uniform **on the support**; a distribution
  with zero-probability symbols attains `log2 k` for `k` = support size, not
  `log2 n`.
- `0 log2 0 = 0` is a convention with a limit justification, not a definition of
  `log 0`.
- The 4.11-bit monogram figure is not the entropy of English; the rate is far
  lower. Flag and forward-reference `entropy-of-english`.
- Entropy is not a measure of "information in a message" — it is a property of
  the distribution. A specific long message can be atypical.

## FIGURE PLAN

1. `draw:` **weighted-average.svg** (exists) — weather outcomes, surprisal bars
   weighted into `H = 1.5`.
2. `draw:` **binary-entropy.svg** (exists) — the `H(p)` inverted U with the
   90/10 point marked. This is Shannon's fig. 7 recreated.
3. `draw:` **entropy-steps-1..3.svg** (exists, `<FigureSequence>`) — the
   three-step computation on `{1/2, 1/4, 1/8, 1/8}` ending at 1.75.
4. `draw:` **concentration-1..4.svg** (exists, `<FigureSequence>`) — mass
   sliding from uniform onto one outcome, `H` dropping 2.00 → 0.
5. `draw:` **binary-entropy-zoom.svg** (exists) — the endpoint zoom with the
   tangent going vertical, annotated `H(0.99) ≈ 0.081`.
6. `draw:` **ceiling.svg** (exists) — the `log2 n` staircase, uniform bars
   touching their ceilings, a non-uniform bar below.
7. `draw:` **NEW, single `<Figure>`** — "same entropy, different shape": three
   visibly different 4-outcome distributions all with `H = 1.50` bits, tallied
   side by side. One idea: `H` is a projection, not a fingerprint. This is the
   figure the EntropyExplorer target needs, and it pre-empts the commonest
   misreading. Inspiration: the relabelling-invariance property, made visual.

No `source:` entry. Everything here is a curve or a tally; a scan would add
nothing a drawing does not.

## EXERCISE PLAN

1. *(warm-up)* Compute `H` for a fair die, a loaded die given as a table, and a
   two-outcome source at `p = 0.9`. Report all three in bits and order them.
2. **Boundary probe.** A distribution over 8 symbols has three of them at
   probability zero. Compute the maximum entropy it can attain and identify
   which clause of the Jensen equality condition produces that answer rather
   than `log2 8`.
3. **Claim to refute.** "Adding an outcome to a distribution always increases
   its entropy, because there is more to be uncertain about." Give a
   counterexample with numbers and name the step that fails.
4. **Derivation the lesson skipped.** Prove the grouping property: if two
   outcomes of probability `p1, p2` are merged into one of probability
   `p1 + p2`, entropy drops by exactly `(p1+p2) H(p1/(p1+p2))`. Then use it to
   recompute the `{1/2, 1/4, 1/8, 1/8}` example in two stages.
5. **Research-shaped.** Estimate the entropy of the letter distribution of a
   text you choose, then estimate the entropy of the *word-length* distribution
   of the same text. Report both, state which is larger, and say what a
   difference of half a bit would and would not tell you about the text.
6. **FORWARD (E7).** For `{A: 1/2, B: 1/4, C: 1/8, D: 1/8}`, assign each symbol
   a codeword of length `-log2 p`, write out the four lengths, and check that
   `Σ 2^{-length}` equals exactly 1. Report the value and note that it is not a
   coincidence. Reaches `kraft-inequality` — the solution names the budget and
   `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- The ARC paragraph after the opening (spine step 1, what stands open).
- Figure 7 above ("same entropy, different shape") — the one genuinely missing
  visual, and the anchor for the new EntropyExplorer target.
- The grouping property as a worked `<Example>` in the body (it is exercise
  material now, but it is also the cleanest route to Huffman's correctness two
  modules on).
- Depth toward 30 minutes: the equality condition of Jensen worked on an
  explicit zero-probability case, and the `log2 52!` computation carried out
  rather than quoted.
- Exercise set rebuilt against the floor above.

**Lose**
- The `<KeyFact>` restating the range theorem one paragraph after proving it —
  L15 names this exact callout as the tautology-in-a-box example. Either add the
  support condition to it or cut it.
- Any repetition of the three-step computation pattern in prose after
  entropy-steps-*.svg carries it (L9a).
- Generic forward pointers ("the coding lessons that follow") — replace with
  `<Ref lesson="prefix-codes">` and `<Ref lesson="source-coding-theorem-lite">`.
