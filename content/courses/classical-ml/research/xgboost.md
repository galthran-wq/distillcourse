# XGBoost — research brief

Lesson: `xgboost` (module: ensembles, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/xgboost/lesson.mdx (26 min).
Goal: Derive the XGBoost split-gain formula from the second-order objective and enumerate its regularization and systems refinements.

## Sources
- Chen & Guestrin 2016 (primary): §2.1 regularized objective Ω = γT + ½λ‖w‖²; §2.2 second-order Taylor with g_i, h_i, optimal leaf weight w* = −G/(H+λ), structure score, Eq. 7 split gain; Fig 2 (five-instance worked example — image captured); §3 exact/approximate/weighted-quantile split finding; §3.4 sparsity-aware default directions (Fig 4 captured); §4 column blocks; Table 1/3 benchmarks (captured); the g/h-weighted-squared-error rewrite §3.3 (the "aha" identity).
- Murphy §18.5.5.2 (the same derivation cross-checked; Eq 18.46–18.56).
- ESL §10.12 (shrinkage/subsampling context — inherited).

## Key points
1. The refinement named as such (voita flaw-first): gradient boosting takes a first-order step and finds the constant by line search; XGBoost expands the loss to SECOND order per point (g_i, h_i) and solves the leaf constants in closed form — Newton in leaf space, with regularization built into the objective rather than bolted on.
2. The derivation carried in full (the module's second flagship derivation): per-leaf sum G_j, H_j; minimize ½(H_j+λ)w² + G_j w per leaf → w* = −G_j/(H_j+λ); plug back → structure score −½ΣG²/(H+λ) + γT. Then the split gain by before/after subtraction: Gain = ½[G_L²/(H_L+λ) + G_R²/(H_R+λ) − G²/(H+λ)] − γ. The five-instance example computed numerically alongside (the paper's own cast).
3. Read the formula: λ shrinks leaf weights (ridge inside the tree); γ is a per-leaf tax — a split must EARN γ (pruning becomes arithmetic, not post-hoc); h_i weights points by curvature (confidently-classified points stop mattering — the influence-trimming reading).
4. The weighted-quantile identity (★ or main, judged at write time): the second-order objective equals weighted squared error with targets g/h and weights h — why candidate splits must be h-weighted quantiles; a genuinely surprising rewrite, two lines.
5. Systems refinements, each in one disciplined paragraph tied to a captured artifact: sparsity-aware default directions (missing values get a LEARNED branch — feature-engineering's missing-data thread closed); approximate histogram splits; column blocks/cache (the 10×-scikit number); the Kaggle-dominance context sentence (17/29 winners) as adoption evidence, not hype.
6. The landscape table: vanilla GBM / XGBoost / LightGBM / CatBoost — one row each, differences that matter (histogram vs exact, leaf-wise vs level-wise, ordered target encoding).

## Set pieces & gems
- The paper's boy-likes-computer-games cartoon (Fig 1, captured) and five-instance structure-score example (Fig 2, captured) — the original notation is what learners meet in the docs; show it.
- The R-gbm cautionary row in Table 3: fast but AUC 0.62 vs 0.83 — single-branch growth as a quality decision, not an optimization.
- The g/h weighted-quantile rewrite — under-taught, exam-grade.

## Pitfalls
- Do not rehearse the whole systems paper: each systems idea gets its mechanism + its number, nothing more (the course is not a benchmarks tour).
- Keep notation IDENTICAL to the paper (g, h, G, H, λ, γ, T) — the field's standard; say so.
- The λ in XGBoost is per-leaf-weight L2 — do not conflate with the learning rate (η/ν) which also exists; one disambiguation box.

## FIGURE PLAN
- draw: FigureSequence (5 frames) of the derivation — (1) the Taylor expansion per point with g/h named, (2) points grouped into leaves (G_j, H_j sums forming), (3) the per-leaf parabola minimized at −G/(H+λ), (4) the structure score assembled, (5) the split gain as before/after subtraction with γ's toll gate. Mirrors the dual-derivation sequence style (course visual continuity).
- source: xgboosta-fig2-structure-score — stem `xgboost-worked-example`, reader must see the paper's five cartoon instances with their g/h routed to leaves and the score formula in original notation; placement: float right beside our derivation (binding our notation to the field's artifact).
- draw: The formula read as knobs — the gain formula with λ, γ, h each highlighted and a one-line consequence per knob (shrink/tax/curvature-weight); three mini-sparklines showing gain vs each knob. Single Figure.
- source: xgboosta-fig4-default-direction — stem `xgboost-missing`, reader must see the '?'-entries routed along learned default branches; placement: in the sparsity section, float right.
- draw: Split finding — exact scan vs histogram/quantile candidates on one feature's sorted values, with the h-weighted quantile marks unevenly spaced; two aligned strips. Single Figure.
- draw: The landscape table as a figure — 4 systems × 5 design axes with one-word cells; the disambiguation box (λ vs learning rate) beneath. Single Figure.

## EXERCISE PLAN
1. Warm-up: for the paper's five instances (g, h given), compute G, H, the root's structure score, and w* at λ=1.
2. Derivation skipped: derive w* = −G/(H+λ) by completing the minimization the lesson displays, and show the structure score follows by substitution (the reader closes the algebra loop).
3. Boundary probe: λ→0, γ=0 with squared loss (h≡1) — show the gain reduces to the plain variance-reduction split criterion of decision-trees (the module's machinery collapses to CART's); and h_i→0 for a confidently-correct point — it vanishes from every sum (influence trimming derived).
4. Claim to refute: "XGBoost's regularization is why it wins Kaggle; plain GBM cannot express the same models." Refute: the model CLASS is identical (additive trees); the objective/optimizer differ; cite the paper's own matched-shrinkage finding lineage (Friedman 2001 §6.4: with shrinkage matched, LK_TreeBoost ≈ LogitBoost ≈ AdaBoost.MH) — apparent superiority can be hyperparameter art; name what XGBoost demonstrably adds (2nd-order fit, principled pruning, systems).
5. Mixed review (E3): compute g and h for logistic loss at three (y, p) pairs and verify h = p(1−p) matches IRLS's weights (module 4's Newton returns inside a tree).
6. Research-shaped: on a provided dataset, sweep γ ∈ {0, 1, 10} at fixed depth; report leaf counts and test error — the toll gate measured.
7. FORWARD (E7): fit XGBoost and a random forest on tabular data with 30% added uninformative noise features; record the degradation of each. Solution: robustness-to-junk-features is one of the three findings the course's closing lesson explains → Ref tabular-showdown.

## ARC
- Inherits: gradient boosting's loop (gradient-boosting), Newton's curvature (gradient-descent/glm), ridge-style penalties (module 3), missing-data threads (feature-engineering, decision-trees).
- Contributes: the second-order objective with closed-form leaves and gains — the algorithm as actually deployed — plus the systems facts that made it the default.
- Hands off: the race verdict on the benchmark → spam-ensembles; the interpretability toolkit → shap-interpretability (extra); the tabular-supremacy question → module 11.
- Spine step: "The ensemble resolution…" (step 7).

## REVISION (vs old draft)
- Gains: the derivation as a 5-frame sequence with the paper's own worked example alongside (sourced image); the weighted-quantile identity; the h-weights↔IRLS mixed exercise; the CART-collapse boundary probe; the matched-shrinkage refutation (Friedman's own result).
- Loses: interview register ("the canonical interview ask"); the comparison table stays but shrinks to decision-relevant rows.
- Demo: none (unchanged).
