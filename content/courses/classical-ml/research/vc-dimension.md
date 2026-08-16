# VC dimension and the fundamental theorem — research brief

Lesson: `vc-dimension` (module: learning-theory, core, planned). NEW (content split out of the old learning-theory extra and deepened).
Goal: Compute VC dimensions, prove Sauer's lemma, and state the fundamental theorem tying finite VC dimension to PAC learnability.

## Sources
- SSBD Ch. 6 (the backbone: shattering, VC dims computed — thresholds 1, intervals 2, rectangles 4, halfspaces d+1, finite classes ≤ log₂|H|; the sin(θx) infinite-VC one-parameter class; Sauer–Shelah–Perles Lemma 6.10 with the inductive proof; the fundamental theorem 6.7/6.8 with quantitative rates; the ghost-sample/symmetrization uniform-convergence proof §6.5.2 as ★ roadmap), Ch. 28 pointer (full proof).
- Mohri Ch. 3 (Radon's-theorem proof for halfspaces d+1; growth-function bounds via Massart; the lower bounds §3.4 via the probabilistic method — statement + idea).
- ESL §7.9 (the practitioners' reading; SRM one paragraph).
- Murphy §5.4.4 (context sentence only).

## Key points
1. The repair named: |H| was the wrong measure — what matters is how many LABELINGS H realizes on THESE n points. Growth function defined; the threshold example (n+1 labelings on n points) computed; restriction-to-a-set notation minimal.
2. Shattering and VC dimension; the computed gallery, each with BOTH directions argued (a shattered set exhibited; no larger set shatterable proved): thresholds (1), intervals (2), axis-aligned rectangles (4 — the interior-point argument), halfspaces in ℝ^d (d+1 — Radon's theorem proved, it's two paragraphs), finite classes (≤ log₂|H|).
3. The anti-parameter-counting counterexample: {sign(sin(θx))} has ONE parameter and infinite VC dimension (construction stated with the binary-digits idea) — capacity ≠ parameter count. KeyFact-grade; module 11 will echo it (double descent's capacity confusions).
4. Sauer's lemma PROVED (the induction on n+d — SSBD's shifting/counting proof carried); the dichotomy read: growth is 2ⁿ forever or ≤ (en/d)^d — "nothing in between"; plug into the finite-class machinery via the ★ symmetrization roadmap (double sample + Massart idea in 5 honest steps, full proof cited to SSBD Ch. 28).
5. The fundamental theorem: finite VC ⟺ agnostic PAC learnable, with rates Θ((d + log 1/δ)/ε²) (and realizable d·log(1/ε)/ε); the LOWER bound stated (no learner does better — the probabilistic-method idea in one paragraph) — capacity is a law, not an upper-bound artifact.
6. The bounds applied to the course's own models: halfspaces on 57 spam features (d+1 = 58; m for ε=0.05 computed); depth-limited trees (count leaves → VC bound); the N ≥ 10·d_vc folk rule placed against the theorem's constants; where it goes VACUOUS: RBF-kernel machines (infinite VC) and boosted ensembles after many rounds (VC grows with T — the bound predicts doom that does not happen; both debts re-stated sharply). The cliff-hanger is structural.

## Set pieces & gems
- The sin(ωx) counterexample — the canon's sharpest "parameters lie" fact.
- Radon's theorem — an unexpected two-paragraph gem of convex geometry deciding a learning question.
- Sauer's lemma's history (Sauer answering Erdős; Shelah–Perles; Perles forgetting and re-proving it — SSBD's bibliographic note) — one dry historical sentence, it humanizes without cost.
- "If someone can explain every phenomenon, his explanations are worthless" (SSBD §6.2) — quote once as the VC idea's epigraph-grade line.

## Pitfalls
- The uniform-convergence proof (symmetrization) is genuinely hard: roadmap + ★, never fake-complete it; point to SSBD Ch. 28 explicitly.
- Rectangles' VC = 4 needs the "5th point inside the hull" argument done right (the diamond configuration).
- Do not teach SRM machinery (one paragraph as the bridge from bounds to model selection, tying BACK to module 5's nested CV as its empirical cousin).

## FIGURE PLAN
- draw: Growth function vs 2ⁿ — log-scale curves for thresholds/intervals/rectangles vs the 2ⁿ line, the polynomial bend visible at each class's d. Single Figure; the dichotomy's portrait.
- draw: The shattering gallery — FigureSequence (4 frames): 3 points shattered by halfspaces (all 8 labelings drawn small); 4 points' two cases (convex position → XOR labeling fails; one-inside → interior labeling fails) — the d+1=3 proof for ℝ² made visual.
- draw: Radon's theorem — 4 points in ℝ² split into two subsets with intersecting hulls (both configurations); the one-line consequence for shattering. Proof-figure.
- draw: The sin(θx) monster — one parameter, points on the axis labeled arbitrarily by wild oscillation at huge θ; "parameters ≠ capacity" stamped. Single Figure.
- draw: Sauer's induction — the counting table/staircase for the shifting argument at small (n, d) with the recursion arrows. Proof-figure (formula-dissection genre).
- draw: The vacuous frontier — the VC bound evaluated (curves of promised ε vs n) for halfspaces-58 (useful) vs boosted-stumps-at-T (curve drifting up with T) vs RBF (off the chart); the two debts pinned. Key image; the module's cliffhanger drawn.

## EXERCISE PLAN
1. Warm-up: exhibit 2 points shattered by 1-D intervals and prove 3 cannot be (the middle-point labeling).
2. Derivation skipped: prove VCdim(finite H) ≤ log₂|H|, and construct an H achieving it — both directions.
3. Boundary probe: VCdim of the class containing a single hypothesis (0); of unions H₁∪H₂ (bound it — the exercise SSBD sets); what d=0 does to the fundamental theorem's rate.
4. Claim to refute: "a class with 10⁶ parameters needs ~10⁶ samples." Both directions broken: sin(θx) (1 parameter, unlearnable) and a heavily-regularized 10⁶-parameter linear class (learnable — margin/norm control preview); name what actually enters the theorem (d, not parameter count).
5. Mixed review (E3): compute the growth function of 1-D thresholds exactly (n+1) and verify Sauer's bound (en/1)¹ dominates it; then the learning-theory forward exercise's count (6 labelings on 5 points by thresholds… reconcile: thresholds one-sided vs two-sided classes — a definitional-care item).
6. Research-shaped: for depth-3 binary trees on 10 binary features, upper-bound the number of distinct functions and hence VC ≤ log₂|H|; evaluate the PAC bound at n = 5,000 and compare with a measured CV error on synthetic data (the gap quantified — feeds bounds-vs-practice).
7. FORWARD (E7): compute the empirical Rademacher-style quantity for halfspaces on 20 fixed points: the best correlation with 5 random ±1 labelings (by direct search on a small grid). Solution: that average-best-correlation is Rademacher complexity — the data-dependent capacity of the next lesson → Ref rademacher-stability.

## ARC
- Inherits: the finite-class machinery and its infinite-class failure (learning-theory).
- Contributes: the right capacity measure, its combinatorial law (Sauer), and the fundamental theorem with both directions — plus the precise statement of where this tool goes vacuous on the course's two debts.
- Hands off: data-dependent capacity and algorithm-dependent guarantees → rademacher-stability.
- Spine step: "Why any of it works…" (step 9).
