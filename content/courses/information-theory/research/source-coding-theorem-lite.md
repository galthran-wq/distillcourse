# Research brief: source-coding-theorem-lite (The source coding theorem)

status: drafted (kept slug — revise, do not rewrite)
module: coding
type: core
goal: Explain why no lossless code can average fewer bits per symbol than the entropy.
est_minutes: 38

## ARC

- **Inherits:** the Kraft budget (`kraft-inequality`) and the observed one-bit
  gap of the best symbol code (`huffman-by-hand`).
- **Spine step:** step 3, *Entropy is a code length* — this lesson is where the
  step is actually proved.
- **Contributes:** the floor `L ≥ H`, the decomposition `L = H(p) + (mismatch)`
  that the whole machine-learning module runs on, and the typical set.
- **Hands off to:** `arithmetic-coding` (which realises the block limit without
  blocking), `kl-divergence` (which names the mismatch term), and
  `noisy-channel-coding` (which reuses typicality jointly).

## Sources to consult

- Cover & Thomas, **§5.3-5.4** — `L ≥ H` via the Kraft budget, the wrong-code
  identity `L = H(p) + D(p||q) + slack` with `q(x) = 2^{-l(x)}/Σ2^{-l}`, and
  Theorem 5.4.1 `H ≤ L* < H+1`. §5.4 is the conceptual spine of the ML module.
- MacKay, **ch. 4** — the block version via the typical set and the essential
  bit content `H_δ`, including the four-panel "anatomy of the typical set"
  figure and the staircase plots of `H_δ(X^N)` flattening as `N` grows.
- Shannon 1948, **Theorem 9** — the original statement, plus **Appendix 3** for
  the ergodic-source theorems behind it.
- Weissman (EE376A), **ch. 3** — the AEP proved directly from the weak law of
  large numbers in one paragraph, and the direct/converse fixed-length theorems.
  Use this for the proof pacing; it is the most elementary correct version.

## Key points the lesson must cover

1. **Every prefix code implicitly bets on a distribution** `q(x) = 2^{-l(x)}`.
   Assigning a length is assigning a probability, and Kraft is why these sum to
   at most one.
2. **The decomposition** `L = Σ p(x) l(x) = H(p) + D(p||q) + slack`. Both extra
   terms are non-negative, so `L ≥ H(p)`, with equality only for a dyadic `p`
   coded at `l(x) = -log2 p(x)`. The divergence term is introduced here as "the
   penalty for betting on the wrong distribution" and named in `kl-divergence`.
3. **Achievability**: the Shannon code `l(x) = ⌈-log2 p(x)⌉` satisfies Kraft and
   gives `L < H+1`.
4. **Block coding closes the gap**: coding `n` symbols jointly spreads the
   sub-one-bit overhead over `n`, so per-symbol cost tends to `H`. Support with
   the typical-set argument: about `2^{nH}` sequences carry almost all the
   probability, so `nH` bits index them.
5. **The AEP itself**, stated and proved from the law of large numbers applied
   to `-(1/n) log p(X_1…X_n)`. State the two consequences: probability of the
   typical set tends to 1, and its size is `2^{n(H±ε)}`.
6. **Statement of the theorem**: the minimum achievable expected bits per symbol
   is `H(X)`, and for sources with memory it is the entropy rate.

## Pitfalls / subtleties to flag

- "Lite" means the block limit is argued via the typical set rather than proved
  with full AEP machinery for general sources. Say so; do not overclaim.
- The bound is on **expected** length. A particular message can beat it.
- The typical set is not the set of most probable sequences — the single most
  probable sequence (all heads for a biased coin) is usually atypical. This is
  the lesson's reversal seam and it is worth a worked instance.
- Per-symbol overhead of a symbol code (up to 1 bit, always) versus vanishing
  per-symbol overhead of a block code — the distinction the previous lesson set
  up.
- Blocking costs exponentially in table size (`|X|^n` codewords). Name the cost;
  it is why arithmetic coding wins in practice.

## FIGURE PLAN

1. `draw:` **NEW, single `<Figure>`** — "a code is a bet": codeword lengths beside
   the implied `q(x) = 2^{-l(x)}` bars beside the true `p(x)` bars, mismatch
   highlighted.
