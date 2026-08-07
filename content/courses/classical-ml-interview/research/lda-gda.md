# Research brief: lda-gda (Generative versus discriminative: LDA and QDA)

status: planned
module: linear-classification
type: core
goal: Analyze the generative–discriminative trade-off using Gaussian discriminant analysis as the worked case.

## Sources to consult

- CS229 **§4.1** — GDA: multivariate normal recap (the covariance-shape
  contour panels), the model, closed-form MLEs (φ, μ0, μ1, shared Σ), the
  reduction of p(y|x) to a sigmoid, and the **GDA vs logistic regression**
  discussion: asymptotically efficient when the Gaussian assumption holds,
  logistic more robust when it doesn't. The lesson's spine.
- Bishop **§4.2.1–4.2.2** — shared-covariance Gaussians → posterior is
  exactly σ(wᵀx + w0), with w = Σ⁻¹(μ1−μ2) derived (Figs 4.9–4.10); ML
  solution S = (N1/N)S1 + (N2/N)S2.
- Murphy **§9.2** — QDA vs LDA boundaries (quadratic vs linear), 9.2.3 the
  LDA↔logistic "same functional form, different fit" statement; **§9.4** —
  the generative-vs-discriminative trade-off LIST (calibration, missing data,
  spurious features, semi-supervised) — turn into the lesson's closing table.
- ESL **§4.3** — LDA as classical statistics; discriminant functions; the
  masking problem one-liner; Fisher's LDA direction as an Aside (max
  between-class/within-class variance — the "LDA as dimensionality
  reduction" disambiguation).
- Bishop **§1.5.4** — the three-approach taxonomy (generative / discriminative
  / discriminant function) — open the lesson with this frame.

## Key points the lesson must cover

1. The taxonomy (Bishop): model p(x|y)p(y) and invert; model p(y|x) directly;
   map x→label with no probabilities. Place every classifier met so far.
2. **GDA worked**: model statement; MLE estimates as class means and pooled
   covariance (stated with one-line derivations); classify via Bayes' rule.
   A 2D numeric micro-example (two classes, given means/shared Σ) computing
   the boundary (L4).
3. **The derivation interviewers ask**: shared-Σ Gaussians → log-odds is
   affine in x → sigmoid posterior, with w = Σ⁻¹(μ1−μ0) and the quadratic
   terms cancelling shown explicitly. Corollary: same functional form as
   logistic regression.
4. **LDA vs QDA**: per-class Σk keeps the quadratic term → curved boundaries;
   parameter counts (shared: O(d²) once; QDA: per class) → bias-variance
   reading (QDA needs more data). When LDA beats logistic (small n, ~Gaussian
   features, well-separated classes where logistic is unstable).
5. **Generative vs discriminative trade-offs** (Murphy 9.4 list): generative
   handles missing features and class-prior shift naturally, supports
   semi-supervised, often better calibrated under correct assumptions;
   discriminative is robust to wrong p(x|y), usually lower asymptotic error.
   Naive Bayes vs logistic regression as the parallel pair (spiral to
   naive-bayes; the Ng–Jordan two-regimes result one sentence).
6. Fisher's LDA direction as an Aside: maximizing separation ratio gives
   w ∝ Sw⁻¹(μ1−μ0) — same direction as GDA-LDA; also usable as supervised
   dimensionality reduction (contrast with PCA, forward ref).

## Interview questions to work as exercises

- "Derive the posterior of two shared-covariance Gaussians; show it is a
  sigmoid." (set piece)
- "LDA vs logistic regression — when would you prefer each?" (efficiency vs
  robustness answer with the n small/Gaussian-ish condition)
- "LDA vs QDA — trade-off and parameter counts." (E3: phrase in bias-variance
  terms, spaced link)
- "Generative vs discriminative — define, give two of each, and name two
  practical advantages of generative models." (the classic)
- "Your logistic regression fails to converge on well-separated data; would
  LDA?" (yes — closed form; ties back to the separability pathology)
- "PCA vs LDA for dimensionality reduction?" (unsupervised variance vs
  supervised separation; forward pointer, revisited in pca lesson)

## Pitfalls / subtleties to flag

- Two things named LDA: the Gaussian classifier and Fisher's projection (and
  in NLP, Dirichlet allocation). Disambiguate in the first section.
- "Same functional form" ≠ "same fit": GDA's (w,b) come from class statistics,
  logistic's from conditional MLE — different estimates, different boundaries
  on finite data. The subtlety IS the lesson.
- GDA needs Σ estimates: with d large and n small, pooled Σ may be singular —
  regularized LDA one-liner (shrinkage).
- QDA's quadratic boundary is not "more powerful always" — variance cost;
  avoid the "more flexible = better" trap.
- The Ng–Jordan result (NB reaches its worse asymptote faster) is nuanced;
  cite it in one sentence, do not overclaim.

## FIGURE PLAN

1. **single `<Figure>`** — the three-approach taxonomy as a pipeline diagram:
   data → [p(x|y), p(y)] → Bayes → decision vs data → p(y|x) → decision vs
   data → decision; classifiers met so far placed as badges. Inspiration:
   Bishop §1.5.4.
2. **single `<Figure>`** — two shared-Σ Gaussian contour sets with the linear
   boundary, beside two different-Σ sets with the curved QDA boundary.
   Inspiration: CS229 GDA figure + Murphy 9.2.
3. **`<FigureSequence>` (3 frames)** — the sigmoid derivation: (1) log-odds
   written as log ratio of Gaussians; (2) quadratic terms cancel (struck
   out, shared-Σ condition highlighted); (3) affine form boxed with
   w = Σ⁻¹(μ1−μ0). House formula-dissection.
4. **single `<Figure>`** — same-form-different-fit: one 2D dataset with an
   outlier, GDA boundary vs logistic boundary diverging; tally of what moved
   each. One idea: the fits disagree exactly when assumptions fail.
5. **single `<Figure>`** — the trade-off table rendered: rows = missing
   features, wrong model, small n, calibration, semi-supervised; columns =
   generative / discriminative with ✓/✗ verdicts. Inspiration: Murphy §9.4.
6. **single `<Figure>`** — Fisher direction: two elongated class clouds; the
   naive μ-difference direction vs the Sw⁻¹-corrected direction with 1D
   projected histograms showing separation. Inspiration: ESL §4.3 / Bishop
   §4.1.4.
