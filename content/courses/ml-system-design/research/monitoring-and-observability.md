# Monitoring and observability — research brief

Lesson: `monitoring-and-observability` (module: operations, core, planned).
Goal: Design the monitoring stack for an ML system — what to watch at each pyramid layer, which statistical tests detect drift, and how to alert without fatigue.

## Sources
- Babushkin Ch.14: the four-layer monitoring pyramid (software health → data quality → model quality → business KPIs; Fig 14.3, credited to Elena Samuylova); nondeterminism (ChatGPT triple-answer capture); cascade/upstream chains (Fig 14.4); how-to-monitor per layer; the crypto-exchange self-flag story.
- DMLS Ch.8 (pp.242-261): detection — statistical summary stats, two-sample tests (KS: nonparametric but 1-D; MMD; reduce-then-test), time-scale windows (Fig 8-3: the same day-15 change reads as drift or business-as-usual depending on the base window; Fig 8-4: cumulative 93.7 hides the 88.6 sliding dip); the four monitorable artifacts by transformation depth (accuracy → predictions → features → raw inputs; deeper = easier to monitor, further from root cause); monitoring toolbox — logs, dashboards (dashboard rot), alerts (policy/channel/runbook; alert fatigue); observability vs monitoring; TikTok/AWS uptime 9s numbers (SLO recall).
- Rules of ML #8-#11 (freshness requirements; detect before export; silent failures — the 6-month stale table whose refresh beat every launch that quarter with +2% installs... note: distinct from TFX's +2%; keep them apart!); #37 prediction bias as the cheap invariant (predicted distribution ≈ observed labels, sliceable; the null-model caveat).
- MLPS Ch.16 (pp.285-300): Dapper-style distributed tracing (spans, the 581ms request fanning into five RPCs); MTTD/MTTR/CFR; supervised vs unsupervised decay-detection families (one Remark — the application lesson runs the tests).
- AI Engineering Ch.10 (p.467): monitoring-vs-observability distinction; MTTD/MTTR framing (shared with MLPS).

## Key points
1. The pyramid as the organizing claim: four layers, each catching what the layer above cannot see IN TIME (business KPIs move last; raw-input checks fire first); ML metrics need labels that arrive late (loop length recalled) — so the lower layers are the early-warning system. Uptime arithmetic recalled (99.99% = 4 min/month) for the software layer.
2. The four ML artifacts ordered by transformation depth with the tradeoff made explicit: accuracy metrics (truest, latest), predictions (cheap, immediate — monitor their distribution), features (structured, schema-checkable — data-validation recalled as the same machinery running continuously), raw inputs (closest to root cause, hardest to structure).
3. Prediction bias as the best cheap invariant (Rule #37): mean prediction ≈ observed base rate, per slice; catches label shift, feature breakage, skew — with the honest caveat (a base-rate-predicting null passes; it is a necessary, not sufficient check).
4. Two-sample testing honestly: KS (1-D only — per-feature), chi-squared for categoricals, MMD after dimensionality reduction for vectors (the reduce-then-test recipe named; the application lesson executes it); the un-fixable arbitrariness: thresholds without a cost model, multiple-testing across hundreds of features (alert budget).
5. Window design as the decisive choice: reference vs test window; cumulative-vs-sliding (the 93.7/88.6 exhibit); the base-window trap (Fig 8-3 — same data, opposite verdicts); seasonal baselines (compare to same-weekday — data-validation exercise recalled).
6. The response loop: logs (structured, sampled — stratified sampling for rare classes), traces (Dapper spans for multi-service latency attribution), dashboards (rot warning), alerts with runbooks; MTTD/MTTR/CFR as the meta-metrics of the monitoring system itself; alert fatigue as monitoring's own failure mode (Burkov's ±30%-hourly heuristic as a starting threshold, not truth).
7. Monitoring vs observability: fixed dashboards answer anticipated questions; observability = enough instrumentation to ask new ones (slice arbitrary logs post hoc).

