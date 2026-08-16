# Naive Bayes — research brief

Lesson: `naive-bayes` (module: boundaries, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/naive-bayes/lesson.mdx (22 min).
Goal: Construct a naive Bayes classifier from the conditional-independence assumption and compute smoothed predictions by hand.

## Sources
- CS229 §4.2 (event models Bernoulli vs multinomial for text; Laplace smoothing with the NeurIPS-deadline zero-probability story; discretization trick).
- Murphy §9.3 (parameter-count collapse; closed-form MLE per feature; NB→logistic connection §9.3.4).
- ESL §6.6.3 (naive Bayes as a GAM in log-space; why biased densities can still give good boundaries — the decision-vs-estimation point).
- Bishop §8.2.2 (NB as a graphical model — one figure idea only; no graphical-model machinery).

## Key points
1. Road 2 opens: model each class and invert with Bayes' rule. The counting problem stated first (L4): a full joint over 57 binary features needs 2^57 parameters per class; independence-given-class collapses it to 57 — the assumption is a capacity decision, priced in module-1 terms (huge bias, tiny variance).
2. The classifier assembled: priors from class frequencies, per-feature conditionals from counts; the log-space form (sum of per-feature log-likelihood ratios) — NB is a LINEAR classifier in indicator space; derive it.
3. The zero-count failure worked (a word appearing in no training spam → 0×anything = 0 posterior); Laplace smoothing derived AS MAP with a Dirichlet prior (mle-map's machinery cashed, not a hack).
4. Event models: Bernoulli (presence) vs multinomial (counts) vs Gaussian NB — one table with the per-feature likelihood and when each applies; a fully worked tiny text example (6 documents, 2 classes) run to prediction by hand.
5. Why it works while being false: the boundary needs only the RIGHT SIGN of the log-ratio, not correct densities (ESL's decision-vs-estimation argument); calibration is the casualty (probabilities pushed to 0/1) — module-5 seam.
6. When NB wins: small n, huge p, streaming counts; the generative bonus (missing features marginalize out trivially — show the one-line marginalization).

## Set pieces & gems
- CS229's NeurIPS-word zero-probability story — the canonical motivation for smoothing.
- The worked 6-document spam table — hand-computable end to end (build our own; the spam-filter lesson scales it to the real corpus).
- ESL's "biased densities, correct boundary" — the module's philosophical hinge, stated dryly.

## Pitfalls
- Keep Bayes-net vocabulary out (graphical models excluded); one figure of the class→features fan is enough.
- The NB-is-linear derivation is the lesson's analytic core — don't leave it as a remark.
- Don't oversell: the overconfidence pathology must be shown (two duplicated features double-count evidence — worked example).

## FIGURE PLAN
- draw: The parameter-count collapse — full joint table (2^d rows, grayed) vs per-feature tables (d small tables); the count arithmetic labeled. Single Figure, the opener.
- draw: The class→features fan — y at top, x₁…x_d below, independence stated as "no edges among x given y"; beside it the factored likelihood with matched colors. Single Figure (Bishop 8.2.2 idea without formalism).
- draw: FigureSequence (3 frames): the worked spam table — (1) counts per word per class, (2) smoothed probabilities (α=1 pseudo-counts visibly added), (3) one test document scored: per-word log-ratios summed to a verdict. The lesson's centerpiece.
- draw: NB as a linear classifier — the score rewritten as w·x + b with w_j = log ratios; the same 2-class scatter from logistic-regression with NB's line vs logistic's line (different fits, same family). Comparison panel.
- draw: Double-counted evidence — duplicate one feature and watch the fitted probability saturate (bar chart of p(y|x) before/after duplication). Single small Figure; the overconfidence demo.

## EXERCISE PLAN
1. Warm-up: score one new document by hand on the lesson's 6-document table (smoothed, log-space).
2. Boundary probe: a feature with identical distribution in both classes — show its log-ratio is exactly 0 and it drops out; then a feature seen ONLY at test time — what does each event model do with it?
3. Derivation skipped: derive Laplace smoothing as the posterior mean (not mode) under Dirichlet(α) — the (count+α)/(n+kα) formula; compare with the MAP version.
4. Claim to refute: "NB's independence assumption fails for real text, so its class probabilities are useless AND its classifications are too." Split and refute the second half: sign vs magnitude, with the duplicated-feature example showing exactly what breaks (calibration) and what survives (ranking/boundary).
5. Mixed review (E3): show Gaussian NB with shared per-class variances yields a linear boundary; compute it for 1-D two-Gaussian data — the doorstep of LDA.
6. Research-shaped: on a provided 200-message SMS-spam mini-corpus, fit multinomial NB and report the 10 most spam-indicative words with their log-ratios; flag any that look like leakage (sender artifacts) — spam-filter's audit previewed.
7. FORWARD (E7): compute NB's fitted p(y|x) as a function of a document's length when class-conditional word rates differ slightly — probabilities saturate to 0/1 exponentially in length. Solution: the calibration failure module 5 measures with reliability curves → Ref classification-metrics.

## ARC
- Inherits: MLE/MAP counting machinery (mle-map); the Bayes-rule frame (statistical-learning).
- Contributes: road 2 in its cheapest form — generative modeling as a capacity decision; smoothing as priors; the decision-vs-estimation insight.
- Hands off: the same generative road with Gaussian machinery and its exact relation to road 1 → lda-gda.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4).

## REVISION (vs old draft)
- Gains: the parameter-count opener as the argued motivation (old draft leads with the formula); the NB-is-linear derivation promoted to a section; Dirichlet-posterior smoothing derivation; the double-counting/calibration pathology worked; forward exercises into lda-gda and classification-metrics.
- Loses: interview register; "when it wins" listicle argued instead as the generative-bonus section.
- Demo: none (unchanged).
