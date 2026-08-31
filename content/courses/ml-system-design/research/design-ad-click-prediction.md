# End-to-end design: ad click prediction — research brief

Lesson: `design-ad-click-prediction` (module: canonical-designs, worked-practice, planned). Third of the module's four end-to-end case dissections (RESTRUCTURE AMENDMENT): full problem dissection in the engineering register — requirements → metrics → data → model → serving → monitoring — never interview prep.
Goal: Produce a complete design for an ads CTR system — auction context, delayed-click labels, downsampled training with calibrated serving, and budget-aware experiments.

## Sources
- Aminian & Xu Ch.8 Ad Click Prediction on Social Platforms (pp.171-194): the reference end-to-end dissection — CTR framing, feature crosses/factorization machines, NCE worked (~0.273/0.842 ≈ 0.324), probability calibration.
- Khang Pham Ch.6 Ad Click Prediction (pp.184-194): the waterfall ad-serving model (publisher tries direct sale at high CPM, falls through networks if unsold — why latency budgets are brutal); NCE + calibration as the offline metric pair; Ch.1 (pp.45-48) Facebook's NCE — the full worked derivation lives in ranking-and-ctr, recall by Ref; Ch.1 (pp.81-82) budget-splitting A/B (LinkedIn): each campaign's budget split into two independent sub-campaigns so control and treatment do not compete for the same spend; Ch.2 (pp.121-126) calibration causes + Facebook's downsampling correction $q = p/(p + (1-p)/w)$ — derived in offline-evaluation, applied here.
- DMLS Ch.4 (pp.93-94): the Twitter ad delayed-feedback study (Ktena et al.) — most clicks arrive within 5 minutes, some trickle in hours later; any fixed labeling window systematically undercounts CTR. Recalled from labels-and-feedback-loops, now load-bearing.
- Rules of ML #29/#32 (log serving-time features), #36 (positional feature), #37 (prediction bias as the cheap monitor, sliceable) — the monitoring section's spine.
- Sculley et al. §4: direct feedback loops (a model influencing selection of its own future training data) — the ads system as the textbook instance.
- Coordination: ranking-and-ctr owns the NCE worked example, the auction chain P(click)×bid as motivation, and wide&deep/DCN; deployment-and-online-experiments names budget-split in its splitting-unit list — THIS lesson works the mechanism and the cannibalization failure in full. The lesson is the SYSTEM around that machinery.

