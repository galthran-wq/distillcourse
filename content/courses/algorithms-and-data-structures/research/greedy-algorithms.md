# Brief: greedy-algorithms

Goal: design a greedy algorithm and justify it with an exchange argument.
The paradigm's honest framing: usually wrong, provably right in
recognizable cases — the lesson teaches the PROOF OBLIGATION, not greed.

## Sources to consult
- CLRS §15.1 (activity selection; Theorem 15.1 exchange argument —
  earliest-finish-first optimal), §15.2 (elements of the greedy strategy:
  greedy-choice property + optimal substructure; the fractional vs 0/1
  knapsack contrast).
- MIT 6.046 L1: interval scheduling with the cleanest exchange-argument
  proof; the weighted variant where greedy fails and DP takes over — the
  module's seam.
- Erickson §3.5 ("Warning: Greed is Stupid" — the stance: never trust a
  greedy without a proof; use the content, temper the polemic), Ch. 4
  exercise sets (greedy-variant proofs for class scheduling — exercise
  fodder).
- MIT 6.006 L18: rod-cutting greedy counterexample with real numbers
  (best value-per-length piece gives 32; optimum is 33).

## Key points the lesson must cover
1. The greedy template: order by some local criterion, take what fits,
   never backtrack. Cheap to code, O(n log n)-ish — which is exactly why
   an unproven greedy is dangerous (it always RUNS; it silently returns
   suboptimal answers).
2. Interval scheduling worked fully: earliest-finish-time-first; the
   exchange argument carried step by step (greedy's first choice finishes
   no later than any optimal solution's first choice ⇒ swap preserves
   feasibility and count; induct on the rest).
3. Counterexamples as first-class objects: shortest-interval-first and
   fewest-conflicts-first each killed by a small explicit instance
   (3-4 intervals). The skill: hunting counterexamples BEFORE trusting a
   criterion.
4. The two properties named (greedy-choice property, optimal substructure);
   greedy = DP where the choice needs no comparison of subproblem results
   — the formal seam to the next two lessons.
5. Fractional knapsack greedy-optimal (value/weight ordering, exchange
   argument sketched); 0/1 knapsack greedy fails (counterexample) — the
   integral version waits for DP (L10c forward seam).
6. Greedy failures with numbers: rod cutting 32 vs 33 (6.006); coin
   change with denominations {1,3,4} target 6 (greedy 4+1+1=3 coins vs
   3+3=2) — both become DP wins later (E3 spiral setup).

## Worked examples and set pieces
- **Activity-selection instance** (CLRS §15.1's 11-activity table or a
  trimmed 8-activity version): greedy sweep worked; then the same
  instance under shortest-first showing the loss.
- **The exchange argument as a reusable schema**: state it once
  abstractly (any optimal solution can be morphed toward greedy's,
  choice by choice, without loss), then instantiate. This schema is
  reused verbatim for MSTs' cut property (E7: the reader applies
  exchange to "lightest edge across a cut" and lands on the MST lemma,
  <Ref> minimum-spanning-trees).
- **Greedy-fails gallery** (each with its instance): shortest-interval,
  0/1 knapsack, coin change {1,3,4}, rod cutting 32-vs-33. Two in prose,
  two as exercises (E6b claims to refute).

## Pitfalls
- Do NOT include Huffman coding — it is the information-theory course's
  set piece; name it in one closing sentence as another exchange-argument
  greedy with a <course link> if cross-course refs are supported, else
  References only.
- The exchange argument must be carried with full case discipline once;
  hand-waved "clearly we can swap" defeats the lesson.
- "Greedy stays ahead" vs "exchange" proof styles: teach exchange only;
  mention the other name in References (Kleinberg-Tardos).
- Keep the DP seam tight: do not pre-teach memoization here.

## FIGURE PLAN
- draw: interval-scheduling timeline — activities as horizontal bars,
  earliest-finish sweep selecting bars greedily, conflicts grayed out.
  Single <Figure>. Inspired by 6.046 L1's timeline diagrams.
- draw: counterexample pair — the 3-interval instance where
  shortest-first picks 1 bar and earliest-finish picks 2; side-by-side
  panels, tallies under each. Single <Figure>.
- draw: <FigureSequence>, 3 frames: the exchange argument — frame 1 an
  optimal solution O and greedy's first pick g₁; frame 2 O's first
  activity swapped for g₁ (feasibility preserved, count unchanged);
  frame 3 "repeat on the suffix" with the morphed solution converging to
  greedy's. One change per frame.
- draw: fractional vs 0/1 knapsack panel — same 3 items, the fractional
  fill (top slice taken) vs the integral counterexample where
  value/weight order loses. Single <Figure>.
- draw: rod-cutting greedy-vs-optimal bar pair — piece choices and totals
  32 vs 33 annotated. Single <Figure>. Inspired by 6.006 L18.
- draw: decision card — "does the problem have the greedy-choice
  property?" with the two named properties and the greedy/DP fork.
  Single <Figure>.
