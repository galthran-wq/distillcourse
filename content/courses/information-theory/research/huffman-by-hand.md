# Research brief: huffman-by-hand (Huffman coding)

status: drafted (kept slug — revise, do not rewrite)
module: coding
type: worked-practice
goal: Build an optimal prefix code with the Huffman algorithm.
est_minutes: 32

## ARC

- **Inherits:** which length sets are legal (`kraft-inequality`) and what
  expected length measures (`prefix-codes`).
- **Spine step:** step 3, *Entropy is a code length* — "…and a greedy merge
  attains it to within one bit."
- **Contributes:** the optimal symbol code and, more importantly, its
  *irreducible* one-bit-per-symbol overhead. That overhead is the flaw that
  drives the next three lessons.
- **Hands off to:** `source-coding-theorem-lite` (which proves the floor Huffman
  approaches) and, through it, `arithmetic-coding` (which removes the overhead).

## Sources to consult

- **Huffman 1952** (primary) — the derived necessary conditions (c), (d), (e)
  proved by exchange arguments; the merge procedure; Table I's 13-message worked
  example with `L_av = 3.42`; Table III's `D = 4` generalization and the
  `(N - n0)/(D - 1)` padding rule; and the river/water-borne-insect analogy for
  why the 0/1 labelling is arbitrary.
- Cover & Thomas, **§5.6-5.8** — the algorithm, comments, and the optimality
  proof (Lemma 5.8.1, Theorem 5.8.1); **§5.4** for `H(X) ≤ L* < H(X)+1`.
- MacKay, **ch. 5 §5.5** — "The disadvantages of the Huffman code", the explicit
  critique that motivates stream codes in his ch. 6. This is the flaw statement
  the next lesson needs.
- Witten, Neal & Cleary 1987, **p. 520-521** — the sharpest statement of the
  worst case: a symbol of probability approaching 1 carries negligible
  information yet still costs a full bit.

## Key points the lesson must cover

1. **The algorithm**: merge the two lowest-probability symbols, reinsert the
   composite, repeat; read codewords off the tree.
2. Fully worked on `{A:.5, B:.25, C:.15, D:.1}`, every merge shown; the reader
   regenerates on a fresh distribution immediately after (maths overlay:
   example-problem pairing).
3. **Optimality** by exchange argument: an optimal code may be assumed to give
   the two least likely symbols the longest equal-length sibling codewords;
   merging them reduces the problem by one symbol; induct.
4. **The one-bit guarantee** `H(X) ≤ L_Huffman < H(X)+1`, and the reason: integer
   lengths against real-valued `-log2 p`.
5. **The flaw, stated as a flaw**: the overhead is per symbol, so a source of
   entropy 0.1 bits/symbol still costs about 1 bit/symbol — a factor of ten.
   Name it here; it is the entry point for both block coding and arithmetic
   coding.

## Pitfalls / subtleties to flag

- **Tie-breaking is free**: several trees are possible, all with the same
  optimal `L`. State this to pre-empt "my tree looks different".
- Huffman attains `H` exactly only for dyadic distributions. Do not overclaim.
- The 0/1 labelling at each merge is arbitrary — Huffman's own point, with
  `2^{n-1}` equivalent assignments for an `n`-merge tree.
- Huffman needs the distribution in advance, and a per-file table costs bytes.
  That cost is real and is why DEFLATE has a fixed-table mode; flag and defer.
- Optimality is *among symbol codes*. It is not optimality among compressors.

## FIGURE PLAN

1. `draw:` **huffman-merge-1..5.svg** (exist, `<FigureSequence>`) — the merge
   process on `{A:.5, B:.25, C:.15, D:.1}`, one merge per frame.
2. `draw:` **NEW, single `<Figure>`** — the finished tree with codewords read off
   each leaf, `L = 1.75` tallied beside `H ≈ 1.74`.
3. `draw:` **exchange-1..3.svg** (exist, `<FigureSequence>`) — the exchange
   argument: swap a shallow rare leaf with a deep frequent one, `L` cannot
   increase.
4. `draw:` **NEW, single `<Figure>`** — `H ≤ L < H+1` on a number line for the
   example, plus a 0.99/0.01 source where `H ≈ 0.081` and `L = 1`, the overhead
   twelvefold. One idea: the guarantee is additive and that is bad news for
   low-entropy sources.
5. `draw:` **NEW, single `<Figure>`** — two valid Huffman trees for a tie-heavy
   distribution, different shapes, identical `L`.
6. `source:` **amethod-p3-table1** → save as `figures/huffman-1952-table1.png`,
   float right beside the algorithm section. The reader must be able to see that
   the original presentation is a bracket table across auxiliary ensembles, not
   the tree every textbook now draws — that is a fact about the history of the
   algorithm which a redrawn tree would erase. One sourced image; the
   `amethod-p1-title` capture is available if a provenance shot is wanted
   instead, but not both.

## EXERCISE PLAN

1. *(warm-up)* Build the Huffman code for a given 6-symbol distribution and
   report `L`, `H`, and the gap.
2. **Boundary probe.** Build the Huffman code for a source with
   `p = (0.99, 0.01)`. Report `L`, `H`, and their ratio. Then do the same after
   grouping symbols in pairs, and state how far the ratio falls.
3. **Claim to refute.** "Huffman coding is optimal, so no scheme can compress
   this source below `L_Huffman` bits per symbol." Give the counterexample and
   name precisely what class Huffman is optimal within.
4. **Derivation the lesson skipped.** Prove Huffman's condition (e): in an
   optimal code every binary string of length `l_max - 1` is either used as a
   codeword or is a prefix of one. Then explain why this is the Kraft equality
   condition in disguise.
5. **Derivation, second direction.** Show that for a dyadic distribution
   (`p(x) = 2^{-k_x}`) Huffman attains `L = H` exactly, and identify what
   changes the moment one probability is not a power of one half.
6. **Research-shaped.** Reproduce Huffman's own Table II: from the 13
   probabilities in the 1952 paper (readable in the sourced figure), build the
   code and check that `L_av = 3.42`. Report any tie you had to break and
   confirm your `L` matches despite a different tree.
7. **FORWARD (E7).** A source has `H = 0.2` bits/symbol. Compute the Huffman
   cost per symbol, then the cost per symbol when blocks of `n = 4` symbols are
   coded jointly, then `n = 8`. Extrapolate the sequence. Reaches
   `source-coding-theorem-lite` (blocking closes the gap) and
   `arithmetic-coding` (removing the integer constraint closes it without
   blocking); the solution `<Ref>`s both.

## REVISION (kept slug)

**Gain**
- ARC paragraph, and the flaw statement promoted from an aside to the lesson's
  closing move: the one-bit overhead is what the next three lessons exist to
  remove (playbook: flaw-first progression).
- Figures 2, 4, 5 and the sourced Huffman Table I.
- The `D`-ary generalization as a `## ★` starred section, with the padding rule
  — it is off the main line but it is where the dummy-symbol trick in real
  encoders comes from.
- Depth toward 32 minutes: the exchange argument written as a proof with the
  generality step marked (maths overlay), not summarized.
- Exercise set rebuilt against the floor above.

**Lose**
- Any statement that Huffman "achieves entropy" without the dyadic
  qualification.
- Restating the merge rule in a callout after the FigureSequence shows it
  (L15/L9a).
