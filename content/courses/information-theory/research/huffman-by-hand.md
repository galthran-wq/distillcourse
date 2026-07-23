# Research brief: huffman-by-hand (Huffman coding)

status: planned
module: coding
type: worked-practice
goal: Build an optimal prefix code with the Huffman algorithm.

## Sources to consult

- Cover & Thomas, **§5.6 "Huffman Codes"**, **§5.7 "Some Comments on Huffman
  Codes"**, **§5.8 "Optimality of Huffman Codes"** — the algorithm, worked
  examples, and the exchange-argument optimality proof (their Lemma 5.8.1 and
  Theorem 5.8.1). §5.4 "Bounds on the Optimal Codelength" gives
  `H(X) ≤ L* < H(X)+1`.
- MacKay, **ch. 5, §5.4 "The Huffman coding algorithm"** — the merge procedure,
  a worked example, and MacKay's explicit critique of Huffman's shortcomings
  ("The disadvantages of the Huffman code", §5.5-ish) that motivates stream
  codes in ch. 6. (Locate the exact subsection number for the critique.)

## Key points the lesson must cover

1. **The algorithm**: repeatedly take the two lowest-probability symbols, merge
   them into a node with summed probability, reinsert, repeat until one node
   remains; read codewords off the tree (root-to-leaf, 0/1 per branch).
2. A fully **worked example on `{A:.5, B:.25, C:.15, D:.1}`** (course.yaml's
   stated distribution) showing every merge, then the learner regenerates on a
   fresh distribution.
3. **Optimality**: Huffman produces a minimum-expected-length prefix code. The
   proof idea (exchange argument): an optimal code can be assumed to give the
   two least-likely symbols the longest, equal-length, sibling codewords; merging
   them reduces to a smaller optimal problem (induction).
4. **The 1-bit guarantee**: `H(X) ≤ L_Huffman < H(X)+1`. The overhead comes from
   integer codeword lengths; connect to the ceiling `⌈-log2 p⌉` intuition.
5. Huffman is optimal *among symbol codes* but not perfect — the up-to-1-bit gap
   per symbol motivates block coding (source-coding-theorem-lite) and stream /
   arithmetic coding (compression-is-prediction).

## Pitfalls / subtleties to flag

- **Tie-breaking is free**: when several symbols share the lowest probability the
  choice is arbitrary and the tree is not unique, but *every* Huffman tree
  achieves the same optimal expected length. State this to preempt "my tree
  looks different".
- The 1-bit overhead is **per symbol**, so it can dominate for low-entropy
  sources (a 0.1-bit source still pays ~1 bit/symbol with a symbol code) — this
  is the motivating flaw for the next lessons, name it explicitly.
- Codeword *lengths* are what is optimal; the 0/1 labeling on branches is
  arbitrary (swapping children relabels, same lengths).
- Huffman needs the distribution in advance; adaptive/streaming variants exist
  but are out of scope.
- Do not claim Huffman achieves entropy — it achieves it only when all
  probabilities are powers of 1/2 (dyadic).

## FIGURE PLAN

1. **`<FigureSequence>` (5-6 frames)** — the merge process on
   `{A:.5, B:.25, C:.15, D:.1}`: each frame merges the current two smallest into
   a parent node (probabilities updating), forest shrinking by one, until the
   root forms. The house-signature algorithm sequence; delta = one merge per
   frame. Inspiration: MacKay §5.4 Huffman worked example.
2. **single `<Figure>` (component)** — the finished tree with codewords read off
   each leaf and the expected-length tally `L = 1.75` beside the source entropy,
   showing the sub-1-bit gap. One idea: the output and its cost.
3. **`<FigureSequence>` (3 frames)** — the exchange argument, schematically: an
   arbitrary optimal tree; swap a shallow rare leaf with a deep frequent one;
   show expected length cannot increase — motivating "two rarest go deepest".
   One idea per frame. Inspiration: Cover & Thomas §5.8 proof.
4. **single `<Figure>` (component)** — `H ≤ L < H+1` on a number line for the
   example, plus a low-entropy source (0.9/0.1 coin, H≈0.47) where L=1 shows the
   overhead nearly doubling the cost. One idea: integer lengths cost up to a bit.
5. **single `<Figure>` (component)** — two valid Huffman trees for a tie-heavy
   distribution side by side, different shapes, identical `L`. One idea:
   non-unique tree, unique cost.
