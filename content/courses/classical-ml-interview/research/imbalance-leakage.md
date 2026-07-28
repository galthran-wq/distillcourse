# Research brief: imbalance-leakage (Class imbalance and data leakage)

status: planned
module: practical
type: core
goal: Analyze class imbalance and data leakage scenarios and select mitigations that survive deployment.

Course closer: synthesizes metrics, validation, and features into the two
failure stories every DS loop probes. Heavy on scenario exercises (E3
territory — nearly every exercise reaches back).

## Sources to consult

- Huyen **§7.2** — the case studies to adapt: skin-lesion detection with 1%
  positives producing excess false negatives; the Reddit 10M-comment
  sampling/labeling design; the news-site translation selection-bias case
  (translated articles get 2× views — causal?); leakage taxonomy phrasing
  (training-data leakage vs feature leakage).
- Murphy **§5.1.3.3/5.1.4.4** — ROC's imbalance-invariance vs PR's
  sensitivity (the formal recap of classification-metrics — one sentence +
  Ref); cost-sensitive threshold rule p* = 1/(1+c).
- Bishop **§1.5.4** — prior correction: train on balanced data, then divide
  out training-set class fractions and multiply by deployment priors,
  renormalize — the calibration-repair recipe after resampling.
- Chawla et al. 2002 (SMOTE, JAIR) — synthetic minority oversampling by
  interpolating neighbors; cite for the method + its caveats (noise
  amplification near boundaries, meaningless for high-d sparse features).
  Statement-level (not swarm-read; keep to the standard description).
- ESL **§7.10.2** — the wrong-way-CV set piece (screen features on all
  data → near-zero CV error): reprise from cross-validation-bootstrap as
  THE contamination archetype, now classified within the taxonomy.
- Ace the DS Interview ch. 7 — Uber fraud and Robinhood churn phrasings
  for scenario exercises.
- Kaufman et al. 2012 ("Leakage in Data Mining", KDD) — the taxonomy
  anchor citation (target leakage / contamination); statement-level.

## Key points the lesson must cover

1. **Imbalance, the ordered playbook** (the structure IS the answer
   interviewers want):
   (1) fix the metric first — PR/recall-at-precision/cost matrix, never
   raw accuracy (recap metrics lesson, one sentence + Ref);
   (2) fix the threshold — cost-derived, not 0.5;
   (3) reweight — class weights in the loss (equivalent view: duplicating
   examples);
   (4) resample — undersample majority / oversample minority / SMOTE
   (mechanics + caveats);
   (5) collect more minority data / anomaly-detection reframe when 1:10⁶.
2. **The calibration cost of resampling**: training on 1:1 when deployment
   is 1:100 shifts P(y=1|x) upward; the prior-correction formula (Bishop)
   worked numerically; "resampled model + uncorrected probabilities +
   business threshold" as the compound failure.
3. When imbalance is NOT a problem: enough absolute minority examples +
   proper metric — do nothing; the reflex-resampling anti-pattern.
4. **Leakage taxonomy with one concrete case each**:
   - target leakage (feature caused BY the label: 'antibiotics_given' for
     infection prediction);
   - train-test contamination (preprocessing/selection on full data — the
     ESL case classified here);
   - temporal leakage (future rows in training; aggregates computed over
     the whole history);
   - group leakage (same patient/user on both sides — group k-fold recap).
5. **Detection heuristics**: offline score too good (AUC 0.99 on a hard
   problem); one feature dominating importance (spiral to
   variable-importance); performance collapse when re-split by time;
   feature-availability audit (the feature-engineering card, one Ref);
   train/serve skew monitoring one sentence.
6. Closing synthesis: the deployment checklist — metric matches cost,
   threshold from costs, calibration verified on true priors, split
   respects time and groups, every feature timestamp-audited.

## Interview questions to work as exercises

- "Fraud is 0.1% of transactions. Walk me through your modeling and
  evaluation plan end-to-end." (the playbook, E3 spiraling metrics + CV)
- "You oversampled to 1:1 and your model predicts 45% fraud probability on
  average in production. Why, and fix it." (prior correction, numeric)
- "Does SMOTE help logistic regression on 200 positives / 1M negatives?
  What would you try first?" (class weights + threshold; SMOTE caveats)
- "AUC = 0.99 on churn prediction. List your leakage hypotheses and how
  you'd test each." (taxonomy sweep)
- "Same user appears in train and test. Quantify the danger and fix the
  split." (group leakage — E3 to cross-validation-bootstrap)
- "A feature 'days_since_last_support_call' is your top importance for
  churn. Legit or leaky?" (depends on timing — the audit reasoning)
- Huyen's translation case: "translated articles get 2× views — should we
  translate everything?" (selection bias vs causation)

## Pitfalls / subtleties to flag

- Never resample the TEST set — evaluation must reflect deployment
  distribution; the most common homework-grade error.
- Class weights and oversampling are near-equivalent for convex losses but
  differ for trees/boosting (duplicates change split counts) — one Remark.
- SMOTE before the split leaks (synthetic points interpolate test-fold
  neighbors) — resample INSIDE folds; pipeline rule third repetition
  (deliberate).
- Stratification handles fold composition, not imbalance itself — naming
  confusion to preempt.
- Not all great scores are leakage — sometimes the problem is easy;
  detection heuristics are hypotheses to TEST (time-split rerun), not
  verdicts.

## FIGURE PLAN

1. **single `<Figure>`** — the imbalance playbook as an ordered flowchart
   (metric → threshold → weights → resampling → reframe), each stage with
   its one-line rationale; the reflex path straight to SMOTE struck out.
2. **single `<Figure>`** — resampling gallery on one 2D dataset:
   undersample (majority thinned), oversample (minority duplicated,
   stacked markers), SMOTE (synthetic points on neighbor segments, one
   boundary artifact highlighted). Inspiration: Chawla et al. mechanics.
3. **`<FigureSequence>` (3 frames)** — the calibration story: (1) balanced
   training → probability histogram centered high; (2) deployment at 1:100
   — predicted vs observed frequencies diverge on the reliability curve;
   (3) prior-correction formula applied — curve returns to the diagonal.
   Numbers carried through. Inspiration: Bishop §1.5.4 + metrics lesson's
   reliability figure (spiral).
4. **single `<Figure>`** — the leakage taxonomy as a 2×2-ish map (what
   leaks × when it leaks) with the four named types and their one-line
   examples pinned.
5. **single `<Figure>`** — temporal leakage timeline: feature-computation
   window overlapping the label window (struck out) vs correctly lagged
   windows; the same aggregate feature drawn both ways.
6. **single `<Figure>`** — the detection dashboard: four warning gauges
   (score too good / one dominant feature / time-split collapse /
   availability audit fail) each tied to its test procedure.
7. **single `<Figure>`** — the deployment checklist card: five checks with
   back-references (lesson badges) — the course's practical synthesis in
   one graphic.
