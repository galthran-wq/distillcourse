# Brief: balanced-search-trees

Goal: explain how rotations + a balance invariant guarantee O(log n). This
lesson is invariant-and-mechanism, NOT an exhaustive case catalog — the goal
verb is "explain", so derive the machinery on AVL (simpler fixup) and present
red-black via the 2-3/2-4 correspondence conceptually.

## Sources to consult
- CLRS Ch. 13: §13.1 (five red-black properties; height ≤ 2 lg(n+1) —
  Lemma with the black-height argument), §13.2 (rotations, Figs 13.2/13.3 —
  the local pointer-surgery diagram). Skim §13.3-13.4 for the "constant
  rotations per update" fact; do NOT reproduce the case tables.
- Sedgewick 3.3: the 2-3 tree ↔ left-leaning red-black correspondence
  (red links = glued 3-nodes) — the canonical explanation of WHY the
  red-black rules exist; height ≤ 2 lg n, average path ~1.0 lg n.
- Morin ODS Ch. 9: 2-4 tree simulation view; §9.4 AVL comparison — height
  ≤ log_φ n ≈ 1.44 lg n via the Fibonacci recurrence.
- MIT 6.006 L07: AVL — rotations, the two-line height proof
  (F(h) ≥ 2F(h-2) ⇒ F(h) ≥ 2^{h/2}), local rebalance cases (single vs
  double rotation), O(log n) rotations per insert.
- CS166 L06-07: the "derive, don't memorize" stance; the meta-node
  hoisting picture; the fact log (insert ≤2 rotations, delete ≤3 for RB).

## Key points the lesson must cover
1. The flaw restated from last lesson: sorted insertion ⇒ O(n). The fix
   shape: an invariant that forces h = O(log n), plus a local O(1) repair
   operation (rotation) that restores it after each update.
2. Rotation: the before/after pointer surgery; preserves the BST invariant
   (in-order sequence unchanged — state and check on an example).
3. AVL invariant (sibling heights differ ≤ 1) worked as the concrete
   mechanism: the height bound via the Fibonacci-style minimum-size
   recurrence N(h) ≥ 1 + N(h-1) + N(h-2) ⇒ h ≤ 1.44 lg n (6.006's compact
   proof — carry it, it is two lines).
4. Insert fixup on AVL: walk back up, at the first unbalanced node apply
   single or double rotation; the four cases LL/LR/RL/RR shown as two
   mirror-pairs. Worked example: insert 1..6 ascending, watch three
   rotations keep height 3.
5. Red-black trees: the five properties; height ≤ 2 lg(n+1) from the
   black-height argument; the 2-3/2-4 correspondence as the reason the
   rules are what they are (red = internal edge of a fused multi-node).
   Constant rotations per update — why libraries (C++ map, Java TreeMap,
   Linux kernel) default to red-black.
6. The scoreboard updated: all dictionary + order operations O(log n)
   worst case; contrast row against hash table (expected O(1), no order).

## Worked examples and set pieces
- **Insert 1..6 ascending into an AVL tree** — the anti-degeneracy demo run,
  also worked in prose frame by frame.
- **2-3 correspondence picture** (Sedgewick 3.3): a red-black tree with red
  links drawn horizontally, then red nodes hoisted into their parents to
  reveal the 2-3 tree — recreate as the conceptual centerpiece.
- **The telephone-company lawsuit** (Sedgewick 3.3 slide 44): a real-time DB
  capped tree height at 80 assuming 2 lg n; Hibbard deletions broke the
  assumption; outage → lawsuit → expert witness testimony "if implemented
  properly, height ≤ 2 lg N". The L16-flavored payoff: the height theorem is
  a contractual guarantee. Also closes the Hibbard thread from last lesson.
- **Red-black provenance** (Guibas-Sedgewick 1978 at Xerox PARC): one
  paragraph; the source image carries it.
- E7 forward-reach exercise: build-heap comparison teaser — "why not keep
  ALL data this organized? next structure keeps less order for less cost"
  (<Ref> binary-heaps-and-priority-queues).

## Pitfalls
- Do NOT reproduce CLRS's full RB-insert/delete case analysis; the lesson
  dies there. AVL carries the mechanism; RB carries the concept + library
  reality.
- The φ/Fibonacci bound: present the recurrence and the 2^{h/2} shortcut;
  the exact 1.44 constant is a cite, not a derivation.
- Keep "rotation count" vs "fixup walk length" distinct (RB does O(log n)
  recolorings but O(1) rotations).
- B-trees: one forward sentence (course 2, disk structures) — no more.

## FIGURE PLAN
- draw: rotation as pointer surgery — before/after pair with subtrees as
  labeled triangles (A, B, C stay in in-order positions). Single <Figure>.
  Inspired by CLRS Fig 13.2.
- draw: <FigureSequence>, 5-6 frames: AVL inserts 1..6 — each frame one
  insert or one rotation event, balance factors annotated, the violated
  node highlighted before its rotation. Inspired by 6.006 L07 cases.
- draw: single vs double rotation — the LR case where one rotation fails
  and the two-step fix works. Single <Figure>, two panels.
- draw: minimum-size AVL trees of heights 1..4 (Fibonacci counts 2,4,7,12)
  — the visual behind N(h) ≥ 1+N(h-1)+N(h-2). Single <Figure>.
- draw: 2-3 ↔ red-black correspondence — same tree drawn both ways, red
  links horizontal, hoisting arrows. Single <Figure>. Inspired by
  Sedgewick 3.3's canonical diagram (recreate in house style).
- source: algorithmspa-s1-guibas-sedgewick-1979-fig-000 — save under
  figures/ as `guibas-sedgewick-1978-page1.png`. Reader must be able to
  see: the paper title "A Dichromatic Framework for Balanced Trees", the
  authors, and the IEEE typesetting. Placement: float right beside the
  provenance paragraph. (Scan of the original paper; a redraw would
  falsify the artifact.)
- draw: height-bound comparison strip — perfect lg(n+1), AVL 1.44 lg n,
  red-black 2 lg(n+1), degenerate n, drawn as bars at n = 10^6. Single
  <Figure>.
