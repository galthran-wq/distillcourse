# Research brief: kraft-inequality (The Kraft inequality)

status: planned
module: coding
type: core
goal: Apply the Kraft inequality to decide whether a set of codeword lengths is achievable by a prefix code.

Second half of the re-split. `prefix-codes` established the tree/code
correspondence and expected length; this lesson answers the question that
raises: which sets of codeword lengths can a prefix code actually have? The
Kraft budget answers it, and McMillan shows the answer is the same for every
uniquely decodable code — the fact the source coding theorem leans on.

## Sources to consult

- Cover & Thomas, **§5.2 "Kraft Inequality"** — Theorem 5.2.1: a prefix code
  with lengths `l_i` exists iff `Σ 2^{-l_i} ≤ 1`; both directions via the
  code-tree / interval argument.
- Cover & Thomas, **§5.5 "Kraft Inequality for Uniquely Decodable Codes"** —
  McMillan's theorem: the same bound for the broader class, so prefix codes lose
  nothing. State the result and the polynomial-of-lengths proof idea.
- MacKay, **ch. 5, §5.2** — the total-budget-of-1 framing of Kraft, which is the
  CodewordBudget demo's model.

## Key points the lesson must cover

1. **A codeword of length `L` claims `2^{-L}` of a budget of 1** — the fraction
   of the infinite binary tree below it (all strings with that prefix). Concrete
   opener: mark one length-2 codeword and shade its quarter of the tree.
2. **Necessity**: in a prefix code the codewords' subtrees are disjoint, so the
   claimed fractions sum to `Σ 2^{-l_i} ≤ 1`. Prove by pushing every leaf down
   to a common maximal depth and counting descendants.
3. **Sufficiency**: given lengths with `Σ 2^{-l_i} ≤ 1`, a prefix code with those
   lengths exists — assign codewords in nondecreasing length order, each to the
   next free node. Necessity and sufficiency are genuinely two different
   arguments; show the construction on `{1,2,3,3}`.
4. **Equality `Σ 2^{-l_i} = 1`** ⇔ a complete code, no wasted tree nodes; worked
   with the demo presets: impossible `{1,2,2,2}` (sum 1.25), tight `{1,2,3,3}`
   (sum 1).
5. **McMillan**: any uniquely decodable code obeys the same inequality (proof
   sketch: raise `(Σ 2^{-l_i})^k` and bound the coefficient count by string
   length). So nothing is lost by restricting to prefix codes — the hook the
   source coding theorem uses.

## Pitfalls / subtleties to flag

- Kraft is about the **existence of lengths**, not about a specific code or its
  optimality; satisfying Kraft makes a code possible, not good. The best
  assignment of lengths is the next lesson (Huffman).
- Budget `≤ 1` does **not** bound the *number* of codewords; it bounds their
  combined length-cost. Many short codewords overspend; many long ones do not.
- The `2^{-L}` fraction is the tree share, not a probability — though the
  source coding theorem will read it as one (`q(x) = 2^{-l(x)}`). Flag, defer.
- McMillan's theorem is stated at proof-sketch level; do not claim a full proof.
- Sufficiency needs the lengths sorted; assigning out of order can strand a
  short codeword above an already-used node.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the tree-subtree claim: a binary tree with
   one length-2 codeword highlighted and its entire subtree shaded, labeled
   "this codeword claims 1/4 of the tree — all strings starting `10`". One idea:
   a codeword owns its subtree. Inspiration: Cover & Thomas §5.2.
2. **`<FigureSequence>` (4 frames)** — the budget bar filling: add codewords
   `{1,2,3,3}` one at a time, bar fills by `1/2, 1/4, 1/8, 1/8` to exactly full;
   a fifth attempted codeword overflows red. Static twin of the CodewordBudget
   demo. Delta = one codeword per frame. Inspiration: MacKay's budget picture
   (§5.2).
3. **single `<Figure>` (component)** — impossible vs. tight: two small trees side
   by side, `{1,2,2,2}` with colliding subtrees (sum 1.25, infeasible) and
   `{1,2,3,3}` tiling the tree exactly (sum 1). One idea: overspending forces a
   collision. Inspiration: playbook two-panel comparison.
4. **`<FigureSequence>` (3 frames)** — the sufficiency construction: sort lengths
   `{1,2,3,3}`; each frame plants the next codeword at the shallowest free node
   and greys out its subtree, ending with the finished prefix code. One idea:
   shortest-first placement always fits when the budget holds.
5. **`<FigureSequence>` (3 frames)** — the trade-off: shorten one codeword from
   length 3 to length 1 across frames; two other codewords forced longer to keep
   the budget `≤ 1`. One idea: short here means long there.
6. **single `<Figure>` (component)** — McMillan reach: a Venn of code classes
   (uniquely decodable ⊃ prefix), with `Σ 2^{-l_i} ≤ 1` written across both,
   annotated "same length budget — prefix codes give up nothing". One idea: the
   bound is not special to prefix codes. Inspiration: Cover & Thomas §5.1/§5.5.
