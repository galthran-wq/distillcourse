# A PSD2-compliant transaction-risk-analysis exemption engine — research brief (module 10 APPLICATION)

Lesson: `tra-exemption-engine` (module: eu-regulation, core, planned). NEW. Module-final application (L16): the RTS as code, run as a computational study on the simulator.
Goal: Design and run a TRA exemption engine — a per-transaction risk score, the Annex exemption bands, the rolling 90-day value-weighted fraud rate and the cessation controller — on the simulator and state where it departs from the RTS.

## Sources
- RTS 2018/389 Arts 2, 3(2), 18, 19, 20, 21 and the Annex (primary; quoted in full in psd2-sca-tra's brief): the three TRA conditions; the six real-time flags; "a risk scoring for each individual transaction"; the value-weighted 90-day rate with recovered funds counted and SCA'd flows in the denominator; the two-quarter trip and one-quarter reset per type and band; the quarterly monitoring report's fields (fraud value, total value, rate by SCA and by exemption; average value; counts and percentages per exemption); the yearly audit of methodology, model and rates; Rec 14–16.
- PSD2 Arts 73–74, 97, 98(3) (liability; SCA trigger; exemption criteria), Art 96(6) (annual fraud statistics) — the frame.
- Handbook Ch3.2 (the simulator as the stream; all transactions treated as remote card payments for the study; scenario amounts: genuine ~U(5,100)-centred, scenario 1 > 220, scenario 3 ×5) and the course's reduced generator; module-2 harness (the model whose score the engine thresholds; AP/CP@100 as the model's own metrics); example-dependent-cost (savings with the EUR 50 liability and a friction cost per step-up as the engine's objective); model-risk-monitoring (the controller as a monitored quantity with hysteresis; the stability index on the exempted population); score-to-action (step-up as an action; decision zones per band).
- Handbook Ch2.2 (ECB's fraud share of value 0.035–0.042% for SEPA cards — the order of magnitude a real portfolio runs at, against the Annex's 0.01–0.13%).
- FraudFinder bqml/07 (the serving handler shape: message → features → score → decision → log) — the engine's place in the serving path; eu-aml-single-rulebook (Art 77's record) and gdpr-financial-crime-data (the data the engine may use; Art 22 status of an automated exemption — approving without friction is not an adverse decision; a step-up is friction, not a refusal).

