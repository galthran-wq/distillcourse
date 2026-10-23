# Temporal validation with delayed labels — research brief

Lesson: `delayed-labels-prequential` (module: rare-positives, core, planned). NEW.
Goal: Design a train/delay/test validation for a transaction stream and explain why prequential folds estimate the test week where random folds and AUC-selected depth do not.
Prerequisite from classical-ml: k-fold CV, optimism, time-series folds (cross-validation-bootstrap), leakage taxonomy (imbalance-leakage). Recalled, not re-taught.

## Sources
- Handbook Ch3 BaselineModeling "Defining the training and test sets": delay period between train and test (labels only after complaint/investigation; one week a simplification, a tunable parameter); get_train_test_set — for each test day remove transactions of cards known compromised at (day − delay); simulated baseline: 67,240 train tx / 598 frauds; test 58,264 / 385 (0.66%).
- Handbook Ch5 in full: Fig 1 stream of weekly blocks (train blocks, delay block, discarded old blocks, test block) — "purpose is to maximise detection of FUTURE fraud; older blocks dropped for concept drift"; validation mimics test with the same delay, delta_valid = delta_test (Fig 2, 4); training-vs-test with depth sweep (train metrics rise to a perfect fit at depth 50, test peaks at depth ~6; AUC rebounds to 0.788 at 50 while CP@100 stays 0.243); hold-out (shift training start back by delta_delay + delta_valid; depth-2 valid AP 0.524 vs test 0.496, CP@100 0.243 vs 0.241; but AUC and CP@100 pick depth 50 on validation); repeated hold-out (random 70% subsamples, 4 folds: mean/std but less data; std AP 0.0065, CP@100 0.0018 — same period reused); prequential (same-size training sets from older history, each fold shifted one block back; best agreement; std AP ~0.022, CP@100 ~0.014; AUC still selects depth 50); sklearn integration — prequentialSplit index list, make_scorer with transactions_df, GridSearchCV(refit=False, cv=indices); dataset facts: 919,767 transactions, 8,195 frauds, 2018-06-11 to 2018-09-14, training start 2018-07-25, all deltas 7 days, 4 folds; References: prequentialSplit (fold i shifts the start back by i·delta_assessment), card_precision_top_k_custom (rebuilds predictions_df from transactions_df.iloc[y_true.index]).
- Dal Pozzolo 2018 Sec. II-C, III, VI-A: verification latency δ; D_{t−δ}; CARD ID removed from features because a card is blocked after its first detected fraud — offline evaluation otherwise optimistic; Fig. 2 and Fig. 4 timelines (δ = 7, M = 2, Q = 9).
- Jurgovsky Sec. 4.1: test starts more than a week after training ends (labels ~1 week late); account-level undersampling p_g = 0.9 because transactions of one account cannot be sampled independently; drop transactions with < 9 predecessors so models see identical test sets.
- Gama et al. Sec. 4.2: cross-validation not applicable to evolving streams; holdout unbiased for the active concept but needs knowing it; prequential (interleaved test-then-train) with landmark/sliding/fading windows; controlled permutations. Sec. 3.5: delayed, biased, costly feedback; credit scoring's one-year label lag.
- Altman Sec. 4 "Data Split": 60/20/20 temporal split with growing graph snapshots; App. D time-ordered feature computation to prevent leakage. Weber Sec. 4: first 34 steps train, last 15 test — a random split would leak the future.

