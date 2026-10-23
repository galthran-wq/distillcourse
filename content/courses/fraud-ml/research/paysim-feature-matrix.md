# From PaySim logs to a feature matrix — research brief

Lesson: `paysim-feature-matrix` (module: features, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Analyze the PaySim mobile-money log as an artifact — what its generator replays, what its fraud flag encodes — and construct a feature matrix whose signal survives that reading
Opening (verbatim, the lesson must start with it): A six-million-row mobile-money log on Kaggle carries 8,213 rows marked fraud. Before building features on it: what did the simulator that produced it actually replay from the real service, how did the fraud flag get there, and which patterns in the data are signal and which are artefacts of the generator?

## Sources to consult
- Lopez-Rojas, Elmir, Axelsson 2016 (PaySim): Sec. 3 (five transaction types CASH-IN, CASH-OUT, DEBIT, PAYMENT, TRANSFER), Sec. 4.2–4.3 (the aggregated transaction file per day/hour: "day 1 hour 15, 8703 PAYMENT, mean 180000, std 15000"; repetitions file; balance container), Sec. 4.4 (a TRANSFER needs a counterpart client), Sec. 4.5 (outputs with balance deltas for all parties; seed and parameter history), Sec. 5 (744 steps = one month; run PS41840 ≈ 23M rows; Table 1 counts and mean amounts; SSE selection; Figs. 1–5 overlays; first 14 days busier), Abstract and Sec. 6 (no fraud injected; fraudulent agents are future work) — `research/texts/paysima-.txt`.
- HKU FITE7410 A1 handout and answer, Part I (PaySim EDA): 6,362,620 rows, 11 attributes; 99.871% non-fraud vs 0.129% fraud; CASH_OUT 2,237,500 is 5.4× DEBIT 414,324; fraud only in TRANSFER and CASH_OUT; fraud uniform over steps while genuine traffic has a rhythm; step mod 24 trough at night; amount–balance correlations shift between classes; no NA or negative values; no extreme outliers among frauds; feature step 6 (numeric IDs, per-account counts) — `research/texts/hku-fite7410-a1q.txt`, `hku-fite7410-a1a.txt`, `hku-fite7410-a1code.txt`.
- Handbook Ch2.4 (the only public card data is the 2-day Kaggle set; the simulator argument) and Ch3.2 (what a simulator must replay to be useful: entities with profiles, time, scripted fraud) — `research/texts/reproducible-Chapter_2_Background_MachineLearningForFraudDetection.md`, `reproducible-Chapter_3_GettingStarted_SimulatedDataset.md`.
- Altman et al. 2023 Sec. 7 and Table 1 (synthetic data's labels are complete by construction; the scale ladder of synthetic AML sets; a generator released as data only) — `research/texts/realisticsyn-.txt`.
- Bolton & Hand Sec. 4 (mobile-money-style laundering levels; structuring) for the TRANSFER→CASH_OUT reading — `research/texts/statisticalf-.txt`.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The module has taught how to build features from an entity's past, under the rule that nothing from the future and no unarrived label enters. The application turns that on a dataset most courses use without reading its origin: the PaySim log on Kaggle. The reader knows from `canonical-datasets` that it is a simulator replay with a fraud flag the 2016 paper never describes. The task is to read the artifact against the module's results: which columns are the generator's bookkeeping, which patterns a feature can lean on, and which "findings" from published coursework are the generator showing through. Terms the newcomer does not have: "agent-based simulation", "aggregate replay", "step", the column names (`oldbalanceOrg`, `newbalanceDest`, `isFlaggedFraud`).

### Chain of sub-problems
1. **What the generator replays** — Obvious attempt: treat the log as a bank's transactions. Why it fails: the paper describes an agent-based simulation calibrated on *aggregates* — per day and hour, a count, a mean and a standard deviation of amounts per type — plus a repetition profile per client and an initial-balance distribution; individual behaviour is not replayed, only its hourly totals. Answer: read each column as what the generator wrote: `step` is the hour index (744 = one month), `type` one of five, `amount` a draw from that hour's distribution, the four balance columns the generator's ledger for both parties, `nameOrig`/`nameDest` agent ids. Because: a feature that assumes a per-account habit assumes something the generator did not model beyond a repetition count.
2. **Where the fraud flag came from** — Obvious attempt: cite the paper for how fraud was injected. Why it fails: the paper says fraud injection is out of scope and future work; the Kaggle release carries `isFraud` and `isFlaggedFraud` with a one-paragraph description. Answer: treat `isFraud` as a generator flag of unknown script, infer its script from the data, and treat `isFlaggedFraud` (a rule: transfers over a threshold) as a rule-layer output, not a label. Because: a label whose production is unknown is read by its footprint.
3. **The footprint** — fraud rows are only TRANSFER and CASH_OUT; 8,213 of 6,362,620 (0.129%); uniform over steps while genuine traffic has the daily rhythm and the busy first two weeks; no extreme amounts among frauds; the amount–balance correlations differ by class; no missing or negative values anywhere. Because: these are the signatures of a script that empties an account by a transfer followed by a cash-out at a flat rate, not of behaviour.
4. **Which features survive** — Obvious attempt: run the whole module-3 pipeline. Why parts of it fail: with no per-account habit, 30-day customer windows mostly count one or two rows; the circular-time feature has nothing to fit. Answer: the type gate (model TRANSFER and CASH_OUT only), hour of day from step mod 24, the balance deltas (origin and destination, before vs after, their disagreement with the amount), per-account counts in the window, and the pairing of a TRANSFER with the CASH_OUT that follows it. Because: those are the quantities the script moves.
5. **Which features are artefacts** — the balance columns disagreeing with the amount (the generator's ledger quirks), destination balances that are zero for merchants, `isFlaggedFraud` as a near-constant; a model that scores perfectly on them has learned the generator. Because: the module's point is that a feature is a statement about the entity; here the entity is a script.
6. **Point-in-time reading** — there is no label delay, no feedback loop, no adversary and the labels are complete, so the delayed terminal risk and the delay block have nothing to do; say so, and build the matrix with the as-of discipline anyway so the lab can reuse it. Because: the discipline costs nothing and the departure must be named, not silently skipped.
7. **What the dataset can and cannot test** — a feature pipeline, type gating, the burst count; not evaluation under delay, not drift, not the adversary. Because: the application states the departures from the idealisation (L16).

### Set pieces and worked examples to recreate
- The calibration row "day 1 hour 15, 8703 PAYMENT, mean 180000, std 15000" as the whole generator in one line (PaySim Sec. 4.3).
- Table 1 of the PS41840 run: CASH-IN 4,496,947 at 153,019; CASH-OUT 9,014,407 at 155,989; TRANSFER 2,030,969 at 630,810; PAYMENT 8,955,794 at 10,793; DEBIT 139,935 at 5,016 (PaySim Sec. 5) — against the Kaggle file's 6.36M rows, which is a different, smaller run.
- Fraud only in TRANSFER and CASH_OUT; 99.871% / 0.129%; CASH_OUT 5.4× DEBIT; step mod 24 trough; class-dependent correlations; no outliers among frauds (HKU A1 answer, Part I Steps 2–6).
- The first 14 days busier than the rest, attributed to salaries early in the month (PaySim Sec. 5).
- "Simulation is not replication"; the run published is the best of several by SSE (PaySim Sec. 2, Sec. 5).

### Pitfalls and terms to define
- The Kaggle release is not the paper's run: do not quote the paper's Table 1 counts as the file's; the file has 6,362,620 rows, 8,213 frauds.
- `isFlaggedFraud` is a rule output, not ground truth; define it once and exclude it as a feature.
- `step` is an hour index; "step mod 24" gives hour of day only if the run started at hour 0 — say it is an assumption.
- Do not say "the fraud was injected by …" with any specific script; the lesson infers, and labels it inference.
- Licence: the Kaggle PaySim page's licence terms must be checked before any file ships in a lab; the lab brief handles this.
- No author names in the body: "the simulator paper", "a course assignment's analysis".

### Recalled, not re-taught
- What PaySim is among the datasets (`canonical-datasets`): one clause.
- Windowed aggregates, the circular time flag, the as-of join (`transaction-aggregates`, `behavioural-profiles`, `point-in-time-features`): named as the pipeline being applied, not re-derived.
- Label completeness (`canonical-datasets`): recalled when stating that nothing here is delayed.

## FIGURE PLAN
- draw: key image — the generator as a pipeline: aggregate file (day, hour, type, count, mean, std) + repetitions file + balance container → the step loop → the log row with its 11 columns; single `<Figure>` (inspired by the paper's ODD description).
- source: paysima-fig1-4-orig-vs-synthetic — stem `paysim-orig-vs-synthetic`; the reader must see the original (red) and synthetic (blue dashed) COUNT per step overlaying each other for one type, with the busy first two weeks; centered under "what the generator replays" (crop to the CASH-OUT COUNT panel).
- draw: fraud count per type as a bar chart with zeros on CASH-IN, DEBIT, PAYMENT; single `<Figure>` (from the HKU finding, computed).
- draw: genuine vs fraud counts by step mod 24, two normalised histograms, the genuine trough at night and the flat fraud line; single `<Figure>`.
- draw: `<FigureSequence>` 3 frames: a TRANSFER row and the CASH_OUT that follows it from the destination account, with origin and destination balances before and after — the script's footprint.
- draw: the feature matrix as a table: columns kept (type gate, hour, balance deltas, per-account count, pairing) and columns dropped (`isFlaggedFraud`, raw ids, merchant destination balance) with the reason beside each.
- draw: the departures grid — delay, feedback loop, adversary, label completeness — with a tick or cross per dataset for PaySim, the handbook simulator, the ULB set; single `<Figure>`.

## EXERCISE PLAN
1. [research-shaped] Reproduce from the file: the fraud count per type, the 0.129% rate, and the share of frauds whose origin balance after the transaction is zero.
2. [boundary probe] Restrict the matrix to TRANSFER and CASH_OUT and recompute the base rate; show how the type gate changes the precision ceiling of any detector at k = 100 on one day.
3. [claim to refute] "`isFlaggedFraud` is a free feature: it marks fraud with high precision." Refute with its count and its definition (a threshold rule on transfers); the step that fails is that it is an output of the rule layer, not an observation.
4. [research-shaped] Test the "uniform over time" claim: compare the fraud rate per step mod 24 against the genuine rhythm and state what a time-of-day feature would learn here that it would not learn on real data.
5. [derivation skipped] Show that with a per-account repetition count of r, the expected number of rows in a 30-day customer window is r and the circular-time arc needs at least seven points — derive the fraction of accounts for which the module's profile features are defined.
6. [mixed review] Build the as-of join of `point-in-time-features` for a per-account running count on this file and show on one origin account that the naive join by id assigns a later count to an earlier row.
7. FORWARD → `anomaly-detection-framing`: cluster the TRANSFER rows by (amount, origin balance delta, destination balance delta) with k-means and report the fraud share of the purest cluster — the reader meets the cluster-as-detector that module 5 will judge.

## ARC
- Spine step 3 "Features are context": "A raw transaction has no fraud signal; the signal is the deviation from the entity's own history, which means windowed aggregates over the cardholder and the terminal, computed from what was known at scoring time — including labels that had not yet arrived."
- Inherits: the dataset's place and label completeness (`canonical-datasets`); aggregates, profiles and the as-of discipline (`transaction-aggregates`, `behavioural-profiles`, `point-in-time-features`).
- Contributes: a reading of the artifact — the generator, the flag's footprint, surviving vs artefact features — and the feature matrix the lab extends.
- Hands off: the matrix and the licence question to `point-in-time-feature-lab`; the cluster-as-detector to `anomaly-detection-framing` and `ulb-unsupervised-scores`.
- APPLICATION spec: the artifact is the Kaggle PaySim log read against the 2016 paper and a published course analysis of it. Module results used: windowed and conditional aggregates (`transaction-aggregates`), hour-of-day and inter-event features (`behavioural-profiles`), the as-of join and the rule that label-derived features are shifted (`point-in-time-features`). Departures from the idealisation: no label delay and no feedback loop (labels are a generator flag, complete and instant), no entity habit beyond a repetition count, no adversary; the published run is the best of several by SSE and the Kaggle file is a different run.
