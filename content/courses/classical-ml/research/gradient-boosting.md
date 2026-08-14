# Gradient boosting — research brief

Lesson: `gradient-boosting` (module: ensembles, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/gradient-boosting/lesson.mdx (28 min).
Goal: Derive gradient boosting as gradient descent in function space and explain the roles of shrinkage, tree depth, and subsampling.

## Sources
- Friedman 2001 (primary): function-space steepest descent §1–3; Algorithm 1 (generic), Algorithm 2 (LS_Boost — the "reality check": boosting = iterative residual fitting), LAD/M_TreeBoost (robust losses; the slash-error "disastrous" LS result Fig 2); per-leaf line search §4.3 (why TreeBoost ≠ boosting+trees); shrinkage §5 (Fig 1 — small ν always wins; the ν–M trade; incremental-vs-global shrinkage mystery flagged by Friedman himself); tree size caps interaction order §7 (ANOVA argument, Fig 6, J=4–8 sweet spot).
- ESL §10.9–10.12 (gradient tree boosting Algorithm 10.3; Table 10.2 loss/gradient pairs; shrinkage + subsampling).
- Murphy §18.5 (Algorithm 18.3 generic form; Table 18.1 loss/gradient table — cross-check).
- ISLP §8.2.3 (gentle B/λ/d framing — the "learns slowly" intuition).

## Key points
1. The reconceptualization (Friedman's move, staged as such): treat the N fitted values f(x₁)…f(x_N) as N parameters; the gradient of the loss w.r.t. them is a VECTOR the same shape as the data; a tree FIT TO that vector generalizes the gradient to new x. Gradient descent in function space, derived carefully.
2. The reality check: for squared error the negative gradient IS the residual — so LS boosting = repeatedly fitting residuals (worked on a 1-D dataset for 3 rounds, curves drawn). AdaBoost recovered as the exponential-loss instance (the module's chain: specific → general).
3. The generic algorithm with per-leaf line search: because tree regions are disjoint, one global step splits into per-leaf optimal constants — derive; this is what makes TreeBoost strong (and what XGBoost will close-form).
4. The loss/gradient table (squared → residual; absolute → sign; Huber; deviance → y−p) with when-each: the robustness story (Friedman's slash-noise boxplots — LS "disastrous", LAD/Huber fine).
5. Shrinkage: f ← f + ν·step; Friedman's own curves (captured image available): ν=1 overfits by iteration ~20; ν≤0.1 needs 10× rounds and lands lower — always; the honest note that Friedman called the mechanism "a mystery under investigation". Stochastic subsampling (η≈0.5) one paragraph.
6. Depth = interaction order: the ANOVA argument (a J-leaf tree represents ≤ J−1-way interactions); Friedman's Fig 6 evidence for J∈[4,8]; the splines-gams interaction gap finally closed by machinery that LEARNS interactions.
7. Where the practice stands: cite the numbers for depth/ν/M defaults, early stopping on a validation set (module 5's discipline inside the fit loop).

## Set pieces & gems
- Friedman's shrinkage figure (greedyfuncti-fig1) — the ORIGINAL evidence; captured.
- The "reality check" framing (his own §4.1 term) — keep the phrase, cited.
- The garnet-geochemistry interaction (Fig 11) — DEFER to shap-interpretability (partial dependence lives there); one forward sentence.
- Friedman's open mystery about incremental shrinkage — a canonical "the field doesn't fully know" moment; quote dryly.

## Pitfalls
- The function-space idea must be derived, not proclaimed: show the N-vector gradient computation for squared and absolute loss explicitly.
- Keep the line-search vs leaf-constant distinction exact (γ_jm per leaf, not one γ).
- No XGBoost material (next lesson); no interpretability material (extra lesson).

## FIGURE PLAN
- draw: The reconceptualization — left: parameter-space GD on a loss surface (from gradient-descent, re-inked); right: "function space" — the N fitted values as a vector, its negative gradient as arrows AT THE DATA POINTS, a tree fitted to the arrows. The bridging figure; key image.
- draw: FigureSequence (4 frames): LS boosting on 1-D data — (1) f₀ = mean with residual arrows, (2) tree 1 fit to residuals, added, (3) new smaller residuals, tree 2, (4) after 50 rounds the accumulated curve hugging the target. Matches the demo.
- source: greedyfuncti-fig1-shrinkage-tradeoff — stem `friedman-shrinkage`, reader must see the four-ν curves with ν=1 overfitting early and ν=0.06 grinding lower — the original 2001 evidence; placement: centered in the shrinkage section.
- draw: The loss/gradient table as a figure — four losses with their pseudo-residual formulas and a thumbnail of each residual's behavior on an outlier point. Single Figure.
- draw: Depth = interactions — the same 2-feature target with a genuine x₁x₂ interaction fitted by depth-1 (additive-only, biased) vs depth-2 boosting (captures it); residual heatmaps beside. Computed; the splines-gams gap closed visibly.
- draw: Robustness boxplot recreation — LS vs LAD vs Huber boosting on normal vs heavy-tailed noise (our own run, Friedman Fig 2's design). Computed.

## EXERCISE PLAN
1. Warm-up: compute the pseudo-residuals for absolute loss at 4 given (y, f) pairs; note they carry only sign information.
2. Derivation skipped: derive the per-leaf optimal constant for absolute loss (the median of the leaf's residuals — derive via the subgradient) and for deviance (the one-step Newton approximation — guided).
3. Boundary probe: boost with trees of depth J = n (each tree can interpolate) at ν = 1 — one round reaches zero training error; connect to which ingredient (weak learner + shrinkage) makes boosting slow ON PURPOSE.
4. Claim to refute: "gradient boosting with squared loss and ν=1 is just refitting residuals, so running it forever converges to the memorizer — hence boosting always overfits eventually." Partially true (train error → 0); refute the "hence" with the ν/M evidence and early stopping — overfitting is controlled by the path taken, not just the limit; name the open-theory honesty (Friedman's mystery, module 9/11 threads).
5. Mixed review (E3): show AdaBoost's update is Algorithm-1's instance for exponential loss (compute the pseudo-residuals −∂exp(−yf)/∂f and match the reweighting) — the module chain proved by the reader.
6. Research-shaped: reproduce the ν–M trade on a provided dataset: ν ∈ {1, 0.1}, M up to 1000, staged test error; report the two minima and their M — Friedman's Figure 1 in miniature (feeds boosting-lab).
7. FORWARD (E7): for logistic boosting, write the second derivative of the loss per point (p(1−p)) next to the first (y−p); note a per-leaf step using BOTH is available. Solution: that Newton step in leaf space is XGBoost's objective → Ref xgboost.

## ARC
- Inherits: AdaBoost's stagewise frame; GD (gradient-descent) now lifted to function space; trees as the base learner (module 6).
- Contributes: boosting generalized to any differentiable loss — the workhorse algorithm — with its three dials (ν, J, M) evidenced from the source.
- Hands off: the second-order refinement and systems reality → xgboost; the ensemble race → spam-ensembles.
- Spine step: "The ensemble resolution…" (step 7).

## REVISION (vs old draft)
- Gains: the function-space derivation done carefully (draft compresses); per-leaf line-search derivations (median/Newton exercises); Friedman's original shrinkage figure as a sourced image + his "mystery" quote; the depth=interaction ANOVA argument with the computed figure; robustness section.
- Loses: interview register; the loss table stays but must carry the outlier-behavior reading, not just formulas.
- Demo: keep BoostingStagesExplorer with the ν-comparison task (D1-compliant as re-specced).
