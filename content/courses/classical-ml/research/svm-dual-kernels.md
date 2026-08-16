# The SVM dual and the kernel trick — research brief

Lesson: `svm-dual-kernels` (module: boundaries, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/svm-dual-kernels/lesson.mdx (32 min).
Goal: Derive the SVM dual via Lagrange multipliers and KKT conditions and explain how kernels give nonlinear boundaries at no extra cost.

## Sources
- CS229 §6.5–6.8 (Lagrange duality/KKT at the right depth; dual derivation; SMO one paragraph), §5 (kernel properties, Mercer necessary/sufficient, the d³-blowup example: cubic features of d=1000 → 10⁹ dims at O(d) kernel cost).
- ESL §12.2.1–12.3 (dual eqs 12.10–12.25; the three kernels; SVM as penalization §12.3.2; "skin of the orange" §12.3.4 — kernels do NOT beat the curse for free, Table 12.2).
- Mohri §6.1–6.3 (PDS kernels precisely; RKHS existence Thm 6.8; closure rules; the Tr[K] Rademacher bound stated — module 9's IOU named with its actual number).
- Bishop §6.1–6.2, §7.1 (kernel construction rules table; ν-SVM one sentence).
- SSBD Ch. 16 (representer theorem — ★ statement + proof sketch).

## Key points
1. The dual derived IN FULL (the course's flagship constrained-optimization derivation, proof protocol applied): Lagrangian, ∂w and ∂b stationarity (w = Σα_i y_i x_i falls out), substitution to the dual QP, box constraints for soft margin (0 ≤ α ≤ C — derive the change). Numbered steps matching a figure sequence.
2. KKT complementary slackness read as geometry: α_i > 0 ⟺ on/inside margin — support vectors are a THEOREM, not a definition. The classifier f(x) = Σα_i y_i ⟨x_i, x⟩ + b: data enters via inner products only. This sentence is the hinge of the lesson.
3. The trick: replace ⟨x,x′⟩ with K(x,x′). Polynomial kernel expanded by hand for d=2, degree 2 (the explicit feature map, every term); the d³ cost story; RBF as infinite-dimensional (Taylor argument sketched).
4. What makes a K legal: symmetry + PSD Gram matrices (Mercer stated; the necessity direction proved — easy); kernel algebra (sums, products, scaling) with one composed example; the RKHS named in one honest paragraph (Mohri Thm 6.8) as the space where f lives — no more machinery than module 9 will need.
5. The worked XOR/ring example: ring-inside-disk solved by RBF; γ and C as the two dials; the γ-too-large islands = memorization (demo task).
6. The two honesty sections: (a) "skin of the orange" — polynomial-kernel SVM cannot ignore 6 noise dimensions; kernels move the curse, they don't repeal it; (b) the debt named precisely: an infinite-dimensional feature space with n=200 points SHOULD overfit by every module-1 instinct — why it doesn't is module 9's margin/Tr[K] bound, stated as a promissory note with the formula visible.

## Set pieces & gems
- CS229's 10⁹-dimensional cubic-features arithmetic — the cost story with real numbers.
- ESL Table 12.2 skin-of-the-orange — the anti-hype set piece.
- The degree-2 explicit map (1, √2x₁, √2x₂, x₁², x₂², √2x₁x₂) computed termwise — the trick made honest.
- Bishop's Lagrange portrait (image available) — optional historical garnish; likely skip (L12).

## Pitfalls
- Strong duality/Slater: one sentence ("convex + strictly feasible ⇒ no gap"), not a convex-analysis excursion.
- b's recovery from a margin support vector — include (implementations need it; commonly skipped).
- Do NOT claim SVMs output probabilities; Platt scaling gets one forward sentence to module 5's calibration.

## FIGURE PLAN
- draw: FigureSequence (5 frames) of the dual derivation — Lagrangian assembled; ∂w=0 giving w=Σαyx (highlighted substitution); ∂b=0 constraint; the dual objective emerging; box constraints appearing for soft margin. Formula-dissection with one change per frame. The lesson's centerpiece.
- draw: KKT geometry — the margin picture with each point annotated by its α status (α=0 outside / 0<α<C on margin / α=C inside); the support set as the only ink that matters (others grayed). Single Figure.
- draw: The explicit degree-2 map — left: ring data in 2-D; right: the same points in (x₁², x₂², √2x₁x₂) space with a separating plane; the kernel identity (xᵀz+c)² expanded underneath binding the two panels. Comparison figure.
- draw: Kernel gallery — decision boundaries on one dataset under linear / poly-3 / RBF(γ small) / RBF(γ large), 2×2 with train/test tallies; the γ-large islands highlighted. Matches the demo presets.
- draw: The Gram matrix — heat map of K for 20 ring points sorted by class (block structure visible); "the algorithm sees only this matrix" caption. Single Figure.
- draw: The debt note — the module-1 U-curve with a "?" pin at infinite dimension, and the Tr[K]-bound formula in a gray IOU box pointing at module 9. Small closing Figure.

## EXERCISE PLAN
1. Warm-up: compute the 4×4 Gram matrix for K(x,z)=(xᵀz+1)² on four given 2-D points; check symmetry and PSD via eigenvalues (numeric).
2. Derivation skipped: recover b from a margin support vector's KKT equality; then show the soft-margin case needs 0<α_i<C and why α_i=C points fail.
3. Boundary probe: γ→∞ in the RBF kernel — K→I; show every point becomes a support vector and the classifier degenerates to a lookup table: the memorizer of lesson 1 reborn inside the most sophisticated method so far.
4. Claim to refute: "K(x,z) = −‖x−z‖² is a fine kernel since it measures similarity." Test PSD on 3 points, exhibit the negative eigenvalue, name the failed condition; then fix it (exponentiate → RBF) via the closure rules.
5. Mixed review (E3): show the kernelized classifier is a special case of module 3's basis-expansion regression architecture (fixed features + linear fit) — and name the one structural difference (features chosen implicitly by K, weights supported on data).
6. Research-shaped: reproduce skin-of-the-orange in miniature — 4-D sphere/shell + 6 noise dims, RBF-SVM vs 4-D-only oracle; report the gap and what it says about "kernels beat dimension".
7. FORWARD (E7): compute Tr[K]/n for the RBF Gram matrix (=1) and evaluate Mohri's bound shape √(Tr[K]Λ²)/n on the ring data's fitted ‖f‖; observe it is finite and dimension-free. Solution: this is precisely the bound module 9 proves → Ref rademacher-stability / margin-bounds.

## ARC
- Inherits: the margin QP (svm-max-margin); Lagrange-multiplier fluency (gradient-descent's constrained cousin, cited).
- Contributes: duality as the X-ray revealing inner-product structure; the kernel trick with its costs and its honestly-named open debt.
- Hands off: the module's three roads assembled on real data → spam-filter; the overfitting debt → module 9; kernels themselves return in gaussian-processes and random-features.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4).

## REVISION (vs old draft)
- Gains: the 5-frame dual derivation as a sequence (old is prose-dense); explicit degree-2 map worked termwise; Mercer necessity proof; the two honesty sections (skin-of-orange + the debt note with Tr[K] formula) — the second is new structural material tying to the new module 9; representer-theorem ★.
- Loses: interview register; the γ/C "dials" listicle becomes the kernel-gallery figure + demo task.
- Demo: keep KernelBoundaryExplorer with the memorization-threshold task (D1-compliant).
