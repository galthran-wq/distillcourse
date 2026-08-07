# Research brief: perching-glider-system-identification (Longitudinal System Identification from Skywalker X8 UAV Flight Tests)

status: planned
module: discrete-signals-and-systems
type: synthesis
goal: Evaluate a low-order discrete model against measured Skywalker X8 longitudinal flight-test records and identify where its assumptions fail.
est_minutes: 40

## ARC

- **Inherits:** **Difference Equations and Stability** established how to analyze a causal difference equation through its modes, impulse response, and BIBO stability condition.
- **Spine step:** “Impulse decomposition and convolution make LTI behavior predictable; recurrence adds memory whose stability must be tested against measured dynamics.” (*One response predicts a system*). Caption: “Skywalker X8 flight tests close the first time-domain loop with a measured identification audit.”
- **Contributes:** Evaluate a frozen low-order recurrence on creator-designated validation maneuvers from a measured fixed-wing UAV campaign, then delimit what the fit can establish.
- **Hands off to:** `complex-sinusoids-and-phasors`, which analyzes amplitude, phase, and discrete frequency with complex exponentials and quadrature components.

## Sources to consult

- Løw-Hansen, Bogdan; Hann, Richard (2024), *System identification campaign - Skywalker X8 UAV*, DataverseNO, Version 1.0, DOI `10.18710/U4TLYV` — primary CC0 measured dataset, README column contract, creator-designated training/validation folders, and immutable per-file MD5 checksums.
- Dataset Version 1.0 README and the nine longitudinal CSVs — seven training maneuvers and two validation maneuvers, each a separate ordered 40 Hz record; never concatenate across a maneuver boundary.
- MIT 6.003, Session 10, slides 2–14, plus captures `aerodynamic-flight-data` and `perching-trajectory` — contextual motivation only. These depict a different perching glider and supply no numbers to the Skywalker X8 computation.
- Orfanidis, §28.4.3 — narrow precedent for autoregressive prediction, separate training/generalization records, and residual-correlation diagnostics; do not cite Chapter 28 as a general system-identification treatment.
- Stoica–Moses, Chapter 1 §§1.1 and 1.5 — finite-record and model-limit framing; do not present §1.5 as a general flight-identification derivation.

## Key points the lesson must cover

1. The dataset contract precedes the fit: each file starts at `n=0`, `t=0`, has 41 headerless numeric columns, and is an independent maneuver sampled nominally at 40 Hz.
2. Use elevator command (column 2, rad) as input and pitch-rate response (prefer `IMU_angvel_q`, column 9, rad/s) as the primary output; state any alternate output before fitting.
3. Select preprocessing, lag, delay, and low AR/ARX order using the seven creator-designated longitudinal training maneuvers only; reset lag state at every file boundary.
4. Evaluate frozen one-step and free-run predictions on `validation/longitudinal_3211_5.csv` and `validation/longitudinal_doublet_4.csv`, reporting per-maneuver and equal-maneuver aggregate residual diagnostics under the predeclared strict-improvement rule, which promises no minimum improvement and no successful outcome.
5. Strong northwesterly wind and manual synchronization/resampling of 200 Hz IMU and 10 Hz GPS/propulsion channels to 40 Hz limit physical interpretation, especially exact actuator-delay claims.

## Pitfalls / subtleties to flag

- The repository labels 13 maneuvers training and four validation; use those labels. Do not random-shuffle rows, redefine validation as a final percentage, or tune after opening either validation maneuver.
- Do not bridge or impute across files. Abort on nonnumeric rows or a column count other than 41, and preserve original row order and the first-row `n=0`, `t=0` convention.
- `EstimatedState_alpha` is angle of attack in radians, not a stall label. Neither the dataset nor the MIT raster supports declaring a stall threshold for the Skywalker X8.
- Manual channel synchronization makes a fitted sample delay an effective record-level lag, not a direct measurement of actuator latency.
- Omit GPS coordinates from a derived course table unless a declared analysis needs them.
- MIT perching imagery is a different vehicle and license tier. Never digitize its pixels, pool its values with X8 records, or make a numerical comparison between the two studies.

## Concrete gems / worked examples

- The nine longitudinal records contain 3,828 complete rows at nominal `T_s=0.025 s`; verify each file's time differences rather than assuming the nominal rate.
- The maneuver set deliberately supplies two excitation families—3211 elevator sequences and elevator doublets—so validation can expose an excitation-dependent residual pattern without relabeling either maneuver as a stall segment.
- A first worked audit maps README columns to `t`, `elevator`, `IMU_angvel_q`, `EstimatedState_theta`, `EstimatedState_q`, `EstimatedState_alpha`, and indicated airspeed, verifies units, and checks that time restarts at each file.
- The frozen course fit compares `q_hat[n]=c+a1 q[n-1]+a2 q[n-2]+b1 u[n-1]` with matched-order input-free AR(2). ARX has lower RMSE and NRMSE in both prediction modes on both validation maneuvers; equal-maneuver macro NRMSE improves 12.0% one-step and 60.3% free-run.
- The ARX roots have magnitude 0.9102, so its homogeneous recurrence is stable, but one-step residual ACF crosses the descriptive `±1.96/sqrt(M)` band in both maneuvers. The supported conclusion is “predictively better but structurally incomplete,” not “the aircraft is identified.”

