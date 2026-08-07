# Research brief: kolmogorov-complexity (Kolmogorov complexity)

status: drafted (kept slug — revise, do not rewrite)
module: information-in-ml
type: core
goal: Explain Kolmogorov complexity as the shortest-program limit under all compression.
est_minutes: 36

## ARC

- **Inherits:** the compressor/model correspondence
  (`compression-is-prediction`) and the entropy floor
  (`source-coding-theorem-lite`).
- **Spine step:** "Beneath every distribution-based bound is one that assumes no
  distribution at all: the length of the shortest program that prints the
  string, uncomputable but equal to entropy in expectation." (step 8, *The floor
  under every model*, 1964–1965)
- **Contributes:** the removal of the last assumption. Entropy required a
  distribution; `K(x)` requires nothing, and the price is uncomputability.
- **Hands off to:** `minimum-description-length`, which is the computable
  approximation, and to `language-models-as-compressors`, whose "universal
  predictor" framing descends from here.

## Sources to consult

- Shen, Uspensky & Vereshchagin — the **informal overview** and **ch. 1** for
  the definition and the invariance theorem; **ch. 1** again for the counting
  argument; the Berry-paradox proof of non-computability; **ch. 7** for
  `C(x)/n → H`; **ch. 14.3** for the two-part code / MDL statement.
- Cover & Thomas, **ch. 14**: §14.2 definitions; **§14.3 Theorem 14.3.1**
  (`H(X) ≤ (1/n) E K(X^n|n) ≤ H(X) + O(log n / n)`); **§14.5 Theorem 14.5.1**
  (`Pr[K(X^n|n) < n-k] < 2^{-k}`); §14.6-14.7 universal probability, the halting
  problem, Berry; §14.8 Chaitin's Ω; §14.10 Occam's razor; §14.12-14.13 the
  Kolmogorov sufficient statistic and MDL.
- **Ziv & Lempel 1978** — the `u(k)` sequence (all binary words of each length,
  concatenated) which has a one-line description yet is incompressible by any
  finite-state encoder. This is the sharpest available separation between
  "simple" and "compressible-by-a-real-machine", and it connects directly back
  to `dictionary-coding`.
- MacKay, **ch. 28** — Occam's razor and the evidence, as the Bayesian dual;
  useful for a starred section and needed by `minimum-description-length`.

## Key points the lesson must cover

1. **Definition.** `K(x)` = length of the shortest program (for a fixed
   universal machine) that prints `x` and halts. Give three strings of the same
   length whose complexities differ by orders of magnitude: `0^{1000}`, the
   first 1000 bits of π, and 1000 fair coin flips.
2. **Invariance.** Changing the programming language changes `K` by at most an
   additive constant — the length of an interpreter. State the theorem and its
   proof idea, and be honest that the constant can be large and is why `K` is
   only asymptotically meaningful.
3. **The counting argument.** At most `2^{n-k}` strings of length `n` have
   `K(x) < n - k`, so fewer than `2^{-k}` of all strings compress by `k` bits.
   Compute: fewer than one in a thousand 1 KB files can be shortened by even 10
   bits. This is the rigorous form of "compression is not free" and it is the
   best exercise material in the lesson.
4. **Uncomputability**, by Berry's paradox: if `K` were computable, "the
   shortest string with `K(x) > n`" would be a short program printing a string of
   high complexity. Carry the argument; it is four sentences and it is the
   lesson's centrepiece.
5. **`K` and entropy.** For an i.i.d. source, `(1/n) E[K(X^n | n)] → H(X)`. So
   the distribution-free quantity agrees on average with the
   distribution-dependent one. This is the sentence that retroactively justifies
   the whole first half of the course, and it should be stated that way.
6. **Simple is not compressible-in-practice.** The `u(k)` sequence: a
   two-sentence description, `K` therefore small, and yet provably
   incompressible by any finite-state machine. The gap between `K` and what a
   real algorithm achieves is not a technicality; it is where all of practical
   compression lives.
7. **Where this goes**: the ideal two-part code `K(model) + K(data | model)` is
   uncomputable, and MDL is what you do instead. One paragraph, forward `<Ref>`.

## Pitfalls / subtleties to flag

- `K` is defined up to an additive constant, so statements about a *single*
  string's complexity are meaningless without that caveat. Statements about
  asymptotic families are fine.
- Uncomputable does not mean unapproximable from above: any compressor gives an
  upper bound on `K`. It is the lower bounds that are unavailable.
