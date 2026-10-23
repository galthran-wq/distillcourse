# The undersampled posterior and its correction — research brief

Lesson: `undersampling-calibration` (module: rare-positives, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Derive the bias that keeping a fraction β of the genuine transactions introduces into a classifier's posterior, the closed-form map that undoes it, and the matched threshold under which the corrected decisions are unchanged
Opening (verbatim, the lesson must start with it): To train on a stream with one fraud in five hundred payments you throw away most of the genuine payments and keep all the frauds. The model then says 'probability of fraud 0.5' for a payment that, on the real stream, is fraud perhaps once in fifty times. Can the number it outputs be turned back into the real probability, and does doing so change which payments it ranks highest?

## Sources to consult
- Dal Pozzolo et al. 2015 (SSCI), Sec. III-A (the selection variable s with p(s | y, x) = p(s | y); p(s=1 | +) = 1, β = p(s=1 | −); Eqs. 1–4; Table I: 1,000 positives in 10,000, β = 0.11 discards 88.9% of negatives, β = 0.5 gives 5,500 rows at 81.8% negative), III-B (bias p_s − p largest when class-conditional densities are similar, Eqs. 5–8, Fig. 1), III-C (Eq. 9 the inverse; monotone so ranking unchanged; variance caveat), III-D (two Gaussian tasks μ = 3 vs 15, σ = 3, 10% positives, Figs. 2–4), IV-A (Bayes minimum-risk threshold Eq. 10, τ = π+ with costs from priors; Elkan), IV-B (τ_s = π_s+, Eq. 11 odds relation, Eq. 12 the matched threshold τ' equal to π+), V (Brier score Eq. 13), VI (Table V rank sums: AUC and G-mean identical for p_s and p'; Brier p best, p' second, p_s worst; paired t-tests), the credit-card experiment (Figs. 5–6; min β ≈ 0.00173), Appendix (Saerens Eqs. 14–17 reducing to Eq. 4; prior ratios; Elkan's formula equivalent). File: research/texts/staged-dalpozzolo2015-calibrating-undersampling.txt (columns interleaved — check equations against the PDF staged-dalpozzolo2015-calibrating-undersampling.pdf).
- Baesens et al. 2015 Ch4 pp. 197–198 (the Saerens posterior adjustment p(C_i | x) = [p(C_i)/p_r(C_i)] p_r(C_i | x) / Σ_j […]; Table 4.13: priors 1/99 vs resampled 20/80, 0.5 → 0.039, 0.9 → 0.267; rank order preserved so only needed when calibrated probabilities matter), p. 192 (avoid fully balanced samples; start at the original odds and shift 5 points at a time). File: research/texts/fraudanalyti-s4-ch04b.txt.
- Dal Pozzolo 2014 Sec. 7.2.4 (at 0.4% fraud, undersampling to 50/50 discards ~99.6% of genuine transactions per chunk). File: staged-dalpozzolo2014-learned-lessons.pdf.
- Handbook Ch6.4 (XGBoost's scale_pos_weight as the cost-side twin; balanced bagging as a way to recover the discarded variance) — pointer only; the empirical review is the next lesson.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader knows undersampling from the classical-ml imbalance playbook as "keep all positives, drop most negatives" and knows calibration as a property a classifier may lack. They have not connected the two: the dropped negatives change the prior the model sees, and the model's output is a posterior under that prior. The opening's numbers: 1 in 500 on the stream, 0.5 from the model, 1 in 50 in truth. The question has two parts — can the output be mapped back, and does the map move the ranking — and the answer is a two-line Bayes computation plus a monotonicity argument. Terms not yet available: selection variable, class-dependent selection, β, prior shift, matched threshold, Brier score (recall).

### Chain of sub-problems
1. **What does undersampling do to the data, exactly?** — Obvious attempt: "it balances the classes". Why it fails: that names the effect, not the mechanism; to reason about the output one needs the mechanism. Answer: each row is kept or dropped by a coin that depends only on its class — every positive kept, each negative kept with probability β. Write it as a selection variable s with p(s=1 | +) = 1 and p(s=1 | −) = β. Because: the selection depends on y and not on x, so p(x | y) is unchanged and only the prior moves; this is the one assumption everything rests on (and the one that fails for alert feedback in module 8).
2. **What probability does the model learn?** — Obvious attempt: the true posterior p = P(+ | x). Why it fails: the training rows are the selected ones, so the model estimates P(+ | x, s=1). Answer: by Bayes, p_s = p / (p + β(1 − p)). Carry the steps: P(+ | x, s=1) = P(s=1 | +, x) p / [P(s=1 | +, x) p + P(s=1 | −, x)(1 − p)] = p / (p + β(1 − p)). Worked: β = 0.11 at the opening's 1-in-500 → p_s ≈ 0.5 means p ≈ 0.11·0.5/(1 − 0.5 + 0.11·0.5)… the reader computes the inverse next. Because: the only thing that changed is how often each class appears.
3. **Can it be undone?** — Obvious attempt: no, the data are gone. Why it fails: the map is one-to-one in p. Answer: invert — p' = β p_s / (β p_s − p_s + 1). Check at the ends: p_s = 0 → 0, p_s = 1 → 1; at p_s = 0.5 with β = 0.11, p' = 0.055/(0.055 − 0.5 + 1) ≈ 0.099. Table I's bookkeeping: 1,000 positives among 10,000; β = 0.11 keeps 1,000 of 9,000 negatives (50/50); β = 0.5 keeps 4,500 (81.8% negative). Because: the map depends only on β, which the trainer chose and therefore knows.
4. **Does the correction change the ranking?** — Obvious attempt: a corrected probability is a different number, so maybe. Why it fails: p' is a monotone increasing function of p_s, so the order of any two rows is preserved. Answer: ranking, ROC-AUC, AP, CP@k are all unchanged; only calibration — and any decision that uses the probability's value (a cost rule, a threshold set in euros) — changes. Evidence: identical AUC and G-mean rank sums for p_s and p' across 16 datasets; Brier score best for no undersampling, then p', worst for p_s. Because: monotone transforms do not reorder.
5. **How big is the bias, and when?** — Obvious attempt: the bias is a constant factor. Why it fails: p_s − p depends on p: it is largest where p is intermediate, i.e. where the classes overlap, and grows as β shrinks. Answer: the two Gaussian tasks (μ = 3 vs 15, σ = 3, 10% positives): the same β drifts the posterior far more on the overlapping task; Fig. 1's curve of p_s − p against the density ratio peaks near equality. Because: where the model is already sure, no prior shift moves it; where it is unsure, the prior is everything.
6. **If the decisions are what matter, do I even need p'?** — Obvious attempt: threshold p_s at 0.5 since the training set was balanced. Why it fails: 0.5 on p_s is a threshold on a probability that is not the real one. Answer: the Bayes-minimum-risk threshold with costs from the priors is τ = π+ (the prior), and under undersampling τ_s = π_s+ (0.5 if balanced); the matched threshold on p' is τ' = β τ_s / ((β − 1) τ_s + 1), which simplifies to π+ when τ_s = π_s+. So (p', τ') and (p_s, τ_s) give identical decisions: correcting the probabilities and moving the threshold back are the same act. Because: the threshold is a point on the same monotone map.
7. **Why not just not undersample?** — Obvious attempt: train on everything. Why it fails on the stream: at 0.4% fraud a balanced chunk discards 99.6% of genuine rows, which is why it is done at all (speed, and some learners need it); the price is variance from the thrown-away rows (the correction is less precise where positives are few). Answer: undersample when the learner needs it, correct the probabilities, and recover the variance with ensembles of undersamples (next lesson). Because: calibration is restored by a formula; variance is not.

### Set pieces and worked examples to recreate
- Table I: 1,000 positives in 10,000; β → dataset size and negative share (0.11 → 2,000 rows, 50%; 0.5 → 5,500 rows, 81.8%). (Dal Pozzolo 2015 Sec. III-A.)
- The two-line Bayes derivation of p_s and the inverse p'. (Sec. III-A, III-C, Eqs. 3–4, 9.)
- The two Gaussian tasks, μ = 3 vs 15, σ = 3, 10% positives; posterior curves for several β on each; p' overlaying p. (Figs. 2–4.)
- The bias curve p_s − p against the density ratio, peaking near equality. (Fig. 1.)
- Table V's rank sums: ranking metrics identical for p_s and p'; Brier worst for p_s; paired t-test p-values 0.000/0.000/0.001 (p vs p_s) against 0.510/0.062/0.156 (p vs p'). (Sec. VI.)
- The credit-card set: 492/284,807, min β ≈ 0.00173; AUC up with undersampling, Brier worse, fixed by p'. (Sec. VI, Figs. 5–6.)
- The Saerens form and Baesens' Table 4.13: priors 1/99 vs 20/80 → 0.5 maps to 0.039, 0.9 to 0.267. (Baesens Ch4 p. 198.)
- The threshold identity τ' = π+. (Sec. IV-B.)

### Pitfalls and terms to define
- β is the keep rate of negatives, not the ratio of positives to negatives; the canonical bug (the lab declares it).
- The correction assumes training and deployment share the stream's prior; if the prior drifts, p' is off by the drift — forward to module 7.
- "Calibration" is recalled from classical-ml (a probability of 0.3 should be right 30% of the time); do not re-teach reliability diagrams.
- Intrinsic selection bias (a bank sees only accepted applicants) vs selection by design (undersampling): the paper's framing; the first is not correctable by β because β is unknown and depends on x.
- The SSCI text has interleaved columns; check every equation against the PDF.
- The lesson derives the Bayes threshold with prior-derived costs only; the amount-dependent rule is example-dependent-cost.

### Recalled, not re-taught
- Bayes' rule, calibration, undersampling (classical-ml): one clause each.
- The base-rate funnel's Bayes step (<Ref economics-of-detection>); AP/CP@k unchanged by monotone maps (<Ref alert-budget-metrics>); the training block (<Ref delayed-labels-prequential>).

## FIGURE PLAN
- draw: key image — the map p ↦ p_s for β ∈ {1, 0.5, 0.11, 0.01} on [0,1] with the diagonal, and the inverse arrow back; the opening's point (p_s = 0.5 → p' ≈ 0.1 at β = 0.11) marked. Single <Figure>.
- draw: Table I as a stacked bar per β: positives fixed, negatives shrinking, the negative share printed. Single <Figure>.
- draw: the two Gaussian tasks: histograms (μ = 3 overlapping, μ = 15 separable) above posterior curves for several β; frames add β = 1, then 0.5, then 0.11, then p' overlaid. <FigureSequence>, 4 frames. Inspired by Figs. 2–4.
- draw: bias p_s − p against p for three β, peaking at intermediate p. Single <Figure>, inspired by Fig. 1.
- draw: two rankings side by side — the same ten rows under p_s and under p' — with identical order and different numbers; a threshold line at τ_s = 0.5 on the left and τ' = π+ on the right cutting between the same rows. Single <Figure>.
- draw: reliability diagram of p_s vs p' on a seeded simulation (bins of predicted vs observed rate). Single <Figure>, computed.

## EXERCISE PLAN
1. [warm-up] With β = 0.2 and model outputs 0.9, 0.5, 0.1, compute p' and the matched threshold for τ_s = 0.5.
2. [boundary probe] β → 0 (keep almost no negatives): show p_s → 1 for every x with p > 0, and that p' still inverts it in exact arithmetic — then say why in practice the inversion is useless (which rows the model never saw).
3. [derivation skipped] Derive the Saerens prior-shift formula for two classes and show it reduces to p' when the test priors are the original ones; then derive Elkan's version and show the three agree.
4. [claim to refute] "After undersampling, oversampling the positives back to the original ratio restores calibration." Name the step that fails (duplicating positives does not restore the dropped negatives' share; the prior is still wrong) and compute the prior it does produce.
5. [research-shaped] Reproduce Table 4.13: priors 1/99, resampled 20/80 — show 0.5 → 0.039 and 0.9 → 0.267 from the formula, then compute β for that resampling.
6. [mixed review] Under the amount-free cost matrix of <Ref economics-of-detection> (C_FP = C_a, C_FN = 100 C_a), compute the Bayes threshold on p and the matched threshold on p_s for β = 0.11.
7. FORWARD → `imbalance-techniques-revisited`: on a seeded 2-D overlap task, train a logistic regression at β = 1 and β = 0.05, correct the second with p', and compute AUC, AP and the balanced accuracy at 0.5 for both — the reader finds balanced accuracy moving while AUC and AP do not, before the empirical review names the pattern.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: the funnel's Bayes step (economics-of-detection), the metrics that monotone maps leave alone (alert-budget-metrics), the training block the undersampling is applied to (delayed-labels-prequential), the ULB set (canonical-datasets).
- Contributes: the selection model, p_s and p', monotonicity, the overlap dependence, the matched threshold.
- Hands off: imbalance-techniques-revisited (what the rest of the toolkit does to the metrics; samplers inside the pipeline); example-dependent-cost (a decision rule that needs calibrated p'); alert-feedback-selection-bias (selection that depends on y AND x, where no β exists); model-risk-monitoring (calibration backtests); cost-aware-evaluation-lab (the correction as a checkpoint).
