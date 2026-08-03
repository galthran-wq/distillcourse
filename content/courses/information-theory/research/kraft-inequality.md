# Research brief: kraft-inequality (The Kraft inequality)

status: drafted (kept slug — revise, do not rewrite)
module: coding
type: core
goal: Apply the Kraft inequality to decide whether a set of codeword lengths is achievable by a prefix code.
est_minutes: 32

## ARC

- **Inherits:** the code tree and expected length (`prefix-codes`), and the
  question that lesson could not answer: which length sets are realisable.
- **Spine step:** step 3, *Entropy is a code length* — "Codeword lengths spend a
  budget of fixed size…"
- **Contributes:** the budget `Σ 2^{-l_i} ≤ 1`, in both directions, plus
  McMillan's extension to every uniquely decodable code. Everything downstream
  that reads a code as a probability model (`source-coding-theorem-lite`,
  `kl-divergence`, `minimum-description-length`) is standing on this.
- **Hands off to:** `huffman-by-hand`, which picks the best legal length set.

## Sources to consult

- Cover & Thomas, **§5.2** — Theorem 5.2.1, both directions via the code-tree /
  interval argument; **§5.5** — McMillan's theorem for uniquely decodable codes.
- MacKay, **ch. 5 §5.2** — the total-budget-of-one framing, which is the
  CodewordBudget demo's model.
- Weissman (EE376A), **ch. 4 §4.4** — the `k`-th power counting proof of
  Kraft-McMillan, stated compactly.
- Polyanskiy & Wu, **§6.2** — the probabilistic proof of Kraft (flip fair coins
  until a codeword completes; the sum is literally a termination probability).
  This is a genuinely different argument worth a starred section.

## Key points the lesson must cover

1. A codeword of length `L` claims `2^{-L}` of the tree below it — all infinite
   strings with that prefix. Open by marking one length-2 codeword and shading
   its quarter.
2. **Necessity**: in a prefix code the claimed subtrees are disjoint, so the
   fractions sum to at most one. Prove by pushing every leaf to a common maximal
   depth and counting descendants.
3. **Sufficiency**: given lengths obeying the budget, assign codewords in
   nondecreasing length order to the next free node. This is a genuinely
   different argument; show the construction on `{1,2,3,3}`.
4. **Equality** marks a complete code with no wasted nodes. Worked against the
   impossible `{1,2,2,2}` (sum 1.25).
5. **McMillan**: every uniquely decodable code obeys the same bound (proof
   sketch via `(Σ 2^{-l_i})^k` and counting strings by length). So restricting
   to prefix codes gives up nothing — the hook the source coding theorem needs.

## Pitfalls / subtleties to flag

- Kraft is about the **existence of lengths**, not about any particular code or
  its optimality. Satisfying Kraft makes a code possible, not good.
- The budget bounds combined length-cost, not the number of codewords.
- `2^{-L}` is a tree share, not a probability — though the next lesson but one
  will read it as one. Flag, defer.
- McMillan is stated at proof-sketch level; do not claim a full proof.
- Sufficiency needs the lengths sorted; out-of-order assignment can strand a
  short codeword above an already-used node. Show the failure.

## FIGURE PLAN

1. `draw:` **NEW, single `<Figure>`** — the subtree claim: a binary tree with one
   length-2 codeword highlighted and its whole subtree shaded, labelled "this
   codeword claims 1/4 of the tree".
2. `draw:` **budget-fill-1..5.svg** (exist, `<FigureSequence>`) — adding
   `{1,2,3,3}` one at a time, the bar filling 1/2, 1/4, 1/8, 1/8 to exactly
   full, a fifth attempt overflowing red.
3. `draw:` **NEW, single `<Figure>`** — impossible against tight: `{1,2,2,2}`
   with colliding subtrees (sum 1.25) beside `{1,2,3,3}` tiling exactly.
4. `draw:` **construction-1..4.svg** (exist, `<FigureSequence>`) — the
   sufficiency construction, shortest-first placement.
5. `draw:` **tradeoff-1..3.svg** (exist, `<FigureSequence>`) — shortening one
   codeword forces two others longer.
6. `draw:` **NEW, single `<Figure>`** — McMillan's reach: nested classes
   (uniquely decodable ⊃ prefix) with `Σ 2^{-l_i} ≤ 1` written across both.
7. `draw:` **NEW, single `<Figure>`** — the out-of-order failure: assigning
   `{3,1,2}` in the given order strands the length-1 codeword; the same lengths
   sorted fit. One idea: the construction needs the sort.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* For each of four given length sets, compute the Kraft sum and
   state whether a prefix code exists; for the feasible ones, exhibit a code.
2. **Boundary probe.** A length set sums to exactly 1 minus `2^{-7}`. What does
   the slack mean structurally, and what is the longest codeword you could still
   add? Then state what the slack costs in expected length if the source is
   uniform.
3. **Claim to refute.** "A code satisfying Kraft with equality is optimal."
   Produce a distribution and a Kraft-tight code that is not optimal for it, and
   name what equality actually guarantees.
4. **Derivation the lesson skipped.** Run McMillan's counting argument
   yourself for `k = 2` on a specific 3-codeword code: expand
   `(Σ 2^{-l_i})^2`, interpret each term as a concatenation, and show the count
   of length-`m` strings bounds the sum.
5. **Second proof (derivation).** Reconstruct the probabilistic proof: flip a
   fair coin repeatedly and stop when the string so far is a codeword. Show that
   `Σ 2^{-l_i}` is the probability of ever stopping, hence at most 1. Say which
   property of prefix codes makes the events disjoint.
6. **Mixed review (E3).** For `{A:.5, B:.25, C:.15, D:.1}`, list every length
   set that satisfies Kraft with equality and has maximum length 3. Compute `L`
   for each and identify the best.
7. **FORWARD (E7).** Given a prefix code with lengths `l(x)`, define
   `q(x) = 2^{-l(x)}`. Verify on a Kraft-tight example that `q` is a probability
   distribution, then compute `Σ p(x) l(x)` and `Σ p(x) log2 (1/q(x))` and note
   that they are the same number. Reaches `source-coding-theorem-lite` and
   `kl-divergence` — the solution names the code-as-a-bet reading and `<Ref>`s
   both.

## REVISION (kept slug)

**Gain**
- ARC paragraph; the current draft's framing paragraph is about the re-split
  history, which is editorial, not argumentative.
- Figures 1, 3, 6, 7 above.
- The probabilistic proof of Kraft as a `## ★` starred section (L2b) — it is a
  genuinely different and elegant argument, and it is off the main line.
- Depth toward 32 minutes: the necessity proof (push leaves to common depth,
  count) written out with a worked tree rather than described.
- Exercise set rebuilt against the floor above.

**Lose**
- Restating the inequality in a callout after proving it (L15). If a `<KeyFact>`
  stays, it carries McMillan's extension — that is the part a reader would
  otherwise leave without.
- Any claim that McMillan is proved here rather than sketched.
