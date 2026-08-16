# Gaussian mixtures and the EM algorithm — research brief

Lesson: `gmm-em` (module: unsupervised, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/gmm-em/lesson.mdx (32 min).
Goal: Derive the EM updates for a Gaussian mixture and prove each iteration increases the likelihood.

## Sources
- Bishop §9.2–9.4 (the canonical treatment: GMM likelihood and its singularities Fig 9.7; EM for GMM with responsibilities; the ELBO decomposition log p = L(q,θ) + KL(q‖p) §9.4 Figs 9.11–9.14 — THE derivation this lesson exists for; K-means as the ε→0 limit §9.3.2; Old Faithful walkthrough).
- Dempster–Laird–Rubin 1977 (primary/historical): the E/M naming; GEM Theorem 1 (monotone likelihood); the 197-animal genetics example with Table 1 (0.1328 ratio — images captured); rate-of-convergence = missing-information ratio; Sundberg's warning (λ→1 slow convergence for overlapping components).
- Murphy §8.7 (EM as bound optimization/MM — cross-check), §21.4 (label switching; model selection pointers).
- CS229 Ch. 11 (Jensen-inequality derivation — the alternative route; use as the ★ second proof).

## Key points
1. The flaw inherited: k-means' hard ties at 51/49. The GMM: a latent-variable density Σπ_k N(x|μ_k,Σ_k); why direct MLE stalls (log of a sum — the gradient's coupling shown).
2. If z were known, MLE is module-2 arithmetic (per-class means/covariances — LDA's M-step!); the E-step: responsibilities γ_ik by Bayes' rule; the M-step: WEIGHTED versions of the known-z formulas — derived, every step (the ∂/∂μ_k computation carried).
3. The theorem: each EM iteration cannot decrease log p(X|θ). Proof via the ELBO decomposition (Bishop's route): log p = L(q,θ) + KL(q‖posterior); E-step sets q = posterior (KL→0, bound tight); M-step maximizes L in θ (bound rises, likelihood rises at least as much). Full proof, proof protocol, with the two-panel "bound hugging the likelihood" pictures.
4. K-means recovered as the σ²→0 limit (derived); the historical frame: DLR 1977 named the pattern already alive in Baum–Welch and gene counting — one dry historical paragraph with the Table 1 artifact (convergence ratio 0.1328 = missing-information fraction; the rate READING, not just the fact).
5. Pathologies, each worked: singularities (one component collapsing on a point, likelihood → ∞ — Bishop Fig 9.7's argument; MAP/σ-floor fixes); label switching (identifiability); slow convergence when components overlap (DLR/Sundberg: rate = missing-information ratio — the elegant reading).
6. Model selection for K: held-out likelihood DOES work here (unlike distortion) — one honest paragraph; BIC named.
7. ★ The Jensen-route derivation (CS229) as a second proof; ★ EM beyond GMMs (the 1977 paper's gallery: censoring, mixtures generally) in three sentences.

## Set pieces & gems
- The ELBO tangent pictures (Bishop Figs 9.11–9.14) — recreate as the proof's visual spine.
- DLR Table 1 (captured scan) — the FIRST published EM trace; the 0.1328 ratio doubling as rate theory.
- Old Faithful two-component fit — the module's running dataset (real geyser photo available as garnish; likely skip the photo per L12).
- The singularity argument — "unregularized MLE can be pathological" at its sharpest.

## Pitfalls
- q vs posterior notation: fix one notation (γ for responsibilities, q for the variational distribution) and keep it; the notation ledger entry matters here.
- Do not develop variational inference beyond the decomposition (out of scope).
- The 1977 genetics example uses a multinomial, not a GMM — present it as EM's generality, clearly labeled.

## FIGURE PLAN
- draw: The stuck gradient — log Σ vs Σ log side by side with the coupling term highlighted; "why no closed form". Formula-dissection opener.
- draw: FigureSequence (5 frames): EM on Old-Faithful-shaped data — init ellipses; E-step recolor (soft blends visible at the boundary); M-step ellipses move; second E/M; converged, log-likelihood staircase under the frames. Matches the demo. Key image.
- draw: The ELBO decomposition — log p as a fixed-height bar split into L(q,θ) + KL; E-step animation collapsing KL, M-step raising the whole bar. FigureSequence (3 frames); recreation of Bishop Fig 9.11–9.13's idea.
- source: maximumlikel-table1-convergence — stem `dlr-table1`, reader must see the original 1977 typeset table with its 8 iterations and ratio column; placement: float right in the historical/rate section (the artifact IS the point).
- draw: The singularity — one component's σ shrinking onto a data point with the likelihood curve blowing up; the MAP-floored version staying finite. Two panels; recreation of Bishop Fig 9.7's argument.
- draw: k-means as a limit — responsibilities at σ² = 1, 0.1, 0.01 for one boundary point, hardening to 0/1; the k-means assignment as the limit row. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute responsibilities for one point under two given 1-D components; then the M-step mean update for three points with given γ.
2. Derivation skipped: derive the M-step for π_k (Lagrange multiplier on Σπ=1 — the mle-map categorical trick reused) and for Σ_k (stated in the lesson; reader completes the weighted-covariance algebra).
3. Boundary probe: initialize one component ON a data point with tiny σ — compute the likelihood's divergence rate as σ→0 (the singularity made quantitative); state why a σ-floor or MAP prior restores a well-posed problem.
4. Claim to refute: "EM converges to the MLE." Refute: monotone ≠ global; exhibit the label-switching equivalent optima and a bad local optimum from poor initialization; name what IS guaranteed (non-decrease, stationary points).
5. Mixed review (E3): run the σ²→0 limit formally and recover Lloyd's two steps (kmeans composed with this lesson); state which GMM pathology k-means inherits and which it escapes.
6. Research-shaped: reproduce DLR's Table 1 — implement EM for the 197-animal multinomial (formulas given), run 8 iterations from π₀=0.5, and match the 0.1328 deviation ratio.
7. FORWARD (E7): fit a 2-component GMM to nested-circles data — watch it fail (Gaussian ellipses cannot wrap a ring); compute the kNN-graph Laplacian's second eigenvector on the same data and note its sign pattern separates the rings. Solution: that eigenvector IS spectral clustering's coordinate → Ref spectral-clustering.

## ARC
- Inherits: k-means (the hard-assignment flaw), MLE/Bayes-rule machinery (module 2), LDA's per-class estimates (module 4 — now weighted).
- Contributes: the latent-variable pattern and its convergence theorem — the module's deepest derivation — with its pathologies priced.
- Hands off: shapes likelihood can't wrap → spectral-clustering; the ELBO vocabulary (reused by name in module 10's marginal-likelihood discussions).
- Spine step: "Structure without labels…" (step 8).

## REVISION (vs old draft)
- Gains: the full ELBO proof with its figure sequence (draft sketches Jensen in prose); the DLR historical artifact + rate-as-missing-information reading (new); the singularity made quantitative; the 1977 reproduction exercise; the CS229 Jensen route demoted to ★ second proof.
- Loses: interview register; "pitfalls" listicle becomes the worked-pathology sections.
- Demo: keep EmStepper; add the find-a-singularity task to the spec (D1 sharpening).
