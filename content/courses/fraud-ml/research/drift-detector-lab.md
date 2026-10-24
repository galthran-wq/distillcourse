# Lab: a stream-learning toolkit — change detectors and an adaptive classifier — research brief

Lesson: `drift-detector-lab` (module: sequences-drift, type: lab, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. This brief is what the lab-author skill is grounded in.
Goal: Build a stream-learning toolkit — a bit-stream generator with planted abrupt and gradual changes, four change detectors compared by false alarms and detection delay, a windowed prequential scorer, and a streaming naive Bayes that adapts on alarm — and run it on a drifting transaction stream
Opening (verbatim, the lesson must start with it): The lab builds a stream-learning toolkit: a bit-stream generator with planted abrupt and gradual changes, four change detectors compared by false alarms and detection delay over random runs, a prequential scorer with a sliding window, and a streaming naive Bayes that resets on alarm — run on a drifting synthetic stream and then on the simulator.

## Sources to consult
- MOA book ch. 5 (research/texts/moa-book-ch5-dealing-with-change.txt): 5.3.1 the measures (MTFA, MTD(θ), MDR(θ), ARL), 5.3.2 CUSUM and Page–Hinkley (guidelines k, h), 5.3.3 the window tests (normal test at 1.96; harmonic mean n = 1/(1/n0 + 1/n1) for the Hoeffding test), 5.3.4 DDM, 5.3.5 ADWIN, 5.5 Exercises 5.3, 5.5, 5.6, 5.7 (from line ~1245). Display formulas are lost in the flattening: the DDM σ, the Hoeffding cut and the normal test statistic are taken from Gama et al. 2014 Sec 3.2 (research/texts/asurvey-s1-.txt) and App. A Algorithms 1–3.
- Gavaldà, Lecture 7 (research/texts/gavalda-ds-lecture7.txt), slide 26 Exercise 1; Lecture 8 slides 6–11 (prequential, its pessimism, fading/sliding windows, Kappa); Lecture 6 slides 31–36 (CUSUM with v ≈ σ, h = kσ; ADWIN's test contract).
- MOA Tutorial 5 (research/texts/moa-tutorial5-concept-drift.txt): Sec 3 (the ConceptDriftStream sigmoid: concept A to B over a window of width w centred at p; w = 1 abrupt), Sec 4 (recursive multiple drifts), Sec 5 (incremental hyperplane), Sec 7 Exercises 7.1–7.3.
- Carta OML1 (research/texts/carta-oml1-intro.txt): the predict-then-learn loop, river's GaussianNB and progressive_val_score, the Exercises cell; OML2 (carta-oml2-concept-drift.txt): the three-uniform stream and the hand-written CUSUM class; the two-sided CUSUM demo (carta-oml2-cumusm.txt).
- Gama et al. 2014 App. B.1: the SEA generator (x1 + x2 ≤ θ with θ ∈ {9, 8, 7, 9.5}) and Agrawal; Sec 4.1 Kappa.
- Handbook Ch3.2 simulator (reproducible-Chapter_3_GettingStarted_SimulatedDataset.md): the generator the held-out transaction stream is built from, with scenario 2's 28-day terminal compromises as the planted concept change.

## EXPLANATION PLAN
### The problem as the newcomer meets it
Three lessons gave the reader four detectors, the measures to judge them, a stream scorer and the forgetting rules; none has been run. The lab makes each one code and makes the comparison numbers theirs. The learner must know, before the first checkpoint: the measures are defined on a stream with a KNOWN change point (so a generator is needed first); the scorer must predict before it learns; the adaptive learner's reset is what the alarm is for.

### Chain of sub-problems
1. **A stream whose change point is known** — a Bernoulli bit stream with P(1) = p_A before and p_B after; abrupt (switch at position p) and gradual (the probability of drawing from B rises along a sigmoid of width w centred at p). Because: MTFA needs a drift-free stretch and MTD needs a true change position.
2. **Four detectors as functions over that stream** — Page–Hinkley, DDM, a two-window normal test, ADWIN's cut; each returns alarm positions. Because: the comparison is only fair if all four see the same runs.
3. **A scorecard** — run R seeded streams, record false alarms on the stable stretch (→ MTFA), the first alarm after the change (→ MTD), runs with no alarm (→ MDR); average. Because: a single run says nothing about a stochastic detector.
4. **A scorer that moves with the stream** — windowed and fading prequential accuracy on (prediction, label) pairs. Because: a learner that resets must be scored where it is, not since the start.
5. **A learner that uses the alarm** — a Gaussian naive Bayes with per-class running means and variances, updated one item at a time, predict-then-learn, whose statistics reset when the detector on its error fires. Because: the memory bound of the exercise (statistics per attribute × value × class, plus a log factor) is met by counts, not stored items.
6. **The fraud stream** — the simulator with a planted concept change scored by windowed Kappa; the open task. Because: the toolkit is for transactions, not bits.

### Set pieces and worked examples to recreate
- Carta's three-segment stream with alarms at 1055/1059/1154/1156 and 2047/2085/2135/2136 as the first sanity check of the four detectors (OML2).
- The sigmoid window of Tutorial 5 with p = 50,000, w = 20,000 vs w = 1 (Sec 3.1–3.2).
- SEA's threshold switch θ: 9 → 8 → 7 → 9.5 (Gama App. B.1) as the concept vocabulary of the SEA-like stream.
- The 2/√T pessimism curve against the windowed curve (Gavaldà L8 slide 7).

### Pitfalls and terms to define
- MTFA on the stable stretch only; the stretch must be long (≥ 10× the expected MTFA at the chosen threshold) or the estimate is censored.
- DDM's t is items since the last reset.
- ADWIN's cut uses the harmonic mean; the arithmetic mean is the canonical bug.
- Predict-then-learn: learning first is the canonical scorer bug and must be a declared wrong variant.
- ADWIN's δ, CUSUM's drift allowance and the fraud label delay are three different δs — the notebook uses `delta_c`, `drift_allowance`, `label_delay`.
- A detector on a 0/1 error stream vs on a real-valued stream: the lab's generator is bits; the fraud part feeds the error indicator.

### Recalled, not re-taught
- The derivations (<Ref> `change-detectors`), the scorer's rationale (<Ref> `stream-learning-and-adaptation`), drift patterns (<Ref> `concept-drift`), naive Bayes (classical-ml), the simulator (<Ref> `canonical-datasets`), Kappa (<Ref> `stream-learning-and-adaptation`).

## LAB PLAN

Artifact: one notebook producing a reusable `streamkit` module — `drift_bit_stream`, `page_hinkley`, `ddm`, `two_window_test`, `adwin_cut`, `detector_scorecard`, `prequential_score`, `StreamingNaiveBayes` — exercised on seeded bit streams, then on a SEA-like feature stream with three switches, then on a transaction stream from the handbook-style simulator with a planted concept change, ending with a windowed-Kappa score on a held-out drifting stream.

CANON GROUNDING:
- MOA book ch. 5, Exercise 5.7 (the model for the detector half): "For the programming oriented: program a random bit-stream generator in which the probability of getting a 1 changes abruptly or gradually after a long period with no change. Program the Page-Hinkley test, the DDM test, and the three tests in section 5.3.3 with a reference window and a sliding window. Compare the measures described in section 5.3.1 for these tests, including different window sizes for the last three tests. Do not forget to average each experiment over several random runs to get reliable estimates." Checkpoints 1–6 are this exercise. Departure: of the three 5.3.3 tests the lab implements the normal test and the Hoeffding test (as ADWIN's cut), not the χ² variance test, because the lesson derived the first two and the third adds a parameter without a new idea; Ex. 5.3 (two-sided) and 5.5 (DDM's slow reaction) become notebook asserts and exercises, not checkpoints.
- Gavaldà, Lecture 7, Exercise 1 (the model for the adaptive half): "Design a streaming version of the Naive Bayes classifier for stationary streams. Now use ADWIN or some other change detection / tracking mechanism for making it work on evolving data streams. Recall that the NB classifier uses memory proportional to the product of #attributes × #number of values per attribute × #classes. Expect an additional log factor in the adaptive version. Update time should be small (log, if not constant)." Checkpoint 8 is this exercise with a Gaussian naive Bayes (continuous transaction features) and a reset-on-alarm policy; departure: the memory bound is checked by a notebook assert on the state size, not graded.
- MOA Tutorial 5, Sec 7: 7.1 "Use generators.SEAGenerator to simulate 1 abrupt drift … 100 thousand instances; the drift should occur at instance 50,000; … SEA function 1 … function 2; evaluate the stream using EvaluatePrequential every 1,000 instances and a HoeffdingTree"; 7.2 "2 gradual drifts … 1 million instances; drifts at 250k (window of size 50k) and 600k (window of size 200k); functions 1, 2, 3; EvaluatePrequential every 10,000 instances"; 7.3 "generators.AgrawalGenerator … 3 abrupt drifts … every 250,000 instances … functions 5, 3, 2, 6". The lab re-implements the SEA stream and the sigmoid window in numpy at a tenth of the sizes (10k / 100k) and scores with the prequential scorer of checkpoint 7; departure: a streaming naive Bayes stands in for the HoeffdingTree because the Hoeffding tree is starred material and the exercise's point — the accuracy curve dropping inside the window — is learner-independent; Agrawal is replaced by a second SEA parameterisation to keep one generator.
- Carta OML1, Exercises: "implement a window or discount factor in the prequential accuracy … Plot the learning curve"; "compare the prequential accuracy against an holdout accuracy" — checkpoint 7 and its plot. Carta OML2: the hand-written CUSUM class (δ = 0.005, λ = 50, min_obs = 30) run beside ADWIN, Page–Hinkley, DDM on the three-uniform stream with alarms at 1154/2135 — the notebook ships that stream as a fixture and the learner's detectors are checked against those indices as local asserts (the exact checkpoints use seeded bit streams).

Dataset / inputs (all shipped, all ours):
- `data/uniform3.npy`: Carta's 3,000-value stream regenerated with its seed (numpy, our code) — fixture for local asserts.
- Bit streams: generated in-notebook by the learner's own checkpoint 1 from seeds the manifest fixes.
- `data/sea_drift.npz`: a 100k-row SEA-like stream (three uniform features in [0,10], label x1 + x2 ≤ θ with noise, θ switching 9 → 8 → 7 → 9.5 at the Tutorial's positions scaled by 1/10, one gradual window) — our generator, MIT-style licence of the repo.
- `data/tx_stream.csv` (≈ 60 days, ≈ 10k rows/day at a reduced scale, 14 handbook-style features, labels for the first 40 days): a handbook-style simulator run (our implementation from the published description; the handbook's code is GPL v3 and is not copied) with scenario-2-style terminal compromises switched on at day 25 and a scenario-3-style amount multiplier switched off at day 45 — the planted concept changes. Days 41–60 labels in `private/tx_stream_labels.csv` for the metric checkpoint.

Checkpoints (ids as in course.yaml; the lab-author may split or deepen):
1. `drift-bit-stream` (exact, warm-up): `drift_bit_stream(n, p_a, p_b, position, width, seed)` returning the bits and the per-step mixing probability; verified on fixed seeds (digest); wrong variants: a hard switch when width > 1; the sigmoid centred at position + width/2.
2. `page-hinkley` (exact, warm-up): statistic, running minimum, alarm positions with reset; consumes 1's streams; wrong variants: no reset after an alarm; the running mean updated after the deviation is taken instead of before.
3. `ddm-bands` (exact, warm-up): running error rate since the last reset, s_t = √(p_t(1−p_t)/t), p_min/s_min tracking, warning and drift positions; wrong variants: t counted since the stream start; bands at 2s_t and 3s_t instead of s_min.
4. `two-window-test` (exact): reference window vs sliding window, the normal test on the difference of means at a given false-alarm probability (1.96 at 5%), the sliding window becoming the reference after an alarm; wrong variants: pooled sd without the 1/n0 + 1/n1 factor; the reference window sliding too.
5. `adwin-cut` (exact): for a window array, test every split with ε_cut = √((1/2m) ln(4|W|/δ)), m the harmonic mean of the sub-window sizes, return the retained window; wrong variants: arithmetic mean for m; ln(|W|/δ) without the 4; cutting on < instead of ≥.
6. `detector-scorecard` (exact): MTFA on the stable stretch, MTD after the planted change, MDR over R seeded runs for each detector from 2–5; consumes 1–5; verified on fixed seeds and R; wrong variants: counting the post-change alarms as false alarms; MTD measured from the window centre instead of its start for gradual change (the manifest states the convention: from position − width/2).
7. `prequential-scorer` (exact): windowed accuracy (window w) and fading accuracy (factor α) over a (prediction, label) stream, plus Kappa; wrong variants: learning before predicting is not testable here, so the variant is the cumulative (landmark) accuracy returned in place of the windowed one; the fading update normalised wrongly.
8. `streaming-naive-bayes` (exact): a Gaussian naive Bayes with running per-class means/variances (Welford), `predict_one` then `learn_one`, and a `reset()` called when a detector on its error indicator fires; consumes 2 or 5 as the detector and 7 as the scorer; verified by the prediction sequence on a seeded SEA stream (digest); wrong variants: learn before predict; variance from the biased formula with n instead of n − 1 (the manifest fixes the convention); no reset.
9. `which-detector-for-fraud` (review, optional): rubric accepts an answer that names the δ-day lag of the error stream, the daily swing of the fraud-card count, and chooses a detector on a per-day budget-normalised metric with an explicit MTFA; "ADWIN because it has no parameters" alone is insufficient.
10. `beat-prequential-kappa` (metric, optional, LAST): an adaptive learner of the learner's design (reset-on-alarm naive Bayes, a windowed retrained tree, or a DWM-style pool), scored by windowed Kappa (w = 2,000) over days 41–60 of `tx_stream` with the private labels; the server recomputes from submitted predictions.

Final open task: windowed Kappa over the held-out drifting transaction stream; rough threshold ≈ 0.30 — calibrated by running the reference (a daily-retrained depth-6 tree on a 30-day window with all past frauds kept ≈ 0.36 on our stream; the static naive Bayes ≈ 0.22; the reference must clear the bar by ≥ 0.02).

Known-wrong variants to declare: listed per checkpoint; the canonical bugs are the missing reset (2), t since the stream start (3), the sliding reference (4), the arithmetic mean in the cut (5), post-change alarms counted as false (6), landmark accuracy for windowed (7), learn-before-predict (8).

NOT blanked (ship complete): the SEA-like generator and the transaction-stream loader, the `uniform3` fixture, plotting helpers (stream with alarm ticks; windowed vs landmark accuracy curve with drift windows shaded; the MTFA–MTD scatter per detector), the Welford helper's signature and docstring (the body is the learner's), a two-sided CUSUM shown complete as the "reference → analogous" device for Page–Hinkley.

est_hours: 4.5. Progression: warm-ups (1, 2, 3) → composing chain (4, 5 → 6; 7 → 8, which consumes 2 or 5 and 7) → one open metric last (10) → review garnish (9). Required: 1–8.

## ARC
- Spine step 7 "Drift and sequence": "The transaction stream drifts and the fraud evolves, so a model trained once ranks last: the sequence of an entity's events is itself a feature, change is measured on the features before labels arrive and detected on the error stream once they do, and the learner remembers, forgets and replaces itself on a cadence that the stream's own evaluation has to score."
- Inherits: the four detectors and their measures (`change-detectors`), the prequential scorer, forgetting and reset-on-alarm (`stream-learning-and-adaptation`), the drift patterns and the sigmoid window (`concept-drift`), the strategy ranking (`drift-strategies-on-worldline`), the simulator (`canonical-datasets`).
- Contributes: the module's results as verified code and the learner's own MTFA–MTD scorecard.
- Hands off: the detector and the windowed scorer to the capstone's monitor (`pipeline-capstone-lab`); the reset policy as the "informed replacement" the stability index of `model-risk-monitoring` triggers.
