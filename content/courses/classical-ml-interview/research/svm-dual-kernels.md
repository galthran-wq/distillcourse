# Research brief: svm-dual-kernels (The SVM dual and the kernel trick)

status: planned
module: svm-kernels
type: core
goal: Derive the SVM dual via Lagrange multipliers and KKT conditions and explain how kernels give nonlinear boundaries at no extra cost.

The heaviest derivation lesson in the course; the human's design intent names
"SVM dual/kernel trick" explicitly. Heavy math in the middle, per playbook.

## Sources to consult

- CS229 **§6.5–6.6** — Lagrange duality and KKT in exactly the depth needed;
  the dual derivation: ∂L/∂w = 0 → w = Σαᵢyᵢxᵢ, Σαᵢyᵢ = 0, substitute back
  → W(α) = Σαᵢ − ½ΣΣαᵢαⱼyᵢyⱼ⟨xᵢ,xⱼ⟩; dual complementarity → support
  vectors; kernelized decision rule; §6.7 box constraint 0 ≤ α ≤ C; SMO
  §6.8 as a one-sentence pointer only.
- Cortes & Vapnik 1995 **Appendix A.1** — the original Kuhn–Tucker
  derivation; **Eq 5**: E[Pr(error)] ≤ E[#SV]/N; **Table 2 gem**: USPS
  degree-1→7 polynomial kernels, error flat ~4.3% and #SV ~200 while feature
  dimension explodes 256 → ~10^16 — the empirical punchline that margin, not
  dimension, controls generalization. Recreate as a table-figure.
- CS229 **ch. 5** — feature maps and the kernel definition; Mercer's theorem
  (Gram matrix PSD ⇔ valid kernel); the polynomial-kernel expansion showing
  O(d) computation of an O(d^k)-dimensional inner product.
- CS4780 **Lecture 13–14** — the kernel-trick induction proof (GD weight
  vector stays in the span of the data — the representer-style argument);
  kernel composition rules; the worked proof that RBF is a valid kernel;
  kernel SVM as "smart nearest neighbor" analogy; recovering b from any
  support vector.
- Bishop **§6.1–6.2** — dual representations for regularized least squares
  (kernels are not SVM-specific — one Aside); kernel construction rules.
- ESL **§12.3** — kernels as penalization/RKHS view, one-sentence pointer
  for depth; SVM-vs-logistic loss comparison already covered last lesson.

## Key points the lesson must cover

1. Recap primal (one sentence + Ref). Lagrangian mechanics minimal toolkit:
   multipliers for inequality constraints, when strong duality holds
   (convex + Slater — one sentence), KKT conditions named: stationarity,
   feasibility, dual feasibility, complementary slackness.
2. **The dual derivation in full** — the set piece. Every algebra step:
   Lagrangian, the two stationarity equations, substitution, the final dual
   QP with constraints Σαᵢyᵢ=0, αᵢ≥0. Then the soft-margin version: only
   change is 0 ≤ αᵢ ≤ C (state, one-line reason via the ξ multipliers).
3. **Support vectors from KKT**: complementary slackness αᵢ[yᵢf(xᵢ)−1] = 0
   → αᵢ > 0 only where the constraint is tight; three α regimes (α=0
   outside; 0<α<C on margin; α=C inside/violating). Sparsity of the
   solution; prediction f(x) = Σ_SV αᵢyᵢ⟨xᵢ,x⟩ + b; recover b from a
   margin SV.
4. **The kernel trick**: everything above touches data only via ⟨xᵢ,xⱼ⟩;
   define K(x,x') = ⟨φ(x),φ(x')⟩; the degree-2 polynomial worked example
   computing both sides (L4 concrete-first); catalogue: polynomial
   (1+⟨x,x'⟩)^d, RBF exp(−γ‖x−x'‖²) with the infinite-dimensional feature
   space statement; Mercer/PSD condition; kernel composition rules briefly.
5. **γ and C as the RBF bias–variance dials**: small γ ≈ near-linear
   (underfit), large γ ≈ islands around points (overfit); tie to demo.
6. Evidence and scope: the USPS Table 2 story + the E[#SV]/N bound; when
   SVMs are the right answer today (mid-size tabular, clear margin
   structure) vs when not (huge n — O(n²) kernel matrix; calibrated
   probabilities needed).

## Interview questions to work as exercises

- "Derive the SVM dual from the primal." (the set piece; full solution)
- "Why do only support vectors matter? Which KKT condition says so?"
- "Show that K(x,z) = (xᵀz)² corresponds to an explicit feature map for
  d=2." (write out φ)
- "Why is the RBF kernel's feature space infinite-dimensional, and why is
  that not a computational problem?"
- "How do you check a proposed kernel is valid?" (Mercer/PSD; verify a tiny
  2×2 Gram matrix by hand)
- "What happens to the RBF-SVM boundary as γ→∞? As γ→0?" (memorization vs
  near-linear; E3 spaced link to bias-variance)
- "Kernel SVM vs logistic regression with the same kernelized features —
  name two practical differences." (sparsity in α vs dense; probabilities)

## Pitfalls / subtleties to flag

- The dual's payoff is the INNER-PRODUCT form (kernelizability) and
  sparsity — not speed in general; solving the dual is O(n²)-ish. Don't let
  "dual is faster" slip in.
- w = Σαᵢyᵢφ(xᵢ) may be infinite-dimensional and is never materialized;
  predictions always go through K. Common conceptual failure.
- Mercer requires PSD for EVERY finite point set, not one Gram matrix;
  checking one matrix is evidence, not proof.
- The E[#SV]/N bound is leave-one-out-flavored and in expectation — state
  precisely, don't oversell.
- γ convention: exp(−γ‖·‖²) vs exp(−‖·‖²/2σ²) — fix one and note the map
  γ = 1/(2σ²) once.

## FIGURE PLAN

1. **`<FigureSequence>` (5 frames)** — the dual derivation staged: (1)
   primal + Lagrangian assembled, multipliers color-bound to constraints;
   (2) ∂L/∂w = 0 → w = Σαyx boxed; (3) ∂L/∂b = 0 → Σαy = 0; (4)
   substitution with cancelling terms struck; (5) final dual QP with
   constraint set. House formula-dissection at full depth. Inspiration:
   CS229 §6.6 / Cortes-Vapnik App. A.1.
2. **single `<Figure>`** — the three α regimes on a soft-margin picture:
   points labeled α=0 / 0<α<C / α=C with their geometric positions;
   complementary-slackness equation beside each. One idea: KKT reads off
   the geometry.
3. **single `<Figure>`** — the kernel-trick ledger for degree-2 polynomial
   in d=2: left column φ(x) written out (6 terms) and the explicit
   ⟨φ(x),φ(z)⟩; right column (1+xᵀz)² computed in 3 ops; equal-sign
   between, cost tally under each. One idea: same number, absurdly
   different cost.
4. **single `<Figure>`** — RBF boundary gallery: same ring-in-disk data at
   γ small/right/large, support vectors highlighted, train/test tallies.
   Matches the demo presets.
5. **single `<Figure>`** — USPS Table 2 recreated: degree 1–7 vs feature-
   space dimension (log scale 256→10^16) vs test error (flat) vs #SV
   (flat) — three aligned sparklines. One idea: capacity ≠ dimension.
   Inspiration: Cortes-Vapnik Table 2.
6. **single `<Figure>`** — prediction-time diagram: new x compared via K to
   the (few) support vectors only, weighted by αᵢyᵢ, summed with b —
   drawn as a two-layer network. Inspiration: Cortes-Vapnik Figs 3–4
   (the "network" view).
