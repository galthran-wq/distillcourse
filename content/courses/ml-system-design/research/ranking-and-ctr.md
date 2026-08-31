# Ranking models and CTR prediction — research brief

Lesson: `ranking-and-ctr` (module: canonical-designs, core, planned).
Goal: Design the ranking stage — pointwise CTR prediction with calibration, position-bias correction, and normalized cross-entropy evaluation.

## Sources
- Khang Pham: Ch.2 (pp.110-118) point/pair/list-wise; RankNet pairwise probability + the observation that pairwise wins AUC and loses nDCG/calibration; position bias — position-as-feature + IPS family; Ch.1 (pp.45-48) NCE fully worked (fixed-0.2 vs fancy model across two base rates: raw log loss 0.36-vs-0.65 flips to NCE 1.11-vs-0.945); (pp.68-80) Wide & Deep (memorize/generalize), DCN v2 (0.6% AUCLoss gain called significant; 2 cross layers best practice), DLRM (one Remark); Ch.2 (pp.121-126) calibration causes + Facebook downsampling correction (recalled from offline-evaluation); Ch.6 Ad Click Prediction (pp.184-194): waterfall ad serving, NCE + calibration as the offline pair.
- Aminian & Xu Ch.8 (pp.171-194): CTR design end to end; NCE worked (~0.324); feature crosses/factorization machines; calibration; Ch.10 (p.215): the multi-task engagement-score table (click 23%×1 + like 48%×5 + comment 12%×10 + share 4%×20 + friend-request 0.1%×30 − hide 0.005%×20 − block 0.0003%×50 = 4.65885).
- Rules of ML #36 (position feature: train with, serve constant, additive never crossed) — recalled from training-serving-skew, now the full mechanism.
- Offline-evaluation lesson: calibration machinery — this lesson APPLIES it where mistakes cost money (auction: E[value] = P(click)×bid needs honest P).
- Instagram cross-modal Gaussian-mapping blend (Khang p.78) — one Remark on making heads comparable.

## Key points
1. Why pointwise won production: the ranker's output is consumed as a PROBABILITY (auctions, expected-value ranking, multi-task blending), not just an ordering; pairwise (RankNet) optimizes order and loses probability meaning — the AUC-good/calibration-bad decoupling stated with Khang's observation and the SVM-calibration capture recalled.
2. NCE as the metric that survives base-rate changes: the full worked example — a constant-0.2 predictor beats an informative model on raw log loss when the base rate is 0.1 (0.36 vs 0.65), and NCE (divide by the entropy of the base rate) flips it (1.11 vs 0.945); NCE < 1 = learned something. Derive the normalization's meaning in two lines.
3. Architectures as automated feature crossing (tie to features-at-scale): wide&deep = hand crosses + embeddings; DCN = crosses learned layer-wise; the honest scale of wins (0.1% AUCLoss = significant at ads scale — small numbers, huge money); DLRM one Remark. No deep-architecture zoology.
4. Calibration for money: the auction chain P(click)×bid; downsampling correction recalled with a Ref and applied (train on 1:10 downsampled negatives → correct q at serving); calibration plot as a production monitor (ties to M6 — sum(pred)/sum(label) drifting is an alarm).
5. Position bias as the labels' corruption: clicks confound quality×position; the mechanism (Rule #36): position as an additive training feature, served constant; IPS reweighting in one paragraph (weight clicks by 1/propensity); the randomized-position holdout as ground truth (M6 exercise recalled).
6. Multi-task heads → one score: the engagement-score table worked in full (4.65885); where the weights come from (business, tuned via experiments — objective decoupling from M1 returning at scale); negative heads (hide/block) as guardrails in the score.

## Set pieces & gems
- The NCE double-worked example — the lesson's centerpiece computation (both Khang's and Aminian's versions agree; use Khang's numbers).
- The engagement-score table — a complete, reusable numeric example of multi-task → rank.
- 0.1% AUCLoss = significant (Google DCN) — scale recalibrates what "improvement" means.
- The waterfall ad-serving Remark — why ranking latency budgets are brutal.
- Instagram's Gaussian mapping — making two heads' scores comparable (Remark).