## Key points
1. The geometry: training blocks → delay block (labels not yet known) → test block; the delay width = verification latency; blocks are weeks on the simulator; older blocks dropped for drift. Derive why a random k-fold is wrong: it trains on the test week's future and on labels that would not exist.
2. Known-card removal: cards whose fraud was known at (day − δ) would have been blocked, so their test transactions are not scoreable; remaining frauds per day fall (74–91 → 41–60). Dal Pozzolo's complementary rule: drop CARD ID as a feature.
3. The overfitting set piece (depth 2 → 50): train AUC → 0.97, test AP peaks at 4–6 and falls to ~0.31; AUC on test rebounds at depth 50 (0.788) while CP@100 stays flat — the metric that selects the wrong depth.
4. Three validation designs compared on the same grid: hold-out (shift back by δ + Δ_valid; near-exact for depth 2), repeated hold-out (bootstrap-like variance that understates — same period), prequential (fold i shifts the whole geometry back i blocks; same-size training sets; the only one whose variance covers the test's).
5. The selection rule: argmax of validation performance per metric; the summary triplet (best-estimated, its test score, optimal); depth selected by AUC 50 / AP 3 / CP@100 5 vs optimal 4/4/5.
6. Implementation: a cv index list for sklearn, a scorer that reconstructs the day/card frame from the index — the pattern the lab implements.
7. ★ Starred: Gama's prequential with sliding window and fading factor (stream evaluation proper); controlled permutations; Jurgovsky's account-level sampling (why transactions of one card are not i.i.d.).

## Set pieces & gems
- The timeline diagram (Handbook Ch5 Fig 1, Fig 5) — the canonical picture of the course.
- Depth-50 selected by AUC, depth-4 optimal — the "metric choice breaks model selection" moment.
- Repeated hold-out std 0.0065 vs prequential 0.022 on AP — same-period reuse understates uncertainty 3×.
- Remaining frauds 74–91 → 41–60 after removing known cards.
- Dal Pozzolo's card-ID leakage argument.

## Pitfalls
- Do not restate classical-ml's CV theory; one recall paragraph.
- Keep delta_delay and delta_valid distinct symbols; the validation geometry is shifted by both.
- The prequential folds in the handbook are a grid-search device, not Gama's interleaved stream evaluation — name both and keep them apart.

## FIGURE PLAN
- draw: The stream of weekly blocks: discarded (muted), training (blue), delay (hatched), test (amber) on a daily-count background — single figure; key image. Inspired by Handbook Ch5 Fig 1 (stream_train.png), recreated.
- draw: `<FigureSequence>` (4 frames): the same geometry shifted back one block per frame = four prequential folds, the test block of each fold landing where the previous fold's delay was. Inspired by Ch5 Fig 5 (stream_prequential_1block.png).
- draw: Three-panel AUC / AP / CP@100 vs tree depth, train vs test, with the validation-selected depth as a dashed line per metric — computed on our own simulator run (numbers follow the handbook's). Inspired by Ch5's three-panel plots.
- draw: Hold-out vs repeated hold-out vs prequential as three small timelines side by side, each with its ±2 std band on a validation curve — comparison panels joined by arrows (voita rule 8).
- draw: Known-card removal: a test day's transactions as rows; rows of cards flagged at ≤ day − δ struck through; the remaining-fraud count rewritten. Single figure.
- draw: Random k-fold on a stream: the folds interleaved in time with arrows showing training rows that sit after test rows — "the future in the training set" — beside the forward design. Two panels.

## EXERCISE PLAN
1. Warm-up: given stream dates, δ = 7, Δ_train = 8 weeks, Δ_test = 1 week, write the date ranges of four prequential folds for both the test and the validation geometry.
2. Derivation the lesson skipped: show that with a delay block of width δ no training label can postdate the test block's start minus δ, and that shifting the validation geometry back by δ + Δ_valid is the smallest shift that preserves this for the validation set.
3. Boundary probe: δ = 0 and Δ_test = 1 day — the validation becomes Gama's interleaved test-then-train; what the prequential folds lose (same-size windows) and gain.
4. Claim to refute: "Repeated hold-out gives a confidence interval, so its ±2σ band is the honest uncertainty of the test estimate." Refute with the 0.0065 vs 0.022 numbers and name what was resampled (rows of the same week) vs what varies (the week).
5. Research-shaped: reproduce the depth sweep on the simulator (or on the lab's reduced run): find the AUC-selected and the AP-selected depth on validation and their test CP@100.
6. FORWARD (E7): train on a window where the fraud rate was raised to 50% by dropping genuine rows, then score the test week — the reader observes that the scores' average is far above the test's 0.66% fraud rate although the ranking is fine → lands on `imbalance-techniques-revisited`'s β correction.
7. Mixed review (E3): recompute CP@100 (alert-budget-metrics) with and without known-card removal on a provided week and state which number the handbook reports.

## ARC
- Inherits: CP@k (alert-budget-metrics), the delay clock (fraud-detection-system), classical-ml's CV.
- Contributes: the validation geometry of the course — train/delay/test, known-card removal, prequential folds, the metric-dependent selection triplet.
- Hands off: the harness (cost-aware-evaluation-lab); every benchmark lesson; the delay-shifted terminal risk (transaction-aggregates); the drift view of windows (concept-drift); the feedback/delayed-sample split (alert-feedback-selection-bias).
- Spine step 2: rare positives, honest metrics.
