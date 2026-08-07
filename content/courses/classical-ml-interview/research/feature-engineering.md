# Research brief: feature-engineering (Feature engineering and selection)

status: planned
module: practical
type: core
goal: Select encoding, scaling, and feature-selection strategies for a modeling task and identify where each can leak information.

The practical-round lesson: decision tables and failure modes, not
derivations. Everything here is asked as "what would you do and why".

## Sources to consult

- StatQuest "One-Hot, Label, Target and K-Fold Target Encoding" — the
  encoding walkthrough incl. the target-encoding leakage trap and the
  K-fold/leave-one-out fix; CatBoost Part 1 (ordered target encoding —
  running-history means) as the production-grade variant.
- Huyen **§7.2** (sampling/training-data construction: leakage, missing
  data, class imbalance boundary — imbalance itself deferred to next
  lesson) and **§5.1.3** (the 'grandma's wine cellar' PCA-as-features
  framing — one-line callback only).
- ISLP **ch. 3** (qualitative predictors/dummies; interactions;
  polynomial/log transforms) and **§6.1** (best-subset/stepwise and their
  problems — Cp/AIC/BIC one-liner) — the classical selection layer.
- ESL **§3.3** (subset selection) and the lasso as embedded selection
  (spiral to ridge-lasso); §18 one-liner for p≫n screening + the CV-order
  warning (ties to the leakage section).
- Murphy §1.5.1 (preprocessing) and sklearn docs conventions
  (StandardScaler/pipelines) for the practice layer — statement level.
- knn-curse / kmeans / ridge-lasso lessons — the scaling-sensitivity
  spiral is cashed out here as one consolidated table.

## Key points the lesson must cover

1. Frame: features bound model quality; the same model with better features
   beats a fancier model with raw ones (tabular practice). The lesson is
   three decisions: encode, scale, select — each with a leakage audit.
2. **Categorical encoding**: one-hot (reference level, dummy trap — spiral
   to ols; high-cardinality blowup), ordinal/label (only for true orders —
   trees tolerate arbitrary codes, linear models don't), target encoding
   (powerful, leaks by construction if fit on the full data) — the
   **K-fold / leave-one-out / ordered (CatBoost) fixes** worked on a small
   table with numbers showing the naive version's leak (L4: a
   category with n=1 memorizes its own label).
3. **Scaling**: standardize vs min-max vs robust; the consolidated
   sensitivity table — needs scaling: k-NN, k-means, SVM, PCA, ridge/lasso,
   GD-trained anything; indifferent: trees/forests/boosting (order-based
   splits — spiral). Fit the scaler on TRAIN only (the pipeline rule).
4. **Missing data**: MCAR/MAR/MNAR in three sentences; deletion,
   mean/median imputation (+ missingness indicator — often the signal),
   model-based one-liner; trees' native handling (surrogates/default
   directions — spiral to xgboost).
5. **Selection**: filter (correlation/mutual information — cheap, ignores
   interactions), wrapper (forward/backward with CV — expensive, honest),
   embedded (lasso, tree importances — with their biases, spiral to
   bagging-random-forests); stepwise + p-values caveat (spiral to
   regression-diagnostics); ALWAYS select inside the CV fold (the ESL
   wrong-way spiral, restated in one sentence).
6. **Constructed features**: interactions (ratios, products), binning,
   log/Box-Cox for skew, date/time decomposition, domain aggregates —
   a worked mini-case (e.g., transaction table → customer features)
   showing 3 engineered features and the leakage audit question for each
   ("computable at prediction time?").

## Interview questions to work as exercises

- "Encode a 10,000-level merchant ID for (a) logistic regression, (b)
  XGBoost. Trade-offs?" (hashing/target-encoding vs native/one-hot; the
  full comparison)
- "Show how naive target encoding leaks on a category with one row; fix it
  two ways." (numeric set piece)
- "Which of these six models need feature scaling and why?" (the table,
  reasoned per model — E3 spirals to knn/kmeans/svm/ridge)
- "Mean imputation vs indicator vs dropping — pick for this scenario."
- "You ran lasso selection on all data, then cross-validated the chosen
  features. Report expected optimism." (wrong-way CV — E3 spiral)
- "Name a feature that looks fine offline but is leaky in production."
  (post-outcome timestamps, aggregates including the current row —
  bridges to imbalance-leakage next lesson)

## Pitfalls / subtleties to flag

- Target encoding leak is subtle: even K-fold versions leak a little under
  heavy category imbalance; ordered/held-out encoding is the strict
  answer. Don't present K-fold as perfectly clean.
- One-hot + regularization interact: penalty treats each level as a
  feature; unpenalized reference-level asymmetry one-liner.
- Label encoding for linear models imposes fake ordinality — a numeric
  example where it flips a coefficient's meaning.
- Imputing before splitting = leakage (statistics computed on test rows);
  same pipeline rule as scaling.
- Feature selection stability: lasso's arbitrary pick among correlated
  features (spiral) — report feature GROUPS, not single winners.

## FIGURE PLAN

1. **single `<Figure>`** — encoding decision tree: cardinality × model
   type → one-hot / ordinal / target / hashing, drawn as a compact
   flowchart with one example dataset routed through it.
2. **`<FigureSequence>` (3 frames)** — the target-encoding leak: (1) naive
   per-category mean computed WITH the row's own label (n=1 category
   memorizes, highlighted); (2) K-fold encoding — the row's value computed
   from other folds only; (3) ordered encoding — running mean of history
   only. Numbers carried through one small table. Inspiration: StatQuest
   target-encoding + CatBoost Pt 1.
3. **single `<Figure>`** — the scaling-sensitivity table rendered: models
   × (needs scaling? why) with the mechanism named per row (distance /
   penalty / gradient / order-based). The consolidated spiral payoff.
4. **single `<Figure>`** — missingness triage: MCAR/MAR/MNAR examples in
   three mini-panels with the recommended handling stamped on each; the
   indicator-as-signal case highlighted.
5. **single `<Figure>`** — selection triptych: filter / wrapper / embedded
   as three pipelines with cost and honesty tallies; the inside-the-fold
   placement marked on each (wrong-way ghost struck out).
6. **single `<Figure>`** — the leakage audit card: three engineered
   features from the transaction mini-case each stamped "available at
   prediction time? yes/no/depends" with the failing one traced to its
   future-information source.