## FIGURE PLAN

1. `source:` **aerodynamic-flight-data** (single sourced raster, centered) — MIT's measured lift/drag scatter against flat-plate curves motivates the need for validation. Caption it explicitly as contextual evidence from a different vehicle; it is not input to the X8 computation.
2. `source:` **perching-trajectory** (single sourced raster, centered) — MIT's recorded perching sequence motivates held-out flight evaluation. State that it is a different vehicle and do not extract coordinates or timing from pixels.
3. `draw:` **Creator-designated maneuver partition** (single) — Show seven longitudinal training records and two untouched validation records, with 3211/doublet labels, independent file boundaries, lag-state resets, and no random-shuffle path.
4. `draw:` **Skywalker X8 longitudinal validation residuals by time and excitation maneuver** (single computed figure) — Plot the frozen AR(2) and ARX(2,1,1) residual evidence from `research/data/skywalker-x8-v1/derived/validation-predictions.csv`, mark independent boundaries, distinguish 3211 from doublet, and annotate only metrics reproduced in `results/validation-summary.json`.
5. `draw:` **Skywalker X8 identification pipeline** (single) — Physical fixed-wing UAV → manually synchronized 40 Hz record → training-only preprocessing/order/delay selection → frozen one-step/free-run predictor → per-maneuver validation residuals. Make the no-feedback-from-validation boundary explicit.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* Given a short README-compatible table, map the seven teaching columns to names and units, verify `Δt=0.025 s`, and identify the first invalid row if its column count is not 41.
2. **E6 — boundary probe.** Fit a low-order recurrence on two short training maneuvers while resetting lag state, then show how concatenating their last and first rows creates a false transition and changes the fitted coefficient.
3. **E6 — claim to refute.** Refute “lower training error proves a better flight model” by comparing a nested higher-order candidate with a frozen lower-order candidate on both creator-designated validation maneuvers.
4. **E6 — research shaped.** Implement the nine-file integrity audit: verify MD5, row counts, monotone time within each file, nominal sample interval, 41 numeric columns, and absence of missing values; report discrepancies without repairing them silently.
5. **E6 — strategy choice.** Reproduce the frozen AR(2) and ARX(2,1,1) comparison, report one-step and free-run errors separately for `longitudinal_3211_5` and `longitudinal_doublet_4`, and explain why lower errors coexist with structured residual autocorrelation and what wind/manual synchronization prevent the scores from proving.
6. **FORWARD (E7).** Express a damped oscillatory validation residual as magnitude, angular frequency, and phase; complex sinusoids provide that representation in `complex-sinusoids-and-phasors`, and the solution must include a `<Ref>`.

## APPLICATION

- **Artifact/study:** The CC0 *System identification campaign - Skywalker X8 UAV*, DataverseNO Version 1.0 (`https://doi.org/10.18710/U4TLYV`), restricted here to its nine longitudinal maneuver CSVs. MIT 6.003 perching rasters are contextual motivation only.
- **Results cashed out:** explicit sample/index/unit contracts; difference-equation memory; fitted-mode stability; leakage-resistant validation; one-step/free-run distinction; residual analysis.
- **Executable protocol:**
  - Verify Version 1.0 and per-file MD5 before parsing; load each headerless 41-column CSV as a separate ordered maneuver.
  - Use the seven creator-designated longitudinal training files to fix preprocessing, scaling, lag/delay, model order, and coefficients. Reset lag state at every file boundary.
  - Compare the frozen matched-order input-free AR(2) baseline with the frozen elevator-to-pitch-rate ARX(2,1,1) candidate.
  - Freeze the complete pipeline, then score both creator-designated longitudinal validation maneuvers separately and in aggregate for one-step and free-run prediction.
  - Plot residuals against time, elevator excitation, and prespecified operating channels. Report what the data show; do not convert an exploratory pattern into a predeclared flight regime.
- **Target / threshold:** The predeclared rule supports the primary claim only if ARX has strictly lower RMSE and NRMSE than AR(2) in both one-step and free-run modes on each validation maneuver, both equal-maneuver macro NRMSE effect sizes are positive, and both ARX roots lie strictly inside the unit circle. It promises no minimum improvement. The frozen run supports that rule with 12.0% one-step and 60.3% free-run macro NRMSE reductions, while residual structure rejects a stronger adequacy claim.
- **Falsification:** Reject “the higher-order or input-aware model is necessarily better” when frozen validation error, free-run behavior, mode stability, or residual structure is worse.
- **Idealization gap:** Strong wind, manually synchronized/resampled multirate channels, possible correlated sensor error, unmodeled closed-loop dynamics, and excitation/maneuver shift limit a low-order fixed-coefficient recurrence.
- **Deliverable:** Deterministic artifacts under `research/data/skywalker-x8-v1/`, including provenance/source manifests, frozen training fit, validation predictions, validation summary, and a build manifest with protocol/script/output checksums; the lesson-facing report must preserve these links and limitations.
- **Data/rights gate:** Version 1.0 is CC0-1.0 and permits redistribution and derived computations. Preserve DOI, version, file IDs, MD5 checksums, protocol/script hashes, and the build artifact-set hash. Do not use or digitize MIT rasters as numeric data, and do not quote an X8 number outside the generated validation summary.