## Pitfalls
- Coordination with the module's case lessons: this lesson owns the MACHINERY — the NCE worked example, calibration-for-money, position bias, and the engagement-score table's first full working. design-feed-ranking recalls and EXTENDS the table (weight provenance, sensitivity, per-head calibration precondition — with fresh numbers); design-ad-click-prediction owns the ads SYSTEM end to end (waterfall, delayed clicks, downsampling-in-the-pipeline, budget-split experiments). Keep the auction here as motivation only; do not drift into the full ads dissection.
- No deep-CTR architecture tour (DeepFM/xDeepFM/etc.) — wide&deep + DCN carry the idea; everything else is References.
- RankNet: the pairwise probability and its consequence only; no gradient derivation (not an IR course).
- IPS: one paragraph + pointer; the estimator's variance issues are out of scope.
- Multi-task learning mechanics (shared bottoms, MMoE): one sentence naming, no more.

## FIGURE PLAN
- draw: The three ranking formulations on one 3-item example: pointwise scores, pairwise comparisons, listwise permutation — with what each optimizes and what each guarantees about probabilities. Original.
- draw: FigureSequence (3 frames): the NCE computation — frame 1 the two models' predictions on the toy set; frame 2 raw log loss computed (constant model "wins"); frame 3 divide by base-rate entropy — verdict flips; each arithmetic step visible. From Khang pp.45-48.
- draw: The auction chain: P(click) → ×bid → expected value → auction rank, with a miscalibrated 0.31→0.25 correction shown changing the winner. Original.
- draw: Position-bias mechanism: training rows with position feature; serving request with position=const; the additive-model note; beside it the IPS alternative (clicks reweighted 1/propensity). Inspired by Rules #36 + Khang pp.117-118.
- draw: The engagement-score table rendered as a horizontal bar composition: each head's probability × weight stacking into 4.66, negative heads subtracting in warning color. From Aminian Fig 10.4.
- draw: Wide&deep/DCN as feature-crossing machines: hand-crossed wide path + embedding deep path merging; DCN's layered crosses as "the crosses learn themselves". Inspired by Khang Figs pp.68-77.

## EXERCISE PLAN
1. Warm-up: compute NCE for a model with log loss 0.273 on a dataset with base rate 4% (base-rate entropy given); interpret NCE=0.32.
2. Boundary probe: NCE at base rate 50% — show the normalizer is maximal and NCE ≈ rescaled log loss; state why NCE matters MOST at extreme base rates (ads' regime).
3. Claim to refute: "our new ranker's AUC rose 0.02; ship it to the auction." Construct the miscalibration that raises AUC and loses auction revenue (scores compressed toward 0.5); name the two checks (calibration curve; NCE) that catch it.
4. Derivation the lesson skipped: derive why an additive position term can be dropped at serving without reordering items (argmax invariance under a constant shift) — and why a position×feature CROSS breaks this (Rule #36's "never crossed" justified).
5. Production: recompute the engagement score after the business doubles the share weight and adds weight −100 for "report"; which item flips in a given two-item comparison?
6. Mixed/spaced (E3): the downsampling correction from offline-evaluation — your CTR trainer downsamples negatives 10:1; a raw prediction reads 0.35; compute the corrected serving probability and the NCE impact of forgetting the correction (directionally).
7. FORWARD (E7): the ranker needs a relevance signal for QUERIES, not just users — "similar listings to this one". Note what object must be learned for query-item similarity at retrieval scale. Solution: embedding spaces trained contrastively — next lesson → Ref embedding-based-search.

## ARC
- Inherits: the funnel's stage-2 slot from recommender-funnel; calibration machinery from offline-evaluation.
- Contributes: pointwise CTR with honest probabilities — NCE, calibration-for-money, position-bias correction, multi-task scoring.
- Hands off: retrieval and ranking for SEARCH-shaped problems — embeddings trained for similarity, and the metrics that respect order → embedding-based-search.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
