# The spam filter: three boundaries on one corpus — research brief

Lesson: `spam-filter` (module: boundaries, core, planned). NEW — module 4's APPLICATION lesson (L16).
Goal: Compare naive Bayes, logistic regression, LDA, and an RBF-SVM on the ESL spam corpus and interpret what each fitted boundary claims about the data.

## Sources
- ESL Ch. 1 (Table 1.1: the spam data — 4,601 messages, 57 word/character frequencies, collected from ONE HP employee's mail; 'george', 'hp', '!', 'free' among features), §4.4.2-adjacent spam fits, §9.1.2 (additive logistic 5.3% — the number spam-tree inherits).
- Murphy §18.4/§18.6 (the 'george'/'hp' leakage observation: the recipient's own name and employer as top features — "a memorable illustration of dataset-specific leakage").
- ESL §12 (SVM on spam-scale data — context for the RBF fit).
- The corpus itself: UCI Spambase (public), shippable subset.

## Key points (APPLICATION spec)
- The artifact: the spam corpus — the classical era's live deployed problem (server-side mail filtering) and ESL's own running benchmark; this lesson establishes it as THE COURSE'S benchmark, re-entered by spam-tree (module 6) and spam-ensembles (module 7).
- Module results used: naive Bayes with smoothing (naive-bayes); logistic regression + regularization (logistic-regression); LDA and its Gaussian assumptions on frequency data (lda-gda); RBF-SVM with (C, γ) chosen sensibly (svm-dual-kernels); the generative-vs-discriminative frame for reading their disagreements.
- Where the idealization departs: adversarial drift (spammers adapt — iid dies); one person's mailbox (features like 'george' are leakage w.r.t. any OTHER deployment); asymmetric costs (a lost real mail ≫ a seen spam) — the module-5 agenda stated as this lesson's unfinished business.
1. The data honestly introduced: what a feature row is (percentage of words matching 'free', run-lengths of capitals), the base rate (39.4% spam), and the collection story.
2. Four fits, one table: test errors of NB / logistic / LDA / RBF-SVM on a common split (own computation; expected neighborhood: logistic ≈ LDA ≈ 7–8%, NB worse in error but competitive in ranking, SVM ≈ 6–7%).
3. Reading the models: top NB log-ratios vs top logistic coefficients — mostly agreeing ('!', 'free', 'remove' spamward; 'george', 'hp' hamward); the leakage discussion (why 'george' is a great feature HERE and a terrible one anywhere else).
4. Where the roads disagree: NB's overconfident probabilities (calibration teaser with one reliability bin table); LDA's Gaussian assumption vs zero-inflated frequency features (the residual honesty); the SVM's win priced in tuning effort.
5. Threshold economics: with a 10:1 cost of false-positive (lost mail), where does each model's operating threshold land — decision theory from lesson 1 applied with real numbers (full metric machinery deferred to module 5, said explicitly).

## Set pieces & gems
- The 'george' leakage story (Murphy) — the course's first live leakage audit; module 5 formalizes it.
- ESL's error ladder for spam across methods — begin the course-long table (linear ~7%, additive 5.3% and tree 9.3% arrive in module 6, ensembles ~4.5–5.4% in module 7).
- NB's saturated probabilities on long messages (naive-bayes's forward exercise cashed on real data).

## Pitfalls
- No new theory; every section is retrieval-plus-application (this is the L16 closer).
- Do not run the module-5 metrics beyond one threshold table and one reliability observation — name the debt instead.
- The numbers we compute are OUR split's; label them as such next to ESL's published ones (reproduction discipline).

## FIGURE PLAN
- draw: One feature row anatomized — a real-ish spam message rendered with its 57-feature vector as a labeled bar strip ('free' 2.1%, '!!!' runs, capitals run-length). Single Figure, opener.
- draw: The four-model error table as a dot plot with our measured errors ± binomial SE; ESL's published reference points as hollow markers. Single Figure.
- draw: Coefficient concordance — top-10 spamward and hamward features under NB log-ratios vs logistic coefficients, two aligned bar columns with connecting lines; 'george'/'hp' flagged amber as leakage. Key image candidate.
- draw: Reliability teaser — predicted-probability deciles vs observed spam rate for NB (S-shaped, overconfident) and logistic (near-diagonal). Two-panel; module-5 doorstep.
- draw: Threshold economics — expected cost vs threshold curves at 1:1 and 10:1 costs for the logistic model; chosen operating points marked. Single Figure.

## EXERCISE PLAN
1. Warm-up: from the fitted logistic coefficients (given), compute the odds multiplier of one additional '!' run and of the word 'meeting'.
2. Boundary probe: delete 'george' and 'hp' from the feature set and refit (provided pipeline) — measure the error change; state why the DEPLOYED filter should prefer the degraded number.
3. Claim to refute: "NB beat logistic on ranking, so its probabilities are fine." Refute with the reliability table — ranking (AUC-flavored) and calibration are different properties; name where each matters in a mail pipeline.
4. Research-shaped: reproduce the error table on a fresh seed/split; report which pairwise gaps survive the ±SE bars and which were split noise.
5. Mixed review (E3): the LDA fit assumes Gaussian class-conditionals — test it: QQ-plot one frequency feature within class (given helper); connect the violation to lda-gda's robustness discussion.
6. FORWARD (E7): compute the full confusion matrix at threshold 0.5 and at the 10:1-cost threshold; note that no single number summarizes the change. Solution: the metric menu that does is the next lesson → Ref classification-metrics.

## ARC
- Inherits: all four classifiers of module 4 plus the generative/discriminative reading frame.
- Contributes: the module cashed out on the classical deployed problem; the course benchmark established with its first ladder rungs; the first live leakage audit.
- Hands off: everything this lesson had to defer — metric choice, calibration, honest protocols, cost curves — is module 5, stated as the closing sentence.
- Spine step: "Three independent principles … all arrive at a linear boundary" (step 4, closing move before the lab).
