# canonical-datasets — ledger

**Problem.** The field's published numbers come from five public datasets (ULB card set, the transaction simulator, PaySim, Elliptic, AMLworld): what does each contain, who wrote its labels, which part of the detection loop does it leave out? Answer: anonymisation keeps real labels and drops the entity; synthesis keeps the entity and makes the labels the generator's; each dataset hides a different part (ULB: entity and calendar; simulator: adversary; PaySim: real fraud, label is a script; Elliptic: entity and most labels, labels are attributions; AMLworld: incompleteness); none has a label delay or an alert feedback loop.

## Explained
- Why public data is thin: payment log = personal data + competitive asset; the entity identifies the person and carries the signal; two routes (anonymise / synthesise) — §What to ask of a public dataset / Why the public data is so thin
- Simulator (invents a world from chosen parameters) vs replay (generator calibrated to aggregates of a real log) — same §
- Reading grid, each question derived: entity / time / label source from the typology's coordinates, completeness from label source, feedback from the model-chosen fast labels (fraud-detection-system), adversary from the time-evolving trait and structuring (typology) — §The reading grid
- Definition: label completeness = share of criminal units labelled; complete ⇒ unlabelled units genuinely clean; card near-complete, laundering radically incomplete, generated = 1; near-miss: fully labelled with "genuine = not reported within δ" is still incomplete — same §
- ULB set (opened as: what is left of a card log once the card is removed?): Sept 2013, two days, online payments of European cardholders, 284,807 rows, 492 frauds, 0.172% (1 in 580); columns Time (s since first row), V1–V28 (PCA of undisclosed originals), Amount, Class — §The ULB card set / What the file contains
- What anonymisation removed: no card (no history, no card ranking), no feature meaning, two days (no δ window, no weekly cycle, no drift; any split, random or day 1 vs day 2, stays inside 48 h, so no split holds a delay window or a weekly cycle); labels from investigators/disputes, near-complete, no label dates — §What the anonymisation removed
- In-body exercise: single-row features survive anonymisation, group-by-entity features do not (Time mod 86,400 = time of day up to unknown offset) — same §
- Simulator rules: 100×100 grid, 5,000 customers, 10,000 terminals, radius 5 (~75 terminals each), Poisson count with mean ~U(0,4), normal amount mean ~U(5,100) sd = mean/2, times around noon; 183 days from 1 Apr 2018, 1,754,155 payments, ~9,600/day — §The transaction simulator / The generating rules
- Three scenarios: (1) amount > 220 (sanity check), (2) 2 terminals/day compromised 28 days (terminal history), (3) 3 customers/day, 14 days, 1/3 of payments ×5 (customer history); map to row / terminal history / customer history; counts 978 + 9,099 + 4,604 = 14,681, 0.84%, ~85/day — §Three scripted frauds
- Scenario column (last scenario that touched a payment) introduced here as the answer key — same §
- Example: depth-2 tree (≤3 splits, 4 leaves) on one week (25–31 Jul 2018) splits at amount 218.67 = scenario 1; leaf holds 2 genuine training-week payments in (218.67, 219.98]; split below 220 because the range also holds scenario-2/3 frauds; no genuine amount above 219.98; 2,281 of 4,631 recorded-scenario-3 frauds exceed 220 — same §
- First-month ramp-up: compromised customers hold at 3×14 = 42 from day 14, terminals at 2×28 = 56 from day 28; 57 vs 85 frauds/day; customers with ≥1 fraud/day ≈ 75 (mostly scenario-2 victims, invisible in customer history); leaves out: labels complete and instant (delay only if imposed), no feedback, no adversary, no channel/merchant category/country — §What the calendar shows, and what it leaves out
- Mobile money defined; PaySim (2016) replays an aggregate file per hour × type (count, mean, sd) of one month of an African mobile-money log; aggregate line format illustrated with made-up numbers (day 1, hour 15, 8,703 PAYMENT, mean 180,000, sd 15,000 — not real data); five types CASH-IN, CASH-OUT, DEBIT, PAYMENT, TRANSFER; agents; run ~24M rows chosen by SSE on aggregates; fidelity checked only on aggregates, never accounts — §PaySim / What was replayed
- 2016 generator injects no fraud; Kaggle file = later quarter-scale run, 6,362,620 rows, 744 hourly steps, fraudulent agents scripted (take over account → TRANSFER → CASH-OUT); fraud only in TRANSFER/CASH-OUT, 0.129% (~8,200), uniform over hours; the simulated service's fraud control cancels detected frauds, so balances after a fraud row record a reversal; only fraud is cancelled, so balance-vs-amount differs by class = the label written again; release says the four balance columns must not be used — §Where the fraud label came from
- Bitcoin, addresses; Elliptic (2019, from the company Elliptic): nodes = transactions, edges = coin flow; 203,769 nodes, 234,355 edges (ledger > 400M); 166 features = 94 local + 72 one-hop aggregates, names withheld; 49 time steps two weeks apart, each one connected component within 3 h, no edges between steps — §Elliptic / What it contains
- Elliptic labels: illicit/licit by category of entity controlling inputs (company attribution heuristics; mixing transactions ignored); 2% illicit, 21% licit, 77% unknown (unknown ≠ licit); base rate 2% over all, 1 in 10 over labelled; train 1–34 / test 35–49; dark market closes at step 43, all release models fail after it — §Where the labels came from
- AMLworld (2023): individuals, companies, banks; nine criminal activities; placement/layering/integration; eight shapes (fan-out, fan-in, cycle, scatter-gather, gather-scatter …) plus ordinary-looking integration; six datasets HI/LI × S/M/L, 5M/10 days to 180M/97 days, 1 in 807 to 1 in 1,942; realism: scatter-gather + gather-scatter 1 in 21,440 vs ~1 in 21,000 at a large Italian bank — §AMLworld / What the world contains
- Transitive labels: not re-taught; Ref to financial-crime-typology#exercises (transitive-taint exercise) with a one-clause reminder. New here: LI-Large 100,604 laundering, 19,461 (~1 in 5) in the eight shapes, 81,143 disguised integration; generator withheld so launderers cannot test variants — adversary kept out — §Labels that follow the money
- Scorecard (key figure): five datasets × positive rate, entity, time span, label source, completeness, delay, feedback, adversary; delay and feedback absent from all five, adversary absent except Elliptic's one shock; each dataset's hidden part — §Five datasets against one loop
- Selection rule: name the part of the loop the question is about → take a dataset whose column has it (delay/feedback: build by hand) → name the parts the column lacks, which the answer assumes; KeyFact: complete labels only with a scripted crime, real change only with partial labels — §Which question each one can answer

