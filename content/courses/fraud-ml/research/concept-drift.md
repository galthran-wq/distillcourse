# Concept drift: taxonomy, detection and adaptation — research brief

Lesson: `concept-drift` (module: sequences-drift, core, planned). NEW.
Goal: Classify drift as real, virtual or prior shift, detect it with CUSUM, Page–Hinkley, DDM and ADWIN on an error stream, and design a windowing, forgetting and ensemble strategy for a transaction stream.

## Sources
- Gama et al. 2014 (primary, read in full incl. appendix): Sec. 2.1 definitions (Eq. 2 ∃X: p_t0(X,y) ≠ p_t1(X,y); real drift p(y|X), virtual p(X), population; the real-estate news example; Fig. 1); Sec. 2.2 patterns (sudden, incremental, gradual, reoccurring, outlier-not-drift; Fig. 2; severity, predictability, frequency); Sec. 2.3 requirements; Sec. 2.4 predict–diagnose–update with delayed feedback (Fig. 3); Sec. 3.1 memory (single vs multiple examples; fixed/variable/landmark windows; reservoir sampling p = k/i; fading factor S_i = G(X_i, αS_{i−1}); exponential weights; "recency ≠ relevance"); Sec. 3.2 detectors — CUSUM g_t = max(0, g_{t−1} + (x_t − δ)), alarm if g_t > λ; Page–Hinkley m_T = Σ(x_t − x̄_T − δ), M_T = min m_t, PH_T = m_T − M_T, alarm if > λ; SPC/DDM p_i, σ_i = √(p_i(1 − p_i)/i), minima tracked, Warning at p + s ≥ p_min + 2s_min, Out-of-Control at 3s_min, time between Warning and Drift as rate of change; EWMA Z_t = (1 − λ)Z_{t−1} + λe_t with σ_Z; two-window tests (Kifer, entropy, KL, stable vs reactive); ADWIN — drop the older subwindow when two subwindow means differ by more than ε_cut = √((1/(2m)) ln(4|W|/δ)), m = harmonic mean of sizes, O(log W) memory via exponential histograms; Table II complexities; Sec. 3.3 learning — retraining vs incremental vs online; stability–plasticity; blind (fixed windows, weighting, VFDT) vs informed (triggered; global vs local replacement, CVFDT); ensembles — dynamic combination / continuous update / structural update; SEA, DWM (multiply wrong experts' weights by β, add expert on ensemble error, prune below θ), Wang et al. weights MSE_r − MSE_i, Learn++.NSE, DDD (low/high diversity — Minku: low diversity wins before drift, high right after); reoccurring concepts kept asleep (FLORA3); Sec. 3.4 loss estimation (two windows, fading factors, PH on the ratio of short/long error estimates); Sec. 3.5 delayed, unreliable, biased, costly feedback; Sec. 4.1 metrics (Kappa; RAM-Hours; detector criteria — probability of true detection, average run length on drift-free data, delay, point accuracy); Sec. 4.2 prequential with landmark/sliding/fading, controlled permutations; McNemar, Nemenyi; App. A pseudocode (PH, ADWIN, SPC, DWM, AddExp); App. B generators (SEA θ ∈ {9, 8, 7, 9.5}; rotating hyperplane; ELEC2 45,312 rows); App. C MOA demo (sliding window w = 1,000 tracks holdout; Hoeffding tree worst).
- Lucas & Jurgovsky Sec. 3 (primary for the fraud instances): covariate shift / prior shift / concept drift equations (1–3); Moreno-Torres's joint definition; concept drift most common in the fraud literature; detecting shift — importance-weighted CV (Sugiyama), feature-importance drift, the day-distinguishability classifier (Lucas 2019: pool two days, label by day, classifier AUC = distance; weekly periodicity, Fig. 4); strategies — kernel mean matching, sliding windows, Hellinger distance trees (eq. 4 garbled in the source — write Hellinger correctly), delayed feedback aggregation (Fig. 6, Dal Pozzolo 2015 — module 8), retrain-on-drop, Adaptive Random Forest / Hoeffding adaptive trees.
- Dal Pozzolo 2014 Sec. 3.3 (stability–plasticity; forgetting rate; FLORA; Gao's minority accumulation; SERA/REA), Sec. 4 (P(X) changes with products/behaviour, P(Y|X) with fraud types → P(X,Y) non-stationary), Sec. 6 (Static / Update / Forget with ensemble weights w_m = (PR_m − PR_min)/(PR_max − PR_min); Figs 1–4; Table 2) — the strategies the application evaluates.
- Dal Pozzolo 2018 Sec. IV-C2 and VI-D: active vs passive adaptation; synthetic abrupt drift (juxtapose two months) — CP_k loss 7.7% (AW) vs 12.5% (W^D); static S loses to W^D over time (Fig. 5).
- Jurgovsky Sec. 6.1: dropout for time-stability; validation right after training misleads under drift.
- Weber Sec. 4: the step-43 collapse as the sudden-drift instance the previous module could not fix.
- Handbook Ch5 intro: older blocks dropped for drift (the window already in the validation design); Ch7 FFNN ensembles for drift (components on recent vs old).
- Dalvi 2004 Sec. 1: drift driven by the classifier itself is not concept drift in Gama's sense — forward to module 8.
- Bolton & Hand Sec. 2 (Cahill: exclude very suspicious scores from profile updates) — adaptation without poisoning.

## Key points
1. Taxonomy with fraud instances: p(X) (new products, seasonality — the weekly cycle), p(y) (a fraud wave; Elliptic's step 43), p(y|X) (a fraud type that changes its features — scenario 2 going stale after 28 days); sudden / incremental / gradual / reoccurring; the outlier that is not drift (a single compromised terminal day).
2. Measuring shift without labels: the day-distinguishability classifier (AUC between day A and day B) and its matrix with the weekly structure; Hellinger between feature histograms; importance-weighted CV in one paragraph.
3. Detecting change on the error stream: CUSUM and Page–Hinkley derived from the running mean; DDM's warning/drift bands from the binomial σ; ADWIN's cut from the Hoeffding bound; what each costs (O(1) vs O(log W)) and the delay/false-alarm trade (average run length on drift-free data as the honest false-alarm statistic); the delayed-label caveat — the error stream arrives δ days late, so a detector fires δ days after the fact (the design consequence: retrain on a cadence rather than wait).
4. Adapting: windows (size trade-off), forgetting (fading factor; keep-all-frauds-window-the-genuine from Dal Pozzolo's Forget), blind vs informed replacement, ensembles (DWM's weight multiplication; diversity before/after drift; NN ensembles on old vs recent data), reoccurring concepts (seasonal fraud kept asleep).
5. Evaluation on a stream: prequential with a sliding window (Gama's, now connected to the handbook's prequential folds), controlled permutations, Kappa for imbalance, detector metrics.
6. The fraud cadence: daily retraining (Dal Pozzolo 2014's winner), the window K, the 90-day aggregates; the static model's rank; the retraining clock as a design parameter alongside δ and k (the loop's three clocks).
7. ★ Starred: Hoeffding trees / Adaptive Random Forest; Cahill's rule (do not update profiles with suspicious events); McNemar and Nemenyi for stream comparisons.

## Set pieces & gems
- The real-estate news triad (population / prior / real drift).
- Day-distinguishability: a classifier's AUC as a distance; Sundays and Fridays cluster.
- DDM's 2σ / 3σ bands; the Warning→Drift interval as speed of change.
- ADWIN's cut formula; O(log W).
- Minku's diversity finding: low diversity before drift, high right after.
- "Recency is not relevance" with noise or reoccurring concepts.
- The static model last for every balancer (Dal Pozzolo 2014) — the application's headline, previewed.

## Pitfalls
- Keep "drift detected on the error stream" and "shift measured on the features" apart; the first needs labels (late), the second does not.
- Gama's prequential (interleaved test-then-train) vs the handbook's prequential folds: name both, use both.
- The Hellinger equation in the Lucas survey text is garbled; write H(P,Q) = (1/√2)‖√P − √Q‖₂ from scratch.

## FIGURE PLAN
- draw: Real vs virtual drift as two near-identical 2-D class scatters: left the boundary moves (p(y|x) changes), right the cloud moves under a fixed boundary (p(x) changes). Inspired by Gama Fig. 1 (recreated). Key image.
- draw: The five temporal patterns (sudden, incremental, gradual, reoccurring, outlier) as five small mean-over-time panels. Inspired by Gama Fig. 2.
- source: creditcard-lucas-day-shift-heatmap — stem `day-shift-matrix`; the reader must see the day × day matrix with its weekly banding (weekdays similar, Sundays and Fri/Sat forming their own blocks); float right beside the day-distinguishability paragraph (computed on proprietary data; cannot be regenerated).
- draw: `<FigureSequence>` (4 frames): Page–Hinkley on a seeded error stream — (1) the stream with a mean shift, (2) the cumulative m_T, (3) the running minimum M_T, (4) PH_T = m_T − M_T crossing λ with the alarm step marked and the drift-free false alarms counted. Computed; matches the demo.
- draw: DDM's bands: error rate p_t over time with p_min + 2σ (warning) and p_min + 3σ (drift) as two lines, the warning window shaded. Computed.
- draw: ADWIN: a window split into two subwindows with their means and the cut threshold ε_cut written under it; the older subwindow dropped in a second panel.
- draw: Static vs Update vs Forget as three timelines of chunks (Dal Pozzolo Figs 1–3 recreated in one figure with three rows).
- draw: The three clocks of the loop (δ label delay, k budget per day, retraining cadence) on one timeline — the design summary.

## EXERCISE PLAN
1. Warm-up: run CUSUM by hand on a 12-value error stream with δ = 0.05, λ = 0.5 and report the alarm step.
2. Derivation the lesson skipped: derive DDM's warning and drift thresholds from the binomial variance of the running error rate, and show why the bands narrow as i grows; then derive ADWIN's ε_cut from the Hoeffding bound for two subwindows of sizes n₀, n₁ at confidence δ.
3. Boundary probe: a drift-free stream — compute Page–Hinkley's expected false-alarm rate as a function of λ (simulate) and express it as an average run length; then set λ so the ARL exceeds 10,000 steps and measure the detection delay on a planted shift (the demo's trade).
4. Claim to refute: "The day-distinguishability AUC rose from 0.55 to 0.80 between Monday and Sunday, so the fraud concept drifted and the model must be retrained." Refute: that is p(x) (virtual) and reoccurring; name what would show real drift (the error stream, with its δ lag) and the strategy for reoccurring concepts (keep the Sunday model asleep).
5. Research-shaped: on the simulator, implement the day-distinguishability matrix for 14 days (a small GBM per pair) and report whether scenario-2's terminal compromises show as off-diagonal structure.
6. FORWARD (E7): simulate the loop where only alerted transactions get labels: train on day 1, alert the top 100 of day 2, label only those, retrain, repeat for 10 days; plot the training set's fraud share and its mean amount over days — the reader sees the training distribution drifting away from the stream with no change in the stream → lands on `alert-feedback-selection-bias`.
7. Mixed review (E3): place the sequence model's Sec. 6.1 warning (sequence-models-for-transactions) into the taxonomy — which drift type does dropout protect against, and which strategy (window, forgetting, ensemble) does "validation right after training" fail to anticipate.

## ARC
- Inherits: the validation geometry and its dropped old blocks (module 2), the sequence model's daily co-movement (previous lesson), the Elliptic collapse (module 6), the cadence idea from Dal Pozzolo 2014.
- Contributes: the drift vocabulary, label-free shift measurement, error-stream detectors with their trade, adaptation strategies and the retraining clock.
- Hands off: the application (next) that ranks the strategies; selection bias as drift the model causes (module 8); monitoring (model-risk-monitoring); the RTS cessation rule as a controller (psd2-sca-tra); the capstone's retraining loop.
- Spine step 7: drift and sequence.
