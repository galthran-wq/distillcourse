# Model risk: backtesting, stability indices and the life cycle — research brief

Lesson: `model-risk-monitoring` (module: governance, core, planned). NEW.
Goal: Compute population and performance stability tests for a deployed detector and design its monitoring, champion–challenger and retirement life cycle.
Prerequisite from classical-ml: calibration (Brier, reliability), bootstrap — recalled.

## Sources
- Baesens Ch6 pp.280–281 and 302–312 (primary): model life cycle (development, testing — latency such as under 5 s, missing/extreme inputs, dummy fraud cases; staging in parallel with the champion e.g. 1 month, champion–challenger; production; retirement into a repository for benchmarking; Fig 6.1); replacement — direct changeover, phased (claims under EUR 5,000 first), parallel with weights shifting to the new score over ~3 months; backtesting = ex-ante predictions vs ex-post outcomes, justified by concept drift; data stability — System Stability Index SSI = Σ(obs_i − exp_i) ln(obs_i/exp_i), thresholds < 0.10 green, 0.10–0.25 yellow, ≥ 0.25 red, identical to the information value (deviation index), step 1 population then step 2 per variable; worked total 0.0605 (Table 6.6); "Years client" SSI at t+1 = 0.304 red (Table 6.8); model stability — performance-metric report over periods; traffic lights by absolute change (< 5% green, 5–10% yellow, > 10% red) or by bootstrap (pool train and out-of-time samples, resample both at original sizes with replacement, difference of the metric, 1,000+ times; green if not significant at 95%, yellow at 95% but not 99%, red at 99%); metrics to monitor by model type (classification AUC, accuracy ratio, KS, top-decile lift; regression MSE/MAD; clustering F-statistic; rules support/confidence); calibration backtesting — pools, binomial test with critical rate p* = P̂ + N⁻¹(α)√(P̂(1 − P̂)/n) (normal approximation when nP > 5), the independence assumption violated by network effects so the test over-rejects and works as early warning, four-colour coding at 90/95/99%; Hosmer–Lemeshow Σ(n_i P_i − θ_i)²/(n_i P_i(1 − P_i)); regression t-test; model design and documentation — the documentation test (could a newly hired team continue the model from the documents alone?); Tables 6.9–6.11 report templates.
- Gama Sec. 3.2 (detectors on the error stream — Ref to concept-drift), Sec. 3.4 (loss estimation with two windows / fading factors; PH on the ratio of short- to long-term error), Sec. 4.1 (detector metrics: average run length on drift-free data; delay; point accuracy), Sec. 4.2 (prequential with sliding window) — the stream-side instruments; App. B.2 (PAKDD'09 credit data: labels released only for the first part) — label lag in monitoring.
- FraudFinder bqml/06 L3406–3636 (model monitoring: feature schema for drift, training table as the skew baseline, explanation spec for attribution skew/drift; EmailAlertConfig; monitor_interval; RandomSampleConfig 0.5; drift thresholds 0.05, skew 0.5 per feature; ObjectiveConfig; request/response logs in BigQuery; only 9 of 25 features monitored; skew = serving vs training, drift = serving over time) — read in full in the application; here the definitions.
- PSD2 RTS Arts 19–21 (the 90-day fraud rate monitored per exemption band; quarterly reporting; Art 20's two-quarter cessation and one-quarter resumption; Art 3's yearly audit of the methodology, model and rates) — the statutory monitoring loop; Art 22's conditions — forward to psd2-sca-tra; here as "a monitored quantity with a legal threshold and hysteresis".
- AMLR Art 10(1) (new technologies risk-assessed before launch), Art 9(1) (independent audit function), AMLD6 Art 37(7) (supervisors may inspect software, databases, IT tools unannounced) — one sentence each; AI Act Art 72 (post-market monitoring plan: actively and systematically collect performance data over the lifetime), Art 73 (serious incidents within 15 days), Art 9 (risk management as a continuous iterative process), Art 15(3) (declared metrics), Art 43(4) (pre-determined changes to a continuously learning system are not substantial modifications) — one sentence each, forward to eu-ai-act-fraud.
- Dal Pozzolo 2015 (Brier score as the calibration metric; p′ vs p_s) and Handbook Ch5 (prequential variance as the resolution of any comparison) — the quantities to monitor.
- Baesens Ch7 pp.344–346 (model board, chief analytics officer, subsidiarity) — governance in one paragraph; Ch7 pp.334–336 TCO/ROI — one line.

## Key points
1. The life cycle as the object: development → testing (latency, missing/extreme inputs, dummy frauds) → staging in parallel → production → retirement to a repository; three changeover modes; champion–challenger as the standing comparison; the documentation test.
2. Population stability: SSI/PSI derived and computed (Table 6.6's 0.0605; the 0.304 variable), the identity with IV (scorecards-woe) — the same formula measures a variable's predictive power and its drift; population first, then per variable; the score distribution itself as the first thing to watch (the capstone's checkpoint); thresholds as conventions, not laws.
3. Performance stability: the metric report per period; traffic lights by absolute change and by bootstrap (pooled resampling — derive why pooling under the null is the right resampling); which metric per model (for the fraud detector: AP, CP@100, and the fraud rate per band); the label lag — performance arrives δ days late (recall), so population stability is the early warning and performance the confirmation.
4. Calibration backtests: binomial critical rate per pool, Hosmer–Lemeshow across pools; the independence assumption broken by card clustering and network effects (a compromised terminal's day) — over-rejection read as early warning; Brier on the stream; the β correction's calibration as a monitored quantity.
5. The monitored quantities of this course assembled: score PSI, feature PSI (per variable), AP/CP@100 with δ lag, Brier, attribution drift (alert-explanations), the 90-day fraud rate per band with the RTS's own hysteresis (a controller with legal thresholds — the first "monitored quantity with a statutory consequence"), the drift detectors of module 7 on the error stream.
6. Governance: model board, independent audit, pre-launch risk assessment, supervisory access to the system — the institutional layer the law makes concrete (module 10); the retraining cadence as a governed change (AI Act's pre-determined-change clause as the hook for a continuously retrained detector).
7. ★ Starred: Hosmer–Lemeshow's degrees of freedom; the bootstrap's validity under dependence; TCO/ROI of a model.

## Set pieces & gems
- SSI 0.0605 green; 0.304 red on one variable.
- SSI = IV — the same formula twice.
- The bootstrap traffic light (95% / 99%).
- Binomial over-rejection as early warning — "network effects break independence".
- The documentation test.
- 9 of 25 features monitored (FraudFinder) — forward.
- The RTS's two-quarter trip / one-quarter reset as a legal hysteresis.

## Pitfalls
- Keep SSI's two uses (power vs drift) explicit; do not let the reader think IV "measures drift" without the second distribution.
- Monitoring numbers lag by δ; say which quantities do not (features, scores) and which do (performance, calibration).
- No statute beyond one sentence per hook here.

## FIGURE PLAN
- draw: The life cycle as a five-box pipeline (development → testing → staging → production → retirement) with the champion–challenger loop drawn between staging and production and the three changeover modes as small insets. Inspired by Baesens Fig 6.1 (recreated). Key image.
- draw: SSI as a `<FigureSequence>` (3 frames): (1) expected and observed bin shares as two bar rows, (2) the per-bin term (obs − exp)·ln(obs/exp) written under each bin, (3) the sum with the traffic-light bands. Inspired by Table 6.6.
- draw: Performance report over periods: AP and CP@100 per month with the ±5%/±10% bands and a bootstrap band — computed on the simulator stream with a planted drift.
- draw: The bootstrap traffic light: pooled sample → two resamples → metric difference → histogram over 1,000 draws with the observed difference and the 95%/99% cuts marked. Computed.
- draw: Calibration pools: predicted vs observed fraud rate per pool with the binomial critical rate as a band — computed on a simulator week; a pool that over-rejects due to a compromised terminal marked.
- draw: The monitoring dashboard as a labelled grid: rows = quantities (score PSI, feature PSI, AP, CP@100, Brier, attribution drift, 90-day fraud rate per band), columns = lag (0 / δ / 90 days), owner, threshold, legal hook — the course's monitoring spec in one table.

## EXERCISE PLAN
1. Warm-up: compute SSI for a provided ten-bin expected/observed table and assign the traffic light.
2. Derivation the lesson skipped: show SSI is a symmetrised KL-type divergence (the sum of KL(obs‖exp) and KL(exp‖obs) in nats) and hence ≥ 0 with equality iff the distributions match; then show the IV formula is the same quantity with "good" and "bad" as the two distributions.
3. Boundary probe: a bin with zero observed count — SSI's term is undefined; the merge-bins and the ε fixes; which the IV convention (scorecards-woe) used and why monitoring must use the same binning as training.
4. Claim to refute: "The score's PSI is 0.02 (green) this month, so the model is stable." Refute: performance lags by δ and PSI on the score cannot see a label-distribution change (prior shift) when scores are unchanged; name the quantity (per-band fraud rate, or AP with lag) that would catch it, and the Elliptic step-43 case where the input distribution barely moved.
5. Research-shaped: on the simulator stream, run the bootstrap traffic light on AP between the training month and each later week with a scenario-2 burst planted; report the week the light turns red and the detection delay relative to the burst.
6. FORWARD (E7): compute the rolling 90-day value-weighted fraud rate per amount band (≤ 100, ≤ 250, ≤ 500) for a simulator exemption policy "exempt if score < τ" at two values of τ — the reader meets the quantity the RTS caps and the trade-off between exempted volume and the rate → lands on `psd2-sca-tra`.
7. Mixed review (E3): apply a Page–Hinkley detector (concept-drift) to the daily AP series and to the daily score-PSI series; report which fires first on the planted burst and by how many days — the δ-lag argument measured.

## ARC
- Inherits: drift and its detectors (concept-drift); calibration and the β correction (module 2); attributions (alert-explanations); the decision policy (score-to-action).
- Contributes: the managed-asset view — life cycle, stability indices, performance and calibration backtests, the monitoring spec with lags and legal hooks.
- Hands off: the application (fraudfinder-monitoring-read); the RTS fraud-rate controller (psd2-sca-tra, tra-exemption-engine); the AI Act's post-market monitoring (eu-ai-act-fraud); the capstone's stability-monitor and fraud-rate-controller checkpoints.
- Spine step 9: from score to governed decision.