## Notation
- δ (label delay, from fraud-detection-system), π (base rate, from economics-of-detection). No new symbols.

## Running cases
- Base rates: ULB 0.172% (1 in 580); simulator 0.84% (14,681 / 1,754,155); Kaggle PaySim 0.129%; Elliptic 2% all / ~9.8% labelled (4,545 / 46,564); AMLworld 1 in 807–1,942 (LI-Large 1 in 1,750)
- Simulator re-run facts (exact replication of the generator): final scenario column 973 / 9,077 / 4,631; ~75 terminals within r = 5; mean ~9,600 payments/day; first month 57 frauds/day vs 85 after; customers with ≥1 fraud ~75/day
- Test week days 129–135 with labels to day 128: 330/384 scenario-2 frauds at already-compromised terminals (86%, estimate 24/28), 110/152 scenario-3 (72%, estimate 10/14)
- Exercises: 99/99 detector precision on AMLworld 1/1,750 ≈ 5.4%, Elliptic all ≈ 69%, labelled ≈ 91%; overlap derivation a + b = 5, b + c = 27; PaySim estimate ≈ 524,000 TRANSFER rows, fraud rate ≈ 0.30% within TRANSFER+CASH-OUT, ≈ 0.78% / 0.18% if split evenly; scenario-duration boundary probes (1-day terminals = unlearnable noise; permanent leaked cards = no steady state, 3(d+1) compromised)

## Assumed
- fraud-detection-system: the loop, ~100 cards/day, two label clocks, fast labels selected by the model, δ
- financial-crime-typology: four coordinates, time-evolving trait, structuring, card label from disputes, laundering label = STR (incomplete), placement/layering/integration, transitive-taint exercise (Ref'd, not re-taught)
- economics-of-detection: base rate π, the 99%/99% detector and Bayes' precision formula
- classical-ml: PCA, undersampling (named only in Exercise 6), decision trees

## Left open
- Metrics at an alert budget on these datasets → alert-budget-metrics
- Delay block, known-card removal (forward exercise) → delayed-labels-prequential
- Undersampling correction on the ULB set → undersampling-calibration
- Simulator benchmark of five models → ulb-handbook-benchmark, cost-aware-evaluation-lab
- Terminal/customer history features on the simulator → transaction-aggregates, point-in-time-features
- PaySim feature matrix read against its script → paysim-feature-matrix
- Elliptic node classification, graph propagation → elliptic-illicit-nodes, graph-propagation-lab
- AMLworld shapes as graph motifs → fraud-as-a-graph
- Simulated feedback loop → alert-feedback-selection-bias; label clocks as a pipeline → label-maturation
- IEEE-CIS (Vesta) set not covered (not in the dossier)
