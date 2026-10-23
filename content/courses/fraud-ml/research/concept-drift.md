# Concept drift: what changes in a transaction stream and how to see it — research brief

Lesson: `concept-drift` (module: sequences-drift, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Classify a change in a transaction stream as a change in the inputs, the base rate or the input–label relation and as sudden, incremental, gradual or reoccurring, and measure the distance between two days without their labels
Opening (verbatim, the lesson must start with it): A detector trained in June scores well on July and badly on October. Fraudsters have changed their methods, the bank launched a new product, and a holiday season began — but which of these is the model's problem? What kinds of change can a transaction stream undergo, how does each show up, and how can you measure that two days differ before any of their labels have arrived?

## Sources to consult
- Gama et al. 2014 survey (research/texts/asurvey-s1-.txt, asurvey-s2-.txt): Sec 2.1 definitions (Eq. 2: ∃X with p_t0(X,y) ≠ p_t1(X,y); real vs virtual vs population drift; the real-estate news triad; Fig. 1), Sec 2.2 patterns (sudden, incremental, gradual, reoccurring, outlier; Fig. 2; severity, predictability, frequency), Sec 2.3 requirements, Sec 2.4 predict–diagnose–update with delayed feedback (Fig. 3), Sec 3.1 memory (fixed/variable/landmark windows, reservoir sampling, fading factors; "recency ≠ relevance"), Sec 3.5 delayed, unreliable, biased feedback.
- Gavaldà, Lecture 6 (research/texts/gavalda-ds-lecture6.txt): slides 5–8 (the statistical setting: D_t per time step, shift vs drift, autocorrelation), slides 26–30 (tracking a statistic with a decay function; sliding window f(i) = 1/W vs EWMA f(i) = λ(1−λ)^i; the variance / reaction-time trade-off: "where is the sweet spot? depends on variance and change rate, unknown").
- MOA book ch. 5 (research/texts/moa-book-ch5-dealing-with-change.txt): 5.1 notion of change, 5.2 estimators (sliding window and linear estimator, EWMA with α, Kalman as a pointer), Ex. 5.1 (distribution change vs outliers vs anomalies vs noise).
- MOA Tutorial 5 (research/texts/moa-tutorial5-concept-drift.txt): Sec 3 the sigmoid drift window (concept A to B over a window of width w centred at position p; w = 1 is abrupt), Sec 5 incremental drift by moving hyperplane weights — the generator vocabulary the lab reuses.
- Lucas & Jurgovsky 2020 (research/texts/creditcard-.txt): Sec 3.1 eqs 1–3 (covariate shift, prior shift, concept drift), Sec 3.2 day-distinguishability (Fig. 4: pool two days, label by day, classifier AUC as distance; weekly periodicity, Sundays/holidays and Fri/Sat clusters), Hellinger distance (eq. 4 is garbled in the text — write it from scratch), importance-weighted CV in one sentence.
- Dal Pozzolo et al. 2014 Sec 4 (research/texts/staged-dalpozzolo2014-*): new products and cardholder behaviour change P(X), evolving fraud types change P(Y|X).
- Handbook Ch3.2 (reproducible-Chapter_3_GettingStarted_SimulatedDataset.md): scenario 2 (two terminals compromised per day for 28 days) and scenario 3 (×5 amounts for 14 days) as planted changes; Ch5 intro: old blocks dropped for drift.
- Weber et al. 2019 Sec 4 (research/texts/antimoney-.txt): the step-43 collapse as a sudden prior/concept change.
- Jurgovsky 2018 Sec 5.1, 6.1: daily AUCPR co-moving across models; "an exact model of today's data is probably badly wrong in a few days".

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has a model selected on prequential folds (module 2) and sees it decay. Three stories are on the table and the newcomer cannot tell them apart from the score alone. Terms not yet available: p(x) / p(y) / p(y|x) as names for kinds of change, "virtual" and "real" drift, the patterns (sudden, gradual…), a "window" as an estimator, EWMA, the day-distinguishability classifier, Hellinger distance. The lesson also has to say what is NOT available: labels for October arrive in November.

### Chain of sub-problems
1. **What exactly changed?** — Obvious attempt: "the data changed". Why it fails: a decision rule only cares about some changes. Answer: write the joint as p(x,y) = p(y|x)p(x) = p(x|y)p(y); a change in p(x) alone (new product, seasonality) leaves the boundary where it was — virtual drift; a change in p(y) (a fraud wave, a dark market closing) moves the base rate and every precision-type metric; a change in p(y|x) (fraudsters' new method with the same features) moves the boundary — real drift. Because: the boundary is p(y|x) = τ, so only the last forces relearning; the others force re-evaluation or re-thresholding. Fraud instances for each: a new card product; the Elliptic step 43; scenario 2's compromised terminals going stale after 28 days.
2. **How does the change arrive in time?** — Obvious attempt: "suddenly". Answer: sudden (a switch), incremental (a slow slide), gradual (a mixture whose proportion moves — the sigmoid window with centre p and width w, w = 1 being sudden), reoccurring (weekend, Christmas), and the outlier that is not drift (one terminal's bad day). Because: each pattern breaks a different estimator — a long window hides a sudden switch, a short one chases a reoccurring one.
3. **Why can't the model just be scored on the latest labels?** — Answer: on a transaction stream labels arrive δ days late (module 1), so the error stream describes the stream δ days ago. Because: the diagnose step of predict–diagnose–update runs on delayed feedback; a change in p(y|x) is invisible for at least δ days.
4. **Can change be seen before labels arrive?** — Obvious attempt: compare feature means day to day. Why it fails: means miss a change in shape and a change in a correlation. Answer: pool day A and day B, label each row by its day, train a classifier to tell them apart, and read its AUC as the distance (0.5 = indistinguishable); do it for every pair of days and plot the matrix. Because: a classifier's AUC is a distance between distributions that uses every feature at once. The matrix shows weekly banding: weekdays alike, Sundays and holidays a block, Fridays and Saturdays a block — reoccurring virtual drift, by construction label-free.
5. **A cheaper distance per feature?** — Answer: Hellinger between two histograms, $H(P,Q) = \frac{1}{\sqrt 2}\lVert\sqrt P - \sqrt Q\rVert_2$, in [0,1]. Because: it is symmetric, bounded, and insensitive to class imbalance when applied per class.
6. **How long a window should the model's statistics use?** — Obvious attempt: all history (more data is better). Why it fails: on a changing stream older items come from another distribution. Answer: any estimate on a stream has two errors — variance, which falls as more items are averaged, and staleness, which rises as older items enter; a sliding window of W gives weights 1/W, an EWMA gives λ(1−λ)^i with no memory; the right W or λ depends on the variance and the rate of change, which are unknown. Because: the sweet spot moves with the stream, so a fixed window is right only by luck (forward: a detector that sets the window, `change-detectors`).
7. **Which of the three October stories is the model's problem?** — Answer: run the label-free matrix (p(x) changed? reoccurring?), check the base rate when labels arrive (p(y)?), and only then attribute the rest to p(y|x). Because: the remedies differ — a reoccurring pattern asks for a kept model, a base-rate change for a re-threshold, real drift for relearning.

### Set pieces and worked examples to recreate
- The real-estate news triad: editor changes (population), crisis shifts the article mix (prior), the user buys a house and now wants holiday homes (real) (Gama Sec 2.1).
- The five-pattern panel: sudden, incremental, gradual, reoccurring, outlier-not-drift (Gama Fig. 2).
- The sigmoid drift window with p = 50,000, w = 20,000 vs w = 1 — accuracy dropping within the window and not recovering for a plain naive Bayes (MOA Tutorial 5 Examples 1–2).
- The day-distinguishability matrix with its weekly bands (Lucas & Jurgovsky Fig. 4).
- Scenario 2: 28-day terminal compromises make a planted change the detector of module 3 can see only through the delayed terminal risk (Handbook Ch3.2).
- Elliptic step 43: every model to ~0 illicit-F1 even retrained with oracle labels (Weber Fig. 2).
- The variance/reaction-time pair: window of W averages, variance ∝ 1/W, staleness ∝ W × rate (Gavaldà L6 slide 30).

### Pitfalls and terms to define
- Define "drift" before using "virtual" or "real"; the survey's "concept drift" is used by others for p(y|x) only — say which sense the course uses (the general one, with the three kinds named).
- The Lucas survey's Hellinger equation (eq. 4) is garbled; write the correct form.
- Keep "measuring shift on the features" (label-free, available today) and "detecting change on the error stream" (needs labels, δ late) apart; the next lesson is the second.
- "Prequential folds" (module 2) are a validation geometry; "prequential evaluation" on a stream (lesson 38) is per-item test-then-train; name both when the word first recurs.
- Day-distinguishability AUC is a distance, not a score of fraud; a reader will try to read it as "how fraudulent Sunday is".
- The weekly matrix is on proprietary data — the sourced figure stays as it is; the simulator version is an exercise.

### Recalled, not re-taught
- Train/delay/test and dropping old blocks (<Ref> `delayed-labels-prequential`); model selection by validation (<Ref> `gbm-model-selection`); the delay δ and the feedback loop (<Ref> `fraud-detection-system`); the delayed terminal risk window (<Ref> `point-in-time-features`); ROC-AUC as the probability a random positive outranks a random negative (classical-ml).

## FIGURE PLAN
- draw (key image): two 2-D class scatters side by side with the fitted boundary: left the boundary moves (p(y|x) changed), right the cloud moves under the same boundary (p(x) changed); a third small panel where only the class proportions change. Inspired by Gama Fig. 1.
- draw: five small mean-over-time panels — sudden, incremental, gradual, reoccurring, outlier — with the sigmoid window drawn under "gradual". Inspired by Gama Fig. 2 and MOA Tutorial 5 Figs 10–11.
- draw: <FigureSequence>, 3 frames — the predict–diagnose–update loop with the label arrow arriving δ days late; frame 2 a change at t, frame 3 the first error that reveals it at t + δ. Inspired by Gama Fig. 3.
- draw: <FigureSequence>, 3 frames — the day-distinguishability construction: pool day A and day B, label by day, fit, read AUC; frame 3 the AUC entered into one cell of a day × day matrix.
- source: `creditcard-lucas-day-shift-heatmap` — stem `day-shift-matrix`; the reader must see the weekly banding (weekday block, Sunday/holiday rows, Fri/Sat rows); float right beside the matrix paragraph.
- draw: variance vs staleness as two curves against window length W with their sum and its minimum, a second line for a faster-changing stream moving the minimum left. Inspired by Gavaldà L6 slide 30.
- draw: the three October stories as three small timelines (new product, fraud wave, new method) each annotated with which of p(x), p(y), p(y|x) moved and what each would show in the matrix and in the error stream.

## EXERCISE PLAN
1. Warm-up: for an EWMA with λ = 0.1 compute the weight on the item 10, 30 and 100 steps back and the effective window length Σ i·f(i).
2. [boundary probe] A stream whose p(x) changes while p(y|x) is fixed: show the Bayes-optimal rule is unchanged, then show why the model's precision at 100 can still fall (the base rate within the top 100 changed) — which kind of drift did the metric see?
3. [claim to refute] "The day-distinguishability AUC rose from 0.55 to 0.80 between Monday and Sunday, so the fraud concept drifted and the model must be retrained." Name what the matrix measures (p(x), reoccurring) and what would show real drift.
4. [derivation skipped] Derive the variance of a W-window mean under iid noise and the bias under a linear drift of rate r, and solve for the W that minimises their sum; show it scales as r^{-2/3}.
5. [research-shaped] On the simulator, compute the day-distinguishability matrix for 14 days with a small GBM per pair and report whether scenario 2's compromised terminals show as off-diagonal structure.
6. [mixed review] Place the sequence lesson's "validation right after training favours low regularisation but hurts later days" (<Ref> `sequence-models-for-transactions`) into the taxonomy: which kind of change, which pattern, and what the window choice of this lesson says about it.
7. FORWARD → `change-detectors`: simulate a Bernoulli error stream with p = 0.05 that jumps to 0.08 at step 5,000; plot the running mean with windows 100, 1,000 and 10,000 and mark when each first exceeds 0.065 — the reader sees the delay/false-alarm trade the next lesson turns into a statistic.

## ARC
- Spine step 7 "Drift and sequence": "The transaction stream drifts and the fraud evolves, so a model trained once ranks last: the sequence of an entity's events is itself a feature, change is measured on the features before labels arrive and detected on the error stream once they do, and the learner remembers, forgets and replaces itself on a cadence that the stream's own evaluation has to score."
- Inherits: the validation geometry and its dropped old blocks (module 2), the delay δ (module 1), the delayed terminal risk (module 3), the Elliptic collapse (module 6), the day-to-day co-movement (previous lesson).
- Contributes: the vocabulary of change (three kinds, five patterns), label-free shift measurement, the window-size trade-off.
- Hands off: the error-stream detectors (`change-detectors`); memory and forgetting (`stream-learning-and-adaptation`); drift the model itself causes (`alert-feedback-selection-bias`); the stability index on inputs (`model-risk-monitoring`).