## Key points
1. The engine specified as code, article by article: per-transaction score from the module-2 model; band lookup (≤ 100 / ≤ 250 / ≤ 500 by amount); exemption decision = (band's rate ≤ reference) ∧ (amount ≤ ETV) ∧ (no flag) ∧ (score < τ_band) — the six flags implemented as the course's features (abnormal spending/behavioural pattern from module 3's deviations; device/location from the simulator's terminal geography as a stand-in; known scenario from the rule layer; payee risk from the terminal risk); the rolling 90-day value-weighted rate per band with SCA'd and exempted flows in the denominator and recovered funds counted; the controller's state machine (ok → reported → suspended → resumable) per band; the quarterly report emitted with Art 21's fields; the alert/decision record (Art 29 traceability; AMLR Art 77).
2. The study: for τ on a grid, per band — exempted volume (friction saved), the 90-day rate, the controller's state over four simulated quarters, savings under the EUR 50 liability and a friction cost; the largest lawful τ per band; the band at which no τ is lawful for this model's precision (expected: EUR 500 band unreachable on the simulator's fraud rate of 0.84% by value unless τ is near zero) — "model precision sets the legally allowed friction" as a plotted curve.
3. Value weighting vs count weighting demonstrated: the same policy's count-based rate vs value-based rate; a few scenario-1 frauds (amounts > 220) dominate the value numerator; recovered funds (simulated chargeback recoveries) do not help; moving traffic to SCA does not lower the rate.
4. The controller's dynamics: a drift burst (scenario 2's compromised terminals) pushes the rate over the reference for two quarters → suspension → the model is retrained (module 7's cadence) → one quarter below → resumption; the hysteresis as the law's own choice between sensitivity and stability; what the quarterly report shows a supervisor.
5. The engine's place in the system: the serving path (score → engine → SCA or approve → log) with its latency budget; the yearly external audit (Art 3(2)) of the model, the methodology and the rates — the artefacts the engine must produce (documentation of the score, the thresholds, the rate computation, the report); AI Act reading: an approval-without-friction is not an adverse automated decision; the step-up is friction, not refusal (GDPR Art 22's significant-effect test); the data used is Chapter III/PSD2 Art 94 data.
6. Departures (L16): the simulator's fraud is not remote-card fraud and its rate (0.84%) is far above any real portfolio's (0.03–0.04% by value), so the Annex bands bite much earlier than in practice — the lesson rescales the simulator's fraud rate (drop 90% of frauds) for a second run and shows the bands open; the six flags are stand-ins; the real rate is audited and reported, not computed by the model owner alone; the controller's thresholds are the law's, not tuned.

## Set pieces & gems
- "Exempted volume vs fraud rate" per band crossing the Annex line.
- The band no τ can reach — precision as the legal ceiling.
- Value vs count weighting: scenario 1's large amounts dominate.
- The state machine over four quarters with a planted burst.
- 0.84% (simulator) vs 0.035–0.042% (SEPA by value): why the second run rescales.

## Pitfalls
- Every number is simulated; captions say so; the Annex numbers are the only real ones.
- Keep Art 16 (low-value) out of the engine (it is a different exemption with count rules); the engine is Art 18 only; mention Art 16 as a sibling lane in one sentence.
- The application is a shipped study notebook, not a lab; the capstone lab implements the controller as a checkpoint.

## FIGURE PLAN
- draw: The engine as a tiered flow: transaction → score (module-2 model) → band → six flags → rate check (controller state) → exempt / SCA → log → quarterly report — with the article numbers on the boxes. Single component figure; key image.
- draw: `<FigureSequence>` (4 frames) of the controller over four quarters with a planted burst: rate vs reference per quarter, state badge changing (ok → reported → suspended → resumed).
- draw: Exempted volume (fraction of remote value) and 90-day rate vs τ for the three bands as three panels, the reference line and the lawful region shaded — computed.
- draw: Count-weighted vs value-weighted rate over the same 90 days as two lines, with the scenario-1 frauds' contribution stacked — computed.
- draw: Savings vs τ under the EUR 50 liability and a friction cost per step-up, with the lawful τ marked — computed (example-dependent-cost's savings reused).
- draw: The quarterly report as a table figure with Art 21's fields filled from the study's run (fraud value, total value, rate by SCA and by exemption, average value, counts and percentages).
- draw: The rescaled run: the same three panels with the simulator's fraud rate cut to 0.08% — the bands opening; two near-identical panel rows joined by an arrow (voita rule 8).

## EXERCISE PLAN
1. Warm-up: from the study's quarterly report compute the rate for the EUR 250 band and state the controller's state after the quarter.
2. Boundary probe: τ = 0 (exempt nothing) — the rate is still computed on all remote flows (Art 19's denominator); what the report shows and why the exemption's availability is judged on a flow it never touched; τ = 1 (exempt everything in band) — the rate equals the band's raw fraud rate.
3. Claim to refute: "The engine should exempt the lowest-score transactions until the band's rate reaches the reference exactly, to maximise friction saved." Refute: the rate is a 90-day trailing quantity with a two-quarter trip; running at the reference guarantees suspensions under any drift; derive the margin the controller's lag implies (the module-7 detection-delay argument) and name the clause (Art 20(2)).
4. Research-shaped: rerun the study with the module-3 feature set replaced by raw features only; report the largest lawful τ per band and the friction lost — features as legal capacity.
5. Derivation the lesson skipped: show that under value weighting the rate's sensitivity to one fraud of amount a is a/(total value), and derive how many scenario-1 frauds (amount > 220) suffice to breach the EUR 500 band's 0.01% on a 90-day volume of EUR V; evaluate for the simulator's V.
6. FORWARD (E7): add the engine's decision and the controller's state to each transaction's log row and list the fields a supervisor could audit against the module's artefacts (score, flags, band, rate, state, report) — the reader has specified the serving log and the record → lands on `real-time-scoring-architecture` and `label-maturation`'s ledger.
7. Mixed review (E3): run a Page–Hinkley detector (concept-drift) on the weekly value-weighted rate and compare its alarm week with the controller's suspension quarter; then apply the stability index (model-risk-monitoring) to the exempted population's score distribution across quarters.

## ARC
- Inherits: the TRA derivation, the rate and the controller (psd2-sca-tra); costs and savings (example-dependent-cost); the model and harness (module 2); monitoring (model-risk-monitoring); the AML record and GDPR status (previous lessons).
- Contributes: the module cashed out as a runnable engine — the law as a state machine and a report, the precision-as-capacity curve, the value-weighting consequences.
- Hands off: the capstone's fraud-rate-controller and alert-ledger checkpoints; the design lesson's exemption lane; the serving path (real-time-scoring-architecture).
- Spine step 10: the regulator reads the logs.

## APPLICATION (L16)
- Artifact: a computational study (shipped notebook) implementing RTS Arts 18–21 and the Annex as a state machine and a report over the handbook simulator's stream, under two fraud-rate regimes (native 0.84% and rescaled 0.08%).
- Module results used: TRA's three conditions, the value-weighted 90-day rate, the two-quarter cessation and liability (psd2-sca-tra); the AML record (eu-aml-single-rulebook Art 77); the Art 22 status of exemption vs step-up (gdpr-financial-crime-data); the AI Act's non-high-risk classification of the scorer (eu-ai-act-fraud); plus module 2's model and savings and module 9's monitoring.
- Departures from the idealisation: simulated non-remote fraud at an unrealistic rate (hence the rescaled run); stand-in flags; no external audit; the controller's thresholds fixed by law; no PSD3/PSR or EBA review changes reflected (original adopted text).
