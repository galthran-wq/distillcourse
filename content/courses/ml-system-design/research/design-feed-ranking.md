# End-to-end design: feed ranking — research brief

Lesson: `design-feed-ranking` (module: canonical-designs, worked-practice, planned). Second of the module's four end-to-end case dissections (RESTRUCTURE AMENDMENT): full problem dissection in the engineering register — requirements → metrics → data → model → serving → monitoring — never interview prep.
Goal: Produce a complete design for a personalized feed — multi-task reaction prediction, engagement-score aggregation, impression discounting, and feedback-loop monitoring.

## Sources
- Khang Pham Ch.5 LinkedIn Feed Ranking (pp.170-183): the reference end-to-end dissection — problem, offline/online metrics, training data from feed activity, features, estimation, high-level design, scale.
- Aminian & Xu Ch.10 Personalized News Feed (pp.211-230): multi-task per-reaction classification heads (Fig 10.3); the hand-weighted engagement-score aggregation (Fig 10.4 — click 23%×1 + like 48%×5 + comment 12%×10 + share 4%×20 + friend-request 0.1%×30 − hide 0.005%×20 − block 0.0003%×50 = 4.65885) — INTRODUCED in ranking-and-ctr; here recalled and EXTENDED (weight provenance, sensitivity, per-head calibration precondition); the retrieval→ranking→re-ranking pipeline (Fig 1.23).
- Khang Pham Ch.2 (pp.119-120): impression discounting — LinkedIn People You May Know's discounting factor; (pp.117-118) position bias recalled; Ch.1 (pp.41-42): the Four Levels of Model Retraining (train-and-forget → periodic cold-start → near-line per-component async → warm-start of personalized components) — the feed's retraining-cadence ladder.
- CS 329S Lecture 2 / DMLS Ch.2: decoupling the newsfeed's objectives — separate quality and engagement models combined by tunable weights at serving time beats one blended loss (objective-decoupling recalled from requirements-and-metrics, now at production scale).
- Rules of ML #13 (three-tier objective taxonomy: directly observed actions / indirect effects / never-predict quantities), #23 (you are not a typical end user), #36 (positional feature) — recalls.
- DMLS Ch.8 (pp.232-236): degenerate feedback loops and their fixes — recalled from failures-and-drift; the feed is the canonical instance, and it is TWO-sided (creators adapt too).
- Coordination: recommender-funnel names impression discounting in one clause of its re-ranking section — this lesson owns the mechanism; ranking-and-ctr owns the engagement-score table's first working — use a DIFFERENT worked post here.