## Key points
1. Requirements from the auction, template discipline: expected value $P(\text{click}) \times \text{bid}$ decides the impression; the waterfall's fall-through structure sets a per-stage timeout, so the CTR model's budget is milliseconds; estimation from impressions/day → peak QPS, candidate ads per request, feature-fetch fan-out (tail-amplification recall).
2. Data as the hard half: the impression–click join is a stream-stream window join (batch-and-stream-processing recall — the substrate returning with money attached); the delayed-click window (Ktena numbers) and the bias any cutoff imposes; negative downsampling as a pipeline decision forced by scale and imbalance — which OWES serving the correction $q = p/(p+(1-p)/w)$, applied and checked with a calibration plot.
3. Features and model, recalled not re-taught: user×ad×context crosses (features-at-scale), hashing for unbounded campaign/creative vocabularies (the ads system is WHERE the hashing trick earns its keep); wide&deep/DCN by Ref (ranking-and-ctr); factorization machines one Remark. Offline gates: NCE (recall; one fresh applied number — Aminian's ≈0.324) + the calibration plot.
4. The direct feedback loop, named per Sculley: the model picks which ads are shown; shown ads generate the next labels; unshown ads generate nothing. Loop-breakers designed in: exploration budget, position as an additive trained feature served constant (Rules #36), and importance-weighting the logged data rather than dropping it (Rules #32 flavor).
5. Experiments under interference: why a plain user-split A/B lies when both arms draw on ONE campaign budget — treatment spends faster and starves control mid-day (cannibalization); budget-split as the fix, with its cost (halved spend per arm → sample-size hit, MDE recomputed); guardrail metrics (advertiser ROI, user ad-fatigue signals).
6. Monitoring and cadence: prediction bias per slice as the revenue alarm (sum of predictions tracking sum of clicks — Rules #37); calibration drift = money leaking; retraining near-continuously justified by the freshness-value experiment (Facebook's weekly→daily 1% CTR-loss cut — continual-learning recall); logging serving-time features as the training set (Rules #29).

## Set pieces & gems
- The waterfall with its timeout arithmetic — the reason this is the tightest latency budget in the course.
- The auction-flip working: a downsampling correction changes which ad wins — miscalibration priced in one small example.
- Budget-split vs naive split — the interference story told with two budget "tanks".
- The delayed-click window numbers (Ktena) — a measured bias with a design consequence.
- Prediction bias as the one-line monitor that pays for itself (Rules #37).

## Pitfalls
- Auction theory (second-price/GSP, pacing algorithms): one Remark naming it — this is the ML system, not mechanism design.
- NCE's derivation and the wide&deep/DCN treatment live in ranking-and-ctr — recall, apply, never re-derive.
- The downsampling correction was derived in offline-evaluation — apply it; do not repeat the Bayes argument (the exercise plan's derivation is a DIFFERENT one: invariance analysis).
- Engineering register; no interview dialogue. Every number carries a denominator; the waterfall diagram carries timeouts.

## FIGURE PLAN
- draw: THE ads system in one diagram with numbers: request → waterfall (timeouts annotated) → candidate ads → feature assembly (batch + streaming lanes) → CTR model → calibration correction → auction (×bid) → impression, with the click join looping back into training data. Single <Figure>; original, informed by Khang Ch.6 + Aminian Ch.8.
- draw: FigureSequence (3 frames): the label pipeline — frame 1 impressions logged with timestamps; frame 2 clicks arriving over a long tail, the join-window cutoff line drawn; frame 3 the labeled set with undercounted positives shaded and the CTR bias quantified. Informed by the Twitter delayed-feedback study (DMLS Ch.4).
- draw: Downsample-then-correct: the 1:10-downsampled training distribution beside the true serving distribution; one prediction pushed through $q = p/(p+(1-p)/w)$; before/after calibration plots inset. Original; recalls offline-evaluation.
- draw: Budget-split vs naive user-split: campaign budgets as two tanks — naive split shows both arms draining one shared tank with the starvation timeline; budget split shows two independent half-tanks and clean per-arm revenue. Inspired by Khang pp.81-82.
- draw: The monitoring panel: per-slice prediction bias (Σpredictions/Σclicks) tracked over days, the calibration-drift excursion crossing its alarm threshold, annotated with the revenue interpretation. Original, after Rules #37.

## EXERCISE PLAN
1. Warm-up: two candidate ads — $p=0.03$, bid \$2.00 vs $p=0.05$, bid \$1.00. Rank by expected value; then correct the first prediction for 10:1 negative downsampling and re-run the auction — the winner flips. State what the platform loses per thousand impressions if it serves uncorrected.
2. Boundary probe: the correction at its limits — show $w=1$ gives $q=p$ (no downsampling, identity), and examine the rare-click regime ($p$ small, $w$ large): how much of the predicted probability mass the correction removes, and why forgetting it inflates CTR estimates most exactly where ads live.
3. Claim to refute: "treatment shows +8% revenue in our user-split A/B; ship it." Construct the cannibalization: both arms bid from the same campaign budgets, treatment exhausts them earlier each day, control's evening traffic goes unmonetized — the +8% is partly transfer, not lift. Name the fix (budget split) and its price (MDE at half the spend per arm).
4. Derivation the lesson skipped: analyze which parts of the ads system are invariant to a MONOTONE miscalibration of $P(\text{click})$ and which are not — ranking within one auction survives a common monotone transform, but cross-ad comparisons against bids, pacing, and billing do not; exhibit the two-ad case where the auction outcome changes while the CTR ranking does not. (Reuses design-feed-ranking's invariance result in a new consumer.)
5. Research-shaped: reproduce Aminian's NCE ≈ 0.324 from log loss 0.273 and base-rate log loss 0.842; then compute the NCE of the always-predict-base-rate model and of a coin flip, and place all three on one scale — what does NCE = 1 mean operationally for an ads team?
6. Mixed/spaced (E3): the impression–click join under the substrate's lens — choose the stream-join window type (recall batch-and-stream-processing), and state what happens to labels for impressions near the window boundary under tumbling vs sliding windows.
7. FORWARD (E7): route each request to a heavy or a light ranker by value: given calibrated $p$, bids, and per-request serving costs of the two models, derive the traffic threshold that maximizes profit. What you built is model-routing economics — the router in module 8's reference architecture (RouteLLM-style, 2× cost cuts). Solution → Ref ai-application-architecture.

## ARC
- Inherits: calibrated CTR machinery, NCE, and position bias from ranking-and-ctr; experiment design and MDE from deployment-and-online-experiments; delayed natural labels from labels-and-feedback-loops; the stream join from batch-and-stream-processing.
- Contributes: the ads shape — the system where probability meets money: auction-derived requirements, delayed-label pipelines, correction-at-serving, interference-aware experiments, and calibration monitoring as a revenue alarm.
- Hands off: classification where the output is an enforcement action and the adversary adapts — the integrity shape → design-harmful-content.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
