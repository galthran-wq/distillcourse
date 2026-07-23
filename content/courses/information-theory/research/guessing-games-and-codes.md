# Research brief: guessing-games-and-codes (Prefix codes)

status: planned
module: coding
type: worked-practice
goal: Construct a binary code from a yes/no question strategy.

## Sources to consult

- Cover & Thomas, **§5.1 "Examples of Codes"** and **§5.3 "Optimal Codes"** —
  codes, extensions, prefix (instantaneous) codes, code trees. §5.1 gives the
  singular / nonsingular / uniquely-decodable / prefix hierarchy.
- MacKay, **ch. 5 "Symbol Codes", §5.1** — symbol codes and the code-tree
  picture; MacKay frames codeword length as depth in a binary tree, which is
  exactly the question-strategy picture.
- MacKay, **ch. 4, §4.1** — the "20 questions" / weighing framing that motivates
  expected-question-count = expected-codeword-length. (Locate the exact
  subsection; the weighing-problem exercise is early in ch. 4/5.)

## Key points the lesson must cover

1. A **yes/no question strategy** over a finite outcome set is a binary decision
   tree; each outcome sits at a leaf, and its **depth = number of questions =
   codeword length**. Strategy and prefix code are the same object.
2. **Prefix (instantaneous) code**: no codeword is a prefix of another;
   equivalently, outcomes sit only at *leaves*, never internal nodes. This is
   what makes the concatenated stream decodable without separators.
3. **Expected question count = expected codeword length**
   `L = Σ p(x) len(x)` — the quantity to minimize; entropy `H(X)` from the
   previous module is the lower bound (stated here, proved in
   source-coding-theorem-lite).
4. Good strategies ask questions that **split probability mass near in half**
   (each answer worth ~1 bit); likely outcomes get short paths.
5. A concrete worked build on 4 weighted outcomes (mirror the QuestionTreeBuilder
   demo distribution), computing L and comparing to H.
6. Not every prefix code is optimal; the lesson stops at "here is the object and
   its cost", leaving construction of the *best* one to Huffman.

## Pitfalls / subtleties to flag

- Prefix-free is **sufficient but not necessary** for unique decodability
  (comma codes, reversed codes decode too); we restrict to prefix codes because
  they are instantaneous and lose nothing in achievable length (forward-ref
  Kraft/McMillan in `kraft-inequality`).
- Placing an outcome at an internal node breaks the prefix property — show the
  broken tree, not just the rule.
- Expected length is an average over the *distribution*, not the number of
  leaves; a balanced tree is optimal only for a uniform distribution.
- Questions must be answerable from the outcome alone (no adaptive cheating);
  the tree is fixed before the draw.

## FIGURE PLAN

1. **`<FigureSequence>` (4-5 frames)** — build a question tree on
   `{A:.5, B:.25, C:.15, D:.1}`: each frame adds one question node and routes
   outcomes down, until all four are at leaves; final frame labels each leaf
   with its codeword and depth. This is the demo made static. Delta = one node
   per frame. Inspiration: MacKay's code-tree diagrams (ch. 5).
2. **single `<Figure>` (component)** — the correspondence panel: left, a
   3-question decision tree; right, the same tree relabeled as binary codewords
   (`0`/`1` on each branch), with a bracket showing "depth = codeword length".
   One idea: strategy ≡ code. Inspiration: Cover & Thomas §5.1 code-tree.
2b. **single `<Figure>` (component)** — a broken (non-prefix) tree: an outcome
   parked on an internal node, its codeword `01` being a prefix of leaf `011`,
   with the ambiguous stream `011` annotated in a warning color. One idea: why
   leaves only.
4. **single `<Figure>` (component)** — expected-length tally: the four codeword
   lengths times their probabilities summed to `L = 1.75` bits, set beside the
   distribution's entropy `H = 1.74...` with the small gap called out.
   Inspiration: the "L vs H" comparison the whole module builds toward.
5. **`<FigureSequence>` (3 frames)** — "split the mass in half": a good split
   (roughly 50/50, ~1 bit gained) vs. a wasteful split (90/10) shown as two
   frames of the same first question, third frame tallies the length penalty of
   the bad choice. One idea: each near-balanced question is worth a full bit.
