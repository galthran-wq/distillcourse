# Generative versus discriminative: LDA and QDA — research brief

Lesson: `lda-gda` (module: boundaries, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/lda-gda/lesson.mdx (24 min).
Goal: Derive LDA and QDA from class-conditional Gaussians and analyze the generative–discriminative trade-off against logistic regression.

## Sources
- CS229 §4.1 (GDA model, closed-form MLEs, the GDA⇒logistic-posterior derivation, the asymptotic-efficiency vs robustness discussion — the lesson's backbone).
- ESL §4.3 (discriminant functions δ_k; LDA computations; QDA; the bias-variance defense of LDA "despite Gaussians rarely holding" p.111 + STATLOG evidence; masking of linear regression on indicators §4.2 — one paragraph), §4.4.5 (logistic or LDA?).
- Murphy §9.2 (QDA/LDA boundaries; nearest-centroid special case; Fisher's LDA §9.2.6 as the projection view).
- ISLP §4.4 (gentler build; the Default-data confusion-matrix material lives in module 5 — do not duplicate).

## Key points
1. The model: y ~ Bernoulli(π), x|y ~ N(μ_y, Σ) shared. MLEs derived (means, pooled covariance) — module-2 recipe at matrix scale.
2. The centerpiece derivation: p(y=1|x) through Bayes' rule collapses to σ(wᵀx + b) with w = Σ⁻¹(μ₁−μ₀) — EXACTLY logistic regression's form, different parameter estimates. Every algebra step (quadratic terms cancel because Σ is shared).
3. QDA: per-class Σ_k keeps the quadratic terms; boundary is a conic; parameter count d(d+1)/2 per class — the bias-variance reading of LDA vs QDA (a covariance-matrix budget decision).
4. The trade-off named: same family, two fits. If the Gaussian assumption holds, GDA is asymptotically more efficient (uses more structure per sample); if not, logistic is consistent for the best linear log-odds anyway (robustness). CS229's discussion distilled into a decision table with honest caveats (outliers hurt LDA's means; separable data breaks logistic).
5. What generative buys beyond efficiency: missing features (marginalize), class-prior shifts (reweight π without refitting), outlier flagging via p(x) — each with a two-line computation.
6. Fisher's 1936 view as a ★ section: maximize between/within scatter ratio; same direction as LDA for two classes (state; derive the Rayleigh-quotient setup, solution pointer).
7. Naive Bayes placed: NB with Gaussian features = GDA with diagonal Σ — one sentence unifying road 2's two lessons.

## Set pieces & gems
- The GDA⇒sigmoid derivation — the module's "two roads meet" moment; treat with proof protocol (roadmap first).
- STATLOG gem (ESL p.111): LDA top-3 on 7 of 22 real benchmarks — the empirical defense of a "wrong" model.
- ESL Fig 4.5/4.9 idea: LDA vs QDA boundaries on equal vs unequal covariance data.

## Pitfalls
- Do NOT present LDA-for-dimension-reduction as the main event (that's the Fisher ★ + one forward sentence to pca).
- The efficiency claim is asymptotic and assumption-bound — state both qualifiers in the same sentence.
- Keep multiclass δ_k machinery light: derive 2-class fully, state K-class.

## FIGURE PLAN
- draw: The generative picture — two Gaussian clouds with their fitted ellipses (shared Σ), the implied linear boundary as the ridge where posteriors cross; below, the SAME data with logistic's directly-fitted line (slightly different). Comparison panel; the lesson's key image.
- draw: FigureSequence (4 frames) of the GDA⇒sigmoid derivation: (1) the two class densities and Bayes' rule ratio, (2) log-ratio expanded, (3) quadratic terms cancelling (highlighted, shared-Σ hypothesis on the cancellation arrow), (4) the sigmoid form with w, b identified. Formula-dissection style.
- draw: LDA vs QDA — equal-Σ data (both fit fine) vs unequal-Σ data (LDA's line vs QDA's conic), 2×2 panel with test-error tallies. Inspired by ESL Figs 4.5/4.9.
- draw: The parameter budget — bar chart of parameter counts: NB-diag (2d), LDA (d + d(d+1)/2), QDA (K·d(d+1)/2) at d=10 and d=100; the variance price of quadratic boundaries. Single Figure.
- draw: What generative buys — three mini-panels: missing feature marginalized (integral shading one axis), prior shift (π dial re-tilting the boundary), low-p(x) outlier flagged. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute the LDA boundary for 1-D classes N(0,1), N(2,1), π=0.5 (threshold at 1); shift π to 0.9 and recompute.
2. Derivation skipped: derive the QDA discriminant δ_k(x) fully and identify exactly which term LDA's shared-Σ assumption deletes.
3. Boundary probe: Σ singular (a constant feature) — the derivation divides by Σ; what breaks, and which fixes exist (drop, regularize Σ + λI — regularized DA named).
4. Claim to refute: "GDA and logistic regression fit the same family, so with enough data they converge to the same classifier." Refute: under misspecification (non-Gaussian classes) the two targets differ — construct the counterexample with a heavy-tailed class where one outlier moves LDA's mean but not logistic's fit; name the step (MLE targets differ under misspecification).
5. Mixed review (E3): show Gaussian NB (diagonal Σ, shared) is LDA with a diagonal pooled covariance; compute both boundaries on a 2-feature toy where correlation matters and NB is visibly wrong.
6. Research-shaped: simulate CS229's efficiency claim — Gaussian classes, n ∈ {20, 50, 200}: test error of GDA vs logistic, 100 replications; then repeat with t₃-distributed classes and watch the ranking flip. Report the two curves.
7. FORWARD (E7): on separable 2-D data, fit LDA and logistic (regularized) — both give lines through the same gap; note NEITHER line depends on how far the far points are from the gap in a controlled way. Solution: choosing the line by the gap itself — the margin — is road 3 → Ref svm-max-margin.

## ARC
- Inherits: road 1's fitted boundary (logistic-regression) and road 2's counting machinery (naive-bayes); MLE at matrix scale (mle-map).
- Contributes: the exact meeting point of roads 1 and 2 — same functional form, different estimates — and the efficiency/robustness trade that decides between them.
- Hands off: the third road, which abandons probability entirely → svm-max-margin.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4).

## REVISION (vs old draft)
- Gains: the full 4-frame derivation treatment (old draft compresses it); the simulation exercise making the efficiency claim measurable; the parameter-budget frame; the NB-unification sentence; Fisher ★ section with Rayleigh setup.
- Loses: interview register; the "what generative buys" listicle becomes computed mini-examples.
- Demo: none (unchanged).
