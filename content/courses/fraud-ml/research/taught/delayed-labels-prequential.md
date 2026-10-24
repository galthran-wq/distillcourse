# delayed-labels-prequential — ledger

**Problem.** How to cut a labelled payment history so that a test number
predicts next week, when labels arrive δ days late and the bank blocks cards
it knows; and how to choose a hyperparameter (tree depth) without the test
week. Answer: cut in time with a training block, a delay block of width δ
(unused for labels) and a test block; remove from each test day d the cards
with a fraud on a day ≤ d − δ − 1; tune on a validation block placed where
the test block stands (deployment geometry shifted back δ_delay + δ_valid);
get the spread from prequential folds (geometry shifted back one block per
fold), not from repeated hold-out; select by the deployment metric, because
AUC ranks the fully grown tree on its top-block recall alone, a pick that is
blind to the bottom block, not separated from the moderate trees, and wrong
even by AUC on the forward weeks.

## Explained
- Backtest: the simulator file holds the weeks after day 129 with labels; stand at day 129, cut with what the bank held, check against days 129+; every test number in the lesson is a backtest — opening (before first ##), Remark "a backtest"
- Why a shuffled split / k-fold CV fails on a stream: rows not exchangeable (shared card, terminal, date), labels have arrival dates, bank acts on what it learns. Leaked-card arithmetic: ~9 frauds over 14 days, 80/20 shuffle puts on average 6–7 of a test fraud's 8 siblings in training, half later; P(none) = 0.2^8 ≈ 1 in 400,000; compromised terminal 0.96 payments/day × 28 days ≈ 27 frauds. Time-evolving trait (Ref typology) — §A shuffled split tests a model that cannot exist (### What deployment does / ### What the shuffle does instead)
- KeyFact: a test predicts deployment only if it reproduces deployment's information (payments and labels that existed at training time; test on later payments) — same §
- Label clock: on day t labels of day t − δ arrive (Ref fraud-detection-system); a model scoring day d uses labels up to d − δ − 1; for day 129, δ = 7: day 121 — §Where the training set must end: the delay block / ### The label clock
- Why not train up to day 128: simulator labels instant, but those labels belong to compromises running in the test week; on day 129, 14 of 56 compromised terminals (a quarter) and 21 of 42 leaked cards (half) have their only labelled frauds in days 122–128; real data: accuracy higher right after training → optimistic — same §, ### Why not train up to day 128 anyway
- Definition: train, delay and test blocks (δ_train, δ_delay = δ, δ_test); delay-block payments may enter history features, labels never used — same §
- Three pitfalls (### What the delay block is and is not): delay block is not a validation set; its payments are not discarded (card's 7-day spend for a day-130 payment uses days 123–129; label-derived features shifted in point-in-time-features); one week is a simplification (labels trickle in, δ is a parameter: shorter → optimistic, longer → staler) — same §
- Older blocks dropped; how much history to keep → drift-strategies-on-worldline — same §
- Known cards: bank blocks a card once found; simulator keeps generating fraud on it; scoring them credits easy frauds — §Which test payments would really be scored: removing known cards
- Rule: known on test day d = a fraud on some day ≤ d − δ − 1 (labels of day d − δ arrive during day d, too late for that morning's scoring); one day stricter than alert-budget-metrics' exercise wording (≤ d − 7), same outcome for cards a–e, said in the body; date moves with d (day 129: ≤ 121; day 135: ≤ 127); figure with cards a–e (first frauds 116, 120, 124, 126, 130; scored c, d on 129; e on 135); fixed-at-end-of-training bug keeps c, d on day 135 — same §, ### Which cards count as known on a given day
- Definition: known-card removal — same §
- Effect: 74–91 → 41–60 frauds/day; ~580 raw/week → 385, so about a third of raw test fraud is on cards the bank already knew; 385 / 58,264 = 0.66% vs training 0.89% (598 / 67,240): lower test base rate is the removal; the removal is by card only — bank blocks cards, not terminals, so terminal-compromise frauds stay unless the paying card has its own labelled fraud (not a confirmation of canonical-datasets' "most fraud continues" estimate); the first figure's leaked card (frauds 120, 121) leaves the test — same §
- KeyFact: two removals (known from labels by d − δ − 1; detected by the model on earlier test days, Ref alert-budget-metrics) — same §
- Card identity out of the feature vector (model would learn which cards were caught; backtest credits later frauds of a blocked card); id kept for computing history features — same §, ### Why the card's identity stays out of the features
- Depth sweep (2…10, 20, 50; training week 115–121): training metrics only rise (AUC, AP 1.000 at depth 50); test AP 0.496 (d2) → peak 0.588 (d6) → 0.309 (d50); tuning on the test week = max of 11 noisy numbers, optimistic — §Choosing a depth without touching the test week: hold-out validation / ### Neither the training week nor the test week can choose
- Hold-out validation: validation block = latest fully labelled week 115–121, delay 108–114, training 101–107; shift δ_delay + δ_valid = 14 days; validation removal uses each validation day's own date (v − δ − 1); copying the geometry removes every design difference (systematic bias), not week-to-week variation (measured in last §); the validation row only picks the depth — a tree of that depth is refitted on the deployment training block 115–121 (freshest labelled week) and that refit is what is scored on the test week (depth-2 test row = alert-budget-metrics' tree); depth 2: valid 0.775 / 0.524 / 0.243 vs test 0.763 / 0.496 / 0.241 — same §, ### A validation week that stands where the test week stands
- Hold-out picks: AP → depth 3 (0.538; refit's test AP 0.562 vs best 0.588); AUC → 50 (0.820); CP@100 → 50 (0.259, tied with 20; test 0.243 vs best 0.280). CP pick = noise (spread 1.6 cards/day < ~2 cards/day, Ref alert-budget-metrics); AUC: only the d20→d50 jump is systematic (validation 0.775→0.820, test 0.739→0.788, where AP is lowest); where it lands is not (validation: 0.820 > 0.804 at d7; test: 0.788 < 0.817 at d6) — same §
- Two-score model (full-depth tree, scores 0/1): AUC = ½(1 + T − F) (triangle + trapezoid, tie convention), = mean of TPR and TNR; AP = T·P₁ + (1 − T)·π — §What AUC sees in the fully grown tree / ### Two scores, one corner
- Worked example: invert test AUC 0.788, AP 0.309, π = 0.0066 → T ≈ 0.58, P₁ ≈ 0.53, ~222 TP + ~195 FP, F ≈ 0.0034, ~420 flags/week (60/day); missed 42% contribute 0.003 to AP — same §
- AUC of two-score model = mean of TPR and TNR, indifferent to the tied bottom block; AP capped near T·P₁; depth-6 tree (≤ 64 leaves) reaches non-top frauds above base rate → AP 0.588; top block finding 58% at F 0.003 is worth AUC 0.79 whatever the other 42% — same §
- In-body exercise: validation week d50 AUC 0.820, AP 0.324 (assumed π 0.0066, n ≈ 58,000) → T ≈ 0.64, P₁ ≈ 0.50; AUC +0.03 = half the recall gain — same §
- Why the ranking flips: full tree's AUC ≈ function of T, and T belongs to the week (0.64 validation, 0.58 test); half the difference (0.03) moved it across the moderate trees. AUC pick blind (never sees the 42% in the bottom block) and unreliable (validation margin 0.016 = half the full tree's own week-to-week AUC move 0.032); wrong even by AUC on the test week (0.788 vs 0.817) — same §, ### Why the ranking changes from week to week
- KeyFact: a metric that cannot see part of the list ranks only on the part it sees; candidates differing mainly in the unseen part are ranked by how the visible part fell that week — same §
- Repeated hold-out: 4 random 70% samples of one training week, same validation week; depth 2: AP 0.519 ± 0.0065, CP 0.245 ± 0.0018; measures training-resample sensitivity only, shares the week; 70% costs accuracy (0.519 vs 0.524) — §How far one validation week can be trusted / ### Repeated hold-out: a spread from one week
- Definition: prequential validation (fold j validates on δ_valid days ending d₀ − δ − 1 − (j−1)δ_valid; with s that block's first day, trains on δ_train days ending on day s − δ − 1, i.e. δ full days between; removal by each validation day's date; mean ± std); name = predictive sequential; per-instance version → stream-learning-and-adaptation — same §, ### Prequential folds: a spread across weeks
- Depth 2: prequential AP 0.550 ± 0.022, CP 0.256 ± 0.014 (3.4× and 8× repeated hold-out); four forward test weeks (training 115–121 … 136–142, tests 129–135 … 150–156) AP 0.542 ± 0.031, CP 0.265 ± 0.020; first test week 0.496 is ~1.5 std below the four-week mean — same §
- KeyFact (decision rule): candidates whose prequential means differ by < ~1 fold std are not separated; prequential spread still below forward (0.022 vs 0.031 AP), so it is a floor on uncertainty — same §
- Prequential selection table vs four-week test: AUC pick 50 (0.823) / optimum 4 (test 0.797 vs 0.813); AP pick 3 (0.573) / optimum 4 (0.579 vs 0.601); CP pick 5 (0.268) / optimum 5 (0.284); AP: d3 0.573 vs d4 0.554 within fold stds (0.027, 0.038), not separable; AP's verdict on d50 (0.342) ~9 std below. AUC: d50 0.823 ± 0.013 vs d5 0.804 ± 0.017, ~1 std, not separated; full tree's T ≈ 0.65 over validation weeks vs ≈ 0.59 forward (2·AUC − 1), a difference between stretches that four-week averaging cannot remove; wrong by forward AUC (0.797 vs 0.813); costs test AP 0.334 vs 0.601, CP 0.258 vs 0.284 (~2.6 cards/day) — same §, ### What prequential selection picks
- KeyFact: validation design and selection metric are separate decisions — same §
- Cost: 4 trees per candidate (44 for 11 depths) → gbm-model-selection — same §
- Aside: scikit-learn — built-in splitters (KFold, ShuffleSplit, TimeSeriesSplit with gap in rows) do not build these folds; pass explicit (train, validation) index pairs as cv to GridSearchCV, refit=False (deployed model retrained on the latest training block), custom CP scorer needing card and day — same §

## Notation
- δ (verification latency, from fraud-detection-system); δ_train, δ_delay (= δ), δ_test, δ_valid (= δ_test) block widths in days
- d test day, v validation day; known on d ⇔ fraud on a day ≤ d − δ − 1
- d₀ first test day (renamed from T₀ to avoid clashing with T); J number of prequential folds, j fold index
- T, F recall and false-positive rate of the top block of a two-score model; P₁ its precision; π base rate (from economics-of-detection)
- B_1 … B_15 weekly blocks (exercise only)

## Running cases
- Simulator, day 0 = 1 April 2018; today = day 129 (8 Aug); training 115–121 (67,240 payments, 598 frauds, 0.89%), delay 122–128, test 129–135 (58,264, 385 frauds, 0.66%); raw 74–91 → 41–60 frauds/day
- Day-129 compromise counts: 56 terminals (2 drawn/day over 28 days), 14 drawn in 122–128; 42 leaked cards, 21 drawn in 122–128
- Cards a–e (first frauds 116, 120, 124, 126, 130; 14-day windows) reused from alert-budget-metrics' last exercise
- Depth sweep tables (single test week, hold-out validation, repeated hold-out, prequential validation, four-week forward test) as quoted above
- Full-depth tree on the test week: T ≈ 0.58, P₁ ≈ 0.53, ~60 flags/day
- Exercises: weekly-block fold table (B8–B13); δ = 0 (training 122–128; survivors mostly scenario 2 + first-day scenario 3, ~2/day) and δ = 30 (training 92–98, delay 99–128; removal takes out almost nothing); ten-subsample refutation (0.0065/√10 ≈ 0.002 vs 0.022/√4 = 0.011 — a fifth, colleague's arithmetic right — vs real 0.031); shift derivation (validation starts d₀ − δ − δ_valid; validation day 117 removal by day 109); AUC-pick price 0.023 CP ≈ 16 cards/week ≈ €5,800 at V = €360, min_samples_leaf experiment; laundering geometry (delay months–years, known = reported and exited, incomplete negatives, mules workable); five-week study with labels within 14 days (no delay block; fix: train week 2 with week-1 features, delay weeks 3–4, test week 5); forward leaf exercise (20 frauds in 2,000, keep 1 genuine in 10 → 0.092 vs 0.01; p_s = p/(p + β(1−p)); 0.34 at p = 0.05, 0.91 at p = 0.5)

## Assumed
- fraud-detection-system: verification latency δ and delayed samples D_{t−δ} (Ref id what-the-model-gets-back-two-kinds-of-label-on-two-clocks), cards blocked when found (investigators-fast-labels-on-the-alerted-cards)
- financial-crime-typology: time-evolving trait (rarity-is-one-difficulty-out-of-five), laundering label = STR, incomplete, mules within months (where-the-laundering-label-comes-from)
- canonical-datasets: simulator days, scenarios (terminal 28 days, leaked card 14 days, ~2 payments/day, 1/3 fraud), instant labels (what-the-calendar-shows-and-what-it-leaves-out), test-week continuation exercise (exercises)
- alert-budget-metrics: CP@100 = 0.241 and the five baselines' test numbers, detected-card removal (a-detected-card-is-a-blocked-card), tie convention (what-the-team-sees-at-each-fraud), full-depth tree's two scores / one-corner ROC, CP noise ~2 cards/day (what-each-disagreement-means), removal-date exercise (exercises), V = €360 pricing
- classical-ml: cross-validation, overfitting, decision-tree depth, GridSearchCV

## Left open
- Undersampled training and the probability correction (forward exercise) → undersampling-calibration
- Label-derived features shifted by the delay → point-in-time-features
- How much history to keep / retraining cadence → drift-strategies-on-worldline
- Per-instance prequential (interleaved test-then-train) → stream-learning-and-adaptation
- Best-estimated vs optimal parameters on these folds, cost of folds for boosted trees → gbm-model-selection
- Label clocks as a pipeline (trickling labels) → label-maturation
- Split generator implemented → cost-aware-evaluation-lab
