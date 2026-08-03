# Research brief: prefix-codes (Prefix codes and code trees)

status: drafted (kept slug — revise, do not rewrite)
module: coding
type: core
goal: Construct a prefix code from a decoding strategy and compute its expected length.
est_minutes: 30

## ARC

- **Inherits:** entropy as a number attached to a distribution
  (`entropy-as-average-surprise`), and, from `entropy-of-english`, the fact that
  a real source has far less information in it than its raw encoding spends.
- **Spine step:** "Codeword lengths spend a budget of fixed size, so entropy is
  not a metaphor for uncertainty but the exact floor on expected bits per
  symbol, and a greedy merge attains it to within one bit." (step 3, *Entropy is
  a code length*, 1948–1952)
- **Contributes:** the object the rest of the module reasons about — a binary
  code tree — and the cost function `L = Σ p(x) len(x)`.
- **Hands off to:** `kraft-inequality`, which answers the question this lesson
  raises and cannot answer: which sets of lengths are possible at all.

## Sources to consult

- Cover & Thomas, **§5.1 "Examples of Codes"** — the singular / nonsingular /
  uniquely decodable / prefix hierarchy, and code trees.
- MacKay, **ch. 5 §5.1** — codeword length as depth in a binary tree; **ch. 4
  §4.1** for the 20-questions and 12-ball weighing framings that motivate
  expected question count = expected codeword length.
- Weissman (EE376A), **ch. 1 §1.1** — the three-symbol source {a: .7, b: .15,
  c: .15} coded three ways (2 bits fixed, 1.3 variable, 1.1975 by blocking)
  against `H = 1.181`. A second running example worth having.
- Olah, "Visual Information Theory" — the codeword-space-as-budget picture, for
  figure inspiration only.

## Key points the lesson must cover

1. A **yes/no question strategy** is a binary decision tree; each outcome sits
   at a leaf and its depth is the number of questions and the codeword length.
   Build one concretely on `{A: .5, B: .25, C: .15, D: .1}` before naming
   anything.
2. **Prefix (instantaneous) code**: no codeword is a prefix of another;
   equivalently outcomes sit only at leaves. Show the broken tree with an
   outcome parked at an internal node and the ambiguous stream it produces.
3. **Expected codeword length** `L = Σ p(x) len(x)`. Compute it for two
   different codes on the same distribution and compare.
4. Good strategies split probability mass near in half at each question. Show
   the bad first question (isolate the rarest outcome) against the good one.
5. **Entropy is the floor**, `H(X) ≤ L`, stated with the worked side by side
   (`H ≈ 1.74` against `L = 1.75`). The proof is two lessons on; do not leak it.

## Pitfalls / subtleties to flag

- Prefix-free is sufficient but not necessary for unique decodability (comma
  codes, reversed codes). Kraft/McMillan is why the restriction costs nothing —
  forward-reference, do not cover here.
- Expected length averages over the **distribution**, not over the leaves; a
  balanced tree is optimal only for a uniform source.
- The tree is the strategy: questions are fixed before the draw.
- Codeword lengths, not the 0/1 labels, determine `L`; swapping a node's
  children relabels without changing anything.

## FIGURE PLAN

1. `draw:` **tree-build-1..4.svg** (exist, `<FigureSequence>`) — building the
   question tree on `{A:.5, B:.25, C:.15, D:.1}`, one node per frame, final
   frame labelling leaves with codewords and depths.
2. `draw:` **NEW, single `<Figure>`** — the correspondence panel: the decision
   tree on the left with yes/no questions, the same tree on the right with 0/1
   branch labels and codewords at leaves, bracketed "depth = codeword length".
3. `draw:` **NEW, single `<Figure>`** — the broken tree: an outcome parked on an
   internal node, its codeword `01` a prefix of leaf `011`, with the ambiguous
   stream `011…` shown parsing two ways in warning colour.
4. `draw:` **NEW, single `<Figure>`** — two codes for the same distribution side
   by side: balanced `{2,2,2,2}` at `L = 2.0` against matched `{1,2,3,3}` at
   `L = 1.75`, with the tally rule visible.
5. `draw:` **split-half-1..3.svg** (exist, `<FigureSequence>`) — the
   split-near-half heuristic: bad first question, good first question, resulting
   shorter `L`.
6. `draw:` **NEW, single `<Figure>`** — `L = 1.75` beside the entropy floor
   `H ≈ 1.74`, gap annotated. Foreshadows the source coding theorem.

No `source:` entry — everything here is a tree.

## EXERCISE PLAN

1. *(warm-up)* Given a code table and a distribution, compute `L`; then decode
   the bit string `0110100` with it and report the message.
2. **Boundary probe.** For a uniform source over 5 outcomes, find the prefix
   code minimising `L` and report its expected length. Explain why the answer is
   not `log2 5`, and which property of the tree forces the excess.
3. **Claim to refute.** "A code with shorter maximum codeword length always has
   smaller expected length." Give two codes on one distribution where this
   fails, and state what the correct comparison is.
4. **Derivation the lesson skipped.** Show that in an optimal prefix code, if
   `p(x) > p(y)` then `len(x) ≤ len(y)`. Prove it by exchanging two codewords
   and computing the change in `L`. (This is the first step of Huffman's
   optimality proof, met two lessons early.)
5. **Mixed review (E3).** For the source `{a: .7, b: .15, c: .15}` compute the
   entropy, then find the best prefix code and its `L`, then code *pairs* of
   symbols and report bits per symbol. Explain in one sentence why the second
   number is smaller.
6. **FORWARD (E7).** Try to build a prefix code with lengths `{1, 2, 2, 2}` on
   four symbols. Report where the construction jams, and compute
   `Σ 2^{-len}` for that set of lengths and for `{1, 2, 3, 3}`. Reaches
   `kraft-inequality` — the solution names the budget and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph naming spine step 3 and the open question this lesson leaves
  (which length sets exist) — that question is the hand-off and the current
  draft states it only implicitly.
- Figures 2, 3, 4, 6 above (currently only the two sequences exist).
- The Weissman three-symbol example as a second worked instance, including the
  blocking number 1.1975, which sets up `source-coding-theorem-lite` cleanly.
- Exercise 4 (the exchange lemma) worked in the body as an `<Example>` with its
  paired `<Exercise>` immediately after, per the maths overlay's
  example-problem pairing rule.
- Depth toward 30 minutes.

**Lose**
- Any hint of the Kraft proof. The current draft's "codeword space" language
  should stay descriptive; the budget theorem is the next lesson's payload.
- Bolded restatements of "depth = length" beyond the first (L14).
