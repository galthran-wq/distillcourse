# Research brief: kraft-inequality (The Kraft inequality)

status: planned
module: coding
type: core
goal: Apply the Kraft inequality to decide whether a set of codeword lengths is achievable.

## Sources to consult

- Cover & Thomas, **§5.2 "Kraft Inequality"** (Theorem 5.2.1: a prefix code with
  lengths `l_i` exists iff `Σ 2^{-l_i} ≤ 1`, both directions, via the code-tree /
  interval argument) and **§5.5 "Kraft Inequality for Uniquely Decodable Codes"**
  (McMillan's theorem — the same bound holds for the broader class, so prefix
  codes lose nothing).
- MacKay, **ch. 5, §5.2 "The Kraft inequality"** — the "budget" intuition and the
  tree picture; MacKay presents it as a total-budget-of-1 shared among codewords,
  which is exactly the CodewordBudget demo's model.

## Key points the lesson must cover

1. Each codeword of length `L` **claims `2^{-L}` of a fixed budget of 1** — the
   fraction of the infinite binary tree lying below it (all strings with that
   prefix). Prefix-free = disjoint subtrees, so the claimed fractions cannot
   overlap and must sum to ≤ 1.
2. **Kraft (existence direction)**: given lengths with `Σ 2^{-l_i} ≤ 1`, a prefix
   code with exactly those lengths *can be constructed* — assign codewords in
   nondecreasing length order, each to the next free tree node.
3. **Necessity direction**: any prefix code's lengths satisfy the sum ≤ 1
   (disjoint-subtree / leaf-counting argument).
4. **McMillan**: even dropping the prefix requirement (any uniquely decodable
   code), the same inequality holds — so nothing is gained by leaving the prefix
   class. Justifies restricting attention to prefix codes throughout.
5. **Trade-off**: shortening one codeword (halving its 2^{-L} cost per level
   saved) forces others longer to stay within budget. Worked with the demo's
   presets: impossible `{1,2,2,2}` (sum = 1.25 > 1), tight/complete `{1,2,3,3}`
   (sum = 1), and Huffman's output from the previous lesson.
6. **Equality `Σ 2^{-l_i} = 1`** ⇔ a *complete* code, no wasted tree nodes.

## Pitfalls / subtleties to flag

- Kraft is a statement about the **existence of lengths**, not about a specific
  code or its optimality. Satisfying Kraft does not make a code good, only
  possible.
- The inequality constrains the *multiset of lengths*, independent of which
  symbol gets which length.
- Necessity and sufficiency are genuinely two different arguments — do not
  conflate. The demo shows sufficiency (you can always place the codewords);
  necessity needs the disjointness argument.
- McMillan's result is often skipped; include at least its statement, because it
  is the reason "prefix code" and "uniquely decodable code" have the same
  achievable lengths — a subtle point the source-coding theorem leans on.
- Budget ≤ 1 does not bound the *number* of codewords (a single length-1 code
  uses half the budget); it bounds their combined length-cost.

## FIGURE PLAN

1. **`<FigureSequence>` (4 frames)** — the budget bar filling: start empty
   (budget 1), add codewords `{1,2,3,3}` one at a time, bar fills by
   `1/2, 1/4, 1/8, 1/8` to exactly full; a fifth attempted codeword overflows
   red. This is the CodewordBudget demo static. Delta = one codeword per frame.
   Inspiration: MacKay's budget picture (§5.2).
2. **single `<Figure>` (component)** — the tree-subtree claim: a binary tree with
   one length-2 codeword highlighted and the entire subtree beneath it shaded,
   labeled "this codeword claims 1/4 of the tree — all strings starting `10`".
   One idea: a codeword owns its subtree. Inspiration: Cover & Thomas §5.2.
3. **single `<Figure>` (component)** — impossible vs. tight: two small trees side
   by side, `{1,2,2,2}` with overlapping/colliding subtrees (sum 1.25, marked
   infeasible) and `{1,2,3,3}` tiling the tree exactly (sum 1). Two near-identical
   panels, one changed. One idea: overspending forces a collision.
4. **`<FigureSequence>` (3 frames)** — the trade-off: shorten one codeword from
   length 3 to length 1 across frames; watch two other codewords forced longer to
   keep the budget ≤ 1. One idea: short here means long there.
5. **single `<Figure>` (component)** — the construction (sufficiency): lengths
   `{2,2,2,3,3}` sorted, assigned to the next free node left-to-right at each
   depth, producing a valid prefix code. One idea: the greedy placement always
   fits when Kraft holds.
