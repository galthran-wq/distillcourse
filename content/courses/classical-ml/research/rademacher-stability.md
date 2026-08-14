# Rademacher complexity and stability — research brief

Lesson: `rademacher-stability` (module: learning-theory, core, planned). NEW.
Goal: Derive Rademacher-complexity generalization bounds and prove that Tikhonov-regularized algorithms are stable, connecting regularization directly to generalization.

## Sources
- Mohri Ch. 3.1 (empirical/average Rademacher complexity; the McDiarmid-based master bound Thm 3.3 — roadmap + key steps; Massart's lemma), Ch. 5.4/6.3 (linear-class computations: the ‖w‖≤Λ ball's complexity ≤ rΛ/√m; the kernel version √(Tr[K])Λ/m Thm 6.12 — the dimension-free punchline), Talagrand's contraction Lemma 5.7 (statement + use).
- Mohri Ch. 14 / SSBD Ch. 13 (stability: uniform β-stability Def 14.1; stability ⇒ generalization Thm 14.2 via McDiarmid; Prop 14.4 — kernel-RLM is β-stable with β ≤ σ²r²/(mλ) via strong convexity/Bregman argument; corollaries for SVM/KRR/SVR; SSBD's on-average-replace-one exact identity Thm 13.2).
- SSBD Ch. 26 (Rademacher calculus cross-check; contraction).
- Murphy — context only.

## Key points
1. Two refinements of VC, honestly motivated: (a) VC counts labelings over WORST-CASE points — Rademacher asks how well H correlates with pure noise ON YOUR DATA (data-dependent, real-valued-ready); (b) all capacity measures ignore the ALGORITHM — stability bounds the algorithm itself, no class in sight. The lesson teaches both lenses and their meeting point (RLM).
2. Rademacher complexity defined (the noise-correlation reading first, formula second); tiny worked computation (2 hypotheses on 3 points, all 8 sign patterns averaged); Massart for finite classes recovering the log|H| bounds — the machinery strictly generalizes the previous lessons'.
3. The master bound: gen-gap ≤ 2R(H) + concentration term, via McDiarmid — proof ROADMAP with the two key steps shown (symmetrization in expectation; bounded differences), full proof cited (Mohri Thm 3.3). Contraction stated with its role (losses composed with Lipschitz maps — the enabler for margin bounds next lesson).
4. The linear computations CARRIED (these are short and beautiful): R of {w·x : ‖w‖≤Λ} on points with ‖x‖≤r is ≤ rΛ/√m — Cauchy–Schwarz + Jensen, four lines; the kernel version ≤ Λ√(Tr[K])/m. Read aloud: NO DIMENSION APPEARS. The svm-dual-kernels IOU is now formally payable (margin-bounds completes it).
5. Stability: uniform β-stability defined; the theorem β = o(1/√m) ⇒ generalization (proof via McDiarmid, carried at roadmap+steps level); THE result: Tikhonov-regularized ERM (ridge, SVM, KRR) is β-stable with β ≤ σ²r²/(mλ) — strong-convexity proof sketched honestly (the Bregman two-point argument); corollaries listed with their constants.
6. The reading that names the lesson: REGULARIZATION IS STABILITY — λ buys insensitivity to any single point, and insensitivity IS generalization; module 3's penalties and module 5's leave-one-out intuition meet in a theorem. The two-lens summary table (class capacity vs algorithmic stability: when each applies, what each cannot see).

## Set pieces & gems
- The rΛ/√m four-line computation — the course's most elegant dimension-free argument; do it in full.
- Mohri's note that the Prop-14.4 proof is "novel … generalizes to non-differentiable losses (hinge)" — the SVM stability corollary is exactly the infinite-dimensional-kernel answer's second half.
- SSBD Thm 13.2's exact identity (on-average stability EQUALS the generalization gap) — stability is not a bound but an identity in expectation; under-taught.

## Pitfalls
- McDiarmid: state carefully (bounded differences), prove nothing beyond the use; cite.
- Do not conflate uniform and on-average stability; one clarifying paragraph, then use uniform for the theorems.
- The λ in β ≤ σ²r²/(mλ): fixed-λ asymptotics — say what happens as λ→0 (the bound dies exactly when regularization vanishes; min-norm interpolation's module-11 cliff planted in one sentence).

## FIGURE PLAN
- draw: The noise-correlation picture — one dataset, random ±1 labels drawn 3 times, the best-fitting hypothesis per draw with its correlation; rich class vs poor class side by side (rich fits noise well = high R). FigureSequence (3 frames). Key image.
- draw: The three capacity measures — |H| / VC / Rademacher as three rulers over the same class gallery (finite, halfspaces, norm-ball, RBF-ball), showing where each ruler reads finite vs infinite/vacuous. Single Figure; the module's map updated.
- draw: The rΛ/√m derivation — four algebra lines with the Cauchy–Schwarz and Jensen steps highlighted; the "no d anywhere" annotation. Formula-dissection Figure.
- draw: Stability's mechanism — two datasets differing in one point, the two fitted ridge solutions nearly coinciding (small λ vs large λ panels: wobbly vs pinned); β as the measured gap. Computed two-panel.
- draw: The identity — SSBD Thm 13.2 as a balance: E[gen gap] = E[stability gap]; the two sides drawn as the same quantity measured two ways. Single small Figure.
- draw: Regularization=stability=generalization — the triangle diagram tying module 3 (penalty), this lesson (β ≤ σ²r²/mλ), and module 5 (LOO) with theorem labels on each edge. Closing Figure.

## EXERCISE PLAN
1. Warm-up: compute the empirical Rademacher complexity of H = {h₁, h₂} on 2 points by enumerating all 4 sign vectors.
2. Derivation skipped: carry the kernel version — R ≤ Λ√(Tr[K])/m from the rΛ/√m argument with the feature-map substitution (the lesson does the linear case; reader lifts it).
3. Boundary probe: R of the class containing ONE function (0 — noise cannot be fit); R of ALL ±1 functions (1 — noise fit perfectly); place both on the master bound and read the resulting guarantees (perfect vs vacuous).
4. Claim to refute: "the RBF-SVM's hypothesis class has infinite VC dimension, so no finite-sample guarantee can exist for it." Refute with the norm-ball Rademacher bound + stability corollary: guarantees attach to the BALL the algorithm actually searches and to the ALGORITHM's stability, not to the ambient class; name the quantifier that changed.
5. Mixed review (E3): compute β ≤ σ²r²/(mλ) numerically for the logreg-lab's L2 setting (r, λ, m from the lab) and translate into a generalization-gap estimate; compare with the lab's measured train-test gap.
6. Research-shaped: measure stability empirically — refit ridge on 50 replace-one-point perturbations of a 100-point dataset at λ ∈ {0.01, 1, 100}; report max prediction change vs the σ²r²/(mλ) curve's shape.
7. FORWARD (E7): for the soft-margin SVM on separable data, compute the margin-loss at ρ = half the achieved margin (zero) and note the Rademacher term rΛ/√m·(1/ρ) is now the WHOLE bound. Solution: assembling exactly that bound — loss at margin ρ plus contraction-scaled complexity — is the next lesson → Ref margin-bounds.

## ARC
- Inherits: VC's worst-case counting and its vacuous frontier (vc-dimension); penalties (module 3); LOO intuition (module 5).
- Contributes: data-dependent capacity (with the dimension-free linear/kernel computations) and algorithm-dependent guarantees (stability), meeting in "regularization is stability".
- Hands off: the contraction tool + the norm-ball bounds → margin-bounds, where the two debts are formally paid.
- Spine step: "Why any of it works…" (step 9).
