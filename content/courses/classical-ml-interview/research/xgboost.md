# Research brief: xgboost (XGBoost)

status: planned
module: trees-ensembles
type: core
goal: Derive the XGBoost split-gain formula from the second-order objective and enumerate its regularization and systems refinements.

"Derive the XGBoost gain formula" is a real senior-ML interview ask; the
paper compresses the algebra, so the lesson must expand every step the paper
skips (the completing-the-square in Eq 4→5, the before/after subtraction
behind Eq 7).

## Sources to consult

- Chen & Guestrin 2016 (arXiv:1603.02754) — the single deep source:
  regularized objective **Eq 2** (Ω = γT + ½λ‖w‖²); second-order Taylor
  **Eq 3** with gᵢ, hᵢ; optimal leaf weight w* = −G/(H+λ) and structure
  score −½ΣG²/(H+λ) + γT (**Eqs 5–6**, Fig 2); the split-gain formula
  **Eq 7**; exact greedy **Algorithm 1**; approximate/quantile splits
  (§3.2–3.3, the weighted-least-squares reinterpretation with labels g/h
  and weights h — the 'aha' bridge); sparsity-aware default directions
  (**Algorithm 3, Fig 4**); systems section §4 (column blocks, cache,
  out-of-core) — one paragraph total; Table 3 (0.68s/tree vs sklearn's
  28.5s at equal AUC) and the Kaggle 17/29 adoption stat as evidence.
- ESL §10.10 / Friedman 2001 — for the contrast: first-order + line search
  vs second-order closed form (what "Newton boosting" upgrades — spiral to
  gradient-boosting and to Newton's method in gradient-descent).
- StatQuest XGBoost Parts 1–3 — mechanics presentation with small numbers
  (similarity scores = G²/(H+λ) under their naming); use for pacing the
  hand-worked example, dry register.
- Murphy §18.5 / LightGBM & CatBoost papers — one-sentence-each positioning
  (leaf-wise growth + GOSS; ordered target encoding — the encoding detail
  lives in feature-engineering, cross-ref).

## Key points the lesson must cover

1. Flaw-first: vanilla GBM uses only gradients; curvature information
   (Newton — spiral to gradient-descent) gives closed-form leaf values and
   a principled split criterion; plus explicit regularization on tree
   complexity.
2. **The objective**: additive round t; second-order Taylor of
   L(y, F+f) around F with per-example gᵢ = ∂L, hᵢ = ∂²L; drop constants.
   Worked concretely for squared loss (g = residual·(−1)·…, h = 1 — showing
   it reduces to GBM) and log loss (g = p−y, h = p(1−p)) — the table.
3. **Leaf-weight derivation with no skipped steps**: fix tree structure;
   objective decomposes per leaf into Σ(gᵢ)w + ½(Σhᵢ+λ)w²; minimize the
   quadratic → w* = −G/(H+λ); plug back → structure score
   −½ Σ_leaves G²/(H+λ) + γT. Each move justified.
4. **The split-gain formula** by before/after subtraction:
   Gain = ½[G_L²/(H_L+λ) + G_R²/(H_R+λ) − (G_L+G_R)²/(H_L+H_R+λ)] − γ;
   γ as the min-gain-to-split (pre-pruning); λ shrinking leaf scores. One
   fully numeric split evaluation on ~6 points (L4).
5. Regularization inventory: λ, γ, shrinkage η (inherited), row/column
   subsampling (inherited from RF — spiral), min child weight = Σh
   threshold, max depth.
6. **Sparsity/missing values**: learned default direction per split — try
   both, keep the better; why this handles missing + zeros + one-hot
   sparsity uniformly.
7. Engineering + landscape: histogram/approximate split finding (weighted
   quantiles in one sentence); the speed/adoption evidence; XGBoost vs
   LightGBM vs CatBoost one-row-each table; "when do boosted trees beat
   deep nets" (tabular data) as the closing positioning.

## Interview questions to work as exercises

- "Derive XGBoost's optimal leaf weight and split gain." (the set piece)
- "What are g and h for logistic loss? What is min_child_weight really
  thresholding?" (p(1−p) mass — low-confidence regions)
- "Evaluate this candidate split numerically given g,h per point, λ=1,
  γ=0.5 — split or not?" (hand computation)
- "XGBoost vs gradient boosting — name the four substantive differences."
  (second-order, explicit Ω, sparsity handling, systems)
- "How does XGBoost handle missing values? What do you do at inference if
  a feature was never missing in training?" (default direction; default
  branch convention)
- "Why can λ=0, γ=0 XGBoost still differ from sklearn GBM?" (near-
  equivalence caveat: still Newton vs first-order + implementation)
- "When would you prefer LightGBM? CatBoost?" (big n leaf-wise speed;
  heavy categoricals)

## Pitfalls / subtleties to flag

- The Taylor expansion is in FUNCTION value f(x), not in θ — same
  function-space move as gradient-boosting; keep the continuity explicit.
- Gain can be negative (γ term); XGBoost still grows then prunes back
  (post-pruning of negative-gain leaves) — the "does γ stop splitting"
  nuance.
- h must be ≥ 0 (convex loss) for the quadratic argument; custom losses
  with negative h break the derivation — one Remark.
- "Similarity score" (StatQuest) = G²/(H+λ); don't let the nickname replace
  the derivation.
- The famous speed numbers are 2016-era; cite as historical evidence of
  design, not current benchmarks.

## FIGURE PLAN

1. **`<FigureSequence>` (5 frames)** — the derivation staged: (1) round-t
   objective with the Taylor expansion, g/h color-bound; (2) regrouped
   per leaf; (3) the one-leaf quadratic in w with its vertex marked →
   w* = −G/(H+λ); (4) structure score assembled; (5) split gain as
   before-minus-after with the −γ toll. House formula-dissection.
   Inspiration: Chen & Guestrin Eqs 3–7 + Fig 2.
2. **single `<Figure>`** — g/h table for squared and logistic loss with
   the GBM-reduction annotation (squared loss, λ=0 ⇒ leaf = mean
   residual — "GBM is the special case").
3. **single `<Figure>`** — the numeric split evaluation: 6 points with g,h
   listed, left/right sums, three score fractions computed, Gain vs γ
   verdict stamped. One idea: the formula executed end-to-end.
4. **single `<Figure>`** — λ and γ knobs: same small tree scored under
   (λ=0,γ=0), (λ=5,γ=0), (λ=0,γ=2) with leaf values shrinking / splits
   disappearing. One idea: what each regularizer physically does.
5. **single `<Figure>`** — default-direction routing: a split node with a
   missing-value stream routed left vs right, the better loss kept;
   caption on uniform sparsity handling. Inspiration: C&G Fig 4.
6. **single `<Figure>`** — the family tree card: AdaBoost → GBM → XGBoost
   → LightGBM/CatBoost, one line per edge naming the added idea
   (exponential-loss special case → any loss, first-order → second-order +
   Ω → systems/leaf-wise/encodings). Module-closing synthesis figure.
