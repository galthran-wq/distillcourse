# PAC learning and finite hypothesis classes — research brief

Lesson: `learning-theory` (module: learning-theory, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/learning-theory/lesson.mdx (32 min; was type: extra, titled "Generalization theory: Hoeffding, VC dimension, and bounds"). RE-SCOPED: now the theory module's opener — PAC + finite classes + NFL; VC moves to its own lesson.
Goal: Prove the finite-class PAC bounds from Hoeffding's inequality and the union bound, and state No Free Lunch as the reason inductive bias is mandatory.

## Sources
- SSBD Ch. 2–5 (the backbone: realizable finite-class bound Cor 2.3 with the union-bound proof and Fig 2.1's misleading-samples Venn; agnostic PAC Def 3.3; uniform convergence Ch. 4 (ε-representative samples, Hoeffding, Cor 4.6, the discretization trick); No Free Lunch Thm 5.1 with the full averaging proof; error decomposition eq 5.7).
- Mohri Ch. 2 (the same bounds with explicit constants; Example 2.6's concrete numbers — δ=0.02, ε=0.1, n=10 ⇒ m≥149; the k-term-DNF vs k-CNF representation-dependence gem as ★).
- Murphy §5.4 / CS229 Ch. 8.3 (the 1000-coins trap framing; Hoeffding statement).
- Appendix D of Mohri / SSBD App. B for Hoeffding's proof — cite, prove only the simpler Chernoff-style route in a ★ if at all.

## Key points
1. The module's charter (L10a at module scale): the course has MEASURED generalization (module 5) and EXPLOITED it; now it PROVES it. The wrong-way-cv memory is the hook: guarantees require the hypothesis (class) fixed before the data — the theorem-grade version of the leakage law.
2. Hoeffding for ONE fixed hypothesis: statement, meaning, the 2exp(−2nε²) rate evaluated at real numbers (n=1000, ε=0.03). Then the trap: the guarantee is per-hypothesis; picking the best of many re-opens the gap — the 1000-coins computation (probability some fair coin shows ≥60 heads of 100) done exactly.
3. The union bound as the fix: uniform convergence over finite H; the agnostic bound m ≥ log(2|H|/δ)/(2ε²) DERIVED; the realizable case's better 1/ε rate DERIVED via the misleading-samples argument (SSBD's Venn proof — recreate the figure); "log |H| = bits to write the hypothesis" as the Occam reading.
4. Reading the bounds: sample complexity tables for concrete classes (all C-programs of ≤ k bits; axis-aligned rectangles discretized — the discretization trick honestly explained); estimation-vs-approximation decomposition (eq 5.7) mapped onto module 1's bias-variance vocabulary — the two ledgers reconciled in one table.
5. No Free Lunch: the theorem stated precisely and PROVED via the averaging argument (every learner fails on some distribution when m < |X|/2); its meaning — the memorizer (lesson 1) and NFL are the same fact seen twice; inductive bias is not optional. Course-long threads cashed: zipcode's invariance injection, priors, penalties — all NFL taxes paid up front.
6. The gap that ends the lesson: every interesting class is infinite; |H| = ∞ kills the union bound — the flaw the next lesson repairs (growth function preview in one sentence).

## Set pieces & gems
- The 1000-coins/stockbroker computation — the multiple-comparisons trap quantified (ties BACK to wrong-way-cv and multiple-testing intuition).
- Mohri's m ≥ 149 concrete instantiation — bounds that output numbers.
- SSBD Fig 2.1's misleading-samples Venn — the proof's picture.
- ★ k-term-DNF vs k-CNF (Mohri): learnability depends on REPRESENTATION — a genuinely surprising computational aside.

## Pitfalls
- Keep measure-theoretic caveats to footnote level; state the iid assumption prominently instead (it is the load-bearing one).
- The agnostic/realizable rate difference (1/ε² vs 1/ε) must be explained (variance of near-half-error hypotheses), not just displayed.
- Do NOT start VC dimension; one forward sentence only.

## FIGURE PLAN
- draw: Hoeffding as a picture — the sampling distribution of empirical error around true error narrowing with n; the 2exp(−2nε²) envelope overlaid at two n. Single Figure.
- draw: The 1000-coins trap — FigureSequence (3 frames): one coin's tail probability; 1000 coins' max-deviation distribution; the union-bound ceiling drawn over it. The lesson's cautionary centerpiece.
- draw: The misleading-samples proof — Venn/space-of-samples diagram: for each bad hypothesis the set of samples fooling it; the union's measure bounded; recreation of SSBD Fig 2.1. Proof-figure.
- draw: The bounds as calculators — sample-complexity m(ε, δ, log|H|) surface/table evaluated for three concrete classes (16-bit thresholds; ≤1KB programs; 100 rectangles grid) — the "theory outputs numbers" panel.
- draw: The two ledgers reconciled — estimation+approximation vs bias+variance as two aligned bars over the same model-complexity axis; the vocabulary map between them. Single Figure (module-1 spiral).
- draw: NFL's averaging argument — the 2^{2m} labelings grid with a learner's fate averaged over them; the ½-error conclusion annotated. Proof-sketch figure.

## EXERCISE PLAN
1. Warm-up: evaluate the agnostic bound's m for |H| = 10⁶, ε = 0.05, δ = 0.01; then invert for ε at m = 10,000.
2. Derivation skipped: derive the realizable case's log(|H|/δ)/ε rate (the lesson does agnostic; the reader adapts the misleading-samples argument).
3. Boundary probe: |H| = 1 — no union bound needed, Hoeffding alone; and H = all functions on a finite X — the bound is vacuous exactly when NFL bites; compute both ends for |X| = 20.
4. Claim to refute: "with 10⁶ test examples our model's measured 2% error proves 2%±0.1% for future data — no theory needed." Refute by locating the hidden hypothesis-selection: the model was CHOSEN using data (validation reuse across a project = the coins trap); state when the naive Hoeffding reading IS valid (a single prespecified model, fresh test set — module 5's Theorem-11.1-style setting).
5. Mixed review (E3): recompute the wrong-way-cv screening pipeline's effective |H| (choose-100-of-5000) and show the union-bound term log|H| ≈ 342 makes the observed 3% unsurprising — the blunder priced by theory.
6. Research-shaped: for the spam corpus's logistic model class discretized to 8 bits/coefficient (57 features), compute the PAC bound's promised ε at n = 3,000 and compare with the measured test error — experience the bound's looseness, quantified (feeds bounds-vs-practice).
7. FORWARD (E7): count the number of DISTINCT labelings 1-D threshold classifiers realize on 5 points (6, not ∞) — an infinite class acting finite. Solution: that count is the growth function, next lesson's object → Ref vc-dimension.

## ARC
- Inherits: risk/ERM/the memorizer (module 1), measured generalization and the leakage law (module 5).
- Contributes: the first proved guarantees — concentration + union bound — the NFL floor, and the two-ledger reconciliation.
- Hands off: infinite classes → vc-dimension.
- Spine step: "Why any of it works: concentration plus a capacity measure turns finite samples into guarantees…" (step 9).

## REVISION (vs old draft)
- Re-scope: the old extra lesson covered Hoeffding AND VC AND the bound zoo in 32 min; VC/growth-function/SRM content MOVES OUT to vc-dimension. This lesson keeps and deepens: PAC definitions (new), full proofs of both finite-class bounds (draft sketches), NFL with proof (new), the reconciliation table (new), the coins trap done exactly.
- Type change: extra → core (the theory module is core by design mandate).
- Gains: module-charter opening; wrong-way-cv pricing exercise; concrete-numbers discipline throughout.
- Loses: interview register; the "N ≥ 10·d_vc rule of thumb" (moves to vc-dimension); any Abu-Mostafa-style framing left from the old draft's sources.