2. `draw:` **NEW, single `<Figure>`** — the decomposition `L = H(p) + D(p||q)` as
   a stacked bar, the floor in one colour and the wasted excess on top.
3. `draw:` **block-gap-1..5.svg** (exist, `<FigureSequence>`) — block size
   1, 2, 4, 6, 8 on a 90/10 coin, bits per symbol falling toward `H ≈ 0.47`.
4. `draw:` **NEW, single `<Figure>`** — the typical set: the space of length-`n`
   sequences with a small shaded typical region of size `2^{nH}` carrying almost
   all probability. Inspiration: MacKay ch. 4 and Shannon's Appendix 3.
5. `draw:` **NEW, `<FigureSequence>` (3 frames)** — the reversal: frame 1 marks
   the single most probable sequence (all heads, `p = 0.9^n`); frame 2 shows its
   `-log p / n` against the entropy line, outside the typical band; frame 3
   shows the typical band capturing 99% of the mass without containing it. One
   idea: most probable ≠ typical.
6. `draw:` **NEW, single `<Figure>`** — the Shannon code rounding: real
   `-log2 p` values with the round-up gap shaded, total bounded by 1 bit.
7. `draw:` **NEW, single `<Figure>`** — module capstone: a number line with `H`
   as a wall, Huffman and Shannon codes in `[H, H+1)`, block codes converging on
   `H` from the right.
8. `source:` **amathematica-theorem9-page16** → save as
   `figures/shannon-1948-theorem9.png`, centered, at the point the theorem is
   stated. The reader must be able to read the epsilon-qualified rate bound and
   the "it is not possible" clause in Shannon's own wording — the precise
   phrasing is easy to garble in paraphrase and this is the course's central
   theorem. One sourced image only.

## EXERCISE PLAN

1. *(warm-up)* For a given 5-symbol source, build the Shannon code
   `⌈-log2 p⌉`, verify Kraft, compute `L`, and locate it in `[H, H+1)`.
2. **Boundary probe.** Take a source with one symbol of probability
   `1 - 10^{-6}`. Compute `H`, the Shannon-code `L`, and the Huffman `L`. Then
   state the smallest block length at which the per-symbol cost falls below
   twice `H`, and say what makes the answer so large.
3. **Claim to refute.** "The typical set contains the most likely sequences."
   Refute it on a Bernoulli(0.9) source at `n = 100`: give the most probable
   sequence, compute its `-(1/n) log p`, and show it lies outside the typical
   band.
4. **Derivation the lesson skipped.** Derive the wrong-code identity yourself:
   starting from `L = Σ p(x) l(x)` with `l(x) = -log2 q(x)`, add and subtract
   `Σ p log p` and identify the two resulting terms. State the condition under
   which the second vanishes.
5. **Derivation, converse direction.** Prove that no *fixed-length* code on
   blocks of `n` at rate `R < H` can have vanishing error, using only the
   typical-set size bound. State which of the two AEP consequences each step
   uses.
6. **Research-shaped.** Estimate the entropy of the byte distribution of a real
   file on your machine, compute the size a symbol code would achieve, and
   compare with what `gzip -1` produces. Report the ratio and state, in one
   sentence, which assumption of this lesson the real file violates.
7. **FORWARD (E7).** For `p = (0.9, 0.1)` and a code built for
   `q = (0.5, 0.5)`, compute the expected length and subtract `H(p)`. Report the
   difference and check it equals `Σ p log2(p/q)`. Reaches `kl-divergence` —
   the solution names the quantity and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph; and the statement that this lesson *closes* the theoretical
  half of the module while `arithmetic-coding` opens the practical half.
- Figures 1, 2, 4, 5, 6, 7 and the sourced Theorem 9 page. The current draft has
  one sequence and no static figures — this is the largest visual gap in the
  course.
- The AEP proof from the weak law of large numbers, carried out (Weissman ch. 3
  pacing). The current draft asserts the typical-set facts.
- The most-probable-is-not-typical reversal, written as a seam with a computed
  instance.
- The exponential table-size cost of blocking, named as the reason arithmetic
  coding exists.
- Depth toward 38 minutes — this is the module's heaviest lesson and should be.

**Lose**
- Any suggestion that the block limit is proved in full generality here.
- Callouts restating `L ≥ H` after the decomposition proves it (L15).
