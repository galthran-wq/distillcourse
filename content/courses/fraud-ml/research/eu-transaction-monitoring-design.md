# Designing an end-to-end EU transaction-monitoring system — research brief (module 11 APPLICATION)

Lesson: `eu-transaction-monitoring-design` (module: system, core, planned). NEW. Module-final application (L16) and the course's synthesis: two real artifacts (FraudFinder's architecture; Neo4j's graph workflow) read against every module, and the design that results.
Goal: Design a transaction-monitoring system for an EU payment institution by reading FraudFinder's reference architecture and Neo4j's graph workflow against every result and obligation of this course, naming each component's clock, data, metric and legal hook.

## Sources
- FraudFinder README and architecture image (misc/images/fraudfinder-architecture.png: live transactions → Pub/Sub → BigQuery → EDA; batch feature engineering (BigQuery, Composer) and streaming (Dataflow) → Feature Store → training → Model Registry → endpoint → Cloud Run inference → monitoring, with the feedback loop to the warehouse); the notebooks' decisions and omissions as read in point-in-time-features, fraudfinder-monitoring-read and real-time-scoring-architecture (one store; accuracy gate; 9/25 monitored; null → 0.0; no delay block; no budget; no graph; no regulation).
- Neo4j GraphAcademy module 2 (the workflow: explore with Louvain → hypothesise → encode as ER relationships → resolve with WCC → label FraudRisk → validate by volume share; the schema User/Card/Device/IP; degree on identifiers; the 211 users / 13% of volume validation; "Louvain shrinks search 98%, degree filters noise, WCC gives deterministic communities").
- The course's own results, one per module, as the design's requirements: M1 the five layers, budget k, delay δ; M2 CP@k/AP, prequential folds with a delay block, β, savings/BMR; M3 as-of features on three clocks, delayed terminal risk; M4 the tuned tree/GBM as the tabular scorer with a scorecard variant for explanation; M5 unsupervised scores as a fused signal (W1A) for the unlabelled frontier; M6 ER components and exposure scores at midnight, a GCN as optional; M7 nightly retraining with Forget, drift detectors on the error stream, the day-shift matrix; M8 the F/D aggregation, the cadence as a race parameter; M9 zones, frontier, decision tables, attributions, PSI, performance lights, champion–challenger; M10 AMLR Art 18(3)/26/34(2)/69/71/76(5)/77, RTS Arts 18–21, AI Act classification and Arts 9–15 artefacts, GDPR Art 6/22/35, TFR fields; M11 clocks, parity, label pipeline.
- Altman Sec. 3.1 and Fig. 6 (cross-bank sharing lifts F1 from 5–9% to 21–22%; privacy-preserving sharing as future work) and AMLR Art 75 / AMLA Art 93 (information-sharing partnerships with DPIA and supervisory check); Handbook Ch7.1 (federated averaging) — the cross-institution extension.
- Baesens Ch6 pp.290–302 (case management requirements: priority, routing, mitigation, notification, audit trail, dashboards, link analysis, feeding outcomes back; Figs 6.3–6.5 SAS link analysis, 6.6–6.10 dashboards — the investigator's UI as a component) and Ch7 pp.344–346 (governance: model board, subsidiarity).
- York EECS 4486 syllabus (CDD/KYC/STR/transaction monitoring/FIU as the operational vocabulary) and USI's catalogue (regulation and ethics as the last unit) — the scope check that this synthesis matches what the field teaches.

## Key points
1. The reading: the architecture diagram is a correct skeleton (stream, store, three feature paths, training, registry, endpoint, monitoring, feedback arrow) with nothing of the loop's difficulties in it — the lesson walks it box by box and names, for each, the course result it lacks and the article that requires the lack be fixed: no delay block (M2; RTS Art 19's 90-day rate; AMLR Art 26's ongoing monitoring), no budget (M1/M2; the queue), no feedback classifier (M8), no graph (M6; AMLR Art 69(2)'s "links between transactions"), no exemption lane (M10), no record (Art 77), an accuracy gate (M9).
2. The design, layer by layer with clock, data, metric, legal hook: (i) ingestion and the store (three feature paths; as-of; parity test) — Art 10's pre-launch assessment, AI Act Art 10 data sheet; (ii) rules before the model (blocking; sanctions screening on the TFR fields — Art 23 TFR, AMLR Art 20(1)) — ms; (iii) the tabular scorer (tuned GBM; scorecard variant where explanation must be points) — < 1 s; AP/CP@k on prequential folds; AI Act classification (not high-risk under 5(b) as written; Arts 9–15 built anyway); (iv) the graph layer (ER components over identifiers nightly; exposure scores at midnight; motif rules for AML typologies) — Art 69(2); (v) the unsupervised scorer fused as a signal for the unlabelled frontier — Art 34(2)'s "unusual pattern"; (vi) the decision layer (zones, frontier, exemption lane with the controller, decision tables verified) — Art 76(5)'s human intervention; RTS Art 18/20; PSD2 Art 68/73/74; GDPR Art 22; (vii) the queue and case management (priority by expected fraud amount, routing, mitigation first, dispositions) — Art 69/71/73; AMLD6 Art 24 windows; (viii) the record (disposition ledger; attributions; Art 77's five years; Art 21 RTS quarterly report; AI Act Art 12 logs); (ix) retraining (nightly F/D with Forget; champion–challenger; the pre-determined-change documentation); (x) monitoring (score and feature PSI, AP/CP@k with lag, Brier, attribution drift, the 90-day rate per band, drift detectors; the bootstrap lights); (xi) explanation (investigator narrative, customer reason codes, supervisor record); (xii) governance (model board; independent audit; AMLA/supervisor access to the algorithm's decision records).
3. The Neo4j workflow as the AML-side pattern: explore → hypothesise → encode → resolve → label → validate — with the course's correction that WCC on ER edges is the deterministic, auditable object and Louvain the triage; where it plugs into (iv) and (vii).
4. The clocks table of the whole system (ms, < 1 s, hourly, midnight, nightly, quarterly, yearly) with each component on its row — the design's one-page summary.
5. The cross-institution variant: AMLworld's 5–9% → 21–22%; partnerships under Art 75 (DPIA, supervisory check, human oversight for AI-generated information, not the sole basis); federated averaging as the technique that shares weights, not data; the travel rule's fields as the join keys (extra lesson).
6. Departures (L16): the reference is a vendor demo on synthetic data with no regulation; the course's design is a specification, not a build — the capstone builds its core on the simulator; the real institution adds what no public source shows: investigator tooling, vendor contracts under Art 18, the audit.

## Set pieces & gems
- The box-by-box reading of the architecture image: "correct skeleton, no loop".
- The clocks table for the whole system.
- Neo4j's "98% / noise / deterministic" summary and the course's correction.
- AMLworld's sharing numbers.
- The one-page design as a figure the reader can take away.

## Pitfalls
- This is a design lesson, not a product review: every component is justified by a course result and, where applicable, an article; nothing enters because a vendor has it.
- Keep each legal hook to the article number plus a four-word gloss; the obligations were derived in module 10.
- No new concepts; the lesson reinforces only.

## FIGURE PLAN
- source: fraudfindera-s1-architecture — stem `fraudfinder-architecture`; the reader must see the vendor's end-to-end diagram (stream → warehouse → batch/streaming features → store → training/registry/endpoint → inference → monitoring with the feedback arrow) as the artifact being read; centered at the top; credited once (the same file is sourced in point-in-time-features; separate credit entries per lesson).
- draw: The same architecture redrawn in house style with the missing components added in amber (delay block, budget/queue, feedback classifier, graph layer, exemption lane, record) and the article numbers pinned — the "before/after" as two panels joined by an arrow (voita rule 8). Key image.
- draw: The twelve-component design as tiers bottom-up (ingestion/store → rules → scorers (tabular, graph, unsupervised) → decision (zones, exemption lane) → queue/case management → record) with retraining and monitoring as side loops and explanation/governance as the outer frame (voita rule 5).
- draw: The clocks table as a figure: rows = components, columns = ms / < 1 s / hourly / midnight / nightly / quarterly / yearly, cells ticked.
- draw: `<FigureSequence>` (6 frames) of the Neo4j workflow transplanted: explore (Louvain communities) → hypothesise (shared card) → encode (ER edges) → resolve (WCC components) → label (FraudRisk) → validate (volume share) — one step per frame on a small user–identifier graph.
- draw: The legal overlay as a grid: components × (AMLR, PSD2/RTS, AI Act, GDPR, TFR) with the article number in each occupied cell.
- draw: Cross-institution variants as three small diagrams (private/private, private graph + shared model, shared/shared) with AMLworld's F1 numbers under each (realisticsyn-fig6 is available as a source if the measured bars are wanted; the drawing suffices).

## EXERCISE PLAN
1. Warm-up: for each box of the reference architecture, name the course lesson that judges it and one defect found there.
2. Boundary probe: remove the graph layer from the design — which AMLR Art 69(2) basis becomes unservable and which typology rows (mules, rings) lose detection; then remove the delay block — which metric becomes unreportable (RTS Art 19) and which validation claim fails.
3. Claim to refute: "A payment institution can buy the reference pipeline from a vendor and be compliant once the model's accuracy exceeds 0.95." Refute on Art 18(3) (criteria, risk profile, onboarding decisions stay in-house), the gate (M9), the record (Art 77), the rate (RTS Art 19), and the AI Act artefacts; name each clause.
4. Derivation the lesson skipped: from the clocks table, derive the minimum end-to-end latency of a decision that uses a midnight graph score, an hourly streaming count and a per-request score, and the staleness bound on each input; state which input the TRA flags may use under the six-second budget.
5. Research-shaped: write the twelve-component design for a different institution — a crypto-asset service provider under the TFR — and list which components change (fields, screening, self-hosted assessment) and which stay.
6. FORWARD (E7): list the components the capstone lab will implement on the simulator (as-of lookup, daily queue, label arrival, F/D retrain, PSI, controller, ledger) and the ones it will not (rules, graph layer, case UI); for each omitted one state the lesson where it was built or specified — the reader has written the lab's scope → lands on `pipeline-capstone-lab`.
7. Mixed review (E3): place three of the course's keeper numbers in the design — CP@100 ≈ 0.24 (M2), the 0.06% reference at EUR 250 (M10), the 211-users/13%-volume validation (M6) — and state what each decides in the design.

## ARC
- Inherits: every module's results and the legal obligations; the serving design and the label pipeline (this module).
- Contributes: the synthesis — the course's argument as a system specification with clocks, data, metrics and legal hooks; the reference artifact read and corrected.
- Hands off: the capstone lab's scope.
- Spine step 11: the system.

## APPLICATION (L16)
- Artifacts: GoogleCloudPlatform/fraudfinder's architecture and notebooks (Apache-2.0) and Neo4j GraphAcademy's module-2 workflow (public course material), read against the course.
- Module results used: all eleven modules' headline results (listed in key point 2) and module 10's obligations by article.
- Departures from the idealisation: the reference is a synthetic-data vendor demo without regulation, graph, budget or delay; the Neo4j workflow validates without ground truth; the course's design is a specification whose core the capstone builds on a simulator — the real institution's investigator tooling, vendor contracts and audits have no public artifact in the canon.