## Key points
1. Requirements and estimation: DAU, posts/day from a member's network, feed fetches/session → QPS; the freshness requirement (posts are hours old; a stale feed is a dead product); latency budget. The structural contrast that organizes the lesson: the candidate inventory is SMALL (hundreds–thousands of connectable posts per fetch), so the funnel is shallow — feed difficulty lives downstream of retrieval, in scoring and ordering.
2. Inventory and retrieval: in-network posts (connections' activity) as the base inventory plus injected out-of-network candidates (followed topics, viral pool); why this stage is a filter-and-join over recent activity, not an ANN search over a hundred-million corpus (funnel contrast made explicit).
3. The model: shared backbone with per-reaction heads (click/like/comment/share/hide/block); the engagement score recalled from ranking-and-ctr and extended — where weights come from (business policy, tuned via online experiments — objective decoupling means retuning weights needs NO retraining), negative heads as product guardrails, and the precondition the sum imposes: every head must be calibrated for the weighted sum to mean anything (calibration recall).
4. Impression discounting as the anti-groundhog-day mechanism: a post seen and ignored is evidence; LinkedIn's decay factor; the re-ranking layer that enforces variety within and across sessions; why feeds need this and video recommenders mostly don't (inventory exhaustion in one session).
5. The loop declared at design time, and it is two-sided: engagement labels come from what was shown (position feature trained-with/served-constant — Rules #36 recall), AND creators adapt what they post to what the feed rewards. Audits designed in: exploration slots, popularity-diversity monitoring, creator-side health metrics.
6. Operations: online metrics per Rules #13's taxonomy (directly attributable reactions train the model; next-day return and session count live in A/B guardrails only); the retraining-cadence ladder applied component by component (embeddings weekly, ranker daily stateful, personalized components near-line — Khang's Four Levels + Grubhub/continual-learning recall).

## Set pieces & gems
- The engagement-score sensitivity working: same two posts, two weight policies, the ordering flips — weights are product decisions with an audit trail.
- LinkedIn's impression-discounting factor (Khang pp.119-120) — a production detail that generalizes.
- The Four Levels of Model Retraining ladder (Khang pp.41-42) — the feed placed on it component by component.
- The two-sided loop: the creator arc added to the standard degenerate-loop diagram — feeds change what gets POSTED, not just what gets read.
- Rules #13's three-tier objective taxonomy — quoted as the discipline behind which reactions become heads.

## Pitfalls
- The engagement-score table's first full working belongs to ranking-and-ctr — recall by Ref, extend with NEW numbers and the sensitivity/calibration analysis; do not re-derive 4.65885.
- PYMK/graph candidate generation (Aminian Ch.11): out of scope — design-video-recommendations' exercise territory; one Remark at most.
- Position bias and loop mechanics: apply, never re-teach (ranking-and-ctr and failures-and-drift own them).
- Engineering register: no interview dialogue; the artifact is a design, and every number carries its denominator.
- "Feed quality" is not one number — resist collapsing the decoupled objectives back into a single trained loss (that is the design's point).

## FIGURE PLAN
- draw: THE feed system in one diagram with numbers: in-network activity join + out-of-network injection → multi-head ranker → re-rank (discount, variety, exploration slot) → feed; freshness clocks per stage and the label flow back to training. Single <Figure>; original, informed by Khang Ch.5 + Aminian Fig 1.23.
- draw: FigureSequence (3 frames): one post's score assembled — frame 1 per-head probabilities out of the shared backbone; frame 2 weights applied as signed bars (negative heads in warning color); frame 3 the summed scores order the feed, and a weight change flips two posts. From Aminian Figs 10.3/10.4, fresh numbers.
- draw: Impression discounting: effective score decaying over ignored impressions (decay curve), with the drop-out threshold and the "new information resets the clock" annotation. Inspired by Khang pp.119-120.
- draw: The two-sided loop: model → exposure → reader engagement → labels → model, plus the outer creator arc (creators adapt content to rewards); the two audit metrics (popularity-diversity, creator-side health) attached where they measure. Original, informed by DMLS Ch.8.
- draw: The retraining-cadence ladder: Khang's four levels as rungs, the feed's components placed on their rungs with their clocks. Inspired by Khang pp.41-42.

## EXERCISE PLAN
1. Warm-up: given per-head probabilities for two posts and a weight policy, compute both engagement scores and the ordering; apply an impression discount $0.7^k$ with $k=2$ to the winner and recompute.
2. Boundary probe: a member with zero connections — which pipeline stages produce anything at all? Design the cold-start feed (popularity pool + declared interests) and state the signal threshold at which personalization takes over (loop lesson's exploration recall).
3. Claim to refute: "comments carry weight 10, so make the comment head bigger and train it hardest." Show a miscalibrated comment head corrupts every summed score it touches, while a BETTER-ranked but uncalibrated head helps nothing — the sum consumes probabilities, not orderings.
4. Derivation the lesson skipped: prove single-head ranking is invariant under any monotone transform of the score, then show a weighted multi-head sum is NOT — exhibit two posts whose order flips under a monotone recalibration of one head. This is the formal reason per-head calibration is a precondition (and the auction lesson will reuse it).
5. Research-shaped: using Rules #13's taxonomy, classify each candidate reaction (click, dwell, share, next-day return, "member well-being") into trains-the-model / A/B-guardrail-only / never-predict — and justify the boundary cases in one sentence each.
6. Mixed/spaced (E3): over a month, engagement rises while popularity-diversity collapses — walk the M6 loop diagnosis (is this covariate shift? No — the system's own exposure policy), and size the exploration slot as the intervention.
7. FORWARD (E7): sketch which parts of this feed design transfer UNCHANGED to a video recommender at hundred-million-corpus scale and which break (the shallow inventory join must become deep retrieval; the multi-head scorer transfers whole). Solution: that composition is the module's synthesis → Ref design-video-recommendations.

## ARC
- Inherits: multi-task scoring and calibration from ranking-and-ctr; natural labels and loop length from labels-and-feedback-loops; loop taxonomy and exploration from failures-and-drift; objective decoupling from requirements-and-metrics.
- Contributes: the feed shape — shallow funnel, decoupled objectives blended by tunable weights, impression discounting, and a two-sided feedback loop audited by design.
- Hands off: probability-times-money — the same calibrated-heads discipline where the multiplier is a bid and every error is priced → design-ad-click-prediction.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
