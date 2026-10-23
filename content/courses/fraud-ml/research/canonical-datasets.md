# The canonical datasets: ULB, the handbook simulator, PaySim, Elliptic, AMLworld — research brief

Lesson: `canonical-datasets` (module: problem, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block. Module-final APPLICATION lesson.
Goal: Analyze what each public financial-crime dataset contains, how its labels were produced, and which part of the detection loop it hides
Opening (verbatim, the lesson must start with it): No bank publishes its transactions, so the published results of this field come from a handful of public datasets: two days of anonymised card payments, a simulator, a replayed mobile-money log, a Bitcoin transaction graph and a synthetic laundering world. Before any number from them is trusted, what does each one actually contain, where did its labels come from, and which part of the detection loop does it leave out?

## Sources to consult
- Dal Pozzolo 2015 (SSCI), Sec. VI and footnote 1 (the ULB set: Sept 2013, two days, 492 frauds of 284,807 = 0.172%, released with the paper). File: research/texts/staged-dalpozzolo2015-calibrating-undersampling.txt.
- Lucas & Jurgovsky 2020 Sec. 1.1 (the ULB set is the only public card data; 28 PCA components plus Time and Amount; labels from investigators after calling the cardholder; no entity). File: research/texts/creditcard-.txt.
- Handbook Ch3.2 (the simulator: 100×100 grid, customer mean_amount ~U(5,100), mean_nb_tx_per_day ~U(0,4), radius r = 5; reference set 5,000 customers, 10,000 terminals, 183 days, 1,754,155 transactions, 14,681 frauds = 0.837%; three scenarios with counts 978/9,099/4,604 and the overlap arithmetic; first-month ramp-up artefact) and Ch2.4 (the eight challenges; Kaggle 2016 as the only public data). Files: research/texts/reproducible-Chapter_3_GettingStarted_SimulatedDataset.md, reproducible-Chapter_2_Background_MachineLearningForFraudDetection.md.
- PaySim (Lopez-Rojas et al. 2016), Abstract, Sec. 3–5 (five types; aggregate day/hour replay; "Day 1 hour 15: 8,703 PAYMENT, mean 180,000, std 15,000"; PS41840 ~23M rows; Table 1 type counts; SSE selection; no fraud injected, fraudulent agents future work). File: research/texts/paysima-.txt.
- HKU FITE7410 A1 answer, Part I (the Kaggle PaySim: 6,362,620 rows, 0.129% fraud, fraud only in TRANSFER and CASH_OUT, uniform over steps). File: research/texts/hku-fite7410-a1a.txt.
- Weber et al. 2019, Sec. 2.1–2.2 and Fig. 1 (Elliptic: 203,769 nodes, 234,355 edges, 166 features = 94 local + 72 one-hop, 49 time steps with no cross-step edges, 2% illicit, 21% licit, rest unlabelled; label heuristics; mixers ignored). File: research/texts/antimoney-.txt.
- Altman et al. 2023, Sec. 1, 3.4, 3.5, Sec. 7, Table 1, Table 4, Table 8 (AMLworld: HI/LI × S/M/L; 1 in 807–1,942; transitive taint; only 19,461 of 100,604 laundering transactions follow a named pattern; data released, generator withheld). File: research/texts/realisticsyn-.txt.
- IEEE-CIS (Kaggle, Vesta): NOT in the dossier (sources.yaml, access NOT FOUND) — mention only as a sixth public set the course does not use until staged.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader now has the loop (deadline, budget, two label clocks) and the typology (unit, label source, delay, structure). The opening says every published number comes from five public datasets. The newcomer will take a Kaggle CSV as "the data" and a column named isFraud as "the truth". The lesson reads each dataset as an artifact — what was generated or sampled, how its label column was made, which column of the typology table it fills and which part of the loop it cannot show — so that the module's results can be checked against something real. Terms not yet available: PCA components (recall from classical-ml), simulator, agent-based replay, time step, transitive taint, label completeness.

### Chain of sub-problems
1. **Why is there so little public data?** — Obvious attempt: ask a bank. Why it fails: a payment log is personal data and a competitive asset; the one real release (ULB 2013) had to be reduced to 28 principal components plus Time and Amount over two days before it could be published. Answer: public data are either anonymised to the point of losing the entity, or synthetic. Because: the entity — the card, the customer — is exactly what identifies a person.
2. **ULB: what survives the anonymisation?** — Obvious attempt: treat V1–V28 as features like any other. Why it fails: they are principal components of unknown originals; there is no card id, so no entity history, no delay, no feedback loop; two days only, so no drift and no weekly cycle. Answer: the ULB set tests a per-row classifier under 0.172% prevalence and nothing else; its labels are investigator verdicts, near-complete for two days. Because: everything the loop does happens across time and entities, and both were removed. (Its one lasting contribution is the undersampling-calibration paper it was released with — module 2.)
3. **The simulator: what does a made-up world buy?** — Obvious attempt: a simulator is fake data, useless. Why it fails: a world whose generating parameters are known lets a detector's findings be checked — the tree that learns amount > 220 has found scenario 1 — and gives entities, time, delay and a feedback loop that real public data lack. Answer: customers and terminals on a 100×100 grid, Poisson counts, Gaussian amounts, three scripted frauds (amount > 220; two terminals compromised for 28 days; three customers with ×5 amounts for 14 days); 0.84% fraud; labels complete and instant by construction. Because: the simulator is a unit test with an answer key. Its departures: scripted fraud with no adversary, no CNP/CP channel, the first-month ramp-up artefact, scenario overlaps (978 + 9,099 + 4,604 ≠ 14,681).
4. **PaySim: what did the generator replay?** — Obvious attempt: the Kaggle isFraud column is the fraud. Why it fails: the paper that defines PaySim replays aggregate statistics of a real mobile-money log — per day and hour, the count, type, mean and std of transactions — and injects no fraud at all; fraudulent agents are future work; the 8,213 fraud rows on Kaggle were added later and the paper cannot say how. Answer: PaySim's marginals (type mix, daily rhythm, first-14-days peak) are real; its fraud label is a generator flag whose rules must be read off the data (fraud only in TRANSFER and CASH_OUT, uniform over time). Because: the simulator was validated by SSE on per-type aggregates only, never on account-level structure.
5. **Elliptic: a graph with no names.** — Obvious attempt: a node-classification set like any other. Why it fails: nodes are Bitcoin transactions, the 166 features are unnamed (94 local, 72 one-hop aggregates), labels come from heuristics (exchanges licit, dark markets illicit) covering 23% of nodes, and the 49 time steps have no edges between them, so the graph is 49 snapshots. Answer: Elliptic tests graph features and temporal generalisation (train on steps 1–34, test on 35–49) under 2% positives; it hides the entity (addresses clustered away), the feedback loop and the label source. Because: the labels are a vendor's heuristic, not investigations.
6. **AMLworld: complete labels no bank has.** — Obvious attempt: finally, a laundering set with ground truth. Why it fails: its labels are complete because the generator tags every euro of illicit origin transitively ($100 → $50 → $25 all laundering); a real bank labels only what it reported, and most laundering goes undetected — so a model's recall on AMLworld measures something no deployment can measure. Answer: AMLworld is the typology's laundering row with the label column filled in artificially; it gives the eight patterns, cross-bank experiments and realistic rates (1 in 807–1,942), and it withholds its generator. Because: complete labels are the point and the limitation at once.
7. **The reading of all five against the loop.** — For each: entity? time? delay? feedback loop? adversary? label source and completeness? Which module can use it for what. Because: the module's claim is that the loop is the problem; the datasets are the evidence of how hard it is to even observe.

### Set pieces and worked examples to recreate
- ULB: 284,807 / 492 / 0.172%; minimum β ≈ 0.00173 for full balancing; the column list V1–V28, Time, Amount, Class. (Dal Pozzolo 2015 Sec. VI; CS6890 PS4.)
- The simulator's generating rules with numbers, and the scenario overlap arithmetic. (Handbook Ch3.2.)
- The depth-2 tree reading amount > 220 off the data as 218.67 — the simulator as an answer key. (Handbook Ch3 BaselineModeling.)
- PaySim's calibration row: "Day 1, hour 15: 8,703 PAYMENT, mean 180,000, std 15,000"; Table 1: TRANSFER ≈ 9% of rows with the largest mean amount (630,810 vs 10,793 for PAYMENT). (PaySim Sec. 4.3, Table 1.)
- The Kaggle PaySim facts: 6,362,620 rows, 0.129% fraud, fraud only in TRANSFER/CASH_OUT, uniform over steps while genuine traffic has a daily rhythm. (HKU A1 answer.)
- Elliptic's Fig. 1: illicit fraction and node count per time step; the full Bitcoin graph ~438M nodes vs 203k here. (Weber Sec. 2.1.3.)
- AMLworld's Table 1 ladder: MLDP 2,340 transactions at 3/5 laundering; AMLsim 1.32M at 1/762; AMLworld 180M at 1/807–1/1,750; the Starnini realism check (1 per 21,000 vs 1 per 21,440). (Altman Table 1, Sec. 3.5.)
- The transitive taint example and the 19% pattern share. (Altman Sec. 3.4, Table 8.)

### Pitfalls and terms to define
- "Simulator" vs "replay": the handbook's generator invents a world from parameters; PaySim replays aggregates of a real log; say which is which when each is introduced.
- The PaySim paper cannot be cited for how fraud was injected; the lesson must say the Kaggle label is undocumented in the paper.
- "Time step" in Elliptic is a two-week snapshot with no edges across steps; the newcomer will assume a continuous graph.
- "Unlabelled" in Elliptic (77% of nodes) is not "licit"; keep the three classes apart.
- PCA components (ULB) are recalled from classical-ml; do not re-explain PCA.
- IEEE-CIS is not in the dossier; do not describe its contents.

### Recalled, not re-taught
- The loop and its clocks (<Ref fraud-detection-system>); the typology columns (<Ref financial-crime-typology>): one clause each as the reading grid.
- PCA, prevalence (classical-ml, <Ref economics-of-detection>).

## FIGURE PLAN
- draw: key image — a five-column scorecard: datasets across, loop parts down (entity, time, delay, feedback, adversary, label source, completeness), cells filled/empty. Single <Figure>.
- draw: the simulator's world: a 100×100 grid with customers, terminals and the radius-5 circle around one customer; the three scenarios as annotations. Single <Figure>, inspired by the handbook's terminal scatter.
- draw: the simulator's daily series over 183 days — transactions/50, frauds, compromised cards — with the first-month ramp-up marked. Single <Figure>, inspired by Handbook Ch3.2's daily plot.
- draw: PaySim's calibration: a table row (day, hour, type, count, mean, std) feeding a generator that emits rows — what is replayed and what is invented. Single <Figure>.
- draw: Elliptic as 49 disconnected snapshots on a time axis with the train/test cut at 34 and the illicit share per step. Single <Figure>, inspired by Weber Fig. 1.
- draw: transitive taint: $100 → $50 → $25 across three transfers, all tagged, beside the same chain in a real bank with only the first transfer reported. <FigureSequence>, 2 frames.
- source: paysima-fig1-4-orig-vs-synthetic — stem `paysim-fidelity-overlay`; the reader must see the red original and blue dashed synthetic COUNT/SUM curves per step overlapping, and that only aggregates are compared; centered under sub-problem 4.
- source: antimoney-fig1-class-balance — stem `elliptic-steps-balance`; the reader must see the illicit fraction varying by step and the uniform step sizes; float right beside sub-problem 5.

## EXERCISE PLAN
1. [warm-up] Compute the fraud rate of each dataset from its counts and place the five on one log scale with the typology's rows.
2. [claim to refute] "The ULB set has investigator labels, so a model with AP 0.8 on it would reach AP 0.8 in production." Name the two missing parts (entity history, delay) and the step that fails (two days cannot contain the feedback loop).
3. [boundary probe] In the simulator set scenario 2's compromise duration to 1 day and scenario 3's to 183 days: which detector families still see them, and what happens to the first-month ramp-up?
4. [research-shaped] From PaySim's Table 1 and the Kaggle counts, estimate how many TRANSFER and CASH_OUT rows the fraud flag could have been drawn from and the implied fraud rate within those two types; state what would count as agreement with 0.129% overall.
5. [derivation skipped] Show that scenario overlaps imply 978 + 9,099 + 4,604 − 14,681 double-labelled frauds and derive the minimum overlap between scenarios 2 and 3 if scenario 1 overlaps nothing.
6. [mixed review] Apply the base-rate funnel (<Ref economics-of-detection>) to AMLworld's LI-Large rate (1 in 1,750) and to Elliptic's 2%: the precision of the same 99%/99% detector on each.
7. FORWARD → `delayed-labels-prequential`: split the simulator's 183 days into the first 120 for training and the last 63 for testing, and count how many test-week frauds belong to cards whose earlier frauds were in the training period — the reader finds the known-card problem before it is named.

## ARC
- Spine step 1 "The detector inside the loop": "A fraud detector is one layer of a system: rules run before it, investigators with a budget of about a hundred alerts a day run after it, and the labels those investigators produce come back weeks later and only for what was alerted — every later difficulty is a consequence of that loop."
- Inherits: the loop (fraud-detection-system), the typology (financial-crime-typology), prevalence and the funnel (economics-of-detection).
- Contributes: the five datasets as artifacts with their label provenance and their blind spots; the simulator's rules; the notion of label completeness.
- Hands off: ulb-handbook-benchmark and cost-aware-evaluation-lab (the simulator), paysim-feature-matrix (PaySim read against its paper), ulb-unsupervised-scores and anomaly-scorers-lab (the ULB set), elliptic-illicit-nodes and graph-propagation-lab (Elliptic), fraud-as-a-graph (AMLworld's patterns), label-maturation (completeness).
- APPLICATION spec: the artifact is the set of five public datasets themselves, read as artifacts. Module results used: the loop's parts (deadline, budget, delay, feedback) and the typology's columns as the reading grid; the base rate as the first number read off each. Departure from the idealisation: none of the five contains the whole loop — ULB has no entity or time, the simulator no adversary, PaySim no documented fraud, Elliptic no label source, AMLworld no incompleteness — so every later result on them is a result about one part.
