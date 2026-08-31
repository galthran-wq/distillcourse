# Labeling strategies and natural labels — research brief

Lesson: `labels-and-feedback-loops` (module: training-data, core, planned).
Goal: Design a labeling strategy — natural labels, weak supervision, or active learning — and account for the feedback-loop length it imposes.

## Sources
- DMLS Ch.4: sampling (nonprobability biases; reservoir sampling 3-step algorithm, Fig 4-2, pp.82-88); hand labels — cost, multiplicity, lineage (pp.88-90); natural labels, implicit vs explicit, feedback-loop length, the Twitter ad-click delay study (Ktena et al., pp.91-94); weak supervision/Snorkel LFs + the Stanford radiologist case (Fig 4-5, pp.94-97); semi-supervision; transfer learning; active learning (pp.98-102). Table 4-2 (four methods × ground-truth-required).
- CS329S Lecture 3 (parallel): the active-learning toy figure (90% vs 70% at 30 labels); Karpathy's "how long do we need a labeling team" anecdote.
- Burkov Ch.3: the aerial-photo hand-segmentation timing ("about 30 minutes"; captures available); the 9-type bias taxonomy §3.2.4 (selection, self-selection — Amazon star ratings; sampling; labeling bias) — take 3-4 relevant ones, not all nine.
- MLPS Ch.5 (pp.53-60): label propagation; active-learning cycle + margin sampling diagrams (Figs 5-2/5-3/5-4); Snorkel LF code example (lf_contains_my / ABSTAIN).
- Rules of ML #34: the 1%-held-out-traffic trick for unbiased filter labels.

## Key points
1. Labels as a supply chain with three suppliers: paid annotators (slow, costly, private-data exposure, disagreement), the product itself (natural labels), programs (weak supervision). The design question: which supplier, at what latency, with what bias.
2. Hand labels honestly costed: the Burkov 30-minutes-per-image datum; label multiplicity (three annotators, three answers — the tie-breaking-protocol need); lineage (which labeler, which guideline version — ties to versioning, M4).
3. Natural labels and feedback-loop length as a SYSTEM parameter: click (minutes) vs purchase-return (weeks) vs fraud (months); any fixed labeling window undercounts — the Twitter delay study (most clicks in 5 min, tail for hours). Implicit labels' bias: absence of click ≠ negative. Rules #34's deliberate 1% exposure for unbiased negatives — the filter case.
4. Weak supervision worked: labeling functions with ABSTAIN, combination/denoising in one paragraph, and the headline case — one radiologist, 8 hours of LFs ≈ a year of hand labels (with the honest caveat: LFs need domain experts and validation labels still).
5. Active learning: label where the model is least sure — margin sampling; the toy result (same 30-label budget: 90% vs 70%). When it pays: expensive labels, cheap unlabeled pool.
6. Stream sampling: reservoir sampling as the tool for "keep 10k uniformly from an unbounded click stream"; selection biases of convenience samples (self-selection: star ratings U-shape).

## Set pieces & gems
- Radiologist case with the measured plot (capture designingmac-s1-weak-supervision-cxr) — the section's evidence.
- Twitter ad-click delay — the number that turns "labeling window" into a design decision.
- Burkov's segmentation-cost pair of photos (captures machinelearn-aerial-labeling-photo fig-000/001) — labeling cost made visceral.
- Reservoir sampling — small algorithm, prove the uniform-probability invariant in two lines (k/n at step n).
- Amazon star-rating self-selection (rate only when thrilled or furious) — bias exhibit.

## Pitfalls
- Do not re-teach class imbalance / SMOTE — classical-ml prerequisite; imbalance appears only as "why weak labels skew" if at all.
- Semi-supervision and transfer learning: one paragraph each (Table 4-2 carries them); do not balloon.
- The feedback-loop-length concept must be planted cleanly — module 6 (continual learning cadence) and module 7 (natural labels for recsys) both pick it up; say so at the close.
- Snorkel: concept + one code-shaped LF example; no framework tutorial.

## FIGURE PLAN
- draw: The three label suppliers as a comparison panel: cost, latency, bias risk, scale — annotators / product / programs. Original composition.
- draw: Feedback-loop-length axis: tasks placed on a log-time axis from click (minutes) to fraud (months), with the retraining-cadence implication annotated underneath. Original; DMLS Ch.4 prose.
- draw: FigureSequence (4 frames): the labeling-window undercount — frame 1 clicks arriving over time after an impression; frame 2 a 5-min window drawn, CTR computed; frame 3 window widened to 1h, CTR rises; frame 4 the bias stated (any window underestimates; longer window = slower labels). Inspired by the Ktena et al. discussion.
- draw: Weak supervision pipeline: N labeling functions (some ABSTAIN) → denoiser → probabilistic labels → training. Inspired by DMLS Fig 4-4.
- source: designingmac-s1-weak-supervision-cxr — the Dunnmon et al. measured ROC-AUC-vs-datapoints plot (save as `weak-supervision-cxr`); reader must see the DP curve catching the FS curve — the 8-hours≈1-year claim as data; centered in the weak-supervision section.
- source: machinelearn-aerial-labeling-photo-labeled — Burkov's hand-segmented port photo (save as `labeling-cost-photo`); reader must see the polygon count that took 30 minutes; float right beside the hand-label costing paragraph.
- draw: Margin sampling: decision boundary with uncertain band highlighted; chosen points near the boundary vs random scatter, with the 90/70 result stated. Inspired by MLPS Figs 5-2/5-3 and the CS329S toy.

## EXERCISE PLAN
1. Warm-up: for five products (spam filter, delivery ETA, credit default, song recommender, content moderation), name the natural label if any, its loop length, and its implicit-label bias.
2. Boundary probe: a task with NO natural label and no affordable annotators (rare-disease triage). Which supplier remains, what does weak supervision require to work here (expert LF authors + a small gold set), and what breaks if the gold set is skipped?
3. Claim to refute: "user reports give us free moderation labels." Name the two biases (only-seen content gets reported — the spam-folder loop; reporting propensity varies by user group) and the Rules #34 fix with its explicit cost.
4. Derivation the lesson skipped: prove reservoir sampling's invariant — after n items, each is in the k-reservoir with probability k/n (induction step shown fully).
5. Research-shaped: from the radiologist plot, read off approximately how many hand-labeled examples the fully-supervised model needs to match 20 LFs; state the labeling-hours ratio using a plausible per-image cost.
6. Mixed/spaced (E3): the feature platform's click-stream ingestion (module 2) — where does reservoir sampling attach, and which store receives the sampled set?
7. FORWARD (E7): your training set is "all impressions with a click within 10 minutes, labeled positive; the rest negative." Write the two ways future information can still leak into this dataset (features computed as-of-now; duplicated impressions straddling the split). Solution: both are leakage mechanisms, formalized next lesson → Ref data-leakage-and-splitting.

## ARC
- Inherits: the substrate (module 2) can store and move events; the design doc's data section (module 1) is still a stub.
- Contributes: labels as a designed supply chain with latency and bias, plus the sampling tool for streams.
- Hands off: data exists; whether the offline estimate built on it can be TRUSTED is the leakage question → data-leakage-and-splitting.
- Spine step: "Training data is manufactured, not given…" (step 4, Data is manufactured).