## Set pieces & gems
- The cumulative-93.7-vs-sliding-88.6 exhibit — the module's keeper pair.
- The base-window figure (DMLS Fig 8-3) — same change, two verdicts; recreate faithfully.
- Rules #10's stale-table story (6 months stale; refresh = +2% installs, better than any launch that quarter) — silent failures priced.
- Babushkin's self-flag anecdote (blocked by his own anti-fraud model) — alerting's human side.
- The Dapper 581ms → five spans trace — recreate as a span waterfall.
- machinelearn-babushkin-s2-chatgpt-nondeterminism capture — optional exhibit for the nondeterminism paragraph.

## Pitfalls
- The drift-test section states mechanics and limits; the RUNNING of tests with real numbers is the application lesson — don't duplicate.
- Two +2% stories exist (TFX Play install-rate; Rules #10 stale-table) — keep provenance straight.
- Alert thresholds must be presented as tunable heuristics with costs, never as constants.
- Tracing: one section, span vocabulary only; no OpenTelemetry tutorial.

## FIGURE PLAN
- draw: The four-layer pyramid with, per layer: what's watched, its latency-to-signal, and its example alert — the lesson's key image. Inspired by Babushkin Fig 14.3.
- draw: The four artifacts on the transformation axis: raw → features → predictions → accuracy, with two opposing gradient arrows (ease of monitoring vs closeness to root cause). Inspired by DMLS Fig 8-5.
- draw: FigureSequence (3 frames): the window trap — frame 1 a 14-day series with a level change at day 15; frame 2 base window days 9-14: "drift!"; frame 3 base window days 1-14: "normal" — the verdict flips with no data change. Inspired by DMLS Fig 8-3.
- draw: Cumulative vs sliding accuracy over 24h: cumulative smooth at 93.7 while sliding dips to 88.6 at hours 16-18. Inspired by DMLS Fig 8-4.
- draw: Prediction-bias monitor: mean-prediction and observed-base-rate lines diverging after a feature breaks, per-slice small multiples underneath. Original.
- draw: Trace waterfall: one 581ms request as a Gantt of five downstream spans, the slow span highlighted. Inspired by MLPS Fig 16-3 (Dapper).

## EXERCISE PLAN
1. Warm-up: place eight monitors (p99 latency, null-rate per feature, mean prediction, weekly revenue, KS on feature 12, GPU utilization, label-lagged accuracy, schema check) onto pyramid layers and order them by time-to-signal after a feature pipeline breaks.
2. Boundary probe: a monitor on ACCURACY alone with 3-day label lag — compute the minimum detection delay for a sudden failure, and what a prediction-distribution monitor's delay would be (minutes); state what the faster monitor can NOT tell you (whether accuracy actually fell).
3. Claim to refute: "we monitor all 400 features with KS at p<0.05 daily." Compute the expected daily false alarms (~20) and describe the resulting fatigue failure; fix with an alert budget (Bonferroni-ish or top-K by importance) and per-feature seasonally-matched baselines.
4. Derivation the lesson skipped: show the null model (always predict base rate) passes the prediction-bias check while being useless — then add the second invariant (per-slice bias + calibration on a moving window) that catches it.
5. Research-shaped: design the monitoring page for Supermegaretail's forecast (design-doc case): 6 monitors, each with layer, statistic, window, baseline, alert threshold + runbook line — a one-page artifact.
6. Mixed/spaced (E3): the canary's real-time proxy signals (deployment lesson's forward exercise) — which two monitors from this lesson serve as its rollback triggers?
7. FORWARD (E7): a drift alarm fired on the prediction distribution. List the three possible verdicts (skew bug / true drift / seasonal) and what evidence separates them. Solution: the triage is run with real detector outputs in → Ref drift-detection-in-practice; and "true drift" hands to → Ref continual-learning.

## ARC
- Inherits: the named failure modes and shift typology from failures-and-drift.
- Contributes: the instrument stack — pyramid layers, artifact ordering, tests with their limits, window discipline, and the response loop.
- Hands off: alarms need a policy that decides when the model itself is refreshed → continual-learning; the instruments run on real data in → drift-detection-in-practice.
- Spine step: "Deployment is the beginning, not the end…" (step 7, Closing the loop).
