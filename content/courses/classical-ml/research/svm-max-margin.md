# Maximum margin and the soft-margin SVM — research brief

Lesson: `svm-max-margin` (module: boundaries, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/svm-max-margin/lesson.mdx (26 min).
Goal: Formulate the hard- and soft-margin SVM as a quadratic program and interpret C, slack, and the hinge-loss view.

## Sources
- ESL §4.5 (perceptron's non-uniqueness as the motivating flaw; optimal separating hyperplane), §12.2 (support vector classifier: margin geometry, slack, the QP; Fig 12.1 — the canonical margin picture).
- Mohri §5.1–5.2 (geometric margin definitions done precisely; primal QP; the leave-one-out ≤ #SV/(m+1) bound Thm 5.4 — a real theorem for the lesson).
- SSBD Ch. 15 (Hard-SVM as ERM with margin; soft-SVM ≡ hinge-loss RLM, Claim 15.5 equivalence — derive).
- Bishop §7.1 (margin normalization conventions; Fig 7.3 slack geometry).
- Cortes & Vapnik 1995 — NOT READABLE (flagged in sources.yaml); original framing to be added when the human obtains it.

## Key points
1. Road 3's premise: on separable data infinitely many hyperplanes have zero training error (perceptron finds an arbitrary one — the named flaw); geometry, not likelihood, breaks the tie. The margin as the tie-breaker with a generalization RATIONALE stated as an IOU (module 9 pays; do not fake a proof here — Mohri's LOO bound is the honest down payment).
2. Geometric margin derived: distance point-to-hyperplane |wᵀx+b|/‖w‖; the scaling freedom; canonical normalization y_i(wᵀx_i+b) ≥ 1 giving margin 2/‖w‖; the hard-margin QP min ½‖w‖².
3. The LOO/support-vector bound (Mohri Thm 5.4): E[error] ≤ E[#SV]/(m+1) — proved (short, elegant): removing a non-support point changes nothing. First real evidence sparsity ⇒ generalization.
4. Non-separable reality: slack ξ_i; the soft-margin QP; C as the exchange rate between margin width and violations; the one-outlier-swings-the-plane worked picture.
5. The ERM reading derived (SSBD Claim 15.5): soft-margin ≡ min λ‖w‖² + Σ hinge(y_i f(x_i)) — same objective, module-3 shape (penalty + loss). The loss zoo: hinge vs logistic vs 0–1 on one margin axis; hinge's zero region = "confidently right costs nothing" = sparsity's source.
6. What is NOT yet explained: why maximizing margin helps beyond LOO intuition (module 9's margin-bounds), and how to go nonlinear (next lesson). Both named at the close.

## Set pieces & gems
- ESL Fig 12.1 / Bishop Fig 7.1's margin geometry — recreate as the canonical figure.
- The perceptron flaw-first opening (ESL §4.5.1): same data, three different perceptron runs, three lines.
- Mohri's LOO bound proof — a gem-grade short proof most courses skip.

## Pitfalls
- Do NOT do duality here (next lesson owns Lagrangians/KKT); support vectors appear geometrically (points on/inside margin) with the dual characterization deferred.
- The "maximum margin ⇒ generalization" claim must stay an explicitly flagged IOU — this course's honesty spine depends on it.
- C's direction confuses (big C = hard margin); fix with the exchange-rate framing and one table.

## FIGURE PLAN
- draw: The flaw — same separable scatter, three zero-error lines from three perceptron seeds; "which one?" resolved by the margin corridor in the last panel. FigureSequence (2–3 frames). Inspired by ESL §4.5.
- draw: Margin geometry — the canonical picture: boundary, two margin lines, support points circled, 2/‖w‖ dimensioned like an engineering drawing. Single Figure; key image.
- draw: The normalization move — the same hyperplane at three scalings of (w,b) with the constraint pinning the scale; the QP emerging. Formula-dissection panel.
- draw: Slack anatomy — points at ξ=0 (outside), 0<ξ<1 (inside margin, right side), ξ>1 (misclassified), each labeled with its hinge value. Recreation of Bishop Fig 7.3's idea.
- draw: C sweep — the same overlap data at C = 0.01 / 1 / 100: margin narrowing, support set shrinking; tallies of margin width and violations. Three-panel comparison (matches the demo's presets).
- draw: The loss zoo — 0–1, hinge, logistic (rescaled), squared on one yf(x) axis; hinge's flat zero region shaded amber. Single Figure (shared design with logistic-regression's loss figure — course-level visual continuity).

## EXERCISE PLAN
1. Warm-up: compute the margin of a given (w, b) on 4 labeled points; identify which points would be support vectors.
2. Derivation skipped: prove the distance formula |wᵀx+b|/‖w‖ from projection (the lesson states it; reader derives).
3. Boundary probe: two identical points with opposite labels — hard-margin infeasible; show the soft-margin optimum exists for every C and compute ξ's at the overlap; which hypothesis (separability) died and how slack priced it.
4. Claim to refute: "increasing C always improves training accuracy AND test accuracy since violations get pricier." Training: yes (argue monotonicity of the feasible trade). Test: refute with the one-outlier scenario — large C bends the boundary around noise; name the bias-variance reading.
5. Mixed review (E3): write the soft-margin objective in the λ‖w‖² + Σhinge form and map λ ↔ 1/C exactly; compare term-by-term with ridge-lasso's template — same architecture, different loss.
6. Research-shaped: on 200 separable-with-overlap points (provided generator), fit soft-SVM at 5 C values; plot #support vectors and the LOO bound #SV/(m+1) against measured LOO error — check Mohri's inequality empirically.
7. FORWARD (E7): take the ring-inside-disk dataset; verify NO line achieves better than ~45% error, then map (x₁,x₂) ↦ (x₁,x₂,x₁²+x₂²) by hand and find a separating PLANE. Solution: systematic feature maps and their inner-product shortcut are the next lesson → Ref svm-dual-kernels.

## ARC
- Inherits: roads 1–2's probabilistic boundaries; the penalty+loss template from module 3; the perceptron flaw from the classification canon.
- Contributes: road 3 — the margin objective, its QP, slack/C economics, the hinge-ERM equivalence, and the first sparsity-generalization theorem (LOO bound).
- Hands off: the dual, where the geometry becomes inner products and kernels enter → svm-dual-kernels; the margin-generalization IOU → module 9.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4).

## REVISION (vs old draft)
- Gains: the Mohri LOO bound with proof (new theorem content); the SSBD hinge-equivalence derived rather than stated; the explicit module-9 IOU framing; perceptron flaw-first opening.
- Loses: interview register; "why maximize the margin at all" hand-wave (replaced by LOO bound + IOU honesty).
- Demo: keep SvmMarginExplorer — its drag-a-point task is the module's best D1 demo; spec updated to the falsification task.
