# The canonical datasets — research brief (module 1 APPLICATION)

Lesson: `canonical-datasets` (module: problem, core, planned). NEW. Module-final application lesson (L16): reads five real artifacts against the loop of lesson 1 and the table of lesson 2.
Goal: Analyze what each public financial-crime dataset contains, how its labels were produced, and which of the detection loop's difficulties it hides.

## Sources
- ULB credit-card set: Dal Pozzolo 2015 Sec. VI and footnote 1 (Sept 2013, two days, 492 frauds of 284,807 = 0.172%, min β ≈ 0.00173; "one of the rare papers releasing a fraud dataset"); CS6890 PS4 (30 attributes: 28 PCA components, Time, Amount; log-scaling of Time and Amount); Lucas & Jurgovsky Sec. 1.1 (only public set reflecting real card payments; labels by human investigators after calling the holder); Handbook Ch2.4 (2 days, obfuscated — the only public data as of 2021).
- Handbook simulator: Ch3.2 in full (100×100 grid; customer mean_amount ~U(5,100), std = mean/2, mean_nb_tx_per_day ~U(0,4), Poisson counts, tx time ~N(noon, 20,000 s), amount ~N(mean, std) redrawn U(0, 2·mean) if negative; radius r = 5 ≈ 100 terminals per customer; 5,000 customers, 10,000 terminals, 183 days from 2018-04-01: 1,754,155 transactions, 14,681 frauds = 0.837%; three scenarios — amount > 220; two terminals/day compromised for 28 days; three customers/day for 14 days with a third of transactions ×5; counts 978 / 9,099 / 4,604 with overlaps; the first-month ramp-up artefact; "~100 lines of numpy/pandas with fixed seeds").
- PaySim: Lopez-Rojas et al. 2016 in full — aggregate replay (per day/hour count, mean, std per type: "day 1 hour 15, 8,703 PAYMENT, mean 180,000, std 15,000"), five types, MASON agents, 744 steps, PS41840 ~23M rows, Table 1 type mix (CASH-OUT 9.0M, PAYMENT 9.0M, TRANSFER 2.0M at mean 630,810), validation by SSE and overlay, NO fraud injected (future work). HKU A1 answer Part I for the Kaggle release's facts: 6,362,620 rows, 11 attributes, 0.129% fraud, fraud only in TRANSFER and CASH_OUT, uniform over steps.
- Elliptic: Weber et al. 2019 Sec. 2.1–2.2 (203,769 nodes, 234,355 edges, 166 features = 94 local + 72 one-hop aggregates, 49 time steps of ~2 weeks each with no cross-step edges, 2% illicit / 21% licit / rest unlabelled; label heuristics via entity categories; mixers ignored; full Bitcoin graph ~438M nodes); Fig. 1 class balance per step.
- AMLworld: Altman et al. 2023 Sec. 2–3.5, Table 1 (MLDP 2,340 tx at 3/5 laundering; AMLsim 1.32M at 1/762; AMLworld 180M at 1/807–1/1,750), Table 4 (HI/LI × S/M/L sizes and rates), Sec. 3.4 transitive taint and complete labels, Sec. 3.5 realism check vs Starnini (1 per 21,000 motifs), Table 8 (19,461 of 100,604 in patterns), Sec. 7 ethics (data released, generator withheld).
- Worldline private replays (Handbook Ch3 RWD, Ch4.5, Ch5 RWD, Ch7.5; Dal Pozzolo 2014 Table 3; Dal Pozzolo 2018 Table I; Jurgovsky Table 1; APATE Sec. 4): not public — the lesson lists what they add (volume, 0.25% fraud, label delay) and that the course quotes them as static results.
- IEEE-CIS: NOT OBTAINED (sources.yaml). State in one sentence that the Kaggle competition exists and the course does not use it until the material is staged.

## Key points
1. The reading frame: for each dataset — unit, size, positive rate, how labels were made, time axis, entity ids, what the loop's difficulties it preserves (delay? budget? drift? graph? adversary?). The lesson is the table filled with facts, each facts with its pointer.
2. ULB: real, two days, PCA'd — no entity, no history, no drift, no delay; labels near-complete; ideal for scorers (modules 2, 5), useless for features (module 3) and validation design (prequential needs weeks).
3. Simulator: everything the loop has except an adversary and realism — scripted fraud that a depth-2 tree reads off (amount > 220 → threshold 218.67 learned; Ch3), scenario 2 goes stale after 28 days (drift), scenario 3 needs customer-habit features; the overlap arithmetic (978 + 9,099 + 4,604 ≠ 14,681). It is the course's workbench (labs 1, 2, 3, 6; arms-race-replay; tra-exemption-engine).
4. PaySim: a replay of aggregate statistics, not of behaviour; the paper injects no fraud, so the Kaggle isFraud flag is a later addition the paper cannot be cited for; type mix; the HKU EDA facts (fraud only TRANSFER/CASH_OUT, uniform over steps) are generator artefacts a model will "learn".
5. Elliptic: a graph with no feature names, time steps that are disconnected snapshots, labels from entity heuristics, 77% unlabelled; the class balance per step; the dark-market shutdown lives here (module 6).
6. AMLworld: complete labels by transitive taint — what no bank has; realism calibrated on one real-bank motif count; 81% of laundering outside the eight patterns; generator withheld.
7. The departure column: what each dataset hides (delay, budget, adversary, label incompleteness, entity continuity) — the course states which lesson's claims cannot be tested on which set.

