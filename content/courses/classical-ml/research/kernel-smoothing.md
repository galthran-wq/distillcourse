# Kernel smoothing and local regression — research brief

Lesson: `kernel-smoothing` (module: local-models, core, planned). NEW.
Goal: Construct kernel and local-linear smoothers, correct boundary bias, and choose bandwidths — including Cleveland's robust LOESS.

## Sources
- ESL Ch. 6 (§6.1 Nadaraya–Watson eq 6.2; Epanechnikov/tri-cube/Gaussian kernels Fig 6.2; metric vs kNN bandwidths; §6.1.1 local linear regression eqs 6.7–6.9 — boundary bias killed to first order, "automatic kernel carpentry"; §6.1.2 local polynomials, odd beats even; §6.2 bandwidth selection; §6.6 KDE + kernel density classification as ★).
- Cleveland 1979 (the LOESS paper, read in full): the algorithm (tricube weights, nearest-neighbor span, robustness iterations with bisquare on residuals, defaults d=1, t=2, f≈0.5); Figs A–D and G set pieces; §6's equivalent-number-of-parameters λ ≈ 2(1+1/f); PRESS-based span selection.
- Murphy §16.3 (Parzen KDE; the optimal-bandwidth rule of thumb h=σ(4/3n)^{1/5}; kernel regression = attention footnote — one dry forward sentence at most).
- splines-gams (internal): the effective-df ruler this lesson's smoothers join; regression-diagnostics: the robustness/bisquare machinery seen for global fits.

## Key points
1. The move beyond module 3: no basis at all — estimate f(x₀) from points NEAR x₀. NW derived as the solution of locally-weighted constant fitting; the kernel zoo (Epanechnikov/tricube/Gaussian) with the honest note that the kernel matters far less than the bandwidth.
2. Boundary bias: NW's failure at the edges DERIVED (asymmetric neighborhood drags the average); the fix — fit a local LINE by weighted least squares at each x₀ (module 3's machinery reused pointwise); why local linear kills first-order bias (the weights' moment conditions, shown).
3. Bandwidth = the dial: bias↑ variance↓ with h; metric vs nearest-neighbor windows; CV selection (module 5's machinery — this smoother is linear in y, so the LOOCV shortcut applies; effective df = trace(S) places it on the module-3 ruler).
4. LOESS: Cleveland's full recipe — tricube weights on the span's neighbors, local linear fit, THEN robustness: residuals → bisquare weights → refit, twice. The abrasion set piece: one outlier drags the nonrobust curve, the robust one refuses. Defaults stated with their source (f∈[0.2,0.8], t=2).
5. The lead/ZPP study as the payoff: 158 workers, no physiological model exists — the smoother IS the scientific instrument; PRESS-selected span f≈0.49 converging in three iterations; the diagnostic use (smoothing |residuals| to see heteroscedasticity honestly — Cleveland's Fig E/F illusion).
6. ★ KDE and kernel density classification (ESL §6.6): density estimation with the same kernels; naive Bayes reappears as per-class KDE — one tight starred section.
7. The flaw ledger closing the lesson: local methods inherit the curse (module 1 — say it with the d>3 honesty), give no interpretable global form, and are memory-based; the recursive alternative → decision-trees.

## Set pieces & gems
- Cleveland Fig A/B (trend invisible until smoothed) — the opener.
- Cleveland Fig D (abrasion outlier: dotted vs solid) — the robustness set piece; real scan captured.
- Cleveland Fig G (lead/ZPP) — real occupational-health data; captured.
- The λ ≈ 2(1+1/f) equivalent-parameters rule — quotable bridge to the df ruler.
- ESL's "automatic kernel carpentry" phrase for local linear — cite once.

## Pitfalls
- Do not develop local likelihood / varying-coefficient models (ESL §6.4–6.5) — out of scope.
- The attention connection (NW = attention) is one sentence, no transformer digression.
- The robustness iterations are on RESIDUAL weights multiplied into kernel weights — implementations get this wrong; state the composition explicitly.

## FIGURE PLAN
- draw: FigureSequence (4 frames): building NW at one x₀ — (1) the raw scatter with x₀ marked, (2) the kernel bump over the neighborhood, (3) weights as dot sizes, (4) the weighted average plotted as the curve's point; then "slide x₀" final composite. Inspired by ESL Fig 6.1.
- draw: Boundary bias — NW at the left edge (asymmetric weights, curve sagging below the data trend) vs local-linear at the same edge (tilted fit correcting it); two panels, same data. Recreation of ESL Fig 6.1's panel pair.
- draw: Bandwidth sweep — three fits (h small/right/large) with train-vs-LOOCV error inset; the effective-df ruler from splines-gams re-inked with this smoother's positions added. Comparison figure + spiral.
- source: robustlocall-fig-cd-p831 — stem `cleveland-abrasion`, reader must see the dotted (nonrobust) curve dragged by the lower-left outlier while the solid (robust) curve holds; placement: centered in the LOESS section (the 1979 scan is the evidence; a redraw would be an artist's claim).
- draw: The robustness loop — flowchart: kernel weights → local fit → residuals → bisquare δᵢ → refit with δᵢ·wᵢ, iterate t=2; the bisquare function inset. Single Figure.
- source: robustlocall-fig-g-p833 — stem `cleveland-lead-zpp`, reader must see the 158-worker scatter with the rise-then-plateau LOESS curve; placement: float right beside the lead-study section.
- draw: Fig E/F illusion recreated — residuals vs fitted with density-driven apparent funnel, then |residual| smooth revealing constant scale; two panels. Computed.

## EXERCISE PLAN
1. Warm-up: compute the NW estimate at one x₀ for 5 points with tricube weights (span covering 3 of them).
2. Derivation skipped: show local-constant fitting (minimize Σwᵢ(yᵢ−c)²) yields exactly the NW formula, and local-linear yields the weighted-least-squares system; identify the moment condition that cancels first-order bias.
3. Boundary probe: h → ∞ (the smoother becomes the global mean / global OLS line — connect to which module-3 objects); h → 0 (the memorizer returns, again). The whole course's two poles inside one dial.
4. Claim to refute: "LOESS's robustness comes from the tricube kernel." Refute: tricube is the DISTANCE weight; robustness is the residual-driven bisquare reweighting — run the algorithm without step-2 iterations on the abrasion data and watch it follow the outlier.
5. Mixed review (E3): compute trace(S) for an NW smoother on 10 equispaced points at two bandwidths; place both on the df ruler and check against Cleveland's 2(1+1/f) rule of thumb.
6. Research-shaped: reproduce Cleveland's span selection on the lead data (provided extract): PRESS over f ∈ {0.2,…,0.8}; report your selected f against the paper's 0.49.
7. FORWARD (E7): fit a local-linear smoother to 2-feature data by product kernels and count the effective observations in a neighborhood at d=2 vs d=8 (compute). Solution: recursive partitioning sidesteps the emptiness by ADAPTING the neighborhood — the tree, next lesson → Ref decision-trees.

## ARC
- Inherits: weighted least squares (module 3), the df ruler (splines-gams), CV/LOOCV (module 5), the curse (module 1).
- Contributes: the first fully local estimator family, its bias surgery (local linear), its robust production form (LOESS), and its honest failure ledger.
- Hands off: locality that adapts its own neighborhoods and survives mixed features — the decision tree.
- Spine step: "Giving up the formula: local averages and recursive partitions fit anything, and pay for it in variance" (step 6).
