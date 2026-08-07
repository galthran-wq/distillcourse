# Brief: recurrences-and-master-theorem

Goal: solve divide-and-conquer recurrences by recursion tree and Master
theorem. Completes the analysis toolkit (module throughline: notation →
correctness → recursive running time).

## Sources to consult
- CLRS §2.3 (merge-sort recurrence + Fig 2.5 recursion tree built level by
  level), §4.3 (substitution), §4.4 (recursion-tree method, Fig 4.2 unbalanced
  tree for T(n)=T(n/3)+T(2n/3)+cn), §4.5 (Master theorem, Theorem 4.1, three
  cases). SKIP §4.6-4.7 (continuous master theorem, Akra-Bazzi — starred,
  course-2 depth).
- Erickson §1.7: recursion trees as the primary tool; the three regimes
  (decreasing / equal / increasing level sums); "Ignoring Floors and Ceilings
  Is Okay, Honest" — license to keep the algebra clean. Figs 1.9-1.11.
- CMU 15-210 L2: the "brick method" naming — root-dominated / leaf-dominated /
  balanced — a memorable classification that matches the Master cases exactly.

## Key points the lesson must cover
1. Reading a recurrence off code: recursive calls give a·T(n/b), the rest of
   the body gives f(n). Merge sort's T(n) = 2T(n/2) + Θ(n) derived from its
   structure (merge itself arrives properly in the sorting lesson; here it is
   "an O(n) combine step").
2. The recursion-tree method worked in full: levels, work per level, number of
   levels log_b n, sum the level totals. Merge sort: every level totals cn,
   log n levels ⇒ Θ(n log n).
3. The three shapes: level sums decreasing (root dominates, Θ(f(n))), equal
   (balanced, Θ(f(n)·log n)), increasing (leaves dominate, Θ(n^{log_b a})).
   Name the comparison quantity n^{log_b a} = number of leaves.
4. Master theorem stated as the formalization of (3); apply to at least four
   recurrences: T(n)=2T(n/2)+Θ(n) (case 2), T(n)=T(n/2)+Θ(1) (binary-search
   shape, case 2), T(n)=4T(n/2)+Θ(n) (case 1, Θ(n²) — the naive-multiplication
   recurrence, forward pointer to divide-and-conquer-design), T(n)=2T(n/2)+Θ(n²)
   (case 3).
5. Substitution (guess-and-check by induction) in one compact section: verify
   the merge-sort guess; this reinforces the induction machinery from the
   invariants lesson.
6. What the Master theorem does not cover: unequal splits (Fig 4.2 example —
   solved by tree instead), subtract-and-conquer T(n)=T(n-1)+n (solved by
   direct summation; this is quicksort's worst case, forward pointer).

## Worked examples and set pieces
- **Merge-sort tree built level by level** (CLRS Fig 2.5) — the lesson's
  central FigureSequence.
- **Unbalanced 1:2 split tree** (CLRS Fig 4.2): longest path governs the
  log — shows the tree method surviving where the Master theorem's hypotheses
  fail.
- **Brick method naming** (CMU L2): adopt "root-dominated / balanced /
  leaf-dominated" as the running vocabulary; bind each to a Master case.
- E7 forward-reach exercise: solve T(n)=3T(n/2)+Θ(n) and T(n)=4T(n/2)+Θ(n);
  the gap between n^{log₂3} ≈ n^1.585 and n² is exactly Karatsuba's payoff,
  named in divide-and-conquer-design (<Ref>).

## Pitfalls
- Master theorem case 3 has a regularity condition; state it once, note it
  holds for every polynomial f in this course, and move on.
- Do not let the lesson become a solve-20-recurrences drill; 4-5 in prose,
  more in exercises (E6 mix: one boundary probe — what happens when
  f(n) = Θ(n^{log_b a} log n), the case-2 boundary).
- Floors/ceilings: assert Erickson's license (domain transformation exists),
  don't prove it.
- Keep "recurrence" tied to running time only; DP recurrences over values
  come much later (dynamic-programming-i) — one forward sentence at most.

## FIGURE PLAN
- draw: <FigureSequence>, 4 frames: merge-sort recursion tree — frame 1 root
  with cn work, frame 2 adds level 1 (two cn/2 nodes, level total cn), frame 3
  full tree to leaves, frame 4 level totals summed to cn·log n. One change per
  frame. Inspired by CLRS Fig 2.5.
- draw: three trees side by side — root-dominated, balanced, leaf-dominated —
  with level-total bars beside each and the Θ answer under each. Single
  <Figure>. Inspired by Erickson Fig 1.9 / CMU brick method.
- draw: the unbalanced T(n)=T(n/3)+T(2n/3)+cn tree with the shortest and
  longest root-leaf paths marked (log₃ n vs log_{3/2} n). Single <Figure>.
  Inspired by CLRS Fig 4.2.
- draw: Master-theorem decision diagram — compare f(n) to n^{log_b a}, three
  labeled outcomes, one worked instance attached to each branch. Single
  <Figure>.
- draw: leaves-count derivation panel — a levels × branching sketch showing
  a^{log_b n} = n^{log_b a}. Single <Figure>, small, co-located with the
  case-1 discussion.