## Set pieces & gems
- The simulator's three scenarios as three unit tests for a detector (Handbook Ch3.2 gem).
- The overlap arithmetic 978 + 9,099 + 4,604 = 14,681 fails — a data-bookkeeping moment.
- PaySim's "day 1 hour 15: 8,703 PAYMENT at mean 180,000" calibration row — the generator replays aggregates.
- PaySim's published run is the lowest-SSE of several seeds — selection bias in a benchmark.
- AMLworld Table 1's scale ladder and the Starnini calibration (1 per 21,000 vs 1 per 21,440).
- Altman Sec. 7: card fraud has near ground truth; laundering has none.

## Pitfalls
- Do not run models here (modules 2–6 do); the application reads artifacts.
- Keep IEEE-CIS out of claims; flag it as missing material, do not describe its columns from memory.
- License facts are to be settled by the human (issue gate); state what each source says and no more.

## FIGURE PLAN
- draw: The five datasets as five cards in one grid (unit, rows, positive rate, labels from, time axis, entity ids) with the loop's five difficulties as columns ticked or struck — the lesson's table as a figure; key image.
- draw: `<FigureSequence>` (4 frames) of the simulator: (1) customers and terminals on the 100×100 grid with one customer's radius-5 circle, (2) a day's transactions drawn, (3) scenario 2 compromises two terminals for 28 days (amber), (4) scenario 3 inflates a customer's amounts ×5 for 14 days. Inspired by Handbook Ch3.2 figures (recreated from the description).
- draw: Daily counts over the simulator's 183 days — transactions/50, frauds, compromised cards — with the first-month ramp-up annotated as a windowing artefact. Computed from our own run of the simulator description.
- source: paysima-fig1-4-orig-vs-synthetic — stem `paysim-fidelity`; the reader must see the red original and blue dashed synthetic COUNT/SUM/AVG/STD overlays per type tracking each other with the busy first two weeks; centered, in the PaySim section (the paper's only fidelity evidence, measured data).
- source: antimoney-fig1-class-balance — stem `elliptic-class-balance`; the reader must see illicit share and node counts per time step across the 49 steps; float right beside the Elliptic paragraph.
- draw: AMLworld's transitive taint on a four-account chain ($100 → $50 → $25 → …) with every edge labelled laundering, beside a "real bank" copy where only the first edge is labelled — two panels joined by an arrow (Altman Sec. 3.4, recreated).

## EXERCISE PLAN
1. Warm-up: from the simulator's parameters compute the expected transactions per day (5,000 customers × mean of U(0,4)) and compare with the reported ~10,000/day; then the expected daily frauds from the three scenarios' rates.
2. Boundary probe: ULB's Time column is seconds from the first transaction over 48 hours — show that any "velocity" feature on it has at most two days of history and that a prequential fold with a 7-day delay is impossible; name what claim about delay the set cannot test.
3. Claim to refute: "PaySim's isFraud label marks behaviour the simulator modelled from real fraud." Refute from the 2016 paper's own scope statement and the HKU EDA (fraud uniform over steps), naming the generator fact that fails.
4. Research-shaped: reproduce the scenario-count overlap — generate the three scenario label columns on a small run of the simulator (or reason from the paper's counts) and compute how many frauds carry two labels.
5. Derivation: for Elliptic's temporal split (steps 1–34 train, 35–49 test) compute the number of illicit nodes in each half from Fig. 1's per-step fractions and the per-step counts, and state why a random split would leak.
6. FORWARD (E7): for each dataset write whether a "precision at k per day" can be computed at all (needs a day axis and ≥ k frauds per day to be meaningful) — the reader discovers the ULB set cannot support the metric the next lesson defines → lands on `alert-budget-metrics`.
7. Transfer: design the minimal public dataset that would preserve all five difficulties (fields, time span, label timestamps, entity ids, release constraints) and state which real constraint (privacy, ethics, the generator-withholding argument of Altman Sec. 7) blocks each field.

## ARC
- Inherits: the loop (fraud-detection-system), the typology table (financial-crime-typology), the budget arithmetic (economics-of-detection).
- Contributes: the workbench — which dataset tests which claim, and which difficulty each hides; the simulator as the course's running instrument.
- Hands off: the simulator and ULB to module 2's benchmark and lab; PaySim to module 3's application; Elliptic to module 6; AMLworld's incompleteness to label-maturation.
- Spine step 1: the detector inside the loop.

## APPLICATION (L16)
- Artifact: the five public datasets themselves (ULB 2013 on Kaggle, the handbook simulator's code and reference run, PaySim's Kaggle release and the 2016 paper, Elliptic on Kaggle, AMLworld on Kaggle) read against the loop.
- Module results used: the five-layer loop and its label clocks (lesson 1), the typology table (lesson 2), the base-rate funnel (lesson 3) — each dataset's positive rate placed in it.
- Departures from the idealisation: ULB has no entity or delay; the simulator's fraud is scripted and non-adaptive; PaySim replays aggregates and its fraud flag postdates the paper; Elliptic's snapshots are disconnected and 77% unlabelled; AMLworld's labels are complete where reality's are not. The lesson says which later claim each departure blocks.
