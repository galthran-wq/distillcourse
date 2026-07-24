# Research brief: prefix-codes (Prefix codes and code trees)

status: planned
module: coding
type: core
goal: Construct a prefix code from a decoding strategy and compute its expected length.

Re-split from the previous pass's merged `prefix-codes` lesson. That merge
folded the former `guessing-games-and-codes` and `kraft-inequality` chapters
into one. Under the removed 15-lesson cap the merge is undone: this lesson owns
the concrete object — a question strategy IS a prefix code, with an expected
length to minimize — and the next lesson (`kraft-inequality`) proves the
achievability theorem. L4: concrete object first, general theorem after.

## Sources to consult

- Cover & Thomas, **§5.1 "Examples of Codes"** — the singular / nonsingular /
  uniquely-decodable / prefix (instantaneous) hierarchy and code trees.
- MacKay, **ch. 5 "Symbol Codes", §5.1** — codeword length as depth in a binary
  tree (exactly the question-strategy picture).
- MacKay, **ch. 4, §4.1** — the "20 questions" / weighing-problem framing that
  motivates expected-question-count = expected-codeword-length.
- Olah, "Visual Information Theory" (figure inspiration only) — the codeword-
  space-as-budget picture; recreate ideas, never the drawing.

## Key points the lesson must cover

1. A **yes/no question strategy** over a finite outcome set is a binary decision
   tree; each outcome sits at a leaf, and its **depth = number of questions =
   codeword length**. Strategy and prefix code are the same object. Open by
   building one concretely on `{A:.5, B:.25, C:.15, D:.1}`.
2. **Prefix (instantaneous) code**: no codeword is a prefix of another;
   equivalently, outcomes sit only at *leaves*. This is what makes a
   concatenated stream decodable without separators — show the broken tree
   (outcome parked at an internal node) and the ambiguous stream it produces.
3. **Expected codeword length** `L = Σ p(x) len(x)`, the quantity to minimize.
   Compute it for two different codes on the same distribution and compare.
4. Good strategies split probability mass **near in half** at each question, so
   likely outcomes get short paths — the intuition Huffman will make optimal.
5. **Entropy is the floor** `H(X) ≤ L`: state it here as orientation with a
   worked side-by-side (`H ≈ 1.74` vs `L = 1.75` on the running distribution);
   the proof is two lessons on (`source-coding-theorem-lite`). Do not leak it.

## Pitfalls / subtleties to flag

- Prefix-free is **sufficient but not necessary** for unique decodability (comma
  codes, reversed codes decode too). Kraft/McMillan (next lesson) is why
  restricting to prefix codes costs nothing — forward-ref, do not cover here.
- Expected length is an average over the **distribution**, not the number of
  leaves; a balanced tree is optimal only for a uniform distribution.
- Questions must be fixed before the draw (no adaptive cheating): the tree is
  the strategy.
- `H ≤ L` is *stated*, not proved, in this lesson. Keep the proof out.
- Codeword lengths, not the specific 0/1 labels, are what matters; swapping a
  node's children relabels codewords without changing lengths or `L`.

## FIGURE PLAN

1. **`<FigureSequence>` (4-5 frames)** — build a question tree on
   `{A:.5, B:.25, C:.15, D:.1}`: each frame adds one question node and routes
   outcomes down; final frame labels each leaf with its codeword and depth.
   Delta = one node per frame. Inspiration: MacKay's code-tree diagrams (ch. 5).
2. **single `<Figure>` (component)** — the correspondence panel: left, the
   decision tree with yes/no questions; right, the same tree relabeled with
   `0`/`1` on each branch and codewords at leaves, bracket "depth = codeword
   length". One idea: strategy ≡ code. Inspiration: Cover & Thomas §5.1.
3. **single `<Figure>` (component)** — a broken (non-prefix) tree: an outcome
   parked on an internal node, its codeword `01` a prefix of leaf `011`, the
   ambiguous stream `011…` annotated in warning color with its two parses. One
   idea: leaves only.
4. **single `<Figure>` (component)** — two codes for the same distribution side
   by side (a balanced code, lengths `{2,2,2,2}`, and the matched code
   `{1,2,3,3}`); expected-length tally `L = 2.0` vs `L = 1.75` under the tally
   rule. One idea: matching lengths to probabilities shortens `L`.
   Inspiration: playbook two-panel comparison.
5. **single `<Figure>` (component)** — expected-length vs entropy: the matched
   code's `L = 1.75` bar beside the entropy `H ≈ 1.74` floor, gap called out
   "≈ 0.01 bits above the floor". One idea: `L` is the cost, `H` the floor
   (proved later). Foreshadows source-coding-theorem-lite.
6. **`<FigureSequence>` (3 frames)** — split-near-half heuristic: frame 1 a bad
   first question isolating the rarest outcome (unbalanced mass); frame 2 the
   good first question splitting mass `.5/.5`; frame 3 the resulting shorter
   `L`. One idea: balance the mass, not the count.