- "Random" here means incompressible, not "produced by a random process". A coin
  flip sequence is almost certainly incompressible; a specific string is or is
  not, and you cannot tell which.
- Prefix-free (Chaitin) complexity is the version for which `Σ 2^{-K(x)} ≤ 1`
  holds; the plain version does not satisfy Kraft. If universal probability is
  mentioned, the prefix version is the one meant. Flag once.
- Do not oversell Solomonoff induction as an achievable ideal.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — three 1000-bit strings side by side (all
   zeros, digits of π, coin flips) with a short program under each and the
   program lengths tallied. One idea: same length, different complexity.
2. `draw:` **single `<Figure>`** — the invariance theorem as a picture: a program
   in language A wrapped in an interpreter written in language B, with the
   constant `c` marked as the interpreter's length. One idea: the language costs
   a constant, not a factor.
3. `draw:` **`<FigureSequence>` (3 frames)** — the counting argument: frame 1 the
   `2^n` strings of length `n`; frame 2 the `2^{n-k}` programs shorter than
   `n-k`; frame 3 the pigeonhole conclusion with the fraction `2^{-k}` shaded.
   One idea: there are not enough short programs.
4. `draw:` **single `<Figure>`** — Berry's paradox as a boxed program: the
   pseudocode "print the shortest string with complexity above `n`", with its
   own length annotated as `O(log n)` and the contradiction arrowed. One idea:
   the program is shorter than the thing it prints.
5. `draw:` **single `<Figure>`** — `K` against entropy: for a Bernoulli(p)
   source, `(1/n)E[K]` plotted against `n` converging on `H(p)`, with the
   `O(log n / n)` correction band shaded. One idea: the two floors agree in the
   limit.
6. `draw:` **single `<Figure>`** — the `u(k)` sequence: its first few blocks
   written out, its two-sentence description in a box, and a marker showing
   `K` small while the finite-state compression ratio stays at 1. One idea:
   describable and incompressible are different properties.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Order five supplied strings by rough Kolmogorov complexity and
   justify each comparison in one sentence.
2. **Boundary probe.** Compute the fraction of 1 KB files that any lossless
   compressor can shrink by at least 1 bit, by at least 10 bits, and by at least
   half. Report all three, and state what this implies about a compressor
   advertised as working on "any" data.
3. **Claim to refute.** "The string `u(k)` — all binary words of each length,
   concatenated — has a two-line description, so a good compressor will squeeze
   it." Refute using the 1978 result, and name what property of the compressor,
   not of the string, is responsible.
4. **Claim to refute, second kind.** "`K` is uncomputable, so it is useless for
   practice." Identify what *is* computable about `K` (upper bounds) and give
   one concrete use of an upper bound.
5. **Derivation the lesson skipped.** Prove that `K(x) ≤ |x| + c` for all `x`,
   exhibit the program, and then prove that `K(xx) ≤ K(x) + c'`. State what
   these two together say about the compressibility of repeated data.
6. **Research-shaped.** Take the first `n` bits of a mathematical constant
   (π, e, or the Thue-Morse sequence) for `n` = 10^3, 10^4, 10^5, compress each
   with gzip and with zstd, and plot the ratio. Report whether the ratio tends
   to 1, and state which of `K` and the finite-state complexity your measurement
   is estimating.
7. **FORWARD (E7).** You must send a friend a dataset and a model that explains
   it. Write down the total number of bits for two choices of model complexity —
   a constant and a 10-parameter fit — counting both the model description and
   the residual. Report which total is smaller and at what dataset size the
   answer flips. Reaches `minimum-description-length` — the solution names the
   two-part code and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph placing this as spine step 8, the removal of the last
  assumption.
- Figure 6 and the `u(k)` construction from Ziv & Lempel 1978, which the current
  draft does not have and which is the lesson's sharpest counterexample. It also
  binds back to `dictionary-coding` (C5 spiral).
- The counting argument computed to concrete numbers (one in a thousand 1 KB
  files, ten bits) rather than stated as a proportion.
- The `(1/n)E[K] → H` result given its due as the retroactive justification of
  the course's first half.
- Depth toward 36 minutes.

**Lose**
- Any single-string complexity claim stated without the additive-constant
  caveat.
- Overclaiming Solomonoff induction.
- Callouts restating "K is uncomputable" after Berry's argument (L15).
